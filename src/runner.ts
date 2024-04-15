import { Context, Input, Engine } from './types'
import * as core from '@actions/core'
import { engineKey } from './utils'

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
  private input!: Input
  private targets!: string[]
  private initInput(ctx: Context) {
    const dir = core.getInput('dir')
    const pkg = core.getInput('package')
    const flags = core.getInput('flags')
    const output = core.getInput('output')
    this.input = {
      dir,
      pkg,
      flags,
      output
    }
    this.targets = core
      .getInput('targets')
      .split(',')
      .map(t => t.trim())
    const supportedTargets = Array.from(engines.keys())
    for (const target of this.targets) {
      if (!supportedTargets.includes(target)) {
        throw new Error(`Unsupported target: ${target}`)
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
        await engine.prepare(this.input)
        prepared.add(engineKey(engine))
      }
      await engine.run(this.input)
    }
  }
}
