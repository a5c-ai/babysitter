# D-67: RDF / linked-data ingestion — build report

**Item:** `d67-rdf-ntriples` · **Closes:** D-67 (local-file N-Triples scope) · **ADR:** B14 · **Branch:** `staging`
**Status:** shipped, adversarially reviewed (found + fixed 2 forge paths), behaviorally demoed. Remote fetch + Turtle/JSON-LD deferred.

## Problem

ADR-B11 designed the `same_as` channel to also carry RDF `owl:sameAs` (IRIs as global eids) so an external
linked-data graph could join kip's memory — but D-67 tracked that no ingestion path existed.

## What shipped

A deterministic, **dependency-free N-Triples reader** (`src/rdf/ntriples.ts` — hand-rolled parser + FNV-1a,
no runtime dep) and `kip ingest-rdf <file> [--graph <id>] [--source <uri>] [--skip-malformed] [--dry-run]
[--json]`. Triples → signed, reversible kip facts via the existing `runAcquisition` path (IRIs as eids verbatim):

- **`owl:sameAs`** → a reversible `same_as` edge (the linker's channel) — joins two IRIs into one identity class.
- **`rdf:type`** → node kind (deterministic-min type IRI) + lossless `rdf:type` edges.
- **Other IRI-object predicates** → edges (predicate IRI as edgeKind).
- **Literal objects** → node props; **datatype (≠xsd:string) and language preserved** as adjacent sidecar props
  (`"<pred> ^^datatype"` / `"<pred> @lang"`) — never dropped (N5).
- Blank nodes → deterministic skolemization (`--graph` or a content hash of the line-ending-normalized file).

**Invariants:** INV-A1 (the reader is pure; only `runAcquisition` writes); N5 (malformed input strict-fails the
whole file by default — line-numbered, exit 1, authors nothing — or reports skips under `--skip-malformed`;
`parseNTriples` is pure/total); reversible (every fact, incl. `same_as`, is an ordinary retractable signed
fact); deterministic (sorted `proposed`, content-derived edge eids, idempotent re-ingest). Zero new deps,
`package-lock.json` untouched, cross-platform (CRLF/CR/LF input), LF source.

## Behavioral demo (real `kip ingest-rdf` CLI, no model)

Ingesting a `.nt` whose `owl:sameAs` links `dbpedia/Alice` to the kip node `myco/alice` authored 11 facts and
**joined the graphs**: `getNode`/`sameAsClass` resolve both IRIs to one canonical node; `rdf:type` set the kind
+ edge; the `foaf:knows` IRI predicate became a reversible edge; literal props preserved `@lang=en` and
`^^xsd:integer`. Retracting the `same_as` nulled its edge-existence fact (fact-level reversible); read-level
un-merge honestly stays (D-68). Re-ingest idempotent; malformed strict-fails authoring nothing; `--skip-malformed`
and `--dry-run` correct.

## Adversarial review — 2 forge paths found and FIXED

First critic pass scored **62 (not shippable)** — it empirically confirmed two integrity holes rooted in one
flaw (RDF-derived IRIs used verbatim as internal edgeKinds/prop-keys), which matter precisely because this
feature ingests *untrusted* external data:

1. **BLOCKER — reserved-channel forge:** a predicate `<same_as>`/`<not_same_as>` (or `rdf:type <kip:conflict>`)
   minted kip's reserved identity/veto channels (proj folds by edgeKind alone). **Fixed:** the reader now refuses
   any non-`owl:sameAs` predicate whose edgeKind — or any `rdf:type` object — equals a reserved kind
   (`same_as`, `not_same_as`, `documents`, `kip:same_as?`, `kip:conflict`, enumerated from kip's own constants),
   as an N5 strict-fail/reported-skip. Independently re-verified: every forge input authors **zero** facts and
   reports a line-numbered refusal; the CLI exits 1.
2. **MAJOR — sidecar-key collision:** a UCHAR-escaped space in a predicate IRI (` ...@lang`) collided with
   the datatype/lang sidecar cell (the code's "an IRIREF never contains a space" comment was false). **Fixed:**
   any predicate whose decoded IRI contains a space is refused; comment corrected.

Also fixed (correctness): lone-surrogate UCHAR rejection, blank-node namespace line-ending normalization (LF vs
CRLF now fold to the same skolem eids), empty-IRIREF rejection, blank first-char. All re-verified independently
against the built module. Second pass: suite **953 passed | 8 skipped** (+16 adversarial-integrity tests over
the pre-fix 937), build clean, lockfile untouched, LF.

## Honest boundaries / deferred (the remaining D-67 surface)

Remote RDF fetch / SPARQL / public-graph *querying* (network + untrusted-download — its own gated design);
Turtle / JSON-LD; curie normalization of predicate IRIs; a multi-value prop read model. Read-level un-merge
after a `same_as` retract is D-68; `getNode` after a join is a canonical redirect, not a cross-class prop-union
(that is `sameAsClass`/graph-QA, D-66).

## Files

- `src/rdf/ntriples.ts` (parser + mapper + `rdfIngestDispatch` + reserved-kind/space guards).
- `src/cli/index.ts` (`cmdIngestRdf`), `src/cli/args.ts` (flags), `src/cli/microagents/kip-rdf/microagent.json`.
- `src/linker/entity-linker.ts` (exported `DOCUMENTS_EDGE_KIND` for the reserved set).
- `src/__tests__/d67-rdf-ntriples.test.ts` (parser/mapping/join/reversibility/determinism + the adversarial-integrity block).
- `docs/70-decision-records-adr.md` (ADR-B14) · `docs/DEBTS.md` (D-67 resolved for local N-Triples, narrowed to the remote/serialization surface).
