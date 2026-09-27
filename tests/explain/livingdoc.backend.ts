// The backend for livingdoc's own explain documents. Each binding builds a
// tiny livingdoc project, generates its check with the built CLI, and reads
// back what was produced.
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

const root = fileURLToPath(new URL('../../', import.meta.url))
const bin = join(root, 'packages/cli/dist/bin.js')

function project(heading: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'livingdoc-explain-'))
  mkdirSync(join(dir, 'docs'))
  mkdirSync(join(dir, 'tests'))
  writeFileSync(join(dir, 'livingdoc.toml'), 'livingdocs = "docs"\nbackend = "tests"\n')
  writeFileSync(
    join(dir, 'docs', 'fixture.md'),
    `---\nlivingdoc: true\n---\n\n# ${heading}\n`,
  )
  writeFileSync(join(dir, 'tests', 'livingdoc.backend.ts'), 'export const bindings = {}\n')
  return dir
}

function describeOf(source: string): string {
  const match = source.match(/^describe\((.*?), \(\) => \{/m)
  return match ? (JSON.parse(match[1] ?? '') as string) : ''
}

export const bindings = {
  'generating-a-check': {
    params: ['heading'],
    run({ heading }: { heading: string }) {
      const dir = project(heading)
      try {
        spawnSync('node', [bin, 'generate'], { cwd: dir, encoding: 'utf8' })
        const generated = readFileSync(join(dir, 'tests', 'fixture.test.ts'), 'utf8')
        return { result: describeOf(generated) }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  },
}
