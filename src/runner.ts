import { Context, CommonInput, Engine, Input } from './types'
import * as core from '@actions/core'
import { $$, engineKey, getTempBinPath } from './utils'
import fs from 'fs'
import pm from 'picomatch'

const engines = new Map<string, Engine>()
const prepared = new Set<string>()

export function registerEngine(engine: Engine) {
  for (const target of engine.targets) {
    engines.set(target, engine)
  }
}

export function getSupportedTargets(): string[] {
  return Array.from(engines.keys())
}

export class Runner {
  public constructor(readonly ctx: Context) {
    this.initInput(ctx)
    core.info(`Making necessary directories...`)
    for (const dir of [this.input.out_dir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }
  private input!: CommonInput
  private targets!: string[]
  private initInput(ctx: Context) {
    const dir = core.getInput('dir')
    const pkgs = core.getInput('packages')
    const flags = core.getInput('flags')
    const output = core.getInput('output')
    const out_dir = core.getInput('out-dir')
    const musl_target_format = core.getInput('musl-target-format')
    this.input = {
      dir,
      pkgs,
      flags,
      output,
      out_dir,
      musl_target_format,
      $: $$({
        cwd: dir
      })
    }
    core.info(`Input: ${JSON.stringify(this.input)}...`)
    const targets = core
      .getInput('targets')
      .split(',')
      .map(t => t.trim())
    this.targets = []
    const supportedTargets = getSupportedTargets()
    core.debug(`Supported targets: \n${supportedTargets.join('\n')}...`)
    for (const target of supportedTargets) {
      for (const pattern of targets) {
        if (pm(pattern)(target)) {
          this.targets.push(target)
          break
        }
      }
    }
    core.info(`Targets: \n${this.targets.join('\n')}...`)
  }

  public async run(): Promise<void> {
    for (const target of this.targets) {
      const engine = engines.get(target)
      if (!engine) {
        throw new Error(`Engine not found: ${target}!`)
      }
      const input = {
        ...this.input,
        target
      }
      if (engine.prepare && !prepared.has(engineKey(engine))) {
        core.info(`Preparing engine: ${engineKey(engine)}`)
        await engine.prepare(input)
        prepared.add(engineKey(engine))
      }
      core.info(`Compiling target: ${target}...`)
      const out_file = (await engine.run(input)) ?? getTempBinPath(input)
      core.info(`Output file: ${out_file}...`)
      const output = await this.getOutput(input, engine)
      core.info(`Renaming to: ${output}...`)
      const output_full = `${this.input.out_dir}/${output}`
      fs.renameSync(out_file, output_full)
    }
    await this.setOutput()
  }

  private async setOutput() {
    const files = fs.readdirSync(this.input.out_dir)
    core.setOutput('files', files.join('\n'))
  }

  private async getOutput(input: Input, engine: Engine): Promise<string> {
    const magicMap = {
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      target: input.target,
      sha: this.ctx.sha,
      short_sha: this.ctx.sha.slice(0, 7),
      pr: this.ctx.issue.number?.toString() ?? '',
      ext: input.target.includes('windows') ? '.exe' : '',
      tag: this.ctx.ref.replace('refs/tags/', '')
    } as Record<string, string | ((input: Input) => string)>
    if (engine.on_target_rename) {
      magicMap.target = await engine.on_target_rename(input)
    }
    let output = input.output
    for (const [magic, target] of Object.entries(magicMap)) {
      const key = `$${magic}`
      const value = typeof target === 'string' ? target : target(input)
      core.info(`Replacing ${key} with ${value}...`)
      output = output.replaceAll(key, value)
    }
    return output
  }
}
