/**
 * @process specializations/algorithms-optimization/algorithm-implementation
 * @description Algorithm Implementation from Scratch - Process for implementing classic algorithms from pseudocode/description
 * with correctness proofs, complexity analysis, testing with edge cases, and optimization.
 * @inputs { algorithmName: string, algorithmType?: string, language?: string, pseudocode?: string }
 * @outputs { success: boolean, implementation: string, complexityAnalysis: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/algorithm-implementation', {
 *   algorithmName: 'QuickSort',
 *   algorithmType: 'sorting',
 *   language: 'python',
 *   pseudocode: 'Divide and conquer sorting algorithm using pivot'
 * });
 *
 * @references
 * - CLRS Introduction to Algorithms
 * - CP-Algorithms: https://cp-algorithms.com/
 * - Algorithm Design Manual by Skiena
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmName,
    algorithmType = 'general',
    language = 'python',
    pseudocode = '',
    outputDir = 'algorithm-impl-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Algorithm Implementation - ${algorithmName}`);

  // PHASE 1: Algorithm Understanding
  const understanding = await ctx.task(algorithmUnderstandingTask, { algorithmName, algorithmType, pseudocode, outputDir });
  artifacts.push(...understanding.artifacts);

  // PHASE 2: Implementation
  const implementation = await ctx.task(implementationTask, { algorithmName, understanding, language, outputDir });
  artifacts.push(...implementation.artifacts);

  // PHASE 3: Correctness Proof
  const proof = await ctx.task(correctnessProofTask, { algorithmName, understanding, implementation, outputDir });
  artifacts.push(...proof.artifacts);

  // PHASE 4: Testing
  const testing = await ctx.task(testingTask, { algorithmName, implementation, language, outputDir });
  artifacts.push(...testing.artifacts);

  // PHASE 5: Complexity Analysis
  const complexity = await ctx.task(complexityTask, { algorithmName, implementation, outputDir });
  artifacts.push(...complexity.artifacts);

  // PHASE 6: Optimization
  const optimization = await ctx.task(optimizationTask, { algorithmName, implementation, complexity, language, outputDir });
  artifacts.push(...optimization.artifacts);

  await ctx.breakpoint({
    question: `Algorithm ${algorithmName} implemented. Tests: ${testing.passedCount}/${testing.totalCount}. Complexity: O(${complexity.timeComplexity}). Review?`,
    title: 'Algorithm Implementation Complete',
    context: {
      runId: ctx.runId,
      algorithmName,
      complexity: complexity.timeComplexity,
      testsPassed: testing.allPassed,
      files: [
        { path: implementation.codePath, format: language, label: 'Implementation' },
        { path: complexity.analysisPath, format: 'markdown', label: 'Complexity Analysis' }
      ]
    }
  });

  return {
    success: true,
    algorithmName,
    implementation: implementation.code,
    complexityAnalysis: { time: complexity.timeComplexity, space: complexity.spaceComplexity },
    testResults: { passed: testing.passedCount, total: testing.totalCount },
    correctnessProof: proof.summary,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/algorithm-implementation', timestamp: startTime, outputDir }
  };
}

export const algorithmUnderstandingTask = defineTask('algorithm-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Understanding ${args.algorithmName}`,
  skills: ['code-template-manager', 'complexity-analyzer'],
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Understand algorithm theory and design',
      context: args,
      instructions: [
        '1. Study algorithm description and pseudocode',
        '2. Understand the core idea and intuition',
        '3. Identify invariants and key properties',
        '4. List prerequisites and dependencies',
        '5. Document algorithm steps'
      ],
      outputFormat: 'JSON object with algorithm understanding'
    },
    outputSchema: {
      type: 'object',
      required: ['coreIdea', 'steps', 'invariants', 'artifacts'],
      properties: {
        coreIdea: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        invariants: { type: 'array', items: { type: 'string' } },
        prerequisites: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'understanding']
}));

export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementing ${args.algorithmName}`,
  skills: ['code-template-manager', 'data-structure-selector'],
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement algorithm in target language',
      context: args,
      instructions: [
        '1. Translate pseudocode to code',
        '2. Use clear variable names',
        '3. Handle edge cases',
        '4. Add comments for clarity',
        '5. Save implementation to file'
      ],
      outputFormat: 'JSON object with implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'codePath', 'artifacts'],
      properties: {
        code: { type: 'string' },
        codePath: { type: 'string' },
        edgeCasesHandled: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'coding']
}));

export const correctnessProofTask = defineTask('correctness-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correctness Proof - ${args.algorithmName}`,
  skills: ['invariant-analyzer', 'proof-assistant'],
  agent: {
    name: 'correctness-verifier',
    prompt: {
      role: 'Algorithm Theorist',
      task: 'Prove algorithm correctness',
      context: args,
      instructions: [
        '1. State loop invariants',
        '2. Prove initialization',
        '3. Prove maintenance',
        '4. Prove termination',
        '5. Document correctness proof'
      ],
      outputFormat: 'JSON object with correctness proof'
    },
    outputSchema: {
      type: 'object',
      required: ['isCorrect', 'summary', 'artifacts'],
      properties: {
        isCorrect: { type: 'boolean' },
        summary: { type: 'string' },
        invariants: { type: 'array', items: { type: 'object' } },
        proofPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'proof']
}));

export const testingTask = defineTask('testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing ${args.algorithmName}`,
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Test algorithm implementation',
      context: args,
      instructions: [
        '1. Create comprehensive test cases',
        '2. Test edge cases',
        '3. Test boundary conditions',
        '4. Test large inputs',
        '5. Document test results'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'totalCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        totalCount: { type: 'number' },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'testing']
}));

export const complexityTask = defineTask('complexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Complexity Analysis - ${args.algorithmName}`,
  skills: ['complexity-analyzer'],
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Analyze time and space complexity',
      context: args,
      instructions: [
        '1. Analyze time complexity step by step',
        '2. Analyze space complexity',
        '3. Consider best, average, worst cases',
        '4. Document derivation',
        '5. Create analysis report'
      ],
      outputFormat: 'JSON object with complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['timeComplexity', 'spaceComplexity', 'analysisPath', 'artifacts'],
      properties: {
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        bestCase: { type: 'string' },
        worstCase: { type: 'string' },
        analysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'complexity']
}));

export const optimizationTask = defineTask('optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimization - ${args.algorithmName}`,
  skills: ['code-profiler', 'micro-optimizer'],
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize algorithm implementation',
      context: args,
      instructions: [
        '1. Identify optimization opportunities',
        '2. Apply code-level optimizations',
        '3. Consider cache efficiency',
        '4. Benchmark improvements',
        '5. Document optimizations'
      ],
      outputFormat: 'JSON object with optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'improvementPercent', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'string' } },
        improvementPercent: { type: 'number' },
        optimizedCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'algorithm-implementation', 'optimization']
}));
