/**
 * @process domains/science/scientific-discovery/counter-signal-mining
 * @description Counter-Signal Mining: Treat outliers and failures as primary data to mine
 * @inputs {
 *   dataset: string,
 *   expectedPattern: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   counterSignals: array,
 *   miningResults: object,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataset,
    expectedPattern = '',
    domain = 'general science',
    outlierThreshold = 2.0
  } = inputs;

  const startTime = ctx.now();
  const counterSignals = [];

  // Phase 1: Establish Expected Pattern Baseline
  ctx.log('info', 'Establishing expected pattern baseline');
  const baseline = await ctx.task(establishBaselineTask, {
    dataset,
    expectedPattern,
    domain
  });

  // Phase 2: Identify Outliers and Anomalies
  ctx.log('info', 'Identifying outliers and anomalies');
  const outlierDetection = await ctx.task(detectOutliersTask, {
    dataset,
    baseline,
    outlierThreshold,
    domain
  });

  counterSignals.push(...outlierDetection.outliers.map(o => ({
    ...o,
    type: 'outlier'
  })));

  // Phase 3: Identify Failures and Unexpected Results
  ctx.log('info', 'Identifying failures and unexpected results');
  const failureDetection = await ctx.task(detectFailuresTask, {
    dataset,
    baseline,
    domain
  });

  counterSignals.push(...failureDetection.failures.map(f => ({
    ...f,
    type: 'failure'
  })));

  await ctx.breakpoint({
    question: `Identified ${counterSignals.length} counter-signals. Review before mining?`,
    title: 'Counter-Signal Mining - Detection Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/baseline.json', format: 'json' },
        { path: 'artifacts/counter-signals.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Classify Counter-Signals
  ctx.log('info', 'Classifying counter-signals');
  const classification = await ctx.task(classifyCounterSignalsTask, {
    counterSignals,
    baseline,
    domain
  });

  // Phase 5: Mine Counter-Signals for Patterns
  ctx.log('info', 'Mining counter-signals for patterns');
  const miningResults = await ctx.task(mineCounterSignalPatternsTask, {
    counterSignals,
    classification,
    baseline,
    domain
  });

  // Phase 6: Generate Alternative Hypotheses
  ctx.log('info', 'Generating alternative hypotheses from counter-signals');
  const alternativeHypotheses = await ctx.task(generateAlternativeHypothesesTask, {
    counterSignals,
    miningResults,
    baseline,
    domain
  });

  // Phase 7: Assess Counter-Signal Significance
  ctx.log('info', 'Assessing significance of counter-signals');
  const significanceAssessment = await ctx.task(assessSignificanceTask, {
    counterSignals,
    miningResults,
    alternativeHypotheses,
    domain
  });

  // Phase 8: Synthesize Insights
  ctx.log('info', 'Synthesizing insights from counter-signal mining');
  const synthesis = await ctx.task(synthesizeCounterSignalInsightsTask, {
    counterSignals,
    classification,
    miningResults,
    alternativeHypotheses,
    significanceAssessment,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/counter-signal-mining',
    dataset,
    domain,
    baseline,
    counterSignals,
    classification,
    miningResults,
    alternativeHypotheses,
    significanceAssessment,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      totalCounterSignals: counterSignals.length,
      outliersFound: outlierDetection.outliers.length,
      failuresFound: failureDetection.failures.length,
      significantCounterSignals: significanceAssessment.significantCount || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const establishBaselineTask = defineTask('establish-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Expected Pattern Baseline',
  agent: {
    name: 'baseline-analyst',
    prompt: {
      role: 'statistical analyst',
      task: 'Establish the expected pattern as baseline for comparison',
      context: args,
      instructions: [
        'Document the expected pattern or model',
        'Define what constitutes normal/expected behavior',
        'Establish statistical baselines where applicable',
        'Define deviation thresholds',
        'Document assumptions underlying expectations',
        'Identify key features to monitor for deviations',
        'Create reference distribution or model'
      ],
      outputFormat: 'JSON with baseline model, thresholds, assumptions, features'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineModel', 'normalBehavior', 'deviationThresholds'],
      properties: {
        baselineModel: { type: 'object' },
        normalBehavior: { type: 'object' },
        deviationThresholds: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        referenceDistribution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'baseline']
}));

export const detectOutliersTask = defineTask('detect-outliers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect Outliers and Anomalies',
  agent: {
    name: 'outlier-detector',
    prompt: {
      role: 'anomaly detection specialist',
      task: 'Identify outliers and anomalies in the data',
      context: args,
      instructions: [
        'Apply multiple outlier detection methods',
        'Identify statistical outliers',
        'Detect contextual anomalies',
        'Find collective anomalies',
        'Document outlier characteristics',
        'Rate confidence in outlier status',
        'Classify outlier severity'
      ],
      outputFormat: 'JSON with outliers, methods used, confidence, severity'
    },
    outputSchema: {
      type: 'object',
      required: ['outliers'],
      properties: {
        outliers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              value: { type: 'object' },
              deviationScore: { type: 'number' },
              detectionMethod: { type: 'string' },
              confidence: { type: 'number' },
              severity: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        methodsUsed: { type: 'array', items: { type: 'string' } },
        anomalyTypes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'outlier-detection']
}));

export const detectFailuresTask = defineTask('detect-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect Failures and Unexpected Results',
  agent: {
    name: 'failure-detector',
    prompt: {
      role: 'failure analysis specialist',
      task: 'Identify failures and unexpected results in the data',
      context: args,
      instructions: [
        'Identify cases where expected outcome did not occur',
        'Find prediction failures',
        'Detect process failures',
        'Identify unexpected successes',
        'Document failure modes',
        'Characterize failure conditions',
        'Rate failure significance'
      ],
      outputFormat: 'JSON with failures, modes, conditions, significance'
    },
    outputSchema: {
      type: 'object',
      required: ['failures'],
      properties: {
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              expected: { type: 'object' },
              actual: { type: 'object' },
              failureMode: { type: 'string' },
              conditions: { type: 'object' },
              significance: { type: 'number' }
            }
          }
        },
        failureModes: { type: 'array', items: { type: 'string' } },
        unexpectedSuccesses: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'failure-detection']
}));

export const classifyCounterSignalsTask = defineTask('classify-counter-signals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify Counter-Signals',
  agent: {
    name: 'signal-classifier',
    prompt: {
      role: 'signal classification specialist',
      task: 'Classify counter-signals by type and origin',
      context: args,
      instructions: [
        'Classify counter-signals by likely cause',
        'Distinguish noise from signal',
        'Identify measurement errors vs real deviations',
        'Group related counter-signals',
        'Identify systematic vs random deviations',
        'Classify by information content',
        'Rate mining potential of each class'
      ],
      outputFormat: 'JSON with classifications, groupings, mining potential'
    },
    outputSchema: {
      type: 'object',
      required: ['classifications', 'groupings'],
      properties: {
        classifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterSignalId: { type: 'string' },
              category: { type: 'string' },
              likelyCause: { type: 'string' },
              noiseVsSignal: { type: 'string' },
              informationContent: { type: 'string' }
            }
          }
        },
        groupings: { type: 'array', items: { type: 'object' } },
        systematicDeviations: { type: 'array', items: { type: 'string' } },
        randomDeviations: { type: 'array', items: { type: 'string' } },
        miningPotential: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'classification']
}));

export const mineCounterSignalPatternsTask = defineTask('mine-counter-signal-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine Counter-Signal Patterns',
  agent: {
    name: 'pattern-miner',
    prompt: {
      role: 'pattern mining specialist',
      task: 'Mine counter-signals for hidden patterns and relationships',
      context: args,
      instructions: [
        'Search for patterns among counter-signals',
        'Identify correlations between counter-signals',
        'Find temporal patterns in counter-signal occurrence',
        'Identify contextual factors associated with counter-signals',
        'Look for structure in the counter-signal space',
        'Find predictive features for counter-signals',
        'Document discovered patterns'
      ],
      outputFormat: 'JSON with patterns, correlations, temporal patterns, predictors'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              support: { type: 'number' },
              confidence: { type: 'number' },
              counterSignalsInvolved: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        correlations: { type: 'array', items: { type: 'object' } },
        temporalPatterns: { type: 'array', items: { type: 'object' } },
        contextualFactors: { type: 'array', items: { type: 'object' } },
        predictiveFeatures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'pattern-mining']
}));

export const generateAlternativeHypothesesTask = defineTask('generate-alternative-hypotheses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Alternative Hypotheses',
  agent: {
    name: 'hypothesis-generator',
    prompt: {
      role: 'theoretical scientist',
      task: 'Generate alternative hypotheses that explain the counter-signals',
      context: args,
      instructions: [
        'Generate hypotheses that explain counter-signal patterns',
        'Consider model inadequacy as explanation',
        'Consider hidden variables',
        'Consider regime changes or transitions',
        'Consider measurement issues',
        'Consider novel phenomena',
        'Rate plausibility of each hypothesis'
      ],
      outputFormat: 'JSON with hypotheses, explanations, plausibility ratings'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              explanation: { type: 'string' },
              counterSignalsExplained: { type: 'array', items: { type: 'string' } },
              plausibility: { type: 'number' },
              testability: { type: 'string' }
            }
          }
        },
        modelInadequacies: { type: 'array', items: { type: 'string' } },
        hiddenVariables: { type: 'array', items: { type: 'string' } },
        novelPhenomena: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'hypothesis-generation']
}));

export const assessSignificanceTask = defineTask('assess-significance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Counter-Signal Significance',
  agent: {
    name: 'significance-assessor',
    prompt: {
      role: 'significance analyst',
      task: 'Assess the scientific significance of counter-signals',
      context: args,
      instructions: [
        'Rate overall significance of counter-signals',
        'Identify most significant findings',
        'Assess implications for current understanding',
        'Identify paradigm-challenging counter-signals',
        'Rate confidence in significance assessments',
        'Document what makes counter-signals significant',
        'Prioritize counter-signals for follow-up'
      ],
      outputFormat: 'JSON with significance ratings, implications, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['overallSignificance', 'significantFindings'],
      properties: {
        overallSignificance: { type: 'string' },
        significantCount: { type: 'number' },
        significantFindings: { type: 'array', items: { type: 'object' } },
        implications: { type: 'array', items: { type: 'string' } },
        paradigmChallenges: { type: 'array', items: { type: 'string' } },
        followUpPriorities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'significance']
}));

export const synthesizeCounterSignalInsightsTask = defineTask('synthesize-counter-signal-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Counter-Signal Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'scientific synthesizer',
      task: 'Synthesize insights from counter-signal mining',
      context: args,
      instructions: [
        'Integrate all findings into coherent insights',
        'Document what counter-signals reveal about the system',
        'Identify the most valuable information gained',
        'Provide recommendations for model revision',
        'Suggest experiments to test alternative hypotheses',
        'Note limitations of the analysis',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, recommendations, experiments'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        systemRevelations: { type: 'array', items: { type: 'string' } },
        valuableInformation: { type: 'array', items: { type: 'string' } },
        modelRevisionRecommendations: { type: 'array', items: { type: 'string' } },
        suggestedExperiments: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counter-signal', 'synthesis']
}));
