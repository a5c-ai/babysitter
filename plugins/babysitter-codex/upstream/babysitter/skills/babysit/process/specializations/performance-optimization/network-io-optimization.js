/**
 * @process specializations/performance-optimization/network-io-optimization
 * @description Network I/O Optimization - Optimize network I/O for improved latency and throughput including
 * connection pooling, TCP tuning, compression, and request batching.
 * @inputs { projectName: string, targetServices: array, protocolType?: string }
 * @outputs { success: boolean, optimizations: array, latencyImprovement: number, throughputImprovement: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/network-io-optimization', {
 *   projectName: 'Microservices Platform',
 *   targetServices: ['api-gateway', 'auth-service', 'data-service'],
 *   protocolType: 'http2'
 * });
 *
 * @references
 * - High Performance Browser Networking: https://hpbn.co/
 * - Wireshark: https://www.wireshark.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetServices = [],
    protocolType = 'http',
    outputDir = 'network-io-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Network I/O Optimization for ${projectName}`);

  // Phase 1: Analyze Network Traffic Patterns
  const trafficAnalysis = await ctx.task(analyzeNetworkTrafficTask, { projectName, targetServices, outputDir });
  artifacts.push(...trafficAnalysis.artifacts);

  // Phase 2: Identify Chatty Communication
  const chattyCommunication = await ctx.task(identifyChattyCommunicationTask, { projectName, trafficAnalysis, outputDir });
  artifacts.push(...chattyCommunication.artifacts);

  await ctx.breakpoint({
    question: `Found ${chattyCommunication.issues.length} chatty communication patterns. Review optimizations?`,
    title: 'Network Traffic Analysis',
    context: { runId: ctx.runId, chattyCommunication }
  });

  // Phase 3: Implement Connection Pooling
  const connectionPooling = await ctx.task(implementConnectionPoolingTask, { projectName, targetServices, outputDir });
  artifacts.push(...connectionPooling.artifacts);

  // Phase 4: Configure TCP Parameters
  const tcpTuning = await ctx.task(configureTCPParametersTask, { projectName, outputDir });
  artifacts.push(...tcpTuning.artifacts);

  // Phase 5: Enable Compression Where Appropriate
  const compression = await ctx.task(enableCompressionTask, { projectName, trafficAnalysis, outputDir });
  artifacts.push(...compression.artifacts);

  // Phase 6: Implement Request Batching
  const batching = await ctx.task(implementRequestBatchingTask, { projectName, chattyCommunication, outputDir });
  artifacts.push(...batching.artifacts);

  // Phase 7: Optimize Protocol Choices
  const protocolOpt = await ctx.task(optimizeProtocolChoicesTask, { projectName, protocolType, outputDir });
  artifacts.push(...protocolOpt.artifacts);

  // Phase 8: Benchmark Network Improvements
  const benchmarks = await ctx.task(benchmarkNetworkImprovementsTask, { projectName, connectionPooling, tcpTuning, compression, batching, outputDir });
  artifacts.push(...benchmarks.artifacts);

  await ctx.breakpoint({
    question: `Network optimization complete. Latency: -${benchmarks.latencyImprovement}%. Throughput: +${benchmarks.throughputImprovement}%. Accept?`,
    title: 'Network I/O Results',
    context: { runId: ctx.runId, benchmarks }
  });

  return {
    success: true,
    projectName,
    optimizations: [...connectionPooling.optimizations, ...tcpTuning.optimizations, ...compression.optimizations, ...batching.optimizations],
    latencyImprovement: benchmarks.latencyImprovement,
    throughputImprovement: benchmarks.throughputImprovement,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/network-io-optimization', timestamp: startTime, outputDir }
  };
}

export const analyzeNetworkTrafficTask = defineTask('analyze-network-traffic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Network Traffic - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze network traffic patterns', context: args,
      instructions: ['1. Capture network traffic', '2. Analyze request patterns', '3. Measure latencies', '4. Calculate bandwidth', '5. Document patterns'],
      outputFormat: 'JSON with traffic analysis' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'analysis']
}));

export const identifyChattyCommunicationTask = defineTask('identify-chatty-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Chatty Communication - ${args.projectName}`,
  agent: {
    name: 'latency-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Identify chatty communication patterns', context: args,
      instructions: ['1. Find excessive round-trips', '2. Identify small requests', '3. Find redundant calls', '4. Analyze request frequency', '5. Document issues'],
      outputFormat: 'JSON with chatty communication issues' },
    outputSchema: { type: 'object', required: ['issues', 'artifacts'], properties: { issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'chatty']
}));

export const implementConnectionPoolingTask = defineTask('implement-connection-pooling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Connection Pooling - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement connection pooling', context: args,
      instructions: ['1. Configure connection pools', '2. Set pool sizes', '3. Configure timeouts', '4. Add health checks', '5. Document configuration'],
      outputFormat: 'JSON with connection pooling details' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'connection-pooling']
}));

export const configureTCPParametersTask = defineTask('configure-tcp-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure TCP Parameters - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure TCP parameters', context: args,
      instructions: ['1. Tune TCP buffers', '2. Enable TCP fastopen', '3. Configure keep-alive', '4. Tune congestion control', '5. Document settings'],
      outputFormat: 'JSON with TCP configuration' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'tcp']
}));

export const enableCompressionTask = defineTask('enable-compression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Enable Compression - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Enable compression where appropriate', context: args,
      instructions: ['1. Identify compressible content', '2. Configure gzip/brotli', '3. Set compression levels', '4. Test compression ratios', '5. Document configuration'],
      outputFormat: 'JSON with compression details' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'compression']
}));

export const implementRequestBatchingTask = defineTask('implement-request-batching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Request Batching - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement request batching', context: args,
      instructions: ['1. Identify batchable requests', '2. Implement batching logic', '3. Configure batch sizes', '4. Add timeout handling', '5. Document batching'],
      outputFormat: 'JSON with batching details' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'batching']
}));

export const optimizeProtocolChoicesTask = defineTask('optimize-protocol-choices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Protocol Choices - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Optimize protocol choices', context: args,
      instructions: ['1. Evaluate HTTP/2/3', '2. Consider gRPC', '3. Evaluate WebSocket', '4. Implement improvements', '5. Document changes'],
      outputFormat: 'JSON with protocol optimizations' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'protocols']
}));

export const benchmarkNetworkImprovementsTask = defineTask('benchmark-network-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Network Improvements - ${args.projectName}`,
  agent: {
    name: 'latency-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Benchmark network improvements', context: args,
      instructions: ['1. Measure baseline latency', '2. Measure optimized latency', '3. Measure throughput', '4. Calculate improvements', '5. Document results'],
      outputFormat: 'JSON with benchmark results' },
    outputSchema: { type: 'object', required: ['latencyImprovement', 'throughputImprovement', 'artifacts'], properties: { latencyImprovement: { type: 'number' }, throughputImprovement: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'network-io', 'benchmarking']
}));
