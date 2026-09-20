# @a5c-ai/babysitter-omp

Babysitter package for `oh-my-pi`.

This oh-my-pi package combines native skill entrypoints with a deterministic
Babysitter effects driver:

- `skills/` exposes Babysitter workflows through oh-my-pi's skill system
- `extensions/index.ts` binds real oh-my-pi sessions and registers the driver
- `extensions/driver.ts` checkpoints, executes, posts, and continues effects
- `agents/babysitter-task.md` owns one blocking native task dispatch per agent effect

## Installation

Install the Babysitter CLI once when using the SDK helper:

```bash
npm install -g @a5c-ai/babysitter
```

Recommended for automation:

```bash
# Global install
babysitter harness:install-plugin oh-my-pi

# Workspace install
babysitter harness:install-plugin oh-my-pi --workspace /path/to/repo
```

Native oh-my-pi plugin install:

```bash
omp plugin install @a5c-ai/babysitter-omp
```

Verify the plugin is available:

```bash
babysitter harness:discover --json
```

Published package installer:

```bash
npx --yes @a5c-ai/babysitter-omp install --global
npx --yes @a5c-ai/babysitter-omp install --workspace /path/to/repo
```

Removal:

```bash
omp plugin uninstall @a5c-ai/babysitter-omp
```

## Using Babysitter

Start oh-my-pi, then use one of the Babysitter entrypoints:

- `/babysit` or `/babysitter`
- `/call`
- `/plan`
- `/resume`
- `/doctor`
- `/yolo`

Each command forwards into oh-my-pi's native `/skill:<name>` flow. After a skill
creates or resumes a run, call `babysitter_drive` with its absolute run
directory. For an `agent` result, dispatch the returned one-item payload through
oh-my-pi's native `task` tool exactly once; the extension retains ownership,
posts the durable result, and returns the deterministic continuation.

Native oh-my-pi todos are ordinary session planning state. They are distinct
from Babysitter process effects and are never intercepted or rewritten.
Babysitter progress may be projected alongside native todos on compatible hosts,
without mutating canonical todo state.

Loading the extension does not create or resume a run. Session setup begins only
when oh-my-pi emits a lifecycle event with a real session ID. Setup failures are
reported as sanitized non-fatal diagnostics rather than falling back to a
session-less run.

## Plugin Layout

```text
artifacts/generated-plugins/oh-my-pi/
|-- package.json
|-- versions.json
|-- agents/
|   `-- babysitter-task.md
|-- extensions/
|   |-- index.ts
|   `-- driver.ts
|-- hooks/
|-- commands/
|-- skills/
`-- scripts/
```

## SDK Setup

Read the pinned SDK version from `versions.json` when you need a local CLI:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$(pwd)}"
SDK_VERSION=$(node -e "try{const fs=require('fs');const path=require('path');const pluginRoot=process.env.OMP_PLUGIN_ROOT||process.env.PLUGIN_ROOT||process.cwd();const probes=[path.join(pluginRoot,'versions.json'),path.join(pluginRoot,'plugins','babysitter-omp','versions.json'),path.join(pluginRoot,'node_modules','@a5c-ai','babysitter-omp','versions.json'),path.join(process.cwd(),'node_modules','@a5c-ai','babysitter-omp','versions.json')];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION

if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then
  CLI="babysitter"
else
  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"
fi
```

If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.

## Marketplace And Distribution

oh-my-pi discovers this plugin through its native plugin system. Publish new
versions to npm under `@a5c-ai/babysitter-omp`, then users can install or
upgrade through `omp plugin install @a5c-ai/babysitter-omp`.

## Upgrade And Uninstall

Upgrade by reinstalling the plugin:

```bash
omp plugin install @a5c-ai/babysitter-omp
```

Remove it with:

```bash
omp plugin uninstall @a5c-ai/babysitter-omp
```

## Troubleshooting

- Verify the harness with `babysitter harness:discover --json`.
- If `omp` is not available, check `where omp` on Windows or `which omp` on Unix.
- If commands do not appear, restart oh-my-pi after installation so it reloads plugin metadata.
- If the wrong SDK version is used, inspect `versions.json` inside the installed plugin root.
- Regenerate mirrored commands and command-backed skills with `npm run sync:commands`.

## Tests

```bash
cd artifacts/generated-plugins/oh-my-pi
npm test
```

## License

MIT
