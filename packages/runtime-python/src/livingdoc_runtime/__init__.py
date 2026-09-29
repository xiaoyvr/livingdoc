class Entry:
    def __init__(self, name, binding):
        self.name = name
        self.binding = binding


class Binding:
    __slots__ = ("params", "run")

    def __init__(self, params, run):
        object.__setattr__(self, "params", tuple(params))
        object.__setattr__(self, "run", run)

    def __setattr__(self, name, value):
        raise AttributeError(f"binding is frozen: {name}")


class Bindings:
    def __init__(self):
        self._entries = []

    def get(self, name):
        for entry in self._entries:
            if entry.name == name:
                return entry.binding
        raise Exception(f"unknown binding: {name}")

    def bind(self, name, binding):
        if any(entry.name == name for entry in self._entries):
            raise Exception(f"duplicate binding: {name}")
        self._entries.append(
            Entry(name, Binding(binding.params, binding.run))
        )


def create_bindings():
    return Bindings()


# Document-facing surface: bind and run. Backends still use create_bindings + register.
def setup(backend):
    from types import SimpleNamespace

    bindings = create_bindings()
    backend.register(bindings)

    def bind(name, params, run):
        bindings.bind(
            name,
            SimpleNamespace(params=params, run=lambda args: {"result": run(args)}),
        )

    def run(name, args=None):
        return bindings.get(name).run(args or {})["result"]

    return bind, run
