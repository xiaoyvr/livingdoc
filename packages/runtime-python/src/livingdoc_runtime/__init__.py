class Entry:
    def __init__(self, name, binding):
        self.name = name
        self.binding = binding


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
        self._entries.append(Entry(name, binding))


def create_bindings():
    return Bindings()
