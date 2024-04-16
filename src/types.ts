import { $$ } from './utils'
export { Context } from '@actions/github/lib/context'

export type CommonInput = {
  dir: string
  pkgs: string
  flags: string
  out_dir: string
  output: string
  $: typeof $$
}

export type Input = CommonInput & {
  target: string
}

export type Engine = {
  targets: string[]
  prepare?(input: Input): Promise<void>
  run(input: Input): Promise<string | void>
}
