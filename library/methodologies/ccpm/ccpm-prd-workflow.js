/**
 * @process methodologies/ccpm/ccpm-prd-workflow
 * @description CCPM Product Planning - Brainstorm, draft PRD, review, and finalize with quality gates
 * @inputs { projectName: string, featureName: string, projectDescription: string, targetAudience?: string, constraints?: array }
 * @outputs { success: boolean, prd: object, brainstorm: object, validation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * CCPM PRD Workflow
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Phase 1: Product Planning - Create comprehensive PRDs with vision, user stories,
 * success criteria, and constraints through iterative brainstorming and quality-gated refinement.
 *
 * Workflow:
 * 1. Brainstorm - Explore problem space, identify users and pain points
 * 2. Draft PRD - Create structured PRD with all required sections
 * 3. Review - Validate completeness, clarity, and measurability
 * 4. Refine - Iteratively improve until quality threshold met
 * 5. Finalize - Human approval and output to .claude/prds/
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureName - Feature name for PRD file naming
 * @param {string} inputs.projectDescription - High-level description
 * @param {string} inputs.targetAudience - Target audience description (optional)
 * @param {Array} inputs.constraints - Known constraints (optional)
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {number} inputs.maxRefinements - Maximum refinement iterations (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} PRD workflow results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureName,
    projectDescription,
    targetAudience = null,
    constraints = [],
    qualityThreshold = 80,
    maxRefinements = 3
  } = inputs;

  ctx.log('Starting CCPM PRD Workflow', { projectName, featureName });

  // ============================================================================
  // STEP 1: BRAINSTORM
  // ============================================================================

  ctx.log('Step 1: Brainstorming');

  const brainstormResult = await ctx.task(prdBrainstormTask, {
    projectName,
    featureName,
    projectDescription,
    targetAudience,
    constraints
  });

  // Breakpoint for brainstorm review
  await ctx.breakpoint({
    question: `Review brainstorm output for "${featureName}". ${brainstormResult.ideas?.length || 0} ideas generated, ${brainstormResult.targetUsers?.length || 0} user segments identified. Refine brainstorm or proceed to PRD drafting?`,
    title: 'Brainstorm Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/ccpm/brainstorm-${featureName}.md`, format: 'markdown', label: 'Brainstorm Output' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: DRAFT PRD
  // ============================================================================

  ctx.log('Step 2: Drafting PRD');

  const draftPrd = await ctx.task(prdDraftTask, {
    projectName,
    featureName,
    projectDescription,
    brainstorm: brainstormResult,
    targetAudience,
    constraints
  });

  // ============================================================================
  // STEP 3: REVIEW AND VALIDATE
  // ============================================================================

  ctx.log('Step 3: Reviewing PRD');

  let currentPrd = draftPrd;
  let validation = await ctx.task(prdReviewTask, {
    prd: currentPrd,
    projectName,
    featureName,
    qualityThreshold
  });

  // ============================================================================
  // STEP 4: QUALITY CONVERGENCE LOOP
  // ============================================================================

  let refinementCount = 0;

  while (!validation.passes && refinementCount < maxRefinements) {
    refinementCount++;
    ctx.log('PRD Refinement', { iteration: refinementCount, score: validation.score, issues: validation.issues?.length });

    currentPrd = await ctx.task(prdRefineTask, {
      prd: currentPrd,
      feedback: validation,
      projectName,
      featureName,
      brainstorm: brainstormResult
    });

    validation = await ctx.task(prdReviewTask, {
      prd: currentPrd,
      projectName,
      featureName,
      qualityThreshold
    });
  }

  // ============================================================================
  // STEP 5: FINALIZE
  // ============================================================================

  ctx.log('Step 5: Finalizing PRD', { score: validation.score, refinements: refinementCount });

  const finalPrd = await ctx.task(prdFinalizeTask, {
    prd: currentPrd,
    validation,
    projectName,
    featureName,
    brainstorm: brainstormResult
  });

  await ctx.breakpoint({
    question: `PRD for "${featureName}" is ready. Quality score: ${validation.score}/100 (${validation.passes ? 'PASSED' : 'best effort after ' + maxRefinements + ' refinements'}). ${currentPrd.userStories?.length || 0} user stories defined. Approve final PRD?`,
    title: 'PRD Finalization',
    context: {
      runId: ctx.runId,
      files: [
        { path: `.claude/prds/${featureName}.md`, format: 'markdown', label: 'Final PRD' }
      ]
    }
  });

  return {
    success: validation.passes,
    projectName,
    featureName,
    prd: finalPrd,
    brainstorm: brainstormResult,
    validation,
    refinementCount,
    artifacts: {
      prdPath: `.claude/prds/${featureName}.md`,
      brainstormPath: `artifacts/ccpm/brainstorm-${featureName}.md`
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-prd-workflow',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const prdBrainstormTask = defineTask('ccpm-prd-brainstorm', (args, taskCtx) => ({
  kind: 'agent',
  title: `PRD Brainstorm: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'Product visionary and brainstorming facilitator',
      task: `Explore the problem space for feature "${args.featureName}" in project "${args.projectName}"`,
      context: {
        projectDescription: args.projectDescription,
        targetAudience: args.targetAudience,
        constraints: args.constraints
      },
      instructions: [
        'Identify target user segments and their pain points',
        'Explore the competitive landscape',
        'Generate solution ideas ranked by impact and feasibility',
        'Define preliminary success criteria',
        'Identify risks and assumptions',
        'Document open questions for stakeholder review'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ideas', 'targetUsers', 'painPoints', 'successCriteria', 'risks'],
      properties: {
        ideas: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, impact: { type: 'string' }, feasibility: { type: 'string' } } } },
        targetUsers: { type: 'array' },
        painPoints: { type: 'array' },
        successCriteria: { type: 'array' },
        risks: { type: 'array' },
        competitiveLandscape: { type: 'array' },
        openQuestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'brainstorm', 'prd']
}));

export const prdDraftTask = defineTask('ccpm-prd-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'Senior product manager drafting a PRD',
      task: `Create a comprehensive PRD for "${args.featureName}"`,
      context: {
        brainstorm: args.brainstorm,
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        targetAudience: args.targetAudience,
        constraints: args.constraints
      },
      instructions: [
        'Write a clear product vision statement',
        'Define detailed user stories with acceptance criteria using Given/When/Then format',
        'Specify measurable success metrics and KPIs',
        'Document functional and non-functional requirements',
        'Define clear scope boundaries (in-scope and out-of-scope)',
        'List assumptions and constraints',
        'Define release strategy (MVP vs. full release phases)',
        'Output to .claude/prds/<featureName>.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'userStories', 'successCriteria', 'requirements', 'scope'],
      properties: {
        vision: { type: 'string' },
        userStories: { type: 'array' },
        successCriteria: { type: 'array' },
        requirements: { type: 'object', properties: { functional: { type: 'array' }, nonFunctional: { type: 'array' } } },
        scope: { type: 'object', properties: { inScope: { type: 'array' }, outOfScope: { type: 'array' } } },
        constraints: { type: 'array' },
        assumptions: { type: 'array' },
        releaseStrategy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'draft', 'prd']
}));

export const prdReviewTask = defineTask('ccpm-prd-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'PRD quality reviewer and product strategist',
      task: 'Validate PRD completeness, clarity, and quality',
      context: { prd: args.prd, qualityThreshold: args.qualityThreshold },
      instructions: [
        'Check all user stories have testable acceptance criteria',
        'Verify success criteria are quantifiable and measurable',
        'Ensure scope boundaries are unambiguous',
        'Validate constraints are realistic and documented',
        'Check for missing edge cases or scenarios',
        'Verify traceability: every requirement maps to a user need',
        'Score PRD quality 0-100 across dimensions: completeness, clarity, testability, consistency'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues', 'dimensions'],
      properties: {
        passes: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' },
        dimensions: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            testability: { type: 'number' },
            consistency: { type: 'number' }
          }
        },
        suggestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'review', 'prd']
}));

export const prdRefineTask = defineTask('ccpm-prd-refine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'PRD revision specialist',
      task: 'Refine PRD based on review feedback',
      context: { prd: args.prd, feedback: args.feedback, brainstorm: args.brainstorm },
      instructions: [
        'Address every issue from the review',
        'Improve specificity of user stories and acceptance criteria',
        'Strengthen measurability of success criteria',
        'Clarify ambiguous scope boundaries',
        'Add missing edge cases and scenarios',
        'Maintain consistency across all sections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'userStories', 'successCriteria'],
      properties: {
        vision: { type: 'string' },
        userStories: { type: 'array' },
        successCriteria: { type: 'array' },
        requirements: { type: 'object' },
        scope: { type: 'object' },
        constraints: { type: 'array' },
        changesApplied: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'refine', 'prd']
}));

export const prdFinalizeTask = defineTask('ccpm-prd-finalize', (args, taskCtx) => ({
  kind: 'agent',
  title: `Finalize PRD: ${args.featureName}`,
  agent: {
    name: 'product-planner',
    prompt: {
      role: 'PRD finalization specialist',
      task: 'Finalize PRD and write to .claude/prds/ directory',
      context: { prd: args.prd, validation: args.validation, brainstorm: args.brainstorm },
      instructions: [
        'Format PRD as clean markdown document',
        'Add metadata header (version, date, author, status)',
        'Write final PRD to .claude/prds/<featureName>.md',
        'Generate executive summary',
        'Create user story index for traceability'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['prdPath', 'summary', 'storyCount'],
      properties: {
        prdPath: { type: 'string' },
        summary: { type: 'string' },
        storyCount: { type: 'number' },
        version: { type: 'string' },
        status: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'finalize', 'prd']
}));
