/**
 * @process specializations/ai-agents-conversational/add-app-to-mcp-server
 * @description Add Interactive UI to Existing MCP Server - Analyzes existing MCP server tools for UI benefit,
 * converts selected tools to App tools with registerAppTool/registerAppResource, preserves backward compatibility
 * with text fallbacks, and adds build pipeline for single-file bundling.
 * @inputs { serverPath: string, toolsToEnhance?: array, framework?: string, enhancements?: array, outputDir?: string }
 * @outputs { success: boolean, serverAnalysis: object, convertedTools: array, uiImplementation: object, verificationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/add-app-to-mcp-server', {
 *   serverPath: './src/server.ts',
 *   toolsToEnhance: ['get-metrics', 'show-data'],
 *   framework: 'react',
 *   enhancements: ['app-only-tools', 'streaming-input', 'host-styling']
 * });
 *
 * @references
 * - MCP Apps SDK: https://github.com/modelcontextprotocol/ext-apps
 * - MCP Apps Specification (2026-01-26): https://modelcontextprotocol.io/specification/2026-01-26/server/utilities/apps
 * - npm: @modelcontextprotocol/ext-apps
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    serverPath,
    toolsToEnhance = [],
    framework = 'react',
    enhancements = ['host-styling'],
    outputDir = 'add-app-output',
    sdkVersion = 'latest'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Add App to MCP Server: ${serverPath}`);

  // ============================================================================
  // PHASE 1: REFERENCE CODE ACQUISITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Cloning MCP Apps SDK reference code');

  const referenceCode = await ctx.task(cloneReferenceCodeTask, {
    sdkVersion,
    outputDir
  });

  artifacts.push(...referenceCode.artifacts);

  // ============================================================================
  // PHASE 2: EXISTING SERVER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing existing MCP server and tools');

  const serverAnalysis = await ctx.task(serverAnalysisTask, {
    serverPath,
    toolsToEnhance,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...serverAnalysis.artifacts);

  // Quality gate: confirm tool selection with user
  let lastFeedback_toolSelection = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_toolSelection) {
      const revised = await ctx.task(serverAnalysisTask, {
        serverPath,
        toolsToEnhance,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_toolSelection,
        attempt: attempt + 1
      });
      Object.assign(serverAnalysis, revised);
    }

    const toolSelectionReview = await ctx.breakpoint({
      question: 'Review tool analysis and UI benefit assessment. Confirm which tools to enhance with interactive UI.',
      title: 'Tool Selection for UI Enhancement',
      context: {
        runId: ctx.runId,
        summary: {
          serverPath,
          totalTools: serverAnalysis.totalTools,
          toolAssessments: serverAnalysis.toolAssessments,
          recommendedForUI: serverAnalysis.recommendedForUI,
          helperToolCandidates: serverAnalysis.helperToolCandidates
        }
      },
      expert: 'owner',
      tags: ['tool-selection'],
      previousFeedback: lastFeedback_toolSelection || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (toolSelectionReview.approved) break;
    lastFeedback_toolSelection = toolSelectionReview.response || toolSelectionReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 3: DEPENDENCIES & BUILD PIPELINE (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 3: Installing dependencies and setting up build pipeline (parallel)');

  const [dependenciesResult, buildPipelineResult] = await ctx.parallel.all([
    ctx.task(installDependenciesTask, {
      serverPath,
      framework,
      outputDir
    }),
    ctx.task(buildPipelineSetupTask, {
      serverPath,
      framework,
      outputDir
    })
  ]);

  artifacts.push(...dependenciesResult.artifacts);
  artifacts.push(...buildPipelineResult.artifacts);

  // ============================================================================
  // PHASE 4: TOOL CONVERSION (TOOL + RESOURCE PATTERN)
  // ============================================================================

  ctx.log('info', 'Phase 4: Converting selected tools to App tools');

  const toolConversion = await ctx.task(toolConversionTask, {
    serverPath,
    selectedTools: serverAnalysis.recommendedForUI,
    framework,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...toolConversion.artifacts);

  // ============================================================================
  // PHASE 5: UI IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Building client UI with handler-before-connect pattern');

  const uiImplementation = await ctx.task(uiImplementationTask, {
    serverPath,
    convertedTools: toolConversion.convertedTools,
    framework,
    enhancements,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...uiImplementation.artifacts);

  // ============================================================================
  // PHASE 6: OPTIONAL ENHANCEMENTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Optional enhancements selection');

  const enhancementsResult = await ctx.task(enhancementsTask, {
    serverPath,
    convertedTools: toolConversion.convertedTools,
    enhancements,
    framework,
    outputDir
  });

  artifacts.push(...enhancementsResult.artifacts);

  // Quality gate: confirm enhancement selection
  let lastFeedback_enhancements = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_enhancements) {
      const revised = await ctx.task(enhancementsTask, {
        serverPath,
        convertedTools: toolConversion.convertedTools,
        enhancements,
        framework,
        outputDir,
        feedback: lastFeedback_enhancements,
        attempt: attempt + 1
      });
      Object.assign(enhancementsResult, revised);
    }

    const enhancementReview = await ctx.breakpoint({
      question: 'Select optional enhancements: app-only tools, CSP config, streaming input, graceful degradation, fullscreen?',
      title: 'Enhancement Selection',
      context: {
        runId: ctx.runId,
        summary: {
          availableEnhancements: enhancementsResult.availableEnhancements,
          selectedEnhancements: enhancementsResult.selectedEnhancements,
          appOnlyTools: enhancementsResult.appOnlyTools
        }
      },
      expert: 'owner',
      tags: ['enhancement-selection'],
      previousFeedback: lastFeedback_enhancements || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (enhancementReview.approved) break;
    lastFeedback_enhancements = enhancementReview.response || enhancementReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 7: BACKWARD COMPATIBILITY & VERIFICATION (CONVERGENCE LOOP)
  // ============================================================================

  ctx.log('info', 'Phase 7: Backward compatibility and verification');

  let backwardCompatVerification = await ctx.task(backwardCompatVerificationTask, {
    serverPath,
    convertedTools: toolConversion.convertedTools,
    unconvertedTools: serverAnalysis.unconvertedTools,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...backwardCompatVerification.artifacts);

  let lastFeedback_verification = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_verification) {
      backwardCompatVerification = await ctx.task(backwardCompatVerificationTask, {
        serverPath,
        convertedTools: toolConversion.convertedTools,
        unconvertedTools: serverAnalysis.unconvertedTools,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_verification,
        attempt: attempt + 1
      });
    }

    const verificationGate = await ctx.breakpoint({
      question: 'Verification: plain tools still work? App tools render UI? Handlers fire? Host styling applies?',
      title: 'Backward Compatibility & Verification',
      context: {
        runId: ctx.runId,
        summary: {
          plainToolsWork: backwardCompatVerification.checks.plainToolsWork,
          appToolsRenderUI: backwardCompatVerification.checks.appToolsRenderUI,
          handlersFire: backwardCompatVerification.checks.handlersFire,
          hostStylingApplies: backwardCompatVerification.checks.hostStylingApplies,
          textFallbackWorks: backwardCompatVerification.checks.textFallbackWorks
        },
        files: backwardCompatVerification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      },
      expert: 'owner',
      tags: ['verification-gate'],
      previousFeedback: lastFeedback_verification || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (verificationGate.approved) break;
    lastFeedback_verification = verificationGate.response || verificationGate.feedback || 'Changes requested';
  }

  const endTime = ctx.now();

  ctx.log('info', `Add App to MCP Server complete: ${serverPath}`);

  return {
    success: true,
    serverPath,
    serverAnalysis: {
      totalTools: serverAnalysis.totalTools,
      convertedCount: toolConversion.convertedTools.length,
      unconvertedCount: serverAnalysis.unconvertedTools?.length || 0
    },
    convertedTools: toolConversion.convertedTools,
    uiImplementation: uiImplementation.uiInfo,
    verificationResults: backwardCompatVerification.checks,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/ai-agents-conversational/add-app-to-mcp-server',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cloneReferenceCodeTask = defineTask('clone-reference-code', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clone MCP Apps SDK Reference Code',
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Clone the MCP Apps SDK repository at the exact published npm version for reference code and examples.',
      context: args,
      instructions: [
        '1. Clone https://github.com/modelcontextprotocol/ext-apps repository',
        '2. Checkout the tag matching the published npm version',
        '3. Verify examples/ and docs/ directories are present',
        '4. Document the repo path for subsequent phases'
      ],
      outputFormat: 'JSON with repoPath, sdkVersion, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['repoPath', 'sdkVersion', 'artifacts'],
      properties: {
        repoPath: { type: 'string' },
        sdkVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'reference-code', 'setup']
}));

export const serverAnalysisTask = defineTask('server-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Server Analysis - ${args.serverPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Analyze the existing MCP server, list all tools, and assess UI benefit for each tool using the decision framework.',
      context: args,
      instructions: [
        '1. Read the server source code at serverPath',
        '2. List all registered MCP tools with their schemas and descriptions',
        '3. Assess UI benefit for each tool using decision framework:',
        '   - Structured data output = HIGH UI benefit',
        '   - Metrics/statistics = HIGH UI benefit',
        '   - Media content = HIGH UI benefit',
        '   - Simple text output = LOW UI benefit',
        '   - Data consumed by other tools = APP-ONLY candidate',
        '4. Categorize tools: recommendedForUI, unconvertedTools, helperToolCandidates',
        '5. Identify potential app-only helper tools (polling, pagination)',
        '6. Document existing tool patterns and any backward compatibility concerns',
        '7. Present analysis summary with rationale for each assessment'
      ],
      outputFormat: 'JSON with totalTools, toolAssessments, recommendedForUI, unconvertedTools, helperToolCandidates, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTools', 'toolAssessments', 'recommendedForUI', 'artifacts'],
      properties: {
        totalTools: { type: 'number' },
        toolAssessments: { type: 'array' },
        recommendedForUI: { type: 'array' },
        unconvertedTools: { type: 'array' },
        helperToolCandidates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'analysis', 'tools']
}));

export const installDependenciesTask = defineTask('install-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Install Dependencies - ${args.serverPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Install @modelcontextprotocol/ext-apps and framework-specific dependencies.',
      context: args,
      instructions: [
        '1. Install core: npm install @modelcontextprotocol/ext-apps',
        '2. Install dev deps: npm install --save-dev vite vite-plugin-singlefile',
        '3. Install framework deps (if React: npm install react react-dom, npm install --save-dev @vitejs/plugin-react)',
        '4. Verify no version conflicts with existing dependencies',
        '5. NEVER manually specify versions -- let npm resolve them'
      ],
      outputFormat: 'JSON with installedDependencies and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['installedDependencies', 'artifacts'],
      properties: {
        installedDependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'dependencies']
}));

export const buildPipelineSetupTask = defineTask('build-pipeline-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Pipeline Setup - ${args.serverPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Create vite.config.ts with singlefile plugin and mcp-app.html entry point. Add build scripts.',
      context: args,
      instructions: [
        '1. Create vite.config.ts with vite-plugin-singlefile',
        '2. Create mcp-app.html entry point for the UI',
        '3. Add build scripts to package.json: build:ui, build:server, build',
        '4. Configure framework-specific Vite plugins',
        '5. Ensure existing build scripts are not broken',
        '6. Add dev script with concurrently for parallel dev'
      ],
      outputFormat: 'JSON with buildScripts, viteConfig, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['buildScripts', 'artifacts'],
      properties: {
        buildScripts: { type: 'object' },
        viteConfig: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'build', 'vite']
}));

export const toolConversionTask = defineTask('tool-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tool Conversion - ${args.serverPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Transform selected plain MCP tools into App tools with registerAppTool/registerAppResource. Preserve backward compatibility.',
      context: args,
      instructions: [
        '1. For each selected tool: server.tool() -> registerAppTool()',
        '2. Add _meta.ui.resourceUri pointing to registered resource',
        '3. Add structuredContent with data for UI consumption',
        '4. KEEP content array with text fallback for non-UI hosts',
        '5. Register HTML resource via registerAppResource() with RESOURCE_MIME_TYPE',
        '6. Resource URI must match _meta.ui.resourceUri in the tool',
        '7. Leave non-UI tools completely unchanged',
        '8. Verify tool schemas are preserved for LLM compatibility',
        '9. Reference SDK examples for correct registerAppTool/registerAppResource usage',
        '10. Document each conversion with before/after comparison'
      ],
      outputFormat: 'JSON with convertedTools (name, resourceUri, hasTextFallback), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['convertedTools', 'artifacts'],
      properties: {
        convertedTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'conversion', 'tool-resource']
}));

export const uiImplementationTask = defineTask('ui-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Implementation - ${args.serverPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Build client UI with App instance and all event handlers. CRITICAL: Register ALL handlers BEFORE app.connect().',
      context: args,
      instructions: [
        '1. Create App instance with PostMessageTransport',
        '2. Register ontoolinput handler for receiving tool arguments',
        '3. Register ontoolresult handler for receiving execution results',
        '4. Register onhostcontextchanged handler for theme updates',
        '5. Register onteardown handler for cleanup',
        '6. CRITICAL: ALL handlers MUST be registered BEFORE app.connect()',
        '7. Apply host CSS variables with fallback values',
        '8. Use applyDocumentTheme(), applyHostStyleVariables(), applyHostFonts()',
        '9. Build UI components that render data from converted tools',
        '10. Handle multiple tool types if multiple tools were converted'
      ],
      outputFormat: 'JSON with uiInfo (framework, componentCount, handlers), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['uiInfo', 'artifacts'],
      properties: {
        uiInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'ui', 'handlers']
}));

export const enhancementsTask = defineTask('enhancements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optional Enhancements - ${args.serverPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Add optional MCP App enhancements: app-only tools, CSP, streaming input, graceful degradation, fullscreen.',
      context: args,
      instructions: [
        '1. App-only tools: add helper tools with visibility: [\'app\'] for polling/pagination/state',
        '2. CSP configuration: declare external domains in registerAppResource (resourceDomains, connectDomains, frameDomains)',
        '3. Streaming input: add ontoolinputpartial handler for real-time partial input',
        '4. Graceful degradation: use getUiCapability() to detect host support level',
        '5. Fullscreen mode: configure fullscreen display mode if appropriate',
        '6. List available enhancements with descriptions',
        '7. Apply selected enhancements from the enhancements input array',
        '8. Verify each enhancement does not break existing functionality'
      ],
      outputFormat: 'JSON with availableEnhancements, selectedEnhancements, appOnlyTools, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['availableEnhancements', 'selectedEnhancements', 'artifacts'],
      properties: {
        availableEnhancements: { type: 'array' },
        selectedEnhancements: { type: 'array' },
        appOnlyTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'enhancements', 'optional']
}));

export const backwardCompatVerificationTask = defineTask('backward-compat-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backward Compatibility & Verification - ${args.serverPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Verify backward compatibility: plain tools still work, App tools render UI, handlers fire, host styling applies.',
      context: args,
      instructions: [
        '1. Build the server with the new App tools and UI',
        '2. CHECK: Plain (unconverted) tools still return text responses correctly',
        '3. CHECK: App tools render interactive UI in iframe via basic-host',
        '4. CHECK: App tools also return text fallback for non-UI hosts',
        '5. CHECK: ontoolinput handler fires with correct tool arguments',
        '6. CHECK: ontoolresult handler fires with correct result data',
        '7. CHECK: Host styling applies via CSS variables',
        '8. CHECK: No console errors during operation',
        '9. CHECK: Tool schemas unchanged for LLM compatibility',
        '10. Document any backward compatibility issues found'
      ],
      outputFormat: 'JSON with checks object (each check: boolean), issues array, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'artifacts'],
      properties: {
        checks: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'verification', 'backward-compat']
}));
