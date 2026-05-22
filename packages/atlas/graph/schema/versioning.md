# 07 — Schema Currentness

The catalog schema is current-only. Graph data is validated against the schema in
this checkout; schema history, migration windows, compatibility bridges, and
build-pass history are not graph concepts.

## Current schema contract

- `schema/ontology-schema.yaml` is a manifest for the current NodeKind and EdgeKind files.
- Graph records under `graph/` use only current NodeKinds, EdgeKinds, attributes, and enum values.
- Removed or renamed concepts are deleted from graph data instead of kept as redirects.
- Historical rationale belongs in human-authored notes, not in active graph records.

## Incomplete graph content

The active graph does not carry placeholders for incomplete future work. When a
process cannot safely author a concrete node or subgraph, it records a run/process
carry-over task outside `graph/` and leaves existing source/TODO
comments intact until they are converted into real graph facts.

## Validation

Validators load the manifest and current graph files directly. They do not accept
old schema layouts, deprecation aliases, or historical id lookups.
