# authoring

Written-artifact production and maintenance: getting prose from nothing to published, and
keeping already-published prose true to the code it describes.

## Processes

- `documenter.js` (`@process specializations/authoring/documenter`)
  — Documenter persona. Scans existing docs -> detects drift vs current code -> drafts
  updates following a5c documentation guidelines (hierarchy, active voice, real examples,
  chunked info, cross-links, defined acronyms, listed prerequisites) -> opens a docs PR.
- `editorial-lifecycle.js` (`@process specializations/authoring/editorial-lifecycle`)
  — Full editorial lifecycle for long-form written work: outline -> draft -> self-edit ->
  fact-check -> developmental-edit (via breakpoint) -> copy-edit -> legal check -> publish
  -> track revision requests. Unified workflow; no fragmented per-role processes.

The two processes are independent: neither composes the other, and they share no
composition chain. `documenter.js` maintains existing docs against code; `editorial-lifecycle.js`
carries a new long-form piece end to end.

## Assets

None. This specialization has no agents and no skills, matching the shape of
[`../developer-relations/`](../developer-relations/README.md) — a small, correctly-formed
specialization is allowed to be README-only.

---

Descriptions in this README are transcribed from the files' own `@description` headers,
not invented.
