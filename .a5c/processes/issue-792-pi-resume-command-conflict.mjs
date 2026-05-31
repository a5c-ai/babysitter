/**
 * @process repo/issue-792-pi-resume-command-conflict
 * @description Fix issue #792: the Pi plugin must not register top-level /resume because it conflicts with Pi's built-in session resume command.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts: number, reservedCommands: string[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], commandSurface: object, verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - cradle/bugfix
 * - methodologies/plan-and-execute
 * - methodologies/superpowers/verification-before-completion
 * - tdd-quality-convergence
 * - specializations/sdk-platform-development/plugin-extension-architecture
 * - specializations/qa-testing-automation/quality-gates
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No repo-local .a5c/process-library/ directory exists, but the installed process library is available at /home/runner/.a5c/process-library/babysitter-repo.
 * - The legacy issue path plugins/babysitter-pi/extensions/index.ts is not present in this checkout; the live source is plugins/babysitter-unified/per-harness/pi/extensions-index.ts.
 * - The Pi README that documents the exposed slash commands is plugins/babysitter-unified/per-harness/pi/README.md.
 * - The current Pi extension registers every COMMANDS item twice: a top-level command and a babysitter:<name> command. "resume" is still in COMMANDS, so /resume is registered by the Babysitter Pi extension.
 * - Existing generated-plugin regression coverage lives in packages/extension-mux/src/__tests__/bundleRegression.test.ts and already checks harness-specific generated README and extension surfaces for other targets; extend that pattern for Pi instead of adding a new test harness.
 * - Existing quality entrypoints to reuse are npm run test:extension-mux, npm run build:extension-mux, npm run generate:plugins, npm run verify:metadata, and git diff --check.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const asText = value => (typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2));

export async function process(inputs, ctx) {
  const maxAttempts = inputs.maxAttempts ?? 3;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-792.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: 'issue-792.reuse-audit',
  });

  const processLibrary = await ctx.task(processLibraryResearchTask, { inputs, issueContext, reuseAudit }, {
    key: 'issue-792.process-library-research',
  });

  const commandSurface = await ctx.task(tracePiCommandSurfaceTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibrary,
  }, {
    key: 'issue-792.command-surface-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibrary,
    commandSurface,
  }, {
    key: 'issue-792.regression-plan',
  });

  const design = await ctx.task(designFixTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibrary,
    commandSurface,
    regressionPlan,
  }, {
    key: 'issue-792.fix-design',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      processLibrary,
      commandSurface,
      regressionPlan,
      design,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-792.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyFixTask, {
      inputs,
      issueContext,
      commandSurface,
      regressionPlan,
      design,
      implementation,
      attempt,
    }, {
      key: `issue-792.verification.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      processLibrary,
      commandSurface,
      regressionPlan,
      design,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-792.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext,
    commandSurface,
    regressionPlan,
    design,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-792.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #792 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-792', 'plugins', 'pi'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  const delivery = finalGate?.passed === true
    ? await ctx.task(deliverTask, {
      inputs,
      issueContext,
      commandSurface,
      implementation,
      verification,
      review,
      finalGate,
    }, {
      key: 'issue-792.delivery',
    })
    : null;

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'process-library-research',
      'pi-command-surface-trace',
      'regression-plan',
      'fix-design',
      'implementation-loop',
      'verification-gate',
      'review-gate',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    commandSurface,
    reuseAudit,
    processLibrary,
    regressionPlan,
    design,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-792.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #792 and extract the behavioral spec',
  labels: ['issue-792', 'plugins', 'pi', 'issue-context'],
  agent: {
    name: 'pi-plugin-context-reader',
    prompt: {
      role: 'senior Babysitter plugin maintainer',
      task: 'Read the GitHub issue and return the authoritative implementation spec. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments; if GitHub says there is no PR with that number, record that result and continue.`,
        'Treat the issue body, every comment, and labels as the source of truth.',
        'Preserve the reporter reproduction, the triage comment that identifies the unified Pi source path, and the workaround that /babysitter:resume remains usable.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, reproduction, priority, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-792.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for the Pi command conflict',
  labels: ['issue-792', 'reuse-audit', 'plugins', 'pi'],
  agent: {
    name: 'pi-command-reuse-auditor',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Find existing infrastructure that should be reused before changing Pi plugin command registration. Do not edit files.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract and scan these keywords: pi, resume, registerCommand, COMMANDS, babysitter:resume, slash command, built-in command, reserved command, extension-mux, generated plugin, README.',
        'Check for .a5c/reuse-audit.json. If absent, record that and use targeted plugin and extension-mux globs.',
        'Inspect the current Pi source, other per-harness command registration sources, generated plugin compiler tests, README surfaces, package scripts, and metadata verification paths.',
        'Do not propose a new command framework; prefer a local reserved-command guard in the Pi extension and an adjacent regression test.',
        'Return JSON: { findingsMarkdown, existingInfrastructure, liveSourcePaths, legacyPathsAbsent, candidateTests, generatedOutputPaths, noNewInfrastructureNeeded, risks }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'TARGET_FILES:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const processLibraryResearchTask = defineTask('issue-792.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process methodologies and specializations',
  labels: ['issue-792', 'process-library', 'methodology'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process architect',
      task: 'Research process-library guidance relevant to a narrow plugin command-surface bugfix. Do not edit files.',
      instructions: [
        'Inspect .a5c/process-library/ if present. If absent, state that explicitly.',
        'Inspect /home/runner/.a5c/process-library/babysitter-repo/library entries when available.',
        'Prefer patterns from cradle/bugfix, plan-and-execute, verification-before-completion, tdd-quality-convergence, plugin-extension-architecture, and qa-testing-automation/quality-gates.',
        'Recommend a flat phase list because the bug class and affected surface are already known from triage.',
        'Return JSON: { processLibraryPresent: boolean, filesRead: string[], matchingMethodologies: string[], matchingSpecializations: string[], processShapeRecommendation: string, authoringConstraints: string[] }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'REUSE_AUDIT:',
        asText(args.reuseAudit),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const tracePiCommandSurfaceTask = defineTask('issue-792.trace-pi-command-surface', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace the Pi command registration and documentation surfaces',
  labels: ['issue-792', 'plugins', 'pi', 'command-surface'],
  agent: {
    name: 'pi-command-surface-tracer',
    prompt: {
      role: 'senior plugin platform engineer',
      task: 'Trace the exact Pi command registration and generated output path before implementation. Do not edit files.',
      instructions: [
        'Read plugins/babysitter-unified/per-harness/pi/extensions-index.ts and identify every top-level and namespaced command currently registered.',
        'Read plugins/babysitter-unified/per-harness/pi/README.md and identify docs that imply /resume is a top-level Babysitter command.',
        'Inspect packages/extension-mux/src/__tests__/bundleRegression.test.ts and compile target naming for Pi generated plugins.',
        'Compare the Pi surface with OMP/OpenClaw only to avoid unintentionally changing other harness command behavior.',
        'Return JSON: { commandRegistrations: object[], docsToUpdate: string[], generatedOutputExpectations: string[], regressionTestInsertionPoints: string[], nonGoals: string[], risks: string[] }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'REUSE_AUDIT:',
        asText(args.reuseAudit),
        '',
        'PROCESS_LIBRARY:',
        asText(args.processLibrary),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-792.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan regression coverage for the Pi /resume conflict',
  labels: ['issue-792', 'tests-first', 'plugins', 'pi'],
  agent: {
    name: 'pi-command-test-planner',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Design focused regression coverage for the command conflict before implementation. Do not edit files.',
      instructions: [
        'Use only the issue context, reuse audit, process-library research, and command-surface trace.',
        'Plan a deterministic test that proves the Pi generated extension does not register top-level "resume" while still registering "babysitter:resume".',
        'Prefer extending packages/extension-mux/src/__tests__/bundleRegression.test.ts if target compilation emits Pi extensions/index.ts from the unified source.',
        'Include README regression expectations: /babysitter:resume should be documented in the quick command list; /resume should not be listed as a Babysitter Pi quick command.',
        'Avoid tests that require launching Pi interactively.',
        'Return JSON: { testFiles: string[], testCases: object[], redGateExpectations: string[], limitations: string[], commandsToRun: string[] }.',
        '',
        'COMMAND_SURFACE:',
        asText(args.commandSurface),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designFixTask = defineTask('issue-792.design-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the Pi reserved-command guard',
  labels: ['issue-792', 'design', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-fix-designer',
    prompt: {
      role: 'senior Babysitter plugin engineer',
      task: 'Produce the narrow implementation design for issue #792. Do not edit files.',
      instructions: [
        'Design a local reserved-command guard for Pi built-ins using args.inputs.reservedCommands.',
        'The guard must skip only top-level pi.registerCommand(name, ...) for reserved names and must keep pi.registerCommand(`babysitter:${name}`, ...).',
        'Keep "resume" in COMMANDS so /babysitter:resume continues to forward to the resume skill.',
        'Do not change command forwarding, session environment syncing, i18n behavior, hooks, other harnesses, or command-backed skills.',
        'Plan README updates that replace /resume with /babysitter:resume in Pi usage docs while preserving the canonical skill list text.',
        'Return JSON: { approach, filesToChange, codeChangeSummary, docsChangeSummary, testChangeSummary, acceptanceCriteria, rollbackPlan, risks }.',
        '',
        'REGRESSION_PLAN:',
        asText(args.regressionPlan),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFixTask = defineTask('issue-792.implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Pi /resume conflict fix attempt ${args.attempt}`,
  labels: ['issue-792', 'implementation', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-implementer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 12,
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Implement the issue #792 fix in the repository working tree.',
      instructions: [
        'Edit only files needed for issue #792.',
        'Add a Pi reserved-command set or equivalent local guard in plugins/babysitter-unified/per-harness/pi/extensions-index.ts.',
        'Skip top-level registration for reserved command names from args.inputs.reservedCommands, currently ["resume"].',
        'Keep namespaced registration for every command, including babysitter:resume.',
        'Update plugins/babysitter-unified/per-harness/pi/README.md so the quick command list uses /babysitter:resume instead of /resume and no longer advertises top-level /resume as a Babysitter command.',
        'Add or update focused regression coverage following args.regressionPlan. Prefer bundleRegression.test.ts if feasible.',
        'Do not modify generated artifacts unless repository policy or tests require it; record if generation produces only ignored output.',
        'Preserve unrelated local changes.',
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[], generatedArtifactsTouched: string[], notes: string[] }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'DESIGN:',
        asText(args.design),
        '',
        'PREVIOUS_VERIFICATION:',
        asText(args.previousVerification),
        '',
        'PREVIOUS_REVIEW:',
        asText(args.previousReview),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyFixTask = defineTask('issue-792.verify-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run deterministic quality gates attempt ${args.attempt}`,
  labels: ['issue-792', 'verification', 'quality-gate', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-quality-runner',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 10,
    prompt: {
      role: 'senior plugin QA engineer',
      task: 'Run and report the deterministic quality gates for the issue #792 implementation.',
      instructions: [
        'Run every command in args.inputs.verificationCommands in order.',
        'A nonzero exit is blocking unless the command is unavailable because dependencies are not installed; in that case record the exact failure and do not mark passed true.',
        'Inspect the resulting diff and generated Pi extension output, if generation is available, to confirm no top-level registerCommand("resume" | \'resume\') is emitted for Pi while registerCommand("babysitter:resume") remains.',
        'Confirm README no longer advertises /resume in the Pi quick command list and does advertise /babysitter:resume.',
        'Confirm no other harness command surface was changed unless explicitly justified by the implementation.',
        'Return JSON: { passed: boolean, commands: object[], commandSurfaceChecks: object, docsChecks: object, generatedChecks: object, blockingFailures: string[], notes: string[] }.',
      ],
      args: {
        verificationCommands: args.inputs.verificationCommands,
        implementation: args.implementation,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-792.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #792 implementation attempt ${args.attempt}`,
  labels: ['issue-792', 'review', 'quality-gate', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-code-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'strict senior code reviewer for plugin command surfaces',
      task: 'Review the working tree diff for issue #792 and decide whether it is safe to ship.',
      instructions: [
        'Review only the diff and relevant existing context for issue #792.',
        'Prioritize behavioral regressions, accidental removal of /babysitter:resume, overbroad changes to other harnesses, missing regression tests, stale docs, and generated-output drift.',
        'Check that the fix is data-driven enough to add future Pi reserved commands without changing the loop again, but do not require a broad abstraction.',
        'Return JSON: { approved: boolean, findings: object[], changedFiles: string[], residualRisks: string[], requiredFollowUps: string[] }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'VERIFICATION:',
        asText(args.verification),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-792.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #792',
  labels: ['issue-792', 'acceptance', 'quality-gate', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-acceptance-gate',
    prompt: {
      role: 'release-minded Babysitter maintainer',
      task: 'Decide whether the issue #792 implementation satisfies the issue and is ready for delivery. Do not edit files.',
      instructions: [
        'Accept only if verification passed, review approved, and the implementation satisfies every issue acceptance criterion.',
        'Require these final invariants: top-level /resume is not registered by the Pi Babysitter extension; /babysitter:resume is still registered and forwards to the resume skill; Pi README advertises /babysitter:resume; focused regression coverage exists; unrelated local changes are not included.',
        'If the legacy generated plugins/babysitter-pi path needs a release artifact update but is absent from the checkout, record that as a release note rather than blocking the source fix.',
        'Return JSON: { passed: boolean, needsMaintainerDecision: boolean, question: string, changedFiles: string[], acceptance: object, unresolvedRisks: string[], releaseNotes: string[] }.',
        '',
        'ATTEMPTS:',
        asText(args.attempts),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverTask = defineTask('issue-792.deliver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare issue #792 delivery summary',
  labels: ['issue-792', 'delivery', 'plugins', 'pi'],
  agent: {
    name: 'pi-plugin-delivery-writer',
    prompt: {
      role: 'senior maintainer preparing a concise PR handoff',
      task: 'Prepare the final delivery summary for the issue #792 implementation. Do not edit files.',
      instructions: [
        'Summarize the command-surface change, docs change, regression coverage, and verification results.',
        'Include the exact files changed and any skipped commands with reasons.',
        'State that the PR should link to #792.',
        'Return JSON: { summary: string, changedFiles: string[], tests: string[], verification: string[], prBody: string, issueComment: string }.',
      ],
      args: {
        issueContext: args.issueContext,
        implementation: args.implementation,
        verification: args.verification,
        review: args.review,
        finalGate: args.finalGate,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
