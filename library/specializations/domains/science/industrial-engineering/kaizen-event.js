/**
 * @process domains/science/industrial-engineering/kaizen-event
 * @description Kaizen Event Facilitation - Plan, facilitate, and follow up on rapid improvement events that achieve
 * measurable results within a focused timeframe (typically 3-5 days).
 * @inputs { eventScope: string, objectives?: array, targetArea?: string, teamMembers?: array }
 * @outputs { success: boolean, improvements: array, beforeAfterComparison: object, sustainmentPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/kaizen-event', {
 *   eventScope: 'Reduce changeover time in packaging line',
 *   objectives: ['50% reduction in changeover time'],
 *   targetArea: 'Packaging Line 3',
 *   teamMembers: ['operators', 'maintenance', 'engineering']
 * });
 *
 * @references
 * - Imai, Gemba Kaizen
 * - Rother & Shook, Learning to See
 * - Liker, The Toyota Way
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventScope,
    objectives = [],
    targetArea = '',
    teamMembers = [],
    eventDuration = 5,
    outputDir = 'kaizen-event-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Kaizen Event Facilitation process');

  // Task 1: Event Charter and Preparation
  ctx.log('info', 'Phase 1: Creating event charter and preparation checklist');
  const eventCharter = await ctx.task(eventCharterTask, {
    eventScope,
    objectives,
    targetArea,
    teamMembers,
    eventDuration,
    outputDir
  });

  artifacts.push(...eventCharter.artifacts);

  // Task 2: Team Preparation
  ctx.log('info', 'Phase 2: Preparing cross-functional team');
  const teamPreparation = await ctx.task(teamPreparationTask, {
    eventCharter,
    teamMembers,
    outputDir
  });

  artifacts.push(...teamPreparation.artifacts);

  // Task 3: Current State Analysis
  ctx.log('info', 'Phase 3: Analyzing current state and baseline metrics');
  const currentStateAnalysis = await ctx.task(currentStateAnalysisTask, {
    eventCharter,
    targetArea,
    outputDir
  });

  artifacts.push(...currentStateAnalysis.artifacts);

  // Breakpoint: Review baseline
  await ctx.breakpoint({
    question: `Current state documented. Baseline metric: ${currentStateAnalysis.baselineMetric}. ${currentStateAnalysis.wasteIdentified.length} waste items identified. Ready to begin improvement phase?`,
    title: 'Kaizen Current State Review',
    context: {
      runId: ctx.runId,
      baseline: currentStateAnalysis.baselineMetric,
      wasteIdentified: currentStateAnalysis.wasteIdentified,
      files: currentStateAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Root Cause Analysis
  ctx.log('info', 'Phase 4: Conducting root cause analysis');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    currentStateAnalysis,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // Task 5: Solution Development
  ctx.log('info', 'Phase 5: Developing and testing solutions');
  const solutionDevelopment = await ctx.task(solutionDevelopmentTask, {
    rootCauseAnalysis,
    objectives,
    outputDir
  });

  artifacts.push(...solutionDevelopment.artifacts);

  // Task 6: Implementation
  ctx.log('info', 'Phase 6: Implementing improvements');
  const implementation = await ctx.task(implementationTask, {
    solutionDevelopment,
    targetArea,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // Task 7: Results Verification
  ctx.log('info', 'Phase 7: Verifying results and before/after comparison');
  const resultsVerification = await ctx.task(resultsVerificationTask, {
    currentStateAnalysis,
    implementation,
    objectives,
    outputDir
  });

  artifacts.push(...resultsVerification.artifacts);

  // Task 8: Standard Work Documentation
  ctx.log('info', 'Phase 8: Documenting standard work');
  const standardWorkDoc = await ctx.task(standardWorkDocTask, {
    implementation,
    resultsVerification,
    outputDir
  });

  artifacts.push(...standardWorkDoc.artifacts);

  // Task 9: Sustainment Plan
  ctx.log('info', 'Phase 9: Creating sustainment plan and audit schedule');
  const sustainmentPlan = await ctx.task(sustainmentPlanTask, {
    implementation,
    standardWorkDoc,
    outputDir
  });

  artifacts.push(...sustainmentPlan.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Kaizen event complete. Improvement achieved: ${resultsVerification.improvementPercentage}%. Objective met: ${resultsVerification.objectiveMet}. Review sustainment plan?`,
    title: 'Kaizen Event Results',
    context: {
      runId: ctx.runId,
      summary: {
        baselineMetric: currentStateAnalysis.baselineMetric,
        newMetric: resultsVerification.newMetric,
        improvementPercentage: resultsVerification.improvementPercentage,
        objectiveMet: resultsVerification.objectiveMet,
        implementedChanges: implementation.changesImplemented.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    improvements: implementation.changesImplemented,
    beforeAfterComparison: {
      baseline: currentStateAnalysis.baselineMetric,
      newMetric: resultsVerification.newMetric,
      improvementPercentage: resultsVerification.improvementPercentage,
      objectiveMet: resultsVerification.objectiveMet
    },
    sustainmentPlan: {
      auditSchedule: sustainmentPlan.auditSchedule,
      followUpDates: sustainmentPlan.followUpDates,
      ownership: sustainmentPlan.ownership
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/kaizen-event',
      timestamp: startTime,
      eventScope,
      targetArea,
      outputDir
    }
  };
}

// Task 1: Event Charter
export const eventCharterTask = defineTask('event-charter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create kaizen event charter',
  agent: {
    name: 'kaizen-facilitator',
    prompt: {
      role: 'Kaizen Event Facilitator',
      task: 'Create comprehensive event charter and preparation checklist',
      context: args,
      instructions: [
        '1. Define event scope and boundaries',
        '2. Document specific, measurable objectives',
        '3. Identify target metrics and success criteria',
        '4. Define team roles and responsibilities',
        '5. Create event schedule and agenda',
        '6. Identify resource requirements',
        '7. Create preparation checklist',
        '8. Document pre-work assignments'
      ],
      outputFormat: 'JSON with event charter and preparation materials'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'objectives', 'schedule', 'artifacts'],
      properties: {
        charter: { type: 'object' },
        objectives: { type: 'array' },
        successCriteria: { type: 'array' },
        schedule: { type: 'object' },
        teamRoles: { type: 'array' },
        preparationChecklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'charter']
}));

// Task 2: Team Preparation
export const teamPreparationTask = defineTask('team-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare cross-functional team',
  agent: {
    name: 'team-coordinator',
    prompt: {
      role: 'Team Development Coordinator',
      task: 'Prepare and align cross-functional team for kaizen event',
      context: args,
      instructions: [
        '1. Confirm team member availability',
        '2. Provide lean/kaizen training overview',
        '3. Distribute pre-reading materials',
        '4. Assign pre-work tasks',
        '5. Set expectations for participation',
        '6. Arrange logistics (room, materials)',
        '7. Brief management on support needed',
        '8. Document team readiness'
      ],
      outputFormat: 'JSON with team preparation status and materials'
    },
    outputSchema: {
      type: 'object',
      required: ['teamReady', 'trainingCompleted', 'artifacts'],
      properties: {
        teamReady: { type: 'boolean' },
        trainingCompleted: { type: 'array' },
        preWorkStatus: { type: 'object' },
        logisticsConfirmed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'team-preparation']
}));

// Task 3: Current State Analysis
export const currentStateAnalysisTask = defineTask('current-state-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current state and baseline',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'Process Analyst',
      task: 'Document current state and establish baseline metrics',
      context: args,
      instructions: [
        '1. Walk and observe the current process',
        '2. Document current process steps',
        '3. Measure baseline performance metrics',
        '4. Identify all waste (TIMWOODS)',
        '5. Create process flow diagram',
        '6. Document pain points from operators',
        '7. Take photos/videos of current state',
        '8. Quantify waste impact'
      ],
      outputFormat: 'JSON with current state documentation and baseline'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineMetric', 'processSteps', 'wasteIdentified', 'artifacts'],
      properties: {
        baselineMetric: { type: 'number' },
        metricUnit: { type: 'string' },
        processSteps: { type: 'array' },
        wasteIdentified: { type: 'array' },
        painPoints: { type: 'array' },
        processFlowPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'current-state']
}));

// Task 4: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct root cause analysis',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root Cause Analysis Facilitator',
      task: 'Facilitate team root cause analysis',
      context: args,
      instructions: [
        '1. Create fishbone (Ishikawa) diagram',
        '2. Conduct 5 Whys analysis',
        '3. Prioritize root causes',
        '4. Validate causes with data',
        '5. Distinguish symptoms from causes',
        '6. Identify systemic vs. local causes',
        '7. Get team consensus on root causes',
        '8. Document root cause analysis'
      ],
      outputFormat: 'JSON with root cause analysis and prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'fishboneDiagram', 'prioritizedCauses', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        fishboneDiagram: { type: 'object' },
        fiveWhysAnalysis: { type: 'array' },
        prioritizedCauses: { type: 'array' },
        validationData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'root-cause']
}));

// Task 5: Solution Development
export const solutionDevelopmentTask = defineTask('solution-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop and test solutions',
  agent: {
    name: 'solution-developer',
    prompt: {
      role: 'Continuous Improvement Specialist',
      task: 'Develop, test, and select improvement solutions',
      context: args,
      instructions: [
        '1. Brainstorm potential solutions',
        '2. Evaluate solutions against criteria',
        '3. Prioritize solutions using impact/effort matrix',
        '4. Develop selected solutions in detail',
        '5. Create prototypes or pilots where possible',
        '6. Test solutions on small scale',
        '7. Refine based on testing feedback',
        '8. Document final solutions'
      ],
      outputFormat: 'JSON with developed solutions and test results'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'prioritization', 'testResults', 'artifacts'],
      properties: {
        solutions: { type: 'array' },
        prioritization: { type: 'array' },
        impactEffortMatrix: { type: 'object' },
        testResults: { type: 'array' },
        selectedSolutions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'solutions']
}));

// Task 6: Implementation
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement improvements',
  agent: {
    name: 'implementation-lead',
    prompt: {
      role: 'Implementation Leader',
      task: 'Implement selected improvements during kaizen event',
      context: args,
      instructions: [
        '1. Create implementation action plan',
        '2. Assign tasks to team members',
        '3. Implement changes in target area',
        '4. Make physical changes (layout, equipment)',
        '5. Update procedures and work instructions',
        '6. Train affected personnel',
        '7. Document all changes made',
        '8. Track implementation progress'
      ],
      outputFormat: 'JSON with implementation status and changes made'
    },
    outputSchema: {
      type: 'object',
      required: ['changesImplemented', 'implementationComplete', 'artifacts'],
      properties: {
        changesImplemented: { type: 'array' },
        implementationComplete: { type: 'boolean' },
        pendingItems: { type: 'array' },
        trainingCompleted: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'implementation']
}));

// Task 7: Results Verification
export const resultsVerificationTask = defineTask('results-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify results and compare before/after',
  agent: {
    name: 'results-verifier',
    prompt: {
      role: 'Performance Measurement Analyst',
      task: 'Verify improvement results against objectives',
      context: args,
      instructions: [
        '1. Measure new performance metrics',
        '2. Calculate improvement percentage',
        '3. Compare against objectives',
        '4. Create before/after comparison',
        '5. Document qualitative improvements',
        '6. Calculate ROI if applicable',
        '7. Identify any new issues',
        '8. Generate results summary'
      ],
      outputFormat: 'JSON with results verification and comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['newMetric', 'improvementPercentage', 'objectiveMet', 'artifacts'],
      properties: {
        newMetric: { type: 'number' },
        improvementPercentage: { type: 'number' },
        objectiveMet: { type: 'boolean' },
        beforeAfterComparison: { type: 'object' },
        qualitativeImprovements: { type: 'array' },
        roi: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'verification']
}));

// Task 8: Standard Work Documentation
export const standardWorkDocTask = defineTask('standard-work-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document standard work',
  agent: {
    name: 'standard-work-author',
    prompt: {
      role: 'Standard Work Specialist',
      task: 'Document new standard work procedures',
      context: args,
      instructions: [
        '1. Create standard work combination sheet',
        '2. Document new work sequence',
        '3. Create visual work instructions',
        '4. Update any affected procedures',
        '5. Create training materials',
        '6. Document safety considerations',
        '7. Create quick reference guides',
        '8. Publish standard work documents'
      ],
      outputFormat: 'JSON with standard work documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['standardWorkDocs', 'trainingMaterials', 'artifacts'],
      properties: {
        standardWorkDocs: { type: 'array' },
        combinationSheet: { type: 'object' },
        visualInstructions: { type: 'array' },
        trainingMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'standard-work']
}));

// Task 9: Sustainment Plan
export const sustainmentPlanTask = defineTask('sustainment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create sustainment plan',
  agent: {
    name: 'sustainment-planner',
    prompt: {
      role: 'Continuous Improvement Manager',
      task: 'Create sustainment plan and audit schedule',
      context: args,
      instructions: [
        '1. Define sustainment metrics',
        '2. Create 30/60/90 day follow-up schedule',
        '3. Assign process ownership',
        '4. Create audit checklist',
        '5. Define audit frequency',
        '6. Establish escalation process',
        '7. Plan recognition/celebration',
        '8. Document lessons learned'
      ],
      outputFormat: 'JSON with sustainment plan and audit schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['auditSchedule', 'followUpDates', 'ownership', 'artifacts'],
      properties: {
        auditSchedule: { type: 'array' },
        followUpDates: { type: 'array' },
        ownership: { type: 'object' },
        auditChecklist: { type: 'array' },
        escalationProcess: { type: 'object' },
        lessonsLearned: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'kaizen', 'sustainment']
}));
