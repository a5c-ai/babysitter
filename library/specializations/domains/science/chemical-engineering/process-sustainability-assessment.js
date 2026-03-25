/**
 * @process chemical-engineering/process-sustainability-assessment
 * @description Evaluate process sustainability using green chemistry metrics, life cycle assessment, and environmental impact analysis
 * @inputs { processName: string, processData: object, functionalUnit: string, systemBoundaries: object, outputDir: string }
 * @outputs { success: boolean, sustainabilityMetrics: object, lcaResults: object, improvementPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    processData,
    functionalUnit,
    systemBoundaries,
    improvementTargets = {},
    outputDir = 'sustainability-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define System Boundaries and Functional Unit
  ctx.log('info', 'Starting sustainability assessment: Defining boundaries');
  const boundaryResult = await ctx.task(boundaryDefinitionTask, {
    processName,
    functionalUnit,
    systemBoundaries,
    outputDir
  });

  if (!boundaryResult.success) {
    return {
      success: false,
      error: 'System boundary definition failed',
      details: boundaryResult,
      metadata: { processId: 'chemical-engineering/process-sustainability-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...boundaryResult.artifacts);

  // Task 2: Calculate Green Chemistry Metrics
  ctx.log('info', 'Calculating green chemistry metrics');
  const greenChemistryResult = await ctx.task(greenChemistryMetricsTask, {
    processName,
    processData,
    functionalUnit: boundaryResult.functionalUnit,
    outputDir
  });

  artifacts.push(...greenChemistryResult.artifacts);

  // Task 3: Perform Life Cycle Assessment
  ctx.log('info', 'Performing life cycle assessment');
  const lcaResult = await ctx.task(lifeCycleAssessmentTask, {
    processName,
    processData,
    systemBoundaries: boundaryResult.boundaries,
    functionalUnit: boundaryResult.functionalUnit,
    outputDir
  });

  artifacts.push(...lcaResult.artifacts);

  // Task 4: Identify Environmental Hotspots
  ctx.log('info', 'Identifying environmental hotspots');
  const hotspotsResult = await ctx.task(environmentalHotspotsTask, {
    processName,
    lcaResults: lcaResult.results,
    greenChemistryMetrics: greenChemistryResult.metrics,
    outputDir
  });

  artifacts.push(...hotspotsResult.artifacts);

  // Breakpoint: Review sustainability assessment
  await ctx.breakpoint({
    question: `Sustainability assessment complete for ${processName}. E-factor: ${greenChemistryResult.metrics.eFactor}. Carbon footprint: ${lcaResult.results.carbonFootprint} kg CO2eq. Hotspots: ${hotspotsResult.hotspots.length}. Review assessment?`,
    title: 'Process Sustainability Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        eFactor: greenChemistryResult.metrics.eFactor,
        atomEconomy: greenChemistryResult.metrics.atomEconomy,
        carbonFootprint: lcaResult.results.carbonFootprint,
        hotspotCount: hotspotsResult.hotspots.length
      }
    }
  });

  // Task 5: Develop Improvement Options
  ctx.log('info', 'Developing improvement options');
  const improvementOptionsResult = await ctx.task(improvementOptionsTask, {
    processName,
    hotspots: hotspotsResult.hotspots,
    greenChemistryMetrics: greenChemistryResult.metrics,
    lcaResults: lcaResult.results,
    improvementTargets,
    outputDir
  });

  artifacts.push(...improvementOptionsResult.artifacts);

  // Task 6: Quantify Sustainability Improvements
  ctx.log('info', 'Quantifying sustainability improvements');
  const quantificationResult = await ctx.task(improvementQuantificationTask, {
    processName,
    improvementOptions: improvementOptionsResult.options,
    baselineMetrics: {
      greenChemistry: greenChemistryResult.metrics,
      lca: lcaResult.results
    },
    outputDir
  });

  artifacts.push(...quantificationResult.artifacts);

  // Task 7: Create Implementation Roadmap
  ctx.log('info', 'Creating implementation roadmap');
  const roadmapResult = await ctx.task(implementationRoadmapTask, {
    processName,
    prioritizedImprovements: quantificationResult.prioritizedImprovements,
    improvementTargets,
    outputDir
  });

  artifacts.push(...roadmapResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    sustainabilityMetrics: {
      greenChemistry: greenChemistryResult.metrics,
      environmentalImpact: lcaResult.results
    },
    lcaResults: lcaResult.results,
    hotspots: hotspotsResult.hotspots,
    improvementPlan: {
      options: quantificationResult.prioritizedImprovements,
      roadmap: roadmapResult.roadmap
    },
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/process-sustainability-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Boundary Definition
export const boundaryDefinitionTask = defineTask('boundary-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system boundaries and functional unit',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'life cycle assessment specialist',
      task: 'Define system boundaries and functional unit for assessment',
      context: args,
      instructions: [
        'Define functional unit clearly (e.g., 1 kg product)',
        'Define system boundaries (cradle-to-gate, gate-to-gate)',
        'Identify included and excluded life cycle stages',
        'Define cut-off criteria',
        'Document allocation procedures',
        'Identify data quality requirements',
        'Document boundary assumptions',
        'Create boundary diagram'
      ],
      outputFormat: 'JSON with boundaries, functional unit, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'boundaries', 'functionalUnit', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        boundaries: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            included: { type: 'array' },
            excluded: { type: 'array' },
            cutOffCriteria: { type: 'object' }
          }
        },
        functionalUnit: { type: 'string' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sustainability', 'boundaries']
}));

// Task 2: Green Chemistry Metrics
export const greenChemistryMetricsTask = defineTask('green-chemistry-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate green chemistry metrics',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'green chemistry specialist',
      task: 'Calculate green chemistry and sustainability metrics',
      context: args,
      instructions: [
        'Calculate E-factor (kg waste/kg product)',
        'Calculate atom economy',
        'Calculate process mass intensity (PMI)',
        'Calculate solvent intensity',
        'Calculate energy intensity',
        'Assess compliance with 12 principles of green chemistry',
        'Benchmark against industry standards',
        'Document metrics calculations'
      ],
      outputFormat: 'JSON with green chemistry metrics, benchmarks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            eFactor: { type: 'number' },
            atomEconomy: { type: 'number' },
            processMassIntensity: { type: 'number' },
            solventIntensity: { type: 'number' },
            energyIntensity: { type: 'number' }
          }
        },
        benchmarks: { type: 'object' },
        greenPrinciples: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sustainability', 'green-chemistry']
}));

// Task 3: Life Cycle Assessment
export const lifeCycleAssessmentTask = defineTask('life-cycle-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform life cycle assessment',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'life cycle assessment analyst',
      task: 'Perform comprehensive life cycle assessment',
      context: args,
      instructions: [
        'Compile life cycle inventory (LCI)',
        'Calculate global warming potential (carbon footprint)',
        'Calculate acidification potential',
        'Calculate eutrophication potential',
        'Calculate water footprint',
        'Calculate cumulative energy demand',
        'Apply impact assessment methodology (e.g., ReCiPe)',
        'Document LCA results'
      ],
      outputFormat: 'JSON with LCA results, impact categories, inventory, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            carbonFootprint: { type: 'number' },
            acidificationPotential: { type: 'number' },
            eutrophicationPotential: { type: 'number' },
            waterFootprint: { type: 'number' },
            energyDemand: { type: 'number' }
          }
        },
        inventory: { type: 'object' },
        methodology: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sustainability', 'lca']
}));

// Task 4: Environmental Hotspots
export const environmentalHotspotsTask = defineTask('environmental-hotspots', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify environmental hotspots',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'environmental hotspot analyst',
      task: 'Identify environmental hotspots for improvement',
      context: args,
      instructions: [
        'Analyze contribution of each process step to impacts',
        'Identify highest impact materials/chemicals',
        'Identify energy-intensive operations',
        'Identify waste-generating steps',
        'Identify water-intensive operations',
        'Rank hotspots by improvement potential',
        'Create hotspot visualization',
        'Document hotspot analysis'
      ],
      outputFormat: 'JSON with hotspots, rankings, contribution analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hotspots', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hotspots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              process: { type: 'string' },
              impactCategory: { type: 'string' },
              contribution: { type: 'number' },
              improvementPotential: { type: 'string' }
            }
          }
        },
        contributionAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sustainability', 'hotspots']
}));

// Task 5: Improvement Options
export const improvementOptionsTask = defineTask('improvement-options', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop improvement options',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'sustainability improvement engineer',
      task: 'Develop options to improve sustainability',
      context: args,
      instructions: [
        'Identify process modifications to reduce waste',
        'Evaluate alternative solvents and reagents',
        'Assess renewable feedstock options',
        'Identify energy efficiency improvements',
        'Evaluate heat integration options',
        'Assess renewable energy integration',
        'Identify water recycling opportunities',
        'Document improvement options'
      ],
      outputFormat: 'JSON with improvement options, expected benefits, feasibility, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'options', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              targetHotspot: { type: 'string' },
              expectedBenefit: { type: 'string' },
              feasibility: { type: 'string' },
              cost: { type: 'string' }
            }
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
  labels: ['agent', 'chemical-engineering', 'sustainability', 'improvements']
}));

// Task 6: Improvement Quantification
export const improvementQuantificationTask = defineTask('improvement-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify sustainability improvements',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'improvement quantification analyst',
      task: 'Quantify potential sustainability improvements',
      context: args,
      instructions: [
        'Calculate improved metrics for each option',
        'Compare to baseline metrics',
        'Calculate percentage improvements',
        'Estimate implementation costs',
        'Calculate ROI for each option',
        'Prioritize by impact and feasibility',
        'Create improvement summary',
        'Document quantification methodology'
      ],
      outputFormat: 'JSON with prioritized improvements, quantified benefits, ROI, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'prioritizedImprovements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        prioritizedImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              priority: { type: 'number' },
              metricsImprovement: { type: 'object' },
              roi: { type: 'number' }
            }
          }
        },
        totalPotentialImprovement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sustainability', 'quantification']
}));

// Task 7: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'sustainability roadmap planner',
      task: 'Create implementation roadmap for improvements',
      context: args,
      instructions: [
        'Sequence improvements logically',
        'Define short-term (quick wins) actions',
        'Define medium-term improvements',
        'Define long-term transformational changes',
        'Assign responsibilities and timelines',
        'Define KPIs for tracking progress',
        'Identify dependencies and prerequisites',
        'Create roadmap visualization'
      ],
      outputFormat: 'JSON with roadmap, timelines, KPIs, responsibilities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'roadmap', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        roadmap: {
          type: 'object',
          properties: {
            shortTerm: { type: 'array' },
            mediumTerm: { type: 'array' },
            longTerm: { type: 'array' },
            kpis: { type: 'array' },
            milestones: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'sustainability', 'roadmap']
}));
