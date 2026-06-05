/**
 * @process repo/issue-881-strike3-interpretation-contract
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/gsd/debug
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @description Implementation process for issue #881: enforce hypothesis-before-fix discipline for Strike-3 post-instrumentation interpretation.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetFiles: string[], verificationCommands: string[], acceptanceCriteria: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], issueContext: object, codebaseMap: object, contractDesign: object, regressionPlan: object, attempts: array, finalGate: object }
 *
 * References used while authoring:
 * - gh issue view 881 --json title,body,labels,comments
 * - docs/agent-reference/process-authoring.md
 * - library/specializations/qa-testing-automation/diagnostic-first-phase.js
 * - library/specializations/qa-testing-automation/diagnostic-first-phase.md
 * - library/processes/shared/n-strikes-escalation.js
 * - library/__tests__/orphan-preflight-prompts.test.mjs
 * - library/__tests__/smoke.test.mjs
 * - methodologies/shared/root-cause-diagnosis.js
 * - methodologies/gsd/debug.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 *
 * Process-library research findings:
 * - Active library root: /home/runner/.a5c/process-library/babysitter-repo/library.
 * - Relevant reusable patterns found: shared root-cause diagnosis for no-code diagnosis, GSD scientific debugging, process-hardening verification gates, and superpowers verification-before-completion.
 * - The active bound library revision does not yet contain repo-local diagnostic-first-phase or n-strikes-escalation; the repository's library/ tree is the implementation target for this issue.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - **Migration**: No matching migrations; this is a process-library prompt/schema hardening change, not database infrastructure.
 * - **Route**: No matching API routes; no new route should be introduced.
 * - **Env var**: No new environment variables are needed.
 * - **SDK**: Existing @a5c-ai/babysitter-sdk defineTask patterns cover the process-library task updates; no SDK dependency should be added.
 * - **Existing library surface**: library/specializations/qa-testing-automation/diagnostic-first-phase.js already owns diagnostic-first post-evidence guidance and should be extended before creating any new instrumentation-deploy file.
 * - **Existing docs surface**: library/specializations/qa-testing-automation/diagnostic-first-phase.md and docs/agent-reference/process-authoring.md already explain diagnostic-first and HYPOTHESES-tree guidance; extend them narrowly if implementation changes behavior.
 * - **Existing guardrail pattern**: library/__tests__/orphan-preflight-prompts.test.mjs demonstrates prompt-contract regression tests that assert required wording stays present.
 *
 * Repo-specific authoring note:
 * - This repository asks direct babysitter processes to avoid kind: 'shell' subtasks unless the user requests a shell-oriented workflow. Verification below is therefore modeled as agent tasks that must run and report concrete command output.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 881;
  const attempts = [];

  const issueContext = await ctx.task(readIssueContextTask, { ...inputs, issueNumber }, {
    key: 'issue-881.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: 'issue-881.reuse-audit',
  });

  const codebaseMap = await ctx.task(mapCurrentStrike3SurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-881.map-current-surfaces',
  });

  const contractDesign = await ctx.task(designInterpretationContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    codebaseMap,
  }, {
    key: 'issue-881.design-contract',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    codebaseMap,
    contractDesign,
  }, {
    key: 'issue-881.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= (inputs.maxAttempts ?? MAX_ATTEMPTS); attempt += 1) {
    implementation = await ctx.task(implementContractTask, {
      inputs,
      issueContext,
      reuseAudit,
      codebaseMap,
      contractDesign,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-881.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyContractTask, {
      inputs,
      issueContext,
      contractDesign,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-881.verification.${attempt}`,
    });

    review = await ctx.task(reviewAcceptanceTask, {
      inputs,
      issueContext,
      codebaseMap,
      contractDesign,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-881.acceptance-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    codebaseMap,
    contractDesign,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-881.final-gate',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #881 final contract decision',
      question: finalGate.question ?? 'The Strike-3 interpretation contract still has unresolved placement or acceptance questions. Choose whether to proceed with the recommended shape or pause for maintainer guidance.',
      options: ['Proceed with recommended shape', 'Pause for maintainer guidance'],
      expert: 'maintainer',
      tags: ['issue-881', 'strike-3', 'interpretation-contract'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'current-surface-map',
      'contract-design',
      'regression-plan',
      'implementation-loop',
      'verification',
      'acceptance-review',
      'final-gate',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    codebaseMap,
    contractDesign,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-881.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #881 context',
  labels: ['issue-881', 'research', 'github'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior Babysitter process-library maintainer',
      task: 'Read the issue and confirm the exact requested Strike-3 interpretation behavior before any implementation.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm this is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read the issue body, all comments, and labels. Treat them as the source of truth.',
        'Use the issue context provided in process inputs as a fallback if GitHub is unavailable, but prefer live GitHub output.',
        'Extract acceptance criteria, non-goals, risk notes, affected components, and comments that change scope.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, acceptanceCriteria, nonGoals, risks, affectedComponents, relatedIssues, openQuestions }.',
      ],
      context: {
        providedIssueContext: args.issueContext ?? null,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'acceptanceCriteria', 'nonGoals', 'affectedComponents'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-881.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #881 reuse audit',
  labels: ['issue-881', 'reuse-audit', 'planning'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'brownfield reuse auditor',
      task: 'Find existing infrastructure and library surfaces that should be reused for the Strike-3 interpretation contract.',
      instructions: [
        'Use these keywords: Strike-3, strike 3, instrumentation, diagnostic-first, hypothesis, falsifying, seq, logSeq, needs-more-data, root-cause, n-strikes.',
        'Scan for existing migrations, routes, environment variables, SDK dependencies, imports, prompt templates, task definitions, docs, tests, and generated docs that match those keywords.',
        'Do not write or modify code.',
        'Call out duplicate-file risks and the existing file that should be extended instead.',
        'Return JSON: { migrations, routes, envVars, sdks, promptSurfaces, docsSurfaces, testSurfaces, reuseRecommendations, duplicateRisks }.',
      ],
      context: {
        issueContext: args.issueContext,
        preliminaryFindings: args.inputs?.reuseAuditFindings ?? [],
      },
    },
    outputSchema: {
      type: 'object',
      required: ['reuseRecommendations', 'duplicateRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const mapCurrentStrike3SurfacesTask = defineTask('issue-881.map-current-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map current Strike-3 and diagnostic-first surfaces',
  labels: ['issue-881', 'codebase-map', 'process-library'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'process-library architecture mapper',
      task: 'Trace the current diagnostic-first and Strike-3-adjacent guidance before choosing implementation files.',
      instructions: [
        'Read the target files from inputs.targetFiles before deciding scope.',
        'Inspect library/specializations/qa-testing-automation/diagnostic-first-phase.js and .md.',
        'Inspect library/processes/shared/n-strikes-escalation.js and library/processes/shared/index.js for escalation handoff context.',
        'Inspect docs/agent-reference/process-authoring.md for HYPOTHESES-tree guidance and repo-specific process rules.',
        'Search for any instrumentation-deploy skill or prompt template. If none exists, state that explicitly.',
        'Map the runtime call path from process-library task prompt to output schema to docs/tests that protect it.',
        'Return JSON: { canonicalSurface, adjacentSurfaces, missingSurfaces, runtimeCallPaths, recommendedEditSet, risks }.',
      ],
      context: {
        targetFiles: args.inputs?.targetFiles ?? [],
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['canonicalSurface', 'runtimeCallPaths', 'recommendedEditSet'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designInterpretationContractTask = defineTask('issue-881.design-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Strike-3 interpretation contract',
  labels: ['issue-881', 'contract-design', 'hypotheses'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'debugging-methodology architect',
      task: 'Design the exact contract that post-instrumentation fix agents must satisfy before writing a fix.',
      instructions: [
        'Use the issue acceptance criteria verbatim where possible.',
        'The contract must require at least 3 candidate root-cause hypotheses before implementation.',
        'Each hypothesis must include the concrete log observation that supports or would falsify it.',
        'The selected fix must cite at least one concrete log record: seq when present, otherwise artifact path plus timestamp or quoted log id.',
        'If no specific log citation supports a fix, the only allowed outcome is needs-more-data.',
        'Design output schema changes, prompt wording, docs wording, and regression guard expectations.',
        'Keep the change scoped to Strike-3/post-instrumentation or diagnostic-first handoffs; do not impose the rule on ordinary first-pass bugfixes.',
        'Return JSON: { contractName, contractText, schemaPlan, docsPlan, testPlan, nonGoals, placementDecision }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        codebaseMap: args.codebaseMap,
        acceptanceCriteria: args.inputs?.acceptanceCriteria ?? [],
      },
    },
    outputSchema: {
      type: 'object',
      required: ['contractText', 'schemaPlan', 'docsPlan', 'testPlan', 'placementDecision'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-881.regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan regression guard before implementation',
  labels: ['issue-881', 'test-plan', 'guardrail'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'process-library regression test engineer',
      task: 'Plan the regression guard that will fail if the Strike-3 interpretation contract is weakened or removed.',
      instructions: [
        'Design tests before implementation. Prefer a focused library test that reads diagnostic-first-phase.js and .md and asserts required prompt/schema terms are present.',
        'Cover these required concepts: 3+ hypotheses, falsifying observation/log line, concrete log citation, seq fallback language, no fix without citation, needs-more-data outcome.',
        'Include expected commands to run after implementation.',
        'Do not modify files in this task.',
        'Return JSON: { proposedTestFiles, assertions, redGreenStrategy, verificationCommands, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        contractDesign: args.contractDesign,
        existingTestSurfaces: args.reuseAudit?.testSurfaces ?? [],
      },
    },
    outputSchema: {
      type: 'object',
      required: ['proposedTestFiles', 'assertions', 'verificationCommands'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementContractTask = defineTask('issue-881.implement-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Strike-3 interpretation contract',
  labels: ['issue-881', 'implementation', 'process-library'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior process-library contributor',
      task: 'Implement the Strike-3 post-instrumentation interpretation contract and its regression guard, scoped to the approved surfaces.',
      instructions: [
        'Before editing, read every file in contractDesign.placementDecision and codebaseMap.recommendedEditSet.',
        'Author the regression guard first, then update the prompt/schema/docs to satisfy it.',
        'Extend existing files rather than creating a new instrumentation-deploy surface unless codebaseMap proves that such a surface already exists and is canonical.',
        'The implementation must not change runtime SDK behavior unrelated to process-library task prompts/schemas/docs/tests.',
        'The diagnostic handoff must explicitly reject fix proposals without concrete log evidence by returning or instructing needs-more-data.',
        'If logs have seq numbers, require seq citations; otherwise require artifact path plus timestamp or exact log id.',
        'Preserve read-only diagnostic-first safety language and source-tree-safe constraints.',
        'Return JSON: { changedFiles, summary, contractTermsAdded, testsAddedOrUpdated, needsMoreDataRule, caveats }.',
      ],
      context: {
        attempt: args.attempt,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        codebaseMap: args.codebaseMap,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        previousVerification: args.previousVerification,
        previousReview: args.previousReview,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'contractTermsAdded', 'testsAddedOrUpdated', 'needsMoreDataRule'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyContractTask = defineTask('issue-881.verify-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Strike-3 contract implementation',
  labels: ['issue-881', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'verification engineer',
      task: 'Run concrete verification for the Strike-3 interpretation contract and report exact results.',
      instructions: [
        'Run the focused tests from regressionPlan.verificationCommands first.',
        'Run the repository verification commands from inputs.verificationCommands.',
        'Inspect the changed files to confirm the prompt/schema/docs include the contract terms.',
        'Report exact command names, exit codes, and a short pass/fail summary.',
        'If any command cannot run, mark passed=false and explain the blocker.',
        'Return JSON: { passed, commands, promptContractPresent, schemaContractPresent, docsContractPresent, needsMoreDataGuardPresent, failures, changedFiles }.',
      ],
      context: {
        implementation: args.implementation,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        verificationCommands: args.inputs?.verificationCommands ?? [],
      },
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'promptContractPresent', 'needsMoreDataGuardPresent'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewAcceptanceTask = defineTask('issue-881.acceptance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #881 acceptance',
  labels: ['issue-881', 'review', 'acceptance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'adversarial process-contract reviewer',
      task: 'Review the implementation against the issue, not against the implementer narrative.',
      instructions: [
        'Re-read the issue context and comments from the task input.',
        'Review the git diff and changed files.',
        'Block if the implementation allows a fix recommendation without citing at least one concrete log line.',
        'Block if fewer than 3 hypotheses are required before a fix.',
        'Block if each hypothesis does not require a falsifying observation/log line.',
        'Block if seq numbers are required even when logs lack seq; fallback citation language must exist.',
        'Block if the rule is applied too broadly to all bugfixes instead of Strike-3/post-instrumentation handoffs.',
        'Return JSON: { approved, score, blockingIssues, nonBlockingIssues, acceptanceMatrix, changedFiles }.',
      ],
      context: {
        issueContext: args.issueContext,
        codebaseMap: args.codebaseMap,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        verification: args.verification,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'blockingIssues', 'acceptanceMatrix'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalGateTask = defineTask('issue-881.final-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final gate for issue #881',
  labels: ['issue-881', 'final-gate'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'release gatekeeper',
      task: 'Decide whether the issue #881 implementation is ready for PR delivery.',
      instructions: [
        'Pass only if verification.passed is true and review.approved is true.',
        'Confirm no unrelated source changes are included.',
        'Confirm changedFiles are limited to process-library prompt/schema/docs/tests appropriate for this issue.',
        'Confirm the final summary links the implementation to #881 and names the verification evidence.',
        'If placement is still ambiguous or verification is incomplete, set needsMaintainerDecision=true with a precise question.',
        'Return JSON: { passed, needsMaintainerDecision, question, changedFiles, verificationSummary, prSummary, residualRisk }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        codebaseMap: args.codebaseMap,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        attempts: args.attempts,
        implementation: args.implementation,
        verification: args.verification,
        review: args.review,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'needsMaintainerDecision', 'changedFiles', 'verificationSummary', 'prSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
