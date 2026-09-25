// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

const TOKEN = /\{\{\s*([\s\S]*?)\s*\}\}/g

export function check(file: string): void {
  const source = readFileSync(file, 'utf8')
  const tree = markdown.parse(source)

  const yaml = tree.children.find((node) => node.type === 'yaml')
  const data =
    yaml && 'value' in yaml
      ? (parseYaml(String(yaml.value)) as Record<string, unknown>)
      : {}
  if (!('livingdoc' in data)) return

  const heading = tree.children.find((node) => node.type === 'heading')
  const title = heading ? textOf(heading) : ''

  const output = [`describe(${JSON.stringify(title)}, () => {`]
  for (const bullet of exampleBullets(tree)) {
    output.push(`  it(${JSON.stringify(render(bullet))}, () => {`)
    for (const input of inputs(bullet)) {
      output.push(`    const ${input.name} = ${input.value}`)
    }
    output.push('  })')
  }
  output.push('})')

  const target = join(dirname(resolve(file)), 'livingdoc.test.ts')
  writeFileSync(target, `${output.join('\n')}\n`)
}

function exampleBullets(tree: Root): string[] {
  const index = tree.children.findIndex(
    (node) => node.type === 'paragraph' && textOf(node).trim() === 'Example:',
  )
  if (index === -1) return []
  const next = tree.children[index + 1]
  if (!next || next.type !== 'list') return []
  return next.children.map((item) => textOf(item).trim())
}

function textOf(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node) return node.children.map((child) => textOf(child)).join('')
  return ''
}

function render(text: string): string {
  return text.replace(TOKEN, (_match: string, body: string) => {
    const value = body.slice(body.indexOf(':') + 1).trim()
    const first = value[0]
    const last = value[value.length - 1]
    return (first === '"' || first === "'") && first === last
      ? value.slice(1, -1)
      : value
  })
}

function inputs(text: string): { name: string; value: string }[] {
  const parsed: { name: string; value: string }[] = []
  for (const match of text.matchAll(TOKEN)) {
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
