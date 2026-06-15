# @a5c-ai/babysitter-genty

Babysitter package for the `genty` coding agent.

This is a thin genty package:

- `extensions/index.ts` registers babysitter as an orchestration provider via genty's extension API
- the SDK remains responsible for orchestration, runs, tasks, and state

## Installation

Install the Babysitter CLI once when using the SDK helper:

```bash
npm install -g @a5c-ai/babysitter
```

Recommended for automation:

```bash
# Global install
babysitter harness:install-plugin genty

# Workspace install
babysitter harness:install-plugin genty --workspace /path/to/repo
```

Verify the package is available:

```bash
babysitter harness:discover --json
```

Published package installer:

```bash
npx --yes @a5c-ai/babysitter-genty install --global
npx --yes @a5c-ai/babysitter-genty install --workspace /path/to/repo
```

## Using Babysitter

Start genty, then use the thin Babysitter entrypoints exposed by the extension:

- `/babysit` or `/babysitter`
- `/call`
- `/plan`
- `/resume`
- `/doctor`
- `/yolo`

Each command forwards into the babysitter orchestration skill. The orchestration
contract lives in the skills; the extension only provides convenient aliases.

## Commands And Skills

The package mirrors the canonical Babysitter command docs and exposes the core
`babysit` skill plus command-backed skills such as `call`, `doctor`, `plan`,
`resume`, and `yolo`.

The extension layer is intentionally thin. It registers slash commands that
forward to genty's built-in skill system; it does not implement a custom loop
driver, custom tools, or direct run mutation logic.

## Plugin Layout

```text
artifacts/generated-plugins/genty/
|-- package.json
|-- versions.json
|-- extensions/
|   `-- index.ts
|-- commands/
|-- skills/
|-- bin/
`-- scripts/
```

## Marketplace And Distribution

Publish new versions to npm under `@a5c-ai/babysitter-genty`, then users can
install or upgrade through the babysitter CLI.

## Upgrade And Uninstall

Upgrade by reinstalling:

```bash
babysitter harness:install-plugin genty
```

## Troubleshooting

- Verify the harness with `babysitter harness:discover --json`.
- If `genty` is not available, check `where genty` on Windows or `which genty` on Unix.
- If commands do not appear, restart genty after installation so it reloads extension metadata.
- If the wrong SDK version is used, inspect `versions.json` inside the installed package root.
- Regenerate mirrored commands and command-backed skills with `npm run sync:commands`.

## Tests

```bash
cd artifacts/generated-plugins/genty
npm test
```

## License

MIT
