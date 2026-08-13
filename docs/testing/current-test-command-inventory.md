---
title: Current Test Command Inventory
description: Current package and workflow test command mapping for roadmap slice 0.
last_updated: 2026-08-13
---

# Current Test Command Inventory

Status: Current. This inventory implements roadmap slice 0, "Inventory and naming". It maps existing CI-relevant test-like package scripts to package or surface, lane, scope, owner, artifact name, and pipeline placement. Proposed future bundles remain in [Pipeline Integration](./pipeline-integration.md#proposed-command-bundles) and are not treated as current commands here.

**Pipeline placement is reconciled against actual workflow invocation data** (`.github/workflows/ci.yml` and `.github/workflows/publish.yml` read in full, plus the reusable workflows they call: `release-artifact-verifier.yml` and `live-stack-published.yml`). Where a script exists but no workflow invokes it, the placement column says so explicitly rather than naming an aspirational lane — an uninvoked gate is a gap, and the remediation program was caused by exactly that kind of paper coverage.

## Root release and package-integrity gates (added by the remediation program)

These root scripts are the guardrails FIX-011/FIX-012 added. Their placement is stated exactly as the workflows invoke them.

| Root script | Definition | Lane | Scope | Actual pipeline placement |
| --- | --- | --- | --- | --- |
| `test:release-tooling` | `node --test scripts/__tests__/*.test.mjs` | No-model | contract | `ci.yml` job `test`, step "Release tooling tests (inventory, dependency ownership, packed-artifact verifier)"; and `release-artifact-verifier.yml` step "Release tooling tests", which `publish.yml` reaches through its `verify_release_artifacts` job. Currently expands to 10 suites: `dependency-ownership`, `hooks-adapter-genty-packed`, `hooks-atlas-ownership`, `publish-package-from-tag`, `publishable-packages`, `release-matrix`, `release-promotion`, `release-version`, `verify-published-release`, `verify-release-artifacts`. |
| `test:babysitter-metapackage` | `npm test --workspace=@a5c-ai/babysitter` (→ `node --test bin/__tests__/*.test.js`) | No-model | contract | `ci.yml` job `test`, step "Metapackage shim tests (packed exit-code propagation)" (FIX-007). **Not invoked by `publish.yml`.** |
| `verify:metadata` | `node ./scripts/check-package-metadata.cjs` | No-model | static-check | `ci.yml` job `test`, step "Verify metadata"; `publish.yml` job `lint`, step "Verify metadata". Since FIX-011 this also validates the publishable-package inventory, docs coverage, release-matrix coverage of both publication workflows, and **direct runtime dependency ownership** (FIX-002/FIX-006). |
| `verify:release-artifacts` | `node ./scripts/verify-release-artifacts.mjs` | No-model release gate | release-gate | Not invoked by name. `publish.yml` reaches the script through `verify_release_artifacts` → `release-artifact-verifier.yml`, which runs `node scripts/verify-release-artifacts.mjs --report-dir artifacts/release-verifier --allow-known-failures` over the full inventory and uploads `release-verifier-reports`. **No publish gate depends on that job today** — it is observability, not a block. |
| `guard:packages` | `node ./scripts/guard-package-integrity.cjs` | No-model | static-check | **Not invoked by `ci.yml` or `publish.yml`.** It is the local/fast entry point (`release-artifact-verifier.yml` names it only in a comment). Run it locally before pushing release-affecting changes. |
| `test:binary-renames` | `node ./scripts/check-binary-renames.cjs` | No-model | contract | **Not invoked by `ci.yml` or `publish.yml`**, despite being the gate that proves the FIX-004 compatibility bin points at an emitted path. Local/manual only. |
| `test:package-renames` | `node ./scripts/check-package-renames.cjs` | No-model | contract | **Not invoked by `ci.yml` or `publish.yml`.** Local/manual only. |
| — (`scripts/verify-published-release.mjs`) | `node scripts/verify-published-release.mjs --version <v>` | No-model release gate | release-gate | `publish.yml` job `published_consumer_validation` → `live-stack-published.yml` job `published_consumer`, step "Install, import and bin-smoke every public package at the exact version". Artifact `published-consumer-checks`. This is the FIX-010 gate that `promote_release_channel` requires (`if: needs.published_consumer_validation.result == 'success'`). |
| — (`scripts/release-version.cjs`) | `resolve` / `verify-manifests` / `assert-channel-tags` | No-model release gate | release-gate | `publish.yml` job `prepare_staging_publish` (resolve, verify-manifests, `assert-channel-tags --mode preflight`) and job `assert_release_channel_tags` (final assertion over every public package). Regression-tested by `test:release-tooling`. |
| — (`scripts/release-promotion.cjs`) | `candidate-tag` / `promote` | No-model release gate | release-gate | `publish.yml` jobs `prepare_staging_publish` and `promote_release_channel`. The only channel dist-tag mutation in the pipeline; it requires `--evidence artifacts/published-consumer/validation.json`. Regression-tested by `test:release-tooling`. |
| — (`scripts/release-matrix.cjs`) | `--group hooks-leaves [--format workspaces]` | No-model | contract | `publish.yml` job `build_all` (build fan-out) and job `prepare_staging_publish` step "Resolve derived publication matrices", whose output becomes the **dynamic** `publish_staging_hooks_adapters` matrix (12 leaves today, including `@a5c-ai/hooks-adapter-genty` — FIX-005). Regression-tested by `test:release-tooling`. |

## Naming Rules

- **Check labels** use `testing / <lane> <scope>` for future reusable jobs and keep existing workflow job names until behavior changes.
- **Artifacts** use stable, lowercase paths: `test-logs/<package>-<script>.log`, `coverage/<package>-<script>`, `e2e/<package>-<script>`, `docs-qa/<package>-<script>.log`, or `release-logs/<package>-<script>.log`.
- **Current commands** are package scripts that already exist in `package.json` files under the repo root or `packages/**`; dev-only `*:watch` commands are intentionally excluded from CI artifact naming.
- **No-model** means the command must not require provider credentials. Release-gate commands can still be no-model when they verify packaging, metadata, or static release contracts.
- **Model-backed** is reserved for commands that require real provider credentials or installed live harnesses; no current package script in this inventory is promoted as model-backed.

## Inventory Summary

| Metric | Count |
| --- | ---: |
| Package manifests scanned | 46 |
| Current CI-relevant test-like scripts mapped | 123 |
| Packages or surfaces with mapped commands | 36 |
| Root release/package-integrity gates mapped separately | 10 |
| Public packages in the authoritative inventory (`scripts/lib/publishable-packages.cjs`) | 43 |

## Current Command Map

| Package or surface | Script | Lane | Scope | Owner | Artifact name | Pipeline placement |
| --- | --- | --- | --- | --- | --- | --- |
| `@a5c-ai/atlas/catalog` | `test:atlas-catalog-contracts` | No-model | contract | Catalog/Atlas maintainers | `test-logs/atlas-catalog-contracts.log` | ci.yml test or package-local validation when catalog surface is touched |
| `@a5c-ai/genty-core` | `test` | No-model | unit-or-integration | Runtime maintainers | `test-lo../core-test.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/adapters` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/adapters-codecs` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-adapters-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/adapters-cli` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-cli-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/comm-adapter` | `prepublishOnly` | No-model release gate | release-gate | Adapter maintainers | `release-logs/agent-comm-adapter-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/comm-adapter` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/agent-comm-adapter-test.log` | publish.yml validate_mux, via `node scripts/adapters-build.cjs test packages/adapters/core`. **ci.yml builds adapters but never runs this suite.** The `test` script is `vitest run src tests`, so it is also the only lane that executes the FIX-009 PTY suites (`tests/pty.test.ts`, `tests/pty-consumer.packaged.test.ts`); no workflow step is named for PTY. |
| `@a5c-ai/comm-adapter` | `verify:release` | No-model release gate | release-gate | Adapter maintainers | `release-logs/agent-comm-adapter-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/adapters-gateway` | `test` | No-model | e2e | Adapter maintainers | `e2e/adapters-gateway-test` | ci.yml `gateway-node-engine` job, matrix `node-version: ['22.13.0', '22']` (the first entry must equal `engines.node` of `packages/adapters/gateway/package.json` — Node >= 22.13.0, FIX-008); publish.yml validate_mux via `node scripts/adapters-build.cjs test packages/adapters/gateway` (Node 22 only, no engine-floor matrix) |
| `@a5c-ai/adapters-gateway` | `test:node-engine-floor` | No-model | contract | Adapter maintainers | `e2e/adapters-gateway-node-engine-floor` | Not invoked by name. `tests/node-engine-floor.test.ts` is listed explicitly in the package `test` script, so the ci.yml `gateway-node-engine` matrix runs it on both Node versions. The suite asserts one exact floor across four surfaces — `engines.node`, the runtime constant, the package README, and the ci.yml matrix — and proves the floor is at or above every built-in reachable from the package root. Changing the floor in only one of those places fails it. |
| `@a5c-ai/adapters-harness-mock` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-harness-mock-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/adapters-observability` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-observability-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-tui` | `prepublishOnly` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-tui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/genty-tui` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-tui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-tui` | `verify:release` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-tui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/genty-ui` | `prepublishOnly` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-ui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/genty-ui` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-ui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-ui` | `test:realtime` | No-model | release-gate | Adapter maintainers | `release-logs/adapters-ui-test-realtime.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-ui` | `verify:release` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-ui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/genty-web-app` | `prepublishOnly` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-webui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/genty-web-app` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-webui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-web-app` | `test:e2e` | No-model | e2e | Adapter maintainers | `e2e/adapters-webui-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-web-app` | `test:e2e:headed` | No-model | e2e | Adapter maintainers | `e2e/adapters-webui-test-e2e-headed` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-web-app` | `test:e2e:install` | No-model | e2e | Adapter maintainers | `e2e/adapters-webui-test-e2e-install` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-web-app` | `test:realtime` | No-model | release-gate | Adapter maintainers | `release-logs/adapters-webui-test-realtime.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/genty-web-app` | `verify:release` | No-model release gate | release-gate | Adapter maintainers | `release-logs/adapters-webui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/extensions-adapter` | `lint` | No-model | static-check | Adapter maintainers | `test-logs/extensions-adapter-lint.log` | Not invoked by ci.yml or publish.yml; package-local validation when package is touched |
| `@a5c-ai/extensions-adapter` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/extensions-adapter-test.log` | ci.yml test ("adapters-extensions tests"); publish.yml validate_observer_and_compiler ("Test adapters-extensions") |
| `@a5c-ai/extensions-adapter` | `test:packaged-surface-parity` | No-model release gate | release-gate | Adapter maintainers | `test-logs/extensions-adapter-test-packaged-surface-parity.log` | **Not invoked by ci.yml or publish.yml.** The FIX-004 tarball/compatibility-bin properties are covered in the publication path by the package's own `verify:release`, which `scripts/publish-package-from-tag.mjs` runs immediately before `npm publish`, and by the full-inventory `verify-release-artifacts.mjs` sweep in `release-artifact-verifier.yml`. |
| `@a5c-ai/extensions-adapter` | `verify:release` | No-model release gate | release-gate | Adapter maintainers | `release-logs/extensions-adapter-verify-release.log` | `scripts/publish-package-from-tag.mjs` runs it per-package immediately before `npm publish` |
| `@a5c-ai/atlas` | `verify:library-metadata` | No-model | contract | Catalog/Atlas maintainers | `test-logs/atlas-verify-library-metadata.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter` | `lint` | No-model | static-check | Owning package maintainer | `test-logs/babysitter-lint.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/genty-platform` | `lint` | No-model | static-check | Runtime maintainers | `test-lo../platform-lint.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/genty-platform` | `test` | No-model | unit-or-integration | Runtime maintainers | `test-lo../platform-test.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/genty-platform` | `test:seams` | No-model | contract | Runtime maintainers | `test-lo../platform-test-seams.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter-observer-dashboard` | `lint` | No-model | static-check | Observer maintainers | `test-logs/babysitter-observer-dashboard-lint.log` | ci.yml observer-dashboard; publish.yml validate_observer_and_compiler |
| `@a5c-ai/babysitter-observer-dashboard` | `test` | No-model | unit-or-integration | Observer maintainers | `test-logs/babysitter-observer-dashboard-test.log` | ci.yml observer-dashboard; publish.yml validate_observer_and_compiler |
| `@a5c-ai/babysitter-observer-dashboard` | `test:coverage` | No-model | coverage | Observer maintainers | `coverage/babysitter-observer-dashboard-test-coverage` | ci.yml observer-dashboard; publish.yml validate_observer_and_compiler |
| `@a5c-ai/babysitter-observer-dashboard` | `test:e2e` | No-model | e2e | Observer maintainers | `e2e/babysitter-observer-dashboard-test-e2e` | ci.yml observer-dashboard; publish.yml validate_observer_and_compiler |
| `@a5c-ai/babysitter-observer-dashboard` | `test:perf` | No-model | e2e | Observer maintainers | `e2e/babysitter-observer-dashboard-test-perf` | ci.yml observer-dashboard; publish.yml validate_observer_and_compiler |
| `@a5c-ai/babysitter-observer-dashboard` | `verify:release` | No-model release gate | release-gate | Observer maintainers | `test-logs/babysitter-observer-dashboard-release-artifact.log` | package prepublishOnly; scripts/publish-package-from-tag.mjs |
| `@a5c-ai/babysitter-sdk` | `check:command-templates` | No-model | static-check | SDK maintainers | `test-logs/babysitter-sdk-check-command-templates.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter-sdk` | `lint` | No-model | static-check | SDK maintainers | `test-logs/babysitter-sdk-lint.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter-sdk` | `smoke:cli` | No-model | smoke | SDK maintainers | `test-logs/babysitter-sdk-smoke-cli.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter-sdk` | `test` | No-model | unit-or-integration | SDK maintainers | `test-logs/babysitter-sdk-test.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/genty-tui-plugins` | `lint` | No-model | static-check | Owning package maintainer | `test-logs/babysitter-tui-plugins-lint.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/genty-tui-plugins` | `test` | No-model | unit-or-integration | Owning package maintainer | `test-logs/babysitter-tui-plugins-test.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/tasks-adapter` | `lint` | No-model | static-check | Adapter maintainers | `test-logs/tasks-adapter-lint.log` | Not invoked by any workflow — the only per-workspace `lint` runs are `@a5c-ai/babysitter-sdk` (ci.yml "Lint", publish.yml validate_core) and `@a5c-ai/transport-adapter` (ci.yml workspace-coverage); run locally |
| `@a5c-ai/tasks-adapter` | `test` | No-model | unit-or-integration | Adapter maintainers | `test-logs/adapters-tasks-tests.log` | ci.yml test ("adapters-tasks tests" step) only; publish.yml validate_mux does NOT run it |
| `@a5c-ai/tasks-adapter` | `test:packaged-surface-parity` | No-model | release-gate | Adapter maintainers | `test-logs/tasks-adapter-test-packaged-surface-parity.log` | ci.yml test ("adapters-tasks packaged-surface parity" step); publish.yml validate_mux ("tasks-adapter packaged-surface parity" step); both run strictly (no `--allow-known-failures`) since FIX-002 landed |
| `@a5c-ai/kradle-installer` | `prepublishOnly` | No-model release gate | release-gate | Cloud maintainers | `release-logs/cloud-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/kradle-installer` | `test` | No-model | unit-or-integration | Cloud maintainers | `test-logs/cloud-test.log` | ci.yml test; publish.yml validate_cloud; publish.yml validate/deploy |
| `@a5c-ai/kradle-installer` | `test:coverage` | No-model | coverage | Cloud maintainers | `coverage/cloud-test-coverage` | ci.yml test; publish.yml validate_cloud; publish.yml validate/deploy |
| `@a5c-ai/kradle-installer` | `verify:release` | No-model release gate | release-gate | Cloud maintainers | `release-logs/cloud-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/hooks-adapter-claude` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-claude-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-claude` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-claude-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-codex` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-codex-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-codex` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-codex-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-copilot` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-copilot-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-copilot` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-copilot-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-cursor` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-cursor-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-cursor` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-cursor-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-gemini` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-gemini-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-gemini` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-gemini-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-oh-my-pi` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-oh-my-pi-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-oh-my-pi` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-oh-my-pi-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-openclaw` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-openclaw-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-openclaw` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-openclaw-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-opencode` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-opencode-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-opencode` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-opencode-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-pi` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-pi-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-pi` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-adapter-pi-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-cli` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-cli-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-cli` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-cli-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-core` | `lint` | No-model | static-check | Hooks-adapter maintainers | `test-logs/hooks-adapter-core-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-adapter-core` | `test` | No-model | unit-or-integration | Hooks-adapter maintainers | `test-logs/hooks-adapter-core-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-adapter` | `lint` | No-model | static-check | Adapter maintainers | `test-logs/transport-adapter-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-adapter` | `scorecard:migration` | No-model | contract | Adapter maintainers | `test-logs/transport-adapter-scorecard-migration.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-adapter` | `test` | No-model | e2e | Adapter maintainers | `e2e/transport-adapter-test` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-adapter` | `test:e2e` | No-model | e2e | Adapter maintainers | `e2e/transport-adapter-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-adapter` | `test:unit` | No-model | unit-or-integration | Adapter maintainers | `test-logs/transport-adapter-test-unit.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-adapter` | `prepublishOnly` | No-model release gate | release-gate | Triggers maintainers | `release-logs/triggers-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/triggers-adapter` | `test` | No-model | e2e | Triggers maintainers | `e2e/triggers-test` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-adapter` | `test:coverage` | No-model | coverage | Triggers maintainers | `coverage/triggers-test-coverage` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-adapter` | `test:e2e` | No-model | e2e | Triggers maintainers | `e2e/triggers-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-adapter` | `test:unit` | No-model | contract | Triggers maintainers | `test-logs/triggers-test-unit.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@v6/graph-tools` | `smoke` | No-model | smoke | Catalog/Atlas maintainers | `test-logs/v6-graph-tools-smoke.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `check:library-syntax` | No-model | static-check | CI maintainers | `test-logs/babysitter-check-library-syntax.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `check:plugin-commands` | No-model | static-check | CI maintainers | `test-logs/babysitter-check-plugin-commands.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `check:sdk-command-templates` | No-model | static-check | CI maintainers | `test-logs/babysitter-check-sdk-command-templates.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `coverage:cloud` | No-model | coverage | CI maintainers | `coverage/babysitter-coverage-cloud` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `docs:build` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-build.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:clear` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-clear.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:dev` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-dev.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:examples:smoke` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-examples-smoke.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:examples:verify` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-examples-verify.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:freshness` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-freshness.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:links` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-links.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:lint` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-lint.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:lint:markdown` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-lint-markdown.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:lint:style` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-lint-style.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:qa` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-qa.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:serve` | No-model | docs-qa | CI maintainers | `docs-qa/babysitter-docs-serve.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `docs:snippets` | No-model | static-check | CI maintainers | `test-logs/babysitter-docs-snippets.log` | ci.yml docs-quality; publish.yml deploy_docs_site; docs-only PRs |
| `babysitter` | `lint:hooks-adapter` | No-model | static-check | CI maintainers | `test-logs/babysitter-lint-hooks-adapter.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:atlas-catalog-contracts` | No-model | contract | CI maintainers | `test-logs/babysitter-test-atlas-catalog-contracts.log` | ci.yml test or package-local validation when catalog surface is touched |
| `babysitter` | `test:adapters` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-adapters.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:e2e:adapters-hooks-adapter` | No-model | integration | CI maintainers | `e2e/adapters-hooks-adapter/*.jsonl` | publish.yml agent_mux_hooks_mux_e2e matrix for claude-code, codex, pi |
| `babysitter` | `test:e2e:adapters-no-model-stack` | No-model | e2e | CI maintainers | `e2e/no-model-stack/*.jsonl`, `summary.json` | publish.yml no_model_mock_matrix across runtime, agent, and hook-mode dimensions |
| `babysitter` | `test:extensions-adapter` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-extensions-adapter.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:architecture` | No-model | static-check | CI maintainers | `test-logs/babysitter-test-architecture.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `test:cloud` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-cloud.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:hooks-adapter` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-hooks-adapter.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:library` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-library.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:observer` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-observer.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `verify:observer-release` | No-model release gate | release-gate | CI maintainers | `release-logs/babysitter-verify-observer-release.log` | package-local validation and manual release checks |
| `babysitter` | `test:realtime-flow` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-realtime-flow.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:sdk` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-sdk.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `verify:cloud-release` | No-model release gate | release-gate | CI maintainers | `release-logs/babysitter-verify-cloud-release.log` | publish.yml validate and publish gates |
| `babysitter` | `verify:library-metadata` | No-model | contract | CI maintainers | `test-logs/babysitter-verify-library-metadata.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `verify:metadata` | No-model | static-check | CI maintainers | `test-logs/babysitter-verify-metadata.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `verify:realtime-flow-release` | No-model release gate | release-gate | CI maintainers | `release-logs/babysitter-verify-realtime-flow-release.log` | publish.yml validate and publish gates |
| `babysitter` | `verify:v6:seams` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-verify-v6-seams.log` | ci.yml test or package-local validation when package is touched |

## Workflow Touchpoints

Current workflows already call many of these commands. Slice 0 does not change workflow behavior; it gives follow-up slices a stable naming target for comments, reusable workflows, and uploaded artifacts.

| Workflow | Current role | Inventory naming target |
| --- | --- | --- |
| `.github/workflows/ci.yml` | PR/push docs, package, adapter, coverage, SDK, and observer validation. Jobs: `docs-quality`, `test`, `gateway-node-engine` (the only matrix job: `node-version: ['22.13.0', '22']`), `workspace-coverage`, `observer-dashboard`. It is the **only** workflow that runs `test:release-tooling` under its own name and the **only** one that runs `test:babysitter-metapackage`. | Keep current jobs, then align uploaded logs with `test-logs/`, `coverage/`, `e2e/`, and `docs-qa/` names |
| `.github/workflows/publish.yml` | Unified branch-aware validation, live-stack preflight, publish, deploy, release-tag, and external-plugin sync ordering. Validation jobs: `lint`, `build_all`, `validate_core`, `validate_mux`, `validate_cloud`, `validate_kradle`, `validate_observer_and_compiler`, `e2e_integration`. `prepare_staging_publish` runs only when all of those report `success`. | Owns current no-model validation jobs plus the model-backed live-stack scenario/OS matrix before publish jobs |
| `.github/workflows/publish.yml` publication and promotion chain | `prepare_staging_publish` (resolve version, sync + verify manifests, preflight channel assertion, derive the `hooks-leaves` matrix) → dependency-ordered publish jobs → `published_consumer_validation` → `promote_release_channel` (gated on that job succeeding) → `assert_release_channel_tags` → `create_release_tag` | Release-gate lane; evidence artifacts `published-consumer-checks`, `release-promotion-evidence` |
| `.github/workflows/release-artifact-verifier.yml` (reusable) | Called by `publish.yml` job `verify_release_artifacts`. Runs `test:release-tooling` and the full-inventory `verify-release-artifacts.mjs` sweep with `--allow-known-failures`. **No publish job depends on it**, so it currently reports rather than gates. | Release-gate lane; artifact `release-verifier-reports` |
| `.github/workflows/live-stack-published.yml` (reusable) | Called by `publish.yml` job `published_consumer_validation` with the exact release version. Runs `verify-published-release.mjs` against npm. Its `documented_install` job is gated on a `channel` input that `publish.yml` does not pass, so the documented-install lanes are skipped pre-promotion. | Release-gate lane; artifact `published-consumer-checks` |
| `.github/workflows/publish.yml` docs deploy job | Docs QA and build/deploy (`deploy_docs_site`, skipped on `develop`) | Use `docs-qa/` artifacts and docs check labels inside the unified publish workflow |
| `.github/workflows/generate-plugins.yml` and `.github/workflows/sync-external-plugins.yml` | Generated plugin validation and sync | Keep generated plugin artifacts separate from runtime/model-backed test artifacts |

## Gaps For Follow-Up Slices

### Scripts that exist but no workflow invokes

Reconciling this inventory against actual workflow invocation data surfaced gates that exist as package scripts but are not wired into `ci.yml` or `publish.yml`. Each is a real coverage gap, not a naming gap:

- `guard:packages` — the composed fast package-integrity gate. Local/manual only.
- `test:binary-renames` — the check that proves a compatibility bin points at an emitted path (the FIX-004 failure mode). Local/manual only.
- `test:package-renames` — same class, local/manual only.
- `test:packaged-surface-parity --workspace=@a5c-ai/extensions-adapter` — the tasks-adapter equivalent is wired into both workflows; the extensions-adapter one is not.
- `test:babysitter-metapackage` — runs in `ci.yml` only; the publication path does not re-check FIX-007 exit-code propagation against the packed metapackage.
- `verify_release_artifacts` runs in `publish.yml` but is in no publish job's `needs`, so a packed-artifact regression it detects does not block publication today.
- The FIX-009 PTY suites run only as part of `@a5c-ai/comm-adapter`'s `test` script inside `publish.yml`'s `validate_mux`. No PR-time lane executes them, and no step is named for PTY, so a PTY regression is invisible until the publish workflow runs.

Wiring these is follow-up work; this document records the current true state rather than the intended one.

### Other gaps

- Current package scripts are mostly no-model package checks; the implemented model-backed live-stack lane is selected by `.github/workflows/publish.yml` and exercised through `test:e2e:live-stack:pipeline`.
- Artifact naming is partially enforced in `publish.yml` for validation logs and live-stack artifacts; remaining package-local logs should converge on the inventory names when touched.
- Some root scripts aggregate package-local scripts. Follow-up workflow comments should name both the aggregate and package-local owner when they upload one shared log.
- The no-model stack matrix now covers transport-adapter-backed agent launches; the next missing slice is broadening runtime-hook assertions from hook bridge evidence into native agent lifecycle hook emission where each harness supports it.
