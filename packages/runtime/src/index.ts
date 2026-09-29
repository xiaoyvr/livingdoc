export type Binding = {
  params: readonly string[]
  run: (args: Record<string, unknown>) => unknown
}

type Entry = {
  name: string
  binding: Binding
}

export type Bindings = {
  get(name: string): Binding
  bind(name: string, binding: Binding): void
}

const snapshot = (binding: Binding): Binding =>
  Object.freeze({
    params: Object.freeze([...binding.params]),
    run: binding.run,
  })

export const createBindings = (): Bindings => {
  const entries: Entry[] = []

  const get = (name: string): Binding => {
    const found = entries.find((entry) => entry.name === name)
    if (!found) throw new Error(`unknown binding: ${name}`)
    return found.binding
  }

  const bind = (name: string, binding: Binding): void => {
    if (entries.some((entry) => entry.name === name)) {
      throw new Error(`duplicate binding: ${name}`)
    }
    entries.push({ name, binding: snapshot(binding) })
  }

  return { get, bind }
}
