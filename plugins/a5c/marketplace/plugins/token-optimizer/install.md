# token-optimizer — Installation Guide

Install the **Token Optimizer** tool by alexgreensh. This tool is designed to reduce token usage and maintain context quality for AI agents. It addresses "structural waste" (bloated configs, unused skills, stale memory) and "runtime waste" (verbose command outputs) that typically consume 75-85% of an AI's context window.

**Repository:** https://github.com/alexgreensh/token-optimizer

## Prerequisites

- **Python 3** (`python3 --version` or `python --version` on Windows)
- **Git** (for cloning the repository)
- **Bash** (for the install script)

## Step 1 — Clone the repository

Clone `token-optimizer` to a permanent location. The install script and daemon reference files from this directory at runtime.

```bash
mkdir -p ~/.claude
git clone https://github.com/alexgreensh/token-optimizer.git ~/.claude/token-optimizer
```

If `~/.claude/token-optimizer` already exists (prior installation), pull the latest instead:

```bash
cd ~/.claude/token-optimizer && git pull
```

## Step 2 — Run the installer

Execute the installation bash script provided in the repository to set up the necessary hooks and scripts.

```bash
cd ~/.claude/token-optimizer && bash install.sh
```

## Step 3 — Set up the background daemon

Initialize the daemon to track token usage, costs, cache hit rates, and quality scores in the background. This daemon powers the live dashboard.

```bash
cd ~/.claude/token-optimizer && python3 measure.py setup-daemon
```

## Step 4 — Set up the Quality Bar (Optional but Recommended)

Add a color-coded quality indicator (7-signal "ContextQ" score) to your terminal status line to monitor context degradation in real-time.

```bash
cd ~/.claude/token-optimizer && python3 measure.py setup-quality-bar
```

## Step 5 — Register in babysitter plugin registry

Register the `token-optimizer` plugin in the project-level plugin registry:

```bash
babysitter plugin:update-registry --plugin-name token-optimizer --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Post-Installation Summary

After installation, **Token Optimizer** provides:

| Component | Location / Command | Purpose |
|-----------|--------------------|---------|
| Tool Directory | `~/.claude/token-optimizer/` | Source code and measurement scripts |
| Background Daemon | `measure.py setup-daemon` | Tracks metrics for the live dashboard |
| Quality Bar | `measure.py setup-quality-bar` | Real-time terminal status indicator |
| Guided Audit | `/token-optimizer` | Interactive command to fix context waste |
| Token Coach | `/token-coach` | Suggests optimized agent patterns |

**Next Steps:**
- Launch the live dashboard with `python3 ~/.claude/token-optimizer/measure.py dashboard --serve` (view at `http://localhost:24842/token-optimizer`).
- Run a quick health check on your context: `python3 ~/.claude/token-optimizer/measure.py quick`.
- Enable Active Compression (v5) features. See the configuration guide.
