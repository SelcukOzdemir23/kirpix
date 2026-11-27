# Contract: the one changed command

Every other command keeps its name, arguments, result and trigger (FR-014).

## `session_cues`

```text
session_cues(from: usize, to: usize, terms?: string[]) -> Cue[]

Cue = { index, startMs, endMs, text, marks: [number, number][] }
```

- `terms` absent or empty: `marks` is `[]` for every cue. Existing callers are
  unaffected.
- `terms` present: for each cue, `marks` holds the spans of `text` whose token
  matches a term under the search's rule (001 FR-006, FR-007), computed by
  `criterion::marks::term_spans`.
- Offsets are UTF-16 code units, so `text.slice(start, end)` in the interface is
  the marked word.
- Spans are sorted and do not overlap; a token matching two terms is one span.
- Invariant (tested over both fixtures, SC-004): a cue has a non-empty `marks`
  exactly when the topic search counts it as a matching cue for those terms.
