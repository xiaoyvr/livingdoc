import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

const staleMarkdown = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "OTHER"\`
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

  it('checks the livingdocs folder when given no path', () => {
    const result = spawnSync('node', [bin, 'check'], {
      cwd: dir,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
  })

  it('fails when a document in the folder is stale', () => {
    const result = spawnSync('node', [bin, 'check'], {
      cwd: staleDir,
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
  })

  it('reports an actionable message without a stack trace', () => {
    const fresh = mkdtempSync(join(tmpdir(), 'livingdoc-cli-noconfig-'))
    mkdirSync(join(fresh, 'docs'))
    writeFileSync(join(fresh, 'docs', 'fixture.md'), markdown)
    try {
      const result = spawnSync(
        'node',
        [bin, 'check', join(fresh, 'docs', 'fixture.md')],
        { encoding: 'utf8' },
      )

      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('livingdoc.toml')
      expect(result.stderr).not.toContain('\n    at ')
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })
})
