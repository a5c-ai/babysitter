# Everything Claude Code References and Attribution

## Primary Source

- **Repository**: [https://github.com/affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **Author**: Affaan M
- **Description**: Performance optimization system for AI agent harnesses that enhances Claude Code through integrated skills, instincts, memory optimization, continuous learning, security scanning, and research-first development workflows

## Concepts Adapted

The following Everything Claude Code concepts have been adapted into babysitter process definitions:

### Subagents (mapped to agent definitions)
- **Planner**: Implementation planning with research-first approach -> `agents/planner/`
- **Architect**: System design with testability focus -> `agents/architect/`
- **TDD-Guide**: Red-Green-Refactor enforcement -> `agents/tdd-guide/`
- **Code-Reviewer**: Multi-dimensional quality review -> `agents/code-reviewer/`
- **Security-Reviewer**: AgentShield vulnerability detection -> `agents/security-reviewer/`
- **Build-Error-Resolver**: Build error resolution -> `agents/build-resolver/`
- **E2E-Runner**: Playwright POM testing -> `agents/e2e-runner/`
- **Refactor-Cleaner**: Code cleanup -> `agents/refactor-cleaner/`

### Skills (mapped to skill definitions)
- **TDD enforcement**: Red-Green-Refactor methodology -> `skills/tdd-enforcement/`
- **Security scanning**: AgentShield 5-category audit -> `skills/security-scanning/`
- **Continuous learning**: Pattern extraction pipeline -> `skills/continuous-learning/`
- **Context engineering**: Dynamic injection and compaction -> `skills/context-engineering/`
- **Multi-service orchestration**: PM2 and cascade execution -> `skills/multi-service-orchestration/`
- **Code review pipeline**: 4-dimension review -> `skills/code-review-pipeline/`
- **Research-first development**: Investigate before implementing -> `skills/research-first-dev/`
- **Eval harness**: Quality benchmarking -> `skills/eval-harness/`

### Processes (mapped to process files)
- **Full lifecycle orchestration**: Planning through deployment -> `ecc-orchestrator.js`
- **TDD workflow**: Red-Green-Refactor with coverage convergence -> `ecc-tdd-workflow.js`
- **Security pipeline**: AgentShield 5-category scan -> `ecc-security-pipeline.js`
- **Continuous learning**: Pattern extraction and skill creation -> `ecc-continuous-learning.js`
- **Multi-service orchestration**: PM2, cascade, parallel execution -> `ecc-multi-service.js`

### Core Mechanisms Adapted
- **13 Specialized Subagents**: Mapped to 8 babysitter agent definitions (consolidated related agents)
- **56+ Skills**: Mapped to 8 babysitter skill definitions (consolidated by category)
- **32 Slash Commands**: Mapped to process steps and breakpoints
- **AgentShield Security Auditor**: 102 rules, 5 categories, optional red-team
- **Continuous Learning Pipeline**: Extract -> evaluate -> create -> organize -> export
- **Context Engineering**: Mode switching (dev/review/research), selective loading, compaction
- **Rules System**: Coding style, git workflow, testing, performance
- **Hook System**: Session lifecycle, pre-compaction state preservation, pattern extraction
- **Verification Loops**: Convergence-based coverage and quality gates
- **Parallelization**: Concurrent agent execution, worktree isolation
- **Cross-Platform Detection**: Package manager, language, test runner, CI/CD

### Key Commands Mapped
- `/plan` -> planner agent in ecc-orchestrator
- `/tdd` -> ecc-tdd-workflow process
- `/e2e` -> e2e-runner agent in ecc-orchestrator
- `/code-review` -> code-reviewer agent in ecc-orchestrator
- `/build-fix` -> build-resolver agent in ecc-orchestrator
- `/refactor-clean` -> refactor-cleaner agent in ecc-orchestrator
- `/security-scan` -> ecc-security-pipeline process
- `/skill-create` -> ecc-continuous-learning process
- `/evolve` -> continuous learning skill
- `/multi-plan/execute/backend/frontend` -> ecc-multi-service process
- `/eval` -> eval-harness skill
- `/test-coverage` -> coverage convergence in ecc-tdd-workflow
- `/update-docs` -> deployment check in ecc-orchestrator

## Acknowledgment

This adaptation brings the Everything Claude Code performance optimization system into the babysitter process framework. All credit for the original concepts, terminology, design philosophy, AgentShield security auditor, and continuous learning pipeline belongs to Affaan M and the Everything Claude Code project contributors.
