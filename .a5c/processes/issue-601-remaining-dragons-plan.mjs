/**
 * @process repo/issue-601-remaining-dragons-plan
 * @description Implementation plan for issue #601: remaining here-be-dragons debt, process.env coupling coordination, and missing caveats.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, relatedIssues: number[], maxImplementationLoops?: number }
 * @outputs { success: boolean, decomposition: object, implementation: object, verification: object, review: object }
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const collectContextTask = defineTask('issue-601.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #601, related issues, repo evidence, and process references',
  labels: ['issue-601', 'context', 'repo-research'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "--- issue 601 ---"',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
      'printf "%s\\n" "--- related issue 584 ---"',
      'gh issue view 584 --json title,body,labels,comments,state,url || true',
      'printf "%s\\n" "--- related issue 586 ---"',
      'gh issue view 586 --json title,body,labels,comments,state,url || true',
      'printf "%s\\n" "--- open planning prs for related issues ---"',
      'gh pr list --state open --search "issue-584 OR issue-586 OR #584 OR #586 in:body" --json number,title,headRefName,baseRefName,url,body',
      'printf "%s\\n" "--- git status ---"',
      'git status --short --branch',
      'printf "%s\\n" "--- here-be-dragons doc ---"',
      'nl -ba docs/here-be-dragons.md | sed -n "1,220p"',
      'printf "%s\\n" "--- process.env writers and residual caveats ---"',
      'nl -ba packages/agent-platform/src/harness/piWrapper/moduleSupport.ts | sed -n "120,150p"',
      'nl -ba packages/agent-platform/src/harness/agenticTools/config/state.ts | sed -n "108,124p"',
      'nl -ba packages/agent-core/src/agenticTools/config/state.ts | sed -n "108,124p"',
      'nl -ba packages/agent-mux/cli/src/index.ts | sed -n "124,150p"',
      'nl -ba packages/agent-core/src/agenticTools/index.ts | sed -n "1,60p"',
      'nl -ba packages/agent-platform/src/harness/piWrapper.ts | sed -n "76,100p"',
      'nl -ba packages/agent-core/src/agenticTools/tools/execution.ts | sed -n "50,68p"',
      'nl -ba packages/agent-platform/src/harness/agenticTools/tools/execution.ts | sed -n "50,68p"',
      'nl -ba packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx | sed -n "76,150p"',
      'nl -ba tsconfig.json | sed -n "1,24p"',
      'printf "%s\\n" "--- static debt scan ---"',
      'rg -n "it\\.skip|skipLibCheck|WeakMap<CustomToolDefinition\\[\\]|initPromise|/bin/bash|process\\.env\\[[^\\]]+\\] =" docs packages/agent-core packages/agent-platform packages/agent-mux tsconfig.json -S',
      'printf "%s\\n" "--- relevant process library references ---"',
      'sed -n "1,120p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-kit-brownfield.js || true',
      'sed -n "1,140p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/shared/root-cause-diagnosis.js || true',
      'sed -n "1,120p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/verification-before-completion.js || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const decomposeUmbrellaTask = defineTask('issue-601.decompose-umbrella', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose umbrella issue #601 into focused implementation streams',
  labels: ['issue-601', 'planning', 'decomposition'],
  agent: {
    name: 'here-be-dragons-planner',
    prompt: {
      role: 'senior monorepo architecture planner',
      task: 'Create the implementation decomposition for issue #601 without editing source files.',
      instructions: [
        'CONTEXT (verbatim from runtime research):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files.',
        'Treat #601 as an umbrella tracker unless the evidence proves a single focused change is safe.',
        'Do not duplicate the #584 process.env coupling implementation plan or the #586 kanban exhaustiveness plan. Instead, list them as dependencies or already-covered work streams.',
        'For each remaining non-fixed dragon, decide whether it needs a focused implementation stream, a follow-up issue, or a documentation-only disposition.',
        'Required residual areas to evaluate: exact-array WeakMap tool disposal, piWrapper lazy-init retry storm, /bin/bash portability, unexplained SessionDetailScreen skipped tests, skipLibCheck, E2E coverage gaps, duplicated utility patterns, and missing caveats in docs/here-be-dragons.md.',
        'For every stream, provide runtimeCallPaths, likelyFiles, testsFirstPlan, implementationPlan, qualityGates, risk, dependencies, and stopConditions.',
        'Return JSON: { umbrellaDisposition: string, coveredByExistingIssues: object[], workStreams: object[], dependencyOrder: string[], breakpointRecommendation: string, outOfScope: object[], qualityGateMatrix: object[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionPlanTask = defineTask('issue-601.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author tests-first plan for remaining #601 streams',
  labels: ['issue-601', 'tests-first', 'quality'],
  agent: {
    name: 'dragon-regression-planner',
    prompt: {
      role: 'test-first TypeScript monorepo planner',
      task: 'Turn the approved decomposition into concrete regression-test tasks before implementation.',
      instructions: [
        'CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DECOMPOSITION (verbatim JSON):',
        '---',
        JSON.stringify(args.decomposition ?? {}, null, 2),
        '---',
        'Do not edit files.',
        'For each implementation stream not covered by #584 or #586, specify the exact test file candidates, test behavior to add before implementation, and the minimum command that should fail before the fix and pass after the fix.',
        'Keep each test tied to a live runtime call path. Do not create tests that only assert comments or internal implementation shape unless the stream is documentation-only.',
        'Return JSON: { testStreams: object[], sharedFixtures: object[], commands: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementationTask = defineTask('issue-601.implement-approved-streams', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement approved remaining #601 streams',
  labels: ['issue-601', 'implementation', 'refactor'],
  agent: {
    name: 'remaining-dragons-implementer',
    prompt: {
      role: 'senior TypeScript monorepo implementer',
      task: 'Implement the approved remaining #601 streams with tests first.',
      instructions: [
        'CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DECOMPOSITION (verbatim JSON):',
        '---',
        JSON.stringify(args.decomposition ?? {}, null, 2),
        '---',
        'REGRESSION PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Do not implement #584 process.env coupling or #586 kanban exhaustiveness in this umbrella stream; only coordinate with those if comments/docs need linking.',
        'For each remaining approved stream, add or unskip focused tests before changing behavior.',
        'Keep changes scoped to the files identified in runtimeCallPaths unless fresh evidence proves another live-path file is necessary.',
        'Preferred fixes: make tool disposal robust to copied/recreated arrays or expose a disposal handle; add deterministic piWrapper retry/backoff or circuit-breaker behavior; make shell selection portable while preserving explicit bash opt-in; resolve or justify skipped SessionDetailScreen tests; produce a staged quality-gate plan for skipLibCheck/E2E gaps if they cannot be fixed in one PR.',
        'Update docs/here-be-dragons.md only to reflect work actually fixed or explicitly split into linked follow-up issues.',
        'Do not commit unrelated dirty worktree files.',
        'Return JSON: { changedFiles: string[], implementedStreams: object[], deferredStreams: object[], testsAdded: string[], docsUpdated: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask('issue-601.verification-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run #601 verification and static guardrails',
  labels: ['issue-601', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run test --workspace=@a5c-ai/agent-core',
      'npm run test --workspace=@a5c-ai/agent-platform',
      'npm run test:realtime --workspace=@a5c-ai/agent-mux-ui',
      'npm run build:runtime',
      'npm run test:agent-mux',
      'npm run verify:metadata',
      'git diff --check',
      'if rg -n "it\\.skip\\(" packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx; then',
      '  echo "Unexplained SessionDetailScreen skipped tests remain" >&2',
      '  exit 1',
      'fi',
      'rg -n "HERE BE DRAGONS|process\\.env mutation couples modules|Tool dispose requires exact array reference|Lazy init race|Platform-specific shell" docs/here-be-dragons.md packages/agent-core packages/agent-platform packages/agent-mux -S',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-601.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read #601 implementation artifacts for final review',
  labels: ['issue-601', 'artifacts', 'review'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- docs/here-be-dragons.md tsconfig.json packages/agent-core packages/agent-platform packages/agent-mux .a5c/processes/issue-601-remaining-dragons-plan.mjs .a5c/processes/issue-601-remaining-dragons-plan.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-601.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review #601 artifacts against issue context',
  labels: ['issue-601', 'review', 'quality-gate'],
  agent: {
    name: 'remaining-dragons-reviewer',
    prompt: {
      role: 'senior code-review and release-gate reviewer',
      task: 'Compare #601 requirements to the final artifacts and verification output.',
      instructions: [
        'Ignore any narrative in your context about how the artifacts were built.',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC AND ISSUE CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly.',
        'Confirm that #584 and #586 were not duplicated, remaining streams were either implemented with tests or explicitly deferred with follow-up disposition, docs/here-be-dragons.md reflects reality, and deterministic quality gates ran.',
        'Return JSON: { approved: boolean, issues: string[], residualRisks: string[], summary: string, requiredFollowups: object[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-601.delivery', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on #601',
  labels: ['issue-601', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add docs/here-be-dragons.md tsconfig.json packages/agent-core packages/agent-platform packages/agent-mux .a5c/processes/issue-601-remaining-dragons-plan.mjs .a5c/processes/issue-601-remaining-dragons-plan.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "fix: address remaining here-be-dragons debt"',
      `git push -u origin ${args.workBranch}`,
      'PR_URL=$(gh pr create --base "${BASE_BRANCH}" --head "${WORK_BRANCH}" --title "Fix remaining here-be-dragons debt" --body "Closes #${ISSUE_NUMBER}\\n\\n## Summary\\n- coordinate #601 with existing #584 and #586 plans\\n- address approved residual here-be-dragons streams with focused tests\\n- update docs/here-be-dragons.md to reflect fixed and deferred items\\n\\n## Quality Gates\\n- npm run test --workspace=@a5c-ai/agent-core\\n- npm run test --workspace=@a5c-ai/agent-platform\\n- npm run test:realtime --workspace=@a5c-ai/agent-mux-ui\\n- npm run build:runtime\\n- npm run test:agent-mux\\n- npm run verify:metadata")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implementation PR opened for #601: ${PR_URL}\\n\\nThe run coordinated with #584/#586, handled approved residual here-be-dragons streams with tests, and updated documentation to reflect fixed or deferred items."',
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    env: {
      BASE_BRANCH: args.baseBranch,
      WORK_BRANCH: args.workBranch,
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
  const issueNumber = inputs?.issueNumber ?? 601;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'agent/issue-601-remaining-dragons';
  const maxImplementationLoops = inputs?.maxImplementationLoops ?? 2;

  const context = await ctx.task(collectContextTask, { issueNumber }, {
    key: 'issue-601.context',
  });

  const decomposition = await ctx.task(decomposeUmbrellaTask, {
    contextStdout: taskStdout(context),
  }, {
    key: 'issue-601.decomposition',
  });

  await ctx.breakpoint({
    title: 'Approve #601 Decomposition',
    question: 'Review the #601 decomposition before implementation. Approve the scoped residual streams and deferrals, especially anything not covered by #584 or #586?',
    context: {
      issueNumber,
      baseBranch,
      workBranch,
      decomposition,
    },
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    contextStdout: taskStdout(context),
    decomposition,
  }, {
    key: 'issue-601.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= maxImplementationLoops; attempt += 1) {
    implementation = await ctx.task(implementationTask, {
      contextStdout: taskStdout(context),
      decomposition,
      regressionPlan,
      attempt,
      previousReview: review,
    }, {
      key: `issue-601.implementation.${attempt}`,
    });

    verification = await ctx.task(verificationTask, { implementation }, {
      key: `issue-601.verification.${attempt}`,
    });

    const artifacts = await ctx.task(readArtifactsTask, {}, {
      key: `issue-601.artifacts.${attempt}`,
    });

    review = await ctx.task(finalReviewTask, {
      contextStdout: taskStdout(context),
      artifactsStdout: taskStdout(artifacts),
      verification,
    }, {
      key: `issue-601.review.${attempt}`,
    });

    if (review?.approved !== false) {
      break;
    }
  }

  if (review?.approved === false) {
    return {
      success: false,
      decomposition,
      regressionPlan,
      implementation,
      verification,
      review,
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    workBranch,
  }, {
    key: 'issue-601.delivery',
  });

  return {
    success: true,
    decomposition,
    regressionPlan,
    implementation,
    verification,
    review,
    delivery,
  };
}
