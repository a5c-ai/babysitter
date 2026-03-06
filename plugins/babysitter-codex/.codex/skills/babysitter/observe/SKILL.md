---
name: babysitter:observe
description: Launch the babysitter observer dashboard for real-time run monitoring.
argument-hint: "[--watch-dir <dir>] or 'stop' to kill running dashboard"
---

# babysitter:observe

Launch the babysitter observer dashboard — a real-time web UI for monitoring runs, tasks, journal events, and orchestration state.

## Usage

### Start the Dashboard

1. Determine the watch directory (usually the project's container directory or cwd)
2. Launch:
```bash
npx -y @yoavmayer/babysitter-observer-dashboard@latest --watch-dir <dir>
```
3. This is a **blocking process** — it will keep running until stopped
4. Open the browser at the URL printed by the dashboard

### Stop the Dashboard

If the argument is `stop`:
1. Find the running dashboard process:
```bash
ps aux | grep babysitter-observer-dashboard | grep -v grep
```
2. Kill it:
```bash
kill <pid>
```
3. Confirm it stopped

### Default Watch Directory

If no `--watch-dir` is specified, use the parent of the current project directory. For `/data/repos`, watch `/data`.
