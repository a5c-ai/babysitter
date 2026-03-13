/**
 * @process specializations/fpga-programming/constrained-random-verification
 * @description Constrained Random Verification (CRV) - Develop constrained random testbenches using SystemVerilog
 * randomization features. Create constraint classes and coverage models for thorough verification.
 * @inputs { dutName: string, interfaces: array, coverageGoals?: object, constraintComplexity?: string, outputDir?: string }
 * @outputs { success: boolean, crvEnvironment: object, coverageReport: object, constraintLibrary: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/constrained-random-verification', {
 *   dutName: 'dma_engine',
 *   interfaces: ['axi4_mm', 'axi4_stream', 'interrupt'],
 *   coverageGoals: { functional: 95, code: 90 },
 *   constraintComplexity: 'high'
 * });
 *
 * @references
 * - SystemVerilog for Verification: https://verificationacademy.com/
 * - Constrained Random Verification: https://www.mentor.com/
 * - Coverage-Driven Verification: https://www.cadence.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dutName,
    interfaces,
    coverageGoals = { functional: 90, code: 85 },
    constraintComplexity = 'medium',
    randomSeedManagement = true,
    coverageDriven = true,
    outputDir = 'crv-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CRV Development for: ${dutName}`);
  ctx.log('info', `Interfaces: ${interfaces.length}, Complexity: ${constraintComplexity}`);

  // Phase 1-10 implementation with appropriate tasks
  const transactionClasses = await ctx.task(transactionClassesTask, { dutName, interfaces, outputDir });
  artifacts.push(...transactionClasses.artifacts);

  const constraintDefinition = await ctx.task(constraintDefinitionTask, { dutName, transactionClasses, constraintComplexity, outputDir });
  artifacts.push(...constraintDefinition.artifacts);

  const sequenceLibrary = await ctx.task(sequenceLibraryTask, { dutName, transactionClasses, constraintDefinition, outputDir });
  artifacts.push(...sequenceLibrary.artifacts);

  const coverageModel = await ctx.task(coverageModelTask, { dutName, interfaces, coverageGoals, transactionClasses, outputDir });
  artifacts.push(...coverageModel.artifacts);

  await ctx.breakpoint({
    question: `CRV environment defined for ${dutName}. ${transactionClasses.classCount} transaction classes, ${constraintDefinition.constraintCount} constraints. Review CRV setup?`,
    title: 'CRV Setup Review',
    context: { runId: ctx.runId, dutName, classCount: transactionClasses.classCount, constraintCount: constraintDefinition.constraintCount }
  });

  const coverageClosure = await ctx.task(coverageClosureTask, { dutName, coverageModel, coverageGoals, coverageDriven, outputDir });
  artifacts.push(...coverageClosure.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    dutName,
    crvEnvironment: {
      transactionClasses: transactionClasses.classes,
      constraints: constraintDefinition.constraints,
      sequences: sequenceLibrary.sequences
    },
    coverageReport: {
      coverageModel: coverageModel.covergroups,
      closureStatus: coverageClosure.closureStatus
    },
    constraintLibrary: constraintDefinition.constraintLibraryPath,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/constrained-random-verification', timestamp: startTime, dutName, outputDir }
  };
}

export const transactionClassesTask = defineTask('transaction-classes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transaction Classes - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Define transaction classes for CRV',
      context: args,
      instructions: ['1. Define base transaction class', '2. Add rand/randc variables', '3. Define constraints', '4. Implement copy/compare methods', '5. Add print/convert2string', '6. Create derived classes', '7. Add utility methods', '8. Document class hierarchy', '9. Test randomization', '10. Create usage examples']
    },
    outputSchema: {
      type: 'object',
      required: ['classCount', 'classes', 'artifacts'],
      properties: { classCount: { type: 'number' }, classes: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'crv', 'transactions']
}));

export const constraintDefinitionTask = defineTask('constraint-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Definition - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Define verification constraints',
      context: args,
      instructions: ['1. Define valid value constraints', '2. Create distribution constraints', '3. Add conditional constraints', '4. Define soft constraints', '5. Create constraint blocks', '6. Add weighted distributions', '7. Handle constraint conflicts', '8. Create constraint modes', '9. Document constraints', '10. Test constraint solving']
    },
    outputSchema: {
      type: 'object',
      required: ['constraintCount', 'constraints', 'constraintLibraryPath', 'artifacts'],
      properties: { constraintCount: { type: 'number' }, constraints: { type: 'array', items: { type: 'object' } }, constraintLibraryPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'crv', 'constraints']
}));

export const sequenceLibraryTask = defineTask('sequence-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sequence Library - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Create sequence library',
      context: args,
      instructions: ['1. Create base sequence', '2. Implement body() method', '3. Add sequence items', '4. Create virtual sequences', '5. Implement sequence layering', '6. Add response handling', '7. Create error sequences', '8. Document sequences', '9. Create sequence library', '10. Test sequence execution']
    },
    outputSchema: {
      type: 'object',
      required: ['sequences', 'artifacts'],
      properties: { sequences: { type: 'array', items: { type: 'object' } }, sequenceLibraryPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'crv', 'sequences']
}));

export const coverageModelTask = defineTask('coverage-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage Model - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Define coverage model',
      context: args,
      instructions: ['1. Define covergroups', '2. Create coverpoints', '3. Add cross coverage', '4. Define bins', '5. Add illegal bins', '6. Create transition coverage', '7. Define coverage options', '8. Link to transactions', '9. Document coverage model', '10. Set coverage goals']
    },
    outputSchema: {
      type: 'object',
      required: ['covergroups', 'artifacts'],
      properties: { covergroups: { type: 'array', items: { type: 'object' } }, coverpointCount: { type: 'number' }, crossCount: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'crv', 'coverage']
}));

export const coverageClosureTask = defineTask('coverage-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage Closure - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Achieve coverage closure',
      context: args,
      instructions: ['1. Analyze coverage holes', '2. Create targeted tests', '3. Adjust constraints', '4. Add directed sequences', '5. Monitor coverage progress', '6. Generate exclusions if needed', '7. Document closure strategy', '8. Run regression', '9. Verify goals met', '10. Generate closure report']
    },
    outputSchema: {
      type: 'object',
      required: ['closureStatus', 'artifacts'],
      properties: { closureStatus: { type: 'string' }, coverageAchieved: { type: 'object' }, holes: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'crv', 'coverage-closure']
}));
