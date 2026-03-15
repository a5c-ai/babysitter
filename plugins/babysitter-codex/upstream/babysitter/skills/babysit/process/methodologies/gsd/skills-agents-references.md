# GSD Skills & Agents References

References for GSD patterns, agent design, skill architecture, and the underlying methodology.

## Original GSD Repository

- **Repository**: [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)
- **Philosophy**: Systematic planning, research, execution, and verification for software projects using AI agents.
- **Core Commands**: `gsd new-project`, `gsd discuss`, `gsd plan`, `gsd execute`, `gsd verify`, `gsd audit`, `gsd progress`, `gsd quick`, `gsd debug`

## Agent Design Patterns

### Orchestrator-Worker Pattern
The GSD methodology uses a thin orchestrator that delegates work to specialized agents. The orchestrator manages state and routing while workers (agents) perform focused tasks with fresh context windows.

- **Orchestrator context budget**: 15-30% of available context window
- **Worker context**: Full context window (200k tokens) per agent invocation
- **Key principle**: Agents are stateless; all state persists in `.planning/` artifacts

### Agent Specialization
Each agent has a single, well-defined responsibility:
- **Researchers** gather information and produce structured findings
- **Planners** create actionable task plans from research
- **Executors** implement plans with atomic commits
- **Verifiers** validate work against acceptance criteria
- **Checkers** review artifacts for quality and completeness

### Agent Communication
Agents communicate through shared artifacts in `.planning/`:
- `PROJECT.md` - Project vision and scope
- `REQUIREMENTS.md` - Scoped requirements with priorities
- `ROADMAP.md` - Phased delivery plan
- `STATE.md` - Current project state and memory
- `CONTEXT.md` - Per-phase discussion context
- `RESEARCH.md` - Per-phase research findings
- `PLAN.md` - Per-phase implementation plans
- `SUMMARY.md` - Per-phase execution summaries

## Skill Architecture Patterns

### Skill Composition
Skills are composable utilities that agents invoke for specific operations:
- **gsd-tools** acts as the central entry point, coordinating other skills
- **template-scaffolding** provides document generation across all processes
- **state-management** provides cross-session persistence
- **verification-suite** provides quality gates at multiple levels

### Skill Layering
```
Process (quick.js, debug.js, etc.)
  -> Agent (gsd-executor, gsd-debugger, etc.)
    -> Skill (git-integration, state-management, etc.)
      -> Tool (Bash, Read, Write, Edit, Glob, Grep)
```

### Allowed Tools per Skill
Each skill declares its allowed tools to enforce least-privilege:
- Read-only skills: `Read`, `Glob`, `Grep`
- Write skills: `Read`, `Write`, `Edit`, `Glob`
- Execution skills: `Bash(*)`, `Read`, `Glob`

## Key GSD Concepts

### Phase Lifecycle
```
discuss -> research -> plan -> execute -> verify -> (next phase or audit)
```

### Milestone Lifecycle
```
new-project -> [phase cycles] -> audit-milestone -> complete-milestone
```

### Quality Gates
1. **Plan verification** - gsd-plan-checker validates plan structure and coverage
2. **Execution checkpoints** - Breakpoints at critical decision points
3. **Phase verification** - UAT against acceptance criteria
4. **Milestone audit** - Cross-phase integration and requirements coverage

### Context Engineering
- **Fresh context per agent**: Each agent invocation gets a clean 200k context window
- **Targeted loading**: Only relevant artifacts loaded into agent context
- **Context monitoring**: PostToolUse hook tracks usage and injects warnings at 70/85/95%
- **Orchestrator discipline**: Orchestrator stays within 15-30% budget

### State Machine
STATE.md acts as the project's living memory:
- `current_task` - What is being worked on right now
- `current_phase` - Active phase in the roadmap
- `completed_phases` - List of completed phases
- `blockers` - Active blockers with severity
- `decisions` - Decision log with rationale and timestamp
- `quick_tasks` - Quick task status table

### Atomic Execution
- One git commit per task (not per phase or per file)
- Planning commits separated from code commits
- Each commit message references phase, plan, and task number
- Enables `git bisect` for debugging

### Model Profiles
Three cost/quality profiles for agent model selection:
- **quality** - Best available models for all agents
- **balanced** - Mix of capable and efficient models
- **budget** - Most cost-effective models that meet minimum requirements

## Reference Documents (in `references/` directory)

| File | Purpose |
|------|---------|
| `checkpoints.md` | Checkpoint protocol (human-verify, decision, action types) |
| `continuation-format.md` | Format for cross-session continuation files |
| `decimal-phase-calculation.md` | Algorithm for inserting phases between existing ones |
| `git-integration.md` | Git commit patterns and conventions |
| `git-planning-commit.md` | Separating planning commits from code commits |
| `model-profile-resolution.md` | Model selection algorithm |
| `model-profiles.md` | Profile definitions (quality/balanced/budget) |
| `phase-argument-parsing.md` | Parsing phase arguments from user input |
| `planning-config.md` | `.planning/config.json` schema |
| `questioning.md` | Deep questioning patterns for discuss phase |
| `tdd.md` | Test-driven development integration |
| `ui-brand.md` | UI/UX branding guidelines for output formatting |
| `verification-patterns.md` | Structured verification rubrics |

## External References

- [Babysitter SDK Documentation](https://github.com/a5c-ai/babysitter) - Core orchestration framework
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html) - Foundation for journal-based state
- [Saga Pattern](https://microservices.io/patterns/data/saga.html) - Multi-step process coordination
- [Scientific Method for Debugging](https://www.debuggingrules.com/) - Basis for gsd-debugger agent approach
