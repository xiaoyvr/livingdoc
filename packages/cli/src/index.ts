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
import { dirname, join, parse as parsePath, resolve } from 'node:path'
import type { Nodes } from 'mdast'
import { loadConfig, type Backend, type Config } from './config.js'
import { formatError, type DomainError } from './errors.js'
import {
  exampleGroups,
  frontmatter,
  headingTitle,
  isOptedIn,
  parseMarkdown,
} from './document.js'
import { find } from './frameworks/index.js'
import type { Result } from './result.js'

export { formatError } from './errors.js'

export function generate(file?: string): Result<void, DomainError> {
  const config = loadConfig(file ? dirname(resolve(file)) : process.cwd())
  if (!config.ok) return config

  if (file) {
    const path = resolve(file)
    if (!existsSync(path)) return fail({ kind: 'document-missing', path })
    cleanDoc(config.value, parsePath(path).name)
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

  const doc = parsePath(resolve(file)).name
  const title = headingTitle(tree)

  const groups = new Map<Backend, Nodes[]>()
  for (const group of exampleGroups(tree)) {
    const backend = resolveBackend(config, group.backend)
    if (!backend.ok) return backend
    const bullets = groups.get(backend.value)
    if (bullets) bullets.push(...group.bullets)
    else groups.set(backend.value, [...group.bullets])
  }

  for (const [backend, bullets] of groups) {
    const result = writeBackend(config, backend, doc, title, bullets)
    if (!result.ok) return result
  }
  return { ok: true, value: undefined }
}

function writeBackend(
  config: Config,
  backend: Backend,
  doc: string,
  title: string,
  bullets: Nodes[],
): Result<void, DomainError> {
  const framework = find(backend.framework)
  if (!framework) {
    return fail({
      kind: 'invalid-config',
      file: join(config.root, 'livingdoc.toml'),
      issues: [`unknown framework: ${backend.framework}`],
    })
  }

  const backendFile = join(
    config.codePath,
    backend.name,
    `backend.${framework.extension}`,
  )
  if (!existsSync(backendFile)) {
    return fail({ kind: 'backend-file-missing', path: backendFile })
  }

  const dir = generatedDir(config, backend)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, framework.generatedFile(doc)),
    framework.generate(title, bullets),
  )
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
function cleanDoc(config: Config, doc: string): void {
  for (const backend of config.backends) {
    const framework = find(backend.framework)
    if (!framework) continue
    rmSync(join(generatedDir(config, backend), framework.generatedFile(doc)), {
      force: true,
    })
  }
}

function generatedDir(config: Config, backend: Backend): string {
  return join(config.codePath, backend.name, 'generated')
}
