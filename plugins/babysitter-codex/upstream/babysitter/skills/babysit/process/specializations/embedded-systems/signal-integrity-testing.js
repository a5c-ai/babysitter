/**
 * @process specializations/embedded-systems/signal-integrity-testing
 * @description Signal Integrity Testing - Using oscilloscopes, logic analyzers, and protocol analyzers to verify
 * electrical signal quality, timing relationships, and communication protocol compliance at the hardware level.
 * @inputs { projectName: string, interfaces?: array, targetFrequency?: string, protocolsToTest?: array, outputDir?: string }
 * @outputs { success: boolean, signalResults: object, protocolCompliance: object, issues: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/signal-integrity-testing', {
 *   projectName: 'HighSpeedBoard',
 *   interfaces: ['SPI', 'I2C', 'UART', 'USB'],
 *   targetFrequency: '100MHz',
 *   protocolsToTest: ['SPI-Mode0', 'I2C-Fast', 'UART-115200']
 * });
 *
 * @references
 * - Debugging Embedded Systems with Oscilloscopes: https://www.embedded.com/debugging-embedded-systems-with-oscilloscopes/
 * - Signal Integrity: https://www.embedded.com/signal-integrity-basics/
 * - Protocol Analysis: https://www.saleae.com/learn/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    interfaces = ['SPI', 'I2C', 'UART'],
    targetFrequency = '50MHz',
    protocolsToTest = [],
    voltageLevel = '3.3V',
    timingMargin = 20, // percent
    outputDir = 'signal-integrity-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Signal Integrity Testing: ${projectName}`);
  ctx.log('info', `Interfaces: ${interfaces.join(', ')}, Target: ${targetFrequency}`);

  // ============================================================================
  // PHASE 1: TEST SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Signal Integrity Test');

  const testSetup = await ctx.task(signalTestSetupTask, {
    projectName,
    interfaces,
    targetFrequency,
    voltageLevel,
    outputDir
  });

  artifacts.push(...testSetup.artifacts);

  // ============================================================================
  // PHASE 2: VOLTAGE LEVEL VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Verifying Voltage Levels');

  const voltageLevels = await ctx.task(voltageLevelVerificationTask, {
    projectName,
    interfaces,
    voltageLevel,
    outputDir
  });

  artifacts.push(...voltageLevels.artifacts);

  // ============================================================================
  // PHASE 3: TIMING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Signal Timing');

  const timingAnalysis = await ctx.task(signalTimingAnalysisTask, {
    projectName,
    interfaces,
    targetFrequency,
    timingMargin,
    outputDir
  });

  artifacts.push(...timingAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SIGNAL QUALITY MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Measuring Signal Quality');

  const signalQuality = await ctx.task(signalQualityMeasurementTask, {
    projectName,
    interfaces,
    targetFrequency,
    outputDir
  });

  artifacts.push(...signalQuality.artifacts);

  // ============================================================================
  // PHASE 5: PROTOCOL COMPLIANCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing Protocol Compliance');

  const protocolCompliance = await ctx.task(protocolComplianceTask, {
    projectName,
    protocolsToTest: protocolsToTest.length > 0 ? protocolsToTest : interfaces,
    outputDir
  });

  artifacts.push(...protocolCompliance.artifacts);

  // ============================================================================
  // PHASE 6: CROSSTALK AND NOISE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Crosstalk and Noise');

  const noiseAnalysis = await ctx.task(noiseAnalysisTask, {
    projectName,
    interfaces,
    outputDir
  });

  artifacts.push(...noiseAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Signal Integrity Report');

  const report = await ctx.task(signalIntegrityReportTask, {
    projectName,
    voltageLevels,
    timingAnalysis,
    signalQuality,
    protocolCompliance,
    noiseAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const allIssues = [
    ...(voltageLevels.issues || []),
    ...(timingAnalysis.issues || []),
    ...(signalQuality.issues || []),
    ...(protocolCompliance.issues || []),
    ...(noiseAnalysis.issues || [])
  ];

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Signal Integrity Testing Complete for ${projectName}. ${allIssues.length} issues found. Review results?`,
    title: 'Signal Integrity Complete',
    context: {
      runId: ctx.runId,
      summary: {
        interfacesTested: interfaces.length,
        issuesFound: allIssues.length,
        protocolCompliance: protocolCompliance.allPassed
      },
      files: [
        { path: report.reportPath, format: 'markdown', label: 'SI Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: allIssues.length === 0,
    projectName,
    signalResults: {
      voltageLevels: voltageLevels.results,
      timing: timingAnalysis.results,
      quality: signalQuality.results
    },
    protocolCompliance: {
      allPassed: protocolCompliance.allPassed,
      results: protocolCompliance.results
    },
    issues: allIssues,
    reportPath: report.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/signal-integrity-testing',
      timestamp: startTime,
      projectName,
      interfaces,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const signalTestSetupTask = defineTask('signal-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Test Setup - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Set up signal integrity test equipment',
      context: args,
      instructions: [
        '1. Configure oscilloscope settings',
        '2. Set up logic analyzer',
        '3. Configure protocol decoder',
        '4. Set trigger conditions',
        '5. Set up probing points',
        '6. Configure measurement bandwidth',
        '7. Set up reference ground',
        '8. Configure data capture',
        '9. Verify probe compensation',
        '10. Document test setup'
      ],
      outputFormat: 'JSON with test setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'probePoints', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        probePoints: { type: 'array', items: { type: 'object' } },
        equipment: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'setup']
}));

export const voltageLevelVerificationTask = defineTask('voltage-level-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Voltage Levels - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Verify voltage levels',
      context: args,
      instructions: [
        '1. Measure logic high levels',
        '2. Measure logic low levels',
        '3. Verify threshold margins',
        '4. Check overshoot',
        '5. Check undershoot',
        '6. Measure DC levels',
        '7. Verify pull-up/pull-down',
        '8. Check level compatibility',
        '9. Document measurements',
        '10. Identify issues'
      ],
      outputFormat: 'JSON with voltage verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues', 'artifacts'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        measurements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'voltage']
}));

export const signalTimingAnalysisTask = defineTask('signal-timing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Timing Analysis - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Analyze signal timing',
      context: args,
      instructions: [
        '1. Measure rise/fall times',
        '2. Verify setup times',
        '3. Verify hold times',
        '4. Measure clock frequency',
        '5. Analyze clock jitter',
        '6. Check timing margins',
        '7. Measure propagation delay',
        '8. Verify data valid windows',
        '9. Create timing diagrams',
        '10. Document timing results'
      ],
      outputFormat: 'JSON with timing analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues', 'artifacts'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        riseTime: { type: 'string' },
        fallTime: { type: 'string' },
        jitter: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'timing']
}));

export const signalQualityMeasurementTask = defineTask('signal-quality-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Signal Quality - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Measure signal quality',
      context: args,
      instructions: [
        '1. Measure eye diagram',
        '2. Analyze signal integrity',
        '3. Check ringing',
        '4. Measure reflection',
        '5. Analyze edge quality',
        '6. Check monotonicity',
        '7. Measure amplitude',
        '8. Analyze frequency spectrum',
        '9. Create quality metrics',
        '10. Document findings'
      ],
      outputFormat: 'JSON with signal quality results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues', 'artifacts'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        eyeDiagram: { type: 'object' },
        qualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'quality']
}));

export const protocolComplianceTask = defineTask('protocol-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Protocol Compliance - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Test protocol compliance',
      context: args,
      instructions: [
        '1. Decode protocol data',
        '2. Verify protocol timing',
        '3. Check handshaking',
        '4. Verify data framing',
        '5. Test error conditions',
        '6. Verify acknowledgments',
        '7. Check start/stop conditions',
        '8. Verify address/data phases',
        '9. Test protocol features',
        '10. Document compliance'
      ],
      outputFormat: 'JSON with protocol compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'results', 'issues', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        results: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'protocol']
}));

export const noiseAnalysisTask = defineTask('noise-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Noise Analysis - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Analyze crosstalk and noise',
      context: args,
      instructions: [
        '1. Measure crosstalk',
        '2. Analyze power supply noise',
        '3. Check EMI/EMC levels',
        '4. Measure ground bounce',
        '5. Analyze coupled noise',
        '6. Check near-end crosstalk',
        '7. Check far-end crosstalk',
        '8. Measure noise margin',
        '9. Identify noise sources',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with noise analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues', 'artifacts'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        crosstalkLevel: { type: 'string' },
        noiseMargin: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'noise']
}));

export const signalIntegrityReportTask = defineTask('signal-integrity-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: SI Report - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate signal integrity report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document voltage levels',
        '3. Present timing analysis',
        '4. Include signal quality',
        '5. Document protocol compliance',
        '6. Present noise analysis',
        '7. Add waveform captures',
        '8. List all issues',
        '9. Include recommendations',
        '10. Format final report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'signal-integrity', 'reporting']
}));
