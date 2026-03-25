/**
 * @process specializations/domains/business/operations/kaizen-event
 * @description Kaizen Event Facilitation Process - Plan, execute, and follow up on rapid improvement workshops
 * targeting specific process areas with measurable outcomes using structured improvement methodology.
 * @inputs { eventName: string, targetArea: string, objectives?: array, duration?: number, teamMembers?: array }
 * @outputs { success: boolean, improvementsImplemented: array, metrics: object, sustainPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/kaizen-event', {
 *   eventName: 'Setup Time Reduction Kaizen',
 *   targetArea: 'CNC Machine Cell',
 *   objectives: ['Reduce setup time by 50%', 'Standardize procedures'],
 *   duration: 5,
 *   teamMembers: ['process-engineer', 'operators', 'maintenance']
 * });
 *
 * @references
 * - Imai, M. (1986). Kaizen: The Key to Japan's Competitive Success
 * - Martin, K. & Osterling, M. (2007). The Kaizen Event Planner
 * - Liker, J. (2004). The Toyota Way
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventName,
    targetArea,
    objectives = [],
    duration = 5,
    teamMembers = [],
    sponsor = null,
    budget = null,
    outputDir = 'kaizen-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Kaizen Event: ${eventName} for ${targetArea}`);

  // Phase 1: Pre-Event Planning
  ctx.log('info', 'Phase 1: Pre-Event Planning');
  const planning = await ctx.task(preEventPlanningTask, {
    eventName,
    targetArea,
    objectives,
    duration,
    teamMembers,
    sponsor,
    budget,
    outputDir
  });

  artifacts.push(...planning.artifacts);

  // Quality Gate: Event Charter Approval
  await ctx.breakpoint({
    question: `Kaizen event planned: ${eventName}. Scope: ${planning.scope}. Team: ${planning.teamSize} members. Duration: ${duration} days. Objectives clear? Approve event charter?`,
    title: 'Kaizen Event Charter Approval',
    context: {
      runId: ctx.runId,
      eventName,
      scope: planning.scope,
      objectives: planning.objectives,
      teamMembers: planning.teamMembers,
      schedule: planning.schedule,
      files: planning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Current State Analysis (Day 1)
  ctx.log('info', 'Phase 2: Current State Analysis');
  const currentState = await ctx.task(currentStateAnalysisTask, {
    eventName,
    targetArea,
    planning,
    outputDir
  });

  artifacts.push(...currentState.artifacts);

  // Phase 3: Root Cause Analysis (Day 1-2)
  ctx.log('info', 'Phase 3: Root Cause Analysis');
  const rootCause = await ctx.task(rootCauseAnalysisTask, {
    eventName,
    currentState,
    objectives,
    outputDir
  });

  artifacts.push(...rootCause.artifacts);

  // Quality Gate: Problem Definition Review
  await ctx.breakpoint({
    question: `Current state mapped and root causes identified. ${rootCause.rootCauses.length} root causes found. Key issue: ${rootCause.primaryRootCause}. Proceed with solution development?`,
    title: 'Root Cause Analysis Review',
    context: {
      runId: ctx.runId,
      eventName,
      currentStateMetrics: currentState.metrics,
      rootCauses: rootCause.rootCauses,
      primaryRootCause: rootCause.primaryRootCause,
      files: [...currentState.artifacts, ...rootCause.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Solution Development (Day 2-3)
  ctx.log('info', 'Phase 4: Solution Development');
  const solutions = await ctx.task(solutionDevelopmentTask, {
    eventName,
    rootCause,
    objectives,
    budget,
    outputDir
  });

  artifacts.push(...solutions.artifacts);

  // Phase 5: Solution Implementation (Day 3-4)
  ctx.log('info', 'Phase 5: Solution Implementation');
  const implementation = await ctx.task(solutionImplementationTask, {
    eventName,
    solutions,
    targetArea,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // Quality Gate: Implementation Progress
  await ctx.breakpoint({
    question: `${implementation.implementedCount}/${solutions.totalSolutions} solutions implemented. Quick wins: ${implementation.quickWins.length}. Issues: ${implementation.issues.length}. Continue or adjust?`,
    title: 'Implementation Progress Review',
    context: {
      runId: ctx.runId,
      eventName,
      implemented: implementation.implementedSolutions,
      pending: implementation.pendingSolutions,
      quickWins: implementation.quickWins,
      issues: implementation.issues,
      files: implementation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Results Verification (Day 4-5)
  ctx.log('info', 'Phase 6: Results Verification');
  const verification = await ctx.task(resultsVerificationTask, {
    eventName,
    currentState,
    implementation,
    objectives,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // Phase 7: Standardization
  ctx.log('info', 'Phase 7: Standardization');
  const standardization = await ctx.task(standardizationTask, {
    eventName,
    implementation,
    verification,
    outputDir
  });

  artifacts.push(...standardization.artifacts);

  // Phase 8: Sustainability Planning
  ctx.log('info', 'Phase 8: Sustainability Planning');
  const sustainability = await ctx.task(sustainabilityPlanningTask, {
    eventName,
    standardization,
    verification,
    outputDir
  });

  artifacts.push(...sustainability.artifacts);

  // Phase 9: Event Report and Closeout
  ctx.log('info', 'Phase 9: Event Report and Closeout');
  const report = await ctx.task(eventReportTask, {
    eventName,
    targetArea,
    planning,
    currentState,
    rootCause,
    solutions,
    implementation,
    verification,
    standardization,
    sustainability,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final Quality Gate: Event Closeout
  await ctx.breakpoint({
    question: `Kaizen event complete. Results: ${verification.objectivesAchieved}/${objectives.length} objectives achieved. Improvement: ${verification.improvementPercentage}%. Review final report and close event?`,
    title: 'Kaizen Event Closeout',
    context: {
      runId: ctx.runId,
      eventName,
      results: {
        objectivesAchieved: verification.objectivesAchieved,
        improvementPercentage: verification.improvementPercentage,
        implementedSolutions: implementation.implementedCount,
        standardsCreated: standardization.standardsCreated
      },
      sustainability: sustainability.sustainPlan,
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const eventDuration = endTime - startTime;

  return {
    success: true,
    eventName,
    targetArea,
    improvementsImplemented: implementation.implementedSolutions,
    metrics: {
      objectivesAchieved: verification.objectivesAchieved,
      totalObjectives: objectives.length,
      improvementPercentage: verification.improvementPercentage,
      beforeMetrics: currentState.metrics,
      afterMetrics: verification.afterMetrics
    },
    rootCauses: rootCause.rootCauses,
    solutions: solutions.selectedSolutions,
    standardsCreated: standardization.standards,
    sustainPlan: sustainability.sustainPlan,
    openActions: sustainability.openActions,
    artifacts,
    reportPath: report.reportPath,
    duration: eventDuration,
    metadata: {
      processId: 'specializations/domains/business/operations/kaizen-event',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Pre-Event Planning
export const preEventPlanningTask = defineTask('kaizen-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Pre-Event Planning - ${args.eventName}`,
  agent: {
    name: 'kaizen-facilitator',
    prompt: {
      role: 'Kaizen Event Facilitator',
      task: 'Plan and prepare for kaizen event',
      context: args,
      instructions: [
        '1. Define clear event scope and boundaries',
        '2. Establish SMART objectives and targets',
        '3. Select cross-functional team members',
        '4. Create event schedule and agenda',
        '5. Identify and invite sponsor/champion',
        '6. Gather baseline data and metrics',
        '7. Prepare training materials for team',
        '8. Arrange logistics (room, supplies, meals)',
        '9. Communicate to stakeholders',
        '10. Create event charter document'
      ],
      outputFormat: 'JSON with planning details'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'objectives', 'teamMembers', 'schedule', 'teamSize', 'artifacts'],
      properties: {
        scope: { type: 'string' },
        objectives: { type: 'array', items: { type: 'object' } },
        teamMembers: { type: 'array', items: { type: 'object' } },
        teamSize: { type: 'number' },
        schedule: { type: 'object' },
        charter: { type: 'object' },
        baselineData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'planning']
}));

// Task 2: Current State Analysis
export const currentStateAnalysisTask = defineTask('kaizen-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Current State Analysis - ${args.eventName}`,
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'Process Analyst',
      task: 'Document and analyze current state process',
      context: args,
      instructions: [
        '1. Walk the process (gemba walk)',
        '2. Create process flow diagram',
        '3. Collect time observations',
        '4. Document value-added vs non-value-added activities',
        '5. Identify wastes (TIMWOODS)',
        '6. Measure current performance metrics',
        '7. Document pain points from operators',
        '8. Take photos of current state',
        '9. Create spaghetti diagram if applicable',
        '10. Summarize current state findings'
      ],
      outputFormat: 'JSON with current state analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['processFlow', 'metrics', 'wastes', 'artifacts'],
      properties: {
        processFlow: { type: 'object' },
        metrics: {
          type: 'object',
          properties: {
            cycleTime: { type: 'number' },
            leadTime: { type: 'number' },
            firstPassYield: { type: 'number' },
            oee: { type: 'number' }
          }
        },
        wastes: { type: 'array', items: { type: 'object' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        valueAddedRatio: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'current-state']
}));

// Task 3: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('kaizen-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Root Cause Analysis - ${args.eventName}`,
  agent: {
    name: 'rca-facilitator',
    prompt: {
      role: 'Root Cause Analysis Facilitator',
      task: 'Facilitate root cause analysis using structured methods',
      context: args,
      instructions: [
        '1. Use fishbone (Ishikawa) diagram for brainstorming',
        '2. Apply 5 Whys analysis for each major cause',
        '3. Categorize causes (Man, Machine, Method, Material, Measurement, Environment)',
        '4. Validate root causes with data',
        '5. Prioritize root causes by impact',
        '6. Identify primary root cause',
        '7. Document contributing factors',
        '8. Link root causes to objectives',
        '9. Create cause-and-effect summary',
        '10. Prepare for solution brainstorming'
      ],
      outputFormat: 'JSON with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'primaryRootCause', 'fishbone', 'artifacts'],
      properties: {
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' },
              validated: { type: 'boolean' }
            }
          }
        },
        primaryRootCause: { type: 'string' },
        fishbone: { type: 'object' },
        fiveWhys: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'root-cause']
}));

// Task 4: Solution Development
export const solutionDevelopmentTask = defineTask('kaizen-solutions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Solution Development - ${args.eventName}`,
  agent: {
    name: 'solution-developer',
    prompt: {
      role: 'Continuous Improvement Specialist',
      task: 'Develop and select solutions for identified root causes',
      context: args,
      instructions: [
        '1. Brainstorm solutions for each root cause',
        '2. Use lean principles (flow, pull, standardization)',
        '3. Evaluate solutions using impact/effort matrix',
        '4. Prioritize solutions (quick wins first)',
        '5. Assess resource requirements',
        '6. Estimate implementation time',
        '7. Identify risks and mitigation',
        '8. Create implementation plan for each solution',
        '9. Assign owners and deadlines',
        '10. Document selected solutions'
      ],
      outputFormat: 'JSON with solution details'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedSolutions', 'totalSolutions', 'impactEffortMatrix', 'artifacts'],
      properties: {
        selectedSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              rootCause: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        totalSolutions: { type: 'number' },
        impactEffortMatrix: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'solutions']
}));

// Task 5: Solution Implementation
export const solutionImplementationTask = defineTask('kaizen-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Solution Implementation - ${args.eventName}`,
  agent: {
    name: 'implementation-lead',
    prompt: {
      role: 'Kaizen Implementation Lead',
      task: 'Implement selected solutions during kaizen event',
      context: args,
      instructions: [
        '1. Execute quick wins immediately',
        '2. Coordinate resources for implementation',
        '3. Document changes made',
        '4. Track implementation progress',
        '5. Address issues and barriers',
        '6. Test implemented solutions',
        '7. Train operators on new methods',
        '8. Take before/after photos',
        '9. Update visual management',
        '10. Document implementation status'
      ],
      outputFormat: 'JSON with implementation results'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedSolutions', 'implementedCount', 'pendingSolutions', 'quickWins', 'issues', 'artifacts'],
      properties: {
        implementedSolutions: { type: 'array', items: { type: 'object' } },
        implementedCount: { type: 'number' },
        pendingSolutions: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        changesDocumented: { type: 'boolean' },
        trainingCompleted: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'implementation']
}));

// Task 6: Results Verification
export const resultsVerificationTask = defineTask('kaizen-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Results Verification - ${args.eventName}`,
  agent: {
    name: 'verification-analyst',
    prompt: {
      role: 'Results Verification Analyst',
      task: 'Verify and measure results of kaizen improvements',
      context: args,
      instructions: [
        '1. Measure after-state performance metrics',
        '2. Compare before vs after results',
        '3. Calculate improvement percentages',
        '4. Verify each objective achievement',
        '5. Document unexpected benefits',
        '6. Identify remaining gaps',
        '7. Validate with operators',
        '8. Calculate ROI if applicable',
        '9. Document lessons learned',
        '10. Summarize results'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['afterMetrics', 'improvementPercentage', 'objectivesAchieved', 'artifacts'],
      properties: {
        afterMetrics: { type: 'object' },
        improvementPercentage: { type: 'number' },
        objectivesAchieved: { type: 'number' },
        objectiveResults: { type: 'array', items: { type: 'object' } },
        unexpectedBenefits: { type: 'array', items: { type: 'string' } },
        remainingGaps: { type: 'array', items: { type: 'string' } },
        roi: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'verification']
}));

// Task 7: Standardization
export const standardizationTask = defineTask('kaizen-standardization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Standardization - ${args.eventName}`,
  agent: {
    name: 'standards-developer',
    prompt: {
      role: 'Standards Developer',
      task: 'Standardize improvements from kaizen event',
      context: args,
      instructions: [
        '1. Create standard work documents',
        '2. Update work instructions',
        '3. Create one-point lessons',
        '4. Update visual controls',
        '5. Revise checklists',
        '6. Update training materials',
        '7. Document best practices',
        '8. Create error-proofing (poka-yoke)',
        '9. Update process documentation',
        '10. Get stakeholder sign-off'
      ],
      outputFormat: 'JSON with standardization results'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'standardsCreated', 'artifacts'],
      properties: {
        standards: { type: 'array', items: { type: 'object' } },
        standardsCreated: { type: 'number' },
        workInstructions: { type: 'array', items: { type: 'string' } },
        onePointLessons: { type: 'number' },
        visualControls: { type: 'number' },
        pokayoke: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'standardization']
}));

// Task 8: Sustainability Planning
export const sustainabilityPlanningTask = defineTask('kaizen-sustainability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Sustainability Planning - ${args.eventName}`,
  agent: {
    name: 'sustainability-planner',
    prompt: {
      role: 'Kaizen Sustainability Planner',
      task: 'Create plan to sustain kaizen improvements',
      context: args,
      instructions: [
        '1. Create 30-60-90 day follow-up plan',
        '2. Assign ownership for sustainability',
        '3. Define audit schedule',
        '4. Create metrics tracking plan',
        '5. Identify open action items',
        '6. Assign owners and due dates',
        '7. Plan follow-up meetings',
        '8. Create escalation process',
        '9. Document success criteria',
        '10. Plan recognition for team'
      ],
      outputFormat: 'JSON with sustainability plan'
    },
    outputSchema: {
      type: 'object',
      required: ['sustainPlan', 'openActions', 'artifacts'],
      properties: {
        sustainPlan: {
          type: 'object',
          properties: {
            thirtyDay: { type: 'array', items: { type: 'object' } },
            sixtyDay: { type: 'array', items: { type: 'object' } },
            ninetyDay: { type: 'array', items: { type: 'object' } }
          }
        },
        openActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        auditSchedule: { type: 'object' },
        metricsTracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'sustainability']
}));

// Task 9: Event Report
export const eventReportTask = defineTask('kaizen-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kaizen Event Report - ${args.eventName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive kaizen event report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document event objectives and scope',
        '3. Present team and participants',
        '4. Document current state analysis',
        '5. Present root cause analysis',
        '6. Document solutions implemented',
        '7. Present before/after results',
        '8. Include sustainability plan',
        '9. List open action items',
        '10. Add lessons learned and best practices'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyResults: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kaizen', 'reporting']
}));
