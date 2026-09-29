import { describe, expect, it } from 'vitest'
import { createBindings } from '@livingdoc/runtime'

describe('createBindings', () => {
  it('lets a case use a bound binding', () => {
    const bindings = createBindings()
    bindings.bind('applying-a-discount', {
      params: ['code', 'total'],
      run({ code, total }: { code: string; total: number }) {
        return { result: total * 0.9 }
      },
    })

    const outputs = bindings.get('applying-a-discount').run({
      code: 'SAVE10',
      total: 100,
    })

    expect(outputs.result).toBe(90)
  })

  it("one file's bindings do not affect another's", () => {
    const one = createBindings()
    const another = createBindings()

    one.bind('inline', {
      params: [],
      run: () => ({ result: 1 }),
    })

    expect(() => another.get('inline')).toThrow(
      /unknown binding|no binding|not bound/i,
    )
  })

  it('rejects binding a name already present', () => {
    const bindings = createBindings()
    bindings.bind('applying-a-discount', {
      params: ['total'],
      run({ total }: { total: number }) {
        return { result: total }
      },
    })

    expect(() =>
      bindings.bind('applying-a-discount', {
        params: [],
        run: () => ({ result: 0 }),
      }),
    ).toThrow(/already bound|duplicate/i)

    bindings.bind('inline', {
      params: [],
      run: () => ({ result: 1 }),
    })

    expect(() =>
      bindings.bind('inline', {
        params: [],
        run: () => ({ result: 2 }),
      }),
    ).toThrow(/already bound|duplicate/i)
  })

  it('rejects using a name that is not bound', () => {
    const bindings = createBindings()

    expect(() => bindings.get('missing').run({})).toThrow(
      /unknown binding|no binding|not bound/i,
    )
  })
})
