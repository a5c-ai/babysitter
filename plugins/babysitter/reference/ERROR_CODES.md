# Babysitter Plugin Error Codes

This document defines the standardized error code system for the babysitter plugin.

## Error Code Format

All error codes follow the format: `BSIT-XXXX`

### Code Categories

| Range | Category | Description |
|-------|----------|-------------|
| 1XXX | Installation/Setup | Errors related to installation, dependencies, and initial setup |
| 2XXX | Configuration | Errors related to configuration files and settings |
| 3XXX | Runtime/Execution | Errors that occur during task execution |
| 4XXX | State/Journal | Errors related to state management and journal files |
| 5XXX | Hook | Errors related to hook discovery and execution |
| 9XXX | Unknown/Internal | Unexpected errors and internal failures |

---

## Installation/Setup Errors (1XXX)

### BSIT-1001: Node.js Version Mismatch

**Description:** The installed Node.js version does not meet the minimum requirements.

**Common Causes:**
- Node.js is outdated
- Multiple Node.js versions installed with wrong one in PATH
- nvm/fnm using an older version

**Recovery Steps:**
1. Check current version: `node --version`
2. Install Node.js 18.x or later from https://nodejs.org
3. If using nvm: `nvm install 18 && nvm use 18`
4. Verify: `node --version`

**Example Error Message:**
```
[BSIT-1001] Node.js version mismatch: found v16.20.0, required >=18.0.0
```

---

### BSIT-1002: jq Not Found

**Description:** The `jq` command-line JSON processor is not installed or not in PATH.

**Common Causes:**
- jq not installed on the system
- jq installed but not in PATH
- Conda/virtualenv environment missing jq

**Recovery Steps:**
1. Install jq:
   - macOS: `brew install jq`
   - Ubuntu/Debian: `sudo apt-get install jq`
   - Windows: `choco install jq` or `winget install jqlang.jq`
2. Verify installation: `jq --version`
3. Ensure jq is in your PATH

**Example Error Message:**
```
[BSIT-1002] Required dependency 'jq' not found. Install it with your package manager.
```

---

### BSIT-1003: Plugin Not Installed

**Description:** The babysitter plugin is not properly installed or registered with Claude Code.

**Common Causes:**
- Plugin directory missing or moved
- Plugin not registered in Claude Code settings
- Corrupted installation

**Recovery Steps:**
1. Verify plugin exists: `ls -la ~/.claude/plugins/babysitter`
2. Re-register plugin: `claude plugins add babysitter`
3. Restart Claude Code session
4. Check plugin status: `claude plugins list`

**Example Error Message:**
```
[BSIT-1003] Babysitter plugin not installed. Run 'claude plugins add babysitter' to install.
```

---

### BSIT-1004: SDK CLI Not Found

**Description:** The babysitter SDK CLI (`bsit` or `npx @a5c-ai/babysitter`) is not available.

**Common Causes:**
- SDK package not installed
- npm global bin not in PATH
- Package installation failed

**Recovery Steps:**
1. Install the SDK: `npm install -g @a5c-ai/babysitter`
2. Or use npx: `npx @a5c-ai/babysitter --help`
3. Verify PATH includes npm global bin: `npm bin -g`
4. Add to PATH if needed

**Example Error Message:**
```
[BSIT-1004] SDK CLI not found. Install with 'npm install -g @a5c-ai/babysitter'
```

---

### BSIT-1005: Git Not Available

**Description:** Git is not installed or not accessible in the current environment.

**Common Causes:**
- Git not installed
- Git not in PATH
- Restricted shell environment

**Recovery Steps:**
1. Install git from https://git-scm.com
2. Verify: `git --version`
3. Ensure git is in your PATH

**Example Error Message:**
```
[BSIT-1005] Git is required but not found in PATH. Install git and try again.
```

---

## Configuration Errors (2XXX)

### BSIT-2001: Invalid Configuration

**Description:** The configuration file contains invalid or malformed data.

**Common Causes:**
- Syntax error in JSON/YAML configuration
- Invalid field values
- Missing required fields
- Unsupported configuration version

**Recovery Steps:**
1. Validate JSON syntax: `jq . .a5c/config.json`
2. Check for required fields in documentation
3. Reset to default: `bsit config reset`
4. Re-run configuration wizard: `bsit configure`

**Example Error Message:**
```
[BSIT-2001] Invalid configuration in .a5c/config.json: unexpected token at line 15
```

---

### BSIT-2002: Missing Runs Directory

**Description:** The `.a5c/runs` directory does not exist and cannot be created.

**Common Causes:**
- Directory was deleted
- Permission issues
- Disk full
- Read-only filesystem

**Recovery Steps:**
1. Create manually: `mkdir -p .a5c/runs`
2. Check permissions: `ls -la .a5c`
3. Verify disk space: `df -h .`
4. Check filesystem is writable

**Example Error Message:**
```
[BSIT-2002] Runs directory not found and cannot be created: .a5c/runs
```

---

### BSIT-2003: Invalid Log Level

**Description:** The specified log level is not recognized.

**Common Causes:**
- Typo in log level value
- Using unsupported log level name
- Environment variable set incorrectly

**Recovery Steps:**
1. Use valid log levels: `debug`, `info`, `warn`, `error`, `silent`
2. Check environment: `echo $BABYSITTER_LOG_LEVEL`
3. Update configuration with valid level

**Example Error Message:**
```
[BSIT-2003] Invalid log level 'verbose'. Valid levels: debug, info, warn, error, silent
```

---

### BSIT-2004: Configuration File Not Found

**Description:** The expected configuration file does not exist.

**Common Causes:**
- First run without initialization
- Configuration file deleted
- Wrong working directory

**Recovery Steps:**
1. Initialize configuration: `bsit init`
2. Check working directory contains `.a5c` folder
3. Create default config: `bsit config reset`

**Example Error Message:**
```
[BSIT-2004] Configuration file not found: .a5c/config.json
```

---

### BSIT-2005: Permission Denied

**Description:** Cannot read or write to a required file or directory due to permissions.

**Common Causes:**
- File owned by different user
- Restrictive directory permissions
- SELinux/AppArmor restrictions
- Windows file locks

**Recovery Steps:**
1. Check ownership: `ls -la <path>`
2. Fix permissions: `chmod 755 <directory>` or `chmod 644 <file>`
3. Check for file locks on Windows
4. Run as appropriate user

**Example Error Message:**
```
[BSIT-2005] Permission denied: cannot write to .a5c/runs/current/state.json
```

---

## Runtime/Execution Errors (3XXX)

### BSIT-3001: Process Not Found

**Description:** The expected process file or definition could not be located.

**Common Causes:**
- Process name misspelled
- Process file deleted or moved
- Process not installed with plugin
- Custom process not in search path

**Recovery Steps:**
1. List available processes: `bsit process list`
2. Check process name spelling
3. Verify process file exists in plugin/processes
4. Add custom process path to configuration

**Example Error Message:**
```
[BSIT-3001] Process not found: 'tdd-quality-convergence'. Run 'bsit process list' to see available processes.
```

---

### BSIT-3002: Task Execution Failed

**Description:** A task failed to execute successfully.

**Common Causes:**
- Task dependencies not met
- External command failed
- Timeout exceeded
- Resource unavailable

**Recovery Steps:**
1. Check task logs: `bsit logs --run <run-id> --task <task-id>`
2. Verify task dependencies are satisfied
3. Increase timeout if needed
4. Check external service availability
5. Retry with: `bsit retry --task <task-id>`

**Example Error Message:**
```
[BSIT-3002] Task execution failed: 'build-project' exited with code 1
```

---

### BSIT-3003: Breakpoint Timeout

**Description:** A breakpoint wait exceeded the maximum allowed time.

**Common Causes:**
- User did not respond to breakpoint prompt
- Network issues with notification
- Claude Code session disconnected
- Timeout set too low

**Recovery Steps:**
1. Check for pending breakpoint notifications
2. Resume manually: `bsit resume --run <run-id>`
3. Increase timeout in configuration
4. Check Claude Code session is active

**Example Error Message:**
```
[BSIT-3003] Breakpoint timeout after 300s waiting for user input at 'pre-deploy-approval'
```

---

### BSIT-3004: Run Already Active

**Description:** Attempted to start a new run while another is already active.

**Common Causes:**
- Previous run not properly terminated
- Concurrent babysitter invocations
- Stale lock file

**Recovery Steps:**
1. Check active runs: `bsit status`
2. Stop active run: `bsit stop --run <run-id>`
3. Force stop if needed: `bsit stop --force`
4. Remove stale lock: `rm .a5c/runs/.lock`

**Example Error Message:**
```
[BSIT-3004] Run already active: run-2024-01-15-abc123. Stop it first with 'bsit stop'
```

---

### BSIT-3005: Maximum Iterations Exceeded

**Description:** The run exceeded the maximum number of allowed iterations.

**Common Causes:**
- Infinite loop in process logic
- Convergence criteria not achievable
- Max iterations set too low
- Process design issue

**Recovery Steps:**
1. Review process logic for loops
2. Check convergence criteria
3. Increase max iterations if appropriate
4. Analyze iteration logs for patterns

**Example Error Message:**
```
[BSIT-3005] Maximum iterations (100) exceeded. Process may be in infinite loop.
```

---

### BSIT-3006: Agent Communication Failed

**Description:** Failed to communicate with the AI agent.

**Common Causes:**
- API rate limiting
- Network connectivity issues
- Invalid API credentials
- Service outage

**Recovery Steps:**
1. Check network connectivity
2. Verify API credentials
3. Check for rate limiting
4. Retry after waiting
5. Check service status page

**Example Error Message:**
```
[BSIT-3006] Agent communication failed: API returned 429 (rate limited). Retry after 60s.
```

---

## State/Journal Errors (4XXX)

### BSIT-4001: Journal Corrupted

**Description:** The run journal file is corrupted or contains invalid data.

**Common Causes:**
- Interrupted write operation
- Disk error
- Manual editing introduced errors
- Concurrent writes without locking

**Recovery Steps:**
1. Check journal file: `jq . .a5c/runs/<run-id>/journal.json`
2. Restore from backup: `cp .a5c/runs/<run-id>/journal.json.bak .a5c/runs/<run-id>/journal.json`
3. Recreate from state: `bsit repair --run <run-id>`
4. Start fresh run if unrecoverable

**Example Error Message:**
```
[BSIT-4001] Journal corrupted: .a5c/runs/run-abc123/journal.json - invalid JSON at offset 4521
```

---

### BSIT-4002: State File Missing

**Description:** A required state file is missing from the run directory.

**Common Causes:**
- File accidentally deleted
- Incomplete run initialization
- Storage failure
- Cleanup ran prematurely

**Recovery Steps:**
1. Check run directory: `ls -la .a5c/runs/<run-id>/`
2. Restore from backup if available
3. Reinitialize state: `bsit init-state --run <run-id>`
4. Start new run if state unrecoverable

**Example Error Message:**
```
[BSIT-4002] State file missing: .a5c/runs/run-abc123/state/current.json
```

---

### BSIT-4003: State File Invalid

**Description:** The state file exists but contains invalid or inconsistent data.

**Common Causes:**
- Schema version mismatch
- Incomplete state update
- Manual editing errors
- Serialization bug

**Recovery Steps:**
1. Validate state file: `bsit validate --run <run-id>`
2. Compare with schema: Check state file against expected schema
3. Reset to last checkpoint: `bsit rollback --run <run-id>`
4. Repair state: `bsit repair --run <run-id>`

**Example Error Message:**
```
[BSIT-4003] State file invalid: missing required field 'iteration' in state/current.json
```

---

### BSIT-4004: Checkpoint Not Found

**Description:** The requested checkpoint does not exist.

**Common Causes:**
- Checkpoint ID incorrect
- Checkpoints not enabled
- Checkpoint was cleaned up
- No checkpoints created yet

**Recovery Steps:**
1. List checkpoints: `bsit checkpoints --run <run-id>`
2. Verify checkpoint ID spelling
3. Check checkpoint retention settings
4. Create manual checkpoint: `bsit checkpoint create`

**Example Error Message:**
```
[BSIT-4004] Checkpoint not found: checkpoint-5. Available: checkpoint-1, checkpoint-2, checkpoint-3
```

---

### BSIT-4005: State Lock Acquisition Failed

**Description:** Could not acquire lock on state files for writing.

**Common Causes:**
- Another process holds the lock
- Stale lock file
- Permission issues
- Lock timeout too short

**Recovery Steps:**
1. Check for other babysitter processes: `ps aux | grep babysitter`
2. Remove stale lock: `rm .a5c/runs/<run-id>/.lock`
3. Wait and retry
4. Increase lock timeout

**Example Error Message:**
```
[BSIT-4005] State lock acquisition failed after 30s. Lock held by PID 12345.
```

---

## Hook Errors (5XXX)

### BSIT-5001: Hook Not Found

**Description:** The specified hook file does not exist.

**Common Causes:**
- Hook file deleted
- Wrong hook path in configuration
- Hook type directory missing
- Case sensitivity issues

**Recovery Steps:**
1. Check hook exists: `ls -la plugins/babysitter/hooks/<hook-type>/`
2. Verify hook path in configuration
3. Create hook directory: `mkdir -p hooks/<hook-type>`
4. Reinstall plugin if hooks missing

**Example Error Message:**
```
[BSIT-5001] Hook not found: hooks/on-task-complete/custom-notify.sh
```

---

### BSIT-5002: Hook Not Executable

**Description:** The hook file exists but is not executable.

**Common Causes:**
- Missing execute permission
- Wrong file type (not a script)
- Windows permission issues
- Git not preserving permissions

**Recovery Steps:**
1. Add execute permission: `chmod +x <hook-file>`
2. On Windows, check file association
3. Verify shebang line: First line should be `#!/bin/bash` or similar
4. Git: `git update-index --chmod=+x <hook-file>`

**Example Error Message:**
```
[BSIT-5002] Hook not executable: hooks/on-run-start/logger.sh. Run 'chmod +x' to fix.
```

---

### BSIT-5003: Hook Execution Failed

**Description:** The hook script exited with a non-zero status.

**Common Causes:**
- Script error (syntax or runtime)
- Missing dependencies in hook
- Environment variables not set
- External service failure

**Recovery Steps:**
1. Run hook manually to see error: `bash -x <hook-file>`
2. Check hook logs: `cat .a5c/runs/<run-id>/hooks.log`
3. Verify hook dependencies
4. Test hook in isolation

**Example Error Message:**
```
[BSIT-5003] Hook execution failed: on-task-complete/metrics.sh exited with code 127 (command not found)
```

---

### BSIT-5004: Hook Output Invalid

**Description:** The hook produced output that could not be parsed or was invalid.

**Common Causes:**
- Hook output is not valid JSON (when JSON expected)
- Output exceeds size limit
- Encoding issues
- Mixed stdout/stderr

**Recovery Steps:**
1. Test hook output: `<hook-file> | jq .`
2. Ensure hook outputs only JSON to stdout
3. Redirect debug output to stderr
4. Check output encoding is UTF-8

**Example Error Message:**
```
[BSIT-5004] Hook output invalid: on-breakpoint/cli.sh - expected JSON, got plain text
```

---

### BSIT-5005: Hook Timeout

**Description:** The hook execution exceeded the maximum allowed time.

**Common Causes:**
- Hook waiting for user input
- Network request hanging
- Infinite loop in hook
- External service slow

**Recovery Steps:**
1. Review hook for blocking operations
2. Add timeouts to external calls
3. Increase hook timeout in configuration
4. Make hook asynchronous if possible

**Example Error Message:**
```
[BSIT-5005] Hook timeout: on-run-complete/notify.sh exceeded 30s limit
```

---

## Unknown/Internal Errors (9XXX)

### BSIT-9001: Unknown Error

**Description:** An unexpected error occurred that doesn't match any known error pattern.

**Common Causes:**
- Unhandled exception
- System-level failure
- Memory/resource exhaustion
- Bug in babysitter code

**Recovery Steps:**
1. Check full error logs: `bsit logs --verbose`
2. Check system resources (disk, memory)
3. Try restarting the operation
4. Report bug with logs at https://github.com/a5c-ai/babysitter/issues

**Example Error Message:**
```
[BSIT-9001] Unknown error occurred. See logs for details. Please report this issue.
```

---

### BSIT-9002: Internal Error

**Description:** An internal error occurred in the babysitter code.

**Common Causes:**
- Bug in babysitter code
- Assertion failure
- Invalid internal state
- Race condition

**Recovery Steps:**
1. Save current state/logs for bug report
2. Try operation again
3. Update to latest babysitter version
4. Report bug with reproduction steps

**Example Error Message:**
```
[BSIT-9002] Internal error: assertion failed in StateManager.commit() - expected state to be initialized
```

---

### BSIT-9003: Feature Not Implemented

**Description:** The requested feature is not yet implemented.

**Common Causes:**
- Using development/preview feature
- Feature planned for future release
- Experimental flag not enabled

**Recovery Steps:**
1. Check documentation for feature availability
2. Update to latest version
3. Enable experimental features if needed
4. Use alternative approach

**Example Error Message:**
```
[BSIT-9003] Feature not implemented: parallel task execution is planned for v2.0
```

---

## Quick Reference Table

| Code | Name | Category |
|------|------|----------|
| BSIT-1001 | Node.js Version Mismatch | Installation |
| BSIT-1002 | jq Not Found | Installation |
| BSIT-1003 | Plugin Not Installed | Installation |
| BSIT-1004 | SDK CLI Not Found | Installation |
| BSIT-1005 | Git Not Available | Installation |
| BSIT-2001 | Invalid Configuration | Configuration |
| BSIT-2002 | Missing Runs Directory | Configuration |
| BSIT-2003 | Invalid Log Level | Configuration |
| BSIT-2004 | Configuration File Not Found | Configuration |
| BSIT-2005 | Permission Denied | Configuration |
| BSIT-3001 | Process Not Found | Runtime |
| BSIT-3002 | Task Execution Failed | Runtime |
| BSIT-3003 | Breakpoint Timeout | Runtime |
| BSIT-3004 | Run Already Active | Runtime |
| BSIT-3005 | Maximum Iterations Exceeded | Runtime |
| BSIT-3006 | Agent Communication Failed | Runtime |
| BSIT-4001 | Journal Corrupted | State |
| BSIT-4002 | State File Missing | State |
| BSIT-4003 | State File Invalid | State |
| BSIT-4004 | Checkpoint Not Found | State |
| BSIT-4005 | State Lock Acquisition Failed | State |
| BSIT-5001 | Hook Not Found | Hook |
| BSIT-5002 | Hook Not Executable | Hook |
| BSIT-5003 | Hook Execution Failed | Hook |
| BSIT-5004 | Hook Output Invalid | Hook |
| BSIT-5005 | Hook Timeout | Hook |
| BSIT-9001 | Unknown Error | Internal |
| BSIT-9002 | Internal Error | Internal |
| BSIT-9003 | Feature Not Implemented | Internal |

---

## Usage in Code

### Shell Scripts

```bash
source "$PLUGIN_ROOT/scripts/error-codes.sh"

# Output an error
bsit_error "1002" "jq" "/usr/local/bin"

# Output a warning
bsit_warn "2003" "verbose" "debug, info, warn, error, silent"

# Get error message
msg=$(get_error_message "3001")
echo "Error: $msg"

# Get recovery steps
steps=$(get_recovery_steps "4001")
echo "Recovery: $steps"
```

### JSON Error Format

When outputting errors in JSON format:

```json
{
  "error": {
    "code": "BSIT-3002",
    "name": "Task Execution Failed",
    "message": "Task 'build-project' failed with exit code 1",
    "context": {
      "taskId": "task-123",
      "exitCode": 1,
      "duration": "45s"
    },
    "recovery": [
      "Check task logs: bsit logs --task task-123",
      "Verify dependencies are installed",
      "Retry with: bsit retry --task task-123"
    ]
  }
}
```

---

## Adding New Error Codes

When adding new error codes:

1. Choose the appropriate category (1XXX-9XXX)
2. Use the next available number in that category
3. Document: code, name, description, causes, recovery, example
4. Add to error-codes.sh helper script
5. Update the quick reference table
6. Test error output formatting
