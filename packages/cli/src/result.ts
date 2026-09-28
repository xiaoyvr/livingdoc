// A domain result. Expected failures are values, not exceptions; only
// unexpected environment failures (disk full, out of memory) throw.
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }
