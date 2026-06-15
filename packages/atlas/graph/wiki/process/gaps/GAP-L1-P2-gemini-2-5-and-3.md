---
id: page:process-gaps-GAP-L1-P2-gemini-2-5-and-3
nodeKind: Page
title: "GAP-L1-P2-gemini-2-5-and-3"
slug: "process/gaps/GAP-L1-P2-gemini-2-5-and-3"
articlePath: "wiki/process/gaps/GAP-L1-P2-gemini-2-5-and-3.md"
documents: []
---
# GAP-L1-P2-gemini-2-5-and-3

| Field | Value |
|---|---|
| id | gap:gemini-2-5-and-3 |
| title | Gemini 2.5 Pro present; Gemini 3 family + Gemini CLI hook surfaces missing |
| level | 1 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | ai.google.dev/gemini-api/docs/models |
| status | open |
| owner | tbd |

## Current state
- `schema/examples/compute/models/gemini-2-5-pro.yaml` exists.
- No examples for gemini-2.5-flash, gemini-3-pro, gemini-exp-1206, learnlm.
- Gemini CLI's hooks (`PrePromptSubmit`, `OnToolCall`) are partly captured under `channels-hooks/hook-surfaces/native/gemini-pre-prompt.yaml` but the full set is incomplete.

## Desired state
- Add 3 ModelVersion examples for Gemini family.
- Audit Gemini CLI native hooks against current `gemini-cli` repo and add missing surfaces.

## Evidence
- ai.google.dev/gemini-api/docs/models
- packages/agent-catalog/graph/nodes/hooks-and-plugins/

## Propagation status
- Level 1: open
- Level 2: not-started

## Propagation chain
- Level 1: 3 ModelVersion + 2 HookSurface example files.

## Notes
Lower-impact catalog completeness gap.
