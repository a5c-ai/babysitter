/**
 * @process specializations/mobile-development/offline-first-architecture
 * @description Offline-First Architecture and Data Sync - Implement robust offline capabilities
 * with local storage, conflict resolution, background sync, and optimistic UI patterns.
 * @inputs { appName: string, platforms: array, syncStrategy?: string, conflictResolution?: string }
 * @outputs { success: boolean, offlineConfig: object, syncMechanisms: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/offline-first-architecture', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   syncStrategy: 'incremental',
 *   conflictResolution: 'last-write-wins'
 * });
 *
 * @references
 * - Core Data: https://developer.apple.com/documentation/coredata
 * - Room: https://developer.android.com/training/data-storage/room
 * - WatermelonDB: https://watermelondb.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    syncStrategy = 'incremental',
    conflictResolution = 'last-write-wins',
    outputDir = 'offline-first'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Offline-First Architecture: ${appName}`);
  ctx.log('info', `Sync: ${syncStrategy}, Conflict: ${conflictResolution}`);

  const phases = [
    { name: 'architecture-design', title: 'Offline Architecture Design' },
    { name: 'local-database', title: 'Local Database Setup' },
    { name: 'data-models', title: 'Data Models and Schema' },
    { name: 'sync-engine', title: 'Sync Engine Implementation' },
    { name: 'conflict-resolution', title: 'Conflict Resolution Strategy' },
    { name: 'change-tracking', title: 'Change Tracking Implementation' },
    { name: 'queue-management', title: 'Offline Queue Management' },
    { name: 'background-sync', title: 'Background Sync Setup' },
    { name: 'optimistic-ui', title: 'Optimistic UI Patterns' },
    { name: 'network-detection', title: 'Network State Detection' },
    { name: 'data-migration', title: 'Data Migration Strategy' },
    { name: 'cache-invalidation', title: 'Cache Invalidation' },
    { name: 'testing', title: 'Offline Testing Strategy' },
    { name: 'documentation', title: 'Offline Architecture Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createOfflineTask(phase.name, phase.title), {
      appName, platforms, syncStrategy, conflictResolution, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Offline-first architecture complete for ${appName}. Ready to test offline capabilities?`,
    title: 'Offline Architecture Review',
    context: { runId: ctx.runId, appName, syncStrategy, conflictResolution }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    syncStrategy,
    conflictResolution,
    offlineConfig: { status: 'configured', phases: phases.length },
    syncMechanisms: ['incremental', 'full', 'delta'],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/offline-first-architecture', timestamp: startTime }
  };
}

function createOfflineTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'offline-storage' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Offline-First Architecture Specialist',
        task: `Implement ${title.toLowerCase()} for offline-first app`,
        context: args,
        instructions: [
          `1. Design ${title.toLowerCase()} architecture`,
          `2. Implement for ${args.platforms.join(' and ')}`,
          `3. Configure ${args.syncStrategy} sync strategy`,
          `4. Implement ${args.conflictResolution} conflict resolution`,
          `5. Document implementation`
        ],
        outputFormat: 'JSON with offline architecture details'
      },
      outputSchema: {
        type: 'object',
        required: ['implementation', 'artifacts'],
        properties: { implementation: { type: 'object' }, syncConfig: { type: 'object' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'offline', name]
  });
}

export const architectureDesignTask = createOfflineTask('architecture-design', 'Offline Architecture Design');
export const localDatabaseTask = createOfflineTask('local-database', 'Local Database Setup');
export const dataModelsTask = createOfflineTask('data-models', 'Data Models and Schema');
export const syncEngineTask = createOfflineTask('sync-engine', 'Sync Engine Implementation');
export const conflictResolutionTask = createOfflineTask('conflict-resolution', 'Conflict Resolution Strategy');
export const changeTrackingTask = createOfflineTask('change-tracking', 'Change Tracking Implementation');
export const queueManagementTask = createOfflineTask('queue-management', 'Offline Queue Management');
export const backgroundSyncTask = createOfflineTask('background-sync', 'Background Sync Setup');
export const optimisticUiTask = createOfflineTask('optimistic-ui', 'Optimistic UI Patterns');
export const networkDetectionTask = createOfflineTask('network-detection', 'Network State Detection');
export const dataMigrationTask = createOfflineTask('data-migration', 'Data Migration Strategy');
export const cacheInvalidationTask = createOfflineTask('cache-invalidation', 'Cache Invalidation');
export const testingTask = createOfflineTask('testing', 'Offline Testing Strategy');
export const documentationTask = createOfflineTask('documentation', 'Offline Architecture Documentation');
