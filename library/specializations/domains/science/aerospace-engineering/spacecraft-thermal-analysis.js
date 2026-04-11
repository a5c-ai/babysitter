/**
 * @process specializations/domains/science/aerospace-engineering/spacecraft-thermal-analysis
 * @description Process for thermal control system design and analysis including thermal desktop modeling,
 * environment definition, and thermal balance verification.
 * @inputs { projectName: string, spacecraftConfig: object, missionEnvironment: object, thermalRequirements?: object }
 * @outputs { success: boolean, thermalModel: object, temperaturePredictions: object, tcsDesign: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/spacecraft-thermal-analysis', {
 *   projectName: 'LEO Satellite Thermal',
 *   spacecraftConfig: { type: 'smallsat', mass: 150 },
 *   missionEnvironment: { orbit: 'LEO', altitude: 500, inclination: 28.5 }
 * });
 *
 * @references
 * - Spacecraft Thermal Control Handbook (Gilmore)
 * - NASA Thermal Analysis Guidelines
 * - Thermal Desktop Documentation
 * - ECSS-E-ST-31C Thermal Control Standard
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    spacecraftConfig,
    missionEnvironment,
    thermalRequirements = {}
  } = inputs;

  // Phase 1: Requirements Definition
  const requirements = await ctx.task(thermalRequirementsTask, {
    projectName,
    spacecraftConfig,
    missionEnvironment,
    thermalRequirements
  });

  // Phase 2: Environment Definition
  const thermalEnvironment = await ctx.task(thermalEnvironmentTask, {
    projectName,
    missionEnvironment,
    orbitParameters: missionEnvironment.orbit
  });

  // Phase 3: Thermal Model Development
  const thermalModel = await ctx.task(thermalModelTask, {
    projectName,
    spacecraftConfig,
    requirements,
    thermalEnvironment
  });

  // Breakpoint: Model review
  await ctx.breakpoint({
    question: `Thermal model complete for ${projectName}. Nodes: ${thermalModel.nodeCount}. Proceed with analysis?`,
    title: 'Thermal Model Review',
    context: {
      runId: ctx.runId,
      thermalModel: thermalModel.summary
    }
  });

  // Phase 4: Hot Case Analysis
  const hotCaseAnalysis = await ctx.task(hotCaseAnalysisTask, {
    projectName,
    thermalModel,
    environment: thermalEnvironment.hotCase
  });

  // Phase 5: Cold Case Analysis
  const coldCaseAnalysis = await ctx.task(coldCaseAnalysisTask, {
    projectName,
    thermalModel,
    environment: thermalEnvironment.coldCase
  });

  // Quality Gate: Temperature compliance
  const worstHotMargin = Math.min(...hotCaseAnalysis.temperatureMargins);
  const worstColdMargin = Math.min(...coldCaseAnalysis.temperatureMargins);

  if (worstHotMargin < 5 || worstColdMargin < 5) {
    await ctx.breakpoint({
      question: `Temperature margins below 5C. Hot: ${worstHotMargin}C, Cold: ${worstColdMargin}C. Review TCS design?`,
      title: 'Temperature Margin Warning',
      context: {
        runId: ctx.runId,
        hotCase: hotCaseAnalysis,
        coldCase: coldCaseAnalysis
      }
    });
  }

  // Phase 6: Transient Analysis
  const transientAnalysis = await ctx.task(transientAnalysisTask, {
    projectName,
    thermalModel,
    scenarios: requirements.transientScenarios
  });

  // Phase 7: TCS Design Refinement
  const tcsDesign = await ctx.task(tcsDesignTask, {
    projectName,
    requirements,
    hotCaseAnalysis,
    coldCaseAnalysis,
    transientAnalysis
  });

  // Phase 8: Heater Sizing
  const heaterSizing = await ctx.task(heaterSizingTask, {
    projectName,
    coldCaseAnalysis,
    tcsDesign,
    powerBudget: requirements.powerBudget
  });

  // Phase 9: Thermal Balance Verification
  const thermalBalance = await ctx.task(thermalBalanceTask, {
    projectName,
    thermalModel,
    tcsDesign,
    heaterSizing
  });

  // Phase 10: Report Generation
  const reportGeneration = await ctx.task(thermalReportTask, {
    projectName,
    requirements,
    thermalEnvironment,
    thermalModel,
    hotCaseAnalysis,
    coldCaseAnalysis,
    transientAnalysis,
    tcsDesign,
    heaterSizing,
    thermalBalance
  });

  // Final Breakpoint: Thermal Design Approval
  await ctx.breakpoint({
    question: `Thermal analysis complete for ${projectName}. All components within limits. Approve TCS design?`,
    title: 'Thermal Analysis Approval',
    context: {
      runId: ctx.runId,
      summary: {
        hotCaseMargin: worstHotMargin,
        coldCaseMargin: worstColdMargin,
        heaterPower: heaterSizing.totalPower,
        tcsWeight: tcsDesign.totalMass
      },
      files: [
        { path: 'artifacts/thermal-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/thermal-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    thermalModel: thermalModel,
    temperaturePredictions: {
      hotCase: hotCaseAnalysis,
      coldCase: coldCaseAnalysis,
      transient: transientAnalysis
    },
    tcsDesign: tcsDesign,
    heaterSizing: heaterSizing,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/spacecraft-thermal-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions (abbreviated for remaining files)

export const thermalRequirementsTask = defineTask('thermal-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spacecraft Thermal Engineer',
      task: 'Define thermal requirements',
      context: args,
      instructions: [
        '1. Define component temperature limits',
        '2. Establish operational vs survival ranges',
        '3. Define thermal stability requirements',
        '4. Identify heat dissipation requirements',
        '5. Define margin policy',
        '6. Establish power budget for TCS',
        '7. Define transient scenarios',
        '8. Identify critical components',
        '9. Define test requirements',
        '10. Document thermal requirements'
      ],
      outputFormat: 'JSON object with thermal requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatureLimits', 'marginPolicy'],
      properties: {
        temperatureLimits: { type: 'object' },
        marginPolicy: { type: 'object' },
        heatDissipation: { type: 'object' },
        transientScenarios: { type: 'array', items: { type: 'object' } },
        powerBudget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'requirements', 'aerospace']
}));

export const thermalEnvironmentTask = defineTask('thermal-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Environment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Space Environment Engineer',
      task: 'Define thermal environment',
      context: args,
      instructions: [
        '1. Calculate solar flux',
        '2. Calculate albedo',
        '3. Calculate Earth IR',
        '4. Define hot case environment',
        '5. Define cold case environment',
        '6. Calculate eclipse duration',
        '7. Define beta angle range',
        '8. Calculate view factors',
        '9. Document seasonal variations',
        '10. Create environment database'
      ],
      outputFormat: 'JSON object with thermal environment'
    },
    outputSchema: {
      type: 'object',
      required: ['hotCase', 'coldCase'],
      properties: {
        hotCase: { type: 'object' },
        coldCase: { type: 'object' },
        solarFlux: { type: 'object' },
        eclipseData: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'environment', 'aerospace']
}));

export const thermalModelTask = defineTask('thermal-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Model Engineer',
      task: 'Develop thermal mathematical model',
      context: args,
      instructions: [
        '1. Create geometric model',
        '2. Define thermal nodes',
        '3. Calculate conductances',
        '4. Define radiation couplings',
        '5. Apply optical properties',
        '6. Model heat sources',
        '7. Define boundary conditions',
        '8. Verify energy balance',
        '9. Document model assumptions',
        '10. Create model database'
      ],
      outputFormat: 'JSON object with thermal model'
    },
    outputSchema: {
      type: 'object',
      required: ['nodeCount', 'summary'],
      properties: {
        nodeCount: { type: 'number' },
        summary: { type: 'object' },
        conductances: { type: 'object' },
        radiationCouplings: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'modeling', 'aerospace']
}));

export const hotCaseAnalysisTask = defineTask('hot-case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hot Case Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Engineer',
      task: 'Perform hot case thermal analysis',
      context: args,
      instructions: [
        '1. Apply hot case environment',
        '2. Apply EOL optical properties',
        '3. Apply maximum heat dissipation',
        '4. Run steady-state solution',
        '5. Calculate temperature margins',
        '6. Identify hot spots',
        '7. Evaluate radiator sizing',
        '8. Document results',
        '9. Generate contour plots',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with hot case results'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatures', 'temperatureMargins'],
      properties: {
        temperatures: { type: 'object' },
        temperatureMargins: { type: 'array', items: { type: 'number' } },
        hotSpots: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'hot-case', 'aerospace']
}));

export const coldCaseAnalysisTask = defineTask('cold-case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cold Case Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Analysis Engineer',
      task: 'Perform cold case thermal analysis',
      context: args,
      instructions: [
        '1. Apply cold case environment',
        '2. Apply BOL optical properties',
        '3. Apply minimum heat dissipation',
        '4. Run steady-state solution',
        '5. Calculate temperature margins',
        '6. Identify cold spots',
        '7. Evaluate heater requirements',
        '8. Document results',
        '9. Generate contour plots',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with cold case results'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatures', 'temperatureMargins'],
      properties: {
        temperatures: { type: 'object' },
        temperatureMargins: { type: 'array', items: { type: 'number' } },
        coldSpots: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'cold-case', 'aerospace']
}));

export const transientAnalysisTask = defineTask('transient-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transient Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Transient Thermal Analyst',
      task: 'Perform transient thermal analysis',
      context: args,
      instructions: [
        '1. Define transient scenarios',
        '2. Set up orbit simulation',
        '3. Include eclipse transitions',
        '4. Model heater cycling',
        '5. Run transient solution',
        '6. Calculate temperature swings',
        '7. Verify thermal stability',
        '8. Analyze worst-case conditions',
        '9. Document results',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with transient results'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatureSwings', 'scenarios'],
      properties: {
        temperatureSwings: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        heaterCycling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'transient', 'aerospace']
}));

export const tcsDesignTask = defineTask('tcs-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `TCS Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Control System Designer',
      task: 'Design thermal control system',
      context: args,
      instructions: [
        '1. Size radiators',
        '2. Select thermal coatings',
        '3. Design MLI blankets',
        '4. Design heat pipes',
        '5. Select thermal interface materials',
        '6. Design thermal isolation',
        '7. Size heater zones',
        '8. Calculate TCS mass',
        '9. Document design',
        '10. Create parts list'
      ],
      outputFormat: 'JSON object with TCS design'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMass', 'components'],
      properties: {
        totalMass: { type: 'number' },
        components: { type: 'object' },
        radiators: { type: 'object' },
        mli: { type: 'object' },
        heatPipes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'tcs-design', 'aerospace']
}));

export const heaterSizingTask = defineTask('heater-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Heater Sizing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heater System Engineer',
      task: 'Size and design heater system',
      context: args,
      instructions: [
        '1. Calculate heater power per zone',
        '2. Size heater elements',
        '3. Design heater circuits',
        '4. Select thermostats',
        '5. Design heater control',
        '6. Calculate total power',
        '7. Verify power budget',
        '8. Document heater design',
        '9. Create wiring diagrams',
        '10. Generate parts list'
      ],
      outputFormat: 'JSON object with heater sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPower', 'zones'],
      properties: {
        totalPower: { type: 'number' },
        zones: { type: 'array', items: { type: 'object' } },
        circuits: { type: 'object' },
        control: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'heaters', 'aerospace']
}));

export const thermalBalanceTask = defineTask('thermal-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Balance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Verification Engineer',
      task: 'Verify thermal balance',
      context: args,
      instructions: [
        '1. Calculate energy balance',
        '2. Verify heat rejection',
        '3. Verify heater adequacy',
        '4. Check margin compliance',
        '5. Verify design robustness',
        '6. Plan thermal vacuum test',
        '7. Define test predictions',
        '8. Document verification',
        '9. Identify open items',
        '10. Provide certification evidence'
      ],
      outputFormat: 'JSON object with thermal balance verification'
    },
    outputSchema: {
      type: 'object',
      required: ['balanced', 'verification'],
      properties: {
        balanced: { type: 'boolean' },
        verification: { type: 'object' },
        testPredictions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'verification', 'aerospace']
}));

export const thermalReportTask = defineTask('thermal-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Report Engineer',
      task: 'Generate thermal analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document requirements',
        '3. Present environment',
        '4. Document thermal model',
        '5. Present analysis results',
        '6. Document TCS design',
        '7. Present heater design',
        '8. Document verification',
        '9. Provide conclusions',
        '10. Generate JSON and markdown'
      ],
      outputFormat: 'JSON object with thermal report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['thermal', 'reporting', 'aerospace']
}));
