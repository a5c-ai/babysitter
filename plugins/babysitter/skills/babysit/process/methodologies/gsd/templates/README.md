# GSD Templates

Templates used by the `template-scaffolding` skill to generate project artifacts.
Referenced by process files via `orchestratorTask` with `skill: 'template-scaffolding'`.

## Template Index

### Project Initialization
| Template | Description | Used By |
|----------|-------------|---------|
| `project.md` | PROJECT.md template with vision, goals, scope, constraints | `new-project.js` |
| `requirements.md` | REQUIREMENTS.md with v1/v2 separation and traceability | `new-project.js` |
| `roadmap.md` | ROADMAP.md with phased milestones and dependencies | `new-project.js` |
| `state.md` | STATE.md project state tracking template | `new-project.js`, `progress.js` |
| `context.md` | Phase CONTEXT.md with decisions and preferences | `discuss-phase.js` |
| `config.json` | GSD configuration defaults | `quick.js`, all processes |

### Phase Planning and Execution
| Template | Description | Used By |
|----------|-------------|---------|
| `phase-prompt.md` | Standard prompt wrapper for phase-scoped agents | `plan-phase.js`, `execute-phase.js` |
| `planner-subagent-prompt.md` | Specialized prompt for planning sub-agents | `plan-phase.js` |
| `debug-subagent-prompt.md` | Specialized prompt for debug sub-agents | `debug.js` |

### Summaries
| Template | Description | Used By |
|----------|-------------|---------|
| `summary.md` | Full phase SUMMARY.md template | `execute-phase.js`, `verify-work.js` |
| `summary-minimal.md` | Minimal summary for quick tasks | `quick.js` |
| `summary-standard.md` | Standard summary with deliverables and decisions | `execute-phase.js` |
| `summary-complex.md` | Extended summary for multi-wave phases | `execute-phase.js` |

### Milestones
| Template | Description | Used By |
|----------|-------------|---------|
| `milestone.md` | Active milestone tracking document | `audit-milestone.js` |
| `milestone-archive.md` | Archived milestone with completion metadata | `complete-milestone.js` |

### Verification and Testing
| Template | Description | Used By |
|----------|-------------|---------|
| `verification-report.md` | Phase verification report template | `verify-work.js` |
| `uat.md` | User acceptance testing checklist template | `verify-work.js` |
| `validation.md` | Generic validation report | `verify-work.js` |

### Research and Discovery
| Template | Description | Used By |
|----------|-------------|---------|
| `research.md` | Phase research document template | `research-phase.js` |
| `discovery.md` | Initial discovery findings template | `new-project.js` |
| `debug.md` | Debug session tracking file template | `debug.js` |

### Continuation
| Template | Description | Used By |
|----------|-------------|---------|
| `continue-here.md` | Context continuation marker for session recovery | All processes |

### Subdirectories (planned)
- `codebase/` - Templates specific to codebase mapping processes
- `research-project/` - Templates for research-focused project types

## Implementation Status

Templates are currently defined declaratively. The `template-scaffolding` skill
resolves templates by name via `orchestratorTask` payloads. Template content is
generated dynamically by the orchestrator based on template name and variables.

Future: static template files will be added here for deterministic scaffolding.
