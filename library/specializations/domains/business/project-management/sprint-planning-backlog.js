/**
 * @process specializations/domains/business/project-management/sprint-planning-backlog
 * @description Sprint Planning and Backlog Refinement - Facilitate sprint planning sessions, refine
 * product backlog, estimate user stories, and establish sprint goals and commitments.
 * @inputs { projectName: string, productBacklog: array, teamCapacity: object, sprintDuration?: number }
 * @outputs { success: boolean, sprintPlan: object, refinedBacklog: array, sprintGoal: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/sprint-planning-backlog', {
 *   projectName: 'Customer Portal Redesign',
 *   productBacklog: [{ id: 'US-001', title: 'User login', priority: 1 }, ...],
 *   teamCapacity: { developers: 4, totalHours: 320, velocity: 34 },
 *   sprintDuration: 14
 * });
 *
 * @references
 * - Scrum Guide: https://scrumguides.org/
 * - Agile Estimating and Planning: https://www.mountaingoatsoftware.com/books/agile-estimating-and-planning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productBacklog = [],
    teamCapacity,
    sprintDuration = 14,
    previousVelocity = [],
    definitionOfReady = [],
    definitionOfDone = [],
    sprintNumber = 1
  } = inputs;

  // Phase 1: Backlog Health Assessment
  const backlogHealth = await ctx.task(backlogHealthAssessmentTask, {
    projectName,
    productBacklog,
    definitionOfReady
  });

  // Quality Gate: Sufficient ready items
  const readyItems = backlogHealth.readyItems || [];
  if (readyItems.length < 5) {
    await ctx.breakpoint({
      question: `Only ${readyItems.length} backlog items meet Definition of Ready. Proceed with refinement or pause planning?`,
      title: 'Backlog Readiness Warning',
      context: {
        runId: ctx.runId,
        readyCount: readyItems.length,
        notReadyCount: backlogHealth.notReadyItems?.length || 0,
        recommendation: 'Conduct backlog refinement before sprint planning'
      }
    });
  }

  // Breakpoint: Review backlog health
  await ctx.breakpoint({
    question: `Backlog health assessed for ${projectName}. Ready items: ${readyItems.length}. Health score: ${backlogHealth.healthScore}/100. Proceed with refinement?`,
    title: 'Backlog Health Review',
    context: {
      runId: ctx.runId,
      projectName,
      healthScore: backlogHealth.healthScore,
      readyItems: readyItems.length,
      files: [{
        path: `artifacts/phase1-backlog-health.json`,
        format: 'json',
        content: backlogHealth
      }]
    }
  });

  // Phase 2: Backlog Refinement
  const refinedBacklog = await ctx.task(backlogRefinementTask, {
    projectName,
    productBacklog,
    backlogHealth,
    definitionOfReady
  });

  // Phase 3: Story Point Estimation
  const estimatedBacklog = await ctx.task(storyPointEstimationTask, {
    projectName,
    refinedBacklog: refinedBacklog.items,
    teamCapacity
  });

  // Phase 4: Velocity Analysis
  const velocityAnalysis = await ctx.task(velocityAnalysisTask, {
    projectName,
    previousVelocity,
    teamCapacity,
    sprintDuration
  });

  // Phase 5: Sprint Goal Definition
  const sprintGoal = await ctx.task(sprintGoalDefinitionTask, {
    projectName,
    estimatedBacklog: estimatedBacklog.items,
    velocityAnalysis,
    sprintNumber
  });

  // Phase 6: Sprint Backlog Selection
  const sprintBacklogSelection = await ctx.task(sprintBacklogSelectionTask, {
    projectName,
    estimatedBacklog: estimatedBacklog.items,
    sprintGoal,
    velocityAnalysis,
    teamCapacity
  });

  // Quality Gate: Sprint commitment within capacity
  const commitmentPoints = sprintBacklogSelection.totalPoints || 0;
  const targetVelocity = velocityAnalysis.targetVelocity || 0;
  if (commitmentPoints > targetVelocity * 1.1) {
    await ctx.breakpoint({
      question: `Sprint commitment (${commitmentPoints} points) exceeds target velocity (${targetVelocity}) by more than 10%. Reduce scope?`,
      title: 'Over-Commitment Warning',
      context: {
        runId: ctx.runId,
        commitment: commitmentPoints,
        targetVelocity,
        recommendation: 'Remove lower priority items or split stories'
      }
    });
  }

  // Phase 7: Task Breakdown
  const taskBreakdown = await ctx.task(taskBreakdownTask, {
    projectName,
    sprintBacklog: sprintBacklogSelection.selectedItems,
    teamCapacity
  });

  // Phase 8: Capacity Allocation
  const capacityAllocation = await ctx.task(capacityAllocationTask, {
    projectName,
    taskBreakdown,
    teamCapacity,
    sprintDuration
  });

  // Phase 9: Risk and Dependency Analysis
  const sprintRiskAnalysis = await ctx.task(sprintRiskAnalysisTask, {
    projectName,
    sprintBacklog: sprintBacklogSelection.selectedItems,
    taskBreakdown,
    capacityAllocation
  });

  // Phase 10: Sprint Plan Finalization
  const sprintPlan = await ctx.task(sprintPlanFinalizationTask, {
    projectName,
    sprintNumber,
    sprintDuration,
    sprintGoal,
    sprintBacklogSelection,
    taskBreakdown,
    capacityAllocation,
    sprintRiskAnalysis,
    definitionOfDone
  });

  // Final Quality Gate
  const planReadinessScore = sprintPlan.readinessScore || 0;
  const ready = planReadinessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Sprint ${sprintNumber} planning complete for ${projectName}. Goal: "${sprintGoal.goal}". Commitment: ${commitmentPoints} points. Readiness: ${planReadinessScore}/100. Start sprint?`,
    title: 'Sprint Plan Approval',
    context: {
      runId: ctx.runId,
      projectName,
      sprintNumber,
      sprintGoal: sprintGoal.goal,
      commitment: commitmentPoints,
      stories: sprintBacklogSelection.selectedItems.length,
      tasks: taskBreakdown.totalTasks,
      files: [
        { path: `artifacts/sprint-${sprintNumber}-plan.json`, format: 'json', content: sprintPlan },
        { path: `artifacts/sprint-${sprintNumber}-plan.md`, format: 'markdown', content: sprintPlan.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    sprintNumber,
    readinessScore: planReadinessScore,
    ready,
    sprintPlan: {
      sprintNumber,
      duration: sprintDuration,
      goal: sprintGoal.goal,
      startDate: sprintPlan.startDate,
      endDate: sprintPlan.endDate,
      commitment: {
        totalPoints: commitmentPoints,
        storyCount: sprintBacklogSelection.selectedItems.length,
        taskCount: taskBreakdown.totalTasks
      },
      sprintBacklog: sprintBacklogSelection.selectedItems,
      tasks: taskBreakdown.tasks,
      capacityUtilization: capacityAllocation.utilizationPercent
    },
    refinedBacklog: refinedBacklog.items,
    sprintGoal: sprintGoal.goal,
    velocityForecast: velocityAnalysis.targetVelocity,
    risks: sprintRiskAnalysis.risks,
    recommendations: sprintPlan.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/sprint-planning-backlog',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const backlogHealthAssessmentTask = defineTask('backlog-health-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Backlog Health Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach',
      task: 'Assess product backlog health and readiness for sprint planning',
      context: {
        projectName: args.projectName,
        productBacklog: args.productBacklog,
        definitionOfReady: args.definitionOfReady
      },
      instructions: [
        '1. Check each item against Definition of Ready criteria',
        '2. Identify items that are ready for sprint planning',
        '3. Identify items needing refinement',
        '4. Assess backlog prioritization clarity',
        '5. Check for proper user story format',
        '6. Verify acceptance criteria completeness',
        '7. Assess estimation status (sized vs unsized)',
        '8. Check for dependencies between items',
        '9. Calculate backlog health score',
        '10. Provide refinement recommendations'
      ],
      outputFormat: 'JSON object with backlog health assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['healthScore', 'readyItems', 'notReadyItems'],
      properties: {
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        readyItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'number' },
              points: { type: 'number' }
            }
          }
        },
        notReadyItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              missingCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritizationClarity: { type: 'string', enum: ['clear', 'needs-work', 'unclear'] },
        estimationStatus: {
          type: 'object',
          properties: {
            sized: { type: 'number' },
            unsized: { type: 'number' }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        refinementNeeded: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'backlog', 'assessment', 'sprint-planning']
}));

export const backlogRefinementTask = defineTask('backlog-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Backlog Refinement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Owner / Agile Coach',
      task: 'Refine backlog items to meet Definition of Ready',
      context: {
        projectName: args.projectName,
        productBacklog: args.productBacklog,
        backlogHealth: args.backlogHealth,
        definitionOfReady: args.definitionOfReady
      },
      instructions: [
        '1. Review items needing refinement',
        '2. Clarify user story descriptions',
        '3. Add or improve acceptance criteria',
        '4. Break down large stories (epics) into smaller stories',
        '5. Identify and document dependencies',
        '6. Add technical details where needed',
        '7. Verify business value is clear',
        '8. Ensure stories are testable',
        '9. Update priority rankings',
        '10. Mark items as ready when criteria met'
      ],
      outputFormat: 'JSON object with refined backlog'
    },
    outputSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              priority: { type: 'number' },
              businessValue: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              technicalNotes: { type: 'string' },
              isReady: { type: 'boolean' },
              refinementNotes: { type: 'string' }
            }
          }
        },
        storiesSplit: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalId: { type: 'string' },
              newStories: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        refinementSummary: {
          type: 'object',
          properties: {
            itemsRefined: { type: 'number' },
            itemsSplit: { type: 'number' },
            newReadyItems: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'backlog-refinement', 'user-stories']
}));

export const storyPointEstimationTask = defineTask('story-point-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Story Point Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master / Estimation Facilitator',
      task: 'Facilitate story point estimation for backlog items',
      context: {
        projectName: args.projectName,
        refinedBacklog: args.refinedBacklog,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. Use Fibonacci sequence for estimation (1, 2, 3, 5, 8, 13, 21)',
        '2. Consider complexity, effort, and uncertainty',
        '3. Use reference stories for calibration',
        '4. Identify stories needing splitting (>13 points)',
        '5. Document estimation rationale',
        '6. Flag items with high uncertainty',
        '7. Consider team skill mix for estimates',
        '8. Apply Planning Poker methodology',
        '9. Document estimation assumptions',
        '10. Calculate total points for ready items'
      ],
      outputFormat: 'JSON object with estimated backlog'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'totalPoints'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
              estimationRationale: { type: 'string' },
              needsSplitting: { type: 'boolean' }
            }
          }
        },
        totalPoints: { type: 'number' },
        referenceStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              points: { type: 'number' },
              reference: { type: 'string' }
            }
          }
        },
        highUncertaintyItems: { type: 'array', items: { type: 'string' } },
        estimationAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'estimation', 'story-points']
}));

export const velocityAnalysisTask = defineTask('velocity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Velocity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Metrics Analyst',
      task: 'Analyze team velocity and forecast sprint capacity',
      context: {
        projectName: args.projectName,
        previousVelocity: args.previousVelocity,
        teamCapacity: args.teamCapacity,
        sprintDuration: args.sprintDuration
      },
      instructions: [
        '1. Calculate average velocity from previous sprints',
        '2. Identify velocity trends (improving, stable, declining)',
        '3. Account for team capacity changes',
        '4. Consider holidays, PTO, and other factors',
        '5. Calculate target velocity for upcoming sprint',
        '6. Determine velocity confidence range',
        '7. Identify factors affecting velocity',
        '8. Calculate capacity-based velocity limit',
        '9. Recommend sustainable pace',
        '10. Document velocity assumptions'
      ],
      outputFormat: 'JSON object with velocity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['targetVelocity', 'confidenceRange'],
      properties: {
        historicalVelocity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'number' },
              committed: { type: 'number' },
              completed: { type: 'number' }
            }
          }
        },
        averageVelocity: { type: 'number' },
        velocityTrend: { type: 'string', enum: ['improving', 'stable', 'declining', 'volatile'] },
        targetVelocity: { type: 'number' },
        confidenceRange: {
          type: 'object',
          properties: {
            low: { type: 'number' },
            likely: { type: 'number' },
            high: { type: 'number' }
          }
        },
        capacityAdjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        sustainablePace: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'velocity', 'metrics', 'capacity']
}));

export const sprintGoalDefinitionTask = defineTask('sprint-goal-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Sprint Goal Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Owner',
      task: 'Define clear and focused sprint goal',
      context: {
        projectName: args.projectName,
        estimatedBacklog: args.estimatedBacklog,
        velocityAnalysis: args.velocityAnalysis,
        sprintNumber: args.sprintNumber
      },
      instructions: [
        '1. Identify the business value focus for the sprint',
        '2. Craft concise sprint goal statement',
        '3. Ensure goal is achievable within sprint capacity',
        '4. Align goal with product roadmap',
        '5. Make goal measurable and testable',
        '6. Identify stories that support the goal',
        '7. Document goal success criteria',
        '8. Ensure team can rally around the goal',
        '9. Identify what is NOT part of the goal',
        '10. Create goal communication message'
      ],
      outputFormat: 'JSON object with sprint goal'
    },
    outputSchema: {
      type: 'object',
      required: ['goal', 'supportingStories', 'successCriteria'],
      properties: {
        goal: { type: 'string' },
        businessValue: { type: 'string' },
        supportingStories: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        roadmapAlignment: { type: 'string' },
        notIncluded: { type: 'array', items: { type: 'string' } },
        communicationMessage: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'sprint-goal', 'planning']
}));

export const sprintBacklogSelectionTask = defineTask('sprint-backlog-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Sprint Backlog Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Select stories for sprint backlog based on goal and capacity',
      context: {
        projectName: args.projectName,
        estimatedBacklog: args.estimatedBacklog,
        sprintGoal: args.sprintGoal,
        velocityAnalysis: args.velocityAnalysis,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. Prioritize stories that support sprint goal',
        '2. Select stories up to target velocity',
        '3. Consider story dependencies',
        '4. Balance technical debt with features',
        '5. Ensure skill coverage for selected stories',
        '6. Leave buffer for unknowns (10-15%)',
        '7. Document selection rationale',
        '8. Identify stretch goals if capacity allows',
        '9. Confirm team commitment',
        '10. Calculate total commitment'
      ],
      outputFormat: 'JSON object with sprint backlog selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedItems', 'totalPoints'],
      properties: {
        selectedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' },
              priority: { type: 'number' },
              supportsGoal: { type: 'boolean' },
              selectionRationale: { type: 'string' }
            }
          }
        },
        totalPoints: { type: 'number' },
        stretchItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' }
            }
          }
        },
        notSelectedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        capacityUtilization: { type: 'number' },
        technicalDebtIncluded: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'sprint-backlog', 'selection']
}));

export const taskBreakdownTask = defineTask('task-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Task Breakdown - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Development Team Lead',
      task: 'Break down user stories into implementable tasks',
      context: {
        projectName: args.projectName,
        sprintBacklog: args.sprintBacklog,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. Break each story into technical tasks',
        '2. Estimate task hours (ideally 2-8 hours)',
        '3. Identify task types (dev, test, design, etc.)',
        '4. Document task dependencies',
        '5. Identify tasks that can be parallelized',
        '6. Include testing tasks for each story',
        '7. Include code review tasks',
        '8. Add deployment/integration tasks',
        '9. Calculate total hours per story',
        '10. Verify tasks cover all acceptance criteria'
      ],
      outputFormat: 'JSON object with task breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'totalTasks', 'totalHours'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              storyId: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['development', 'testing', 'design', 'review', 'deployment', 'documentation', 'other'] },
              estimatedHours: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } },
              skills: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalTasks: { type: 'number' },
        totalHours: { type: 'number' },
        tasksByType: { type: 'object' },
        storyTaskMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              taskCount: { type: 'number' },
              totalHours: { type: 'number' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'task-breakdown', 'planning']
}));

export const capacityAllocationTask = defineTask('capacity-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Capacity Allocation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Allocate team capacity to sprint tasks',
      context: {
        projectName: args.projectName,
        taskBreakdown: args.taskBreakdown,
        teamCapacity: args.teamCapacity,
        sprintDuration: args.sprintDuration
      },
      instructions: [
        '1. Calculate individual team member capacity',
        '2. Match tasks to team member skills',
        '3. Balance workload across team',
        '4. Account for meetings and ceremonies',
        '5. Reserve time for unexpected issues (buffer)',
        '6. Identify capacity constraints',
        '7. Calculate utilization percentages',
        '8. Identify bottleneck skills',
        '9. Create initial task assignments',
        '10. Verify sustainable pace'
      ],
      outputFormat: 'JSON object with capacity allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['teamAllocation', 'utilizationPercent'],
      properties: {
        teamAllocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              availableHours: { type: 'number' },
              allocatedHours: { type: 'number' },
              utilization: { type: 'number' },
              tasks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        utilizationPercent: { type: 'number' },
        ceremonyTime: { type: 'number' },
        bufferTime: { type: 'number' },
        bottleneckSkills: { type: 'array', items: { type: 'string' } },
        capacityRisks: { type: 'array', items: { type: 'string' } },
        sustainablePaceCheck: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'capacity', 'allocation']
}));

export const sprintRiskAnalysisTask = defineTask('sprint-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Sprint Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Identify and assess sprint-level risks',
      context: {
        projectName: args.projectName,
        sprintBacklog: args.sprintBacklog,
        taskBreakdown: args.taskBreakdown,
        capacityAllocation: args.capacityAllocation
      },
      instructions: [
        '1. Identify risks to sprint goal achievement',
        '2. Assess dependency risks',
        '3. Evaluate capacity and skill risks',
        '4. Identify technical risks in stories',
        '5. Consider external dependencies',
        '6. Assess estimation uncertainty',
        '7. Identify scope creep risks',
        '8. Evaluate team availability risks',
        '9. Develop risk mitigation strategies',
        '10. Create sprint risk register'
      ],
      outputFormat: 'JSON object with sprint risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'overallRiskLevel'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' },
              affectedStories: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallRiskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        topRisks: { type: 'array', items: { type: 'string' } },
        mitigationPlan: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'sprint-risk', 'analysis']
}));

export const sprintPlanFinalizationTask = defineTask('sprint-plan-finalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Sprint Plan Finalization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Finalize and document sprint plan',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintDuration: args.sprintDuration,
        sprintGoal: args.sprintGoal,
        sprintBacklogSelection: args.sprintBacklogSelection,
        taskBreakdown: args.taskBreakdown,
        capacityAllocation: args.capacityAllocation,
        sprintRiskAnalysis: args.sprintRiskAnalysis,
        definitionOfDone: args.definitionOfDone
      },
      instructions: [
        '1. Compile complete sprint plan document',
        '2. Set sprint start and end dates',
        '3. Document sprint goal and commitment',
        '4. Include sprint backlog with tasks',
        '5. Document capacity allocation',
        '6. Include risk register',
        '7. Set sprint ceremonies schedule',
        '8. Document Definition of Done',
        '9. Generate markdown version',
        '10. Calculate plan readiness score'
      ],
      outputFormat: 'JSON object with finalized sprint plan'
    },
    outputSchema: {
      type: 'object',
      required: ['startDate', 'endDate', 'markdown', 'readinessScore'],
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        ceremonies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ceremony: { type: 'string' },
              date: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        markdown: { type: 'string' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        teamCommitment: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'sprint-plan', 'finalization']
}));
