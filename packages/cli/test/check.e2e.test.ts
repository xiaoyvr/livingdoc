import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const bin = fileURLToPath(new URL('../dist/bin.js', import.meta.url))

const config = `livingdocs = "docs"
backend = "tests"
`

const markdown = `---
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

const staleMarkdown = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code {{ "SAVE10" }} is applied, returning {{! toBe "OTHER" }}
`

describe('livingdoc CLI', () => {
  let dir: string
  let fixture: string
  let staleDir: string
  let staleFixture: string

  beforeAll(() => {
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    if (build.status !== 0) {
      throw new Error(`build failed:\n${build.stdout}${build.stderr}`)
    }

    dir = mkdtempSync(join(tmpdir(), 'livingdoc-cli-'))
    mkdirSync(join(dir, 'docs'))
    mkdirSync(join(dir, 'tests'))
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    fixture = join(dir, 'docs', 'fixture.md')
    writeFileSync(fixture, markdown)
    writeFileSync(join(dir, 'tests', 'livingdoc.backend.ts'), backend)

    staleDir = mkdtempSync(join(tmpdir(), 'livingdoc-cli-stale-'))
    mkdirSync(join(staleDir, 'docs'))
    mkdirSync(join(staleDir, 'tests'))
    writeFileSync(join(staleDir, 'livingdoc.toml'), config)
    staleFixture = join(staleDir, 'docs', 'stale.md')
    writeFileSync(staleFixture, staleMarkdown)
    writeFileSync(join(staleDir, 'tests', 'livingdoc.backend.ts'), backend)
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
    rmSync(staleDir, { recursive: true, force: true })
  })

  it('checks a document and exits 0', () => {
    const result = spawnSync('node', [bin, 'check', fixture], {
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(existsSync(join(dir, 'tests', 'fixture.test.ts'))).toBe(true)
  })

  it('exits non-zero when the expectation does not hold', () => {
    const result = spawnSync('node', [bin, 'check', staleFixture], {
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
  })
})
