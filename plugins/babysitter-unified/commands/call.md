---
description: Orchestrate a babysitter run. use this command to start babysitting a complex workflow.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Then continue executing the returned instructions in this same turn. Do not stop after the Skill tool returns; carry the requested run through to completion proof.

User arguments for this command:

$ARGUMENTS
