# CC10X Methodology

Intelligent workflow orchestration for Claude Code development. CC10X routes all development requests through a single entry point that detects intent and dispatches to specialized workflows with evidence-first validation, TDD enforcement, and persistent session memory.

## Core Principles

1. **Single Entry Point**: The cc10x-router handles all requests -- no manual skill selection
2. **Evidence-First**: All claims backed by logs, test results, or exit codes (zero = success)
3. **TDD Enforcement**: RED-GREEN-REFACTOR is mandatory during builds; tests are never skipped
4. **Memory Persistence**: Context survives across sessions via three memory surfaces
5. **Confidence Gating**: Issues reported must reach >=80% confidence; vague feedback rejected
6. **Parallel Execution**: Agents run simultaneously when possible (~30-50% faster)

## Workflows

| Workflow | Trigger | Agent Chain |
|----------|---------|-------------|
| **BUILD** | build, implement, create, make, write, add | component-builder -> [code-reviewer \|\| silent-failure-hunter] -> integration-verifier |
| **DEBUG** | debug, fix, error, bug, broken, troubleshoot | bug-investigator -> code-reviewer -> integration-verifier |
| **REVIEW** | review, audit, check, analyze, assess | code-reviewer (multi-dimensional) |
| **PLAN** | plan, design, architect, roadmap, strategy | planner (with github-researcher) |

## Process Files

| File | Process ID | Description |
|------|-----------|-------------|
| `cc10x-router.js` | `methodologies/cc10x/cc10x-router` | Single entry point: intent detection, workflow dispatch, contract validation, memory persistence |
| `cc10x-build.js` | `methodologies/cc10x/cc10x-build` | BUILD workflow: TDD cycle, parallel review, integration verification |
| `cc10x-debug.js` | `methodologies/cc10x/cc10x-debug` | DEBUG workflow: log-first investigation, targeted fix, verification |
| `cc10x-review.js` | `methodologies/cc10x/cc10x-review` | REVIEW workflow: 4-dimension parallel analysis with confidence scoring |
| `cc10x-plan.js` | `methodologies/cc10x/cc10x-plan` | PLAN workflow: research, brainstorming, plan creation with build continuity |

## Agents (8)

| Agent | Role | Used In |
|-------|------|---------|
| `cc10x-router` | Intent detection and workflow orchestration | All workflows |
| `component-builder` | TDD feature development | BUILD |
| `bug-investigator` | Log-first root cause analysis | DEBUG |
| `code-reviewer` | Multi-dimensional quality assessment | BUILD, DEBUG, REVIEW |
| `silent-failure-hunter` | Error handling gap detection | BUILD |
| `integration-verifier` | Evidence-backed E2E validation | BUILD, DEBUG |
| `planner` | Comprehensive planning with research | PLAN |
| `github-researcher` | GitHub repository and package research | PLAN, DEBUG |

## Skills (8)

| Skill | Purpose |
|-------|---------|
| `session-memory` | Context persistence across message compaction |
| `verification-before-completion` | Evidence requirement enforcement |
| `test-driven-development` | RED-GREEN-REFACTOR enforcement |
| `code-generation` | Minimal, pattern-matching code output |
| `debugging-patterns` | Root cause analysis frameworks |
| `code-review-patterns` | Security, quality, performance assessment |
| `planning-patterns` | Structured planning methodology |
| `architecture-patterns` | System and API design guidance |

## Memory System

Three files in `.claude/cc10x/`:

- **activeContext.md** -- current focus, decisions, learnings, blockers
- **patterns.md** -- project conventions, gotchas, architectural decisions
- **progress.md** -- completed work, remaining tasks, verification results

## Router Contract

Every agent output includes a machine-readable contract:
- **STATUS**: PASS, FAIL, APPROVE, REJECT, NEEDS_REMEDIATION
- **BLOCKING**: whether workflow can proceed
- **REQUIRES_REMEDIATION**: whether REM-FIX task is needed
- **Issue counts**: critical and high severity tallies
- **Memory notes**: items to persist for future sessions

## Plan-to-Build Continuity

Plans created by the PLAN workflow are saved to `docs/plans/` and referenced in session memory. The BUILD workflow reads these plans during the requirements clarification phase, ensuring consistency between strategy and execution.

## Attribution

Adapted from [CC10X](https://github.com/romiluz13/cc10x) by Rom Iluz.
