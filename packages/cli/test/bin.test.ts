import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const bin = join(dirname(fileURLToPath(import.meta.url)), '../dist/bin.js')

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

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "SAVE10"\`
`

const backend = `import { bind } from '@livingdoc/runtime'

bind("walking-skeleton", ["code"], ({ code }) => code)
`

let dir: string

const run = (args: string[]) =>
  spawnSync(process.execPath, [bin, ...args], { cwd: dir, encoding: 'utf8' })

describe('livingdoc bin', () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-bin-'))
    mkdirSync(join(dir, 'docs'))
    mkdirSync(join(dir, 'tests', 'vitest'), { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    writeFileSync(join(dir, 'tests', 'vitest', 'backend.ts'), backend)
    writeFileSync(join(dir, 'docs', 'fixture.md'), document)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('maps results to exit codes and messages', () => {
    const ok = run(['generate', join('docs', 'fixture.md')])
    expect(ok.status, ok.stdout + ok.stderr).toBe(0)

    const missing = run(['generate', join('docs', 'missing.md')])
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain('document not found')

    const usage = run(['nonsense'])
    expect(usage.status).toBe(1)
    expect(usage.stderr).toContain('usage: livingdoc init')
    expect(usage.stderr).toContain('livingdoc generate [file.md]')
  })
})
