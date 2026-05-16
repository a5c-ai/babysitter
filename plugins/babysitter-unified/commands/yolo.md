---
description: Orchestrate a babysitter run. use this command to start babysitting a complex workflow in a non-interactive mode, without any user interaction or breakpoints in the run.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Run the Babysitter orchestration instructions directly through the CLI, without any user interaction or breakpoints. In Claude Code, use Bash to run `babysitter instructions:babysit-skill --harness claude-code --no-interactive`; in Codex, run `babysitter instructions:babysit-skill --harness codex --no-interactive`; in other harnesses, use the same command with that harness id. Then follow the returned instructions in this same turn until completion proof is produced. Do not stop after reading the instructions, do not invoke the Skill tool first, and use the non-interactive/no-breakpoints path when the instructions offer a mode choice.

User arguments for this command:

$ARGUMENTS
