# Codex Mapping

This document describes the active Codex-facing mapping for Babysitter.
It is an operator and maintainer reference, not the primary end-user entry
point. End-user docs should stay on the `babysitter ...` command surface.

## Source Of Truth

- Codex mapping manifest: `config/codex-command-map.json`
- Codex skill/runtime payload in this package
- Active process roots discovered at runtime

The bundled upstream snapshot under `upstream/` is reference content. It is not
the primary runtime contract for Codex.

Codex’s documented extension surfaces are skills, `AGENTS.md`, `config.toml`,
MCP servers, and SDK or CLI entry points. This package should therefore be
modeled as a Codex skill bundle and integration layer, not as a native Codex
plugin.

## Active Process-Root Mapping

Codex-facing docs and skills should treat process discovery as layered:

1. `.a5c/processes` in the current workspace
2. Repo-local Babysitter plugin roots when present
3. Installed Codex skill roots under `~/.codex/skills/...`
4. Bundled upstream snapshot for fallback/reference

`project-install` and `team-install` may pin content and rules, but they should
not be documented as creating exclusive project/team process-library scopes.

## Command Mapping

Upstream command docs are adapted to Codex command phrases:

- `call` -> `babysitter call`
- `yolo` -> `babysitter yolo`
- `resume` -> `babysitter resume`
- `plan` -> `babysitter plan`
- `forever` -> `babysitter forever`
- `doctor` -> `babysitter doctor`
- `observe` -> `babysitter observe`
- `retrospect` -> `babysitter retrospect`
- `help` -> `babysitter help`
- `project-install` -> `babysitter project-install`
- `team-install` -> `babysitter team-install`
- `user-install` -> `babysitter user-install`
- `assimilate` -> `babysitter assimilate`

Codex-native additions:

- `babysitter model`
- `babysitter issue`

`/babysitter:*` forms are compatibility shims only. Primary docs should prefer
plain command phrases.

## Harness Mapping

When adapting Claude-oriented instructions for Codex:

- `--harness claude-code` -> `--harness codex`
- `CLAUDE_PLUGIN_ROOT` -> Codex skill root / packaged payload root
- blocking stop-hook ownership -> supervisor-owned turn controller

User-facing Codex docs should speak in terms of `babysitter call`, `resume`,
`doctor`, and other command phrases. The exact runtime binding and result
posting mechanics belong in the Codex skill docs, command implementation docs,
and maintainer runbook.

## Orchestration Contract

Codex docs should preserve these rules:

- one orchestration phase per supervisor turn
- let the harness-owned runtime helpers manage result posting and binding
- complete only when the emitted `completionProof` is echoed in
  `<promise>...</promise>`

Current generated-process guidance:

- prefer `agent` and `skill`
- allow `shell`, `breakpoint`, and `sleep` where needed
- do not present `node` as an active generated effect kind

## Compatibility Notes

- `notify` is observability only; it does not own continuation
- `.codex/command-catalog.json` is the canonical packaged command catalog for this skill bundle
- `.codex/plugin.json` is a compatibility alias for older Babysitter internals, not a native Codex hook manifest
- compat-core mode may omit advanced SDK commands, but the core run/task
  contract remains the same

## Integrity And Locking

- Team-pinned lock file: `babysitter.lock.json`
- Content manifest: `config/content-manifest.json`
- Verify with: `npm run manifest:verify`
