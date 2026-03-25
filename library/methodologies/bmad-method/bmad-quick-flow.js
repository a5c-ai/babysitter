/**
 * @process methodologies/bmad-method/bmad-quick-flow
 * @description BMAD Quick Flow - Lean solo-developer workflow for rapid spec-to-implementation
 * @inputs { projectName: string, projectDescription: string, techStack?: string, storyCount?: number }
 * @outputs { success: boolean, techSpec: object, stories: array, implementation: object, review: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Quick Flow - Solo Developer Rapid Development
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * Barry (Solo Dev) handles the complete workflow with minimal overhead:
 * 1. Quick Spec - Technical specification with implementation stories
 * 2. Quick Dev - Full-stack implementation per story
 * 3. Code Review - Multi-dimensional quality check
 *
 * Designed for small-to-medium projects where a single developer can
 * handle spec, implementation, and review. Emphasizes shipping code
 * over bureaucratic process artifacts.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectDescription - Project description and requirements
 * @param {string} inputs.techStack - Preferred technology stack (optional)
 * @param {number} inputs.storyCount - Number of stories to generate (default: 5)
 * @param {string} inputs.codebaseContext - Existing codebase context for brownfield projects (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Quick flow results with spec, implementation, and review
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    techStack = null,
    storyCount = 5,
    codebaseContext = null
  } = inputs;

  // ============================================================================
  // QUICK SPEC: Technical specification with stories (Barry)
  // ============================================================================

  const techSpecResult = await ctx.task(quickSpecTask, {
    projectName,
    projectDescription,
    techStack,
    storyCount,
    codebaseContext
  });

  await ctx.breakpoint({
    question: `Quick Spec complete for "${projectName}". Barry created a tech spec with ${techSpecResult.stories?.length || storyCount} implementation stories. Stack: ${techSpecResult.techStack || techStack || 'TBD'}. Approve to begin implementation?`,
    title: 'BMAD Quick Flow - Spec Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/quick-flow/tech-spec.md', format: 'markdown', label: 'Tech Spec' }
      ]
    }
  });

  // ============================================================================
  // QUICK DEV: Implement each story (Barry)
  // ============================================================================

  const implementationResults = [];
  const stories = techSpecResult.stories || [];

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];

    const devResult = await ctx.task(quickDevTask, {
      projectName,
      story,
      storyIndex: i + 1,
      totalStories: stories.length,
      techSpec: techSpecResult,
      previousResults: implementationResults
    });

    implementationResults.push(devResult);
  }

  // ============================================================================
  // CODE REVIEW: Multi-dimensional quality review (Barry)
  // ============================================================================

  const reviewResult = await ctx.task(quickFlowCodeReviewTask, {
    projectName,
    techSpec: techSpecResult,
    implementationResults,
    stories
  });

  await ctx.breakpoint({
    question: `Quick Flow complete for "${projectName}". ${implementationResults.length} stories implemented. Code review: ${reviewResult.overallRating || 'complete'} (${reviewResult.score || 0}/100). ${reviewResult.criticalIssues || 0} critical issues. Accept delivery?`,
    title: 'BMAD Quick Flow - Final Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/quick-flow/tech-spec.md', format: 'markdown', label: 'Tech Spec' },
        { path: 'artifacts/bmad/quick-flow/code-review.md', format: 'markdown', label: 'Code Review' },
        { path: 'artifacts/bmad/quick-flow/summary.md', format: 'markdown', label: 'Summary' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    techSpec: techSpecResult,
    stories: implementationResults,
    review: reviewResult,
    artifacts: {
      techSpec: 'artifacts/bmad/quick-flow/tech-spec.md',
      codeReview: 'artifacts/bmad/quick-flow/code-review.md',
      summary: 'artifacts/bmad/quick-flow/summary.md'
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-quick-flow',
      timestamp: ctx.now(),
      framework: 'BMAD Method - Quick Flow',
      agent: 'Barry (Solo Dev)',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Quick Spec - Barry creates technical specification with stories
 */
export const quickSpecTask = defineTask('bmad-quick-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quick Spec: ${args.projectName}`,
  description: 'Barry (Solo Dev) creates lean technical specification with implementation stories',

  agent: {
    name: 'bmad-solodev-barry',
    prompt: {
      role: 'Barry - Elite Full-Stack Developer and Quick Flow specialist. Planning and execution are two sides of the same coin. Lean artifacts, minimal bureaucracy.',
      task: 'Create a technical specification with implementation-ready user stories',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        techStack: args.techStack,
        storyCount: args.storyCount,
        codebaseContext: args.codebaseContext
      },
      instructions: [
        'Define technical approach and architecture decisions',
        'Select and justify technology stack',
        'Create implementation-ready stories with clear tasks',
        'Each story should be independently implementable',
        'Include acceptance criteria for each story',
        'Order stories by dependency and logical flow',
        'Keep spec lean - only what is needed to implement',
        'Include database schema if applicable',
        'Define API endpoints if applicable',
        'Identify risks and mitigation for each story'
      ],
      outputFormat: 'JSON with tech spec, architecture decisions, and ordered stories'
    },
    outputSchema: {
      type: 'object',
      required: ['techStack', 'architectureDecisions', 'stories'],
      properties: {
        techStack: { type: 'string' },
        architectureDecisions: { type: 'array', items: { type: 'object' } },
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              storyPoints: { type: 'number' }
            }
          }
        },
        databaseSchema: { type: 'object' },
        apiEndpoints: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/quick-flow/tech-spec.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'quick-flow', 'spec', 'barry']
}));

/**
 * Quick Dev - Barry implements a single story
 */
export const quickDevTask = defineTask('bmad-quick-dev', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quick Dev Story ${args.storyIndex}/${args.totalStories}: ${args.story?.title || 'Story'}`,
  description: 'Barry (Solo Dev) implements story with tests and documentation',

  agent: {
    name: 'bmad-solodev-barry',
    prompt: {
      role: 'Barry - Elite developer implementing story. Ship it and iterate. Results over process.',
      task: 'Implement the story with tests, following the tech spec',
      context: {
        projectName: args.projectName,
        story: args.story,
        storyIndex: args.storyIndex,
        totalStories: args.totalStories,
        techSpec: args.techSpec,
        previousResults: args.previousResults
      },
      instructions: [
        'Read story and all acceptance criteria before starting',
        'Write tests first where practical',
        'Implement the feature following tech spec architecture',
        'Ensure all acceptance criteria are met',
        'Run tests and fix any failures',
        'Document implementation decisions',
        'Update any shared configuration or schema',
        'Keep implementation focused and minimal'
      ],
      outputFormat: 'JSON with implementation results, test results, and files changed'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'testsWritten', 'testsPassed'],
      properties: {
        completed: { type: 'boolean' },
        storyId: { type: 'string' },
        testsWritten: { type: 'number' },
        testsPassed: { type: 'number' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        implementationNotes: { type: 'string' },
        acceptanceCriteriaMet: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/quick-flow/story-${args.storyIndex}.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'quick-flow', 'dev', 'barry']
}));

/**
 * Quick Flow Code Review - Barry reviews all implementation
 */
export const quickFlowCodeReviewTask = defineTask('bmad-quick-flow-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quick Flow Code Review: ${args.projectName}`,
  description: 'Barry (Solo Dev) performs multi-dimensional code review of all deliverables',

  agent: {
    name: 'bmad-solodev-barry',
    prompt: {
      role: 'Barry - Senior developer reviewing code across correctness, security, performance, maintainability, and test coverage dimensions',
      task: 'Comprehensive code review of all implemented stories',
      context: {
        projectName: args.projectName,
        techSpec: args.techSpec,
        implementationResults: args.implementationResults,
        stories: args.stories
      },
      instructions: [
        'Review correctness against acceptance criteria',
        'Check security: input validation, auth, data protection',
        'Assess performance: efficiency, resource usage',
        'Evaluate maintainability: code clarity, patterns, SOLID',
        'Verify test coverage and test quality',
        'Check architecture compliance with tech spec',
        'Identify any technical debt',
        'Rate overall quality on 0-100 scale',
        'Provide specific improvement recommendations',
        'Generate summary for stakeholder communication'
      ],
      outputFormat: 'JSON with review results, scores, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRating', 'score'],
      properties: {
        overallRating: { type: 'string' },
        score: { type: 'number' },
        criticalIssues: { type: 'number' },
        findings: { type: 'array', items: { type: 'object' } },
        categoryScores: {
          type: 'object',
          properties: {
            correctness: { type: 'number' },
            security: { type: 'number' },
            performance: { type: 'number' },
            maintainability: { type: 'number' },
            testCoverage: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        technicalDebt: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/quick-flow/code-review.md', format: 'markdown' },
      { path: 'artifacts/bmad/quick-flow/summary.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'quick-flow', 'code-review', 'barry']
}));
