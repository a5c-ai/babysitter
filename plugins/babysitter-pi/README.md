# babysitter-pi

Babysitter integration plugin for oh-my-pi. It adapts Babysitter's harness
contract to pi's session lifecycle, command system, and agent execution model.

## Integration Model

The pi plugin keeps Babysitter as the orchestration layer for pi sessions:

- session lifecycle hooks prepare and bind run state
- pi commands start or resume runs
- the harness advances one orchestration phase at a time
- the plugin runtime records effect outcomes and updates the run state
- completion requires the emitted `completionProof`

## Active Process-Library Model

Process discovery should prefer active roots:

1. `.a5c/processes` in the current workspace
2. The SDK-managed active process-library binding returned by `babysitter process-library:active --json`
3. Installed plugin process roots only as compatibility fallback
4. Bundled/reference content only as fallback

Do not document team-only or plugin-bundled process roots as the primary source
of truth.

## Commands

The plugin exposes pi-facing Babysitter commands such as:

- `/babysitter:call`
- `/babysitter:status`
- `/babysitter:resume`
- `/babysitter:doctor`

## Orchestration Contract

pi-facing docs should preserve the same core rules used by the active
Babysitter contract:

- start and resume work through the `/babysitter:*` command surface
- execute one orchestration phase per harness turn
- let the pi plugin and command implementation own the low-level Babysitter runtime mechanics
- complete only when the emitted `completionProof` is returned

## Task Kinds

Current generated-process guidance should prefer:

- `agent`
- `skill`
- `shell`
- `breakpoint`
- `sleep`

Do not present `node` as an active generated effect kind in pi docs.

## Installation

From npm:

```bash
omp plugin install babysitter-pi
```

From a local checkout:

```bash
git clone <repo-url> && cd babysitter
npm install
omp plugin link ./plugins/babysitter-pi
```

From the Babysitter SDK CLI helper:

```bash
babysitter harness:install-plugin pi
```

If the workspace does not already have an active process-library binding, this command bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

## Usage

Start a run:

```text
/babysitter:call Scan the codebase and generate a quality report
```

Check status:

```text
/babysitter:status
/babysitter:status <runId>
```

The pi README is user-facing. Raw Babysitter runtime mechanics belong in the pi
command implementation docs, not here.

## Tests

```bash
cd plugins/babysitter-pi && npm test
npm run test:integration
npm run test:harness
npm run test:tui
```

## License

MIT
