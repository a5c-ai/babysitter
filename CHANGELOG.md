# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-05-21

### feat
- f493c5821 feat(ci): add QA Daily workflow — comprehensive daily automation (Tal Muskal, 14 hours ago)
- 1531be36b feat(krate-web): KServe inference service UI, test panel, agent stack integration (Tal Muskal, 17 hours ago)
- 208eb148d feat(krate): KServe inference service integration with model serving, V2 protocol, provider config (Tal Muskal, 18 hours ago)
- c04fd7589 feat(ci): add agent-review-dispatch workflow (Tal Muskal, 18 hours ago)
- 537784775 feat(krate-web): artifact registry UI, feeds, versions, access policies (Tal Muskal, 22 hours ago)
- 33c634e10 feat(live-stack): add resume scenarios to push defaults, pass process_mode (Tal Muskal, 23 hours ago)

### fix
- 659b2a4c3 fix(ci): add push trigger to qa-daily for workflow discovery (Tal Muskal, 12 minutes ago)
- 22c3fc507 fix(ci): add --force-local to tar for Windows drive letter paths (Tal Muskal, 5 hours ago)
- 85c6db972 fix(krate): add cache invalidation endpoint to API server (Tal Muskal, 14 hours ago)
- a99b9871e fix(krate): invalidate API container cache after all web mutations (Tal Muskal, 14 hours ago)
- 7d0f8b01e fix docs build commander resolution (Tal Muskal, 14 hours ago)
- 20d32b7d8 fix(live-stack): defer hooks verdict until run completion is known (Tal Muskal, 14 hours ago)
- 2debb8373 fix(krate): assistant uses direct API call, improved chat UI, no more pod crashes (Tal Muskal, 14 hours ago)
- a57298293 fix(live-stack): use babysitter-agent resume CLI for resume tests (Tal Muskal, 14 hours ago)
- 3e9ebe56e fix(live-stack): simplify resume fixture — only assemble+verify pending (Tal Muskal, 15 hours ago)
- a4a51ce2c fix codex responses proxy routing (Tal Muskal, 15 hours ago)
- bb9a79465 fix(breakpoints-mux): override commander to v12 globally (Tal Muskal, 16 hours ago)
- 89d74c4af fix(sdk): set NODE_PATH before ESM process module import (Tal Muskal, 16 hours ago)
- 977c3b0fe fix(live-stack): switch codex push defaults from google to foundry (Tal Muskal, 17 hours ago)
- 241691401 fix(live-stack): lower MIN_JOURNAL_EVENTS from 15 to 3 (Tal Muskal, 17 hours ago)
- 436ede2f4 fix(ci): normalize RUNNER_TEMP path for Windows tar compatibility (Tal Muskal, 17 hours ago)
- d24e9a881 fix(live-stack): accept journal evidence as completion proof (Tal Muskal, 17 hours ago)
- acaf9fbb0 fix(krate): optional chaining, CORS headers, logout error handling, Dockerfile docs (Tal Muskal, 18 hours ago)
- 60e5d7efd fix(live-stack): add --bridge-hooks when interactive falls back to NI (Tal Muskal, 18 hours ago)
- 0baa4da8b fix(breakpoints-mux): add baseUrl for tsconfig paths to take effect (Tal Muskal, 18 hours ago)
- 7ea4b0cda fix(krate): persistent sessions, missing CRDs, auth on routes, artifact validation (Tal Muskal, 18 hours ago)
- 0d79fb74c fix(hooks): correct hook script path resolution for Codex (Tal Muskal, 18 hours ago)
- 3ac74a7a4 fix(live-stack): restore hooks-mux verification as required check (Tal Muskal, 19 hours ago)
- a914629d5 fix(breakpoints-mux): pin commander type resolution to local node_modules (Tal Muskal, 19 hours ago)
- 2d3a5e884 fix(hooks): use direct binary invocation, relax hooks verification (Tal Muskal, 19 hours ago)
- 98d0fb49f fix(live-stack): set NODE_PATH for ESM process module resolution (Tal Muskal, 19 hours ago)
- d0cc08958 Fix claude run:create initial wakeup (github-actions[bot], 19 hours ago)
- a18bb5a10 Fix journal append sequence serialization (a5c automation, 19 hours ago)
- 549f0f8f7 fix(sdk): prevent duplicate run completion events (a5c-ai-bot, 19 hours ago)
- ba7eaa1cb fix(live-stack): derive process_mode from artifact dir name in report (Tal Muskal, 20 hours ago)
- 2447a96f0 fix(hooks): use npx -y <package> instead of direct binary for hook commands (Tal Muskal, 20 hours ago)
- 5ae6f0b71 fix(live-stack): add a5c-hooks-mux to PATH in test jobs (Tal Muskal, 20 hours ago)
- 77b830968 fix(ci): use runner.temp expression in artifact path fields (Tal Muskal, 21 hours ago)
- a046f3c9c fix(live-stack): Windows/macOS/resume fixes (Tal Muskal, 21 hours ago)
- 61ea4ded7 fix(live-stack): use plain --no-interactive on macOS CI (no PTY available) (Tal Muskal, 21 hours ago)
- 7668bdeb1 fix(ci): add shell: bash default to live-stack build job (Tal Muskal, 21 hours ago)
- b3c6623ef fix(ci): replace deprecated always-auth with token input in setup-node@v6 (Tal Muskal, 22 hours ago)
- edde2f8fb fix(live-stack): fix resume mode setup — mkdir runs dir, sed all JSONs (Tal Muskal, 22 hours ago)
- ba8ac456f fix(atlas): remove graph/ from npm package files (61MB exceeded limit) (Tal Muskal, 22 hours ago)
- 3a29cee18 fix(live-stack): skeleton template + validation for create process mode (Tal Muskal, 23 hours ago)
- c3ff4ab98 fix(live-stack): use bridge-interactive for macOS CI instead of external PTY (Tal Muskal, 23 hours ago)
- 749e73116 fix(ci): pass ref input to live-stack test job checkouts (Tal Muskal, 24 hours ago)
- 177ab1e33 fix(ci): publish atlas before other foundation packages (Tal Muskal, 24 hours ago)
- 2a048b747 fix(live-stack): use PTY only for launch command, not setup commands (Tal Muskal, 24 hours ago)

### refactor
- 96e0d3e4c refactor(krate): fix stack layers (tools+plugins), add RBAC ServiceAccount roles (Tal Muskal, 23 hours ago)

### docs
- d0a8d1a7a docs(krate): comprehensive update for KServe, artifacts, assistant, auth fixes (Tal Muskal, 14 hours ago)
- 3fe85e3c5 docs(krate): update all specs for KServe, artifacts, assistant + add route tests (Tal Muskal, 15 hours ago)
- 59e4da811 docs: remove create mode flakiness note, opened issue instead (Tal Muskal, 23 hours ago)
- ce2e7f463 docs: update live-stack QA guide with recent changes (Tal Muskal, 23 hours ago)

### chore
- d3bea7003 chore: set sdkVersion to 5.0.1-staging.22c3fc50735d [skip publish] (github-actions[bot], 5 hours ago)
- c07ff17a3 chore: set sdkVersion to 5.0.1-staging.85c6db972a97 [skip publish] (github-actions[bot], 13 hours ago)
- c2a0fa327 chore: set sdkVersion to 5.0.1-staging.3e9ebe56e689 [skip publish] (github-actions[bot], 14 hours ago)
- 49f0029cd chore: set sdkVersion to 5.0.1-staging.bb9a79465e69 [skip publish] (github-actions[bot], 16 hours ago)
- 900d09381 revert: restore codex+google in push defaults (Tal Muskal, 16 hours ago)
- c7fa11b54 chore: set sdkVersion to 5.0.1-staging.d24e9a881383 [skip publish] (github-actions[bot], 17 hours ago)
- 00264db61 chore: set sdkVersion to 5.0.1-staging.1531be36b919 [skip publish] (github-actions[bot], 17 hours ago)
- f99e7ca18 chore: set sdkVersion to 5.0.1-staging.208eb148d427 [skip publish] (github-actions[bot], 17 hours ago)
- 6a0cbee56 chore: set sdkVersion to 5.0.1-staging.60e5d7efd876 [skip publish] (github-actions[bot], 18 hours ago)
- 985ed5bfa chore: set sdkVersion to 5.0.1-staging.c04fd7589e8d [skip publish] (github-actions[bot], 18 hours ago)
- bd45ca72a chore: set sdkVersion to 5.0.1-staging.2d3a5e88463b [skip publish] (github-actions[bot], 18 hours ago)
- b57fb554d chore: set sdkVersion to 5.0.1-staging.c23b0729d474 [skip publish] (github-actions[bot], 19 hours ago)
- 518e55b34 chore: set sdkVersion to 5.0.1-staging.ba7eaa1cba61 [skip publish] (github-actions[bot], 19 hours ago)
- 09aa24ccd chore: set sdkVersion to 5.0.1-staging.2447a96f0952 [skip publish] (github-actions[bot], 20 hours ago)
- cb0966a9f chore: set sdkVersion to 5.0.1-staging.5ae6f0b71e30 [skip publish] (github-actions[bot], 20 hours ago)
- 600279c0f chore: set sdkVersion to 5.0.1-staging.77b830968424 [skip publish] (github-actions[bot], 20 hours ago)
- 30fc19082 chore: set sdkVersion to 5.0.1-staging.7668bdeb1824 [skip publish] (github-actions[bot], 21 hours ago)
- 62119ebf7 Plan issue 170 first iteration wakeup (github-actions[bot], 21 hours ago)
- a1a1c0f19 Plan issue 191 journal sequence fix (Codex, 21 hours ago)
- 03caf5fcc chore: set sdkVersion to 5.0.1-staging.efbc1959c0a1 [skip publish] (github-actions[bot], 21 hours ago)
- 20e09ab13 Plan issue 181 runtime completion idempotency (Codex, 21 hours ago)
- 548989592 chore: set sdkVersion to 5.0.1-staging.36821301884c [skip publish] (github-actions[bot], 21 hours ago)
- 4e1cf9f25 chore: set sdkVersion to 5.0.1-staging.edde2f8fbbb1 [skip publish] (github-actions[bot], 22 hours ago)
- 429c6b056 chore: set sdkVersion to 5.0.1-staging.ba8ac456f295 [skip publish] (github-actions[bot], 22 hours ago)
- f6785ef0b chore: set sdkVersion to 5.0.1-staging.3a29cee18d84 [skip publish] (github-actions[bot], 23 hours ago)
- 7c2826607 chore: set sdkVersion to 5.0.1-staging.c3ff4ab98005 [skip publish] (github-actions[bot], 23 hours ago)
- 950e82f1f chore: set sdkVersion to 5.0.1-staging.749e7311613f [skip publish] (github-actions[bot], 23 hours ago)
- f43857e00 chore: set sdkVersion to 5.0.1-staging.2a048b747752 [skip publish] (github-actions[bot], 24 hours ago)

## [Unreleased]

- No unreleased changes.


## [5.0.0] - 2026-04-18
- No notable changes.



### Fixed
- Restored the automatic stop-hook drive of `babysitter run:iterate` inside Claude Code and GitHub Copilot sessions. Two regressions had broken the chain: (a) `setBabysitterSessionIdInEnvFile` (and its Copilot twin) rewrote `CLAUDE_ENV_FILE`/`COPILOT_ENV_FILE` via `writeFileSync(tmp)+renameSync`, breaking the harness env-sourcing contract that relies on append-only writes to a stable inode; (b) the session-start PID-marker writer emitted `current-session-pid-<pid>` while the reader expected the slugged `current-session-claude-code-pid-<pid>`, causing the marker rail to always miss. The writer now goes through `getSessionMarkerPath()` so writer and reader agree, and the env-file helpers are append-only. The resolver's last-match regex already tolerates accumulated exports from repeated session rotation, so append-only is safe.
- Inverted session-ID resolution precedence across all harness adapters to prefer the PID-scoped session marker (authoritative, tied to live ancestor Claude Code PID) over the inheritable `BABYSITTER_SESSION_ID` env var, which previously caused cross-session bleed when a parent shell had a stale export.
- Env-file stale-line hazard: resolver uses last-match regex, tolerating the multiple `export BABYSITTER_SESSION_ID=...` lines that accumulate as `CLAUDE_ENV_FILE` is appended to across session rotation (/clear, re-init).
- Replaced legacy `wmic` with a PowerShell `Get-CimInstance` fallback cascade for Windows 11 24H2+, where `wmic` has been removed from the base image.
- Added `session:whoami` and `session:cleanup` commands, plus four new `/babysitter:doctor` checks covering session-binding provenance and liveness.
- Added `BABYSITTER_TRUST_ENV_SESSION=1` escape hatch to retain legacy env-first precedence for CI workflows that deliberately export `BABYSITTER_SESSION_ID`.
- Closes #130; related to previously-fixed #100, #107, #75.


## [0.0.187] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.186] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.185] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.184] - 2026-04-03
- No notable changes.



- No unreleased changes.


## [0.0.183] - 2026-03-30
- No notable changes.



- No unreleased changes.


## [0.0.182] - 2026-03-15
- No notable changes.



- No unreleased changes.


## [0.0.181] - 2026-03-15
- No notable changes.



- No unreleased changes.


## [0.0.180] - 2026-03-10
- No notable changes.



- No unreleased changes.


## [0.0.179] - 2026-03-07
- No notable changes.



- No unreleased changes.


## [0.0.178] - 2026-03-07
- No notable changes.



- No unreleased changes.


## [0.0.177] - 2026-03-06
- No notable changes.



- No unreleased changes.


## [0.0.176] - 2026-03-06
- No notable changes.



- No unreleased changes.


## [0.0.175] - 2026-03-04
- No notable changes.



- No unreleased changes.


## [0.0.174] - 2026-03-04
- No notable changes.



- No unreleased changes.


## [0.0.173] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.172] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.171] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.170] - 2026-03-03
- No notable changes.



- No unreleased changes.


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


## [Unreleased]

- No unreleased changes.


## [0.0.170] - 2026-03-02

Major release featuring a complete hook system overhaul, Docker-based deployment, harness adapter architecture for agent-agnostic compatibility, a growing process library with methodology assimilation, and many new slash commands.

Thank you for the active contributions and support: @YoavMayer , @MaTriXy , @guyelia , @Eyaldavid7 , @giladw , @yosit , @lorg , @davidt99 , @OriAshkenazi , @hexelon and others!

### Added

#### Slash Commands
- `/babysitter:doctor` — Run diagnostics
- `/babysitter:observe` — Observer dashboard for real-time process monitoring and management
- `/babysitter:yolo` — No breakpoint, fully autonomous execution mode
- `/babysitter:resume` — Resume interrupted or paused runs
- `/babysitter:help` — Usage guides for all babysitter commands and workflows, processes, skills, agents, and methodologies
- `/babysitter:plan` — Structured planning workflows
- `/babysitter:forever` — Long-running orchestration sessions
- `/babysitter:assimilate` — Convert external AI coding methodologies into babysitter process definitions, or integrate specific AI harness with the babysitter SDK (e.g. codex, opencode, antigravity)
- `/babysitter:call` — Invoke babysitter orchestration directly
- `/babysitter:project-install` and `/babysitter:user-install` — Setup and customize babysitter at project or user level

#### Core Features
- **Profiles SDK module** with CLI commands for managing user and project profiles
- **Process-driven skill and agent discovery** using JSDoc markers for better extensibility
- **Harness adapter architecture** for agent-agnostic session binding (fixes #7)
  - Claude-specific code centralized into harness adapter module
  - Auto-detection of harness environment when binding sessions
  - `--harness` flag on `run:create` for adapter selection
  - Foundation for supporting non-Claude hosts (Codex, OpenCode, etc.)
- **Session transcript capture and verification** for full orchestration lifecycle tracking
  - Structural transcript parsing for reliable stop hook verification
- **Initial prompt now persisted** in `run.json` and `RUN_CREATED` events (fixes #8)

#### Process Library
- **Methodology assimilation workflow** for converting external AI coding processes into babysitter process definitions
- **Harness integration process** — process definition for adapting the SDK to non-Claude environments
- **Codebase security audit process** for systematic security compliance scanning
- **GSD (Get Stuff Done) processes** properly converted to babysitter process definitions
- **Assimilated external methodologies**:
  - BMAD Method (bmad-code-org/BMAD-METHOD)
  - Superpowers Extended (pcvelz/superpowers)
  - Gas Town (steveyegge/gastown)
  - RPIKit (bostonaholic/rpikit)
  - CC10X (romiluz13/cc10x)
  - Metaswarm (dsifry/metaswarm)
  - and many more

#### Infrastructure
- **Docker support** as primary deployment method with comprehensive E2E testing
- **Staging publish workflow** for better release management
- **Breakpoints service and legacy editor extension surfaces completely removed** from the system
- **Completion secret renamed to completion proof** throughout the API for clearer semantics

### Fixed

#### Hook System
- **Hook invocation mechanism changed** from shell scripts to SDK CLI `hook:run` command for better reliability and maintainability
- **Stop hook** no longer bails on empty prompts when run is bound to a session
- **Stop hook** now uses `last_assistant_message` fallback for better reliability
- **Stop hook skill context** improved by excluding babysit, capping at 10, showing full paths
- **Stop hook** preserves session file when run state is unknown instead of deleting it, allowing recovery
- **Stop hook** fallback run directory search for nested `.a5c/.a5c/runs/` paths created by babysit skill
- **Session-start hook** creates baseline state file proactively
- **Session-start hook** prevents hanging by ensuring clean stdin EOF handling
- **Session-start hook** installs babysitter CLI from correct SDK version

#### Breakpoints
- **Breakpoint response validation for interactive mode** — `AskUserQuestion` responses are now validated; empty or dismissed responses are no longer silently treated as approval (fixes #19)

#### State Management
- **State cache** rebuilt after terminal events ensuring data consistency

#### CLI & Build
- **CLI exit codes** properly propagated via `process.exitCode`
- **Plugin version** derived dynamically instead of being hardcoded
- **Build system fixes** including rollup workarounds and npm optional dependencies
- **Deprecated transitive dependencies** updated — resolved npm audit warnings for glob, tar, rimraf, inflight, npmlog, etc. (fixes #10)

#### Discovery & Execution
- **Discovery bloat** removed from `run:iterate` with compacted `run:create` output
- **Irrelevant specialization skills** excluded from discovery with capped summary length
- **Harness CLI flag** respected for adapter selection in `run:create`
- **Run directory resolution** improved with doubled `.a5c` path collapsing
- **Shared `resolveInputPath` utility** prevents double-nested `.a5c/runs` paths
- **Runaway loop detection threshold** increased from 3 to 10 consecutive fast iterations to reduce false positives

#### E2E & Testing
- **Session transcript format handling** fixed for real Claude Code output
- **Stop hook verification tests** made resilient to non-interactive (`-p`) mode
- **E2E orchestration tests** handle nested run directory paths with recursive search and post-run consolidation
- **E2E journal verification** allows `STOP_HOOK_INVOKED` events after `RUN_COMPLETED`
- **E2E credential handling** fixed for Azure Foundry and multiple API key formats

### Improved

#### Architecture
- **Hook system refactored** from shell scripts to SDK CLI `hook:run` command
- **Session binding** auto-configures when harness and session-id are provided
- **Discovery expanded** to agents and processes for broader capability coverage

#### Observability
- **Comprehensive diagnostic logging** throughout stop hook execution paths
- **Doctor command enhanced** with hook execution health diagnostics
- **Run verification** more resilient with better error handling and diagnostics

#### Documentation
- **Command files rewritten** with improved structure and closed process gaps
- **Assimilation documentation** for converting external methodologies and harnesses
- **Orchestration loop rules** and common mistakes clarified in SKILL.md
- **Research and plan output** improved readability (fixes #9)
- **E2E test coverage** significantly expanded for hooks, profiles, and orchestration

---


### Added
- Explorer context command `Babysitter: Dispatch Run from Task File` that trims `.task.md` content and invokes the standard dispatch flow.
- Continuous release pipeline (`.github/workflows/release.yml`) with pinned actions, checksum-protected VSIX artifacts, helper scripts for semantic versioning/release notes, and a documented rollback script (`scripts/rollback-release.sh` + `docs/release-pipeline.md`).

## [0.0.3] - 2026-01-05

### Added

- Initial packaged editor observer surface with run discovery, monitoring, UI views, and `o` integration scaffolding.
