# Codex Mapping

This document defines how upstream Babysitter assets are mapped for use in Codex.

## Source of Truth

- Mapping manifest: `config/codex-command-map.json`
- Upstream plugin snapshot: `upstream/babysitter/plugin.json` (reference data only, not a native Codex runtime contract)
- Upstream process root: `upstream/babysitter/skills/babysit/process`
- Upstream reference root: `upstream/babysitter/skills/babysit/reference`

## Command Mapping

Upstream command docs are mapped to Codex skill files:

- `call` -> `babysitter:call`
- `yolo` -> `babysitter:yolo`
- `resume` -> `babysitter:resume`
- `plan` -> `babysitter:plan`
- `forever` -> `babysitter:forever`
- `doctor` -> `babysitter:doctor`
- `observe` -> `babysitter:observe`
- `retrospect` -> `babysitter:retrospect`
- `help` -> `babysitter:help`
- `project-install` -> `babysitter:project-install`
- `team-install` -> `babysitter:team-install`
- `user-install` -> `babysitter:user-install`
- `assimilate` -> `babysitter:assimilate`

Codex-native extensions:

- `babysitter:model`
- `babysitter:issue`

## Environment Mapping (Claude -> Codex)

Use these Codex env vars when adapting upstream instructions:

- `CLAUDE_SESSION_ID` -> `${CODEX_THREAD_ID:-$CODEX_SESSION_ID}`
- `CLAUDE_PLUGIN_ROOT` -> `${CODEX_PLUGIN_ROOT}`
- `--harness claude-code` -> `--harness codex`

Preferred Codex run binding:

- `run:create --harness codex --session-id <id> --state-dir .a5c`
- `session:associate` only as compatibility fallback

## Runtime Truths

- Primary user-facing activation is `babysitter <mode> ...`
- Legacy `/babysitter:*` forms are compatibility shims only
- Codex orchestration is supervisor-owned
- `notify` is monitoring only
- `.codex/plugin.json` is packaged metadata for this repo, not a native Codex hook manifest

## Runtime Discovery Mapping

`discovery.js` returns:

- `processLibraryRoot`
- `referenceRoot`
- `processLibrary` stats in compat-core mode

This ensures Codex runs can still locate the bundled upstream process library when advanced SDK discovery commands are unavailable.

## Lock + Integrity

- Team-pinned lock file: `babysitter.lock.json`
- Content integrity manifest: `config/content-manifest.json`
- Verify with: `npm run manifest:verify`
- Team bootstrap: `npm run team:install`
