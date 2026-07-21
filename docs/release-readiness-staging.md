# Release readiness — `staging` → `main`

_QA round run `01KXZE14FY9SSQQ8ENFVZVYXAD`, 2026-07-21. Analyzed staging HEAD `95a0b6bab`+ (branch moved during the round — a concurrent kip-sdk run was actively committing; see Caveats)._

## Verdict: GO — `ci.yml` is fully green on the fixed staging sha

The bug fixes this release claims to deliver are **real and correct**, but the round found they shipped **structurally unguarded** — their tests either did not exist or did not run in CI, and one shipped fix (RC-1) was actively breaking every plugin-install CI lane. All of that is now closed on `staging` and **confirmed green by a real CI run against the release sha**.

**CI confirmation (`ci.yml` run `29812297914` = SUCCESS, all jobs):** Docs QA ✓, Lint/Tests/Package ✓ (the newly-wired policy/tools/trust-core security suites), Observer Dashboard ✓, Workspace Coverage ✓ (Caveat 1 fixed). **Live Stack bp/predefined interactive claude-code/gpt-5.5 lane ✓** — the exact install-mode lane RC-1 was breaking now passes end-to-end.

Only by-design deferrals remain (owner's call), none release-blocking:
- **kip-sdk CI (recommendation):** the largest part of the diff, but a **new/unreleased** package; its cross-OS workflow already exists untracked as the concurrent kip run's artifact — commit it. Not committed here to avoid clobbering that active run.
- **RC-4 (recommendation):** `ci.yml` runs only on `pull_request`; add a `staging` push-trigger or branch protection so direct-push landings can't ship unguarded again.
- **RC-3 (deferred, owner-approved):** external dispatcher ref hygiene, not product code.

_Original Caveat 1 (transport-adapter Workspace Coverage TS2307) was **introduced by this release** (transport-adapter's proxy-attestation wiring added trust-core/policy-adapter deps; the isolated job built only atlas first) and masked by RC-4. Fixed in `26ff42325`: build the dependency closure in order. Reproduced locally (`rm dist` → identical TS2307) and confirmed green in the CI re-run above._

---

## 1. What this release claims to fix

162 commits since the last main merge (`23a00eafd`, 2026-07-01). The volume is **inverted from the risk**: 192 of 408 changed files are the never-before-released `@a5c-ai/kip-sdk`, whose regression risk is near-zero regardless of coverage. The real release risk sits in ~10 small commits against already-shipped surfaces, clustered as:

| Cluster | Risk | Claim |
|---|---|---|
| C1 policy authorization | blocker | Milestone A–E proof-based policy engine closed authorization-bypass defects (delegation-chain linkage, argv-evasion, attestation binding, quorum spoofing, fail-open signed-breakpoint, gate wiring). |
| C2 policy activation | blocker | GATE-3 credential injection + authorization ALLOW path + code_executor invariant made activatable. |
| C3 trust-core extraction | high | Trust primitives extracted to `@a5c-ai/trust-core`; extraction orphaned 4 imports and broke typecheck (shipped broken ~17 days, fixed today by `95a0b6bab`). |
| C4 codex marketplace + hooks | blocker | `babysitter-codex` marketplace-addable (codex-format manifest); adapters-hooks stopped emitting the Codex-invalid `decision:"noop"` sentinel. |
| C5 sdk bin + marketplace owner | blocker | Plugin hooks resolve `adapters-hooks` bin; root marketplace load fixed (owner object). |
| C6 observe command | medium | `observe` command frontmatter quoting (unquoted `[...]` argument-hint broke load). |
| C7/C8 kip-sdk | low | Internal debt closure + CLI live-demo defects in the new package. |

## 2. Validation status per cluster (after adversarial refutation)

Verdicts are **post-refutation** — every "covered"/"partial" claim was attacked, several downgraded. The recurring finding: **tests existed but did not run in CI.**

| Cluster | Verdict (pre-fix) | Evidence |
|---|---|---|
| C1 | **uncovered** | Tests genuinely fail on revert (deleting the delegation-chain check → 4/11 fail; restoring old argv-matcher → 13/71 fail) — but `packages/adapters/policy` was in **no workflow** and absent from `adapters-build.cjs`; `ToolDispatcher.create` production wiring was deletable with 201/201 green. |
| C2 | partial | Reverting `spawn-runner` gate3 wiring left **970/970** passing; the shipped test calls the resolver directly, never drives the runner. |
| C3 | partial | Orphaned-import break was catchable by genty-core typecheck but survived 17 days because direct-push landings bypass PR `ci.yml` (RC-4); trust-core suite gated nowhere. |
| C4 | **uncovered** | Zero tests. `scripts/sync-external-plugin-repos.mjs` (the marketplace generator users consume) had no test anywhere; the noop-sentinel guard was unexercised. |
| C5 | partial | The load-bearing bin metadata + marketplace owner had no test; the bin fix (`bd11c5b1b`) also **caused RC-1**. |
| C6 | **uncovered** | No test YAML-parses command frontmatter. |
| C7/C8 | partial | Tests are solid and fail on revert, but kip-sdk runs in **no committed CI** (the only kip vitest workflow is untracked). |

## 3. CI stack matrix — triage

`ci.yml` (lint/build/typecheck/test) triggers only on `pull_request`; the July work landed via **direct push**, so **`ci.yml` last ran on staging 2026-06-30** and never exercised the release contents (**RC-4**). Root causes from the failing 2026-07-20 runs:

| ID | Category | Blocker | Root cause |
|---|---|---|---|
| RC-1 | **product-regression** | yes | Every `bp/*` (install-mode) Live Stack lane fails at `npm install --global ./packages/adapters/hooks/cli`. `bd11c5b1b` gave `babysitter-sdk` an `adapters-hooks` bin that `@a5c-ai/hooks-adapter-cli` also declares → second global install EEXISTs. |
| RC-4 | environment | yes | `ci.yml` never ran on the branch (pull_request-only + direct-push landings). |
| RC-2 | flake | no | One wave had a truncated `build-all-dist` artifact (missing genty dist); self-corrected, but the workflow fail-opened, masking it as a product failure. |
| RC-3 | environment | no | QA Dispatch checkout against non-resolving refs (external dispatcher). Deferred (owner-approved). |

## 4. Gaps closed this round

All committed surgically (per-gap explicit `git add`, not a broad add — a concurrent kip-sdk run had uncommitted WIP in the shared tree) and pushed to `staging`.

| Gap | Commit | Verification |
|---|---|---|
| RC-1 bin collision + install stderr | `92efd59bb`, `4d5a1451b` | `--force` de-collides the two providers; regression tests guard **both** the contract spec and the runner's executed install list — **fail on revert**. Documented user flow unaffected (installs only babysitter-sdk). |
| Wire policy/tools/trust-core into CI | `7d00e7d3d` | Explicit build+typecheck+test steps in `ci.yml` + `adapters-build.cjs`. Confirmed green in CI: **`ci.yml` "Lint, Tests, Package" = success** (trust-core 46, policy 230, tools 206). |
| Deletable gate wiring (C1/C2) | `83f3b24a8` | Real `ToolDispatcher.create` deny test (**fails if `create` neutered**) + spawn-runner gate3 credential-leak test (**fails if `gate3=undefined`**). Revert-verified. |
| RC-2 fail-fast | `099a06b84` | Missing/truncated-dist signature now fails fast with a labelled message; legit flaky-postinstall tolerance unchanged. 4 tests. |
| C4 marketplace generator + noop-sentinel | `44daa132c` | Codex-format marketplace test + noop-sentinel e2e — both fail on revert. |
| C5 marketplace owner + sdk bin | `44daa132c` | Assert `.claude-plugin` owner + sdk bins — fail on revert. |
| C6 command frontmatter | `44daa132c` | YAML-parses every `plugins/*/commands/*.md`; fails on unquoted argument-hint. |
| G-WINPATH cross-platform paths | `ffe807c6d` | `getSessionFilePath` → `path.join`; 8 Windows-only test failures resolved (Linux CI was unaffected). |

**Gates after remediation:** local `build:sdk && test:sdk && verify:metadata` → **2328 passed / 9 skipped**. Adversarial review of the 6 core commits → **89/100, zero gamed tests, no fallbacks, no weakened/skipped tests, lockfile untouched**; its one actionable finding (RC-1 test didn't guard the runner's executed list) closed by `4d5a1451b`.

## 5. CI verification against the fixed sha (G-RC4-VERIFY)

Dispatched `ci.yml` and Live Stack via `workflow_dispatch --ref staging`:

- **`ci.yml` `29809037087`** — "Lint, Tests, Package" = **success** (proves the newly-wired security suites + build + test:sdk pass on the release sha). Overall run = failure **only** from the pre-existing "Workspace Coverage / transport-adapter" job (Caveat 1) — no commit in this release touches transport-adapter.
- **Live Stack vanilla lane `29809134002`** — claude-code/gpt-5.5 non-interactive **vanilla** lane = **success** (confirms the branch live-stack works and the RC-2 change is safe).
- **Live Stack bp lane `29811363446`** — dispatched to exercise the RC-1 install path end-to-end (in flight at report time). RC-1 is otherwise proven at the unit level (revert-verified regression tests guarding both fix sites) and by static mechanism analysis.

## 6. Tracked debts / deferred (owner-visible)

- **Caveat 1 — `ci.yml` Workspace Coverage / transport-adapter QA surface fails.** Pre-existing, unrelated to this release; surfaced only because RC-4 kept `ci.yml` from ever running on the branch.
- **RC-4 root fix (recommendation, not applied):** `ci.yml` runs only on PRs; direct-push landings never gate. Add a `push: [staging]` trigger or branch protection so this can't recur. Not applied here to avoid running the full matrix on every commit without owner sign-off.
- **G-CI-KIP (recommendation):** kip-sdk runs in no *committed* CI. A complete cross-OS workflow (`.github/workflows/kip-conformance-cross-os.yml`) already exists **untracked** as the concurrent kip run's artifact — commit it. Not committed here to avoid clobbering another active run's WIP; kip is unreleased (low risk).
- **G-C8-REG (recommendation):** kip `register --include/--exclude/--git-sha` flags have no direct test. Same kip territory; unreleased.
- **RC-3 (deferred, owner-approved):** QA Dispatch non-resolving refs come from an external dispatcher, not product code.

## 7. Caveats on the round itself

A **concurrent orchestration run** (`kip-entity-linker`) was committing to `staging` throughout this round; HEAD moved several times and its uncommitted kip-sdk WIP shared the working tree. All audits recorded the sha analyzed; all commits were surgical to avoid bundling that WIP; audit subagents were read-only or restored their scratch edits. This is a standing hazard of overlapping runs on one branch, not specific to this release.
