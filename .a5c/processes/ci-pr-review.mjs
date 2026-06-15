import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/pr-review
 * @description Adversarial PR review: critically evaluate code changes, challenge assumptions,
 *   dispatch QA, and approve/reject with evidence.
 * @inputs { prNumber: number }
 * @outputs { approved: boolean, merged: boolean, blockers: number, debtIssues: number }
 */

export async function process(inputs, ctx) {
  const pr = await ctx.task(readPRTask, { prNumber: inputs.prNumber });
  const review = await ctx.task(adversarialReviewTask, { pr });
  const challenge = await ctx.task(challengeAssumptionsTask, { pr, review });
  const qaResult = await ctx.task(dispatchQATask, { pr });
  const decision = await ctx.task(makeDecisionTask, { pr, review, challenge, qaResult });

  return {
    approved: decision.approved,
    merged: decision.merged,
    blockers: review.blockers,
    debtIssues: decision.debtIssuesCreated,
  };
}

const readPRTask = defineTask('read-pr', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Read PR details and all changed files',
    labels: ['review', 'research'],
    io: {
      instruction: `Read PR #${args.prNumber} thoroughly.

1. Get PR metadata:
   gh pr view ${args.prNumber} --json title,body,files,comments,labels,headRefName,baseRefName,additions,deletions,changedFiles

2. Read the full diff:
   gh pr diff ${args.prNumber}

3. For each changed file, read the FULL file (not just the diff) to understand context:
   - What does this file do?
   - What functions/classes are modified?
   - What are the callers/dependents?

4. Check the linked issue (if any) — does the PR actually address it?

5. Read ALL existing review comments and conversations.

Return the full PR context including diff, files, issue link, and existing reviews.`,
    },
  };
});

const adversarialReviewTask = defineTask('adversarial-review', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Adversarial code review — find every possible issue',
    labels: ['review', 'adversarial'],
    io: {
      instruction: `Review PR #${args.pr.number} adversarially. Your job is to FIND PROBLEMS, not rubber-stamp.

For EVERY changed line, ask: "How could this break?"

**Security** (automatic blockers):
- Command injection, SQL injection, XSS, SSRF
- Hardcoded secrets, credentials in code or config
- Path traversal, directory traversal
- Insecure deserialization, prototype pollution
- Missing input validation at system boundaries
- Overly permissive permissions or CORS

**Correctness** (potential blockers):
- Logic errors: wrong conditions, inverted checks, off-by-one
- Race conditions: shared mutable state, TOCTOU
- Error handling: swallowed errors, missing cleanup, unclosed resources
- Edge cases: empty arrays, null/undefined, zero, negative numbers, unicode
- State management: stale state, missing updates, inconsistent mutations
- Concurrency: deadlocks, missing awaits, unhandled promise rejections

**Architecture** (potential majors):
- Breaking changes to public APIs without migration path
- Tight coupling, circular dependencies introduced
- Abstraction leaks across module boundaries
- Missing or insufficient tests for NEW code paths
- Performance: O(n²) where O(n) is possible, unbounded memory, blocking I/O on hot path

**Consistency** (minors unless pattern-breaking):
- Diverges from existing codebase patterns without justification
- Naming inconsistencies
- Missing type annotations where the rest of the file has them
- Copy-pasted code that should be extracted

Classify each finding:
- **blocker**: must fix (security, data loss, correctness)
- **major**: should fix (breaking changes, missing tests for new paths)
- **minor**: nice-to-have (style, naming)
- **debt**: follow-up issue (optimization, docs, cleanup)

**Risk Assessment** for this PR:
- Assign a risk level: risk:critical, risk:high, risk:medium, risk:low
- Consider: blast radius (how many consumers affected), reversibility (can we revert easily?),
  data safety (could this corrupt or lose data?), deployment risk (partial rollout safe?)
- For each identified risk, specify a concrete mitigation:
  * Pre-merge: what additional testing/review is needed?
  * Deploy-time: feature flag, canary, gradual rollout?
  * Post-merge: monitoring, alerting, rollback procedure?

Return { blockers: number, majors: number, minors: number, debt: number, findings: [...], riskLevel: string, risks: [{risk: string, mitigation: string}] }.`,
    },
  };
});

const challengeAssumptionsTask = defineTask('challenge-assumptions', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Challenge the PR assumptions and approach',
    labels: ['review', 'critical-thinking'],
    io: {
      instruction: `Step back from the code and challenge the PR's approach at a higher level.

1. **Is this the right solution?** The PR might solve the problem but in the wrong way.
   - Is there a simpler approach the author missed?
   - Does this add complexity that will be hard to maintain?
   - Would a different architecture avoid the problem entirely?

2. **Does the PR description match reality?** Read the PR body claims against the code:
   - Does the code actually do what the description says?
   - Are there changes not mentioned in the description?
   - Are there claims in the description not supported by the code?

3. **What's NOT in the diff?** The most dangerous bugs are in what's missing:
   - Missing error handling for new failure modes
   - Missing tests for the happy path AND error paths
   - Missing documentation for behavior changes
   - Missing migration for breaking changes
   - Missing rollback plan for risky changes

4. **Will this work in production?** Consider:
   - Does this work at scale? (10x, 100x current load)
   - Does this work on all platforms? (Linux, macOS, Windows)
   - Does this handle network failures, timeouts, partial writes?
   - What happens if this is deployed to half the fleet? (partial rollout)

5. **What could go wrong after merge?** Think adversarially:
   - Could this cause a regression in an unrelated feature?
   - Could this silently corrupt data without immediate symptoms?
   - Could this create a security vulnerability when combined with other code?

Return {
  approachCorrect: boolean,
  alternativeApproach: string | null,
  descriptionMatchesCode: boolean,
  missingItems: string[],
  productionRisks: string[],
  postMergeRisks: string[]
}.`,
    },
  };
});

const dispatchQATask = defineTask('dispatch-qa', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Dispatch QA tests and wait for results',
    labels: ['review', 'qa'],
    io: {
      instruction: `Dispatch QA for PR #${args.pr.number}.

1. Get the PR head branch from the PR data.
2. Determine which live-stack scenarios to test based on changed files:
   - transport-mux changes → test all agents with proxy scenarios
   - launch changes → test all agents
   - atlas graph changes → test affected agents
   - adapter changes → test the specific agent
   - hooks-mux changes → test BP modes
   - SDK changes → test BP modes
3. Dispatch: gh workflow run qa-dispatch.yml --ref staging -f branch=<headRefName> -f pr_number=${args.pr.number} -f instructions="QA for adversarial review"
4. Poll for completion (every 60s, max 25 min):
   gh run list --workflow=qa-dispatch.yml --limit=1 --json databaseId,status,conclusion
5. If QA completes, read results. If timeout, report as inconclusive.

Return { passed: boolean, runId: string | null, details: string }.`,
    },
  };
});

const makeDecisionTask = defineTask('make-decision', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Make approve/reject decision with evidence',
    labels: ['review', 'decision'],
    io: {
      instruction: `Make the final review decision for PR #${args.pr.number}.

Review summary:
- Blockers: ${args.review.blockers}
- Majors: ${args.review.majors}
- Minors: ${args.review.minors}
- Debt items: ${args.review.debt}
- Risk level: ${args.review.riskLevel}
- Approach correct: ${args.challenge.approachCorrect}
- QA: ${args.qaResult.passed ? 'PASSED' : 'FAILED/INCONCLUSIVE'}
${args.challenge.missingItems.length > 0 ? `- Missing items: ${args.challenge.missingItems.join(', ')}` : ''}
${args.challenge.productionRisks.length > 0 ? `- Production risks: ${args.challenge.productionRisks.join(', ')}` : ''}

DECISION RULES (strict — no exceptions):

**REJECT** if ANY of:
- blockers > 0
- QA failed
- Approach is fundamentally wrong (alternativeApproach is not null AND the alternative is clearly better)
- Critical missing items (missing error handling for new failure modes, missing tests for new code paths)

Action: gh pr review ${args.pr.number} --request-changes --body "<detailed review>"
Include: every blocker/major with file:line, what's wrong, how to fix.
Include a **## Risk Assessment** section with: risk level, each identified risk and its mitigation strategy.

**APPROVE + MERGE** if ALL of:
- blockers = 0
- QA passed or no QA needed
- No critical missing items

Before merging:
1. For each debt item, create a tracking issue:
   gh label create "debt" --description "Technical debt" --color "FBCA04" 2>/dev/null || true
   gh issue create --label "debt" --title "<description>" --body "<file refs and context>"
2. Post approving review: gh pr review ${args.pr.number} --approve --body "<summary>"
3. Merge: gh pr merge ${args.pr.number} --squash --auto
4. Post summary comment with: what was reviewed, findings, QA results, debt issues created.
5. Include a **## Risk Assessment** section in the summary comment with:
   - Risk level: ${args.review.riskLevel}
   - Each identified risk and its concrete mitigation strategy

**APPROVE without merge** if:
- No blockers but majors exist that are judgment calls (not clear-cut)
- Approve but note the concerns for the author to address or acknowledge.

Return { approved: boolean, merged: boolean, debtIssuesCreated: number }.`,
    },
  };
});
