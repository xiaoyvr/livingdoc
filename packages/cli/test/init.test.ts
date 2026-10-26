import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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

const mixedConfig = `livingdocs = "docs"
code_path = "tests/explain"

[[backend.vitest]]
name = "web"

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

  it('creates a TypeScript backend index', () => {
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

  it('leaves an existing Python package entry alone', () => {
    writeFileSync(join(dir, 'livingdoc.toml'), pytestConfig)
    const entry = join(
      dir,
      'tests',
      'explain',
      'pricing',
      'backend',
      '__init__.py',
    )
    mkdirSync(dirname(entry), { recursive: true })
    writeFileSync(entry, '# mine\n')

    const result = run(['init'])
    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(readFileSync(entry, 'utf8')).toBe('# mine\n')
    expect(
      existsSync(join(dir, 'tests', 'explain', 'pricing', 'backend.py')),
    ).toBe(false)
    expect(result.stdout.trim().split('\n')).toEqual([
      'exists tests/explain/pricing/backend/__init__.py',
    ])
  })

  it('leaves an existing backend untouched and reports created and exists', () => {
    writeFileSync(join(dir, 'livingdoc.toml'), mixedConfig)
    mkdirSync(join(dir, 'tests', 'explain', 'web'), { recursive: true })
    const existing = join(dir, 'tests', 'explain', 'web', 'backend.ts')
    writeFileSync(existing, '// mine\n')

    const first = run(['init'])
    expect(first.status, first.stdout + first.stderr).toBe(0)
    expect(readFileSync(existing, 'utf8')).toBe('// mine\n')
    expect(
      existsSync(join(dir, 'tests', 'explain', 'pricing', 'backend.py')),
    ).toBe(true)
    expect(first.stdout.trim().split('\n')).toEqual([
      'exists tests/explain/web/backend.ts',
      'created tests/explain/pricing/backend.py',
    ])

    const second = run(['init'])
    expect(second.status, second.stdout + second.stderr).toBe(0)
    expect(second.stdout.trim().split('\n')).toEqual([
      'exists tests/explain/web/backend.ts',
      'exists tests/explain/pricing/backend.py',
    ])
  })

  it('rejects extra arguments', () => {
    const result = run(['init', 'extra'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('usage: livingdoc init')
    expect(existsSync(join(dir, 'tests'))).toBe(false)
  })

  it('fails without a config and writes nothing', () => {
    rmSync(join(dir, 'livingdoc.toml'))

    const result = run(['init'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('config not found')
    expect(existsSync(join(dir, 'tests'))).toBe(false)
  })
})
