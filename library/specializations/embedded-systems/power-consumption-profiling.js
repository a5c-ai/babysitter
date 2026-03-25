/**
 * @process specializations/embedded-systems/power-consumption-profiling
 * @description Power Consumption Profiling - Measuring and optimizing power usage across different operating modes
 * using power analyzers, implementing power management strategies, and validating battery life requirements for
 * portable devices.
 * @inputs { projectName: string, targetDevice: string, powerModes?: array, batteryCapacity?: number, outputDir?: string }
 * @outputs { success: boolean, powerProfile: object, optimizations: array, batteryLifeEstimate: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/power-consumption-profiling', {
 *   projectName: 'WearableDevice',
 *   targetDevice: 'nRF52840',
 *   powerModes: ['active', 'idle', 'sleep', 'deep-sleep'],
 *   batteryCapacity: 250 // mAh
 * });
 *
 * @references
 * - Power Management in Embedded Systems: https://www.embedded.com/power-management-in-embedded-systems/
 * - Low-Power Design: https://www.embedded.com/low-power-design-techniques-for-embedded-systems/
 * - Battery Life Estimation: https://interrupt.memfault.com/blog/measuring-battery-life
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetDevice,
    powerModes = ['active', 'idle', 'sleep'],
    batteryCapacity = 1000, // mAh
    targetBatteryLife = '24h',
    measurementTool = 'power-analyzer', // 'power-analyzer', 'multimeter', 'dedicated-tool'
    optimizationLevel = 'aggressive',
    outputDir = 'power-profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Power Consumption Profiling: ${projectName}`);
  ctx.log('info', `Device: ${targetDevice}, Battery: ${batteryCapacity}mAh`);

  // ============================================================================
  // PHASE 1: MEASUREMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Power Measurement');

  const measurementSetup = await ctx.task(powerMeasurementSetupTask, {
    projectName,
    targetDevice,
    measurementTool,
    outputDir
  });

  artifacts.push(...measurementSetup.artifacts);

  // ============================================================================
  // PHASE 2: BASELINE MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Measuring Baseline Power Consumption');

  const baselineMeasurement = await ctx.task(baselinePowerMeasurementTask, {
    projectName,
    targetDevice,
    powerModes,
    measurementSetup,
    outputDir
  });

  artifacts.push(...baselineMeasurement.artifacts);

  // ============================================================================
  // PHASE 3: PERIPHERAL POWER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Peripheral Power Consumption');

  const peripheralAnalysis = await ctx.task(peripheralPowerAnalysisTask, {
    projectName,
    targetDevice,
    baselineMeasurement,
    outputDir
  });

  artifacts.push(...peripheralAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: POWER MODE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Characterizing Power Modes');

  const modeCharacterization = await ctx.task(powerModeCharacterizationTask, {
    projectName,
    powerModes,
    baselineMeasurement,
    outputDir
  });

  artifacts.push(...modeCharacterization.artifacts);

  // ============================================================================
  // PHASE 5: OPTIMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Optimization Opportunities');

  const optimizationAnalysis = await ctx.task(powerOptimizationAnalysisTask, {
    projectName,
    baselineMeasurement,
    peripheralAnalysis,
    modeCharacterization,
    optimizationLevel,
    outputDir
  });

  artifacts.push(...optimizationAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BATTERY LIFE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating Battery Life');

  const batteryEstimation = await ctx.task(batteryLifeEstimationTask, {
    projectName,
    batteryCapacity,
    targetBatteryLife,
    modeCharacterization,
    outputDir
  });

  artifacts.push(...batteryEstimation.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Power Profile Report');

  const report = await ctx.task(powerProfileReportTask, {
    projectName,
    baselineMeasurement,
    peripheralAnalysis,
    modeCharacterization,
    optimizationAnalysis,
    batteryEstimation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Power Profiling Complete for ${projectName}. Estimated battery life: ${batteryEstimation.estimatedLife}. Review results?`,
    title: 'Power Profiling Complete',
    context: {
      runId: ctx.runId,
      summary: {
        activeCurrent: baselineMeasurement.activeCurrent,
        sleepCurrent: baselineMeasurement.sleepCurrent,
        estimatedBatteryLife: batteryEstimation.estimatedLife,
        meetsTarget: batteryEstimation.meetsTarget
      },
      files: [
        { path: report.reportPath, format: 'markdown', label: 'Power Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: batteryEstimation.meetsTarget,
    projectName,
    powerProfile: {
      activeCurrent: baselineMeasurement.activeCurrent,
      idleCurrent: baselineMeasurement.idleCurrent,
      sleepCurrent: baselineMeasurement.sleepCurrent,
      modeProfiles: modeCharacterization.profiles
    },
    optimizations: optimizationAnalysis.recommendations,
    batteryLifeEstimate: batteryEstimation.estimatedLife,
    meetsTarget: batteryEstimation.meetsTarget,
    reportPath: report.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/power-consumption-profiling',
      timestamp: startTime,
      projectName,
      targetDevice,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const powerMeasurementSetupTask = defineTask('power-measurement-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Measurement Setup - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Set up power measurement infrastructure',
      context: args,
      instructions: [
        '1. Configure power analyzer/source meter',
        '2. Set up current shunt resistor',
        '3. Configure measurement range and resolution',
        '4. Set up data logging',
        '5. Configure trigger conditions',
        '6. Calibrate measurement setup',
        '7. Set up thermal stabilization',
        '8. Configure averaging settings',
        '9. Create measurement scripts',
        '10. Document measurement setup'
      ],
      outputFormat: 'JSON with measurement setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'resolution', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        resolution: { type: 'string' },
        measurementRange: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'measurement']
}));

export const baselinePowerMeasurementTask = defineTask('baseline-power-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Baseline Measurement - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Measure baseline power consumption',
      context: args,
      instructions: [
        '1. Measure active mode current',
        '2. Measure idle mode current',
        '3. Measure sleep modes current',
        '4. Measure wake-up current spike',
        '5. Measure peak current',
        '6. Calculate average current',
        '7. Measure transition currents',
        '8. Document operating conditions',
        '9. Verify measurement stability',
        '10. Create baseline report'
      ],
      outputFormat: 'JSON with baseline measurement results'
    },
    outputSchema: {
      type: 'object',
      required: ['activeCurrent', 'idleCurrent', 'sleepCurrent', 'artifacts'],
      properties: {
        activeCurrent: { type: 'string' },
        idleCurrent: { type: 'string' },
        sleepCurrent: { type: 'string' },
        peakCurrent: { type: 'string' },
        measurements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'baseline']
}));

export const peripheralPowerAnalysisTask = defineTask('peripheral-power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Peripheral Analysis - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Analyze peripheral power consumption',
      context: args,
      instructions: [
        '1. Measure each peripheral current',
        '2. Test radio/wireless consumption',
        '3. Measure sensor power',
        '4. Test display power',
        '5. Measure communication interface power',
        '6. Analyze clock impact',
        '7. Test ADC/DAC power',
        '8. Measure memory access power',
        '9. Identify power-hungry peripherals',
        '10. Document peripheral analysis'
      ],
      outputFormat: 'JSON with peripheral power analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['peripheralPower', 'topConsumers', 'artifacts'],
      properties: {
        peripheralPower: { type: 'object' },
        topConsumers: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'peripheral']
}));

export const powerModeCharacterizationTask = defineTask('power-mode-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Mode Characterization - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Characterize power modes',
      context: args,
      instructions: [
        '1. Profile each power mode',
        '2. Measure entry/exit latency',
        '3. Calculate mode transition energy',
        '4. Analyze wake-up sources',
        '5. Measure peripheral retention',
        '6. Test RAM retention power',
        '7. Measure oscillator startup time',
        '8. Analyze voltage scaling impact',
        '9. Create mode comparison',
        '10. Document mode characteristics'
      ],
      outputFormat: 'JSON with mode characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'transitions', 'artifacts'],
      properties: {
        profiles: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'object' },
        optimalModeStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'modes']
}));

export const powerOptimizationAnalysisTask = defineTask('power-optimization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Optimization Analysis - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Analyze power optimization opportunities',
      context: args,
      instructions: [
        '1. Identify optimization opportunities',
        '2. Analyze clock optimization',
        '3. Review voltage scaling options',
        '4. Assess peripheral duty cycling',
        '5. Evaluate sleep mode usage',
        '6. Analyze algorithmic efficiency',
        '7. Review code optimization',
        '8. Assess hardware changes',
        '9. Prioritize optimizations by impact',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'potentialSavings', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        potentialSavings: { type: 'string' },
        implementationEffort: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'optimization']
}));

export const batteryLifeEstimationTask = defineTask('battery-life-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Battery Life Estimation - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Power Systems Engineer',
      task: 'Estimate battery life',
      context: args,
      instructions: [
        '1. Define usage scenarios',
        '2. Calculate average current draw',
        '3. Factor in duty cycles',
        '4. Account for battery efficiency',
        '5. Calculate theoretical battery life',
        '6. Add safety margin',
        '7. Compare to target',
        '8. Consider temperature effects',
        '9. Account for battery aging',
        '10. Document estimation methodology'
      ],
      outputFormat: 'JSON with battery life estimation'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedLife', 'meetsTarget', 'artifacts'],
      properties: {
        estimatedLife: { type: 'string' },
        meetsTarget: { type: 'boolean' },
        usageScenarios: { type: 'array', items: { type: 'object' } },
        averageCurrent: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'power', 'battery-life']
}));

export const powerProfileReportTask = defineTask('power-profile-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Power Profile Report - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate power profile report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document baseline measurements',
        '3. Present peripheral analysis',
        '4. Include mode characterization',
        '5. List optimization recommendations',
        '6. Present battery life estimation',
        '7. Add power profile graphs',
        '8. Include measurement methodology',
        '9. Add comparison tables',
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
  labels: ['embedded-systems', 'power', 'reporting']
}));
