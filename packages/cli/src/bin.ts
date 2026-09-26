#!/usr/bin/env node
// livingdoc — CLI entry point.
import { check } from './index.js'

const [command, file] = process.argv.slice(2)

if (command !== 'check') {
  process.stderr.write('usage: livingdoc check [file.md]\n')
  process.exit(1)
}

try {
  process.exit(check(file))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`livingdoc: ${message}\n`)
  process.exit(1)
}
