/**
 * @process methodologies/scrum
 * @description Scrum - Iterative agile framework with sprints, roles, and ceremonies
 * @inputs { projectName: string, productVision: string, sprintDuration: number, sprintCount: number, teamSize: number, backlogItems?: array }
 * @outputs { success: boolean, productBacklog: object, sprints: array, velocityMetrics: object, retrospectives: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Scrum Process
 *
 * Created by Ken Schwaber and Jeff Sutherland (1995)
 *
 * Scrum is an agile framework for developing, delivering, and sustaining complex products
 * through iterative progress via sprints (timeboxed iterations). It emphasizes empirical
 * process control with transparency, inspection, and adaptation.
 *
 * Three Roles:
 * 1. Product Owner - Maximizes product value, manages Product Backlog
 * 2. Scrum Master - Facilitates Scrum, removes impediments
 * 3. Development Team - Delivers potentially releasable Increment
 *
 * Five Events:
 * 1. Sprint - Container for all events (1-4 weeks, commonly 2 weeks)
 * 2. Sprint Planning - Plan work for sprint (max 8 hours for 1-month sprint)
 * 3. Daily Scrum - 15-minute daily synchronization
 * 4. Sprint Review - Inspect Increment, adapt Product Backlog
 * 5. Sprint Retrospective - Plan improvements for next sprint
 *
 * Three Artifacts:
 * 1. Product Backlog - Ordered list of everything needed in product
 * 2. Sprint Backlog - Product Backlog Items selected for Sprint + plan
 * 3. Increment - Sum of all Product Backlog Items completed during Sprint
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/product
 * @param {string} inputs.productVision - High-level product vision and goals
 * @param {number} inputs.sprintDuration - Sprint length in weeks (default: 2)
 * @param {number} inputs.sprintCount - Number of sprints to plan (default: 6)
 * @param {number} inputs.teamSize - Development team size (default: 7, recommended 3-9)
 * @param {Array<Object>} inputs.backlogItems - Pre-defined Product Backlog Items (optional)
 * @param {string} inputs.productOwner - Product Owner name (default: generated)
 * @param {string} inputs.scrumMaster - Scrum Master name (default: generated)
 * @param {string} inputs.definitionOfDone - Definition of Done criteria (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with product backlog, sprints, velocity metrics
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    productVision,
    sprintDuration = 2,
    sprintCount = 6,
    teamSize = 7,
    backlogItems: predefinedBacklog = null,
    productOwner = 'Product Owner',
    scrumMaster = 'Scrum Master',
    definitionOfDone = null
  } = inputs;

  // ============================================================================
  // INITIAL SETUP: DEFINITION OF DONE
  // ============================================================================

  const definitionOfDoneResult = await ctx.task(establishDefinitionOfDoneTask, {
    projectName,
    productVision,
    customDefinition: definitionOfDone
  });

  // ============================================================================
  // PRODUCT BACKLOG CREATION & REFINEMENT
  // ============================================================================

  const productBacklogResult = await ctx.task(createProductBacklogTask, {
    projectName,
    productVision,
    predefinedBacklog,
    definitionOfDone: definitionOfDoneResult
  });

  // Breakpoint: Review initial Product Backlog
  await ctx.breakpoint({
    question: `Review the initial Product Backlog for "${projectName}". ${productBacklogResult.totalItems} Product Backlog Items identified and prioritized by business value. Approve to begin sprint planning?`,
    title: 'Product Backlog Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/scrum/product-backlog.md', format: 'markdown', label: 'Product Backlog' },
        { path: 'artifacts/scrum/product-backlog.json', format: 'code', language: 'json', label: 'Backlog Data' },
        { path: 'artifacts/scrum/definition-of-done.md', format: 'markdown', label: 'Definition of Done' }
      ]
    }
  });

  // ============================================================================
  // SPRINT CYCLES
  // ============================================================================

  const sprintResults = [];
  let currentVelocity = 0;
  let remainingBacklog = [...productBacklogResult.items];

  for (let sprintIdx = 0; sprintIdx < sprintCount; sprintIdx++) {
    const sprintNumber = sprintIdx + 1;

    // ========================================================================
    // BACKLOG REFINEMENT (Before Sprint Planning)
    // ========================================================================

    if (sprintIdx > 0) {
      const refinementResult = await ctx.task(backlogRefinementTask, {
        projectName,
        productBacklog: remainingBacklog,
        completedSprints: sprintResults,
        sprintNumber,
        productOwner
      });

      remainingBacklog = refinementResult.refinedBacklog;
    }

    // ========================================================================
    // SPRINT PLANNING
    // ========================================================================

    const sprintPlanningResult = await ctx.task(sprintPlanningTask, {
      projectName,
      sprintNumber,
      sprintDuration,
      productBacklog: remainingBacklog,
      teamSize,
      previousVelocity: currentVelocity,
      definitionOfDone: definitionOfDoneResult,
      productOwner,
      scrumMaster
    });

    // Breakpoint: Review Sprint Plan
    await ctx.breakpoint({
      question: `Review Sprint ${sprintNumber} plan. Sprint Goal: "${sprintPlanningResult.sprintGoal}". ${sprintPlanningResult.selectedItems.length} PBIs selected with ${sprintPlanningResult.totalStoryPoints} story points. Team committed to deliver potentially shippable increment. Approve to start sprint?`,
      title: `Sprint ${sprintNumber} Planning Review`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/scrum/sprint-${sprintNumber}/sprint-plan.md`, format: 'markdown', label: 'Sprint Plan' },
          { path: `artifacts/scrum/sprint-${sprintNumber}/sprint-backlog.json`, format: 'code', language: 'json', label: 'Sprint Backlog' }
        ]
      }
    });

    // ========================================================================
    // SPRINT EXECUTION (Daily Scrums)
    // ========================================================================

    const sprintData = {
      sprintNumber,
      sprintGoal: sprintPlanningResult.sprintGoal,
      startDate: ctx.now(),
      duration: sprintDuration,
      sprintBacklog: sprintPlanningResult.selectedItems,
      tasks: sprintPlanningResult.tasks,
      totalStoryPoints: sprintPlanningResult.totalStoryPoints
    };

    // Simulate daily scrums over sprint duration
    const workingDays = sprintDuration * 5; // 5 working days per week
    const dailyScrumResults = [];

    for (let day = 1; day <= workingDays; day++) {
      const dailyScrumResult = await ctx.task(dailyScrumTask, {
        projectName,
        sprintNumber,
        day,
        totalDays: workingDays,
        sprintBacklog: sprintData.sprintBacklog,
        tasks: sprintData.tasks,
        impediments: dailyScrumResults.flatMap(d => d.impediments || []),
        scrumMaster
      });

      dailyScrumResults.push(dailyScrumResult);

      // Update task status
      sprintData.tasks = dailyScrumResult.updatedTasks;
    }

    sprintData.dailyScrums = dailyScrumResults;

    // Generate burndown chart
    const burndownResult = await ctx.task(generateBurndownTask, {
      projectName,
      sprintNumber,
      sprintDuration,
      dailyScrums: dailyScrumResults,
      totalStoryPoints: sprintData.totalStoryPoints
    });

    sprintData.burndown = burndownResult;

    // ========================================================================
    // SPRINT REVIEW
    // ========================================================================

    const sprintReviewResult = await ctx.task(sprintReviewTask, {
      projectName,
      sprintNumber,
      sprintGoal: sprintData.sprintGoal,
      sprintBacklog: sprintData.sprintBacklog,
      completedItems: dailyScrumResults[dailyScrumResults.length - 1].completedItems || [],
      increment: dailyScrumResults[dailyScrumResults.length - 1].increment,
      definitionOfDone: definitionOfDoneResult,
      productOwner,
      teamSize
    });

    sprintData.review = sprintReviewResult;

    // Breakpoint: Review Sprint Increment
    await ctx.breakpoint({
      question: `Sprint ${sprintNumber} Review: ${sprintReviewResult.completedStoryPoints}/${sprintData.totalStoryPoints} story points completed. Demo increment and gather stakeholder feedback. Product Backlog updated based on learnings. Approve to proceed with retrospective?`,
      title: `Sprint ${sprintNumber} Review`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/scrum/sprint-${sprintNumber}/sprint-review.md`, format: 'markdown', label: 'Sprint Review' },
          { path: `artifacts/scrum/sprint-${sprintNumber}/increment.md`, format: 'markdown', label: 'Increment' },
          { path: `artifacts/scrum/sprint-${sprintNumber}/burndown.svg`, format: 'image', label: 'Burndown Chart' }
        ]
      }
    });

    // ========================================================================
    // SPRINT RETROSPECTIVE
    // ========================================================================

    const retrospectiveResult = await ctx.task(sprintRetrospectiveTask, {
      projectName,
      sprintNumber,
      sprintData,
      dailyScrums: dailyScrumResults,
      review: sprintReviewResult,
      scrumMaster,
      teamSize
    });

    sprintData.retrospective = retrospectiveResult;
    sprintData.endDate = ctx.now();

    // Breakpoint: Review Sprint Retrospective
    await ctx.breakpoint({
      question: `Sprint ${sprintNumber} Retrospective complete. Team identified ${retrospectiveResult.improvements.length} improvements to implement in next sprint. Velocity: ${sprintReviewResult.velocity} story points. Ready for next sprint?`,
      title: `Sprint ${sprintNumber} Retrospective`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/scrum/sprint-${sprintNumber}/retrospective.md`, format: 'markdown', label: 'Retrospective' },
          { path: `artifacts/scrum/sprint-${sprintNumber}/action-items.json`, format: 'code', language: 'json', label: 'Action Items' }
        ]
      }
    });

    // Update velocity and remaining backlog
    currentVelocity = sprintReviewResult.velocity;
    remainingBacklog = remainingBacklog.filter(
      item => !sprintReviewResult.completedItemIds.includes(item.id)
    );

    // Add Product Backlog updates from Sprint Review
    if (sprintReviewResult.newBacklogItems) {
      remainingBacklog.push(...sprintReviewResult.newBacklogItems);
    }

    sprintResults.push(sprintData);
  }

  // ============================================================================
  // FINAL METRICS & SUMMARY
  // ============================================================================

  const velocityMetrics = calculateVelocityMetrics(sprintResults);
  const releaseBurndown = generateReleaseBurndown(productBacklogResult, sprintResults);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Scrum process complete for "${projectName}". ${sprintCount} sprints executed with average velocity of ${velocityMetrics.averageVelocity.toFixed(1)} story points per sprint. ${velocityMetrics.totalCompletedStoryPoints} story points delivered. Review final metrics and release burndown?`,
    title: 'Scrum Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/scrum/product-backlog.md', format: 'markdown', label: 'Final Product Backlog' },
        { path: 'artifacts/scrum/velocity-chart.svg', format: 'image', label: 'Velocity Chart' },
        { path: 'artifacts/scrum/release-burndown.svg', format: 'image', label: 'Release Burndown' },
        { path: 'artifacts/scrum/final-summary.md', format: 'markdown', label: 'Summary' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    productVision,
    productBacklog: {
      initial: productBacklogResult,
      final: remainingBacklog
    },
    definitionOfDone: definitionOfDoneResult,
    sprints: sprintResults,
    velocityMetrics,
    releaseBurndown,
    retrospectives: sprintResults.map(s => s.retrospective),
    roles: {
      productOwner,
      scrumMaster,
      teamSize
    },
    metrics: {
      sprintCount,
      sprintDuration,
      averageVelocity: velocityMetrics.averageVelocity,
      totalStoryPoints: velocityMetrics.totalCompletedStoryPoints,
      totalBacklogItems: productBacklogResult.totalItems,
      completedBacklogItems: velocityMetrics.totalCompletedItems,
      completionRate: (velocityMetrics.totalCompletedItems / productBacklogResult.totalItems) * 100
    },
    artifacts: {
      productBacklog: 'artifacts/scrum/product-backlog.md',
      definitionOfDone: 'artifacts/scrum/definition-of-done.md',
      velocityChart: 'artifacts/scrum/velocity-chart.svg',
      releaseBurndown: 'artifacts/scrum/release-burndown.svg',
      summary: 'artifacts/scrum/final-summary.md'
    },
    metadata: {
      processId: 'methodologies/scrum',
      timestamp: ctx.now(),
      framework: 'Scrum',
      version: '2020 Scrum Guide'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Establish Definition of Done
 * Define criteria that must be met for Product Backlog Items to be considered "Done"
 */
export const establishDefinitionOfDoneTask = defineTask('establish-definition-of-done', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish Definition of Done: ${args.projectName}`,
  description: 'Create clear Definition of Done criteria for the team',

  agent: {
    name: 'scrum-master',
    prompt: {
      role: 'experienced Scrum Master',
      task: 'Establish comprehensive Definition of Done for the team',
      context: {
        projectName: args.projectName,
        productVision: args.productVision,
        customDefinition: args.customDefinition
      },
      instructions: [
        'Define what "Done" means for this team and product',
        'Include technical criteria: code complete, tests passing, code reviewed',
        'Include quality criteria: no known defects, meets acceptance criteria',
        'Include documentation criteria: user docs updated, API docs complete',
        'Include deployment criteria: potentially shippable, deployed to staging',
        'Ensure Definition of Done is clear, measurable, and achievable',
        'Align with organizational standards if provided',
        'Make it specific to the product context',
        'Ensure it creates a potentially releasable Increment',
        'Get team agreement on the definition'
      ],
      outputFormat: 'JSON with Definition of Done criteria, checklist, and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'checklist'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        checklist: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        organizationalAlignment: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/scrum/definition-of-done.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'scrum', 'definition-of-done', 'setup']
}));

/**
 * Create and prioritize Product Backlog
 * Product Owner creates ordered list of everything needed in product
 */
export const createProductBacklogTask = defineTask('create-product-backlog', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Product Backlog: ${args.projectName}`,
  description: 'Build and prioritize initial Product Backlog',

  agent: {
    name: 'product-owner',
    prompt: {
      role: 'Product Owner responsible for maximizing product value',
      task: 'Create comprehensive Product Backlog ordered by business value',
      context: {
        projectName: args.projectName,
        productVision: args.productVision,
        predefinedBacklog: args.predefinedBacklog,
        definitionOfDone: args.definitionOfDone
      },
      instructions: [
        'Identify all Product Backlog Items (PBIs) needed to realize the vision',
        'Write PBIs as user stories: "As a [role], I want [feature], so that [benefit]"',
        'Include acceptance criteria for each PBI',
        'Estimate each PBI using story points (Fibonacci: 1, 2, 3, 5, 8, 13, 21)',
        'Order backlog by business value (highest value at top)',
        'Consider dependencies, risk, and value when ordering',
        'Tag each PBI with type: feature, technical, bug, research',
        'Add priority labels: must-have, should-have, could-have, won\'t-have',
        'Ensure top items are ready for Sprint Planning (detailed, estimated)',
        'Keep lower priority items less detailed (just-in-time refinement)'
      ],
      outputFormat: 'JSON with ordered Product Backlog Items, estimates, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'totalItems'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              userStory: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              storyPoints: { type: 'number' },
              priority: { type: 'string' },
              type: { type: 'string' },
              businessValue: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalItems: { type: 'number' },
        totalStoryPoints: { type: 'number' },
        epics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pbiIds: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/scrum/product-backlog.md', format: 'markdown' },
      { path: 'artifacts/scrum/product-backlog.json', format: 'json' }
    ]
  },

  labels: ['agent', 'scrum', 'product-backlog', 'product-owner']
}));

/**
 * Backlog Refinement (Grooming)
 * Ongoing process of adding detail, estimates, and order to Product Backlog
 */
export const backlogRefinementTask = defineTask('backlog-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backlog Refinement: Sprint ${args.sprintNumber}`,
  description: 'Refine and re-prioritize Product Backlog based on learnings',

  agent: {
    name: 'product-owner',
    prompt: {
      role: 'Product Owner',
      task: 'Refine Product Backlog with team input',
      context: {
        projectName: args.projectName,
        productBacklog: args.productBacklog,
        completedSprints: args.completedSprints,
        sprintNumber: args.sprintNumber,
        productOwner: args.productOwner
      },
      instructions: [
        'Review completed sprint results and learnings',
        'Add new Product Backlog Items based on discoveries',
        'Break down large items into smaller, ready items',
        'Update estimates based on team velocity',
        'Re-order backlog based on changed priorities',
        'Add missing acceptance criteria',
        'Remove obsolete items',
        'Ensure top items are ready for next Sprint Planning',
        'Clarify requirements with Development Team',
        'Consider stakeholder feedback from Sprint Reviews'
      ],
      outputFormat: 'JSON with refined and re-ordered Product Backlog'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedBacklog', 'changes'],
      properties: {
        refinedBacklog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              userStory: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              storyPoints: { type: 'number' },
              priority: { type: 'string' }
            }
          }
        },
        changes: {
          type: 'object',
          properties: {
            itemsAdded: { type: 'number' },
            itemsRemoved: { type: 'number' },
            itemsReestimated: { type: 'number' },
            itemsReordered: { type: 'number' }
          }
        },
        refinementNotes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/scrum/product-backlog.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'scrum', 'backlog-refinement', 'product-owner']
}));

/**
 * Sprint Planning
 * Team collaborates to plan the work for the upcoming Sprint
 */
export const sprintPlanningTask = defineTask('sprint-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} Planning`,
  description: 'Plan Sprint work: define Sprint Goal and select Product Backlog Items',

  agent: {
    name: 'scrum-team',
    prompt: {
      role: 'Scrum Team (Product Owner, Scrum Master, Development Team)',
      task: 'Conduct Sprint Planning to create Sprint Backlog',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintDuration: args.sprintDuration,
        productBacklog: args.productBacklog,
        teamSize: args.teamSize,
        previousVelocity: args.previousVelocity,
        definitionOfDone: args.definitionOfDone,
        productOwner: args.productOwner,
        scrumMaster: args.scrumMaster
      },
      instructions: [
        'Part 1: What can be done this Sprint?',
        '  - Product Owner presents ordered Product Backlog',
        '  - Team discusses Sprint Goal (why we are doing this Sprint)',
        '  - Team forecasts what can be delivered based on velocity',
        '  - Use previous velocity as guide (if available)',
        '  - Select top-priority items that align with Sprint Goal',
        '  - Get team commitment to deliver the items',
        'Part 2: How will the work get done?',
        '  - Development Team creates plan for delivering selected items',
        '  - Break items into tasks (typically 1-8 hours each)',
        '  - Identify dependencies and technical approach',
        '  - Ensure all tasks needed to meet Definition of Done',
        '  - Create Sprint Backlog (selected PBIs + tasks)',
        'Output: Sprint Goal, selected PBIs, task breakdown, team commitment'
      ],
      outputFormat: 'JSON with Sprint Goal, selected items, tasks, commitment'
    },
    outputSchema: {
      type: 'object',
      required: ['sprintGoal', 'selectedItems', 'tasks', 'totalStoryPoints'],
      properties: {
        sprintGoal: { type: 'string' },
        selectedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              pbiId: { type: 'string' },
              estimatedHours: { type: 'number' },
              status: { type: 'string' },
              assignedTo: { type: 'string' }
            }
          }
        },
        totalStoryPoints: { type: 'number' },
        forecastedVelocity: { type: 'number' },
        teamCommitment: { type: 'string' },
        planningNotes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/sprint-plan.md`, format: 'markdown' },
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/sprint-backlog.json`, format: 'json' }
    ]
  },

  labels: ['agent', 'scrum', 'sprint-planning', `sprint-${args.sprintNumber}`]
}));

/**
 * Daily Scrum (Standup)
 * 15-minute daily event for Development Team to synchronize and plan next 24 hours
 */
export const dailyScrumTask = defineTask('daily-scrum', (args, taskCtx) => ({
  kind: 'agent',
  title: `Daily Scrum: Sprint ${args.sprintNumber}, Day ${args.day}`,
  description: 'Daily team synchronization and progress update',

  agent: {
    name: 'development-team',
    prompt: {
      role: 'Development Team members',
      task: 'Conduct Daily Scrum to synchronize work and identify impediments',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        day: args.day,
        totalDays: args.totalDays,
        sprintBacklog: args.sprintBacklog,
        tasks: args.tasks,
        impediments: args.impediments,
        scrumMaster: args.scrumMaster
      },
      instructions: [
        'Each team member answers three questions:',
        '  1. What did I do yesterday toward the Sprint Goal?',
        '  2. What will I do today toward the Sprint Goal?',
        '  3. Do I see any impediments blocking me or the team?',
        'Update task status: To Do → In Progress → Done',
        'Update remaining hours for tasks',
        'Identify any new impediments',
        'Track impediment resolution (Scrum Master responsibility)',
        'Re-plan work if needed to meet Sprint Goal',
        'Update burndown data (remaining story points)',
        'Collaborate on solving blockers',
        'Keep meeting to 15 minutes max'
      ],
      outputFormat: 'JSON with daily progress, updated tasks, impediments, burndown data'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedTasks', 'remainingStoryPoints', 'impediments'],
      properties: {
        updatedTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              remainingHours: { type: 'number' },
              completedBy: { type: 'string' }
            }
          }
        },
        remainingStoryPoints: { type: 'number' },
        impediments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              raisedBy: { type: 'string' }
            }
          }
        },
        completedItems: {
          type: 'array',
          items: { type: 'string' }
        },
        increment: { type: 'string' },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: []
  },

  labels: ['agent', 'scrum', 'daily-scrum', `sprint-${args.sprintNumber}`, `day-${args.day}`]
}));

/**
 * Sprint Review
 * Inspect Increment and adapt Product Backlog with stakeholders
 */
export const sprintReviewTask = defineTask('sprint-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} Review`,
  description: 'Demo Increment and gather stakeholder feedback',

  agent: {
    name: 'scrum-team-stakeholders',
    prompt: {
      role: 'Scrum Team and stakeholders',
      task: 'Review Sprint Increment and adapt Product Backlog',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintGoal: args.sprintGoal,
        sprintBacklog: args.sprintBacklog,
        completedItems: args.completedItems,
        increment: args.increment,
        definitionOfDone: args.definitionOfDone,
        productOwner: args.productOwner,
        teamSize: args.teamSize
      },
      instructions: [
        'Product Owner explains what was "Done" vs not done',
        'Development Team demonstrates completed work',
        'Discuss what went well, what problems occurred, how resolved',
        'Verify all completed items meet Definition of Done',
        'Calculate velocity (completed story points)',
        'Gather stakeholder feedback on Increment',
        'Discuss what should be done next',
        'Update Product Backlog based on feedback',
        'Add new items discovered during sprint',
        'Review timeline, budget, capabilities for next release',
        'Ensure Increment is potentially shippable'
      ],
      outputFormat: 'JSON with completed items, velocity, feedback, backlog updates'
    },
    outputSchema: {
      type: 'object',
      required: ['completedItemIds', 'completedStoryPoints', 'velocity', 'incrementStatus'],
      properties: {
        completedItemIds: { type: 'array', items: { type: 'string' } },
        completedStoryPoints: { type: 'number' },
        velocity: { type: 'number' },
        sprintGoalAchieved: { type: 'boolean' },
        incrementStatus: { type: 'string' },
        potentiallyShippable: { type: 'boolean' },
        stakeholderFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              feedback: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        newBacklogItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        productBacklogUpdates: { type: 'string' },
        demoNotes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/sprint-review.md`, format: 'markdown' },
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/increment.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'scrum', 'sprint-review', `sprint-${args.sprintNumber}`]
}));

/**
 * Sprint Retrospective
 * Team inspects itself and creates plan for improvements
 */
export const sprintRetrospectiveTask = defineTask('sprint-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} Retrospective`,
  description: 'Team reflection and continuous improvement planning',

  agent: {
    name: 'scrum-team',
    prompt: {
      role: 'Scrum Team facilitated by Scrum Master',
      task: 'Conduct Sprint Retrospective to plan improvements',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintData: args.sprintData,
        dailyScrums: args.dailyScrums,
        review: args.review,
        scrumMaster: args.scrumMaster,
        teamSize: args.teamSize
      },
      instructions: [
        'Inspect how the Sprint went regarding people, relationships, process, tools',
        'Use structured format: What went well? What could be improved? What will we commit to improve?',
        'Identify most helpful things and potential improvements',
        'Create actionable improvements (at least one high-priority improvement)',
        'Review impediments that were raised',
        'Discuss Definition of Done - does it need updates?',
        'Examine velocity trend and predictability',
        'Celebrate successes and learnings',
        'Address team dynamics and collaboration',
        'Plan how to implement improvements in next Sprint',
        'Assign owners to improvement action items'
      ],
      outputFormat: 'JSON with what went well, what to improve, action items, commitment'
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'toImprove', 'improvements', 'actionItems'],
      properties: {
        wentWell: { type: 'array', items: { type: 'string' } },
        toImprove: { type: 'array', items: { type: 'string' } },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              assignedTo: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        impedimentsReview: { type: 'string' },
        definitionOfDoneUpdates: { type: 'string' },
        velocityAnalysis: { type: 'string' },
        teamMorale: { type: 'string' },
        commitment: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/retrospective.md`, format: 'markdown' },
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/action-items.json`, format: 'json' }
    ]
  },

  labels: ['agent', 'scrum', 'sprint-retrospective', `sprint-${args.sprintNumber}`]
}));

/**
 * Generate Sprint Burndown Chart
 * Track remaining work throughout sprint
 */
export const generateBurndownTask = defineTask('generate-burndown', (args, taskCtx) => ({
  kind: 'node',
  title: `Generate Burndown Chart: Sprint ${args.sprintNumber}`,
  description: 'Create sprint burndown chart showing progress',

  node: {
    run: async (taskArgs) => {
      const { sprintNumber, sprintDuration, dailyScrums, totalStoryPoints } = taskArgs;

      const workingDays = sprintDuration * 5;
      const idealBurndown = [];
      const actualBurndown = [];

      // Calculate ideal burndown (linear)
      for (let day = 0; day <= workingDays; day++) {
        idealBurndown.push({
          day,
          remaining: totalStoryPoints * (1 - day / workingDays)
        });
      }

      // Calculate actual burndown from daily scrums
      actualBurndown.push({ day: 0, remaining: totalStoryPoints });
      dailyScrums.forEach((scrum, idx) => {
        actualBurndown.push({
          day: idx + 1,
          remaining: scrum.remainingStoryPoints || 0
        });
      });

      const svg = generateBurndownSVG(idealBurndown, actualBurndown, sprintNumber);

      return {
        svgContent: svg,
        idealBurndown,
        actualBurndown,
        completedStoryPoints: totalStoryPoints - (actualBurndown[actualBurndown.length - 1].remaining || 0),
        onTrack: actualBurndown[actualBurndown.length - 1].remaining <= idealBurndown[actualBurndown.length - 1].remaining
      };
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/scrum/sprint-${args.sprintNumber}/burndown.svg`, format: 'image' }
    ]
  },

  labels: ['node', 'scrum', 'burndown', `sprint-${args.sprintNumber}`]
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate velocity metrics across all sprints
 */
function calculateVelocityMetrics(sprintResults) {
  const velocities = sprintResults.map(s => s.review.velocity);
  const totalCompletedStoryPoints = velocities.reduce((sum, v) => sum + v, 0);
  const averageVelocity = totalCompletedStoryPoints / sprintResults.length;
  const totalCompletedItems = sprintResults.reduce(
    (sum, s) => sum + s.review.completedItemIds.length,
    0
  );

  // Calculate velocity trend
  const firstHalf = velocities.slice(0, Math.floor(velocities.length / 2));
  const secondHalf = velocities.slice(Math.floor(velocities.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  const velocityTrend = secondHalfAvg - firstHalfAvg;

  return {
    velocities,
    averageVelocity,
    totalCompletedStoryPoints,
    totalCompletedItems,
    velocityTrend,
    improving: velocityTrend > 0,
    standardDeviation: calculateStandardDeviation(velocities)
  };
}

/**
 * Generate release burndown showing progress across sprints
 */
function generateReleaseBurndown(initialBacklog, sprintResults) {
  const burndownData = [];
  let remainingPoints = initialBacklog.totalStoryPoints;

  burndownData.push({ sprint: 0, remaining: remainingPoints });

  sprintResults.forEach((sprint, idx) => {
    remainingPoints -= sprint.review.completedStoryPoints;
    burndownData.push({
      sprint: idx + 1,
      remaining: Math.max(0, remainingPoints),
      completed: sprint.review.completedStoryPoints
    });
  });

  return {
    burndownData,
    initialStoryPoints: initialBacklog.totalStoryPoints,
    remainingStoryPoints: remainingPoints,
    completedStoryPoints: initialBacklog.totalStoryPoints - remainingPoints,
    completionPercentage: ((initialBacklog.totalStoryPoints - remainingPoints) / initialBacklog.totalStoryPoints) * 100
  };
}

/**
 * Calculate standard deviation of velocities
 */
function calculateStandardDeviation(values) {
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Generate SVG burndown chart
 */
function generateBurndownSVG(idealBurndown, actualBurndown, sprintNumber) {
  const width = 800;
  const height = 400;
  const padding = 60;

  const maxPoints = Math.max(...idealBurndown.map(d => d.remaining));
  const maxDays = Math.max(...idealBurndown.map(d => d.day));

  const xScale = (day) => padding + (day / maxDays) * (width - 2 * padding);
  const yScale = (points) => height - padding - (points / maxPoints) * (height - 2 * padding);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

  // Draw axes
  svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2"/>`;
  svg += `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2"/>`;

  // Draw ideal burndown (dashed line)
  const idealPath = idealBurndown.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.day)} ${yScale(d.remaining)}`
  ).join(' ');
  svg += `<path d="${idealPath}" stroke="#999" stroke-width="2" stroke-dasharray="5,5" fill="none"/>`;

  // Draw actual burndown (solid line)
  const actualPath = actualBurndown.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.day)} ${yScale(d.remaining)}`
  ).join(' ');
  svg += `<path d="${actualPath}" stroke="#2196F3" stroke-width="3" fill="none"/>`;

  // Add labels
  svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="14">Days</text>`;
  svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 20 ${height / 2})">Story Points</text>`;
  svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold">Sprint ${sprintNumber} Burndown</text>`;

  // Legend
  svg += `<line x1="${width - 200}" y1="50" x2="${width - 170}" y2="50" stroke="#999" stroke-width="2" stroke-dasharray="5,5"/>`;
  svg += `<text x="${width - 165}" y="55" font-size="12">Ideal</text>`;
  svg += `<line x1="${width - 200}" y1="70" x2="${width - 170}" y2="70" stroke="#2196F3" stroke-width="3"/>`;
  svg += `<text x="${width - 165}" y="75" font-size="12">Actual</text>`;

  svg += '</svg>';
  return svg;
}
