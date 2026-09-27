// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, parse as parsePath, resolve } from 'node:path'
import type { Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { parse as parseToml } from 'smol-toml'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

export function check(file?: string): number {
  if (!file) return checkProject(process.cwd())

  const config = loadConfig(dirname(resolve(file)))
  const source = readFileSync(file, 'utf8')
  const tree = markdown.parse(source)

  if (!isOptedIn(frontmatter(tree))) return 0

  const backend = resolveBackend(config)
  const code = generateTest(headingTitle(tree), exampleBullets(tree), backend)
  const target = generatedPath(file, config)
  writeFileSync(target, code)

  return runCheck(target)
}

function checkProject(dir: string): number {
  const config = loadConfig(dir)
  let code = 0
  for (const name of readdirSync(config.livingdocs)) {
    if (!name.endsWith('.md')) continue
    code = check(join(config.livingdocs, name)) || code
  }
  return code
}

interface Config {
  root: string
  livingdocs: string
  backend: string
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
      const { livingdocs, backend } = data
      if (typeof livingdocs !== 'string' || typeof backend !== 'string') {
        throw new Error(`${candidate}: livingdocs and backend must be strings`)
      }
      if (isAbsolute(livingdocs) || isAbsolute(backend)) {
        throw new Error(
          `${candidate}: livingdocs and backend must be relative to the config file`,
        )
      }
      const livingdocsDir = join(dir, livingdocs)
      if (!existsSync(livingdocsDir)) {
        throw new Error(`livingdocs folder not found: ${livingdocsDir}`)
      }
      return { root: dir, livingdocs: livingdocsDir, backend: join(dir, backend) }
    }
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`no livingdoc.toml found from ${from}`)
    dir = parent
  }
}

function resolveBackend(config: Config): string {
  if (!existsSync(config.backend)) {
    throw new Error(`backend folder not found: ${config.backend}`)
  }
  const matches = readdirSync(config.backend).filter((name) =>
    name.startsWith('livingdoc.backend.'),
  )
  const file = matches[0]
  if (matches.length !== 1 || !file) {
    throw new Error(
      `${config.backend}: expected exactly one livingdoc.backend.* file`,
    )
  }
  return join(config.backend, file)
}

function frontmatter(tree: Root): Record<string, unknown> {
  const node = tree.children.find((child) => child.type === 'yaml')
  return node && 'value' in node
    ? (parseYaml(String(node.value)) as Record<string, unknown>)
    : {}
}

function isOptedIn(data: Record<string, unknown>): boolean {
  return 'livingdoc' in data
}

function headingTitle(tree: Root): string {
  const heading = tree.children.find((node) => node.type === 'heading')
  return heading ? plainText(heading) : ''
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function exampleBullets(tree: Root): Nodes[] {
  const index = tree.children.findIndex(
    (node) => node.type === 'paragraph' && plainText(node).trim() === 'Example:',
  )
  if (index === -1) return []
  const next = tree.children[index + 1]
  if (!next || next.type !== 'list') return []
  return next.children
}

type Token =
  | { kind: 'input'; name: string; value: string }
  | { kind: 'assertion'; verb: string; args: string }

function generateTest(title: string, bullets: Nodes[], backend: string): string {
  const tokens = bullets.flatMap((bullet) => bulletTokens(bullet))
  const hasAssertion = tokens.some((token) => token.kind === 'assertion')
  const vitest = ['describe', ...(hasAssertion ? ['expect'] : []), 'it']
  const output = [`import { ${vitest.join(', ')} } from 'vitest'`]
  if (bullets.length > 0) {
    output.push(`import { bindings } from './${parsePath(backend).name}'`)
  }
  output.push('', `describe(${JSON.stringify(title)}, () => {`)
  for (const bullet of bullets) {
    output.push(`  it(${JSON.stringify(bulletTitle(bullet))}, () => {`)
    const bulletTokensList = bulletTokens(bullet)
    const inputs = bulletTokensList.filter(
      (token): token is Extract<Token, { kind: 'input' }> => token.kind === 'input',
    )
    for (const input of inputs) {
      output.push(`    const ${input.name} = ${input.value}`)
    }
    const args = inputs.map((input) => input.name).join(', ')
    output.push(
      `    const outputs = bindings[${JSON.stringify(slugify(title))}].run({ ${args} })`,
    )
    for (const token of bulletTokensList) {
      if (token.kind === 'assertion') {
        output.push(`    expect(outputs.result).${token.verb}(${token.args})`)
      }
    }
    output.push('  })')
  }
  output.push('})')
  return `${output.join('\n')}\n`
}

function generatedPath(file: string, config: Config): string {
  return join(config.backend, `${parsePath(resolve(file)).name}.test.ts`)
}

function runCheck(testFile: string): number {
  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--root', dirname(testFile), basename(testFile)],
    { encoding: 'utf8' },
  )
  return result.status ?? 1
}

function plainText(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node) {
    return node.children.map((child) => plainText(child)).join('')
  }
  return ''
}

function bulletTitle(item: Nodes): string {
  let out = ''
  let pending: 'input' | 'assertion' | undefined
  for (const node of flattenInline(item)) {
    if (node.type === 'text') {
      const input = node.value.match(/([A-Za-z_]\w*)\s*:=$/)
      if (/!!$/.test(node.value)) {
        pending = 'assertion'
        out += node.value.slice(0, -2)
      } else if (input) {
        pending = 'input'
        out += `${node.value.slice(0, input.index ?? 0)}${input[1] ?? ''} `
      } else {
        pending = undefined
        out += node.value
      }
    } else if (node.type === 'inlineCode') {
      out += pending === 'input' ? unquote(node.value.trim()) : node.value.trim()
      pending = undefined
    } else {
      pending = undefined
      out += plainText(node)
    }
  }
  return out.trim()
}

function bulletTokens(item: Nodes): Token[] {
  const parsed: Token[] = []
  let pending:
    | { kind: 'input'; name: string }
    | { kind: 'assertion' }
    | undefined
  for (const node of flattenInline(item)) {
    if (node.type === 'text') {
      const input = node.value.match(/([A-Za-z_]\w*)\s*:=$/)
      if (/!!$/.test(node.value)) {
        pending = { kind: 'assertion' }
      } else if (input?.[1]) {
        pending = { kind: 'input', name: input[1] }
      } else {
        pending = undefined
      }
    } else if (node.type === 'inlineCode') {
      if (pending?.kind === 'assertion') {
        const [verb, ...rest] = node.value.trim().split(/\s+/)
        if (verb) parsed.push({ kind: 'assertion', verb, args: rest.join(' ') })
      } else if (pending?.kind === 'input') {
        parsed.push({ kind: 'input', name: pending.name, value: node.value })
      }
      pending = undefined
    } else {
      pending = undefined
    }
  }
  return parsed
}

function flattenInline(node: Nodes): Nodes[] {
  if ('children' in node) return node.children.flatMap(flattenInline)
  return [node]
}

function unquote(value: string): string {
  const first = value[0]
  const last = value[value.length - 1]
  return (first === '"' || first === "'") && first === last
    ? value.slice(1, -1)
    : value
}
