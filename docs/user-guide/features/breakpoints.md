# Breakpoints: Human-in-the-Loop Approval

**Version:** 3.0
**Last Updated:** 2026-03-30
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

Breakpoints provide human-in-the-loop approval gates within Babysitter workflows. Use `ctx.breakpoint()` to pause automated execution at critical decision points, present context to the user, and make informed approvals before proceeding. The call returns a `BreakpointResult` object containing the reviewer's decision and any feedback provided.

### How Breakpoints Work

When running Babysitter within a Claude Code session, breakpoints are handled **directly in the chat**:

1. Process reaches a `ctx.breakpoint()` call
2. Claude uses the `AskUserQuestion` tool to present the question
3. You respond in the chat (approve, reject, or provide feedback)
4. Claude posts your response and the process continues
5. The call resolves with a `BreakpointResult` containing your decision

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
  const review = await ctx.breakpoint({
    question: 'Review the implementation plan. Approve to proceed?',
    title: 'Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/plan.md', format: 'markdown' }
      ]
    }
  });

  if (!review.approved) {
    return { success: false, reason: review.feedback };
  }

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
const result = await ctx.breakpoint({
  question: 'Approve the changes?',
  title: 'Review Required'
});
// result.approved — boolean indicating approval
// result.feedback — optional reviewer feedback
```

**Breakpoint with rejection handling:**

```javascript
const result = await ctx.breakpoint({
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

if (!result.approved) {
  // Handle rejection — use result.feedback for reviewer's reasoning
  ctx.log('Plan rejected', { feedback: result.feedback });
  return { success: false, reason: result.feedback };
}
```

> **Backward compatibility:** Existing processes that do not capture the return value (`await ctx.breakpoint(...)`) continue to work without changes.

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

### BreakpointResult Interface

`ctx.breakpoint()` returns `Promise<BreakpointResult>` with the following fields:

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `approved` | boolean | Yes | Whether the reviewer approved the breakpoint |
| `response` | string | No | The reviewer's raw response text |
| `feedback` | string | No | Structured feedback from the reviewer |
| `option` | string | No | The selected option when multiple choices are presented |
| `respondedBy` | string | No | Identifier of the person who responded |
| `allResponses` | array | No | All responses collected (for `collect-all` or `quorum` strategies) |
| `[key: string]` | unknown | No | Additional custom fields from the resolution |

### Breakpoint Payload Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | The question presented to the reviewer |
| `title` | string | No | A short title for the breakpoint |
| `context` | object | No | Additional context for the reviewer |
| `context.runId` | string | No | The run ID for linking context files |
| `context.files` | array | No | Array of files to display for review |
| `expert` | string \| string[] | No | Domain expert(s) to route to, or `'owner'` for the project owner |
| `tags` | string[] | No | Categorization tags for the breakpoint |
| `strategy` | string | No | Resolution strategy: `'single'` (default), `'first-response-wins'`, `'collect-all'`, or `'quorum'` |
| `previousFeedback` | string | No | Feedback from a prior rejection (used for retry context) |
| `attempt` | number | No | Current retry attempt number |

### Breakpoint Routing

Breakpoint routing controls who receives the approval request and how responses are collected.

**Expert routing** directs the breakpoint to specific reviewers:

```javascript
await ctx.breakpoint({
  question: 'Review the security audit results?',
  title: 'Security Review',
  expert: 'security-team',  // Route to a specific expert
  tags: ['security', 'audit'],
});
```

Route to multiple experts:

```javascript
await ctx.breakpoint({
  question: 'Approve the architecture changes?',
  title: 'Architecture Review',
  expert: ['tech-lead', 'architect'],  // Route to multiple experts
  tags: ['architecture', 'design'],
});
```

Route to the project owner:

```javascript
await ctx.breakpoint({
  question: 'Approve the release?',
  title: 'Release Approval',
  expert: 'owner',  // Route to the project owner
});
```

**Resolution strategies** control how multiple responses are handled:

| Strategy | Description |
|----------|-------------|
| `single` | Default. One reviewer responds. |
| `first-response-wins` | First response from any expert is accepted. |
| `collect-all` | Waits for all experts to respond. Results available in `result.allResponses`. |
| `quorum` | Waits for a majority of experts to respond. |

```javascript
const result = await ctx.breakpoint({
  question: 'Approve production deployment?',
  title: 'Production Deployment',
  expert: ['tech-lead', 'ops-lead', 'security-lead'],
  strategy: 'quorum',
});
// result.approved — true if a quorum approved
// result.respondedBy — who responded
// result.allResponses — all collected responses
```

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
    const review = await ctx.breakpoint({
      question: `High-risk changes detected (${analysis.riskFactors.join(', ')}). Approve to proceed?`,
      title: 'High-Risk Change Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/risk-analysis.md', format: 'markdown' }
        ]
      }
    });

    if (!review.approved) {
      return { success: false, reason: 'High-risk changes rejected', feedback: review.feedback };
    }
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

### Example 4: Robust Rejection Pattern (Retry on Rejection)

Breakpoints should never fail a process. When a reviewer rejects, retry with their feedback incorporated. Always use a clean question string (no ternary operators in the question text).

```javascript
export async function process(inputs, ctx) {
  const plan = await ctx.task(generatePlanTask, { feature: inputs.feature });

  let approved = false;
  let attempt = 0;
  let previousFeedback = undefined;

  while (!approved) {
    attempt++;

    // Refine plan if we have feedback from a prior rejection
    if (previousFeedback) {
      await ctx.task(refinePlanTask, {
        plan,
        feedback: previousFeedback,
      });
    }

    const question = previousFeedback
      ? `Plan revised based on your feedback. Please review again.`
      : `Review the implementation plan. Approve to proceed?`;

    const review = await ctx.breakpoint({
      question,
      title: 'Plan Review',
      previousFeedback,
      attempt,
      context: {
        runId: ctx.runId,
        files: [{ path: 'artifacts/plan.md', format: 'markdown' }],
      },
    });

    if (review.approved) {
      approved = true;
    } else {
      previousFeedback = review.feedback;
      ctx.log(`Plan rejected (attempt ${attempt})`, { feedback: review.feedback });
    }
  }

  return await ctx.task(implementTask, { plan });
}
```

**Key principles for the robust rejection pattern:**
- Breakpoints NEVER fail the process -- always loop and retry
- Pass `previousFeedback` and `attempt` so reviewers have context
- Use the feedback to refine the work before the next review
- Keep the question string clean and readable (no ternary in the question itself)

### Best Practices

1. **Write Clear Questions**: Make the question specific and actionable
2. **Provide Sufficient Context**: Include all files necessary for making an informed decision
3. **Use Descriptive Titles**: Help reviewers quickly understand what they are approving
4. **Place Strategically**: Add breakpoints before irreversible actions
5. **Minimize Unnecessary Approvals**: Too many breakpoints slow down workflows
6. **Ensure Files Exist**: Write context files before calling the breakpoint
7. **Use Routing for Team Workflows**: Set `expert` and `strategy` to direct breakpoints to the right people
8. **Never Fail on Rejection**: Use the robust rejection pattern to retry with feedback instead of failing the process

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
- Returns a `BreakpointResult` with `approved`, `response`, `feedback`, `option`, `respondedBy`, and `allResponses` fields
- Use `result.approved` to branch on approval/rejection
- Route breakpoints to specific experts with `expert` and control resolution with `strategy`
- Use `previousFeedback` and `attempt` for retry context on rejection
- Breakpoints should never fail a process -- use the robust rejection pattern to retry with feedback
- Claude presents the question directly in the chat via `AskUserQuestion`
- You respond to approve, reject, or provide feedback
- The workflow continues based on your response
- No external services or setup required - breakpoints work in-session
- Backward compatible: existing code that ignores the return value still works
