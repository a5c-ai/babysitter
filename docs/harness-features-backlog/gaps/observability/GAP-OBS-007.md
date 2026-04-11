# GAP-OBS-007: Audit Export

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Export run journals and operational data in coherent, portable formats for external auditing, compliance, and analysis.

## Current State
Journal is raw JSON files in .a5c/runs/<runId>/journal/. Not easy to export coherently. No standard export format for external consumption.

## Target State
Export commands producing machine-readable (JSON, CSV) and human-readable (Markdown) summaries of run history, effect decisions, and operational data. Exportable to external audit systems.

## Dependencies
- [GAP-OBS-004](../observability/GAP-OBS-004.md) -- policy decision trail for audit content

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| CLI commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 3 implementation. Add run:export command producing structured summaries in JSON and Markdown formats.
