/**
 * @process methodologies/plan-and-execute
 * @description Plan-and-execute methodology: Agent plans, then executes step-by-step with approval gates
 * @inputs { task: string, approvalRequired: boolean }
 * @outputs { success: boolean, plan: object, executionResults: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Plan-and-execute process
 *
 * Methodology: Generate detailed plan first, then execute each step with optional approval
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to plan and execute
 * @param {boolean} inputs.approvalRequired - Require approval before execution (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    task,
    approvalRequired = true
  } = inputs;


  // ============================================================================
  // PHASE 1: PLANNING
  // ============================================================================

  const planResult = await ctx.task(agentPlanningTask, {
    task,
    context: inputs.context || {}
  });

  // Breakpoint: Review plan
  if (approvalRequired) {
    await ctx.breakpoint({
      question: `Review the ${planResult.steps.length}-step execution plan for "${task}". Approve to proceed?`,
      title: 'Execution Plan Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/plan.md', format: 'markdown' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: EXECUTION
  // ============================================================================

  const executionResults = [];

  for (let i = 0; i < planResult.steps.length; i++) {
    const step = planResult.steps[i];

    const stepResult = await ctx.task(executeStepTask, {
      step,
      stepNumber: i + 1,
      totalSteps: planResult.steps.length,
      previousResults: executionResults
    });

    executionResults.push({
      step: i + 1,
      title: step.title,
      result: stepResult,
      success: stepResult.success
    });

    if (!stepResult.success) {

      await ctx.breakpoint({
        question: `Step ${i + 1} "${step.title}" failed. Review error and decide: retry, skip, or abort?`,
        title: `Step ${i + 1} Failed`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/step-${i + 1}-error.md`, format: 'markdown' }
          ]
        }
      });

      // User can choose to continue or abort
      // For now, we abort on failure
      break;
    }

  }

  // ============================================================================
  // PHASE 3: VERIFICATION
  // ============================================================================


  const allStepsSucceeded = executionResults.every(r => r.success);
  const completedSteps = executionResults.filter(r => r.success).length;

  return {
    success: allStepsSucceeded,
    task,
    plan: planResult,
    executionResults,
    summary: {
      totalSteps: planResult.steps.length,
      completedSteps,
      failedSteps: planResult.steps.length - completedSteps,
      allSucceeded: allStepsSucceeded
    },
    metadata: {
      processId: 'methodologies/plan-and-execute',
      timestamp: ctx.now()
    }
  };
}

/**
 * Agent planning task
 */
export const agentPlanningTask = defineTask('agent-planner', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan task: ${args.task}`,
  description: 'Generate detailed execution plan',

  agent: {
    name: 'task-planner',
    prompt: {
      role: 'senior project planner and technical lead',
      task: 'Generate a detailed, step-by-step execution plan for the given task',
      context: {
        task: args.task,
        additionalContext: args.context
      },
      instructions: [
        'Analyze the task and break it down into discrete, actionable steps',
        'Order steps logically with dependencies',
        'For each step, define: title, description, actions, validation criteria',
        'Identify risks and mitigation strategies',
        'Estimate complexity (low/medium/high)',
        'Provide success criteria for the overall plan'
      ],
      outputFormat: 'JSON with steps array, complexity, risks, successCriteria'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'complexity', 'successCriteria'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              validationCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        risks: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'planning']
}));

/**
 * Execute step task
 */
export const executeStepTask = defineTask('execute-step', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.step.title}`,
  description: `Step ${args.stepNumber}/${args.totalSteps}`,

  agent: {
    name: 'generalist',
    prompt: {
      role: 'senior project manager and technical lead',
      task: 'Execute the given step',
      context: { step: args.step, stepNumber: args.stepNumber, totalSteps: args.totalSteps },
      instructions: ['Execute the given step', 'Follow plan', 'Write tests', 'Write documentation'],
      outputFormat: 'JSON with stepResult'
    },
    outputSchema: {
      type: 'object',
      required: ['stepResult'],
      properties: {
        stepResult: { type: 'object', properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' } }
        } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['execution', `step-${args.stepNumber}`]
}));
