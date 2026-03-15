/**
 * @process specializations/cryptography-blockchain/zk-rollup-development
 * @description ZK-Rollup Development - Development of zero-knowledge rollup solutions for Ethereum scalability with
 * state compression, data availability, and validity proofs.
 * @inputs { projectName: string, rollupType?: string, provingSystem?: string, targetTps?: number }
 * @outputs { success: boolean, rollupInfo: object, components: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/zk-rollup-development', {
 *   projectName: 'ZK Payment Rollup',
 *   rollupType: 'zk-snark',
 *   provingSystem: 'plonk',
 *   targetTps: 2000
 * });
 *
 * @references
 * - zkSync: https://docs.zksync.io/
 * - StarkNet: https://docs.starknet.io/
 * - Polygon zkEVM: https://wiki.polygon.technology/docs/zkEVM/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rollupType = 'zk-snark',
    provingSystem = 'plonk',
    targetTps = 1000,
    dataAvailability = 'on-chain',
    outputDir = 'zkrollup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ZK-Rollup Development: ${projectName}`);

  const architectureDesign = await ctx.task(architectureDesignTask, { projectName, rollupType, targetTps, outputDir });
  artifacts.push(...architectureDesign.artifacts);

  const stateManagement = await ctx.task(stateManagementTask, { projectName, outputDir });
  artifacts.push(...stateManagement.artifacts);

  const transactionProcessing = await ctx.task(transactionProcessingTask, { projectName, targetTps, outputDir });
  artifacts.push(...transactionProcessing.artifacts);

  const proofGeneration = await ctx.task(proofGenerationTask, { projectName, provingSystem, outputDir });
  artifacts.push(...proofGeneration.artifacts);

  const dataAvailabilityLayer = await ctx.task(dataAvailabilityTask, { projectName, dataAvailability, outputDir });
  artifacts.push(...dataAvailabilityLayer.artifacts);

  const bridgeContracts = await ctx.task(bridgeContractsTask, { projectName, outputDir });
  artifacts.push(...bridgeContracts.artifacts);

  const sequencerSystem = await ctx.task(sequencerSystemTask, { projectName, outputDir });
  artifacts.push(...sequencerSystem.artifacts);

  const integrationTesting = await ctx.task(integrationTestingTask, { projectName, outputDir });
  artifacts.push(...integrationTesting.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    rollupInfo: { rollupType, provingSystem, targetTps, dataAvailability },
    components: { state: stateManagement, bridge: bridgeContracts, sequencer: sequencerSystem },
    testResults: integrationTesting,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/zk-rollup-development', timestamp: startTime }
  };
}

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Architecture Design - ${args.projectName}`,
  agent: {
    name: 'rollup-architect',
    prompt: {
      role: 'ZK-Rollup Architect',
      task: 'Design ZK-Rollup architecture',
      context: args,
      instructions: ['1. Design system architecture', '2. Plan state model', '3. Design transaction flow', '4. Plan proving strategy', '5. Design DA solution', '6. Plan bridge architecture', '7. Design sequencer', '8. Plan L1 contracts', '9. Document components', '10. Create architecture diagram'],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: { type: 'object', required: ['architecture', 'components', 'artifacts'], properties: { architecture: { type: 'object' }, components: { type: 'array' }, dataFlow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'architecture']
}));

export const stateManagementTask = defineTask('state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `State Management - ${args.projectName}`,
  agent: {
    name: 'state-engineer',
    prompt: {
      role: 'Rollup State Engineer',
      task: 'Implement state management',
      context: args,
      instructions: ['1. Design state tree', '2. Implement Merkle tree', '3. Add account model', '4. Implement state transitions', '5. Add state compression', '6. Handle state proofs', '7. Implement snapshots', '8. Add state recovery', '9. Test state operations', '10. Document state model'],
      outputFormat: 'JSON with state management'
    },
    outputSchema: { type: 'object', required: ['stateModel', 'merkleTree', 'artifacts'], properties: { stateModel: { type: 'object' }, merkleTree: { type: 'object' }, stateOperations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'state']
}));

export const transactionProcessingTask = defineTask('transaction-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transaction Processing - ${args.projectName}`,
  agent: {
    name: 'tx-engineer',
    prompt: {
      role: 'Transaction Processing Engineer',
      task: 'Implement transaction processing',
      context: args,
      instructions: ['1. Design tx format', '2. Implement tx validation', '3. Add signature verification', '4. Implement batch processing', '5. Add tx ordering', '6. Handle nonces', '7. Implement fee handling', '8. Add tx compression', '9. Test throughput', '10. Document tx flow'],
      outputFormat: 'JSON with transaction processing'
    },
    outputSchema: { type: 'object', required: ['txProcessor', 'throughput', 'artifacts'], properties: { txProcessor: { type: 'object' }, throughput: { type: 'number' }, txFormat: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'transactions']
}));

export const proofGenerationTask = defineTask('proof-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Proof Generation - ${args.projectName}`,
  agent: {
    name: 'prover-engineer',
    prompt: {
      role: 'ZK Prover Engineer',
      task: 'Implement proof generation system',
      context: args,
      instructions: ['1. Design prover architecture', '2. Implement batch circuits', '3. Add parallel proving', '4. Implement recursive proofs', '5. Optimize proof time', '6. Add proof aggregation', '7. Handle prover failures', '8. Implement proof scheduling', '9. Benchmark performance', '10. Document prover'],
      outputFormat: 'JSON with proof generation'
    },
    outputSchema: { type: 'object', required: ['proverSystem', 'performance', 'artifacts'], properties: { proverSystem: { type: 'object' }, performance: { type: 'object' }, proofTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'prover']
}));

export const dataAvailabilityTask = defineTask('data-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Availability - ${args.projectName}`,
  agent: {
    name: 'da-engineer',
    prompt: {
      role: 'Data Availability Engineer',
      task: 'Implement data availability solution',
      context: args,
      instructions: ['1. Design DA strategy', '2. Implement calldata posting', '3. Add data compression', '4. Implement blob transactions', '5. Add DA verification', '6. Handle DA failures', '7. Implement fallback', '8. Test DA costs', '9. Compare DA options', '10. Document DA layer'],
      outputFormat: 'JSON with data availability'
    },
    outputSchema: { type: 'object', required: ['daLayer', 'costs', 'artifacts'], properties: { daLayer: { type: 'object' }, costs: { type: 'object' }, compression: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'data-availability']
}));

export const bridgeContractsTask = defineTask('bridge-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bridge Contracts - ${args.projectName}`,
  agent: {
    name: 'bridge-developer',
    prompt: {
      role: 'Rollup Bridge Developer',
      task: 'Develop L1-L2 bridge contracts',
      context: args,
      instructions: ['1. Implement deposit contract', '2. Implement withdrawal contract', '3. Add proof verification', '4. Handle escape hatch', '5. Implement force exit', '6. Add message passing', '7. Handle finality', '8. Implement timeouts', '9. Test bridge security', '10. Document bridge'],
      outputFormat: 'JSON with bridge contracts'
    },
    outputSchema: { type: 'object', required: ['bridgeContracts', 'security', 'artifacts'], properties: { bridgeContracts: { type: 'object' }, security: { type: 'object' }, escapeHatch: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'bridge']
}));

export const sequencerSystemTask = defineTask('sequencer-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sequencer System - ${args.projectName}`,
  agent: {
    name: 'sequencer-engineer',
    prompt: {
      role: 'Sequencer Engineer',
      task: 'Implement sequencer system',
      context: args,
      instructions: ['1. Design sequencer architecture', '2. Implement tx ordering', '3. Add mempool management', '4. Implement batch creation', '5. Add sequencer rotation', '6. Handle MEV protection', '7. Implement forced inclusion', '8. Add monitoring', '9. Test sequencer', '10. Document operations'],
      outputFormat: 'JSON with sequencer system'
    },
    outputSchema: { type: 'object', required: ['sequencer', 'throughput', 'artifacts'], properties: { sequencer: { type: 'object' }, throughput: { type: 'number' }, mevProtection: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'sequencer']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing - ${args.projectName}`,
  agent: {
    name: 'rollup-tester',
    prompt: {
      role: 'ZK-Rollup Tester',
      task: 'Test rollup integration',
      context: args,
      instructions: ['1. Test deposits', '2. Test withdrawals', '3. Test tx processing', '4. Test proof generation', '5. Test state transitions', '6. Test DA posting', '7. Test bridge security', '8. Load testing', '9. Test failure scenarios', '10. Document results'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['testResults', 'coverage', 'artifacts'], properties: { testResults: { type: 'object' }, coverage: { type: 'number' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zkrollup', 'testing']
}));
