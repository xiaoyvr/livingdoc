// Compile-only checks that bind ties params to run's argument type.
import { createBindings } from './index.js'

const bindings = createBindings()

bindings.bind('ok', {
  params: ['doc'],
  run({ doc }: { doc: string }) {
    return { result: doc }
  },
})

bindings.bind('bad', {
  // @ts-expect-error params must be keys of run's argument type
  params: ['doc'],
  run({ other }: { other: string }) {
    return { result: other }
  },
})
