type Binding = {
  params: string[]
  run: (args: never) => unknown
}

export const createBindings = (backend: Record<string, Binding>) => {
  const entries: Record<string, Binding> = { ...backend }

  const bindings = {
    bind(name: string, binding: Binding) {
      if (name in entries) {
        throw new Error(`duplicate binding: ${name}`)
      }
      entries[name] = binding
    },
  }

  return new Proxy(bindings, {
    get(target, prop, receiver) {
      if (prop === 'bind') return Reflect.get(target, prop, receiver)
      if (typeof prop === 'symbol') return Reflect.get(entries, prop, receiver)
      if (prop in entries) return entries[prop]
      throw new Error(`unknown binding: ${String(prop)}`)
    },
    has(_target, prop) {
      return prop === 'bind' || prop in entries
    },
  })
}
