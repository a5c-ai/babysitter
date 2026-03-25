# RPIKit Methodology

**Source**: [bostonaholic/rpikit](https://github.com/bostonaholic/rpikit) by Matthew Boston
**Category**: Structured Software Development / Research-Plan-Implement Framework
**License**: See upstream repository

## Overview

RPIKit implements the Research-Plan-Implement (RPI) framework for disciplined AI-assisted software development. It enforces structured progression through distinct phases with human approval checkpoints, stakes-based rigor scaling, and mandatory verification at every step.

## Core Principles

- **Iron Law**: "Do NOT explore the codebase until the problem is understood"
- **Stakes-Based Rigor**: Planning intensity scales with change risk (low/medium/high)
- **Test-First**: Every code-changing task specifies tests before implementation
- **Verification-Before-Completion**: Never declare done without running verification
- **Human Approval Gates**: Explicit human approval between major phases
- **Soft-Gating Reviews**: Code and security reviews preserve user autonomy

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Brainstorm | `rpikit-brainstorm.js` | Clarify vague requirements through exploration | 3 |
| Research | `rpikit-research.js` | Systematic codebase exploration (Iron Law) | 5 |
| Plan | `rpikit-plan.js` | Stakes-based implementation planning with test-first | 7 |
| Implement | `rpikit-implement.js` | Disciplined plan execution with verification | 7 |
| Review | `rpikit-review.js` | Combined code quality and security review | 4 |
| Decision | `rpikit-decision.js` | Architecture Decision Records (ADRs) | 3 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| codebase-research | `skills/codebase-research/` | Systematic codebase exploration (Iron Law) |
| plan-writing | `skills/plan-writing/` | Stakes-based implementation planning |
| plan-implementation | `skills/plan-implementation/` | Disciplined plan execution with verification |
| code-review | `skills/code-review/` | Structured code quality assessment |
| security-review | `skills/security-review/` | Security vulnerability assessment |
| brainstorming | `skills/brainstorming/` | Requirement clarification for vague goals |
| decision-documentation | `skills/decision-documentation/` | Architecture Decision Records |
| test-driven-development | `skills/test-driven-development/` | Test-first development practice |
| systematic-debugging | `skills/systematic-debugging/` | Hypothesis-driven defect investigation |
| verification | `skills/verification/` | Verification-before-completion discipline |
| finishing-work | `skills/finishing-work/` | Final completion and summary protocol |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| file-finder | `agents/file-finder/` | File Discovery Specialist |
| web-researcher | `agents/web-researcher/` | External Context Gatherer |
| code-reviewer | `agents/code-reviewer/` | Code Quality Assessor |
| security-reviewer | `agents/security-reviewer/` | Security Vulnerability Assessor |
| test-runner | `agents/test-runner/` | Test Execution Specialist |
| verifier | `agents/verifier/` | Implementation Verifier |
| debugger | `agents/debugger/` | Defect Investigator |

## Workflow Lifecycle

```
[Optional] Brainstorm ("what to build") -> Research (Iron Law) -> Plan (stakes-based) -> Implement (verify each step) -> Review (code + security) -> Done
                                                                                                     ^                              |
                                                                                                     +--- Decision (ADR at any point) ---+
```

Cross-cutting concerns applied throughout:
- `verification` - Every step verified before proceeding
- `test-driven-development` - Tests specified before implementation
- `systematic-debugging` - Failures investigated with hypothesis-driven methodology
- `finishing-work` - Completion confirmed against success criteria

## Stakes Classification

| Level | Profile | Planning Approach |
|-------|---------|-------------------|
| Low | Isolated, reversible, minimal impact | Brief plan, inline if needed |
| Medium | Multiple files, moderate scope, testable | Standard RPI cycle |
| High | Architectural, difficult rollback, security-sensitive | Comprehensive research and detailed planning required |

## Output Artifacts

- `docs/plans/YYYY-MM-DD-<topic>-research.md` - Research findings
- `docs/plans/YYYY-MM-DD-<topic>-plan.md` - Implementation plans
- `docs/decisions/NNNN-<title>.md` - Architecture Decision Records

## Philosophy

- **Understand before acting** - Research before planning
- **Plan before coding** - Plans before implementation
- **Implement with discipline** - Step-by-step verification
- **Scale rigor to risk** - Stakes-based planning depth
- **Preserve autonomy** - Reviews are soft gates, humans decide
