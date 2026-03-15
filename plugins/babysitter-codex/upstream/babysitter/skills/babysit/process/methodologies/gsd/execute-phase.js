/**
 * @process gsd/execute-phase
 * @description GSD phase execution - parallel task execution with atomic commits
 * @inputs { phaseId: string, phaseName: string, plans: array }
 * @outputs { success: boolean, results: array, commits: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Phase Execution Process
 *
 * GSD Methodology: Execute tasks in parallel waves with fresh agent contexts
 * Each task gets atomic git commit immediately upon completion
 *
 * Agents referenced from agents/ directory:
 *   - gsd-executor: Executes task plans with atomic commits
 *   - gsd-verifier: Verifies phase completion against requirements
 *
 * Skills referenced from skills/ directory:
 *   - git-integration: Atomic git commits per task
 *   - verification-suite: Task and phase verification patterns
 *   - gsd-tools: Config and path utilities
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {array} inputs.plans - Task plans to execute
 * @param {boolean} inputs.parallelExecution - Execute tasks in parallel (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with execution results and commits
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    plans = [],
    parallelExecution = true
  } = inputs;

  const results = [];
  const commits = [];

  // ============================================================================
  // ORGANIZE TASKS INTO WAVES
  // ============================================================================

  const waves = parallelExecution
    ? organizeIntoWaves(plans)
    : plans.map(plan => [plan]); // Sequential: one plan per wave

  // ============================================================================
  // EXECUTE WAVES
  // ============================================================================

  for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
    const wave = waves[waveIndex];

    // Execute wave in parallel
    const waveResults = await ctx.parallel.all(
      wave.map(plan => async () => {
        // Execute task
        const taskResult = await ctx.task(executeTaskTask, {
          phaseId,
          plan,
          waveIndex: waveIndex + 1,
          totalWaves: waves.length
        });

        // Verify task completion
        const verifyResult = await ctx.task(verifyTaskTask, {
          phaseId,
          plan,
          taskResult
        });

        return {
          plan,
          taskResult,
          verifyResult
        };
      })
    );

    // Process wave results
    for (const waveResult of waveResults) {
      results.push(waveResult);

      if (waveResult.verifyResult.success) {
        // Create atomic git commit
        const commitResult = await ctx.task(createCommitTask, {
          phaseId,
          plan: waveResult.plan,
          taskResult: waveResult.taskResult
        });

        commits.push(commitResult);
      } else {
        // Task failed verification
        await ctx.breakpoint({
          question: `Task "${waveResult.plan.name}" failed verification. Review and decide: fix and retry, skip, or abort phase?`,
          title: `Task Verification Failed: ${waveResult.plan.name}`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/${phaseId}/tasks/${waveResult.plan.name}/SUMMARY.md`, format: 'markdown', label: 'Task Summary' },
              { path: `artifacts/${phaseId}/tasks/${waveResult.plan.name}/verification.log`, format: 'text', label: 'Verification Log' }
            ]
          }
        });

        // For now, abort on failure
        // Could enhance with retry logic
        break;
      }
    }
  }

  // ============================================================================
  // FINAL PHASE VERIFICATION
  // ============================================================================

  const allTasksSucceeded = results.every(r => r.verifyResult.success);

  if (allTasksSucceeded) {
    const phaseVerification = await ctx.task(verifyPhaseTask, {
      phaseId,
      phaseName,
      requirements: inputs.requirements,
      results
    });

    if (!phaseVerification.verified) {
      await ctx.breakpoint({
        question: `All tasks completed but phase verification failed. Review issues and decide next steps.`,
        title: `Phase Verification Failed: ${phaseName}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/${phaseId}-VERIFICATION.md`, format: 'markdown', label: 'Verification Report' }
          ]
        }
      });
    }
  }

  return {
    success: allTasksSucceeded,
    phaseId,
    phaseName,
    tasksExecuted: results.length,
    tasksSucceeded: results.filter(r => r.verifyResult.success).length,
    results,
    commits,
    artifacts: {
      taskSummaries: `artifacts/${phaseId}/tasks/`,
      verification: `artifacts/${phaseId}-VERIFICATION.md`
    },
    metadata: {
      processId: 'gsd/execute-phase',
      timestamp: ctx.now()
    }
  };
}

/**
 * Organize plans into parallel-executable waves based on dependencies
 */
function organizeIntoWaves(plans) {
  // Simple implementation: all independent tasks in one wave
  // Could be enhanced with dependency analysis
  return [plans];
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const executeTaskTask = defineTask('execute-task', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.plan.name}`,
  description: `Wave ${args.waveIndex}/${args.totalWaves}`,

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'senior software engineer with fresh context',
      task: 'Execute the task plan completely and document what changed',
      context: {
        phaseId: args.phaseId,
        plan: args.plan
      },
      instructions: [
        'Read and understand the task plan completely',
        'Execute all actions specified in <action>',
        'Modify/create files listed in <files>',
        'Follow best practices and coding standards',
        'Add inline comments only where logic is non-obvious',
        'Create SUMMARY.md documenting: what changed, files modified, decisions made',
        'DO NOT proceed to verification - that is a separate step',
        'Return list of files created/modified'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string), decisions (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'execution', args.plan.name]
}));

export const verifyTaskTask = defineTask('verify-task', (args, taskCtx) => ({
  kind: 'node',
  title: `Verify: ${args.plan.name}`,
  description: 'Run verification command from plan',

  node: {
    entry: '.a5c/orchestrator_scripts/gsd/verify-task.js',
    args: [
      '--phase-id', args.phaseId,
      '--plan', JSON.stringify(args.plan),
      '--task-result', JSON.stringify(args.taskResult),
      '--output', `tasks/${taskCtx.effectId}/result.json`
    ]
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'execution', 'verification', args.plan.name]
}));

export const createCommitTask = defineTask('create-commit', (args, taskCtx) => ({
  kind: 'shell',
  title: `Commit: ${args.plan.name}`,
  description: 'Create atomic git commit for task',

  shell: {
    command: `git add ${args.taskResult.filesCreated.concat(args.taskResult.filesModified).join(' ')} && git commit -m "${args.plan.name}\n\n${args.taskResult.summary}\n\nPhase: ${args.phaseId}"`
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'execution', 'commit']
}));

export const verifyPhaseTask = defineTask('verify-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify phase: ${args.phaseName}`,
  description: 'Verify all requirements satisfied',

  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'senior QA engineer',
      task: 'Verify phase completion against requirements',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        requirements: args.requirements,
        results: args.results
      },
      instructions: [
        'Check each requirement against execution results',
        'Verify acceptance criteria are met',
        'Test that code runs without errors',
        'Check that deliverables exist',
        'Identify any gaps or issues',
        'Provide verification report'
      ],
      outputFormat: 'JSON with verified (boolean), requirementsCovered (array), issues (array), verificationMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'requirementsCovered'],
      properties: {
        verified: { type: 'boolean' },
        requirementsCovered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              satisfied: { type: 'boolean' },
              evidence: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        verificationMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'execution', 'phase-verification']
}));
