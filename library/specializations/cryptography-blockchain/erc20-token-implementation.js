/**
 * @process specializations/cryptography-blockchain/erc20-token-implementation
 * @description ERC-20 Token Implementation - Development process for creating secure, standard-compliant ERC-20 fungible tokens
 * with proper access controls, events, and optional extensions (permit, snapshots, pausable).
 * @inputs { projectName: string, tokenName: string, tokenSymbol: string, totalSupply?: string, features?: array }
 * @outputs { success: boolean, contractAddress?: string, tokenInfo: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/erc20-token-implementation', {
 *   projectName: 'Governance Token',
 *   tokenName: 'Protocol Token',
 *   tokenSymbol: 'PROTO',
 *   totalSupply: '1000000000',
 *   features: ['permit', 'votes', 'pausable', 'mintable', 'burnable']
 * });
 *
 * @references
 * - ERC-20 Standard: https://eips.ethereum.org/EIPS/eip-20
 * - OpenZeppelin ERC20: https://docs.openzeppelin.com/contracts/4.x/erc20
 * - ERC-2612 Permit: https://eips.ethereum.org/EIPS/eip-2612
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    tokenName,
    tokenSymbol,
    totalSupply = '1000000000',
    decimals = 18,
    features = [],
    accessControl = 'ownable',
    upgradeable = false,
    framework = 'foundry',
    outputDir = 'erc20-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ERC-20 Token Implementation: ${tokenName} (${tokenSymbol})`);
  ctx.log('info', `Features: ${features.join(', ')}`);

  // ============================================================================
  // PHASE 1: TOKEN SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining token specification');

  const tokenSpecification = await ctx.task(tokenSpecificationTask, {
    projectName,
    tokenName,
    tokenSymbol,
    totalSupply,
    decimals,
    features,
    accessControl,
    upgradeable,
    outputDir
  });

  artifacts.push(...tokenSpecification.artifacts);

  // ============================================================================
  // PHASE 2: CONTRACT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing token contract');

  const contractImplementation = await ctx.task(contractImplementationTask, {
    projectName,
    tokenSpecification,
    framework,
    outputDir
  });

  artifacts.push(...contractImplementation.artifacts);

  // ============================================================================
  // PHASE 3: EXTENSIONS IMPLEMENTATION
  // ============================================================================

  if (features.length > 0) {
    ctx.log('info', 'Phase 3: Implementing token extensions');

    const extensionsImplementation = await ctx.task(extensionsImplementationTask, {
      projectName,
      tokenSpecification,
      features,
      outputDir
    });

    artifacts.push(...extensionsImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 4: ACCESS CONTROL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up access control');

  const accessControlSetup = await ctx.task(accessControlSetupTask, {
    projectName,
    tokenSpecification,
    accessControl,
    features,
    outputDir
  });

  artifacts.push(...accessControlSetup.artifacts);

  // ============================================================================
  // PHASE 5: COMPREHENSIVE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Running comprehensive tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    projectName,
    tokenSpecification,
    contractImplementation,
    features,
    framework,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // ============================================================================
  // PHASE 6: SECURITY AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 6: Running security analysis');

  const securityAudit = await ctx.task(securityAuditTask, {
    projectName,
    contractImplementation,
    outputDir
  });

  artifacts.push(...securityAudit.artifacts);

  // Quality Gate: Security Review
  if (securityAudit.criticalFindings > 0) {
    await ctx.breakpoint({
      question: `Security analysis found ${securityAudit.criticalFindings} critical issues. Review and fix before deployment?`,
      title: 'Security Issues Found',
      context: {
        runId: ctx.runId,
        findings: securityAudit.findings,
        files: securityAudit.artifacts.map(a => ({ path: a.path, format: 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing deployment');

  const deploymentPreparation = await ctx.task(deploymentPreparationTask, {
    projectName,
    tokenSpecification,
    contractImplementation,
    framework,
    outputDir
  });

  artifacts.push(...deploymentPreparation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    tokenInfo: {
      name: tokenName,
      symbol: tokenSymbol,
      decimals,
      totalSupply,
      features
    },
    implementation: {
      contractPath: contractImplementation.contractPath,
      abi: contractImplementation.abi
    },
    testResults: {
      coverage: testingSuite.coverage,
      allPassing: testingSuite.allPassing
    },
    securityAnalysis: {
      findings: securityAudit.totalFindings,
      criticalIssues: securityAudit.criticalFindings
    },
    deploymentScripts: deploymentPreparation.scripts,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/erc20-token-implementation',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const tokenSpecificationTask = defineTask('token-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Token Specification - ${args.tokenName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-011: erc20-implementation)
    prompt: {
      role: 'Token Architect',
      task: 'Define comprehensive token specification',
      context: args,
      instructions: [
        '1. Define token metadata (name, symbol, decimals)',
        '2. Specify initial supply and distribution',
        '3. Define minting/burning capabilities',
        '4. Specify transfer restrictions if any',
        '5. Define pause functionality requirements',
        '6. Specify permit (ERC-2612) requirements',
        '7. Define snapshot functionality if needed',
        '8. Specify voting (ERC20Votes) requirements',
        '9. Document access control requirements',
        '10. Create formal specification document'
      ],
      outputFormat: 'JSON with token specification'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'symbol', 'decimals', 'artifacts'],
      properties: {
        name: { type: 'string' },
        symbol: { type: 'string' },
        decimals: { type: 'number' },
        totalSupply: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        distribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'specification']
}));

export const contractImplementationTask = defineTask('contract-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Contract Implementation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-011: erc20-implementation, SK-001: solidity-dev)
    prompt: {
      role: 'Senior Solidity Developer',
      task: 'Implement ERC-20 token contract',
      context: args,
      instructions: [
        '1. Create contract using OpenZeppelin base',
        '2. Implement constructor with token metadata',
        '3. Implement transfer and transferFrom',
        '4. Implement approve and allowance',
        '5. Add proper NatSpec documentation',
        '6. Implement events for all state changes',
        '7. Add custom errors for gas efficiency',
        '8. Optimize storage layout',
        '9. Follow Checks-Effects-Interactions pattern',
        '10. Generate ABI and interface'
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
        interfacePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'implementation']
}));

export const extensionsImplementationTask = defineTask('extensions-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Extensions Implementation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-011: erc20-implementation)
    prompt: {
      role: 'Token Extension Developer',
      task: 'Implement ERC-20 extensions',
      context: args,
      instructions: [
        '1. Implement ERC-2612 permit if required',
        '2. Add ERC20Votes for governance if required',
        '3. Implement pausable functionality',
        '4. Add mint function with access control',
        '5. Add burn function with access control',
        '6. Implement snapshot functionality',
        '7. Add flash minting if required',
        '8. Implement any custom extensions',
        '9. Test extension interactions',
        '10. Document extension usage'
      ],
      outputFormat: 'JSON with extension details'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedExtensions', 'artifacts'],
      properties: {
        implementedExtensions: { type: 'array', items: { type: 'string' } },
        extensionPaths: { type: 'array', items: { type: 'string' } },
        integrationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'extensions']
}));

export const accessControlSetupTask = defineTask('access-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Access Control Setup - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Access Control Engineer',
      task: 'Configure token access control',
      context: args,
      instructions: [
        '1. Implement Ownable or AccessControl',
        '2. Define roles for minting/burning',
        '3. Configure pause/unpause permissions',
        '4. Set up admin role management',
        '5. Implement role transfer safely',
        '6. Add role renouncement capability',
        '7. Document all roles and permissions',
        '8. Consider multi-sig requirements',
        '9. Implement timelock if needed',
        '10. Test all access control paths'
      ],
      outputFormat: 'JSON with access control configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['accessControlType', 'roles', 'artifacts'],
      properties: {
        accessControlType: { type: 'string' },
        roles: { type: 'array', items: { type: 'object' } },
        roleHierarchy: { type: 'object' },
        adminFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'access-control']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Testing Suite - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Smart Contract Test Engineer',
      task: 'Create comprehensive test suite',
      context: args,
      instructions: [
        '1. Test transfer functionality',
        '2. Test approve and allowance',
        '3. Test permit signatures',
        '4. Test mint and burn functions',
        '5. Test pause functionality',
        '6. Test access control restrictions',
        '7. Test edge cases (zero transfers, max uint)',
        '8. Test event emissions',
        '9. Run fuzz tests',
        '10. Achieve 100% coverage'
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
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'testing']
}));

export const securityAuditTask = defineTask('security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Security Audit - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-002: slither-analysis)
    prompt: {
      role: 'Smart Contract Security Auditor',
      task: 'Audit token contract security',
      context: args,
      instructions: [
        '1. Run Slither static analysis',
        '2. Check for common token vulnerabilities',
        '3. Verify ERC-20 compliance',
        '4. Check for reentrancy issues',
        '5. Verify access control correctness',
        '6. Check for front-running vulnerabilities',
        '7. Verify permit signature security',
        '8. Check for integer issues',
        '9. Review gas optimization safety',
        '10. Generate security report'
      ],
      outputFormat: 'JSON with security audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'totalFindings', 'criticalFindings', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        totalFindings: { type: 'number' },
        criticalFindings: { type: 'number' },
        highFindings: { type: 'number' },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'security']
}));

export const deploymentPreparationTask = defineTask('deployment-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Deployment Preparation - ${args.projectName}`,
  agent: {
    name: 'token-standards', // AG-003: Token Standards Specialist (uses SK-004: foundry-framework, SK-009: hardhat-framework)
    prompt: {
      role: 'Deployment Engineer',
      task: 'Prepare token deployment',
      context: args,
      instructions: [
        '1. Create deployment scripts',
        '2. Configure constructor arguments',
        '3. Prepare verification commands',
        '4. Document deployment process',
        '5. Create testnet deployment guide',
        '6. Prepare mainnet checklist',
        '7. Configure initial distribution',
        '8. Prepare post-deployment verification',
        '9. Document token addresses registry',
        '10. Create deployment documentation'
      ],
      outputFormat: 'JSON with deployment preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'deploymentGuide', 'artifacts'],
      properties: {
        scripts: { type: 'array', items: { type: 'string' } },
        constructorArgs: { type: 'object' },
        deploymentGuide: { type: 'string' },
        verificationCommands: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'erc20', 'deployment']
}));
