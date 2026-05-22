# GAP-USER-017: Plugin Management Integration

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Integrated plugin management experience during orchestration: discovery, installation, configuration via agentic tools and breakpoint interactions rather than separate CLI sessions.

## Current State
plugin:install, plugin:list-installed exist as terminal commands. Not integrated into the orchestration experience. No in-session browsing or management.

## Target State
Plugin discovery as agentic tool. Plugin install/configure via breakpoint with approval. Marketplace browsing via embedded SDK dashboard widget.

## Dependencies
- [GAP-ECO-002](../ecosystem/GAP-ECO-002.md) -- marketplace protocol for richer discovery

## Key Files
| Component | Path |
|-----------|------|
| Plugin management | `packages/sdk/src/plugins/` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 2 implementation. Expose plugin management via agentic tools. Plugin install/configure through breakpoint with approval flow.
