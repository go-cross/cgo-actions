export { Context } from '@actions/github/lib/context'

export type CommonInput = {
  dir: string
  pkg: string
  flags: string
  out_dir: string
  output: string
}

export type Input = CommonInput & {
  target: string
}

export type Engine = {
  targets: string[]
  prepare?(input: Input): Promise<void>
  run(input: Input): Promise<string | void>
}

