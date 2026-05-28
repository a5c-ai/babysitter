---
name: babysit
description: >-
  Orchestrate via @babysitter. Use this skill when asked to babysit a run,
  orchestrate a process or whenever it is called explicitly. (babysit,
  babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

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
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${CODEX_PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
```

Use an installed `babysitter` command only after proving it can execute:

```bash
if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then
  CLI="babysitter"
else
  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"
fi
```

If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.

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
