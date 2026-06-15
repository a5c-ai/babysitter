# CloudAI-X/claude-workflow-v2

- **Archetype**: claude-plugin
- **Stars**: 1,324
- **Last pushed**: 2026-02-14
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 14

## Summary
Universal Claude Code workflow plugin with agents, skills, hooks, and commands. Provides 14 skills covering the full software development lifecycle: analyzing projects, database design, API design, architecture, testing, DevOps, error handling, git management, performance optimization, parallel execution, security patterns, and web design. The parallel-execution skill documents patterns for spawning concurrent subagents using the Task tool with run_in_background. Topics: agent-skills, workflow, claude-code, codex, cursor.

## Assessment
MEDIUM VALUE. The parallel execution skill is directly relevant to babysitter's orchestration model -- it documents the pattern of spawning multiple subagents in a single assistant message for true parallelism, with guidelines for task independence verification. The architecture design skill provides a clean pattern selection guide (by project size and team size) with a checklist-based workflow. The breadth across 14 SDLC phases means this is essentially a lightweight development methodology encoded as skills. However, the skills are fairly generic -- they provide frameworks and checklists rather than deep domain expertise.

## Extraction Priority
- Medium
- Rationale: The parallel execution patterns and architecture decision frameworks are transferable. The SDLC coverage provides a useful reference for what development phases people want agent skills for. But individual skills lack the depth of purpose-built alternatives.

## Processes
- **Parallel Subagent Orchestration**: Identify parallelizable tasks -> verify independence -> prepare per-subagent prompts with role + context + files + output format -> launch all in single message -> collect results. Directly maps to babysitter's ctx.parallel.all() pattern.
- **Architecture Decision Workflow**: Understand requirements -> assess project size/team -> select pattern (from decision matrix) -> define directory structure -> document tradeoffs -> validate against framework. A planning-phase process with checklist tracking.
- **Full SDLC Skill Suite**: 14 skills covering analyze -> design (API, DB, architecture) -> implement -> test -> optimize -> deploy -> manage (git, security, errors). A lightweight development methodology.

## Plugin Ideas
- **SDLC Workflow plugin**: Install.md-driven plugin that provides a complete development workflow as a skill suite. Each SDLC phase gets its own skill, with the plugin providing phase sequencing and handoff.

## Patterns
- **Single-message parallel dispatch**: All Task calls must be in a single assistant message for true parallelism. Critical implementation detail for subagent orchestration.
- **Task independence verification**: Before parallelizing, verify: no output dependencies, different file targets, can run simultaneously. A pre-dispatch checklist.
- **Architecture pattern selection matrix**: Two-dimensional selection guide (project size x team size) producing specific pattern recommendations. A reusable decision framework.
- **SDLC phase decomposition**: Breaking the development lifecycle into 14 independent skill-sized units. Each phase is self-contained with its own trigger conditions and skip conditions.
- **Trigger/skip conditions**: Each skill specifies both when to load AND when to skip. Prevents unnecessary skill activation.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Parallel Subagent Orchestration | UPGRADE | Enhanced single-message parallel dispatch with task independence verification | library/specializations/shared/orchestration-patterns.js | specializations/shared/parallel-subagent-orchestration.js |
| Architecture Decision Workflow | UPGRADE | Pattern selection matrix with project/team size considerations | library/specializations/architecture/ | specializations/architecture/architecture-decision-workflow.js |
| Task Independence Verification | NEW | Pre-dispatch checklist for parallel task validation | - | specializations/shared/task-independence-verification.js |
| SDLC Phase Management | NEW | 14-phase software development lifecycle with trigger/skip conditions | - | methodologies/sdlc-phase-management/ |
| Database Design Planning | UPGRADE | Database schema design with relationship modeling | library/specializations/data-science-ml/ | specializations/data-science-ml/database-design-planning.js |
| API Design Workflow | UPGRADE | RESTful API design with endpoint planning and documentation | library/specializations/shared/ | specializations/shared/api-design-workflow.js |
| Performance Optimization Strategy | UPGRADE | Performance bottleneck identification and optimization planning | library/specializations/shared/ | specializations/shared/performance-optimization-strategy.js |
| Security Pattern Implementation | UPGRADE | Security best practices and threat mitigation patterns | library/specializations/security-compliance/ | specializations/security-compliance/security-pattern-implementation.js |
| Git Workflow Management | UPGRADE | Git branching strategy and workflow optimization | library/specializations/shared/ | specializations/shared/git-workflow-management.js |
| Error Handling Strategy Design | NEW | Comprehensive error handling and recovery pattern design | - | specializations/shared/error-handling-strategy-design.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Architecture Decision Matrix | NEW | Interactive architecture pattern selection tool with team/project size inputs | - | plugins/a5c/marketplace/blueprints/architecture-decision-matrix/ |
