// The backend for livingdoc's own explain documents. Each binding builds a tiny
// livingdoc project, generates its test file with the built CLI, and returns
// either the file's text or its path, for the document to assert on.
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Bindings } from '@livingdoc/runtime'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const bin = join(root, 'packages/cli/dist/bin.js')

const config =
  'livingdocs = "docs"\ncode_path = "tests"\n\n[[backend.vitest]]\nname = "vitest"\n'

// Build a project whose only document is `doc` (default name `fixture.md`),
// generate, and return the generated file's path and text.
export function build(
  doc: string,
  name = 'fixture.md',
): { path: string; content: string } {
  const dir = mkdtempSync(join(tmpdir(), 'livingdoc-explain-'))
  try {
    mkdirSync(join(dir, 'docs'), { recursive: true })
    mkdirSync(join(dir, 'tests', 'vitest'), { recursive: true })
    writeFileSync(join(dir, 'livingdoc.toml'), config)
    const target = join(dir, 'docs', name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, doc)
    writeFileSync(
      join(dir, 'tests', 'vitest', 'backend.ts'),
      'export function register(_bindings) {}\n',
    )
    spawnSync('node', [bin, 'generate', join('docs', name)], {
      cwd: dir,
      encoding: 'utf8',
    })
    const generated = join(
      dir,
      'tests',
      'vitest',
      'generated',
      name.replace(/\.md$/, '.test.ts'),
    )
    return { path: relative(dir, generated), content: readFileSync(generated, 'utf8') }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function register(bindings: Bindings) {
  bindings.bind('what-livingdoc-generates', {
    params: ['doc'],
    run({ doc }: { doc: string }) {
      return { result: build(doc).content }
    },
  })
  bindings.bind('what-a-project-provides', {
    params: ['name', 'doc'],
    run({ name, doc }: { name: string; doc: string }) {
      return { result: build(doc, name).path }
    },
  })
}
