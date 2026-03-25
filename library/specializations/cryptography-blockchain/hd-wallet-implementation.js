/**
 * @process specializations/cryptography-blockchain/hd-wallet-implementation
 * @description HD Wallet Implementation (BIP-32/39/44) - Implementation of hierarchical deterministic wallets with mnemonic
 * phrases and standard derivation paths for multi-coin support.
 * @inputs { projectName: string, wordCount?: number, supportedChains?: array, derivationPaths?: array }
 * @outputs { success: boolean, walletInfo: object, securityAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/hd-wallet-implementation', {
 *   projectName: 'Multi-Chain Wallet',
 *   wordCount: 24,
 *   supportedChains: ['ethereum', 'bitcoin', 'solana'],
 *   derivationPaths: ["m/44'/60'/0'/0", "m/44'/0'/0'/0", "m/44'/501'/0'/0'"]
 * });
 *
 * @references
 * - BIP-32: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * - BIP-39: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 * - BIP-44: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    wordCount = 24,
    supportedChains = ['ethereum'],
    derivationPaths = ["m/44'/60'/0'/0"],
    features = ['encryption', 'backup'],
    outputDir = 'hd-wallet-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HD Wallet Implementation: ${projectName}`);

  const mnemonicGeneration = await ctx.task(mnemonicGenerationTask, { projectName, wordCount, outputDir });
  artifacts.push(...mnemonicGeneration.artifacts);

  const seedDerivation = await ctx.task(seedDerivationTask, { projectName, outputDir });
  artifacts.push(...seedDerivation.artifacts);

  const masterKeyGeneration = await ctx.task(masterKeyGenerationTask, { projectName, outputDir });
  artifacts.push(...masterKeyGeneration.artifacts);

  const childKeyDerivation = await ctx.task(childKeyDerivationTask, { projectName, derivationPaths, outputDir });
  artifacts.push(...childKeyDerivation.artifacts);

  const multiChainSupport = await ctx.task(multiChainSupportTask, { projectName, supportedChains, derivationPaths, outputDir });
  artifacts.push(...multiChainSupport.artifacts);

  const secureMemory = await ctx.task(secureMemoryTask, { projectName, outputDir });
  artifacts.push(...secureMemory.artifacts);

  const backupRecovery = await ctx.task(backupRecoveryTask, { projectName, features, outputDir });
  artifacts.push(...backupRecovery.artifacts);

  const securityAnalysis = await ctx.task(securityAnalysisTask, { projectName, outputDir });
  artifacts.push(...securityAnalysis.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    walletInfo: { wordCount, supportedChains, derivationPaths, features },
    securityAnalysis,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/hd-wallet-implementation', timestamp: startTime }
  };
}

export const mnemonicGenerationTask = defineTask('mnemonic-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mnemonic Generation - ${args.projectName}`,
  agent: {
    name: 'mnemonic-engineer',
    prompt: {
      role: 'BIP-39 Mnemonic Engineer',
      task: 'Implement mnemonic generation',
      context: args,
      instructions: ['1. Generate cryptographic entropy', '2. Calculate checksum', '3. Convert to mnemonic words', '4. Support multiple languages', '5. Validate word list', '6. Handle word count variations', '7. Test entropy quality', '8. Implement validation', '9. Add passphrase support', '10. Document generation'],
      outputFormat: 'JSON with mnemonic generation'
    },
    outputSchema: { type: 'object', required: ['generationFunctions', 'wordLists', 'artifacts'], properties: { generationFunctions: { type: 'array' }, wordLists: { type: 'array' }, entropyBits: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'bip39', 'mnemonic']
}));

export const seedDerivationTask = defineTask('seed-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Seed Derivation - ${args.projectName}`,
  agent: {
    name: 'seed-engineer',
    prompt: {
      role: 'Seed Derivation Engineer',
      task: 'Implement seed derivation from mnemonic',
      context: args,
      instructions: ['1. Implement PBKDF2-HMAC-SHA512', '2. Handle passphrase correctly', '3. Use proper iterations (2048)', '4. Generate 512-bit seed', '5. Handle Unicode normalization', '6. Test with test vectors', '7. Implement secure memory', '8. Add validation', '9. Handle errors', '10. Document derivation'],
      outputFormat: 'JSON with seed derivation'
    },
    outputSchema: { type: 'object', required: ['derivationFunction', 'parameters', 'artifacts'], properties: { derivationFunction: { type: 'string' }, parameters: { type: 'object' }, testVectors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'bip39', 'seed']
}));

export const masterKeyGenerationTask = defineTask('master-key-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Master Key Generation - ${args.projectName}`,
  agent: {
    name: 'master-key-engineer',
    prompt: {
      role: 'BIP-32 Master Key Engineer',
      task: 'Implement master key generation',
      context: args,
      instructions: ['1. Implement HMAC-SHA512', '2. Split into key and chain code', '3. Validate key range', '4. Handle invalid keys', '5. Create extended key structure', '6. Implement serialization', '7. Add xpub/xprv formats', '8. Test with vectors', '9. Handle edge cases', '10. Document key structure'],
      outputFormat: 'JSON with master key generation'
    },
    outputSchema: { type: 'object', required: ['masterKeyFunctions', 'keyStructure', 'artifacts'], properties: { masterKeyFunctions: { type: 'array' }, keyStructure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'bip32', 'master-key']
}));

export const childKeyDerivationTask = defineTask('child-key-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Child Key Derivation - ${args.projectName}`,
  agent: {
    name: 'derivation-engineer',
    prompt: {
      role: 'Child Key Derivation Engineer',
      task: 'Implement child key derivation',
      context: args,
      instructions: ['1. Implement normal derivation', '2. Implement hardened derivation', '3. Handle derivation paths', '4. Parse path strings', '5. Implement CKDpriv', '6. Implement CKDpub', '7. Handle invalid indices', '8. Add depth tracking', '9. Test derivation paths', '10. Document derivation'],
      outputFormat: 'JSON with child key derivation'
    },
    outputSchema: { type: 'object', required: ['derivationFunctions', 'pathParsing', 'artifacts'], properties: { derivationFunctions: { type: 'array' }, pathParsing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'bip32', 'derivation']
}));

export const multiChainSupportTask = defineTask('multi-chain-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Multi-Chain Support - ${args.projectName}`,
  agent: {
    name: 'multi-chain-engineer',
    prompt: {
      role: 'Multi-Chain Wallet Engineer',
      task: 'Implement multi-chain support',
      context: args,
      instructions: ['1. Implement BIP-44 paths', '2. Support different curves', '3. Handle different address formats', '4. Support Bitcoin addresses', '5. Support Ethereum addresses', '6. Support Solana addresses', '7. Add coin type registry', '8. Handle different encodings', '9. Test each chain', '10. Document chain support'],
      outputFormat: 'JSON with multi-chain support'
    },
    outputSchema: { type: 'object', required: ['supportedChains', 'addressFormats', 'artifacts'], properties: { supportedChains: { type: 'array' }, addressFormats: { type: 'object' }, coinTypes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'bip44', 'multi-chain']
}));

export const secureMemoryTask = defineTask('secure-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secure Memory Handling - ${args.projectName}`,
  agent: {
    name: 'secure-memory-engineer',
    prompt: {
      role: 'Secure Memory Engineer',
      task: 'Implement secure memory handling',
      context: args,
      instructions: ['1. Implement memory zeroization', '2. Use secure allocators', '3. Prevent memory swapping', '4. Handle key material safely', '5. Implement secure strings', '6. Add memory locking', '7. Handle cleanup on error', '8. Implement disposable pattern', '9. Test memory security', '10. Document practices'],
      outputFormat: 'JSON with secure memory'
    },
    outputSchema: { type: 'object', required: ['memoryFunctions', 'securityMeasures', 'artifacts'], properties: { memoryFunctions: { type: 'array' }, securityMeasures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'security', 'memory']
}));

export const backupRecoveryTask = defineTask('backup-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup and Recovery - ${args.projectName}`,
  agent: {
    name: 'backup-engineer',
    prompt: {
      role: 'Wallet Backup Engineer',
      task: 'Implement backup and recovery',
      context: args,
      instructions: ['1. Implement encrypted backup', '2. Add password protection', '3. Implement recovery flow', '4. Add mnemonic verification', '5. Handle passphrase recovery', '6. Implement export formats', '7. Add recovery testing', '8. Handle partial recovery', '9. Document recovery process', '10. Create recovery guide'],
      outputFormat: 'JSON with backup/recovery'
    },
    outputSchema: { type: 'object', required: ['backupFunctions', 'recoveryProcess', 'artifacts'], properties: { backupFunctions: { type: 'array' }, recoveryProcess: { type: 'object' }, exportFormats: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'backup', 'recovery']
}));

export const securityAnalysisTask = defineTask('security-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Analysis - ${args.projectName}`,
  agent: {
    name: 'wallet-security-analyst',
    prompt: {
      role: 'Wallet Security Analyst',
      task: 'Analyze wallet security',
      context: args,
      instructions: ['1. Review entropy sources', '2. Check key derivation', '3. Analyze memory handling', '4. Review side channels', '5. Check backup security', '6. Analyze attack vectors', '7. Review error handling', '8. Check compliance', '9. Test implementations', '10. Generate security report'],
      outputFormat: 'JSON with security analysis'
    },
    outputSchema: { type: 'object', required: ['findings', 'riskLevel', 'artifacts'], properties: { findings: { type: 'array' }, riskLevel: { type: 'string' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['wallet', 'security', 'analysis']
}));
