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
import { dirname, isAbsolute, join, parse as parsePath, resolve } from 'node:path'
import type { Nodes } from 'mdast'
import { parse as parseToml } from 'smol-toml'
import {
  exampleGroups,
  frontmatter,
  headingTitle,
  isOptedIn,
  parseMarkdown,
} from './document.js'
import { frameworks } from './frameworks/index.js'

export function generate(file?: string): number {
  if (!file) {
    const config = loadConfig(process.cwd())
    cleanGenerated(config)
    for (const name of readdirSync(config.livingdocs)) {
      if (!name.endsWith('.md')) continue
      generateDoc(config, join(config.livingdocs, name))
    }
    return 0
  }

  const config = loadConfig(dirname(resolve(file)))
  cleanDoc(config, parsePath(resolve(file)).name)
  generateDoc(config, resolve(file))
  return 0
}

function generateDoc(config: Config, file: string): void {
  const tree = parseMarkdown(readFileSync(file, 'utf8'))
  if (!isOptedIn(frontmatter(tree))) return

  const doc = parsePath(resolve(file)).name
  const title = headingTitle(tree)

  const groups = new Map<Backend, Nodes[]>()
  for (const group of exampleGroups(tree)) {
    const backend = resolveBackend(config, group.backend)
    const bullets = groups.get(backend)
    if (bullets) bullets.push(...group.bullets)
    else groups.set(backend, [...group.bullets])
  }

  for (const [backend, bullets] of groups) {
    writeBackend(config, backend, doc, title, bullets)
  }
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
    const framework = frameworks[backend.framework]
    if (!framework) continue
    rmSync(join(generatedDir(config, backend), framework.generatedFile(doc)), {
      force: true,
    })
  }
}

function generatedDir(config: Config, backend: Backend): string {
  return join(config.codePath, backend.name, 'generated')
}

function writeBackend(
  config: Config,
  backend: Backend,
  doc: string,
  title: string,
  bullets: Nodes[],
): void {
  const framework = frameworks[backend.framework]
  if (!framework) throw new Error(`unknown framework: ${backend.framework}`)

  const backendFile = join(
    config.codePath,
    backend.name,
    `backend.${framework.extension}`,
  )
  if (!existsSync(backendFile)) {
    throw new Error(`backend file not found: ${backendFile}`)
  }

  const dir = generatedDir(config, backend)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, framework.generatedFile(doc)), framework.generate(title, bullets))
}

function resolveBackend(config: Config, alias?: string): Backend {
  if (!alias) {
    const first = config.backends[0]
    if (!first) throw new Error('no backends configured')
    return first
  }
  const match = config.backends.find((backend) => backend.name === alias)
  if (!match) throw new Error(`unknown backend: ${alias}`)
  return match
}

interface Backend {
  name: string
  framework: string
}

interface Config {
  root: string
  livingdocs: string
  codePath: string
  backends: Backend[]
}

function loadConfig(start: string): Config {
  const from = resolve(start)
  let dir = from
  while (true) {
    const candidate = join(dir, 'livingdoc.toml')
    if (existsSync(candidate)) {
      const data = parseToml(readFileSync(candidate, 'utf8')) as Record<
        string,
        unknown
      >
      const { livingdocs, code_path: codePath, backend } = data
      if (typeof livingdocs !== 'string' || typeof codePath !== 'string') {
        throw new Error(`${candidate}: livingdocs and code_path must be strings`)
      }
      if (isAbsolute(livingdocs) || isAbsolute(codePath)) {
        throw new Error(
          `${candidate}: livingdocs and code_path must be relative to the config file`,
        )
      }
      const livingdocsDir = join(dir, livingdocs)
      if (!existsSync(livingdocsDir)) {
        throw new Error(`livingdocs folder not found: ${livingdocsDir}`)
      }
      return {
        root: dir,
        livingdocs: livingdocsDir,
        codePath: join(dir, codePath),
        backends: readBackends(backend),
      }
    }
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`no livingdoc.toml found from ${from}`)
    dir = parent
  }
}

function readBackends(table: unknown): Backend[] {
  if (!table || typeof table !== 'object') return []
  const backends: Backend[] = []
  for (const [framework, entries] of Object.entries(
    table as Record<string, unknown>,
  )) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      const name = (entry as Record<string, unknown>)?.name
      if (typeof name !== 'string') {
        throw new Error(`backend under ${framework} must have a string name`)
      }
      backends.push({ name, framework })
    }
  }
  return backends
}
