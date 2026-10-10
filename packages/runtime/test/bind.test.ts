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

  it('rejects binding a name already bound', () => {
    bind('a-unique-name', [], () => 1)

    expect(() => bind('a-unique-name', [], () => 2)).toThrow(/duplicate/i)
  })

  it('rejects running a name that is not bound', () => {
    expect(() => run('nobody-bound-this')).toThrow(/unknown binding/i)
  })
})
