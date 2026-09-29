---
livingdoc: true
---

# What a document means

A document is Markdown. Two marked forms carry meaning, and every other code
span is prose:

- an input, `name :=`expr``, binds the name to the expression;
- an assertion, `!!`verb args``, asserts the verb on the case's result.

The cases below are a small checkout — applying a discount — so the marks sit
in ordinary product prose. The heading's slug is the binding; `>>` defines it
in this document:

```ts >>
bind('what-a-document-means', ['code', 'total'], ({ code, total }) =>
  code === 'SAVE10' ? total * 0.9 : total,
)
```

`Example:` opens a group; each bullet is one case.

Example:

- applying a code :=`"SAVE10"` to a total :=`100` cart, the total !!`toBe 90`
- applying a code :=`"NONE"` to a total :=`100` cart, the total !!`toBe total`
