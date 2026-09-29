// The framework registry: the generators livingdoc knows, one per framework
// name. The backend config's table key selects one.
import type { Nodes } from 'mdast'
import { pytest } from './pytest.js'
import { vitest } from './vitest.js'

export type Framework = {
  name: string
  extension: string
  generatedFile(name: string): string
  generate(title: string, bullets: Nodes[]): string
}

export function registry(...list: Framework[]): Framework[] {
  return list
}

export const frameworks = registry(vitest, pytest)

export function has(name: string): boolean {
  return frameworks.some((framework) => framework.name === name)
}

export function find(name: string): Framework | undefined {
  return frameworks.find((framework) => framework.name === name)
}
