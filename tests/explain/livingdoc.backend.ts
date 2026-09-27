// The backend for livingdoc's own explain document. Each fixture is a tiny
// livingdoc project: generate its check with the built CLI, then run the
// generated test with vitest. livingdoc only generates; the target runner does
// the running.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const bin = join(root, 'packages/cli/dist/bin.js')
const config = 'livingdocs = "docs"\nbackend = "tests"\n'

const fixtureBackend = `export const bindings = {
  "walking-skeleton": {
    params: ["code"],
    run({ code }) {
      return { result: code }
    },
  },
}
`

const fixtureDocument = (assertion: string) => `---
livingdoc: true
---

# Walking skeleton

Example:

- a code :=\`"SAVE10"\` is applied, returning !!\`${assertion}\`
`

const documents: Record<string, string> = {
  holds: fixtureDocument('toBe "SAVE10"'),
  stale: fixtureDocument('toBe "OTHER"'),
}

export const bindings = {
  'generating-the-checks': {
    params: ['fixture'],
    run({ fixture }: { fixture: string }) {
      const dir = mkdtempSync(join(tmpdir(), 'livingdoc-dogfood-'))
      try {
        const document = documents[fixture]
        if (document) {
          mkdirSync(join(dir, 'docs'))
          mkdirSync(join(dir, 'tests'))
          writeFileSync(join(dir, 'livingdoc.toml'), config)
          writeFileSync(join(dir, 'docs', 'fixture.md'), document)
          writeFileSync(join(dir, 'tests', 'livingdoc.backend.ts'), fixtureBackend)
        }

        const generate = spawnSync('node', [bin, 'generate'], {
          cwd: dir,
          encoding: 'utf8',
        })
        if (generate.status !== 0) return { result: generate.status }

        const run = spawnSync(
          'npx',
          ['vitest', 'run', '--root', join(dir, 'tests'), 'fixture.test.ts'],
          { cwd: dir, encoding: 'utf8' },
        )
        return { result: run.status ?? 1 }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  },
}
