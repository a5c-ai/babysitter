---
id: page:process-gaps-GAP-L1-P1-adaptive-thinking-vs-extended-thinking
nodeKind: Page
title: "GAP-L1-P1-adaptive-thinking-vs-extended-thinking"
slug: "process/gaps/GAP-L1-P1-adaptive-thinking-vs-extended-thinking"
articlePath: "wiki/process/gaps/GAP-L1-P1-adaptive-thinking-vs-extended-thinking.md"
documents: []
---
# GAP-L1-P1-adaptive-thinking-vs-extended-thinking

| Field | Value |
|---|---|
| id | gap:adaptive-thinking-vs-extended-thinking |
| title | Adaptive thinking (Claude 4.6/4.7) vs extended thinking conflated under one supportsThinking flag |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking |
| status | open |
| owner | tbd |

## Current state
`ModelVersion.supportsThinking: bool` + `thinkingEffortLevels` + `supportsThinkingBudgetTokens`. Anthropic now ships TWO distinct thinking modes:
- **Extended thinking** — explicit budget/effort, visible thinking blocks, available on Sonnet 4.6 / Haiku 4.5 / older Opus.
- **Adaptive thinking** — model auto-decides depth, available on Opus 4.7 + Sonnet 4.6, NOT on Haiku 4.5. Opus 4.7 has adaptive but **not** extended thinking.

The current single boolean cannot represent "Opus 4.7 has adaptive but no extended thinking".

## Desired state
Replace `supportsThinking: bool` with two booleans (or an enum-set):
- `supportsExtendedThinking: bool`
- `supportsAdaptiveThinking: bool`
- Update invariant: `thinkingEffortLevels` requires `supportsExtendedThinking`; `supportsThinkingBudgetTokens` requires `supportsExtendedThinking`.

## Evidence
- https://platform.claude.com/docs/en/docs/about-claude/models/overview (Opus 4.7 row: Extended=No, Adaptive=Yes)
- https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- https://platform.claude.com/docs/en/build-with-claude/extended-thinking

## Propagation status
- Level 1: open
- Level 2: not-started — invariants.yaml + 02-node-kinds/compute-path.md need updates

## Propagation chain
- Level 1: split attribute, update 3 example model files.
- Level 2: update validation rules referencing thinking-related invariants.

## Notes
Real-world divergence the schema cannot currently encode.
