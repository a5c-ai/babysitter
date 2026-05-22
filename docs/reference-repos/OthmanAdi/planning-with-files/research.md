# OthmanAdi/planning-with-files

- **Full name**: OthmanAdi/planning-with-files
- **Description**: Claude Code skill implementing Manus-style persistent markdown planning -- the workflow pattern behind the $2B acquisition
- **Stars**: 18,574
- **License**: MIT
- **Last pushed**: 2026-04-09
- **Topics**: agent, agent-skills, claude, claude-code, claude-skills, cursor, manus, manus-ai
- **Fork**: No
- **Source**: gh-search

## Archetype

**utility-with-skill** -- A single focused skill that implements persistent file-based planning (task_plan.md + findings.md + progress.md) as "working memory on disk." Supports 16+ IDEs with hooks for plan re-reading before tool use and progress tracking after edits.

## Structure

```
skills/planning-with-files/
  SKILL.md              # Main skill definition with hooks
  examples.md           # Usage examples
  reference.md          # Reference documentation
  scripts/              # Session catchup, completion check scripts
  templates/            # task_plan.md, findings.md, progress.md templates
commands/               # Slash commands
docs/                   # Per-IDE installation guides (16+ platforms)
examples/               # Example projects
tests/                  # Test suite
.claude-plugin/         # Plugin manifest
.codex/                 # Codex integration
.cursor/                # Cursor integration
.gemini/                # Gemini integration
.kiro/                  # Kiro integration
.factory/               # Factory AI integration
.pi/                    # Pi integration
```

## Key Techniques

1. **Filesystem as working memory** -- Context window = RAM (volatile), filesystem = disk (persistent). All important state written to markdown files
2. **Three-file pattern** -- task_plan.md (phases/progress/decisions), findings.md (research/discoveries), progress.md (session log/test results)
3. **Hook-driven plan persistence** -- PreToolUse hook re-reads plan before every tool call; PostToolUse hook prompts progress updates after edits; Stop hook checks completion
4. **Session recovery** -- After /clear, automatically detects and recovers previous session context from IDE session stores
5. **2-action rule** -- Never take more than 2 actions without re-reading the plan (keeps plan in attention window)
6. **Phase-based decomposition** -- Complex tasks broken into sequential phases with status tracking
7. **Multi-IDE support** -- Same core pattern adapted to 16+ IDEs via per-platform hook configurations

---

## Processes

### 1. Persistent File-Based Planning (specializations/shared/file-based-planning)

A cross-domain process for managing complex multi-step tasks using persistent markdown files as working memory.

**Phases:**
1. **Plan creation** -- Decompose task into phases, create task_plan.md with phase definitions, dependencies, and acceptance criteria
2. **Research capture** -- As discoveries are made during execution, append to findings.md with timestamps
3. **Phase execution loop** -- For each phase: re-read plan, execute phase tasks, update progress.md, mark phase complete in task_plan.md
4. **Decision logging** -- At each decision point, log rationale in task_plan.md decisions section
5. **Completion verification** -- Check all phases marked complete, all acceptance criteria met
6. **Session handoff** -- If context fills, progress.md enables seamless continuation in fresh session

**Key insight:** The "filesystem as working memory" pattern is complementary to babysitter's journal-based state. The plan files serve as human-readable state that survives context window resets, while babysitter's journal provides machine-readable replay.

**Placement justification:** This is a cross-domain planning pattern applicable to any complex task (development, research, data analysis). Goes in specializations/shared/.

## Plugin Ideas

### 1. Plan Persistence Plugin (Category: Context & Memory)

A babysitter plugin that automatically creates and maintains task_plan.md / findings.md / progress.md files alongside babysitter's internal journal, giving humans a readable view of run progress.

**install.md**: Installs `on-iteration-start` and `on-iteration-end` hooks. On iteration start: reads existing plan files and injects summary into task context. On iteration end: updates progress.md with completed effects and findings.md with any new discoveries. Provides a `plan:status` command to render current plan state.

### 2. Session Recovery Plugin (Category: Context & Memory)

A babysitter plugin that enables seamless session recovery after context window clears. Detects previous session state from IDE-specific stores and plan files, generates a catchup report showing what happened since last sync.

**install.md**: Installs a `session-start` hook that checks for existing plan files and IDE session data. If found, generates a catchup report and injects it into the new session context. Works across Claude Code, Codex, Cursor, and Gemini CLI session stores.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Persistent File-Based Planning | NEW | Cross-domain planning using filesystem as working memory with markdown state files | - | specializations/shared/persistent-file-based-planning.js |
| Three-File Planning Pattern | NEW | Task organization via task_plan.md, findings.md, and progress.md with hook-driven updates | - | specializations/shared/three-file-planning-pattern.js |
| Phase-Based Task Decomposition | NEW | Complex task breakdown into sequential phases with status tracking and acceptance criteria | - | specializations/shared/phase-based-task-decomposition.js |
| Session Recovery from File State | NEW | Context window recovery using persistent markdown files and IDE session stores | - | specializations/shared/session-recovery-file-state.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Plan Persistence Integration | UPGRADE | Human-readable plan files alongside babysitter's internal journal | plugins/a5c/marketplace/plugins/claude-mem/ | plugins/a5c/marketplace/plugins/plan-persistence-integration/ |
| Session Recovery Enhancement | UPGRADE | Enhanced session recovery across multiple IDE platforms | plugins/a5c/marketplace/plugins/claude-mem/ | plugins/a5c/marketplace/plugins/session-recovery-enhancement/ |
