# GAP-L2-P1 — edge-kinds-md-vs-yaml-parity

- **id**: `gap:edge-kinds-md-vs-yaml-parity`
- **level**: 2
- **priority**: P1
- **status**: closed (Phase 1 scope; CI invariant deferred)
- **discoveredAt**: 2026-04-29 (debt-loop pass 1)
- **closedAt**: 2026-04-29

## Title

`../../schema/edge-kinds.md` and `schema/ontology-schema.yaml` disagreed on the
edge inventory (V-12.5 markdown↔YAML parity violation).

## Current state (was)

The markdown enumerated ~57 edge rows; the YAML defined ~115 entries
(many of which are inverse-direction siblings, but several are unique
edges entirely absent from the markdown). Concretely missing from the
markdown side:

- Composition: `realizes` / `realized_by`
- Capability: `applies_to_version`
- Transport: `exposes` / `exposed_by`, `spoken_by`
- Lifecycle: `spans`, `executes_in`
- Domain: `composes_stack` (alias of `composes`)
- Terminology: `expands_to`, `defines`, `classifies`
- Trust: `evidence_at_level` (inverse of `at_trust_level`, only
  referenced in the inverse column previously)
- Gap tracking: `discovered_by`, `closed_by`, `affects`, `blocks`,
  `raised_question`

V-12.5 was unfailing-by-omission only because the parity check is not
yet wired into CI; manually `diff`ing the two surfaces showed the
mismatch.

## Desired state (now)

Phase 1: 1:1 parity on real (non-inverse-only) edges. The YAML remains
authoritative (the validator consumes it); the markdown is updated to
list every YAML-only edge with full source / target / cardinality /
inverse declarations. `aliasOf` semantics are preserved
(`composes_stack` is documented as an alias of `composes`).

Phase 4 (deferred): a CI invariant that diffs `../../schema/edge-kinds.md`
against `schema/ontology-schema.yaml` and fails on drift. Tracked as a
follow-up; not landed because the CI surface for graph is
itself a Phase 4 deliverable.

## Propagation chain

| Level | Fix | Status |
|---|---|---|
| 2 — markdown | new edge rows added to `../../schema/edge-kinds.md` (Composition / Capability / Transport / Lifecycle / Domain / Terminology / Trust / new Gap tracking section) | atLeast: full |
| 2 — YAML | no change — YAML was already authoritative | atLeast: n/a |
| 2 — examples | no change — edges are referenced from existing examples | atLeast: n/a |
| 2 — coverage-checklist | no change | atLeast: n/a |
| 3 — qa / CI | parity invariant deferred to Phase 4 (CI surface for graph not yet landed) | atLeast: deferred |
| 4-7 — generators / docs / tests / governance | not yet existing in repo | atLeast: deferred |

## Files changed

- `../../schema/edge-kinds.md` — added 16 new edge rows across Composition,
  Capability, Provider/transport, Workspace/lifecycle, Domain,
  Terminology, Trust, and a new "Gap tracking (debt-loop)" section.
- `wiki/process/gaps/GAP-L2-P1-edge-kinds-md-vs-yaml-parity.md` — this
  file.

## Notes

Inverse-only edges that exist as separate entries in YAML purely for
direction-search purposes (`scopes_in`, `scopes_out`, `runs_for`,
`materialization_of`, `attested_by`, `served_by`-inverse pairs, etc.)
remain referenced via the `Inverse` column in the markdown rather than
being given their own rows; the markdown convention is to list each
*directed pair* once, identified by the forward direction. If V-12.5
turns out to require dual rows, we can add them in a follow-up.
