import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import test from 'ava'
import isPng from 'is-png'

import { optimizeOxipng, optimizeOxipngSync } from 'node-oxipng'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('esm - sync: optimize a PNG', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = optimizeOxipngSync(buf)

  t.true(data.length < buf.length)
  t.true(isPng(data))
})

test('esm - async: optimize a PNG', async t => {
  const buf = await readFile(path.join(__dirname, 'fixtures/test.png'))
  const data = await optimizeOxipng(buf)

  t.true(data.length < buf.length)
  t.true(isPng(data))
})
