/**
 * @process specializations/sdk-platform-development/backward-compatibility-management
 * @description Backward Compatibility Management - Maintain backward compatibility and manage breaking changes
 * including deprecation warnings, migration paths, and compatibility verification.
 * @inputs { projectName: string, compatibilityLevel?: string, deprecationPolicy?: object, migrationSupport?: boolean }
 * @outputs { success: boolean, compatibilityPolicy: object, deprecationProcess: object, migrationGuides: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/backward-compatibility-management', {
 *   projectName: 'CloudAPI SDK',
 *   compatibilityLevel: 'strict',
 *   deprecationPolicy: { warningPeriod: '6 months', removalPeriod: '12 months' },
 *   migrationSupport: true
 * });
 *
 * @references
 * - Semantic Versioning: https://semver.org/
 * - API Evolution: https://www.mnot.net/blog/2012/12/04/api-evolution
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    compatibilityLevel = 'strict',
    deprecationPolicy = { warningPeriod: '6 months', removalPeriod: '12 months' },
    migrationSupport = true,
    outputDir = 'backward-compatibility-management'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Backward Compatibility Management: ${projectName}`);
  ctx.log('info', `Compatibility Level: ${compatibilityLevel}`);

  // ============================================================================
  // PHASE 1: COMPATIBILITY POLICY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining compatibility guarantees');

  const compatibilityPolicy = await ctx.task(compatibilityPolicyTask, {
    projectName,
    compatibilityLevel,
    outputDir
  });

  artifacts.push(...compatibilityPolicy.artifacts);

  // ============================================================================
  // PHASE 2: DEPRECATION PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing deprecation warning system');

  const deprecationProcess = await ctx.task(deprecationProcessTask, {
    projectName,
    deprecationPolicy,
    compatibilityPolicy,
    outputDir
  });

  artifacts.push(...deprecationProcess.artifacts);

  // ============================================================================
  // PHASE 3: MIGRATION PATH DOCUMENTATION
  // ============================================================================

  if (migrationSupport) {
    ctx.log('info', 'Phase 3: Creating migration path documentation');

    const migrationPaths = await ctx.task(migrationPathsTask, {
      projectName,
      deprecationProcess,
      outputDir
    });

    artifacts.push(...migrationPaths.artifacts);
  }

  // ============================================================================
  // PHASE 4: COMPATIBILITY VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Building compatibility verification tests');

  const compatibilityVerification = await ctx.task(compatibilityVerificationTask, {
    projectName,
    compatibilityPolicy,
    outputDir
  });

  artifacts.push(...compatibilityVerification.artifacts);

  // Quality Gate: Compatibility Review
  await ctx.breakpoint({
    question: `Compatibility management configured for ${projectName}. Level: ${compatibilityLevel}, Deprecation period: ${deprecationPolicy.warningPeriod}. Approve compatibility policy?`,
    title: 'Compatibility Policy Review',
    context: {
      runId: ctx.runId,
      projectName,
      compatibilityLevel,
      deprecationPolicy,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: BREAKING CHANGE PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining breaking change management');

  const breakingChangeProcess = await ctx.task(breakingChangeProcessTask, {
    projectName,
    compatibilityPolicy,
    deprecationProcess,
    outputDir
  });

  artifacts.push(...breakingChangeProcess.artifacts);

  // ============================================================================
  // PHASE 6: SDK DEPRECATION WARNINGS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing SDK deprecation warnings');

  const sdkWarnings = await ctx.task(sdkDeprecationWarningsTask, {
    projectName,
    deprecationProcess,
    outputDir
  });

  artifacts.push(...sdkWarnings.artifacts);

  // ============================================================================
  // PHASE 7: AUTOMATED MIGRATION TOOLS
  // ============================================================================

  if (migrationSupport) {
    ctx.log('info', 'Phase 7: Creating automated migration tools');

    const migrationTools = await ctx.task(migrationToolsTask, {
      projectName,
      deprecationProcess,
      outputDir
    });

    artifacts.push(...migrationTools.artifacts);
  }

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating compatibility documentation');

  const documentation = await ctx.task(compatibilityDocumentationTask, {
    projectName,
    compatibilityPolicy,
    deprecationProcess,
    breakingChangeProcess,
    sdkWarnings,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    compatibilityPolicy: compatibilityPolicy.policy,
    deprecationProcess: deprecationProcess.process,
    migrationGuides: migrationSupport ? [] : null,
    breakingChangeProcess: breakingChangeProcess.process,
    sdkWarnings: sdkWarnings.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/backward-compatibility-management',
      timestamp: startTime,
      compatibilityLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const compatibilityPolicyTask = defineTask('compatibility-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Compatibility Policy - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Define compatibility guarantees',
      context: {
        projectName: args.projectName,
        compatibilityLevel: args.compatibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define compatibility guarantee levels',
        '2. Establish what constitutes breaking change',
        '3. Define additive change guidelines',
        '4. Establish behavioral compatibility rules',
        '5. Define type compatibility rules',
        '6. Establish serialization compatibility',
        '7. Define authentication compatibility',
        '8. Establish error response compatibility',
        '9. Define configuration compatibility',
        '10. Generate compatibility policy document'
      ],
      outputFormat: 'JSON with compatibility policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'guarantees', 'artifacts'],
      properties: {
        policy: { type: 'object' },
        guarantees: { type: 'array', items: { type: 'object' } },
        breakingChangeDefinition: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'policy']
}));

export const deprecationProcessTask = defineTask('deprecation-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Deprecation Process - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Implement deprecation warning system',
      context: {
        projectName: args.projectName,
        deprecationPolicy: args.deprecationPolicy,
        compatibilityPolicy: args.compatibilityPolicy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define deprecation announcement process',
        '2. Design deprecation timeline',
        '3. Create deprecation annotation system',
        '4. Design documentation deprecation notices',
        '5. Create API response deprecation headers',
        '6. Design changelog deprecation entries',
        '7. Create deprecation tracking system',
        '8. Design customer notification process',
        '9. Create deprecation metrics',
        '10. Generate deprecation process document'
      ],
      outputFormat: 'JSON with deprecation process'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'timeline', 'artifacts'],
      properties: {
        process: { type: 'object' },
        timeline: { type: 'object' },
        notifications: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'deprecation']
}));

export const migrationPathsTask = defineTask('migration-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Migration Paths - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create migration path documentation',
      context: {
        projectName: args.projectName,
        deprecationProcess: args.deprecationProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design migration guide template',
        '2. Create before/after code examples',
        '3. Document deprecated to replacement mapping',
        '4. Create step-by-step migration instructions',
        '5. Document breaking change workarounds',
        '6. Create compatibility shim documentation',
        '7. Design migration testing guide',
        '8. Create rollback instructions',
        '9. Document known issues',
        '10. Generate migration path templates'
      ],
      outputFormat: 'JSON with migration path documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'guides', 'artifacts'],
      properties: {
        templates: { type: 'array', items: { type: 'object' } },
        guides: { type: 'array', items: { type: 'object' } },
        mappings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'migration']
}));

export const compatibilityVerificationTask = defineTask('compatibility-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Compatibility Verification - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'QA Engineer',
      task: 'Build compatibility verification tests',
      context: {
        projectName: args.projectName,
        compatibilityPolicy: args.compatibilityPolicy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create API signature compatibility tests',
        '2. Build behavioral compatibility tests',
        '3. Create serialization compatibility tests',
        '4. Build error response compatibility tests',
        '5. Create authentication compatibility tests',
        '6. Build configuration compatibility tests',
        '7. Create performance compatibility tests',
        '8. Build integration compatibility tests',
        '9. Configure CI/CD integration',
        '10. Generate compatibility test suite'
      ],
      outputFormat: 'JSON with compatibility verification config'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'config', 'artifacts'],
      properties: {
        tests: { type: 'array', items: { type: 'object' } },
        config: { type: 'object' },
        cicdIntegration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'verification']
}));

export const breakingChangeProcessTask = defineTask('breaking-change-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Breaking Change Process - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Define breaking change management',
      context: {
        projectName: args.projectName,
        compatibilityPolicy: args.compatibilityPolicy,
        deprecationProcess: args.deprecationProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define breaking change approval process',
        '2. Create impact assessment template',
        '3. Design customer communication plan',
        '4. Create migration support plan',
        '5. Design extended support period',
        '6. Create breaking change testing',
        '7. Design rollout strategy',
        '8. Create monitoring plan',
        '9. Design feedback collection',
        '10. Generate breaking change process'
      ],
      outputFormat: 'JSON with breaking change process'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'approvalWorkflow', 'artifacts'],
      properties: {
        process: { type: 'object' },
        approvalWorkflow: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'breaking-changes']
}));

export const sdkDeprecationWarningsTask = defineTask('sdk-deprecation-warnings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: SDK Deprecation Warnings - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Engineer',
      task: 'Implement SDK deprecation warnings',
      context: {
        projectName: args.projectName,
        deprecationProcess: args.deprecationProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design deprecation annotation system',
        '2. Implement compile-time warnings',
        '3. Create runtime deprecation logging',
        '4. Design IDE integration',
        '5. Create deprecation documentation links',
        '6. Implement migration hints',
        '7. Create deprecation telemetry',
        '8. Design warning suppression',
        '9. Create deprecation testing',
        '10. Generate SDK warning configuration'
      ],
      outputFormat: 'JSON with SDK deprecation warning config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'implementation', 'artifacts'],
      properties: {
        config: { type: 'object' },
        implementation: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'deprecation-warnings']
}));

export const migrationToolsTask = defineTask('migration-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Migration Tools - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Tools Engineer',
      task: 'Create automated migration tools',
      context: {
        projectName: args.projectName,
        deprecationProcess: args.deprecationProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design codemod scripts',
        '2. Create AST transformation tools',
        '3. Build configuration migration',
        '4. Create dependency update tools',
        '5. Design validation scripts',
        '6. Create dry-run mode',
        '7. Build rollback support',
        '8. Create progress reporting',
        '9. Design CI/CD integration',
        '10. Generate migration tool suite'
      ],
      outputFormat: 'JSON with migration tools configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'codemods', 'artifacts'],
      properties: {
        tools: { type: 'array', items: { type: 'object' } },
        codemods: { type: 'array', items: { type: 'object' } },
        scripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'migration-tools']
}));

export const compatibilityDocumentationTask = defineTask('compatibility-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Compatibility Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate compatibility documentation',
      context: {
        projectName: args.projectName,
        compatibilityPolicy: args.compatibilityPolicy,
        deprecationProcess: args.deprecationProcess,
        breakingChangeProcess: args.breakingChangeProcess,
        sdkWarnings: args.sdkWarnings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create compatibility policy guide',
        '2. Document deprecation process',
        '3. Write breaking change policy',
        '4. Create migration guide template',
        '5. Document SDK warning handling',
        '6. Write compatibility FAQ',
        '7. Create version support matrix',
        '8. Document upgrade paths',
        '9. Write troubleshooting guide',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            policy: { type: 'string' },
            deprecation: { type: 'string' },
            migration: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'backward-compatibility', 'documentation']
}));
