/**
 * @process specializations/cryptography-blockchain/governance-system
 * @description Governance System Implementation - On-chain governance implementation with proposal creation, voting mechanisms,
 * timelock execution, and delegation.
 * @inputs { projectName: string, votingToken: string, quorum?: number, votingPeriod?: number, timelockDelay?: number }
 * @outputs { success: boolean, governanceInfo: object, contracts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/governance-system', {
 *   projectName: 'Protocol Governance',
 *   votingToken: '0x...',
 *   quorum: 4, // 4%
 *   votingPeriod: 50400, // ~1 week in blocks
 *   timelockDelay: 172800 // 2 days in seconds
 * });
 *
 * @references
 * - OpenZeppelin Governor: https://docs.openzeppelin.com/contracts/4.x/governance
 * - Compound Governance: https://compound.finance/docs/governance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    votingToken,
    quorum = 4,
    votingPeriod = 50400,
    timelockDelay = 172800,
    features = ['delegation', 'snapshot-voting'],
    framework = 'foundry',
    outputDir = 'governance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Governance System Development: ${projectName}`);

  const votingTokenDesign = await ctx.task(votingTokenTask, { projectName, votingToken, outputDir });
  artifacts.push(...votingTokenDesign.artifacts);

  const proposalLifecycle = await ctx.task(proposalLifecycleTask, { projectName, votingPeriod, outputDir });
  artifacts.push(...proposalLifecycle.artifacts);

  const votingMechanism = await ctx.task(votingMechanismTask, { projectName, quorum, votingPeriod, outputDir });
  artifacts.push(...votingMechanism.artifacts);

  const delegationSystem = await ctx.task(delegationSystemTask, { projectName, outputDir });
  artifacts.push(...delegationSystem.artifacts);

  const timelockSetup = await ctx.task(timelockSetupTask, { projectName, timelockDelay, outputDir });
  artifacts.push(...timelockSetup.artifacts);

  const executionMechanism = await ctx.task(executionMechanismTask, { projectName, outputDir });
  artifacts.push(...executionMechanism.artifacts);

  const attackMitigation = await ctx.task(attackMitigationTask, { projectName, outputDir });
  artifacts.push(...attackMitigation.artifacts);

  const offChainIntegration = await ctx.task(offChainIntegrationTask, { projectName, features, outputDir });
  artifacts.push(...offChainIntegration.artifacts);

  const testingSuite = await ctx.task(testingSuiteTask, { projectName, framework, outputDir });
  artifacts.push(...testingSuite.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    governanceInfo: { votingToken, quorum, votingPeriod, timelockDelay, features },
    contracts: { governor: proposalLifecycle.governorContract, timelock: timelockSetup.timelockContract },
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/governance-system', timestamp: startTime }
  };
}

export const votingTokenTask = defineTask('voting-token', (args, taskCtx) => ({
  kind: 'agent',
  title: `Voting Token - ${args.projectName}`,
  agent: {
    name: 'voting-token-developer',
    prompt: {
      role: 'Voting Token Developer',
      task: 'Implement voting token (ERC20Votes)',
      context: args,
      instructions: ['1. Implement ERC20Votes', '2. Add checkpoints', '3. Implement delegation', '4. Add getVotes function', '5. Implement getPastVotes', '6. Add delegate function', '7. Implement permit', '8. Track voting power', '9. Test vote tracking', '10. Document token'],
      outputFormat: 'JSON with voting token'
    },
    outputSchema: { type: 'object', required: ['tokenContract', 'artifacts'], properties: { tokenContract: { type: 'string' }, checkpointMechanism: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'voting-token']
}));

export const proposalLifecycleTask = defineTask('proposal-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Proposal Lifecycle - ${args.projectName}`,
  agent: {
    name: 'governor-developer',
    prompt: {
      role: 'Governor Developer',
      task: 'Implement proposal lifecycle',
      context: args,
      instructions: ['1. Implement propose function', '2. Add proposal states', '3. Implement voting delay', '4. Add voting period', '5. Implement cancel', '6. Add queue function', '7. Implement execute', '8. Track proposal state', '9. Emit proper events', '10. Document lifecycle'],
      outputFormat: 'JSON with proposal lifecycle'
    },
    outputSchema: { type: 'object', required: ['governorContract', 'proposalStates', 'artifacts'], properties: { governorContract: { type: 'string' }, proposalStates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'proposals']
}));

export const votingMechanismTask = defineTask('voting-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Voting Mechanism - ${args.projectName}`,
  agent: {
    name: 'voting-engineer',
    prompt: {
      role: 'Voting Mechanism Engineer',
      task: 'Implement voting mechanism',
      context: args,
      instructions: ['1. Implement castVote', '2. Add castVoteWithReason', '3. Implement castVoteBySig', '4. Calculate quorum', '5. Implement vote counting', '6. Add vote weighting', '7. Handle vote changes', '8. Implement vote receipts', '9. Test voting', '10. Document voting'],
      outputFormat: 'JSON with voting mechanism'
    },
    outputSchema: { type: 'object', required: ['votingFunctions', 'quorumCalculation', 'artifacts'], properties: { votingFunctions: { type: 'array' }, quorumCalculation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'voting']
}));

export const delegationSystemTask = defineTask('delegation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delegation System - ${args.projectName}`,
  agent: {
    name: 'delegation-developer',
    prompt: {
      role: 'Delegation System Developer',
      task: 'Implement delegation system',
      context: args,
      instructions: ['1. Implement delegate function', '2. Add delegateBySig', '3. Track delegations', '4. Handle self-delegation', '5. Implement delegate checkpoints', '6. Add delegation events', '7. Support partial delegation', '8. Track voting power', '9. Test delegation', '10. Document delegation'],
      outputFormat: 'JSON with delegation system'
    },
    outputSchema: { type: 'object', required: ['delegationFunctions', 'artifacts'], properties: { delegationFunctions: { type: 'array' }, checkpoints: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'delegation']
}));

export const timelockSetupTask = defineTask('timelock-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timelock Setup - ${args.projectName}`,
  agent: {
    name: 'timelock-developer',
    prompt: {
      role: 'Timelock Developer',
      task: 'Setup timelock controller',
      context: args,
      instructions: ['1. Implement TimelockController', '2. Set minimum delay', '3. Configure proposer role', '4. Configure executor role', '5. Add admin role', '6. Implement schedule', '7. Implement execute', '8. Add cancel function', '9. Test timelock', '10. Document timelock'],
      outputFormat: 'JSON with timelock setup'
    },
    outputSchema: { type: 'object', required: ['timelockContract', 'delay', 'artifacts'], properties: { timelockContract: { type: 'string' }, delay: { type: 'number' }, roles: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'timelock']
}));

export const executionMechanismTask = defineTask('execution-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execution Mechanism - ${args.projectName}`,
  agent: {
    name: 'execution-engineer',
    prompt: {
      role: 'Proposal Execution Engineer',
      task: 'Implement execution mechanism',
      context: args,
      instructions: ['1. Implement queue to timelock', '2. Add execute function', '3. Handle multi-call', '4. Verify execution success', '5. Handle failed executions', '6. Implement eta tracking', '7. Add grace period', '8. Emit execution events', '9. Test execution', '10. Document execution'],
      outputFormat: 'JSON with execution mechanism'
    },
    outputSchema: { type: 'object', required: ['executionFunctions', 'artifacts'], properties: { executionFunctions: { type: 'array' }, multiCallSupport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'execution']
}));

export const attackMitigationTask = defineTask('attack-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Attack Mitigation - ${args.projectName}`,
  agent: {
    name: 'governance-security',
    prompt: {
      role: 'Governance Security Engineer',
      task: 'Implement governance attack mitigation',
      context: args,
      instructions: ['1. Mitigate flash loan attacks', '2. Add proposal threshold', '3. Implement vote delay', '4. Add quorum requirements', '5. Prevent spam proposals', '6. Add emergency guardian', '7. Implement proposal veto', '8. Add vote checkpoints', '9. Test attack vectors', '10. Document mitigations'],
      outputFormat: 'JSON with attack mitigation'
    },
    outputSchema: { type: 'object', required: ['mitigations', 'artifacts'], properties: { mitigations: { type: 'array' }, attackVectors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'security']
}));

export const offChainIntegrationTask = defineTask('off-chain-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Off-Chain Integration - ${args.projectName}`,
  agent: {
    name: 'snapshot-integrator',
    prompt: {
      role: 'Off-Chain Voting Integrator',
      task: 'Integrate off-chain voting',
      context: args,
      instructions: ['1. Integrate Snapshot', '2. Configure voting strategies', '3. Set up space', '4. Add proposal validation', '5. Configure ENS', '6. Test off-chain voting', '7. Bridge to on-chain', '8. Add signature verification', '9. Document integration', '10. Create voting UI'],
      outputFormat: 'JSON with off-chain integration'
    },
    outputSchema: { type: 'object', required: ['snapshotConfig', 'artifacts'], properties: { snapshotConfig: { type: 'object' }, votingStrategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'snapshot']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'governance-tester',
    prompt: {
      role: 'Governance Tester',
      task: 'Create comprehensive tests',
      context: args,
      instructions: ['1. Test proposal creation', '2. Test voting', '3. Test delegation', '4. Test timelock', '5. Test execution', '6. Test quorum', '7. Test attack vectors', '8. Run fuzz tests', '9. Test edge cases', '10. Achieve coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'governance', 'testing']
}));
