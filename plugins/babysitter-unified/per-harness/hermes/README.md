# @a5c-ai/babysitter-hermes

Babysitter package for the Hermes coding agent by Nous Research.

This is a thin Hermes package:

- `skills/` exposes Babysitter workflows through Hermes's skill system
- the SDK remains responsible for orchestration, runs, tasks, and state
- Hermes communicates via ACP (Agent Communication Protocol) — JSON-RPC over stdio

## Installation

Install the Babysitter CLI once when using the SDK helper:

```bash
npm install -g @a5c-ai/babysitter
```

Recommended for automation:

```bash
# Global install
babysitter harness:install-plugin hermes

# Workspace install
babysitter harness:install-plugin hermes --workspace /path/to/repo
```

Verify the harness is available:

```bash
babysitter harness:discover --json
```

## Using Babysitter

Start Hermes, then use the Babysitter commands:

- `/babysit` or `/babysitter`
- `/call`
- `/plan`
- `/babysitter:resume`
- `/doctor`
- `/yolo`

## Hermes-Specific Notes

### ACP Integration

Hermes uses the Agent Communication Protocol (ACP) for programmatic integration.
The babysitter adapter communicates via JSON-RPC over stdio, matching Hermes's
native ACP adapter interface.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `HERMES_SESSION` | Hermes session identifier |
| `HERMES_PLUGIN_ROOT` | Plugin root directory |
| `AGENT_SESSION_ID` | Fallback session ID |

### Provider Runtime

Hermes supports 30+ LLM providers with automatic fallback chains.
The babysitter adapter respects Hermes's provider resolution and does not
override model selection unless explicitly configured.

### Memory Provider

Hermes has a pluggable memory provider system with 12 lifecycle hooks.
The babysitter adapter preserves Hermes's memory context across orchestrated
runs via the cross-run state sharing module.

## Plugin Layout

```text
artifacts/generated-plugins/hermes/
|-- package.json
|-- versions.json
|-- skills/
|-- bin/
`-- scripts/
```

## Marketplace And Distribution

Publish new versions to npm under `@a5c-ai/babysitter-hermes`, then users
can install through `babysitter harness:install-plugin hermes`.

## Troubleshooting

- Verify the harness with `babysitter harness:discover --json`.
- If `hermes` is not available, check `where hermes` on Windows or `which hermes` on Unix.
- Ensure Hermes is running with ACP mode enabled for programmatic integration.
- If the wrong SDK version is used, inspect `versions.json` inside the installed package root.

## Tests

```bash
cd artifacts/generated-plugins/hermes
npm test
```

## License

MIT
