// Markdown parsing and the token model. Framework generators read this and turn
// it into target code; nothing here is framework-specific.
import type { Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

export function parseMarkdown(source: string): Root {
  return markdown.parse(source)
}

export function frontmatter(tree: Root): Record<string, unknown> {
  const node = tree.children.find((child) => child.type === 'yaml')
  return node && 'value' in node
    ? (parseYaml(String(node.value)) as Record<string, unknown>)
    : {}
}

export function isOptedIn(data: Record<string, unknown>): boolean {
  return 'livingdoc' in data
}

export function headingTitle(tree: Root): string {
  const heading = tree.children.find((node) => node.type === 'heading')
  return heading ? plainText(heading) : ''
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export interface ExampleGroup {
  backend?: string
  bullets: Nodes[]
}

export function exampleGroups(tree: Root): ExampleGroup[] {
  const groups: ExampleGroup[] = []
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i]
    if (node?.type !== 'paragraph') continue
    const match = plainText(node)
      .trim()
      .match(/^Example\s*(?:\(([^)]+)\))?:$/)
    if (!match) continue
    const list = tree.children[i + 1]
    groups.push({
      backend: match[1]?.trim(),
      bullets: list && list.type === 'list' ? list.children : [],
    })
  }
  return groups
}

// Heading-level fences whose info ends with `>>` (optional language before it).
// Their content is appended verbatim into the generated describe/class.
export function appendBlocks(tree: Root): string[] {
  const blocks: string[] = []
  for (const node of tree.children) {
    if (node.type !== 'code') continue
    const info = [node.lang, node.meta].filter(Boolean).join(' ').trim()
    if (!/(?:^|\s)>>$/.test(info)) continue
    blocks.push(node.value)
  }
  return blocks
}

export type Token =
  | { kind: 'input'; name: string; value: string; literal?: boolean }
  | { kind: 'assertion'; verb: string; args: string }

type Part =
  | { type: 'text'; value: string }
  | { type: 'inlineCode'; value: string }
  | { type: 'fencedCode'; value: string; info: string }

export function bulletTitle(item: Nodes): string {
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

export function bulletTokens(item: Nodes): Token[] {
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

function plainText(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node) {
    return node.children.map((child) => plainText(child)).join('')
  }
  return ''
}

function unquote(value: string): string {
  const first = value[0]
  const last = value[value.length - 1]
  return (first === '"' || first === "'") && first === last
    ? value.slice(1, -1)
    : value
}
