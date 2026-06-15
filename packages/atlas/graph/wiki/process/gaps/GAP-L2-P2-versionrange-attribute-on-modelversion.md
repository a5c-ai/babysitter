---
id: page:process-gaps-GAP-L2-P2-versionrange-attribute-on-modelversion
nodeKind: Page
title: "GAP-L2-P2-versionrange-attribute-on-modelversion"
slug: "process/gaps/GAP-L2-P2-versionrange-attribute-on-modelversion"
articlePath: "wiki/process/gaps/GAP-L2-P2-versionrange-attribute-on-modelversion.md"
documents: []
---
# GAP-L2-P2-versionrange-attribute-on-modelversion

| Field | Value |
|---|---|
| id | gap:versionrange-attribute-on-modelversion |
| title | ModelVersion uses versionRange for what is really a single concrete version |
| level | 2 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | schema/examples/compute/models/claude-opus-4-7.yaml |
| status | open |
| owner | tbd |

## Current state
`ModelVersion.versionRange: versionRange` semantically conflates "this version" with "a range of versions". Example `claude-opus-4-7.yaml` has `versionRange: ">=4.7.0 <5.0.0"` which is a range, but `model:claude-opus-4-7` is intended to be one specific snapshot (`claude-opus-4-7-20251201` or similar). The repo agent-catalog distinguishes `ModelFamily` (range-bearing) from `ModelVersion` (concrete snapshot id).

## Desired state
- Rename `ModelVersion.versionRange` → `ModelVersion.versionId` (string, e.g. snapshot id).
- Move range-bearing claims to `ModelFamily.activeVersionRange`.
- Update example to `versionId: "claude-opus-4-7"` plus separate `aliasIds: ["claude-opus-4-7-20251201"]`.

## Evidence
- C:/work/v6/graph/schema/ontology-schema.yaml (ModelVersion attributes)
- packages/agent-catalog/graph/nodes/models.yaml (uses `modelVersionId` shape)
- https://platform.claude.com/docs/en/docs/about-claude/models/overview (snapshot date discipline)

## Propagation status
- Level 2: open

## Propagation chain
- Level 2: rename attribute, update 3 example model files, update compute-path.md.

## Notes
Naming/semantics gap. Cascades into Level 1 fixes for Anthropic models.
