# @a5c-ai/tula

Tula is the unified agent product that composes every layer of the babysitter agent stack into a single distributable binary.

## Architecture

| Layer | Package | Role |
|-------|---------|------|
| L4 | `@a5c-ai/tula-core` | Loop, subagent, context, synthesis interfaces |
| L5 | `@a5c-ai/agent-runtime` | Daemon, session, cost, observability, telemetry |
| L6 | `@a5c-ai/agent-platform` | Harness integration, governance, interaction, storage |
| Mux | `@a5c-ai/agent-mux` | Agent multiplexer |
| TUI | `@a5c-ai/babysitter-tui-plugins` | TUI plugins for cost, governance, status |

Tula re-exports the full public API from all layers and owns the single `tula` CLI binary implementation.

## Usage

```bash
# As a CLI
npx @a5c-ai/tula <command> [options]

# As a library
import { createBabysitterAgentCli } from "@a5c-ai/tula/cli";
import { createAgentCoreSession } from "@a5c-ai/tula";
```

## Development

```bash
npm run build    # Build (builds dependencies first)
npm run test     # Run tests
npm run clean    # Remove build artifacts
```
