# @a5c-ai/babysitter-pi

Babysitter package for the upstream `pi` coding agent.

This is a thin Pi package:

- `skills/` exposes Babysitter workflows through Pi's skill system
- `extensions/index.ts` adds lightweight slash-command aliases that forward to those skills
- the SDK remains responsible for orchestration, runs, tasks, and state

## Installation

Recommended:

```bash
pi install npm:@a5c-ai/babysitter-pi
```

Verify the package is available:

```bash
babysitter harness:discover --json
```

Project-local:

```bash
cd /path/to/repo
pi install -l npm:@a5c-ai/babysitter-pi
```

Development helper:

```bash
npx @a5c-ai/babysitter-pi install
npx @a5c-ai/babysitter-pi install --workspace /path/to/repo
```

Removal:

```bash
pi remove npm:@a5c-ai/babysitter-pi
```

## Using Babysitter

Start Pi, then use the thin Babysitter entrypoints exposed by the package:

- `/babysit` or `/babysitter`
- `/call`
- `/plan`
- `/resume`
- `/doctor`
- `/yolo`

Each command forwards into Pi's native `/skill:<name>` flow. The orchestration
contract lives in the skills; the extension only provides convenient aliases.

## Commands And Skills

The package mirrors the canonical Babysitter command docs and exposes the core
`babysit` skill plus command-backed skills such as `call`, `doctor`, `plan`,
`resume`, and `yolo`.

The extension layer is intentionally thin. It only forwards slash commands to
Pi's built-in `/skill:<name>` flow; it does not implement a custom loop driver,
custom tools, or direct run mutation logic.

## Plugin Layout

```text
plugins/babysitter-pi/
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
PLUGIN_ROOT="${PI_PLUGIN_ROOT:-$(pwd)}"
SDK_VERSION=$(node -e "try{const fs=require('fs');const path=require('path');const pluginRoot=process.env.PI_PLUGIN_ROOT||process.env.PLUGIN_ROOT||process.cwd();const probes=[path.join(pluginRoot,'versions.json'),path.join(pluginRoot,'plugins','babysitter-pi','versions.json'),path.join(pluginRoot,'node_modules','@a5c-ai','babysitter-pi','versions.json'),path.join(process.cwd(),'node_modules','@a5c-ai','babysitter-pi','versions.json')];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

## Marketplace And Distribution

Pi discovers this package through its native package installation flow. Publish
new versions to npm under `@a5c-ai/babysitter-pi`, then users can install or
upgrade through `pi install npm:@a5c-ai/babysitter-pi`.

## Upgrade And Uninstall

Upgrade by reinstalling the package:

```bash
pi install npm:@a5c-ai/babysitter-pi
```

Remove it with:

```bash
pi remove npm:@a5c-ai/babysitter-pi
```

## Troubleshooting

- Verify the harness with `babysitter harness:discover --json`.
- If `pi` is not available, check `where pi` on Windows or `which pi` on Unix.
- If commands do not appear, restart Pi after installation so it reloads package metadata.
- If the wrong SDK version is used, inspect `versions.json` inside the installed package root.
- Regenerate mirrored commands and command-backed skills with `npm run sync:commands`.

## Tests

```bash
cd plugins/babysitter-pi
npm test
```

## License

MIT
