---
name: six-dimension-code-review
description: Structured pull-request review across six fixed dimensions — correctness, clarity, consistency, coverage, complexity, and change-scope — producing a per-dimension verdict plus severity-tagged findings. Use when reviewing a PR diff or running the collaboration PR lifecycles.
allowed-tools:
  - Read
  - Glob
  - Grep
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:collaboration]
  skillAreas: [skill-area:code-review-practice]
  roles: [role:tech-lead, role:backend-engineer]
  workflows: [workflow:pull-request-lifecycle]
---

# Six-Dimension Code Review

The rubric hardcoded as the `DIMENSIONS` array in
[`../../code-review/six-dimension-review.js`](../../code-review/six-dimension-review.js)
(`@process specializations/collaboration/code-review/six-dimension-review`) and depended on
by [`../../github/pr-lifecycle-feature.js`](../../github/pr-lifecycle-feature.js). Each
dimension is reviewed independently and in parallel; one lens per pass.

## The six dimensions

- **correctness** — Does the code do what the PR claims? Any logical bugs, off-by-one,
  race conditions, null/undef hazards, error-path gaps?
- **clarity** — Is intent obvious from the code? Names, structure, comments where
  non-obvious. Flag cleverness that sacrifices readability.
- **consistency** — Does the change match existing patterns, conventions, and
  architectural boundaries in the repo?
- **coverage** — Are there tests for the new behavior? Do existing tests still exercise
  the right paths? Any coverage gaps for edge cases?
- **complexity** — Is the solution as simple as it can be? Any over-engineering,
  premature abstraction, unused flexibility?
- **change-scope** — Is the PR focused on one concern? Any drive-by edits, mixed
  refactor+feature, or churn that belongs in a separate PR?

## Output shape

Each dimension pass returns:

```json
{
  "findings": [
    {
      "severity": "block",
      "path": "src/example.ts",
      "line": 42,
      "detail": "…",
      "suggestion": "…"
    }
  ],
  "summary": "string"
}
```

`severity` is one of `block`, `nit`, or `info`. The process aggregates the six passes
into a per-dimension verdict map plus two flattened lists — `blockingFindings` (every
`block` finding, tagged with its dimension) and `nits` (every `nit` finding, likewise
tagged) — and a joined `summary`. The review succeeds only when `blockingFindings` is
empty.

## Related

[`../../code-review/validator.js`](../../code-review/validator.js) uses a different,
broader dimension set — `quality`, `architecture`, `tests`, `security`, `ux`, `business` —
and materialises non-blocking findings as deferred debt on disk. This skill documents the
six-dimension rubric only; the two are not interchangeable.
