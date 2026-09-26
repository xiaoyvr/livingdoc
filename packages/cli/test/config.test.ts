import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { check } from '@livingdoc/cli'

const config = `livingdocs = "docs"
backend = "tests"
`

const document = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code {{ "SAVE10" }} is applied
`

const backend = `export const bindings = {
  "walking-skeleton": {
    params: ["code"],
    run({ code }) {
      return { result: code }
    },
  },
}
`

describe('livingdoc configuration', () => {
  let root: string
  let fixture: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'livingdoc-config-'))
    mkdirSync(join(root, 'docs'))
    mkdirSync(join(root, 'tests'))
    writeFileSync(join(root, 'livingdoc.toml'), config)
    fixture = join(root, 'docs', 'fixture.md')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('generates the check into the backend folder from the config', () => {
    writeFileSync(fixture, document)
    writeFileSync(join(root, 'tests', 'livingdoc.backend.ts'), backend)

    expect(check(fixture)).toBe(0)
    expect(existsSync(join(root, 'tests', 'fixture.test.ts'))).toBe(true)
  })
})
