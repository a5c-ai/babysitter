/**
 * @process assimilation/harness/langchain-langgraph-custom-agent
 * @description Assimilate babysitter orchestration into an existing custom
 *   LangChain/LangGraph codebase by patching its current graph runtime in
 *   place. This process targets host-side graph runners, nodes, interrupts,
 *   checkpointing, tools, and operator commands rather than creating a
 *   distributable babysitter plugin package.
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

  const frameworkId = 'langchain-langgraph';
  const frameworkDisplayName = 'LangChain/LangGraph custom agent';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  ctx.log('phase:research', 'Researching LangGraph runtime, graph topology, checkpoints, and interrupt surfaces');
  const research = await ctx.task(researchFrameworkTargetTask, {
    projectDir,
    frameworkId,
    frameworkDisplayName,
    targetAssumptions,
  });

  ctx.log('phase:map', 'Mapping graph runners, nodes, state persistence, and tool execution seams');
  const codebaseMap = await ctx.task(mapExistingCodebaseTask, {
    projectDir,
    frameworkDisplayName,
    research,
  });

  ctx.log('phase:architecture', 'Designing in-place LangGraph assimilation plan');
  const plan = await ctx.task(designInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    research,
    codebaseMap,
  });

  ctx.log('phase:runtime-bridge', 'Patching graph execution and checkpoint lifecycle with babysitter orchestration');
  const runtimeBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'graph-runtime-bridge',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...runtimeBridge.filesCreated, ...runtimeBridge.filesModified);

  ctx.log('phase:interrupts', 'Integrating interrupt/resume and human review flows into the host graph runtime');
  const interruptBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'interrupt-resume-and-effect-posting',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...interruptBridge.filesCreated, ...interruptBridge.filesModified);

  ctx.log('phase:operations', 'Adding process-library, hooks, and operator-facing observability surfaces');
  const operations = await ctx.task(implementOperationsSurfaceTask, {
    projectDir,
    frameworkDisplayName,
    research,
    plan,
  });
  integrationFiles.push(...operations.filesCreated, ...operations.filesModified);

  ctx.log('phase:verification', 'Adding LangGraph assimilation verification coverage');
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
