/**
 * @process tasks-mux/responder-type-system
 * @process tdd-quality-convergence
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @description Brownfield TDD implementation process for issue #630: add the ResponderType system and task router to packages/tasks-mux.
 * @skill babysit plugins/babysitter/skills/babysit/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const reuseAuditTask = defineTask('issue-630/reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Phase 0: Reuse audit for ResponderType routing',
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "Reuse-audit findings (REVIEW BEFORE PROCEEDING)"',
      'printf "%s\\n" "Keywords: ResponderType, responderType, TaskRouter, routeTask, ResponderProfile, ResponderMatcher, BreakpointRouter, adapter, model, trackerBackend, capabilities"',
      'printf "\\n%s\\n" "Existing source and docs matches:"',
      'rg -n "ResponderType|responderType|TaskRouter|routeTask|ResponderProfile|ResponderMatcher|BreakpointRouter|adapter|model|trackerBackend|capabilities" packages/tasks-mux docs/agent-mux-babysitter-integrations -g "*.ts" -g "*.md" || true',
      'printf "\\n%s\\n" "Existing process-library methodology matches:"',
      'rg -n "TDD|quality gate|brownfield|runtimeCallPaths|reuse-audit|completeness|routing" /home/runner/.a5c/process-library/babysitter-repo/library -g "*.js" -g "*.md" | sed -n "1,220p" || true',
    ].join('\n'),
    cwd: args.projectRoot,
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['reuse-audit', 'phase-0', 'issue-630'],
}));

const readSpecTask = defineTask('issue-630/read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue and design specs verbatim',
  shell: {
    command: [
      'set -euo pipefail',
      'tmp="$(mktemp)"',
      'gh issue view 630 --json title,body,labels,comments > "$tmp"',
      'printf "%s\\n" "ISSUE #630 JSON:"',
      'cat "$tmp"',
      'printf "\\n%s\\n" "DESIGN DOC: docs/agent-mux-babysitter-integrations/tasks-mux-routing.md"',
      'cat docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
      'printf "\\n%s\\n" "OVERVIEW DOC: docs/agent-mux-babysitter-integrations/overview.md"',
      'cat docs/agent-mux-babysitter-integrations/overview.md',
      'rm -f "$tmp"',
    ].join('\n'),
    cwd: args.projectRoot,
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['spec', 'issue-630'],
}));

const inspectCurrentTasksMuxTask = defineTask('issue-630/inspect-current-tasks-mux', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace current tasks-mux responder and routing path',
  execution: { model: args.analysisModel },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Staff TypeScript engineer performing brownfield architecture analysis',
      task: 'Trace the current tasks-mux responder, backend, export, and routing paths before implementation.',
      context: {
        projectRoot: args.projectRoot,
        package: 'packages/tasks-mux',
        specStdout: args.specStdout,
        reuseAuditStdout: args.reuseAuditStdout,
      },
      instructions: [
        `Work inside "${args.projectRoot}".`,
        'Start from the reuse-audit findings and avoid adding duplicate infrastructure when existing tasks-mux patterns can be extended.',
        'Read the current tasks-mux source and tests before proposing changes.',
        'Record runtimeCallPaths from public entry points and existing breakpoint responder paths to the files that must change.',
        'Identify the smallest implementation surface for the ResponderType system requested by issue #630.',
        'Keep agent-mux and tracker backend execution out of scope unless the spec explicitly requires it for this issue; this issue should unblock those later integrations through types and routing contracts.',
        'Return structured JSON only.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'runtimeCallPaths', 'targetFiles', 'testPlan', 'risks'],
      properties: {
        summary: { type: 'string' },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        targetFiles: { type: 'array', items: { type: 'string' } },
        testPlan: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['analysis', 'brownfield', 'tasks-mux'],
}));

const writeResponderTypeTestsTask = defineTask('issue-630/write-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing tests for ResponderType routing',
  execution: { model: args.implementationModel },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer practicing strict ATDD/TDD',
      task: 'Author tests for issue #630 before implementation.',
      context: {
        projectRoot: args.projectRoot,
        package: 'packages/tasks-mux',
        analysis: args.analysis,
      },
      instructions: [
        `Work inside "${args.projectRoot}".`,
        'Do not read files under implementation directories after this point except existing test helpers and public type imports needed to place tests.',
        'Author tests strictly from the SPEC text below and the current package test style.',
        'Cover every deliverable and behavior stated in the SPEC block below, using the exact public names required there.',
        'Prefer targeted Vitest files under packages/tasks-mux/src/__tests__/.',
        'The tests should fail before implementation because the new exports and router do not exist yet.',
        'Return structured JSON with test files and coverage rationale.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'summary', 'coverage'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        coverage: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['tdd', 'tests', 'tasks-mux'],
}));

const shellTask = defineTask('issue-630/shell-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: args.title,
  shell: {
    command: args.command,
    cwd: args.projectRoot,
    expectedExitCode: args.expectedExitCode ?? 0,
    timeout: args.timeoutMs ?? 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['verification', args.slug],
}));

const implementResponderTypeSystemTask = defineTask('issue-630/implement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ResponderType system attempt ${args.attempt}`,
  execution: { model: args.implementationModel },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript library engineer implementing a narrowly scoped brownfield feature',
      task: 'Implement issue #630 in packages/tasks-mux so the failing tests pass without expanding scope beyond the ResponderType/router contracts.',
      context: {
        projectRoot: args.projectRoot,
        analysis: args.analysis,
        tests: args.tests,
        attempt: args.attempt,
        feedback: args.feedback || null,
      },
      instructions: [
        `Work inside "${args.projectRoot}".`,
        'Read the target files and tests before editing.',
        'Implement the requested ResponderType system in tasks-mux only.',
        'Expected source surface: packages/tasks-mux/src/types.ts, packages/tasks-mux/src/router.ts, packages/tasks-mux/src/responders/types.ts, package exports, and tests.',
        'Do not implement agent-mux execution backends, tracker API clients, SDK task intrinsic changes, or agent-platform effect resolution unless the spec-verbatim block below proves they are required for issue #630.',
        'Preserve existing human responder behavior and existing BreakpointBackend contracts.',
        'Keep public API names stable, simple, and aligned with the exact names required by the SPEC block below and the existing codebase.',
        'If this is a retry, address the feedback directly.',
        'Return structured JSON with changed files, behavior summary, and residual risks.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'remainingRisks'],
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        remainingRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['implementation', 'tasks-mux', 'issue-630'],
}));

const readArtifactsTask = defineTask('issue-630/read-artifacts', (args, taskCtx) => {
  const paths = (args.artifactPaths || []).map((path) => JSON.stringify(path)).join(' ');

  return {
    kind: 'shell',
    title: 'Read implementation artifacts verbatim',
    shell: {
      command: [
        'set -euo pipefail',
        `for path in ${paths}; do`,
        '  if [ -f "$path" ]; then',
        '    printf "\\n===== %s =====\\n" "$path"',
        '    sed -n "1,260p" "$path"',
        '  else',
        '    printf "\\n===== MISSING: %s =====\\n" "$path"',
        '  fi',
        'done',
      ].join('\n'),
      cwd: args.projectRoot,
      expectedExitCode: 0,
      timeout: 120000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['artifacts', 'verification'],
  };
});

const reviewSpecAgainstArtifactsTask = defineTask('issue-630/spec-artifact-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review spec alignment attempt ${args.attempt}`,
  execution: { model: args.reviewModel },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal TypeScript reviewer checking issue acceptance against implementation artifacts',
      task: 'Compare the issue/design spec to the produced artifacts and verification evidence.',
      context: {
        projectRoot: args.projectRoot,
        implementation: args.implementation,
        verificationResults: args.verificationResults,
        targetScore: args.targetScore,
        attempt: args.attempt,
      },
      instructions: [
        'Report every missing or incorrect acceptance criterion as an issue.',
        'Treat failing or missing shell verification as not ready.',
        'Check that implementation scope remains tasks-mux focused and does not sneak in unrelated source changes.',
        'Return structured JSON only.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'score', 'issues', 'feedback'],
      properties: {
        ready: { type: 'boolean' },
        score: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'description'],
            properties: {
              severity: { type: 'string' },
              description: { type: 'string' },
              file: { type: 'string' },
            },
          },
        },
        feedback: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['review', 'spec-alignment', 'issue-630'],
}));

export async function process(inputs, ctx) {
  const {
    projectRoot = globalThis.process.cwd(),
    targetScore = 90,
    maxAttempts = 3,
    analysisModel = 'claude-sonnet-4-6',
    implementationModel = 'claude-opus-4-6',
    reviewModel = 'claude-sonnet-4-6',
    expectedArtifactPaths = [
      'packages/tasks-mux/src/types.ts',
      'packages/tasks-mux/src/responders/types.ts',
      'packages/tasks-mux/src/router.ts',
      'packages/tasks-mux/src/index.ts',
      'packages/tasks-mux/src/__tests__/router.test.ts',
      'packages/tasks-mux/src/__tests__/shared-types-backend-interface.test.ts',
    ],
    verificationCommands = [
      {
        title: 'Targeted router and type tests',
        slug: 'targeted-tests',
        command: 'npm run test --workspace=@a5c-ai/tasks-mux -- src/__tests__/router.test.ts src/__tests__/shared-types-backend-interface.test.ts',
        timeoutMs: 600000,
      },
      {
        title: 'tasks-mux typecheck',
        slug: 'typecheck',
        command: 'npm run typecheck --workspace=@a5c-ai/tasks-mux',
        timeoutMs: 600000,
      },
      {
        title: 'tasks-mux lint',
        slug: 'lint',
        command: 'npm run lint --workspace=@a5c-ai/tasks-mux',
        timeoutMs: 600000,
      },
      {
        title: 'Full tasks-mux test suite',
        slug: 'full-tests',
        command: 'npm run test --workspace=@a5c-ai/tasks-mux',
        timeoutMs: 900000,
      },
      {
        title: 'ResponderType artifact existence and exports',
        slug: 'exports-grep',
        command: 'test -f packages/tasks-mux/src/router.ts && test -f packages/tasks-mux/src/responders/types.ts && rg -n "ResponderType|TaskRouter|routeTask|responderType" packages/tasks-mux/src/types.ts packages/tasks-mux/src/router.ts packages/tasks-mux/src/responders/types.ts packages/tasks-mux/src/index.ts',
        timeoutMs: 120000,
      },
    ],
  } = inputs;

  const reuseAudit = await ctx.task(reuseAuditTask, { projectRoot });

  const spec = await ctx.task(readSpecTask, { projectRoot });

  const analysis = await ctx.task(inspectCurrentTasksMuxTask, {
    projectRoot,
    specStdout: spec.stdout,
    reuseAuditStdout: reuseAudit.stdout,
    analysisModel,
  });

  const tests = await ctx.task(writeResponderTypeTestsTask, {
    projectRoot,
    specStdout: spec.stdout,
    analysis,
    implementationModel,
  });

  const redTestResult = await ctx.task(shellTask, {
    projectRoot,
    title: 'Confirm new tests fail before implementation',
    slug: 'red-tests',
    command: `npm run test --workspace=@a5c-ai/tasks-mux -- ${tests.testFiles.join(' ')}`,
    expectedExitCode: 1,
    timeoutMs: 600000,
  });

  let attempt = 0;
  let implementation = null;
  let review = null;
  let feedback = redTestResult?.ok === false
    ? `Initial red-test gate did not fail as expected: ${redTestResult.error || 'unknown error'}`
    : null;
  let verificationResults = [];

  while (attempt < maxAttempts) {
    attempt += 1;

    implementation = await ctx.task(implementResponderTypeSystemTask, {
      projectRoot,
      specStdout: spec.stdout,
      analysis,
      tests,
      attempt,
      feedback,
      implementationModel,
    });

    verificationResults = [];
    let allPassed = true;

    for (const check of verificationCommands) {
      const result = await ctx.task(shellTask, {
        projectRoot,
        title: check.title,
        slug: check.slug,
        command: check.command,
        timeoutMs: check.timeoutMs,
      });
      verificationResults.push({ ...check, ok: true, result });
    }

    const artifacts = await ctx.task(readArtifactsTask, {
      projectRoot,
      artifactPaths: expectedArtifactPaths,
    });

    review = await ctx.task(reviewSpecAgainstArtifactsTask, {
      projectRoot,
      specStdout: spec.stdout,
      artifactsStdout: artifacts.stdout,
      implementation,
      verificationResults,
      targetScore,
      attempt,
      reviewModel,
    });

    feedback = review.feedback || null;

    if (allPassed && review.ready && (review.score || 0) >= targetScore) {
      break;
    }
  }

  return {
    success: Boolean(review?.ready && (review?.score || 0) >= targetScore),
    issue: 630,
    processId: 'tasks-mux/responder-type-system',
    reuseAuditSummary: reuseAudit.stdout,
    runtimeCallPaths: analysis.runtimeCallPaths,
    attempts: attempt,
    tests,
    implementation,
    verificationResults,
    review,
  };
}
