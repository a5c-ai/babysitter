/**
 * @process domains/science/scientific-discovery/exploratory-data-analysis
 * @description Apply statistical and visualization techniques to discover patterns - Guides analysts through
 * systematic exploratory data analysis (EDA) to understand data structure, discover patterns, and generate hypotheses.
 * @inputs { dataset: object, variables: array, researchQuestions?: array }
 * @outputs { success: boolean, summary: object, patterns: array, visualizations: array, hypotheses: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/exploratory-data-analysis', {
 *   dataset: { path: './data/sales.csv', rows: 10000, columns: 25 },
 *   variables: ['revenue', 'customers', 'region', 'date'],
 *   researchQuestions: ['What drives revenue growth?', 'Are there seasonal patterns?']
 * });
 *
 * @references
 * - Tukey, J.W. (1977). Exploratory Data Analysis
 * - Wickham, H. & Grolemund, G. (2017). R for Data Science
 * - Cleveland, W.S. (1993). Visualizing Data
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { dataset, variables = [], researchQuestions = [], outputDir = 'eda-output', minimumCoverageScore = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Exploratory Data Analysis for dataset: ${dataset.path || 'Dataset'}`);

  const dataOverview = await ctx.task(dataOverviewTask, { dataset, variables, outputDir });
  artifacts.push(...dataOverview.artifacts);

  const univariateAnalysis = await ctx.task(univariateAnalysisTask, { dataset, variables, dataOverview, outputDir });
  artifacts.push(...univariateAnalysis.artifacts);

  const bivariateAnalysis = await ctx.task(bivariateAnalysisTask, { dataset, variables, univariateAnalysis, outputDir });
  artifacts.push(...bivariateAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Univariate and bivariate analysis complete. ${univariateAnalysis.distributions?.length || 0} distributions, ${bivariateAnalysis.relationships?.length || 0} relationships. Continue to pattern discovery?`,
    title: 'EDA Progress Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { distributions: univariateAnalysis.distributions?.length || 0, relationships: bivariateAnalysis.relationships?.length || 0 }}
  });

  const multivariateAnalysis = await ctx.task(multivariateAnalysisTask, { dataset, variables, bivariateAnalysis, outputDir });
  artifacts.push(...multivariateAnalysis.artifacts);

  const patternDiscovery = await ctx.task(patternDiscoveryTask, { univariateAnalysis, bivariateAnalysis, multivariateAnalysis, researchQuestions, outputDir });
  artifacts.push(...patternDiscovery.artifacts);

  const anomalyDetection = await ctx.task(anomalyDetectionTask, { dataset, variables, univariateAnalysis, outputDir });
  artifacts.push(...anomalyDetection.artifacts);

  const hypothesisGeneration = await ctx.task(edaHypothesisGenerationTask, { patterns: patternDiscovery.patterns, anomalies: anomalyDetection.anomalies, researchQuestions, outputDir });
  artifacts.push(...hypothesisGeneration.artifacts);

  const visualizationSuite = await ctx.task(visualizationSuiteTask, { univariateAnalysis, bivariateAnalysis, multivariateAnalysis, patterns: patternDiscovery.patterns, outputDir });
  artifacts.push(...visualizationSuite.artifacts);

  const qualityScore = await ctx.task(edaQualityScoringTask, { dataOverview, univariateAnalysis, bivariateAnalysis, patternDiscovery, hypothesisGeneration, minimumCoverageScore, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `EDA complete. ${patternDiscovery.patterns?.length || 0} patterns, ${hypothesisGeneration.hypotheses?.length || 0} hypotheses. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'EDA Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { patterns: patternDiscovery.patterns?.length || 0, hypotheses: hypothesisGeneration.hypotheses?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, dataset: dataset.path, summary: dataOverview, patterns: patternDiscovery.patterns,
    visualizations: visualizationSuite.visualizations, hypotheses: hypothesisGeneration.hypotheses,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/exploratory-data-analysis', timestamp: startTime, outputDir }
  };
}

export const dataOverviewTask = defineTask('data-overview', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate data overview',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Data analyst', task: 'Generate comprehensive data overview', context: args, instructions: ['Document dataset dimensions', 'List variable types', 'Calculate missing value statistics', 'Check for duplicates', 'Document data quality issues', 'Create data dictionary'], outputFormat: 'JSON with dimensions, variableTypes, missingValues, duplicates, qualityIssues, dataDictionary, artifacts' }, outputSchema: { type: 'object', required: ['dimensions', 'variableTypes', 'missingValues', 'artifacts'], properties: { dimensions: { type: 'object' }, variableTypes: { type: 'object' }, missingValues: { type: 'object' }, duplicates: { type: 'number' }, qualityIssues: { type: 'array' }, dataDictionary: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const univariateAnalysisTask = defineTask('univariate-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform univariate analysis',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'bayesian-inference-engine'], prompt: { role: 'Statistical analyst', task: 'Analyze each variable individually', context: args, instructions: ['Calculate descriptive statistics', 'Analyze distributions', 'Check for normality', 'Identify outliers', 'Analyze categorical frequencies', 'Document findings'], outputFormat: 'JSON with distributions, descriptiveStats, normalityTests, outliers, categoricalFrequencies, findings, artifacts' }, outputSchema: { type: 'object', required: ['distributions', 'descriptiveStats', 'artifacts'], properties: { distributions: { type: 'array' }, descriptiveStats: { type: 'object' }, normalityTests: { type: 'object' }, outliers: { type: 'object' }, categoricalFrequencies: { type: 'object' }, findings: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const bivariateAnalysisTask = defineTask('bivariate-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform bivariate analysis',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'causal-inference-engine', 'bayesian-inference-engine'], prompt: { role: 'Correlation analyst', task: 'Analyze relationships between pairs of variables', context: args, instructions: ['Calculate correlation matrix', 'Analyze associations', 'Perform contingency analysis', 'Identify strong relationships', 'Document relationship patterns'], outputFormat: 'JSON with relationships, correlationMatrix, associations, contingencyAnalysis, strongRelationships, artifacts' }, outputSchema: { type: 'object', required: ['relationships', 'correlationMatrix', 'artifacts'], properties: { relationships: { type: 'array' }, correlationMatrix: { type: 'object' }, associations: { type: 'array' }, contingencyAnalysis: { type: 'object' }, strongRelationships: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const multivariateAnalysisTask = defineTask('multivariate-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform multivariate analysis',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'bayesian-inference-engine', 'hypothesis-generator'], prompt: { role: 'Multivariate analyst', task: 'Analyze relationships among multiple variables', context: args, instructions: ['Consider PCA/dimensionality reduction', 'Identify clusters', 'Analyze interactions', 'Find multivariate patterns', 'Document complex relationships'], outputFormat: 'JSON with dimensionalityAnalysis, clusters, interactions, multivariatePatterns, complexRelationships, artifacts' }, outputSchema: { type: 'object', required: ['multivariatePatterns', 'artifacts'], properties: { dimensionalityAnalysis: { type: 'object' }, clusters: { type: 'array' }, interactions: { type: 'array' }, multivariatePatterns: { type: 'array' }, complexRelationships: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const patternDiscoveryTask = defineTask('pattern-discovery', (args, taskCtx) => ({
  kind: 'agent', title: 'Discover patterns',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'data-analyst', skills: ['hypothesis-generator', 'statistical-test-selector', 'bayesian-inference-engine'], prompt: { role: 'Pattern discovery specialist', task: 'Synthesize findings into key patterns', context: args, instructions: ['Identify recurring patterns', 'Find temporal patterns', 'Discover group differences', 'Identify trends', 'Document pattern significance'], outputFormat: 'JSON with patterns, temporalPatterns, groupDifferences, trends, significance, artifacts' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array', items: { type: 'object', properties: { pattern: { type: 'string' }, type: { type: 'string' }, strength: { type: 'string' }, variables: { type: 'array' } } } }, temporalPatterns: { type: 'array' }, groupDifferences: { type: 'array' }, trends: { type: 'array' }, significance: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const anomalyDetectionTask = defineTask('anomaly-detection', (args, taskCtx) => ({
  kind: 'agent', title: 'Detect anomalies',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'bayesian-inference-engine'], prompt: { role: 'Anomaly detection specialist', task: 'Identify anomalies and unusual observations', context: args, instructions: ['Apply statistical outlier detection', 'Identify unusual patterns', 'Find data quality anomalies', 'Document anomaly characteristics', 'Assess anomaly significance'], outputFormat: 'JSON with anomalies, outliers, unusualPatterns, qualityAnomalies, significance, artifacts' }, outputSchema: { type: 'object', required: ['anomalies', 'artifacts'], properties: { anomalies: { type: 'array' }, outliers: { type: 'object' }, unusualPatterns: { type: 'array' }, qualityAnomalies: { type: 'array' }, significance: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const edaHypothesisGenerationTask = defineTask('eda-hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate hypotheses from EDA',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'data-analyst', skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'], prompt: { role: 'Hypothesis generation specialist', task: 'Generate testable hypotheses from EDA findings', context: args, instructions: ['Generate hypotheses from patterns', 'Address research questions', 'Consider alternative explanations', 'Formulate testable predictions', 'Prioritize by importance'], outputFormat: 'JSON with hypotheses, researchQuestionAnswers, alternativeExplanations, predictions, prioritization, artifacts' }, outputSchema: { type: 'object', required: ['hypotheses', 'artifacts'], properties: { hypotheses: { type: 'array', items: { type: 'object', properties: { hypothesis: { type: 'string' }, basedOn: { type: 'string' }, testable: { type: 'boolean' }, priority: { type: 'string' } } } }, researchQuestionAnswers: { type: 'object' }, alternativeExplanations: { type: 'array' }, predictions: { type: 'array' }, prioritization: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const visualizationSuiteTask = defineTask('visualization-suite', (args, taskCtx) => ({
  kind: 'agent', title: 'Create visualization suite',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'hypothesis-generator'], prompt: { role: 'Data visualization specialist', task: 'Create comprehensive visualization suite', context: args, instructions: ['Create distribution plots', 'Create relationship plots', 'Create pattern visualizations', 'Design dashboard layout', 'Document visualization choices'], outputFormat: 'JSON with visualizations, distributionPlots, relationshipPlots, patternVisualizations, dashboardLayout, artifacts' }, outputSchema: { type: 'object', required: ['visualizations', 'artifacts'], properties: { visualizations: { type: 'array' }, distributionPlots: { type: 'array' }, relationshipPlots: { type: 'array' }, patternVisualizations: { type: 'array' }, dashboardLayout: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));

export const edaQualityScoringTask = defineTask('eda-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score EDA quality',
  skill: { name: 'statistical-test-selector' },
  agent: { name: 'data-analyst', skills: ['statistical-test-selector', 'hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'EDA quality auditor', task: 'Score the quality of the exploratory data analysis', context: args, instructions: ['Score data coverage', 'Score analysis depth', 'Score pattern discovery', 'Score hypothesis quality', 'Calculate overall score'], outputFormat: 'JSON with overallScore, coverageScore, depthScore, patternScore, hypothesisScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, coverageScore: { type: 'number' }, depthScore: { type: 'number' }, patternScore: { type: 'number' }, hypothesisScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'eda']
}));
