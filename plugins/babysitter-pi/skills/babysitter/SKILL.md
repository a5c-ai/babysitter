---
name: babysitter
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from the plugin manifest to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PI_PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
sudo npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
# sudo is depending on the env and system
```

then use the CLI alias: CLI="babysitter"

**Alternatively, use the CLI alias:** `CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"`

### jq

make sure you have jq installed and available in the path. if not, install it.

## Instructions

Run the following command to get full orchestration instructions:

```bash
babysitter instructions:babysit-skill --harness pi --interactive
```

For non-interactive mode (running with `-p` flag or no AskUserQuestion tool):

```bash
babysitter instructions:babysit-skill --harness pi --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
