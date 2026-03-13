/**
 * @process specializations/cryptography-blockchain/erc721-nft-collection
 * @description ERC-721 NFT Collection Development - End-to-end process for developing NFT collections including metadata design,
 * minting mechanisms, royalty implementation, and marketplace integration.
 * @inputs { projectName: string, collectionName: string, maxSupply?: number, mintingType?: string, features?: array }
 * @outputs { success: boolean, contractAddress?: string, collectionInfo: object, metadataSchema: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/erc721-nft-collection', {
 *   projectName: 'Art Collection',
 *   collectionName: 'Unique Art',
 *   collectionSymbol: 'UART',
 *   maxSupply: 10000,
 *   mintingType: 'allowlist-then-public',
 *   features: ['royalties', 'reveal', 'enumerable']
 * });
 *
 * @references
 * - ERC-721 Standard: https://eips.ethereum.org/EIPS/eip-721
 * - OpenSea Metadata Standards: https://docs.opensea.io/docs/metadata-standards
 * - ERC-2981 Royalties: https://eips.ethereum.org/EIPS/eip-2981
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    collectionName,
    collectionSymbol,
    maxSupply = 10000,
    mintingType = 'public',
    mintPrice = '0.08',
    features = [],
    royaltyPercentage = 5,
    metadataStorage = 'ipfs',
    framework = 'foundry',
    outputDir = 'nft-collection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting NFT Collection Development: ${collectionName}`);
  ctx.log('info', `Max Supply: ${maxSupply}, Minting Type: ${mintingType}`);

  // ============================================================================
  // PHASE 1: COLLECTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing collection');

  const collectionDesign = await ctx.task(collectionDesignTask, {
    projectName,
    collectionName,
    collectionSymbol,
    maxSupply,
    features,
    royaltyPercentage,
    outputDir
  });

  artifacts.push(...collectionDesign.artifacts);

  // ============================================================================
  // PHASE 2: METADATA SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing metadata schema');

  const metadataDesign = await ctx.task(metadataDesignTask, {
    projectName,
    collectionDesign,
    metadataStorage,
    outputDir
  });

  artifacts.push(...metadataDesign.artifacts);

  // ============================================================================
  // PHASE 3: CONTRACT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing NFT contract');

  const contractImplementation = await ctx.task(contractImplementationTask, {
    projectName,
    collectionDesign,
    metadataDesign,
    mintingType,
    mintPrice,
    features,
    framework,
    outputDir
  });

  artifacts.push(...contractImplementation.artifacts);

  // ============================================================================
  // PHASE 4: MINTING MECHANISM
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing minting mechanism');

  const mintingMechanism = await ctx.task(mintingMechanismTask, {
    projectName,
    mintingType,
    mintPrice,
    maxSupply,
    features,
    outputDir
  });

  artifacts.push(...mintingMechanism.artifacts);

  // ============================================================================
  // PHASE 5: ROYALTY IMPLEMENTATION
  // ============================================================================

  if (features.includes('royalties')) {
    ctx.log('info', 'Phase 5: Implementing royalties');

    const royaltyImplementation = await ctx.task(royaltyImplementationTask, {
      projectName,
      royaltyPercentage,
      outputDir
    });

    artifacts.push(...royaltyImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 6: METADATA INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up metadata infrastructure');

  const metadataInfrastructure = await ctx.task(metadataInfrastructureTask, {
    projectName,
    metadataDesign,
    metadataStorage,
    features,
    outputDir
  });

  artifacts.push(...metadataInfrastructure.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Running comprehensive tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    projectName,
    contractImplementation,
    mintingMechanism,
    features,
    framework,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // ============================================================================
  // PHASE 8: MARKETPLACE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Preparing marketplace integration');

  const marketplaceIntegration = await ctx.task(marketplaceIntegrationTask, {
    projectName,
    collectionDesign,
    metadataDesign,
    outputDir
  });

  artifacts.push(...marketplaceIntegration.artifacts);

  // Quality Gate: Collection Review
  await ctx.breakpoint({
    question: `NFT Collection ${collectionName} ready for review. Max supply: ${maxSupply}, Tests passing: ${testingSuite.allPassing}. Proceed with deployment preparation?`,
    title: 'Collection Review',
    context: {
      runId: ctx.runId,
      projectName,
      collectionInfo: collectionDesign,
      testResults: testingSuite,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'json' }))
    }
  });

  // ============================================================================
  // PHASE 9: DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Preparing deployment');

  const deploymentPreparation = await ctx.task(deploymentPreparationTask, {
    projectName,
    contractImplementation,
    metadataInfrastructure,
    framework,
    outputDir
  });

  artifacts.push(...deploymentPreparation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    collectionInfo: {
      name: collectionName,
      symbol: collectionSymbol,
      maxSupply,
      mintingType,
      mintPrice,
      royaltyPercentage,
      features
    },
    metadataSchema: metadataDesign.schema,
    implementation: {
      contractPath: contractImplementation.contractPath,
      abi: contractImplementation.abi
    },
    testResults: {
      coverage: testingSuite.coverage,
      allPassing: testingSuite.allPassing
    },
    marketplaceIntegration: marketplaceIntegration,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/erc721-nft-collection',
      timestamp: startTime,
      framework,
      metadataStorage
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const collectionDesignTask = defineTask('collection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Collection Design - ${args.collectionName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-012: erc721-implementation)
    prompt: {
      role: 'NFT Collection Designer',
      task: 'Design NFT collection specifications',
      context: args,
      instructions: [
        '1. Define collection name and symbol',
        '2. Specify maximum supply',
        '3. Define trait categories and rarities',
        '4. Plan reveal mechanism if needed',
        '5. Define royalty structure',
        '6. Plan minting phases',
        '7. Design allowlist criteria',
        '8. Define pricing strategy',
        '9. Plan secondary market presence',
        '10. Document collection specification'
      ],
      outputFormat: 'JSON with collection design'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'symbol', 'maxSupply', 'artifacts'],
      properties: {
        name: { type: 'string' },
        symbol: { type: 'string' },
        maxSupply: { type: 'number' },
        traitCategories: { type: 'array', items: { type: 'object' } },
        mintingPhases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'design']
}));

export const metadataDesignTask = defineTask('metadata-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Metadata Design - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-012: erc721-implementation)
    prompt: {
      role: 'NFT Metadata Designer',
      task: 'Design metadata schema and structure',
      context: args,
      instructions: [
        '1. Define OpenSea-compatible metadata schema',
        '2. Design attribute structure',
        '3. Plan image/animation storage',
        '4. Define background colors',
        '5. Plan external URLs',
        '6. Design rarity calculation',
        '7. Plan metadata generation script',
        '8. Design reveal mechanism metadata',
        '9. Validate against marketplace standards',
        '10. Document metadata specification'
      ],
      outputFormat: 'JSON with metadata design'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'attributeStructure', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        attributeStructure: { type: 'array', items: { type: 'object' } },
        storageStrategy: { type: 'string' },
        revealStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'metadata']
}));

export const contractImplementationTask = defineTask('contract-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contract Implementation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-012: erc721-implementation, SK-001: solidity-dev)
    prompt: {
      role: 'NFT Contract Developer',
      task: 'Implement ERC-721 contract',
      context: args,
      instructions: [
        '1. Implement ERC-721 using OpenZeppelin',
        '2. Add ERC721Enumerable if needed',
        '3. Implement mint functions',
        '4. Add baseURI management',
        '5. Implement reveal mechanism',
        '6. Add ERC-2981 royalties',
        '7. Implement access control',
        '8. Add pause functionality',
        '9. Optimize for gas efficiency',
        '10. Add proper NatSpec documentation'
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
  labels: ['blockchain', 'nft', 'implementation']
}));

export const mintingMechanismTask = defineTask('minting-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Minting Mechanism - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-012: erc721-implementation)
    prompt: {
      role: 'Minting Mechanism Engineer',
      task: 'Implement minting mechanisms',
      context: args,
      instructions: [
        '1. Implement public mint function',
        '2. Add allowlist minting (Merkle proof)',
        '3. Implement mint price handling',
        '4. Add max per wallet limits',
        '5. Implement mint phases',
        '6. Add lazy minting if required',
        '7. Implement airdrop functionality',
        '8. Add reserve minting for team',
        '9. Implement free claim mechanism',
        '10. Add withdrawal function for ETH'
      ],
      outputFormat: 'JSON with minting mechanism details'
    },
    outputSchema: {
      type: 'object',
      required: ['mintingFunctions', 'allowlistSetup', 'artifacts'],
      properties: {
        mintingFunctions: { type: 'array', items: { type: 'string' } },
        allowlistSetup: { type: 'object' },
        pricingStructure: { type: 'object' },
        limitConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'minting']
}));

export const royaltyImplementationTask = defineTask('royalty-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Royalty Implementation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-012: erc721-implementation)
    prompt: {
      role: 'Royalty Implementation Engineer',
      task: 'Implement ERC-2981 royalties',
      context: args,
      instructions: [
        '1. Implement ERC-2981 interface',
        '2. Set default royalty receiver',
        '3. Set royalty percentage',
        '4. Add per-token royalty override',
        '5. Implement royalty recipient update',
        '6. Consider royalty splitter',
        '7. Integrate with marketplace standards',
        '8. Test royalty calculations',
        '9. Document royalty configuration',
        '10. Verify marketplace compatibility'
      ],
      outputFormat: 'JSON with royalty implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['royaltyReceiver', 'royaltyPercentage', 'artifacts'],
      properties: {
        royaltyReceiver: { type: 'string' },
        royaltyPercentage: { type: 'number' },
        supportsTokenRoyalties: { type: 'boolean' },
        marketplaceCompatibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'royalties']
}));

export const metadataInfrastructureTask = defineTask('metadata-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Metadata Infrastructure - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist
    prompt: {
      role: 'Metadata Infrastructure Engineer',
      task: 'Set up metadata storage and serving',
      context: args,
      instructions: [
        '1. Set up IPFS/Arweave storage',
        '2. Upload placeholder metadata',
        '3. Configure pin service',
        '4. Set up metadata generation pipeline',
        '5. Implement reveal mechanism',
        '6. Configure CDN if needed',
        '7. Set up backup storage',
        '8. Implement metadata refresh',
        '9. Test metadata retrieval',
        '10. Document infrastructure'
      ],
      outputFormat: 'JSON with infrastructure details'
    },
    outputSchema: {
      type: 'object',
      required: ['storageType', 'baseUri', 'artifacts'],
      properties: {
        storageType: { type: 'string' },
        baseUri: { type: 'string' },
        placeholderUri: { type: 'string' },
        pinService: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'infrastructure']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Testing Suite - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'NFT Test Engineer',
      task: 'Create comprehensive NFT test suite',
      context: args,
      instructions: [
        '1. Test minting functionality',
        '2. Test allowlist verification',
        '3. Test price handling',
        '4. Test max supply enforcement',
        '5. Test royalty returns',
        '6. Test metadata URI',
        '7. Test reveal mechanism',
        '8. Test access control',
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
  labels: ['blockchain', 'nft', 'testing']
}));

export const marketplaceIntegrationTask = defineTask('marketplace-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Marketplace Integration - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist
    prompt: {
      role: 'Marketplace Integration Specialist',
      task: 'Prepare marketplace integration',
      context: args,
      instructions: [
        '1. Validate OpenSea metadata compatibility',
        '2. Test on OpenSea testnet',
        '3. Configure collection page',
        '4. Set up royalty on marketplaces',
        '5. Prepare LooksRare integration',
        '6. Prepare Blur integration',
        '7. Test listing and sales',
        '8. Verify trait filtering works',
        '9. Test bulk listing tools',
        '10. Document integration steps'
      ],
      outputFormat: 'JSON with marketplace integration'
    },
    outputSchema: {
      type: 'object',
      required: ['marketplaces', 'compatibility', 'artifacts'],
      properties: {
        marketplaces: { type: 'array', items: { type: 'string' } },
        compatibility: { type: 'object' },
        collectionSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'marketplace']
}));

export const deploymentPreparationTask = defineTask('deployment-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Deployment Preparation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'NFT Deployment Engineer',
      task: 'Prepare NFT deployment',
      context: args,
      instructions: [
        '1. Create deployment scripts',
        '2. Configure constructor arguments',
        '3. Prepare metadata upload',
        '4. Set up allowlist management',
        '5. Create launch checklist',
        '6. Prepare reveal scripts',
        '7. Document emergency procedures',
        '8. Set up monitoring',
        '9. Prepare post-launch tasks',
        '10. Create deployment documentation'
      ],
      outputFormat: 'JSON with deployment preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentScripts', 'launchChecklist', 'artifacts'],
      properties: {
        deploymentScripts: { type: 'array', items: { type: 'string' } },
        constructorArgs: { type: 'object' },
        launchChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'nft', 'deployment']
}));
