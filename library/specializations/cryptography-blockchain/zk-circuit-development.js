/**
 * @process specializations/cryptography-blockchain/zk-circuit-development
 * @description ZK Circuit Development (Circom/Noir) - Development of zero-knowledge circuits using Circom or Noir for
 * privacy-preserving proofs and verifiable computation.
 * @inputs { projectName: string, framework?: string, circuitType?: string, constraintBudget?: number }
 * @outputs { success: boolean, circuitInfo: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/zk-circuit-development', {
 *   projectName: 'Identity Prover',
 *   framework: 'circom',
 *   circuitType: 'membership-proof',
 *   constraintBudget: 100000
 * });
 *
 * @references
 * - Circom Documentation: https://docs.circom.io/
 * - Noir Language: https://noir-lang.org/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'circom',
    circuitType = 'custom',
    constraintBudget = 100000,
    optimizations = ['constraint-reduction', 'signal-reuse'],
    outputDir = 'zk-circuit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ZK Circuit Development: ${projectName}`);

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, { projectName, circuitType, constraintBudget, outputDir });
  artifacts.push(...requirementsAnalysis.artifacts);

  const circuitArchitecture = await ctx.task(circuitArchitectureTask, { projectName, framework, circuitType, outputDir });
  artifacts.push(...circuitArchitecture.artifacts);

  const signalDesign = await ctx.task(signalDesignTask, { projectName, framework, outputDir });
  artifacts.push(...signalDesign.artifacts);

  const constraintImplementation = await ctx.task(constraintImplementationTask, { projectName, framework, outputDir });
  artifacts.push(...constraintImplementation.artifacts);

  const templateLibrary = await ctx.task(templateLibraryTask, { projectName, framework, outputDir });
  artifacts.push(...templateLibrary.artifacts);

  const constraintOptimization = await ctx.task(constraintOptimizationTask, { projectName, optimizations, constraintBudget, outputDir });
  artifacts.push(...constraintOptimization.artifacts);

  const witnessGeneration = await ctx.task(witnessGenerationTask, { projectName, framework, outputDir });
  artifacts.push(...witnessGeneration.artifacts);

  const circuitTesting = await ctx.task(circuitTestingTask, { projectName, framework, outputDir });
  artifacts.push(...circuitTesting.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    circuitInfo: { framework, circuitType, constraintBudget, optimizations },
    testResults: circuitTesting,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/zk-circuit-development', timestamp: startTime }
  };
}

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'zk-analyst',
    prompt: {
      role: 'Zero-Knowledge Requirements Analyst',
      task: 'Analyze ZK circuit requirements',
      context: args,
      instructions: ['1. Define proof requirements', '2. Identify public/private inputs', '3. Specify verification criteria', '4. Estimate constraint count', '5. Define security assumptions', '6. Identify trusted setup needs', '7. Plan circuit topology', '8. Document edge cases', '9. Define test vectors', '10. Create specification'],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: { type: 'object', required: ['requirements', 'inputSpec', 'artifacts'], properties: { requirements: { type: 'array' }, inputSpec: { type: 'object' }, constraintEstimate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'requirements']
}));

export const circuitArchitectureTask = defineTask('circuit-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Circuit Architecture - ${args.projectName}`,
  agent: {
    name: 'zk-architect',
    prompt: {
      role: 'ZK Circuit Architect',
      task: 'Design circuit architecture',
      context: args,
      instructions: ['1. Design circuit modules', '2. Plan template hierarchy', '3. Define component interfaces', '4. Optimize signal flow', '5. Plan constraint distribution', '6. Design for modularity', '7. Handle edge cases', '8. Plan for testing', '9. Document architecture', '10. Create component diagram'],
      outputFormat: 'JSON with circuit architecture'
    },
    outputSchema: { type: 'object', required: ['architecture', 'modules', 'artifacts'], properties: { architecture: { type: 'object' }, modules: { type: 'array' }, signalFlow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'architecture']
}));

export const signalDesignTask = defineTask('signal-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Signal Design - ${args.projectName}`,
  agent: {
    name: 'signal-engineer',
    prompt: {
      role: 'ZK Signal Engineer',
      task: 'Design circuit signals',
      context: args,
      instructions: ['1. Define input signals', '2. Define output signals', '3. Design intermediate signals', '4. Optimize signal reuse', '5. Handle array signals', '6. Design for field arithmetic', '7. Plan signal validation', '8. Handle overflow', '9. Document signal types', '10. Create signal spec'],
      outputFormat: 'JSON with signal design'
    },
    outputSchema: { type: 'object', required: ['signals', 'inputSignals', 'artifacts'], properties: { signals: { type: 'array' }, inputSignals: { type: 'array' }, outputSignals: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'signals']
}));

export const constraintImplementationTask = defineTask('constraint-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Implementation - ${args.projectName}`,
  agent: {
    name: 'constraint-engineer',
    prompt: {
      role: 'ZK Constraint Engineer',
      task: 'Implement circuit constraints',
      context: args,
      instructions: ['1. Implement linear constraints', '2. Implement quadratic constraints', '3. Handle range checks', '4. Implement comparisons', '5. Implement hash functions', '6. Add signature verification', '7. Implement Merkle proofs', '8. Add custom gates', '9. Test constraints', '10. Document constraints'],
      outputFormat: 'JSON with constraint implementation'
    },
    outputSchema: { type: 'object', required: ['constraints', 'constraintCount', 'artifacts'], properties: { constraints: { type: 'array' }, constraintCount: { type: 'number' }, circuitCode: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'constraints']
}));

export const templateLibraryTask = defineTask('template-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Template Library - ${args.projectName}`,
  agent: {
    name: 'template-engineer',
    prompt: {
      role: 'ZK Template Engineer',
      task: 'Create reusable circuit templates',
      context: args,
      instructions: ['1. Create arithmetic templates', '2. Create comparison templates', '3. Create hash templates', '4. Create signature templates', '5. Create Merkle templates', '6. Create range templates', '7. Parameterize templates', '8. Test template composition', '9. Document templates', '10. Create template index'],
      outputFormat: 'JSON with template library'
    },
    outputSchema: { type: 'object', required: ['templates', 'artifacts'], properties: { templates: { type: 'array' }, templateDocs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'templates']
}));

export const constraintOptimizationTask = defineTask('constraint-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Optimization - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer',
    prompt: {
      role: 'ZK Optimization Engineer',
      task: 'Optimize circuit constraints',
      context: args,
      instructions: ['1. Reduce constraint count', '2. Eliminate redundant constraints', '3. Optimize signal usage', '4. Use efficient templates', '5. Batch operations', '6. Use lookup tables', '7. Profile constraint costs', '8. Compare alternatives', '9. Document optimizations', '10. Verify correctness'],
      outputFormat: 'JSON with optimization results'
    },
    outputSchema: { type: 'object', required: ['optimizations', 'constraintReduction', 'artifacts'], properties: { optimizations: { type: 'array' }, constraintReduction: { type: 'number' }, finalConstraintCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'optimization']
}));

export const witnessGenerationTask = defineTask('witness-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Witness Generation - ${args.projectName}`,
  agent: {
    name: 'witness-engineer',
    prompt: {
      role: 'Witness Generation Engineer',
      task: 'Implement witness generation',
      context: args,
      instructions: ['1. Implement witness calculator', '2. Handle input processing', '3. Compute intermediate values', '4. Validate witness', '5. Handle errors gracefully', '6. Optimize computation', '7. Add debugging tools', '8. Implement batching', '9. Test witness generation', '10. Document process'],
      outputFormat: 'JSON with witness generation'
    },
    outputSchema: { type: 'object', required: ['witnessGenerator', 'artifacts'], properties: { witnessGenerator: { type: 'object' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'witness']
}));

export const circuitTestingTask = defineTask('circuit-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Circuit Testing - ${args.projectName}`,
  agent: {
    name: 'zk-tester',
    prompt: {
      role: 'ZK Circuit Tester',
      task: 'Test ZK circuits comprehensively',
      context: args,
      instructions: ['1. Test valid inputs', '2. Test invalid inputs', '3. Test edge cases', '4. Test constraint satisfaction', '5. Test witness generation', '6. Test proof generation', '7. Test verification', '8. Benchmark performance', '9. Test integration', '10. Document test coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['testResults', 'coverage', 'artifacts'], properties: { testResults: { type: 'object' }, coverage: { type: 'number' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zk', 'testing']
}));
