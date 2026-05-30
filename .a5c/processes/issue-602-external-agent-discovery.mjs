/**
 * @process repo/issue-602-external-agent-discovery
 * @description Implement issue #602: SDK external agent discovery backed by optional agent-mux.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, maxImplementationAttempts?: number }
 * @outputs { success: boolean, diagnosis: object, testAuthoring: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process processes/shared/tdd-triplet
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process specializations/sdk-platform-development/sdk-feature-implementation
 * @process specializations/qa-testing-automation/test-strategy-design
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readSpecAndContextTask = defineTask('issue-602.read-spec-and-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #602, design docs, and SDK/agent-mux context',
  labels: ['issue-602', 'context', 'sdk', 'agent-mux'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- related open prs ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR fixes #${args.issueNumber} in:body OR closes #${args.issueNumber} in:body" --json number,title,headRefName,baseRefName,body,url`,
      'printf "\\n--- design: sdk discovery ---\\n"',
      'sed -n "1,260p" docs/agent-mux-babysitter-integrations/sdk-discovery.md',
      'printf "\\n--- design: testing ---\\n"',
      'sed -n "1,220p" docs/agent-mux-babysitter-integrations/testing.md',
      'printf "\\n--- design: overview/process authoring links ---\\n"',
      'sed -n "1,120p" docs/agent-mux-babysitter-integrations/overview.md',
      'sed -n "1,140p" docs/agent-mux-babysitter-integrations/process-authoring.md',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- current SDK harness exports/discovery ---\\n"',
      'sed -n "1,240p" packages/sdk/src/harness/index.ts',
      'sed -n "1,280p" packages/sdk/src/harness/discovery.ts',
      'sed -n "1,260p" packages/sdk/src/harness/install.ts',
      'sed -n "1,220p" packages/sdk/src/harness/installSupport.ts',
      'sed -n "1,180p" packages/sdk/src/index.ts',
      'printf "\\n--- existing SDK harness tests ---\\n"',
      'find packages/sdk/src/harness/__tests__ -maxdepth 1 -type f | sort',
      'sed -n "1,260p" packages/sdk/src/harness/__tests__/discovery.test.ts',
      'sed -n "1,240p" packages/sdk/src/harness/__tests__/install.test.ts',
      'printf "\\n--- current agent-mux discovery APIs ---\\n"',
      'sed -n "1,260p" packages/agent-mux/core/src/adapter-registry.ts',
      'sed -n "1,220p" packages/agent-mux/core/src/model-registry.ts',
      'sed -n "1,220p" packages/agent-mux/core/src/client.ts',
      'sed -n "1,260p" packages/agent-mux/core/src/adapter.ts',
      'sed -n "1,240p" packages/agent-mux/core/src/capabilities.ts',
      'sed -n "1,220p" packages/agent-mux/cli/src/commands/doctor.ts',
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const root=require(\\"./package.json\\"); const sdk=require(\\"./packages/sdk/package.json\\"); console.log(JSON.stringify({root: root.scripts, sdk: sdk.scripts}, null, 2))"',
      'printf "\\n--- implementation absence check ---\\n"',
      'rg -n "discoverExternalAgents|externalAgentDiscovery" packages/sdk/src docs/agent-mux-babysitter-integrations -S || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-602.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #602 implementation branch',
  labels: ['issue-602', 'git', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `if git rev-parse --verify ${args.branchName} >/dev/null 2>&1; then`,
      `  git switch ${args.branchName}`,
      'else',
      `  git switch -c ${args.branchName} ${args.baseBranch}`,
      'fi',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagnoseTask = defineTask('issue-602.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose SDK external agent discovery implementation path',
  labels: ['issue-602', 'diagnosis', 'sdk', 'agent-mux'],
  agent: {
    name: 'sdk-agent-mux-diagnoser',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Plan the smallest correct implementation path for issue #602 without editing files.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace the runtime call path from the new SDK API through optional agent-mux import, adapter/model registries, CLI fallback, cache, and public exports.',
        'Respect the related-issue boundary: do not implement external task dispatch (#614), host capability ingestion (#616), or full process-prompt injection (#605) unless issue #602 explicitly requires a narrow export/integration hook.',
        'Identify how to normalize agent-mux structured capabilities into the string capabilities array required by the SDK design.',
        'Identify deterministic tests that mock module discovery, CLI fallback, unavailable agent-mux, timeout/failure behavior, and 60s cache/force invalidation.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], targetFiles: string[], publicApiShape: object, normalizationPlan: string[], testPlan: string[], implementationPlan: string[], outOfScope: string[], risks: string[] }.',
      ],
      outputFormat: 'JSON only',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const writeTestsTask = defineTask('issue-602.write-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing SDK tests for external agent discovery',
  labels: ['issue-602', 'tdd', 'tests'],
  agent: {
    name: 'sdk-discovery-test-writer',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Author focused failing tests for issue #602 before implementation.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim JSON):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit only test files unless a tiny test-only fixture is truly necessary.',
        'Primary target: packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts.',
        'Do not read implementation files beyond the context already provided here. Author tests strictly from the spec text and existing test style.',
        'Cover unavailable optional dependency returning available=false, mocked in-process agent-mux discovery, CLI doctor --json fallback, cache hit within 60 seconds, force:true bypass, and graceful timeout/failure handling.',
        'The tests should initially fail because packages/sdk/src/harness/externalAgentDiscovery.ts does not exist or does not satisfy the API yet.',
        'Return JSON: { testFiles: string[], testsWritten: string[], expectedRedReason: string }.',
      ],
      outputFormat: 'JSON only',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runRedTestsTask = defineTask('issue-602.run-red-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Confirm issue #602 tests fail before implementation',
  labels: ['issue-602', 'tdd', 'red'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts',
    ].join('\n'),
    expectedExitCode: 1,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-602.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK external agent discovery API',
  labels: ['issue-602', 'implementation', 'sdk', 'agent-mux'],
  agent: {
    name: 'sdk-agent-mux-implementer',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Implement issue #602 and make the pre-authored tests pass.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim JSON):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'RED TEST OUTPUT (verbatim):',
        '---',
        args.redTestStdout,
        '---',
        'Edit the repository directly.',
        'Expected implementation surface: packages/sdk/src/harness/externalAgentDiscovery.ts, packages/sdk/src/harness/index.ts, packages/sdk/src/index.ts if needed for a direct public export, packages/sdk/src/harness/discovery.ts only if a narrow integration point is required by the spec, and the new externalAgentDiscovery test file.',
        'Keep @a5c-ai/agent-mux optional. Use dynamic import or an equivalent optional import boundary with no static hard dependency in SDK runtime code.',
        'Fallback to `amux doctor --json` when the module import path is unavailable. Normalize missing or partial fields to safe defaults.',
        'Return { available: false, agents: [], defaultProvider: null, defaultModel: null } when neither module nor CLI discovery succeeds.',
        'Implement 60s caching and `force: true` invalidation. Preserve `timeout` and `cwd` options from the design.',
        'Normalize agent-mux adapters into ExternalAgentInfo with name, displayName, installed, authenticated, and string capabilities. Include model/default metadata only if it fits the exported interface or a clearly typed extension without breaking the requested API.',
        'Do not implement external agent task dispatch, host tool discovery, or process prompt injection beyond public API/export plumbing for this issue.',
        'Preserve unrelated worktree changes.',
        'Return JSON: { changedFiles: string[], summary: string, apiShape: object, testsUpdated: string[], verificationCommands: string[] }.',
      ],
      outputFormat: 'JSON only',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-602.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run issue #602 verification gates',
  labels: ['issue-602', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts packages/sdk/src/harness/__tests__/discovery.test.ts packages/sdk/src/harness/__tests__/install.test.ts',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run verify:metadata',
      'git diff --check',
      'rg -n "discoverExternalAgents|ExternalAgentDiscovery|ExternalAgentInfo" packages/sdk/src/harness packages/sdk/src/index.ts',
      'if rg -n "from [\\\"\\x27]@a5c-ai/agent-mux[\\\"\\x27]|require\\([\\\"\\x27]@a5c-ai/agent-mux[\\\"\\x27]\\)" packages/sdk/src/harness/externalAgentDiscovery.ts; then',
      '  echo "externalAgentDiscovery.ts appears to statically require agent-mux; keep the dependency optional" >&2',
      '  exit 1',
      'fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-602.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final issue #602 artifacts for review',
  labels: ['issue-602', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/sdk/src/harness packages/sdk/src/index.ts docs/agent-mux-babysitter-integrations',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-602.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #602 implementation against spec',
  labels: ['issue-602', 'review', 'quality-gate'],
  agent: {
    name: 'sdk-agent-mux-reviewer',
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review the issue #602 implementation against the issue, design, tests, and final artifacts.',
      instructions: [
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification ?? {}, null, 2),
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check optional dependency behavior, CLI fallback, timeout/failure fallback, cache/force semantics, exports, tests with mocks, and issue-boundary discipline around #605/#614/#616.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
      outputFormat: 'JSON only',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const refineTask = defineTask('issue-602.refine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine issue #602 implementation after failed review',
  labels: ['issue-602', 'refinement', 'quality-gate'],
  agent: {
    name: 'sdk-agent-mux-refiner',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Fix the review-blocking issues for issue #602.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.review ?? {}, null, 2),
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Edit only files required to resolve the review issues. Keep the scope bounded to issue #602.',
        'Return JSON: { changedFiles: string[], fixes: string[], remainingRisks: string[] }.',
      ],
      outputFormat: 'JSON only',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-602.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #602',
  labels: ['issue-602', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/sdk/src/harness/externalAgentDiscovery.ts packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts packages/sdk/src/harness/index.ts packages/sdk/src/index.ts packages/sdk/src/harness/discovery.ts',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "feat(sdk): discover external agent-mux agents"',
      'git push -u origin "${BRANCH_NAME}"',
      'PR_URL=$(gh pr create --base "${BASE_BRANCH}" --head "${BRANCH_NAME}" --title "Add SDK external agent discovery" --body "Fixes #602\\n\\n## Summary\\n- add discoverExternalAgents() as an optional SDK API for agent-mux discovery\\n- normalize agent installation/auth/capability/default data with module discovery and amux doctor --json fallback\\n- add 60s caching with force invalidation and focused SDK unit coverage\\n\\n## Tests\\n- targeted externalAgentDiscovery/discovery/install Vitest suite\\n- npm run build:sdk\\n- npm run test:sdk\\n- npm run verify:metadata")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented the SDK external agent discovery API.\\n\\nSummary:\\n- added \\`discoverExternalAgents()\\` with optional agent-mux module discovery and \\`amux doctor --json\\` fallback\\n- normalized discovered agents, auth/install status, capabilities, defaults, and unavailable semantics\\n- added 60s cache behavior with \\`force: true\\` invalidation and focused SDK tests\\n\\nQuality gates run locally:\\n- targeted externalAgentDiscovery/discovery/install Vitest suite\\n- \\`npm run build:sdk\\`\\n- \\`npm run test:sdk\\`\\n- \\`npm run verify:metadata\\`\\n\\nPR: ${PR_URL}"',
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    env: {
      BRANCH_NAME: args.branchName,
      BASE_BRANCH: args.baseBranch,
      ISSUE_NUMBER: String(args.issueNumber),
    },
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 602;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-602-external-agent-discovery';
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? 2;

  const context = await ctx.task(readSpecAndContextTask, { issueNumber }, {
    key: 'issue-602.context',
  });
  const contextStdout = taskStdout(context);

  await ctx.task(prepareBranchTask, { baseBranch, branchName }, {
    key: 'issue-602.branch',
  });

  const diagnosis = await ctx.task(diagnoseTask, { contextStdout }, {
    key: 'issue-602.diagnosis',
  });

  const testAuthoring = await ctx.task(writeTestsTask, {
    contextStdout,
    diagnosis,
  }, {
    key: 'issue-602.tests.write',
  });

  const redTests = await ctx.task(runRedTestsTask, {}, {
    key: 'issue-602.tests.red',
  });

  let implementation = await ctx.task(implementTask, {
    contextStdout,
    diagnosis,
    redTestStdout: taskStdout(redTests),
  }, {
    key: 'issue-602.implementation.1',
  });

  let verification;
  let artifacts;
  let review;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    verification = await ctx.task(verifyTask, {}, {
      key: `issue-602.verify.${attempt}`,
    });

    artifacts = await ctx.task(readArtifactsTask, {}, {
      key: `issue-602.artifacts.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      contextStdout,
      verification,
      artifactsStdout: taskStdout(artifacts),
    }, {
      key: `issue-602.review.${attempt}`,
    });

    if (review?.approved) {
      break;
    }

    if (attempt >= maxImplementationAttempts) {
      await ctx.breakpoint({
        title: 'Issue #602 Review Did Not Approve',
        question: 'The implementation still has review-blocking issues after the configured attempts. Review the artifacts and decide whether to continue refinement or stop for manual intervention.',
        options: ['continue refinement', 'stop for manual intervention'],
        context: {
          issueNumber,
          branchName,
          review,
        },
      });
    }

    implementation = await ctx.task(refineTask, {
      contextStdout,
      review,
      artifactsStdout: taskStdout(artifacts),
    }, {
      key: `issue-602.refine.${attempt}`,
    });
  }

  const delivery = await ctx.task(deliverTask, {
    issueNumber,
    baseBranch,
    branchName,
  }, {
    key: 'issue-602.delivery',
  });

  return {
    success: Boolean(review?.approved),
    diagnosis,
    testAuthoring,
    implementation,
    verification,
    review,
    delivery,
    runtimeCallPaths: diagnosis?.runtimeCallPaths ?? [],
    changedFiles: implementation?.changedFiles ?? [],
  };
}
