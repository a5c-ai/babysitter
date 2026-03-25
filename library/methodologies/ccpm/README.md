# CCPM - Claude Code PM Methodology

Spec-driven development methodology adapted from [CCPM](https://github.com/automazeio/ccpm). Enforces the principle: "Every line of code must trace back to a specification." Five strict phases with zero shortcuts.

## Overview

CCPM provides a complete project management lifecycle for AI-driven development, from product planning through parallel execution with full traceability.

## Five Workflow Phases

| Phase | Process | Description |
|-------|---------|-------------|
| 1. Product Planning | `ccpm-prd-workflow.js` | Brainstorm, draft PRD, review, refine, finalize |
| 2. Implementation Planning | `ccpm-epic-planning.js` | Parse PRD, architecture decisions, tech approach, dependencies |
| 3. Task Decomposition | `ccpm-task-decomposition.js` | Break epic into streams, set criteria, estimate, build dependency graph |
| 4. GitHub Sync | (in orchestrator) | Create issues, sync labels, bidirectional updates |
| 5. Parallel Execution | `ccpm-parallel-execution.js` | Dispatch specialized agents, quality gates, integration |

**Full Lifecycle:** `ccpm-orchestrator.js` - Runs all five phases end-to-end.

**Progress Tracking:** `ccpm-tracking.js` - Standups, dashboards, blocked task management.

## Agents (9)

| Agent | Role | Stream |
|-------|------|--------|
| `product-planner` | PRD creation, vision, user stories | Phase 1 |
| `architect` | Epic creation, architecture decisions | Phase 2 |
| `task-analyst` | Decomposition, estimation, dependencies | Phase 3 |
| `database-engineer` | Schema, migrations, data layer | Phase 5 |
| `api-developer` | Service layer, endpoints | Phase 5 |
| `ui-developer` | Components, forms, frontend | Phase 5 |
| `test-engineer` | Test suites, QA, integration | Phase 5 |
| `documentation-writer` | Technical docs, API docs | Phase 5 |
| `project-tracker` | Progress, standups, GitHub sync | Cross-cutting |

## Skills (8)

| Skill | Purpose |
|-------|---------|
| `prd-creation` | Interactive PRD brainstorming and drafting |
| `epic-generation` | Transform PRD to technical implementation plan |
| `task-decomposition` | Break epics into parallelizable tasks |
| `github-sync` | Bidirectional issue/PR synchronization |
| `parallel-orchestration` | Coordinate multiple specialized agents |
| `progress-tracking` | Status dashboards and standup reports |
| `audit-trail` | PRD-to-code traceability verification |
| `context-management` | Project context loading and isolation |

## Key Patterns

- **Quality Convergence Loops**: Every phase has validation with iterative refinement (max 3 iterations)
- **Breakpoints**: Human approval gates at every phase transition
- **Parallel Execution**: `ctx.parallel.all()` for independent work streams
- **Agent Specialization**: Stream-typed agents (database, API, UI, testing, docs)
- **Traceability**: PRD -> Epic -> Task -> GitHub Issue -> Code Commit
- **Issue States**: open -> in-progress -> blocked -> review -> closed

## Usage

### Full Lifecycle
```bash
babysitter run:create \
  --process-id ccpm/orchestrator \
  --entry ccpm/ccpm-orchestrator.js#process \
  --inputs inputs.json
```

### Individual Phases
```bash
# PRD only
babysitter run:create --process-id ccpm/prd --entry ccpm/ccpm-prd-workflow.js#process --inputs prd-inputs.json

# Epic planning only
babysitter run:create --process-id ccpm/epic --entry ccpm/ccpm-epic-planning.js#process --inputs epic-inputs.json

# Task decomposition only
babysitter run:create --process-id ccpm/tasks --entry ccpm/ccpm-task-decomposition.js#process --inputs tasks-inputs.json

# Parallel execution only
babysitter run:create --process-id ccpm/execute --entry ccpm/ccpm-parallel-execution.js#process --inputs exec-inputs.json

# Tracking
babysitter run:create --process-id ccpm/tracking --entry ccpm/ccpm-tracking.js#process --inputs tracking-inputs.json
```

## File Organization

```
ccpm/
  README.md                           # This file
  references.md                       # Attribution
  ccpm-orchestrator.js                # Full lifecycle
  ccpm-prd-workflow.js                # Phase 1: PRD
  ccpm-epic-planning.js               # Phase 2: Epic
  ccpm-task-decomposition.js          # Phase 3: Tasks
  ccpm-parallel-execution.js          # Phase 5: Execution
  ccpm-tracking.js                    # Progress tracking
  agents/
    product-planner/                  # PRD and user stories
    architect/                        # Epic and architecture
    task-analyst/                     # Decomposition and estimation
    database-engineer/                # Database stream
    api-developer/                    # API stream
    ui-developer/                     # UI stream
    test-engineer/                    # Testing and QA
    documentation-writer/             # Documentation stream
    project-tracker/                  # Progress and GitHub sync
  skills/
    prd-creation/                     # PRD brainstorming and drafting
    epic-generation/                  # PRD to epic transformation
    task-decomposition/               # Epic to tasks breakdown
    github-sync/                      # GitHub issue sync
    parallel-orchestration/           # Parallel agent coordination
    progress-tracking/                # Dashboards and standups
    audit-trail/                      # PRD-to-code traceability
    context-management/               # Context loading and isolation
  examples/
    full-lifecycle.json               # Full orchestrator example
    prd-workflow.json                 # PRD-only example
    epic-planning.json                # Epic planning example
    task-decomposition.json           # Task decomposition example
    parallel-execution.json           # Parallel execution example
    tracking.json                     # Tracking example
```

## Integration with Babysitter SDK

- **Agent tasks** (`kind: 'agent'`) for all LLM-based work
- **Breakpoints** (`ctx.breakpoint()`) for human approval at phase transitions
- **Parallel execution** (`ctx.parallel.all()`) for independent stream work
- **Quality convergence** loops with max iteration limits
- **Task composition** through `ctx.task()` calls
- **State persistence** via journal and artifacts

## Differences from Original CCPM

1. **SDK Native**: Uses Babysitter SDK `defineTask()` instead of Claude Code slash commands
2. **Execution Model**: Task-based orchestration with replay engine instead of CLI commands
3. **Quality Gates**: Built-in convergence loops with configurable thresholds
4. **Agent Dispatch**: Automatic stream-type to agent mapping
5. **Composability**: Each phase is a standalone process that can be imported and composed
