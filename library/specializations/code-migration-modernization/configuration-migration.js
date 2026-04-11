/**
 * @process specializations/code-migration-modernization/configuration-migration
 * @description Configuration Migration - Process for migrating application configurations from legacy
 * formats to modern configuration management approaches (environment variables, config servers,
 * feature flags) with proper secret handling.
 * @inputs { projectName: string, currentConfigSources?: array, targetConfigApproach?: string, environments?: array }
 * @outputs { success: boolean, configInventory: object, migrationPlan: object, migratedConfigs: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/configuration-migration', {
 *   projectName: 'Config Modernization',
 *   currentConfigSources: [{ type: 'properties-file', path: 'config.properties' }],
 *   targetConfigApproach: 'environment-variables',
 *   environments: ['dev', 'staging', 'production']
 * });
 *
 * @references
 * - 12-Factor Config: https://12factor.net/config
 * - Spring Cloud Config: https://spring.io/projects/spring-cloud-config
 * - HashiCorp Vault: https://www.vaultproject.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentConfigSources = [],
    targetConfigApproach = 'environment-variables',
    environments = ['dev', 'staging', 'production'],
    outputDir = 'config-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Configuration Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: CONFIG INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating configuration inventory');
  const configInventory = await ctx.task(configInventoryTask, {
    projectName,
    currentConfigSources,
    environments,
    outputDir
  });

  artifacts.push(...configInventory.artifacts);

  // ============================================================================
  // PHASE 2: SECRET IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying secrets');
  const secretIdentification = await ctx.task(secretIdentificationTask, {
    projectName,
    configInventory,
    outputDir
  });

  artifacts.push(...secretIdentification.artifacts);

  // Breakpoint: Secret review
  if (secretIdentification.secretCount > 0) {
    await ctx.breakpoint({
      question: `Found ${secretIdentification.secretCount} secrets in configuration for ${projectName}. Review secret handling plan?`,
      title: 'Secret Identification Review',
      context: {
        runId: ctx.runId,
        projectName,
        secretIdentification,
        recommendation: 'Plan secure handling for all identified secrets'
      }
    });
  }

  // ============================================================================
  // PHASE 3: TARGET DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing target configuration');
  const targetDesign = await ctx.task(targetConfigDesignTask, {
    projectName,
    configInventory,
    secretIdentification,
    targetConfigApproach,
    environments,
    outputDir
  });

  artifacts.push(...targetDesign.artifacts);

  // ============================================================================
  // PHASE 4: CONFIG MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Migrating configurations');
  const configMigration = await ctx.task(configMigrationTask, {
    projectName,
    configInventory,
    targetDesign,
    outputDir
  });

  artifacts.push(...configMigration.artifacts);

  // ============================================================================
  // PHASE 5: SECRET MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Migrating secrets');
  const secretMigration = await ctx.task(secretMigrationTask, {
    projectName,
    secretIdentification,
    targetDesign,
    outputDir
  });

  artifacts.push(...secretMigration.artifacts);

  // ============================================================================
  // PHASE 6: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating configuration');
  const validation = await ctx.task(configValidationTask, {
    projectName,
    configMigration,
    secretMigration,
    environments,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Configuration migration complete for ${projectName}. Configs migrated: ${configMigration.migratedCount}. Secrets migrated: ${secretMigration.migratedCount}. Validation: ${validation.allValid ? 'passed' : 'failed'}. Approve?`,
    title: 'Configuration Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        configs: configMigration.migratedCount,
        secrets: secretMigration.migratedCount,
        validationPassed: validation.allValid
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    configInventory,
    migrationPlan: targetDesign,
    migratedConfigs: configMigration.migratedConfigs,
    secretMigration,
    validation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/configuration-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const configInventoryTask = defineTask('config-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Config Inventory - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Configuration Analyst',
      task: 'Create configuration inventory',
      context: args,
      instructions: [
        '1. Scan all config sources',
        '2. Document all properties',
        '3. Identify environment-specific configs',
        '4. Document default values',
        '5. Map config usage',
        '6. Identify overrides',
        '7. Document dependencies',
        '8. Assess complexity',
        '9. Count total properties',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalCount, properties, byEnvironment, bySource, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'properties', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        properties: { type: 'array', items: { type: 'object' } },
        byEnvironment: { type: 'object' },
        bySource: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'inventory', 'analysis']
}));

export const secretIdentificationTask = defineTask('secret-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Secret Identification - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Analyst',
      task: 'Identify secrets in configuration',
      context: args,
      instructions: [
        '1. Scan for passwords',
        '2. Identify API keys',
        '3. Find connection strings',
        '4. Detect certificates',
        '5. Identify tokens',
        '6. Find encryption keys',
        '7. Categorize by sensitivity',
        '8. Assess exposure risk',
        '9. Plan secure handling',
        '10. Generate secret report'
      ],
      outputFormat: 'JSON with secretCount, secrets, byType, riskAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['secretCount', 'secrets', 'artifacts'],
      properties: {
        secretCount: { type: 'number' },
        secrets: { type: 'array', items: { type: 'object' } },
        byType: { type: 'object' },
        riskAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'secrets', 'security']
}));

export const targetConfigDesignTask = defineTask('target-config-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Target Config Design - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Configuration Architect',
      task: 'Design target configuration approach',
      context: args,
      instructions: [
        '1. Design config structure',
        '2. Plan secret management',
        '3. Design environment handling',
        '4. Plan config server setup',
        '5. Design feature flags',
        '6. Plan naming conventions',
        '7. Design access control',
        '8. Plan versioning',
        '9. Design rotation strategy',
        '10. Generate design document'
      ],
      outputFormat: 'JSON with approach, structure, secretManagement, featureFlags, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'structure', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        structure: { type: 'object' },
        secretManagement: { type: 'object' },
        featureFlags: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'design', 'architecture']
}));

export const configMigrationTask = defineTask('config-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Config Migration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Configuration Engineer',
      task: 'Migrate configurations',
      context: args,
      instructions: [
        '1. Convert config format',
        '2. Apply naming conventions',
        '3. Migrate per environment',
        '4. Update application code',
        '5. Create ConfigMaps',
        '6. Set up config server',
        '7. Validate migration',
        '8. Document changes',
        '9. Track progress',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with migratedCount, migratedConfigs, byEnvironment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedCount', 'migratedConfigs', 'artifacts'],
      properties: {
        migratedCount: { type: 'number' },
        migratedConfigs: { type: 'array', items: { type: 'object' } },
        byEnvironment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'migration', 'implementation']
}));

export const secretMigrationTask = defineTask('secret-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Secret Migration - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Engineer',
      task: 'Migrate secrets securely',
      context: args,
      instructions: [
        '1. Set up secret store',
        '2. Migrate secrets securely',
        '3. Update references',
        '4. Set up rotation',
        '5. Configure access policies',
        '6. Remove plaintext secrets',
        '7. Audit trail setup',
        '8. Test secret access',
        '9. Document procedures',
        '10. Generate secret report'
      ],
      outputFormat: 'JSON with migratedCount, secretStore, rotationSetup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedCount', 'secretStore', 'artifacts'],
      properties: {
        migratedCount: { type: 'number' },
        secretStore: { type: 'string' },
        rotationSetup: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'secrets', 'security']
}));

export const configValidationTask = defineTask('config-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Config Validation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate migrated configuration',
      context: args,
      instructions: [
        '1. Validate all configs load',
        '2. Test secret access',
        '3. Verify environment handling',
        '4. Test application startup',
        '5. Validate feature flags',
        '6. Check for missing configs',
        '7. Test config hot reload',
        '8. Verify security',
        '9. Document results',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allValid, validationResults, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allValid', 'validationResults', 'artifacts'],
      properties: {
        allValid: { type: 'boolean' },
        validationResults: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['config-migration', 'validation', 'testing']
}));
