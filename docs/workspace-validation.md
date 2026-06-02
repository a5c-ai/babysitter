---
title: Workspace Validation Map
description: Source-of-truth mapping for active workspaces, release-critical surfaces, and their validation workflows.
last_updated: 2026-04-26
---

# Workspace Validation Map

This document is the repo-level source of truth for which npm workspaces are active, which ones are release-critical, and which workflow path validates them.

<!-- docs-discovery-note:start -->
For canonical documentation homes and public/internal positioning, use [Package and Plugin Docs Map](./package-and-plugin-map.md).
This file remains the validation-contract ledger, not the primary package/plugin discovery index.
<!-- docs-discovery-note:end -->

If a workspace stays active, it must meet one of these conditions:

- it is validated in `.github/workflows/ci.yml`
- it is validated in the release/staging workflows because that is the only meaningful contract surface
- it is explicitly called out here as intentionally excluded

## Release-critical workspace families

These workspaces ship public packages or release-facing operational behavior. They are expected to stay aligned with both CI and release workflows.

| Workspace or family | Role | Validation path |
| --- | --- | --- |
| `packages/sdk` (`@a5c-ai/babysitter-sdk`) | Core SDK and CLI runtime | `.github/workflows/ci.yml` jobs `test` and `packages-sdk`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/tasks-mux` | Published breakpoint runtime | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/extension-mux` | Published plugin compiler/runtime package | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/observer-dashboard` | Published observer dashboard package | `.github/workflows/ci.yml` job `observer-dashboard`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/agent-mux/hooks/*` | Published hooks-mux packages | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/agent-mux/*` | Published agent-mux packages | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/transport-mux` | Published transport/proxy runtime package used by the agent-mux CLI/runtime chain | `.github/workflows/ci.yml` job `workspace-coverage` (`build` + `lint` + `typecheck` + `test` + `scorecard:migration`), plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/babysitter`, `plugins/babysitter-unified`, and generated/published harness plugin packages | Published metapackage, canonical plugin source, and harness plugin packages | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |

## Public advanced/runtime packages

These packages are publicly installable, but their canonical docs live primarily in package READMEs and the package/plugin docs map rather than the end-user getting-started flow.

| Workspace | Role | Validation path |
| --- | --- | --- |
| `packages/agent-platform` | Public runtime CLI for headless/orchestrated/operator workflows; not the default first-stop end-user entrypoint | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` runtime build/test validation |
| `packages/tula-core` | Public advanced/runtime dependency package consumed by `@a5c-ai/agent-platform` and runtime orchestration flows | `.github/workflows/ci.yml` job `test`, plus `publish.yml` and `publish-packages-from-tag.yml` |
| `packages/atlas` (`./catalog` export) | Public graph/evidence catalog surface consumed by SDK, agent-mux, hooks-mux, plugin compiler, and catalog-adjacent tooling | `.github/workflows/ci.yml` job `test` (`npm run build --workspace=@a5c-ai/atlas` and `npm run test:atlas-catalog-contracts`), plus `publish.yml` and `publish-packages-from-tag.yml` |

## Internal-only active workspaces

These workspaces are part of the active monorepo and ship code or operational behavior inside the repo, but they are not current public publish targets.

| Workspace | Role | Validation path |
| --- | --- | --- |
| `packages/babysitter-tui-plugins` | Internal TUI plugin package for babysitter observability | `.github/workflows/ci.yml` job `workspace-coverage` |

## Explicit exclusions

There are currently no active npm workspaces that are intentionally excluded from validation. `packages/transport-mux` now participates in the workspace-coverage job through its package-local `lint`, `typecheck`, and `test` commands alongside `build` and `scorecard:migration`.
