/**
 * @process specializations/code-migration-modernization/dependency-analysis-updates
 * @description Dependency Analysis and Updates - Systematic process for analyzing, updating, and modernizing
 * application dependencies including libraries, frameworks, and external services with security-first
 * approach and compatibility validation.
 * @inputs { projectName: string, repositoryPath?: string, dependencyManifests?: array, securityPolicy?: object }
 * @outputs { success: boolean, inventory: object, vulnerabilityReport: object, licenseReport: object, updatePlan: object, validationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/dependency-analysis-updates', {
 *   projectName: 'E-Commerce Platform',
 *   repositoryPath: '/path/to/repo',
 *   dependencyManifests: ['package.json', 'pom.xml'],
 *   securityPolicy: { maxCriticalVulnerabilities: 0, maxHighVulnerabilities: 5 }
 * });
 *
 * @references
 * - OWASP Dependency Check: https://owasp.org/www-project-dependency-check/
 * - Snyk: https://snyk.io/
 * - npm audit: https://docs.npmjs.com/cli/v8/commands/npm-audit
 * - Dependabot: https://docs.github.com/en/code-security/dependabot
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryPath = '',
    dependencyManifests = [],
    securityPolicy = { maxCriticalVulnerabilities: 0, maxHighVulnerabilities: 10 },
    autoUpdate = false,
    outputDir = 'dependency-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dependency Analysis and Updates for ${projectName}`);

  // ============================================================================
  // PHASE 1: DEPENDENCY INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Building dependency inventory');
  const dependencyInventory = await ctx.task(dependencyInventoryTask, {
    projectName,
    repositoryPath,
    dependencyManifests,
    outputDir
  });

  artifacts.push(...dependencyInventory.artifacts);

  // ============================================================================
  // PHASE 2: VULNERABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Scanning for vulnerabilities');
  const vulnerabilityAssessment = await ctx.task(vulnerabilityAssessmentTask, {
    projectName,
    inventory: dependencyInventory,
    securityPolicy,
    outputDir
  });

  artifacts.push(...vulnerabilityAssessment.artifacts);

  // Quality Gate: Critical vulnerabilities
  if (vulnerabilityAssessment.criticalCount > securityPolicy.maxCriticalVulnerabilities) {
    await ctx.breakpoint({
      question: `Found ${vulnerabilityAssessment.criticalCount} critical vulnerabilities (policy allows ${securityPolicy.maxCriticalVulnerabilities}). These MUST be addressed. Review vulnerability report and prioritize remediation?`,
      title: 'Critical Security Vulnerabilities',
      context: {
        runId: ctx.runId,
        projectName,
        criticalVulnerabilities: vulnerabilityAssessment.criticalVulnerabilities,
        recommendation: 'Address critical vulnerabilities immediately before proceeding'
      }
    });
  }

  // ============================================================================
  // PHASE 3: OUTDATED DEPENDENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing outdated dependencies');
  const outdatedAnalysis = await ctx.task(outdatedDependencyAnalysisTask, {
    projectName,
    inventory: dependencyInventory,
    outputDir
  });

  artifacts.push(...outdatedAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: LICENSE COMPLIANCE CHECK
  // ============================================================================

  ctx.log('info', 'Phase 4: Checking license compliance');
  const licenseCompliance = await ctx.task(licenseComplianceTask, {
    projectName,
    inventory: dependencyInventory,
    outputDir
  });

  artifacts.push(...licenseCompliance.artifacts);

  // Quality Gate: License compliance
  if (licenseCompliance.hasBlockingIssues) {
    await ctx.breakpoint({
      question: `Found ${licenseCompliance.blockingIssues.length} blocking license issues. These must be resolved before deployment. Review license report?`,
      title: 'License Compliance Issues',
      context: {
        runId: ctx.runId,
        projectName,
        blockingIssues: licenseCompliance.blockingIssues,
        recommendation: 'Replace dependencies with incompatible licenses'
      }
    });
  }

  // ============================================================================
  // PHASE 5: UPDATE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning dependency updates');
  const updatePlan = await ctx.task(updatePlanningTask, {
    projectName,
    inventory: dependencyInventory,
    vulnerabilityAssessment,
    outdatedAnalysis,
    licenseCompliance,
    outputDir
  });

  artifacts.push(...updatePlan.artifacts);

  // Breakpoint: Update plan review
  await ctx.breakpoint({
    question: `Dependency update plan ready for ${projectName}. Total updates: ${updatePlan.totalUpdates}. Breaking changes: ${updatePlan.breakingChanges}. Approve update plan?`,
    title: 'Dependency Update Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      updatePlan,
      recommendation: 'Review breaking changes carefully before proceeding'
    }
  });

  // ============================================================================
  // PHASE 6: EXECUTE UPDATES (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing dependency updates');
  const updateExecution = await ctx.task(executeUpdatesTask, {
    projectName,
    updatePlan,
    autoUpdate,
    outputDir
  });

  artifacts.push(...updateExecution.artifacts);

  // ============================================================================
  // PHASE 7: VALIDATE UPDATES
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating updates');
  const validationReport = await ctx.task(validateUpdatesTask, {
    projectName,
    updateExecution,
    outputDir
  });

  artifacts.push(...validationReport.artifacts);

  // Quality Gate: Validation results
  if (!validationReport.allTestsPassed) {
    await ctx.breakpoint({
      question: `Validation failed for ${validationReport.failedTests} tests after dependency updates. Review failures and determine next steps?`,
      title: 'Update Validation Failed',
      context: {
        runId: ctx.runId,
        projectName,
        failedTests: validationReport.failures,
        recommendation: 'Fix failing tests or rollback problematic updates'
      }
    });
  }

  // ============================================================================
  // PHASE 8: DOCUMENT CHANGES
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting changes');
  const documentation = await ctx.task(documentChangesTask, {
    projectName,
    updateExecution,
    validationReport,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    inventory: {
      totalDependencies: dependencyInventory.totalCount,
      directDependencies: dependencyInventory.directCount,
      transitiveDependencies: dependencyInventory.transitiveCount,
      byType: dependencyInventory.byType
    },
    vulnerabilityReport: {
      criticalCount: vulnerabilityAssessment.criticalCount,
      highCount: vulnerabilityAssessment.highCount,
      mediumCount: vulnerabilityAssessment.mediumCount,
      lowCount: vulnerabilityAssessment.lowCount,
      totalVulnerabilities: vulnerabilityAssessment.totalCount
    },
    licenseReport: {
      compliant: licenseCompliance.compliantCount,
      warnings: licenseCompliance.warningCount,
      blocking: licenseCompliance.blockingCount
    },
    updatePlan: {
      totalUpdates: updatePlan.totalUpdates,
      securityUpdates: updatePlan.securityUpdates,
      breakingChanges: updatePlan.breakingChanges
    },
    updateResults: {
      successful: updateExecution.successfulUpdates,
      failed: updateExecution.failedUpdates,
      skipped: updateExecution.skippedUpdates
    },
    validationReport: {
      allTestsPassed: validationReport.allTestsPassed,
      testsPassed: validationReport.passedTests,
      testsFailed: validationReport.failedTests
    },
    documentationPath: documentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/dependency-analysis-updates',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dependencyInventoryTask = defineTask('dependency-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Dependency Inventory - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'Dependency Analyst',
      task: 'Build comprehensive dependency inventory',
      context: args,
      instructions: [
        '1. Parse all dependency manifest files',
        '2. Extract direct dependencies with versions',
        '3. Resolve and list transitive dependencies',
        '4. Categorize by type (runtime, dev, optional)',
        '5. Identify dependency managers used',
        '6. Document locked versions',
        '7. Map dependency tree',
        '8. Identify duplicate dependencies',
        '9. Calculate dependency metrics',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalCount, directCount, transitiveCount, byType, dependencyTree, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'directCount', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        directCount: { type: 'number' },
        transitiveCount: { type: 'number' },
        byType: { type: 'object' },
        dependencyTree: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'inventory', 'discovery']
}));

export const vulnerabilityAssessmentTask = defineTask('vulnerability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Vulnerability Assessment - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Analyst',
      task: 'Scan dependencies for security vulnerabilities',
      context: args,
      instructions: [
        '1. Run vulnerability scanners (npm audit, Snyk, OWASP)',
        '2. Check against CVE databases',
        '3. Assess severity of each vulnerability',
        '4. Identify exploitability',
        '5. Check for available patches',
        '6. Prioritize by risk score',
        '7. Map affected dependencies',
        '8. Identify transitive vulnerability chains',
        '9. Document remediation options',
        '10. Generate vulnerability report'
      ],
      outputFormat: 'JSON with totalCount, criticalCount, highCount, mediumCount, lowCount, criticalVulnerabilities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'criticalCount', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        mediumCount: { type: 'number' },
        lowCount: { type: 'number' },
        criticalVulnerabilities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'security', 'vulnerability']
}));

export const outdatedDependencyAnalysisTask = defineTask('outdated-dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Outdated Dependency Analysis - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'Dependency Update Analyst',
      task: 'Identify outdated dependencies and available updates',
      context: args,
      instructions: [
        '1. Check for newer versions of all dependencies',
        '2. Review changelogs for breaking changes',
        '3. Identify end-of-life dependencies',
        '4. Assess update urgency',
        '5. Categorize updates (patch, minor, major)',
        '6. Identify dependencies with no updates',
        '7. Check deprecation notices',
        '8. Evaluate alternative packages',
        '9. Calculate staleness score',
        '10. Generate outdated report'
      ],
      outputFormat: 'JSON with outdatedCount, byUpdateType, endOfLife, updateRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outdatedCount', 'byUpdateType', 'artifacts'],
      properties: {
        outdatedCount: { type: 'number' },
        byUpdateType: { type: 'object' },
        endOfLife: { type: 'array', items: { type: 'object' } },
        updateRecommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'updates', 'outdated']
}));

export const licenseComplianceTask = defineTask('license-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: License Compliance - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'License Compliance Analyst',
      task: 'Check license compliance for all dependencies',
      context: args,
      instructions: [
        '1. Identify licenses for all dependencies',
        '2. Check compatibility with project license',
        '3. Flag copyleft licenses if needed',
        '4. Identify unknown or missing licenses',
        '5. Check commercial use restrictions',
        '6. Document attribution requirements',
        '7. Flag viral licenses',
        '8. Identify license conflicts',
        '9. Generate compliance status',
        '10. Create license report'
      ],
      outputFormat: 'JSON with compliantCount, warningCount, blockingCount, hasBlockingIssues, blockingIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliantCount', 'hasBlockingIssues', 'artifacts'],
      properties: {
        compliantCount: { type: 'number' },
        warningCount: { type: 'number' },
        blockingCount: { type: 'number' },
        hasBlockingIssues: { type: 'boolean' },
        blockingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'license', 'compliance']
}));

export const updatePlanningTask = defineTask('update-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Update Planning - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'Dependency Update Planner',
      task: 'Plan dependency update execution',
      context: args,
      instructions: [
        '1. Prioritize updates (security first)',
        '2. Group related updates',
        '3. Plan testing for each batch',
        '4. Identify breaking changes',
        '5. Estimate effort per batch',
        '6. Plan rollback strategy',
        '7. Schedule update windows',
        '8. Document pre-requisites',
        '9. Identify dependencies between updates',
        '10. Create update plan'
      ],
      outputFormat: 'JSON with totalUpdates, securityUpdates, breakingChanges, batches, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalUpdates', 'breakingChanges', 'artifacts'],
      properties: {
        totalUpdates: { type: 'number' },
        securityUpdates: { type: 'number' },
        breakingChanges: { type: 'number' },
        batches: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'planning', 'updates']
}));

export const executeUpdatesTask = defineTask('execute-updates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Execute Updates - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Execute planned dependency updates',
      context: args,
      instructions: [
        '1. Execute updates in planned batches',
        '2. Run automated tests after each batch',
        '3. Check for breaking changes',
        '4. Fix compatibility issues',
        '5. Update lock files',
        '6. Document each update',
        '7. Create commits with clear messages',
        '8. Track success/failure',
        '9. Handle rollbacks if needed',
        '10. Generate execution report'
      ],
      outputFormat: 'JSON with successfulUpdates, failedUpdates, skippedUpdates, executionLog, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['successfulUpdates', 'failedUpdates', 'artifacts'],
      properties: {
        successfulUpdates: { type: 'number' },
        failedUpdates: { type: 'number' },
        skippedUpdates: { type: 'number' },
        executionLog: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'execution', 'updates']
}));

export const validateUpdatesTask = defineTask('validate-updates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Validate Updates - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate dependency updates',
      context: args,
      instructions: [
        '1. Run full test suite',
        '2. Perform integration testing',
        '3. Check runtime behavior',
        '4. Validate performance',
        '5. Run security scans',
        '6. Test critical paths',
        '7. Verify build process',
        '8. Check deployment',
        '9. Document any issues',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allTestsPassed, passedTests, failedTests, failures, performanceImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        performanceImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'validation', 'testing']
}));

export const documentChangesTask = defineTask('document-changes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Document Changes - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Document dependency updates and changes',
      context: args,
      instructions: [
        '1. Update dependency documentation',
        '2. Create changelog entries',
        '3. Document breaking changes',
        '4. Update README if needed',
        '5. Document migration steps',
        '6. Update API documentation',
        '7. Create release notes',
        '8. Document known issues',
        '9. Update troubleshooting guide',
        '10. Generate final report'
      ],
      outputFormat: 'JSON with documentPath, changelog, breakingChangesDoc, releaseNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        changelog: { type: 'string' },
        breakingChangesDoc: { type: 'string' },
        releaseNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dependency-analysis', 'documentation', 'changelog']
}));
