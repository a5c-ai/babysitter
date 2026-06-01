---
title: Current Test Command Inventory
description: Current package and workflow test command mapping for roadmap slice 0.
last_updated: 2026-05-07
---

# Current Test Command Inventory

Status: Current. This inventory implements roadmap slice 0, "Inventory and naming". It maps existing CI-relevant test-like package scripts to package or surface, lane, scope, owner, artifact name, and pipeline placement. Proposed future bundles remain in [Pipeline Integration](./pipeline-integration.md#proposed-command-bundles) and are not treated as current commands here.

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
| Current CI-relevant test-like scripts mapped | 121 |
| Packages or surfaces with mapped commands | 36 |

## Current Command Map

| Package or surface | Script | Lane | Scope | Owner | Artifact name | Pipeline placement |
| --- | --- | --- | --- | --- | --- | --- |
| `@a5c-ai/agent-catalog` | `build` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-build.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-catalog` | `check:src-artifacts` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-check-src-artifacts.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-catalog` | `ci:test` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-ci-test.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-catalog` | `policy:check` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-policy-check.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-catalog` | `test` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-test.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-catalog` | `version:check` | No-model | static-check | Catalog/Atlas maintainers | `test-logs/agent-catalog-version-check.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/tula-core` | `test` | No-model | unit-or-integration | Runtime maintainers | `test-logs/tula-core-test.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/agent-mux` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-adapters` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-adapters-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-cli` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-cli-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-comm-mux` | `prepublishOnly` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-comm-mux-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-comm-mux` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-comm-mux-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-comm-mux` | `verify:release` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-comm-mux-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-gateway` | `test` | No-model | e2e | Mux maintainers | `e2e/agent-mux-gateway-test` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-harness-mock` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-harness-mock-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-observability` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-observability-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-tui` | `prepublishOnly` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-tui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-tui` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-tui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-tui` | `verify:release` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-tui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-ui` | `prepublishOnly` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-ui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-ui` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-ui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-ui` | `test:realtime` | No-model | release-gate | Mux maintainers | `release-logs/agent-mux-ui-test-realtime.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-ui` | `verify:release` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-ui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-webui` | `prepublishOnly` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-webui-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/agent-mux-webui` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/agent-mux-webui-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-webui` | `test:e2e` | No-model | e2e | Mux maintainers | `e2e/agent-mux-webui-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-webui` | `test:e2e:headed` | No-model | e2e | Mux maintainers | `e2e/agent-mux-webui-test-e2e-headed` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-webui` | `test:e2e:install` | No-model | e2e | Mux maintainers | `e2e/agent-mux-webui-test-e2e-install` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-webui` | `test:realtime` | No-model | release-gate | Mux maintainers | `release-logs/agent-mux-webui-test-realtime.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/agent-mux-webui` | `verify:release` | No-model release gate | release-gate | Mux maintainers | `release-logs/agent-mux-webui-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/extension-mux` | `lint` | No-model | static-check | Mux maintainers | `test-logs/extension-mux-lint.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/extension-mux` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/extension-mux-test.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/atlas` | `verify:library-metadata` | No-model | contract | Catalog/Atlas maintainers | `test-logs/atlas-verify-library-metadata.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/babysitter` | `lint` | No-model | static-check | Owning package maintainer | `test-logs/babysitter-lint.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/agent-platform` | `lint` | No-model | static-check | Runtime maintainers | `test-logs/agent-platform-lint.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/agent-platform` | `test` | No-model | unit-or-integration | Runtime maintainers | `test-logs/agent-platform-test.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `@a5c-ai/agent-platform` | `test:seams` | No-model | contract | Runtime maintainers | `test-logs/agent-platform-test-seams.log` | ci.yml packages-sdk/test; publish.yml validate_core |
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
| `@a5c-ai/babysitter-tui-plugins` | `lint` | No-model | static-check | Owning package maintainer | `test-logs/babysitter-tui-plugins-lint.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/babysitter-tui-plugins` | `test` | No-model | unit-or-integration | Owning package maintainer | `test-logs/babysitter-tui-plugins-test.log` | ci.yml test or package-local validation when package is touched |
| `@a5c-ai/tasks-mux` | `lint` | No-model | static-check | Mux maintainers | `test-logs/tasks-mux-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/tasks-mux` | `test` | No-model | unit-or-integration | Mux maintainers | `test-logs/tasks-mux-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/tasks-mux` | `test:packaged-surface-parity` | No-model | unit-or-integration | Mux maintainers | `test-logs/tasks-mux-test-packaged-surface-parity.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/cloud` | `prepublishOnly` | No-model release gate | release-gate | Cloud maintainers | `release-logs/cloud-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/cloud` | `test` | No-model | unit-or-integration | Cloud maintainers | `test-logs/cloud-test.log` | ci.yml test; publish.yml validate_cloud; publish.yml validate/deploy |
| `@a5c-ai/cloud` | `test:coverage` | No-model | coverage | Cloud maintainers | `coverage/cloud-test-coverage` | ci.yml test; publish.yml validate_cloud; publish.yml validate/deploy |
| `@a5c-ai/cloud` | `verify:release` | No-model release gate | release-gate | Cloud maintainers | `release-logs/cloud-verify-release.log` | publish.yml validate and publish gates |
| `@a5c-ai/hooks-mux-adapter-claude` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-claude-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-claude` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-claude-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-codex` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-codex-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-codex` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-codex-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-copilot` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-copilot-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-copilot` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-copilot-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-cursor` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-cursor-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-cursor` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-cursor-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-gemini` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-gemini-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-gemini` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-gemini-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-oh-my-pi` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-oh-my-pi-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-oh-my-pi` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-oh-my-pi-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-openclaw` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-openclaw-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-openclaw` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-openclaw-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-opencode` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-opencode-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-opencode` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-opencode-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-pi` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-pi-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-adapter-pi` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-adapter-pi-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-cli` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-cli-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-cli` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-cli-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-core` | `lint` | No-model | static-check | Hooks-mux maintainers | `test-logs/hooks-mux-core-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/hooks-mux-core` | `test` | No-model | unit-or-integration | Hooks-mux maintainers | `test-logs/hooks-mux-core-test.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-mux` | `lint` | No-model | static-check | Mux maintainers | `test-logs/transport-mux-lint.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-mux` | `scorecard:migration` | No-model | contract | Mux maintainers | `test-logs/transport-mux-scorecard-migration.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-mux` | `test` | No-model | e2e | Mux maintainers | `e2e/transport-mux-test` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-mux` | `test:e2e` | No-model | e2e | Mux maintainers | `e2e/transport-mux-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/transport-mux` | `test:unit` | No-model | unit-or-integration | Mux maintainers | `test-logs/transport-mux-test-unit.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-mux` | `prepublishOnly` | No-model release gate | release-gate | Triggers maintainers | `release-logs/triggers-prepublishonly.log` | publish.yml validate and publish gates |
| `@a5c-ai/triggers-mux` | `test` | No-model | e2e | Triggers maintainers | `e2e/triggers-test` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-mux` | `test:coverage` | No-model | coverage | Triggers maintainers | `coverage/triggers-test-coverage` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-mux` | `test:e2e` | No-model | e2e | Triggers maintainers | `e2e/triggers-test-e2e` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `@a5c-ai/triggers-mux` | `test:unit` | No-model | contract | Triggers maintainers | `test-logs/triggers-test-unit.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
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
| `babysitter` | `lint:hooks-mux` | No-model | static-check | CI maintainers | `test-logs/babysitter-lint-hooks-mux.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:agent-catalog-contracts` | No-model | contract | CI maintainers | `test-logs/babysitter-test-agent-catalog-contracts.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:agent-mux` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-agent-mux.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
| `babysitter` | `test:e2e:agent-mux-hooks-mux` | No-model | integration | CI maintainers | `e2e/agent-mux-hooks-mux/*.jsonl` | publish.yml agent_mux_hooks_mux_e2e matrix for claude-code, codex, pi |
| `babysitter` | `test:e2e:agent-mux-no-model-stack` | No-model | e2e | CI maintainers | `e2e/no-model-stack/*.jsonl`, `summary.json` | publish.yml no_model_mock_matrix across runtime, agent, and hook-mode dimensions |
| `babysitter` | `test:extension-mux` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-extension-mux.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:architecture` | No-model | static-check | CI maintainers | `test-logs/babysitter-test-architecture.log` | ci.yml packages-sdk/test; publish.yml validate_core |
| `babysitter` | `test:cloud` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-cloud.log` | ci.yml test or package-local validation when package is touched |
| `babysitter` | `test:hooks-mux` | No-model | unit-or-integration | CI maintainers | `test-logs/babysitter-test-hooks-mux.log` | ci.yml test/workspace-coverage; publish.yml validate_mux |
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
| `.github/workflows/ci.yml` | PR/push docs, package, mux, coverage, SDK, and observer validation | Keep current jobs, then align uploaded logs with `test-logs/`, `coverage/`, `e2e/`, and `docs-qa/` names |
| `.github/workflows/publish.yml` | Unified branch-aware validation, live-stack preflight, publish, deploy, release-tag, and external-plugin sync ordering | Owns current no-model validation jobs plus the model-backed live-stack scenario/OS matrix before publish jobs |
| `.github/workflows/publish.yml` docs deploy job | Docs QA and build/deploy | Use `docs-qa/` artifacts and docs check labels inside the unified publish workflow |
| `.github/workflows/generate-plugins.yml` and `.github/workflows/sync-external-plugins.yml` | Generated plugin validation and sync | Keep generated plugin artifacts separate from runtime/model-backed test artifacts |

## Gaps For Follow-Up Slices

- Current package scripts are mostly no-model package checks; the implemented model-backed live-stack lane is selected by `.github/workflows/publish.yml` and exercised through `test:e2e:live-stack:pipeline`.
- Artifact naming is partially enforced in `publish.yml` for validation logs and live-stack artifacts; remaining package-local logs should converge on the inventory names when touched.
- Some root scripts aggregate package-local scripts. Follow-up workflow comments should name both the aggregate and package-local owner when they upload one shared log.
- The no-model stack matrix now covers transport-mux-backed agent launches; the next missing slice is broadening runtime-hook assertions from hook bridge evidence into native agent lifecycle hook emission where each harness supports it.
