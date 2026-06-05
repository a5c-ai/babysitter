/**
 * @process repo/issue-877-harness-aware-doctor
 * @description Fix issue #877: make /babysitter:doctor harness-aware so non-StopHook harnesses do not report false CRITICAL hook failures.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts: number, targetFiles: string[], verificationCommands: string[], acceptanceCriteria: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/methodologies/gsd/iterative-convergence.js
 * - library/methodologies/superpowers/verification-before-completion.js
 * - .a5c/processes/issue-531-plugin-marketplace-version-sync.mjs
 *
 * Process-library note:
 * - The requested .a5c/process-library/ directory is not present in this checkout.
 * - Closest available methodology references are under library/methodologies/.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - The canonical doctor command source is plugins/babysitter-unified/commands/doctor.md.
 * - The SDK command template is generated from that source at packages/sdk/src/prompts/templates/commands/doctor.md by scripts/sync-sdk-command-templates.cjs.
 * - The SDK already exposes harness truth through packages/sdk/src/harness/discovery.ts, packages/sdk/src/harness/registry.ts, packages/sdk/src/harness/types.ts, and adapter getCapabilities()/supportsHookType().
 * - Pi advertises Programmatic, SessionBinding, and HeadlessPrompt, with hookDriven: false and noHookSupport: true in packages/sdk/src/harness/adapters/pi.ts.
 * - Existing harness tests cover capability declarations and unsupported stop hooks in packages/sdk/src/harness/__tests__/, so the implementation should extend or mirror those guardrails instead of duplicating capability truth in prose.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const maxAttempts = inputs.maxAttempts ?? 3;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-877.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-877.reuse-audit',
  });

  const sourceTrace = await ctx.task(traceDoctorSourceTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-877.source-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    sourceTrace,
  }, {
    key: 'issue-877.regression-plan',
  });

  const design = await ctx.task(designHarnessAwareDoctorTask, {
    inputs,
    issueContext,
    reuseAudit,
    sourceTrace,
    regressionPlan,
  }, {
    key: 'issue-877.fix-design',
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
      sourceTrace,
      regressionPlan,
      design,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-877.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      sourceTrace,
      regressionPlan,
      design,
      implementation,
      attempt,
    }, {
      key: `issue-877.verification.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      inputs,
      issueContext,
      reuseAudit,
      sourceTrace,
      regressionPlan,
      design,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-877.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext,
    reuseAudit,
    sourceTrace,
    regressionPlan,
    design,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-877.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #877 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-877', 'doctor', 'harness-capabilities'],
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
      reuseAudit,
      sourceTrace,
      regressionPlan,
      design,
      implementation,
      verification,
      review,
      finalGate,
    }, {
      key: 'issue-877.delivery',
    })
    : null;

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'doctor-source-trace',
      'regression-plan',
      'harness-aware-design',
      'implementation-loop',
      'verification-gate',
      'review-gate',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    sourceTrace,
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

export const readIssueContextTask = defineTask('issue-877.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #877 and extract the authoritative spec',
  labels: ['issue-877', 'issue-context', 'doctor'],
  agent: {
    name: 'doctor-issue-context-reader',
    prompt: {
      role: 'senior Babysitter SDK and plugin maintainer',
      task: 'Read the issue and produce the implementation spec. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments; if GitHub says there is no PR with that number, record that result and continue.`,
        'Treat the issue body, every comment, and labels as the source of truth.',
        'Preserve the triage comment requirements around StopHook capability gating, neutral N/A verdicts, Pi extension health checks, generic session wording, and regression coverage.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, reproduction, recommendedFix, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-877.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for doctor harness awareness',
  labels: ['issue-877', 'reuse-audit', 'sdk', 'plugins'],
  agent: {
    name: 'doctor-reuse-auditor',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Find existing infrastructure that should be reused before changing doctor guidance or adding tests. Do not edit files.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract and scan these keywords: doctor, StopHook, stop-hook, supportsHookType, getCapabilities, detectCallerHarness, detectAdapter, HarnessCapability, noHookSupport, hookDriven, hooks.json, CLAUDE_PLUGIN_ROOT, PI_PLUGIN_ROOT, pi.registerCommand, session_start, sync-sdk-command-templates, generate:plugins.',
        'Inspect the target files and related tests before proposing any new helper, CLI surface, generated file, or duplicated harness capability table.',
        'Start with target files:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Identify canonical source files, generated copies, command-template sync checks, generated plugin surfaces, and existing harness capability tests that can be extended.',
        'Return JSON: { findingsMarkdown, canonicalSources, generatedSurfaces, capabilitySources, candidateTests, syncCommands, noNewInfrastructureNeeded, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceDoctorSourceTask = defineTask('issue-877.trace-doctor-source', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace doctor command sources, generated surfaces, and capability APIs',
  labels: ['issue-877', 'source-trace', 'doctor'],
  agent: {
    name: 'doctor-source-tracer',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Map the current doctor command propagation path and harness capability APIs before code changes.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below. Inspect the repository directly.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Trace plugins/babysitter-unified/commands/doctor.md into packages/sdk/src/prompts/templates/commands/doctor.md through scripts/sync-sdk-command-templates.cjs.',
        'Identify any generated per-harness doctor command or skill copies that should be updated by existing generation/sync commands rather than by hand.',
        'Trace how detectCallerHarness(), detectAdapter(), getCapabilities(), supportsHookType("stop"), and HarnessCapability.StopHook are exposed to command guidance or CLI helpers.',
        'Inspect Pi, Claude Code, Codex, Cursor, OpenCode, and OpenClaw adapters enough to distinguish StopHook and non-StopHook harnesses.',
        'Return JSON: { sourceOfTruthFiles, generatedFiles, capabilityApis, stopHookHarnesses, nonStopHookHarnesses, currentFalseFailurePaths, syncPath, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-877.regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression strategy for non-StopHook doctor behavior',
  labels: ['issue-877', 'tests', 'quality-gate'],
  agent: {
    name: 'doctor-regression-planner',
    prompt: {
      role: 'test strategy architect for SDK prompt and harness behavior',
      task: 'Design focused regression coverage before implementation.',
      instructions: [
        'Do not edit files.',
        'Use the issue context, reuse audit, and source trace to identify the smallest deterministic guardrails.',
        'The regression plan must prove that doctor guidance no longer requires Claude hook files for a detected harness that lacks HarnessCapability.StopHook.',
        'Include coverage for neutral N/A verdict handling so N/A does not count as WARN, FAIL, or CRITICAL.',
        'Include sync coverage so the SDK doctor template remains generated from the unified doctor source.',
        'Prefer extending existing SDK prompt/template or harness tests over adding broad snapshot churn.',
        'Return JSON: { testFilesToModify, newTests, staticChecks, fixturesOrEnv, commands, expectedFailuresBeforeFix, acceptanceMapping, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designHarnessAwareDoctorTask = defineTask('issue-877.design-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the harness-aware doctor fix',
  labels: ['issue-877', 'design', 'doctor'],
  agent: {
    name: 'doctor-fix-designer',
    prompt: {
      role: 'senior Babysitter plugin and SDK maintainer',
      task: 'Produce the concrete implementation design for issue #877. Do not edit files.',
      instructions: [
        'Use SDK-owned harness capability truth. Do not duplicate a manually-maintained harness capability table in the doctor prose if an existing API or CLI helper can expose it.',
        'Design a Phase 0 harness detection section for doctor that records detected harness name, matched env vars, capabilities, and whether StopHook is advertised.',
        'Gate section 10 hook-specific checks on HarnessCapability.StopHook or supportsHookType("stop").',
        'When StopHook is absent, make section 10 emit N/A with an explicit harness-aware explanation. N/A must be neutral in the final health determination.',
        'For Pi, either leave section 10 at N/A or add a small Pi extension/command registration health check only if it can be implemented from existing PI_PLUGIN_ROOT/package surfaces without broad new infrastructure.',
        'Replace Claude-specific wording in generic session-provenance and escalation sections with harness-neutral language, keeping Claude-specific remediation only under Claude Code conditions.',
        'Plan generated file sync from unified doctor source to SDK template and generated plugin copies using existing scripts.',
        'Return JSON: { implementationSteps, filePlan, dataFlow, nAVerdictRules, piSpecificBehavior, syncPlan, testPlan, riskControls, maintainerDecisionNeeded, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFixTask = defineTask('issue-877.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #877 harness-aware doctor fix (attempt ${args.attempt})`,
  labels: ['issue-877', 'implementation', 'doctor'],
  agent: {
    name: 'doctor-harness-aware-implementer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior TypeScript, SDK prompt, and plugin generation engineer',
      task: 'Implement the issue #877 fix and focused regression coverage in the repository.',
      instructions: [
        'Edit the repository directly.',
        'Keep the change scoped to doctor command guidance, generated SDK command templates, generated plugin copies if required by existing scripts, and focused regression tests or sync checks.',
        'Do not alter unrelated dirty worktree files.',
        'Update plugins/babysitter-unified/commands/doctor.md as the canonical source before generated copies.',
        'Sync packages/sdk/src/prompts/templates/commands/doctor.md through the existing command-template sync path.',
        'Use SDK-owned harness capability truth in the guidance: detectCallerHarness()/detectAdapter()/getCapabilities()/supportsHookType("stop") or an existing CLI wrapper exposing equivalent adapter capabilities.',
        'Ensure non-StopHook harnesses, especially Pi, do not require CLAUDE_PLUGIN_ROOT, hooks.json, babysitter-stop-hook.sh, babysitter-session-start-hook.sh, or ~/.claude settings for section 10.',
        'Ensure N/A is neutral in final health determination and does not produce WARNING or CRITICAL.',
        'Clean up Claude-specific session-provenance and /debug wording so it appears only when the detected harness is Claude Code or when explicitly diagnosing Claude Code.',
        'Add or update the focused regression coverage from the regression plan.',
        'Run only the verification commands needed while iterating; the verification task will run the full gate.',
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        'Design JSON:',
        JSON.stringify(args.design ?? {}, null, 2),
        'Return JSON: { changedFiles, summary, rootCauseAddressed, testsAdded, generatedSyncRun, verificationCommandsRun, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyFixTask = defineTask('issue-877.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #877 verification gate (attempt ${args.attempt})`,
  labels: ['issue-877', 'verification', 'quality-gate'],
  agent: {
    name: 'doctor-fix-verifier',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'evidence-focused SDK verification engineer',
      task: 'Run the full verification gate and report exact evidence.',
      instructions: [
        'Run the verification commands from inputs unless a command is clearly inapplicable; if skipped, explain why.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also inspect the diff for doctor-specific invariants:',
        '- non-StopHook path emits N/A rather than FAIL for section 10',
        '- N/A is neutral in overall health determination',
        '- Pi/non-StopHook path does not require CLAUDE_PLUGIN_ROOT, hooks.json, hook shell scripts, or ~/.claude settings',
        '- Claude Code StopHook diagnostics remain available when StopHook is advertised',
        '- SDK template and generated/synced command copies match the canonical doctor source',
        'Return JSON: { passed, commands, skippedCommands, invariantChecks, changedFiles, failures, evidence, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-877.review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #877 fix against spec (attempt ${args.attempt})`,
  labels: ['issue-877', 'review', 'quality-gate'],
  agent: {
    name: 'doctor-capability-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior SDK/plugin code reviewer',
      task: 'Review the implementation against issue #877, the triage comment, and the current diff.',
      instructions: [
        'Use a code-review stance. Prioritize behavioral regressions, stale generated copies, false positives/negatives in doctor verdicts, and missing tests.',
        'Compare directly against the issue context, design, implementation result, and verification result.',
        'Check that the implementation reuses SDK capability truth instead of duplicating fragile per-harness tables.',
        'Check that StopHook harnesses still get actionable hook diagnostics.',
        'Check that non-StopHook harnesses get neutral N/A behavior and no Claude-only requirements.',
        'Check that generated files were updated by the established sync path and unrelated dirty files were not included.',
        'Return JSON: { approved, findings, blockingIssues, requiredFixes, changedFiles, testGaps, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-877.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate final acceptance for issue #877',
  labels: ['issue-877', 'final-gate', 'acceptance'],
  agent: {
    name: 'doctor-final-acceptance',
    prompt: {
      role: 'release-minded maintainer',
      task: 'Decide whether the run is ready to deliver.',
      instructions: [
        'Evaluate all acceptance criteria line by line.',
        JSON.stringify(args.inputs.acceptanceCriteria, null, 2),
        'Require verification.passed === true and review.approved === true.',
        'Require evidence that N/A is neutral and Pi/non-StopHook harnesses are not marked CRITICAL for missing Claude hooks.',
        'If the only unresolved question is whether to add a Pi-specific extension health check beyond N/A, mark needsMaintainerDecision only if the issue cannot be safely closed without that choice.',
        'Return JSON: { passed, acceptanceResults, changedFiles, needsMaintainerDecision, question, blockers, deliveryNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverTask = defineTask('issue-877.deliver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, open implementation PR, and comment on issue #877',
  labels: ['issue-877', 'delivery', 'github'],
  agent: {
    name: 'doctor-fix-deliverer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'GitHub delivery engineer',
      task: 'Deliver the completed implementation after all gates pass.',
      instructions: [
        `Create or switch to implementation branch ${args.inputs.implementationBranch} from ${args.inputs.baseBranch}.`,
        'Stage only files changed for issue #877. Do not stage unrelated dirty worktree files.',
        'Commit with a concise fix-scoped message.',
        'Push the branch.',
        'Create a GitHub PR against the base branch that links to the issue.',
        'Comment on the issue with a summary, verification evidence, and PR link.',
        'Return JSON: { committed, commitSha, branch, prUrl, issueCommentUrl, stagedFiles, summary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
