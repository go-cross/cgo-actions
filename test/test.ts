import pm from 'picomatch'
import '../src/engines/all'

import { getSupportedTargets } from '../src/runner'

// const pattern = '!(*musl*|*windows-arm64*)'
const pattern = 'linux-!(arm*)-musl*'
const targets = getSupportedTargets()

for (const target of targets) {
  const isMatch = pm(pattern)
  console.log(target, isMatch(target))
}
