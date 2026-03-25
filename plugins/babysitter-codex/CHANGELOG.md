# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Fixed
- Dropped the bundled `upstream/babysitter` snapshot from the plugin payload.
- `team-install` and postinstall onboarding now rely on the SDK CLI to
  clone/update/use the original process library for the active workspace.
- Packaged docs and tests no longer claim deleted runtime artifacts such as the
  old process-mining helper or maintainer runbook.

### Changed
- Added manifest scripts and `prepack` regeneration so packaged integrity data
  matches the actual shipped payload.
- Updated packaged metadata to point at the `a5c-ai/babysitter` repository.

## [0.1.5] - 2026-03-11

### Added
- Team setup/install flow and lock architecture:
  - `babysitter.lock.json`
  - `babysitter:team-install`
  - `scripts/team-install.js`
- Runtime/content package split scaffolding (`packages/runtime`, `packages/content`).
- Layered rules resolution and defaults (`.codex/rules-resolver.js`, `config/rules/*`).
- Lazy process index cache (`.codex/process-index.js`) integrated into discovery.
- Content integrity pipeline:
  - `scripts/generate-content-manifest.js`
  - `scripts/verify-content-manifest.js`
  - `config/content-manifest.json`
- Mapping contract checks and CI gates (`scripts/check-mapping-contract.js`, workflow updates).
- Architecture docs:
  - `docs/ARCHITECTURE_UPGRADES_1_8.md`
  - `docs/CODEX_MAPPING.md` updates

### Changed
- Plugin manifest version bumped to `4.0.149`.
- npm package version bumped to `0.1.5`.
- README updated for version/mode changes and refreshed Blame Beni section.
- Fixed command metadata regression in `.codex/plugin.json` (restored per-command descriptions).

### Added
- Runtime/content package split scaffolding:
  - `packages/runtime`
  - `packages/content`
- Lock and install architecture:
  - `babysitter.lock.json`
  - `scripts/team-install.js`
  - new command: `babysitter:team-install`
- Layered rules architecture:
  - `.codex/rules-resolver.js`
  - `config/rules/upstream-base.json`
  - `config/rules/team/default.json`
- Lazy process library indexing:
  - `.codex/process-index.js`
  - discovery integration for indexed lookup metadata
- Secure content channel primitives:
  - `scripts/generate-content-manifest.js`
  - `scripts/verify-content-manifest.js`
  - optional HMAC signature validation
- Mapping contract gate:
  - `scripts/check-mapping-contract.js`
  - CI enforcement (`check:mapping`, `manifest:verify`, `team:install` smoke)
- Bundled full upstream Babysitter skill/process/reference library snapshot under `upstream/babysitter/`.
- Added Codex command mapping manifest: `config/codex-command-map.json`.
- Added new Codex command mode: `babysitter:retrospect`.
- Added mapping/runtime helpers:
  - `.codex/process-library.js`
  - `.codex/codex-mapping.js`
  - discovery now reports mapped `processLibraryRoot`/`referenceRoot`.
- Foundation modules for prioritized roadmap delivery:
  - feature flags (`.codex/feature-flags.js`)
  - session index (`.codex/state-index.js`)
  - event stream + notifications (`.codex/event-stream.js`)
  - policy engine (`.codex/policy-engine.js`)
  - model routing (`.codex/model-router.js`)
  - telemetry + budget checks (`.codex/telemetry.js`)
  - workspace manager (`.codex/workspace-manager.js`)
  - MCP doctor scaffold (`.codex/mcp-doctor.js`)
  - eval harness scaffold (`.codex/eval-harness.js`)
  - GitHub issue workflow helper (`.codex/github-workflow.js`)
- New hook lifecycle types: `on-tool-error`, `on-policy-block`, `on-retry`.
- Roadmap doc and feature-request issue template.
- Feature-complete implementation pass for requested items 1-10:
  - selector-based session UX (`list`, `search`, alias/tag management)
  - event stream IDs/sequence and configurable notification sinks (including file sink)
  - policy config with staged approvals + strict allowlists
  - persisted model routing policy (`.a5c/config/model-policy.json`)
  - richer MCP doctor checks + recommendations
  - GitHub issue flow with comments, apply mode, and optional PR update/create paths
  - telemetry history and explicit budget phase states (`normal`/`soft-limit`/`hard-stop`)
  - docs: `docs/FEATURES_1_10.md`

### Changed
- Fixed plugin command metadata regression: per-command descriptions restored in `.codex/plugin.json`.
- Command surface increased to 15 modes with `team-install`.
- Updated plugin manifest command set to 15 commands (including `retrospect` and `team-install`) and version `4.0.148`.
- Updated docs/tests for 15-mode parity and upstream-library mapping.
- `orchestrate.js` now emits structured events, supports policy/model/telemetry integration, and records session metadata for resume UX.
- `on-turn-complete` now emits event-stream notifications.
- Dispatcher now executes concrete mode handlers for `model`, `issue`, `resume` selectors, and `doctor mcp`.
- Orchestrator now supports multi-repo alias workdirs and adaptive prompt shrinking under budget pressure.
- Added upstream sync/parity tooling and documentation (`sync:upstream`, `check:upstream`).
- Added explicit compatibility policy checks (`check:compat`) and CI enforcement.
- Added maintainer runbook and real-world validation docs.

## [0.1.4] - 2026-03-07

### Added
- First-class macOS support documentation and install verification steps.
- Cross-platform long-session scenario runner: `test/full-session-long-run.js`.
- GitHub Actions CI matrix for `macos-13`, `ubuntu-latest`, and `windows-2022` on Node `20` and `22`.
- Shared SDK package resolver (`.codex/sdk-package.js`) used by runtime/test entrypoints.

### Changed
- Runtime hooks now resolve SDK package via `BABYSITTER_SDK_PACKAGE`/`BABYSITTER_SDK_VERSION` with consistent wrapper invocation.
- `postinstall` now enforces executable bits (`+x`) for hook shell scripts on non-Windows systems.
- `npm run test:long-scenario` now uses the cross-platform Node runner.

## [0.1.3] - 2026-03-06

### Added
- SDK capability detection with explicit compatibility reporting (`full`, `compat-core`, `unsupported`).
- Deterministic per-run trace logging at `<runDir>/run-trace.jsonl`.
- Trace events across run lifecycle (run/iteration/task requested, executed, posted, failed, completed).
- Windows and Linux installation guides with platform-specific commands.
- Full long-session scenario runner (`test/full-session-long-run.ps1`) that enforces:
  - at least 3 interview breakpoints
  - at least 1 breakpoint with 4 questions
  - user-choice application checks in generated artifact
  - simulated 60-minute workload
  - strict `score == 100` pass gate
- Full scenario runbook and helper scripts:
  - `test/FULL_SESSION_SCENARIO.md`
  - `test/full-session-scenario.js`
  - npm scripts: `test:scenario`, `test:long-scenario`

### Changed
- Orchestrator startup now fails fast when required core SDK commands are missing.
- Health diagnostics now include compatibility-aware missing core/advanced command reporting.
- README now clarifies Babysitter is external to Codex and explains real activation prompts per mode.
- Requirements documentation now clarifies SDK dependency is installed by `babysitter-codex` (non-circular install guidance).

## [0.1.2] - 2026-03-05

### Added
- Codex CLI skill package with one-step global install flow.
- 11 orchestration modes and hook-based integration.

### Notes
- Baseline for subsequent Codex compatibility and documentation improvements listed under `Unreleased`.

## [0.1.1] - 2026-03-04

### Added
- Packaging and installation stability fixes for Codex skill discovery.

## [0.1.0] - 2026-03-03

### Added
- Initial `babysitter-codex` release with Codex skill integration baseline.
