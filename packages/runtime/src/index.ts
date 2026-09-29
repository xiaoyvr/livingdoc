type Binding = {
  params: string[]
  run: (args: never) => unknown
}

export const createBindings = (backend: Record<string, Binding>) => {
  const entries: Record<string, Binding> = { ...backend }
  return Object.assign(entries, {
    bind(name: string, binding: Binding) {
      entries[name] = binding
    },
  })
}
