/**
 * @process specializations/performance-optimization/microbenchmark-suite-development
 * @description Microbenchmark Suite Development - Develop comprehensive microbenchmark suite for measuring
 * component performance including JMH setup, benchmark design, statistical analysis, and CI integration.
 * @inputs { projectName: string, targetComponents: array, benchmarkFramework?: string }
 * @outputs { success: boolean, benchmarkSuite: object, baselineResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/microbenchmark-suite-development', {
 *   projectName: 'Data Processing Library',
 *   targetComponents: ['parser', 'transformer', 'serializer'],
 *   benchmarkFramework: 'jmh'
 * });
 *
 * @references
 * - JMH: https://openjdk.java.net/projects/code-tools/jmh/
 * - Benchmark.js: https://benchmarkjs.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetComponents = [],
    benchmarkFramework = 'jmh',
    outputDir = 'microbenchmark-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Microbenchmark Suite Development for ${projectName}`);

  // Phase 1: Select Benchmark Framework
  const frameworkSelection = await ctx.task(selectBenchmarkFrameworkTask, { projectName, benchmarkFramework, outputDir });
  artifacts.push(...frameworkSelection.artifacts);

  // Phase 2: Identify Components to Benchmark
  const componentAnalysis = await ctx.task(identifyBenchmarkComponentsTask, { projectName, targetComponents, outputDir });
  artifacts.push(...componentAnalysis.artifacts);

  // Phase 3: Design Benchmark Tests
  const benchmarkDesign = await ctx.task(designBenchmarkTestsTask, { projectName, componentAnalysis, outputDir });
  artifacts.push(...benchmarkDesign.artifacts);

  await ctx.breakpoint({
    question: `Designed ${benchmarkDesign.benchmarks.length} benchmarks for ${componentAnalysis.components.length} components. Implement?`,
    title: 'Benchmark Design Review',
    context: { runId: ctx.runId, benchmarkDesign }
  });

  // Phase 4: Implement Benchmark Code
  const implementation = await ctx.task(implementBenchmarkCodeTask, { projectName, benchmarkFramework, benchmarkDesign, outputDir });
  artifacts.push(...implementation.artifacts);

  // Phase 5: Configure Warm-up and Iterations
  const configuration = await ctx.task(configureBenchmarkParametersTask, { projectName, benchmarkFramework, outputDir });
  artifacts.push(...configuration.artifacts);

  // Phase 6: Run Baseline Benchmarks
  const baseline = await ctx.task(runBaselineBenchmarksTask, { projectName, implementation, outputDir });
  artifacts.push(...baseline.artifacts);

  // Phase 7: Analyze Statistical Significance
  const statistics = await ctx.task(analyzeStatisticalSignificanceTask, { projectName, baseline, outputDir });
  artifacts.push(...statistics.artifacts);

  // Phase 8: Integrate with CI
  const ciIntegration = await ctx.task(integrateBenchmarksWithCITask, { projectName, implementation, outputDir });
  artifacts.push(...ciIntegration.artifacts);

  // Phase 9: Document Benchmarks
  const documentation = await ctx.task(documentBenchmarkSuiteTask, { projectName, implementation, baseline, statistics, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Benchmark suite complete. ${implementation.benchmarkCount} benchmarks implemented. CI integrated: ${ciIntegration.integrated}. Accept?`,
    title: 'Microbenchmark Suite Review',
    context: { runId: ctx.runId, implementation, baseline }
  });

  return {
    success: true,
    projectName,
    benchmarkSuite: { framework: benchmarkFramework, benchmarkCount: implementation.benchmarkCount, components: componentAnalysis.components },
    baselineResults: baseline.results,
    statistics: statistics.analysis,
    ciIntegrated: ciIntegration.integrated,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/microbenchmark-suite-development', timestamp: startTime, outputDir }
  };
}

export const selectBenchmarkFrameworkTask = defineTask('select-benchmark-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Benchmark Framework - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Select benchmark framework', context: args,
      instructions: ['1. Evaluate JMH, Benchmark.js', '2. Consider language/platform', '3. Select framework', '4. Configure setup', '5. Document selection'],
      outputFormat: 'JSON with framework selection' },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'framework']
}));

export const identifyBenchmarkComponentsTask = defineTask('identify-benchmark-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Components to Benchmark - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Identify components to benchmark', context: args,
      instructions: ['1. Identify hot paths', '2. Find critical operations', '3. Select components', '4. Define interfaces', '5. Document components'],
      outputFormat: 'JSON with benchmark components' },
    outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'components']
}));

export const designBenchmarkTestsTask = defineTask('design-benchmark-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Benchmark Tests - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Design benchmark tests', context: args,
      instructions: ['1. Design test scenarios', '2. Define input variations', '3. Choose measurement modes', '4. Design state handling', '5. Document designs'],
      outputFormat: 'JSON with benchmark designs' },
    outputSchema: { type: 'object', required: ['benchmarks', 'artifacts'], properties: { benchmarks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'design']
}));

export const implementBenchmarkCodeTask = defineTask('implement-benchmark-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Benchmark Code - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement benchmark code', context: args,
      instructions: ['1. Create benchmark classes', '2. Implement setup/teardown', '3. Add annotations', '4. Handle state', '5. Document code'],
      outputFormat: 'JSON with benchmark implementation' },
    outputSchema: { type: 'object', required: ['benchmarkCount', 'artifacts'], properties: { benchmarkCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'implementation']
}));

export const configureBenchmarkParametersTask = defineTask('configure-benchmark-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Benchmark Parameters - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure warm-up and iterations', context: args,
      instructions: ['1. Set warm-up iterations', '2. Set measurement iterations', '3. Configure forks', '4. Set time units', '5. Document configuration'],
      outputFormat: 'JSON with benchmark parameters' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'configuration']
}));

export const runBaselineBenchmarksTask = defineTask('run-baseline-benchmarks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Baseline Benchmarks - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Run baseline benchmarks', context: args,
      instructions: ['1. Run all benchmarks', '2. Collect results', '3. Save baseline data', '4. Verify stability', '5. Document results'],
      outputFormat: 'JSON with baseline results' },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'baseline']
}));

export const analyzeStatisticalSignificanceTask = defineTask('analyze-statistical-significance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Statistical Significance - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze statistical significance', context: args,
      instructions: ['1. Calculate variance', '2. Compute confidence intervals', '3. Check for outliers', '4. Assess reliability', '5. Document analysis'],
      outputFormat: 'JSON with statistical analysis' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'statistics']
}));

export const integrateBenchmarksWithCITask = defineTask('integrate-benchmarks-with-ci', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate with CI - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Integrate benchmarks with CI', context: args,
      instructions: ['1. Create CI job', '2. Configure benchmark execution', '3. Add comparison logic', '4. Set regression alerts', '5. Document integration'],
      outputFormat: 'JSON with CI integration' },
    outputSchema: { type: 'object', required: ['integrated', 'artifacts'], properties: { integrated: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'ci']
}));

export const documentBenchmarkSuiteTask = defineTask('document-benchmark-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Benchmark Suite - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Document benchmark suite', context: args,
      instructions: ['1. Document all benchmarks', '2. Add usage instructions', '3. Include baseline data', '4. Add interpretation guide', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'microbenchmark', 'documentation']
}));
