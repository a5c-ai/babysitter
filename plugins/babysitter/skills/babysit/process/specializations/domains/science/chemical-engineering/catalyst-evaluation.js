/**
 * @process chemical-engineering/catalyst-evaluation
 * @description Evaluate catalyst options, optimize catalyst loading and operating conditions, and predict catalyst lifetime
 * @inputs { processName: string, reactionSystem: object, candidateCatalysts: array, outputDir: string }
 * @outputs { success: boolean, selectedCatalyst: object, optimizedConditions: object, lifetimePrediction: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    reactionSystem,
    candidateCatalysts,
    performanceTargets = {},
    economicConstraints = {},
    outputDir = 'catalyst-evaluation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Screen Candidate Catalysts
  ctx.log('info', 'Starting catalyst evaluation: Screening candidates');
  const screeningResult = await ctx.task(catalystScreeningTask, {
    processName,
    reactionSystem,
    candidateCatalysts,
    performanceTargets,
    outputDir
  });

  if (!screeningResult.success) {
    return {
      success: false,
      error: 'Catalyst screening failed',
      details: screeningResult,
      metadata: { processId: 'chemical-engineering/catalyst-evaluation', timestamp: startTime }
    };
  }

  artifacts.push(...screeningResult.artifacts);

  // Task 2: Optimize Catalyst Loading and Conditions
  ctx.log('info', 'Optimizing catalyst loading and operating conditions');
  const optimizationResult = await ctx.task(conditionOptimizationTask, {
    processName,
    shortlistedCatalysts: screeningResult.shortlistedCatalysts,
    reactionSystem,
    performanceTargets,
    outputDir
  });

  artifacts.push(...optimizationResult.artifacts);

  // Task 3: Characterize Catalyst Deactivation
  ctx.log('info', 'Characterizing catalyst deactivation mechanisms');
  const deactivationResult = await ctx.task(deactivationCharacterizationTask, {
    processName,
    selectedCatalyst: optimizationResult.bestCatalyst,
    reactionSystem,
    operatingConditions: optimizationResult.optimizedConditions,
    outputDir
  });

  artifacts.push(...deactivationResult.artifacts);

  // Task 4: Develop Catalyst Regeneration Procedures
  ctx.log('info', 'Developing catalyst regeneration procedures');
  const regenerationResult = await ctx.task(regenerationProcedureTask, {
    processName,
    catalyst: optimizationResult.bestCatalyst,
    deactivationMechanisms: deactivationResult.mechanisms,
    outputDir
  });

  artifacts.push(...regenerationResult.artifacts);

  // Task 5: Predict Catalyst Lifetime
  ctx.log('info', 'Predicting catalyst lifetime');
  const lifetimeResult = await ctx.task(lifetimePredictionTask, {
    processName,
    catalyst: optimizationResult.bestCatalyst,
    operatingConditions: optimizationResult.optimizedConditions,
    deactivationModel: deactivationResult.deactivationModel,
    regenerationCapability: regenerationResult.regenerationCapability,
    outputDir
  });

  artifacts.push(...lifetimeResult.artifacts);

  // Breakpoint: Review catalyst evaluation results
  await ctx.breakpoint({
    question: `Catalyst evaluation complete for ${processName}. Selected: ${optimizationResult.bestCatalyst.name}. Predicted lifetime: ${lifetimeResult.predictedLifetime} hours. Activity: ${optimizationResult.bestCatalyst.activity}. Review results?`,
    title: 'Catalyst Evaluation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        selectedCatalyst: optimizationResult.bestCatalyst.name,
        activity: optimizationResult.bestCatalyst.activity,
        selectivity: optimizationResult.bestCatalyst.selectivity,
        predictedLifetime: lifetimeResult.predictedLifetime,
        regenerable: regenerationResult.regenerationCapability.isRegenerable
      }
    }
  });

  // Task 6: Evaluate Catalyst Economics
  ctx.log('info', 'Evaluating catalyst cost and supply chain');
  const economicsResult = await ctx.task(catalystEconomicsTask, {
    processName,
    catalyst: optimizationResult.bestCatalyst,
    lifetimePrediction: lifetimeResult,
    regenerationCapability: regenerationResult.regenerationCapability,
    economicConstraints,
    outputDir
  });

  artifacts.push(...economicsResult.artifacts);

  // Task 7: Develop Catalyst Management Plan
  ctx.log('info', 'Developing catalyst management plan');
  const managementPlanResult = await ctx.task(catalystManagementPlanTask, {
    processName,
    catalyst: optimizationResult.bestCatalyst,
    optimizedConditions: optimizationResult.optimizedConditions,
    lifetimePrediction: lifetimeResult,
    regenerationProcedure: regenerationResult.procedure,
    economics: economicsResult,
    outputDir
  });

  artifacts.push(...managementPlanResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    selectedCatalyst: optimizationResult.bestCatalyst,
    optimizedConditions: optimizationResult.optimizedConditions,
    lifetimePrediction: {
      lifetime: lifetimeResult.predictedLifetime,
      deactivationRate: lifetimeResult.deactivationRate,
      replacementSchedule: lifetimeResult.replacementSchedule
    },
    economics: economicsResult.economics,
    managementPlan: managementPlanResult.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/catalyst-evaluation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Catalyst Screening
export const catalystScreeningTask = defineTask('catalyst-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen candidate catalysts for activity and selectivity',
  skill: { name: 'catalyst-analyzer' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst scientist',
      task: 'Screen candidate catalysts for activity, selectivity, and stability',
      context: args,
      instructions: [
        'Review catalyst candidates and their properties',
        'Define screening criteria (activity, selectivity, stability)',
        'Perform initial activity testing at standard conditions',
        'Measure selectivity to desired products',
        'Assess initial stability/deactivation behavior',
        'Rank catalysts by performance metrics',
        'Shortlist top candidates for optimization',
        'Document screening results and rationale'
      ],
      outputFormat: 'JSON with shortlisted catalysts, rankings, screening data, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'shortlistedCatalysts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        shortlistedCatalysts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              activity: { type: 'number' },
              selectivity: { type: 'number' },
              initialStability: { type: 'string' }
            }
          }
        },
        rankings: { type: 'array' },
        screeningData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'catalyst', 'screening']
}));

// Task 2: Condition Optimization
export const conditionOptimizationTask = defineTask('condition-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize catalyst loading and operating conditions',
  skill: { name: 'catalyst-analyzer' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst optimization engineer',
      task: 'Optimize catalyst loading and operating conditions',
      context: args,
      instructions: [
        'Design optimization experiments (DOE)',
        'Vary temperature, pressure, space velocity',
        'Optimize catalyst loading/concentration',
        'Identify optimal operating window',
        'Balance conversion vs. selectivity',
        'Assess sensitivity to operating conditions',
        'Select best catalyst with optimized conditions',
        'Document optimization results'
      ],
      outputFormat: 'JSON with best catalyst, optimized conditions, sensitivity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'bestCatalyst', 'optimizedConditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        bestCatalyst: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            activity: { type: 'number' },
            selectivity: { type: 'number' },
            loading: { type: 'number' }
          }
        },
        optimizedConditions: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            pressure: { type: 'number' },
            spaceVelocity: { type: 'number' },
            feedRatios: { type: 'object' }
          }
        },
        sensitivityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'catalyst', 'optimization']
}));

// Task 3: Deactivation Characterization
export const deactivationCharacterizationTask = defineTask('deactivation-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize catalyst deactivation mechanisms',
  skill: { name: 'catalyst-analyzer' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst deactivation specialist',
      task: 'Characterize catalyst deactivation mechanisms and kinetics',
      context: args,
      instructions: [
        'Identify potential deactivation mechanisms (coking, sintering, poisoning)',
        'Perform accelerated aging tests',
        'Analyze spent catalyst (BET, XRD, TEM, TPO)',
        'Quantify deactivation kinetics',
        'Develop deactivation rate model',
        'Identify deactivation accelerators in feed',
        'Assess reversible vs. irreversible deactivation',
        'Document deactivation mechanisms'
      ],
      outputFormat: 'JSON with deactivation mechanisms, model, characterization data, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mechanisms', 'deactivationModel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              reversibility: { type: 'string' }
            }
          }
        },
        deactivationModel: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            parameters: { type: 'object' },
            equation: { type: 'string' }
          }
        },
        characterizationData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'catalyst', 'deactivation']
}));

// Task 4: Regeneration Procedure Development
export const regenerationProcedureTask = defineTask('regeneration-procedure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop catalyst regeneration procedures',
  skill: { name: 'catalyst-analyzer' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst regeneration engineer',
      task: 'Develop procedures for catalyst regeneration',
      context: args,
      instructions: [
        'Assess regenerability based on deactivation mechanisms',
        'Design regeneration protocol (oxidation, reduction, etc.)',
        'Determine regeneration conditions (T, P, atmosphere)',
        'Estimate regeneration cycle time',
        'Assess activity recovery after regeneration',
        'Determine maximum regeneration cycles',
        'Design in-situ vs. ex-situ regeneration',
        'Document regeneration procedure'
      ],
      outputFormat: 'JSON with regeneration procedure, capability assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedure', 'regenerationCapability', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedure: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            conditions: { type: 'object' },
            cycleTime: { type: 'number' },
            method: { type: 'string' }
          }
        },
        regenerationCapability: {
          type: 'object',
          properties: {
            isRegenerable: { type: 'boolean' },
            activityRecovery: { type: 'number' },
            maxCycles: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'catalyst', 'regeneration']
}));

// Task 5: Lifetime Prediction
export const lifetimePredictionTask = defineTask('lifetime-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Predict catalyst lifetime and replacement schedule',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst lifetime analyst',
      task: 'Predict catalyst lifetime and develop replacement schedule',
      context: args,
      instructions: [
        'Apply deactivation model to predict activity decline',
        'Define end-of-life criteria',
        'Calculate time to replacement',
        'Factor in regeneration cycles if applicable',
        'Estimate total catalyst lifetime',
        'Develop replacement schedule',
        'Assess uncertainty in lifetime prediction',
        'Create catalyst performance projection curves'
      ],
      outputFormat: 'JSON with lifetime prediction, replacement schedule, projections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'predictedLifetime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        predictedLifetime: { type: 'number' },
        deactivationRate: { type: 'number' },
        endOfLifeCriteria: { type: 'object' },
        replacementSchedule: {
          type: 'object',
          properties: {
            interval: { type: 'number' },
            regenerationCycles: { type: 'number' }
          }
        },
        projectionCurves: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'catalyst', 'lifetime']
}));

// Task 6: Catalyst Economics
export const catalystEconomicsTask = defineTask('catalyst-economics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate catalyst cost and supply chain',
  skill: { name: 'process-economics-estimator' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst economics analyst',
      task: 'Evaluate catalyst costs and supply chain considerations',
      context: args,
      instructions: [
        'Obtain catalyst pricing and supply information',
        'Calculate catalyst cost per unit product',
        'Assess precious metal content and reclamation value',
        'Evaluate supply chain reliability',
        'Calculate total catalyst lifecycle cost',
        'Compare economics of alternatives',
        'Assess inventory requirements',
        'Document economic analysis'
      ],
      outputFormat: 'JSON with economics analysis, lifecycle cost, supply assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'economics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        economics: {
          type: 'object',
          properties: {
            unitPrice: { type: 'number' },
            costPerProduct: { type: 'number' },
            lifecycleCost: { type: 'number' },
            reclamationValue: { type: 'number' }
          }
        },
        supplyChain: {
          type: 'object',
          properties: {
            leadTime: { type: 'number' },
            reliability: { type: 'string' },
            alternativeSuppliers: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'catalyst', 'economics']
}));

// Task 7: Catalyst Management Plan
export const catalystManagementPlanTask = defineTask('catalyst-management-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop catalyst management plan',
  skill: { name: 'catalyst-analyzer' },
  agent: {
    name: 'catalysis-specialist',
    prompt: {
      role: 'catalyst management planner',
      task: 'Develop comprehensive catalyst management plan',
      context: args,
      instructions: [
        'Document catalyst specifications and handling',
        'Define operating procedures for optimal performance',
        'Specify monitoring parameters and frequencies',
        'Document regeneration procedures',
        'Define replacement triggers and procedures',
        'Plan inventory management',
        'Specify disposal/reclamation procedures',
        'Create catalyst management documentation'
      ],
      outputFormat: 'JSON with management plan, procedures, monitoring plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            specifications: { type: 'object' },
            operatingProcedures: { type: 'array' },
            monitoringPlan: { type: 'object' },
            replacementProcedure: { type: 'object' },
            inventoryManagement: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'catalyst', 'management']
}));
