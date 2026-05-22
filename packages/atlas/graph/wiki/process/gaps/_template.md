---
id: page:process-gaps-template
nodeKind: Page
title: "GAP-<level>-<priority>-<slug>"
slug: "process/gaps/_template"
articlePath: "wiki/process/gaps/_template.md"
documents: []
---
# GAP-<level>-<priority>-<slug>

| Field | Value |
|---|---|
| id | gap:<slug> |
| title | <short title> |
| level | <1-7> |
| priority | <P0|P1|P2|P3> |
| discoveredAt | <iso-timestamp> |
| source | <where this gap was discovered> |
| status | <open|in-progress|closed|deferred> |
| owner | <Authority ref> |

## Current state
<what the schema/graph/docs/etc. currently say>

## Desired state
<what they should say>

## Evidence
- <links>

## Propagation status
- Level 1 (real-world vs graph): <not-started|in-progress|done|not-applicable>
- Level 2 (graph vs docs): ...
- Level 3 (qa vs docs): ...
- Level 4 (generators vs docs): ...
- Level 5 (code vs docs): ...
- Level 6 (SDK vs above): ...
- Level 7 (interfaces vs above): ...

## Propagation chain
- Level <N>: <fix description> (<by>, <at>)

## Notes
<freeform>
