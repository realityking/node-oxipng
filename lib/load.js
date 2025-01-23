'use strict'

const { existsSync } = require('fs')
const { join } = require('path')
const os = require('os')

// Workaround to fix webpack's build warnings: 'the request of a dependency is an expression'
const runtimeRequire = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require // eslint-disable-line

let nativeBinding = null
let localFileExisted = false
let loadError = null

const arch = process.env.npm_config_arch || os.arch()
const platform = process.env.npm_config_platform || os.platform()
const libc = process.env.LIBC || (isAlpine(platform) ? 'musl' : 'glibc')

module.exports = load

function load (dir) {
  const modulePath = resolve(join(dir, 'prebuilds'))
  if (!modulePath) {
    throw new Error('Failed to load native binding')
  }
  try {
    if (existsSync(modulePath)) {
      nativeBinding = runtimeRequire(modulePath)
    }
  } catch (e) {
    loadError = e
  }

  if (!nativeBinding) {
    if (loadError) {
      throw loadError
    }
    throw new Error('Failed to load native binding')
  }

  return nativeBinding
}

function resolve (dir) {
  switch (platform) {
    case 'android':
      switch (arch) {
        case 'arm64':
          return join(dir, 'node-oxipng.android-arm64.node')
        case 'arm':
          return join(dir, 'node-oxipng.android-arm-eabi.node')
        default:
          throw new Error(`Unsupported architecture on Android ${arch}`)
      }
    case 'win32':
      switch (arch) {
        case 'x64':
          return join(dir, 'node-oxipng.win32-x64-msvc.node')
        case 'ia32':
          return join(dir, 'node-oxipng.win32-ia32-msvc.node')
        case 'arm64':
          return join(dir, 'node-oxipng.win32-arm64-msvc.node')
        default:
          throw new Error(`Unsupported architecture on Windows: ${arch}`)
      }
    case 'darwin':
      localFileExisted = existsSync(join(dir, 'node-oxipng.darwin-universal.node'))
      if (localFileExisted) {
        return join(dir, 'node-oxipng.darwin-universal.node')
      }

      switch (arch) {
        case 'x64':
          return join(dir, 'node-oxipng.darwin-x64.node')
        case 'arm64':
          return join(dir, 'node-oxipng.darwin-arm64.node')
        default:
          throw new Error(`Unsupported architecture on macOS: ${arch}`)
      }
    case 'freebsd':
      if (arch !== 'x64') {
        throw new Error(`Unsupported architecture on FreeBSD: ${arch}`)
      }
      return join(dir, 'node-oxipng.freebsd-x64.node')
    case 'linux':
      switch (arch) {
        case 'x64':
          if (libc === 'musl') {
            return join(dir, 'node-oxipng.linux-x64-musl.node')
          } else {
            return join(dir, 'node-oxipng.linux-x64-gnu.node')
          }
        case 'arm64':
          if (libc === 'musl') {
            return join(dir, 'node-oxipng.linux-arm64-musl.node')
          } else {
            return join(dir, 'node-oxipng.linux-arm64-gnu.node')
          }
        case 'arm':
          if (libc === 'musl') {
            return join(dir, 'node-oxipng.linux-arm-musleabihf.node')
          } else {
            return join(dir, 'node-oxipng.linux-arm-gnueabihf.node')
          }
        case 'riscv64':
          if (libc === 'musl') {
            return join(dir, 'node-oxipng.linux-riscv64-musl.node')
          } else {
            return join(dir, 'node-oxipng.linux-riscv64-gnu.node')
          }
        case 's390x':
          return join(dir, 'node-oxipng.linux-s390x-gnu.node')
        default:
          throw new Error(`Unsupported architecture on Linux: ${arch}`)
      }
    default:
      throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
  }
}

function isAlpine (platform) {
  return platform === 'linux' && existsSync('/etc/alpine-release')
}
