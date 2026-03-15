/**
 * @process specializations/algorithms-optimization/dp-transition-derivation
 * @description DP Transition Formula Derivation - Process for deriving recurrence relations, establishing base cases,
 * and implementing memoization or tabulation approaches with correctness verification.
 * @inputs { problemStatement: string, stateDesign: object }
 * @outputs { success: boolean, recurrence: string, baseCases: array, implementation: object, artifacts: array }
 *
 * @references
 * - Dynamic Programming Recurrences
 * - Memoization vs Tabulation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, stateDesign, language = 'python', outputDir = 'dp-transition-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting DP Transition Derivation');

  const derivation = await ctx.task(recurrenceDerivationTask, { problemStatement, stateDesign, outputDir });
  artifacts.push(...derivation.artifacts);

  const baseCases = await ctx.task(baseCaseEstablishmentTask, { derivation, stateDesign, outputDir });
  artifacts.push(...baseCases.artifacts);

  const implementation = await ctx.task(dpImplementationTask, { derivation, baseCases, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const verification = await ctx.task(transitionVerificationTask, { derivation, implementation, outputDir });
  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `DP transition derived. Recurrence: ${derivation.formula}. Verified: ${verification.isCorrect}. Review?`,
    title: 'DP Transition Derivation Complete',
    context: { runId: ctx.runId, recurrence: derivation.formula, verified: verification.isCorrect }
  });

  return {
    success: true,
    recurrence: derivation.formula,
    baseCases: baseCases.cases,
    implementation: { memoization: implementation.memoCode, tabulation: implementation.tabCode },
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const recurrenceDerivationTask = defineTask('recurrence-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive Recurrence Relation',
  skills: ['dp-state-designer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Derive DP recurrence relation',
      context: args,
      instructions: ['1. Identify choices at each state', '2. Define transitions', '3. Derive recurrence formula', '4. Document derivation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['formula', 'derivation', 'artifacts'],
      properties: { formula: { type: 'string' }, derivation: { type: 'string' }, transitions: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-transition', 'derivation']
}));

export const baseCaseEstablishmentTask = defineTask('base-case-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Base Cases',
  skills: ['dp-state-designer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Establish DP base cases',
      context: args,
      instructions: ['1. Identify smallest subproblems', '2. Define base case values', '3. Verify completeness', '4. Document base cases'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['cases', 'artifacts'],
      properties: { cases: { type: 'array' }, initialization: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-transition', 'base-cases']
}));

export const dpImplementationTask = defineTask('dp-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement DP Solution',
  skills: ['dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement DP using memoization and tabulation',
      context: args,
      instructions: ['1. Implement memoization version', '2. Implement tabulation version', '3. Compare approaches', '4. Document both'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['memoCode', 'tabCode', 'artifacts'],
      properties: { memoCode: { type: 'string' }, tabCode: { type: 'string' }, comparison: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-transition', 'implementation']
}));

export const transitionVerificationTask = defineTask('transition-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify DP Transition',
  skills: ['test-case-generator'],
  agent: {
    name: 'correctness-verifier',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Verify DP transition correctness',
      context: args,
      instructions: ['1. Verify recurrence covers all cases', '2. Test with examples', '3. Verify optimal substructure', '4. Document verification'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['isCorrect', 'artifacts'],
      properties: { isCorrect: { type: 'boolean' }, testResults: { type: 'array' }, issues: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-transition', 'verification']
}));
