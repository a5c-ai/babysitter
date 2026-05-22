# Application Layer Implementation

→ [Implementation Index](../README.md#implementation) | Previous: [Platform Layer](platform-layer.md) | Next: [Optimization & Polish](optimization-polish.md)

## Phase 3: Application Layer

The application layer applies the earlier seam work to user-facing capabilities such as governance, memory, cost tracking, and observability. In the current V6 stage, this phase is about selecting and validating bounded capability slices in the existing repository shape. It is not a commitment to fully pluginize every major feature or replace the monolithic package layout in one pass.

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

### Delivery Shape For This Phase

**Current Orchestration Layer**
- Keep `packages/babysitter-agent` as the current orchestration package unless a later ADR approves a narrow rename or extraction
- Clarify thin-layer ambitions as internal-boundary work inside the existing package, not as a new top-level deliverable
- Integrate capability slices through current plugin, SDK, and process-library surfaces

**Agent-Mux Integration**
- Integrate agent-mux packages from repository unification → [Agent-Mux Integration](../agent-mux-integration.md)
- Maintain API compatibility during transition period
- Consolidate UI components (web, mobile, TUI) with unified architecture
- Preserve platform-specific applications with updated integration

### Decision Framework

- Prefer a single validated slice over a broad phase plan that assumes every application concern must move at once
- Require a concrete owner, validation command, and rollback path before broadening any application-layer seam
- Treat package extraction and universal pluginization as follow-on decisions that need their own evidence

### Exploratory Vocabulary Note

Terms such as `agent-platform`, `agent-platform-meta-plugins`, and a re-scoped `babysitter-agent` may still appear elsewhere in the V6 discussion as exploratory vocabulary. In this phase, they are not implementation deliverables unless the core V6 documents are updated first.

## Integration Validation

**Capability Integration Testing**: Validate only the slices actually selected for this phase through current plugin and runtime surfaces

**Compatibility Validation**: Agent-mux and existing Babysitter workflows remain operational during any transition

**Performance Testing**: Overhead and resource usage claims must use measured baselines → [Testing Framework](../testing-framework.md)

**Documentation Validation**: The phase narrative must stay aligned with the V6 architecture spec non-goals and minimum-acceptable roadmap definition

## Deliverables

- Candidate application-layer slices documented against current package and plugin seams
- One validated application-layer slice, if this phase moves beyond documentation and decision framing
- Integration test coverage for the slices actually shipped in this phase
- Agent-mux integration preserved with compatibility notes where behavior changes
- Evidence for whether any later extraction is justified

## Success Criteria

- This phase is complete when the shipped slice is coherent, validated, and aligned with the V6 minimum-acceptable definition.
- Full pluginized feature parity remains optional follow-on work, not a current V6 requirement.
- Security and isolation claims only made where validation exists
- Performance targets achieved only where measurement methods are defined
- Zero regression in existing functionality during transition

## Explicit Non-Deliverables

This phase does not create a replacement `@a5c-ai/babysitter-agent`, does not assume an `agent-platform` package underneath it, and does not require all major functionality to be converted into plugins. Those remain deferred until separately promoted by decision record.

---

**Related Documents**: [Platform Layer](platform-layer.md) | [Agent-Mux Integration](../agent-mux-integration.md) | [Security Architecture](../security-architecture.md)
