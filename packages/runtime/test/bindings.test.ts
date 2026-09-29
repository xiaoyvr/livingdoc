import { describe, expect, it } from 'vitest'
import { createBindings, setup } from '@livingdoc/runtime'

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

  it('does not let a binding change after it is bound', () => {
    const bindings = createBindings()
    const params = ['total']
    const binding = {
      params,
      run: () => ({ result: 1 }),
    }

    bindings.bind('fixed', binding)

    binding.run = () => ({ result: 99 })
    params.push('extra')

    const stored = bindings.get('fixed')
    expect(stored.run({})).toEqual({ result: 1 })
    expect(stored.params).toEqual(['total'])
    expect(() => {
      stored.run = () => ({ result: 0 })
    }).toThrow()
    expect(() => {
      ;(stored.params as string[]).push('nope')
    }).toThrow()
  })
})

describe('setup', () => {
  it('lets a case use setup bind and run', () => {
    const backend = {
      register(bindings: ReturnType<typeof createBindings>) {
        bindings.bind('applying-a-discount', {
          params: ['code', 'total'],
          run({ code, total }: { code: string; total: number }) {
            return { result: total * 0.9 }
          },
        })
      },
    }
    const { run } = setup(backend)

    expect(run('applying-a-discount', { code: 'SAVE10', total: 100 })).toBe(90)
  })

  it('lets a document bind without seeing bindings', () => {
    const backend = { register() {} }
    const { bind, run } = setup(backend)

    bind('inline', ['code'], (args) => args.code)

    expect(run('inline', { code: 'SAVE10' })).toBe('SAVE10')
  })
})
