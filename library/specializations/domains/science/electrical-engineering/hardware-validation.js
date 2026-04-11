/**
 * @process specializations/domains/science/electrical-engineering/hardware-validation
 * @description Hardware Validation and Debug - Guide systematic hardware bring-up, validation, and debugging.
 * Covers power-on sequencing, functional verification, performance characterization, and root cause analysis.
 * @inputs { projectName: string, hardwareType: string, testPlan: object, debugLevel?: string }
 * @outputs { success: boolean, bringUp: object, functional: object, performance: object, issues: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/hardware-validation', {
 *   projectName: 'Motor Controller PCB Rev B',
 *   hardwareType: 'mixed-signal-pcb',
 *   testPlan: { coverage: 'full', priority: 'safety-first' },
 *   debugLevel: 'comprehensive'
 * });
 *
 * @references
 * - IPC-A-610 (Acceptability of Electronic Assemblies)
 * - MIL-STD-883 (Test Methods for Microelectronics)
 * - IEEE 1149.1 (JTAG Boundary Scan)
 * - Hardware Debug Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    hardwareType,
    testPlan,
    debugLevel = 'standard'
  } = inputs;

  // Phase 1: Pre-Power Inspection
  const prePowerInspection = await ctx.task(prePowerInspectionTask, {
    projectName,
    hardwareType,
    testPlan
  });

  // Phase 2: Power-On Sequence Validation
  const powerOnValidation = await ctx.task(powerOnValidationTask, {
    projectName,
    hardwareType,
    inspectionResults: prePowerInspection.results
  });

  // Breakpoint: Review power-on results
  await ctx.breakpoint({
    question: `Power-on validation for ${projectName}. Status: ${powerOnValidation.status}. Issues found: ${powerOnValidation.issues.length}. Proceed with functional testing?`,
    title: 'Power-On Review',
    context: {
      runId: ctx.runId,
      projectName,
      powerOnValidation,
      files: [{
        path: `artifacts/phase2-poweron.json`,
        format: 'json',
        content: powerOnValidation
      }]
    }
  });

  // Quality Gate: Power-on must pass
  if (!powerOnValidation.passed) {
    await ctx.breakpoint({
      question: `Power-on validation failed with ${powerOnValidation.issues.length} issues. Debug required. Continue with debug phase?`,
      title: 'Power-On Failure',
      context: {
        runId: ctx.runId,
        issues: powerOnValidation.issues,
        recommendations: powerOnValidation.recommendations
      }
    });
  }

  // Phase 3: Clock and Reset Verification
  const clockResetVerification = await ctx.task(clockResetVerificationTask, {
    projectName,
    hardwareType,
    powerOnResults: powerOnValidation.results
  });

  // Phase 4: Digital Subsystem Validation
  const digitalValidation = await ctx.task(digitalValidationTask, {
    projectName,
    hardwareType,
    clockResetResults: clockResetVerification.results
  });

  // Phase 5: Analog Subsystem Validation
  const analogValidation = await ctx.task(analogValidationTask, {
    projectName,
    hardwareType,
    testPlan
  });

  // Breakpoint: Review subsystem validation
  await ctx.breakpoint({
    question: `Digital validation: ${digitalValidation.status}. Analog validation: ${analogValidation.status}. Proceed with performance characterization?`,
    title: 'Subsystem Validation Review',
    context: {
      runId: ctx.runId,
      digitalValidation,
      analogValidation,
      files: [
        { path: `artifacts/phase4-digital.json`, format: 'json', content: digitalValidation },
        { path: `artifacts/phase5-analog.json`, format: 'json', content: analogValidation }
      ]
    }
  });

  // Phase 6: Performance Characterization
  const performanceCharacterization = await ctx.task(performanceCharacterizationTask, {
    projectName,
    hardwareType,
    digitalResults: digitalValidation.results,
    analogResults: analogValidation.results,
    testPlan
  });

  // Phase 7: Environmental and Stress Testing
  const stressTesting = await ctx.task(stressTestingTask, {
    projectName,
    hardwareType,
    performanceBaseline: performanceCharacterization.baseline,
    debugLevel
  });

  // Quality Gate: Check for issues requiring debug
  const allIssues = [
    ...powerOnValidation.issues,
    ...digitalValidation.issues,
    ...analogValidation.issues,
    ...performanceCharacterization.issues,
    ...stressTesting.issues
  ];

  if (allIssues.length > 0) {
    await ctx.breakpoint({
      question: `Total ${allIssues.length} issues found during validation. Root cause analysis required?`,
      title: 'Issues Found',
      context: {
        runId: ctx.runId,
        issueCount: allIssues.length,
        criticalIssues: allIssues.filter(i => i.severity === 'critical'),
        recommendations: stressTesting.recommendations
      }
    });
  }

  // Phase 8: Generate Validation Report
  const validationReport = await ctx.task(validationReportTask, {
    projectName,
    bringUp: {
      prePower: prePowerInspection,
      powerOn: powerOnValidation,
      clockReset: clockResetVerification
    },
    functional: {
      digital: digitalValidation,
      analog: analogValidation
    },
    performance: performanceCharacterization,
    stress: stressTesting,
    issues: allIssues
  });

  // Final Breakpoint: Validation Approval
  await ctx.breakpoint({
    question: `Hardware validation complete for ${projectName}. Overall status: ${validationReport.overallStatus}. Approve validation?`,
    title: 'Validation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: validationReport.summary,
      files: [
        { path: `artifacts/validation-results.json`, format: 'json', content: { bringUp: powerOnValidation, functional: digitalValidation } },
        { path: `artifacts/validation-report.md`, format: 'markdown', content: validationReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    bringUp: {
      prePower: prePowerInspection.results,
      powerOn: powerOnValidation.results,
      clockReset: clockResetVerification.results
    },
    functional: {
      digital: digitalValidation.results,
      analog: analogValidation.results
    },
    performance: performanceCharacterization.results,
    issues: {
      total: allIssues.length,
      list: allIssues,
      resolutions: validationReport.resolutions
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/hardware-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const prePowerInspectionTask = defineTask('pre-power-inspection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pre-Power Inspection - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Hardware Quality Engineer',
      task: 'Perform pre-power inspection',
      context: args,
      instructions: [
        '1. Visual inspection for assembly defects',
        '2. Check solder joint quality',
        '3. Verify component placement and orientation',
        '4. Check for shorts between power rails',
        '5. Verify power supply connections',
        '6. Check connector seating',
        '7. Inspect for foreign object debris',
        '8. Verify thermal interface materials',
        '9. Check mechanical assembly',
        '10. Document inspection results'
      ],
      outputFormat: 'JSON object with inspection results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passed'],
      properties: {
        results: { type: 'object' },
        passed: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'inspection']
}));

export const powerOnValidationTask = defineTask('power-on-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Power-On Validation - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Hardware Bring-Up Engineer',
      task: 'Validate power-on sequence',
      context: args,
      instructions: [
        '1. Apply power with current limiting',
        '2. Monitor inrush current',
        '3. Verify power rail sequencing',
        '4. Measure all voltage rails',
        '5. Check power supply ripple',
        '6. Verify power good signals',
        '7. Measure standby power consumption',
        '8. Check thermal behavior at power-on',
        '9. Verify brownout detection',
        '10. Document power-on results'
      ],
      outputFormat: 'JSON object with power-on results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'passed', 'results'],
      properties: {
        status: { type: 'string' },
        passed: { type: 'boolean' },
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'power-on']
}));

export const clockResetVerificationTask = defineTask('clock-reset-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Clock and Reset Verification - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Digital Hardware Engineer',
      task: 'Verify clock and reset systems',
      context: args,
      instructions: [
        '1. Verify oscillator startup',
        '2. Measure clock frequencies',
        '3. Check clock jitter and phase noise',
        '4. Verify PLL lock',
        '5. Check clock distribution integrity',
        '6. Verify reset timing',
        '7. Test reset assertion and release',
        '8. Verify watchdog timer operation',
        '9. Check power-on reset behavior',
        '10. Document clock and reset results'
      ],
      outputFormat: 'JSON object with clock/reset verification'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'clocksOk', 'resetsOk'],
      properties: {
        results: { type: 'object' },
        clocksOk: { type: 'boolean' },
        resetsOk: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'clock-reset']
}));

export const digitalValidationTask = defineTask('digital-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Digital Subsystem Validation - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Digital Validation Engineer',
      task: 'Validate digital subsystems',
      context: args,
      instructions: [
        '1. Verify processor boot sequence',
        '2. Test memory interfaces',
        '3. Validate communication buses (SPI, I2C, UART)',
        '4. Test high-speed interfaces (USB, Ethernet)',
        '5. Verify GPIO functionality',
        '6. Test interrupt handling',
        '7. Validate JTAG/debug interface',
        '8. Test DMA operations',
        '9. Verify peripheral operation',
        '10. Document digital validation results'
      ],
      outputFormat: 'JSON object with digital validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'results'],
      properties: {
        status: { type: 'string' },
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'digital']
}));

export const analogValidationTask = defineTask('analog-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Analog Subsystem Validation - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Analog Validation Engineer',
      task: 'Validate analog subsystems',
      context: args,
      instructions: [
        '1. Verify ADC accuracy and linearity',
        '2. Test DAC performance',
        '3. Validate analog signal chain',
        '4. Test sensor interfaces',
        '5. Verify reference voltage accuracy',
        '6. Test analog filtering',
        '7. Measure noise performance',
        '8. Validate power supply rejection',
        '9. Test analog protection circuits',
        '10. Document analog validation results'
      ],
      outputFormat: 'JSON object with analog validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'results'],
      properties: {
        status: { type: 'string' },
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'analog']
}));

export const performanceCharacterizationTask = defineTask('performance-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Characterization - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Hardware Characterization Engineer',
      task: 'Characterize hardware performance',
      context: args,
      instructions: [
        '1. Measure timing margins',
        '2. Characterize power consumption',
        '3. Measure signal integrity',
        '4. Test at voltage corners',
        '5. Characterize temperature behavior',
        '6. Measure EMC performance',
        '7. Test maximum operating frequency',
        '8. Characterize I/O drive strength',
        '9. Measure startup time',
        '10. Document performance characteristics'
      ],
      outputFormat: 'JSON object with performance characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'baseline'],
      properties: {
        results: { type: 'object' },
        baseline: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'performance']
}));

export const stressTestingTask = defineTask('stress-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Stress Testing - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Hardware Stress Test Engineer',
      task: 'Perform environmental and stress testing',
      context: args,
      instructions: [
        '1. Temperature cycling test',
        '2. Thermal shock testing',
        '3. Vibration testing',
        '4. Humidity exposure test',
        '5. ESD susceptibility testing',
        '6. Power cycling stress test',
        '7. Load stress testing',
        '8. Long-term stability test',
        '9. Analyze failures and degradation',
        '10. Document stress test results'
      ],
      outputFormat: 'JSON object with stress test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'stress']
}));

export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation Report - ${args.projectName}`,
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Hardware Validation Lead',
      task: 'Generate comprehensive validation report',
      context: args,
      instructions: [
        '1. Summarize bring-up results',
        '2. Summarize functional test results',
        '3. Summarize performance characterization',
        '4. Summarize stress test results',
        '5. List all issues found',
        '6. Provide root cause analysis',
        '7. Recommend design changes',
        '8. Assess production readiness',
        '9. Generate test coverage summary',
        '10. Create validation report document'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['overallStatus', 'summary'],
      properties: {
        overallStatus: { type: 'string' },
        summary: { type: 'string' },
        resolutions: { type: 'array', items: { type: 'object' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'validation', 'report']
}));
