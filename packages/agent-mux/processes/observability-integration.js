/**
 * @process agent-mux/observability-integration
 * @description Implement the logging and OpenTelemetry integration backlog item with phased delivery, verification, and review.
 * @skill babysit plugins/babysitter/skills/babysit/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeObservabilityTask = defineTask('analyze-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze observability backlog item and current implementation',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Staff engineer auditing a partially implemented observability subsystem',
      task: 'Inspect the current repo state and turn the observability todo into an execution-ready rollout plan.',
      context: {
        projectRoot: args.projectRoot,
        todoFile: args.todoFile,
        todoText: args.todoText,
      },
      instructions: [
        `Read the todo file at "${args.todoFile}" and focus on this item: "${args.todoText}".`,
        `Inspect the repository under "${args.projectRoot}", especially packages/agent-mux/observability, packages/agent-mux/core, packages/agent-mux/cli, packages/agent-mux/tui, and any docs or tests referencing logging or telemetry.`,
        'Identify what already exists, what is placeholder or incomplete, and where runtime integration points are missing.',
        'Produce a phased plan that preserves the todo scope: structured logging, OpenTelemetry tracing/metrics, runtime integration, and monitoring/debugging value.',
        'Each phase must include acceptance criteria, affected paths, and verification commands.',
        'Return structured JSON only.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'currentState', 'phases'],
      properties: {
        summary: { type: 'string' },
        currentState: {
          type: 'object',
          required: ['existingPieces', 'gaps'],
          properties: {
            existingPieces: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } },
          },
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'goal', 'acceptanceCriteria'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              goal: { type: 'string' },
              affectedPaths: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              verificationCommands: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['planning', 'observability'],
}));

const implementObservabilityPhaseTask = defineTask('implement-observability-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement observability phase: ${args.phase.title}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer implementing observability infrastructure',
      task: `Implement phase "${args.phase.title}" for the observability backlog item.`,
      context: {
        projectRoot: args.projectRoot,
        todoFile: args.todoFile,
        todoText: args.todoText,
        planSummary: args.planSummary,
        phase: args.phase,
        attempt: args.attempt,
        feedback: args.feedback || null,
      },
      instructions: [
        `Work in "${args.projectRoot}".`,
        `Keep the implementation aligned with the todo text: "${args.todoText}".`,
        'Read the currently relevant source, tests, and docs before changing code.',
        'Actually implement the phase, including tests and docs updates where appropriate.',
        'Preserve the repo’s existing architecture and package boundaries.',
        'If this is a retry, address the supplied feedback directly.',
        'Do not mark the todo item done yet.',
        'Return JSON with changed files, summary, and any unresolved blockers.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'blockers'],
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        blockers: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['implementation', 'observability', args.phase.id],
}));

const verifyObservabilityTask = defineTask('verify-observability', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify ${args.phaseId}: ${args.label}`,
  shell: {
    command: args.command,
    cwd: args.projectRoot,
    expectedExitCode: 0,
    timeout: args.timeout || 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['verification', 'observability', args.phaseId],
}));

const reviewObservabilityPhaseTask = defineTask('review-observability-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review observability phase: ${args.phase.title}`,
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal engineer reviewing observability delivery quality',
      task: `Review phase "${args.phase.title}" against its acceptance criteria and verification evidence.`,
      context: {
        projectRoot: args.projectRoot,
        todoText: args.todoText,
        phase: args.phase,
        implementation: args.implementation,
        verificationResults: args.verificationResults,
        targetScore: args.targetScore,
      },
      instructions: [
        `Read the affected code under "${args.projectRoot}" relevant to this phase.`,
        'Check whether logging and telemetry behavior now matches the phase acceptance criteria.',
        'Treat missing, failing, or weak verification evidence as a real issue.',
        'Return a score, concrete issues, and implementation feedback for the next iteration if needed.',
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
  labels: ['review', 'observability', args.phase.id],
}));

const markObservabilityTodoDoneTask = defineTask('mark-observability-todo-done', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mark observability todo item complete',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Repository maintainer keeping the todo file accurate',
      task: 'Update the todo file to mark the observability item complete after successful delivery.',
      context: {
        todoFile: args.todoFile,
        todoText: args.todoText,
      },
      instructions: [
        `Edit "${args.todoFile}" only as needed to mark the exact observability item done.`,
        'Preserve formatting and surrounding backlog content.',
        'Return JSON with the updated line and a short summary.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedLine', 'summary'],
      properties: {
        updatedLine: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['todo', 'observability'],
}));

export async function process(inputs, ctx) {
  const {
    projectRoot = 'C:/work/agent-mux',
    todoFile = 'C:/work/agent-mux/todos.md',
    todoText = 'Logging and opentelemetry integration: implement logging and telemetry in the agent-mux, to track the usage, performance, and errors of the system. this can be done using a tool like Winston or Pino for logging, and OpenTelemetry for telemetry. make sure to log important events and errors, and to collect relevant metrics for monitoring and debugging purposes.',
    targetScore = 90,
    maxIterationsPerPhase = 3,
    defaultVerificationCommands = ['npm run build', 'npm test', 'npm run lint'],
  } = inputs;

  const analysis = await ctx.task(analyzeObservabilityTask, {
    projectRoot,
    todoFile,
    todoText,
  });

  await ctx.breakpoint({
    title: 'Observability plan review',
    question: `The observability rollout plan is ready with ${analysis.phases.length} phases. Review the plan and approve implementation.`,
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['observability-plan'],
  });

  const phaseResults = [];

  for (const phase of analysis.phases) {
    let attempt = 0;
    let feedback = null;
    let score = 0;
    let implementation = null;
    let review = null;
    let verificationResults = [];

    while (attempt < maxIterationsPerPhase) {
      attempt += 1;

      implementation = await ctx.task(implementObservabilityPhaseTask, {
        projectRoot,
        todoFile,
        todoText,
        planSummary: analysis.summary,
        phase,
        attempt,
        feedback,
      });

      verificationResults = [];
      const commands = phase.verificationCommands?.length
        ? phase.verificationCommands
        : defaultVerificationCommands;

      let failedVerification = false;

      for (const command of commands) {
        try {
          const result = await ctx.task(verifyObservabilityTask, {
            phaseId: phase.id,
            label: command,
            command,
            projectRoot,
          });
          verificationResults.push({ command, ok: true, result });
        } catch (error) {
          verificationResults.push({
            command,
            ok: false,
            error: error?.message || String(error),
          });
          failedVerification = true;
        }
      }

      review = await ctx.task(reviewObservabilityPhaseTask, {
        projectRoot,
        todoText,
        phase,
        implementation,
        verificationResults,
        targetScore,
      });

      score = review.score || 0;
      feedback = review.feedback || null;

      if (!failedVerification && review.ready && score >= targetScore) {
        break;
      }
    }

    phaseResults.push({
      phaseId: phase.id,
      title: phase.title,
      score,
      attempt,
      implementation,
      review,
      verificationResults,
      completed: Boolean(review?.ready && score >= targetScore),
    });

    if (!review?.ready || score < targetScore) {
      await ctx.breakpoint({
        title: `Observability phase blocked: ${phase.title}`,
        question: `Phase "${phase.title}" stopped below the target score (${score}/${targetScore}). Review before continuing.`,
        options: ['Approve current state', 'Stop for rework'],
        expert: 'owner',
        tags: ['observability-phase', phase.id],
        attempt,
      });
    }
  }

  await ctx.task(markObservabilityTodoDoneTask, {
    todoFile,
    todoText,
  });

  await ctx.breakpoint({
    title: 'Observability final review',
    question: 'The observability item is implemented, verified, and marked complete. Review the final state and approve closing the run.',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['observability-final'],
  });

  return {
    success: true,
    todoText,
    analysis,
    phaseResults,
  };
}
