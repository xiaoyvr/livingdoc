import { describe, expect, it } from 'vitest'
import * as cli from '@livingdoc/cli'

describe('@livingdoc/cli', () => {
  it('is importable from the workspace', () => {
    expect(cli).toBeTypeOf('object')
  })
})
