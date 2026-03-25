/**
 * @process specializations/cryptography-blockchain/staking-contract
 * @description Staking Contract Development - Implementation of token staking mechanisms with reward distribution,
 * lockup periods, and delegation support.
 * @inputs { projectName: string, stakingToken: string, rewardToken?: string, rewardRate?: string, lockupPeriod?: number }
 * @outputs { success: boolean, stakingInfo: object, contracts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/staking-contract', {
 *   projectName: 'Protocol Staking',
 *   stakingToken: '0x...',
 *   rewardToken: '0x...',
 *   rewardRate: '100', // tokens per second
 *   lockupPeriod: 7 * 24 * 60 * 60 // 7 days in seconds
 * });
 *
 * @references
 * - Synthetix Staking Rewards: https://docs.synthetix.io/contracts/source/contracts/stakingrewards/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stakingToken,
    rewardToken,
    rewardRate = '100',
    lockupPeriod = 0,
    features = ['delegation', 'emergency-withdraw'],
    framework = 'foundry',
    outputDir = 'staking-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Staking Contract Development: ${projectName}`);

  // Phase 1: Staking Mechanism Design
  const stakingDesign = await ctx.task(stakingDesignTask, { projectName, stakingToken, rewardToken, rewardRate, lockupPeriod, features, outputDir });
  artifacts.push(...stakingDesign.artifacts);

  // Phase 2: Reward Calculation Implementation
  const rewardCalculation = await ctx.task(rewardCalculationTask, { projectName, stakingDesign, outputDir });
  artifacts.push(...rewardCalculation.artifacts);

  // Phase 3: Lockup and Vesting Logic
  const lockupVesting = await ctx.task(lockupVestingTask, { projectName, lockupPeriod, outputDir });
  artifacts.push(...lockupVesting.artifacts);

  // Phase 4: Delegation Functionality (if enabled)
  if (features.includes('delegation')) {
    const delegation = await ctx.task(delegationTask, { projectName, outputDir });
    artifacts.push(...delegation.artifacts);
  }

  // Phase 5: Emergency Withdraw
  const emergencyWithdraw = await ctx.task(emergencyWithdrawTask, { projectName, outputDir });
  artifacts.push(...emergencyWithdraw.artifacts);

  // Phase 6: Reward Rate Adjustment
  const rewardAdjustment = await ctx.task(rewardAdjustmentTask, { projectName, outputDir });
  artifacts.push(...rewardAdjustment.artifacts);

  // Phase 7: Contract Implementation
  const contractImplementation = await ctx.task(contractImplementationTask, { projectName, stakingDesign, framework, outputDir });
  artifacts.push(...contractImplementation.artifacts);

  // Phase 8: Testing
  const testingSuite = await ctx.task(testingSuiteTask, { projectName, framework, outputDir });
  artifacts.push(...testingSuite.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    stakingInfo: { stakingToken, rewardToken, rewardRate, lockupPeriod, features },
    contracts: contractImplementation.contracts,
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/staking-contract', timestamp: startTime }
  };
}

export const stakingDesignTask = defineTask('staking-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Staking Design - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Staking Mechanism Architect',
      task: 'Design staking mechanism',
      context: args,
      instructions: ['1. Define staking token and rewards', '2. Design reward distribution model', '3. Plan lockup mechanism', '4. Design delegation system', '5. Plan emergency procedures', '6. Define reward rate adjustment', '7. Design unstaking flow', '8. Plan reward claiming', '9. Consider gas optimization', '10. Document staking specification'],
      outputFormat: 'JSON with staking design'
    },
    outputSchema: { type: 'object', required: ['stakingModel', 'artifacts'], properties: { stakingModel: { type: 'object' }, rewardModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'design']
}));

export const rewardCalculationTask = defineTask('reward-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reward Calculation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Reward Calculation Engineer',
      task: 'Implement reward calculation',
      context: args,
      instructions: ['1. Implement rewardPerToken calculation', '2. Track rewardPerTokenStored', '3. Calculate earned rewards', '4. Handle reward rate changes', '5. Implement per-second rewards', '6. Track user reward debt', '7. Handle precision correctly', '8. Implement reward claiming', '9. Test calculation accuracy', '10. Document reward math'],
      outputFormat: 'JSON with reward calculation'
    },
    outputSchema: { type: 'object', required: ['rewardFormula', 'artifacts'], properties: { rewardFormula: { type: 'object' }, precision: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'rewards']
}));

export const lockupVestingTask = defineTask('lockup-vesting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lockup and Vesting - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Lockup/Vesting Engineer',
      task: 'Implement lockup and vesting',
      context: args,
      instructions: ['1. Implement lockup period', '2. Track unlock timestamps', '3. Implement vesting schedule', '4. Handle early withdrawal penalty', '5. Implement time-weighted rewards', '6. Add lockup extensions', '7. Handle multiple lockups', '8. Implement unlock notifications', '9. Test lockup scenarios', '10. Document lockup rules'],
      outputFormat: 'JSON with lockup/vesting'
    },
    outputSchema: { type: 'object', required: ['lockupConfig', 'artifacts'], properties: { lockupConfig: { type: 'object' }, vestingSchedule: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'lockup']
}));

export const delegationTask = defineTask('delegation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delegation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Delegation Developer',
      task: 'Implement delegation functionality',
      context: args,
      instructions: ['1. Implement delegate function', '2. Track delegated amounts', '3. Handle delegation changes', '4. Implement vote weight', '5. Add delegation checkpoints', '6. Handle self-delegation', '7. Implement undelegate', '8. Track delegation history', '9. Test delegation', '10. Document delegation'],
      outputFormat: 'JSON with delegation'
    },
    outputSchema: { type: 'object', required: ['delegationSystem', 'artifacts'], properties: { delegationSystem: { type: 'object' }, checkpoints: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'delegation']
}));

export const emergencyWithdrawTask = defineTask('emergency-withdraw', (args, taskCtx) => ({
  kind: 'agent',
  title: `Emergency Withdraw - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Emergency Systems Engineer',
      task: 'Implement emergency withdraw',
      context: args,
      instructions: ['1. Implement emergencyWithdraw', '2. Skip reward calculation', '3. Bypass lockup if needed', '4. Add admin emergency functions', '5. Implement pause mechanism', '6. Handle partial emergencies', '7. Emit emergency events', '8. Document emergency procedures', '9. Test emergency scenarios', '10. Create emergency runbook'],
      outputFormat: 'JSON with emergency withdraw'
    },
    outputSchema: { type: 'object', required: ['emergencyFunctions', 'artifacts'], properties: { emergencyFunctions: { type: 'array' }, procedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'emergency']
}));

export const rewardAdjustmentTask = defineTask('reward-adjustment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reward Adjustment - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Reward Administration Engineer',
      task: 'Implement reward rate adjustment',
      context: args,
      instructions: ['1. Implement setRewardRate', '2. Handle mid-period changes', '3. Add reward notification', '4. Implement reward epochs', '5. Add rate limits', '6. Handle zero rewards', '7. Implement reward recovery', '8. Track reward history', '9. Test rate changes', '10. Document administration'],
      outputFormat: 'JSON with reward adjustment'
    },
    outputSchema: { type: 'object', required: ['adjustmentFunctions', 'artifacts'], properties: { adjustmentFunctions: { type: 'array' }, rateLimits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'rewards']
}));

export const contractImplementationTask = defineTask('contract-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contract Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'Staking Contract Developer',
      task: 'Implement staking contract',
      context: args,
      instructions: ['1. Implement stake function', '2. Implement unstake function', '3. Implement getReward', '4. Add exit function', '5. Implement notifyReward', '6. Add access control', '7. Optimize gas', '8. Add proper events', '9. Document NatSpec', '10. Create deployment script'],
      outputFormat: 'JSON with implementation'
    },
    outputSchema: { type: 'object', required: ['contracts', 'artifacts'], properties: { contracts: { type: 'object' }, abi: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'implementation']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Staking Contract Tester',
      task: 'Create comprehensive tests',
      context: args,
      instructions: ['1. Test staking', '2. Test unstaking', '3. Test reward claiming', '4. Test lockup periods', '5. Test delegation', '6. Test emergency withdraw', '7. Test rate changes', '8. Run fuzz tests', '9. Test edge cases', '10. Achieve high coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'staking', 'testing']
}));
