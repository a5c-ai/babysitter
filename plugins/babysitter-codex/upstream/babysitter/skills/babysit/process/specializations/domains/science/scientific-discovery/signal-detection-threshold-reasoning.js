/**
 * @process scientific-discovery/signal-detection-threshold-reasoning
 * @description Model hits, misses, false alarms, and thresholds using Signal Detection Theory for understanding decision-making under uncertainty
 * @inputs { task: object, data: object, stimuli: object, responses: object, outputDir: string }
 * @outputs { success: boolean, sdtAnalysis: object, sensitivity: object, bias: object, thresholdAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    task = {},
    data = {},
    stimuli = {},
    responses = {},
    outputDir = 'signal-detection-output',
    targetPrecision = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Signal Detection and Threshold Reasoning Process');

  // ============================================================================
  // PHASE 1: TASK CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing detection task');
  const taskCharacterization = await ctx.task(taskCharacterizationTask, {
    task,
    stimuli,
    outputDir
  });

  artifacts.push(...taskCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: RESPONSE CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Classifying responses');
  const responseClassification = await ctx.task(responseClassificationTask, {
    data,
    stimuli,
    responses,
    outputDir
  });

  artifacts.push(...responseClassification.artifacts);

  // ============================================================================
  // PHASE 3: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing sensitivity (d-prime)');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    responseMatrix: responseClassification.matrix,
    task: taskCharacterization.task,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: RESPONSE BIAS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing response bias');
  const biasAnalysis = await ctx.task(responseBiasAnalysisTask, {
    responseMatrix: responseClassification.matrix,
    sensitivityResults: sensitivityAnalysis.results,
    outputDir
  });

  artifacts.push(...biasAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: ROC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing ROC curve');
  const rocAnalysis = await ctx.task(rocAnalysisTask, {
    responseMatrix: responseClassification.matrix,
    sensitivity: sensitivityAnalysis.results,
    bias: biasAnalysis.results,
    outputDir
  });

  artifacts.push(...rocAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: THRESHOLD ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing decision threshold');
  const thresholdAnalysis = await ctx.task(thresholdAnalysisTask, {
    task: taskCharacterization.task,
    biasAnalysis: biasAnalysis.results,
    rocAnalysis: rocAnalysis.results,
    outputDir
  });

  artifacts.push(...thresholdAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: OPTIMAL THRESHOLD DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Determining optimal threshold');
  const optimalThreshold = await ctx.task(optimalThresholdTask, {
    rocAnalysis: rocAnalysis.results,
    taskCharacterization,
    payoffMatrix: task.payoffs || {},
    outputDir
  });

  artifacts.push(...optimalThreshold.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing SDT analysis');
  const synthesis = await ctx.task(sdtSynthesisTask, {
    taskCharacterization,
    responseClassification,
    sensitivityAnalysis,
    biasAnalysis,
    rocAnalysis,
    thresholdAnalysis,
    optimalThreshold,
    targetPrecision,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const precisionMet = synthesis.precisionScore >= targetPrecision;

  // Breakpoint: Review SDT analysis
  await ctx.breakpoint({
    question: `SDT analysis complete. Precision: ${synthesis.precisionScore}/${targetPrecision}. ${precisionMet ? 'Precision target met!' : 'Additional data may be needed.'} Review analysis?`,
    title: 'Signal Detection Theory Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        task: taskCharacterization.task.name,
        dPrime: sensitivityAnalysis.results.dPrime,
        criterion: biasAnalysis.results.criterion,
        AUC: rocAnalysis.results.AUC,
        optimalCriterion: optimalThreshold.optimal.criterion,
        precisionScore: synthesis.precisionScore,
        precisionMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    task: taskCharacterization.task,
    sdtAnalysis: {
      responseMatrix: responseClassification.matrix,
      rates: responseClassification.rates
    },
    sensitivity: sensitivityAnalysis.results,
    bias: biasAnalysis.results,
    thresholdAnalysis: {
      current: thresholdAnalysis.analysis,
      optimal: optimalThreshold.optimal,
      recommendations: optimalThreshold.recommendations
    },
    roc: rocAnalysis.results,
    interpretation: synthesis.interpretation,
    precisionScore: synthesis.precisionScore,
    precisionMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/signal-detection-threshold-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Task Characterization
export const taskCharacterizationTask = defineTask('task-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize detection task',
  agent: {
    name: 'sdt-specialist',
    prompt: {
      role: 'cognitive psychologist specializing in Signal Detection Theory',
      task: 'Characterize the detection or discrimination task',
      context: args,
      instructions: [
        'Identify the task type:',
        '  - Yes/No detection',
        '  - Two-alternative forced choice (2AFC)',
        '  - Rating scale',
        '  - Multiple-alternative forced choice',
        'Define signal and noise:',
        '  - What constitutes a signal-present trial?',
        '  - What constitutes a signal-absent (noise) trial?',
        '  - What are the stimulus characteristics?',
        'Characterize the decision:',
        '  - What response options are available?',
        '  - What is the observer\'s task?',
        'Identify relevant payoffs and priors:',
        '  - Costs of errors (miss vs. false alarm)',
        '  - Base rates of signal/noise',
        'Document task parameters',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with task (name, type, signal, noise, decision, payoffs, priors), assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['task', 'artifacts'],
      properties: {
        task: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['yes-no', '2AFC', 'rating', 'mAFC'] },
            signal: { type: 'object' },
            noise: { type: 'object' },
            decision: { type: 'object' },
            payoffs: {
              type: 'object',
              properties: {
                hit: { type: 'number' },
                miss: { type: 'number' },
                falseAlarm: { type: 'number' },
                correctRejection: { type: 'number' }
              }
            },
            priors: {
              type: 'object',
              properties: {
                signalProbability: { type: 'number' },
                noiseProbability: { type: 'number' }
              }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'signal-detection', 'task-characterization']
}));

// Task 2: Response Classification
export const responseClassificationTask = defineTask('response-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify responses',
  agent: {
    name: 'response-classifier',
    prompt: {
      role: 'SDT data analyst',
      task: 'Classify responses into hits, misses, false alarms, and correct rejections',
      context: args,
      instructions: [
        'Create 2x2 response matrix:',
        '  - Hit (H): Signal present, responded "yes"',
        '  - Miss (M): Signal present, responded "no"',
        '  - False Alarm (FA): Signal absent, responded "yes"',
        '  - Correct Rejection (CR): Signal absent, responded "no"',
        'Calculate response rates:',
        '  - Hit Rate (HR) = H / (H + M)',
        '  - False Alarm Rate (FAR) = FA / (FA + CR)',
        '  - Miss Rate = M / (H + M) = 1 - HR',
        '  - Correct Rejection Rate = CR / (FA + CR) = 1 - FAR',
        'Handle extreme values (0 or 1):',
        '  - Apply log-linear correction if needed',
        '  - Document corrections applied',
        'Calculate total trials and trial counts',
        'Save classification to output directory'
      ],
      outputFormat: 'JSON with matrix (hits, misses, falseAlarms, correctRejections), rates (hitRate, falseAlarmRate, etc.), corrections, totalTrials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'rates', 'artifacts'],
      properties: {
        matrix: {
          type: 'object',
          properties: {
            hits: { type: 'number' },
            misses: { type: 'number' },
            falseAlarms: { type: 'number' },
            correctRejections: { type: 'number' }
          }
        },
        rates: {
          type: 'object',
          properties: {
            hitRate: { type: 'number' },
            falseAlarmRate: { type: 'number' },
            missRate: { type: 'number' },
            correctRejectionRate: { type: 'number' }
          }
        },
        corrections: { type: 'array', items: { type: 'string' } },
        totalTrials: {
          type: 'object',
          properties: {
            signalTrials: { type: 'number' },
            noiseTrials: { type: 'number' },
            total: { type: 'number' }
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
  labels: ['agent', 'signal-detection', 'response-classification']
}));

// Task 3: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze sensitivity (d-prime)',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'psychophysicist specializing in sensitivity measurement',
      task: 'Calculate and interpret sensitivity measures',
      context: args,
      instructions: [
        'Calculate d-prime (d\'):',
        '  - d\' = z(HR) - z(FAR)',
        '  - Where z() is the inverse normal cumulative distribution',
        'Interpret d-prime:',
        '  - d\' = 0: No discrimination (chance performance)',
        '  - d\' = 1: Moderate sensitivity',
        '  - d\' > 2: Good sensitivity',
        '  - d\' > 3: Excellent sensitivity',
        'Calculate alternative sensitivity measures:',
        '  - A-prime (A\'): nonparametric sensitivity',
        '  - Percent correct (for 2AFC)',
        'Calculate confidence interval for d\'',
        'Assess assumptions:',
        '  - Equal variance assumption',
        '  - Normality of distributions',
        'Save sensitivity analysis to output directory'
      ],
      outputFormat: 'JSON with results (dPrime, aPrime, interpretation, confidenceInterval), assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'assumptions', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            dPrime: { type: 'number' },
            zHitRate: { type: 'number' },
            zFalseAlarmRate: { type: 'number' },
            aPrime: { type: 'number' },
            percentCorrect: { type: 'number' },
            interpretation: { type: 'string' },
            confidenceInterval: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' },
                level: { type: 'number' }
              }
            }
          }
        },
        assumptions: {
          type: 'object',
          properties: {
            equalVariance: { type: 'boolean' },
            normality: { type: 'string' }
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
  labels: ['agent', 'signal-detection', 'sensitivity']
}));

// Task 4: Response Bias Analysis
export const responseBiasAnalysisTask = defineTask('response-bias-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze response bias',
  agent: {
    name: 'bias-analyst',
    prompt: {
      role: 'SDT specialist in response bias',
      task: 'Calculate and interpret response bias measures',
      context: args,
      instructions: [
        'Calculate criterion (c):',
        '  - c = -0.5 * (z(HR) + z(FAR))',
        '  - Represents location of decision threshold',
        'Interpret criterion:',
        '  - c = 0: Neutral (unbiased)',
        '  - c > 0: Conservative (biased toward "no")',
        '  - c < 0: Liberal (biased toward "yes")',
        'Calculate beta (likelihood ratio):',
        '  - β = exp(d\' * c)',
        '  - β = 1: Neutral',
        '  - β > 1: Conservative',
        '  - β < 1: Liberal',
        'Calculate C (response bias relative to optimal):',
        '  - C = c / d\'',
        'Interpret bias in context of task payoffs and priors',
        'Save bias analysis to output directory'
      ],
      outputFormat: 'JSON with results (criterion, beta, C, interpretation), biasDirection, optimalComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'biasDirection', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            criterion: { type: 'number' },
            beta: { type: 'number' },
            C: { type: 'number' },
            interpretation: { type: 'string' }
          }
        },
        biasDirection: { type: 'string', enum: ['conservative', 'neutral', 'liberal'] },
        optimalComparison: {
          type: 'object',
          properties: {
            optimalCriterion: { type: 'number' },
            deviation: { type: 'number' }
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
  labels: ['agent', 'signal-detection', 'bias']
}));

// Task 5: ROC Analysis
export const rocAnalysisTask = defineTask('roc-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct ROC curve',
  agent: {
    name: 'roc-analyst',
    prompt: {
      role: 'SDT specialist in ROC analysis',
      task: 'Construct and analyze Receiver Operating Characteristic (ROC) curve',
      context: args,
      instructions: [
        'Construct ROC curve:',
        '  - Plot HR vs. FAR at different criteria',
        '  - For rating data: calculate HR/FAR at each confidence level',
        '  - For yes/no: plot single point with isosensitivity curve',
        'Calculate Area Under the Curve (AUC):',
        '  - AUC = 0.5: Chance performance',
        '  - AUC = 1.0: Perfect discrimination',
        'Interpret ROC shape:',
        '  - Symmetric: Equal variance model',
        '  - Asymmetric: Unequal variance',
        'Compare empirical ROC to theoretical:',
        '  - Based on estimated d\'',
        '  - Assess model fit',
        'Calculate confidence band for ROC',
        'Save ROC analysis to output directory'
      ],
      outputFormat: 'JSON with results (AUC, rocPoints, interpretation), curveShape, modelFit, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'curveShape', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            AUC: { type: 'number' },
            rocPoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hitRate: { type: 'number' },
                  falseAlarmRate: { type: 'number' },
                  criterion: { type: 'number' }
                }
              }
            },
            interpretation: { type: 'string' }
          }
        },
        curveShape: { type: 'string', enum: ['symmetric', 'asymmetric'] },
        modelFit: {
          type: 'object',
          properties: {
            theoreticalAUC: { type: 'number' },
            fitQuality: { type: 'string' }
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
  labels: ['agent', 'signal-detection', 'roc']
}));

// Task 6: Threshold Analysis
export const thresholdAnalysisTask = defineTask('threshold-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decision threshold',
  agent: {
    name: 'threshold-analyst',
    prompt: {
      role: 'decision scientist specializing in threshold models',
      task: 'Analyze the decision threshold and its implications',
      context: args,
      instructions: [
        'Characterize current threshold:',
        '  - Where is the observer setting their criterion?',
        '  - What evidence strength triggers a "yes" response?',
        'Analyze threshold in relation to:',
        '  - Task payoffs (costs/benefits of outcomes)',
        '  - Prior probabilities (base rates)',
        '  - Personal factors (risk tolerance)',
        'Calculate threshold as likelihood ratio:',
        '  - Threshold = P(signal|evidence) / P(noise|evidence)',
        'Identify threshold stability:',
        '  - Does criterion shift during task?',
        '  - Adaptation effects?',
        'Consider dual-threshold models if applicable:',
        '  - One for "yes" responses',
        '  - One for "no" responses',
        'Save threshold analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (currentThreshold, evidenceLevel, payoffAlignment, stability), dualThreshold, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            currentThreshold: { type: 'number' },
            evidenceLevel: { type: 'string' },
            payoffAlignment: { type: 'string' },
            priorAlignment: { type: 'string' },
            stability: { type: 'string' }
          }
        },
        dualThreshold: {
          type: 'object',
          properties: {
            applicable: { type: 'boolean' },
            yesThreshold: { type: 'number' },
            noThreshold: { type: 'number' }
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
  labels: ['agent', 'signal-detection', 'threshold']
}));

// Task 7: Optimal Threshold Determination
export const optimalThresholdTask = defineTask('optimal-threshold', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine optimal threshold',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'decision optimization specialist',
      task: 'Determine the optimal decision threshold given payoffs and priors',
      context: args,
      instructions: [
        'Calculate optimal criterion based on:',
        '  - Payoff matrix (value of outcomes)',
        '  - Prior probabilities (base rates)',
        'Optimal β = [P(noise)/P(signal)] × [(V_CR - V_FA)/(V_H - V_M)]',
        '  - Where V = value of each outcome',
        'Convert optimal β to criterion c',
        'Calculate expected value at optimal vs. current criterion',
        'Identify scenarios where current threshold is:',
        '  - Optimal (or close)',
        '  - Too conservative',
        '  - Too liberal',
        'Provide recommendations for threshold adjustment',
        'Consider practical constraints on threshold setting',
        'Save optimal threshold analysis to output directory'
      ],
      outputFormat: 'JSON with optimal (criterion, beta, expectedValue), comparison, recommendations, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimal', 'comparison', 'recommendations', 'artifacts'],
      properties: {
        optimal: {
          type: 'object',
          properties: {
            criterion: { type: 'number' },
            beta: { type: 'number' },
            expectedValue: { type: 'number' }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            currentExpectedValue: { type: 'number' },
            optimalExpectedValue: { type: 'number' },
            valueLoss: { type: 'number' },
            thresholdDeviation: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              expectedImprovement: { type: 'number' }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'signal-detection', 'optimal-threshold']
}));

// Task 8: SDT Synthesis
export const sdtSynthesisTask = defineTask('sdt-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize SDT analysis',
  agent: {
    name: 'sdt-synthesis-specialist',
    prompt: {
      role: 'senior cognitive psychologist',
      task: 'Synthesize Signal Detection Theory analysis',
      context: args,
      instructions: [
        'Summarize SDT analysis:',
        '  - Sensitivity interpretation (what can the observer discriminate?)',
        '  - Bias interpretation (what are their response tendencies?)',
        '  - Threshold interpretation (where do they set their criterion?)',
        'Integrate findings:',
        '  - Relationship between sensitivity and task performance',
        '  - Appropriateness of response bias',
        '  - Optimality of threshold placement',
        'Assess precision (0-100):',
        '  - Sample size adequacy',
        '  - Confidence interval widths',
        '  - Model fit quality',
        'Provide practical recommendations',
        'Identify limitations and future directions',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with interpretation, precisionScore, practicalRecommendations, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'precisionScore', 'artifacts'],
      properties: {
        interpretation: {
          type: 'object',
          properties: {
            sensitivity: { type: 'string' },
            bias: { type: 'string' },
            threshold: { type: 'string' },
            integration: { type: 'string' }
          }
        },
        precisionScore: { type: 'number', minimum: 0, maximum: 100 },
        practicalRecommendations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'signal-detection', 'synthesis']
}));
