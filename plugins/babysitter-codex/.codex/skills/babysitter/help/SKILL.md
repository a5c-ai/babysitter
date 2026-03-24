---
name: babysitter:help
description: Help and documentation for babysitter on Codex.
argument-hint: "[command|process|skill|agent|methodology] topic to get help on"
---

# babysitter:help

Babysitter for Codex uses skills, AGENTS guidance, project config, and
workspace lifecycle hooks so Codex stays in the orchestration loop.

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
  - project .codex/hooks.json (SessionStart, UserPromptSubmit, Stop)
  - optional notify monitoring

Hook model responsibilities:
  - SessionStart: seed session state
  - UserPromptSubmit: prompt-level transforms
  - Stop: continue or approve exit after each yielded turn
```

## With Arguments

If an argument is provided:

1. Command help: read the relevant `.codex/skills/babysitter/<name>/SKILL.md`
2. Process help: inspect the process file and summarize it
3. Skill and agent help: use discovery helpers or `babysitter skill:discover`
4. Methodology help: search the upstream process library

Legacy `/babysitter:*` aliases may be mentioned only as optional compatibility
shims, not as native Codex commands.
