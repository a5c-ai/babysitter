# GSD Skills & Agents Backlog

Future skills and agents ideas for the GSD methodology enrichment. Items are organized by priority and category.

## High Priority

### Agents

- **gsd-refactorer** - Dedicated refactoring agent that understands codebase patterns (from map-codebase output) and can restructure code while preserving behavior. Pairs with gsd-verifier to ensure no regressions.
- **gsd-reviewer** - Code review agent that applies project conventions (from CONVENTIONS.md) and catches issues before commits. Could run as a pre-commit hook via the hooks system.
- **gsd-migrator** - Database/schema migration agent that generates migration files, validates rollback paths, and integrates with the git-integration skill for atomic migration commits.

### Skills

- **dependency-analysis** - Analyze project dependencies for security vulnerabilities, outdated versions, and license compliance. Produce a DEPENDENCIES.md report.
- **performance-profiling** - Skill for running performance benchmarks, detecting regressions, and producing performance reports. Integrates with verification-suite.
- **documentation-generation** - Auto-generate API docs, component docs, and architecture diagrams from codebase analysis. Uses template-scaffolding for output formatting.

## Medium Priority

### Agents

- **gsd-ops-planner** - Infrastructure and deployment planning agent. Takes deployment requirements and produces CI/CD pipeline configurations, Dockerfiles, and deployment runbooks.
- **gsd-accessibility-checker** - Audit UI components for WCAG compliance. Produces accessibility reports and fix recommendations.
- **gsd-api-designer** - Design RESTful/GraphQL APIs from requirements. Produces OpenAPI specs or GraphQL schemas with validation.
- **gsd-security-auditor** - Security-focused agent that reviews code for common vulnerabilities (OWASP top 10), dependency issues, and configuration problems.

### Skills

- **changelog-management** - Maintain CHANGELOG.md automatically from commit history and phase summaries. Follows Keep a Changelog format.
- **issue-tracking-sync** - Bidirectional sync between .planning/ state and external issue trackers (GitHub Issues, Linear, Jira).
- **cost-estimation** - Estimate token costs for planned workflows based on model-profile-resolution and expected agent invocations.
- **parallel-orchestration** - Advanced wave scheduling that considers resource constraints, context window budgets, and dependency graphs for optimal parallelism.

## Low Priority / Exploratory

### Agents

- **gsd-ux-researcher** - User research agent that generates interview scripts, surveys, and analyzes feedback data.
- **gsd-data-modeler** - Design data models from requirements with entity-relationship diagrams and migration paths.
- **gsd-test-strategist** - Design comprehensive test strategies (unit, integration, E2E, performance, chaos) from requirements.

### Skills

- **multi-repo-coordination** - Coordinate changes across multiple repositories in a monorepo or multi-repo setup.
- **rollback-manager** - Automated rollback capabilities when verification fails, including git revert, state restoration, and notification.
- **metric-collection** - Track process metrics (time per phase, iteration counts, quality scores over time) for process improvement.
- **natural-language-query** - Query .planning/ state using natural language (e.g., "what phases are blocked?" -> parse STATE.md and ROADMAP.md).

## Integration Ideas

- **CI/CD hooks** - Trigger GSD processes from CI events (PR opened -> run verify-work, merge to main -> run audit-milestone).
- **IDE integration** - VS Code extension that surfaces STATE.md, progress, and next actions in the editor sidebar.
- **Notification system** - Breakpoint notifications via Slack, email, or webhook when human input is needed.
- **Process analytics dashboard** - Visualize project progress, quality trends, and process efficiency over time.

## Notes

- All new agents should follow the AGENT.md format in `agents/` directory.
- All new skills should follow the SKILL.md format in `skills/` directory.
- Priority should be re-evaluated after each milestone completion based on user feedback.
- Consider composability: new agents/skills should integrate with existing ones rather than duplicating functionality.
