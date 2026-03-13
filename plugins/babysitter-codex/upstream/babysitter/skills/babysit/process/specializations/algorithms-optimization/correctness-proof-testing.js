/**
 * @process specializations/algorithms-optimization/correctness-proof-testing
 * @description Algorithm Correctness Proof and Testing - Formal process for proving algorithm correctness using
 * invariants, induction, and contradiction, followed by comprehensive testing including edge cases.
 * @inputs { algorithmName: string, implementation: string, language?: string }
 * @outputs { success: boolean, isCorrect: boolean, proofDocument: string, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/correctness-proof-testing', {
 *   algorithmName: 'BinarySearch',
 *   implementation: 'function binarySearch(arr, target) {...}',
 *   language: 'javascript'
 * });
 *
 * @references
 * - CLRS Chapter on Correctness
 * - Formal Methods in Software Engineering
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmName,
    implementation,
    language = 'python',
    outputDir = 'correctness-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Proving Correctness - ${algorithmName}`);

  // PHASE 1: Invariant Identification
  const invariants = await ctx.task(invariantIdentificationTask, { algorithmName, implementation, outputDir });
  artifacts.push(...invariants.artifacts);

  // PHASE 2: Formal Proof Construction
  const proof = await ctx.task(formalProofTask, { algorithmName, invariants, outputDir });
  artifacts.push(...proof.artifacts);

  // PHASE 3: Test Case Generation
  const testGen = await ctx.task(testCaseGenerationTask, { algorithmName, implementation, language, outputDir });
  artifacts.push(...testGen.artifacts);

  // PHASE 4: Comprehensive Testing
  const testing = await ctx.task(comprehensiveTestingTask, { algorithmName, implementation, testGen, language, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Correctness analysis for ${algorithmName} complete. Proof valid: ${proof.isValid}. Tests passed: ${testing.passedCount}/${testing.totalCount}. Review?`,
    title: 'Correctness Proof Complete',
    context: {
      runId: ctx.runId,
      algorithmName,
      proofValid: proof.isValid,
      testsPassed: testing.allPassed,
      files: [
        { path: proof.proofPath, format: 'markdown', label: 'Correctness Proof' },
        { path: testing.reportPath, format: 'json', label: 'Test Results' }
      ]
    }
  });

  return {
    success: true,
    algorithmName,
    isCorrect: proof.isValid && testing.allPassed,
    proofDocument: proof.proofPath,
    testResults: { passed: testing.passedCount, total: testing.totalCount },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/correctness-proof-testing', timestamp: startTime, outputDir }
  };
}

export const invariantIdentificationTask = defineTask('invariant-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Invariants - ${args.algorithmName}`,
  skills: ['invariant-analyzer', 'proof-assistant'],
  agent: {
    name: 'correctness-verifier',
    prompt: {
      role: 'Algorithm Theorist',
      task: 'Identify loop invariants and properties',
      context: args,
      instructions: [
        '1. Analyze algorithm structure',
        '2. Identify loop invariants',
        '3. Identify preconditions',
        '4. Identify postconditions',
        '5. Document all properties'
      ],
      outputFormat: 'JSON object with invariants'
    },
    outputSchema: {
      type: 'object',
      required: ['invariants', 'preconditions', 'postconditions', 'artifacts'],
      properties: {
        invariants: { type: 'array', items: { type: 'object' } },
        preconditions: { type: 'array', items: { type: 'string' } },
        postconditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'correctness', 'invariants']
}));

export const formalProofTask = defineTask('formal-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formal Proof - ${args.algorithmName}`,
  skills: ['proof-assistant'],
  agent: {
    name: 'correctness-verifier',
    prompt: {
      role: 'Formal Methods Expert',
      task: 'Construct formal correctness proof',
      context: args,
      instructions: [
        '1. Prove initialization (base case)',
        '2. Prove maintenance (inductive step)',
        '3. Prove termination',
        '4. Prove postcondition follows',
        '5. Create proof document'
      ],
      outputFormat: 'JSON object with proof'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'proofPath', 'artifacts'],
      properties: {
        isValid: { type: 'boolean' },
        proofPath: { type: 'string' },
        proofSteps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'correctness', 'proof']
}));

export const testCaseGenerationTask = defineTask('test-case-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Test Cases - ${args.algorithmName}`,
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Generate comprehensive test cases',
      context: args,
      instructions: [
        '1. Generate normal test cases',
        '2. Generate edge cases',
        '3. Generate boundary cases',
        '4. Generate stress test cases',
        '5. Generate random test cases'
      ],
      outputFormat: 'JSON object with test cases'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'artifacts'],
      properties: {
        testCases: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } },
        stressCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'correctness', 'test-generation']
}));

export const comprehensiveTestingTask = defineTask('comprehensive-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Tests - ${args.algorithmName}`,
  skills: ['test-case-generator', 'solution-comparator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Run all tests and report results',
      context: args,
      instructions: [
        '1. Run all generated tests',
        '2. Verify outputs match expected',
        '3. Track failures',
        '4. Analyze failure patterns',
        '5. Create test report'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'totalCount', 'reportPath', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        totalCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'correctness', 'testing']
}));
