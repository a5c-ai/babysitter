/**
 * @process methodologies/agile
 * @description Agile Development Loop - Sprints, iteration cycles, and continuous delivery
 * @inputs { project: string, sprintDuration: number, totalSprints: number, backlog: array }
 * @outputs { success: boolean, sprints: array, deliverables: array, velocity: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Agile Development Process
 *
 * Methodology: Backlog → Sprint Planning → Development → Testing → Review → Retrospective → Release → Next Sprint
 *
 * This process implements agile/scrum methodology with:
 * 1. Product backlog management
 * 2. Sprint planning (select stories, estimate, commit)
 * 3. Sprint execution (develop → test → integrate)
 * 4. Sprint review (demo, validate acceptance criteria)
 * 5. Sprint retrospective (reflect, improve)
 * 6. Incremental releases
 * 7. Velocity tracking and continuous improvement
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.project - Project description
 * @param {number} inputs.sprintDuration - Sprint duration in days (default: 7)
 * @param {number} inputs.totalSprints - Number of sprints to run (default: 3)
 * @param {Array<Object>} inputs.backlog - Initial product backlog with user stories
 * @param {number} inputs.teamCapacity - Story points per sprint (default: 20)
 * @param {boolean} inputs.includeRetros - Include retrospectives (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with sprint history and deliverables
 */
export async function process(inputs, ctx) {
  const {
    project,
    sprintDuration = 7,
    totalSprints = 3,
    backlog: initialBacklog = [],
    teamCapacity = 20,
    includeRetros = true
  } = inputs;

  let currentBacklog = [...initialBacklog];
  const sprints = [];
  const allDeliverables = [];
  const velocityHistory = [];

  // Agile iteration loop
  for (let sprintNumber = 1; sprintNumber <= totalSprints; sprintNumber++) {
    const sprintData = {
      sprintNumber,
      startDate: ctx.now(),
      duration: sprintDuration,
      capacity: teamCapacity
    };

    // Phase 1: Sprint Planning
    const planning = await ctx.task(agentSprintPlanningTask, {
      project,
      sprintNumber,
      backlog: currentBacklog,
      teamCapacity,
      previousSprints: sprints,
      velocityHistory
    });

    sprintData.planning = planning;
    sprintData.committedStories = planning.selectedStories;
    sprintData.committedPoints = planning.totalPoints;

    // Update backlog (remove selected stories)
    currentBacklog = currentBacklog.filter(
      item => !planning.selectedStories.find(s => s.id === item.id)
    );

    // Phase 2: Development (iterate through stories)
    const developmentResults = [];
    for (const story of planning.selectedStories) {
      const devResult = await ctx.task(agentDevelopStoryTask, {
        project,
        story,
        sprintNumber,
        acceptanceCriteria: story.acceptanceCriteria
      });

      developmentResults.push({
        storyId: story.id,
        story: story.title,
        result: devResult
      });
    }

    sprintData.development = developmentResults;

    // Phase 3: Testing
    const testResults = await ctx.task(agentTestSprintTask, {
      project,
      sprintNumber,
      developmentResults,
      committedStories: planning.selectedStories
    });

    sprintData.testing = testResults;

    // Phase 4: Integration & Build
    const integrationResult = await ctx.task(agentIntegrateTask, {
      project,
      sprintNumber,
      developmentResults,
      testResults
    });

    sprintData.integration = integrationResult;

    // Phase 5: Sprint Review
    const review = await ctx.task(agentSprintReviewTask, {
      project,
      sprintNumber,
      committedStories: planning.selectedStories,
      developmentResults,
      testResults,
      integrationResult
    });

    sprintData.review = review;
    sprintData.completedPoints = review.completedPoints;
    sprintData.deliverables = review.deliverables;

    // Track velocity
    velocityHistory.push({
      sprint: sprintNumber,
      committed: sprintData.committedPoints,
      completed: sprintData.completedPoints,
      velocity: (sprintData.completedPoints / sprintData.committedPoints) * 100
    });

    allDeliverables.push(...review.deliverables);

    // Phase 6: Sprint Retrospective (optional)
    if (includeRetros) {
      const retrospective = await ctx.task(agentRetrospectiveTask, {
        project,
        sprintNumber,
        sprintData,
        velocityHistory,
        previousRetros: sprints
          .filter(s => s.retrospective)
          .map(s => s.retrospective)
      });

      sprintData.retrospective = retrospective;

      // Add new improvements to backlog
      if (retrospective.processImprovements.length > 0) {
        currentBacklog.push(
          ...retrospective.processImprovements.map((imp, idx) => ({
            id: `improvement-${sprintNumber}-${idx}`,
            title: imp,
            type: 'technical-debt',
            priority: 'medium',
            storyPoints: 2
          }))
        );
      }
    }

    sprintData.endDate = ctx.now();
    sprints.push(sprintData);

    // Optional: Breakpoint after each sprint
    if (sprintNumber < totalSprints && inputs.reviewEachSprint) {
      await ctx.breakpoint({
        question: `Sprint ${sprintNumber} complete. Completed ${review.completedPoints}/${planning.totalPoints} points. Continue to Sprint ${sprintNumber + 1}?`,
        title: `Sprint ${sprintNumber} Review`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/sprint-${sprintNumber}-summary.md`, format: 'markdown' },
            { path: `artifacts/sprint-${sprintNumber}-deliverables.json`, format: 'json' }
          ]
        }
      });
    }

    // Phase 7: Release (incremental)
    if (integrationResult.readyForRelease) {
      const release = await ctx.task(agentReleaseTask, {
        project,
        sprintNumber,
        deliverables: review.deliverables,
        version: `v1.${sprintNumber}.0`
      });

      sprintData.release = release;
    }
  }

  // Final summary
  const totalCommittedPoints = sprints.reduce((sum, s) => sum + s.committedPoints, 0);
  const totalCompletedPoints = sprints.reduce((sum, s) => sum + s.completedPoints, 0);
  const overallVelocity = (totalCompletedPoints / totalCommittedPoints) * 100;

  return {
    success: true,
    project,
    totalSprints,
    sprints,
    backlogRemaining: currentBacklog,
    deliverables: allDeliverables,
    velocity: {
      overall: overallVelocity,
      totalCommitted: totalCommittedPoints,
      totalCompleted: totalCompletedPoints,
      history: velocityHistory,
      trend: calculateVelocityTrend(velocityHistory)
    },
    summary: {
      totalSprints,
      totalStoriesCompleted: sprints.reduce(
        (sum, s) => sum + (s.review?.completedStories?.length || 0),
        0
      ),
      totalPointsCompleted: totalCompletedPoints,
      averageVelocity: overallVelocity,
      releasesDeployed: sprints.filter(s => s.release).length,
      keyDeliverables: allDeliverables.map(d => d.title)
    },
    metadata: {
      processId: 'methodologies/agile',
      timestamp: ctx.now()
    }
  };
}

/**
 * Helper: Calculate velocity trend
 */
function calculateVelocityTrend(history) {
  if (history.length < 2) return 'stable';

  const recentVelocities = history.slice(-3).map(h => h.velocity);
  const avgRecent = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;

  const earlyVelocities = history.slice(0, Math.min(3, history.length - 1)).map(h => h.velocity);
  const avgEarly = earlyVelocities.reduce((a, b) => a + b, 0) / earlyVelocities.length;

  if (avgRecent > avgEarly * 1.1) return 'improving';
  if (avgRecent < avgEarly * 0.9) return 'declining';
  return 'stable';
}

/**
 * Sprint Planning Task
 */
export const agentSprintPlanningTask = defineTask('agent-sprint-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} - Planning`,
  description: 'Select and estimate stories for sprint',

  agent: {
    name: 'scrum-master-planner',
    prompt: {
      role: 'scrum master and product owner',
      task: 'Plan the sprint by selecting stories from backlog',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        backlog: args.backlog,
        teamCapacity: args.teamCapacity,
        previousSprints: args.previousSprints,
        velocityHistory: args.velocityHistory
      },
      instructions: [
        'Review product backlog',
        `Select stories that fit within team capacity (${args.teamCapacity} points)`,
        'Prioritize by business value and dependencies',
        'Consider velocity from previous sprints',
        'Ensure stories have clear acceptance criteria',
        'Balance feature work, bugs, and technical debt',
        'Create sprint goal',
        'Return selected stories with estimates'
      ],
      outputFormat: 'JSON with sprint goal, selected stories, total points, and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['sprintGoal', 'selectedStories', 'totalPoints'],
      properties: {
        sprintGoal: { type: 'string' },
        selectedStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' },
              priority: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalPoints: { type: 'number' },
        rationale: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'planning', `sprint-${args.sprintNumber}`]
}));

/**
 * Develop Story Task
 */
export const agentDevelopStoryTask = defineTask('agent-develop-story', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop: ${args.story.title}`,
  description: 'Implement user story',

  agent: {
    name: 'agile-developer',
    prompt: {
      role: 'agile software developer',
      task: 'Implement the user story according to acceptance criteria',
      context: {
        project: args.project,
        story: args.story,
        sprintNumber: args.sprintNumber,
        acceptanceCriteria: args.acceptanceCriteria
      },
      instructions: [
        'Implement the user story completely',
        'Satisfy all acceptance criteria',
        'Write clean, maintainable code',
        'Include unit tests',
        'Follow project coding standards',
        'Document significant decisions',
        'Consider edge cases'
      ],
      outputFormat: 'JSON with implementation summary, files created/modified, tests added'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'implementation', 'filesModified', 'testsAdded'],
      properties: {
        completed: { type: 'boolean' },
        implementation: { type: 'string' },
        filesModified: { type: 'array', items: { type: 'string' } },
        testsAdded: { type: 'array', items: { type: 'string' } },
        acceptanceCriteriaMet: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'development', `sprint-${args.sprintNumber}`, `story-${args.story.id}`]
}));

/**
 * Test Sprint Task
 */
export const agentTestSprintTask = defineTask('agent-test-sprint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Sprint ${args.sprintNumber}`,
  description: 'Run all tests for sprint deliverables',

  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'QA engineer',
      task: 'Test all stories completed in this sprint',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        developmentResults: args.developmentResults,
        committedStories: args.committedStories
      },
      instructions: [
        'Run all unit tests',
        'Run integration tests',
        'Verify acceptance criteria for each story',
        'Test edge cases and error handling',
        'Check for regressions',
        'Document any bugs found',
        'Assess overall quality'
      ],
      outputFormat: 'JSON with test results, pass/fail status, bugs found'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'totalTests', 'passedTests', 'failedTests'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        bugsFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        storiesPassingTests: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'testing', `sprint-${args.sprintNumber}`]
}));

/**
 * Integration Task
 */
export const agentIntegrateTask = defineTask('agent-integrate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Sprint ${args.sprintNumber}`,
  description: 'Integrate and build sprint deliverables',

  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'integration engineer',
      task: 'Integrate all stories and build the application',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        developmentResults: args.developmentResults,
        testResults: args.testResults
      },
      instructions: [
        'Merge all story branches',
        'Resolve any conflicts',
        'Run full build',
        'Verify all tests pass',
        'Check code quality metrics',
        'Assess if ready for release'
      ],
      outputFormat: 'JSON with integration status, build status, ready for release'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationSuccessful', 'buildSuccessful', 'readyForRelease'],
      properties: {
        integrationSuccessful: { type: 'boolean' },
        buildSuccessful: { type: 'boolean' },
        readyForRelease: { type: 'boolean' },
        conflicts: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'integration', `sprint-${args.sprintNumber}`]
}));

/**
 * Sprint Review Task
 */
export const agentSprintReviewTask = defineTask('agent-sprint-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} - Review`,
  description: 'Review sprint accomplishments',

  agent: {
    name: 'product-owner-reviewer',
    prompt: {
      role: 'product owner',
      task: 'Review sprint deliverables and accept stories',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        committedStories: args.committedStories,
        developmentResults: args.developmentResults,
        testResults: args.testResults,
        integrationResult: args.integrationResult
      },
      instructions: [
        'Review each completed story',
        'Verify acceptance criteria are met',
        'Accept or reject stories',
        'Calculate completed story points',
        'Identify deliverables',
        'Provide feedback for next sprint',
        'Celebrate wins and learnings'
      ],
      outputFormat: 'JSON with accepted stories, completed points, deliverables, feedback'
    },
    outputSchema: {
      type: 'object',
      required: ['completedStories', 'completedPoints', 'deliverables'],
      properties: {
        completedStories: { type: 'array', items: { type: 'string' } },
        rejectedStories: { type: 'array', items: { type: 'string' } },
        completedPoints: { type: 'number' },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        feedback: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'review', `sprint-${args.sprintNumber}`]
}));

/**
 * Retrospective Task
 */
export const agentRetrospectiveTask = defineTask('agent-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} - Retrospective`,
  description: 'Reflect and identify improvements',

  agent: {
    name: 'scrum-master-facilitator',
    prompt: {
      role: 'scrum master facilitating retrospective',
      task: 'Reflect on sprint and identify improvements',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        sprintData: args.sprintData,
        velocityHistory: args.velocityHistory,
        previousRetros: args.previousRetros
      },
      instructions: [
        'Identify what went well',
        'Identify what could be improved',
        'Analyze velocity and completion rate',
        'Check if previous action items were addressed',
        'Propose concrete process improvements',
        'Identify technical debt to address',
        'Celebrate team achievements'
      ],
      outputFormat: 'JSON with went well, improvements, action items, process improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'improvements', 'actionItems', 'processImprovements'],
      properties: {
        wentWell: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
        processImprovements: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'retrospective', `sprint-${args.sprintNumber}`]
}));

/**
 * Release Task
 */
export const agentReleaseTask = defineTask('agent-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release ${args.version}`,
  description: 'Deploy sprint deliverables',

  agent: {
    name: 'release-manager',
    prompt: {
      role: 'release manager',
      task: 'Deploy sprint deliverables as release',
      context: {
        project: args.project,
        sprintNumber: args.sprintNumber,
        deliverables: args.deliverables,
        version: args.version
      },
      instructions: [
        'Prepare release notes',
        'Tag release version',
        'Deploy to staging/production',
        'Verify deployment',
        'Notify stakeholders',
        'Document release'
      ],
      outputFormat: 'JSON with release status, version, notes'
    },
    outputSchema: {
      type: 'object',
      required: ['releaseSuccessful', 'version', 'releaseNotes'],
      properties: {
        releaseSuccessful: { type: 'boolean' },
        version: { type: 'string' },
        releaseNotes: { type: 'string' },
        deploymentUrl: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'agile', 'release', `sprint-${args.sprintNumber}`]
}));
