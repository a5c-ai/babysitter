/**
 * @process domains/science/industrial-engineering/line-balancing
 * @description Line Balancing Analysis - Balance workload across workstations to minimize cycle time, optimize labor
 * utilization, and achieve production rate targets.
 * @inputs { lineDescription: string, targetRate?: number, currentBalance?: object }
 * @outputs { success: boolean, balancedLine: object, efficiency: number, standardWork: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/line-balancing', {
 *   lineDescription: 'Final assembly line with 8 stations',
 *   targetRate: 60,
 *   currentBalance: { stations: 8, efficiency: 0.72 }
 * });
 *
 * @references
 * - Groover, Work Systems and Methods
 * - Meyers & Stewart, Motion and Time Study for Lean Manufacturing
 * - Askin & Goldberg, Design and Analysis of Lean Production Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lineDescription,
    targetRate = null,
    currentBalance = {},
    outputDir = 'line-balancing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Line Balancing Analysis process');

  // Task 1: Work Element Documentation
  ctx.log('info', 'Phase 1: Documenting work elements and precedence');
  const workElementDoc = await ctx.task(workElementTask, {
    lineDescription,
    outputDir
  });

  artifacts.push(...workElementDoc.artifacts);

  // Task 2: Time Study
  ctx.log('info', 'Phase 2: Conducting time study');
  const timeStudy = await ctx.task(timeStudyTask, {
    workElementDoc,
    outputDir
  });

  artifacts.push(...timeStudy.artifacts);

  // Task 3: Takt Time Calculation
  ctx.log('info', 'Phase 3: Calculating takt time from requirements');
  const taktTimeCalc = await ctx.task(taktTimeTask, {
    targetRate,
    outputDir
  });

  artifacts.push(...taktTimeCalc.artifacts);

  // Breakpoint: Review work content
  await ctx.breakpoint({
    question: `Work content: ${timeStudy.totalWorkContent} sec. Takt time: ${taktTimeCalc.taktTime} sec. ${workElementDoc.elementCount} elements with ${workElementDoc.precedenceCount} precedence constraints. Proceed with balancing?`,
    title: 'Line Balance Data Review',
    context: {
      runId: ctx.runId,
      data: {
        totalWorkContent: timeStudy.totalWorkContent,
        taktTime: taktTimeCalc.taktTime,
        elements: workElementDoc.elementCount,
        precedenceConstraints: workElementDoc.precedenceCount
      },
      files: timeStudy.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Minimum Stations Calculation
  ctx.log('info', 'Phase 4: Calculating theoretical minimum stations');
  const minStations = await ctx.task(minStationsTask, {
    timeStudy,
    taktTimeCalc,
    outputDir
  });

  artifacts.push(...minStations.artifacts);

  // Task 5: Line Balancing
  ctx.log('info', 'Phase 5: Balancing line using heuristic methods');
  const lineBalancing = await ctx.task(lineBalancingTask, {
    workElementDoc,
    timeStudy,
    taktTimeCalc,
    minStations,
    outputDir
  });

  artifacts.push(...lineBalancing.artifacts);

  // Task 6: Efficiency Evaluation
  ctx.log('info', 'Phase 6: Evaluating balance efficiency');
  const efficiencyEvaluation = await ctx.task(efficiencyEvaluationTask, {
    lineBalancing,
    timeStudy,
    taktTimeCalc,
    outputDir
  });

  artifacts.push(...efficiencyEvaluation.artifacts);

  // Task 7: Alternative Balances
  ctx.log('info', 'Phase 7: Evaluating alternative balance configurations');
  const alternatives = await ctx.task(alternativesTask, {
    lineBalancing,
    efficiencyEvaluation,
    outputDir
  });

  artifacts.push(...alternatives.artifacts);

  // Task 8: Standard Work for Balanced Line
  ctx.log('info', 'Phase 8: Creating standard work for balanced line');
  const standardWork = await ctx.task(standardWorkTask, {
    lineBalancing,
    outputDir
  });

  artifacts.push(...standardWork.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Line balanced. ${lineBalancing.stationCount} stations. Efficiency: ${efficiencyEvaluation.efficiency.toFixed(1)}%. Idle time: ${efficiencyEvaluation.totalIdleTime} sec. Review balance?`,
    title: 'Line Balancing Results',
    context: {
      runId: ctx.runId,
      summary: {
        stationCount: lineBalancing.stationCount,
        efficiency: efficiencyEvaluation.efficiency,
        totalIdleTime: efficiencyEvaluation.totalIdleTime,
        bottleneckStation: efficiencyEvaluation.bottleneckStation
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    balancedLine: {
      stationCount: lineBalancing.stationCount,
      assignments: lineBalancing.stationAssignments,
      cycleTime: lineBalancing.actualCycleTime
    },
    efficiency: efficiencyEvaluation.efficiency,
    idleTime: efficiencyEvaluation.totalIdleTime,
    standardWork: standardWork.standardWorkDocs,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/line-balancing',
      timestamp: startTime,
      targetRate,
      outputDir
    }
  };
}

// Task definitions
export const workElementTask = defineTask('work-element-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document work elements and precedence',
  agent: {
    name: 'work-analyst',
    prompt: {
      role: 'Work Study Analyst',
      task: 'Document all work elements and precedence relationships',
      context: args,
      instructions: [
        '1. Break work into discrete elements',
        '2. Define clear element boundaries',
        '3. Identify precedence constraints',
        '4. Create precedence diagram',
        '5. Identify parallel operations',
        '6. Note machine paced elements',
        '7. Document element descriptions',
        '8. Create precedence matrix'
      ],
      outputFormat: 'JSON with work elements and precedence'
    },
    outputSchema: {
      type: 'object',
      required: ['elements', 'elementCount', 'precedence', 'precedenceCount', 'artifacts'],
      properties: {
        elements: { type: 'array' },
        elementCount: { type: 'number' },
        precedence: { type: 'object' },
        precedenceCount: { type: 'number' },
        precedenceDiagram: { type: 'string' },
        parallelOperations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'work-elements']
}));

export const timeStudyTask = defineTask('time-study', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct time study',
  agent: {
    name: 'time-study-analyst',
    prompt: {
      role: 'Time Study Engineer',
      task: 'Time all work elements',
      context: args,
      instructions: [
        '1. Time each element multiple cycles',
        '2. Calculate average element times',
        '3. Apply performance rating',
        '4. Add allowances',
        '5. Calculate standard time per element',
        '6. Calculate total work content',
        '7. Identify high-variability elements',
        '8. Document time study'
      ],
      outputFormat: 'JSON with time study data'
    },
    outputSchema: {
      type: 'object',
      required: ['elementTimes', 'totalWorkContent', 'standardTimes', 'artifacts'],
      properties: {
        elementTimes: { type: 'object' },
        averageTimes: { type: 'object' },
        standardTimes: { type: 'object' },
        totalWorkContent: { type: 'number' },
        performanceRatings: { type: 'object' },
        allowances: { type: 'object' },
        variability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'time-study']
}));

export const taktTimeTask = defineTask('takt-time-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate takt time',
  agent: {
    name: 'takt-calculator',
    prompt: {
      role: 'Production Planning Analyst',
      task: 'Calculate takt time from production requirements',
      context: args,
      instructions: [
        '1. Determine available production time',
        '2. Determine customer demand rate',
        '3. Calculate takt time',
        '4. Account for planned downtime',
        '5. Determine planned cycle time',
        '6. Calculate buffer for variation',
        '7. Set target station cycle time',
        '8. Document takt calculation'
      ],
      outputFormat: 'JSON with takt time calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['taktTime', 'availableTime', 'demandRate', 'artifacts'],
      properties: {
        taktTime: { type: 'number' },
        availableTime: { type: 'number' },
        demandRate: { type: 'number' },
        plannedCycleTime: { type: 'number' },
        targetStationTime: { type: 'number' },
        bufferPercentage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'takt-time']
}));

export const minStationsTask = defineTask('minimum-stations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate theoretical minimum stations',
  agent: {
    name: 'min-stations-calculator',
    prompt: {
      role: 'Line Design Engineer',
      task: 'Calculate theoretical minimum number of stations',
      context: args,
      instructions: [
        '1. Calculate min stations = work content / takt time',
        '2. Round up to integer',
        '3. Identify constraints affecting minimum',
        '4. Consider parallel stations option',
        '5. Assess achievability',
        '6. Document calculation',
        '7. Define station range to evaluate',
        '8. Set efficiency targets'
      ],
      outputFormat: 'JSON with minimum stations calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['minStations', 'theoreticalMin', 'practicalMin', 'artifacts'],
      properties: {
        theoreticalMin: { type: 'number' },
        minStations: { type: 'number' },
        practicalMin: { type: 'number' },
        constrainingFactors: { type: 'array' },
        stationRange: { type: 'object' },
        efficiencyTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'min-stations']
}));

export const lineBalancingTask = defineTask('line-balancing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Balance line using heuristics',
  agent: {
    name: 'line-balancer',
    prompt: {
      role: 'Line Balancing Specialist',
      task: 'Assign work elements to stations',
      context: args,
      instructions: [
        '1. Apply largest candidate rule',
        '2. Apply ranked positional weight',
        '3. Respect precedence constraints',
        '4. Minimize station cycle times',
        '5. Minimize idle time',
        '6. Balance workload evenly',
        '7. Create station assignments',
        '8. Document balance solution'
      ],
      outputFormat: 'JSON with balanced line assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['stationCount', 'stationAssignments', 'actualCycleTime', 'artifacts'],
      properties: {
        stationCount: { type: 'number' },
        stationAssignments: { type: 'object' },
        stationTimes: { type: 'object' },
        actualCycleTime: { type: 'number' },
        precedenceViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'balancing']
}));

export const efficiencyEvaluationTask = defineTask('efficiency-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate balance efficiency',
  agent: {
    name: 'efficiency-evaluator',
    prompt: {
      role: 'Efficiency Analyst',
      task: 'Calculate line balance efficiency metrics',
      context: args,
      instructions: [
        '1. Calculate line efficiency',
        '2. Calculate balance delay',
        '3. Calculate total idle time',
        '4. Calculate smoothness index',
        '5. Identify bottleneck station',
        '6. Compare to theoretical best',
        '7. Identify improvement potential',
        '8. Document efficiency analysis'
      ],
      outputFormat: 'JSON with efficiency evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['efficiency', 'totalIdleTime', 'bottleneckStation', 'artifacts'],
      properties: {
        efficiency: { type: 'number' },
        balanceDelay: { type: 'number' },
        totalIdleTime: { type: 'number' },
        idleTimeByStation: { type: 'object' },
        smoothnessIndex: { type: 'number' },
        bottleneckStation: { type: 'string' },
        improvementPotential: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'efficiency']
}));

export const alternativesTask = defineTask('alternative-balances', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate alternative configurations',
  agent: {
    name: 'alternatives-analyst',
    prompt: {
      role: 'Line Design Analyst',
      task: 'Evaluate alternative balance configurations',
      context: args,
      instructions: [
        '1. Generate balances with different station counts',
        '2. Evaluate each alternative',
        '3. Consider parallel stations',
        '4. Consider split operations',
        '5. Compare efficiency vs. investment',
        '6. Rank alternatives',
        '7. Recommend best configuration',
        '8. Document alternatives'
      ],
      outputFormat: 'JSON with alternative evaluations'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'comparison', 'recommendation', 'artifacts'],
      properties: {
        alternatives: { type: 'array' },
        comparison: { type: 'object' },
        parallelOptions: { type: 'array' },
        recommendation: { type: 'object' },
        decisionCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'alternatives']
}));

export const standardWorkTask = defineTask('standard-work', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create standard work for balanced line',
  agent: {
    name: 'standard-work-creator',
    prompt: {
      role: 'Standard Work Developer',
      task: 'Create standard work documentation for each station',
      context: args,
      instructions: [
        '1. Create standard work for each station',
        '2. Document work sequence',
        '3. Create station layout diagrams',
        '4. Document cycle time allocations',
        '5. Identify quality checkpoints',
        '6. Create visual work instructions',
        '7. Define material presentation',
        '8. Document standard work package'
      ],
      outputFormat: 'JSON with standard work documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['standardWorkDocs', 'stationLayouts', 'workInstructions', 'artifacts'],
      properties: {
        standardWorkDocs: { type: 'array' },
        stationLayouts: { type: 'array' },
        workSequences: { type: 'object' },
        qualityCheckpoints: { type: 'array' },
        workInstructions: { type: 'array' },
        materialPresentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'line-balancing', 'standard-work']
}));
