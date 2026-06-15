---
id: page:process-gaps
nodeKind: Page
title: "Gap Tracker"
slug: "process/gaps"
articlePath: "wiki/process/gaps/README.md"
documents: []
---
# Gap Tracker

Human-readable form of every tracked gap. Each file in this directory mirrors a `Gap` node in the graph (see `graph/02-node-kinds/catalog-meta.md`, NodeKind `Gap`).

## How files relate to graph entries

- The **YAML form** of a gap lives under `graph/schema/examples/catalog-meta/gaps/<id>.yaml` — same as every other graph entity.
- The **markdown form** lives here, at `process/gaps/GAP-<level>-<priority>-<slug>.md`.
- The two are kept in sync by a Phase-3 generator (added as the eleventh entry in `06-derivation-spec.md`). The markdown file's path is recorded on the `Gap` node's `markdownRef` attribute.

## Authoring rules

- Always create the YAML node first; the markdown file is a projection (or co-authored alongside, then verified by the sync generator).
- The filename must match the `id` slug exactly: `GAP-<level>-<priority>-<slug>.md` ↔ `gap:<slug>`.
- Use [`_template.md`](./_template.md) verbatim. Do not invent extra sections; the sync generator only knows the template's structure.

## Lifecycle

| `status` | Meaning |
|---|---|
| `open` | Discovered, not yet picked up. |
| `in-progress` | Implementer assigned; one or more `propagationStatus` levels are `in-progress`. |
| `closed` | Adversarial review signed off; every applicable level is `done` or `not-applicable`. |
| `deferred` | Acknowledged but intentionally postponed (P2/P3 only); requires a date and a reason in `notes`. |

## Index

The full index of open / in-progress / closed gaps is **derived** from the graph (Phase 3 generator emits `process/gaps/INDEX.md` from `Gap` nodes). Do not author an index by hand — it would drift.
