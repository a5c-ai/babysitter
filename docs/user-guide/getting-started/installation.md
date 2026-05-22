# Installation Guide

This guide walks you through installing Babysitter on your system. By the end, you will have a fully working Babysitter installation ready for your first run.

**Estimated time:** 5-10 minutes

---

## Table of Contents

- [Prerequisites Check](#prerequisites-check)
- [Installation Methods](#installation-methods)
  - [Method 1: Quick Install (Recommended)](#method-1-quick-install-recommended)
  - [Method 2: Step-by-Step Install](#method-2-step-by-step-install)
- [Platform-Specific Instructions](#platform-specific-instructions)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows](#windows)
- [Plugin Installation](#plugin-installation)
- [Verification](#verification)
- [Keeping Updated](#keeping-updated)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites Check

Before installing Babysitter, let's verify your system is ready.

### Required: Node.js 20.0.0+

```bash
node --version
```

**Expected output:** `v20.x.x` or `v22.x.x`

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

### Required: Claude Code

```bash
claude --version
```

**Expected output:** Claude Code version information

If Claude Code is not installed, follow the [Claude Code installation guide](https://docs.anthropic.com/en/docs/claude-code) first.

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
echo "Node: $(node --version)" && echo "npm: $(npm --version)" && echo "Claude: $(claude --version 2>&1 | head -1)" && echo "jq: $(jq --version)"
```

You should see version numbers for all four tools. If not, address the missing requirement before continuing.

---

## Installation Methods

### Method 1: Quick Install (Recommended)

Copy and paste this to install the main CLI and the Claude Code plugin:

```bash
npm install -g @a5c-ai/babysitter@latest && \
claude plugin marketplace add a5c-ai/babysitter-claude && \
claude plugin install --scope user babysitter@a5c.ai && \
claude plugin enable --scope user babysitter@a5c.ai
```

If you also want headless runtime commands such as `babysitter-agent call`, install the optional runtime CLI too:

```bash
npm install -g @a5c-ai/babysitter-agent@latest
```

Then restart Claude Code and skip to [Verification](#verification).

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

#### Step 2: Install the Optional Runtime CLI

Install this only if you need `babysitter-agent` commands for headless orchestration, the internal harness, daemon utilities, MCP serving, or the TUI:

```bash
npm install -g @a5c-ai/babysitter-agent@latest
```

**Verify installation:**
```bash
babysitter-agent --version
```

#### Step 3: Install the Claude Code Plugin

The plugin integrates Babysitter with Claude Code and enables the `/babysitter:*` slash-command surface.

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

#### Step 4: Restart Claude Code

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
npm install -g @a5c-ai/babysitter@latest
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
npm install -g @a5c-ai/babysitter@latest
```

### Linux

**Ubuntu/Debian:**
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v22.x.x

# Install Babysitter
npm install -g @a5c-ai/babysitter@latest
```

**Fedora/RHEL/CentOS:**
```bash
# Install Node.js via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install Babysitter
npm install -g @a5c-ai/babysitter@latest
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
npm install -g @a5c-ai/babysitter@latest
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
npm install -g @a5c-ai/babysitter@latest
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
**Expected:** Current release version (for this repository, `5.0.0`)

#### 2. Optional Runtime CLI Installed

If you installed `@a5c-ai/babysitter-agent`:

```bash
babysitter-agent --version
```

**Expected:** Current release version (for this repository, `5.0.0`)

#### 3. Plugin Active
In Claude Code, type:
```
/skills
```
**Expected:** "babysit" appears in the list

#### 4. Full Integration Test
In Claude Code:
```
claude "/babysitter:call echo hello world"
```
**Expected:** Babysitter creates a run and executes successfully

### Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| jq | `jq --version` | jq-1.6 or higher |
| Core CLI | `babysitter --version` | `5.0.0` |
| Runtime CLI | `babysitter-agent --version` | `5.0.0` if installed |
| Plugin | `/skills` in Claude Code | "babysit" listed |

**All checks passed?** You're ready for the [Quickstart](./quickstart.md)!

---

## Keeping Updated

Babysitter is actively developed. Keep your installation current for the latest features and fixes.

### Update CLI Packages

```bash
npm update -g @a5c-ai/babysitter @a5c-ai/babysitter-agent
```

### Update Claude Code Plugin

```bash
# Update the marketplace repository
claude plugin marketplace update a5c.ai

# Update the plugin
claude plugin update babysitter@a5c.ai
```

**Tip:** Run updates regularly, ideally daily or weekly.

### Check Current Versions

```bash
# Core CLI version
babysitter --version

# Runtime CLI version (if installed)
babysitter-agent --version

# Plugin version
claude plugin list | grep babysitter
```

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
npm install -g @a5c-ai/babysitter@latest
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

### Runtime Issues

#### "Run encountered an error"

**Problem:** Journal conflict or corrupted state.

**Solution:**
```bash
# Check journal integrity
cat .a5c/runs/<runId>/journal/journal.jsonl | head

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

## Next Steps

Congratulations! You have Babysitter installed and ready to go.

**Your next step:** [Quickstart Tutorial](./quickstart.md) - Build your first feature in 10 minutes!

---

## Quick Reference

Commands you'll use most often:

```bash
# Start a new babysitter run
claude "/babysitter:call <your request>"

# Resume a run
claude "/babysitter:call resume the babysitter run"

# Update everything
npm update -g @a5c-ai/babysitter @a5c-ai/babysitter-agent
claude plugin update babysitter@a5c.ai
```
