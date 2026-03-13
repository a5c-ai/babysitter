/**
 * @process specializations/game-development/build-pipeline-automation
 * @description Build Pipeline and Automation Process - Set up automated build pipeline for all target platforms
 * including CI/CD, asset processing, automated testing, and release build processes.
 * @inputs { projectName: string, platforms?: array, ciProvider?: string, outputDir?: string }
 * @outputs { success: boolean, pipelineConfig: object, buildTargets: array, documentation: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platforms = ['windows', 'macos', 'linux', 'ps5', 'xbox-series', 'switch'],
    ciProvider = 'github-actions',
    engine = 'Unity',
    automatedTesting = true,
    outputDir = 'build-pipeline-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Build Pipeline Automation: ${projectName}`);

  // Phase 1: Pipeline Architecture Design
  const architecture = await ctx.task(pipelineArchitectureTask, { projectName, platforms, ciProvider, engine, outputDir });
  artifacts.push(...architecture.artifacts);

  // Phase 2: Build Server Setup
  const buildServer = await ctx.task(buildServerSetupTask, { projectName, ciProvider, outputDir });
  artifacts.push(...buildServer.artifacts);

  // Phase 3: Platform Build Scripts
  const buildScripts = await ctx.parallel.all(
    platforms.map(platform =>
      ctx.task(platformBuildScriptTask, { projectName, platform, engine, outputDir })
    )
  );
  buildScripts.forEach(script => artifacts.push(...script.artifacts));

  // Phase 4: Asset Processing Pipeline
  const assetPipeline = await ctx.task(assetProcessingTask, { projectName, engine, outputDir });
  artifacts.push(...assetPipeline.artifacts);

  // Phase 5: Automated Testing Setup
  if (automatedTesting) {
    const testing = await ctx.task(automatedTestingTask, { projectName, engine, outputDir });
    artifacts.push(...testing.artifacts);
  }

  // Phase 6: Artifact Storage and Versioning
  const artifactStorage = await ctx.task(artifactStorageTask, { projectName, platforms, outputDir });
  artifacts.push(...artifactStorage.artifacts);

  // Phase 7: Release Build Process
  const releaseBuild = await ctx.task(releaseBuildTask, { projectName, platforms, outputDir });
  artifacts.push(...releaseBuild.artifacts);

  // Phase 8: Pipeline Testing
  const pipelineTesting = await ctx.task(pipelineTestingTask, { projectName, buildScripts, outputDir });
  artifacts.push(...pipelineTesting.artifacts);

  await ctx.breakpoint({
    question: `Build pipeline automation complete for ${projectName}. ${platforms.length} platforms. CI Provider: ${ciProvider}. Pipeline test: ${pipelineTesting.passRate}%. Review?`,
    title: 'Build Pipeline Review',
    context: { runId: ctx.runId, architecture, buildScripts, pipelineTesting }
  });

  return {
    success: true,
    projectName,
    pipelineConfig: architecture.config,
    buildTargets: buildScripts.map(s => ({ platform: s.platform, scriptPath: s.scriptPath })),
    documentation: architecture.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/build-pipeline-automation', timestamp: startTime, outputDir }
  };
}

export const pipelineArchitectureTask = defineTask('pipeline-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Architecture - ${args.projectName}`,
  agent: {
    name: 'devops-engineer-agent',
    prompt: { role: 'DevOps Engineer', task: 'Design build pipeline architecture', context: args, instructions: ['1. Define pipeline stages', '2. Map build dependencies', '3. Design artifact flow', '4. Document architecture'] },
    outputSchema: { type: 'object', required: ['config', 'docPath', 'artifacts'], properties: { config: { type: 'object' }, docPath: { type: 'string' }, stages: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'architecture']
}));

export const buildServerSetupTask = defineTask('build-server-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Server Setup - ${args.projectName}`,
  agent: {
    name: 'devops-engineer-agent',
    prompt: { role: 'DevOps Engineer', task: 'Set up build server', context: args, instructions: ['1. Configure CI provider', '2. Set up build agents', '3. Configure secrets', '4. Test basic builds'] },
    outputSchema: { type: 'object', required: ['serverReady', 'configuration', 'artifacts'], properties: { serverReady: { type: 'boolean' }, configuration: { type: 'object' }, agents: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'server']
}));

export const platformBuildScriptTask = defineTask('platform-build-script', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Script - ${args.platform}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Create platform build script', context: args, instructions: ['1. Configure build settings', '2. Set platform-specific options', '3. Add optimization flags', '4. Test build script'] },
    outputSchema: { type: 'object', required: ['platform', 'scriptPath', 'artifacts'], properties: { platform: { type: 'string' }, scriptPath: { type: 'string' }, buildTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'scripts']
}));

export const assetProcessingTask = defineTask('asset-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Asset Processing - ${args.projectName}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Set up asset processing', context: args, instructions: ['1. Configure texture compression', '2. Set up mesh optimization', '3. Add audio processing', '4. Test asset pipeline'] },
    outputSchema: { type: 'object', required: ['pipelineReady', 'processors', 'artifacts'], properties: { pipelineReady: { type: 'boolean' }, processors: { type: 'array' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'assets']
}));

export const automatedTestingTask = defineTask('automated-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Set up automated testing', context: args, instructions: ['1. Configure unit tests', '2. Add integration tests', '3. Set up smoke tests', '4. Configure test reporting'] },
    outputSchema: { type: 'object', required: ['testSuites', 'coverage', 'artifacts'], properties: { testSuites: { type: 'array' }, coverage: { type: 'number' }, testFramework: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'testing']
}));

export const artifactStorageTask = defineTask('artifact-storage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Artifact Storage - ${args.projectName}`,
  agent: {
    name: 'devops-engineer-agent',
    prompt: { role: 'DevOps Engineer', task: 'Configure artifact storage', context: args, instructions: ['1. Set up storage location', '2. Configure versioning', '3. Add retention policies', '4. Test artifact retrieval'] },
    outputSchema: { type: 'object', required: ['storageReady', 'configuration', 'artifacts'], properties: { storageReady: { type: 'boolean' }, configuration: { type: 'object' }, retentionPolicy: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'storage']
}));

export const releaseBuildTask = defineTask('release-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Build Process - ${args.projectName}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Create release build process', context: args, instructions: ['1. Define release workflow', '2. Add signing and packaging', '3. Configure submission prep', '4. Document release process'] },
    outputSchema: { type: 'object', required: ['releaseProcess', 'artifacts'], properties: { releaseProcess: { type: 'object' }, signingConfigured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'release']
}));

export const pipelineTestingTask = defineTask('pipeline-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test build pipeline', context: args, instructions: ['1. Run full pipeline', '2. Verify all platforms', '3. Test failure recovery', '4. Create test report'] },
    outputSchema: { type: 'object', required: ['passRate', 'results', 'artifacts'], properties: { passRate: { type: 'number' }, results: { type: 'array' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'build-pipeline', 'testing']
}));
