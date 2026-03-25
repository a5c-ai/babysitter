/**
 * @process specializations/cli-mcp-development/mcp-server-monitoring-debugging
 * @description MCP Server Monitoring and Debugging - Implement observability, logging, tracing,
 * and debugging tools for MCP server development and production environments.
 * @inputs { projectName: string, language: string, features?: array, environments?: array }
 * @outputs { success: boolean, monitoring: object, debugging: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-server-monitoring-debugging', {
 *   projectName: 'mcp-server-observability',
 *   language: 'typescript',
 *   features: ['logging', 'tracing', 'metrics', 'inspector'],
 *   environments: ['development', 'production']
 * });
 *
 * @references
 * - MCP Inspector: https://modelcontextprotocol.io/docs/tools/inspector
 * - OpenTelemetry: https://opentelemetry.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    features = ['logging', 'tracing', 'metrics'],
    environments = ['development', 'production'],
    outputDir = 'mcp-server-monitoring-debugging'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Server Monitoring and Debugging: ${projectName}`);

  const observabilityArchitecture = await ctx.task(observabilityArchitectureTask, { projectName, language, features, outputDir });
  artifacts.push(...observabilityArchitecture.artifacts);

  const structuredLogging = await ctx.task(structuredLoggingTask, { projectName, language, outputDir });
  artifacts.push(...structuredLogging.artifacts);

  const distributedTracing = await ctx.task(distributedTracingTask, { projectName, language, outputDir });
  artifacts.push(...distributedTracing.artifacts);

  const metricsCollection = await ctx.task(metricsCollectionTask, { projectName, language, outputDir });
  artifacts.push(...metricsCollection.artifacts);

  const mcpInspector = await ctx.task(mcpInspectorTask, { projectName, language, outputDir });
  artifacts.push(...mcpInspector.artifacts);

  const debuggingTools = await ctx.task(debuggingToolsTask, { projectName, language, outputDir });
  artifacts.push(...debuggingTools.artifacts);

  const errorTracking = await ctx.task(errorTrackingTask, { projectName, language, outputDir });
  artifacts.push(...errorTracking.artifacts);

  const alertingSetup = await ctx.task(alertingSetupTask, { projectName, environments, outputDir });
  artifacts.push(...alertingSetup.artifacts);

  const monitoringTesting = await ctx.task(monitoringTestingTask, { projectName, language, outputDir });
  artifacts.push(...monitoringTesting.artifacts);

  const monitoringDocumentation = await ctx.task(monitoringDocumentationTask, { projectName, features, environments, outputDir });
  artifacts.push(...monitoringDocumentation.artifacts);

  await ctx.breakpoint({
    question: `MCP Server Monitoring and Debugging complete with ${features.length} features. Review and approve?`,
    title: 'MCP Monitoring Complete',
    context: { runId: ctx.runId, summary: { projectName, features, environments } }
  });

  return {
    success: true,
    projectName,
    monitoring: { features, configPath: observabilityArchitecture.configPath },
    debugging: { inspectorPath: mcpInspector.inspectorPath },
    documentation: { path: monitoringDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/mcp-server-monitoring-debugging', timestamp: startTime }
  };
}

export const observabilityArchitectureTask = defineTask('observability-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Observability Architecture - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Observability Architect', task: 'Design observability architecture', context: args, instructions: ['1. Define observability pillars', '2. Plan instrumentation', '3. Design data pipeline', '4. Plan dashboards', '5. Generate architecture doc'], outputFormat: 'JSON with observability architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'architecture']
}));

export const structuredLoggingTask = defineTask('structured-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structured Logging - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Structured Logging Specialist', task: 'Implement structured logging', context: args, instructions: ['1. Configure logger', '2. Define log schema', '3. Add correlation IDs', '4. Configure outputs', '5. Generate logging code'], outputFormat: 'JSON with structured logging' },
    outputSchema: { type: 'object', required: ['loggingPath', 'artifacts'], properties: { loggingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'logging']
}));

export const distributedTracingTask = defineTask('distributed-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Distributed Tracing - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Distributed Tracing Specialist', task: 'Implement distributed tracing', context: args, instructions: ['1. Configure OpenTelemetry', '2. Add span instrumentation', '3. Propagate context', '4. Configure exporters', '5. Generate tracing code'], outputFormat: 'JSON with distributed tracing' },
    outputSchema: { type: 'object', required: ['tracingPath', 'artifacts'], properties: { tracingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'tracing']
}));

export const metricsCollectionTask = defineTask('metrics-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metrics Collection - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Metrics Collection Specialist', task: 'Implement metrics collection', context: args, instructions: ['1. Define MCP metrics', '2. Add counters and gauges', '3. Track latencies', '4. Configure Prometheus', '5. Generate metrics code'], outputFormat: 'JSON with metrics collection' },
    outputSchema: { type: 'object', required: ['metricsPath', 'artifacts'], properties: { metricsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'metrics']
}));

export const mcpInspectorTask = defineTask('mcp-inspector', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCP Inspector - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Inspector Specialist', task: 'Set up MCP inspector', context: args, instructions: ['1. Configure inspector', '2. Set up message logging', '3. Add protocol viewer', '4. Enable breakpoints', '5. Generate inspector config'], outputFormat: 'JSON with MCP inspector' },
    outputSchema: { type: 'object', required: ['inspectorPath', 'artifacts'], properties: { inspectorPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'debugging', 'inspector']
}));

export const debuggingToolsTask = defineTask('debugging-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debugging Tools - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Debugging Specialist', task: 'Implement debugging tools', context: args, instructions: ['1. Add debug mode', '2. Implement request replay', '3. Add state inspection', '4. Create debug CLI', '5. Generate debugging tools'], outputFormat: 'JSON with debugging tools' },
    outputSchema: { type: 'object', required: ['debugPath', 'artifacts'], properties: { debugPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'debugging', 'tools']
}));

export const errorTrackingTask = defineTask('error-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Tracking - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Error Tracking Specialist', task: 'Implement error tracking', context: args, instructions: ['1. Configure error capture', '2. Add stack trace handling', '3. Integrate Sentry/similar', '4. Add error grouping', '5. Generate error tracking code'], outputFormat: 'JSON with error tracking' },
    outputSchema: { type: 'object', required: ['errorPath', 'artifacts'], properties: { errorPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'errors']
}));

export const alertingSetupTask = defineTask('alerting-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alerting Setup - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Alerting Specialist', task: 'Set up alerting', context: args, instructions: ['1. Define alert rules', '2. Configure thresholds', '3. Set up notifications', '4. Create runbooks', '5. Generate alerting config'], outputFormat: 'JSON with alerting setup' },
    outputSchema: { type: 'object', required: ['alertingPath', 'artifacts'], properties: { alertingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'alerting']
}));

export const monitoringTestingTask = defineTask('monitoring-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Testing - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'Monitoring Testing Specialist', task: 'Test monitoring setup', context: args, instructions: ['1. Test log output', '2. Verify traces', '3. Check metrics', '4. Test alerts', '5. Generate test suite'], outputFormat: 'JSON with monitoring tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'testing']
}));

export const monitoringDocumentationTask = defineTask('monitoring-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'Monitoring Documentation Specialist', task: 'Document monitoring system', context: args, instructions: ['1. Document logging format', '2. Document metrics', '3. Add runbooks', '4. Document debugging', '5. Generate documentation'], outputFormat: 'JSON with monitoring documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'monitoring', 'documentation']
}));
