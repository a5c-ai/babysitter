# Everything Claude Code Methodology

Performance optimization system for AI agent harnesses, adapted from the [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) project. Integrates specialized subagents, skills, continuous learning, security scanning, and research-first development workflows into babysitter process definitions.

## Core Principles

1. **Research-First Development**: Always investigate existing solutions before writing code
2. **TDD Enforcement**: Red-Green-Refactor is mandatory; 80% coverage threshold
3. **Multi-Dimensional Review**: 4-axis code review with confidence-gated reporting (>= 80%)
4. **AgentShield Security**: 5-category security scanning with 102 static analysis rules
5. **Continuous Learning**: Auto-extract patterns from sessions and convert to reusable skills
6. **Context Engineering**: Dynamic context injection, mode switching, strategic compaction
7. **Evidence-Based Verification**: All claims backed by exit codes, coverage numbers, or test results

## Process Files (5)

| File | Process ID | Description |
|------|-----------|-------------|
| `ecc-orchestrator.js` | `methodologies/everything-claude-code/ecc-orchestrator` | Full lifecycle: planning -> TDD -> implementation -> review -> security -> deploy -> learning |
| `ecc-tdd-workflow.js` | `methodologies/everything-claude-code/ecc-tdd-workflow` | TDD cycle: strategy -> RED -> GREEN -> REFACTOR -> coverage convergence |
| `ecc-security-pipeline.js` | `methodologies/everything-claude-code/ecc-security-pipeline` | AgentShield: 5-category parallel scan -> red team -> report synthesis |
| `ecc-continuous-learning.js` | `methodologies/everything-claude-code/ecc-continuous-learning` | Learning: extract -> evaluate -> create skills -> organize -> export |
| `ecc-multi-service.js` | `methodologies/everything-claude-code/ecc-multi-service` | Multi-service: discover -> cascade/parallel build -> PM2 -> integration test |

## Agents (8)

| Agent | Role | Used In |
|-------|------|---------|
| `planner` | Research-first implementation planning | Orchestrator |
| `architect` | System design with testability focus | Orchestrator, Multi-Service |
| `tdd-guide` | Red-Green-Refactor enforcement | Orchestrator, TDD Workflow |
| `code-reviewer` | Multi-dimensional quality review | Orchestrator |
| `security-reviewer` | AgentShield 5-category scanning | Orchestrator, Security Pipeline |
| `build-resolver` | Build error resolution | Orchestrator, Multi-Service |
| `e2e-runner` | Playwright POM end-to-end testing | Orchestrator, Multi-Service |
| `refactor-cleaner` | Review-guided code cleanup | Orchestrator |

## Skills (8)

| Skill | Purpose |
|-------|---------|
| `tdd-enforcement` | Red-Green-Refactor with 80% coverage gating |
| `security-scanning` | AgentShield 5-category audit with 102 rules |
| `continuous-learning` | Pattern extraction and skill creation pipeline |
| `context-engineering` | Dynamic context injection and strategic compaction |
| `multi-service-orchestration` | PM2, cascade/parallel execution, cross-service testing |
| `code-review-pipeline` | 4-dimension review with confidence gating |
| `research-first-dev` | Investigate before implementing |
| `eval-harness` | Agent and skill quality benchmarking |

## Key Patterns

- **Remediation Loop**: Review findings trigger refactor-cleaner, re-review, max 2 cycles
- **Coverage Convergence**: Iterative test addition until 80% threshold met (max 3 iterations)
- **Parallel Execution**: Code review and security scan run concurrently
- **Breakpoints**: Plan review, coverage threshold, critical findings, deployment approval
- **Cascade Execution**: Topological build order for dependent services
- **Worktree Parallelism**: Git worktree isolation for independent service builds

## Attribution

Adapted from [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) by Affaan M.
