/**
 * @process specializations/ai-agents-conversational/ab-testing-conversational
 * @description A/B Testing for Conversational AI - Process for running A/B tests to compare different prompts, models,
 * conversation flows, or agent architectures with statistical significance testing.
 * @inputs { experimentName?: string, variants?: array, metrics?: array, sampleSize?: number, outputDir?: string }
 * @outputs { success: boolean, experimentDesign: object, testResults: object, statisticalAnalysis: object, winningVariant: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/ab-testing-conversational', {
 *   experimentName: 'prompt-comparison',
 *   variants: ['prompt-v1', 'prompt-v2'],
 *   metrics: ['success-rate', 'csat'],
 *   sampleSize: 1000
 * });
 *
 * @references
 * - A/B Testing Statistics: https://www.evanmiller.org/ab-testing/
 * - Prompt A/B Testing: https://docs.helicone.ai/features/experiments
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    experimentName = 'ab-experiment',
    variants = ['control', 'treatment'],
    metrics = ['success-rate'],
    sampleSize = 1000,
    outputDir = 'ab-testing-output',
    confidenceLevel = 0.95,
    minDetectableEffect = 0.05
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting A/B Testing for ${experimentName}`);

  // ============================================================================
  // PHASE 1: EXPERIMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing experiment');

  const experimentDesign = await ctx.task(experimentDesignTask, {
    experimentName,
    variants,
    metrics,
    sampleSize,
    confidenceLevel,
    minDetectableEffect,
    outputDir
  });

  artifacts.push(...experimentDesign.artifacts);

  // ============================================================================
  // PHASE 2: VARIANT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing variants');

  const variantImplementation = await ctx.task(variantImplementationTask, {
    experimentName,
    variants,
    outputDir
  });

  artifacts.push(...variantImplementation.artifacts);

  // ============================================================================
  // PHASE 3: TRAFFIC ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up traffic allocation');

  const trafficAllocation = await ctx.task(trafficAllocationTask, {
    experimentName,
    variants,
    sampleSize,
    outputDir
  });

  artifacts.push(...trafficAllocation.artifacts);

  // ============================================================================
  // PHASE 4: DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Collecting experiment data');

  const dataCollection = await ctx.task(dataCollectionTask, {
    experimentName,
    variants,
    metrics,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 5: STATISTICAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Running statistical analysis');

  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    experimentName,
    variants,
    metrics,
    data: dataCollection.data,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...statisticalAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: RESULTS REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating results report');

  const resultsReport = await ctx.task(resultsReportTask, {
    experimentName,
    experimentDesign: experimentDesign.design,
    statisticalAnalysis: statisticalAnalysis.results,
    outputDir
  });

  artifacts.push(...resultsReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `A/B test ${experimentName} complete. Winner: ${resultsReport.winningVariant}. Statistical significance: ${statisticalAnalysis.results.isSignificant}. Review results?`,
    title: 'A/B Test Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        experimentName,
        variants,
        winningVariant: resultsReport.winningVariant,
        isSignificant: statisticalAnalysis.results.isSignificant,
        pValue: statisticalAnalysis.results.pValue
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    experimentName,
    experimentDesign: experimentDesign.design,
    testResults: dataCollection.data,
    statisticalAnalysis: statisticalAnalysis.results,
    winningVariant: resultsReport.winningVariant,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/ab-testing-conversational',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Experiment - ${args.experimentName}`,
  agent: {
    name: 'prompt-optimizer',  // AG-PE-003: A/B tests and optimizes prompts for performance
    prompt: {
      role: 'Experiment Designer',
      task: 'Design A/B test experiment',
      context: args,
      instructions: [
        '1. Define hypothesis',
        '2. Calculate required sample size',
        '3. Define success metrics',
        '4. Plan variant allocation',
        '5. Set experiment duration',
        '6. Define guardrail metrics',
        '7. Document experiment plan',
        '8. Save experiment design'
      ],
      outputFormat: 'JSON with experiment design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        hypothesis: { type: 'string' },
        requiredSampleSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'design']
}));

export const variantImplementationTask = defineTask('variant-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Variants - ${args.experimentName}`,
  agent: {
    name: 'variant-developer',
    prompt: {
      role: 'Variant Developer',
      task: 'Implement experiment variants',
      context: args,
      instructions: [
        '1. Implement control variant',
        '2. Implement treatment variants',
        '3. Ensure variant parity (except tested change)',
        '4. Add variant tracking',
        '5. Implement feature flags',
        '6. Add logging for variants',
        '7. Test variant switching',
        '8. Save variant implementations'
      ],
      outputFormat: 'JSON with variant implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'artifacts'],
      properties: {
        variants: { type: 'array' },
        featureFlags: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'variants']
}));

export const trafficAllocationTask = defineTask('traffic-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Traffic Allocation - ${args.experimentName}`,
  agent: {
    name: 'allocation-developer',
    prompt: {
      role: 'Traffic Allocation Developer',
      task: 'Setup traffic allocation for experiment',
      context: args,
      instructions: [
        '1. Implement random assignment',
        '2. Ensure even distribution',
        '3. Add user bucketing',
        '4. Implement sticky sessions',
        '5. Add allocation logging',
        '6. Handle edge cases',
        '7. Test allocation fairness',
        '8. Save allocation config'
      ],
      outputFormat: 'JSON with traffic allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'artifacts'],
      properties: {
        allocation: { type: 'object' },
        allocationCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'allocation']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect Experiment Data - ${args.experimentName}`,
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Experiment Data Collector',
      task: 'Collect experiment data',
      context: args,
      instructions: [
        '1. Collect metric data per variant',
        '2. Track user assignments',
        '3. Record all events',
        '4. Handle data quality',
        '5. Aggregate results',
        '6. Calculate summary statistics',
        '7. Export data for analysis',
        '8. Save collected data'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'artifacts'],
      properties: {
        data: { type: 'object' },
        dataPath: { type: 'string' },
        summaryStats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'data']
}));

export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Statistical Analysis - ${args.experimentName}`,
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Statistician',
      task: 'Run statistical analysis on experiment data',
      context: args,
      instructions: [
        '1. Calculate conversion rates',
        '2. Run appropriate statistical test',
        '3. Calculate p-value',
        '4. Calculate confidence intervals',
        '5. Check for significance',
        '6. Calculate effect size',
        '7. Check for novelty effects',
        '8. Save statistical results'
      ],
      outputFormat: 'JSON with statistical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            isSignificant: { type: 'boolean' },
            pValue: { type: 'number' },
            confidenceInterval: { type: 'array' },
            effectSize: { type: 'number' }
          }
        },
        analysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistics']
}));

export const resultsReportTask = defineTask('results-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Results Report - ${args.experimentName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Results Report Writer',
      task: 'Generate experiment results report',
      context: args,
      instructions: [
        '1. Summarize experiment',
        '2. Present key findings',
        '3. Declare winning variant',
        '4. Provide confidence assessment',
        '5. Add visualizations',
        '6. Recommend next steps',
        '7. Document limitations',
        '8. Save results report'
      ],
      outputFormat: 'JSON with results report'
    },
    outputSchema: {
      type: 'object',
      required: ['winningVariant', 'artifacts'],
      properties: {
        winningVariant: { type: 'string' },
        reportPath: { type: 'string' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'report']
}));
