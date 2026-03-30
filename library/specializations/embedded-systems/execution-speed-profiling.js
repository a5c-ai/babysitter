/**
 * @process specializations/embedded-systems/execution-speed-profiling
 * @description Execution Speed Profiling - Profiling code execution to identify bottlenecks, measure function timing,
 * and optimize critical paths using cycle counters, profiling tools, and timing instrumentation.
 * @inputs { projectName: string, targetMcu: string, criticalPaths?: array, targetTiming?: object, outputDir?: string }
 * @outputs { success: boolean, profilingResults: object, hotspots: array, optimizations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/execution-speed-profiling', {
 *   projectName: 'MotorController',
 *   targetMcu: 'STM32F407',
 *   criticalPaths: ['control_loop', 'pwm_update', 'adc_read'],
 *   targetTiming: { control_loop: '10us', pwm_update: '5us' }
 * });
 *
 * @references
 * - Profiling Embedded Systems: https://interrupt.memfault.com/blog/profiling-firmware-on-cortex-m
 * - Cycle Counters: https://www.embedded.com/using-the-cortex-m-cycle-counter/
 * - Performance Optimization: https://www.embedded.com/performance-optimization-for-embedded-systems/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    criticalPaths = [],
    targetTiming = {},
    profilingMethod = 'cycle-counter',
    samplingRate = '1kHz',
    outputDir = 'profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Execution Speed Profiling: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Method: ${profilingMethod}`);

  // ============================================================================
  // PHASE 1: PROFILING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Profiling Infrastructure');

  const profilingSetup = await ctx.task(profilingSetupTask, {
    projectName,
    targetMcu,
    profilingMethod,
    samplingRate,
    outputDir
  });

  artifacts.push(...profilingSetup.artifacts);

  // ============================================================================
  // PHASE 2: INSTRUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Instrumenting Code');

  const instrumentation = await ctx.task(codeInstrumentationTask, {
    projectName,
    criticalPaths,
    profilingSetup,
    outputDir
  });

  artifacts.push(...instrumentation.artifacts);

  // ============================================================================
  // PHASE 3: PROFILING EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Running Profiling Session');

  const profilingExecution = await ctx.task(profilingExecutionTask, {
    projectName,
    instrumentation,
    criticalPaths,
    outputDir
  });

  artifacts.push(...profilingExecution.artifacts);

  // ============================================================================
  // PHASE 4: HOTSPOT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Hotspots');

  const hotspotAnalysis = await ctx.task(hotspotAnalysisTask, {
    projectName,
    profilingExecution,
    targetTiming,
    outputDir
  });

  artifacts.push(...hotspotAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CALL GRAPH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Call Graph');

  const callGraphAnalysis = await ctx.task(callGraphAnalysisTask, {
    projectName,
    profilingExecution,
    hotspotAnalysis,
    outputDir
  });

  artifacts.push(...callGraphAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Optimization Recommendations');

  const optimizationRecommendations = await ctx.task(speedOptimizationTask, {
    projectName,
    hotspotAnalysis,
    callGraphAnalysis,
    targetTiming,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Profiling Report');

  const report = await ctx.task(profilingReportTask, {
    projectName,
    profilingExecution,
    hotspotAnalysis,
    callGraphAnalysis,
    optimizationRecommendations,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Execution Speed Profiling Complete for ${projectName}. ${hotspotAnalysis.hotspots.length} hotspots identified. Review results?`,
    title: 'Profiling Complete',
    context: {
      runId: ctx.runId,
      summary: {
        functionsProfiled: profilingExecution.functionCount,
        hotspots: hotspotAnalysis.hotspots.length,
        criticalPathsMeetTarget: hotspotAnalysis.meetingTarget,
        optimizationCount: optimizationRecommendations.recommendations.length
      },
      files: [
        { path: report.reportPath, format: 'markdown', label: 'Profiling Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    profilingResults: {
      functionCount: profilingExecution.functionCount,
      totalCycles: profilingExecution.totalCycles,
      measurements: profilingExecution.measurements
    },
    hotspots: hotspotAnalysis.hotspots,
    optimizations: optimizationRecommendations.recommendations,
    callGraph: callGraphAnalysis.graph,
    reportPath: report.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/execution-speed-profiling',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const profilingSetupTask = defineTask('profiling-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Profiling Setup - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Set up profiling infrastructure',
      context: args,
      instructions: [
        '1. Configure DWT cycle counter',
        '2. Set up timing macros',
        '3. Configure trace output',
        '4. Set up profiling buffers',
        '5. Configure sampling timer',
        '6. Set up PC sampling',
        '7. Configure ITM/SWO',
        '8. Create profiling library',
        '9. Add compiler support',
        '10. Document setup'
      ],
      outputFormat: 'JSON with profiling setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'macros', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        macros: { type: 'array', items: { type: 'string' } },
        traceEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'setup']
}));

export const codeInstrumentationTask = defineTask('code-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Instrumentation - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Instrument code for profiling',
      context: args,
      instructions: [
        '1. Add entry/exit markers',
        '2. Instrument critical paths',
        '3. Add timing measurements',
        '4. Insert checkpoint markers',
        '5. Configure auto-instrumentation',
        '6. Add ISR profiling',
        '7. Minimize overhead',
        '8. Add conditional profiling',
        '9. Create profiling builds',
        '10. Document instrumentation'
      ],
      outputFormat: 'JSON with instrumentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['instrumentedFunctions', 'overhead', 'artifacts'],
      properties: {
        instrumentedFunctions: { type: 'array', items: { type: 'string' } },
        overhead: { type: 'string' },
        markers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'instrumentation']
}));

export const profilingExecutionTask = defineTask('profiling-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Profiling Execution - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Execute profiling session',
      context: args,
      instructions: [
        '1. Run profiling build',
        '2. Collect timing data',
        '3. Gather cycle counts',
        '4. Collect call counts',
        '5. Measure ISR timing',
        '6. Collect trace data',
        '7. Export measurements',
        '8. Calculate statistics',
        '9. Verify data quality',
        '10. Document results'
      ],
      outputFormat: 'JSON with profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'functionCount', 'totalCycles', 'artifacts'],
      properties: {
        measurements: { type: 'array', items: { type: 'object' } },
        functionCount: { type: 'number' },
        totalCycles: { type: 'number' },
        isrMeasurements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'execution']
}));

export const hotspotAnalysisTask = defineTask('hotspot-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Hotspot Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze performance hotspots',
      context: args,
      instructions: [
        '1. Identify top consumers',
        '2. Calculate CPU percentages',
        '3. Find timing outliers',
        '4. Analyze worst cases',
        '5. Check against targets',
        '6. Identify bottlenecks',
        '7. Analyze call frequency',
        '8. Check loop performance',
        '9. Rank hotspots',
        '10. Document findings'
      ],
      outputFormat: 'JSON with hotspot analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['hotspots', 'meetingTarget', 'artifacts'],
      properties: {
        hotspots: { type: 'array', items: { type: 'object' } },
        meetingTarget: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        worstCases: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'hotspots']
}));

export const callGraphAnalysisTask = defineTask('call-graph-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Call Graph Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze call graph',
      context: args,
      instructions: [
        '1. Build call graph',
        '2. Calculate inclusive time',
        '3. Calculate exclusive time',
        '4. Identify call chains',
        '5. Find deep recursion',
        '6. Analyze critical paths',
        '7. Identify common paths',
        '8. Calculate path costs',
        '9. Visualize graph',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with call graph analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['graph', 'criticalPaths', 'artifacts'],
      properties: {
        graph: { type: 'object' },
        criticalPaths: { type: 'array', items: { type: 'object' } },
        deepCalls: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'call-graph']
}));

export const speedOptimizationTask = defineTask('speed-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Optimization Recommendations - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Generate speed optimization recommendations',
      context: args,
      instructions: [
        '1. Analyze hotspot causes',
        '2. Recommend algorithm changes',
        '3. Suggest loop optimizations',
        '4. Recommend inlining',
        '5. Suggest memory optimization',
        '6. Recommend compiler flags',
        '7. Suggest hardware acceleration',
        '8. Recommend DMA usage',
        '9. Prioritize recommendations',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'expectedSpeedup', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        expectedSpeedup: { type: 'object' },
        implementationEffort: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'optimization']
}));

export const profilingReportTask = defineTask('profiling-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Profiling Report - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate profiling report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Present timing data',
        '3. Document hotspots',
        '4. Include call graph',
        '5. Present recommendations',
        '6. Add visualizations',
        '7. Include methodology',
        '8. Add appendix data',
        '9. Create action items',
        '10. Format report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'profiling', 'reporting']
}));
