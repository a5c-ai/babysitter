/**
 * @process specializations/ai-agents-conversational/create-mcp-app
 * @description Create MCP App (Greenfield) - Scaffolds a new interactive UI MCP App from scratch following the
 * reference-code-first methodology. Covers framework selection, project setup, Tool+Resource implementation,
 * client UI with handler-before-connect pattern, single-file bundling, and verification against basic-host.
 * @inputs { appName: string, description?: string, framework?: string, features?: array, transport?: string, outputDir?: string }
 * @outputs { success: boolean, appInfo: object, serverImplementation: object, clientImplementation: object, buildConfig: object, verificationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/create-mcp-app', {
 *   appName: 'data-dashboard',
 *   description: 'Interactive data visualization dashboard',
 *   framework: 'react',
 *   features: ['host-styling', 'streaming-input', 'app-only-tools'],
 *   transport: 'stdio'
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
    appName = 'mcp-app',
    description = 'An interactive MCP App',
    framework = 'react',
    features = ['host-styling'],
    transport = 'stdio',
    outputDir = 'mcp-app-output',
    sdkVersion = 'latest'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP App creation: ${appName} (framework: ${framework})`);

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
  // PHASE 2: FRAMEWORK SELECTION & PROJECT CONTEXT
  // ============================================================================

  ctx.log('info', 'Phase 2: Framework selection and project context analysis');

  const frameworkSelection = await ctx.task(frameworkSelectionTask, {
    appName,
    description,
    framework,
    features,
    transport,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...frameworkSelection.artifacts);

  // Quality gate: confirm framework selection with user
  let lastFeedback_frameworkReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_frameworkReview) {
      const revised = await ctx.task(frameworkSelectionTask, {
        appName,
        description,
        framework,
        features,
        transport,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_frameworkReview,
        attempt: attempt + 1
      });
      Object.assign(frameworkSelection, revised);
    }

    const frameworkReview = await ctx.breakpoint({
      question: `Confirm framework selection and project structure before proceeding. Framework: ${frameworkSelection.selectedFramework}, Transport: ${transport}`,
      title: 'Framework Selection Confirmation',
      context: {
        runId: ctx.runId,
        summary: {
          appName,
          selectedFramework: frameworkSelection.selectedFramework,
          transport,
          features,
          projectStructure: frameworkSelection.projectStructure
        }
      },
      expert: 'owner',
      tags: ['framework-decision'],
      previousFeedback: lastFeedback_frameworkReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (frameworkReview.approved) break;
    lastFeedback_frameworkReview = frameworkReview.response || frameworkReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 3: PROJECT INITIALIZATION & DEPENDENCIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Initializing project and installing dependencies');

  const projectInit = await ctx.task(projectInitTask, {
    appName,
    selectedFramework: frameworkSelection.selectedFramework,
    projectStructure: frameworkSelection.projectStructure,
    features,
    transport,
    outputDir
  });

  artifacts.push(...projectInit.artifacts);

  // ============================================================================
  // PHASE 4: SERVER IMPLEMENTATION (TOOL + RESOURCE)
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing MCP server with Tool + Resource pattern');

  const serverImplementation = await ctx.task(serverImplementationTask, {
    appName,
    description,
    selectedFramework: frameworkSelection.selectedFramework,
    features,
    transport,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...serverImplementation.artifacts);

  // ============================================================================
  // PHASE 5: CLIENT UI IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing client UI with handler-before-connect pattern');

  const clientUI = await ctx.task(clientUITask, {
    appName,
    selectedFramework: frameworkSelection.selectedFramework,
    features,
    serverInfo: serverImplementation.serverInfo,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...clientUI.artifacts);

  // ============================================================================
  // PHASE 6: BUILD CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring Vite with single-file bundling');

  const buildConfig = await ctx.task(buildConfigTask, {
    appName,
    selectedFramework: frameworkSelection.selectedFramework,
    outputDir
  });

  artifacts.push(...buildConfig.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION REVIEW (CONVERGENCE LOOP)
  // ============================================================================

  ctx.log('info', 'Phase 7: Quality-gated implementation review');

  let implementationReview = await ctx.task(implementationReviewTask, {
    appName,
    selectedFramework: frameworkSelection.selectedFramework,
    serverInfo: serverImplementation.serverInfo,
    clientInfo: clientUI.clientInfo,
    buildInfo: buildConfig.buildInfo,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...implementationReview.artifacts);

  let lastFeedback_implReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_implReview) {
      implementationReview = await ctx.task(implementationReviewTask, {
        appName,
        selectedFramework: frameworkSelection.selectedFramework,
        serverInfo: serverImplementation.serverInfo,
        clientInfo: clientUI.clientInfo,
        buildInfo: buildConfig.buildInfo,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_implReview,
        attempt: attempt + 1
      });
    }

    const implReview = await ctx.breakpoint({
      question: 'Review MCP App implementation. Verify handler-before-connect, text fallback, resource URI linking, single-file bundle. Proceed to testing?',
      title: 'Implementation Review',
      context: {
        runId: ctx.runId,
        summary: {
          appName,
          handlerBeforeConnect: implementationReview.checks.handlerBeforeConnect,
          textFallback: implementationReview.checks.textFallback,
          resourceUriLinking: implementationReview.checks.resourceUriLinking,
          singleFileBundle: implementationReview.checks.singleFileBundle,
          hostStyling: implementationReview.checks.hostStyling
        },
        files: implementationReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      },
      expert: 'owner',
      tags: ['implementation-review'],
      previousFeedback: lastFeedback_implReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (implReview.approved) break;
    lastFeedback_implReview = implReview.response || implReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 8: VERIFICATION & TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Verification and testing with basic-host');

  let verification = await ctx.task(verificationTask, {
    appName,
    selectedFramework: frameworkSelection.selectedFramework,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  let lastFeedback_verification = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_verification) {
      verification = await ctx.task(verificationTask, {
        appName,
        selectedFramework: frameworkSelection.selectedFramework,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_verification,
        attempt: attempt + 1
      });
    }

    const verificationGate = await ctx.breakpoint({
      question: 'All verification checks passed? App loads in basic-host, handlers fire correctly, styling applies?',
      title: 'Verification Gate',
      context: {
        runId: ctx.runId,
        summary: {
          appLoads: verification.checks.appLoads,
          ontoolinputFires: verification.checks.ontoolinputFires,
          ontoolresultFires: verification.checks.ontoolresultFires,
          hostStylingApplies: verification.checks.hostStylingApplies,
          textFallbackWorks: verification.checks.textFallbackWorks,
          noConsoleErrors: verification.checks.noConsoleErrors
        },
        files: verification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
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

  ctx.log('info', `MCP App creation complete: ${appName}`);

  return {
    success: true,
    appName,
    appInfo: {
      framework: frameworkSelection.selectedFramework,
      transport,
      features,
      description
    },
    serverImplementation: serverImplementation.serverInfo,
    clientImplementation: clientUI.clientInfo,
    buildConfig: buildConfig.buildInfo,
    verificationResults: verification.checks,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/ai-agents-conversational/create-mcp-app',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cloneReferenceCodeTask = defineTask('clone-reference-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clone MCP Apps SDK Reference Code`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Clone the MCP Apps SDK repository at the exact published npm version for reference code, examples, and API documentation. This is the foundational reference-code-first step.',
      context: args,
      instructions: [
        '1. Clone https://github.com/modelcontextprotocol/ext-apps repository',
        '2. Checkout the tag matching the published npm version of @modelcontextprotocol/ext-apps',
        '3. Verify examples/ directory contains basic-server-react, basic-server-vanillajs, basic-host',
        '4. Verify docs/ directory contains quickstart.md, patterns.md, csp-cors.md',
        '5. Verify src/ directory contains app.ts, server/index.ts, spec.types.ts, styles.ts',
        '6. Document the repo path for subsequent phases',
        '7. List available example apps for reference'
      ],
      outputFormat: 'JSON with repoPath, sdkVersion, availableExamples, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['repoPath', 'sdkVersion', 'artifacts'],
      properties: {
        repoPath: { type: 'string' },
        sdkVersion: { type: 'string' },
        availableExamples: { type: 'array' },
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

export const frameworkSelectionTask = defineTask('framework-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Framework Selection - ${args.appName}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Execute framework selection decision tree and design project structure for the MCP App.',
      context: args,
      instructions: [
        '1. Evaluate framework choice: React (first-class useApp hook), Vanilla JS (manual lifecycle), or Vue/Svelte/Preact/Solid (manual lifecycle)',
        '2. React: recommended for complex UIs, has useApp hook, useHostStyles, useHostStyleVariables, useHostFonts',
        '3. Vanilla JS: recommended for simple apps, manual App instance lifecycle',
        '4. Other frameworks: manual lifecycle like Vanilla JS, choose based on team preference',
        '5. Determine transport: stdio (local) or HTTP/SSE (remote)',
        '6. Design project directory structure with entry points (server.ts, main.ts/tsx, mcp-app.html)',
        '7. List required dependencies: @modelcontextprotocol/ext-apps, @modelcontextprotocol/sdk, zod',
        '8. List dev dependencies: typescript, vite, vite-plugin-singlefile, tsx, concurrently',
        '9. Document framework-specific considerations and patterns',
        '10. Reference existing examples from SDK repo for chosen framework'
      ],
      outputFormat: 'JSON with selectedFramework, projectStructure, dependencies, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFramework', 'projectStructure', 'artifacts'],
      properties: {
        selectedFramework: { type: 'string' },
        projectStructure: { type: 'object' },
        dependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'framework', 'architecture']
}));

export const projectInitTask = defineTask('project-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Initialization - ${args.appName}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Initialize project structure and install all dependencies via npm install.',
      context: args,
      instructions: [
        '1. Create project directory with the designed structure',
        '2. Initialize package.json with name, version, scripts',
        '3. Run npm install for core deps: @modelcontextprotocol/ext-apps, @modelcontextprotocol/sdk, zod',
        '4. Run npm install --save-dev for: typescript, vite, vite-plugin-singlefile, tsx, concurrently',
        '5. Add framework-specific dependencies (react, react-dom for React; none for Vanilla JS)',
        '6. Create tsconfig.json with appropriate settings',
        '7. NEVER manually specify dependency versions -- use npm install to resolve them',
        '8. Create entry point files (server.ts stub, main.ts/tsx stub, mcp-app.html)',
        '9. Verify npm install succeeds without errors',
        '10. Document installed versions for reproducibility'
      ],
      outputFormat: 'JSON with projectPath, installedDependencies, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'installedDependencies', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        installedDependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'initialization', 'dependencies']
}));

export const serverImplementationTask = defineTask('server-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Server Implementation (Tool + Resource) - ${args.appName}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Implement the MCP server with registerAppTool and registerAppResource following the Tool + Resource pattern.',
      context: args,
      instructions: [
        '1. Create server.ts with McpServer instance',
        '2. Use registerAppTool() to register the tool with _meta.ui.resourceUri pointing to the resource',
        '3. Tool must return content array with text fallback for non-UI hosts',
        '4. Tool must return structuredContent with data for the UI',
        '5. Use registerAppResource() to register the HTML UI resource with RESOURCE_MIME_TYPE',
        '6. Resource URI must match the _meta.ui.resourceUri in the tool',
        '7. Configure transport (stdio or HTTP/SSE)',
        '8. Add app-only helper tools if features include app-only-tools (visibility: [\'app\'])',
        '9. Implement graceful degradation with getUiCapability() if needed',
        '10. Reference SDK source (src/server/index.ts) and examples for correct API usage'
      ],
      outputFormat: 'JSON with serverInfo (toolName, resourceUri, transport), code, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['serverInfo', 'artifacts'],
      properties: {
        serverInfo: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'server', 'tool-resource']
}));

export const clientUITask = defineTask('client-ui', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client UI Implementation - ${args.appName}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Implement the client-side UI with App instance, PostMessageTransport, and all event handlers. CRITICAL: Register ALL handlers BEFORE calling app.connect().',
      context: args,
      instructions: [
        '1. Create App instance with PostMessageTransport',
        '2. Register ontoolinput handler (receives tool arguments from host)',
        '3. Register ontoolresult handler (receives tool execution result)',
        '4. Register onhostcontextchanged handler (theme/styling updates)',
        '5. Register onteardown handler (cleanup)',
        '6. CRITICAL INVARIANT: Register ALL handlers BEFORE calling app.connect()',
        '7. For React: use useApp() hook which handles lifecycle automatically',
        '8. Apply host styling via applyDocumentTheme(), applyHostStyleVariables(), applyHostFonts()',
        '9. Use CSS variable fallbacks: var(--color-background-secondary, #f5f5f5)',
        '10. Implement safe area insets and display mode handling',
        '11. If streaming-input feature: add ontoolinputpartial handler',
        '12. Reference SDK source (src/app.ts, src/react/useApp.tsx) for correct API'
      ],
      outputFormat: 'JSON with clientInfo (framework, handlers, hostStyling), code, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clientInfo', 'artifacts'],
      properties: {
        clientInfo: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'client-ui', 'handlers']
}));

export const buildConfigTask = defineTask('build-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Configuration - ${args.appName}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Configure Vite with vite-plugin-singlefile for mandatory single-file HTML bundling. MCP Apps require all assets inlined into a single HTML file.',
      context: args,
      instructions: [
        '1. Create vite.config.ts with vite-plugin-singlefile plugin',
        '2. Configure entry point as mcp-app.html (or framework equivalent)',
        '3. Add framework-specific Vite plugins (e.g., @vitejs/plugin-react for React)',
        '4. Set up build scripts: build:ui (Vite), build:server (tsc/tsx), build (both)',
        '5. Configure tsx for server execution in development',
        '6. Add concurrently script for parallel dev server + UI dev',
        '7. Verify single-file output: no external CSS, JS, image, or font files',
        '8. Test build produces a single HTML file with all assets inlined',
        '9. Configure source maps for development',
        '10. Document build commands in package.json scripts'
      ],
      outputFormat: 'JSON with buildInfo (buildTool, scripts, outputFile), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['buildInfo', 'artifacts'],
      properties: {
        buildInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'build', 'vite', 'singlefile']
}));

export const implementationReviewTask = defineTask('implementation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Review - ${args.appName}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Review complete MCP App implementation against critical MCP Apps patterns and invariants.',
      context: args,
      instructions: [
        '1. CHECK: Handler-before-connect -- all handlers registered before app.connect()',
        '2. CHECK: Text fallback -- tool returns content array with text for non-UI hosts',
        '3. CHECK: Resource URI linking -- _meta.ui.resourceUri matches registered resource URI',
        '4. CHECK: Single-file bundle -- Vite configured with vite-plugin-singlefile, output is single HTML',
        '5. CHECK: Host styling -- CSS variable fallbacks, onhostcontextchanged handler, apply helpers',
        '6. CHECK: RESOURCE_MIME_TYPE used for resource registration (not hardcoded MIME)',
        '7. CHECK: structuredContent used to pass data from tool to UI',
        '8. CHECK: No hardcoded external URLs without CSP configuration',
        '9. Compile results into checklist with pass/fail for each check',
        '10. If any check fails, provide specific fix instructions'
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
  labels: ['mcp-apps', 'review', 'quality']
}));

export const verificationTask = defineTask('verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verification & Testing - ${args.appName}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Build and test the MCP App with basic-host reference implementation. Run comprehensive verification checklist.',
      context: args,
      instructions: [
        '1. Build the app using the configured build scripts',
        '2. Verify single HTML file is produced in dist/',
        '3. Launch basic-host from SDK reference code',
        '4. Load the MCP App in basic-host',
        '5. CHECK: App loads without console errors',
        '6. CHECK: ontoolinput handler fires when tool is called',
        '7. CHECK: ontoolresult handler fires with result data',
        '8. CHECK: Host styling applies (CSS variables resolved)',
        '9. CHECK: Text fallback works when UI is not available',
        '10. CHECK: No external resource loading failures (CSP)',
        '11. Document any failures with reproduction steps',
        '12. If failures found, provide specific fix instructions'
      ],
      outputFormat: 'JSON with checks object (each check: boolean), testLog, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'artifacts'],
      properties: {
        checks: { type: 'object' },
        testLog: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'verification', 'testing']
}));
