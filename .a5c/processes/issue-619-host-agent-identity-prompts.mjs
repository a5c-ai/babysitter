/**
 * @process repo/issue-619-host-agent-identity-prompts
 * @description Implement issue #619: SDK plugin-mode process creation prompts must expose host agent identity, capabilities, and delegation guidance.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetFiles: string[], relatedIssues: number[], verificationCommands: string[], processLibraryReferences: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/adapters-babysitter-integrations/plugin-mode.md
 * - .a5c/processes/sdk-runtime-bugfix.js
 * - .a5c/processes/issue-170-claude-code-run-create-first-iteration.mjs
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/test-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/shared/root-cause-diagnosis.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/backward-compatibility-management.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/ai-agents-conversational/system-prompt-guardrails.js
 *
 * Repo policy note: this direct Babysitter process intentionally uses agent
 * verification tasks rather than shell subtasks, per
 * docs/agent-reference/process-authoring.md.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent system-prompt-engineer specializations/ai-agents-conversational/agents/system-prompt-engineer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const reuseAudit = await ctx.task(reuseAuditTask, inputs, {
    key: 'issue-619.reuse-audit',
  });

  const issueContext = await ctx.task(readIssueContextTask, {
    inputs,
    reuseAudit,
  }, {
    key: 'issue-619.read-issue-context',
  });

  const runtimeTrace = await ctx.task(tracePromptContextTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-619.trace-prompt-context',
  });

  const design = await ctx.task(designHostIdentityPromptTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-619.design-host-identity-prompt',
  });

  if (design?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #619 Host Identity Prompt Semantics Need Decision',
      question: design.question,
      options: ['Proceed with recommended host identity semantics', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-619', 'host-identity'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        design,
      },
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
    design,
  }, {
    key: 'issue-619.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementHostIdentityPromptTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-619.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-619.verification.${attempt}`,
    });

    review = await ctx.task(reviewPromptSemanticsTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-619.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    reuseAudit,
    issueContext,
    runtimeTrace,
    design,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-619.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'reuse-audit',
      'issue-context',
      'runtime-prompt-context-trace',
      'host-identity-design',
      'regression-tests',
      'implementation-loop',
      'verification-gate',
      'prompt-semantics-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    issueContext,
    runtimeTrace,
    design,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const reuseAuditTask = defineTask('issue-619.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0: Reuse audit for host identity prompt context',
  labels: ['sdk', 'agent-platform', 'reuse-audit', 'research'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK platform engineer',
      task: 'Run the plan-only reuse audit before implementation planning proceeds.',
      instructions: [
        'Extract keyword nouns and verbs from the issue request: plugin mode, host agent identity, host capabilities, process creation prompt, prompt context, AGENT_CAPABILITIES_JSON, selected harness, external agents, delegation guidance.',
        'Scan for matching existing infrastructure, types, tests, environment variables, and imports. Use the target files and related files from inputs as the starting point, then follow callers and imports.',
        'Inspect .a5c/reuse-audit.json if present and honor its scan globs or keyword rules.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Call out existing infrastructure that should be reused instead of adding duplicate prompt-context concepts.',
        'Do not change files in this task.',
        'Return JSON: { findingsTitle, keywords, matchingInfrastructure, matchingTests, reusableTypes, noMatchingExistingInfrastructure, recommendedReuse, noCodeChanges }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        targetFiles: args.targetFiles,
        relatedIssues: args.relatedIssues,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['findingsTitle', 'keywords', 'recommendedReuse', 'noCodeChanges'],
      properties: {
        findingsTitle: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        matchingInfrastructure: { type: 'array', items: { type: 'string' } },
        matchingTests: { type: 'array', items: { type: 'string' } },
        reusableTypes: { type: 'array', items: { type: 'string' } },
        noMatchingExistingInfrastructure: { type: 'boolean' },
        recommendedReuse: { type: 'array', items: { type: 'string' } },
        noCodeChanges: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const readIssueContextTask = defineTask('issue-619.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #619 and related prompt-context issues',
  labels: ['sdk', 'agent-platform', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issue and produce the authoritative implementation spec for this run.',
      instructions: [
        `Run: gh issue view ${args.inputs.issueNumber} --json title,body,labels,comments`,
        `If #${args.inputs.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.inputs.issueNumber} --json files,title,body,comments`,
        'Use the issue body, all comments, and labels as the source of truth. Preserve enough raw issue/comment text for downstream prompt reviewers to compare directly.',
        'Read related issues listed in inputs only enough to preserve boundaries and sequencing. Do not expand this run into unrelated external-agent discovery, task cancellation, or subprocess support work.',
        'Read docs/adapters-babysitter-integrations/plugin-mode.md section 6 and use it as design context.',
        'Include the reuse-audit findings in the output and note any existing infrastructure that should be reused.',
        'Return JSON: { title, labels, rawIssue, comments, relatedIssues, acceptanceCriteria, implementationHints, nonGoals, priority, risks, targetFilesFromIssue, reuseAuditSummary }.',
      ],
      context: {
        reuseAudit: args.reuseAudit,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'acceptanceCriteria', 'targetFilesFromIssue'],
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        rawIssue: { type: 'string' },
        comments: { type: 'array', items: { type: 'string' } },
        relatedIssues: { type: 'array', items: { type: 'number' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        implementationHints: { type: 'array', items: { type: 'string' } },
        nonGoals: { type: 'array', items: { type: 'string' } },
        priority: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } },
        targetFilesFromIssue: { type: 'array', items: { type: 'string' } },
        reuseAuditSummary: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const tracePromptContextTask = defineTask('issue-619.trace-prompt-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace process creation prompt-context call paths',
  labels: ['sdk', 'agent-platform', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Map the current process creation prompt path before code changes.',
      instructions: [
        'Work from the issue context JSON and inspect the current codebase.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Inspect these likely files first, then follow imports, callers, tests, and type definitions:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace create-run prompt context from unified adapter AGENT_CAPABILITIES_JSON parsing through PromptContext/HarnessPromptContext construction, PhasePlanProcess prompt composition, and plan-process prompt delivery.',
        'Distinguish host agent running the planning session, selected orchestration binding harness, internal worker/default execution, discovered external harnesses, and task-level routing.',
        'Identify current tests that render process-definition prompts, unified prompt context, adapter capability parsing, and create-run plan-process prompts.',
        'Do not change files in this task.',
        'Return JSON: { rootCause, runtimeCallPaths, promptCompositionFiles, promptContextTypes, testFiles, currentBehavior, missingFields, compatibilityConstraints, proposedImplementationShape, outOfScope }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'runtimeCallPaths', 'promptCompositionFiles', 'testFiles'],
      properties: {
        rootCause: { type: 'string' },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        promptCompositionFiles: { type: 'array', items: { type: 'string' } },
        promptContextTypes: { type: 'array', items: { type: 'string' } },
        testFiles: { type: 'array', items: { type: 'string' } },
        currentBehavior: { type: 'string' },
        missingFields: { type: 'array', items: { type: 'string' } },
        compatibilityConstraints: { type: 'array', items: { type: 'string' } },
        proposedImplementationShape: { type: 'string' },
        outOfScope: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const designHostIdentityPromptTask = defineTask('issue-619.design-host-identity-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design host identity prompt context and wording',
  labels: ['sdk', 'agent-platform', 'design', 'prompt-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK prompt architecture engineer',
      task: 'Design the focused host identity prompt-context change before tests and implementation.',
      instructions: [
        'Use the issue context and runtime trace as the source of truth.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design a backward-compatible typed context shape that can represent the host agent name, human label, host capabilities, optional host tools if already available, and delegation guidance.',
        'Prefer reusing existing selectedHarnessName, unified promptContext.harness/harnessLabel, and AGENT_CAPABILITIES_JSON-derived capability data where that is semantically correct.',
        'Specify exact terminology for the prompt section so readers can distinguish host agent, internal worker, discovered external harnesses, selected binding harness, and task execution routing.',
        'Specify how prompt wording should differ for representative hosts such as codex and claude-code, and how it should degrade when host identity is missing.',
        'Flag a maintainer decision only if the current data model cannot distinguish host from selected harness without changing public contracts.',
        'Return JSON: { hostIdentityModel, promptSectionContract, hostSpecificSections, fallbackBehavior, implementationSteps, testPlan, compatibilityNotes, needsMaintainerDecision, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['hostIdentityModel', 'promptSectionContract', 'implementationSteps', 'testPlan', 'needsMaintainerDecision'],
      properties: {
        hostIdentityModel: { type: 'object' },
        promptSectionContract: { type: 'array', items: { type: 'string' } },
        hostSpecificSections: { type: 'array', items: { type: 'string' } },
        fallbackBehavior: { type: 'string' },
        implementationSteps: { type: 'array', items: { type: 'string' } },
        testPlan: { type: 'array', items: { type: 'string' } },
        compatibilityNotes: { type: 'array', items: { type: 'string' } },
        needsMaintainerDecision: { type: 'boolean' },
        question: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-619.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author host identity prompt regression tests',
  labels: ['sdk', 'agent-platform', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #619 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use the issue context, runtime trace, and design JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Add or update targeted tests proving process creation prompts contain an explicit host identity section for representative plugin hosts such as codex and claude-code.',
        'Assert that the prompt states host capabilities and delegation guidance in terms that separate host execution from external harness routing.',
        'Add SDK unified prompt-context tests proving AGENT_CAPABILITIES_JSON-derived host identity/capability fields round-trip without breaking default unified context.',
        'Add agent-platform prompt rendering tests for missing/unknown host identity fallback behavior.',
        'Run the focused tests you changed if practical and record expected initial failures before implementation.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsRun, commandResults, notes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'expectedInitialFailures'],
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } },
        testsAdded: { type: 'array', items: { type: 'string' } },
        expectedInitialFailures: { type: 'array', items: { type: 'string' } },
        commandsRun: { type: 'array', items: { type: 'string' } },
        commandResults: { type: 'array', items: { type: 'string' } },
        notes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const implementHostIdentityPromptTask = defineTask('issue-619.implement-host-identity-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement host identity prompt context attempt ${args.attempt}`,
  labels: ['sdk', 'agent-platform', 'implementation', 'prompt-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #619 host identity prompt-context change.',
      instructions: [
        'You own only the S../platform prompt-context, prompt rendering, and tests required by this issue. Do not expand into unrelated external-agent discovery or task-cancel support.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement typed prompt-context fields only where needed, keeping missing fields backward-compatible.',
        'Add a dedicated host identity/capabilities/delegation section to process creation prompts and any plan-process prompt path that currently receives shared context.',
        'Ensure representative host wording for codex and claude-code is explicit enough for the planning LLM to know what it can do locally and when to use external agents.',
        'Keep selected orchestration binding harness and host agent identity distinct in code and wording.',
        'Run the focused verification commands from inputs and any commands from the regression-test task. Record exact command results.',
        'Return JSON: { changedFiles, summary, hostIdentitySemantics, promptWordingSummary, compatibilityNotes, commandsRun, commandResults, testsExpectedToPass }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'hostIdentitySemantics', 'commandsRun', 'commandResults'],
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        hostIdentitySemantics: { type: 'array', items: { type: 'string' } },
        promptWordingSummary: { type: 'array', items: { type: 'string' } },
        compatibilityNotes: { type: 'array', items: { type: 'string' } },
        commandsRun: { type: 'array', items: { type: 'string' } },
        commandResults: { type: 'array', items: { type: 'string' } },
        testsExpectedToPass: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-619.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run verification gate for attempt ${args.attempt}`,
  labels: ['sdk', 'agent-platform', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run and evaluate the focused verification gate for issue #619.',
      instructions: [
        'Run the verification commands from inputs and any focused commands produced by the regression-test and implementation tasks.',
        'Inputs verification commands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression test JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verify TypeScript tests, prompt rendering tests, SDK unified prompt context tests, and repository metadata checks relevant to the changed files.',
        'If a command fails, diagnose whether it is caused by the current attempt or pre-existing/unrelated worktree state. Do not change files in this task.',
        'Return JSON: { passed, commandsRun, commandResults, failures, changedFilesObserved, retryAdvice }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commandsRun', 'commandResults'],
      properties: {
        passed: { type: 'boolean' },
        commandsRun: { type: 'array', items: { type: 'string' } },
        commandResults: { type: 'array', items: { type: 'string' } },
        failures: { type: 'array', items: { type: 'string' } },
        changedFilesObserved: { type: 'array', items: { type: 'string' } },
        retryAdvice: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const reviewPromptSemanticsTask = defineTask('issue-619.review-prompt-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review host identity semantics attempt ${args.attempt}`,
  labels: ['sdk', 'agent-platform', 'review', 'prompt-semantics'],
  agent: {
    name: 'system-prompt-engineer',
    prompt: {
      role: 'senior SDK prompt semantics reviewer',
      task: 'Review the issue #619 implementation for prompt clarity, compatibility, and scope control.',
      instructions: [
        'Review the changed files and test results against the issue context, runtime trace, and design.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Confirm the prompt separates host agent, selected binding harness, internal worker/default execution, external harness catalog, and task routing.',
        'Confirm host capability wording is actionable and does not overclaim unavailable tools.',
        'Confirm missing host identity remains backward-compatible and does not break non-plugin create-run prompts.',
        'Confirm tests cover codex, claude-code, and fallback behavior.',
        'Return JSON: { approved, findings, requiredFixes, promptClarityScore, compatibilityRisk, scopeConcerns }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'requiredFixes'],
      properties: {
        approved: { type: 'boolean' },
        findings: { type: 'array', items: { type: 'string' } },
        requiredFixes: { type: 'array', items: { type: 'string' } },
        promptClarityScore: { type: 'number' },
        compatibilityRisk: { type: 'string' },
        scopeConcerns: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-619.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #619',
  labels: ['sdk', 'agent-platform', 'final-gate', 'acceptance'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior Babysitter SDK release reviewer',
      task: 'Decide whether the implementation is ready to hand off or merge.',
      instructions: [
        'Compare the issue context directly against the produced implementation, tests, verification, and review outputs.',
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review JSON:',
        JSON.stringify(args.review, null, 2),
        'All attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Acceptance requires: explicit host identity section, host capability/delegation guidance, different wording for representative hosts, fallback compatibility, targeted tests, and passing focused verification.',
        'Reject if implementation drifted into unrelated plugin-mode features or if prompt terminology conflates host and external harnesses.',
        'Return JSON: { passed, changedFiles, satisfiedCriteria, unresolvedIssues, verificationSummary, handoffNotes }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'changedFiles', 'satisfiedCriteria', 'unresolvedIssues'],
      properties: {
        passed: { type: 'boolean' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        satisfiedCriteria: { type: 'array', items: { type: 'string' } },
        unresolvedIssues: { type: 'array', items: { type: 'string' } },
        verificationSummary: { type: 'array', items: { type: 'string' } },
        handoffNotes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));
