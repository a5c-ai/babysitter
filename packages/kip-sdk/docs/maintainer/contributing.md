# Contributing to kip-sdk

The contribution + debt workflow for `@a5c-ai/kip-sdk`, and the house rules that keep the package
honest. Read [`architecture.md`](./architecture.md) first (the module map + invariants) and
[`conformance-guide.md`](./conformance-guide.md) (how the invariant suite guards itself).

---

## 1. House rules (non-negotiable)

These are enforced by tests and by review; a change that breaks one does not merge.

- **No fallbacks, no silent picks.** *"Fallbacks are evil and should be avoided at all costs"* (repo
  CLAUDE.md). Never resolve an ambiguity with a silent default, a hash tiebreak, or a fabricated value.
  Abstain or fail **loud** (N5): pre-flight resolution failures are exit-3 in `cli/resolve.ts`; no model
  is exit-5 `ERR_ASK_DISPATCH_FAILED` in `graph-qa/`; contradictory `supersede` facts surface a
  first-class `kip:conflict` in `proj.ts`. If you find yourself writing a fallback, **stop**.
- **Set-purity in the proj / digest paths.** `proj(S)` and the fact-set digest are pure whole-set
  functions of the admitted fact set. They must read **no** replica-local quantity (`rxFrom`, ingest or
  commit order, the receiver's clock, local key-sync state) — that is INV-1, and it is what makes
  convergence hold. Never introduce a pairwise/binary merge or a wall-clock read into these paths.
- **INV-A1 — microagents are clients.** No active-layer path (functionalities, learners, graph-QA) may
  change state except by appending a **signed fact** through the ordinary ingest gate. The active layer
  reads through `proj` and writes only as an ordinary author.
- **Zero new runtime deps.** kip-sdk's only runtime dependency is `isomorphic-git` — used by
  `kip-repo.ts` for tree/commit render + the `regenerateHeads()`/`txn()` commit-DAG path (so the dep is
  load-bearing, not vestigial); `substrate.ts` writes git *loose blob* objects by hand and does not
  import it (ADR-B1/B6). Do not add a runtime dependency. Reach for `node:` builtins (`node:crypto`,
  `node:zlib`, `node:child_process`) the way `signing.ts` / `substrate.ts` / `cli/ask.ts` already do.
- **Never touch `package-lock.json`.** Running `npm install` on Windows pins win32 native bindings as
  non-optional and breaks Linux `npm ci` (`EBADPLATFORM`). `.claude/settings.json` blocks direct
  lockfile edits. If you genuinely need a dependency change, raise it — do not regenerate the lockfile
  on Windows.
- **No `@a5c-ai/babysitter-sdk` dependency.** The CLI (AC-1) and MCP server (N-mcp-1) link **self +
  genty** only. kip is a memory *client*, not a run orchestrator; it stands up no
  `OrchestrationProvider` / `JournalProvider` registry and must never import babysitter-sdk's `src/mcp/`
  run-effect surface. The scope-boundary comments at the top of `cli/index.ts`, `cli/kip.ts`,
  `mcp/index.ts`, and `mcp/server.ts` are load-bearing.

---

## 2. The DEBTS.md convention

[`../DEBTS.md`](../DEBTS.md) is the package's **verified catalog of debt** — and its resolution record.
It is not a loose backlog: every entry was opened at its cited file:line and confirmed both that the
quoted text exists and that it constitutes the claimed debt. It spans documentation debt (rounds 1–3,
`D-01`–`D-26`) and implementation debt (round 4 onward, `D-27` through the `fix-all`-era entries up to
`D-51`). Many entries are `Resolved` in place, but the register is **not** all-closed — roughly a dozen
remain `Open` (grep `Status:\*\* Open`), so treat it as the live source of truth for what is still
deferred, not a historical archive.

Each entry is a `D-NN` heading with a fixed field set:

- **Category** — e.g. Contradictions / Definitions / Faithfulness / Architecture / Completeness /
  Redundancy (docs debt), or Implementation / durability / correctness (impl debt).
- **Severity** — Critical / Major / Minor.
- **Location(s)** — the exact file(s) (and line ranges for docs debt) where the debt lives.
- **Evidence** — quoted proof that the debt is real, gathered at the cited location.
- **Suggested fix** — the concrete remediation.
- **Status** — the resolution record: `Open`, `Resolved` (with *how* it was fixed and the guard test
  that pins it), or `Partially resolved`. Implementation entries often also carry **Surfaced** (where it
  was found) and **Coverage** (the regression test).

When you fix a debt, **edit its `Status` in place** to record how — do not delete the entry; the
register is the resolution history. When you discover new debt while doing other work, add a new `D-NN`
entry rather than silently expanding an unrelated change (and prefer flagging it if it would bloat the
current PR). A worked example is `D-38` (the substrate/temp-dir hardening), whose `Status` names the
four frozen guard suites that close it.

---

## 3. The TDD + adversarial-review workflow

This package was built — and should keep being changed — with a **frozen-tests-first**, adversarially
reviewed loop. The pattern (see the reports under `../../reviews/`, e.g. `build-final-report.md`,
`fix-all-report.md`, and the `graph-qa-live` commits):

1. **Freeze the spec as tests first.** Author the tests **before** the implementation, driven by the
   spec/ADR, and commit them *red*. They encode the target behavior and become the permanent regression
   guard. Many files carry a header saying so (e.g. the D-38 guards are "FROZEN, spec-driving, authored
   BEFORE the fix … MUST FAIL TODAY").
2. **Implement to green.** Write the minimum real implementation that turns the frozen tests green —
   without weakening or deleting them.
3. **Run the gates.** Build, the full suite, the conformance completeness guard, and the hardening
   guards (§5). No silent skips, no weakened assertions.
4. **Adversarial critics.** Independent review passes (see the `round2-`/`round3-`/… critic-fix test
   files and the `reviews/` reports) hunt for holes — storage collisions, authorization gaps, digest
   tiebreaks, convergence edge cases — and each finding lands as its own regression test.
5. **Acceptance + honest debt.** Converge to the acceptance bar; anything real but deferred is recorded
   in `DEBTS.md` with an honest `Status`, never quietly dropped.

The practical rule for a contributor: **write the failing test that proves the bug/feature first, keep
every existing assertion, and record any deferral in DEBTS.md.**

---

## 4. Build, test, and the guards

**Prerequisites.** Use a modern LTS Node — the cross-OS CI matrix
(`.github/workflows/kip-conformance-cross-os.yml`) pins **Node 22**, and `@types/node` targets the v20
line, so **Node 20+** is the floor. Bootstrap the workspace **once from the repo root** with `npm ci`
(not `npm install` — see the "Never touch `package-lock.json`" house rule in §1) before the first build.

From the repo root:

```bash
# one-time: install the workspace deps from the committed lockfile
npm ci

# build kip-sdk (tsc + bundle the graph-QA microagent manifest into dist/)
npm run build:kip

# run the full package suite (unit + conformance + serialized e2e projects)
npm run test:kip
```

Target a single guard or file with vitest's positional filter (fast, deterministic):

```bash
# the conformance completeness guard (manifest ≡ docs/60 anchors ≡ files on disk)
npm run test --workspace=@a5c-ai/kip-sdk -- suite-completeness

# the suite-hardening guards
npm run test --workspace=@a5c-ai/kip-sdk -- no-silent-skips temp-dir-hygiene
```

Before opening a PR, run at minimum `build:kip`, `test:kip`, and `suite-completeness`. Cross-OS
divergence is caught by `.github/workflows/kip-conformance-cross-os.yml` (windows + ubuntu), but reproduce
locally where you can — the git-substrate paths are the usual source of OS-specific breakage.

> Docs edits also gate CI: `.github/workflows/kip-docs-link-check.yml` link-checks the doc set, so keep
> cross-references valid.

---

## 5. Running a live `kip ask`

Graph-QA's retrieval half is deterministic and fully tested in-process; the single non-deterministic
step — prompting a model to write the prose and pick per-claim citations — is the injected `synthesize`
seam (the accelerator boundary, §5.3). The **production** default (`cli/ask.ts`, ADR-B8) binds
`harnessCliSynthesize`, which spawns the already-authenticated local **`claude` CLI** via
`node:child_process` (no dependency crosses the boundary).

To exercise the real live path yourself you need a `claude` binary on `PATH` that runs and is
authenticated (an `ANTHROPIC_API_KEY`, or `~/.claude/.credentials.json`). Then, against a repo that has
content, `kip ask` runs the real retrieval→synthesis pipeline:

- With **no matching content**, it abstains honestly: `status: "unanswerable"`, `answer: null`, exit 0.
- With facts found but **no usable model**, it fails **loud** — exit 5, a diagnostic on stderr — and
  never invents an answer (N5).

The live path costs roughly **$0.02–0.045 per ask** on the default `haiku` model. Because of that cost,
**every live ask in the test suite is gated behind `KIP_ASK_LIVE=1`** *and* an availability probe: a
default `npm run test:kip` never spends. `graph-qa-live.test.ts`'s `resolveLiveGate` is the only thing
allowed to skip — it skips with an explicit reason when either `KIP_ASK_LIVE` is unset or the probe
reports no usable CLI, and it **fails** (never silently passes) when opted-in but broken. Set
`KIP_CLAUDE_BIN` to an explicit path if the wrong `claude` is picked up on `PATH`. See
[`../guide/cli.md`](../guide/cli.md) for the full `kip ask` contract and exit codes.
