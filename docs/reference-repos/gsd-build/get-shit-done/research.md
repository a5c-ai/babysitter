# gsd-build/get-shit-done

- **Full name**: gsd-build/get-shit-done
- **Description**: A light-weight and powerful meta-prompting, context engineering and spec-driven development system for Claude Code
- **Stars**: 51,227
- **License**: MIT
- **Last pushed**: 2026-04-12
- **Topics**: claude-code, context-engineering, meta-prompting, spec-driven-development
- **Fork**: No
- **Source**: gh-search

## Archetype

**methodology-repo** -- A comprehensive spec-driven development system with meta-prompting, context engineering, and multi-agent orchestration. Solves "context rot" by spawning fresh 200K context windows per phase. Has its own SDK, 31 specialized agents, 70+ workflows, template system, and quality gates.

## Structure

```
get-shit-done/
  bin/                # CLI scripts
  contexts/           # Context templates (dev.md, research.md, review.md)
  references/         # 40+ reference docs (gates, TDD, planner patterns, verification, etc.)
  templates/          # 35+ templates (project, milestone, phase, research, etc.)
  workflows/          # 70+ workflow definitions (new-project, execute-plan, verify-phase, etc.)
agents/               # 31 specialized subagents
  gsd-planner.md      # Main planning agent
  gsd-executor.md     # Execution agent
  gsd-verifier.md     # Verification agent
  gsd-code-reviewer.md
  gsd-security-auditor.md
  gsd-debugger.md
  gsd-ui-auditor.md
  gsd-codebase-mapper.md
  ... (31 total)
commands/gsd/         # Slash commands
sdk/                  # TypeScript SDK with tests
hooks/                # Lifecycle hooks
scripts/              # Build/release scripts
tests/                # Test suite
```

## Key Techniques

1. **Context rot mitigation** -- Each phase runs in a fresh 200K context window via subagent dispatch, preventing quality degradation as context fills
2. **Wave execution** -- Tasks grouped into parallel waves with dependency tracking
3. **XML plan format** -- Structured plans in XML for machine-parseable phase definitions
4. **4 canonical gate types** -- Pre-flight, revision, escalation, abort gates wired into plan-checker and verifier agents
5. **Schema drift detection** -- Flags ORM changes missing migrations
6. **Scope reduction detection** -- Prevents planner from silently dropping requirements
7. **Milestone-based planning** -- Projects decomposed into milestones with phases, each with verification
8. **31 specialized agents** -- Domain-specific agents for security, UI, debugging, research, etc.
9. **User profiling** -- Adapts complexity/verbosity based on detected user skill level
10. **Thinking model optimization** -- Different prompting strategies for thinking vs non-thinking models

---

## Processes

### 1. Context-Rot-Resistant Execution (methodologies/context-rot-resistant-execution)

A full generic development methodology that addresses context window degradation by structuring work into isolated phases with fresh context per subagent.

**Phases:**
1. **Discovery** -- Map codebase, profile user, establish project context
2. **Planning** -- Decompose into milestones with phases; generate XML plan with dependency graph
3. **Wave execution** -- Group independent tasks into parallel waves; each wave task runs in fresh context via orchestrator_task
4. **Gate verification** -- 4 gate types (pre-flight, revision, escalation, abort) validate each phase completion
5. **Schema drift check** -- Detect ORM/migration mismatches
6. **Scope reduction audit** -- Verify no requirements silently dropped from plan
7. **Milestone completion** -- Aggregate phase results, update project state

**Key insight:** The "fresh context per phase" pattern maps directly to babysitter's orchestrator_task dispatch. Each phase becomes a task with its own harness invocation, naturally solving context rot.

**Placement justification:** This is a full generic dev methodology (like agile/TDD/scrum) -- it defines a complete workflow from discovery through verification. Goes in methodologies/.

### 2. Quality Gate Framework (methodologies/quality-gate-framework)

A generic methodology for implementing multi-tier quality gates in development workflows.

**Gate taxonomy from GSD:**
1. **Pre-flight gates** -- Validate preconditions before work begins (dependencies available, schemas aligned)
2. **Revision gates** -- Check work output quality, trigger revision loops if below threshold
3. **Escalation gates** -- Route to specialized agents (security auditor, UI auditor) when domain expertise needed
4. **Abort gates** -- Hard stop when fundamental issues detected (architectural violations, security vulnerabilities)

**Phases:**
1. Define gate taxonomy and thresholds for project
2. Attach gates to phase transitions in execution plan
3. Execute phase with gate checkpoints
4. On gate failure: revision loop (max N retries) or escalation or abort
5. Log gate results for retrospective analysis

**Placement justification:** Quality gates are a generic development pattern applicable across all project types. Goes in methodologies/.

### 3. Codebase Discovery and Mapping (specializations/shared/codebase-discovery)

A cross-domain process for systematically mapping an unfamiliar codebase before starting work.

**Phases:**
1. Directory structure scan and categorization
2. Dependency graph extraction (imports, package.json, etc.)
3. Pattern detection (architectural patterns, naming conventions, test patterns)
4. Entry point identification (CLI, API, UI, workers)
5. Generate codebase map document with navigable index
6. Breakpoint for human review of map accuracy

**Key insight from GSD:** The `gsd-codebase-mapper` agent and `map-codebase` workflow demonstrate this as a reusable pre-step for any development process.

## Plugin Ideas

### 1. Schema Drift Detector (Category: Quality Assurance & Testing)

A babysitter plugin that detects when ORM model changes lack corresponding migration files, or when API schema changes lack corresponding client updates.

**install.md**: Installs a `pre-commit` hook that compares ORM model file changes against migration directory changes. Also checks OpenAPI/GraphQL schema files against generated client code. Alerts on drift.

### 2. Scope Reduction Auditor (Category: Quality Assurance & Testing)

A babysitter plugin that compares requirements/specs against implementation plans to detect silently dropped requirements.

**install.md**: Installs a process-level hook (`on-iteration-end`) that extracts requirements from spec files and cross-references against the current plan's task list. Flags any requirement not covered by at least one task.

### 3. Thinking Model Optimizer (Category: Developer Experience & UX)

A babysitter plugin that optimizes prompting strategy based on the active model's capabilities (thinking vs non-thinking models).

**install.md**: Reads the active harness model, determines if it supports extended thinking, and adjusts task prompts accordingly. For thinking models: more open-ended prompts, longer reasoning chains. For standard models: more structured, step-by-step prompts. Integrates via `on-task-start` hook to modify task definitions before dispatch.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Context-Rot-Resistant Execution | NEW | Full methodology with fresh context per phase | - | methodologies/context-rot-resistant-execution/ |
| Quality Gate Framework | NEW | Multi-tier quality gates with gate taxonomy | - | methodologies/quality-gate-framework/ |
| Codebase Discovery and Mapping | NEW | Systematic unfamiliar codebase mapping | - | specializations/shared/codebase-discovery.js |
| Wave Execution Pattern | NEW | Parallel task grouping with dependency tracking | - | specializations/shared/wave-execution.js |
| Schema Drift Detection | NEW | ORM/API schema consistency validation | - | specializations/shared/schema-drift-detection.js |
| Scope Reduction Auditing | NEW | Requirements vs implementation coverage validation | - | specializations/shared/scope-reduction-auditing.js |
| XML Plan Format Processing | NEW | Machine-parseable structured plan handling | - | specializations/shared/xml-plan-processing.js |
| Milestone-Based Planning | VARIANT | Could enhance existing project planning | library/methodologies/agile.js | specializations/shared/milestone-planning.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Schema Drift Detector | NEW | ORM/API schema consistency validation | - | plugins/a5c/marketplace/blueprints/schema-drift-detector/ |
| Scope Reduction Auditor | NEW | Requirements coverage validation | - | plugins/a5c/marketplace/blueprints/scope-reduction-auditor/ |
| Thinking Model Optimizer | NEW | Adaptive prompting for different model capabilities | - | plugins/a5c/marketplace/blueprints/thinking-model-optimizer/ |
