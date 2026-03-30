/**
 * @process scientific-discovery/residual-diagnostic-thinking
 * @description Study model residuals to identify where and how the model fails, guiding model improvement
 * @inputs { model: object, data: object, predictions: array, outputDir: string }
 * @outputs { success: boolean, residualAnalysis: object, diagnostics: array, modelFailures: array, improvements: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model = {},
    data = {},
    predictions = [],
    outputDir = 'residual-diagnostic-output',
    targetDiagnosticQuality = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Residual Diagnostic Thinking Process');

  // ============================================================================
  // PHASE 1: RESIDUAL COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Computing residuals');
  const residualComputation = await ctx.task(residualComputationTask, {
    model,
    data,
    predictions,
    outputDir
  });

  artifacts.push(...residualComputation.artifacts);

  // ============================================================================
  // PHASE 2: DISTRIBUTIONAL DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing distributional diagnostics');
  const distributionalDiagnostics = await ctx.task(distributionalDiagnosticsTask, {
    residuals: residualComputation.residuals,
    model,
    outputDir
  });

  artifacts.push(...distributionalDiagnostics.artifacts);

  // ============================================================================
  // PHASE 3: STRUCTURAL DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing structural diagnostics');
  const structuralDiagnostics = await ctx.task(structuralDiagnosticsTask, {
    residuals: residualComputation.residuals,
    data,
    model,
    outputDir
  });

  artifacts.push(...structuralDiagnostics.artifacts);

  // ============================================================================
  // PHASE 4: INDEPENDENCE DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 4: Checking independence assumptions');
  const independenceDiagnostics = await ctx.task(independenceDiagnosticsTask, {
    residuals: residualComputation.residuals,
    data,
    outputDir
  });

  artifacts.push(...independenceDiagnostics.artifacts);

  // ============================================================================
  // PHASE 5: INFLUENTIAL OBSERVATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying influential observations');
  const influentialObservations = await ctx.task(influentialObservationsTask, {
    residuals: residualComputation.residuals,
    data,
    model,
    outputDir
  });

  artifacts.push(...influentialObservations.artifacts);

  // ============================================================================
  // PHASE 6: FAILURE PATTERN IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying failure patterns');
  const failurePatterns = await ctx.task(failurePatternIdentificationTask, {
    residuals: residualComputation.residuals,
    distributionalDiagnostics,
    structuralDiagnostics,
    independenceDiagnostics,
    influentialObservations,
    outputDir
  });

  artifacts.push(...failurePatterns.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating improvement recommendations');
  const improvementRecommendations = await ctx.task(residualImprovementTask, {
    failurePatterns: failurePatterns.patterns,
    diagnostics: {
      distributional: distributionalDiagnostics.results,
      structural: structuralDiagnostics.results,
      independence: independenceDiagnostics.results
    },
    model,
    outputDir
  });

  artifacts.push(...improvementRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND CONCLUSIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing residual analysis');
  const synthesis = await ctx.task(residualSynthesisTask, {
    residualComputation,
    distributionalDiagnostics,
    structuralDiagnostics,
    independenceDiagnostics,
    influentialObservations,
    failurePatterns,
    improvementRecommendations,
    targetDiagnosticQuality,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const qualityMet = synthesis.diagnosticQualityScore >= targetDiagnosticQuality;

  // Breakpoint: Review residual diagnostics
  await ctx.breakpoint({
    question: `Residual diagnostics complete. Quality: ${synthesis.diagnosticQualityScore}/${targetDiagnosticQuality}. ${qualityMet ? 'Quality target met!' : 'Additional analysis may be needed.'} Review diagnostics?`,
    title: 'Residual Diagnostic Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        residualType: residualComputation.residualType,
        normalityViolation: distributionalDiagnostics.results.normalityViolation,
        heteroscedasticity: structuralDiagnostics.results.heteroscedasticity,
        autocorrelation: independenceDiagnostics.results.autocorrelation,
        influentialPoints: influentialObservations.influentialCount,
        failurePatternsFound: failurePatterns.patterns.length,
        diagnosticQualityScore: synthesis.diagnosticQualityScore,
        qualityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    residualAnalysis: {
      residuals: residualComputation.residuals,
      summary: residualComputation.summary
    },
    diagnostics: [
      { type: 'distributional', results: distributionalDiagnostics.results },
      { type: 'structural', results: structuralDiagnostics.results },
      { type: 'independence', results: independenceDiagnostics.results },
      { type: 'influence', results: influentialObservations.results }
    ],
    modelFailures: failurePatterns.patterns,
    improvements: improvementRecommendations.recommendations,
    diagnosticQualityScore: synthesis.diagnosticQualityScore,
    qualityMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/residual-diagnostic-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Residual Computation
export const residualComputationTask = defineTask('residual-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute residuals',
  agent: {
    name: 'residual-calculator',
    prompt: {
      role: 'statistical analyst',
      task: 'Compute and characterize model residuals',
      context: args,
      instructions: [
        'Compute raw residuals:',
        '  - e_i = y_i - ŷ_i',
        'Compute standardized residuals:',
        '  - r_i = e_i / s',
        'Compute studentized residuals:',
        '  - t_i = e_i / (s√(1-h_ii))',
        'Compute other residual types as appropriate:',
        '  - Pearson residuals (for GLMs)',
        '  - Deviance residuals',
        '  - Martingale residuals (survival)',
        'Compute residual summary statistics:',
        '  - Mean (should be ~0)',
        '  - Variance',
        '  - Range and extremes',
        'Save residuals to output directory'
      ],
      outputFormat: 'JSON with residuals (raw, standardized, studentized), residualType, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['residuals', 'residualType', 'summary', 'artifacts'],
      properties: {
        residuals: {
          type: 'object',
          properties: {
            raw: { type: 'array', items: { type: 'number' } },
            standardized: { type: 'array', items: { type: 'number' } },
            studentized: { type: 'array', items: { type: 'number' } }
          }
        },
        residualType: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            variance: { type: 'number' },
            min: { type: 'number' },
            max: { type: 'number' },
            n: { type: 'number' }
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
  labels: ['agent', 'residual-diagnostic', 'computation']
}));

// Task 2: Distributional Diagnostics
export const distributionalDiagnosticsTask = defineTask('distributional-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform distributional diagnostics',
  agent: {
    name: 'distribution-diagnostician',
    prompt: {
      role: 'statistical diagnostician',
      task: 'Check distributional assumptions using residuals',
      context: args,
      instructions: [
        'Check normality:',
        '  - Q-Q plot inspection',
        '  - Shapiro-Wilk test',
        '  - Kolmogorov-Smirnov test',
        '  - Histogram inspection',
        'Check for specific violations:',
        '  - Heavy tails (leptokurtosis)',
        '  - Light tails (platykurtosis)',
        '  - Skewness',
        '  - Multimodality',
        'For GLMs check appropriate distribution:',
        '  - Poisson: dispersion parameter',
        '  - Binomial: overdispersion',
        'Document severity of violations',
        'Save distributional diagnostics to output directory'
      ],
      outputFormat: 'JSON with results (normalityViolation, tests, violations), plots, severity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'severity', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            normalityViolation: { type: 'boolean' },
            tests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test: { type: 'string' },
                  statistic: { type: 'number' },
                  pValue: { type: 'number' }
                }
              }
            },
            violations: { type: 'array', items: { type: 'string' } }
          }
        },
        plots: { type: 'array', items: { type: 'string' } },
        severity: { type: 'string', enum: ['none', 'mild', 'moderate', 'severe'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'distributional']
}));

// Task 3: Structural Diagnostics
export const structuralDiagnosticsTask = defineTask('structural-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform structural diagnostics',
  agent: {
    name: 'structural-diagnostician',
    prompt: {
      role: 'regression diagnostician',
      task: 'Check structural assumptions using residual patterns',
      context: args,
      instructions: [
        'Check for heteroscedasticity:',
        '  - Residuals vs. fitted values plot',
        '  - Residuals vs. each predictor',
        '  - Breusch-Pagan test',
        '  - White test',
        'Check for non-linearity:',
        '  - Residuals vs. fitted (curvature?)',
        '  - Component-residual plots',
        '  - RESET test',
        'Check for missing variables:',
        '  - Residuals vs. omitted variables',
        '  - Added variable plots',
        'Identify systematic patterns:',
        '  - Funnel shape (heteroscedasticity)',
        '  - Curved pattern (non-linearity)',
        '  - Clustering',
        'Save structural diagnostics to output directory'
      ],
      outputFormat: 'JSON with results (heteroscedasticity, nonlinearity, tests, patterns), plots, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'recommendations', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            heteroscedasticity: { type: 'boolean' },
            nonlinearity: { type: 'boolean' },
            tests: { type: 'array', items: { type: 'object' } },
            patterns: { type: 'array', items: { type: 'string' } }
          }
        },
        plots: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'structural']
}));

// Task 4: Independence Diagnostics
export const independenceDiagnosticsTask = defineTask('independence-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check independence assumptions',
  agent: {
    name: 'independence-diagnostician',
    prompt: {
      role: 'time series and spatial diagnostician',
      task: 'Check independence of residuals',
      context: args,
      instructions: [
        'Check for autocorrelation:',
        '  - Residuals vs. observation order',
        '  - ACF and PACF plots',
        '  - Durbin-Watson test',
        '  - Ljung-Box test',
        'Check for spatial correlation:',
        '  - Residual map (if applicable)',
        '  - Moran\'s I test',
        'Check for clustering:',
        '  - Residuals vs. group indicators',
        '  - Intraclass correlation',
        'Identify violation patterns:',
        '  - Positive autocorrelation (runs)',
        '  - Negative autocorrelation (alternating)',
        '  - Clustered residuals',
        'Save independence diagnostics to output directory'
      ],
      outputFormat: 'JSON with results (autocorrelation, spatialCorrelation, clustering, tests), patterns, implications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'implications', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            autocorrelation: { type: 'boolean' },
            spatialCorrelation: { type: 'boolean' },
            clustering: { type: 'boolean' },
            tests: { type: 'array', items: { type: 'object' } }
          }
        },
        patterns: { type: 'array', items: { type: 'string' } },
        implications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'independence']
}));

// Task 5: Influential Observations
export const influentialObservationsTask = defineTask('influential-observations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify influential observations',
  agent: {
    name: 'influence-analyst',
    prompt: {
      role: 'robust statistics specialist',
      task: 'Identify influential and outlying observations',
      context: args,
      instructions: [
        'Identify outliers:',
        '  - Studentized residuals > 2 or 3',
        '  - Standardized residuals > 2 or 3',
        'Identify high leverage points:',
        '  - Hat values h_ii',
        '  - Leverage > 2(p+1)/n',
        'Identify influential points:',
        '  - Cook\'s distance',
        '  - DFBETAS (parameter influence)',
        '  - DFFITS (prediction influence)',
        'Distinguish:',
        '  - Outliers (unusual Y)',
        '  - Leverage points (unusual X)',
        '  - Influential points (affect estimates)',
        'Assess impact of influential points',
        'Save influential observations to output directory'
      ],
      outputFormat: 'JSON with results (outliers, leveragePoints, influentialPoints), influentialCount, impact, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'influentialCount', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            outliers: { type: 'array', items: { type: 'object' } },
            leveragePoints: { type: 'array', items: { type: 'object' } },
            influentialPoints: { type: 'array', items: { type: 'object' } }
          }
        },
        influentialCount: { type: 'number' },
        impact: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'influential']
}));

// Task 6: Failure Pattern Identification
export const failurePatternIdentificationTask = defineTask('failure-pattern-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify failure patterns',
  agent: {
    name: 'failure-analyst',
    prompt: {
      role: 'model failure analyst',
      task: 'Identify systematic patterns of model failure',
      context: args,
      instructions: [
        'Synthesize diagnostic findings to identify failure patterns:',
        '  - Where does the model fail systematically?',
        '  - For which observations/regions?',
        '  - Under what conditions?',
        'Characterize failure types:',
        '  - Systematic over/under-prediction',
        '  - Failures at extremes',
        '  - Failures for subgroups',
        '  - Failures in specific regions of X space',
        'Link failures to model assumptions:',
        '  - Which assumption violation causes this?',
        '  - What model limitation is exposed?',
        'Prioritize failures by importance',
        'Save failure patterns to output directory'
      ],
      outputFormat: 'JSON with patterns (array with description, location, type, assumptionLink, priority), summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'summary', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              location: { type: 'string' },
              type: { type: 'string' },
              assumptionLink: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'failure-patterns']
}));

// Task 7: Residual Improvement Recommendations
export const residualImprovementTask = defineTask('residual-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate improvement recommendations',
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'model improvement specialist',
      task: 'Generate model improvements based on residual diagnostics',
      context: args,
      instructions: [
        'For each failure pattern, recommend improvements:',
        '  - Heteroscedasticity → Robust SE, WLS, transform Y',
        '  - Non-linearity → Add polynomial/spline terms',
        '  - Non-normality → Transform Y, GLM, robust methods',
        '  - Autocorrelation → Time series model, GEE',
        '  - Missing variable → Add variable, proxy',
        '  - Outliers → Robust regression, investigate',
        'Prioritize improvements:',
        '  - By impact on conclusions',
        '  - By ease of implementation',
        'Suggest model alternatives',
        'Recommend validation approach',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array with failure, improvement, implementation, impact), alternatives, validationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'validationPlan', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failure: { type: 'string' },
              improvement: { type: 'string' },
              implementation: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              difficulty: { type: 'string', enum: ['easy', 'moderate', 'difficult'] }
            }
          }
        },
        alternatives: { type: 'array', items: { type: 'string' } },
        validationPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'improvements']
}));

// Task 8: Residual Synthesis
export const residualSynthesisTask = defineTask('residual-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize residual analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior statistician',
      task: 'Synthesize residual diagnostic findings',
      context: args,
      instructions: [
        'Summarize all diagnostic findings:',
        '  - Distributional issues',
        '  - Structural issues',
        '  - Independence issues',
        '  - Influential observations',
        '  - Failure patterns',
        'Assess diagnostic quality (0-100):',
        '  - Were all relevant diagnostics performed?',
        '  - Were patterns clearly identified?',
        '  - Are recommendations actionable?',
        'State overall model adequacy:',
        '  - Adequate for purpose?',
        '  - Needs improvement?',
        '  - Fundamentally flawed?',
        'Provide key conclusions',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, diagnosticQualityScore, modelAdequacy, keyConclusions, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'diagnosticQualityScore', 'modelAdequacy', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        diagnosticQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        modelAdequacy: { type: 'string', enum: ['adequate', 'needs-improvement', 'inadequate'] },
        keyConclusions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'residual-diagnostic', 'synthesis']
}));
