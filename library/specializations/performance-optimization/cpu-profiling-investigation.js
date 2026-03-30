/**
 * @process specializations/performance-optimization/cpu-profiling-investigation
 * @description CPU Profiling Investigation - Conduct systematic CPU profiling to identify performance bottlenecks
 * including profiling environment setup, flame graph generation, hot code path identification, and optimization recommendations.
 * @inputs { projectName: string, targetApplication: string, profilingTool?: string, duration?: number }
 * @outputs { success: boolean, flameGraphPath: string, hotspots: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/cpu-profiling-investigation', {
 *   projectName: 'Payment Service',
 *   targetApplication: 'payment-api',
 *   profilingTool: 'async-profiler',
 *   duration: 60,
 *   workloadType: 'production-traffic'
 * });
 *
 * @references
 * - Flame Graphs: https://www.brendangregg.com/flamegraphs.html
 * - async-profiler: https://github.com/jvm-profiling-tools/async-profiler
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    profilingTool = 'async-profiler',
    duration = 60,
    workloadType = 'synthetic',
    outputDir = 'cpu-profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CPU Profiling Investigation for ${projectName}`);

  // Phase 1: Setup Profiling Environment
  const setupResult = await ctx.task(setupProfilingEnvironmentTask, {
    projectName, targetApplication, profilingTool, outputDir
  });
  artifacts.push(...setupResult.artifacts);

  // Phase 2: Choose Profiling Tools
  const toolSelection = await ctx.task(selectProfilingToolsTask, {
    projectName, targetApplication, profilingTool, outputDir
  });
  artifacts.push(...toolSelection.artifacts);

  // Phase 3: Execute Workload Under Profiler
  const profilingExecution = await ctx.task(executeProfilingTask, {
    projectName, targetApplication, profilingTool, duration, workloadType, outputDir
  });
  artifacts.push(...profilingExecution.artifacts);

  await ctx.breakpoint({
    question: `Profiling completed. ${profilingExecution.sampleCount} samples collected. Generate flame graphs?`,
    title: 'Profiling Data Review',
    context: { runId: ctx.runId, profilingExecution }
  });

  // Phase 4: Generate Flame Graphs
  const flameGraphs = await ctx.task(generateFlameGraphsTask, {
    projectName, profilingData: profilingExecution.data, outputDir
  });
  artifacts.push(...flameGraphs.artifacts);

  // Phase 5: Identify Hot Code Paths
  const hotspots = await ctx.task(identifyHotCodePathsTask, {
    projectName, profilingData: profilingExecution.data, flameGraphs, outputDir
  });
  artifacts.push(...hotspots.artifacts);

  // Phase 6: Analyze CPU Utilization Patterns
  const cpuAnalysis = await ctx.task(analyzeCPUPatternsTask, {
    projectName, profilingData: profilingExecution.data, hotspots, outputDir
  });
  artifacts.push(...cpuAnalysis.artifacts);

  // Phase 7: Document Findings and Recommendations
  const findings = await ctx.task(documentFindingsTask, {
    projectName, hotspots, cpuAnalysis, flameGraphs, outputDir
  });
  artifacts.push(...findings.artifacts);

  // Phase 8: Prioritize Optimization Opportunities
  const priorities = await ctx.task(prioritizeOptimizationsTask, {
    projectName, hotspots, findings, outputDir
  });
  artifacts.push(...priorities.artifacts);

  await ctx.breakpoint({
    question: `Found ${hotspots.hotspots.length} hotspots. Top: ${hotspots.hotspots[0]?.name}. Review recommendations?`,
    title: 'CPU Profiling Results',
    context: { runId: ctx.runId, hotspots: hotspots.hotspots, recommendations: priorities.recommendations }
  });

  return {
    success: true,
    projectName,
    flameGraphPath: flameGraphs.flameGraphPath,
    hotspots: hotspots.hotspots,
    cpuAnalysis: cpuAnalysis.analysis,
    recommendations: priorities.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/cpu-profiling-investigation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const setupProfilingEnvironmentTask = defineTask('setup-profiling-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Profiling Environment - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Setup CPU profiling environment',
      context: args,
      instructions: [
        '1. Verify profiling tools are installed',
        '2. Configure application for profiling',
        '3. Set up profiling agent',
        '4. Configure symbol resolution',
        '5. Test profiling connectivity'
      ],
      outputFormat: 'JSON with setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'setup']
}));

export const selectProfilingToolsTask = defineTask('select-profiling-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Profiling Tools - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Select appropriate CPU profiling tools',
      context: args,
      instructions: [
        '1. Evaluate available profiling tools',
        '2. Consider overhead vs accuracy tradeoffs',
        '3. Select primary profiling tool',
        '4. Configure tool parameters',
        '5. Document tool selection rationale'
      ],
      outputFormat: 'JSON with tool selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'artifacts'],
      properties: {
        selectedTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'tools']
}));

export const executeProfilingTask = defineTask('execute-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Profiling - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Execute CPU profiling under workload',
      context: args,
      instructions: [
        '1. Start profiler with configured parameters',
        '2. Execute representative workload',
        '3. Collect profiling samples',
        '4. Monitor profiling overhead',
        '5. Stop profiler and export data'
      ],
      outputFormat: 'JSON with profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'sampleCount', 'artifacts'],
      properties: {
        data: { type: 'object' },
        sampleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'execution']
}));

export const generateFlameGraphsTask = defineTask('generate-flame-graphs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Flame Graphs - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Generate flame graphs from profiling data',
      context: args,
      instructions: [
        '1. Convert profiling data to flame graph format',
        '2. Generate CPU flame graph',
        '3. Generate off-CPU flame graph if available',
        '4. Create interactive SVG',
        '5. Document flame graph interpretation'
      ],
      outputFormat: 'JSON with flame graph paths'
    },
    outputSchema: {
      type: 'object',
      required: ['flameGraphPath', 'artifacts'],
      properties: {
        flameGraphPath: { type: 'string' },
        offCpuFlameGraphPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'flame-graphs']
}));

export const identifyHotCodePathsTask = defineTask('identify-hot-code-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Hot Code Paths - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify hot code paths from profiling data',
      context: args,
      instructions: [
        '1. Analyze stack traces by CPU time',
        '2. Identify top CPU consumers',
        '3. Categorize by function/method',
        '4. Calculate percentage of total CPU',
        '5. Document hotspot locations'
      ],
      outputFormat: 'JSON with hotspots'
    },
    outputSchema: {
      type: 'object',
      required: ['hotspots', 'artifacts'],
      properties: {
        hotspots: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'hotspots']
}));

export const analyzeCPUPatternsTask = defineTask('analyze-cpu-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze CPU Patterns - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Analyze CPU utilization patterns',
      context: args,
      instructions: [
        '1. Analyze CPU usage over time',
        '2. Identify CPU spikes',
        '3. Correlate with application events',
        '4. Identify threading issues',
        '5. Document CPU patterns'
      ],
      outputFormat: 'JSON with CPU analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'analysis']
}));

export const documentFindingsTask = defineTask('document-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Findings - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Document profiling findings and recommendations',
      context: args,
      instructions: [
        '1. Summarize profiling results',
        '2. Document identified hotspots',
        '3. Explain CPU patterns',
        '4. Provide optimization recommendations',
        '5. Create profiling report'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'documentation']
}));

export const prioritizeOptimizationsTask = defineTask('prioritize-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prioritize Optimizations - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: {
      role: 'Performance Engineer',
      task: 'Prioritize optimization opportunities',
      context: args,
      instructions: [
        '1. Rank hotspots by impact',
        '2. Estimate optimization effort',
        '3. Calculate ROI for each optimization',
        '4. Create prioritized optimization list',
        '5. Document optimization roadmap'
      ],
      outputFormat: 'JSON with prioritized recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'cpu-profiling', 'prioritization']
}));
