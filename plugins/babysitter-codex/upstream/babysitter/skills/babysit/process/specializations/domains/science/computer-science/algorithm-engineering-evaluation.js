/**
 * @process computer-science/algorithm-engineering-evaluation
 * @description Conduct rigorous experimental evaluation of algorithm implementations with systematic benchmarking, statistical analysis, and reproducible methodology
 * @inputs {
 *   algorithmImplementations: array,
 *   benchmarkSuites: array,
 *   baselineAlgorithms: array,
 *   evaluationMetrics: array,
 *   hardwareSpecs: object,
 *   experimentalParameters: object
 * }
 * @outputs {
 *   experimentalResults: object,
 *   statisticalAnalysis: object,
 *   performanceComparison: object,
 *   reproducibilityPackage: object,
 *   visualizations: array,
 *   recommendations: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Experimental design
  const experimentalDesign = await ctx.task(experimentDesigner, {
    algorithms: inputs.algorithmImplementations,
    benchmarks: inputs.benchmarkSuites,
    baselines: inputs.baselineAlgorithms,
    metrics: inputs.evaluationMetrics,
    parameters: inputs.experimentalParameters
  });

  // Phase 2: Implementation verification
  const implementationVerification = await ctx.task(implementationVerifier, {
    implementations: inputs.algorithmImplementations,
    baselines: inputs.baselineAlgorithms,
    correctnessTests: experimentalDesign.correctnessTests
  });

  // Phase 3: Benchmark preparation
  const benchmarkPreparation = await ctx.task(benchmarkPreparer, {
    benchmarks: inputs.benchmarkSuites,
    experimentalDesign,
    hardwareSpecs: inputs.hardwareSpecs
  });

  // Phase 4: Experiment execution
  const experimentExecution = await ctx.task(experimentExecutor, {
    algorithms: inputs.algorithmImplementations,
    baselines: inputs.baselineAlgorithms,
    benchmarks: benchmarkPreparation.preparedBenchmarks,
    design: experimentalDesign,
    hardware: inputs.hardwareSpecs
  });

  // Phase 5: Statistical analysis
  const statisticalAnalysis = await ctx.task(statisticalAnalyzer, {
    rawResults: experimentExecution.rawResults,
    metrics: inputs.evaluationMetrics,
    design: experimentalDesign
  });

  // Phase 6: Performance comparison
  const performanceComparison = await ctx.task(performanceComparator, {
    statisticalResults: statisticalAnalysis,
    algorithms: inputs.algorithmImplementations,
    baselines: inputs.baselineAlgorithms
  });

  // Phase 7: Visualization generation
  const visualizations = await ctx.task(visualizationGenerator, {
    statisticalAnalysis,
    performanceComparison,
    experimentalDesign,
    metrics: inputs.evaluationMetrics
  });

  // Phase 8: Review breakpoint
  await ctx.breakpoint('evaluation-review', {
    message: 'Review algorithm engineering evaluation results',
    experimentalDesign,
    statisticalAnalysis,
    performanceComparison,
    visualizations
  });

  // Phase 9: Reproducibility packaging
  const reproducibilityPackage = await ctx.task(reproducibilityPackager, {
    experimentalDesign,
    implementations: inputs.algorithmImplementations,
    benchmarks: benchmarkPreparation,
    results: experimentExecution,
    analysis: statisticalAnalysis
  });

  return {
    experimentalResults: experimentExecution,
    statisticalAnalysis,
    performanceComparison,
    reproducibilityPackage,
    visualizations: visualizations.figures,
    recommendations: performanceComparison.recommendations
  };
}

export const experimentDesigner = defineTask('experiment-designer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design experimental methodology',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'Algorithm engineering experimental design expert',
      task: 'Design rigorous experimental methodology for algorithm evaluation',
      context: args,
      instructions: [
        'Define experimental factors and levels',
        'Design randomization and blocking strategy',
        'Specify warmup and measurement protocols',
        'Define statistical power requirements',
        'Plan for confounding variable control',
        'Design correctness verification tests',
        'Specify measurement instrumentation',
        'Plan reproducibility documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        experimentalFactors: { type: 'array' },
        designType: { type: 'string' },
        randomizationStrategy: { type: 'object' },
        measurementProtocol: { type: 'object' },
        powerAnalysis: { type: 'object' },
        correctnessTests: { type: 'array' },
        instrumentation: { type: 'object' },
        replicationPlan: { type: 'object' }
      },
      required: ['experimentalFactors', 'designType', 'measurementProtocol', 'correctnessTests']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'experimental-design', 'methodology']
}));

export const implementationVerifier = defineTask('implementation-verifier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify algorithm implementations',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'dataflow-analysis-engine'],
    prompt: {
      role: 'Algorithm implementation verification expert',
      task: 'Verify correctness and quality of algorithm implementations',
      context: args,
      instructions: [
        'Run correctness tests on all implementations',
        'Verify output equivalence with baselines',
        'Check for implementation bugs or issues',
        'Verify asymptotic complexity claims',
        'Check memory usage patterns',
        'Identify potential optimization opportunities',
        'Verify numerical stability if applicable',
        'Document any implementation variations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        verificationResults: { type: 'array' },
        correctnessStatus: { type: 'object' },
        bugsFound: { type: 'array' },
        complexityVerification: { type: 'object' },
        memoryAnalysis: { type: 'object' },
        optimizationNotes: { type: 'array' }
      },
      required: ['verificationResults', 'correctnessStatus', 'complexityVerification']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'verification', 'correctness']
}));

export const benchmarkPreparer = defineTask('benchmark-preparer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare benchmark suite',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Benchmark preparation and validation expert',
      task: 'Prepare and validate benchmark suite for algorithm evaluation',
      context: args,
      instructions: [
        'Validate benchmark instance correctness',
        'Characterize benchmark difficulty distribution',
        'Identify benchmark coverage of algorithm behaviors',
        'Prepare instance generators if needed',
        'Set up benchmark harness and infrastructure',
        'Configure hardware environment',
        'Plan benchmark execution schedule',
        'Document benchmark provenance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        preparedBenchmarks: { type: 'array' },
        difficultyCharacterization: { type: 'object' },
        coverageAnalysis: { type: 'object' },
        generatorConfigs: { type: 'array' },
        harnessSetup: { type: 'object' },
        executionSchedule: { type: 'array' },
        provenanceDocumentation: { type: 'object' }
      },
      required: ['preparedBenchmarks', 'difficultyCharacterization', 'harnessSetup']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'benchmarking', 'preparation']
}));

export const experimentExecutor = defineTask('experiment-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute benchmark experiments',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'Experimental execution and monitoring expert',
      task: 'Execute benchmark experiments with careful measurement',
      context: args,
      instructions: [
        'Execute experiments following design protocol',
        'Monitor for anomalies during execution',
        'Collect all specified metrics',
        'Handle timeouts and failures gracefully',
        'Record system state and conditions',
        'Manage warmup and cooldown periods',
        'Collect memory and cache statistics',
        'Log all execution metadata'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        rawResults: { type: 'array' },
        executionMetadata: { type: 'object' },
        anomaliesDetected: { type: 'array' },
        failureLog: { type: 'array' },
        systemState: { type: 'object' },
        resourceUsage: { type: 'object' }
      },
      required: ['rawResults', 'executionMetadata', 'anomaliesDetected']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'execution', 'measurement']
}));

export const statisticalAnalyzer = defineTask('statistical-analyzer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform statistical analysis',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'latex-proof-formatter'],
    prompt: {
      role: 'Statistical analysis expert for algorithm experiments',
      task: 'Perform rigorous statistical analysis of experimental results',
      context: args,
      instructions: [
        'Compute summary statistics for all metrics',
        'Perform appropriate statistical tests',
        'Calculate confidence intervals',
        'Analyze variance components',
        'Test for statistical significance',
        'Identify outliers and their causes',
        'Compute effect sizes',
        'Perform multiple comparison corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        summaryStatistics: { type: 'object' },
        hypothesisTests: { type: 'array' },
        confidenceIntervals: { type: 'object' },
        varianceAnalysis: { type: 'object' },
        significanceResults: { type: 'array' },
        outlierAnalysis: { type: 'object' },
        effectSizes: { type: 'object' }
      },
      required: ['summaryStatistics', 'hypothesisTests', 'confidenceIntervals', 'significanceResults']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'statistics', 'analysis']
}));

export const performanceComparator = defineTask('performance-comparator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare algorithm performance',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'cache-simulator'],
    prompt: {
      role: 'Algorithm performance comparison expert',
      task: 'Conduct comprehensive performance comparison between algorithms',
      context: args,
      instructions: [
        'Rank algorithms by each metric',
        'Identify performance trade-offs',
        'Analyze scaling behavior',
        'Compare against theoretical predictions',
        'Identify instance types favoring each algorithm',
        'Quantify improvements over baselines',
        'Generate actionable recommendations',
        'Identify conditions for algorithm selection'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        rankings: { type: 'object' },
        tradeoffs: { type: 'array' },
        scalingAnalysis: { type: 'object' },
        theoreticalComparison: { type: 'object' },
        instanceAnalysis: { type: 'object' },
        improvements: { type: 'object' },
        recommendations: { type: 'object' },
        selectionGuidelines: { type: 'array' }
      },
      required: ['rankings', 'tradeoffs', 'scalingAnalysis', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'comparison', 'performance']
}));

export const visualizationGenerator = defineTask('visualization-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate result visualizations',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'Scientific visualization expert',
      task: 'Generate publication-quality visualizations of experimental results',
      context: args,
      instructions: [
        'Create performance comparison plots',
        'Generate scaling behavior charts',
        'Design statistical comparison visualizations',
        'Create instance difficulty heatmaps',
        'Generate trade-off frontier plots',
        'Design metric correlation visualizations',
        'Create distribution comparison plots',
        'Generate summary dashboard figures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        figures: { type: 'array' },
        plotSpecifications: { type: 'array' },
        dashboardDesign: { type: 'object' },
        figureCaptions: { type: 'array' },
        colorScheme: { type: 'object' }
      },
      required: ['figures', 'plotSpecifications', 'figureCaptions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'visualization', 'publication']
}));

export const reproducibilityPackager = defineTask('reproducibility-packager', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Package for reproducibility',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'Research reproducibility expert',
      task: 'Package experimental artifacts for full reproducibility',
      context: args,
      instructions: [
        'Document all experimental parameters',
        'Package source code and dependencies',
        'Include benchmark instances and generators',
        'Document hardware and software environment',
        'Create automation scripts for replication',
        'Package raw data and analysis scripts',
        'Write comprehensive methodology documentation',
        'Create verification tests for reproducibility'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        packageContents: { type: 'array' },
        environmentSpecification: { type: 'object' },
        automationScripts: { type: 'array' },
        dataArchive: { type: 'object' },
        methodologyDocument: { type: 'string' },
        verificationTests: { type: 'array' },
        reproducibilityChecklist: { type: 'array' }
      },
      required: ['packageContents', 'environmentSpecification', 'methodologyDocument']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['algorithm-engineering', 'reproducibility', 'packaging']
}));
