# GAP-TOOLS-027: Skill Discovery and Invocation from Process Definitions

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Enable process definitions to discover and invoke installed skills as first-class orchestration primitives. Skills should be composable building blocks that processes can call, similar to how processes call tasks, but with the full skill context (SKILL.md instructions, required tools, configuration).

## Current State
The `skill:discover` CLI command lists available skills. Skills are invoked via harness wrappers (the harness reads SKILL.md and follows its instructions). However, process definitions cannot programmatically discover or invoke skills. There is no `ctx.skill()` intrinsic. Skills and processes are separate worlds -- skills are harness-driven, processes are orchestrator-driven.

## Target State
A skill registry queryable from process definitions. A `ctx.skill(skillId, inputs)` intrinsic that delegates skill execution to a capable harness. Skill results flow back through the effect system. Skill capabilities factor into harness routing (if a skill requires specific tools, route to a harness that has them). Skills become composable within processes.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability routing for skill-capable harnesses
- [GAP-PROC-001](../process-composition/GAP-PROC-001.md) -- process chaining patterns applicable to skill invocation

## Key Files
| Component | Path |
|-----------|------|
| Skill discovery | `packages/sdk/src/cli/` |
| Plugin package reader | `packages/sdk/src/plugins/packageReader.ts` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 3 implementation. Build a skill registry from `skill:discover` output. Add `ctx.skill()` to ProcessContext. Route skill invocations through effect system to capable harnesses.
