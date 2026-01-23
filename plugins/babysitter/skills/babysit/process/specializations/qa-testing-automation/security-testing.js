/**
 * @process specializations/qa-testing-automation/security-testing
 * @description Security Testing Automation - Comprehensive security testing framework covering OWASP Top 10,
 * vulnerability scanning, penetration testing, authentication/authorization testing, data security validation,
 * compliance verification, and security regression testing with automated quality gates and remediation tracking.
 * @inputs { projectName: string, applicationUrl: string, applicationType?: string, securityScans?: array, complianceStandards?: array, authenticationMethods?: array, severityThreshold?: string }
 * @outputs { success: boolean, securityScore: number, vulnerabilities: array, complianceStatus: object, securityReports: array, remediationPlan?: object }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/security-testing', {
 *   projectName: 'E-Commerce Platform',
 *   applicationUrl: 'https://staging.example.com',
 *   applicationType: 'web-application',
 *   securityScans: ['owasp-top-10', 'authentication', 'api-security', 'data-protection', 'infrastructure'],
 *   complianceStandards: ['OWASP', 'PCI-DSS', 'GDPR', 'SOC2'],
 *   authenticationMethods: ['jwt', 'oauth2', 'session'],
 *   severityThreshold: 'high',
 *   penTestingEnabled: true,
 *   staticAnalysisEnabled: true,
 *   dynamicAnalysisEnabled: true,
 *   apiSecurityEnabled: true
 * });
 *
 * @references
 * - OWASP Top 10: https://owasp.org/www-project-top-ten/
 * - OWASP API Security Top 10: https://owasp.org/www-project-api-security/
 * - OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
 * - NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
 * - CWE Top 25: https://cwe.mitre.org/top25/
 * - ZAP Documentation: https://www.zaproxy.org/docs/
 * - Burp Suite: https://portswigger.net/burp/documentation
 * - Security Headers: https://securityheaders.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    applicationType = 'web-application', // 'web-application', 'api', 'mobile', 'desktop'
    securityScans = ['owasp-top-10', 'authentication', 'api-security', 'data-protection', 'infrastructure'],
    complianceStandards = ['OWASP'],
    authenticationMethods = [],
    severityThreshold = 'high', // 'critical', 'high', 'medium', 'low'
    penTestingEnabled = false,
    staticAnalysisEnabled = true,
    dynamicAnalysisEnabled = true,
    apiSecurityEnabled = true,
    networkSecurityEnabled = false,
    containerSecurityEnabled = false,
    dependencySecurityEnabled = true,
    outputDir = 'security-testing-output',
    environmentType = 'staging',
    acceptanceCriteria = {
      maxCriticalVulnerabilities: 0,
      maxHighVulnerabilities: 0,
      maxMediumVulnerabilities: 5,
      securityScoreMinimum: 80,
      complianceRequired: true
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];
  let securityScore = 0;
  let complianceStatus = {};

  ctx.log('info', `Starting Security Testing Automation for ${projectName}`);
  ctx.log('info', `Application URL: ${applicationUrl}, Type: ${applicationType}`);
  ctx.log('info', `Security Scans: ${securityScans.join(', ')}`);
  ctx.log('info', `Compliance Standards: ${complianceStandards.join(', ')}`);

  // ============================================================================
  // PHASE 1: SECURITY REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing security requirements and threat model');

  const securityRequirements = await ctx.task(securityRequirementsAnalysisTask, {
    projectName,
    applicationUrl,
    applicationType,
    securityScans,
    complianceStandards,
    authenticationMethods,
    environmentType,
    outputDir
  });

  artifacts.push(...securityRequirements.artifacts);

  // Quality Gate: Requirements completeness
  if (!securityRequirements.requirementsComplete) {
    await ctx.breakpoint({
      question: `Security requirements analysis incomplete. Missing: ${securityRequirements.missingRequirements.join(', ')}. Review and complete requirements?`,
      title: 'Security Requirements Review',
      context: {
        runId: ctx.runId,
        missingRequirements: securityRequirements.missingRequirements,
        identifiedThreats: securityRequirements.identifiedThreats,
        threatLevel: securityRequirements.overallThreatLevel,
        recommendation: 'Complete security requirements and threat model before testing',
        files: securityRequirements.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: SECURITY TESTING ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up security testing environment and tools');

  const environmentSetup = await ctx.task(securityTestEnvironmentSetupTask, {
    projectName,
    applicationUrl,
    applicationType,
    securityScans,
    penTestingEnabled,
    staticAnalysisEnabled,
    dynamicAnalysisEnabled,
    outputDir
  });

  artifacts.push(...environmentSetup.artifacts);

  // Quality Gate: Environment readiness
  if (!environmentSetup.environmentReady) {
    await ctx.breakpoint({
      question: `Security testing environment not ready. Issues: ${environmentSetup.issues.join(', ')}. Resolve and continue?`,
      title: 'Security Environment Setup',
      context: {
        runId: ctx.runId,
        issues: environmentSetup.issues,
        toolsInstalled: environmentSetup.toolsInstalled,
        recommendation: 'Ensure all security testing tools are properly configured',
        files: environmentSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: RECONNAISSANCE AND ATTACK SURFACE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing reconnaissance and mapping attack surface');

  const reconnaissance = await ctx.task(reconnaissanceTask, {
    projectName,
    applicationUrl,
    applicationType,
    environmentSetup,
    outputDir
  });

  artifacts.push(...reconnaissance.artifacts);

  const attackSurface = reconnaissance.attackSurface;
  ctx.log('info', `Attack surface mapped: ${attackSurface.totalEndpoints} endpoints, ${attackSurface.totalForms} forms, ${attackSurface.totalInputs} inputs`);

  // ============================================================================
  // PHASE 4: STATIC APPLICATION SECURITY TESTING (SAST)
  // ============================================================================

  let sastResults = null;
  if (staticAnalysisEnabled) {
    ctx.log('info', 'Phase 4: Running Static Application Security Testing (SAST)');

    sastResults = await ctx.task(sastTask, {
      projectName,
      applicationUrl,
      applicationType,
      securityRequirements,
      outputDir
    });

    artifacts.push(...sastResults.artifacts);
    vulnerabilities.push(...sastResults.vulnerabilities);

    ctx.log('info', `SAST completed: ${sastResults.vulnerabilities.length} vulnerabilities found`);
  }

  // ============================================================================
  // PHASE 5: AUTHENTICATION AND SESSION MANAGEMENT TESTING
  // ============================================================================

  if (securityScans.includes('authentication')) {
    ctx.log('info', 'Phase 5: Testing authentication and session management');

    const authenticationTesting = await ctx.task(authenticationTestingTask, {
      projectName,
      applicationUrl,
      authenticationMethods,
      reconnaissance,
      environmentSetup,
      outputDir
    });

    artifacts.push(...authenticationTesting.artifacts);
    vulnerabilities.push(...authenticationTesting.vulnerabilities);

    // Quality Gate: Critical authentication vulnerabilities
    const criticalAuthVulns = authenticationTesting.vulnerabilities.filter(v => v.severity === 'critical').length;
    if (criticalAuthVulns > 0) {
      await ctx.breakpoint({
        question: `${criticalAuthVulns} critical authentication vulnerabilities detected! These pose immediate security risks. Review findings and address before continuing?`,
        title: 'Critical Authentication Vulnerabilities',
        context: {
          runId: ctx.runId,
          criticalVulnerabilities: authenticationTesting.vulnerabilities.filter(v => v.severity === 'critical'),
          authenticationScore: authenticationTesting.authenticationScore,
          recommendation: 'Fix critical authentication issues immediately',
          files: authenticationTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }

    ctx.log('info', `Authentication testing: ${authenticationTesting.vulnerabilities.length} issues, Score: ${authenticationTesting.authenticationScore}/100`);
  }

  // ============================================================================
  // PHASE 6: AUTHORIZATION AND ACCESS CONTROL TESTING
  // ============================================================================

  if (securityScans.includes('authorization')) {
    ctx.log('info', 'Phase 6: Testing authorization and access control');

    const authorizationTesting = await ctx.task(authorizationTestingTask, {
      projectName,
      applicationUrl,
      reconnaissance,
      authenticationMethods,
      environmentSetup,
      outputDir
    });

    artifacts.push(...authorizationTesting.artifacts);
    vulnerabilities.push(...authorizationTesting.vulnerabilities);

    ctx.log('info', `Authorization testing: ${authorizationTesting.vulnerabilities.length} issues found`);
  }

  // ============================================================================
  // PHASE 7: INPUT VALIDATION AND INJECTION TESTING
  // ============================================================================

  if (securityScans.includes('owasp-top-10')) {
    ctx.log('info', 'Phase 7: Testing input validation and injection vulnerabilities');

    const injectionTesting = await ctx.task(injectionTestingTask, {
      projectName,
      applicationUrl,
      attackSurface,
      reconnaissance,
      environmentSetup,
      outputDir
    });

    artifacts.push(...injectionTesting.artifacts);
    vulnerabilities.push(...injectionTesting.vulnerabilities);

    // Quality Gate: SQL Injection vulnerabilities
    const sqlInjectionVulns = injectionTesting.vulnerabilities.filter(v => v.type === 'SQL Injection').length;
    if (sqlInjectionVulns > 0) {
      await ctx.breakpoint({
        question: `${sqlInjectionVulns} SQL injection vulnerabilities detected! This is a critical security risk. Review and remediate immediately?`,
        title: 'SQL Injection Vulnerabilities Detected',
        context: {
          runId: ctx.runId,
          sqlInjectionVulnerabilities: injectionTesting.vulnerabilities.filter(v => v.type === 'SQL Injection'),
          totalInjectionVulns: injectionTesting.vulnerabilities.length,
          recommendation: 'SQL injection is a critical vulnerability that must be fixed',
          files: injectionTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }

    ctx.log('info', `Injection testing: ${injectionTesting.vulnerabilities.length} vulnerabilities found`);
  }

  // ============================================================================
  // PHASE 8: XSS AND CLIENT-SIDE SECURITY TESTING
  // ============================================================================

  if (securityScans.includes('owasp-top-10') && applicationType === 'web-application') {
    ctx.log('info', 'Phase 8: Testing for XSS and client-side vulnerabilities');

    const xssTesting = await ctx.task(xssTestingTask, {
      projectName,
      applicationUrl,
      attackSurface,
      reconnaissance,
      environmentSetup,
      outputDir
    });

    artifacts.push(...xssTesting.artifacts);
    vulnerabilities.push(...xssTesting.vulnerabilities);

    ctx.log('info', `XSS testing: ${xssTesting.vulnerabilities.length} vulnerabilities found`);
  }

  // ============================================================================
  // PHASE 9: API SECURITY TESTING
  // ============================================================================

  let apiSecurityResults = null;
  if (apiSecurityEnabled && securityScans.includes('api-security')) {
    ctx.log('info', 'Phase 9: Running API security testing (OWASP API Top 10)');

    apiSecurityResults = await ctx.task(apiSecurityTestingTask, {
      projectName,
      applicationUrl,
      reconnaissance,
      authenticationMethods,
      environmentSetup,
      outputDir
    });

    artifacts.push(...apiSecurityResults.artifacts);
    vulnerabilities.push(...apiSecurityResults.vulnerabilities);

    ctx.log('info', `API security: ${apiSecurityResults.vulnerabilities.length} vulnerabilities, Score: ${apiSecurityResults.apiSecurityScore}/100`);
  }

  // ============================================================================
  // PHASE 10: DYNAMIC APPLICATION SECURITY TESTING (DAST)
  // ============================================================================

  let dastResults = null;
  if (dynamicAnalysisEnabled && securityScans.includes('owasp-top-10')) {
    ctx.log('info', 'Phase 10: Running Dynamic Application Security Testing (DAST)');

    dastResults = await ctx.task(dastTask, {
      projectName,
      applicationUrl,
      applicationType,
      reconnaissance,
      environmentSetup,
      outputDir
    });

    artifacts.push(...dastResults.artifacts);
    vulnerabilities.push(...dastResults.vulnerabilities);

    ctx.log('info', `DAST completed: ${dastResults.vulnerabilities.length} vulnerabilities found`);
  }

  // ============================================================================
  // PHASE 11: CRYPTOGRAPHY AND DATA PROTECTION TESTING
  // ============================================================================

  if (securityScans.includes('data-protection')) {
    ctx.log('info', 'Phase 11: Testing cryptography and data protection');

    const cryptographyTesting = await ctx.task(cryptographyTestingTask, {
      projectName,
      applicationUrl,
      reconnaissance,
      complianceStandards,
      environmentSetup,
      outputDir
    });

    artifacts.push(...cryptographyTesting.artifacts);
    vulnerabilities.push(...cryptographyTesting.vulnerabilities);

    // Quality Gate: Weak cryptography
    const weakCryptoVulns = cryptographyTesting.vulnerabilities.filter(v =>
      v.type.includes('Weak') || v.type.includes('Insecure')
    ).length;

    if (weakCryptoVulns > 0) {
      await ctx.breakpoint({
        question: `${weakCryptoVulns} weak cryptography issues detected. These compromise data security. Review and strengthen?`,
        title: 'Weak Cryptography Detected',
        context: {
          runId: ctx.runId,
          weakCryptoVulnerabilities: cryptographyTesting.vulnerabilities.filter(v =>
            v.type.includes('Weak') || v.type.includes('Insecure')
          ),
          cryptographyScore: cryptographyTesting.cryptographyScore,
          files: cryptographyTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }

    ctx.log('info', `Cryptography testing: ${cryptographyTesting.vulnerabilities.length} issues, Score: ${cryptographyTesting.cryptographyScore}/100`);
  }

  // ============================================================================
  // PHASE 12: SECURITY CONFIGURATION AND HARDENING TESTING
  // ============================================================================

  if (securityScans.includes('infrastructure')) {
    ctx.log('info', 'Phase 12: Testing security configuration and hardening');

    const configurationTesting = await ctx.task(configurationTestingTask, {
      projectName,
      applicationUrl,
      applicationType,
      reconnaissance,
      environmentSetup,
      outputDir
    });

    artifacts.push(...configurationTesting.artifacts);
    vulnerabilities.push(...configurationTesting.vulnerabilities);

    ctx.log('info', `Configuration testing: ${configurationTesting.vulnerabilities.length} issues found`);
  }

  // ============================================================================
  // PHASE 13: DEPENDENCY AND SUPPLY CHAIN SECURITY
  // ============================================================================

  let dependencyResults = null;
  if (dependencySecurityEnabled) {
    ctx.log('info', 'Phase 13: Scanning dependencies for known vulnerabilities');

    dependencyResults = await ctx.task(dependencySecurityTask, {
      projectName,
      applicationUrl,
      applicationType,
      securityRequirements,
      outputDir
    });

    artifacts.push(...dependencyResults.artifacts);
    vulnerabilities.push(...dependencyResults.vulnerabilities);

    ctx.log('info', `Dependency scan: ${dependencyResults.vulnerabilities.length} vulnerable dependencies found`);
  }

  // ============================================================================
  // PHASE 14: BUSINESS LOGIC AND WORKFLOW SECURITY TESTING
  // ============================================================================

  if (securityScans.includes('business-logic')) {
    ctx.log('info', 'Phase 14: Testing business logic and workflow security');

    const businessLogicTesting = await ctx.task(businessLogicTestingTask, {
      projectName,
      applicationUrl,
      reconnaissance,
      securityRequirements,
      environmentSetup,
      outputDir
    });

    artifacts.push(...businessLogicTesting.artifacts);
    vulnerabilities.push(...businessLogicTesting.vulnerabilities);

    ctx.log('info', `Business logic testing: ${businessLogicTesting.vulnerabilities.length} issues found`);
  }

  // ============================================================================
  // PHASE 15: PENETRATION TESTING (if enabled)
  // ============================================================================

  let penTestResults = null;
  if (penTestingEnabled) {
    ctx.log('info', 'Phase 15: Conducting penetration testing');

    penTestResults = await ctx.task(penetrationTestingTask, {
      projectName,
      applicationUrl,
      applicationType,
      reconnaissance,
      securityRequirements,
      environmentSetup,
      outputDir
    });

    artifacts.push(...penTestResults.artifacts);
    vulnerabilities.push(...penTestResults.vulnerabilities);

    ctx.log('info', `Penetration testing: ${penTestResults.vulnerabilities.length} exploitable vulnerabilities found`);

    // Quality Gate: Exploitable vulnerabilities
    const exploitableVulns = penTestResults.vulnerabilities.filter(v => v.exploitable).length;
    if (exploitableVulns > 0) {
      await ctx.breakpoint({
        question: `${exploitableVulns} exploitable vulnerabilities found during penetration testing! These can be actively exploited. Review exploitation details and remediate?`,
        title: 'Exploitable Vulnerabilities Found',
        context: {
          runId: ctx.runId,
          exploitableVulnerabilities: penTestResults.vulnerabilities.filter(v => v.exploitable),
          exploitationComplexity: penTestResults.exploitationComplexity,
          recommendation: 'Fix exploitable vulnerabilities with highest priority',
          files: penTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 16: VULNERABILITY DEDUPLICATION AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Deduplicating and prioritizing vulnerabilities');

  const vulnerabilityAnalysis = await ctx.task(vulnerabilityAnalysisTask, {
    projectName,
    vulnerabilities,
    securityRequirements,
    complianceStandards,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...vulnerabilityAnalysis.artifacts);

  const prioritizedVulnerabilities = vulnerabilityAnalysis.prioritizedVulnerabilities;
  securityScore = vulnerabilityAnalysis.securityScore;

  const criticalCount = prioritizedVulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = prioritizedVulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = prioritizedVulnerabilities.filter(v => v.severity === 'medium').length;

  ctx.log('info', `Vulnerability analysis: ${prioritizedVulnerabilities.length} unique vulnerabilities`);
  ctx.log('info', `Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}`);
  ctx.log('info', `Security score: ${securityScore}/100`);

  // Quality Gate: Critical vulnerability count
  if (criticalCount > acceptanceCriteria.maxCriticalVulnerabilities) {
    await ctx.breakpoint({
      question: `${criticalCount} critical vulnerabilities exceed threshold (${acceptanceCriteria.maxCriticalVulnerabilities}). Security score: ${securityScore}/100. Review and remediate critical issues?`,
      title: 'Critical Vulnerabilities Exceed Threshold',
      context: {
        runId: ctx.runId,
        criticalCount,
        maxAllowed: acceptanceCriteria.maxCriticalVulnerabilities,
        securityScore,
        topCriticalVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'critical').slice(0, 10),
        recommendation: 'Critical vulnerabilities must be fixed before production deployment',
        files: vulnerabilityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: High vulnerability count
  if (highCount > acceptanceCriteria.maxHighVulnerabilities) {
    await ctx.breakpoint({
      question: `${highCount} high-severity vulnerabilities exceed threshold (${acceptanceCriteria.maxHighVulnerabilities}). Review and create remediation plan?`,
      title: 'High Severity Vulnerabilities',
      context: {
        runId: ctx.runId,
        highCount,
        maxAllowed: acceptanceCriteria.maxHighVulnerabilities,
        securityScore,
        topHighVulnerabilities: prioritizedVulnerabilities.filter(v => v.severity === 'high').slice(0, 10),
        files: vulnerabilityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 17: COMPLIANCE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Verifying compliance with security standards');

  const complianceVerification = await ctx.task(complianceVerificationTask, {
    projectName,
    complianceStandards,
    prioritizedVulnerabilities,
    securityScore,
    sastResults,
    dastResults,
    apiSecurityResults,
    outputDir
  });

  artifacts.push(...complianceVerification.artifacts);
  complianceStatus = complianceVerification.complianceStatus;

  // Quality Gate: Compliance requirement
  if (acceptanceCriteria.complianceRequired && !complianceVerification.allCompliant) {
    await ctx.breakpoint({
      question: `Compliance verification failed for: ${complianceVerification.failedStandards.join(', ')}. Compliance is required. Review gaps and remediate?`,
      title: 'Compliance Requirements Not Met',
      context: {
        runId: ctx.runId,
        complianceStatus,
        failedStandards: complianceVerification.failedStandards,
        complianceGaps: complianceVerification.complianceGaps,
        recommendation: 'Address compliance gaps before production',
        files: complianceVerification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  ctx.log('info', `Compliance: ${Object.keys(complianceStatus).length} standards checked`);

  // ============================================================================
  // PHASE 18: SECURITY REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 18: Generating comprehensive security reports');

  const securityReporting = await ctx.task(securityReportingTask, {
    projectName,
    applicationUrl,
    applicationType,
    securityScore,
    prioritizedVulnerabilities,
    complianceStatus,
    securityRequirements,
    sastResults,
    dastResults,
    apiSecurityResults,
    penTestResults,
    dependencyResults,
    reconnaissance,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...securityReporting.artifacts);

  const securityReports = securityReporting.reports;

  // ============================================================================
  // PHASE 19: REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 19: Creating security remediation plan');

  const remediationPlanning = await ctx.task(remediationPlanningTask, {
    projectName,
    prioritizedVulnerabilities,
    securityScore,
    complianceStatus,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...remediationPlanning.artifacts);

  const remediationPlan = remediationPlanning.remediationPlan;

  // Breakpoint: Review remediation plan
  await ctx.breakpoint({
    question: `Remediation plan created with ${remediationPlan.totalTasks} tasks (${remediationPlan.criticalTasks} critical). Estimated effort: ${remediationPlan.estimatedEffort}. Review and approve plan?`,
    title: 'Security Remediation Plan Review',
    context: {
      runId: ctx.runId,
      remediationSummary: {
        totalTasks: remediationPlan.totalTasks,
        criticalTasks: remediationPlan.criticalTasks,
        highTasks: remediationPlan.highTasks,
        estimatedEffort: remediationPlan.estimatedEffort,
        expectedScoreImprovement: remediationPlan.expectedScoreImprovement
      },
      quickWins: remediationPlan.quickWins,
      criticalRemediations: remediationPlan.tasks.filter(t => t.priority === 'critical').slice(0, 10),
      files: [
        { path: remediationPlanning.planPath, format: 'markdown', label: 'Remediation Plan' },
        { path: remediationPlanning.taskListPath, format: 'json', label: 'Task List' }
      ]
    }
  });

  // ============================================================================
  // PHASE 20: SECURITY GATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 20: Final security gate assessment');

  const finalAssessment = await ctx.task(securityGateAssessmentTask, {
    projectName,
    securityScore,
    prioritizedVulnerabilities,
    complianceStatus,
    acceptanceCriteria,
    remediationPlan,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  const securityGatePassed = finalAssessment.securityGatePassed;
  const productionReady = finalAssessment.productionReady;

  // Final Breakpoint: Security approval
  await ctx.breakpoint({
    question: `Security Testing Complete for ${projectName}. Security Score: ${securityScore}/100. Gate: ${securityGatePassed ? 'PASSED' : 'FAILED'}. Production Ready: ${productionReady ? 'YES' : 'NO'}. ${finalAssessment.verdict}. Approve for deployment?`,
    title: 'Final Security Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        securityScore,
        securityGatePassed,
        productionReady,
        totalVulnerabilities: prioritizedVulnerabilities.length,
        criticalVulnerabilities: criticalCount,
        highVulnerabilities: highCount,
        mediumVulnerabilities: mediumCount,
        complianceStandards: Object.keys(complianceStatus).length,
        complianceAchieved: complianceVerification.allCompliant
      },
      acceptanceCriteria,
      acceptanceCriteriaMet: finalAssessment.acceptanceCriteriaMet,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      riskLevel: finalAssessment.riskLevel,
      blockingIssues: finalAssessment.blockingIssues,
      files: [
        { path: securityReporting.executiveReportPath, format: 'pdf', label: 'Executive Security Report' },
        { path: securityReporting.technicalReportPath, format: 'html', label: 'Technical Security Report' },
        { path: vulnerabilityAnalysis.reportPath, format: 'json', label: 'Vulnerability Report' },
        { path: complianceVerification.reportPath, format: 'markdown', label: 'Compliance Report' },
        { path: remediationPlanning.planPath, format: 'markdown', label: 'Remediation Plan' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    applicationUrl,
    applicationType,
    securityScore,
    securityGatePassed,
    productionReady,
    vulnerabilities: {
      total: prioritizedVulnerabilities.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: prioritizedVulnerabilities.filter(v => v.severity === 'low').length,
      details: prioritizedVulnerabilities
    },
    securityTestResults: {
      sast: sastResults ? {
        vulnerabilitiesFound: sastResults.vulnerabilities.length,
        toolsUsed: sastResults.toolsUsed
      } : null,
      dast: dastResults ? {
        vulnerabilitiesFound: dastResults.vulnerabilities.length,
        coveragePercent: dastResults.coveragePercent
      } : null,
      apiSecurity: apiSecurityResults ? {
        vulnerabilitiesFound: apiSecurityResults.vulnerabilities.length,
        apiSecurityScore: apiSecurityResults.apiSecurityScore
      } : null,
      penetrationTesting: penTestResults ? {
        vulnerabilitiesFound: penTestResults.vulnerabilities.length,
        exploitableCount: penTestResults.vulnerabilities.filter(v => v.exploitable).length
      } : null,
      dependencyScan: dependencyResults ? {
        vulnerableDependencies: dependencyResults.vulnerabilities.length,
        totalDependencies: dependencyResults.totalDependencies
      } : null
    },
    complianceStatus: {
      standards: complianceStatus,
      allCompliant: complianceVerification.allCompliant,
      failedStandards: complianceVerification.failedStandards,
      complianceScore: complianceVerification.complianceScore
    },
    securityReports: securityReports.map(r => ({
      name: r.name,
      type: r.type,
      path: r.path
    })),
    remediationPlan: {
      totalTasks: remediationPlan.totalTasks,
      criticalTasks: remediationPlan.criticalTasks,
      highTasks: remediationPlan.highTasks,
      estimatedEffort: remediationPlan.estimatedEffort,
      expectedScoreImprovement: remediationPlan.expectedScoreImprovement,
      planPath: remediationPlanning.planPath
    },
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      riskLevel: finalAssessment.riskLevel,
      blockingIssues: finalAssessment.blockingIssues,
      acceptanceCriteriaMet: finalAssessment.acceptanceCriteriaMet,
      reportPath: finalAssessment.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/security-testing',
      timestamp: startTime,
      applicationType,
      environmentType,
      securityScans,
      complianceStandards,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Security Requirements Analysis
export const securityRequirementsAnalysisTask = defineTask('security-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Security Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Architect and Threat Modeling Expert',
      task: 'Analyze security requirements and create comprehensive threat model',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        securityScans: args.securityScans,
        complianceStandards: args.complianceStandards,
        authenticationMethods: args.authenticationMethods,
        environmentType: args.environmentType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze application type and identify security requirements',
        '2. Review required compliance standards (OWASP, PCI-DSS, GDPR, etc.)',
        '3. Create threat model using STRIDE or similar methodology',
        '4. Identify assets, entry points, and trust boundaries',
        '5. Document potential threats and attack vectors',
        '6. Assess overall threat level and risk rating',
        '7. Define security testing scope and priorities',
        '8. Identify authentication and authorization requirements',
        '9. Document data protection requirements',
        '10. Create security test strategy aligned with threats',
        '11. Identify any missing requirements',
        '12. Generate threat model document and security requirements specification'
      ],
      outputFormat: 'JSON object with security requirements and threat model'
    },
    outputSchema: {
      type: 'object',
      required: ['requirementsComplete', 'identifiedThreats', 'overallThreatLevel', 'artifacts'],
      properties: {
        requirementsComplete: { type: 'boolean' },
        securityObjectives: {
          type: 'array',
          items: { type: 'string' }
        },
        identifiedThreats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              threat: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              riskRating: { type: 'string' }
            }
          }
        },
        overallThreatLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        entryPoints: { type: 'array', items: { type: 'string' } },
        trustBoundaries: { type: 'array', items: { type: 'string' } },
        attackVectors: { type: 'array', items: { type: 'string' } },
        missingRequirements: { type: 'array', items: { type: 'string' } },
        testStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'requirements', 'threat-modeling']
}));

// Phase 2: Security Test Environment Setup
export const securityTestEnvironmentSetupTask = defineTask('security-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Security Test Environment Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Testing Infrastructure Engineer',
      task: 'Set up comprehensive security testing environment and tools',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        securityScans: args.securityScans,
        penTestingEnabled: args.penTestingEnabled,
        staticAnalysisEnabled: args.staticAnalysisEnabled,
        dynamicAnalysisEnabled: args.dynamicAnalysisEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install OWASP ZAP for dynamic security scanning',
        '2. Set up Burp Suite Community Edition (if needed)',
        '3. Install dependency scanning tools (npm audit, Snyk, OWASP Dependency-Check)',
        '4. Configure static analysis tools (SonarQube, Semgrep, ESLint security plugins)',
        '5. Set up security header analysis tools',
        '6. Install SSL/TLS testing tools (testssl.sh)',
        '7. Configure API security testing tools (OWASP API Security)',
        '8. Set up authentication testing utilities',
        '9. Install fuzzing tools if needed',
        '10. Configure security scanning profiles and policies',
        '11. Validate tool installations and configurations',
        '12. Create security testing documentation',
        '13. Return environment setup status'
      ],
      outputFormat: 'JSON object with environment setup confirmation'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentReady', 'toolsInstalled', 'issues', 'artifacts'],
      properties: {
        environmentReady: { type: 'boolean' },
        toolsInstalled: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              purpose: { type: 'string' },
              ready: { type: 'boolean' }
            }
          }
        },
        scanningProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tool: { type: 'string' },
              configPath: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'environment-setup', 'tools']
}));

// Phase 3: Reconnaissance
export const reconnaissanceTask = defineTask('reconnaissance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Reconnaissance and Attack Surface Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Reconnaissance Specialist',
      task: 'Perform reconnaissance and map application attack surface',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Spider/crawl the application to discover all pages and endpoints',
        '2. Identify all forms, input fields, and parameters',
        '3. Map API endpoints and methods',
        '4. Identify authentication and session management mechanisms',
        '5. Discover file upload functionality',
        '6. Map application architecture and technology stack',
        '7. Identify third-party integrations and dependencies',
        '8. Discover hidden or administrative pages',
        '9. Map client-side JavaScript and AJAX calls',
        '10. Identify websockets and real-time communication',
        '11. Document content security policies',
        '12. Create comprehensive attack surface map',
        '13. Generate reconnaissance report'
      ],
      outputFormat: 'JSON object with attack surface details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'attackSurface', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        attackSurface: {
          type: 'object',
          properties: {
            totalEndpoints: { type: 'number' },
            totalForms: { type: 'number' },
            totalInputs: { type: 'number' },
            totalParameters: { type: 'number' }
          }
        },
        discoveredEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              method: { type: 'string' },
              parameters: { type: 'array' },
              authRequired: { type: 'boolean' }
            }
          }
        },
        forms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              inputs: { type: 'array' },
              method: { type: 'string' }
            }
          }
        },
        technologyStack: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            server: { type: 'string' },
            database: { type: 'string' },
            languages: { type: 'array' }
          }
        },
        authenticationMechanisms: { type: 'array', items: { type: 'string' } },
        thirdPartyServices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'reconnaissance', 'attack-surface']
}));

// Phase 4: SAST
export const sastTask = defineTask('sast', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Static Application Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Static Code Security Analyst',
      task: 'Perform static application security testing to identify code vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        securityRequirements: args.securityRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run static code analysis tools (SonarQube, Semgrep, ESLint security)',
        '2. Scan for hardcoded secrets and credentials',
        '3. Identify SQL injection vulnerabilities in code',
        '4. Detect XSS vulnerabilities in templates and rendering',
        '5. Find insecure cryptographic implementations',
        '6. Identify path traversal vulnerabilities',
        '7. Detect command injection risks',
        '8. Find insecure deserialization',
        '9. Identify weak random number generation',
        '10. Scan for security misconfigurations in code',
        '11. Categorize findings by severity (CWE classification)',
        '12. Generate SAST report with code locations and remediation',
        '13. Return vulnerabilities with source code references'
      ],
      outputFormat: 'JSON object with SAST results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'toolsUsed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              cwe: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              codeSnippet: { type: 'string' }
            }
          }
        },
        toolsUsed: { type: 'array', items: { type: 'string' } },
        filesScanned: { type: 'number' },
        linesOfCode: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'sast', 'static-analysis']
}));

// Phase 5: Authentication Testing
export const authenticationTestingTask = defineTask('authentication-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Authentication and Session Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Authentication Security Specialist',
      task: 'Test authentication mechanisms and session management for vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        authenticationMethods: args.authenticationMethods,
        reconnaissance: args.reconnaissance,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test for default or weak credentials',
        '2. Test password policy strength',
        '3. Test for brute force protection',
        '4. Test account lockout mechanisms',
        '5. Test password reset functionality for vulnerabilities',
        '6. Test session token generation and randomness',
        '7. Test for session fixation vulnerabilities',
        '8. Test session timeout and expiration',
        '9. Test for insecure session transmission (non-HTTPS)',
        '10. Test logout functionality completeness',
        '11. Test multi-factor authentication (if present)',
        '12. Test JWT security (signature verification, expiration)',
        '13. Test OAuth/OIDC implementation security',
        '14. Test remember me functionality',
        '15. Calculate authentication security score',
        '16. Generate authentication testing report'
      ],
      outputFormat: 'JSON object with authentication test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'authenticationScore', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        authenticationScore: { type: 'number', minimum: 0, maximum: 100 },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        passwordPolicyStrength: { type: 'string', enum: ['weak', 'moderate', 'strong'] },
        sessionSecurityScore: { type: 'number' },
        mfaImplemented: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'authentication', 'session-management']
}));

// Phase 6: Authorization Testing
export const authorizationTestingTask = defineTask('authorization-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Authorization and Access Control Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Access Control Security Expert',
      task: 'Test authorization mechanisms and access control for privilege escalation vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        reconnaissance: args.reconnaissance,
        authenticationMethods: args.authenticationMethods,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test for horizontal privilege escalation (access other users data)',
        '2. Test for vertical privilege escalation (user to admin)',
        '3. Test IDOR (Insecure Direct Object References)',
        '4. Test forced browsing to restricted pages',
        '5. Test path traversal for unauthorized file access',
        '6. Test role-based access control (RBAC) enforcement',
        '7. Test parameter manipulation for privilege escalation',
        '8. Test API endpoint authorization',
        '9. Test for missing function level access control',
        '10. Test file upload authorization',
        '11. Test admin interface protection',
        '12. Generate authorization vulnerability report'
      ],
      outputFormat: 'JSON object with authorization test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              exploitScenario: { type: 'string' }
            }
          }
        },
        idorVulnerabilities: { type: 'number' },
        privilegeEscalationRisk: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'authorization', 'access-control']
}));

// Phase 7: Injection Testing
export const injectionTestingTask = defineTask('injection-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Injection Vulnerability Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Injection Vulnerability Specialist',
      task: 'Test for SQL injection, command injection, and other injection vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        attackSurface: args.attackSurface,
        reconnaissance: args.reconnaissance,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test all input parameters for SQL injection (error-based, blind, time-based)',
        '2. Test for NoSQL injection vulnerabilities',
        '3. Test for OS command injection',
        '4. Test for LDAP injection',
        '5. Test for XML injection and XXE (XML External Entity)',
        '6. Test for template injection (SSTI)',
        '7. Test for code injection',
        '8. Test for CRLF injection',
        '9. Test for log injection',
        '10. Use automated scanners and manual testing',
        '11. Validate input sanitization and parameterized queries',
        '12. Generate injection vulnerability report with PoC'
      ],
      outputFormat: 'JSON object with injection test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              parameter: { type: 'string' },
              payload: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              proofOfConcept: { type: 'string' }
            }
          }
        },
        testedParameters: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'injection', 'sql-injection']
}));

// Phase 8: XSS Testing
export const xssTestingTask = defineTask('xss-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: XSS and Client-Side Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Client-Side Security Expert',
      task: 'Test for Cross-Site Scripting (XSS) and other client-side vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        attackSurface: args.attackSurface,
        reconnaissance: args.reconnaissance,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test for reflected XSS in all input parameters',
        '2. Test for stored XSS in user-generated content',
        '3. Test for DOM-based XSS',
        '4. Test for JavaScript injection',
        '5. Test Content Security Policy (CSP) effectiveness',
        '6. Test for clickjacking vulnerabilities',
        '7. Test for open redirects',
        '8. Test for Cross-Site Request Forgery (CSRF)',
        '9. Test for insecure CORS configuration',
        '10. Test for postMessage vulnerabilities',
        '11. Test for prototype pollution',
        '12. Generate XSS vulnerability report with payloads'
      ],
      outputFormat: 'JSON object with XSS test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              parameter: { type: 'string' },
              payload: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        cspImplemented: { type: 'boolean' },
        cspStrength: { type: 'string', enum: ['none', 'weak', 'moderate', 'strong'] },
        csrfProtectionPresent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'xss', 'client-side']
}));

// Phase 9: API Security Testing
export const apiSecurityTestingTask = defineTask('api-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: API Security Testing (OWASP API Top 10) - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Security Specialist',
      task: 'Test API security following OWASP API Security Top 10',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        reconnaissance: args.reconnaissance,
        authenticationMethods: args.authenticationMethods,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test for Broken Object Level Authorization (BOLA/IDOR)',
        '2. Test for Broken User Authentication',
        '3. Test for Excessive Data Exposure',
        '4. Test for Lack of Resources & Rate Limiting',
        '5. Test for Broken Function Level Authorization',
        '6. Test for Mass Assignment',
        '7. Test for Security Misconfiguration',
        '8. Test for Injection vulnerabilities in APIs',
        '9. Test for Improper Assets Management',
        '10. Test for Insufficient Logging & Monitoring',
        '11. Test API versioning and deprecated endpoints',
        '12. Test API rate limiting and throttling',
        '13. Calculate API security score',
        '14. Generate API security report aligned with OWASP API Top 10'
      ],
      outputFormat: 'JSON object with API security test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'apiSecurityScore', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        apiSecurityScore: { type: 'number', minimum: 0, maximum: 100 },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              owaspCategory: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              endpoint: { type: 'string' },
              method: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        owaspApiTop10Coverage: {
          type: 'object',
          description: 'Coverage of OWASP API Top 10 categories'
        },
        rateLimitingPresent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'api-security', 'owasp-api-top-10']
}));

// Phase 10: DAST
export const dastTask = defineTask('dast', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Dynamic Application Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dynamic Security Testing Specialist',
      task: 'Perform dynamic application security testing using automated scanners',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        reconnaissance: args.reconnaissance,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run OWASP ZAP active scan',
        '2. Configure scan policy for comprehensive coverage',
        '3. Scan for OWASP Top 10 vulnerabilities',
        '4. Test for directory traversal',
        '5. Test for file inclusion vulnerabilities',
        '6. Test for server-side request forgery (SSRF)',
        '7. Test for XML External Entity (XXE)',
        '8. Test for security header misconfigurations',
        '9. Test SSL/TLS configuration',
        '10. Test for information disclosure',
        '11. Analyze and deduplicate findings',
        '12. Generate DAST report with vulnerability details'
      ],
      outputFormat: 'JSON object with DAST results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'coveragePercent', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              cwe: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        coveragePercent: { type: 'number' },
        urlsTested: { type: 'number' },
        scanDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'dast', 'dynamic-analysis']
}));

// Phase 11: Cryptography Testing
export const cryptographyTestingTask = defineTask('cryptography-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Cryptography and Data Protection Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cryptography and Data Security Expert',
      task: 'Test cryptographic implementations and data protection mechanisms',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        reconnaissance: args.reconnaissance,
        complianceStandards: args.complianceStandards,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test SSL/TLS configuration (protocol versions, cipher suites)',
        '2. Test for weak or outdated encryption algorithms',
        '3. Test certificate validity and chain of trust',
        '4. Test for insecure password storage (plaintext, weak hashing)',
        '5. Test for sensitive data exposure in transit',
        '6. Test for sensitive data exposure at rest',
        '7. Test for sensitive data in logs or error messages',
        '8. Test cryptographic key management',
        '9. Test random number generation quality',
        '10. Test for PII/PHI data protection compliance',
        '11. Calculate cryptography security score',
        '12. Generate cryptography and data protection report'
      ],
      outputFormat: 'JSON object with cryptography test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cryptographyScore', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cryptographyScore: { type: 'number', minimum: 0, maximum: 100 },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        tlsConfiguration: {
          type: 'object',
          properties: {
            grade: { type: 'string' },
            protocols: { type: 'array' },
            weakCiphers: { type: 'array' }
          }
        },
        sensitiveDataExposure: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'cryptography', 'data-protection']
}));

// Phase 12: Configuration Testing
export const configurationTestingTask = defineTask('configuration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Security Configuration Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Configuration Specialist',
      task: 'Test security configuration and hardening',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        reconnaissance: args.reconnaissance,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)',
        '2. Test for default or example pages',
        '3. Test for directory listing',
        '4. Test for unnecessary HTTP methods enabled',
        '5. Test for verbose error messages',
        '6. Test for administrative interfaces exposed',
        '7. Test CORS configuration',
        '8. Test cookie security attributes',
        '9. Test for unnecessary services running',
        '10. Test file upload restrictions',
        '11. Test for security.txt or bug bounty program',
        '12. Generate configuration security report'
      ],
      outputFormat: 'JSON object with configuration test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        securityHeaders: {
          type: 'object',
          properties: {
            present: { type: 'array' },
            missing: { type: 'array' },
            score: { type: 'number' }
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
  labels: ['agent', 'security-testing', 'configuration', 'hardening']
}));

// Phase 13: Dependency Security
export const dependencySecurityTask = defineTask('dependency-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Dependency and Supply Chain Security - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Supply Chain Security Analyst',
      task: 'Scan dependencies for known vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        securityRequirements: args.securityRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run npm audit or equivalent dependency scanner',
        '2. Scan with OWASP Dependency-Check',
        '3. Scan with Snyk or similar SCA tool',
        '4. Identify vulnerable dependencies with CVEs',
        '5. Check for outdated dependencies',
        '6. Identify license compliance issues',
        '7. Check for typosquatting or malicious packages',
        '8. Assess transitive dependency risks',
        '9. Generate dependency vulnerability report',
        '10. Provide upgrade recommendations',
        '11. Calculate supply chain risk score'
      ],
      outputFormat: 'JSON object with dependency scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'totalDependencies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              package: { type: 'string' },
              version: { type: 'string' },
              severity: { type: 'string' },
              cve: { type: 'string' },
              description: { type: 'string' },
              fixedIn: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        totalDependencies: { type: 'number' },
        outdatedDependencies: { type: 'number' },
        supplyChainRiskScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'dependency-scan', 'supply-chain']
}));

// Phase 14: Business Logic Testing
export const businessLogicTestingTask = defineTask('business-logic-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Business Logic Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Logic Security Expert',
      task: 'Test business logic and workflow security vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        reconnaissance: args.reconnaissance,
        securityRequirements: args.securityRequirements,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test for workflow bypass vulnerabilities',
        '2. Test for price/quantity manipulation',
        '3. Test for race conditions in critical operations',
        '4. Test for payment bypass vulnerabilities',
        '5. Test for coupon/discount abuse',
        '6. Test for duplicate transaction handling',
        '7. Test for negative quantity/amount handling',
        '8. Test for state transition bypasses',
        '9. Test for privilege escalation through workflows',
        '10. Test for improper sequence validation',
        '11. Generate business logic vulnerability report'
      ],
      outputFormat: 'JSON object with business logic test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              workflow: { type: 'string' },
              description: { type: 'string' },
              businessImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        criticalWorkflowsSecure: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'business-logic']
}));

// Phase 15: Penetration Testing
export const penetrationTestingTask = defineTask('penetration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Penetration Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Penetration Testing Expert',
      task: 'Conduct manual penetration testing to find exploitable vulnerabilities',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        applicationType: args.applicationType,
        reconnaissance: args.reconnaissance,
        securityRequirements: args.securityRequirements,
        environmentSetup: args.environmentSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review automated scan findings and prioritize testing',
        '2. Attempt to exploit identified vulnerabilities',
        '3. Chain multiple vulnerabilities for greater impact',
        '4. Test for authentication bypass',
        '5. Attempt privilege escalation exploits',
        '6. Test for data exfiltration possibilities',
        '7. Document exploitable vulnerabilities with proof of concept',
        '8. Rate exploitation complexity (low, medium, high)',
        '9. Document potential impact of successful exploitation',
        '10. Provide remediation priorities',
        '11. Generate penetration testing report with exploitation details'
      ],
      outputFormat: 'JSON object with penetration test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'exploitationComplexity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              exploitable: { type: 'boolean' },
              exploitationComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              proofOfConcept: { type: 'string' },
              impact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        exploitationComplexity: { type: 'string' },
        overallRiskRating: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'penetration-testing', 'ethical-hacking']
}));

// Phase 16: Vulnerability Analysis
export const vulnerabilityAnalysisTask = defineTask('vulnerability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Vulnerability Analysis and Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Vulnerability Analyst',
      task: 'Deduplicate, analyze, and prioritize security vulnerabilities',
      context: {
        projectName: args.projectName,
        vulnerabilities: args.vulnerabilities,
        securityRequirements: args.securityRequirements,
        complianceStandards: args.complianceStandards,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deduplicate vulnerabilities from multiple scan sources',
        '2. Normalize severity ratings (critical, high, medium, low)',
        '3. Map vulnerabilities to OWASP Top 10/API Top 10',
        '4. Map vulnerabilities to CWE classifications',
        '5. Calculate CVSS scores where applicable',
        '6. Prioritize based on severity, exploitability, and business impact',
        '7. Categorize by vulnerability type',
        '8. Calculate overall security score (0-100)',
        '9. Identify false positives',
        '10. Group related vulnerabilities',
        '11. Generate prioritized vulnerability list',
        '12. Create comprehensive vulnerability analysis report'
      ],
      outputFormat: 'JSON object with vulnerability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['securityScore', 'prioritizedVulnerabilities', 'artifacts'],
      properties: {
        securityScore: { type: 'number', minimum: 0, maximum: 100 },
        prioritizedVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              cvss: { type: 'number' },
              cwe: { type: 'string' },
              owasp: { type: 'string' },
              exploitability: { type: 'string' },
              businessImpact: { type: 'string' },
              priority: { type: 'number' },
              affectedUrls: { type: 'array' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              references: { type: 'array' }
            }
          }
        },
        vulnerabilityStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        owaspMapping: { type: 'object' },
        cweMapping: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'vulnerability-analysis', 'prioritization']
}));

// Phase 17: Compliance Verification
export const complianceVerificationTask = defineTask('compliance-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Security Compliance Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Compliance Auditor',
      task: 'Verify compliance with security standards and regulations',
      context: {
        projectName: args.projectName,
        complianceStandards: args.complianceStandards,
        prioritizedVulnerabilities: args.prioritizedVulnerabilities,
        securityScore: args.securityScore,
        sastResults: args.sastResults,
        dastResults: args.dastResults,
        apiSecurityResults: args.apiSecurityResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map vulnerabilities to compliance requirements',
        '2. Check OWASP Top 10 compliance',
        '3. Check OWASP API Security Top 10 compliance (if applicable)',
        '4. Check PCI-DSS compliance (if applicable)',
        '5. Check GDPR data protection requirements (if applicable)',
        '6. Check HIPAA security rules (if applicable)',
        '7. Check SOC 2 security controls (if applicable)',
        '8. Identify compliance gaps',
        '9. Calculate compliance percentage for each standard',
        '10. Generate compliance verification report',
        '11. Provide recommendations to achieve compliance'
      ],
      outputFormat: 'JSON object with compliance verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceStatus', 'allCompliant', 'complianceScore', 'artifacts'],
      properties: {
        complianceStatus: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              compliant: { type: 'boolean' },
              compliancePercentage: { type: 'number' },
              passedControls: { type: 'number' },
              totalControls: { type: 'number' },
              failedControls: { type: 'array' }
            }
          }
        },
        allCompliant: { type: 'boolean' },
        failedStandards: { type: 'array', items: { type: 'string' } },
        complianceScore: { type: 'number' },
        complianceGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              control: { type: 'string' },
              gap: { type: 'string' },
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
  labels: ['agent', 'security-testing', 'compliance', 'audit']
}));

// Phase 18: Security Reporting
export const securityReportingTask = defineTask('security-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Security Reporting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Report Specialist',
      task: 'Generate comprehensive security testing reports',
      context: args,
      instructions: [
        '1. Create executive summary report (high-level, business-focused)',
        '2. Create technical security report (detailed findings)',
        '3. Create vulnerability report (full details, remediation)',
        '4. Create compliance report',
        '5. Generate OWASP Top 10 coverage report',
        '6. Create penetration testing report (if applicable)',
        '7. Generate dashboard visualizations',
        '8. Create remediation priority matrix',
        '9. Include evidence and proof of concepts',
        '10. Generate reports in multiple formats (PDF, HTML, JSON)',
        '11. Create security metrics and KPIs',
        '12. Provide recommendations for security improvements'
      ],
      outputFormat: 'JSON object with report paths and details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reports', 'executiveReportPath', 'technicalReportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        executiveReportPath: { type: 'string' },
        technicalReportPath: { type: 'string' },
        vulnerabilityReportPath: { type: 'string' },
        dashboardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'reporting', 'documentation']
}));

// Phase 19: Remediation Planning
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Security Remediation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Remediation Strategist',
      task: 'Create comprehensive security remediation plan',
      context: {
        projectName: args.projectName,
        prioritizedVulnerabilities: args.prioritizedVulnerabilities,
        securityScore: args.securityScore,
        complianceStatus: args.complianceStatus,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create remediation tasks for each vulnerability',
        '2. Group related vulnerabilities for efficient remediation',
        '3. Prioritize tasks (critical, high, medium, low)',
        '4. Estimate effort for each task (hours/days)',
        '5. Identify quick wins (high impact, low effort)',
        '6. Create phased remediation roadmap',
        '7. Calculate expected security score improvement per phase',
        '8. Provide detailed remediation steps',
        '9. Include code examples and configuration fixes',
        '10. Document verification steps for each fix',
        '11. Create remediation tracking mechanism',
        '12. Generate remediation plan document'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['remediationPlan', 'planPath', 'taskListPath', 'artifacts'],
      properties: {
        remediationPlan: {
          type: 'object',
          properties: {
            totalTasks: { type: 'number' },
            criticalTasks: { type: 'number' },
            highTasks: { type: 'number' },
            estimatedEffort: { type: 'string' },
            expectedScoreImprovement: { type: 'number' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  priority: { type: 'string' },
                  effort: { type: 'string' },
                  vulnerabilities: { type: 'array' },
                  remediationSteps: { type: 'array' },
                  verificationSteps: { type: 'array' },
                  codeExample: { type: 'string' }
                }
              }
            },
            quickWins: { type: 'array' },
            phases: { type: 'array' }
          }
        },
        planPath: { type: 'string' },
        taskListPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'remediation', 'planning']
}));

// Phase 20: Security Gate Assessment
export const securityGateAssessmentTask = defineTask('security-gate-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Security Gate Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Gate Assessor and CISO',
      task: 'Conduct final security gate assessment and production readiness evaluation',
      context: {
        projectName: args.projectName,
        securityScore: args.securityScore,
        prioritizedVulnerabilities: args.prioritizedVulnerabilities,
        complianceStatus: args.complianceStatus,
        acceptanceCriteria: args.acceptanceCriteria,
        remediationPlan: args.remediationPlan,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare results against acceptance criteria',
        '2. Evaluate critical vulnerability count vs threshold',
        '3. Evaluate high vulnerability count vs threshold',
        '4. Evaluate security score vs minimum requirement',
        '5. Evaluate compliance requirements status',
        '6. Assess overall risk level',
        '7. Identify blocking security issues',
        '8. Determine production readiness',
        '9. Provide clear pass/fail verdict for security gate',
        '10. Provide detailed recommendation',
        '11. Document risks if deployment proceeds',
        '12. Generate final security assessment report'
      ],
      outputFormat: 'JSON object with security gate assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['securityGatePassed', 'productionReady', 'verdict', 'recommendation', 'riskLevel', 'artifacts'],
      properties: {
        securityGatePassed: { type: 'boolean' },
        productionReady: { type: 'boolean' },
        acceptanceCriteriaMet: {
          type: 'object',
          properties: {
            criticalVulnerabilities: { type: 'boolean' },
            highVulnerabilities: { type: 'boolean' },
            securityScore: { type: 'boolean' },
            compliance: { type: 'boolean' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        blockingIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        residualRisks: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-testing', 'security-gate', 'assessment']
}));
