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
import { generate } from '@livingdoc/cli'

const config = `livingdocs = "docs"
code_path = "tests"

[[backend.vitest]]
name = "vitest"
`

const optedIn = `---
livingdoc: true
---

# Walking skeleton

Example:
`

const notOptedIn = `# Walking skeleton

Example:
`

const withBullet = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied
`

const withAssertion = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "OTHER"\`
`

const withColonValue = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"http://x"\` is applied
`

const withTwoAssertions = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, first !!\`toBe "SAVE10"\` second !!\`toBe "NOPE"\`
`

const withNativeTokens = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "SAVE10"\`
`

const withProseCodeSpan = `---
livingdoc: true
---

# Walking skeleton

Example:

- run \`toBe SAVE10\` now
`

const withFencedInput = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` and the file !!\`toBe expected\`

  ~~~expected :=
  hello
  world
  ~~~
`

const withFencedInputLang = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` and the file !!\`toBe expected\`

  ~~~ts expected :=
  hello
  world
  ~~~
`

const consumerBackend = `export const bindings = {
  "walking-skeleton": {
    params: ["code"],
    run({ code }) {
      if (code === "WRONG") throw new Error(\`unexpected code: \${code}\`)
      return { result: code }
    },
  },
}
`

describe('livingdoc generate', () => {
  let dir: string
  let fixture: string
  let generated: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-check-'))
    mkdirSync(join(dir, 'docs'))
    mkdirSync(join(dir, 'tests', 'vitest'), { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    fixture = join(dir, 'docs', 'fixture.md')
    generated = join(dir, 'tests', 'vitest', 'generated', 'fixture.test.ts')
    writeFileSync(join(dir, 'tests', 'vitest', 'backend.ts'), consumerBackend)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('generates a describe for the heading of an opted-in document', () => {
    writeFileSync(fixture, optedIn)

    generate(fixture)

    expect(existsSync(generated)).toBe(true)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('describe("Walking skeleton"')
  })

  it('writes nothing for a document without the opt-in', () => {
    writeFileSync(fixture, notOptedIn)

    generate(fixture)

    expect(existsSync(generated)).toBe(false)
  })

  it('generates an it for the bullet, binding its input', () => {
    writeFileSync(fixture, withBullet)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('it("a code SAVE10 is applied"')
    expect(content).toContain('const code = "SAVE10"')
  })

  it('generates a check without running it', () => {
    writeFileSync(fixture, withBullet)

    expect(generate(fixture).ok).toBe(true)
    expect(existsSync(generated)).toBe(true)
  })

  it('binds a value containing a colon, verbatim', () => {
    writeFileSync(fixture, withColonValue)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('const code = "http://x"')
  })

  it('emits an assertion for every assertion token', () => {
    writeFileSync(fixture, withTwoAssertions)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('expect(outputs.result).toBe("SAVE10")')
    expect(content).toContain('expect(outputs.result).toBe("NOPE")')
  })

  it('emits a stale expectation as written', () => {
    writeFileSync(fixture, withAssertion)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('expect(outputs.result).toBe("OTHER")')
  })

  it('writes no case for a document with no examples', () => {
    writeFileSync(fixture, optedIn)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).not.toContain('it(')
  })

  it('generates from a code span input and assertion', () => {
    writeFileSync(fixture, withNativeTokens)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('const code = "SAVE10"')
    expect(content).toContain('expect(outputs.result).toBe("SAVE10")')
  })

  it('leaves an ordinary code span as prose', () => {
    writeFileSync(fixture, withProseCodeSpan)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).not.toContain('expect(')
  })

  it.each([
    ['a bare name', withFencedInput],
    ['a language and a name', withFencedInputLang],
  ])('binds a fenced block as a string: %s', (_form, document) => {
    writeFileSync(fixture, document)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('const expected = "hello\\nworld"')
    expect(content).toContain('expect(outputs.result).toBe(expected)')
  })

  it('creates file-scoped bindings from the backend via the runtime', () => {
    writeFileSync(fixture, withBullet)

    generate(fixture)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain("import { bindings as backend } from '../backend'")
    expect(content).toContain("import { createBindings } from '@livingdoc/runtime'")
    expect(content).toContain('const bindings = createBindings(backend)')
    expect(content).toContain('bindings.get("walking-skeleton").run({ code })')
  })
})
