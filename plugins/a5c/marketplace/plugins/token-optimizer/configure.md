# token-optimizer — Configuration

This document covers how to customize the runtime behavior and features for **Token Optimizer**. The tool is designed to be "zero-config" for most features, but it provides powerful customization via its CLI (`measure.py v5`) and environment variables.

---

## 1. Active Compression (v5 Features)

Token Optimizer includes Active Compression to automatically compress verbose CLI outputs and manage smart re-reads. You can configure these features using the `measure.py` CLI.

### Check Current Status

View the status of all v5 optimization features:

```bash
cd ~/.claude/token-optimizer && python3 measure.py v5 status
```

### Enable Smart Re-reads (Delta Mode)

Delta Mode sends only file changes during re-reads instead of the entire file, saving significant tokens.

```bash
cd ~/.claude/token-optimizer && python3 measure.py v5 enable delta_mode
```

### Enable CLI Output Compression

Automatically compress verbose CLI outputs (e.g., `git status`, `pytest`, `npm ls`). This is off by default as it is a lossy compression.

```bash
cd ~/.claude/token-optimizer && python3 measure.py v5 enable bash_compress
```

### Disable a Feature

If a feature interferes with your workflow, disable it:

```bash
cd ~/.claude/token-optimizer && python3 measure.py v5 disable <feature_name>
```

---

## 2. Environment Variable Overrides

For persistent configuration, you can add environment variables to your shell profile (e.g., `~/.bashrc`, `~/.zshrc`). These override the default behavior.

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TOKEN_OPTIMIZER_BASH_COMPRESS` | Enables lossy compression for CLI outputs. | `0` (Off) | `export TOKEN_OPTIMIZER_BASH_COMPRESS=1` |
| `TOKEN_OPTIMIZER_READ_CACHE_DELTA` | Disables Delta Mode (smart re-reads) if set to `0`. | `1` (On) | `export TOKEN_OPTIMIZER_READ_CACHE_DELTA=0` |
| `TOKEN_OPTIMIZER_QUALITY_NUDGES` | Disables inline system warnings when context quality drops. | `1` (On) | `export TOKEN_OPTIMIZER_QUALITY_NUDGES=0` |

---

## 3. Running Audits and Health Checks

Token Optimizer provides several commands to manually audit and improve your context health.

### Guided Interactive Audit
Run a guided audit directly within your AI agent's chat interface to fix context waste:
```text
/token-optimizer
```

### Memory Audit
Scan `MEMORY.md` (or your agent's memory equivalent) for structural issues and orphaned entries:
```bash
cd ~/.claude/token-optimizer && python3 measure.py memory-review
```

### Quick Health Check
Get a 10-second context health summary in your terminal:
```bash
cd ~/.claude/token-optimizer && python3 measure.py quick
```

### Smart Compaction
Enable checkpoint/restore hooks. This checkpoints session state before the AI's auto-compaction fires, allowing it to restore critical decisions.
```bash
cd ~/.claude/token-optimizer && python3 measure.py setup-smart-compact
```

---

## 4. Live Dashboard

The dashboard tracks per-turn costs, cache hit rates, and quality scores. The background daemon (`measure.py setup-daemon`) must be running to collect data.

To serve the dashboard one-time over HTTP:
```bash
cd ~/.claude/token-optimizer && python3 measure.py dashboard --serve
```
Access it at: `http://localhost:24842/token-optimizer`
