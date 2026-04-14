---
name: babysit
description: >-
  Orchestrate via @babysitter. Use this skill when asked to babysit a run,
  orchestrate a process or whenever it is called explicitly. (babysit,
  babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${CODEX_PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION

CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

If `babysitter` is already installed globally at the correct version, you may use `CLI="babysitter"` instead.

### jq

Make sure `jq` is installed and available in the path. If not, install it.

## Instructions

Run the following command to get full orchestration instructions:

```bash
$CLI instructions:babysit-skill --harness codex --interactive
```

For non-interactive runs (e.g., with `-p` flag or no question tool):

```bash
$CLI instructions:babysit-skill --harness codex --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
