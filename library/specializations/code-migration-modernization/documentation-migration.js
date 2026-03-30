/**
 * @process specializations/code-migration-modernization/documentation-migration
 * @description Documentation Migration - Process for migrating technical documentation from legacy
 * formats to modern documentation platforms (docs-as-code, wikis) with proper versioning and
 * automated generation from source code.
 * @inputs { projectName: string, currentDocs?: object, targetPlatform?: string, sourceCode?: object }
 * @outputs { success: boolean, docInventory: object, migratedDocs: array, automatedDocs: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/documentation-migration', {
 *   projectName: 'Documentation Modernization',
 *   currentDocs: { format: 'Word', location: '/docs/legacy' },
 *   targetPlatform: 'MkDocs',
 *   sourceCode: { language: 'Python', path: '/src' }
 * });
 *
 * @references
 * - Docs as Code: https://www.writethedocs.org/guide/docs-as-code/
 * - MkDocs: https://www.mkdocs.org/
 * - Docusaurus: https://docusaurus.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentDocs = {},
    targetPlatform = 'MkDocs',
    sourceCode = {},
    outputDir = 'doc-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Documentation Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating documentation inventory');
  const docInventory = await ctx.task(documentationInventoryTask, {
    projectName,
    currentDocs,
    outputDir
  });

  artifacts.push(...docInventory.artifacts);

  // ============================================================================
  // PHASE 2: CONTENT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing content quality');
  const contentAssessment = await ctx.task(contentAssessmentTask, {
    projectName,
    docInventory,
    outputDir
  });

  artifacts.push(...contentAssessment.artifacts);

  // Breakpoint: Assessment review
  await ctx.breakpoint({
    question: `Documentation assessment complete for ${projectName}. Documents: ${docInventory.totalDocs}. Outdated: ${contentAssessment.outdatedCount}. Proceed with migration?`,
    title: 'Documentation Assessment Review',
    context: {
      runId: ctx.runId,
      projectName,
      docInventory,
      contentAssessment,
      recommendation: 'Review outdated content before migration'
    }
  });

  // ============================================================================
  // PHASE 3: PLATFORM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up documentation platform');
  const platformSetup = await ctx.task(docPlatformSetupTask, {
    projectName,
    targetPlatform,
    outputDir
  });

  artifacts.push(...platformSetup.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Migrating content');
  const contentMigration = await ctx.task(contentMigrationTask, {
    projectName,
    docInventory,
    platformSetup,
    outputDir
  });

  artifacts.push(...contentMigration.artifacts);

  // ============================================================================
  // PHASE 5: AUTOMATED DOC GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up automated doc generation');
  const automatedDocs = await ctx.task(automatedDocGenerationTask, {
    projectName,
    sourceCode,
    platformSetup,
    outputDir
  });

  artifacts.push(...automatedDocs.artifacts);

  // ============================================================================
  // PHASE 6: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating documentation');
  const validation = await ctx.task(documentationValidationTask, {
    projectName,
    contentMigration,
    automatedDocs,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Documentation migration complete for ${projectName}. Migrated: ${contentMigration.migratedCount}. Automated: ${automatedDocs.generatedCount}. Validation: ${validation.allValid ? 'passed' : 'failed'}. Approve?`,
    title: 'Documentation Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        platform: targetPlatform,
        migrated: contentMigration.migratedCount,
        automated: automatedDocs.generatedCount,
        validationPassed: validation.allValid
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    docInventory,
    migratedDocs: contentMigration.migratedDocs,
    automatedDocs,
    validation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/documentation-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentationInventoryTask = defineTask('documentation-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Documentation Inventory - ${args.projectName}`,
  agent: {
    name: 'doc-analyst',
    prompt: {
      role: 'Technical Writer',
      task: 'Create documentation inventory',
      context: args,
      instructions: [
        '1. Catalog all documents',
        '2. Identify document types',
        '3. Map document hierarchy',
        '4. Identify formats',
        '5. Find embedded media',
        '6. Identify cross-references',
        '7. Note versioning',
        '8. Identify owners',
        '9. Count total documents',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalDocs, documents, byType, byFormat, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDocs', 'documents', 'artifacts'],
      properties: {
        totalDocs: { type: 'number' },
        documents: { type: 'array', items: { type: 'object' } },
        byType: { type: 'object' },
        byFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'inventory', 'analysis']
}));

export const contentAssessmentTask = defineTask('content-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Content Assessment - ${args.projectName}`,
  agent: {
    name: 'content-analyst',
    prompt: {
      role: 'Content Strategist',
      task: 'Assess documentation quality',
      context: args,
      instructions: [
        '1. Assess content accuracy',
        '2. Identify outdated content',
        '3. Check for duplicates',
        '4. Assess completeness',
        '5. Review consistency',
        '6. Check accessibility',
        '7. Identify gaps',
        '8. Prioritize updates',
        '9. Recommend improvements',
        '10. Generate assessment report'
      ],
      outputFormat: 'JSON with outdatedCount, duplicates, gaps, qualityScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outdatedCount', 'qualityScore', 'artifacts'],
      properties: {
        outdatedCount: { type: 'number' },
        duplicates: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        qualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'assessment', 'quality']
}));

export const docPlatformSetupTask = defineTask('doc-platform-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Platform Setup - ${args.projectName}`,
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Documentation Engineer',
      task: 'Set up documentation platform',
      context: args,
      instructions: [
        '1. Initialize platform',
        '2. Configure theme',
        '3. Set up navigation',
        '4. Configure search',
        '5. Set up versioning',
        '6. Configure CI/CD',
        '7. Set up hosting',
        '8. Configure analytics',
        '9. Test platform',
        '10. Document setup'
      ],
      outputFormat: 'JSON with platformReady, features, hosting, cicd, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['platformReady', 'features', 'artifacts'],
      properties: {
        platformReady: { type: 'boolean' },
        features: { type: 'array', items: { type: 'string' } },
        hosting: { type: 'object' },
        cicd: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'platform', 'setup']
}));

export const contentMigrationTask = defineTask('content-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Content Migration - ${args.projectName}`,
  agent: {
    name: 'content-migrator',
    prompt: {
      role: 'Technical Writer',
      task: 'Migrate documentation content',
      context: args,
      instructions: [
        '1. Convert formats',
        '2. Migrate to Markdown',
        '3. Update cross-references',
        '4. Migrate images',
        '5. Update code snippets',
        '6. Fix formatting',
        '7. Apply templates',
        '8. Add metadata',
        '9. Organize structure',
        '10. Track progress'
      ],
      outputFormat: 'JSON with migratedCount, migratedDocs, pendingDocs, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedCount', 'migratedDocs', 'artifacts'],
      properties: {
        migratedCount: { type: 'number' },
        migratedDocs: { type: 'array', items: { type: 'object' } },
        pendingDocs: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'content', 'migration']
}));

export const automatedDocGenerationTask = defineTask('automated-doc-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Automated Doc Generation - ${args.projectName}`,
  agent: {
    name: 'doc-automation-engineer',
    prompt: {
      role: 'Documentation Engineer',
      task: 'Set up automated doc generation',
      context: args,
      instructions: [
        '1. Configure doc generators',
        '2. Set up API doc generation',
        '3. Configure code doc extraction',
        '4. Set up schema docs',
        '5. Configure changelog generation',
        '6. Set up CI integration',
        '7. Configure versioning',
        '8. Test generation',
        '9. Review output',
        '10. Document automation'
      ],
      outputFormat: 'JSON with generatedCount, generators, apiDocs, codeDocs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['generatedCount', 'generators', 'artifacts'],
      properties: {
        generatedCount: { type: 'number' },
        generators: { type: 'array', items: { type: 'string' } },
        apiDocs: { type: 'boolean' },
        codeDocs: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'automation', 'generation']
}));

export const documentationValidationTask = defineTask('documentation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Documentation Validation - ${args.projectName}`,
  agent: {
    name: 'doc-validator',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate migrated documentation',
      context: args,
      instructions: [
        '1. Check all links',
        '2. Validate images',
        '3. Test code samples',
        '4. Verify navigation',
        '5. Check formatting',
        '6. Test search',
        '7. Verify versioning',
        '8. Check accessibility',
        '9. Review completeness',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allValid, brokenLinks, validationResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allValid', 'brokenLinks', 'artifacts'],
      properties: {
        allValid: { type: 'boolean' },
        brokenLinks: { type: 'array', items: { type: 'string' } },
        validationResults: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['doc-migration', 'validation', 'testing']
}));
