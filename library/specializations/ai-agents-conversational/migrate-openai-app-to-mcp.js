/**
 * @process specializations/ai-agents-conversational/migrate-openai-app-to-mcp
 * @description Migrate OpenAI Apps SDK to MCP Apps - Migrates existing OpenAI Apps SDK applications to the open
 * MCP Apps standard. Handles the paradigm shift from synchronous global object (window.openai.*) to async App
 * instance with event handlers. Includes mandatory CSP investigation, CORS configuration, and pattern-based
 * search-and-replace verification checklist.
 * @inputs { openaiAppPath: string, targetFramework?: string, transport?: string, outputDir?: string }
 * @outputs { success: boolean, cspAudit: object, serverMigration: object, clientMigration: object, verificationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/migrate-openai-app-to-mcp', {
 *   openaiAppPath: './src',
 *   targetFramework: 'react',
 *   transport: 'stdio'
 * });
 *
 * @references
 * - MCP Apps SDK: https://github.com/modelcontextprotocol/ext-apps
 * - OpenAI to MCP Migration Guide: docs/migrate_from_openai_apps.md in SDK repository
 * - MCP Apps Specification (2026-01-26): https://modelcontextprotocol.io/specification/2026-01-26/server/utilities/apps
 * - npm: @modelcontextprotocol/ext-apps
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    openaiAppPath,
    targetFramework = 'react',
    transport = 'stdio',
    outputDir = 'migrate-openai-output',
    sdkVersion = 'latest'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OpenAI Apps SDK to MCP migration: ${openaiAppPath}`);

  // ============================================================================
  // PHASE 1: REFERENCE CODE & MIGRATION GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 1: Cloning SDK and reading migration guide');

  const referenceAndGuide = await ctx.task(referenceAndMigrationGuideTask, {
    sdkVersion,
    openaiAppPath,
    outputDir
  });

  artifacts.push(...referenceAndGuide.artifacts);

  // ============================================================================
  // PHASE 2: CSP INVESTIGATION
  // ============================================================================

  ctx.log('info', 'Phase 2: CSP investigation for OpenAI app (sandboxed iframe requires all origins declared)');

  let cspInvestigation = await ctx.task(cspInvestigationTask, {
    openaiAppPath,
    outputDir
  });

  artifacts.push(...cspInvestigation.artifacts);

  // CSP convergence loop
  let lastFeedback_cspAudit = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (lastFeedback_cspAudit) {
      cspInvestigation = await ctx.task(cspInvestigationTask, {
        openaiAppPath,
        outputDir,
        feedback: lastFeedback_cspAudit,
        attempt: attempt + 1
      });
    }

    const cspAuditGate = await ctx.breakpoint({
      question: 'CSP audit complete for OpenAI app. All origins documented with environment annotations?',
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
  // PHASE 3: CORS CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring CORS for MCP client cross-origin requests');

  const corsConfig = await ctx.task(corsConfigTask, {
    openaiAppPath,
    transport,
    outputDir
  });

  artifacts.push(...corsConfig.artifacts);

  // ============================================================================
  // PHASE 4: SERVER-SIDE MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Server-side migration (registerTool -> registerAppTool)');

  const serverMigration = await ctx.task(serverMigrationTask, {
    openaiAppPath,
    targetFramework,
    transport,
    cspConfig: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains
    },
    migrationGuide: referenceAndGuide.migrationGuide,
    referenceCodePath: referenceAndGuide.repoPath,
    outputDir
  });

  artifacts.push(...serverMigration.artifacts);

  // ============================================================================
  // PHASE 5: CLIENT-SIDE MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Client-side migration (window.openai.* -> App instance event handlers)');

  const clientMigration = await ctx.task(clientMigrationTask, {
    openaiAppPath,
    targetFramework,
    migrationGuide: referenceAndGuide.migrationGuide,
    referenceCodePath: referenceAndGuide.repoPath,
    outputDir
  });

  artifacts.push(...clientMigration.artifacts);

  // ============================================================================
  // PHASE 6: MIGRATION REVIEW (CONVERGENCE LOOP)
  // ============================================================================

  ctx.log('info', 'Phase 6: Quality-gated migration review');

  let migrationReview = await ctx.task(migrationReviewTask, {
    openaiAppPath,
    serverMigrationInfo: serverMigration.migrationInfo,
    clientMigrationInfo: clientMigration.migrationInfo,
    cspConfig: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains
    },
    outputDir
  });

  artifacts.push(...migrationReview.artifacts);

  let lastFeedback_migrationReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_migrationReview) {
      migrationReview = await ctx.task(migrationReviewTask, {
        openaiAppPath,
        serverMigrationInfo: serverMigration.migrationInfo,
        clientMigrationInfo: clientMigration.migrationInfo,
        cspConfig: {
          resourceDomains: cspInvestigation.resourceDomains,
          connectDomains: cspInvestigation.connectDomains,
          frameDomains: cspInvestigation.frameDomains
        },
        outputDir,
        feedback: lastFeedback_migrationReview,
        attempt: attempt + 1
      });
    }

    const reviewGate = await ctx.breakpoint({
      question: 'Review migration completeness. All OpenAI patterns replaced? CSP configured? Handler-before-connect?',
      title: 'Migration Review',
      context: {
        runId: ctx.runId,
        summary: {
          allApisMapped: migrationReview.checks.allApisMapped,
          noOpenaiPatterns: migrationReview.checks.noOpenaiPatterns,
          cspConfigured: migrationReview.checks.cspConfigured,
          handlerBeforeConnect: migrationReview.checks.handlerBeforeConnect,
          textFallback: migrationReview.checks.textFallback,
          unavailableFeatures: migrationReview.unavailableFeatures
        }
      },
      expert: 'owner',
      tags: ['migration-review'],
      previousFeedback: lastFeedback_migrationReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (reviewGate.approved) break;
    lastFeedback_migrationReview = reviewGate.response || reviewGate.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 7: BEFORE FINISHING CHECKLIST (MANDATORY PATTERN SEARCH)
  // ============================================================================

  ctx.log('info', 'Phase 7: MANDATORY Before Finishing Checklist -- pattern-based search verification');

  let beforeFinishingChecklist = await ctx.task(beforeFinishingChecklistTask, {
    openaiAppPath,
    cspConfig: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains
    },
    outputDir
  });

  artifacts.push(...beforeFinishingChecklist.artifacts);

  let lastFeedback_checklist = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_checklist) {
      beforeFinishingChecklist = await ctx.task(beforeFinishingChecklistTask, {
        openaiAppPath,
        cspConfig: {
          resourceDomains: cspInvestigation.resourceDomains,
          connectDomains: cspInvestigation.connectDomains,
          frameDomains: cspInvestigation.frameDomains
        },
        outputDir,
        feedback: lastFeedback_checklist,
        attempt: attempt + 1
      });
    }

    const checklistGate = await ctx.breakpoint({
      question: 'Pattern search complete. Zero remaining OpenAI patterns found? All CSP origins in config? Conditional origins properly handled?',
      title: 'Before Finishing Checklist',
      context: {
        runId: ctx.runId,
        summary: {
          serverPatterns: beforeFinishingChecklist.serverSidePatterns,
          clientPatterns: beforeFinishingChecklist.clientSidePatterns,
          cspVerification: beforeFinishingChecklist.cspVerification,
          remainingLegacyCount: beforeFinishingChecklist.remainingLegacyCount
        }
      },
      expert: 'owner',
      tags: ['before-finishing-checklist'],
      previousFeedback: lastFeedback_checklist || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });

    if (checklistGate.approved) break;
    lastFeedback_checklist = checklistGate.response || checklistGate.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 8: VERIFICATION & TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Verification and testing with basic-host');

  let verification = await ctx.task(verificationTask, {
    openaiAppPath,
    referenceCodePath: referenceAndGuide.repoPath,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  let lastFeedback_verification = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_verification) {
      verification = await ctx.task(verificationTask, {
        openaiAppPath,
        referenceCodePath: referenceAndGuide.repoPath,
        outputDir,
        feedback: lastFeedback_verification,
        attempt: attempt + 1
      });
    }

    const verificationGate = await ctx.breakpoint({
      question: 'Migrated app works in basic-host? Handlers fire? No console errors? No window.openai at runtime?',
      title: 'Final Verification',
      context: {
        runId: ctx.runId,
        summary: {
          appLoads: verification.checks.appLoads,
          ontoolinputFires: verification.checks.ontoolinputFires,
          ontoolresultFires: verification.checks.ontoolresultFires,
          noConsoleErrors: verification.checks.noConsoleErrors,
          noWindowOpenai: verification.checks.noWindowOpenai,
          hostStylingApplies: verification.checks.hostStylingApplies
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

  ctx.log('info', `OpenAI to MCP migration complete: ${openaiAppPath}`);

  return {
    success: true,
    openaiAppPath,
    cspAudit: {
      resourceDomains: cspInvestigation.resourceDomains,
      connectDomains: cspInvestigation.connectDomains,
      frameDomains: cspInvestigation.frameDomains,
      totalOrigins: cspInvestigation.totalOrigins
    },
    serverMigration: serverMigration.migrationInfo,
    clientMigration: clientMigration.migrationInfo,
    verificationResults: verification.checks,
    beforeFinishingResults: {
      remainingLegacyCount: beforeFinishingChecklist.remainingLegacyCount,
      serverPatterns: beforeFinishingChecklist.serverSidePatterns,
      clientPatterns: beforeFinishingChecklist.clientSidePatterns
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/ai-agents-conversational/migrate-openai-app-to-mcp',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const referenceAndMigrationGuideTask = defineTask('reference-and-migration-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clone SDK & Read Migration Guide',
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'Clone the MCP Apps SDK repository and read the authoritative OpenAI-to-MCP migration guide.',
      context: args,
      instructions: [
        '1. Clone https://github.com/modelcontextprotocol/ext-apps repository',
        '2. Checkout the tag matching the published npm version',
        '3. Read docs/migrate_from_openai_apps.md -- this is the AUTHORITATIVE migration reference',
        '4. Extract complete before/after API mapping tables',
        '5. Document unavailable features (widgetState, uploadFile, requestModal, view)',
        '6. Note key paradigm shifts: synchronous global -> async event-driven',
        '7. Document the repo path for subsequent phases'
      ],
      outputFormat: 'JSON with repoPath, sdkVersion, migrationGuide (mappings, unavailableFeatures), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['repoPath', 'sdkVersion', 'migrationGuide', 'artifacts'],
      properties: {
        repoPath: { type: 'string' },
        sdkVersion: { type: 'string' },
        migrationGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'reference-code', 'migration-guide']
}));

export const cspInvestigationTask = defineTask('csp-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `CSP Investigation - ${args.openaiAppPath}`,
  agent: {
    name: 'csp-security-auditor',
    prompt: {
      role: 'CSP Security Auditor',
      task: 'Build the existing OpenAI app and audit ALL network origins. Every origin must be declared for sandboxed iframe -- missing origins fail SILENTLY.',
      context: args,
      instructions: [
        '1. Build the existing OpenAI app to produce output files',
        '2. Search ALL output (HTML, CSS, JS) for every network origin',
        '3. Trace each origin to source: hardcoded constant, environment variable, conditional logic',
        '4. Check third-party libraries for hidden network requests',
        '5. Categorize: resourceDomains (scripts/styles/images/fonts), connectDomains (fetch/XHR/WebSocket), frameDomains (nested iframes)',
        '6. Annotate each as universal, dev-only, or prod-only',
        '7. For conditional origins: verify config controls both runtime URL and CSP entry',
        '8. Count total origins and list conditional origins separately',
        '9. Generate CSP configuration for registerAppResource',
        '10. Missing even ONE origin causes SILENT failure'
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
  labels: ['mcp-apps', 'csp', 'security', 'openai-migration']
}));

export const corsConfigTask = defineTask('cors-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `CORS Configuration - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'Configure CORS for MCP client cross-origin requests.',
      context: args,
      instructions: [
        '1. Determine server framework (Express, raw HTTP, etc.)',
        '2. For Express: add app.use(cors()) middleware',
        '3. For raw HTTP: set Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Expose-Headers',
        '4. Required allowed headers: mcp-session-id, mcp-protocol-version, last-event-id',
        '5. Required exposed headers: mcp-session-id',
        '6. Allow appropriate methods: GET, POST, OPTIONS',
        '7. Verify CORS works with MCP client requests',
        '8. Document CORS configuration for maintainability'
      ],
      outputFormat: 'JSON with corsInfo (framework, headers, configuration), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['corsInfo', 'artifacts'],
      properties: {
        corsInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'cors', 'openai-migration']
}));

export const serverMigrationTask = defineTask('server-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Server-Side Migration - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'Replace raw server.registerTool/registerResource with registerAppTool/registerAppResource helpers. Map OpenAI metadata keys to MCP equivalents.',
      context: args,
      instructions: [
        '1. Identify all server.registerTool() and server.registerResource() calls',
        '2. Replace with registerAppTool() and registerAppResource() helpers',
        '3. These helpers handle MCP Apps metadata format automatically',
        '4. Map OpenAI metadata keys to MCP equivalents (openai/* -> _meta.ui.*)',
        '5. Replace text/html+skybridge MIME type with RESOURCE_MIME_TYPE constant',
        '6. Add structuredContent to tool responses for UI data passing',
        '7. KEEP content array with text fallback for non-UI hosts',
        '8. Include CSP configuration in registerAppResource (resourceDomains, connectDomains, frameDomains)',
        '9. Convert snake_case CSP properties to camelCase',
        '10. Reference migration guide for complete mapping tables'
      ],
      outputFormat: 'JSON with migrationInfo (mappedTools, mappedResources, metadataChanges), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationInfo', 'artifacts'],
      properties: {
        migrationInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'server', 'openai-migration']
}));

export const clientMigrationTask = defineTask('client-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client-Side Migration - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'Migrate from synchronous window.openai.* global to async App instance with event handlers. CRITICAL: Register ALL handlers BEFORE app.connect().',
      context: args,
      instructions: [
        '1. PARADIGM SHIFT: window.openai.toolInput (sync, pre-populated) -> ontoolinput handler (async, event-driven)',
        '2. Map window.openai.toolInput -> params.arguments in ontoolinput callback',
        '3. Map window.openai.toolOutput -> params.structuredContent in ontoolresult callback',
        '4. Map window.openai.theme -> app.getHostContext() and onhostcontextchanged handler',
        '5. Create App instance with PostMessageTransport',
        '6. Register ALL handlers (ontoolinput, ontoolresult, onhostcontextchanged, onteardown) BEFORE app.connect()',
        '7. Document unavailable features: widgetState, uploadFile, requestModal, view',
        '8. Provide workarounds where possible (updateModelContext for context, sendMessage for communication)',
        '9. Remove all window.openai.* references',
        '10. Apply host styling via SDK helpers instead of window.openai.theme'
      ],
      outputFormat: 'JSON with migrationInfo (apiMappings, unavailableFeatures, workarounds), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationInfo', 'artifacts'],
      properties: {
        migrationInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'client', 'openai-migration']
}));

export const migrationReviewTask = defineTask('migration-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migration Review - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'Review complete migration against all API mappings, CSP configuration, and MCP Apps patterns.',
      context: args,
      instructions: [
        '1. CHECK: All OpenAI API calls mapped to MCP equivalents',
        '2. CHECK: No remaining window.openai.* references in source',
        '3. CHECK: CSP configured with all origins from investigation',
        '4. CHECK: Handler-before-connect invariant enforced',
        '5. CHECK: Text fallback present for non-UI hosts',
        '6. CHECK: RESOURCE_MIME_TYPE used (not text/html+skybridge)',
        '7. CHECK: camelCase CSP properties (not snake_case)',
        '8. CHECK: No openai/ metadata prefixes remaining',
        '9. Document unavailable features with workarounds',
        '10. Compile results into checklist with pass/fail'
      ],
      outputFormat: 'JSON with checks object, unavailableFeatures, issues array, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'unavailableFeatures', 'artifacts'],
      properties: {
        checks: { type: 'object' },
        unavailableFeatures: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'review', 'openai-migration']
}));

export const beforeFinishingChecklistTask = defineTask('before-finishing-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Before Finishing Checklist - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-migration-specialist',
    prompt: {
      role: 'MCP Migration Specialist',
      task: 'MANDATORY pattern-based search verification. Zero remaining legacy references is the ONLY acceptable outcome.',
      context: args,
      instructions: [
        '1. SERVER-SIDE SEARCH: grep for \'openai/\' (old metadata prefix)',
        '2. SERVER-SIDE SEARCH: grep for \'text/html+skybridge\' (old MIME type)',
        '3. SERVER-SIDE SEARCH: grep for \'text/html;profile=mcp-app\' (should use RESOURCE_MIME_TYPE constant)',
        '4. SERVER-SIDE SEARCH: grep for \'_domains"\' or \'_domains:\' (snake_case CSP should be camelCase)',
        '5. CLIENT-SIDE SEARCH: grep for \'window.openai.toolInput\' (must be removed)',
        '6. CLIENT-SIDE SEARCH: grep for \'window.openai.toolOutput\' (must be removed)',
        '7. CLIENT-SIDE SEARCH: grep for \'window.openai\' (catch-all for any remaining references)',
        '8. CSP VERIFICATION: verify every origin from CSP investigation appears in registerAppResource() config',
        '9. CONDITIONAL ORIGINS: verify config controls both runtime URL and CSP entry',
        '10. Count total remaining legacy patterns -- must be ZERO',
        '11. If any found: provide exact file:line locations and fix instructions'
      ],
      outputFormat: 'JSON with serverSidePatterns, clientSidePatterns, cspVerification, remainingLegacyCount, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['serverSidePatterns', 'clientSidePatterns', 'cspVerification', 'remainingLegacyCount', 'artifacts'],
      properties: {
        serverSidePatterns: { type: 'object' },
        clientSidePatterns: { type: 'object' },
        cspVerification: { type: 'object' },
        remainingLegacyCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp-apps', 'checklist', 'openai-migration', 'verification']
}));

export const verificationTask = defineTask('verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verification & Testing - ${args.openaiAppPath}`,
  agent: {
    name: 'mcp-ui-developer',
    prompt: {
      role: 'MCP UI Developer',
      task: 'Build and test migrated app with basic-host. Verify handlers fire, no console errors, no remaining window.openai at runtime.',
      context: args,
      instructions: [
        '1. Build the migrated app using configured build scripts',
        '2. Verify single HTML file output',
        '3. Launch basic-host from SDK reference code',
        '4. CHECK: App loads in basic-host without console errors',
        '5. CHECK: ontoolinput handler fires with tool arguments (was window.openai.toolInput)',
        '6. CHECK: ontoolresult handler fires with result data (was window.openai.toolOutput)',
        '7. CHECK: Host styling applies (was window.openai.theme)',
        '8. CHECK: No remaining window.openai references at runtime (check browser console)',
        '9. CHECK: Text fallback works for non-UI hosts',
        '10. Document any failures with reproduction steps and fix instructions'
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
  labels: ['mcp-apps', 'verification', 'testing', 'openai-migration']
}));
