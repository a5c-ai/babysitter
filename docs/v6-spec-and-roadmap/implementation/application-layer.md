# Application Layer Implementation

→ [Implementation Index](../README.md#implementation) | Previous: [Platform Layer](platform-layer.md) | Next: [Optimization & Polish](optimization-polish.md)

## Phase 3: Application Layer

The application layer applies the earlier seam work to user-facing capabilities such as governance, memory, cost tracking, and observability. In V6, those capabilities should be planned around current packages and concrete plugin outputs first, not around deferred top-level package creation.

### Capability Slices In Current Surfaces

**Governance Capabilities**
- Clarify whether governance work belongs in existing plugin bundles, SDK modules, or `packages/babysitter-agent` seams → [Security Architecture](../security-architecture.md)
- Implement policy and authority-chain behavior only through bounded slices that can be validated in the current runtime
- Treat hard sandbox and enforcement claims as earned outcomes, not assumed architecture

**Memory And Session Capabilities**
- Improve session continuity, history, and memory-related flows using the existing orchestration and plugin surfaces
- Add privacy or collaboration behavior only where ownership and validation are clear
- Prefer capability-level documentation over speculative package diagrams

**Cost And Monitoring Capabilities**
- Evolve cost tracking and observability through current packages or plugin bundles with measurable commands → [Performance Considerations](../performance-docs.md)
- Add budget, alerting, and metrics work only where the current stack exposes a concrete seam and consumer

### Complete Orchestration Solution

**Current Orchestration Layer**
- Keep `packages/babysitter-agent` as the current orchestration package unless a later ADR approves a narrow rename or extraction
- Clarify thin-layer ambitions as internal-boundary work inside the existing package, not as a new top-level deliverable
- Integrate capability slices through current plugin, SDK, and process-library surfaces

**Agent-Mux Integration**
- Integrate agent-mux packages from repository unification → [Agent-Mux Integration](../agent-mux-integration.md)
- Maintain API compatibility during transition period
- Consolidate UI components (web, mobile, TUI) with unified architecture
- Preserve platform-specific applications with updated integration

### Exploratory Vocabulary Note

Terms such as `agent-platform`, `agent-platform-meta-plugins`, and a re-scoped `babysitter-agent` may still appear elsewhere in the V6 discussion as exploratory vocabulary. In this phase, they are not implementation deliverables unless the core V6 documents are updated first.

## Integration Validation

**Capability Integration Testing**: Governance, memory, cost, and observability slices working together through current plugin and runtime surfaces

**Compatibility Validation**: Agent-mux and existing Babysitter workflows remain operational during any transition

**Performance Testing**: Overhead and resource usage claims must use measured baselines → [Testing Framework](../testing-framework.md)

**Integration Test Suite**: End-to-end functionality validation

## Deliverables

- Capability slices implemented or documented in current packages and plugin bundles
- Integration test coverage for the slices actually shipped in this phase
- Agent-mux integration preserved with compatibility notes where behavior changes
- Evidence for whether any later extraction is justified

## Success Criteria

- Complete feature parity with existing monolithic solution
- Security and isolation claims only made where validation exists
- Performance targets achieved only where measurement methods are defined
- Zero regression in existing functionality during transition

## Explicit Non-Deliverables

This phase does not create a replacement `@a5c-ai/babysitter-agent`, nor does it assume an `agent-platform` package underneath it. Those remain deferred until separately promoted by decision record.

---

**Related Documents**: [Platform Layer](platform-layer.md) | [Agent-Mux Integration](../agent-mux-integration.md) | [Security Architecture](../security-architecture.md)
