/**
 * @process specializations/cryptography-blockchain/smart-contract-development-lifecycle
 * @description Smart Contract Development Lifecycle - End-to-end process for developing secure smart contracts from requirements
 * through deployment, including design, implementation, testing, auditing, and mainnet deployment with proper verification.
 * Covers Solidity/Vyper development, security patterns, gas optimization, and deployment automation.
 * @inputs { projectName: string, contractType?: string, blockchain?: string, requirements?: array, securityLevel?: string }
 * @outputs { success: boolean, contracts: array, testResults: object, auditFindings: array, deploymentInfo: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/smart-contract-development-lifecycle', {
 *   projectName: 'DeFi Vault',
 *   contractType: 'vault',
 *   blockchain: 'ethereum',
 *   requirements: ['ERC-4626 compliant', 'upgradeable', 'multi-asset support'],
 *   securityLevel: 'high',
 *   testnet: 'sepolia',
 *   framework: 'foundry'
 * });
 *
 * @references
 * - Solidity Documentation: https://docs.soliditylang.org/
 * - ConsenSys Smart Contract Best Practices: https://consensys.github.io/smart-contract-best-practices/
 * - Foundry Book: https://book.getfoundry.sh/
 * - OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contractType = 'custom',
    blockchain = 'ethereum',
    requirements = [],
    securityLevel = 'high',
    testnet = 'sepolia',
    framework = 'foundry',
    upgradeability = false,
    gasOptimization = true,
    formalVerification = false,
    outputDir = 'smart-contract-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Smart Contract Development Lifecycle: ${projectName}`);
  ctx.log('info', `Contract Type: ${contractType}, Blockchain: ${blockchain}, Security Level: ${securityLevel}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Requirements analysis and specification');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    contractType,
    blockchain,
    requirements,
    securityLevel,
    upgradeability,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONTRACT ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing contract architecture');

  const architectureDesign = await ctx.task(architectureDesignTask, {
    projectName,
    contractType,
    requirementsAnalysis,
    upgradeability,
    blockchain,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // Quality Gate: Architecture Review
  await ctx.breakpoint({
    question: `Contract architecture designed for ${projectName}. Review architecture decisions, contract hierarchy, and security patterns before implementation?`,
    title: 'Contract Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      contracts: architectureDesign.contracts,
      securityPatterns: architectureDesign.securityPatterns,
      upgradePattern: architectureDesign.upgradePattern,
      files: architectureDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: SMART CONTRACT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing smart contracts');

  const contractImplementation = await ctx.task(contractImplementationTask, {
    projectName,
    architectureDesign,
    framework,
    securityLevel,
    gasOptimization,
    outputDir
  });

  artifacts.push(...contractImplementation.artifacts);

  // ============================================================================
  // PHASE 4: UNIT AND INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Writing comprehensive tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    projectName,
    contractImplementation,
    framework,
    securityLevel,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // ============================================================================
  // PHASE 5: GAS OPTIMIZATION
  // ============================================================================

  if (gasOptimization) {
    ctx.log('info', 'Phase 5: Optimizing gas consumption');

    const gasOptimizationResult = await ctx.task(gasOptimizationTask, {
      projectName,
      contractImplementation,
      testingSuite,
      framework,
      outputDir
    });

    artifacts.push(...gasOptimizationResult.artifacts);
  }

  // ============================================================================
  // PHASE 6: SECURITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Running security analysis');

  const [staticAnalysis, dynamicAnalysis] = await ctx.parallel.all([
    () => ctx.task(staticAnalysisTask, {
      projectName,
      contractImplementation,
      outputDir
    }),
    () => ctx.task(dynamicAnalysisTask, {
      projectName,
      contractImplementation,
      testingSuite,
      outputDir
    })
  ]);

  artifacts.push(...staticAnalysis.artifacts, ...dynamicAnalysis.artifacts);

  // Quality Gate: Security Analysis Review
  if (staticAnalysis.criticalFindings > 0 || dynamicAnalysis.criticalFindings > 0) {
    await ctx.breakpoint({
      question: `Security analysis found ${staticAnalysis.criticalFindings + dynamicAnalysis.criticalFindings} critical findings. Review and address security issues before proceeding?`,
      title: 'Security Analysis Review',
      context: {
        runId: ctx.runId,
        projectName,
        staticFindings: staticAnalysis.findings,
        dynamicFindings: dynamicAnalysis.findings,
        criticalCount: staticAnalysis.criticalFindings + dynamicAnalysis.criticalFindings,
        recommendation: 'Address all critical and high severity findings before deployment',
        files: [
          ...staticAnalysis.artifacts.map(a => ({ path: a.path, format: 'json' })),
          ...dynamicAnalysis.artifacts.map(a => ({ path: a.path, format: 'json' }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 7: FORMAL VERIFICATION (if enabled)
  // ============================================================================

  let formalVerificationResult = null;
  if (formalVerification) {
    ctx.log('info', 'Phase 7: Running formal verification');

    formalVerificationResult = await ctx.task(formalVerificationTask, {
      projectName,
      contractImplementation,
      architectureDesign,
      outputDir
    });

    artifacts.push(...formalVerificationResult.artifacts);
  }

  // ============================================================================
  // PHASE 8: TESTNET DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Deploying to testnet');

  const testnetDeployment = await ctx.task(testnetDeploymentTask, {
    projectName,
    contractImplementation,
    testnet,
    blockchain,
    framework,
    outputDir
  });

  artifacts.push(...testnetDeployment.artifacts);

  // ============================================================================
  // PHASE 9: TESTNET VERIFICATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Verifying testnet deployment');

  const testnetVerification = await ctx.task(testnetVerificationTask, {
    projectName,
    testnetDeployment,
    testingSuite,
    blockchain,
    outputDir
  });

  artifacts.push(...testnetVerification.artifacts);

  // Quality Gate: Testnet Deployment Review
  await ctx.breakpoint({
    question: `Testnet deployment complete for ${projectName}. Contracts verified: ${testnetVerification.contractsVerified}. All tests passing: ${testnetVerification.allTestsPassing}. Ready for audit preparation?`,
    title: 'Testnet Deployment Review',
    context: {
      runId: ctx.runId,
      projectName,
      deployedContracts: testnetDeployment.deployedContracts,
      verificationStatus: testnetVerification.verificationStatus,
      testResults: testnetVerification.testResults,
      explorerLinks: testnetDeployment.explorerLinks,
      files: testnetDeployment.artifacts.map(a => ({ path: a.path, format: 'json' }))
    }
  });

  // ============================================================================
  // PHASE 10: AUDIT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Preparing audit documentation');

  const auditPreparation = await ctx.task(auditPreparationTask, {
    projectName,
    architectureDesign,
    contractImplementation,
    testingSuite,
    staticAnalysis,
    dynamicAnalysis,
    testnetDeployment,
    outputDir
  });

  artifacts.push(...auditPreparation.artifacts);

  // ============================================================================
  // PHASE 11: DEPLOYMENT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating deployment documentation');

  const deploymentDocs = await ctx.task(deploymentDocumentationTask, {
    projectName,
    architectureDesign,
    contractImplementation,
    testnetDeployment,
    blockchain,
    outputDir
  });

  artifacts.push(...deploymentDocs.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Smart Contract Development Lifecycle complete for ${projectName}. Contracts implemented: ${contractImplementation.contracts.length}. Test coverage: ${testingSuite.coverage}%. Security issues addressed. Ready for external audit and mainnet deployment preparation?`,
    title: 'Development Lifecycle Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        contractType,
        blockchain,
        contractsImplemented: contractImplementation.contracts.length,
        testCoverage: testingSuite.coverage,
        securityAnalysisComplete: true,
        testnetDeployed: true,
        auditDocsPrepared: true
      },
      files: [
        { path: auditPreparation.auditPackagePath, format: 'markdown', label: 'Audit Package' },
        { path: deploymentDocs.deploymentGuidePath, format: 'markdown', label: 'Deployment Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    contracts: contractImplementation.contracts,
    architecture: {
      design: architectureDesign.contracts,
      securityPatterns: architectureDesign.securityPatterns,
      upgradePattern: architectureDesign.upgradePattern
    },
    testResults: {
      coverage: testingSuite.coverage,
      testsCount: testingSuite.testsCount,
      allPassing: testingSuite.allPassing
    },
    securityAnalysis: {
      staticFindings: staticAnalysis.findings,
      dynamicFindings: dynamicAnalysis.findings,
      criticalIssues: staticAnalysis.criticalFindings + dynamicAnalysis.criticalFindings
    },
    formalVerification: formalVerificationResult,
    deployment: {
      testnet,
      contracts: testnetDeployment.deployedContracts,
      explorerLinks: testnetDeployment.explorerLinks,
      verified: testnetVerification.contractsVerified
    },
    auditPackage: auditPreparation.auditPackagePath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/smart-contract-development-lifecycle',
      timestamp: startTime,
      framework,
      blockchain
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Smart Contract Requirements Analyst',
      task: 'Analyze and document smart contract requirements',
      context: {
        projectName: args.projectName,
        contractType: args.contractType,
        blockchain: args.blockchain,
        requirements: args.requirements,
        securityLevel: args.securityLevel,
        upgradeability: args.upgradeability,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze functional requirements for the smart contract',
        '2. Identify non-functional requirements (gas efficiency, upgradeability)',
        '3. Document security requirements based on security level',
        '4. Identify external dependencies (oracles, other contracts)',
        '5. Define access control requirements',
        '6. Specify event emission requirements for indexing',
        '7. Document compliance requirements (ERC standards)',
        '8. Identify potential attack vectors to mitigate',
        '9. Define testing requirements and coverage targets',
        '10. Create formal specification document'
      ],
      outputFormat: 'JSON with requirements specification'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalRequirements', 'securityRequirements', 'artifacts'],
      properties: {
        functionalRequirements: { type: 'array', items: { type: 'object' } },
        nonFunctionalRequirements: { type: 'array', items: { type: 'object' } },
        securityRequirements: { type: 'array', items: { type: 'object' } },
        externalDependencies: { type: 'array', items: { type: 'string' } },
        ercStandards: { type: 'array', items: { type: 'string' } },
        attackVectors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'requirements']
}));

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Architecture Design - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Smart Contract Architect',
      task: 'Design smart contract architecture with security patterns',
      context: {
        projectName: args.projectName,
        contractType: args.contractType,
        requirementsAnalysis: args.requirementsAnalysis,
        upgradeability: args.upgradeability,
        blockchain: args.blockchain,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design contract hierarchy and inheritance structure',
        '2. Define contract interfaces and abstract contracts',
        '3. Select appropriate security patterns (Checks-Effects-Interactions, ReentrancyGuard)',
        '4. Design access control architecture (Ownable, AccessControl, multi-sig)',
        '5. Plan state variable layout for gas optimization',
        '6. Design upgrade pattern if upgradeability required (UUPS, Transparent Proxy)',
        '7. Define event structure for off-chain indexing',
        '8. Plan error handling strategy (custom errors vs revert strings)',
        '9. Design integration points with external contracts',
        '10. Document architecture decisions and rationale'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'securityPatterns', 'artifacts'],
      properties: {
        contracts: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        securityPatterns: { type: 'array', items: { type: 'string' } },
        accessControlModel: { type: 'string' },
        upgradePattern: { type: 'string' },
        storageLayout: { type: 'object' },
        events: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'architecture']
}));

export const contractImplementationTask = defineTask('contract-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contract Implementation - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-001: solidity-dev)
    prompt: {
      role: 'Senior Smart Contract Developer',
      task: 'Implement smart contracts following best practices',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        framework: args.framework,
        securityLevel: args.securityLevel,
        gasOptimization: args.gasOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up development environment with Foundry/Hardhat',
        '2. Implement contract interfaces first',
        '3. Implement base contracts with security patterns',
        '4. Implement main contract logic following Checks-Effects-Interactions',
        '5. Add comprehensive NatSpec documentation',
        '6. Implement access control modifiers',
        '7. Add event emissions for all state changes',
        '8. Implement custom errors for gas efficiency',
        '9. Use SafeMath or Solidity 0.8+ overflow protection',
        '10. Follow style guide and naming conventions'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'sourcePaths', 'artifacts'],
      properties: {
        contracts: { type: 'array', items: { type: 'object' } },
        sourcePaths: { type: 'array', items: { type: 'string' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        libraries: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'implementation', 'solidity']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Testing Suite - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-004: foundry-framework)
    prompt: {
      role: 'Smart Contract Testing Specialist',
      task: 'Create comprehensive test suite for smart contracts',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        framework: args.framework,
        securityLevel: args.securityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up testing framework (Forge for Foundry)',
        '2. Write unit tests for all public functions',
        '3. Test all edge cases and boundary conditions',
        '4. Write integration tests for contract interactions',
        '5. Test access control and authorization',
        '6. Test event emissions',
        '7. Write negative tests (expected failures)',
        '8. Test upgrade scenarios if applicable',
        '9. Achieve minimum 95% code coverage',
        '10. Generate coverage report'
      ],
      outputFormat: 'JSON with test suite details'
    },
    outputSchema: {
      type: 'object',
      required: ['testsCount', 'coverage', 'allPassing', 'artifacts'],
      properties: {
        testsCount: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        coverage: { type: 'number' },
        coverageByContract: { type: 'object' },
        allPassing: { type: 'boolean' },
        failedTests: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'testing', 'foundry']
}));

export const gasOptimizationTask = defineTask('gas-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Gas Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization)
    prompt: {
      role: 'Smart Contract Gas Optimization Specialist',
      task: 'Optimize gas consumption while maintaining security',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        testingSuite: args.testingSuite,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate gas report for all functions',
        '2. Identify high gas consumption functions',
        '3. Optimize storage variable packing',
        '4. Use calldata instead of memory where possible',
        '5. Implement unchecked blocks for safe arithmetic',
        '6. Optimize loop operations',
        '7. Use custom errors instead of revert strings',
        '8. Cache storage reads in memory',
        '9. Compare gas before and after optimizations',
        '10. Verify tests still pass after optimization'
      ],
      outputFormat: 'JSON with gas optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'gasSavings', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        gasSavings: { type: 'object' },
        gasReportBefore: { type: 'object' },
        gasReportAfter: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'gas-optimization']
}));

export const staticAnalysisTask = defineTask('static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6a: Static Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-002: slither-analysis, SK-003: mythril-symbolic)
    prompt: {
      role: 'Smart Contract Security Analyst',
      task: 'Run static analysis tools to identify vulnerabilities',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run Slither static analyzer',
        '2. Run Mythril symbolic execution',
        '3. Check for common vulnerabilities (reentrancy, overflow)',
        '4. Analyze access control issues',
        '5. Check for unchecked external calls',
        '6. Identify centralization risks',
        '7. Check for front-running vulnerabilities',
        '8. Analyze oracle manipulation risks',
        '9. Classify findings by severity',
        '10. Generate remediation recommendations'
      ],
      outputFormat: 'JSON with static analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'criticalFindings', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        criticalFindings: { type: 'number' },
        highFindings: { type: 'number' },
        mediumFindings: { type: 'number' },
        lowFindings: { type: 'number' },
        toolsUsed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'security', 'static-analysis']
}));

export const dynamicAnalysisTask = defineTask('dynamic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6b: Dynamic Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-005: echidna-fuzzer)
    prompt: {
      role: 'Smart Contract Security Analyst',
      task: 'Run dynamic analysis and fuzzing to find vulnerabilities',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        testingSuite: args.testingSuite,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run Echidna fuzzer with property tests',
        '2. Run Foundry fuzz tests',
        '3. Define and test invariants',
        '4. Test with extreme input values',
        '5. Test state transitions and sequences',
        '6. Analyze failed property tests',
        '7. Identify edge cases',
        '8. Test economic attack scenarios',
        '9. Generate minimized failing cases',
        '10. Document findings and recommendations'
      ],
      outputFormat: 'JSON with dynamic analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'criticalFindings', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        criticalFindings: { type: 'number' },
        invariantsTested: { type: 'number' },
        invariantsFailed: { type: 'number' },
        fuzzRunCount: { type: 'number' },
        failingCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'security', 'fuzzing']
}));

export const formalVerificationTask = defineTask('formal-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Formal Verification - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer (uses SK-006: certora-prover)
    prompt: {
      role: 'Formal Verification Engineer',
      task: 'Formally verify critical contract properties',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify critical properties to verify',
        '2. Write Certora specifications',
        '3. Define invariants in formal language',
        '4. Run Certora prover',
        '5. Analyze counterexamples',
        '6. Refine specifications as needed',
        '7. Document proven properties',
        '8. Document unproven or timeout properties',
        '9. Generate verification report',
        '10. Maintain specifications with code'
      ],
      outputFormat: 'JSON with formal verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['propertiesVerified', 'propertiesFailed', 'artifacts'],
      properties: {
        propertiesVerified: { type: 'array', items: { type: 'string' } },
        propertiesFailed: { type: 'array', items: { type: 'string' } },
        counterexamples: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'formal-verification', 'certora']
}));

export const testnetDeploymentTask = defineTask('testnet-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testnet Deployment - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-004: foundry-framework, SK-009: hardhat-framework)
    prompt: {
      role: 'Smart Contract Deployment Engineer',
      task: 'Deploy contracts to testnet',
      context: {
        projectName: args.projectName,
        contractImplementation: args.contractImplementation,
        testnet: args.testnet,
        blockchain: args.blockchain,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare deployment scripts',
        '2. Configure testnet RPC and credentials',
        '3. Deploy contracts in correct order',
        '4. Initialize contracts with parameters',
        '5. Set up access control roles',
        '6. Verify contracts on block explorer',
        '7. Record deployment addresses',
        '8. Generate deployment artifacts',
        '9. Test basic functionality on testnet',
        '10. Document deployment process'
      ],
      outputFormat: 'JSON with testnet deployment details'
    },
    outputSchema: {
      type: 'object',
      required: ['deployedContracts', 'explorerLinks', 'artifacts'],
      properties: {
        deployedContracts: { type: 'array', items: { type: 'object' } },
        explorerLinks: { type: 'array', items: { type: 'string' } },
        deploymentTransactions: { type: 'array', items: { type: 'string' } },
        totalGasUsed: { type: 'number' },
        deploymentCost: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'deployment', 'testnet']
}));

export const testnetVerificationTask = defineTask('testnet-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Testnet Verification - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Smart Contract QA Engineer',
      task: 'Verify testnet deployment and run integration tests',
      context: {
        projectName: args.projectName,
        testnetDeployment: args.testnetDeployment,
        testingSuite: args.testingSuite,
        blockchain: args.blockchain,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify contract source code on explorer',
        '2. Run integration tests against testnet',
        '3. Test all user flows end-to-end',
        '4. Verify event emissions',
        '5. Test access control restrictions',
        '6. Verify gas estimates are accurate',
        '7. Test with various wallet types',
        '8. Document any testnet-specific issues',
        '9. Generate verification report',
        '10. Sign off on testnet deployment'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['contractsVerified', 'allTestsPassing', 'artifacts'],
      properties: {
        contractsVerified: { type: 'boolean' },
        verificationStatus: { type: 'object' },
        testResults: { type: 'object' },
        allTestsPassing: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'verification', 'qa']
}));

export const auditPreparationTask = defineTask('audit-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Audit Preparation - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Security Audit Coordinator',
      task: 'Prepare comprehensive audit package',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        contractImplementation: args.contractImplementation,
        testingSuite: args.testingSuite,
        staticAnalysis: args.staticAnalysis,
        dynamicAnalysis: args.dynamicAnalysis,
        testnetDeployment: args.testnetDeployment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compile all source code with documentation',
        '2. Create architecture documentation',
        '3. Document all external dependencies',
        '4. Prepare threat model and attack surfaces',
        '5. Include all test results and coverage',
        '6. Include static analysis reports',
        '7. Document known issues and mitigations',
        '8. Prepare scope and out-of-scope definition',
        '9. Create audit questionnaire responses',
        '10. Package all materials for auditors'
      ],
      outputFormat: 'JSON with audit package details'
    },
    outputSchema: {
      type: 'object',
      required: ['auditPackagePath', 'components', 'artifacts'],
      properties: {
        auditPackagePath: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        scopeDefinition: { type: 'object' },
        threatModel: { type: 'object' },
        knownIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'audit', 'documentation']
}));

export const deploymentDocumentationTask = defineTask('deployment-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Deployment Documentation - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Create comprehensive deployment documentation',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        contractImplementation: args.contractImplementation,
        testnetDeployment: args.testnetDeployment,
        blockchain: args.blockchain,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document deployment prerequisites',
        '2. Create step-by-step deployment guide',
        '3. Document configuration parameters',
        '4. Create post-deployment verification steps',
        '5. Document upgrade procedures if applicable',
        '6. Create emergency procedures and contacts',
        '7. Document monitoring requirements',
        '8. Create runbook for common operations',
        '9. Document rollback procedures',
        '10. Create mainnet deployment checklist'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentGuidePath', 'artifacts'],
      properties: {
        deploymentGuidePath: { type: 'string' },
        configurationDoc: { type: 'string' },
        upgradeGuide: { type: 'string' },
        emergencyProcedures: { type: 'string' },
        runbook: { type: 'string' },
        mainnetChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'smart-contracts', 'documentation', 'deployment']
}));
