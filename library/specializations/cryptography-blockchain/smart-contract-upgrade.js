/**
 * @process specializations/cryptography-blockchain/smart-contract-upgrade
 * @description Smart Contract Upgrade Process - Safe upgrade process for proxy-based upgradeable contracts including storage
 * layout verification, compatibility checks, governance approval, and rollback planning.
 * @inputs { projectName: string, proxyAddress?: string, upgradeType?: string, newImplementation?: string }
 * @outputs { success: boolean, upgradeStatus: object, verificationResult: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/smart-contract-upgrade', {
 *   projectName: 'Protocol Upgrade v2',
 *   proxyAddress: '0x1234...',
 *   upgradeType: 'UUPS',
 *   newImplementation: 'contracts/v2/ProtocolV2.sol',
 *   governance: 'timelock'
 * });
 *
 * @references
 * - OpenZeppelin Upgrades: https://docs.openzeppelin.com/upgrades-plugins/
 * - EIP-1967 Proxy Storage Slots: https://eips.ethereum.org/EIPS/eip-1967
 * - UUPS Pattern: https://eips.ethereum.org/EIPS/eip-1822
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    proxyAddress,
    upgradeType = 'UUPS',
    newImplementation,
    governance = 'timelock',
    testnet = 'sepolia',
    requireMultisig = true,
    outputDir = 'upgrade-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Smart Contract Upgrade: ${projectName}`);
  ctx.log('info', `Upgrade Type: ${upgradeType}, Governance: ${governance}`);

  // ============================================================================
  // PHASE 1: STORAGE LAYOUT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Verifying storage layout compatibility');

  const storageVerification = await ctx.task(storageVerificationTask, {
    projectName,
    proxyAddress,
    newImplementation,
    upgradeType,
    outputDir
  });

  artifacts.push(...storageVerification.artifacts);

  if (!storageVerification.compatible) {
    await ctx.breakpoint({
      question: `Storage layout incompatibility detected! ${storageVerification.incompatibilities.length} issues found. Review and resolve before proceeding?`,
      title: 'Storage Layout Incompatibility',
      context: {
        runId: ctx.runId,
        projectName,
        incompatibilities: storageVerification.incompatibilities,
        recommendation: 'Fix storage layout issues before upgrade',
        files: storageVerification.artifacts.map(a => ({ path: a.path, format: 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: NEW IMPLEMENTATION AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 2: Auditing new implementation');

  const implementationAudit = await ctx.task(implementationAuditTask, {
    projectName,
    newImplementation,
    upgradeType,
    outputDir
  });

  artifacts.push(...implementationAudit.artifacts);

  // ============================================================================
  // PHASE 3: TESTNET UPGRADE SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Simulating upgrade on testnet');

  const testnetSimulation = await ctx.task(testnetSimulationTask, {
    projectName,
    proxyAddress,
    newImplementation,
    testnet,
    outputDir
  });

  artifacts.push(...testnetSimulation.artifacts);

  // Quality Gate: Simulation Review
  await ctx.breakpoint({
    question: `Testnet simulation complete. Success: ${testnetSimulation.success}. All functions working: ${testnetSimulation.functionalityVerified}. Proceed with governance proposal?`,
    title: 'Testnet Simulation Review',
    context: {
      runId: ctx.runId,
      projectName,
      simulationResult: testnetSimulation,
      files: testnetSimulation.artifacts.map(a => ({ path: a.path, format: 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: GOVERNANCE PROPOSAL
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating governance proposal');

  const governanceProposal = await ctx.task(governanceProposalTask, {
    projectName,
    proxyAddress,
    newImplementation,
    governance,
    implementationAudit,
    outputDir
  });

  artifacts.push(...governanceProposal.artifacts);

  // ============================================================================
  // PHASE 5: MULTI-SIG COORDINATION
  // ============================================================================

  if (requireMultisig) {
    ctx.log('info', 'Phase 5: Coordinating multi-sig execution');

    const multisigCoordination = await ctx.task(multisigCoordinationTask, {
      projectName,
      governanceProposal,
      outputDir
    });

    artifacts.push(...multisigCoordination.artifacts);
  }

  // ============================================================================
  // PHASE 6: POST-UPGRADE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Verifying post-upgrade state');

  const postUpgradeVerification = await ctx.task(postUpgradeVerificationTask, {
    projectName,
    proxyAddress,
    newImplementation,
    outputDir
  });

  artifacts.push(...postUpgradeVerification.artifacts);

  // ============================================================================
  // PHASE 7: ROLLBACK DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Documenting rollback procedures');

  const rollbackDocs = await ctx.task(rollbackDocumentationTask, {
    projectName,
    proxyAddress,
    upgradeType,
    outputDir
  });

  artifacts.push(...rollbackDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    upgradeStatus: {
      storageCompatible: storageVerification.compatible,
      simulationPassed: testnetSimulation.success,
      proposalCreated: governanceProposal.proposalId,
      verified: postUpgradeVerification.verified
    },
    verificationResult: postUpgradeVerification,
    rollbackProcedure: rollbackDocs.rollbackPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/smart-contract-upgrade',
      timestamp: startTime,
      upgradeType,
      governance
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const storageVerificationTask = defineTask('storage-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Storage Verification - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist (uses SK-017: proxy-upgrade)
    prompt: {
      role: 'Smart Contract Upgrade Engineer',
      task: 'Verify storage layout compatibility',
      context: args,
      instructions: [
        '1. Extract current implementation storage layout',
        '2. Extract new implementation storage layout',
        '3. Compare slot assignments',
        '4. Check for variable type changes',
        '5. Verify no storage collisions',
        '6. Check inheritance order',
        '7. Verify gap variables are maintained',
        '8. Document any incompatibilities',
        '9. Suggest fixes for issues',
        '10. Generate compatibility report'
      ],
      outputFormat: 'JSON with storage verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['compatible', 'incompatibilities', 'artifacts'],
      properties: {
        compatible: { type: 'boolean' },
        incompatibilities: { type: 'array', items: { type: 'object' } },
        currentLayout: { type: 'object' },
        newLayout: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'storage']
}));

export const implementationAuditTask = defineTask('implementation-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Implementation Audit - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Security Auditor',
      task: 'Audit new implementation for upgrade safety',
      context: args,
      instructions: [
        '1. Verify upgrade function is protected',
        '2. Check initializer is properly guarded',
        '3. Verify no constructor usage',
        '4. Check for selfdestruct removal',
        '5. Verify delegatecall safety',
        '6. Review new functionality security',
        '7. Check access control preservation',
        '8. Verify event emissions',
        '9. Run static analysis',
        '10. Document audit findings'
      ],
      outputFormat: 'JSON with audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'safeToUpgrade', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        safeToUpgrade: { type: 'boolean' },
        upgradeRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'audit']
}));

export const testnetSimulationTask = defineTask('testnet-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Testnet Simulation - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Deployment Engineer',
      task: 'Simulate upgrade on testnet',
      context: args,
      instructions: [
        '1. Fork mainnet state to testnet',
        '2. Deploy new implementation',
        '3. Execute upgrade transaction',
        '4. Verify implementation address changed',
        '5. Test all existing functions',
        '6. Test new functions',
        '7. Verify state preservation',
        '8. Check event emissions',
        '9. Run integration tests',
        '10. Document simulation results'
      ],
      outputFormat: 'JSON with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'functionalityVerified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        functionalityVerified: { type: 'boolean' },
        testResults: { type: 'object' },
        statePreserved: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'simulation']
}));

export const governanceProposalTask = defineTask('governance-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Governance Proposal - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist
    prompt: {
      role: 'Governance Coordinator',
      task: 'Create and submit governance proposal',
      context: args,
      instructions: [
        '1. Draft proposal description',
        '2. Document upgrade rationale',
        '3. Include audit results',
        '4. Specify calldata for upgrade',
        '5. Set appropriate timelock delay',
        '6. Submit proposal on-chain',
        '7. Notify governance participants',
        '8. Track voting progress',
        '9. Document proposal details',
        '10. Prepare execution plan'
      ],
      outputFormat: 'JSON with proposal details'
    },
    outputSchema: {
      type: 'object',
      required: ['proposalId', 'proposalDescription', 'artifacts'],
      properties: {
        proposalId: { type: 'string' },
        proposalDescription: { type: 'string' },
        calldata: { type: 'string' },
        timelockDelay: { type: 'number' },
        executionPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'governance']
}));

export const multisigCoordinationTask = defineTask('multisig-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Multi-sig Coordination - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist
    prompt: {
      role: 'Multi-sig Coordinator',
      task: 'Coordinate multi-sig execution',
      context: args,
      instructions: [
        '1. Prepare Safe transaction',
        '2. Collect required signatures',
        '3. Verify all signers reviewed',
        '4. Queue transaction in timelock',
        '5. Wait for timelock delay',
        '6. Execute transaction',
        '7. Verify execution success',
        '8. Document all signatures',
        '9. Archive transaction details',
        '10. Notify stakeholders'
      ],
      outputFormat: 'JSON with multi-sig execution details'
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'signatures', 'artifacts'],
      properties: {
        executed: { type: 'boolean' },
        signatures: { type: 'array', items: { type: 'string' } },
        transactionHash: { type: 'string' },
        safeTxHash: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'multisig']
}));

export const postUpgradeVerificationTask = defineTask('post-upgrade-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Post-Upgrade Verification - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist (uses SK-017: proxy-upgrade)
    prompt: {
      role: 'Verification Engineer',
      task: 'Verify upgrade completed successfully',
      context: args,
      instructions: [
        '1. Verify implementation address updated',
        '2. Check proxy admin state',
        '3. Verify all functions callable',
        '4. Check state variables preserved',
        '5. Verify new features working',
        '6. Run smoke tests',
        '7. Monitor for anomalies',
        '8. Verify events emitted correctly',
        '9. Check external integrations',
        '10. Sign off on upgrade'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'verificationChecks', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        verificationChecks: { type: 'object' },
        newImplementationAddress: { type: 'string' },
        functionalityTests: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'verification']
}));

export const rollbackDocumentationTask = defineTask('rollback-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Rollback Documentation - ${args.projectName}`,
  agent: {
    name: 'upgrade-specialist', // AG-007: Proxy Upgrade Specialist
    prompt: {
      role: 'Documentation Engineer',
      task: 'Document rollback procedures',
      context: args,
      instructions: [
        '1. Document current implementation address',
        '2. Create rollback transaction calldata',
        '3. Document emergency contacts',
        '4. Create step-by-step rollback guide',
        '5. Document monitoring triggers',
        '6. Create incident response plan',
        '7. Document multi-sig rollback process',
        '8. Test rollback on testnet',
        '9. Document verification steps',
        '10. Archive rollback package'
      ],
      outputFormat: 'JSON with rollback documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['rollbackPath', 'emergencyContacts', 'artifacts'],
      properties: {
        rollbackPath: { type: 'string' },
        previousImplementation: { type: 'string' },
        rollbackCalldata: { type: 'string' },
        emergencyContacts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'upgrade', 'rollback', 'documentation']
}));
