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
  const dispatch = await ctx.task(dispatchLiveStackTask, { prNumber: inputs.prNumber, branch: inputs.branch, matrix });

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
- agent: codex, claude, pi, gemini, copilot, hermes, omp
- model: foundry-gpt55, google-gemini31, google-gemini31pro, anthropic-sonnet46
- mode: ni, interactive, bridged-interactive, bridged-hooks
- install: vanilla, bp
- process_mode: predefined, create

OMP requires Bun at runtime and supports only ni mode in this non-TTY CI workflow. Do not select interactive, bridged-interactive, or bridged-hooks for OMP because the runner converts non-TTY interactive execution to bridge-hooks and OMP's cataloged bridge capability is false.

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
      instruction: `Dispatch the live-stack workflow definition from staging and make it check out the exact PR mergeable head ref.
First run: git diff --quiet origin/staging...HEAD -- .github/workflows/live-stack.yml
If that exits nonzero, do not dispatch: the trusted staging definition cannot exercise workflow changes from this PR. Return { runId: null, reason: "Pre-merge live-stack validation is blocked because this PR changes .github/workflows/live-stack.yml" }.
Otherwise create a unique request ID, record the current staging SHA, and dispatch with both values:
Run: request_id=qa-${args.prNumber || 'branch'}-$(date -u +%Y%m%dT%H%M%SZ)-$RANDOM; staging_sha=$(gh api repos/{owner}/{repo}/git/ref/heads/staging --jq '.object.sha'); gh workflow run live-stack.yml --ref staging -f request_id="$request_id" -f ref='${args.prNumber ? `refs/pull/${args.prNumber}/head` : (args.branch || 'staging')}' -f matrix='${JSON.stringify(args.matrix)}'
Find the run by its exact unique display title, never by latest-run ordering: gh run list --workflow=live-stack.yml --event=workflow_dispatch --branch=staging --limit=100 --json databaseId,displayTitle,event,headBranch,headSha | jq --arg title "Live Stack QA $request_id" --arg sha "$staging_sha" '[.[] | select(.displayTitle == $title and .event == "workflow_dispatch" and .headBranch == "staging" and .headSha == $sha)]'
Poll briefly for registration. Accept exactly one matching run; zero after polling or multiple matches are blocked correlation failures. Return { runId: number | null, reason: string | null }.`,
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
