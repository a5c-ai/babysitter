# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased] - 2026-05-25

### feat
- 85bf9b9b2 feat(krate-web): add stack inline editor, fix RBAC deletion cleanup (Tal Muskal, 6 hours ago)

### fix
- af82b2659 fix(krate-web): add cache invalidation to repository, dispatch, and conflict routes (Tal Muskal, 4 hours ago)
- a6661b3b8 fix(live-stack): update stale test assertions for prompt text and create-mode cleanup (Tal Muskal, 6 hours ago)
- 82b214fdd fix(krate-web): fix broken CRUD actions, API paths, and missing endpoints across console (Tal Muskal, 6 hours ago)
- 09a5cc834 fix(live-stack): hooks-mux optional in interactive mode, not just bridged-hooks (Tal Muskal, 6 hours ago)
- 98adc381c fix(live-stack): cross-platform BP fixture setup (bash→node) (Tal Muskal, 6 hours ago)
- aeb77e1b9 fix(live-stack): macOS BI child_process fallback + Windows BP npm spawn (Tal Muskal, 6 hours ago)
- 8994fb43a fix: gemini-cli prompt + macOS BI stdout capture + BP resume command (Tal Muskal, 7 hours ago)
- 07d877d5a fix(transport-mux): whitelist root path / for proxy auth (health checks) (Tal Muskal, 9 hours ago)
- f888f721b fix(launch): add PTY skip + child_process fallback to bridge-interactive path (#308) (Tal Muskal, 10 hours ago)
- b4e0d9f87 fix(launch): BI fallback uses pipe stdio (matching NI) + debug logging (Tal Muskal, 11 hours ago)
- 6ab464ce4 fix(launch): use resolveSpawnCommand in BI fallback path (Tal Muskal, 12 hours ago)
- 7495ef6c9 fix(transport-mux): update google streaming test to expect text/event-stream (Tal Muskal, 12 hours ago)
- 7cd802acc fix: three live-stack fixes — macOS BI skip, hooks trust pattern, gemini SSE (Tal Muskal, 12 hours ago)
- 04ca6ab00 fix(sdk): update fallback metadata contract test for LOCAL_FALLBACK merge (Tal Muskal, 23 hours ago)
- b0a5280e9 fix(launch-mux): auto-trust codex hooks in bridged-interactive mode (#309) (Tal Muskal, 24 hours ago)
- f4f6eba7b fix(launch-mux): robust PTY fallback for macOS ARM64 posix_spawnp failures (#308) (Tal Muskal, 24 hours ago)

### test
- 162419dd9 fix(test): use /babysitter:resume for BP resume mode (#312) (Tal Muskal, 9 hours ago)
- c7c9387a8 fix(test): only require hooks-mux logs in bridged-hooks mode, not interactive (Tal Muskal, 24 hours ago)

### ci
- 732ae0718 fix(ci): fix tool-mux/launch-mux build order in publish-packages-from-tag (Tal Muskal, 6 hours ago)
- 0acb12b0c fix(ci): add push trigger to live-stack-published for GitHub workflow discovery (Tal Muskal, 12 hours ago)
- 7068be42b fix(ci): add hooks-mux-adapter-hermes and krate to version bump paths (Tal Muskal, 12 hours ago)
- 690771e15 fix(ci): add agent-config-mux, agent-launch-mux, tool-mux to publish pipeline (Tal Muskal, 12 hours ago)
- f3231e185 feat(ci): add live-stack-published workflow — tests with npm packages only (Tal Muskal, 12 hours ago)
- 6f65d1699 fix(ci): add agent-runtime, omni, tool-mux to publish pipeline and version bumps (Tal Muskal, 24 hours ago)

### chore
- e4a494a26 chore: trigger workflow discovery for live-stack-published (Tal Muskal, 12 hours ago)
- 75193c134 redesign(krate-web): modern dark-first Terminal Craft design system (Tal Muskal, 12 hours ago)
- a4cc57b13 Move CLI implementation into omni (Tal Muskal, 12 hours ago)
- 0ca99c5d8 Revert "fix(test): only require hooks-mux logs in bridged-hooks mode, not interactive" (Tal Muskal, 24 hours ago)

## [Unreleased] - 2026-05-22

### feat
- 3b7851ee5 feat(agent-runtime): move daemon, session, cost, observability from babysitter-agent (#210) (Tal Muskal, 18 minutes ago)
- 108ffeb16 feat(ci): add daily agent version check pipeline (Tal Muskal, 32 minutes ago)
- 2ae6e96d4 feat(agent-runtime): scaffold agent-runtime package (L5) and move runtime files from agent-core (#210) (Tal Muskal, 41 minutes ago)
- d0d0968a5 feat(graph): add launchBehavior to PluginTarget, drive launch.ts from graph (Tal Muskal, 3 hours ago)
- c44ac9b52 feat(ci): add fix-broken-latest-tags script and workflow (Tal Muskal, 15 hours ago)
- 30895c64c feat: v6.1 graph alignment babysitter process definition (Tal Muskal, 24 hours ago)

### fix
- a7fd1e1c8 fix(workflow): update GitHub token generation and checkout action version (Tal Muskal, 14 minutes ago)
- d0934222a fix(video): update vulnerable fast-uri lock entry (Tal Muskal, 16 minutes ago)
- 949d9609b fix(ci): agent version check discovers agents from atlas graph at runtime (Tal Muskal, 29 minutes ago)
- 24e50bb6c fix(ci): add a5c GitHub App token to all trigger-based workflows (Tal Muskal, 49 minutes ago)
- eb8c0c551 fix(transport-mux): add stream error handling, fix Pi proxy API type (Tal Muskal, 50 minutes ago)
- 73b53ae76 fix(amux): restore Pi --mode json, resolve Windows spawn without shell (Tal Muskal, 80 minutes ago)
- 4edff3e2e fix(amux): deliver prompts via stdin on Windows to avoid cmd.exe mangling (Tal Muskal, 2 hours ago)
- f09793644 fix(live-stack): use platform-native mkdir instead of node -e on Windows (Tal Muskal, 2 hours ago)
- ae29cffaf fix(graph): Pi uses -p flag for prompt delivery, not stdin (Tal Muskal, 2 hours ago)
- fa900f15b fix(test): update launch tests for graph-driven launchBehavior (Tal Muskal, 3 hours ago)
- 39422c79d fix(amux): let Pi run in interactive mode for tool-use support (Tal Muskal, 4 hours ago)
- a64b877f0 fix(ci): align download-artifact version with upload, add debug listing (Tal Muskal, 4 hours ago)
- f73d12684 fix(amux): don't duplicate prompt via stdin when already passed as CLI arg (Tal Muskal, 5 hours ago)
- 0cf58b544 fix(ci): conditionally use --force-local tar flag (Windows only) (Tal Muskal, 14 hours ago)
- a2e883985 fix(ci): rename breakpoints-mux → tasks-mux in all workflows (Tal Muskal, 15 hours ago)
- c231e9e09 fix(npm): also flag plugin 5.0.0 as bad publish batch (Tal Muskal, 15 hours ago)
- 5294f1f23 fix(npm): validate plugin sdkVersion references actual published SDK (Tal Muskal, 15 hours ago)
- 60d7727cf fix(npm): add SDK install fallback and fix staging-on-latest detection (Tal Muskal, 15 hours ago)
- 9abaa9513 fix(ci): run publish install steps explicitly (Tal Muskal, 20 hours ago)
- c2c0dbae4 fix(ci): remove publish skip gates (Tal Muskal, 20 hours ago)
- 28347f861 fix(transport-mux): terminate responses SSE streams (Tal Muskal, 21 hours ago)
- 8737c45a8 fix(live-stack): remove output bridge fallback (Tal Muskal, 21 hours ago)
- 7cb50207f fix(ci): align workflows with extension mux rename (Tal Muskal, 21 hours ago)
- b0bc4c35e fix(live-stack): build extension mux workspace (Tal Muskal, 21 hours ago)
- 6f865e961 fix(live-stack): remove skip fallbacks (Tal Muskal, 21 hours ago)
- 15b26de69 fix(live-stack): remove live fallback skips (Tal Muskal, 22 hours ago)
- d60ea34a8 fix(live-stack): fail live evidence gaps (Tal Muskal, 22 hours ago)
- 42336868f fix(live-stack): reset create-mode process scope (Tal Muskal, 22 hours ago)
- 142e76f60 fix(agent-plan-dispatch): update process execution command in comments (Tal Muskal, 23 hours ago)
- d6938a962 fix(live-stack): summarize skipped live-agent lanes (Tal Muskal, 23 hours ago)
- 59f3a98d0 fix(live-stack): allow agent-unavailable coverage skips (Tal Muskal, 23 hours ago)
- 235879270 fix(live-stack): skip invalid bridged transcripts (Tal Muskal, 23 hours ago)
- 11987bc84 fix(live-stack): classify bridged transcript artifacts (Tal Muskal, 23 hours ago)
- 3f3d6fccf fix(live-stack): skip login and empty tool-use transcripts (Tal Muskal, 24 hours ago)

### refactor
- fd222f1ce refactor: rename breakpoints-mux → tasks-mux (Tal Muskal, 22 hours ago)
- 6fa60bb7e refactor: rename agent-plugins-mux → extension-mux (Tal Muskal, 22 hours ago)

### docs
- ace734b12 docs: remove duplicate daily changelog section (github-actions[bot], 14 hours ago)
- cb12a39a0 docs: daily changelog update (github-actions[bot], 14 hours ago)
- 71e2ebb95 docs(reference): add Pattern 8 — page.setContent stub for playwright structural specs (rogelsm, 17 hours ago)
- 9e0ad1f88 docs: v6.1 agent layer capabilities — what core/runtime/platform should do (Tal Muskal, 23 hours ago)
- 5183b3caf docs: v6.1 agent stack decomposition — babysitter-agent, agent-core, SDK (Tal Muskal, 24 hours ago)
- 909da7cf4 docs: v6.1 graph alignment task list — 66 tasks across 5 phases (Tal Muskal, 24 hours ago)

### chore
- 49e3946a2 Fix staging code scanning findings (Tal Muskal, 49 minutes ago)
- b1a6542a2 chore: set sdkVersion to 5.0.1-staging.28347f861706 [skip publish] (github-actions[bot], 20 hours ago)
- 46733254c chore: set sdkVersion to 5.0.1-staging.8737c45a8424 [skip publish] (github-actions[bot], 21 hours ago)
- e5bf90164 chore: set sdkVersion to 5.0.1-staging.7cb50207f287 [skip publish] (github-actions[bot], 21 hours ago)
- 9d9d98838 chore: set sdkVersion to 5.0.1-staging.132f1714ba54 [skip publish] (github-actions[bot], 22 hours ago)
- d4435ef57 Complete transport-mux codec architecture (a5c agent, 22 hours ago)
- 132f1714b chore: remove v6.1 process file — work tracked via GitHub issues (Tal Muskal, 22 hours ago)
- bfe9083b0 chore: set sdkVersion to 5.0.1-staging.59f3a98d09ae [skip publish] (github-actions[bot], 23 hours ago)
- 6d25bb238 chore: set sdkVersion to 5.0.1-staging.5183b3caf612 [skip publish] (github-actions[bot], 23 hours ago)
- 1a6fde4ae chore: set sdkVersion to 5.0.1-staging.c1fec6cebbe7 [skip publish] (github-actions[bot], 24 hours ago)

## [Unreleased] - 2026-05-21

### feat
- c44ac9b52 feat(ci): add fix-broken-latest-tags script and workflow (Tal Muskal, 56 minutes ago)
- 30895c64c feat: v6.1 graph alignment babysitter process definition (Tal Muskal, 9 hours ago)
- e3ace9f1b feat(mcp): add initial MCP server configuration for atlas (Tal Muskal, 11 hours ago)
- e920fef11 feat(live-stack): add OS to job names and report tables (Tal Muskal, 13 hours ago)

### fix
- a2e883985 fix(ci): rename breakpoints-mux → tasks-mux in all workflows (Tal Muskal, 9 minutes ago)
- c231e9e09 fix(npm): also flag plugin 5.0.0 as bad publish batch (Tal Muskal, 18 minutes ago)
- 5294f1f23 fix(npm): validate plugin sdkVersion references actual published SDK (Tal Muskal, 24 minutes ago)
- 60d7727cf fix(npm): add SDK install fallback and fix staging-on-latest detection (Tal Muskal, 35 minutes ago)
- 9abaa9513 fix(ci): run publish install steps explicitly (Tal Muskal, 6 hours ago)
- c2c0dbae4 fix(ci): remove publish skip gates (Tal Muskal, 6 hours ago)
- 28347f861 fix(transport-mux): terminate responses SSE streams (Tal Muskal, 6 hours ago)
- 8737c45a8 fix(live-stack): remove output bridge fallback (Tal Muskal, 6 hours ago)
- 7cb50207f fix(ci): align workflows with extension mux rename (Tal Muskal, 7 hours ago)
- b0bc4c35e fix(live-stack): build extension mux workspace (Tal Muskal, 7 hours ago)
- 6f865e961 fix(live-stack): remove skip fallbacks (Tal Muskal, 7 hours ago)
- 15b26de69 fix(live-stack): remove live fallback skips (Tal Muskal, 7 hours ago)
- d60ea34a8 fix(live-stack): fail live evidence gaps (Tal Muskal, 8 hours ago)
- 42336868f fix(live-stack): reset create-mode process scope (Tal Muskal, 8 hours ago)
- 142e76f60 fix(agent-plan-dispatch): update process execution command in comments (Tal Muskal, 8 hours ago)
- d6938a962 fix(live-stack): summarize skipped live-agent lanes (Tal Muskal, 8 hours ago)
- 59f3a98d0 fix(live-stack): allow agent-unavailable coverage skips (Tal Muskal, 8 hours ago)
- 235879270 fix(live-stack): skip invalid bridged transcripts (Tal Muskal, 9 hours ago)
- 11987bc84 fix(live-stack): classify bridged transcript artifacts (Tal Muskal, 9 hours ago)
- 3f3d6fccf fix(live-stack): skip login and empty tool-use transcripts (Tal Muskal, 9 hours ago)
- c1fec6ceb fix(live-stack): classify transient live agent failures (Tal Muskal, 10 hours ago)
- 5db31fee5 fix(live-stack): remove reference process in create mode setup (Tal Muskal, 12 hours ago)
- 416aa66e5 fix(live-stack): stricter create mode — no reference process, clearer prompt (Tal Muskal, 12 hours ago)
- 63253deb1 fix(agent-mux): use shell on Windows for npm install commands (Tal Muskal, 13 hours ago)
- 297873662 fix(live-stack): push defaults use create only (no predefined), add pi+kimi to BP (Tal Muskal, 13 hours ago)
- 945f4649b fix(live-stack): replace resume with create in push defaults (Tal Muskal, 13 hours ago)
- 31ea47fdc fix(live-stack): report falls back to JSON artifact when no markdown report (Tal Muskal, 13 hours ago)
- 05d599a10 fix(live-stack): set LIVE_STACK_BRIDGE_HOOKS=true in interactive fallback (Tal Muskal, 14 hours ago)
- 659b2a4c3 fix(ci): add push trigger to qa-daily for workflow discovery (Tal Muskal, 14 hours ago)
- 22c3fc507 fix(ci): add --force-local to tar for Windows drive letter paths (Tal Muskal, 19 hours ago)

### refactor
- fd222f1ce refactor: rename breakpoints-mux → tasks-mux (Tal Muskal, 7 hours ago)
- 6fa60bb7e refactor: rename agent-plugins-mux → extension-mux (Tal Muskal, 7 hours ago)

### docs
- 9e0ad1f88 docs: v6.1 agent layer capabilities — what core/runtime/platform should do (Tal Muskal, 8 hours ago)
- 5183b3caf docs: v6.1 agent stack decomposition — agent-platform, agent-core, SDK (Tal Muskal, 9 hours ago)
- 909da7cf4 docs: v6.1 graph alignment task list — 66 tasks across 5 phases (Tal Muskal, 9 hours ago)
- 3070405aa docs: v6.1 mux architecture deep dive — 9 canonical muxes vs packages (Tal Muskal, 10 hours ago)
- 8170b0775 docs: v6.1 spec — layer-to-package gap analysis (Tal Muskal, 11 hours ago)
- effad49e6 docs: daily changelog update (github-actions[bot], 14 hours ago)

### chore
- b1a6542a2 chore: set sdkVersion to 5.0.1-staging.28347f861706 [skip publish] (github-actions[bot], 6 hours ago)
- 46733254c chore: set sdkVersion to 5.0.1-staging.8737c45a8424 [skip publish] (github-actions[bot], 6 hours ago)
- e5bf90164 chore: set sdkVersion to 5.0.1-staging.7cb50207f287 [skip publish] (github-actions[bot], 6 hours ago)
- 9d9d98838 chore: set sdkVersion to 5.0.1-staging.132f1714ba54 [skip publish] (github-actions[bot], 7 hours ago)
- d4435ef57 Complete transport-mux codec architecture (a5c agent, 7 hours ago)
- 132f1714b chore: remove v6.1 process file — work tracked via GitHub issues (Tal Muskal, 8 hours ago)
- bfe9083b0 chore: set sdkVersion to 5.0.1-staging.59f3a98d09ae [skip publish] (github-actions[bot], 8 hours ago)
- 6d25bb238 chore: set sdkVersion to 5.0.1-staging.5183b3caf612 [skip publish] (github-actions[bot], 9 hours ago)
- 1a6fde4ae chore: set sdkVersion to 5.0.1-staging.c1fec6cebbe7 [skip publish] (github-actions[bot], 9 hours ago)
- 544743aee chore: set sdkVersion to 5.0.1-staging.8170b077568f [skip publish] (github-actions[bot], 11 hours ago)
- 26db07fcd chore: set sdkVersion to 5.0.1-staging.5db31fee5f41 [skip publish] (github-actions[bot], 12 hours ago)
- 144e41f5b chore: set sdkVersion to 5.0.1-staging.e920fef118ef [skip publish] (github-actions[bot], 12 hours ago)
- c6c2eff27 chore: set sdkVersion to 5.0.1-staging.945f4649b501 [skip publish] (github-actions[bot], 13 hours ago)
- 3c004881b chore: set sdkVersion to 5.0.1-staging.659b2a4c3b27 [skip publish] (github-actions[bot], 14 hours ago)
- d3bea7003 chore: set sdkVersion to 5.0.1-staging.22c3fc50735d [skip publish] (github-actions[bot], 19 hours ago)

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
