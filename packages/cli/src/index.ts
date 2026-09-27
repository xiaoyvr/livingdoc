// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, parse as parsePath, resolve } from 'node:path'
import { parse as parseToml } from 'smol-toml'
import {
  exampleBullets,
  frontmatter,
  headingTitle,
  isOptedIn,
  parseMarkdown,
} from './document.js'
import { frameworks } from './frameworks/index.js'

export function generate(file?: string): number {
  if (!file) return generateProject(process.cwd())

  const config = loadConfig(dirname(resolve(file)))
  const tree = parseMarkdown(readFileSync(file, 'utf8'))
  if (!isOptedIn(frontmatter(tree))) return 0

  const backend = config.backends[0]
  if (!backend) throw new Error('no backends configured')
  const framework = frameworks[backend.framework]
  if (!framework) throw new Error(`unknown framework: ${backend.framework}`)

  const dir = join(config.codePath, backend.name)
  const backendFile = join(dir, `backend.${framework.extension}`)
  if (!existsSync(backendFile)) {
    throw new Error(`backend file not found: ${backendFile}`)
  }

  const code = framework.generate(headingTitle(tree), exampleBullets(tree))
  const target = join(dir, framework.generatedFile(parsePath(resolve(file)).name))
  writeFileSync(target, code)

  return 0
}

function generateProject(dir: string): number {
  const config = loadConfig(dir)
  for (const name of readdirSync(config.livingdocs)) {
    if (!name.endsWith('.md')) continue
    generate(join(config.livingdocs, name))
  }
  return 0
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
