#!/usr/bin/env node
// livingdoc — CLI entry point.
import { formatError } from './errors.js'
import { generate, init } from './index.js'

const [command, file] = process.argv.slice(2)

if (command === 'init') {
  const result = init()
  if (!result.ok) {
    process.stderr.write(`livingdoc: ${formatError(result.error)}\n`)
    process.exit(1)
  }
  process.exit(0)
}

if (command !== 'generate') {
  process.stderr.write(
    'usage: livingdoc init\n       livingdoc generate [file.md]\n',
  )
  process.exit(1)
}

const result = generate(file)
if (!result.ok) {
  process.stderr.write(`livingdoc: ${formatError(result.error)}\n`)
  process.exit(1)
}

process.exit(0)
