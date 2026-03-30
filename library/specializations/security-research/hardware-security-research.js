/**
 * @process specializations/security-research/hardware-security-research
 * @description Security research for hardware systems including side-channel attacks, fault injection,
 * hardware debugging, and physical security assessment of embedded systems, secure elements, and
 * cryptographic implementations.
 * @inputs { projectName: string, targetDevice: object, analysisType?: string }
 * @outputs { success: boolean, vulnerabilities: array, hardwareReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/hardware-security-research', {
 *   projectName: 'Secure Element Analysis',
 *   targetDevice: { type: 'smartcard', model: 'SecureCard X1' },
 *   analysisType: 'side-channel'
 * });
 *
 * @references
 * - ChipWhisperer: https://www.newae.com/chipwhisperer
 * - OpenOCD: https://openocd.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetDevice,
    analysisType = 'comprehensive',
    outputDir = 'hardware-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Hardware Security Research for ${projectName}`);
  ctx.log('info', `Device: ${targetDevice.type}`);

  // ============================================================================
  // PHASE 1: DEVICE RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing device and identifying interfaces');

  const deviceRecon = await ctx.task(deviceReconTask, {
    projectName,
    targetDevice,
    outputDir
  });

  artifacts.push(...deviceRecon.artifacts);

  // ============================================================================
  // PHASE 2: DEBUG INTERFACE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing debug interfaces (JTAG/SWD)');

  const debugAnalysis = await ctx.task(debugInterfaceTask, {
    projectName,
    targetDevice,
    deviceRecon,
    outputDir
  });

  vulnerabilities.push(...debugAnalysis.vulnerabilities);
  artifacts.push(...debugAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: SIDE-CHANNEL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting side-channel analysis');

  const sideChannel = await ctx.task(sideChannelTask, {
    projectName,
    targetDevice,
    outputDir
  });

  vulnerabilities.push(...sideChannel.vulnerabilities);
  artifacts.push(...sideChannel.artifacts);

  // ============================================================================
  // PHASE 4: FAULT INJECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing fault injection attacks');

  const faultInjection = await ctx.task(faultInjectionTask, {
    projectName,
    targetDevice,
    outputDir
  });

  vulnerabilities.push(...faultInjection.vulnerabilities);
  artifacts.push(...faultInjection.artifacts);

  // ============================================================================
  // PHASE 5: FIRMWARE EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Attempting firmware extraction');

  const firmwareExtraction = await ctx.task(hardwareFirmwareExtractionTask, {
    projectName,
    targetDevice,
    deviceRecon,
    outputDir
  });

  vulnerabilities.push(...firmwareExtraction.vulnerabilities);
  artifacts.push(...firmwareExtraction.artifacts);

  // ============================================================================
  // PHASE 6: PHYSICAL SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing physical security');

  const physicalSecurity = await ctx.task(physicalSecurityTask, {
    projectName,
    targetDevice,
    outputDir
  });

  vulnerabilities.push(...physicalSecurity.vulnerabilities);
  artifacts.push(...physicalSecurity.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating hardware security report');

  const report = await ctx.task(hardwareSecurityReportTask, {
    projectName,
    targetDevice,
    vulnerabilities,
    deviceRecon,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Hardware security research complete for ${projectName}. Found ${vulnerabilities.length} vulnerabilities. Review findings?`,
    title: 'Hardware Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        deviceType: targetDevice.type,
        interfaces: deviceRecon.interfaces,
        vulnerabilities: vulnerabilities.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    hardwareReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/hardware-security-research',
      timestamp: startTime,
      analysisType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const deviceReconTask = defineTask('device-recon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Device Reconnaissance - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Hardware Security Analyst',
      task: 'Analyze device and identify interfaces',
      context: args,
      instructions: [
        '1. Identify device components',
        '2. Document chip markings',
        '3. Identify debug headers',
        '4. Find communication interfaces',
        '5. Document power supply',
        '6. Identify test points',
        '7. Create device schematic',
        '8. Document findings'
      ],
      outputFormat: 'JSON with device reconnaissance'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'components', 'artifacts'],
      properties: {
        interfaces: { type: 'array' },
        components: { type: 'array' },
        debugHeaders: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'recon']
}));

export const debugInterfaceTask = defineTask('debug-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Interface Analysis - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Hardware Debug Interface Analyst',
      task: 'Analyze debug interfaces',
      context: args,
      instructions: [
        '1. Identify JTAG/SWD interfaces',
        '2. Test debug access',
        '3. Check for debug locks',
        '4. Attempt to bypass locks',
        '5. Extract debug information',
        '6. Test UART interfaces',
        '7. Document access level',
        '8. Document findings'
      ],
      outputFormat: 'JSON with debug analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        debugAccess: { type: 'boolean' },
        interfaces: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'debug']
}));

export const sideChannelTask = defineTask('side-channel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Side-Channel Analysis - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Side-Channel Attack Specialist',
      task: 'Conduct side-channel analysis',
      context: args,
      instructions: [
        '1. Set up power analysis',
        '2. Capture power traces',
        '3. Perform DPA/SPA analysis',
        '4. Set up EM analysis',
        '5. Capture EM emissions',
        '6. Perform timing analysis',
        '7. Analyze crypto operations',
        '8. Document findings'
      ],
      outputFormat: 'JSON with side-channel findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        leakageFound: { type: 'boolean' },
        attackType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'side-channel']
}));

export const faultInjectionTask = defineTask('fault-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fault Injection - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Fault Injection Specialist',
      task: 'Test fault injection attacks',
      context: args,
      instructions: [
        '1. Set up glitching equipment',
        '2. Test voltage glitching',
        '3. Test clock glitching',
        '4. Test EM fault injection',
        '5. Target security checks',
        '6. Attempt bypass attacks',
        '7. Document successful glitches',
        '8. Document findings'
      ],
      outputFormat: 'JSON with fault injection findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        successfulGlitches: { type: 'array' },
        bypassAchieved: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'fault-injection']
}));

export const hardwareFirmwareExtractionTask = defineTask('hardware-firmware-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Firmware Extraction - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Hardware Firmware Extraction Specialist',
      task: 'Attempt firmware extraction',
      context: args,
      instructions: [
        '1. Identify storage chips',
        '2. Read via debug interface',
        '3. Read via SPI/I2C',
        '4. Attempt chip-off',
        '5. Analyze extracted data',
        '6. Check for encryption',
        '7. Document extraction method',
        '8. Document findings'
      ],
      outputFormat: 'JSON with extraction findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'extracted', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        extracted: { type: 'boolean' },
        extractionMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'firmware']
}));

export const physicalSecurityTask = defineTask('physical-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Physical Security - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Physical Security Analyst',
      task: 'Assess physical security',
      context: args,
      instructions: [
        '1. Assess tamper protection',
        '2. Check for anti-tamper mesh',
        '3. Test environmental sensors',
        '4. Assess enclosure security',
        '5. Check for self-destruct',
        '6. Test battery backup',
        '7. Assess key storage',
        '8. Document findings'
      ],
      outputFormat: 'JSON with physical security findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        tamperProtection: { type: 'array' },
        physicalIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'physical']
}));

export const hardwareSecurityReportTask = defineTask('hardware-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Hardware Security Report Specialist',
      task: 'Generate hardware security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Document attack vectors',
        '3. Include equipment used',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Add risk ratings',
        '7. Include recommendations',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'bySeverity', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        bySeverity: { type: 'object' },
        byAttackType: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'hardware', 'reporting']
}));
