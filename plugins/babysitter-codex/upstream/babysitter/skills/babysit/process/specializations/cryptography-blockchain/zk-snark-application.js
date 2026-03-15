/**
 * @process specializations/cryptography-blockchain/zk-snark-application
 * @description ZK-SNARK Application Development - Development of ZK-SNARK-based applications with trusted setup ceremonies,
 * proof generation, and on-chain verification.
 * @inputs { projectName: string, provingSystem?: string, useCase?: string, trustedSetup?: string }
 * @outputs { success: boolean, applicationInfo: object, contracts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/zk-snark-application', {
 *   projectName: 'Private Voting',
 *   provingSystem: 'groth16',
 *   useCase: 'anonymous-voting',
 *   trustedSetup: 'powers-of-tau'
 * });
 *
 * @references
 * - Groth16: https://eprint.iacr.org/2016/260.pdf
 * - SnarkJS: https://github.com/iden3/snarkjs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    provingSystem = 'groth16',
    useCase = 'general',
    trustedSetup = 'powers-of-tau',
    securityLevel = 128,
    outputDir = 'zksnark-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ZK-SNARK Application Development: ${projectName}`);

  const applicationDesign = await ctx.task(applicationDesignTask, { projectName, useCase, provingSystem, outputDir });
  artifacts.push(...applicationDesign.artifacts);

  const circuitDevelopment = await ctx.task(circuitDevelopmentTask, { projectName, provingSystem, outputDir });
  artifacts.push(...circuitDevelopment.artifacts);

  const trustedSetupCeremony = await ctx.task(trustedSetupTask, { projectName, trustedSetup, securityLevel, outputDir });
  artifacts.push(...trustedSetupCeremony.artifacts);

  const proofGeneration = await ctx.task(proofGenerationTask, { projectName, provingSystem, outputDir });
  artifacts.push(...proofGeneration.artifacts);

  const verifierContract = await ctx.task(verifierContractTask, { projectName, provingSystem, outputDir });
  artifacts.push(...verifierContract.artifacts);

  const proofAggregation = await ctx.task(proofAggregationTask, { projectName, outputDir });
  artifacts.push(...proofAggregation.artifacts);

  const integrationLayer = await ctx.task(integrationLayerTask, { projectName, outputDir });
  artifacts.push(...integrationLayer.artifacts);

  const applicationTesting = await ctx.task(applicationTestingTask, { projectName, outputDir });
  artifacts.push(...applicationTesting.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    applicationInfo: { provingSystem, useCase, trustedSetup, securityLevel },
    contracts: verifierContract.contracts,
    testResults: applicationTesting,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/zk-snark-application', timestamp: startTime }
  };
}

export const applicationDesignTask = defineTask('application-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Application Design - ${args.projectName}`,
  agent: {
    name: 'zksnark-architect',
    prompt: {
      role: 'ZK-SNARK Application Architect',
      task: 'Design ZK-SNARK application',
      context: args,
      instructions: ['1. Define application requirements', '2. Design proof structure', '3. Plan public inputs', '4. Design private inputs', '5. Plan verification flow', '6. Design user experience', '7. Plan gas optimization', '8. Handle proof batching', '9. Document architecture', '10. Create system diagram'],
      outputFormat: 'JSON with application design'
    },
    outputSchema: { type: 'object', required: ['design', 'proofStructure', 'artifacts'], properties: { design: { type: 'object' }, proofStructure: { type: 'object' }, userFlow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'design']
}));

export const circuitDevelopmentTask = defineTask('circuit-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Circuit Development - ${args.projectName}`,
  agent: {
    name: 'circuit-developer',
    prompt: {
      role: 'ZK Circuit Developer',
      task: 'Develop ZK-SNARK circuits',
      context: args,
      instructions: ['1. Implement main circuit', '2. Add constraint checks', '3. Optimize constraint count', '4. Implement helper circuits', '5. Add range checks', '6. Implement hash functions', '7. Test circuit correctness', '8. Profile constraints', '9. Document circuit logic', '10. Create test vectors'],
      outputFormat: 'JSON with circuit development'
    },
    outputSchema: { type: 'object', required: ['circuits', 'constraintCount', 'artifacts'], properties: { circuits: { type: 'array' }, constraintCount: { type: 'number' }, circuitFiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'circuits']
}));

export const trustedSetupTask = defineTask('trusted-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trusted Setup - ${args.projectName}`,
  agent: {
    name: 'setup-coordinator',
    prompt: {
      role: 'Trusted Setup Coordinator',
      task: 'Coordinate trusted setup ceremony',
      context: args,
      instructions: ['1. Plan ceremony structure', '2. Generate initial params', '3. Coordinate contributions', '4. Verify contributions', '5. Apply random beacon', '6. Generate final params', '7. Verify setup security', '8. Distribute proving keys', '9. Publish verification keys', '10. Document ceremony'],
      outputFormat: 'JSON with trusted setup'
    },
    outputSchema: { type: 'object', required: ['ceremony', 'provingKey', 'artifacts'], properties: { ceremony: { type: 'object' }, provingKey: { type: 'string' }, verificationKey: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'setup']
}));

export const proofGenerationTask = defineTask('proof-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Proof Generation - ${args.projectName}`,
  agent: {
    name: 'proof-engineer',
    prompt: {
      role: 'Proof Generation Engineer',
      task: 'Implement proof generation system',
      context: args,
      instructions: ['1. Implement prover client', '2. Optimize proof generation', '3. Handle witness computation', '4. Add parallel proving', '5. Implement proof caching', '6. Add progress reporting', '7. Handle errors gracefully', '8. Benchmark performance', '9. Test proof validity', '10. Document prover API'],
      outputFormat: 'JSON with proof generation'
    },
    outputSchema: { type: 'object', required: ['proverSystem', 'performance', 'artifacts'], properties: { proverSystem: { type: 'object' }, performance: { type: 'object' }, proverAPI: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'prover']
}));

export const verifierContractTask = defineTask('verifier-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verifier Contract - ${args.projectName}`,
  agent: {
    name: 'verifier-developer',
    prompt: {
      role: 'Verifier Contract Developer',
      task: 'Develop on-chain verifier',
      context: args,
      instructions: ['1. Generate verifier contract', '2. Optimize gas usage', '3. Add public input validation', '4. Implement proof decoding', '5. Add pairing checks', '6. Implement batched verification', '7. Add access control', '8. Test verification', '9. Audit contract', '10. Document interface'],
      outputFormat: 'JSON with verifier contract'
    },
    outputSchema: { type: 'object', required: ['contracts', 'gasEstimates', 'artifacts'], properties: { contracts: { type: 'object' }, gasEstimates: { type: 'object' }, verifierInterface: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'verifier']
}));

export const proofAggregationTask = defineTask('proof-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Proof Aggregation - ${args.projectName}`,
  agent: {
    name: 'aggregation-engineer',
    prompt: {
      role: 'Proof Aggregation Engineer',
      task: 'Implement proof aggregation',
      context: args,
      instructions: ['1. Design aggregation scheme', '2. Implement recursive proofs', '3. Optimize aggregation', '4. Handle batch sizes', '5. Implement incremental aggregation', '6. Add verification shortcuts', '7. Benchmark aggregation', '8. Test with various sizes', '9. Document aggregation', '10. Create usage examples'],
      outputFormat: 'JSON with proof aggregation'
    },
    outputSchema: { type: 'object', required: ['aggregationSystem', 'performance', 'artifacts'], properties: { aggregationSystem: { type: 'object' }, performance: { type: 'object' }, batchSizes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'aggregation']
}));

export const integrationLayerTask = defineTask('integration-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Layer - ${args.projectName}`,
  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'ZK-SNARK Integration Engineer',
      task: 'Create integration layer',
      context: args,
      instructions: ['1. Create SDK interface', '2. Add web integration', '3. Implement mobile support', '4. Add WASM prover', '5. Create API endpoints', '6. Implement webhooks', '7. Add monitoring', '8. Create client libraries', '9. Document APIs', '10. Create examples'],
      outputFormat: 'JSON with integration layer'
    },
    outputSchema: { type: 'object', required: ['sdk', 'endpoints', 'artifacts'], properties: { sdk: { type: 'object' }, endpoints: { type: 'array' }, clientLibraries: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'integration']
}));

export const applicationTestingTask = defineTask('application-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Application Testing - ${args.projectName}`,
  agent: {
    name: 'zksnark-tester',
    prompt: {
      role: 'ZK-SNARK Application Tester',
      task: 'Test ZK-SNARK application',
      context: args,
      instructions: ['1. Test proof generation', '2. Test verification', '3. Test integration', '4. Test edge cases', '5. Test performance', '6. Test gas usage', '7. Test user flows', '8. Security testing', '9. Load testing', '10. Document test results'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['testResults', 'coverage', 'artifacts'], properties: { testResults: { type: 'object' }, coverage: { type: 'number' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['zksnark', 'testing']
}));
