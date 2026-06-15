/**
 * @process repo/issue-601-remaining-dragons-plan
 * @description Gated implementation workflow for issue #601: remaining here-be-dragons debt and caveat cleanup.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, relatedIssues: number[], priorPlanningPr?: number, maxImplementationLoops?: number, verificationCommands?: string[] }
 * @outputs { success: boolean, context: object, reuseAudit: object, decomposition: object, regressionPlan: object, implementation: object, verification: object, review: object }
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? result?.result?.stdout ?? '';
}

const readIssueContextTask = defineTask('issue-601.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #601, related issues, prior PRs, and live repo evidence',
  labels: ['issue-601', 'context', 'no-code-changes'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
      'printf "%s\\n" "--- related issues ---"',
      ...(args.relatedIssues ?? []).map(
        (issueNumber) => `gh issue view ${issueNumber} --json title,body,labels,comments,state,url || true`,
      ),
      'printf "%s\\n" "--- prior planning or implementation PR ---"',
      args.priorPlanningPr ? `gh pr view ${args.priorPlanningPr} --json number,title,state,headRefName,baseRefName,url,body,files,comments || true` : 'true',
      'printf "%s\\n" "--- branch and worktree ---"',
      'git status --short --branch',
      'git log --oneline --decorate --max-count=12 -- docs/here-be-dragons.md .a5c/processes/issue-601-remaining-dragons-plan.mjs .a5c/processes/issue-601-remaining-dragons-plan.inputs.json',
      'printf "%s\\n" "--- here-be-dragons doc ---"',
      'nl -ba docs/here-be-dragons.md | sed -n "1,260p"',
      'printf "%s\\n" "--- targeted source evidence ---"',
      'for path in \\',
      '  packages/agent-core/src/agenticTools/index.ts \\',
      '  packages/agent-core/src/agenticTools/tools/execution.ts \\',
      '  packages/genty/platform/src/harness/piWrapper.ts \\',
      '  packages/genty/platform/src/harness/piWrapper/moduleSupport.ts \\',
      '  packages/genty/platform/src/harness/agenticTools/config/state.ts \\',
      '  packages/adapters/cli/src/index.ts \\',
      '  packages/adapters/ui/src/screens/SessionDetailScreen.test.tsx \\',
      '  tsconfig.json; do',
      '  if [ -f "$path" ]; then',
      '    printf "%s\\n" "--- $path ---"',
      '    nl -ba "$path" | sed -n "1,220p"',
      '  fi',
      'done',
      'printf "%s\\n" "--- debt scan ---"',
      'rg -n "process\\.env\\[[^\\]]+\\] =|process\\.env\\.[A-Z0-9_]+ =|WeakMap|initPromise|/bin/bash|it\\.skip|skipLibCheck|here-be-dragons|path normalization|platform detection|config loading" docs packages tsconfig.json package.json -S || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reuseAuditTask = defineTask('issue-601.reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Phase 0 reuse audit for existing #601 infrastructure',
  labels: ['issue-601', 'reuse-audit', 'no-code-changes'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "## Reuse-audit findings (REVIEW BEFORE PROCEEDING)"',
      'if [ -f .a5c/reuse-audit.json ]; then',
      '  printf "%s\\n" "--- .a5c/reuse-audit.json ---"',
      '  cat .a5c/reuse-audit.json',
      'else',
      '  printf "%s\\n" "No .a5c/reuse-audit.json found; using issue-derived keywords."',
      'fi',
      'printf "%s\\n" "--- migrations ---"',
      'find . -path "./node_modules" -prune -o -path "./.git" -prune -o -path "*/migrations/*" -type f -print | sort | xargs -r rg -n "env|config|tool|dispose|shell|bash|skipLibCheck|SessionDetailScreen|e2e|platform|path" -S || true',
      'printf "%s\\n" "--- routes ---"',
      'find . -path "./node_modules" -prune -o -path "./.git" -prune -o \\( -path "*/api/*/route.ts" -o -path "*/api/*/route.js" -o -path "*/routes/*" \\) -type f -print | sort | xargs -r rg -n "env|config|tool|dispose|shell|bash|e2e|platform|path" -S || true',
      'printf "%s\\n" "--- env vars and config writers ---"',
      'rg -n "process\\.env|AZURE_OPENAI|OPENAI|AMUX_|BABYSITTER_|AGENT_|CODEX_|CLAUDE_" packages scripts docs .a5c/processes -S || true',
      'printf "%s\\n" "--- SDKs and imports ---"',
      'rg -n "from .*(agent-core|agent-platform|adapters|@a5c-ai)|@a5c-ai/agent|pi-coding-agent|shell|dispose|WeakMap|initPromise" package.json packages scripts -S || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const processReferenceTask = defineTask('issue-601.process-library-research', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read matching process-library methodologies',
  labels: ['issue-601', 'process-library', 'no-code-changes'],
  shell: {
    command: [
      'set -euo pipefail',
      'babysitter process-library:active --json',
      'printf "%s\\n" "--- discovery excerpt ---"',
      'babysitter skill:discover --process-path /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-kit-brownfield.js --json | node -e "let s=JSON.parse(require(\\"fs\\").readFileSync(0,\\"utf8\\")); console.log(JSON.stringify({processes:(s.processes||[]).filter(p=>/planning|spec-kit|root-cause|test-driven|verification|github|branch|issue/.test(p.name+\\":\\"+p.category)).slice(0,40)}, null, 2))"',
      'printf "%s\\n" "--- planning-with-files ---"',
      'sed -n "1,180p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/planning-with-files/planning-orchestrator.js',
      'printf "%s\\n" "--- spec-kit-brownfield ---"',
      'sed -n "1,180p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-kit-brownfield.js',
      'printf "%s\\n" "--- root-cause-diagnosis ---"',
      'sed -n "1,170p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/shared/root-cause-diagnosis.js',
      'printf "%s\\n" "--- verification-before-completion ---"',
      'sed -n "1,160p" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/verification-before-completion.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const decomposeTask = defineTask('issue-601.decompose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose #601 into focused implementation streams',
  labels: ['issue-601', 'planning', 'no-code-changes'],
  agent: {
    name: 'brownfield-implementation-planner',
    prompt: {
      role: 'senior TypeScript monorepo planner',
      task: 'Plan issue #601 implementation without editing source files.',
      instructions: [
        'ISSUE AND REPO CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'REUSE AUDIT (verbatim):',
        '---',
        args.reuseAuditStdout,
        '---',
        'PROCESS REFERENCES (verbatim excerpts):',
        '---',
        args.processReferenceStdout,
        '---',
        'Do not edit files.',
        'Treat #601 as an umbrella issue. Do not duplicate related issue work; identify covered items, already-fixed items, and residual items from current branch evidence.',
        'For each residual stream, include runtimeCallPaths, affectedFiles, testsFirstPlan, implementationSteps, qualityGates, dependencies, risk, and stopConditions.',
        'Include a decision for process.env coupling (#584) and kanban switch exhaustiveness (#586) as coordinated dependencies, not duplicate implementation unless current issue evidence proves they are still in scope.',
        'Return JSON with keys: currentDisposition, coveredByRelatedIssues, alreadyResolved, residualStreams, dependencyOrder, qualityGateMatrix, proposedBreakpoints, outOfScope, deliveryPlan.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const regressionPlanTask = defineTask('issue-601.regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author tests-first implementation plan for #601 residual streams',
  labels: ['issue-601', 'tests-first', 'no-code-changes'],
  agent: {
    name: 'tests-first-planner',
    prompt: {
      role: 'test-first implementation planner',
      task: 'Convert the #601 decomposition into concrete red-green-refactor tasks.',
      instructions: [
        'ISSUE AND REPO CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DECOMPOSITION (verbatim JSON):',
        '---',
        JSON.stringify(args.decomposition ?? {}, null, 2),
        '---',
        'Do not edit files.',
        'For every residual stream, specify the test file to add or update before implementation, the failing behavior it proves, the minimal implementation files, and the command that must fail before and pass after.',
        'If a stream is too broad for one PR, split it into follow-up issue proposals with acceptance criteria and quality gates.',
        'Return JSON with keys: testStreams, implementationOrder, followupIssues, verificationCommands, reviewerChecklist.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementationTask = defineTask('issue-601.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement approved #601 residual streams',
  labels: ['issue-601', 'implementation'],
  agent: {
    name: 'remaining-dragons-implementer',
    prompt: {
      role: 'senior TypeScript monorepo implementer',
      task: 'Implement the approved #601 residual streams tests-first.',
      instructions: [
        'ISSUE AND REPO CONTEXT (verbatim):',
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
        'Edit only source, tests, docs, and process metadata needed for approved streams.',
        'Do not stage or commit unrelated dirty worktree files.',
        'Add or update regression tests before behavior changes.',
        'Keep changes on live runtime call paths unless the implementation discovers a new required path; document any new path in the result.',
        'Do not silently take over #584 or #586. If those related issues are still open or already handled elsewhere, link or defer instead.',
        'Return JSON with keys: changedFiles, implementedStreams, deferredStreams, testsAdded, docsUpdated, commandsToRun, risks.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask('issue-601.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run deterministic #601 quality gates',
  labels: ['issue-601', 'verification', 'quality-gate'],
  shell: {
    command: ['set -euo pipefail', ...(args.verificationCommands ?? [])].join('\n'),
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
  title: 'Read final #601 artifacts and diff for review',
  labels: ['issue-601', 'review', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- docs/here-be-dragons.md tsconfig.json packages/agent-core packages/genty/platform packages/adapters .a5c/processes/issue-601-remaining-dragons-plan.mjs .a5c/processes/issue-601-remaining-dragons-plan.inputs.json',
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
    name: 'implementation-reviewer',
    prompt: {
      role: 'senior code-review and release-gate reviewer',
      task: 'Compare the #601 issue context to the produced artifacts and verification output.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC AND ISSUE CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly.',
        'Verify that residual streams were implemented with tests or explicitly deferred, #584/#586 were not duplicated, docs reflect reality, and deterministic gates ran.',
        'Return JSON with keys: approved, issues, residualRisks, missingTests, requiredFollowups, summary.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 601;
  const relatedIssues = inputs?.relatedIssues ?? [584, 586];
  const priorPlanningPr = inputs?.priorPlanningPr ?? 683;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'plan/issue-601';
  const maxImplementationLoops = inputs?.maxImplementationLoops ?? 2;
  const verificationCommands = inputs?.verificationCommands ?? [
    'npm run test --workspace=@a5c-ai/agent-core',
    'npm run test --workspace=@a5c-ai/genty-platform',
    'npm run test:realtime --workspace=@a5c-ai/genty-ui',
    'npm run build:runtime',
    'npm run test:adapters',
    'npm run verify:metadata',
    'git diff --check',
    'if rg -n "it\\.skip\\(" packages/adapters/ui/src/screens/SessionDetailScreen.test.tsx; then echo "Unexplained SessionDetailScreen skipped tests remain" >&2; exit 1; fi',
  ];

  const context = await ctx.task(readIssueContextTask, {
    issueNumber,
    relatedIssues,
    priorPlanningPr,
  }, { key: 'issue-601.context' });

  const [reuseAudit, processReferences] = await ctx.parallel.all([
    ctx.task(reuseAuditTask, {}, { key: 'issue-601.reuse-audit' }),
    ctx.task(processReferenceTask, {}, { key: 'issue-601.process-references' }),
  ]);

  const decomposition = await ctx.task(decomposeTask, {
    contextStdout: stdoutOf(context),
    reuseAuditStdout: stdoutOf(reuseAudit),
    processReferenceStdout: stdoutOf(processReferences),
  }, { key: 'issue-601.decomposition' });

  await ctx.breakpoint({
    title: 'Approve #601 Scope',
    question: `Review the #601 decomposition for ${baseBranch} -> ${workBranch}. Approve the residual streams, deferrals, and quality gates before implementation?`,
    context: {
      issueNumber,
      relatedIssues,
      priorPlanningPr,
      decomposition,
    },
  });

  const regressionPlan = await ctx.task(regressionPlanTask, {
    contextStdout: stdoutOf(context),
    decomposition,
  }, { key: 'issue-601.regression-plan' });

  let implementation = null;
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= maxImplementationLoops; attempt += 1) {
    implementation = await ctx.task(implementationTask, {
      contextStdout: stdoutOf(context),
      decomposition,
      regressionPlan,
      attempt,
      previousReview: review,
    }, { key: `issue-601.implementation.${attempt}` });

    verification = await ctx.task(verificationTask, {
      verificationCommands,
      implementation,
    }, { key: `issue-601.verification.${attempt}` });

    const artifacts = await ctx.task(readArtifactsTask, {}, {
      key: `issue-601.artifacts.${attempt}`,
    });

    review = await ctx.task(finalReviewTask, {
      contextStdout: stdoutOf(context),
      artifactsStdout: stdoutOf(artifacts),
      verification,
    }, { key: `issue-601.review.${attempt}` });

    if (review?.approved !== false) {
      break;
    }
  }

  return {
    success: review?.approved !== false,
    issueNumber,
    baseBranch,
    workBranch,
    context,
    reuseAudit,
    processReferences,
    decomposition,
    regressionPlan,
    implementation,
    verification,
    review,
  };
}
