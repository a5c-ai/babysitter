# Superpowers Extended Methodology

**Source**: [pcvelz/superpowers](https://github.com/pcvelz/superpowers) (Community fork of [obra/superpowers](https://github.com/obra/superpowers))
**Category**: Full Development Lifecycle / Agentic Software Development
**License**: MIT

## Overview

The Superpowers Extended methodology provides a complete agentic software development lifecycle with structured skills, subagent-driven execution, and quality gates at every stage. It enforces disciplined workflows: brainstorm before coding, test before implementing, verify before claiming completion.

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Full Workflow | `superpowers-workflow.js` | Complete lifecycle orchestrator | 12 |
| Brainstorming | `brainstorming.js` | Socratic design refinement | 5 |
| Writing Plans | `writing-plans.js` | Bite-sized TDD task planning | 4 |
| Executing Plans | `executing-plans.js` | Batch execution with checkpoints | 6 |
| Subagent-Driven Dev | `subagent-driven-development.js` | Fresh agent per task + two-stage review | 6 |
| Test-Driven Dev | `test-driven-development.js` | RED-GREEN-REFACTOR cycles | 7 |
| Systematic Debugging | `systematic-debugging.js` | 4-phase root cause process | 9 |
| Parallel Agents | `dispatching-parallel-agents.js` | Concurrent domain solving | 4 |
| Verification | `verification-before-completion.js` | Evidence-based completion | 3 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| brainstorming | `skills/brainstorming/` | Design before code, Socratic refinement |
| writing-plans | `skills/writing-plans/` | Bite-sized TDD implementation plans |
| executing-plans | `skills/executing-plans/` | Batch execution with checkpoints |
| subagent-driven-development | `skills/subagent-driven-development/` | Fresh agent per task, two-stage review |
| test-driven-development | `skills/test-driven-development/` | RED-GREEN-REFACTOR iron law |
| systematic-debugging | `skills/systematic-debugging/` | 4-phase root cause investigation |
| dispatching-parallel-agents | `skills/dispatching-parallel-agents/` | One agent per independent domain |
| using-git-worktrees | `skills/using-git-worktrees/` | Workspace isolation |
| finishing-a-development-branch | `skills/finishing-a-development-branch/` | Branch completion workflow |
| requesting-code-review | `skills/requesting-code-review/` | Dispatch code reviewer |
| receiving-code-review | `skills/receiving-code-review/` | Handle review feedback |
| verification-before-completion | `skills/verification-before-completion/` | Evidence before claims |
| writing-skills | `skills/writing-skills/` | TDD for skill creation |
| using-superpowers | `skills/using-superpowers/` | Skill discovery and invocation |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| code-reviewer | `agents/code-reviewer/` | Senior code reviewer (plan alignment + quality) |
| implementer | `agents/implementer/` | Task implementation subagent (TDD, self-review) |
| spec-reviewer | `agents/spec-reviewer/` | Spec compliance verification |
| code-quality-reviewer | `agents/code-quality-reviewer/` | Code quality assessment (after spec passes) |

## Workflow Lifecycle

```
brainstorming -> writing-plans -> [setup worktree] -> executing-plans OR subagent-driven-development -> verification -> finishing-a-development-branch
```

Cross-cutting concerns applied throughout:
- `test-driven-development` - All implementation follows TDD
- `systematic-debugging` - All bug investigation follows 4-phase process
- `verification-before-completion` - All claims require evidence
- `requesting-code-review` / `receiving-code-review` - Review between tasks

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
