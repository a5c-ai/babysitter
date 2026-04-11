/**
 * @process specializations/domains/science/mechanical-engineering/thermal-management-design
 * @description Thermal Management Design - Analyzing heat transfer paths through conduction, convection,
 * and radiation, sizing thermal management components (heat sinks, fans, heat pipes), and optimizing
 * system thermal performance.
 * @inputs { projectName: string, heatSources: array, ambientConditions: object, constraints: object }
 * @outputs { success: boolean, thermalResults: object, componentSizing: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/thermal-management-design', {
 *   projectName: 'Electronics Enclosure Cooling',
 *   heatSources: [{ name: 'CPU', power: 95, maxTemp: 100 }, { name: 'GPU', power: 150, maxTemp: 90 }],
 *   ambientConditions: { temperature: 35, airflow: 'forced' },
 *   constraints: { maxSystemTemp: 85, powerBudget: 50 }
 * });
 *
 * @references
 * - Fundamentals of Heat and Mass Transfer: https://www.wiley.com/en-us/Fundamentals+of+Heat+and+Mass+Transfer
 * - Thermal Management Handbook for Electronic Assemblies: https://www.springer.com/
 * - JEDEC Standards for Thermal Characterization
 * - ASHRAE Thermal Guidelines for Data Centers
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    heatSources = [],
    ambientConditions = {},
    constraints = {},
    enclosureGeometry = {},
    existingComponents = [],
    coolingStrategy = 'forced-air', // 'natural', 'forced-air', 'liquid', 'phase-change'
    outputDir = 'thermal-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Thermal Management Design for ${projectName}`);
  ctx.log('info', `Total heat load: ${heatSources.reduce((sum, h) => sum + h.power, 0)} W`);

  // ============================================================================
  // PHASE 1: THERMAL REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Thermal Requirements Analysis');

  const requirementsResult = await ctx.task(thermalRequirementsTask, {
    projectName,
    heatSources,
    ambientConditions,
    constraints,
    outputDir
  });

  artifacts.push(...requirementsResult.artifacts);

  ctx.log('info', `Requirements analyzed - Total heat: ${requirementsResult.totalHeatLoad} W`);

  // ============================================================================
  // PHASE 2: THERMAL RESISTANCE NETWORK
  // ============================================================================

  ctx.log('info', 'Phase 2: Thermal Resistance Network Development');

  const networkResult = await ctx.task(thermalNetworkTask, {
    projectName,
    heatSources,
    enclosureGeometry,
    existingComponents,
    ambientConditions,
    outputDir
  });

  artifacts.push(...networkResult.artifacts);

  ctx.log('info', `Thermal network developed - ${networkResult.nodeCount} nodes, ${networkResult.resistanceCount} resistances`);

  // ============================================================================
  // PHASE 3: BASELINE THERMAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Baseline Thermal Analysis');

  const baselineResult = await ctx.task(baselineThermalTask, {
    projectName,
    networkResult,
    heatSources,
    ambientConditions,
    outputDir
  });

  artifacts.push(...baselineResult.artifacts);

  ctx.log('info', `Baseline analysis complete - Max temp: ${baselineResult.maxTemperature}C`);

  // Quality Gate: Thermal limit exceeded
  if (baselineResult.maxTemperature > constraints.maxSystemTemp) {
    await ctx.breakpoint({
      question: `Baseline max temperature ${baselineResult.maxTemperature}C exceeds limit ${constraints.maxSystemTemp}C. Active cooling required. Review thermal map?`,
      title: 'Thermal Limit Exceeded',
      context: {
        runId: ctx.runId,
        maxTemperature: baselineResult.maxTemperature,
        temperatureDistribution: baselineResult.temperatureDistribution,
        hotSpots: baselineResult.hotSpots,
        files: baselineResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: COOLING SOLUTION SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Cooling Solution Selection');

  const coolingSelectionResult = await ctx.task(coolingSelectionTask, {
    projectName,
    requirementsResult,
    baselineResult,
    constraints,
    coolingStrategy,
    outputDir
  });

  artifacts.push(...coolingSelectionResult.artifacts);

  ctx.log('info', `Cooling solution selected: ${coolingSelectionResult.selectedSolution}`);

  // ============================================================================
  // PHASE 5: COMPONENT SIZING
  // ============================================================================

  ctx.log('info', 'Phase 5: Thermal Component Sizing');

  const sizingResult = await ctx.task(componentSizingTask, {
    projectName,
    heatSources,
    coolingSelectionResult,
    ambientConditions,
    constraints,
    outputDir
  });

  artifacts.push(...sizingResult.artifacts);

  ctx.log('info', `Components sized - Heat sink: ${sizingResult.heatSinkSize}, Fan: ${sizingResult.fanSize}`);

  // Breakpoint: Review component sizing
  await ctx.breakpoint({
    question: `Component sizing complete. Heat sink: ${sizingResult.heatSinkSize}, Fan: ${sizingResult.fanSpec}. Estimated junction temps within limits. Review sizing?`,
    title: 'Component Sizing Review',
    context: {
      runId: ctx.runId,
      componentSizing: sizingResult.components,
      predictedTemperatures: sizingResult.predictedTemperatures,
      files: sizingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: DETAILED THERMAL SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Detailed Thermal Simulation');

  const simulationResult = await ctx.task(thermalSimulationTask, {
    projectName,
    networkResult,
    sizingResult,
    heatSources,
    ambientConditions,
    outputDir
  });

  artifacts.push(...simulationResult.artifacts);

  ctx.log('info', `Simulation complete - Max junction temp: ${simulationResult.maxJunctionTemp}C`);

  // Quality Gate: Thermal margin
  const thermalMargin = constraints.maxSystemTemp - simulationResult.maxJunctionTemp;
  if (thermalMargin < 5) {
    await ctx.breakpoint({
      question: `Thermal margin only ${thermalMargin.toFixed(1)}C. Consider design margin improvements. Review thermal map?`,
      title: 'Low Thermal Margin',
      context: {
        runId: ctx.runId,
        thermalMargin,
        maxJunctionTemp: simulationResult.maxJunctionTemp,
        temperatureMap: simulationResult.temperatureMap,
        files: simulationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: TRANSIENT THERMAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Transient Thermal Analysis');

  const transientResult = await ctx.task(transientThermalTask, {
    projectName,
    simulationResult,
    heatSources,
    outputDir
  });

  artifacts.push(...transientResult.artifacts);

  ctx.log('info', `Transient analysis complete - Time to steady state: ${transientResult.timeToSteadyState} min`);

  // ============================================================================
  // PHASE 8: GENERATE THERMAL REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Thermal Management Report');

  const reportResult = await ctx.task(generateThermalReportTask, {
    projectName,
    requirementsResult,
    networkResult,
    baselineResult,
    coolingSelectionResult,
    sizingResult,
    simulationResult,
    transientResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Thermal Management Design Complete for ${projectName}. Max temp: ${simulationResult.maxJunctionTemp}C, Margin: ${thermalMargin.toFixed(1)}C. Approve design?`,
    title: 'Thermal Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalHeatLoad: requirementsResult.totalHeatLoad,
        maxJunctionTemp: simulationResult.maxJunctionTemp,
        thermalMargin,
        coolingSolution: coolingSelectionResult.selectedSolution
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Thermal Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    thermalResults: {
      totalHeatLoad: requirementsResult.totalHeatLoad,
      maxJunctionTemp: simulationResult.maxJunctionTemp,
      thermalMargin,
      steadyStateTemps: simulationResult.steadyStateTemps,
      timeToSteadyState: transientResult.timeToSteadyState
    },
    componentSizing: sizingResult.components,
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/thermal-management-design',
      processSlug: 'thermal-management-design',
      category: 'mechanical-engineering',
      timestamp: startTime,
      coolingStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const thermalRequirementsTask = defineTask('thermal-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Design Specialist',
      task: 'Analyze thermal management requirements',
      context: {
        projectName: args.projectName,
        heatSources: args.heatSources,
        ambientConditions: args.ambientConditions,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate total heat load from all sources',
        '2. Identify maximum allowable temperatures:',
        '   - Junction temperatures',
        '   - Case temperatures',
        '   - Ambient limits',
        '3. Define thermal resistance budget:',
        '   - Junction-to-case',
        '   - Case-to-ambient required',
        '4. Determine operating environments',
        '5. Identify duty cycles and transient requirements',
        '6. Define power budget for cooling',
        '7. Document size and weight constraints',
        '8. Calculate required heat dissipation rate'
      ],
      outputFormat: 'JSON object with thermal requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalHeatLoad', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalHeatLoad: { type: 'number' },
        requiredThermalResistance: { type: 'number' },
        temperatureBudget: { type: 'object' },
        dutyCycle: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'requirements']
}));

export const thermalNetworkTask = defineTask('thermal-network', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Network - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Specialist',
      task: 'Develop thermal resistance network model',
      context: {
        projectName: args.projectName,
        heatSources: args.heatSources,
        enclosureGeometry: args.enclosureGeometry,
        existingComponents: args.existingComponents,
        ambientConditions: args.ambientConditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create thermal nodes for:',
        '   - Heat source junctions',
        '   - Component cases',
        '   - Heat sinks',
        '   - Enclosure surfaces',
        '   - Ambient',
        '2. Calculate conduction resistances:',
        '   R = L/(k*A)',
        '3. Calculate convection resistances:',
        '   R = 1/(h*A)',
        '4. Estimate radiation exchange',
        '5. Account for interface resistances (TIM)',
        '6. Build resistance network diagram',
        '7. Identify heat flow paths',
        '8. Document all thermal properties used'
      ],
      outputFormat: 'JSON object with thermal network'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'nodeCount', 'resistanceCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nodeCount: { type: 'number' },
        resistanceCount: { type: 'number' },
        networkTopology: { type: 'object' },
        resistanceValues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'network-model']
}));

export const baselineThermalTask = defineTask('baseline-thermal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Baseline Thermal Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Specialist',
      task: 'Perform baseline thermal analysis without active cooling',
      context: {
        projectName: args.projectName,
        networkResult: args.networkResult,
        heatSources: args.heatSources,
        ambientConditions: args.ambientConditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Solve thermal network for steady state',
        '2. Calculate temperature at each node:',
        '   T = T_ambient + Q * R_total',
        '3. Identify maximum temperatures',
        '4. Locate hot spots',
        '5. Calculate temperature gradients',
        '6. Compare to temperature limits',
        '7. Determine cooling requirement',
        '8. Create temperature distribution map'
      ],
      outputFormat: 'JSON object with baseline analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxTemperature', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxTemperature: { type: 'number' },
        temperatureDistribution: { type: 'object' },
        hotSpots: { type: 'array' },
        coolingRequired: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'baseline-analysis']
}));

export const coolingSelectionTask = defineTask('cooling-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cooling Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Design Specialist',
      task: 'Select appropriate cooling solution',
      context: {
        projectName: args.projectName,
        requirementsResult: args.requirementsResult,
        baselineResult: args.baselineResult,
        constraints: args.constraints,
        coolingStrategy: args.coolingStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate cooling options:',
        '   - Natural convection (passive)',
        '   - Forced air cooling (fans)',
        '   - Liquid cooling',
        '   - Heat pipes/vapor chambers',
        '   - Thermoelectric cooling',
        '2. Score each option against criteria:',
        '   - Thermal performance',
        '   - Power consumption',
        '   - Noise level',
        '   - Reliability',
        '   - Cost',
        '   - Size/weight',
        '3. Select optimal solution',
        '4. Define system architecture',
        '5. Document selection rationale'
      ],
      outputFormat: 'JSON object with cooling selection'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedSolution', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedSolution: { type: 'string' },
        optionScores: { type: 'object' },
        systemArchitecture: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'cooling-selection']
}));

export const componentSizingTask = defineTask('component-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Sizing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Design Specialist',
      task: 'Size thermal management components',
      context: {
        projectName: args.projectName,
        heatSources: args.heatSources,
        coolingSelectionResult: args.coolingSelectionResult,
        ambientConditions: args.ambientConditions,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Size heat sinks:',
        '   - Calculate required thermal resistance',
        '   - Select fin geometry and material',
        '   - Calculate spreading resistance',
        '2. Size fans (if forced air):',
        '   - Calculate required airflow (CFM)',
        '   - Determine system impedance',
        '   - Select fan from operating point',
        '3. Size TIM (thermal interface material)',
        '4. Size liquid cooling components if applicable',
        '5. Size heat pipes if applicable',
        '6. Predict component temperatures',
        '7. Verify within constraints',
        '8. Document component specifications'
      ],
      outputFormat: 'JSON object with component sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'components', 'predictedTemperatures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        heatSinkSize: { type: 'string' },
        fanSize: { type: 'string' },
        fanSpec: { type: 'string' },
        components: { type: 'array' },
        predictedTemperatures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'component-sizing']
}));

export const thermalSimulationTask = defineTask('thermal-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Simulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Specialist',
      task: 'Perform detailed thermal simulation with sized components',
      context: {
        projectName: args.projectName,
        networkResult: args.networkResult,
        sizingResult: args.sizingResult,
        heatSources: args.heatSources,
        ambientConditions: args.ambientConditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Update thermal network with sized components',
        '2. Include actual heat sink performance',
        '3. Include fan performance at operating point',
        '4. Include TIM thermal resistance',
        '5. Solve for steady-state temperatures',
        '6. Calculate all junction temperatures',
        '7. Calculate thermal margins',
        '8. Create thermal contour map',
        '9. Verify all limits met',
        '10. Calculate power consumption'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxJunctionTemp', 'steadyStateTemps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxJunctionTemp: { type: 'number' },
        steadyStateTemps: { type: 'object' },
        temperatureMap: { type: 'object' },
        thermalMargins: { type: 'object' },
        coolingPower: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'simulation']
}));

export const transientThermalTask = defineTask('transient-thermal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transient Thermal Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Specialist',
      task: 'Perform transient thermal analysis',
      context: {
        projectName: args.projectName,
        simulationResult: args.simulationResult,
        heatSources: args.heatSources,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define thermal capacitances (mass * Cp)',
        '2. Set up transient heat balance equations',
        '3. Define time step for stability',
        '4. Simulate startup from ambient',
        '5. Calculate time to reach steady state',
        '6. Analyze power cycling response',
        '7. Evaluate thermal shock scenarios',
        '8. Plot temperature vs time curves',
        '9. Identify thermal time constants',
        '10. Check transient temperature limits'
      ],
      outputFormat: 'JSON object with transient analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'timeToSteadyState', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        timeToSteadyState: { type: 'number' },
        thermalTimeConstant: { type: 'number' },
        temperatureHistory: { type: 'array' },
        peakTransientTemp: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'transient']
}));

export const generateThermalReportTask = defineTask('generate-thermal-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Thermal Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive thermal management report',
      context: {
        projectName: args.projectName,
        requirementsResult: args.requirementsResult,
        networkResult: args.networkResult,
        baselineResult: args.baselineResult,
        coolingSelectionResult: args.coolingSelectionResult,
        sizingResult: args.sizingResult,
        simulationResult: args.simulationResult,
        transientResult: args.transientResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document thermal requirements',
        '3. Present thermal resistance network',
        '4. Show baseline vs. improved temperatures',
        '5. Document cooling solution selection',
        '6. Present component specifications',
        '7. Show thermal simulation results',
        '8. Present transient response',
        '9. Document thermal margins',
        '10. State conclusions and recommendations'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'thermal', 'reporting']
}));
