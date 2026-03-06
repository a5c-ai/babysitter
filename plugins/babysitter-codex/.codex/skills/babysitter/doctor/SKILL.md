---
name: babysitter:doctor
description: Diagnose babysitter run health — journal integrity, state cache, effects, locks, sessions, logs, and disk usage.
argument-hint: "[run-id] Optional run ID to diagnose. If omitted, uses the most recent run."
---

# babysitter:doctor

Comprehensive diagnostic agent for babysitter runtime health. Performs 10 mandatory health checks on a specific run (or the most recent run if no ID is provided).

## Run Discovery

If no run-id argument provided, find the most recent run:
```bash
ls -t .a5c/runs/ | head -1
```

## 10 Mandatory Health Checks

For each check, report **PASS**, **WARN**, or **FAIL**.

### 1. Run Discovery
- Verify run directory exists at `.a5c/runs/<runId>/`
- Display run metadata (process ID, created at, status)
- Check manifest.json exists and is valid

### 2. Journal Integrity
- Verify `.a5c/runs/<runId>/journal.jsonl` exists
- Check each line is valid JSON
- Verify timestamps are monotonically increasing
- Verify event type consistency
- Count events by type

### 3. State Cache Consistency
- Compare `state.json` against journal events
- Verify derived state matches journal history
- Check for orphaned state entries

### 4. Effect Status
- List all effects and their statuses
- Flag stuck effects (requested > 30 minutes ago, still pending)
- Flag errored effects
- Count pending vs completed

### 5. Lock Status
- Check for `run.lock` file
- If lock exists, verify PID is alive
- Flag stale/orphaned locks

### 6. Session State
- Inspect session state file
- Check iteration count vs max
- Detect potential runaway loops (fast iteration pattern)

### 7. Log Analysis
- Check `.a5c/logs/` for hook logs
- Scan for errors in stderr logs
- Report log file sizes

### 8. Disk Usage
- Report `.a5c/runs/<runId>/` total size
- Identify files > 10MB
- Report blob storage usage

### 9. Process Validation
- Verify process entry point exists and passes `node --check`
- Check `@a5c-ai/babysitter-sdk` dependency is installed
- Verify process exports match manifest

### 10. Hook Health
- Check all hook scripts exist and are executable
- Verify `sh -n` passes for shell scripts
- Verify `node --check` passes for JS hooks

## Output

Print a summary table:
```
Check                    Status  Details
─────────────────────────────────────────
1. Run Discovery         PASS    Run 01KJY... found
2. Journal Integrity     PASS    42 events, checksums valid
3. State Cache           PASS    Consistent
4. Effect Status         WARN    1 stuck effect (> 30min)
5. Lock Status           PASS    No stale locks
...
```

Then print detailed findings and recommendations for any WARN/FAIL checks.
