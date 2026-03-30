/**
 * @process specializations/game-development/save-system-implementation
 * @description Save System Implementation Process - Design and implement game save/load systems including save file
 * format, cloud saves, auto-save, save migration, and data integrity verification.
 * @inputs { projectName: string, saveType?: string, cloudSaveRequired?: boolean, outputDir?: string }
 * @outputs { success: boolean, saveSystemDoc: string, dataSchema: object, testResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    saveType = 'slot-based',
    cloudSaveRequired = true,
    autoSaveEnabled = true,
    maxSaveSlots = 5,
    outputDir = 'save-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Save System Implementation: ${projectName}`);

  // Phase 1: Save System Design
  const design = await ctx.task(saveSystemDesignTask, { projectName, saveType, maxSaveSlots, outputDir });
  artifacts.push(...design.artifacts);

  // Phase 2: Data Schema Definition
  const schema = await ctx.task(saveSchemaTask, { projectName, design, outputDir });
  artifacts.push(...schema.artifacts);

  // Phase 3: Local Save Implementation
  const localSave = await ctx.task(localSaveTask, { projectName, schema, autoSaveEnabled, outputDir });
  artifacts.push(...localSave.artifacts);

  // Phase 4: Cloud Save Integration
  if (cloudSaveRequired) {
    const cloudSave = await ctx.task(cloudSaveTask, { projectName, schema, outputDir });
    artifacts.push(...cloudSave.artifacts);
  }

  // Phase 5: Save Migration System
  const migration = await ctx.task(saveMigrationTask, { projectName, schema, outputDir });
  artifacts.push(...migration.artifacts);

  // Phase 6: Save System Testing
  const testing = await ctx.task(saveTestingTask, { projectName, localSave, cloudSaveRequired, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Save system implementation complete for ${projectName}. Local saves: OK. Cloud saves: ${cloudSaveRequired ? 'Integrated' : 'N/A'}. Test pass: ${testing.passRate}%. Review?`,
    title: 'Save System Review',
    context: { runId: ctx.runId, design, testing }
  });

  return {
    success: true,
    projectName,
    saveSystemDoc: design.docPath,
    dataSchema: schema.schemaDetails,
    testResults: { passRate: testing.passRate, issues: testing.issues },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/save-system-implementation', timestamp: startTime, outputDir }
  };
}

export const saveSystemDesignTask = defineTask('save-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Save System Design - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Systems Programmer', task: 'Design save system', context: args, instructions: ['1. Define save architecture', '2. Plan save slots', '3. Design auto-save triggers', '4. Document save system'] },
    outputSchema: { type: 'object', required: ['docPath', 'architecture', 'artifacts'], properties: { docPath: { type: 'string' }, architecture: { type: 'object' }, savePoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'design']
}));

export const saveSchemaTask = defineTask('save-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: `Save Schema - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Systems Programmer', task: 'Define save data schema', context: args, instructions: ['1. Define data to save', '2. Create schema structure', '3. Add versioning', '4. Document schema'] },
    outputSchema: { type: 'object', required: ['schemaDetails', 'version', 'artifacts'], properties: { schemaDetails: { type: 'object' }, version: { type: 'string' }, dataCategories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'schema']
}));

export const localSaveTask = defineTask('local-save', (args, taskCtx) => ({
  kind: 'agent',
  title: `Local Save - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Systems Programmer', task: 'Implement local saves', context: args, instructions: ['1. Implement save to disk', '2. Add load functionality', '3. Implement auto-save', '4. Add corruption recovery'] },
    outputSchema: { type: 'object', required: ['implemented', 'features', 'artifacts'], properties: { implemented: { type: 'boolean' }, features: { type: 'array' }, autoSavePoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'local']
}));

export const cloudSaveTask = defineTask('cloud-save', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cloud Save - ${args.projectName}`,
  agent: {
    name: 'backend-engineer-agent',
    prompt: { role: 'Backend Engineer', task: 'Integrate cloud saves', context: args, instructions: ['1. Integrate cloud service', '2. Handle sync conflicts', '3. Add offline support', '4. Test cloud functionality'] },
    outputSchema: { type: 'object', required: ['integrated', 'platforms', 'artifacts'], properties: { integrated: { type: 'boolean' }, platforms: { type: 'array' }, conflictResolution: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'cloud']
}));

export const saveMigrationTask = defineTask('save-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Save Migration - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Systems Programmer', task: 'Implement save migration', context: args, instructions: ['1. Create migration system', '2. Handle version upgrades', '3. Preserve player data', '4. Test migrations'] },
    outputSchema: { type: 'object', required: ['migrationSystem', 'artifacts'], properties: { migrationSystem: { type: 'object' }, supportedVersions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'migration']
}));

export const saveTestingTask = defineTask('save-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Save Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test save system', context: args, instructions: ['1. Test save/load cycle', '2. Test corruption recovery', '3. Test cloud sync', '4. Test migrations'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'save-system', 'testing']
}));
