/**
 * @process repo/issue-797-roadmap-not-planned-warning
 * @description TDD, spec-driven implementation process for issue #797: warning-only detection of roadmap items linked to upstream GitHub issues closed as NOT_PLANNED.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, issueContext: object, targetQualityScore: number, maxAttemptsPerPhase: number, targetFiles: string[], testFiles: string[], verificationCommands: string[], processLibraryResearch: object }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], phaseResults: array, finalVerification: object, finalReview: object }
 *
 * References used while authoring:
 * - gh issue view 797 --json title,body,labels,comments
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/repo-map.md
 * - docs/user-guide/features/process-library.md
 * - docs/user-guide/generated/process-library-inventory.json
 * - library/tdd-quality-convergence.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - library/methodologies/spec-driven-development.js
 * - library/methodologies/superpowers/test-driven-development.js
 * - library/methodologies/superpowers/verification-before-completion.js
 * - library/specializations/technical-documentation/docs-testing.js
 * - scripts/docs-freshness-report.cjs
 * - scripts/docs-qa-config.cjs
 * - docs/harness-features-backlog/roadmap.md
 * - package.json
 * - .github/workflows/ci.yml
 *
 * Process-library references used:
 * - Requested .a5c/process-library/ was not present in this checkout.
 * - Used the live repository library/ tree and generated process-library inventory.
 *
 * @process babysitter/tdd-quality-convergence
 * @process methodologies/spec-driven-development
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/technical-documentation/docs-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_SCORE = 90;
const DEFAULT_MAX_ATTEMPTS_PER_PHASE = 3;

const PHASES = [
  {
    id: 'spec-and-reuse',
    title: 'Specification and reuse alignment',
    objective: 'Convert issue #797 into an executable acceptance spec and confirm reuse boundaries before code edits.',
    red: 'Author failing tests or fixtures that define accepted roadmap issue-link shapes, NOT_PLANNED warning semantics, and warning-only docs freshness behavior.',
    green: 'Create the narrowest implementation plan and source touch list that can satisfy those tests without adding new infrastructure.',
    refactor: 'Normalize naming, fixture placement, and helper boundaries so later phases reuse the same contracts.',
    verificationCheckpoint: 'Tests must demonstrate the current repo does not surface NOT_PLANNED linked issues, or explain any characterization-only test that cannot be red without source edits.',
  },
  {
    id: 'roadmap-link-parsing',
    title: 'Roadmap issue-link parsing',
    objective: 'Implement deterministic extraction of roadmap items with GitHub issue links from repo-owned roadmap-style markdown or configured roadmap sources.',
    red: 'Write failing parser tests for explicit issue_link metadata and practical markdown link/reference forms, including dedupe and line-number reporting.',
    green: 'Implement only enough parsing/config wiring to pass the parser tests.',
    refactor: 'Separate pure parsing from filesystem traversal and preserve existing docs freshness behavior for non-roadmap docs.',
    verificationCheckpoint: 'Parser tests pass; no network or gh dependency is required for parser coverage.',
  },
  {
    id: 'github-state-evaluation',
    title: 'GitHub issue state evaluation',
    objective: 'Evaluate linked issue state with a bounded gh-based adapter while avoiding false positives and flaky required network tests.',
    red: 'Write failing tests around mocked gh responses for OPEN, CLOSED/COMPLETED, CLOSED/NOT_PLANNED, missing stateReason, command failure, timeout, and duplicate links.',
    green: 'Implement the minimum gh issue view adapter and pure state classifier needed to emit warnings only for CLOSED plus NOT_PLANNED.',
    refactor: 'Keep process spawning isolated and injectable so tests never require live GitHub access.',
    verificationCheckpoint: 'Mocked state-evaluation tests pass and prove missing stateReason/closedAt fallback is uncertain, not NOT_PLANNED.',
  },
  {
    id: 'docs-freshness-integration',
    title: 'Docs freshness warning integration',
    objective: 'Integrate stale upstream roadmap warnings into docs freshness reporting and CI logs without blocking docs QA.',
    red: 'Write failing tests or script-level fixtures proving a NOT_PLANNED linked roadmap item appears in freshness-report.json and console warnings while the command exits 0.',
    green: 'Wire the checker into scripts/docs-freshness-report.cjs and docs-qa config with warning-only output.',
    refactor: 'Preserve current failure behavior for stale generated docs, metadata, CLI references, and package references.',
    verificationCheckpoint: 'docs:freshness fixture tests pass and warning-only behavior is verified separately from blocking freshness failures.',
  },
  {
    id: 'operator-docs-and-ci-contract',
    title: 'Operator documentation and CI contract',
    objective: 'Document the opt-in/source contract and ensure CI remains stable when gh/auth/network is unavailable.',
    red: 'Add failing documentation or contract tests for configured roadmap source behavior, gh-unavailable graceful skip, artifact shape, and user-facing warning wording.',
    green: 'Add minimal docs/config updates and graceful-skip behavior needed to satisfy the contract.',
    refactor: 'Keep wording concise and avoid promising automatic dropping or enforcement.',
    verificationCheckpoint: 'Docs QA can run without requiring authenticated GitHub lookups; warnings are informational and discoverable in artifacts.',
  },
];

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 797;
  const targetQualityScore = inputs?.targetQualityScore ?? DEFAULT_TARGET_SCORE;
  const maxAttemptsPerPhase = inputs?.maxAttemptsPerPhase ?? DEFAULT_MAX_ATTEMPTS_PER_PHASE;

  const issueContext = {
    issueNumber,
    title: inputs?.issueContext?.title ?? inputs?.title,
    labels: inputs?.issueContext?.labels ?? inputs?.labels ?? [],
    body: inputs?.issueContext?.body ?? inputs?.issueBody,
    comments: inputs?.issueContext?.comments ?? inputs?.comments ?? [],
  };

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles: inputs?.targetFiles,
    processLibraryResearch: inputs?.processLibraryResearch,
  }, { key: 'issue-797.reuse-audit' });

  const implementationSpec = await ctx.task(authorExecutableSpecTask, {
    issueContext,
    reuseAudit,
    phases: PHASES,
    targetFiles: inputs?.targetFiles,
    testFiles: inputs?.testFiles,
  }, { key: 'issue-797.executable-spec' });

  if (implementationSpec?.requiresMaintainerDecision === true) {
    const bp = await ctx.breakpoint({
      title: 'Issue #797 Specification Decision',
      question: implementationSpec.question ?? 'Specification has an unresolved roadmap source or metadata-format decision. Choose before implementation continues.',
      options: [
        'Use recommended docs freshness integration',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-797', 'specification', 'approval-gate'],
      context: {
        runId: ctx.runId,
        implementationSpec,
      },
    });

    if (bp?.approved === false) {
      return {
        success: false,
        halted: true,
        reason: 'Maintainer did not approve specification decision.',
        reuseAudit,
        implementationSpec,
      };
    }
  }

  const phaseResults = [];
  let previousPhase = null;

  for (const phase of PHASES) {
    const result = await runConvergingPhase(ctx, {
      phase,
      issueContext,
      reuseAudit,
      implementationSpec,
      previousPhase,
      inputs,
      targetQualityScore,
      maxAttemptsPerPhase,
    });

    phaseResults.push(result);
    previousPhase = result;

    const checkpoint = await ctx.task(phaseCheckpointTask, {
      phase,
      result,
      issueContext,
      targetQualityScore,
      verificationCommands: inputs?.verificationCommands,
    }, { key: `issue-797.${phase.id}.checkpoint` });

    result.checkpoint = checkpoint;

    if (checkpoint?.passed !== true) {
      const bp = await ctx.breakpoint({
        title: `Issue #797 Checkpoint Failed: ${phase.title}`,
        question: 'A verification checkpoint failed before the next phase. Review the failure before continuing?',
        options: [
          'Pause for maintainer guidance',
          'Continue with recorded risk',
        ],
        expert: 'owner',
        tags: ['issue-797', 'checkpoint', phase.id],
        context: {
          runId: ctx.runId,
          phase,
          result,
          checkpoint,
        },
      });

      if (bp?.approved !== true) {
        return {
          success: false,
          halted: true,
          reason: `Checkpoint failed for phase ${phase.id}.`,
          reuseAudit,
          implementationSpec,
          phaseResults,
        };
      }
    }
  }

  const finalVerification = await ctx.task(finalVerificationTask, {
    issueContext,
    implementationSpec,
    phaseResults,
    verificationCommands: inputs?.verificationCommands,
    targetFiles: inputs?.targetFiles,
    testFiles: inputs?.testFiles,
  }, { key: 'issue-797.final-verification' });

  const finalReview = await ctx.task(finalAdversarialReviewTask, {
    issueContext,
    reuseAudit,
    implementationSpec,
    phaseResults,
    finalVerification,
    targetQualityScore,
  }, { key: 'issue-797.final-adversarial-review' });

  return {
    success: Boolean(
      finalVerification?.passed === true &&
      Number(finalReview?.score ?? 0) >= targetQualityScore &&
      finalReview?.approved !== false,
    ),
    phases: PHASES.map((phase) => phase.id),
    changedFiles: finalVerification?.changedFiles ?? collectChangedFiles(phaseResults),
    reuseAudit,
    implementationSpec,
    phaseResults,
    finalVerification,
    finalReview,
  };
}

async function runConvergingPhase(ctx, args) {
  const attempts = [];
  let feedback = args.previousPhase?.review ?? null;

  for (let attempt = 1; attempt <= args.maxAttemptsPerPhase; attempt += 1) {
    const red = await ctx.task(writeFailingTestsTask, {
      ...args,
      attempt,
      feedback,
    }, { key: `issue-797.${args.phase.id}.red.${attempt}` });

    const green = await ctx.task(implementMinimumTask, {
      ...args,
      attempt,
      feedback,
      red,
    }, { key: `issue-797.${args.phase.id}.green.${attempt}` });

    const refactor = await ctx.task(refactorWhileGreenTask, {
      ...args,
      attempt,
      feedback,
      red,
      green,
    }, { key: `issue-797.${args.phase.id}.refactor.${attempt}` });

    const verification = await ctx.task(verifyPhaseTask, {
      ...args,
      attempt,
      red,
      green,
      refactor,
    }, { key: `issue-797.${args.phase.id}.verify.${attempt}` });

    const review = await ctx.task(adversarialScoreTask, {
      ...args,
      attempt,
      red,
      green,
      refactor,
      verification,
    }, { key: `issue-797.${args.phase.id}.adversarial-review.${attempt}` });

    const attemptResult = {
      attempt,
      red,
      green,
      refactor,
      verification,
      review,
      score: Number(review?.score ?? 0),
    };
    attempts.push(attemptResult);

    if (verification?.passed === true && attemptResult.score >= args.targetQualityScore) {
      return {
        phase: args.phase.id,
        title: args.phase.title,
        converged: true,
        attempts,
        score: attemptResult.score,
        red,
        green,
        refactor,
        verification,
        review,
      };
    }

    feedback = review;
  }

  return {
    phase: args.phase.id,
    title: args.phase.title,
    converged: false,
    attempts,
    score: attempts.at(-1)?.score ?? 0,
    red: attempts.at(-1)?.red ?? null,
    green: attempts.at(-1)?.green ?? null,
    refactor: attempts.at(-1)?.refactor ?? null,
    verification: attempts.at(-1)?.verification ?? null,
    review: attempts.at(-1)?.review ?? null,
  };
}

function collectChangedFiles(phaseResults) {
  const files = new Set();
  for (const phase of phaseResults ?? []) {
    for (const attempt of phase.attempts ?? []) {
      for (const file of attempt.green?.changedFiles ?? []) {
        files.add(file);
      }
      for (const file of attempt.refactor?.changedFiles ?? []) {
        files.add(file);
      }
    }
  }
  return Array.from(files).sort();
}

const reuseAuditTask = defineTask('issue-797.reuse-audit', ({ issueContext, targetFiles, processLibraryResearch }) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for roadmap NOT_PLANNED warnings',
  labels: ['issue-797', 'reuse-audit', 'docs', 'ci'],
  agent: {
    name: 'docs-freshness-reuse-auditor',
    prompt: {
      role: 'senior repository maintainer performing the required reuse audit',
      task: 'Research existing infrastructure before planning or implementation work continues.',
      instructions: [
        'Print a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue context: roadmap, issue_link, GitHub issue state, stateReason, NOT_PLANNED, docs freshness, docs QA, CI warning.',
        'Search for matching scripts, config, tests, docs roadmap sources, environment variables, child_process/gh usage, and process-library patterns.',
        'Confirm that scripts/render-roadmap.mjs is absent before proposing docs-freshness integration.',
        'Do not edit source files during this task.',
        'Return JSON: { keywords: string[], existingInfrastructure: array, noMatchingExistingInfrastructureFound: boolean, recommendedReuse: array, targetFilesConfirmed: string[], risks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        '',
        'PROCESS LIBRARY RESEARCH ALREADY COLLECTED:',
        JSON.stringify(processLibraryResearch ?? {}, null, 2),
      ],
    },
  },
}));

const authorExecutableSpecTask = defineTask('issue-797.author-executable-spec', ({ issueContext, reuseAudit, phases, targetFiles, testFiles }) => ({
  kind: 'agent',
  title: 'Author executable implementation specification',
  labels: ['issue-797', 'spec-driven', 'planning'],
  agent: {
    name: 'roadmap-warning-spec-author',
    prompt: {
      role: 'spec-driven development lead',
      task: 'Convert issue #797 into an executable brownfield specification for the implementation agent.',
      instructions: [
        'Do not edit production code in this task.',
        'Define acceptance criteria that are testable before implementation.',
        'Specify supported issue-link formats, warning-only output, artifact shape, gh unavailable behavior, timeout behavior, and older gh stateReason fallback behavior.',
        'Require tests to mock gh/process execution; no live GitHub calls in automated tests.',
        'Require human-in-the-loop behavior: never auto-drop roadmap items.',
        'Identify whether any maintainer decision is still required. Prefer no breakpoint if docs freshness integration and repo-owned roadmap sources are sufficient.',
        'Return JSON: { acceptanceCriteria: string[], testMatrix: array, sourceTouchList: string[], requiresMaintainerDecision: boolean, question: string | null, risks: array }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(reuseAudit ?? {}, null, 2),
        '',
        `PHASES: ${JSON.stringify(phases, null, 2)}`,
        `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        `TEST FILES: ${JSON.stringify(testFiles ?? [])}`,
      ],
    },
  },
}));

const writeFailingTestsTask = defineTask('issue-797.write-failing-tests', ({ phase, issueContext, implementationSpec, previousPhase, attempt, feedback, inputs }) => ({
  kind: 'agent',
  title: `RED: ${phase.title}`,
  labels: ['issue-797', 'tdd', 'red', phase.id],
  agent: {
    name: `issue-797-${phase.id}-test-author`,
    prompt: {
      role: 'senior test engineer practicing strict TDD',
      task: phase.red,
      instructions: [
        'Write failing tests before production changes for this phase.',
        'Run the narrowest relevant test command and verify RED: tests must fail for the intended missing behavior.',
        'If a test is necessarily characterization-only, explicitly explain why and add a separate failing assertion for the new behavior when possible.',
        'Do not weaken, skip, or delete existing tests.',
        'Keep tests deterministic; mock gh/process/network behavior.',
        'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommand: string, redOutputSummary: string, failedForRightReason: boolean, changedFiles: string[], characterizationReason: string | null }.',
        '',
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        `ATTEMPT: ${attempt}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'PREVIOUS PHASE:',
        JSON.stringify(previousPhase ?? null, null, 2),
        '',
        'PRIOR FEEDBACK FOR THIS PHASE:',
        JSON.stringify(feedback ?? null, null, 2),
        '',
        'INPUTS:',
        JSON.stringify(inputs ?? {}, null, 2),
      ],
    },
  },
}));

const implementMinimumTask = defineTask('issue-797.implement-minimum', ({ phase, issueContext, implementationSpec, red, attempt, feedback, inputs }) => ({
  kind: 'agent',
  title: `GREEN: ${phase.title}`,
  labels: ['issue-797', 'tdd', 'green', phase.id],
  agent: {
    name: `issue-797-${phase.id}-implementer`,
    prompt: {
      role: 'senior Node.js maintainer',
      task: phase.green,
      instructions: [
        'Implement the minimum production change needed to pass the RED tests for this phase.',
        'Stay within scripts/docs-freshness-report.cjs, scripts/docs-qa-config.cjs, focused tests, and narrowly necessary docs unless the spec proves another file is required.',
        'Keep behavior warning-only. Do not make NOT_PLANNED roadmap warnings fail docs:freshness, docs:qa, or CI.',
        'Do not auto-drop or mutate roadmap item statuses.',
        'Mockable gh access is required; do not create tests that require live network or GitHub auth.',
        'Run the relevant narrow command after implementation and report results.',
        'Return JSON: { changedFiles: string[], implementationSummary: string, testResults: array, behaviorPreserved: boolean, remainingRisks: array }.',
        '',
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        `ATTEMPT: ${attempt}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'RED RESULT:',
        JSON.stringify(red ?? {}, null, 2),
        '',
        'PRIOR FEEDBACK:',
        JSON.stringify(feedback ?? null, null, 2),
        '',
        'INPUTS:',
        JSON.stringify(inputs ?? {}, null, 2),
      ],
    },
  },
}));

const refactorWhileGreenTask = defineTask('issue-797.refactor-while-green', ({ phase, issueContext, implementationSpec, red, green, attempt, feedback }) => ({
  kind: 'agent',
  title: `REFACTOR: ${phase.title}`,
  labels: ['issue-797', 'tdd', 'refactor', phase.id],
  agent: {
    name: `issue-797-${phase.id}-refactorer`,
    prompt: {
      role: 'senior maintainer performing focused refactoring',
      task: phase.refactor,
      instructions: [
        'Refactor only while tests are green.',
        'Improve names, extraction, injection points, and report shape only where it reduces real complexity.',
        'Do not broaden behavior or add unrelated infrastructure.',
        'Re-run the narrow phase tests after refactoring.',
        'Return JSON: { changedFiles: string[], refactorSummary: string, testsStillGreen: boolean, command: string, outputSummary: string, remainingRisks: array }.',
        '',
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        `ATTEMPT: ${attempt}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'RED RESULT:',
        JSON.stringify(red ?? {}, null, 2),
        '',
        'GREEN RESULT:',
        JSON.stringify(green ?? {}, null, 2),
        '',
        'PRIOR FEEDBACK:',
        JSON.stringify(feedback ?? null, null, 2),
      ],
    },
  },
}));

const verifyPhaseTask = defineTask('issue-797.verify-phase', ({ phase, issueContext, red, green, refactor, attempt, inputs }) => ({
  kind: 'agent',
  title: `Verify phase: ${phase.title}`,
  labels: ['issue-797', 'verification', phase.id],
  agent: {
    name: `issue-797-${phase.id}-verifier`,
    prompt: {
      role: 'verification engineer',
      task: 'Run the deterministic checks for this phase and interpret the results.',
      instructions: [
        'Run the narrow test command used by the phase and any relevant verification commands from inputs.',
        'Verify RED evidence exists before production changes in this phase.',
        'Verify GREEN evidence and refactor evidence are present.',
        'Verify no source changes drifted outside issue scope.',
        'Verify warning-only semantics remain intact.',
        'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], redEvidenceValid: boolean, warningOnlyVerified: boolean, notes: string }.',
        '',
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        `ATTEMPT: ${attempt}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'RED RESULT:',
        JSON.stringify(red ?? {}, null, 2),
        '',
        'GREEN RESULT:',
        JSON.stringify(green ?? {}, null, 2),
        '',
        'REFACTOR RESULT:',
        JSON.stringify(refactor ?? {}, null, 2),
        '',
        'VERIFICATION COMMANDS:',
        JSON.stringify(inputs?.verificationCommands ?? [], null, 2),
      ],
    },
  },
}));

const adversarialScoreTask = defineTask('issue-797.adversarial-score', ({ phase, issueContext, implementationSpec, red, green, refactor, verification, attempt, targetQualityScore }) => ({
  kind: 'agent',
  title: `Adversarial review score: ${phase.title}`,
  labels: ['issue-797', 'adversarial-review', phase.id],
  agent: {
    name: `issue-797-${phase.id}-adversarial-reviewer`,
    prompt: {
      role: 'adversarial senior code reviewer',
      task: 'Score this phase against the issue spec and try to find blocking flaws.',
      instructions: [
        'Use a code-review stance: findings first, ordered by severity, with file/line references where applicable.',
        'Score from 0 to 100. Scores below 90 must include concrete remediation instructions for the next iteration.',
        'Penalize missing RED evidence, live-network-dependent tests, false positives from missing stateReason, blocking CI behavior, automatic roadmap mutation, unbounded gh calls, poor dedupe, and broad unrelated refactors.',
        'Approve only when the phase meets or exceeds the target score and verification passed.',
        'Return JSON: { approved: boolean, score: number, blockingIssues: array, nonBlockingSuggestions: array, nextIterationInstructions: string[], rationale: string }.',
        '',
        `TARGET SCORE: ${targetQualityScore}`,
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        `ATTEMPT: ${attempt}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'RED RESULT:',
        JSON.stringify(red ?? {}, null, 2),
        '',
        'GREEN RESULT:',
        JSON.stringify(green ?? {}, null, 2),
        '',
        'REFACTOR RESULT:',
        JSON.stringify(refactor ?? {}, null, 2),
        '',
        'VERIFICATION RESULT:',
        JSON.stringify(verification ?? {}, null, 2),
      ],
    },
  },
}));

const phaseCheckpointTask = defineTask('issue-797.phase-checkpoint', ({ phase, result, issueContext, targetQualityScore, verificationCommands }) => ({
  kind: 'agent',
  title: `Checkpoint between phases: ${phase.title}`,
  labels: ['issue-797', 'checkpoint', phase.id],
  agent: {
    name: `issue-797-${phase.id}-checkpoint`,
    prompt: {
      role: 'quality gate owner',
      task: phase.verificationCheckpoint,
      instructions: [
        'Confirm this phase converged before the next phase begins.',
        'Confirm score is at least the target score and verification passed.',
        'Confirm any remaining risk is explicitly recorded and non-blocking.',
        'Return JSON: { passed: boolean, score: number, requiredFollowUps: array, commandsReviewed: array, notes: string }.',
        '',
        `TARGET SCORE: ${targetQualityScore}`,
        `PHASE: ${JSON.stringify(phase, null, 2)}`,
        '',
        'PHASE RESULT:',
        JSON.stringify(result ?? {}, null, 2),
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'VERIFICATION COMMANDS:',
        JSON.stringify(verificationCommands ?? [], null, 2),
      ],
    },
  },
}));

const finalVerificationTask = defineTask('issue-797.final-verification', ({ issueContext, implementationSpec, phaseResults, verificationCommands, targetFiles, testFiles }) => ({
  kind: 'agent',
  title: 'Final verification for issue #797 implementation',
  labels: ['issue-797', 'final-verification', 'docs', 'ci'],
  agent: {
    name: 'issue-797-final-verifier',
    prompt: {
      role: 'release verification engineer',
      task: 'Run final verification for the complete issue #797 implementation.',
      instructions: [
        'Run every command listed in verificationCommands and summarize exact pass/fail status.',
        'At minimum verify focused tests, npm run docs:freshness, npm run docs:qa when feasible, and npm run validate:processes if process artifacts changed.',
        'Inspect freshness-report.json shape for roadmap NOT_PLANNED warnings.',
        'Confirm docs:freshness exits 0 for warning-only NOT_PLANNED findings.',
        'Confirm unavailable gh/auth/network is a graceful non-blocking warning or skip.',
        'Confirm no tests depend on live GitHub issue lookups.',
        'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], artifactChecks: array, warningOnlyVerified: boolean, noLiveNetworkTests: boolean, notes: string }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'PHASE RESULTS:',
        JSON.stringify(phaseResults ?? [], null, 2),
        '',
        `VERIFICATION COMMANDS: ${JSON.stringify(verificationCommands ?? [])}`,
        `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        `TEST FILES: ${JSON.stringify(testFiles ?? [])}`,
      ],
    },
  },
}));

const finalAdversarialReviewTask = defineTask('issue-797.final-adversarial-review', ({ issueContext, reuseAudit, implementationSpec, phaseResults, finalVerification, targetQualityScore }) => ({
  kind: 'agent',
  title: 'Final adversarial review for issue #797',
  labels: ['issue-797', 'final-review', 'adversarial-review'],
  agent: {
    name: 'issue-797-final-adversarial-reviewer',
    prompt: {
      role: 'adversarial principal engineer',
      task: 'Perform the final review and score the complete implementation.',
      instructions: [
        'Findings first. Include file/line references for blocking issues.',
        'Score 0-100 against the issue spec, implementation safety, test rigor, warning-only CI behavior, and maintainability.',
        'A score below 90 means the run is not complete and must return concrete remediation.',
        'Check that issue #797 is linked in the resulting PR and that operator-facing behavior matches the issue out-of-scope constraint.',
        'Return JSON: { approved: boolean, score: number, blockingIssues: array, residualRisks: array, requiredRemediation: array, finalSummary: string }.',
        '',
        `TARGET SCORE: ${targetQualityScore}`,
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(issueContext, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(reuseAudit ?? {}, null, 2),
        '',
        'IMPLEMENTATION SPEC:',
        JSON.stringify(implementationSpec ?? {}, null, 2),
        '',
        'PHASE RESULTS:',
        JSON.stringify(phaseResults ?? [], null, 2),
        '',
        'FINAL VERIFICATION:',
        JSON.stringify(finalVerification ?? {}, null, 2),
      ],
    },
  },
}));
