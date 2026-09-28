// Config loading and validation. This is the one place a `livingdoc.toml` is
// read and checked; everything downstream can assume a valid config.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { parse as parseToml } from 'smol-toml'
import { z } from 'zod'
import { frameworks } from './frameworks/index.js'
import type { DomainError } from './errors.js'
import type { Result } from './result.js'

export type Backend = { name: string; framework: string }

export type Config = {
  root: string
  livingdocs: string
  codePath: string
  backends: Backend[]
}

const ConfigSchema = z.object({
  livingdocs: z.string().min(1),
  code_path: z.string().min(1),
  backend: z
    .record(z.string(), z.array(z.object({ name: z.string().min(1) })))
    .default({}),
})

export function loadConfig(start: string): Result<Config, DomainError> {
  const from = resolve(start)
  const file = findConfig(from)
  if (!file) return fail(join(from, 'livingdoc.toml'), 'not found')
  const root = dirname(file)

  let raw: unknown
  try {
    raw = parseToml(readFileSync(file, 'utf8'))
  } catch (error) {
    return fail(file, error instanceof Error ? error.message : String(error))
  }

  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) {
    return fail(
      file,
      ...parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    )
  }
  const { livingdocs, code_path: codePath, backend } = parsed.data

  if (isAbsolute(livingdocs) || isAbsolute(codePath)) {
    return fail(file, 'livingdocs and code_path must be relative')
  }

  const livingdocsDir = join(root, livingdocs)
  if (!existsSync(livingdocsDir)) {
    return fail(file, `livingdocs folder not found: ${livingdocsDir}`)
  }

  const backends: Backend[] = []
  const names = new Set<string>()
  for (const [framework, entries] of Object.entries(backend)) {
    if (!Object.hasOwn(frameworks, framework)) {
      return fail(file, `unknown framework: ${framework}`)
    }
    for (const { name } of entries) {
      if (names.has(name)) return fail(file, `duplicate backend name: ${name}`)
      names.add(name)
      backends.push({ name, framework })
    }
  }
  if (backends.length === 0) {
    return fail(file, 'at least one [[backend.<framework>]] is required')
  }

  return {
    ok: true,
    value: {
      root,
      livingdocs: livingdocsDir,
      codePath: join(root, codePath),
      backends,
    },
  }
}

function fail(file: string, ...issues: string[]): Result<never, DomainError> {
  return { ok: false, error: { kind: 'invalid-config', file, issues } }
}

function findConfig(from: string): string | undefined {
  let dir = from
  while (true) {
    const candidate = join(dir, 'livingdoc.toml')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}
