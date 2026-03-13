/**
 * @process gsd/plan-phase
 * @description GSD phase planning with verification loop - creates atomic task plans
 * @inputs { phaseId: string, phaseName: string, context: object, requirements: array }
 * @outputs { success: boolean, plans: array, verified: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Phase Planning Process
 *
 * GSD Methodology: Research → Plan → Verify → Iterate until verified
 *
 * Creates 2-3 atomic task plans with XML structure
 * Each plan is verified against requirements before approval
 *
 * Agents referenced from agents/ directory:
 *   - gsd-phase-researcher: Targeted implementation research
 *   - gsd-planner: Generates atomic task plans with XML structure
 *   - gsd-plan-checker: Verifies plans satisfy requirements
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config and path utilities
 *   - template-scaffolding: Plan and research document templates
 *   - verification-suite: Plan verification patterns
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {object} inputs.context - Phase context from discussion
 * @param {array} inputs.requirements - Phase requirements
 * @param {number} inputs.maxPlanningIterations - Max verification iterations (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with verified plans
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    context,
    requirements = [],
    maxPlanningIterations = 3
  } = inputs;

  // ============================================================================
  // PHASE 1: TARGETED RESEARCH
  // ============================================================================

  const researchResult = await ctx.task(targetedResearchTask, {
    phaseId,
    phaseName,
    context,
    requirements
  });

  // ============================================================================
  // PHASE 2: ITERATIVE PLANNING WITH VERIFICATION
  // ============================================================================

  let iteration = 0;
  let verified = false;
  let plans = null;
  let feedback = null;

  while (!verified && iteration < maxPlanningIterations) {
    iteration++;

    // Generate plans
    const planningResult = await ctx.task(generatePlansTask, {
      phaseId,
      phaseName,
      context,
      requirements,
      research: researchResult,
      previousFeedback: feedback,
      iteration
    });

    plans = planningResult.plans;

    // Verify plans
    const verificationResult = await ctx.task(verifyPlansTask, {
      phaseId,
      phaseName,
      requirements,
      plans,
      iteration
    });

    verified = verificationResult.verified;
    feedback = verificationResult.feedback;

    if (!verified && iteration < maxPlanningIterations) {
      // Log verification feedback for next iteration
      await ctx.task(logFeedbackTask, {
        phaseId,
        iteration,
        feedback: verificationResult
      });
    }
  }

  if (!verified) {
    // Final breakpoint if still not verified
    await ctx.breakpoint({
      question: `Plans for "${phaseName}" failed verification after ${maxPlanningIterations} iterations. Review and decide: approve anyway, iterate manually, or abort?`,
      title: `Plan Verification Failed: ${phaseName}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/${phaseId}-PLAN.md`, format: 'markdown', label: 'Plans' },
          { path: `artifacts/${phaseId}-verification-feedback.md`, format: 'markdown', label: 'Feedback' }
        ]
      }
    });
  }

  // Breakpoint: Review verified plans
  await ctx.breakpoint({
    question: `Review ${plans.length} verified task plans for "${phaseName}". Approve to proceed with execution?`,
    title: `Plan Review: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${phaseId}-PLAN.md`, format: 'markdown', label: 'Task Plans' },
        { path: `artifacts/${phaseId}-RESEARCH.md`, format: 'markdown', label: 'Research' }
      ]
    }
  });

  return {
    success: verified,
    phaseId,
    phaseName,
    plans,
    verified,
    iterations: iteration,
    research: researchResult,
    artifacts: {
      plans: `artifacts/${phaseId}-PLAN.md`,
      research: `artifacts/${phaseId}-RESEARCH.md`
    },
    metadata: {
      processId: 'gsd/plan-phase',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const targetedResearchTask = defineTask('targeted-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research: ${args.phaseName}`,
  description: 'Targeted research for implementation approach',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'senior software engineer and researcher',
      task: 'Research implementation approaches informed by phase context and preferences',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        context: args.context,
        requirements: args.requirements
      },
      instructions: [
        'Review phase context and user preferences',
        'Research implementation patterns for each requirement',
        'Find code examples and best practices',
        'Identify libraries/tools that match preferences',
        'Document step-by-step implementation approaches',
        'Note testing strategies for this phase',
        'Provide links to relevant documentation'
      ],
      outputFormat: 'JSON with approaches (array), libraries (array), examples (array), testingStrategy (string), researchMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['approaches', 'researchMarkdown'],
      properties: {
        approaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              approach: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              considerations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        libraries: { type: 'array', items: { type: 'string' } },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        testingStrategy: { type: 'string' },
        researchMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'planning', 'research']
}));

export const generatePlansTask = defineTask('generate-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate plans (iteration ${args.iteration})`,
  description: 'Create atomic task plans with XML structure',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'senior technical lead and planner',
      task: 'Create 2-3 atomic task plans for the phase using XML structure',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        context: args.context,
        requirements: args.requirements,
        research: args.research,
        previousFeedback: args.previousFeedback,
        iteration: args.iteration
      },
      instructions: [
        'Create 2-3 atomic, independent task plans',
        'Each plan should be completable in one focused session',
        'Use XML structure: <task type="auto"><name/><files/><action/><verify/><done/></task>',
        'Include specific file paths in <files>',
        'Provide detailed, actionable steps in <action>',
        'Define clear verification command in <verify>',
        'Specify success criteria in <done>',
        'If previous feedback exists, address all concerns',
        'Ensure plans collectively satisfy ALL requirements',
        'Plans should be executable in parallel or clear sequence'
      ],
      outputFormat: 'JSON with plans (array of objects with name, type, files, action, verify, done, xmlString), planMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'planMarkdown'],
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['auto', 'manual'] },
              files: { type: 'array', items: { type: 'string' } },
              action: { type: 'string' },
              verify: { type: 'string' },
              done: { type: 'string' },
              xmlString: { type: 'string' }
            }
          }
        },
        planMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'planning', `iteration-${args.iteration}`]
}));

export const verifyPlansTask = defineTask('verify-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify plans (iteration ${args.iteration})`,
  description: 'Verify plans satisfy requirements',

  agent: {
    name: 'gsd-plan-checker',
    prompt: {
      role: 'senior QA engineer and requirements analyst',
      task: 'Verify that task plans completely satisfy phase requirements',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        requirements: args.requirements,
        plans: args.plans,
        iteration: args.iteration
      },
      instructions: [
        'For each requirement, verify it is addressed in the plans',
        'Check that acceptance criteria can be validated',
        'Verify plans are atomic and actionable',
        'Check that verification commands will work',
        'Identify any gaps or missing coverage',
        'Identify any redundant or conflicting plans',
        'Provide specific, actionable feedback for issues',
        'Set verified=true only if ALL requirements are satisfied'
      ],
      outputFormat: 'JSON with verified (boolean), coverage (array of requirement checks), gaps (array), feedback (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'coverage'],
      properties: {
        verified: { type: 'boolean' },
        coverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              covered: { type: 'boolean' },
              coveredBy: { type: 'array', items: { type: 'string' } },
              note: { type: 'string' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'planning', 'verification', `iteration-${args.iteration}`]
}));

export const logFeedbackTask = defineTask('log-feedback', (args, taskCtx) => ({
  kind: 'node',
  title: 'Log verification feedback',
  description: 'Record feedback for next iteration',

  node: {
    entry: '.a5c/orchestrator_scripts/gsd/log-feedback.js',
    args: [
      '--phase-id', args.phaseId,
      '--iteration', String(args.iteration),
      '--feedback', JSON.stringify(args.feedback),
      '--output', `tasks/${taskCtx.effectId}/result.json`
    ]
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'planning', 'logging']
}));
