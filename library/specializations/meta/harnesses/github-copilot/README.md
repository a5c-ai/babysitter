# GitHub Copilot Harness -- Extensibility Reference

> Last updated: 2026-04-02

## Overview

GitHub Copilot is GitHub's AI coding assistant, available across three primary surfaces:

- **IDE Extension** -- VS Code, JetBrains, Eclipse, Xcode, Visual Studio. Provides inline completions, chat, agent mode, and custom agents.
- **CLI** (`copilot-cli`) -- Terminal-based agentic coding. Reached GA in March 2026. Supports agents, skills, hooks, MCP, and custom instructions.
- **Cloud Coding Agent** -- Runs autonomously in a GitHub Actions-powered environment. Triggered from Issues or PRs. Uses `copilot-setup-steps.yml` for environment customization.

All three surfaces share the same extensibility primitives: custom agents, agent skills, hooks, MCP servers, and custom instructions.

---

## Plugin Structure

GitHub Copilot's extensibility model is distributed across multiple file types and directories rather than a single plugin manifest. A "plugin" for Copilot is a composable package of agents, skills, hooks, commands, and instructions.

### Plugin Manifest: `plugin.json`

Plugins can declare a `plugin.json` manifest (placed in `.github/plugin.json` or at the plugin package root) to bundle all components:

```json
{
  "name": "babysitter",
  "version": "0.1.0",
  "description": "Orchestrate complex, multi-step workflows with event-sourced state management",
  "author": { "name": "a5c.ai", "email": "support@a5c.ai" },
  "license": "MIT",
  "skills": "skills/",
  "hooks": "hooks.json",
  "commands": "commands/",
  "agents": "AGENTS.md",
  "repository": {
    "type": "git",
    "url": "https://github.com/a5c-ai/babysitter"
  },
  "keywords": [
    "orchestration", "workflow", "automation",
    "github-copilot", "agent", "LLM"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Plugin identifier |
| `version` | string | Yes | Semver version |
| `description` | string | Yes | Plugin description |
| `author` | string or object | Yes | Author name or `{ name, email }` |
| `license` | string | No | SPDX license identifier |
| `skills` | string | No | Relative path to skills directory |
| `hooks` | string | No | Relative path to hooks.json |
| `commands` | string | No | Relative path to commands directory |
| `agents` | string | No | Relative path to AGENTS.md file |
| `repository` | object | No | Git repository info |
| `keywords` | string[] | No | Discovery tags |

### Plugin Directory Structure

```
my-copilot-plugin/
├── plugin.json              # Plugin manifest
├── hooks.json               # Hook event definitions
├── hooks/
│   ├── session-start.sh     # Unix hook scripts
│   ├── session-start.ps1    # Windows hook scripts
│   ├── session-end.sh
│   ├── session-end.ps1
│   ├── user-prompt-submitted.sh
│   └── user-prompt-submitted.ps1
├── skills/
│   ├── babysit/SKILL.md
│   ├── call/SKILL.md
│   ├── plan/SKILL.md
│   ├── resume/SKILL.md
│   └── ...
├── commands/
│   ├── call.md
│   ├── plan.md
│   ├── resume.md
│   └── ...
├── .github/
│   └── plugin.json          # Optional: .github-scoped manifest copy
├── AGENTS.md                # Custom agent instructions
├── bin/
│   └── install.js           # Installation script
├── scripts/
│   ├── sync-command-surfaces.js
│   └── team-install.js
├── package.json             # npm distribution manifest
└── README.md
```

### Plugin Distribution via npm

Copilot plugins are distributed as npm packages:

```json
{
  "name": "@a5c-ai/babysitter-github",
  "version": "0.1.0",
  "description": "Babysitter orchestration plugin for GitHub Copilot CLI",
  "bin": { "babysitter-github": "bin/cli.js" },
  "files": [
    "plugin.json", "hooks.json", "hooks/", "skills/",
    "bin/", "scripts/", "versions.json", "AGENTS.md",
    "commands/", ".github/", "README.md"
  ],
  "scripts": {
    "postinstall": "node bin/install.js",
    "preuninstall": "node bin/uninstall.js",
    "team:install": "node scripts/team-install.js"
  },
  "keywords": ["babysitter", "github-copilot", "orchestration", "ai-agent"]
}
```

---

## MAJOR SHIFT: GitHub App-Based Extensions Deprecated

**On November 10, 2025, GitHub sunset all GitHub App-based Copilot Extensions.** This was the previous extensibility model where third parties built GitHub Apps acting as Copilot agents (with full LLM control) or skillsets (up to 5 API endpoints).

Key dates:

| Date | Event |
|------|-------|
| 2025-09-24 | Creation of new server-side Copilot Extensions blocked |
| 2025-11-03 to 2025-11-07 | Brownout testing period |
| 2025-11-10 | Full sunset -- all Copilot Extensions disabled |

**MCP is now the primary extensibility mechanism.** Build an MCP server once, use it across any MCP-compatible agent -- not just GitHub Copilot. The new model is more modular, composable, and cross-platform.

---

## Custom Agents

Custom agents are specialized versions of the Copilot agent, defined as `.agent.md` files in `.github/agents/` within your repository.

### File Location

```
.github/agents/
  my-agent.agent.md
  security-reviewer.agent.md
  deploy-helper.agent.md
```

### YAML Frontmatter Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the agent |
| `description` | string | Yes | Purpose and capabilities (shown in agent picker) |
| `tools` | string[] | No | Tools the agent can access. Omit or use `["*"]` for all tools |
| `model` | string | No | AI model to use (IDE/CLI only, not cloud agent) |
| `mcp-servers` | object | No | MCP server configurations (YAML representation of JSON MCP config) |
| `target` | string | No | `vscode`, `github-copilot`, or omit for both |
| `metadata` | object | No | Arbitrary key-value metadata |
| `disable-model-invocation` | boolean | No | If `true`, prevents this agent from being invoked as a subagent (default: `false`) |
| `user-invocable` | boolean | No | If `false`, agent only accessible as a subagent, not in the agents dropdown (default: `true`) |

### Prompt Body

Below the frontmatter, the Markdown body serves as the agent's system prompt. Maximum 30,000 characters.

### Sharing Across an Organization

Place agent files in a `.github-private` repository within your organization. All members inherit those agents.

### Example

```markdown
---
name: security-reviewer
description: Reviews code changes for security vulnerabilities and compliance
tools:
  - read_file
  - search_files
  - list_directory
model: gpt-4.1
target: github-copilot
---

You are a security-focused code reviewer. Analyze code changes for:
- SQL injection, XSS, CSRF vulnerabilities
- Secrets or credentials in source code
- Insecure dependencies
- Authentication and authorization flaws

Always cite the specific file and line number when reporting issues.
```

See `examples/agent.md` for a complete example.

---

## Agent Skills

Agent Skills are an **open standard** (defined at agentskills.io) enabling portable, reusable bundles of instructions, scripts, and resources. Skills work across 30+ compatible tools including GitHub Copilot, Claude Code, OpenAI Codex, Cursor, Gemini CLI, and JetBrains Junie.

### Skill Locations

| Scope | Directory |
|-------|-----------|
| Project (repo-specific) | `.github/skills/`, `.claude/skills/`, `.agents/skills/` |
| Personal (cross-project) | `~/.copilot/skills/`, `~/.claude/skills/`, `~/.agents/skills/` |

### Skill Structure

Each skill is a folder containing a `SKILL.md` file with YAML frontmatter, plus optional supplementary resources:

```
.github/skills/
  database-migration/
    SKILL.md
    templates/
      migration.sql.template
    scripts/
      validate-schema.sh
```

### SKILL.md Format

```markdown
---
name: database-migration
description: Generates and validates database migration scripts
---

When asked to create a database migration:

1. Check current schema state using the validation script
2. Generate migration SQL following the template
3. Validate the migration is reversible
```

### Surface Availability

- **VS Code Agent Mode**: Skills auto-loaded when relevant to the prompt
- **Copilot CLI**: Skills referenced under `.github/skills/` during sessions
- **Cloud Coding Agent**: Automatically references skills under `.github/skills/` during autonomous execution from Issues

---

## Hooks

Hooks allow you to run custom scripts at specific points during an agent session. They enforce policies, log activity, set up environments, and gate tool execution.

### Configuration

Hooks are defined in a `hooks.json` file. For plugins, this is at the plugin root (referenced from `plugin.json`). For repositories, hooks can be at `.github/hooks/<name>.json`.

### hooks.json Format

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": "./hooks/session-start.sh",
        "powershell": "./hooks/session-start.ps1",
        "timeoutSec": 30
      }
    ],
    "sessionEnd": [
      {
        "type": "command",
        "bash": "./hooks/session-end.sh",
        "powershell": "./hooks/session-end.ps1",
        "timeoutSec": 30
      }
    ],
    "userPromptSubmitted": [
      {
        "type": "command",
        "bash": "./hooks/user-prompt-submitted.sh",
        "powershell": "./hooks/user-prompt-submitted.ps1",
        "timeoutSec": 30
      }
    ]
  }
}
```

### Event Types (8 total)

| Event | Trigger | Key Use Cases |
|-------|---------|---------------|
| `sessionStart` | New session begins or existing session resumes | Initialize environments, log session starts, validate project state |
| `sessionEnd` | Session completes or is terminated | Clean up resources, generate reports, send notifications |
| `userPromptSubmitted` | User submits a prompt | Log requests for auditing, validate/transform prompts |
| `preToolUse` | Before any tool execution (bash, edit, etc.) | **Approve or deny** tool executions, enforce security policies, block dangerous commands |
| `postToolUse` | After a tool is used | Log tool usage, validate outputs, trigger follow-up actions |
| `agentStop` | Main agent finishes responding | Post-processing, final validation, completion notifications |
| `subagentStop` | Subagent completes before returning to parent | Validate subagent output, log subagent activity |
| `errorOccurred` | Error during agent execution | Error logging, alerting, recovery actions |

### Hook Definition Format

Each hook entry specifies:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"command"` for script execution |
| `bash` | string | Yes* | Path to bash script (macOS/Linux) |
| `powershell` | string | Yes* | Path to PowerShell script (Windows) |
| `timeoutSec` | number | No | Maximum execution time in seconds |

*At least one of `bash` or `powershell` must be provided.

### preToolUse Response Protocol

The `preToolUse` hook is uniquely powerful -- it can **approve, deny, or modify** tool executions by writing JSON to stdout:

```json
{ "decision": "deny", "reason": "Command blocked by security policy" }
```

```json
{ "decision": "approve" }
```

See `examples/hooks.json` for a complete configuration.

---

## MCP (Model Context Protocol)

MCP is now GA across all Copilot surfaces and is the primary extensibility mechanism replacing the deprecated GitHub App-based Extensions.

### Surface Availability

| Surface | Status | Since |
|---------|--------|-------|
| VS Code | GA | v1.102 (July 2025) |
| JetBrains | GA | March 2026 |
| Eclipse | Public Preview | October 2025 |
| Xcode | Public Preview | October 2025 |
| Copilot CLI | GA | January 2026 |
| Cloud Coding Agent | GA | 2025 |

### Configuration Locations

| Scope | File | Notes |
|-------|------|-------|
| VS Code workspace | `.vscode/mcp.json` | Root key is `"servers"` (not `"mcpServers"`) |
| Copilot CLI (global) | `~/.copilot/mcp-config.json` | Persists across sessions |
| Copilot CLI (project) | `.copilot/mcp.json` | Per-repository |
| Cloud Coding Agent | Repository settings on github.com | Configured in Copilot settings UI |
| Custom Agent profile | `mcp-servers` frontmatter field | Per-agent MCP servers |

### Environment Setup for Cloud Agent

The cloud coding agent runs in a GitHub Actions environment. MCP server dependencies are installed via `.github/workflows/copilot-setup-steps.yml`:

```yaml
name: Copilot Setup Steps
on: workflow_dispatch

permissions:
  contents: read

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
```

The job **must** be named `copilot-setup-steps`. Set permissions to the minimum required.

### Auto-Approve Configuration

Per-server and per-tool auto-approve settings prevent repeated confirmation prompts:

```json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" },
      "toolApproval": {
        "autoApprove": ["search_repositories", "get_file_contents"],
        "autoDeny": ["delete_repository"]
      }
    }
  }
}
```

### Organization-Level MCP Policies

Administrators can configure MCP access for their organization or enterprise:

| Policy | Effect |
|--------|--------|
| **Allow all** | Users can use any MCP server |
| **Registry only** | Only servers from the organization's MCP registry may run |
| **Disabled** | MCP completely disabled for the organization |

Enterprise policies override organization policies. `Registry only` always takes precedence as the more restrictive option. Enforcement is based on MCP server name matching.

### MCP Registry

Organizations can configure an MCP registry URL in Copilot policies. The registry serves two purposes:

1. **Discovery** -- Makes approved MCP servers visible and installable in supported IDEs
2. **Allowlisting** -- When combined with `Registry only` policy, prevents use of unlisted servers

---

## Instructions Hierarchy

Copilot reads custom instructions from multiple file types, with a defined priority order.

### Instruction File Types

| File | Location | Scope | Priority |
|------|----------|-------|----------|
| `AGENTS.md` | Repository root | Primary instructions for all agents | Highest |
| `AGENTS.md` | Nested directories | Additional instructions for directory scope | Medium |
| `.github/copilot-instructions.md` | Repository root | Repo-wide instructions for all chat requests | Medium |
| `.github/instructions/**/*.instructions.md` | Instructions directory | Scoped to specific files via `applyTo` globs | Contextual |

### Multi-Agent Compatibility

Root `AGENTS.md` is recognized by multiple AI agents, not only Copilot. Copilot also reads `CLAUDE.md` and `GEMINI.md` instruction files in the workspace.

### Scoped Instructions with applyTo

`.instructions.md` files use YAML frontmatter with `applyTo` glob patterns to target specific files:

```markdown
---
applyTo: "**/*.test.ts"
---

When writing tests:
- Use vitest, not jest
- Co-locate test files in __tests__/ directories
- Use descriptive test names that explain the expected behavior
```

### excludeAgent Property

You can exclude specific agents from receiving instructions:

```markdown
---
applyTo: "**/*.ts"
excludeAgent: "coding-agent"
---

These instructions only apply in IDE chat, not the cloud coding agent.
```

### Priority Resolution

1. Root `AGENTS.md` instructions are treated as **primary** (highest influence)
2. If both `AGENTS.md` and `.github/copilot-instructions.md` exist, both are used
3. Nested `AGENTS.md` files are treated as **additional** (lower influence)
4. `.instructions.md` files apply only when their `applyTo` glob matches the active file

---

## Commands

Plugins can provide commands as markdown files in a `commands/` directory. Each command is a markdown file invocable by the user.

### Command File Format

```markdown
---
description: What this command does
---

Instructions for the agent when this command is invoked.
```

### Example Commands

A Copilot plugin might provide:

```
commands/
  assimilate.md    # Assimilate external methodology
  call.md          # Quick invoke orchestration
  cleanup.md       # Clean up old runs
  contrib.md       # Submit contributions
  doctor.md        # Diagnose run health
  forever.md       # Infinite loop process
  help.md          # Help system
  observe.md       # Real-time dashboard
  plan.md          # Planning mode
  resume.md        # Resume a run
  retrospect.md    # Analyze past runs
  user-install.md  # User setup
  yolo.md          # Non-interactive mode
```

---

## Distribution

### MCP Registry (Curated)

Organizations configure an MCP registry URL in their Copilot enterprise/organization policies. The registry provides a curated catalog of approved MCP servers.

### Repository Files

| Path | Content |
|------|---------|
| `.github/agents/*.agent.md` | Custom agent profiles |
| `.github/skills/*/SKILL.md` | Agent skills |
| `.github/hooks/*.json` | Hook configurations |
| `.github/instructions/*.instructions.md` | Scoped instructions |

### Plugin Packages (npm)

Copilot plugins are distributed as npm packages containing all components:

```bash
npm install -g @a5c-ai/babysitter-github
# or install locally
npm install @a5c-ai/babysitter-github
```

The npm package includes `postinstall`/`preuninstall` scripts that handle plugin registration, and a `team:install` script for organizational deployment.

### Community Resources

- **[github/awesome-copilot](https://github.com/github/awesome-copilot)** -- Community-curated collection of agents, skills, hooks, instructions, and MCP configurations
- **GitHub MCP Registry** -- Organization-managed catalogs of approved MCP servers
- **copilot-mcp VS Code Extension** -- Additional MCP server management in VS Code

---

## Copilot Surfaces Detail

### IDE Extension (VS Code, JetBrains, Eclipse, Xcode, Visual Studio)

- Inline completions, chat panel, agent mode
- Custom agents appear in agent picker dropdown
- MCP tools work only in Agent mode (not inline completions or chat)
- Skills auto-loaded when relevant to prompts
- Hooks supported in VS Code (preview) and JetBrains (March 2026)

### CLI (`copilot-cli`)

- Terminal-based agentic coding, GA as of March 2026
- Enhanced agents (January 2026): built-in `Explore` and `Task` sub-agents, parallel agent execution
- MCP via `~/.copilot/mcp-config.json` or `.copilot/mcp.json`
- Context management: auto-compression at 95% token limit, `/cwd` and `/add-dir` tab completion
- `web_fetch` tool with URL access control via `~/.copilot/config` (`allowed_urls`/`denied_urls`)
- Agent-run commands excluded from shell history
- Skills, hooks, and custom instructions all supported
- Available as standalone executable, in GitHub Codespaces, and as a Dev Container Feature

### Cloud Coding Agent

- Runs autonomously in a firewalled GitHub Actions environment
- Triggered from Issues or PRs on github.com
- Environment customized via `.github/workflows/copilot-setup-steps.yml`
- MCP servers configured in repository settings on github.com
- Automatically references `.github/skills/` during execution
- Custom agents defined in `.github/agents/` are available
- Its own `GITHUB_TOKEN` with scoped permissions

---

## Permissions and Security

### Cloud Coding Agent (Actions Environment)

- Runs in a **firewalled** GitHub Actions environment
- Gets its own `GITHUB_TOKEN` with repository-scoped permissions
- `copilot-setup-steps.yml` permissions should be set to the minimum required
- Network access is restricted by default

### Organization-Level MCP Policies

- **Allow all** / **Registry only** / **Disabled** per organization or enterprise
- Enterprise policies override organization policies
- Registry-only mode restricts to allowlisted MCP servers

### Agent Tool Restrictions

- `tools` frontmatter in `.agent.md` limits which tools an agent can use
- `preToolUse` hooks can approve/deny any tool execution
- `toolApproval` in MCP config enables per-tool auto-approve/auto-deny
- `disable-model-invocation` prevents an agent from being called as a subagent

---

## Deprecated: GitHub App-Based Extensions

For historical reference, the old extensibility model (sunset November 10, 2025) included:

- **Agents** (GitHub Apps with full LLM control): The extension received the full conversation, could call its own LLM, manage context, and return responses. Required implementing the Copilot agent protocol.
- **Skillsets** (GitHub Apps with up to 5 API endpoints): Lightweight alternative where Copilot handled routing, prompt crafting, function evaluation, and response generation. The extension only needed to expose API endpoints.

Both are fully replaced by MCP servers, custom agents, and agent skills.

---

## Ecosystem

| Resource | URL | Description |
|----------|-----|-------------|
| awesome-copilot | https://github.com/github/awesome-copilot | Community-curated agents, skills, hooks, MCP configs |
| GitHub MCP Registry | Organization Copilot settings | Curated MCP server catalogs |
| copilot-mcp Extension | VS Code Marketplace | MCP server management for VS Code |
| Agent Skills Spec | https://agentskills.io | Open standard for portable agent skills |
| Copilot CLI | https://github.com/github/copilot-cli | CLI source and documentation |

---

## References

See `references.md` for a categorized list of all source URLs.
