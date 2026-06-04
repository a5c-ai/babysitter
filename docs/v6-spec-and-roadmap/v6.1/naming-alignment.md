# Naming Alignment — Graph Concepts vs Package Names

This document identifies naming mismatches between the Atlas graph (source of truth) and the actual monorepo package names. Misalignment creates confusion for contributors and agents navigating the codebase.

## Mismatches

### 1. "babysitter" vs Graph Layer Names

The graph uses clean layer names (Model, Provider, Transport, Agent-Core, Agent-Runtime, etc.) but the primary orchestration package is named `babysitter-sdk`. The name "babysitter" is a project identity, not an architectural concept.

| Graph Concept | Package Name | Mismatch |
|---------------|-------------|----------|
| Orchestration layer | `@a5c-ai/babysitter-sdk` | "babysitter" is brand, not architecture |
| Agent-Runtime layer | `@a5c-ai/genty-platform` | Conflates runtime with brand |
| Observer (Presentation) | `@a5c-ai/babysitter-observer-dashboard` | Long; could be `@a5c-ai/observer` |
| Metapackage | `@a5c-ai/babysitter` | OK — intentional brand entry point |

**Recommendation:** No rename needed for published packages (breaking change). Internal docs should use graph layer names when referring to architectural concerns, "babysitter" when referring to the product/project.

### 2. "adapters" Scope Sprawl

The graph has distinct layers (Core, Runtime, Platform, Interaction, Presentation) but `adapters` is used as a prefix for 7+ packages spanning multiple layers:

| Package | Graph Layer | Role |
|---------|-------------|------|
| `agent-comm-mux` | L4 Agent-Core, L5 Agent-Runtime | Core types + runtime utilities |
| `adapters-adapters` | L5 Agent-Runtime | Harness adapter implementations |
| `adapters-cli` | L10 Interaction | CLI entry point |
| `adapters-gateway` | L6 Agent-Platform | Remote API surface |
| `adapters-tui` | L11 Presentation | TUI rendering |
| `adapters-ui` | L11 Presentation | Shared UI foundation |
| `adapters-webui` | L11 Presentation | Web UI |

The `adapters` prefix implies "agent multiplexing" but most packages don't multiplex — they implement specific layers.

**Recommendation:** Accept as-is for v6.1. The `adapters` prefix is an organizational grouping, not an architectural claim. Future packages should use layer-aligned names when the concern is clearly in one layer.

### 3. "hooks-mux" vs Graph Concepts

The graph defines `HookSurface`, `HookMapping`, `Channel` (channels-hooks cluster) but the implementation uses "hooks-mux":

| Graph Concept | Package | Mismatch |
|---------------|---------|----------|
| HookSurface | `@a5c-ai/hooks-adapter-core` | "mux" implies multiplexing; graph says "surface" |
| HookMapping | `@a5c-ai/hooks-adapter-*` | Graph uses "mapping" not "adapter" |
| Channel | (no dedicated package) | Graph concept has no implementation |

**Recommendation:** The hooks-mux naming is stable and understood. "Channel" from the graph maps to the event routing in hooks-mux-core but isn't surfaced as a first-class concept in the API.

### 4. "transport-mux" vs Layer 3

The graph layer is "Transport" but the package is `transport-mux`. The "mux" suffix is consistent with hooks-mux and adapters but the graph doesn't use "mux" anywhere.

**Recommendation:** Accept. The `-mux` suffix is a codebase convention for packages that bridge multiple implementations.

### 5. "tasks-mux" vs Layer 9 (Sandbox)

The graph layer is "Sandbox" with `HumanCheckpoint`, `BreakpointStrategy`, `BreakpointAnswer` node kinds. The package is named `tasks-mux`.

| Graph Concept | Package | Alignment |
|---------------|---------|-----------|
| HumanCheckpoint | tasks-mux | Good — breakpoints ARE checkpoints |
| Sandbox (layer) | tasks-mux | Partial — breakpoints are one aspect of sandbox |

**Recommendation:** `tasks-mux` correctly names what it does (breakpoint multiplexing). It's a subset of the Sandbox layer, not the full layer implementation. Future sandbox packages (filesystem policy, network policy) should not be under `tasks-mux`.

### 6. Graph Node Kinds Without Package Representation

These graph node kinds in the agent-stack cluster have no corresponding package:

| Node Kind | Layer | Status |
|-----------|-------|--------|
| `CapabilityProfile` | L4-L5 | Defined in graph; no runtime implementation |
| `SessionModel` | L5 | Defined in graph; session persistence is in babysitter-sdk/session |
| `LaunchConfig` | L5-L6 | Defined in graph; launch configs are in agent-catalog, resolved by adapters-cli |
| `KnowledgeFabricImpl` | L12 | Defined in graph; no implementation package |

## Naming Convention Guidelines for v6.1

1. **New packages** should use the graph layer name when the package implements exactly one layer
2. **Cross-layer packages** may use domain-specific names (e.g., `tasks-mux` spans L9 + L14)
3. **The `-mux` suffix** means "multiplexes across implementations" (multiple harnesses, multiple transports, etc.)
4. **Graph node kinds** are the canonical vocabulary — package READMEs should reference their node kinds
5. **"babysitter"** is the product name; **layer names** are the architecture vocabulary
