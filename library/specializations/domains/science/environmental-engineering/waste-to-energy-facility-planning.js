/**
 * @process environmental-engineering/waste-to-energy-facility-planning
 * @description Waste-to-Energy Facility Planning - Evaluation and planning of thermal treatment facilities for
 * energy recovery from solid waste.
 * @inputs { projectName: string, wasteFeedstock: object, facilityCapacity: number, technologyType: string }
 * @outputs { success: boolean, facilityPlan: object, energyRecovery: object, environmentalControls: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/waste-to-energy-facility-planning', {
 *   projectName: 'Regional WTE Facility',
 *   wasteFeedstock: { type: 'MSW', quantity: 1000 }, // tons per day
 *   facilityCapacity: 1000,
 *   technologyType: 'mass-burn'
 * });
 *
 * @references
 * - EPA Waste-to-Energy Guidance
 * - ASME PTC 34 - Waste Combustors
 * - European WTE Best Practices
 * - State Air Quality Regulations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    wasteFeedstock = {},
    facilityCapacity,
    technologyType = 'mass-burn',
    siteConditions = {},
    outputDir = 'wte-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting WTE Facility Planning: ${projectName}`);
  ctx.log('info', `Technology: ${technologyType}, Capacity: ${facilityCapacity} TPD`);

  // ============================================================================
  // PHASE 1: WASTE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Waste Feedstock Characterization');

  const wasteCharacterization = await ctx.task(wteWasteCharTask, {
    projectName,
    wasteFeedstock,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...wasteCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: TECHNOLOGY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Technology Evaluation');

  const technologyEvaluation = await ctx.task(wteTechEvalTask, {
    projectName,
    wasteCharacterization,
    technologyType,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...technologyEvaluation.artifacts);

  // ============================================================================
  // PHASE 3: ENERGY RECOVERY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Energy Recovery Design');

  const energyRecovery = await ctx.task(energyRecoveryTask, {
    projectName,
    wasteCharacterization,
    technologyEvaluation,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...energyRecovery.artifacts);

  // Breakpoint: Design Review
  await ctx.breakpoint({
    question: `WTE design complete for ${projectName}. Energy output: ${energyRecovery.grossOutput} MW. Review design?`,
    title: 'WTE Design Review',
    context: {
      runId: ctx.runId,
      technology: technologyEvaluation.selectedTechnology,
      energyOutput: energyRecovery.grossOutput,
      efficiency: energyRecovery.efficiency,
      files: energyRecovery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: ENVIRONMENTAL CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 4: Environmental Controls Design');

  const environmentalControls = await ctx.task(wteEnvironmentalTask, {
    projectName,
    technologyEvaluation,
    wasteCharacterization,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...environmentalControls.artifacts);

  // ============================================================================
  // PHASE 5: RESIDUE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Residue Management Planning');

  const residueManagement = await ctx.task(residueManagementTask, {
    projectName,
    technologyEvaluation,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...residueManagement.artifacts);

  // ============================================================================
  // PHASE 6: ECONOMIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Economic Analysis');

  const economicAnalysis = await ctx.task(wteEconomicTask, {
    projectName,
    technologyEvaluation,
    energyRecovery,
    environmentalControls,
    facilityCapacity,
    outputDir
  });

  artifacts.push(...economicAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: FACILITY PLANNING REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Facility Planning Report');

  const planningReport = await ctx.task(wtePlanningReportTask, {
    projectName,
    wasteCharacterization,
    technologyEvaluation,
    energyRecovery,
    environmentalControls,
    residueManagement,
    economicAnalysis,
    outputDir
  });

  artifacts.push(...planningReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    facilityPlan: {
      technology: technologyEvaluation.selectedTechnology,
      capacity: facilityCapacity,
      configuration: technologyEvaluation.configuration
    },
    energyRecovery: {
      grossOutput: energyRecovery.grossOutput,
      netOutput: energyRecovery.netOutput,
      efficiency: energyRecovery.efficiency,
      energyType: energyRecovery.energyType
    },
    environmentalControls: {
      airPollutionControl: environmentalControls.apcSystem,
      emissionLimits: environmentalControls.emissionLimits
    },
    residueManagement: residueManagement.strategy,
    economicAnalysis: economicAnalysis.summary,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/waste-to-energy-facility-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const wteWasteCharTask = defineTask('wte-waste-char', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Waste Feedstock Characterization',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Waste Analyst',
      task: 'Characterize waste feedstock for WTE facility',
      context: args,
      instructions: [
        '1. Analyze waste composition',
        '2. Determine heating value (HHV, LHV)',
        '3. Analyze moisture content',
        '4. Determine ash content',
        '5. Analyze elemental composition',
        '6. Identify problematic constituents',
        '7. Assess seasonal variations',
        '8. Evaluate waste preprocessing needs',
        '9. Project future waste characteristics',
        '10. Document waste characterization'
      ],
      outputFormat: 'JSON with composition, heating value, variability'
    },
    outputSchema: {
      type: 'object',
      required: ['composition', 'heatingValue', 'variability', 'artifacts'],
      properties: {
        composition: { type: 'object' },
        heatingValue: { type: 'object' },
        moistureContent: { type: 'number' },
        ashContent: { type: 'number' },
        elementalAnalysis: { type: 'object' },
        problematicConstituents: { type: 'array' },
        variability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'waste-characterization']
}));

export const wteTechEvalTask = defineTask('wte-tech-eval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Technology Evaluation',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Technology Specialist',
      task: 'Evaluate and select WTE technology',
      context: args,
      instructions: [
        '1. Evaluate mass-burn technology',
        '2. Evaluate RDF processing',
        '3. Evaluate gasification options',
        '4. Evaluate pyrolysis options',
        '5. Compare technology performance',
        '6. Assess vendor experience',
        '7. Evaluate technology maturity',
        '8. Compare capital and operating costs',
        '9. Select recommended technology',
        '10. Document technology selection'
      ],
      outputFormat: 'JSON with selected technology, configuration, comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechnology', 'configuration', 'comparison', 'artifacts'],
      properties: {
        selectedTechnology: { type: 'string' },
        technologyOptions: { type: 'array' },
        configuration: { type: 'object' },
        comparison: { type: 'object' },
        vendorAnalysis: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'technology']
}));

export const energyRecoveryTask = defineTask('energy-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Energy Recovery Design',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Energy Engineer',
      task: 'Design energy recovery system',
      context: args,
      instructions: [
        '1. Calculate heat input',
        '2. Design boiler system',
        '3. Select turbine-generator',
        '4. Calculate gross power output',
        '5. Estimate parasitic loads',
        '6. Calculate net power output',
        '7. Evaluate combined heat and power',
        '8. Design grid interconnection',
        '9. Optimize energy efficiency',
        '10. Document energy recovery design'
      ],
      outputFormat: 'JSON with gross output, net output, efficiency'
    },
    outputSchema: {
      type: 'object',
      required: ['grossOutput', 'netOutput', 'efficiency', 'energyType', 'artifacts'],
      properties: {
        heatInput: { type: 'object' },
        boilerDesign: { type: 'object' },
        turbineGenerator: { type: 'object' },
        grossOutput: { type: 'string' },
        netOutput: { type: 'string' },
        parasiticLoad: { type: 'object' },
        efficiency: { type: 'string' },
        energyType: { type: 'string' },
        gridInterconnection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'energy']
}));

export const wteEnvironmentalTask = defineTask('wte-environmental', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Environmental Controls Design',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Environmental Engineer',
      task: 'Design environmental control systems',
      context: args,
      instructions: [
        '1. Identify emission limits (MACT, state)',
        '2. Design NOx control system',
        '3. Design acid gas control (SO2, HCl)',
        '4. Design particulate control',
        '5. Design mercury control',
        '6. Design dioxin/furan control',
        '7. Design CEMS requirements',
        '8. Design wastewater treatment',
        '9. Develop ash management plan',
        '10. Document environmental controls'
      ],
      outputFormat: 'JSON with APC system, emission limits, CEMS design'
    },
    outputSchema: {
      type: 'object',
      required: ['apcSystem', 'emissionLimits', 'cemsDesign', 'artifacts'],
      properties: {
        emissionLimits: { type: 'object' },
        apcSystem: { type: 'object' },
        noxControl: { type: 'object' },
        acidGasControl: { type: 'object' },
        particulateControl: { type: 'object' },
        mercuryControl: { type: 'object' },
        cemsDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'environmental']
}));

export const residueManagementTask = defineTask('residue-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Residue Management Planning',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Residue Specialist',
      task: 'Plan residue management strategy',
      context: args,
      instructions: [
        '1. Estimate bottom ash generation',
        '2. Estimate fly ash generation',
        '3. Characterize ash quality',
        '4. Evaluate beneficial use options',
        '5. Plan metals recovery',
        '6. Design ash handling system',
        '7. Plan disposal for non-reusable residues',
        '8. Address regulatory requirements',
        '9. Evaluate ash processing technologies',
        '10. Document residue management plan'
      ],
      outputFormat: 'JSON with strategy, ash quantities, beneficial use'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'ashQuantities', 'beneficialUse', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        bottomAsh: { type: 'object' },
        flyAsh: { type: 'object' },
        ashQuantities: { type: 'object' },
        ashCharacterization: { type: 'object' },
        beneficialUse: { type: 'object' },
        metalsRecovery: { type: 'object' },
        disposalPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'residue']
}));

export const wteEconomicTask = defineTask('wte-economic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Economic Analysis',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Financial Analyst',
      task: 'Conduct economic analysis of WTE facility',
      context: args,
      instructions: [
        '1. Estimate capital costs',
        '2. Estimate operating costs',
        '3. Estimate revenue streams',
        '4. Calculate tipping fee requirements',
        '5. Perform financial pro forma',
        '6. Calculate NPV and IRR',
        '7. Conduct sensitivity analysis',
        '8. Compare to alternative disposal',
        '9. Assess financing options',
        '10. Document economic analysis'
      ],
      outputFormat: 'JSON with summary, capital costs, financial metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'capitalCosts', 'financialMetrics', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        capitalCosts: { type: 'object' },
        operatingCosts: { type: 'object' },
        revenueStreams: { type: 'object' },
        tippingFee: { type: 'object' },
        financialMetrics: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        financingOptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'economics']
}));

export const wtePlanningReportTask = defineTask('wte-planning-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Facility Planning Report',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'WTE Project Planner',
      task: 'Compile facility planning report',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document waste characterization',
        '3. Present technology evaluation',
        '4. Present energy recovery design',
        '5. Present environmental controls',
        '6. Present residue management',
        '7. Present economic analysis',
        '8. Develop implementation schedule',
        '9. Identify permitting requirements',
        '10. Generate planning report'
      ],
      outputFormat: 'JSON with report path, key findings, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        implementationSchedule: { type: 'object' },
        permittingRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wte', 'planning']
}));
