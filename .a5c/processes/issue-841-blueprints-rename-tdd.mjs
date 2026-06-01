/**
 * @process repo/issue-841-blueprints-rename-tdd
 * @process tdd-quality-convergence
 * @process processes/shared/tdd-triplet
 * @process methodologies/gsd/iterative-convergence
 * @process methodologies/planning-with-files/planning-orchestrator
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @description Spec-driven TDD convergence plan for issue #841: rename SDK babysitter plugins to blueprints while preserving deprecated plugin aliases.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetQuality: number, maxIterationsPerPhase: number, phases: array, finalVerificationCommands: string[] }
 * @outputs { success: boolean, phaseResults: array, finalVerification: object, finalReview: object, runtimeCallPaths: array }
 *
 * References used while authoring:
 * - docs/blueprints-rename/README.md
 * - docs/agent-reference/process-authoring.md
 * - tdd-quality-convergence.js
 * - processes/shared/tdd-triplet.js
 * - methodologies/gsd/iterative-convergence.js
 * - methodologies/planning-with-files/planning-orchestrator.js
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - SDK plugin implementation already exists under packages/sdk/src/plugins/, with registry, marketplace, path, migration, package-reader modules and focused tests under packages/sdk/src/plugins/__tests__/.
 * - CLI plugin command dispatch already exists in packages/sdk/src/cli/main/program.ts, packages/sdk/src/cli/main/dispatchRunSession.ts, packages/sdk/src/cli/main/argFlagParsers.ts, packages/sdk/src/cli/main/argPositionals.ts, packages/sdk/src/cli/main/usage.ts, and packages/sdk/src/cli/commands/plugin/**.
 * - Marketplace package data already exists under plugins/a5c/marketplace/ and should be moved/renamed rather than regenerated from scratch.
 * - Existing documentation surfaces include docs/plugins.md and docs/plugins/**; docs/blueprints-rename/README.md requires splitting babysitter blueprint docs from agent plugin docs.
 * - Agent plugin systems are separate and must stay named plugins: packages/extension-mux/**, packages/hooks-mux/**, .claude/plugins/**, CLAUDE_PLUGIN_ROOT, PI_PLUGIN_ROOT, and agent-mux plugin UI internals.
 * - Relevant process-library patterns found: tdd-quality-convergence.js, shared/tdd-triplet.js, gsd/iterative-convergence.js, and planning-with-files.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const targetQuality = inputs.targetQuality ?? 90;
  const maxIterations = inputs.maxIterationsPerPhase ?? 4;
  const phases = inputs.phases ?? [];
  const phaseResults = [];

  const spec = await ctx.task(readSpecTask, inputs, {
    key: 'issue-841.read-spec',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    specStdout: spec.stdout,
  }, {
    key: 'issue-841.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimePathsTask, {
    inputs,
    specStdout: spec.stdout,
    reuseAudit,
  }, {
    key: 'issue-841.runtime-trace',
  });

  for (const phase of phases) {
    let score = 0;
    let review = null;
    let implementation = null;
    let refactor = null;
    let verification = null;
    const attempts = [];

    for (let iteration = 1; iteration <= maxIterations && score < targetQuality; iteration += 1) {
      const tests = await ctx.task(writeFailingTestsTask, {
        inputs,
        phase,
        iteration,
        specStdout: spec.stdout,
        reuseAudit,
        runtimeTrace,
        previousReview: review,
      }, {
        key: `issue-841.${phase.id}.tests.${iteration}`,
      });

      const redVerification = await ctx.task(runShellCommandTask, {
        title: `[${phase.id}] RED: prove new tests fail first`,
        command: tests.redCommand || phase.redCommand || phase.testCommand,
        expectedExitCode: phase.redExpectedExitCode ?? 1,
        timeout: phase.testTimeout ?? 180000,
      }, {
        key: `issue-841.${phase.id}.red.${iteration}`,
      });

      implementation = await ctx.task(implementMinimumTask, {
        inputs,
        phase,
        iteration,
        specStdout: spec.stdout,
        reuseAudit,
        runtimeTrace,
        tests,
        redVerification,
        previousReview: review,
      }, {
        key: `issue-841.${phase.id}.green-implementation.${iteration}`,
      });

      const greenVerification = await ctx.task(runShellCommandTask, {
        title: `[${phase.id}] GREEN: phase tests pass`,
        command: tests.greenCommand || phase.testCommand,
        expectedExitCode: 0,
        timeout: phase.testTimeout ?? 180000,
      }, {
        key: `issue-841.${phase.id}.green.${iteration}`,
      });

      refactor = await ctx.task(refactorPhaseTask, {
        inputs,
        phase,
        iteration,
        specStdout: spec.stdout,
        reuseAudit,
        runtimeTrace,
        implementation,
        greenVerification,
        previousReview: review,
      }, {
        key: `issue-841.${phase.id}.refactor.${iteration}`,
      });

      verification = await ctx.task(runShellCommandTask, {
        title: `[${phase.id}] verification checkpoint`,
        command: phase.verificationCommand,
        expectedExitCode: 0,
        timeout: phase.verificationTimeout ?? 300000,
      }, {
        key: `issue-841.${phase.id}.checkpoint.${iteration}`,
      });

      const artifacts = await ctx.task(readArtifactsTask, {
        baseBranch: inputs.baseBranch,
        phase,
      }, {
        key: `issue-841.${phase.id}.artifacts.${iteration}`,
      });

      review = await ctx.task(adversarialReviewTask, {
        inputs,
        phase,
        iteration,
        targetQuality,
        specStdout: spec.stdout,
        artifactsStdout: artifacts.stdout,
        reuseAudit,
        runtimeTrace,
        tests,
        implementation,
        refactor,
        verification,
        previousReview: review,
      }, {
        key: `issue-841.${phase.id}.adversarial-review.${iteration}`,
      });

      score = Number(review.score ?? 0);
      attempts.push({
        iteration,
        score,
        tests,
        redVerification,
        implementation,
        greenVerification,
        refactor,
        verification,
        review,
      });
    }

    phaseResults.push({
      phaseId: phase.id,
      score,
      converged: score >= targetQuality,
      attempts,
      finalReview: review,
    });

    if (score < targetQuality) {
      await ctx.breakpoint({
        title: `Issue #841 phase ${phase.id} did not converge`,
        question: `Phase "${phase.name}" stopped at ${score}/${targetQuality}. Review the adversarial findings and choose whether to continue with an added iteration budget or pause for maintainer guidance.`,
        options: ['Continue with more iterations', 'Pause for maintainer guidance'],
        expert: 'maintainer',
        tags: ['issue-841', 'blueprints', 'quality-gate'],
        context: {
          runId: ctx.runId,
          phase,
          score,
          targetQuality,
          attempts: attempts.length,
          review,
        },
      });
    }
  }

  const finalVerification = await ctx.task(runShellCommandTask, {
    title: 'Issue #841 final deterministic verification',
    command: (inputs.finalVerificationCommands ?? []).join(' && '),
    expectedExitCode: 0,
    timeout: inputs.finalVerificationTimeout ?? 600000,
  }, {
    key: 'issue-841.final-verification',
  });

  const finalArtifacts = await ctx.task(readArtifactsTask, {
    baseBranch: inputs.baseBranch,
    phase: { id: 'final', name: 'Final implementation' },
  }, {
    key: 'issue-841.final-artifacts',
  });

  const finalReview = await ctx.task(finalAcceptanceReviewTask, {
    inputs,
    targetQuality,
    specStdout: spec.stdout,
    artifactsStdout: finalArtifacts.stdout,
    reuseAudit,
    runtimeTrace,
    phaseResults,
    finalVerification,
  }, {
    key: 'issue-841.final-acceptance-review',
  });

  return {
    success: phaseResults.every((phase) => phase.converged) && finalReview.passed === true,
    targetQuality,
    phaseResults,
    finalVerification,
    finalReview,
    runtimeCallPaths: runtimeTrace.runtimeCallPaths ?? [],
    reuseAudit,
  };
}

export const readSpecTask = defineTask('issue-841.read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #841 and blueprint rename spec at run time',
  labels: ['issue-841', 'spec', 'drift-defense'],
  shell: {
    command: [
      'mkdir -p .a5c/artifacts/issue-841',
      '{',
      `echo '# GitHub issue ${args.issueNumber}'`,
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      "echo ''",
      "echo '# docs/blueprints-rename/README.md'",
      'cat docs/blueprints-rename/README.md',
      '} | tee .a5c/artifacts/issue-841/spec.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-841.reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Phase 0 reuse audit for plugins to blueprints rename',
  labels: ['issue-841', 'reuse-audit'],
  shell: {
    command: [
      'mkdir -p .a5c/artifacts/issue-841',
      '{',
      "echo '## Reuse-audit findings (REVIEW BEFORE PROCEEDING)'",
      "echo ''",
      "echo '### SDK plugin and blueprint source paths'",
      "rg --files packages/sdk/src | rg '(^|/)(plugins|blueprints)(/|$)' || true",
      "echo ''",
      "echo '### CLI plugin command surfaces'",
      "rg -n 'plugin:|plugins:|blueprints:|harness:install-plugin|pluginName|pluginScope|pluginVersion' packages/sdk/src/cli packages/sdk/src/plugins scripts package.json || true",
      "echo ''",
      "echo '### Marketplace and package data surfaces'",
      "rg --files | rg '(^|/)(plugins|blueprints)/a5c/marketplace|marketplace.json|plugin-registry|plugins.md|docs/plugins' || true",
      "echo ''",
      "echo '### Environment variables and agent-plugin exclusions'",
      "rg -n 'BABYSITTER_(PLUGIN|BLUEPRINT)|CLAUDE_PLUGIN|PI_PLUGIN|PLUGIN_ROOT|packages/(extension-mux|hooks-mux)' packages docs plugins scripts .agents .codex || true",
      '} | tee .a5c/artifacts/issue-841/reuse-audit.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimePathsTask = defineTask('issue-841.trace-runtime-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live SDK and CLI paths before implementation',
  labels: ['issue-841', 'runtime-trace', 'planning'],
  agent: {
    name: 'sdk-refactor-architect',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Trace the live execution and import paths affected by the rename before any implementation. Do not edit files.',
      instructions: [
        'Use the SPEC block and reuse audit as source material.',
        'Trace runtimeCallPaths from CLI entrypoints through parser, dispatch, command handlers, SDK modules, registry/marketplace storage, and docs/generated command surfaces.',
        'Separate babysitter blueprint surfaces from agent plugin surfaces. Agent plugins must remain named plugins.',
        'Identify files that should be moved, files that should only receive compatibility aliases, and files that should not be touched.',
        'Return JSON: { runtimeCallPaths, implementationBoundaries, noTouchPaths, compatibilityRequirements, testTargets, risks, openQuestions }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'REUSE AUDIT (verbatim):',
        '---',
        args.reuseAudit.stdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'implementationBoundaries', 'noTouchPaths', 'compatibilityRequirements', 'testTargets'],
      properties: {
        runtimeCallPaths: { type: 'array' },
        implementationBoundaries: { type: 'array' },
        noTouchPaths: { type: 'array' },
        compatibilityRequirements: { type: 'array' },
        testTargets: { type: 'array' },
        risks: { type: 'array' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const writeFailingTestsTask = defineTask('issue-841.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `[${args.phase.id}] Write failing tests first`,
  labels: ['issue-841', 'tdd', 'red', args.phase.id],
  agent: {
    name: 'sdk-test-author',
    prompt: {
      role: 'strict TDD test author',
      task: 'Write or update tests for this phase before implementation, then return the exact commands to prove they fail red and pass green.',
      context: {
        phase: args.phase,
        iteration: args.iteration,
        targetTestFiles: args.phase.targetTestFiles,
        previousReview: args.previousReview,
      },
      instructions: [
        'Do not edit implementation files in this task.',
        'Prefer existing SDK test style and colocated tests. Extend existing tests when that is clearer than creating new files.',
        'Tests must be derived from the SPEC block, current phase, and runtime trace. Do not redefine acceptance criteria to match existing implementation.',
        'For each new or changed assertion, name or comment it so a reviewer can map it back to a specific spec line or section.',
        'The red command must fail because the requested behavior is missing, not because of syntax, imports, snapshots, or intentionally broken setup.',
        'Return JSON: { testFiles, redCommand, greenCommand, summary, criteriaCovered, expectedRedFailure }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'redCommand', 'greenCommand', 'summary', 'criteriaCovered', 'expectedRedFailure'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        redCommand: { type: 'string' },
        greenCommand: { type: 'string' },
        summary: { type: 'string' },
        criteriaCovered: { type: 'array' },
        expectedRedFailure: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMinimumTask = defineTask('issue-841.implement-minimum', (args, taskCtx) => ({
  kind: 'agent',
  title: `[${args.phase.id}] Implement minimum code to pass`,
  labels: ['issue-841', 'tdd', 'green', args.phase.id],
  agent: {
    name: 'sdk-implementation-engineer',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: 'Implement the minimum production changes needed to pass the phase tests. Keep the change inside traced live paths and explicit phase scope.',
      context: {
        phase: args.phase,
        iteration: args.iteration,
        runtimeTrace: args.runtimeTrace,
        reuseAudit: args.reuseAudit,
        tests: args.tests,
        redVerification: args.redVerification,
        previousReview: args.previousReview,
      },
      instructions: [
        'Use git mv for file/directory renames where appropriate so history is preserved.',
        'Preserve deprecated plugin command aliases and compatibility reads exactly as required by the spec.',
        'Do not rename or change agent plugin systems, harness plugin environment variables, hooks-mux, extension-mux, or .claude/plugins behavior.',
        'Do not broaden scope beyond this phase just to make later phases easier.',
        'Return JSON: { filesModified, filesMoved, filesCreated, summary, compatibilityNotes, risks }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        filesMoved: { type: 'array' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        compatibilityNotes: { type: 'array' },
        risks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const refactorPhaseTask = defineTask('issue-841.refactor-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `[${args.phase.id}] Refactor after green`,
  labels: ['issue-841', 'tdd', 'refactor', args.phase.id],
  agent: {
    name: 'sdk-refactorer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Refactor only after the phase is green. Improve naming, imports, duplication, and documentation consistency without changing behavior.',
      context: {
        phase: args.phase,
        iteration: args.iteration,
        implementation: args.implementation,
        greenVerification: args.greenVerification,
        runtimeTrace: args.runtimeTrace,
        previousReview: args.previousReview,
      },
      instructions: [
        'Keep refactors scoped to files touched for this phase or directly required import updates.',
        'Remove obsolete plugin terminology in babysitter blueprint code, but keep deprecated alias names where compatibility requires them.',
        'Leave agent plugin terminology alone.',
        'Return JSON: { filesModified, summary, behaviorPreserved, followUps }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary', 'behaviorPreserved'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        behaviorPreserved: { type: 'boolean' },
        followUps: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runShellCommandTask = defineTask('issue-841.run-shell-command', (args, taskCtx) => ({
  kind: 'shell',
  title: args.title,
  labels: ['issue-841', 'verification'],
  shell: {
    command: args.command,
    expectedExitCode: args.expectedExitCode,
    timeout: args.timeout ?? 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readArtifactsTask = defineTask('issue-841.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: `[${args.phase.id}] Read artifacts for spec comparison`,
  labels: ['issue-841', 'artifacts', args.phase.id],
  shell: {
    command: [
      'mkdir -p .a5c/artifacts/issue-841',
      '{',
      `echo '# Phase: ${args.phase.name}'`,
      "echo '## git status'",
      'git status --short',
      "echo '## changed files'",
      `git diff --name-only origin/${args.baseBranch}...HEAD || git diff --name-only`,
      "echo '## diff stat'",
      `git diff --stat origin/${args.baseBranch}...HEAD || git diff --stat`,
      "echo '## plugin/blueprint references in SDK CLI and SDK modules'",
      "rg -n 'plugin|blueprint|plugins:|blueprints:|plugin:|blueprint:' packages/sdk/src docs/plugins.md docs/plugins docs/blueprints.md plugins/a5c blueprints plugins/babysitter plugins/babysitter-unified 2>/dev/null || true",
      '} | tee .a5c/artifacts/issue-841/artifacts-' + args.phase.id + '.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const adversarialReviewTask = defineTask('issue-841.adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `[${args.phase.id}] Adversarial review and quality score`,
  labels: ['issue-841', 'adversarial-review', args.phase.id],
  agent: {
    name: 'adversarial-sdk-reviewer',
    prompt: {
      role: 'adversarial senior reviewer for SDK refactors',
      task: 'Score the phase 0-100. Fail hard for drift from the spec, missing backward compatibility, touching agent plugin systems, weak tests, or cosmetic-only rename work.',
      context: {
        phase: args.phase,
        iteration: args.iteration,
        targetQuality: args.targetQuality,
        tests: args.tests,
        implementation: args.implementation,
        refactor: args.refactor,
        verification: args.verification,
        runtimeTrace: args.runtimeTrace,
        previousReview: args.previousReview,
      },
      instructions: [
        'Return JSON: { score, passed, blockingIssues, nonBlockingIssues, evidence, requiredNextIterationWork }.',
        'Set passed true only when score >= targetQuality and all deterministic verification for this phase passed.',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed', 'blockingIssues', 'requiredNextIterationWork'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        blockingIssues: { type: 'array' },
        nonBlockingIssues: { type: 'array' },
        evidence: { type: 'array' },
        requiredNextIterationWork: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceReviewTask = defineTask('issue-841.final-acceptance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final spec acceptance review for issue #841',
  labels: ['issue-841', 'final-review'],
  agent: {
    name: 'final-sdk-acceptance-reviewer',
    prompt: {
      role: 'release-blocking acceptance reviewer',
      task: 'Perform the final issue acceptance review. The implementation is acceptable only if every phase converged, final verification passed, aliases are deprecated but working, and agent plugins remain untouched.',
      context: {
        targetQuality: args.targetQuality,
        phaseResults: args.phaseResults,
        reuseAudit: args.reuseAudit,
        runtimeTrace: args.runtimeTrace,
        finalVerification: args.finalVerification,
      },
      instructions: [
        'Return JSON: { passed, score, missingCriteria, regressionRisks, noTouchViolations, aliasCompatibility, verificationSummary, releaseNotes }.',
        'Require score >= targetQuality and no missing criteria for passed=true.',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'missingCriteria', 'noTouchViolations', 'verificationSummary'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        missingCriteria: { type: 'array' },
        regressionRisks: { type: 'array' },
        noTouchViolations: { type: 'array' },
        aliasCompatibility: { type: 'array' },
        verificationSummary: { type: 'string' },
        releaseNotes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
