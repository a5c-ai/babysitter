# Foundation Layer Implementation

→ [Implementation Index](../README.md#implementation) | Next: [Platform Layer](platform-layer.md)

## Phase 1: Foundation Layer

The foundation layer establishes the minimum V6 base inside the current repository shape. This phase clarifies seams, validation gates, and ownership in `packages/sdk`, `packages/babysitter-agent`, and `plugins/*`. It does not commit V6 to creating deferred top-level packages.

### Current-Package Seam Clarification

**Runtime And Session Boundaries**
- Clarify which runtime concerns already belong to `packages/babysitter-agent`
- Isolate Pi wrapper, session handling, and structured event concerns behind internal module seams before considering any package move
- Reduce filesystem assumptions only where current commands and tests prove the change is safe
- Record candidate extraction boundaries as ADR-backed slices rather than package commitments

**Hook System**
- Tighten programmatic hook responsibilities in the current SDK and plugin surfaces
- Verify hook registration, invocation, and acknowledgment flows against existing runtime behavior
- Add or update configuration only where the current CLI and plugin model already require it

### Infrastructure Foundation

**Compiler And Packaging Reality Checks**
- Validate `agent-plugins-mux` and related packaging flows against real plugin manifests and generated outputs
- Document import and ownership seams that already exist in the repo instead of inventing new package boundaries
- Add compatibility notes for any rename or extraction candidate that survives Phase 0 decision framing

**Platform Candidate Preparation**
- Describe plugin-system responsibilities in current-package terms
- Identify which platform concerns are internal `packages/sdk` or `packages/babysitter-agent` candidates versus actual `plugins/*` responsibilities
- Treat filesystem abstraction and plugin registration work as candidate slices only when they can be validated independently

## Deliverables

- Updated seam map for runtime, session, and hook responsibilities in current packages
- ADR-backed first executable slice for the accepted `@a5c-ai/babysitter-agent` seam contract
- ADR-ready candidate slices for any later extraction or rename still worth considering
- Hook and packaging flows validated against existing commands and plugin outputs
- Any reduced-filesystem claim stated with a baseline, command, and rollback note

## Technical Validation

**Documentation Consistency**: Foundation work must remain consistent with [V6 Architecture Specification](../v6-architecture-specification.md) and [Package Specifications](../package-specs.md)

**Current-Behavior Checks**: Use current build, test, and plugin packaging commands as the source of truth for whether a seam is real

**Current Slice Command**: `npm run verify:v6:seams` is the repo-level validation gate for the accepted seam-contract slice

**Packaging Validation**: Compare compiler changes against existing manifest and install surfaces

**Performance Benchmarking**: Any runtime or session target must cite a baseline command before it becomes a success criterion

**Extraction Gate**: No deferred package name becomes part of this phase without a decision record that changes its state in the core V6 docs

## Explicit Non-Deliverables

This phase does not create `@a5c-ai/agent-runtime` or `@a5c-ai/agent-platform`. Those names remain deferred vocabulary unless later decision records promote a specific slice into scope.

---

**Related Documents**: [Package Specifications](../package-specs.md) | [Testing Framework](../testing-framework.md) | [Platform Layer](platform-layer.md)
