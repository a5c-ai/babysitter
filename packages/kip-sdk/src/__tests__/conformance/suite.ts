/**
 * suite.ts — the SHIPPABLE conformance-suite manifest (docs/60 §8.4).
 *
 * docs/60-conformance-and-testability.md presents the conformance invariant catalog (INV-1..INV-19,
 * their milestone sub-invariants INV-2a/4a/6a/7a/13a/14a/14b, and the active-layer set
 * INV-A1..INV-A14) as a structured TEST PLAN. §8.4 requires that catalog to SHIP as a runnable,
 * self-describing artifact. docs/60 prescribes no concrete code shape for the manifest itself (it is
 * a prose test plan), so — per the M9 packaging brief — this module is the sensible minimum: a
 * single, machine-enumerable registry mapping every docs/60 invariant id to (1) its verbatim §8.4
 * title, (2) the docs/60 section it lives in, and (3) the conformance `*.test.ts` file(s) that
 * cover it. `suite-completeness.test.ts` is the executable guard that asserts this registry stays in
 * exact lockstep with docs/60 and with the test files actually present on disk, so a future INV
 * added to docs/60 (or a test file deleted) FAILS CI (docs/60 §8.4: "so a future missing INV fails
 * CI").
 *
 * This file is NOT itself a test (it does not end in `.test.ts`, so vitest's include glob skips it)
 * — it is the importable manifest the completeness test folds over, and the enumerable index a
 * downstream consumer of the shipped suite can read to discover exactly which invariants kip claims
 * to conform to and where each one is proven.
 *
 * `coverage`:
 *   - "covered"     — the invariant is fully proven by its registered test file(s) (the default).
 *   - "tracked-gap" — a registered test file exists and asserts the spec-correct behavior, but one
 *                     half of the invariant depends on an as-yet-unimplemented feature and is encoded
 *                     as a self-correcting `it.fails` expected-failure inside that file (surfaced by
 *                     the M9 audit, tracked in CI, never silently omitted). See INV-14b.
 */

/** One §8.4 invariant and where the shipped suite proves it. */
export interface ConformanceInvariant {
  /** Canonical docs/60 anchor id, upper-cased (e.g. `"INV-1"`, `"INV-14b"`, `"INV-A7"`). */
  readonly id: string;
  /** The §8.4 headline for the invariant (condensed from docs/60's bold heading). */
  readonly title: string;
  /** The docs/60 section the invariant is catalogued under. */
  readonly section: string;
  /** Conformance test file basename(s) (under `src/__tests__/conformance/`) that cover it. */
  readonly testFiles: readonly string[];
  /** Coverage disposition — see this module's doc comment. Defaults to `"covered"` when omitted. */
  readonly coverage?: "covered" | "tracked-gap";
}

/**
 * The full docs/60 §8.4 invariant catalog, in doc order. Every entry's `testFiles` are asserted to
 * exist (and to carry the canonical `describe("INV-<id>: …")` title) by `suite-completeness.test.ts`.
 */
export const CONFORMANCE_SUITE: readonly ConformanceInvariant[] = [
  // §1 — Core convergence & projection.
  { id: "INV-1", title: "proj determinism + replica-local-input independence", section: "1", testFiles: ["inv-1.test.ts"] },
  { id: "INV-2", title: "convergence / SEC over the signature-valid admitted set (non-vacuous, C3-1)", section: "1", testFiles: ["inv-2.test.ts"] },
  { id: "INV-2a", title: "substrate-only SEC sub-case (M3's exit gate)", section: "1", testFiles: ["inv-2a.test.ts", "inv-2a-m3-surface.test.ts"] },
  { id: "INV-3", title: "reducer determinism + orderKey totality", section: "1", testFiles: ["inv-3.test.ts"] },

  // §2 — Bitemporal & belief axes.
  { id: "INV-4", title: "belief-consistency (per-replica AUDIT)", section: "2", testFiles: ["inv-4.test.ts", "inv-4-m2-surface.test.ts"] },
  { id: "INV-4a", title: "segment-geometry sub-case (M1's exit gate)", section: "2", testFiles: ["inv-4a.test.ts"] },
  { id: "INV-11", title: "validTime convergence (closes M2-4)", section: "2", testFiles: ["inv-11.test.ts", "inv-11-m2-surface.test.ts"] },

  // §3 — Projection rebuildability & idempotence.
  { id: "INV-5", title: "projection rebuildability (scoped, PARAMETERIZED — m7-25)", section: "3", testFiles: ["inv-5.test.ts"] },
  { id: "INV-7", title: "idempotent ingestion", section: "3", testFiles: ["inv-7.test.ts"] },
  { id: "INV-7a", title: "CID dedup at the gate, no reducer required (M0's exit gate, B-3)", section: "3", testFiles: ["inv-7a.test.ts"] },
  { id: "INV-8", title: "upcaster soundness (terminates, never invents)", section: "3", testFiles: ["inv-8.test.ts"] },

  // §4 — GC, excision & regenerated DAG.
  { id: "INV-9", title: "GC / excision safety", section: "4", testFiles: ["inv-9.test.ts", "inv-9-m3-surface.test.ts"] },
  { id: "INV-12", title: "concurrent-excision pin / as-of convergence + BYTE-IDENTICAL regenerated DAG", section: "4", testFiles: ["inv-12.test.ts", "inv-12-m3-surface.test.ts"] },

  // §5 — Trust, gate/proj separation & authority.
  { id: "INV-6", title: "gate / proj separation + verification (signature-only gate, C3-1, M3-4)", section: "5", testFiles: ["inv-6.test.ts"] },
  { id: "INV-6a", title: "gate-only sub-case (M0's exit gate)", section: "5", testFiles: ["inv-6a.test.ts"] },
  { id: "INV-10", title: "authority chain (author-HLC keyed)", section: "5", testFiles: ["inv-10.test.ts"] },

  // §6 — Substrate convergence reachability & pins.
  { id: "INV-13", title: "signature-valid ⇒ eventually-admitted-on-receipt (non-vacuous substrate convergence)", section: "6", testFiles: ["inv-13.test.ts"] },
  { id: "INV-13a", title: "admitted-on-receipt gate sub-case (M0's exit gate)", section: "6", testFiles: ["inv-13a.test.ts", "inv-13a-m3-surface.test.ts"] },
  { id: "INV-14", title: "pin completeness & stability (M3-2 / m3-3 / m7-2)", section: "6", testFiles: ["inv-14.test.ts", "inv-14-m3-surface.test.ts"] },
  { id: "INV-14a", title: "single-replica pin sub-case (M2's exit gate)", section: "6", testFiles: ["inv-14a.test.ts", "inv-14a-m2-surface.test.ts"] },
  {
    id: "INV-14b",
    title: "excised chain slot is an attested hole, not a gap (A-1, closes the excision×seq interaction)",
    section: "6",
    testFiles: ["inv-14b.test.ts"],
    coverage: "tracked-gap",
  },

  // §7 — Causal plausibility & anti-backdating.
  { id: "INV-15", title: "causedBy well-formedness (set-pure, M4-2)", section: "7", testFiles: ["inv-15.test.ts"] },
  { id: "INV-16", title: "per-key anti-backdating from INVOLUNTARY footprint, gated on chain completeness", section: "7", testFiles: ["inv-16.test.ts"] },
  { id: "INV-19", title: "anti-backdating preserved under eviction & partial replication (C5-1)", section: "7", testFiles: ["inv-19.test.ts"] },

  // §8 — Revocation.
  { id: "INV-17", title: "revocation intent & honest-concurrent surfacing (M4-1)", section: "8", testFiles: ["inv-17.test.ts"] },

  // §9 — Admission-control, retention & partial-replication SEC.
  { id: "INV-18", title: "admission-control / retention resource bound + partial-replication SEC", section: "9", testFiles: ["inv-18.test.ts"] },

  // §10 — Active-knowledge conformance invariants (INV-A1..INV-A14).
  { id: "INV-A1", title: "microagents-are-clients (load-bearing)", section: "10", testFiles: ["inv-a1.test.ts", "inv-a1-m7-surface.test.ts"] },
  { id: "INV-A2", title: "compile-determinism + DAG order", section: "10", testFiles: ["inv-a2.test.ts"] },
  { id: "INV-A3", title: "dispatch no-fallback (N5)", section: "10", testFiles: ["inv-a3.test.ts"] },
  { id: "INV-A4", title: "learner replica-fold", section: "10", testFiles: ["inv-a4.test.ts"] },
  { id: "INV-A5", title: "budget termination (3 axes) + exhausted marker", section: "10", testFiles: ["inv-a5.test.ts"] },
  { id: "INV-A6", title: "hop idempotence", section: "10", testFiles: ["inv-a6.test.ts"] },
  { id: "INV-A7", title: "multi-segment & multi-realizer typed choice (N5)", section: "10", testFiles: ["inv-a7.test.ts"] },
  { id: "INV-A8", title: "answer-graph = derived_from projection", section: "10", testFiles: ["inv-a8.test.ts"] },
  { id: "INV-A9", title: "proj-totality over §5b cells + loss-exclusion", section: "10", testFiles: ["inv-a9.test.ts"] },
  { id: "INV-A10", title: "acquisition family lifecycle + ordering/kind-preservation + divergent-registration conflict", section: "10", testFiles: ["inv-a10.test.ts"] },
  { id: "INV-A11", title: "same_as equivalence-closure totality + disputed-merge conflict", section: "10", testFiles: ["inv-a11.test.ts"] },
  { id: "INV-A12", title: "learner accept-if-improved + options↔state agreement", section: "10", testFiles: ["inv-a12.test.ts"] },
  { id: "INV-A13", title: "explicit encode/decode/learner manifest selection (N5)", section: "10", testFiles: ["inv-a13.test.ts"] },
  { id: "INV-A14", title: "rawKind declared once, threaded unchanged", section: "10", testFiles: ["inv-a14.test.ts"] },
];

/** Every invariant id in the shipped catalog, in doc order. */
export const CONFORMANCE_INVARIANT_IDS: readonly string[] = CONFORMANCE_SUITE.map((i) => i.id);

/**
 * The canonical docs/60 §8.4 invariant-id set, transcribed DIRECTLY from the doc's own `<a id="…">`
 * anchors (INDEPENDENT of `CONFORMANCE_SUITE` above so the completeness test cross-checks the
 * manifest against the SPEC, not against itself). A docs/60 invariant added or removed without a
 * matching manifest edit makes `suite-completeness.test.ts` fail.
 */
export const DOCS60_INVARIANT_IDS: readonly string[] = [
  "INV-1", "INV-2", "INV-2a", "INV-3",
  "INV-4", "INV-4a", "INV-11",
  "INV-5", "INV-7", "INV-7a", "INV-8",
  "INV-9", "INV-12",
  "INV-6", "INV-6a", "INV-10",
  "INV-13", "INV-13a", "INV-14", "INV-14a", "INV-14b",
  "INV-15", "INV-16", "INV-19",
  "INV-17",
  "INV-18",
  "INV-A1", "INV-A2", "INV-A3", "INV-A4", "INV-A5", "INV-A6", "INV-A7",
  "INV-A8", "INV-A9", "INV-A10", "INV-A11", "INV-A12", "INV-A13", "INV-A14",
];

/** Look up the registered conformance test file(s) proving `id` (empty if `id` is not catalogued). */
export function testFilesFor(id: string): readonly string[] {
  return CONFORMANCE_SUITE.find((i) => i.id === id)?.testFiles ?? [];
}
