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

  const target = join(dirname(resolve(file)), 'livingdoc.test.ts')
  writeFileSync(target, `describe(${JSON.stringify(heading)}, () => {\n})\n`)
}
