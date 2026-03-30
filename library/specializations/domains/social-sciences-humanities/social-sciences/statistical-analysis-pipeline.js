/**
 * @process social-sciences/statistical-analysis-pipeline
 * @description Perform quantitative data analysis including descriptive statistics, hypothesis testing, regression modeling, and robustness checks using SPSS, Stata, R, or Python
 * @inputs { dataPath: string, researchQuestions: array, hypotheses: array, analysisType: string, outputDir: string }
 * @outputs { success: boolean, analysisResults: object, robustnessChecks: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    researchQuestions = [],
    hypotheses = [],
    analysisType = 'regression',
    outputDir = 'statistical-analysis-output',
    software = 'R',
    significanceLevel = 0.05
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Statistical Analysis Pipeline');

  // ============================================================================
  // PHASE 1: DATA PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing data for analysis');
  const dataPreparation = await ctx.task(dataPreparationTask, {
    dataPath,
    analysisType,
    outputDir
  });

  artifacts.push(...dataPreparation.artifacts);

  // ============================================================================
  // PHASE 2: DESCRIPTIVE STATISTICS
  // ============================================================================

  ctx.log('info', 'Phase 2: Computing descriptive statistics');
  const descriptiveStats = await ctx.task(descriptiveStatisticsTask, {
    dataPath,
    dataPreparation,
    outputDir
  });

  artifacts.push(...descriptiveStats.artifacts);

  // ============================================================================
  // PHASE 3: ASSUMPTION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing statistical assumptions');
  const assumptionTesting = await ctx.task(assumptionTestingTask, {
    dataPath,
    analysisType,
    dataPreparation,
    outputDir
  });

  artifacts.push(...assumptionTesting.artifacts);

  // ============================================================================
  // PHASE 4: HYPOTHESIS TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting hypothesis tests');
  const hypothesisTesting = await ctx.task(hypothesisTestingTask, {
    dataPath,
    hypotheses,
    significanceLevel,
    assumptionTesting,
    outputDir
  });

  artifacts.push(...hypothesisTesting.artifacts);

  // ============================================================================
  // PHASE 5: MAIN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting main statistical analysis');
  const mainAnalysis = await ctx.task(mainStatisticalAnalysisTask, {
    dataPath,
    researchQuestions,
    analysisType,
    assumptionTesting,
    software,
    outputDir
  });

  artifacts.push(...mainAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: ROBUSTNESS CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting robustness checks');
  const robustnessChecks = await ctx.task(statisticalRobustnessTask, {
    mainAnalysis,
    analysisType,
    outputDir
  });

  artifacts.push(...robustnessChecks.artifacts);

  // ============================================================================
  // PHASE 7: RESULTS INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Interpreting results');
  const resultsInterpretation = await ctx.task(resultsInterpretationTask, {
    descriptiveStats,
    hypothesisTesting,
    mainAnalysis,
    robustnessChecks,
    outputDir
  });

  artifacts.push(...resultsInterpretation.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Scoring analysis quality');
  const qualityScore = await ctx.task(statisticalAnalysisQualityScoringTask, {
    dataPreparation,
    descriptiveStats,
    assumptionTesting,
    hypothesisTesting,
    mainAnalysis,
    robustnessChecks,
    resultsInterpretation,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const analysisScore = qualityScore.overallScore;
  const qualityMet = analysisScore >= 80;

  // Breakpoint: Review statistical analysis
  await ctx.breakpoint({
    question: `Statistical analysis complete. Quality score: ${analysisScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Statistical Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        analysisScore,
        qualityMet,
        analysisType,
        software,
        keyFindings: mainAnalysis.keyFindings
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: analysisScore,
    qualityMet,
    analysisResults: {
      descriptiveStats: descriptiveStats.summary,
      hypothesisTests: hypothesisTesting.results,
      mainAnalysis: mainAnalysis.results,
      keyFindings: mainAnalysis.keyFindings
    },
    robustnessChecks: {
      checks: robustnessChecks.checks,
      robustnessConfirmed: robustnessChecks.confirmed
    },
    interpretation: resultsInterpretation.interpretation,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/statistical-analysis-pipeline',
      timestamp: startTime,
      software,
      outputDir
    }
  };
}

// Task 1: Data Preparation
export const dataPreparationTask = defineTask('data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare data for analysis',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'statistical data analyst',
      task: 'Prepare and clean data for statistical analysis',
      context: args,
      instructions: [
        'Load and inspect data structure',
        'Handle missing data (listwise, pairwise, imputation)',
        'Identify and handle outliers',
        'Recode and transform variables as needed',
        'Create derived variables and indices',
        'Verify variable types and levels',
        'Create analysis dataset',
        'Document all data preparation steps',
        'Generate data preparation report'
      ],
      outputFormat: 'JSON with preparationSteps, missingDataHandling, variableTransformations, datasetInfo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preparationSteps', 'datasetInfo', 'artifacts'],
      properties: {
        preparationSteps: { type: 'array', items: { type: 'string' } },
        missingDataHandling: { type: 'object' },
        outlierHandling: { type: 'object' },
        variableTransformations: { type: 'array' },
        datasetInfo: {
          type: 'object',
          properties: {
            rows: { type: 'number' },
            columns: { type: 'number' },
            variables: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'statistical-analysis', 'data-preparation']
}));

// Task 2: Descriptive Statistics
export const descriptiveStatisticsTask = defineTask('descriptive-statistics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute descriptive statistics',
  agent: {
    name: 'descriptive-analyst',
    prompt: {
      role: 'statistical analyst',
      task: 'Compute comprehensive descriptive statistics',
      context: args,
      instructions: [
        'Calculate measures of central tendency (mean, median, mode)',
        'Calculate measures of dispersion (SD, variance, range, IQR)',
        'Generate frequency distributions for categorical variables',
        'Calculate percentiles and quartiles',
        'Compute bivariate correlations',
        'Generate crosstabulations for categorical relationships',
        'Create visualizations (histograms, box plots, scatter plots)',
        'Generate descriptive statistics tables',
        'Document descriptive findings'
      ],
      outputFormat: 'JSON with summary, centralTendency, dispersion, correlations, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        centralTendency: { type: 'object' },
        dispersion: { type: 'object' },
        frequencies: { type: 'object' },
        correlations: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'descriptive']
}));

// Task 3: Assumption Testing
export const assumptionTestingTask = defineTask('assumption-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test statistical assumptions',
  agent: {
    name: 'assumption-tester',
    prompt: {
      role: 'statistical methodologist',
      task: 'Test assumptions for planned statistical analyses',
      context: args,
      instructions: [
        'Test normality (Shapiro-Wilk, Kolmogorov-Smirnov, Q-Q plots)',
        'Test homogeneity of variance (Levene, Bartlett)',
        'Test linearity for regression',
        'Test multicollinearity (VIF, tolerance)',
        'Test independence of observations',
        'Test homoscedasticity',
        'Identify violations and their severity',
        'Recommend remedial actions for violations',
        'Generate assumption testing report'
      ],
      outputFormat: 'JSON with tests, violations, remedialActions, assumptionsMet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'assumptionsMet', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              test: { type: 'string' },
              result: { type: 'string' },
              met: { type: 'boolean' }
            }
          }
        },
        violations: { type: 'array', items: { type: 'string' } },
        remedialActions: { type: 'array', items: { type: 'string' } },
        assumptionsMet: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'assumptions']
}));

// Task 4: Hypothesis Testing
export const hypothesisTestingTask = defineTask('hypothesis-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct hypothesis tests',
  agent: {
    name: 'hypothesis-tester',
    prompt: {
      role: 'statistical analyst',
      task: 'Conduct formal hypothesis tests for research hypotheses',
      context: args,
      instructions: [
        'Formulate null and alternative hypotheses',
        'Select appropriate statistical tests',
        'Conduct t-tests, ANOVA, chi-square as appropriate',
        'Calculate effect sizes (Cohen d, eta-squared, odds ratios)',
        'Calculate confidence intervals',
        'Apply corrections for multiple comparisons if needed',
        'Report p-values and test statistics',
        'Determine statistical significance',
        'Generate hypothesis testing report'
      ],
      outputFormat: 'JSON with results, testStatistics, effectSizes, confidenceIntervals, conclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              test: { type: 'string' },
              testStatistic: { type: 'number' },
              pValue: { type: 'number' },
              effectSize: { type: 'number' },
              significant: { type: 'boolean' }
            }
          }
        },
        testStatistics: { type: 'object' },
        effectSizes: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        multipleComparisonsCorrection: { type: 'string' },
        conclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'hypothesis-testing']
}));

// Task 5: Main Statistical Analysis
export const mainStatisticalAnalysisTask = defineTask('main-statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct main statistical analysis',
  agent: {
    name: 'statistical-modeler',
    prompt: {
      role: 'senior statistical analyst',
      task: 'Conduct main statistical analysis based on research design',
      context: args,
      instructions: [
        'Build primary statistical model (regression, ANOVA, etc.)',
        'Estimate model parameters',
        'Assess model fit (R-squared, AIC, BIC)',
        'Interpret coefficients and their significance',
        'Conduct post-hoc tests if appropriate',
        'Generate diagnostic plots',
        'Create results tables formatted for publication',
        'Document key findings',
        'Generate analysis code and output'
      ],
      outputFormat: 'JSON with results, modelFit, coefficients, keyFindings, tables, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'keyFindings', 'artifacts'],
      properties: {
        results: { type: 'object' },
        modelFit: {
          type: 'object',
          properties: {
            rSquared: { type: 'number' },
            adjustedRSquared: { type: 'number' },
            aic: { type: 'number' },
            bic: { type: 'number' }
          }
        },
        coefficients: { type: 'object' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        diagnosticPlots: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'main-analysis']
}));

// Task 6: Robustness Checks
export const statisticalRobustnessTask = defineTask('statistical-robustness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct robustness checks',
  agent: {
    name: 'robustness-analyst',
    prompt: {
      role: 'statistical methodologist',
      task: 'Conduct robustness and sensitivity analyses',
      context: args,
      instructions: [
        'Test alternative model specifications',
        'Conduct outlier sensitivity analysis',
        'Test different covariate sets',
        'Apply robust standard errors if appropriate',
        'Conduct subgroup analyses',
        'Test alternative variable operationalizations',
        'Assess influence of missing data handling',
        'Compare parametric vs non-parametric results',
        'Document robustness of main findings'
      ],
      outputFormat: 'JSON with checks, alternativeSpecs, sensitivityResults, confirmed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'confirmed', 'artifacts'],
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              result: { type: 'string' },
              consistent: { type: 'boolean' }
            }
          }
        },
        alternativeSpecs: { type: 'array' },
        sensitivityResults: { type: 'object' },
        confirmed: { type: 'boolean' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'robustness']
}));

// Task 7: Results Interpretation
export const resultsInterpretationTask = defineTask('results-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interpret results',
  agent: {
    name: 'results-interpreter',
    prompt: {
      role: 'senior research methodologist',
      task: 'Interpret statistical results in research context',
      context: args,
      instructions: [
        'Summarize key statistical findings',
        'Interpret effect sizes in practical terms',
        'Relate findings to research questions and hypotheses',
        'Discuss statistical vs practical significance',
        'Identify limitations of the analysis',
        'Suggest implications for theory and practice',
        'Recommend directions for future research',
        'Draft results narrative for publication',
        'Generate interpretation report'
      ],
      outputFormat: 'JSON with interpretation, keyFindings, effectInterpretation, limitations, implications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'artifacts'],
      properties: {
        interpretation: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        effectInterpretation: { type: 'object' },
        statisticalVsPractical: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        implications: { type: 'object' },
        futureResearch: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'interpretation']
}));

// Task 8: Quality Scoring
export const statisticalAnalysisQualityScoringTask = defineTask('statistical-analysis-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'analysis-quality-reviewer',
    prompt: {
      role: 'senior statistical methodologist',
      task: 'Assess statistical analysis quality and rigor',
      context: args,
      instructions: [
        'Evaluate data preparation thoroughness (weight: 10%)',
        'Assess descriptive statistics completeness (weight: 10%)',
        'Evaluate assumption testing rigor (weight: 15%)',
        'Assess hypothesis testing appropriateness (weight: 15%)',
        'Evaluate main analysis rigor (weight: 20%)',
        'Assess robustness check comprehensiveness (weight: 15%)',
        'Evaluate interpretation quality (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            dataPreparation: { type: 'number' },
            descriptiveStats: { type: 'number' },
            assumptionTesting: { type: 'number' },
            hypothesisTesting: { type: 'number' },
            mainAnalysis: { type: 'number' },
            robustnessChecks: { type: 'number' },
            interpretation: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical-analysis', 'quality-scoring']
}));
