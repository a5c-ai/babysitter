# Advanced Babysitter Patterns - Agent/Skill Execution and Iterative Convergence

**Date:** 2026-01-19
**Added to:** SKILL.md Section 3.7 Common Patterns

---

## Summary

Added three new advanced patterns to the babysitter skill documentation:

1. **Pattern 5:** Agent-based execution (LLM-powered tasks)
2. **Pattern 6:** Skill-based execution (Claude Code skill invocation)
3. **Pattern 7:** Complex iterative convergence with scoring

These patterns demonstrate sophisticated orchestration capabilities beyond basic task execution.

---

## Pattern 5: Agent-Based Execution

### Concept

Tasks can have `kind: "agent"` to invoke agentic tasks. The orchestrator routes these to the appropriate agent runtime.

### TaskDef Structure

```javascript
{
  kind: "agent",
  title: "Agentic code review",
  description: "Code review using an agent",

  agent: {
    name: "code-reviewer",         // The sub-agent name (not the runtime)
    prompt: {                       // Structured prompt as JSON for clarity
      role: "senior code reviewer",
      task: "Analyze code for quality, security, and best practices",
      context: {
        diff: "...",
        files: [...]
      },
      instructions: [
        "Review each file",
        "Identify issues by severity",
        "Provide suggestions"
      ],
      outputFormat: "Structured JSON with summary and issues"
    },
    outputSchema: {                 // Optional structured output schema
      type: "object",
      properties: { ... }
    }
  },

  io: {
    inputJsonPath: "...",
    outputJsonPath: "..."
  },

  labels: ["agent", "code-review"]
}
```

### Key Features

- **Structured prompts:** Single JSON-structured prompt (role, task, context, instructions, outputFormat)
- **Sub-agent name:** Identifies the specific agent to use (e.g., "code-reviewer", "quality-scorer")
- **Output schema:** Enforce structured JSON output via schema
- **Metadata-driven:** Agent doesn't need to be installed locally - orchestrator handles dispatch

### Example Use Case

Code review agent that:
1. Receives diff and file list
2. Analyzes for quality, security, best practices
3. Returns structured review with issues categorized by severity
4. Process can check for critical issues and breakpoint if found

### Why This Matters

Agents are **just tasks** - no special API needed. Process code treats agent execution the same as any other task:

```javascript
const review = await ctx.task(codeReviewAgentTask, {
  diffContent: inputs.diff
});
```

---

## Pattern 6: Skill-Based Execution

### Concept

Tasks can have `kind: "skill"` to invoke Claude Code skills. Useful for reusing specialized skills within orchestrated workflows.

### TaskDef Structure

```javascript
{
  kind: "skill",
  title: "Analyze with skill",
  description: "Use specialized skill",

  skill: {
    name: "codebase-analyzer",    // Skill identifier
    context: {                     // Structured context with instructions
      scope: "src/",
      depth: "detailed",
      targetFiles: [...],
      analysisType: "consistency",
      criteria: ["Code consistency", "Naming conventions"],
      instructions: [               // Instructions for the skill
        "Scan specified paths",
        "Check consistency",
        "Analyze patterns",
        "Generate report"
      ]
    }
  },

  io: {
    inputJsonPath: "...",
    outputJsonPath: "..."
  },

  labels: ["skill", "analysis"]
}
```

### Key Features

- **Skill invocation:** Call existing skills as tasks
- **Argument passing:** String args + structured context
- **Reusability:** Skills can be composed into larger workflows
- **Metadata-driven:** Skill name + context is all that's needed

### Example Use Case

Invoke a codebase analyzer skill to:
1. Scan specific file paths
2. Check consistency against criteria
3. Return structured analysis results
4. Process can aggregate results from multiple skill invocations

### Why This Matters

Skills become **composable building blocks**. A workflow can orchestrate multiple skills:

```javascript
const analysis1 = await ctx.task(analyzeSkillTask, { scope: "api/" });
const analysis2 = await ctx.task(analyzeSkillTask, { scope: "ui/" });
const combined = mergeAnalyses(analysis1, analysis2);
```

---

## Pattern 7: Complex Iterative Convergence with Scoring

### Concept

Multi-step process where each iteration:
1. **Analyzes** current state
2. **Scores** quality against criteria (using agent)
3. **Improves** based on recommendations (using agent)
4. **Verifies** improvements
5. **Loops** until convergence (score >= threshold)

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Iterative Convergence Loop                     │
│                                                  │
│  ┌──────────┐     ┌──────────┐                 │
│  │ Analyze  │ --> │  Score   │ (agent-based)   │
│  │ (node)   │     │ (0-100)  │                 │
│  └──────────┘     └────┬─────┘                 │
│                        │                        │
│                 [score >= threshold?]           │
│                   │           │                 │
│                  YES         NO                 │
│                   │           │                 │
│              ┌────┴───┐  ┌───┴─────┐           │
│              │ Return │  │ Improve │ (agent)   │
│              └────────┘  └────┬────┘           │
│                               │                 │
│                          ┌────┴────┐           │
│                          │ Verify  │ (node)    │
│                          └────┬────┘           │
│                               │                 │
│                          [passed?]              │
│                          │      │               │
│                         YES    NO               │
│                          │      │               │
│                     [loop]  [breakpoint]        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Key Features

1. **Score-based convergence:** Clear threshold (e.g., 85/100)
2. **Multi-criteria evaluation:** Agent evaluates against 5+ criteria
3. **Safety mechanisms:**
   - `maxIterations` prevents infinite loops
   - Breakpoint if minimal improvement (< 5 points)
   - Breakpoint if verification fails
   - Breakpoint if max iterations reached
4. **Progress tracking:** `history` array records each iteration
5. **Labeled tasks:** Each task labeled with iteration number for traceability
6. **Agent-based scoring:** LLM evaluates subjective quality
7. **Structured output:** Agent returns scores with justifications

### Example Iteration Flow

**Iteration 1:**
```
Analyze → Score: 45/85 → Improve → Verify → Loop
```

**Iteration 2:**
```
Analyze → Score: 62/85 → Improve → Verify → Loop
```

**Iteration 3:**
```
Analyze → Score: 68/85 (improvement only +6)
         ↓
    [Breakpoint: "Minimal improvement detected"]
         ↓
    Human reviews → Continues
```

**Iteration 4:**
```
Analyze → Score: 87/85 ✓ Converged!
```

### Breakpoint Strategy

Smart breakpoints prevent wasted iterations:

1. **Minimal improvement:** `< 5 points` triggers review
   - Prevents oscillation
   - Human can adjust criteria or accept current state

2. **Verification failure:** Improvements break tests
   - Human reviews what went wrong
   - Can rollback or fix

3. **Max iterations:** Didn't converge in time
   - Human decides: accept or continue with more iterations
   - Prevents infinite loops

### History Tracking

Each iteration records:
```javascript
{
  iteration: 3,
  score: 68,
  analysis: { ... },
  scoring: {
    overallScore: 68,
    criteriaScores: [
      { criterion: "Best practices", score: 75, justification: "..." },
      { criterion: "Edge cases", score: 60, justification: "..." },
      ...
    ],
    recommendations: ["Add null checks", "Improve error messages"]
  },
  improvements: {
    changesMade: ["Added null checks in api.js", ...],
    filesModified: ["api.js", "utils.js"]
  },
  verification: {
    passed: true
  }
}
```

This enables:
- **Debugging:** See exactly what happened each iteration
- **Auditing:** Full trail of decisions and changes
- **Learning:** Analyze convergence patterns

### Agent-Based Scoring

The `scoreTask` uses an agent to evaluate quality:

**Agent Prompt (structured JSON):**
```json
{
  "role": "quality scorer",
  "task": "Evaluate the code against criteria and return a score 0-100",
  "context": {
    "analysis": { ... },
    "criteria": [
      "Code follows best practices",
      "All edge cases handled",
      "Error handling comprehensive",
      "Documentation clear",
      "Performance optimized"
    ],
    "iteration": 3
  },
  "instructions": [
    "Review the analysis results",
    "Score each criterion from 0-100",
    "Provide justification for each score",
    "Calculate overall score (average of criteria scores)",
    "Generate actionable recommendations for improvement"
  ],
  "outputFormat": "JSON with overallScore, criteriaScores array, and recommendations array"
}
```

**Output (structured):**
```json
{
  "overallScore": 68,
  "criteriaScores": [
    {
      "criterion": "Code follows best practices",
      "score": 75,
      "justification": "Good use of async/await, but some magic numbers"
    },
    {
      "criterion": "All edge cases handled",
      "score": 60,
      "justification": "Missing null checks in 3 locations"
    },
    ...
  ],
  "recommendations": [
    "Add null checks in parseInput(), handleRequest(), formatOutput()",
    "Extract magic numbers to named constants",
    "Add JSDoc comments for public API"
  ]
}
```

### Why This Pattern Matters

**Real-world applicability:**
- Code quality improvement
- Design iteration
- Content refinement
- Test coverage optimization
- Performance tuning

**Deterministic + Subjective:**
- Combines objective verification (tests pass)
- With subjective evaluation (code quality)
- Agent provides consistency in scoring

**Resumable:**
- Each iteration is event-sourced
- Can pause and resume
- Full audit trail of convergence

**Safe:**
- Multiple safety mechanisms
- Human oversight at key decision points
- No infinite loops

---

## Integration Examples

### Combining Patterns

You can combine these patterns in sophisticated ways:

**Example: Multi-phase improvement with agent review**

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Automated analysis
  const staticAnalysis = await ctx.task(analyzeTask, inputs);

  // Phase 2: Agent-based code review
  const agentReview = await ctx.task(codeReviewAgentTask, {
    analysis: staticAnalysis,
    files: inputs.files
  });

  // Phase 3: Skill-based specialized check
  const securityCheck = await ctx.task(securitySkillTask, {
    scope: inputs.target,
    findings: agentReview.issues
  });

  // Phase 4: Iterative improvement if issues found
  if (securityCheck.criticalIssues.length > 0) {
    await ctx.breakpoint({
      reason: "Critical security issues",
      issues: securityCheck.criticalIssues,
      question: "Start iterative improvement?"
    });

    // Run convergence loop (Pattern 7)
    const improvement = await ctx.task(iterativeImprovementTask, {
      issues: securityCheck.criticalIssues,
      threshold: 90
    });

    return improvement;
  }

  return { ok: true, review: agentReview };
}
```

This combines:
- Node task (static analysis)
- Agent task (code review)
- Skill task (security check)
- Iterative convergence (improvement loop)
- Breakpoints (human approval)

---

## Task Kind Reference

Based on these patterns, here are the task `kind` values:

| Kind | Description | Executor |
|------|-------------|----------|
| `node` | Node.js script | Local node process |
| `agent` | LLM-powered agent | Agent runtime (Claude Code, etc.) |
| `skill` | Claude Code skill | Skill system |
| `breakpoint` | Human intervention | UI/CLI |
| `sleep` | Time gate | Scheduler |
| `orchestrator_task` | Orchestrator-internal | Orchestrator |

All task kinds use the same `ctx.task()` API - the orchestrator routes based on `kind`.

---

## Best Practices

### When to Use Agent Tasks

✅ **Good use cases:**
- Code review and analysis
- Documentation generation
- Test case generation
- Refactoring suggestions
- Design feedback

❌ **Avoid for:**
- Simple data transformation (use node task)
- Deterministic computation (use node task)
- File I/O operations (use node task)

### When to Use Skill Tasks

✅ **Good use cases:**
- Reusing existing skills in workflows
- Composing multiple specialized tools
- Delegating complex multi-step work

❌ **Avoid for:**
- Simple operations (write new task)
- When you need full control (use node/agent)

### When to Use Iterative Convergence

✅ **Good use cases:**
- Quality improvement loops
- Multi-criteria optimization
- Refinement processes
- Test-driven development

❌ **Avoid for:**
- One-shot operations
- Deterministic algorithms
- Simple validation

---

## Summary

These three patterns extend babysitter's capabilities:

1. **Agent tasks** - LLM-powered work with structured I/O
2. **Skill tasks** - Composable skill invocation
3. **Iterative convergence** - Score-based improvement loops with safety mechanisms

All patterns use the same SDK API (`ctx.task()`), maintaining consistency while enabling sophisticated workflows.
