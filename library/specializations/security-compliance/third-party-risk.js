/**
 * @process specializations/security-compliance/third-party-risk
 * @description Third-Party Risk Assessment - Comprehensive security due diligence and ongoing monitoring of third-party
 * vendors, suppliers, and service providers to manage supply chain security risks. Includes vendor security
 * questionnaires, certification reviews, risk scoring, contract security requirements, data protection agreements,
 * periodic reassessments, and incident notification procedures based on industry frameworks and best practices.
 * @inputs { projectName: string, vendors?: array, assessmentType?: string, riskCategories?: array, complianceFrameworks?: array }
 * @outputs { success: boolean, overallRiskScore: number, vendors: array, riskAssessment: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/third-party-risk', {
 *   projectName: 'E-Commerce Platform Vendor Assessment',
 *   vendors: [
 *     { name: 'Payment Gateway Inc', type: 'payment-processor', criticality: 'critical' },
 *     { name: 'Cloud Storage Co', type: 'infrastructure', criticality: 'high' },
 *     { name: 'Analytics Service', type: 'saas', criticality: 'medium' }
 *   ],
 *   assessmentType: 'comprehensive', // 'initial', 'comprehensive', 'periodic', 'targeted'
 *   riskCategories: ['security', 'compliance', 'financial', 'operational', 'reputational'],
 *   complianceFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI-DSS'],
 *   dataClassification: ['public', 'internal', 'confidential', 'restricted'],
 *   assessmentFrequency: 'annual', // 'quarterly', 'annual', 'biennial'
 *   autoScoring: true,
 *   remediationTracking: true,
 *   continuousMonitoring: true
 * });
 *
 * @references
 * - Shared Assessments SIG: https://www.shared-assessments.org/
 * - NIST SP 800-161 (Supply Chain Risk Management): https://csrc.nist.gov/publications/detail/sp/800-161/rev-1/final
 * - ISO 27036 (Supplier Relationships): https://www.iso.org/standard/59648.html
 * - CAIQ (Consensus Assessments Initiative Questionnaire): https://cloudsecurityalliance.org/artifacts/caiq/
 * - BitSight and SecurityScorecard (Third-Party Risk): https://www.bitsight.com/
 * - NIST Cybersecurity Supply Chain Risk Management: https://csrc.nist.gov/projects/cyber-supply-chain-risk-management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vendors = [],
    assessmentType = 'comprehensive', // 'initial', 'comprehensive', 'periodic', 'targeted'
    riskCategories = ['security', 'compliance', 'financial', 'operational', 'reputational'],
    complianceFrameworks = ['SOC2', 'ISO27001'],
    dataClassification = ['public', 'internal', 'confidential', 'restricted'],
    assessmentFrequency = 'annual', // 'quarterly', 'annual', 'biennial'
    outputDir = 'third-party-risk-output',
    autoScoring = true,
    remediationTracking = true,
    continuousMonitoring = false,
    integrations = {
      questionnaire: 'oneTrust', // 'oneTrust', 'vendorpedia', 'shared-assessments'
      monitoring: ['bitsight', 'securityScorecard'],
      ticketing: 'jira', // 'jira', 'servicenow', 'linear'
      grc: 'vanta' // 'vanta', 'drata', 'secureframe'
    },
    includeFinancialRisk = true,
    includeCyberInsurance = true,
    requireSlaAgreements = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let overallRiskScore = 0;
  const vendorAssessments = [];
  const riskFindings = [];
  const remediationItems = [];

  ctx.log('info', `Starting Third-Party Risk Assessment for ${projectName}`);
  ctx.log('info', `Assessment Type: ${assessmentType}, Vendors: ${vendors.length}`);
  ctx.log('info', `Risk Categories: ${riskCategories.join(', ')}`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);

  // ============================================================================
  // PHASE 1: VENDOR INVENTORY AND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and classifying vendors');

  const inventoryResult = await ctx.task(vendorInventoryTask, {
    projectName,
    vendors,
    dataClassification,
    includeFinancialRisk,
    outputDir
  });

  artifacts.push(...inventoryResult.artifacts);

  ctx.log('info', `Vendor inventory complete - ${inventoryResult.totalVendors} vendors classified into ${inventoryResult.criticalityLevels.length} criticality levels`);

  // Quality Gate: Vendor inventory review
  await ctx.breakpoint({
    question: `Vendor inventory complete for ${projectName}. Identified ${inventoryResult.totalVendors} vendors (${inventoryResult.criticalVendors} critical). Review vendor classification?`,
    title: 'Vendor Inventory Review',
    context: {
      runId: ctx.runId,
      inventory: {
        totalVendors: inventoryResult.totalVendors,
        criticalVendors: inventoryResult.criticalVendors,
        highVendors: inventoryResult.highVendors,
        mediumVendors: inventoryResult.mediumVendors,
        lowVendors: inventoryResult.lowVendors,
        vendorTypes: inventoryResult.vendorTypes
      },
      criticalVendorsList: inventoryResult.criticalVendorsList,
      dataAccessBreakdown: inventoryResult.dataAccessBreakdown,
      files: inventoryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: SECURITY QUESTIONNAIRE DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Distributing and collecting security questionnaires');

  const questionnaireResult = await ctx.task(distributeQuestionnaireTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    assessmentType,
    complianceFrameworks,
    integrations,
    outputDir
  });

  artifacts.push(...questionnaireResult.artifacts);

  ctx.log('info', `Questionnaires distributed - ${questionnaireResult.sent} sent, ${questionnaireResult.completed} completed, ${questionnaireResult.pending} pending`);

  // Quality Gate: Questionnaire completion review
  await ctx.breakpoint({
    question: `Security questionnaires sent to ${questionnaireResult.sent} vendors. ${questionnaireResult.completed} completed, ${questionnaireResult.pending} pending. Proceed with assessment?`,
    title: 'Questionnaire Collection Review',
    context: {
      runId: ctx.runId,
      questionnaire: {
        sent: questionnaireResult.sent,
        completed: questionnaireResult.completed,
        pending: questionnaireResult.pending,
        completionRate: questionnaireResult.completionRate,
        avgResponseTime: questionnaireResult.avgResponseTime
      },
      completedVendors: questionnaireResult.completedVendorsList,
      pendingVendors: questionnaireResult.pendingVendorsList,
      files: questionnaireResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: SECURITY CERTIFICATION VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Verifying security certifications and attestations');

  const certificationResult = await ctx.task(verifyCertificationsTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    complianceFrameworks,
    requireSlaAgreements,
    outputDir
  });

  artifacts.push(...certificationResult.artifacts);

  ctx.log('info', `Certification verification complete - ${certificationResult.verified} verified, ${certificationResult.missing} missing, ${certificationResult.expired} expired`);

  // ============================================================================
  // PHASE 4: SECURITY CONTROL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing vendor security controls');

  const controlAssessmentResult = await ctx.task(assessSecurityControlsTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    questionnaireResponses: questionnaireResult.responses,
    riskCategories,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...controlAssessmentResult.artifacts);

  ctx.log('info', `Security control assessment complete - ${controlAssessmentResult.controlsAssessed} controls assessed across ${controlAssessmentResult.vendorsAssessed} vendors`);

  // ============================================================================
  // PHASE 5: DATA PROTECTION AND PRIVACY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing data protection and privacy controls');

  const dataProtectionResult = await ctx.task(assessDataProtectionTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    dataClassification,
    complianceFrameworks,
    questionnaireResponses: questionnaireResult.responses,
    outputDir
  });

  artifacts.push(...dataProtectionResult.artifacts);

  ctx.log('info', `Data protection assessment complete - ${dataProtectionResult.dpaRequired} DPAs required, ${dataProtectionResult.dpaCompleted} completed`);

  // Quality Gate: Data protection review
  await ctx.breakpoint({
    question: `Data protection assessment complete. ${dataProtectionResult.dpaRequired} DPAs required, ${dataProtectionResult.highRiskVendors} high-risk data processors identified. Review findings?`,
    title: 'Data Protection Assessment Review',
    context: {
      runId: ctx.runId,
      dataProtection: {
        dpaRequired: dataProtectionResult.dpaRequired,
        dpaCompleted: dataProtectionResult.dpaCompleted,
        dpaMissing: dataProtectionResult.dpaMissing,
        highRiskVendors: dataProtectionResult.highRiskVendors,
        subProcessors: dataProtectionResult.subProcessors
      },
      complianceGaps: dataProtectionResult.complianceGaps,
      highRiskVendorsList: dataProtectionResult.highRiskVendorsList,
      files: dataProtectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: FINANCIAL AND OPERATIONAL RISK ASSESSMENT
  // ============================================================================

  if (includeFinancialRisk) {
    ctx.log('info', 'Phase 6: Assessing financial and operational risks');

    const financialRiskResult = await ctx.task(assessFinancialRiskTask, {
      projectName,
      vendors: inventoryResult.vendorsList,
      includeCyberInsurance,
      outputDir
    });

    artifacts.push(...financialRiskResult.artifacts);

    ctx.log('info', `Financial risk assessment complete - ${financialRiskResult.financiallyStable} stable, ${financialRiskResult.financialRisks} at risk`);
  }

  // ============================================================================
  // PHASE 7: CONTINUOUS MONITORING AND SCORING
  // ============================================================================

  if (continuousMonitoring) {
    ctx.log('info', 'Phase 7: Setting up continuous security monitoring');

    const monitoringResult = await ctx.task(setupContinuousMonitoringTask, {
      projectName,
      vendors: inventoryResult.vendorsList,
      integrations,
      outputDir
    });

    artifacts.push(...monitoringResult.artifacts);

    ctx.log('info', `Continuous monitoring configured for ${monitoringResult.monitored} vendors using ${monitoringResult.tools.join(', ')}`);
  }

  // ============================================================================
  // PHASE 8: AUTOMATED RISK SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Calculating automated risk scores');

  const scoringResult = await ctx.task(calculateRiskScoresTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    controlAssessment: controlAssessmentResult,
    dataProtection: dataProtectionResult,
    certifications: certificationResult,
    financialRisk: includeFinancialRisk ? inventoryResult.financialRiskData : null,
    autoScoring,
    outputDir
  });

  artifacts.push(...scoringResult.artifacts);
  vendorAssessments.push(...scoringResult.vendorScores);

  ctx.log('info', `Risk scoring complete - ${scoringResult.highRisk} high risk, ${scoringResult.mediumRisk} medium risk, ${scoringResult.lowRisk} low risk vendors`);

  // Quality Gate: Risk scoring review
  await ctx.breakpoint({
    question: `Risk scoring complete. ${scoringResult.highRisk} high-risk vendors, ${scoringResult.criticalFindings} critical findings identified. Review risk scores?`,
    title: 'Risk Scoring Review',
    context: {
      runId: ctx.runId,
      scoring: {
        totalVendors: scoringResult.totalVendors,
        highRisk: scoringResult.highRisk,
        mediumRisk: scoringResult.mediumRisk,
        lowRisk: scoringResult.lowRisk,
        criticalFindings: scoringResult.criticalFindings,
        avgRiskScore: scoringResult.avgRiskScore
      },
      highRiskVendors: scoringResult.highRiskVendorsList.map(v => ({
        name: v.name,
        riskScore: v.riskScore,
        riskLevel: v.riskLevel,
        topRisks: v.topRisks
      })),
      files: scoringResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: RISK FINDING IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Identifying and documenting risk findings');

  const findingsResult = await ctx.task(identifyRiskFindingsTask, {
    projectName,
    vendorScores: scoringResult.vendorScores,
    controlAssessment: controlAssessmentResult,
    dataProtection: dataProtectionResult,
    certifications: certificationResult,
    riskCategories,
    outputDir
  });

  artifacts.push(...findingsResult.artifacts);
  riskFindings.push(...findingsResult.findings);

  ctx.log('info', `Risk findings identified - ${findingsResult.totalFindings} findings (${findingsResult.critical} critical, ${findingsResult.high} high)`);

  // ============================================================================
  // PHASE 10: REMEDIATION PLANNING AND TRACKING
  // ============================================================================

  if (remediationTracking) {
    ctx.log('info', 'Phase 10: Creating remediation plans and tracking');

    const remediationResult = await ctx.task(createRemediationPlansTask, {
      projectName,
      findings: findingsResult.findings,
      vendors: inventoryResult.vendorsList,
      integrations,
      outputDir
    });

    artifacts.push(...remediationResult.artifacts);
    remediationItems.push(...remediationResult.remediationItems);

    ctx.log('info', `Remediation planning complete - ${remediationResult.plansCreated} plans created, ${remediationResult.ticketsCreated} tickets created`);

    // Quality Gate: Remediation plan review
    await ctx.breakpoint({
      question: `Remediation plans created for ${remediationResult.plansCreated} vendors. ${remediationResult.critical} critical issues require immediate attention. Approve remediation plans?`,
      title: 'Remediation Planning Review',
      context: {
        runId: ctx.runId,
        remediation: {
          plansCreated: remediationResult.plansCreated,
          ticketsCreated: remediationResult.ticketsCreated,
          critical: remediationResult.critical,
          high: remediationResult.high,
          acceptedRisks: remediationResult.acceptedRisks
        },
        criticalRemediations: remediationResult.criticalRemediationsList,
        files: remediationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: CONTRACT AND SLA REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 11: Reviewing contracts and SLA agreements');

  const contractReviewResult = await ctx.task(reviewContractsSlaTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    riskFindings: findingsResult.findings,
    requireSlaAgreements,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...contractReviewResult.artifacts);

  ctx.log('info', `Contract review complete - ${contractReviewResult.reviewed} contracts reviewed, ${contractReviewResult.gaps} gaps identified`);

  // ============================================================================
  // PHASE 12: INCIDENT RESPONSE AND NOTIFICATION PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 12: Establishing incident response and notification procedures');

  const incidentProceduresResult = await ctx.task(establishIncidentProceduresTask, {
    projectName,
    vendors: inventoryResult.vendorsList,
    criticality: inventoryResult.criticalityBreakdown,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...incidentProceduresResult.artifacts);

  ctx.log('info', `Incident procedures established - ${incidentProceduresResult.proceduresCreated} vendor-specific procedures created`);

  // ============================================================================
  // PHASE 13: COMPLIANCE MAPPING AND REPORTING
  // ============================================================================

  if (complianceFrameworks.length > 0) {
    ctx.log('info', 'Phase 13: Mapping to compliance frameworks and generating reports');

    const complianceResult = await ctx.task(mapComplianceFrameworksTask, {
      projectName,
      vendors: inventoryResult.vendorsList,
      vendorScores: scoringResult.vendorScores,
      findings: findingsResult.findings,
      complianceFrameworks,
      outputDir
    });

    artifacts.push(...complianceResult.artifacts);

    ctx.log('info', `Compliance mapping complete - ${complianceResult.frameworks.length} frameworks mapped, ${complianceResult.complianceGaps} gaps identified`);

    // Quality Gate: Compliance review
    await ctx.breakpoint({
      question: `Compliance mapping complete for ${complianceFrameworks.join(', ')}. ${complianceResult.complianceGaps} compliance gaps identified. Review compliance status?`,
      title: 'Compliance Mapping Review',
      context: {
        runId: ctx.runId,
        compliance: {
          frameworks: complianceFrameworks,
          complianceScore: complianceResult.complianceScore,
          complianceGaps: complianceResult.complianceGaps,
          compliantVendors: complianceResult.compliantVendors,
          nonCompliantVendors: complianceResult.nonCompliantVendors
        },
        frameworkStatus: complianceResult.frameworkStatus,
        files: complianceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: EXECUTIVE REPORTING AND DASHBOARD
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating executive reports and dashboards');

  const reportingResult = await ctx.task(generateExecutiveReportsTask, {
    projectName,
    inventoryResult,
    scoringResult,
    findingsResult,
    remediationItems,
    contractReviewResult,
    complianceFrameworks,
    assessmentType,
    outputDir
  });

  artifacts.push(...reportingResult.artifacts);

  ctx.log('info', `Executive reports generated - Report: ${reportingResult.executiveReportPath}`);

  // ============================================================================
  // PHASE 15: CALCULATE OVERALL RISK SCORE
  // ============================================================================

  ctx.log('info', 'Phase 15: Calculating overall third-party risk score');

  const overallScoringResult = await ctx.task(calculateOverallRiskScoreTask, {
    projectName,
    vendorScores: scoringResult.vendorScores,
    findings: findingsResult.findings,
    inventoryResult,
    complianceFrameworks,
    outputDir
  });

  overallRiskScore = overallScoringResult.overallRiskScore;
  artifacts.push(...overallScoringResult.artifacts);

  ctx.log('info', `Overall Third-Party Risk Score: ${overallRiskScore}/100 (${overallScoringResult.riskLevel})`);

  // Final Breakpoint: Assessment complete
  await ctx.breakpoint({
    question: `Third-Party Risk Assessment Complete for ${projectName}. Overall Risk Score: ${overallRiskScore}/100 (${overallScoringResult.riskLevel}). ${scoringResult.highRisk} high-risk vendors identified. Review final assessment?`,
    title: 'Final Third-Party Risk Assessment Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        assessmentType,
        overallRiskScore,
        riskLevel: overallScoringResult.riskLevel,
        totalVendors: inventoryResult.totalVendors,
        criticalVendors: inventoryResult.criticalVendors,
        highRiskVendors: scoringResult.highRisk,
        totalFindings: findingsResult.totalFindings,
        criticalFindings: findingsResult.critical,
        remediationPlans: remediationItems.length
      },
      breakdown: {
        inventory: {
          totalVendors: inventoryResult.totalVendors,
          critical: inventoryResult.criticalVendors,
          high: inventoryResult.highVendors,
          medium: inventoryResult.mediumVendors,
          low: inventoryResult.lowVendors
        },
        questionnaires: {
          sent: questionnaireResult.sent,
          completed: questionnaireResult.completed,
          completionRate: questionnaireResult.completionRate
        },
        certifications: {
          verified: certificationResult.verified,
          missing: certificationResult.missing,
          expired: certificationResult.expired
        },
        riskScoring: {
          highRisk: scoringResult.highRisk,
          mediumRisk: scoringResult.mediumRisk,
          lowRisk: scoringResult.lowRisk,
          avgRiskScore: scoringResult.avgRiskScore
        },
        findings: {
          total: findingsResult.totalFindings,
          critical: findingsResult.critical,
          high: findingsResult.high,
          medium: findingsResult.medium,
          low: findingsResult.low
        }
      },
      verdict: overallScoringResult.verdict,
      topRecommendations: overallScoringResult.topRecommendations,
      files: [
        { path: reportingResult.executiveReportPath, format: 'markdown', label: 'Executive Risk Report' },
        { path: overallScoringResult.summaryPath, format: 'json', label: 'Overall Risk Score Summary' },
        { path: reportingResult.dashboardPath, format: 'json', label: 'Risk Dashboard Data' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    assessmentType,
    overallRiskScore,
    riskLevel: overallScoringResult.riskLevel,
    vendors: {
      total: inventoryResult.totalVendors,
      critical: inventoryResult.criticalVendors,
      high: inventoryResult.highVendors,
      medium: inventoryResult.mediumVendors,
      low: inventoryResult.lowVendors,
      highRisk: scoringResult.highRisk,
      mediumRisk: scoringResult.mediumRisk,
      lowRisk: scoringResult.lowRisk
    },
    riskAssessment: {
      totalFindings: findingsResult.totalFindings,
      criticalFindings: findingsResult.critical,
      highFindings: findingsResult.high,
      mediumFindings: findingsResult.medium,
      lowFindings: findingsResult.low,
      findings: riskFindings
    },
    questionnaires: {
      sent: questionnaireResult.sent,
      completed: questionnaireResult.completed,
      pending: questionnaireResult.pending,
      completionRate: questionnaireResult.completionRate
    },
    certifications: {
      verified: certificationResult.verified,
      missing: certificationResult.missing,
      expired: certificationResult.expired,
      verificationRate: certificationResult.verificationRate
    },
    dataProtection: {
      dpaRequired: dataProtectionResult.dpaRequired,
      dpaCompleted: dataProtectionResult.dpaCompleted,
      highRiskProcessors: dataProtectionResult.highRiskVendors,
      complianceGaps: dataProtectionResult.complianceGaps
    },
    remediation: remediationTracking ? {
      plansCreated: remediationItems.length,
      critical: remediationItems.filter(r => r.severity === 'critical').length,
      high: remediationItems.filter(r => r.severity === 'high').length,
      items: remediationItems
    } : null,
    contracts: {
      reviewed: contractReviewResult.reviewed,
      gaps: contractReviewResult.gaps,
      slaCompliant: contractReviewResult.slaCompliant
    },
    compliance: complianceFrameworks.length > 0 ? {
      frameworks: complianceFrameworks,
      complianceScore: reportingResult.complianceScore || 0,
      compliantVendors: reportingResult.compliantVendors || 0,
      nonCompliantVendors: reportingResult.nonCompliantVendors || 0
    } : null,
    recommendations: overallScoringResult.topRecommendations,
    artifacts,
    documentation: {
      executiveReportPath: reportingResult.executiveReportPath,
      dashboardPath: reportingResult.dashboardPath,
      summaryPath: overallScoringResult.summaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/security-compliance/third-party-risk',
      processSlug: 'third-party-risk',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      assessmentFrequency,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Vendor Inventory and Classification
export const vendorInventoryTask = defineTask('vendor-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Vendor Inventory and Classification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vendor Risk Management Specialist',
      task: 'Discover, inventory, and classify all third-party vendors based on criticality and data access',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        dataClassification: args.dataClassification,
        includeFinancialRisk: args.includeFinancialRisk,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Discover and inventory all third-party vendors and suppliers:',
        '   - Payment processors and financial services',
        '   - Cloud infrastructure and hosting providers',
        '   - SaaS applications and platforms',
        '   - Development tools and services',
        '   - Professional services and consultants',
        '   - Marketing and analytics platforms',
        '   - Customer support and communication tools',
        '2. For each vendor, collect key information:',
        '   - Vendor name and legal entity',
        '   - Vendor type and service category',
        '   - Primary contact and relationship owner',
        '   - Services provided and dependencies',
        '   - Data types accessed (public, internal, confidential, restricted)',
        '   - System integrations and access levels',
        '   - Contract start/end dates',
        '   - Annual spend and payment terms',
        '3. Classify vendors by business criticality:',
        '   - Critical: Essential to business operations, significant customer impact if unavailable',
        '   - High: Important services, moderate customer impact',
        '   - Medium: Standard services, limited customer impact',
        '   - Low: Non-essential services, minimal impact',
        '4. Classify by data sensitivity:',
        '   - Level 1: Access to restricted data (PII, PHI, payment data)',
        '   - Level 2: Access to confidential data (business secrets, internal data)',
        '   - Level 3: Access to internal data only',
        '   - Level 4: Access to public data only',
        '5. Identify vendor concentrations and dependencies',
        '6. Map vendor relationships and sub-processors',
        '7. Calculate initial risk tier based on criticality and data access',
        '8. Create vendor registry database/spreadsheet',
        '9. Generate vendor portfolio visualization'
      ],
      outputFormat: 'JSON object with vendor inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalVendors', 'vendorsList', 'criticalityLevels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalVendors: { type: 'number' },
        criticalVendors: { type: 'number' },
        highVendors: { type: 'number' },
        mediumVendors: { type: 'number' },
        lowVendors: { type: 'number' },
        vendorsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              dataAccess: { type: 'array', items: { type: 'string' } },
              services: { type: 'string' },
              contactEmail: { type: 'string' },
              contractEnd: { type: 'string' },
              initialRiskTier: { type: 'string' }
            }
          }
        },
        criticalVendorsList: { type: 'array', items: { type: 'object' } },
        vendorTypes: { type: 'array', items: { type: 'string' } },
        criticalityLevels: { type: 'array', items: { type: 'string' } },
        dataAccessBreakdown: {
          type: 'object',
          properties: {
            restricted: { type: 'number' },
            confidential: { type: 'number' },
            internal: { type: 'number' },
            public: { type: 'number' }
          }
        },
        criticalityBreakdown: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        financialRiskData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'vendor-inventory']
}));

// Phase 2: Distribute Security Questionnaire
export const distributeQuestionnaireTask = defineTask('distribute-questionnaire', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 2: Distribute Security Questionnaires - ${args.projectName}`,
  skill: {
    name: 'vendor-security-questionnaire',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vendor Security Assessment Coordinator',
      task: 'Distribute and collect security questionnaires from vendors',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        assessmentType: args.assessmentType,
        complianceFrameworks: args.complianceFrameworks,
        integrations: args.integrations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate questionnaire type for each vendor:',
        '   - Comprehensive: Full security assessment (150-200 questions)',
        '   - Standard: Standard security assessment (80-120 questions)',
        '   - Lite: Basic security assessment (30-50 questions)',
        '   - Targeted: Specific domain assessment',
        '2. Use industry-standard questionnaire frameworks:',
        '   - SIG (Standardized Information Gathering) from Shared Assessments',
        '   - CAIQ (Consensus Assessments Initiative Questionnaire) from CSA',
        '   - VSA (Vendor Security Assessment) custom templates',
        '   - Framework-specific questionnaires (SOC 2, ISO 27001, GDPR, HIPAA)',
        '3. Questionnaire domains to cover:',
        '   - Information Security Policy and Governance',
        '   - Asset and Change Management',
        '   - Identity and Access Management',
        '   - Network Security and Segmentation',
        '   - Encryption and Key Management',
        '   - Vulnerability and Patch Management',
        '   - Logging, Monitoring, and Incident Response',
        '   - Business Continuity and Disaster Recovery',
        '   - Physical and Environmental Security',
        '   - Data Protection and Privacy',
        '   - Third-Party Management',
        '   - Compliance and Audit',
        '4. Distribute questionnaires via configured platform:',
        '   - OneTrust, Vendorpedia, or Shared Assessments platform',
        '   - Set response deadline based on vendor criticality',
        '   - Include instructions and contact information',
        '5. Track questionnaire status and send reminders',
        '6. Collect and validate completed responses',
        '7. Follow up on incomplete or unclear responses',
        '8. Aggregate response data for analysis',
        '9. Generate questionnaire completion report'
      ],
      outputFormat: 'JSON object with questionnaire distribution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sent', 'completed', 'pending', 'completionRate', 'responses', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sent: { type: 'number' },
        completed: { type: 'number' },
        pending: { type: 'number' },
        overdue: { type: 'number' },
        completionRate: { type: 'number', description: 'Percentage of completed questionnaires' },
        avgResponseTime: { type: 'number', description: 'Average days to complete' },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              questionnaireType: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'pending', 'overdue'] },
              completedDate: { type: 'string' },
              responseData: { type: 'object' }
            }
          }
        },
        completedVendorsList: { type: 'array', items: { type: 'object' } },
        pendingVendorsList: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'questionnaire']
}));

// Phase 3: Verify Security Certifications
export const verifyCertificationsTask = defineTask('verify-certifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Verify Security Certifications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Certification Verifier',
      task: 'Verify vendor security certifications, audit reports, and attestations',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        complianceFrameworks: args.complianceFrameworks,
        requireSlaAgreements: args.requireSlaAgreements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Request and collect security certifications and audit reports:',
        '   - SOC 2 Type II (or Type I for new vendors)',
        '   - ISO 27001 certification',
        '   - PCI DSS AOC (for payment processors)',
        '   - HIPAA compliance attestation (for healthcare data)',
        '   - GDPR/privacy shield certifications',
        '   - FedRAMP authorization (for government work)',
        '   - Industry-specific certifications (HITRUST, StateRAMP)',
        '2. Verify authenticity and validity:',
        '   - Check certification dates and expiration',
        '   - Verify with issuing bodies where possible',
        '   - Review audit firm credentials',
        '   - Check scope of certification matches services',
        '3. Review SOC 2 Type II reports in detail:',
        '   - Review service organization control objectives',
        '   - Check audit period and testing dates',
        '   - Review exceptions and management responses',
        '   - Assess complementary user entity controls (CUECs)',
        '   - Verify Trust Services Criteria coverage',
        '4. Assess ISO 27001 certifications:',
        '   - Verify certification body accreditation',
        '   - Review scope and applicability',
        '   - Check certification date and validity period',
        '   - Review any exclusions or limitations',
        '5. Review penetration test reports:',
        '   - Check test date recency (within last year)',
        '   - Review findings and remediation status',
        '   - Assess test scope and methodology',
        '6. Verify SLA and uptime commitments:',
        '   - Review service level agreements',
        '   - Check historical uptime and performance',
        '   - Verify monitoring and reporting capabilities',
        '7. Document missing or expired certifications',
        '8. Flag vendors with certification gaps',
        '9. Generate certification verification report'
      ],
      outputFormat: 'JSON object with certification verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'verified', 'missing', 'expired', 'verificationRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        verified: { type: 'number' },
        missing: { type: 'number' },
        expired: { type: 'number' },
        partial: { type: 'number', description: 'Vendors with some but not all required certifications' },
        verificationRate: { type: 'number', description: 'Percentage with valid certifications' },
        certificationBreakdown: {
          type: 'object',
          properties: {
            soc2: { type: 'number' },
            iso27001: { type: 'number' },
            pciDss: { type: 'number' },
            hipaa: { type: 'number' },
            gdpr: { type: 'number' },
            other: { type: 'number' }
          }
        },
        vendorCertifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              certifications: { type: 'array', items: { type: 'string' } },
              expirationDates: { type: 'object' },
              missingCertifications: { type: 'array', items: { type: 'string' } },
              certificationStatus: { type: 'string', enum: ['complete', 'partial', 'missing', 'expired'] }
            }
          }
        },
        missingCertificationsList: { type: 'array', items: { type: 'object' } },
        expiringCertifications: { type: 'array', items: { type: 'object' }, description: 'Certifications expiring within 90 days' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'certifications']
}));

// Phase 4: Assess Security Controls
export const assessSecurityControlsTask = defineTask('assess-security-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Assess Vendor Security Controls - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Control Assessment Specialist',
      task: 'Assess vendor security controls based on questionnaire responses and evidence',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        questionnaireResponses: args.questionnaireResponses,
        riskCategories: args.riskCategories,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review questionnaire responses and assess security controls:',
        '   - Governance and Risk Management:',
        '     * Security policies and procedures',
        '     * Risk management program',
        '     * Security organization and roles',
        '     * Board oversight and reporting',
        '   - Access Control:',
        '     * Identity and access management',
        '     * Authentication mechanisms (MFA)',
        '     * Authorization and least privilege',
        '     * Access reviews and certifications',
        '   - Encryption and Data Protection:',
        '     * Data encryption at rest and in transit',
        '     * Key management',
        '     * Data classification and handling',
        '     * Secure data disposal',
        '   - Network Security:',
        '     * Network segmentation',
        '     * Firewall and IDS/IPS',
        '     * VPN and remote access',
        '     * DDoS protection',
        '   - Application Security:',
        '     * Secure development lifecycle',
        '     * Code review and testing',
        '     * Vulnerability management',
        '     * Web application firewall',
        '   - Monitoring and Logging:',
        '     * Security event logging',
        '     * SIEM and monitoring',
        '     * Log retention and protection',
        '     * Alerting and response',
        '   - Incident Response:',
        '     * Incident response plan',
        '     * Detection and triage',
        '     * Notification procedures',
        '     * Post-incident reviews',
        '   - Business Continuity:',
        '     * Backup and recovery',
        '     * Disaster recovery plan',
        '     * RTO/RPO targets',
        '     * BC/DR testing',
        '   - Physical Security:',
        '     * Data center security',
        '     * Physical access controls',
        '     * Environmental controls',
        '   - Compliance and Audit:',
        '     * Compliance program',
        '     * Internal and external audits',
        '     * Remediation tracking',
        '2. Score each control domain (0-100 scale)',
        '3. Identify control gaps and weaknesses',
        '4. Map controls to compliance framework requirements',
        '5. Assess control maturity level (initial, managed, defined, optimized)',
        '6. Calculate overall control effectiveness score',
        '7. Flag high-risk control deficiencies',
        '8. Generate security control assessment report'
      ],
      outputFormat: 'JSON object with security control assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controlsAssessed', 'vendorsAssessed', 'avgControlScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controlsAssessed: { type: 'number' },
        vendorsAssessed: { type: 'number' },
        avgControlScore: { type: 'number', description: 'Average control effectiveness score across all vendors' },
        controlDomains: { type: 'array', items: { type: 'string' } },
        vendorControlScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              overallControlScore: { type: 'number' },
              domainScores: {
                type: 'object',
                properties: {
                  governance: { type: 'number' },
                  accessControl: { type: 'number' },
                  encryption: { type: 'number' },
                  networkSecurity: { type: 'number' },
                  applicationSecurity: { type: 'number' },
                  monitoring: { type: 'number' },
                  incidentResponse: { type: 'number' },
                  businessContinuity: { type: 'number' },
                  physicalSecurity: { type: 'number' },
                  compliance: { type: 'number' }
                }
              },
              controlGaps: { type: 'array', items: { type: 'string' } },
              maturityLevel: { type: 'string', enum: ['initial', 'managed', 'defined', 'optimized'] }
            }
          }
        },
        criticalControlGaps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'control-assessment']
}));

// Phase 5: Assess Data Protection
export const assessDataProtectionTask = defineTask('assess-data-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Assess Data Protection and Privacy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Privacy and Protection Specialist',
      task: 'Assess vendor data protection and privacy controls, DPA requirements',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        dataClassification: args.dataClassification,
        complianceFrameworks: args.complianceFrameworks,
        questionnaireResponses: args.questionnaireResponses,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess data protection controls for each vendor:',
        '   - Data classification and handling procedures',
        '   - Encryption at rest and in transit',
        '   - Data loss prevention (DLP)',
        '   - Secure data disposal and destruction',
        '   - Data residency and sovereignty',
        '   - Cross-border data transfers',
        '2. Evaluate privacy compliance:',
        '   - GDPR compliance (for EU data)',
        '   - CCPA compliance (for California data)',
        '   - HIPAA compliance (for healthcare data)',
        '   - Data subject rights implementation (access, deletion, portability)',
        '   - Consent management',
        '   - Privacy impact assessments',
        '   - Privacy by design practices',
        '3. Review Data Processing Agreements (DPAs):',
        '   - Verify DPA is in place and signed',
        '   - Check DPA includes GDPR requirements (if applicable)',
        '   - Review data processing purposes and limitations',
        '   - Verify sub-processor disclosure and approval',
        '   - Check breach notification timeframes',
        '   - Review data retention and deletion obligations',
        '4. Assess sub-processor management:',
        '   - Inventory of sub-processors',
        '   - Sub-processor approval mechanisms',
        '   - Flow-down of security requirements',
        '   - Sub-processor monitoring',
        '5. Evaluate data breach response:',
        '   - Breach detection capabilities',
        '   - Notification procedures and timeframes',
        '   - Breach investigation process',
        '   - Customer communication plan',
        '6. Identify high-risk data processors:',
        '   - Vendors with restricted data access',
        '   - Vendors in high-risk jurisdictions',
        '   - Vendors with inadequate protections',
        '7. Document compliance gaps and remediation needs',
        '8. Generate data protection assessment report'
      ],
      outputFormat: 'JSON object with data protection assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dpaRequired', 'dpaCompleted', 'dpaMissing', 'highRiskVendors', 'complianceGaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dpaRequired: { type: 'number' },
        dpaCompleted: { type: 'number' },
        dpaMissing: { type: 'number' },
        dpaComplianceRate: { type: 'number', description: 'Percentage with completed DPAs' },
        highRiskVendors: { type: 'number', description: 'Vendors processing high-risk data with gaps' },
        subProcessors: { type: 'number', description: 'Total sub-processors identified' },
        vendorDataProtection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              dataTypes: { type: 'array', items: { type: 'string' } },
              dataProtectionScore: { type: 'number' },
              dpaStatus: { type: 'string', enum: ['completed', 'missing', 'expired', 'not-required'] },
              privacyCompliance: {
                type: 'object',
                properties: {
                  gdpr: { type: 'boolean' },
                  ccpa: { type: 'boolean' },
                  hipaa: { type: 'boolean' }
                }
              },
              subProcessors: { type: 'array', items: { type: 'string' } },
              dataResidency: { type: 'string' },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        complianceGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string' },
              framework: { type: 'string' }
            }
          }
        },
        highRiskVendorsList: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'data-protection']
}));

// Phase 6: Assess Financial Risk
export const assessFinancialRiskTask = defineTask('assess-financial-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Assess Financial and Operational Risk - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Risk Assessment Specialist',
      task: 'Assess vendor financial stability and operational risks',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        includeCyberInsurance: args.includeCyberInsurance,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess vendor financial stability:',
        '   - Company size and employee count',
        '   - Funding and revenue information',
        '   - Profitability and burn rate',
        '   - Credit ratings (if available)',
        '   - Financial news and press releases',
        '   - Acquisition rumors or changes',
        '2. Evaluate operational risks:',
        '   - Company age and maturity',
        '   - Key person dependencies',
        '   - Geographic concentration',
        '   - Customer concentration',
        '   - Technology dependencies',
        '   - Single points of failure',
        '3. Review cyber insurance coverage (if applicable):',
        '   - Cyber insurance policy existence',
        '   - Coverage limits and deductibles',
        '   - Covered events and exclusions',
        '   - Claims history',
        '4. Assess business continuity and resilience:',
        '   - Business continuity plan existence',
        '   - Disaster recovery capabilities',
        '   - RTO and RPO commitments',
        '   - BC/DR testing frequency',
        '   - Redundancy and failover',
        '5. Evaluate reputational risk:',
        '   - Industry reputation and standing',
        '   - Past security incidents or breaches',
        '   - Customer reviews and feedback',
        '   - Legal or regulatory actions',
        '   - Media coverage',
        '6. Assess vendor lock-in and exit risk:',
        '   - Data portability and export',
        '   - Alternative vendor availability',
        '   - Transition complexity and cost',
        '   - Contract termination terms',
        '7. Flag financially unstable or high-risk vendors',
        '8. Generate financial and operational risk report'
      ],
      outputFormat: 'JSON object with financial risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'financiallyStable', 'financialRisks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        financiallyStable: { type: 'number' },
        financialRisks: { type: 'number' },
        avgFinancialScore: { type: 'number' },
        vendorFinancialAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              financialScore: { type: 'number' },
              stabilityRating: { type: 'string', enum: ['stable', 'moderate', 'at-risk', 'high-risk'] },
              companySize: { type: 'string' },
              funding: { type: 'string' },
              cyberInsurance: { type: 'boolean' },
              cyberInsuranceCoverage: { type: 'string' },
              bcdrTested: { type: 'boolean' },
              operationalRisks: { type: 'array', items: { type: 'string' } },
              reputationalRisks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highRiskVendors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'financial-risk']
}));

// Phase 7: Setup Continuous Monitoring
export const setupContinuousMonitoringTask = defineTask('setup-continuous-monitoring', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: Setup Continuous Security Monitoring - ${args.projectName}`,
  skill: {
    name: 'vendor-risk-monitor',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Monitoring Specialist',
      task: 'Setup continuous security monitoring for third-party vendors',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        integrations: args.integrations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure continuous monitoring platforms:',
        '   - BitSight: Security rating monitoring',
        '   - SecurityScorecard: Risk scoring and monitoring',
        '   - UpGuard: Vendor risk monitoring',
        '   - RiskRecon: Third-party security monitoring',
        '2. Setup monitoring for each vendor:',
        '   - Company domain and IP addresses',
        '   - Security posture tracking',
        '   - Breach and incident monitoring',
        '   - Certificate monitoring',
        '   - Dark web monitoring',
        '   - News and social media monitoring',
        '3. Configure monitoring parameters:',
        '   - Baseline security scores',
        '   - Alert thresholds and triggers',
        '   - Monitoring frequency',
        '   - Score change notifications',
        '   - Incident alerts',
        '4. Setup automated data collection:',
        '   - DNS security',
        '   - SSL/TLS configuration',
        '   - Email security (SPF, DKIM, DMARC)',
        '   - Exposed services and ports',
        '   - Vulnerability exposure',
        '   - Patching cadence',
        '   - Data breach history',
        '5. Configure alerting and notifications:',
        '   - Security score degradation',
        '   - New breaches or incidents',
        '   - Certificate expiration',
        '   - High-risk findings',
        '   - Compliance changes',
        '6. Setup integration with GRC platform',
        '7. Configure reporting dashboards',
        '8. Document monitoring procedures'
      ],
      outputFormat: 'JSON object with monitoring setup results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'monitored', 'tools', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        monitored: { type: 'number', description: 'Number of vendors under continuous monitoring' },
        tools: { type: 'array', items: { type: 'string' } },
        monitoringConfig: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              domain: { type: 'string' },
              monitoringTools: { type: 'array', items: { type: 'string' } },
              alertsConfigured: { type: 'boolean' },
              baselineScore: { type: 'number' }
            }
          }
        },
        alertThresholds: { type: 'object' },
        integrationStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'continuous-monitoring']
}));

// Phase 8: Calculate Risk Scores
export const calculateRiskScoresTask = defineTask('calculate-risk-scores', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Calculate Vendor Risk Scores - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vendor Risk Scoring Specialist',
      task: 'Calculate comprehensive risk scores for all vendors based on assessment data',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        controlAssessment: args.controlAssessment,
        dataProtection: args.dataProtection,
        certifications: args.certifications,
        financialRisk: args.financialRisk,
        autoScoring: args.autoScoring,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate vendor risk scores using weighted model (0-100 scale):',
        '   - Security Controls (40% weight):',
        '     * Control effectiveness score from assessment',
        '     * Critical control gaps',
        '     * Security maturity level',
        '   - Certifications and Compliance (20% weight):',
        '     * SOC 2 Type II (highest value)',
        '     * ISO 27001',
        '     * Industry-specific certifications',
        '     * Pentest recency and results',
        '   - Data Protection (20% weight):',
        '     * DPA status and completeness',
        '     * Privacy compliance (GDPR, CCPA)',
        '     * Data handling practices',
        '     * Sub-processor management',
        '   - Financial and Operational (10% weight):',
        '     * Financial stability',
        '     * Business continuity',
        '     * Operational resilience',
        '   - Continuous Monitoring (10% weight):',
        '     * External security ratings (BitSight, SecurityScorecard)',
        '     * Breach history',
        '     * Vulnerability exposure',
        '2. Apply business context multipliers:',
        '   - Vendor criticality (critical vendors weighted higher)',
        '   - Data sensitivity (restricted data access weighted higher)',
        '   - Service type and integration depth',
        '3. Calculate inherent risk vs residual risk:',
        '   - Inherent risk: Risk based on criticality and data access',
        '   - Residual risk: Risk after considering controls and mitigations',
        '4. Categorize vendors by risk level:',
        '   - Low Risk: Score 80-100 (strong controls, certified)',
        '   - Medium Risk: Score 60-79 (adequate controls, some gaps)',
        '   - High Risk: Score 40-59 (significant gaps, remediation needed)',
        '   - Critical Risk: Score 0-39 (severe gaps, immediate action)',
        '5. Identify top risk contributors for each vendor',
        '6. Generate risk score justification and evidence',
        '7. Create risk heat map visualization',
        '8. Generate risk scoring report with breakdown'
      ],
      outputFormat: 'JSON object with vendor risk scores'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalVendors', 'vendorScores', 'highRisk', 'mediumRisk', 'lowRisk', 'avgRiskScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalVendors: { type: 'number' },
        highRisk: { type: 'number' },
        mediumRisk: { type: 'number' },
        lowRisk: { type: 'number' },
        criticalRisk: { type: 'number' },
        avgRiskScore: { type: 'number' },
        criticalFindings: { type: 'number' },
        vendorScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              riskScore: { type: 'number', minimum: 0, maximum: 100 },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              inherentRisk: { type: 'number' },
              residualRisk: { type: 'number' },
              componentScores: {
                type: 'object',
                properties: {
                  securityControls: { type: 'number' },
                  certifications: { type: 'number' },
                  dataProtection: { type: 'number' },
                  financialOperational: { type: 'number' },
                  continuousMonitoring: { type: 'number' }
                }
              },
              topRisks: { type: 'array', items: { type: 'string' } },
              criticality: { type: 'string' },
              dataAccess: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highRiskVendorsList: { type: 'array', items: { type: 'object' } },
        riskDistribution: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
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
  labels: ['agent', 'third-party-risk', 'risk-scoring']
}));

// Phase 9: Identify Risk Findings
export const identifyRiskFindingsTask = defineTask('identify-risk-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Identify and Document Risk Findings - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Finding Documentation Specialist',
      task: 'Identify and document specific risk findings across all vendors',
      context: {
        projectName: args.projectName,
        vendorScores: args.vendorScores,
        controlAssessment: args.controlAssessment,
        dataProtection: args.dataProtection,
        certifications: args.certifications,
        riskCategories: args.riskCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify and document risk findings from all assessment data:',
        '   - Security control deficiencies',
        '   - Missing or expired certifications',
        '   - Data protection gaps',
        '   - Privacy compliance issues',
        '   - Financial or operational concerns',
        '   - Contractual gaps',
        '   - SLA deficiencies',
        '2. For each finding, document:',
        '   - Finding ID and title',
        '   - Affected vendor',
        '   - Risk category',
        '   - Severity (critical, high, medium, low)',
        '   - Detailed description',
        '   - Business impact',
        '   - Likelihood of occurrence',
        '   - Current status',
        '   - Recommended remediation',
        '   - Owner and due date',
        '3. Categorize findings by risk type:',
        '   - Security Risk: Technical security weaknesses',
        '   - Compliance Risk: Regulatory or framework gaps',
        '   - Privacy Risk: Data protection issues',
        '   - Financial Risk: Vendor stability concerns',
        '   - Operational Risk: Business continuity gaps',
        '   - Reputational Risk: Brand or trust issues',
        '4. Prioritize findings using risk matrix:',
        '   - Impact: Critical, High, Medium, Low',
        '   - Likelihood: Likely, Possible, Unlikely, Rare',
        '   - Risk Score: Impact × Likelihood',
        '5. Group findings by vendor for remediation planning',
        '6. Identify systemic issues across multiple vendors',
        '7. Flag findings requiring immediate attention',
        '8. Generate risk findings register'
      ],
      outputFormat: 'JSON object with risk findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalFindings', 'critical', 'high', 'medium', 'low', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalFindings: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              impact: { type: 'string' },
              likelihood: { type: 'string' },
              riskScore: { type: 'number' },
              status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'accepted'] },
              remediation: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        findingsByCategory: {
          type: 'object',
          properties: {
            security: { type: 'number' },
            compliance: { type: 'number' },
            privacy: { type: 'number' },
            financial: { type: 'number' },
            operational: { type: 'number' },
            reputational: { type: 'number' }
          }
        },
        criticalFindings: { type: 'array', items: { type: 'object' } },
        systemic: Issues: { type: 'array', items: { type: 'object' }, description: 'Issues affecting multiple vendors' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'findings']
}));

// Phase 10: Create Remediation Plans
export const createRemediationPlansTask = defineTask('create-remediation-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Remediation Plans - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Remediation Planning Specialist',
      task: 'Create remediation plans and track vendor remediation efforts',
      context: {
        projectName: args.projectName,
        findings: args.findings,
        vendors: args.vendors,
        integrations: args.integrations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create remediation plans for each vendor with findings:',
        '   - Group findings by vendor',
        '   - Prioritize by risk score and business impact',
        '   - Define remediation approach for each finding',
        '   - Set realistic due dates based on severity',
        '2. Remediation strategies by finding type:',
        '   - Missing Certification: Request evidence or set timeline for certification',
        '   - Control Gap: Require control implementation with verification',
        '   - DPA Missing: Execute data processing agreement',
        '   - Security Issue: Require remediation plan from vendor',
        '   - Financial Risk: Increase monitoring, consider alternatives',
        '   - Accept Risk: Document risk acceptance with justification',
        '3. Set remediation timelines by severity:',
        '   - Critical: 30 days',
        '   - High: 60 days',
        '   - Medium: 90 days',
        '   - Low: 120 days',
        '4. Create remediation tickets in ticketing system:',
        '   - Jira, ServiceNow, or Linear',
        '   - Include finding details and context',
        '   - Assign to vendor relationship owner',
        '   - Set due date and priority',
        '   - Add vendor contact information',
        '5. Generate vendor-specific remediation letters:',
        '   - Summary of assessment',
        '   - List of findings',
        '   - Required actions and timelines',
        '   - Verification requirements',
        '   - Contact for questions',
        '6. Setup remediation tracking:',
        '   - Status updates (open, in-progress, resolved)',
        '   - Progress notes and communications',
        '   - Evidence collection',
        '   - Due date monitoring',
        '7. Identify findings where risk acceptance is appropriate',
        '8. Generate remediation tracking dashboard'
      ],
      outputFormat: 'JSON object with remediation plans'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plansCreated', 'ticketsCreated', 'remediationItems', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plansCreated: { type: 'number' },
        ticketsCreated: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' },
        acceptedRisks: { type: 'number' },
        remediationItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              remediationId: { type: 'string' },
              ticketId: { type: 'string' },
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              findingId: { type: 'string' },
              finding: { type: 'string' },
              severity: { type: 'string' },
              remediationApproach: { type: 'string' },
              dueDate: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'accepted'] }
            }
          }
        },
        criticalRemediationsList: { type: 'array', items: { type: 'object' } },
        vendorLetters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              letterPath: { type: 'string' },
              findingsCount: { type: 'number' }
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
  labels: ['agent', 'third-party-risk', 'remediation']
}));

// Phase 11: Review Contracts and SLAs
export const reviewContractsSlaTask = defineTask('review-contracts-sla', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Review Contracts and SLA Agreements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract and SLA Review Specialist',
      task: 'Review vendor contracts and SLA agreements for security and compliance requirements',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        riskFindings: args.riskFindings,
        requireSlaAgreements: args.requireSlaAgreements,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review vendor contracts for security requirements:',
        '   - Security and privacy obligations',
        '   - Data protection and confidentiality clauses',
        '   - Audit rights and access',
        '   - Breach notification requirements',
        '   - Compliance with laws and regulations',
        '   - Subcontractor management',
        '   - Liability and indemnification',
        '   - Insurance requirements',
        '   - Termination and data return',
        '2. Review Service Level Agreements (SLAs):',
        '   - Uptime and availability commitments',
        '   - Performance metrics and targets',
        '   - Response and resolution times',
        '   - Escalation procedures',
        '   - Service credits and penalties',
        '   - Measurement and reporting',
        '3. Assess security-related contract terms:',
        '   - Right to audit security controls',
        '   - Security certification requirements',
        '   - Penetration testing permissions',
        '   - Security incident notification (24-48 hours)',
        '   - Vulnerability disclosure and patching',
        '   - Data encryption requirements',
        '   - Access control and authentication',
        '   - Security assessment cooperation',
        '4. Review data protection agreements (DPAs):',
        '   - GDPR Standard Contractual Clauses',
        '   - Data processing purposes and limitations',
        '   - Data subject rights support',
        '   - Sub-processor management',
        '   - International data transfers',
        '   - Data retention and deletion',
        '5. Identify contractual gaps and risks:',
        '   - Missing security requirements',
        '   - Weak liability provisions',
        '   - Inadequate breach notification',
        '   - Missing audit rights',
        '   - Insufficient SLA commitments',
        '6. Recommend contract amendments and negotiation points',
        '7. Flag contracts requiring immediate renegotiation',
        '8. Generate contract review summary report'
      ],
      outputFormat: 'JSON object with contract review results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reviewed', 'gaps', 'slaCompliant', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reviewed: { type: 'number' },
        gaps: { type: 'number' },
        slaCompliant: { type: 'number' },
        dpaCompliant: { type: 'number' },
        auditRights: { type: 'number', description: 'Vendors with audit rights in contract' },
        breachNotification: { type: 'number', description: 'Vendors with breach notification clauses' },
        contractReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              contractStatus: { type: 'string', enum: ['compliant', 'gaps-identified', 'missing'] },
              slaStatus: { type: 'string', enum: ['adequate', 'inadequate', 'missing'] },
              securityClauses: {
                type: 'object',
                properties: {
                  auditRights: { type: 'boolean' },
                  breachNotification: { type: 'boolean' },
                  dataProtection: { type: 'boolean' },
                  subcontractors: { type: 'boolean' },
                  liability: { type: 'boolean' },
                  insurance: { type: 'boolean' }
                }
              },
              gaps: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              renegotiationRequired: { type: 'boolean' }
            }
          }
        },
        contractGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        renegotiationNeeded: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'contract-review']
}));

// Phase 12: Establish Incident Procedures
export const establishIncidentProceduresTask = defineTask('establish-incident-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Establish Incident Response Procedures - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Response Planning Specialist',
      task: 'Establish vendor incident response and notification procedures',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        criticality: args.criticality,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define incident notification requirements for vendors:',
        '   - Critical vendors: Notify within 4 hours',
        '   - High criticality: Notify within 24 hours',
        '   - Medium/Low: Notify within 72 hours',
        '2. Establish incident notification procedures:',
        '   - Primary and escalation contacts',
        '   - Notification methods (email, phone, portal)',
        '   - Required incident information:',
        '     * Incident type and severity',
        '     * Systems and data affected',
        '     * Number of records impacted',
        '     * Potential customer impact',
        '     * Timeline of events',
        '     * Current status and remediation',
        '3. Define incident response expectations:',
        '   - Initial response timeframes',
        '   - Status update frequency',
        '   - Remediation timeline requirements',
        '   - Root cause analysis (RCA) requirements',
        '   - Post-incident review and lessons learned',
        '4. Establish incident escalation paths:',
        '   - L1: Vendor security team',
        '   - L2: Vendor executive leadership',
        '   - L3: External breach counsel',
        '5. Create vendor-specific incident runbooks:',
        '   - Vendor contact information',
        '   - Services and dependencies',
        '   - Impact assessment procedures',
        '   - Communication templates',
        '   - Escalation criteria',
        '6. Define business continuity procedures:',
        '   - Vendor outage response',
        '   - Failover procedures',
        '   - Alternative vendor activation',
        '   - Customer communication',
        '7. Establish periodic incident response testing:',
        '   - Annual tabletop exercises with critical vendors',
        '   - Quarterly review of contact information',
        '   - Validation of notification procedures',
        '8. Generate incident response playbook'
      ],
      outputFormat: 'JSON object with incident procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'proceduresCreated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        proceduresCreated: { type: 'number' },
        criticalVendorProcedures: { type: 'number' },
        vendorIncidentProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'string' },
              vendorName: { type: 'string' },
              criticality: { type: 'string' },
              notificationTimeframe: { type: 'string' },
              primaryContact: { type: 'string' },
              escalationContacts: { type: 'array', items: { type: 'string' } },
              notificationMethods: { type: 'array', items: { type: 'string' } },
              runbookPath: { type: 'string' }
            }
          }
        },
        notificationRequirements: {
          type: 'object',
          properties: {
            critical: { type: 'string' },
            high: { type: 'string' },
            medium: { type: 'string' },
            low: { type: 'string' }
          }
        },
        incidentPlaybookPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'incident-procedures']
}));

// Phase 13: Map Compliance Frameworks
export const mapComplianceFrameworksTask = defineTask('map-compliance-frameworks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Map to Compliance Frameworks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Mapping Specialist',
      task: 'Map vendor assessments to compliance framework requirements',
      context: {
        projectName: args.projectName,
        vendors: args.vendors,
        vendorScores: args.vendorScores,
        findings: args.findings,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map vendor risk assessment to compliance frameworks:',
        '   - SOC 2: CC6.6, CC6.7 (Third-party management)',
        '     * Vendor risk assessment process',
        '     * Monitoring of third-party controls',
        '     * Periodic reassessment',
        '   - ISO 27001: A.15 (Supplier relationships)',
        '     * Information security in supplier relationships',
        '     * Addressing security in supplier agreements',
        '     * ICT supply chain management',
        '   - NIST CSF: ID.SC (Supply Chain Risk Management)',
        '     * Supply chain risk management processes',
        '     * Supplier diversity and resilience',
        '     * Third-party asset prioritization',
        '   - GDPR: Article 28 (Processor obligations)',
        '     * Data processing agreements',
        '     * Processor selection criteria',
        '     * Processor oversight and auditing',
        '   - HIPAA: Business Associate agreements',
        '     * BA agreement execution',
        '     * Safeguard requirements',
        '     * Breach notification obligations',
        '   - PCI DSS: Requirement 12.8 (Service provider management)',
        '     * Maintain list of service providers',
        '     * Written agreement acknowledging responsibility',
        '     * Due diligence before engagement',
        '     * Monitoring of PCI DSS compliance status',
        '2. Assess compliance status for each framework:',
        '   - Compliant: All requirements met',
        '   - Partially Compliant: Some gaps identified',
        '   - Non-Compliant: Significant gaps or missing controls',
        '3. Identify compliance gaps by framework',
        '4. Map findings to specific framework requirements',
        '5. Calculate compliance score by framework (0-100)',
        '6. Generate evidence artifacts for auditors:',
        '   - Vendor inventory and classification',
        '   - Risk assessment methodology',
        '   - Assessment results and scores',
        '   - Remediation tracking',
        '   - Periodic reassessment schedule',
        '7. Create compliance dashboard by framework',
        '8. Generate framework-specific compliance reports'
      ],
      outputFormat: 'JSON object with compliance mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'frameworks', 'complianceScore', 'complianceGaps', 'frameworkStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        frameworks: { type: 'array', items: { type: 'string' } },
        complianceScore: { type: 'number', description: 'Overall compliance score across all frameworks' },
        complianceGaps: { type: 'number' },
        compliantVendors: { type: 'number' },
        nonCompliantVendors: { type: 'number' },
        frameworkStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant'] },
              score: { type: 'number' },
              requirements: { type: 'number' },
              requirementsMet: { type: 'number' },
              gaps: { type: 'array', items: { type: 'string' } },
              reportPath: { type: 'string' }
            }
          }
        },
        requirementMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirement: { type: 'string' },
              status: { type: 'string', enum: ['met', 'partial', 'not-met'] },
              evidence: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        evidenceArtifacts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'compliance-mapping']
}));

// Phase 14: Generate Executive Reports
export const generateExecutiveReportsTask = defineTask('generate-executive-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Generate Executive Reports and Dashboards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Executive Reporting Specialist',
      task: 'Generate executive reports and dashboards for third-party risk assessment',
      context: {
        projectName: args.projectName,
        inventoryResult: args.inventoryResult,
        scoringResult: args.scoringResult,
        findingsResult: args.findingsResult,
        remediationItems: args.remediationItems,
        contractReviewResult: args.contractReviewResult,
        complianceFrameworks: args.complianceFrameworks,
        assessmentType: args.assessmentType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary:',
        '   - Assessment scope and methodology',
        '   - Overall third-party risk posture',
        '   - Key metrics and KPIs',
        '   - High-risk vendors and critical findings',
        '   - Remediation status and timelines',
        '   - Compliance status',
        '   - Top recommendations',
        '2. Document vendor portfolio overview:',
        '   - Total vendors and classification',
        '   - Vendor types and services',
        '   - Criticality distribution',
        '   - Data access summary',
        '3. Document risk assessment results:',
        '   - Risk score distribution',
        '   - High-risk vendor details',
        '   - Top risk categories',
        '   - Trending and changes from previous assessment',
        '4. Document key findings:',
        '   - Critical and high-severity findings',
        '   - Systemic issues affecting multiple vendors',
        '   - Missing certifications',
        '   - Data protection gaps',
        '   - Contractual weaknesses',
        '5. Document remediation status:',
        '   - Remediation plans by vendor',
        '   - Progress and completion rates',
        '   - Overdue items and escalations',
        '6. Include visualizations:',
        '   - Vendor risk heat map',
        '   - Risk distribution pie chart',
        '   - Findings by category bar chart',
        '   - Vendor portfolio treemap',
        '   - Remediation progress dashboard',
        '   - Compliance status by framework',
        '7. Create board-level presentation (PowerPoint/PDF):',
        '   - Executive summary slides',
        '   - Key metrics and trends',
        '   - Top risks and actions',
        '   - Compliance status',
        '   - Recommendations',
        '8. Generate interactive dashboard data (JSON)',
        '9. Format as professional Markdown report with tables and charts'
      ],
      outputFormat: 'JSON object with report paths and dashboard data'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'executiveReportPath', 'dashboardPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        executiveReportPath: { type: 'string' },
        dashboardPath: { type: 'string' },
        presentationPath: { type: 'string' },
        executiveSummary: { type: 'string', description: 'Brief executive summary text' },
        keyMetrics: {
          type: 'object',
          properties: {
            totalVendors: { type: 'number' },
            highRiskVendors: { type: 'number' },
            criticalFindings: { type: 'number' },
            remediationInProgress: { type: 'number' },
            complianceScore: { type: 'number' }
          }
        },
        topRisks: { type: 'array', items: { type: 'string' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        complianceScore: { type: 'number' },
        compliantVendors: { type: 'number' },
        nonCompliantVendors: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'executive-reporting']
}));

// Phase 15: Calculate Overall Risk Score
export const calculateOverallRiskScoreTask = defineTask('calculate-overall-risk-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Calculate Overall Third-Party Risk Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Third-Party Risk Assessment Specialist',
      task: 'Calculate overall third-party risk score and provide final assessment',
      context: {
        projectName: args.projectName,
        vendorScores: args.vendorScores,
        findings: args.findings,
        inventoryResult: args.inventoryResult,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate overall third-party risk score (0-100):',
        '   - Vendor Portfolio Risk (40% weight):',
        '     * Weighted average of vendor risk scores',
        '     * Critical vendor risk (higher weight)',
        '     * High-risk vendor concentration',
        '   - Finding Severity (30% weight):',
        '     * Critical findings count and severity',
        '     * Systemic issues across multiple vendors',
        '     * Unresolved high-risk findings',
        '   - Program Maturity (15% weight):',
        '     * Assessment coverage and completeness',
        '     * Questionnaire completion rate',
        '     * Certification verification rate',
        '     * Remediation tracking process',
        '   - Compliance Status (15% weight):',
        '     * Framework compliance scores',
        '     * DPA completion rate',
        '     * Contract adequacy',
        '2. Classify overall risk level:',
        '   - Low Risk (80-100): Strong vendor risk management, minimal high-risk vendors',
        '   - Medium Risk (60-79): Adequate program, some high-risk vendors with plans',
        '   - High Risk (40-59): Significant risks, multiple high-risk vendors, gaps',
        '   - Critical Risk (0-39): Severe risk exposure, critical vendors with major gaps',
        '3. Assess third-party risk management maturity:',
        '   - Level 1 (Ad-hoc): No formal program, reactive',
        '   - Level 2 (Managed): Basic inventory and assessments',
        '   - Level 3 (Defined): Standardized process, risk-based approach',
        '   - Level 4 (Measured): Metrics-driven, continuous monitoring',
        '   - Level 5 (Optimized): Proactive, integrated, continuously improving',
        '4. Identify program strengths and weaknesses',
        '5. Provide risk trend analysis (if historical data available)',
        '6. Generate prioritized recommendations:',
        '   - Address critical vendor risks immediately',
        '   - Complete missing certifications and DPAs',
        '   - Implement continuous monitoring',
        '   - Improve remediation tracking',
        '   - Enhance contract requirements',
        '   - Standardize assessment process',
        '7. Calculate risk reduction potential with recommendations',
        '8. Generate final assessment summary document'
      ],
      outputFormat: 'JSON object with overall risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskScore', 'riskLevel', 'verdict', 'topRecommendations', 'summaryPath', 'artifacts'],
      properties: {
        overallRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        componentScores: {
          type: 'object',
          properties: {
            vendorPortfolioRisk: { type: 'number' },
            findingSeverity: { type: 'number' },
            programMaturity: { type: 'number' },
            complianceStatus: { type: 'number' }
          }
        },
        programMaturityLevel: { type: 'string', enum: ['ad-hoc', 'managed', 'defined', 'measured', 'optimized'] },
        verdict: { type: 'string', description: 'Overall assessment verdict and risk posture' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              riskReduction: { type: 'number', description: 'Estimated risk score improvement' }
            }
          }
        },
        riskTrend: { type: 'string', enum: ['improving', 'stable', 'declining', 'unknown'], description: 'Trend since last assessment' },
        benchmarkComparison: { type: 'string', description: 'Comparison to industry benchmarks' },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'third-party-risk', 'overall-scoring']
}));
