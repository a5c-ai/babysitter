# Maestro References

## Source Attribution

This methodology adaptation is based on:

- **Repository:** [https://github.com/SnapdragonPartners/maestro](https://github.com/SnapdragonPartners/maestro)
- **Author:** SnapdragonPartners
- **License:** MIT

## Key Concepts Mapped

| Maestro Concept | Babysitter Mapping |
|-----------------|-------------------|
| PM Agent (singleton) | `agents/product-manager/` + `maestro-pm-interview` task |
| Architect Agent (singleton) | `agents/architect/` + `maestro-architect-*` tasks |
| Coder Agents (goroutines) | `agents/coder/` + `ctx.parallel.all()` dispatch |
| Bootstrap Mode | `maestro-bootstrap.js` process |
| Development Mode | `maestro-development.js` process |
| Hotfix Mode | `maestro-hotfix.js` process |
| Maintenance Mode | `maestro-maintenance.js` process |
| Claude Code Mode | Native babysitter CLI integration |
| `.maestro/config.json` | Process inputs configuration |
| `.maestro/knowledge.dot` | `maestro-knowledge-graph.js` process |
| SQLite state (coders) | Babysitter run directory state |
| Story queue | `storyQueue` array with `splice()` dispatch |
| PR submission | `maestro-coder-implement` task output |
| Code review | `maestro-architect-code-review` task + quality gate |
| Merge authority | `maestro-architect-merge` task |
| Coder termination | Coders terminate between `ctx.parallel.all()` batches |
| Spec feedback loop | `while (!specApproved)` PM-Architect iteration |
| Quality threshold | `qualityThreshold` input with convergence loops |
| "Turn checks to 11" | Aggressive lint/test defaults in test enforcement |
| Metrics dashboard | `maestro-metrics-collection` task |
| Knowledge graph | DOT-format graph with patterns and ADRs |
| Web search | External tool integration (not embedded) |

## Operating Modes Not Mapped

| Maestro Mode | Reason |
|--------------|--------|
| Airplane Mode | Babysitter is already local-first; Gitea/Ollama integration is environment-specific |
| Demo Mode | Application testing is deployment-specific |
| Run Mode | App execution is outside process orchestration scope |

## Design Decisions

1. **Agent tasks use `kind: 'agent'`** to reference agent definitions in the `agents/` directory rather than inlining agent prompts in process files.

2. **Parallel coder dispatch uses `ctx.parallel.all()`** mapping Maestro's goroutine model to babysitter's native parallel effect system.

3. **Quality convergence loops** (`while (!approved && attempts < max)`) implement Maestro's coder retry and reassignment behavior.

4. **Breakpoints** map to Maestro's human approval gates for specification review, story decomposition review, and failed quality checks.

5. **Hotfix simple-fix skip** preserves Maestro's fast-path where simple fixes bypass the planning phase.

6. **Maintenance frequency** is an input parameter rather than a config file setting, since babysitter processes are invoked explicitly.
