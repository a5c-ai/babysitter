# BloopAI/vibe-kanban

- **Full name**: BloopAI/vibe-kanban
- **Description**: Get 10X more out of Claude Code, Codex or any coding agent
- **Stars**: 24,908
- **License**: Apache-2.0
- **Last pushed**: 2026-04-10
- **Topics**: agent, ai-agents, kanban, management, task-manager
- **Fork**: No
- **Source**: gh-search

## Archetype

**other-harness** -- A full-featured kanban-based task management and workspace orchestration platform for coding agents. Written in Rust + TypeScript (pnpm monorepo). Includes a web UI with kanban board, workspace management (branch + terminal + dev server per agent), inline code review, built-in browser preview, and support for 10+ coding agents.

## Structure

```
crates/                 # Rust backend (30+ crates)
  server/               # Main server
  workspace-manager/    # Per-agent workspace isolation
  worktree-manager/     # Git worktree management
  executors/            # Agent executors (Claude Code, Codex, etc.)
  review/               # Code review system
  preview-proxy/        # Built-in browser preview
  mcp/                  # MCP integration
  relay-*/              # Remote/cloud relay system
  git/                  # Git operations
  db/                   # Database
packages/               # TypeScript frontend
  local-web/            # Web UI (kanban board, workspace view)
  public/               # Static assets
npx-cli/               # NPM CLI launcher
Cargo.toml              # Rust workspace root
pnpm-workspace.yaml     # TS workspace root
```

## Key Techniques

1. **Kanban-to-workspace pipeline** -- Issues on kanban board become workspaces with isolated git worktrees, terminals, and dev servers
2. **Multi-agent executor abstraction** -- Unified interface for 10+ coding agents (Claude Code, Codex, Gemini CLI, Copilot, Amp, Cursor, OpenCode, Droid, CCR, Qwen Code)
3. **Inline code review** -- Review diffs and leave comments that get sent directly to the agent
4. **Built-in browser preview** -- Preview with devtools, inspect mode, and device emulation
5. **Git worktree isolation** -- Each workspace gets its own branch via git worktrees
6. **PR lifecycle** -- Create PRs with AI-generated descriptions, review, and merge from UI

---

## Processes

### 1. Kanban-Driven Agent Orchestration (specializations/shared/kanban-agent-orchestration)

A cross-domain process for organizing multi-task work using kanban methodology with coding agent dispatch.

**Phases:**
1. **Issue decomposition** -- Break feature/project into kanban issues with priority, labels, and acceptance criteria
2. **Dependency mapping** -- Identify issue dependencies and determine execution order (parallel where possible)
3. **Workspace provisioning** -- For each ready issue: create isolated workspace (git worktree + branch)
4. **Agent dispatch** -- Assign coding agent to workspace with issue description as prompt; use ctx.parallel.all() for independent issues
5. **Review gate** -- Breakpoint for human review of each agent's diff output; inline comments feed back to agent for revision
6. **PR creation** -- Generate PR with AI-assisted description from completed work
7. **Board update** -- Move issues through kanban columns (todo -> in-progress -> review -> done)

**Key insight:** The kanban board as orchestration layer maps well to babysitter's task dispatch. Each kanban issue becomes a task, the board state becomes process state, and review gates become breakpoints.

**Placement justification:** Kanban is a cross-domain workflow pattern. Goes in specializations/shared/.

## Plugin Ideas

### 1. Kanban Board Dashboard Widget (Category: Developer Experience & UX)

A babysitter plugin that renders pending/active/completed tasks as a kanban board in the observer dashboard. Maps babysitter's task states to kanban columns: pending -> "To Do", active -> "In Progress", completed -> "Done", failed -> "Blocked".

**install.md**: Registers an observer-dashboard widget that reads run task state and renders a kanban view. Supports drag-and-drop priority reordering. Provides `/kanban` command to view board in terminal.

### 2. Git Worktree Workspace Isolation (Category: DevOps & Infrastructure)

A babysitter plugin that provisions isolated git worktrees for parallel task execution. When a process dispatches parallel tasks, each task gets its own worktree with a dedicated branch, preventing merge conflicts during concurrent work.

**install.md**: Installs `on-task-start` hook that creates a git worktree for the task's workspace. On `on-task-complete`, merges the worktree branch back and cleans up. Handles merge conflicts by creating a breakpoint for human resolution.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Kanban-Driven Agent Orchestration | NEW | Task organization using kanban methodology with agent dispatch | - | specializations/shared/kanban-agent-orchestration.js |
| Multi-Agent Executor Abstraction | UPGRADE | Enhanced agent dispatch with unified interface | library/specializations/ai-agents-conversational/ | specializations/shared/multi-agent-executor.js |
| Workspace Isolation with Git Worktrees | UPGRADE | Enhanced git worktree management | library/methodologies/superpowers/ | specializations/shared/workspace-isolation.js |
| Inline Code Review Integration | NEW | Review workflow with agent feedback loops | - | specializations/shared/inline-review-integration.js |
| Issue-to-Workspace Pipeline | NEW | Automated workspace provisioning from issue descriptions | - | specializations/workflow-automation/issue-workspace-pipeline.js |
| PR Lifecycle Automation | NEW | AI-assisted PR creation and description generation | - | specializations/devops-sre-platform/pr-lifecycle-automation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Kanban Board Dashboard Widget | NEW | Task visualization as kanban board in observer dashboard | - | plugins/a5c/marketplace/blueprints/kanban-dashboard-widget/ |
| Git Worktree Workspace Isolation | UPGRADE | Enhanced workspace isolation for parallel tasks | agentsh | plugins/a5c/marketplace/blueprints/git-worktree-isolation/ |
