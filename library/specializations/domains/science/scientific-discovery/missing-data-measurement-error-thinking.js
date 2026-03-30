/**
 * @process scientific-discovery/missing-data-measurement-error-thinking
 * @description Treat missingness and measurement error as structured problems requiring principled statistical handling
 * @inputs { data: object, variables: array, missingPattern: object, errorSources: array, outputDir: string }
 * @outputs { success: boolean, missingAnalysis: object, errorAnalysis: object, handlingStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    data = {},
    variables = [],
    missingPattern = {},
    errorSources = [],
    outputDir = 'missing-error-output',
    targetRobustness = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Missing Data and Measurement Error Thinking Process');

  // ============================================================================
  // PHASE 1: MISSING DATA CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing missing data');
  const missingCharacterization = await ctx.task(missingDataCharacterizationTask, {
    data,
    variables,
    outputDir
  });

  artifacts.push(...missingCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: MISSING DATA MECHANISM ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing missing data mechanism');
  const mechanismAssessment = await ctx.task(missingMechanismAssessmentTask, {
    data,
    missingCharacterization,
    outputDir
  });

  artifacts.push(...mechanismAssessment.artifacts);

  // ============================================================================
  // PHASE 3: MEASUREMENT ERROR IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying measurement errors');
  const errorIdentification = await ctx.task(measurementErrorIdentificationTask, {
    data,
    variables,
    errorSources,
    outputDir
  });

  artifacts.push(...errorIdentification.artifacts);

  // ============================================================================
  // PHASE 4: ERROR STRUCTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing error structure');
  const errorStructure = await ctx.task(errorStructureAnalysisTask, {
    errorIdentification,
    data,
    variables,
    outputDir
  });

  artifacts.push(...errorStructure.artifacts);

  // ============================================================================
  // PHASE 5: BIAS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing potential biases');
  const biasAssessment = await ctx.task(biasAssessmentTask, {
    missingMechanism: mechanismAssessment.mechanism,
    errorStructure: errorStructure.structure,
    data,
    outputDir
  });

  artifacts.push(...biasAssessment.artifacts);

  // ============================================================================
  // PHASE 6: HANDLING STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Selecting handling strategies');
  const strategySelection = await ctx.task(handlingStrategySelectionTask, {
    missingMechanism: mechanismAssessment.mechanism,
    errorStructure: errorStructure.structure,
    biasAssessment,
    data,
    outputDir
  });

  artifacts.push(...strategySelection.artifacts);

  // ============================================================================
  // PHASE 7: SENSITIVITY ANALYSIS PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning sensitivity analyses');
  const sensitivityPlanning = await ctx.task(sensitivityAnalysisPlanningTask, {
    missingMechanism: mechanismAssessment.mechanism,
    strategySelection,
    biasAssessment,
    outputDir
  });

  artifacts.push(...sensitivityPlanning.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing analysis');
  const synthesis = await ctx.task(missingErrorSynthesisTask, {
    missingCharacterization,
    mechanismAssessment,
    errorIdentification,
    errorStructure,
    biasAssessment,
    strategySelection,
    sensitivityPlanning,
    targetRobustness,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const robustnessMet = synthesis.robustnessScore >= targetRobustness;

  // Breakpoint: Review missing data and error analysis
  await ctx.breakpoint({
    question: `Missing data/error analysis complete. Robustness: ${synthesis.robustnessScore}/${targetRobustness}. ${robustnessMet ? 'Robustness target met!' : 'Additional sensitivity analysis may be needed.'} Review analysis?`,
    title: 'Missing Data and Measurement Error Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        missingPercentage: missingCharacterization.overallMissing,
        missingMechanism: mechanismAssessment.mechanism,
        measurementErrorVariables: errorIdentification.affectedVariables.length,
        primaryStrategy: strategySelection.primary.method,
        robustnessScore: synthesis.robustnessScore,
        robustnessMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    missingAnalysis: {
      characterization: missingCharacterization,
      mechanism: mechanismAssessment.mechanism,
      pattern: missingCharacterization.pattern
    },
    errorAnalysis: {
      identification: errorIdentification,
      structure: errorStructure.structure
    },
    handlingStrategy: {
      primary: strategySelection.primary,
      alternatives: strategySelection.alternatives,
      sensitivityPlan: sensitivityPlanning.plan
    },
    biases: biasAssessment.biases,
    robustnessScore: synthesis.robustnessScore,
    robustnessMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/missing-data-measurement-error-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Missing Data Characterization
export const missingDataCharacterizationTask = defineTask('missing-data-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize missing data',
  agent: {
    name: 'missing-data-analyst',
    prompt: {
      role: 'missing data specialist',
      task: 'Characterize the extent and pattern of missing data',
      context: args,
      instructions: [
        'Calculate missing data extent:',
        '  - Overall percentage missing',
        '  - Missing by variable',
        '  - Missing by observation',
        'Characterize missing data pattern:',
        '  - Univariate (one variable)',
        '  - Monotone (dropout pattern)',
        '  - Arbitrary (non-monotone)',
        'Create missing data visualization:',
        '  - Missing data matrix',
        '  - Missing pattern plot',
        'Identify variables with most missingness',
        'Identify observations with most missingness',
        'Check for systematic patterns',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with overallMissing, byVariable, byObservation, pattern, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallMissing', 'byVariable', 'pattern', 'artifacts'],
      properties: {
        overallMissing: { type: 'number' },
        byVariable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              missing: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        byObservation: { type: 'object' },
        pattern: { type: 'string', enum: ['univariate', 'monotone', 'arbitrary'] },
        systematicPatterns: { type: 'array', items: { type: 'string' } },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-data', 'characterization']
}));

// Task 2: Missing Mechanism Assessment
export const missingMechanismAssessmentTask = defineTask('missing-mechanism-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess missing data mechanism',
  agent: {
    name: 'mechanism-assessor',
    prompt: {
      role: 'missing data mechanism specialist',
      task: 'Assess the mechanism generating missing data',
      context: args,
      instructions: [
        'Classify missing mechanism:',
        '  - MCAR (Missing Completely At Random):',
        '    P(missing) independent of all data',
        '  - MAR (Missing At Random):',
        '    P(missing) depends on observed data only',
        '  - MNAR (Missing Not At Random):',
        '    P(missing) depends on missing values',
        'Conduct diagnostic tests:',
        '  - Little\'s MCAR test',
        '  - Compare complete vs incomplete cases',
        '  - Logistic regression on missingness',
        'Assess plausibility of assumptions:',
        '  - Domain knowledge about missing reasons',
        '  - Pattern analysis',
        '  - External information',
        'Document evidence for mechanism',
        'Save mechanism assessment to output directory'
      ],
      outputFormat: 'JSON with mechanism, tests, evidence, plausibility, domainConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'evidence', 'artifacts'],
      properties: {
        mechanism: { type: 'string', enum: ['MCAR', 'MAR', 'MNAR', 'mixed', 'unknown'] },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              result: { type: 'string' },
              pValue: { type: 'number' }
            }
          }
        },
        evidence: { type: 'array', items: { type: 'string' } },
        plausibility: { type: 'string' },
        domainConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-data', 'mechanism']
}));

// Task 3: Measurement Error Identification
export const measurementErrorIdentificationTask = defineTask('measurement-error-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify measurement errors',
  agent: {
    name: 'error-identifier',
    prompt: {
      role: 'measurement specialist',
      task: 'Identify variables subject to measurement error',
      context: args,
      instructions: [
        'Identify error sources:',
        '  - Self-report error (recall, social desirability)',
        '  - Instrument error (calibration, precision)',
        '  - Proxy variables (using one variable for another)',
        '  - Rounding and coding errors',
        '  - Data entry errors',
        'For each variable, assess:',
        '  - Is there measurement error?',
        '  - What type of error (random, systematic)?',
        '  - What is the magnitude?',
        '  - Is it in predictor or outcome?',
        'Identify validation data if available',
        'Document error source reasoning',
        'Save error identification to output directory'
      ],
      outputFormat: 'JSON with affectedVariables (array), errorSources, validationData, reasoning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['affectedVariables', 'errorSources', 'artifacts'],
      properties: {
        affectedVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              errorType: { type: 'string', enum: ['random', 'systematic', 'both'] },
              source: { type: 'string' },
              magnitude: { type: 'string', enum: ['small', 'moderate', 'large', 'unknown'] },
              role: { type: 'string', enum: ['predictor', 'outcome', 'both'] }
            }
          }
        },
        errorSources: { type: 'array', items: { type: 'string' } },
        validationData: { type: 'object' },
        reasoning: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'measurement-error', 'identification']
}));

// Task 4: Error Structure Analysis
export const errorStructureAnalysisTask = defineTask('error-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze error structure',
  agent: {
    name: 'error-structure-analyst',
    prompt: {
      role: 'measurement error modeler',
      task: 'Analyze the structure of measurement errors',
      context: args,
      instructions: [
        'Characterize error structure:',
        '  - Classical error: X* = X + U, where U ⊥ X',
        '  - Berkson error: X = X* + U, where U ⊥ X*',
        '  - Differential error: error related to outcome',
        '  - Non-differential error: error unrelated to outcome',
        'Estimate error variance if possible:',
        '  - From validation data',
        '  - From repeated measurements',
        '  - From reliability studies',
        'Assess error correlations:',
        '  - Correlated errors across variables?',
        '  - Heteroscedastic errors?',
        'Model the error distribution',
        'Save error structure to output directory'
      ],
      outputFormat: 'JSON with structure (type, differential, variance, correlation, distribution), estimation, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'assumptions', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['classical', 'berkson', 'mixed'] },
            differential: { type: 'boolean' },
            variance: { type: 'object' },
            correlation: { type: 'object' },
            distribution: { type: 'string' }
          }
        },
        estimation: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            estimates: { type: 'object' }
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
  labels: ['agent', 'measurement-error', 'structure']
}));

// Task 5: Bias Assessment
export const biasAssessmentTask = defineTask('bias-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess potential biases',
  agent: {
    name: 'bias-assessor',
    prompt: {
      role: 'statistical bias specialist',
      task: 'Assess biases from missing data and measurement error',
      context: args,
      instructions: [
        'Assess missing data biases:',
        '  - Selection bias (complete case analysis)',
        '  - Information bias (biased imputation)',
        '  - Direction and magnitude of bias',
        'Assess measurement error biases:',
        '  - Attenuation bias (toward null for random error)',
        '  - Bias away from null (differential error)',
        '  - Direction under different scenarios',
        'Assess bias in specific estimates:',
        '  - Means and proportions',
        '  - Regression coefficients',
        '  - Correlations',
        '  - Standard errors',
        'Quantify bias where possible',
        'Save bias assessment to output directory'
      ],
      outputFormat: 'JSON with biases (array with source, direction, magnitude, affected), quantification, scenarios, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['biases', 'scenarios', 'artifacts'],
      properties: {
        biases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              direction: { type: 'string', enum: ['toward-null', 'away-from-null', 'unpredictable', 'conservative'] },
              magnitude: { type: 'string' },
              affectedEstimates: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quantification: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-error', 'bias']
}));

// Task 6: Handling Strategy Selection
export const handlingStrategySelectionTask = defineTask('handling-strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select handling strategies',
  agent: {
    name: 'strategy-selector',
    prompt: {
      role: 'missing data and measurement error methodologist',
      task: 'Select appropriate handling strategies',
      context: args,
      instructions: [
        'Select missing data strategy:',
        '  - Complete case analysis (when appropriate)',
        '  - Single imputation (mean, regression)',
        '  - Multiple imputation (gold standard for MAR)',
        '  - Maximum likelihood methods',
        '  - Inverse probability weighting',
        '  - Pattern mixture/selection models (for MNAR)',
        'Select measurement error strategy:',
        '  - Regression calibration',
        '  - SIMEX (simulation extrapolation)',
        '  - Multiple imputation for mismeasurement',
        '  - Structural equation models',
        '  - External validation data methods',
        'Match strategy to mechanism and data:',
        '  - MI for arbitrary MAR',
        '  - Pattern mixture for MNAR',
        '  - Calibration for classical error',
        'Save strategy selection to output directory'
      ],
      outputFormat: 'JSON with primary (method, rationale, assumptions), alternatives, missingStrategy, errorStrategy, implementation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primary', 'alternatives', 'artifacts'],
      properties: {
        primary: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            rationale: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              whenAppropriate: { type: 'string' }
            }
          }
        },
        missingStrategy: { type: 'object' },
        errorStrategy: { type: 'object' },
        implementation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-error', 'strategy']
}));

// Task 7: Sensitivity Analysis Planning
export const sensitivityAnalysisPlanningTask = defineTask('sensitivity-analysis-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan sensitivity analyses',
  agent: {
    name: 'sensitivity-planner',
    prompt: {
      role: 'sensitivity analysis specialist',
      task: 'Plan sensitivity analyses for missing data and measurement error',
      context: args,
      instructions: [
        'Plan sensitivity to missing mechanism:',
        '  - Compare MAR results to MNAR scenarios',
        '  - Pattern mixture models',
        '  - Tipping point analysis',
        '  - Delta adjustment methods',
        'Plan sensitivity to measurement error:',
        '  - Vary assumed error variance',
        '  - Compare corrected vs. uncorrected',
        '  - External adjustment methods',
        'Design sensitivity analysis:',
        '  - Key parameters to vary',
        '  - Range of values',
        '  - What would change conclusions?',
        'Identify tipping points',
        'Save sensitivity plan to output directory'
      ],
      outputFormat: 'JSON with plan (missingAnalyses, errorAnalyses, parameters, ranges), tippingPoints, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'tippingPoints', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            missingAnalyses: { type: 'array', items: { type: 'object' } },
            errorAnalyses: { type: 'array', items: { type: 'object' } },
            parameters: { type: 'array', items: { type: 'string' } },
            ranges: { type: 'object' }
          }
        },
        tippingPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              value: { type: 'number' },
              consequence: { type: 'string' }
            }
          }
        },
        reporting: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-error', 'sensitivity']
}));

// Task 8: Missing-Error Synthesis
export const missingErrorSynthesisTask = defineTask('missing-error-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior statistician',
      task: 'Synthesize missing data and measurement error analysis',
      context: args,
      instructions: [
        'Summarize findings:',
        '  - Missing data extent and mechanism',
        '  - Measurement error types and structure',
        '  - Expected biases',
        '  - Selected strategies',
        'Assess robustness (0-100):',
        '  - Missing mechanism well-understood?',
        '  - Error structure characterized?',
        '  - Appropriate methods selected?',
        '  - Sensitivity analyses planned?',
        'State key conclusions:',
        '  - Can results be trusted?',
        '  - Under what assumptions?',
        '  - What are the limitations?',
        'Provide recommendations',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, robustnessScore, conclusions, assumptions, limitations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'robustnessScore', 'conclusions', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            missing: { type: 'string' },
            error: { type: 'string' },
            biases: { type: 'string' },
            strategy: { type: 'string' }
          }
        },
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        conclusions: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'missing-error', 'synthesis']
}));
