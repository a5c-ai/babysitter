import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/issue-triage
 * @description Triage a GitHub issue: research, deduplicate, label, prioritize, and prepare for development.
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
  const classification = await ctx.task(classifyAndLabelTask, { issue, research });
  const priority = await ctx.task(assessPriorityTask, { issue, research, classification });
  const handoff = await ctx.task(prepareHandoffTask, { issue, research, classification, priority });

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
Search for relevant files, functions, and patterns mentioned in the issue.
Identify the affected packages, modules, and code paths.
Check recent changes to the affected area.
Return { affectedFiles: string[], affectedPackages: string[], rootCause: string, reproSteps: string | null }.`,
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
Based on the research, apply labels for:
- Type: bug, feature, enhancement, question, documentation, refactor, test
- Component: sdk, agent-mux, transport-mux, hooks-mux, breakpoints-mux, atlas, agent-catalog, triggers, ci, plugins
- Effort: effort:small, effort:medium, effort:large

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
Consider: impact (users affected), severity (crash vs cosmetic), urgency (blocking?), complexity.
Apply the priority label: gh issue edit ${args.issue.number} --add-label "priority:<level>"
Create the label if needed: gh label create "priority:<level>" --description "<desc>" --color "<hex>" 2>/dev/null || true
Return { level: "critical" | "high" | "medium" | "low", reasoning: string }.`,
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
- **Summary**: one-line description
- **Root Cause Analysis**: affected files, functions, likely cause from research
- **Affected Components**: packages and modules involved
- **Reproduction**: steps to reproduce (if a bug)
- **Suggested Approach**: how to fix/implement (high-level)
- **Estimated Effort**: ${args.classification.effort} with justification
- **Related Issues/PRs**: links to related work found during research
- **Priority**: ${args.priority.level} — ${args.priority.reasoning}

If the issue is well-understood and ready for development:
- Assign a5c-agent: gh issue edit ${args.issue.number} --add-assignee "a5c-agent"
- Add ready-for-dev label: gh issue edit ${args.issue.number} --add-label "ready-for-dev"
  (create if needed: gh label create "ready-for-dev" --description "Triaged and ready for development" --color "0E8A16" 2>/dev/null || true)
- Include "/plan ready for development" at the end of the comment so the planning agent can pick it up.

If the issue needs more info, add "needs-info" label and ask questions instead.

Post the comment: gh issue comment ${args.issue.number} --body "<markdown>"

Return { readyForDev: boolean, commentPosted: true }.`,
    },
  };
});
