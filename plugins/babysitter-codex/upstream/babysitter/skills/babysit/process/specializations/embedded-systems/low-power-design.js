/**
 * @process specializations/embedded-systems/low-power-design
 * @description Low-Power Design - Implementing power-saving strategies including sleep modes, clock gating, peripheral
 * management, and duty cycling to extend battery life and reduce energy consumption.
 * @inputs { projectName: string, targetMcu: string, powerBudget?: string, batteryCapacity?: string, outputDir?: string }
 * @outputs { success: boolean, powerDesign: object, sleepModes: array, estimatedBatteryLife: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/low-power-design', {
 *   projectName: 'BatterySensor',
 *   targetMcu: 'STM32L476',
 *   powerBudget: '50uA average',
 *   batteryCapacity: '500mAh'
 * });
 *
 * @references
 * - Low Power Embedded Systems: https://interrupt.memfault.com/blog/low-power-design-tips
 * - Sleep Modes: https://www.embedded.com/understanding-low-power-sleep-modes/
 * - Power Management: https://www.arm.com/technologies/low-power-optimization
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    powerBudget = null,
    batteryCapacity = null,
    targetBatteryLife = null,
    dutyCycle = null,
    outputDir = 'low-power-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Low-Power Design: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Power Budget: ${powerBudget || 'Minimize'}`);

  // ============================================================================
  // PHASE 1: POWER REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Power Requirements');

  const requirementsAnalysis = await ctx.task(powerRequirementsTask, {
    projectName,
    targetMcu,
    powerBudget,
    batteryCapacity,
    targetBatteryLife,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CURRENT CONSUMPTION PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 2: Profiling Current Consumption');

  const consumptionProfiling = await ctx.task(currentProfilingTask, {
    projectName,
    targetMcu,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...consumptionProfiling.artifacts);

  // ============================================================================
  // PHASE 3: SLEEP MODE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Sleep Mode Strategy');

  const sleepModeDesign = await ctx.task(sleepModeDesignTask, {
    projectName,
    targetMcu,
    consumptionProfiling,
    powerBudget,
    outputDir
  });

  artifacts.push(...sleepModeDesign.artifacts);

  // ============================================================================
  // PHASE 4: CLOCK MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Clock Management');

  const clockManagement = await ctx.task(clockManagementTask, {
    projectName,
    targetMcu,
    sleepModeDesign,
    outputDir
  });

  artifacts.push(...clockManagement.artifacts);

  // ============================================================================
  // PHASE 5: PERIPHERAL POWER MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing Peripheral Power Management');

  const peripheralManagement = await ctx.task(peripheralPowerManagementTask, {
    projectName,
    targetMcu,
    consumptionProfiling,
    outputDir
  });

  artifacts.push(...peripheralManagement.artifacts);

  // ============================================================================
  // PHASE 6: DUTY CYCLE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing Duty Cycle');

  const dutyCycleOptimization = await ctx.task(dutyCycleOptimizationTask, {
    projectName,
    sleepModeDesign,
    consumptionProfiling,
    dutyCycle,
    outputDir
  });

  artifacts.push(...dutyCycleOptimization.artifacts);

  // ============================================================================
  // PHASE 7: BATTERY LIFE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Estimating Battery Life');

  const batteryEstimation = await ctx.task(batteryLifeEstimationTask, {
    projectName,
    sleepModeDesign,
    dutyCycleOptimization,
    batteryCapacity,
    targetBatteryLife,
    outputDir
  });

  artifacts.push(...batteryEstimation.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Implementation Guide');

  const implementationGuide = await ctx.task(lowPowerImplementationTask, {
    projectName,
    sleepModeDesign,
    clockManagement,
    peripheralManagement,
    dutyCycleOptimization,
    outputDir
  });

  artifacts.push(...implementationGuide.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Low-Power Design Complete for ${projectName}. Estimated battery life: ${batteryEstimation.estimatedLife}. Meets target: ${batteryEstimation.meetsTarget}. Review?`,
    title: 'Low-Power Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        averageCurrent: consumptionProfiling.averageCurrent,
        estimatedBatteryLife: batteryEstimation.estimatedLife,
        meetsTarget: batteryEstimation.meetsTarget,
        sleepModes: sleepModeDesign.modes.length
      },
      files: [
        { path: implementationGuide.guidePath, format: 'markdown', label: 'Implementation Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: batteryEstimation.meetsTarget || true,
    projectName,
    powerDesign: {
      averageCurrent: consumptionProfiling.averageCurrent,
      peakCurrent: consumptionProfiling.peakCurrent,
      sleepCurrent: sleepModeDesign.deepSleepCurrent,
      dutyCycle: dutyCycleOptimization.optimalDutyCycle
    },
    sleepModes: sleepModeDesign.modes,
    clockStrategy: clockManagement.strategy,
    peripheralStrategy: peripheralManagement.strategy,
    estimatedBatteryLife: batteryEstimation.estimatedLife,
    guidePath: implementationGuide.guidePath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/low-power-design',
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

export const powerRequirementsTask = defineTask('power-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Power Requirements - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Analyze power requirements',
      context: args,
      instructions: [
        '1. Define power budget',
        '2. Identify operating modes',
        '3. Define wake sources',
        '4. Specify response times',
        '5. Identify always-on features',
        '6. Define battery constraints',
        '7. Specify environmental conditions',
        '8. Calculate power budget allocation',
        '9. Identify trade-offs',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with power requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['powerBudget', 'operatingModes', 'artifacts'],
      properties: {
        powerBudget: { type: 'object' },
        operatingModes: { type: 'array', items: { type: 'object' } },
        wakeSources: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'requirements']
}));

export const currentProfilingTask = defineTask('current-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Current Profiling - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Profile current consumption',
      context: args,
      instructions: [
        '1. Measure baseline current',
        '2. Profile each subsystem',
        '3. Measure peak current',
        '4. Profile startup current',
        '5. Measure sleep current',
        '6. Profile peripheral current',
        '7. Measure RF current',
        '8. Create power profile',
        '9. Identify power hogs',
        '10. Document measurements'
      ],
      outputFormat: 'JSON with current profile'
    },
    outputSchema: {
      type: 'object',
      required: ['averageCurrent', 'peakCurrent', 'artifacts'],
      properties: {
        averageCurrent: { type: 'string' },
        peakCurrent: { type: 'string' },
        baselineCurrent: { type: 'string' },
        subsystemCurrents: { type: 'object' },
        powerHogs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'profiling']
}));

export const sleepModeDesignTask = defineTask('sleep-mode-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sleep Mode Design - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Design sleep mode strategy',
      context: args,
      instructions: [
        '1. Identify available sleep modes',
        '2. Analyze wakeup latency',
        '3. Select appropriate modes',
        '4. Design mode transitions',
        '5. Configure wakeup sources',
        '6. Plan RAM retention',
        '7. Handle peripheral state',
        '8. Design deep sleep entry',
        '9. Handle wakeup sequence',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with sleep mode design'
    },
    outputSchema: {
      type: 'object',
      required: ['modes', 'deepSleepCurrent', 'artifacts'],
      properties: {
        modes: { type: 'array', items: { type: 'object' } },
        deepSleepCurrent: { type: 'string' },
        wakeupLatency: { type: 'object' },
        transitions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'sleep-modes']
}));

export const clockManagementTask = defineTask('clock-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Clock Management - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Design clock management',
      context: args,
      instructions: [
        '1. Analyze clock tree',
        '2. Select optimal frequencies',
        '3. Implement clock gating',
        '4. Design dynamic scaling',
        '5. Optimize PLL usage',
        '6. Use low-power oscillators',
        '7. Configure peripheral clocks',
        '8. Handle clock transitions',
        '9. Design clock recovery',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with clock management'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'clockConfiguration', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        clockConfiguration: { type: 'object' },
        gatedClocks: { type: 'array', items: { type: 'string' } },
        powerSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'clock']
}));

export const peripheralPowerManagementTask = defineTask('peripheral-power-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Peripheral Power - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Design peripheral power management',
      context: args,
      instructions: [
        '1. Inventory all peripherals',
        '2. Analyze power consumption',
        '3. Identify always-on needs',
        '4. Design power sequencing',
        '5. Implement peripheral gating',
        '6. Handle external devices',
        '7. Design suspend/resume',
        '8. Optimize GPIO states',
        '9. Handle analog peripherals',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with peripheral management'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'peripherals', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        peripherals: { type: 'array', items: { type: 'object' } },
        alwaysOn: { type: 'array', items: { type: 'string' } },
        powerSequence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'peripherals']
}));

export const dutyCycleOptimizationTask = defineTask('duty-cycle-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Duty Cycle - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Optimize duty cycle',
      context: args,
      instructions: [
        '1. Analyze activity patterns',
        '2. Calculate optimal duty cycle',
        '3. Design wake schedules',
        '4. Batch processing design',
        '5. Optimize active periods',
        '6. Minimize wakeup frequency',
        '7. Handle event-driven wakes',
        '8. Design adaptive duty cycle',
        '9. Calculate power impact',
        '10. Document optimization'
      ],
      outputFormat: 'JSON with duty cycle optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalDutyCycle', 'schedule', 'artifacts'],
      properties: {
        optimalDutyCycle: { type: 'string' },
        schedule: { type: 'object' },
        activeTime: { type: 'string' },
        sleepTime: { type: 'string' },
        powerSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'duty-cycle']
}));

export const batteryLifeEstimationTask = defineTask('battery-life-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Battery Life - ${args.projectName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Low-Power Systems Engineer',
      task: 'Estimate battery life',
      context: args,
      instructions: [
        '1. Calculate average current',
        '2. Factor in duty cycle',
        '3. Account for temperature',
        '4. Consider battery degradation',
        '5. Calculate worst case',
        '6. Calculate typical case',
        '7. Compare to target',
        '8. Identify improvements',
        '9. Create power budget',
        '10. Document estimation'
      ],
      outputFormat: 'JSON with battery estimation'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedLife', 'meetsTarget', 'artifacts'],
      properties: {
        estimatedLife: { type: 'string' },
        meetsTarget: { type: 'boolean' },
        averageCurrent: { type: 'string' },
        worstCase: { type: 'string' },
        typicalCase: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'battery']
}));

export const lowPowerImplementationTask = defineTask('low-power-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Implementation Guide - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate low-power implementation guide',
      context: args,
      instructions: [
        '1. Create overview',
        '2. Document sleep modes',
        '3. Explain clock management',
        '4. Document peripheral handling',
        '5. Explain duty cycle',
        '6. Add code examples',
        '7. Include measurements',
        '8. Add troubleshooting',
        '9. Create checklist',
        '10. Format guide'
      ],
      outputFormat: 'JSON with guide details'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'sections', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        codeExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'low-power', 'documentation']
}));
