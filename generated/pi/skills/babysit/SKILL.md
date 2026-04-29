---
name: babysit
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
PLUGIN_ROOT="${PI_PLUGIN_ROOT:-$(pwd)}"
SDK_VERSION=$(node -e "try{const fs=require('fs');const path=require('path');const pluginRoot=process.env.PI_PLUGIN_ROOT||process.env.PLUGIN_ROOT||process.cwd();const probes=[path.join(pluginRoot,'versions.json'),path.join(pluginRoot,'plugins','babysitter-pi','versions.json'),path.join(pluginRoot,'node_modules','@a5c-ai','babysitter-pi','versions.json'),path.join(process.cwd(),'node_modules','@a5c-ai','babysitter-pi','versions.json')];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

## Instructions

Run the following command to get full orchestration instructions:

```bash
babysitter instructions:babysit-skill --harness pi --interactive
```

For non-interactive mode:

```bash
babysitter instructions:babysit-skill --harness pi --no-interactive
```

Follow the instructions returned by the command above to orchestrate the run.
