/**
 * @process specializations/desktop-development/inter-app-communication
 * @description Inter-Application Communication Setup - Implement IPC mechanisms including named pipes, sockets,
 * shared memory, or protocol handlers for communication between desktop app instances or with other applications.
 * @inputs { projectName: string, framework: string, ipcMethods: array, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, ipcModules: array, protocols: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/inter-app-communication', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   ipcMethods: ['protocol-handler', 'named-pipe', 'websocket', 'shared-memory'],
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Electron IPC: https://www.electronjs.org/docs/latest/tutorial/ipc
 * - Node.js IPC: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    ipcMethods = ['protocol-handler', 'named-pipe', 'websocket'],
    targetPlatforms = ['windows', 'macos', 'linux'],
    outputDir = 'inter-app-communication'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Inter-App Communication Setup: ${projectName}`);

  // Phase 1: IPC Requirements
  const requirements = await ctx.task(ipcRequirementsTask, { projectName, framework, ipcMethods, targetPlatforms, outputDir });
  artifacts.push(...requirements.artifacts);

  // Phase 2: Single Instance Lock
  const singleInstance = await ctx.task(implementSingleInstanceTask, { projectName, framework, targetPlatforms, outputDir });
  artifacts.push(...singleInstance.artifacts);

  // Phase 3: Protocol Handler
  let protocolHandler = null;
  if (ipcMethods.includes('protocol-handler')) {
    protocolHandler = await ctx.task(implementProtocolHandlerTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...protocolHandler.artifacts);
  }

  // Phase 4: Named Pipes
  let namedPipes = null;
  if (ipcMethods.includes('named-pipe')) {
    namedPipes = await ctx.task(implementNamedPipesTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...namedPipes.artifacts);
  }

  // Phase 5: WebSocket Server
  let websocket = null;
  if (ipcMethods.includes('websocket')) {
    websocket = await ctx.task(implementWebSocketTask, { projectName, framework, outputDir });
    artifacts.push(...websocket.artifacts);
  }

  // Phase 6: Shared Memory
  let sharedMemory = null;
  if (ipcMethods.includes('shared-memory')) {
    sharedMemory = await ctx.task(implementSharedMemoryTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...sharedMemory.artifacts);
  }

  await ctx.breakpoint({
    question: `IPC methods implemented: ${ipcMethods.join(', ')}. Single instance: ${singleInstance.enabled}. Review implementation?`,
    title: 'IPC Implementation Review',
    context: { runId: ctx.runId, ipcMethods, singleInstance: singleInstance.enabled }
  });

  // Phase 7: Message Protocol
  const messageProtocol = await ctx.task(implementMessageProtocolTask, { projectName, framework, ipcMethods, outputDir });
  artifacts.push(...messageProtocol.artifacts);

  // Phase 8: Validation
  const validation = await ctx.task(validateIpcTask, { projectName, framework, ipcMethods, singleInstance, protocolHandler, namedPipes, websocket, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    ipcModules: ipcMethods.map(m => ({ method: m, enabled: true })),
    singleInstance: singleInstance.enabled,
    protocols: protocolHandler ? protocolHandler.protocols : [],
    messageProtocol: messageProtocol.schema,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/inter-app-communication', timestamp: startTime }
  };
}

export const ipcRequirementsTask = defineTask('ipc-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `IPC Requirements - ${args.projectName}`,
  skill: {
    name: 'electron-ipc-security-audit',
  },
  agent: {
    name: 'electron-architect',
    prompt: { role: 'IPC Systems Analyst', task: 'Analyze IPC requirements', context: args, instructions: ['1. Analyze IPC needs', '2. Document platform capabilities', '3. Assess security requirements', '4. Define message types', '5. Document latency requirements', '6. Assess reliability needs', '7. Identify use cases', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'requirements']
}));

export const implementSingleInstanceTask = defineTask('implement-single-instance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Single Instance Lock - ${args.projectName}`,
  agent: {
    name: 'instance-developer',
    prompt: { role: 'Instance Management Developer', task: 'Implement single instance lock', context: args, instructions: ['1. Implement app.requestSingleInstanceLock', '2. Handle second instance launch', '3. Pass arguments to first instance', '4. Focus existing window', '5. Handle command line args', '6. Configure platform behavior', '7. Handle edge cases', '8. Generate instance module'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'single-instance']
}));

export const implementProtocolHandlerTask = defineTask('implement-protocol-handler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protocol Handler - ${args.projectName}`,
  skill: {
    name: 'electron-protocol-handler-setup',
  },
  agent: {
    name: 'electron-architect',
    prompt: { role: 'Protocol Handler Developer', task: 'Implement custom protocol handler', context: args, instructions: ['1. Register custom protocol (myapp://)', '2. Handle protocol launch', '3. Parse protocol URL', '4. Route to appropriate handler', '5. Handle deep linking', '6. Configure platform registration', '7. Handle URL encoding', '8. Generate protocol module'] },
    outputSchema: { type: 'object', required: ['protocols', 'artifacts'], properties: { protocols: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'protocol-handler']
}));

export const implementNamedPipesTask = defineTask('implement-named-pipes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Named Pipes - ${args.projectName}`,
  agent: {
    name: 'pipe-developer',
    prompt: { role: 'Named Pipes Developer', task: 'Implement named pipes IPC', context: args, instructions: ['1. Create named pipe server', '2. Handle client connections', '3. Implement message framing', '4. Handle bidirectional communication', '5. Implement reconnection logic', '6. Handle platform differences', '7. Implement security', '8. Generate pipe module'] },
    outputSchema: { type: 'object', required: ['pipePath', 'artifacts'], properties: { pipePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'named-pipes']
}));

export const implementWebSocketTask = defineTask('implement-websocket', (args, taskCtx) => ({
  kind: 'agent',
  title: `WebSocket Server - ${args.projectName}`,
  agent: {
    name: 'websocket-developer',
    prompt: { role: 'WebSocket Developer', task: 'Implement WebSocket IPC server', context: args, instructions: ['1. Create WebSocket server', '2. Handle client connections', '3. Implement message protocol', '4. Handle binary data', '5. Implement heartbeat', '6. Handle reconnection', '7. Implement authentication', '8. Generate WebSocket module'] },
    outputSchema: { type: 'object', required: ['port', 'artifacts'], properties: { port: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'websocket']
}));

export const implementSharedMemoryTask = defineTask('implement-shared-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shared Memory - ${args.projectName}`,
  agent: {
    name: 'memory-developer',
    prompt: { role: 'Shared Memory Developer', task: 'Implement shared memory IPC', context: args, instructions: ['1. Create shared memory region', '2. Implement read/write operations', '3. Handle synchronization', '4. Implement locking mechanism', '5. Handle cleanup', '6. Configure platform specifics', '7. Handle memory mapping', '8. Generate shared memory module'] },
    outputSchema: { type: 'object', required: ['memorySize', 'artifacts'], properties: { memorySize: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'shared-memory']
}));

export const implementMessageProtocolTask = defineTask('implement-message-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Message Protocol - ${args.projectName}`,
  agent: {
    name: 'protocol-developer',
    prompt: { role: 'Message Protocol Developer', task: 'Implement message protocol schema', context: args, instructions: ['1. Define message schema', '2. Implement serialization', '3. Add message validation', '4. Implement request/response', '5. Add message routing', '6. Implement error handling', '7. Add versioning', '8. Generate protocol module'] },
    outputSchema: { type: 'object', required: ['schema', 'artifacts'], properties: { schema: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'protocol']
}));

export const validateIpcTask = defineTask('validate-ipc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate IPC - ${args.projectName}`,
  agent: {
    name: 'ipc-validator',
    prompt: { role: 'IPC Validator', task: 'Validate IPC implementation', context: args, instructions: ['1. Test each IPC method', '2. Verify single instance', '3. Test protocol handling', '4. Verify message protocol', '5. Test cross-platform', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ipc', 'validation']
}));
