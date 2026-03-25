# Install Guide

`babysitter-codex` installation has two layers:

1. Install the global Codex skill payload into `~/.codex/skills/babysitter-codex`
2. Materialize Codex hook/config wiring for the active workspace

When you run `npm install -g @a5c-ai/babysitter-codex` from inside the target
workspace, the postinstall now uses `INIT_CWD` to auto-apply the workspace
hook/config wiring. If you install from somewhere else, use
`babysitter harness:install-plugin codex --workspace <dir>` or the packaged
`team-install` helper afterwards.

## 1. Global Skill Install

From npm:

```bash
npm install -g @a5c-ai/babysitter-codex
```

From a local clone:

```bash
cd /path/to/babysitter-codex
npm install -g .
```

## 2. Verify The Installed Payload

The installed skill root should include:

- `SKILL.md`
- `AGENTS.md`
- `.codex/`
- `commands/`
- `config/`
- `docs/`
- `scripts/`
- `upstream/`
- `babysitter.lock.json`
- `.codex/hooks.json`
- `.codex/hooks/babysitter-stop-hook.sh`

Checks:

```bash
ls -1 ~/.codex/skills/babysitter-codex
test -f ~/.codex/skills/babysitter-codex/scripts/team-install.js
test -f ~/.codex/skills/babysitter-codex/.codex/hooks.json
test -f ~/.codex/skills/babysitter-codex/.codex/hooks/babysitter-stop-hook.sh
```

PowerShell:

```powershell
Get-ChildItem "$HOME/.codex/skills/babysitter-codex" | Select-Object Name
Test-Path "$HOME/.codex/skills/babysitter-codex/scripts/team-install.js"
Test-Path "$HOME/.codex/skills/babysitter-codex/.codex/hooks.json"
Test-Path "$HOME/.codex/skills/babysitter-codex/.codex/hooks/babysitter-stop-hook.sh"
```

The installer also merges `~/.codex/config.toml` so `features.codex_hooks = true`
is present for the local Codex install.

## 3. Active Process Roots After Install

After install, Codex-facing docs and processes should prefer:

1. `.a5c/processes` in the current workspace
2. Repo-local Babysitter plugin roots when present
3. Installed skill/process roots under `~/.codex/skills/...`
4. Bundled upstream snapshot under `upstream/` only as fallback/reference

Do not document the bundled upstream snapshot as the primary library root.

## 4. Workspace Hook Onboarding

If the global install was not launched from the target workspace, materialize
the workspace-local `.codex/hooks.json` and `.codex/config.toml` after install:

```bash
npm install -g @a5c-ai/babysitter-sdk
babysitter harness:install-plugin codex --workspace /path/to/repo
```

`babysitter harness:install-plugin ...` is provided by the Babysitter SDK CLI,
so `@a5c-ai/babysitter-sdk` must already be installed.

Equivalent packaged helper:

```text
babysitter team-install
babysitter project-install for this repository
```

This setup:

- verifies the packaged content manifest
- reads `babysitter.lock.json`
- writes workspace-facing install/profile metadata
- writes workspace `.codex/config.toml` and `.codex/hooks.json` for the real
  Codex hook model
- prepares the repo for Codex-facing Babysitter usage

This onboarding layers pinned configuration and install metadata. It does not
move process discovery into a team-only or project-only library root.

## 5. First Run Expectations

Use the Codex command phrases after install:

```text
babysitter help
babysitter call implement authentication with tests
babysitter resume recent
babysitter doctor
```

The user-facing contract is:

- start and resume work from the Codex command surface
- let the installed hook assets handle the runtime loop and persisted state
- expect one orchestration phase per yielded turn
- expect completion only when the run emits a `completionProof`

Low-level hook commands, result-posting, and SDK command details are internal
to the Codex harness. They live in the Codex skill and maintainer docs, not in
this install guide.
