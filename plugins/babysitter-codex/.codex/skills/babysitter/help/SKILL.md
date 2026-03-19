---
name: babysitter:help
description: Help and documentation for babysitter on Codex.
argument-hint: "[command|process|skill|agent|methodology] topic to get help on"
---

# babysitter:help

Babysitter for Codex uses skills, AGENTS guidance, project config, and an
external orchestration supervisor.

## No Arguments

Show a short summary using normal-language activation examples:

```text
Babysitter for Codex

Primary examples:
  babysitter call build auth with tests
  babysitter resume recent
  babysitter yolo fix lint and failing tests
  babysitter plan a migration workflow
  babysitter doctor current run

Codex-native surfaces:
  - skills
  - AGENTS.md guidance
  - project .codex/config.toml
  - optional notify monitoring

External-supervisor responsibilities:
  - run:create / run:iterate / task:post
  - breakpoint collection
  - explicit resume and yield behavior
```

## With Arguments

If an argument is provided:

1. Command help: read the relevant `.codex/skills/babysitter/<name>/SKILL.md`
2. Process help: inspect the process file and summarize it
3. Skill/agent help: use discovery helpers or `babysitter skill:discover`
4. Methodology help: search the upstream process library

Legacy `/babysitter:*` aliases may be mentioned only as optional compatibility
shims, not as native Codex commands.
