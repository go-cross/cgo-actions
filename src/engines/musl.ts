import { $$, TempBinName, arrMinus, mapRev } from '../utils'
import { registerEngine } from '../runner'
import * as core from '@actions/core'
import { rmSync } from 'fs'

// const toolchains = {
//   // arm
//   // armeb-linux-musleabi-cross armeb-linux-musleabihf-cross
//   'linux-arm64-musl': {
//     file: 'aarch64-linux-musl-cross'
//   },
//   'linux-arm-musleabi': {
//     file: 'arm-linux-musleabi-cross'
//   },
//   'linux-arm-musleabihf': {
//     file: 'arm-linux-musleabihf-cross'
//   },
//   'linux-armel-musleabi': {
//     file: 'armel-linux-musleabi-cross'
//   },
//   'linux-armel-musleabihf': {
//     file: 'armel-linux-musleabihf-cross'
//   },
//   'linux-armv5l-musleabi': {
//     file: 'armv5l-linux-musleabi-cross'
//   },
//   'linux-armv5l-musleabihf': {
//     file: 'armv5l-linux-musleabihf-cross'
//   },
//   'linux-armv6-musleabi': {
//     file: 'armv6-linux-musleabi-cross'
//   },
//   'linux-armv6-musleabihf': {
//     file: 'armv6-linux-musleabihf-cross'
//   },
//   'linux-armv7l-musleabihf': {
//     file: 'armv7l-linux-musleabihf-cross'
//   },
//   'linux-armv7m-musleabi': {
//     file: 'armv7m-linux-musleabi-cross'
//   },
//   'linux-armv7r-musleabihf': {
//     file: 'armv7r-linux-musleabihf-cross'
//   },
//   // non-arm
//   'linux-mips-musl': {
//     file: 'mips-linux-musl-cross'
//   },
//   'linux-mips64-musl': {
//     file: 'mips64-linux-musl-cross'
//   },
//   'linux-mips64el-musl': {
//     file: 'mips64el-linux-musl-cross'
//   },
//   'linux-mipsel-musl': {
//     file: 'mipsel-linux-musl-cross'
//   },
//   'linux-ppc64le-musl': {
//     file: 'powerpc64le-linux-musl-cross'
//   },
//   'linux-s390x-musl': {
//     file: 's390x-linux-musl-cross'
//   },
//   'linux-amd64-musl': {
//     file: 'x86_64-linux-musl-cross'
//   }
// } as Record<string, { file: string }>

const all_files = [
  'aarch64-linux-musl-cross',
  'aarch64_be-linux-musl-cross',
  'arm-linux-musleabi-cross',
  'arm-linux-musleabihf-cross',
  'armeb-linux-musleabi-cross',
  'armeb-linux-musleabihf-cross',
  'armel-linux-musleabi-cross',
  'armel-linux-musleabihf-cross',
  'armv5l-linux-musleabi-cross',
  'armv5l-linux-musleabihf-cross',
  'armv6-linux-musleabi-cross',
  'armv6-linux-musleabihf-cross',
  'armv7l-linux-musleabihf-cross',
  'armv7m-linux-musleabi-cross',
  'armv7r-linux-musleabihf-cross',
  'i486-linux-musl-cross',
  'i686-linux-musl-cross',
  'i686-w64-mingw32-cross',
  'm68k-linux-musl-cross',
  'microblaze-linux-musl-cross',
  'microblazeel-linux-musl-cross',
  'mips-linux-musl-cross',
  'mips-linux-musln32sf-cross',
  'mips-linux-muslsf-cross',
  'mips64-linux-musl-cross',
  'mips64-linux-musln32-cross',
  'mips64-linux-musln32sf-cross',
  'mips64el-linux-musl-cross',
  'mips64el-linux-musln32-cross',
  'mips64el-linux-musln32sf-cross',
  'mipsel-linux-musl-cross',
  'mipsel-linux-musln32-cross',
  'mipsel-linux-musln32sf-cross',
  'mipsel-linux-muslsf-cross',
  'or1k-linux-musl-cross',
  'powerpc-linux-musl-cross',
  'powerpc-linux-muslsf-cross',
  'powerpc64-linux-musl-cross',
  'powerpc64le-linux-musl-cross',
  'powerpcle-linux-musl-cross',
  'powerpcle-linux-muslsf-cross',
  'riscv32-linux-musl-cross',
  'riscv64-linux-musl-cross',
  's390x-linux-musl-cross',
  'sh2-linux-musl-cross',
  'sh2-linux-muslfdpic-cross',
  'sh2eb-linux-musl-cross',
  'sh2eb-linux-muslfdpic-cross',
  'sh4-linux-musl-cross',
  'sh4eb-linux-musl-cross',
  'x86_64-linux-musl-cross',
  'x86_64-linux-muslx32-cross',
  'x86_64-w64-mingw32-cross'
]

const val_files = [
  'aarch64-linux-musl-cross',
  'arm-linux-musleabi-cross',
  'arm-linux-musleabihf-cross',
  'armel-linux-musleabi-cross',
  'armel-linux-musleabihf-cross',
  'armv5l-linux-musleabi-cross',
  'armv5l-linux-musleabihf-cross',
  'armv6-linux-musleabi-cross',
  'armv6-linux-musleabihf-cross',
  'armv7l-linux-musleabihf-cross',
  'armv7m-linux-musleabi-cross',
  'armv7r-linux-musleabihf-cross',
  'mips-linux-musl-cross',
  'mips64-linux-musl-cross',
  'mips64el-linux-musl-cross',
  'mipsel-linux-musl-cross',
  'powerpc64-linux-musl-cross',
  'powerpc64le-linux-musl-cross',
  'riscv64-linux-musl-cross',
  's390x-linux-musl-cross',
  'x86_64-linux-musl-cross'
]

const exp_files = arrMinus(all_files, ...val_files)

const archMap = {
  x86_64: 'amd64',
  aarch64: 'arm64',
  mips64el: 'mips64le',
  mipsel: 'mipsle',
  powerpc64: 'ppc64',
  powerpc64le: 'ppc64le'
} as Record<string, string>
const archMapRev = mapRev(archMap)

const osMap = {
  w64: 'windows'
} as Record<string, string>
const osMapRev = mapRev(osMap)

function fileToTarget(file: string) {
  let name = file.replace('-cross', '')
  const [arch, os, musl] = name.split('-')
  return `${osMap[os] ?? os}-${archMap[arch] ?? arch}-${musl}`
}

function targetToFile(target: string) {
  const [os, arch, musl] = target.split('-')
  return `${archMapRev[arch] ?? arch}-${osMapRev[os] ?? os}-${musl}-cross`
}

function engineGen(files: string[]) {
  registerEngine({
    targets: files.map(fileToTarget),
    async run(input) {
      const base = 'https://musl.cc'
      const file = targetToFile(input.target)
      const filename = file + '.tgz'
      const url = `${base}/${filename}`
      await $$`curl -L -o ${filename} ${url}`
      await $$`sudo tar xf ${filename} --strip-components 1 -C /usr/local`
      rmSync(filename)
      const [os, arch] = input.target.split('-')
      const env = {
        CGO_ENABLED: '1',
        GOOS: os,
        GOARCH: arch,
        CC: file.replace('-cross', '-gcc')
        // GOARM: getArmVersion(arch)
      } as Record<string, string>
      if (file.includes('arm')) {
        env.GOARCH = 'arm'
      }
      if (arch.includes('armv')) {
        env['GOARM'] = arch.split('armv')[1][0]
      }
      core.info(`Building with env:\n${JSON.stringify(env, null, 2)}...`)
      await input.$({
        env: env
      })`go build -o ${TempBinName} ${input.flags} ${input.pkgs}`
    }
  })
}

engineGen(val_files)
