/**
 * @process methodologies/maestro/maestro-maintenance
 * @description Maestro Maintenance - Technical debt management: branch cleanup, knowledge sync, doc verification, TODO scanning, test coverage suggestions
 * @inputs { projectRoot?: string, qualityThreshold?: number, skipCleanup?: boolean, focusAreas?: array }
 * @outputs { success: boolean, branchCleanup: object, knowledgeSync: object, docVerification: object, todoScan: object, coverageSuggestions: array, healthScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const branchCleanupTask = defineTask('maestro-maint-branch-cleanup', async (args, _ctx) => {
  return { cleanup: args };
}, {
  kind: 'agent',
  title: 'Maintenance Engineer: Clean Up Stale Branches',
  labels: ['maestro', 'maintenance', 'branches'],
  io: {
    inputs: { projectRoot: 'string', maxStaleDays: 'number', protectedBranches: 'array' },
    outputs: { staleBranches: 'array', deletedBranches: 'array', mergedBranches: 'array', orphanedBranches: 'array', branchHealthScore: 'number' }
  }
});

const knowledgeSyncTask = defineTask('maestro-maint-knowledge-sync', async (args, _ctx) => {
  return { sync: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Synchronize Knowledge Graph',
  labels: ['maestro', 'maintenance', 'knowledge'],
  io: {
    inputs: { projectRoot: 'string', knowledgeGraphPath: 'string', codebaseState: 'object' },
    outputs: { staleEntries: 'array', updatedEntries: 'array', newPatterns: 'array', conflictingDecisions: 'array', syncHealthScore: 'number' }
  }
});

const docVerificationTask = defineTask('maestro-maint-doc-verify', async (args, _ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Maintenance Engineer: Verify Documentation Accuracy',
  labels: ['maestro', 'maintenance', 'documentation'],
  io: {
    inputs: { projectRoot: 'string', docPaths: 'array', codebaseMap: 'object' },
    outputs: { outdatedDocs: 'array', missingDocs: 'array', brokenLinks: 'array', inaccuracies: 'array', docHealthScore: 'number' }
  }
});

const todoScanTask = defineTask('maestro-maint-todo-scan', async (args, _ctx) => {
  return { scan: args };
}, {
  kind: 'agent',
  title: 'Maintenance Engineer: Scan TODOs, FIXMEs, HACKs',
  labels: ['maestro', 'maintenance', 'todos'],
  io: {
    inputs: { projectRoot: 'string', patterns: 'array', excludePaths: 'array' },
    outputs: { todos: 'array', fixmes: 'array', hacks: 'array', techDebtItems: 'array', prioritizedBacklog: 'array', todoHealthScore: 'number' }
  }
});

const testCoverageAnalysisTask = defineTask('maestro-maint-coverage', async (args, _ctx) => {
  return { coverage: args };
}, {
  kind: 'agent',
  title: 'Test Engineer: Analyze Test Coverage Gaps',
  labels: ['maestro', 'maintenance', 'coverage'],
  io: {
    inputs: { projectRoot: 'string', coverageReport: 'object', criticalPaths: 'array' },
    outputs: { coverageGaps: 'array', suggestions: 'array', uncoveredCriticalPaths: 'array', coveragePercentage: 'number', coverageHealthScore: 'number' }
  }
});

const dependencyAuditTask = defineTask('maestro-maint-dep-audit', async (args, _ctx) => {
  return { audit: args };
}, {
  kind: 'agent',
  title: 'Maintenance Engineer: Audit Dependencies',
  labels: ['maestro', 'maintenance', 'dependencies'],
  io: {
    inputs: { projectRoot: 'string', packageManager: 'string' },
    outputs: { outdatedDeps: 'array', vulnerabilities: 'array', unusedDeps: 'array', updateRecommendations: 'array', depHealthScore: 'number' }
  }
});

const generateMaintenanceReportTask = defineTask('maestro-maint-report', async (args, _ctx) => {
  return { report: args };
}, {
  kind: 'agent',
  title: 'Generate Comprehensive Maintenance Report',
  labels: ['maestro', 'maintenance', 'report'],
  io: {
    inputs: { branchCleanup: 'object', knowledgeSync: 'object', docVerification: 'object', todoScan: 'object', coverageAnalysis: 'object', depAudit: 'object' },
    outputs: { healthScore: 'number', criticalItems: 'array', recommendations: 'array', techDebtTrend: 'string', nextMaintenanceDate: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro Maintenance Process
 *
 * Technical debt management triggered after every N specs (configurable).
 * Runs comprehensive health checks across the codebase.
 *
 * Maintenance Areas:
 * 1. Branch cleanup - Delete stale/merged branches
 * 2. Knowledge graph sync - Validate and update patterns
 * 3. Documentation verification - Check accuracy and completeness
 * 4. TODO/FIXME scan - Identify and prioritize tech debt
 * 5. Test coverage analysis - Find gaps, suggest tests
 * 6. Dependency audit - Security, outdated, unused packages
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRoot - Project root (default: '.')
 * @param {number} inputs.qualityThreshold - Min health score (default: 70)
 * @param {boolean} inputs.skipCleanup - Skip destructive cleanup (default: false)
 * @param {Array} inputs.focusAreas - Limit to specific areas (default: all)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Maintenance results
 */
export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    qualityThreshold = 70,
    skipCleanup = false,
    focusAreas = ['branches', 'knowledge', 'docs', 'todos', 'coverage', 'dependencies']
  } = inputs;

  ctx.log('Maestro Maintenance: Starting technical debt management', { focusAreas });

  // ============================================================================
  // PARALLEL SCANS
  // ============================================================================

  ctx.log('Running parallel maintenance scans');

  const parallelTasks = [];
  const taskLabels = [];

  if (focusAreas.includes('branches') && !skipCleanup) {
    parallelTasks.push(ctx.task(branchCleanupTask, {
      projectRoot,
      maxStaleDays: 30,
      protectedBranches: ['main', 'master', 'develop', 'staging']
    }));
    taskLabels.push('branches');
  }

  if (focusAreas.includes('knowledge')) {
    parallelTasks.push(ctx.task(knowledgeSyncTask, {
      projectRoot,
      knowledgeGraphPath: '.maestro/knowledge.dot',
      codebaseState: {}
    }));
    taskLabels.push('knowledge');
  }

  if (focusAreas.includes('docs')) {
    parallelTasks.push(ctx.task(docVerificationTask, {
      projectRoot,
      docPaths: ['README.md', 'docs/', 'CHANGELOG.md'],
      codebaseMap: {}
    }));
    taskLabels.push('docs');
  }

  if (focusAreas.includes('todos')) {
    parallelTasks.push(ctx.task(todoScanTask, {
      projectRoot,
      patterns: ['TODO', 'FIXME', 'HACK', 'XXX', 'WORKAROUND'],
      excludePaths: ['node_modules', 'dist', '.git', 'vendor']
    }));
    taskLabels.push('todos');
  }

  if (focusAreas.includes('coverage')) {
    parallelTasks.push(ctx.task(testCoverageAnalysisTask, {
      projectRoot,
      coverageReport: {},
      criticalPaths: []
    }));
    taskLabels.push('coverage');
  }

  if (focusAreas.includes('dependencies')) {
    parallelTasks.push(ctx.task(dependencyAuditTask, {
      projectRoot,
      packageManager: 'npm'
    }));
    taskLabels.push('dependencies');
  }

  const results = await ctx.parallel.all(parallelTasks);

  // Map results back to labels
  const resultMap = {};
  taskLabels.forEach((label, idx) => {
    resultMap[label] = results[idx];
  });

  // ============================================================================
  // REVIEW CRITICAL FINDINGS
  // ============================================================================

  const criticalFindings = [];

  if (resultMap.branches && resultMap.branches.orphanedBranches?.length > 0) {
    criticalFindings.push(`${resultMap.branches.orphanedBranches.length} orphaned branches`);
  }
  if (resultMap.knowledge && resultMap.knowledge.conflictingDecisions?.length > 0) {
    criticalFindings.push(`${resultMap.knowledge.conflictingDecisions.length} conflicting knowledge entries`);
  }
  if (resultMap.docs && resultMap.docs.inaccuracies?.length > 0) {
    criticalFindings.push(`${resultMap.docs.inaccuracies.length} documentation inaccuracies`);
  }
  if (resultMap.dependencies && resultMap.dependencies.vulnerabilities?.length > 0) {
    criticalFindings.push(`${resultMap.dependencies.vulnerabilities.length} dependency vulnerabilities`);
  }

  if (criticalFindings.length > 0) {
    await ctx.breakpoint({
      question: `Maintenance found ${criticalFindings.length} critical issues: ${criticalFindings.join('; ')}. Review findings and approve remediation plan.`,
      title: 'Maintenance Critical Findings',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // GENERATE REPORT
  // ============================================================================

  ctx.log('Generating maintenance report');

  const report = await ctx.task(generateMaintenanceReportTask, {
    branchCleanup: resultMap.branches || {},
    knowledgeSync: resultMap.knowledge || {},
    docVerification: resultMap.docs || {},
    todoScan: resultMap.todos || {},
    coverageAnalysis: resultMap.coverage || {},
    depAudit: resultMap.dependencies || {}
  });

  if (report.healthScore < qualityThreshold) {
    await ctx.breakpoint({
      question: `Project health score ${report.healthScore}/${qualityThreshold}. ${report.criticalItems.length} critical items require attention. Review report and approve action plan.`,
      title: 'Below Health Threshold',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: true,
    branchCleanup: resultMap.branches || { skipped: true },
    knowledgeSync: resultMap.knowledge || { skipped: true },
    docVerification: resultMap.docs || { skipped: true },
    todoScan: resultMap.todos || { skipped: true },
    coverageSuggestions: resultMap.coverage?.suggestions || [],
    dependencyAudit: resultMap.dependencies || { skipped: true },
    healthScore: report.healthScore,
    criticalItems: report.criticalItems,
    recommendations: report.recommendations,
    techDebtTrend: report.techDebtTrend,
    metadata: {
      processId: 'methodologies/maestro/maestro-maintenance',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      focusAreas,
      timestamp: ctx.now()
    }
  };
}
