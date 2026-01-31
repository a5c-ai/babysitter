# Troubleshooting Guide

**Version:** 1.0
**Last Updated:** 2026-01-25
**Category:** Reference

This guide provides systematic troubleshooting procedures for common Babysitter issues. Each section includes symptoms, diagnosis steps, solutions, and prevention tips.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Plugin Issues](#plugin-issues)
- [Breakpoints Service Issues](#breakpoints-service-issues)
- [Run Execution Issues](#run-execution-issues)
- [Quality Convergence Issues](#quality-convergence-issues)
- [Resumption Issues](#resumption-issues)
- [Performance Issues](#performance-issues)
- [Journal and State Issues](#journal-and-state-issues)
- [Diagnostic Commands Reference](#diagnostic-commands-reference)
- [When to Contact Support](#when-to-contact-support)

---

## Installation Issues

### Node.js Not Found

**Symptoms:**
```
command not found: npm
command not found: node
```

**Diagnosis:**
```bash
which node
which npm
node --version
```

**Solutions:**

1. **Install Node.js via nvm (recommended):**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc  # or ~/.zshrc
   nvm install 22
   nvm use 22
   ```

2. **Direct installation:**
   - Download from [nodejs.org](https://nodejs.org/)
   - Install the LTS version (22.x)

3. **Verify PATH:**
   ```bash
   echo $PATH | grep -E "(node|npm)"
   ```

**Prevention:** Use nvm to manage Node.js versions.

---

### Permission Denied During npm Install

**Symptoms:**
```
npm ERR! EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Diagnosis:**
```bash
npm config get prefix
ls -la $(npm config get prefix)/lib/node_modules/
```

**Solutions:**

1. **Fix npm permissions (recommended):**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Reinstall packages:**
   ```bash
   npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
   ```

**Prevention:** Never use `sudo npm install -g`. Configure npm for user installs.

---

### SDK Module Not Found

**Symptoms:**
```
Error: Cannot find module '@a5c-ai/babysitter-sdk'
```

**Diagnosis:**
```bash
npm list -g @a5c-ai/babysitter-sdk
which babysitter
echo $PATH
```

**Solutions:**

1. **Install globally:**
   ```bash
   npm install -g @a5c-ai/babysitter-sdk@latest
   ```

2. **Use npx (always works):**
   ```bash
   npx -y @a5c-ai/babysitter-sdk@latest --version
   ```

3. **Check PATH includes npm global bin:**
   ```bash
   npm bin -g
   # Add this to your PATH if not included
   ```

**Prevention:** Verify installation with `npm list -g` after installing.

---

### Version Mismatch Errors

**Symptoms:**
```
Error: Incompatible version: sdk@0.0.120 requires babysitter@^0.0.120
```

**Diagnosis:**
```bash
npm list -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints
```

**Solutions:**

Update all packages to the latest versions:
```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

**Prevention:** Update all packages together, not individually.

---

### jq Not Found

**Symptoms:**
```
command not found: jq
jq: command not found
```

Many Babysitter diagnostic commands use `jq` for JSON processing. Without it, commands like journal analysis and status inspection will fail.

**Diagnosis:**
```bash
which jq
jq --version
```

**Solutions:**

Install `jq` for your platform:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL/CentOS
sudo dnf install jq

# Arch Linux
sudo pacman -S jq

# Windows (Chocolatey)
choco install jq

# Windows (Scoop)
scoop install jq

# Windows (WSL) - use Ubuntu instructions
sudo apt-get install jq
```

**Verify installation:**
```bash
jq --version
# Expected: jq-1.6 or higher
```

**Prevention:** Install `jq` as part of your initial setup. It's a standard tool for working with JSON on the command line.

---

## Plugin Issues

### Plugin Not Appearing in /skills

**Symptoms:**
- `/skills` command doesn't show "babysit"
- "Skill not found: babysit" error

**Diagnosis:**
```bash
claude plugin list
claude plugin list | grep babysitter
```

**Step-by-Step Solution:**

1. **Add marketplace (if not added):**
   ```bash
   claude plugin marketplace add a5c-ai/babysitter
   ```

2. **Install plugin:**
   ```bash
   claude plugin install --scope user babysitter@a5c.ai
   ```

3. **Enable plugin:**
   ```bash
   claude plugin enable --scope user babysitter@a5c.ai
   ```

4. **Restart Claude Code completely:**
   - Close all Claude Code windows
   - Wait a few seconds
   - Reopen Claude Code

5. **Verify:**
   ```bash
   /skills
   # Should show "babysit"
   ```

---

### Plugin Install Fails

**Symptoms:**
```
Error: Plugin 'babysitter@a5c.ai' not found
```

**Diagnosis:**
```bash
claude plugin marketplace list
```

**Solutions:**

1. **Add marketplace first:**
   ```bash
   claude plugin marketplace add a5c-ai/babysitter
   ```

2. **Check network connectivity:**
   ```bash
   curl -I https://github.com/a5c-ai/babysitter
   ```

3. **Try updating marketplace:**
   ```bash
   claude plugin marketplace update a5c.ai
   ```

---

### Plugin Conflicts

**Symptoms:**
- Claude Code behaves unexpectedly
- Other plugins stop working after Babysitter install

**Diagnosis:**
```bash
claude plugin list --all
```

**Solutions:**

1. **Disable and re-enable:**
   ```bash
   claude plugin disable babysitter@a5c.ai
   claude plugin enable babysitter@a5c.ai
   ```

2. **Check for conflicts:**
   - Temporarily disable other plugins
   - Test Babysitter alone
   - Re-enable plugins one by one

---

## Breakpoints Service Issues

### Service Not Running

**Symptoms:**
```
Waiting for breakpoint approval...
Timeout after 300s
Error: Breakpoint timed out
```

**Diagnosis:**
```bash
curl http://localhost:3184/health
lsof -i :3184
ps aux | grep breakpoints
```

**Solutions:**

1. **Start the service:**
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start
   ```

2. **Run in background:**
   ```bash
   nohup npx -y @a5c-ai/babysitter-breakpoints@latest start > breakpoints.log 2>&1 &
   ```

3. **Verify running:**
   ```bash
   curl http://localhost:3184/health
   # Expected: {"status":"ok",...}
   ```

**Prevention:** Start breakpoints service before running workflows with breakpoints.

---

### Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3184
```

**Diagnosis:**
```bash
lsof -i :3184
# or on Windows:
netstat -ano | findstr :3184
```

**Solutions:**

1. **Kill the existing process:**
   ```bash
   kill $(lsof -t -i :3184)
   ```

2. **Use a different port:**
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start --port 3185
   ```

3. **If previous breakpoints service:**
   ```bash
   pkill -f "babysitter-breakpoints"
   ```

---

### Breakpoint Not Appearing in UI

**Symptoms:**
- Workflow says "waiting for approval"
- UI at localhost:3184 shows no pending breakpoints

**Diagnosis:**
```bash
# Check pending effects
babysitter run:status <runId> --json | jq '.metadata.pendingEffectsByKind'

# Check breakpoints API
curl http://localhost:3184/api/breakpoints
```

**Solutions:**

1. **Refresh the breakpoints UI**

2. **Verify run is actually waiting:**
   ```bash
   babysitter run:status <runId> --json
   # Look for state: "waiting"
   ```

3. **Check if breakpoint was already resolved:**
   ```bash
   babysitter run:events <runId> --filter-type BREAKPOINT --json
   ```

4. **Resume the run to retry breakpoint registration:**
   ```bash
   /babysitter:call resume --run-id <runId>
   ```

---

### Remote Access Not Working (ngrok)

**Symptoms:**
- ngrok URL doesn't load breakpoints UI
- Timeout accessing remote URL

**Diagnosis:**
```bash
ngrok http 3184
# Check the displayed URL works locally first
curl http://localhost:3184
```

**Solutions:**

1. **Ensure service is running locally first:**
   ```bash
   curl http://localhost:3184/health
   ```

2. **Restart ngrok:**
   ```bash
   pkill ngrok
   ngrok http 3184
   ```

3. **Check ngrok status:**
   Visit http://localhost:4040 for ngrok inspector

4. **Alternative: Use Telegram:**
   Configure Telegram integration in breakpoints UI for mobile notifications.

---

## Run Execution Issues

### Run Encountered an Error

**Symptoms:**
```
Error: Run encountered an error
  at processIteration (process.js:123)
```

**Diagnosis:**
```bash
# Check journal for error details
babysitter run:events <runId> --filter-type RUN_FAILED --json

# View last events
babysitter run:events <runId> --limit 10 --reverse --json
```

**Solutions:**

1. **Identify the cause:**
   ```bash
   jq '.payload.error' .a5c/runs/<runId>/journal/$(ls -t .a5c/runs/<runId>/journal/ | head -1)
   ```

2. **If journal conflict:**
   - Ensure no other sessions are running the same workflow
   - Delete state cache and rebuild:
     ```bash
     rm .a5c/runs/<runId>/state/state.json
     babysitter run:status <runId>
     ```

3. **If task failure:**
   - Fix the underlying issue (missing deps, file not found, etc.)
   - Resume:
     ```bash
     /babysitter:call resume --run-id <runId>
     ```

4. **Ask Claude to analyze:**
   ```
   Analyze the babysitter run error for <runId> and try to recover
   ```

---

### Task Execution Failed: ENOENT

**Symptoms:**
```
Task failed: test-task-001
Error: ENOENT: no such file or directory
```

**Diagnosis:**
```bash
# Check task details
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq .

# Check working directory
pwd
ls -la
```

**Solutions:**

1. **Verify file paths:**
   - Check if referenced files exist
   - Ensure paths are correct for your system

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Check working directory:**
   - Tasks run relative to the run directory
   - Verify paths in task definition

---

### Agent Task Timeout

**Symptoms:**
```
Task timeout: agent-task-001
Execution exceeded 120s
```

**Diagnosis:**
```bash
# Check task that timed out
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq .
```

**Solutions:**

1. **Reduce task scope:**
   - Analyze specific files instead of entire codebase
   - Break large tasks into smaller ones

2. **Increase timeout (if necessary):**
   ```javascript
   await ctx.task(analyzeTask, { /* args */ }, {
     timeout: 300000  // 5 minutes
   });
   ```

3. **Check API status:**
   - Verify Claude API is accessible
   - Check for rate limiting

---

### Session Ended Unexpectedly

**Symptoms:**
```
Claude Code session terminated
Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Status: interrupted
```

**Diagnosis:**
```bash
babysitter run:status <runId> --json
```

**Solutions:**

Resume the run:
```
/babysitter:call resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

Babysitter is designed to be resumable. All progress is preserved.

---

## Quality Convergence Issues

### Quality Score Not Improving

**Symptoms:**
```
Iteration 1: Quality 65/100
Iteration 2: Quality 66/100
Iteration 3: Quality 65/100
...
Iteration 5: Quality 66/100
Target not met: 85/100
```

**Diagnosis:**
```bash
# View quality scores
babysitter run:events <runId> --filter-type QUALITY_SCORE --json

# Check recommendations
jq '.recommendations' .a5c/runs/<runId>/tasks/*/result.json
```

**Solutions:**

1. **Review feedback:**
   - Check what's blocking improvement
   - Look for recurring issues

2. **Lower target:**
   ```
   Use babysitter with 75% quality target
   ```

3. **Increase iterations:**
   ```
   Use babysitter with max 10 iterations
   ```

4. **Fix blocking issues:**
   - Run tests manually: `npm test`
   - Check lint: `npm run lint`
   - Fix any consistent failures

5. **Review scoring weights:**
   - Some criteria may be weighted too heavily
   - Adjust in process definition if needed

---

### Iterations Never Converge

**Symptoms:**
- Quality score oscillates without improvement
- Maximum iterations reached without meeting target

**Diagnosis:**
```bash
# Check quality trend
jq -s '[.[] | select(.type == "QUALITY_SCORE")] | map({iteration: .payload.iteration, score: .payload.score})' \
  .a5c/runs/<runId>/journal/*.json
```

**Solutions:**

1. **Implement early exit on plateau:**
   ```javascript
   const recentScores = iterationResults.slice(-3).map(r => r.quality);
   if (Math.max(...recentScores) - Math.min(...recentScores) < 2) {
     ctx.log('Quality plateaued, stopping early');
     break;
   }
   ```

2. **Lower target to achievable level**

3. **Review if target is realistic for the codebase**

---

### Inconsistent Quality Scores

**Symptoms:**
- Quality scores vary significantly between iterations
- No clear trend

**Diagnosis:**
```bash
# Check variance in scores
jq -s '[.[] | select(.type == "QUALITY_SCORE") | .payload.score] | (add / length) as $mean | map(. - $mean | . * .) | add / length | sqrt' \
  .a5c/runs/<runId>/journal/*.json
```

**Solutions:**

1. **Use more deterministic scoring criteria**

2. **Ensure tests are stable (no flaky tests)**

3. **Review agent scoring prompts for consistency**

4. **Use `ctx.now()` instead of `Date.now()` for timestamps**

---

## Resumption Issues

### Cannot Resume Completed Run

**Symptoms:**
- Resume has no effect
- Run state shows "completed"

**Diagnosis:**
```bash
babysitter run:status <runId> --json | jq '.state'
```

**Solutions:**

A completed run cannot be resumed - it's already finished. Create a new run instead.

---

### Breakpoint Not Resolved Before Resume

**Symptoms:**
- Resume says "waiting"
- Nothing happens

**Diagnosis:**
```bash
babysitter run:status <runId> --json | jq '.metadata.pendingEffectsByKind'
```

**Solutions:**

1. **Approve the pending breakpoint:**
   - Open http://localhost:3184
   - Find and approve the breakpoint

2. **Then resume:**
   ```bash
   /babysitter:call resume --run-id <runId>
   ```

---

### State Corruption After Manual Edits

**Symptoms:**
- Run behaves unexpectedly
- Events don't match expected behavior

**Diagnosis:**
```bash
# Check journal integrity
jq empty .a5c/runs/<runId>/journal/*.json 2>&1
```

**Solutions:**

1. **Never edit journal files manually**

2. **If state cache corrupted:**
   ```bash
   rm .a5c/runs/<runId>/state/state.json
   babysitter run:status <runId>  # Rebuilds state
   ```

3. **If journal corrupted:**
   - May need to start a new run
   - Backup journal first for analysis

---

### Missing Run Directory

**Symptoms:**
```
Error: Run not found: 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

**Diagnosis:**
```bash
ls -la .a5c/runs/ | grep <runId>
```

**Solutions:**

- Run directory was deleted or never created
- Create a new run instead
- Check if you're in the correct working directory

---

## Performance Issues

### Slow Iteration Execution

**Symptoms:**
- Each iteration takes several minutes
- Tasks run sequentially when they could be parallel

**Diagnosis:**
```bash
# Find slow tasks
jq -s '[.[] | select(.type == "EFFECT_RESOLVED")] | map({effectId: .payload.effectId, duration: ((.payload.finishedAt | fromdateiso8601) - (.payload.startedAt | fromdateiso8601))}) | sort_by(.duration) | reverse | .[0:5]' \
  .a5c/runs/<runId>/journal/*.json
```

**Solutions:**

1. **Use parallel execution:**
   ```javascript
   const [coverage, lint, security] = await ctx.parallel.all([
     () => ctx.task(coverageTask, {}),
     () => ctx.task(lintTask, {}),
     () => ctx.task(securityTask, {})
   ]);
   ```

2. **Reduce agent task scope**

3. **Set lower iteration limits**

4. **Cache research results between iterations**

---

### High Disk Usage

**Symptoms:**
- `.a5c/` directory growing large
- Disk space warnings

**Diagnosis:**
```bash
du -sh .a5c/
du -h .a5c/runs/* | sort -h | tail -10
```

**Solutions:**

1. **Clean old runs:**
   ```bash
   # List runs by size
   du -h .a5c/runs/* | sort -h

   # Delete old runs
   rm -rf .a5c/runs/<old-run-id>
   ```

2. **Archive completed runs:**
   ```bash
   tar -czf run-archive.tar.gz .a5c/runs/<runId>
   rm -rf .a5c/runs/<runId>
   ```

3. **Add cleanup to workflow:**
   - Periodically clean old runs
   - Set up automated cleanup

---

### Memory Issues

**Symptoms:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node.js memory:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Reduce concurrent tasks**

3. **Process smaller batches of files**

---

## Journal and State Issues

### Journal Conflict

**Symptoms:**
```
Error: Journal conflict detected
```

**Diagnosis:**
```bash
# Check if multiple processes running
ps aux | grep babysitter
```

**Solutions:**

1. **Ensure single writer:**
   - Only one session should run a workflow at a time

2. **Wait and retry:**
   - If previous session crashed, wait a moment
   - Resume the run

3. **Rebuild state:**
   ```bash
   rm .a5c/runs/<runId>/state/state.json
   babysitter run:status <runId>
   ```

---

### Events Out of Order

**Symptoms:**
- Events appear in unexpected order
- State doesn't match expectations

**Diagnosis:**
```bash
# Check sequence numbers
jq '.seq' .a5c/runs/<runId>/journal/*.json | sort -n
```

**Solutions:**

- Always use CLI or sort by `seq` field:
  ```bash
  jq -s 'sort_by(.seq)' .a5c/runs/<runId>/journal/*.json
  ```

- File system listing may not be sorted correctly

---

### State Cache Missing

**Symptoms:**
- CLI commands are slow on first access
- State needs rebuilding

**Diagnosis:**
```bash
ls .a5c/runs/<runId>/state/
```

**Solutions:**

This is normal. The state cache is derived from the journal:

```bash
# Trigger rebuild
babysitter run:status <runId>
```

The cache will be created automatically.

---

## Diagnostic Commands Reference

### Run Status and Events

```bash
# Check run status
babysitter run:status <runId> --json

# View all events
babysitter run:events <runId> --json

# View last N events
babysitter run:events <runId> --limit 10 --reverse --json

# Filter by event type
babysitter run:events <runId> --filter-type EFFECT_RESOLVED --json

# Find failures
babysitter run:events <runId> --filter-type RUN_FAILED --json
```

### Task Information

```bash
# List pending tasks
babysitter task:list <runId> --pending --json

# View task details
cat .a5c/runs/<runId>/tasks/<effectId>/task.json | jq .

# View task result
cat .a5c/runs/<runId>/tasks/<effectId>/result.json | jq .
```

### System Checks

```bash
# Check breakpoints service
curl http://localhost:3184/health

# Check SDK version
npx -y @a5c-ai/babysitter-sdk@latest --version

# Check installed packages
npm list -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints

# Check plugin status
claude plugin list | grep babysitter
```

### Journal Analysis

```bash
# Count events by type
jq -s 'group_by(.type) | map({type: .[0].type, count: length})' \
  .a5c/runs/<runId>/journal/*.json

# Find failed tasks
jq 'select(.type == "EFFECT_RESOLVED" and .payload.status == "error")' \
  .a5c/runs/<runId>/journal/*.json

# Check quality scores
jq 'select(.type == "QUALITY_SCORE") | {iteration: .payload.iteration, score: .payload.score}' \
  .a5c/runs/<runId>/journal/*.json
```

---

## When to Contact Support

Contact support if you experience:

1. **Persistent crashes** that cannot be resolved with troubleshooting
2. **Data corruption** that affects the journal or state
3. **Security concerns** about the tool behavior
4. **Bugs** that are reproducible with clear steps

### How to Report Issues

1. **Gather information:**
   - OS and version
   - Node.js version: `node --version`
   - Claude Code version: `claude --version`
   - Babysitter SDK version: `npx @a5c-ai/babysitter-sdk --version`
   - Full error message and stack trace
   - Steps to reproduce

2. **Include diagnostic output:**
   ```bash
   babysitter run:status <runId> --json > diagnostic.json
   babysitter run:events <runId> --limit 50 --reverse --json >> diagnostic.json
   ```

3. **Create issue at:**
   [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)

4. **For discussions:**
   [GitHub Discussions](https://github.com/a5c-ai/babysitter/discussions)

---

## Related Documentation

- [FAQ](./faq.md) - Common questions answered
- [Error Catalog](./error-catalog.md) - Error messages explained
- [Installation Guide](../getting-started/installation.md) - Setup instructions
- [Run Resumption](../features/run-resumption.md) - Recovery procedures

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
