/**
 * @process specializations/cryptography-blockchain/erc1155-multi-token
 * @description ERC-1155 Multi-Token Implementation - Development of multi-token contracts supporting both fungible and
 * non-fungible tokens with efficient batch operations.
 * @inputs { projectName: string, tokenTypes?: array, features?: array, batchOperations?: boolean }
 * @outputs { success: boolean, contractInfo: object, tokenTypes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/erc1155-multi-token', {
 *   projectName: 'Gaming Items',
 *   tokenTypes: [
 *     { id: 1, name: 'Gold Coin', fungible: true, supply: 'unlimited' },
 *     { id: 2, name: 'Legendary Sword', fungible: false, supply: 100 }
 *   ],
 *   features: ['batch-mint', 'supply-tracking', 'uri-storage']
 * });
 *
 * @references
 * - ERC-1155 Standard: https://eips.ethereum.org/EIPS/eip-1155
 * - OpenZeppelin ERC1155: https://docs.openzeppelin.com/contracts/4.x/erc1155
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    tokenTypes = [],
    features = ['batch-mint', 'supply-tracking'],
    batchOperations = true,
    accessControl = 'ownable',
    framework = 'foundry',
    outputDir = 'erc1155-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ERC-1155 Multi-Token Implementation: ${projectName}`);
  ctx.log('info', `Token Types: ${tokenTypes.length}, Features: ${features.join(', ')}`);

  // ============================================================================
  // PHASE 1: TOKEN TYPE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing token types');

  const tokenTypeDesign = await ctx.task(tokenTypeDesignTask, {
    projectName,
    tokenTypes,
    features,
    outputDir
  });

  artifacts.push(...tokenTypeDesign.artifacts);

  // ============================================================================
  // PHASE 2: URI SCHEME DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing URI scheme');

  const uriSchemeDesign = await ctx.task(uriSchemeDesignTask, {
    projectName,
    tokenTypeDesign,
    outputDir
  });

  artifacts.push(...uriSchemeDesign.artifacts);

  // ============================================================================
  // PHASE 3: CONTRACT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing contract');

  const contractImplementation = await ctx.task(contractImplementationTask, {
    projectName,
    tokenTypeDesign,
    uriSchemeDesign,
    features,
    batchOperations,
    accessControl,
    framework,
    outputDir
  });

  artifacts.push(...contractImplementation.artifacts);

  // ============================================================================
  // PHASE 4: BATCH OPERATIONS
  // ============================================================================

  if (batchOperations) {
    ctx.log('info', 'Phase 4: Implementing batch operations');

    const batchOperationsImpl = await ctx.task(batchOperationsTask, {
      projectName,
      contractImplementation,
      outputDir
    });

    artifacts.push(...batchOperationsImpl.artifacts);
  }

  // ============================================================================
  // PHASE 5: SUPPLY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing supply management');

  const supplyManagement = await ctx.task(supplyManagementTask, {
    projectName,
    tokenTypeDesign,
    features,
    outputDir
  });

  artifacts.push(...supplyManagement.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Running tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    projectName,
    contractImplementation,
    tokenTypeDesign,
    framework,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // ============================================================================
  // PHASE 7: MARKETPLACE COMPATIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing marketplace compatibility');

  const marketplaceCompatibility = await ctx.task(marketplaceCompatibilityTask, {
    projectName,
    uriSchemeDesign,
    outputDir
  });

  artifacts.push(...marketplaceCompatibility.artifacts);

  // ============================================================================
  // PHASE 8: DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Preparing deployment');

  const deploymentPreparation = await ctx.task(deploymentPreparationTask, {
    projectName,
    contractImplementation,
    tokenTypeDesign,
    framework,
    outputDir
  });

  artifacts.push(...deploymentPreparation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    contractInfo: {
      contractPath: contractImplementation.contractPath,
      abi: contractImplementation.abi
    },
    tokenTypes: tokenTypeDesign.tokenTypes,
    uriScheme: uriSchemeDesign.scheme,
    testResults: {
      coverage: testingSuite.coverage,
      allPassing: testingSuite.allPassing
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/erc1155-multi-token',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const tokenTypeDesignTask = defineTask('token-type-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Token Type Design - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-013: erc1155-implementation)
    prompt: {
      role: 'Multi-Token Designer',
      task: 'Design token types for ERC-1155',
      context: args,
      instructions: [
        '1. Define fungible token types',
        '2. Define non-fungible token types',
        '3. Assign token IDs',
        '4. Define supply limits per type',
        '5. Plan token metadata per type',
        '6. Define minting permissions',
        '7. Plan burning capabilities',
        '8. Design token categories',
        '9. Document token relationships',
        '10. Create token specification'
      ],
      outputFormat: 'JSON with token type design'
    },
    outputSchema: {
      type: 'object',
      required: ['tokenTypes', 'artifacts'],
      properties: {
        tokenTypes: { type: 'array', items: { type: 'object' } },
        fungibleTokens: { type: 'array', items: { type: 'object' } },
        nonFungibleTokens: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'design']
}));

export const uriSchemeDesignTask = defineTask('uri-scheme-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: URI Scheme Design - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-013: erc1155-implementation)
    prompt: {
      role: 'URI Scheme Designer',
      task: 'Design metadata URI scheme',
      context: args,
      instructions: [
        '1. Define base URI structure',
        '2. Design token ID substitution',
        '3. Plan centralized vs decentralized',
        '4. Design metadata JSON schema',
        '5. Plan image/asset storage',
        '6. Consider localization',
        '7. Design fallback URIs',
        '8. Plan URI updates',
        '9. Test marketplace compatibility',
        '10. Document URI scheme'
      ],
      outputFormat: 'JSON with URI scheme design'
    },
    outputSchema: {
      type: 'object',
      required: ['scheme', 'baseUri', 'artifacts'],
      properties: {
        scheme: { type: 'object' },
        baseUri: { type: 'string' },
        metadataSchema: { type: 'object' },
        storageStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'uri']
}));

export const contractImplementationTask = defineTask('contract-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contract Implementation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-013: erc1155-implementation, SK-001: solidity-dev)
    prompt: {
      role: 'ERC-1155 Developer',
      task: 'Implement ERC-1155 contract',
      context: args,
      instructions: [
        '1. Implement ERC1155 base',
        '2. Add ERC1155Supply for tracking',
        '3. Implement mint and mintBatch',
        '4. Implement burn and burnBatch',
        '5. Add URI management',
        '6. Implement access control',
        '7. Add pause functionality',
        '8. Optimize for gas efficiency',
        '9. Add proper events',
        '10. Document with NatSpec'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['contractPath', 'abi', 'artifacts'],
      properties: {
        contractPath: { type: 'string' },
        abi: { type: 'array' },
        bytecode: { type: 'string' },
        gasEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'implementation']
}));

export const batchOperationsTask = defineTask('batch-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Batch Operations - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-013: erc1155-implementation)
    prompt: {
      role: 'Batch Operations Engineer',
      task: 'Implement efficient batch operations',
      context: args,
      instructions: [
        '1. Optimize safeBatchTransferFrom',
        '2. Implement batch minting',
        '3. Implement batch burning',
        '4. Add batch balance queries',
        '5. Optimize gas for batches',
        '6. Add batch approval patterns',
        '7. Test batch limits',
        '8. Handle partial failures',
        '9. Document batch interfaces',
        '10. Create batch helpers'
      ],
      outputFormat: 'JSON with batch operations details'
    },
    outputSchema: {
      type: 'object',
      required: ['batchFunctions', 'gasOptimizations', 'artifacts'],
      properties: {
        batchFunctions: { type: 'array', items: { type: 'string' } },
        gasOptimizations: { type: 'array', items: { type: 'object' } },
        batchLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'batch']
}));

export const supplyManagementTask = defineTask('supply-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Supply Management - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-013: erc1155-implementation)
    prompt: {
      role: 'Token Supply Manager',
      task: 'Implement supply management',
      context: args,
      instructions: [
        '1. Track total supply per token',
        '2. Implement max supply limits',
        '3. Add supply cap enforcement',
        '4. Track circulating supply',
        '5. Implement exists() function',
        '6. Add supply queries',
        '7. Handle unlimited supply tokens',
        '8. Implement supply snapshots',
        '9. Document supply logic',
        '10. Test supply edge cases'
      ],
      outputFormat: 'JSON with supply management details'
    },
    outputSchema: {
      type: 'object',
      required: ['supplyTracking', 'maxSupplies', 'artifacts'],
      properties: {
        supplyTracking: { type: 'object' },
        maxSupplies: { type: 'object' },
        supplyFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'supply']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Testing Suite - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'ERC-1155 Test Engineer',
      task: 'Create comprehensive test suite',
      context: args,
      instructions: [
        '1. Test single transfers',
        '2. Test batch transfers',
        '3. Test minting functions',
        '4. Test burning functions',
        '5. Test supply tracking',
        '6. Test URI functions',
        '7. Test access control',
        '8. Test approval operators',
        '9. Run gas optimization tests',
        '10. Achieve high coverage'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['coverage', 'allPassing', 'artifacts'],
      properties: {
        coverage: { type: 'number' },
        allPassing: { type: 'boolean' },
        testsCount: { type: 'number' },
        gasReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'testing']
}));

export const marketplaceCompatibilityTask = defineTask('marketplace-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Marketplace Compatibility - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist
    prompt: {
      role: 'Marketplace Compatibility Tester',
      task: 'Test marketplace compatibility',
      context: args,
      instructions: [
        '1. Test OpenSea compatibility',
        '2. Verify metadata display',
        '3. Test bulk transfers',
        '4. Verify collection detection',
        '5. Test fungible token display',
        '6. Test NFT display',
        '7. Verify attribute parsing',
        '8. Test listing functionality',
        '9. Document compatibility issues',
        '10. Create compatibility report'
      ],
      outputFormat: 'JSON with compatibility results'
    },
    outputSchema: {
      type: 'object',
      required: ['compatible', 'marketplaces', 'artifacts'],
      properties: {
        compatible: { type: 'boolean' },
        marketplaces: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'marketplace']
}));

export const deploymentPreparationTask = defineTask('deployment-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Deployment Preparation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Deployment Engineer',
      task: 'Prepare ERC-1155 deployment',
      context: args,
      instructions: [
        '1. Create deployment scripts',
        '2. Configure initial token types',
        '3. Prepare metadata upload',
        '4. Set up access control',
        '5. Create initialization scripts',
        '6. Document deployment process',
        '7. Prepare verification commands',
        '8. Create post-deployment tests',
        '9. Document admin operations',
        '10. Create deployment checklist'
      ],
      outputFormat: 'JSON with deployment preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentScripts', 'checklist', 'artifacts'],
      properties: {
        deploymentScripts: { type: 'array', items: { type: 'string' } },
        constructorArgs: { type: 'object' },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc1155', 'deployment']
}));
