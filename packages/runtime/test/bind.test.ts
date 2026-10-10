import { describe, expect, it } from 'vitest'
import { bind, run } from '@livingdoc/runtime'

describe('bind / run', () => {
  it('lets a case use a bound binding', () => {
    bind('applying-a-discount', ['code', 'total'], ({ code, total }) => {
      void code
      return (total as number) * 0.9
    })

    expect(run('applying-a-discount', { code: 'SAVE10', total: 100 })).toBe(90)
  })
})
