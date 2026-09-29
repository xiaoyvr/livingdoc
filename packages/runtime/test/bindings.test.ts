import { describe, expect, it } from 'vitest'
import { createBindings } from '@livingdoc/runtime'

describe('createBindings', () => {
  it('lets a case use a backend binding', () => {
    const backend = {
      'applying-a-discount': {
        params: ['code', 'total'],
        run({ code, total }: { code: string; total: number }) {
          return { result: total * 0.9 }
        },
      },
    }

    const bindings = createBindings(backend)
    const outputs = bindings['applying-a-discount'].run({
      code: 'SAVE10',
      total: 100,
    })

    expect(outputs.result).toBe(90)
  })

  it("one file's bindings do not affect another's", () => {
    const backend = {
      'applying-a-discount': {
        params: ['total'],
        run({ total }: { total: number }) {
          return { result: total }
        },
      },
    }

    const one = createBindings(backend)
    const another = createBindings(backend)

    one.bind('inline', {
      params: [],
      run: () => ({ result: 1 }),
    })

    expect(another['inline']).toBeUndefined()
  })
})
