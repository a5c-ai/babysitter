/**
 * @process domains/science/industrial-engineering/smed
 * @description Setup Time Reduction (SMED) - Apply Single Minute Exchange of Die methodology to dramatically reduce
 * changeover times and enable smaller batch production.
 * @inputs { equipmentId: string, changeoverType?: string, currentChangeoverTime?: number }
 * @outputs { success: boolean, analysis: object, improvements: array, newProcedure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/smed', {
 *   equipmentId: 'Injection Molding Press #3',
 *   changeoverType: 'mold-change',
 *   currentChangeoverTime: 120
 * });
 *
 * @references
 * - Shingo, A Revolution in Manufacturing: The SMED System
 * - McIntosh et al., A critical review of SMED
 * - Liker, The Toyota Way
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    equipmentId,
    changeoverType = 'general',
    currentChangeoverTime = null,
    targetReduction = 0.50,
    outputDir = 'smed-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting SMED (Setup Time Reduction) process');

  // Task 1: Baseline Documentation
  ctx.log('info', 'Phase 1: Documenting baseline changeover');
  const baselineDoc = await ctx.task(baselineDocTask, {
    equipmentId,
    changeoverType,
    currentChangeoverTime,
    outputDir
  });

  artifacts.push(...baselineDoc.artifacts);

  // Task 2: Video Analysis
  ctx.log('info', 'Phase 2: Analyzing current changeover video');
  const videoAnalysis = await ctx.task(videoAnalysisTask, {
    baselineDoc,
    outputDir
  });

  artifacts.push(...videoAnalysis.artifacts);

  // Breakpoint: Review current state
  await ctx.breakpoint({
    question: `Baseline changeover: ${baselineDoc.totalTime} minutes. ${videoAnalysis.elementCount} elements identified. ${videoAnalysis.internalCount} internal, ${videoAnalysis.externalCount} external. Proceed with SMED analysis?`,
    title: 'SMED Baseline Review',
    context: {
      runId: ctx.runId,
      baseline: {
        totalTime: baselineDoc.totalTime,
        elements: videoAnalysis.elementCount,
        internal: videoAnalysis.internalCount,
        external: videoAnalysis.externalCount
      },
      files: baselineDoc.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Internal/External Separation
  ctx.log('info', 'Phase 3: Separating internal and external activities');
  const separationAnalysis = await ctx.task(separationTask, {
    videoAnalysis,
    outputDir
  });

  artifacts.push(...separationAnalysis.artifacts);

  // Task 4: Convert Internal to External
  ctx.log('info', 'Phase 4: Converting internal activities to external');
  const conversionAnalysis = await ctx.task(conversionTask, {
    separationAnalysis,
    outputDir
  });

  artifacts.push(...conversionAnalysis.artifacts);

  // Task 5: Streamline Internal Operations
  ctx.log('info', 'Phase 5: Streamlining remaining internal activities');
  const streamliningAnalysis = await ctx.task(streamliningTask, {
    conversionAnalysis,
    outputDir
  });

  artifacts.push(...streamliningAnalysis.artifacts);

  // Task 6: Improvement Actions
  ctx.log('info', 'Phase 6: Developing improvement action list');
  const improvementActions = await ctx.task(improvementActionsTask, {
    conversionAnalysis,
    streamliningAnalysis,
    targetReduction,
    outputDir
  });

  artifacts.push(...improvementActions.artifacts);

  // Task 7: New Standard Procedure
  ctx.log('info', 'Phase 7: Creating new standard changeover procedure');
  const newProcedure = await ctx.task(newProcedureTask, {
    streamliningAnalysis,
    improvementActions,
    outputDir
  });

  artifacts.push(...newProcedure.artifacts);

  // Task 8: Results Comparison
  ctx.log('info', 'Phase 8: Comparing before/after times');
  const resultsComparison = await ctx.task(resultsComparisonTask, {
    baselineDoc,
    newProcedure,
    outputDir
  });

  artifacts.push(...resultsComparison.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `SMED analysis complete. Before: ${baselineDoc.totalTime} min, After: ${newProcedure.projectedTime} min. Reduction: ${resultsComparison.reductionPercentage}%. ${improvementActions.actionCount} actions identified. Review results?`,
    title: 'SMED Results',
    context: {
      runId: ctx.runId,
      summary: {
        beforeTime: baselineDoc.totalTime,
        afterTime: newProcedure.projectedTime,
        reductionPercentage: resultsComparison.reductionPercentage,
        actionsIdentified: improvementActions.actionCount
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    analysis: {
      baselineTime: baselineDoc.totalTime,
      elementBreakdown: videoAnalysis.elements,
      internalTime: separationAnalysis.internalTime,
      externalTime: separationAnalysis.externalTime
    },
    improvements: improvementActions.actions,
    newProcedure: {
      projectedTime: newProcedure.projectedTime,
      procedureDoc: newProcedure.procedurePath,
      reductionPercentage: resultsComparison.reductionPercentage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/smed',
      timestamp: startTime,
      equipmentId,
      changeoverType,
      outputDir
    }
  };
}

// Task definitions
export const baselineDocTask = defineTask('baseline-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document baseline changeover',
  agent: {
    name: 'baseline-documenter',
    prompt: {
      role: 'SMED Analyst',
      task: 'Document current changeover process and baseline time',
      context: args,
      instructions: [
        '1. Observe and time current changeover',
        '2. Document all activities performed',
        '3. Record equipment and tools used',
        '4. Record personnel involved',
        '5. Note waiting times',
        '6. Capture baseline photos',
        '7. Record total changeover time',
        '8. Document baseline findings'
      ],
      outputFormat: 'JSON with baseline documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTime', 'activities', 'personnel', 'artifacts'],
      properties: {
        totalTime: { type: 'number' },
        activities: { type: 'array' },
        personnel: { type: 'array' },
        equipmentUsed: { type: 'array' },
        toolsUsed: { type: 'array' },
        waitingTime: { type: 'number' },
        photos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'baseline']
}));

export const videoAnalysisTask = defineTask('video-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze changeover video',
  agent: {
    name: 'video-analyst',
    prompt: {
      role: 'Changeover Analysis Specialist',
      task: 'Analyze changeover video to identify all elements',
      context: args,
      instructions: [
        '1. Review video of changeover',
        '2. Break down into discrete elements',
        '3. Time each element',
        '4. Classify as internal or external',
        '5. Identify waste (motion, waiting)',
        '6. Note parallel opportunities',
        '7. Create element breakdown sheet',
        '8. Document video analysis'
      ],
      outputFormat: 'JSON with element breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['elements', 'elementCount', 'internalCount', 'externalCount', 'artifacts'],
      properties: {
        elements: { type: 'array' },
        elementCount: { type: 'number' },
        internalCount: { type: 'number' },
        externalCount: { type: 'number' },
        wasteIdentified: { type: 'array' },
        parallelOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'video-analysis']
}));

export const separationTask = defineTask('internal-external-separation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Separate internal and external activities',
  agent: {
    name: 'separation-analyst',
    prompt: {
      role: 'SMED Facilitator',
      task: 'Separate internal and external setup activities',
      context: args,
      instructions: [
        '1. Define internal (machine stopped)',
        '2. Define external (machine running)',
        '3. Classify each element',
        '4. Calculate internal time',
        '5. Calculate external time',
        '6. Identify misclassified activities',
        '7. Create separation matrix',
        '8. Document separation analysis'
      ],
      outputFormat: 'JSON with separated activities'
    },
    outputSchema: {
      type: 'object',
      required: ['internalActivities', 'externalActivities', 'internalTime', 'externalTime', 'artifacts'],
      properties: {
        internalActivities: { type: 'array' },
        externalActivities: { type: 'array' },
        internalTime: { type: 'number' },
        externalTime: { type: 'number' },
        misclassified: { type: 'array' },
        separationMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'separation']
}));

export const conversionTask = defineTask('internal-to-external-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Convert internal to external activities',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'SMED Improvement Specialist',
      task: 'Identify opportunities to convert internal to external setup',
      context: args,
      instructions: [
        '1. Review each internal activity',
        '2. Identify conversion opportunities',
        '3. Design pre-staging methods',
        '4. Design quick-connect fixtures',
        '5. Plan parallel operations',
        '6. Calculate time savings',
        '7. List required investments',
        '8. Document conversion plan'
      ],
      outputFormat: 'JSON with conversion analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['conversionOpportunities', 'timeSavings', 'investments', 'artifacts'],
      properties: {
        conversionOpportunities: { type: 'array' },
        preStagingMethods: { type: 'array' },
        quickConnects: { type: 'array' },
        parallelOperations: { type: 'array' },
        timeSavings: { type: 'number' },
        investments: { type: 'array' },
        newInternalTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'conversion']
}));

export const streamliningTask = defineTask('streamline-internal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Streamline internal operations',
  agent: {
    name: 'streamlining-specialist',
    prompt: {
      role: 'Lean Manufacturing Engineer',
      task: 'Streamline remaining internal setup activities',
      context: args,
      instructions: [
        '1. Analyze remaining internal activities',
        '2. Eliminate unnecessary steps',
        '3. Simplify adjustments',
        '4. Standardize hardware',
        '5. Implement one-turn fasteners',
        '6. Design functional clamps',
        '7. Calculate additional savings',
        '8. Document streamlining improvements'
      ],
      outputFormat: 'JSON with streamlining analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['streamlinedActivities', 'eliminatedSteps', 'additionalSavings', 'artifacts'],
      properties: {
        streamlinedActivities: { type: 'array' },
        eliminatedSteps: { type: 'array' },
        simplifiedAdjustments: { type: 'array' },
        standardizedHardware: { type: 'array' },
        functionalClamps: { type: 'array' },
        additionalSavings: { type: 'number' },
        finalInternalTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'streamlining']
}));

export const improvementActionsTask = defineTask('improvement-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop improvement action list',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'SMED Implementation Leader',
      task: 'Create prioritized improvement action list',
      context: args,
      instructions: [
        '1. Compile all improvement ideas',
        '2. Estimate cost for each',
        '3. Estimate time savings for each',
        '4. Calculate ROI',
        '5. Prioritize by impact/effort',
        '6. Assign owners and due dates',
        '7. Create implementation schedule',
        '8. Document action plan'
      ],
      outputFormat: 'JSON with improvement actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'actionCount', 'totalCost', 'totalSavings', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        actionCount: { type: 'number' },
        costs: { type: 'object' },
        timeSavings: { type: 'object' },
        totalCost: { type: 'number' },
        totalSavings: { type: 'number' },
        prioritization: { type: 'array' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'actions']
}));

export const newProcedureTask = defineTask('new-procedure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create new standard changeover procedure',
  agent: {
    name: 'procedure-developer',
    prompt: {
      role: 'Standard Work Developer',
      task: 'Create new standardized changeover procedure',
      context: args,
      instructions: [
        '1. Define external setup checklist',
        '2. Define internal setup sequence',
        '3. Create visual work instructions',
        '4. Define roles and responsibilities',
        '5. Create timing targets by step',
        '6. Include quality checkpoints',
        '7. Calculate projected total time',
        '8. Document new procedure'
      ],
      outputFormat: 'JSON with new procedure'
    },
    outputSchema: {
      type: 'object',
      required: ['procedurePath', 'projectedTime', 'externalChecklist', 'internalSequence', 'artifacts'],
      properties: {
        procedurePath: { type: 'string' },
        projectedTime: { type: 'number' },
        externalChecklist: { type: 'array' },
        internalSequence: { type: 'array' },
        visualInstructions: { type: 'array' },
        roles: { type: 'object' },
        timingTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'procedure']
}));

export const resultsComparisonTask = defineTask('results-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare before/after times',
  agent: {
    name: 'results-analyst',
    prompt: {
      role: 'SMED Results Analyst',
      task: 'Compare before and after changeover times',
      context: args,
      instructions: [
        '1. Compare baseline to projected time',
        '2. Calculate time reduction',
        '3. Calculate percentage improvement',
        '4. Calculate capacity gain',
        '5. Calculate cost savings',
        '6. Create before/after comparison',
        '7. Document benefits',
        '8. Create results report'
      ],
      outputFormat: 'JSON with results comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['beforeTime', 'afterTime', 'reductionPercentage', 'artifacts'],
      properties: {
        beforeTime: { type: 'number' },
        afterTime: { type: 'number' },
        timeReduction: { type: 'number' },
        reductionPercentage: { type: 'number' },
        capacityGain: { type: 'object' },
        costSavings: { type: 'number' },
        benefitsSummary: { type: 'array' },
        comparisonChart: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'smed', 'results']
}));
