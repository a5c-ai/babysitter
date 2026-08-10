# kip-sdk `code-analysis-miner` — bash-tool code-analysis Miner program report

> Release record for the **code-analysis-miner** program: adding a real, first-class **code-analysis Miner**
> to `@a5c-ai/kip-sdk` — a bundled `code-miner@1.0.0` `MicroagentManifest` + a `codeMinerDispatch:
> DispatchMicroagentFn` + a new `kip index <path>` CLI verb that turns a working tree into signed `code:`-
> namespaced graph facts. The work is an **M7 acquisition-family** addition (ADR-B9 / B9a / B9b / B9c) built
> through the project's spec-driven TDD convergence loop — frozen tests → red gate → implement → build/test
> green gate → three adversarial critics (spec-fidelity / tooling-honesty / code-quality) scored to a minimum
> **≥88** → acceptance → commit — and closed with a real end-to-end **live demo** running the shipped `kip
> index` binary over real source. The four new residuals it surfaced are logged in
> [`docs/DEBTS.md`](../docs/DEBTS.md) as **D-53–D-56**.

## 1. Executive summary

The program shipped a **bash-tool code-analysis Miner** in the M7 acquisition family: a bundled
`code-miner@1.0.0` `MicroagentManifest`, a `codeMinerDispatch: DispatchMicroagentFn` implementation, and a
new **`kip index <path>`** CLI verb. It reuses the existing `runAcquisition` orchestrator seam — **no new
write path was added** — so the M7 invariant story is preserved by construction: **INV-A1 holds
structurally** because the miner never receives a `Repo` or any write seam; only `runAcquisition` authors
signed facts. The **one** core change was threading an optional `dispatchMicroagent` through
`OpenOptions` → `open()` → `KipRepo`, so the code Miner is dispatched by exactly the same acquisition
orchestrator that already governs every other M7 miner.

The Miner is honest about what it can and cannot measure. Its **guaranteed tier** — git HEAD/tracked set
plus Node builtins — runs with **zero external tools** and authors real signed facts; its **probed tier**
(rg / tokei / scc / cloc / ast-grep / tsc / eslint) is gated behind `KIP_INDEX_TOOLS` and **probe-and-skip-
with-reason (N5)**: an absent tool is recorded as `skipped:<tool>`, never a fabricated metric. Every item
converged: **3 TDD rounds** to a critic minimum of **89** against a target of **88**, **acceptance PASSED**,
the **integration gate PASSED** (`build:sdk` + kip build + full kip test **692 passed / 8 skipped / 93
files** + `verify:metadata`, all green), and the program landed with **zero new runtime dependencies** —
`package-lock.json` **untouched**. The cold-CLI live demo authored **41 signed code facts** from the graph-qa
source using the **guaranteed tier alone**, and surfaced **three** further defects the green suite and
acceptance both missed (two fixed and re-verified, one recorded as debt).

## 2. What shipped & design

**Surfaces.** A bundled `code-miner@1.0.0` `MicroagentManifest`; a `codeMinerDispatch: DispatchMicroagentFn`
that the acquisition orchestrator invokes; and a new `kip index <path>` CLI verb. All three ride the existing
`runAcquisition` seam — there is **no new write path**. The only core change was threading an optional
`dispatchMicroagent` through `OpenOptions` → `open()` → `KipRepo` so the code Miner is wired through the same
orchestrator that authors every other M7 miner's facts. **INV-A1 holds structurally**: the miner is handed no
`Repo` and no write seam; only `runAcquisition` signs and commits facts.

**Guaranteed tier (always available, zero external tools).**

- **git** — HEAD sha + the tracked-file set, read from `.git` via Node builtins **synchronously**. ADR-B9a
  reconciled this against an async `isomorphic-git` approach in favor of a synchronous read, to honor the
  Miner's **synchronous fact-building contract** (fact assembly must not be async).
- **Node builtins** — filesystem walk, regex-based import/export extraction, format/shebang detection,
  newline-counted LOC, and a git-blob `content` oid.

**Probed / accelerator tier (gated behind `KIP_INDEX_TOOLS`, N5 probe-and-skip-with-reason).**
rg / tokei / scc / cloc / ast-grep / tsc / eslint. An absent tool is recorded as `skipped:<tool>` and
**never** produces a fabricated metric. Where several tools can populate the same shared `linesOfCode` cell,
**first-available-wins** (a defect found and fixed in convergence — see §3).

**Fact schema.** `code:`-namespaced nodes (`code:repo` / `code:module` / `code:package` / `code:symbol`) and
edges (`code:contains` / `code:imports` / `code:exports` / `code:depends_on`), with **path-derived
deterministic EIDs** so re-indexing dedups rather than duplicating, and a
`code-resource://<repoId>@<gitSha>` **provenance** binding every fact to a specific repo at a specific commit.

## 3. TDD convergence — what the adversarial loop caught (that a green suite alone would have shipped)

The Miner converged over **3 rounds**, minimums **R1 = 72 → R2 = 81 → R3 = 89** against a target of **88**.
Per-critic at R3: **spec-fidelity 89**, **tooling-honesty 90**, **code-quality 94**.

The adversarial loop caught real defects a green suite alone would have shipped:

- **A blob oid using a trailing SPACE instead of a NUL byte.** The `content` git-blob oid was computed over a
  header terminated with a space rather than the NUL byte git actually uses — so it was **not a real git
  oid**. Verified against `git hash-object` and fixed. A green test that only checked "an oid-shaped string
  came back" never sees it.
- **Tautological tests.** Assertions that restated the implementation rather than pinning an independent
  property — rewritten to assert real behavior.
- **A LOC metric-cell collision across tokei / scc / cloc (last-write-wins).** Multiple probed tools wrote
  the same `linesOfCode` cell with no arbitration, so the reported LOC depended on tool ordering. Fixed to
  **first-available-wins** for the shared cell.

## 4. Live demo — real `kip index` over real code (cold CLI)

**PASS.** Running the shipped `kip index` binary over the graph-qa source:

1. **41 signed code facts authored** using the **guaranteed tier alone** — **zero external tools**.
2. `kip query` / `kip get` / `kip fsck` all worked over the resulting graph.
3. **Deterministic indexing** — re-indexing the same source into a **second fresh repo** produced **41 == 41**
   facts with a **byte-identical projection**.
4. **INV-A1 confirmed on committed provenance** — the recorded author is
   `kip-orchestrator:runAcquisition`, i.e. the miner never authored; the orchestrator did.
5. **Probed tier honest under `KIP_INDEX_TOOLS=1`** — it genuinely used `rg` and recorded `skipped:<tool>`
   with a reason for the tools that were absent, never a fabricated metric.
6. **Zero net-new temp-dir leaks.**

The demo surfaced **three** defects the green suite **and** acceptance both missed:

- **(D1) `kip index <subdir>` failed ENOENT (git-root-only).** The miner assumed the path was a git root.
  **FIXED** — the miner now walks up to the enclosing git root, **scopes** the authored facts to the given
  subdir, and **fails loud** on a genuinely non-repo path. Re-verified via a real CLI run.
- **(D2) `--include` / `--exclude` / `--git-sha` were read by `cmdIndex` but never registered in the arg
  parser.** **FIXED** — registered in `cli/args.ts`. Re-verified via a real CLI run.
- **(D3) `runAcquisition` wraps the miner's real error string in its generic non-zero-exit N5 guard**, so the
  operator sees a generic dispatch failure rather than the miner's verbatim cause. **Recorded as debt**
  (D-56) rather than papered over.

The through-line matches the rest of this project's history: **a green suite plus a passing acceptance can
still miss defects that only a real end-to-end run over real code exposes.** Two were fixed and re-verified
live; the third is honestly logged.

## 5. Final suite & integration numbers

- **Integration gate: PASS** — `build:sdk` + kip build + the **full kip test suite (692 passed / 8 skipped /
  93 files)** + `verify:metadata`, all green.
- **Dependency hygiene:** **zero new runtime dependencies**; `package-lock.json` **untouched**.

## 6. Residuals / deferrals (honest, tracked as D-53–D-56)

Shipping a working code Miner does not mean zero residuals. Each of the following is safe (where a capability
is absent the code **fails loud** or **skips with a recorded reason**, never fabricating) and each is logged
as a new tracked entry in [`docs/DEBTS.md`](../docs/DEBTS.md):

- **Probed / accelerator tier is live-gated and lacks automated coverage.** The `KIP_INDEX_TOOLS` probed tier
  is exercised only when the env gate is set and the external tools are present; it has **no automated test
  coverage** (accelerator-class §5.3). *(D-53)*
- **ast-grep / tsc / eslint are declared but skip-only.** They are named in the probed tier but have **no
  extractor** yet — they can only ever record `skipped:<tool>`. *(D-54)*
- **Newline-LOC off-by-one on files with no trailing newline.** The newline-counting LOC undercounts a file
  whose final line has no trailing newline. *(D-55)*
- **`runAcquisition` swallows the miner's verbatim error message.** A real miner error is wrapped in the
  generic non-zero-exit N5 guard, so the operator sees a generic dispatch failure rather than the miner's
  actual cause (this is D3 above). *(D-56)*

Two further honestly-narrowed limitations carried by this work (not net-new debts):

- The **`--include` / `--exclude` glob is a minimal subset** (`*`, `**`, `?` over git-root-relative POSIX
  paths), **not** full minimatch.
- **Free-text `kip ask` over a code graph still hits D-52** — the code Miner authors structured facts that
  `kip query` reads directly; genuine free-text NL question-answering over the code graph is subject to the
  same retrieval-brittleness limitation recorded as D-52 (query the graph structurally instead).

The claim is therefore precise: **kip-sdk ships a working bash-tool code-analysis Miner — a bundled
`code-miner@1.0.0` manifest, a `codeMinerDispatch`, and a live `kip index` CLI that authored 41 signed facts
over real code on the guaranteed tier alone, INV-A1-preserving by construction — with these named, tracked
residuals** — not an unqualified "done."
