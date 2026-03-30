# Metaswarm Methodology

**Source**: [dsifry/metaswarm](https://github.com/dsifry/metaswarm) by David Sifry
**Category**: Autonomous Multi-Agent Orchestration / Issue-to-PR Lifecycle
**License**: See upstream repository

## Overview

Metaswarm is an autonomous multi-agent orchestration framework that manages the complete lifecycle from GitHub issue to merged pull request. It coordinates 12 specialized agents through a rigorous 7-phase workflow with quality gates as blocking state transitions, adversarial reviews with fresh reviewers, and knowledge persistence across sessions.

## Core Principles

- **Trust Nothing, Verify Everything, Review Adversarially** - Quality gates are blocking, never advisory
- **TDD Mandatory** - Write tests first, watch them fail, then implement (100% coverage targets)
- **Fresh Reviewer Rule** - On re-review after FAIL, spawn new reviewer with no memory (prevents anchoring bias)
- **Independent Validation** - Orchestrator runs quality gates directly, never trusts subagent self-reports
- **Human Checkpoints** - Planned pauses at critical boundaries (schema changes, security code, new patterns)
- **Knowledge Persistence** - Extract learnings while context is fresh, persist for cross-session continuity

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Issue Orchestrator | `metaswarm-orchestrator.js` | Full 7-phase lifecycle: research to PR | 12 |
| Design Review Gate | `metaswarm-design-review.js` | 6 parallel specialist reviews, unanimous approval | 7 |
| Execution Loop | `metaswarm-execution-loop.js` | 4-phase cycle: Implement -> Validate -> Review -> Commit | 4 |
| Swarm Coordinator | `metaswarm-swarm-coordinator.js` | Multi-issue parallel management across worktrees | 6 |
| Knowledge Cycle | `metaswarm-knowledge-cycle.js` | Context priming and self-reflection | 5 |
| PR Shepherd | `metaswarm-pr-shepherd.js` | PR lifecycle through merge | 3 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| orchestrated-execution | `skills/orchestrated-execution/` | 4-phase execution loop with quality gates |
| design-review-gate | `skills/design-review-gate/` | 6-agent parallel design review |
| plan-review-gate | `skills/plan-review-gate/` | 3 adversarial plan reviewers |
| adversarial-review | `skills/adversarial-review/` | Fresh reviewer with binary PASS/FAIL |
| knowledge-curation | `skills/knowledge-curation/` | Context priming and self-reflection |
| work-unit-decomposition | `skills/work-unit-decomposition/` | DoD items, file scope, dependencies |
| pr-shepherding | `skills/pr-shepherding/` | PR lifecycle management through merge |
| external-tool-coordination | `skills/external-tool-coordination/` | Cross-model AI tool integration |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| issue-orchestrator | `agents/issue-orchestrator/` | Master coordinator per issue |
| researcher | `agents/researcher/` | Codebase exploration and analysis |
| architect | `agents/architect/` | Implementation planning and decomposition |
| product-manager | `agents/product-manager/` | Use case and scope validation |
| designer | `agents/designer/` | UX/API design review |
| security-design | `agents/security-design/` | Threat modeling and OWASP analysis |
| cto | `agents/cto/` | TDD readiness and codebase alignment |
| coder | `agents/coder/` | TDD implementation specialist |
| code-reviewer | `agents/code-reviewer/` | Fresh adversarial reviewer |
| security-auditor | `agents/security-auditor/` | Implementation security review |
| pr-shepherd | `agents/pr-shepherd/` | PR lifecycle management |
| swarm-coordinator | `agents/swarm-coordinator/` | Multi-issue parallel orchestration |

## Workflow Lifecycle

```
Issue -> Research -> Plan -> Plan Review Gate (3 adversarial) -> Preflight -> Design Review Gate (6 parallel, unanimous) -> Work Unit Decomposition -> Execution Loop (Implement -> Validate -> Adversarial Review -> Commit) x N -> Final Review -> Self-Reflect -> PR -> Shepherd -> Merge
```

## Quality Gates (Blocking)

1. **Plan Review Gate** - 3 adversarial reviewers (Feasibility, Completeness, Scope)
2. **Design Review Gate** - 6 parallel specialists (ALL must approve, max 3 iterations)
3. **Quality Gate Validation** - Independent tsc, eslint, vitest (blocking, never advisory)
4. **Adversarial Code Review** - Fresh reviewer, binary PASS/FAIL (max 3 attempts -> escalate)
5. **Coverage Gate** - 100% target across lines/branches/functions/statements

## Anti-Patterns (Enforced)

- Self-certifying (trusting subagent claims)
- Combining execution phases into single steps
- Reusing reviewers after FAIL verdict
- Passing previous review findings to new reviewers
- Treating quality gate failures as advisory
- Proceeding past human checkpoints without explicit approval
- Using --no-verify on commits or force-pushing

## Philosophy

- **Adversarial over collaborative** review for verified compliance
- **Independent validation** over trusted reporting
- **Blocking gates** over advisory recommendations
- **Fresh reviewers** over experienced reviewers (prevent bias)
- **Knowledge extraction** before context is lost
- **Human escalation** after bounded retry (3 attempts)
