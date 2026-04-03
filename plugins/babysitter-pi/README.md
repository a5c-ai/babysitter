# @a5c-ai/babysitter-pi

Babysitter integration plugin for the upstream `pi` coding agent. This package
owns the Pi-specific install surface, command docs, and skill wiring while the
shared runtime internals remain compatible with the wider PI-family.

## Integration Model

The pi plugin keeps Babysitter as the orchestration layer for pi sessions:

- session lifecycle hooks prepare and bind run state
- pi commands start or resume runs
- the harness advances one orchestration phase at a time
- the plugin runtime records effect outcomes and updates the run state
- completion requires the emitted `completionProof`

## Installation

Install the published Pi plugin globally:

```bash
npx @a5c-ai/babysitter-pi install
```

Install into a specific workspace instead of the user profile:

```bash
npx @a5c-ai/babysitter-pi install --workspace /path/to/repo
```

Or use the Babysitter SDK helper:

```bash
babysitter harness:install-plugin pi
babysitter harness:install-plugin pi --workspace /path/to/repo
```

This package installs under:

```text
~/.pi/plugins/babysitter
```

If the workspace does not already have an active process-library binding, the
installer bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

## Commands

The plugin exposes pi-facing Babysitter commands such as:

- `/babysitter:call`
- `/babysitter:status`
- `/babysitter:resume`
- `/babysitter:doctor`

## Troubleshooting

- `babysitter harness:discover --json` is the supported way to verify whether
  `pi` is installed from the current environment.
- If discovery reports `pi` as installed but a direct invocation fails, validate
  the current shell `PATH` first with `where pi` on Windows.

## Tests

```bash
cd plugins/babysitter-pi
npm test
npm run test:integration
npm run test:harness
npm run test:tui
```

## License

MIT
