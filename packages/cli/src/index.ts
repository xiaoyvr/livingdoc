// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import type { Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

const INLINE_TOKEN = /\{\{\s*([\s\S]*?)\s*\}\}/g

export function check(file: string): number {
  const source = readFileSync(file, 'utf8')
  const tree = markdown.parse(source)

  if (!isOptedIn(frontmatter(tree))) return 0

  const code = generateTest(headingTitle(tree), exampleBullets(tree))
  const target = generatedPath(file)
  writeFileSync(target, code)

  return runCheck(target)
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

function exampleBullets(tree: Root): string[] {
  const index = tree.children.findIndex(
    (node) => node.type === 'paragraph' && plainText(node).trim() === 'Example:',
  )
  if (index === -1) return []
  const next = tree.children[index + 1]
  if (!next || next.type !== 'list') return []
  return next.children.map((item) => plainText(item).trim())
}

function generateTest(title: string, bullets: string[]): string {
  const output = [
    "import { describe, it } from 'vitest'",
    '',
    `describe(${JSON.stringify(title)}, () => {`,
  ]
  for (const bullet of bullets) {
    output.push(`  it(${JSON.stringify(bulletTitle(bullet))}, () => {`)
    for (const input of bulletInputs(bullet)) {
      output.push(`    const ${input.name} = ${input.value}`)
    }
    output.push('  })')
  }
  output.push('})')
  return `${output.join('\n')}\n`
}

function generatedPath(file: string): string {
  return join(dirname(resolve(file)), 'livingdoc.test.ts')
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

function bulletTitle(text: string): string {
  return text.replace(INLINE_TOKEN, (_match: string, body: string) => {
    const value = body.slice(body.indexOf(':') + 1).trim()
    const first = value[0]
    const last = value[value.length - 1]
    return (first === '"' || first === "'") && first === last
      ? value.slice(1, -1)
      : value
  })
}

function bulletInputs(text: string): { name: string; value: string }[] {
  const parsed: { name: string; value: string }[] = []
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const body = match[1] ?? ''
    const colon = body.indexOf(':')
    if (colon === -1) continue
    parsed.push({
      name: body.slice(0, colon).trim(),
      value: body.slice(colon + 1).trim(),
    })
  }
  return parsed
}
