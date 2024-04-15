export { Context } from '@actions/github/lib/context'

export type Input = {
  dir: string
  pkg: string
  flags: string
  output: string
}

export type Engine = {
  targets: string[]
  prepare?(input: Input): Promise<void>
  run(input: Input): Promise<void>
}
