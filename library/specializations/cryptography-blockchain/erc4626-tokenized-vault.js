/**
 * @process specializations/cryptography-blockchain/erc4626-tokenized-vault
 * @description ERC-4626 Tokenized Vault Development - Implementation of yield-bearing vault tokens following the ERC-4626
 * standard for DeFi composability.
 * @inputs { projectName: string, underlyingAsset: string, yieldStrategy?: string, features?: array }
 * @outputs { success: boolean, vaultInfo: object, shareCalculation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/erc4626-tokenized-vault', {
 *   projectName: 'USDC Yield Vault',
 *   underlyingAsset: '0xA0b86a33E6417F5E72...',
 *   yieldStrategy: 'aave-lending',
 *   features: ['fee-on-deposit', 'withdrawal-queue', 'emergency-exit']
 * });
 *
 * @references
 * - ERC-4626 Standard: https://eips.ethereum.org/EIPS/eip-4626
 * - OpenZeppelin ERC4626: https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC4626
 * - Yearn Vault Design: https://docs.yearn.finance/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    underlyingAsset,
    yieldStrategy = 'custom',
    features = [],
    feeStructure = { deposit: 0, withdrawal: 0, performance: 10 },
    framework = 'foundry',
    outputDir = 'vault-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ERC-4626 Vault Development: ${projectName}`);
  ctx.log('info', `Underlying Asset: ${underlyingAsset}, Strategy: ${yieldStrategy}`);

  // ============================================================================
  // PHASE 1: VAULT SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining vault specification');

  const vaultSpecification = await ctx.task(vaultSpecificationTask, {
    projectName,
    underlyingAsset,
    yieldStrategy,
    features,
    feeStructure,
    outputDir
  });

  artifacts.push(...vaultSpecification.artifacts);

  // ============================================================================
  // PHASE 2: SHARE CALCULATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing share calculation');

  const shareCalculationDesign = await ctx.task(shareCalculationDesignTask, {
    projectName,
    vaultSpecification,
    outputDir
  });

  artifacts.push(...shareCalculationDesign.artifacts);

  // ============================================================================
  // PHASE 3: VAULT CONTRACT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing vault contract');

  const vaultImplementation = await ctx.task(vaultImplementationTask, {
    projectName,
    vaultSpecification,
    shareCalculationDesign,
    features,
    framework,
    outputDir
  });

  artifacts.push(...vaultImplementation.artifacts);

  // ============================================================================
  // PHASE 4: YIELD STRATEGY INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Integrating yield strategy');

  const strategyIntegration = await ctx.task(strategyIntegrationTask, {
    projectName,
    yieldStrategy,
    vaultImplementation,
    outputDir
  });

  artifacts.push(...strategyIntegration.artifacts);

  // ============================================================================
  // PHASE 5: FEE MECHANISM
  // ============================================================================

  if (feeStructure.deposit > 0 || feeStructure.withdrawal > 0 || feeStructure.performance > 0) {
    ctx.log('info', 'Phase 5: Implementing fee mechanism');

    const feeImplementation = await ctx.task(feeImplementationTask, {
      projectName,
      feeStructure,
      vaultImplementation,
      outputDir
    });

    artifacts.push(...feeImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 6: EDGE CASE HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling edge cases');

  const edgeCaseHandling = await ctx.task(edgeCaseHandlingTask, {
    projectName,
    vaultImplementation,
    shareCalculationDesign,
    outputDir
  });

  artifacts.push(...edgeCaseHandling.artifacts);

  // ============================================================================
  // PHASE 7: COMPREHENSIVE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Running comprehensive tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    projectName,
    vaultImplementation,
    shareCalculationDesign,
    framework,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // Quality Gate: Test Review
  await ctx.breakpoint({
    question: `Vault tests complete. Coverage: ${testingSuite.coverage}%, All passing: ${testingSuite.allPassing}. Proceed with DeFi integration testing?`,
    title: 'Vault Test Review',
    context: {
      runId: ctx.runId,
      projectName,
      testResults: testingSuite,
      files: testingSuite.artifacts.map(a => ({ path: a.path, format: 'json' }))
    }
  });

  // ============================================================================
  // PHASE 8: DEFI INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Testing DeFi integration');

  const defiIntegration = await ctx.task(defiIntegrationTask, {
    projectName,
    vaultImplementation,
    outputDir
  });

  artifacts.push(...defiIntegration.artifacts);

  // ============================================================================
  // PHASE 9: SECURITY AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 9: Running security audit');

  const securityAudit = await ctx.task(securityAuditTask, {
    projectName,
    vaultImplementation,
    strategyIntegration,
    outputDir
  });

  artifacts.push(...securityAudit.artifacts);

  // ============================================================================
  // PHASE 10: DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Preparing deployment');

  const deploymentPreparation = await ctx.task(deploymentPreparationTask, {
    projectName,
    vaultImplementation,
    underlyingAsset,
    framework,
    outputDir
  });

  artifacts.push(...deploymentPreparation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    vaultInfo: {
      underlyingAsset,
      yieldStrategy,
      features,
      feeStructure
    },
    shareCalculation: shareCalculationDesign.calculation,
    implementation: {
      contractPath: vaultImplementation.contractPath,
      abi: vaultImplementation.abi
    },
    testResults: {
      coverage: testingSuite.coverage,
      allPassing: testingSuite.allPassing
    },
    securityAnalysis: securityAudit,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/erc4626-tokenized-vault',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const vaultSpecificationTask = defineTask('vault-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Vault Specification - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Vault Architect',
      task: 'Define vault specification',
      context: args,
      instructions: [
        '1. Define underlying asset and decimals',
        '2. Specify yield strategy approach',
        '3. Define deposit/withdrawal limits',
        '4. Specify fee structure',
        '5. Define share token metadata',
        '6. Plan access control',
        '7. Define emergency procedures',
        '8. Specify accounting methodology',
        '9. Plan oracle integrations',
        '10. Document vault specification'
      ],
      outputFormat: 'JSON with vault specification'
    },
    outputSchema: {
      type: 'object',
      required: ['underlyingAsset', 'shareToken', 'artifacts'],
      properties: {
        underlyingAsset: { type: 'object' },
        shareToken: { type: 'object' },
        yieldStrategy: { type: 'string' },
        limits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'specification']
}));

export const shareCalculationDesignTask = defineTask('share-calculation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Share Calculation Design - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Mathematician',
      task: 'Design share calculation logic',
      context: args,
      instructions: [
        '1. Implement convertToShares correctly',
        '2. Implement convertToAssets correctly',
        '3. Handle first deposit edge case',
        '4. Implement rounding correctly (floor for user, ceil for vault)',
        '5. Handle zero totalSupply case',
        '6. Implement previewDeposit/previewMint',
        '7. Implement previewWithdraw/previewRedeem',
        '8. Handle precision loss',
        '9. Document mathematical invariants',
        '10. Create share calculation tests'
      ],
      outputFormat: 'JSON with share calculation design'
    },
    outputSchema: {
      type: 'object',
      required: ['calculation', 'roundingRules', 'artifacts'],
      properties: {
        calculation: { type: 'object' },
        roundingRules: { type: 'object' },
        edgeCases: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'shares']
}));

export const vaultImplementationTask = defineTask('vault-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Vault Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'ERC-4626 Developer',
      task: 'Implement vault contract',
      context: args,
      instructions: [
        '1. Implement ERC4626 using OpenZeppelin',
        '2. Implement deposit and mint functions',
        '3. Implement withdraw and redeem functions',
        '4. Implement maxDeposit/maxMint',
        '5. Implement maxWithdraw/maxRedeem',
        '6. Add proper access control',
        '7. Implement emergency functions',
        '8. Add pause functionality',
        '9. Optimize for gas',
        '10. Add comprehensive NatSpec'
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
        functions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'implementation']
}));

export const strategyIntegrationTask = defineTask('strategy-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Strategy Integration - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Strategy Integrator',
      task: 'Integrate yield strategy',
      context: args,
      instructions: [
        '1. Implement strategy interface',
        '2. Integrate with yield source (Aave, Compound)',
        '3. Implement harvest function',
        '4. Handle yield accounting',
        '5. Implement rebalancing logic',
        '6. Add strategy migration support',
        '7. Implement slippage protection',
        '8. Handle strategy emergencies',
        '9. Test integration thoroughly',
        '10. Document strategy behavior'
      ],
      outputFormat: 'JSON with strategy integration'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyContract', 'yieldSource', 'artifacts'],
      properties: {
        strategyContract: { type: 'string' },
        yieldSource: { type: 'string' },
        harvestMechanism: { type: 'object' },
        expectedAPY: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'strategy']
}));

export const feeImplementationTask = defineTask('fee-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Fee Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Fee Engineer',
      task: 'Implement fee mechanism',
      context: args,
      instructions: [
        '1. Implement deposit fee calculation',
        '2. Implement withdrawal fee calculation',
        '3. Implement performance fee',
        '4. Implement management fee (if needed)',
        '5. Set fee recipient',
        '6. Add fee adjustment functions',
        '7. Implement fee caps',
        '8. Handle fee accounting',
        '9. Test fee calculations',
        '10. Document fee structure'
      ],
      outputFormat: 'JSON with fee implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['feeStructure', 'feeRecipient', 'artifacts'],
      properties: {
        feeStructure: { type: 'object' },
        feeRecipient: { type: 'string' },
        feeCaps: { type: 'object' },
        feeCalculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'fees']
}));

export const edgeCaseHandlingTask = defineTask('edge-case-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Edge Case Handling - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Edge Case Engineer',
      task: 'Handle vault edge cases',
      context: args,
      instructions: [
        '1. Handle first deposit (no shares exist)',
        '2. Handle rounding in conversions',
        '3. Handle zero amount operations',
        '4. Handle max values',
        '5. Handle donation attacks',
        '6. Handle reentrancy scenarios',
        '7. Handle strategy losses',
        '8. Handle extreme yield scenarios',
        '9. Test all edge cases',
        '10. Document edge case handling'
      ],
      outputFormat: 'JSON with edge case handling'
    },
    outputSchema: {
      type: 'object',
      required: ['edgeCases', 'mitigations', 'artifacts'],
      properties: {
        edgeCases: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'edge-cases']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Testing Suite - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'ERC-4626 Test Engineer',
      task: 'Create comprehensive vault tests',
      context: args,
      instructions: [
        '1. Test deposit functionality',
        '2. Test mint functionality',
        '3. Test withdraw functionality',
        '4. Test redeem functionality',
        '5. Test share calculations',
        '6. Test edge cases',
        '7. Test fee calculations',
        '8. Test strategy integration',
        '9. Run fuzz tests',
        '10. Test ERC-4626 compliance'
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
        complianceTests: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'testing']
}));

export const defiIntegrationTask = defineTask('defi-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DeFi Integration - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Integration Specialist',
      task: 'Test DeFi protocol integration',
      context: args,
      instructions: [
        '1. Test composability with lending protocols',
        '2. Test as collateral in other protocols',
        '3. Test flash loan compatibility',
        '4. Test with aggregators',
        '5. Test with yield optimizers',
        '6. Verify ERC-4626 interface compliance',
        '7. Test multi-step transactions',
        '8. Test with permit functions',
        '9. Document integration patterns',
        '10. Create integration examples'
      ],
      outputFormat: 'JSON with DeFi integration results'
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'compatible', 'artifacts'],
      properties: {
        integrations: { type: 'array', items: { type: 'object' } },
        compatible: { type: 'boolean' },
        integrationExamples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'defi']
}));

export const securityAuditTask = defineTask('security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Security Audit - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'DeFi Security Auditor',
      task: 'Audit vault security',
      context: args,
      instructions: [
        '1. Check for inflation attacks',
        '2. Verify share calculation security',
        '3. Check for rounding issues',
        '4. Verify access control',
        '5. Check strategy security',
        '6. Analyze flash loan vectors',
        '7. Check for reentrancy',
        '8. Verify fee accuracy',
        '9. Run static analysis',
        '10. Generate security report'
      ],
      outputFormat: 'JSON with security audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'riskScore', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        riskScore: { type: 'number' },
        criticalIssues: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'security']
}));

export const deploymentPreparationTask = defineTask('deployment-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Deployment Preparation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Vault Deployment Engineer',
      task: 'Prepare vault deployment',
      context: args,
      instructions: [
        '1. Create deployment scripts',
        '2. Configure vault parameters',
        '3. Set up access control',
        '4. Configure fee recipients',
        '5. Set initial strategy',
        '6. Create initialization sequence',
        '7. Prepare monitoring setup',
        '8. Document operations',
        '9. Create emergency procedures',
        '10. Generate deployment checklist'
      ],
      outputFormat: 'JSON with deployment preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentScripts', 'checklist', 'artifacts'],
      properties: {
        deploymentScripts: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc4626', 'deployment']
}));
