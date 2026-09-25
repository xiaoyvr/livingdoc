// @livingdoc/cli
//
// Programmatic entry point; `bin.ts` is the executable wrapper.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

const markdown = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])

const TOKEN = /\{\{\s*([\s\S]*?)\s*\}\}/g
const BULLET = /^\s*[-*+]\s+(.*)$/
const EXAMPLE = /^\s*Example:\s*$/

export function check(file: string): void {
  const source = readFileSync(file, 'utf8')

  const tree = markdown.parse(source)
  const yamlNode = tree.children.find((node) => node.type === 'yaml')
  const data =
    yamlNode && 'value' in yamlNode
      ? (parseYaml(String(yamlNode.value)) as Record<string, unknown>)
      : {}
  if (!('livingdoc' in data)) return

  const heading = /^#{1,6}\s+(.*)$/m.exec(source)?.[1]?.trim() ?? ''

  const cases: string[] = []
  let inExample = false
  for (const line of source.split(/\r?\n/)) {
    if (EXAMPLE.test(line)) {
      inExample = true
      continue
    }
    const bullet = BULLET.exec(line)
    if (bullet && inExample) cases.push((bullet[1] ?? '').trim())
  }

  const output = [`describe(${JSON.stringify(heading)}, () => {`]
  for (const bullet of cases) {
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
