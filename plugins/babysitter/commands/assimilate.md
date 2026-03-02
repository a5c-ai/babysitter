---
description: Assimilate an external methodology, harness, or specification into babysitter process definitions with skills and agents.
argument-hint: Target to assimilate (e.g. repo URL, harness name, or spec path)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, BashOutput, Skill, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

Use the assimilation domain processes to convert external sources into well-defined babysitter process definitions with accompanying skills/ and agents/ directories.

Available assimilation workflows:
- **methodology-assimilation** (`plugins/babysitter/skills/babysit/process/specializations/domains/assimilation/workflows/methodology-assimilation.js`) — Learns an external methodology from its repo and converts procedural instructions, commands, and manual flows into babysitter processes with refactored skills and agents. Supports output as methodology or specialization.
- **harness integration** (`plugins/babysitter/skills/babysit/process/specializations/domains/assimilation/harness/`) — Integrates babysitter SDK with a specific AI coding harness (generic, codex, opencode, gemini-cli, openclaw, antigravity).

During the interview phase, determine which assimilation workflow to use based on the user's target:
- If the target is a **repo URL or methodology name** → use the methodology-assimilation workflow
- If the target is a **harness name** (e.g. codex, opencode, antigravity) → use the matching harness process
- If the target is a **specification or other source** → adapt the methodology-assimilation workflow for the spec format
- If unclear, ask the user to clarify the assimilation target and type
