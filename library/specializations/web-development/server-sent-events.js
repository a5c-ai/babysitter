/**
 * @process specializations/web-development/server-sent-events
 * @description Server-Sent Events - Process for implementing server-sent events for real-time unidirectional data streaming.
 * @inputs { projectName: string }
 * @outputs { success: boolean, sseConfig: object, streams: array, artifacts: array }
 * @references - SSE: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, outputDir = 'server-sent-events' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Server-Sent Events: ${projectName}`);

  const sseSetup = await ctx.task(sseSetupTask, { projectName, outputDir });
  artifacts.push(...sseSetup.artifacts);

  const eventStreams = await ctx.task(eventStreamsTask, { projectName, outputDir });
  artifacts.push(...eventStreams.artifacts);

  const reconnectionSetup = await ctx.task(reconnectionSetupTask, { projectName, outputDir });
  artifacts.push(...reconnectionSetup.artifacts);

  const scalingSetup = await ctx.task(scalingSetupTask, { projectName, outputDir });
  artifacts.push(...scalingSetup.artifacts);

  await ctx.breakpoint({ question: `SSE implementation complete for ${projectName}. Approve?`, title: 'SSE Review', context: { runId: ctx.runId, streams: eventStreams.streams } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, sseConfig: sseSetup.config, streams: eventStreams.streams, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/server-sent-events', timestamp: startTime } };
}

export const sseSetupTask = defineTask('sse-setup', (args, taskCtx) => ({ kind: 'agent', title: `SSE Setup - ${args.projectName}`, agent: { name: 'sse-architect', prompt: { role: 'SSE Architect', task: 'Configure SSE server', context: args, instructions: ['1. Create SSE endpoint', '2. Configure headers', '3. Set up event format', '4. Configure keep-alive', '5. Set up compression', '6. Configure CORS', '7. Set up authentication', '8. Configure rate limiting', '9. Set up logging', '10. Document setup'], outputFormat: 'JSON with SSE setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'sse', 'setup'] }));

export const eventStreamsTask = defineTask('event-streams', (args, taskCtx) => ({ kind: 'agent', title: `Event Streams - ${args.projectName}`, agent: { name: 'event-streams-specialist', prompt: { role: 'Event Streams Specialist', task: 'Configure event streams', context: args, instructions: ['1. Define event types', '2. Create data format', '3. Set up event IDs', '4. Configure retry field', '5. Set up named events', '6. Configure comments', '7. Set up multi-line data', '8. Configure JSON events', '9. Set up client handling', '10. Document streams'], outputFormat: 'JSON with streams' }, outputSchema: { type: 'object', required: ['streams', 'artifacts'], properties: { streams: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'sse', 'streams'] }));

export const reconnectionSetupTask = defineTask('reconnection-setup', (args, taskCtx) => ({ kind: 'agent', title: `Reconnection Setup - ${args.projectName}`, agent: { name: 'reconnection-specialist', prompt: { role: 'Reconnection Specialist', task: 'Configure reconnection', context: args, instructions: ['1. Set up auto-reconnect', '2. Configure retry timing', '3. Set up last event ID', '4. Configure resume logic', '5. Set up fallback', '6. Configure error handling', '7. Set up connection state', '8. Configure backoff', '9. Set up monitoring', '10. Document reconnection'], outputFormat: 'JSON with reconnection' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'sse', 'reconnection'] }));

export const scalingSetupTask = defineTask('scaling-setup', (args, taskCtx) => ({ kind: 'agent', title: `Scaling Setup - ${args.projectName}`, agent: { name: 'sse-scaling-specialist', prompt: { role: 'SSE Scaling Specialist', task: 'Configure scaling', context: args, instructions: ['1. Set up connection pooling', '2. Configure load balancing', '3. Set up Redis pub/sub', '4. Configure horizontal scaling', '5. Set up health checks', '6. Configure monitoring', '7. Set up metrics', '8. Configure alerts', '9. Set up graceful shutdown', '10. Document scaling'], outputFormat: 'JSON with scaling' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'sse', 'scaling'] }));

export const documentationTask = defineTask('sse-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate SSE documentation', context: args, instructions: ['1. Create README', '2. Document server setup', '3. Create streams guide', '4. Document reconnection', '5. Create scaling guide', '6. Document events', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'sse', 'documentation'] }));
