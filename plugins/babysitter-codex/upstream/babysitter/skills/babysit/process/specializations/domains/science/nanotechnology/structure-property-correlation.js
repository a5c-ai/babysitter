/**
 * @process specializations/domains/science/nanotechnology/structure-property-correlation
 * @description Structure-Property Correlation Analysis - Systematically correlate nanomaterial structural
 * features (size, shape, composition, surface chemistry) with measured properties (optical, electronic,
 * magnetic, catalytic) through statistical analysis, machine learning pattern identification, and
 * predictive model development with validation loops.
 * @inputs { materialDataset: object, structuralFeatures: array, propertyMeasurements: array, modelingGoals?: object }
 * @outputs { success: boolean, correlations: object, predictiveModels: object, insights: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/structure-property-correlation', {
 *   materialDataset: { samples: 50, materialType: 'gold-nanoparticles' },
 *   structuralFeatures: ['size', 'shape', 'surface-chemistry', 'crystallinity'],
 *   propertyMeasurements: ['plasmon-resonance', 'catalytic-activity', 'stability'],
 *   modelingGoals: { predictProperty: 'catalytic-activity', optimizeFor: 'maximum' }
 * });
 *
 * @references
 * - Materials Project: https://materialsproject.org/
 * - AFLOW (Automatic FLOW): http://aflowlib.org/
 * - Crystallography Open Database: https://www.crystallography.net/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialDataset,
    structuralFeatures,
    propertyMeasurements,
    modelingGoals = {},
    validationSplit = 0.2
  } = inputs;

  // Phase 1: Data Assessment and Preprocessing
  const dataAssessment = await ctx.task(dataAssessmentTask, {
    materialDataset,
    structuralFeatures,
    propertyMeasurements
  });

  // Quality Gate: Data must be sufficient for analysis
  if (!dataAssessment.sufficient) {
    return {
      success: false,
      error: 'Insufficient data for structure-property correlation analysis',
      phase: 'data-assessment',
      recommendations: dataAssessment.recommendations
    };
  }

  // Breakpoint: Review data assessment
  await ctx.breakpoint({
    question: `Data assessment complete. ${dataAssessment.validSamples} valid samples identified. ${dataAssessment.featureQuality.completeness}% data completeness. Proceed with analysis?`,
    title: 'Data Assessment Review',
    context: {
      runId: ctx.runId,
      validSamples: dataAssessment.validSamples,
      featureQuality: dataAssessment.featureQuality,
      files: [{
        path: 'artifacts/data-assessment.json',
        format: 'json',
        content: dataAssessment
      }]
    }
  });

  // Phase 2: Feature Engineering
  const featureEngineering = await ctx.task(featureEngineeringTask, {
    dataAssessment,
    structuralFeatures,
    propertyMeasurements
  });

  // Phase 3: Exploratory Data Analysis
  const exploratoryAnalysis = await ctx.task(exploratoryAnalysisTask, {
    featureEngineering,
    structuralFeatures,
    propertyMeasurements
  });

  // Phase 4: Statistical Correlation Analysis
  const statisticalCorrelation = await ctx.task(statisticalCorrelationTask, {
    featureEngineering,
    exploratoryAnalysis,
    structuralFeatures,
    propertyMeasurements
  });

  // Breakpoint: Review correlation findings
  await ctx.breakpoint({
    question: `Statistical analysis complete. ${statisticalCorrelation.significantCorrelations.length} significant correlations found. Review before proceeding to ML modeling?`,
    title: 'Statistical Correlation Review',
    context: {
      runId: ctx.runId,
      significantCorrelations: statisticalCorrelation.significantCorrelations,
      correlationMatrix: statisticalCorrelation.correlationMatrix
    }
  });

  // Phase 5: Machine Learning Pattern Identification
  const mlPatternAnalysis = await ctx.task(mlPatternAnalysisTask, {
    featureEngineering,
    statisticalCorrelation,
    structuralFeatures,
    propertyMeasurements,
    validationSplit
  });

  // Phase 6: Predictive Model Development
  let predictiveModels = null;
  if (modelingGoals.predictProperty) {
    predictiveModels = await ctx.task(predictiveModelDevelopmentTask, {
      featureEngineering,
      mlPatternAnalysis,
      modelingGoals,
      validationSplit
    });

    // Quality Gate: Model must meet performance threshold
    if (predictiveModels.bestModelScore < 0.7) {
      await ctx.breakpoint({
        question: `Best predictive model R2 = ${predictiveModels.bestModelScore.toFixed(3)}. Below target threshold. Continue with current model or iterate?`,
        title: 'Model Performance Warning',
        context: {
          runId: ctx.runId,
          modelPerformance: predictiveModels.modelComparison,
          recommendations: predictiveModels.improvementRecommendations
        }
      });
    }
  }

  // Phase 7: Model Validation
  const modelValidation = await ctx.task(modelValidationTask, {
    predictiveModels,
    mlPatternAnalysis,
    featureEngineering,
    validationSplit
  });

  // Phase 8: Physical Interpretation
  const physicalInterpretation = await ctx.task(physicalInterpretationTask, {
    statisticalCorrelation,
    mlPatternAnalysis,
    predictiveModels,
    structuralFeatures,
    propertyMeasurements
  });

  // Phase 9: Insight Generation
  const insights = await ctx.task(insightGenerationTask, {
    statisticalCorrelation,
    mlPatternAnalysis,
    predictiveModels,
    physicalInterpretation,
    modelingGoals
  });

  // Phase 10: Report Generation
  const analysisReport = await ctx.task(reportGenerationTask, {
    dataAssessment,
    exploratoryAnalysis,
    statisticalCorrelation,
    mlPatternAnalysis,
    predictiveModels,
    modelValidation,
    physicalInterpretation,
    insights
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `Structure-property analysis complete. ${insights.keyInsights.length} key insights generated. ${predictiveModels ? `Best model R2: ${predictiveModels.bestModelScore.toFixed(3)}` : 'No predictive model requested'}. Approve results?`,
    title: 'Structure-Property Analysis Results Approval',
    context: {
      runId: ctx.runId,
      keyInsights: insights.keyInsights,
      modelPerformance: predictiveModels?.bestModelScore,
      files: [
        { path: 'artifacts/analysis-report.md', format: 'markdown', content: analysisReport.markdown },
        { path: 'artifacts/correlations.json', format: 'json', content: statisticalCorrelation }
      ]
    }
  });

  return {
    success: true,
    correlations: {
      statistical: statisticalCorrelation,
      mlPatterns: mlPatternAnalysis.patterns
    },
    predictiveModels: predictiveModels ? {
      bestModel: predictiveModels.bestModel,
      performance: predictiveModels.bestModelScore,
      featureImportance: predictiveModels.featureImportance
    } : null,
    validation: modelValidation,
    physicalInterpretation,
    insights: insights.keyInsights,
    designGuidelines: insights.designGuidelines,
    report: analysisReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/structure-property-correlation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataAssessmentTask = defineTask('data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess dataset for structure-property analysis',
  agent: {
    name: 'data-scientist',
    prompt: {
      role: 'Materials Data Scientist',
      task: 'Assess dataset quality and suitability for structure-property correlation analysis',
      context: args,
      instructions: [
        '1. Evaluate sample size and statistical power',
        '2. Assess data completeness for each feature and property',
        '3. Check for outliers and anomalous data points',
        '4. Evaluate data distribution characteristics',
        '5. Assess measurement uncertainty for each variable',
        '6. Check for systematic biases in the dataset',
        '7. Identify missing data patterns',
        '8. Evaluate feature variance and information content',
        '9. Check for data entry errors or inconsistencies',
        '10. Recommend data cleaning and preprocessing steps'
      ],
      outputFormat: 'JSON object with data assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['sufficient', 'validSamples', 'featureQuality'],
      properties: {
        sufficient: { type: 'boolean' },
        validSamples: { type: 'number' },
        featureQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            variance: { type: 'object' },
            outliers: { type: 'object' }
          }
        },
        dataIssues: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'data-science', 'assessment']
}));

export const featureEngineeringTask = defineTask('feature-engineering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Engineer features for correlation analysis',
  agent: {
    name: 'feature-engineer',
    prompt: {
      role: 'Materials Feature Engineering Specialist',
      task: 'Engineer and transform features for structure-property correlation',
      context: args,
      instructions: [
        '1. Normalize and scale structural features appropriately',
        '2. Transform non-linear features (log, polynomial)',
        '3. Create interaction features where physically meaningful',
        '4. Generate derived features (ratios, products)',
        '5. Encode categorical features appropriately',
        '6. Handle missing values with appropriate imputation',
        '7. Create feature representations for complex structures',
        '8. Generate physics-informed features',
        '9. Reduce dimensionality if needed (PCA, etc.)',
        '10. Document all feature transformations'
      ],
      outputFormat: 'JSON object with engineered features'
    },
    outputSchema: {
      type: 'object',
      required: ['transformedFeatures', 'featureList', 'transformations'],
      properties: {
        transformedFeatures: { type: 'object' },
        featureList: { type: 'array', items: { type: 'string' } },
        transformations: { type: 'array' },
        derivedFeatures: { type: 'array' },
        dimensionalityReduction: { type: 'object' },
        featureDescriptions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'data-science', 'feature-engineering']
}));

export const exploratoryAnalysisTask = defineTask('exploratory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform exploratory data analysis',
  agent: {
    name: 'eda-analyst',
    prompt: {
      role: 'Exploratory Data Analysis Specialist',
      task: 'Conduct comprehensive exploratory analysis of structure-property data',
      context: args,
      instructions: [
        '1. Generate distribution plots for all features and properties',
        '2. Create pairwise scatter plots for key relationships',
        '3. Identify potential non-linear relationships',
        '4. Detect clusters or groupings in the data',
        '5. Identify potential confounding variables',
        '6. Visualize multidimensional relationships',
        '7. Detect trends and patterns in the data',
        '8. Identify potential outliers visually',
        '9. Assess homoscedasticity of relationships',
        '10. Document key observations from EDA'
      ],
      outputFormat: 'JSON object with EDA results'
    },
    outputSchema: {
      type: 'object',
      required: ['distributions', 'relationships', 'patterns'],
      properties: {
        distributions: { type: 'object' },
        relationships: { type: 'array' },
        patterns: { type: 'array' },
        clusters: { type: 'object' },
        outlierCandidates: { type: 'array' },
        keyObservations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'data-science', 'eda']
}));

export const statisticalCorrelationTask = defineTask('statistical-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze statistical correlations',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Statistical Analysis Specialist',
      task: 'Perform rigorous statistical correlation analysis',
      context: args,
      instructions: [
        '1. Calculate Pearson correlation coefficients',
        '2. Calculate Spearman rank correlations for non-linear relationships',
        '3. Test statistical significance of all correlations',
        '4. Apply multiple testing correction (Bonferroni, FDR)',
        '5. Perform partial correlation analysis',
        '6. Calculate correlation confidence intervals',
        '7. Test for multicollinearity among features',
        '8. Perform regression analysis for key relationships',
        '9. Assess effect sizes and practical significance',
        '10. Document all significant correlations with statistics'
      ],
      outputFormat: 'JSON object with statistical correlation results'
    },
    outputSchema: {
      type: 'object',
      required: ['correlationMatrix', 'significantCorrelations', 'regressionResults'],
      properties: {
        correlationMatrix: { type: 'object' },
        significantCorrelations: { type: 'array' },
        regressionResults: { type: 'object' },
        partialCorrelations: { type: 'object' },
        multicollinearity: { type: 'object' },
        effectSizes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'statistics', 'correlation']
}));

export const mlPatternAnalysisTask = defineTask('ml-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify patterns using machine learning',
  agent: {
    name: 'ml-specialist',
    prompt: {
      role: 'Machine Learning Pattern Recognition Specialist',
      task: 'Apply machine learning to identify complex patterns in structure-property data',
      context: args,
      instructions: [
        '1. Apply clustering algorithms to identify material groups',
        '2. Use dimensionality reduction for visualization (t-SNE, UMAP)',
        '3. Apply tree-based methods for feature importance',
        '4. Use association rule mining for categorical patterns',
        '5. Apply non-linear regression for complex relationships',
        '6. Identify interaction effects using ML methods',
        '7. Detect anomalous samples using isolation forests',
        '8. Apply symbolic regression for interpretable models',
        '9. Use SHAP values for feature attribution',
        '10. Document all discovered patterns'
      ],
      outputFormat: 'JSON object with ML pattern analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'clusters', 'featureImportance'],
      properties: {
        patterns: { type: 'array' },
        clusters: { type: 'object' },
        featureImportance: { type: 'object' },
        interactions: { type: 'array' },
        anomalies: { type: 'array' },
        dimensionReduction: { type: 'object' },
        symbolicModels: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'machine-learning', 'patterns']
}));

export const predictiveModelDevelopmentTask = defineTask('predictive-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop predictive models',
  agent: {
    name: 'predictive-modeler',
    prompt: {
      role: 'Predictive Modeling Specialist',
      task: 'Develop and optimize predictive models for target property',
      context: args,
      instructions: [
        '1. Select appropriate model architectures for the problem',
        '2. Train multiple model types (linear, ensemble, neural network)',
        '3. Perform hyperparameter optimization',
        '4. Implement cross-validation for robust evaluation',
        '5. Calculate model performance metrics (R2, RMSE, MAE)',
        '6. Extract feature importance from models',
        '7. Generate prediction intervals',
        '8. Compare model performance systematically',
        '9. Select best model based on performance and interpretability',
        '10. Document model limitations and applicability domain'
      ],
      outputFormat: 'JSON object with predictive models'
    },
    outputSchema: {
      type: 'object',
      required: ['bestModel', 'bestModelScore', 'modelComparison'],
      properties: {
        bestModel: { type: 'string' },
        bestModelScore: { type: 'number' },
        modelComparison: { type: 'array' },
        featureImportance: { type: 'object' },
        crossValidationResults: { type: 'object' },
        predictionIntervals: { type: 'object' },
        applicabilityDomain: { type: 'object' },
        improvementRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'machine-learning', 'prediction']
}));

export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate predictive models',
  agent: {
    name: 'model-validator',
    prompt: {
      role: 'Model Validation Specialist',
      task: 'Rigorously validate predictive models',
      context: args,
      instructions: [
        '1. Evaluate model on held-out test set',
        '2. Perform residual analysis',
        '3. Check for overfitting indicators',
        '4. Validate prediction uncertainty estimates',
        '5. Test model on edge cases',
        '6. Assess model robustness to input perturbations',
        '7. Validate applicability domain boundaries',
        '8. Compare predictions to physical expectations',
        '9. Perform sensitivity analysis',
        '10. Document validation results and confidence'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['testSetPerformance', 'residualAnalysis', 'validationPassed'],
      properties: {
        testSetPerformance: { type: 'object' },
        residualAnalysis: { type: 'object' },
        validationPassed: { type: 'boolean' },
        overfittingIndicators: { type: 'object' },
        robustnessAnalysis: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'machine-learning', 'validation']
}));

export const physicalInterpretationTask = defineTask('physical-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Provide physical interpretation of correlations',
  agent: {
    name: 'materials-physicist',
    prompt: {
      role: 'Materials Physics Interpretation Specialist',
      task: 'Provide physical interpretation of structure-property correlations',
      context: args,
      instructions: [
        '1. Interpret key correlations in terms of physical mechanisms',
        '2. Relate size effects to quantum confinement, surface effects',
        '3. Explain shape effects on properties',
        '4. Interpret surface chemistry correlations',
        '5. Relate composition effects to electronic structure',
        '6. Explain any observed threshold or transition behavior',
        '7. Connect findings to established theoretical frameworks',
        '8. Identify novel physical insights',
        '9. Compare with literature predictions and observations',
        '10. Identify areas requiring further theoretical investigation'
      ],
      outputFormat: 'JSON object with physical interpretation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisticExplanations', 'theoreticalConnections', 'novelInsights'],
      properties: {
        mechanisticExplanations: { type: 'array' },
        theoreticalConnections: { type: 'array' },
        novelInsights: { type: 'array' },
        sizeEffects: { type: 'object' },
        shapeEffects: { type: 'object' },
        surfaceEffects: { type: 'object' },
        literatureComparison: { type: 'object' },
        furtherInvestigation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'physics', 'interpretation']
}));

export const insightGenerationTask = defineTask('insight-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable insights',
  agent: {
    name: 'insights-specialist',
    prompt: {
      role: 'Materials Design Insights Specialist',
      task: 'Generate actionable insights and design guidelines from analysis',
      context: args,
      instructions: [
        '1. Synthesize key findings into actionable insights',
        '2. Develop materials design guidelines',
        '3. Identify optimal structural features for target properties',
        '4. Recommend synthesis targets based on correlations',
        '5. Identify trade-offs between competing properties',
        '6. Suggest multi-objective optimization strategies',
        '7. Highlight unexpected or counterintuitive findings',
        '8. Prioritize insights by impact and confidence',
        '9. Recommend validation experiments',
        '10. Summarize implications for applications'
      ],
      outputFormat: 'JSON object with insights and guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['keyInsights', 'designGuidelines', 'recommendations'],
      properties: {
        keyInsights: { type: 'array', items: { type: 'string' } },
        designGuidelines: { type: 'array' },
        optimalFeatures: { type: 'object' },
        tradeoffs: { type: 'array' },
        unexpectedFindings: { type: 'array' },
        validationExperiments: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'insights', 'design']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate structure-property analysis report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive structure-property correlation report',
      context: args,
      instructions: [
        '1. Create executive summary of analysis and key findings',
        '2. Document dataset and methodology',
        '3. Present exploratory analysis results',
        '4. Detail statistical correlation findings',
        '5. Present machine learning analysis results',
        '6. Document predictive model performance',
        '7. Include physical interpretation of findings',
        '8. Present actionable insights and guidelines',
        '9. Include visualizations and tables',
        '10. Provide conclusions and future directions'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'visualizations'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        results: { type: 'object' },
        visualizations: { type: 'array' },
        conclusions: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'reporting', 'analysis']
}));
