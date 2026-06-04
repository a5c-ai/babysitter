# GAP-TOOLS-012: Language Server Protocol Integration for Code-Aware Routing

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Integrate Language Server Protocol (LSP) awareness into the orchestrator's task routing and code analysis capabilities. When process definitions involve code modifications, the orchestrator should be able to query LSP servers for type information, references, diagnostics, and completions to make smarter routing decisions and validate task results.

## Current State
Code-aware tasks are delegated to harnesses blindly. The orchestrator has no understanding of the codebase's type system, symbol references, or diagnostic state. Task validation relies entirely on the delegated harness reporting success/failure. No LSP client exists in the SDK.

## Target State
An optional LSP client module that the orchestrator can use to: query symbol definitions and references before delegating refactoring tasks, validate that delegated code changes produce no new diagnostics, provide type context to task prompts for code-aware harnesses, and support go-to-definition routing for cross-package tasks in the monorepo.

## Dependencies
- [GAP-ROUTE-001](../effect-routing/GAP-ROUTE-001.md) -- smart routing engine for code-context-enriched routing
- [GAP-PROC-004](../process-composition/GAP-PROC-004.md) -- parameter schemas for typed code task inputs

## Key Files
| Component | Path |
|-----------|------|
| Harness adapters | `packages/sdk/src/harness/` |
| Task definitions | `packages/sdk/src/tasks/` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |

## Recommendation
Phase 3-4 implementation. Start with a lightweight LSP client that can query diagnostics and symbol info. Use diagnostics as a post-task validation step. Enrich task prompts with type context for code-modification tasks.
