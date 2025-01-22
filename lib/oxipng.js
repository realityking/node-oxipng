'use strict'

const { dirname } = require('path')
const binding = require('./load.js')(dirname(__dirname))

function optimizeOxipngSync (input, options = {}) {
  return binding.optimizeOxipngSync(input, options)
}

async function optimizeOxipng (input, options = {}) {
  return binding.optimizeOxipng(input, options)
}

module.exports = {
  optimizeOxipng,
  optimizeOxipngSync
}
