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

- a {{ code: "SAVE10" }} code is applied
`

describe('livingdoc check', () => {
  let dir: string
  let fixture: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-check-'))
    fixture = join(dir, 'fixture.md')
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
    expect(content).toContain('it("a SAVE10 code is applied"')
    expect(content).toContain('const code = "SAVE10"')
  })

  it('runs the generated check and passes', () => {
    writeFileSync(fixture, withBullet)

    const code = check(fixture)

    expect(code).toBe(0)
  })
})
