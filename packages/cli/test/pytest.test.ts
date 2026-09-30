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
import { generate } from '@livingdoc/cli'

const runtimeSrc = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../runtime-python/src',
)

const config = `livingdocs = "docs"
code_path = "tests"

[[backend.pytest]]
name = "pytest"
`

const document = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`== "SAVE10"\`
`

const stale = `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`== "OTHER"\`
`

const backend = `from types import SimpleNamespace

def register(bindings):
    bindings.bind(
        "walking-skeleton",
        SimpleNamespace(
            params=["code"],
            run=lambda args: {"result": args["code"]},
        ),
    )
`

const emptyBackend = `def register(_bindings):
    pass
`

const withAppend = `---
livingdoc: true
---

# Walking skeleton

~~~python >>
bind("walking-skeleton", ["code"], lambda args: args["code"])
~~~

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`== "SAVE10"\`
`

describe('livingdoc pytest', () => {
  let dir: string
  let fixture: string
  let backendDir: string
  let generated: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-pytest-'))
    backendDir = join(dir, 'tests', 'pytest')
    mkdirSync(join(dir, 'docs'))
    mkdirSync(backendDir, { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    writeFileSync(join(backendDir, 'backend.py'), backend)
    fixture = join(dir, 'docs', 'fixture.md')
    generated = join(backendDir, 'generated', 'test_fixture.py')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('generates a pytest file that passes', () => {
    writeFileSync(fixture, document)

    expect(generate(fixture).ok).toBe(true)
    expect(existsSync(generated)).toBe(true)

    const result = spawnSync('pytest', [generated, '-q'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONPATH: [backendDir, runtimeSrc].join(':'),
      },
    })

    expect(result.status, result.stdout + result.stderr).toBe(0)
  })

  it('fails under pytest when the expectation is stale', () => {
    writeFileSync(fixture, stale)

    expect(generate(fixture).ok).toBe(true)

    const result = spawnSync('pytest', [generated, '-q'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONPATH: [backendDir, runtimeSrc].join(':'),
      },
    })

    expect(result.status, result.stdout + result.stderr).not.toBe(0)
  })

  it('runs a case whose binding is registered in a >> block', () => {
    writeFileSync(join(backendDir, 'backend.py'), emptyBackend)
    writeFileSync(fixture, withAppend)

    expect(generate(fixture).ok).toBe(true)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain('bind("walking-skeleton"')
    expect(content.indexOf('bind("walking-skeleton"')).toBeLessThan(
      content.indexOf('def test_'),
    )

    const result = spawnSync('pytest', [generated, '-q'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONPATH: [backendDir, runtimeSrc].join(':'),
      },
    })

    expect(result.status, result.stdout + result.stderr).toBe(0)
  })
})
