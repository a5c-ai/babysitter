/**
 * @process specializations/domains/business/operations/value-stream-mapping
 * @description Value Stream Mapping Process - Map current state material and information flows, identify waste and improvement
 * opportunities, design future state value streams with implementation roadmap for lean manufacturing and service operations.
 * @inputs { processName: string, scope?: string, teamMembers?: array, includeMetrics?: boolean, targetLeadTime?: number }
 * @outputs { success: boolean, currentStateMap: object, futureStateMap: object, wasteIdentified: array, improvementRoadmap: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/value-stream-mapping', {
 *   processName: 'Order-to-Cash',
 *   scope: 'end-to-end',
 *   teamMembers: ['operations-manager', 'process-engineer', 'quality-lead'],
 *   includeMetrics: true,
 *   targetLeadTime: 5
 * });
 *
 * @references
 * - Rother, M. & Shook, J. (2003). Learning to See: Value Stream Mapping
 * - Womack, J.P. & Jones, D.T. (2003). Lean Thinking
 * - Martin, K. & Osterling, M. (2014). Value Stream Mapping
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    scope = 'end-to-end',
    teamMembers = [],
    includeMetrics = true,
    targetLeadTime = null,
    productFamily = null,
    customerDemand = null,
    taktTime = null,
    outputDir = 'vsm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Value Stream Mapping for process: ${processName}`);

  // Phase 1: Preparation and Scoping
  ctx.log('info', 'Phase 1: VSM Preparation and Scoping');
  const preparation = await ctx.task(vsmPreparationTask, {
    processName,
    scope,
    teamMembers,
    productFamily,
    customerDemand,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // Quality Gate: Scope definition
  await ctx.breakpoint({
    question: `VSM scope defined for ${processName}. Product family: ${preparation.productFamily}. Boundaries: ${preparation.boundaries.start} to ${preparation.boundaries.end}. Proceed with current state mapping?`,
    title: 'VSM Scope Review',
    context: {
      runId: ctx.runId,
      processName,
      scope: preparation.scope,
      boundaries: preparation.boundaries,
      customerDemand: preparation.customerDemand,
      files: preparation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Current State Data Collection
  ctx.log('info', 'Phase 2: Collecting Current State Data');
  const dataCollection = await ctx.task(currentStateDataCollectionTask, {
    processName,
    preparation,
    includeMetrics,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Phase 3: Current State Mapping
  ctx.log('info', 'Phase 3: Creating Current State Map');
  const currentStateMap = await ctx.task(currentStateMappingTask, {
    processName,
    dataCollection,
    taktTime: taktTime || preparation.taktTime,
    outputDir
  });

  artifacts.push(...currentStateMap.artifacts);

  // Phase 4: Waste Identification (8 Wastes Analysis)
  ctx.log('info', 'Phase 4: Identifying Waste and Non-Value-Added Activities');
  const wasteAnalysis = await ctx.task(wasteIdentificationTask, {
    processName,
    currentStateMap,
    outputDir
  });

  artifacts.push(...wasteAnalysis.artifacts);

  // Quality Gate: Current State Review
  await ctx.breakpoint({
    question: `Current state map complete. Total lead time: ${currentStateMap.totalLeadTime} days. Value-added time: ${currentStateMap.valueAddedTime} hours. ${wasteAnalysis.totalWasteItems} waste items identified. Review before designing future state?`,
    title: 'Current State Map Review',
    context: {
      runId: ctx.runId,
      processName,
      metrics: {
        totalLeadTime: currentStateMap.totalLeadTime,
        valueAddedTime: currentStateMap.valueAddedTime,
        processEfficiency: currentStateMap.processEfficiency,
        wasteCount: wasteAnalysis.totalWasteItems
      },
      wasteByCategory: wasteAnalysis.wasteByCategory,
      files: [...currentStateMap.artifacts, ...wasteAnalysis.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Future State Design
  ctx.log('info', 'Phase 5: Designing Future State Value Stream');
  const futureStateDesign = await ctx.task(futureStateDesignTask, {
    processName,
    currentStateMap,
    wasteAnalysis,
    targetLeadTime,
    taktTime: taktTime || preparation.taktTime,
    outputDir
  });

  artifacts.push(...futureStateDesign.artifacts);

  // Phase 6: Gap Analysis
  ctx.log('info', 'Phase 6: Performing Gap Analysis');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    processName,
    currentStateMap,
    futureStateDesign,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Phase 7: Implementation Roadmap
  ctx.log('info', 'Phase 7: Creating Implementation Roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    processName,
    gapAnalysis,
    futureStateDesign,
    wasteAnalysis,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Quality Gate: Future State and Roadmap Review
  await ctx.breakpoint({
    question: `Future state designed. Target lead time: ${futureStateDesign.targetLeadTime} days (${futureStateDesign.leadTimeReduction}% reduction). ${implementationRoadmap.totalInitiatives} improvement initiatives identified across ${implementationRoadmap.phases.length} phases. Approve implementation roadmap?`,
    title: 'Future State and Roadmap Approval',
    context: {
      runId: ctx.runId,
      processName,
      improvements: {
        leadTimeReduction: futureStateDesign.leadTimeReduction,
        processEfficiencyGain: futureStateDesign.processEfficiencyGain,
        expectedBenefits: futureStateDesign.expectedBenefits
      },
      roadmap: {
        totalInitiatives: implementationRoadmap.totalInitiatives,
        phases: implementationRoadmap.phases.map(p => ({ name: p.name, duration: p.duration, initiatives: p.initiatives.length }))
      },
      files: [...futureStateDesign.artifacts, ...implementationRoadmap.artifacts].map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Phase 8: VSM Report Generation
  ctx.log('info', 'Phase 8: Generating VSM Report');
  const vsmReport = await ctx.task(vsmReportGenerationTask, {
    processName,
    preparation,
    currentStateMap,
    wasteAnalysis,
    futureStateDesign,
    gapAnalysis,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...vsmReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    scope,
    currentStateMap: {
      totalLeadTime: currentStateMap.totalLeadTime,
      valueAddedTime: currentStateMap.valueAddedTime,
      processEfficiency: currentStateMap.processEfficiency,
      processSteps: currentStateMap.processSteps.length,
      inventoryPoints: currentStateMap.inventoryPoints
    },
    futureStateMap: {
      targetLeadTime: futureStateDesign.targetLeadTime,
      targetValueAddedTime: futureStateDesign.targetValueAddedTime,
      targetEfficiency: futureStateDesign.targetEfficiency,
      leanConcepts: futureStateDesign.leanConcepts
    },
    wasteIdentified: wasteAnalysis.wasteItems,
    improvements: {
      leadTimeReduction: futureStateDesign.leadTimeReduction,
      processEfficiencyGain: futureStateDesign.processEfficiencyGain,
      expectedAnnualSavings: futureStateDesign.expectedAnnualSavings
    },
    implementationRoadmap: implementationRoadmap.phases,
    gapAnalysis: gapAnalysis.gaps,
    artifacts,
    reportPath: vsmReport.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/value-stream-mapping',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: VSM Preparation
export const vsmPreparationTask = defineTask('vsm-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `VSM Preparation - ${args.processName}`,
  agent: {
    name: 'lean-consultant',
    prompt: {
      role: 'Lean Manufacturing Consultant',
      task: 'Prepare for value stream mapping exercise',
      context: args,
      instructions: [
        '1. Define VSM scope and boundaries (start and end points)',
        '2. Identify product family to map (80/20 analysis)',
        '3. Gather customer demand data and calculate takt time',
        '4. Identify team members and assign roles',
        '5. Collect necessary documentation (process specs, layouts)',
        '6. Define mapping icons and conventions to use',
        '7. Schedule gemba walks for data collection',
        '8. Prepare data collection templates',
        '9. Identify stakeholders for review sessions',
        '10. Document preparation checklist'
      ],
      outputFormat: 'JSON with preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'boundaries', 'productFamily', 'taktTime', 'artifacts'],
      properties: {
        scope: { type: 'string' },
        boundaries: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        },
        productFamily: { type: 'string' },
        customerDemand: { type: 'number', description: 'Units per day' },
        taktTime: { type: 'number', description: 'Seconds per unit' },
        teamRoles: { type: 'array', items: { type: 'object' } },
        dataCollectionPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'preparation']
}));

// Task 2: Current State Data Collection
export const currentStateDataCollectionTask = defineTask('current-state-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Data Collection - ${args.processName}`,
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'Process Analyst',
      task: 'Collect data for current state value stream map through gemba walks',
      context: args,
      instructions: [
        '1. Walk the process from end to beginning (customer to supplier)',
        '2. Record each process step and its attributes',
        '3. Measure cycle times at each operation',
        '4. Count inventory levels between processes',
        '5. Document changeover times',
        '6. Record batch sizes and transfer quantities',
        '7. Note number of operators at each station',
        '8. Identify information flows (schedules, orders)',
        '9. Document material flow paths',
        '10. Calculate lead times for each segment'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['processSteps', 'inventoryData', 'informationFlows', 'artifacts'],
      properties: {
        processSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              cycleTime: { type: 'number' },
              changeoverTime: { type: 'number' },
              uptime: { type: 'number' },
              operators: { type: 'number' },
              batchSize: { type: 'number' }
            }
          }
        },
        inventoryData: { type: 'array', items: { type: 'object' } },
        informationFlows: { type: 'array', items: { type: 'object' } },
        materialFlows: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'data-collection']
}));

// Task 3: Current State Mapping
export const currentStateMappingTask = defineTask('current-state-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Mapping - ${args.processName}`,
  agent: {
    name: 'vsm-mapper',
    prompt: {
      role: 'Value Stream Mapping Expert',
      task: 'Create current state value stream map with metrics',
      context: args,
      instructions: [
        '1. Draw material flow from supplier to customer',
        '2. Add process boxes with data boxes for each operation',
        '3. Draw inventory triangles between processes',
        '4. Add information flow (production control, schedules)',
        '5. Include supplier and customer icons',
        '6. Draw push/pull arrows as appropriate',
        '7. Create timeline showing lead time and value-added time',
        '8. Calculate total lead time',
        '9. Calculate total value-added time',
        '10. Calculate process efficiency (VA time / Lead time)'
      ],
      outputFormat: 'JSON with current state map details'
    },
    outputSchema: {
      type: 'object',
      required: ['processSteps', 'totalLeadTime', 'valueAddedTime', 'processEfficiency', 'artifacts'],
      properties: {
        processSteps: { type: 'array', items: { type: 'object' } },
        totalLeadTime: { type: 'number', description: 'Days' },
        valueAddedTime: { type: 'number', description: 'Hours' },
        processEfficiency: { type: 'number', description: 'Percentage' },
        inventoryPoints: { type: 'number' },
        totalInventoryDays: { type: 'number' },
        informationFlowType: { type: 'string' },
        mapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'current-state']
}));

// Task 4: Waste Identification
export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Waste Identification - ${args.processName}`,
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'Lean Six Sigma Black Belt',
      task: 'Identify 8 wastes (TIMWOODS) in current state value stream',
      context: args,
      instructions: [
        '1. Transportation - unnecessary movement of materials',
        '2. Inventory - excess raw materials, WIP, finished goods',
        '3. Motion - unnecessary movement of people',
        '4. Waiting - idle time, delays, queues',
        '5. Overproduction - producing more than needed',
        '6. Overprocessing - doing more than customer requires',
        '7. Defects - rework, scrap, returns',
        '8. Skills underutilization - not using people capabilities',
        '9. Identify kaizen bursts (improvement opportunities)',
        '10. Prioritize waste elimination opportunities'
      ],
      outputFormat: 'JSON with waste analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['wasteItems', 'wasteByCategory', 'totalWasteItems', 'kaizenBursts', 'artifacts'],
      properties: {
        wasteItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              estimatedCost: { type: 'number' }
            }
          }
        },
        wasteByCategory: { type: 'object' },
        totalWasteItems: { type: 'number' },
        kaizenBursts: { type: 'array', items: { type: 'object' } },
        prioritizedOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'waste-analysis']
}));

// Task 5: Future State Design
export const futureStateDesignTask = defineTask('future-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Future State Design - ${args.processName}`,
  agent: {
    name: 'lean-architect',
    prompt: {
      role: 'Lean Systems Architect',
      task: 'Design future state value stream applying lean principles',
      context: args,
      instructions: [
        '1. Produce to takt time at pacemaker process',
        '2. Develop continuous flow where possible',
        '3. Use supermarkets and pull systems where flow not possible',
        '4. Send customer schedule to one point (pacemaker)',
        '5. Level the production mix (heijunka)',
        '6. Level the production volume (pitch)',
        '7. Develop ability to make every part every day (EPE)',
        '8. Design FIFO lanes between processes',
        '9. Calculate target lead time and process efficiency',
        '10. Identify required capabilities and investments'
      ],
      outputFormat: 'JSON with future state design'
    },
    outputSchema: {
      type: 'object',
      required: ['targetLeadTime', 'targetEfficiency', 'leanConcepts', 'leadTimeReduction', 'artifacts'],
      properties: {
        targetLeadTime: { type: 'number', description: 'Days' },
        targetValueAddedTime: { type: 'number', description: 'Hours' },
        targetEfficiency: { type: 'number', description: 'Percentage' },
        leadTimeReduction: { type: 'number', description: 'Percentage reduction' },
        processEfficiencyGain: { type: 'number', description: 'Percentage improvement' },
        leanConcepts: { type: 'array', items: { type: 'string' } },
        pacemakerProcess: { type: 'string' },
        pullSystems: { type: 'array', items: { type: 'object' } },
        expectedBenefits: { type: 'array', items: { type: 'string' } },
        expectedAnnualSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'future-state']
}));

// Task 6: Gap Analysis
export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gap Analysis - ${args.processName}`,
  agent: {
    name: 'improvement-analyst',
    prompt: {
      role: 'Continuous Improvement Manager',
      task: 'Analyze gaps between current and future state',
      context: args,
      instructions: [
        '1. Compare current vs future state metrics',
        '2. Identify process changes required',
        '3. Identify equipment/technology needs',
        '4. Identify skills and training requirements',
        '5. Identify organizational changes needed',
        '6. Assess resource requirements',
        '7. Estimate implementation costs',
        '8. Identify risks and mitigation strategies',
        '9. Prioritize gaps by impact and feasibility',
        '10. Document gap closure requirements'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'totalGaps', 'prioritizedGaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentState: { type: 'string' },
              futureState: { type: 'string' },
              gapDescription: { type: 'string' },
              closureActions: { type: 'array', items: { type: 'string' } },
              estimatedCost: { type: 'number' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        totalGaps: { type: 'number' },
        prioritizedGaps: { type: 'array', items: { type: 'string' } },
        totalEstimatedCost: { type: 'number' },
        riskAssessment: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'gap-analysis']
}));

// Task 7: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Roadmap - ${args.processName}`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Lean Transformation Program Manager',
      task: 'Create implementation roadmap for future state',
      context: args,
      instructions: [
        '1. Group improvements into implementation loops',
        '2. Define phased approach (quick wins, medium-term, long-term)',
        '3. Create project charters for each initiative',
        '4. Assign responsibilities and resources',
        '5. Define milestones and success criteria',
        '6. Create timeline with dependencies',
        '7. Establish governance and review cadence',
        '8. Define metrics for tracking progress',
        '9. Plan communication and change management',
        '10. Document complete implementation plan'
      ],
      outputFormat: 'JSON with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalInitiatives', 'timeline', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'string' },
              initiatives: { type: 'array', items: { type: 'object' } },
              milestones: { type: 'array', items: { type: 'object' } },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalInitiatives: { type: 'number' },
        timeline: { type: 'string' },
        quickWins: { type: 'array', items: { type: 'string' } },
        governance: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'implementation']
}));

// Task 8: VSM Report Generation
export const vsmReportGenerationTask = defineTask('vsm-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `VSM Report Generation - ${args.processName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive VSM report',
      context: args,
      instructions: [
        '1. Write executive summary with key findings',
        '2. Document VSM methodology and approach',
        '3. Include current state map and metrics',
        '4. Present waste analysis findings',
        '5. Include future state map and targets',
        '6. Document gap analysis results',
        '7. Present implementation roadmap',
        '8. Include cost-benefit analysis',
        '9. Add appendices with supporting data',
        '10. Format as professional report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'vsm', 'reporting']
}));
