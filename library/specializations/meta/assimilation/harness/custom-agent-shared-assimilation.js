/**
 * Shared task definitions for assimilating babysitter into existing custom-agent
 * codebases. Unlike the plugin/distribution-oriented shared harness assimilation
 * flow, these tasks target patching an already-existing application runtime in
 * place: adding orchestration loop entrypoints, session binding, process-library
 * usage, hook/middleware interception, effect execution, observability, and
 * verification inside the target repo.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const babysitterRepo = 'https://github.com/a5c-ai/babysitter';

const sdkIntegrationReferences = [
  'packages/sdk/src/harness/customAdapter.ts',
  'packages/sdk/src/harness/types.ts',
  'packages/sdk/src/harness/registry.ts',
  'packages/sdk/src/runtime/createRun.ts',
  'packages/sdk/src/runtime/orchestrateIteration.ts',
  'packages/sdk/src/runtime/commitEffectResult.ts',
  'packages/sdk/src/runtime/replay/',
  'packages/sdk/src/session/',
  'packages/sdk/src/storage/',
  'packages/sdk/src/processLibrary/',
  'packages/sdk/src/hooks/',
  'packages/sdk/src/logging/',
  'packages/sdk/src/cli/commands/harnessCreateRun.ts',
  'docs/assimilation/harness/generic-harness-guide.md',
];

const frameworkReferenceMap = {
  'langchain-langgraph': {
    officialSources: [
      'https://docs.langchain.com',
      'https://github.com/langchain-ai/langgraph',
      'https://github.com/langchain-ai/langchainjs',
    ],
    focusAreas: [
      'graph topology and node execution lifecycle',
      'checkpointing, resumability, and interrupt semantics',
      'tool binding, runtime context, and middleware layers',
      'human-in-the-loop interrupt points and state persistence',
    ],
  },
  'openai-agents-sdk': {
    officialSources: [
      'https://openai.github.io/openai-agents-js/',
      'https://github.com/openai/openai-agents-js',
      'https://platform.openai.com/docs',
    ],
    focusAreas: [
      'runner lifecycle, run context, and turn orchestration',
      'tools, handoffs, guardrails, and session memory',
      'traceability, streaming, and operator control surfaces',
      'where to intercept agent completion and resume work safely',
    ],
  },
  'claude-agent-sdk': {
    officialSources: [
      'https://docs.anthropic.com',
      'https://github.com/anthropics',
    ],
    focusAreas: [
      'identify the exact Claude/Anthropic agent SDK package used by the target repo',
      'agent loop, tool execution, and middleware/hook interception points',
      'session identity, memory, and resumability surfaces',
      'how to graft babysitter continuation without turning the project into a distributable plugin',
    ],
  },
  'vercel-ai-sdk': {
    officialSources: [
      'https://sdk.vercel.ai/docs',
      'https://vercel.com/ai',
      'https://github.com/vercel/ai',
    ],
    focusAreas: [
      'streaming primitives, tool invocation, and model/provider abstraction seams',
      'chat loop ownership, UI/server action boundaries, and resumability surfaces',
      'middleware, telemetry, persistence, and host-side operator controls',
      'where babysitter orchestration can be inserted without introducing a plugin distribution model',
    ],
  },
};

export const researchFrameworkTargetTask = defineTask('research-framework-target', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research ${args.frameworkDisplayName} assimilation target`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior runtime integration researcher for agent frameworks',
      task: `Research how to assimilate babysitter orchestration into an existing ${args.frameworkDisplayName} codebase without converting it into a marketplace plugin or a standalone distributable harness package.`,
      context: {
        projectDir: args.projectDir,
        frameworkId: args.frameworkId,
        frameworkDisplayName: args.frameworkDisplayName,
        sdkIntegrationReferences,
        officialSources: frameworkReferenceMap[args.frameworkId]?.officialSources ?? [],
        focusAreas: frameworkReferenceMap[args.frameworkId]?.focusAreas ?? [],
        targetAssumptions: args.targetAssumptions ?? [],
      },
      instructions: [
        `Clone the babysitter repo (${babysitterRepo}) if it is not already available locally. Treat that repo as the source of truth for babysitter runtime, orchestration, process-library, hook, and logging behavior.`,
        'Research the babysitter repo FIRST before doing framework-specific research. Build an explicit understanding of how babysitter currently models runtime orchestration, session state, process library usage, hooks, logging, and harness integration seams.',
        'Study the listed babysitter SDK references before deciding where to patch the target framework host codebase.',
        'Read the target repository to identify the actual runtime entrypoints, agent loop ownership, session identity source, tool execution layer, and persistence model.',
        `Consult the official sources for ${args.frameworkDisplayName} before making framework-specific assumptions.`,
        'Map the current codebase to babysitter integration seams: where run:create happens, where iteration resumes, where effects are executed, and where completion can be intercepted.',
        'Treat this as an in-place retrofit. Do not design a separate plugin package, marketplace artifact, or mirrored command surface unless the host repo already has one.',
        'Identify the smallest honest set of files that would need patching to integrate babysitter process library usage, hooks/middleware, orchestration state, task posting, and logging.',
        'For Claude/Anthropic targets, first determine the exact SDK/library used in the repo before proposing implementation work.',
        'Return a concrete patch-oriented research report with risks and recommended insertion points.',
      ],
      outputFormat: 'JSON with framework, officialSources, runtimeEntryPoints, loopModel, sessionIdentity, toolExecution, persistenceModel, observabilitySurfaces, patchPoints, babysitterTouchpoints, requiredFiles, risks, recommendedApproach',
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'runtimeEntryPoints', 'loopModel', 'patchPoints', 'babysitterTouchpoints', 'requiredFiles', 'risks', 'recommendedApproach'],
      properties: {
        framework: { type: 'object' },
        officialSources: { type: 'array', items: { type: 'string' } },
        runtimeEntryPoints: { type: 'array', items: { type: 'object' } },
        loopModel: { type: 'object' },
        sessionIdentity: { type: 'object' },
        toolExecution: { type: 'object' },
        persistenceModel: { type: 'object' },
        observabilitySurfaces: { type: 'array', items: { type: 'object' } },
        patchPoints: { type: 'array', items: { type: 'object' } },
        babysitterTouchpoints: { type: 'array', items: { type: 'object' } },
        requiredFiles: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        recommendedApproach: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'research'],
}));

export const mapExistingCodebaseTask = defineTask('map-existing-codebase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Map ${args.frameworkDisplayName} codebase patch points`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'codebase cartographer for in-place runtime patching',
      task: `Map the existing ${args.frameworkDisplayName} codebase and identify the exact files/functions/classes that should be patched for babysitter integration.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        research: args.research,
      },
      instructions: [
        'Read the concrete files identified by the research phase.',
        'Locate the actual agent runner, message loop, tool dispatch layer, persistence/state layer, CLI/server entrypoint, and any middleware/hook registration.',
        'For each patch point, specify whether the change should wrap existing behavior, intercept a lifecycle callback, or introduce a new integration module.',
        'Prefer modifying the existing host runtime and command surface rather than introducing parallel babysitter-only scripts.',
        'Call out seams for session binding, run creation/resume, task execution, task posting, process library access, hook invocation, and structured logging.',
        'Return a patch map that can drive implementation tasks directly.',
      ],
      outputFormat: 'JSON with hostArchitecture, patchMap, seams, integrationModules, testTargets, migrationRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['hostArchitecture', 'patchMap', 'seams', 'integrationModules', 'testTargets', 'migrationRisks'],
      properties: {
        hostArchitecture: { type: 'object' },
        patchMap: { type: 'array', items: { type: 'object' } },
        seams: { type: 'array', items: { type: 'object' } },
        integrationModules: { type: 'array', items: { type: 'object' } },
        testTargets: { type: 'array', items: { type: 'object' } },
        migrationRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'mapping'],
}));

export const designInPlaceAssimilationTask = defineTask('design-in-place-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design in-place assimilation plan for ${args.frameworkDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'babysitter assimilation architect for existing runtimes',
      task: `Design an implementation plan for integrating babysitter orchestration into the existing ${args.frameworkDisplayName} host codebase in place.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        research: args.research,
        codebaseMap: args.codebaseMap,
      },
      instructions: [
        'Produce a phased patch plan, not a plugin packaging plan.',
        'Include the module boundaries for babysitter runtime bridge, session binding, effect execution, process-library access, hooks/middleware, and logging/observer support.',
        'Decide which pieces should be added as new host-side integration modules versus edits to existing framework files.',
        'Specify validation strategy: unit tests, integration tests, smoke flows, and recovery checks.',
        'Return exact file targets and a dependency-aware implementation order.',
      ],
      outputFormat: 'JSON with phases, filePlan, moduleContracts, validationPlan, rolloutRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'filePlan', 'moduleContracts', 'validationPlan', 'rolloutRisks'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        filePlan: { type: 'array', items: { type: 'object' } },
        moduleContracts: { type: 'array', items: { type: 'object' } },
        validationPlan: { type: 'array', items: { type: 'object' } },
        rolloutRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'architecture'],
}));

export const implementRuntimeBridgeTask = defineTask('implement-runtime-bridge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement babysitter runtime bridge for ${args.frameworkDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior runtime engineer patching an existing agent host',
      task: `Implement the babysitter runtime bridge inside the existing ${args.frameworkDisplayName} codebase.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        implementationPhase: args.implementationPhase,
        plan: args.plan,
        codebaseMap: args.codebaseMap,
      },
      instructions: [
        'Patch the host runtime in place according to the implementation phase.',
        'Integrate babysitter run creation, iteration/resume, effect discovery, effect execution, and result posting at the actual loop boundaries of the target framework.',
        'Preserve the host framework conventions instead of imposing the plugin architecture used by existing harness assimilations.',
        'Prefer host-native middleware/interceptors/callbacks over wrapper scripts where possible.',
        'Return the exact files changed and the host runtime behaviors now covered.',
      ],
      outputFormat: 'JSON with phase, filesCreated, filesModified, behaviorsAdded, remainingRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['phase', 'filesCreated', 'filesModified', 'behaviorsAdded', 'remainingRisks'],
      properties: {
        phase: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        behaviorsAdded: { type: 'array', items: { type: 'string' } },
        remainingRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'implementation'],
}));

export const implementOperationsSurfaceTask = defineTask('implement-operations-surface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement operations and observability surfaces for ${args.frameworkDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'operator-experience engineer for babysitter integrations',
      task: `Integrate process-library access, hooks/middleware, logging, docs, and operational controls into the existing ${args.frameworkDisplayName} host runtime.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        research: args.research,
        plan: args.plan,
      },
      instructions: [
        'Wire process-library configuration, lifecycle hooks, log emission, and any observer/doctor support into the host codebase.',
        'Keep the host project as the primary operator surface; do not create a distributable babysitter plugin structure unless the host repo already has equivalent surfaces.',
        'Add clear documentation for running the integrated orchestration inside the host framework.',
        'Return the files created/modified and the operator flows now supported.',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, operatorFlows, docsAdded, observabilityAdded',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'operatorFlows', 'docsAdded', 'observabilityAdded'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        operatorFlows: { type: 'array', items: { type: 'string' } },
        docsAdded: { type: 'array', items: { type: 'string' } },
        observabilityAdded: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'operations'],
}));

export const implementVerificationTask = defineTask('implement-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement verification for ${args.frameworkDisplayName} assimilation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'verification engineer for framework assimilations',
      task: `Add verification coverage for the babysitter assimilation inside the existing ${args.frameworkDisplayName} host codebase.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        plan: args.plan,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        'Add the narrowest honest tests or smoke flows that prove the new orchestration bridge works inside the host runtime.',
        'Cover session binding, resumed iteration behavior, effect execution/posting, and failure/recovery surfaces where practical.',
        'Prefer host-native test infrastructure over introducing a new testing stack.',
        'Return the files created/modified and which scenarios are now covered.',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, coveredScenarios, gaps',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'coveredScenarios', 'gaps'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        coveredScenarios: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'verification'],
}));

export const validateInPlaceAssimilationTask = defineTask('validate-in-place-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate ${args.frameworkDisplayName} in-place assimilation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'validation engineer for in-place framework assimilations',
      task: `Validate the implemented babysitter assimilation inside the ${args.frameworkDisplayName} host codebase with concrete checks.`,
      context: {
        projectDir: args.projectDir,
        frameworkId: args.frameworkId,
        frameworkDisplayName: args.frameworkDisplayName,
        plan: args.plan,
        research: args.research,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        'Read the concrete implementation and derive the narrowest honest validation plan from the actual files changed.',
        'Run the real checks that prove the host-side integration works: build or typecheck, framework-native tests, targeted smoke flows, session binding/resume checks, effect execution/posting checks, and operational surface checks where practical.',
        'Capture failures precisely with the command run, the observed failure, and the file or behavior implicated.',
        'If a validation step cannot run in the current environment, mark it as skipped with an exact blocker instead of treating it as passed.',
        'Return a machine-readable validation report that a fix task can consume directly.',
      ],
      outputFormat: 'JSON with passed, checks, failures, skips, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'checks', 'failures', 'skips', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        checks: { type: 'array', items: { type: 'object' } },
        failures: { type: 'array', items: { type: 'object' } },
        skips: { type: 'array', items: { type: 'object' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'validate'],
}));

export const fixInPlaceValidationFailuresTask = defineTask('fix-in-place-validation-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.frameworkDisplayName} validation failures`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'runtime engineer fixing concrete validation failures in a host codebase',
      task: `Fix the concrete validation failures in the ${args.frameworkDisplayName} babysitter assimilation.`,
      context: {
        projectDir: args.projectDir,
        frameworkId: args.frameworkId,
        frameworkDisplayName: args.frameworkDisplayName,
        plan: args.plan,
        research: args.research,
        validation: args.validation,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        'Prioritize failing validations over aspirational cleanup.',
        'Use the validation report to make the smallest honest host-code changes needed to turn failing checks green.',
        'Preserve the in-place host-runtime approach. Do not drift toward a distributable plugin/package design while fixing failures.',
        'Return the concrete failures addressed and the files changed.',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, failuresAddressed, residualRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'failuresAddressed', 'residualRisks'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        failuresAddressed: { type: 'array', items: { type: 'string' } },
        residualRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'fix', 'validate'],
}));

export const verifyInPlaceAssimilationTask = defineTask('verify-in-place-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score ${args.frameworkDisplayName} in-place assimilation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'staff engineer reviewing an in-place babysitter assimilation',
      task: `Review the implemented ${args.frameworkDisplayName} assimilation and score whether it truthfully integrates babysitter orchestration into the host codebase.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        targetQuality: args.targetQuality,
        integrationFiles: args.integrationFiles,
        validation: args.validation,
      },
      instructions: [
        'Score the work on technical fit, host-runtime fidelity, orchestration completeness, process-library integration, observability, and verification depth.',
        'Concrete validation failures must materially reduce the score even if the design looks plausible on inspection.',
        'Reject plugin/distribution detours that do not serve the in-place custom-harness objective.',
        'Identify the most important remaining issues and concrete fixes.',
      ],
      outputFormat: 'JSON with qualityScore, passed, dimensions, issues, recommendations',
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'passed', 'dimensions', 'issues', 'recommendations'],
      properties: {
        qualityScore: { type: 'number' },
        passed: { type: 'boolean' },
        dimensions: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'quality'],
}));

export const refineInPlaceAssimilationTask = defineTask('refine-in-place-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine ${args.frameworkDisplayName} assimilation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior engineer closing gaps in an in-place assimilation',
      task: `Refine the ${args.frameworkDisplayName} assimilation based on verification findings.`,
      context: {
        projectDir: args.projectDir,
        frameworkDisplayName: args.frameworkDisplayName,
        iteration: args.iteration,
        issues: args.issues,
        recommendations: args.recommendations,
        integrationFiles: args.integrationFiles,
      },
      instructions: [
        'Fix the highest-value gaps first.',
        'Keep the implementation aligned with the host runtime rather than drifting toward a reusable plugin package.',
        'Return all files changed and the issues addressed.',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, issuesAddressed, residualRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'issuesAddressed', 'residualRisks'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        issuesAddressed: { type: 'array', items: { type: 'string' } },
        residualRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assimilation', 'custom-harness', 'refinement'],
}));
