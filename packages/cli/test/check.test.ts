import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { check } from '@livingdoc/cli'

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

- a code {{ "SAVE10" }} is applied
`

const withAssertion = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code {{ "SAVE10" }} is applied, returning {{! toBe "OTHER" }}
`

const withColonValue = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code {{ "http://x" }} is applied
`

const withTwoAssertions = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code {{ "SAVE10" }} is applied, first {{! toBe "SAVE10" }} second {{! toBe "NOPE" }}
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

describe('livingdoc check', () => {
  let dir: string
  let fixture: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-check-'))
    fixture = join(dir, 'fixture.md')
    writeFileSync(join(dir, 'livingdoc.backend.ts'), consumerBackend)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('generates a describe for the heading of an opted-in document', () => {
    writeFileSync(fixture, optedIn)

    check(fixture)

    const generated = join(dir, 'livingdoc.test.ts')
    expect(existsSync(generated)).toBe(true)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('describe("Walking skeleton"')
  })

  it('writes nothing for a document without the opt-in', () => {
    writeFileSync(fixture, notOptedIn)

    check(fixture)

    expect(existsSync(join(dir, 'livingdoc.test.ts'))).toBe(false)
  })

  it('generates an it for the bullet, binding its input', () => {
    writeFileSync(fixture, withBullet)

    check(fixture)

    const content = readFileSync(join(dir, 'livingdoc.test.ts'), 'utf8')
    expect(content).toContain('it("a code SAVE10 is applied"')
    expect(content).toContain('const code = "SAVE10"')
  })

  it('runs the generated check and passes', () => {
    writeFileSync(fixture, withBullet)

    const code = check(fixture)

    expect(code).toBe(0)
  })

  it('fails the check when the binding rejects the input', () => {
    writeFileSync(fixture, withBullet.replace('SAVE10', 'WRONG'))

    expect(check(fixture)).not.toBe(0)
  })

  it('fails the check when the expectation does not hold', () => {
    writeFileSync(fixture, withAssertion)

    expect(check(fixture)).not.toBe(0)
  })

  it('passes the check when the expectation holds', () => {
    writeFileSync(fixture, withAssertion.replace('OTHER', 'SAVE10'))

    expect(check(fixture)).toBe(0)
  })

  it('binds a value containing a colon, verbatim', () => {
    writeFileSync(fixture, withColonValue)

    expect(check(fixture)).toBe(0)
  })

  it('evaluates every assertion in a bullet', () => {
    writeFileSync(fixture, withTwoAssertions)

    expect(check(fixture)).not.toBe(0)
  })

  it('fails a structural document with no cases, as vitest does', () => {
    rmSync(join(dir, 'livingdoc.backend.ts'))
    writeFileSync(fixture, optedIn)

    expect(check(fixture)).not.toBe(0)
  })
})
