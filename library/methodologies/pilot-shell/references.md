# References and Attribution

## Primary Source

**Pilot Shell** by Max Ritter
- Repository: https://github.com/maxritter/pilot-shell
- License: See the original repository for license terms
- Description: A spec-driven development framework for Claude Code with strict TDD, quality hooks, and persistent memory

## Mapping from Pilot Shell to Babysitter SDK

### Commands to Process Files

| Pilot Shell Command | Babysitter Process |
|--------------------|--------------------|
| `/spec [description]` (Feature Mode) | `pilot-shell-orchestrator.js` (mode: 'feature') / `pilot-shell-feature.js` |
| `/spec [description]` (Bugfix Mode) | `pilot-shell-orchestrator.js` (mode: 'bugfix') / `pilot-shell-bugfix.js` |
| `/spec [description]` (Quick Mode) | `pilot-shell-orchestrator.js` (mode: 'quick') |
| `/sync` | `pilot-shell-sync.js` |
| Quality Hooks Pipeline | `pilot-shell-quality-pipeline.js` |

### Sub-Agents to Agents

| Pilot Shell Sub-Agent | Babysitter Agent |
|-----------------------|-----------------|
| plan-reviewer | `agents/plan-reviewer/` |
| unified-review | `agents/unified-reviewer/` |

### Hooks to Agents/Skills

| Pilot Shell Hook | Babysitter Equivalent |
|-----------------|----------------------|
| file_checker (PostToolUse) | `agents/file-checker/` + `skills/quality-hooks/` |
| tdd_enforcer (PostToolUse) | `agents/tdd-enforcer/` + `skills/strict-tdd/` |
| context_monitor (PostToolUse) | `agents/context-monitor/` + `skills/context-preservation/` |
| spec_stop_guard (Stop) | `agents/spec-guard/` |
| memory observer (PostToolUse) | `agents/memory-curator/` + `skills/persistent-memory/` |
| PreCompact state capture | `skills/context-preservation/` |
| post_compact_restore (SessionStart) | `skills/context-preservation/` |

### Rules to Skills

| Pilot Shell Rule | Babysitter Skill |
|-----------------|-----------------|
| task-and-workflow | `skills/spec-driven-development/` |
| testing | `skills/strict-tdd/` |
| verification | Part of unified-reviewer agent |
| development-practices | `skills/quality-hooks/` |
| context-management | `skills/context-preservation/` |
| pilot-memory | `skills/persistent-memory/` |

### CLI Commands to Skills

| Pilot Shell CLI | Babysitter Skill |
|----------------|-----------------|
| `pilot` (session management) | `skills/context-preservation/` |
| worktree commands | `skills/worktree-isolation/` |
| `/learn` | `skills/persistent-memory/` |
| `/vault` | Not adapted (private Git repo sharing is out of scope) |

### Features Not Adapted

The following Pilot Shell features are not directly adapted as they are either out of scope for Babysitter SDK or handled by the SDK itself:

| Feature | Reason |
|---------|--------|
| `/vault` command | Private Git repo sharing is infrastructure-specific |
| Pilot Shell Console (Web Dashboard) | UI layer not applicable to process definitions |
| Worker daemon | Babysitter SDK has its own orchestration daemon |
| `tool_redirect` (PreToolUse) | Tool redirection is handled at the SDK/plugin level |
| Session tracker | Babysitter SDK has native run/session tracking |

## Adaptation Principles

1. **Pilot Shell hooks** became Babysitter agent tasks (PostToolUse hooks -> agent tasks in process files)
2. **Pilot Shell rules** became Babysitter skills (rule documents -> SKILL.md with structured capabilities)
3. **Pilot Shell sub-agents** became Babysitter agents (sub-agent configs -> AGENT.md with structured definitions)
4. **Pilot Shell CLI commands** became Babysitter process files (CLI workflows -> process definitions with defineTask)
5. **State model** preserved: PENDING -> COMPLETE -> VERIFIED task tracking maintained in process logic
6. **Convergence loops** used for quality pipeline auto-fix and TDD iteration
7. **ctx.parallel.all()** used where Pilot Shell uses parallel execution (research phases, quality checks)
8. **ctx.breakpoint()** used where Pilot Shell uses human approval gates
