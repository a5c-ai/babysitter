import { defineTask } from '@a5c-ai/babysitter-sdk';
import { correlateExactHeadQa, normalizeLiveQaResult } from './ci-qa-review-contract.mjs';

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
  const dispatchEvidence = await ctx.task(dispatchLiveStackTask, { prNumber: inputs.prNumber, branch: inputs.branch, matrix });
  const dispatch = correlateExactHeadQa(dispatchEvidence);

  if (!dispatch.runId) {
    await ctx.task(reportBlockedTask, { prNumber: inputs.prNumber, reason: dispatch.reason });
    return { dispatched: false, passed: false, reportPosted: true };
  }

  const rawResults = await ctx.task(waitForResultsTask, {
    runId: dispatch.runId,
    expectedHeadSha: dispatchEvidence.expectedHeadSha,
  });
  const results = normalizeLiveQaResult(rawResults);
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
      instruction: `Dispatch the trusted staging live-stack workflow while making its existing ref input check out the immutable PR head SHA.
Resolve the current PR head SHA with: gh pr view ${args.prNumber} --json headRefOid --jq '.headRefOid'. Require a full 40-hex SHA; branch names and refs/pull aliases are not exact-head evidence.
Resolve and retain the current trusted staging SHA with: gh api repos/{owner}/{repo}/git/ref/heads/staging --jq '.object.sha'.
Immediately before dispatch, snapshot run IDs with: gh run list --workflow=live-stack.yml --event=workflow_dispatch --branch=staging --limit=100 --json databaseId. Then run: gh workflow run live-stack.yml --ref staging -f ref="$head_sha" -f matrix='${JSON.stringify(args.matrix)}'
Do not pass repository, request_id, or any other input absent from the trusted staging workflow. Poll briefly for registration, then return { trustedStagingSha, expectedHeadSha, beforeRunIds: number[], candidates: [{ databaseId, event, headBranch, headSha }] }. candidates must be the unfiltered post-dispatch result of: gh run list --workflow=live-stack.yml --event=workflow_dispatch --branch=staging --limit=100 --json databaseId,event,headBranch,headSha.
Do not select a run ID yourself. The process compares the before/after snapshots and accepts exactly one new workflow_dispatch run whose branch is staging and whose workflow-definition head SHA equals the captured trusted staging SHA. Zero or multiple matches, a moving staging ref, and invalid IDs all fail closed.`,
    },
  };
});

const waitForResultsTask = defineTask('wait-for-results', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Wait for live-stack results',
    labels: ['qa', 'poll'],
    io: {
      instruction: `Poll live-stack run ${args.runId} until completion.
Run: gh run view ${args.runId} --json status,conclusion. Check every 60 seconds and timeout after 120 minutes so the workflow's 90-minute scenario budget can finish.
After completion, fetch every job with databaseId, name, conclusion, and steps. Return jobs as [{ name, conclusion }]; an empty list is failure evidence, never green.
For every job containing a step named "Checkout repository", require that step to conclude success and download that job's raw log. Accept a head SHA only when the log contains exactly one actions/checkout command marker ending in git log -1 --format=%H and its immediately following log line ends in one full 40-hex commit. This is the checkout action's observed HEAD even when gh labels raw action lines UNKNOWN STEP. Do not infer it from the branch, dispatch input, expected SHA, another command, or a shortened "HEAD is now at" line. Missing or ambiguous checkout evidence yields headSha: null.
Return { jobs, checkouts: [{ jobName, conclusion, headSha }], conclusion, expectedHeadSha: "${args.expectedHeadSha}" }. The process independently requires a successful workflow, non-empty successful jobs including at least one Live Stack scenario job, successful checkout steps, and every observed checkout SHA equal to the immutable expected head.`,
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
