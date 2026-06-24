[Docs](../index.md) › [Reference](./index.md) › Error Catalog

# Error Catalog

**Version:** 1.0
**Last Updated:** 2026-06-22
**Category:** Reference

This catalog provides comprehensive documentation of Babysitter error messages, their meanings, causes, and solutions.

---

## On this page

- [Installation Errors](#installation-errors)
- [Plugin Errors](#plugin-errors)
- [Adapter Errors](#adapter-errors)
- [Harness Install Errors](#harness-install-errors)
- [Session Binding Errors](#session-binding-errors)
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

**Meaning:** The Babysitter SDK package is not installed or not accessible to the current project.

**Causes:**
- SDK not installed globally
- npm global path not in system PATH
- Wrong Node.js version active

**Solutions:**
1. Install globally:
   ```bash
   npm install -g @a5c-ai/babysitter@latest
   ```
2. Use npx:
   ```bash
   npx -y @a5c-ai/babysitter@latest --version
   ```
3. If your [process](./glossary.md) code imports the SDK, install it in the project:
   ```bash
   npm install @a5c-ai/babysitter-sdk
   ```
4. Check PATH includes npm global bin:
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
   npm install -g @a5c-ai/babysitter@latest
   ```

---

### ERESOLVE: unable to resolve dependency tree

```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Could not resolve dependency: @a5c-ai/babysitter-sdk@^4.0.0
```

**Meaning:** Version conflicts between Babysitter packages.

**Causes:**
- Mixed versions of packages
- Outdated package in cache
- Conflicting peer dependencies

**Solutions:**
1. Update all packages together:
   ```bash
   npm install -g @a5c-ai/babysitter@latest @a5c-ai/genty-platform@latest
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
   claude plugin marketplace add a5c-ai/babysitter-claude
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

## Adapter Errors

The host-side `adapters` CLI (package `@a5c-ai/adapters-cli`) is the harness runtime companion. When it cannot start, find a harness, or reach a provider, you will see one of the following. See the [Adapters CLI Reference](./adapters-cli.md) for the full command surface.

### adapters: command not found

```
adapters: command not found
```

**Meaning:** The `adapters` CLI is not installed or not on your PATH.

**Causes:**
- `@a5c-ai/adapters-cli` not installed globally
- npm global bin not on PATH

**Solutions:**
1. Install globally:
   ```bash
   npm install -g @a5c-ai/adapters-cli
   ```
2. Confirm the install and environment:
   ```bash
   adapters version
   adapters doctor
   ```
3. Ensure the npm global bin is on PATH:
   ```bash
   npm bin -g
   ```

---

### Unsupported Node.js version (adapters)

```
Error: @a5c-ai/adapters-cli requires Node.js >=20.9.0
```

**Meaning:** The `adapters` CLI pins a higher Node floor (>=20.9.0) than the rest of the Babysitter toolchain (>=20.0.0).

**Causes:**
- An older Node.js is active in the current shell
- A version manager (nvm/asdf) selected an out-of-range version

**Solutions:**
1. Check the active version:
   ```bash
   node --version
   ```
2. Switch to a supported version (22.x LTS recommended):
   ```bash
   nvm install 22 && nvm use 22
   ```

---

### Adapter not found / harness binary missing

```
Error: adapter not found for agent 'codex'
```
```
Error: harness binary for 'gemini' not detected
```

**Meaning:** The requested adapter is not registered, or its underlying harness binary cannot be located.

**Causes:**
- The harness CLI is not installed
- Wrong agent/adapter name
- Credentials or PATH issues hiding the binary

**Solutions:**
1. Run the environment health check first:
   ```bash
   adapters doctor
   ```
2. List and inspect registered adapters:
   ```bash
   adapters adapters list
   adapters adapters detect codex
   ```
3. Install the missing harness binary:
   ```bash
   adapters install codex
   ```

---

### Provider transport error

```
Error: harness cannot speak provider transport natively
```

**Meaning:** The harness cannot reach the requested provider (Bedrock, Vertex, Azure Foundry, Ollama, and others) without a transport proxy.

**Causes:**
- Harness does not natively support the provider's transport
- Proxy disabled with `--no-proxy`

**Solutions:**
1. Let the launcher start a proxy when needed:
   ```bash
   adapters launch claude bedrock --with-proxy-if-needed
   ```
2. Verify credentials with `adapters auth check`.

---

## Harness Install Errors

These surface when installing the in-session `/babysitter:*` plugin into a harness with `babysitter harness:install-plugin <harness-key>`. See the [Install Matrix](../harnesses/install-matrix.md) for the authoritative list of harness keys.

### Unknown harness key

```
Error: unknown harness key 'gemini'
```

**Meaning:** The argument passed to `harness:install-plugin` is not a recognized harness key.

**Causes:**
- Using the harness display name instead of its key (e.g. `gemini` instead of `gemini-cli`)
- Typo in the key

**Solutions:**
1. Use the correct harness key — it is **not** always the harness name:
   ```bash
   babysitter harness:install-plugin gemini-cli
   ```
2. Check the [Install Matrix](../harnesses/install-matrix.md) for every supported key.

---

### Plugin installed but not appearing in the harness

```
Plugin installed, but /babysitter:* commands are not available
```

**Meaning:** The install completed but the harness has not picked up the plugin.

**Causes:**
- Harness not restarted after install
- Installed into the wrong workspace
- The harness uses a different continuation/registration model than expected

**Solutions:**
1. Restart the harness completely.
2. Re-run the install targeting the right workspace:
   ```bash
   babysitter harness:install-plugin <harness-key> --workspace ./my-project
   ```
3. Confirm which continuation model the harness uses in the [Hooks](../features/hooks.md) per-harness table — do not assume the Claude `Stop`-hook model elsewhere.

See: [Troubleshooting - Harness Install Issues](./troubleshooting.md#harness-install-issues).

---

## Session Binding Errors

In v6, session resolution is **PID-scoped** and harness-agnostic. The session ID is carried in `AGENT_SESSION_ID` (which supersedes the deprecated `BABYSITTER_SESSION_ID` and `CLAUDE_SESSION_ID`). See [Configuration](./configuration.md) for the full variable list.

### Session not bound / cannot resolve session

```
Error: could not resolve agent session for this process
```

**Meaning:** Babysitter could not bind the current process to a harness session.

**Causes:**
- The harness did not export `AGENT_SESSION_ID`
- The continuation hook is not registered for this harness
- A wrapper process broke the PID-scoped lookup

**Solutions:**
1. Confirm the session variable is present:
   ```bash
   echo "$AGENT_SESSION_ID"
   ```
2. If your harness sets the session only via the environment (not via the PID-scoped store), opt into the legacy behavior with the escape hatch:
   ```bash
   export BABYSITTER_TRUST_ENV_SESSION=1
   ```
3. Verify the harness's continuation hooks are installed (see [Hooks](../features/hooks.md)).

See: [Troubleshooting - Session Binding Issues](./troubleshooting.md#session-binding-issues).

---

### Deprecated session variable in use

```
Warning: BABYSITTER_SESSION_ID is deprecated; use AGENT_SESSION_ID
```

**Meaning:** A removed/deprecated session variable was detected.

**Causes:**
- Scripts or configs still set `BABYSITTER_SESSION_ID` or `CLAUDE_SESSION_ID`

**Solutions:**
1. Replace the deprecated variables with `AGENT_SESSION_ID`.
2. Remove any `--plugin-root` flag from scripts — it has been removed and plugin-root resolution is now automatic (the runtime injects `BABYSITTER_PLUGIN_ROOT` into hooks; you do not set it yourself).

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
- [Configuration Reference](./configuration.md) - Environment variables (including `AGENT_SESSION_ID` and `BABYSITTER_TRUST_ENV_SESSION`)
- [Adapters CLI Reference](./adapters-cli.md) - The host-side `adapters` CLI
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

## Next steps

- **Next:** [Troubleshooting](./troubleshooting.md)
- **Related:** [FAQ](./faq.md), [CLI Reference](./cli-reference.md)

---

**Document Status:** Complete
**Last Updated:** 2026-06-22
