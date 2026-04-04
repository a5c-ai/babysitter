---
name: babysitter
description: Orchestrate complex multi-step tasks with deterministic, event-sourced process execution using Babysitter. Use when asked to babysit, orchestrate a run, or manage a multi-phase workflow.
command: /babysitter
verified: true
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{const fs=require('fs');const probes=['./plugins/babysitter-opencode/versions.json','./node_modules/@a5c-ai/babysitter-opencode/versions.json'];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

## Instructions

Run the following command to get full orchestration instructions:

```bash
babysitter instructions:babysit-skill --harness opencode --interactive
```

For non-interactive mode:

```bash
babysitter instructions:babysit-skill --harness opencode --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
