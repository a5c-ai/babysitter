/**
 * @process assimilation/harness/claude-agent-sdk-custom-agent
 * @description Assimilate babysitter orchestration into an existing Claude/
 *   Anthropic agent-SDK-based codebase by patching the current host runtime in
 *   place. This process deliberately avoids the shared plugin/distribution
 *   assimilation pipeline and instead focuses on adapting the host app's actual
 *   runner, middleware/tool loop, session identity, and operational surfaces.
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number, targetAssumptions?: string[] }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import {
  researchFrameworkTargetTask,
  mapExistingCodebaseTask,
  designInPlaceAssimilationTask,
  implementRuntimeBridgeTask,
  implementOperationsSurfaceTask,
  implementVerificationTask,
  verifyInPlaceAssimilationTask,
  refineInPlaceAssimilationTask,
} from './custom-agent-shared-assimilation.js';

export async function process(inputs, ctx) {
  const {
    projectDir,
    targetQuality = 85,
    maxIterations = 4,
    targetAssumptions = [],
  } = inputs;

  const frameworkId = 'claude-agent-sdk';
  const frameworkDisplayName = 'Claude/Anthropic agent SDK custom agent';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  ctx.log('phase:research', 'Researching the exact Claude/Anthropic agent SDK package and host runtime lifecycle');
  const research = await ctx.task(researchFrameworkTargetTask, {
    projectDir,
    frameworkId,
    frameworkDisplayName,
    targetAssumptions,
  });

  ctx.log('phase:map', 'Mapping runner, middleware/tool loop, session identity, and memory seams');
  const codebaseMap = await ctx.task(mapExistingCodebaseTask, {
    projectDir,
    frameworkDisplayName,
    research,
  });

  ctx.log('phase:architecture', 'Designing in-place Claude/Anthropic assimilation plan');
  const plan = await ctx.task(designInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    research,
    codebaseMap,
  });

  ctx.log('phase:runner-bridge', 'Patching the host Claude/Anthropic runner and lifecycle interception points');
  const runnerBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'runner-and-lifecycle-bridge',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...runnerBridge.filesCreated, ...runnerBridge.filesModified);

  ctx.log('phase:memory-tools', 'Integrating task execution, state resume, and memory/context surfaces');
  const memoryAndTools = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'tooling-memory-and-session-bridge',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...memoryAndTools.filesCreated, ...memoryAndTools.filesModified);

  ctx.log('phase:operations', 'Adding process-library, hooks, structured logging, and operator documentation');
  const operations = await ctx.task(implementOperationsSurfaceTask, {
    projectDir,
    frameworkDisplayName,
    research,
    plan,
  });
  integrationFiles.push(...operations.filesCreated, ...operations.filesModified);

  ctx.log('phase:verification', 'Adding verification coverage for the Claude/Anthropic host assimilation');
  const verificationArtifacts = await ctx.task(implementVerificationTask, {
    projectDir,
    frameworkDisplayName,
    plan,
    integrationFiles,
  });
  integrationFiles.push(...verificationArtifacts.filesCreated, ...verificationArtifacts.filesModified);

  let verification = await ctx.task(verifyInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    targetQuality,
    integrationFiles,
  });

  finalQuality = verification.qualityScore;
  iterations = 1;

  while (finalQuality < targetQuality && iterations < maxIterations) {
    iterations++;
    ctx.log('phase:converge', `Refining Claude/Anthropic agent assimilation (iteration ${iterations})`);

    const refinement = await ctx.task(refineInPlaceAssimilationTask, {
      projectDir,
      frameworkDisplayName,
      iteration: iterations,
      issues: verification.issues,
      recommendations: verification.recommendations,
      integrationFiles,
    });
    integrationFiles.push(...refinement.filesCreated, ...refinement.filesModified);

    verification = await ctx.task(verifyInPlaceAssimilationTask, {
      projectDir,
      frameworkDisplayName,
      targetQuality,
      integrationFiles,
    });
    finalQuality = verification.qualityScore;
  }

  return {
    success: finalQuality >= targetQuality,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    iterations,
  };
}
