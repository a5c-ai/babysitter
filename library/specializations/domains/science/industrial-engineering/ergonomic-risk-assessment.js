/**
 * @process domains/science/industrial-engineering/ergonomic-risk-assessment
 * @description Ergonomic Risk Assessment - Conduct comprehensive ergonomic assessments of workstations and tasks
 * to identify musculoskeletal disorder risk factors and recommend improvements.
 * @inputs { workstation: string, tasks?: array, assessmentType?: string }
 * @outputs { success: boolean, riskAssessment: object, recommendations: array, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/ergonomic-risk-assessment', {
 *   workstation: 'Assembly Station 5',
 *   tasks: ['lifting', 'repetitive-assembly', 'reaching'],
 *   assessmentType: 'comprehensive'
 * });
 *
 * @references
 * - Waters et al., NIOSH Lifting Equation
 * - McAtamney & Corlett, RULA
 * - Hignett & McAtamney, REBA
 * - OSHA Ergonomic Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workstation,
    tasks = [],
    assessmentType = 'comprehensive',
    outputDir = 'ergonomic-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Ergonomic Risk Assessment process');

  // Task 1: Task Screening
  ctx.log('info', 'Phase 1: Screening tasks and prioritizing for assessment');
  const taskScreening = await ctx.task(taskScreeningTask, {
    workstation,
    tasks,
    outputDir
  });

  artifacts.push(...taskScreening.artifacts);

  // Task 2: NIOSH Lifting Analysis
  ctx.log('info', 'Phase 2: Conducting NIOSH lifting equation analysis');
  const nioshAnalysis = await ctx.task(nioshAnalysisTask, {
    taskScreening,
    outputDir
  });

  artifacts.push(...nioshAnalysis.artifacts);

  // Task 3: RULA/REBA Assessment
  ctx.log('info', 'Phase 3: Applying RULA/REBA posture assessment');
  const postureAssessment = await ctx.task(postureAssessmentTask, {
    taskScreening,
    outputDir
  });

  artifacts.push(...postureAssessment.artifacts);

  // Breakpoint: Review assessments
  await ctx.breakpoint({
    question: `Ergonomic assessments complete. NIOSH LI: ${nioshAnalysis.liftingIndex.toFixed(2)}. RULA Score: ${postureAssessment.rulaScore}. ${postureAssessment.highRiskPostures.length} high-risk postures identified. Review before recommendations?`,
    title: 'Ergonomic Assessment Review',
    context: {
      runId: ctx.runId,
      nioshLI: nioshAnalysis.liftingIndex,
      rulaScore: postureAssessment.rulaScore,
      highRiskPostures: postureAssessment.highRiskPostures,
      files: postureAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Repetition and Force Analysis
  ctx.log('info', 'Phase 4: Evaluating repetition, force, and duration factors');
  const repetitionForceAnalysis = await ctx.task(repetitionForceTask, {
    taskScreening,
    outputDir
  });

  artifacts.push(...repetitionForceAnalysis.artifacts);

  // Task 5: Risk Summary
  ctx.log('info', 'Phase 5: Summarizing risk factors by body region');
  const riskSummary = await ctx.task(riskSummaryTask, {
    nioshAnalysis,
    postureAssessment,
    repetitionForceAnalysis,
    outputDir
  });

  artifacts.push(...riskSummary.artifacts);

  // Task 6: Engineering Controls
  ctx.log('info', 'Phase 6: Developing engineering control recommendations');
  const engineeringControls = await ctx.task(engineeringControlsTask, {
    riskSummary,
    workstation,
    outputDir
  });

  artifacts.push(...engineeringControls.artifacts);

  // Task 7: Administrative Controls
  ctx.log('info', 'Phase 7: Developing administrative control recommendations');
  const adminControls = await ctx.task(adminControlsTask, {
    riskSummary,
    outputDir
  });

  artifacts.push(...adminControls.artifacts);

  // Task 8: Implementation Plan
  ctx.log('info', 'Phase 8: Creating implementation and reassessment plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    engineeringControls,
    adminControls,
    riskSummary,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Ergonomic assessment complete. Overall risk level: ${riskSummary.overallRiskLevel}. ${engineeringControls.recommendations.length} engineering and ${adminControls.recommendations.length} administrative controls recommended. Review implementation plan?`,
    title: 'Ergonomic Assessment Results',
    context: {
      runId: ctx.runId,
      summary: {
        overallRiskLevel: riskSummary.overallRiskLevel,
        highRiskBodyRegions: riskSummary.highRiskRegions,
        engineeringRecommendations: engineeringControls.recommendations.length,
        adminRecommendations: adminControls.recommendations.length,
        estimatedCost: implementationPlan.totalCostEstimate
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    riskAssessment: {
      nioshLiftingIndex: nioshAnalysis.liftingIndex,
      rulaScore: postureAssessment.rulaScore,
      rebaScore: postureAssessment.rebaScore,
      overallRiskLevel: riskSummary.overallRiskLevel,
      riskByBodyRegion: riskSummary.riskByRegion
    },
    recommendations: [
      ...engineeringControls.recommendations,
      ...adminControls.recommendations
    ],
    implementationPlan: {
      phases: implementationPlan.phases,
      costEstimate: implementationPlan.totalCostEstimate,
      timeline: implementationPlan.timeline
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/ergonomic-risk-assessment',
      timestamp: startTime,
      workstation,
      assessmentType,
      outputDir
    }
  };
}

// Task 1: Task Screening
export const taskScreeningTask = defineTask('task-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen and prioritize tasks',
  agent: {
    name: 'ergonomic-screener',
    prompt: {
      role: 'Ergonomist',
      task: 'Screen tasks and prioritize for detailed assessment',
      context: args,
      instructions: [
        '1. Inventory all tasks performed at workstation',
        '2. Identify tasks with ergonomic risk factors',
        '3. Use screening checklist (force, posture, repetition)',
        '4. Prioritize tasks by risk potential',
        '5. Document task frequencies and durations',
        '6. Identify peak demand tasks',
        '7. Create task prioritization matrix',
        '8. Document screening results'
      ],
      outputFormat: 'JSON with task screening results and prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'prioritization', 'riskFactorsIdentified', 'artifacts'],
      properties: {
        tasks: { type: 'array' },
        prioritization: { type: 'array' },
        riskFactorsIdentified: { type: 'array' },
        taskFrequencies: { type: 'object' },
        peakDemandTasks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'screening']
}));

// Task 2: NIOSH Analysis
export const nioshAnalysisTask = defineTask('niosh-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct NIOSH lifting equation analysis',
  agent: {
    name: 'lifting-analyst',
    prompt: {
      role: 'Lifting Analysis Specialist',
      task: 'Apply NIOSH lifting equation for manual handling tasks',
      context: args,
      instructions: [
        '1. Identify all manual lifting tasks',
        '2. Measure horizontal distance (H)',
        '3. Measure vertical distance (V)',
        '4. Measure vertical travel distance (D)',
        '5. Measure asymmetry angle (A)',
        '6. Determine coupling quality (C)',
        '7. Determine lifting frequency (F)',
        '8. Calculate RWL and Lifting Index (LI)'
      ],
      outputFormat: 'JSON with NIOSH analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['liftingIndex', 'rwl', 'multipliers', 'artifacts'],
      properties: {
        liftingIndex: { type: 'number' },
        rwl: { type: 'number' },
        actualWeight: { type: 'number' },
        multipliers: { type: 'object' },
        riskLevel: { type: 'string' },
        worksheets: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'niosh']
}));

// Task 3: Posture Assessment
export const postureAssessmentTask = defineTask('posture-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply RULA/REBA posture assessment',
  agent: {
    name: 'posture-analyst',
    prompt: {
      role: 'Posture Assessment Specialist',
      task: 'Assess working postures using RULA and REBA methods',
      context: args,
      instructions: [
        '1. Observe and document working postures',
        '2. Apply RULA assessment (upper limb focus)',
        '3. Score arm and wrist positions',
        '4. Score neck, trunk, and leg positions',
        '5. Add muscle use and force scores',
        '6. Calculate final RULA score',
        '7. Apply REBA for dynamic tasks',
        '8. Identify high-risk postures'
      ],
      outputFormat: 'JSON with RULA/REBA scores and posture analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rulaScore', 'rebaScore', 'highRiskPostures', 'artifacts'],
      properties: {
        rulaScore: { type: 'number' },
        rebaScore: { type: 'number' },
        rulaWorksheets: { type: 'array' },
        rebaWorksheets: { type: 'array' },
        highRiskPostures: { type: 'array' },
        actionLevel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'posture']
}));

// Task 4: Repetition and Force Analysis
export const repetitionForceTask = defineTask('repetition-force-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate repetition, force, and duration',
  agent: {
    name: 'exposure-analyst',
    prompt: {
      role: 'Ergonomic Exposure Analyst',
      task: 'Analyze repetition, force, and duration exposure factors',
      context: args,
      instructions: [
        '1. Count repetitions per cycle',
        '2. Calculate repetitions per hour/shift',
        '3. Estimate force requirements (Borg scale)',
        '4. Assess grip force requirements',
        '5. Measure task durations',
        '6. Identify recovery time adequacy',
        '7. Assess vibration exposure if applicable',
        '8. Calculate cumulative exposure'
      ],
      outputFormat: 'JSON with exposure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['repetitionAnalysis', 'forceAnalysis', 'durationAnalysis', 'artifacts'],
      properties: {
        repetitionAnalysis: { type: 'object' },
        forceAnalysis: { type: 'object' },
        durationAnalysis: { type: 'object' },
        recoveryTime: { type: 'object' },
        vibrationExposure: { type: 'object' },
        cumulativeExposure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'exposure']
}));

// Task 5: Risk Summary
export const riskSummaryTask = defineTask('risk-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Summarize risk by body region',
  agent: {
    name: 'risk-summarizer',
    prompt: {
      role: 'Ergonomic Risk Analyst',
      task: 'Summarize ergonomic risks by body region and overall',
      context: args,
      instructions: [
        '1. Consolidate all assessment results',
        '2. Map risks to body regions',
        '3. Create body mapping diagram',
        '4. Calculate overall risk score',
        '5. Identify highest risk body regions',
        '6. Rank risk factors by severity',
        '7. Document risk summary',
        '8. Create risk visualization'
      ],
      outputFormat: 'JSON with risk summary and body mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskLevel', 'riskByRegion', 'highRiskRegions', 'artifacts'],
      properties: {
        overallRiskLevel: { type: 'string' },
        riskByRegion: { type: 'object' },
        highRiskRegions: { type: 'array' },
        bodyMap: { type: 'object' },
        rankedRiskFactors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'risk-summary']
}));

// Task 6: Engineering Controls
export const engineeringControlsTask = defineTask('engineering-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop engineering control recommendations',
  agent: {
    name: 'engineering-solutions',
    prompt: {
      role: 'Ergonomic Solutions Engineer',
      task: 'Develop engineering control recommendations',
      context: args,
      instructions: [
        '1. Address highest risk factors first',
        '2. Recommend workstation layout changes',
        '3. Recommend equipment modifications',
        '4. Recommend assistive devices (lifts, fixtures)',
        '5. Recommend tool modifications',
        '6. Estimate costs for each recommendation',
        '7. Estimate effectiveness/risk reduction',
        '8. Prioritize recommendations by ROI'
      ],
      outputFormat: 'JSON with engineering control recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'costEstimates', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        costEstimates: { type: 'object' },
        effectivenessEstimates: { type: 'object' },
        prioritization: { type: 'array' },
        specifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'engineering-controls']
}));

// Task 7: Administrative Controls
export const adminControlsTask = defineTask('administrative-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop administrative control recommendations',
  agent: {
    name: 'admin-solutions',
    prompt: {
      role: 'Ergonomic Program Manager',
      task: 'Develop administrative control recommendations',
      context: args,
      instructions: [
        '1. Recommend job rotation schemes',
        '2. Recommend work/rest schedules',
        '3. Recommend training programs',
        '4. Recommend stretching/exercise programs',
        '5. Recommend work pace adjustments',
        '6. Recommend team lifting procedures',
        '7. Develop safe work procedures',
        '8. Plan early symptom reporting'
      ],
      outputFormat: 'JSON with administrative control recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'procedures', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        rotationScheme: { type: 'object' },
        restSchedule: { type: 'object' },
        trainingProgram: { type: 'object' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'admin-controls']
}));

// Task 8: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Ergonomic Program Coordinator',
      task: 'Create implementation plan and reassessment schedule',
      context: args,
      instructions: [
        '1. Prioritize interventions by risk reduction',
        '2. Create phased implementation plan',
        '3. Estimate total costs',
        '4. Create project timeline',
        '5. Assign responsibilities',
        '6. Plan training requirements',
        '7. Schedule reassessment after changes',
        '8. Define success metrics'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalCostEstimate', 'timeline', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        totalCostEstimate: { type: 'number' },
        timeline: { type: 'object' },
        responsibilities: { type: 'object' },
        trainingPlan: { type: 'object' },
        reassessmentSchedule: { type: 'array' },
        successMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'ergonomics', 'implementation']
}));
