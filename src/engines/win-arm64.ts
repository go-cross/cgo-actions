import { $$, TempBinName } from '../utils'
import { registerEngine } from '../runner'
import fs from 'fs'

const zcc = `#!/bin/sh
zig cc -target aarch64-windows-gnu $@
`

const zcxx = `#!/bin/sh
zig c++ -target aarch64-windows-gnu $@
`

registerEngine({
  targets: ['windows-arm64'],
  async prepare(input) {
    await $$`sudo snap install zig --classic --beta`
    if (!fs.existsSync('/usr/local/bin')) {
      fs.mkdirSync('/usr/local/bin', { recursive: true })
    }
    fs.writeFileSync('/usr/local/bin/zcc', zcc)
    fs.writeFileSync('/usr/local/bin/z++', zcxx)
    await $$`chmod +x /usr/local/bin/zcc /usr/local/bin/z++`
  },
  async run(input) {
    await input.$({
      env: {
        CGO_ENABLED: '1',
        GOOS: 'windows',
        GOARCH: 'arm64',
        CC: 'zcc',
        CXX: 'z++'
      }
    })`go build -o ${TempBinName} ${input.flags} ${input.pkgs}`
  }
})
