/**
 * @process philosophy/skeptical-challenge-analysis
 * @description Examine and respond to skeptical arguments, evaluating their force and developing strategies for addressing radical and local skepticism
 * @inputs { skepticalChallenge: string, skepticismType: string, respondingStrategy: string, outputDir: string }
 * @outputs { success: boolean, challengeAnalysis: object, responseStrategies: array, dialecticalAssessment: object, artifacts: array }
 * @recommendedSkills SK-PHIL-007 (evidence-justification-assessment), SK-PHIL-006 (thought-experiment-design), SK-PHIL-001 (formal-logic-analysis)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    skepticalChallenge,
    skepticismType = 'global',
    respondingStrategy = 'multi-strategy',
    outputDir = 'skepticism-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Challenge Identification and Classification
  ctx.log('info', 'Starting skeptical challenge analysis: Classifying the challenge');
  const challengeClassification = await ctx.task(challengeClassificationTask, {
    skepticalChallenge,
    skepticismType,
    outputDir
  });

  if (!challengeClassification.success) {
    return {
      success: false,
      error: 'Challenge classification failed',
      details: challengeClassification,
      metadata: { processId: 'philosophy/skeptical-challenge-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...challengeClassification.artifacts);

  // Task 2: Argument Reconstruction
  ctx.log('info', 'Reconstructing the skeptical argument');
  const argumentReconstruction = await ctx.task(skepticalArgumentTask, {
    challenge: challengeClassification.classified,
    outputDir
  });

  artifacts.push(...argumentReconstruction.artifacts);

  // Task 3: Force Evaluation
  ctx.log('info', 'Evaluating the force of the skeptical argument');
  const forceEvaluation = await ctx.task(forceEvaluationTask, {
    argument: argumentReconstruction.argument,
    challenge: challengeClassification.classified,
    outputDir
  });

  artifacts.push(...forceEvaluation.artifacts);

  // Task 4: Historical Response Survey
  ctx.log('info', 'Surveying historical responses to skepticism');
  const historicalSurvey = await ctx.task(historicalSurveyTask, {
    skepticismType: challengeClassification.classified.type,
    challenge: challengeClassification.classified,
    outputDir
  });

  artifacts.push(...historicalSurvey.artifacts);

  // Task 5: Response Strategy Development
  ctx.log('info', 'Developing response strategies');
  const responseStrategies = await ctx.task(responseStrategyTask, {
    argument: argumentReconstruction.argument,
    forceEvaluation,
    historicalResponses: historicalSurvey.responses,
    respondingStrategy,
    outputDir
  });

  artifacts.push(...responseStrategies.artifacts);

  // Task 6: Dialectical Assessment
  ctx.log('info', 'Assessing the dialectical situation');
  const dialecticalAssessment = await ctx.task(dialecticalAssessmentTask, {
    challenge: challengeClassification.classified,
    argument: argumentReconstruction.argument,
    responses: responseStrategies.strategies,
    outputDir
  });

  artifacts.push(...dialecticalAssessment.artifacts);

  // Breakpoint: Review skepticism analysis
  await ctx.breakpoint({
    question: `Skeptical challenge analysis complete. Challenge classified as ${challengeClassification.classified.type}. ${responseStrategies.strategies.length} response strategies developed. Review the analysis?`,
    title: 'Skeptical Challenge Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        challengeType: challengeClassification.classified.type,
        argumentForce: forceEvaluation.overallForce,
        strategiesCount: responseStrategies.strategies.length,
        dialecticalStatus: dialecticalAssessment.status
      }
    }
  });

  // Task 7: Generate Skepticism Report
  ctx.log('info', 'Generating skeptical challenge analysis report');
  const skepticismReport = await ctx.task(skepticismReportTask, {
    skepticalChallenge,
    challengeClassification,
    argumentReconstruction,
    forceEvaluation,
    historicalSurvey,
    responseStrategies,
    dialecticalAssessment,
    outputDir
  });

  artifacts.push(...skepticismReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    challengeAnalysis: {
      originalChallenge: skepticalChallenge,
      classification: challengeClassification.classified,
      reconstructedArgument: argumentReconstruction.argument,
      argumentForce: forceEvaluation.overallForce
    },
    responseStrategies: responseStrategies.strategies.map(s => ({
      name: s.name,
      type: s.type,
      description: s.description,
      effectiveness: s.effectiveness
    })),
    dialecticalAssessment: {
      status: dialecticalAssessment.status,
      winningPosition: dialecticalAssessment.winningPosition,
      unresolvedIssues: dialecticalAssessment.unresolvedIssues,
      recommendation: dialecticalAssessment.recommendation
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/skeptical-challenge-analysis',
      timestamp: startTime,
      skepticismType,
      outputDir
    }
  };
}

// Task 1: Challenge Classification
export const challengeClassificationTask = defineTask('challenge-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify the skeptical challenge',
  agent: {
    name: 'skepticism-analyst',
    prompt: {
      role: 'epistemologist',
      task: 'Classify and analyze the skeptical challenge',
      context: args,
      instructions: [
        'Identify the type of skepticism (global vs. local)',
        'Determine the domain targeted (external world, other minds, etc.)',
        'Classify the skeptical strategy (regress, underdetermination, etc.)',
        'Identify the skeptical hypothesis if any',
        'Note the scope of the challenge',
        'Identify key presuppositions of the challenge',
        'Place in historical context of skepticism',
        'Save classification to output directory'
      ],
      outputFormat: 'JSON with success, classified (type, domain, strategy, scope), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'classified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        classified: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            domain: { type: 'string' },
            strategy: { type: 'string' },
            hypothesis: { type: 'string' },
            scope: { type: 'string' },
            presuppositions: { type: 'array', items: { type: 'string' } },
            historicalContext: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'skepticism', 'classification']
}));

// Task 2: Skeptical Argument Reconstruction
export const skepticalArgumentTask = defineTask('skeptical-argument', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct the skeptical argument',
  agent: {
    name: 'argument-reconstructor',
    prompt: {
      role: 'epistemologist',
      task: 'Reconstruct the skeptical argument in explicit form',
      context: args,
      instructions: [
        'Formulate the skeptical argument explicitly',
        'Identify all premises',
        'Identify the skeptical conclusion',
        'Assess the logical validity of the argument',
        'Identify the key premises driving the argument',
        'Note any hidden assumptions',
        'Consider strongest formulation of the argument',
        'Save argument reconstruction to output directory'
      ],
      outputFormat: 'JSON with argument (premises, conclusion, validity, keyPremises), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['argument', 'artifacts'],
      properties: {
        argument: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            validity: { type: 'string' },
            keyPremises: { type: 'array', items: { type: 'string' } },
            hiddenAssumptions: { type: 'array', items: { type: 'string' } },
            standardForm: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'skepticism', 'argument']
}));

// Task 3: Force Evaluation
export const forceEvaluationTask = defineTask('force-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate the force of the skeptical argument',
  agent: {
    name: 'force-evaluator',
    prompt: {
      role: 'epistemologist',
      task: 'Evaluate how forceful or compelling the skeptical argument is',
      context: args,
      instructions: [
        'Assess the plausibility of each premise',
        'Evaluate the intuitive force of the argument',
        'Consider the burden of proof',
        'Assess whether the argument proves too much',
        'Consider pragmatic objections',
        'Evaluate the existential impact',
        'Determine overall argumentative force',
        'Save force evaluation to output directory'
      ],
      outputFormat: 'JSON with premiseAssessments, overallForce, pragmaticConcerns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallForce', 'artifacts'],
      properties: {
        premiseAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              premise: { type: 'string' },
              plausibility: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallForce: { type: 'string' },
        intuitiveForce: { type: 'string' },
        provesTooMuch: { type: 'boolean' },
        pragmaticConcerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'skepticism', 'force']
}));

// Task 4: Historical Survey
export const historicalSurveyTask = defineTask('historical-survey', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Survey historical responses to skepticism',
  agent: {
    name: 'history-surveyor',
    prompt: {
      role: 'historian of epistemology',
      task: 'Survey major historical responses to this type of skepticism',
      context: args,
      instructions: [
        'Identify classical responses (ancient, modern)',
        'Present Cartesian responses if relevant',
        'Present Moorean responses',
        'Present contextualist responses',
        'Present externalist responses',
        'Present pragmatist responses',
        'Assess historical success of each approach',
        'Save historical survey to output directory'
      ],
      outputFormat: 'JSON with responses (approach, philosopher, strategy, assessment), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'artifacts'],
      properties: {
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              philosopher: { type: 'string' },
              period: { type: 'string' },
              strategy: { type: 'string' },
              assessment: { type: 'string' }
            }
          }
        },
        mostSuccessful: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'skepticism', 'history']
}));

// Task 5: Response Strategy
export const responseStrategyTask = defineTask('response-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop response strategies',
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'epistemologist',
      task: 'Develop strategies for responding to the skeptical challenge',
      context: args,
      instructions: [
        'Develop premise-denial strategies',
        'Develop inference-blocking strategies',
        'Consider diagnostic responses (what is wrong with skepticism)',
        'Develop positive epistemological responses',
        'Assess effectiveness of each strategy',
        'Identify the most promising strategy',
        'Consider combined approaches',
        'Save response strategies to output directory'
      ],
      outputFormat: 'JSON with strategies (name, type, description, effectiveness), mostPromising, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              targetPremise: { type: 'string' },
              effectiveness: { type: 'string' },
              objections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mostPromising: { type: 'string' },
        combinedApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'skepticism', 'strategy']
}));

// Task 6: Dialectical Assessment
export const dialecticalAssessmentTask = defineTask('dialectical-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess the dialectical situation',
  agent: {
    name: 'dialectician',
    prompt: {
      role: 'epistemologist',
      task: 'Assess the overall dialectical situation between skeptic and respondent',
      context: args,
      instructions: [
        'Weigh the skeptical argument against responses',
        'Determine the current state of the debate',
        'Identify which position has the advantage',
        'Note any unresolved issues',
        'Consider whether a draw or stalemate',
        'Provide overall recommendation',
        'Note implications for epistemology',
        'Save dialectical assessment to output directory'
      ],
      outputFormat: 'JSON with status, winningPosition, unresolvedIssues, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'recommendation', 'artifacts'],
      properties: {
        status: { type: 'string' },
        winningPosition: { type: 'string' },
        advantageFactors: { type: 'array', items: { type: 'string' } },
        unresolvedIssues: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        epistemologicalImplications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'skepticism', 'dialectical']
}));

// Task 7: Skepticism Report
export const skepticismReportTask = defineTask('skepticism-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate skeptical challenge analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'epistemologist and technical writer',
      task: 'Generate comprehensive skeptical challenge analysis report',
      context: args,
      instructions: [
        'Create executive summary with dialectical assessment',
        'Present the skeptical challenge',
        'Document challenge classification',
        'Present reconstructed argument',
        'Include force evaluation',
        'Survey historical responses',
        'Present developed strategies',
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
  labels: ['agent', 'philosophy', 'skepticism', 'reporting']
}));
