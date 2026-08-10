# Layer 2: model-assisted entity resolver — build report

**Item:** `layer2-resolver` · **Closes:** D-63 (homonym false-merge) · **ADR:** B12 / B12a / B12b / B12c
**Branch:** `staging` · **Status:** shipped, live-verified.

## What shipped

Layer 2 is the model-assisted counterpart to the deterministic Layer-1 linker (ADR-B11). Layer 1 is
exact-name-match only and has two limits it cannot fix deterministically: it can **false-merge a genuine
homonym** (two distinct entities that share a distinctive name — D-63) and it **misses real matches** that are
not exact-string-equal. Layer 2 fixes both with a model in the loop, without ever touching identity or proj
byte-identity.

- **`kip resolve`** — generates a **deterministic, bounded** candidate-pair set (recall + Layer-1 normalizers;
  never O(n²)), then the model adjudicates *only* those pairs with each node's surrounding facts as context.
  Knobs: `--top-k` (per-node recall fan-out), `--max-pairs` (total cap), `--min-confidence` (bar).
- **Verdict → fact** (N5, confident-only): a confident **`same`** authors a **quarantined `kip:same_as?`**
  candidate edge (ADR-B12a) — visible/queryable but it does **not** win a trusted read; a confident
  **`not-same`** authors a trusted **`not_same_as`** veto (this is how D-63 is fixed — it actively prevents a
  future Layer-1 false-merge); **uncertain / low-confidence / malformed → ABSTAIN** (never a fabricated link).
  Confidence is range-checked ∈ [0,1].
- **`kip resolve confirm <from> <to>`** promotes a quarantined candidate to a real `same_as`;
  **`kip resolve reject <from> <to>`** authors `not_same_as` (→ surfaces `kip:conflict`). Both guard on an
  outstanding candidate; `--force` is the off-by-default operator override.
- **Trust:** the quarantine is **structural** — a dedicated `kip:same_as?` edge kind that proj's `same_as`
  union-find never folds — so a speculative model link is held out of trusted reads with **zero proj change**
  (ADR-B12a is the crux). INV-A1 holds: the resolver microagent returns verdicts; only the orchestrator authors
  facts. Accelerator-class per §5.3: the model verdict is a search/adjudication signal that never touches
  orderKey/reducers/proj byte-identity — only the resulting *quarantined signed fact* does.
- **Live path:** spawns the authenticated `claude` CLI via `ask.ts`'s Windows-hardened helpers, opt-in behind
  `KIP_RESOLVE_LIVE` (default suite spawns nothing). Zero new runtime deps; `package-lock.json` untouched; LF.

## Live demo (acceptance bar) — `KIP_RESOLVE_LIVE=1`, real `claude` v2.1.195

| Scenario | Model verdict | Outcome | Correct? |
|---|---|---|---|
| **Homonym** `Mercury` planet vs element (same name, disjoint facts) | not-same, 0.99 | trusted `not_same_as` veto; both nodes stay distinct | ✅ Layer 1 *would* have merged; Layer 2 vetoed |
| **Semantic match** `Orchid` ≡ "the checkout service" (no name overlap) | same, 0.88 | quarantined `kip:same_as?`; `getNode` stays DISTINCT before confirm | ✅ crux held — no trusted-read leak |
| **Confirm** the above | — | promoted to real `same_as`; both eids canonicalize | ✅ real merge |
| **Reject** a pair | — | `not_same_as`; `getNode` surfaces `kip:conflict` | ✅ veto working |
| **Abstain** two `J. Smith` with no distinguishing facts | uncertain, 0.35 | nothing authored | ✅ N5 abstain |

Gate check: without `KIP_RESOLVE_LIVE` → exit 7 ("the probe was NOT consulted"). No quarantined candidate ever
leaked into a trusted read; no merge was ever fabricated on any tier.

## Honest negative (→ new debt D-69)

With the **shipped-default harness model `haiku`**, `claude --json-schema` was not reliably honoured: on the
semantic-match pair haiku reasoned correctly ("same, 88%") but returned **prose** instead of the JSON object, so
the N5-strict parser **abstained** and the legitimate `kip:same_as?` candidate was **not authored on the haiku
run**. This is fail-safe (it abstains, never fabricates), but it means the resolver's `same`→quarantine *recall*
is model-tier-dependent and haiku *under-fires* on true matches. The full quarantine→confirm→reject lifecycle
was therefore exercised via `--model sonnet`, which emitted schema-conforming JSON on every pair. Filed as
**D-69** with three candidate fixes (default to a structured-reliable tier / salvage embedded JSON before
abstain / document `--model sonnet`). Safety invariants (no fabrication, no leak, no identity-merge) hold on
**every** tier — only recall is tier-dependent.

Latency: haiku ~20s/pair, sonnet ~17s/pair; ~$0.03–0.06/pair.

## Quality loop

Converged at round-2 minimum **88** (trust-fidelity 88, model-honesty 94, code-quality 94). Adversarial critics
caught real defects a green suite would have shipped: reversibility overclaimed as read-level (corrected to
fact-level; filed **D-68**), confirm/reject skipping candidate validation (guards + off-by-default `--force`),
and unbounded confidence (range-checked [0,1] in `verdictEntries`, `parseResolverVerdict`, and the JSON schema).
Acceptance: all 12 hard criteria met (the one gap — `--force` unregistered in `args.ts` — fixed in `c634f45fa`).

## Suite / integration

`868 passed | 8 skipped`. Integration gate green: `build:sdk`, `build --workspace=@a5c-ai/kip-sdk`,
`test --workspace=@a5c-ai/kip-sdk`, `verify:metadata` all pass; `package-lock.json` clean.

## Debts

- **D-63 — RESOLVED** by this resolver (homonym vetoed live; semantic match quarantined then confirmed).
- **D-68 — Open** (filed this round): fact-level reversibility ships; read-level re-projection (auto-un-merge
  after a confirm retract, auto-clear `kip:conflict` after a veto retract) needs a proj change, deferred.
- **D-69 — Open** (filed this round): `same`→quarantine recall is model-tier-dependent; the default `haiku`
  under-fires (fails safe). Safety is model-independent.

## Files

- `src/linker/entity-resolver.ts` (Layer-2 core: `resolveCandidates`, `makeResolverDispatch`,
  `generateResolverCandidatePairs`, `resolveConfirm`/`resolveReject`/`resolveList`, `verdictEntries`,
  `resolveResolveLiveGate`).
- `src/cli/index.ts` (`cmdResolve` + confirm/reject/list; live `claude`-per-pair adjudication with
  `RESOLVER_VERDICT_JSON_SCHEMA` + `parseResolverVerdict`).
- `src/cli/args.ts` (`--dry-run`/`--force` booleans; `--top-k`/`--max-pairs`/`--min-confidence` value flags).
- `src/cli/microagents/kip-resolver/microagent.json` (bundled).
- `src/kip-repo.ts` (`edgeEids` read seam; tightened `runAcquisition` edge idempotence).
- `src/__tests__/layer2-resolver.test.ts` (17) + `layer2-resolver-round2-critic-fixes.test.ts` (8).
- `docs/70-decision-records-adr.md` (ADR-B12/B12a/B12b/B12c) · `docs/DEBTS.md` (D-63 resolved; D-68, D-69 filed).
