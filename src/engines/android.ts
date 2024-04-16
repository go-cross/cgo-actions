import { $$, TempBinName } from '../utils'
import { registerEngine } from '../runner'
import fs from 'fs'

const arches = {
  amd64: {
    cc: 'x86_64-linux-android24-clang'
  },
  arm64: {
    cc: 'aarch64-linux-android24-clang'
  },
  386: {
    cc: 'i686-linux-android24-clang'
  },
  arm: {
    cc: 'armv7a-linux-androideabi24-clang'
  }
} as Record<string, { cc: string }>

registerEngine({
  targets: Object.keys(arches).map(arch => `android-${arch}`),
  async prepare(input) {
    await $$`wget https://dl.google.com/android/repository/android-ndk-r26b-linux.zip`
    await $$`unzip android-ndk-r26b-linux.zip`
    fs.rmSync('android-ndk-r26b-linux.zip')
  },
  async run(input) {
    const arch = input.target.split('-')[1]
    await input.$({
      env: {
        CGO_ENABLED: '1',
        GOOS: 'android',
        GOARCH: arch,
        CC: `${process.cwd()}/android-ndk-r26b/toolchains/llvm/prebuilt/linux-x86_64/bin/${arches[arch].cc}`
      }
    })`go build -o ${TempBinName} ${input.flags} ${input.pkgs}`
  }
})
