/**
 * @process specializations/ai-agents-conversational/convert-web-app-to-mcp
 * @description Convert Web App to Hybrid MCP App - Converts an existing web application into a hybrid that works
 * both standalone in browser AND as an MCP App in AI chat hosts. Preserves original standalone functionality
 * while adding MCP data path alongside. Emphasizes CSP investigation and hybrid initialization pattern.
 * @inputs { webAppPath: string, framework?: string, featuresToExpose?: array, transport?: string, outputDir?: string }
 * @outputs { success: boolean, webAppAnalysis: object, cspAudit: object, hybridImplementation: object, verificationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/convert-web-app-to-mcp', {
 *   webAppPath: './src',
 *   framework: 'react',
 *   featuresToExpose: ['dashboard', 'data-viz', 'settings'],
 *   transport: 'stdio'
 * });
 *
 * @references
 * - MCP Apps SDK: https://github.com/modelcontextprotocol/ext-apps
 * - MCP Apps Specification (2026-01-26): https://modelcontextprotocol.io/specification/2026-01-26/server/utilities/apps
 * - CSP/CORS Guide: docs/csp-cors.md in SDK repository
 * - npm: @modelcontextprotocol/ext-apps
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    webAppPath,
    framework = 'react',
    featuresToExpose = [],
    transport = 'stdio',
    outputDir = 'convert-web-app-output',
    sdkVersion = 'latest'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Web App to MCP conversion: ${webAppPath}`);

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
  // PHASE 2: WEB APP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Deep analysis of existing web application');

  const webAppAnalysis = await ctx.task(webAppAnalysisTask, {
    webAppPath,
    framework,
    featuresToExpose,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...webAppAnalysis.artifacts);

  // Quality gate: confirm analysis before CSP investigation
  let lastFeedback_analysisReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_analysisReview) {
      const revised = await ctx.task(webAppAnalysisTask, {
        webAppPath,
        framework,
        featuresToExpose,
        referenceCodePath: referenceCode.repoPath,
        outputDir,
        feedback: lastFeedback_analysisReview,
        attempt: attempt + 1
      });
      Object.assign(webAppAnalysis, revised);
    }

    const analysisReview = await ctx.breakpoint({
      question: 'Review web app analysis: data sources mapped, external dependencies cataloged, build system understood. Proceed with CSP investigation?',
      title: 'Web App Analysis Review',
      context: {
        runId: ctx.runId,
        summary: {
          webAppPath,
          framework: webAppAnalysis.detectedFramework,
          dataSources: webAppAnalysis.dataSources,
          externalDependencies: webAppAnalysis.externalDependencies,
          buildSystem: webAppAnalysis.buildSystem,
          featuresToExpose
        }
      },
      expert: 'owner',
      tags: ['analysis-review'],
      previousFeedback: lastFeedback_analysisReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (analysisReview.approved) break;
    lastFeedback_analysisReview = analysisReview.response || analysisReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 3: CSP INVESTIGATION (CRITICAL SECURITY STEP)
  // ============================================================================

  ctx.log('info', 'Phase 3: CSP investigation -- CRITICAL security step for sandboxed iframe');

  let cspInvestigation = await ctx.task(cspInvestigationTask, {
    webAppPath,
    externalDependencies: webAppAnalysis.externalDependencies,
    buildSystem: webAppAnalysis.buildSystem,
    outputDir
  });

  artifacts.push(...cspInvestigation.artifacts);

  // CSP convergence loop -- must be exhaustive
  let lastFeedback_cspAudit = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (lastFeedback_cspAudit) {
      cspInvestigation = await ctx.task(cspInvestigationTask, {
        webAppPath,
        externalDependencies: webAppAnalysis.externalDependencies,
        buildSystem: webAppAnalysis.buildSystem,
        outputDir,
        feedback: lastFeedback_cspAudit,
        attempt: attempt + 1
      });
    }

    const cspAuditGate = await ctx.breakpoint({
      question: 'CSP audit complete. Review documented domains (resource, connect, frame) with environment annotations. All origins accounted for?',
      title: 'CSP Audit Review',
      context: {
        runId: ctx.runId,
        summary: {
          resourceDomains: cspInvestigation.resourceDomains,
          connectDomains: cspInvestigation.connectDomains,
          frameDomains: cspInvestigation.frameDomains,
          totalOrigins: cspInvestigation.totalOrigins,
          conditionalOrigins: cspInvestigation.conditionalOrigins
        }
      },
      expert: 'owner',
      tags: ['csp-audit'],
      previousFeedback: lastFeedback_cspAudit || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (cspAuditGate.approved) break;
    lastFeedback_cspAudit = cspAuditGate.response || cspAuditGate.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 4: MCP SERVER SETUP & BUILD ADAPTATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: MCP server setup and build pipeline adaptation (parallel)');

  const [mcpServerSetup, buildPipelineAdapt] = await ctx.parallel.all([
    ctx.task(mcpServerSetupTask, {
      webAppPath,
      featuresToExpose,
      framework,
      transport,
      cspConfig: {
        resourceDomains: cspInvestigation.resourceDomains,
        connectDomains: cspInvestigation.connectDomains,
        frameDomains: cspInvestigation.frameDomains
      },
      referenceCodePath: referenceCode.repoPath,
      outputDir
    }),
    ctx.task(buildPipelineAdaptTask, {
      webAppPath,
      buildSystem: webAppAnalysis.buildSystem,
      framework,
      outputDir
    })
  ]);

  artifacts.push(...mcpServerSetup.artifacts);
  artifacts.push(...buildPipelineAdapt.artifacts);

  // ============================================================================
  // PHASE 5: HYBRID INITIALIZATION PATTERN
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing hybrid initialization pattern (MCP + standalone)');

  const hybridInit = await ctx.task(hybridInitTask, {
    webAppPath,
    framework,
    dataSources: webAppAnalysis.dataSources,
    serverInfo: mcpServerSetup.serverInfo,
    referenceCodePath: referenceCode.repoPath,
    outputDir
  });

  artifacts.push(...hybridInit.artifacts);

  // ============================================================================
  // PHASE 6: HOST STYLING INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Host styling integration with CSS variable fallbacks');

  const hostStyling = await ctx.task(hostStylingTask, {
    webAppPath,
    framework,
    outputDir
  });

  artifacts.push(...hostStyling.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION REVIEW (CONVERGENCE LOOP)
  // ============================================================================

  ctx.log('info', 'Phase 7: Quality-gated implementation review');

  let implementationReview = await ctx.task(implementationReviewTask, {
    webAppPath,
    framework,
    hybridInfo: hybridInit.hybridInfo,
    cspConfig: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains
    },
    outputDir
  });

  artifacts.push(...implementationReview.artifacts);

  let lastFeedback_implReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_implReview) {
      implementationReview = await ctx.task(implementationReviewTask, {
        webAppPath,
        framework,
        hybridInfo: hybridInit.hybridInfo,
        cspConfig: {
          resourceDomains: cspInvestigation.resourceDomains,
          connectDomains: cspInvestigation.connectDomains,
          frameDomains: cspInvestigation.frameDomains
        },
        outputDir,
        feedback: lastFeedback_implReview,
        attempt: attempt + 1
      });
    }

    const implReview = await ctx.breakpoint({
      question: 'Review hybrid implementation. Both modes work? CSP complete? Handler-before-connect? Shared rendering?',
      title: 'Implementation Review',
      context: {
        runId: ctx.runId,
        summary: {
          hybridDetection: implementationReview.checks.hybridDetection,
          bothModesInit: implementationReview.checks.bothModesInit,
          cspComplete: implementationReview.checks.cspComplete,
          handlerBeforeConnect: implementationReview.checks.handlerBeforeConnect,
          sharedRendering: implementationReview.checks.sharedRendering,
          textFallback: implementationReview.checks.textFallback
        }
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
  // PHASE 8: DUAL-MODE VERIFICATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 8: Dual-mode verification (MCP + standalone, parallel)');

  let [mcpModeTest, standaloneModeTest] = await ctx.parallel.all([
    ctx.task(mcpModeTestTask, {
      webAppPath,
      referenceCodePath: referenceCode.repoPath,
      cspConfig: {
        resourceDomains: cspInvestigation.resourceDomains,
        connectDomains: cspInvestigation.connectDomains,
        frameDomains: cspInvestigation.frameDomains
      },
      outputDir
    }),
    ctx.task(standaloneModeTestTask, {
      webAppPath,
      outputDir
    })
  ]);

  artifacts.push(...mcpModeTest.artifacts);
  artifacts.push(...standaloneModeTest.artifacts);

  // Dual-mode verification convergence loop
  let lastFeedback_dualMode = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_dualMode) {
      const [revisedMcp, revisedStandalone] = await ctx.parallel.all([
        ctx.task(mcpModeTestTask, {
          webAppPath,
          referenceCodePath: referenceCode.repoPath,
          cspConfig: {
            resourceDomains: cspInvestigation.resourceDomains,
            connectDomains: cspInvestigation.connectDomains,
            frameDomains: cspInvestigation.frameDomains
          },
          outputDir,
          feedback: lastFeedback_dualMode,
          attempt: attempt + 1
        }),
        ctx.task(standaloneModeTestTask, {
          webAppPath,
          outputDir,
          feedback: lastFeedback_dualMode,
          attempt: attempt + 1
        })
      ]);
      mcpModeTest = revisedMcp;
      standaloneModeTest = revisedStandalone;
    }

    const dualModeGate = await ctx.breakpoint({
      question: 'Both modes verified? MCP mode works in basic-host? Standalone mode works in browser?',
      title: 'Dual-Mode Verification',
      context: {
        runId: ctx.runId,
        summary: {
          mcpMode: {
            appLoads: mcpModeTest.checks.appLoads,
            handlersFire: mcpModeTest.checks.handlersFire,
            hostStylingApplies: mcpModeTest.checks.hostStylingApplies,
            externalResourcesLoad: mcpModeTest.checks.externalResourcesLoad
          },
          standaloneMode: {
            appLoads: standaloneModeTest.checks.appLoads,
            dataSourcesWork: standaloneModeTest.checks.dataSourcesWork,
            noRegressions: standaloneModeTest.checks.noRegressions
          }
        }
      },
      expert: 'owner',
      tags: ['verification-gate'],
      previousFeedback: lastFeedback_dualMode || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (dualModeGate.approved) break;
    lastFeedback_dualMode = dualModeGate.response || dualModeGate.feedback || 'Changes requested';
  }

  const endTime = ctx.now();

  ctx.log('info', `Web App to MCP conversion complete: ${webAppPath}`);

  return {
    success: true,
    webAppPath,
    webAppAnalysis: {
      framework: webAppAnalysis.detectedFramework,
      dataSources: webAppAnalysis.dataSources,
      externalDependencies: webAppAnalysis.externalDependencies
    },
    cspAudit: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains,
      totalOrigins: cspInvestigation.totalOrigins
    },
    hybridImplementation: hybridInit.hybridInfo,
    verificationResults: {
      mcpMode: mcpModeTest.checks,
      standaloneMode: standaloneModeTest.checks
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/ai-agents-conversational/convert-web-app-to-mcp',
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
      task: 'Clone the MCP Apps SDK repository at the exact published npm version.',
      context: args,
      instructions: [
        '1. Clone https://github.com/modelcontextprotocol/ext-apps repository',
        '2. Checkout the tag matching the published npm version',
        '3. Verify docs/csp-cors.md is present (critical for this process)',
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

export const webAppAnalysisTask = defineTask('web-app-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Web App Analysis - ${args.webAppPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Deep analysis of existing web app: data sources, external dependencies, build system, user interactions, runtime detection strategy.',
      context: args,
      instructions: [
        '1. Analyze data sources and map to MCP equivalents:',
        '   - URL params -> ontoolinput arguments',
        '   - REST APIs -> callServerTool() + CSP declaration',
        '   - Props/state -> ontoolinput arguments',
        '   - localStorage -> server-side state management',
        '   - WebSockets -> CSP + polling pattern',
        '2. Catalog ALL external dependencies (CDN scripts, fonts, APIs, images, iframes)',
        '3. Analyze build system: bundler, framework, entry points, output format',
        '4. Map user interactions to MCP App patterns',
        '5. Design runtime detection strategy (window.location.origin === \'null\' for sandboxed iframe)',
        '6. Identify shared rendering logic (must work in both modes)',
        '7. Document features that need special MCP adaptation',
        '8. Identify potential app-only helper tools for UI-driven server interaction'
      ],
      outputFormat: 'JSON with detectedFramework, dataSources, externalDependencies, buildSystem, runtimeDetection, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedFramework', 'dataSources', 'externalDependencies', 'buildSystem', 'artifacts'],
      properties: {
        detectedFramework: { type: 'string' },
        dataSources: { type: 'array' },
        externalDependencies: { type: 'array' },
        buildSystem: { type: 'object' },
        runtimeDetection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'analysis', 'web-app']
}));

export const cspInvestigationTask = defineTask('csp-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `CSP Investigation - ${args.webAppPath}`,
  agent: {
    name: 'csp-security-auditor',
    prompt: {
      role: 'CSP Security Auditor',
      task: 'CRITICAL SECURITY STEP: Build the app and search resulting HTML/CSS/JS for EVERY origin. All network requests fail SILENTLY without CSP in sandboxed iframe.',
      context: args,
      instructions: [
        '1. Build the web app to produce output files',
        '2. Search ALL output files (HTML, CSS, JS) for every network origin',
        '3. Trace each origin to its source: hardcoded constant, environment variable, or conditional logic',
        '4. Check third-party libraries for hidden network requests (fetch, XHR, script src, link href, img src, font URLs, iframe src, WebSocket)',
        '5. Categorize into resourceDomains (scripts, styles, images, fonts), connectDomains (fetch/XHR/WebSocket), frameDomains (nested iframes)',
        '6. Annotate each as universal, dev-only, or prod-only',
        '7. For conditional origins: verify same config controls both runtime URL and CSP entry',
        '8. Document totalOrigins count and conditionalOrigins list',
        '9. Missing even ONE origin causes SILENT failure in sandboxed iframe',
        '10. Generate CSP configuration for registerAppResource read callback'
      ],
      outputFormat: 'JSON with resourceDomains, connectDomains, frameDomains, totalOrigins, conditionalOrigins, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resourceDomains', 'connectDomains', 'frameDomains', 'totalOrigins', 'artifacts'],
      properties: {
        resourceDomains: { type: 'array' },
        connectDomains: { type: 'array' },
        frameDomains: { type: 'array' },
        totalOrigins: { type: 'number' },
        conditionalOrigins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'csp', 'security']
}));

export const mcpServerSetupTask = defineTask('mcp-server-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCP Server Setup - ${args.webAppPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Create server.ts with tool and resource registration. Include CSP configuration from investigation.',
      context: args,
      instructions: [
        '1. Create server.ts with McpServer instance',
        '2. Use registerAppTool() for each exposed feature',
        '3. Tool _meta.ui.resourceUri must match registered resource URI',
        '4. Always include content array with text fallback',
        '5. Use registerAppResource() with RESOURCE_MIME_TYPE',
        '6. Include CSP domains in resource configuration (resourceDomains, connectDomains, frameDomains)',
        '7. Configure transport (stdio or HTTP/SSE)',
        '8. Install MCP dependencies: @modelcontextprotocol/ext-apps, @modelcontextprotocol/sdk, zod',
        '9. Reference SDK examples for correct API usage',
        '10. Document server info for hybrid initialization phase'
      ],
      outputFormat: 'JSON with serverInfo (tools, resources, transport, csp), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['serverInfo', 'artifacts'],
      properties: {
        serverInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'server', 'setup']
}));

export const buildPipelineAdaptTask = defineTask('build-pipeline-adapt', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Pipeline Adaptation - ${args.webAppPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Create vite.config.ts with singlefile plugin for MCP build. Standalone build stays unchanged. Two-phase build.',
      context: args,
      instructions: [
        '1. Create separate vite.config.mcp.ts (or extend existing) for MCP build with vite-plugin-singlefile',
        '2. Create mcp-app.html as MCP-specific entry point',
        '3. Standalone build configuration stays UNCHANGED',
        '4. Add build scripts: build:mcp-ui (Vite singlefile), build:mcp-server (tsc), build:mcp (both)',
        '5. Keep original build scripts intact',
        '6. Install dev deps: vite, vite-plugin-singlefile (if not already present)',
        '7. MCP build outputs single HTML file; standalone build outputs as before',
        '8. Document two-phase build: Vite bundles UI, server compiled separately'
      ],
      outputFormat: 'JSON with buildScripts, viteConfig, entryPoints, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['buildScripts', 'artifacts'],
      properties: {
        buildScripts: { type: 'object' },
        viteConfig: { type: 'string' },
        entryPoints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'build', 'hybrid']
}));

export const hybridInitTask = defineTask('hybrid-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hybrid Initialization - ${args.webAppPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Implement hybrid initialization: detect environment, branch initialization for MCP vs standalone. CRITICAL: Keep original data sources intact; add MCP path alongside, never replace.',
      context: args,
      instructions: [
        '1. Detect environment: window.location.origin === \'null\' for sandboxed iframe, or origin check, or query param',
        '2. MCP mode: create App instance with PostMessageTransport',
        '3. MCP mode: register ALL handlers BEFORE app.connect() (CRITICAL INVARIANT)',
        '4. MCP mode: ontoolinput provides data instead of URL params/REST APIs',
        '5. Standalone mode: use existing data sources UNCHANGED',
        '6. SHARE rendering logic between both modes -- only data source changes',
        '7. NEVER remove original standalone data sources -- add MCP path alongside',
        '8. For React: conditional useApp() in MCP mode, regular hooks in standalone',
        '9. Test that toggling between modes works correctly',
        '10. Document the hybrid initialization pattern for maintainability'
      ],
      outputFormat: 'JSON with hybridInfo (detectionMethod, mcpHandlers, sharedComponents), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hybridInfo', 'artifacts'],
      properties: {
        hybridInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'hybrid', 'initialization']
}));

export const hostStylingTask = defineTask('host-styling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Host Styling Integration - ${args.webAppPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Integrate host styling with CSS variable fallbacks so app looks correct in both MCP and standalone modes.',
      context: args,
      instructions: [
        '1. Use CSS variable fallbacks: var(--color-background-secondary, #f5f5f5)',
        '2. Replace hardcoded colors with host CSS variables where appropriate',
        '3. In MCP mode: apply host styling via onhostcontextchanged handler',
        '4. Use SDK helpers: applyDocumentTheme(), applyHostStyleVariables(), applyHostFonts()',
        '5. For React: use useHostStyles(), useHostStyleVariables(), useHostFonts() hooks',
        '6. Handle safe area insets for different display modes',
        '7. Standalone mode: fallback values ensure correct appearance without host vars',
        '8. Test that styling works in both modes without visual regression'
      ],
      outputFormat: 'JSON with stylingInfo (cssVariables, helpers, fallbacks), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stylingInfo', 'artifacts'],
      properties: {
        stylingInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'styling', 'host-integration']
}));

export const implementationReviewTask = defineTask('implementation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Review - ${args.webAppPath}`,
  agent: {
    name: 'mcp-app-architect',
    prompt: {
      role: 'MCP App Architect',
      task: 'Review hybrid implementation against all MCP Apps critical patterns.',
      context: args,
      instructions: [
        '1. CHECK: Hybrid detection works (origin check identifies MCP vs standalone)',
        '2. CHECK: Both modes initialize correctly without errors',
        '3. CHECK: CSP domains ALL declared in registerAppResource configuration',
        '4. CHECK: Handler-before-connect invariant enforced',
        '5. CHECK: Text fallback present for non-UI hosts',
        '6. CHECK: Shared rendering logic -- same components render in both modes',
        '7. CHECK: Original standalone data sources preserved (not removed)',
        '8. CHECK: Single-file bundle for MCP mode',
        '9. CHECK: Host styling with CSS variable fallbacks',
        '10. Compile results into checklist with pass/fail'
      ],
      outputFormat: 'JSON with checks object, issues array, and artifacts'
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
  labels: ['mcp-apps', 'review', 'hybrid']
}));

export const mcpModeTestTask = defineTask('mcp-mode-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCP Mode Test - ${args.webAppPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Test MCP mode: app loads in basic-host, handlers fire, host styling applies, external resources load via CSP.',
      context: args,
      instructions: [
        '1. Build the MCP version of the app',
        '2. Launch basic-host from SDK reference code',
        '3. CHECK: App loads in basic-host without console errors',
        '4. CHECK: ontoolinput handler fires with tool arguments',
        '5. CHECK: ontoolresult handler fires with result data',
        '6. CHECK: Host styling applies (CSS variables resolved)',
        '7. CHECK: External resources load via CSP (no silent failures)',
        '8. CHECK: App renders data correctly from MCP data path',
        '9. Document any failures with reproduction steps'
      ],
      outputFormat: 'JSON with checks object, testLog, and artifacts'
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
  labels: ['mcp-apps', 'testing', 'mcp-mode']
}));

export const standaloneModeTestTask = defineTask('standalone-mode-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standalone Mode Test - ${args.webAppPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Test standalone mode: app still works when opened directly in browser with no regressions.',
      context: args,
      instructions: [
        '1. Build the standalone version of the app (original build)',
        '2. Open in browser directly',
        '3. CHECK: App loads without errors',
        '4. CHECK: Original data sources still work (REST APIs, URL params, etc.)',
        '5. CHECK: No visual regressions from CSS variable fallbacks',
        '6. CHECK: No MCP-specific code interferes with standalone operation',
        '7. CHECK: All original features still functional',
        '8. Document any regressions found'
      ],
      outputFormat: 'JSON with checks object, testLog, and artifacts'
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
  labels: ['mcp-apps', 'testing', 'standalone-mode']
}));
