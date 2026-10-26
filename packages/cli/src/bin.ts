#!/usr/bin/env node
// livingdoc — CLI entry point.
import { relative } from 'node:path'
import { formatError, type DomainError } from './errors.js'
import { generate, init } from './index.js'

const usage = 'usage: livingdoc init\n       livingdoc generate [file.md]\n'

const [command, file] = process.argv.slice(2)

const fail = (error: DomainError): never => {
  process.stderr.write(`livingdoc: ${formatError(error)}\n`)
  process.exit(1)
}

if (command === 'init') {
  if (file !== undefined) {
    process.stderr.write(usage)
    process.exit(1)
  }
  const result = init()
  if (!result.ok) {
    fail(result.error)
  } else {
    for (const report of result.value) {
      process.stdout.write(
        `${report.state} ${relative(process.cwd(), report.path)}\n`,
      )
    }
  }
  process.exit(0)
}

if (command !== 'generate') {
  process.stderr.write(usage)
  process.exit(1)
}

const result = generate(file)
if (!result.ok) fail(result.error)

process.exit(0)
