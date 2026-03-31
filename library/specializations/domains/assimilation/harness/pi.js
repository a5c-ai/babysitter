/**
 * @process assimilation/harness/pi
 * @description Deep integration of babysitter SDK into oh-my-pi (can1357/oh-my-pi) as a first-class orchestration layer using the real extension, plugin, tool, and TUI surfaces. Session start is initialization only; later loop turns should use the session and event context that oh-my-pi already provides.
 * @inputs { projectDir: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, integrationFiles: string[], finalQuality: number, iterations: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  adaptOriginalBabysitTask,
  refineHarnessAssimilationTask,
  runHarnessResearchTask,
  runHarnessRuntimeValidationTask,
  verifyHarnessAssimilationTask,
  writeHarnessInstallDocsTask
} from './shared-assimilation.js';

/**
 * Oh-My-Pi Deep Babysitter Integration Process
 *
 * This is NOT a light plugin integration. This makes babysitter the mandatory,
 * first-class orchestration backbone of oh-my-pi:
 *
 *   1. Every new session initializes babysitter state without relying on a startup bridge hack
 *   2. Built-in task/sub-agent management is bypassed in favor of babysitter effects
 *   3. TUI widgets show babysitter run status, task progress, iteration count
 *   4. A new CLI harness adapter ("pi") is created for `run:create --harness pi`
 *   5. Custom tools, commands, and AGENTS.md make babysitter seamless
 *   6. The agent_end + followUp loop driver replaces manual iteration while using native event context
 *
 * Architecture targets oh-my-pi (can1357/oh-my-pi) which extends Pi Coding Agent with:
 *   - Sub-agents/task tool with parallel execution + background jobs
 *   - Structured task management (todo tool) with phased progress
 *   - MCP support, model roles, custom commands, plugin system
 *   - Hash-anchored edits, LSP, Python, browser, ask tool
 *   - TUI with widgets, status line, overlays, differential rendering
 *   - Session JSONL with tree semantics, compaction, blob store
 *   - Extension API with full lifecycle events and tool registration
 *   - Custom tool factory pattern with CustomToolAPI
 *   - Plugin manager (install/uninstall/link/enable/disable)
 *
 * Phases:
 *   1. Analyze    - Deep inspection of omp internals, capabilities, existing config
 *   2. Scaffold   - Package structure, extension skeleton, directories
 *   3. Core       - Session auto-binding, CLI harness adapter, babysitter SDK wiring
 *   4. Takeover   - Task system interception, effect mapping, todo replacement
 *   5. TUI        - Widgets, status line, overlays for babysitter state
 *   6. UX         - Commands, AGENTS.md, skills, install/setup scripts
 *   7. Test       - Comprehensive integration + harness + TUI tests
 *   8. Verify     - Quality scoring on 12 criteria
 *   9. Converge   - Iterative refinement until target quality
 */
export async function process(inputs, ctx) {
  const {
    projectDir = 'plugins/babysitter-pi',
    targetQuality = 80,
    maxIterations = 8
  } = inputs;

  const integrationFiles = [];
  let finalQuality = 0;
  let iteration = 0;

  ctx.log('Starting oh-my-pi deep babysitter integration', { projectDir, targetQuality });

  const researchResult = await ctx.task(runHarnessResearchTask, {
    projectDir,
    harnessName: 'oh-my-pi',
    upstreamSource: 'official oh-my-pi package and plugin ecosystem plus the canonical babysitter plugin repo',
    distributionTarget: 'Pi package install flow, extension hooks, commands, skills, and runtime sync path',
    loopModel: 'agent_end and followUp continuation with explicit validation of user-yield reentry, using native session context rather than a startup hook bridge'
  });

  integrationFiles.push(...(researchResult.artifactsCreated || []));

  // ============================================================================
  // PHASE 1: ANALYZE
  // ============================================================================

  ctx.log('Phase 1: Deep analysis of oh-my-pi internals');

  let analysis = await ctx.task(analyzeOmpDeepTask, { projectDir });

  ctx.log('Analysis complete', {
    ompInstalled: analysis.ompInstalled,
    taskSystem: analysis.hasTaskSystem,
    todoTool: analysis.hasTodoTool,
    pluginSystem: analysis.hasPluginSystem,
    tuiWidgets: analysis.hasTuiWidgets,
    askTool: analysis.hasAskTool
    let lastFeedback_phase1Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase1Review) {
      analysis = await ctx.task(analyzeOmpDeepTask, { ...{ projectDir }, feedback: lastFeedback_phase1Review, attempt: attempt + 1 });
    }
  const phase1Review = await ctx.breakpoint({
    question: `Deep analysis of oh-my-pi complete. Task system: ${analysis.hasTaskSystem}. Todo tool: ${analysis.hasTodoTool}. Plugin system: ${analysis.hasPluginSystem}. TUI widgets: ${analysis.hasTuiWidgets}. Proceed with deep integration?`,
    title: 'Review oh-my-pi Deep Analysis',
    context: { runId: ctx.runId },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase1Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase1Review.approved) break;
    lastFeedback_phase1Review = phase1Review.response || phase1Review.feedback || 'Changes requested';
  }
  // ============================================================================
  // PHASE 2: SCAFFOLD
  // ============================================================================

  ctx.log('Phase 2: Scaffold plugin package and directory structure');

  const [packageResult, extensionResult] = await ctx.parallel.all([
    async () => {
      const r = await ctx.task(scaffoldPackageTask, { projectDir, analysis });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    },
    async () => {
      const r = await ctx.task(scaffoldExtensionSkeletonTask, { projectDir, analysis });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    }
  ]);

  ctx.log('Scaffold complete', { totalFiles: integrationFiles.length });

  const assimilationResult = await ctx.task(adaptOriginalBabysitTask, {
    projectDir,
    harnessName: 'oh-my-pi',
    upstreamSource: 'the canonical babysitter plugin repo and its babysit process library',
    research: researchResult
  });

  integrationFiles.push(...(assimilationResult.filesCreated || []), ...(assimilationResult.filesModified || []));

  // ============================================================================
  // PHASE 3: CORE -- Session auto-binding + CLI harness adapter
  // ============================================================================

  ctx.log('Phase 3: Core infrastructure -- session binding + harness adapter');

  const [sessionBindResult, harnessAdapterResult, cliWrapperResult] = await ctx.parallel.all([
    // (a) Session auto-binding: every new session gets babysitter hooks
    async () => {
      const r = await ctx.task(implementSessionAutoBindTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (b) CLI harness adapter: new harness type "pi" for run:create --harness pi
    async () => {
      const r = await ctx.task(implementHarnessAdapterTask, {
        projectDir, analysis
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (c) CLI wrapper: robust babysitter CLI invocation helper
    async () => {
      const r = await ctx.task(implementCliWrapperTask, {
        projectDir
      });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    }
  ]);

  // (d) Loop driver via agent_end -- depends on session binding
  const loopDriverResult = await ctx.task(implementLoopDriverTask, {
    projectDir, analysis,
    extensionFile: extensionResult.extensionEntryFile
  });
  integrationFiles.push(...(loopDriverResult.filesCreated || []), ...(loopDriverResult.filesModified || []));

  ctx.log('Core infrastructure complete');

  // ============================================================================
  // PHASE 4: TAKEOVER -- Replace task system, intercept effects, bypass todo
  // ============================================================================

  ctx.log('Phase 4: Task system takeover');

  const [taskInterceptResult, effectMapResult, todoReplaceResult, resultPostResult, guardsResult] = await ctx.parallel.all([
    // (a) Intercept the built-in task tool to route through babysitter
    async () => {
      const r = await ctx.task(implementTaskInterceptionTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (b) Map babysitter effects to omp capabilities
    async () => {
      const r = await ctx.task(implementEffectMappingTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (c) Replace todo tool with babysitter-driven task tracking
    async () => {
      const r = await ctx.task(implementTodoReplacementTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (d) Result posting adapter
    async () => {
      const r = await ctx.task(implementResultPostingTask, {
        projectDir,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (e) Iteration guards and runaway detection
    async () => {
      const r = await ctx.task(implementIterationGuardsTask, {
        projectDir, maxIterations,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    }
  ]);

  ctx.log('Task system takeover complete');

  // ============================================================================
  // PHASE 5: TUI -- Widgets, status line, overlays
  // ============================================================================

  ctx.log('Phase 5: TUI integration');

  const [widgetsResult, statusResult, toolRenderResult] = await ctx.parallel.all([
    // (a) TUI widgets for babysitter run state
    async () => {
      const r = await ctx.task(implementTuiWidgetsTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (b) Status line integration
    async () => {
      const r = await ctx.task(implementStatusLineTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    },
    // (c) Custom rendering for babysitter tool calls/results
    async () => {
      const r = await ctx.task(implementToolRenderingTask, {
        projectDir, analysis,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    }
  ]);

  ctx.log('TUI integration complete');

  // ============================================================================
  // PHASE 6: UX -- Commands, AGENTS.md, skills, install scripts
  // ============================================================================

  ctx.log('Phase 6: UX layer');

  const [commandsResult, agentsMdResult, skillsResult, installResult, customToolsResult] = await ctx.parallel.all([
    async () => {
      const r = await ctx.task(implementCommandsTask, { projectDir });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    },
    async () => {
      const r = await ctx.task(implementAgentsMdTask, { projectDir, analysis });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    },
    async () => {
      const r = await ctx.task(implementSkillsTask, { projectDir });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    },
    async () => {
      const r = await ctx.task(implementInstallScriptsTask, { projectDir, analysis });
      integrationFiles.push(...(r.filesCreated || []));
      return r;
    },
    async () => {
      const r = await ctx.task(implementCustomToolsTask, {
        projectDir,
        extensionFile: extensionResult.extensionEntryFile
      });
      integrationFiles.push(...(r.filesCreated || []), ...(r.filesModified || []));
      return r;
    }
  ]);

  ctx.log('UX layer complete', { totalFiles: integrationFiles.length });

  const docsResult = await ctx.task(writeHarnessInstallDocsTask, {
    projectDir,
    harnessName: 'oh-my-pi',
    research: researchResult,
    assimilation: assimilationResult
  });

  integrationFiles.push(...(docsResult.filesCreated || []), ...(docsResult.filesModified || []));

  // ============================================================================
  // PHASE 7: TEST
  // ============================================================================

  ctx.log('Phase 7: Testing');

  const testResult = await ctx.task(runTestsTask, {
    projectDir, integrationFiles, analysis
  });

  ctx.log('Tests complete', { passed: testResult.passed, failed: testResult.failed, total: testResult.total });

  let runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
    projectDir,
    harnessName: 'oh-my-pi',
    loopModel: 'agent_end and followUp continuation with explicit validation of user-yield reentry, using native session context rather than a startup hook bridge',
    research: researchResult,
    docs: docsResult,
    integrationFiles,
    localTestResult: testResult
  });

  // ============================================================================
  // PHASE 8: VERIFY
  // ============================================================================

  ctx.log('Phase 8: Quality verification');

  let verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
    projectDir,
    harnessName: 'oh-my-pi',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    analysis,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  });

  finalQuality = verifyResult.qualityScore;
  iteration = 1;
  ctx.log('Verification', { quality: finalQuality, target: targetQuality });

  // ============================================================================
  // PHASE 9: CONVERGE
  // ============================================================================

  while (finalQuality < targetQuality && iteration < maxIterations) {
    iteration++;
    let lastFeedback_iterationApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_iterationApproval) {
        verifyResult = await ctx.task(verifyHarnessAssimilationTask, { ...{
    projectDir,
    harnessName: 'oh-my-pi',
    research: researchResult,
    assimilation: assimilationResult,
    docs: docsResult,
    analysis,
    integrationFiles,
    localTestResult: testResult,
    runtimeValidation: runtimeValidationResult,
    targetQuality
  }, feedback: lastFeedback_iterationApproval, attempt: attempt + 1 });
      }
  const iterationApproval = await ctx.breakpoint({
      question: `Quality: ${finalQuality}/${targetQuality} after iteration ${iteration - 1}. Issues: ${verifyResult.issues?.slice(0, 3).join('; ') || 'none'}. Continue?`,
      title: `Convergence ${iteration}`,
      context: { runId: ctx.runId },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_iterationApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (iterationApproval.approved) break;
      lastFeedback_iterationApproval = iterationApproval.response || iterationApproval.feedback || 'Changes requested';
    }
  const fix = await ctx.task(refineHarnessAssimilationTask, {
      projectDir, integrationFiles,
      harnessName: 'oh-my-pi',
      issues: verifyResult.issues,
      recommendations: verifyResult.recommendations,
      iteration, analysis
    });
    integrationFiles.push(...(fix.filesCreated || []), ...(fix.filesModified || []));

    const retest = await ctx.task(runTestsTask, { projectDir, integrationFiles, analysis });

    runtimeValidationResult = await ctx.task(runHarnessRuntimeValidationTask, {
      projectDir,
      harnessName: 'oh-my-pi',
      loopModel: 'agent_end and followUp continuation with explicit validation of user-yield reentry, using native session context rather than a startup hook bridge',
      research: researchResult,
      docs: docsResult,
      integrationFiles,
      localTestResult: retest
    });

    verifyResult = await ctx.task(verifyHarnessAssimilationTask, {
      projectDir,
      harnessName: 'oh-my-pi',
      research: researchResult,
      assimilation: assimilationResult,
      docs: docsResult,
      analysis,
      integrationFiles,
      localTestResult: retest,
      runtimeValidation: runtimeValidationResult,
      targetQuality
    });
    finalQuality = verifyResult.qualityScore;
    ctx.log(`Iteration ${iteration} complete`, { quality: finalQuality });
  }
  // ============================================================================
  // RESULT
  // ============================================================================

  const success = finalQuality >= targetQuality;
  ctx.log('oh-my-pi deep integration complete', { success, finalQuality, iterations: iteration });

  return {
    success,
    integrationFiles: [...new Set(integrationFiles)],
    finalQuality,
    targetQuality,
    iterations: iteration,
    projectDir,
    phases: ['analyze', 'scaffold', 'core', 'takeover', 'tui', 'ux', 'test', 'verify', 'converge'],
    metadata: { processId: 'assimilation/harness/pi', timestamp: ctx.now() }
  };
}
  // ============================================================================
// TASK DEFINITIONS
// ============================================================================

// --- PHASE 1: ANALYZE ---

export const analyzeOmpDeepTask = defineTask('analyze-omp-deep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deep analysis of oh-my-pi internals',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration architect analyzing oh-my-pi for deep babysitter integration',
      task: 'Perform deep analysis of oh-my-pi installation, internals, and integration points for making babysitter a mandatory first-class orchestration layer',
      context: { projectDir: args.projectDir },
      instructions: [
        'Check omp installation: `omp --version`, `which omp`, npm global packages',
        'Check babysitter SDK: `babysitter version --json`',
        'Record the installed Node.js version and compare it to current package requirements instead of assuming an older minimum',
        'Analyze oh-my-pi task system:',
        '  - Does the task tool exist? Check for task/sub-agent support',
        '  - What built-in agents or shipped defaults exist (explore, plan, designer, reviewer, task, quick_task)?',
        '  - How does TaskTool.execute work? (discovery, spawn policy, recursion depth)',
        'Analyze oh-my-pi todo tool:',
        '  - Does the todo widget exist? (phases, task states, Ctrl+T toggle)',
        '  - How does it integrate with the TUI?',
        'Analyze extension API:',
        '  - What events are available? (session_start, agent_end, tool_call, etc.)',
        '  - Which later callbacks already include session identity or handles so we do not need session_start as a synthetic bridge?',
        '  - Can we intercept/block tool calls? (tool_call returns { block: true })',
        '  - Can we modify context? (context event returns { messages })',
        '  - Can we inject messages? (sendHookMessage, appendEntry)',
        'Analyze TUI:',
        '  - Widget system (setWidget above editor)',
        '  - Status line (setStatus key/text)',
        '  - Custom UI components (ctx.ui.custom)',
        '  - Overlays and notifications',
        'Analyze plugin system:',
        '  - omp plugin install/list/link/enable/disable',
        '  - install or sync from GitHub or workspace source for operator docs',
        '  - Plugin manifest (package.json.omp or .pi)',
        '  - Feature toggles, capability resolution',
        'Analyze custom tool system:',
        '  - CustomToolFactory pattern, CustomToolAPI surface',
        '  - Tool discovery paths (.omp/tools/, plugins)',
        'Analyze session system:',
        '  - JSONL format, tree semantics, compaction',
        '  - Session init, switch, fork events',
        'Check existing .omp/ and .a5c/ directories',
        'Create target directory if it does not exist: mkdir -p plugins/babysitter-pi',
        'Return comprehensive analysis JSON'
      ],
      outputFormat: 'JSON with ompInstalled, ompVersion, hasTaskSystem, hasTodoTool, hasPluginSystem, hasTuiWidgets, hasAskTool, hasModelRoles, hasBackgroundJobs, hasMcpSupport, extensionEvents (array), tuiCapabilities (array), pluginManifestFormat, customToolApiSurface, sessionFormat, existingConfigFiles (array), nodeVersion, hasBabysitterSdk, recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['ompInstalled', 'hasTaskSystem', 'hasTodoTool', 'hasPluginSystem'],
      properties: {
        ompInstalled: { type: 'boolean' },
        ompVersion: { type: 'string' },
        hasTaskSystem: { type: 'boolean' },
        hasTodoTool: { type: 'boolean' },
        hasPluginSystem: { type: 'boolean' },
        hasTuiWidgets: { type: 'boolean' },
        hasAskTool: { type: 'boolean' },
        hasModelRoles: { type: 'boolean' },
        hasBackgroundJobs: { type: 'boolean' },
        hasMcpSupport: { type: 'boolean' },
        extensionEvents: { type: 'array', items: { type: 'string' } },
        tuiCapabilities: { type: 'array', items: { type: 'string' } },
        pluginManifestFormat: { type: 'string' },
        customToolApiSurface: { type: 'string' },
        sessionFormat: { type: 'string' },
        existingConfigFiles: { type: 'array', items: { type: 'string' } },
        nodeVersion: { type: 'string' },
        hasBabysitterSdk: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'analysis']
}));

// --- PHASE 2: SCAFFOLD ---

export const scaffoldPackageTask = defineTask('scaffold-pi-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Pi plugin package structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Node.js package and Pi plugin expert',
      task: 'Create the complete package structure for babysitter-pi deep integration plugin',
      context: { projectDir: args.projectDir, analysis: args.analysis },
      instructions: [
        `Create complete directory structure at ${args.projectDir}/`,
        'Create package.json with omp plugin manifest:',
        '  name: "babysitter-pi"',
        '  version: "0.1.0", type: "module"',
        '  keywords: ["pi-package", "omp", "babysitter", "orchestration"]',
        '  omp (or pi) manifest: { extensions: ["./extensions"], skills: ["./skills"], tools: ["./tools"] }',
        '  dependencies: { "@a5c-ai/babysitter-sdk": "latest" }',
        '  peerDependencies: { "@mariozechner/pi-coding-agent": "*" }',
        '  scripts: { test, postinstall, preuninstall }',
        'Create directories: extensions/babysitter/, tools/, skills/babysitter/, commands/,',
        '  scripts/, test/, docs/, state/',
        'Create .gitignore (node_modules, state/, *.tmp)',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success', 'filesCreated'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'scaffold']
}));

export const scaffoldExtensionSkeletonTask = defineTask('scaffold-extension-skeleton', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create extension skeleton with all module stubs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer building an oh-my-pi extension',
      task: 'Create the extension entry point and all helper module stubs',
      context: { projectDir: args.projectDir, analysis: args.analysis },
      instructions: [
        `Create ${args.projectDir}/extensions/babysitter/index.ts -- main entry point`,
        'Export default function(pi: ExtensionAPI) with event subscription stubs discovered in analysis:',
        '  pi.on("session_start", ...) pi.on("agent_end", ...) pi.on("session_shutdown", ...)',
        '  pi.on("before_agent_start", ...) pi.on("tool_call", ...) pi.on("tool_result", ...)',
        '  pi.on("input", ...) pi.on("context", ...)',
        'Create helper module stubs:',
        `  session-binder.ts -- auto-binds every session to babysitter`,
        `  loop-driver.ts -- agent_end + followUp orchestration loop`,
        `  cli-wrapper.ts -- babysitter CLI invocation helper`,
        `  effect-executor.ts -- effect kind -> omp capability mapping`,
        `  result-poster.ts -- task:post integration`,
        `  guards.ts -- iteration guards + runaway detection`,
        `  task-interceptor.ts -- intercept built-in task tool for babysitter routing`,
        `  todo-replacement.ts -- replace todo widget with babysitter task tracking`,
        `  tui-widgets.ts -- TUI widget rendering for babysitter state`,
        `  status-line.ts -- status line integration`,
        `  tool-renderer.ts -- custom rendering for babysitter tool calls`,
        `  types.ts -- TypeScript type definitions`,
        `  constants.ts -- configuration constants and env vars`,
        'Return extensionEntryFile path'
      ],
      outputFormat: 'JSON with success, filesCreated (array), extensionEntryFile (string)'
    },
    outputSchema: {
      type: 'object', required: ['success', 'filesCreated', 'extensionEntryFile'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, extensionEntryFile: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'scaffold']
}));

// --- PHASE 3: CORE ---

export const implementSessionAutoBindTask = defineTask('implement-session-auto-bind', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auto-bind every new session to babysitter hooks',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer making babysitter mandatory in every oh-my-pi session',
      task: 'Implement automatic session binding so every new oh-my-pi session initializes babysitter hooks',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit session-binder.ts at ${args.projectDir}/extensions/babysitter/session-binder.ts`,
        '',
        'On session_start (fires for every new session):',
        '  1. Generate session ID: omp-<timestamp>-<random8hex>',
        '  2. Determine state directory: {projectDir}/state/',
        '  3. Call: babysitter session:init --session-id <id> --state-dir <stateDir> --json',
        '  4. Store session state using pi.appendEntry() for persistence across restarts',
        '  5. Set ctx.ui.setStatus("babysitter", "Session initialized")',
        '  6. Set ctx.ui.setWidget("babysitter", ["Babysitter: ready"])',
        '  7. Do not use session_start as a fake bridge for later loop callbacks when agent_end or session objects already carry the current identity',
        '',
        'On session_before_switch (fires before /new or /resume):',
        '  - Check for active run; if active, warn user and offer to save state',
        '  - Use ctx.ui.confirm("Active run detected", "Save and switch?")',
        '',
        'On session_shutdown:',
        '  - Clean up temporary state files',
        '  - Log active run status if any',
        '',
        'CRITICAL: This must be automatic -- no user action required to initialize babysitter.',
        'Every single session gets babysitter hooks, not just /babysitter:call sessions.',
        '',
        'Also implement state file management:',
        '  readState(stateDir): parse markdown state file',
        '  writeState(stateDir, state): atomic write with tmp+rename',
        '  State: { sessionId, runId, iteration, maxIterations, iterationTimes[], startedAt, followUpCapable, lastNativeSessionHandle }',
        '',
        'Wire into the main extension index.ts',
        'Return list of files modified'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'core', 'session-bind']
}));

export const implementHarnessAdapterTask = defineTask('implement-harness-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create babysitter CLI harness adapter for "pi" harness type',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior SDK integration engineer creating a new babysitter harness adapter',
      task: 'Create a new harness adapter that enables `babysitter run:create --harness pi` with automatic session binding and oh-my-pi specific orchestration',
      context: { projectDir: args.projectDir, analysis: args.analysis },
      instructions: [
        'The babysitter SDK supports harness types (claude-code, codex, etc.) for run:create --harness <type>',
        'Create a new harness adapter for "pi" that understands oh-my-pi session binding',
        '',
        `Create ${args.projectDir}/extensions/babysitter/harness-adapter.ts:`,
        '',
        'The adapter should handle:',
        '  1. Session initialization: call session:init with omp session ID',
        '  2. Prefer native harness binding to the current omp session; only use explicit association if the researched pi harness surface truly lacks first-class binding',
        '  3. State file management: write/read state in the plugin state directory',
        '  4. Iteration message generation: build omp-specific continuation prompts',
        '  5. Completion detection: scan for <promise>PROOF</promise> tags',
        '',
        'The adapter integrates with the CLI wrapper to call:',
        '  babysitter run:create --harness pi --session-id <id> --plugin-root <pluginDir> --json',
        '  babysitter session:check-iteration --session-id <id> --run-id <runId> --json',
        '  babysitter session:iteration-message --iteration <n> --run-id <runId> --json',
        '',
        'Also register the harness adapter functions in the main extension so they can be',
        'called from commands and the loop driver',
        '',
        'Return list of files created/modified'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'core', 'harness-adapter']
}));

export const implementCliWrapperTask = defineTask('implement-cli-wrapper', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement robust babysitter CLI wrapper',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Create a robust CLI wrapper for invoking babysitter commands from the extension',
      context: { projectDir: args.projectDir },
      instructions: [
        `Create ${args.projectDir}/extensions/babysitter/cli-wrapper.ts`,
        '',
        'Implement runBabysitterCli(command, args, options) that:',
        '  1. Detects the active babysitter runtime path in researched order: synced process-library wrapper or project-local install first, then documented package-manager or global fallback if needed',
        '  2. Spawns child process with JSON output mode',
        '  3. Parses JSON stdout into structured result',
        '  4. Handles errors (exit code != 0, parse failures, timeouts)',
        '  5. Supports timeout via AbortController + signal',
        '  6. Logs commands and results for debugging',
        '',
        'Implement convenience wrappers:',
        '  sessionInit(sessionId, stateDir)',
        '  runCreate(processId, entryPoint, inputs, prompt, sessionId, pluginRoot)',
        '  runIterate(runDir, iteration, pluginRoot)',
        '  runStatus(runDir)',
        '  taskPost(runDir, effectId, status, valuePath)',
        '  taskList(runDir, pending)',
        '  sessionCheckIteration(sessionId, runId, runsDir, pluginRoot)',
        '  sessionIterationMessage(iteration, runId, runsDir, pluginRoot)',
        '  health()',
        '  version()',
        '',
        'Handle cross-platform (Windows path issues, shell escaping)',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'core', 'cli-wrapper']
}));

export const implementLoopDriverTask = defineTask('implement-loop-driver', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement orchestration loop driver via agent_end + followUp',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer implementing the core orchestration loop',
      task: 'Implement the agent_end event handler that drives babysitter orchestration by injecting follow-up prompts after each agent turn',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit loop-driver.ts at ${args.projectDir}/extensions/babysitter/loop-driver.ts`,
        '',
        'oh-my-pi does NOT have a Stop hook that blocks exit like Claude Code.',
        'Instead, agent_end fires when the LLM finishes. We use the current session handle and session.followUp() to continue.',
        '',
        'agent_end handler:',
        '  1. Read current event or session context first, then session state (sessionId, runId, iteration, etc.)',
        '  2. If no active run -> return (do nothing)',
        '  3. Scan last agent output for <promise>VALUE</promise> completion proof',
        '  4. If completion proof found:',
        '     a. Verify against run:status completionProof',
        '     b. If match: cleanup state, notify "Run completed!", return',
        '  5. Run iteration guards (max iterations, runaway, run status)',
        '  6. If guards say stop: cleanup, notify reason, return',
        '  7. Otherwise continue:',
        '     a. Increment iteration counter, record time',
        '     b. Call session:check-iteration to get orchestration state',
        '     c. Call run:iterate to get pending effects',
        '     d. Build continuation prompt with:',
        '        - Current iteration number',
        '        - Pending effects list with instructions',
        '        - Reminder of orchestration protocol',
        '     e. Inject via session.followUp(continuationPrompt)',
        '  8. Never depend on session_start breadcrumbs for the current session identity when agent_end already gives you the session handle',
        '',
        'extractPromiseTag(text): regex for <promise>([^<]+)</promise>',
        '',
        'Wire into main extension index.ts',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'core', 'loop-driver']
}));

// --- PHASE 4: TAKEOVER ---

export const implementTaskInterceptionTask = defineTask('implement-task-interception', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Intercept built-in task tool to route through babysitter',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer replacing oh-my-pi task management with babysitter',
      task: 'Intercept oh-my-pi built-in task/sub-agent tool calls and route them through babysitter effect system',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit task-interceptor.ts at ${args.projectDir}/extensions/babysitter/task-interceptor.ts`,
        '',
        'oh-my-pi has a built-in "task" tool that spawns sub-agents. We intercept it via tool_call:',
        '',
        '  pi.on("tool_call", async (event, ctx) => {',
        '    if (event.toolName === "task" && hasActiveRun()) {',
        '      // Redirect: instead of spawning omp sub-agent directly,',
        '      // create a babysitter effect for this task',
        '      // The babysitter orchestration loop will handle execution',
        '      return { block: true, reason: "Routed through babysitter orchestration" };',
        '    }',
        '  })',
        '',
        'When a task call is intercepted:',
        '  1. Extract agent name, prompt, and parameters from event.input',
        '  2. Create a babysitter agent effect via run:iterate or by preparing the effect',
        '  3. The loop driver will pick up the pending effect and execute it',
        '  4. Post result back via task:post',
        '',
        'When NO active babysitter run exists, let the task tool work normally.',
        'This ensures babysitter is mandatory DURING runs but doesnt break normal use.',
        '',
        'Also intercept "quick_task" tool similarly.',
        '',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'takeover', 'task-intercept']
}));

export const implementEffectMappingTask = defineTask('implement-effect-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map babysitter effects to oh-my-pi capabilities',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer mapping babysitter effects to oh-my-pi execution',
      task: 'Implement the effect execution dispatcher that maps babysitter effect kinds to oh-my-pi tools, sub-agents, and UI features',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit effect-executor.ts at ${args.projectDir}/extensions/babysitter/effect-executor.ts`,
        '',
        'Map each babysitter effect kind to oh-my-pi execution:',
        '',
        '  agent: Use omp sub-agent/task tool (unblocked for this call)',
        '    - Build prompt from agent config (role, task, context, instructions)',
        '    - Use model roles: pi/smol for quick, pi/slow for complex',
        '    - Support background jobs for parallel effects if available',
        '',
        '  shell: Execute via bash tool: <command>',
        '    - If a task needs local code execution, keep the public effect kind as shell or agent; do not generate public node effects',
        '',
        '  breakpoint: Use oh-my-pi ask tool or ctx.ui.confirm',
        '    - Present question with explicit Approve/Reject options',
        '    - NEVER auto-approve -- always require user input',
        '    - If no UI (headless): keep pending, do not resolve',
        '',
        '  sleep: setTimeout with timestamp check',
        '',
        '  skill: Expand via /skill:<name> command',
        '',
        '  complex orchestration request: Delegate to sub-agent with an agent-style orchestrator prompt while keeping the public effect kind as agent or skill',
        '',
        'Each handler returns: { status: "ok"|"error", value: object }',
        'Include comprehensive error handling',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array), mappedEffectKinds (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } }, mappedEffectKinds: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'takeover', 'effect-mapping']
}));

export const implementTodoReplacementTask = defineTask('implement-todo-replacement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Replace todo widget with babysitter task tracking',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer replacing oh-my-pi todo system with babysitter task tracking',
      task: 'Replace the built-in todo tool and widget with babysitter-driven task tracking that shows process phases, pending effects, and completion status',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit todo-replacement.ts at ${args.projectDir}/extensions/babysitter/todo-replacement.ts`,
        '',
        'oh-my-pi has a "todo" tool with phases and tasks displayed as a widget above the editor.',
        'We replace this with babysitter process state:',
        '',
        '1. Intercept the "todo" tool via tool_call when a babysitter run is active:',
        '   pi.on("tool_call", ...) block todo tool, return babysitter task state instead',
        '',
        '2. Instead, populate the widget with babysitter data:',
        '   - Process phases (from the process definition)',
        '   - Current phase and task being executed',
        '   - Pending effects with their kinds and titles',
        '   - Completed effects with scores/results',
        '   - Iteration count and quality progress',
        '',
        '3. Use ctx.ui.setWidget("babysitter-tasks", [...]) to render:',
        '   Format example:',
        '   ┌ Babysitter Run: <runId> ─── Phase 3/6: Implement',
        '   │ [x] analyze-project (score: 85)',
        '   │ [x] scaffold-integration',
        '   │ [>] implement-session-hooks (in progress)',
        '   │ [ ] implement-loop-driver',
        '   │ [ ] implement-effect-mapping',
        '   └ Iteration 3/256 ─── Quality: 72/80',
        '',
        '4. Update widget on every iteration (in the loop driver)',
        '',
        '5. Toggle visibility with todo.reminders or Ctrl+T (reuse existing keybinding)',
        '',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'takeover', 'todo-replace']
}));

export const implementResultPostingTask = defineTask('implement-result-posting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement result posting via task:post',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Implement result posting that feeds effect outcomes back to babysitter via task:post',
      context: { projectDir: args.projectDir, extensionFile: args.extensionFile },
      instructions: [
        `Edit result-poster.ts at ${args.projectDir}/extensions/babysitter/result-poster.ts`,
        'Implement postResult(runDir, effectId, result):',
        '  1. Write value to tasks/<effectId>/output.json (NEVER result.json)',
        '  2. Call: babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json --json',
        '  3. Handle BLOB_THRESHOLD (1 MiB)',
        '  4. Retry 3x on EBUSY/ETXTBSY/EPERM/EACCES',
        'Implement postError(runDir, effectId, error):',
        '  1. Write error to tasks/<effectId>/error.json',
        '  2. Call: babysitter task:post ... --status error --error ...',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'takeover', 'result-posting']
}));

export const implementIterationGuardsTask = defineTask('implement-iteration-guards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement iteration guards and runaway detection',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reliability engineer',
      task: 'Implement iteration guards that prevent runaway loops',
      context: { projectDir: args.projectDir, maxIterations: args.maxIterations, extensionFile: args.extensionFile },
      instructions: [
        `Edit guards.ts at ${args.projectDir}/extensions/babysitter/guards.ts`,
        'Implement guard functions:',
        '  checkMaxIterations(state): iter >= max (BABYSITTER_MAX_ITERATIONS, default 256)',
        '  checkRunawayLoop(state): avg of last 3 iters <= 15s after 5+ iterations',
        '  checkSessionBound(state): runId empty',
        '  checkRunStatus(runDir): run:status fails or status="failed"',
        '  checkCompletionProof(runDir, lastOutput): extract promise tag, verify against proof',
        '  cleanupSession(stateDir): remove state file, reset counters',
        'Export shouldContinue(state, runDir, lastOutput) -> { continue: bool, reason: string }',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'takeover', 'guards']
}));

// --- PHASE 5: TUI ---

export const implementTuiWidgetsTask = defineTask('implement-tui-widgets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create TUI widgets for babysitter run state',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TUI engineer integrating babysitter state visualization into oh-my-pi',
      task: 'Create TUI widgets that display babysitter run status, process phases, pending effects, and quality scores in oh-my-pi',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit tui-widgets.ts at ${args.projectDir}/extensions/babysitter/tui-widgets.ts`,
        '',
        'oh-my-pi extensions can display widgets above the editor via ctx.ui.setWidget(key, lines)',
        'and show custom overlays via ctx.ui.custom()',
        '',
        'Create the following widgets:',
        '',
        '1. Run Status Widget (always visible when run active):',
        '   Rendered via setWidget("babysitter-run", [...])',
        '   Shows: runId, processId, status, iteration count, elapsed time',
        '   Example: "Run abc123 | Phase: implement | Iter 5/256 | 2m30s"',
        '',
        '2. Task Progress Widget (toggleable, default visible):',
        '   Rendered via setWidget("babysitter-tasks", [...])',
        '   Shows process phases with checkmarks, current task, pending count',
        '   Uses Unicode box-drawing chars for structure',
        '',
        '3. Quality Score Widget (shown during verify/converge phases):',
        '   Shows quality score, target, criteria breakdown',
        '   Example: "Quality: 72/80 ████████░░ [accuracy:85 completeness:70 tests:60]"',
        '',
        'Implement updateWidgets(state, ctx) that refreshes all widgets from current state',
        'Call this from the loop driver after each iteration',
        '',
        'Implement clearWidgets(ctx) for cleanup on run completion',
        '',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'tui', 'widgets']
}));

export const implementStatusLineTask = defineTask('implement-status-line', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate babysitter into oh-my-pi status line',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TUI engineer',
      task: 'Add babysitter run state indicators to the oh-my-pi status line at the bottom of the terminal',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit status-line.ts at ${args.projectDir}/extensions/babysitter/status-line.ts`,
        'oh-my-pi status line is updated via ctx.ui.setStatus(key, text)',
        'Status entries are sorted by key and displayed at the bottom',
        '',
        'Add status indicators:',
        '  "babysitter": Shows run state -- "idle", "running iter 5", "completed", "failed"',
        '  Updated on every agent_end iteration and on run completion/failure',
        '',
        'Use color-coding via ANSI if supported:',
        '  Green for completed/idle',
        '  Yellow for running',
        '  Red for failed',
        '',
        'Export updateStatusLine(state, ctx) and clearStatusLine(ctx)',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'tui', 'status']
}));

export const implementToolRenderingTask = defineTask('implement-tool-rendering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Custom rendering for babysitter tool calls and results',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TUI engineer',
      task: 'Create custom message renderers for babysitter tool calls so they display cleanly in the TUI',
      context: { projectDir: args.projectDir, analysis: args.analysis, extensionFile: args.extensionFile },
      instructions: [
        `Edit tool-renderer.ts at ${args.projectDir}/extensions/babysitter/tool-renderer.ts`,
        'oh-my-pi extensions can register custom message renderers via pi.registerMessageRenderer()',
        'Use this to render babysitter tool calls/results in a clean, informative way',
        '',
        'For babysitter_run_status results: show formatted status table',
        'For babysitter_task_post results: show compact "Posted result for <effectId>"',
        'For babysitter_run_iterate results: show pending effects summary',
        '',
        'Also intercept tool_result events for babysitter tools to update widgets',
        '',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'tui', 'rendering']
}));

// --- PHASE 6: UX ---

export const implementCommandsTask = defineTask('implement-commands', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create /babysitter:* custom commands',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer building oh-my-pi commands',
      task: 'Create slash commands for babysitter operations in oh-my-pi',
      context: { projectDir: args.projectDir },
      instructions: [
        'oh-my-pi supports custom commands at .omp/commands/[name]/index.ts',
        'Create the following commands:',
        `  ${args.projectDir}/commands/babysitter-call/index.ts -- /babysitter:call`,
        `  ${args.projectDir}/commands/babysitter-resume/index.ts -- /babysitter:resume`,
        `  ${args.projectDir}/commands/babysitter-status/index.ts -- /babysitter:status`,
        `  ${args.projectDir}/commands/babysitter-doctor/index.ts -- /babysitter:doctor`,
        `  ${args.projectDir}/commands/babysitter-yolo/index.ts -- /babysitter:yolo (non-interactive)`,
        'Each exports factory: (ctx) => ({ name, description, execute(args, ctx) })',
        'Commands should use ctx.ui for notifications',
        '/babysitter:call should return a prompt string that starts orchestration',
        '/babysitter:status should display run status via ctx.ui.notify',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'ux', 'commands']
}));

export const implementAgentsMdTask = defineTask('implement-agents-md', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create AGENTS.md with babysitter orchestration protocol',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI agent instruction designer',
      task: 'Create AGENTS.md that instructs the oh-my-pi agent to follow babysitter orchestration protocol as a mandatory first-class citizen',
      context: { projectDir: args.projectDir, analysis: args.analysis },
      instructions: [
        `Create ${args.projectDir}/AGENTS.md`,
        'This file is loaded by oh-my-pi at session start as LLM context',
        'Make babysitter orchestration MANDATORY, not optional',
        'Include comprehensive protocol instructions for:',
        '  - Session initialization (automatic via extension)',
        '  - Run creation and binding',
        '  - Effect execution protocol (by kind)',
        '  - Result posting (write output.json, call task:post, NEVER write result.json)',
        '  - Loop control (dont call run:iterate multiple times per turn)',
        '  - Completion signaling (<promise>PROOF</promise>)',
        '  - Error handling and recovery',
        '  - Available babysitter tools (registered in extension)',
        'Keep instructions concise and LLM-friendly',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'ux', 'agents-md']
}));

export const implementSkillsTask = defineTask('implement-skills', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create babysitter orchestration skill for Pi',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'skill designer',
      task: 'Create a SKILL.md for babysitter orchestration in oh-my-pi',
      context: { projectDir: args.projectDir },
      instructions: [
        `Create ${args.projectDir}/skills/babysitter/SKILL.md`,
        'Follow Agent Skills standard with frontmatter:',
        '  name: babysitter, description: "Babysitter SDK orchestration..."',
        'Include usage instructions for /babysitter:call, :resume, :status',
        'Include effect execution guide',
        'Include troubleshooting section',
        'Return list of files created'
      ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'ux', 'skills']
}));

export const implementInstallScriptsTask = defineTask('implement-install-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create install/setup scripts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer',
      task: 'Create installation and setup scripts for the babysitter-pi plugin',
      context: { projectDir: args.projectDir, analysis: args.analysis },
        instructions: [
          `Create ${args.projectDir}/scripts/postinstall.js:`,
          '  Check/install babysitter CLI, verify, create .a5c/ if needed, and sync the canonical babysit process library from the upstream repo when configured',
          `Create ${args.projectDir}/scripts/preuninstall.js:`,
          '  Cleanup session state, warn about active runs',
          `Create ${args.projectDir}/scripts/setup.sh:`,
          '  Full setup: install plugin via omp plugin install from the upstream package or GitHub source, run postinstall, run preflight checks, and verify the followUp loop stays active after yielding to the user without relying on session_start as a context bridge',
          'Handle cross-platform (Windows/macOS/Linux)',
          'Return list of files created'
        ],
      outputFormat: 'JSON with success, filesCreated (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'ux', 'install']
}));

export const implementCustomToolsTask = defineTask('implement-custom-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Register babysitter CLI tools in the extension',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Register custom tools that give the LLM direct babysitter CLI access',
      context: { projectDir: args.projectDir, extensionFile: args.extensionFile },
      instructions: [
        `Edit extension at ${args.extensionFile} or create tools in ${args.projectDir}/tools/`,
        'Register tools using pi.registerTool() with TypeBox schemas:',
        '  babysitter_run_status: Get run status',
        '  babysitter_task_post: Post task result',
        '  babysitter_task_list: List pending tasks',
        '  babysitter_run_iterate: Execute one iteration',
        '  babysitter_health: Check SDK health',
        'Each tool uses cli-wrapper.ts for invocation',
        'Returns content: [{ type: "text", text: JSON.stringify(result) }]',
        'Wire into main extension',
        'Return list of files'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'ux', 'custom-tools']
}));

// --- PHASE 7: TEST ---

export const runTestsTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run comprehensive integration, harness, and TUI tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer',
      task: 'Create and run comprehensive tests for the babysitter-pi deep integration',
      context: { projectDir: args.projectDir, integrationFiles: args.integrationFiles, analysis: args.analysis },
      instructions: [
        'Treat this task as local preflight coverage; the shared runtime validation task is responsible for proving the real harness loop, user-yield continuation, active process-library root usage, and operator install path.',
        `Create test files in ${args.projectDir}/test/ if they don't exist:`,
        '',
        'integration.test.js (package/structure tests):',
        '  1. Package.json valid with omp manifest',
        '  2. Extension loads without syntax errors',
        '  3. All commands have index.ts',
        '  4. AGENTS.md exists with orchestration protocol',
        '  5. SKILL.md exists with valid frontmatter',
        '  6. SDK available (babysitter version --json)',
        '',
        'harness.test.js (core functionality):',
        '  7. CLI wrapper exports all convenience functions',
        '  8. Session state read/write is atomic',
        '  9. Effect executor handles all canonical public effect kinds and orchestrator delegation paths',
        '  10. Result poster writes output.json (never result.json)',
        '  11. Guards detect max iterations correctly',
        '  12. Guards detect runaway (fast iterations)',
        '  13. Completion proof extraction works',
        '  14. Harness adapter creates/binds sessions',
        '  15. Task interceptor blocks/unblocks correctly',
        '',
        'tui.test.js (TUI integration):',
        '  16. Widget rendering produces valid output',
        '  17. Status line updates correctly',
        '  18. Todo replacement formats babysitter state',
        '',
        'Use Node.js test runner (node:test) or simple assert',
        'Run all tests and return aggregate results'
      ],
      outputFormat: 'JSON with passed (number), failed (number), total (number), testResults (array of { name, passed, details })'
    },
    outputSchema: {
      type: 'object', required: ['passed', 'failed', 'total'],
      properties: {
        passed: { type: 'number' }, failed: { type: 'number' }, total: { type: 'number' },
        testResults: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, passed: { type: 'boolean' }, details: { type: 'string' } } } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'testing']
}));

// --- PHASE 8: VERIFY ---

export const verifyIntegrationTask = defineTask('verify-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify deep integration quality (target: ${args.targetQuality})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'integration quality assessor',
      task: 'Score the babysitter-pi deep integration on research fidelity, canonical skill adaptation, runtime installability, user-yield continuation, and operator readiness',
      context: { projectDir: args.projectDir, integrationFiles: args.integrationFiles, testResults: args.testResult, targetQuality: args.targetQuality, analysis: args.analysis },
      instructions: [
        'Read all integration files and score on 12 criteria (each 0-10):',
        '',
        '1. Research: upstream packaging, hook points, and distribution model understood first',
        '2. Canonical skill adaptation: important Claude Code babysit behavior preserved',
        '3. Package structure: Valid Pi package, omp manifest, deps',
        '4. Session auto-binding: Every session auto-initializes babysitter',
        '5. Loop driver: agent_end + followUp correctly implements orchestration and user-yield reentry',
        '6. Harness adapter: CLI harness type "pi" works with run:create',
        '7. Task interception and effect mapping: public effect kinds stay agent, skill, shell, breakpoint, or sleep',
        '8. Todo replacement: Built-in todo replaced with babysitter task tracking',
        '9. TUI widgets and operator UX: Run status, task progress, quality scores displayed',
        '10. Commands, skills, and install docs: /babysitter:* commands, SKILL.md, install, upgrade, rollback',
        '11. Runtime validation: real harness run and loop continuation proved',
        '12. Error handling: Comprehensive error handling, guards, cleanup',
        '',
        'Overall score = (sum of criteria / 120) * 100',
        'List issues and recommendations',
        'Return score, issues, recommendations'
      ],
      outputFormat: 'JSON with score (0-100), breakdown (object), issues (array), feedback (string), recommendations (array)'
    },
    outputSchema: {
      type: 'object', required: ['score'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'verification']
}));

// --- PHASE 9: CONVERGE ---

export const refineTask = defineTask('refine-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine integration (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration engineer',
      task: 'Fix identified issues to improve integration quality and remove stale contract drift',
      context: { projectDir: args.projectDir, integrationFiles: args.integrationFiles, issues: args.issues, recommendations: args.recommendations, iteration: args.iteration, analysis: args.analysis },
      instructions: [
        'Review all issues sorted by severity',
        'Prioritize research, install-doc, canonical skill migration, and loop-continuation gaps first',
        'Fix each issue in the appropriate file',
        'Replace any stale direct result.json, node-effect, or fallback-first binding guidance if it remains',
        'Do NOT add features beyond fixing issues',
        'Verify fixes dont break other components',
        'Return list of files modified'
      ],
      outputFormat: 'JSON with success, filesCreated (array), filesModified (array), fixesApplied (array)'
    },
    outputSchema: {
      type: 'object', required: ['success'],
      properties: { success: { type: 'boolean' }, filesCreated: { type: 'array', items: { type: 'string' } }, filesModified: { type: 'array', items: { type: 'string' } }, fixesApplied: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'assimilation', 'pi', 'converge', `iteration-${args.iteration}`]
}));
