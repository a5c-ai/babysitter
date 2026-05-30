import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/github-gardening
 * @description Garden open GitHub issues and PRs: triage untriaged issues, dispatch plans for unblocked ready-for-dev issues, dispatch agents on plan PRs, dispatch reviews on implemented PRs, fix conflicts on stuck PRs, and merge approved PRs.
 * @inputs { repo: string, excludePatterns: string[] }
 * @outputs { triaged: number, planned: number, agentsDispatched: number, reviewed: number, conflictFixed: number, merged: number, closed: number }
 */

export async function process(inputs, ctx) {
  const repo = inputs.repo ?? 'a5c-ai/babysitter';
  const excludePatterns = inputs.excludePatterns ?? ['live-stack', 'Live-stack', 'Live Stack', 'graph update', 'atlas.*version', 'atlas.*track'];
  const maxRounds = inputs.maxRounds ?? 10;
  const totals = { triaged: 0, planned: 0, agentsDispatched: 0, reviewed: 0, conflictFixed: 0, merged: 0, closed: 0 };

  for (let round = 1; round <= maxRounds; round++) {
    // Assess current state
    const state = await ctx.task(assessStateTask, { repo, excludePatterns, round });

    const workToDo =
      (state.untriaged?.length ?? 0) +
      (state.issuesWithoutPRs?.length ?? 0) +
      (state.planPRs?.length ?? 0) +
      (state.stalledAgentPRs?.length ?? 0) +
      (state.conflictedPRs?.length ?? 0) +
      (state.implementedPRs?.length ?? 0) +
      (state.mergeablePRs?.length ?? 0);

    if (workToDo === 0 && (state.openIssueCount ?? 0) === 0 && (state.openPRCount ?? 0) === 0) {
      return { ...totals, rounds: round, converged: true };
    }

    if (state.untriaged?.length > 0) {
      await ctx.task(triageIssuesTask, { repo, issues: state.untriaged });
      totals.triaged += state.untriaged.length;
    }

    if (state.issuesWithoutPRs?.length > 0) {
      await ctx.task(dispatchPlansTask, { repo, issues: state.issuesWithoutPRs });
      totals.planned += state.issuesWithoutPRs.length;
    }

    if (state.planPRs?.length > 0) {
      await ctx.task(dispatchAgentsOnPlanPRsTask, { repo, prs: state.planPRs });
      totals.agentsDispatched += state.planPRs.length;
    }

    if (state.stalledAgentPRs?.length > 0) {
      await ctx.task(redispatchStalledAgentsTask, { repo, prs: state.stalledAgentPRs });
      totals.agentsDispatched += state.stalledAgentPRs.length;
    }

    if (state.conflictedPRs?.length > 0) {
      await ctx.task(fixConflictsTask, { repo, prs: state.conflictedPRs });
      totals.conflictFixed += state.conflictedPRs.length;
    }

    if (state.implementedPRs?.length > 0) {
      await ctx.task(dispatchReviewsTask, { repo, prs: state.implementedPRs });
      totals.reviewed += state.implementedPRs.length;
    }

    if (state.mergeablePRs?.length > 0) {
      await ctx.task(mergePRsTask, { repo, prs: state.mergeablePRs });
      totals.merged += state.mergeablePRs.length;
    }

    const closeResult = await ctx.task(closeResolvedIssuesTask, { repo, excludePatterns });
    totals.closed += closeResult?.closed ?? 0;

    if (workToDo === 0) {
      return { ...totals, rounds: round, converged: true, note: 'No actionable work but items still open — waiting on async workflows' };
    }
  }

  return { ...totals, rounds: maxRounds, converged: false };
}

const assessStateTask = defineTask('assess-state', (args) => ({
  kind: 'agent',
  title: `Assess GitHub issue and PR state (round ${args.round ?? 1})`,
  agent: {
    name: 'State Assessor',
    prompt: [
      `Assess the current state of GitHub issues and PRs in ${args.repo}.`,
      '',
      'Run these commands and categorize everything:',
      '',
      '1. List all open issues (excluding patterns: ' + JSON.stringify(args.excludePatterns) + '):',
      `   gh issue list --repo ${args.repo} --state open --json number,title,labels --limit 200`,
      '',
      '2. List all open PRs with commit counts:',
      `   gh pr list --repo ${args.repo} --state open --json number,title,commits,headRefName,mergeable`,
      '',
      '3. Categorize into:',
      '   - untriaged: issues missing "ready-for-dev" label',
      '   - issuesWithoutPRs: open issues with no matching open PR (by branch name plan/issue-N)',
      '   - planPRs: PRs with title starting "Plan:" (need rename + agent dispatch)',
      '   - stalledAgentPRs: PRs with exactly 1 commit and title starting "feat:" (agent dispatched but may have stalled)',
      '   - conflictedPRs: PRs with 2+ commits and mergeable=CONFLICTING',
      '   - implementedPRs: PRs with 2+ commits and mergeable=MERGEABLE (need review)',
      '   - mergeablePRs: PRs with 2+ commits that are mergeable and have review comments',
      '',
      'Return JSON with arrays of issue/PR numbers for each category, plus:',
      '   - openIssueCount: total number of open issues in scope',
      '   - openPRCount: total number of open PRs',
      'IMPORTANT: Do NOT close, merge, or modify anything. Only assess and categorize.',
    ].join('\n'),
  },
}));

const triageIssuesTask = defineTask('triage-issues', (args) => ({
  kind: 'agent',
  title: 'Dispatch triage on untriaged issues',
  agent: {
    name: 'Triage Dispatcher',
    prompt: [
      `Dispatch triage on these untriaged issues in ${args.repo}:`,
      JSON.stringify(args.issues),
      '',
      'For each issue number, run:',
      `  gh workflow run "Issue Triage Dispatch" --repo ${args.repo} --ref staging -f issue_number=<N>`,
      '',
      'Report how many were dispatched.',
    ].join('\n'),
  },
}));

const dispatchPlansTask = defineTask('dispatch-plans', (args) => ({
  kind: 'agent',
  title: 'Dispatch plans for issues without PRs',
  agent: {
    name: 'Plan Dispatcher',
    prompt: [
      `Dispatch Agent Plan Dispatch for these issues without PRs in ${args.repo}:`,
      JSON.stringify(args.issues),
      '',
      'For each issue number, run:',
      `  gh workflow run "Agent Plan Dispatch" --repo ${args.repo} --ref staging -f branch=staging -f issue_number=<N> -f instructions="Create implementation plan for issue #<N>. Read the issue body for context."`,
      '',
      'Report how many were dispatched.',
    ].join('\n'),
  },
}));

const dispatchAgentsOnPlanPRsTask = defineTask('dispatch-agents-on-plans', (args) => ({
  kind: 'agent',
  title: 'Rename Plan: PRs and dispatch agents',
  agent: {
    name: 'Agent Dispatcher',
    prompt: [
      `For each Plan: PR in ${args.repo}, rename it and dispatch an agent:`,
      JSON.stringify(args.prs),
      '',
      'For each PR number:',
      '1. Get the branch name: gh pr view <PR> --json headRefName --jq .headRefName',
      '2. Extract issue number from branch: plan/issue-<N> → N',
      '3. Rename PR: gh api repos/' + args.repo + '/pulls/<PR> -X PATCH -f title="feat: <description>"',
      '   (remove "Plan: " prefix, add "feat: " prefix)',
      `4. Dispatch agent: gh workflow run "Agent Dispatch" --repo ${args.repo} --ref staging -f branch=<branch> -f issue_number=<PR> -f instructions="Implement the plan in PR #<PR> for issue #<N>."`,
      '',
      'Report how many were processed.',
    ].join('\n'),
  },
}));

const redispatchStalledAgentsTask = defineTask('redispatch-stalled-agents', (args) => ({
  kind: 'agent',
  title: 'Redispatch agents on stalled 1-commit PRs',
  agent: {
    name: 'Stalled Agent Fixer',
    prompt: [
      `These PRs in ${args.repo} have only 1 commit (plan only, agent may have stalled):`,
      JSON.stringify(args.prs),
      '',
      'For each PR:',
      '1. Get branch: gh pr view <PR> --json headRefName --jq .headRefName',
      '2. Extract issue from branch name',
      `3. Dispatch agent: gh workflow run "Agent Dispatch" --repo ${args.repo} --ref staging -f branch=<branch> -f issue_number=<PR> -f instructions="Implement the plan in PR #<PR>."`,
      '',
      'Report how many were redispatched.',
    ].join('\n'),
  },
}));

const fixConflictsTask = defineTask('fix-conflicts', (args) => ({
  kind: 'agent',
  title: 'Fix conflicts on stuck PRs',
  agent: {
    name: 'Conflict Fixer',
    prompt: [
      `These PRs in ${args.repo} have merge conflicts:`,
      JSON.stringify(args.prs),
      '',
      'For each PR number, dispatch the conflict fix workflow:',
      `  gh workflow run "Agent Conflict Fix" --repo ${args.repo} --ref staging -f pr_number=<N>`,
      '',
      'Report how many were dispatched.',
    ].join('\n'),
  },
}));

const dispatchReviewsTask = defineTask('dispatch-reviews', (args) => ({
  kind: 'agent',
  title: 'Dispatch reviews on implemented PRs',
  agent: {
    name: 'Review Dispatcher',
    prompt: [
      `These PRs in ${args.repo} have implementations (2+ commits, mergeable):`,
      JSON.stringify(args.prs),
      '',
      'For each PR number, dispatch a review:',
      `  gh workflow run "Agent Review Dispatch" --repo ${args.repo} --ref staging -f pr_number=<N>`,
      '',
      'Report how many were dispatched.',
    ].join('\n'),
  },
}));

const mergePRsTask = defineTask('merge-prs', (args) => ({
  kind: 'agent',
  title: 'Merge reviewed PRs',
  agent: {
    name: 'PR Merger',
    prompt: [
      `These PRs in ${args.repo} are implemented and reviewed — try merging:`,
      JSON.stringify(args.prs),
      '',
      'For each PR number:',
      `  gh pr merge <N> --repo ${args.repo} --squash`,
      '',
      'Do NOT use --delete-branch. Report which merged and which had conflicts.',
    ].join('\n'),
  },
}));

const closeResolvedIssuesTask = defineTask('close-resolved-issues', (args) => ({
  kind: 'agent',
  title: 'Close issues linked to merged PRs',
  agent: {
    name: 'Issue Closer',
    prompt: [
      `Check for open issues in ${args.repo} whose linked PRs have been merged.`,
      '',
      '1. List recently merged PRs: gh pr list --state merged --limit 50 --json number,headRefName,mergedAt',
      '2. For each merged PR, extract issue number from branch (plan/issue-<N>)',
      '3. Check if issue is still open: gh issue view <N> --json state',
      '4. If open, close it: gh issue close <N> --comment "Closed by PR #<PR> merge."',
      '',
      'Exclude issues matching: ' + JSON.stringify(args.excludePatterns),
      '',
      'Report how many were closed.',
    ].join('\n'),
  },
}));
