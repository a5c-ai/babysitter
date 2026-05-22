---
description: Use this command to start babysitting a never-ending babysitter run.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). but create a process that uses an infinte loop and a ctx.sleep to create a never-ending babysitter loop. an example of such process is a daily process that reads new support ticket every day and tries to resolve them, then sleeps for 4 hours and repeats the process. 