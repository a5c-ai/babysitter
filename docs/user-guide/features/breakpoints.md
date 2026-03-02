# Breakpoints: Human-in-the-Loop Approval

**Version:** 2.0
**Last Updated:** 2026-02-03
**Category:** Feature Guide

---

## In Plain English

**A breakpoint is a pause button.** When your workflow reaches a breakpoint, it stops and waits for you to say "OK, continue."

**Why does this matter?**
- The AI writes a plan → pauses → you review it → approve → then it builds
- The AI makes changes → pauses → you check the changes → approve → then it deploys
- You stay in control of important decisions

**How it works:** When a breakpoint is reached, Claude asks you directly in the chat using the `AskUserQuestion` tool. You respond, and the workflow continues.

**No setup required!** Breakpoints work out of the box in Claude Code sessions.

---

## Overview

Breakpoints provide human-in-the-loop approval gates within Babysitter workflows. Use `ctx.breakpoint()` to pause automated execution at critical decision points, present context to the user, and make informed approvals before proceeding.

### How Breakpoints Work

When running Babysitter within a Claude Code session, breakpoints are handled **directly in the chat**:

1. Process reaches a `ctx.breakpoint()` call
2. Claude uses the `AskUserQuestion` tool to present the question
3. You respond in the chat (approve, reject, or provide feedback)
4. Claude posts your response and the process continues

**Key benefits:**
- No external services required
- Immediate, real-time interaction
- Context preserved in conversation
- Simple API - just call `ctx.breakpoint()`

### Why Use Breakpoints

- **Production Safety**: Require human approval before deploying to production environments
- **Quality Gates**: Review generated plans, specifications, or code before implementation
- **Compliance**: Create audit trails of human approvals for regulated environments
- **Risk Mitigation**: Pause execution when automated decisions carry significant risk
- **Informed Decisions**: Present context files so reviewers have all necessary information

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

## Using Breakpoints

### Basic Usage

Add breakpoints to your process definition using `ctx.breakpoint()`:

**Simple breakpoint:**

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

### Interactive Approval Flow

When your workflow reaches a breakpoint:

1. Claude presents the question directly in the chat
2. Context files are displayed for your review
3. You respond with your decision (approve, reject, or provide feedback)
4. The workflow continues based on your response

**Example interaction:**
```
Claude: The implementation plan is ready. Review the plan below:
        [Plan summary...]

        Do you approve this plan to proceed with implementation?

You: Yes, looks good. Proceed with implementation.

Claude: Plan approved. Proceeding with implementation...
```

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
6. **Ensure Files Exist**: Write context files before calling the breakpoint

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Session Timeout During Review

**Symptom:** Workflow fails or loses state while waiting for lengthy review.

**Solution:**

Babysitter workflows are fully resumable. If a session times out:
```
Claude "Resume the babysitter run and continue"
```

The breakpoint state is preserved in the journal and will be restored on resume.

### Pitfall 2: Context Files Not Displaying

**Symptom:** Breakpoint appears but context files are missing or empty.

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

### Pitfall 3: Breakpoints in Automated Pipelines

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

### Pitfall 4: Missed Breakpoint Question

**Symptom:** Workflow appears stuck, but no question was seen.

**Solution:**
1. Scroll up in your Claude Code conversation to find the question
2. If the session timed out, resume the run

---

## Related Documentation

- [Process Definitions](./process-definitions.md) - Learn how to create workflows with breakpoints
- [Run Resumption](./run-resumption.md) - Resume workflows after breakpoint approval
- [Journal System](./journal-system.md) - Understand how breakpoint events are recorded
- [Best Practices](./best-practices.md) - Patterns for strategic breakpoint placement and workflow design

---

## Summary

Breakpoints enable human-in-the-loop approval within automated workflows. Use `ctx.breakpoint()` to pause execution at critical decision points, present context to the user, and ensure human oversight before proceeding.

**Key points:**
- Call `ctx.breakpoint()` with a question and optional context files
- Claude presents the question directly in the chat via `AskUserQuestion`
- You respond to approve, reject, or provide feedback
- The workflow continues based on your response
- No external services or setup required - breakpoints work in-session
