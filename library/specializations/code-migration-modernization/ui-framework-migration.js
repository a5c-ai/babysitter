/**
 * @process specializations/code-migration-modernization/ui-framework-migration
 * @description UI Framework Migration - Process for migrating frontend applications between UI
 * frameworks (e.g., jQuery to React, AngularJS to Angular, legacy to modern frameworks) with
 * component-by-component approach.
 * @inputs { projectName: string, currentFramework?: object, targetFramework?: string, componentInventory?: array }
 * @outputs { success: boolean, migrationAnalysis: object, migratedComponents: array, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/ui-framework-migration', {
 *   projectName: 'jQuery to React Migration',
 *   currentFramework: { name: 'jQuery', version: '3.6' },
 *   targetFramework: 'React',
 *   componentInventory: ['header', 'navigation', 'dashboard', 'forms']
 * });
 *
 * @references
 * - React Migration: https://reactjs.org/docs/thinking-in-react.html
 * - Vue Migration: https://vuejs.org/guide/introduction.html
 * - Angular Upgrade Guide: https://angular.io/guide/upgrade
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentFramework = {},
    targetFramework = '',
    componentInventory = [],
    outputDir = 'ui-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UI Framework Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: COMPONENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing components');
  const componentAnalysis = await ctx.task(componentAnalysisTask, {
    projectName,
    currentFramework,
    componentInventory,
    outputDir
  });

  artifacts.push(...componentAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: MIGRATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Planning migration');
  const migrationPlan = await ctx.task(uiMigrationPlanningTask, {
    projectName,
    componentAnalysis,
    targetFramework,
    outputDir
  });

  artifacts.push(...migrationPlan.artifacts);

  // Breakpoint: Migration plan review
  await ctx.breakpoint({
    question: `Migration plan ready for ${projectName}. Components: ${componentAnalysis.totalComponents}. Migration order defined. Estimated effort: ${migrationPlan.estimatedEffort}. Approve plan?`,
    title: 'UI Migration Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      migrationPlan,
      recommendation: 'Review component dependencies before starting'
    }
  });

  // ============================================================================
  // PHASE 3: SCAFFOLD SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up new framework scaffold');
  const scaffoldSetup = await ctx.task(scaffoldSetupTask, {
    projectName,
    targetFramework,
    outputDir
  });

  artifacts.push(...scaffoldSetup.artifacts);

  // ============================================================================
  // PHASE 4: COMPONENT MIGRATION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 4: Migrating components');
  const componentMigration = await ctx.task(componentMigrationTask, {
    projectName,
    migrationPlan,
    scaffoldSetup,
    outputDir
  });

  artifacts.push(...componentMigration.artifacts);

  // ============================================================================
  // PHASE 5: STATE MANAGEMENT MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Migrating state management');
  const stateMigration = await ctx.task(stateManagementMigrationTask, {
    projectName,
    componentMigration,
    targetFramework,
    outputDir
  });

  artifacts.push(...stateMigration.artifacts);

  // ============================================================================
  // PHASE 6: STYLING MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Migrating styles');
  const stylingMigration = await ctx.task(stylingMigrationTask, {
    projectName,
    componentMigration,
    targetFramework,
    outputDir
  });

  artifacts.push(...stylingMigration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing migrated UI');
  const testing = await ctx.task(uiTestingTask, {
    projectName,
    componentMigration,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `UI framework migration complete for ${projectName}. Components migrated: ${componentMigration.migratedCount}. Tests passing: ${testing.allPassed}. Approve?`,
    title: 'UI Framework Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: currentFramework.name,
        to: targetFramework,
        componentsMigrated: componentMigration.migratedCount,
        testsPass: testing.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    migrationAnalysis: componentAnalysis,
    migratedComponents: componentMigration.migratedComponents,
    stateMigration,
    stylingMigration,
    testResults: {
      allPassed: testing.allPassed,
      passed: testing.passedCount,
      failed: testing.failedCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/ui-framework-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const componentAnalysisTask = defineTask('component-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Component Analysis - ${args.projectName}`,
  agent: {
    name: 'ui-analyst',
    prompt: {
      role: 'Frontend Architect',
      task: 'Analyze UI components for migration',
      context: args,
      instructions: [
        '1. Inventory all components',
        '2. Map component hierarchy',
        '3. Identify dependencies',
        '4. Assess complexity',
        '5. Document state usage',
        '6. Map event handlers',
        '7. Identify shared code',
        '8. Document styling approach',
        '9. Assess test coverage',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with totalComponents, components, hierarchy, complexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalComponents', 'components', 'artifacts'],
      properties: {
        totalComponents: { type: 'number' },
        components: { type: 'array', items: { type: 'object' } },
        hierarchy: { type: 'object' },
        complexity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'analysis', 'components']
}));

export const uiMigrationPlanningTask = defineTask('ui-migration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: UI Migration Planning - ${args.projectName}`,
  agent: {
    name: 'migration-planner',
    prompt: {
      role: 'Frontend Lead',
      task: 'Plan UI migration',
      context: args,
      instructions: [
        '1. Define migration order',
        '2. Plan strangler approach',
        '3. Identify quick wins',
        '4. Plan shared components first',
        '5. Schedule complex components',
        '6. Plan testing strategy',
        '7. Estimate effort',
        '8. Plan rollback',
        '9. Define milestones',
        '10. Generate migration plan'
      ],
      outputFormat: 'JSON with migrationOrder, phases, estimatedEffort, milestones, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationOrder', 'phases', 'estimatedEffort', 'artifacts'],
      properties: {
        migrationOrder: { type: 'array', items: { type: 'string' } },
        phases: { type: 'array', items: { type: 'object' } },
        estimatedEffort: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'planning', 'strategy']
}));

export const scaffoldSetupTask = defineTask('scaffold-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Scaffold Setup - ${args.projectName}`,
  agent: {
    name: 'frontend-developer',
    prompt: {
      role: 'Frontend Developer',
      task: 'Set up new framework scaffold',
      context: args,
      instructions: [
        '1. Initialize new project',
        '2. Configure build tools',
        '3. Set up linting',
        '4. Configure testing',
        '5. Set up component library',
        '6. Configure routing',
        '7. Set up state management',
        '8. Configure styling',
        '9. Set up coexistence',
        '10. Document setup'
      ],
      outputFormat: 'JSON with scaffoldReady, buildConfigured, testingConfigured, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scaffoldReady', 'buildConfigured', 'artifacts'],
      properties: {
        scaffoldReady: { type: 'boolean' },
        buildConfigured: { type: 'boolean' },
        testingConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'scaffold', 'setup']
}));

export const componentMigrationTask = defineTask('component-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Component Migration - ${args.projectName}`,
  agent: {
    name: 'component-developer',
    prompt: {
      role: 'Frontend Developer',
      task: 'Migrate UI components',
      context: args,
      instructions: [
        '1. Migrate component by component',
        '2. Convert markup',
        '3. Migrate event handlers',
        '4. Migrate state',
        '5. Update props/inputs',
        '6. Write unit tests',
        '7. Test visual parity',
        '8. Integrate with routing',
        '9. Track progress',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with migratedCount, migratedComponents, pendingComponents, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedCount', 'migratedComponents', 'artifacts'],
      properties: {
        migratedCount: { type: 'number' },
        migratedComponents: { type: 'array', items: { type: 'object' } },
        pendingComponents: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'components', 'implementation']
}));

export const stateManagementMigrationTask = defineTask('state-management-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: State Management Migration - ${args.projectName}`,
  agent: {
    name: 'state-developer',
    prompt: {
      role: 'Frontend Developer',
      task: 'Migrate state management',
      context: args,
      instructions: [
        '1. Analyze current state',
        '2. Design new state structure',
        '3. Migrate global state',
        '4. Migrate local state',
        '5. Implement actions',
        '6. Connect components',
        '7. Test state flows',
        '8. Validate data binding',
        '9. Document patterns',
        '10. Generate state report'
      ],
      outputFormat: 'JSON with stateLibrary, globalStateMigrated, localStateMigrated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stateLibrary', 'globalStateMigrated', 'artifacts'],
      properties: {
        stateLibrary: { type: 'string' },
        globalStateMigrated: { type: 'boolean' },
        localStateMigrated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'state', 'management']
}));

export const stylingMigrationTask = defineTask('styling-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Styling Migration - ${args.projectName}`,
  agent: {
    name: 'style-developer',
    prompt: {
      role: 'Frontend Developer',
      task: 'Migrate styles',
      context: args,
      instructions: [
        '1. Convert CSS approach',
        '2. Migrate to CSS modules/styled',
        '3. Convert class names',
        '4. Migrate themes',
        '5. Handle responsive styles',
        '6. Migrate animations',
        '7. Update design tokens',
        '8. Test visual parity',
        '9. Optimize bundle size',
        '10. Generate style report'
      ],
      outputFormat: 'JSON with stylingApproach, themesMigrated, visualParity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stylingApproach', 'visualParity', 'artifacts'],
      properties: {
        stylingApproach: { type: 'string' },
        themesMigrated: { type: 'boolean' },
        visualParity: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'styling', 'css']
}));

export const uiTestingTask = defineTask('ui-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: UI Testing - ${args.projectName}`,
  agent: {
    name: 'ui-tester',
    prompt: {
      role: 'QA Engineer',
      task: 'Test migrated UI',
      context: args,
      instructions: [
        '1. Run unit tests',
        '2. Run integration tests',
        '3. Run E2E tests',
        '4. Test visual regression',
        '5. Test accessibility',
        '6. Test responsiveness',
        '7. Test performance',
        '8. Test cross-browser',
        '9. Fix failures',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, visualRegressions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        visualRegressions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui-migration', 'testing', 'validation']
}));
