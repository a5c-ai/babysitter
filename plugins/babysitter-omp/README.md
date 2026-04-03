# @a5c-ai/babysitter-omp

Babysitter integration plugin for `oh-my-pi`. This package owns the
oh-my-pi-specific install surface, command docs, and skill wiring while sharing
compatible runtime internals with the upstream Pi-family.

## Integration Model

The oh-my-pi plugin keeps Babysitter as the orchestration layer for omp
sessions:

- session lifecycle hooks prepare and bind run state
- omp commands start or resume runs
- the harness advances one orchestration phase at a time
- the plugin runtime records effect outcomes and updates the run state
- completion requires the emitted `completionProof`

## Installation

Install the published oh-my-pi plugin globally:

```bash
npx @a5c-ai/babysitter-omp install
```

Install into a specific workspace instead of the user profile:

```bash
npx @a5c-ai/babysitter-omp install --workspace /path/to/repo
```

Or use the Babysitter SDK helper:

```bash
babysitter harness:install-plugin oh-my-pi
babysitter harness:install-plugin oh-my-pi --workspace /path/to/repo
```

This package installs under:

```text
~/.omp/plugins/babysitter
```

If the workspace does not already have an active process-library binding, the
installer bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

## Commands

The plugin exposes oh-my-pi-facing Babysitter commands such as:

- `/babysitter:call`
- `/babysitter:status`
- `/babysitter:resume`
- `/babysitter:doctor`

## Troubleshooting

- `babysitter harness:discover --json` is the supported way to verify whether
  `oh-my-pi` is installed from the current environment.
- If discovery reports `oh-my-pi` as installed but a direct invocation fails,
  validate the current shell `PATH` first with `where omp` on Windows.

## Tests

```bash
cd plugins/babysitter-omp
npm test
npm run test:integration
npm run test:harness
npm run test:tui
```

## License

MIT
