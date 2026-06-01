/**
 * @process repo/issue-836-agent-core-tula-core-tdd-plan
 * @description TDD, spec-driven implementation process for issue #836: rename @a5c-ai/agent-core to @a5c-ai/tula-core.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetScore: number, maxIterationsPerPhase: number, verificationCommands: string[] }
 * @outputs { success: boolean, phases: array, convergence: array, verification: object, finalReview: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - **Package**: `packages/agent-core/package.json` declares `@a5c-ai/agent-core`, `packages/agent-core` repository metadata, and the build script path assumptions. Rename this workspace instead of creating a new package.
 * - **Workspace links**: `package-lock.json` contains `node_modules/@a5c-ai/agent-core`, `packages/agent-core`, and downstream workspace references from `agent-platform`, `tula`, and other packages. Regenerate the lockfile after the rename rather than editing generated lock entries by hand.
 * - **Dependent imports**: `packages/agent-platform/src/**` and `packages/tula/src/**` import `@a5c-ai/agent-core`; update imports and preserve harness terminology where `agent-core` means the built-in harness rather than the npm package name.
 * - **Project references**: `packages/agent-platform/tsconfig.json` and `packages/tula/tsconfig.json` reference `../agent-core`; update to `../tula-core`.
 * - **CI/release references**: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/publish-packages-from-tag.yml`, and `.github/workflows/live-stack.yml` build/test/publish `@a5c-ai/agent-core` or `packages/agent-core`; update only the issue #836 package/workspace references.
 * - **Docs/spec source**: `docs/tula-stack-renames/README.md` defines the broader stack rename convention, but issue #836 scopes this run to `agent-core -> tula-core`; do not rename `agent-runtime` or `agent-platform` in this process.
 *
 * Process-library references used:
 * - `babysitter/tdd-quality-convergence`
 * - `methodologies/atdd-tdd/atdd-tdd.js`
 * - `methodologies/spec-kit/spec-kit-implementation.js`
 * - `specializations/code-migration-modernization/code-refactoring.js`
 * - `methodologies/superpowers/test-driven-development.js`
 * - `methodologies/superpowers/verification-before-completion.js`
 * - `specializations/collaboration/github/pr-policies.js`
 *
 * @process methodologies/atdd-tdd
 * @process methodologies/spec-kit/spec-kit-implementation
 * @process specializations/code-migration-modernization/code-refactoring
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/pr-policies
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent migration-reviewer specializations/code-migration-modernization/agents/migration-testing-strategist/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_SCORE = 90;
const DEFAULT_MAX_ITERATIONS = 4;

function compact(result) {
  return result?.value ?? result ?? null;
}

async function runConvergentTddPhase(ctx, phase, args) {
  const attempts = [];
  let qualityScore = 0;
  let red = null;
  let green = null;
  let refactor = null;
  let verification = null;
  let review = null;

  for (let iteration = 1; iteration <= args.maxIterationsPerPhase; iteration++) {
    red = await ctx.task(writeFailingTestsTask, {
      ...args,
      phase,
      iteration,
      previousReview: compact(review),
    }, {
      key: `issue-836.${phase.id}.red.${iteration}`,
    });

    green = await ctx.task(implementMinimumTask, {
      ...args,
      phase,
      iteration,
      red: compact(red),
      previousReview: compact(review),
    }, {
      key: `issue-836.${phase.id}.green.${iteration}`,
    });

    refactor = await ctx.task(refactorPhaseTask, {
      ...args,
      phase,
      iteration,
      red: compact(red),
      green: compact(green),
      previousReview: compact(review),
    }, {
      key: `issue-836.${phase.id}.refactor.${iteration}`,
    });

    verification = await ctx.task(phaseVerificationTask, {
      ...args,
      phase,
      iteration,
      red: compact(red),
      green: compact(green),
      refactor: compact(refactor),
    }, {
      key: `issue-836.${phase.id}.verification.${iteration}`,
    });

    review = await ctx.task(adversarialReviewTask, {
      ...args,
      phase,
      iteration,
      red: compact(red),
      green: compact(green),
      refactor: compact(refactor),
      verification: compact(verification),
    }, {
      key: `issue-836.${phase.id}.review.${iteration}`,
    });

    qualityScore = Number(compact(review)?.qualityScore ?? 0);
    attempts.push({ iteration, red, green, refactor, verification, review, qualityScore });

    if (qualityScore >= args.targetScore && compact(verification)?.passed === true) {
      break;
    }
  }

  if (qualityScore < args.targetScore || compact(verification)?.passed !== true) {
    await ctx.breakpoint({
      title: `Issue #836 ${phase.name} did not converge`,
      question: `Phase "${phase.name}" stopped below the required quality score ${args.targetScore}. Review the attempts and decide whether to continue, revise scope, or pause.`,
      options: [
        'Continue with another convergence iteration',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-836', 'quality-gate', phase.id],
      context: {
        runId: ctx.runId,
        phase,
        qualityScore,
        attempts: attempts.length,
        lastVerification: compact(verification),
        lastReview: compact(review),
      },
    });
  }

  return {
    phase,
    attempts,
    finalQualityScore: qualityScore,
    passed: qualityScore >= args.targetScore && compact(verification)?.passed === true,
    red,
    green,
    refactor,
    verification,
    review,
  };
}

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 836;
  const targetScore = inputs.targetScore ?? DEFAULT_TARGET_SCORE;
  const maxIterationsPerPhase = inputs.maxIterationsPerPhase ?? DEFAULT_MAX_ITERATIONS;

  const spec = await ctx.task(readAuthoritativeSpecTask, {
    issueNumber,
    referencedDocs: inputs.referencedDocs ?? ['docs/tula-stack-renames/README.md'],
  }, {
    key: 'issue-836.read-authoritative-spec',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    ...inputs,
    issueNumber,
    spec: compact(spec),
  }, {
    key: 'issue-836.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(processLibraryResearchTask, {
    ...inputs,
    issueNumber,
    spec: compact(spec),
  }, {
    key: 'issue-836.process-library-research',
  });

  const architectureTrace = await ctx.task(traceRenameSurfaceTask, {
    ...inputs,
    issueNumber,
    spec: compact(spec),
    reuseAudit: compact(reuseAudit),
  }, {
    key: 'issue-836.trace-rename-surface',
  });

  const args = {
    ...inputs,
    issueNumber,
    targetScore,
    maxIterationsPerPhase,
    spec: compact(spec),
    reuseAudit: compact(reuseAudit),
    processLibraryResearch: compact(processLibraryResearch),
    architectureTrace: compact(architectureTrace),
  };

  const phases = [
    {
      id: 'workspace-identity',
      name: 'Workspace identity and package directory rename',
      objective: 'Move packages/agent-core to packages/tula-core, rename the package to @a5c-ai/tula-core, and preserve package metadata/build entrypoints.',
      redFocus: 'Tests and guardrails should fail while packages/agent-core and @a5c-ai/agent-core remain canonical.',
      verificationFocus: 'package metadata, workspace discovery, package exports, TypeScript project reference compatibility.',
    },
    {
      id: 'dependents-and-imports',
      name: 'Dependent packages, imports, and TypeScript references',
      objective: 'Update internal imports, workspace dependencies, and tsconfig references from @a5c-ai/agent-core/packages/agent-core to @a5c-ai/tula-core/packages/tula-core.',
      redFocus: 'Tests should fail for stale imports and project references in agent-platform, tula, and direct dependents.',
      verificationFocus: 'targeted builds/tests for tula-core, agent-platform, and tula plus stale import scanners.',
    },
    {
      id: 'ci-docs-lockfile',
      name: 'CI, release, documentation, atlas graph, and lockfile consistency',
      objective: 'Update generated lockfile, CI/release workflows, docs, and atlas graph references for the package rename without changing unrelated stack package names.',
      redFocus: 'Guardrails should fail on stale package/workspace references in workflows, package-lock, docs, and graph metadata.',
      verificationFocus: 'lockfile regeneration, workflow reference checks, docs reference checks, and broad repo validation commands.',
    },
  ];

  const convergence = [];
  for (const phase of phases) {
    convergence.push(await runConvergentTddPhase(ctx, phase, args));

    const checkpoint = await ctx.task(interPhaseCheckpointTask, {
      ...args,
      completedPhase: phase,
      convergence,
    }, {
      key: `issue-836.${phase.id}.inter-phase-checkpoint`,
    });

    if (compact(checkpoint)?.passed !== true) {
      await ctx.breakpoint({
        title: `Issue #836 checkpoint after ${phase.name}`,
        question: compact(checkpoint)?.question ?? `Checkpoint after "${phase.name}" found unresolved risk. Decide before continuing.`,
        options: [
          'Continue after applying checkpoint recommendations',
          'Pause for maintainer guidance',
        ],
        expert: 'maintainer',
        tags: ['issue-836', 'checkpoint', phase.id],
        context: {
          runId: ctx.runId,
          checkpoint: compact(checkpoint),
          phase,
        },
      });
    }
  }

  const finalVerification = await ctx.task(finalVerificationTask, {
    ...args,
    convergence,
  }, {
    key: 'issue-836.final-verification',
  });

  const finalReview = await ctx.task(finalAdversarialAcceptanceTask, {
    ...args,
    convergence,
    finalVerification: compact(finalVerification),
  }, {
    key: 'issue-836.final-adversarial-acceptance',
  });

  if (compact(finalReview)?.approved !== true || Number(compact(finalReview)?.qualityScore ?? 0) < targetScore) {
    await ctx.breakpoint({
      title: 'Issue #836 final acceptance did not pass',
      question: compact(finalReview)?.question ?? 'Final adversarial acceptance found blockers or a score below target.',
      options: [
        'Continue convergence from final review findings',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-836', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalVerification: compact(finalVerification),
        finalReview: compact(finalReview),
      },
    });
  }

  return {
    success: compact(finalReview)?.approved === true && Number(compact(finalReview)?.qualityScore ?? 0) >= targetScore,
    issueNumber,
    targetScore,
    phases,
    convergence,
    verification: finalVerification,
    finalReview,
  };
}

export const readAuthoritativeSpecTask = defineTask('issue-836.read-authoritative-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #836 and referenced rename spec',
  labels: ['issue-836', 'spec', 'research'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior monorepo maintainer',
      task: 'Read the authoritative issue and referenced documentation before any implementation planning.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        `Read referenced docs: ${(args.referencedDocs ?? []).join(', ')}`,
        'Treat issue #836 as the execution scope: rename @a5c-ai/agent-core to @a5c-ai/tula-core, move packages/agent-core to packages/tula-core, update references, tsconfig, CI, docs, and regenerate the lockfile.',
        'Treat docs/tula-stack-renames/README.md as contextual convention. Do not rename agent-runtime or agent-platform unless issue #836 explicitly requires it.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, referencedDocsSummary, acceptanceCriteria, nonGoals, ambiguity, riskAreas }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'issueSummary', 'acceptanceCriteria', 'nonGoals', 'riskAreas'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-836.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for agent-core rename',
  labels: ['issue-836', 'reuse-audit', 'planning'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior TypeScript monorepo architect',
      task: 'Run the repo-required reuse audit before planning the package rename implementation.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keywords from the request: agent-core, tula-core, @a5c-ai/agent-core, @a5c-ai/tula-core, packages/agent-core, packages/tula-core, workspace, package-lock, tsconfig, CI, docs, atlas graph.',
        'If .a5c/reuse-audit.json exists, honor its scan globs and keyword rules.',
        'Scan package.json, package-lock.json, packages/**/package.json, packages/**/tsconfig.json, packages/agent-core, packages/agent-platform, packages/tula, packages/atlas/graph, docs, and .github/workflows.',
        'Separate references that are package/workspace identity from references where "agent-core" is a runtime harness name or historical prose that may intentionally remain.',
        'Do not edit files.',
        'Return JSON: { keywords, existingSurfaces, reusableTests, generatedFiles, staleReferenceClasses, intentionalTerminology, recommendedPhaseBoundaries, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['keywords', 'existingSurfaces', 'staleReferenceClasses', 'intentionalTerminology', 'recommendedPhaseBoundaries', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const processLibraryResearchTask = defineTask('issue-836.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodologies',
  labels: ['issue-836', 'process-library', 'planning'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'Babysitter process author',
      task: 'Research the active process library for methodologies and specializations that should inform execution.',
      instructions: [
        'Use the active process library at /home/runner/.a5c/process-library/babysitter-repo/library.',
        'Inspect, at minimum, tdd-quality-convergence, methodologies/atdd-tdd, methodologies/spec-kit, specializations/code-migration-modernization, methodologies/superpowers/test-driven-development, and methodologies/superpowers/verification-before-completion.',
        'Note applicable collaboration policies for GitHub PR and issue linking.',
        'Return JSON: { referencesInspected, applicablePatterns, conflictsOrOverrides, selectedProcessShape, qualityGateDesign }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['referencesInspected', 'applicablePatterns', 'selectedProcessShape', 'qualityGateDesign'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRenameSurfaceTask = defineTask('issue-836.trace-rename-surface', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace package rename surface and live contracts',
  labels: ['issue-836', 'architecture', 'trace'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior TypeScript monorepo maintainer',
      task: 'Trace all live surfaces affected by renaming agent-core to tula-core before tests or implementation.',
      instructions: [
        'Use issue context and reuse audit JSON as input.',
        'Trace workspace identity: package.json workspaces, root scripts, package-lock links, packages/agent-core/package.json, repository metadata, exports, README references.',
        'Trace dependent packages: package dependencies, imports/re-exports, tsconfig references, test mocks, direct harness invocation boundaries.',
        'Trace CI/release/docs/atlas graph references and identify which references must change versus which "agent-core" harness terminology should stay.',
        'Identify exact test files or new guardrail tests needed before implementation.',
        'Return JSON: { runtimeCallPaths, packageIdentitySurfaces, dependentSurfaces, ciReleaseSurfaces, docsAndGraphSurfaces, intentionalRemainingAgentCoreTerms, targetFiles, testPlan, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'packageIdentitySurfaces', 'dependentSurfaces', 'ciReleaseSurfaces', 'targetFiles', 'testPlan', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const writeFailingTestsTask = defineTask('issue-836.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `RED: write failing tests for ${args.phase.name}`,
  labels: ['issue-836', 'tdd', 'red', 'tests'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior monorepo test engineer enforcing strict TDD',
      task: 'Write or update failing tests and guardrails for this phase before implementation.',
      instructions: [
        'Do not implement production/source changes in the red step.',
        'Use the authoritative spec, reuse audit, and architecture trace from the task inputs.',
        `Phase objective: ${args.phase.objective}`,
        `Red focus: ${args.phase.redFocus}`,
        'Add the smallest deterministic tests or scan guardrails that prove the current repo still violates this phase objective.',
        'Run only the targeted new/changed tests or guardrail command needed to prove the red failure.',
        'The new test must fail for the intended stale rename reason. If it passes immediately, revise the test before moving on.',
        'Return JSON: { changedFiles, testsAdded, guardrailsAdded, redCommand, redFailedForExpectedReason, failureEvidence, criteriaCovered, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'redCommand', 'redFailedForExpectedReason', 'failureEvidence', 'criteriaCovered'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMinimumTask = defineTask('issue-836.implement-minimum', (args, taskCtx) => ({
  kind: 'agent',
  title: `GREEN: minimum implementation for ${args.phase.name}`,
  labels: ['issue-836', 'tdd', 'green', 'implementation'],
  agent: {
    name: 'migration-reviewer',
    prompt: {
      role: 'senior TypeScript migration engineer',
      task: 'Implement the minimum code and metadata changes required to pass this phase red tests.',
      instructions: [
        'Use git mv for package directory moves when this phase requires a directory rename.',
        'Do not broaden scope beyond issue #836. Do not rename agent-runtime or agent-platform.',
        'Preserve intentional "agent-core" harness terminology unless the architecture trace marks it as package identity.',
        `Phase objective: ${args.phase.objective}`,
        'Run the red command again and targeted build/test commands needed for this phase.',
        'Return JSON: { changedFiles, implementationSummary, commandsRun, testsNowPassing, staleReferencesAddressed, intentionalReferencesPreserved, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'implementationSummary', 'commandsRun', 'testsNowPassing', 'staleReferencesAddressed'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refactorPhaseTask = defineTask('issue-836.refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: `REFACTOR: clean up ${args.phase.name}`,
  labels: ['issue-836', 'tdd', 'refactor'],
  agent: {
    name: 'migration-reviewer',
    prompt: {
      role: 'senior monorepo refactoring engineer',
      task: 'Refactor the phase changes while preserving passing tests and strict issue scope.',
      instructions: [
        'Keep changes mechanical and scoped to the rename surface identified in the architecture trace.',
        'Remove obsolete compatibility shims or duplicate references created during the green step unless they are required public compatibility.',
        'Normalize docs/workflow wording only where it reflects package identity. Preserve runtime harness terminology.',
        'Run the phase targeted tests after refactoring.',
        'Return JSON: { changedFiles, refactorSummary, commandsRun, testsStillPassing, scopeDisciplineNotes, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'refactorSummary', 'commandsRun', 'testsStillPassing', 'scopeDisciplineNotes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const phaseVerificationTask = defineTask('issue-836.phase-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verification checkpoint for ${args.phase.name}`,
  labels: ['issue-836', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior release verification engineer',
      task: 'Run deterministic verification for this phase and report exact evidence.',
      instructions: [
        `Verification focus: ${args.phase.verificationFocus}`,
        'Run the red command, targeted package tests, targeted builds, and any scanner needed to prove stale package identity references are handled for this phase.',
        'Run git diff --check.',
        'For issue #836, include explicit checks that @a5c-ai/agent-runtime, @a5c-ai/agent-platform, packages/agent-runtime, and packages/agent-platform were not renamed.',
        'If a command fails, capture exact command, exit code, failure lines, and whether failure is caused by this phase.',
        'Return JSON: { passed, commands, failures, staleReferenceEvidence, nonGoalProtectionEvidence, lockfileEvidence, retryRecommendations }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'staleReferenceEvidence', 'nonGoalProtectionEvidence'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewTask = defineTask('issue-836.adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review score for ${args.phase.name}`,
  labels: ['issue-836', 'review', 'quality-score'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'adversarial senior reviewer',
      task: 'Score the phase implementation from 0-100 against the spec, tests, scope, and verification evidence.',
      instructions: [
        'Review the current diff, phase artifacts, red/green/refactor outputs, and verification evidence.',
        'Score harshly. Start at 100 and subtract for stale references, missed tests, unverified lockfile/workflow changes, broadened scope, accidental runtime/platform rename, generated-file drift, or documentation inconsistency.',
        'A score below 90 must include concrete required fixes for the next iteration.',
        'Approve only if the phase verification passed and qualityScore >= targetScore.',
        'Return JSON: { approved, qualityScore, scoreBreakdown, blockingFindings, requiredFixes, missingTests, staleReferenceRisks, scopeRisks, nextIterationInstructions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'qualityScore', 'scoreBreakdown', 'blockingFindings', 'requiredFixes', 'missingTests'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const interPhaseCheckpointTask = defineTask('issue-836.inter-phase-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inter-phase checkpoint after ${args.completedPhase.name}`,
  labels: ['issue-836', 'checkpoint', 'verification'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior maintainer checking phase handoff safety',
      task: 'Verify the completed phase is stable enough before the next phase begins.',
      instructions: [
        'Check that the completed phase converged to score >= targetScore and its verification passed.',
        'Check there are no uncommitted generated artifacts that should have been regenerated or intentionally ignored.',
        'Check no later phase was accidentally implemented in a way that changes scope or hides missing red tests.',
        'Return JSON: { passed, checkpointSummary, unresolvedRisks, requiredBeforeNextPhase, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'checkpointSummary', 'unresolvedRisks', 'requiredBeforeNextPhase'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalVerificationTask = defineTask('issue-836.final-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final full verification for issue #836',
  labels: ['issue-836', 'final-verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior release verification engineer',
      task: 'Run final verification for the complete agent-core to tula-core rename.',
      instructions: [
        'Run all commands from inputs.verificationCommands in order.',
        'At minimum run: npm run build --workspace=@a5c-ai/tula-core, npm run test --workspace=@a5c-ai/tula-core, npm run build --workspace=@a5c-ai/agent-platform, npm run build --workspace=@a5c-ai/tula, npm run verify:metadata, and git diff --check when available.',
        'Run stale-reference scans for @a5c-ai/agent-core and packages/agent-core. Classify each remaining hit as intentional harness/prose terminology or a blocking stale package identity reference.',
        'Run non-goal scans proving @a5c-ai/agent-runtime and @a5c-ai/agent-platform package identities and directories remain unchanged.',
        'Confirm package-lock.json was regenerated from npm rather than hand-mutated when package/workspace metadata changed.',
        'Return JSON: { passed, commands, failures, staleReferenceReport, nonGoalProtectionReport, lockfileReport, changedFiles, residualRisks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'staleReferenceReport', 'nonGoalProtectionReport', 'changedFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAdversarialAcceptanceTask = defineTask('issue-836.final-adversarial-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final adversarial acceptance score for issue #836',
  labels: ['issue-836', 'final-review', 'quality-score'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'adversarial release reviewer',
      task: 'Decide whether the completed implementation is ready for PR review.',
      instructions: [
        'Compare the issue #836 scope, docs/tula-stack-renames convention, convergence outputs, final verification evidence, and the current diff directly.',
        'Reject if package identity, workspace directory, lockfile, CI, docs, tsconfig references, or dependent imports are inconsistent.',
        'Reject if the implementation renamed agent-runtime or agent-platform as part of this issue.',
        'Reject if tests were added after implementation without proving an initial red failure.',
        'Score 0-100. Approve only if qualityScore >= targetScore and final verification passed.',
        'Return JSON: { approved, qualityScore, scoreBreakdown, acceptanceStatus, blockingFindings, requiredFixes, missingVerification, residualRisks, prSummary, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'qualityScore', 'acceptanceStatus', 'blockingFindings', 'requiredFixes', 'prSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
