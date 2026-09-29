class Bindings:
    def __init__(self, backend):
        self._entries = dict(backend)

    def bind(self, name, binding):
        if name in self._entries:
            raise Exception(f"duplicate binding: {name}")
        self._entries[name] = binding

    def __getitem__(self, name):
        if name not in self._entries:
            raise Exception(f"unknown binding: {name}")
        return self._entries[name]


def create_bindings(backend):
    return Bindings(backend)
