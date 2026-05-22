/**
 * @process agent-mux/sessions-view-installed-agents-bugfix
 * @description Diagnose and fix the Sessions view bug where discovered installed agents do not surface sessions, using analysis, implementation, deterministic verification, and review convergence.
 * @skill babysit plugins/babysitter/skills/babysit/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeSessionsBugTask = defineTask('analyze-sessions-bug', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze discovered-agent sessions visibility bug',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Staff engineer debugging agent-mux session discovery and TUI behavior',
      task: 'Inspect the current implementation and determine why sessions are not appearing for discovered installed agents such as claude and codex.',
      context: {
        projectRoot: args.projectRoot,
        bugDescription: args.bugDescription,
      },
      instructions: [
        `Work inside "${args.projectRoot}".`,
        'Read the TUI Sessions view, session manager, and relevant adapter session-discovery code before drawing conclusions.',
        'Use the concrete bug report as the target behavior and identify the most likely root cause or causes.',
        'Focus on fixes that preserve current architecture and avoid broad refactors.',
        'Propose deterministic verification commands that prove the fix for both the session manager and the Sessions view path.',
        'Return structured JSON only.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'rootCauses', 'affectedFiles', 'implementationPlan', 'verificationCommands'],
      properties: {
        summary: { type: 'string' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        implementationPlan: { type: 'array', items: { type: 'string' } },
        verificationCommands: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['analysis', 'sessions', 'tui'],
}));

const implementSessionsBugfixTask = defineTask('implement-sessions-bugfix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement sessions bugfix attempt ${args.attempt}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer fixing session discovery and TUI listing behavior',
      task: 'Implement the sessions visibility fix and any targeted tests required to prove it.',
      context: {
        projectRoot: args.projectRoot,
        bugDescription: args.bugDescription,
        analysis: args.analysis,
        attempt: args.attempt,
        feedback: args.feedback || null,
      },
      instructions: [
        `Work inside "${args.projectRoot}".`,
        'Read the relevant source and tests before changing code.',
        'Implement the fix, not just diagnostics.',
        'Preserve existing user-facing behavior except where the bug requires change.',
        'Add or update targeted tests for the failure mode when appropriate.',
        'If this is a retry, address the supplied feedback directly.',
        'Return structured JSON with changed files, summary, and remaining risks.',
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
  labels: ['implementation', 'sessions', 'tui'],
}));

const verifySessionsBugfixTask = defineTask('verify-sessions-bugfix', (args, taskCtx) => ({
  kind: 'shell',
  title: args.label,
  shell: {
    command: args.command,
    cwd: args.projectRoot,
    expectedExitCode: 0,
    timeout: args.timeoutMs || 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['verification', 'sessions', args.slug],
}));

const reviewSessionsBugfixTask = defineTask('review-sessions-bugfix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review sessions bugfix attempt ${args.attempt}`,
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal engineer reviewing the quality of a targeted bugfix',
      task: 'Review whether the implemented fix and verification evidence are sufficient to close the sessions visibility bug.',
      context: {
        projectRoot: args.projectRoot,
        bugDescription: args.bugDescription,
        analysis: args.analysis,
        implementation: args.implementation,
        verificationResults: args.verificationResults,
        targetScore: args.targetScore,
        attempt: args.attempt,
      },
      instructions: [
        `Read the affected code under "${args.projectRoot}".`,
        'Treat missing or failing verification evidence as a real issue.',
        'Check that the fix directly addresses the reported sessions-view behavior for discovered installed agents.',
        'Return structured JSON with score, readiness, issues, and refinement feedback.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'ready', 'issues', 'feedback'],
      properties: {
        score: { type: 'number' },
        ready: { type: 'boolean' },
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
  labels: ['review', 'sessions', 'tui'],
}));

export async function process(inputs, ctx) {
  const {
    projectRoot = 'C:/work/agent-mux',
    bugDescription = 'Sessions are not showing in the Sessions view for discovered installed agents such as claude and codex.',
    targetScore = 90,
    maxAttempts = 2,
    verificationCommands = [
      'npm exec -- vitest run packages/agent-mux/core/tests/session-manager.test.ts packages/agent-mux/tui/tests/sessions-view.test.tsx',
      'npm run build -- --pretty false',
    ],
  } = inputs;

  const analysis = await ctx.task(analyzeSessionsBugTask, {
    projectRoot,
    bugDescription,
  });

  let attempt = 0;
  let implementation = null;
  let review = null;
  let feedback = null;
  let verificationResults = [];

  while (attempt < maxAttempts) {
    attempt += 1;

    implementation = await ctx.task(implementSessionsBugfixTask, {
      projectRoot,
      bugDescription,
      analysis,
      attempt,
      feedback,
    });

    verificationResults = [];
    let allPassed = true;
    const commands = analysis.verificationCommands?.length
      ? analysis.verificationCommands
      : verificationCommands;

    for (const command of commands) {
      try {
        const result = await ctx.task(verifySessionsBugfixTask, {
          projectRoot,
          command,
          label: `Verify: ${command}`,
          slug: `attempt-${attempt}`,
        });
        verificationResults.push({ command, ok: true, result });
      } catch (error) {
        allPassed = false;
        verificationResults.push({
          command,
          ok: false,
          error: error?.message || String(error),
        });
      }
    }

    review = await ctx.task(reviewSessionsBugfixTask, {
      projectRoot,
      bugDescription,
      analysis,
      implementation,
      verificationResults,
      targetScore,
      attempt,
    });

    feedback = review.feedback || null;

    if (allPassed && review.ready && (review.score || 0) >= targetScore) {
      break;
    }
  }

  return {
    success: Boolean(review?.ready && (review?.score || 0) >= targetScore),
    bugDescription,
    analysis,
    attempt,
    implementation,
    verificationResults,
    review,
  };
}
