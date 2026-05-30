/**
 * @process repo/issue-605-process-authoring-responder-context
 * @description Implement issue #605: inject discovered responder context into process creation prompts.
 * @inputs { issueNumber?: number, baseBranch?: string, implementationBranch?: string, maxImplementationAttempts?: number }
 * @outputs { success: boolean, runtimeCallPaths: string[], changedFiles: string[], verification: object }
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process processes/shared/tdd-triplet
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 * @agent unified-reviewer methodologies/pilot-shell/agents/unified-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_FILES = [
  'packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts',
  'packages/agent-platform/src/harness/internal/createRun/planProcess/prompts.ts',
  'packages/agent-platform/src/harness/internal/createRun/prompts.ts',
  'packages/agent-platform/src/harness/internal/createRun/planProcess/validation.ts',
  'packages/agent-platform/src/harness/internal/createRun/planProcess/validationSource.ts',
  'packages/agent-platform/src/harness/internal/createRun/__tests__/prompts.test.ts',
  'packages/agent-platform/src/harness/internal/createRun/__tests__/createRun.test.ts',
  'packages/sdk/src/harness/externalAgentDiscovery.ts',
  'packages/sdk/src/tasks/types.ts',
  'packages/sdk/src/tasks/kinds/index.ts',
  'packages/sdk/src/harness/unified/promptContext.ts',
  'docs/agent-mux-babysitter-integrations/process-authoring.md',
  'docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
  'docs/agent-mux-babysitter-integrations/plugin-mode.md',
];

const DEFAULT_QUALITY_COMMANDS = [
  'npm exec --workspace=@a5c-ai/agent-platform -- vitest run src/harness/internal/createRun/__tests__/prompts.test.ts src/harness/internal/createRun/__tests__/createRun.test.ts',
  'npm exec --workspace=@a5c-ai/babysitter-sdk -- vitest run src/tasks/__tests__/defineTask.test.ts src/tasks/__tests__/kinds.test.ts src/harness/__tests__/externalAgentDiscovery.test.ts',
  'npm run build:runtime',
  'npm run test:sdk',
  'npm run verify:metadata',
  'git diff --check',
];

const readIssueAndDesignTask = defineTask('issue-605.read-issue-and-design', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #605, dependencies, and design docs',
  labels: ['issue-605', 'research', 'spec'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p .a5c/artifacts/issue-605',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments > .a5c/artifacts/issue-605/issue.json`,
      `gh issue view ${args.discoveryIssueNumber} --json title,body,labels,comments > .a5c/artifacts/issue-605/issue-602.json`,
      `gh issue view ${args.responderTypeIssueNumber} --json title,body,labels,comments > .a5c/artifacts/issue-605/issue-635.json`,
      `gh issue view ${args.hostIdentityIssueNumber} --json title,body,labels,comments > .a5c/artifacts/issue-605/issue-619.json`,
      'printf "\\n--- ISSUE 605 ---\\n"',
      'cat .a5c/artifacts/issue-605/issue.json',
      'printf "\\n--- DEPENDENCY ISSUE 602 ---\\n"',
      'cat .a5c/artifacts/issue-605/issue-602.json',
      'printf "\\n--- DEPENDENCY ISSUE 635 ---\\n"',
      'cat .a5c/artifacts/issue-605/issue-635.json',
      'printf "\\n--- RELATED ISSUE 619 ---\\n"',
      'cat .a5c/artifacts/issue-605/issue-619.json',
      'printf "\\n--- DESIGN: process-authoring.md ---\\n"',
      'cat docs/agent-mux-babysitter-integrations/process-authoring.md',
      'printf "\\n--- DESIGN: tasks-mux-routing.md ---\\n"',
      'cat docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
      'printf "\\n--- DESIGN: plugin-mode.md host identity section ---\\n"',
      'sed -n "80,125p" docs/agent-mux-babysitter-integrations/plugin-mode.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const inspectCurrentStateTask = defineTask('issue-605.inspect-current-state', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Inspect current branch state and dependency APIs',
  labels: ['issue-605', 'dependency-audit', 'runtime-trace'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- branch and status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- prompt creation path ---\\n"',
      'rg -n "runPlanProcessPhase|buildProcessDefinitionSystemPrompt|buildExternalProcessDefinitionPrompt|HarnessPromptContext|formatHarnessAssignmentGuidance|buildInternalProcessConformancePrompt|buildExternalProcessConformancePrompt" packages/agent-platform/src/harness/internal/createRun -g "*.ts"',
      'printf "\\n--- responder/discovery API availability ---\\n"',
      'rg -n "discoverExternalAgents|ExternalAgentDiscovery|responderType|externalAgentTask|hostIdentity|host agent|AGENT_CAPABILITIES_JSON" packages/sdk packages/agent-platform docs/agent-mux-babysitter-integrations -g "*.ts" -g "*.md" || true',
      'printf "\\n--- validation path ---\\n"',
      'rg -n "validateProcessExport|getDefineTaskKindShapeMismatches|getDefineTaskIdsByKind|InvalidProcessSourceError|console.warn|warning|warn" packages/agent-platform/src/harness/internal/createRun/planProcess -g "*.ts"',
      'printf "\\n--- relevant tests ---\\n"',
      'rg -n "PhasePlanProcess|prompt includes|conformance|defineTask|responderType|discoverExternalAgents|host" packages/agent-platform/src/harness/internal/createRun/__tests__ packages/sdk/src/tasks packages/sdk/src/harness -g "*.{test,spec}.ts" || true',
      'printf "\\n--- target file existence ---\\n"',
      `for f in ${args.targetFiles.map((file) => JSON.stringify(file)).join(' ')}; do if [ -e "$f" ]; then printf "present %s\\n" "$f"; else printf "missing %s\\n" "$f"; fi; done`,
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const traceRuntimePathTask = defineTask('issue-605.trace-runtime-path', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace process creation prompt and validation call paths',
  labels: ['issue-605', 'architecture', 'runtime-trace'],
  agent: {
    name: 'process-authoring-architect',
    prompt: {
      role: 'senior TypeScript architect for Babysitter agent-platform and SDK',
      task: 'Trace the live code paths that issue #605 must modify before any implementation starts.',
      instructions: [
        'Use the issue/design/dependency output and current-state output below as authoritative context.',
        'ISSUE_AND_DESIGN (verbatim):',
        '---',
        args.issueAndDesignStdout,
        '---',
        'CURRENT_STATE (verbatim):',
        '---',
        args.currentStateStdout,
        '---',
        'Inspect the repository directly, but do not edit files.',
        'Trace the live runtime paths for both process creation prompt modes:',
        '1. raw text / external CLI harness path in runPlanProcessPhase.',
        '2. full agent-platform prompt path through buildProcessDefinitionSystemPrompt and shared prompt renderers.',
        'Trace the conformance repair prompt path and validation path.',
        'Identify the exact current contracts from #602 discoverExternalAgents, #635 responderType task API, and #619 host identity if those changes are present on this branch.',
        'If a foundational API is missing, state whether implementation should pause, rebase, or use a narrowly compatible integration point.',
        'Return JSON with keys: runtimeCallPaths, dependencyReadiness, filesToModify, testsToAdd, risks, implementationNotes.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const dependencyDecisionTask = defineTask('issue-605.dependency-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decide whether foundational dependencies are ready',
  labels: ['issue-605', 'dependency-gate'],
  agent: {
    name: 'dependency-gate-reviewer',
    prompt: {
      role: 'release-aware implementation planner',
      task: 'Decide whether issue #605 can proceed on the current branch without creating compatibility churn.',
      instructions: [
        'Review the runtime trace JSON and the current-state output.',
        'RUNTIME_TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'CURRENT_STATE (verbatim):',
        '---',
        args.currentStateStdout,
        '---',
        'Issue #605 depends on #602 discoverExternalAgents, #635 responderType task syntax, and related #619 host identity prompt context.',
        'The current issue comment supersedes the older external:true format with responderType syntax. Do not approve an implementation plan that makes external:true the primary generated syntax unless #635 is unavailable and the user explicitly chooses a transitional approach.',
        'Return JSON with keys: ready (boolean), reason, requiredBeforeProceeding, allowedFallback, recommendedNextAction.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const dependencyBreakpointTask = defineTask('issue-605.dependency-breakpoint', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Foundational dependency decision',
  labels: ['issue-605', 'breakpoint', 'dependency-gate'],
  breakpoint: {
    question: [
      'Issue #605 depends on foundational work that may still be in parallel.',
      '',
      'Dependency decision:',
      JSON.stringify(args.dependencyDecision, null, 2),
      '',
      'Choose whether to proceed with a compatibility-aware implementation on this branch or stop until #602/#635/#619 are present.',
    ].join('\n'),
    options: [
      { label: 'Proceed with compatible implementation', value: 'proceed-compatible' },
      { label: 'Stop and wait for dependencies', value: 'stop-for-dependencies' },
    ],
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-605.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression tests from issue specs',
  labels: ['issue-605', 'tdd', 'tests'],
  agent: {
    name: 'process-authoring-test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Author regression tests for issue #605 before implementation.',
      instructions: [
        'Do not edit implementation source files in this task.',
        'Do not read target implementation files unless needed only to resolve exported symbol names already identified in RUNTIME_TRACE.',
        'Prefer existing test style in packages/agent-platform/src/harness/internal/createRun/__tests__/ and packages/sdk/src/tasks/__tests__.',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueAndDesignStdout,
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'Write focused tests that initially fail until issue #605 is implemented.',
        'Coverage must include: prompt rendering includes available agent responders from discoverExternalAgents; prompt rendering includes host identity when available; raw text and full agent-platform process-authoring paths receive the responder section; conformance repair prompt accepts responderType agent syntax and does not lead with obsolete external:true syntax; validation accepts kind:"agent" with responderType:"agent" and requires a non-empty adapter; validation warns rather than errors when responder tasks exist but agent-mux/discovery is unavailable.',
        'Use the current #635 responderType shape as primary syntax. Include backward compatibility assertions only if current source still supports the older external:true shape.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedFailures: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runTargetedTestsTask = defineTask('issue-605.run-targeted-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run targeted tests (${args.stage})`,
  labels: ['issue-605', 'quality-gate', 'tests'],
  shell: {
    command: [
      'set -euo pipefail',
      args.command,
    ].join('\n'),
    expectedExitCode: args.expectedExitCode ?? 0,
    timeout: args.timeout ?? 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementResponderContextTask = defineTask('issue-605.implement-responder-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement process authoring responder context attempt ${args.attempt}`,
  labels: ['issue-605', 'implementation'],
  agent: {
    name: 'process-authoring-implementer',
    prompt: {
      role: 'senior TypeScript engineer for Babysitter process creation',
      task: 'Implement issue #605 in the repository.',
      instructions: [
        'Read files before editing and preserve unrelated worktree changes.',
        'Keep changes tightly scoped to issue #605 and the live runtime paths identified in RUNTIME_TRACE.',
        'SPEC (verbatim):',
        '---',
        args.issueAndDesignStdout,
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'TEST_AUTHORING_RESULT:',
        JSON.stringify(args.testAuthoringResult, null, 2),
        'PREVIOUS_VERIFICATION:',
        JSON.stringify(args.previousVerification ?? null, null, 2),
        'Implementation requirements:',
        '1. Call and consume discoverExternalAgents() where process creation prompt context is assembled, using the current SDK API from #602 if present.',
        '2. Build a shared responder-context section that includes available agent responders from discovery, selected/host agent identity when available, and the defineTask responderType syntax from #635.',
        '3. Inject that section into the raw text session template path and the full agent-platform process prompt path without duplicating divergent prose.',
        '4. Update conformance repair prompts to accept kind:"agent" tasks with agent.responderType:"agent" plus adapter, and keep any legacy external:true mention secondary or transitional only if current code still requires it.',
        '5. Update validationSource/validation to accept responderType agent tasks, require adapter for responderType:"agent", and warn instead of throwing when discovery/agent-mux cannot verify availability.',
        '6. Keep agent-mux optional and non-blocking. Prompt creation must still work when discovery fails or returns unavailable.',
        '7. Add or adjust tests in the files from TEST_AUTHORING_RESULT and RUNTIME_TRACE only as needed.',
        'Do not implement tasks-mux routing/backends, external dispatch execution, or SDK discovery itself unless those dependency APIs are genuinely absent and the breakpoint allowed a compatibility approach.',
        'Return JSON: { changedFiles: string[], summary: string, dependencyNotes: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const repairImplementationTask = defineTask('issue-605.repair-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repair issue #605 implementation attempt ${args.attempt}`,
  labels: ['issue-605', 'repair'],
  agent: {
    name: 'process-authoring-repair-engineer',
    prompt: {
      role: 'senior TypeScript engineer fixing a focused failing implementation',
      task: 'Repair the current issue #605 implementation so the quality gates pass.',
      instructions: [
        'Use the same spec and runtime trace. Do not broaden scope.',
        'SPEC (verbatim):',
        '---',
        args.issueAndDesignStdout,
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'FAILED_VERIFICATION (verbatim):',
        '---',
        JSON.stringify(args.failedVerification, null, 2),
        '---',
        'Edit only files necessary to resolve the failures and preserve unrelated worktree changes.',
        'Return JSON: { changedFiles: string[], summary: string, remainingRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runQualityCommandTask = defineTask('issue-605.run-quality-command', (args, taskCtx) => ({
  kind: 'shell',
  title: `Quality gate: ${args.name}`,
  labels: ['issue-605', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      args.command,
    ].join('\n'),
    expectedExitCode: 0,
    timeout: args.timeout ?? 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const promptContractGuardTask = defineTask('issue-605.prompt-contract-guard', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Static guard for prompt contract and obsolete syntax',
  labels: ['issue-605', 'quality-gate', 'contract'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "responderType|Available agent responders|Available responders|discoverExternalAgents|host agent|adapter" packages/agent-platform/src/harness/internal/createRun packages/agent-platform/src/harness/internal/createRun/__tests__ packages/sdk/src -g "*.ts"',
      'if rg -n "external: true" packages/agent-platform/src/harness/internal/createRun -g "*.ts"; then',
      '  echo "Found external:true in process creation prompts. This is allowed only as legacy secondary guidance; verify tests also assert responderType primary syntax."',
      'fi',
      'rg -n "responderType.*agent|adapter" packages/agent-platform/src/harness/internal/createRun/__tests__ packages/sdk/src/tasks/__tests__ -g "*.{test,spec}.ts"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalSpecReviewTask = defineTask('issue-605.final-spec-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final spec versus artifacts review',
  labels: ['issue-605', 'review', 'acceptance'],
  agent: {
    name: 'issue-605-spec-guard',
    prompt: {
      role: 'adversarial reviewer for process prompt and validation changes',
      task: 'Compare issue #605 requirements against the final repository diff.',
      instructions: [
        'Ignore narrative in your context about how the artifacts were built.',
        'SPEC (verbatim):',
        '---',
        args.issueAndDesignStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
        'Confirm the implementation uses responderType syntax as primary #635 shape, handles #602 discovery optionally, incorporates #619 host identity when available, covers both raw and full prompt paths, updates conformance repair, and validates/warns correctly.',
        'Return JSON: { approved: boolean, findings: Array<{ severity: string, file: string, issue: string }>, missingCriteria: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const captureArtifactsTask = defineTask('issue-605.capture-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture final diff and changed files',
  labels: ['issue-605', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- changed files ---\\n"',
      'git diff --name-only',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/agent-platform packages/sdk docs/agent-mux-babysitter-integrations docs/agent-reference docs/plugins.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 605;
  const discoveryIssueNumber = inputs.discoveryIssueNumber ?? 602;
  const responderTypeIssueNumber = inputs.responderTypeIssueNumber ?? 635;
  const hostIdentityIssueNumber = inputs.hostIdentityIssueNumber ?? 619;
  const maxImplementationAttempts = inputs.maxImplementationAttempts ?? 3;
  const targetFiles = inputs.targetFiles ?? DEFAULT_TARGET_FILES;
  const qualityCommands = inputs.qualityCommands ?? DEFAULT_QUALITY_COMMANDS;

  const issueAndDesign = await ctx.task(readIssueAndDesignTask, {
    issueNumber,
    discoveryIssueNumber,
    responderTypeIssueNumber,
    hostIdentityIssueNumber,
  });

  const currentState = await ctx.task(inspectCurrentStateTask, {
    targetFiles,
  });

  const runtimeTrace = await ctx.task(traceRuntimePathTask, {
    issueAndDesignStdout: issueAndDesign.stdout ?? String(issueAndDesign),
    currentStateStdout: currentState.stdout ?? String(currentState),
  });

  const dependencyDecision = await ctx.task(dependencyDecisionTask, {
    runtimeTrace,
    currentStateStdout: currentState.stdout ?? String(currentState),
  });

  if (dependencyDecision?.ready === false && inputs.autoProceedWhenDependenciesMissing !== true) {
    const decision = await ctx.task(dependencyBreakpointTask, {
      dependencyDecision,
    });
    const selected = decision?.value ?? decision?.selection ?? decision?.answer;
    if (selected !== 'proceed-compatible') {
      return {
        success: false,
        status: 'blocked',
        reason: 'Foundational dependencies are not ready on this branch.',
        dependencyDecision,
        runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
      };
    }
  }

  const testAuthoring = await ctx.task(authorRegressionTestsTask, {
    issueAndDesignStdout: issueAndDesign.stdout ?? String(issueAndDesign),
    runtimeTrace,
  });

  const redTestResult = await ctx.task(runTargetedTestsTask, {
    stage: 'red-after-test-authoring',
    command: inputs.targetedTestCommand ?? DEFAULT_QUALITY_COMMANDS[0],
    expectedExitCode: inputs.expectRedTestsToFail === false ? 0 : 1,
    timeout: 240000,
  });

  let implementation = null;
  let verification = redTestResult;
  let success = false;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    implementation = await ctx.task(implementResponderContextTask, {
      attempt,
      issueAndDesignStdout: issueAndDesign.stdout ?? String(issueAndDesign),
      runtimeTrace,
      testAuthoringResult: testAuthoring,
      previousVerification: verification,
    });

    verification = await ctx.task(runTargetedTestsTask, {
      stage: `green-after-implementation-attempt-${attempt}`,
      command: inputs.targetedTestCommand ?? DEFAULT_QUALITY_COMMANDS[0],
      expectedExitCode: 0,
      timeout: 240000,
    });

    success = verification?.exitCode === 0 || verification?.status === 'ok' || verification?.success === true;
    if (success) {
      break;
    }

    await ctx.task(repairImplementationTask, {
      attempt,
      issueAndDesignStdout: issueAndDesign.stdout ?? String(issueAndDesign),
      runtimeTrace,
      failedVerification: verification,
    });
  }

  const qualityResults = [];
  for (const [index, command] of qualityCommands.entries()) {
    qualityResults.push(await ctx.task(runQualityCommandTask, {
      name: `command-${index + 1}`,
      command,
      timeout: index >= 2 ? 900000 : 300000,
    }));
  }

  const promptContractGuard = await ctx.task(promptContractGuardTask, {});
  const artifacts = await ctx.task(captureArtifactsTask, {});
  const finalReview = await ctx.task(finalSpecReviewTask, {
    issueAndDesignStdout: issueAndDesign.stdout ?? String(issueAndDesign),
    artifactsStdout: artifacts.stdout ?? String(artifacts),
  });

  return {
    success: success && finalReview?.approved !== false,
    issueNumber,
    phases: [
      'issue-and-design-research',
      'dependency-audit',
      'runtime-path-trace',
      'test-authoring',
      'implementation-loop',
      'quality-gates',
      'final-spec-review',
    ],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    dependencyDecision,
    changedFiles: implementation?.changedFiles ?? [],
    testAuthoring,
    redTestResult,
    verification,
    qualityResults,
    promptContractGuard,
    finalReview,
  };
}
