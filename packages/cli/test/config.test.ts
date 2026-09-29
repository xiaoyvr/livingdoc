import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { formatError, generate } from '@livingdoc/cli'

const errorOf = (result: ReturnType<typeof generate>) =>
  result.ok ? '' : formatError(result.error)

const kindOf = (result: ReturnType<typeof generate>) =>
  result.ok ? undefined : result.error.kind

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

const backend = `export function register(bindings) {
  bindings.bind("walking-skeleton", {
    params: ["code"],
    run({ code }) {
      return { result: code }
    },
  })
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

    expect(generate(fixture).ok).toBe(true)
    expect(
      existsSync(join(root, 'tests', 'vitest', 'generated', 'fixture.test.ts')),
    ).toBe(true)
  })

  it('mirrors a nested document path under generated', () => {
    writeFileSync(join(root, 'tests', 'vitest', 'backend.ts'), backend)
    mkdirSync(join(root, 'docs', 'a'), { recursive: true })
    const nested = join(root, 'docs', 'a', 'something.md')
    writeFileSync(nested, document)

    expect(generate(nested).ok).toBe(true)
    expect(
      existsSync(
        join(root, 'tests', 'vitest', 'generated', 'a', 'something.test.ts'),
      ),
    ).toBe(true)
  })

  it('reports a missing backend file', () => {
    writeFileSync(fixture, document)

    const result = generate(fixture)
    expect(kindOf(result)).toBe('backend-file-missing')
    expect(errorOf(result)).toMatch(/backend file not found/)
  })

  it('reports an unknown framework', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.jest]]\nname = "web"\n`,
    )
    writeFileSync(fixture, document)

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/unknown framework/)
  })

  it('reports a framework name taken from the prototype chain', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.toString]]\nname = "web"\n`,
    )
    writeFileSync(fixture, document)

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/unknown framework/)
  })

  it('writes one file per backend a document addresses', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "web"\n\n[[backend.vitest]]\nname = "pricing"\n`,
    )
    mkdirSync(join(root, 'tests', 'web'), { recursive: true })
    mkdirSync(join(root, 'tests', 'pricing'), { recursive: true })
    writeFileSync(join(root, 'tests', 'web', 'backend.ts'), backend)
    writeFileSync(join(root, 'tests', 'pricing', 'backend.ts'), backend)
    writeFileSync(
      fixture,
      `---\nlivingdoc: true\n---\n\n# Walking skeleton\n\nExample (web):\n\n- a web code :=\`"SAVE10"\`\n\nExample (pricing):\n\n- a pricing code :=\`"SAVE10"\`\n`,
    )

    expect(generate(fixture).ok).toBe(true)
    const web = readFileSync(
      join(root, 'tests', 'web', 'generated', 'fixture.test.ts'),
      'utf8',
    )
    const pricing = readFileSync(
      join(root, 'tests', 'pricing', 'generated', 'fixture.test.ts'),
      'utf8',
    )
    expect(web).toContain('a web code SAVE10')
    expect(pricing).toContain('a pricing code SAVE10')
  })

  it("removes a document's stale output when it stops touching a backend", () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "web"\n\n[[backend.vitest]]\nname = "pricing"\n`,
    )
    mkdirSync(join(root, 'tests', 'web'), { recursive: true })
    mkdirSync(join(root, 'tests', 'pricing'), { recursive: true })
    writeFileSync(join(root, 'tests', 'web', 'backend.ts'), backend)
    writeFileSync(join(root, 'tests', 'pricing', 'backend.ts'), backend)
    writeFileSync(
      fixture,
      `---\nlivingdoc: true\n---\n\n# Walking skeleton\n\nExample (web):\n\n- a code :=\`"SAVE10"\`\n`,
    )
    generate(fixture)
    const web = join(root, 'tests', 'web', 'generated', 'fixture.test.ts')
    expect(existsSync(web)).toBe(true)

    writeFileSync(
      fixture,
      `---\nlivingdoc: true\n---\n\n# Walking skeleton\n\nExample (pricing):\n\n- a code :=\`"SAVE10"\`\n`,
    )
    generate(fixture)

    expect(existsSync(web)).toBe(false)
    expect(
      existsSync(join(root, 'tests', 'pricing', 'generated', 'fixture.test.ts')),
    ).toBe(true)
  })

  it('reports an unknown backend alias', () => {
    writeFileSync(join(root, 'tests', 'vitest', 'backend.ts'), backend)
    writeFileSync(
      fixture,
      `---\nlivingdoc: true\n---\n\n# Walking skeleton\n\nExample (nope):\n\n- a code :=\`"SAVE10"\`\n`,
    )

    const result = generate(fixture)
    expect(kindOf(result)).toBe('unknown-backend')
    expect(errorOf(result)).toMatch(/unknown backend/)
  })

  it('trims whitespace around a backend alias', () => {
    writeFileSync(join(root, 'tests', 'vitest', 'backend.ts'), backend)
    writeFileSync(
      fixture,
      `---\nlivingdoc: true\n---\n\n# Walking skeleton\n\nExample ( vitest ):\n\n- a code :=\`"SAVE10"\`\n`,
    )

    expect(generate(fixture).ok).toBe(true)
  })

  it('reports a duplicate backend name', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "web"\n\n[[backend.vitest]]\nname = "web"\n`,
    )
    mkdirSync(join(root, 'tests', 'web'), { recursive: true })
    writeFileSync(join(root, 'tests', 'web', 'backend.ts'), backend)
    writeFileSync(fixture, document)

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/duplicate backend name/)
  })

  it('reports a wrongly shaped backend config', () => {
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "tests"\nbackend = 1\n`,
    )
    writeFileSync(fixture, document)

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/livingdoc\.toml/)
  })

  it('reports a missing livingdocs folder', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "missing"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "vitest"\n`,
    )

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/livingdocs folder not found/)
  })

  it('rejects an absolute folder in the config', () => {
    writeFileSync(fixture, document)
    writeFileSync(
      join(root, 'livingdoc.toml'),
      `livingdocs = "docs"\ncode_path = "${join(root, 'tests')}"\n\n[[backend.vitest]]\nname = "vitest"\n`,
    )

    const result = generate(fixture)
    expect(kindOf(result)).toBe('invalid-config')
    expect(errorOf(result)).toMatch(/relative/)
  })

  it('requires a config even without the opt-in', () => {
    const plain = mkdtempSync(join(tmpdir(), 'livingdoc-plain-'))
    try {
      const doc = join(plain, 'plain.md')
      writeFileSync(doc, '# Plain\n')

      const result = generate(doc)
      expect(kindOf(result)).toBe('invalid-config')
      expect(errorOf(result)).toMatch(/livingdoc\.toml/)
    } finally {
      rmSync(plain, { recursive: true, force: true })
    }
  })
})
