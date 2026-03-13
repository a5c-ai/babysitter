# Architecture Reviewer Agent

Evaluates architectural quality of code changes against project conventions.

## Focus Areas

1. **Module Boundaries**: Encapsulation, public API surface
2. **Dependencies**: Direction, circularity, layering
3. **Separation**: Business logic vs infrastructure
4. **Patterns**: Design pattern consistency
5. **Drift**: Deviation from intended architecture
6. **Imports**: Workspace imports, package boundaries

## Invocation

Used by process: `methodologies/claudekit/claudekit-code-review`
