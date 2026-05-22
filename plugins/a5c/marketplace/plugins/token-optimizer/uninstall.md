# token-optimizer — Uninstallation Guide

Follow these steps to completely remove the Token Optimizer tool and stop its background processes.

## Step 1 — Stop the background daemon

Stop the python daemon that collects token metrics.

```bash
pkill -f "measure.py setup-daemon" || true
```

## Step 2 — Remove the tool directory

Delete the cloned repository from the local filesystem.

```bash
rm -rf ~/.claude/token-optimizer
```

## Step 3 — Remove environment variables (Manual)

If `TOKEN_OPTIMIZER_BASH_COMPRESS`, `TOKEN_OPTIMIZER_READ_CACHE_DELTA`, or `TOKEN_OPTIMIZER_QUALITY_NUDGES` were set in your shell profile (e.g., `~/.bashrc`, `~/.zshrc`), you should remove them manually and reload your shell.

## Step 4 — Remove from babysitter plugin registry

Unregister the `token-optimizer` plugin from the project-level registry to complete the uninstallation.

```bash
babysitter plugin:remove-from-registry --plugin-name token-optimizer --project --json
```
