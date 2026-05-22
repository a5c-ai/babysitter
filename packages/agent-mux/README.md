# Agent Mux Parent

This directory is the unified parent for all content migrated from the former
`agent-mux` standalone repository.

<!-- docs-status:start -->
> Status: Public package family.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> Use this README as the canonical family entrypoint for the agent-mux workspace tree.
<!-- docs-status:end -->

## Packages

- `core/`, `adapters/`, `cli/`, `sdk/`, `gateway/`, `harness-mock/`, `observability/`
- `ui/`, `webui/`, `tui/`
- platform app packages under `mobile-*`, `tv-*`, and `watch-*`
- `amux-proxy/` for the Python proxy package

## Migrated Repo Assets

- `docker/` for the old Docker assets and E2E compose setup
- `tests/` for the old repo-level E2E and browser tests
- `scripts/` for the old repo-level maintenance scripts
- `processes/` for imported `.a5c/processes` workflows and plans
- `skills/` for migrated skills
- `meta/` for repo-level docs, config, and GitHub metadata that no longer live at monorepo root

The standalone checkout at `/home/a5cdev/work/agent-mux` is now only a moved notice.
