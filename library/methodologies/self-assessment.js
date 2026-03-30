/**
 * @process methodologies/self-assessment
 * @description Self-Assessment Loop - Execute task, self-evaluate quality, and iteratively improve
 * @inputs { task: string, qualityThreshold: number, maxIterations: number, assessmentCriteria: array }
 * @outputs { success: boolean, iterations: number, finalScore: number, results: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Self-Assessment Process
 *
 * Methodology: Execute → Self-Assess Quality → If below threshold, reflect and improve → Repeat
 *
 * This process implements a self-critical loop where an agent:
 * 1. Attempts to complete a task
 * 2. Critically evaluates its own work against defined criteria
 * 3. Identifies weaknesses and improvement opportunities
 * 4. Iteratively refines until quality threshold is met
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to execute and self-assess
 * @param {number} inputs.qualityThreshold - Minimum quality score (0-100) to accept
 * @param {number} inputs.maxIterations - Maximum refinement iterations (default: 5)
 * @param {Array<string>} inputs.assessmentCriteria - Criteria for self-evaluation
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with final quality assessment
 */
export async function process(inputs, ctx) {
  const {
    task,
    qualityThreshold = 80,
    maxIterations = 5,
    assessmentCriteria = [
      'Correctness',
      'Completeness',
      'Code quality',
      'Test coverage',
      'Documentation',
      'Best practices'
    ]
  } = inputs;

  let iteration = 0;
  let qualityAcceptable = false;
  const results = [];
  let currentWork = null;

  // Self-Assessment Loop
  while (!qualityAcceptable && iteration < maxIterations) {
    iteration++;

    // Execute the task (or refine previous attempt)
    const executionResult = await ctx.task(agentExecuteTask, {
      task,
      iteration,
      previousWork: currentWork,
      previousAssessments: results.map(r => r.assessment),
      isRefinement: iteration > 1
    });

    currentWork = executionResult;

    // Self-assess the work
    const assessmentResult = await ctx.task(agentSelfAssessTask, {
      task,
      work: executionResult,
      iteration,
      qualityThreshold,
      assessmentCriteria
    });

    results.push({
      iteration,
      execution: executionResult,
      assessment: assessmentResult,
      timestamp: ctx.now()
    });

    // Check if quality threshold is met
    qualityAcceptable = assessmentResult.overallScore >= qualityThreshold;

    if (!qualityAcceptable && iteration < maxIterations) {
      // Optional: Breakpoint for human review
      if (inputs.reviewEachIteration) {
        await ctx.breakpoint({
          question: `Iteration ${iteration}: Quality score ${assessmentResult.overallScore}/${qualityThreshold}. Continue refinement?`,
          title: `Self-Assessment - Iteration ${iteration}`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/iteration-${iteration}-work.md`, format: 'markdown' },
              { path: `artifacts/iteration-${iteration}-assessment.json`, format: 'json' }
            ]
          }
        });
      }
    }
  }

  // Final result
  const finalAssessment = results[results.length - 1]?.assessment;
  const success = qualityAcceptable;

  return {
    success,
    task,
    iterations: iteration,
    maxIterations,
    qualityThreshold,
    qualityAchieved: qualityAcceptable,
    finalScore: finalAssessment?.overallScore || 0,
    finalWork: currentWork,
    results,
    summary: {
      totalIterations: iteration,
      finalScore: finalAssessment?.overallScore || 0,
      scoreProgress: results.map(r => r.assessment.overallScore),
      strengths: finalAssessment?.strengths || [],
      remainingWeaknesses: finalAssessment?.weaknesses || []
    },
    metadata: {
      processId: 'methodologies/self-assessment',
      timestamp: ctx.now()
    }
  };
}

/**
 * Agent task execution
 */
export const agentExecuteTask = defineTask('agent-execute', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute task - iteration ${args.iteration}`,
  description: args.isRefinement ? 'Refine previous work based on self-assessment' : 'Initial task execution',

  agent: {
    name: 'self-assessing-executor',
    prompt: {
      role: 'task executor with self-improvement mindset',
      task: args.isRefinement
        ? 'Refine and improve previous work based on self-assessment feedback'
        : 'Execute the task with focus on quality',
      context: {
        task: args.task,
        iteration: args.iteration,
        previousWork: args.previousWork,
        previousAssessments: args.previousAssessments
      },
      instructions: [
        args.isRefinement ? 'Review previous self-assessment feedback carefully' : 'Execute the task thoroughly',
        args.isRefinement ? 'Focus on addressing identified weaknesses' : 'Apply best practices from the start',
        'Document your approach and decisions',
        'Write clean, maintainable code',
        'Include tests where appropriate',
        'Consider edge cases and error handling',
        args.isRefinement ? 'Preserve strengths from previous iteration' : 'Build a solid foundation'
      ],
      outputFormat: 'JSON with completed (boolean), description (string), artifacts (array), notes (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'description'],
      properties: {
        completed: { type: 'boolean' },
        description: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'self-assessment', 'execution', `iteration-${args.iteration}`]
}));

/**
 * Agent self-assessment task
 */
export const agentSelfAssessTask = defineTask('agent-self-assess', (args, taskCtx) => ({
  kind: 'agent',
  title: `Self-assess work - iteration ${args.iteration}`,
  description: 'Critically evaluate own work against quality criteria',

  agent: {
    name: 'self-assessor',
    prompt: {
      role: 'critical self-assessor focused on continuous improvement',
      task: 'Evaluate the work objectively against defined criteria',
      context: {
        task: args.task,
        work: args.work,
        iteration: args.iteration,
        qualityThreshold: args.qualityThreshold,
        assessmentCriteria: args.assessmentCriteria
      },
      instructions: [
        'Review the completed work critically and objectively',
        'Evaluate against each assessment criterion',
        'Assign scores (0-100) for each criterion with justification',
        'Calculate overall weighted score',
        'Identify specific strengths to preserve',
        'Identify concrete weaknesses and improvement opportunities',
        'Be honest and constructive - the goal is improvement',
        'Provide actionable feedback for the next iteration',
        'Do not be lenient - maintain high standards'
      ],
      outputFormat: 'JSON with criteria scores, overall score, strengths, weaknesses, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['criteriaScores', 'overallScore', 'strengths', 'weaknesses', 'recommendations'],
      properties: {
        criteriaScores: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              score: { type: 'number', minimum: 0, maximum: 100 },
              justification: { type: 'string' }
            }
          }
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        readyForProduction: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'self-assessment', 'evaluation', `iteration-${args.iteration}`]
}));
