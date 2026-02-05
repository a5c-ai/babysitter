# Babysitter Plugin Troubleshooting Guide

> Comprehensive troubleshooting guide for the Babysitter plugin, organized by symptom.

**Version:** 1.0.0
**Last Updated:** 2026-02-03

---

## Table of Contents

1. [Quick Diagnostic Commands](#quick-diagnostic-commands)
2. [Run Stuck in "Waiting" State](#1-run-stuck-in-waiting-state)
3. [Tasks Failing Silently](#2-tasks-failing-silently)
4. [Hooks Not Executing](#3-hooks-not-executing)
5. [Journal Corruption](#4-journal-corruption)
6. [Session Loops Not Working](#5-session-loops-not-working)
7. [Installation/Verification Failures](#6-installationverification-failures)
8. [Permission Errors](#7-permission-errors)
9. [FAQ](#faq)
10. [Getting Help](#getting-help)

---

## Quick Diagnostic Commands

Run these commands first to get an overview of your setup:

```bash
# Check installation status
bash plugins/babysitter/scripts/verify-install.sh

# Check runtime health
bash plugins/babysitter/scripts/health-check.sh --verbose

# Check SDK CLI version
npx -y @a5c-ai/babysitter-sdk@latest --version

# Check a specific run status
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
$CLI run:status <runId> --json

# View recent events for a run
$CLI run:events <runId> --limit 20 --reverse

# List pending tasks
$CLI task:list <runId> --pending --json
```

---

## 1. Run Stuck in "Waiting" State

### Symptoms

- `run:iterate` returns `status: "waiting"` repeatedly
- Run status shows "waiting" or "Awaiting input"
- Orchestration loop does not progress
- No new tasks are being executed

### Diagnosis

**Step 1: Check run status**

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
$CLI run:status <runId> --json
```

Look for the `state` field. If it shows "waiting", identify what is blocking.

**Step 2: List pending tasks**

```bash
$CLI task:list <runId> --pending --json
```

This shows all tasks that are awaiting execution or resolution. Look for:
- Tasks with `kind: "breakpoint"` - These require human approval
- Tasks with `kind: "sleep"` - These are time-gated

**Step 3: Check pending tasks by kind**

```bash
$CLI run:status <runId> --json | jq '.pendingByKind'
```

This shows a breakdown of pending effects by type.

**Step 4: Inspect specific breakpoint**

```bash
# View breakpoint details
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq '.'
```

### Solution

**For breakpoints (human approval):**

1. **Via Web UI**: Navigate to `http://localhost:3184` if the breakpoints server is running
2. **Via CLI**:
   ```bash
   # Release a breakpoint with feedback
   curl -X POST http://localhost:3185/api/breakpoints/<breakpointId>/feedback \
     -H "Content-Type: application/json" \
     -d '{"author":"admin","comment":"Approved","release":true}'
   ```
3. **Via Telegram**: If Telegram integration is configured, use the bot to approve

**For sleep gates:**

Sleep gates automatically release at their specified time. Check the `sleepUntil` timestamp:

```bash
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq '.sleepUntil'
```

If the timestamp has passed but the run is still waiting, iterate again:

```bash
$CLI run:iterate <runId> --json --iteration <n>
```

**Force-release a stuck effect (advanced):**

If a breakpoint or effect is genuinely stuck, you can manually post a result:

```bash
$CLI task:post <runId> <effectId> --status ok --json
```

### Prevention

- Set reasonable timeouts for breakpoints
- Use the `--max-iterations` flag with `/babysitter:babysit` to prevent infinite waits
- Monitor breakpoints via the web UI or Telegram
- Document expected approval points in process files

---

## 2. Tasks Failing Silently

### Symptoms

- Run completes but expected work was not done
- Tasks show `status: "completed"` but no output
- No error messages visible
- Process appears to skip steps

### Diagnosis

**Step 1: Check task status and result**

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# List all tasks
$CLI task:list <runId> --json

# Show specific task details
$CLI task:show <runId> <effectId> --json
```

**Step 2: Inspect task logs**

```bash
# View task stdout
cat .a5c/runs/<runId>/tasks/<effectId>/stdout.log

# View task stderr
cat .a5c/runs/<runId>/tasks/<effectId>/stderr.log

# View task result
cat .a5c/runs/<runId>/tasks/<effectId>/result.json | jq '.'
```

**Step 3: Check journal events for the task**

```bash
$CLI run:events <runId> --json | jq '.events[] | select(.effectId == "<effectId>")'
```

**Step 4: Verify task definition**

```bash
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq '.'
cat .a5c/runs/<runId>/tasks/<effectId>/inputs.json | jq '.'
```

### Solution

**Missing logs:**

If stdout.log or stderr.log are empty or missing:
1. Check that the task script exists and is executable
2. Verify the entry path in the task definition is correct
3. Ensure the working directory is correct

**Task script errors:**

1. Run the task script manually to see errors:
   ```bash
   node .a5c/runs/<runId>/code/main.js
   ```
2. Check for syntax errors or missing dependencies

**Incorrect task definition:**

1. Review the process file (`main.js`) for task definitions
2. Verify task input/output paths are correct
3. Check that `io.outputJsonPath` points to an existing directory

**Re-run a failed task:**

```bash
# Mark the task as error to retry
$CLI task:post <runId> <effectId> --status error --json

# Then run the next iteration
$CLI run:iterate <runId> --json --iteration <n>
```

### Prevention

- Always check exit codes in task scripts
- Log to both stdout and stderr appropriately
- Use structured JSON output for task results
- Add validation in process files before task execution
- Test task scripts independently before integrating

---

## 3. Hooks Not Executing

### Symptoms

- Expected hook behavior does not occur
- No log output from hooks
- `on-run-start`, `on-task-complete`, etc. not triggering
- Custom hooks are ignored

### Diagnosis

**Step 1: Verify hook is executable**

```bash
ls -la .a5c/hooks/<hook-name>/
ls -la plugins/babysitter/hooks/<hook-name>/
```

Hooks must have the executable bit set (`-rwxr-xr-x`).

**Step 2: Check hook discovery order**

Hooks are discovered in this priority order:
1. `.a5c/hooks/<hook-name>/` (per-repo, highest priority)
2. `~/.config/babysitter/hooks/<hook-name>/` (per-user)
3. `plugins/babysitter/hooks/<hook-name>/` (plugin, lowest priority)

**Step 3: Test hook manually**

```bash
# Test with sample payload
echo '{"runId":"test-123","status":"completed"}' | .a5c/hooks/on-run-complete/my-hook.sh
```

**Step 4: Check hook dispatcher**

```bash
# Test the generic dispatcher
echo '{"runId":"test-123"}' | plugins/babysitter/hooks/hook-dispatcher.sh on-run-start
```

**Step 5: Check hook registration (for Claude Code hooks)**

```bash
cat plugins/babysitter/hooks/hooks.json | jq '.'
```

### Solution

**Make hooks executable:**

```bash
chmod +x .a5c/hooks/<hook-name>/*.sh
chmod +x plugins/babysitter/hooks/<hook-name>/*.sh
```

**Fix hook script errors:**

1. Check for syntax errors:
   ```bash
   bash -n .a5c/hooks/<hook-name>/my-hook.sh
   ```
2. Ensure the shebang is correct (`#!/bin/bash` or `#!/usr/bin/env bash`)
3. Verify jq is installed (required for JSON parsing)

**Correct hook output format:**

Hooks must:
- Output JSON to stdout (for result data)
- Output logs to stderr (not stdout, to avoid JSON parsing errors)
- Exit with code 0 for success

Example correct hook:

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')

# Log to stderr (visible but not captured as result)
echo "[my-hook] Processing run: $RUN_ID" >&2

# Output JSON to stdout
echo '{"ok": true}'

exit 0
```

**Debug hook execution:**

Add debug logging to your hook:

```bash
#!/bin/bash
set -euo pipefail

# Debug: log payload to a file
cat > /tmp/hook-debug-$$.json

# Log execution
echo "[DEBUG] Hook executed at $(date)" >&2
echo "[DEBUG] Payload saved to /tmp/hook-debug-$$.json" >&2
```

### Prevention

- Always test hooks manually before relying on them
- Use `set -euo pipefail` at the start of hooks
- Keep stdout for JSON output only
- Log to stderr for debugging
- Document hook purpose and expected payload

---

## 4. Journal Corruption

### Symptoms

- `run:status` returns errors or unexpected data
- Run cannot be resumed
- State cache is out of sync with journal
- Events appear missing or duplicated

### Diagnosis

**Step 1: Verify journal integrity**

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# List all events (will error if corrupted)
$CLI run:events <runId> --json
```

**Step 2: Check journal files directly**

```bash
# List journal files
ls -la .a5c/runs/<runId>/journal/

# Validate each event file is valid JSON
for f in .a5c/runs/<runId>/journal/*.json; do
  if ! jq '.' "$f" > /dev/null 2>&1; then
    echo "Corrupted: $f"
  fi
done
```

**Step 3: Check state cache**

```bash
# State cache should be rebuildable from journal
cat .a5c/runs/<runId>/state/state.json | jq '.'
```

**Step 4: Check for incomplete writes**

```bash
# Look for partial/truncated files
find .a5c/runs/<runId>/journal/ -name "*.json" -size 0
```

### Solution

**Rebuild state cache:**

The state cache (`state/state.json`) is derived from the journal and can be safely deleted:

```bash
rm .a5c/runs/<runId>/state/state.json

# Next CLI command will rebuild it
$CLI run:status <runId>
```

**Remove corrupted event files:**

If specific journal files are corrupted:

1. Identify the corrupted file(s)
2. Check if the event is critical (breakpoint release, task result, etc.)
3. If non-critical, remove the file:
   ```bash
   rm .a5c/runs/<runId>/journal/<corrupted-file>.json
   ```
4. Rebuild state:
   ```bash
   rm .a5c/runs/<runId>/state/state.json
   $CLI run:status <runId>
   ```

**Restore from backup:**

If the journal is heavily corrupted:

1. If using git, restore from a previous commit:
   ```bash
   git checkout HEAD~1 -- .a5c/runs/<runId>/journal/
   ```
2. If you have backups, restore the journal directory

**Start fresh:**

If recovery is not possible, create a new run:

```bash
$CLI run:create \
  --process-id <same-process-id> \
  --entry <same-entry> \
  --inputs <same-inputs>
```

### Prevention

- Do not manually edit journal files
- Use atomic file operations (the SDK does this automatically)
- Back up critical runs before major operations
- Use git to track run directories (journal is append-only and merge-friendly)
- Monitor disk space to prevent incomplete writes

---

## 5. Session Loops Not Working

### Symptoms

- `/babysitter:babysit` command does not start a loop
- Claude exits immediately instead of continuing
- Iteration counter does not increment
- Completion promise is not detected
- "No active loop" message appears

### Diagnosis

**Step 1: Check session state file**

```bash
# State files are stored per session
ls -la plugins/babysitter/skills/babysit/state/

# View state file contents
cat plugins/babysitter/skills/babysit/state/<session-id>.md
```

**Step 2: Check stop hook logs**

```bash
cat /tmp/babysitter-stop-hook.log
```

**Step 3: Verify session ID is available**

The session ID is set by the SessionStart hook. Check if it was persisted:

```bash
# Check if CLAUDE_SESSION_ID is set
echo "$CLAUDE_SESSION_ID"
```

**Step 4: Check hook registration**

```bash
cat plugins/babysitter/hooks/hooks.json | jq '.hooks'
```

Should include both `SessionStart` and `Stop` hooks.

**Step 5: Test stop hook manually**

```bash
echo '{"session_id":"test-123","transcript_path":"/tmp/test.jsonl"}' | \
  plugins/babysitter/hooks/babysitter-stop-hook.sh
```

### Solution

**State file not created:**

If the state file is missing, the setup script may have failed:

1. Check that `CLAUDE_SESSION_ID` is available:
   ```bash
   echo "$CLAUDE_SESSION_ID"
   ```
2. If not set, the SessionStart hook may have failed
3. Check hook registration in `hooks.json`

**Session ID not persisted:**

The SessionStart hook writes to `CLAUDE_ENV_FILE`. Ensure:

1. `CLAUDE_ENV_FILE` environment variable is set
2. The file is writable
3. The hook is executable:
   ```bash
   chmod +x plugins/babysitter/hooks/babysitter-session-start-hook.sh
   ```

**Iteration limit reached too quickly:**

If the loop stops due to "iteration too fast":

```bash
# Check the stop reason in logs
grep "iteration_too_fast" /tmp/babysitter-stop-hook.log
```

This protection triggers if iterations average under 15 seconds. Ensure your work takes meaningful time.

**Completion promise not detected:**

The completion promise must match exactly:

1. Check run status for `completionSecret`:
   ```bash
   $CLI run:status <runId> --json | jq '.completionSecret'
   ```
2. Verify output contains `<promise>SECRET</promise>` with exact match
3. Whitespace is normalized but content must match

**State file corruption:**

If the state file has invalid YAML:

```bash
# Delete the state file to stop the loop
rm plugins/babysitter/skills/babysit/state/<session-id>.md
```

Then start fresh with `/babysitter:babysit`.

### Prevention

- Always specify `--max-iterations` to prevent infinite loops
- Do not manually edit state files
- Ensure hooks are properly registered and executable
- Test the stop hook independently before relying on it

---

## 6. Installation/Verification Failures

### Symptoms

- `verify-install.sh` reports failures
- "Command not found" errors for babysitter CLI
- Missing dependencies (Node.js, npm, jq)
- Plugin structure errors

### Diagnosis

**Step 1: Run verification script**

```bash
bash plugins/babysitter/scripts/verify-install.sh --json
```

**Step 2: Check individual dependencies**

```bash
# Node.js (requires v18+)
node --version

# npm
npm --version

# git
git --version

# jq (required for hooks)
jq --version
```

**Step 3: Check SDK CLI**

```bash
npx -y @a5c-ai/babysitter-sdk@latest --version
```

**Step 4: Check plugin structure**

```bash
ls -la plugins/babysitter/
# Should contain: hooks/, skills/, commands/, plugin.json, README.md
```

### Solution

**Install Node.js:**

Node.js v18 or later is required.

```bash
# Download from https://nodejs.org/
# Or use a version manager:

# nvm (Linux/macOS)
nvm install 18
nvm use 18

# fnm (cross-platform)
fnm install 18
fnm use 18
```

**Install jq:**

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (Chocolatey)
choco install jq

# Windows (Scoop)
scoop install jq
```

**Install/update SDK CLI:**

```bash
# Install globally
npm install -g @a5c-ai/babysitter-sdk@latest

# Or use npx (no install required)
npx -y @a5c-ai/babysitter-sdk@latest --version
```

**Fix plugin structure:**

If directories are missing, re-clone the plugin:

```bash
git clone https://github.com/a5c-ai/babysitter.git /tmp/babysitter-fresh
cp -r /tmp/babysitter-fresh/plugins/babysitter/* plugins/babysitter/
```

**Clear npx cache:**

If npx returns stale versions:

```bash
npx --cache clear

# Or specify latest explicitly
npx -y @a5c-ai/babysitter-sdk@latest --version
```

### Prevention

- Use a Node.js version manager (nvm, fnm)
- Pin SDK version in your project (optional)
- Run `verify-install.sh` after updates
- Keep the plugin updated with git pull

---

## 7. Permission Errors

### Symptoms

- "Permission denied" when running hooks
- Cannot create state files or directories
- Cannot write to runs directory
- Hook scripts fail with permission errors

### Diagnosis

**Step 1: Check hook permissions**

```bash
ls -la plugins/babysitter/hooks/**/*.sh
ls -la .a5c/hooks/**/*.sh
```

Hooks should have execute permission (`-rwxr-xr-x` or at least `-rwx------`).

**Step 2: Check directory permissions**

```bash
# Runs directory
ls -la .a5c/runs/

# State directory
ls -la plugins/babysitter/skills/babysit/state/

# Plugin directory
ls -la plugins/babysitter/
```

**Step 3: Check file ownership**

```bash
ls -la .a5c/
```

Ensure the current user owns the directories.

**Step 4: Test write access**

```bash
# Test runs directory
touch .a5c/runs/.write-test && rm .a5c/runs/.write-test

# Test state directory
touch plugins/babysitter/skills/babysit/state/.write-test && rm plugins/babysitter/skills/babysit/state/.write-test
```

### Solution

**Fix hook permissions:**

```bash
# Make all hooks executable
chmod +x plugins/babysitter/hooks/**/*.sh
chmod +x plugins/babysitter/skills/babysit/scripts/*.sh
chmod +x .a5c/hooks/**/*.sh
```

**Fix directory permissions:**

```bash
# Fix runs directory
chmod 755 .a5c
chmod 755 .a5c/runs

# Fix state directory
chmod 755 plugins/babysitter/skills/babysit/state

# Create state directory if missing
mkdir -p plugins/babysitter/skills/babysit/state
chmod 755 plugins/babysitter/skills/babysit/state
```

**Fix ownership:**

```bash
# Change ownership to current user
sudo chown -R $(whoami) .a5c/
sudo chown -R $(whoami) plugins/babysitter/
```

**SELinux/AppArmor issues (Linux):**

If using SELinux or AppArmor:

```bash
# Check if SELinux is blocking
ausearch -m avc -ts recent

# Temporarily set permissive mode (for testing)
sudo setenforce 0
```

**Windows-specific:**

On Windows (Git Bash/WSL):

```bash
# Git Bash may not preserve execute bits
# Mark hooks as executable in git
git update-index --chmod=+x plugins/babysitter/hooks/**/*.sh
```

### Prevention

- Set correct permissions when creating new hooks
- Use version control to preserve permissions
- Create directories with appropriate permissions from the start
- On Windows, consider using WSL for full Unix permissions support

---

## FAQ

### General Questions

**Q: How do I check if babysitter is properly installed?**

A: Run the verification script:
```bash
bash plugins/babysitter/scripts/verify-install.sh
```

**Q: What Node.js version is required?**

A: Node.js v18 or later is required. Check with `node --version`.

**Q: How do I update the SDK CLI?**

A:
```bash
npm install -g @a5c-ai/babysitter-sdk@latest
# Or use npx which always gets latest:
npx -y @a5c-ai/babysitter-sdk@latest
```

### Run Management

**Q: How do I cancel a running orchestration?**

A: You can:
1. Stop the iteration loop (Ctrl+C if running in terminal)
2. Delete the session state file for in-session loops:
   ```bash
   rm plugins/babysitter/skills/babysit/state/<session-id>.md
   ```

**Q: How do I resume a failed run?**

A: Use the run:iterate command to continue:
```bash
$CLI run:iterate <runId> --json --iteration <next-iteration>
```

**Q: How do I view the full history of a run?**

A:
```bash
$CLI run:events <runId> --limit 100 --json | jq '.events'
```

**Q: Can I run multiple orchestrations in parallel?**

A: Yes. Each run has its own directory and state. For in-session loops, each Claude Code session has isolated state via `CLAUDE_SESSION_ID`.

### Hooks

**Q: Why is my custom hook not being called?**

A: Check these in order:
1. Hook is in the correct directory (`.a5c/hooks/<hook-name>/`)
2. Hook file ends with `.sh`
3. Hook is executable (`chmod +x`)
4. Hook outputs valid JSON to stdout

**Q: How do I debug a hook?**

A: Test it manually:
```bash
echo '{"runId":"test"}' | ./my-hook.sh
```
Add debug logging to stderr:
```bash
echo "[DEBUG] My message" >&2
```

**Q: What hooks are available?**

A:
- **SDK Lifecycle:** `on-run-start`, `on-run-complete`, `on-run-fail`, `on-task-start`, `on-task-complete`, `on-iteration-start`, `on-iteration-end`, `on-step-dispatch`
- **Process-Level:** `pre-commit`, `pre-branch`, `post-planning`, `on-score`, `on-breakpoint`

### Breakpoints

**Q: How do I approve a breakpoint?**

A:
1. Via Web UI: `http://localhost:3184`
2. Via API:
   ```bash
   curl -X POST http://localhost:3185/api/breakpoints/<id>/feedback \
     -H "Content-Type: application/json" \
     -d '{"author":"me","comment":"OK","release":true}'
   ```
3. Via Telegram bot (if configured)

**Q: How do I find the breakpoint ID?**

A:
```bash
$CLI task:list <runId> --pending --json | jq '.tasks[] | select(.kind == "breakpoint")'
```

### Session Loops

**Q: How do I stop an in-session loop?**

A:
1. Use `--max-iterations` to set a limit
2. Output the completion secret: `<promise>SECRET</promise>`
3. Delete the state file:
   ```bash
   rm plugins/babysitter/skills/babysit/state/<session-id>.md
   ```

**Q: Where is the session state stored?**

A: `plugins/babysitter/skills/babysit/state/${CLAUDE_SESSION_ID}.md`

**Q: What happens if I close Claude Code during a loop?**

A: The state file remains. When you restart, the loop will not resume automatically. You can:
- Delete the state file to clear it
- Start a new loop with `/babysitter:babysit`

### Troubleshooting Commands

**Q: What is the most useful diagnostic command?**

A: The health check provides a comprehensive overview:
```bash
bash plugins/babysitter/scripts/health-check.sh --verbose
```

**Q: How do I get verbose output from the CLI?**

A:
```bash
$CLI run:status <runId> --verbose --json
```

**Q: How do I check what tasks are blocking a run?**

A:
```bash
$CLI task:list <runId> --pending --json | jq '.tasks'
```

---

## Getting Help

### Documentation

- **Plugin Specification:** `plugins/babysitter/BABYSITTER_PLUGIN_SPECIFICATION.md`
- **Hooks Guide:** `plugins/babysitter/skills/babysit/reference/HOOKS.md`
- **SDK Reference:** `packages/sdk/sdk.md`
- **In-Session Loops:** `plugins/babysitter/IN_SESSION_LOOP_MECHANISM.md`

### CLI Help

```bash
npx -y @a5c-ai/babysitter-sdk@latest --help
npx -y @a5c-ai/babysitter-sdk@latest run:create --help
npx -y @a5c-ai/babysitter-sdk@latest task:post --help
```

### Useful Diagnostic Data to Collect

When reporting issues, collect:

1. **System info:**
   ```bash
   bash plugins/babysitter/scripts/verify-install.sh --json
   ```

2. **Health check:**
   ```bash
   bash plugins/babysitter/scripts/health-check.sh --json
   ```

3. **Run status (if applicable):**
   ```bash
   $CLI run:status <runId> --json
   ```

4. **Recent events:**
   ```bash
   $CLI run:events <runId> --limit 20 --reverse --json
   ```

5. **Stop hook logs (for session loops):**
   ```bash
   cat /tmp/babysitter-stop-hook.log
   ```

### Report Issues

- GitHub Issues: https://github.com/a5c-ai/babysitter/issues
- Include: CLI version, error output, diagnostic data from above

---

**Document Metadata:**
- Created: 2026-02-03
- Version: 1.0.0
- Component: Babysitter Plugin Troubleshooting Guide
- Status: Production
