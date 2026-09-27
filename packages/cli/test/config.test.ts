import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generate } from '@livingdoc/cli'

const config = `livingdocs = "docs"
backend = "tests"
`

const document = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied
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

    expect(generate(fixture)).toBe(0)
    expect(existsSync(join(root, 'tests', 'fixture.test.ts'))).toBe(true)
  })

  it('reports a missing backend folder', () => {
    writeFileSync(fixture, document)
    rmSync(join(root, 'tests'), { recursive: true, force: true })

    expect(() => generate(fixture)).toThrow(/backend folder not found/)
  })

  it('reports a missing livingdocs folder', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "missing"\nbackend = "tests"\n`,
    )

    expect(() => generate(fixture)).toThrow(/livingdocs folder not found/)
  })

  it('rejects an absolute folder in the config', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\nbackend = "${join(root, 'tests')}"\n`,
    )

    expect(() => generate(fixture)).toThrow(/relative/)
  })

  it('requires a config even without the opt-in', () => {
    const plain = mkdtempSync(join(tmpdir(), 'livingdoc-plain-'))
    try {
      const doc = join(plain, 'plain.md')
      writeFileSync(doc, '# Plain\n')

      expect(() => generate(doc)).toThrow(/livingdoc\.toml/)
    } finally {
      rmSync(plain, { recursive: true, force: true })
    }
  })
})
