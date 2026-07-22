# D-69: `kip resolve` model-tier selection — build report

**Item:** `d69-resolver-model-tier` · **Closes:** D-69 · **ADR:** B12d · **Branch:** `staging`
**Status:** shipped, live-verified — with an honest negative that reframed the justification (owner-decided).

## The problem (D-69)

The model-assisted Layer-2 resolver `kip resolve` (ADR-B12) spawns `claude --json-schema` per candidate
pair to get a strict verdict. When the operator passed no `--model`, the spawn inherited the **global**
default `haiku` via `resolveHarnessModel`. The Layer-2 live demo saw `haiku` return correct reasoning as
**prose** rather than the verdict object, so the N5 parser (`parseResolverVerdict`) correctly **abstained**
and a true `same` never became a quarantined `kip:same_as?` candidate — recall silently under-fires (fails
safe; never fabricates, never leaks, never merges).

## What shipped

`kip resolve` now selects its adjudication tier via a pure, total `resolverEffectiveModel(model, envModel)`
with a strict **three-level precedence** (owner chose "make it configurable"):

1. an explicit **`--model`** (per-call, operator intent) — wins;
2. else the **`KIP_RESOLVE_MODEL`** env var (deployment default, set once);
3. else the built-in **`RESOLVER_DEFAULT_MODEL = "sonnet"`** (structured-output-reliable).

It **never** routes an unset tier through the global `haiku`. Whichever tier wins is **reported verbatim**
in `kip resolve --json` (`model`, on both `--dry-run` and the real run) and the human-readable line — never a
silent substitution. This is standard config precedence, not an error-masking fallback: every branch is a
deliberate configured value.

**N5 is untouched.** `parseResolverVerdict` is byte-for-byte unchanged — a malformed / absent / out-of-range
verdict on *any* tier still ABSTAINS (confidence still range-checked [0,1]; gate still on
`exitCode===0 && is_error===false`, never `subtype`). The change is purely default-tier *selection*. The
**rejected** alternative — salvage embedded JSON from a prose response before abstaining — was ruled a
forbidden coercion/fallback ("fallbacks are evil") and not taken. The global `ask` default is untouched, so
`kip ask`/`learn`/`miner` keep their tier and cost.

## Live demo (`KIP_RESOLVE_LIVE=1`, real `claude` 2.1.195) — with NO `--model`

`kip resolve --json --top-k 4 --max-pairs 6` → `{"pairs":3,"candidates":1,"vetoes":1,"abstained":1,"model":"sonnet"}`

| Check | Result |
|---|---|
| Effective model reported | `"model":"sonnet"` — honest, identical in `--dry-run` (not a silent haiku substitution) |
| Semantic match `orchid`⇄`checkout-svc` | quarantined `kip:same_as?` (0.97) **by default**; `getNode` distinct until `confirm`, which then merged → no trusted-read leak |
| Homonym `Mercury` planet/element | vetoed via `not_same_as` (0.99); both stay distinct |
| Featureless `j-smith` pair | ABSTAINED (nothing authored) |
| `--model haiku` override | reported `"model":"haiku"` verbatim |

Latency ~15 s/pair (sonnet).

## The honest negative (reframed the justification)

The demo's **`--model haiku` control did NOT reproduce the under-fire**: on claude CLI 2.1.195, haiku honored
`--json-schema` and authored the candidate on **4/4** trials. So the prose failure is **intermittent, not
deterministic** — observed once (Layer-2 demo), not reproduced here. This ADR/DEBTS therefore does **not**
claim haiku is broken; the sonnet default is justified as **variance-reduction + honest tier reporting**, not
the repair of a proven-deterministic bug. Because that weakened the cost/benefit, the default was an
**owner-visible decision** — the owner chose to keep sonnet as the default *and* add `KIP_RESOLVE_MODEL` so a
deployment can pin a cheaper (or different) tier without `--model` on every call.

## Quality

Adversarial N5-honesty/code-quality critic: **91/100 — shippable** (N5 intact, no silent substitution, global
default untouched, override verbatim, not a fallback). Its one minor finding — tests pinned the pure selector
but not the CLI wiring — was **closed** by a CLI-wiring test (`layer2-resolver-d69-cli-wiring.test.ts`) that
drives the real `runCli(["resolve","--dry-run","--json",…])` through a spy Repo and asserts the effective
model reaches `--json` (default, env, override).

## Suite / gates

`881 passed | 8 skipped` (103 files; +14 D-69 tests: 10 selector + 4 CLI-wiring). `build:sdk`, kip build, and
`verify:metadata` all pass; `package-lock.json` clean; zero new runtime deps; LF; cross-platform.

## Files

- `src/linker/entity-resolver.ts` — `RESOLVER_DEFAULT_MODEL`, `RESOLVER_MODEL_ENV`, `resolverEffectiveModel(model, envModel)`.
- `src/cli/index.ts` — `cmdResolve` computes `effectiveModel` (flag > env > default), passes it to `spawnResolverVerdict`, reports it in `--json`; removed now-dead `resolveHarnessModel` import.
- `src/__tests__/layer2-resolver-d69-model-tier.test.ts` (10) + `layer2-resolver-d69-cli-wiring.test.ts` (4).
- `docs/70-decision-records-adr.md` (ADR-B12d) · `docs/DEBTS.md` (D-69 resolved, negative control recorded).
