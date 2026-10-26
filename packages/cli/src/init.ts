// `livingdoc init`: scaffold each backend's folder and inert index.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './config.js'
import type { DomainError } from './errors.js'
import type { Result } from './result.js'

export function init(start: string = process.cwd()): Result<void, DomainError> {
  const config = loadConfig(start)
  if (!config.ok) return config

  for (const backend of config.value.backends) {
    const dir = join(config.value.codePath, backend.name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, `backend.${backend.framework.extension}`),
      backend.framework.stub,
    )
  }
  return { ok: true, value: undefined }
}
