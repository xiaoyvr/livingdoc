import { describe, expect, it } from 'vitest'
import * as adapter from '@livingdoc/adapter-vitest'

describe('@livingdoc/adapter-vitest', () => {
  it('is importable from the workspace', () => {
    expect(adapter).toBeTypeOf('object')
  })
})
