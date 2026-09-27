// The framework registry: a generator per framework name. The backend config's
// table key selects one.
import type { Nodes } from 'mdast'
import { vitest } from './vitest.js'

export interface Framework {
  extension: string
  generatedFile(doc: string): string
  generate(title: string, bullets: Nodes[]): string
}

export const frameworks: Record<string, Framework> = { vitest }
