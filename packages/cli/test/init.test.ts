import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const bin = join(dirname(fileURLToPath(import.meta.url)), '../dist/bin.js')

const config = `livingdocs = "docs"
code_path = "tests/explain"

[[backend.vitest]]
name = "web"
`

const pytestConfig = `livingdocs = "docs"
code_path = "tests/explain"

[[backend.pytest]]
name = "pricing"
`

let dir: string

const run = (args: string[]) =>
  spawnSync(process.execPath, [bin, ...args], { cwd: dir, encoding: 'utf8' })

describe('livingdoc init', () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-init-'))
    mkdirSync(join(dir, 'docs'))
    writeFileSync(join(dir, 'livingdoc.toml'), config)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('creates an inert backend index', () => {
    const result = run(['init'])
    expect(result.status, result.stdout + result.stderr).toBe(0)

    const file = join(dir, 'tests', 'explain', 'web', 'backend.ts')
    expect(existsSync(file)).toBe(true)
  })

  it('creates a Python backend index', () => {
    writeFileSync(join(dir, 'livingdoc.toml'), pytestConfig)

    const result = run(['init'])
    expect(result.status, result.stdout + result.stderr).toBe(0)

    const file = join(dir, 'tests', 'explain', 'pricing', 'backend.py')
    expect(existsSync(file)).toBe(true)
  })
})
