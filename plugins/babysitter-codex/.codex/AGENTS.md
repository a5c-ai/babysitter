# Project-Scoped Agent Instructions

These instructions supplement the root `AGENTS.md` with Codex-specific rules for
the bundled `babysitter-codex` runtime.

## Real Codex Surfaces

- Installed skills under `~/.codex/skills/babysitter-codex`
- `AGENTS.md`
- project `.codex/config.toml`
- optional `notify`

Codex does not provide native blocking `SessionStart` or `Stop` hooks for this
package. The shell files in `.codex/hooks/*.sh` are compatibility stubs only.

## Session Binding

- Use a session ID only when it is explicitly available from:
  - `BABYSITTER_SESSION_ID`
  - `CODEX_THREAD_ID`
  - `CODEX_SESSION_ID`
- Never fabricate a session ID just to call `session:init`.
- If no real session ID exists, continue in compat-core mode without session
  binding.

## Installed Skill Layout

The installed skill must be self-contained. Required payload at
`~/.codex/skills/babysitter-codex/`:

- `SKILL.md`
- `AGENTS.md`
- `.codex/`
- `agents/`
- `bin/`
- `commands/`
- `scripts/`
- `babysitter.lock.json`

## Team Install Contract

- `scripts/team-install.js` resolves the package root from its own installed
  location, not from repo `cwd`.
- They write workspace state only under `<workspace>/.a5c/team/`.
- Generated profile paths may point back to the installed skill root for hook
  assets and skill metadata.

## Result Posting

- Write successful task payloads to `tasks/<effectId>/output.json`.
- Post results with `babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json --json`.
- Post errors with `--status error --error tasks/<effectId>/error.json --json`.
- Never write `result.json` directly.
