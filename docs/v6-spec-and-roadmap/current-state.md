# Current State Analysis

→ [Documentation Index](README.md) | Previous: [System Overview](system-overview.md) | Next: [V6 Architecture Vision](v6-vision.md)

## Existing Architecture

The current a5c.ai agent stack consists of:

- **`@a5c-ai/agent-mux`** - Agent dispatch/multiplexing layer
- **`@a5c-ai/hooks-mux`** - Hook normalization across harnesses  
- **`@a5c-ai/extension-mux`** - Cross-harness plugin compiler
- **`@a5c-ai/babysitter-agent`** - Monolithic orchestration runtime
- **`@a5c-ai/babysitter-sdk`** - Core SDK for orchestration

The plugin side of the stack already exposes the pieces needed for metaplugins, but those pieces are not the metaplugin abstraction itself. `extension-mux` is the compiler that emits concrete plugin bundles for legacy non-Babysitter agents. The metaplugin layer is the capability being packaged across those bundles, such as memory systems, governance or policy engines, and discipline-enforcement concerns. First-party unified plugin sources such as `plugins/babysitter-unified` can carry parts of those concerns, but they are concrete plugin surfaces rather than the definition of metaplugins.

## Current Pain Points

**Monolithic Complexity**: `babysitter-agent` contains:
- Governance system (policies, authorities, sandbox rules) → [Security Architecture](security-architecture.md)
- Session management (state, context, history, memory)
- MCP integration (channels, transport, client tools)
- Harness adapters and agentic tools
- Cost tracking and observability
- Daemon infrastructure
- Agent-core integration for model communication

**Issues**:
1. **Bundle Size** - Cannot selectively import functionality
2. **Deployment Complexity** - All-or-nothing deployment model  
3. **Development Friction** - Large blast radius for changes
4. **Testing Challenges** - Difficulty isolating components → [Testing Framework](testing-framework.md)
5. **Domain Boundaries** - Hard to establish clear separation between functional domains

## Naming Harmonization

Current confusing terminology will be updated:
- runtime binary: `babysitter-agent`
- `hooks-mux` → `hooks-mux`
- `extension-mux` → `extension-mux`

This harmonization provides clearer naming that reflects the actual purpose of each package → [Package Specifications](package-specs.md)

## Impact Assessment

The monolithic structure creates significant challenges:

**Development Impact**:
- Changes require building and testing entire monolith
- Difficult to establish clear module ownership
- Cross-cutting concerns blur domain boundaries

**Deployment Impact**:
- Cannot deploy individual capabilities independently
- All-or-nothing upgrade model increases deployment risk
- Bundle size impacts application startup time

**Maintenance Impact**:
- Testing requires full integration environment
- Bug isolation is complex across domain boundaries
- Performance optimization requires whole-system analysis

## Executable Seam Clarification Gate

V6 does not treat this monolith as ready for broad extraction yet. The first required slice is an internal seam contract inside `@a5c-ai/babysitter-agent`, not an immediate package split.

That seam contract lives at `packages/babysitter-agent/src/seams/contract.ts` and assigns each current top-level runtime domain to an owned slice:

- `runtime-foundation`: runtime, session, storage, tasks, prompts, compression
- `governance-control`: governance, breakpoints
- `integration-bridges`: harness, mcp, api, anycli
- `operator-surfaces`: cli, daemon, interaction, observability, cost

The contract is only useful if it stays executable. Changes to `packages/babysitter-agent/src` should therefore keep the seam manifest, package subpath exports, and seam validation tests aligned before any broader extraction is proposed.

This slice is formally accepted in [ADR-001: Babysitter-Agent Seam Contract As The First Executable V6 Slice](decisions/ADR-001-babysitter-agent-seam-contract.md). The repo-level validation entrypoint for that slice is `npm run verify:v6:seams`.

---

**Related Documents**: [System Overview](system-overview.md) | [V6 Vision](v6-vision.md) | [Package Specifications](package-specs.md)
