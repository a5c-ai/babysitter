# Babysitter — Component Maturity Matrix

Components are graded by what is tested **thoroughly and automatically** — CI-gated unit/e2e tests plus the live-stack agent×model×OS matrix. A component is only graded high if its tests are *actually run and gated* by a workflow; in-tree specs that no workflow invokes do not count toward maturity.

**Last updated:** 2026-06-25

Every grade cites concrete evidence — workflow jobs, test globs, or the live QA-Evidence matrix. Where a component lacks automated test execution, it is marked lower and the gap is stated explicitly.

## Maturity levels

| Level | Criteria |
| --- | --- |
| **L0 Experimental** | No automated tests; no vitest/node:test config and zero `*.test` files. Built only as a dependency, if at all. |
| **L1 Unit-only (ungated)** | Unit/spec tests exist in-package but are **NOT** invoked by any `.github/workflows` job (no build/test step references the workspace). |
| **L2 CI-built** | Built/linted/typechecked in CI (`ci.yml` or `publish.yml` Build All / Validate job) with little-to-no unit test execution gating the workspace. |
| **L3 CI-tested** | Unit/contract and/or e2e tests for the workspace are **RUN and gated** in CI (`ci.yml` or a `publish.yml` Validate-* job invokes its test script). |
| **L4 Cross-axis-validated** | L3 **PLUS** live e2e GREEN across the relevant axis matrix (agents × modes × OS, and/or models × OS) in `live-stack`/`live-stack-published` CI. |

## Marker legend

`✅ tested-green` · `🟡 partial/known-flaky` · `⛔ blocked/failing` · `— not applicable/untested`

## Primary matrix

| Component | Maturity | Automated test signals (unit / CI / e2e) | Relevant axis | Axis coverage | Evidence |
| --- | --- | --- | --- | --- | --- |
| **babysitter-sdk** (`packages/babysitter` + `library/`) | L3 CI-tested | unit: bin smoke + packed-metapackage exit-code gate (node:test) in `packages/babysitter`; SDK logic in `library/` (~4 `*.test.*` + shared `__tests__/*.test.mjs`) · ci: Lint SDK, `test:sdk`, `test:babysitter-metapackage`, Validate Core Runtime (`test:sdk`, `test:architecture`), `verify:metadata` · e2e: transitively via every live-stack lane | depth | Lint + metadata + architecture-boundary gate + `test:sdk` in CI, but `test:sdk` is thin (bin smoke); deeper process behavior validated transitively via live-stack. `test:library`/`test:shared` not wired into main CI test steps. | `ci.yml:80-108`; `publish.yml:235-240,1461-1471`; `packages/babysitter/bin/__tests__/babysitter.test.js`; `packages/babysitter/bin/__tests__/exit-codes.packaged.test.js`; `library/processes/shared/__tests__/` |
| **atlas** (graph catalog) | L3 CI-tested | unit: 24 `*.test.ts`; catalog-contract suite (`test:atlas-catalog-contracts`) · ci: Build All phase 1 (atlas first), Build Atlas packages, Verify atlas graph data, `verify:metadata` · e2e: — | depth | Built foundational + graph-data-verified in CI; 24 contract/unit tests exist though not clearly invoked by a workflow step — primarily build + graph-verify gated. | `packages/atlas` (24 `*.test.ts`); `publish.yml` (Build phase 1 + Verify atlas graph data); `ci.yml:135-138` |
| **adapters-core** | L4 Cross-axis-validated | unit: 51 `*.test.ts` (largest adapter suite) · ci: Validate Adapter Surfaces tests `packages/adapters/core` · e2e: transitive via live-stack adapters path | agent | Runtime owner exercised across all live-stack agent lanes; deep CI-gated unit suite. | `packages/adapters/core` (51 tests); `publish.yml` (adapters tests core); `QA-Evidence.md` vanilla-NI matrix |
| **adapters-cli** | L4 Cross-axis-validated | unit: 30 `*.test.ts`; **hosts** the live-stack runners (`tests/live-stack/*`) · ci: Adapter Surfaces tests `packages/adapters/cli` · e2e: `test:e2e:live-stack:*`, `live-stack.yml`, `live-stack-published.yml` | agent | This package **is** the live-stack harness — documented-install + primary-live-runner + pipeline-scenario drive the full agent × mode × OS matrix. | `packages/adapters/cli/tests/live-stack/{documented-install,primary-live-runner,pipeline-scenario,scenario-contract}.test.ts`; `live-stack-published.yml` |
| **adapters-codecs** | L3 CI-tested | unit: 31 `*.test.ts` (adapters root vitest config) · ci: Adapter Surfaces tests `packages/adapters/codecs` · e2e: transitive via live-stack `tool_calls` codec across providers/models | model | Codecs normalize per-provider/model `tool_calls`; exercised across live-stack model lanes (gpt-5.5 green; weak models hit #956 at file-creation, not codec). | `packages/adapters/codecs` (31 tests); `publish.yml` (adapters tests codecs) |
| **transport-adapter** | L4 Cross-axis-validated | unit: 14 `*.test.ts`; `scorecard:migration` · ci: Adapter Surfaces tests transport-adapter + `scorecard:migration` · e2e: live-stack asserts `transportTraceId` / transport-adapter-trace artifact per lane | model | Transport trace is an asserted live-stack artifact across all model lanes; unit-tested + migration-scorecarded in CI. | `packages/adapters/transport` (14 tests); `live-stack-published.yml` (`transportTraceId`, transport-adapter-trace) |
| **adapters-gateway** | L3 CI-tested | unit: 9 `*.test.ts` · ci: Adapter Surfaces tests `packages/adapters/gateway` · e2e: — | agent | Control-plane gateway unit-tested + CI-gated; no dedicated cross-axis e2e beyond build/test. | `packages/adapters/gateway` (9 tests); `publish.yml` (gateway) |
| **triggers-adapter** | L3 CI-tested | unit: 10 `*.test.ts`; `test:unit` + `test:e2e` + `test:coverage` · ci: `ci.yml` triggers unit/e2e/coverage, Adapter Surfaces `test:unit`, E2E Integration `test:e2e` + coverage · e2e: E2E Integration Triggers e2e + coverage | depth | The most thoroughly CI-gated adapter — unit + e2e + coverage in **both** `ci.yml` and `publish.yml`. | `packages/adapters/triggers` (10 tests); `ci.yml:145-158`; `publish.yml:400-401` |
| **channels-adapter** (comm-adapter) | L3 CI-tested | unit: 14 `*.test.ts` · ci: Adapter Surfaces tests `packages/adapters/channels`, `verify:release` comm-adapter, `ci.yml` comm-adapter release verification · e2e: — | depth | Unit-tested + release-verified in CI. | `packages/adapters/channels` (14 tests); `publish.yml` (channels); `ci.yml:165-168` |
| **extensions-adapter** | L3 CI-tested | unit: 12 `*.test.ts`; `test:extension-mux` · ci: `ci.yml` adapters-extensions tests, Validate Observer And Compiler tests extensions-adapter · e2e: — | depth | Unit-tested and gated in both `ci.yml` and `publish.yml`. | `packages/adapters/extensions` (12 tests); `ci.yml:200-203`; `publish.yml:607-610` |
| **adapters-observability** | L3 CI-tested | unit: 7 `*.test.ts` · ci: Adapter Surfaces tests `packages/adapters/observability` · e2e: — | depth | Unit-tested and CI-gated. | `packages/adapters/observability` (7 tests); `publish.yml` (observability) |
| **adapters-tools** | L1 Unit-only (ungated) | unit: 6 `*.test.ts` (vitest.config.ts) · ci: built in Build All; **NOT** in the adapters package-tests enumeration · e2e: — | depth | Unit suite + config exist but no workflow step runs its tests by name. | `packages/adapters/tools` (6 tests, vitest.config.ts); `publish.yml` (tools absent from test enumeration) |
| **adapters-config / adapters-launch** | L2 CI-built | unit: 0 `*.test.*` in either · ci: built via Build All / `build:adapters` · e2e: — | none | No automated tests; built only. | `packages/adapters/config` (0); `packages/adapters/launch` (0); `ci.yml:130-133` |
| **hooks-adapter-core** | L4 Cross-axis-validated | unit: 25 `*.test.ts`; `test:hooks-adapter` · ci: `ci.yml` Hooks-proxy unit tests, Adapter Surfaces Hooks-proxy unit tests · e2e: `test:e2e:adapters-hooks-adapter`, live-stack bridged-hooks (BP) mode | depth + agent | Unit-tested + gated in `ci.yml` AND `publish.yml`; bridged-hooks live-stack GREEN for claude on Ubuntu (QA-Evidence 2026-06-23). | `packages/adapters/hooks/core` (25 tests); `ci.yml:125-128`; `publish.yml:308`; `QA-Evidence.md` (bridged-hooks GREEN) |
| **hooks-adapter-cli** | L3 CI-tested | unit: 6 `*.test.ts` (run under `test:hooks-adapter`) · ci: `ci.yml` + `publish.yml` `test:hooks-adapter` (core+cli) · e2e: — | depth | Unit-tested + gated via shared hooks-adapter runner. | `packages/adapters/hooks/cli` (6 tests); `publish.yml:308` |
| **hooks per-agent adapters** (claude/codex/gemini/copilot/cursor/pi/oh-my-pi/opencode/openclaw/antigravity/hermes/genty) | L2 CI-built | unit: no dedicated per-adapter `*.test.ts`; covered by hooks-core suite + live-stack · ci: Build All phase 2 builds each `hooks-adapter-$adapter`; `test:hooks-adapter` (core proxy tests) · e2e: live-stack agent matrix per agent | agent | Each agent adapter is **built** in CI; behavior validated via live-stack where claude-code/codex/pi/gemini/hermes(non-Win)/genty are GREEN on gpt-5.5, while antigravity (#945)/cursor (#562)/copilot (#560)/opencode are skipped/fail and hermes-Windows is blocked (#856). | `publish.yml` (build each hooks-adapter); `QA-Evidence.md` per-agent matrix |
| **genty-platform** (babysitter-harness) | L3 CI-tested | unit: 135 `*.test.ts` (largest unit suite in repo) · ci: `ci.yml` babysitter-harness tests, Validate Core Runtime tests genty-platform · e2e: live-stack genty lane | depth | Very deep unit suite, gated in `ci.yml` and `publish.yml`. | `packages/genty/platform` (135 tests); `ci.yml:216`; `publish.yml:250` |
| **genty-core** | L4 Cross-axis-validated | unit: 22 `*.test.ts` · ci: `ci.yml` genty-core tests, Validate Core Runtime tests genty-core · e2e: live-stack genty lane across models | model | Unit-tested + CI-gated; live-stack genty GREEN on gpt-5.5 all 3 OS (#936 fixed) but FAILS on every weaker model at file-creation only (#956). Model-axis coverage real but green only at the strong tier. | `packages/genty/core` (22 tests); `ci.yml:211-214`; `QA-Evidence.md` (genty gpt-5.5 PASS ×3 OS; weak models FAIL #956) |
| **genty-runtime** | L1 Unit-only (ungated) | unit: 19 `*.test.ts` (vitest.config.ts) · ci: Build All builds genty-runtime; no explicit Validate test step · e2e: live-stack genty lane (transitive) | depth | Solid unit suite + config, but no workflow step runs genty-runtime tests by name. | `packages/genty/runtime` (19 tests, vitest.config.ts); `publish.yml` (Build genty-runtime, no test step) |
| **genty-cli** | L1 Unit-only (ungated) | unit: 10 `*.test.ts` (vitest.config.ts) · ci: built in Build All · e2e: live-stack genty lane drives the genty CLI | agent | Unit suite exists; e2e behavior validated through the genty live-stack lane, not a named unit-test CI step. | `packages/genty/cli` (10 tests, vitest.config.ts); `QA-Evidence.md` (genty CLI runs-dir fix verified in live-stack) |
| **genty-tui** | L2 CI-built | unit: 40 `*.test.ts` (no local vitest.config found) · ci: `ci.yml` + `publish.yml` `verify:release` genty-tui, `build:local` genty-tui · e2e: — | depth | Substantial test count + release-verified in CI, but the CI step is `verify:release` (artifact gate), not a confirmed unit-test run of the 40 specs. | `packages/genty/tui` (40 tests); `ci.yml:160-163` (`verify:release`) |
| **genty-ui** | L1 Unit-only (ungated) | unit: 18 `*.test.tsx` (no local vitest.config found) · ci: built in Build All · e2e: genty-web-app browser e2e indirectly covers shared UI | none | Unit specs exist but no workflow step runs them by name; only built. | `packages/genty/ui` (18 tests); `publish.yml` (build genty-ui) |
| **genty-web-app** | L3 CI-tested | unit: 0 `*.test.*` (Playwright browser e2e instead) · ci: `ci.yml` adapters webui browser e2e, E2E Integration adapters webui browser e2e · e2e: Playwright Chromium browser e2e in `ci.yml` and `publish.yml` | depth | No unit tests, but a real Playwright browser e2e runs in **both** `ci.yml` and `publish.yml`. | `packages/genty/web-app` (browser e2e); `ci.yml:190-193`; `publish.yml:421` |
| **genty app shells** (desktop/mobile/tv/watch) | L0 Experimental | unit: ~0 (mobile-android-app has 1; rest 0) · ci: not individually built/tested in observed Validate jobs · e2e: — | none | Platform shells with effectively no automated tests and no dedicated CI gating. | `packages/genty/{desktop-app,tv-androidtv-app,watch-watchos-app}` (0); `mobile-android-app` (1) |
| **kradle-core** (`@a5c-ai/kradle`) | L3 CI-tested | unit: 76 `tests/*.test.js` (node:test) · ci: Validate Kradle Test kradle core (`npm test`), `test:kradle` · e2e: E2E Integration Kradle e2e + smoke | depth | Large node:test suite gated by Validate Kradle, plus e2e + smoke in E2E Integration. | `packages/kradle/core/tests/*.test.js` (76); `publish.yml:549-552`; `publish.yml:142-147` (e2e + smoke) |
| **kradle-sdk / kradle-cli** | L2 CI-built | unit: 0 in either · ci: built via Build All / kradle docker build · e2e: — | none | No automated tests located; built only. | `packages/kradle/sdk` (0); `packages/kradle/cli` (0); `publish.yml` (build kradle) |
| **kradle-web** | L1 Unit-only (ungated) | unit: 30 `*.spec`/`*.test` in tree, but **NO** workflow step runs them by name; built/imaged only · ci: build kradle-web + image · e2e: — | none | Spec files exist in-tree but are not wired into a CI test step (prebuilt Vite library embed). | `packages/kradle/web` (30 spec/test files); `publish.yml` (build kradle-web + image) |
| **kradle-installer** (cloud workspace) | L3 CI-tested | unit: via `test:cloud` · ci: Validate Cloud Workspace `test:cloud` + `verify:cloud-release` · e2e: — | depth | Cloud workspace tests + release verification gated in Validate Cloud Workspace. | `publish.yml:486-491` (`test:cloud` + `verify:cloud-release`) |
| **observer-dashboard** | L3 CI-tested | unit: 75 `*.test.ts(x)`; `test:observer` · ci: Validate Observer And Compiler Test observer-dashboard, `verify:observer-release` · e2e: — | depth | Large unit suite gated by Validate Observer And Compiler + release verification. | `packages/observer-dashboard` (75 tests); `publish.yml:617-620` |
| **harness plugins** (babysitter-unified, atlas-unified) | L4 Cross-axis-validated | unit: no `*.test.*`; generated by generate-plugins / generate-atlas-plugins (no test gate) · ci: `generate-plugins.yml` (generation), `live-stack-published.yml` `documented_install` validates published babysitter plugin install + hook-load for claude-code + codex · e2e: `documented_install` + BP lanes | agent | babysitter-unified is e2e-validated via `documented_install` (claude-code + codex, all 3 OS GREEN, #960) + BP lanes; atlas-unified is generated/built with no automated install-test gate. | `plugins/babysitter-unified/plugin.json`; `live-stack-published.yml` (`documented_install`); `QA-Evidence.md` (documented_install claude+codex GREEN ×3 OS, #960) |
| **live-stack test surface** | L4 Cross-axis-validated | unit: scenario-contract (framework self-test), primary-live-runner, pipeline-scenario, documented-install · ci: `live-stack.yml`, `live-stack-published.yml`, `failure-triage-live-stack.yml`, `live-stack-gardening.yml` · e2e: full agent × mode (vanilla-NI, vanilla-interactive, bridged-interactive, bridged-hooks/BP) × model × OS matrix | agent + model | Published live-stack GREEN on Ubuntu/macOS/Windows for claude-code + codex + pi vanilla-NI on gpt-5.5, plus documented_install (claude+codex), claude BP (3 OS), claude bridged-interactive/bridged-hooks (Ubuntu). Weak-model (gpt-5.4-mini) generalizes the #956 file-creation ceiling beyond genty (claude passes the identical path → infra sound). Source-build also GREEN for gemini-cli, hermes (non-Windows). Blocked/failing: cursor (#562), copilot (#560), antigravity (#945), opencode, hermes-Windows (#856). | `packages/adapters/cli/tests/live-stack/*.test.ts`; `live-stack-published.yml` (agents/models/modes matrix); `QA-Evidence.md` (matrices, last updated 2026-06-20..06-23) |

## Harness axis sub-table (per-agent)

Rows are the harness-dependent components (axis type "agent"). Cells reflect live-stack lane outcomes from `agentsAxis` / `QA-Evidence.md`.

| Component | claude-code | codex | pi | gemini-cli | hermes | genty | cursor | copilot | opencode | antigravity |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| adapters-core | ✅ | ✅ | ✅ | ✅ | 🟡 [^win] | 🟡 [^genty] | ⛔ [^cur] | ⛔ [^cop] | ⛔ [^oc] | ⛔ [^anti] |
| adapters-cli (live-stack harness) | ✅ | ✅ | ✅ | ✅ | 🟡 [^win] | 🟡 [^genty] | ⛔ [^cur] | ⛔ [^cop] | ⛔ [^oc] | ⛔ [^anti] |
| hooks per-agent adapters | ✅ | ✅ | ✅ | ✅ | 🟡 [^win] | 🟡 [^genty] | ⛔ [^cur] | ⛔ [^cop] | ⛔ [^oc] | ⛔ [^anti] |
| harness plugins (babysitter-unified) | ✅ | ✅ | — | — | — | — | — | — | — | — |
| live-stack test surface | ✅ | ✅ | ✅ | ✅ | 🟡 [^win] | 🟡 [^genty] | ⛔ [^cur] | ⛔ [^cop] | ⛔ [^oc] | ⛔ [^anti] |

Notes: `openclaw` and `oh-my-pi` have hooks adapters built in CI but no GREEN live-stack lane in the QA matrix, so they are omitted from the columns above (effectively `—`). `pi` also has one DeepSeek-V4-Pro NI Ubuntu regression (#954). harness plugins (babysitter-unified) `documented_install` is validated only for claude-code + codex; atlas-unified has no install-test gate.

[^win]: hermes is GREEN vanilla-NI on Ubuntu + macOS (gpt-5.5/mini); **Windows blocked by #856**, and sonnet blocked on credits (#485).
[^genty]: genty is GREEN vanilla-NI on all 3 OS but **only on gpt-5.5** (#936 fixed); weaker models FAIL at file-creation (#956); BI/BP modes unverified.
[^cur]: cursor-cli — SKIPPED/FAIL (#562).
[^cop]: copilot-cli — SKIPPED/FAIL (#560).
[^oc]: opencode — FAIL (Bun server lifecycle).
[^anti]: antigravity — SKIPPED (#945).

## Model axis sub-table (per-model)

Rows are the model-dependent components (axis type "model"). Cells reflect `modelsAxis` / live-stack model lanes. gpt-5.5 is the consistently-GREEN reference tier; weaker models hit the #956 file-creation ceiling (a model-adherence ceiling, not infra). genty is gpt-5.5-only.

| Component | gpt-5.5 | gpt-5.4-mini | sonnet-4-6 | gemini-3.5-flash | gemini-3.1-pro | DeepSeek-V4-Pro |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| genty-core | ✅ | ⛔ [^956] | ⛔ [^956] | ⛔ [^956] | ⛔ [^956] | ⛔ [^956] |
| adapters-codecs | ✅ | 🟡 [^956] | ✅ | ✅ | ✅ | 🟡 [^ds] |
| transport-adapter | ✅ | 🟡 [^956] | ✅ | ✅ | ✅ | 🟡 [^ds] |
| live-stack test surface | ✅ | 🟡 [^956] | ✅ | ✅ [^nong] | ✅ [^nong] | 🟡 [^ds] |

[^956]: #956 — weak-model adherence ceiling at file-creation. For genty this is a hard FAIL on every model below gpt-5.5. For non-genty agents (claude passes the identical path), it manifests as partial failures on gpt-5.4-mini, so model-axis adapters are graded green at the strong tier with the ceiling documented.
[^ds]: DeepSeek-V4-Pro is largely capped by #956 for genty; there is also one pi NI Ubuntu regression (#954).
[^nong]: gemini-3.5-flash and gemini-3.1-pro-preview are green for non-genty agents; genty FAILs (#956).

## How this was measured

Evidence sources:

- **Workflows** — `.github/workflows/ci.yml`, `publish.yml`, `live-stack.yml`, and `live-stack-published.yml` were read to determine which packages are merely built vs. which have their test scripts actually invoked and gated.
- **Per-package tests** — vitest / node:test configs and `*.test.ts(x)` / `*.test.js` / `*.test.mjs` counts per workspace, cross-referenced against the workflow step that does (or does not) run them.
- **Live matrix** — `packages/atlas/graph/wiki/QA-Evidence.md`, the live-stack agent × mode × model × OS results (last updated 2026-06-20..06-23), for the L4 cross-axis grades.

Honesty caveats:

- **Thin SDK smoke test** — `@a5c-ai/babysitter-sdk` = `packages/babysitter` ships only **1 bin smoke test**; the real process/effect logic lives in `library/` and is validated transitively by live-stack, not by a deep dedicated unit suite.
- **Real unit suites that are ungated → L1** — several non-trivial suites are NOT invoked by any workflow step and are graded L1 despite their counts: adapters-tools (6), genty-runtime (19), genty-cli (10), genty-ui (18), kradle-web (30).
- **#956 is model-adherence, not infra** — weak-model live-stack failures are an adherence ceiling at file-creation, not a harness/infra defect; gpt-5.5 is GREEN wherever dispatched, so model-axis components are graded L4 on the strong tier with the ceiling documented.
- **Build-only packages** — adapters-config, adapters-launch, kradle-sdk, kradle-cli (L2) and the genty platform shells (L0) are built but carry no automated tests.
- **`publish.yml` adapters package-tests enumeration** runs observability/core/codecs/harness-mock/gateway/cli/sdk/channels + triggers; other adapters are build-only there.
- **`test:adapters` is known pre-broken** on the atlas build-list entry; CI relies on `build:adapters` + the per-package test enumeration instead.
