/**
 * @process specializations/web-development/websocket-realtime
 * @description WebSocket Real-time Communication - Process for implementing real-time communication with WebSockets, Socket.io, and connection management.
 * @inputs { projectName: string, library?: string }
 * @outputs { success: boolean, websocketConfig: object, channels: array, artifacts: array }
 * @references - WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, library = 'socket.io', outputDir = 'websocket-realtime' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting WebSocket Real-time: ${projectName}`);

  const websocketSetup = await ctx.task(websocketSetupTask, { projectName, library, outputDir });
  artifacts.push(...websocketSetup.artifacts);

  const channelsSetup = await ctx.task(channelsSetupTask, { projectName, outputDir });
  artifacts.push(...channelsSetup.artifacts);

  const connectionManagement = await ctx.task(connectionManagementTask, { projectName, outputDir });
  artifacts.push(...connectionManagement.artifacts);

  const scalingSetup = await ctx.task(scalingSetupTask, { projectName, outputDir });
  artifacts.push(...scalingSetup.artifacts);

  await ctx.breakpoint({ question: `WebSocket implementation complete for ${projectName}. Approve?`, title: 'WebSocket Review', context: { runId: ctx.runId, channels: channelsSetup.channels } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, websocketConfig: websocketSetup.config, channels: channelsSetup.channels, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/websocket-realtime', timestamp: startTime } };
}

export const websocketSetupTask = defineTask('websocket-setup', (args, taskCtx) => ({ kind: 'agent', title: `WebSocket Setup - ${args.projectName}`, agent: { name: 'websocket-architect', prompt: { role: 'WebSocket Architect', task: 'Configure WebSocket server', context: args, instructions: ['1. Set up WebSocket server', '2. Configure Socket.io', '3. Set up namespaces', '4. Configure transport', '5. Set up CORS', '6. Configure authentication', '7. Set up heartbeat', '8. Configure compression', '9. Set up logging', '10. Document setup'], outputFormat: 'JSON with WebSocket setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'websocket', 'setup'] }));

export const channelsSetupTask = defineTask('channels-setup', (args, taskCtx) => ({ kind: 'agent', title: `Channels Setup - ${args.projectName}`, agent: { name: 'channels-specialist', prompt: { role: 'Channels Specialist', task: 'Configure channels', context: args, instructions: ['1. Create room structure', '2. Configure join/leave', '3. Set up broadcasting', '4. Configure private channels', '5. Set up presence', '6. Configure acknowledgments', '7. Set up volatile events', '8. Configure binary data', '9. Set up middleware', '10. Document channels'], outputFormat: 'JSON with channels' }, outputSchema: { type: 'object', required: ['channels', 'artifacts'], properties: { channels: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'websocket', 'channels'] }));

export const connectionManagementTask = defineTask('connection-management', (args, taskCtx) => ({ kind: 'agent', title: `Connection Management - ${args.projectName}`, agent: { name: 'connection-specialist', prompt: { role: 'Connection Management Specialist', task: 'Configure connection management', context: args, instructions: ['1. Set up reconnection', '2. Configure backoff', '3. Set up connection state', '4. Configure offline support', '5. Set up event queuing', '6. Configure timeout', '7. Set up keep-alive', '8. Configure disconnect', '9. Set up error handling', '10. Document connections'], outputFormat: 'JSON with connection management' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'websocket', 'connections'] }));

export const scalingSetupTask = defineTask('scaling-setup', (args, taskCtx) => ({ kind: 'agent', title: `Scaling Setup - ${args.projectName}`, agent: { name: 'websocket-scaling-specialist', prompt: { role: 'WebSocket Scaling Specialist', task: 'Configure scaling', context: args, instructions: ['1. Set up Redis adapter', '2. Configure sticky sessions', '3. Set up load balancing', '4. Configure horizontal scaling', '5. Set up message broker', '6. Configure pub/sub', '7. Set up clustering', '8. Configure monitoring', '9. Set up health checks', '10. Document scaling'], outputFormat: 'JSON with scaling' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'websocket', 'scaling'] }));

export const documentationTask = defineTask('websocket-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate WebSocket documentation', context: args, instructions: ['1. Create README', '2. Document server setup', '3. Create channels guide', '4. Document connections', '5. Create scaling guide', '6. Document events', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'websocket', 'documentation'] }));
