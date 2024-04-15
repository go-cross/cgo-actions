import { Context, CommonInput, Engine, Input } from './types'
import * as core from '@actions/core'
import { engineKey, getTempBinPath } from './utils'
import { renameSync } from 'fs'
import { minimatch } from 'minimatch'

const engines = new Map<string, Engine>()
const prepared = new Set<string>()

export function registerEngine(engine: Engine) {
  for (const target of engine.targets) {
    engines.set(target, engine)
  }
}

export class Runner {
  public constructor(readonly ctx: Context) {
    this.initInput(ctx)
  }
  private input!: CommonInput
  private targets!: string[]
  private initInput(ctx: Context) {
    const dir = core.getInput('dir')
    const pkg = core.getInput('package')
    const flags = core.getInput('flags')
    const output = core.getInput('output')
    const out_dir = core.getInput('out-dir')
    this.input = {
      dir,
      pkg,
      flags,
      output,
      out_dir
    }
    const targets = core
      .getInput('targets')
      .split(',')
      .map(t => t.trim())
    this.targets = []
    const supportedTargets = Array.from(engines.keys())
    for (const target of supportedTargets) {
      let match = false
      for (const pattern of targets) {
        if (minimatch(target, pattern)) {
          match = true
          break
        }
      }
      if (match) {
        this.targets.push(target)
      }
    }
  }

  public async run(): Promise<void> {
    for (const target of this.targets) {
      const engine = engines.get(target)
      if (!engine) {
        throw new Error(`Engine not found: ${target}`)
      }
      if (engine.prepare && !prepared.has(engineKey(engine))) {
        await engine.prepare({
          ...this.input,
          target
        })
        prepared.add(engineKey(engine))
      }
      const out_file =
        (await engine.run({
          ...this.input,
          target
        })) ?? getTempBinPath(target)
      renameSync(
        out_file,
        `${this.input.out_dir}/${await this.getOutput({ ...this.input, target })}`
      )
    }
  }

  private async getOutput(input: Input): Promise<string> {
    const magicMap = {
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      target: input.target,
      sha: this.ctx.sha,
      short_sha: this.ctx.sha.slice(0, 7),
      pr: this.ctx.issue.number.toString(),
    } as Record<string, string | ((input: Input) => string)>
    let output = input.output
    for (const [magic, target] of Object.entries(magicMap)) {
      const key = `$${magic}`
      if (output.includes(key)) {
        output = output.replace(
          key,
          typeof target === 'string' ? target : target(input)
        )
      }
    }
    return output
  }
}
