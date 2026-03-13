/**
 * @process specializations/domains/business/operations/kanban-system
 * @description Kanban System Design Process - Design and implement pull-based production control systems with visual
 * management, WIP limits, and replenishment triggers for lean operations.
 * @inputs { processName: string, scope?: string, wipLimits?: object, replenishmentMethod?: string }
 * @outputs { success: boolean, systemDesign: object, cardDesign: object, wipLimits: object, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/kanban-system', {
 *   processName: 'Assembly Line Kanban',
 *   scope: 'end-to-end production',
 *   wipLimits: { assembly: 5, testing: 3, packaging: 4 },
 *   replenishmentMethod: 'two-bin'
 * });
 *
 * @references
 * - Ohno, T. (1988). Toyota Production System
 * - Smalley, A. (2004). Creating Level Pull
 * - Anderson, D. (2010). Kanban: Successful Evolutionary Change
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    scope = 'production',
    wipLimits = {},
    replenishmentMethod = 'signal-kanban',
    containerType = null,
    lotSize = null,
    outputDir = 'kanban-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Kanban System Design for: ${processName}`);

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Current State Assessment');
  const assessment = await ctx.task(currentStateAssessmentTask, {
    processName,
    scope,
    outputDir
  });

  artifacts.push(...assessment.artifacts);

  // Phase 2: Demand Analysis
  ctx.log('info', 'Phase 2: Demand Analysis and Takt Time Calculation');
  const demandAnalysis = await ctx.task(demandAnalysisTask, {
    processName,
    assessment,
    outputDir
  });

  artifacts.push(...demandAnalysis.artifacts);

  // Quality Gate: Demand Analysis Review
  await ctx.breakpoint({
    question: `Demand analysis complete. Average daily demand: ${demandAnalysis.averageDemand}. Takt time: ${demandAnalysis.taktTime}s. Demand variability: ${demandAnalysis.variability}%. Proceed with kanban sizing?`,
    title: 'Demand Analysis Review',
    context: {
      runId: ctx.runId,
      processName,
      demand: demandAnalysis,
      files: demandAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Kanban Sizing
  ctx.log('info', 'Phase 3: Kanban Sizing and Calculation');
  const kanbanSizing = await ctx.task(kanbanSizingTask, {
    processName,
    demandAnalysis,
    wipLimits,
    lotSize,
    outputDir
  });

  artifacts.push(...kanbanSizing.artifacts);

  // Phase 4: System Design
  ctx.log('info', 'Phase 4: Kanban System Design');
  const systemDesign = await ctx.task(systemDesignTask, {
    processName,
    kanbanSizing,
    replenishmentMethod,
    containerType,
    outputDir
  });

  artifacts.push(...systemDesign.artifacts);

  // Phase 5: Card and Visual Design
  ctx.log('info', 'Phase 5: Kanban Card and Visual Management Design');
  const cardDesign = await ctx.task(cardDesignTask, {
    processName,
    systemDesign,
    outputDir
  });

  artifacts.push(...cardDesign.artifacts);

  // Quality Gate: Design Review
  await ctx.breakpoint({
    question: `Kanban system designed. Total kanban cards: ${kanbanSizing.totalKanbans}. WIP limit: ${kanbanSizing.totalWipLimit}. Supermarket locations: ${systemDesign.supermarkets.length}. Review design before implementation planning?`,
    title: 'Kanban System Design Review',
    context: {
      runId: ctx.runId,
      processName,
      sizing: kanbanSizing,
      design: systemDesign,
      cardDesign: cardDesign.cardInfo,
      files: [...systemDesign.artifacts, ...cardDesign.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Implementation Planning
  ctx.log('info', 'Phase 6: Implementation Planning');
  const implementation = await ctx.task(implementationPlanningTask, {
    processName,
    systemDesign,
    cardDesign,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // Phase 7: Rules and Procedures
  ctx.log('info', 'Phase 7: Kanban Rules and Procedures Documentation');
  const procedures = await ctx.task(proceduresTask, {
    processName,
    systemDesign,
    cardDesign,
    outputDir
  });

  artifacts.push(...procedures.artifacts);

  // Phase 8: Training Plan
  ctx.log('info', 'Phase 8: Training Plan Development');
  const training = await ctx.task(trainingPlanTask, {
    processName,
    procedures,
    outputDir
  });

  artifacts.push(...training.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Generating Kanban System Report');
  const report = await ctx.task(reportTask, {
    processName,
    assessment,
    demandAnalysis,
    kanbanSizing,
    systemDesign,
    cardDesign,
    implementation,
    procedures,
    training,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    scope,
    systemDesign: {
      type: systemDesign.kanbanType,
      supermarkets: systemDesign.supermarkets,
      loops: systemDesign.kanbanLoops,
      pullSignals: systemDesign.pullSignals
    },
    cardDesign: cardDesign.cardInfo,
    wipLimits: kanbanSizing.wipLimitsByProcess,
    kanbanQuantities: kanbanSizing.kanbansByProcess,
    totalKanbans: kanbanSizing.totalKanbans,
    demandMetrics: {
      taktTime: demandAnalysis.taktTime,
      averageDemand: demandAnalysis.averageDemand,
      variability: demandAnalysis.variability
    },
    implementationPlan: implementation.plan,
    procedures: procedures.rules,
    training: training.plan,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/kanban-system',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Current State Assessment
export const currentStateAssessmentTask = defineTask('kanban-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Current State Assessment - ${args.processName}`,
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'Lean Systems Analyst',
      task: 'Assess current state for kanban system implementation',
      context: args,
      instructions: [
        '1. Map current production flow',
        '2. Identify push vs pull processes',
        '3. Document current inventory levels',
        '4. Analyze lead times and cycle times',
        '5. Identify constraint/bottleneck processes',
        '6. Document current scheduling method',
        '7. Assess visual management maturity',
        '8. Identify improvement opportunities',
        '9. Document material handling methods',
        '10. Create current state summary'
      ],
      outputFormat: 'JSON with assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['processFlow', 'inventoryLevels', 'bottleneck', 'artifacts'],
      properties: {
        processFlow: { type: 'object' },
        inventoryLevels: { type: 'object' },
        leadTimes: { type: 'object' },
        bottleneck: { type: 'string' },
        currentSchedulingMethod: { type: 'string' },
        improvementOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'assessment']
}));

// Task 2: Demand Analysis
export const demandAnalysisTask = defineTask('kanban-demand', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Demand Analysis - ${args.processName}`,
  agent: {
    name: 'demand-analyst',
    prompt: {
      role: 'Demand Planning Analyst',
      task: 'Analyze demand patterns and calculate takt time',
      context: args,
      instructions: [
        '1. Collect historical demand data',
        '2. Calculate average daily demand',
        '3. Analyze demand variability and patterns',
        '4. Identify seasonal trends',
        '5. Calculate takt time (available time / demand)',
        '6. Determine buffer requirements',
        '7. Analyze product mix if applicable',
        '8. Identify demand spikes/valleys',
        '9. Calculate heijunka requirements',
        '10. Document demand analysis'
      ],
      outputFormat: 'JSON with demand analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['averageDemand', 'taktTime', 'variability', 'artifacts'],
      properties: {
        averageDemand: { type: 'number' },
        taktTime: { type: 'number', description: 'Seconds per unit' },
        variability: { type: 'number', description: 'Percentage' },
        peakDemand: { type: 'number' },
        seasonalFactors: { type: 'object' },
        bufferRequirements: { type: 'object' },
        productMix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'demand-analysis']
}));

// Task 3: Kanban Sizing
export const kanbanSizingTask = defineTask('kanban-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Sizing - ${args.processName}`,
  agent: {
    name: 'kanban-engineer',
    prompt: {
      role: 'Kanban System Engineer',
      task: 'Calculate kanban quantities and WIP limits',
      context: args,
      instructions: [
        '1. Apply kanban formula: K = (D * L * (1 + S)) / Q',
        '2. Calculate kanbans for each process',
        '3. Determine container/lot sizes',
        '4. Set WIP limits by process',
        '5. Calculate safety stock requirements',
        '6. Determine number of kanban cards',
        '7. Account for lead time variability',
        '8. Consider multiple suppliers/processes',
        '9. Round up for practical quantities',
        '10. Document sizing calculations'
      ],
      outputFormat: 'JSON with kanban sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['kanbansByProcess', 'wipLimitsByProcess', 'totalKanbans', 'totalWipLimit', 'artifacts'],
      properties: {
        kanbansByProcess: { type: 'object' },
        wipLimitsByProcess: { type: 'object' },
        totalKanbans: { type: 'number' },
        totalWipLimit: { type: 'number' },
        containerSizes: { type: 'object' },
        safetyStock: { type: 'object' },
        calculations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'sizing']
}));

// Task 4: System Design
export const systemDesignTask = defineTask('kanban-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban System Design - ${args.processName}`,
  agent: {
    name: 'system-designer',
    prompt: {
      role: 'Lean Systems Designer',
      task: 'Design kanban system architecture',
      context: args,
      instructions: [
        '1. Select kanban type (production, withdrawal, signal)',
        '2. Design supermarket locations',
        '3. Define kanban loops (supplier, production, customer)',
        '4. Design pull signal methods',
        '5. Create material flow diagram',
        '6. Design replenishment triggers',
        '7. Define FIFO lanes where needed',
        '8. Design heijunka box if applicable',
        '9. Define pacemaker process',
        '10. Document system design'
      ],
      outputFormat: 'JSON with system design'
    },
    outputSchema: {
      type: 'object',
      required: ['kanbanType', 'supermarkets', 'kanbanLoops', 'pullSignals', 'artifacts'],
      properties: {
        kanbanType: { type: 'string' },
        supermarkets: { type: 'array', items: { type: 'object' } },
        kanbanLoops: { type: 'array', items: { type: 'object' } },
        pullSignals: { type: 'array', items: { type: 'object' } },
        fifoLanes: { type: 'array', items: { type: 'object' } },
        heijunkaDesign: { type: 'object' },
        pacemakerProcess: { type: 'string' },
        materialFlowDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'system-design']
}));

// Task 5: Card Design
export const cardDesignTask = defineTask('kanban-card-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Card Design - ${args.processName}`,
  agent: {
    name: 'visual-designer',
    prompt: {
      role: 'Visual Management Designer',
      task: 'Design kanban cards and visual management',
      context: args,
      instructions: [
        '1. Design kanban card layout',
        '2. Define card information fields',
        '3. Design color coding system',
        '4. Create card holder/post designs',
        '5. Design kanban board layout',
        '6. Create visual signals (andon, lights)',
        '7. Design container labels',
        '8. Create floor marking standards',
        '9. Design electronic kanban if applicable',
        '10. Document visual management standards'
      ],
      outputFormat: 'JSON with card design'
    },
    outputSchema: {
      type: 'object',
      required: ['cardInfo', 'colorCoding', 'boardDesign', 'artifacts'],
      properties: {
        cardInfo: {
          type: 'object',
          properties: {
            layout: { type: 'string' },
            fields: { type: 'array', items: { type: 'string' } },
            size: { type: 'string' },
            material: { type: 'string' }
          }
        },
        colorCoding: { type: 'object' },
        boardDesign: { type: 'object' },
        visualSignals: { type: 'array', items: { type: 'object' } },
        containerLabels: { type: 'object' },
        floorMarkings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'card-design']
}));

// Task 6: Implementation Planning
export const implementationPlanningTask = defineTask('kanban-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Implementation Planning - ${args.processName}`,
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Kanban Implementation Planner',
      task: 'Create kanban system implementation plan',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create pilot area selection criteria',
        '3. Develop timeline and milestones',
        '4. Identify resource requirements',
        '5. Plan card and board production',
        '6. Define rollout sequence',
        '7. Create success criteria',
        '8. Plan change management',
        '9. Define audit and review schedule',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'phases', 'timeline', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'string' },
        pilotArea: { type: 'string' },
        resources: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        rolloutSequence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'implementation']
}));

// Task 7: Rules and Procedures
export const proceduresTask = defineTask('kanban-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Rules and Procedures - ${args.processName}`,
  agent: {
    name: 'procedures-developer',
    prompt: {
      role: 'Procedures Developer',
      task: 'Document kanban rules and operating procedures',
      context: args,
      instructions: [
        '1. Document six kanban rules',
        '2. Create card handling procedures',
        '3. Define replenishment procedures',
        '4. Create exception handling rules',
        '5. Document card circulation process',
        '6. Define inventory counting procedures',
        '7. Create problem escalation process',
        '8. Document card maintenance procedures',
        '9. Define WIP limit enforcement',
        '10. Create audit checklists'
      ],
      outputFormat: 'JSON with procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'procedures', 'artifacts'],
      properties: {
        rules: { type: 'array', items: { type: 'object' } },
        procedures: { type: 'array', items: { type: 'object' } },
        exceptionHandling: { type: 'object' },
        escalationProcess: { type: 'object' },
        auditChecklists: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'procedures']
}));

// Task 8: Training Plan
export const trainingPlanTask = defineTask('kanban-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Training Plan - ${args.processName}`,
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training Developer',
      task: 'Create kanban system training plan',
      context: args,
      instructions: [
        '1. Identify training audience',
        '2. Define training objectives',
        '3. Create training curriculum',
        '4. Develop training materials',
        '5. Create hands-on exercises',
        '6. Design simulation activities',
        '7. Create assessment criteria',
        '8. Plan train-the-trainer sessions',
        '9. Create job aids and quick references',
        '10. Document training schedule'
      ],
      outputFormat: 'JSON with training plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'curriculum', 'materials', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        curriculum: { type: 'array', items: { type: 'object' } },
        materials: { type: 'array', items: { type: 'string' } },
        audience: { type: 'array', items: { type: 'string' } },
        schedule: { type: 'object' },
        assessmentCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'training']
}));

// Task 9: Report Generation
export const reportTask = defineTask('kanban-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban System Report - ${args.processName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive kanban system design report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document current state assessment',
        '3. Present demand analysis',
        '4. Detail kanban sizing calculations',
        '5. Present system design',
        '6. Include card and visual designs',
        '7. Document implementation plan',
        '8. Include rules and procedures',
        '9. Present training plan',
        '10. Add appendices with templates'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyDesignDecisions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kanban', 'reporting']
}));
