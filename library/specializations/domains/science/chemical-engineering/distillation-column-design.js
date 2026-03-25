/**
 * @process chemical-engineering/distillation-column-design
 * @description Design distillation systems including column sizing, tray/packing selection, and optimization for energy efficiency
 * @inputs { processName: string, feedSpecification: object, productRequirements: object, outputDir: string }
 * @outputs { success: boolean, columnSpecification: object, internalsDesign: object, energyAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    feedSpecification,
    productRequirements,
    vleData = {},
    economicData = {},
    outputDir = 'distillation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Specify Product Purity and Recovery Requirements
  ctx.log('info', 'Starting distillation design: Specifying requirements');
  const requirementsResult = await ctx.task(productRequirementsTask, {
    processName,
    feedSpecification,
    productRequirements,
    outputDir
  });

  if (!requirementsResult.success) {
    return {
      success: false,
      error: 'Product requirements specification failed',
      details: requirementsResult,
      metadata: { processId: 'chemical-engineering/distillation-column-design', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsResult.artifacts);

  // Task 2: Select Column Configuration
  ctx.log('info', 'Selecting column configuration');
  const configurationResult = await ctx.task(columnConfigurationTask, {
    processName,
    feedSpecification,
    requirements: requirementsResult.specifications,
    vleData,
    outputDir
  });

  artifacts.push(...configurationResult.artifacts);

  // Task 3: Determine Minimum Stages and Reflux Ratio
  ctx.log('info', 'Determining minimum stages and reflux');
  const minimumDesignResult = await ctx.task(minimumDesignTask, {
    processName,
    feedSpecification,
    requirements: requirementsResult.specifications,
    vleData,
    configuration: configurationResult.configuration,
    outputDir
  });

  artifacts.push(...minimumDesignResult.artifacts);

  // Task 4: Size Column Diameter and Height
  ctx.log('info', 'Sizing column diameter and height');
  const columnSizingResult = await ctx.task(columnSizingTask, {
    processName,
    feedSpecification,
    requirements: requirementsResult.specifications,
    minimumDesign: minimumDesignResult,
    configuration: configurationResult.configuration,
    outputDir
  });

  artifacts.push(...columnSizingResult.artifacts);

  // Task 5: Select Column Internals
  ctx.log('info', 'Selecting column internals');
  const internalsResult = await ctx.task(internalsSelectionTask, {
    processName,
    columnSizing: columnSizingResult.sizing,
    feedSpecification,
    configuration: configurationResult.configuration,
    outputDir
  });

  artifacts.push(...internalsResult.artifacts);

  // Task 6: Optimize for Energy Efficiency
  ctx.log('info', 'Optimizing for energy efficiency');
  const energyOptimizationResult = await ctx.task(energyOptimizationTask, {
    processName,
    columnDesign: {
      sizing: columnSizingResult.sizing,
      internals: internalsResult.internals,
      minimumDesign: minimumDesignResult
    },
    feedSpecification,
    economicData,
    outputDir
  });

  artifacts.push(...energyOptimizationResult.artifacts);

  // Breakpoint: Review distillation design
  await ctx.breakpoint({
    question: `Distillation design complete for ${processName}. Stages: ${columnSizingResult.sizing.actualStages}. Diameter: ${columnSizingResult.sizing.diameter} m. Reflux ratio: ${energyOptimizationResult.optimizedReflux}. Reboiler duty: ${energyOptimizationResult.reboilerDuty} kW. Review design?`,
    title: 'Distillation Column Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        configuration: configurationResult.configuration.type,
        actualStages: columnSizingResult.sizing.actualStages,
        diameter: columnSizingResult.sizing.diameter,
        internalsType: internalsResult.internals.type,
        refluxRatio: energyOptimizationResult.optimizedReflux,
        reboilerDuty: energyOptimizationResult.reboilerDuty
      }
    }
  });

  // Task 7: Develop Operating Procedures
  ctx.log('info', 'Developing operating procedures for startup');
  const operatingProceduresResult = await ctx.task(operatingProceduresTask, {
    processName,
    columnDesign: {
      sizing: columnSizingResult.sizing,
      internals: internalsResult.internals,
      configuration: configurationResult.configuration
    },
    optimizedConditions: energyOptimizationResult.optimizedConditions,
    outputDir
  });

  artifacts.push(...operatingProceduresResult.artifacts);

  // Task 8: Generate Column Specification Sheet
  ctx.log('info', 'Generating column specification sheet');
  const specificationResult = await ctx.task(columnSpecificationTask, {
    processName,
    sizing: columnSizingResult.sizing,
    internals: internalsResult.internals,
    configuration: configurationResult.configuration,
    energyAnalysis: energyOptimizationResult,
    outputDir
  });

  artifacts.push(...specificationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    columnSpecification: specificationResult.specification,
    internalsDesign: internalsResult.internals,
    energyAnalysis: {
      reboilerDuty: energyOptimizationResult.reboilerDuty,
      condenserDuty: energyOptimizationResult.condenserDuty,
      refluxRatio: energyOptimizationResult.optimizedReflux,
      energySavings: energyOptimizationResult.energySavings
    },
    operatingProcedures: operatingProceduresResult.procedures,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/distillation-column-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Product Requirements Specification
export const productRequirementsTask = defineTask('product-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify product purity and recovery requirements',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'distillation process engineer',
      task: 'Specify product purity and recovery requirements for distillation',
      context: args,
      instructions: [
        'Define distillate product purity specification',
        'Define bottoms product purity specification',
        'Specify key component recoveries',
        'Identify impurity limits',
        'Define product flow rate requirements',
        'Assess product value vs. purity trade-off',
        'Document all product specifications',
        'Create specification summary'
      ],
      outputFormat: 'JSON with product specifications, recoveries, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specifications', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specifications: {
          type: 'object',
          properties: {
            distillatePurity: { type: 'number' },
            bottomsPurity: { type: 'number' },
            keyComponentRecovery: { type: 'number' },
            impurityLimits: { type: 'object' }
          }
        },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'distillation', 'requirements']
}));

// Task 2: Column Configuration Selection
export const columnConfigurationTask = defineTask('column-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select column configuration',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'distillation design engineer',
      task: 'Select appropriate column configuration',
      context: args,
      instructions: [
        'Evaluate simple column for binary or simple separations',
        'Evaluate complex column (side draws, etc.) for multicomponent',
        'Assess divided wall column for difficult separations',
        'Evaluate batch vs. continuous operation',
        'Consider extractive or azeotropic distillation if needed',
        'Assess pressure swing distillation for azeotropes',
        'Recommend configuration with rationale',
        'Document configuration selection'
      ],
      outputFormat: 'JSON with configuration selection, rationale, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'configuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            operatingPressure: { type: 'number' },
            feedLocation: { type: 'string' }
          }
        },
        rationale: { type: 'string' },
        alternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'distillation', 'configuration']
}));

// Task 3: Minimum Design Calculations
export const minimumDesignTask = defineTask('minimum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine minimum stages and reflux ratio',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'separation design engineer',
      task: 'Calculate minimum stages and reflux ratio',
      context: args,
      instructions: [
        'Calculate relative volatility from VLE data',
        'Apply Fenske equation for minimum stages',
        'Apply Underwood equations for minimum reflux',
        'Determine optimal feed stage location',
        'Calculate actual stages using efficiency or Gilliland correlation',
        'Select operating reflux ratio (typically 1.1-1.5 x minimum)',
        'Perform McCabe-Thiele analysis if appropriate',
        'Document all calculations'
      ],
      outputFormat: 'JSON with minimum stages, minimum reflux, actual values, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'minimumStages', 'minimumReflux', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        minimumStages: { type: 'number' },
        minimumReflux: { type: 'number' },
        actualStages: { type: 'number' },
        actualReflux: { type: 'number' },
        feedStage: { type: 'number' },
        relativeVolatility: { type: 'number' },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'distillation', 'minimum-design']
}));

// Task 4: Column Sizing
export const columnSizingTask = defineTask('column-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size column diameter and height',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'column sizing engineer',
      task: 'Size column diameter and height',
      context: args,
      instructions: [
        'Calculate vapor and liquid traffic profiles',
        'Determine column diameter for flooding',
        'Apply design margin (typically 80% of flood)',
        'Calculate column height based on stages and spacing',
        'Size reboiler and condenser',
        'Specify reflux drum and accumulator',
        'Consider column turndown requirements',
        'Document sizing calculations'
      ],
      outputFormat: 'JSON with column sizing, diameter, height, auxiliary equipment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sizing', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sizing: {
          type: 'object',
          properties: {
            diameter: { type: 'number' },
            height: { type: 'number' },
            actualStages: { type: 'number' },
            traySpacing: { type: 'number' },
            floodingFactor: { type: 'number' }
          }
        },
        auxiliaryEquipment: {
          type: 'object',
          properties: {
            reboiler: { type: 'object' },
            condenser: { type: 'object' },
            refluxDrum: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'distillation', 'sizing']
}));

// Task 5: Internals Selection
export const internalsSelectionTask = defineTask('internals-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select column internals (trays or packing)',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'column internals specialist',
      task: 'Select and design column internals',
      context: args,
      instructions: [
        'Evaluate trays vs. packing for application',
        'Select tray type (sieve, valve, bubble cap) if trays',
        'Select packing type (random, structured) if packed',
        'Design tray geometry or packing bed depth',
        'Specify distributors and redistributors',
        'Design liquid collectors if needed',
        'Specify support structures',
        'Document internals selection and design'
      ],
      outputFormat: 'JSON with internals design, selection rationale, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'internals', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        internals: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            subtype: { type: 'string' },
            efficiency: { type: 'number' },
            pressureDrop: { type: 'number' },
            specifications: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'distillation', 'internals']
}));

// Task 6: Energy Optimization
export const energyOptimizationTask = defineTask('energy-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize for energy efficiency',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'distillation energy optimization engineer',
      task: 'Optimize distillation for energy efficiency',
      context: args,
      instructions: [
        'Optimize reflux ratio for energy vs. stages trade-off',
        'Evaluate feed preheat options',
        'Assess heat pump integration potential',
        'Evaluate mechanical vapor recompression',
        'Consider side reboilers/condensers',
        'Assess heat integration with other units',
        'Calculate optimized energy consumption',
        'Document energy optimization analysis'
      ],
      outputFormat: 'JSON with optimized design, energy analysis, savings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'optimizedReflux', 'reboilerDuty', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        optimizedReflux: { type: 'number' },
        reboilerDuty: { type: 'number' },
        condenserDuty: { type: 'number' },
        optimizedConditions: { type: 'object' },
        energySavings: { type: 'number' },
        heatIntegrationOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'distillation', 'energy']
}));

// Task 7: Operating Procedures
export const operatingProceduresTask = defineTask('operating-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop operating procedures for startup',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'distillation operations engineer',
      task: 'Develop startup and operating procedures',
      context: args,
      instructions: [
        'Develop column startup sequence',
        'Specify initial conditions and ramp rates',
        'Define steady-state operating parameters',
        'Develop shutdown procedures',
        'Create troubleshooting guidelines',
        'Define alarm response procedures',
        'Document normal operating ranges',
        'Create operations manual'
      ],
      outputFormat: 'JSON with operating procedures, startup sequence, troubleshooting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedures: {
          type: 'object',
          properties: {
            startup: { type: 'array' },
            shutdown: { type: 'array' },
            normalOperation: { type: 'object' },
            troubleshooting: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'distillation', 'operations']
}));

// Task 8: Column Specification
export const columnSpecificationTask = defineTask('column-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate column specification sheet',
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'equipment specification engineer',
      task: 'Generate comprehensive column specification sheet',
      context: args,
      instructions: [
        'Create column equipment tag',
        'Document design conditions',
        'Specify all dimensions',
        'List internals specifications',
        'Specify materials of construction',
        'Document nozzle schedule',
        'Include process data sheet',
        'Create complete specification package'
      ],
      outputFormat: 'JSON with specification sheet, process data sheet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specification', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specification: {
          type: 'object',
          properties: {
            tag: { type: 'string' },
            designConditions: { type: 'object' },
            dimensions: { type: 'object' },
            internals: { type: 'object' },
            materials: { type: 'object' },
            nozzleSchedule: { type: 'array' }
          }
        },
        specificationSheetPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'distillation', 'specification']
}));
