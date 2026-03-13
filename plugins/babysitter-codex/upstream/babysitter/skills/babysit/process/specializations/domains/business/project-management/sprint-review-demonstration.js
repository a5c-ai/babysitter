/**
 * @process specializations/domains/business/project-management/sprint-review-demonstration
 * @description Sprint Review and Demonstration - Plan and conduct sprint reviews, demonstrate completed work,
 * gather stakeholder feedback, and update the product backlog based on review outcomes.
 * @inputs { projectName: string, sprintGoal: string, completedStories: array, stakeholders: array }
 * @outputs { success: boolean, reviewOutcome: object, feedback: array, backlogUpdates: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/sprint-review-demonstration', {
 *   projectName: 'Mobile App v2',
 *   sprintGoal: 'Complete user authentication flow',
 *   completedStories: [{ id: 'US001', title: 'Login screen', points: 5 }],
 *   stakeholders: [{ name: 'Product Owner', role: 'PO' }]
 * });
 *
 * @references
 * - Scrum Guide: https://scrumguides.org/
 * - Agile Alliance Sprint Review: https://www.agilealliance.org/glossary/sprint-review
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sprintGoal,
    completedStories = [],
    stakeholders = [],
    productBacklog = [],
    sprintNumber = 1,
    sprintDuration = '2 weeks'
  } = inputs;

  // Phase 1: Review Preparation
  const reviewPreparation = await ctx.task(reviewPreparationTask, {
    projectName,
    sprintGoal,
    completedStories,
    stakeholders
  });

  // Phase 2: Demonstration Planning
  const demoPlanning = await ctx.task(demoPlanningTask, {
    projectName,
    completedStories,
    demoEnvironment: reviewPreparation.demoEnvironment
  });

  // Phase 3: Acceptance Criteria Verification
  const acceptanceVerification = await ctx.task(acceptanceVerificationTask, {
    projectName,
    completedStories,
    acceptanceCriteria: reviewPreparation.acceptanceCriteria
  });

  // Quality Gate: Check if stories meet definition of done
  const unacceptedStories = acceptanceVerification.results?.filter(r => !r.accepted) || [];
  if (unacceptedStories.length > 0) {
    await ctx.breakpoint({
      question: `${unacceptedStories.length} stories do not meet acceptance criteria for ${projectName}. Review and decide on inclusion?`,
      title: 'Acceptance Criteria Review',
      context: {
        runId: ctx.runId,
        unacceptedCount: unacceptedStories.length,
        files: [{
          path: `artifacts/unaccepted-stories.json`,
          format: 'json',
          content: unacceptedStories
        }]
      }
    });
  }

  // Phase 4: Sprint Metrics Compilation
  const sprintMetrics = await ctx.task(sprintMetricsTask, {
    projectName,
    sprintNumber,
    completedStories,
    sprintGoal
  });

  // Phase 5: Review Execution
  const reviewExecution = await ctx.task(reviewExecutionTask, {
    projectName,
    demoPlanning,
    acceptanceVerification,
    sprintMetrics,
    stakeholders
  });

  // Phase 6: Feedback Collection
  const feedbackCollection = await ctx.task(feedbackCollectionTask, {
    projectName,
    reviewExecution,
    stakeholders
  });

  // Phase 7: Backlog Refinement
  const backlogRefinement = await ctx.task(backlogRefinementTask, {
    projectName,
    feedback: feedbackCollection,
    productBacklog,
    completedStories
  });

  // Phase 8: Outcome Documentation
  const outcomeDocumentation = await ctx.task(outcomeDocumentationTask, {
    projectName,
    sprintNumber,
    sprintGoal,
    reviewExecution,
    feedbackCollection,
    sprintMetrics,
    backlogRefinement
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Sprint ${sprintNumber} review complete for ${projectName}. ${completedStories.length} stories demonstrated, ${feedbackCollection.feedbackItems?.length || 0} feedback items collected. Approve review outcomes?`,
    title: 'Sprint Review Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/sprint-review.json`, format: 'json', content: outcomeDocumentation },
        { path: `artifacts/sprint-review.md`, format: 'markdown', content: outcomeDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    sprintNumber,
    reviewOutcome: {
      goalAchieved: sprintMetrics.goalAchieved,
      storiesCompleted: completedStories.length,
      velocity: sprintMetrics.velocity
    },
    feedback: feedbackCollection.feedbackItems,
    backlogUpdates: backlogRefinement.updates,
    metrics: sprintMetrics,
    documentation: outcomeDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/sprint-review-demonstration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const reviewPreparationTask = defineTask('review-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Review Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Prepare for sprint review',
      context: {
        projectName: args.projectName,
        sprintGoal: args.sprintGoal,
        completedStories: args.completedStories,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Review sprint goal achievement',
        '2. Compile completed stories',
        '3. Identify demonstration items',
        '4. Prepare demo environment',
        '5. Create agenda',
        '6. Send invitations',
        '7. Prepare visual aids',
        '8. Review acceptance criteria',
        '9. Coordinate with team',
        '10. Compile preparation checklist'
      ],
      outputFormat: 'JSON object with review preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['preparationComplete'],
      properties: {
        preparationComplete: { type: 'boolean' },
        agenda: { type: 'array' },
        demoEnvironment: { type: 'object' },
        acceptanceCriteria: { type: 'array' },
        invitees: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'sprint', 'preparation']
}));

export const demoPlanningTask = defineTask('demo-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Demo Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Coordinator',
      task: 'Plan sprint demonstration',
      context: {
        projectName: args.projectName,
        completedStories: args.completedStories,
        demoEnvironment: args.demoEnvironment
      },
      instructions: [
        '1. Sequence demo items',
        '2. Assign demo presenters',
        '3. Create demo scripts',
        '4. Prepare test data',
        '5. Validate demo environment',
        '6. Create backup plan',
        '7. Time each demo segment',
        '8. Prepare talking points',
        '9. Create visual flow',
        '10. Compile demo plan'
      ],
      outputFormat: 'JSON object with demo plan'
    },
    outputSchema: {
      type: 'object',
      required: ['demoPlan'],
      properties: {
        demoPlan: { type: 'object' },
        demoSequence: { type: 'array' },
        presenters: { type: 'array' },
        scripts: { type: 'array' },
        timing: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'demo', 'planning']
}));

export const acceptanceVerificationTask = defineTask('acceptance-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Acceptance Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead',
      task: 'Verify acceptance criteria for completed stories',
      context: {
        projectName: args.projectName,
        completedStories: args.completedStories,
        acceptanceCriteria: args.acceptanceCriteria
      },
      instructions: [
        '1. Review each story',
        '2. Check acceptance criteria',
        '3. Verify definition of done',
        '4. Test functionality',
        '5. Review documentation',
        '6. Check code quality',
        '7. Validate user experience',
        '8. Document verification results',
        '9. Flag incomplete items',
        '10. Compile verification report'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              accepted: { type: 'boolean' },
              criteriaStatus: { type: 'array' },
              notes: { type: 'string' }
            }
          }
        },
        acceptedCount: { type: 'number' },
        rejectedCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'acceptance', 'verification']
}));

export const sprintMetricsTask = defineTask('sprint-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sprint Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Analyst',
      task: 'Compile sprint metrics',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        completedStories: args.completedStories,
        sprintGoal: args.sprintGoal
      },
      instructions: [
        '1. Calculate velocity',
        '2. Measure goal achievement',
        '3. Track story completion rate',
        '4. Calculate burndown accuracy',
        '5. Measure cycle time',
        '6. Calculate throughput',
        '7. Compare to previous sprints',
        '8. Identify trends',
        '9. Calculate predictability',
        '10. Compile metrics summary'
      ],
      outputFormat: 'JSON object with sprint metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['velocity', 'goalAchieved'],
      properties: {
        velocity: { type: 'number' },
        goalAchieved: { type: 'boolean' },
        completionRate: { type: 'number' },
        cycleTime: { type: 'number' },
        throughput: { type: 'number' },
        trends: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'metrics', 'velocity']
}));

export const reviewExecutionTask = defineTask('review-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Review Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Review Facilitator',
      task: 'Execute sprint review session',
      context: {
        projectName: args.projectName,
        demoPlanning: args.demoPlanning,
        acceptanceVerification: args.acceptanceVerification,
        sprintMetrics: args.sprintMetrics,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Open review session',
        '2. Present sprint goal',
        '3. Review team accomplishments',
        '4. Execute demonstrations',
        '5. Highlight key features',
        '6. Present metrics',
        '7. Discuss challenges',
        '8. Facilitate Q&A',
        '9. Document decisions',
        '10. Compile review notes'
      ],
      outputFormat: 'JSON object with review execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewComplete'],
      properties: {
        reviewComplete: { type: 'boolean' },
        attendees: { type: 'array' },
        demonstratedItems: { type: 'array' },
        decisions: { type: 'array' },
        notes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'review', 'execution']
}));

export const feedbackCollectionTask = defineTask('feedback-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Feedback Collection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Feedback Coordinator',
      task: 'Collect and organize stakeholder feedback',
      context: {
        projectName: args.projectName,
        reviewExecution: args.reviewExecution,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Gather verbal feedback',
        '2. Collect written feedback',
        '3. Document suggestions',
        '4. Capture concerns',
        '5. Record change requests',
        '6. Document priorities',
        '7. Categorize feedback',
        '8. Identify patterns',
        '9. Prioritize items',
        '10. Compile feedback summary'
      ],
      outputFormat: 'JSON object with collected feedback'
    },
    outputSchema: {
      type: 'object',
      required: ['feedbackItems'],
      properties: {
        feedbackItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        patterns: { type: 'array' },
        changeRequests: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'feedback', 'stakeholder']
}));

export const backlogRefinementTask = defineTask('backlog-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Backlog Refinement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Owner',
      task: 'Refine backlog based on review feedback',
      context: {
        projectName: args.projectName,
        feedback: args.feedback,
        productBacklog: args.productBacklog,
        completedStories: args.completedStories
      },
      instructions: [
        '1. Review all feedback',
        '2. Create new stories',
        '3. Update existing stories',
        '4. Adjust priorities',
        '5. Remove obsolete items',
        '6. Refine estimates',
        '7. Update acceptance criteria',
        '8. Link dependencies',
        '9. Update roadmap',
        '10. Compile backlog updates'
      ],
      outputFormat: 'JSON object with backlog updates'
    },
    outputSchema: {
      type: 'object',
      required: ['updates'],
      properties: {
        updates: { type: 'array' },
        newStories: { type: 'array' },
        priorityChanges: { type: 'array' },
        removedItems: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'backlog', 'refinement']
}));

export const outcomeDocumentationTask = defineTask('outcome-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Outcome Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Document sprint review outcomes',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintGoal: args.sprintGoal,
        reviewExecution: args.reviewExecution,
        feedbackCollection: args.feedbackCollection,
        sprintMetrics: args.sprintMetrics,
        backlogRefinement: args.backlogRefinement
      },
      instructions: [
        '1. Create review summary',
        '2. Document demonstrated items',
        '3. Record stakeholder feedback',
        '4. Document decisions',
        '5. Summarize metrics',
        '6. List backlog changes',
        '7. Generate markdown report',
        '8. Add action items',
        '9. Create visual summary',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with review documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        summary: { type: 'string' },
        actionItems: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile', 'documentation', 'review']
}));
