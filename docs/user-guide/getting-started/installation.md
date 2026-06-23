[Docs](../index.md) › [Getting Started](./README.md) › Installation

# Installation Guide

This guide walks you through installing Babysitter v6 on your system. By the end, you will have a fully working installation and will have run an Adapter to confirm it works.

**Estimated time:** 5-10 minutes

---

## In Plain English

**v6 has two install tracks. Don't conflate them:**

1. **The host-side `adapters` CLI** — run any supported AI coding harness directly from your shell. Install `@a5c-ai/adapters-cli`, then `adapters run claude "..."`.
2. **The in-session per-harness plugin** — drive a full Babysitter orchestration [run](../reference/glossary.md) from *inside* your harness (Claude Code, Codex, Cursor, and 9 more). Install the core CLI plus your harness's plugin.

Most people want both. Install the core CLI and the Adapters CLI first (this page), then pick your harness and follow its page. Babysitter supports **12 harnesses**; the two fully-worked ones are [Claude Code](../harnesses/claude-code.md) and [Codex](../harnesses/codex.md), and every harness is listed in the [Install Matrix](../harnesses/install-matrix.md).

---

## On this page

- [Prerequisites Check](#prerequisites-check)
- [Installation Methods](#installation-methods)
  - [Method 1: Quick Install (Recommended)](#method-1-quick-install-recommended)
  - [Method 2: Step-by-Step Install](#method-2-step-by-step-install)
- [Platform-Specific Instructions](#platform-specific-instructions)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows](#windows)
- [Plugin Installation](#plugin-installation)
- [Other Harnesses](#other-harnesses)
- [Verification](#verification)
- [Keeping Updated](#keeping-updated)
- [Upgrading from a Prior Version](#upgrading-from-a-prior-version)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites Check

Before installing Babysitter, let's verify your system is ready.

### Required: Node.js 20.0.0+

The core toolchain runs on **Node.js 20.0.0+** (22.x LTS recommended). The **Adapters CLI requires Node.js >=20.9.0**.

```bash
node --version
```

**Expected output:** `v20.9.x` or higher (or `v22.x.x`)

If you see a lower version or "command not found," install Node.js:

**Using nvm (recommended):**
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then:
nvm install 22
nvm use 22
```

**Direct download:** Visit [nodejs.org](https://nodejs.org/) and download the LTS version.

### Required: A supported harness (for in-session use)

To drive Babysitter runs from inside a harness, install at least one supported harness CLI — for example Claude Code:

```bash
claude --version
```

**Expected output:** Claude Code version information

If Claude Code is not installed, follow the [Claude Code installation guide](https://docs.anthropic.com/en/docs/claude-code). For any other harness, see the [Install Matrix](../harnesses/install-matrix.md).

> If you only want to run harnesses from your shell via the `adapters` CLI, you can skip the in-session plugin entirely.

### Required: jq (JSON processor)

Many Babysitter commands output JSON that is processed with `jq`. Install it for your platform:

```bash
jq --version
```

**Expected output:** `jq-1.6` or higher

**Installation:**

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL
sudo dnf install jq

# Windows (via Chocolatey)
choco install jq

# Windows (via Scoop)
scoop install jq
```

### Verification Checkpoint

Run this command to verify all prerequisites:

```bash
echo "Node: $(node --version)" && echo "npm: $(npm --version)" && echo "jq: $(jq --version)"
```

You should see version numbers for all three tools. If you plan to use a harness in-session, also confirm it is installed (e.g. `claude --version` for Claude Code). Address any missing requirement before continuing.

---

## Installation Methods

### Method 1: Quick Install (Recommended)

Copy and paste this to install the main CLI, the host-side **Adapters CLI**, and the Claude Code plugin:

```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli && \
claude plugin marketplace add a5c-ai/babysitter-claude && \
claude plugin install --scope user babysitter@a5c.ai && \
claude plugin enable --scope user babysitter@a5c.ai
```

Try an Adapter immediately to confirm the host-side track works:

```bash
adapters version
adapters doctor
adapters run claude "explain this repository in two sentences"
```

If you also want headless runtime commands such as `genty call`, install the optional runtime CLI too:

```bash
npm install -g @a5c-ai/genty-platform@latest
```

Then restart Claude Code and skip to [Verification](#verification).

> Using a harness other than Claude Code? Replace the three `claude plugin ...` lines with `babysitter harness:install-plugin <harness-key>` for your harness — see [Other Harnesses](#other-harnesses).

### Method 2: Step-by-Step Install

If you prefer to understand each step, follow along below.

#### Step 1: Install the Main CLI

```bash
npm install -g @a5c-ai/babysitter@latest
```

**What this installs:**
- `@a5c-ai/babysitter` - Recommended user-facing package for the `babysitter` CLI
- `@a5c-ai/babysitter-sdk` - Installed as the underlying SDK/core CLI implementation

**Expected output:**
```
added 1 packages in 15s
```

**Verify installation:**
```bash
babysitter --version
```

If `babysitter` exists on PATH but fails with `MODULE_NOT_FOUND`, remove the stale global shim and reinstall the SDK-backed CLI:

```bash
npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk
npm install -g @a5c-ai/babysitter-sdk@latest
babysitter --version
```

#### Step 2: Install the Adapters CLI (host-side track)

The **Adapters CLI** (`adapters`) is a host-side binary for running and managing harnesses directly from your shell. It is published separately as `@a5c-ai/adapters-cli` (version **5.1.0**) and needs **Node >=20.9.0**:

```bash
npm install -g @a5c-ai/adapters-cli
```

**Verify and try an Adapter immediately:**

```bash
adapters version
adapters doctor
adapters run claude "explain this repository in two sentences"
```

`adapters doctor` runs an environment health check; `adapters run claude "..."` runs the Claude harness with a single prompt. See the [Adapters CLI Reference](../reference/adapters-cli.md) for every command.

#### Step 3: Install the Optional Runtime CLI

Install this only if you need `genty` commands for headless orchestration, the internal harness, daemon utilities, MCP serving, or the TUI:

```bash
npm install -g @a5c-ai/genty-platform@latest
```

**Verify installation:**
```bash
genty --version
```

#### Step 4: Install the Claude Code Plugin

The plugin integrates Babysitter with Claude Code and enables the `/babysitter:*` slash-command surface. For any other harness, see [Other Harnesses](#other-harnesses) and the [Install Matrix](../harnesses/install-matrix.md).

```bash
# Add the plugin repository
claude plugin marketplace add a5c-ai/babysitter-claude

# Install the plugin
claude plugin install --scope user babysitter@a5c.ai

# Enable the plugin
claude plugin enable --scope user babysitter@a5c.ai
```

**Expected output:**
```
Plugin 'babysitter@a5c.ai' installed successfully
Plugin 'babysitter@a5c.ai' enabled
```

#### Step 5: Restart Claude Code

**Important:** You must restart Claude Code for the plugin to load.

- Close all Claude Code windows/sessions
- Reopen Claude Code

---

## Platform-Specific Instructions

### macOS

**Prerequisites:**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via nvm (recommended)
brew install nvm
mkdir ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

nvm install 22
nvm use 22
```

**Installation:**
```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

**Permission Issues?**
If you see `EACCES` permission errors:

```bash
# Option 1: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Then retry installation
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

### Linux

**Ubuntu/Debian:**
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v22.x.x

# Install Babysitter + Adapters CLI
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

**Fedora/RHEL/CentOS:**
```bash
# Install Node.js via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install Babysitter + Adapters CLI
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

### Windows

**Recommended: Use WSL2 (Windows Subsystem for Linux)**

WSL2 provides the best experience for Babysitter on Windows:

```powershell
# In PowerShell (Admin)
wsl --install

# Restart your computer, then open Ubuntu from Start Menu
# Follow the Linux (Ubuntu) instructions above
```

**Native Windows (Git Bash):**

1. Install [Node.js for Windows](https://nodejs.org/en/download/)
2. Install [Git for Windows](https://git-scm.com/download/win) (includes Git Bash)
3. Open Git Bash and run:

```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

**Note:** Some shell commands in Babysitter may require Git Bash or WSL. PowerShell/CMD support is limited.

---

## Plugin Installation

The Claude Code plugin provides the `/babysitter:*` command surface that orchestrates Babysitter runs.

### Install the Plugin

```bash
# Step 1: Add the marketplace repository
claude plugin marketplace add a5c-ai/babysitter-claude
```

**Expected:** `Marketplace 'a5c.ai' added`

```bash
# Step 2: Install the plugin
claude plugin install --scope user babysitter@a5c.ai
```

**Expected:** `Plugin 'babysitter@a5c.ai' installed`

```bash
# Step 3: Enable the plugin
claude plugin enable --scope user babysitter@a5c.ai
```

**Expected:** `Plugin 'babysitter@a5c.ai' enabled`

### Verify Plugin Installation

After restarting Claude Code, run:

```
/skills
```

You should see **"babysit"** in the list of available skills.

If you don't see it:
1. Make sure you restarted Claude Code
2. Try running `claude plugin list` to see installed plugins
3. Check the [Troubleshooting](#troubleshooting) section

---

## Other Harnesses

Claude Code is the worked example above, but Babysitter v6 supports **12 harnesses**. The two fully-worked harnesses have dedicated pages:

- **[Claude Code](../harnesses/claude-code.md)** — `/babysitter:*` slash-commands and the `babysit` skill
- **[Codex](../harnesses/codex.md)** — `$babysitter:*` via the mention picker

For **every** harness (antigravity, cursor, gemini, genty, github-copilot, hermes, omp, openclaw, opencode, pi, plus the two above), the [**Install Matrix**](../harnesses/install-matrix.md) lists the exact install command, the in-session invocation token, and the per-harness hook/continuation model.

The universal installer works for any harness — the argument is the **harness key**, which may differ from the harness name (e.g. `gemini-cli`, `github-copilot`, `oh-my-pi`, `antigravity-cli`):

```bash
babysitter harness:install-plugin <harness-key> [--workspace <path>]
```

For example:

```bash
babysitter harness:install-plugin codex
babysitter harness:install-plugin cursor --workspace /path/to/repo
```

> Each harness ships its own published plugin and its own version — do not pin a pre-release build. Per-harness continuation models differ: only Claude Code, Codex, and Cursor use a `Stop` hook; antigravity and gemini use `AfterAgent`, openclaw uses a session daemon, opencode uses session-idle, hermes uses ACP, and genty/omp/pi are thin skill-alias surfaces. See each harness's row in the [Install Matrix](../harnesses/install-matrix.md).

---

## Recommended Tools

The following tools enhance your workflow when using Babysitter. These are optional but highly recommended for a more productive development experience.

### Playwright Skill Plugin

**Browser automation for testing and validation**

The Playwright Skill Plugin enables Claude to write and execute browser automation tests, take screenshots, fill forms, and validate web applications. This is essential for testing web applications and verifying UI functionality during development.

**Why use it:**
- Automate browser-based testing directly through Claude
- Capture screenshots for visual validation
- Test form submissions and user interactions
- Verify web application behavior without leaving your terminal

**Installation:**

Run these commands in Claude Code CLI:

```bash
# Add the plugin from marketplace
/plugin marketplace add lackeyjb/playwright-skill

# Install the skill
/plugin install playwright-skill@playwright-skill

# Run setup to configure Playwright browsers
cd ~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill && npm run setup
```

> **Note:** Restart Claude Code after installation to activate the plugin.

### GitHub CLI (gh)

**Official GitHub command-line interface**

The GitHub CLI allows Claude to seamlessly manage GitHub issues, pull requests, actions, and releases through natural language. Claude can create PRs, manage issues, check CI status, and debug GitHub Actions failures directly from the terminal.

**Why use it:**
- Create and manage pull requests without leaving your workflow
- Track and update issues through natural language commands
- Monitor CI/CD pipeline status and debug failures
- Manage releases and repository settings efficiently

**Installation:**

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Linux (Fedora/RHEL)
sudo dnf install gh

# Windows
winget install GitHub.cli
```

**Post-installation:**

Authenticate with your GitHub account:

```bash
gh auth login
```

Follow the interactive prompts to complete authentication. This grants Claude access to manage your repositories and perform GitHub operations on your behalf.

---

## Verification

Let's confirm everything is working correctly.

### Verification Checklist

Run each command and verify the expected result:

#### 1. Core CLI Installed
```bash
babysitter --version
```
**Expected:** The v6 release version (`5.1.0` for this edition)

#### 2. Adapters CLI Installed (host-side track)
```bash
adapters version
adapters doctor
```
**Expected:** `adapters version` reports `5.1.0`; `adapters doctor` reports all checks passing.

#### 3. Try an Adapter
```bash
adapters run claude "say hi"
```
**Expected:** The harness responds. (Swap `claude` for any other installed harness.)

#### 4. Optional Runtime CLI Installed

If you installed `@a5c-ai/genty-platform`:

```bash
genty --version
```

**Expected:** The v6 release version (`5.1.0`)

#### 5. Plugin Active
In Claude Code, type:
```
/skills
```
**Expected:** "babysit" appears in the list

#### 6. Full Integration Test
In Claude Code:
```
/babysitter:call echo hello world
```
**Expected:** Babysitter creates a run and executes successfully. (Other harnesses use their own invocation token — see the [Install Matrix](../harnesses/install-matrix.md).)

### Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| jq | `jq --version` | jq-1.6 or higher |
| Core CLI | `babysitter --version` | `5.1.0` |
| Adapters CLI | `adapters version` | `5.1.0` |
| Adapter health | `adapters doctor` | All checks pass |
| Try an Adapter | `adapters run claude "say hi"` | The harness responds |
| Runtime CLI | `genty --version` | `5.1.0` if installed |
| Plugin (Claude Code) | `/skills` in Claude Code | "babysit" listed |

**All checks passed?** You're ready for the [Quickstart](./quickstart.md)!

---

## Keeping Updated

Babysitter is actively developed. Keep your installation current for the latest features and fixes.

### Update CLI Packages

```bash
npm update -g @a5c-ai/babysitter @a5c-ai/adapters-cli @a5c-ai/genty-platform
```

### Update Claude Code Plugin

```bash
# Update the marketplace repository
claude plugin marketplace update a5c.ai

# Update the plugin
claude plugin update babysitter@a5c.ai
```

For other harnesses, re-run `babysitter harness:install-plugin <harness-key>` or follow the update note on that harness's row in the [Install Matrix](../harnesses/install-matrix.md).

**Tip:** Run updates regularly, ideally daily or weekly.

### Check Current Versions

```bash
# Core CLI version
babysitter --version

# Adapters CLI version
adapters version

# Runtime CLI version (if installed)
genty --version

# Plugin version
claude plugin list | grep babysitter
```

---

## Upgrading from a Prior Version

Coming from the prod `0.0.x` series? v6 is a semver-major jump with breaking changes (package renames, removed flags such as `--plugin-root`, `BABYSITTER_SESSION_ID` → `AGENT_SESSION_ID`, and `plugins/` → `blueprints/`). Follow the **[Migration Guide](./migration.md)** before upgrading.

---

## Troubleshooting

### Installation Issues

#### "command not found: npm" or "command not found: node"

**Problem:** Node.js is not installed or not in your PATH.

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart your terminal
3. Verify: `node --version`

#### "EACCES: permission denied" during npm install

**Problem:** npm doesn't have permission to install global packages.

**Solution (macOS/Linux):**
```bash
# Create a directory for global packages
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Retry installation
npm install -g @a5c-ai/babysitter@latest @a5c-ai/adapters-cli
```

#### "adapters: command not found"

**Problem:** The Adapters CLI is not installed, or your Node version is below 20.9.0.

**Solution:**
```bash
node --version   # must be >=20.9.0
npm install -g @a5c-ai/adapters-cli
adapters version
```

#### "Cannot find module '@a5c-ai/babysitter-sdk'"

**Problem:** You are importing the SDK in code, but `@a5c-ai/babysitter-sdk` is not installed in that project.

**Solution:**
```bash
# Install the SDK as a project dependency when authoring custom processes
npm install @a5c-ai/babysitter-sdk

# Verify the main CLI separately
babysitter --version
```

### Plugin Issues

#### Plugin not appearing in /skills

**Problem:** Plugin not installed, not enabled, or Claude Code not restarted.

**Solution:**
```bash
# Check if installed
claude plugin list

# If not listed, install
claude plugin marketplace add a5c-ai/babysitter-claude
claude plugin install --scope user babysitter@a5c.ai
claude plugin enable --scope user babysitter@a5c.ai

# Restart Claude Code completely
```

#### "Plugin not found: babysitter@a5c.ai"

**Problem:** Plugin repository not added.

**Solution:**
```bash
# Add the marketplace first
claude plugin marketplace add a5c-ai/babysitter-claude

# Then install
claude plugin install --scope user babysitter@a5c.ai
```

For harness-specific install problems on any other harness, see that harness's row in the [Install Matrix](../harnesses/install-matrix.md) and the session-binding section of [Troubleshooting](../reference/troubleshooting.md).

### Runtime Issues

#### "Run encountered an error"

**Problem:** Journal conflict or corrupted state.

**Solution:**
```bash
# Inspect the journal — it is one JSON file per event (not a single .jsonl)
ls .a5c/runs/<runId>/journal/

# Read the first event
cat .a5c/runs/<runId>/journal/000001.*.json | jq .

# Ask Claude to analyze
claude "Analyze the babysitter run error for <runId> and try to recover"
```

### Getting More Help

If you're still stuck:

1. **Check the logs:** Look for error messages in terminal output
2. **Search issues:** [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)
3. **Ask the community:** [GitHub Discussions](https://github.com/a5c-ai/babysitter/discussions)
4. **Report a bug:** Create a new issue with:
   - Your OS and version
   - Node.js version
   - Claude Code version
   - Full error message
   - Steps to reproduce

---

## Quick Reference

Commands you'll use most often:

```bash
# Run a harness directly from your shell (host-side Adapters track)
adapters run claude "<your request>"

# Start a new in-session run (Claude Code)
/babysitter:call <your request>

# Resume a run (Claude Code)
/babysitter:resume

# Install a plugin for another harness
babysitter harness:install-plugin <harness-key>

# Update everything
npm update -g @a5c-ai/babysitter @a5c-ai/adapters-cli @a5c-ai/genty-platform
claude plugin update babysitter@a5c.ai
```

---

## Next steps

- **Next:** [Quickstart](./quickstart.md) — build your first feature in 10 minutes
- **Previous:** [Getting Started overview](./README.md)
- **Related:** [Install Matrix](../harnesses/install-matrix.md) — setup and command token for every supported harness
