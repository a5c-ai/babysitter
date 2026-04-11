/**
 * @process assimilation/harness/vercel-ai-sdk-custom-agent
 * @description Assimilate babysitter orchestration into an existing Vercel AI
 *   SDK based agent codebase by patching its current chat loop, streaming/tool
 *   surfaces, persistence, and operator controls in place. This process is
 *   deliberately separate from the plugin-oriented harness assimilation flow.
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
  validateInPlaceAssimilationTask,
  fixInPlaceValidationFailuresTask,
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

  const frameworkId = 'vercel-ai-sdk';
  const frameworkDisplayName = 'Vercel AI SDK custom agent';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  ctx.log('phase:research', 'Researching Vercel AI SDK streaming, tool invocation, middleware, and persistence surfaces');
  const research = await ctx.task(researchFrameworkTargetTask, {
    projectDir,
    frameworkId,
    frameworkDisplayName,
    targetAssumptions,
  });

  ctx.log('phase:map', 'Mapping chat loop ownership, tool execution, persistence, and operator seams');
  const codebaseMap = await ctx.task(mapExistingCodebaseTask, {
    projectDir,
    frameworkDisplayName,
    research,
  });

  ctx.log('phase:architecture', 'Designing in-place Vercel AI SDK assimilation plan');
  const plan = await ctx.task(designInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    research,
    codebaseMap,
  });

  ctx.log('phase:runtime-bridge', 'Patching the host chat loop, streaming, and orchestration boundaries');
  const runtimeBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'chat-loop-and-streaming-bridge',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...runtimeBridge.filesCreated, ...runtimeBridge.filesModified);

  ctx.log('phase:tools-persistence', 'Integrating effect execution, resume flow, and persistence surfaces');
  const toolAndPersistenceBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'tooling-persistence-and-session-bridge',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...toolAndPersistenceBridge.filesCreated, ...toolAndPersistenceBridge.filesModified);

  ctx.log('phase:operations', 'Adding process-library integration, hooks, logging, and operator documentation');
  const operations = await ctx.task(implementOperationsSurfaceTask, {
    projectDir,
    frameworkDisplayName,
    research,
    plan,
  });
  integrationFiles.push(...operations.filesCreated, ...operations.filesModified);

  ctx.log('phase:verification', 'Adding verification coverage for the Vercel AI SDK host assimilation');
  const verificationArtifacts = await ctx.task(implementVerificationTask, {
    projectDir,
    frameworkDisplayName,
    plan,
    integrationFiles,
  });
  integrationFiles.push(...verificationArtifacts.filesCreated, ...verificationArtifacts.filesModified);

  ctx.log('phase:validate', 'Running concrete validation checks for the in-place assimilation');
  let validation = await ctx.task(validateInPlaceAssimilationTask, {
    projectDir,
    frameworkId,
    frameworkDisplayName,
    research,
    plan,
    integrationFiles,
  });

  let verification = await ctx.task(verifyInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    targetQuality,
    integrationFiles,
    validation,
  });

  finalQuality = verification.qualityScore;
  iterations = 1;

  while ((!validation.passed || finalQuality < targetQuality) && iterations < maxIterations) {
    iterations++;
    ctx.log('phase:converge', `Validation/refinement iteration ${iterations}`);

    if (!validation.passed) {
      ctx.log('phase:fix-validation', `Fixing validation failures for iteration ${iterations}`);
      const validationFixes = await ctx.task(fixInPlaceValidationFailuresTask, {
        projectDir,
        frameworkId,
        frameworkDisplayName,
        research,
        plan,
        validation,
        integrationFiles,
      });
      integrationFiles.push(...validationFixes.filesCreated, ...validationFixes.filesModified);
    }

    if (finalQuality < targetQuality) {
      const refinement = await ctx.task(refineInPlaceAssimilationTask, {
        projectDir,
        frameworkDisplayName,
        iteration: iterations,
        issues: verification.issues,
        recommendations: verification.recommendations,
        integrationFiles,
      });
      integrationFiles.push(...refinement.filesCreated, ...refinement.filesModified);
    }

    validation = await ctx.task(validateInPlaceAssimilationTask, {
      projectDir,
      frameworkId,
      frameworkDisplayName,
      research,
      plan,
      integrationFiles,
    });

    verification = await ctx.task(verifyInPlaceAssimilationTask, {
      projectDir,
      frameworkDisplayName,
      targetQuality,
      integrationFiles,
      validation,
    });
    finalQuality = verification.qualityScore;
  }

  return {
    success: validation.passed && finalQuality >= targetQuality,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    iterations,
  };
}
