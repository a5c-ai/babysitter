# @a5c-ai/babysitter

Metapackage for installing all babysitter npm packages.

<!-- docs-status:start -->
> Status: Public metapackage.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README remains the canonical package contract for the metapackage install surface.
<!-- docs-status:end -->

## Installation

```bash
npm install -g @a5c-ai/babysitter
```

## Usage

Once installed, you can use the `babysitter` command:

```bash
npx @a5c-ai/babysitter --help
```

Or if installed globally:

```bash
babysitter --help          # agent-facing commands (default)
babysitter --help-human    # human-facing SDK/install commands
```

For agent runtime orchestration commands such as `call`, `yolo`,
`invoke`, `resume`, `start-server`, and `tui`, install the optional agent CLI:

```bash
npm install -g @a5c-ai/babysitter-agent
babysitter-agent --help-human
```

## What's Included

This metapackage installs:

- **@a5c-ai/babysitter-sdk** - Core SDK with CLI for managing babysitter workflows
- **Main `babysitter` CLI** - Core operational commands plus `harness:install` and `harness:install-plugin`

## CLI Entry Point

The `babysitter` command provided by this metapackage is an alias to the core CLI from `@a5c-ai/babysitter-sdk`.

## Repository

https://github.com/a5c-ai/babysitter
