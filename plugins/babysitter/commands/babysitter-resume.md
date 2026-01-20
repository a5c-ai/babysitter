---
description: "Start babysitter run in current session"
argument-hint: "PROMPT [--max-iterations N] [--completion-promise TEXT]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-babysitter-run.sh:*)"]
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/state/*:*)"]
hide-from-slash-command-tool: "true"
---

# Babysitter Resume Run Command

Use the Babysitter Skill to resume a run.

Execute the setup script to resume the Babysitter run:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-babysitter-run-resume.sh" $ARGUMENTS
```

## Architecture Overview

This command integrates with the **hook-driven orchestration system**:

1. **setup-babysitter-run-resume.sh** verifies run exists and initializes loop state
2. **babysitter-stop-hook.sh** (on-stop hook) prevents exit and continues the loop
3. **run:iterate** CLI command drives each orchestration step (called by hooks)
4. **on-iteration-start hook** executes tasks (via native-orchestrator.sh)
5. Loop continues until completion promise or max iterations

## Key Principles

- **Hooks execute** - All task execution happens in hooks (not in skill)
- **CLI iterates** - run:iterate provides single iteration orchestration
- **Skill loops** - The babysitter skill provides the external loop via stop hook
- **Event-sourced** - All state changes recorded in journal.jsonl

## Resuming a Run

When resuming a run:
1. Provide the run ID (e.g., run-20260119-example)
2. The CLI will check current run state using `run:status`
3. Resume orchestration from where it left off
4. Access previous work via journal, state.json, task results, files, and git history

## How It Works

When you work on the resumed task and try to exit:
1. Stop hook intercepts the exit attempt
2. Hook checks completion conditions (promise, max iterations)
3. If not complete, hook feeds prompt back to continue
4. You'll see all previous iterations in journal and state
5. Continue iterating and improving until completion

CRITICAL RULE: If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to escape the run, even if you think you're stuck or should exit for other reasons. The run is designed to continue until genuine completion.