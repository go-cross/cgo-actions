import { $ } from 'execa'
import { Engine, Input } from './types'

export function engineKey(engine: Engine) {
  return engine.targets.join(',')
}

export const TempBinName = 'go-cross-bin'

export function getTempBinPath(input: Input) {
  return (
    `${input.dir}/` +
    (input.target.includes('windows') ? `${TempBinName}.exe` : TempBinName)
  )
}

export const $$ = $({ stdio: 'inherit' })

export function arrMinus<T>(arr: T[], ...items: T[]) {
  return arr.filter(i => !items.includes(i))
}

export function mapRev(obj: Record<string, string>) {
  const rev = {} as Record<string, string>
  for (const [k, v] of Object.entries(obj)) {
    rev[v] = k
  }
  return rev
}
