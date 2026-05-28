---
description: Plan a babysitter run. use this command to plan a complex workflow, without actually running it.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Focus on creating the best process possible, but without creating and running the actual run.

Before drafting the process, run Phase 0 -- REUSE-AUDIT: extract keyword nouns and verbs from the request, scan for matching existing migrations, API routes, environment variables, SDK dependencies, and imports, honor `.a5c/reuse-audit.json` when present, and put a `Reuse-audit findings (REVIEW BEFORE PROCEEDING)` block before Phase 1 of the plan.

## Process Shape Selection

Choose the process shape before authoring `process.js`:

- Use a flat phase list when the spec is well-defined, the work is wiring or composition, the bug class is already known if this is a fix, and execution should proceed sequentially through clear phases.
- Use a HYPOTHESES tree when the bug class is unknown, forensics are required, multiple causal models compete, and each hypothesis needs its own observations, falsifying observations, and follow-up phases.
- Rule of thumb: if the first phase is "investigate", use HYPOTHESES-tree mode. If the first phase is "implement X", use flat-phase-list mode.
