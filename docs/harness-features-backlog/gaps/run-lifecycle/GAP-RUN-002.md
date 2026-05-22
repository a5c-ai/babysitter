# GAP-RUN-002: Run Archival and Restore

| Field | Value |
|-------|-------|
| Category | run-lifecycle |
| Priority | Low |
| Effort | M |
| Status | Missing |

## Description
Archive completed runs to cold storage. Restore on demand. Manage run retention policies.

## Current State
harness:cleanup deletes old runs. No archival or restore.

## Target State
run:archive compresses and moves completed runs to archive directory. run:restore retrieves archived runs. Configurable retention policies (keep N days, archive after M days, delete after P days).

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Storage | `packages/sdk/src/storage/` |
| CLI commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 4 implementation. Add run:archive and run:restore commands. Implement retention policy configuration.
