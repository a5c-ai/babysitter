---
description: Resume orchestrating of a babysitter run. use this command to resume babysitting a complex workflow.
argument-hint: Specific run to resume
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). to resume a run.
if no run was given, discover the runs and suggest which incomplete run to resume based on the run's status, inputs, process , etc.
