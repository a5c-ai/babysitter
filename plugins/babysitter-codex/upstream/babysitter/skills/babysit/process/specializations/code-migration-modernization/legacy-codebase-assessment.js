/**
 * @process specializations/code-migration-modernization/legacy-codebase-assessment
 * @description Legacy Codebase Assessment - Comprehensive legacy system analysis covering code quality,
 * architecture evaluation, dependency mapping, technical debt quantification, and modernization readiness
 * scoring to provide a foundation for all migration planning activities.
 * @inputs { projectName: string, repositoryUrls?: array, documentationPaths?: array, stakeholders?: array, analysisScope?: string }
 * @outputs { success: boolean, inventory: object, codeAnalysis: object, architectureAnalysis: object, technicalDebt: array, riskAssessment: object, readinessScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/legacy-codebase-assessment', {
 *   projectName: 'Legacy ERP System',
 *   repositoryUrls: ['https://github.com/org/legacy-erp'],
 *   documentationPaths: ['/docs/legacy-system'],
 *   stakeholders: ['tech-lead@company.com', 'architect@company.com'],
 *   analysisScope: 'full'
 * });
 *
 * @references
 * - Working Effectively with Legacy Code (Michael Feathers)
 * - SonarQube Documentation: https://docs.sonarqube.org/
 * - CAST Software Intelligence: https://www.castsoftware.com/
 * - Technical Debt Quadrant: https://martinfowler.com/bliki/TechnicalDebtQuadrant.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryUrls = [],
    documentationPaths = [],
    stakeholders = [],
    analysisScope = 'full',
    codeQualityTools = ['sonarqube'],
    outputDir = 'legacy-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Legacy Codebase Assessment for ${projectName}`);

  // ============================================================================
  // PHASE 1: INVENTORY COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting system inventory');
  const inventoryCollection = await ctx.task(inventoryCollectionTask, {
    projectName,
    repositoryUrls,
    documentationPaths,
    outputDir
  });

  artifacts.push(...inventoryCollection.artifacts);

  // ============================================================================
  // PHASE 2: STATIC CODE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running static code analysis');
  const staticCodeAnalysis = await ctx.task(staticCodeAnalysisTask, {
    projectName,
    inventory: inventoryCollection,
    codeQualityTools,
    outputDir
  });

  artifacts.push(...staticCodeAnalysis.artifacts);

  // Quality Gate: Code analysis completion
  if (staticCodeAnalysis.completeness < 80) {
    await ctx.breakpoint({
      question: `Static code analysis completeness: ${staticCodeAnalysis.completeness}%. Some areas could not be analyzed. Proceed with partial analysis or investigate blockers?`,
      title: 'Code Analysis Completeness',
      context: {
        runId: ctx.runId,
        projectName,
        completeness: staticCodeAnalysis.completeness,
        blockers: staticCodeAnalysis.blockers,
        recommendation: 'Review blockers and ensure critical code paths are analyzed'
      }
    });
  }

  // ============================================================================
  // PHASE 3: ARCHITECTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing system architecture');
  const architectureAnalysis = await ctx.task(architectureAnalysisTask, {
    projectName,
    inventory: inventoryCollection,
    codeAnalysis: staticCodeAnalysis,
    outputDir
  });

  artifacts.push(...architectureAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing dependencies');
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    projectName,
    inventory: inventoryCollection,
    outputDir
  });

  artifacts.push(...dependencyAnalysis.artifacts);

  // Quality Gate: Security vulnerabilities
  if (dependencyAnalysis.criticalVulnerabilities > 0) {
    await ctx.breakpoint({
      question: `Found ${dependencyAnalysis.criticalVulnerabilities} critical security vulnerabilities in dependencies. These should be addressed before or during migration. Review vulnerability report?`,
      title: 'Critical Security Vulnerabilities',
      context: {
        runId: ctx.runId,
        projectName,
        criticalVulnerabilities: dependencyAnalysis.criticalVulnerabilities,
        highVulnerabilities: dependencyAnalysis.highVulnerabilities,
        vulnerabilityReport: dependencyAnalysis.vulnerabilityReport,
        recommendation: 'Prioritize addressing critical vulnerabilities in migration plan'
      }
    });
  }

  // ============================================================================
  // PHASE 5: KNOWLEDGE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing organizational knowledge');
  const knowledgeAssessment = await ctx.task(knowledgeAssessmentTask, {
    projectName,
    inventory: inventoryCollection,
    documentationPaths,
    stakeholders,
    outputDir
  });

  artifacts.push(...knowledgeAssessment.artifacts);

  // ============================================================================
  // PHASE 6: TECHNICAL DEBT QUANTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Quantifying technical debt');
  const technicalDebtQuantification = await ctx.task(technicalDebtQuantificationTask, {
    projectName,
    codeAnalysis: staticCodeAnalysis,
    architectureAnalysis,
    dependencyAnalysis,
    outputDir
  });

  artifacts.push(...technicalDebtQuantification.artifacts);

  // ============================================================================
  // PHASE 7: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing migration risks');
  const riskAssessment = await ctx.task(migrationRiskAssessmentTask, {
    projectName,
    inventory: inventoryCollection,
    codeAnalysis: staticCodeAnalysis,
    architectureAnalysis,
    dependencyAnalysis,
    knowledgeAssessment,
    technicalDebt: technicalDebtQuantification,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 8: MODERNIZATION READINESS SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Calculating modernization readiness score');
  const readinessScoring = await ctx.task(readinessScoringTask, {
    projectName,
    inventory: inventoryCollection,
    codeAnalysis: staticCodeAnalysis,
    architectureAnalysis,
    dependencyAnalysis,
    knowledgeAssessment,
    technicalDebt: technicalDebtQuantification,
    riskAssessment,
    outputDir
  });

  artifacts.push(...readinessScoring.artifacts);

  // ============================================================================
  // PHASE 9: RECOMMENDATIONS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating recommendations report');
  const recommendationsReport = await ctx.task(recommendationsReportTask, {
    projectName,
    inventory: inventoryCollection,
    codeAnalysis: staticCodeAnalysis,
    architectureAnalysis,
    dependencyAnalysis,
    knowledgeAssessment,
    technicalDebt: technicalDebtQuantification,
    riskAssessment,
    readinessScoring,
    outputDir
  });

  artifacts.push(...recommendationsReport.artifacts);

  // Final Breakpoint: Assessment Review
  await ctx.breakpoint({
    question: `Legacy Codebase Assessment complete for ${projectName}. Readiness Score: ${readinessScoring.overallScore}/100. ${readinessScoring.overallScore >= 60 ? 'System is reasonably ready for migration.' : 'Significant preparation needed before migration.'} Review findings and approve assessment?`,
    title: 'Legacy Codebase Assessment Review',
    context: {
      runId: ctx.runId,
      projectName,
      readinessScore: readinessScoring.overallScore,
      technicalDebtItems: technicalDebtQuantification.totalItems,
      criticalRisks: riskAssessment.criticalRisks.length,
      recommendations: recommendationsReport.prioritizedRecommendations,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        label: a.label
      }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    inventory: {
      repositories: inventoryCollection.repositories,
      languages: inventoryCollection.languages,
      frameworks: inventoryCollection.frameworks,
      databases: inventoryCollection.databases,
      linesOfCode: inventoryCollection.totalLinesOfCode
    },
    codeAnalysis: {
      codeQuality: staticCodeAnalysis.overallQuality,
      complexity: staticCodeAnalysis.averageComplexity,
      duplication: staticCodeAnalysis.duplicationPercentage,
      testCoverage: staticCodeAnalysis.testCoverage,
      securityIssues: staticCodeAnalysis.securityIssues
    },
    architectureAnalysis: {
      pattern: architectureAnalysis.identifiedPattern,
      coupling: architectureAnalysis.couplingLevel,
      cohesion: architectureAnalysis.cohesionLevel,
      componentCount: architectureAnalysis.componentCount,
      integrationPoints: architectureAnalysis.integrationPoints
    },
    dependencyAnalysis: {
      totalDependencies: dependencyAnalysis.totalDependencies,
      outdatedDependencies: dependencyAnalysis.outdatedCount,
      vulnerabilities: {
        critical: dependencyAnalysis.criticalVulnerabilities,
        high: dependencyAnalysis.highVulnerabilities
      },
      licenseIssues: dependencyAnalysis.licenseIssues
    },
    knowledgeAssessment: {
      documentationScore: knowledgeAssessment.documentationScore,
      tribalKnowledgeRisk: knowledgeAssessment.tribalKnowledgeRisk,
      teamFamiliarity: knowledgeAssessment.teamFamiliarity
    },
    technicalDebt: {
      totalItems: technicalDebtQuantification.totalItems,
      estimatedEffort: technicalDebtQuantification.totalEffort,
      categories: technicalDebtQuantification.byCategory,
      priorityBreakdown: technicalDebtQuantification.byPriority
    },
    riskAssessment: {
      overallRiskLevel: riskAssessment.overallRiskLevel,
      criticalRisks: riskAssessment.criticalRisks,
      highRisks: riskAssessment.highRisks,
      mitigationStrategies: riskAssessment.mitigationStrategies
    },
    readinessScore: readinessScoring.overallScore,
    readinessBreakdown: readinessScoring.componentScores,
    recommendations: recommendationsReport.prioritizedRecommendations,
    reportPath: recommendationsReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/legacy-codebase-assessment',
      timestamp: startTime,
      analysisScope,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inventoryCollectionTask = defineTask('inventory-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Inventory Collection - ${args.projectName}`,
  agent: {
    name: 'legacy-system-archaeologist',
    prompt: {
      role: 'Legacy System Analyst',
      task: 'Collect comprehensive inventory of legacy system components',
      context: args,
      instructions: [
        '1. Identify and catalog all code repositories',
        '2. Document programming languages and their versions',
        '3. List frameworks and libraries used',
        '4. Catalog databases and data stores',
        '5. Map external dependencies and integrations',
        '6. Document deployment infrastructure',
        '7. Identify build and deployment tools',
        '8. Count lines of code by language',
        '9. Document runtime environments',
        '10. Create system component inventory'
      ],
      outputFormat: 'JSON with repositories, languages, frameworks, databases, integrations, infrastructure, totalLinesOfCode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['repositories', 'languages', 'totalLinesOfCode', 'artifacts'],
      properties: {
        repositories: { type: 'array', items: { type: 'object' } },
        languages: { type: 'array', items: { type: 'object' } },
        frameworks: { type: 'array', items: { type: 'object' } },
        databases: { type: 'array', items: { type: 'object' } },
        integrations: { type: 'array', items: { type: 'object' } },
        infrastructure: { type: 'object' },
        totalLinesOfCode: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'inventory', 'discovery']
}));

export const staticCodeAnalysisTask = defineTask('static-code-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Static Code Analysis - ${args.projectName}`,
  agent: {
    name: 'legacy-system-archaeologist',
    prompt: {
      role: 'Code Quality Analyst',
      task: 'Perform comprehensive static code analysis',
      context: args,
      instructions: [
        '1. Run code quality analysis tools (SonarQube, CodeClimate)',
        '2. Measure cyclomatic complexity across codebase',
        '3. Identify code duplication percentage',
        '4. Assess test coverage metrics',
        '5. Detect security vulnerabilities (OWASP)',
        '6. Identify code smells and anti-patterns',
        '7. Measure maintainability index',
        '8. Analyze coding standards compliance',
        '9. Calculate technical debt from code issues',
        '10. Generate code analysis report'
      ],
      outputFormat: 'JSON with overallQuality, averageComplexity, duplicationPercentage, testCoverage, securityIssues, codeSmells, completeness, blockers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallQuality', 'completeness', 'artifacts'],
      properties: {
        overallQuality: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F'] },
        averageComplexity: { type: 'number' },
        duplicationPercentage: { type: 'number' },
        testCoverage: { type: 'number' },
        securityIssues: { type: 'object' },
        codeSmells: { type: 'array', items: { type: 'object' } },
        completeness: { type: 'number' },
        blockers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'code-quality', 'static-analysis']
}));

export const architectureAnalysisTask = defineTask('architecture-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Architecture Analysis - ${args.projectName}`,
  agent: {
    name: 'legacy-system-archaeologist',
    prompt: {
      role: 'Software Architect',
      task: 'Analyze system architecture patterns and structure',
      context: args,
      instructions: [
        '1. Identify architectural patterns (monolith, layered, etc.)',
        '2. Map component dependencies',
        '3. Assess coupling between components',
        '4. Evaluate cohesion within components',
        '5. Document integration points',
        '6. Identify architectural violations',
        '7. Assess scalability constraints',
        '8. Document data flow patterns',
        '9. Identify architectural debt',
        '10. Create architecture diagram'
      ],
      outputFormat: 'JSON with identifiedPattern, couplingLevel, cohesionLevel, componentCount, integrationPoints, architecturalDebt, diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedPattern', 'couplingLevel', 'componentCount', 'artifacts'],
      properties: {
        identifiedPattern: { type: 'string' },
        couplingLevel: { type: 'string', enum: ['tight', 'moderate', 'loose'] },
        cohesionLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        componentCount: { type: 'number' },
        integrationPoints: { type: 'array', items: { type: 'object' } },
        architecturalDebt: { type: 'array', items: { type: 'object' } },
        diagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'architecture', 'analysis']
}));

export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Analysis - ${args.projectName}`,
  agent: {
    name: 'legacy-system-archaeologist',
    prompt: {
      role: 'Dependency Analyst',
      task: 'Analyze external and internal dependencies',
      context: args,
      instructions: [
        '1. Extract all external dependencies',
        '2. Categorize direct vs transitive dependencies',
        '3. Scan for known vulnerabilities (CVEs)',
        '4. Check for outdated dependencies',
        '5. Identify end-of-life dependencies',
        '6. Analyze license compliance',
        '7. Map internal module dependencies',
        '8. Identify circular dependencies',
        '9. Assess update urgency',
        '10. Generate dependency report'
      ],
      outputFormat: 'JSON with totalDependencies, outdatedCount, criticalVulnerabilities, highVulnerabilities, licenseIssues, vulnerabilityReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDependencies', 'criticalVulnerabilities', 'artifacts'],
      properties: {
        totalDependencies: { type: 'number' },
        outdatedCount: { type: 'number' },
        criticalVulnerabilities: { type: 'number' },
        highVulnerabilities: { type: 'number' },
        licenseIssues: { type: 'array', items: { type: 'object' } },
        vulnerabilityReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'dependencies', 'security']
}));

export const knowledgeAssessmentTask = defineTask('knowledge-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Knowledge Assessment - ${args.projectName}`,
  agent: {
    name: 'legacy-system-archaeologist',
    prompt: {
      role: 'Knowledge Management Analyst',
      task: 'Assess organizational knowledge about the legacy system',
      context: args,
      instructions: [
        '1. Review existing documentation completeness',
        '2. Assess documentation currency and accuracy',
        '3. Identify tribal knowledge holders',
        '4. Document undocumented features',
        '5. Assess team familiarity with codebase',
        '6. Identify knowledge gaps',
        '7. Evaluate onboarding difficulty',
        '8. Assess bus factor risk',
        '9. Document critical business rules location',
        '10. Generate knowledge assessment report'
      ],
      outputFormat: 'JSON with documentationScore, tribalKnowledgeRisk, teamFamiliarity, knowledgeGaps, busFactorRisk, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationScore', 'tribalKnowledgeRisk', 'artifacts'],
      properties: {
        documentationScore: { type: 'number', minimum: 0, maximum: 100 },
        tribalKnowledgeRisk: { type: 'string', enum: ['high', 'medium', 'low'] },
        teamFamiliarity: { type: 'string', enum: ['high', 'medium', 'low'] },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        busFactorRisk: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'knowledge', 'documentation']
}));

export const technicalDebtQuantificationTask = defineTask('technical-debt-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Technical Debt Quantification - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Technical Debt Analyst',
      task: 'Quantify and categorize technical debt',
      context: args,
      instructions: [
        '1. Categorize technical debt types (code, architecture, test, documentation)',
        '2. Estimate remediation effort for each item',
        '3. Prioritize debt by impact',
        '4. Calculate debt interest (ongoing maintenance cost)',
        '5. Identify debt with security implications',
        '6. Assess debt blocking modernization',
        '7. Calculate total debt in person-days',
        '8. Identify quick wins vs major refactoring',
        '9. Map debt to migration phases',
        '10. Create technical debt register'
      ],
      outputFormat: 'JSON with totalItems, totalEffort, byCategory, byPriority, debtRegister, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalItems', 'totalEffort', 'byCategory', 'artifacts'],
      properties: {
        totalItems: { type: 'number' },
        totalEffort: { type: 'string' },
        byCategory: { type: 'object' },
        byPriority: { type: 'object' },
        debtRegister: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'technical-debt', 'quantification']
}));

export const migrationRiskAssessmentTask = defineTask('migration-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Migration Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'migration-readiness-assessor',
    prompt: {
      role: 'Migration Risk Analyst',
      task: 'Assess risks specific to migrating this legacy system',
      context: args,
      instructions: [
        '1. Identify technical migration risks',
        '2. Assess data migration risks',
        '3. Identify knowledge and skill gaps',
        '4. Assess business continuity risks',
        '5. Evaluate integration risks',
        '6. Assess timeline and budget risks',
        '7. Rate risk severity and likelihood',
        '8. Propose mitigation strategies',
        '9. Identify risk triggers',
        '10. Create risk register'
      ],
      outputFormat: 'JSON with overallRiskLevel, criticalRisks, highRisks, riskRegister, mitigationStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskLevel', 'criticalRisks', 'artifacts'],
      properties: {
        overallRiskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        criticalRisks: { type: 'array', items: { type: 'object' } },
        highRisks: { type: 'array', items: { type: 'object' } },
        riskRegister: { type: 'array', items: { type: 'object' } },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'risk', 'migration']
}));

export const readinessScoringTask = defineTask('readiness-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Modernization Readiness Scoring - ${args.projectName}`,
  agent: {
    name: 'migration-readiness-assessor',
    prompt: {
      role: 'Modernization Readiness Analyst',
      task: 'Calculate comprehensive modernization readiness score',
      context: args,
      instructions: [
        '1. Score code quality dimension (weight: 20%)',
        '2. Score architecture dimension (weight: 20%)',
        '3. Score dependency health dimension (weight: 15%)',
        '4. Score documentation dimension (weight: 10%)',
        '5. Score technical debt dimension (weight: 15%)',
        '6. Score risk level dimension (weight: 20%)',
        '7. Calculate weighted overall score',
        '8. Identify key blockers to readiness',
        '9. Compare to industry benchmarks',
        '10. Generate readiness scorecard'
      ],
      outputFormat: 'JSON with overallScore, componentScores, blockers, benchmarkComparison, scorecard, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        blockers: { type: 'array', items: { type: 'string' } },
        benchmarkComparison: { type: 'object' },
        scorecard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'readiness', 'scoring']
}));

export const recommendationsReportTask = defineTask('recommendations-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Recommendations Report - ${args.projectName}`,
  agent: {
    name: 'migration-readiness-assessor',
    prompt: {
      role: 'Senior Technical Writer and Architect',
      task: 'Generate comprehensive assessment recommendations report',
      context: args,
      instructions: [
        '1. Synthesize all assessment findings',
        '2. Prioritize modernization recommendations',
        '3. Recommend migration approach',
        '4. Estimate effort and timeline',
        '5. Identify quick wins',
        '6. Outline preparation steps',
        '7. Recommend technology stack options',
        '8. Suggest phased approach',
        '9. Include executive summary',
        '10. Generate comprehensive report document'
      ],
      outputFormat: 'JSON with reportPath, prioritizedRecommendations, migrationApproach, estimatedEffort, quickWins, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'prioritizedRecommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        prioritizedRecommendations: { type: 'array', items: { type: 'object' } },
        migrationApproach: { type: 'string' },
        estimatedEffort: { type: 'string' },
        quickWins: { type: 'array', items: { type: 'object' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legacy-assessment', 'recommendations', 'report']
}));
