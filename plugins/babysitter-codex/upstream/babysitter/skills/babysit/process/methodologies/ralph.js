/**
 * @process methodologies/ralph
 * @description Ralph Wiggum Loop - Simple iterative execution until DONE signal
 * @inputs { task: string, maxIterations: number }
 * @outputs { success: boolean, iterations: number, results: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Ralph Wiggum Loop Process
 *
 * Named after Ralph Wiggum from The Simpsons - a simple, persistent loop
 * that keeps trying until it succeeds or reaches max iterations.
 *
 * Methodology: Execute → Check if DONE → If not, iterate again
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to execute iteratively
 * @param {number} inputs.maxIterations - Maximum iterations (default: 10)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    task,
    maxIterations = 10
  } = inputs;

  let iteration = 0;
  let done = false;
  const results = [];

  // The Ralph Loop: Keep going until DONE or max iterations
  while (!done && iteration < maxIterations) {
    iteration++;
    // Execute the task
    const result = await ctx.task(agentExecuteTask, {
      task,
      iteration,
      maxIterations,
      previousResults: results
    });

    results.push({
      iteration,
      result,
      timestamp: ctx.now()
    });

    // Check if we're done
    done = result.done || result.status === 'DONE' || result.status === 'SUCCESS';

    if (!done) {


      // Optional: Breakpoint for review after each iteration
      if (iteration < maxIterations && inputs.reviewEachIteration) {
        await ctx.breakpoint({
          question: `Iteration ${iteration} complete. Status: ${result.status}. Continue to iteration ${iteration + 1}?`,
          title: `Ralph Loop - Iteration ${iteration}`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/iteration-${iteration}.md`, format: 'markdown' }
            ]
          }
        });
      }
    }
  }

  // Final result
  const success = done;
  const maxIterationsReached = iteration >= maxIterations && !done;

  return {
    success,
    task,
    iterations: iteration,
    maxIterations,
    done,
    maxIterationsReached,
    results,
    summary: {
      totalIterations: iteration,
      completed: done,
      finalStatus: results[results.length - 1]?.result?.status || 'UNKNOWN'
    },
    metadata: {
      processId: 'methodologies/ralph',
      timestamp: ctx.now()
    }
  };
}

/**
 * Agent-based execution
 *
 */
export const agentExecuteTask = defineTask('agent-execute', (args, taskCtx) => ({
  kind: 'agent',
  title: `Agent iteration ${args.iteration}`,
  description: 'Execute task with agent and determine if done',

  agent: {
    name: 'ralph-executor',
    prompt: {
      role: 'persistent task executor',
      task: 'Execute the given task and determine if it is complete',
      context: {
        task: args.task,
        iteration: args.iteration,
        maxIterations: args.maxIterations,
        previousResults: args.previousResults
      },
      instructions: [
        'Execute the task to the best of your ability',
        'Review the results and determine if the task is complete',
        'If complete, return status: "DONE" with explanation',
        'If not complete, return status: "IN_PROGRESS" with feedback on what remains',
        'Use previous iteration results to avoid repeating mistakes',
        'Be persistent but realistic about what can be achieved'
      ],
      outputFormat: 'JSON with done (boolean), status (string), message (string), feedback (string), actions (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['done', 'status', 'message'],
      properties: {
        done: { type: 'boolean' },
        status: { type: 'string', enum: ['DONE', 'SUCCESS', 'IN_PROGRESS', 'BLOCKED', 'ERROR'] },
        message: { type: 'string' },
        feedback: { type: 'string' },
        actions: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ralph', `iteration-${args.iteration}`]
}));
