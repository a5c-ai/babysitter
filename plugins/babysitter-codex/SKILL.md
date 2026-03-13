---
name: babysitter-codex
description: >-
  Orchestrate complex, multi-step AI workflows with quality convergence loops,
  event-sourced state, and human-in-the-loop approval gates. Use when the user
  wants to babysit a task, orchestrate a workflow, run quality-gated development,
  resume a previous orchestration run, diagnose run health, plan without executing,
  set up a project or user profile for babysitter, or assimilate an external
  methodology. Also use when the user mentions "babysitter", "orchestrate",
  "babysit", "quality loop", or "convergence loop".
---

# Babysitter for Codex CLI

Orchestrate complex, multi-step workflows with event-sourced state management,
hook-based extensibility, and human-in-the-loop approval gates.

## Choosing a Mode

Based on the user's request, read the appropriate sub-skill from
`.codex/skills/babysitter/<mode>/SKILL.md` (relative to this skill's install
directory) and follow its instructions.

| User intent | Mode | Sub-skill to read |
|-------------|------|-------------------|
| Start an orchestration run (default) | call | `call/SKILL.md` |
| Run autonomously, no interaction | yolo | `yolo/SKILL.md` |
| Resume an existing run | resume | `resume/SKILL.md` |
| Plan a workflow without executing | plan | `plan/SKILL.md` |
| Start a never-ending periodic run | forever | `forever/SKILL.md` |
| Diagnose run health | doctor | `doctor/SKILL.md` |
| Launch observer dashboard | observe | `observe/SKILL.md` |
| Analyze previous run improvements | retrospect | `retrospect/SKILL.md` |
| Set or view model routing policy | model | `model/SKILL.md` |
| Work directly from a GitHub issue | issue | `issue/SKILL.md` |
| Help and documentation | help | `help/SKILL.md` |
| Onboard a project | project-install | `project-install/SKILL.md` |
| Install team-pinned setup | team-install | `team-install/SKILL.md` |
| Set up user profile | user-install | `user-install/SKILL.md` |
| Assimilate external methodology | assimilate | `assimilate/SKILL.md` |

If unclear, default to `call/SKILL.md`.

## SDK CLI Quick Reference

The babysitter SDK CLI (`babysitter` or `npx @a5c-ai/babysitter-sdk`) drives
all orchestration:

```
babysitter run:create   --process-id <id> --entry <path>#<export> ...
babysitter run:iterate  <runDir> --json --iteration <n>
babysitter run:status   <runDir> --json
babysitter task:list    <runDir> --pending --json
babysitter task:post    <runDir> <effectId> --status ok --value <file> --json
```

Compatibility levels:

- Core required: `run:create`, `run:iterate`, `run:status`, `task:list`, `task:post`
- Optional advanced: `session:*`, `profile:*`, `skill:*`, `health`

If advanced commands are missing, continue in `compat-core` mode and do not
block orchestration.

### Canonical argument shapes (current Babysitter SDK)

- `run:status <runDir> --json`
- `task:list <runDir> --json`
- `session:init --session-id <id> --state-dir .a5c --json`
- `session:associate --session-id <id> --state-dir .a5c --run-id <runId> --json`
- `hook:log --hook-type <type> --log-file .a5c/logs/hooks.jsonl --json`

## Result Posting Protocol

1. Write result value to `tasks/<effectId>/output.json`
2. Post: `babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json`
3. Never write `result.json` directly -- the SDK owns that file.

## Hook-Driven Loop

After each effect is posted, stop the session. The stop hook re-invokes
Codex to continue the next iteration. Do not loop within a single session.
