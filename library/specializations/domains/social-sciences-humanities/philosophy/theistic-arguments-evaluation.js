/**
 * @process philosophy/theistic-arguments-evaluation
 * @description Critically examine classical and contemporary arguments for and against theism, including cosmological, teleological, ontological, and moral arguments
 * @inputs { argumentFocus: string, evaluationScope: string, includeCounterarguments: boolean, outputDir: string }
 * @outputs { success: boolean, argumentEvaluations: array, dialecticalAnalysis: object, overallAssessment: object, artifacts: array }
 * @recommendedSkills SK-PHIL-001 (formal-logic-analysis), SK-PHIL-008 (theological-synthesis), SK-PHIL-007 (evidence-justification-assessment)
 * @recommendedAgents AG-PHIL-005 (philosophical-theologian-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    argumentFocus = 'comprehensive',
    evaluationScope = 'classical-and-contemporary',
    includeCounterarguments = true,
    outputDir = 'theistic-arguments-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Cosmological Arguments Analysis
  ctx.log('info', 'Analyzing cosmological arguments');
  const cosmologicalAnalysis = await ctx.task(cosmologicalAnalysisTask, {
    evaluationScope,
    outputDir
  });

  artifacts.push(...cosmologicalAnalysis.artifacts);

  // Task 2: Teleological Arguments Analysis
  ctx.log('info', 'Analyzing teleological arguments');
  const teleologicalAnalysis = await ctx.task(teleologicalAnalysisTask, {
    evaluationScope,
    outputDir
  });

  artifacts.push(...teleologicalAnalysis.artifacts);

  // Task 3: Ontological Arguments Analysis
  ctx.log('info', 'Analyzing ontological arguments');
  const ontologicalAnalysis = await ctx.task(ontologicalAnalysisTask, {
    evaluationScope,
    outputDir
  });

  artifacts.push(...ontologicalAnalysis.artifacts);

  // Task 4: Moral Arguments Analysis
  ctx.log('info', 'Analyzing moral arguments');
  const moralAnalysis = await ctx.task(moralArgumentsTask, {
    evaluationScope,
    outputDir
  });

  artifacts.push(...moralAnalysis.artifacts);

  // Task 5: Arguments Against Theism (if included)
  let atheisticArguments = null;
  if (includeCounterarguments) {
    ctx.log('info', 'Analyzing arguments against theism');
    atheisticArguments = await ctx.task(atheisticArgumentsTask, {
      evaluationScope,
      outputDir
    });
    artifacts.push(...atheisticArguments.artifacts);
  }

  // Task 6: Dialectical Synthesis
  ctx.log('info', 'Synthesizing dialectical analysis');
  const dialecticalSynthesis = await ctx.task(dialecticalSynthesisTask, {
    cosmologicalAnalysis,
    teleologicalAnalysis,
    ontologicalAnalysis,
    moralAnalysis,
    atheisticArguments,
    outputDir
  });

  artifacts.push(...dialecticalSynthesis.artifacts);

  // Breakpoint: Review arguments evaluation
  await ctx.breakpoint({
    question: `Theistic arguments evaluation complete. Analyzed 4 major argument types. Review the analysis?`,
    title: 'Theistic Arguments Evaluation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        argumentFocus,
        evaluationScope,
        includesCounterarguments: includeCounterarguments,
        overallAssessment: dialecticalSynthesis.overallAssessment
      }
    }
  });

  // Task 7: Generate Arguments Report
  ctx.log('info', 'Generating theistic arguments evaluation report');
  const argumentsReport = await ctx.task(argumentsReportTask, {
    argumentFocus,
    cosmologicalAnalysis,
    teleologicalAnalysis,
    ontologicalAnalysis,
    moralAnalysis,
    atheisticArguments,
    dialecticalSynthesis,
    outputDir
  });

  artifacts.push(...argumentsReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    argumentEvaluations: [
      { type: 'cosmological', analysis: cosmologicalAnalysis.analysis },
      { type: 'teleological', analysis: teleologicalAnalysis.analysis },
      { type: 'ontological', analysis: ontologicalAnalysis.analysis },
      { type: 'moral', analysis: moralAnalysis.analysis }
    ],
    dialecticalAnalysis: {
      synthesis: dialecticalSynthesis.synthesis,
      cumulativeCase: dialecticalSynthesis.cumulativeCase,
      atheisticResponses: atheisticArguments?.analysis
    },
    overallAssessment: {
      assessment: dialecticalSynthesis.overallAssessment,
      strongestArgument: dialecticalSynthesis.strongestArgument,
      weakestArgument: dialecticalSynthesis.weakestArgument,
      recommendation: dialecticalSynthesis.recommendation
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/theistic-arguments-evaluation',
      timestamp: startTime,
      argumentFocus,
      outputDir
    }
  };
}

// Task definitions
export const cosmologicalAnalysisTask = defineTask('cosmological-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cosmological arguments',
  agent: {
    name: 'cosmological-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze cosmological arguments for God\'s existence',
      context: args,
      instructions: [
        'Present the Kalam Cosmological Argument',
        'Present the Thomistic Five Ways (relevant ones)',
        'Present the Leibnizian Cosmological Argument',
        'Analyze key premises (PSR, impossibility of actual infinite, etc.)',
        'Present major objections to each',
        'Assess responses to objections',
        'Evaluate overall strength of cosmological arguments',
        'Save cosmological analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (arguments, premises, objections, evaluation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            arguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  formulation: { type: 'string' },
                  keyPremises: { type: 'array', items: { type: 'string' } },
                  objections: { type: 'array', items: { type: 'string' } },
                  responses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallEvaluation: { type: 'string' },
            strength: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theism', 'cosmological']
}));

export const teleologicalAnalysisTask = defineTask('teleological-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze teleological arguments',
  agent: {
    name: 'teleological-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze teleological (design) arguments for God\'s existence',
      context: args,
      instructions: [
        'Present classical design arguments (Paley)',
        'Present fine-tuning arguments',
        'Present biological design arguments',
        'Analyze key premises and inferences',
        'Present Darwinian objections',
        'Present multiverse objections',
        'Assess responses to objections',
        'Evaluate overall strength of teleological arguments',
        'Save teleological analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (arguments, premises, objections, evaluation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            arguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  formulation: { type: 'string' },
                  keyPremises: { type: 'array', items: { type: 'string' } },
                  objections: { type: 'array', items: { type: 'string' } },
                  responses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallEvaluation: { type: 'string' },
            strength: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theism', 'teleological']
}));

export const ontologicalAnalysisTask = defineTask('ontological-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze ontological arguments',
  agent: {
    name: 'ontological-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze ontological arguments for God\'s existence',
      context: args,
      instructions: [
        'Present Anselm\'s ontological argument',
        'Present Descartes\' ontological argument',
        'Present Plantinga\'s modal ontological argument',
        'Analyze the concept of necessary existence',
        'Present Kant\'s objection (existence not a predicate)',
        'Present other major objections',
        'Assess responses to objections',
        'Evaluate overall strength of ontological arguments',
        'Save ontological analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (arguments, premises, objections, evaluation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            arguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  formulation: { type: 'string' },
                  keyPremises: { type: 'array', items: { type: 'string' } },
                  objections: { type: 'array', items: { type: 'string' } },
                  responses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallEvaluation: { type: 'string' },
            strength: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theism', 'ontological']
}));

export const moralArgumentsTask = defineTask('moral-arguments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze moral arguments',
  agent: {
    name: 'moral-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze moral arguments for God\'s existence',
      context: args,
      instructions: [
        'Present the moral argument from objective moral facts',
        'Present the argument from moral obligation',
        'Present the argument from moral knowledge',
        'Analyze the connection between theism and morality',
        'Present Euthyphro objection',
        'Present naturalistic alternatives',
        'Assess responses to objections',
        'Evaluate overall strength of moral arguments',
        'Save moral arguments analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (arguments, premises, objections, evaluation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            arguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  formulation: { type: 'string' },
                  keyPremises: { type: 'array', items: { type: 'string' } },
                  objections: { type: 'array', items: { type: 'string' } },
                  responses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallEvaluation: { type: 'string' },
            strength: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theism', 'moral']
}));

export const atheisticArgumentsTask = defineTask('atheistic-arguments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze arguments against theism',
  agent: {
    name: 'atheistic-analyst',
    prompt: {
      role: 'philosopher of religion',
      task: 'Analyze major arguments against theism',
      context: args,
      instructions: [
        'Present the problem of evil (logical and evidential)',
        'Present the argument from divine hiddenness',
        'Present arguments from religious diversity',
        'Present naturalistic explanations of religion',
        'Present parsimony arguments',
        'Assess theistic responses to each',
        'Evaluate overall strength of arguments against theism',
        'Save atheistic arguments analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (arguments, premises, theisticResponses, evaluation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            arguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  formulation: { type: 'string' },
                  keyPremises: { type: 'array', items: { type: 'string' } },
                  theisticResponses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallEvaluation: { type: 'string' },
            strength: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theism', 'atheistic']
}));

export const dialecticalSynthesisTask = defineTask('dialectical-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize dialectical analysis',
  agent: {
    name: 'dialectical-synthesizer',
    prompt: {
      role: 'philosopher of religion',
      task: 'Synthesize all argument evaluations into dialectical assessment',
      context: args,
      instructions: [
        'Compare strengths of different argument types',
        'Assess cumulative case for theism',
        'Weigh theistic arguments against atheistic arguments',
        'Identify the strongest argument for theism',
        'Identify the weakest argument for theism',
        'Determine overall dialectical status',
        'Provide recommendation on rational assessment',
        'Save dialectical synthesis to output directory'
      ],
      outputFormat: 'JSON with synthesis, cumulativeCase, strongestArgument, weakestArgument, overallAssessment, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'overallAssessment', 'artifacts'],
      properties: {
        synthesis: { type: 'string' },
        cumulativeCase: { type: 'string' },
        strongestArgument: { type: 'string' },
        weakestArgument: { type: 'string' },
        overallAssessment: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theism', 'synthesis']
}));

export const argumentsReportTask = defineTask('arguments-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate theistic arguments evaluation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosopher of religion and technical writer',
      task: 'Generate comprehensive theistic arguments evaluation report',
      context: args,
      instructions: [
        'Create executive summary of arguments evaluation',
        'Present cosmological arguments analysis',
        'Present teleological arguments analysis',
        'Present ontological arguments analysis',
        'Present moral arguments analysis',
        'Include atheistic arguments if analyzed',
        'Present dialectical synthesis',
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
  labels: ['agent', 'philosophy', 'theism', 'reporting']
}));
