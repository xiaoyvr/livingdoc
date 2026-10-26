// `livingdoc init`: scaffold each backend's folder and inert index.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.js'
import type { DomainError } from './errors.js'
import type { Result } from './result.js'

export type InitReport = {
  /** Absolute path. The CLI renders it relative to its working directory. */
  path: string
  state: 'created' | 'exists'
}

export function init(
  start: string = process.cwd(),
): Result<InitReport[], DomainError> {
  const config = loadConfig(start)
  if (!config.ok) return config

  const reports: InitReport[] = []
  for (const backend of config.value.backends) {
    const dir = join(config.value.codePath, backend.name)
    const existing = backend.framework
      .entry(dir)
      .find((candidate) => existsSync(candidate))
    if (existing) {
      reports.push({ path: existing, state: 'exists' })
      continue
    }

    const file = backend.framework.scaffold(dir)
    mkdirSync(dir, { recursive: true })
    try {
      writeFileSync(file, backend.framework.stub, { flag: 'wx' })
      reports.push({ path: file, state: 'created' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      reports.push({ path: file, state: 'exists' })
    }
  }
  return { ok: true, value: reports }
}
