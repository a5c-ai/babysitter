/**
 * @process specializations/performance-optimization/distributed-tracing-implementation
 * @description Distributed Tracing Implementation - Implement comprehensive distributed tracing for microservices
 * including context propagation, span configuration, sampling strategies, and trace analysis.
 * @inputs { projectName: string, tracingBackend: string, services: array }
 * @outputs { success: boolean, tracingConfig: object, services: array, samplingRate: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/distributed-tracing-implementation', {
 *   projectName: 'E-commerce Platform',
 *   tracingBackend: 'jaeger',
 *   services: ['api-gateway', 'catalog-service', 'cart-service', 'payment-service']
 * });
 *
 * @references
 * - OpenTelemetry: https://opentelemetry.io/docs/
 * - Jaeger: https://www.jaegertracing.io/docs/
 * - Zipkin: https://zipkin.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    tracingBackend = 'jaeger',
    services = [],
    outputDir = 'distributed-tracing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Distributed Tracing Implementation for ${projectName}`);

  // Phase 1: Select Tracing Backend
  const backendSelection = await ctx.task(selectTracingBackendTask, { projectName, tracingBackend, outputDir });
  artifacts.push(...backendSelection.artifacts);

  // Phase 2: Deploy Tracing Infrastructure
  const infrastructure = await ctx.task(deployTracingInfrastructureTask, { projectName, tracingBackend, outputDir });
  artifacts.push(...infrastructure.artifacts);

  // Phase 3: Instrument Services
  const instrumentation = await ctx.task(instrumentServicesForTracingTask, { projectName, services, tracingBackend, outputDir });
  artifacts.push(...instrumentation.artifacts);

  await ctx.breakpoint({
    question: `Instrumented ${instrumentation.instrumentedCount} services. Configure context propagation?`,
    title: 'Service Instrumentation',
    context: { runId: ctx.runId, instrumentation }
  });

  // Phase 4: Configure Context Propagation
  const contextPropagation = await ctx.task(configureContextPropagationTask, { projectName, services, outputDir });
  artifacts.push(...contextPropagation.artifacts);

  // Phase 5: Define Span Structure
  const spanStructure = await ctx.task(defineSpanStructureTask, { projectName, services, outputDir });
  artifacts.push(...spanStructure.artifacts);

  // Phase 6: Configure Sampling Strategy
  const sampling = await ctx.task(configureSamplingStrategyTask, { projectName, outputDir });
  artifacts.push(...sampling.artifacts);

  // Phase 7: Set Up Trace Analysis
  const traceAnalysis = await ctx.task(setupTraceAnalysisTask, { projectName, tracingBackend, outputDir });
  artifacts.push(...traceAnalysis.artifacts);

  // Phase 8: Create Service Maps
  const serviceMaps = await ctx.task(createServiceMapsTask, { projectName, services, outputDir });
  artifacts.push(...serviceMaps.artifacts);

  // Phase 9: Document Tracing Implementation
  const documentation = await ctx.task(documentTracingImplementationTask, { projectName, instrumentation, sampling, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Distributed tracing complete. Sampling rate: ${sampling.rate}%. Service map created. Accept?`,
    title: 'Distributed Tracing Review',
    context: { runId: ctx.runId, sampling, serviceMaps }
  });

  return {
    success: true,
    projectName,
    tracingConfig: { backend: tracingBackend, infrastructure: infrastructure.deployed },
    services: instrumentation.instrumentedServices,
    samplingRate: sampling.rate,
    serviceMaps: serviceMaps.maps,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/distributed-tracing-implementation', timestamp: startTime, outputDir }
  };
}

export const selectTracingBackendTask = defineTask('select-tracing-backend', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Tracing Backend - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Select tracing backend', context: args,
      instructions: ['1. Evaluate Jaeger, Zipkin, Tempo', '2. Consider scalability', '3. Evaluate features', '4. Select backend', '5. Document selection'],
      outputFormat: 'JSON with backend selection' },
    outputSchema: { type: 'object', required: ['backend', 'artifacts'], properties: { backend: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'backend']
}));

export const deployTracingInfrastructureTask = defineTask('deploy-tracing-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy Tracing Infrastructure - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Deploy tracing infrastructure', context: args,
      instructions: ['1. Deploy collector', '2. Deploy storage', '3. Deploy UI', '4. Configure networking', '5. Document deployment'],
      outputFormat: 'JSON with infrastructure deployment' },
    outputSchema: { type: 'object', required: ['deployed', 'artifacts'], properties: { deployed: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'infrastructure']
}));

export const instrumentServicesForTracingTask = defineTask('instrument-services-for-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Instrument Services - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Instrument services for tracing', context: args,
      instructions: ['1. Add tracing libraries', '2. Configure exporters', '3. Add instrumentation code', '4. Verify spans', '5. Document instrumentation'],
      outputFormat: 'JSON with instrumentation results' },
    outputSchema: { type: 'object', required: ['instrumentedCount', 'instrumentedServices', 'artifacts'], properties: { instrumentedCount: { type: 'number' }, instrumentedServices: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'instrumentation']
}));

export const configureContextPropagationTask = defineTask('configure-context-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Context Propagation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure context propagation', context: args,
      instructions: ['1. Choose propagation format', '2. Configure HTTP headers', '3. Configure messaging', '4. Handle async contexts', '5. Document propagation'],
      outputFormat: 'JSON with context propagation config' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'propagation']
}));

export const defineSpanStructureTask = defineTask('define-span-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Span Structure - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Define span structure', context: args,
      instructions: ['1. Define span names', '2. Configure attributes', '3. Set span kinds', '4. Configure events', '5. Document structure'],
      outputFormat: 'JSON with span structure' },
    outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'spans']
}));

export const configureSamplingStrategyTask = defineTask('configure-sampling-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Sampling Strategy - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure sampling strategy', context: args,
      instructions: ['1. Choose sampling method', '2. Set sampling rate', '3. Configure adaptive sampling', '4. Handle errors always', '5. Document strategy'],
      outputFormat: 'JSON with sampling configuration' },
    outputSchema: { type: 'object', required: ['rate', 'artifacts'], properties: { rate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'sampling']
}));

export const setupTraceAnalysisTask = defineTask('setup-trace-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Trace Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Setup trace analysis', context: args,
      instructions: ['1. Configure trace search', '2. Setup latency analysis', '3. Configure error analysis', '4. Add saved queries', '5. Document analysis'],
      outputFormat: 'JSON with trace analysis setup' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'analysis']
}));

export const createServiceMapsTask = defineTask('create-service-maps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Service Maps - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Create service maps', context: args,
      instructions: ['1. Generate dependency graph', '2. Add latency annotations', '3. Show error rates', '4. Configure filters', '5. Document maps'],
      outputFormat: 'JSON with service maps' },
    outputSchema: { type: 'object', required: ['maps', 'artifacts'], properties: { maps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'service-maps']
}));

export const documentTracingImplementationTask = defineTask('document-tracing-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Tracing Implementation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document tracing implementation', context: args,
      instructions: ['1. Document architecture', '2. Document instrumentation', '3. Add usage guide', '4. Include troubleshooting', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tracing', 'documentation']
}));
