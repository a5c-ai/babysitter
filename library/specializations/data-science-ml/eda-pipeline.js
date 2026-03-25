/**
 * @process data-science-ml/eda-pipeline
 * @description Automated Exploratory Data Analysis (EDA) pipeline with quality gates
 * @inputs { dataPath: string, targetDataQuality: number, generateVisualizations: boolean }
 * @outputs { success: boolean, dataQualityScore: number, insights: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    targetDataQuality = 80,
    generateVisualizations = true,
    outputDir = 'eda-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Data Loading and Initial Validation
  ctx.log('info', 'Starting EDA pipeline: Data loading and validation');
  const dataLoadResult = await ctx.task(dataLoadingTask, {
    dataPath,
    outputDir
  });

  if (!dataLoadResult.success) {
    return {
      success: false,
      error: 'Data loading failed',
      details: dataLoadResult,
      metadata: { processId: 'data-science-ml/eda-pipeline', timestamp: startTime }
    };
  }

  artifacts.push(...dataLoadResult.artifacts);

  // Task 2: Statistical Summary Analysis
  ctx.log('info', 'Generating statistical summaries');
  const statsSummary = await ctx.task(statisticalSummaryTask, {
    dataPath,
    dataInfo: dataLoadResult.dataInfo,
    outputDir
  });

  artifacts.push(...statsSummary.artifacts);

  // Task 3: Missing Value Assessment
  ctx.log('info', 'Analyzing missing values');
  const missingValueAnalysis = await ctx.task(missingValueAnalysisTask, {
    dataPath,
    dataInfo: dataLoadResult.dataInfo,
    outputDir
  });

  artifacts.push(...missingValueAnalysis.artifacts);

  // Task 4: Distribution Analysis
  ctx.log('info', 'Analyzing feature distributions');
  const distributionAnalysis = await ctx.task(distributionAnalysisTask, {
    dataPath,
    dataInfo: dataLoadResult.dataInfo,
    generateVisualizations,
    outputDir
  });

  artifacts.push(...distributionAnalysis.artifacts);

  // Task 5: Correlation Analysis
  ctx.log('info', 'Computing feature correlations');
  const correlationAnalysis = await ctx.task(correlationAnalysisTask, {
    dataPath,
    dataInfo: dataLoadResult.dataInfo,
    generateVisualizations,
    outputDir
  });

  artifacts.push(...correlationAnalysis.artifacts);

  // Task 6: Outlier Detection
  ctx.log('info', 'Detecting outliers');
  const outlierDetection = await ctx.task(outlierDetectionTask, {
    dataPath,
    dataInfo: dataLoadResult.dataInfo,
    outputDir
  });

  artifacts.push(...outlierDetection.artifacts);

  // Task 7: Data Quality Scoring
  ctx.log('info', 'Evaluating overall data quality');
  const dataQualityResult = await ctx.task(dataQualityScoringTask, {
    dataLoadResult,
    statsSummary,
    missingValueAnalysis,
    distributionAnalysis,
    correlationAnalysis,
    outlierDetection,
    targetDataQuality,
    outputDir
  });

  artifacts.push(...dataQualityResult.artifacts);

  const dataQualityScore = dataQualityResult.score;
  const qualityMet = dataQualityScore >= targetDataQuality;

  // Task 8: Generate Comprehensive EDA Report
  ctx.log('info', 'Generating comprehensive EDA report');
  const edaReport = await ctx.task(edaReportGenerationTask, {
    dataPath,
    dataLoadResult,
    statsSummary,
    missingValueAnalysis,
    distributionAnalysis,
    correlationAnalysis,
    outlierDetection,
    dataQualityResult,
    outputDir
  });

  artifacts.push(...edaReport.artifacts);

  // Breakpoint: Review EDA results
  await ctx.breakpoint({
    question: `EDA complete. Data quality: ${dataQualityScore}/${targetDataQuality}. ${qualityMet ? 'Quality target met!' : 'Quality target not met.'} Review findings?`,
    title: 'EDA Pipeline Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        dataQualityScore,
        targetDataQuality,
        qualityMet,
        totalRows: dataLoadResult.dataInfo.rowCount,
        totalColumns: dataLoadResult.dataInfo.columnCount,
        missingValuePercentage: missingValueAnalysis.overallMissingPercentage,
        outlierCount: outlierDetection.totalOutliers
      }
    }
  });

  // Task 9: Generate Action Items (if quality not met)
  let actionItems = [];
  if (!qualityMet) {
    ctx.log('warn', 'Data quality below target - generating recommendations');
    const recommendations = await ctx.task(recommendationGenerationTask, {
      dataQualityResult,
      missingValueAnalysis,
      outlierDetection,
      distributionAnalysis,
      targetDataQuality,
      outputDir
    });
    actionItems = recommendations.actionItems;
    artifacts.push(...recommendations.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dataQualityScore,
    targetDataQuality,
    qualityMet,
    insights: {
      dataShape: {
        rows: dataLoadResult.dataInfo.rowCount,
        columns: dataLoadResult.dataInfo.columnCount
      },
      dataTypes: dataLoadResult.dataInfo.columnTypes,
      missingValues: {
        totalMissing: missingValueAnalysis.totalMissingValues,
        percentage: missingValueAnalysis.overallMissingPercentage,
        columnsWithMissing: missingValueAnalysis.columnsWithMissing
      },
      outliers: {
        totalOutliers: outlierDetection.totalOutliers,
        outliersByFeature: outlierDetection.outliersByFeature
      },
      correlations: {
        highCorrelations: correlationAnalysis.highCorrelations,
        multicollinearityWarnings: correlationAnalysis.multicollinearityWarnings
      },
      distributions: {
        skewedFeatures: distributionAnalysis.skewedFeatures,
        normalFeatures: distributionAnalysis.normalFeatures
      }
    },
    artifacts,
    actionItems,
    duration,
    metadata: {
      processId: 'data-science-ml/eda-pipeline',
      timestamp: startTime,
      dataPath,
      outputDir
    }
  };
}

// Task 1: Data Loading and Initial Validation
export const dataLoadingTask = defineTask('data-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load and validate dataset',
  agent: {
    name: 'data-loader',
    prompt: {
      role: 'data engineer',
      task: 'Load dataset and perform initial validation',
      context: args,
      instructions: [
        'Load data from provided path (CSV, JSON, Parquet, etc.)',
        'Validate file format and readability',
        'Extract metadata: row count, column count, column names, data types',
        'Check for basic schema issues',
        'Generate data sample (first 10 rows)',
        'Save data info to output directory'
      ],
      outputFormat: 'JSON with success, dataInfo, artifacts, errors'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dataInfo', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dataInfo: {
          type: 'object',
          properties: {
            rowCount: { type: 'number' },
            columnCount: { type: 'number' },
            columnNames: { type: 'array', items: { type: 'string' } },
            columnTypes: { type: 'object' },
            memoryUsage: { type: 'string' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'data-loading', 'validation']
}));

// Task 2: Statistical Summary Analysis
export const statisticalSummaryTask = defineTask('statistical-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate statistical summaries',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'data scientist',
      task: 'Compute comprehensive statistical summaries for all features',
      context: args,
      instructions: [
        'For numerical features: mean, median, std, min, max, quartiles, range, variance',
        'For categorical features: unique values, value counts, mode, cardinality',
        'Compute percentiles (5th, 25th, 50th, 75th, 95th)',
        'Identify constant features (zero variance)',
        'Generate summary statistics table',
        'Save results to output directory'
      ],
      outputFormat: 'JSON with numerical summaries, categorical summaries, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['numericalSummary', 'categoricalSummary', 'artifacts'],
      properties: {
        numericalSummary: { type: 'object' },
        categoricalSummary: { type: 'object' },
        constantFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'statistics', 'summary']
}));

// Task 3: Missing Value Analysis
export const missingValueAnalysisTask = defineTask('missing-value-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze missing values',
  agent: {
    name: 'data-quality-analyst',
    prompt: {
      role: 'data quality engineer',
      task: 'Analyze patterns and extent of missing values',
      context: args,
      instructions: [
        'Count missing values per column',
        'Calculate missing percentage per column',
        'Identify columns with >50% missing values',
        'Analyze missing value patterns (MCAR, MAR, MNAR)',
        'Generate missing value matrix visualization if requested',
        'Recommend imputation strategies',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with missing value counts, patterns, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMissingValues', 'overallMissingPercentage', 'columnsWithMissing', 'artifacts'],
      properties: {
        totalMissingValues: { type: 'number' },
        overallMissingPercentage: { type: 'number' },
        columnsWithMissing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              missingCount: { type: 'number' },
              missingPercentage: { type: 'number' }
            }
          }
        },
        missingPatterns: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'missing-values', 'data-quality']
}));

// Task 4: Distribution Analysis
export const distributionAnalysisTask = defineTask('distribution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature distributions',
  agent: {
    name: 'distribution-analyst',
    prompt: {
      role: 'data scientist',
      task: 'Analyze distributions of numerical and categorical features',
      context: args,
      instructions: [
        'For numerical features: compute skewness, kurtosis, normality tests',
        'Identify highly skewed features (|skewness| > 1)',
        'Test for normality using Shapiro-Wilk or Kolmogorov-Smirnov',
        'For categorical features: analyze value distributions, identify imbalances',
        'Generate histograms, box plots, density plots if visualizations enabled',
        'Identify features requiring transformation',
        'Save analysis and visualizations to output directory'
      ],
      outputFormat: 'JSON with distribution metrics, skewed features, normal features, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionMetrics', 'skewedFeatures', 'normalFeatures', 'artifacts'],
      properties: {
        distributionMetrics: { type: 'object' },
        skewedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              skewness: { type: 'number' },
              kurtosis: { type: 'number' }
            }
          }
        },
        normalFeatures: { type: 'array', items: { type: 'string' } },
        transformationRecommendations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'distributions', 'statistics']
}));

// Task 5: Correlation Analysis
export const correlationAnalysisTask = defineTask('correlation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute feature correlations',
  agent: {
    name: 'correlation-analyst',
    prompt: {
      role: 'data scientist',
      task: 'Analyze correlations between features',
      context: args,
      instructions: [
        'Compute Pearson correlation matrix for numerical features',
        'Compute Spearman correlation for monotonic relationships',
        'Identify highly correlated feature pairs (|correlation| > 0.8)',
        'Flag multicollinearity issues (VIF analysis if applicable)',
        'For categorical features: compute Cramér\'s V or Chi-square',
        'Generate correlation heatmap if visualizations enabled',
        'Recommend feature removal for redundant features',
        'Save correlation matrices and visualizations'
      ],
      outputFormat: 'JSON with correlation matrices, high correlations, multicollinearity warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['correlationMatrix', 'highCorrelations', 'artifacts'],
      properties: {
        correlationMatrix: { type: 'object' },
        highCorrelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature1: { type: 'string' },
              feature2: { type: 'string' },
              correlation: { type: 'number' },
              method: { type: 'string' }
            }
          }
        },
        multicollinearityWarnings: { type: 'array', items: { type: 'string' } },
        vifScores: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'correlations', 'multicollinearity']
}));

// Task 6: Outlier Detection
export const outlierDetectionTask = defineTask('outlier-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect outliers',
  agent: {
    name: 'outlier-detector',
    prompt: {
      role: 'data quality engineer',
      task: 'Detect outliers using multiple methods',
      context: args,
      instructions: [
        'Apply IQR method (Q1 - 1.5*IQR, Q3 + 1.5*IQR)',
        'Apply Z-score method (|z| > 3)',
        'Apply Isolation Forest for multivariate outliers',
        'Count outliers per feature',
        'Identify extreme outliers (>3 IQR or |z| > 4)',
        'Generate box plots highlighting outliers if visualizations enabled',
        'Recommend outlier handling strategies (remove, cap, investigate)',
        'Save outlier analysis to output directory'
      ],
      outputFormat: 'JSON with outlier counts, outlier indices, methods used, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalOutliers', 'outliersByFeature', 'artifacts'],
      properties: {
        totalOutliers: { type: 'number' },
        outliersByFeature: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              iqrOutliers: { type: 'number' },
              zscoreOutliers: { type: 'number' },
              extremeOutliers: { type: 'number' }
            }
          }
        },
        multivariteOutliers: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'outliers', 'data-quality']
}));

// Task 7: Data Quality Scoring
export const dataQualityScoringTask = defineTask('data-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score overall data quality',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'data quality engineer',
      task: 'Assess overall data quality and assign score 0-100',
      context: args,
      instructions: [
        'Evaluate data completeness (missing values impact)',
        'Assess data consistency (distributions, outliers)',
        'Check data validity (schema compliance, type correctness)',
        'Evaluate data reliability (correlation structure)',
        'Calculate weighted quality score 0-100',
        'Provide detailed breakdown of score components',
        'Identify critical quality issues requiring immediate attention',
        'Generate quality scorecard'
      ],
      outputFormat: 'JSON with overall score, component scores, critical issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'componentScores', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            consistency: { type: 'number' },
            validity: { type: 'number' },
            reliability: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        passedChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'quality-scoring', 'validation']
}));

// Task 8: EDA Report Generation
export const edaReportGenerationTask = defineTask('eda-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive EDA report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'technical writer and data scientist',
      task: 'Generate comprehensive, executive-ready EDA report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Include dataset overview section',
        'Summarize statistical findings',
        'Highlight data quality issues and concerns',
        'Document missing value patterns',
        'Present distribution insights',
        'Show correlation findings',
        'Report outlier analysis',
        'Include visualizations (if generated)',
        'Provide actionable recommendations',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with report path, key findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'reporting', 'documentation']
}));

// Task 9: Recommendation Generation (for quality issues)
export const recommendationGenerationTask = defineTask('recommendation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate data quality improvement recommendations',
  agent: {
    name: 'recommendation-engine',
    prompt: {
      role: 'senior data engineer',
      task: 'Generate prioritized action items to improve data quality',
      context: args,
      instructions: [
        'Analyze all quality issues identified',
        'Prioritize issues by severity and impact',
        'Generate specific, actionable recommendations',
        'Provide code snippets or examples where applicable',
        'Estimate effort for each recommendation',
        'Suggest data cleaning pipeline improvements',
        'Recommend feature engineering strategies',
        'Create action item checklist',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with prioritized action items, code examples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              codeExample: { type: 'string' }
            }
          }
        },
        pipelineImprovements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'eda', 'recommendations', 'action-items']
}));
