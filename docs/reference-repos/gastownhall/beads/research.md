# gastownhall/beads
- **Source**: gh-search

## Metadata

| Field | Value |
|-------|-------|
| **Repo** | [gastownhall/beads](https://github.com/gastownhall/beads) |
| **Description** | Distributed graph issue tracker for AI agents, powered by Dolt |
| **Stars** | 20,625 |
| **Last Pushed** | 2026-04-12 |
| **License** | MIT |
| **Language** | Go |
| **Discovered** | 2026-04-12 |
| **Archetype** | **claude-plugin** |

## Summary

Beads (`bd`) is a Dolt-powered persistent issue tracker designed for AI coding agents. It provides a dependency-aware graph database for task management that survives conversation compaction, enabling multi-session work continuity. The project ships as a standalone Go CLI with a Claude Code plugin (marketplace-compatible), MCP server, and integrations for multiple harnesses (Claude Code, Junie, Aider, Copilot).

Key features:
- **Graph-based task dependencies**: `blocks`, `relates_to`, `duplicates`, `supersedes`, `discovered-from`, `parent-child`
- **Compaction survival**: Notes and state persist across context window compaction events
- **Molecule/Wisp system**: Reusable workflow templates ("protos") that can be instantiated as persistent mols or ephemeral wisps
- **Agent coordination**: First-class `agent` bead type with state machine, slots, heartbeats, and multi-agent orchestration
- **Session handoff**: Handoff skill for cycling sessions while preserving work context
- **Embedded or server mode**: In-process Dolt or external `dolt sql-server`

## Skills Found

| Skill | Path | Description |
|-------|------|-------------|
| beads | `claude-plugin/skills/beads/SKILL.md` | Core task tracking skill with session protocol, CLI reference, error handling |
| handoff | `.claude/skills/handoff/SKILL.md` | Session cycling skill for context-full handoffs between Claude instances |

## Plugin Structure

```
claude-plugin/
  skills/beads/          # Main skill with 14 resource files, ADRs
  commands/              # 29 slash commands (create, ready, show, close, sync, etc.)
  agents/task-agent.md   # Autonomous task-completion agent
.claude-plugin/
  marketplace.json       # Marketplace manifest (plugin name: "beads")
```

## Assessment

High-value reference repo. Beads represents a mature, well-documented approach to persistent agent memory via structured task graphs. The molecule/wisp templating system and compaction-survival patterns contain significant procedural knowledge worth extracting. The multi-agent coordination model (agent beads, slots, heartbeats) is novel.

**Extraction Priority**: HIGH - rich in process patterns and plugin ideas.

---

## Processes

### 1. Compaction-Resilient Multi-Session Workflow

**Placement**: `specializations/shared/`

A process for managing long-horizon work across multiple AI sessions where context window compaction or session restarts can destroy working memory. The pattern:

1. Session start: query persistent store for in-progress work and blockers
2. Claim task atomically before starting work
3. During execution: write structured progress notes (COMPLETED / IN PROGRESS / NEXT / KEY DECISIONS sections) to the persistent store after each meaningful milestone
4. On discovery of side work: file it immediately with dependency links, assess blocker-vs-deferrable
5. Session end or compaction: state is fully recoverable from persistent store alone
6. Next session: reconstruct full context from stored notes, dependency graph, and status

**Source patterns**: `WORKFLOWS.md` (session start, compaction survival, discovery workflows), `RESUMABILITY.md` (resumable issue anatomy)

### 2. Epic Decomposition with Dependency Graph

**Placement**: `specializations/shared/`

A structured process for decomposing large features into dependency-aware task graphs:

1. Create epic-level bead with scope definition
2. Decompose into tasks with explicit `blocks` and `parent-child` relationships
3. Use `bd ready` pattern: only work on tasks whose blockers are resolved
4. Track discoveries during implementation as new beads with `discovered-from` links
5. Validate completeness via dependency tree traversal
6. Close bottom-up following the dependency ordering

**Source patterns**: `WORKFLOWS.md` (epic planning), `DEPENDENCIES.md`, CLI workflow patterns

### 3. Reusable Workflow Templates (Molecule Pattern)

**Placement**: `specializations/shared/`

A meta-process for creating, managing, and instantiating reusable workflow templates:

1. Identify repeatable workflow (release, review, onboarding, patrol)
2. Encode as "proto" (template epic with parameterized child tasks)
3. Variables use `{{name}}` substitution syntax
4. Instantiation options: persistent (mol/pour) for auditable work, ephemeral (wisp) for operational loops
5. After ad-hoc work, distill back into proto for future reuse
6. Wisps auto-clean (burn) or summarize (squash) to prevent database bloat

**Source patterns**: `MOLECULES.md`, `CHEMISTRY_PATTERNS.md`

## Plugin Ideas

### 1. Persistent Task Memory Plugin

**Category**: Context & Memory

A babysitter marketplace plugin that integrates a graph-based persistent task tracker (like Beads) into the babysitter orchestration loop. The `install.md` would guide the AI agent through:

- Installing the `bd` CLI if not present
- Running `bd init` in the workspace
- Configuring the stop-hook to run `bd ready --json` at session start
- Adding a pre-iteration hook that checks for in-progress beads and injects context
- Configuring compaction-survival note-writing as a post-task hook

**Value**: Babysitter runs currently lose inter-session context unless manually preserved. This plugin would make runs resumable across process restarts with zero manual bookkeeping.

### 2. Workflow Template Library Plugin

**Category**: Workflow Automation

A plugin that provides a molecule/proto-style reusable workflow template system within babysitter. The `install.md` would guide through:

- Creating a `templates/` directory in `.a5c/`
- Defining parameterized process templates as JSON with variable slots
- Adding a `template:spawn` command that instantiates templates into runnable processes
- Supporting ephemeral vs persistent template instances
- Providing `template:distill` to extract templates from completed runs

**Value**: Currently babysitter processes are hand-authored JS files. A template system would let users create reusable patterns from successful runs without writing code.

### 3. Side-Quest Discovery Tracker Plugin

**Category**: Quality Assurance & Testing

A plugin that tracks work items discovered during babysitter runs (bugs found, TODOs encountered, refactoring opportunities). The `install.md` would guide through:

- Adding a `discovery:log` command usable mid-run
- Configuring post-run aggregation of discoveries into a structured report
- Tagging discoveries with `blocker` vs `deferrable` classification
- Linking discoveries to the originating run and effect
- Providing `discovery:triage` for reviewing accumulated discoveries across runs

**Value**: During long orchestration runs, agents frequently encounter side issues but have no structured way to track them. They either fix them inline (scope creep) or forget them.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Compaction-Resilient Multi-Session Workflow | NEW | Long-horizon work management across AI sessions with persistent state | - | specializations/shared/compaction-resilient-workflow.js |
| Epic Decomposition with Dependency Graph | NEW | Large feature decomposition into dependency-aware task graphs | - | specializations/shared/epic-decomposition-dependency-graph.js |
| Reusable Workflow Templates (Molecule Pattern) | NEW | Meta-process for creating, managing, and instantiating reusable workflow templates | - | specializations/shared/reusable-workflow-templates.js |
| Session Handoff Protocol | NEW | Clean session cycling with state persistence and context recovery | - | specializations/shared/session-handoff-protocol.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Persistent Task Memory | UPGRADE | Graph-based persistent task tracker beyond existing context/memory solutions | plugins/a5c/marketplace/blueprints/claude-mem/ | plugins/a5c/marketplace/blueprints/persistent-task-memory/ |
| Workflow Template Library | NEW | Parameterized process template system with variable slots and instantiation | - | plugins/a5c/marketplace/blueprints/workflow-template-library/ |
| Side-Quest Discovery Tracker | NEW | Work item discovery tracking with blocker/deferrable classification during runs | - | plugins/a5c/marketplace/blueprints/side-quest-discovery-tracker/ |

## Implicit Procedural Knowledge

### Compaction-Survival Note Format

The "COMPLETED / IN PROGRESS / NEXT / KEY DECISIONS" structured note format from `RESUMABILITY.md` is a valuable pattern for any persistent state system. It answers the four questions a resuming agent needs: what's done, what's active, what's next, and why were choices made.

### Blocker-vs-Deferrable Assessment

The side-quest handling workflow in `WORKFLOWS.md` encodes a useful decision heuristic: when discovering work mid-task, immediately classify as blocker (pause and switch) vs deferrable (file and continue). This prevents both scope creep and context loss.

### Session Handoff Protocol

The handoff skill demonstrates a clean session cycling pattern: persist all state to external store, send handoff mail with context notes, respawn fresh session, auto-prime from persistent state. This is relevant to babysitter's own session management.

### Ephemeral vs Persistent Work Classification

The wisp/mol distinction (ephemeral operational work vs auditable tracked work) is a useful architectural pattern. Not all orchestration artifacts need permanent storage -- operational loops, diagnostics, and health checks should be auto-cleaned.
