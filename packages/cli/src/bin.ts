#!/usr/bin/env node
// livingdoc — CLI entry point.
import { generate } from './index.js'

const [command, file] = process.argv.slice(2)

if (command !== 'generate') {
  process.stderr.write('usage: livingdoc generate [file.md]\n')
  process.exit(1)
}

try {
  process.exit(generate(file))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`livingdoc: ${message}\n`)
  process.exit(1)
}
