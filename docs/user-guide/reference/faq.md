# Frequently Asked Questions (FAQ)

**Version:** 1.1
**Last Updated:** 2026-01-26
**Category:** Reference

---

## Top 5 Questions (Start Here)

**New to Babysitter?** These are the most common questions from first-time users:

| Question | Quick Answer |
|----------|--------------|
| **What does Babysitter actually do?** | It automates the "try → test → fix → repeat" loop until your code meets quality targets |
| **How do I start?** | Just type `/babysitter:call build a login page` in Claude Code |
| **Do I need to write code?** | No - you use natural language. Babysitter handles the rest |
| **What if something goes wrong?** | Everything is saved automatically. You can always resume or debug |
| **Is it free?** | Babysitter is included with Claude Code - no additional cost |

Still have questions? Browse the full FAQ below, or check the [Troubleshooting guide](./troubleshooting.md).

---

## Table of Contents

- [Getting Started](#getting-started)
- [Installation and Setup](#installation-and-setup)
- [Using Babysitter](#using-babysitter)
- [Breakpoints and Approval](#breakpoints-and-approval)
- [Quality Convergence](#quality-convergence)
- [Sessions and Resumption](#sessions-and-resumption)
- [Process Definitions](#process-definitions)
- [Performance and Optimization](#performance-and-optimization)
- [Security and Compliance](#security-and-compliance)
- [Troubleshooting](#troubleshooting-faq)

---

## Getting Started

### What is Babysitter?

Babysitter is an event-sourced orchestration framework for Claude Code that enables deterministic, resumable, and human-in-the-loop workflow management. It allows you to build complex, multi-step development processes with built-in quality gates, human approval checkpoints, and automatic iteration until quality targets are met.

**Key features:**
- Structured multi-step workflows
- Human approval checkpoints (breakpoints)
- Iterative quality convergence
- Complete audit trails
- Session persistence and resumability

See: [README](../../../README.md)

---

### What is the difference between Babysitter and regular Claude Code?

| Feature | Regular Claude Code | With Babysitter |
|---------|---------------------|-----------------|
| Session persistence | Lost on restart | Event-sourced, resumable |
| Quality iteration | Manual prompting | Automated convergence |
| Approval gates | Chat-based | Structured breakpoints |
| Parallel execution | Sequential only | Built-in parallelism |
| Audit trail | Chat history | Structured journal |

Babysitter adds orchestration capabilities, enabling deterministic workflows with full traceability.

---

### Do I need programming knowledge to use Babysitter?

**No.** You interact with Babysitter using natural language. Simply ask Claude to use the babysitter skill:

```
Use the babysitter skill to implement user authentication with TDD
```

Or use the slash command:

```
/babysitter:call implement user authentication with TDD
```

However, creating custom process definitions does require JavaScript/TypeScript knowledge.

See: [Getting Started](../getting-started/quickstart.md)

---

### Can I use Babysitter with other AI tools?

Babysitter is specifically designed for Claude Code. The orchestration framework integrates with Claude Code's plugin system and skill infrastructure. While the underlying concepts could be adapted, Babysitter is not currently directly compatible with other AI coding assistants.

---

### What types of tasks is Babysitter best suited for?

Babysitter excels at:

- **Feature development** with TDD and quality gates
- **Code refactoring** with iterative improvement
- **Multi-phase workflows** requiring human approval
- **Complex tasks** spanning multiple files or components
- **Team workflows** requiring audit trails and approvals

For simple, one-off tasks, using Claude Code directly may be faster.

---

## Installation and Setup

### What are the prerequisites for Babysitter?

**Required:**
- Node.js 20.0.0+ (recommend 22.x LTS)
- Claude Code (latest version)
- npm 8.0.0+

**Optional:**
- Git (for version control)
- ngrok (for remote breakpoint access)
- Telegram (for mobile notifications)
- jq (for CLI output parsing)

See: [Installation Guide](../getting-started/installation.md)

---

### Why do I need three npm packages?

Babysitter has three packages with distinct responsibilities:

1. **@a5c-ai/babysitter** - Core package
2. **@a5c-ai/babysitter-sdk** - Orchestration runtime and CLI
3. **@a5c-ai/babysitter-breakpoints** - Human approval UI service

Install all three:
```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

---

### Why do I need the breakpoints service?

The breakpoints service provides a web UI for human-in-the-loop approval. When workflows reach approval gates, breakpoints appear in the UI for review.

Without the service running, breakpoints will timeout and workflows will fail.

**Start the service:**
```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

**Access the UI:** http://localhost:3184

See: [Breakpoints Guide](../features/breakpoints.md)

---

### Can I run Babysitter offline?

Partially. The SDK and process execution work offline. However:

- **Breakpoints require network access** to the breakpoints service
- **Agent tasks** require API access to Claude

For fully offline use, avoid breakpoints and agent tasks in your process definitions.

---

### How much disk space does Babysitter use?

The `.a5c/runs/` directory stores all run data:

- **Light usage:** 1-5 MB per run
- **Heavy usage:** 50-100 MB per run (with large artifacts)

Monitor disk usage:
```bash
du -sh .a5c/
du -h .a5c/runs/* | sort -h
```

You can safely delete old runs to reclaim space:
```bash
rm -rf .a5c/runs/<old-run-id>
```

---

### How do I update Babysitter?

**Update SDK packages:**
```bash
npm update -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints
```

**Update Claude Code plugin:**
```bash
claude plugin marketplace update a5c.ai
claude plugin update babysitter@a5c.ai
```

**Tip:** Update regularly (daily or weekly) for the latest features and fixes.

---

### Why doesn't the babysit skill appear in /skills?

Common causes and solutions:

1. **Plugin not installed:**
   ```bash
   claude plugin marketplace add a5c-ai/babysitter
   claude plugin install --scope user babysitter@a5c.ai
   ```

2. **Plugin not enabled:**
   ```bash
   claude plugin enable --scope user babysitter@a5c.ai
   ```

3. **Claude Code not restarted:**
   - Close all Claude Code windows
   - Reopen Claude Code

4. **Verify installation:**
   ```bash
   claude plugin list | grep babysitter
   ```

See: [Installation Troubleshooting](../getting-started/installation.md#troubleshooting)

---

## Using Babysitter

### How do I start a new babysitter run?

**Via natural language:**
```
Use the babysitter skill to implement user authentication
```

**Via slash command:**
```
/babysitter:call implement user authentication with TDD
```

**With options:**
```
/babysitter:call implement user authentication --max-iterations 10
```

See: [Quickstart](../getting-started/quickstart.md)

---

### How do I pause a babysitter run?

Simply close Claude Code. The run is automatically saved to the event-sourced journal and can be resumed later.

Babysitter is designed to be resumable at any point.

---

### How do I resume a paused run?

**Via natural language:**
```
Resume the babysitter run for the authentication feature
```

**Via slash command with run ID:**
```
/babysitter:call resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

**Find your run ID:**
```bash
ls -lt .a5c/runs/ | head -10
```

See: [Run Resumption](../features/run-resumption.md)

---

### How do I find my run ID?

The run ID is displayed when you start a workflow:
```
Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Run Directory: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
```

**Ask Claude to find recent runs:**
```
What babysitter runs have I done recently?
```

**Check run status:**
```
What's the status of my babysitter run?
```

---

### Can I run multiple babysitter processes simultaneously?

**Not recommended.** Running multiple babysitter instances in the same directory may cause journal conflicts.

For parallel work:
- Use separate directories
- Use separate runs for independent features
- Wait for one run to complete before starting another in the same directory

---

### What happens if a task fails?

When a task fails, Babysitter:

1. Records the failure in the journal
2. May retry based on configuration
3. Reports the error for debugging

**To investigate:**
```bash
babysitter run:events <runId> --filter-type RUN_FAILED --json
```

**To resume after fixing:**
```
/babysitter:call resume
```

---

### How do I debug a failed run?

1. **Check the journal:**
   ```bash
   cat .a5c/runs/<runId>/journal/journal.jsonl | jq .
   ```

2. **View recent events:**
   ```bash
   babysitter run:events <runId> --limit 10 --reverse --json
   ```

3. **Find the error:**
   ```bash
   babysitter run:events <runId> --filter-type RUN_FAILED --json
   ```

4. **Ask Claude to analyze:**
   ```
   Analyze the babysitter run error for <runId> and diagnose
   ```

See: [Troubleshooting Guide](./troubleshooting.md)

---

## Breakpoints and Approval

### How do breakpoints work?

Breakpoints pause workflow execution for human approval. When a workflow reaches a breakpoint:

1. The workflow pauses
2. A request appears in the breakpoints UI (http://localhost:3184)
3. You review the context and approve/reject
4. The workflow continues after approval

See: [Breakpoints Guide](../features/breakpoints.md)

---

### How do I approve a breakpoint?

1. **Open the breakpoints UI:** http://localhost:3184
2. **Review the request:** Question, title, and context files
3. **Make a decision:** Click **Approve** or **Reject**
4. **Add comments** (optional)
5. **Resume the workflow** if needed

---

### Can I approve breakpoints from my phone?

Yes, with two options:

**Option 1: ngrok tunnel**
```bash
ngrok http 3184
```
Access the UI via the ngrok URL from any device.

**Option 2: Telegram integration**
Configure Telegram in the breakpoints UI at http://localhost:3184. Receive notifications and approve directly in Telegram.

---

### What if a breakpoint times out?

**Symptom:**
```
Waiting for breakpoint approval...
Timeout after 300s
```

**Solution:**
1. Ensure breakpoints service is running
2. Check for pending breakpoints in the UI
3. Approve the breakpoint
4. Resume the run: `/babysitter:call resume --run-id <runId>`

The run state is preserved and can be resumed after approval.

---

### Can I skip breakpoints in CI/CD pipelines?

Yes, use conditional breakpoints:

```javascript
if (process.env.CI !== 'true') {
  await ctx.breakpoint({
    question: 'Approve deployment?',
    title: 'Deployment Review'
  });
}
```

Or implement auto-approval for CI:
```javascript
if (process.env.CI === 'true' && qualityScore >= targetQuality) {
  ctx.log('Auto-approved in CI environment');
} else {
  await ctx.breakpoint({ /* ... */ });
}
```

---

## Quality Convergence

### What is a quality score?

Quality scores are assessments of code quality generated by Babysitter's agent tasks. Scores are based on:

- Test coverage
- Test quality
- Code quality metrics (lint, types)
- Security analysis
- Requirements alignment

Scores range from 0-100.

See: [Quality Convergence](../features/quality-convergence.md)

---

### How do I set a quality target?

Include it in your prompt:

```
Use babysitter with TDD and 85% quality target
```

Or specify in process inputs:
```javascript
const { targetQuality = 85, maxIterations = 5 } = inputs;
```

---

### What if quality score doesn't improve?

**Common causes:**
- Target is unrealistic
- Fundamental issues blocking improvement
- Scoring criteria too strict

**Solutions:**

1. **Review iteration feedback:**
   ```
   What recommendations came from my quality scoring?
   ```

2. **Lower the target:**
   ```
   /babysitter:call continue with 75% quality target
   ```

3. **Increase iterations:**
   ```
   /babysitter:call continue with max 10 iterations
   ```

4. **Review blocking issues:** Check lint errors, test failures, etc.

---

### Can I customize quality scoring?

Yes. Create custom agent tasks with your scoring criteria:

```javascript
export const customScoringTask = defineTask('custom-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Custom quality scoring',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'quality engineer',
      task: 'Score based on our team standards',
      instructions: [
        'Your custom criteria here',
        '...'
      ]
    }
  }
}));
```

---

### How many iterations are typical?

| Workflow Type | Typical Iterations | Maximum Recommended |
|---------------|-------------------|---------------------|
| Simple improvement | 2-3 | 5 |
| Feature development | 3-5 | 10 |
| Complex refactoring | 5-8 | 15 |

Always set iteration limits to prevent runaway loops.

---

## Sessions and Resumption

### How does session resumption work?

Babysitter uses event sourcing:

1. Every action is recorded in the journal
2. On resume, events are replayed to rebuild state
3. Completed tasks return cached results
4. Execution continues from the last pending point

This makes sessions fully resumable regardless of why they ended.

See: [Run Resumption](../features/run-resumption.md)

---

### Is progress lost if Claude Code crashes?

**No.** All progress is preserved in the journal. Resume with:

```
/babysitter:call resume --run-id <runId>
```

---

### Can different team members continue a run?

Yes. Runs are stored in the file system and can be continued by anyone with access:

```
# Developer A starts
/babysitter:call implement feature X

# Developer B continues
/babysitter:call resume the feature X workflow
```

Ensure you share the `.a5c/` directory (e.g., via Git or shared storage).

---

### What happens to pending breakpoints on resume?

Pending breakpoints are preserved. On resume:

1. Babysitter detects the pending breakpoint
2. Checks if it has been approved
3. If approved, continues; if not, waits

Approve breakpoints before resuming, or resume and check the breakpoints UI.

---

## Process Definitions

### What is a process definition?

A process definition is a JavaScript function that orchestrates workflow logic. It defines:

- What tasks to run
- In what order
- With what conditions
- Where to place breakpoints

```javascript
export async function process(inputs, ctx) {
  const plan = await ctx.task(planTask, { feature: inputs.feature });
  await ctx.breakpoint({ question: 'Approve plan?' });
  const result = await ctx.task(implementTask, { plan });
  return result;
}
```

See: [Process Definitions](../features/process-definitions.md)

---

### Can I edit a process definition for a running workflow?

**Not recommended.** Process definitions are associated with runs at creation time. Modifying them during execution may cause unexpected behavior.

For changes, start a new run with the updated process.

---

### What task types are available?

| Type | Use Case | Example |
|------|----------|---------|
| **Agent** | LLM-powered tasks | Planning, scoring |
| **Skill** | Claude Code skills | Code analysis |
| **Node** | JavaScript scripts | Build, test |
| **Shell** | Commands | git, npm |
| **Breakpoint** | Human approval | Review gates |

---

### Can I run tasks in parallel?

Yes, using `ctx.parallel.all()`:

```javascript
const [coverage, lint, security] = await ctx.parallel.all([
  () => ctx.task(coverageTask, {}),
  () => ctx.task(lintTask, {}),
  () => ctx.task(securityTask, {})
]);
```

This significantly speeds up workflows with independent tasks.

See: [Parallel Execution](../features/parallel-execution.md)

---

## Performance and Optimization

### How long do babysitter runs typically take?

| Workflow Type | Expected Duration |
|---------------|-------------------|
| Simple build & test | 30s - 2m |
| TDD feature | 3m - 10m |
| Complex refactoring | 10m - 30m |
| Full application | 30m - 2h |

Duration depends on iteration count, task complexity, and API latency.

---

### How can I speed up my workflows?

1. **Use parallel execution:**
   ```javascript
   await ctx.parallel.all([task1, task2, task3]);
   ```

2. **Set iteration limits:**
   ```
   Use babysitter with max 3 iterations
   ```

3. **Reduce agent task scope:**
   ```javascript
   await ctx.task(analyzeTask, { files: ['specific/file.js'] });
   ```

4. **Lower quality target** for faster convergence

---

### What affects execution time the most?

1. **LLM API latency** - 2-5 seconds per agent call
2. **Iteration count** - More iterations = longer runtime
3. **Task complexity** - Large codebases take longer
4. **Parallel vs sequential** - Parallel can be 4x faster

---

### How do I monitor a running workflow?

Ask Claude for updates:

```
What's the current progress of my babysitter run?
```

```
Show me the recent events in my workflow
```

```
How many iterations have completed?
```

---

## Security and Compliance

### Is my code sent to external services?

Agent tasks use Claude's API, which means:
- Code context is sent to the API for analysis
- No data is stored by the API beyond the session
- Review Anthropic's privacy policy for details

For sensitive code, consider:
- Using shell/node tasks instead of agent tasks
- Running analysis locally
- Reviewing what context is sent to agents

---

### Are credentials safe in Babysitter workflows?

**Best practices:**

1. **Use environment variables:**
   ```javascript
   const apiKey = process.env.API_KEY;
   ```

2. **Never hardcode credentials**

3. **Add `.a5c/` to `.gitignore`**

4. **Review journal before sharing:**
   ```bash
   grep -i "password\|secret\|key" .a5c/runs/*/journal/*.json
   ```

See: [Security Best Practices](../../../README.md#security-best-practices)

---

### Does Babysitter provide audit trails?

Yes. The journal system records:
- Every task execution
- Every breakpoint approval/rejection
- Every state change
- Complete timestamps

**Export audit trail:**
```bash
jq '.' .a5c/runs/<runId>/journal/*.json > audit-report.json
```

See: [Journal System](../features/journal-system.md)

---

### Should I commit the .a5c directory to Git?

**Generally, no.** Add to `.gitignore`:
```
.a5c/
```

Reasons:
- May contain sensitive data
- Can grow large
- State cache is derived, not source

However, you may choose to commit journals for audit purposes if they don't contain sensitive information.

---

## Troubleshooting FAQ

### Where can I find error logs?

Ask Claude to show you the relevant information:

1. **Journal events:**
   ```
   Show me the events in my babysitter run
   ```

2. **Task outputs:**
   ```
   What was the result of the last task in my workflow?
   ```

3. **Run state:**
   ```
   What's the current state of my babysitter run?
   ```

See: [Troubleshooting Guide](./troubleshooting.md)

---

### Why does my run say "waiting" but nothing happens?

**Likely cause:** A breakpoint is pending approval.

**Solution:**
1. Check breakpoints UI: http://localhost:3184
2. Review and approve/reject the breakpoint
3. Resume if needed

**Verify:**
```
Are there any pending breakpoints in my babysitter run?
```

---

### Why is the breakpoints service not accessible?

**Check if running:**
```bash
curl http://localhost:3184/health
```

**If not running, start it:**
```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

**If port is in use:**
```bash
lsof -i :3184
# Kill the process or use a different port
npx @a5c-ai/babysitter-breakpoints start --port 3185
```

---

### How do I report a bug?

1. **Gather information:**
   - OS and version
   - Node.js version
   - Claude Code version
   - Babysitter SDK version
   - Full error message
   - Relevant journal excerpts

2. **Search existing issues:**
   [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)

3. **Create a new issue:**
   Include all gathered information and steps to reproduce.

---

## Need More Help?

- [Troubleshooting Guide](./troubleshooting.md) - Detailed problem-solution reference
- [Error Catalog](./error-catalog.md) - Common error messages explained
- [GitHub Issues](https://github.com/a5c-ai/babysitter/issues) - Report bugs
- [GitHub Discussions](https://github.com/a5c-ai/babysitter/discussions) - Ask questions

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
