# Breakpoints: Human-in-the-Loop Approval

**Version:** 1.2
**Last Updated:** 2026-01-27
**Category:** Feature Guide

---

## In Plain English

**A breakpoint is a pause button.** When the AI reaches a breakpoint, it stops and waits for you to say "OK, continue."

**Why does this matter?**
- The AI writes a plan → pauses → you review it → approve → then it builds
- The AI makes changes → pauses → you check the changes → approve → then it deploys
- You stay in control of important decisions

**How to approve:** Babysitter supports **two modes** for handling breakpoints:

| Mode | How It Works | Best For |
|------|--------------|----------|
| **Interactive** (Default in Claude Code) | Claude asks you directly in the chat using `AskUserQuestion` | Real-time sessions where you're actively working |
| **Non-Interactive** | Open `http://localhost:3184` in your browser to approve | CI/CD pipelines, headless automation, asynchronous review |

**No setup needed for interactive mode!** If you're using Claude Code, breakpoints "just work" - Claude will ask you directly.

---

## Overview

Breakpoints provide human-in-the-loop approval gates within Babysitter workflows. Use breakpoints to pause automated execution at critical decision points, review context files, and make informed approvals before proceeding.

### Two Modes of Operation

Babysitter supports two distinct modes for handling breakpoints:

#### Interactive Mode (Claude Code Sessions)

When running Babysitter within an active Claude Code session, breakpoints are handled **directly in the chat**:

1. Process reaches a breakpoint
2. Claude uses the `AskUserQuestion` tool to present the question
3. You respond in the chat
4. Claude posts your response and the process continues

**Advantages:**
- No external service required
- Immediate, real-time interaction
- Context preserved in conversation

**When it's used:** Automatically when you're in a Claude Code session running `/babysit`

#### Non-Interactive Mode (External/Headless)

When running Babysitter outside Claude Code (CI/CD, scripts, external orchestration), breakpoints use the **breakpoints service**:

1. Process reaches a breakpoint
2. Breakpoint is created in the service via CLI
3. You approve via web UI at `http://localhost:3184`
4. Process continues after approval

**Advantages:**
- Works in headless environments
- Supports asynchronous review workflows
- Team members can approve without terminal access
- Mobile notifications via Telegram

**When it's used:** Automated pipelines, scripts, or when explicitly configured

### Why Use Breakpoints

- **Production Safety**: Require human approval before deploying to production environments
- **Quality Gates**: Review generated plans, specifications, or code before implementation
- **Compliance**: Create audit trails of human approvals for regulated environments
- **Risk Mitigation**: Pause execution when automated decisions carry significant risk
- **Team Collaboration**: Enable asynchronous review workflows across distributed teams

---

## Use Cases and Scenarios

### Scenario 1: Plan Approval Before Implementation

Pause after generating an implementation plan to ensure the approach is correct.

```javascript
export async function process(inputs, ctx) {
  // Generate implementation plan
  const plan = await ctx.task(generatePlanTask, { feature: inputs.feature });

  // Request human approval
  await ctx.breakpoint({
    question: 'Review the implementation plan. Approve to proceed?',
    title: 'Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/plan.md', format: 'markdown' }
      ]
    }
  });

  // Continue only after approval
  const result = await ctx.task(implementTask, { plan });
  return result;
}
```

### Scenario 2: Pre-Deployment Approval

Require sign-off before deploying changes to production.

```javascript
await ctx.breakpoint({
  question: 'Deploy to production?',
  title: 'Production Deployment',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/final-report.md', format: 'markdown' },
      { path: 'artifacts/coverage-report.html', format: 'html' },
      { path: 'artifacts/quality-score.json', format: 'code', language: 'json' }
    ]
  }
});
```

### Scenario 3: Quality Score Review

Allow humans to review quality convergence results and decide whether to continue iteration.

```javascript
if (qualityScore < targetQuality && iteration < maxIterations) {
  await ctx.breakpoint({
    question: `Iteration ${iteration} complete. Quality: ${qualityScore}/${targetQuality}. Continue to iteration ${iteration + 1}?`,
    title: `Iteration ${iteration} Review`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/iteration-${iteration}-report.md`, format: 'markdown' }
      ]
    }
  });
}
```

---

## Step-by-Step Instructions

### Interactive Mode (Claude Code) - No Setup Required

If you're using Claude Code, breakpoints work automatically:

1. Run `/babysit` with your request
2. When a breakpoint is reached, Claude will ask you directly in the chat
3. Answer the question (approve, reject, or provide feedback)
4. The workflow continues

**That's it!** No services to start, no URLs to open.

**Example interaction:**
```
Claude: The implementation plan is ready. Review the plan below:
        [Plan summary...]

        Do you approve this plan to proceed with implementation?

        [Approve] [Reject] [Request Changes]

You: [Click Approve or type your response]

Claude: Plan approved. Proceeding with implementation...
```

### Non-Interactive Mode (Headless/CI/CD)

For automated pipelines or when running without an active Claude Code session:

#### Step 1: Start the Breakpoints Service

Start the breakpoints service before running workflows that contain breakpoints.

```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

The service runs at:
- **Web UI**: http://localhost:3184
- **API**: http://localhost:3185

#### Step 2: Add Breakpoints to Your Process

Use `ctx.breakpoint()` in your process definition to create approval gates.

**Basic breakpoint:**

```javascript
await ctx.breakpoint({
  question: 'Approve the changes?',
  title: 'Review Required'
});
```

**Breakpoint with context files:**

```javascript
await ctx.breakpoint({
  question: 'Approve the implementation plan?',
  title: 'Plan Approval',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/plan.md', format: 'markdown' },
      { path: 'code/main.js', format: 'code', language: 'javascript' },
      { path: 'inputs.json', format: 'code', language: 'json' }
    ]
  }
});
```

#### Step 3: Run Your Workflow

Execute your workflow using the babysitter skill or CLI.

```bash
# In Claude Code (interactive mode - no breakpoints service needed)
claude "/babysitter:call implement user authentication with breakpoint approval"

# Or for non-interactive/headless execution
babysitter run:iterate .a5c/runs/<runId> --json
```

#### Step 4: Review and Approve (Non-Interactive Mode)

When the workflow reaches a breakpoint in non-interactive mode:

1. **Open the Web UI**: Navigate to http://localhost:3184 in your browser
2. **Review Context**: Examine the question, title, and any attached context files
3. **Make a Decision**: Click **Approve** to continue or **Reject** to halt the workflow
4. **Add Comments** (optional): Provide feedback that will be recorded in the run journal

#### Step 5: Resume Workflow

After approval, the workflow automatically continues from where it paused.

---

## Configuration Options

### Breakpoint Payload Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | The question presented to the reviewer |
| `title` | string | No | A short title for the breakpoint |
| `context` | object | No | Additional context for the reviewer |
| `context.runId` | string | No | The run ID for linking context files |
| `context.files` | array | No | Array of files to display for review |

### Context File Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Relative path to the file within the run directory |
| `format` | string | Yes | File format: `markdown`, `html`, `code`, `text` |
| `language` | string | No | Programming language for syntax highlighting (when format is `code`) |

### External Access Configuration

**Using ngrok for remote access:**

```bash
ngrok http 3184
```

**Using Telegram for mobile notifications:**

Configure Telegram integration through the breakpoints UI at http://localhost:3184.

---

## Code Examples and Best Practices

### Example 1: Conditional Breakpoints

Only request approval when certain conditions are met.

```javascript
export async function process(inputs, ctx) {
  const analysis = await ctx.task(analyzeTask, { code: inputs.code });

  // Only request approval for high-risk changes
  if (analysis.riskLevel === 'high') {
    await ctx.breakpoint({
      question: `High-risk changes detected (${analysis.riskFactors.join(', ')}). Approve to proceed?`,
      title: 'High-Risk Change Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/risk-analysis.md', format: 'markdown' }
        ]
      }
    });
  }

  return await ctx.task(applyChangesTask, { changes: analysis.changes });
}
```

### Example 2: Multi-Stage Approval Workflow

Implement multiple approval gates for different phases.

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Design
  const design = await ctx.task(designTask, inputs);

  await ctx.breakpoint({
    question: 'Approve the design?',
    title: 'Design Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/design.md', format: 'markdown' }] }
  });

  // Phase 2: Implementation
  const implementation = await ctx.task(implementTask, { design });

  await ctx.breakpoint({
    question: 'Approve the implementation?',
    title: 'Implementation Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/implementation.md', format: 'markdown' }] }
  });

  // Phase 3: Deployment
  await ctx.breakpoint({
    question: 'Approve deployment to production?',
    title: 'Deployment Approval',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/deployment-checklist.md', format: 'markdown' }] }
  });

  return await ctx.task(deployTask, { implementation });
}
```

### Example 3: Breakpoints with Quality Gates

Combine breakpoints with quality scoring for informed decisions.

```javascript
const qualityScore = await ctx.task(agentQualityScoringTask, {
  tests: testsResult,
  implementation: implementationResult,
  coverage: coverageResult
});

await ctx.breakpoint({
  question: `Quality score: ${qualityScore.overallScore}/100. ${qualityScore.summary}. Approve for merge?`,
  title: 'Final Quality Review',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/quality-report.md', format: 'markdown' },
      { path: 'artifacts/coverage-report.html', format: 'html' }
    ]
  }
});
```

### Best Practices

1. **Write Clear Questions**: Make the question specific and actionable
2. **Provide Sufficient Context**: Include all files necessary for making an informed decision
3. **Use Descriptive Titles**: Help reviewers quickly understand what they are approving
4. **Place Strategically**: Add breakpoints before irreversible actions
5. **Minimize Unnecessary Approvals**: Too many breakpoints slow down workflows

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Breakpoint Not Resolving

**Symptom:**
```
Waiting for breakpoint approval...
Timeout after 300s
```

**Causes (Interactive Mode):**
- Session timeout or disconnection
- Missed the question in the chat

**Solution (Interactive Mode):**
1. Scroll up in your Claude Code conversation to find the question
2. If the session timed out, resume the run: `claude "Resume the babysitter run"`

**Causes (Non-Interactive Mode):**
- Breakpoints service not running
- Service not accessible from the network

**Solution (Non-Interactive Mode):**

1. Verify the service is running:
   ```bash
   curl http://localhost:3184/health
   ```

2. Start the service if not running:
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start
   ```

3. Check ngrok tunnel if using remote access:
   ```bash
   ngrok http 3184
   ```

### Pitfall 2: Context Files Not Displaying

**Symptom:** Breakpoint appears in UI but context files are missing or empty.

**Causes:**
- Incorrect file paths in the context configuration
- Files not yet written when breakpoint triggered

**Solution:**

1. Ensure files are written before calling `ctx.breakpoint()`:
   ```javascript
   await ctx.task(writeArtifactTask, { content: plan, path: 'artifacts/plan.md' });
   await ctx.breakpoint({ /* ... */ });
   ```

2. Verify file paths are relative to the run directory:
   ```javascript
   { path: 'artifacts/plan.md', format: 'markdown' }  // Correct
   { path: '/absolute/path/plan.md', format: 'markdown' }  // Incorrect
   ```

### Pitfall 3: Breakpoint Blocking CI/CD Pipelines

**Symptom:** CI/CD job hangs waiting for manual approval.

**Cause:** Automated pipelines cannot interact with breakpoints requiring human input.

**Solution:**

1. Use conditional breakpoints that only trigger in non-CI environments:
   ```javascript
   if (process.env.CI !== 'true') {
     await ctx.breakpoint({ /* ... */ });
   }
   ```

2. Implement auto-approval for CI with appropriate safeguards:
   ```javascript
   if (process.env.CI === 'true' && qualityScore >= targetQuality) {
     ctx.log('Auto-approved in CI environment');
   } else {
     await ctx.breakpoint({ /* ... */ });
   }
   ```

### Pitfall 4: Session Timeout During Long Reviews

**Symptom:** Workflow fails or loses state while waiting for lengthy review.

**Solution:**

- Babysitter workflows are fully resumable. If a session times out:
  ```bash
  claude "Resume the babysitter run and continue"
  ```

- The breakpoint state is preserved in the journal and will be restored on resume.

---

## Related Documentation

- [Process Definitions](./process-definitions.md) - Learn how to create workflows with breakpoints
- [Run Resumption](./run-resumption.md) - Resume workflows after breakpoint approval
- [Journal System](./journal-system.md) - Understand how breakpoint events are recorded
- [Best Practices](./best-practices.md) - Patterns for strategic breakpoint placement and workflow design

---

## Summary

Breakpoints enable human-in-the-loop approval within automated workflows. Use them strategically to ensure human oversight at critical decision points while maintaining the benefits of automation.

### Quick Reference: Which Mode to Use?

| Scenario | Mode | Setup Required |
|----------|------|----------------|
| Using Claude Code interactively | Interactive | None |
| CI/CD pipeline | Non-Interactive | Start breakpoints service |
| Headless/scripted automation | Non-Interactive | Start breakpoints service |
| Team review workflows | Non-Interactive | Start breakpoints service |
| Mobile notifications needed | Non-Interactive | Breakpoints service + Telegram |

**For most Claude Code users:** Just use `/babysit` - breakpoints work automatically in the chat. No setup needed!

**For automation/CI/CD:** Start the breakpoints service and configure the breakpoints web UI, ngrok tunneling, or Telegram integration for your team's needs.
