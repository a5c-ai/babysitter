/**
 * @process repo/issue-368-live-stack-create-hardening
 * @description Plan and execute the fix for issue #368: simplify BP/create live-stack process authoring so claude-code and pi can create a valid process.
 * @inputs { issueNumber: number, branchName: string, baseBranch: string, targetFiles: string[], targetAgents: string[], targetModes: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/spec-kit-brownfield.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - specializations/collaboration/github/issue-linking.js
 * - specializations/collaboration/github/pr-policies.js
 *
 * Repo policy note: this repository asks direct babysitter:call processes to avoid
 * shell-task subtasks unless the user asks for a shell-oriented workflow. This
 * process therefore uses agent tasks for command execution and evidence capture.
 *
 * @skill test-driven-development methodologies/superpowers/skills/test-driven-development/SKILL.md
 * @skill verification-before-completion methodologies/superpowers/skills/verification-before-completion/SKILL.md
 * @skill codebase-research methodologies/rpikit/skills/codebase-research/SKILL.md
 * @skill code-review methodologies/rpikit/skills/code-review/SKILL.md
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent cicd-test-integration specializations/qa-testing-automation/agents/cicd-test-integration/AGENT.md
 * @agent spec-reviewer methodologies/superpowers/agents/spec-reviewer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 368;
  const branchName = inputs?.branchName ?? 'agent/issue-368-live-stack-create-hardening';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const issueContext = await ctx.task(readIssueContextTask, { issueNumber }, {
    key: 'issue-368.read-issue-context',
  });

  const libraryResearch = await ctx.task(researchProcessLibraryTask, { issueContext }, {
    key: 'issue-368.research-process-library',
  });

  const runtimeTrace = await ctx.task(traceLiveStackCreateRuntimeTask, {
    inputs,
    issueContext,
    libraryResearch,
  }, {
    key: 'issue-368.trace-live-stack-create-runtime',
  });

  const strategy = await ctx.task(designCreateModeHardeningTask, {
    inputs,
    issueContext,
    libraryResearch,
    runtimeTrace,
  }, {
    key: 'issue-368.design-create-mode-hardening',
  });

  if (strategy?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #368 Create-Mode Strategy Decision',
      question: strategy.question,
      options: [
        'Proceed with recommended create-mode simplification',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-368', 'live-stack', 'create-mode'],
      context: {
        runId: ctx.runId,
        issueNumber,
        strategy,
      },
    });
  }

  const regressionTests = await ctx.task(authorCreateModeRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
    strategy,
  }, {
    key: 'issue-368.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementCreateModeHardeningTask, {
      inputs,
      issueContext,
      runtimeTrace,
      strategy,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-368.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyCreateModeQualityGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      strategy,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-368.verification.${attempt}`,
    });

    review = await ctx.task(reviewCreateModeFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      strategy,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-368.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    libraryResearch,
    runtimeTrace,
    strategy,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-368.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #368 Quality Gate Blocked',
      question: 'The fix did not satisfy the final acceptance gate. Approve another attempt with the recorded failures, or stop for maintainer review?',
      options: ['Stop and report blocked quality gate', 'Approve one manual follow-up attempt'],
      expert: 'owner',
      tags: ['quality-gate', 'issue-368', 'live-stack'],
      context: {
        runId: ctx.runId,
        issueNumber,
        finalGate,
        attempts,
      },
    });

    return {
      success: false,
      phases: [
        'issue-context',
        'process-library-research',
        'runtime-trace',
        'strategy',
        'regression-tests',
        'implementation-loop',
        'verification',
        'review',
        'final-acceptance',
      ],
      changedFiles: implementation?.changedFiles ?? [],
      runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
      strategy,
      regressionTests,
      implementation,
      verification,
      review,
      attempts,
      finalGate,
    };
  }

  const delivery = await ctx.task(deliverIssue368Task, {
    issueNumber,
    branchName,
    baseBranch,
    finalGate,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-368.delivery',
  });

  return {
    success: true,
    phases: [
      'issue-context',
      'process-library-research',
      'runtime-trace',
      'strategy',
      'regression-tests',
      'implementation-loop',
      'verification',
      'review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    strategy,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-368.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #368 and related GitHub context',
  labels: ['issue-368', 'live-stack', 'github', 'context'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'senior Babysitter live-stack maintainer',
      task: 'Read the authoritative GitHub context for issue #368.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments.`,
        `Also try gh pr view ${args.issueNumber} --json files,title,body,comments and record whether it is not a PR.`,
        'Preserve the issue title, body, labels, comments, reproduction, failing lanes, suggested approaches, non-goals, and related issue references in your output.',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, related, acceptanceCriteria, reproduction, affectedLanes, affectedFiles, suggestedApproach, nonGoals, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-368.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research process-library methods for brownfield CI hardening',
  labels: ['issue-368', 'process-library', 'research'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process-library researcher',
      task: 'Find the process-library patterns that should guide this fix.',
      instructions: [
        'Search /home/runner/.a5c/process-library/babysitter-repo/library for matching methodologies, specializations, skills, and agents.',
        'Prioritize brownfield change planning, test-driven development, verification-before-completion, process hardening, CI/live-stack test infrastructure, and GitHub PR lifecycle rules.',
        'Read docs/agent-reference/process-authoring.md and apply the repo-specific override that avoids kind: shell subtasks in direct user-request processes.',
        'Use issue context JSON as the problem statement:',
        JSON.stringify(args.issueContext, null, 2),
        'Return JSON: { references: string[], applicablePatterns: string[], repoPolicyConstraints: string[], qualityGatePattern: string, breakpointPolicy: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceLiveStackCreateRuntimeTask = defineTask('issue-368.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace BP/create live-stack runtime path',
  labels: ['issue-368', 'live-stack', 'runtime-trace'],
  agent: {
    name: 'cicd-test-integration',
    prompt: {
      role: 'senior CI and live-stack test engineer',
      task: 'Trace the runtime path from workflow matrix dispatch to create-mode verification failure.',
      instructions: [
        'Inspect the current repository before proposing changes.',
        'Start with these paths from the issue and follow callers/imports as needed:',
        JSON.stringify(args.inputs?.targetFiles ?? [], null, 2),
        'Trace the workflow matrix entries for claude-code, codex, and pi in BP/create interactive and bridged-hooks lanes.',
        'Trace buildPrimaryLiveStackCommands, fixture setup, buildPrompt, resolveLaunchMaxTurns, execute command sequencing, validateAgentBehavior, process-creation verification, and Odyssey artifact verification.',
        'Inspect packages/adapters/cli/tests/live-stack/fixtures/create-process-skeleton.mjs and the focused tests in primary-live-runner.test.ts and pipeline-scenario.test.ts.',
        'Identify exactly which requirements make the process definition too complex and which checks are needed to prove create-mode behavior still exists.',
        'Return JSON: { runtimeCallPaths, liveExecutionFiles, testFiles, skeletonComplexity, promptComplexity, verificationSurface, existingCoverage, gaps, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designCreateModeHardeningTask = defineTask('issue-368.design-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design create-mode simplification and validation loop',
  labels: ['issue-368', 'design', 'live-stack'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior test infrastructure architect',
      task: 'Design the smallest robust fix for BP/create live-stack lanes.',
      instructions: [
        'Use the issue context, process-library research, and runtime trace below as constraints.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'PROCESS LIBRARY RESEARCH JSON:',
        JSON.stringify(args.libraryResearch, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Prefer simplifying create-process-skeleton.mjs so the agent fills a narrow deterministic surface while still proving it authored odyssey-live-test.mjs.',
        'Prefer a prompt that separates file authoring, import validation, and running the created process.',
        'Include a validation/retry design for missing placeholders, ESM importability, exported process function, @reference marker, no use of predefined summarize-translate-test.mjs, and Odyssey artifact contract.',
        'Assess whether pi should get a higher create-mode max-turn budget and whether the change should be agent-specific or generic.',
        'Keep the plan scoped to live-stack create-mode fixtures, prompt generation, validation, and focused tests unless the trace proves another live path is involved.',
        'If a maintainer decision is truly required, set needsMaintainerDecision true with one precise question. Otherwise set it false.',
        'Return JSON: { recommendedDesign, changedFiles, runtimeCallPaths, testPlan, validationRules, liveVerificationPlan, rejectedAlternatives, risks, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorCreateModeRegressionTestsTask = defineTask('issue-368.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['issue-368', 'tests', 'tdd'],
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused regression tests for issue #368 before implementation.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes.',
        'Use existing Vitest patterns in packages/adapters/cli/tests/live-stack/primary-live-runner.test.ts and pipeline-scenario.test.ts.',
        'Author tests that fail on the current create-mode complexity and pass only when the skeleton/prompt/validation surface is simplified for claude-code and pi.',
        'Cover at minimum: fewer fill points in create-process-skeleton.mjs, prompt instructions that separate create/verify/run steps, import/export validation for odyssey-live-test.mjs, no dependency on summarize-translate-test.mjs in create mode, and pi/claude create-mode turn budget behavior if strategy requires it.',
        'Do not weaken existing assertions that create mode actually creates odyssey-live-test.mjs and produces a valid Odyssey artifact.',
        'Return JSON: { changedFiles, testsAdded, expectedFailuresBeforeImplementation, notes }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementCreateModeHardeningTask = defineTask('issue-368.implement-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement create-mode hardening',
  labels: ['issue-368', 'implementation', 'live-stack'],
  agent: {
    name: 'implementer',
    prompt: {
      role: 'senior TypeScript CI infrastructure engineer',
      task: 'Implement the issue #368 BP/create live-stack fix.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes.',
        `This is implementation attempt ${args.attempt}.`,
        'Use only files on the traced live execution path unless the trace and strategy justify another file.',
        'Simplify create-process-skeleton.mjs so weaker agents only need narrow, deterministic edits but still create a valid process definition.',
        'Update buildPrompt and related create-mode setup/validation so the agent gets clear create, verify, retry, and run steps.',
        'Add validation/retry checks in the live runner where they can catch missing placeholders, invalid ESM import, missing exported process, missing @reference marker, accidental predefined-process use, and output contract failures.',
        'Adjust create-mode max turns for pi or other agents only if justified by the strategy.',
        'Keep behavior for predefined and resume modes unchanged.',
        'Do not modify source files outside the issue scope.',
        'Return JSON: { changedFiles, summary, validationRulesImplemented, risks, commitMessage }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy, null, 2),
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyCreateModeQualityGateTask = defineTask('issue-368.verify-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify create-mode quality gates',
  labels: ['issue-368', 'verification', 'quality-gate'],
  agent: {
    name: 'cicd-test-integration',
    prompt: {
      role: 'senior CI verification engineer',
      task: 'Run and interpret the issue #368 verification gates.',
      instructions: [
        'Run the concrete commands supplied in inputs.verificationCommands and any narrower focused checks needed by the changed files.',
        'At minimum, run the focused live-stack unit tests covering primary-live-runner and pipeline scenario behavior, a TypeScript/build check if required by changed TypeScript, and git diff --check.',
        'Validate create-process-skeleton.mjs has no broad open-ended process-authoring burden beyond the strategy, and that prompt text for claude-code, codex, and pi still invokes the correct Babysitter command surface.',
        'If live provider credentials are available in the environment, run or document the targeted BP/create live lanes for claude-code/gpt-5.5 and pi/DeepSeek-V4-Pro in interactive and bridged-hooks modes. If credentials are unavailable, record that explicitly as residual risk rather than faking live verification.',
        'Return JSON: { passed, commandsRun: [{ command, exitCode, evidence }], liveLaneResults, failures, residualRisk, changedFiles }.',
        'INPUT VERIFICATION COMMANDS:',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCreateModeFixTask = defineTask('issue-368.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review create-mode fix against issue',
  labels: ['issue-368', 'review', 'spec-compliance'],
  agent: {
    name: 'spec-reviewer',
    prompt: {
      role: 'senior live-stack code reviewer',
      task: 'Review the issue #368 fix for correctness and scope control.',
      instructions: [
        'Compare the issue context directly to the implementation and verification evidence.',
        'Inspect the git diff and relevant changed files.',
        'Check for regressions in predefined/resume modes, command surfaces for claude-code/codex/pi, cross-platform setup commands, and live-stack evidence collection.',
        'Reject changes that merely loosen validation so failures pass without proving process creation and Odyssey artifact generation.',
        'Return JSON: { approved, issues, requiredChanges, summary }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-368.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #368',
  labels: ['issue-368', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release-minded Babysitter maintainer',
      task: 'Decide whether issue #368 is ready for PR delivery.',
      instructions: [
        'Read the final git diff, test output evidence, issue context, and review notes.',
        'Acceptance requires: create-mode skeleton is materially simpler, create prompt is explicit and agent-appropriate, validation/retry catches invalid process files, focused tests cover the regression, predefined/resume lanes are not weakened, and residual live-provider risk is clearly stated.',
        'Verify changed files are limited to live-stack workflow/test fixture/runner/test files and this process file unless justified by runtime trace.',
        'Return JSON: { passed, changedFiles, acceptance: string[], blockers: string[], residualRisk: string[], prSummary: string, issueComment: string }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'LIBRARY RESEARCH JSON:',
        JSON.stringify(args.libraryResearch, null, 2),
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy, null, 2),
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue368Task = defineTask('issue-368.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue #368',
  labels: ['issue-368', 'github', 'delivery'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'repository delivery agent',
      task: 'Deliver the completed issue #368 fix through GitHub.',
      instructions: [
        'Inspect git status and stage only files related to issue #368.',
        'Do not stage unrelated local changes, secrets, generated logs, or run artifacts.',
        `Commit on branch ${args.branchName} with the implementation commit message from finalGate or implementation.`,
        `Push ${args.branchName} to origin.`,
        `Create a PR against ${args.baseBranch} with a title that links to issue #${args.issueNumber} and a body summarizing phases, tests, quality gates, and residual live-verification risk.`,
        `Post a comment on issue #${args.issueNumber} with the fix summary, verification, residual risk, and PR link.`,
        'Return JSON: { committed, commitSha, prUrl, issueCommentUrl, stagedFiles, summary }.',
        'FINAL GATE JSON:',
        JSON.stringify(args.finalGate, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
