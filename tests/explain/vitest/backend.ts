// The backend for livingdoc's own explain documents. Each binding builds a tiny
// livingdoc project, generates its test file with the built CLI, and returns
// that file so the document can assert on its content.
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const bin = join(root, 'packages/cli/dist/bin.js')

const fixtureConfig =
  'livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "vitest"\n'

function project(heading: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'livingdoc-explain-'))
  mkdirSync(join(dir, 'docs'))
  mkdirSync(join(dir, 'tests', 'vitest'), { recursive: true })
  writeFileSync(join(dir, 'livingdoc.toml'), fixtureConfig)
  writeFileSync(
    join(dir, 'docs', 'fixture.md'),
    `---\nlivingdoc: true\n---\n\n# ${heading}\n\nExample:\n`,
  )
  writeFileSync(join(dir, 'tests', 'vitest', 'backend.ts'), 'export const bindings = {}\n')
  return dir
}

export const bindings = {
  'generating-a-test-file': {
    params: ['heading'],
    run({ heading }: { heading: string }) {
      const dir = project(heading)
      try {
        spawnSync('node', [bin, 'generate'], { cwd: dir, encoding: 'utf8' })
        return {
          result: readFileSync(
            join(dir, 'tests', 'vitest', 'fixture.test.ts'),
            'utf8',
          ),
        }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  },
}
