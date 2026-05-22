import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/qa-review
 * @description QA review for a PR: analyze changes, select live-stack test matrix, dispatch, wait, and report results.
 * @inputs { prNumber: number, branch: string, instructions: string }
 * @outputs { dispatched: boolean, passed: boolean, reportPosted: boolean }
 */

export async function process(inputs, ctx) {
  const pr = await ctx.task(readPrTask, { prNumber: inputs.prNumber });
  const guide = await ctx.task(readQaGuideTask, {});
  const matrix = await ctx.task(selectMatrixTask, { pr, guide, instructions: inputs.instructions });
  const dispatch = await ctx.task(dispatchLiveStackTask, { branch: inputs.branch, matrix });

  if (!dispatch.runId) {
    await ctx.task(reportBlockedTask, { prNumber: inputs.prNumber, reason: dispatch.reason });
    return { dispatched: false, passed: false, reportPosted: true };
  }

  const results = await ctx.task(waitForResultsTask, { runId: dispatch.runId });
  await ctx.task(postResultsTask, { prNumber: inputs.prNumber, runId: dispatch.runId, results, matrix });

  return { dispatched: true, passed: results.allPassed, reportPosted: true };
}

const readPrTask = defineTask('read-pr', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Read PR details and changed files',
    labels: ['qa', 'research'],
    io: {
      instruction: `Read PR #${args.prNumber} thoroughly.
Run: gh pr view ${args.prNumber} --json files,title,body,comments,labels,headRefName
Identify which components are affected by the changes:
- transport-mux changes → test multiple providers/models
- adapter changes → test the specific harness
- launch.ts changes → test multiple harnesses across modes
- atlas/agent-catalog changes → test adapters that read from the graph
- babysitter SDK/plugin changes → test BP mode (predefined + create)
- hooks-mux changes → test bridged-hooks mode
Return { title, files, components, headRef }.`,
    },
  };
});

const readQaGuideTask = defineTask('read-qa-guide', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Read QA guide for test axes',
    labels: ['qa', 'research'],
    io: {
      instruction: `Read the QA guide for available test scenarios.
Run: cat docs/development/07-live-stack-qa-guide.md (if it exists, otherwise skip)
Also check the live-stack workflow for available matrix options:
Run: head -50 .github/workflows/live-stack.yml
Return the available agents, models, modes, install types, and process_modes.`,
    },
  };
});

const selectMatrixTask = defineTask('select-matrix', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Select focused test matrix based on PR changes',
    labels: ['qa', 'planning'],
    io: {
      instruction: `Select a focused live-stack test matrix for the PR.
PR affects components: ${JSON.stringify(args.pr?.components ?? [])}
${args.instructions ? `Custom instructions: ${args.instructions}` : ''}

Choose a focused set of test combinations — not the full cross-product, but enough to cover the affected paths.
The JSON format is: [{"agent":"...","model":"...","mode":"...","install":"...","live":true,"process_mode":"..."}]
- agent: codex, claude, pi, gemini, copilot, hermes
- model: foundry-gpt55, google-gemini31, anthropic-claude-sonnet
- mode: interactive, non-interactive, bridged-interactive, bridged-hooks
- install: vanilla, bp
- process_mode: predefined, create

Return { matrix: <JSON array>, reasoning: string }.`,
    },
  };
});

const dispatchLiveStackTask = defineTask('dispatch-live-stack', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Dispatch live-stack workflow',
    labels: ['qa', 'dispatch'],
    io: {
      instruction: `Dispatch the live-stack workflow with the selected matrix.
Run: gh workflow run live-stack.yml --ref ${args.branch || 'staging'} -f matrix='${JSON.stringify(args.matrix)}'
Then get the run ID: gh run list --workflow=live-stack.yml --limit=1 --json databaseId --jq '.[0].databaseId'
Return { runId: number | null, reason: string | null }.`,
    },
  };
});

const waitForResultsTask = defineTask('wait-for-results', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Wait for live-stack results',
    labels: ['qa', 'poll'],
    io: {
      instruction: `Poll the live-stack run until completion.
Run: gh run view ${args.runId} --json status,conclusion --jq '{status, conclusion}'
Check every 60 seconds. Timeout after 20 minutes.
Once complete, get job results: gh run view ${args.runId} --json jobs --jq '.jobs[] | {name: .name, conclusion: .conclusion}'
Return { allPassed: boolean, jobs: [{name, conclusion}], conclusion: string }.`,
    },
  };
});

const reportBlockedTask = defineTask('report-blocked', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Report QA blocked',
    labels: ['qa', 'report'],
    io: {
      instruction: `Post a comment on PR #${args.prNumber} that QA is blocked.
Reason: ${args.reason}
Run: gh pr comment ${args.prNumber} --body "## Live-stack QA\\n\\nResult: **blocked**. ${args.reason}"`,
    },
  };
});

const postResultsTask = defineTask('post-results', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Post QA results to PR',
    labels: ['qa', 'report'],
    io: {
      instruction: `Post live-stack QA results on PR #${args.prNumber}.
Run URL: https://github.com/a5c-ai/babysitter/actions/runs/${args.runId}
Results: ${JSON.stringify(args.results?.jobs ?? [])}

Build a markdown table with job name and result (pass/fail).
Include the matrix that was tested: ${JSON.stringify(args.matrix)}
State the overall verdict: all passed or which failed.

Run: gh pr comment ${args.prNumber} --body "<markdown>"`,
    },
  };
});
