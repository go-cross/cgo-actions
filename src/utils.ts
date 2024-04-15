import { $ } from 'execa'
import { Engine } from './types'

export function engineKey(engine: Engine) {
  return engine.targets.join(',')
}

export const TempBinDir = 'bin_temp'
export const TempBinName = 'go-cross-cgo'
export const TempBinPath = `${TempBinDir}/${TempBinName}`

export function getTempBinPath(target: string) {
  return target.includes('windows') ? `${TempBinPath}.exe` : TempBinPath
}

export const $$ = $({ stdio: 'inherit' })
