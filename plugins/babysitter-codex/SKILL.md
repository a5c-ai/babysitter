---
name: babysitter-codex
description: >-
  Run babysitter workflows from Codex using real Codex surfaces: skills,
  AGENTS.md guidance, project config, and the Babysitter SDK runtime loop.
  Use when the user wants to babysit a task, resume a run, diagnose run health,
  install the Codex skill, or assimilate a methodology for Codex.
---

# Babysitter for Codex CLI

Babysitter on Codex is implemented as:

- Codex-facing instructions and skills
- A `.a5c` state directory in the target workspace
- The packaged `babysitter-codex-turn` helper for one-turn create/continue/post/approve control
- The Babysitter SDK run/task loop that owns `run:create`, `run:iterate`,
  `task:post`, breakpoint handling, and resume behavior
- Optional `notify` monitoring after Codex turns complete

Codex does **not** provide Claude-style blocking `SessionStart` or `Stop`
hooks. Do not claim or depend on them.
Codex also does not expose a native installable plugin manifest for this
package. Treat `.codex/command-catalog.json` as Babysitter compatibility
metadata for the skill bundle, not as a Codex platform feature.

## Choosing a Mode

Read the matching sub-skill from `.codex/skills/babysitter/<mode>/SKILL.md`.
If the user intent is unclear, default to `call/SKILL.md`.

| User intent | Mode |
|-------------|------|
| Start an orchestration run | `call` |
| Run autonomously | `yolo` |
| Resume an existing run | `resume` |
| Plan without executing | `plan` |
| Diagnose run health | `doctor` |
| Help and documentation | `help` |
| Install into a project | `project-install` |
| Install user profile/setup | `user-install` |
| Install team-pinned setup | `team-install` |
| Assimilate external methodology | `assimilate` |

## Internal Runtime Contract

Use the babysitter SDK CLI for orchestration:

```bash
babysitter run:create   --process-id <id> --entry <path>#<export> ...
babysitter run:iterate  <runDir> --json --iteration <n>
babysitter run:status   <runDir> --json
babysitter task:list    <runDir> --pending --json
babysitter task:post    <runDir> <effectId> --status ok --value <file> --json
```

When a Codex session ID is available, bind it honestly:

```bash
babysitter run:create ... --harness codex --session-id <id> --state-dir .a5c --json
```

## Result Posting Protocol

1. Write the result value to `tasks/<effectId>/output.json`
2. Post it with `babysitter task:post`
3. Never write `result.json` directly

## Codex Turn Loop

Use the packaged turn helper when Codex needs to advance or answer a run
outside the SDK itself:

```bash
babysitter-codex-turn start|continue|post|approve|status ...
```

This keeps Codex in the user-facing loop one chat turn at a time without
pretending native stop hooks exist.

## Codex-Specific Rules

- Prefer natural-language activation such as `babysitter call ...`
- Legacy `/babysitter:*` aliases may exist only as optional user-installed
  prompt sugar; they are not a native Codex plugin feature
- Never fabricate a session ID when none is available from Codex or the caller
- Use `notify` only for monitoring and telemetry, never as the orchestration
  control loop
