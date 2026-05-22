---
id: page:process-gaps-GAP-L1-P1-cursor-profiles-and-modes
nodeKind: Page
title: "GAP-L1-P1-cursor-profiles-and-modes"
slug: "process/gaps/GAP-L1-P1-cursor-profiles-and-modes"
articlePath: "wiki/process/gaps/GAP-L1-P1-cursor-profiles-and-modes.md"
documents: []
---
# GAP-L1-P1-cursor-profiles-and-modes

| Field | Value |
|---|---|
| id | gap:cursor-profiles-and-modes |
| title | Cursor product surface — Auto/Plan/Composer/Manual modes, Profiles richer than v6 CapabilityProfile |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://cursor.com/docs (Profiles, Modes) |
| status | open |
| owner | tbd |

## Current state
`schema/examples/agent-stack/products/cursor.yaml` is a 16-line stub. `schema/examples/agent-stack/capability-profiles/cursor-default.yaml` and `cursor-cli-permissive.yaml` exist but the `CapabilityProfile` NodeKind only carries `default`, `description`, `overrides` — it cannot express Cursor's mode taxonomy:
- **Auto** — Cursor decides which model
- **Plan / Plan-only** — read-only planning (analogous to Claude Code's Plan Mode)
- **Composer** — multi-file refactor mode
- **Manual** — human-driven only
- **YOLO / Sandbox** mode toggles

These are all `InteractionPrimitive`s in the v6 model, but Cursor's `Profile` is a *bundled selector* over them.

## Desired state
- Extend `CapabilityProfile` with `mode: enum<auto,plan,composer,manual,custom>` and `parentProfile: ref<CapabilityProfile>` (so Cursor's Profile-extends-Profile inheritance is expressible).
- Add `InteractionPrimitive` instances for each Cursor mode with `vendor: cursor`.
- Document that Cursor's Profile is the canonical reference impl for `CapabilityProfile`.

## Evidence
- https://cursor.com/docs (modes section — confirmed via fetch redirect)
- packages/agent-catalog/graph/nodes/agents/ may carry richer Cursor data

## Propagation status
- Level 1: open
- Level 2: not-started — coverage-checklist row "Capability Profile" claims Cursor-Codex divergence is captured "as separate Synonym records" — needs concrete examples

## Propagation chain
- Level 1: extend NodeKind, add 5 InteractionPrimitive examples, expand cursor.yaml example.
- Level 2: capabilities.md gets richer mode taxonomy.

## Notes
Cursor's profile mechanics are the most evolved real-world reference; v6 example is too sparse to be useful.
