/**
 * @process chemical-engineering/membrane-separation-design
 * @description Design membrane-based separation systems including reverse osmosis, ultrafiltration, and pervaporation
 * @inputs { processName: string, feedSpecification: object, separationType: string, productRequirements: object, outputDir: string }
 * @outputs { success: boolean, membraneSystem: object, operatingProcedures: object, maintenancePlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    feedSpecification,
    separationType,
    productRequirements,
    economicData = {},
    outputDir = 'membrane-separation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Evaluate Membrane Applicability
  ctx.log('info', 'Starting membrane separation design: Evaluating applicability');
  const applicabilityResult = await ctx.task(membraneApplicabilityTask, {
    processName,
    feedSpecification,
    separationType,
    productRequirements,
    outputDir
  });

  if (!applicabilityResult.success) {
    return {
      success: false,
      error: 'Membrane applicability evaluation failed',
      details: applicabilityResult,
      metadata: { processId: 'chemical-engineering/membrane-separation-design', timestamp: startTime }
    };
  }

  artifacts.push(...applicabilityResult.artifacts);

  // Task 2: Select Membrane Type and Material
  ctx.log('info', 'Selecting membrane type and material');
  const membraneSelectionResult = await ctx.task(membraneSelectionTask, {
    processName,
    feedSpecification,
    separationType,
    productRequirements,
    applicabilityAnalysis: applicabilityResult.analysis,
    outputDir
  });

  artifacts.push(...membraneSelectionResult.artifacts);

  // Task 3: Design Module Configuration
  ctx.log('info', 'Designing module configuration');
  const moduleConfigResult = await ctx.task(moduleConfigurationTask, {
    processName,
    membraneSelection: membraneSelectionResult.membrane,
    feedSpecification,
    productRequirements,
    outputDir
  });

  artifacts.push(...moduleConfigResult.artifacts);

  // Task 4: Calculate Membrane Area and Staging
  ctx.log('info', 'Calculating membrane area and staging');
  const areaStagingResult = await ctx.task(areaStagingTask, {
    processName,
    membrane: membraneSelectionResult.membrane,
    moduleConfig: moduleConfigResult.configuration,
    feedSpecification,
    productRequirements,
    outputDir
  });

  artifacts.push(...areaStagingResult.artifacts);

  // Task 5: Specify Operating Conditions and Pretreatment
  ctx.log('info', 'Specifying operating conditions and pretreatment');
  const operatingConditionsResult = await ctx.task(operatingConditionsTask, {
    processName,
    membrane: membraneSelectionResult.membrane,
    systemDesign: areaStagingResult.design,
    feedSpecification,
    outputDir
  });

  artifacts.push(...operatingConditionsResult.artifacts);

  // Breakpoint: Review membrane system design
  await ctx.breakpoint({
    question: `Membrane system design complete for ${processName}. Type: ${membraneSelectionResult.membrane.type}. Area: ${areaStagingResult.design.totalArea} m2. Stages: ${areaStagingResult.design.stages}. Recovery: ${areaStagingResult.design.recovery}%. Review design?`,
    title: 'Membrane Separation Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        membraneType: membraneSelectionResult.membrane.type,
        material: membraneSelectionResult.membrane.material,
        totalArea: areaStagingResult.design.totalArea,
        stages: areaStagingResult.design.stages,
        recovery: areaStagingResult.design.recovery
      }
    }
  });

  // Task 6: Plan Fouling Management
  ctx.log('info', 'Planning membrane fouling management');
  const foulingPlanResult = await ctx.task(foulingManagementTask, {
    processName,
    membrane: membraneSelectionResult.membrane,
    feedSpecification,
    operatingConditions: operatingConditionsResult.conditions,
    outputDir
  });

  artifacts.push(...foulingPlanResult.artifacts);

  // Task 7: Perform Economic Comparison
  ctx.log('info', 'Performing economic comparison with alternatives');
  const economicResult = await ctx.task(economicComparisonTask, {
    processName,
    membraneSystem: {
      membrane: membraneSelectionResult.membrane,
      design: areaStagingResult.design,
      foulingPlan: foulingPlanResult.plan
    },
    economicData,
    outputDir
  });

  artifacts.push(...economicResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    membraneSystem: {
      membrane: membraneSelectionResult.membrane,
      design: areaStagingResult.design,
      moduleConfiguration: moduleConfigResult.configuration
    },
    operatingProcedures: operatingConditionsResult.procedures,
    maintenancePlan: foulingPlanResult.plan,
    economics: economicResult.economics,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/membrane-separation-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Membrane Applicability Evaluation
export const membraneApplicabilityTask = defineTask('membrane-applicability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate membrane applicability for separation',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane separation engineer',
      task: 'Evaluate if membrane separation is appropriate for this application',
      context: args,
      instructions: [
        'Analyze feed composition and properties',
        'Identify components to be separated',
        'Assess molecular weight cutoff requirements',
        'Evaluate driving force availability (pressure, concentration)',
        'Check for membrane-incompatible components',
        'Compare with alternative separation methods',
        'Assess technical feasibility',
        'Document applicability analysis'
      ],
      outputFormat: 'JSON with applicability analysis, feasibility assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            suitable: { type: 'boolean' },
            separationType: { type: 'string' },
            drivingForce: { type: 'string' },
            limitations: { type: 'array' }
          }
        },
        feasibility: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'applicability']
}));

// Task 2: Membrane Selection
export const membraneSelectionTask = defineTask('membrane-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select membrane type and material',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane materials specialist',
      task: 'Select optimal membrane type and material',
      context: args,
      instructions: [
        'Evaluate membrane types (RO, NF, UF, MF, pervaporation, gas separation)',
        'Select membrane material (polymeric, ceramic, composite)',
        'Assess chemical compatibility with feed',
        'Evaluate temperature and pressure limits',
        'Review permeability and selectivity data',
        'Consider fouling resistance',
        'Recommend membrane with specifications',
        'Document selection rationale'
      ],
      outputFormat: 'JSON with membrane selection, specifications, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'membrane', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        membrane: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            material: { type: 'string' },
            mwco: { type: 'number' },
            permeability: { type: 'number' },
            selectivity: { type: 'number' },
            maxPressure: { type: 'number' },
            maxTemperature: { type: 'number' }
          }
        },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'selection']
}));

// Task 3: Module Configuration Design
export const moduleConfigurationTask = defineTask('module-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design module configuration',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane module engineer',
      task: 'Design membrane module configuration',
      context: args,
      instructions: [
        'Select module type (spiral wound, hollow fiber, plate and frame, tubular)',
        'Determine module dimensions and area per module',
        'Design feed/permeate/retentate flow patterns',
        'Specify spacer and support structures',
        'Design header and manifold systems',
        'Consider cleanability requirements',
        'Specify module housing and connections',
        'Document module design'
      ],
      outputFormat: 'JSON with module configuration, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'configuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            moduleType: { type: 'string' },
            areaPerModule: { type: 'number' },
            dimensions: { type: 'object' },
            flowPattern: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'module-design']
}));

// Task 4: Area and Staging Calculations
export const areaStagingTask = defineTask('area-staging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate membrane area and staging',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane process engineer',
      task: 'Calculate required membrane area and design staging',
      context: args,
      instructions: [
        'Calculate permeate flux at design conditions',
        'Determine required membrane area',
        'Design staging (single stage, multi-stage, tapered)',
        'Calculate recovery and rejection',
        'Size feed pumps and energy recovery devices',
        'Optimize number of modules per stage',
        'Consider concentration polarization effects',
        'Document design calculations'
      ],
      outputFormat: 'JSON with system design, area, staging, recovery, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            totalArea: { type: 'number' },
            stages: { type: 'number' },
            modulesPerStage: { type: 'array' },
            recovery: { type: 'number' },
            rejection: { type: 'number' },
            pumpPower: { type: 'number' }
          }
        },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'area-staging']
}));

// Task 5: Operating Conditions and Pretreatment
export const operatingConditionsTask = defineTask('operating-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify operating conditions and pretreatment',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane operations engineer',
      task: 'Specify operating conditions and pretreatment requirements',
      context: args,
      instructions: [
        'Specify operating pressure and temperature',
        'Define crossflow velocity requirements',
        'Design pretreatment system (filtration, chemical dosing)',
        'Specify pH and chemical adjustments',
        'Design recirculation loops',
        'Define startup and shutdown procedures',
        'Specify monitoring parameters',
        'Document operating procedures'
      ],
      outputFormat: 'JSON with operating conditions, pretreatment design, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'conditions', 'procedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        conditions: {
          type: 'object',
          properties: {
            pressure: { type: 'number' },
            temperature: { type: 'number' },
            crossflowVelocity: { type: 'number' },
            pH: { type: 'object' }
          }
        },
        pretreatment: { type: 'object' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'operations']
}));

// Task 6: Fouling Management
export const foulingManagementTask = defineTask('fouling-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan membrane fouling management',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'membrane fouling specialist',
      task: 'Develop fouling management and cleaning plan',
      context: args,
      instructions: [
        'Identify potential fouling mechanisms',
        'Design fouling prevention measures',
        'Develop cleaning protocols (CIP procedures)',
        'Specify cleaning chemicals and concentrations',
        'Define cleaning frequency',
        'Plan membrane replacement schedule',
        'Design monitoring for fouling detection',
        'Document fouling management plan'
      ],
      outputFormat: 'JSON with fouling management plan, cleaning procedures, replacement schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            foulingMechanisms: { type: 'array' },
            prevention: { type: 'array' },
            cleaningProcedure: { type: 'object' },
            cleaningFrequency: { type: 'string' },
            replacementSchedule: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'fouling']
}));

// Task 7: Economic Comparison
export const economicComparisonTask = defineTask('economic-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform economic comparison with alternatives',
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'process economics analyst',
      task: 'Perform economic analysis and compare with alternatives',
      context: args,
      instructions: [
        'Calculate capital cost (membranes, modules, pumps, etc.)',
        'Calculate operating cost (energy, chemicals, replacement)',
        'Estimate membrane replacement costs',
        'Calculate total cost of separation per unit product',
        'Compare with alternative technologies (distillation, etc.)',
        'Perform sensitivity analysis',
        'Calculate payback period and NPV',
        'Document economic analysis'
      ],
      outputFormat: 'JSON with economic analysis, comparison, NPV, payback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'economics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        economics: {
          type: 'object',
          properties: {
            capitalCost: { type: 'number' },
            operatingCostAnnual: { type: 'number' },
            costPerUnit: { type: 'number' },
            paybackPeriod: { type: 'number' },
            npv: { type: 'number' }
          }
        },
        comparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'membrane', 'economics']
}));
