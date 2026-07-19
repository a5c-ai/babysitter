# kip-sdk `kip-mature` — maturity, test & documentation program report

> Release record for the **kip-mature** program: taking `@a5c-ai/kip-sdk` from its post-`fix-all` state —
> spec-complete, but **built-yet-undocumented and CLI/MCP-untested end-to-end** — to **demo-ready**. Six
> work items, each run through a spec-driven convergence loop: build items = frozen tests → red gate →
> implement → build/test green gate → three adversarial critics (spec-fidelity / convergence-safety /
> code-quality) scored to a minimum **≥88** → acceptance → commit; docs items = author → an
> **EXECUTABLE-EXAMPLE gate** (every example is actually run) → three doc critics
> (accuracy / completeness / honesty) → acceptance → commit. The program opened with a research + ADR phase
> (ADR-B8, the live model wiring) and closed with a real end-to-end **live demo** on cold-built binaries.
> Per-item build narratives and the debt-resolution detail live in the sibling `reviews/*.md` and
> [`docs/DEBTS.md`](../docs/DEBTS.md); the one new residual this program surfaced is logged there as **D-52**.

## 1. Executive summary

`fix-all` left kip-sdk **spec-complete** — every in-scope surface implemented behind an adversarially-reviewed
suite. But "spec-complete" was not "usable": the package had **zero user documentation**, its `kip` CLI and
MCP server had only ever been exercised **programmatically** (never as shipped binaries), the `ask` verb had
**no wired model** so it could not actually answer, and the suite carried 10 skips, a live flake, and a
disk-exhausting temp-dir leak. `kip-mature` closed that gap on three fronts at once:

- **A live `kip ask`.** Phase A researched and ADR-B8'd the model wiring — the production default now spawns
  the already-authenticated local `claude` CLI via `node:child_process` (a Node **builtin**, so the dep set
  stays `{isomorphic-git}` and the lockfile is untouched). `graph-qa-live` wired it, and a cold-built `kip
  ask` now genuinely answers a question from the graph, with every citation bound to a real signed `factId`.
- **Both testing tracks.** `e2e-binaries` spawns the **real dist binaries** (CLI + MCP) so writes round-trip
  through the shipped artifact, not a test harness. `suite-hardening` made the suite trustworthy — closed the
  temp-dir leak, root-caused the flake (a shared-`dist` race, **not** a timeout), and re-audited every skip.
- **Full documentation.** `docs-consumer` (README + getting-started + CLI + MCP + API — the package had
  **none**), `docs-maintainer` (architecture tour + conformance + contributing), and `docs-integration`
  (ecosystem + root README) — each gated on the requirement that **every example runs** and that the docs
  tell the truth about what ships.

Every item converged: **all 6 acceptance passes are PASS**, critic minimums ranged **88–93**, the live demo
passed **end-to-end on cold-built binaries**, and the program landed with **zero new runtime dependencies**
(`package-lock.json` untouched throughout — Node builtins only).

## 2. Per-item results

| Item | Critic min | Rounds | Commit | What it closed or caught |
|---|---|---|---|---|
| `graph-qa-live` | 88 | 2 (+3-fix follow-up) | `6ebdb6215` | Wired a real model so `kip ask` answers (ADR-B8); **closed D-44**. Caught a probe-confirmed **provenance-forgery** hole (a real signed `factId` could be bound to an invented `eid`), a **forgeable abstention sentinel**, a **zero-JS clean-build** bug (stale `tsbuildinfo` → `tsc` emits nothing), and a **Windows spawn** defect (cmd.exe trampoline). Live-verified from a cold-built binary. |
| `e2e-binaries` | 90 | 2 | `be635d9b6` | Spawns the **real dist binaries** (CLI + MCP) that had only been tested programmatically; added `putNode`/`putEdge`/`branch` signed-fact sugar so writes round-trip through the binary. The new binary coverage **exposed a real `kip retract` provenance crash** the programmatic tests missed; closed the **D-49(2) MCP dispatch-reason tail**. |
| `suite-hardening` | 93 | 2 | `c92838501` | **Closed D-38** — a temp-dir leak found live at ~**80,000** leaked dirs (`close()` `rmSync` + `afterEach` sweep; verified **0 net-new** leak) — plus crash-safe side-file stores and a `computeChainFrontier` DRY fix. **Root-caused the flake:** not a 5s-timeout issue but a **shared-`dist` race** across parallel vitest workers (quarantine + fork cap), plus a separate `testTimeout: 20000`. Re-audited all 10 skips: **3 un-skipped** (now assert real convergence), **7 genuinely deferred** (→ D-50). Added cross-OS CI. |
| `docs-consumer` | 90 | 2 | `9ab894a03` | README + getting-started + CLI + MCP + API — the package had **ZERO** user docs. The executable-example gate caught real drift: CLI write examples **failed** (no keyring how-to) and the SDK identity-persistence recipe was **provably wrong** (it produced a fresh random key). Fixed + verified; filed **D-51** (CLI has no keygen command). |
| `docs-maintainer` | 93 | 2 | `60632d17f` | Architecture tour + conformance guide + contributing guide. Corrected a **DAG-status understatement** (docs said "no commit DAG yet" but `regenerateHeads`/`txn` build it, INV-12-proven) and fixed discoverability. |
| `docs-integration` | 93 | 2 | `bbedd3c9a` | Ecosystem + root README. The ecosystem doc had described kip as **"SPEC/DESIGN ONLY — no `src/`, no shipping code"** for a **6,000+-line built package** — the exact drift this program exists to kill. Corrected across ecosystem / overview / architecture / root-README plus two more canonical surfaces (`index.md`, `package-and-plugin-map.md`) that round 1 missed. |

## 3. What the adversarial loop + gates caught (that a green suite alone would have shipped)

This program is the clearest demonstration yet of why the gate is **not** "the tests pass." A green suite,
on its own, would have shipped every one of the following:

- **A provenance-forgery hole (`graph-qa-live`).** The synthesis path let a model bind a **real, signed
  `factId` to an invented `eid`** — a citation that looks cryptographically sound while pointing at a fact
  that never made that claim. Probe-confirmed by a critic, then structurally closed: citation provenance is
  **rebound from the retrieval set**, and the output schema no longer even offers a provenance channel for
  the model to populate. The abstention sentinel — which a model could otherwise emit to fake a clean
  "I don't know" — was made **non-forgeable** the same way.
- **A zero-JS clean build (`graph-qa-live`).** A stale `tsbuildinfo` caused `tsc` to emit **nothing** on a
  clean build while still exiting 0 — the "built" package shipped no JavaScript. A green test run against
  the previously-built `dist` never sees it. Fixed by moving `tsBuildInfoFile` inside `dist`.
- **A hand-staged `dist` (`graph-qa-live` / closing D-49(1)).** The QA manifest was never copied into
  `dist`, so the **built** `kip ask` died at `ERR_UNREGISTERED_MANIFEST` for every consumer — ADR-B8's
  headline ("`kip ask` genuinely answers") was true only against a manually-staged `dist`. The live
  verification was re-run against a genuinely clean `rm -rf dist && npm run build`, and the manifest is now
  bundled by a dependency-free build step.
- **A provably-wrong identity recipe (`docs-consumer`).** The executable-example gate ran the SDK
  identity-persistence recipe and found it **produced a fresh random key each time** — the opposite of a
  stable identity. A docs pass that only proofread prose would have shipped a recipe that silently breaks
  every reader's signing identity.
- **The "no `src/`" ecosystem doc (`docs-integration`).** A canonical ecosystem surface asserted kip was
  design-only vapor for a 6,000+-line shipping package. Corrected across six surfaces.
- **A real `kip retract` provenance crash (`e2e-binaries`).** Only surfaced once the **real binary** was
  spawned; the programmatic tests had never hit the path.
- **The retrieval-brittleness limitation (Phase C live demo).** The demo itself surfaced that `recall`'s
  text path is **exact-content-seed matching**, so `kip ask` only finds a fact once a `content` prop equal
  to the question verbatim exists — an honest limitation a synthetic test would not have exposed. Logged as
  **D-52** rather than papered over.

The through-line: **a green suite can encode the wrong guarantee, an incomplete artifact, or a false claim.**
The critic gate, the executable-example gate, and a real end-to-end demo are what separate "it passes" from
"it is trustworthy, complete, and true."

## 4. Phase C — live demo outcome (real shipped binaries, cold-built, temp repo)

**PASS, end-to-end.** In a throwaway temp repo against the freshly cold-built binaries:

1. `kip init` → keyring bootstrapped via the D-51 SDK-bridge step → asserted **Ada Lovelace**, an
   organization, an `employed_by` edge, and props.
2. `kip get` / `kip query` / `kip fsck` → all consistent (`fsck` reported `ok`, `badSignatures: []`).
3. The **paid** `kip ask` (`KIP_ASK_LIVE=1`, model `haiku`, **exit 0**) answered **verbatim**:

   > **"Ada Lovelace works at the Analytical Society."**

   citing `factId` **`41045bd83881b2a226a3ac63aed3a72c316b32ec4c5e928d1fed7f9abba05269`** — the
   `employed_by` edge fact.
4. The **MCP server** over real stdio: `initialize` → **11 tools** advertised → returned a **signed
   `NodeView` and `EdgeView`**.

**Honest caveat surfaced by the demo:** `recall`'s text path is **exact-content-seed matching**, so
`kip ask` only located the fact after a `content` prop **equal to the question verbatim** was added; without
that seed it abstains. This is a **real retrieval-brittleness limitation** for genuine free-text questions —
recorded as D-52 (see §6).

## 5. Final suite & integration numbers

- **Test suite:** **91 files — 684 passed, 8 skipped, 0 failed.** The 8 skips are the 7 tracked
  `SKIP-REASON`-tagged conformance deferrals (D-50) plus 1 gated live-`ask` test.
- **Integration gate: PASS** — `build:sdk` + `kip build` + the suite (91 files / 684 passed / 8 skipped) +
  `verify:metadata` all green; lockfile clean.
- **Dependency hygiene:** **zero new runtime deps** across the whole program (Node builtins only);
  `package-lock.json` **untouched**.

## 6. Residuals / open debts (honest)

Demo-ready is not defect-free. The following are the honestly-tracked residuals — none un-does a safety
guarantee (where a capability is absent the code **fails loud**, never fabricating):

**Surfaced by this program:**

- **D-52 (new) — graph-QA retrieval brittleness.** `recall`'s text seed requires an **exact `content`-prop
  match to the query**, so `kip ask` **abstains on genuine free-text questions** unless a content prop
  mirrors the question verbatim. `kip ask` is therefore currently demo-able only with a content-seed; robust
  NL question-answering needs **real semantic/text retrieval** (embeddings or better text matching). Safe
  (it abstains, never guesses) but the headline verb is not yet robust for actual NL.
- **D-50 — 7 deferred conformance skips.** Of the original 10, 3 were un-skipped and now assert real
  convergence; 7 remain genuinely unreachable through the current public surface (missing
  inspection / schema-registration / perturbation seams), each tagged `SKIP-REASON` and guarded so no skip
  is silent. **Open (tracked).**
- **D-51 — no `kip keygen`.** The CLI/MCP **write** journey dead-ends: `kip init` persists no key and no
  command mints one, so writing from the binaries requires the SDK-bridge workaround (used by the live demo
  itself). Fully documented across the consumer doc set. **Open (documented workaround in place).**

**Closed by this program (recorded here for the release trail):**

- **D-44 — Resolved.** `kip ask` answers live via ADR-B8 (`harnessCliSynthesize` spawns the authenticated
  `claude` CLI); the debt **moved** from package coupling to honestly-disclosed **environment coupling**
  (`claude` must be on PATH and authenticated), degrading to the same loud exit-5 failure, never a guess.
- **D-38 — Resolved.** The temp-dir leak (~80,000 dirs live) is closed via `close()` `rmSync` + an
  `afterEach` sweep; verified **0 net-new** leak, plus crash-safe side-file stores and a DRY fix.
- **D-49 — Resolved.** Both tails: the QA manifest is now bundled into `dist` by a dependency-free build
  step (re-verified against a clean build), and the dispatch-failure **reason reaches the operator** on both
  the CLI and — closed in `e2e-binaries` — the **MCP** `kip_ask` surface.

**Carried over from earlier programs (unchanged, still open):**

- **`recall` is an exact-cosine vector scan (no ANN/HNSW)** — INV-5 measured, not gamed, but unscaled;
  plus deferred `accessFreq` salience (observer-effect) and scope/tenancy narrowing. *(D-43)*
- **M8 governance activates per-namespace on `KeyAuthorization` presence** — a documented modeling narrowing
  vs a strict §8.1 bright line; un-governed namespaces stay legacy-trusted for INV-1 back-compat. *(D-42)*
- **`kip ask` host-model + cost** — ADR-B8's environment coupling: `ask` needs a `claude` binary on PATH and
  authenticated (invisible to `package.json`/CI), and the live path is a **paid** model call. *(D-44
  "Consequences".)*

The maturity claim is therefore precise: **"kip-sdk is demo-ready — a live `kip ask`, real-binary e2e, a
trustworthy suite, and full consumer/maintainer/integration docs — with these named, tracked residuals"** —
not an unqualified "done."
