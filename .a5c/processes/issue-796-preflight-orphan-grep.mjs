/**
 * @process repo/issue-796-preflight-orphan-grep
 * @description TDD, spec-driven implementation process for issue #796: add pre-author orphan-file grep guidance to implementation prompts.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttemptsPerPhase: number, qualityThreshold: number, targetFiles: string[], candidateTestFiles: string[], verificationCommands: string[], collisionPronePaths: string[] }
 * @outputs { success: boolean, phases: array, attemptsByPhase: object, finalReview: object, verification: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/methodologies/atdd-tdd/README.md
 * - library/methodologies/spec-kit/README.md
 * - library/methodologies/metaswarm/skills/adversarial-review/SKILL.md
 * - library/methodologies/cc10x/skills/test-driven-development/SKILL.md
 *
 * @skill atdd-tdd methodologies/atdd-tdd/README.md
 * @skill spec-kit methodologies/spec-kit/README.md
 * @skill adversarial-review methodologies/metaswarm/skills/adversarial-review/SKILL.md
 * @skill test-driven-development methodologies/cc10x/skills/test-driven-development/SKILL.md
 * @agent quality-auditor methodologies/spec-kit/agents/quality-auditor/AGENT.md
 * @agent code-reviewer methodologies/metaswarm/agents/code-reviewer/AGENT.md
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - The requested .a5c/process-library/ directory is not present in this checkout; relevant process-library material is checked in under library/methodologies/ and library/cradle/.
 * - Existing plan-scoped reuse guidance already lives in packages/sdk/src/prompts/templates/process-creation.md and docs/agent-reference/process-authoring.md, but it does not enforce implementation-time exact-path checks.
 * - Existing cradle implementation prompts in library/cradle/feature-implementation-contribute.js and library/cradle/feature-harness-integration-contribute.js tell agents to read or create affected files, but do not require an exact planned-new-path check before authoring.
 * - Existing cc10x GREEN guidance in library/methodologies/cc10x/cc10x-build.js enforces minimal implementation and scope review, but does not surface existing-file collisions before writing.
 * - Existing SDK prompt templates in packages/sdk/src/prompts/templates/process-creation.md, process-guidelines.md, and coding-philosophy.md contain adjacent reuse and "prefer editing existing files" guidance that should be preserved and extended rather than duplicated broadly.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_PHASES = [
  {
    id: 'cradle-feature-implementation',
    title: 'Cradle feature implementation prompt hardening',
    targetFiles: ['library/cradle/feature-implementation-contribute.js'],
    intent: 'Add exact-path pre-author orphan-file detection to applyImplementationTask without changing unrelated contribution workflow behavior.',
  },
  {
    id: 'cradle-harness-integration',
    title: 'Cradle harness integration prompt hardening',
    targetFiles: ['library/cradle/feature-harness-integration-contribute.js'],
    intent: 'Add the same detection behavior before harness integration creates planned new harness files.',
  },
  {
    id: 'cc10x-tdd-green-guidance',
    title: 'CC10X TDD GREEN guidance hardening',
    targetFiles: ['library/methodologies/cc10x/cc10x-build.js'],
    intent: 'Ensure implementation-oriented TDD guidance checks planned new paths before writing implementation code.',
  },
  {
    id: 'sdk-babysit-template-guidance',
    title: 'SDK babysit/process template guidance hardening',
    targetFiles: [
      'packages/sdk/src/prompts/templates/process-creation.md',
      'packages/sdk/src/prompts/templates/process-guidelines.md',
      'packages/sdk/src/prompts/templates/coding-philosophy.md',
    ],
    intent: 'Extend SDK instruction templates so future generated implementation-style processes inherit the pre-author orphan-file check without weakening existing REUSE-AUDIT guidance.',
  },
];

export async function process(inputs, ctx) {
  const qualityThreshold = inputs.qualityThreshold ?? 90;
  const maxAttemptsPerPhase = inputs.maxAttemptsPerPhase ?? 3;
  const phases = inputs.phases ?? DEFAULT_PHASES;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-796.issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: 'issue-796.reuse-audit',
  });

  const codebaseMap = await ctx.task(mapCodebaseTask, { inputs, issueContext, reuseAudit, phases }, {
    key: 'issue-796.codebase-map',
  });

  const frozenSpec = await ctx.task(freezeSpecTask, { inputs, issueContext, reuseAudit, codebaseMap, phases }, {
    key: 'issue-796.freeze-spec',
  });

  const attemptsByPhase = {};
  const completedPhases = [];
  let priorCheckpoint = null;

  for (const phase of phases) {
    const attempts = [];
    let review = null;
    let verification = null;

    for (let attempt = 1; attempt <= maxAttemptsPerPhase; attempt += 1) {
      const red = await ctx.task(writeFailingTestsTask, {
        inputs,
        issueContext,
        reuseAudit,
        codebaseMap,
        frozenSpec,
        phase,
        priorCheckpoint,
        priorReview: review,
        attempt,
      }, {
        key: `issue-796.${phase.id}.red.${attempt}`,
      });

      const green = await ctx.task(implementMinimumTask, {
        inputs,
        issueContext,
        reuseAudit,
        codebaseMap,
        frozenSpec,
        phase,
        red,
        priorCheckpoint,
        priorReview: review,
        attempt,
      }, {
        key: `issue-796.${phase.id}.green.${attempt}`,
      });

      const refactor = await ctx.task(refactorTask, {
        inputs,
        issueContext,
        reuseAudit,
        codebaseMap,
        frozenSpec,
        phase,
        red,
        green,
        priorCheckpoint,
        attempt,
      }, {
        key: `issue-796.${phase.id}.refactor.${attempt}`,
      });

      verification = await ctx.task(phaseVerificationTask, {
        inputs,
        issueContext,
        reuseAudit,
        codebaseMap,
        frozenSpec,
        phase,
        red,
        green,
        refactor,
        completedPhases,
        attempt,
      }, {
        key: `issue-796.${phase.id}.verification.${attempt}`,
      });

      review = await ctx.task(adversarialReviewTask, {
        inputs,
        issueContext,
        reuseAudit,
        codebaseMap,
        frozenSpec,
        phase,
        red,
        green,
        refactor,
        verification,
        qualityThreshold,
        attempt,
      }, {
        key: `issue-796.${phase.id}.adversarial-review.${attempt}`,
      });

      attempts.push({ attempt, red, green, refactor, verification, review });

      if (verification?.passed === true && Number(review?.qualityScore) >= qualityThreshold) {
        break;
      }
    }

    attemptsByPhase[phase.id] = attempts;

    const lastAttempt = attempts[attempts.length - 1];
    if (lastAttempt?.verification?.passed !== true || Number(lastAttempt?.review?.qualityScore) < qualityThreshold) {
      await ctx.breakpoint({
        title: `Issue #796 phase did not reach score ${qualityThreshold}`,
        question: `Phase "${phase.title}" did not pass verification and adversarial score threshold within ${maxAttemptsPerPhase} attempts. Choose whether to continue, adjust scope, or pause.`,
        options: ['Continue with current scope', 'Pause for maintainer guidance'],
        expert: 'maintainer',
        tags: ['issue-796', 'quality-gate', phase.id],
        context: {
          phase,
          attempts,
          threshold: qualityThreshold,
        },
      });
    }

    priorCheckpoint = await ctx.task(interphaseCheckpointTask, {
      inputs,
      issueContext,
      reuseAudit,
      codebaseMap,
      frozenSpec,
      phase,
      attempts,
      completedPhases,
    }, {
      key: `issue-796.${phase.id}.checkpoint`,
    });

    completedPhases.push({ phase, checkpoint: priorCheckpoint });
  }

  const finalVerification = await ctx.task(finalVerificationTask, {
    inputs,
    issueContext,
    reuseAudit,
    codebaseMap,
    frozenSpec,
    phases,
    attemptsByPhase,
    completedPhases,
  }, {
    key: 'issue-796.final-verification',
  });

  const finalReview = await ctx.task(finalAdversarialReviewTask, {
    inputs,
    issueContext,
    reuseAudit,
    codebaseMap,
    frozenSpec,
    phases,
    attemptsByPhase,
    completedPhases,
    finalVerification,
    qualityThreshold,
  }, {
    key: 'issue-796.final-adversarial-review',
  });

  const delivery = finalVerification?.passed === true && Number(finalReview?.qualityScore) >= qualityThreshold
    ? await ctx.task(deliveryTask, {
      inputs,
      issueContext,
      reuseAudit,
      codebaseMap,
      frozenSpec,
      phases,
      attemptsByPhase,
      finalVerification,
      finalReview,
    }, {
      key: 'issue-796.delivery',
    })
    : null;

  return {
    success: finalVerification?.passed === true && Number(finalReview?.qualityScore) >= qualityThreshold,
    phases,
    attemptsByPhase,
    completedPhases,
    reuseAudit,
    codebaseMap,
    frozenSpec,
    verification: finalVerification,
    finalReview,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-796.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #796 and extract the authoritative spec',
  labels: ['issue-796', 'context', 'spec'],
  agent: {
    name: 'issue-context-reader',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Read the GitHub issue and comments, then extract the implementation contract. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments; if GitHub reports there is no PR with that number, record that and continue.`,
        'Treat issue body, comments, and labels as authoritative.',
        'Extract the exact requested behavior: before an implementation agent writes a planned new file under collision-prone paths, it must check whether the exact path exists, read existing content if present, report findings, and stop for orchestrator scope direction.',
        'Preserve out-of-scope guidance: no automatic recovery decision when a collision is found.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, collisionPronePaths, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-796.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for orphan-file prompt guidance',
  labels: ['issue-796', 'reuse-audit'],
  agent: {
    name: 'orphan-grep-reuse-auditor',
    prompt: {
      role: 'senior process-library maintainer',
      task: 'Find existing guidance, templates, tests, and process-library patterns to reuse before implementation. Do not edit files.',
      instructions: [
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Search for these terms: orphan, pre-author, planned new file, exact path, REUSE-AUDIT, reuse audit, collision, migrations, scripts, src/server, src/lib, write files, create necessary files.',
        'Inspect the active process-library location. If .a5c/process-library/ is absent, record that and inspect library/methodologies/ and library/cradle/ instead.',
        'Inspect SDK prompt templates in packages/sdk/src/prompts/templates/ for adjacent guidance that should be extended rather than duplicated.',
        'Identify existing test files or snapshot tests that can validate prompt text changes.',
        'Return JSON: { findingsMarkdown, existingGuidance, targetPromptSurfaces, candidateTests, noNewInfrastructureNeeded, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const mapCodebaseTask = defineTask('issue-796.map-codebase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map prompt surfaces and test harnesses',
  labels: ['issue-796', 'codebase-map'],
  agent: {
    name: 'prompt-surface-mapper',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Trace the prompt-generation surfaces that issue #796 affects. Do not edit files.',
      instructions: [
        'Use the issue context and reuse audit as constraints.',
        'Inspect each target file and identify the exported task or template section that emits implementation-agent instructions.',
        'Find the closest existing tests for library/cradle prompt task definitions, cc10x methodology prompts, and SDK prompt template rendering.',
        'Record where deterministic verification should run in the implementation process, but do not create kind: shell subtasks in this repo process.',
        'Return JSON: { runtimeCallPaths, promptSurfaces, targetFiles, candidateTestFiles, verificationCommands, risks, recommendedPhaseOrder }.',
      ],
      context: {
        targetFiles: args.inputs.targetFiles,
        candidateTestFiles: args.inputs.candidateTestFiles,
        phases: args.phases,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const freezeSpecTask = defineTask('issue-796.freeze-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Freeze spec and acceptance tests plan',
  labels: ['issue-796', 'spec-driven', 'atdd'],
  agent: {
    name: 'spec-freezer',
    prompt: {
      role: 'spec-driven development lead',
      task: 'Turn issue #796 into a frozen, testable specification before implementation starts. Do not edit files.',
      instructions: [
        'Produce Given/When/Then acceptance criteria for the required prompt behavior.',
        'Define negative cases: normal edits should not require the orphan check; collisions are reported for orchestrator decision; agents must not auto-resolve use-existing/replace/append/renumber decisions.',
        'Define exact text obligations flexibly enough to avoid brittle wording tests while still catching missing behavior.',
        'Map each acceptance criterion to one or more candidate tests.',
        'Return JSON: { acceptanceCriteria, testMatrix, phaseContracts, nonGoals, scoreRubric }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        codebaseMap: args.codebaseMap,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const writeFailingTestsTask = defineTask('issue-796.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RED: write failing tests for the phase',
  labels: ['issue-796', 'tdd', 'red'],
  agent: {
    name: 'tdd-red-test-author',
    prompt: {
      role: 'test-driven development engineer',
      task: 'Write the smallest failing tests that prove this phase behavior is absent. Edit only test files.',
      instructions: [
        'Follow strict RED discipline: tests first, implementation untouched.',
        'Add or update the narrowest existing test surface identified by the codebase map.',
        'Tests must fail for the intended reason before implementation. Run the relevant test command in run mode, never watch mode.',
        'Record command, exit code, and the failing assertion evidence.',
        'Do not edit source prompt/template files in RED.',
        'If the intended behavior already passes, stop and report the existing implementation evidence instead of manufacturing a failure.',
        'Return JSON: { passedRed: boolean, testsChanged: array, command: string, exitCode: number, failingEvidence: string, alreadyImplemented: boolean, risks: array }.',
      ],
      context: {
        phase: args.phase,
        frozenSpec: args.frozenSpec,
        candidateTestFiles: args.inputs.candidateTestFiles,
        priorReview: args.priorReview,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMinimumTask = defineTask('issue-796.implement-minimum', (args, taskCtx) => ({
  kind: 'agent',
  title: 'GREEN: implement the minimum prompt change',
  labels: ['issue-796', 'tdd', 'green'],
  agent: {
    name: 'minimum-implementation-engineer',
    prompt: {
      role: 'senior Babysitter prompt-template engineer',
      task: 'Implement only the minimum code or template change needed to pass the RED tests for this phase.',
      instructions: [
        'Before editing, inspect the exact target files for this phase and preserve surrounding style.',
        'Add focused pre-author orphan-file guidance only where this phase requires it.',
        'Required behavior: for planned new files under common collision-prone paths, the implementation agent checks exact path existence using ls or rg/grep before writing; if present, it reads the file, reports findings to the orchestrator, and waits for scope direction such as use-existing, replace, append, or renumber.',
        'Do not introduce automatic recovery behavior.',
        'Do not broaden the check to every normal edit unless the frozen spec requires it.',
        'Run the RED test command in run mode and record exit code 0 for GREEN.',
        'If more than three implementation files are needed for this phase, stop and report scope review required.',
        'Return JSON: { passedGreen: boolean, filesChanged: array, command: string, exitCode: number, summary: string, scopeReviewRequired: boolean, risks: array }.',
      ],
      context: {
        phase: args.phase,
        red: args.red,
        frozenSpec: args.frozenSpec,
        targetFiles: args.phase.targetFiles,
        collisionPronePaths: args.inputs.collisionPronePaths,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refactorTask = defineTask('issue-796.refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'REFACTOR: simplify while preserving green tests',
  labels: ['issue-796', 'tdd', 'refactor'],
  agent: {
    name: 'prompt-refactorer',
    prompt: {
      role: 'senior maintainability reviewer',
      task: 'Refactor only if needed for clarity, consistency, or reduced duplication while keeping tests green.',
      instructions: [
        'Prefer no-op refactor when the GREEN change is already clear and localized.',
        'Do not change behavior beyond the frozen spec.',
        'Preserve existing wording style in prompt arrays and markdown templates.',
        'Run the same focused tests after refactor in run mode and record exit code.',
        'Return JSON: { refactored: boolean, filesChanged: array, command: string, exitCode: number, summary: string, risks: array }.',
      ],
      context: {
        phase: args.phase,
        red: args.red,
        green: args.green,
        frozenSpec: args.frozenSpec,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const phaseVerificationTask = defineTask('issue-796.phase-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verification checkpoint for the phase',
  labels: ['issue-796', 'verification'],
  agent: {
    name: 'phase-verifier',
    prompt: {
      role: 'verification engineer',
      task: 'Verify the phase against tests, spec, and cross-phase regression risk. Do not make source changes.',
      instructions: [
        'Run the focused phase tests and any verification commands that are relevant and affordable for the changed surface.',
        'Use run mode only; record commands and exit codes.',
        'Check that no implementation source outside the phase target and candidate test files changed unexpectedly.',
        'Confirm the current phase still preserves previously completed phase contracts.',
        'Return JSON: { passed: boolean, commands: array, exitCodes: array, changedFiles: array, specCoverage: array, regressions: array, blockers: array }.',
      ],
      context: {
        phase: args.phase,
        completedPhases: args.completedPhases,
        verificationCommands: args.inputs.verificationCommands,
        frozenSpec: args.frozenSpec,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewTask = defineTask('issue-796.adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fresh adversarial review with quality score',
  labels: ['issue-796', 'adversarial-review', 'quality-gate'],
  agent: {
    name: `fresh-adversarial-reviewer-${args.phase.id}-${args.attempt}`,
    prompt: {
      role: 'fresh adversarial code reviewer',
      task: 'Independently review this phase for spec compliance and regressions. Do not edit files.',
      instructions: [
        'Start from the frozen spec and current diff, not from prior reviewer conclusions.',
        'Issue a binary verdict and a numeric qualityScore from 0 to 100.',
        `A passing phase requires qualityScore >= ${args.qualityThreshold}, no blocking findings, and verification.passed === true.`,
        'Score rubric: 100 means complete, narrow, tested, and style-consistent; 90-99 means only non-blocking polish remains; 70-89 means useful but missing coverage or has moderate risk; below 70 means incomplete or unsafe.',
        'Cite evidence with file paths and line numbers for every blocking finding.',
        'Check specifically for over-broad prompt friction, auto-recovery decisions, brittle wording tests, and loss of existing REUSE-AUDIT guidance.',
        'Return JSON: { verdict: "PASS"|"FAIL", qualityScore: number, blockingFindings: array, nonBlockingFindings: array, evidence: array, requiredNextIteration: array }.',
      ],
      context: {
        phase: args.phase,
        frozenSpec: args.frozenSpec,
        verification: args.verification,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const interphaseCheckpointTask = defineTask('issue-796.interphase-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Checkpoint before next phase',
  labels: ['issue-796', 'checkpoint'],
  agent: {
    name: 'interphase-checkpoint-verifier',
    prompt: {
      role: 'release readiness verifier',
      task: 'Summarize the completed phase and decide whether the next phase can start. Do not edit files.',
      instructions: [
        'Confirm the latest attempt passed verification and reached the quality threshold, or document the maintainer decision that allowed continuation.',
        'List contracts that future phases must preserve.',
        'Recommend the next phase focus and any tests that should be rerun after it.',
        'Return JSON: { readyForNextPhase: boolean, preservedContracts: array, commandsToRepeatLater: array, changedFiles: array, summary: string, risks: array }.',
      ],
      context: {
        phase: args.phase,
        attempts: args.attempts,
        completedPhases: args.completedPhases,
        frozenSpec: args.frozenSpec,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalVerificationTask = defineTask('issue-796.final-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final verification across all prompt surfaces',
  labels: ['issue-796', 'final-verification'],
  agent: {
    name: 'final-verifier',
    prompt: {
      role: 'senior release verification engineer',
      task: 'Run final verification for the whole issue. Do not edit files.',
      instructions: [
        'Run all relevant focused tests plus the requested verification commands that apply to SDK/process metadata.',
        'Verify the final diff changes only prompt/template/test surfaces needed for issue #796.',
        'Confirm every frozen acceptance criterion is covered by a failing-first test and now passes.',
        'Confirm existing plan-scoped REUSE-AUDIT guidance remains intact.',
        'Confirm no implementation code was added outside the issue scope.',
        'Return JSON: { passed: boolean, commands: array, exitCodes: array, acceptanceCoverage: array, changedFiles: array, blockers: array, residualRisks: array }.',
      ],
      context: {
        phases: args.phases,
        attemptsByPhase: args.attemptsByPhase,
        verificationCommands: args.inputs.verificationCommands,
        frozenSpec: args.frozenSpec,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAdversarialReviewTask = defineTask('issue-796.final-adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final fresh adversarial review',
  labels: ['issue-796', 'final-review', 'adversarial-review'],
  agent: {
    name: 'fresh-final-adversarial-reviewer',
    prompt: {
      role: 'fresh adversarial release reviewer',
      task: 'Independently review the complete implementation for issue #796. Do not edit files.',
      instructions: [
        'Use a fresh read of the issue context, frozen spec, and current diff.',
        'Return a binary verdict plus qualityScore from 0 to 100.',
        `Final PASS requires qualityScore >= ${args.qualityThreshold}, no blocking findings, and finalVerification.passed === true.`,
        'Check all affected surfaces: cradle implementation prompts, harness integration prompts, cc10x GREEN guidance, SDK templates, tests, and metadata validation.',
        'Look for prompt drift, duplicated or contradictory instructions, excessive friction, missing exact-path behavior, and accidental automatic collision resolution.',
        'Return JSON: { verdict: "PASS"|"FAIL", qualityScore: number, blockingFindings: array, nonBlockingFindings: array, evidence: array, releaseReadiness: string }.',
      ],
      context: {
        frozenSpec: args.frozenSpec,
        finalVerification: args.finalVerification,
        phases: args.phases,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-796.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare delivery summary',
  labels: ['issue-796', 'delivery'],
  agent: {
    name: 'delivery-coordinator',
    prompt: {
      role: 'delivery coordinator',
      task: 'Prepare the final handoff after all gates pass. Do not edit source files except for normal git metadata if requested by the operator.',
      instructions: [
        'Summarize changed files, tests added, verification commands, and final quality score.',
        'Draft PR body bullets linking to issue #796 and describing the TDD evidence.',
        'Do not claim unrun checks passed.',
        'Return JSON: { readyToOpenPr: boolean, changedFiles: array, verificationSummary: string, reviewSummary: string, prBody: string }.',
      ],
      context: {
        finalVerification: args.finalVerification,
        finalReview: args.finalReview,
        attemptsByPhase: args.attemptsByPhase,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
