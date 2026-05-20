---
name: babysit
description: Execute via @babysitter. Use this skill when asked to babysit a task, do anything that is structured process-driven (even a loop) or whenever it is called explicitly. (babysit, babysitter, with a process, orchestrate, orchestrate a run, workflow, loop until, etc.)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
version: 0.1.3
---

# babysit

Follow the commands below exactly. but apply judgement and creativity to get the job done. no matter how small or simple the task may seem, you must use the babysitter SDK and run lifecycle to execute it. This is non-negotiable. If you are asked to do something that seems like it could be done with a simple tool call, you must still use the babysitter SDK to create a run, define tasks, execute them, and complete the run. This is how you will learn and demonstrate mastery of the babysitter system. Always follow the full process, even for trivial tasks.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${CLAUDE_PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION

CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

If `babysitter` is already installed globally at the correct version, you may use `CLI="babysitter"` instead.

### jq

Make sure `jq` is installed and available in the path. If not, install it.

## Instructions

Run the following command to get full instructions:

```bash
$CLI instructions:babysit-skill --harness claude-code --interactive
```

For non-interactive mode (running with `-p` flag or no AskUserQuestion tool):

```bash
$CLI instructions:babysit-skill --harness claude-code --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
