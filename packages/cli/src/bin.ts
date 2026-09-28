#!/usr/bin/env node
// livingdoc — CLI entry point.
import { ConfigError } from './config.js'
import { generate } from './index.js'

const [command, file] = process.argv.slice(2)

if (command !== 'generate') {
  process.stderr.write('usage: livingdoc generate [file.md]\n')
  process.exit(1)
}

try {
  process.exit(generate(file))
} catch (error) {
  if (error instanceof ConfigError) {
    process.stderr.write(`livingdoc: ${error.message}\n`)
    process.exit(1)
  }
  throw error
}
