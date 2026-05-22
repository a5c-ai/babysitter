# GAP-L2-P0 — pathdescriptor-undeclared-but-referenced

- **id**: `gap:pathdescriptor-undeclared-but-referenced`
- **level**: 2
- **priority**: P0
- **status**: closed
- **discoveredAt**: 2026-04-29 (debt-loop pass 1)
- **closedAt**: 2026-04-29

## Title

PathDescriptor (and 5 other NodeKinds) referenced in coverage-checklist
but missing from `schema/ontology-schema.yaml`.

## Current state (was)

`coverage-checklist.md` referenced six NodeKinds that did not exist in the
atlas schema:

- `PathDescriptor` — 6+ rows (run dir layout, session conventions, MCP
  discovery, per-scope plugin registries, vendor auth paths,
  user/project profiles).
- `OntologySchema` — row 524 (Catalog/Ontology concept).
- `ProcessLibrary` — row 406 (Process library concept).
- `SharedContextSpec` — row 139 (Shared Context fabric).
- `RunJournalEvent` — row 154 (Run journal events enum).
- `DecisionVerb` — row 104 (DECISION_PRECEDENCE enum).

V-12.5 markdown↔YAML parity was failing because rows claimed `✅` mappings
to schema elements that did not exist.

## Desired state (now)

Phase 1: minimal stub NodeKinds declared in
`schema/ontology-schema.yaml` for all six, with a corresponding
"Stub NodeKinds" section in `../../schema/node-kinds/catalog-meta.md` and
README cluster-index rows. Each stub carries `id`, `purpose`, and a
partial attribute table; full attribute / edge / invariant spec is
deferred to Phase 2 with a TODO marker on each stub.

Phase 2 owners (deferred):

- `PathDescriptor`, `SharedContextSpec` → `sourceref-and-scope.md`
  / extension-interfaces track.
- `OntologySchema`, `ProcessLibrary` → catalog-provenance / process
  authoring track.
- `RunJournalEvent` → `lifecycle.md` (journal events).
- `DecisionVerb` → `channels-hooks.md` (hook-merge / decision-precedence).

## Propagation chain

| Level | Fix | Status |
|---|---|---|
| 2 — graph examples | none authored yet (Phase 2 example fixtures will instantiate stubs) | atLeast: stub |
| 2 — node-kind specs | stub sections added to `../../schema/node-kinds/catalog-meta.md` and `../../schema/node-kinds/README.md` | atLeast: stub |
| 2 — ontology-schema.yaml | six stub `nodeKinds:` entries added | atLeast: stub |
| 2 — coverage-checklist | rows now point at real (stub) schema elements; status retained as `✅` because stub satisfies the dangling-ref check | atLeast: full |
| 3 — process docs (qa, versioning) | not touched in Phase 1 | atLeast: deferred |
| 4-7 — generators / derived artifacts / tests / governance | not yet existing in repo (Phase 4-7 not landed); to be addressed when those phases land | atLeast: deferred |

## Files changed

- `schema/ontology-schema.yaml` — added six stub NodeKinds before
  `EDGE KINDS` block.
- `../../schema/node-kinds/catalog-meta.md` — added "Stub NodeKinds (Phase 1
  parity holders)" section.
- `../../schema/node-kinds/README.md` — added stub rows in clusters 13 and 15
  index tables.
- `wiki/process/gaps/GAP-L2-P0-pathdescriptor-undeclared-but-referenced.md`
  — this file.

## Notes

The stubs are explicitly marked `STUB:` in the YAML invariants and in
the markdown so a Phase 2 lift will not silently miss them. Any
example that needs to instantiate one of these NodeKinds must add the
missing attributes and bump the markdown spec at the same time.
