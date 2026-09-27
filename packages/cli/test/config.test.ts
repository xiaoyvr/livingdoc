import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generate } from '@livingdoc/cli'

const config = `livingdocs = "docs"
code_path = "tests"

[[backend.vitest]]
name = "vitest"
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
    mkdirSync(join(root, 'tests', 'vitest'), { recursive: true })
    writeFileSync(join(root, 'livingdoc.toml'), config)
    fixture = join(root, 'docs', 'fixture.md')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('generates a named backend from the config', () => {
    writeFileSync(join(root, 'tests', 'vitest', 'backend.ts'), backend)
    writeFileSync(fixture, document)

    expect(generate(fixture)).toBe(0)
    expect(existsSync(join(root, 'tests', 'vitest', 'fixture.test.ts'))).toBe(true)
  })

  it('reports a missing backend file', () => {
    writeFileSync(fixture, document)

    expect(() => generate(fixture)).toThrow(/backend file not found/)
  })

  it('reports an unknown framework', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.jest]]\nname = "web"\n`,
    )
    writeFileSync(fixture, document)

    expect(() => generate(fixture)).toThrow(/unknown framework/)
  })

  it('reports a missing livingdocs folder', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "missing"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "vitest"\n`,
    )

    expect(() => generate(fixture)).toThrow(/livingdocs folder not found/)
  })

  it('rejects an absolute folder in the config', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "${join(root, 'tests')}"\n\n[[backend.vitest]]\nname = "vitest"\n`,
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
