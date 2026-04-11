# Harness Strengths

Areas where the Babysitter harness platform is ahead of or differentiated from Claude Code.

## Overview

While this gap analysis focuses primarily on areas where Claude Code leads, the Babysitter harness has several architectural and functional advantages. These strengths should be preserved and amplified during gap closure work.

## Architectural Strengths

### 1. Event-Sourced Deterministic Replay

**What**: Every state change in a run is recorded as an immutable journal event. The replay engine (`packages/sdk/src/runtime/replay/createReplayEngine.ts`) can replay any run from its journal, producing identical results.

**Why it matters**: CC sessions are not replayable. If a CC session fails mid-way, there is no way to reproduce the exact sequence of events. The harness can rebuild state from journal at any time via `run:rebuild-state`.

**Key components**:
- Journal storage: `packages/sdk/src/storage/` (appendEvent, loadJournal)
- Replay engine: `packages/sdk/src/runtime/replay/`
- ReplayCursor: Sequential S000001-style IDs for deterministic positioning
- State cache: Derived and rebuildable (`runtime/replay/stateCache.ts`)
- Atomic write protocol: Temp-file -> fsync -> rename guarantees integrity

### 2. Multi-Harness Orchestration

**What**: The harness can delegate work to 10+ different AI CLI tools simultaneously, treating them as interchangeable workers.

**Why it matters**: CC can only use CC agents. The harness can assign Claude Code for complex reasoning, Gemini CLI for broad context, Codex for code generation, and Pi for interactive sessions -- all within a single orchestration run.

**Supported adapters** (`packages/sdk/src/harness/`):
| Adapter | CLI | Capabilities |
|---------|-----|-------------|
| ClaudeCodeAdapter | `claude` | session-binding, stop-hook, mcp, headless-prompt |
| CodexAdapter | `codex` | session-binding, stop-hook, headless-prompt |
| CursorAdapter | `cursor` | headless-prompt, stop-hook, session-binding, mcp |
| GeminiCliAdapter | `gemini` | session-binding, headless-prompt, stop-hook |
| GithubCopilotAdapter | `copilot` | headless-prompt, session-binding, mcp |
| PiAdapter | `pi` | programmatic, session-binding, headless-prompt |
| OhMyPiAdapter | `omp` | programmatic, session-binding, headless-prompt, mcp |
| OpenClawAdapter | `openclaw` | session-binding, mcp, headless-prompt |
| OpenCodeAdapter | `opencode` | headless-prompt |
| InternalAdapter | `internal` | programmatic, session-binding, stop-hook, headless-prompt |

### 3. Process Library System

**What**: Git-based process library with clone, update, and scoped binding (default/run/session).

**Why it matters**: CC has built-in agents but no reusable, versioned process definitions. The harness's process library (`packages/sdk/src/processLibrary/`) enables:
- Community-contributed process definitions
- Version-pinned process binding per run
- Methodology sharing (TDD, spec-driven, domain-specific)
- Process catalog with SQLite indexing (`packages/catalog/`)

### 4. Plugin Migration System

**What**: BFS shortest-path migration chain resolution for plugin version upgrades.

**Why it matters**: CC plugins have no migration path between versions. The harness's migration system (`packages/sdk/src/plugins/migrations.ts`) can:
- Parse migration filenames for version edges
- Build a directed migration graph
- Find shortest path between any two versions
- Execute migration chain sequentially

### 5. Breakpoint Auto-Approval Pattern Language

**What**: Expressive pattern matching for breakpoint auto-approval with glob-based IDs, attribute predicates (tags contains, expert =), AND combinator, and consecutive approval escalation.

**Why it matters**: CC's permission model is per-tool-type. The harness's pattern language (`packages/sdk/src/breakpoints/patterns.ts`) can express fine-grained policies like:
- "Auto-approve all breakpoints tagged `low-risk` from expert `qa-team`"
- "Auto-approve `confirm.test-run.*` after 3 consecutive approvals"
- "Never auto-approve breakpoints tagged `destructive`"

### 6. Observer Dashboard

**What**: Dedicated real-time monitoring UI for all runs in a workspace.

**Why it matters**: CC's observability is inline with the session -- you see progress as part of the conversation. The observer dashboard (`packages/observer-dashboard/`) provides a separate, dedicated monitoring surface:
- Live journal event streaming
- Task status visualization
- Multi-run monitoring
- Effect lifecycle tracking

### 7. Structured Hook System

**What**: 13 hook types with shell-script discovery from project and user directories.

**Why it matters**: CC has hooks but they are tightly coupled to the CC runtime. The harness's hook system (`packages/sdk/src/hooks/`) is harness-agnostic:
- Hooks work with any harness (Claude Code, Codex, Cursor, etc.)
- Support .sh, .js, .ts, .py, .bash extensions
- Discovered from `.a5c/hooks/` and `~/.a5c/hooks/`
- Custom hook types supported

### 8. Atomic Write Protocol

**What**: Every file write follows temp-file -> fsync -> rename -> sync-parent-dir with 3 retries on EBUSY/ETXTBSY/EPERM/EACCES.

**Why it matters**: This ensures data integrity even on crash or power loss. CC does not guarantee atomic writes for its session data.

## Functional Strengths

### 9. Harness Discovery and Installation

`harness:discover` detects all installed AI CLIs via parallel PATH detection. `harness:install` and `harness:install-plugin` provide one-command setup. CC has no equivalent for discovering or installing other AI tools.

### 10. Process Definition Portability

Process definitions are plain JS files exporting `async function process(inputs, ctx)`. They run on any harness adapter, making them portable across AI providers. CC's workflows are CC-specific.

### 11. Agentic Tool Injection

The 16 agentic tool definitions (`packages/sdk/src/harness/agenticTools.ts`) are injectable into any Pi session:
- read, write, edit, grep, find, bash, python, ssh
- browser, fetch, ask, calc, ast_grep, ast_edit
- render_mermaid, notebook

### 12. Retrospective Analysis

`harness:retrospect` analyzes past runs for insights and process improvements. `harness:assimilate` converts external methodologies into process definitions. CC has no equivalent post-hoc analysis.

### 13. Docker-Based Secure Sandbox

`piSecureSandbox` (`packages/sdk/src/harness/piSecureSandbox.ts`) provides Docker-based isolation for Pi bash execution, sandboxing command execution in containers. CC's sandbox is less granular.

## Preserving Strengths During Gap Closure

When implementing gap closure items, ensure these strengths are preserved:

1. **Do not sacrifice deterministic replay** for streaming or real-time features
2. **Do not couple to a single harness** -- all new features must work across adapters
3. **Do not bypass the journal** for state changes -- maintain event-sourcing
4. **Do not break the atomic write protocol** -- integrity over performance
5. **Extend the pattern language** rather than replacing it with per-tool permissions
6. **Keep process definitions portable** -- no harness-specific APIs in process code
