/**
 * @process business-analysis/value-stream-mapping
 * @description Apply Lean value stream mapping techniques to analyze material and information flow, identify waste (muda), and design optimized future-state value streams for process improvement.
 * @inputs { projectName: string, valueStreamName: string, productFamily: string, stakeholders: array, currentMetrics: object }
 * @outputs { success: boolean, currentStateMap: object, futureStateMap: object, wasteAnalysis: object, improvementRoadmap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    valueStreamName = 'Value Stream',
    productFamily = '',
    stakeholders = [],
    currentMetrics = {},
    outputDir = 'vsm-output',
    leanFramework = 'tps'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Value Stream Mapping for ${valueStreamName}`);

  // ============================================================================
  // PHASE 1: PRODUCT FAMILY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting and analyzing product family');
  const productFamilyAnalysis = await ctx.task(productFamilyAnalysisTask, {
    projectName,
    valueStreamName,
    productFamily,
    stakeholders,
    outputDir
  });

  artifacts.push(...productFamilyAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CURRENT STATE DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Collecting current state data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    projectName,
    valueStreamName,
    productFamily: productFamilyAnalysis.selectedFamily,
    currentMetrics,
    stakeholders,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 3: CURRENT STATE MAP CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating current state value stream map');
  const currentStateMap = await ctx.task(currentStateMapTask, {
    projectName,
    valueStreamName,
    dataCollection,
    productFamilyAnalysis,
    outputDir
  });

  artifacts.push(...currentStateMap.artifacts);

  // ============================================================================
  // PHASE 4: WASTE IDENTIFICATION (MUDA)
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying waste (8 types of muda)');
  const wasteIdentification = await ctx.task(wasteIdentificationTask, {
    projectName,
    valueStreamName,
    currentStateMap: currentStateMap.map,
    dataCollection,
    outputDir
  });

  artifacts.push(...wasteIdentification.artifacts);

  // ============================================================================
  // PHASE 5: VALUE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing value-adding vs non-value-adding activities');
  const valueAnalysis = await ctx.task(valueAnalysisTask, {
    projectName,
    valueStreamName,
    currentStateMap: currentStateMap.map,
    wasteIdentification,
    outputDir
  });

  artifacts.push(...valueAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: FUTURE STATE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing future state value stream');
  const futureStateDesign = await ctx.task(futureStateDesignTask, {
    projectName,
    valueStreamName,
    currentStateMap: currentStateMap.map,
    wasteIdentification,
    valueAnalysis,
    outputDir
  });

  artifacts.push(...futureStateDesign.artifacts);

  // ============================================================================
  // PHASE 7: KAIZEN BURST IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying kaizen improvement opportunities');
  const kaizenIdentification = await ctx.task(kaizenIdentificationTask, {
    projectName,
    valueStreamName,
    currentStateMap: currentStateMap.map,
    futureStateMap: futureStateDesign.map,
    wasteIdentification,
    outputDir
  });

  artifacts.push(...kaizenIdentification.artifacts);

  // Breakpoint: Review value stream maps
  await ctx.breakpoint({
    question: `Value stream mapping complete for ${valueStreamName}. Lead time reduction potential: ${futureStateDesign.metrics?.leadTimeReduction || 'TBD'}. Review and approve?`,
    title: 'Value Stream Map Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        valueStreamName,
        currentLeadTime: currentStateMap.metrics?.totalLeadTime,
        futureLeadTime: futureStateDesign.metrics?.projectedLeadTime,
        wasteIdentified: wasteIdentification.totalWaste?.length || 0,
        kaizenOpportunities: kaizenIdentification.kaizenBursts?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 8: IMPROVEMENT ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating improvement roadmap');
  const improvementRoadmap = await ctx.task(improvementRoadmapTask, {
    projectName,
    valueStreamName,
    kaizenIdentification,
    futureStateDesign,
    stakeholders,
    outputDir
  });

  artifacts.push(...improvementRoadmap.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    valueStreamName,
    currentStateMap: {
      mapPath: currentStateMap.mapPath,
      metrics: currentStateMap.metrics,
      processSteps: currentStateMap.map?.processSteps?.length || 0
    },
    futureStateMap: {
      mapPath: futureStateDesign.mapPath,
      metrics: futureStateDesign.metrics,
      improvements: futureStateDesign.improvements
    },
    wasteAnalysis: {
      totalWasteItems: wasteIdentification.totalWaste?.length || 0,
      wasteByType: wasteIdentification.wasteByType,
      topWasteAreas: wasteIdentification.topWasteAreas
    },
    valueAnalysis: {
      valueAddingPercentage: valueAnalysis.valueAddingPercentage,
      processEfficiency: valueAnalysis.processEfficiency
    },
    kaizenOpportunities: kaizenIdentification.kaizenBursts,
    improvementRoadmap: {
      phases: improvementRoadmap.phases,
      totalDuration: improvementRoadmap.totalDuration,
      expectedBenefits: improvementRoadmap.expectedBenefits
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/value-stream-mapping',
      timestamp: startTime,
      leanFramework,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const productFamilyAnalysisTask = defineTask('product-family-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product family',
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'lean manufacturing specialist with VSM expertise',
      task: 'Select and analyze product family for value stream mapping',
      context: args,
      instructions: [
        'Identify product families based on similar processing steps',
        'Analyze production volumes by product family',
        'Select highest impact family for VSM',
        'Document customer demand patterns (takt time)',
        'Identify key customers and their requirements',
        'Document product routing through processes',
        'Identify shared vs dedicated resources',
        'Calculate demand variability',
        'Document seasonality patterns',
        'Define scope boundaries for VSM'
      ],
      outputFormat: 'JSON with selectedFamily, demandAnalysis, taktTime, customerRequirements, scope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFamily', 'demandAnalysis', 'artifacts'],
      properties: {
        selectedFamily: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            products: { type: 'array', items: { type: 'string' } },
            volume: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        demandAnalysis: {
          type: 'object',
          properties: {
            dailyDemand: { type: 'number' },
            taktTime: { type: 'string' },
            variability: { type: 'string' }
          }
        },
        customerRequirements: { type: 'array', items: { type: 'object' } },
        scope: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'product-family']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect current state data',
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'lean data analyst with gemba expertise',
      task: 'Collect current state data through gemba walks and measurements',
      context: args,
      instructions: [
        'Walk the value stream from door-to-door',
        'Collect cycle time for each process step',
        'Collect changeover time data',
        'Measure uptime/availability for each process',
        'Count inventory at each stage (WIP)',
        'Measure batch sizes and transfer quantities',
        'Document number of operators per station',
        'Measure quality metrics (first pass yield)',
        'Document information flow triggers',
        'Collect lead time components'
      ],
      outputFormat: 'JSON with processData, inventoryData, timeData, qualityData, informationFlow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processData', 'timeData', 'artifacts'],
      properties: {
        processData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              process: { type: 'string' },
              cycleTime: { type: 'string' },
              changeoverTime: { type: 'string' },
              uptime: { type: 'number' },
              operators: { type: 'number' },
              batchSize: { type: 'number' }
            }
          }
        },
        inventoryData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              quantity: { type: 'number' },
              daysOfInventory: { type: 'number' }
            }
          }
        },
        timeData: {
          type: 'object',
          properties: {
            totalLeadTime: { type: 'string' },
            totalProcessTime: { type: 'string' },
            totalWaitTime: { type: 'string' }
          }
        },
        qualityData: { type: 'object' },
        informationFlow: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'data-collection']
}));

export const currentStateMapTask = defineTask('current-state-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create current state map',
  agent: {
    name: 'vsm-practitioner',
    prompt: {
      role: 'certified VSM practitioner',
      task: 'Create current state value stream map using standard VSM icons',
      context: args,
      instructions: [
        'Draw customer and supplier icons',
        'Add process boxes with data boxes below',
        'Include inventory triangles between processes',
        'Draw material flow (push/pull arrows)',
        'Draw information flow lines',
        'Add production control/scheduling',
        'Include shipment and delivery information',
        'Calculate and display timeline (lead time ladder)',
        'Add summary box with key metrics',
        'Use standard VSM iconography'
      ],
      outputFormat: 'JSON with map, mapPath, metrics, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'mapPath', 'metrics', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            processSteps: { type: 'array', items: { type: 'object' } },
            inventoryPoints: { type: 'array', items: { type: 'object' } },
            materialFlow: { type: 'array', items: { type: 'object' } },
            informationFlow: { type: 'array', items: { type: 'object' } }
          }
        },
        mapPath: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            totalLeadTime: { type: 'string' },
            totalProcessTime: { type: 'string' },
            processEfficiency: { type: 'number' },
            totalInventory: { type: 'number' }
          }
        },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'current-state']
}));

export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify waste (muda)',
  agent: {
    name: 'lean-expert',
    prompt: {
      role: 'lean expert with waste elimination expertise',
      task: 'Identify all 8 types of waste (muda) in the value stream',
      context: args,
      instructions: [
        'Identify Transportation waste (unnecessary movement of materials)',
        'Identify Inventory waste (excess inventory/WIP)',
        'Identify Motion waste (unnecessary movement of people)',
        'Identify Waiting waste (idle time, delays)',
        'Identify Overproduction waste (producing more than needed)',
        'Identify Overprocessing waste (unnecessary processing steps)',
        'Identify Defects waste (rework, scrap)',
        'Identify Skills waste (underutilized talent)',
        'Quantify impact of each waste type',
        'Prioritize waste by elimination potential'
      ],
      outputFormat: 'JSON with totalWaste, wasteByType, topWasteAreas, quantification, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalWaste', 'wasteByType', 'artifacts'],
      properties: {
        totalWaste: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              eliminationPotential: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        wasteByType: {
          type: 'object',
          properties: {
            transportation: { type: 'number' },
            inventory: { type: 'number' },
            motion: { type: 'number' },
            waiting: { type: 'number' },
            overproduction: { type: 'number' },
            overprocessing: { type: 'number' },
            defects: { type: 'number' },
            skills: { type: 'number' }
          }
        },
        topWasteAreas: { type: 'array', items: { type: 'string' } },
        quantification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'waste-identification', 'muda']
}));

export const valueAnalysisTask = defineTask('value-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze value-adding activities',
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'lean value analyst',
      task: 'Categorize activities as value-adding, non-value-adding, or necessary non-value-adding',
      context: args,
      instructions: [
        'Categorize each activity: VA (value-adding), NVA (non-value-adding), NNVA (necessary NVA)',
        'Calculate percentage of time in each category',
        'Calculate process cycle efficiency (VA time / Lead time)',
        'Identify activities customer would pay for (VA)',
        'Identify activities required by regulations (NNVA)',
        'Identify pure waste activities (NVA)',
        'Calculate value-add ratio',
        'Create value stream efficiency metrics',
        'Identify quick wins for NVA elimination',
        'Document value analysis findings'
      ],
      outputFormat: 'JSON with valueAddingPercentage, processEfficiency, activityCategories, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valueAddingPercentage', 'processEfficiency', 'artifacts'],
      properties: {
        valueAddingPercentage: { type: 'number' },
        processEfficiency: { type: 'number' },
        activityCategories: {
          type: 'object',
          properties: {
            valueAdding: { type: 'array', items: { type: 'object' } },
            nonValueAdding: { type: 'array', items: { type: 'object' } },
            necessaryNonValueAdding: { type: 'array', items: { type: 'object' } }
          }
        },
        timeBreakdown: {
          type: 'object',
          properties: {
            vaTime: { type: 'string' },
            nvaTime: { type: 'string' },
            nnvaTime: { type: 'string' }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'value-analysis']
}));

export const futureStateDesignTask = defineTask('future-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design future state map',
  agent: {
    name: 'lean-designer',
    prompt: {
      role: 'lean transformation designer',
      task: 'Design optimized future state value stream applying lean principles',
      context: args,
      instructions: [
        'Implement pull system with supermarkets/kanban',
        'Create continuous flow where possible',
        'Implement FIFO lanes for sequential processes',
        'Design pacemaker process',
        'Level the mix (heijunka)',
        'Reduce batch sizes toward single piece flow',
        'Eliminate non-value-adding steps',
        'Implement visual management',
        'Design for right-sized equipment',
        'Calculate projected metrics'
      ],
      outputFormat: 'JSON with map, mapPath, metrics, improvements, leanPrinciples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'mapPath', 'metrics', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            processSteps: { type: 'array', items: { type: 'object' } },
            pullSystems: { type: 'array', items: { type: 'object' } },
            continuousFlow: { type: 'array', items: { type: 'object' } },
            pacemaker: { type: 'object' }
          }
        },
        mapPath: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            projectedLeadTime: { type: 'string' },
            leadTimeReduction: { type: 'string' },
            projectedEfficiency: { type: 'number' },
            inventoryReduction: { type: 'string' }
          }
        },
        improvements: { type: 'array', items: { type: 'object' } },
        leanPrinciples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'future-state']
}));

export const kaizenIdentificationTask = defineTask('kaizen-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify kaizen opportunities',
  agent: {
    name: 'kaizen-facilitator',
    prompt: {
      role: 'kaizen event facilitator',
      task: 'Identify and prioritize kaizen improvement opportunities',
      context: args,
      instructions: [
        'Mark kaizen bursts on future state map',
        'Identify quick kaizen events (1 week or less)',
        'Identify larger kaizen projects',
        'Prioritize by impact and feasibility',
        'Estimate resources for each kaizen',
        'Define scope for each improvement',
        'Identify dependencies between kaizens',
        'Assign preliminary ownership',
        'Estimate timeline for each',
        'Create kaizen portfolio'
      ],
      outputFormat: 'JSON with kaizenBursts, quickKaizens, largerProjects, priorities, portfolio, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kaizenBursts', 'artifacts'],
      properties: {
        kaizenBursts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['quick', 'standard', 'project'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              duration: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        quickKaizens: { type: 'array', items: { type: 'string' } },
        largerProjects: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        portfolio: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'kaizen']
}));

export const improvementRoadmapTask = defineTask('improvement-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create improvement roadmap',
  agent: {
    name: 'lean-program-manager',
    prompt: {
      role: 'lean transformation program manager',
      task: 'Create phased improvement roadmap to achieve future state',
      context: args,
      instructions: [
        'Sequence kaizen events logically',
        'Create phased implementation plan',
        'Define milestones and checkpoints',
        'Allocate resources per phase',
        'Calculate cumulative benefits by phase',
        'Identify risks and mitigation',
        'Define governance and review cadence',
        'Create communication plan',
        'Define success metrics per phase',
        'Document change management approach'
      ],
      outputFormat: 'JSON with phases, totalDuration, expectedBenefits, milestones, risks, governance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalDuration', 'expectedBenefits', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              name: { type: 'string' },
              kaizens: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              resources: { type: 'object' },
              expectedBenefits: { type: 'object' }
            }
          }
        },
        totalDuration: { type: 'string' },
        expectedBenefits: {
          type: 'object',
          properties: {
            leadTimeReduction: { type: 'string' },
            inventoryReduction: { type: 'string' },
            efficiencyGain: { type: 'string' },
            costSavings: { type: 'string' }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'vsm', 'roadmap']
}));
