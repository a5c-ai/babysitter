/**
 * @process specializations/common-utilities/parallel-combinator
 * @description Parallel task combinator - fan-out/fan-in patterns for concurrent task execution with shared dependencies
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Create a fan-out/fan-in task group that runs multiple tasks in parallel
 * after a shared dependency completes.
 * 
 * Usage in a process:
 *   const [resultA, resultB] = await fanOutFanIn(ctx, sharedInput, [taskA, taskB]);
 * 
 * @param {object} ctx - The process context
 * @param {object} sharedArgs - Shared arguments passed to all parallel tasks
 * @param {Array<{task: Function, args: object}>} taskSpecs - Array of {task, args} to run in parallel
 * @returns {Promise<Array>} Results from all parallel tasks
 */
export async function fanOutFanIn(ctx, sharedArgs, taskSpecs) {
  return Promise.all(
    taskSpecs.map(({ task, args = {} }) =>
      ctx.task(task, { ...sharedArgs, ...args })
    )
  );
}

/**
 * Create a pipeline of sequential phases, where each phase can contain
 * parallel tasks. Results from each phase feed into the next.
 * 
 * Usage:
 *   const result = await pipeline(ctx, initialInput, [
 *     { task: analyzeTask },                          // Phase 1: single task
 *     [{ task: strengthsTask }, { task: weaknessesTask }],  // Phase 2: parallel
 *     { task: synthesizeTask },                       // Phase 3: receives all prior results
 *   ]);
 * 
 * @param {object} ctx - The process context
 * @param {object} initialInput - Initial input for the first phase
 * @param {Array} phases - Array of task specs or arrays of task specs (for parallel phases)
 * @returns {Promise<object>} Final accumulated results
 */
export async function pipeline(ctx, initialInput, phases) {
  let accumulated = { ...initialInput };
  
  for (const phase of phases) {
    if (Array.isArray(phase)) {
      // Parallel phase: run all tasks concurrently with accumulated context
      const results = await Promise.all(
        phase.map(({ task, args = {}, key }) =>
          ctx.task(task, { ...accumulated, ...args }).then(result => ({ key, result }))
        )
      );
      // Merge results into accumulated context
      for (const { key, result } of results) {
        if (key) {
          accumulated[key] = result;
        }
      }
    } else {
      // Sequential phase: single task
      const { task, args = {}, key } = phase;
      const result = await ctx.task(task, { ...accumulated, ...args });
      if (key) {
        accumulated[key] = result;
      }
    }
  }
  return accumulated;
}
