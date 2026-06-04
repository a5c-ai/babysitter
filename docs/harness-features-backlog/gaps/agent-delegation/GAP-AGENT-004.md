# GAP-AGENT-004: Built-in Process Templates

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | Medium |
| Effort | L |
| Status | Partial |

## Description
Reusable process templates for common delegation patterns: exploration, planning, verification, code review. Available in the process library as ready-to-use patterns.

## Current State
Process library has methodologies and specializations. GSD phases cover plan/execute/verify. But not packaged as ready-to-use templates with specific harness and capability configurations.

## Target State
Process library includes: explorer template (read-only, fast model), planner template (analysis-focused), verifier template (test-running), reviewer template (code review with specific checklist). Each template pre-configures harness, model, and capability profile.

## Dependencies
- [GAP-HADAPT-002](../harness-adaptation/GAP-HADAPT-002.md) -- model selection per task

## Key Files
| Component | Path |
|-----------|------|
| Process library | `packages/sdk/src/processLibrary/` |
| Process definitions | `.a5c/processes/` |

## Recommendation
Phase 3 implementation. Create process templates in process library with pre-configured harness, model, and capability selections.
