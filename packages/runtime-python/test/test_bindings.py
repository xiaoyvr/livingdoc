import unittest
from types import SimpleNamespace

from livingdoc_runtime import create_bindings


def binding(params, run):
    return SimpleNamespace(params=params, run=run)


class CreateBindingsTest(unittest.TestCase):
    def test_lets_a_case_use_a_bound_binding(self):
        bindings = create_bindings()
        bindings.bind(
            "applying-a-discount",
            binding(
                ["code", "total"],
                lambda args: {"result": args["total"] * 0.9},
            ),
        )

        outputs = bindings.get("applying-a-discount").run(
            {"code": "SAVE10", "total": 100},
        )

        self.assertEqual(outputs["result"], 90)

    def test_one_files_bindings_do_not_affect_anothers(self):
        one = create_bindings()
        another = create_bindings()

        one.bind("inline", binding([], lambda args: {"result": 1}))

        with self.assertRaisesRegex(Exception, r"unknown binding|no binding|not bound"):
            another.get("inline")

    def test_rejects_binding_a_name_already_present(self):
        bindings = create_bindings()
        bindings.bind(
            "applying-a-discount",
            binding(["total"], lambda args: {"result": args["total"]}),
        )

        with self.assertRaisesRegex(Exception, r"already bound|duplicate"):
            bindings.bind("applying-a-discount", binding([], lambda args: {"result": 0}))

        bindings.bind("inline", binding([], lambda args: {"result": 1}))

        with self.assertRaisesRegex(Exception, r"already bound|duplicate"):
            bindings.bind("inline", binding([], lambda args: {"result": 2}))

    def test_rejects_using_a_name_that_is_not_bound(self):
        bindings = create_bindings()

        with self.assertRaisesRegex(Exception, r"unknown binding|no binding|not bound"):
            bindings.get("missing").run({})


if __name__ == "__main__":
    unittest.main()
