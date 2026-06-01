# Graphify -- Install Instructions

This plugin installs [graphify](https://github.com/safishamsi/graphify) -- an AI coding assistant skill that turns any folder of code, docs, papers, images, videos, or YouTube links into a queryable knowledge graph. After install, typing `/graphify .` in your AI coding assistant builds an interactive graph, a plain-language report, and a persistent JSON graph that can be queried weeks later.

Graphify supports Claude Code, Codex, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, Aider, OpenClaw, Factory Droid, and Trae. This plugin install targets whichever platform the user selects during the configure step (default: Claude Code).

---

## Step 1: Verify Prerequisites

```bash
python3 --version      # must be >= 3.10
pip --version
```

If Python 3.10+ is not present, install it via the platform's standard Python distribution (python.org, pyenv, apt, brew, winget).

Confirm at least one supported AI coding assistant is installed locally (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, GitHub Copilot CLI, Aider, OpenClaw, Factory Droid, or Trae).

---

## Step 2: Install the Graphify PyPI Package

The official PyPI package is **`graphifyy`** (two y's -- other `graphify*` packages are unaffiliated):

```bash
pip install graphifyy
```

Verify the CLI is on PATH:

```bash
graphify --version
```

---

## Step 3: Install the Skill Into the AI Coding Assistant

Run the platform-specific installer. Pick the one matching the user's assistant; default is Claude Code.

| Platform | Command |
|----------|---------|
| Claude Code (Linux/Mac/Windows) | `graphify install` |
| Codex | `graphify install --platform codex` |
| OpenCode | `graphify install --platform opencode` |
| GitHub Copilot CLI | `graphify install --platform copilot` |
| Aider | `graphify install --platform aider` |
| OpenClaw | `graphify install --platform claw` |
| Factory Droid | `graphify install --platform droid` |
| Trae | `graphify install --platform trae` |
| Trae CN | `graphify install --platform trae-cn` |
| Gemini CLI | `graphify install --platform gemini` |
| Cursor | `graphify cursor install` |

For Codex, also ensure `multi_agent = true` under `[features]` in `~/.codex/config.toml` so parallel extraction subagents can dispatch.

---

## Step 4: (Optional) Enable the Always-On Graph Hook

This is strongly recommended after the first time the user actually builds a graph for a project. It tells the assistant to read `graphify-out/GRAPH_REPORT.md` before grep/glob file searches.

Run **inside the target project directory**:

| Platform | Command |
|----------|---------|
| Claude Code | `graphify claude install` |
| Codex | `graphify codex install` |
| OpenCode | `graphify opencode install` |
| GitHub Copilot CLI | `graphify copilot install` |
| Aider | `graphify aider install` |
| OpenClaw | `graphify claw install` |
| Factory Droid | `graphify droid install` |
| Trae | `graphify trae install` |
| Trae CN | `graphify trae-cn install` |
| Cursor | `graphify cursor install` |
| Gemini CLI | `graphify gemini install` |

This writes a `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/graphify.mdc` section (depending on platform) and, where supported, a PreToolUse hook in the assistant's settings so the graph is consulted automatically before keyword searches.

Skip this step if the user wants to invoke graphify only explicitly via `/graphify`.

---

## Step 5: Smoke Test

From any non-trivial folder of code or docs:

```bash
graphify .
```

Expect `graphify-out/` to be created with:

- `graph.html` -- interactive graph visualization
- `GRAPH_REPORT.md` -- plain-language report of god nodes and communities
- `graph.json` -- persistent queryable graph
- `cache/` -- SHA256 cache keyed by file content so re-runs skip unchanged files

Then in the AI coding assistant, trigger the skill:

- Claude Code / Cursor / Gemini CLI / OpenCode / Aider / OpenClaw / Droid / Trae / Copilot: `/graphify .`
- Codex: `$graphify .`

---

## Step 6: Update the Plugin Registry

Once every step above succeeds, register the plugin so future `plugin:update` calls know what's installed:

```bash
babysitter plugin:update-registry \
  --plugin-name graphify \
  --plugin-version 1.0.0 \
  --marketplace-name marketplace \
  --project --json
```

(Use `--global` instead of `--project` if the user chose global scope.)

---

## Rollback

If any step fails, run the uninstall flow in `uninstall.md` and report the failing step verbatim to the user.
