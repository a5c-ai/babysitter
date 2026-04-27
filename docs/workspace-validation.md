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
| `packages/sdk` (`@a5c-ai/babysitter-sdk`) | Core SDK and CLI runtime | `.github/workflows/ci.yml` jobs `test` and `packages-sdk`, plus `release.yml` and `staging-publish.yml` |
| `packages/breakpoints-mux` | Published breakpoint runtime | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |
| `packages/agent-plugins-mux` | Published plugin compiler/runtime package | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |
| `packages/observer-dashboard` | Published observer dashboard package | `.github/workflows/ci.yml` job `observer-dashboard`, plus `release.yml` and `staging-publish.yml` |
| `packages/hooks-mux/*` | Published hooks-mux packages | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |
| `packages/agent-mux/*` | Published agent-mux packages | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |
| `packages/babysitter` and `plugins/babysitter-*` | Published metapackage and harness plugin packages | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |

## Public advanced/runtime packages

These packages are publicly installable, but their canonical docs live primarily in package READMEs and the package/plugin docs map rather than the end-user getting-started flow.

| Workspace | Role | Validation path |
| --- | --- | --- |
| `packages/babysitter-agent` | Public runtime CLI for headless/orchestrated/operator workflows; not the default first-stop end-user entrypoint | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` runtime build/test validation |

## Internal-only active workspaces

These workspaces are part of the active monorepo and ship code or operational behavior inside the repo, but they are not current public publish targets.

| Workspace | Role | Validation path |
| --- | --- | --- |
| `packages/agent-core` | Internal harness support package | `.github/workflows/ci.yml` job `test`, plus `release.yml` and `staging-publish.yml` |
| `packages/agent-catalog` | private, non-release workspace package for the metadata catalog consumed by SDK, agent-mux, hooks-mux, plugin compiler, and catalog UI; downstream compatibility is lockstep within this repo rather than external semver | `.github/workflows/ci.yml` job `workspace-coverage` (`npm run ci:test --workspace=@a5c-ai/agent-catalog`) |
| `packages/catalog` | internal-only Next.js catalog UI and API surface for browsing process-library and graph-backed discovery data inside the monorepo | `.github/workflows/ci.yml` job `workspace-coverage` (`npm run ci:test --workspace=process-library-catalog`) |
| `packages/babysitter-tui-plugins` | Internal TUI plugin package for babysitter observability | `.github/workflows/ci.yml` job `workspace-coverage` |
| `packages/transport-mux` | Internal transport/proxy runtime workspace with package-local QA commands | `.github/workflows/ci.yml` job `workspace-coverage` (`build` + `lint` + `typecheck` + `test` + `scorecard:migration`) |

## Explicit exclusions

There are currently no active npm workspaces that are intentionally excluded from validation. `packages/transport-mux` now participates in the workspace-coverage job through its package-local `lint`, `typecheck`, and `test` commands alongside `build` and `scorecard:migration`.
