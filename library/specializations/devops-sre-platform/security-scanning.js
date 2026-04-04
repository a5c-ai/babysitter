/**
 * @process specializations/devops-sre-platform/security-scanning
 * @description Security Scanning and Compliance Automation - Comprehensive automated security scanning framework covering
 * SAST, DAST, SCA, container scanning, infrastructure scanning, secrets detection, compliance validation, and
 * vulnerability management with automated remediation workflows and security gates for CI/CD pipelines.
 * @inputs { projectName: string, repositoryUrl?: string, scanTypes?: array, complianceStandards?: array, severityThreshold?: string, cicdIntegration?: boolean }
 * @outputs { success: boolean, securityScore: number, vulnerabilities: array, complianceStatus: object, scanResults: object, remediationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/security-scanning', {
 *   projectName: 'E-Commerce Platform',
 *   repositoryUrl: 'https://github.com/org/ecommerce-platform',
 *   scanTypes: ['sast', 'dast', 'sca', 'container', 'infrastructure', 'secrets'],
 *   complianceStandards: ['OWASP', 'PCI-DSS', 'SOC2', 'CIS', 'NIST'],
 *   severityThreshold: 'high',
 *   cicdIntegration: true,
 *   applicationUrl: 'https://staging.example.com',
 *   containerImages: ['app:latest', 'api:latest'],
 *   infrastructureAsCode: ['terraform', 'kubernetes'],
 *   autoRemediation: true,
 *   continuousMonitoring: true
 * });
 *
 * @references
 * - OWASP Top 10: https://owasp.org/www-project-top-ten/
 * - CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks/
 * - NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
 * - DevSecOps: https://www.devsecops.org/
 * - SAST/DAST Best Practices: https://owasp.org/www-community/Source_Code_Analysis_Tools
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryUrl = '',
    scanTypes = ['sast', 'sca', 'secrets', 'container'],
    complianceStandards = ['OWASP', 'CIS'],
    severityThreshold = 'medium', // 'critical', 'high', 'medium', 'low'
    cicdIntegration = true,
    applicationUrl = '',
    containerImages = [],
    infrastructureAsCode = [],
    autoRemediation = false,
    continuousMonitoring = false,
    scanSchedule = 'daily', // 'on-commit', 'daily', 'weekly'
    notificationChannels = ['email', 'slack'],
    outputDir = 'security-scanning-output',
    vulnerabilityDatabase = 'NVD', // 'NVD', 'Snyk', 'GitHub Advisory'
    falsePositiveThreshold = 0.1,
    environmentType = 'production' // 'dev', 'staging', 'production'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let securityScore = 0;
  const allVulnerabilities = [];
  const scanResults = {};

  ctx.log('info', `Starting Security Scanning and Compliance Automation for ${projectName}`);
  ctx.log('info', `Scan Types: ${scanTypes.join(', ')}`);
  ctx.log('info', `Compliance Standards: ${complianceStandards.join(', ')}`);
  ctx.log('info', `Severity Threshold: ${severityThreshold}`);

  // ============================================================================
  // PHASE 1: SECURITY ASSESSMENT AND BASELINE
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting security assessment and establishing baseline');

  const assessmentResult = await ctx.task(securityAssessmentTask, {
    projectName,
    repositoryUrl,
    scanTypes,
    complianceStandards,
    applicationUrl,
    containerImages,
    infrastructureAsCode,
    environmentType,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);

  ctx.log('info', `Assessment complete - Identified ${assessmentResult.assetsCount} assets to scan, ${assessmentResult.complianceRequirements.length} compliance requirements`);

  // Quality Gate: Assessment review
  await ctx.breakpoint({
    question: `Security assessment complete for ${projectName}. Identified ${assessmentResult.assetsCount} assets across ${assessmentResult.assetTypes.length} types. ${assessmentResult.complianceRequirements.length} compliance requirements to validate. Proceed with security scanning?`,
    title: 'Security Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        assetsCount: assessmentResult.assetsCount,
        assetTypes: assessmentResult.assetTypes,
        complianceRequirements: assessmentResult.complianceRequirements.slice(0, 10),
        riskProfile: assessmentResult.riskProfile,
        baselineEstablished: assessmentResult.baselineEstablished
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: STATIC APPLICATION SECURITY TESTING (SAST)
  // ============================================================================

  if (scanTypes.includes('sast')) {
    ctx.log('info', 'Phase 2: Running Static Application Security Testing (SAST)');

    const sastResult = await ctx.task(sastScanningTask, {
      projectName,
      repositoryUrl,
      codeLanguages: assessmentResult.codeLanguages,
      frameworks: assessmentResult.frameworks,
      severityThreshold,
      outputDir
    });

    scanResults.sast = sastResult;
    allVulnerabilities.push(...sastResult.vulnerabilities);
    artifacts.push(...sastResult.artifacts);

    ctx.log('info', `SAST complete - Found ${sastResult.vulnerabilitiesCount} vulnerabilities (Critical: ${sastResult.critical}, High: ${sastResult.high})`);

    // Quality Gate: Critical SAST findings
    if (sastResult.critical > 0) {
      await ctx.breakpoint({
        question: `SAST scan found ${sastResult.critical} critical vulnerabilities in ${projectName}. Review findings: ${sastResult.topIssues.slice(0, 5).map(i => i.title).join(', ')}. Address critical issues before proceeding?`,
        title: 'Critical SAST Vulnerabilities Found',
        context: {
          runId: ctx.runId,
          sast: {
            total: sastResult.vulnerabilitiesCount,
            critical: sastResult.critical,
            high: sastResult.high,
            medium: sastResult.medium,
            topIssues: sastResult.topIssues.slice(0, 10)
          },
          recommendation: 'Address all critical vulnerabilities before deployment',
          files: sastResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 3: SOFTWARE COMPOSITION ANALYSIS (SCA)
  // ============================================================================

  if (scanTypes.includes('sca')) {
    ctx.log('info', 'Phase 3: Running Software Composition Analysis (SCA) - dependency scanning');

    const scaResult = await ctx.task(scaScanningTask, {
      projectName,
      repositoryUrl,
      packageManagers: assessmentResult.packageManagers,
      vulnerabilityDatabase,
      severityThreshold,
      outputDir
    });

    scanResults.sca = scaResult;
    allVulnerabilities.push(...scaResult.vulnerabilities);
    artifacts.push(...scaResult.artifacts);

    ctx.log('info', `SCA complete - Scanned ${scaResult.dependenciesCount} dependencies, found ${scaResult.vulnerabilitiesCount} vulnerabilities`);

    // Quality Gate: Vulnerable dependencies
    if (scaResult.critical > 0 || scaResult.high > 5) {
      await ctx.breakpoint({
        question: `SCA scan found ${scaResult.vulnerabilitiesCount} vulnerable dependencies (Critical: ${scaResult.critical}, High: ${scaResult.high}). ${scaResult.patchableCount} have patches available. Review and update dependencies?`,
        title: 'Vulnerable Dependencies Found',
        context: {
          runId: ctx.runId,
          sca: {
            total: scaResult.vulnerabilitiesCount,
            critical: scaResult.critical,
            high: scaResult.high,
            patchableCount: scaResult.patchableCount,
            outdatedPackages: scaResult.outdatedPackages,
            topVulnerableDependencies: scaResult.topVulnerableDependencies.slice(0, 10)
          },
          recommendation: 'Update vulnerable dependencies with available patches',
          files: scaResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 4: SECRETS DETECTION
  // ============================================================================

  if (scanTypes.includes('secrets')) {
    ctx.log('info', 'Phase 4: Running secrets detection scan');

    const secretsResult = await ctx.task(secretsDetectionTask, {
      projectName,
      repositoryUrl,
      scanHistory: true,
      scanCommits: 100,
      outputDir
    });

    scanResults.secrets = secretsResult;
    allVulnerabilities.push(...secretsResult.findings);
    artifacts.push(...secretsResult.artifacts);

    ctx.log('info', `Secrets scan complete - Found ${secretsResult.secretsCount} potential secrets (High confidence: ${secretsResult.highConfidence})`);

    // Quality Gate: Secrets found (critical issue)
    if (secretsResult.highConfidence > 0) {
      await ctx.breakpoint({
        question: `CRITICAL: Secrets detection found ${secretsResult.highConfidence} high-confidence secrets in ${projectName}! Types: ${secretsResult.secretTypes.join(', ')}. Immediate action required - rotate exposed credentials!`,
        title: 'Exposed Secrets Detected - Critical',
        context: {
          runId: ctx.runId,
          secrets: {
            total: secretsResult.secretsCount,
            highConfidence: secretsResult.highConfidence,
            secretTypes: secretsResult.secretTypes,
            exposedFiles: secretsResult.exposedFiles.slice(0, 10),
            commitHistory: secretsResult.inCommitHistory
          },
          recommendation: 'Immediately rotate all exposed credentials and remove from repository history',
          files: secretsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: CONTAINER IMAGE SECURITY SCANNING
  // ============================================================================

  if (scanTypes.includes('container') && containerImages.length > 0) {
    ctx.log('info', 'Phase 5: Running container image security scanning');

    const containerScanTasks = containerImages.map(image =>
      () => ctx.task(containerScanningTask, {
        projectName,
        containerImage: image,
        severityThreshold,
        scanLayers: true,
        outputDir
      })
    );

    const containerResults = await ctx.parallel.all(containerScanTasks);

    const consolidatedContainerResult = {
      imagesScanned: containerResults.length,
      vulnerabilitiesCount: containerResults.reduce((sum, r) => sum + r.vulnerabilitiesCount, 0),
      critical: containerResults.reduce((sum, r) => sum + r.critical, 0),
      high: containerResults.reduce((sum, r) => sum + r.high, 0),
      medium: containerResults.reduce((sum, r) => sum + r.medium, 0),
      vulnerabilities: containerResults.flatMap(r => r.vulnerabilities),
      artifacts: containerResults.flatMap(r => r.artifacts)
    };

    scanResults.container = consolidatedContainerResult;
    allVulnerabilities.push(...consolidatedContainerResult.vulnerabilities);
    artifacts.push(...consolidatedContainerResult.artifacts);

    ctx.log('info', `Container scanning complete - Scanned ${consolidatedContainerResult.imagesScanned} images, found ${consolidatedContainerResult.vulnerabilitiesCount} vulnerabilities`);

    // Quality Gate: Container vulnerabilities
    if (consolidatedContainerResult.critical > 0) {
      await ctx.breakpoint({
        question: `Container scanning found ${consolidatedContainerResult.critical} critical vulnerabilities across ${consolidatedContainerResult.imagesScanned} images. Rebuild images with patched base images?`,
        title: 'Container Vulnerabilities Found',
        context: {
          runId: ctx.runId,
          container: {
            imagesScanned: consolidatedContainerResult.imagesScanned,
            vulnerabilitiesCount: consolidatedContainerResult.vulnerabilitiesCount,
            critical: consolidatedContainerResult.critical,
            high: consolidatedContainerResult.high,
            topVulnerabilities: consolidatedContainerResult.vulnerabilities.slice(0, 10)
          },
          recommendation: 'Update base images and rebuild containers',
          files: consolidatedContainerResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: INFRASTRUCTURE AS CODE (IaC) SECURITY SCANNING
  // ============================================================================

  if (scanTypes.includes('infrastructure') && infrastructureAsCode.length > 0) {
    ctx.log('info', 'Phase 6: Running Infrastructure as Code (IaC) security scanning');

    const iacResult = await ctx.task(iacScanningTask, {
      projectName,
      repositoryUrl,
      iacTypes: infrastructureAsCode,
      complianceStandards,
      severityThreshold,
      outputDir
    });

    scanResults.iac = iacResult;
    allVulnerabilities.push(...iacResult.misconfigurations);
    artifacts.push(...iacResult.artifacts);

    ctx.log('info', `IaC scanning complete - Found ${iacResult.misconfigurationsCount} misconfigurations (Critical: ${iacResult.critical}, High: ${iacResult.high})`);

    // Quality Gate: IaC misconfigurations
    if (iacResult.critical > 0 || iacResult.high > 5) {
      await ctx.breakpoint({
        question: `IaC scanning found ${iacResult.misconfigurationsCount} security misconfigurations (Critical: ${iacResult.critical}, High: ${iacResult.high}). Top issues: ${iacResult.topIssues.slice(0, 5).map(i => i.title).join(', ')}. Fix configurations?`,
        title: 'IaC Security Misconfigurations',
        context: {
          runId: ctx.runId,
          iac: {
            misconfigurationsCount: iacResult.misconfigurationsCount,
            critical: iacResult.critical,
            high: iacResult.high,
            iacTypes: iacResult.iacTypes,
            topIssues: iacResult.topIssues.slice(0, 10),
            complianceViolations: iacResult.complianceViolations
          },
          recommendation: 'Fix critical and high-severity misconfigurations before deployment',
          files: iacResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 7: DYNAMIC APPLICATION SECURITY TESTING (DAST)
  // ============================================================================

  if (scanTypes.includes('dast') && applicationUrl) {
    ctx.log('info', 'Phase 7: Running Dynamic Application Security Testing (DAST)');

    const dastResult = await ctx.task(dastScanningTask, {
      projectName,
      applicationUrl,
      authenticationType: assessmentResult.authenticationType,
      testCredentials: assessmentResult.testCredentials,
      scanDepth: 'moderate', // 'light', 'moderate', 'deep'
      severityThreshold,
      outputDir
    });

    scanResults.dast = dastResult;
    allVulnerabilities.push(...dastResult.vulnerabilities);
    artifacts.push(...dastResult.artifacts);

    ctx.log('info', `DAST complete - Tested ${dastResult.endpointsTested} endpoints, found ${dastResult.vulnerabilitiesCount} vulnerabilities`);

    // Quality Gate: DAST findings
    if (dastResult.critical > 0) {
      await ctx.breakpoint({
        question: `DAST scan found ${dastResult.critical} critical runtime vulnerabilities. Issues: ${dastResult.topIssues.slice(0, 5).map(i => i.title).join(', ')}. Address before production deployment?`,
        title: 'Critical DAST Vulnerabilities',
        context: {
          runId: ctx.runId,
          dast: {
            endpointsTested: dastResult.endpointsTested,
            vulnerabilitiesCount: dastResult.vulnerabilitiesCount,
            critical: dastResult.critical,
            high: dastResult.high,
            topIssues: dastResult.topIssues.slice(0, 10),
            owaspTop10: dastResult.owaspTop10Coverage
          },
          recommendation: 'Fix critical runtime vulnerabilities',
          files: dastResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 8: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating compliance against security standards');

  const complianceResult = await ctx.task(complianceValidationTask, {
    projectName,
    complianceStandards,
    scanResults,
    allVulnerabilities,
    assessmentResult,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);

  ctx.log('info', `Compliance validation complete - ${complianceResult.passedCount}/${complianceResult.totalChecks} checks passed (${complianceResult.complianceScore}% compliant)`);

  // Quality Gate: Compliance validation
  if (complianceResult.complianceScore < 80) {
    await ctx.breakpoint({
      question: `Compliance validation shows ${complianceResult.complianceScore}% compliance (target: 80%+). Failed standards: ${complianceResult.failedStandards.join(', ')}. ${complianceResult.failedChecks.length} checks failed. Address compliance gaps?`,
      title: 'Compliance Validation Review',
      context: {
        runId: ctx.runId,
        compliance: {
          complianceScore: complianceResult.complianceScore,
          passedCount: complianceResult.passedCount,
          failedCount: complianceResult.failedCount,
          totalChecks: complianceResult.totalChecks,
          failedStandards: complianceResult.failedStandards,
          failedChecks: complianceResult.failedChecks.slice(0, 15)
        },
        recommendation: 'Address compliance gaps to meet regulatory requirements',
        files: complianceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: VULNERABILITY DEDUPLICATION AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Deduplicating and prioritizing vulnerabilities');

  const prioritizationResult = await ctx.task(vulnerabilityPrioritizationTask, {
    projectName,
    allVulnerabilities,
    scanResults,
    assessmentResult,
    environmentType,
    falsePositiveThreshold,
    outputDir
  });

  artifacts.push(...prioritizationResult.artifacts);

  ctx.log('info', `Prioritization complete - ${prioritizationResult.uniqueVulnerabilities} unique vulnerabilities, ${prioritizationResult.actionableCount} actionable items`);

  // ============================================================================
  // PHASE 10: AUTOMATED REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating automated remediation plan');

  const remediationResult = await ctx.task(remediationPlanningTask, {
    projectName,
    prioritizedVulnerabilities: prioritizationResult.prioritizedVulnerabilities,
    scanResults,
    autoRemediation,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...remediationResult.artifacts);

  ctx.log('info', `Remediation plan generated - ${remediationResult.autoFixableCount} auto-fixable, ${remediationResult.manualFixCount} require manual fix`);

  // Quality Gate: Remediation plan review
  await ctx.breakpoint({
    question: `Remediation plan generated with ${remediationResult.totalActions} actions. ${remediationResult.autoFixableCount} can be auto-fixed, ${remediationResult.manualFixCount} require manual intervention. Critical: ${remediationResult.criticalActions}. Approve remediation plan?`,
    title: 'Remediation Plan Review',
    context: {
      runId: ctx.runId,
      remediation: {
        totalActions: remediationResult.totalActions,
        autoFixableCount: remediationResult.autoFixableCount,
        manualFixCount: remediationResult.manualFixCount,
        criticalActions: remediationResult.criticalActions,
        estimatedEffort: remediationResult.estimatedEffort,
        topPriorityActions: remediationResult.actions.slice(0, 15)
      },
      files: remediationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: CI/CD INTEGRATION SETUP
  // ============================================================================

  if (cicdIntegration) {
    ctx.log('info', 'Phase 11: Setting up CI/CD security gates integration');

    const cicdIntegrationResult = await ctx.task(cicdIntegrationTask, {
      projectName,
      scanTypes,
      severityThreshold,
      complianceStandards,
      assessmentResult,
      prioritizationResult,
      outputDir
    });

    artifacts.push(...cicdIntegrationResult.artifacts);

    ctx.log('info', `CI/CD integration complete - ${cicdIntegrationResult.securityGates.length} security gates configured`);
  }

  // ============================================================================
  // PHASE 12: CONTINUOUS MONITORING SETUP
  // ============================================================================

  if (continuousMonitoring) {
    ctx.log('info', 'Phase 12: Setting up continuous security monitoring');

    const monitoringResult = await ctx.task(continuousMonitoringTask, {
      projectName,
      scanTypes,
      scanSchedule,
      notificationChannels,
      severityThreshold,
      assessmentResult,
      outputDir
    });

    artifacts.push(...monitoringResult.artifacts);

    ctx.log('info', `Continuous monitoring configured - Schedule: ${monitoringResult.schedule}, Channels: ${monitoringResult.channels.join(', ')}`);
  }

  // ============================================================================
  // PHASE 13: SECURITY REPORTING AND DASHBOARDS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating security reports and dashboards');

  const reportingResult = await ctx.task(securityReportingTask, {
    projectName,
    assessmentResult,
    scanResults,
    complianceResult,
    prioritizationResult,
    remediationResult,
    allVulnerabilities: prioritizationResult.prioritizedVulnerabilities,
    outputDir
  });

  artifacts.push(...reportingResult.artifacts);

  ctx.log('info', `Security reports generated - Executive summary: ${reportingResult.executiveSummaryPath}`);

  // ============================================================================
  // PHASE 14: SECURITY SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Calculating overall security score');

  const scoringResult = await ctx.task(securityScoringTask, {
    projectName,
    scanResults,
    complianceResult,
    prioritizationResult,
    remediationResult,
    severityThreshold,
    outputDir
  });

  securityScore = scoringResult.securityScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Security Score: ${securityScore}/100 (Grade: ${scoringResult.grade})`);

  // Final Breakpoint: Security scanning complete
  await ctx.breakpoint({
    question: `Security Scanning Complete for ${projectName}. Security Score: ${securityScore}/100 (${scoringResult.grade}). Total vulnerabilities: ${prioritizationResult.uniqueVulnerabilities} (Critical: ${prioritizationResult.criticalCount}, High: ${prioritizationResult.highCount}). Compliance: ${complianceResult.complianceScore}%. Approve for ${environmentType} deployment?`,
    title: 'Final Security Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        securityScore,
        grade: scoringResult.grade,
        vulnerabilities: {
          total: prioritizationResult.uniqueVulnerabilities,
          critical: prioritizationResult.criticalCount,
          high: prioritizationResult.highCount,
          medium: prioritizationResult.mediumCount,
          low: prioritizationResult.lowCount
        },
        compliance: {
          score: complianceResult.complianceScore,
          passedStandards: complianceResult.passedStandards,
          failedStandards: complianceResult.failedStandards
        },
        remediation: {
          totalActions: remediationResult.totalActions,
          autoFixable: remediationResult.autoFixableCount,
          criticalActions: remediationResult.criticalActions
        },
        scansCompleted: Object.keys(scanResults)
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: reportingResult.executiveSummaryPath, format: 'markdown', label: 'Executive Summary' },
        { path: reportingResult.detailedReportPath, format: 'markdown', label: 'Detailed Security Report' },
        { path: remediationResult.planPath, format: 'markdown', label: 'Remediation Plan' },
        { path: complianceResult.reportPath, format: 'json', label: 'Compliance Report' },
        { path: scoringResult.scorecardPath, format: 'json', label: 'Security Scorecard' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    securityScore,
    grade: scoringResult.grade,
    verdict: scoringResult.verdict,
    vulnerabilities: {
      total: prioritizationResult.uniqueVulnerabilities,
      critical: prioritizationResult.criticalCount,
      high: prioritizationResult.highCount,
      medium: prioritizationResult.mediumCount,
      low: prioritizationResult.lowCount,
      actionable: prioritizationResult.actionableCount,
      list: prioritizationResult.prioritizedVulnerabilities.slice(0, 50)
    },
    scanResults: {
      sast: scanResults.sast ? {
        vulnerabilitiesCount: scanResults.sast.vulnerabilitiesCount,
        critical: scanResults.sast.critical,
        high: scanResults.sast.high,
        filesScanned: scanResults.sast.filesScanned
      } : null,
      sca: scanResults.sca ? {
        vulnerabilitiesCount: scanResults.sca.vulnerabilitiesCount,
        critical: scanResults.sca.critical,
        high: scanResults.sca.high,
        dependenciesScanned: scanResults.sca.dependenciesCount
      } : null,
      secrets: scanResults.secrets ? {
        secretsCount: scanResults.secrets.secretsCount,
        highConfidence: scanResults.secrets.highConfidence,
        secretTypes: scanResults.secrets.secretTypes
      } : null,
      container: scanResults.container ? {
        imagesScanned: scanResults.container.imagesScanned,
        vulnerabilitiesCount: scanResults.container.vulnerabilitiesCount,
        critical: scanResults.container.critical
      } : null,
      iac: scanResults.iac ? {
        misconfigurationsCount: scanResults.iac.misconfigurationsCount,
        critical: scanResults.iac.critical,
        high: scanResults.iac.high
      } : null,
      dast: scanResults.dast ? {
        endpointsTested: scanResults.dast.endpointsTested,
        vulnerabilitiesCount: scanResults.dast.vulnerabilitiesCount,
        critical: scanResults.dast.critical
      } : null
    },
    complianceStatus: {
      overallScore: complianceResult.complianceScore,
      passedCount: complianceResult.passedCount,
      failedCount: complianceResult.failedCount,
      totalChecks: complianceResult.totalChecks,
      passedStandards: complianceResult.passedStandards,
      failedStandards: complianceResult.failedStandards,
      complianceByStandard: complianceResult.complianceByStandard
    },
    remediationPlan: {
      totalActions: remediationResult.totalActions,
      autoFixableCount: remediationResult.autoFixableCount,
      manualFixCount: remediationResult.manualFixCount,
      criticalActions: remediationResult.criticalActions,
      estimatedEffort: remediationResult.estimatedEffort,
      actions: remediationResult.actions,
      planPath: remediationResult.planPath
    },
    reports: {
      executiveSummary: reportingResult.executiveSummaryPath,
      detailedReport: reportingResult.detailedReportPath,
      complianceReport: complianceResult.reportPath,
      securityScorecard: scoringResult.scorecardPath,
      dashboardUrl: reportingResult.dashboardUrl
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/security-scanning',
      processSlug: 'security-scanning',
      category: 'Security & Compliance',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      scanTypes,
      complianceStandards,
      severityThreshold,
      environmentType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Security Assessment
export const securityAssessmentTask = defineTask('security-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Security Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Architect and Risk Assessment Specialist',
      task: 'Conduct comprehensive security assessment and establish security baseline',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        scanTypes: args.scanTypes,
        complianceStandards: args.complianceStandards,
        applicationUrl: args.applicationUrl,
        containerImages: args.containerImages,
        infrastructureAsCode: args.infrastructureAsCode,
        environmentType: args.environmentType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze project structure and identify all security-relevant assets:',
        '   - Source code repositories and languages',
        '   - Application frameworks and libraries',
        '   - Package managers and dependencies',
        '   - Container images and registries',
        '   - Infrastructure as Code files (Terraform, Kubernetes, CloudFormation)',
        '   - Configuration files',
        '   - Deployment pipelines',
        '2. Identify authentication and authorization mechanisms',
        '3. Map data flows and sensitive data handling',
        '4. Document API endpoints and interfaces',
        '5. Identify third-party integrations',
        '6. Assess risk profile based on:',
        '   - Application type (web, API, mobile, embedded)',
        '   - Data sensitivity (PII, financial, health)',
        '   - User base and exposure',
        '   - Regulatory requirements',
        '7. Map compliance requirements to technical controls',
        '8. Establish security baseline metrics',
        '9. Determine scan coverage and priorities',
        '10. Create comprehensive asset inventory',
        '11. Generate security assessment report'
      ],
      outputFormat: 'JSON object with security assessment details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assetsCount', 'assetTypes', 'complianceRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assetsCount: { type: 'number', description: 'Total number of assets identified' },
        assetTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of assets (code, containers, iac, etc.)'
        },
        codeLanguages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Programming languages detected'
        },
        frameworks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Application frameworks'
        },
        packageManagers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Package managers (npm, pip, maven, etc.)'
        },
        authenticationType: {
          type: 'string',
          description: 'Authentication method (JWT, OAuth2, session, etc.)'
        },
        testCredentials: {
          type: 'object',
          description: 'Test credentials for DAST scanning'
        },
        riskProfile: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            factors: { type: 'array', items: { type: 'string' } },
            dataSensitivity: { type: 'string' },
            userExposure: { type: 'string' }
          }
        },
        complianceRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        baselineEstablished: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'assessment']
}));

// Phase 2: SAST Scanning
export const sastScanningTask = defineTask('sast-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: SAST Scanning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Static Application Security Testing (SAST) Specialist',
      task: 'Perform static code analysis to identify security vulnerabilities in source code',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        codeLanguages: args.codeLanguages,
        frameworks: args.frameworks,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate SAST tools based on languages:',
        '   - Semgrep (multi-language)',
        '   - SonarQube (comprehensive)',
        '   - Bandit (Python)',
        '   - Brakeman (Ruby/Rails)',
        '   - FindSecBugs (Java)',
        '   - ESLint Security Plugin (JavaScript)',
        '   - Gosec (Go)',
        '2. Clone repository and prepare for scanning',
        '3. Run SAST scans for each language/framework',
        '4. Detect common vulnerability patterns:',
        '   - SQL Injection',
        '   - Cross-Site Scripting (XSS)',
        '   - Command Injection',
        '   - Path Traversal',
        '   - Insecure Deserialization',
        '   - Hardcoded Secrets',
        '   - Insecure Cryptography',
        '   - Authentication/Authorization flaws',
        '   - SSRF (Server-Side Request Forgery)',
        '   - XXE (XML External Entity)',
        '5. Analyze data flow for taint analysis',
        '6. Check for insecure coding patterns',
        '7. Classify findings by OWASP Top 10 categories',
        '8. Assign severity levels (Critical, High, Medium, Low)',
        '9. Calculate confidence scores for findings',
        '10. Generate detailed SAST report with code snippets',
        '11. Provide remediation guidance for each finding'
      ],
      outputFormat: 'JSON object with SAST scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesCount', 'critical', 'high', 'vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilitiesCount: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        filesScanned: { type: 'number' },
        linesOfCode: { type: 'number' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              confidence: { type: 'string' },
              category: { type: 'string' },
              cwe: { type: 'string' },
              owaspTop10: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              codeSnippet: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        topIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              count: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        owaspCoverage: {
          type: 'object',
          description: 'Coverage of OWASP Top 10 categories'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'sast']
}));

// Phase 3: SCA Scanning
export const scaScanningTask = defineTask('sca-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: SCA Dependency Scanning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Composition Analysis (SCA) and Dependency Security Specialist',
      task: 'Scan dependencies for known vulnerabilities and licensing issues',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        packageManagers: args.packageManagers,
        vulnerabilityDatabase: args.vulnerabilityDatabase,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select SCA tools based on package managers:',
        '   - npm audit / Snyk (JavaScript/Node.js)',
        '   - pip-audit / Safety (Python)',
        '   - OWASP Dependency-Check (Java, .NET)',
        '   - bundler-audit (Ruby)',
        '   - cargo audit (Rust)',
        '   - go list / govulncheck (Go)',
        '2. Parse dependency manifests (package.json, requirements.txt, pom.xml, etc.)',
        '3. Build complete dependency tree including transitive dependencies',
        '4. Query vulnerability databases:',
        '   - National Vulnerability Database (NVD)',
        '   - GitHub Advisory Database',
        '   - Snyk Vulnerability DB',
        '   - OSV (Open Source Vulnerabilities)',
        '5. Identify vulnerable dependencies with CVE IDs',
        '6. Check for:',
        '   - Known vulnerabilities',
        '   - Outdated packages',
        '   - Deprecated packages',
        '   - License compliance issues',
        '   - Unmaintained dependencies',
        '7. Determine if patches/updates are available',
        '8. Calculate exploitability scores (CVSS)',
        '9. Identify supply chain risks',
        '10. Generate dependency security report',
        '11. Provide upgrade recommendations with version numbers'
      ],
      outputFormat: 'JSON object with SCA scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesCount', 'critical', 'high', 'dependenciesCount', 'vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilitiesCount: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        dependenciesCount: { type: 'number', description: 'Total dependencies scanned' },
        directDependencies: { type: 'number' },
        transitiveDependencies: { type: 'number' },
        patchableCount: { type: 'number', description: 'Vulnerabilities with patches available' },
        outdatedPackages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              currentVersion: { type: 'string' },
              latestVersion: { type: 'string' }
            }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              cve: { type: 'string' },
              package: { type: 'string' },
              currentVersion: { type: 'string' },
              patchedVersion: { type: 'string' },
              severity: { type: 'string' },
              cvssScore: { type: 'number' },
              description: { type: 'string' },
              exploitAvailable: { type: 'boolean' },
              patchAvailable: { type: 'boolean' },
              isDirect: { type: 'boolean' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        topVulnerableDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              package: { type: 'string' },
              vulnerabilityCount: { type: 'number' },
              highestSeverity: { type: 'string' }
            }
          }
        },
        licenseIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              package: { type: 'string' },
              license: { type: 'string' },
              issue: { type: 'string' }
            }
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
  labels: ['agent', 'security-scanning', 'sca', 'dependencies']
}));

// Phase 4: Secrets Detection
export const secretsDetectionTask = defineTask('secrets-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Secrets Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Secrets Detection and Credential Security Specialist',
      task: 'Scan for exposed secrets, credentials, and sensitive data in code and commit history',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        scanHistory: args.scanHistory,
        scanCommits: args.scanCommits,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use secrets detection tools:',
        '   - TruffleHog (git history scanning)',
        '   - GitLeaks (pattern-based detection)',
        '   - detect-secrets (baseline and scanning)',
        '   - git-secrets (AWS credentials)',
        '2. Scan current codebase for:',
        '   - API keys and tokens',
        '   - AWS access keys and secrets',
        '   - Database connection strings',
        '   - Private keys (SSH, TLS/SSL)',
        '   - OAuth tokens and secrets',
        '   - Passwords and passphrases',
        '   - JWT secrets',
        '   - Encryption keys',
        '   - Service account credentials',
        '3. Scan git commit history (if enabled):',
        '   - Check last N commits for exposed secrets',
        '   - Identify when secrets were first committed',
        '   - Track if secrets were later removed',
        '4. Use entropy analysis to detect high-entropy strings',
        '5. Apply pattern matching for common secret formats',
        '6. Calculate confidence scores (high, medium, low)',
        '7. Identify secret types (API key, password, private key, etc.)',
        '8. Check if secrets are still active/valid',
        '9. Generate secrets exposure report',
        '10. Provide remediation steps:',
        '    - Rotate exposed credentials immediately',
        '    - Remove from git history (git filter-branch)',
        '    - Move secrets to secure storage (vault, secrets manager)',
        '    - Add to .gitignore and .gitleaks.toml'
      ],
      outputFormat: 'JSON object with secrets detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['secretsCount', 'highConfidence', 'findings', 'artifacts'],
      properties: {
        secretsCount: { type: 'number', description: 'Total secrets detected' },
        highConfidence: { type: 'number', description: 'High confidence findings' },
        mediumConfidence: { type: 'number' },
        lowConfidence: { type: 'number' },
        inCommitHistory: { type: 'boolean', description: 'Secrets found in commit history' },
        secretTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of secrets found'
        },
        exposedFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files containing secrets'
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', description: 'Secret type (api-key, password, etc.)' },
              file: { type: 'string' },
              line: { type: 'number' },
              commit: { type: 'string', description: 'Commit SHA if found in history' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              partialSecret: { type: 'string', description: 'Redacted secret preview' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              active: { type: 'boolean', description: 'Secret still in current code' }
            }
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
  labels: ['agent', 'security-scanning', 'secrets', 'credentials']
}));

// Phase 5: Container Scanning
export const containerScanningTask = defineTask('container-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Container Security Scanning - ${args.containerImage}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Security Specialist',
      task: 'Scan container images for vulnerabilities, misconfigurations, and security best practices',
      context: {
        projectName: args.projectName,
        containerImage: args.containerImage,
        severityThreshold: args.severityThreshold,
        scanLayers: args.scanLayers,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use container scanning tools:',
        '   - Trivy (comprehensive vulnerability scanner)',
        '   - Grype (vulnerability scanner)',
        '   - Clair (static analysis)',
        '   - Docker Scout',
        '   - Snyk Container',
        '2. Pull or access the container image',
        '3. Scan for OS package vulnerabilities:',
        '   - Scan base image OS packages (Alpine, Ubuntu, etc.)',
        '   - Check for outdated system libraries',
        '   - Identify vulnerable package versions',
        '4. Scan application dependencies in container:',
        '   - Language-specific dependencies',
        '   - Application libraries',
        '5. Analyze container configuration:',
        '   - Running as root user',
        '   - Exposed ports',
        '   - Environment variables',
        '   - Volumes and mounts',
        '6. Check Dockerfile best practices:',
        '   - Multi-stage builds',
        '   - Minimal base images',
        '   - Layer optimization',
        '   - No secrets in image',
        '7. Scan each image layer if enabled',
        '8. Check for malware and backdoors',
        '9. Verify image signatures and provenance',
        '10. Generate container security report',
        '11. Recommend updated base images and packages'
      ],
      outputFormat: 'JSON object with container scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesCount', 'critical', 'high', 'vulnerabilities', 'artifacts'],
      properties: {
        containerImage: { type: 'string' },
        vulnerabilitiesCount: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        baseImage: { type: 'string' },
        osPackagesScanned: { type: 'number' },
        layersScanned: { type: 'number' },
        imageSize: { type: 'string' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              cve: { type: 'string' },
              package: { type: 'string' },
              installedVersion: { type: 'string' },
              fixedVersion: { type: 'string' },
              severity: { type: 'string' },
              cvssScore: { type: 'number' },
              layer: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        configurationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        baseImageRecommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'container', 'docker']
}));

// Phase 6: IaC Scanning
export const iacScanningTask = defineTask('iac-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Infrastructure as Code (IaC) Scanning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Infrastructure as Code (IaC) Security Specialist',
      task: 'Scan IaC files for security misconfigurations and compliance violations',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        iacTypes: args.iacTypes,
        complianceStandards: args.complianceStandards,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use IaC scanning tools:',
        '   - Checkov (multi-cloud IaC scanner)',
        '   - tfsec (Terraform scanner)',
        '   - kube-score (Kubernetes scanner)',
        '   - cfn-nag (CloudFormation scanner)',
        '   - Terrascan (multi-IaC)',
        '2. Identify IaC files to scan:',
        '   - Terraform (.tf files)',
        '   - Kubernetes manifests (.yaml, .yml)',
        '   - CloudFormation templates',
        '   - Ansible playbooks',
        '   - Helm charts',
        '   - Docker Compose files',
        '3. Scan for security misconfigurations:',
        '   - Publicly exposed resources',
        '   - Unencrypted data stores',
        '   - Overly permissive IAM policies',
        '   - Missing security groups/firewalls',
        '   - Disabled logging and monitoring',
        '   - Insecure network configurations',
        '   - Hardcoded secrets and credentials',
        '   - Missing backup configurations',
        '4. Check compliance against standards:',
        '   - CIS Benchmarks (AWS, Azure, GCP, Kubernetes)',
        '   - PCI-DSS requirements',
        '   - HIPAA security rules',
        '   - SOC2 controls',
        '   - NIST frameworks',
        '5. Validate Kubernetes security:',
        '   - Pod security policies',
        '   - RBAC configurations',
        '   - Network policies',
        '   - Resource limits',
        '   - Security contexts',
        '6. Check cloud provider best practices',
        '7. Identify drift from security baselines',
        '8. Generate IaC security report',
        '9. Provide fix recommendations with code examples'
      ],
      outputFormat: 'JSON object with IaC scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['misconfigurationsCount', 'critical', 'high', 'misconfigurations', 'artifacts'],
      properties: {
        misconfigurationsCount: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        filesScanned: { type: 'number' },
        iacTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of IaC scanned'
        },
        misconfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              file: { type: 'string' },
              resource: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              complianceFrameworks: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        },
        topIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              count: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        complianceViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              control: { type: 'string' },
              violationCount: { type: 'number' }
            }
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
  labels: ['agent', 'security-scanning', 'iac', 'infrastructure']
}));

// Phase 7: DAST Scanning
export const dastScanningTask = defineTask('dast-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: DAST Scanning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dynamic Application Security Testing (DAST) Specialist',
      task: 'Perform runtime security testing by attacking the running application',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        authenticationType: args.authenticationType,
        testCredentials: args.testCredentials,
        scanDepth: args.scanDepth,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use DAST tools:',
        '   - OWASP ZAP (Zed Attack Proxy)',
        '   - Burp Suite',
        '   - Nuclei (template-based scanner)',
        '   - Arachni',
        '2. Configure scanner with application context:',
        '   - Application URL and scope',
        '   - Authentication mechanism',
        '   - Session handling',
        '   - Custom headers',
        '3. Spider/crawl the application to discover endpoints',
        '4. Perform active security scanning:',
        '   - SQL Injection attacks',
        '   - Cross-Site Scripting (XSS)',
        '   - Cross-Site Request Forgery (CSRF)',
        '   - Authentication bypass attempts',
        '   - Authorization/access control testing',
        '   - Session management flaws',
        '   - Server-Side Request Forgery (SSRF)',
        '   - XML External Entity (XXE)',
        '   - Insecure Direct Object Reference (IDOR)',
        '   - Security header analysis',
        '5. Test API endpoints if present',
        '6. Scan at configured depth (light/moderate/deep)',
        '7. Identify OWASP Top 10 vulnerabilities',
        '8. Generate DAST report with proof-of-concept requests',
        '9. Provide remediation guidance for each finding'
      ],
      outputFormat: 'JSON object with DAST scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointsTested', 'vulnerabilitiesCount', 'critical', 'high', 'vulnerabilities', 'artifacts'],
      properties: {
        endpointsTested: { type: 'number' },
        vulnerabilitiesCount: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        scanDuration: { type: 'number', description: 'Scan duration in seconds' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              method: { type: 'string' },
              parameter: { type: 'string' },
              owaspTop10: { type: 'string' },
              cwe: { type: 'string' },
              description: { type: 'string' },
              proofOfConcept: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        topIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              count: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        owaspTop10Coverage: {
          type: 'object',
          description: 'Which OWASP Top 10 categories were tested'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'dast', 'dynamic']
}));

// Phase 8: Compliance Validation
export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Compliance Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Compliance and Governance Specialist',
      task: 'Validate security posture against compliance standards and regulatory requirements',
      context: {
        projectName: args.projectName,
        complianceStandards: args.complianceStandards,
        scanResults: args.scanResults,
        allVulnerabilities: args.allVulnerabilities,
        assessmentResult: args.assessmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map scan findings to compliance requirements for each standard:',
        '   - OWASP Top 10: Web application security risks',
        '   - PCI-DSS: Payment card security (encryption, access control)',
        '   - GDPR: Data protection and privacy',
        '   - HIPAA: Healthcare data security',
        '   - SOC2: Security, availability, confidentiality',
        '   - CIS Benchmarks: Security configuration baselines',
        '   - NIST CSF: Cybersecurity framework controls',
        '2. For each compliance standard:',
        '   - List all applicable requirements/controls',
        '   - Check if technical controls are in place',
        '   - Validate configuration against benchmarks',
        '   - Identify gaps and violations',
        '3. Calculate compliance score per standard (% of controls met)',
        '4. Identify critical compliance failures',
        '5. Check for regulatory violations:',
        '   - Unencrypted sensitive data',
        '   - Missing audit logging',
        '   - Inadequate access controls',
        '   - Data retention violations',
        '6. Assess risk exposure for each violation',
        '7. Generate compliance report card',
        '8. Provide remediation roadmap to achieve compliance',
        '9. Document evidence for passed controls',
        '10. Create compliance attestation report'
      ],
      outputFormat: 'JSON object with compliance validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'passedCount', 'failedCount', 'totalChecks', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', description: 'Overall compliance percentage' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        totalChecks: { type: 'number' },
        passedStandards: {
          type: 'array',
          items: { type: 'string' },
          description: 'Standards meeting threshold'
        },
        failedStandards: {
          type: 'array',
          items: { type: 'string' },
          description: 'Standards not meeting threshold'
        },
        complianceByStandard: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              score: { type: 'number' },
              passedControls: { type: 'number' },
              failedControls: { type: 'number' },
              totalControls: { type: 'number' },
              criticalViolations: { type: 'number' }
            }
          }
        },
        failedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              control: { type: 'string' },
              requirement: { type: 'string' },
              severity: { type: 'string' },
              finding: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'compliance']
}));

// Phase 9: Vulnerability Prioritization
export const vulnerabilityPrioritizationTask = defineTask('vulnerability-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Vulnerability Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vulnerability Management and Risk Assessment Specialist',
      task: 'Deduplicate, prioritize, and triage vulnerabilities for remediation',
      context: {
        projectName: args.projectName,
        allVulnerabilities: args.allVulnerabilities,
        scanResults: args.scanResults,
        assessmentResult: args.assessmentResult,
        environmentType: args.environmentType,
        falsePositiveThreshold: args.falsePositiveThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deduplicate vulnerabilities:',
        '   - Same CVE across multiple scans (SAST, SCA, container)',
        '   - Same issue in multiple files/locations',
        '   - Related findings that are variants of same root cause',
        '2. Normalize severity levels across different tools',
        '3. Calculate risk scores for each vulnerability:',
        '   - Base CVSS score',
        '   - Exploitability (public exploits available?)',
        '   - Asset criticality (production vs. dev)',
        '   - Data sensitivity',
        '   - Attack surface exposure',
        '   - Patch availability',
        '4. Apply prioritization framework:',
        '   - Critical: Active exploits + production + high impact',
        '   - High: Known exploits OR production + high impact',
        '   - Medium: No known exploits + moderate impact',
        '   - Low: Informational or low impact',
        '5. Filter likely false positives based on:',
        '   - Low confidence scores',
        '   - Context analysis',
        '   - Historical false positive rate',
        '6. Group related vulnerabilities for efficient remediation',
        '7. Identify quick wins (easy fixes with high impact)',
        '8. Create prioritized remediation backlog',
        '9. Generate vulnerability prioritization report',
        '10. Provide timeline recommendations for each priority level'
      ],
      outputFormat: 'JSON object with prioritized vulnerabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['uniqueVulnerabilities', 'criticalCount', 'highCount', 'prioritizedVulnerabilities', 'artifacts'],
      properties: {
        uniqueVulnerabilities: { type: 'number', description: 'After deduplication' },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        mediumCount: { type: 'number' },
        lowCount: { type: 'number' },
        informationalCount: { type: 'number' },
        actionableCount: { type: 'number', description: 'Excluding false positives' },
        falsePositivesFiltered: { type: 'number' },
        prioritizedVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              riskScore: { type: 'number' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              source: { type: 'string', description: 'SAST, SCA, DAST, etc.' },
              cve: { type: 'string' },
              cvssScore: { type: 'number' },
              exploitAvailable: { type: 'boolean' },
              patchAvailable: { type: 'boolean' },
              assetCriticality: { type: 'string' },
              remediationEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              description: { type: 'string' },
              remediation: { type: 'string' },
              timeline: { type: 'string', description: 'Recommended fix timeline' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        groupedVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              count: { type: 'number' },
              commonRemediation: { type: 'string' }
            }
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
  labels: ['agent', 'security-scanning', 'prioritization']
}));

// Phase 10: Remediation Planning
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Remediation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Remediation and DevSecOps Automation Specialist',
      task: 'Generate automated remediation plan with actionable fix recommendations',
      context: {
        projectName: args.projectName,
        prioritizedVulnerabilities: args.prioritizedVulnerabilities,
        scanResults: args.scanResults,
        autoRemediation: args.autoRemediation,
        cicdIntegration: args.cicdIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each prioritized vulnerability, determine remediation approach:',
        '   - Auto-fixable: Can be fixed programmatically',
        '   - Patch available: Update to fixed version',
        '   - Configuration change: Modify settings',
        '   - Code change required: Manual developer fix',
        '   - Mitigation: Compensating controls',
        '2. Generate specific fix actions:',
        '   - SCA vulnerabilities: Package version upgrades',
        '   - Container vulnerabilities: Base image updates',
        '   - IaC misconfigurations: Terraform/K8s fixes',
        '   - Code vulnerabilities: Code patterns and examples',
        '   - Secrets: Rotation procedures',
        '3. Identify auto-fixable issues:',
        '   - Dependency version bumps (if no breaking changes)',
        '   - Simple configuration changes',
        '   - Automated code transformations',
        '4. Generate pull requests/patches for auto-fixes (if enabled)',
        '5. Create remediation tickets with:',
        '   - Issue description and impact',
        '   - Step-by-step fix instructions',
        '   - Code examples',
        '   - Testing requirements',
        '   - Validation criteria',
        '6. Estimate remediation effort (hours/days)',
        '7. Create remediation timeline by priority',
        '8. Identify dependencies between fixes',
        '9. Generate remediation plan document',
        '10. Track remediation progress metrics'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['totalActions', 'autoFixableCount', 'manualFixCount', 'actions', 'planPath', 'artifacts'],
      properties: {
        totalActions: { type: 'number' },
        autoFixableCount: { type: 'number' },
        manualFixCount: { type: 'number' },
        criticalActions: { type: 'number' },
        highActions: { type: 'number' },
        estimatedEffort: { type: 'string', description: 'Total estimated effort' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              actionId: { type: 'string' },
              vulnerabilityId: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'string' },
              type: { type: 'string', enum: ['auto-fix', 'patch', 'config-change', 'code-change', 'mitigation'] },
              category: { type: 'string' },
              autoFixable: { type: 'boolean' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              timeline: { type: 'string' },
              instructions: { type: 'string' },
              codeExample: { type: 'string' },
              testingRequirements: { type: 'string' },
              validationCriteria: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        autoFixPatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              patch: { type: 'string' },
              vulnerabilitiesFixed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            immediate: { type: 'number', description: 'Critical fixes needed immediately' },
            week1: { type: 'number' },
            month1: { type: 'number' },
            quarter1: { type: 'number' }
          }
        },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'remediation']
}));

// Phase 11: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: CI/CD Security Gates Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevSecOps and CI/CD Security Integration Specialist',
      task: 'Integrate security scanning into CI/CD pipelines with automated quality gates',
      context: {
        projectName: args.projectName,
        scanTypes: args.scanTypes,
        severityThreshold: args.severityThreshold,
        complianceStandards: args.complianceStandards,
        assessmentResult: args.assessmentResult,
        prioritizationResult: args.prioritizationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design CI/CD security gate strategy:',
        '   - Pre-commit hooks: Secrets detection, linting',
        '   - Pull request: SAST, SCA',
        '   - Build stage: Container scanning, IaC scanning',
        '   - Deploy stage: DAST, compliance validation',
        '2. Configure security tools for CI/CD:',
        '   - GitHub Actions',
        '   - GitLab CI/CD',
        '   - Jenkins',
        '   - CircleCI',
        '   - Azure DevOps',
        '3. Define quality gate thresholds:',
        '   - Fail build if: Critical vulnerabilities > 0',
        '   - Warn if: High vulnerabilities > threshold',
        '   - Block deployment if: Compliance score < 80%',
        '4. Generate pipeline configuration files:',
        '   - .github/workflows/security-scan.yml',
        '   - .gitlab-ci.yml security jobs',
        '   - Jenkinsfile security stages',
        '5. Configure scan result reporting:',
        '   - PR comments with findings',
        '   - Dashboard integration',
        '   - Notifications (Slack, email)',
        '6. Set up security badges for README',
        '7. Configure automated security checks:',
        '   - Branch protection rules',
        '   - Required status checks',
        '   - CODEOWNERS for security reviews',
        '8. Implement security metrics tracking',
        '9. Generate CI/CD integration documentation',
        '10. Provide rollout plan for gradual enforcement'
      ],
      outputFormat: 'JSON object with CI/CD integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'securityGates', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        securityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string', enum: ['pre-commit', 'pull-request', 'build', 'deploy'] },
              scans: { type: 'array', items: { type: 'string' } },
              thresholds: { type: 'object' },
              action: { type: 'string', enum: ['fail', 'warn', 'pass'] }
            }
          }
        },
        pipelineConfigs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              configFile: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        qualityGates: {
          type: 'object',
          properties: {
            criticalThreshold: { type: 'number' },
            highThreshold: { type: 'number' },
            complianceThreshold: { type: 'number' },
            failOn: { type: 'array', items: { type: 'string' } }
          }
        },
        integrations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Integrated tools and platforms'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'cicd', 'integration']
}));

// Phase 12: Continuous Monitoring
export const continuousMonitoringTask = defineTask('continuous-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Continuous Security Monitoring Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Security Monitoring Specialist',
      task: 'Set up automated continuous security monitoring and alerting',
      context: {
        projectName: args.projectName,
        scanTypes: args.scanTypes,
        scanSchedule: args.scanSchedule,
        notificationChannels: args.notificationChannels,
        severityThreshold: args.severityThreshold,
        assessmentResult: args.assessmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up scheduled security scans:',
        '   - Daily: SAST, SCA, secrets detection',
        '   - Weekly: Container scanning, IaC scanning',
        '   - Monthly: Full DAST, penetration testing',
        '2. Configure vulnerability monitoring:',
        '   - Subscribe to CVE feeds',
        '   - Monitor security advisories',
        '   - Track newly discovered vulnerabilities',
        '3. Set up alerting rules:',
        '   - Immediate alert: Critical vulnerabilities',
        '   - Daily digest: High/medium findings',
        '   - Weekly summary: All findings',
        '4. Configure notification channels:',
        '   - Email notifications',
        '   - Slack/Teams integration',
        '   - PagerDuty for critical issues',
        '   - Webhook integrations',
        '5. Implement security metrics dashboard:',
        '   - Security score trends',
        '   - Vulnerability counts over time',
        '   - Mean time to remediation (MTTR)',
        '   - Compliance status',
        '6. Set up automated triage:',
        '   - Auto-create tickets for new findings',
        '   - Auto-assign based on component ownership',
        '   - Auto-close false positives',
        '7. Configure baseline comparisons:',
        '   - Alert on security regression',
        '   - Track improvements',
        '8. Generate monitoring configuration',
        '9. Provide runbook for responding to alerts'
      ],
      outputFormat: 'JSON object with continuous monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'schedule', 'channels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        schedule: { type: 'string', description: 'Scan schedule configuration' },
        scanFrequency: {
          type: 'object',
          properties: {
            sast: { type: 'string' },
            sca: { type: 'string' },
            secrets: { type: 'string' },
            container: { type: 'string' },
            iac: { type: 'string' },
            dast: { type: 'string' }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              configured: { type: 'boolean' },
              config: { type: 'object' }
            }
          }
        },
        alertingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
            }
          }
        },
        dashboardUrl: { type: 'string' },
        automatedTriage: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'monitoring']
}));

// Phase 13: Security Reporting
export const securityReportingTask = defineTask('security-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Security Reporting and Dashboards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Reporting and Communications Specialist',
      task: 'Generate comprehensive security reports and visualizations',
      context: {
        projectName: args.projectName,
        assessmentResult: args.assessmentResult,
        scanResults: args.scanResults,
        complianceResult: args.complianceResult,
        prioritizationResult: args.prioritizationResult,
        remediationResult: args.remediationResult,
        allVulnerabilities: args.allVulnerabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate Executive Summary:',
        '   - Security score and grade',
        '   - Key findings and risks',
        '   - Compliance status',
        '   - Critical actions required',
        '   - Business impact assessment',
        '2. Create Detailed Security Report:',
        '   - Assessment methodology',
        '   - Scan results by type (SAST, SCA, DAST, etc.)',
        '   - Vulnerability breakdown by severity',
        '   - Compliance validation results',
        '   - Remediation recommendations',
        '   - Appendices with technical details',
        '3. Generate vulnerability catalog:',
        '   - Prioritized list of all findings',
        '   - Grouped by category and severity',
        '   - Include CVE references',
        '   - Remediation guidance',
        '4. Create security metrics dashboard:',
        '   - Security score gauge',
        '   - Vulnerability count by severity (bar chart)',
        '   - Compliance score by standard (radar chart)',
        '   - Scan coverage visualization',
        '   - Remediation progress tracker',
        '5. Generate compliance reports per standard',
        '6. Create security badges/shields for README',
        '7. Format reports in multiple formats:',
        '   - Markdown for documentation',
        '   - PDF for distribution',
        '   - JSON for automation',
        '   - HTML for dashboards',
        '8. Include visualizations and charts',
        '9. Document next steps and recommendations'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummaryPath', 'detailedReportPath', 'artifacts'],
      properties: {
        executiveSummaryPath: { type: 'string' },
        detailedReportPath: { type: 'string' },
        vulnerabilityCatalogPath: { type: 'string' },
        complianceReportsPath: { type: 'string' },
        dashboardUrl: { type: 'string' },
        executiveSummary: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            keyFindings: { type: 'array', items: { type: 'string' } },
            criticalActions: { type: 'array', items: { type: 'string' } },
            businessImpact: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        securityMetrics: {
          type: 'object',
          properties: {
            totalVulnerabilities: { type: 'number' },
            bySeverity: { type: 'object' },
            byCategory: { type: 'object' },
            scanCoverage: { type: 'number' },
            complianceScore: { type: 'number' }
          }
        },
        badges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              message: { type: 'string' },
              color: { type: 'string' },
              markdown: { type: 'string' }
            }
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
  labels: ['agent', 'security-scanning', 'reporting']
}));

// Phase 14: Security Scoring
export const securityScoringTask = defineTask('security-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Security Score Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Assessment and Risk Scoring Specialist',
      task: 'Calculate comprehensive security score and provide final assessment',
      context: {
        projectName: args.projectName,
        scanResults: args.scanResults,
        complianceResult: args.complianceResult,
        prioritizationResult: args.prioritizationResult,
        remediationResult: args.remediationResult,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted security score (0-100):',
        '   - Vulnerability severity impact (40% weight):',
        '     * Critical: -10 points each',
        '     * High: -5 points each',
        '     * Medium: -2 points each',
        '     * Low: -0.5 points each',
        '   - Compliance score (30% weight):',
        '     * Direct mapping from compliance percentage',
        '   - Scan coverage (15% weight):',
        '     * SAST, SCA, secrets, container, IaC, DAST coverage',
        '   - Remediation readiness (15% weight):',
        '     * Auto-fixable vulnerabilities bonus',
        '     * Patch availability',
        '     * Clear remediation plan',
        '2. Apply bonus factors:',
        '   - No critical vulnerabilities: +5 points',
        '   - High compliance score (>90%): +5 points',
        '   - Comprehensive scan coverage: +5 points',
        '3. Calculate security grade (A+ to F):',
        '   - A+: 95-100',
        '   - A: 90-94',
        '   - A-: 85-89',
        '   - B+: 80-84',
        '   - B: 75-79',
        '   - B-: 70-74',
        '   - C+: 65-69',
        '   - C: 60-64',
        '   - D: 50-59',
        '   - F: 0-49',
        '4. Assess production readiness',
        '5. Determine risk level (critical, high, medium, low)',
        '6. Provide overall verdict and recommendation',
        '7. Identify strengths and weaknesses',
        '8. Generate improvement roadmap',
        '9. Create security scorecard document',
        '10. Track score history and trends'
      ],
      outputFormat: 'JSON object with security scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['securityScore', 'grade', 'verdict', 'recommendation', 'scorecardPath', 'artifacts'],
      properties: {
        securityScore: { type: 'number', minimum: 0, maximum: 100 },
        grade: { type: 'string', description: 'A+ to F' },
        scoreBreakdown: {
          type: 'object',
          properties: {
            vulnerabilityImpact: { type: 'number' },
            complianceScore: { type: 'number' },
            scanCoverage: { type: 'number' },
            remediationReadiness: { type: 'number' },
            bonusPoints: { type: 'number' }
          }
        },
        productionReady: { type: 'boolean' },
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        verdict: { type: 'string', description: 'Overall assessment' },
        recommendation: { type: 'string', description: 'Next steps' },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        weaknesses: {
          type: 'array',
          items: { type: 'string' }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentScore: { type: 'number' },
              potentialScore: { type: 'number' },
              actions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scorecardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-scanning', 'scoring']
}));
