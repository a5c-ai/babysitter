---
name: babysitter-codex
description: >-
  Run babysitter workflows from Codex using the installed skill bundle,
  workspace Codex hooks, workspace Codex config, and the Babysitter SDK runtime
  loop.
  Use when the user wants to babysit a task, resume a run, diagnose run health,
  install the Codex skill, or assimilate a methodology for Codex.
---

# Babysitter for Codex CLI

Babysitter on Codex is implemented as:

- the installed skill bundle under `~/.codex/skills/babysitter-codex`
- workspace `.codex/hooks.json`
- workspace `.codex/config.toml`
- workspace `.a5c/`
- the Babysitter SDK CLI for `run:create`, `run:iterate`, `run:status`,
  `task:list`, `task:post`, and process-library binding

This package supports only the hooks model for the Codex plugin path. Do not
introduce an app-server loop, an external orchestrator, or fake plugin-manifest
machinery for the Codex integration.

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

## Runtime Contract

Use the Babysitter SDK CLI for orchestration:

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

## Hook Loop

Workspace onboarding must install `.codex/hooks.json` and `.codex/config.toml`
so:

1. `SessionStart` seeds `.a5c` session state
2. `UserPromptSubmit` performs prompt-time transformations when needed
3. `Stop` decides whether the run is complete or Codex should receive the next
   Babysitter iteration context

## Process Library Model

The Codex package does not bundle the process library.

Workspace onboarding must:

1. clone or update the upstream Babysitter repo into
   `.a5c/process-library/babysitter-repo`
2. bind `.a5c/process-library/babysitter-repo/library` with
   `babysitter process-library:use`
3. resolve the active binding later with
   `babysitter process-library:active --state-dir .a5c --json`

Preferred discovery order:

1. project-local `.a5c/processes`
2. the active SDK-managed process-library binding

## Codex-Specific Rules

- Prefer natural-language activation such as `babysitter call ...`
- Legacy `/babysitter:*` aliases may exist only as optional user-installed
  prompt sugar; they are not a native Codex plugin feature
- Never fabricate a session ID when none is available from Codex or the caller
- Use `notify` only for monitoring and telemetry, never as the orchestration
  control loop
