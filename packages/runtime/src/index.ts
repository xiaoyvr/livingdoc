export type Outputs = {
  result: unknown
}

export type Binding<
  Args extends Record<string, unknown> = Record<string, unknown>,
  Result = Outputs,
> = {
  params: ReadonlyArray<Extract<keyof Args, string>>
  run: (args: Args) => Result
}

type Entry = {
  name: string
  binding: Binding
}

export type Bindings = {
  get(name: string): Binding
  bind<Args extends Record<string, unknown>, Result>(
    name: string,
    binding: Binding<Args, Result>,
  ): void
}

const snapshot = <Args extends Record<string, unknown>, Result>(
  binding: Binding<Args, Result>,
): Binding<Args, Result> =>
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

  const bind = <Args extends Record<string, unknown>, Result>(
    name: string,
    binding: Binding<Args, Result>,
  ): void => {
    if (entries.some((entry) => entry.name === name)) {
      throw new Error(`duplicate binding: ${name}`)
    }
    entries.push({
      name,
      binding: snapshot(binding) as unknown as Binding,
    })
  }

  return { get, bind }
}

// Module-level consumer surface: a backend index binds into one registry for
// the process, and its generated tests run through it.
const registry = new Map<string, (args: Record<string, unknown>) => unknown>()

export const bind = (
  name: string,
  params: ReadonlyArray<string>,
  run: (args: Record<string, unknown>) => unknown,
): void => {
  if (registry.has(name)) throw new Error(`duplicate binding: ${name}`)
  registry.set(name, run)
}

export const run = (
  name: string,
  args: Record<string, unknown> = {},
): unknown => {
  const found = registry.get(name)
  if (!found) throw new Error(`unknown binding: ${name}`)
  return found(args)
}
