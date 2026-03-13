/**
 * @process methodologies/bmad-method/bmad-implementation
 * @description BMAD Implementation Phase - Sprint-based development with dev, QA, and SM agents
 * @inputs { projectName: string, epics: object, architecture?: object, sprintCount?: number }
 * @outputs { success: boolean, sprints: array, metrics: object, documentation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Implementation Phase - Sprint Development
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * Standalone implementation phase with multi-agent collaboration:
 * - Bob (Scrum Master) - Sprint planning, retrospectives, course corrections
 * - Amelia (Developer) - TDD story implementation and code review
 * - Quinn (QA Engineer) - Test automation and quality gates
 *
 * Supports mid-sprint course corrections when issues are detected.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {Object} inputs.epics - Epics and stories from solutioning phase
 * @param {Object} inputs.architecture - Architecture decisions (optional)
 * @param {number} inputs.sprintCount - Number of sprints (default: 3)
 * @param {string} inputs.definitionOfDone - Definition of Done criteria (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Sprint results with metrics and documentation
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    epics,
    architecture = null,
    sprintCount = 3,
    definitionOfDone = null
  } = inputs;

  const sprintResults = [];
  let cumulativeVelocity = 0;

  for (let sprintIdx = 0; sprintIdx < sprintCount; sprintIdx++) {
    const sprintNumber = sprintIdx + 1;

    // Sprint planning
    const plan = await ctx.task(implSprintPlanTask, {
      projectName, sprintNumber, epics,
      previousSprints: sprintResults,
      architecture, definitionOfDone
    });

    await ctx.breakpoint({
      question: `Sprint ${sprintNumber} planned for "${projectName}". Goal: "${plan.sprintGoal}". ${plan.storyCount} stories, ${plan.totalStoryPoints} points. Start sprint?`,
      title: `Sprint ${sprintNumber} Plan`,
      context: { runId: ctx.runId, files: [
        { path: `artifacts/bmad/sprints/sprint-${sprintNumber}/plan.md`, format: 'markdown', label: 'Sprint Plan' }
      ]}
    });

    // Develop stories
    const storyResults = [];
    for (let i = 0; i < (plan.stories || []).length; i++) {
      const result = await ctx.task(implDevelopStoryTask, {
        projectName, sprintNumber, story: plan.stories[i],
        storyIndex: i + 1, totalStories: plan.stories.length,
        architecture, definitionOfDone
      });
      storyResults.push(result);
    }

    // Code review
    const review = await ctx.task(implCodeReviewTask, {
      projectName, sprintNumber, storyResults
    });

    // QA testing
    const qa = await ctx.task(implQaTask, {
      projectName, sprintNumber, storyResults, codeReview: review
    });

    // Course correction check if quality issues detected
    if (qa.testsFailed > 0 || (review.score && review.score < 60)) {
      const correction = await ctx.task(courseCorrectionTask, {
        projectName, sprintNumber, codeReview: review, qa,
        storyResults
      });

      await ctx.breakpoint({
        question: `Course correction needed in Sprint ${sprintNumber}. ${correction.issuesIdentified} issues found. ${correction.recommendedActions?.length || 0} corrective actions proposed. Apply corrections?`,
        title: `Sprint ${sprintNumber} Course Correction`,
        context: { runId: ctx.runId, files: [
          { path: `artifacts/bmad/sprints/sprint-${sprintNumber}/course-correction.md`, format: 'markdown', label: 'Course Correction' }
        ]}
      });
    }

    // Retrospective
    const retro = await ctx.task(implRetroTask, {
      projectName, sprintNumber, plan, storyResults, review, qa
    });

    const sprintVelocity = storyResults.filter(s => s.completed).reduce(
      (sum, s) => sum + (s.storyPoints || 0), 0
    );
    cumulativeVelocity += sprintVelocity;

    sprintResults.push({
      sprintNumber, plan, stories: storyResults,
      codeReview: review, qa, retrospective: retro,
      velocity: sprintVelocity
    });

    await ctx.breakpoint({
      question: `Sprint ${sprintNumber} complete. Velocity: ${sprintVelocity} pts. Tests: ${qa.testsPassed}/${qa.totalTests}. Quality: ${review.overallRating}. ${retro.improvements?.length || 0} improvements. ${sprintIdx < sprintCount - 1 ? 'Continue to next sprint?' : 'Finalize?'}`,
      title: `Sprint ${sprintNumber} Summary`,
      context: { runId: ctx.runId, files: [
        { path: `artifacts/bmad/sprints/sprint-${sprintNumber}/retrospective.md`, format: 'markdown', label: 'Retrospective' }
      ]}
    });
  }

  // Sprint status summary
  const statusResult = await ctx.task(sprintStatusTask, {
    projectName, sprintResults, sprintCount
  });

  return {
    success: true,
    projectName,
    sprints: sprintResults,
    metrics: {
      totalSprints: sprintCount,
      totalVelocity: cumulativeVelocity,
      averageVelocity: cumulativeVelocity / sprintCount,
      totalStoriesCompleted: sprintResults.reduce(
        (sum, s) => sum + s.stories.filter(st => st.completed).length, 0
      )
    },
    status: statusResult,
    artifacts: {
      sprintPlans: sprintResults.map((_, i) => `artifacts/bmad/sprints/sprint-${i + 1}/plan.md`),
      retrospectives: sprintResults.map((_, i) => `artifacts/bmad/sprints/sprint-${i + 1}/retrospective.md`)
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-implementation',
      timestamp: ctx.now(),
      framework: 'BMAD Method - Implementation Phase',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const implSprintPlanTask = defineTask('bmad-impl-sprint-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} Planning: ${args.projectName}`,
  description: 'Bob (SM) plans implementation sprint',
  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Technical Scrum Master planning sprint with focus on achievable commitments',
      task: 'Plan sprint selecting stories from epic backlog',
      context: args,
      instructions: [
        'Select stories from available epics based on priority and dependencies',
        'Define coherent sprint goal',
        'Break stories into tasks where needed',
        'Consider velocity from previous sprints',
        'Ensure stories meet Definition of Done criteria readiness',
        'Balance feature work with technical debt'
      ],
      outputFormat: 'JSON with sprint goal, stories, and execution plan'
    },
    outputSchema: {
      type: 'object',
      required: ['sprintGoal', 'stories', 'storyCount'],
      properties: {
        sprintGoal: { type: 'string' },
        stories: { type: 'array', items: { type: 'object' } },
        storyCount: { type: 'number' },
        totalStoryPoints: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/sprints/sprint-${args.sprintNumber}/plan.md`, format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'sprint-planning', 'bob']
}));

export const implDevelopStoryTask = defineTask('bmad-impl-dev-story', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dev Story ${args.storyIndex}/${args.totalStories}: Sprint ${args.sprintNumber}`,
  description: 'Amelia (Dev) implements story with TDD',
  agent: {
    name: 'bmad-dev-amelia',
    prompt: {
      role: 'Amelia - Senior Engineer with strict TDD discipline',
      task: 'Implement story following test-driven development',
      context: args,
      instructions: [
        'Read story completely before starting',
        'Write failing tests for each acceptance criterion',
        'Implement minimal code to pass each test',
        'Refactor while tests remain green',
        'Run full test suite after implementation',
        'Document implementation decisions'
      ],
      outputFormat: 'JSON with implementation and test results'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'testsWritten', 'testsPassed'],
      properties: {
        completed: { type: 'boolean' },
        storyPoints: { type: 'number' },
        testsWritten: { type: 'number' },
        testsPassed: { type: 'number' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        implementationNotes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: []
  },
  labels: ['agent', 'bmad', 'implementation', 'development', 'amelia']
}));

export const implCodeReviewTask = defineTask('bmad-impl-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code Review Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Amelia (Dev) performs multi-dimensional code review',
  agent: {
    name: 'bmad-dev-amelia',
    prompt: {
      role: 'Amelia - Senior Developer reviewing code for correctness, security, performance, maintainability, and test coverage',
      task: 'Review all sprint code deliverables',
      context: args,
      instructions: [
        'Review for correctness and logic errors',
        'Check security best practices',
        'Assess performance implications',
        'Evaluate maintainability and code clarity',
        'Verify test coverage adequacy',
        'Rate overall quality 0-100'
      ],
      outputFormat: 'JSON with review results and scores'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRating', 'score'],
      properties: {
        overallRating: { type: 'string' },
        score: { type: 'number' },
        findings: { type: 'array', items: { type: 'object' } },
        categoryScores: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/sprints/sprint-${args.sprintNumber}/code-review.md`, format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'code-review', 'amelia']
}));

export const implQaTask = defineTask('bmad-impl-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: `QA Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Quinn (QA) runs automated tests and quality checks',
  agent: {
    name: 'bmad-qa-quinn',
    prompt: {
      role: 'Quinn - QA Engineer with pragmatic ship-it mentality focused on rapid test coverage',
      task: 'Test sprint deliverables with API and E2E tests',
      context: args,
      instructions: [
        'Generate API tests for new endpoints',
        'Create E2E tests for user flows',
        'Run regression suite',
        'Generate coverage report',
        'Provide quality gate recommendation'
      ],
      outputFormat: 'JSON with test results and quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testsPassed', 'testsFailed'],
      properties: {
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        coveragePercent: { type: 'number' },
        qualityGate: { type: 'string' },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/sprints/sprint-${args.sprintNumber}/qa-report.md`, format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'qa', 'quinn']
}));

export const courseCorrectionTask = defineTask('bmad-course-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Course Correction Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Bob (SM) facilitates mid-sprint course correction when quality issues detected',
  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Scrum Master facilitating course correction to address quality issues mid-sprint',
      task: 'Analyze quality issues and recommend corrective actions',
      context: args,
      instructions: [
        'Analyze code review and QA findings',
        'Identify root causes of quality issues',
        'Recommend specific corrective actions',
        'Prioritize actions by impact and urgency',
        'Assess impact on sprint goal',
        'Propose adjusted sprint scope if needed'
      ],
      outputFormat: 'JSON with issue analysis and corrective actions'
    },
    outputSchema: {
      type: 'object',
      required: ['issuesIdentified', 'recommendedActions'],
      properties: {
        issuesIdentified: { type: 'number' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        recommendedActions: { type: 'array', items: { type: 'object' } },
        sprintGoalImpact: { type: 'string' },
        scopeAdjustments: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/sprints/sprint-${args.sprintNumber}/course-correction.md`, format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'course-correction', 'bob']
}));

export const implRetroTask = defineTask('bmad-impl-retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Retrospective Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Bob (SM) facilitates sprint retrospective',
  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Scrum Master facilitating retrospective for continuous improvement',
      task: 'Facilitate sprint retrospective',
      context: args,
      instructions: [
        'Review sprint goal achievement',
        'Identify what went well',
        'Identify what to improve',
        'Create actionable improvement items',
        'Celebrate successes',
        'Plan improvements for next sprint'
      ],
      outputFormat: 'JSON with retrospective results'
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'toImprove', 'improvements'],
      properties: {
        wentWell: { type: 'array', items: { type: 'string' } },
        toImprove: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'object' } },
        sprintGoalAchieved: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/sprints/sprint-${args.sprintNumber}/retrospective.md`, format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'retrospective', 'bob']
}));

export const sprintStatusTask = defineTask('bmad-sprint-status', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint Status Summary: ${args.projectName}`,
  description: 'Bob (SM) generates cross-sprint status report',
  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Scrum Master generating comprehensive sprint status report',
      task: 'Generate cross-sprint status summary with velocity trends and recommendations',
      context: args,
      instructions: [
        'Summarize each sprint\'s outcomes',
        'Calculate velocity trends',
        'Assess overall project health',
        'Identify systemic issues across sprints',
        'Recommend process adjustments',
        'Project remaining work estimates'
      ],
      outputFormat: 'JSON with status summary, metrics, and projections'
    },
    outputSchema: {
      type: 'object',
      required: ['overallStatus', 'velocityTrend'],
      properties: {
        overallStatus: { type: 'string' },
        velocityTrend: { type: 'string' },
        sprintSummaries: { type: 'array', items: { type: 'object' } },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        projectedCompletion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/sprints/status-summary.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'implementation', 'status', 'bob']
}));
