/**
 * @process repo/issue-798-strike3-deploy-block-tdd-plan
 * @description TDD, spec-driven implementation process for issue #798: strike-3 deploy-block enforcement for instrumentation-only forward-fix iterations.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, qualityThreshold: number, maxIterationsPerPhase: number, verificationCommands: string[], targetFiles: string[] }
 * @outputs { success: boolean, phases: string[], phaseResults: object[], finalGate: object }
 *
 * References used while authoring:
 * - gh issue view 798 --json title,body,labels,comments
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/runtime-and-layout.md
 * - docs/agent-reference/command-surfaces.md
 * - packages/sdk/src/runtime/types.ts
 * - packages/sdk/src/storage/types.ts
 * - packages/sdk/src/runtime/createRun.ts
 * - packages/sdk/src/runtime/orchestrateIteration.ts
 * - packages/sdk/src/runtime/orchestrateHelpers.ts
 * - packages/sdk/src/runtime/replay/createReplayEngine.ts
 * - packages/sdk/src/runtime/intrinsics/task.ts
 * - packages/sdk/src/runtime/commitEffectResult.ts
 * - packages/sdk/src/runtime/policy/types.ts
 * - scripts/validate-process.mjs
 * - package.json
 *
 * Process-library research:
 * - Requested repo-local .a5c/process-library/ is absent in this checkout.
 * - Active library root found at /home/runner/.a5c/process-library/babysitter-repo/library.
 * - Matching local/active references:
 *   library/processes/shared/tdd-triplet.js
 *   library/processes/shared/deterministic-quality-gate.js
 *   library/processes/shared/n-strikes-escalation.js
 *   library/processes/shared/prior-attempts-scanner.js
 *   library/methodologies/spec-driven-development.js
 *   library/methodologies/superpowers/test-driven-development.js
 *   library/methodologies/adversarial-spec-debates.js
 *   /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 *
 * Repo policy note:
 * - Direct Babysitter processes in this repo should avoid kind:"shell" subtasks
 *   unless the user explicitly asks for a shell-oriented workflow. This process
 *   uses agent tasks that are instructed to run concrete verification commands
 *   and report exact command evidence.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Run-level metadata already flows through CreateRunOptions.metadata,
 *   storage RunMetadata.extraMetadata, run.json, RUN_CREATED, and replay engine
 *   metadata. Prefer extending this existing path over adding a separate store.
 * - Iteration result metadata already exists as IterationMetadata in
 *   packages/sdk/src/runtime/types.ts and is assembled in orchestrateHelpers.ts,
 *   but it currently only carries state-cache fields.
 * - Task/effect metadata already flows through taskDef.metadata, task.json,
 *   EFFECT_REQUESTED, effect indexes, task registry, policy evaluation, and
 *   result metadata. This is reusable for forward-fix attempt annotations.
 * - Runtime governance policy hooks exist in packages/sdk/src/runtime/policy/,
 *   but current rule kinds are generic and do not model strike counting or
 *   deploy-block file-pattern gates.
 * - The current package scripts expose validate:processes, not check:processes.
 *   The implementation should either add a documented check:processes alias or
 *   explicitly wire the new strike check into validate:processes/CI.
 * - No database migration, external service, new runtime daemon, or semantic
 *   bug-class auto-detection is needed for #798.
 *
 * @process methodologies/spec-driven-development
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/adversarial-spec-debates
 * @process babysitter/tdd-quality-convergence
 * @process shared/n-strikes-escalation
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent adversarial-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_QUALITY_THRESHOLD = 90;
const DEFAULT_MAX_ITERATIONS_PER_PHASE = 4;

const IMPLEMENTATION_PHASES = [
  {
    id: 'metadata-contract',
    title: 'Forward-fix metadata contract',
    goal: 'Introduce a typed, persisted, replay-visible forward-fix metadata contract with explicit bugClass and instrumentation_only fields.',
    redFocus: [
      'Create failing tests showing forward-fix iteration/task metadata can include bugClass, attempt status, and instrumentation_only.',
      'Create failing compatibility tests proving existing arbitrary metadata and runs without forward-fix metadata still work.',
      'Create failing tests for missing bugClass diagnostics on forward-fix attempts where the author intended strike tracking.',
    ],
    greenFocus: [
      'Add the narrow type surface for ForwardFix metadata without replacing JsonRecord extensibility.',
      'Persist metadata through existing run/task/result paths and expose it through deterministic replay metadata.',
      'Keep absent metadata and unrelated process metadata backward compatible.',
    ],
    refactorFocus: [
      'Keep type names and normalization helpers small and runtime-local unless exported API is needed.',
      'Avoid duplicating metadata parsing logic across createRun, replay, and task commit paths.',
    ],
    targetFiles: [
      'packages/sdk/src/runtime/types.ts',
      'packages/sdk/src/storage/types.ts',
      'packages/sdk/src/runtime/createRun.ts',
      'packages/sdk/src/runtime/orchestrateHelpers.ts',
      'packages/sdk/src/runtime/replay/createReplayEngine.ts',
      'packages/sdk/src/tasks/types.ts',
      'packages/sdk/src/runtime/__tests__/forwardFixMetadata.test.ts',
      'packages/sdk/src/runtime/__tests__/orchestrateIteration.integration.test.ts',
    ],
  },
  {
    id: 'strike-state',
    title: 'Deterministic strike-state derivation',
    goal: 'Derive strike counts only from journaled run/effect metadata so repeated replay produces the same strike decision.',
    redFocus: [
      'Create failing tests with two prior failed forward-fix attempts for the same bugClass and assert the next attempt is auto-classified instrumentation_only=true.',
      'Create failing tests proving different bugClass values do not share strike counts.',
      'Create failing replay/idempotency tests proving repeated run:iterate calls do not increment strike state from mutable working-tree state.',
    ],
    greenFocus: [
      'Implement a deterministic strike-state helper that reads journaled metadata and result statuses only.',
      'Classify the third forward-fix attempt for a bugClass as instrumentation_only=true without semantic bug-class detection.',
      'Record strike-state decisions in auditable metadata or log events that replay can reconstruct.',
    ],
    refactorFocus: [
      'Keep strike-state computation pure and unit-testable.',
      'Separate normalization of metadata from policy decisions and gate file-pattern evaluation.',
    ],
    targetFiles: [
      'packages/sdk/src/runtime/forwardFixStrikes.ts',
      'packages/sdk/src/runtime/replay/createReplayEngine.ts',
      'packages/sdk/src/runtime/intrinsics/task.ts',
      'packages/sdk/src/runtime/commitEffectResult.ts',
      'packages/sdk/src/runtime/__tests__/forwardFixStrikes.test.ts',
      'packages/sdk/src/runtime/__tests__/deterministicHarness.test.ts',
      'packages/sdk/src/testing/runHarness.ts',
    ],
  },
  {
    id: 'deploy-block-gate',
    title: 'Instrumentation-only deploy-block gate',
    goal: 'Block algorithm-changing diffs during strike-3 instrumentation-only iterations unless an explicit audited override is present.',
    redFocus: [
      'Create failing gate tests where instrumentation_only=true plus a changed algorithm file is rejected.',
      'Create failing allow-list tests where log emission, env-flag, no-op guard, and revert changes are permitted.',
      'Create failing configuration tests for default and custom algorithm-change path patterns.',
      'Create failing tests proving the gate emits [gate] log output with bugClass, strike count, matched files, and remediation.',
    ],
    greenFocus: [
      'Add a deterministic gate/check module that evaluates the current diff against configured algorithm-change patterns.',
      'Wire the check into the current process validation surface or add a documented check:processes alias.',
      'Default patterns should be narrow and configurable, with scheduler paths included only as examples or config.',
    ],
    refactorFocus: [
      'Keep file-pattern matching deterministic and testable with fixture file lists.',
      'Avoid broad source-tree globbing that over-blocks documentation, tests, or logging-only edits.',
    ],
    targetFiles: [
      'scripts/check-fix-strikes.mjs',
      'scripts/validate-process.mjs',
      'package.json',
      'packages/sdk/src/runtime/forwardFixStrikes.ts',
      'packages/sdk/src/runtime/__tests__/forwardFixGate.test.ts',
      'scripts/__tests__/check-fix-strikes.test.mjs',
      'docs/agent-reference/process-authoring.md',
    ],
  },
  {
    id: 'override-audit',
    title: 'Strike-3 override audit trail',
    goal: 'Make --strike3-override explicit, auditable, and hard to confuse with a normal pass.',
    redFocus: [
      'Create failing tests where --strike3-override allows an algorithm-change file but requires a non-empty reason.',
      'Create failing tests proving override actor, reason, bugClass, matched files, and timestamp are recorded in journal or gate output.',
      'Create failing CLI/gate tests proving override output is visibly distinct from a clean pass.',
    ],
    greenFocus: [
      'Add the override flag at the selected gate/CLI boundary and preserve a structured audit record.',
      'Do not silently apply override from environment variables unless explicitly documented and tested.',
    ],
    refactorFocus: [
      'Keep override parsing near gate argument parsing and strike-state evaluation near runtime helpers.',
      'Normalize audit payload shape for future policy/log consumers.',
    ],
    targetFiles: [
      'scripts/check-fix-strikes.mjs',
      'packages/sdk/src/cli/main/program.ts',
      'packages/sdk/src/cli/main/usage.ts',
      'packages/sdk/src/runtime/forwardFixStrikes.ts',
      'packages/sdk/src/runtime/__tests__/forwardFixOverride.test.ts',
      'packages/sdk/src/cli/__tests__/cliMain.test.ts',
      'docs/reference/babysitter_cli_surface_spec.md',
    ],
  },
  {
    id: 'docs-ci-integration',
    title: 'Documentation and CI integration',
    goal: 'Document the strike-3 policy contract and verify it through targeted tests, SDK build, process validation, and metadata checks.',
    redFocus: [
      'Create failing docs/spec checks or snapshot tests for the public metadata names and gate behavior if such checks exist locally.',
      'Create failing end-to-end tests covering two failed fixes followed by a blocked third algorithm-change attempt.',
      'Create failing tests for missing bugClass messages and non-goals: no semantic auto-detection and no broad forward-fix budget redesign.',
    ],
    greenFocus: [
      'Update docs and command references to describe bugClass, instrumentation_only, algorithm-change patterns, and override audit expectations.',
      'Wire the new check into package scripts and CI-facing validation without renaming existing commands unexpectedly.',
    ],
    refactorFocus: [
      'Remove duplicated examples and ensure docs, CLI usage, and tests use identical field names.',
      'Keep #478 broader forward-fix budget work out of scope.',
    ],
    targetFiles: [
      'docs/agent-reference/process-authoring.md',
      'docs/agent-reference/command-surfaces.md',
      'docs/user-guide/reference/cli-reference.md',
      'docs/reference/babysitter_cli_surface_spec.md',
      'package.json',
      'packages/sdk/src/prompts/templates/task-examples.md',
      'packages/sdk/src/prompts/templates/task-kinds.md',
    ],
  },
];

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 798;
  const qualityThreshold = inputs?.qualityThreshold ?? DEFAULT_QUALITY_THRESHOLD;
  const maxIterationsPerPhase = inputs?.maxIterationsPerPhase ?? DEFAULT_MAX_ITERATIONS_PER_PHASE;

  const issueContext = await ctx.task(readIssueContextTask, {
    inputs,
    issueNumber,
  }, {
    key: 'issue-798.issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-798.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-798.process-library-research',
  });

  const architectureMap = await ctx.task(mapArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
  }, {
    key: 'issue-798.architecture-map',
  });

  const executableSpec = await ctx.task(authorExecutableSpecTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    architectureMap,
    implementationPhases: IMPLEMENTATION_PHASES,
  }, {
    key: 'issue-798.executable-spec',
  });

  if (executableSpec?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      breakpointId: 'issue-798.contract-decision',
      title: 'Approve Issue #798 Strike-3 Metadata Contract',
      question: executableSpec.question ?? 'Approve the selected metadata and gate contract before implementation starts.',
      options: ['Approve recommended contract', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-798', 'architecture-gate', 'strike3'],
      context: {
        runId: ctx.runId,
        executableSpec,
        architectureMap,
      },
    });
  }

  const phaseResults = [];
  for (const phase of IMPLEMENTATION_PHASES) {
    const phaseResult = await executeTddConvergencePhase({
      ctx,
      inputs,
      issueContext,
      reuseAudit,
      processLibraryResearch,
      architectureMap,
      executableSpec,
      phase,
      qualityThreshold,
      maxIterationsPerPhase,
      priorPhaseResults: phaseResults,
    });

    phaseResults.push(phaseResult);

    const checkpoint = await ctx.task(interPhaseVerificationCheckpointTask, {
      inputs,
      issueContext,
      executableSpec,
      phase,
      phaseResult,
      phaseResults,
      qualityThreshold,
    }, {
      key: `issue-798.${phase.id}.checkpoint`,
    });

    phaseResult.interPhaseCheckpoint = checkpoint;

    if (phaseResult.converged !== true || checkpoint?.passed !== true) {
      await ctx.breakpoint({
        breakpointId: `issue-798.${phase.id}.convergence-escalation`,
        title: `Issue #798 Phase Needs Review: ${phase.title}`,
        question: [
          `Phase ${phase.title} did not meet the required quality threshold or verification checkpoint.`,
          'Review the latest adversarial findings and decide whether to continue another iteration or pause.',
        ].join('\n'),
        options: ['Continue with targeted remediation', 'Pause for maintainer guidance'],
        expert: 'owner',
        tags: ['issue-798', 'quality-gate', phase.id],
        context: {
          runId: ctx.runId,
          phaseResult,
          checkpoint,
        },
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    architectureMap,
    executableSpec,
    phaseResults,
    qualityThreshold,
  }, {
    key: 'issue-798.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      breakpointId: 'issue-798.final-acceptance',
      title: 'Issue #798 Final Acceptance Needs Maintainer Decision',
      question: finalGate?.question ?? 'Final acceptance found unresolved verification, review, or scope issues.',
      options: ['Continue with documented remediation', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-798', 'final-gate'],
      context: {
        runId: ctx.runId,
        finalGate,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'process-library-research',
      'architecture-map',
      'executable-spec',
      ...IMPLEMENTATION_PHASES.map((phase) => `${phase.id}: red-green-refactor-review-convergence`),
      'final-acceptance',
    ],
    issueContext,
    reuseAudit,
    processLibraryResearch,
    architectureMap,
    executableSpec,
    phaseResults,
    finalGate,
  };
}

async function executeTddConvergencePhase(args) {
  const {
    ctx,
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    architectureMap,
    executableSpec,
    phase,
    qualityThreshold,
    maxIterationsPerPhase,
    priorPhaseResults,
  } = args;

  const iterations = [];
  let latestReview = null;
  let latestVerification = null;
  let converged = false;

  for (let iteration = 1; iteration <= maxIterationsPerPhase; iteration += 1) {
    const red = await ctx.task(writeFailingTestsTask, {
      inputs,
      issueContext,
      reuseAudit,
      processLibraryResearch,
      architectureMap,
      executableSpec,
      phase,
      priorPhaseResults,
      previousReview: latestReview,
      previousVerification: latestVerification,
      iteration,
    }, {
      key: `issue-798.${phase.id}.red.${iteration}`,
    });

    const redVerification = await ctx.task(verifyRedTask, {
      inputs,
      issueContext,
      executableSpec,
      phase,
      red,
      iteration,
    }, {
      key: `issue-798.${phase.id}.verify-red.${iteration}`,
    });

    const green = await ctx.task(implementMinimumGreenTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureMap,
      executableSpec,
      phase,
      red,
      redVerification,
      previousReview: latestReview,
      iteration,
    }, {
      key: `issue-798.${phase.id}.green.${iteration}`,
    });

    const greenVerification = await ctx.task(verifyGreenTask, {
      inputs,
      issueContext,
      executableSpec,
      phase,
      red,
      green,
      iteration,
    }, {
      key: `issue-798.${phase.id}.verify-green.${iteration}`,
    });

    const refactor = await ctx.task(refactorWhileGreenTask, {
      inputs,
      issueContext,
      executableSpec,
      phase,
      red,
      green,
      greenVerification,
      iteration,
    }, {
      key: `issue-798.${phase.id}.refactor.${iteration}`,
    });

    latestVerification = await ctx.task(phaseVerificationGateTask, {
      inputs,
      issueContext,
      executableSpec,
      phase,
      red,
      green,
      greenVerification,
      refactor,
      iteration,
    }, {
      key: `issue-798.${phase.id}.verification.${iteration}`,
    });

    latestReview = await ctx.task(adversarialReviewScoreTask, {
      inputs,
      issueContext,
      reuseAudit,
      processLibraryResearch,
      architectureMap,
      executableSpec,
      phase,
      red,
      redVerification,
      green,
      greenVerification,
      refactor,
      verification: latestVerification,
      qualityThreshold,
      iteration,
    }, {
      key: `issue-798.${phase.id}.adversarial-review.${iteration}`,
    });

    const qualityScore = normalizeQualityScore(latestReview);
    const iterationResult = {
      iteration,
      red,
      redVerification,
      green,
      greenVerification,
      refactor,
      verification: latestVerification,
      review: latestReview,
      qualityScore,
      passed: redVerification?.redConfirmed === true
        && greenVerification?.passed === true
        && latestVerification?.passed === true
        && latestReview?.approved === true
        && qualityScore >= qualityThreshold,
    };
    iterations.push(iterationResult);

    if (iterationResult.passed) {
      converged = true;
      break;
    }
  }

  return {
    phaseId: phase.id,
    title: phase.title,
    converged,
    iterations,
    finalQualityScore: iterations.at(-1)?.qualityScore ?? 0,
    latestVerification,
    latestReview,
    changedFiles: latestReview?.changedFiles ?? latestVerification?.changedFiles ?? [],
  };
}

function normalizeQualityScore(review) {
  const score = review?.qualityScore ?? review?.score ?? 0;
  if (typeof score !== 'number' || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

export const readIssueContextTask = defineTask('issue-798.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #798 and extract strike-3 deploy-block requirements',
  labels: ['issue-798', 'context', 'spec'],
  metadata: { issueNumber: args.issueNumber, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK researcher',
      task: 'Read the authoritative GitHub issue context and extract the full implementation specification for issue #798.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments and preserve the title, body, labels, and every comment.`,
        `Also run gh pr view ${args.issueNumber} --json files,title,body,comments and record that GitHub returns no pull request if it is not a PR.`,
        'Extract acceptance criteria, non-goals, labels, affected packages, related issue #478 context from the issue text, and triage risks.',
        'Confirm the proposal is deploy-block enforcement only, not semantic bugClass auto-detection and not the broader #478 forward-fix budget.',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, acceptanceCriteria, nonGoals, affectedComponents, risks, relatedIssues, implementationRequirements }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'acceptanceCriteria', 'nonGoals', 'affectedComponents', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-798.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for strike-3 enforcement infrastructure',
  labels: ['issue-798', 'reuse-audit', 'architecture'],
  metadata: { issueNumber: args.inputs?.issueNumber ?? 798, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK architect performing the repo-required reuse audit',
      task: 'Find existing infrastructure to reuse before adding strike-3 metadata, strike-state, and deploy-block gate behavior.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keywords from the issue: bugClass, instrumentation_only, strike-3, forward-fix, deploy-block, algorithm-change file diffs, gate, check:processes, validate:processes, --strike3-override.',
        'Honor .a5c/reuse-audit.json if it exists.',
        'Scan existing runtime metadata, task metadata, journal, replay, policy, gate/check, CLI, docs, and tests before proposing new infrastructure.',
        'Explicitly identify reusable surfaces and explain why no database, external service, or semantic auto-detection subsystem is needed.',
        'Return JSON: { keywords, findings, reusableSurfaces, noMatchingInfrastructureFound, recommendedReuse, risks, processLibraryStatus }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['keywords', 'findings', 'reusableSurfaces', 'recommendedReuse', 'processLibraryStatus'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-798.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research process-library methodologies for TDD convergence and adversarial review',
  labels: ['issue-798', 'process-library', 'tdd'],
  metadata: { issueNumber: args.inputs?.issueNumber ?? 798, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'process-methodologist',
    prompt: {
      role: 'Babysitter process-library researcher',
      task: 'Select the methodologies and shared process components that should shape the #798 implementation run.',
      instructions: [
        'Check whether .a5c/process-library/ exists; if absent, record that fact.',
        'Inspect active and in-repo process-library analogues for TDD, spec-driven development, adversarial review scoring, deterministic gates, n-strikes escalation, and prior-attempt scanning.',
        'Use only the references relevant to this issue; do not bulk-load unrelated process files.',
        'Return JSON: { requestedRootStatus, activeLibraryRoot, selectedMethodologies, selectedSharedComponents, howApplied, rejectedAlternatives }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['requestedRootStatus', 'selectedMethodologies', 'selectedSharedComponents', 'howApplied'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const mapArchitectureTask = defineTask('issue-798.map-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map SDK runtime architecture for strike-3 enforcement',
  labels: ['issue-798', 'architecture', 'sdk'],
  metadata: { issueNumber: args.inputs?.issueNumber ?? 798, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK architect',
      task: 'Map the current runtime, storage, replay, task, policy, CLI, and gate/check surfaces that #798 must touch.',
      instructions: [
        'Inspect packages/sdk/src/runtime/types.ts for IterationMetadata, CreateRunOptions.metadata, EffectRecord, and ProcessContext.',
        'Inspect packages/sdk/src/storage/types.ts and createRun.ts for run.json metadata persistence.',
        'Inspect orchestrateIteration.ts and orchestrateHelpers.ts for iteration result metadata assembly and terminal event behavior.',
        'Inspect replay/createReplayEngine.ts and replay/effectIndex.ts for deterministic state reconstruction.',
        'Inspect runtime/intrinsics/task.ts and commitEffectResult.ts for task metadata, EFFECT_REQUESTED, EFFECT_RESOLVED, result metadata, policy, and hooks.',
        'Inspect package.json and scripts/validate-process.mjs for the current process validation gate and lack of check:processes alias.',
        'Return JSON: { currentArchitecture, metadataPaths, strikeStateInputs, gateSurfaces, cliSurfaces, testSurfaces, risks, recommendedDesign }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['currentArchitecture', 'metadataPaths', 'strikeStateInputs', 'gateSurfaces', 'testSurfaces', 'recommendedDesign'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorExecutableSpecTask = defineTask('issue-798.author-executable-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author executable spec for strike-3 deploy-block enforcement',
  labels: ['issue-798', 'spec', 'acceptance-criteria'],
  metadata: { issueNumber: args.inputs?.issueNumber ?? 798, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'spec-author',
    prompt: {
      role: 'spec-driven development lead',
      task: 'Convert issue #798 into an executable implementation spec that each TDD phase can verify.',
      instructions: [
        'Define public metadata names, compatibility rules, strike-count rules, instrumentation_only behavior, file-pattern gate behavior, override audit behavior, and docs expectations.',
        'Make explicit what counts as an algorithm-change file pattern and what is allowed during instrumentation_only: log emission, env-flag, no-op guard, and revert changes.',
        'Require strike state to be derived from journaled metadata/results only, with deterministic replay and idempotency tests.',
        'State non-goals: no semantic bugClass auto-detection and no broad #478-style forward-fix budget redesign.',
        'If metadata placement or override CLI boundary is genuinely ambiguous, set needsMaintainerDecision=true and include a concise question.',
        'Return JSON: { spec, acceptanceCriteria, metadataContract, gateContract, overrideContract, testPlan, needsMaintainerDecision, question, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['spec', 'acceptanceCriteria', 'metadataContract', 'gateContract', 'overrideContract', 'testPlan'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const writeFailingTestsTask = defineTask('issue-798.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `RED: write failing tests for ${args.phase.title}`,
  labels: ['issue-798', 'tdd', 'red', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'red',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'test-engineer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'strict TDD test engineer',
      task: `Write failing tests first for phase "${args.phase.title}". Do not implement production behavior in this task.`,
      context: {
        issueContext: args.issueContext,
        executableSpec: args.executableSpec,
        phase: args.phase,
        priorPhaseResults: args.priorPhaseResults,
        previousReview: args.previousReview,
        previousVerification: args.previousVerification,
        iteration: args.iteration,
      },
      instructions: [
        'Only create or update tests and test fixtures required for this phase.',
        'Tests must assert the behavior in phase.redFocus and must fail against the current implementation for the right reason.',
        'Include at least one negative test and one compatibility/idempotency test when applicable.',
        'Do not make production code changes except harmless test fixture scaffolding.',
        'After writing tests, run the narrowest relevant test command and capture exact failing output.',
        'Return JSON: { testFiles, testsAdded, commandsRun, redFailures, failedForRightReason, productionFilesTouched, summary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testsAdded', 'commandsRun', 'redFailures', 'failedForRightReason', 'productionFilesTouched', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyRedTask = defineTask('issue-798.verify-red', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify RED state for ${args.phase.title}`,
  labels: ['issue-798', 'tdd', 'red-verification', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'verify-red',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'TDD red-state verifier',
      task: 'Verify the newly added tests fail for the intended missing behavior and not for setup errors.',
      instructions: [
        'Inspect the red task result and rerun the narrow test command if evidence is missing.',
        'Confirm tests fail before implementation and fail for the expected issue-specific reason.',
        'If tests pass immediately, mark redConfirmed=false and identify the TDD violation.',
        'Return JSON: { redConfirmed, failedForRightReason, commandsRun, evidence, issues }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['redConfirmed', 'failedForRightReason', 'commandsRun', 'evidence', 'issues'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMinimumGreenTask = defineTask('issue-798.implement-minimum-green', (args, taskCtx) => ({
  kind: 'agent',
  title: `GREEN: minimum implementation for ${args.phase.title}`,
  labels: ['issue-798', 'tdd', 'green', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'green',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'coder',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 12,
    prompt: {
      role: 'senior SDK engineer implementing the minimum green step',
      task: `Implement only the minimum production changes needed to pass the phase "${args.phase.title}" red tests.`,
      context: {
        issueContext: args.issueContext,
        architectureMap: args.architectureMap,
        executableSpec: args.executableSpec,
        phase: args.phase,
        red: args.red,
        redVerification: args.redVerification,
        previousReview: args.previousReview,
        iteration: args.iteration,
      },
      instructions: [
        'Do not broaden beyond this phase goal.',
        'Use existing SDK runtime, storage, replay, policy, CLI, and scripts patterns.',
        'Keep strike-state deterministic and based on journaled metadata/results only.',
        'Keep metadata optional and backward compatible.',
        'Run the narrow red test command until it passes; capture exact commands and results.',
        'Return JSON: { changedFiles, productionChanges, testsNowPassing, commandsRun, remainingFailures, summary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'productionChanges', 'testsNowPassing', 'commandsRun', 'remainingFailures', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyGreenTask = defineTask('issue-798.verify-green', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify GREEN state for ${args.phase.title}`,
  labels: ['issue-798', 'tdd', 'green-verification', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'verify-green',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'TDD green-state verifier',
      task: 'Verify the phase tests now pass and no immediately adjacent regression tests fail.',
      instructions: [
        'Run the phase-specific tests and any adjacent tests listed in inputs.verificationCommands that are relevant to this phase.',
        'Confirm the implementation is not merely deleting or weakening the red tests.',
        'Return JSON: { passed, commandsRun, passingTests, failingTests, changedTestsStillAssertSpec, issues }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commandsRun', 'passingTests', 'failingTests', 'changedTestsStillAssertSpec', 'issues'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refactorWhileGreenTask = defineTask('issue-798.refactor-while-green', (args, taskCtx) => ({
  kind: 'agent',
  title: `REFACTOR: clean up ${args.phase.title} while tests stay green`,
  labels: ['issue-798', 'tdd', 'refactor', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'refactor',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'coder',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'senior SDK engineer refactoring only after green tests',
      task: `Refactor the phase "${args.phase.title}" implementation without changing behavior.`,
      instructions: [
        'Apply only refactors justified by phase.refactorFocus or obvious local duplication.',
        'Do not add new feature behavior during refactor.',
        'Re-run the green verification commands after refactoring.',
        'Return JSON: { refactored, changedFiles, behaviorChanged, commandsRun, stillGreen, summary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['refactored', 'changedFiles', 'behaviorChanged', 'commandsRun', 'stillGreen', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const phaseVerificationGateTask = defineTask('issue-798.phase-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verification checkpoint for ${args.phase.title}`,
  labels: ['issue-798', 'verification', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'verification',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'deterministic verification lead',
      task: 'Run the phase verification checkpoint and report exact command evidence.',
      instructions: [
        'Run the phase-specific tests, relevant adjacent tests, and any cheap static checks needed for this phase.',
        'For metadata/replay phases, include replay/idempotency tests.',
        'For gate/override phases, include fixture-based allow/deny and CLI/script tests.',
        'For docs/CI phase, include docs/check script evidence where applicable.',
        'Do not reinterpret failing commands as passing. If a failure is unrelated, provide exact evidence.',
        'Return JSON: { passed, commandsRun, failures, unrelatedFailures, changedFiles, evidence, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commandsRun', 'failures', 'unrelatedFailures', 'changedFiles', 'evidence', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewScoreTask = defineTask('issue-798.adversarial-review-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review and quality score for ${args.phase.title}`,
  labels: ['issue-798', 'adversarial-review', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    tddPhase: 'adversarial-review',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'adversarial-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 8,
    prompt: {
      role: 'adversarial senior code reviewer scoring against the executable spec',
      task: `Review phase "${args.phase.title}" and assign a quality score from 0 to 100.`,
      context: {
        qualityThreshold: args.qualityThreshold,
        issueContext: args.issueContext,
        executableSpec: args.executableSpec,
        phase: args.phase,
        red: args.red,
        redVerification: args.redVerification,
        green: args.green,
        greenVerification: args.greenVerification,
        refactor: args.refactor,
        verification: args.verification,
      },
      instructions: [
        'Lead with blocking bugs and spec violations.',
        'Score 0-100 using these dimensions: TDD integrity, spec compliance, deterministic replay, gate correctness, compatibility, override auditability, test adequacy, docs/CLI clarity, and scope control.',
        'A score below 90 must include concrete remediation tasks for the next iteration.',
        'Approval requires qualityScore >= qualityThreshold, verification.passed=true, red/green evidence intact, and no blocking issue.',
        'Return JSON: { approved, qualityScore, blockingFindings, nonBlockingFindings, remediationTasks, changedFiles, scoreBreakdown, summary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'qualityScore', 'blockingFindings', 'nonBlockingFindings', 'remediationTasks', 'scoreBreakdown', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const interPhaseVerificationCheckpointTask = defineTask('issue-798.inter-phase-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inter-phase checkpoint after ${args.phase.title}`,
  labels: ['issue-798', 'checkpoint', args.phase.id],
  metadata: {
    issueNumber: args.inputs?.issueNumber ?? 798,
    bugClass: 'strike-3-deploy-block-enforcement',
    implementationPhase: args.phase.id,
  },
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'phase boundary verification lead',
      task: 'Confirm the just-completed phase can safely hand off to the next phase.',
      instructions: [
        'Check that all phase acceptance criteria are met and the latest quality score is at least the threshold.',
        'Check that no source changes are outside the issue scope or phase target files without justification.',
        'Check that verification evidence is exact and reproducible.',
        'Return JSON: { passed, handoffReady, commandsRun, phaseAcceptance, scopeIssues, nextPhaseRisks, summary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'handoffReady', 'commandsRun', 'phaseAcceptance', 'scopeIssues', 'nextPhaseRisks', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-798.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #798',
  labels: ['issue-798', 'final-gate', 'acceptance'],
  metadata: { issueNumber: args.inputs?.issueNumber ?? 798, bugClass: 'strike-3-deploy-block-enforcement' },
  agent: {
    name: 'code-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    approvalMode: 'yolo',
    maxTurns: 10,
    prompt: {
      role: 'release readiness reviewer for Babysitter SDK governance changes',
      task: 'Run final acceptance for the complete #798 implementation.',
      instructions: [
        'Verify every issue acceptance criterion and every non-goal.',
        'Run or inspect evidence for all inputs.verificationCommands, including build:sdk, test:sdk, verify:metadata, validate/check processes, targeted runtime/CLI/script tests, docs checks where applicable, and git diff --check.',
        'Confirm all implementation phases converged with qualityScore >= qualityThreshold.',
        'Confirm two failed fixes for the same bugClass force the third attempt to instrumentation_only=true.',
        'Confirm instrumentation_only blocks algorithm-change diffs unless --strike3-override has an audited reason.',
        'Confirm replay/idempotency, missing bugClass diagnostics, custom patterns, allowed logging/env/no-op/revert changes, and docs are covered.',
        'Return JSON: { passed, acceptance, commandsRun, unresolvedRisks, changedFiles, qualityScores, pullRequestSummary, question }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'acceptance', 'commandsRun', 'unresolvedRisks', 'changedFiles', 'qualityScores', 'pullRequestSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
