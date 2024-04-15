import { $ } from 'execa'
import { Engine, Input } from './types'

export function engineKey(engine: Engine) {
  return engine.targets.join(',')
}

export const TempBinDir = 'bin_temp'
export const TempBinName = 'go-cross-bin'
export const TempBinPath = `${TempBinDir}/${TempBinName}`

export function getTempBinPath(input: Input) {
  return `${input.dir}/` + input.target.includes('windows')
    ? `${TempBinPath}.exe`
    : TempBinPath
}

export const $$ = $({ stdio: 'inherit' })
