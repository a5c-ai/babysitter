# GAP-PROC-004: Process Parameter Schemas and Validation

| Field | Value |
|-------|-------|
| Category | process-composition |
| Priority | Medium |
| Effort | S |
| Status | Missing |

## Description
Define typed input/output schemas for processes. Validate at run creation and between pipeline stages.

## Current State
inputs.json is untyped. No schema validation.

## Target State
Process definitions include input/output JSON schemas. Validation at run:create time. Validation between pipeline stages. Type-safe process composition.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Runtime | `packages/sdk/src/runtime/` |
| Storage | `packages/sdk/src/storage/` |
| Process definitions | `.a5c/processes/` |

## Recommendation
M0 (Quick Wins) implementation. Add inputSchema/outputSchema to process metadata. Validate inputs.json against schema at run creation.
