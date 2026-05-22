# v6.1 Specification — Layer-to-Package Gap Analysis

This directory contains the v6.1 specification documents derived from a gap analysis between the Atlas graph (source of truth for the a5c agent stack), the actual monorepo packages, and the v6.0 spec documentation.

## Reading Order

1. [stack-layer-map.md](./stack-layer-map.md) — Canonical mapping of all 14 atlas stack layers to packages, node kinds, and implementation status
2. [naming-alignment.md](./naming-alignment.md) — Naming mismatches between graph concepts and package names, with proposed renames
3. [gap-inventory.md](./gap-inventory.md) — Complete inventory of gaps: missing implementations, deferred capabilities, fragmented ownership
4. [v6.1-priorities.md](./v6.1-priorities.md) — Prioritized work items for v6.1 based on gap severity and user impact

## Source of Truth

The Atlas graph (`packages/atlas/graph/`) is the canonical source of truth for the agent stack architecture. The 14 stack layers, their node kinds, and their relationships define what the system IS — packages implement what the graph describes.

When a package doesn't match the graph, the package needs to change (or the graph needs a deliberate amendment with a decision record).
