# Error Catalog

**Version:** 1.0
**Last Updated:** 2026-01-25
**Category:** Reference

This catalog provides comprehensive documentation of Babysitter error messages, their meanings, causes, and solutions.

---

## Table of Contents

- [Installation Errors](#installation-errors)
- [Plugin Errors](#plugin-errors)
- [Breakpoints Service Errors](#breakpoints-service-errors)
- [Run Execution Errors](#run-execution-errors)
- [Task Execution Errors](#task-execution-errors)
- [Quality and Scoring Errors](#quality-and-scoring-errors)
- [Journal and State Errors](#journal-and-state-errors)
- [Network and API Errors](#network-and-api-errors)
- [File System Errors](#file-system-errors)
- [Error Codes Reference](#error-codes-reference)

---

## Installation Errors

### ERR_MODULE_NOT_FOUND

```
Error: Cannot find module '@a5c-ai/babysitter-sdk'
```

**Meaning:** The Babysitter SDK package is not installed or not accessible.

**Causes:**
- SDK not installed globally
- npm global path not in system PATH
- Wrong Node.js version active

**Solutions:**
1. Install globally:
   ```bash
   npm install -g @a5c-ai/babysitter-sdk@latest
   ```
2. Use npx:
   ```bash
   npx -y @a5c-ai/babysitter-sdk@latest --version
   ```
3. Check PATH includes npm global bin:
   ```bash
   npm bin -g
   # Add to PATH if needed
   ```

---

### EACCES: permission denied

```
npm ERR! EACCES: permission denied, mkdir '/usr/local/lib/node_modules/...'
```

**Meaning:** npm doesn't have permission to write to the global packages directory.

**Causes:**
- npm configured to use system directory
- Insufficient permissions
- Previous sudo install

**Solutions:**
1. Configure npm for user installs:
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
   source ~/.zshrc
   ```
2. Retry installation:
   ```bash
   npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
   ```

---

### ERESOLVE: unable to resolve dependency tree

```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Could not resolve dependency: @a5c-ai/babysitter-sdk@^0.0.120
```

**Meaning:** Version conflicts between Babysitter packages.

**Causes:**
- Mixed versions of packages
- Outdated package in cache
- Conflicting peer dependencies

**Solutions:**
1. Update all packages together:
   ```bash
   npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
   ```
2. Clear npm cache if needed:
   ```bash
   npm cache clean --force
   ```

---

## Plugin Errors

### Plugin not found: babysitter@a5c.ai

```
Error: Plugin 'babysitter@a5c.ai' not found
Available plugins: [...]
```

**Meaning:** The Babysitter plugin is not installed in Claude Code.

**Causes:**
- Plugin not installed
- Marketplace not added
- Plugin disabled

**Solutions:**
1. Add marketplace:
   ```bash
   claude plugin marketplace add a5c-ai/babysitter
   ```
2. Install plugin:
   ```bash
   claude plugin install --scope user babysitter@a5c.ai
   ```
3. Enable plugin:
   ```bash
   claude plugin enable --scope user babysitter@a5c.ai
   ```
4. Restart Claude Code

---

### Skill not found: babysit

```
Error: Skill 'babysit' not found
```

**Meaning:** The babysit skill is not available in the current session.

**Causes:**
- Plugin not enabled
- Claude Code not restarted after plugin install
- Plugin load error

**Solutions:**
1. Check plugin status:
   ```bash
   claude plugin list | grep babysitter
   ```
2. Enable if disabled:
   ```bash
   claude plugin enable --scope user babysitter@a5c.ai
   ```
3. Restart Claude Code completely
4. Verify with `/skills`

---

### Plugin load error

```
Error loading plugin babysitter@a5c.ai: [details]
```

**Meaning:** The plugin failed to initialize.

**Causes:**
- Corrupted plugin files
- Version incompatibility
- Missing dependencies

**Solutions:**
1. Reinstall plugin:
   ```bash
   claude plugin uninstall babysitter@a5c.ai
   claude plugin install --scope user babysitter@a5c.ai
   ```
2. Update marketplace:
   ```bash
   claude plugin marketplace update a5c.ai
   ```
3. Check for updates:
   ```bash
   claude plugin update babysitter@a5c.ai
   ```

---

## Breakpoints Service Errors

### EADDRINUSE: address already in use :::3184

```
Error: listen EADDRINUSE: address already in use :::3184
```

**Meaning:** Port 3184 is already being used by another process.

**Causes:**
- Previous breakpoints service still running
- Another application using port 3184
- Service didn't shut down cleanly

**Solutions:**
1. Find and kill existing process:
   ```bash
   lsof -i :3184
   kill <PID>
   ```
2. Use different port:
   ```bash
   npx @a5c-ai/babysitter-breakpoints start --port 3185
   ```
3. Kill all breakpoints processes:
   ```bash
   pkill -f "babysitter-breakpoints"
   ```

---

### Breakpoint timed out

```
Error: Breakpoint bp-001 timed out
Waiting for breakpoint approval...
Timeout after 300s
```

**Meaning:** A breakpoint was not approved within the timeout period.

**Causes:**
- Breakpoints service not running
- Service not accessible
- Approval not given in time

**Solutions:**
1. Check service status:
   ```bash
   curl http://localhost:3184/health
   ```
2. Start service if not running:
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start
   ```
3. Approve pending breakpoints at http://localhost:3184
4. Resume the run:
   ```bash
   /babysitter:call resume --run-id <runId>
   ```

---

### ECONNREFUSED: Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:3184
```

**Meaning:** Cannot connect to the breakpoints service.

**Causes:**
- Service not running
- Service on different port
- Firewall blocking connection

**Solutions:**
1. Start the service:
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start
   ```
2. Check correct port:
   ```bash
   curl http://localhost:3184/health
   curl http://localhost:3185/health  # if using different port
   ```
3. Check firewall settings

---

## Run Execution Errors

### Run encountered an error

```
Error: Run encountered an error
  at processIteration (process.js:123)
  Caused by: [underlying error]
```

**Meaning:** The run failed during execution.

**Causes:**
- Task failure
- Journal conflict
- Process definition error
- External dependency failure

**Solutions:**
1. Check journal for details:
   ```
   What error caused my babysitter run to fail?
   ```
2. Fix underlying issue
3. Resume if possible:
   ```
   /babysitter:call resume
   ```

---

### Run not found

```
Error: Run not found: 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

**Meaning:** The specified run ID doesn't exist.

**Causes:**
- Run was deleted
- Wrong run ID
- Wrong working directory
- Run never created

**Solutions:**
1. Ask Claude to find available runs:
   ```
   What babysitter runs have I done recently?
   ```
2. Check working directory
3. Use correct run ID

---

### Run already completed

```
Error: Cannot resume completed run
Run state: completed
```

**Meaning:** Attempting to resume a run that has already finished.

**Causes:**
- Run finished successfully
- Trying to resume wrong run

**Solutions:**
- Completed runs cannot be resumed
- Create a new run for additional work

---

### Run is already being executed

```
Error: Run is already being executed by another session
```

**Meaning:** Another session is actively running this workflow.

**Causes:**
- Multiple Claude Code windows running same workflow
- Previous session didn't terminate cleanly

**Solutions:**
1. Wait for other session to complete
2. Close other Claude Code sessions
3. Wait a moment and retry (for stale locks)

---

## Task Execution Errors

### ENOENT: no such file or directory

```
Error: ENOENT: no such file or directory, open '/path/to/file.js'
Task failed: task-001
```

**Meaning:** A task tried to access a file that doesn't exist.

**Causes:**
- Incorrect file path in task definition
- File deleted or moved
- Path resolution issue
- Dependencies not installed

**Solutions:**
1. Verify file exists:
   ```bash
   ls -la /path/to/file.js
   ```
2. Check paths in task definition
3. Install missing dependencies:
   ```bash
   npm install
   ```

---

### Task timeout

```
Error: Task timeout: agent-task-001
Execution exceeded 120s
```

**Meaning:** A task took too long to complete.

**Causes:**
- Large context for agent task
- API latency
- Complex computation
- Network issues

**Solutions:**
1. Reduce task scope
2. Increase timeout:
   ```javascript
   await ctx.task(task, args, { timeout: 300000 });
   ```
3. Check API status
4. Split into smaller tasks

---

### Task failed with exit code

```
Error: Task failed with exit code 1
Command: npm test
stderr: [error output]
```

**Meaning:** A shell/node task command failed.

**Causes:**
- Test failures
- Build errors
- Missing dependencies
- Script errors

**Solutions:**
1. Check stderr for details
2. Run command manually to debug:
   ```bash
   npm test
   ```
3. Fix underlying issues
4. Resume run

---

### Agent task error

```
Error: Agent task failed
  Caused by: API rate limit exceeded
```

**Meaning:** The LLM API call failed.

**Causes:**
- Rate limiting
- API outage
- Invalid request
- Token limit exceeded

**Solutions:**
1. Wait and retry (for rate limits)
2. Check API status
3. Reduce context size
4. Resume run after waiting

---

## Quality and Scoring Errors

### Quality target not met

```
Quality target not met after 5 iterations
Final score: 78/100
Target: 85/100
```

**Meaning:** The quality convergence loop couldn't reach the target score.

**Causes:**
- Unrealistic target
- Fundamental code issues
- Scoring criteria too strict
- Not enough iterations

**Solutions:**
1. Lower quality target:
   ```
   Use babysitter with 75% quality target
   ```
2. Increase iterations:
   ```
   Use babysitter with max 10 iterations
   ```
3. Review and fix blocking issues
4. Adjust scoring weights

---

### Quality score validation error

```
Error: Invalid quality score returned by agent
Expected: number between 0-100
Received: [invalid value]
```

**Meaning:** The scoring agent returned an invalid score.

**Causes:**
- Agent prompt issue
- Response parsing error
- Schema mismatch

**Solutions:**
1. Check agent task definition
2. Verify output schema
3. Review agent prompt for clarity

---

## Journal and State Errors

### Journal conflict detected

```
Error: Journal conflict detected
Multiple writes attempted at sequence 42
```

**Meaning:** Concurrent writes to the journal were detected.

**Causes:**
- Multiple sessions running same workflow
- Race condition
- Stale lock

**Solutions:**
1. Ensure single session per run
2. Close other Claude Code windows
3. Wait and retry
4. Delete state cache and rebuild:
   ```bash
   rm .a5c/runs/<runId>/state/state.json
   babysitter run:status <runId>
   ```

---

### Journal integrity error

```
Error: Journal integrity check failed
Event 43 has invalid sequence
```

**Meaning:** The journal has inconsistent or corrupted data.

**Causes:**
- Manual journal editing
- Disk write failure
- Interrupted write
- File corruption

**Solutions:**
1. Check journal files:
   ```bash
   jq empty .a5c/runs/<runId>/journal/*.json
   ```
2. If corrupted, may need to start new run
3. Backup and investigate:
   ```bash
   cp -r .a5c/runs/<runId> backup-run
   ```

---

### State reconstruction failed

```
Error: Failed to reconstruct state from journal
Invalid event at sequence 15
```

**Meaning:** The state cache couldn't be rebuilt from journal events.

**Causes:**
- Corrupted journal
- Missing events
- Invalid event format

**Solutions:**
1. Delete state cache:
   ```bash
   rm .a5c/runs/<runId>/state/state.json
   ```
2. Check journal integrity
3. May need to start new run if journal corrupted

---

## Network and API Errors

### ETIMEDOUT

```
Error: connect ETIMEDOUT 104.26.0.100:443
```

**Meaning:** Network connection timed out.

**Causes:**
- Network issues
- Firewall blocking
- Service unavailable
- DNS issues

**Solutions:**
1. Check internet connectivity
2. Verify service is accessible
3. Check firewall settings
4. Retry after network recovery

---

### API rate limit exceeded

```
Error: API rate limit exceeded
Retry after: 60 seconds
```

**Meaning:** Too many API requests in a short period.

**Causes:**
- High-frequency requests
- Concurrent tasks making requests
- Account rate limits

**Solutions:**
1. Wait and retry
2. Reduce parallel API calls
3. Add delays between requests
4. Check account rate limits

---

### SSL/TLS error

```
Error: unable to verify the first certificate
```

**Meaning:** SSL certificate verification failed.

**Causes:**
- Certificate issues
- Proxy interference
- Outdated certificates

**Solutions:**
1. Check system time is correct
2. Update CA certificates
3. Check proxy settings
4. Don't disable SSL verification (security risk)

---

## File System Errors

### ENOSPC: no space left on device

```
Error: ENOSPC: no space left on device
```

**Meaning:** Disk is full.

**Causes:**
- Many large runs
- Large artifacts
- System disk full

**Solutions:**
1. Clean old runs:
   ```bash
   rm -rf .a5c/runs/<old-run-id>
   ```
2. Check disk space:
   ```bash
   df -h
   ```
3. Free space on disk

---

### EPERM: operation not permitted

```
Error: EPERM: operation not permitted, open '/path/to/file'
```

**Meaning:** Insufficient permissions for file operation.

**Causes:**
- File permissions
- Read-only file system
- File locked by another process

**Solutions:**
1. Check file permissions:
   ```bash
   ls -la /path/to/file
   ```
2. Fix permissions if needed
3. Check for file locks

---

### EMFILE: too many open files

```
Error: EMFILE: too many open files
```

**Meaning:** System file descriptor limit reached.

**Causes:**
- Many concurrent file operations
- System limit too low
- File handles not closed

**Solutions:**
1. Increase ulimit:
   ```bash
   ulimit -n 4096
   ```
2. Close other applications
3. Reduce concurrent operations

---

## Error Codes Reference

### Quick Reference Table

| Error Code | Category | Common Cause | Quick Fix |
|------------|----------|--------------|-----------|
| `ENOENT` | File System | File not found | Check paths |
| `EACCES` | Permissions | No permission | Fix permissions |
| `EADDRINUSE` | Network | Port in use | Kill process or change port |
| `ECONNREFUSED` | Network | Service not running | Start service |
| `ETIMEDOUT` | Network | Connection timeout | Check network |
| `ENOSPC` | File System | Disk full | Free space |
| `EPERM` | Permissions | Operation denied | Check permissions |
| `EMFILE` | System | Too many files | Increase ulimit |
| `ERR_MODULE_NOT_FOUND` | Node.js | Module missing | Install package |
| `ERESOLVE` | npm | Dependency conflict | Update packages |

### Exit Codes

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | None needed |
| 1 | General error | Check error message |
| 2 | Command not found | Check installation |
| 126 | Permission denied | Fix permissions |
| 127 | Command not found | Check PATH |
| 137 | Out of memory (SIGKILL) | Increase memory |
| 143 | Terminated (SIGTERM) | Check what terminated |

---

## Related Documentation

- [Troubleshooting Guide](./troubleshooting.md) - Step-by-step problem resolution
- [FAQ](./faq.md) - Common questions answered
- [Installation Guide](../getting-started/installation.md) - Setup help

---

## Reporting New Errors

If you encounter an error not listed here:

1. **Document the error:**
   - Full error message
   - Stack trace (if available)
   - Steps to reproduce

2. **Gather diagnostics:**
   ```bash
   babysitter run:status <runId> --json > diagnostic.json
   babysitter run:events <runId> --limit 20 --reverse --json >> diagnostic.json
   ```

3. **Report at:**
   [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
