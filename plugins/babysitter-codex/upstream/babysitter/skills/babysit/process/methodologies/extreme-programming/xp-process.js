/**
 * @process methodologies/extreme-programming
 * @description Extreme Programming (XP) - Agile engineering practices with frequent releases, TDD, pair programming, and continuous integration
 * @inputs { projectName: string, releaseGoal: string, iterationLength?: number, teamSize?: number, velocity?: number, practices?: array }
 * @outputs { success: boolean, release: object, iterations: array, practices: object, metrics: object, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Extreme Programming (XP) Process
 *
 * XP is an agile software development methodology that advocates frequent releases
 * in short development cycles, taking best practices to "extreme" levels.
 *
 * 12 Core Practices grouped into four areas:
 * - Fine-scale feedback: Pair Programming, Planning Game, TDD, Whole Team
 * - Continuous Process: Continuous Integration, Refactoring, Small Releases
 * - Shared Understanding: Coding Standards, Collective Code Ownership, Simple Design, System Metaphor
 * - Programmer Welfare: Sustainable Pace
 *
 * Methodology: Kent Beck, Ward Cunningham, Ron Jeffries (1996)
 *
 * This process implements:
 * - Release planning with user stories
 * - Iteration planning and execution
 * - Pair programming facilitation
 * - Test-Driven Development (TDD)
 * - Continuous Integration
 * - Refactoring practices
 * - Daily standup coordination
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Project name
 * @param {string} inputs.releaseGoal - Release goal or theme
 * @param {number} inputs.iterationLength - Iteration length in weeks (default: 2)
 * @param {number} inputs.teamSize - Development team size (default: 4)
 * @param {number} inputs.velocity - Estimated velocity in story points (default: auto-calculate)
 * @param {Array<string>} inputs.practices - XP practices to focus on (default: all 12)
 * @param {Array} inputs.userStories - Pre-defined user stories (default: auto-generate)
 * @param {boolean} inputs.enablePairProgramming - Enable pair programming (default: true)
 * @param {boolean} inputs.enableTDD - Enable TDD practice (default: true)
 * @param {boolean} inputs.enableCI - Enable continuous integration (default: true)
 * @param {boolean} inputs.enableRefactoring - Enable continuous refactoring (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with release plan, iterations, and practice metrics
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    releaseGoal,
    iterationLength = 2,
    teamSize = 4,
    velocity = null,
    practices = ['pair-programming', 'planning-game', 'tdd', 'whole-team', 'continuous-integration',
                 'refactoring', 'small-releases', 'coding-standards', 'collective-ownership',
                 'simple-design', 'system-metaphor', 'sustainable-pace'],
    userStories = null,
    enablePairProgramming = true,
    enableTDD = true,
    enableCI = true,
    enableRefactoring = true
  } = inputs;

  // Validate inputs
  if (!projectName || !releaseGoal) {
    throw new Error('projectName and releaseGoal are required');
  }

  // ============================================================================
  // PHASE 1: RELEASE PLANNING
  // ============================================================================

  const releasePlanResult = await ctx.task(releasePlanningTask, {
    projectName,
    releaseGoal,
    iterationLength,
    teamSize,
    velocity,
    userStories,
    practices
  });

  // Breakpoint: Review release plan
  await ctx.breakpoint({
    question: `Release plan complete for "${releaseGoal}". Created ${releasePlanResult.userStories.length} user stories, planned for ${releasePlanResult.iterationCount} iterations (${iterationLength} weeks each). Estimated velocity: ${releasePlanResult.velocity} story points. Approve release plan?`,
    title: 'Release Planning Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/xp/release/release-plan.md', format: 'markdown', label: 'Release Plan' },
        { path: 'artifacts/xp/release/user-stories.json', format: 'code', language: 'json', label: 'User Stories' },
        { path: 'artifacts/xp/release/velocity-chart.md', format: 'markdown', label: 'Velocity Planning' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: ITERATION LOOP
  // ============================================================================

  const iterations = [];
  const completedStories = [];
  let currentVelocity = releasePlanResult.velocity;

  for (let iterationNum = 1; iterationNum <= releasePlanResult.iterationCount; iterationNum++) {
    // Select stories for iteration based on velocity
    const availableStories = releasePlanResult.userStories.filter(
      story => !completedStories.includes(story.id)
    );

    if (availableStories.length === 0) {
      break; // All stories complete
    }

    // ITERATION PLANNING
    const iterationPlanResult = await ctx.task(iterationPlanningTask, {
      projectName,
      releaseGoal,
      iterationNumber: iterationNum,
      iterationLength,
      availableStories,
      velocity: currentVelocity,
      teamSize,
      practices
    });

    // Breakpoint: Review iteration plan
    await ctx.breakpoint({
      question: `Iteration ${iterationNum} plan complete. Selected ${iterationPlanResult.selectedStories.length} stories (${iterationPlanResult.totalStoryPoints} points), broken into ${iterationPlanResult.tasks.length} tasks (${iterationPlanResult.totalHours} hours). Team committed. Start iteration?`,
      title: `Iteration ${iterationNum} Planning Review`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/plan.md`, format: 'markdown', label: 'Iteration Plan' },
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/tasks.json`, format: 'code', language: 'json', label: 'Task Breakdown' }
        ]
      }
    });

    // DAILY ITERATION EXECUTION
    const dailyResults = [];
    const daysInIteration = iterationLength * 5; // 5 working days per week

    for (let day = 1; day <= daysInIteration; day++) {
      // Daily standup
      const standupResult = await ctx.task(standUpMeetingTask, {
        projectName,
        iterationNumber: iterationNum,
        day,
        tasks: iterationPlanResult.tasks,
        completedTasks: dailyResults.flatMap(d => d.completedTasks || []),
        enablePairProgramming,
        teamSize
      });

      // Execute practices in parallel
      const practiceResults = await ctx.parallel.all([
        // Pair programming
        ...(enablePairProgramming ? [async () => {
          return await ctx.task(pairProgrammingTask, {
            projectName,
            iterationNumber: iterationNum,
            day,
            pairs: standupResult.pairAssignments,
            tasks: standupResult.todaysTasks
          });
        }] : []),

        // TDD practice
        ...(enableTDD ? [async () => {
          return await ctx.task(tddPracticeTask, {
            projectName,
            iterationNumber: iterationNum,
            day,
            tasks: standupResult.todaysTasks,
            existingTests: dailyResults.flatMap(d => d.tddResult?.tests || [])
          });
        }] : []),

        // Continuous Integration
        ...(enableCI ? [async () => {
          return await ctx.task(continuousIntegrationTask, {
            projectName,
            iterationNumber: iterationNum,
            day,
            commits: standupResult.expectedCommits,
            tests: dailyResults.slice(-1)[0]?.tddResult?.tests || []
          });
        }] : [])
      ]);

      const pairResult = enablePairProgramming ? practiceResults[0] : null;
      const tddResult = enableTDD ? practiceResults[enablePairProgramming ? 1 : 0] : null;
      const ciResult = enableCI ? practiceResults[practiceResults.length - 1] : null;

      // Refactoring (if enabled and needed)
      let refactoringResult = null;
      if (enableRefactoring && day % 2 === 0) { // Every other day
        refactoringResult = await ctx.task(refactoringTask, {
          projectName,
          iterationNumber: iterationNum,
          day,
          codeSmells: tddResult?.codeSmells || [],
          recentChanges: pairResult?.completedWork || []
        });
      }

      dailyResults.push({
        day,
        standup: standupResult,
        pairProgramming: pairResult,
        tdd: tddResult,
        ci: ciResult,
        refactoring: refactoringResult,
        completedTasks: standupResult.completedTasks || []
      });

      // Mid-iteration check (optional breakpoint)
      if (day === Math.floor(daysInIteration / 2)) {
        await ctx.breakpoint({
          question: `Iteration ${iterationNum}, Day ${day} (mid-point). ${standupResult.completedTasks?.length || 0} tasks complete, ${standupResult.impediments?.length || 0} impediments. ${ciResult?.buildStatus === 'passing' ? 'Build passing' : 'Build issues'}. Continue?`,
          title: `Iteration ${iterationNum} Mid-Point Check`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/xp/iterations/iteration-${iterationNum}/daily/day-${day}-summary.md`, format: 'markdown', label: 'Mid-Point Summary' }
            ]
          }
        });
      }
    }

    // ITERATION COMPLETION
    const iterationCompleteResult = await ctx.task(iterationCompletionTask, {
      projectName,
      iterationNumber: iterationNum,
      plan: iterationPlanResult,
      dailyResults,
      practices
    });

    // Update velocity based on actual completion
    currentVelocity = iterationCompleteResult.actualVelocity;
    completedStories.push(...iterationCompleteResult.completedStoryIds);

    iterations.push({
      iterationNumber: iterationNum,
      plan: iterationPlanResult,
      dailyResults,
      completion: iterationCompleteResult
    });

    // Breakpoint: Review iteration completion
    await ctx.breakpoint({
      question: `Iteration ${iterationNum} complete. Delivered ${iterationCompleteResult.completedStories} stories (${iterationCompleteResult.actualVelocity} points). Velocity ${currentVelocity > releasePlanResult.velocity ? 'increased' : currentVelocity < releasePlanResult.velocity ? 'decreased' : 'stable'}. ${iterationCompleteResult.demoReady ? 'Demo ready' : 'Demo needs work'}. Proceed to retrospective?`,
      title: `Iteration ${iterationNum} Completion Review`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/completion-report.md`, format: 'markdown', label: 'Completion Report' },
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/demo-script.md`, format: 'markdown', label: 'Demo Script' }
        ]
      }
    });

    // RETROSPECTIVE
    const retrospectiveResult = await ctx.task(retrospectiveTask, {
      projectName,
      iterationNumber: iterationNum,
      completion: iterationCompleteResult,
      practices,
      previousRetrospectives: iterations.slice(0, -1).map(i => i.retrospective)
    });

    iterations[iterations.length - 1].retrospective = retrospectiveResult;

    // Breakpoint: Review retrospective
    await ctx.breakpoint({
      question: `Retrospective complete. Identified ${retrospectiveResult.improvements.length} improvements, ${retrospectiveResult.keepers.length} things to keep doing. Team sentiment: ${retrospectiveResult.teamSentiment}. Apply changes and continue to next iteration?`,
      title: `Iteration ${iterationNum} Retrospective Review`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/retrospective.md`, format: 'markdown', label: 'Retrospective' },
          { path: `artifacts/xp/iterations/iteration-${iterationNum}/action-items.md`, format: 'markdown', label: 'Action Items' }
        ]
      }
    });

    // Check if release is complete
    if (completedStories.length >= releasePlanResult.userStories.length) {
      break;
    }
  }

  // ============================================================================
  // PHASE 3: RELEASE COMPLETION
  // ============================================================================

  const releaseCompleteResult = await ctx.task(releaseCompletionTask, {
    projectName,
    releaseGoal,
    releasePlan: releasePlanResult,
    iterations,
    completedStories,
    practices
  });

  // ============================================================================
  // PHASE 4: PRACTICE METRICS & ANALYSIS
  // ============================================================================

  const practiceMetricsResult = await ctx.task(practiceMetricsTask, {
    projectName,
    releaseGoal,
    iterations,
    practices,
    enablePairProgramming,
    enableTDD,
    enableCI,
    enableRefactoring
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `XP Release "${releaseGoal}" complete! Delivered ${releaseCompleteResult.completedStories} of ${releasePlanResult.userStories.length} stories across ${iterations.length} iterations. Final velocity: ${releaseCompleteResult.finalVelocity}. Practice adherence: ${practiceMetricsResult.overallAdherence}%. Release ready for deployment?`,
    title: 'Release Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/xp/release/release-summary.md', format: 'markdown', label: 'Release Summary' },
        { path: 'artifacts/xp/release/practice-metrics.md', format: 'markdown', label: 'Practice Metrics' },
        { path: 'artifacts/xp/release/velocity-trend.md', format: 'markdown', label: 'Velocity Trend' }
      ]
    }
  });

  return {
    success: releaseCompleteResult.releaseReady,
    projectName,
    releaseGoal,
    releasePlan: releasePlanResult,
    iterations,
    releaseCompletion: releaseCompleteResult,
    practiceMetrics: practiceMetricsResult,
    summary: {
      iterationsCompleted: iterations.length,
      storiesCompleted: completedStories.length,
      storiesPlanned: releasePlanResult.userStories.length,
      completionRate: (completedStories.length / releasePlanResult.userStories.length * 100).toFixed(1),
      initialVelocity: releasePlanResult.velocity,
      finalVelocity: releaseCompleteResult.finalVelocity,
      velocityImprovement: ((releaseCompleteResult.finalVelocity - releasePlanResult.velocity) / releasePlanResult.velocity * 100).toFixed(1),
      practiceAdherence: practiceMetricsResult.overallAdherence,
      teamSize,
      iterationLength
    },
    artifacts: {
      release: 'artifacts/xp/release/',
      iterations: 'artifacts/xp/iterations/',
      practices: 'artifacts/xp/practices/',
      metrics: 'artifacts/xp/metrics/'
    },
    metadata: {
      processId: 'methodologies/extreme-programming',
      practices,
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const releasePlanningTask = defineTask('release-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Planning: ${args.releaseGoal}`,
  description: 'Plan release with user stories, estimation, and velocity',

  agent: {
    name: 'xp-release-planner',
    prompt: {
      role: 'XP coach and release planner',
      task: 'Plan XP release with user stories, story point estimation, and velocity planning',
      context: {
        projectName: args.projectName,
        releaseGoal: args.releaseGoal,
        iterationLength: args.iterationLength,
        teamSize: args.teamSize,
        velocity: args.velocity,
        userStories: args.userStories,
        practices: args.practices
      },
      instructions: [
        'Analyze release goal and break down into user stories',
        'Write user stories in "As a... I want... So that..." format',
        'Estimate each story in story points (1, 2, 3, 5, 8, 13)',
        'Prioritize stories by business value and risk',
        'Calculate or validate team velocity',
        'Plan iteration count based on velocity',
        'Identify dependencies between stories',
        'Define release acceptance criteria',
        'Create initial release roadmap',
        'Identify risks and mitigation strategies'
      ],
      outputFormat: 'JSON with user stories, velocity, iteration count, priorities, dependencies, and roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['userStories', 'velocity', 'iterationCount', 'releaseRoadmap'],
      properties: {
        userStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              asA: { type: 'string' },
              iWant: { type: 'string' },
              soThat: { type: 'string' },
              storyPoints: { type: 'number' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              iteration: { type: 'number' }
            }
          }
        },
        velocity: { type: 'number' },
        iterationCount: { type: 'number' },
        totalStoryPoints: { type: 'number' },
        releaseRoadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iteration: { type: 'number' },
              storyIds: { type: 'array', items: { type: 'string' } },
              theme: { type: 'string' },
              storyPoints: { type: 'number' }
            }
          }
        },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
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

  labels: ['agent', 'xp', 'release-planning', 'user-stories']
}));

export const iterationPlanningTask = defineTask('iteration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iterationNumber} Planning`,
  description: 'Select stories, break into tasks, estimate hours',

  agent: {
    name: 'xp-iteration-planner',
    prompt: {
      role: 'XP coach facilitating iteration planning',
      task: 'Select stories for iteration and break into engineering tasks',
      context: {
        projectName: args.projectName,
        releaseGoal: args.releaseGoal,
        iterationNumber: args.iterationNumber,
        iterationLength: args.iterationLength,
        availableStories: args.availableStories,
        velocity: args.velocity,
        teamSize: args.teamSize,
        practices: args.practices
      },
      instructions: [
        'Select stories that fit within velocity budget',
        'Prioritize high-value, low-risk stories first',
        'Break each story into engineering tasks',
        'Estimate tasks in ideal hours',
        'Identify technical tasks (infrastructure, refactoring, etc.)',
        'Assign tasks to pair programming pairs (not individuals)',
        'Ensure tasks are 4-16 hours each',
        'Build in slack time (about 20%)',
        'Validate team commitment and capacity',
        'Define iteration goal and success criteria'
      ],
      outputFormat: 'JSON with selected stories, tasks, estimates, pair assignments, and iteration goal'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStories', 'tasks', 'totalStoryPoints', 'totalHours', 'iterationGoal'],
      properties: {
        selectedStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' }
            }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              storyId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              estimatedHours: { type: 'number' },
              type: { type: 'string', enum: ['feature', 'refactor', 'test', 'infrastructure', 'spike'] },
              status: { type: 'string', enum: ['not-started', 'in-progress', 'complete'] }
            }
          }
        },
        totalStoryPoints: { type: 'number' },
        totalHours: { type: 'number' },
        iterationGoal: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        capacity: {
          type: 'object',
          properties: {
            availableHours: { type: 'number' },
            plannedHours: { type: 'number' },
            slackTime: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'iteration-planning', `iteration-${args.iterationNumber}`]
}));

export const standUpMeetingTask = defineTask('stand-up-meeting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Daily Standup - Day ${args.day}`,
  description: 'Coordinate daily work: yesterday, today, impediments',

  agent: {
    name: 'xp-standup-facilitator',
    prompt: {
      role: 'XP coach facilitating daily standup',
      task: 'Coordinate daily standup: progress, plans, impediments, pair assignments',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        day: args.day,
        tasks: args.tasks,
        completedTasks: args.completedTasks,
        enablePairProgramming: args.enablePairProgramming,
        teamSize: args.teamSize
      },
      instructions: [
        'Review yesterday\'s progress and completed tasks',
        'Identify today\'s tasks to work on',
        'Capture impediments and blockers',
        'Assign pair programming pairs if enabled',
        'Ensure pairs rotate regularly (every 1-2 days)',
        'Balance task assignment across team',
        'Identify tasks at risk',
        'Keep standup timeboxed to 15 minutes',
        'Generate expected commits for the day',
        'Update task board'
      ],
      outputFormat: 'JSON with progress, today\'s plan, impediments, pair assignments, and expected commits'
    },
    outputSchema: {
      type: 'object',
      required: ['yesterdayProgress', 'todaysTasks', 'impediments', 'pairAssignments'],
      properties: {
        yesterdayProgress: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              status: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        todaysTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              title: { type: 'string' },
              estimatedHours: { type: 'number' },
              assignedPair: { type: 'string' }
            }
          }
        },
        impediments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] },
              owner: { type: 'string' }
            }
          }
        },
        pairAssignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pairId: { type: 'string' },
              developers: { type: 'array', items: { type: 'string' } },
              tasks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        expectedCommits: { type: 'number' },
        completedTasks: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'standup', `day-${args.day}`]
}));

export const pairProgrammingTask = defineTask('pair-programming', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pair Programming - Day ${args.day}`,
  description: 'Facilitate pair programming with driver/navigator rotation',

  agent: {
    name: 'xp-pair-programming-coach',
    prompt: {
      role: 'XP coach facilitating pair programming',
      task: 'Facilitate pair programming sessions with proper rotation and knowledge sharing',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        day: args.day,
        pairs: args.pairs,
        tasks: args.tasks
      },
      instructions: [
        'Monitor pair programming sessions',
        'Ensure driver/navigator roles rotate every 20-30 minutes',
        'Track knowledge sharing between pair members',
        'Identify pairing effectiveness',
        'Capture completed work and code quality',
        'Identify when pair needs to split or merge',
        'Monitor communication and collaboration',
        'Measure pairing benefits (defect reduction, knowledge transfer)',
        'Ensure sustainable pace',
        'Rotate pairs periodically for knowledge distribution'
      ],
      outputFormat: 'JSON with pair sessions, rotations, completed work, and knowledge sharing metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['pairSessions', 'completedWork', 'knowledgeSharing'],
      properties: {
        pairSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pairId: { type: 'string' },
              developers: { type: 'array', items: { type: 'string' } },
              taskId: { type: 'string' },
              hoursWorked: { type: 'number' },
              rotations: { type: 'number' },
              effectiveness: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
            }
          }
        },
        completedWork: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              pairId: { type: 'string' },
              linesOfCode: { type: 'number' },
              testsWritten: { type: 'number' },
              codeQuality: { type: 'string' }
            }
          }
        },
        knowledgeSharing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              from: { type: 'string' },
              to: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            totalPairHours: { type: 'number' },
            avgRotationsPerPair: { type: 'number' },
            knowledgeTransferScore: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'pair-programming', `day-${args.day}`]
}));

export const tddPracticeTask = defineTask('tdd-practice', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD Practice - Day ${args.day}`,
  description: 'Enforce test-driven development: Red-Green-Refactor',

  agent: {
    name: 'xp-tdd-coach',
    prompt: {
      role: 'XP coach enforcing TDD practices',
      task: 'Guide test-driven development with Red-Green-Refactor cycle',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        day: args.day,
        tasks: args.tasks,
        existingTests: args.existingTests
      },
      instructions: [
        'Ensure tests are written before production code',
        'Follow Red-Green-Refactor cycle strictly',
        'Track test coverage and quality',
        'Ensure tests are fast (< 10 seconds for unit tests)',
        'Identify code smells and refactoring opportunities',
        'Monitor test quality metrics',
        'Ensure tests are clear and maintainable',
        'Track test execution time',
        'Identify flaky tests',
        'Generate test reports'
      ],
      outputFormat: 'JSON with tests written, coverage, code smells, and TDD metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'coverage', 'codeSmells', 'tddMetrics'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              taskId: { type: 'string' },
              testName: { type: 'string' },
              type: { type: 'string', enum: ['unit', 'integration', 'acceptance'] },
              status: { type: 'string', enum: ['red', 'green'] },
              executionTime: { type: 'number' },
              coverage: { type: 'number' }
            }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            statements: { type: 'number' },
            branches: { type: 'number' },
            functions: { type: 'number' },
            lines: { type: 'number' }
          }
        },
        codeSmells: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        tddMetrics: {
          type: 'object',
          properties: {
            testsWritten: { type: 'number' },
            avgTestExecutionTime: { type: 'number' },
            redGreenCycles: { type: 'number' },
            tddAdherence: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'tdd', `day-${args.day}`]
}));

export const continuousIntegrationTask = defineTask('continuous-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Continuous Integration - Day ${args.day}`,
  description: 'Automate build, test, and integration',

  agent: {
    name: 'xp-ci-coordinator',
    prompt: {
      role: 'XP coach managing continuous integration',
      task: 'Coordinate continuous integration with frequent commits and automated builds',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        day: args.day,
        commits: args.commits,
        tests: args.tests
      },
      instructions: [
        'Ensure frequent commits (multiple per day per pair)',
        'Run automated build on each commit',
        'Execute all tests on each build',
        'Provide immediate feedback on build status',
        'Track build failures and fix time',
        'Ensure build stays green (passing)',
        'Monitor build performance and optimization',
        'Track integration issues',
        'Generate CI reports',
        'Enforce "fix broken build immediately" rule'
      ],
      outputFormat: 'JSON with builds, commits, build status, failures, and CI metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['builds', 'commits', 'buildStatus', 'ciMetrics'],
      properties: {
        builds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              buildId: { type: 'string' },
              commitHash: { type: 'string' },
              status: { type: 'string', enum: ['passing', 'failing'] },
              duration: { type: 'number' },
              testsRun: { type: 'number' },
              testsPassed: { type: 'number' },
              testsFailed: { type: 'number' }
            }
          }
        },
        commits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hash: { type: 'string' },
              author: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        buildStatus: { type: 'string', enum: ['passing', 'failing'] },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              buildId: { type: 'string' },
              reason: { type: 'string' },
              fixTime: { type: 'number' }
            }
          }
        },
        ciMetrics: {
          type: 'object',
          properties: {
            totalCommits: { type: 'number' },
            totalBuilds: { type: 'number' },
            buildSuccessRate: { type: 'number' },
            avgBuildTime: { type: 'number' },
            avgFixTime: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'continuous-integration', `day-${args.day}`]
}));

export const refactoringTask = defineTask('refactoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refactoring - Day ${args.day}`,
  description: 'Continuous refactoring to improve code quality',

  agent: {
    name: 'xp-refactoring-specialist',
    prompt: {
      role: 'XP coach facilitating continuous refactoring',
      task: 'Guide continuous refactoring while maintaining test coverage',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        day: args.day,
        codeSmells: args.codeSmells,
        recentChanges: args.recentChanges
      },
      instructions: [
        'Identify refactoring opportunities from code smells',
        'Prioritize refactorings by impact and risk',
        'Ensure all tests pass before refactoring',
        'Apply refactorings incrementally',
        'Ensure all tests still pass after refactoring',
        'Track code quality improvements',
        'Maintain collective code ownership',
        'Document significant refactorings',
        'Measure refactoring impact on maintainability',
        'Balance new features with technical debt reduction'
      ],
      outputFormat: 'JSON with refactorings performed, quality improvements, and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['refactorings', 'qualityImprovements', 'metrics'],
      properties: {
        refactorings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              testsAffected: { type: 'number' }
            }
          }
        },
        qualityImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              before: { type: 'number' },
              after: { type: 'number' },
              improvement: { type: 'number' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            refactoringsPerformed: { type: 'number' },
            codeSmellsResolved: { type: 'number' },
            technicalDebtReduced: { type: 'number' },
            maintainabilityScore: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'refactoring', `day-${args.day}`]
}));

export const iterationCompletionTask = defineTask('iteration-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iterationNumber} Completion`,
  description: 'Complete iteration: demo, acceptance, velocity calculation',

  agent: {
    name: 'xp-iteration-manager',
    prompt: {
      role: 'XP coach completing iteration',
      task: 'Complete iteration with demo preparation, acceptance, and metrics',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        plan: args.plan,
        dailyResults: args.dailyResults,
        practices: args.practices
      },
      instructions: [
        'Identify completed stories and calculate actual velocity',
        'Prepare demo script for stakeholder review',
        'Verify acceptance criteria for completed stories',
        'Identify incomplete work and reasons',
        'Calculate iteration metrics (velocity, burn-down, etc.)',
        'Assess practice adherence',
        'Identify what went well and what needs improvement',
        'Prepare for retrospective',
        'Update release progress',
        'Archive iteration artifacts'
      ],
      outputFormat: 'JSON with completed stories, actual velocity, demo script, metrics, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['completedStories', 'actualVelocity', 'demoScript', 'metrics'],
      properties: {
        completedStories: { type: 'number' },
        completedStoryIds: { type: 'array', items: { type: 'string' } },
        incompleteStories: { type: 'number' },
        actualVelocity: { type: 'number' },
        plannedVelocity: { type: 'number' },
        demoScript: {
          type: 'object',
          properties: {
            stories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  storyId: { type: 'string' },
                  title: { type: 'string' },
                  demoSteps: { type: 'array', items: { type: 'string' } },
                  acceptanceCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        demoReady: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            tasksCompleted: { type: 'number' },
            tasksTotal: { type: 'number' },
            hoursSpent: { type: 'number' },
            hoursPlanned: { type: 'number' },
            defectsFound: { type: 'number' },
            testCoverage: { type: 'number' },
            buildSuccessRate: { type: 'number' }
          }
        },
        practiceAdherence: {
          type: 'object',
          properties: {
            pairProgramming: { type: 'number' },
            tdd: { type: 'number' },
            continuousIntegration: { type: 'number' },
            refactoring: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'iteration-completion', `iteration-${args.iterationNumber}`]
}));

export const retrospectiveTask = defineTask('retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iterationNumber} Retrospective`,
  description: 'Team retrospective: what worked, what to improve',

  agent: {
    name: 'xp-retrospective-facilitator',
    prompt: {
      role: 'XP coach facilitating retrospective',
      task: 'Facilitate iteration retrospective to identify improvements',
      context: {
        projectName: args.projectName,
        iterationNumber: args.iterationNumber,
        completion: args.completion,
        practices: args.practices,
        previousRetrospectives: args.previousRetrospectives
      },
      instructions: [
        'Review iteration metrics and outcomes',
        'Identify what went well (keep doing)',
        'Identify what didn\'t work (stop doing)',
        'Identify improvements (start doing)',
        'Review action items from previous retrospective',
        'Assess team sentiment and morale',
        'Identify process improvements',
        'Create actionable improvement items',
        'Assign owners to action items',
        'Track team happiness and sustainability'
      ],
      outputFormat: 'JSON with keepers, improvements, action items, team sentiment, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['keepers', 'improvements', 'actionItems', 'teamSentiment'],
      properties: {
        keepers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              reason: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              issue: { type: 'string' },
              suggestion: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        actionItems: {
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
        teamSentiment: { type: 'string', enum: ['excellent', 'good', 'neutral', 'struggling', 'burned-out'] },
        sustainablePace: { type: 'boolean' },
        previousActionItemsCompleted: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'retrospective', `iteration-${args.iterationNumber}`]
}));

export const releaseCompletionTask = defineTask('release-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Completion: ${args.releaseGoal}`,
  description: 'Complete release with final metrics and deployment readiness',

  agent: {
    name: 'xp-release-manager',
    prompt: {
      role: 'XP coach completing release',
      task: 'Complete release with final assessment and deployment preparation',
      context: {
        projectName: args.projectName,
        releaseGoal: args.releaseGoal,
        releasePlan: args.releasePlan,
        iterations: args.iterations,
        completedStories: args.completedStories,
        practices: args.practices
      },
      instructions: [
        'Verify all acceptance criteria met',
        'Calculate final velocity and trends',
        'Assess release completeness',
        'Prepare release notes',
        'Verify deployment readiness',
        'Document known issues and workarounds',
        'Calculate release metrics',
        'Assess practice effectiveness across release',
        'Identify lessons learned',
        'Plan next release improvements'
      ],
      outputFormat: 'JSON with release summary, final velocity, deployment readiness, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['completedStories', 'finalVelocity', 'releaseReady', 'releaseNotes'],
      properties: {
        completedStories: { type: 'number' },
        plannedStories: { type: 'number' },
        finalVelocity: { type: 'number' },
        velocityTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
        releaseReady: { type: 'boolean' },
        releaseNotes: {
          type: 'object',
          properties: {
            features: { type: 'array', items: { type: 'string' } },
            bugFixes: { type: 'array', items: { type: 'string' } },
            knownIssues: { type: 'array', items: { type: 'string' } },
            upgradeNotes: { type: 'array', items: { type: 'string' } }
          }
        },
        deploymentReadiness: {
          type: 'object',
          properties: {
            testsPass: { type: 'boolean' },
            buildsPassing: { type: 'boolean' },
            documentationComplete: { type: 'boolean' },
            stakeholdersApproved: { type: 'boolean' }
          }
        },
        releaseMetrics: {
          type: 'object',
          properties: {
            totalIterations: { type: 'number' },
            avgVelocity: { type: 'number' },
            defectRate: { type: 'number' },
            testCoverage: { type: 'number' },
            teamSatisfaction: { type: 'number' }
          }
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'xp', 'release-completion']
}));

export const practiceMetricsTask = defineTask('practice-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'XP Practice Metrics Analysis',
  description: 'Analyze XP practice adherence and effectiveness',

  agent: {
    name: 'xp-metrics-analyst',
    prompt: {
      role: 'XP coach analyzing practice metrics',
      task: 'Analyze XP practice adherence and effectiveness across release',
      context: {
        projectName: args.projectName,
        releaseGoal: args.releaseGoal,
        iterations: args.iterations,
        practices: args.practices,
        enablePairProgramming: args.enablePairProgramming,
        enableTDD: args.enableTDD,
        enableCI: args.enableCI,
        enableRefactoring: args.enableRefactoring
      },
      instructions: [
        'Calculate adherence metrics for each XP practice',
        'Analyze correlation between practice adherence and velocity',
        'Identify most effective practices for this team',
        'Identify practices that need improvement',
        'Calculate ROI of XP practices',
        'Measure quality improvements',
        'Assess team satisfaction with practices',
        'Generate practice effectiveness report',
        'Provide recommendations for future releases',
        'Benchmark against XP best practices'
      ],
      outputFormat: 'JSON with practice metrics, adherence scores, effectiveness analysis, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['practiceMetrics', 'overallAdherence', 'effectiveness', 'recommendations'],
      properties: {
        practiceMetrics: {
          type: 'object',
          properties: {
            pairProgramming: {
              type: 'object',
              properties: {
                adherence: { type: 'number' },
                hoursInPairs: { type: 'number' },
                knowledgeTransferScore: { type: 'number' },
                defectReduction: { type: 'number' }
              }
            },
            tdd: {
              type: 'object',
              properties: {
                adherence: { type: 'number' },
                testCoverage: { type: 'number' },
                redGreenCycles: { type: 'number' },
                avgTestExecutionTime: { type: 'number' }
              }
            },
            continuousIntegration: {
              type: 'object',
              properties: {
                adherence: { type: 'number' },
                commitsPerDay: { type: 'number' },
                buildSuccessRate: { type: 'number' },
                avgFixTime: { type: 'number' }
              }
            },
            refactoring: {
              type: 'object',
              properties: {
                adherence: { type: 'number' },
                refactoringsPerformed: { type: 'number' },
                technicalDebtReduced: { type: 'number' },
                maintainabilityImprovement: { type: 'number' }
              }
            }
          }
        },
        overallAdherence: { type: 'number' },
        effectiveness: {
          type: 'object',
          properties: {
            velocityCorrelation: { type: 'number' },
            qualityCorrelation: { type: 'number' },
            teamSatisfactionCorrelation: { type: 'number' },
            mostEffective: { type: 'array', items: { type: 'string' } },
            needsImprovement: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' }
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

  labels: ['agent', 'xp', 'metrics', 'analysis']
}));
