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
import {
  ConfigError,
  loadConfig,
  type Backend,
  type Config,
} from './config.js'
import {
  exampleGroups,
  frontmatter,
  headingTitle,
  isOptedIn,
  parseMarkdown,
} from './document.js'
import { frameworks } from './frameworks/index.js'

export { ConfigError } from './config.js'

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
  if (!framework) throw new ConfigError(`unknown framework: ${backend.framework}`)

  const backendFile = join(
    config.codePath,
    backend.name,
    `backend.${framework.extension}`,
  )
  if (!existsSync(backendFile)) {
    throw new ConfigError(`backend file not found: ${backendFile}`)
  }

  const dir = generatedDir(config, backend)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, framework.generatedFile(doc)), framework.generate(title, bullets))
}

function resolveBackend(config: Config, alias?: string): Backend {
  if (!alias) return config.backends[0] as Backend
  const match = config.backends.find((backend) => backend.name === alias)
  if (!match) throw new ConfigError(`unknown backend: ${alias}`)
  return match
}
