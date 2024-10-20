import { $$, TempBinName } from '../utils'
import { registerEngine } from '../runner'
import fs from 'fs'

const arches = {
  amd64: {
    os_arch: 'amd64',
    target: 'x86_64-unknown-freebsd14.1'
  },
  arm64: {
    os_arch: 'arm64',
    target: 'aarch64-unknown-freebsd14.1'
  },
  386: {
    os_arch: 'i386',
    target: 'i386-unknown-freebsd14.1'
  }
} as Record<string, { os_arch: string; target: string }>

registerEngine({
  targets: Object.keys(arches).map(arch => `freebsd-${arch}`),
  // async prepare(input) {},
  async run(input) {
    const arch = input.target.split('-')[1]
    const os_arch = arches[arch].os_arch
    const target = arches[arch].target
    await $$`wget -q https://download.freebsd.org/releases/${os_arch}/14.1-RELEASE/base.txz`
    await $$`sudo tar -xf ./base.txz -C ${process.cwd()}/${os_arch}`
    fs.rmSync('base.txz')
    await input.$({
      env: {
        CGO_ENABLED: '1',
        GOOS: 'freebsd',
        GOARCH: arch,
        CGO_LDFLAGS: '-fuse-ld=lld',
        CC: `clang --target=${target} --sysroot=${process.cwd()}/${os_arch}`
      }
    })`go build -o ${TempBinName} ${input.flags} ${input.pkgs}`
  }
})
