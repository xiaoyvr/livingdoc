---
livingdoc: true
---

# What a document means

Under pytest, the same marks generate Python: an input becomes an assignment,
an assertion becomes `assert result …`, and a plain code span stays prose.

The cases below are a small checkout — applying a discount — so the marks sit
in ordinary product prose. The heading's slug is the binding; `>>` defines it
in this document:

```python >>
bind(
    "what-a-document-means",
    ["code", "total"],
    lambda args: args["total"] * 0.9 if args["code"] == "SAVE10" else args["total"],
)
```

Example (pytest):

- applying a code :=`"SAVE10"` to a total :=`100` cart, the total !!`== total * 0.9`
- applying a code :=`"NONE"` to a total :=`100` cart, the total !!`== total`
- applying a code :=`"SAVE10"` to a total :=`100` cart — then run `git commit` — the total !!`== total * 0.9`
