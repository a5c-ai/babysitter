---
name: babysit
description: >-
  Execute via @babysitter. Use this skill when asked to babysit a task, do anything that is structured process-driven (even a loop) or whenever it is called explicitly. (babysit, babysitter, with a process, orchestrate, orchestrate a run, workflow, loop until, etc.)
---

# babysit

Follow the commands below exactly. but apply judgement and creativity to get the job done. no matter how small or simple the task may seem, you must use the babysitter SDK and run lifecycle to execute it. This is non-negotiable. If you are asked to do something that seems like it could be done with a simple tool call, you must still use the babysitter SDK to create a run, define tasks, execute them, and complete the run. This is how you will learn and demonstrate mastery of the babysitter system. Always follow the full process, even for trivial tasks.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{const fs=require('fs');const probes=['./plugins/babysitter-unified/versions.json','./node_modules/@a5c-ai/babysitter-opencode/versions.json'];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")

npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then
  CLI="babysitter"
else
  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"
fi
```

If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.

## Instructions

Run the following command to get full orchestration instructions:

```bash
$CLI instructions:babysit-skill --harness opencode --interactive
```

For non-interactive mode:

```bash
$CLI instructions:babysit-skill --harness opencode --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
