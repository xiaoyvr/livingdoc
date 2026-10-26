import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

const document = (heading: string) => `---
livingdoc: true
---

# ${heading}

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`toBe "SAVE10"\`
`

const module = (name: string) => `import { bind } from '@livingdoc/runtime'

bind('${name}', ['code'], ({ code }) => code)
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

describe('livingdoc backend barrel', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'livingdoc-barrel-'))
    mkdirSync(join(dir, 'docs'))
    mkdirSync(join(dir, 'tests', 'vitest', 'backend'), { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    writeFileSync(
      join(dir, 'tests', 'vitest', 'backend.ts'),
      `import './backend/checkout.js'\nimport './backend/cart.js'\n`,
    )
    writeFileSync(
      join(dir, 'tests', 'vitest', 'backend', 'checkout.ts'),
      module('checkout'),
    )
    writeFileSync(
      join(dir, 'tests', 'vitest', 'backend', 'cart.ts'),
      module('cart'),
    )
    writeFileSync(join(dir, 'docs', 'checkout.md'), document('Checkout'))
    writeFileSync(join(dir, 'docs', 'cart.md'), document('Cart'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('runs cases for bindings declared in two modules behind one barrel', () => {
    expect(generate(join(dir, 'docs', 'checkout.md')).ok).toBe(true)
    expect(generate(join(dir, 'docs', 'cart.md')).ok).toBe(true)

    const result = runGenerated(dir)
    expect(result.status, result.stdout + result.stderr).toBe(0)
  })
})
