/**
 * @process specializations/cryptography-blockchain/multi-signature-wallet
 * @description Multi-Signature Wallet Development - Development of multi-signature wallets requiring M-of-N approvals for
 * transaction execution with proper signature verification.
 * @inputs { projectName: string, threshold?: number, owners?: number, features?: array }
 * @outputs { success: boolean, walletInfo: object, contracts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/multi-signature-wallet', {
 *   projectName: 'Treasury Multi-sig',
 *   threshold: 3,
 *   owners: 5,
 *   features: ['delegate-call', 'modules', 'guards']
 * });
 *
 * @references
 * - Safe Contracts: https://github.com/safe-global/safe-contracts
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    threshold = 2,
    owners = 3,
    features = ['delegate-call', 'nonce-management'],
    framework = 'foundry',
    outputDir = 'multisig-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Signature Wallet Development: ${projectName}`);

  const signatureCollection = await ctx.task(signatureCollectionTask, { projectName, threshold, owners, outputDir });
  artifacts.push(...signatureCollection.artifacts);

  const thresholdConfig = await ctx.task(thresholdConfigTask, { projectName, threshold, owners, outputDir });
  artifacts.push(...thresholdConfig.artifacts);

  const ownerManagement = await ctx.task(ownerManagementTask, { projectName, outputDir });
  artifacts.push(...ownerManagement.artifacts);

  const transactionQueue = await ctx.task(transactionQueueTask, { projectName, outputDir });
  artifacts.push(...transactionQueue.artifacts);

  const signatureVerification = await ctx.task(signatureVerificationTask, { projectName, outputDir });
  artifacts.push(...signatureVerification.artifacts);

  const nonceManagement = await ctx.task(nonceManagementTask, { projectName, outputDir });
  artifacts.push(...nonceManagement.artifacts);

  const delegateCallSupport = await ctx.task(delegateCallSupportTask, { projectName, features, outputDir });
  artifacts.push(...delegateCallSupport.artifacts);

  const moduleSystem = await ctx.task(moduleSystemTask, { projectName, features, outputDir });
  artifacts.push(...moduleSystem.artifacts);

  const testingSuite = await ctx.task(testingSuiteTask, { projectName, framework, outputDir });
  artifacts.push(...testingSuite.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    walletInfo: { threshold, owners, features },
    contracts: signatureCollection.contracts,
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/multi-signature-wallet', timestamp: startTime }
  };
}

export const signatureCollectionTask = defineTask('signature-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Signature Collection - ${args.projectName}`,
  agent: {
    name: 'multisig-developer',
    prompt: {
      role: 'Multi-sig Signature Developer',
      task: 'Implement signature collection mechanism',
      context: args,
      instructions: ['1. Design signature format', '2. Implement off-chain signing', '3. Add signature aggregation', '4. Handle signature ordering', '5. Implement EIP-712 signing', '6. Add signature encoding', '7. Handle contract signatures', '8. Implement approval tracking', '9. Test signature collection', '10. Document signing process'],
      outputFormat: 'JSON with signature collection'
    },
    outputSchema: { type: 'object', required: ['signatureFormat', 'contracts', 'artifacts'], properties: { signatureFormat: { type: 'object' }, contracts: { type: 'object' }, signingProcess: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'signatures']
}));

export const thresholdConfigTask = defineTask('threshold-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Threshold Configuration - ${args.projectName}`,
  agent: {
    name: 'threshold-engineer',
    prompt: {
      role: 'Threshold Configuration Engineer',
      task: 'Implement threshold configuration',
      context: args,
      instructions: ['1. Implement M-of-N logic', '2. Add threshold validation', '3. Implement threshold changes', '4. Handle minimum threshold', '5. Add threshold events', '6. Implement voting for changes', '7. Test threshold edge cases', '8. Handle owner count changes', '9. Document thresholds', '10. Add threshold guards'],
      outputFormat: 'JSON with threshold config'
    },
    outputSchema: { type: 'object', required: ['thresholdLogic', 'validationRules', 'artifacts'], properties: { thresholdLogic: { type: 'object' }, validationRules: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'threshold']
}));

export const ownerManagementTask = defineTask('owner-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Owner Management - ${args.projectName}`,
  agent: {
    name: 'owner-management-engineer',
    prompt: {
      role: 'Owner Management Engineer',
      task: 'Implement owner management',
      context: args,
      instructions: ['1. Implement addOwner', '2. Implement removeOwner', '3. Implement swapOwner', '4. Track owner list', '5. Validate owner addresses', '6. Handle duplicate owners', '7. Implement owner iteration', '8. Add owner events', '9. Test owner operations', '10. Document owner management'],
      outputFormat: 'JSON with owner management'
    },
    outputSchema: { type: 'object', required: ['ownerFunctions', 'artifacts'], properties: { ownerFunctions: { type: 'array' }, ownerStorage: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'owners']
}));

export const transactionQueueTask = defineTask('transaction-queue', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transaction Queue - ${args.projectName}`,
  agent: {
    name: 'tx-queue-engineer',
    prompt: {
      role: 'Transaction Queue Engineer',
      task: 'Implement transaction queue',
      context: args,
      instructions: ['1. Implement tx submission', '2. Add tx hashing', '3. Implement confirmation tracking', '4. Handle tx execution', '5. Add tx cancellation', '6. Implement batch transactions', '7. Track tx status', '8. Add tx events', '9. Test queue operations', '10. Document queue usage'],
      outputFormat: 'JSON with transaction queue'
    },
    outputSchema: { type: 'object', required: ['queueFunctions', 'txStructure', 'artifacts'], properties: { queueFunctions: { type: 'array' }, txStructure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'transactions']
}));

export const signatureVerificationTask = defineTask('signature-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Signature Verification - ${args.projectName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Signature Verification Engineer',
      task: 'Implement signature verification',
      context: args,
      instructions: ['1. Implement ECDSA recovery', '2. Add EIP-712 verification', '3. Handle contract signatures', '4. Verify signature count', '5. Check signature ordering', '6. Validate recovered addresses', '7. Handle eth_sign prefix', '8. Add replay protection', '9. Test verification', '10. Document verification'],
      outputFormat: 'JSON with signature verification'
    },
    outputSchema: { type: 'object', required: ['verificationFunctions', 'signatureTypes', 'artifacts'], properties: { verificationFunctions: { type: 'array' }, signatureTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'verification']
}));

export const nonceManagementTask = defineTask('nonce-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonce Management - ${args.projectName}`,
  agent: {
    name: 'nonce-engineer',
    prompt: {
      role: 'Nonce Management Engineer',
      task: 'Implement nonce management',
      context: args,
      instructions: ['1. Implement nonce tracking', '2. Add nonce validation', '3. Handle nonce increments', '4. Prevent replay attacks', '5. Add nonce queries', '6. Handle parallel txs', '7. Implement nonce gaps', '8. Test nonce security', '9. Document nonce usage', '10. Add nonce recovery'],
      outputFormat: 'JSON with nonce management'
    },
    outputSchema: { type: 'object', required: ['nonceFunctions', 'replayProtection', 'artifacts'], properties: { nonceFunctions: { type: 'array' }, replayProtection: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'nonce']
}));

export const delegateCallSupportTask = defineTask('delegate-call-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delegate Call Support - ${args.projectName}`,
  agent: {
    name: 'delegate-call-engineer',
    prompt: {
      role: 'Delegate Call Engineer',
      task: 'Implement delegate call support',
      context: args,
      instructions: ['1. Implement delegatecall execution', '2. Add operation types', '3. Handle call vs delegatecall', '4. Implement safety checks', '5. Add execution return data', '6. Handle revert reasons', '7. Test delegate calls', '8. Document risks', '9. Add operation guards', '10. Test edge cases'],
      outputFormat: 'JSON with delegate call support'
    },
    outputSchema: { type: 'object', required: ['delegateCallFunctions', 'safetyChecks', 'artifacts'], properties: { delegateCallFunctions: { type: 'array' }, safetyChecks: { type: 'array' }, operationTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'delegate-call']
}));

export const moduleSystemTask = defineTask('module-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Module System - ${args.projectName}`,
  agent: {
    name: 'module-engineer',
    prompt: {
      role: 'Multi-sig Module Engineer',
      task: 'Implement module system for extensions',
      context: args,
      instructions: ['1. Design module interface', '2. Implement module enabling', '3. Add module execution', '4. Implement guards', '5. Add fallback handler', '6. Handle module storage', '7. Test module isolation', '8. Document module API', '9. Create example modules', '10. Add module registry'],
      outputFormat: 'JSON with module system'
    },
    outputSchema: { type: 'object', required: ['moduleInterface', 'guardInterface', 'artifacts'], properties: { moduleInterface: { type: 'object' }, guardInterface: { type: 'object' }, exampleModules: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'modules']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'multisig-tester',
    prompt: {
      role: 'Multi-sig Test Engineer',
      task: 'Create comprehensive tests',
      context: args,
      instructions: ['1. Test signature verification', '2. Test threshold operations', '3. Test owner management', '4. Test transaction execution', '5. Test nonce handling', '6. Test delegate calls', '7. Test modules', '8. Run fuzz tests', '9. Test attack vectors', '10. Achieve coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['multisig', 'testing']
}));
