/**
 * @module library/processes/shared
 * @description Re-exports from all shared composable process components.
 * Import individual components from here rather than from their source files
 * to maintain a stable public surface as the library grows.
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

export { priorAttemptsScannerTask, scanPriorAttempts } from './prior-attempts-scanner.js';
export { completenessGateTask, evaluateCompleteness, checkCompleteness } from './completeness-gate.js';
export { costAggregationTask, aggregateCosts } from './cost-aggregation.js';
export { createTddTriplet, executeTddTriplet } from './tdd-triplet.js';
export { createVisualSmokeTest, executeVisualSmokeTest, playwrightVisualSmokeTask } from './playwright-visual-smoke.js';
export { tsCheckTask, createTsCheck, executeTsCheck } from './ts-check.js';
export { deterministicGateTask, createDeterministicGate, executeDeterministicGate, createGrepCheck, createCompilationGate, createTestSuiteGate, createRuntimeSmokeTest } from './deterministic-quality-gate.js';
export { createForkSync, executeForkSync, createUpstreamSyncCheck, createCompatibilityTestSuite, createApiSurfaceSnapshot, createMigrationHelper } from './fork-contribution-sync.js';
export { createPackageScaffold, executePackageScaffold, createLibraryPackage, createCliPackage, createNextAppPackage, createPluginPackage } from './monorepo-package-scaffold.js';
export { traceRuntimeCallPathsTask, createCallPathTracer } from './runtime-call-tracer.js';
export { cycleAwareVerificationTask, createCycleAwareVerification, createPreflightAnalysis, createPostCycleSurvivalCheck } from './cycle-aware-verification.js';

// Curated-dataset + SQL-tool pattern (generalized from specializations/domains/business/travel):
export { process as sourceDiscoveryProcess, scopeRefinementTask, sourceDiscoveryTask, sourceValidationTask, manifestExportTask } from './source-discovery.js';
export { process as localDbBuildProcess, schemaDesignTask, pythonEtlAuthoringTask, ingestExecutionTask, indexBuildTask, dataValidationTask, schemaDocumentationTask } from './local-db-build.js';
export { process as dbAgentExploreProcess, questionPlanningTask, sqlExplorationTask, findingsSynthesisTask, reportExportTask } from './db-agent-explore.js';

// Subagent scene-setting + N-strikes escalation (generalized from joe-habu/superbabysitter):
export { buildSceneContext, appendToManifest } from './scene-context-builder.js';
export { nStrikesEscalation } from './n-strikes-escalation.js';

