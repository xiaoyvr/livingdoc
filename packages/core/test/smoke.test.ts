import { describe, expect, it } from 'vitest'
import * as core from '@livingdoc/core'

describe('@livingdoc/core', () => {
  it('is importable from the workspace', () => {
    expect(core).toBeTypeOf('object')
  })
})
