/**
 * @process security-compliance/penetration-testing
 * @description Penetration Testing Program - Comprehensive ethical hacking and security assessment framework following
 * OWASP Testing Guide and PTES (Penetration Testing Execution Standard) methodologies. Covers scoping, reconnaissance,
 * vulnerability assessment, exploitation, post-exploitation, reporting, and remediation validation with structured
 * testing phases for web applications, networks, APIs, mobile apps, and cloud infrastructure.
 * @inputs { projectName: string, targetScope: object, testingType: string, methodology: string, complianceRequirements?: array, retestAfterRemediation?: boolean }
 * @outputs { success: boolean, securityPosture: string, vulnerabilities: array, exploitedVulnerabilities: array, remediationPlan: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('security-compliance/penetration-testing', {
 *   projectName: 'E-Commerce Platform',
 *   targetScope: {
 *     webApplications: ['https://app.example.com', 'https://admin.example.com'],
 *     apis: ['https://api.example.com/v1', 'https://api.example.com/v2'],
 *     networks: ['10.0.0.0/24'],
 *     mobileApps: ['com.example.app'],
 *     cloudInfrastructure: ['AWS Account: 123456789']
 *   },
 *   testingType: 'comprehensive', // 'comprehensive' | 'focused' | 'retest'
 *   methodology: 'OWASP', // 'OWASP' | 'PTES' | 'NIST' | 'Custom'
 *   approach: 'grey-box', // 'black-box' | 'grey-box' | 'white-box'
 *   complianceRequirements: ['PCI-DSS', 'SOC2', 'ISO27001', 'HIPAA'],
 *   testingDuration: '2-weeks',
 *   authorizedTesters: ['security-team@example.com'],
 *   retestAfterRemediation: true,
 *   testingWindow: { start: '2026-02-01', end: '2026-02-14' },
 *   emergencyContact: 'security-lead@example.com'
 * });
 *
 * @references
 * - OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
 * - PTES Technical Guidelines: http://www.pentest-standard.org/index.php/Main_Page
 * - NIST SP 800-115: https://csrc.nist.gov/publications/detail/sp/800-115/final
 * - OWASP Top 10: https://owasp.org/www-project-top-ten/
 * - OWASP API Security Top 10: https://owasp.org/www-project-api-security/
 * - MITRE ATT&CK Framework: https://attack.mitre.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetScope = {},
    testingType = 'comprehensive', // 'comprehensive', 'focused', 'retest'
    methodology = 'OWASP', // 'OWASP', 'PTES', 'NIST', 'Custom'
    approach = 'grey-box', // 'black-box', 'grey-box', 'white-box'
    complianceRequirements = [],
    testingDuration = '2-weeks',
    authorizedTesters = [],
    retestAfterRemediation = true,
    testingWindow = {},
    emergencyContact = '',
    outputDir = 'pentest-output',
    severityThreshold = 'medium', // 'critical', 'high', 'medium', 'low'
    exploitationDepth = 'moderate', // 'none', 'minimal', 'moderate', 'aggressive'
    reportFormat = 'executive-technical', // 'executive', 'technical', 'executive-technical'
    automatedScanningFirst = true,
    manualTestingEnabled = true,
    socialEngineeringEnabled = false,
    physicalSecurityTesting = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const allVulnerabilities = [];
  const exploitedVulnerabilities = [];
  let securityPosture = 'unknown';

  ctx.log('info', `Starting Penetration Testing Program for ${projectName}`);
  ctx.log('info', `Testing Type: ${testingType} | Methodology: ${methodology} | Approach: ${approach}`);
  ctx.log('info', `Target Scope: ${Object.keys(targetScope).length} asset types`);
  ctx.log('info', `Compliance Requirements: ${complianceRequirements.join(', ') || 'None'}`);

  // ============================================================================
  // PHASE 1: PRE-ENGAGEMENT AND SCOPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting pre-engagement activities and scoping');

  const scopingResult = await ctx.task(preEngagementScopingTask, {
    projectName,
    targetScope,
    testingType,
    methodology,
    approach,
    testingDuration,
    authorizedTesters,
    testingWindow,
    emergencyContact,
    complianceRequirements,
    exploitationDepth,
    socialEngineeringEnabled,
    physicalSecurityTesting,
    outputDir
  });

  artifacts.push(...scopingResult.artifacts);

  ctx.log('info', `Scoping complete - ${scopingResult.targetsIdentified} targets, ${scopingResult.testCasesEstimated} estimated test cases`);

  // Breakpoint: Scope approval
  await ctx.breakpoint({
    question: `Penetration test scope defined for ${projectName}. ${scopingResult.targetsIdentified} targets identified across ${scopingResult.assetTypes.length} asset types. Rules of Engagement signed: ${scopingResult.roeApproved}. Estimated duration: ${scopingResult.estimatedDuration}. Approve scope and begin testing?`,
    title: 'Penetration Test Scope Approval',
    context: {
      runId: ctx.runId,
      scope: {
        projectName,
        targetsIdentified: scopingResult.targetsIdentified,
        assetTypes: scopingResult.assetTypes,
        testingType,
        methodology,
        approach,
        testCasesEstimated: scopingResult.testCasesEstimated,
        roeApproved: scopingResult.roeApproved,
        estimatedDuration: scopingResult.estimatedDuration,
        complianceRequirements
      },
      files: scopingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: INTELLIGENCE GATHERING (RECONNAISSANCE)
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting reconnaissance and intelligence gathering');

  const reconResult = await ctx.task(reconnaissanceTask, {
    projectName,
    targetScope,
    approach,
    scopingResult,
    passiveRecon: true,
    activeRecon: approach !== 'black-box',
    osintEnabled: true,
    outputDir
  });

  artifacts.push(...reconResult.artifacts);

  ctx.log('info', `Reconnaissance complete - ${reconResult.hostsDiscovered} hosts, ${reconResult.servicesIdentified} services, ${reconResult.technologiesIdentified} technologies`);

  // ============================================================================
  // PHASE 3: VULNERABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting vulnerability assessment and threat modeling');

  let vulnerabilityAssessment;

  if (automatedScanningFirst) {
    // Run automated scanning first
    vulnerabilityAssessment = await ctx.task(automatedVulnerabilityAssessmentTask, {
      projectName,
      targetScope,
      reconResult,
      methodology,
      severityThreshold,
      scanConfiguration: scopingResult.scanConfiguration,
      outputDir
    });

    allVulnerabilities.push(...vulnerabilityAssessment.vulnerabilities);
    artifacts.push(...vulnerabilityAssessment.artifacts);

    ctx.log('info', `Automated vulnerability assessment complete - ${vulnerabilityAssessment.vulnerabilitiesFound} potential vulnerabilities (Critical: ${vulnerabilityAssessment.critical}, High: ${vulnerabilityAssessment.high})`);
  }

  // Manual vulnerability assessment
  if (manualTestingEnabled) {
    const manualAssessment = await ctx.task(manualVulnerabilityAssessmentTask, {
      projectName,
      targetScope,
      reconResult,
      automatedFindings: vulnerabilityAssessment?.vulnerabilities || [],
      methodology,
      approach,
      testingType,
      outputDir
    });

    allVulnerabilities.push(...manualAssessment.vulnerabilities);
    artifacts.push(...manualAssessment.artifacts);

    ctx.log('info', `Manual vulnerability assessment complete - ${manualAssessment.vulnerabilitiesFound} vulnerabilities identified (including ${manualAssessment.uniqueFindings} unique)`);
  }

  // Breakpoint: Review vulnerabilities before exploitation
  const criticalVulns = allVulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = allVulnerabilities.filter(v => v.severity === 'high').length;

  await ctx.breakpoint({
    question: `Vulnerability assessment complete for ${projectName}. Found ${allVulnerabilities.length} total vulnerabilities (Critical: ${criticalVulns}, High: ${highVulns}). ${exploitationDepth === 'none' ? 'Skip' : 'Proceed with'} exploitation phase?`,
    title: 'Vulnerability Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        totalVulnerabilities: allVulnerabilities.length,
        critical: criticalVulns,
        high: highVulns,
        medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
        low: allVulnerabilities.filter(v => v.severity === 'low').length,
        topVulnerabilities: allVulnerabilities.slice(0, 10).map(v => ({
          title: v.title,
          severity: v.severity,
          target: v.target
        })),
        exploitationDepth
      },
      files: artifacts.filter(a => a.label?.includes('vulnerability')).map(a => ({
        path: a.path,
        format: a.format || 'json',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 4: EXPLOITATION
  // ============================================================================

  if (exploitationDepth !== 'none' && allVulnerabilities.length > 0) {
    ctx.log('info', 'Phase 4: Conducting controlled exploitation of validated vulnerabilities');

    const exploitationResult = await ctx.task(exploitationTask, {
      projectName,
      vulnerabilities: allVulnerabilities.filter(v =>
        ['critical', 'high'].includes(v.severity) && v.exploitable
      ),
      exploitationDepth,
      targetScope,
      scopingResult,
      outputDir
    });

    exploitedVulnerabilities.push(...exploitationResult.exploitedVulnerabilities);
    artifacts.push(...exploitationResult.artifacts);

    ctx.log('info', `Exploitation phase complete - ${exploitationResult.successfulExploits} successful exploits, ${exploitationResult.accessLevel} access achieved`);

    // Quality Gate: Critical exploits
    if (exploitationResult.criticalExploits > 0) {
      await ctx.breakpoint({
        question: `CRITICAL: Successfully exploited ${exploitationResult.criticalExploits} critical vulnerabilities in ${projectName}! Achieved ${exploitationResult.accessLevel} access. Impacts: ${exploitationResult.businessImpacts.slice(0, 3).join(', ')}. Continue to post-exploitation or stop and report immediately?`,
        title: 'Critical Vulnerabilities Exploited',
        context: {
          runId: ctx.runId,
          exploitation: {
            successfulExploits: exploitationResult.successfulExploits,
            criticalExploits: exploitationResult.criticalExploits,
            accessLevel: exploitationResult.accessLevel,
            systemsCompromised: exploitationResult.systemsCompromised,
            dataAccessed: exploitationResult.dataAccessed,
            businessImpacts: exploitationResult.businessImpacts,
            exploitChain: exploitationResult.exploitChain
          },
          recommendation: 'Consider stopping testing and reporting critical findings immediately',
          files: exploitationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }

    // ============================================================================
    // PHASE 5: POST-EXPLOITATION
    // ============================================================================

    if (exploitationResult.successfulExploits > 0 && exploitationDepth !== 'minimal') {
      ctx.log('info', 'Phase 5: Conducting post-exploitation activities and lateral movement assessment');

      const postExploitationResult = await ctx.task(postExploitationTask, {
        projectName,
        exploitedVulnerabilities,
        exploitationResult,
        targetScope,
        scopingResult,
        exploitationDepth,
        outputDir
      });

      artifacts.push(...postExploitationResult.artifacts);

      ctx.log('info', `Post-exploitation complete - Lateral movement: ${postExploitationResult.lateralMovementPossible}, Privilege escalation: ${postExploitationResult.privilegeEscalationAchieved}, Data exfiltration: ${postExploitationResult.dataExfiltrationPossible}`);
    }
  } else {
    ctx.log('info', 'Skipping exploitation phase per configuration or no exploitable vulnerabilities found');
  }

  // ============================================================================
  // PHASE 6: WEB APPLICATION SECURITY TESTING (OWASP)
  // ============================================================================

  if (targetScope.webApplications?.length > 0 && methodology === 'OWASP') {
    ctx.log('info', 'Phase 6: Conducting OWASP-based web application security testing');

    const webAppTestingTasks = targetScope.webApplications.slice(0, 3).map(webapp =>
      () => ctx.task(owaspWebAppTestingTask, {
        projectName,
        targetApplication: webapp,
        approach,
        reconResult,
        existingVulnerabilities: allVulnerabilities.filter(v => v.target?.includes(webapp)),
        outputDir
      })
    );

    const webAppResults = await ctx.parallel.all(webAppTestingTasks);

    const consolidatedWebAppFindings = {
      applicationsTestedCount: webAppResults.length,
      vulnerabilitiesFound: webAppResults.reduce((sum, r) => sum + r.vulnerabilitiesFound, 0),
      critical: webAppResults.reduce((sum, r) => sum + r.critical, 0),
      high: webAppResults.reduce((sum, r) => sum + r.high, 0),
      owaspTop10Coverage: webAppResults[0]?.owaspTop10Coverage || [],
      vulnerabilities: webAppResults.flatMap(r => r.vulnerabilities),
      artifacts: webAppResults.flatMap(r => r.artifacts)
    };

    allVulnerabilities.push(...consolidatedWebAppFindings.vulnerabilities);
    artifacts.push(...consolidatedWebAppFindings.artifacts);

    ctx.log('info', `Web application testing complete - ${consolidatedWebAppFindings.applicationsTestedCount} apps tested, ${consolidatedWebAppFindings.vulnerabilitiesFound} vulnerabilities`);
  }

  // ============================================================================
  // PHASE 7: API SECURITY TESTING
  // ============================================================================

  if (targetScope.apis?.length > 0) {
    ctx.log('info', 'Phase 7: Conducting API security testing (OWASP API Top 10)');

    const apiTestingResult = await ctx.task(apiSecurityTestingTask, {
      projectName,
      targetApis: targetScope.apis,
      approach,
      reconResult,
      outputDir
    });

    allVulnerabilities.push(...apiTestingResult.vulnerabilities);
    artifacts.push(...apiTestingResult.artifacts);

    ctx.log('info', `API security testing complete - ${apiTestingResult.apisTestedCount} APIs tested, ${apiTestingResult.vulnerabilitiesFound} vulnerabilities`);
  }

  // ============================================================================
  // PHASE 8: NETWORK PENETRATION TESTING
  // ============================================================================

  if (targetScope.networks?.length > 0) {
    ctx.log('info', 'Phase 8: Conducting network penetration testing');

    const networkTestingResult = await ctx.task(networkPenetrationTestingTask, {
      projectName,
      targetNetworks: targetScope.networks,
      approach,
      reconResult,
      exploitationDepth,
      outputDir
    });

    allVulnerabilities.push(...networkTestingResult.vulnerabilities);
    exploitedVulnerabilities.push(...(networkTestingResult.exploitedVulnerabilities || []));
    artifacts.push(...networkTestingResult.artifacts);

    ctx.log('info', `Network penetration testing complete - ${networkTestingResult.networksTestedCount} networks tested, ${networkTestingResult.vulnerabilitiesFound} vulnerabilities`);
  }

  // ============================================================================
  // PHASE 9: CLOUD INFRASTRUCTURE SECURITY TESTING
  // ============================================================================

  if (targetScope.cloudInfrastructure?.length > 0) {
    ctx.log('info', 'Phase 9: Conducting cloud infrastructure security testing');

    const cloudTestingResult = await ctx.task(cloudSecurityTestingTask, {
      projectName,
      cloudTargets: targetScope.cloudInfrastructure,
      approach,
      reconResult,
      outputDir
    });

    allVulnerabilities.push(...cloudTestingResult.vulnerabilities);
    artifacts.push(...cloudTestingResult.artifacts);

    ctx.log('info', `Cloud security testing complete - ${cloudTestingResult.cloudAccountsTestedCount} accounts tested, ${cloudTestingResult.vulnerabilitiesFound} vulnerabilities`);
  }

  // ============================================================================
  // PHASE 10: SOCIAL ENGINEERING ASSESSMENT
  // ============================================================================

  if (socialEngineeringEnabled) {
    ctx.log('info', 'Phase 10: Conducting social engineering assessment');

    const socialEngineeringResult = await ctx.task(socialEngineeringAssessmentTask, {
      projectName,
      targetOrganization: scopingResult.organizationInfo,
      approvedTactics: scopingResult.socialEngineeringTactics,
      outputDir
    });

    allVulnerabilities.push(...socialEngineeringResult.vulnerabilities);
    artifacts.push(...socialEngineeringResult.artifacts);

    ctx.log('info', `Social engineering assessment complete - ${socialEngineeringResult.campaignsExecuted} campaigns, ${socialEngineeringResult.successRate}% success rate`);
  }

  // ============================================================================
  // PHASE 11: COMPLIANCE VALIDATION
  // ============================================================================

  if (complianceRequirements.length > 0) {
    ctx.log('info', 'Phase 11: Validating compliance requirements against findings');

    const complianceValidationResult = await ctx.task(complianceValidationTask, {
      projectName,
      vulnerabilities: allVulnerabilities,
      exploitedVulnerabilities,
      complianceRequirements,
      targetScope,
      outputDir
    });

    artifacts.push(...complianceValidationResult.artifacts);

    ctx.log('info', `Compliance validation complete - ${complianceValidationResult.requirementsMet}/${complianceValidationResult.totalRequirements} requirements met`);
  }

  // ============================================================================
  // PHASE 12: RISK ANALYSIS AND BUSINESS IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Conducting risk analysis and business impact assessment');

  const riskAnalysisResult = await ctx.task(riskAnalysisTask, {
    projectName,
    vulnerabilities: allVulnerabilities,
    exploitedVulnerabilities,
    targetScope,
    scopingResult,
    outputDir
  });

  artifacts.push(...riskAnalysisResult.artifacts);
  securityPosture = riskAnalysisResult.overallSecurityPosture;

  ctx.log('info', `Risk analysis complete - Overall security posture: ${securityPosture}, Risk score: ${riskAnalysisResult.riskScore}/100`);

  // ============================================================================
  // PHASE 13: REMEDIATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating prioritized remediation recommendations');

  const remediationResult = await ctx.task(remediationRecommendationsTask, {
    projectName,
    vulnerabilities: allVulnerabilities,
    exploitedVulnerabilities,
    riskAnalysisResult,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...remediationResult.artifacts);

  ctx.log('info', `Remediation plan complete - ${remediationResult.recommendations.length} recommendations, ${remediationResult.quickWins} quick wins identified`);

  // ============================================================================
  // PHASE 14: COMPREHENSIVE PENETRATION TEST REPORT
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive penetration test report');

  const reportResult = await ctx.task(penetrationTestReportTask, {
    projectName,
    scopingResult,
    reconResult,
    vulnerabilities: allVulnerabilities,
    exploitedVulnerabilities,
    riskAnalysisResult,
    remediationResult,
    complianceValidationResult: complianceRequirements.length > 0 ? { requirementsMet: 0, totalRequirements: complianceRequirements.length } : null,
    testingType,
    methodology,
    approach,
    reportFormat,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  ctx.log('info', `Penetration test report generated - ${reportResult.reportPages} pages, ${reportResult.executiveSummaryGenerated ? 'Executive summary included' : 'Technical report only'}`);

  // ============================================================================
  // FINAL BREAKPOINT: REPORT REVIEW AND REMEDIATION TRACKING
  // ============================================================================

  await ctx.breakpoint({
    question: `Penetration test complete for ${projectName}. Security posture: ${securityPosture}. Found ${allVulnerabilities.length} vulnerabilities (Critical: ${allVulnerabilities.filter(v => v.severity === 'critical').length}, High: ${allVulnerabilities.filter(v => v.severity === 'high').length}). Successfully exploited: ${exploitedVulnerabilities.length}. ${remediationResult.recommendations.length} remediation recommendations provided. ${retestAfterRemediation ? 'Schedule retest after remediation?' : 'Finalize report and close engagement?'}`,
    title: 'Penetration Test Complete - Report Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        testingType,
        methodology,
        approach,
        securityPosture,
        totalVulnerabilities: allVulnerabilities.length,
        criticalVulnerabilities: allVulnerabilities.filter(v => v.severity === 'critical').length,
        highVulnerabilities: allVulnerabilities.filter(v => v.severity === 'high').length,
        exploitedVulnerabilities: exploitedVulnerabilities.length,
        riskScore: riskAnalysisResult?.riskScore,
        remediationRecommendations: remediationResult.recommendations.length,
        quickWins: remediationResult.quickWins,
        complianceStatus: complianceRequirements.length > 0 ? 'Validated' : 'N/A',
        reportPath: reportResult.reportPath,
        testDuration: ctx.now() - startTime
      },
      files: artifacts.filter(a => a.label?.includes('report') || a.label?.includes('summary')).map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 15: REMEDIATION VALIDATION (IF ENABLED)
  // ============================================================================

  let remediationValidationResult = null;

  if (retestAfterRemediation) {
    ctx.log('info', 'Phase 15: Scheduling remediation validation and retest');

    remediationValidationResult = await ctx.task(remediationValidationTask, {
      projectName,
      vulnerabilities: allVulnerabilities.filter(v => ['critical', 'high'].includes(v.severity)),
      remediationResult,
      targetScope,
      outputDir
    });

    artifacts.push(...remediationValidationResult.artifacts);

    ctx.log('info', `Remediation validation plan created - ${remediationValidationResult.validationTestCases} test cases, estimated ${remediationValidationResult.estimatedRetestDuration} duration`);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    testingType,
    methodology,
    approach,
    securityPosture,
    riskScore: riskAnalysisResult?.riskScore || 0,
    scope: {
      targetsIdentified: scopingResult.targetsIdentified,
      assetTypes: scopingResult.assetTypes,
      testCasesExecuted: scopingResult.testCasesEstimated,
      roeApproved: scopingResult.roeApproved
    },
    reconnaissance: {
      hostsDiscovered: reconResult?.hostsDiscovered || 0,
      servicesIdentified: reconResult?.servicesIdentified || 0,
      technologiesIdentified: reconResult?.technologiesIdentified || 0
    },
    vulnerabilities: {
      total: allVulnerabilities.length,
      critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
      high: allVulnerabilities.filter(v => v.severity === 'high').length,
      medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
      low: allVulnerabilities.filter(v => v.severity === 'low').length,
      exploited: exploitedVulnerabilities.length,
      list: allVulnerabilities
    },
    exploitation: {
      exploitedVulnerabilities: exploitedVulnerabilities.length,
      accessLevel: exploitedVulnerabilities.length > 0 ? 'compromised' : 'none',
      businessImpact: exploitedVulnerabilities.length > 0 ? 'high' : 'low'
    },
    remediationPlan: {
      totalRecommendations: remediationResult.recommendations.length,
      quickWins: remediationResult.quickWins,
      criticalRecommendations: remediationResult.recommendations.filter(r => r.priority === 'critical').length,
      estimatedRemediationTime: remediationResult.estimatedRemediationTime,
      recommendations: remediationResult.recommendations
    },
    complianceStatus: complianceRequirements.length > 0 ? {
      requirements: complianceRequirements,
      validated: true,
      gaps: []
    } : null,
    report: {
      reportPath: reportResult.reportPath,
      executiveSummaryGenerated: reportResult.executiveSummaryGenerated,
      reportFormat,
      reportPages: reportResult.reportPages
    },
    remediationValidation: remediationValidationResult ? {
      scheduled: true,
      validationTestCases: remediationValidationResult.validationTestCases,
      estimatedRetestDuration: remediationValidationResult.estimatedRetestDuration
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'security-compliance/penetration-testing',
      timestamp: startTime,
      testingWindow,
      authorizedTesters,
      emergencyContact
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Pre-Engagement and Scoping
export const preEngagementScopingTask = defineTask('pre-engagement-scoping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define penetration test scope and rules of engagement',
  agent: {
    name: 'pentest-scoping-specialist',
    prompt: {
      role: 'senior penetration testing consultant and engagement manager',
      task: 'Define comprehensive penetration testing scope, establish rules of engagement, obtain necessary approvals, and create testing plan',
      context: args,
      instructions: [
        'Identify all in-scope targets (IP ranges, domains, applications, APIs, networks, cloud accounts)',
        'Identify out-of-scope targets and exclusions explicitly',
        'Define testing methodology aligned with OWASP/PTES/NIST standards',
        'Establish rules of engagement (RoE): testing hours, exploitation limits, data handling, emergency procedures',
        'Document testing approach: black-box (no knowledge), grey-box (limited knowledge), white-box (full knowledge)',
        'Define exploitation depth: none (assessment only), minimal (proof of concept), moderate (controlled exploitation), aggressive (full exploitation)',
        'Obtain written authorization and legal approval for testing',
        'Create emergency contact list and escalation procedures',
        'Define acceptable testing window and schedule',
        'Identify compliance requirements (PCI-DSS, SOC2, HIPAA, etc.)',
        'Estimate test cases based on target complexity',
        'Create project kick-off documentation and stakeholder communication plan',
        'Document assumptions, constraints, and limitations'
      ],
      outputFormat: 'JSON with targetsIdentified (number), assetTypes (array), testCasesEstimated (number), roeApproved (boolean), estimatedDuration (string), scanConfiguration (object), organizationInfo (object), socialEngineeringTactics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetsIdentified', 'assetTypes', 'testCasesEstimated', 'roeApproved', 'artifacts'],
      properties: {
        targetsIdentified: { type: 'number' },
        assetTypes: { type: 'array', items: { type: 'string' } },
        testCasesEstimated: { type: 'number' },
        roeApproved: { type: 'boolean' },
        estimatedDuration: { type: 'string' },
        inScopeTargets: { type: 'array', items: { type: 'string' } },
        outOfScopeTargets: { type: 'array', items: { type: 'string' } },
        rulesOfEngagement: {
          type: 'object',
          properties: {
            testingHours: { type: 'string' },
            exploitationLimits: { type: 'string' },
            dataHandling: { type: 'string' },
            emergencyProcedures: { type: 'string' }
          }
        },
        scanConfiguration: { type: 'object' },
        organizationInfo: { type: 'object' },
        socialEngineeringTactics: { type: 'array', items: { type: 'string' } },
        legalApproval: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'scoping']
}));

// Task 2: Reconnaissance and Intelligence Gathering
export const reconnaissanceTask = defineTask('reconnaissance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct reconnaissance and intelligence gathering',
  agent: {
    name: 'recon-specialist',
    prompt: {
      role: 'reconnaissance and OSINT specialist',
      task: 'Gather comprehensive intelligence on targets using passive and active reconnaissance techniques',
      context: args,
      instructions: [
        'Perform passive reconnaissance: OSINT, public records, DNS enumeration, WHOIS lookups, Google dorking',
        'Search for exposed credentials in breach databases and paste sites',
        'Enumerate subdomains and identify digital footprint',
        'Analyze public-facing infrastructure and technology stack',
        'Identify employee information and organizational structure (LinkedIn, social media)',
        'If grey-box or white-box: Perform active reconnaissance',
        'Conduct network scanning and host discovery (nmap, masscan)',
        'Enumerate services, versions, and potential vulnerabilities',
        'Identify web technologies (Wappalyzer, WhatWeb)',
        'Map network topology and trust relationships',
        'Identify SSL/TLS configurations and certificate information',
        'Document attack surface and potential entry points',
        'Create target dossier with intelligence findings',
        'Identify quick wins and low-hanging fruit for initial testing'
      ],
      outputFormat: 'JSON with hostsDiscovered (number), servicesIdentified (number), technologiesIdentified (number), subdomainsFound (number), credentialsExposed (number), attackSurface (object), intelligenceReport (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hostsDiscovered', 'servicesIdentified', 'technologiesIdentified', 'artifacts'],
      properties: {
        hostsDiscovered: { type: 'number' },
        servicesIdentified: { type: 'number' },
        technologiesIdentified: { type: 'number' },
        subdomainsFound: { type: 'number' },
        credentialsExposed: { type: 'number' },
        attackSurface: {
          type: 'object',
          properties: {
            webApplications: { type: 'array', items: { type: 'string' } },
            openPorts: { type: 'array', items: { type: 'number' } },
            exposedServices: { type: 'array', items: { type: 'string' } },
            vulnerableComponents: { type: 'array', items: { type: 'string' } }
          }
        },
        intelligenceReport: { type: 'string' },
        organizationalIntelligence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'reconnaissance']
}));

// Task 3: Automated Vulnerability Assessment
export const automatedVulnerabilityAssessmentTask = defineTask('automated-vulnerability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct automated vulnerability assessment',
  agent: {
    name: 'vulnerability-scanner',
    prompt: {
      role: 'automated security scanning specialist',
      task: 'Perform comprehensive automated vulnerability assessment using industry-standard tools',
      context: args,
      instructions: [
        'Configure vulnerability scanners (Nessus, OpenVAS, Qualys, etc.) based on target scope',
        'Run authenticated scans where credentials are available (grey-box/white-box)',
        'Scan for common vulnerabilities: CVEs, misconfigurations, weak credentials',
        'Check for OWASP Top 10 vulnerabilities in web applications',
        'Scan for SSL/TLS vulnerabilities (weak ciphers, expired certificates)',
        'Identify outdated software versions and missing patches',
        'Check for default credentials and weak passwords',
        'Scan for information disclosure vulnerabilities',
        'Identify sensitive data exposure and misconfigured services',
        'Run port scanning and service enumeration',
        'Perform web application scanning (OWASP ZAP, Burp Suite Scanner)',
        'Analyze scan results and filter false positives',
        'Prioritize findings by severity and exploitability',
        'Cross-reference with known exploit databases (ExploitDB, Metasploit)',
        'Generate vulnerability report with remediation guidance'
      ],
      outputFormat: 'JSON with vulnerabilitiesFound (number), critical (number), high (number), medium (number), low (number), falsePositives (number), exploitableVulnerabilities (number), vulnerabilities (array with id, title, severity, target, cve, exploitAvailable, description, remediation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesFound', 'critical', 'high', 'vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilitiesFound: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        falsePositives: { type: 'number' },
        exploitableVulnerabilities: { type: 'number' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              target: { type: 'string' },
              cve: { type: 'string' },
              cvss: { type: 'number' },
              exploitable: { type: 'boolean' },
              exploitAvailable: { type: 'boolean' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scanStatistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'vulnerability-assessment', 'automated']
}));

// Task 4: Manual Vulnerability Assessment
export const manualVulnerabilityAssessmentTask = defineTask('manual-vulnerability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct manual vulnerability assessment and business logic testing',
  agent: {
    name: 'manual-tester',
    prompt: {
      role: 'expert penetration tester and security researcher',
      task: 'Perform manual security testing to identify vulnerabilities missed by automated tools, focusing on business logic flaws, authentication/authorization issues, and complex attack chains',
      context: args,
      instructions: [
        'Review automated scan results and identify areas requiring manual validation',
        'Test authentication mechanisms: brute force, credential stuffing, bypass techniques',
        'Test authorization and access controls: privilege escalation, IDOR, forced browsing',
        'Test session management: session fixation, session hijacking, timeout issues',
        'Test input validation: SQL injection, XSS, command injection, XXE, SSRF',
        'Test business logic flaws: race conditions, workflow bypasses, price manipulation',
        'Test API security: broken authentication, excessive data exposure, lack of rate limiting',
        'Test for cryptographic weaknesses: weak algorithms, insecure storage, poor key management',
        'Test file upload functionality: unrestricted file upload, path traversal',
        'Test for security misconfigurations: verbose errors, debug mode enabled, default configs',
        'Perform manual code review if white-box testing',
        'Chain multiple vulnerabilities to demonstrate impact',
        'Document proof-of-concept exploits for critical findings',
        'Identify unique vulnerabilities not found by automated scanners',
        'Provide detailed reproduction steps for each vulnerability'
      ],
      outputFormat: 'JSON with vulnerabilitiesFound (number), uniqueFindings (number), critical (number), high (number), medium (number), low (number), businessLogicFlaws (number), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesFound', 'uniqueFindings', 'vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilitiesFound: { type: 'number' },
        uniqueFindings: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        businessLogicFlaws: { type: 'number' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              category: { type: 'string' },
              target: { type: 'string' },
              exploitable: { type: 'boolean' },
              description: { type: 'string' },
              reproductionSteps: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              remediation: { type: 'string' },
              proofOfConcept: { type: 'string' }
            }
          }
        },
        testingNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'vulnerability-assessment', 'manual']
}));

// Task 5: Exploitation
export const exploitationTask = defineTask('exploitation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct controlled exploitation of validated vulnerabilities',
  agent: {
    name: 'exploitation-specialist',
    prompt: {
      role: 'ethical hacker and exploitation specialist',
      task: 'Safely exploit validated vulnerabilities to demonstrate real-world impact while adhering to rules of engagement',
      context: args,
      instructions: [
        'Review exploitable vulnerabilities identified during assessment',
        'Prioritize exploitation targets based on severity and business impact',
        'Check exploit availability in Metasploit Framework, ExploitDB, GitHub',
        'Develop custom exploits for unique vulnerabilities if needed',
        'Test exploits in controlled manner respecting exploitation depth limits',
        'Document pre-exploitation state and maintain detailed logs',
        'Execute exploits with appropriate safety measures and monitoring',
        'Capture proof of successful exploitation (screenshots, command output)',
        'Determine access level achieved: user, admin, root/system',
        'Document systems compromised and data accessed',
        'Map exploit chains demonstrating attacker progression',
        'Assess business impact: data breach, service disruption, financial loss',
        'Maintain stealth if required by engagement scope',
        'Clean up artifacts and restore systems to pre-exploitation state if requested',
        'Document all exploitation activities with timestamps'
      ],
      outputFormat: 'JSON with successfulExploits (number), criticalExploits (number), accessLevel (string), systemsCompromised (array), dataAccessed (array), businessImpacts (array), exploitChain (array), exploitedVulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['successfulExploits', 'accessLevel', 'exploitedVulnerabilities', 'artifacts'],
      properties: {
        successfulExploits: { type: 'number' },
        criticalExploits: { type: 'number' },
        accessLevel: { type: 'string', enum: ['none', 'user', 'admin', 'root', 'domain-admin'] },
        systemsCompromised: { type: 'array', items: { type: 'string' } },
        dataAccessed: { type: 'array', items: { type: 'string' } },
        businessImpacts: { type: 'array', items: { type: 'string' } },
        exploitChain: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              vulnerability: { type: 'string' },
              exploit: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        exploitedVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerabilityId: { type: 'string' },
              exploitUsed: { type: 'string' },
              successfulExploitation: { type: 'boolean' },
              proofOfExploitation: { type: 'string' },
              impactDemonstrated: { type: 'string' }
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
  labels: ['agent', 'penetration-testing', 'exploitation']
}));

// Task 6: Post-Exploitation
export const postExploitationTask = defineTask('post-exploitation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct post-exploitation activities and lateral movement assessment',
  agent: {
    name: 'post-exploitation-specialist',
    prompt: {
      role: 'advanced persistent threat (APT) simulation specialist',
      task: 'Conduct post-exploitation activities to assess lateral movement capabilities, privilege escalation paths, and data exfiltration potential',
      context: args,
      instructions: [
        'Establish persistent access mechanisms (if authorized)',
        'Enumerate compromised system: users, groups, permissions, installed software',
        'Attempt privilege escalation to administrator/root level',
        'Harvest credentials: memory dumps, saved passwords, configuration files',
        'Pivot to other systems on the network (lateral movement)',
        'Identify high-value targets: domain controllers, databases, file servers',
        'Assess data exfiltration capabilities and channels',
        'Test detection and response capabilities (if in scope)',
        'Simulate attacker TTPs (Tactics, Techniques, and Procedures) per MITRE ATT&CK',
        'Document attacker paths and killchain progression',
        'Identify crown jewels: sensitive data, intellectual property, credentials',
        'Assess blast radius: scope of potential compromise',
        'Maintain detailed activity logs for detection analysis',
        'Clean up all artifacts and close backdoors at engagement end',
        'Provide recommendations for detection and prevention'
      ],
      outputFormat: 'JSON with lateralMovementPossible (boolean), privilegeEscalationAchieved (boolean), dataExfiltrationPossible (boolean), persistenceEstablished (boolean), systemsReached (number), credentialsHarvested (number), attackPaths (array), mitreAttackTactics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lateralMovementPossible', 'privilegeEscalationAchieved', 'dataExfiltrationPossible', 'artifacts'],
      properties: {
        lateralMovementPossible: { type: 'boolean' },
        privilegeEscalationAchieved: { type: 'boolean' },
        dataExfiltrationPossible: { type: 'boolean' },
        persistenceEstablished: { type: 'boolean' },
        systemsReached: { type: 'number' },
        credentialsHarvested: { type: 'number' },
        attackPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
            }
          }
        },
        mitreAttackTactics: { type: 'array', items: { type: 'string' } },
        crownJewelsAccessed: { type: 'array', items: { type: 'string' } },
        detectionOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'post-exploitation']
}));

// Task 7: OWASP Web Application Testing
export const owaspWebAppTestingTask = defineTask('owasp-webapp-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test web application: ${args.targetApplication}`,
  agent: {
    name: 'webapp-security-tester',
    prompt: {
      role: 'OWASP-certified web application security specialist',
      task: 'Conduct comprehensive web application security testing following OWASP Testing Guide methodology',
      context: args,
      instructions: [
        'Test OWASP Top 10 2021 vulnerabilities:',
        '  A01: Broken Access Control - test authorization, IDOR, path traversal',
        '  A02: Cryptographic Failures - test encryption, sensitive data exposure',
        '  A03: Injection - test SQL injection, XSS, command injection, LDAP injection',
        '  A04: Insecure Design - test business logic flaws, security design weaknesses',
        '  A05: Security Misconfiguration - test default configs, verbose errors, unnecessary features',
        '  A06: Vulnerable Components - identify outdated libraries and dependencies',
        '  A07: Authentication Failures - test authentication bypass, weak passwords, session management',
        '  A08: Software and Data Integrity Failures - test insecure deserialization, CI/CD security',
        '  A09: Security Logging and Monitoring Failures - test logging adequacy',
        '  A10: Server-Side Request Forgery (SSRF) - test SSRF vulnerabilities',
        'Test authentication: password policies, MFA, account lockout, password reset',
        'Test session management: cookies, tokens, session fixation, timeout',
        'Test input validation across all input vectors: forms, headers, cookies, URL parameters',
        'Test authorization: role-based access control, privilege escalation',
        'Test for client-side vulnerabilities: DOM XSS, clickjacking, CORS misconfig',
        'Review JavaScript code for security issues',
        'Test file upload functionality and content validation',
        'Generate proof-of-concept exploits for all findings'
      ],
      outputFormat: 'JSON with vulnerabilitiesFound (number), critical (number), high (number), medium (number), low (number), owaspTop10Coverage (array), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesFound', 'owaspTop10Coverage', 'vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilitiesFound: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        owaspTop10Coverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              tested: { type: 'boolean' },
              vulnerabilitiesFound: { type: 'number' }
            }
          }
        },
        vulnerabilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'web-application', 'owasp']
}));

// Task 8: API Security Testing
export const apiSecurityTestingTask = defineTask('api-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct API security testing (OWASP API Top 10)',
  agent: {
    name: 'api-security-tester',
    prompt: {
      role: 'API security specialist',
      task: 'Test API security following OWASP API Security Top 10 methodology',
      context: args,
      instructions: [
        'Test OWASP API Security Top 10 2023:',
        '  API1: Broken Object Level Authorization - test IDOR in API endpoints',
        '  API2: Broken Authentication - test API authentication mechanisms',
        '  API3: Broken Object Property Level Authorization - test mass assignment, excessive data exposure',
        '  API4: Unrestricted Resource Consumption - test rate limiting, DoS protection',
        '  API5: Broken Function Level Authorization - test privilege escalation in API functions',
        '  API6: Unrestricted Access to Sensitive Business Flows - test business logic abuse',
        '  API7: Server Side Request Forgery - test SSRF in API endpoints',
        '  API8: Security Misconfiguration - test API security configs',
        '  API9: Improper Inventory Management - test API versioning, deprecated endpoints',
        '  API10: Unsafe Consumption of APIs - test third-party API integrations',
        'Analyze API documentation (Swagger/OpenAPI) for security issues',
        'Test authentication: API keys, OAuth, JWT, basic auth',
        'Test authorization at endpoint and object level',
        'Fuzz API endpoints with malformed requests',
        'Test for injection vulnerabilities in API parameters',
        'Check for sensitive data exposure in API responses',
        'Test rate limiting and abuse scenarios',
        'Verify HTTPS enforcement and certificate validation'
      ],
      outputFormat: 'JSON with apisTestedCount (number), vulnerabilitiesFound (number), critical (number), high (number), apiTop10Coverage (array), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apisTestedCount', 'vulnerabilitiesFound', 'vulnerabilities', 'artifacts'],
      properties: {
        apisTestedCount: { type: 'number' },
        vulnerabilitiesFound: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        apiTop10Coverage: { type: 'array' },
        vulnerabilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'api-security']
}));

// Task 9: Network Penetration Testing
export const networkPenetrationTestingTask = defineTask('network-penetration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct network penetration testing',
  agent: {
    name: 'network-pentester',
    prompt: {
      role: 'network penetration testing specialist',
      task: 'Test network security, identify network-level vulnerabilities, and assess network segmentation',
      context: args,
      instructions: [
        'Perform comprehensive network scanning: hosts, ports, services',
        'Enumerate network services and versions',
        'Test for network-level vulnerabilities: SMB, RDP, SSH, FTP, SMTP, DNS',
        'Attempt exploitation of vulnerable network services',
        'Test for weak or default credentials on network services',
        'Assess network segmentation and firewall effectiveness',
        'Test for man-in-the-middle (MITM) attack opportunities',
        'Analyze network traffic for sensitive data transmission',
        'Test wireless security if in scope (WPA2, WPA3, rogue APs)',
        'Attempt to bypass network access controls (NAC)',
        'Test VPN security and remote access',
        'Assess internal network security vs. external perimeter',
        'Identify trust relationships between systems',
        'Test for network-based DoS vulnerabilities',
        'Document network topology and security boundaries'
      ],
      outputFormat: 'JSON with networksTestedCount (number), vulnerabilitiesFound (number), critical (number), high (number), exploitedVulnerabilities (array), networkSegmentationEffective (boolean), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['networksTestedCount', 'vulnerabilitiesFound', 'vulnerabilities', 'artifacts'],
      properties: {
        networksTestedCount: { type: 'number' },
        vulnerabilitiesFound: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        exploitedVulnerabilities: { type: 'array' },
        networkSegmentationEffective: { type: 'boolean' },
        vulnerabilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'network-security']
}));

// Task 10: Cloud Security Testing
export const cloudSecurityTestingTask = defineTask('cloud-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct cloud infrastructure security testing',
  agent: {
    name: 'cloud-security-tester',
    prompt: {
      role: 'cloud security penetration testing specialist',
      task: 'Test cloud infrastructure security across AWS, Azure, GCP focusing on IAM, storage, compute, and configuration',
      context: args,
      instructions: [
        'Enumerate cloud resources: EC2/VMs, S3/Storage, databases, serverless functions',
        'Test IAM and access controls: overly permissive roles, privilege escalation',
        'Test storage security: public S3 buckets, blob storage, misconfigured access',
        'Identify exposed secrets in cloud resources: environment variables, instance metadata',
        'Test compute security: exposed management interfaces, weak SSH keys',
        'Assess network security groups and firewall rules',
        'Test serverless security: function injection, IAM role exploitation',
        'Identify cloud misconfigurations using ScoutSuite, Prowler, Cloud Custodian',
        'Test for SSRF leading to metadata service access (169.254.169.254)',
        'Assess encryption at rest and in transit',
        'Test container security: exposed Docker APIs, Kubernetes misconfigurations',
        'Identify shadow IT and rogue cloud resources',
        'Test for cloud-specific attack vectors: confused deputy, resource hijacking',
        'Validate CIS Benchmark compliance for cloud provider',
        'Document cloud attack paths and security posture'
      ],
      outputFormat: 'JSON with cloudAccountsTestedCount (number), vulnerabilitiesFound (number), critical (number), high (number), publicExposures (number), iamIssues (number), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cloudAccountsTestedCount', 'vulnerabilitiesFound', 'vulnerabilities', 'artifacts'],
      properties: {
        cloudAccountsTestedCount: { type: 'number' },
        vulnerabilitiesFound: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        publicExposures: { type: 'number' },
        iamIssues: { type: 'number' },
        vulnerabilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'cloud-security']
}));

// Task 11: Social Engineering Assessment
export const socialEngineeringAssessmentTask = defineTask('social-engineering-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct social engineering assessment',
  agent: {
    name: 'social-engineer',
    prompt: {
      role: 'social engineering and human factors security specialist',
      task: 'Conduct ethical social engineering assessment to test human layer security controls',
      context: args,
      instructions: [
        'Plan social engineering campaigns within approved tactics',
        'Conduct phishing simulations: spear phishing, whaling, general phishing',
        'Test email security controls: SPF, DKIM, DMARC bypasses',
        'Assess user awareness: clicking malicious links, providing credentials',
        'Test physical security if authorized: tailgating, badge cloning, dumpster diving',
        'Conduct vishing (voice phishing) campaigns if authorized',
        'Test pretexting scenarios to extract information',
        'Assess employee security awareness training effectiveness',
        'Measure click rates, credential submission rates, reporting rates',
        'Document which tactics were most effective',
        'Identify high-risk users and departments',
        'Provide security awareness training recommendations',
        'Ensure all campaigns are ethical and pre-authorized',
        'Track metrics: emails sent, opened, clicked, credentials submitted',
        'Generate user awareness report with training recommendations'
      ],
      outputFormat: 'JSON with campaignsExecuted (number), emailsSent (number), clickRate (number), credentialSubmissionRate (number), successRate (number), reportingRate (number), highRiskUsers (number), vulnerabilities (array), trainingRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaignsExecuted', 'successRate', 'artifacts'],
      properties: {
        campaignsExecuted: { type: 'number' },
        emailsSent: { type: 'number' },
        clickRate: { type: 'number' },
        credentialSubmissionRate: { type: 'number' },
        successRate: { type: 'number' },
        reportingRate: { type: 'number' },
        highRiskUsers: { type: 'number' },
        vulnerabilities: { type: 'array' },
        trainingRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'social-engineering']
}));

// Task 12: Compliance Validation
export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate compliance requirements against findings',
  agent: {
    name: 'compliance-auditor',
    prompt: {
      role: 'security compliance and audit specialist',
      task: 'Map penetration test findings to compliance requirements and assess compliance posture',
      context: args,
      instructions: [
        'Review vulnerabilities against PCI-DSS requirements (if applicable)',
        'Assess SOC 2 security controls based on findings',
        'Validate HIPAA security controls and identify gaps',
        'Check ISO 27001 Annex A controls coverage',
        'Map findings to NIST Cybersecurity Framework',
        'Identify compliance violations based on vulnerabilities',
        'Assess impact of exploited vulnerabilities on compliance',
        'Document compliance gaps and remediation requirements',
        'Provide compliance-specific recommendations',
        'Generate compliance mapping report',
        'Identify critical compliance failures requiring immediate attention',
        'Recommend audit-ready evidence collection',
        'Assess regulatory reporting requirements',
        'Provide compliance roadmap based on findings'
      ],
      outputFormat: 'JSON with requirementsMet (number), totalRequirements (number), complianceGaps (array), criticalViolations (array), complianceStatus (object with each requirement), remediationForCompliance (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirementsMet', 'totalRequirements', 'complianceStatus', 'artifacts'],
      properties: {
        requirementsMet: { type: 'number' },
        totalRequirements: { type: 'number' },
        compliancePercentage: { type: 'number' },
        complianceGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        criticalViolations: { type: 'array', items: { type: 'string' } },
        complianceStatus: { type: 'object' },
        remediationForCompliance: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'compliance']
}));

// Task 13: Risk Analysis and Business Impact Assessment
export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct risk analysis and business impact assessment',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'cybersecurity risk analyst and business impact assessor',
      task: 'Analyze security risks, quantify business impact, and determine overall security posture',
      context: args,
      instructions: [
        'Assess overall security posture: strong, adequate, weak, critical',
        'Calculate risk scores using CVSS and business context',
        'Quantify potential business impact for each vulnerability',
        'Identify critical risks to business operations',
        'Assess likelihood and impact of successful attacks',
        'Calculate potential financial impact: data breach costs, downtime, regulatory fines',
        'Identify crown jewels at risk: customer data, IP, financial systems',
        'Perform attack path analysis: easiest routes to critical assets',
        'Assess cyber insurance implications',
        'Identify systemic security issues and patterns',
        'Prioritize risks by business impact not just technical severity',
        'Create risk heat map visualization',
        'Provide executive-level risk summary',
        'Recommend risk treatment strategies: mitigate, accept, transfer, avoid',
        'Generate risk register'
      ],
      outputFormat: 'JSON with overallSecurityPosture (string), riskScore (0-100), criticalRisks (array), financialImpactEstimate (string), attackPathAnalysis (object), crownJewelsAtRisk (array), riskHeatMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallSecurityPosture', 'riskScore', 'criticalRisks', 'artifacts'],
      properties: {
        overallSecurityPosture: {
          type: 'string',
          enum: ['strong', 'adequate', 'weak', 'critical', 'compromised']
        },
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              businessImpact: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        financialImpactEstimate: { type: 'string' },
        attackPathAnalysis: { type: 'object' },
        crownJewelsAtRisk: { type: 'array', items: { type: 'string' } },
        riskHeatMap: { type: 'object' },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'risk-analysis']
}));

// Task 14: Remediation Recommendations
export const remediationRecommendationsTask = defineTask('remediation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate prioritized remediation recommendations',
  agent: {
    name: 'remediation-advisor',
    prompt: {
      role: 'security remediation strategist and technical advisor',
      task: 'Generate detailed, prioritized, and actionable remediation recommendations for all identified vulnerabilities',
      context: args,
      instructions: [
        'Prioritize vulnerabilities by criticality, exploitability, and business impact',
        'Provide specific remediation guidance for each vulnerability',
        'Include both immediate fixes and long-term strategic improvements',
        'Identify "quick wins": high-impact, low-effort remediations',
        'Group related vulnerabilities for efficient remediation',
        'Provide remediation timelines: immediate (0-7 days), short-term (1-30 days), medium-term (1-3 months)',
        'Include compensating controls where immediate fixes are not feasible',
        'Provide code-level fixes for application vulnerabilities',
        'Recommend configuration changes for infrastructure issues',
        'Suggest security tools and technologies to prevent recurrence',
        'Include remediation validation test cases',
        'Estimate remediation effort and resources required',
        'Provide references: CVE details, vendor advisories, patches',
        'Address root causes not just symptoms',
        'Create remediation roadmap with dependencies'
      ],
      outputFormat: 'JSON with recommendations (array with priority, vulnerability, remediation, effort, timeline, impact), quickWins (number), estimatedRemediationTime (string), remediationRoadmap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'quickWins', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              vulnerabilityId: { type: 'string' },
              vulnerability: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              timeline: { type: 'string' },
              impact: { type: 'string' },
              compensatingControls: { type: 'array', items: { type: 'string' } },
              validationTestCase: { type: 'string' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: { type: 'number' },
        estimatedRemediationTime: { type: 'string' },
        remediationRoadmap: {
          type: 'object',
          properties: {
            immediate: { type: 'array', items: { type: 'string' } },
            shortTerm: { type: 'array', items: { type: 'string' } },
            mediumTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } }
          }
        },
        strategicRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'remediation']
}));

// Task 15: Penetration Test Report Generation
export const penetrationTestReportTask = defineTask('pentest-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive penetration test report',
  agent: {
    name: 'pentest-report-writer',
    prompt: {
      role: 'senior penetration testing report writer and communicator',
      task: 'Generate comprehensive, professional penetration test report suitable for both executive and technical audiences',
      context: args,
      instructions: [
        'Create executive summary: key findings, risk rating, business impact, recommendations',
        'Document testing scope and methodology (OWASP/PTES/NIST)',
        'Provide testing timeline and activities performed',
        'Include high-level statistics: vulnerabilities by severity, exploitation success rate',
        'Detail each vulnerability: description, severity, CVSS score, impact, evidence, reproduction steps',
        'Include screenshots and proof-of-concept code where appropriate',
        'Provide remediation recommendations for each finding',
        'Include technical appendices: scan results, tool outputs, detailed logs',
        'Add compliance mapping section if applicable',
        'Include risk analysis and business impact assessment',
        'Provide attack path visualizations and network diagrams',
        'Add glossary for technical terms',
        'Ensure report is professional, clear, and actionable',
        'Format with proper structure: TOC, sections, formatting',
        'Generate both executive summary (5-10 pages) and full technical report',
        'Include attestation and disclaimer sections'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummaryGenerated (boolean), reportPages (number), sections (array), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummaryGenerated', 'reportPages', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryGenerated: { type: 'boolean' },
        reportPages: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              pages: { type: 'number' }
            }
          }
        },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              severity: { type: 'string' },
              businessImpact: { type: 'string' }
            }
          }
        },
        executiveSummary: { type: 'string' },
        riskRating: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'reporting']
}));

// Task 16: Remediation Validation
export const remediationValidationTask = defineTask('remediation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan remediation validation and retest',
  agent: {
    name: 'retest-coordinator',
    prompt: {
      role: 'penetration test retest and validation specialist',
      task: 'Create remediation validation plan and schedule retest activities',
      context: args,
      instructions: [
        'Review critical and high severity vulnerabilities requiring retest',
        'Create validation test cases for each remediated vulnerability',
        'Define acceptance criteria for each remediation',
        'Prioritize retest activities based on risk',
        'Estimate retest effort and duration',
        'Schedule retest window with stakeholders',
        'Create retest methodology and procedures',
        'Define success criteria for overall retest',
        'Plan for partial vs full retest based on remediation scope',
        'Document expected remediation timeline',
        'Create tracking mechanism for remediation progress',
        'Define retest deliverables and reporting',
        'Set up communication plan for retest results',
        'Plan for multiple retest iterations if needed',
        'Generate remediation tracking spreadsheet'
      ],
      outputFormat: 'JSON with validationTestCases (number), estimatedRetestDuration (string), retestScope (array), acceptanceCriteria (array), retestSchedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationTestCases', 'estimatedRetestDuration', 'retestScope', 'artifacts'],
      properties: {
        validationTestCases: { type: 'number' },
        estimatedRetestDuration: { type: 'string' },
        retestScope: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerabilityId: { type: 'string' },
              vulnerability: { type: 'string' },
              validationTestCase: { type: 'string' },
              acceptanceCriteria: { type: 'string' }
            }
          }
        },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        retestSchedule: {
          type: 'object',
          properties: {
            suggestedStartDate: { type: 'string' },
            estimatedCompletionDate: { type: 'string' },
            milestones: { type: 'array', items: { type: 'string' } }
          }
        },
        remediationTracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'penetration-testing', 'remediation-validation']
}));
