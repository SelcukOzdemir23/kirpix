# Quickstart: checking sound-aware edges

## Automated

```sh
KIRPIX_REQUIRE_EVAL=1 ./scripts/check.sh   # needs eval/media (eval/README.md)
```

- `criterion::pauses` and `criterion::placement` unit tests on hand-built levels.
- The evaluation test reads `tr-tedx-kaygi.mp4`, searches "kaygı, endişe" and
  asserts SC-001 (every edge placed or marked, at least four of eight placed,
  no move over 1.5 s), SC-002 (matched lines kept, bounds kept) and SC-003
  (two reads identical).

## By hand

1. Open the Turkish recording; the list area says the sound is being read,
   then nothing.
2. Search "kaygı, endişe". Rows show moves like "başlangıç −0,8 sn"; the first
   candidate says its edges are not on a pause.
3. Cut a placed candidate and listen to its first and last half second
   (SC-005).
4. Open the silent copy used by the 002 tests; search works and the list says
   there is no sound (SC-006).
