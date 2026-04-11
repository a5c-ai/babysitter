# GAP-OBS-005: Context Introspection

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Provide real-time visibility into token usage, context window utilization, and cost during active orchestration, not just post-hoc analysis.

## Current State
tokens:stats provides post-hoc analysis. compression:status shows compression layer state. No real-time visibility during active orchestration.

## Target State
Real-time token usage per iteration. Context window utilization percentage. Cost accumulation visible in embedded SDK dashboard. Threshold-based warnings when approaching limits.

## Dependencies
- [GAP-SESSION-004](../session-management/GAP-SESSION-004.md) -- session-level cost tracking

## Key Files
| Component | Path |
|-----------|------|
| Token stats | `packages/sdk/src/cli/` |
| Compression module | `packages/sdk/src/compression/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 3 implementation. Accumulate token counts from task results in real-time. Display in embedded SDK dashboard with threshold warnings.
