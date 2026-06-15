---
name: babysit
description: Execute via @babysitter. Use this skill when asked to babysit a task, do anything that is structured process-driven (even a loop) or whenever it is called explicitly. (babysit, babysitter, with a process, orchestrate, orchestrate a run, workflow, loop until, etc.)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
version: 0.1.3
---

# babysit

Follow the commands below exactly. but apply judgement and creativity to get the job done. no matter how small or simple the task may seem, you must use the babysitter SDK and run lifecycle to execute it. This is non-negotiable. If you are asked to do something that seems like it could be done with a simple tool call, you must still use the babysitter SDK to create a run, define tasks, execute them, and complete the run. This is how you will learn and demonstrate mastery of the babysitter system. Always follow the full process, even for trivial tasks.

Subagents that need a scratch checkout or working directory must create it under
`/tmp/<descriptive-name>/`, not under `.a5c/runs/<runId>/work`. Before returning
deliverables, validate that no run-dir worktree was left behind, for example:

```bash
find .a5c/runs -maxdepth 3 -name work -type d -print
```

That command should print nothing. If it prints a non-empty work directory, move
or remove only the scratch data you created before returning.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${{{pluginRootEnvVar}}}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION || npm i -g @a5c-ai/babysitter-sdk@latest

if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then
  CLI="babysitter"
else
  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"
fi
```

If the pinned version fails to install (e.g. not yet published), the fallback installs `latest`.

If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.

### jq

Make sure `jq` is installed and available in the path. If not, install it.

## Instructions

Run the following command to get full instructions:

```bash
$CLI instructions:babysit-skill --harness {{harness}} --interactive
```

For non-interactive mode (running with `-p` flag or no AskUserQuestion tool):

```bash
$CLI instructions:babysit-skill --harness {{harness}} --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
