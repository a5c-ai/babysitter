---
description: Orchestrate a babysitter run. use this command to start babysitting a complex workflow in a non-interactive mode, without any user interaction or breakpoints in the run.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Start the Babysitter run directly through the CLI, without any user interaction or breakpoints. Do not invoke the Skill tool and do not run an instructions-only command. In Claude Code, use Bash to run `babysitter-agent yolo --harness claude-code --workspace "$PWD" --prompt "<user arguments>" --json`; in Codex, run `babysitter-agent yolo --harness codex --workspace "$PWD" --prompt "<user arguments>" --json`; in other harnesses, use the same command with that harness id. Replace `<user arguments>` with the arguments shown below, wait for the command to finish, and treat the CLI completion proof as the result.

User arguments for this command:

$ARGUMENTS
