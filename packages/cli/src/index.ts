// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, parse as parsePath, resolve } from 'node:path'
import type { Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { parse as parseToml } from 'smol-toml'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

export function generate(file?: string): number {
  if (!file) return generateProject(process.cwd())

  const config = loadConfig(dirname(resolve(file)))
  const source = readFileSync(file, 'utf8')
  const tree = markdown.parse(source)

  if (!isOptedIn(frontmatter(tree))) return 0

  const backend = resolveBackend(config)
  const code = generateTest(headingTitle(tree), exampleBullets(tree), backend)
  writeFileSync(generatedPath(file, config), code)

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
  | { kind: 'input'; name: string; value: string; literal?: boolean }
  | { kind: 'assertion'; verb: string; args: string }

type Part =
  | { type: 'text'; value: string }
  | { type: 'inlineCode'; value: string }
  | { type: 'fencedCode'; value: string; info: string }

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
      const value = input.literal ? JSON.stringify(input.value) : input.value
      output.push(`    const ${input.name} = ${value}`)
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
  for (const part of parts(item)) {
    if (part.type === 'text') {
      const input = part.value.match(/([A-Za-z_]\w*)\s*:=$/)
      if (/!!$/.test(part.value)) {
        pending = 'assertion'
        out += part.value.slice(0, -2)
      } else if (input) {
        pending = 'input'
        out += `${part.value.slice(0, input.index ?? 0)}${input[1] ?? ''} `
      } else {
        pending = undefined
        out += part.value
      }
    } else if (part.type === 'inlineCode') {
      out += pending === 'input' ? unquote(part.value.trim()) : part.value.trim()
      pending = undefined
    } else {
      pending = undefined
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
  for (const part of parts(item)) {
    if (part.type === 'text') {
      const input = part.value.match(/([A-Za-z_]\w*)\s*:=$/)
      if (/!!$/.test(part.value)) {
        pending = { kind: 'assertion' }
      } else if (input?.[1]) {
        pending = { kind: 'input', name: input[1] }
      } else {
        pending = undefined
      }
    } else if (part.type === 'inlineCode') {
      if (pending?.kind === 'assertion') {
        const [verb, ...rest] = part.value.trim().split(/\s+/)
        if (verb) parsed.push({ kind: 'assertion', verb, args: rest.join(' ') })
      } else if (pending?.kind === 'input') {
        parsed.push({ kind: 'input', name: pending.name, value: part.value })
      }
      pending = undefined
    } else if (part.type === 'fencedCode') {
      const input = part.info.match(/([A-Za-z_]\w*)\s*:=$/)
      if (input?.[1]) {
        parsed.push({
          kind: 'input',
          name: input[1],
          value: part.value,
          literal: true,
        })
      }
      pending = undefined
    }
  }
  return parsed
}

function parts(node: Nodes): Part[] {
  if (node.type === 'code') {
    const info = [node.lang, node.meta].filter(Boolean).join(' ')
    return [{ type: 'fencedCode', value: node.value, info }]
  }
  if (node.type === 'inlineCode') return [{ type: 'inlineCode', value: node.value }]
  if (node.type === 'text') return [{ type: 'text', value: node.value }]
  if ('children' in node) return node.children.flatMap(parts)
  return []
}

function unquote(value: string): string {
  const first = value[0]
  const last = value[value.length - 1]
  return (first === '"' || first === "'") && first === last
    ? value.slice(1, -1)
    : value
}
