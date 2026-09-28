// Config loading and validation. This is the one place a `livingdoc.toml` is
// read and checked; everything downstream can assume a valid config.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { parse as parseToml } from 'smol-toml'
import { z } from 'zod'
import { frameworks } from './frameworks/index.js'

// A user-facing config problem: `bin` prints its message, no stack.
export class ConfigError extends Error {}

export interface Backend {
  name: string
  framework: string
}

export interface Config {
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

export function loadConfig(start: string): Config {
  const from = resolve(start)
  const file = findConfig(from)
  if (!file) throw new ConfigError(`no livingdoc.toml found from ${from}`)
  const root = dirname(file)

  const parsed = ConfigSchema.safeParse(readToml(file))
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
    throw new ConfigError(`${file}: ${issues}`)
  }
  const { livingdocs, code_path: codePath, backend } = parsed.data

  if (isAbsolute(livingdocs) || isAbsolute(codePath)) {
    throw new ConfigError(`${file}: livingdocs and code_path must be relative`)
  }

  const livingdocsDir = join(root, livingdocs)
  if (!existsSync(livingdocsDir)) {
    throw new ConfigError(`livingdocs folder not found: ${livingdocsDir}`)
  }

  const backends: Backend[] = []
  const names = new Set<string>()
  for (const [framework, entries] of Object.entries(backend)) {
    if (!(framework in frameworks)) {
      throw new ConfigError(`unknown framework: ${framework}`)
    }
    for (const { name } of entries) {
      if (names.has(name)) throw new ConfigError(`duplicate backend name: ${name}`)
      names.add(name)
      backends.push({ name, framework })
    }
  }
  if (backends.length === 0) {
    throw new ConfigError(
      `${file}: at least one [[backend.<framework>]] is required`,
    )
  }

  return {
    root,
    livingdocs: livingdocsDir,
    codePath: join(root, codePath),
    backends,
  }
}

function readToml(file: string): unknown {
  try {
    return parseToml(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new ConfigError(
      `${file}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
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
