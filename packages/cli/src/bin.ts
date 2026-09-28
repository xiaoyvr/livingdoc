#!/usr/bin/env node
// livingdoc — CLI entry point.
import { formatError } from './errors.js'
import { generate } from './index.js'

const [command, file] = process.argv.slice(2)

if (command !== 'generate') {
  process.stderr.write('usage: livingdoc generate [file.md]\n')
  process.exit(1)
}

const result = generate(file)
if (!result.ok) {
  process.stderr.write(`livingdoc: ${formatError(result.error)}\n`)
  process.exit(1)
}

process.exit(0)
