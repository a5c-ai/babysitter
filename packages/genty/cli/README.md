# @a5c-ai/genty

genty is the unified agent product that composes every layer of the babysitter agent stack into a single distributable binary.

## Architecture

| Layer | Package | Role |
|-------|---------|------|
| L4 | `@a5c-ai/genty-core` | Loop, subagent, context, synthesis interfaces |
| L5 | `@a5c-ai/genty-runtime` | Daemon, session, cost, observability, telemetry |
| L6 | `@a5c-ai/genty-platform` | Harness integration, governance, interaction, storage |
| Adapter | `@a5c-ai/adapters` | Agent multiplexer |
| TUI | `@a5c-ai/genty-tui-plugins` | TUI plugins for cost, governance, status |

genty re-exports the full public API from all layers and owns the single `genty` CLI binary implementation.

## Usage

```bash
# As a CLI
npx @a5c-ai/genty <command> [options]

# As a library
import { createBabysitterAgentCli } from "@a5c-ai/genty";
import { createAgentCoreSession } from "@a5c-ai/genty";
```

## Development

```bash
npm run build    # Build (builds dependencies first)
npm run test     # Run tests
npm run clean    # Remove build artifacts
```
