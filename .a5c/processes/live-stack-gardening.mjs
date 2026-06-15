import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process ci/live-stack-gardening
 * @description Iterate on the live-stack test matrix: collect failures, investigate root causes,
 *   fix issues in code, dispatch tests, update the QA Evidence wiki, and repeat until convergence.
 * @inputs { repo: string, wikiPath: string }
 * @outputs { passCount: number, failCount: number, blockedCount: number, fixesLanded: number, issuesClosed: number }
 */

export async function process(inputs, ctx) {
  const state = await ctx.task(collectCurrentStateTask, { repo: inputs.repo, wikiPath: inputs.wikiPath });

  const failures = await ctx.task(harvestFailuresTask, { repo: inputs.repo });

  const investigation = await ctx.task(investigateFailuresTask, { repo: inputs.repo, failures, state });

  const fixes = await ctx.task(implementFixesTask, { repo: inputs.repo, investigation });

  const dispatches = await ctx.task(dispatchTestsTask, { repo: inputs.repo, investigation, fixes });

  const results = await ctx.task(collectResultsTask, { repo: inputs.repo, dispatches });

  const wikiUpdate = await ctx.task(updateWikiTask, { repo: inputs.repo, wikiPath: inputs.wikiPath, results, state });

  const issueUpdate = await ctx.task(updateIssuesTask, { repo: inputs.repo, results, investigation });

  return {
    passCount: wikiUpdate.passCount,
    failCount: wikiUpdate.failCount,
    blockedCount: wikiUpdate.blockedCount,
    fixesLanded: fixes.count,
    issuesClosed: issueUpdate.closed,
  };
}

const collectCurrentStateTask = defineTask('collect-current-state', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Collect current wiki state and open issues',
    labels: ['gardening', 'research'],
    io: {
      instruction: `Assess the current state of the live-stack test matrix.

1. Read the QA Evidence wiki page:
   - Clone/pull the wiki: cd ${args.wikiPath} && git pull
   - Read QA-Evidence.md
   - Count PASS, FAIL, blocked, and pending (---) cells
   - Group blocked cells by issue number

2. List open live-stack issues:
   gh issue list --state open --label live-stack --json number,title,labels

3. Check recent CI runs for any new results not yet in the wiki:
   gh run list --workflow=live-stack.yml --limit=10 --json databaseId,status,conclusion

4. Identify the top blockers by cell count.

Return {
  passCount: number,
  failCount: number,
  blockedCount: number,
  pendingCount: number,
  blockersByIssue: [{issue: number, count: number, title: string}],
  recentRuns: [{runId: string, status: string}],
  openIssues: [{number: number, title: string}]
}.`,
    },
  };
});

const harvestFailuresTask = defineTask('harvest-failures', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Harvest failures and new results from recent CI runs',
    labels: ['gardening', 'collect'],
    io: {
      instruction: `Collect all PASS and FAIL results from recent live-stack CI runs.

1. List recent completed runs:
   gh run list --workflow=live-stack.yml --limit=20 --json databaseId,status,conclusion,createdAt

2. For each completed run, extract job results:
   gh api repos/${args.repo}/actions/runs/{runId}/jobs --jq '.jobs[] | select(.name | startswith("Live Stack")) | select(.name | contains("Report") | not) | "\\(.conclusion) \\(.name)"'

3. Collect all SUCCESS results — these can flip wiki cells to PASS.

4. Collect all FAILURE results — download artifacts for the top 5 most impactful failures:
   gh run download {runId} -n "{artifactName}" -D /tmp/failure-{runId}
   Read verification-report.md and agent-output.txt from each artifact.

5. Group failures by pattern:
   - Install failures (agent didn't install)
   - Proxy failures (proxy started but 0 requests)
   - Model response failures (model responded but didn't create file)
   - Auth failures (401/403)
   - Timeout failures
   - Config failures

Return {
  newPasses: [{agent, model, os, mode, runId}],
  failures: [{agent, model, os, mode, runId, pattern, errorSummary}],
  failurePatterns: [{pattern: string, count: number, agents: string[]}]
}.`,
    },
  };
});

const investigateFailuresTask = defineTask('investigate-failures', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Investigate failure root causes',
    labels: ['gardening', 'investigate'],
    io: {
      instruction: `Investigate each failure pattern to determine root causes and fixability.

For each failure pattern from the harvest:

1. **Read the code** that handles the failing agent/mode combination:
   - Launch code: packages/adapters/launch/src/launch.ts
   - Provider translations: packages/atlas/graph/extensions/provider-translations/
   - Launch behavior: packages/atlas/graph/extensions/plugin-artifacts/plugin-target-{agent}.yaml
   - Test runner: packages/adapters/cli/tests/live-stack/primary-live-runner.ts

2. **Check if there's an existing open issue** for this failure pattern.

3. **Determine fixability**:
   - Code-fixable: can be fixed by changing launch.ts, translations, atlas graph, or workflow
   - Config-fixable: needs CI secrets, env vars, or workflow changes
   - Upstream-blocked: needs external party action (API keys, billing, upstream agent changes)
   - Model-behavior: model doesn't follow instructions (prompt engineering needed)

4. **For code-fixable issues**, identify the specific change needed:
   - Which file to change
   - What the change is
   - Expected impact (how many cells would flip)

5. **For each issue**, decide: fix now, file issue, or skip.

Return {
  fixable: [{pattern, file, change, impact, priority}],
  needsIssue: [{pattern, title, body}],
  upstream: [{pattern, blocker, cellCount}]
}.`,
    },
  };
});

const implementFixesTask = defineTask('implement-fixes', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Implement code fixes for fixable issues',
    labels: ['gardening', 'fix'],
    io: {
      instruction: `Implement fixes for all code-fixable issues identified in the investigation.

For each fixable issue (sorted by impact — highest first):

1. Make the code change in the identified file.
2. Build the affected package: npm run build --workspace=<package>
3. Verify the build passes.
4. Commit with a descriptive message referencing the issue number.
5. Push to staging.

Important rules:
- Never write fallbacks — fix the root cause
- Keep changes minimal and focused
- Don't add abstractions beyond what's needed
- Test locally if possible before pushing

For issues that need new GitHub issues filed:
- gh issue create --title "<title>" --body "<body>" --label live-stack

After all fixes:
- git push origin staging

Return { count: number, commits: [{sha, message, impact}], issuesFiled: number }.`,
    },
  };
});

const dispatchTestsTask = defineTask('dispatch-tests', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Dispatch live-stack tests for fixed and uncovered cells',
    labels: ['gardening', 'dispatch'],
    io: {
      instruction: `Dispatch live-stack CI tests to verify fixes and cover uncovered cells.

Strategy: dispatch in PARALLEL to avoid sequential bottlenecks.

1. **Verification tests**: For each fix landed, dispatch the specific agent/model/mode/OS
   combination that was broken. Use workflow_dispatch with the correct matrix JSON.

2. **Coverage expansion**: Identify wiki cells showing "---" (pending) or old blocked
   issues that may now be fixed. Dispatch tests for those too.

3. **Parallel dispatch**: Send multiple gh workflow run commands — don't wait between them.
   Group by OS to minimize the number of runs:

   gh workflow run live-stack.yml --ref staging -f os=ubuntu-latest-l -f 'matrix=[...]'
   gh workflow run live-stack.yml --ref staging -f os=macos-latest -f 'matrix=[...]'
   gh workflow run live-stack.yml --ref staging -f os=windows-latest -f 'matrix=[...]'

4. **Matrix format**: Each entry needs: agent, model, mode, install, live.
   Example: {"agent":"hermes","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true}

Return { dispatched: number, runs: [{runId, os, agents, models}] }.`,
    },
  };
});

const collectResultsTask = defineTask('collect-results', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Wait for and collect test results',
    labels: ['gardening', 'collect'],
    io: {
      instruction: `Poll for dispatched test results and collect them.

1. Wait for runs to complete — poll every 60 seconds for up to 20 minutes:
   gh run list --workflow=live-stack.yml --limit=10 --json databaseId,status,conclusion

2. For each completed run, extract PASS/FAIL results:
   gh api repos/${args.repo}/actions/runs/{runId}/jobs --jq '...'

3. For failures, download artifacts and read verification reports to understand why.

4. Group results:
   - New PASS cells (can update wiki)
   - Confirmed FAIL cells (need investigation or issue update)
   - Flaky cells (passed before, failed now — or vice versa)

Return {
  passes: [{agent, model, os, mode, runId}],
  failures: [{agent, model, os, mode, runId, reason}],
  flaky: [{agent, model, os, mode, history}]
}.`,
    },
  };
});

const updateWikiTask = defineTask('update-wiki', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Update QA Evidence wiki with new results',
    labels: ['gardening', 'wiki'],
    io: {
      instruction: `Update the QA Evidence wiki page with all new results.

1. Pull latest wiki: cd ${args.wikiPath} && git pull

2. For each new PASS result:
   - Find the section (Vanilla NI/BI, BP/Predefined/Create/Resume × Interactive/BH)
   - Find the model subsection
   - Find the agent row
   - Update the OS column from FAIL/blocked/--- to [PASS](run URL)

3. For new FAIL results without a blocking issue:
   - Add "blocked [#NNN](...) — [FAIL](...)" with the appropriate issue

4. Recount cells: PASS, FAIL, blocked, pending.

5. Commit and push:
   cd ${args.wikiPath}
   git add -A
   git commit -m "Gardening: update QA matrix with N new PASS cells"
   git push

Return { passCount: number, failCount: number, blockedCount: number, cellsFlipped: number }.`,
    },
  };
});

const updateIssuesTask = defineTask('update-issues', async (args, ctx) => {
  return {
    kind: 'node',
    title: 'Update GitHub issues with test results',
    labels: ['gardening', 'issues'],
    io: {
      instruction: `Update open live-stack GitHub issues with the latest test results.

1. For issues where the fix was verified (all blocked cells now PASS):
   - Post a verification comment with run links
   - Close the issue: gh issue close {number} --reason completed

2. For issues where the fix partially worked:
   - Post a progress comment listing which cells now PASS and which still FAIL
   - Keep the issue open

3. For issues where the fix didn't help:
   - Post a comment explaining what was tried and why it didn't work
   - Keep the issue open with updated investigation notes

4. For new failures without an existing issue:
   - Create a new issue: gh issue create --title "..." --body "..." --label live-stack

Return { closed: number, updated: number, created: number }.`,
    },
  };
});
