/**
 * @process assimilation/harness/openai-agents-sdk-custom-agent
 * @description Assimilate babysitter orchestration into an existing OpenAI
 *   Agents SDK codebase by patching the current agent runner, handoff/tooling
 *   stack, and operator surfaces in place. This process is intentionally
 *   different from the plugin-oriented harness assimilation flow: it targets an
 *   existing application runtime rather than a distributable babysitter plugin.
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number, targetAssumptions?: string[] }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:ai-agent-development, skill-area:orchestration-loop]
 *   topics: [topic:developer-experience, topic:integrations]
 *   roles: [role:platform-engineer, role:backend-engineer]
 *   workflows: [workflow:feature-development]
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

  const frameworkId = 'openai-agents-sdk';
  const frameworkDisplayName = 'OpenAI Agents SDK custom agent';
  const integrationFiles = [];
  let finalQuality = 0;
  let iterations = 0;

  ctx.log('phase:research', 'Researching OpenAI Agents SDK runner lifecycle, tools, handoffs, and guardrails');
  const research = await ctx.task(researchFrameworkTargetTask, {
    projectDir,
    frameworkId,
    frameworkDisplayName,
    targetAssumptions,
  });

  ctx.log('phase:map', 'Mapping runner entrypoints, run context, tool dispatch, and handoff seams');
  const codebaseMap = await ctx.task(mapExistingCodebaseTask, {
    projectDir,
    frameworkDisplayName,
    research,
  });

  ctx.log('phase:architecture', 'Designing in-place OpenAI Agents SDK assimilation plan');
  const plan = await ctx.task(designInPlaceAssimilationTask, {
    projectDir,
    frameworkDisplayName,
    research,
    codebaseMap,
  });

  ctx.log('phase:runner-bridge', 'Patching runner turn orchestration and completion interception');
  const runnerBridge = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'runner-turn-orchestration',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...runnerBridge.filesCreated, ...runnerBridge.filesModified);

  ctx.log('phase:tools-handoffs', 'Integrating babysitter effect execution with tools, handoffs, and guardrails');
  const toolsAndHandoffs = await ctx.task(implementRuntimeBridgeTask, {
    projectDir,
    frameworkDisplayName,
    implementationPhase: 'tools-handoffs-and-session-bridging',
    plan,
    codebaseMap,
  });
  integrationFiles.push(...toolsAndHandoffs.filesCreated, ...toolsAndHandoffs.filesModified);

  ctx.log('phase:operations', 'Adding process-library, logging, and host operator controls');
  const operations = await ctx.task(implementOperationsSurfaceTask, {
    projectDir,
    frameworkDisplayName,
    research,
    plan,
  });
  integrationFiles.push(...operations.filesCreated, ...operations.filesModified);

  ctx.log('phase:verification', 'Adding verification coverage for the patched host runtime');
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
