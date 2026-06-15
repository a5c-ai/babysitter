# Advanced Babysitter Patterns - Agent/Skill Execution and Iterative Convergence

**Date:** 2026-01-19
**Added to:** SKILL.md Section 3.7 Common Patterns

---

## Summary

Added six advanced patterns to the babysitter skill documentation:

1. **Pattern 5:** Agent-based execution (LLM-powered tasks)
2. **Pattern 6:** Skill-based execution (Claude Code skill invocation)
3. **Pattern 7:** Complex iterative convergence with scoring
4. **Pattern 8:** Smoke E2E verification gate (runtime reality check)
5. **Pattern 9:** Runtime call-path tracing (confirm live paths before modifying code)
6. **Pattern 10:** Cycle-aware multi-point verification (baseline + post-cycle health checks for patched scheduled components)

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

### Breakpoint Routing

Breakpoints support routing fields to control who receives them and how responses are collected:

```javascript
const approval = await ctx.breakpoint({
  question: "Review the security audit results?",
  options: ["Approve", "Request changes"],
  expert: "security-reviewer",       // route to a specific domain expert
  tags: ["security", "audit"],       // categorization tags for filtering
  strategy: "first-response-wins",   // collect strategy (single | first-response-wins | collect-all | quorum)
});
```

Use `expert: 'owner'` to route back to the run requester. The `strategy` field is only meaningful when `expert !== 'owner'`.

### Breakpoint Rejection Handling — Retry/Refine Pattern

Processes must ALWAYS loop back on rejection, never fail. Use `previousFeedback` and `attempt` fields to track retry state:

```javascript
let lastFeedback = null;
for (let attempt = 0; attempt < 3; attempt++) {
  if (lastFeedback) {
    currentResult = await ctx.task(refineTask, { ...args, feedback: lastFeedback, attempt: attempt + 1 });
  }
  const approval = await ctx.breakpoint({
    question: 'Review and approve this step?',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined,
  });
  if (approval.approved) break;
  lastFeedback = approval.response || approval.feedback || 'Changes requested';
}
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
    const approval = await ctx.breakpoint({
      reason: "Critical security issues",
      issues: securityCheck.criticalIssues,
      question: "Start iterative improvement?",
      options: ["Approve", "Reject"]
    });
    if (!approval.approved) {
      return { ok: false, reason: "User rejected iterative improvement", feedback: approval.response || approval.feedback };
    }

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

## Effect Execution Hints

Tasks can include an `execution` field to express preferences about how the effect should be dispatched:

```javascript
defineTask('security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security vulnerability scan',
  execution: {
    model: 'claude-opus-4-6',       // universal — used by plugins + internal harness
    harness: 'pi',                  // internal harness only — ignored by plugins
    permissions: ['file:read', 'net:fetch'],  // internal harness only
  },
  agent: {
    name: 'security-scanner',
    prompt: {
      role: 'Security engineer',
      task: 'Scan for vulnerabilities',
      context: { ...args },
      instructions: ['Scan dependencies', 'Check for known CVEs'],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['findings'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

**Field scope:**

| Field | Scope | Description |
|-------|-------|-------------|
| `execution.model` | Universal | Preferred model for the task. Used by both plugins and internal harness. |
| `execution.harness` | Internal harness only | Preferred harness CLI. ONLY used by `agent-platform create-run`. Ignored by plugins. |
| `execution.permissions` | Internal harness only | Free-form permission list. ONLY used by `agent-platform create-run`. |

**Note:** In plugin SKILL.md files, the `harness` field is ignored. Only `model` is considered for subagent selection.

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

---

## Pattern 8: `page.setContent` Stub for Playwright Structural Specs

### Concept

When a babysitter run authors new UI features that need Playwright coverage, the temptation is to write full end-to-end tests that boot a browser, sign in, hit the real auth provider, seed a database, and click through the actual UI. That's the right test for *behaviour*, but it's the wrong test for the *structural contract* — "the new `pantry-sticky-header` testid exists, the merge banner is inside the sticky region, the path-switcher has 3 tiles instead of 2." Those are markup invariants. Boot-the-world tests for markup invariants are slow, flaky, and tightly coupled to auth + DB seed plumbing.

A faster, more reliable pattern from production usage of babysitter on the [cookbook project](https://github.com/rogelsm/cookbook):

**Use `page.setContent(html)` to inject the expected markup atomically, then assert testids and class shapes — no navigation, no DB, no flakes.**

### The pattern, side by side

```ts
// ❌ Flaky pattern (race between navigation + DOM injection)
async function stubFlaky(page) {
  await page.goto('/login');
  await page.evaluate(() => {
    document.body.innerHTML = '';
  });
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.innerHTML = `<section data-testid="my-feature">…</section>`;
    document.body.appendChild(root);
  });
}
```

```ts
// ✅ Atomic pattern (no navigation, no race)
async function stubAtomic(page) {
  const html = `<!doctype html>
    <html><head><style>/* inline css for the assertions you care about */</style></head>
    <body>
      <section data-testid="my-feature">…</section>
      <div style="height: 2000px"></div>  <!-- tall sentinel for scroll tests -->
    </body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="my-feature"]', { state: 'attached' });
}
```

### Why it works

- `page.setContent()` replaces the entire document in one operation — no race with hydration, no leftover login-page markup, no router replacing your DOM.
- `waitUntil: 'domcontentloaded'` returns as soon as the markup is parsed (faster than `networkidle`).
- The follow-up `waitForSelector(..., { state: 'attached' })` is belt-and-braces: it ensures any synchronous assertions immediately after the stub call see the markup.

### Real-world measurement

One cookbook run (`01KS3BNJ` · 2026-05-20) used the original `goto + evaluate + appendChild` pattern:
- 4/6 tests passing (2 unexpected failures + 2 flaky on retry)
- 1 minute 42 seconds total wall time across the spec

After switching to `page.setContent`:
- 6/6 tests passing cleanly, zero retries
- 5.5 seconds total wall time

That's **~20× faster** with **no flakes**. The pattern was then adopted from the start in the next four playwright spec authoring rounds and remained flake-free through all of them.

### When NOT to use this

- **You're testing behaviour that depends on real auth or DB state.** A stub can't catch RLS bugs, server-action validation errors, or auth-gate redirects. Keep your full e2e specs for those.
- **You're testing client-side hydration or React state.** Stub markup is dead HTML; React doesn't mount.
- **You're testing scroll behaviour that depends on the real CSS bundle.** Inlining a huge chunk of Tailwind defeats the purpose; a real navigation is cheaper at that point.

### When TO use this

- **Markup contract tests** — "this testid exists, this aria-label is set, this href points where it should."
- **Layout invariants** — "the responsive grid renders 3 columns at 1440px, 1 at 390px."
- **Sticky / scroll invariants** — works fine because `setContent` honours your inlined CSS.
- **Wire-up assertions** — "the merge banner is rendered inside the sticky header container, not as a sibling."

### Spec scaffold

```ts
import { test, expect } from '@playwright/test';

const STICKY_CLASSES =
  'sticky top-0 z-20 -mx-3 px-3 pb-3 pt-2 bg-white/90 backdrop-blur-sm border-b';

async function stubMyFeature(page: import('@playwright/test').Page) {
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>stub</title>
    <style>
      .sticky { position: sticky; }
      .top-0 { top: 0; }
      .z-20 { z-index: 20; }
      /* inline only what your assertions need */
    </style>
  </head>
  <body>
    <section data-testid="pantry-view">
      <div data-testid="my-feature-header" class="${STICKY_CLASSES}">
        <input data-testid="my-feature-input" />
      </div>
      <div style="height: 2000px"></div>
    </section>
  </body>
</html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="my-feature-header"]', { state: 'attached' });
}

test.describe('my feature · structural contract', () => {
  test('the feature header is present', async ({ page }) => {
    await stubMyFeature(page);
    await expect(page.getByTestId('my-feature-header')).toBeVisible();
    await expect(page.getByTestId('my-feature-input')).toBeVisible();
  });
});
```

### Trade-offs

- **Coupling to markup.** Refactoring the component changes the stub. That's a feature, not a bug — it forces the stub to track the contract. But it does mean stubs need maintenance.
- **Not a hydration test.** Anything that requires `useEffect`, `useState`, or Next.js client hydration won't fire. Real e2e specs cover that surface separately.
- **No router context.** `useRouter()`, `useSearchParams()`, etc. won't work. If your component reads from them, pass equivalent data via props in the stub or set the URL beforehand with `page.goto('about:blank')` followed by `page.setContent`.

### Reference

The pattern crystallized during a multi-run development sprint on the cookbook project (May 2026), where it converted a flaky 1m42s spec into a 5.5s clean one. Four subsequent playwright spec authoring rounds adopted the pattern from the start; all stayed flake-free.

## Pattern 9: Smoke E2E Verification Gate

### Concept

For processes that modify full-stack web applications (Next.js, Remix, Nuxt, SvelteKit, etc.), static verification is not enough. TypeScript compilation passes, unit tests pass, and the final verifier declares success — but the first real page load crashes because of stale dev servers, missing migrations, hardcoded UI stubs, broken click handlers, or dead code in type-safe layers.

The Smoke E2E Gate is a phase that sits between Integration and Testing. It restarts the dev server, seeds a known admin user, runs a small set of Playwright tests that log in and visit every new route, and **hard-fails the run** if any smoke test fails. It is the runtime reality check that static verification cannot provide.

### Motivation (from a real failure)

A 12-phase Next.js + Prisma process declared itself complete at 96/100. Seven significant runtime bugs were found by the user in the first hour:

- Stale Prisma client cached in a dev server running since Friday
- Schema migration silently failed (`exit 1` accepted as "passed: false")
- Hardcoded UI notifications that looked real but had no API wiring
- "View Report" button with a click handler that set state but never navigated
- Dead code in `pdf-renderer.ts` bypassed by an inline HTML builder in the route handler
- Flagship feature gated on `severity === 'CRITICAL'` but axe maps `serious` → `MAJOR`, so zero issues ever qualified
- Interactive viewer required a field that was never populated

**All seven** would have been caught by a 30-second smoke suite that logs in and visits the new routes. None would have been caught by the pre-existing verification (TS compile + unit tests + file-existence grep).

### TaskDef Structure

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const smokeE2eTask = defineTask('smoke-e2e', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Smoke E2E — runtime reality check',
  agent: {
    name: 'e2e-testing',
    prompt: {
      role: 'E2E Reality Tester — you verify the app ACTUALLY WORKS, not just compiles',
      task: 'Run smoke E2E tests against a freshly-restarted dev server to catch runtime bugs that static checks miss',
      context: {
        projectDir: args.projectDir,
        known_failure_modes: [
          'Dev server has stale Prisma client cached from before schema changes',
          'Migrations silently failed due to missing DATABASE_URL',
          'Hardcoded UI stubs that look real but have no API wiring',
          'Click handlers that set state but never fetch or navigate',
          'Dead code in type-safe layers that are never reached at runtime'
        ]
      },
      instructions: [
        '1. Kill any running dev server: `pgrep -f "next dev.*<projectDir>" | xargs kill 2>/dev/null; sleep 2`',
        '2. Restart dev server in background and wait for "Ready in" in the log (up to 30s)',
        '3. Seed a SYSTEM_ADMIN test user with a known password',
        '4. Create smoke spec directory `tests/e2e/smoke/` if it does not exist',
        '5. Create or verify smoke specs covering (at minimum):',
        '   - login page renders, accepts credentials, redirects to dashboard',
        '   - dashboard loads without runtime error overlay',
        '   - every new route from the plan loads without error',
        '   - any new buttons have working click handlers (click → assert URL or DOM changed)',
        '6. Run: `npx playwright test tests/e2e/smoke/ --project=chromium --reporter=json`',
        '7. Parse the JSON result to count passed/failed tests',
        '8. Return { passed, totalTests, failedTests, failures, artifacts }',
        '9. DO NOT return passed:true unless every smoke test actually passed'
      ],
      outputFormat: 'JSON matching the output schema below'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'totalTests', 'failedTests', 'failures', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        totalTests: { type: 'number' },
        failedTests: { type: 'number' },
        failures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['smoke', 'e2e', 'verification', 'runtime']
}));
```

### Usage in Process

Place the smoke phase **between Integration and Testing** phases, and **hard-fail the process** on any smoke failure. Do not let the run continue to declare success on a broken build.

```javascript
export async function process(inputs, ctx) {
  // ... earlier phases: planning, schema, features, integration ...

  // Phase 9.5: Smoke E2E — runtime reality check
  ctx.log('info', 'Phase 9.5: Smoke E2E — runtime reality check');

  const smokeResult = await ctx.task(smokeE2eTask, {
    projectDir: inputs.projectDir,
    features
  });

  if (!smokeResult.passed) {
    throw new Error(
      `Phase 9.5 Smoke E2E FAILED. ` +
      `${smokeResult.failedTests}/${smokeResult.totalTests} tests failed. ` +
      `Do not proceed until the app actually works when a user clicks. ` +
      `Failures: ${JSON.stringify(smokeResult.failures)}`
    );
  }

  // ... later phases: testing, security, final verification ...
}
```

### Paired Final Verification Rules

The Smoke E2E Gate is most effective when the Final Verification phase grades based on the smoke result, not on static signals. Replace "count passing unit tests" with:

- If ANY smoke test failed: score is AT MOST 50 regardless of other metrics
- If the smoke suite cannot run at all (dev server dead, etc): score is 0
- If unit tests fail but smokes pass: score capped at 75
- If both suites fully pass: score up to 95 (never 100 — there's always improvement)
- TypeScript compilation, accessibility checks, etc. contribute at most a +5 bonus **only when smoke tests pass**

### Minimum Viable Smoke Suite

For a Next.js + Prisma project, a viable smoke suite is 3–5 tests:

```typescript
// tests/e2e/smoke/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('home redirects to login for unauthenticated users', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveURL(/login/);
});

test('login page renders', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('authenticated dashboard loads without prisma error', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', process.env.SMOKE_USER_EMAIL!);
  await page.fill('input[type="password"]', process.env.SMOKE_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });

  const content = await page.content();
  expect(content).not.toContain('Runtime TypeError');
  expect(content).not.toContain('Cannot read properties of undefined');
});
```

Add one smoke test per new top-level route introduced by the process. The goal is not coverage — it is "does the page render as an authenticated user without a red error overlay."

### When to Use Smoke E2E Gate

✅ **Good use cases:**
- Full-stack web processes (Next.js, Remix, Nuxt, SvelteKit, Astro)
- Any process that modifies both database schema and UI
- Processes that claim to wire up new navigation routes
- Refactors that span multiple layers (DB → API → UI)

❌ **Avoid for:**
- Pure library refactors with no runtime (unit tests are sufficient)
- Static site generators where there is no interactive runtime
- Processes where the user will manually verify — the gate adds overhead for solo dev work

### Anti-patterns to avoid

- **Stub smoke tests** marked `test.fixme` that require "auth/DB seeding": these provide the illusion of verification. Either the test actually runs or it doesn't count.
- **`|| true` around migration steps**: swallowing exit codes lets broken schema state cascade into the smoke phase, producing confusing failures. Fail hard in Phase 2.
- **Running smokes against a stale dev server**: the kill-restart-wait sequence is non-negotiable. Module caching in Node.js means regenerating Prisma client files on disk does nothing for a running process.
- **Scoring >50 with any smoke failure**: don't let the verifier invent a high score when a real user's click would crash. Hard-cap the score.

---

## Pattern 9: Runtime Call-Path Tracing

### Concept

Planning agents frequently waste tokens — and worse, produce incorrect changes — by modifying code that is never actually reached at runtime. The underlying cause is a failure to trace the live call path before deciding which files to change.

Type-safe monorepos are especially prone to this. A developer (or agent) sees a cleanly-typed `PdfRenderer` class, modifies it carefully, verifies the TypeScript compiles, and declares success. What they missed: the route handler that triggers the PDF export never imported `PdfRenderer`. It has its own inline HTML builder that it has been using since the original sprint. `PdfRenderer` is dead code. The typed layer is a ghost. The change did nothing.

**The core problem:** static-analysis tools (grep, type-checker, file-existence checks) can tell you that a symbol *exists* and *could* be called. They cannot tell you what is *actually* called when a user clicks "Export PDF" at runtime.

**The solution:** before deciding which files to modify, dispatch a `trace-call-path` planning subtask. The agent follows the live execution path from the user-facing entry point (route handler, CLI command, event listener) all the way to the final output-producing code. Every fork in the road is noted. Dead branches — including well-typed ones — are flagged explicitly. Only code on the confirmed live path is modified.

### Motivation (from a real failure — see issue #127)

A Next.js + Prisma process was asked to fix PDF rendering quality. The process spent six iterations improving `lib/pdf-renderer.ts`: added proper font embedding, fixed margin calculations, tightened the output schema. All TypeScript checks passed.

The user's "Export PDF" button continued producing the same low-quality output. Root cause: `app/api/export/route.ts` had never imported `lib/pdf-renderer.ts`. It contained an inline `buildHtmlForPdf()` function that called `puppeteer` directly. Every change to `lib/pdf-renderer.ts` was irrelevant. The entire improvement loop was executed against dead code.

A single call-path trace from `app/api/export/route.ts` → `buildHtmlForPdf()` would have surfaced this in under 30 seconds and redirected all effort to the live path.

### TaskDef Structure

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const traceCallPathTask = defineTask('trace-call-path', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trace live call path: ${args.featureName}`,
  agent: {
    name: 'call-path-tracer',
    prompt: {
      role: 'Runtime Call-Path Analyst — you follow what ACTUALLY runs, not what looks like it should run',
      task: `Trace the complete runtime execution path for the "${args.featureName}" feature from its user-facing entry point to final output. Identify every file on the live path and every file that exists but is NOT on the live path (dead code / unreachable typed layers).`,
      context: {
        projectDir: args.projectDir,
        entryPoint: args.entryPoint,        // e.g. "app/api/export/route.ts POST handler"
        featureName: args.featureName,       // e.g. "PDF export"
        knownSymbols: args.knownSymbols ?? [], // hints: ["PdfRenderer", "buildHtmlForPdf"]
        known_failure_modes: [
          'A typed library class exists but the route handler uses a local inline function instead',
          'An import exists in one file but a different import is used at the call site',
          'Middleware rewrites the request before it reaches the handler you inspected',
          'A feature flag short-circuits execution before reaching the typed layer',
          'A cache layer returns early, bypassing the rendering function entirely'
        ]
      },
      instructions: [
        '1. Open the entry-point file and read the handler/function that is triggered by the user action.',
        '2. For every function call and import in that handler, resolve the actual import source — do not assume the most obvious file is the one being used.',
        '3. Follow each call transitively. At each level, note: file path, exported symbol, whether it is actually imported by the caller.',
        '4. When you encounter a branch (feature flag, env check, early-return), record BOTH paths with a note on which is live under normal conditions.',
        '5. Stop when you reach code that writes to the response / produces output (HTTP response, file write, return value to client).',
        '6. Separately, list any symbols/files that LOOK related (similar name, same domain) but are NOT on the live call path — these are dead code candidates.',
        '7. Return the structured result matching the output schema.',
        '8. CRITICAL: Do not guess. If an import is ambiguous, read the actual import statement in the file. If you cannot determine whether a branch is live, say so explicitly in the `uncertainties` field.'
      ],
      outputFormat: 'JSON matching the runtimeCallPaths output schema'
    },
    outputSchema: {
      type: 'object',
      required: ['entryPoint', 'livePath', 'deadCodeCandidates', 'uncertainties', 'recommendedEditTargets'],
      properties: {
        entryPoint: {
          type: 'string',
          description: 'The file and symbol where tracing began'
        },
        livePath: {
          type: 'array',
          description: 'Ordered list of every file/symbol on the confirmed live call path',
          items: {
            type: 'object',
            required: ['file', 'symbol', 'calledBy'],
            properties: {
              file: { type: 'string', description: 'Repo-relative file path' },
              symbol: { type: 'string', description: 'Function or class name' },
              calledBy: { type: 'string', description: 'The caller (file:symbol)' },
              notes: { type: 'string', description: 'Optional: branch conditions, cache layers, etc.' }
            }
          }
        },
        deadCodeCandidates: {
          type: 'array',
          description: 'Files/symbols that exist and look related but are NOT on the live call path',
          items: {
            type: 'object',
            required: ['file', 'symbol', 'reason'],
            properties: {
              file: { type: 'string' },
              symbol: { type: 'string' },
              reason: { type: 'string', description: 'Why this is not on the live path' }
            }
          }
        },
        uncertainties: {
          type: 'array',
          description: 'Branches or imports that could not be resolved with certainty',
          items: {
            type: 'object',
            required: ['location', 'description'],
            properties: {
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        recommendedEditTargets: {
          type: 'array',
          description: 'The specific files that should be modified to affect the feature — only files on the live path',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['planning', 'call-path', 'static-analysis', 'dead-code']
}));
```

### Usage in Process

Dispatch the call-path tracer **before** any planning or implementation phases that touch a known feature path. Use its `recommendedEditTargets` output to constrain which files downstream tasks are allowed to modify.

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Trace the live call path BEFORE planning any changes
  ctx.log('info', 'Phase 1: Tracing runtime call path to identify live code');

  const callPathResult = await ctx.task(traceCallPathTask, {
    projectDir: inputs.projectDir,
    entryPoint: inputs.entryPoint,       // e.g. "app/api/export/route.ts → POST handler"
    featureName: inputs.featureName,     // e.g. "PDF export"
    knownSymbols: inputs.knownSymbols    // optional hints from the issue description
  });

  ctx.log('info', `Live path: ${callPathResult.livePath.length} nodes`);
  ctx.log('info', `Dead code candidates: ${callPathResult.deadCodeCandidates.length}`);

  if (callPathResult.deadCodeCandidates.length > 0) {
    ctx.log('warn', 'Dead code detected — the following files will NOT be modified:');
    for (const dead of callPathResult.deadCodeCandidates) {
      ctx.log('warn', `  ${dead.file} (${dead.symbol}): ${dead.reason}`);
    }
  }

  // Phase 2: Plan changes — constrained to recommendedEditTargets only
  const plan = await ctx.task(planChangesTask, {
    ...inputs,
    editTargets: callPathResult.recommendedEditTargets,  // only touch live code
    callPathSummary: callPathResult
  });

  // Phase 3: Implement using the constrained plan
  const implementation = await ctx.task(implementTask, {
    plan,
    editTargets: callPathResult.recommendedEditTargets
  });

  return { callPathResult, plan, implementation };
}
```

### Reusable Instruction Block for Planning Prompts

Include the following block verbatim in planning agent prompts to prevent dead-code edits:

```
CALL-PATH CONSTRAINT — READ BEFORE PLANNING:
You have been provided a runtimeCallPaths result. You MUST:
1. Only propose modifications to files listed in `recommendedEditTargets`.
2. Never modify files listed in `deadCodeCandidates` — they are not on the live execution path.
3. If you believe a dead-code candidate must be modified anyway, stop and raise a breakpoint
   explaining your reasoning. Do not silently edit dead code.
4. If `uncertainties` is non-empty, resolve each uncertainty before modifying code in that area.

Violating this constraint wastes tokens and produces changes that have zero runtime effect.
```

### `runtimeCallPaths` Output Schema (standalone reference)

The `runtimeCallPaths` schema can be re-used anywhere a process needs to record or pass call-path information:

```typescript
interface RuntimeCallPathEntry {
  file: string;          // repo-relative path, e.g. "app/api/export/route.ts"
  symbol: string;        // function or class name, e.g. "POST"
  calledBy: string;      // "app/api/export/route.ts:POST" or "entry"
  notes?: string;        // optional: branch conditions, caching notes
}

interface DeadCodeCandidate {
  file: string;
  symbol: string;
  reason: string;        // e.g. "never imported by route handler; inline function used instead"
}

interface CallPathUncertainty {
  location: string;      // file:symbol where uncertainty was encountered
  description: string;   // what could not be determined
}

interface RuntimeCallPaths {
  entryPoint: string;
  livePath: RuntimeCallPathEntry[];
  deadCodeCandidates: DeadCodeCandidate[];
  uncertainties: CallPathUncertainty[];
  recommendedEditTargets: string[];   // de-duplicated list of files safe to modify
}
```

### When to Use

✅ **Good use cases:**
- Any process that fixes a bug in a specific feature (e.g. "PDF quality is bad") — trace the call path first to confirm you are touching live code
- Refactors that span multiple architectural layers (service → repository → handler) — confirm the layers are actually connected before restructuring
- Performance optimizations — ensure the bottleneck you are optimizing is on the live path, not a superseded implementation
- Processes working in large codebases where multiple implementations of the same concept exist (typed library + inline fallback, v1 + v2 handlers, legacy + modern API routes)
- Processes handed an issue report that names a file or class — verify the named entity is actually live before accepting the reporter's diagnosis

❌ **Avoid for:**
- Pure infrastructure changes (dependency upgrades, CI config) where there is no live call path to trace
- New feature development where no existing call path exists yet — use a different planning approach
- Simple one-file fixes where the entry point IS the implementation file
- Processes where the user has already provided a confirmed call-path trace (do not duplicate work)

### Anti-Pattern: Modifying the Typed Layer Without Checking the Live Path

The following is the canonical anti-pattern this pattern exists to prevent. Do not reproduce it.

```javascript
// ANTI-PATTERN — do not do this

export const fixPdfQualityTask = defineTask('fix-pdf-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix PDF rendering quality',
  agent: {
    name: 'pdf-fixer',
    prompt: {
      role: 'PDF engineer',
      task: 'Fix PDF quality issues',
      context: { projectDir: args.projectDir },
      instructions: [
        // BUG: assumes the typed library is on the live path without verifying
        '1. Open lib/pdf-renderer.ts',
        '2. Find the font embedding code and fix it',
        '3. Fix the margin calculation',
        '4. Run TypeScript compiler to verify',
        '5. Return success'
      ],
      outputFormat: 'JSON'
    }
  },
  // ...
}));
```

**Why this fails:** Step 1 assumes `lib/pdf-renderer.ts` is used at runtime. If the actual route handler at `app/api/export/route.ts` never imports it — because it has its own inline `buildHtmlForPdf()` function — then steps 1–4 execute against dead code, TypeScript passes, and the bug is unchanged.

**Correct approach:** dispatch `traceCallPathTask` first, confirm `lib/pdf-renderer.ts` appears in `recommendedEditTargets`, then proceed with the fix. If it does not appear, the fix belongs in whatever file the tracer identifies as the live renderer.

---

## Pattern 10: Cycle-Aware Multi-Point Verification

### Concept

Health monitors, cron jobs, shell-script daemons, and systemd units all share a property that distinguishes them from web servers: **they execute on a schedule, not on demand.** When you patch such a component and then immediately run a health check, you are checking the state of the system *before your fix ran*, not after. The patched code has not executed yet.

Single-snapshot verification — one `curl /health` right after applying a patch — is the runtime equivalent of checking your parachute while still on the ground. The parachute looks fine. You haven't jumped yet.

### Motivation (from a real failure — see issue #123)

A health-monitor shell script had a bug in its `check_service()` function. A process patched the script correctly and immediately issued a `curl http://localhost:3010/health` — which returned `{"status":"ok"}`. The process declared COMPLETED.

The bug reappeared on the next cron cycle. Root cause: the server was running the **pre-fix** code that had been loaded into memory before the patch was applied. The health endpoint returned `ok` because it had been `ok` the whole time — the server had never restarted, never reloaded the script, and the 5-minute cron cycle hadn't fired since the patch landed.

A second health check after one full cycle period would have failed immediately, revealing the problem before COMPLETED was declared.

### Anti-Pattern: Single-Snapshot Verification

Do not do this after patching a cyclic or deferred-execution component:

```javascript
// ANTI-PATTERN — proves nothing about the patched code
const result = await ctx.task(healthCheckTask, { url: 'http://localhost:3010/health' });
if (result.ok) {
  return { status: 'COMPLETED' };  // BAD: checked pre-fix state, not post-fix execution
}
```

This passes because the pre-fix server is healthy. The patched code has not executed yet. The next scheduled cycle will run the patched (or broken) code and the caller will never know.

### The Solution: Multi-Point Verification with Cycle Awareness

Verification must span at least one full execution cycle:

1. **Pre-flight analysis** — detect dangerous patterns in the patch before applying it
2. **Baseline health check** — confirm the server is healthy before the cycle fires
3. **Wait for at least one full cycle period** — let the patched code execute
4. **Post-cycle survival check** — confirm the server is still healthy after the patched code ran
5. **Both checks must pass** to declare COMPLETED

```
Timeline:

  T=0       T=baseline   T=baseline+cycleInterval   T=post-cycle
  │         │            │                           │
  [patch]   [check 1 ✓]  [patched code executes]    [check 2 ✓]
                          ↑                           ↑
                   first cron tick              COMPLETED gate
                   since the fix
```

### Shared Component

This pattern is encapsulated in `./shared/cycle-aware-verification.js`:

```javascript
import {
  cycleAwareVerificationTask,
  createCycleAwareVerification,
  createPreflightAnalysis,
  createPostCycleSurvivalCheck
} from './shared/cycle-aware-verification.js';
```

#### Standalone usage — full multi-point verification in one task

```javascript
const result = await ctx.task(cycleAwareVerificationTask, {
  url: 'http://localhost:3010/health',
  cycleIntervalMs: 300000, // 5 minutes — the cron / daemon cycle period
});
// result: { baselinePassed, postCyclePassed, bothPassed, baselineResponse, postCycleResponse }
```

The task performs the baseline check, waits `cycleIntervalMs`, then performs the post-cycle check. If `bothPassed` is false, the process must not declare COMPLETED.

#### Factory usage — separate baseline and post-cycle tasks

When you need to interleave other work between the two checks (e.g., gather logs, run diagnostics), use the factory to get independent task definitions:

```javascript
const { baselineTask, postCycleTask } = createCycleAwareVerification({
  healthCheck: { url: 'http://localhost:3010/health' },
  cycleIntervalMs: 300000,
});

// Phase A: baseline
const baseline = await ctx.task(baselineTask, {});

// ... interleaved diagnostics ...

// Phase B: post-cycle (waits internally for the remaining cycle duration)
const postCycle = await ctx.task(postCycleTask, {
  baselineTimestamp: baseline.timestamp,
});

if (!postCycle.passed) {
  throw new Error('Post-cycle survival check failed — patched code crashed the server');
}
```

#### Pre-flight analysis — check for dangerous patterns before applying the patch

```javascript
const preflight = createPreflightAnalysis();
const analysis = await ctx.task(preflight, { filePath: '/path/to/health-monitor.sh' });
// analysis: { dangerous: boolean, patterns: string[], recommendation: string }
```

Pre-flight looks for patterns that are likely to cause immediate failure on the next cycle:
- Unguarded variable expansions (`$VAR` without `${VAR:-default}`)
- Exit-code swallowing (`|| true`, `; true`)
- Missing `set -e` or `set -o pipefail`
- Hardcoded paths that differ between dev and prod

### Usage in Process

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Pre-flight — detect dangerous patterns before patching
  ctx.log('info', 'Phase 1: Pre-flight analysis for dangerous shell patterns');
  const preflight = createPreflightAnalysis();
  const preflightResult = await ctx.task(preflight, {
    filePath: inputs.scriptPath,
  });

  if (preflightResult.dangerous) {
    const approval = await ctx.breakpoint({
      question: 'Pre-flight detected dangerous patterns. Review before proceeding?',
      options: ['Proceed anyway', 'Abort'],
      expert: 'owner',
      tags: ['preflight', 'safety'],
    });
    if (!approval.approved || approval.option === 'Abort') {
      return { ok: false, reason: 'Aborted at pre-flight', patterns: preflightResult.patterns };
    }
  }

  // Phase 2: Apply the patch
  const patch = await ctx.task(applyPatchTask, { ...inputs });

  // Phase 3: Baseline health check (confirms server is healthy before cycle fires)
  ctx.log('info', 'Phase 3: Baseline health check');
  const { baselineTask, postCycleTask } = createCycleAwareVerification({
    healthCheck: { url: inputs.healthUrl },
    cycleIntervalMs: inputs.cycleIntervalMs ?? 300000,
  });
  const baseline = await ctx.task(baselineTask, {});

  if (!baseline.passed) {
    throw new Error('Baseline health check failed — server is unhealthy before the cycle fired');
  }

  // Phase 4: Post-cycle survival check (confirms patched code didn't crash the server)
  ctx.log('info', `Phase 4: Waiting ${inputs.cycleIntervalMs ?? 300000}ms for one full cycle, then checking survival`);
  const postCycle = await ctx.task(postCycleTask, {
    baselineTimestamp: baseline.timestamp,
  });

  if (!postCycle.passed) {
    throw new Error(
      'Post-cycle survival check FAILED. The server did not survive the first execution of the patched code. ' +
      `Response: ${JSON.stringify(postCycle.response)}`
    );
  }

  return {
    ok: true,
    status: 'COMPLETED',
    baselineResponse: baseline.response,
    postCycleResponse: postCycle.response,
  };
}
```

### When to Use

✅ **Good use cases:**
- Patching shell scripts executed by cron, systemd timers, or watchdog daemons
- Modifying health-monitor scripts that are read and executed on each cycle
- Changing server startup scripts or init.d / systemd unit files
- Fixing cron jobs where the fix only applies at the next scheduled tick
- Any infra change where the patched code path is not triggered by the health endpoint itself

❌ **Avoid for:**
- Web server application code that is loaded once at startup — use Pattern 8 (Smoke E2E Gate) instead
- Pure library refactors with no runtime cycle
- Processes where the user manually restarts the service after patching (the restart makes single-snapshot verification valid)

### Determining the Cycle Interval

If the cycle interval is not provided in process inputs, the agent should infer it:

```javascript
// In the patch task's instructions or a separate discovery task:
// 1. cat the crontab: `crontab -l` or `cat /etc/cron.d/<name>`
// 2. Parse the cron expression to determine the repeat interval in ms
// 3. For systemd timers: `systemctl show <name>.timer --property=OnUnitActiveSec`
// 4. For sleep-loop daemons: grep for `sleep <n>` in the script body
// 5. Default to 300000 (5 min) if none of the above yields a result
```

Pass the inferred value as `cycleIntervalMs` to `createCycleAwareVerification`.

### Anti-Patterns to Avoid

- **Checking the health endpoint before the cycle fires:** the server is still running pre-fix code. A passing check proves only that the server was healthy before your change, not that it survived it.
- **Using `sleep 5 && curl /health`:** five seconds is never sufficient for a component with a 5-minute cycle period. Use the actual cycle interval.
- **Treating a 200 response as proof of correctness:** the health endpoint may return 200 even while the monitored process is in a broken state. Ensure the endpoint checks the actual component you patched.
- **Skipping the baseline:** without a baseline, a post-cycle failure is ambiguous — the server may have been unhealthy before the patch.

---

## Known Anti-Patterns

### Anti-Pattern: Single-Snapshot Verification After Cyclic Infra Fixes

When patching a cron job, health-monitor script, systemd unit, or any component that executes on a schedule rather than on demand, a single health check immediately after the patch proves only that the server was alive before the patched code ran. It does not verify that the patched code executed without error.

**The trap:** the server responds `{"status":"ok"}` because it is still running the pre-fix code that was loaded on the previous cycle. Your patch has not been exercised yet.

**The fix:** use Pattern 10 (Cycle-Aware Multi-Point Verification) — baseline check before the cycle, wait for one full cycle period, post-cycle check after the patched code executes. Both must pass.

See issue #123.

---

### Anti-Pattern: Homegrown Retry Wrappers Around ctx.task()

**DO NOT** wrap `ctx.task()` in a `for`-loop retry wrapper without `stableKey`:

```javascript
// BAD — creates N pending effects instead of 1
async function withRetry(label, fn) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try { return await fn(); } catch (err) { lastError = err; }
  }
  throw lastError;
}
await withRetry('Phase 2', () => ctx.task(myTask, args));
```

Each `ctx.task()` call advances the internal step counter, generating a unique
invocation key. N loop iterations = N pending effects for 1 logical task.
This corrupts the replay journal and produces phantom effects that can never be
resolved, eventually stalling the run.

**Instead, use `stableKey`:**

```javascript
// GOOD — all retry iterations hit the same effect slot
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await ctx.task(myTask, args, { stableKey: 'phase2.my-task' });
  } catch (err) {
    if (attempt === 2) throw err;
  }
}
```

When `stableKey` is provided, the `ReplayCursor` is NOT advanced. The stable key
is used directly as the step ID for invocation-key hashing, so every retry
iteration resolves to the same effect slot in the index. The first call creates
the effect; subsequent calls with the same `stableKey` either return the cached
result (if resolved) or throw `EffectPendingError` — exactly the idempotent
behaviour a retry loop needs.

**Guidelines for `stableKey` values:**

- Use dotted-namespace kebab-case unique within the process (e.g., `phase1.fetch-data`, `phase2.my-task`).
- Do NOT incorporate loop counters or timestamps — that defeats the purpose.
- Do NOT use `stableKey` for non-retry patterns; normal sequential `ctx.task()` calls should let the cursor advance.

See issue [#126](https://github.com/a5c-ai/babysitter/issues/126).

---

## Summary

These patterns extend babysitter's capabilities:

1. **Agent tasks** - LLM-powered work with structured I/O
2. **Skill tasks** - Composable skill invocation
3. **Iterative convergence** - Score-based improvement loops with safety mechanisms
4. **`page.setContent` stub** - Atomic Playwright markup injection for structural-contract testing (Pattern 8)
5. **Smoke E2E gate** - Runtime reality check that hard-fails on any failure
6. **Runtime call-path tracing** - Confirm live execution paths before modifying any code
7. **Cycle-aware multi-point verification** - Baseline + post-cycle health checks for patched scheduled components

All patterns use the same SDK API (`ctx.task()`), maintaining consistency while enabling sophisticated workflows. The Smoke E2E Gate pattern pairs especially well with Iterative Convergence when used as the quality-gate for UI-heavy refinement loops. Runtime Call-Path Tracing should be run as the first planning step in any process that targets a specific existing feature — it prevents all downstream phases from wasting iterations on dead code. Cycle-Aware Multi-Point Verification must be used whenever a process patches any component whose fix only takes effect on the next scheduled execution cycle — a single immediate health check proves nothing about the patched code.
