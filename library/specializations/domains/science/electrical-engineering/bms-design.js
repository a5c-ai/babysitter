/**
 * @process specializations/domains/science/electrical-engineering/bms-design
 * @description Battery Management System Design - Guide the design of BMS for lithium-ion and other battery chemistries.
 * Covers cell monitoring, balancing, state estimation (SOC/SOH), thermal management, and safety protection.
 * @inputs { bmsName: string, batteryConfig: object, requirements: object, chemistry?: string }
 * @outputs { success: boolean, hardware: object, firmware: object, protection: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/bms-design', {
 *   bmsName: 'EV Battery Pack BMS',
 *   batteryConfig: { cells: '96s4p', chemistry: 'NMC', capacity: '60kWh' },
 *   requirements: { voltage: '400V', current: '300A', accuracy: '1%' },
 *   chemistry: 'lithium-nmc'
 * });
 *
 * @references
 * - IEC 62619 (Secondary Lithium Cells for Industrial Applications)
 * - UL 2580 (Batteries for Electric Vehicles)
 * - ISO 12405 (Lithium-ion Traction Battery Packs)
 * - SAE J2464 (EV Battery Abuse Testing)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    bmsName,
    batteryConfig,
    requirements,
    chemistry = 'lithium-ion'
  } = inputs;

  // Phase 1: Define Battery System Requirements
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    bmsName,
    batteryConfig,
    requirements,
    chemistry
  });

  // Phase 2: Design Cell Monitoring Circuit
  const cellMonitoring = await ctx.task(cellMonitoringTask, {
    bmsName,
    batteryConfig,
    requirements: requirementsDefinition.specs
  });

  // Breakpoint: Review cell monitoring design
  await ctx.breakpoint({
    question: `Review cell monitoring design for ${bmsName}. Monitoring IC: ${cellMonitoring.monitoringIC}. Proceed with balancing design?`,
    title: 'Cell Monitoring Review',
    context: {
      runId: ctx.runId,
      bmsName,
      cellMonitoring,
      files: [{
        path: `artifacts/phase2-monitoring.json`,
        format: 'json',
        content: cellMonitoring
      }]
    }
  });

  // Phase 3: Design Cell Balancing System
  const cellBalancing = await ctx.task(cellBalancingTask, {
    bmsName,
    batteryConfig,
    cellMonitoring,
    requirements: requirementsDefinition.specs
  });

  // Phase 4: Implement State Estimation (SOC/SOH)
  const stateEstimation = await ctx.task(stateEstimationTask, {
    bmsName,
    batteryConfig,
    chemistry,
    requirements: requirementsDefinition.specs
  });

  // Phase 5: Design Thermal Management Interface
  const thermalManagement = await ctx.task(thermalManagementTask, {
    bmsName,
    batteryConfig,
    requirements: requirementsDefinition.specs
  });

  // Breakpoint: Review thermal and state estimation
  await ctx.breakpoint({
    question: `Review SOC algorithm: ${stateEstimation.algorithm}. Thermal strategy: ${thermalManagement.strategy}. Proceed with protection design?`,
    title: 'State Estimation & Thermal Review',
    context: {
      runId: ctx.runId,
      stateEstimation,
      thermalManagement,
      files: [
        { path: `artifacts/phase4-soc.json`, format: 'json', content: stateEstimation },
        { path: `artifacts/phase5-thermal.json`, format: 'json', content: thermalManagement }
      ]
    }
  });

  // Phase 6: Design Safety Protection System
  const safetyProtection = await ctx.task(safetyProtectionTask, {
    bmsName,
    batteryConfig,
    cellMonitoring,
    requirements: requirementsDefinition.specs
  });

  // Phase 7: Develop BMS Firmware Architecture
  const firmwareDesign = await ctx.task(firmwareDesignTask, {
    bmsName,
    cellMonitoring,
    cellBalancing,
    stateEstimation,
    thermalManagement,
    safetyProtection,
    requirements: requirementsDefinition.specs
  });

  // Quality Gate: Safety compliance check
  if (!safetyProtection.compliant) {
    await ctx.breakpoint({
      question: `Safety compliance issues found: ${safetyProtection.issues.length} items. Review and iterate design?`,
      title: 'Safety Compliance Issues',
      context: {
        runId: ctx.runId,
        issues: safetyProtection.issues,
        recommendations: safetyProtection.recommendations
      }
    });
  }

  // Phase 8: Validate BMS Design
  const designValidation = await ctx.task(designValidationTask, {
    bmsName,
    hardware: {
      cellMonitoring,
      cellBalancing,
      thermalManagement,
      safetyProtection
    },
    firmware: firmwareDesign,
    requirements: requirementsDefinition.specs
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `BMS design complete for ${bmsName}. Safety rating: ${designValidation.safetyRating}. Approve for prototyping?`,
    title: 'BMS Design Approval',
    context: {
      runId: ctx.runId,
      bmsName,
      validationSummary: designValidation.summary,
      files: [
        { path: `artifacts/bms-design.json`, format: 'json', content: { hardware: { cellMonitoring, cellBalancing, safetyProtection }, firmware: firmwareDesign } },
        { path: `artifacts/bms-report.md`, format: 'markdown', content: designValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    bmsName,
    hardware: {
      cellMonitoring,
      cellBalancing,
      thermalManagement,
      safetyProtection
    },
    firmware: firmwareDesign,
    protection: safetyProtection,
    validation: {
      designReview: designValidation.results,
      safetyRating: designValidation.safetyRating
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/bms-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'BMS Systems Engineer',
      task: 'Define battery management system requirements',
      context: args,
      instructions: [
        '1. Define battery pack configuration (series/parallel)',
        '2. Specify cell voltage monitoring requirements',
        '3. Define current sensing requirements',
        '4. Specify temperature monitoring points',
        '5. Define SOC/SOH accuracy requirements',
        '6. Specify balancing requirements',
        '7. Define communication interfaces',
        '8. Specify safety protection requirements',
        '9. Define thermal management requirements',
        '10. Document all BMS specifications'
      ],
      outputFormat: 'JSON object with BMS specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specs'],
      properties: { specs: { type: 'object' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'requirements']
}));

export const cellMonitoringTask = defineTask('cell-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Cell Monitoring Design - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'BMS Hardware Engineer',
      task: 'Design cell monitoring circuit',
      context: args,
      instructions: [
        '1. Select cell monitoring IC (e.g., LTC6811, BQ76952)',
        '2. Design voltage measurement circuit',
        '3. Design current sensing (shunt or Hall)',
        '4. Design temperature sensing network',
        '5. Plan cell monitoring daisy chain',
        '6. Design isolation interface',
        '7. Specify measurement accuracy and timing',
        '8. Design filtering for noise immunity',
        '9. Plan calibration procedure',
        '10. Document cell monitoring design'
      ],
      outputFormat: 'JSON object with cell monitoring design'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringIC', 'voltageSensing', 'currentSensing'],
      properties: {
        monitoringIC: { type: 'string' },
        voltageSensing: { type: 'object' },
        currentSensing: { type: 'object' },
        temperatureSensing: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'monitoring']
}));

export const cellBalancingTask = defineTask('cell-balancing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Cell Balancing Design - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'BMS Balancing Engineer',
      task: 'Design cell balancing system',
      context: args,
      instructions: [
        '1. Select balancing method (passive/active)',
        '2. Design passive balancing circuit if applicable',
        '3. Design active balancing topology if applicable',
        '4. Specify balancing current and timing',
        '5. Design thermal management for balancing',
        '6. Implement balancing algorithm',
        '7. Define balancing thresholds',
        '8. Design balancing control interface',
        '9. Plan balancing validation tests',
        '10. Document balancing design'
      ],
      outputFormat: 'JSON object with cell balancing design'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'balancingCurrent'],
      properties: {
        method: { type: 'string' },
        balancingCurrent: { type: 'string' },
        topology: { type: 'object' },
        algorithm: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'balancing']
}));

export const stateEstimationTask = defineTask('state-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: State Estimation - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'BMS Algorithm Engineer',
      task: 'Implement SOC/SOH state estimation',
      context: args,
      instructions: [
        '1. Select SOC estimation algorithm',
        '2. Implement Coulomb counting baseline',
        '3. Implement OCV-based estimation',
        '4. Design Kalman filter if applicable',
        '5. Implement SOH estimation algorithm',
        '6. Design capacity estimation method',
        '7. Implement resistance estimation',
        '8. Design temperature compensation',
        '9. Plan model calibration procedure',
        '10. Document state estimation algorithms'
      ],
      outputFormat: 'JSON object with state estimation design'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'socMethod', 'sohMethod'],
      properties: {
        algorithm: { type: 'string' },
        socMethod: { type: 'object' },
        sohMethod: { type: 'object' },
        accuracy: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'state-estimation']
}));

export const thermalManagementTask = defineTask('thermal-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Thermal Management - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'Thermal Systems Engineer',
      task: 'Design thermal management interface',
      context: args,
      instructions: [
        '1. Define thermal monitoring points',
        '2. Design temperature sensor placement',
        '3. Define thermal limits and thresholds',
        '4. Design heating system control',
        '5. Design cooling system control',
        '6. Implement thermal protection',
        '7. Design thermal model for prediction',
        '8. Plan thermal runaway detection',
        '9. Design thermal interface to vehicle/system',
        '10. Document thermal management design'
      ],
      outputFormat: 'JSON object with thermal management design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'sensorPlacement', 'limits'],
      properties: {
        strategy: { type: 'string' },
        sensorPlacement: { type: 'array', items: { type: 'object' } },
        limits: { type: 'object' },
        controls: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'thermal']
}));

export const safetyProtectionTask = defineTask('safety-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Safety Protection - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'Battery Safety Engineer',
      task: 'Design safety protection system',
      context: args,
      instructions: [
        '1. Design overvoltage protection',
        '2. Design undervoltage protection',
        '3. Design overcurrent protection',
        '4. Design short circuit protection',
        '5. Design over-temperature protection',
        '6. Design thermal runaway mitigation',
        '7. Implement cell isolation capability',
        '8. Design contactor control',
        '9. Implement safety interlock chain',
        '10. Document safety protection design'
      ],
      outputFormat: 'JSON object with safety protection design'
    },
    outputSchema: {
      type: 'object',
      required: ['protections', 'compliant'],
      properties: {
        protections: { type: 'array', items: { type: 'object' } },
        compliant: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'safety']
}));

export const firmwareDesignTask = defineTask('firmware-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Firmware Architecture - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Develop BMS firmware architecture',
      context: args,
      instructions: [
        '1. Define firmware architecture',
        '2. Design task scheduling',
        '3. Implement cell monitoring task',
        '4. Implement balancing control task',
        '5. Implement SOC/SOH estimation task',
        '6. Implement thermal management task',
        '7. Implement safety monitoring task',
        '8. Design communication stack (CAN/SPI)',
        '9. Implement diagnostics and logging',
        '10. Document firmware architecture'
      ],
      outputFormat: 'JSON object with firmware architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'tasks', 'communication'],
      properties: {
        architecture: { type: 'object' },
        tasks: { type: 'array', items: { type: 'object' } },
        communication: { type: 'object' },
        diagnostics: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'firmware']
}));

export const designValidationTask = defineTask('design-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Design Validation - ${args.bmsName}`,
  agent: {
    name: 'battery-systems-engineer',
    prompt: {
      role: 'BMS Validation Engineer',
      task: 'Validate BMS design',
      context: args,
      instructions: [
        '1. Review hardware design compliance',
        '2. Verify safety protection coverage',
        '3. Validate SOC/SOH accuracy',
        '4. Review thermal management adequacy',
        '5. Verify communication interfaces',
        '6. Review firmware architecture',
        '7. Check standards compliance (UL, IEC)',
        '8. Perform FMEA analysis',
        '9. Generate validation report',
        '10. Provide design recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'safetyRating', 'summary'],
      properties: {
        results: { type: 'object' },
        safetyRating: { type: 'string' },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'bms', 'validation']
}));
