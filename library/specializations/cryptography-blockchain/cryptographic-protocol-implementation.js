/**
 * @process specializations/cryptography-blockchain/cryptographic-protocol-implementation
 * @description Cryptographic Protocol Implementation - Secure implementation of cryptographic protocols including signature
 * schemes, encryption, and key derivation following best practices and standards.
 * @inputs { projectName: string, protocolType: string, algorithm?: string, securityLevel?: number }
 * @outputs { success: boolean, implementation: object, securityAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/cryptographic-protocol-implementation', {
 *   projectName: 'Signature Scheme',
 *   protocolType: 'digital-signature',
 *   algorithm: 'ECDSA',
 *   securityLevel: 128
 * });
 *
 * @references
 * - NIST Cryptographic Standards: https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines
 * - RFC 6979 Deterministic ECDSA: https://datatracker.ietf.org/doc/html/rfc6979
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    protocolType,
    algorithm = 'ECDSA',
    securityLevel = 128,
    curve = 'secp256k1',
    features = ['constant-time', 'side-channel-resistant'],
    outputDir = 'crypto-protocol-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cryptographic Protocol Implementation: ${projectName}`);

  const specificationReview = await ctx.task(specificationReviewTask, { projectName, protocolType, algorithm, securityLevel, outputDir });
  artifacts.push(...specificationReview.artifacts);

  const librarySelection = await ctx.task(librarySelectionTask, { projectName, algorithm, securityLevel, outputDir });
  artifacts.push(...librarySelection.artifacts);

  const implementation = await ctx.task(implementationTask, { projectName, specificationReview, librarySelection, features, outputDir });
  artifacts.push(...implementation.artifacts);

  const keyGeneration = await ctx.task(keyGenerationTask, { projectName, algorithm, curve, outputDir });
  artifacts.push(...keyGeneration.artifacts);

  const serialization = await ctx.task(serializationTask, { projectName, algorithm, outputDir });
  artifacts.push(...serialization.artifacts);

  const testVectors = await ctx.task(testVectorsTask, { projectName, algorithm, outputDir });
  artifacts.push(...testVectors.artifacts);

  const securityReview = await ctx.task(securityReviewTask, { projectName, features, outputDir });
  artifacts.push(...securityReview.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    implementation: { protocolType, algorithm, securityLevel, curve },
    securityAnalysis: securityReview,
    testResults: testVectors,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/cryptographic-protocol-implementation', timestamp: startTime }
  };
}

export const specificationReviewTask = defineTask('specification-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specification Review - ${args.projectName}`,
  agent: {
    name: 'cryptographer',
    prompt: {
      role: 'Cryptography Specification Reviewer',
      task: 'Review protocol specification',
      context: args,
      instructions: ['1. Review NIST/IETF specifications', '2. Verify security claims', '3. Identify parameters', '4. Review mathematical foundation', '5. Check for known weaknesses', '6. Verify security level', '7. Review implementation notes', '8. Identify edge cases', '9. Document requirements', '10. Create implementation guide'],
      outputFormat: 'JSON with specification review'
    },
    outputSchema: { type: 'object', required: ['specification', 'requirements', 'artifacts'], properties: { specification: { type: 'object' }, requirements: { type: 'array' }, knownWeaknesses: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'specification']
}));

export const librarySelectionTask = defineTask('library-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Library Selection - ${args.projectName}`,
  agent: {
    name: 'crypto-engineer',
    prompt: {
      role: 'Cryptography Library Engineer',
      task: 'Select appropriate cryptographic libraries',
      context: args,
      instructions: ['1. Evaluate available libraries', '2. Check security audits', '3. Verify constant-time implementations', '4. Check maintenance status', '5. Evaluate performance', '6. Check platform support', '7. Review API ergonomics', '8. Verify license compatibility', '9. Check side-channel resistance', '10. Document selection rationale'],
      outputFormat: 'JSON with library selection'
    },
    outputSchema: { type: 'object', required: ['selectedLibrary', 'rationale', 'artifacts'], properties: { selectedLibrary: { type: 'string' }, alternatives: { type: 'array' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'library']
}));

export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation - ${args.projectName}`,
  agent: {
    name: 'crypto-developer',
    prompt: {
      role: 'Cryptographic Protocol Developer',
      task: 'Implement cryptographic protocol',
      context: args,
      instructions: ['1. Implement with constant-time operations', '2. Handle edge cases correctly', '3. Implement error handling', '4. Use secure memory handling', '5. Implement proper validation', '6. Follow coding standards', '7. Add comprehensive logging', '8. Implement test hooks', '9. Document implementation', '10. Create usage examples'],
      outputFormat: 'JSON with implementation'
    },
    outputSchema: { type: 'object', required: ['implementationPath', 'functions', 'artifacts'], properties: { implementationPath: { type: 'string' }, functions: { type: 'array' }, apiDocs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'implementation']
}));

export const keyGenerationTask = defineTask('key-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Key Generation - ${args.projectName}`,
  agent: {
    name: 'key-generation-engineer',
    prompt: {
      role: 'Key Generation Engineer',
      task: 'Implement secure key generation',
      context: args,
      instructions: ['1. Use cryptographic RNG', '2. Implement key validation', '3. Handle entropy properly', '4. Implement key derivation', '5. Add key encoding', '6. Handle key formats', '7. Implement key pairs', '8. Add key recovery', '9. Test randomness', '10. Document key handling'],
      outputFormat: 'JSON with key generation'
    },
    outputSchema: { type: 'object', required: ['keyGenFunctions', 'artifacts'], properties: { keyGenFunctions: { type: 'array' }, entropyRequirements: { type: 'object' }, keyFormats: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'key-generation']
}));

export const serializationTask = defineTask('serialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Serialization - ${args.projectName}`,
  agent: {
    name: 'serialization-engineer',
    prompt: {
      role: 'Cryptographic Serialization Engineer',
      task: 'Implement serialization/deserialization',
      context: args,
      instructions: ['1. Implement DER encoding', '2. Add PEM support', '3. Implement raw formats', '4. Handle endianness', '5. Add format detection', '6. Implement validation', '7. Handle padding', '8. Add compression', '9. Test interoperability', '10. Document formats'],
      outputFormat: 'JSON with serialization'
    },
    outputSchema: { type: 'object', required: ['serializationFunctions', 'formats', 'artifacts'], properties: { serializationFunctions: { type: 'array' }, formats: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'serialization']
}));

export const testVectorsTask = defineTask('test-vectors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Vectors - ${args.projectName}`,
  agent: {
    name: 'test-vector-engineer',
    prompt: {
      role: 'Cryptographic Test Engineer',
      task: 'Implement test vectors and compliance tests',
      context: args,
      instructions: ['1. Gather official test vectors', '2. Implement KAT tests', '3. Add boundary tests', '4. Test invalid inputs', '5. Add performance tests', '6. Implement fuzz testing', '7. Test interoperability', '8. Add regression tests', '9. Verify compliance', '10. Document test coverage'],
      outputFormat: 'JSON with test vectors'
    },
    outputSchema: { type: 'object', required: ['testVectors', 'compliance', 'artifacts'], properties: { testVectors: { type: 'array' }, compliance: { type: 'object' }, coverage: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'testing']
}));

export const securityReviewTask = defineTask('security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Review - ${args.projectName}`,
  agent: {
    name: 'crypto-security-reviewer',
    prompt: {
      role: 'Cryptographic Security Reviewer',
      task: 'Review implementation security',
      context: args,
      instructions: ['1. Check timing attacks', '2. Review memory handling', '3. Check for side channels', '4. Verify constant-time', '5. Review error handling', '6. Check for leaks', '7. Verify randomness', '8. Review input validation', '9. Check for cache attacks', '10. Generate security report'],
      outputFormat: 'JSON with security review'
    },
    outputSchema: { type: 'object', required: ['findings', 'riskLevel', 'artifacts'], properties: { findings: { type: 'array' }, riskLevel: { type: 'string' }, mitigations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'security']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'crypto-documenter',
    prompt: {
      role: 'Cryptographic Documentation Writer',
      task: 'Create comprehensive documentation',
      context: args,
      instructions: ['1. Document API', '2. Add usage examples', '3. Document security considerations', '4. Add migration guides', '5. Document key formats', '6. Add troubleshooting', '7. Document performance', '8. Add compliance notes', '9. Create quick start', '10. Review documentation'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['documentationPath', 'artifacts'], properties: { documentationPath: { type: 'string' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cryptography', 'documentation']
}));
