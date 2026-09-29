// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, parse as parsePath, relative, resolve } from 'node:path'
import type { Nodes } from 'mdast'
import { loadConfig, type Backend, type Config } from './config.js'
import type { DomainError } from './errors.js'
import {
  appendBlocks,
  exampleGroups,
  frontmatter,
  headingTitle,
  isOptedIn,
  parseMarkdown,
} from './document.js'
import type { Result } from './result.js'

export { formatError } from './errors.js'

export function generate(file?: string): Result<void, DomainError> {
  const config = loadConfig(file ? dirname(resolve(file)) : process.cwd())
  if (!config.ok) return config

  if (file) {
    const path = resolve(file)
    if (!existsSync(path)) return fail({ kind: 'document-missing', path })
    cleanDoc(config.value, docName(config.value, path))
    return generateDoc(config.value, path)
  }

  cleanGenerated(config.value)
  for (const name of readdirSync(config.value.livingdocs)) {
    if (!name.endsWith('.md')) continue
    const result = generateDoc(config.value, join(config.value.livingdocs, name))
    if (!result.ok) return result
  }
  return { ok: true, value: undefined }
}

function generateDoc(config: Config, file: string): Result<void, DomainError> {
  const tree = parseMarkdown(readFileSync(file, 'utf8'))
  if (!isOptedIn(frontmatter(tree))) return { ok: true, value: undefined }

  const name = docName(config, file)
  const title = headingTitle(tree)
  const appends = appendBlocks(tree)

  const groups = new Map<Backend, Nodes[]>()
  for (const group of exampleGroups(tree)) {
    const backend = resolveBackend(config, group.backend)
    if (!backend.ok) return backend
    const bullets = groups.get(backend.value)
    if (bullets) bullets.push(...group.bullets)
    else groups.set(backend.value, [...group.bullets])
  }

  for (const [backend, bullets] of groups) {
    const result = writeBackend(config, backend, name, title, bullets, appends)
    if (!result.ok) return result
  }
  return { ok: true, value: undefined }
}

function writeBackend(
  config: Config,
  backend: Backend,
  name: string,
  title: string,
  bullets: Nodes[],
  appends: string[],
): Result<void, DomainError> {
  const framework = backend.framework

  const backendFile = join(
    config.codePath,
    backend.name,
    `backend.${framework.extension}`,
  )
  if (!existsSync(backendFile)) {
    return fail({ kind: 'backend-file-missing', path: backendFile })
  }

  const target = join(
    generatedDir(config, backend),
    framework.generatedFile(name),
  )
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, framework.generate(title, bullets, appends))
  return { ok: true, value: undefined }
}

function resolveBackend(
  config: Config,
  alias?: string,
): Result<Backend, DomainError> {
  if (!alias) return { ok: true, value: config.backends[0] as Backend }
  const match = config.backends.find((backend) => backend.name === alias)
  if (!match) return fail({ kind: 'unknown-backend', name: alias })
  return { ok: true, value: match }
}

function fail(error: DomainError): Result<never, DomainError> {
  return { ok: false, error }
}

// Drop every backend's generated folder, so outputs for deleted documents go too.
function cleanGenerated(config: Config): void {
  for (const backend of config.backends) {
    rmSync(generatedDir(config, backend), { recursive: true, force: true })
  }
}

// Drop one document's outputs from every backend, without touching siblings.
function cleanDoc(config: Config, name: string): void {
  for (const backend of config.backends) {
    rmSync(
      join(generatedDir(config, backend), backend.framework.generatedFile(name)),
      { force: true },
    )
  }
}

// The document's path relative to `livingdocs`, without extension. The
// generated file mirrors it, so two documents can't share one output.
function docName(config: Config, file: string): string {
  const path = resolve(file)
  const rel = relative(config.livingdocs, path)
  if (rel.startsWith('..') || isAbsolute(rel)) return parsePath(path).name
  const { dir, name } = parsePath(rel)
  return dir ? join(dir, name) : name
}

function generatedDir(config: Config, backend: Backend): string {
  return join(config.codePath, backend.name, 'generated')
}
