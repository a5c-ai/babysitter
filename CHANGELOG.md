# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Deprecation Notice

**The VS Code extension (babysitter-vscode) has been deprecated and is no longer maintained.**

Historical release entries below are preserved for reference but the extension will not receive further updates.

---

## [Unreleased]

- No unreleased changes.


## [0.0.170] - 2026-02-24

This release represents a major milestone in the Babysitter project, featuring a complete architectural overhaul of the hook system, the introduction of Docker as the primary deployment method, and significant improvements to observability and developer experience. The release includes 13 new features, 22 bug fixes, 9 improvements, and several breaking changes that modernize the system's core capabilities.

### Breaking Changes

- **Breakpoints service has and vscode extension has been completely removed** from the system
- **Hook invocation mechanism changed** from shell scripts to SDK CLI commands for better reliability and maintainability
- **Completion secret renamed to completion proof** throughout the API for clearer semantics

### Added

#### Core Features
- **Profiles SDK module** with CLI commands for managing user and project profiles
- **Observe command** for plugin management and monitoring
- **Doctor command** with HTML reports for comprehensive run diagnostics and health checks
- **Yolo command** for rapid development workflows
- **Process-driven skill and agent discovery** using JSDoc markers for better extensibility
- **Harness adapter system** for flexible session binding across different Claude environments
  - Auto-detection of harness environment when binding sessions
- **Session transcript capture and verification** for full orchestration lifecycle tracking
  - Structural transcript parsing for reliable stop hook verification
- **Support for persisting initial prompt** in `run.json` and `RUN_CREATED` events

#### Infrastructure
- **Docker support** as a deployment method with comprehensive E2E testing
- **Staging publish workflow** for better release management

#### UI
- **Revamped UI components** with modern Sci-Fi neon theme

### Fixed

#### Hook System
- **Stop hook** no longer bails on empty prompts when run is bound to a session
- **Stop hook** now uses `last_assistant_message` fallback for better reliability
- **Stop hook skill context** improved by excluding babysit and showing full paths
- **Session-start hook** now creates baseline state file proactively
- **Session-start hook** prevents hanging by ensuring clean stdin EOF handling
- **Session-start hook** installs babysitter CLI from correct SDK version

#### State Management
- **State cache** is now rebuilt after terminal events ensuring data consistency

#### CLI & Build
- **CLI exit codes** are now properly propagated via `process.exitCode`
- **Plugin version** is now derived dynamically instead of being hardcoded
- **Build system fixes** including rollup workarounds and npm optional dependencies

#### Discovery & Execution
- **Discovery bloat** removed from `run:iterate` with compacted `run:create` output
- **Irrelevant specialization skills** excluded from discovery with capped summary length
- **Harness CLI flag** is now respected for adapter selection in `run:create`
- **Run directory resolution** improved with doubled `.a5c` path collapsing

#### Testing
- **Session transcript format handling** fixed for real Claude Code output
- **Multiple fixes for stop hook verification tests** in non-interactive mode
- **Multiple fixes for E2E orchestration tests** including credentials and fixtures

### Improved

#### Architecture
- **Hook system refactored** from shell scripts to SDK CLI commands for better maintainability
- **Session binding** now auto-configures when harness and session-id are provided
- **Discovery expanded** to agents and processes for broader capability coverage

#### Observability
- **Comprehensive diagnostic logging** added throughout stop hook execution paths
- **Doctor command enhanced** with hook execution health diagnostics
- **Run verification** made more resilient with better error handling and diagnostics

#### Testing & Documentation
- **E2E test coverage** significantly expanded for hooks, profiles, and orchestration
- **Documentation updated** across commands, orchestration rules, and common mistakes
- **Command files rewritten** with improved structure and closed process gaps

---


## [0.0.169] - 2026-02-19
- No notable changes.



- No unreleased changes.


## [0.0.168] - 2026-02-16
- No notable changes.



- No unreleased changes.


## [0.0.167] - 2026-02-16
- No notable changes.



- No unreleased changes.


## [0.0.166] - 2026-02-12
- No notable changes.



- No unreleased changes.


## [0.0.165] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.164] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.163] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.162] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.161] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.160] - 2026-02-08
- No notable changes.



- No unreleased changes.


## [0.0.159] - 2026-02-08
- No notable changes.



- No unreleased changes.

## [0.0.158] - 2026-02-02
- No notable changes.



- No unreleased changes.


## [0.0.157] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.156] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.155] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.154] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.153] - 2026-01-30
- No notable changes.



- No unreleased changes.


## [0.0.152] - 2026-01-30
- No notable changes.



- No unreleased changes.

## [0.0.151] - 2026-01-30
- No notable changes.



- No unreleased changes.


## [0.0.150] - 2026-01-28
- No notable changes.



- No unreleased changes.


## [0.0.149] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.148] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.147] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.146] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.145] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.144] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.143] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.142] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.141] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.140] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.139] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.138] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.137] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.136] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.135] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.134] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.133] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.132] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.131] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.130] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.129] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.128] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.127] - 2026-01-25
- No notable changes.



- No unreleased changes.

## [0.0.126] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.125] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.124] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.123] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.122] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.121] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.120] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.119] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.118] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.117] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.116] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.115] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.114] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.113] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.112] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.111] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.110] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.109] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.108] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.107] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.106] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.105] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.104] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.103] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.102] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.101] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.100] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.99] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.98] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.97] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.96] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.95] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.94] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.93] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.92] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.91] - 2026-01-24
- No notable changes.



- No unreleased changes.

## [0.0.90] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.89] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.88] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.87] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.86] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.85] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.84] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.83] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.82] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.81] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.80] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.79] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.78] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.77] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.76] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.75] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.74] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.73] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.72] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.71] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.70] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.69] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.68] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.67] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.66] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.65] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.64] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.63] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.62] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.61] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.60] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.59] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.58] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.57] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.56] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.55] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.54] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.53] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.52] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.51] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.50] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.49] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.48] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.47] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.46] - 2026-01-21
- No notable changes.


- No unreleased changes.


## [0.0.45] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.44] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.43] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.42] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.41] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.40] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.39] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.38] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.37] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.36] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.35] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.34] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.33] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.32] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.31] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.30] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.29] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.28] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.27] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.26] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.25] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.24] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.23] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.22] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.21] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.20] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.19] - 2026-01-18
- No notable changes.



- No unreleased changes.


## [0.0.18] - 2026-01-17
- No notable changes.



- No unreleased changes.


## [0.0.17] - 2026-01-16
- No notable changes.



- No unreleased changes.


## [0.0.16] - 2026-01-15
- No notable changes.



- No unreleased changes.


## [0.0.15] - 2026-01-15
- No notable changes.



- No unreleased changes.


## [0.0.14] - 2026-01-13
- No notable changes.



- No unreleased changes.


## [0.0.13] - 2026-01-13
- No notable changes.



- No unreleased changes.


## [0.0.12] - 2026-01-13
- No notable changes.



- No unreleased changes.


## [0.0.11] - 2026-01-13
- No notable changes.



- No unreleased changes.


## [0.0.10] - 2026-01-12
- No notable changes.



- No unreleased changes.


## [0.0.9] - 2026-01-12
- No notable changes.



- No unreleased changes.


## [0.0.8] - 2026-01-12
- No notable changes.



- No unreleased changes.


## [0.0.7] - 2026-01-12
- No notable changes.


### Added
- Explorer context command `Babysitter: Dispatch Run from Task File` that trims `.task.md` content and invokes the standard dispatch flow.
- Continuous release pipeline (`.github/workflows/release.yml`) with pinned actions, checksum-protected VSIX artifacts, helper scripts for semantic versioning/release notes, and a documented rollback script (`scripts/rollback-release.sh` + `docs/release-pipeline.md`).

## [0.0.3] - 2026-01-05

### Added

- Initial packaged VS Code extension with run discovery, monitoring, UI views, and `o` integration scaffolding.
