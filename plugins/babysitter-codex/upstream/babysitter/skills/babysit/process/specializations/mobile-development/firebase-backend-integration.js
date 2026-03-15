/**
 * @process specializations/mobile-development/firebase-backend-integration
 * @description Firebase Backend Integration - Comprehensive Firebase setup including Authentication,
 * Firestore, Realtime Database, Cloud Functions, and Storage for mobile applications.
 * @inputs { appName: string, platforms: array, firebaseServices?: array, authProviders?: array }
 * @outputs { success: boolean, firebaseConfig: object, services: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/firebase-backend-integration', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   firebaseServices: ['auth', 'firestore', 'storage', 'functions'],
 *   authProviders: ['email', 'google', 'apple']
 * });
 *
 * @references
 * - Firebase iOS: https://firebase.google.com/docs/ios/setup
 * - Firebase Android: https://firebase.google.com/docs/android/setup
 * - Firebase React Native: https://rnfirebase.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    firebaseServices = ['auth', 'firestore'],
    authProviders = ['email', 'google'],
    outputDir = 'firebase-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Firebase Integration: ${appName}`);
  ctx.log('info', `Services: ${firebaseServices.join(', ')}, Auth: ${authProviders.join(', ')}`);

  const phases = [
    { name: 'project-setup', title: 'Firebase Project Setup' },
    { name: 'sdk-integration', title: 'Firebase SDK Integration' },
    { name: 'authentication', title: 'Firebase Authentication' },
    { name: 'firestore-setup', title: 'Firestore Database Setup' },
    { name: 'realtime-db', title: 'Realtime Database Setup' },
    { name: 'cloud-storage', title: 'Cloud Storage Integration' },
    { name: 'cloud-functions', title: 'Cloud Functions Setup' },
    { name: 'security-rules', title: 'Security Rules Configuration' },
    { name: 'offline-persistence', title: 'Offline Persistence' },
    { name: 'remote-config', title: 'Remote Config Setup' },
    { name: 'app-check', title: 'App Check Implementation' },
    { name: 'performance-monitoring', title: 'Performance Monitoring' },
    { name: 'testing', title: 'Firebase Testing Setup' },
    { name: 'documentation', title: 'Firebase Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createFirebaseTask(phase.name, phase.title), {
      appName, platforms, firebaseServices, authProviders, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Firebase integration complete for ${appName}. Ready to test Firebase services?`,
    title: 'Firebase Review',
    context: { runId: ctx.runId, appName, firebaseServices, authProviders }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    firebaseServices,
    authProviders,
    firebaseConfig: { status: 'configured', phases: phases.length },
    services: firebaseServices,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/firebase-backend-integration', timestamp: startTime }
  };
}

function createFirebaseTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'firebase-integration' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Firebase Integration Engineer',
        task: `Implement ${title.toLowerCase()} for Firebase integration`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} with Firebase`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate ${args.firebaseServices.join(', ')} services`,
          `4. Configure security and permissions`,
          `5. Document implementation`
        ],
        outputFormat: 'JSON with Firebase details'
      },
      outputSchema: {
        type: 'object',
        required: ['config', 'artifacts'],
        properties: { config: { type: 'object' }, services: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'firebase', name]
  });
}

export const projectSetupTask = createFirebaseTask('project-setup', 'Firebase Project Setup');
export const sdkIntegrationTask = createFirebaseTask('sdk-integration', 'Firebase SDK Integration');
export const authenticationTask = createFirebaseTask('authentication', 'Firebase Authentication');
export const firestoreSetupTask = createFirebaseTask('firestore-setup', 'Firestore Database Setup');
export const realtimeDbTask = createFirebaseTask('realtime-db', 'Realtime Database Setup');
export const cloudStorageTask = createFirebaseTask('cloud-storage', 'Cloud Storage Integration');
export const cloudFunctionsTask = createFirebaseTask('cloud-functions', 'Cloud Functions Setup');
export const securityRulesTask = createFirebaseTask('security-rules', 'Security Rules Configuration');
export const offlinePersistenceTask = createFirebaseTask('offline-persistence', 'Offline Persistence');
export const remoteConfigTask = createFirebaseTask('remote-config', 'Remote Config Setup');
export const appCheckTask = createFirebaseTask('app-check', 'App Check Implementation');
export const performanceMonitoringTask = createFirebaseTask('performance-monitoring', 'Performance Monitoring');
export const testingTask = createFirebaseTask('testing', 'Firebase Testing Setup');
export const documentationTask = createFirebaseTask('documentation', 'Firebase Documentation');
