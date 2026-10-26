// The framework registry: the generators livingdoc knows, one per framework
// name. The backend config's table key selects one.
import type { Nodes } from 'mdast'
import { pytest } from './pytest.js'
import { vitest } from './vitest.js'

export type Framework = {
  name: string
  stub: string
  /** Entry candidates, in precedence order. */
  entry(dir: string): string[]
  /** The file `livingdoc init` creates for a new backend. */
  scaffold(dir: string): string
  generatedFile(name: string): string
  generate(title: string, bullets: Nodes[], appends: string[], backend: string): string
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
