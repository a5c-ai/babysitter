/**
 * @process specializations/embedded-systems/ota-firmware-update
 * @description OTA Firmware Update - Implementing over-the-air update mechanisms including differential updates, A/B
 * partitioning, rollback capability, and secure update verification for field-deployed devices.
 * @inputs { projectName: string, targetMcu: string, updateMethod?: string, partitionScheme?: string, outputDir?: string }
 * @outputs { success: boolean, otaDesign: object, partitionLayout: object, updateFlow: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/ota-firmware-update', {
 *   projectName: 'ConnectedSensor',
 *   targetMcu: 'ESP32',
 *   updateMethod: 'differential',
 *   partitionScheme: 'A/B'
 * });
 *
 * @references
 * - OTA Updates Guide: https://interrupt.memfault.com/blog/device-firmware-update-cookbook
 * - A/B Updates: https://source.android.com/devices/tech/ota/ab
 * - Delta Updates: https://www.embedded.com/delta-firmware-updates/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    updateMethod = 'full-image',
    partitionScheme = 'A/B',
    connectionType = 'WiFi',
    secureUpdate = true,
    outputDir = 'ota-update-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OTA Firmware Update Design: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Method: ${updateMethod}, Scheme: ${partitionScheme}`);

  // ============================================================================
  // PHASE 1: OTA REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing OTA Requirements');

  const requirementsAnalysis = await ctx.task(otaRequirementsTask, {
    projectName,
    targetMcu,
    updateMethod,
    connectionType,
    secureUpdate,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PARTITION LAYOUT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Partition Layout');

  const partitionDesign = await ctx.task(partitionLayoutDesignTask, {
    projectName,
    targetMcu,
    partitionScheme,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...partitionDesign.artifacts);

  // ============================================================================
  // PHASE 3: UPDATE PROTOCOL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Update Protocol');

  const updateProtocol = await ctx.task(updateProtocolDesignTask, {
    projectName,
    connectionType,
    updateMethod,
    partitionDesign,
    outputDir
  });

  artifacts.push(...updateProtocol.artifacts);

  // ============================================================================
  // PHASE 4: DOWNLOAD MANAGER
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Download Manager');

  const downloadManager = await ctx.task(downloadManagerDesignTask, {
    projectName,
    connectionType,
    updateProtocol,
    outputDir
  });

  artifacts.push(...downloadManager.artifacts);

  // ============================================================================
  // PHASE 5: UPDATE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing Update Verification');

  const updateVerification = await ctx.task(updateVerificationDesignTask, {
    projectName,
    secureUpdate,
    updateMethod,
    outputDir
  });

  artifacts.push(...updateVerification.artifacts);

  // ============================================================================
  // PHASE 6: ROLLBACK MECHANISM
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing Rollback Mechanism');

  const rollbackMechanism = await ctx.task(rollbackMechanismDesignTask, {
    projectName,
    partitionScheme,
    partitionDesign,
    outputDir
  });

  artifacts.push(...rollbackMechanism.artifacts);

  // ============================================================================
  // PHASE 7: UPDATE FLOW IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Update Flow');

  const updateFlow = await ctx.task(updateFlowImplementationTask, {
    projectName,
    partitionDesign,
    updateProtocol,
    downloadManager,
    updateVerification,
    rollbackMechanism,
    outputDir
  });

  artifacts.push(...updateFlow.artifacts);

  // ============================================================================
  // PHASE 8: TESTING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Testing and Documentation');

  const testingAndDocs = await ctx.task(otaTestingDocumentationTask, {
    projectName,
    updateFlow,
    rollbackMechanism,
    outputDir
  });

  artifacts.push(...testingAndDocs.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `OTA Firmware Update Design Complete for ${projectName}. Update method: ${updateMethod}, Partition: ${partitionScheme}. Review?`,
    title: 'OTA Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        updateMethod,
        partitionScheme,
        secureUpdate,
        rollbackSupported: rollbackMechanism.supported
      },
      files: [
        { path: testingAndDocs.docPath, format: 'markdown', label: 'OTA Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    otaDesign: {
      updateMethod,
      connectionType,
      secureUpdate,
      protocol: updateProtocol.protocol
    },
    partitionLayout: partitionDesign.layout,
    updateFlow: {
      states: updateFlow.states,
      transitions: updateFlow.transitions,
      errorHandling: updateFlow.errorHandling
    },
    rollback: rollbackMechanism.mechanism,
    docPath: testingAndDocs.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/ota-firmware-update',
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

export const otaRequirementsTask = defineTask('ota-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: OTA Requirements - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze OTA update requirements',
      context: args,
      instructions: [
        '1. Define update scenarios',
        '2. Specify size constraints',
        '3. Define bandwidth limits',
        '4. Specify reliability needs',
        '5. Define security requirements',
        '6. Specify downtime tolerance',
        '7. Define rollback requirements',
        '8. Specify recovery needs',
        '9. Document constraints',
        '10. Prioritize requirements'
      ],
      outputFormat: 'JSON with OTA requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'constraints', 'artifacts'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'requirements']
}));

export const partitionLayoutDesignTask = defineTask('partition-layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Partition Layout - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design partition layout',
      context: args,
      instructions: [
        '1. Design A/B partitions',
        '2. Plan bootloader partition',
        '3. Design data partition',
        '4. Plan configuration storage',
        '5. Design factory reset',
        '6. Calculate sizes',
        '7. Plan alignment',
        '8. Design partition table',
        '9. Handle wear leveling',
        '10. Document layout'
      ],
      outputFormat: 'JSON with partition layout'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'partitions', 'artifacts'],
      properties: {
        layout: { type: 'object' },
        partitions: { type: 'array', items: { type: 'object' } },
        totalSize: { type: 'string' },
        reservedSpace: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'partitions']
}));

export const updateProtocolDesignTask = defineTask('update-protocol-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Update Protocol - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design update protocol',
      context: args,
      instructions: [
        '1. Design manifest format',
        '2. Plan version checking',
        '3. Design update request',
        '4. Plan chunk transfer',
        '5. Design progress reporting',
        '6. Plan resume capability',
        '7. Design error codes',
        '8. Plan server interface',
        '9. Handle timeouts',
        '10. Document protocol'
      ],
      outputFormat: 'JSON with update protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'manifestFormat', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        manifestFormat: { type: 'object' },
        chunkSize: { type: 'number' },
        errorCodes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'protocol']
}));

export const downloadManagerDesignTask = defineTask('download-manager-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Download Manager - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design download manager',
      context: args,
      instructions: [
        '1. Design state machine',
        '2. Plan connection handling',
        '3. Design retry logic',
        '4. Plan bandwidth management',
        '5. Design progress tracking',
        '6. Plan resume support',
        '7. Handle interruptions',
        '8. Design validation',
        '9. Plan memory usage',
        '10. Document design'
      ],
      outputFormat: 'JSON with download manager'
    },
    outputSchema: {
      type: 'object',
      required: ['stateMachine', 'retryPolicy', 'artifacts'],
      properties: {
        stateMachine: { type: 'object' },
        retryPolicy: { type: 'object' },
        memoryUsage: { type: 'string' },
        resumeCapability: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'download']
}));

export const updateVerificationDesignTask = defineTask('update-verification-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Update Verification - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design update verification',
      context: args,
      instructions: [
        '1. Design integrity check',
        '2. Plan signature verification',
        '3. Design version validation',
        '4. Plan compatibility check',
        '5. Design pre-flash validation',
        '6. Plan post-flash validation',
        '7. Design boot verification',
        '8. Handle verification failure',
        '9. Plan crypto operations',
        '10. Document verification'
      ],
      outputFormat: 'JSON with verification design'
    },
    outputSchema: {
      type: 'object',
      required: ['integrityCheck', 'signatureVerification', 'artifacts'],
      properties: {
        integrityCheck: { type: 'object' },
        signatureVerification: { type: 'object' },
        versionValidation: { type: 'object' },
        failureHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'verification']
}));

export const rollbackMechanismDesignTask = defineTask('rollback-mechanism-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Rollback Mechanism - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design rollback mechanism',
      context: args,
      instructions: [
        '1. Design rollback trigger',
        '2. Plan boot count tracking',
        '3. Design health check',
        '4. Plan automatic rollback',
        '5. Design manual rollback',
        '6. Plan state preservation',
        '7. Design recovery mode',
        '8. Handle data migration',
        '9. Plan factory reset',
        '10. Document mechanism'
      ],
      outputFormat: 'JSON with rollback mechanism'
    },
    outputSchema: {
      type: 'object',
      required: ['supported', 'mechanism', 'triggers', 'artifacts'],
      properties: {
        supported: { type: 'boolean' },
        mechanism: { type: 'object' },
        triggers: { type: 'array', items: { type: 'string' } },
        healthCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'rollback']
}));

export const updateFlowImplementationTask = defineTask('update-flow-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Update Flow - ${args.projectName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement update flow',
      context: args,
      instructions: [
        '1. Design state machine',
        '2. Implement check phase',
        '3. Implement download phase',
        '4. Implement verify phase',
        '5. Implement apply phase',
        '6. Implement reboot handling',
        '7. Implement confirmation',
        '8. Handle all errors',
        '9. Add logging',
        '10. Document flow'
      ],
      outputFormat: 'JSON with update flow'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'transitions', 'errorHandling', 'artifacts'],
      properties: {
        states: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'array', items: { type: 'object' } },
        errorHandling: { type: 'object' },
        timing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'implementation']
}));

export const otaTestingDocumentationTask = defineTask('ota-testing-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing & Docs - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create OTA testing and documentation',
      context: args,
      instructions: [
        '1. Create test plan',
        '2. Define test cases',
        '3. Document update flow',
        '4. Document partition layout',
        '5. Create server setup guide',
        '6. Document rollback process',
        '7. Add troubleshooting',
        '8. Create user guide',
        '9. Add diagrams',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'testPlan', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        testPlan: { type: 'object' },
        testCases: { type: 'array', items: { type: 'object' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'ota', 'documentation']
}));
