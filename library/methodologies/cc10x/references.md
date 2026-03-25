# CC10X References and Attribution

## Primary Source

- **Repository**: [https://github.com/romiluz13/cc10x](https://github.com/romiluz13/cc10x)
- **Author**: Rom Iluz
- **Description**: Intelligent orchestration system for Claude Code that automatically detects user intent and dispatches appropriate agents with specialized skills

## Concepts Adapted

The following CC10X concepts have been adapted into babysitter process definitions:

### Workflows (mapped to process files)
- **BUILD workflow**: TDD-enforced feature development -> `cc10x-build.js`
- **DEBUG workflow**: Log-first bug investigation -> `cc10x-debug.js`
- **REVIEW workflow**: Multi-dimensional code analysis -> `cc10x-review.js`
- **PLAN workflow**: Comprehensive planning with research -> `cc10x-plan.js`
- **Router**: Intent detection and dispatch -> `cc10x-router.js`

### Agents (mapped to agent definitions)
- **cc10x-router**: Single entry point orchestrator -> `agents/cc10x-router/`
- **component-builder**: TDD feature developer -> `agents/component-builder/`
- **bug-investigator**: Log-first debugger -> `agents/bug-investigator/`
- **code-reviewer**: Multi-dimensional quality assessor -> `agents/code-reviewer/`
- **silent-failure-hunter**: Error handling gap detector -> `agents/silent-failure-hunter/`
- **integration-verifier**: Evidence-backed E2E validator -> `agents/integration-verifier/`
- **planner**: Comprehensive planning agent -> `agents/planner/`
- **github-researcher**: External research agent -> `agents/github-researcher/`

### Skills (mapped to skill definitions)
- **session-memory**: Context persistence -> `skills/session-memory/`
- **verification-before-completion**: Evidence enforcement -> `skills/verification-before-completion/`
- **test-driven-development**: TDD enforcement -> `skills/test-driven-development/`
- **code-generation**: Minimal code output -> `skills/code-generation/`
- **debugging-patterns**: Root cause frameworks -> `skills/debugging-patterns/`
- **code-review-patterns**: Quality assessment -> `skills/code-review-patterns/`
- **planning-patterns**: Structured planning -> `skills/planning-patterns/`
- **architecture-patterns**: System design -> `skills/architecture-patterns/`

### Core Mechanisms
- **Intent Router**: Priority-based detection (ERROR > PLAN > REVIEW > BUILD default)
- **Router Contract**: Machine-readable validation (STATUS, BLOCKING, REQUIRES_REMEDIATION)
- **Remediation Loop**: REM-FIX tasks with 2-cycle cap
- **Memory Persistence**: Three-surface system (activeContext, patterns, progress)
- **Confidence Gating**: 80% threshold for issue reporting
- **Parallel Execution**: Concurrent agent chains (code-reviewer || silent-failure-hunter)
- **Plan-to-Build Continuity**: Plans saved to docs/plans/ and referenced in BUILD

### Key Commands (mapped to process steps)
- Intent routing -> cc10x-router detect-intent task
- BUILD workflow -> cc10x-build process (TDD RED/GREEN/REFACTOR)
- DEBUG workflow -> cc10x-debug process (log-first investigation)
- REVIEW workflow -> cc10x-review process (4-dimension parallel analysis)
- PLAN workflow -> cc10x-plan process (research + brainstorming + plan creation)
- Contract validation -> cc10x-router validate-contract task
- Remediation -> cc10x-router remediation task
- Memory update -> cc10x-router update-memory task

## Acknowledgment

This adaptation brings CC10X's intelligent workflow orchestration patterns into the babysitter process framework. All credit for the original concepts, terminology, and design philosophy belongs to Rom Iluz and the CC10X project contributors.
