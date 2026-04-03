# Coding Agent Harness Extensibility -- Comparison & Index

> **Last updated**: 2026-04-02
> **Methodology**: Deep research via web search, official documentation, and source code analysis for each harness

## Overview

This directory documents the extensibility, plugin systems, and capabilities of 8 coding agent harnesses. Each harness has its own subdirectory with comprehensive documentation, references, and examples.

## Harness Index

| Harness | Directory | Description |
|---------|-----------|-------------|
| [Claude Code](./claude-code/) | `claude-code/` | Anthropic's official CLI and IDE extension |
| [OpenAI Codex CLI](./codex/) | `codex/` | OpenAI's open-source terminal coding agent |
| [Gemini CLI](./gemini-cli/) | `gemini-cli/` | Google's official CLI for Gemini models |
| [Pi](./pi/) | `pi/` | Coding agent from pi-mono (@mariozechner) |
| [Oh My Pi](./oh-my-pi/) | `oh-my-pi/` | Enhanced Pi fork with orchestration support |
| [OpenCode](./opencode/) | `opencode/` | Open-source terminal assistant by Anomaly |
| [GitHub Copilot](./github-copilot/) | `github-copilot/` | GitHub's AI coding assistant ecosystem |
| [Cursor](./cursor/) | `cursor/` | AI-first IDE built on VS Code |

---

## Comparison Matrix

### Plugin/Extension Architecture

| Harness | Plugin System | Manifest Format | Maturity |
|---------|--------------|-----------------|----------|
| **Claude Code** | Full plugin system | `.claude-plugin/plugin.json` | Mature |
| **Codex CLI** | Rust-native plugins | `PLUGIN_MANIFEST_PATH` (emerging) | Early |
| **Gemini CLI** | Full extension system | `gemini-extension.json` | Mature |
| **Pi / Oh My Pi** | Extension API via `omp` field | `package.json` with `omp` field | Moderate |
| **OpenCode** | Plugin system (local + npm) | `opencode.json` plugin config | Active |
| **GitHub Copilot** | MCP-first (old system deprecated) | `.agent.md` YAML frontmatter | Transitioning |
| **Cursor** | Full plugin system (v2.5+) | `.cursor-plugin/plugin.json` | New (Feb 2026) |

### Skills Support

| Harness | Skills | Format | Auto-Discovery |
|---------|--------|--------|----------------|
| **Claude Code** | Yes | `SKILL.md` with YAML frontmatter | Yes (paths globs, description matching) |
| **Codex CLI** | Yes | `SKILL.md` | Yes (system + plugin skills) |
| **Gemini CLI** | Yes | `skills/` directory in extensions | Yes |
| **Pi / Oh My Pi** | Yes | `SKILL.md` with YAML frontmatter | Via extension registration |
| **OpenCode** | Yes | `instructions` config + globs | Yes (via config) |
| **GitHub Copilot** | Yes (Agent Skills) | Folders with instructions/scripts | Yes (open standard) |
| **Cursor** | Yes | `SKILL.md` with YAML frontmatter | Yes (description-based triggering) |

### Custom Commands

| Harness | Custom Commands | Format |
|---------|----------------|--------|
| **Claude Code** | Yes (merged into skills) | `.claude/commands/*.md` or `skills/<name>/SKILL.md` |
| **Codex CLI** | Built-in only (`/review`, `/apps`) | No user-defined API |
| **Gemini CLI** | Yes | Extension `commands/` directory |
| **Pi / Oh My Pi** | Yes | `commands/*.md` with YAML frontmatter |
| **OpenCode** | Yes | `~/.config/opencode/commands/*.md` |
| **GitHub Copilot** | No traditional commands | `@`-mentions (deprecated), `#` for MCP tools |
| **Cursor** | Yes | `commands/*.md` with YAML frontmatter |

### Hook System

| Harness | Hooks | Event Count | Config Format | Key Events |
|---------|-------|-------------|---------------|------------|
| **Claude Code** | Yes | 20+ | `settings.json` | PreToolUse, PostToolUse, Stop, SessionStart, SubagentStart/Stop, FileChanged, WorktreeCreate/Remove |
| **Codex CLI** | Yes | 5 | `config.toml` | PreToolUse, PostToolUse, SessionStart, Stop, UserPromptSubmit |
| **Gemini CLI** | Yes | 2+ | `hooks/hooks.json` | SessionStart, AfterAgent (block/allow/deny) |
| **Pi / Oh My Pi** | Yes (event-based) | 10 | ExtensionAPI.on() | session_start, agent_end, tool_call, context, turn_start/end |
| **OpenCode** | Yes (plugin hooks) | 15+ | `opencode.json` plugin | tool.execute.before/after, session.created/idle, file.edited, shell.env |
| **GitHub Copilot** | Yes | 8 | `.github/hooks/*.json` | sessionStart, preToolUse, postToolUse, agentStop, errorOccurred |
| **Cursor** | Yes | 6+ | `.cursor/hooks.json` | beforeShellExecution, beforeMCPExecution, afterFileEdit, stop |

### Session ID Persistence Between Hooks

All adapters use `BABYSITTER_SESSION_ID` as the cross-harness standard env var for session identity. Each harness writes it via its own env persistence mechanism.

| Harness | Env File Mechanism | Native Env Injection | Cross-Harness Var | Stdin JSON |
|---------|-------------------|---------------------|-------------------|------------|
| **Claude Code** | `CLAUDE_ENV_FILE` | None | `BABYSITTER_SESSION_ID` written to `CLAUDE_ENV_FILE` | `session_id` |
| **Codex CLI** | None | `CODEX_THREAD_ID` (auto-injected) | `BABYSITTER_SESSION_ID` (env), fallback to `CODEX_THREAD_ID` | `session_id` |
| **Gemini CLI** | None needed | `GEMINI_SESSION_ID` (auto-injected) | `BABYSITTER_SESSION_ID` (env), fallback to `GEMINI_SESSION_ID` | `session_id` |
| **Pi / Oh My Pi** | None | `OMP_SESSION_ID` / `PI_SESSION_ID` | `BABYSITTER_SESSION_ID` (env), fallback to native | N/A (in-process) |
| **OpenCode** | None | None | `BABYSITTER_SESSION_ID` (if set externally) | `session.created` event |
| **GitHub Copilot** | `COPILOT_ENV_FILE` (or `CLAUDE_ENV_FILE`) | None | `BABYSITTER_SESSION_ID` written to env file | `session_id` |
| **Cursor** | None | None | `BABYSITTER_SESSION_ID` (if set externally) | `conversation_id` |

**Note:** Session state files (iteration tracking, run binding) are stored in `~/.a5c/state/` globally, independent of the env persistence mechanism above.

### MCP (Model Context Protocol) Support

| Harness | MCP Support | Transports | Config Location |
|---------|------------|------------|-----------------|
| **Claude Code** | Full | stdio, sse, streamable-http, ws | `.mcp.json`, settings.json |
| **Codex CLI** | Full | stdio + remote | `config.toml [mcp_servers]` |
| **Gemini CLI** | Full | Via manifest mcpServers | `gemini-extension.json` |
| **Pi / Oh My Pi** | No native | N/A (babysitter MCP available separately) | N/A |
| **OpenCode** | Full | stdio, sse | `opencode.json` `mcp` key |
| **GitHub Copilot** | Full (GA) | stdio, sse | Repo settings, `copilot-setup-steps.yml` |
| **Cursor** | Full | stdio, sse, streamable-http | `.cursor/mcp.json` |

### Distribution & Marketplace

| Harness | Marketplace | Distribution Method |
|---------|------------|-------------------|
| **Claude Code** | Git-based marketplaces (`marketplace.json`) | GitHub repos, npm, git-subdir, relative paths |
| **Codex CLI** | None yet | npm, Homebrew, GitHub Releases |
| **Gemini CLI** | Extension gallery (geminicli.com/extensions) | `gemini extensions install` from GitHub/local |
| **Pi / Oh My Pi** | Babysitter marketplace system | npm (`@a5c-ai/babysitter-pi`) |
| **OpenCode** | None yet | npm, Homebrew, curl |
| **GitHub Copilot** | GitHub MCP Registry (replacing old Marketplace) | Repo files, MCP Registry |
| **Cursor** | Cursor Marketplace (cursor.com/marketplace) | Marketplace UI, `/add-plugin`, Team Marketplaces |

### Agent/Subagent Support

| Harness | Custom Agents | Format | Key Features |
|---------|--------------|--------|--------------|
| **Claude Code** | Yes | `.claude/agents/*.md` | model, tools, memory, isolation, background, mcpServers |
| **Codex CLI** | AGENTS.md | Root + hierarchical | developer_instructions, model_instructions_file |
| **Gemini CLI** | GEMINI.md | Project instructions | contextFileName in manifest |
| **Pi / Oh My Pi** | AGENTS.md | Root + traversal | CLAUDE.md preferred, repo instruction discovery |
| **OpenCode** | Yes (`agent` config) | `opencode.json` agent definitions | Built-in sub-agent + custom agents |
| **GitHub Copilot** | Yes | `.github/agents/*.agent.md` | target (vscode/github-copilot), mcp-servers, 30K char |
| **Cursor** | Yes | `.cursor/agents/*.md` | model, readonly, is_background, cloud agents |

### Permission Model

| Harness | Permission Model | Sandbox | Auto-Approve |
|---------|-----------------|---------|--------------|
| **Claude Code** | `Tool(specifier)` rules, deny>ask>allow | OS-level filesystem/network | Auto mode classifier |
| **Codex CLI** | Named profiles, execpolicy | Platform-specific (Seatbelt/Linux/Windows) | approval_policy modes |
| **Gemini CLI** | Extension-level | N/A | N/A |
| **Pi / Oh My Pi** | toolsMode (default/coding/readonly) | Docker (@agentsh/secure-sandbox) | Tool interception during runs |
| **OpenCode** | Configurable per-tool (`permission` config) | None | `auto`/`ask`/`deny` per tool |
| **GitHub Copilot** | Org-level MCP policies | GitHub Actions firewall | Per-server/per-tool auto-approve |
| **Cursor** | YOLO mode (terminal only, NOT MCP) | None (readonly subagents) | Pattern-based command approval |

### Custom Instructions File

| Harness | Primary File | Additional Files |
|---------|-------------|-----------------|
| **Claude Code** | `CLAUDE.md` | `~/.claude/CLAUDE.md`, `.claude/rules/*.md` |
| **Codex CLI** | `AGENTS.md` | `developer_instructions` in config.toml |
| **Gemini CLI** | `GEMINI.md` | Via `contextFileName` in manifest |
| **Pi / Oh My Pi** | `AGENTS.md` | `CLAUDE.md` (preferred), repo traversal |
| **OpenCode** | `opencode.json` `instructions` | Glob patterns, CLAUDE.md, .cursorrules |
| **GitHub Copilot** | `AGENTS.md` | `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` |
| **Cursor** | `.cursor/rules/*.mdc` | `.cursorrules` (legacy), global rules in settings |

---

## Key Insights

### Convergence Patterns

1. **SKILL.md is becoming a standard**: Claude Code, Codex CLI, Cursor, and Pi all use SKILL.md with YAML frontmatter. The [AgentSkills.io](https://agentskills.io) open standard formalizes this.

2. **MCP is universal**: Every active harness except Pi/Oh My Pi supports MCP natively. GitHub Copilot even deprecated its proprietary extension system in favor of MCP.

3. **Hook systems are converging**: Claude Code, Codex, GitHub Copilot, and Cursor all have PreToolUse/PostToolUse-style hooks with approve/deny semantics. The event names differ but the pattern is identical.

4. **Custom instruction files**: Every harness reads at least one markdown instruction file (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, opencode.md). Most read multiple formats for cross-compatibility.

5. **Plugin manifests**: Claude Code (plugin.json), Codex (.codex-plugin/plugin.json), Gemini CLI (gemini-extension.json), Cursor (.cursor-plugin/plugin.json), and GitHub Copilot (plugin.json) all use JSON manifests. Pi uses package.json with `omp` field.

### Divergence Points

1. **Orchestration loop support**: Claude Code (Stop hook), Gemini CLI (AfterAgent hook), Pi/Oh My Pi (agent_end event), Cursor (stop hook with loop_limit), and Codex (Stop event) all support between-turn orchestration loops.

2. **Distribution maturity**: Claude Code and Cursor have full marketplaces. Gemini CLI has a gallery. Others rely on npm/git distribution.

3. **Sandboxing approach**: Codex uses OS-level sandboxing (Seatbelt), Pi uses Docker, Claude Code uses filesystem/network isolation, others have minimal or no sandboxing.

4. **IDE vs Terminal**: Claude Code and Cursor are IDE-integrated. Codex, Gemini CLI, OpenCode, and Pi are terminal-native. GitHub Copilot spans both.

### Babysitter Compatibility

The Babysitter SDK includes adapters for all 8 harnesses (`packages/sdk/src/harness/`). Key compatibility considerations:

| Harness | Stop Hook | Session Binding | Programmatic API |
|---------|-----------|----------------|-----------------|
| Claude Code | Yes (Stop event) | Yes (BABYSITTER_SESSION_ID via CLAUDE_ENV_FILE) | Yes (CLI -p mode) |
| Codex CLI | Yes (Stop event) | Yes (BABYSITTER_SESSION_ID, CODEX_THREAD_ID auto-injected) | Yes (CLI) |
| Gemini CLI | Yes (AfterAgent) | Yes (BABYSITTER_SESSION_ID, GEMINI_SESSION_ID auto-injected) | Yes (CLI) |
| Pi / Oh My Pi | Yes (agent_end) | Yes (BABYSITTER_SESSION_ID, PI_SESSION_ID/OMP_SESSION_ID) | Yes (PiSessionHandle) |
| OpenCode | Partial (via plugins) | Partial (BABYSITTER_SESSION_ID if set) | Partial |
| GitHub Copilot | Partial (agentStop) | Yes (BABYSITTER_SESSION_ID via COPILOT_ENV_FILE) | Partial |
| Cursor | Yes (stop hook with loop_limit) | Partial (BABYSITTER_SESSION_ID if set, conversation_id via stdin) | Partial (CLI agent) |

---

## Directory Structure

```
harnesses/
├── README.md                 # This file (comparison & index)
├── claude-code/
│   ├── README.md
│   ├── references.md
│   └── examples/
├── codex/
│   ├── README.md
│   ├── references.md
│   └── examples/
├── gemini-cli/
│   ├── README.md
│   ├── references.md
│   └── examples/
├── pi/
│   ├── README.md
│   ├── references.md
│   └── examples/
├── oh-my-pi/
│   ├── README.md
│   └── references.md
├── opencode/
│   ├── README.md
│   └── references.md
├── github-copilot/
│   ├── README.md
│   ├── references.md
│   └── examples/
└── cursor/
    ├── README.md
    ├── references.md
    └── examples/
```
