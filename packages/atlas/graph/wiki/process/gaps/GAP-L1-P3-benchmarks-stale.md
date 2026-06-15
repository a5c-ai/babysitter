---
id: page:process-gaps-GAP-L1-P3-benchmarks-stale
nodeKind: Page
title: "GAP-L1-P3-benchmarks-stale"
slug: "process/gaps/GAP-L1-P3-benchmarks-stale"
articlePath: "wiki/process/gaps/GAP-L1-P3-benchmarks-stale.md"
documents: []
---
# GAP-L1-P3-benchmarks-stale

| Field | Value |
|---|---|
| id | gap:benchmarks-stale |
| title | Benchmark NodeKind has no current SWE-bench Verified, Aider Polyglot, ARC-AGI 2 examples |
| level | 1 |
| priority | P3 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | schema/examples/benchmarks/ |
| status | open |
| owner | tbd |

## Current state
`schema/examples/benchmarks/` directory absent or sparse. Coverage-checklist OpenQuestion "Benchmark-run primitives at SDK layer" is unresolved. Major 2025/2026 benchmarks not represented:
- SWE-bench Verified (current de-facto coding agent benchmark)
- Aider Polyglot
- ARC-AGI 2
- Terminal-Bench
- HumanEval/MBPP (older, but still cited)

## Desired state
Add 5 `Benchmark` example files; add `EvalRun` examples for at least Claude Opus 4.7 and gpt-5-codex on SWE-bench Verified to demonstrate the eval graph.

## Evidence
- swebench.com
- arcprize.org
- aider.chat/docs/leaderboards/

## Propagation status
- Level 1: open
- Level 2: not-started

## Propagation chain
- Level 1: 5 example files + 2 EvalRun example files.

## Notes
P3 — important for usefulness but not for schema correctness.
