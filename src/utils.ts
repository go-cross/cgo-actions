import { Engine } from './types'

export function engineKey(engine: Engine) {
  return engine.targets.join(',')
}
