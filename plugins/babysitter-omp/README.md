# @a5c-ai/babysitter-omp

Babysitter package for `oh-my-pi`.

This is a thin oh-my-pi package:

- `skills/` exposes Babysitter workflows through oh-my-pi's skill system
- `extensions/index.ts` adds lightweight slash-command aliases that forward to those skills
- the SDK remains responsible for orchestration, runs, tasks, and state

## Installation

Recommended:

```bash
omp plugin install @a5c-ai/babysitter-omp
```

Verify the plugin is available:

```bash
babysitter harness:discover --json
```

Development helper:

```bash
npx @a5c-ai/babysitter-omp install --workspace /path/to/repo
```

Removal:

```bash
omp plugin uninstall @a5c-ai/babysitter-omp
```

## Using Babysitter

Start oh-my-pi, then use the thin Babysitter entrypoints exposed by the plugin:

- `/babysit` or `/babysitter`
- `/call`
- `/plan`
- `/resume`
- `/doctor`
- `/yolo`

Each command forwards into oh-my-pi's native `/skill:<name>` flow. The
orchestration contract lives in the skills; the extension only provides
convenient aliases.

## Commands And Skills

The package mirrors the canonical Babysitter command docs and exposes the core
`babysit` skill plus command-backed skills such as `call`, `doctor`, `plan`,
`resume`, and `yolo`.

The extension layer is intentionally thin. It only forwards slash commands to
oh-my-pi's built-in `/skill:<name>` flow; it does not implement a custom loop
driver, custom tools, or direct run mutation logic.

## Plugin Layout

```text
plugins/babysitter-omp/
|-- package.json
|-- versions.json
|-- extensions/
|   `-- index.ts
|-- commands/
|-- skills/
|-- bin/
`-- scripts/
```

## SDK Setup

Read the pinned SDK version from `versions.json` when you need a local CLI:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$(pwd)}"
SDK_VERSION=$(node -e "try{const fs=require('fs');const path=require('path');const pluginRoot=process.env.OMP_PLUGIN_ROOT||process.env.PLUGIN_ROOT||process.cwd();const probes=[path.join(pluginRoot,'versions.json'),path.join(pluginRoot,'plugins','babysitter-omp','versions.json'),path.join(pluginRoot,'node_modules','@a5c-ai','babysitter-omp','versions.json'),path.join(process.cwd(),'node_modules','@a5c-ai','babysitter-omp','versions.json')];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

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
cd plugins/babysitter-omp
npm test
```

## License

MIT
