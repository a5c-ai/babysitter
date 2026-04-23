# Current State Analysis

→ [Documentation Index](README.md) | Previous: [System Overview](system-overview.md) | Next: [V6 Architecture Vision](v6-vision.md)

## Existing Architecture

The current a5c.ai agent stack consists of:

- **`@a5c-ai/agent-mux`** - Agent dispatch/multiplexing layer
- **`@a5c-ai/hooks-mux`** - Hook normalization across harnesses  
- **`@a5c-ai/agent-plugins-mux`** - Cross-harness plugin compiler
- **`@a5c-ai/babysitter-agent`** - Monolithic orchestration runtime
- **`@a5c-ai/babysitter-sdk`** - Core SDK for orchestration

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
- `agent-plugins-mux` → `agent-plugins-mux`

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

---

**Related Documents**: [System Overview](system-overview.md) | [V6 Vision](v6-vision.md) | [Package Specifications](package-specs.md)
