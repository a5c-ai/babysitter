/**
 * @process specializations/desktop-development/desktop-migration
 * @description Desktop Application Migration Strategy - Plan and execute migration from legacy desktop frameworks
 * (WinForms, WPF, MFC) to modern solutions (Electron, Qt, Flutter, MAUI).
 * @inputs { projectName: string, sourceFramework: string, targetFramework: string, migrationScope: string, outputDir?: string }
 * @outputs { success: boolean, migrationPlan: object, phases: array, riskAssessment: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-migration', {
 *   projectName: 'LegacyApp',
 *   sourceFramework: 'WPF',
 *   targetFramework: 'Electron',
 *   migrationScope: 'full'
 * });
 *
 * @references
 * - Migration patterns: https://docs.microsoft.com/en-us/dotnet/architecture/modernize-desktop/
 * - Electron migration: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceFramework = 'WPF',
    targetFramework = 'Electron',
    migrationScope = 'full',
    timeline = '6-months',
    outputDir = 'desktop-migration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop Application Migration: ${projectName}`);
  ctx.log('info', `Migration: ${sourceFramework} -> ${targetFramework}`);

  // Phase 1: Assessment
  const assessment = await ctx.task(migrationAssessmentTask, { projectName, sourceFramework, targetFramework, migrationScope, outputDir });
  artifacts.push(...assessment.artifacts);

  await ctx.breakpoint({
    question: `Migration assessment complete. Complexity: ${assessment.complexity}. Estimated effort: ${assessment.estimatedEffort}. ${assessment.risks.length} risks identified. Review?`,
    title: 'Migration Assessment Review',
    context: { runId: ctx.runId, complexity: assessment.complexity, risks: assessment.risks }
  });

  // Phase 2: Architecture Mapping
  const architectureMapping = await ctx.task(mapArchitectureTask, { projectName, sourceFramework, targetFramework, assessment, outputDir });
  artifacts.push(...architectureMapping.artifacts);

  // Phase 3: Feature Analysis
  const featureAnalysis = await ctx.task(analyzeFeatureMigrationTask, { projectName, sourceFramework, targetFramework, assessment, outputDir });
  artifacts.push(...featureAnalysis.artifacts);

  // Phase 4: Data Migration Plan
  const dataMigration = await ctx.task(planDataMigrationTask, { projectName, sourceFramework, targetFramework, outputDir });
  artifacts.push(...dataMigration.artifacts);

  // Phase 5: Migration Strategy
  const strategy = await ctx.task(defineMigrationStrategyTask, { projectName, sourceFramework, targetFramework, migrationScope, assessment, architectureMapping, featureAnalysis, outputDir });
  artifacts.push(...strategy.artifacts);

  await ctx.breakpoint({
    question: `Migration strategy: ${strategy.approach}. ${strategy.phases.length} phases planned. Total timeline: ${strategy.totalDuration}. Approve strategy?`,
    title: 'Migration Strategy Review',
    context: { runId: ctx.runId, approach: strategy.approach, phases: strategy.phases }
  });

  // Phase 6: Risk Mitigation
  const riskMitigation = await ctx.task(planRiskMitigationTask, { projectName, assessment, strategy, outputDir });
  artifacts.push(...riskMitigation.artifacts);

  // Phase 7: Testing Strategy
  const testingStrategy = await ctx.task(planMigrationTestingTask, { projectName, sourceFramework, targetFramework, featureAnalysis, outputDir });
  artifacts.push(...testingStrategy.artifacts);

  // Phase 8: Migration Plan Documentation
  const documentation = await ctx.task(generateMigrationDocumentationTask, { projectName, sourceFramework, targetFramework, assessment, strategy, riskMitigation, testingStrategy, outputDir });
  artifacts.push(...documentation.artifacts);

  // Phase 9: Validation
  const validation = await ctx.task(validateMigrationPlanTask, { projectName, assessment, strategy, riskMitigation, testingStrategy, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 75;

  return {
    success: validationPassed,
    projectName,
    migrationPlan: {
      source: sourceFramework,
      target: targetFramework,
      scope: migrationScope,
      approach: strategy.approach,
      totalDuration: strategy.totalDuration
    },
    phases: strategy.phases,
    featureMapping: featureAnalysis.featureMap,
    riskAssessment: {
      complexity: assessment.complexity,
      risks: assessment.risks,
      mitigations: riskMitigation.mitigations
    },
    testing: testingStrategy.strategy,
    validation: { score: validation.validationScore, passed: validationPassed },
    documentation: documentation.paths,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/desktop-migration', timestamp: startTime }
  };
}

export const migrationAssessmentTask = defineTask('migration-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migration Assessment - ${args.projectName}`,
  skill: {
    name: 'codebase-analysis-tool',
  },
  agent: {
    name: 'legacy-migration-specialist',
    prompt: { role: 'Migration Assessment Specialist', task: 'Assess migration complexity and risks', context: args, instructions: ['1. Analyze source codebase', '2. Inventory features and components', '3. Assess framework dependencies', '4. Evaluate native code usage', '5. Identify breaking changes', '6. Assess team skills', '7. Estimate effort', '8. Generate assessment report'] },
    outputSchema: { type: 'object', required: ['complexity', 'estimatedEffort', 'risks', 'artifacts'], properties: { complexity: { type: 'string' }, estimatedEffort: { type: 'string' }, risks: { type: 'array' }, dependencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'assessment']
}));

export const mapArchitectureTask = defineTask('map-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Architecture Mapping - ${args.projectName}`,
  agent: {
    name: 'cross-platform-abstraction-architect',
    prompt: { role: 'Architecture Mapping Specialist', task: 'Map source to target architecture', context: args, instructions: ['1. Document source architecture', '2. Define target architecture', '3. Map components', '4. Map patterns (MVVM, MVC)', '5. Map data layers', '6. Map services', '7. Identify gaps', '8. Generate architecture mapping'] },
    outputSchema: { type: 'object', required: ['sourceArch', 'targetArch', 'mapping', 'artifacts'], properties: { sourceArch: { type: 'object' }, targetArch: { type: 'object' }, mapping: { type: 'array' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'architecture']
}));

export const analyzeFeatureMigrationTask = defineTask('analyze-feature-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feature Migration Analysis - ${args.projectName}`,
  agent: {
    name: 'feature-analyst',
    prompt: { role: 'Feature Migration Analyst', task: 'Analyze feature migration paths', context: args, instructions: ['1. Inventory all features', '2. Categorize by complexity', '3. Map to target equivalents', '4. Identify native dependencies', '5. Plan feature rewrites', '6. Identify deprecated features', '7. Prioritize features', '8. Generate feature migration map'] },
    outputSchema: { type: 'object', required: ['featureMap', 'artifacts'], properties: { featureMap: { type: 'array' }, nativeFeatures: { type: 'array' }, rewrites: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'features']
}));

export const planDataMigrationTask = defineTask('plan-data-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Migration Plan - ${args.projectName}`,
  agent: {
    name: 'data-migration-planner',
    prompt: { role: 'Data Migration Planner', task: 'Plan data and storage migration', context: args, instructions: ['1. Inventory data stores', '2. Map storage mechanisms', '3. Plan settings migration', '4. Plan user data migration', '5. Handle database migration', '6. Plan cache migration', '7. Define rollback plan', '8. Generate data migration plan'] },
    outputSchema: { type: 'object', required: ['dataStores', 'migrationPlan', 'artifacts'], properties: { dataStores: { type: 'array' }, migrationPlan: { type: 'object' }, rollbackPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'data']
}));

export const defineMigrationStrategyTask = defineTask('define-migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migration Strategy - ${args.projectName}`,
  skill: {
    name: 'strangler-pattern-planner',
  },
  agent: {
    name: 'legacy-migration-specialist',
    prompt: { role: 'Migration Strategy Specialist', task: 'Define migration strategy and phases', context: args, instructions: ['1. Choose approach (big bang, strangler, parallel)', '2. Define migration phases', '3. Set milestones', '4. Plan resource allocation', '5. Define success criteria', '6. Plan parallel running', '7. Define cutover plan', '8. Generate migration strategy'] },
    outputSchema: { type: 'object', required: ['approach', 'phases', 'totalDuration', 'artifacts'], properties: { approach: { type: 'string' }, phases: { type: 'array' }, totalDuration: { type: 'string' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'strategy']
}));

export const planRiskMitigationTask = defineTask('plan-risk-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Mitigation - ${args.projectName}`,
  agent: {
    name: 'risk-mitigation-planner',
    prompt: { role: 'Risk Mitigation Planner', task: 'Plan risk mitigation strategies', context: args, instructions: ['1. Prioritize risks', '2. Define mitigation strategies', '3. Plan contingencies', '4. Define rollback triggers', '5. Plan training', '6. Define escalation paths', '7. Plan communication', '8. Generate risk mitigation plan'] },
    outputSchema: { type: 'object', required: ['mitigations', 'artifacts'], properties: { mitigations: { type: 'array' }, contingencies: { type: 'array' }, rollbackTriggers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'risk']
}));

export const planMigrationTestingTask = defineTask('plan-migration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migration Testing Strategy - ${args.projectName}`,
  agent: {
    name: 'migration-test-planner',
    prompt: { role: 'Migration Testing Planner', task: 'Plan migration testing strategy', context: args, instructions: ['1. Define test scope', '2. Plan regression testing', '3. Plan performance testing', '4. Plan user acceptance', '5. Define test environments', '6. Plan parallel testing', '7. Define quality gates', '8. Generate testing strategy'] },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, testPhases: { type: 'array' }, qualityGates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'testing']
}));

export const generateMigrationDocumentationTask = defineTask('generate-migration-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migration Documentation - ${args.projectName}`,
  agent: {
    name: 'migration-documenter',
    prompt: { role: 'Migration Documentation Specialist', task: 'Generate migration documentation', context: args, instructions: ['1. Create executive summary', '2. Document migration plan', '3. Create technical guides', '4. Document risk register', '5. Create runbooks', '6. Document rollback procedures', '7. Create training materials', '8. Generate complete documentation'] },
    outputSchema: { type: 'object', required: ['paths', 'artifacts'], properties: { paths: { type: 'object' }, documentCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'documentation']
}));

export const validateMigrationPlanTask = defineTask('validate-migration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Migration Plan - ${args.projectName}`,
  agent: {
    name: 'migration-validator',
    prompt: { role: 'Migration Plan Validator', task: 'Validate migration plan completeness', context: args, instructions: ['1. Verify assessment coverage', '2. Validate strategy feasibility', '3. Check risk coverage', '4. Verify testing plan', '5. Check documentation', '6. Calculate validation score', '7. Identify gaps', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, gaps: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'migration', 'validation']
}));
