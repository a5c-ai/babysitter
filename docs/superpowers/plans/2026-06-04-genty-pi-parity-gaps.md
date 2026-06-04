# Genty Stack — Pi Parity Gap Analysis

> Baseline: [pi.dev](https://pi.dev/) as of 2026-06-04

The genty stack should be a superset of Pi's capabilities. This document maps every Pi feature to the correct layer in our stack, identifies what's implemented, what's partial, and what's missing.

---

## Stack Layer Reference

| Layer | Abstract Role | Our Implementation |
|-------|--------------|-------------------|
| L4 agent-core | Core runtime primitives | `@a5c-ai/genty-core` |
| L5 agent-runtime | Session/daemon/resource management | `@a5c-ai/genty-runtime` |
| L6 agent-platform | Orchestration, harness, governance | `@a5c-ai/genty-platform` |
| SDK | Public API surface | `@a5c-ai/babysitter-sdk` |
| Adapters | Harness integration | `@a5c-ai/adapters` family |

---

## 1. Modes of Operation

### 1.1 Interactive Mode — IMPLEMENTED

Full TUI via `@a5c-ai/genty-tui` (Ink). Harness orchestration via genty-platform. Real-time event rendering, breakpoint approval, parallel task visualization.

**No work needed.**

### 1.2 Print / JSON Mode — PARTIAL

**What Pi has:** `pi -p "query"` for one-shot execution. `--mode json` for structured event streams.

**What we have:** `genty tui --json` as a non-interactive fallback. No dedicated one-shot print mode.

**Gap:**
- Add `genty -p "query"` — run a single prompt, print result, exit
- Add `--mode json` — emit structured JSONL event stream to stdout
- Both should work without TUI dependencies

**Where:** `@a5c-ai/genty` (CLI package, `packages/genty/cli/`)

### 1.3 RPC Mode — GAP

**What Pi has:** JSON protocol over stdin/stdout for non-Node integrations. Documented in `docs/rpc.md`.

**What we have:** MCP server mode (babysitter-mcp-server) over stdio, but that's MCP protocol, not a general-purpose RPC.

**Gap:**
- Implement a JSON-RPC or JSONL protocol over stdin/stdout
- Enable Python, Go, Rust, etc. clients to drive genty without Node.js
- Document the protocol in `docs/rpc.md`

**Where:** `@a5c-ai/genty-runtime` (protocol definition) + `@a5c-ai/genty` (CLI entry point `genty rpc`)

### 1.4 SDK Mode — IMPLEMENTED

`@a5c-ai/babysitter-sdk` provides `defineTask`, run management, sessions, hooks. Programmatic embedding works. OpenClaw-style integration is possible today.

**No work needed.**

---

## 2. Context Engineering

### 2.1 AGENTS.md — PARTIAL

**What Pi has:** Project instructions loaded at startup from `~/.pi/agent/`, parent directories, and CWD. Hierarchical merge.

**What we have:** Harness-specific loading (CLAUDE.md for Claude Code, AGENTS.md for Codex/Copilot). Genty-platform's piWrapper loads some instruction files.

**Gap:**
- Genty should natively load `AGENTS.md` (or `GENTY.md`) from:
  1. `~/.genty/agent/` (global)
  2. Each parent directory up to filesystem root
  3. Current working directory
- Hierarchical merge with later files taking precedence
- Independent of which harness is underneath

**Where:** `@a5c-ai/genty-platform` (harness/internal instruction loader)

### 2.2 SYSTEM.md — GAP

**What Pi has:** Per-project `SYSTEM.md` that replaces or appends to the default system prompt.

**What we have:** Nothing. System prompts are hardcoded in harness wrappers.

**Gap:**
- Load `SYSTEM.md` from project root
- Support `replace` mode (overwrite default) and `append` mode (add to default)
- Apply before first turn

**Where:** `@a5c-ai/genty-platform` (prompt construction pipeline)

### 2.3 Compaction — IMPLEMENTED

4-layer compression subsystem in SDK:
1. User prompt density filter (~29% reduction)
2. Command output compressor (~47%)
3. SDK context sentence extractor (~87%)
4. Process library pre-cache (~94%)

Auto-summarizes at context limit. Customizable per-layer via config.

**No work needed.**

### 2.4 Skills — IMPLEMENTED

Skills with `SKILL.md`, progressive disclosure, on-demand loading. Unified plugin system with marketplace. `/skill-name` invocation.

**No work needed.**

### 2.5 Prompt Templates — IMPLEMENTED

Commands as markdown files in `commands/` directory. `/name` expansion. Supports frontmatter metadata.

**No work needed.**

### 2.6 Dynamic Context — PARTIAL

**What Pi has:** Extensions can inject messages before each turn, filter message history, implement RAG, or build long-term memory.

**What we have:** Hooks can inject context at sessionStart and userPromptSubmit. No extension-based history filtering or built-in RAG.

**Gap:**
- Add `preTurn` extension point: inject messages before each model call
- Add `historyFilter` extension point: transform/filter message history
- Add RAG pipeline: embed project context, retrieve relevant chunks per-turn
- Add long-term memory extension point

**Where:** `@a5c-ai/genty-platform` (turn lifecycle + extension API)

---

## 3. Extensibility

### 3.1 Extension API — GAP (Critical)

**What Pi has:** TypeScript modules that can register:
- Tools (callable by the model)
- Commands (slash commands)
- Keyboard shortcuts
- Event listeners
- TUI components (status bars, panels)
- Dynamic context injection

50+ community extensions. Installable via `pi install npm:@foo/pi-tools`.

**What we have:** Plugin system with skills, hooks, MCP servers, and commands — but no programmatic Extension API for TypeScript modules that run in-process.

**Gap — this is the biggest architectural delta:**
- Define an Extension API contract:
  ```typescript
  interface GentyExtension {
    name: string;
    activate(ctx: ExtensionContext): void | Promise<void>;
    deactivate?(): void | Promise<void>;
  }
  interface ExtensionContext {
    registerTool(tool: ToolDefinition): void;
    registerCommand(name: string, handler: CommandHandler): void;
    registerKeyBinding(key: string, handler: () => void): void;
    onEvent(event: string, handler: EventHandler): void;
    registerStatusBarItem(item: StatusBarItem): void;
    injectContext(provider: ContextProvider): void;
  }
  ```
- Extension discovery from `~/.genty/extensions/`, project `.genty/extensions/`, and npm packages
- Extension lifecycle (activate on load, deactivate on exit)
- Sandboxing / permission model

**Where:**
- API contract: `@a5c-ai/genty-core` (extension types + registry)
- Discovery + lifecycle: `@a5c-ai/genty-platform` (extension loader)
- Installation: `@a5c-ai/genty-platform` (`genty install` command)
- TUI integration: `@a5c-ai/genty-tui` (status bar, panels)

### 3.2 Plugins — IMPLEMENTED

Full plugin system: skills, MCP servers, hooks, commands. Marketplace CLI. Per-harness bundles via extensions-adapter compiler.

**No work needed.**

### 3.3 Hooks — IMPLEMENTED

Lifecycle hooks: sessionStart, sessionEnd, stop, preToolUse, postToolUse, userPromptSubmit, preCompact, notification. Per-harness adapters (13 harnesses).

**No work needed.**

### 3.4 MCP Support — IMPLEMENTED

MCP server mode (`babysitter-mcp-server`). MCP client for plugin tool servers. `.mcp.json` in plugins.

**No work needed.**

### 3.5 Installable Extension Packages — PARTIAL

**What Pi has:** `pi install npm:@foo/pi-tools` — install from npm or git.

**What we have:** Plugin marketplace with `codex plugin marketplace add`, `babysitter harness:install-plugin`, SDK helpers. No generic `genty install` for extensions.

**Gap:**
- `genty install npm:@foo/genty-extension` — install from npm
- `genty install git:github.com/user/repo` — install from git
- `genty install ./local-path` — install from local directory
- Package discovery, installation, dependency resolution, version management

**Where:** `@a5c-ai/genty-platform` (package manager integration)

---

## 4. Session Management

### 4.1 Tree-Structured History — GAP

**What Pi has:** Sessions stored as trees. `/tree` navigates to any previous point. Branch from any message. All branches in a single file. Filter by message type, bookmark entries.

**What we have:** Linear event-sourced journal. Full replay/resume, but no branching.

**Gap:**
- Tree data structure for session messages (parent pointers, branch IDs)
- `/tree` command: visual tree navigator
- Fork from any message: create a new branch continuing from that point
- Single-file storage format (all branches in one journal)
- Bookmarks and message-type filters

**Where:** `@a5c-ai/genty-runtime` (session storage model) + `@a5c-ai/genty-tui` (tree visualization)

### 4.2 Session Export / Share — GAP

**What Pi has:** `/export` generates HTML. `/share` uploads to GitHub gist with rendered view and shareable URL.

**What we have:** Journal files are inspectable but not exportable as HTML or shareable.

**Gap:**
- `/export` — render session as standalone HTML with syntax highlighting
- `/share` — upload to GitHub gist, return shareable URL
- HTML renderer should handle tool calls, thinking blocks, images

**Where:** `@a5c-ai/genty-runtime` (export logic) + `@a5c-ai/genty` (CLI commands)

### 4.3 Session Resume — IMPLEMENTED

Event-sourced journal with deterministic replay. `babysitter resume` and `genty resume` commands. Works across sessions and harnesses.

**No work needed.**

---

## 5. Model & Provider Support

### 5.1 Multi-Provider — IMPLEMENTED

15+ harnesses with provider routing via transport-adapter proxy. Anthropic, OpenAI, Google, Azure, Bedrock, and more.

**No work needed.**

### 5.2 Mid-Session Model Switch — PARTIAL

**What Pi has:** `/model` to switch models. `Ctrl+P` to cycle favorites.

**What we have:** Model selection at launch via `--model` flag. No mid-session switching.

**Gap:**
- `/model` command: switch model mid-session
- `Ctrl+P` keyboard shortcut: cycle through favorite models
- Model favorites configuration in `~/.genty/config`

**Where:** `@a5c-ai/genty-platform` (model resolution) + `@a5c-ai/genty-tui` (key binding)

---

## 6. Agent Interaction

### 6.1 Steering — GAP

**What Pi has:** Submit messages during execution. `Enter` = steer (delivered after current tool completes). `Alt+Enter` = follow-up (queued until turn ends).

**What we have:** No mid-execution message injection. User must wait for stop hook.

**Gap:**
- Steering queue: accept user input while model is executing
- `Enter` during execution: deliver as steering message after current tool
- `Alt+Enter` during execution: queue as follow-up for next turn
- TUI visual indicator showing queued steering messages

**Where:** `@a5c-ai/genty-platform` (execution loop) + `@a5c-ai/genty-tui` (input handling)

### 6.2 Approval Modes — IMPLEMENTED

Interactive (breakpoints) and yolo (auto-approve). Configurable per-process. Breakpoint density tied to user profile.

**No work needed.**

---

## Priority Order

Based on architectural impact and user value:

1. **Extension API** — enables community-driven feature growth without core changes
2. **Print/JSON mode** — unblocks CI/CD and scripting use cases
3. **RPC mode** — unblocks non-Node integrations
4. **AGENTS.md / SYSTEM.md** — context engineering fundamentals
5. **Tree-structured history** — non-linear exploration
6. **Steering** — real-time interaction during execution
7. **Mid-session model switch** — workflow flexibility
8. **Session export/share** — collaboration
9. **Dynamic context extensions** — RAG, memory, history filtering
10. **Installable extension packages** — ecosystem growth
