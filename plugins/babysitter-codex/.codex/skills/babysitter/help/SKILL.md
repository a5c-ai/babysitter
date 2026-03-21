---
name: babysitter:help
description: Help and documentation for babysitter on Codex.
argument-hint: "[command|process|skill|agent|methodology] topic to get help on"
---

# babysitter:help

Babysitter for Codex uses skills, AGENTS guidance, project config, and an
explicit turn-state helper so Codex itself owns the user-facing orchestration
loop.

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

Turn-state helper responsibilities:
  - persist the active run in .a5c/current-run.json
  - advance exactly one orchestration step per Codex turn
  - classify the next action as execute / yield / complete / fail
  - post explicit breakpoint approvals and task outputs
```

## With Arguments

If an argument is provided:

1. Command help: read the relevant `.codex/skills/babysitter/<name>/SKILL.md`
2. Process help: inspect the process file and summarize it
3. Skill and agent help: use discovery helpers or `babysitter skill:discover`
4. Methodology help: search the upstream process library

Legacy `/babysitter:*` aliases may be mentioned only as optional compatibility
shims, not as native Codex commands. For shell execution, prefer the packaged
`babysitter-codex-turn` helper over repo-local `.codex/*.js` paths.
