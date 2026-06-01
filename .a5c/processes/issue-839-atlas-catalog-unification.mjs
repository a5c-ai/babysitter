/**
 * @process repo/issue-839-atlas-catalog-unification
 * @description TDD, spec-driven implementation process for issue #839: merge packages/agent-catalog source into packages/atlas/src/catalog.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetQuality: number, maxAttemptsPerPhase: number, phases: array, verificationCommands: string[] }
 * @outputs { success: boolean, phases: array, attempts: array, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/atlas-catalog-unification/README.md
 * - library/methodologies/atdd-tdd/README.md
 * - library/methodologies/gsd/iterative-convergence.js
 * - library/methodologies/adversarial-spec-debates.js
 * - .a5c/processes/issue-600-deduplicate-background-registry-shell-invocation.mjs
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - .a5c/process-library/ is not present in this checkout. Matching methodology assets live under library/methodologies and checked-in process examples live under .a5c/processes.
 * - The closest methodology matches are ATDD/TDD for acceptance-test-first implementation, GSD iterative convergence for quality scoring loops, and adversarial-spec-debates for challenge/judge review.
 * - Current agent-catalog source and contract tests live under packages/agent-catalog/src. The target package, packages/atlas, already exports a root graph API and has package.json export entries for "." and "./indexer".
 * - Existing downstream consumers import @a5c-ai/agent-catalog from packages/agent-mux/adapters, packages/sdk, hooks-mux adapters, webui/agent-platform vitest aliases, and related package manifests.
 * - Root build/test scripts and package-lock.json still name @a5c-ai/agent-catalog; build:sdk currently builds atlas, then agent-catalog, then sdk.
 * - docs/atlas-catalog-unification/README.md is the authoritative issue reference and calls for removing packages/agent-catalog, adding @a5c-ai/atlas/catalog, migrating imports, updating workspace/tsconfig/CI, regenerating the lockfile, and building/testing.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_QUALITY = 90;
const DEFAULT_MAX_ATTEMPTS = 4;

const phaseResultSchema = {
  type: 'object',
  required: ['phaseId', 'summary', 'changedFiles', 'risks'],
  properties: {
    phaseId: { type: 'string' },
    summary: { type: 'string' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    testsAddedOrChanged: { type: 'array', items: { type: 'string' } },
    commandsRun: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
};

const verificationSchema = {
  type: 'object',
  required: ['passed', 'commands', 'failures', 'summary'],
  properties: {
    passed: { type: 'boolean' },
    commands: {
      type: 'array',
      items: {
        type: 'object',
        required: ['command', 'passed'],
        properties: {
          command: { type: 'string' },
          passed: { type: 'boolean' },
          notes: { type: 'string' },
        },
      },
    },
    failures: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
};

const reviewSchema = {
  type: 'object',
  required: ['approved', 'score', 'findings', 'requiredFixes', 'summary'],
  properties: {
    approved: { type: 'boolean' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    findings: { type: 'array', items: { type: 'string' } },
    requiredFixes: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
};

export async function process(inputs, ctx) {
  const targetQuality = inputs?.targetQuality ?? DEFAULT_TARGET_QUALITY;
  const maxAttemptsPerPhase = inputs?.maxAttemptsPerPhase ?? DEFAULT_MAX_ATTEMPTS;
  const phases = inputs?.phases ?? defaultPhases();

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-839.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-839.reuse-audit',
  });

  const executableSpec = await ctx.task(authorExecutableSpecTask, {
    inputs,
    issueContext,
    reuseAudit,
    phases,
  }, {
    key: 'issue-839.executable-spec',
  });

  const allAttempts = [];
  const completedPhases = [];
  let previousPhase = null;

  for (const phase of phases) {
    let phaseComplete = false;
    let red = null;
    let green = null;
    let refactor = null;
    let verification = null;
    let review = null;
    const phaseAttempts = [];

    for (let attempt = 1; attempt <= maxAttemptsPerPhase; attempt += 1) {
      red = await ctx.task(writeFailingTestsTask, {
        inputs,
        issueContext,
        reuseAudit,
        executableSpec,
        phase,
        previousPhase,
        previousVerification: verification,
        previousReview: review,
        attempt,
      }, {
        key: `issue-839.${phase.id}.red.${attempt}`,
      });

      green = await ctx.task(implementMinimumTask, {
        inputs,
        issueContext,
        reuseAudit,
        executableSpec,
        phase,
        red,
        previousPhase,
        previousVerification: verification,
        previousReview: review,
        attempt,
      }, {
        key: `issue-839.${phase.id}.green.${attempt}`,
      });

      refactor = await ctx.task(refactorTask, {
        inputs,
        issueContext,
        reuseAudit,
        executableSpec,
        phase,
        red,
        green,
        previousPhase,
        attempt,
      }, {
        key: `issue-839.${phase.id}.refactor.${attempt}`,
      });

      verification = await ctx.task(phaseVerificationCheckpointTask, {
        inputs,
        issueContext,
        reuseAudit,
        executableSpec,
        phase,
        red,
        green,
        refactor,
        previousPhase,
        attempt,
      }, {
        key: `issue-839.${phase.id}.verification.${attempt}`,
      });

      review = await ctx.task(adversarialReviewTask, {
        inputs,
        issueContext,
        reuseAudit,
        executableSpec,
        phase,
        red,
        green,
        refactor,
        verification,
        previousPhase,
        targetQuality,
        attempt,
      }, {
        key: `issue-839.${phase.id}.adversarial-review.${attempt}`,
      });

      phaseComplete = verification?.passed === true && review?.approved === true && review?.score >= targetQuality;
      const attemptRecord = { phase: phase.id, attempt, red, green, refactor, verification, review, phaseComplete };
      phaseAttempts.push(attemptRecord);
      allAttempts.push(attemptRecord);

      if (phaseComplete) {
        break;
      }
    }

    const checkpoint = await ctx.task(interphaseCheckpointTask, {
      inputs,
      issueContext,
      reuseAudit,
      executableSpec,
      phase,
      phaseAttempts,
      red,
      green,
      refactor,
      verification,
      review,
      targetQuality,
      phaseComplete,
    }, {
      key: `issue-839.${phase.id}.interphase-checkpoint`,
    });

    completedPhases.push({ phase, phaseComplete, attempts: phaseAttempts, checkpoint });
    previousPhase = { phase, red, green, refactor, verification, review, checkpoint };

    if (!phaseComplete) {
      await ctx.breakpoint({
        title: `Issue #839 ${phase.title} Did Not Converge`,
        question: `Phase ${phase.id} ended below the ${targetQuality}/100 adversarial review threshold or failed verification. Continue manually, adjust scope, or pause?`,
        options: ['Continue with current scope', 'Pause for maintainer guidance'],
        expert: 'owner',
        tags: ['issue-839', 'quality-gate', phase.id],
        context: {
          runId: ctx.runId,
          phase,
          latestVerification: verification,
          latestReview: review,
        },
      });
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    executableSpec,
    completedPhases,
    allAttempts,
    targetQuality,
  }, {
    key: 'issue-839.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: completedPhases,
    attempts: allAttempts,
    finalGate,
    metadata: {
      processId: 'repo/issue-839-atlas-catalog-unification',
      issueNumber: inputs?.issueNumber ?? 839,
      targetQuality,
      maxAttemptsPerPhase,
      timestamp: ctx.now(),
    },
  };
}

export const readIssueContextTask = defineTask('issue-839.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #839 and referenced unification docs',
  labels: ['issue-839', 'atlas', 'catalog', 'spec'],
  agent: {
    name: 'atlas-catalog-spec-reader',
    prompt: {
      role: 'senior Babysitter Atlas maintainer',
      task: 'Read the issue, labels, comments, and referenced docs. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber ?? 839} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber ?? 839} --json files,title,body,comments; if GitHub reports that the number is not a PR, record that fact and continue.`,
        'Read docs/atlas-catalog-unification/README.md completely.',
        'Treat the issue body, all comments, labels, and referenced docs as the authoritative spec.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, referencedDocs, acceptanceCriteria, explicitNonGoals, targetMoveMap, downstreamConsumers, workspaceMetadataTargets, risks, openQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'issueSummary', 'acceptanceCriteria', 'targetMoveMap', 'downstreamConsumers', 'risks'],
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        issueSummary: { type: 'string' },
        commentsSummary: { type: 'string' },
        referencedDocs: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        explicitNonGoals: { type: 'array', items: { type: 'string' } },
        targetMoveMap: { type: 'array', items: { type: 'string' } },
        downstreamConsumers: { type: 'array', items: { type: 'string' } },
        workspaceMetadataTargets: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-839.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for catalog unification',
  labels: ['issue-839', 'reuse-audit', 'atlas'],
  agent: {
    name: 'atlas-catalog-reuse-auditor',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Find existing infrastructure that should be reused before implementation. Do not edit files.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract and scan these keywords: agent-catalog, atlas/catalog, atlas package exports, discovery, models, sdk, data, package workspace, tsconfig references, vitest alias, build:sdk, package-lock, CI publish, catalog contract tests.',
        'Inspect packages/agent-catalog/package.json, packages/atlas/package.json, root package.json, package-lock.json, root tsconfig, packages/agent-catalog/src, packages/atlas/src, consumer imports, and docs/atlas-catalog-unification/README.md.',
        'Also inspect library/methodologies/atdd-tdd, library/methodologies/gsd/iterative-convergence, and library/methodologies/adversarial-spec-debates for process-library matches.',
        'Return JSON: { findingsMarkdown, existingInfrastructure, sourceFilesToMove, testsToMoveOrRewrite, consumerImportSurfaces, packageMetadataSurfaces, buildAndCiSurfaces, methodologyMatches, noNewInfrastructureNeeded, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['findingsMarkdown', 'existingInfrastructure', 'sourceFilesToMove', 'consumerImportSurfaces', 'packageMetadataSurfaces', 'buildAndCiSurfaces', 'methodologyMatches', 'risks'],
      properties: {
        findingsMarkdown: { type: 'string' },
        existingInfrastructure: { type: 'array', items: { type: 'string' } },
        sourceFilesToMove: { type: 'array', items: { type: 'string' } },
        testsToMoveOrRewrite: { type: 'array', items: { type: 'string' } },
        consumerImportSurfaces: { type: 'array', items: { type: 'string' } },
        packageMetadataSurfaces: { type: 'array', items: { type: 'string' } },
        buildAndCiSurfaces: { type: 'array', items: { type: 'string' } },
        methodologyMatches: { type: 'array', items: { type: 'string' } },
        noNewInfrastructureNeeded: { type: 'boolean' },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorExecutableSpecTask = defineTask('issue-839.author-executable-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author executable acceptance spec',
  labels: ['issue-839', 'atdd', 'spec'],
  agent: {
    name: 'atlas-catalog-atdd-specifier',
    prompt: {
      role: 'ATDD/TDD test strategy architect',
      task: 'Turn issue #839 into executable acceptance criteria and a phase-by-phase test plan. Do not edit files.',
      instructions: [
        'Use the issue context and reuse audit as source material:',
        JSON.stringify({ issueContext: args.issueContext, reuseAudit: args.reuseAudit, phases: args.phases }, null, 2),
        'Create Given/When/Then acceptance criteria for the package move, export contract, consumer migration, workspace metadata cleanup, lockfile update, and verification commands.',
        'For each phase, define the red tests that must fail before implementation and the green/refactor expectations.',
        'Make the tests concrete for Vitest/TypeScript/package metadata where possible.',
        'Return JSON: { acceptanceCriteria, phaseSpecs, testMatrix, verificationMatrix, riskControls }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['acceptanceCriteria', 'phaseSpecs', 'testMatrix', 'verificationMatrix', 'riskControls'],
      properties: {
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        phaseSpecs: { type: 'array', items: { type: 'object' } },
        testMatrix: { type: 'array', items: { type: 'string' } },
        verificationMatrix: { type: 'array', items: { type: 'string' } },
        riskControls: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const writeFailingTestsTask = defineTask('issue-839.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `RED: write failing tests for ${args.phase.title}`,
  labels: ['issue-839', 'red', 'tdd', args.phase.id],
  agent: {
    name: 'atlas-catalog-red-test-author',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 10,
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Write the minimum failing tests/spec checks for the current phase before implementation.',
      instructions: [
        'Edit the repository directly, but only tests/spec metadata needed for the RED step.',
        'Do not implement production code in this step.',
        'Respect unrelated dirty worktree changes.',
        'Run the targeted tests or checks needed to prove they fail for the expected reason. Record the failing command and failure signal.',
        'Current phase:',
        JSON.stringify(args.phase, null, 2),
        'Executable spec:',
        JSON.stringify(args.executableSpec, null, 2),
        'Previous phase/checkpoint context:',
        JSON.stringify(args.previousPhase ?? null, null, 2),
        'If this is a metadata-only phase, create or update a deterministic contract test that fails until the metadata is changed.',
        'Return JSON: { phaseId, summary, changedFiles, testsAddedOrChanged, commandsRun, expectedFailures, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['phaseId', 'summary', 'changedFiles', 'testsAddedOrChanged', 'commandsRun', 'expectedFailures', 'risks'],
      properties: {
        phaseId: { type: 'string' },
        summary: { type: 'string' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        testsAddedOrChanged: { type: 'array', items: { type: 'string' } },
        commandsRun: { type: 'array', items: { type: 'string' } },
        expectedFailures: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMinimumTask = defineTask('issue-839.implement-minimum', (args, taskCtx) => ({
  kind: 'agent',
  title: `GREEN: implement minimum for ${args.phase.title}`,
  labels: ['issue-839', 'green', 'tdd', args.phase.id],
  agent: {
    name: 'atlas-catalog-minimum-implementer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 14,
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Implement only the minimum code and metadata needed to pass the RED tests for the current phase.',
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to the current phase and required compatibility surfaces.',
        'Do not skip the failing tests written in RED; make them pass with the smallest coherent change.',
        'Respect unrelated dirty worktree changes.',
        'Current phase:',
        JSON.stringify(args.phase, null, 2),
        'Red step output:',
        JSON.stringify(args.red, null, 2),
        'Previous verification/review feedback:',
        JSON.stringify({ previousVerification: args.previousVerification, previousReview: args.previousReview }, null, 2),
        'Return JSON: { phaseId, summary, changedFiles, testsAddedOrChanged, commandsRun, risks }.',
      ],
    },
    outputSchema: phaseResultSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refactorTask = defineTask('issue-839.refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: `REFACTOR: clean up ${args.phase.title}`,
  labels: ['issue-839', 'refactor', 'tdd', args.phase.id],
  agent: {
    name: 'atlas-catalog-refactorer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 10,
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Refactor the current phase implementation without changing behavior.',
      instructions: [
        'Edit the repository directly only if cleanup is justified by duplication, naming, import shape, or package-boundary clarity.',
        'Do not broaden scope beyond the current phase.',
        'Run the targeted phase checks after refactoring.',
        'Current phase:',
        JSON.stringify(args.phase, null, 2),
        'Green step output:',
        JSON.stringify(args.green, null, 2),
        'Return JSON: { phaseId, summary, changedFiles, testsAddedOrChanged, commandsRun, risks }.',
      ],
    },
    outputSchema: phaseResultSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const phaseVerificationCheckpointTask = defineTask('issue-839.phase-verification-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify phase checkpoint: ${args.phase.title}`,
  labels: ['issue-839', 'verification', args.phase.id],
  agent: {
    name: 'atlas-catalog-phase-verifier',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'release-quality engineer',
      task: 'Run deterministic verification for the completed phase and report pass/fail.',
      instructions: [
        'Run every phase-specific verification command, plus any narrower targeted tests needed to prove the phase contract.',
        'Do not edit implementation code in this task. If a minor test invocation or documentation typo blocks verification, report it instead of patching.',
        'Current phase:',
        JSON.stringify(args.phase, null, 2),
        'Default verification commands:',
        JSON.stringify(args.inputs.verificationCommands ?? [], null, 2),
        'Check for expected failing-test-to-passing-test progression from RED to GREEN.',
        'Return JSON: { passed, commands, failures, summary }.',
      ],
    },
    outputSchema: verificationSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewTask = defineTask('issue-839.adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review score for ${args.phase.title}`,
  labels: ['issue-839', 'adversarial-review', args.phase.id],
  agent: {
    name: 'atlas-catalog-adversarial-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'adversarial senior reviewer for TypeScript monorepo refactors',
      task: 'Score the current phase from 0-100 and identify blocking issues.',
      instructions: [
        `Require score >= ${args.targetQuality} and verification passed before approval.`,
        'Review the actual diff, moved files, package exports, import paths, tests, lockfile/package metadata, and phase-specific acceptance criteria.',
        'Be adversarial: look for hidden old @a5c-ai/agent-catalog runtime imports, stale package references, broken CJS export paths, missing declarations, incomplete lockfile/workspace updates, and tests that pass by mocking the wrong module.',
        'Current phase:',
        JSON.stringify(args.phase, null, 2),
        'Verification output:',
        JSON.stringify(args.verification, null, 2),
        'Return JSON: { approved, score, findings, requiredFixes, summary }.',
      ],
    },
    outputSchema: reviewSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const interphaseCheckpointTask = defineTask('issue-839.interphase-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interphase checkpoint after ${args.phase.title}`,
  labels: ['issue-839', 'checkpoint', args.phase.id],
  agent: {
    name: 'atlas-catalog-interphase-gatekeeper',
    prompt: {
      role: 'technical lead',
      task: 'Decide whether the phase can hand off to the next phase.',
      instructions: [
        'Do not edit files.',
        'Summarize the latest red/green/refactor evidence, verification result, adversarial score, and remaining risks.',
        `The phase passes only when verification passed and adversarial score >= ${args.targetQuality}.`,
        'Phase attempts:',
        JSON.stringify(args.phaseAttempts, null, 2),
        'Return JSON: { passed, summary, handoffNotes, residualRisks, requiredNextPhaseFocus }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary', 'handoffNotes', 'residualRisks', 'requiredNextPhaseFocus'],
      properties: {
        passed: { type: 'boolean' },
        summary: { type: 'string' },
        handoffNotes: { type: 'array', items: { type: 'string' } },
        residualRisks: { type: 'array', items: { type: 'string' } },
        requiredNextPhaseFocus: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-839.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #839',
  labels: ['issue-839', 'final-gate', 'atlas'],
  agent: {
    name: 'atlas-catalog-final-acceptance-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 10,
    prompt: {
      role: 'release owner and adversarial reviewer',
      task: 'Run final issue #839 acceptance verification and decide whether the implementation is ready for PR.',
      instructions: [
        'Do not edit files in this gate.',
        'Run the full verification matrix from inputs, including build:sdk, test:sdk, verify:metadata, git diff --check, and targeted guards for stale @a5c-ai/agent-catalog runtime/package references.',
        'Confirm packages/agent-catalog is removed, packages/atlas/src/catalog contains the moved source, @a5c-ai/atlas/catalog resolves for CJS/types consumers, downstream imports and package manifests no longer depend on @a5c-ai/agent-catalog, workspace/tsconfig/lockfile/CI references are updated, and documentation is not misleading.',
        'Completed phases:',
        JSON.stringify(args.completedPhases, null, 2),
        'Return JSON: { passed, score, changedFiles, verificationCommands, staleReferenceFindings, releaseRisks, prSummary, issueCommentSummary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'changedFiles', 'verificationCommands', 'staleReferenceFindings', 'releaseRisks', 'prSummary', 'issueCommentSummary'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        changedFiles: { type: 'array', items: { type: 'string' } },
        verificationCommands: { type: 'array', items: { type: 'string' } },
        staleReferenceFindings: { type: 'array', items: { type: 'string' } },
        releaseRisks: { type: 'array', items: { type: 'string' } },
        prSummary: { type: 'string' },
        issueCommentSummary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

function defaultPhases() {
  return [
    {
      id: 'phase-1-catalog-source-and-export-contract',
      title: 'Move catalog source into Atlas and expose @a5c-ai/atlas/catalog',
      objective: 'Relocate agent-catalog runtime source and contract tests under packages/atlas/src/catalog while preserving the public API surface.',
      redTests: [
        'A package export contract test imports/requires @a5c-ai/atlas/catalog and fails before the export exists.',
        'Moved catalog contract tests target packages/atlas/src/catalog and fail until source is present and relative imports resolve.',
      ],
      greenWork: [
        'Move discovery.ts, models.ts, sdk.ts, data.ts, atlas-bridge.ts, cli.ts, ui.ts, index.ts, and catalog-related tests into packages/atlas/src/catalog.',
        'Add packages/atlas/src/catalog/index.ts exports and wire packages/atlas/package.json "./catalog" types/default export paths.',
        'Update internal imports so catalog code consumes atlas graph APIs from the local package boundary without circular package dependency on @a5c-ai/agent-catalog.',
      ],
      verification: [
        'Targeted Vitest catalog contract suite passes from the atlas path.',
        'npm run build --workspace=@a5c-ai/atlas succeeds.',
      ],
    },
    {
      id: 'phase-2-consumer-import-migration',
      title: 'Migrate runtime consumers to @a5c-ai/atlas/catalog',
      objective: 'Replace downstream @a5c-ai/agent-catalog imports and package dependencies with @a5c-ai/atlas/catalog or @a5c-ai/atlas.',
      redTests: [
        'Consumer contract tests fail if any runtime package still imports @a5c-ai/agent-catalog.',
        'Vitest alias/config tests fail until aliases point to packages/atlas/src/catalog or atlas dist catalog output.',
      ],
      greenWork: [
        'Update packages/sdk, packages/agent-mux/adapters, hooks-mux adapters, agent-platform/webui test aliases, mocks, and package.json dependencies.',
        'Prefer @a5c-ai/atlas/catalog for catalog-specific APIs and @a5c-ai/atlas only for root graph APIs.',
      ],
      verification: [
        'Updated consumer contract matrix passes.',
        'No non-historical runtime imports of @a5c-ai/agent-catalog remain under packages.',
      ],
    },
    {
      id: 'phase-3-workspace-build-ci-and-lockfile-cleanup',
      title: 'Remove standalone agent-catalog workspace metadata',
      objective: 'Make atlas the only package and update build order, workspace metadata, project references, CI/release docs, and package-lock entries.',
      redTests: [
        'A metadata guard fails while package.json, package-lock.json, tsconfig references, CI docs, or build scripts still treat packages/agent-catalog as a workspace package.',
        'Build-order tests fail until build:sdk and related scripts no longer build @a5c-ai/agent-catalog.',
      ],
      greenWork: [
        'Remove packages/agent-catalog from workspace metadata, root scripts, lockfile workspace package entries, tsconfig references, and release/CI surfaces that publish or validate it independently.',
        'Rename or update test scripts so the catalog contract matrix now validates atlas/catalog.',
        'Regenerate package-lock.json using the repository package manager.',
      ],
      verification: [
        'npm install --package-lock-only or the repo-equivalent lockfile regeneration completes cleanly.',
        'npm run build:sdk, npm run test:sdk, and npm run verify:metadata pass.',
      ],
    },
    {
      id: 'phase-4-final-package-removal-and-documentation',
      title: 'Remove packages/agent-catalog and update docs',
      objective: 'Delete the standalone package after all source, tests, consumers, and metadata have moved, while keeping intentional historical references clear.',
      redTests: [
        'A final guard fails while packages/agent-catalog exists or non-historical docs direct users to import @a5c-ai/agent-catalog.',
        'A documentation/package-map check fails until public package docs describe atlas/catalog as the catalog surface.',
      ],
      greenWork: [
        'Remove packages/agent-catalog after preserving required README/policy information in atlas docs where still relevant.',
        'Update docs/atlas-catalog-unification/README.md, package maps, workspace validation, release pipeline references, and atlas graph package/CI surfaces as needed.',
      ],
      verification: [
        'Full repository guard confirms no active package/runtime references to @a5c-ai/agent-catalog remain.',
        'Final acceptance commands pass and adversarial review score is at least 90.',
      ],
    },
  ];
}
