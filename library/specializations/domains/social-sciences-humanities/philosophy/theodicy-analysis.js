/**
 * @process philosophy/theodicy-analysis
 * @description Analyze the problem of evil and evaluate theodicies, examining logical and evidential arguments and religious responses
 * @inputs { theodicyContext: string, theodicyType: string, religiousTradition: string, outputDir: string }
 * @outputs { success: boolean, problemAnalysis: object, theodicyEvaluations: array, dialecticalAssessment: object, artifacts: array }
 * @recommendedSkills SK-PHIL-008 (theological-synthesis), SK-PHIL-001 (formal-logic-analysis), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-005 (philosophical-theologian-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    theodicyContext,
    theodicyType = 'comprehensive',
    religiousTradition = 'classical-theism',
    outputDir = 'theodicy-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Problem of Evil Formulation
  ctx.log('info', 'Starting theodicy analysis: Formulating the problem');
  const problemFormulation = await ctx.task(problemFormulationTask, {
    theodicyContext,
    religiousTradition,
    outputDir
  });

  if (!problemFormulation.success) {
    return {
      success: false,
      error: 'Problem formulation failed',
      details: problemFormulation,
      metadata: { processId: 'philosophy/theodicy-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...problemFormulation.artifacts);

  // Task 2: Logical Problem Analysis
  ctx.log('info', 'Analyzing the logical problem of evil');
  const logicalProblem = await ctx.task(logicalProblemTask, {
    problem: problemFormulation.problem,
    religiousTradition,
    outputDir
  });

  artifacts.push(...logicalProblem.artifacts);

  // Task 3: Evidential Problem Analysis
  ctx.log('info', 'Analyzing the evidential problem of evil');
  const evidentialProblem = await ctx.task(evidentialProblemTask, {
    problem: problemFormulation.problem,
    religiousTradition,
    outputDir
  });

  artifacts.push(...evidentialProblem.artifacts);

  // Task 4: Major Theodicies Survey
  ctx.log('info', 'Surveying major theodicies');
  const theodiciesSurvey = await ctx.task(theodiciesSurveyTask, {
    problem: problemFormulation.problem,
    religiousTradition,
    outputDir
  });

  artifacts.push(...theodiciesSurvey.artifacts);

  // Task 5: Theodicy Evaluation
  ctx.log('info', 'Evaluating theodicies');
  const theodicyEvaluation = await ctx.task(theodicyEvaluationTask, {
    logicalProblem,
    evidentialProblem,
    theodicies: theodiciesSurvey.theodicies,
    outputDir
  });

  artifacts.push(...theodicyEvaluation.artifacts);

  // Task 6: Dialectical Assessment
  ctx.log('info', 'Assessing the dialectical situation');
  const dialecticalAssessment = await ctx.task(dialecticalAssessmentTask, {
    logicalProblem,
    evidentialProblem,
    theodicyEvaluation,
    outputDir
  });

  artifacts.push(...dialecticalAssessment.artifacts);

  // Breakpoint: Review theodicy analysis
  await ctx.breakpoint({
    question: `Theodicy analysis complete. ${theodiciesSurvey.theodicies.length} theodicies evaluated. Review the analysis?`,
    title: 'Theodicy Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        religiousTradition,
        theodiciesEvaluated: theodiciesSurvey.theodicies.length,
        logicalProblemStatus: logicalProblem.status,
        evidentialProblemStatus: evidentialProblem.status
      }
    }
  });

  // Task 7: Generate Theodicy Report
  ctx.log('info', 'Generating theodicy analysis report');
  const theodicyReport = await ctx.task(theodicyReportTask, {
    theodicyContext,
    problemFormulation,
    logicalProblem,
    evidentialProblem,
    theodiciesSurvey,
    theodicyEvaluation,
    dialecticalAssessment,
    outputDir
  });

  artifacts.push(...theodicyReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemAnalysis: {
      formulation: problemFormulation.problem,
      logicalProblem: logicalProblem.analysis,
      evidentialProblem: evidentialProblem.analysis
    },
    theodicyEvaluations: theodicyEvaluation.evaluations,
    dialecticalAssessment: {
      status: dialecticalAssessment.status,
      strongestTheodicy: dialecticalAssessment.strongestTheodicy,
      unresolvedIssues: dialecticalAssessment.unresolvedIssues,
      recommendation: dialecticalAssessment.recommendation
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/theodicy-analysis',
      timestamp: startTime,
      religiousTradition,
      outputDir
    }
  };
}

// Task definitions
export const problemFormulationTask = defineTask('problem-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate the problem of evil',
  agent: {
    name: 'problem-formulator',
    prompt: {
      role: 'philosopher of religion',
      task: 'Formulate the problem of evil precisely for analysis',
      context: args,
      instructions: [
        'State the problem of evil clearly',
        'Identify the divine attributes at issue (omnipotence, omniscience, omnibenevolence)',
        'Distinguish between moral and natural evil',
        'Note the religious tradition context',
        'Identify the logical structure of the problem',
        'Note any specific evils in the context',
        'Clarify what would count as a solution',
        'Save problem formulation to output directory'
      ],
      outputFormat: 'JSON with success, problem (statement, attributes, evilTypes, structure), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'problem', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        problem: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            divineAttributes: { type: 'array', items: { type: 'string' } },
            evilTypes: { type: 'array', items: { type: 'string' } },
            logicalStructure: { type: 'string' },
            specificEvils: { type: 'array', items: { type: 'string' } },
            solutionCriteria: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'formulation']
}));

export const logicalProblemTask = defineTask('logical-problem', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the logical problem of evil',
  agent: {
    name: 'logical-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze the logical problem of evil (alleged inconsistency)',
      context: args,
      instructions: [
        'Reconstruct the logical argument from evil',
        'Identify all premises of the argument',
        'Assess whether the argument is valid',
        'Evaluate the Free Will Defense (Plantinga)',
        'Assess whether logical inconsistency has been shown',
        'Consider possible worlds responses',
        'Determine the current status of the logical problem',
        'Save logical problem analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (argument, premises, validity, defense), status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'status', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            argument: { type: 'string' },
            premises: { type: 'array', items: { type: 'string' } },
            validity: { type: 'string' },
            freeWillDefense: { type: 'string' },
            possibleWorldsResponse: { type: 'string' }
          }
        },
        status: { type: 'string' },
        assessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'logical']
}));

export const evidentialProblemTask = defineTask('evidential-problem', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the evidential problem of evil',
  agent: {
    name: 'evidential-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze the evidential problem of evil (probability argument)',
      context: args,
      instructions: [
        'Reconstruct the evidential argument from evil',
        'Analyze arguments from gratuitous evil',
        'Evaluate Rowe\'s evidential argument',
        'Consider skeptical theism responses',
        'Assess the probability claims',
        'Consider theodicy responses to evidential problem',
        'Determine the current status of the evidential problem',
        'Save evidential problem analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (argument, gratuitousEvil, probability, responses), status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'status', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            argument: { type: 'string' },
            gratuitousEvilClaim: { type: 'string' },
            probabilityAssessment: { type: 'string' },
            skepticalTheism: { type: 'string' },
            theodicyResponses: { type: 'array', items: { type: 'string' } }
          }
        },
        status: { type: 'string' },
        assessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'evidential']
}));

export const theodiciesSurveyTask = defineTask('theodicies-survey', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Survey major theodicies',
  agent: {
    name: 'theodicy-surveyor',
    prompt: {
      role: 'philosopher of religion',
      task: 'Survey the major theodicies in the philosophical literature',
      context: args,
      instructions: [
        'Present the Free Will Theodicy',
        'Present the Soul-Making Theodicy (Hick)',
        'Present the Greater Good Theodicies',
        'Present Natural Law Theodicies',
        'Present Eschatological Theodicies',
        'Note theodicies specific to the religious tradition',
        'Identify the key claims of each theodicy',
        'Save theodicies survey to output directory'
      ],
      outputFormat: 'JSON with theodicies (name, description, keyClaims, strengths, weaknesses), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['theodicies', 'artifacts'],
      properties: {
        theodicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              keyClaims: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              proponents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'survey']
}));

export const theodicyEvaluationTask = defineTask('theodicy-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate theodicies',
  agent: {
    name: 'theodicy-evaluator',
    prompt: {
      role: 'philosopher of religion',
      task: 'Evaluate each theodicy against the problems of evil',
      context: args,
      instructions: [
        'Evaluate each theodicy against the logical problem',
        'Evaluate each theodicy against the evidential problem',
        'Assess the plausibility of each theodicy\'s claims',
        'Consider objections to each theodicy',
        'Assess responses to objections',
        'Rank theodicies by effectiveness',
        'Note any combined approaches',
        'Save theodicy evaluation to output directory'
      ],
      outputFormat: 'JSON with evaluations (theodicy, vsLogical, vsEvidential, objections, ranking), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluations', 'artifacts'],
      properties: {
        evaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theodicy: { type: 'string' },
              vsLogicalProblem: { type: 'string' },
              vsEvidentialProblem: { type: 'string' },
              plausibility: { type: 'string' },
              objections: { type: 'array', items: { type: 'string' } },
              responses: { type: 'array', items: { type: 'string' } },
              effectiveness: { type: 'string' }
            }
          }
        },
        ranking: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'evaluation']
}));

export const dialecticalAssessmentTask = defineTask('dialectical-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess the dialectical situation',
  agent: {
    name: 'dialectician',
    prompt: {
      role: 'philosopher of religion',
      task: 'Assess the overall dialectical situation regarding evil and theism',
      context: args,
      instructions: [
        'Assess the overall state of the debate',
        'Determine if theism remains rationally defensible',
        'Identify the strongest theodicy or defense',
        'Note any unresolved issues',
        'Consider practical/pastoral implications',
        'Provide overall assessment and recommendation',
        'Note areas for further work',
        'Save dialectical assessment to output directory'
      ],
      outputFormat: 'JSON with status, strongestTheodicy, unresolvedIssues, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'recommendation', 'artifacts'],
      properties: {
        status: { type: 'string' },
        theismDefensible: { type: 'boolean' },
        strongestTheodicy: { type: 'string' },
        unresolvedIssues: { type: 'array', items: { type: 'string' } },
        pastoralImplications: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        furtherWork: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'dialectical']
}));

export const theodicyReportTask = defineTask('theodicy-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate theodicy analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosopher of religion and technical writer',
      task: 'Generate comprehensive theodicy analysis report',
      context: args,
      instructions: [
        'Create executive summary of theodicy analysis',
        'Present problem of evil formulation',
        'Document logical problem analysis',
        'Document evidential problem analysis',
        'Survey major theodicies',
        'Present theodicy evaluations',
        'Include dialectical assessment',
        'Note conclusions and recommendations',
        'Format as professional philosophical report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theodicy', 'reporting']
}));
