export type Binding = {
  params: string[]
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
    entries.push({ name, binding })
  }

  return { get, bind }
}
