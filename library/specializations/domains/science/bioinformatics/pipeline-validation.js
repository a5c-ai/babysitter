/**
 * @process specializations/domains/science/bioinformatics/pipeline-validation
 * @description Analysis Pipeline Validation - Systematic validation of bioinformatics pipelines for accuracy,
 * reproducibility, and clinical use including benchmark testing and performance characterization.
 * @inputs { projectName: string, pipeline: object, referenceData: object, validationType?: string, outputDir?: string }
 * @outputs { success: boolean, validationMetrics: object, performanceReport: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/pipeline-validation', {
 *   projectName: 'WGS Pipeline Validation',
 *   pipeline: { name: 'WGS-v2', config: '/pipelines/wgs.config' },
 *   referenceData: { type: 'GIAB', sample: 'HG002' },
 *   validationType: 'clinical'
 * });
 *
 * @references
 * - GA4GH Benchmarking: https://github.com/ga4gh/benchmarking-tools
 * - Genome in a Bottle: https://www.nist.gov/programs-projects/genome-bottle
 * - precisionFDA: https://precision.fda.gov/
 * - CAP/CLIA Guidelines: https://www.cap.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    pipeline,
    referenceData,
    validationType = 'clinical', // 'research', 'clinical', 'regulatory'
    outputDir = 'validation-output',
    accuracyThresholds = { sensitivity: 0.99, specificity: 0.999, ppv: 0.99 },
    reproducibilityRuns = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Pipeline Validation for ${projectName}`);
  ctx.log('info', `Pipeline: ${pipeline.name}, Reference: ${referenceData.type}, Type: ${validationType}`);

  // Phase 1: Reference Dataset Selection
  const referenceResult = await ctx.task(referenceSelectionTask, { projectName, referenceData, validationType, outputDir });
  artifacts.push(...referenceResult.artifacts);

  // Phase 2: Pipeline Execution
  const executionResult = await ctx.task(pipelineExecutionTask, { projectName, pipeline, referenceData: referenceResult.selectedData, reproducibilityRuns, outputDir });
  artifacts.push(...executionResult.artifacts);

  // Phase 3: Accuracy Assessment
  const accuracyResult = await ctx.task(accuracyAssessmentTask, { projectName, pipelineOutput: executionResult.outputs, truthSet: referenceResult.truthSet, outputDir });
  artifacts.push(...accuracyResult.artifacts);

  ctx.log('info', `Accuracy: Sensitivity ${accuracyResult.sensitivity}, PPV ${accuracyResult.ppv}`);

  await ctx.breakpoint({
    question: `Accuracy assessment complete. Sensitivity: ${accuracyResult.sensitivity}, Specificity: ${accuracyResult.specificity}, PPV: ${accuracyResult.ppv}. Meets thresholds: ${accuracyResult.meetsThresholds}. Review results?`,
    title: 'Accuracy Assessment Review',
    context: { runId: ctx.runId, metrics: accuracyResult.metrics, thresholds: accuracyThresholds, files: accuracyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 4: Reproducibility Testing
  const reproducibilityResult = await ctx.task(reproducibilityTestingTask, { projectName, pipelineRuns: executionResult.allRuns, outputDir });
  artifacts.push(...reproducibilityResult.artifacts);

  // Phase 5: Performance Benchmarking
  const performanceResult = await ctx.task(performanceBenchmarkingTask, { projectName, executionMetrics: executionResult.metrics, outputDir });
  artifacts.push(...performanceResult.artifacts);

  // Phase 6: Edge Case Testing
  const edgeCaseResult = await ctx.task(edgeCaseTestingTask, { projectName, pipeline, outputDir });
  artifacts.push(...edgeCaseResult.artifacts);

  // Phase 7: Limitations Documentation
  const limitationsResult = await ctx.task(limitationsDocumentationTask, { projectName, accuracyResult, edgeCaseResult, outputDir });
  artifacts.push(...limitationsResult.artifacts);

  // Phase 8: Regulatory Compliance
  const complianceResult = await ctx.task(regulatoryComplianceTask, { projectName, validationType, accuracyResult, reproducibilityResult, outputDir });
  artifacts.push(...complianceResult.artifacts);

  // Phase 9: Validation Report Generation
  const reportResult = await ctx.task(generateValidationReportTask, { projectName, pipeline, referenceResult, accuracyResult, reproducibilityResult, performanceResult, edgeCaseResult, limitationsResult, complianceResult, validationType, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Pipeline Validation Complete. Overall: ${reportResult.validationStatus}. Accuracy meets thresholds: ${accuracyResult.meetsThresholds}, Reproducibility: ${reproducibilityResult.concordance}%. Approve validation report?`,
    title: 'Pipeline Validation Complete',
    context: { runId: ctx.runId, summary: { status: reportResult.validationStatus, sensitivity: accuracyResult.sensitivity, ppv: accuracyResult.ppv, reproducibility: reproducibilityResult.concordance }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Validation Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    pipelineName: pipeline.name,
    validationType,
    validationMetrics: {
      sensitivity: accuracyResult.sensitivity,
      specificity: accuracyResult.specificity,
      ppv: accuracyResult.ppv,
      npv: accuracyResult.npv,
      f1Score: accuracyResult.f1Score
    },
    performanceReport: performanceResult.metrics,
    reproducibility: reproducibilityResult.concordance,
    complianceStatus: complianceResult.status,
    limitations: limitationsResult.limitations,
    validationStatus: reportResult.validationStatus,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/pipeline-validation', timestamp: startTime, validationType }
  };
}

// Task Definitions
export const referenceSelectionTask = defineTask('reference-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reference Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reference Data Specialist',
      task: 'Select and prepare reference datasets',
      context: args,
      instructions: ['1. Select appropriate GIAB samples', '2. Prepare truth VCF and confident regions', '3. Download reference data if needed', '4. Validate reference data integrity', '5. Document reference versions'],
      outputFormat: 'JSON object with reference data'
    },
    outputSchema: { type: 'object', required: ['success', 'selectedData', 'truthSet', 'artifacts'], properties: { success: { type: 'boolean' }, selectedData: { type: 'object' }, truthSet: { type: 'string' }, confidentRegions: { type: 'string' }, referenceVersion: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'reference-data']
}));

export const pipelineExecutionTask = defineTask('pipeline-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pipeline Execution Specialist',
      task: 'Execute pipeline on reference data',
      context: args,
      instructions: ['1. Configure pipeline parameters', '2. Execute multiple runs for reproducibility', '3. Capture execution metrics', '4. Collect output files', '5. Generate execution log'],
      outputFormat: 'JSON object with execution results'
    },
    outputSchema: { type: 'object', required: ['success', 'outputs', 'allRuns', 'metrics', 'artifacts'], properties: { success: { type: 'boolean' }, outputs: { type: 'array' }, allRuns: { type: 'array' }, metrics: { type: 'object' }, executionTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'execution']
}));

export const accuracyAssessmentTask = defineTask('accuracy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Accuracy Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accuracy Assessment Specialist',
      task: 'Assess pipeline accuracy against truth set',
      context: args,
      instructions: ['1. Run hap.py or similar benchmarking tool', '2. Calculate sensitivity, specificity, PPV, NPV', '3. Stratify by variant type', '4. Analyze error modes', '5. Generate accuracy report'],
      outputFormat: 'JSON object with accuracy metrics'
    },
    outputSchema: { type: 'object', required: ['success', 'sensitivity', 'specificity', 'ppv', 'npv', 'f1Score', 'metrics', 'meetsThresholds', 'artifacts'], properties: { success: { type: 'boolean' }, sensitivity: { type: 'number' }, specificity: { type: 'number' }, ppv: { type: 'number' }, npv: { type: 'number' }, f1Score: { type: 'number' }, metrics: { type: 'object' }, meetsThresholds: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'accuracy']
}));

export const reproducibilityTestingTask = defineTask('reproducibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reproducibility Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reproducibility Testing Specialist',
      task: 'Assess pipeline reproducibility',
      context: args,
      instructions: ['1. Compare results across multiple runs', '2. Calculate concordance metrics', '3. Identify discordant calls', '4. Assess stochastic variation', '5. Generate reproducibility report'],
      outputFormat: 'JSON object with reproducibility metrics'
    },
    outputSchema: { type: 'object', required: ['success', 'concordance', 'artifacts'], properties: { success: { type: 'boolean' }, concordance: { type: 'number' }, discordantVariants: { type: 'number' }, runVariation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'reproducibility']
}));

export const performanceBenchmarkingTask = defineTask('performance-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Benchmarking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Benchmarking Specialist',
      task: 'Benchmark pipeline performance',
      context: args,
      instructions: ['1. Measure execution time', '2. Track resource utilization', '3. Calculate throughput', '4. Compare with baseline', '5. Generate performance report'],
      outputFormat: 'JSON object with performance metrics'
    },
    outputSchema: { type: 'object', required: ['success', 'metrics', 'artifacts'], properties: { success: { type: 'boolean' }, metrics: { type: 'object' }, executionTime: { type: 'number' }, memoryPeak: { type: 'number' }, cpuUtilization: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'performance']
}));

export const edgeCaseTestingTask = defineTask('edge-case-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Edge Case Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Edge Case Testing Specialist',
      task: 'Test pipeline with edge cases',
      context: args,
      instructions: ['1. Test low-coverage regions', '2. Test complex variants', '3. Test homopolymers and repeats', '4. Test structural variants', '5. Document edge case performance'],
      outputFormat: 'JSON object with edge case results'
    },
    outputSchema: { type: 'object', required: ['success', 'edgeCases', 'artifacts'], properties: { success: { type: 'boolean' }, edgeCases: { type: 'array' }, knownLimitations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'edge-cases']
}));

export const limitationsDocumentationTask = defineTask('limitations-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Limitations Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Limitations Documentation Specialist',
      task: 'Document pipeline limitations',
      context: args,
      instructions: ['1. Summarize known limitations', '2. Document regions with reduced performance', '3. List unsupported variant types', '4. Describe sample requirements', '5. Generate limitations document'],
      outputFormat: 'JSON object with limitations'
    },
    outputSchema: { type: 'object', required: ['success', 'limitations', 'artifacts'], properties: { success: { type: 'boolean' }, limitations: { type: 'array' }, unsupportedRegions: { type: 'array' }, sampleRequirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'limitations']
}));

export const regulatoryComplianceTask = defineTask('regulatory-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Regulatory Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Compliance Specialist',
      task: 'Assess regulatory compliance',
      context: args,
      instructions: ['1. Check CAP/CLIA requirements', '2. Verify FDA guidance compliance', '3. Document validation evidence', '4. Prepare compliance documentation', '5. Generate compliance status'],
      outputFormat: 'JSON object with compliance status'
    },
    outputSchema: { type: 'object', required: ['success', 'status', 'artifacts'], properties: { success: { type: 'boolean' }, status: { type: 'object' }, requirements: { type: 'array' }, complianceGaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'compliance']
}));

export const generateValidationReportTask = defineTask('generate-validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Report Specialist',
      task: 'Generate comprehensive validation report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present accuracy metrics', '3. Include reproducibility results', '4. Document limitations', '5. Provide compliance status'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'validationStatus', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, validationStatus: { type: 'string' }, sopPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'validation', 'report-generation']
}));
