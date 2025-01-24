'use strict'

const { readFile } = require('fs/promises')
const path = require('path')

const test = require('ava')
const isPng = require('is-png')
const sharp = require('sharp')

const { optimizeOxipng, optimizeOxipngSync } = require('../lib/oxipng')

test('sync: optimize a PNG', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(buf)

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('sync: optimize a PNG with optimization level 0', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(buf, { optimizationLeveL: 0 })

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('sync: optimize a PNG with max optimizations', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(buf, { optimizationMax: true })

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('sync: add interlacing to a PNG', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/large-transparent.png'))
  const originalImage = sharp(buf)
  const originalMetadata = await originalImage.metadata()
  t.false(originalMetadata.isProgressive)

  const data = optimizeOxipngSync(buf, { interlace: 'apply', force: true })

  t.true(isPng(data))

  const compressedImage = sharp(data)
  const compressedMetadata = await compressedImage.metadata()

  t.true(compressedMetadata.isProgressive)

  // interlaced PNGs are generally larger
  t.true(data.length > buf.length)
})

test('sync: throws error for incorrect interlacing parameter', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/large-transparent.png'))
  t.throws(() => {
    optimizeOxipngSync(buf, { interlace: 'fake' })
  }, {
    code: 'InvalidArg',
    message: 'value `"fake"` does not match any variant of enum `InterlaceMode` on OxipngOptions.interlace'
  })
})

test('sync: optimize a PNG with a Uint8Array', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('sync: accepts empty options object', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(buf, {})

  t.true(isPng(data))
})

test('sync: throws error if input is not a Uint8Array', t => {
  t.throws(() => {
    optimizeOxipngSync('nope')
  }, {
    code: 'InvalidArg',
    message: 'Failed to create reference from Buffer'
  })
})

test('sync: throws error on non-PNG file', async t => {
  const buf = await readFile(__filename)
  t.throws(() => {
    optimizeOxipngSync(buf)
  }, {
    code: 'GenericFailure',
    message: 'Invalid header detected; Not a PNG file'
  })
})

test('sync: throws error if option value has wrong type', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  t.throws(() => {
    optimizeOxipngSync(buf, { optimizationMax: 123 })
  }, {
    code: 'BooleanExpected',
    message: 'Failed to convert napi value into rust type `bool` on OxipngOptions.optimizationMax'
  })
})

test('async: optimize a PNG', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = await optimizeOxipng(buf)

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('async: optimize a PNG with a Uint8Array', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = await optimizeOxipng(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('async: throws error if input is not a Uint8Array', async t => {
  await t.throwsAsync(optimizeOxipng('nope'), {
    code: 'InvalidArg',
    message: 'Failed to create reference from Buffer'
  })
})

test('async: throws error on non-PNG file', async t => {
  const buf = await readFile(__filename)
  await t.throwsAsync(optimizeOxipng(buf), {
    code: 'GenericFailure',
    message: 'Invalid header detected; Not a PNG file'
  })
})

test('async: throws error if option value has wrong type', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  await t.throwsAsync(optimizeOxipng(buf, { optimizationMax: 123 }), {
    code: 'BooleanExpected',
    message: 'Failed to convert napi value into rust type `bool` on OxipngOptions.optimizationMax'
  })
})

test('async: keep exif metadata when requested', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/exif2c08.png'))
  const originalImage = sharp(buf)
  const originalMetadata = await originalImage.metadata()

  t.not(originalMetadata.exif, undefined)

  const compressedData = await optimizeOxipng(buf, { keepChunks: ['display'] })
  const compressedImage = sharp(compressedData)
  const compressedMetadata = await compressedImage.metadata()
  t.is(compressedMetadata.exif, undefined)

  const keepChunksData = await optimizeOxipng(buf, { keepChunks: ['display', 'eXIf'] })
  const keepChunksImage = sharp(keepChunksData)
  const keepChunksMetadata = await keepChunksImage.metadata()

  t.not(keepChunksMetadata.exif, undefined)
  t.deepEqual(keepChunksMetadata.exif, originalMetadata.exif)
})
