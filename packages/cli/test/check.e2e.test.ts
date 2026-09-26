import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const bin = fileURLToPath(new URL('../dist/bin.js', import.meta.url))

const markdown = `---
livingdoc: true
---

# Walking skeleton

Example:

- a {{ code: "SAVE10" }} code is applied
`

describe('livingdoc CLI', () => {
  let dir: string
  let fixture: string

  beforeAll(() => {
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    if (build.status !== 0) {
      throw new Error(`build failed:\n${build.stdout}${build.stderr}`)
    }

    dir = mkdtempSync(join(tmpdir(), 'livingdoc-cli-'))
    fixture = join(dir, 'fixture.md')
    writeFileSync(fixture, markdown)
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('checks a document and exits 0', () => {
    const result = spawnSync('node', [bin, 'check', fixture], {
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(existsSync(join(dir, 'livingdoc.test.ts'))).toBe(true)
  })
})
