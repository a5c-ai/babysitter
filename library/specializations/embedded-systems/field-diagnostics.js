/**
 * @process specializations/embedded-systems/field-diagnostics
 * @description Field Diagnostics - Implementing diagnostic capabilities for deployed devices including remote logging,
 * crash dump analysis, health monitoring, and diagnostic protocols for troubleshooting field issues.
 * @inputs { projectName: string, targetMcu: string, diagnosticProtocols?: array, crashDumpEnabled?: boolean, outputDir?: string }
 * @outputs { success: boolean, diagnosticsDesign: object, protocols: array, monitoringCapabilities: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/field-diagnostics', {
 *   projectName: 'FieldSensor',
 *   targetMcu: 'STM32L4',
 *   diagnosticProtocols: ['UDS', 'MQTT'],
 *   crashDumpEnabled: true
 * });
 *
 * @references
 * - Embedded Diagnostics: https://interrupt.memfault.com/blog/device-diagnostics
 * - Crash Dumps: https://interrupt.memfault.com/blog/cortex-m-fault-debug
 * - UDS Protocol: https://www.embedded.com/unified-diagnostic-services-uds/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    diagnosticProtocols = ['custom'],
    crashDumpEnabled = true,
    remoteLogging = true,
    healthMonitoring = true,
    outputDir = 'field-diagnostics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Field Diagnostics Design: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Protocols: ${diagnosticProtocols.join(', ')}`);

  // ============================================================================
  // PHASE 1: DIAGNOSTIC REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Diagnostic Requirements');

  const requirementsAnalysis = await ctx.task(diagnosticRequirementsTask, {
    projectName,
    targetMcu,
    diagnosticProtocols,
    crashDumpEnabled,
    remoteLogging,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: LOGGING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Logging Infrastructure');

  const loggingInfra = await ctx.task(loggingInfrastructureTask, {
    projectName,
    targetMcu,
    remoteLogging,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...loggingInfra.artifacts);

  // ============================================================================
  // PHASE 3: CRASH DUMP SYSTEM
  // ============================================================================

  let crashDumpSystem = null;
  if (crashDumpEnabled) {
    ctx.log('info', 'Phase 3: Designing Crash Dump System');

    crashDumpSystem = await ctx.task(crashDumpSystemTask, {
      projectName,
      targetMcu,
      loggingInfra,
      outputDir
    });

    artifacts.push(...crashDumpSystem.artifacts);
  }

  // ============================================================================
  // PHASE 4: HEALTH MONITORING
  // ============================================================================

  let healthMonitor = null;
  if (healthMonitoring) {
    ctx.log('info', 'Phase 4: Designing Health Monitoring');

    healthMonitor = await ctx.task(healthMonitoringTask, {
      projectName,
      targetMcu,
      outputDir
    });

    artifacts.push(...healthMonitor.artifacts);
  }

  // ============================================================================
  // PHASE 5: DIAGNOSTIC PROTOCOL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Diagnostic Protocols');

  const protocolImpl = await ctx.task(diagnosticProtocolImplementationTask, {
    projectName,
    diagnosticProtocols,
    loggingInfra,
    crashDumpSystem,
    healthMonitor,
    outputDir
  });

  artifacts.push(...protocolImpl.artifacts);

  // ============================================================================
  // PHASE 6: DIAGNOSTIC COMMANDS
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing Diagnostic Commands');

  const diagnosticCommands = await ctx.task(diagnosticCommandsTask, {
    projectName,
    protocolImpl,
    healthMonitor,
    outputDir
  });

  artifacts.push(...diagnosticCommands.artifacts);

  // ============================================================================
  // PHASE 7: DATA EXPORT AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing Data Export');

  const dataExport = await ctx.task(dataExportAnalysisTask, {
    projectName,
    loggingInfra,
    crashDumpSystem,
    healthMonitor,
    outputDir
  });

  artifacts.push(...dataExport.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Diagnostics Documentation');

  const documentation = await ctx.task(diagnosticsDocumentationTask, {
    projectName,
    loggingInfra,
    crashDumpSystem,
    healthMonitor,
    protocolImpl,
    diagnosticCommands,
    dataExport,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Field Diagnostics Design Complete for ${projectName}. Crash dumps: ${crashDumpEnabled}, Health monitoring: ${healthMonitoring}. Review?`,
    title: 'Field Diagnostics Complete',
    context: {
      runId: ctx.runId,
      summary: {
        protocols: diagnosticProtocols,
        crashDumpEnabled,
        healthMonitoring,
        commandCount: diagnosticCommands.commands.length
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'Diagnostics Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    diagnosticsDesign: {
      logging: loggingInfra.design,
      crashDump: crashDumpSystem?.design || null,
      healthMonitor: healthMonitor?.design || null
    },
    protocols: protocolImpl.protocols,
    monitoringCapabilities: {
      metrics: healthMonitor?.metrics || [],
      thresholds: healthMonitor?.thresholds || {},
      alerts: healthMonitor?.alerts || []
    },
    commands: diagnosticCommands.commands,
    dataExport: dataExport.formats,
    docPath: documentation.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/field-diagnostics',
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

export const diagnosticRequirementsTask = defineTask('diagnostic-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Diagnostic Requirements - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze diagnostic requirements',
      context: args,
      instructions: [
        '1. Identify failure modes',
        '2. Define diagnostic data needs',
        '3. Specify logging requirements',
        '4. Define crash dump needs',
        '5. Specify health metrics',
        '6. Define alert thresholds',
        '7. Plan remote access',
        '8. Define data retention',
        '9. Specify security needs',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with diagnostic requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'failureModes', 'artifacts'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        failureModes: { type: 'array', items: { type: 'object' } },
        dataNeeds: { type: 'object' },
        securityNeeds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'requirements']
}));

export const loggingInfrastructureTask = defineTask('logging-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Logging Infrastructure - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design logging infrastructure',
      context: args,
      instructions: [
        '1. Design log levels',
        '2. Plan log storage',
        '3. Design circular buffer',
        '4. Plan log rotation',
        '5. Design timestamps',
        '6. Plan remote transfer',
        '7. Design log format',
        '8. Optimize flash usage',
        '9. Handle power loss',
        '10. Document design'
      ],
      outputFormat: 'JSON with logging infrastructure'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'logLevels', 'artifacts'],
      properties: {
        design: { type: 'object' },
        logLevels: { type: 'array', items: { type: 'string' } },
        storageConfig: { type: 'object' },
        transferConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'logging']
}));

export const crashDumpSystemTask = defineTask('crash-dump-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Crash Dump System - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design crash dump system',
      context: args,
      instructions: [
        '1. Design fault handler',
        '2. Plan register capture',
        '3. Design stack trace',
        '4. Plan memory snapshot',
        '5. Design storage area',
        '6. Handle nested faults',
        '7. Design dump format',
        '8. Plan symbolication',
        '9. Design extraction',
        '10. Document system'
      ],
      outputFormat: 'JSON with crash dump system'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'faultHandler', 'artifacts'],
      properties: {
        design: { type: 'object' },
        faultHandler: { type: 'object' },
        dumpFormat: { type: 'object' },
        storageArea: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'crash-dump']
}));

export const healthMonitoringTask = defineTask('health-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Health Monitoring - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design health monitoring',
      context: args,
      instructions: [
        '1. Define health metrics',
        '2. Design CPU monitoring',
        '3. Plan memory monitoring',
        '4. Design task monitoring',
        '5. Plan peripheral health',
        '6. Design thresholds',
        '7. Plan alerting',
        '8. Design self-test',
        '9. Plan health reports',
        '10. Document monitoring'
      ],
      outputFormat: 'JSON with health monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'metrics', 'thresholds', 'artifacts'],
      properties: {
        design: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'health']
}));

export const diagnosticProtocolImplementationTask = defineTask('diagnostic-protocol-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Protocol Implementation - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement diagnostic protocols',
      context: args,
      instructions: [
        '1. Implement selected protocols',
        '2. Design message format',
        '3. Plan service IDs',
        '4. Implement sessions',
        '5. Design security access',
        '6. Plan data transfer',
        '7. Implement error handling',
        '8. Design response format',
        '9. Test protocols',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with protocol implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'messageFormat', 'artifacts'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        messageFormat: { type: 'object' },
        serviceIds: { type: 'object' },
        securityAccess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'protocols']
}));

export const diagnosticCommandsTask = defineTask('diagnostic-commands', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Diagnostic Commands - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design diagnostic commands',
      context: args,
      instructions: [
        '1. Define read commands',
        '2. Define write commands',
        '3. Design status queries',
        '4. Plan reset commands',
        '5. Design test commands',
        '6. Plan config commands',
        '7. Design data requests',
        '8. Plan access control',
        '9. Document commands',
        '10. Create command reference'
      ],
      outputFormat: 'JSON with diagnostic commands'
    },
    outputSchema: {
      type: 'object',
      required: ['commands', 'categories', 'artifacts'],
      properties: {
        commands: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        accessLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'commands']
}));

export const dataExportAnalysisTask = defineTask('data-export-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Export - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design data export and analysis',
      context: args,
      instructions: [
        '1. Design export formats',
        '2. Plan log export',
        '3. Design crash export',
        '4. Plan metrics export',
        '5. Design analysis tools',
        '6. Plan cloud integration',
        '7. Design visualization',
        '8. Plan automation',
        '9. Document formats',
        '10. Create analysis guide'
      ],
      outputFormat: 'JSON with data export design'
    },
    outputSchema: {
      type: 'object',
      required: ['formats', 'exportMethods', 'artifacts'],
      properties: {
        formats: { type: 'array', items: { type: 'object' } },
        exportMethods: { type: 'array', items: { type: 'object' } },
        analysisTools: { type: 'array', items: { type: 'string' } },
        cloudIntegration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'export']
}));

export const diagnosticsDocumentationTask = defineTask('diagnostics-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate diagnostics documentation',
      context: args,
      instructions: [
        '1. Create overview',
        '2. Document logging',
        '3. Document crash dumps',
        '4. Document health monitoring',
        '5. Document protocols',
        '6. Document commands',
        '7. Create troubleshooting guide',
        '8. Add data analysis guide',
        '9. Include examples',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        troubleshootingGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'diagnostics', 'documentation']
}));
