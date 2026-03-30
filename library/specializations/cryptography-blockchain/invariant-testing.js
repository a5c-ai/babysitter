/**
 * @process specializations/cryptography-blockchain/invariant-testing
 * @description Invariant Testing - Comprehensive invariant testing for DeFi protocols to ensure system properties hold
 * under all conditions and state transitions.
 * @inputs { projectName: string, protocol: string, invariants?: array, actorModel?: string }
 * @outputs { success: boolean, testResults: object, invariantStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/invariant-testing', {
 *   projectName: 'Lending Protocol Invariants',
 *   protocol: 'lending',
 *   invariants: ['solvency', 'collateral-ratio', 'interest-accrual'],
 *   actorModel: 'multi-actor'
 * });
 *
 * @references
 * - Foundry Invariants: https://book.getfoundry.sh/forge/invariant-testing
 * - Medusa: https://github.com/crytic/medusa
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    protocol,
    invariants = [],
    actorModel = 'multi-actor',
    depth = 100,
    runs = 1000,
    outputDir = 'invariant-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Invariant Testing: ${projectName}`);

  const invariantDiscovery = await ctx.task(invariantDiscoveryTask, { projectName, protocol, outputDir });
  artifacts.push(...invariantDiscovery.artifacts);

  const actorModelDesign = await ctx.task(actorModelDesignTask, { projectName, actorModel, outputDir });
  artifacts.push(...actorModelDesign.artifacts);

  const handlerImplementation = await ctx.task(handlerImplementationTask, { projectName, protocol, outputDir });
  artifacts.push(...handlerImplementation.artifacts);

  const invariantImplementation = await ctx.task(invariantImplementationTask, { projectName, invariants, outputDir });
  artifacts.push(...invariantImplementation.artifacts);

  const testExecution = await ctx.task(testExecutionTask, { projectName, depth, runs, outputDir });
  artifacts.push(...testExecution.artifacts);

  const failureAnalysis = await ctx.task(failureAnalysisTask, { projectName, outputDir });
  artifacts.push(...failureAnalysis.artifacts);

  const callSequenceAnalysis = await ctx.task(callSequenceAnalysisTask, { projectName, outputDir });
  artifacts.push(...callSequenceAnalysis.artifacts);

  const documentationGeneration = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentationGeneration.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    testResults: { depth, runs, coverage: testExecution.coverage },
    invariantStatus: invariantImplementation.invariantStatus,
    failures: failureAnalysis.failures,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/invariant-testing', timestamp: startTime }
  };
}

export const invariantDiscoveryTask = defineTask('invariant-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Invariant Discovery - ${args.projectName}`,
  agent: {
    name: 'invariant-analyst',
    prompt: {
      role: 'Invariant Discovery Analyst',
      task: 'Discover protocol invariants',
      context: args,
      instructions: ['1. Analyze protocol design', '2. Identify state variables', '3. Find conservation laws', '4. Discover solvency invariants', '5. Find ordering invariants', '6. Identify bound invariants', '7. Discover relationship invariants', '8. Find temporal invariants', '9. Prioritize invariants', '10. Document all invariants'],
      outputFormat: 'JSON with invariant discovery'
    },
    outputSchema: { type: 'object', required: ['invariants', 'categories', 'artifacts'], properties: { invariants: { type: 'array' }, categories: { type: 'object' }, priority: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'discovery']
}));

export const actorModelDesignTask = defineTask('actor-model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Actor Model Design - ${args.projectName}`,
  agent: {
    name: 'actor-designer',
    prompt: {
      role: 'Actor Model Designer',
      task: 'Design actor model for testing',
      context: args,
      instructions: ['1. Identify actor types', '2. Define actor behaviors', '3. Set up actor constraints', '4. Configure actor balances', '5. Define interaction patterns', '6. Set up adversarial actors', '7. Configure permissions', '8. Define state bounds', '9. Create actor configurations', '10. Document actor model'],
      outputFormat: 'JSON with actor model design'
    },
    outputSchema: { type: 'object', required: ['actors', 'behaviors', 'artifacts'], properties: { actors: { type: 'array' }, behaviors: { type: 'object' }, interactions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'actors']
}));

export const handlerImplementationTask = defineTask('handler-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handler Implementation - ${args.projectName}`,
  agent: {
    name: 'handler-engineer',
    prompt: {
      role: 'Handler Implementation Engineer',
      task: 'Implement test handlers',
      context: args,
      instructions: ['1. Implement function handlers', '2. Add bound modifiers', '3. Implement ghost variables', '4. Add preconditions', '5. Implement postconditions', '6. Add state tracking', '7. Implement helper functions', '8. Add error handling', '9. Test handlers', '10. Document handlers'],
      outputFormat: 'JSON with handler implementation'
    },
    outputSchema: { type: 'object', required: ['handlers', 'ghostVariables', 'artifacts'], properties: { handlers: { type: 'array' }, ghostVariables: { type: 'array' }, modifiers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'handlers']
}));

export const invariantImplementationTask = defineTask('invariant-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Invariant Implementation - ${args.projectName}`,
  agent: {
    name: 'invariant-engineer',
    prompt: {
      role: 'Invariant Implementation Engineer',
      task: 'Implement invariant checks',
      context: args,
      instructions: ['1. Implement invariant functions', '2. Add assertion logic', '3. Implement comparisons', '4. Add tolerance handling', '5. Implement aggregations', '6. Add boundary checks', '7. Implement temporal checks', '8. Add documentation', '9. Test invariants', '10. Categorize invariants'],
      outputFormat: 'JSON with invariant implementation'
    },
    outputSchema: { type: 'object', required: ['implementations', 'invariantStatus', 'artifacts'], properties: { implementations: { type: 'array' }, invariantStatus: { type: 'object' }, testCode: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'implementation']
}));

export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Execution - ${args.projectName}`,
  agent: {
    name: 'test-executor',
    prompt: {
      role: 'Invariant Test Executor',
      task: 'Execute invariant tests',
      context: args,
      instructions: ['1. Configure test parameters', '2. Run invariant tests', '3. Monitor execution', '4. Collect statistics', '5. Track failures', '6. Measure coverage', '7. Log call sequences', '8. Handle timeouts', '9. Save test state', '10. Generate results'],
      outputFormat: 'JSON with test execution'
    },
    outputSchema: { type: 'object', required: ['results', 'coverage', 'artifacts'], properties: { results: { type: 'object' }, coverage: { type: 'number' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'execution']
}));

export const failureAnalysisTask = defineTask('failure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Failure Analysis - ${args.projectName}`,
  agent: {
    name: 'failure-analyst',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Analyze invariant failures',
      context: args,
      instructions: ['1. Identify failing invariants', '2. Analyze failure causes', '3. Extract call sequences', '4. Minimize sequences', '5. Identify root causes', '6. Classify failures', '7. Assess severity', '8. Create reproductions', '9. Suggest fixes', '10. Document failures'],
      outputFormat: 'JSON with failure analysis'
    },
    outputSchema: { type: 'object', required: ['failures', 'rootCauses', 'artifacts'], properties: { failures: { type: 'array' }, rootCauses: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'failures']
}));

export const callSequenceAnalysisTask = defineTask('call-sequence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Call Sequence Analysis - ${args.projectName}`,
  agent: {
    name: 'sequence-analyst',
    prompt: {
      role: 'Call Sequence Analyst',
      task: 'Analyze call sequences',
      context: args,
      instructions: ['1. Extract sequences', '2. Identify patterns', '3. Find minimal sequences', '4. Analyze state transitions', '5. Identify dangerous patterns', '6. Find edge cases', '7. Analyze ordering', '8. Create visualizations', '9. Document patterns', '10. Add to test suite'],
      outputFormat: 'JSON with call sequence analysis'
    },
    outputSchema: { type: 'object', required: ['sequences', 'patterns', 'artifacts'], properties: { sequences: { type: 'array' }, patterns: { type: 'array' }, edgeCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'sequences']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'docs-generator',
    prompt: {
      role: 'Invariant Documentation Writer',
      task: 'Generate documentation',
      context: args,
      instructions: ['1. Document invariants', '2. Document actor model', '3. Document handlers', '4. Document test results', '5. Create usage guide', '6. Add examples', '7. Document failures', '8. Add maintenance guide', '9. Create summary', '10. Export documentation'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['documentation', 'summary', 'artifacts'], properties: { documentation: { type: 'object' }, summary: { type: 'string' }, usageGuide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['invariant', 'documentation']
}));
