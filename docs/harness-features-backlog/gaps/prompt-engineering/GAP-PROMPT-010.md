# GAP-PROMPT-010: Safety and Reversibility Prompt Framework

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | High |
| Effort | S |
| Status | Missing |

## Description
Inject safety and reversibility reasoning instructions into task prompts so delegated agents assess blast radius before executing destructive or hard-to-reverse actions. Complements the breakpoint system (which gates on approval) with proactive reasoning (which prevents the agent from attempting risky actions without consideration).

## Current State
The breakpoint system gates on user approval for risky operations. However, process prompts do not instruct delegated agents to reason about reversibility or blast radius. CC has built-in safety instructions ("Carefully consider the reversibility and blast radius of actions") but non-CC harnesses lack these. The security gaps (GAP-SEC-*) cover governance and permissions but not prompt-level safety reasoning.

## Target State
A `safetyGuidelines` prompt section injected into task prompts that includes: reversibility assessment framework (freely take local reversible actions, check before destructive ones), specific examples of destructive vs. safe operations, cyber risk boundaries (authorized security testing yes, destructive techniques no), blast radius reasoning for shared system operations. Configurable severity levels per process definition.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for section placement
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for rule definitions

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Breakpoints | `packages/sdk/src/breakpoints/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 4 (Safety and Security) has exact CC phrasing for reversibility and cyber risk |

## Recommendation
Phase 2 implementation. Small effort -- extract safety phrasing from CC analysis, add as prompt section for task prompts. High impact for preventing delegated agent mishaps.
