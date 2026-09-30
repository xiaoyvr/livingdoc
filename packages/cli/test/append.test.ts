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

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const config = `livingdocs = "docs"
code_path = "tests"

[[backend.vitest]]
name = "vitest"
`

const emptyBackend = `export function register(_bindings) {}
`

const backendBind = `export function register(bindings) {
  bindings.bind('walking-skeleton', {
    params: ['code'],
    run({ code }) { return { result: code } },
  })
}
`

const bindBlock = `bind('walking-skeleton', ['code'], ({ code }) => code)`

// The binding is registered in the document, not the backend.
const document = `---
livingdoc: true
---

# Walking skeleton

~~~ts >>
${bindBlock}
~~~

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "SAVE10"\`
`

const documentTwice = `---
livingdoc: true
---

# Walking skeleton

~~~ts >>
${bindBlock}
${bindBlock}
~~~

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "SAVE10"\`
`

function runGenerated(dir: string): ReturnType<typeof spawnSync> {
  const configFile = join(dir, 'vitest.config.ts')
  const runtimeEntry = join(root, 'packages/runtime/src/index.ts')
  const vitestConfig = join(root, 'node_modules/vitest/dist/config.js')
  writeFileSync(
    configFile,
    `import { defineConfig } from ${JSON.stringify(vitestConfig)}
export default defineConfig({
  root: ${JSON.stringify(dir)},
  resolve: { alias: { '@livingdoc/runtime': ${JSON.stringify(runtimeEntry)} } },
  test: { include: ['tests/**/*.test.ts'] },
})
`,
  )
  return spawnSync(
    join(root, 'node_modules/.bin/vitest'),
    ['run', '--config', configFile],
    { encoding: 'utf8', cwd: root },
  )
}

describe('livingdoc append (>>)', () => {
  let dir: string
  let fixture: string
  let generated: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-append-'))
    mkdirSync(join(dir, 'docs'))
    mkdirSync(join(dir, 'tests', 'vitest'), { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    writeFileSync(join(dir, 'tests', 'vitest', 'backend.ts'), emptyBackend)
    fixture = join(dir, 'docs', 'fixture.md')
    generated = join(dir, 'tests', 'vitest', 'generated', 'fixture.test.ts')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('runs a case whose binding is registered in a >> block', () => {
    writeFileSync(fixture, document)

    expect(generate(fixture).ok).toBe(true)
    expect(existsSync(generated)).toBe(true)

    const content = readFileSync(generated, 'utf8')
    expect(content).toContain("bind('walking-skeleton'")
    expect(content.indexOf("bind('walking-skeleton'")).toBeLessThan(
      content.indexOf('it('),
    )

    const result = runGenerated(dir)
    expect(result.status, result.stdout + result.stderr).toBe(0)
  })

  it('fails when the >> block binds a name the backend already provides', () => {
    writeFileSync(join(dir, 'tests', 'vitest', 'backend.ts'), backendBind)
    writeFileSync(fixture, document)

    expect(generate(fixture).ok).toBe(true)

    const result = runGenerated(dir)
    expect(result.status, result.stdout + result.stderr).not.toBe(0)
    expect(result.stdout + result.stderr).toContain('duplicate binding')
  })

  it('fails when the >> block binds the same name twice', () => {
    writeFileSync(fixture, documentTwice)

    expect(generate(fixture).ok).toBe(true)

    const result = runGenerated(dir)
    expect(result.status, result.stdout + result.stderr).not.toBe(0)
    expect(result.stdout + result.stderr).toContain('duplicate binding')
  })
})
