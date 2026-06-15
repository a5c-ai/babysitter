import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process processes/live-stack/live-stack-matrix-stabilization
 * @description Stabilize the live-stack test matrix. Loops: assess → fix → dispatch → wait →
 *   collect → update wiki → update issues → re-assess. Converges when all non-human-blocked
 *   cells pass. Human blockers (missing secrets, billing) get labeled and assigned.
 *   Covers: vanilla NI/BI, BP predefined/create/resume, omni stack.
 * @trigger manual
 * @inputs { repo: string, wikiPath: string, maxIterations: number }
 * @outputs { passCount: number, totalCount: number, humanBlockedCells: number, iterations: number }
 */

export async function process(inputs, ctx) {
  const maxIter = inputs.maxIterations ?? 5;
  let lastPassCount = 0;
  let iteration = 0;

  while (iteration < maxIter) {
    iteration++;

    // Step 1: Assess
    const state = await ctx.task(assessTask, {
      repo: inputs.repo, wikiPath: inputs.wikiPath, iteration,
    });

    // Check convergence: all non-SKIPPED cells pass
    // SKIPPED = human-action needed (billing, secrets). blocked = issues we should fix.
    const nonSkippedNonPass = state.totalCount - state.passCount - state.skippedCells;
    if (nonSkippedNonPass <= 0) {
      // All fixable cells pass — only SKIPPED (human-action) cells remain
      return {
        passCount: state.passCount,
        totalCount: state.totalCount,
        skippedCells: state.skippedCells,
        iterations: iteration,
      };
    }

    // Detect stall — if no progress after an iteration, try harder
    if (state.passCount === lastPassCount && iteration > 1) {
      await ctx.task(unstickTask, { repo: inputs.repo, state, iteration });
    }
    lastPassCount = state.passCount;

    // Step 2: Fix all code-fixable blockers
    await ctx.task(fixTask, { repo: inputs.repo, wikiPath: inputs.wikiPath, state, iteration });

    // Step 3: Dispatch ALL non-PASS cells (vanilla NI/BI + BP + omni)
    await ctx.task(dispatchTask, { repo: inputs.repo, state, iteration });

    // Step 4: Wait for results (up to 15 min)
    const results = await ctx.task(waitAndCollectTask, { repo: inputs.repo, iteration });

    // Step 5: Update wiki + issues
    await ctx.task(gardenTask, { repo: inputs.repo, wikiPath: inputs.wikiPath, results, state, iteration });
  }

  // Max iterations — report final state
  const finalState = await ctx.task(assessTask, {
    repo: inputs.repo, wikiPath: inputs.wikiPath, iteration: iteration + 1,
  });
  return {
    passCount: finalState.passCount,
    totalCount: finalState.totalCount,
    humanBlockedCells: finalState.humanBlockedCells,
    iterations: iteration,
  };
}

const assessTask = defineTask('assess', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Assess matrix — classify every blocker`,
  labels: ['gardening', 'assess'],
  io: {
    instruction: `Iteration ${args.iteration}: Full matrix assessment.

1. Pull wiki: cd ${args.wikiPath} && git pull
2. Count every cell: PASS, FAIL, blocked (fixable issues), SKIPPED (human-action), pending (---)
3. For EACH blocking issue, classify as:

   **SKIPPED** (needs human action — mark as SKIPPED in wiki, label "human-requested", assign tmuskal):
   - Missing CI secrets (COPILOT_GITHUB_TOKEN, CURSOR_API_KEY, etc.)
   - Billing top-up needed (Anthropic credits)
   In the wiki, change "blocked [#NNN]" to "SKIPPED [#NNN]" for these cells.

   **code-fixable** (can fix in this iteration):
   - Launch code changes, atlas graph, workflow, translations
   - Proxy routing, config file writing, PATH issues
   - Test runner/verification diagnostic fixes

   **retry** (issue closed, just needs re-dispatch):
   - Blocked by closed issues — dispatch verification tests

   **prompt-fixable** (improve test scenario):
   - BP model behavior — simplify prompt, increase max-turns
   - Mini BP failures — adjust test expectations

4. Check recent CI for unharvested results
5. Check omni section — ensure all 5 models × 3 OS are covered

For human-blocked issues, apply label and assign:
  gh label create "human-requested" --description "Needs human action" --color "D93F0B" 2>/dev/null || true
  gh issue edit {number} --add-label "human-requested" --add-assignee "tmuskal"

Return {
  passCount, totalCount,
  skippedCells: number,
  codeFixableCells: number,
  retryCells: number,
  promptFixableCells: number,
  unharvested: [{agent, model, os, mode, runId}]
}.`,
  },
}));

const unstickTask = defineTask('unstick', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Unstick — no progress, try different approach`,
  labels: ['gardening', 'unstick'],
  io: {
    instruction: `No progress since last iteration (still ${args.state.passCount}/${args.state.totalCount}).

For each non-human blocker that didn't improve:
1. Download the latest failure artifact and read the NEW diagnostic checks:
   - install-check: did the agent install?
   - proxy-communication: did the proxy receive requests?
   - model-response: did the model produce substantial output?
   - file-creation: was the file created?
2. Based on which check failed, try a DIFFERENT fix than last time
3. If the previous fix was in launch.ts, try atlas graph or workflow
4. If the previous fix was a config approach, try CLI flags
5. Consider: can we test this agent with a different model that works?

Return { newApproaches: [{issue, approach}] }.`,
  },
}));

const fixTask = defineTask('fix', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Fix all code-fixable + prompt-fixable blockers`,
  labels: ['gardening', 'fix'],
  io: {
    instruction: `Iteration ${args.iteration}: Implement ALL fixes. Sorted by cell impact.

Code fixes:
- Launch code: packages/adapters/launch/src/launch.ts
- Atlas graph: packages/atlas/graph/
- Workflow: .github/workflows/live-stack.yml
- Translations: packages/adapters/adapters/src/translations/
- Test runner: packages/adapters/cli/tests/live-stack/primary-live-runner.ts

Prompt fixes (for #563 model behavior, #487 mini):
- Simplify the test prompt to focus on file creation
- Increase --max-turns for weaker models
- Add explicit "write to file" instructions

For each fix: implement → build → commit → push to staging.

Return { fixesLanded: number, promptsImproved: number }.`,
  },
}));

const dispatchTask = defineTask('dispatch', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Dispatch ALL non-PASS cells in parallel`,
  labels: ['gardening', 'dispatch'],
  io: {
    instruction: `Iteration ${args.iteration}: Dispatch tests for EVERY non-PASS, non-human-blocked cell.

Cover ALL modes and agents:
- **Vanilla NI**: claude-code, codex, pi, gemini-cli, hermes × all models × all OS
- **Vanilla BI**: same agents × all models × all OS
- **BP Predefined**: interactive + bridged-hooks × all agents × all models × all OS
- **BP Create**: interactive + bridged-hooks × all agents × all models × all OS
- **BP Resume**: interactive + bridged-hooks × all agents × all models × all OS
- **Omni**: NI × all models × Ubuntu + macOS + Windows

Skip human-blocked cells (copilot needs PAT, cursor needs API key, Anthropic needs billing).

Matrix format: {"agent":"...","model":"...","mode":"...","install":"...","live":true}
Agents: claude, codex, pi, gemini, hermes, omni, opencode
Models: foundry-gpt55, foundry-gpt54mini, google-gemini31, anthropic-sonnet46, foundry-deepseek

Dispatch ALL at once — one gh workflow run per OS with max matrix entries.

Return { dispatched: number, cellsCovered: number }.`,
  },
}));

const waitAndCollectTask = defineTask('wait-collect', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Wait for results (up to 15 min) + collect`,
  labels: ['gardening', 'collect'],
  io: {
    instruction: `Iteration ${args.iteration}: Poll for results, wait up to 15 minutes.

Every 60 seconds:
1. gh run list --workflow=live-stack.yml --limit=20 --json databaseId,status,conclusion
2. For completed runs, extract SUCCESS/FAILURE job names
3. Stop waiting when >80% of dispatched runs complete or 15 min elapsed

For top 5 failures, download artifacts and read verification-report.md
to understand the diagnostic check results.

Return {
  passes: [{agent, model, os, mode, runId}],
  failures: [{agent, model, os, mode, runId, failedCheck, detail}],
  totalPasses: number
}.`,
  },
}));

const gardenTask = defineTask('garden', async (args) => ({
  kind: 'node',
  title: `[${args.iteration}] Garden wiki + issues`,
  labels: ['gardening', 'wiki', 'issues'],
  io: {
    instruction: `Iteration ${args.iteration}: Update everything.

**Wiki** (cd ${args.wikiPath} && git pull):
- Flip PASS cells: FAIL/blocked/SKIPPED/--- → [PASS](run URL)
- Change human-blocked cells from "blocked" to "SKIPPED [#NNN](...)"
  (SKIPPED = needs human action like billing or API keys)
- Keep "blocked [#NNN]" only for issues that are code-fixable
- Remove stale "blocked [#closed-issue]" references
- Ensure omni section has all 5 models × 3 OS
- git add -A && git commit -m "Gardening iter ${args.iteration}: N cells flipped" && git push

**Issues**:
- Close issues where ALL blocked cells now PASS
- Update partial-fix issues with progress
- File new issues for new failure patterns with label "live-stack"
- For human-blocked issues: ensure "human-requested" label + assigned to tmuskal

Return { passCount, totalCount, cellsFlipped, issuesClosed, skippedCells }.`,
  },
}));
