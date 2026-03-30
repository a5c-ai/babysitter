/**
 * @process specializations/cryptography-blockchain/yield-aggregator
 * @description Yield Aggregator Development - Development of automated yield optimization protocols that allocate capital
 * across DeFi strategies to maximize returns.
 * @inputs { projectName: string, underlyingAsset: string, strategies?: array, performanceFee?: number }
 * @outputs { success: boolean, aggregatorInfo: object, contracts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/yield-aggregator', {
 *   projectName: 'Yield Optimizer',
 *   underlyingAsset: 'USDC',
 *   strategies: ['aave-lending', 'compound-lending', 'curve-staking'],
 *   performanceFee: 10
 * });
 *
 * @references
 * - Yearn Finance Documentation: https://docs.yearn.finance/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    underlyingAsset,
    strategies = [],
    performanceFee = 10,
    managementFee = 2,
    features = ['auto-harvest', 'strategy-migration'],
    framework = 'foundry',
    outputDir = 'yield-aggregator-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Yield Aggregator Development: ${projectName}`);

  const strategyInterface = await ctx.task(strategyInterfaceTask, { projectName, outputDir });
  artifacts.push(...strategyInterface.artifacts);

  const vaultImplementation = await ctx.task(vaultImplementationTask, { projectName, underlyingAsset, framework, outputDir });
  artifacts.push(...vaultImplementation.artifacts);

  const allocationLogic = await ctx.task(allocationLogicTask, { projectName, strategies, outputDir });
  artifacts.push(...allocationLogic.artifacts);

  const harvestCompound = await ctx.task(harvestCompoundTask, { projectName, features, outputDir });
  artifacts.push(...harvestCompound.artifacts);

  const feeCalculation = await ctx.task(feeCalculationTask, { projectName, performanceFee, managementFee, outputDir });
  artifacts.push(...feeCalculation.artifacts);

  const emergencyMechanisms = await ctx.task(emergencyMechanismsTask, { projectName, outputDir });
  artifacts.push(...emergencyMechanisms.artifacts);

  const strategyMigration = await ctx.task(strategyMigrationTask, { projectName, outputDir });
  artifacts.push(...strategyMigration.artifacts);

  const riskManagement = await ctx.task(riskManagementTask, { projectName, outputDir });
  artifacts.push(...riskManagement.artifacts);

  const testingSuite = await ctx.task(testingSuiteTask, { projectName, framework, outputDir });
  artifacts.push(...testingSuite.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    aggregatorInfo: { underlyingAsset, strategies, performanceFee, managementFee, features },
    contracts: vaultImplementation.contracts,
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/yield-aggregator', timestamp: startTime }
  };
}

export const strategyInterfaceTask = defineTask('strategy-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategy Interface - ${args.projectName}`,
  agent: {
    name: 'strategy-architect',
    prompt: {
      role: 'Strategy Interface Architect',
      task: 'Design strategy interface',
      context: args,
      instructions: ['1. Define IStrategy interface', '2. Add deposit/withdraw functions', '3. Define estimatedTotalAssets', '4. Add harvest function', '5. Define want token', '6. Add emergency exit', '7. Define isActive', '8. Add migration functions', '9. Document interface', '10. Create base strategy'],
      outputFormat: 'JSON with strategy interface'
    },
    outputSchema: { type: 'object', required: ['interface', 'baseSrategy', 'artifacts'], properties: { interface: { type: 'object' }, baseStrategy: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'strategy']
}));

export const vaultImplementationTask = defineTask('vault-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vault Implementation - ${args.projectName}`,
  agent: {
    name: 'vault-developer',
    prompt: {
      role: 'Yield Vault Developer',
      task: 'Implement yield vault',
      context: args,
      instructions: ['1. Implement ERC4626 vault', '2. Add strategy management', '3. Implement deposit/withdraw', '4. Track total assets', '5. Implement share pricing', '6. Add debt management', '7. Implement accounting', '8. Add access control', '9. Optimize gas', '10. Document architecture'],
      outputFormat: 'JSON with vault implementation'
    },
    outputSchema: { type: 'object', required: ['contracts', 'artifacts'], properties: { contracts: { type: 'object' }, abi: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'vault']
}));

export const allocationLogicTask = defineTask('allocation-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Allocation Logic - ${args.projectName}`,
  agent: {
    name: 'allocation-engineer',
    prompt: {
      role: 'Capital Allocation Engineer',
      task: 'Implement allocation logic',
      context: args,
      instructions: ['1. Design allocation algorithm', '2. Implement debt ratio', '3. Add strategy weighting', '4. Implement rebalancing', '5. Handle allocation limits', '6. Track strategy performance', '7. Implement optimal allocation', '8. Add allocation triggers', '9. Test allocation', '10. Document allocation rules'],
      outputFormat: 'JSON with allocation logic'
    },
    outputSchema: { type: 'object', required: ['allocationAlgorithm', 'artifacts'], properties: { allocationAlgorithm: { type: 'object' }, debtRatios: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'allocation']
}));

export const harvestCompoundTask = defineTask('harvest-compound', (args, taskCtx) => ({
  kind: 'agent',
  title: `Harvest and Compound - ${args.projectName}`,
  agent: {
    name: 'harvest-engineer',
    prompt: {
      role: 'Harvest/Compound Engineer',
      task: 'Implement harvest and compound',
      context: args,
      instructions: ['1. Implement harvest function', '2. Add auto-compound', '3. Handle reward tokens', '4. Implement swap logic', '5. Add harvest triggers', '6. Track harvest history', '7. Calculate APY', '8. Implement keeper interface', '9. Test harvesting', '10. Document harvest flow'],
      outputFormat: 'JSON with harvest/compound'
    },
    outputSchema: { type: 'object', required: ['harvestMechanism', 'artifacts'], properties: { harvestMechanism: { type: 'object' }, compoundLogic: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'harvest']
}));

export const feeCalculationTask = defineTask('fee-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fee Calculation - ${args.projectName}`,
  agent: {
    name: 'fee-engineer',
    prompt: {
      role: 'Fee Calculation Engineer',
      task: 'Implement fee calculation',
      context: args,
      instructions: ['1. Implement performance fee', '2. Implement management fee', '3. Calculate fee on harvest', '4. Set fee recipients', '5. Add fee caps', '6. Track fee accounting', '7. Implement fee withdrawal', '8. Add fee waivers', '9. Test fee accuracy', '10. Document fee structure'],
      outputFormat: 'JSON with fee calculation'
    },
    outputSchema: { type: 'object', required: ['feeStructure', 'artifacts'], properties: { feeStructure: { type: 'object' }, feeCalculation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'fees']
}));

export const emergencyMechanismsTask = defineTask('emergency-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Emergency Mechanisms - ${args.projectName}`,
  agent: {
    name: 'emergency-engineer',
    prompt: {
      role: 'Emergency Systems Engineer',
      task: 'Implement emergency mechanisms',
      context: args,
      instructions: ['1. Implement emergency exit', '2. Add strategy shutdown', '3. Implement emergency withdraw', '4. Add pause functionality', '5. Create guardian role', '6. Handle stuck funds', '7. Implement recovery', '8. Document procedures', '9. Test emergencies', '10. Create runbook'],
      outputFormat: 'JSON with emergency mechanisms'
    },
    outputSchema: { type: 'object', required: ['emergencyFunctions', 'artifacts'], properties: { emergencyFunctions: { type: 'array' }, procedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'emergency']
}));

export const strategyMigrationTask = defineTask('strategy-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategy Migration - ${args.projectName}`,
  agent: {
    name: 'migration-engineer',
    prompt: {
      role: 'Strategy Migration Engineer',
      task: 'Implement strategy migration',
      context: args,
      instructions: ['1. Implement migration function', '2. Handle fund transfer', '3. Update debt allocations', '4. Verify migration success', '5. Handle partial migrations', '6. Add migration queue', '7. Implement rollback', '8. Test migrations', '9. Document process', '10. Create migration tools'],
      outputFormat: 'JSON with migration'
    },
    outputSchema: { type: 'object', required: ['migrationProcess', 'artifacts'], properties: { migrationProcess: { type: 'object' }, rollbackPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'migration']
}));

export const riskManagementTask = defineTask('risk-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Management - ${args.projectName}`,
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'DeFi Risk Manager',
      task: 'Implement risk parameters',
      context: args,
      instructions: ['1. Define risk parameters', '2. Set strategy limits', '3. Implement loss limits', '4. Add risk scoring', '5. Monitor strategy health', '6. Implement circuit breakers', '7. Add liquidity checks', '8. Define risk thresholds', '9. Create risk dashboard', '10. Document risk management'],
      outputFormat: 'JSON with risk management'
    },
    outputSchema: { type: 'object', required: ['riskParameters', 'artifacts'], properties: { riskParameters: { type: 'object' }, limits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'risk']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'yield-tester',
    prompt: {
      role: 'Yield Aggregator Tester',
      task: 'Create comprehensive tests',
      context: args,
      instructions: ['1. Test deposits/withdrawals', '2. Test strategy allocation', '3. Test harvesting', '4. Test fee calculations', '5. Test migrations', '6. Test emergencies', '7. Run fuzz tests', '8. Test invariants', '9. Fork mainnet tests', '10. Achieve coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'yield', 'testing']
}));
