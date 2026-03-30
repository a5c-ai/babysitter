/**
 * @process specializations/embedded-systems/secure-boot-implementation
 * @description Secure Boot Implementation - Implementing cryptographic verification chains for firmware authenticity,
 * including hardware root of trust, digital signatures, secure key storage, and anti-rollback protection.
 * @inputs { projectName: string, targetMcu: string, cryptoAlgorithm?: string, keyManagement?: string, outputDir?: string }
 * @outputs { success: boolean, secureBootDesign: object, keyManagement: object, bootChain: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/secure-boot-implementation', {
 *   projectName: 'SecureIoTDevice',
 *   targetMcu: 'STM32H753',
 *   cryptoAlgorithm: 'ECDSA-P256',
 *   keyManagement: 'OTP-fuses'
 * });
 *
 * @references
 * - Secure Boot Design: https://interrupt.memfault.com/blog/secure-boot-guide
 * - Chain of Trust: https://www.embedded.com/building-a-chain-of-trust-for-embedded-systems/
 * - Key Management: https://www.arm.com/technologies/trustzone-for-cortex-m
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    cryptoAlgorithm = 'ECDSA-P256',
    keyManagement = 'OTP-fuses',
    antiRollback = true,
    debugProtection = true,
    outputDir = 'secure-boot-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Secure Boot Implementation: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Crypto: ${cryptoAlgorithm}`);

  // ============================================================================
  // PHASE 1: SECURITY REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Security Requirements');

  const securityRequirements = await ctx.task(securityRequirementsTask, {
    projectName,
    targetMcu,
    cryptoAlgorithm,
    antiRollback,
    debugProtection,
    outputDir
  });

  artifacts.push(...securityRequirements.artifacts);

  // ============================================================================
  // PHASE 2: ROOT OF TRUST DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Root of Trust');

  const rootOfTrust = await ctx.task(rootOfTrustDesignTask, {
    projectName,
    targetMcu,
    keyManagement,
    securityRequirements,
    outputDir
  });

  artifacts.push(...rootOfTrust.artifacts);

  // ============================================================================
  // PHASE 3: KEY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Key Management');

  const keyMgmt = await ctx.task(keyManagementDesignTask, {
    projectName,
    targetMcu,
    cryptoAlgorithm,
    keyManagement,
    rootOfTrust,
    outputDir
  });

  artifacts.push(...keyMgmt.artifacts);

  await ctx.breakpoint({
    question: `Key management design complete. Key storage: ${keyMgmt.storageMethod}. Key hierarchy levels: ${keyMgmt.hierarchyLevels}. Review before proceeding?`,
    title: 'Key Management Review',
    context: {
      runId: ctx.runId,
      keyHierarchy: keyMgmt.hierarchy,
      files: keyMgmt.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 4: BOOT CHAIN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Boot Chain');

  const bootChain = await ctx.task(bootChainDesignTask, {
    projectName,
    targetMcu,
    rootOfTrust,
    keyMgmt,
    outputDir
  });

  artifacts.push(...bootChain.artifacts);

  // ============================================================================
  // PHASE 5: SIGNATURE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Signature Verification');

  const signatureVerification = await ctx.task(signatureVerificationTask, {
    projectName,
    cryptoAlgorithm,
    bootChain,
    outputDir
  });

  artifacts.push(...signatureVerification.artifacts);

  // ============================================================================
  // PHASE 6: ANTI-ROLLBACK PROTECTION
  // ============================================================================

  let rollbackProtection = null;
  if (antiRollback) {
    ctx.log('info', 'Phase 6: Implementing Anti-Rollback Protection');

    rollbackProtection = await ctx.task(antiRollbackTask, {
      projectName,
      targetMcu,
      bootChain,
      outputDir
    });

    artifacts.push(...rollbackProtection.artifacts);
  }

  // ============================================================================
  // PHASE 7: DEBUG PROTECTION
  // ============================================================================

  let debugProt = null;
  if (debugProtection) {
    ctx.log('info', 'Phase 7: Implementing Debug Protection');

    debugProt = await ctx.task(debugProtectionTask, {
      projectName,
      targetMcu,
      bootChain,
      outputDir
    });

    artifacts.push(...debugProt.artifacts);
  }

  // ============================================================================
  // PHASE 8: VERIFICATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying Secure Boot Implementation');

  const verification = await ctx.task(secureBootVerificationTask, {
    projectName,
    bootChain,
    signatureVerification,
    rollbackProtection,
    debugProt,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Secure Boot Documentation');

  const documentation = await ctx.task(secureBootDocumentationTask, {
    projectName,
    rootOfTrust,
    keyMgmt,
    bootChain,
    signatureVerification,
    rollbackProtection,
    debugProt,
    verification,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Secure Boot Implementation Complete for ${projectName}. Verification passed: ${verification.allTestsPassed}. Review?`,
    title: 'Secure Boot Complete',
    context: {
      runId: ctx.runId,
      summary: {
        bootStages: bootChain.stages.length,
        cryptoAlgorithm,
        antiRollback: !!rollbackProtection,
        debugProtected: !!debugProt,
        verificationPassed: verification.allTestsPassed
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'Secure Boot Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: verification.allTestsPassed,
    projectName,
    secureBootDesign: {
      rootOfTrust: rootOfTrust.design,
      bootStages: bootChain.stages,
      cryptoAlgorithm,
      verificationMethod: signatureVerification.method
    },
    keyManagement: {
      storageMethod: keyMgmt.storageMethod,
      hierarchy: keyMgmt.hierarchy,
      provisioning: keyMgmt.provisioning
    },
    bootChain: bootChain.stages,
    antiRollback: rollbackProtection?.mechanism || null,
    debugProtection: debugProt?.mechanism || null,
    docPath: documentation.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/secure-boot-implementation',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const securityRequirementsTask = defineTask('security-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Security Requirements - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Analyze security requirements',
      context: args,
      instructions: [
        '1. Define threat model',
        '2. Identify attack vectors',
        '3. Define security goals',
        '4. Specify crypto requirements',
        '5. Define key requirements',
        '6. Specify boot time constraints',
        '7. Define recovery requirements',
        '8. Specify compliance needs',
        '9. Document assumptions',
        '10. Prioritize requirements'
      ],
      outputFormat: 'JSON with security requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'threatModel', 'artifacts'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        threatModel: { type: 'object' },
        attackVectors: { type: 'array', items: { type: 'string' } },
        securityGoals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'requirements']
}));

export const rootOfTrustDesignTask = defineTask('root-of-trust-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Root of Trust - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Design root of trust',
      context: args,
      instructions: [
        '1. Select hardware RoT',
        '2. Design immutable ROM',
        '3. Plan OTP fuse layout',
        '4. Design secure storage',
        '5. Plan TrustZone usage',
        '6. Design hardware security',
        '7. Plan attestation',
        '8. Design first boot stage',
        '9. Document trust anchor',
        '10. Create RoT specification'
      ],
      outputFormat: 'JSON with root of trust design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'trustAnchor', 'artifacts'],
      properties: {
        design: { type: 'object' },
        trustAnchor: { type: 'object' },
        otpLayout: { type: 'object' },
        hardwareSecurity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'root-of-trust']
}));

export const keyManagementDesignTask = defineTask('key-management-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Key Management - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Design key management',
      context: args,
      instructions: [
        '1. Design key hierarchy',
        '2. Plan key generation',
        '3. Design key storage',
        '4. Plan key provisioning',
        '5. Design key derivation',
        '6. Plan key rotation',
        '7. Design key revocation',
        '8. Plan manufacturing flow',
        '9. Document key lifecycle',
        '10. Create key spec'
      ],
      outputFormat: 'JSON with key management design'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'storageMethod', 'hierarchyLevels', 'provisioning', 'artifacts'],
      properties: {
        hierarchy: { type: 'object' },
        storageMethod: { type: 'string' },
        hierarchyLevels: { type: 'number' },
        provisioning: { type: 'object' },
        rotation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'key-management']
}));

export const bootChainDesignTask = defineTask('boot-chain-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Boot Chain - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Design boot chain',
      context: args,
      instructions: [
        '1. Define boot stages',
        '2. Design stage transitions',
        '3. Plan verification points',
        '4. Design failure handling',
        '5. Plan recovery mode',
        '6. Design boot measurements',
        '7. Plan secure handoff',
        '8. Design boot logging',
        '9. Optimize boot time',
        '10. Document boot chain'
      ],
      outputFormat: 'JSON with boot chain design'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'transitions', 'artifacts'],
      properties: {
        stages: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'array', items: { type: 'object' } },
        verificationPoints: { type: 'array', items: { type: 'object' } },
        failureHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'boot-chain']
}));

export const signatureVerificationTask = defineTask('signature-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Signature Verification - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Implement signature verification',
      context: args,
      instructions: [
        '1. Select crypto library',
        '2. Implement verification',
        '3. Design image format',
        '4. Plan header structure',
        '5. Implement hash calculation',
        '6. Design signature format',
        '7. Handle verification failure',
        '8. Optimize performance',
        '9. Handle errors securely',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with signature verification'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'imageFormat', 'artifacts'],
      properties: {
        method: { type: 'object' },
        imageFormat: { type: 'object' },
        headerStructure: { type: 'object' },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'signature']
}));

export const antiRollbackTask = defineTask('anti-rollback', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Anti-Rollback - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Implement anti-rollback protection',
      context: args,
      instructions: [
        '1. Design version scheme',
        '2. Plan version storage',
        '3. Implement monotonic counter',
        '4. Design version check',
        '5. Handle rollback attempt',
        '6. Plan recovery mechanism',
        '7. Consider partial updates',
        '8. Handle counter overflow',
        '9. Test rollback scenarios',
        '10. Document mechanism'
      ],
      outputFormat: 'JSON with anti-rollback'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'versionStorage', 'artifacts'],
      properties: {
        mechanism: { type: 'object' },
        versionStorage: { type: 'object' },
        counterDesign: { type: 'object' },
        recoveryMechanism: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'anti-rollback']
}));

export const debugProtectionTask = defineTask('debug-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Debug Protection - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Implement debug protection',
      context: args,
      instructions: [
        '1. Analyze debug interfaces',
        '2. Design JTAG protection',
        '3. Implement debug authentication',
        '4. Plan debug unlock',
        '5. Design secure debug',
        '6. Protect debug ports',
        '7. Handle debug in boot',
        '8. Plan manufacturing debug',
        '9. Test debug protection',
        '10. Document protection'
      ],
      outputFormat: 'JSON with debug protection'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'debugInterfaces', 'artifacts'],
      properties: {
        mechanism: { type: 'object' },
        debugInterfaces: { type: 'array', items: { type: 'string' } },
        unlockProcedure: { type: 'object' },
        secureDebug: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'debug-protection']
}));

export const secureBootVerificationTask = defineTask('secure-boot-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Verification - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Verify secure boot implementation',
      context: args,
      instructions: [
        '1. Test boot chain',
        '2. Verify signature check',
        '3. Test invalid signatures',
        '4. Test rollback protection',
        '5. Test debug protection',
        '6. Test failure modes',
        '7. Test recovery',
        '8. Measure boot time',
        '9. Security audit',
        '10. Document results'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'testResults', 'artifacts'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        testResults: { type: 'array', items: { type: 'object' } },
        bootTime: { type: 'string' },
        securityAudit: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'verification']
}));

export const secureBootDocumentationTask = defineTask('secure-boot-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate secure boot documentation',
      context: args,
      instructions: [
        '1. Create overview',
        '2. Document root of trust',
        '3. Document key management',
        '4. Document boot chain',
        '5. Document verification',
        '6. Document anti-rollback',
        '7. Document debug protection',
        '8. Include verification results',
        '9. Add provisioning guide',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'secure-boot', 'documentation']
}));
