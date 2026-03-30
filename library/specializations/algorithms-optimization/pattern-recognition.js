/**
 * @process specializations/algorithms-optimization/pattern-recognition
 * @description Problem Pattern Recognition and Classification - Process for analyzing problem statements, identifying
 * patterns (two-pointer, sliding window, DP, greedy, graph), and selecting appropriate algorithms based on constraints.
 * @inputs { problemStatement: string, constraints?: object, examples?: array }
 * @outputs { success: boolean, patterns: array, algorithmRecommendation: string, approach: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/pattern-recognition', {
 *   problemStatement: 'Given an array, find two numbers that sum to target',
 *   constraints: { n: 10000, values: [-10^9, 10^9] },
 *   examples: [{ input: '[2,7,11,15], target=9', output: '[0,1]' }]
 * });
 *
 * @references
 * - LeetCode Patterns: https://seanprashad.com/leetcode-patterns/
 * - Algorithm Pattern Recognition: https://www.geeksforgeeks.org/fundamentals-of-algorithms/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemStatement,
    constraints = {},
    examples = [],
    outputDir = 'pattern-recognition-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Problem Pattern Recognition');

  // PHASE 1: Problem Parsing
  const parsing = await ctx.task(problemParsingTask, { problemStatement, constraints, examples, outputDir });
  artifacts.push(...parsing.artifacts);

  // PHASE 2: Pattern Identification
  const patternId = await ctx.task(patternIdentificationTask, { parsing, outputDir });
  artifacts.push(...patternId.artifacts);

  // PHASE 3: Constraint Analysis
  const constraintAnalysis = await ctx.task(constraintAnalysisTask, { parsing, patternId, outputDir });
  artifacts.push(...constraintAnalysis.artifacts);

  // PHASE 4: Algorithm Selection
  const algoSelection = await ctx.task(algorithmSelectionTask, { patternId, constraintAnalysis, outputDir });
  artifacts.push(...algoSelection.artifacts);

  await ctx.breakpoint({
    question: `Pattern analysis complete. Identified patterns: ${patternId.patterns.join(', ')}. Recommended algorithm: ${algoSelection.recommendation}. Review?`,
    title: 'Pattern Recognition Complete',
    context: {
      runId: ctx.runId,
      patterns: patternId.patterns,
      recommendation: algoSelection.recommendation,
      complexity: algoSelection.expectedComplexity,
      files: algoSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    patterns: patternId.patterns,
    algorithmRecommendation: algoSelection.recommendation,
    approach: algoSelection.approach,
    expectedComplexity: algoSelection.expectedComplexity,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/pattern-recognition', timestamp: startTime, outputDir }
  };
}

export const problemParsingTask = defineTask('problem-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Problem Parsing',
  skills: ['leetcode-problem-fetcher', 'dp-pattern-library'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Algorithm Problem Analyst',
      task: 'Parse and understand problem statement',
      context: args,
      instructions: [
        '1. Extract input/output format',
        '2. Identify data types and structures',
        '3. List all constraints',
        '4. Identify edge cases',
        '5. Summarize problem requirements'
      ],
      outputFormat: 'JSON object with parsed problem'
    },
    outputSchema: {
      type: 'object',
      required: ['inputFormat', 'outputFormat', 'requirements', 'artifacts'],
      properties: {
        inputFormat: { type: 'object' },
        outputFormat: { type: 'object' },
        requirements: { type: 'array', items: { type: 'string' } },
        edgeCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-recognition', 'parsing']
}));

export const patternIdentificationTask = defineTask('pattern-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pattern Identification',
  skills: ['dp-pattern-library'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Algorithm Pattern Expert',
      task: 'Identify applicable algorithmic patterns',
      context: args,
      instructions: [
        '1. Check for Two Pointer pattern indicators',
        '2. Check for Sliding Window pattern indicators',
        '3. Check for Dynamic Programming pattern indicators',
        '4. Check for Greedy pattern indicators',
        '5. Check for Graph pattern indicators',
        '6. Check for Binary Search pattern indicators',
        '7. Rank patterns by likelihood'
      ],
      outputFormat: 'JSON object with identified patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'primaryPattern', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'string' } },
        primaryPattern: { type: 'string' },
        patternConfidence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-recognition', 'identification']
}));

export const constraintAnalysisTask = defineTask('constraint-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constraint Analysis',
  skills: ['complexity-analyzer'],
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Complexity Analyst',
      task: 'Analyze constraints to determine feasible algorithms',
      context: args,
      instructions: [
        '1. Analyze input size constraints',
        '2. Determine maximum acceptable complexity',
        '3. Check memory constraints',
        '4. Map constraints to algorithm families',
        '5. Eliminate infeasible approaches'
      ],
      outputFormat: 'JSON object with constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['maxComplexity', 'feasibleApproaches', 'artifacts'],
      properties: {
        maxComplexity: { type: 'string' },
        feasibleApproaches: { type: 'array', items: { type: 'string' } },
        infeasibleApproaches: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-recognition', 'constraints']
}));

export const algorithmSelectionTask = defineTask('algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Algorithm Selection',
  skills: ['dp-pattern-library', 'complexity-analyzer'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Algorithm Selection Expert',
      task: 'Select optimal algorithm based on patterns and constraints',
      context: args,
      instructions: [
        '1. Match patterns to algorithms',
        '2. Filter by constraint feasibility',
        '3. Rank by expected efficiency',
        '4. Select optimal algorithm',
        '5. Document approach and rationale'
      ],
      outputFormat: 'JSON object with algorithm selection'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'approach', 'expectedComplexity', 'artifacts'],
      properties: {
        recommendation: { type: 'string' },
        approach: { type: 'object' },
        expectedComplexity: { type: 'string' },
        alternatives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-recognition', 'selection']
}));
