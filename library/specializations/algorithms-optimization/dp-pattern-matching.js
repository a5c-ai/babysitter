/**
 * @process specializations/algorithms-optimization/dp-pattern-matching
 * @description DP Problem Identification and Pattern Matching - Process for recognizing DP problems, identifying
 * subproblems, finding optimal substructure, and selecting appropriate DP pattern (linear, 2D, interval, tree, bitmask).
 * @inputs { problemStatement: string, constraints?: object }
 * @outputs { success: boolean, isDPProblem: boolean, pattern: string, stateDesign: object, transition: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/dp-pattern-matching', {
 *   problemStatement: 'Find the longest increasing subsequence',
 *   constraints: { n: 10000 }
 * });
 *
 * @references
 * - Dynamic Programming Patterns: https://www.geeksforgeeks.org/dynamic-programming/
 * - DP Optimization Techniques: https://cp-algorithms.com/dynamic_programming/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemStatement,
    constraints = {},
    outputDir = 'dp-pattern-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting DP Problem Pattern Analysis');

  // PHASE 1: DP Recognition
  const recognition = await ctx.task(dpRecognitionTask, { problemStatement, constraints, outputDir });
  artifacts.push(...recognition.artifacts);

  if (!recognition.isDPProblem) {
    return {
      success: true,
      isDPProblem: false,
      reason: recognition.reason,
      alternativeApproach: recognition.alternativeApproach,
      artifacts,
      duration: ctx.now() - startTime
    };
  }

  // PHASE 2: Subproblem Identification
  const subproblems = await ctx.task(subproblemIdentificationTask, { problemStatement, recognition, outputDir });
  artifacts.push(...subproblems.artifacts);

  // PHASE 3: Pattern Classification
  const pattern = await ctx.task(patternClassificationTask, { recognition, subproblems, constraints, outputDir });
  artifacts.push(...pattern.artifacts);

  // PHASE 4: State Design
  const stateDesign = await ctx.task(stateDesignTask, { pattern, subproblems, outputDir });
  artifacts.push(...stateDesign.artifacts);

  // PHASE 5: Transition Formula
  const transition = await ctx.task(transitionFormulaTask, { stateDesign, pattern, outputDir });
  artifacts.push(...transition.artifacts);

  await ctx.breakpoint({
    question: `DP analysis complete. Pattern: ${pattern.dpPattern}. State: ${stateDesign.stateDescription}. Review?`,
    title: 'DP Pattern Analysis Complete',
    context: {
      runId: ctx.runId,
      pattern: pattern.dpPattern,
      stateDesign: stateDesign.state,
      transition: transition.formula,
      files: transition.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    isDPProblem: true,
    pattern: pattern.dpPattern,
    stateDesign: stateDesign.state,
    transition: transition.formula,
    complexity: { time: pattern.expectedTimeComplexity, space: pattern.expectedSpaceComplexity },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/dp-pattern-matching', timestamp: startTime, outputDir }
  };
}

export const dpRecognitionTask = defineTask('dp-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP Problem Recognition',
  skills: ['dp-state-designer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Determine if problem requires dynamic programming',
      context: args,
      instructions: [
        '1. Check for optimal substructure',
        '2. Check for overlapping subproblems',
        '3. Check for optimization requirement',
        '4. Identify if greedy works instead',
        '5. Document DP indicators'
      ],
      outputFormat: 'JSON object with DP recognition'
    },
    outputSchema: {
      type: 'object',
      required: ['isDPProblem', 'artifacts'],
      properties: {
        isDPProblem: { type: 'boolean' },
        reason: { type: 'string' },
        indicators: { type: 'array', items: { type: 'string' } },
        alternativeApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp', 'recognition']
}));

export const subproblemIdentificationTask = defineTask('subproblem-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Subproblem Identification',
  skills: ['dp-state-designer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Identify subproblems and their structure',
      context: args,
      instructions: [
        '1. Break down main problem',
        '2. Identify subproblem dimensions',
        '3. Determine subproblem dependencies',
        '4. Identify base cases',
        '5. Document subproblem structure'
      ],
      outputFormat: 'JSON object with subproblems'
    },
    outputSchema: {
      type: 'object',
      required: ['subproblems', 'baseCases', 'artifacts'],
      properties: {
        subproblems: { type: 'array', items: { type: 'object' } },
        baseCases: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp', 'subproblems']
}));

export const patternClassificationTask = defineTask('pattern-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP Pattern Classification',
  skills: ['dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Classify DP pattern type',
      context: args,
      instructions: [
        '1. Check for linear DP pattern',
        '2. Check for 2D DP pattern',
        '3. Check for interval DP pattern',
        '4. Check for tree DP pattern',
        '5. Check for bitmask DP pattern',
        '6. Document pattern classification'
      ],
      outputFormat: 'JSON object with pattern classification'
    },
    outputSchema: {
      type: 'object',
      required: ['dpPattern', 'expectedTimeComplexity', 'expectedSpaceComplexity', 'artifacts'],
      properties: {
        dpPattern: { type: 'string' },
        patternIndicators: { type: 'array', items: { type: 'string' } },
        expectedTimeComplexity: { type: 'string' },
        expectedSpaceComplexity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp', 'pattern']
}));

export const stateDesignTask = defineTask('state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP State Design',
  skills: ['dp-state-designer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Design DP state representation',
      context: args,
      instructions: [
        '1. Define state variables',
        '2. Define state meaning',
        '3. Determine state space size',
        '4. Plan state initialization',
        '5. Document state design'
      ],
      outputFormat: 'JSON object with state design'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'stateDescription', 'artifacts'],
      properties: {
        state: { type: 'object' },
        stateDescription: { type: 'string' },
        stateSpace: { type: 'string' },
        initialization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp', 'state']
}));

export const transitionFormulaTask = defineTask('transition-formula', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP Transition Formula',
  skills: ['dp-state-designer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Derive DP transition formula',
      context: args,
      instructions: [
        '1. Define recurrence relation',
        '2. Identify all transitions',
        '3. Optimize transitions if possible',
        '4. Verify correctness',
        '5. Document transition formula'
      ],
      outputFormat: 'JSON object with transition formula'
    },
    outputSchema: {
      type: 'object',
      required: ['formula', 'transitions', 'artifacts'],
      properties: {
        formula: { type: 'string' },
        transitions: { type: 'array', items: { type: 'object' } },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp', 'transition']
}));
