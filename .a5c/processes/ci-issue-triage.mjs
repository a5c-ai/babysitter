import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/issue-triage
 * @description Triage a GitHub issue: critically evaluate, research, deduplicate, label, prioritize, and prepare for development.
 * @inputs { issueNumber: number, repo: string }
 * @outputs { triaged: boolean, duplicate: boolean, alreadyFixed: boolean, priority: string, readyForDev: boolean }
 */

export async function process(inputs, ctx) {
  const issue = await ctx.task(readIssueTask, { issueNumber: inputs.issueNumber, repo: inputs.repo });

  const duplicateCheck = await ctx.task(checkDuplicatesTask, { issue });
  if (duplicateCheck.isDuplicate) {
    await ctx.task(markDuplicateTask, { issue, duplicateOf: duplicateCheck.duplicateOf });
    return { triaged: true, duplicate: true, alreadyFixed: false, priority: 'n/a', readyForDev: false };
  }

  const fixCheck = await ctx.task(checkAlreadyFixedTask, { issue });
  if (fixCheck.isFixed) {
    await ctx.task(closeAsFixedTask, { issue, fixDetails: fixCheck.details });
    return { triaged: true, duplicate: false, alreadyFixed: true, priority: 'n/a', readyForDev: false };
  }

  const research = await ctx.task(researchCodebaseTask, { issue });
  const critique = await ctx.task(criticalEvaluationTask, { issue, research });
  const classification = await ctx.task(classifyAndLabelTask, { issue, research, critique });
  const priority = await ctx.task(assessPriorityTask, { issue, research, classification, critique });
  const handoff = await ctx.task(prepareHandoffTask, { issue, research, classification, priority, critique });

  return {
    triaged: true,
    duplicate: false,
    alreadyFixed: false,
    priority: priority.level,
    readyForDev: handoff.readyForDev,
  };
}

const readIssueTask = defineTask('read-issue', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Read issue details',
    labels: ['triage', 'research'],
    io: {
      instruction: `Read issue #${args.issueNumber} thoroughly.
Run: gh issue view ${args.issueNumber} --json title,body,labels,comments,assignees,state
Read the title, body, all comments, existing labels, and assignees.
Return the full issue context as JSON.`,
    },
  };
});

const checkDuplicatesTask = defineTask('check-duplicates', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Check for duplicate issues',
    labels: ['triage', 'dedup'],
    io: {
      instruction: `Search for issues similar to: "${args.issue.title}"
Run: gh issue list --state all --search "<key terms from the issue>" --json number,title,state,labels --limit 20
Check both open and closed issues. Compare descriptions and root causes, not just titles.
Return { isDuplicate: boolean, duplicateOf: number | null, reason: string }.`,
    },
  };
});

const markDuplicateTask = defineTask('mark-duplicate', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Mark issue as duplicate',
    labels: ['triage', 'label'],
    io: {
      instruction: `Mark issue #${args.issue.number} as duplicate of #${args.duplicateOf}.
Run: gh issue edit ${args.issue.number} --add-label "duplicate"
Run: gh issue comment ${args.issue.number} --body "Duplicate of #${args.duplicateOf}. See that issue for tracking."`,
    },
  };
});

const checkAlreadyFixedTask = defineTask('check-already-fixed', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Check if already fixed in staging',
    labels: ['triage', 'research'],
    io: {
      instruction: `Check if issue "${args.issue.title}" was already fixed.
1. Search commits: git log --oneline --all --grep="<keywords>" | head 20
2. Search staging: git log origin/staging --oneline --grep="<keywords>" | head 20
3. Search closed PRs: gh pr list --state closed --search "<keywords>" --json number,title,mergedAt --limit 10
4. Check if any recent merged PRs address this specific issue.
Return { isFixed: boolean, details: string | null }.`,
    },
  };
});

const closeAsFixedTask = defineTask('close-as-fixed', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Close issue as already fixed',
    labels: ['triage', 'close'],
    io: {
      instruction: `Close issue #${args.issue.number} as already fixed.
Run: gh issue comment ${args.issue.number} --body "This appears to have been fixed: ${args.fixDetails}. Closing."
Run: gh issue close ${args.issue.number} --reason completed`,
    },
  };
});

const researchCodebaseTask = defineTask('research-codebase', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Research the codebase for affected areas',
    labels: ['triage', 'research'],
    io: {
      instruction: `Research the codebase to understand issue "${args.issue.title}".

Do thorough investigation — don't just search by keywords:
1. Read the issue body carefully. Identify the SPECIFIC claim being made.
2. Find the actual code mentioned or implied. Read the relevant source files.
3. Trace the code path from the reported symptom to the likely root cause.
4. Check git blame on the affected lines — was this code recently changed?
5. Check recent commits to the affected packages: git log --oneline -20 -- <package-path>
6. Look for test coverage: are there tests for the affected behavior?
7. Check if the issue's description of the problem matches what the code actually does.

Return {
  affectedFiles: string[],
  affectedPackages: string[],
  rootCause: string,
  codeEvidence: string,
  reproSteps: string | null,
  hasTests: boolean,
  recentChanges: string[]
}.`,
    },
  };
});

const criticalEvaluationTask = defineTask('critical-evaluation', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Critically evaluate the issue',
    labels: ['triage', 'evaluation'],
    io: {
      instruction: `Critically evaluate issue #${args.issue.number} against the codebase research.

Think independently — don't accept the reporter's analysis at face value. Ask:

1. **Is the problem real?** Does the code actually behave as described? Or is the reporter
   misunderstanding expected behavior, testing wrong, or reporting a configuration issue?

2. **Is the suggested fix correct?** If the reporter suggests a solution, is it the right
   approach? Could it introduce regressions? Is there a better alternative?
   - If the suggestion is WRONG: explain why and what should be done instead.
   - If the suggestion is out of scope: explain why and where it belongs.
   - If the suggestion is incomplete: identify what's missing.

3. **Is this actually a bug or a feature request?** Is the reporter describing broken
   behavior or requesting new functionality? Is this within the project's scope?

4. **What's the real root cause?** The symptom described might mask a deeper issue.
   The reporter's "root cause" might be a surface-level observation.

5. **What are the risks?** Would fixing this break other things? What's the blast radius?
   Check dependents and consumers of the affected code.

6. **Is the priority the reporter implies correct?** A "critical" issue might actually
   be a cosmetic inconvenience. A seemingly minor report might affect many users.

Return {
  isValidIssue: boolean,
  reporterAnalysisCorrect: boolean,
  suggestedFixCorrect: boolean | null,
  alternativeRecommendation: string | null,
  realRootCause: string,
  outOfScope: boolean,
  outOfScopeReason: string | null,
  risks: string[],
  correctedPriority: string | null
}.`,
    },
  };
});

const classifyAndLabelTask = defineTask('classify-and-label', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Classify issue and apply labels',
    labels: ['triage', 'label'],
    io: {
      instruction: `Classify and label issue #${args.issue.number}.

Use the critical evaluation to inform classification:
${args.critique.outOfScope ? `NOTE: This issue was flagged as potentially out of scope: ${args.critique.outOfScopeReason}` : ''}
${!args.critique.reporterAnalysisCorrect ? `NOTE: The reporter's analysis may be incorrect. Real root cause: ${args.critique.realRootCause}` : ''}

Apply labels for:
- Type: bug, feature, enhancement, question, documentation, refactor, test
- Component: sdk, adapters, transport-mux, hooks-mux, breakpoints-mux, atlas, agent-catalog, triggers, ci, plugins
- Effort: effort:small, effort:medium, effort:large
${args.critique.outOfScope ? '- Scope: out-of-scope' : ''}
${!args.critique.isValidIssue ? '- Status: invalid, wontfix, or needs-info' : ''}

Create any labels that don't exist: gh label create "<name>" --description "<desc>" --color "<hex>" 2>/dev/null || true
Apply labels: gh issue edit ${args.issue.number} --add-label "<label1>,<label2>,..."

Return { type: string, components: string[], effort: string }.`,
    },
  };
});

const assessPriorityTask = defineTask('assess-priority', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Assess issue priority',
    labels: ['triage', 'priority'],
    io: {
      instruction: `Assess the priority of issue #${args.issue.number}.

Consider the critical evaluation:
${args.critique.correctedPriority ? `The critical evaluation suggests priority should be: ${args.critique.correctedPriority}` : ''}
${args.critique.risks.length > 0 ? `Risks identified: ${args.critique.risks.join(', ')}` : ''}

Factors to weigh:
- Impact: how many users/workflows affected? Is it a core path or edge case?
- Severity: crash/data loss vs cosmetic vs inconvenience
- Urgency: is this blocking production? Are there workarounds?
- Complexity: is the fix straightforward or does it require architectural changes?
- Dependencies: does anything else depend on fixing this first?

Apply the priority label: gh issue edit ${args.issue.number} --add-label "priority:<level>"
Create the label if needed: gh label create "priority:<level>" --description "<desc>" --color "<hex>" 2>/dev/null || true

**Risk Analysis** for the suggested fix/change:
- Assess the risk level: risk:critical, risk:high, risk:medium, risk:low
- Consider: blast radius, reversibility, data safety, user-facing impact, dependency chain
- For each risk identified, describe a specific mitigation strategy:
  * How can the risk be reduced before implementation?
  * What testing should be done?
  * Should the change be feature-flagged or rolled out gradually?
  * What rollback plan exists?
- Apply risk label: gh issue edit ${args.issue.number} --add-label "risk:<level>"
  Create if needed: gh label create "risk:<level>" --description "<desc>" --color "<hex>" 2>/dev/null || true

Return { level: "critical" | "high" | "medium" | "low", reasoning: string, riskLevel: string, risks: [{risk: string, mitigation: string}] }.`,
    },
  };
});

const prepareHandoffTask = defineTask('prepare-handoff', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Prepare developer handoff comment',
    labels: ['triage', 'handoff'],
    io: {
      instruction: `Post a detailed triage comment on issue #${args.issue.number}.

The comment must include:

**## Triage Summary**
- **One-line**: concise description of what this issue actually is

**## Critical Evaluation**
${!args.critique.reporterAnalysisCorrect ? `- ⚠️ **Reporter's analysis needs correction**: ${args.critique.realRootCause}` : '- ✅ Reporter's analysis is accurate'}
${args.critique.suggestedFixCorrect === false ? `- ⚠️ **Suggested fix is not recommended**: ${args.critique.alternativeRecommendation}` : ''}
${args.critique.outOfScope ? `- ⚠️ **Out of scope**: ${args.critique.outOfScopeReason}` : ''}

**## Root Cause Analysis**
- Affected files and functions (from research, not just the reporter's claim)
- The actual root cause (may differ from what the reporter stated)
- Code evidence supporting the analysis

**## Affected Components**
- Packages: ${args.classification.components.join(', ')}
- Effort: ${args.classification.effort}

**## Recommended Approach**
${args.critique.alternativeRecommendation || 'Follow the approach described in the issue.'}
- Include specific files to change and the change strategy
- Note any risks: ${args.critique.risks.join(', ') || 'none identified'}

**## Reproduction** (if a bug)
${args.research.reproSteps || 'Not provided — needs reproduction steps'}

**## Related Issues/PRs**
- Links to related work found during research

**## Priority**: ${args.priority.level}
- ${args.priority.reasoning}

**## Risk Analysis**
- **Risk Level**: ${args.priority.riskLevel}
${args.priority.risks.map(r => `- **${r.risk}**\n  - Mitigation: ${r.mitigation}`).join('\n')}

---

If the issue is well-understood and ready for development:
- Assign a5c-agent: gh issue edit ${args.issue.number} --add-assignee "a5c-agent"
- Add ready-for-dev label: gh issue edit ${args.issue.number} --add-label "ready-for-dev"
  (create if needed: gh label create "ready-for-dev" --description "Triaged and ready for development" --color "0E8A16" 2>/dev/null || true)

If the issue is out of scope, invalid, or needs more info:
- Add appropriate label and explain in the comment why.
- Do NOT mark as ready-for-dev.

Post the comment: gh issue comment ${args.issue.number} --body "<markdown>"

Return { readyForDev: boolean, commentPosted: true }.`,
    },
  };
});
