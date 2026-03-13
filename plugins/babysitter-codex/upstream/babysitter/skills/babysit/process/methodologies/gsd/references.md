# GSD Methodology References

## Original Repository

- **Get Shit Done (GSD)**: [github.com/glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)
  - The original AI-powered project management methodology
  - Implements systematic planning, research, execution, and verification workflows
  - Provides CLI commands for project lifecycle management

## Key Concepts

### Methodology Overview
GSD is a structured methodology for AI-assisted software development that enforces:
1. **Research before planning** - Never plan without understanding the domain
2. **Plan before executing** - Never code without a verified plan
3. **Verify before advancing** - Never move forward without confirming quality
4. **Atomic execution** - Each task produces one commit with clear boundaries

### Core Workflow
```
new-project -> discuss -> plan -> execute -> verify -> audit -> complete-milestone
```

### State Persistence
All project state lives in `.planning/` directory as markdown and JSON files, enabling:
- Cross-session continuity
- Human-readable audit trail
- Git-tracked project history
- Agent-parseable structured data

### Agent Architecture
- **Orchestrator** (thin, 15-30% context) routes work to specialized agents
- **Workers** (full 200k context) perform focused tasks
- **Communication** happens through shared `.planning/` artifacts, not direct message passing

## Babysitter SDK Adaptation

The GSD methodology is adapted to run on the Babysitter SDK orchestration framework:

| GSD Concept | Babysitter SDK Primitive |
|-------------|--------------------------|
| CLI commands | Process definitions (`.js` files) |
| Subagent spawning | `ctx.task()` with agent task definitions |
| Human approval | `ctx.breakpoint()` |
| State files | Task artifacts + `.planning/` directory |
| Context monitor | Hook system (`on-iteration-start`, `on-iteration-end`) |
| Quality scoring | `ctx.task()` with verifier agents |

## Related Resources

- [Babysitter SDK](https://github.com/a5c-ai/babysitter) - Orchestration framework
- [Context Engineering](https://docs.anthropic.com) - Principles for effective AI context management
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Pattern used by Babysitter journal
- [Scientific Debugging](https://www.debuggingrules.com/) - Methodology behind gsd-debugger agent
- [Keep a Changelog](https://keepachangelog.com/) - Format reference for changelog management

## Directory Structure

See `README.md` for the full directory layout of the GSD methodology implementation, including agents, skills, templates, and reference documents.
