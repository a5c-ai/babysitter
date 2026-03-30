# Pilot Shell Methodology for Babysitter SDK

Adapted from [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter -- a spec-driven development framework with strict TDD, quality hooks, and persistent memory.

## Overview

Pilot Shell is a comprehensive development methodology that enforces spec-driven planning, strict test-driven development (RED->GREEN->REFACTOR), automated quality pipelines, and cross-session persistent memory. This adaptation implements all core workflows as Babysitter SDK process definitions with full orchestration support.

## Process Files

| File | Process ID | Description | Tasks |
|------|-----------|-------------|-------|
| `pilot-shell-orchestrator.js` | `pilot-shell/orchestrator` | Full lifecycle: mode routing -> plan -> implement -> verify -> merge | 17 |
| `pilot-shell-feature.js` | `pilot-shell/feature` | Feature mode: semantic search -> spec -> TDD -> unified review -> merge | 14 |
| `pilot-shell-bugfix.js` | `pilot-shell/bugfix` | Bugfix mode: analysis -> behavior contract -> test-before-fix -> verify | 9 |
| `pilot-shell-sync.js` | `pilot-shell/sync` | Codebase sync: explore -> index -> conventions -> rules | 8 |
| `pilot-shell-quality-pipeline.js` | `pilot-shell/quality-pipeline` | Quality hooks: lint/format/typecheck -> TDD -> context monitoring | 9 |

## Skills

| Directory | Name | Description |
|-----------|------|-------------|
| `skills/spec-driven-development/` | spec-driven-development | Spec creation via semantic search and structured planning |
| `skills/strict-tdd/` | strict-tdd | RED->GREEN->REFACTOR enforcement with compliance scoring |
| `skills/behavior-contract/` | behavior-contract | Bug condition/postcondition formalization |
| `skills/quality-hooks/` | quality-hooks | Language-specific lint/format/typecheck pipeline |
| `skills/context-preservation/` | context-preservation | State capture/restore across compactions |
| `skills/persistent-memory/` | persistent-memory | Cross-session observation storage and retrieval |
| `skills/worktree-isolation/` | worktree-isolation | Git worktree management for safe development |
| `skills/codebase-sync/` | codebase-sync | Convention discovery and rule generation |

## Agents

| Directory | Name | Role |
|-----------|------|------|
| `agents/plan-reviewer/` | plan-reviewer | Spec completeness validation, assumption challenging |
| `agents/unified-reviewer/` | unified-reviewer | Compliance + quality + goal alignment review |
| `agents/tdd-enforcer/` | tdd-enforcer | Test-first implementation verification |
| `agents/file-checker/` | file-checker | Language-specific lint/format/typecheck |
| `agents/context-monitor/` | context-monitor | Context usage tracking and threshold alerts |
| `agents/spec-guard/` | spec-guard | Prevents premature completion of incomplete specs |
| `agents/memory-curator/` | memory-curator | Observation capture and skill extraction |

## Execution Modes

### Feature Mode (`mode: 'feature'`)
Full spec-driven lifecycle:
1. **PLAN**: Semantic search -> clarifying questions -> spec -> plan-reviewer validation (conditional) -> approval
2. **IMPLEMENT**: Git worktree -> strict TDD RED->GREEN->REFACTOR per task -> quality hooks -> full test suite
3. **VERIFY**: Full tests -> unified review (compliance + quality + goals) -> auto-fixes -> squash merge

### Bugfix Mode (`mode: 'bugfix'`)
Systematic bug resolution:
1. **ANALYSIS**: Trace to file:line -> root cause -> blast radius assessment
2. **CONTRACT**: Bug Condition + Postcondition + Invariants = Behavior Contract
3. **TEST-BEFORE-FIX**: Failing bug test (RED) -> preservation tests -> minimal fix (GREEN) -> verify
4. **VERIFY**: Behavior Contract audit + full suite + lint

### Quick Mode (`mode: 'quick'`)
Chat-based iteration without planning scaffolding. TDD still enforced.

## Quality Pipeline

Supported tool chains:
- **Python**: ruff + pyright
- **TypeScript/JavaScript**: prettier + eslint + tsc
- **Go**: gofmt + golangci-lint

Auto-fix convergence loop: up to 3 iterations of fix-and-recheck.

## Model Routing (Informational)

The original Pilot Shell uses model routing. In Babysitter SDK, this is informational context for agent configuration:
- **Planning**: Opus (reasoning-heavy tasks)
- **Plan Verification**: Sonnet (conditional review)
- **Implementation**: Sonnet (fast execution)
- **Code Verification**: Sonnet (unified review)

## Examples

See `examples/` directory for input JSON examples for each process.

## Attribution

All processes, skills, and agents in this directory are adapted from [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter. See `references.md` for detailed attribution.
