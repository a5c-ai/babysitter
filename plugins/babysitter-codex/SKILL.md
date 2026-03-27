---
name: babysit
description: >-
  Run babysitter workflows from Codex using the installed babysit skill bundle,
  workspace Codex hooks, workspace Codex config, and the Babysitter SDK runtime
  loop.
  Use when the user wants to babysit a task, resume a run, diagnose run health,
  install the Codex skill, or assimilate a methodology for Codex.
---

# Babysitter for Codex CLI

Babysitter on Codex is implemented as:

- the installed skill bundle under `~/.codex/skills/babysit` or `.codex/skills/babysit`
- global `~/.codex/hooks.json` and `~/.codex/hooks/`
- global `~/.codex/config.toml`
- optional workspace `.codex/hooks.json` and `.codex/hooks/`
- optional workspace `.codex/config.toml`
- workspace `.a5c/`
- shared global `.a5c/` process-library state
- the Babysitter SDK CLI for `run:create`, `run:iterate`, `run:status`,
  `task:list`, `task:post`, and process-library binding

This package supports only the hooks model for the Codex plugin path. Do not
introduce an app-server loop, an external orchestrator, or fake plugin-manifest
machinery for the Codex integration.

## Choosing a Mode

Use this single skill for all Babysitter Codex flows.

Choose the mode from either:

1. the direct user intent when the skill is invoked as `$babysit`
2. the installed prompt alias name when the user invoked `/call`, `/plan`,
   `/resume`, `/yolo`, and the rest

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

Global install must materialize `~/.codex/hooks.json`, `~/.codex/hooks/`, and
`~/.codex/config.toml`.

Workspace onboarding may also materialize `.codex/hooks.json`,
`.codex/hooks/`, and `.codex/config.toml` for repo-local pinning.

Both levels must provide:

1. `SessionStart` seeds `.a5c` session state
2. `UserPromptSubmit` performs prompt-time transformations when needed
3. `Stop` decides whether the run is complete or Codex should receive the next
   Babysitter iteration context

## Process Library Model

The Codex package does not bundle the process library.

The shared SDK-managed process library lives in the global Babysitter state dir
(`$BABYSITTER_GLOBAL_STATE_DIR` when set, otherwise `~/.a5c`), not per repo.
First use must rely on `babysitter process-library:active --json`, which
auto-clones and binds the default library if no active binding exists yet.

Read:

- `binding.dir` as the active process-library root that must be searched before
  authoring a process
- `defaultSpec.cloneDir` as the cloned repo root when adjacent library material
  is needed

Do not skip the active-library search step during process authoring.

Workspace onboarding and runtime flows must:

1. resolve the active shared binding with `babysitter process-library:active --json`
2. use the returned `binding.dir` as the active library root
3. only consult `defaultSpec.cloneDir` when adjacent repo-level material is
   needed beyond the active root itself

Preferred discovery order:

1. project-local `.a5c/processes`
2. the active SDK-managed process-library binding from `binding.dir`
3. the cloned process-library repo root from `defaultSpec.cloneDir` when
   adjacent reference material is needed

## Codex-Specific Rules

- Prefer invoking the skill directly with `$babysit`
- Optional user-local prompt aliases such as `/call`, `/plan`, `/resume`, and
  `/yolo` may exist, but they should only forward into the `babysit` skill for
  the matching mode; they are not the primary integration surface
- Do not depend on nested mode skills under `.codex/skills/babysit/*`; the
  installed Codex skill is the single `babysit` skill
- Never fabricate a session ID when none is available from Codex or the caller
- Use `notify` only for monitoring and telemetry, never as the orchestration
  control loop
