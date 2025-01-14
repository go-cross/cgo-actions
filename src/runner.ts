import {
  Context,
  CommonInput,
  Engine,
  Input,
  Flags,
  CommonInputWithTarget
} from './types'
import * as core from '@actions/core'
import { $$, calFlags, engineKey, getTempBinPath } from './utils'
import fs from 'fs'
import pm from 'picomatch'
import os from 'os'
import { $ } from 'execa'

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

    const output = core.getInput('output')
    const out_dir = core.getInput('out-dir')
    this.input = {
      dir,
      pkgs,
      output,
      out_dir,
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
      const tmpInput = {
        ...this.input,
        target
      }
      const flags = await this.getFlags(tmpInput)
      core.info(`Flags json: ${JSON.stringify(flags, null, 2)}...`)
      core.info(`Flags: ${calFlags(flags)}...`)
      const input = {
        ...tmpInput,
        flags
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

  private async getFlags(input: CommonInputWithTarget): Promise<Flags> {
    const flags = core.getInput('flags')
    const extra_flags_map = {} as Flags['extra']
    const magicMap = await this.getMagicMap(input)
    const x_flags = core
      .getInput('x-flags')
      .split('\n')
      .map(x => x.trim())
      .filter(x => x)
      .map(x => {
        for (const [magic, target] of Object.entries(magicMap)) {
          const key = `$${magic}`
          x = x.replaceAll(key, target)
        }
        return x
      })
      .map(x => `-X '${x}'`)
    extra_flags_map['-ldflags'] = {
      values: x_flags,
      separator: ' ',
      connector: '=',
      quote: ''
    }
    return {
      flags,
      extra: extra_flags_map
    }
  }

  private async setOutput() {
    const files = fs.readdirSync(this.input.out_dir)
    core.setOutput('files', files.join('\n'))
  }

  private async getOutput(input: Input, engine: Engine): Promise<string> {
    const magicMap = (await this.getMagicMap(input)) as Record<
      string,
      string | ((input: Input) => string)
    >
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

  private async getMagicMap(input: CommonInputWithTarget) {
    const goVersion = (await $`go version`).stdout.replace('go version ', '')
    return {
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      target: input.target,
      sha: this.ctx.sha,
      short_sha: this.ctx.sha.slice(0, 7),
      pr: this.ctx.issue.number?.toString() ?? '',
      ext: input.target.includes('windows') ? '.exe' : '',
      tag: this.ctx.ref.replace('refs/tags/', ''),
      hostname: os.hostname(),
      username: os.userInfo().username,
      built_on: `${os.userInfo().username}@${os.hostname()}`,
      built_at: new Date().toLocaleString(),
      git_author: (
        await $`git show -s ${"--format='%an <%ae>'"}`
      ).stdout.replaceAll("'", ''),
      git_commit: (await $`git show -s ${"--format='%H'"}`).stdout.replaceAll(
        "'",
        ''
      ),
      go_version: goVersion
    }
  }
}
