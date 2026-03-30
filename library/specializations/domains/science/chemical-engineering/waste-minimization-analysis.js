/**
 * @process chemical-engineering/waste-minimization-analysis
 * @description Identify opportunities for waste reduction, recycling, and process modification to minimize environmental impact
 * @inputs { processName: string, wasteStreams: array, processData: object, regulatoryRequirements: object, outputDir: string }
 * @outputs { success: boolean, wasteInventory: object, minimizationPlan: object, economicAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    wasteStreams,
    processData,
    regulatoryRequirements = {},
    economicData = {},
    outputDir = 'waste-minimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Characterize Waste Streams
  ctx.log('info', 'Starting waste minimization: Characterizing waste streams');
  const characterizationResult = await ctx.task(wasteCharacterizationTask, {
    processName,
    wasteStreams,
    processData,
    outputDir
  });

  if (!characterizationResult.success) {
    return {
      success: false,
      error: 'Waste characterization failed',
      details: characterizationResult,
      metadata: { processId: 'chemical-engineering/waste-minimization-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...characterizationResult.artifacts);

  // Task 2: Apply Waste Minimization Hierarchy
  ctx.log('info', 'Applying waste minimization hierarchy');
  const hierarchyResult = await ctx.task(wasteHierarchyAnalysisTask, {
    processName,
    wasteInventory: characterizationResult.inventory,
    processData,
    outputDir
  });

  artifacts.push(...hierarchyResult.artifacts);

  // Task 3: Identify Source Reduction Opportunities
  ctx.log('info', 'Identifying source reduction opportunities');
  const sourceReductionResult = await ctx.task(sourceReductionTask, {
    processName,
    wasteInventory: characterizationResult.inventory,
    processData,
    outputDir
  });

  artifacts.push(...sourceReductionResult.artifacts);

  // Task 4: Evaluate Recycling and Recovery Options
  ctx.log('info', 'Evaluating recycling and recovery options');
  const recyclingResult = await ctx.task(recyclingRecoveryTask, {
    processName,
    wasteInventory: characterizationResult.inventory,
    sourceReduction: sourceReductionResult.opportunities,
    outputDir
  });

  artifacts.push(...recyclingResult.artifacts);

  // Task 5: Assess Treatment Requirements
  ctx.log('info', 'Assessing treatment requirements');
  const treatmentResult = await ctx.task(treatmentAssessmentTask, {
    processName,
    remainingWaste: recyclingResult.remainingWaste,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...treatmentResult.artifacts);

  // Breakpoint: Review waste minimization analysis
  await ctx.breakpoint({
    question: `Waste minimization analysis complete for ${processName}. Waste streams: ${characterizationResult.inventory.streamCount}. Source reduction potential: ${sourceReductionResult.reductionPercentage}%. Recyclable: ${recyclingResult.recyclablePercentage}%. Review analysis?`,
    title: 'Waste Minimization Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        wasteStreams: characterizationResult.inventory.streamCount,
        totalWaste: characterizationResult.inventory.totalMass,
        sourceReductionPotential: sourceReductionResult.reductionPercentage,
        recyclablePotential: recyclingResult.recyclablePercentage
      }
    }
  });

  // Task 6: Perform Economic Analysis
  ctx.log('info', 'Performing economic analysis');
  const economicResult = await ctx.task(economicAnalysisTask, {
    processName,
    sourceReduction: sourceReductionResult.opportunities,
    recycling: recyclingResult.options,
    treatment: treatmentResult.requirements,
    economicData,
    outputDir
  });

  artifacts.push(...economicResult.artifacts);

  // Task 7: Review Regulatory Compliance
  ctx.log('info', 'Reviewing regulatory compliance');
  const complianceResult = await ctx.task(complianceReviewTask, {
    processName,
    wasteInventory: characterizationResult.inventory,
    minimizationPlan: {
      sourceReduction: sourceReductionResult.opportunities,
      recycling: recyclingResult.options,
      treatment: treatmentResult.requirements
    },
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);

  // Task 8: Develop Implementation Plan
  ctx.log('info', 'Developing implementation plan');
  const implementationResult = await ctx.task(implementationPlanTask, {
    processName,
    sourceReduction: sourceReductionResult.opportunities,
    recycling: recyclingResult.options,
    treatment: treatmentResult.requirements,
    economics: economicResult.analysis,
    outputDir
  });

  artifacts.push(...implementationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    wasteInventory: characterizationResult.inventory,
    minimizationPlan: {
      sourceReduction: sourceReductionResult.opportunities,
      recycling: recyclingResult.options,
      treatment: treatmentResult.requirements
    },
    economicAnalysis: economicResult.analysis,
    compliance: complianceResult,
    implementationPlan: implementationResult.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/waste-minimization-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Waste Characterization
export const wasteCharacterizationTask = defineTask('waste-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize waste streams',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'waste characterization analyst',
      task: 'Characterize all waste streams from the process',
      context: args,
      instructions: [
        'Inventory all waste streams',
        'Characterize composition of each stream',
        'Determine physical state (solid, liquid, gas)',
        'Measure/estimate flow rates and quantities',
        'Classify hazardous vs. non-hazardous',
        'Identify waste codes (RCRA, etc.)',
        'Determine current disposal methods',
        'Create waste stream inventory'
      ],
      outputFormat: 'JSON with waste inventory, characterization, classification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'inventory', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        inventory: {
          type: 'object',
          properties: {
            streamCount: { type: 'number' },
            totalMass: { type: 'number' },
            streams: { type: 'array' },
            hazardousCount: { type: 'number' },
            disposalCosts: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'characterization']
}));

// Task 2: Waste Hierarchy Analysis
export const wasteHierarchyAnalysisTask = defineTask('waste-hierarchy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply waste minimization hierarchy',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'waste hierarchy analyst',
      task: 'Apply pollution prevention hierarchy to waste streams',
      context: args,
      instructions: [
        'Apply hierarchy: Prevention > Reduction > Reuse > Recycle > Recover > Treat > Dispose',
        'Classify each stream by hierarchy level opportunity',
        'Identify prevention opportunities',
        'Identify reduction opportunities',
        'Identify reuse opportunities',
        'Identify recycling opportunities',
        'Prioritize by hierarchy level',
        'Document hierarchy analysis'
      ],
      outputFormat: 'JSON with hierarchy analysis, opportunities by level, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            byHierarchyLevel: { type: 'object' },
            priorities: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'hierarchy']
}));

// Task 3: Source Reduction
export const sourceReductionTask = defineTask('source-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify source reduction opportunities',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'source reduction engineer',
      task: 'Identify opportunities to reduce waste at source',
      context: args,
      instructions: [
        'Analyze process for waste generation points',
        'Identify yield improvement opportunities',
        'Evaluate raw material substitutions',
        'Assess process modifications to reduce waste',
        'Identify solvent substitution options',
        'Evaluate equipment modifications',
        'Quantify reduction potential',
        'Document source reduction opportunities'
      ],
      outputFormat: 'JSON with source reduction opportunities, potential, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'opportunities', 'reductionPercentage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              wasteStream: { type: 'string' },
              reductionPotential: { type: 'number' },
              implementation: { type: 'string' }
            }
          }
        },
        reductionPercentage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'source-reduction']
}));

// Task 4: Recycling and Recovery
export const recyclingRecoveryTask = defineTask('recycling-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate recycling and recovery options',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'recycling and recovery engineer',
      task: 'Evaluate recycling and material recovery options',
      context: args,
      instructions: [
        'Identify streams suitable for on-site recycling',
        'Identify streams for off-site recycling',
        'Evaluate solvent recovery options',
        'Assess catalyst recovery options',
        'Evaluate energy recovery potential',
        'Identify by-product sales opportunities',
        'Calculate remaining waste after recycling',
        'Document recycling options'
      ],
      outputFormat: 'JSON with recycling options, recovery potential, remaining waste, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'options', 'recyclablePercentage', 'remainingWaste', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wasteStream: { type: 'string' },
              method: { type: 'string' },
              recoveryRate: { type: 'number' },
              destination: { type: 'string' }
            }
          }
        },
        recyclablePercentage: { type: 'number' },
        remainingWaste: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'recycling']
}));

// Task 5: Treatment Assessment
export const treatmentAssessmentTask = defineTask('treatment-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess treatment requirements',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'waste treatment engineer',
      task: 'Assess treatment requirements for remaining waste',
      context: args,
      instructions: [
        'Identify treatment requirements for each stream',
        'Evaluate on-site treatment options',
        'Evaluate off-site treatment options',
        'Assess treatment technology options',
        'Determine treatment efficiency requirements',
        'Ensure regulatory compliance',
        'Estimate treatment costs',
        'Document treatment requirements'
      ],
      outputFormat: 'JSON with treatment requirements, technologies, compliance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wasteStream: { type: 'string' },
              treatmentMethod: { type: 'string' },
              location: { type: 'string' },
              efficiency: { type: 'number' }
            }
          }
        },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'treatment']
}));

// Task 6: Economic Analysis
export const economicAnalysisTask = defineTask('economic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform economic analysis',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'waste economics analyst',
      task: 'Perform economic analysis of waste minimization options',
      context: args,
      instructions: [
        'Calculate current waste disposal costs',
        'Estimate costs for each minimization option',
        'Calculate potential savings',
        'Estimate capital requirements',
        'Calculate payback periods',
        'Assess avoided liability costs',
        'Prioritize by economic benefit',
        'Document economic analysis'
      ],
      outputFormat: 'JSON with economic analysis, costs, savings, payback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            currentCosts: { type: 'number' },
            projectedSavings: { type: 'number' },
            capitalRequired: { type: 'number' },
            paybackPeriod: { type: 'number' },
            npv: { type: 'number' }
          }
        },
        byOption: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'economics']
}));

// Task 7: Compliance Review
export const complianceReviewTask = defineTask('compliance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review regulatory compliance',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'environmental compliance engineer',
      task: 'Review regulatory compliance of waste management plan',
      context: args,
      instructions: [
        'Review applicable regulations (RCRA, CWA, CAA)',
        'Verify waste classifications',
        'Check permit requirements',
        'Verify treatment standards',
        'Review manifesting requirements',
        'Check reporting requirements',
        'Identify compliance gaps',
        'Document compliance review'
      ],
      outputFormat: 'JSON with compliance status, gaps, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'complianceStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        complianceStatus: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            gaps: { type: 'array' },
            permits: { type: 'array' },
            reportingRequirements: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'compliance']
}));

// Task 8: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop implementation plan',
  agent: {
    name: 'waste-minimization-specialist',
    prompt: {
      role: 'waste minimization implementation planner',
      task: 'Develop implementation plan for waste minimization',
      context: args,
      instructions: [
        'Prioritize actions by impact and feasibility',
        'Develop implementation timeline',
        'Assign responsibilities',
        'Identify resource requirements',
        'Define milestones and metrics',
        'Plan training requirements',
        'Develop monitoring program',
        'Create implementation plan document'
      ],
      outputFormat: 'JSON with implementation plan, timeline, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            actions: { type: 'array' },
            timeline: { type: 'object' },
            responsibilities: { type: 'object' },
            metrics: { type: 'array' },
            monitoring: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'waste-minimization', 'implementation']
}));
