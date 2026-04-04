/**
 * @process specializations/domains/business/project-management/schedule-development-cpm
 * @description Schedule Development and Critical Path Analysis - Create project schedule using activity
 * sequencing, duration estimation, critical path method (CPM), and resource leveling techniques.
 * @inputs { projectName: string, wbs: object, resources: array, constraints?: object }
 * @outputs { success: boolean, schedule: object, criticalPath: array, milestones: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/schedule-development-cpm', {
 *   projectName: 'Office Building Construction',
 *   wbs: { structure: {...}, workPackages: [...] },
 *   resources: [{ name: 'Project Manager', availability: 100 }, { name: 'Developer', availability: 80 }],
 *   constraints: { mustFinishBy: '2025-12-31', fixedMilestones: [...] }
 * });
 *
 * @references
 * - PMI PMBOK Schedule Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Critical Path Method: https://www.pmi.org/learning/library/schedule-development-construction-702
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    wbs,
    resources = [],
    constraints = {},
    projectCalendar = {},
    estimationMethod = 'three-point'
  } = inputs;

  // Phase 1: Activity Definition
  const activityDefinition = await ctx.task(activityDefinitionTask, {
    projectName,
    wbs,
    constraints
  });

  // Quality Gate: Activities must be defined
  if (!activityDefinition.activities || activityDefinition.activities.length === 0) {
    return {
      success: false,
      error: 'No activities defined from WBS',
      phase: 'activity-definition',
      schedule: null
    };
  }

  // Breakpoint: Review activity list
  await ctx.breakpoint({
    question: `Defined ${activityDefinition.activities.length} activities for ${projectName}. Review and proceed with sequencing?`,
    title: 'Activity Definition Review',
    context: {
      runId: ctx.runId,
      projectName,
      activityCount: activityDefinition.activities.length,
      files: [{
        path: `artifacts/phase1-activity-definition.json`,
        format: 'json',
        content: activityDefinition
      }]
    }
  });

  // Phase 2: Activity Sequencing
  const activitySequencing = await ctx.task(activitySequencingTask, {
    projectName,
    activities: activityDefinition.activities,
    constraints
  });

  // Phase 3: Duration Estimation
  const durationEstimation = await ctx.task(durationEstimationTask, {
    projectName,
    activities: activityDefinition.activities,
    resources,
    estimationMethod
  });

  // Phase 4: Resource Assignment
  const resourceAssignment = await ctx.task(resourceAssignmentTask, {
    projectName,
    activities: durationEstimation.estimatedActivities,
    resources
  });

  // Phase 5: Network Diagram Development
  const networkDiagram = await ctx.task(networkDiagramTask, {
    projectName,
    activities: durationEstimation.estimatedActivities,
    sequencing: activitySequencing
  });

  // Phase 6: Critical Path Analysis
  const criticalPathAnalysis = await ctx.task(criticalPathAnalysisTask, {
    projectName,
    networkDiagram,
    durationEstimation
  });

  // Quality Gate: Critical path identified
  if (!criticalPathAnalysis.criticalPath || criticalPathAnalysis.criticalPath.length === 0) {
    await ctx.breakpoint({
      question: `Critical path not identified for ${projectName}. Review network logic?`,
      title: 'Critical Path Warning',
      context: {
        runId: ctx.runId,
        recommendation: 'Check activity dependencies and network diagram'
      }
    });
  }

  // Phase 7: Resource Leveling
  const resourceLeveling = await ctx.task(resourceLevelingTask, {
    projectName,
    networkDiagram,
    criticalPathAnalysis,
    resourceAssignment,
    resources
  });

  // Phase 8: Schedule Compression Analysis
  const scheduleCompression = await ctx.task(scheduleCompressionTask, {
    projectName,
    criticalPathAnalysis,
    resourceLeveling,
    constraints
  });

  // Phase 9: Milestone Definition
  const milestoneDefinition = await ctx.task(milestoneDefinitionTask, {
    projectName,
    criticalPathAnalysis,
    resourceLeveling,
    constraints
  });

  // Phase 10: Schedule Baseline Development
  const scheduleBaseline = await ctx.task(scheduleBaselineTask, {
    projectName,
    criticalPathAnalysis,
    resourceLeveling,
    milestoneDefinition,
    constraints,
    projectCalendar
  });

  // Phase 11: Schedule Documentation
  const scheduleDocumentation = await ctx.task(scheduleDocumentationTask, {
    projectName,
    activityDefinition,
    activitySequencing,
    durationEstimation,
    criticalPathAnalysis,
    resourceLeveling,
    scheduleCompression,
    milestoneDefinition,
    scheduleBaseline
  });

  // Final Quality Gate
  const completenessScore = scheduleDocumentation.completenessScore || 0;
  const ready = completenessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Schedule development complete for ${projectName}. Duration: ${scheduleBaseline.totalDuration}. Critical path: ${criticalPathAnalysis.criticalPath.length} activities. Completeness: ${completenessScore}/100. Approve baseline?`,
    title: 'Schedule Baseline Approval',
    context: {
      runId: ctx.runId,
      projectName,
      duration: scheduleBaseline.totalDuration,
      criticalActivities: criticalPathAnalysis.criticalPath.length,
      milestones: milestoneDefinition.milestones.length,
      files: [
        { path: `artifacts/schedule-baseline.json`, format: 'json', content: scheduleBaseline },
        { path: `artifacts/schedule-document.md`, format: 'markdown', content: scheduleDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore,
    ready,
    schedule: {
      baseline: scheduleBaseline,
      activities: resourceLeveling.leveledSchedule,
      startDate: scheduleBaseline.startDate,
      endDate: scheduleBaseline.endDate,
      totalDuration: scheduleBaseline.totalDuration
    },
    criticalPath: {
      activities: criticalPathAnalysis.criticalPath,
      duration: criticalPathAnalysis.criticalPathDuration,
      float: criticalPathAnalysis.totalFloat
    },
    milestones: milestoneDefinition.milestones,
    networkDiagram: networkDiagram.diagram,
    resourceUtilization: resourceLeveling.utilizationSummary,
    compressionOptions: scheduleCompression.options,
    recommendations: scheduleDocumentation.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/schedule-development-cpm',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const activityDefinitionTask = defineTask('activity-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Activity Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Scheduler',
      task: 'Define schedule activities from WBS work packages',
      context: {
        projectName: args.projectName,
        wbs: args.wbs,
        constraints: args.constraints
      },
      instructions: [
        '1. Decompose work packages into schedule activities',
        '2. Ensure activities are at manageable size (1-10 days ideal)',
        '3. Define activity attributes (ID, name, description)',
        '4. Identify activity type (task, milestone, summary)',
        '5. Link activities to WBS elements',
        '6. Document activity assumptions',
        '7. Identify mandatory activities',
        '8. Include project management activities',
        '9. Create activity list',
        '10. Document activity decomposition rationale'
      ],
      outputFormat: 'JSON object with defined activities'
    },
    outputSchema: {
      type: 'object',
      required: ['activities'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              wbsCode: { type: 'string' },
              type: { type: 'string', enum: ['task', 'milestone', 'summary'] },
              isMandatory: { type: 'boolean' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalActivities: { type: 'number' },
        milestoneCount: { type: 'number' },
        summaryCount: { type: 'number' },
        decompositionNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'activity-definition', 'planning']
}));

export const activitySequencingTask = defineTask('activity-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Activity Sequencing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Scheduler',
      task: 'Determine logical relationships between activities',
      context: {
        projectName: args.projectName,
        activities: args.activities,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify mandatory dependencies (hard logic)',
        '2. Identify discretionary dependencies (soft logic)',
        '3. Identify external dependencies',
        '4. Determine relationship types (FS, SS, FF, SF)',
        '5. Define lead and lag times',
        '6. Document dependency rationale',
        '7. Identify parallel activity opportunities',
        '8. Check for circular dependencies',
        '9. Create predecessor/successor list',
        '10. Document sequencing assumptions'
      ],
      outputFormat: 'JSON object with activity sequences'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predecessor: { type: 'string' },
              successor: { type: 'string' },
              type: { type: 'string', enum: ['FS', 'SS', 'FF', 'SF'] },
              lag: { type: 'number' },
              dependencyType: { type: 'string', enum: ['mandatory', 'discretionary', 'external'] },
              rationale: { type: 'string' }
            }
          }
        },
        parallelOpportunities: { type: 'array', items: { type: 'string' } },
        externalDependencies: { type: 'array', items: { type: 'string' } },
        sequencingAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'sequencing', 'dependencies']
}));

export const durationEstimationTask = defineTask('duration-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Duration Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Estimation Specialist',
      task: 'Estimate activity durations using appropriate techniques',
      context: {
        projectName: args.projectName,
        activities: args.activities,
        resources: args.resources,
        estimationMethod: args.estimationMethod
      },
      instructions: [
        '1. Apply three-point estimation (optimistic, likely, pessimistic)',
        '2. Calculate expected duration using PERT formula',
        '3. Consider resource productivity factors',
        '4. Account for learning curve effects',
        '5. Include appropriate reserves',
        '6. Document estimation basis',
        '7. Assess estimation confidence',
        '8. Identify high-uncertainty activities',
        '9. Calculate standard deviation for risk',
        '10. Document estimation assumptions'
      ],
      outputFormat: 'JSON object with duration estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedActivities'],
      properties: {
        estimatedActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              name: { type: 'string' },
              optimistic: { type: 'number' },
              mostLikely: { type: 'number' },
              pessimistic: { type: 'number' },
              expectedDuration: { type: 'number' },
              standardDeviation: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              estimationBasis: { type: 'string' }
            }
          }
        },
        totalExpectedDuration: { type: 'number' },
        highUncertaintyActivities: { type: 'array', items: { type: 'string' } },
        estimationAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'duration-estimation', 'pert']
}));

export const resourceAssignmentTask = defineTask('resource-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Resource Assignment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Manager',
      task: 'Assign resources to schedule activities',
      context: {
        projectName: args.projectName,
        activities: args.activities,
        resources: args.resources
      },
      instructions: [
        '1. Match resource skills to activity requirements',
        '2. Assign primary resources to activities',
        '3. Identify backup resources',
        '4. Calculate resource loading',
        '5. Identify over-allocated resources',
        '6. Document resource constraints',
        '7. Consider resource availability calendars',
        '8. Calculate effort for each assignment',
        '9. Identify resource bottlenecks',
        '10. Document assignment rationale'
      ],
      outputFormat: 'JSON object with resource assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments'],
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              resources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    resourceName: { type: 'string' },
                    role: { type: 'string' },
                    allocation: { type: 'number' },
                    effort: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        resourceLoading: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              totalEffort: { type: 'number' },
              peakAllocation: { type: 'number' },
              isOverAllocated: { type: 'boolean' }
            }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'resource-assignment', 'allocation']
}));

export const networkDiagramTask = defineTask('network-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Network Diagram Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Scheduler',
      task: 'Create project network diagram (PDM)',
      context: {
        projectName: args.projectName,
        activities: args.activities,
        sequencing: args.sequencing
      },
      instructions: [
        '1. Create Precedence Diagramming Method (PDM) network',
        '2. Place activities as nodes',
        '3. Draw dependencies as arrows',
        '4. Identify start and finish nodes',
        '5. Verify network completeness',
        '6. Check for dangling activities',
        '7. Identify parallel paths',
        '8. Calculate network paths',
        '9. Identify convergence and divergence points',
        '10. Create text-based diagram representation'
      ],
      outputFormat: 'JSON object with network diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['diagram', 'paths'],
      properties: {
        diagram: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' },
            startNode: { type: 'string' },
            endNode: { type: 'string' }
          }
        },
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pathId: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              totalDuration: { type: 'number' }
            }
          }
        },
        parallelPaths: { type: 'number' },
        convergencePoints: { type: 'array', items: { type: 'string' } },
        divergencePoints: { type: 'array', items: { type: 'string' } },
        textDiagram: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'network-diagram', 'pdm']
}));

export const criticalPathAnalysisTask = defineTask('critical-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Critical Path Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Schedule Analyst',
      task: 'Perform critical path method (CPM) analysis',
      context: {
        projectName: args.projectName,
        networkDiagram: args.networkDiagram,
        durationEstimation: args.durationEstimation
      },
      instructions: [
        '1. Perform forward pass (calculate early start/finish)',
        '2. Perform backward pass (calculate late start/finish)',
        '3. Calculate total float for each activity',
        '4. Calculate free float for each activity',
        '5. Identify critical path (zero float activities)',
        '6. Calculate critical path duration',
        '7. Identify near-critical paths',
        '8. Calculate schedule risk (standard deviation)',
        '9. Determine probability of meeting target date',
        '10. Document critical path analysis'
      ],
      outputFormat: 'JSON object with critical path analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalPath', 'criticalPathDuration'],
      properties: {
        activityDates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              earlyStart: { type: 'number' },
              earlyFinish: { type: 'number' },
              lateStart: { type: 'number' },
              lateFinish: { type: 'number' },
              totalFloat: { type: 'number' },
              freeFloat: { type: 'number' },
              isCritical: { type: 'boolean' }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        criticalPathDuration: { type: 'number' },
        totalFloat: { type: 'number' },
        nearCriticalPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activities: { type: 'array', items: { type: 'string' } },
              float: { type: 'number' }
            }
          }
        },
        scheduleRisk: {
          type: 'object',
          properties: {
            standardDeviation: { type: 'number' },
            probabilityOnTime: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'critical-path', 'cpm']
}));

export const resourceLevelingTask = defineTask('resource-leveling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Resource Leveling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Manager',
      task: 'Level resource allocation to resolve over-allocations',
      context: {
        projectName: args.projectName,
        networkDiagram: args.networkDiagram,
        criticalPathAnalysis: args.criticalPathAnalysis,
        resourceAssignment: args.resourceAssignment,
        resources: args.resources
      },
      instructions: [
        '1. Identify resource over-allocations',
        '2. Apply resource leveling within float',
        '3. Evaluate impact on schedule',
        '4. Use resource smoothing where possible',
        '5. Identify activities that can be delayed',
        '6. Consider splitting activities',
        '7. Calculate new schedule dates',
        '8. Document leveling decisions',
        '9. Calculate new project duration',
        '10. Assess resource utilization after leveling'
      ],
      outputFormat: 'JSON object with leveled schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['leveledSchedule', 'utilizationSummary'],
      properties: {
        leveledSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              originalStart: { type: 'number' },
              leveledStart: { type: 'number' },
              originalFinish: { type: 'number' },
              leveledFinish: { type: 'number' },
              wasDelayed: { type: 'boolean' },
              delayReason: { type: 'string' }
            }
          }
        },
        utilizationSummary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              beforeLeveling: { type: 'number' },
              afterLeveling: { type: 'number' }
            }
          }
        },
        scheduleImpact: {
          type: 'object',
          properties: {
            originalDuration: { type: 'number' },
            leveledDuration: { type: 'number' },
            extension: { type: 'number' }
          }
        },
        levelingDecisions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'resource-leveling', 'optimization']
}));

export const scheduleCompressionTask = defineTask('schedule-compression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Schedule Compression Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Schedule Optimizer',
      task: 'Analyze schedule compression options',
      context: {
        projectName: args.projectName,
        criticalPathAnalysis: args.criticalPathAnalysis,
        resourceLeveling: args.resourceLeveling,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify critical path activities for compression',
        '2. Analyze crashing options (add resources)',
        '3. Calculate crash cost per day',
        '4. Analyze fast-tracking options (parallel activities)',
        '5. Assess risks of compression techniques',
        '6. Calculate optimal compression level',
        '7. Compare compression scenarios',
        '8. Document compression trade-offs',
        '9. Recommend compression approach',
        '10. Calculate compressed schedule duration'
      ],
      outputFormat: 'JSON object with compression analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['options'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string', enum: ['crashing', 'fast-tracking'] },
              activity: { type: 'string' },
              originalDuration: { type: 'number' },
              compressedDuration: { type: 'number' },
              costIncrease: { type: 'number' },
              riskIncrease: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        compressionScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              durationReduction: { type: 'number' },
              costIncrease: { type: 'number' },
              riskLevel: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        tradeOffs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'compression', 'optimization']
}));

export const milestoneDefinitionTask = defineTask('milestone-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Milestone Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Define project milestones and key dates',
      context: {
        projectName: args.projectName,
        criticalPathAnalysis: args.criticalPathAnalysis,
        resourceLeveling: args.resourceLeveling,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify key milestone events',
        '2. Set milestone dates based on schedule',
        '3. Define milestone success criteria',
        '4. Include external milestones (contractual)',
        '5. Align with phase gates and reviews',
        '6. Document milestone dependencies',
        '7. Set milestone tracking approach',
        '8. Define milestone reporting',
        '9. Create milestone schedule',
        '10. Document milestone commitments'
      ],
      outputFormat: 'JSON object with milestones'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              targetDate: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external', 'contractual', 'phase-gate'] },
              successCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              isCritical: { type: 'boolean' }
            }
          }
        },
        milestoneSchedule: { type: 'string' },
        externalMilestones: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'milestones', 'planning']
}));

export const scheduleBaselineTask = defineTask('schedule-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Schedule Baseline Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Establish approved schedule baseline',
      context: {
        projectName: args.projectName,
        criticalPathAnalysis: args.criticalPathAnalysis,
        resourceLeveling: args.resourceLeveling,
        milestoneDefinition: args.milestoneDefinition,
        constraints: args.constraints,
        projectCalendar: args.projectCalendar
      },
      instructions: [
        '1. Set project start date',
        '2. Apply project calendar (working days, holidays)',
        '3. Calculate calendar dates for all activities',
        '4. Set baseline start and finish dates',
        '5. Document schedule assumptions',
        '6. Define schedule change control process',
        '7. Set schedule variance thresholds',
        '8. Create schedule summary',
        '9. Generate Gantt chart data',
        '10. Document baseline approval requirements'
      ],
      outputFormat: 'JSON object with schedule baseline'
    },
    outputSchema: {
      type: 'object',
      required: ['startDate', 'endDate', 'totalDuration', 'activities'],
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        totalDuration: { type: 'string' },
        workingDays: { type: 'number' },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              name: { type: 'string' },
              baselineStart: { type: 'string' },
              baselineFinish: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        },
        ganttData: { type: 'object' },
        scheduleAssumptions: { type: 'array', items: { type: 'string' } },
        changeControlProcess: { type: 'string' },
        varianceThresholds: {
          type: 'object',
          properties: {
            yellow: { type: 'number' },
            red: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'baseline', 'approval']
}));

export const scheduleDocumentationTask = defineTask('schedule-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Schedule Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Project Manager',
      task: 'Generate comprehensive schedule documentation',
      context: {
        projectName: args.projectName,
        activityDefinition: args.activityDefinition,
        activitySequencing: args.activitySequencing,
        durationEstimation: args.durationEstimation,
        criticalPathAnalysis: args.criticalPathAnalysis,
        resourceLeveling: args.resourceLeveling,
        scheduleCompression: args.scheduleCompression,
        milestoneDefinition: args.milestoneDefinition,
        scheduleBaseline: args.scheduleBaseline
      },
      instructions: [
        '1. Create schedule management plan',
        '2. Document schedule development methodology',
        '3. Include activity list and attributes',
        '4. Document network diagram',
        '5. Include critical path analysis',
        '6. Document resource assignments',
        '7. Include milestone schedule',
        '8. Generate markdown version',
        '9. Calculate completeness score',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with schedule documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'completenessScore'],
      properties: {
        markdown: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schedule', 'documentation', 'deliverable']
}));
