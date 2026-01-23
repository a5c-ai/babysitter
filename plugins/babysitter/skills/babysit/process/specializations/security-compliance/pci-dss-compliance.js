/**
 * @process specializations/security-compliance/pci-dss-compliance
 * @description PCI DSS Compliance Assessment - Comprehensive Payment Card Industry Data Security Standard compliance
 * validation covering all 12 requirements, cardholder data environment (CDE) identification, network segmentation,
 * ASV scanning, penetration testing, and QSA audit preparation. Implements controls for protecting cardholder data
 * including encryption, access control, monitoring, and vulnerability management for PCI DSS v4.0.
 * @inputs { projectName: string, merchantLevel?: string, cdeScope?: array, assessmentType?: string, version?: string }
 * @outputs { success: boolean, complianceScore: number, requirementResults: array, gaps: array, remediationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/pci-dss-compliance', {
 *   projectName: 'E-Commerce Platform',
 *   merchantLevel: 'level-1', // 'level-1', 'level-2', 'level-3', 'level-4'
 *   cdeScope: ['payment-api', 'database', 'web-app'],
 *   assessmentType: 'saq-d', // 'saq-a', 'saq-a-ep', 'saq-b', 'saq-c', 'saq-d', 'qsa-audit'
 *   version: 'v4.0', // 'v3.2.1', 'v4.0'
 *   asvScan: true,
 *   penetrationTest: true,
 *   networkSegmentation: true,
 *   quarterlyScans: true,
 *   automatedRemediation: false,
 *   generateAoc: true, // Attestation of Compliance
 *   generateRoc: false // Report on Compliance (for Level 1)
 * });
 *
 * @references
 * - PCI DSS v4.0: https://www.pcisecuritystandards.org/document_library/
 * - PCI SSC Official Site: https://www.pcisecuritystandards.org/
 * - PCI DSS Requirements: https://www.pcisecuritystandards.org/standards/pci-dss/
 * - SAQ Documentation: https://www.pcisecuritystandards.org/document_library?category=saqs
 * - ASV Program Guide: https://www.pcisecuritystandards.org/document_library?category=asv
 * - Penetration Testing Guidance: https://www.pcisecuritystandards.org/document_library?document=penetration-testing-guidance
 * - Network Segmentation: https://www.pcisecuritystandards.org/document_library?document=guidance-pci-dss-scoping-and-network-segmentation
 * - Tokenization Guidelines: https://www.pcisecuritystandards.org/document_library?document=tokenization-guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    merchantLevel = 'level-2', // 'level-1', 'level-2', 'level-3', 'level-4'
    cdeScope = [], // Assets in Cardholder Data Environment
    assessmentType = 'saq-d', // 'saq-a', 'saq-a-ep', 'saq-b', 'saq-c', 'saq-d', 'qsa-audit'
    version = 'v4.0', // 'v3.2.1', 'v4.0'
    asvScan = true, // Approved Scanning Vendor quarterly scans
    penetrationTest = merchantLevel === 'level-1' || merchantLevel === 'level-2', // Required for Level 1 & 2
    networkSegmentation = true,
    quarterlyScans = true,
    automatedRemediation = false,
    generateAoc = true, // Attestation of Compliance
    generateRoc = merchantLevel === 'level-1', // Report on Compliance for Level 1
    outputDir = 'pci-dss-compliance-output',
    environment = 'production'
  } = inputs;

  if (!projectName) {
    return {
      success: false,
      error: 'Project name is required for PCI DSS compliance assessment',
      metadata: { processId: 'specializations/security-compliance/pci-dss-compliance', timestamp: ctx.now() }
    };
  }

  const startTime = ctx.now();
  const artifacts = [];
  let complianceScore = 0;
  const requirementResults = [];
  const gaps = [];
  const remediationItems = [];

  ctx.log('info', `Starting PCI DSS ${version} Compliance Assessment for ${projectName}`);
  ctx.log('info', `Merchant Level: ${merchantLevel}, Assessment Type: ${assessmentType}`);
  ctx.log('info', `CDE Scope: ${cdeScope.length} assets, Network Segmentation: ${networkSegmentation}`);

  // ============================================================================
  // PHASE 1: CDE SCOPE IDENTIFICATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying and validating Cardholder Data Environment (CDE) scope');

  const cdeScopeResult = await ctx.task(identifyCdeScopeTask, {
    projectName,
    cdeScope,
    networkSegmentation,
    environment,
    outputDir
  });

  artifacts.push(...cdeScopeResult.artifacts);

  ctx.log('info', `CDE scope identified - ${cdeScopeResult.cdeAssets.length} assets in scope, ${cdeScopeResult.connectedAssets.length} connected systems`);

  // Quality Gate: CDE scope review
  await ctx.breakpoint({
    question: `CDE scope identification complete for ${projectName}. ${cdeScopeResult.cdeAssets.length} in-scope assets, ${cdeScopeResult.connectedAssets.length} connected systems. Review scope before assessment?`,
    title: 'CDE Scope Review',
    context: {
      runId: ctx.runId,
      cdeScope: {
        totalCdeAssets: cdeScopeResult.cdeAssets.length,
        connectedAssets: cdeScopeResult.connectedAssets.length,
        outOfScope: cdeScopeResult.outOfScopeAssets.length,
        segmentationEffective: cdeScopeResult.segmentationEffective,
        scopeReductionOpportunities: cdeScopeResult.scopeReductionOpportunities
      },
      assetBreakdown: cdeScopeResult.assetBreakdown,
      files: cdeScopeResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: NETWORK SEGMENTATION VALIDATION
  // ============================================================================

  if (networkSegmentation) {
    ctx.log('info', 'Phase 2: Validating network segmentation controls');

    const segmentationResult = await ctx.task(validateNetworkSegmentationTask, {
      projectName,
      cdeAssets: cdeScopeResult.cdeAssets,
      connectedAssets: cdeScopeResult.connectedAssets,
      version,
      outputDir
    });

    artifacts.push(...segmentationResult.artifacts);

    ctx.log('info', `Network segmentation validation complete - ${segmentationResult.segmentationScore}/100 score`);

    // Quality Gate: Network segmentation review
    await ctx.breakpoint({
      question: `Network segmentation validation complete. Segmentation Score: ${segmentationResult.segmentationScore}/100. ${segmentationResult.issues.length} issues found. Review segmentation?`,
      title: 'Network Segmentation Review',
      context: {
        runId: ctx.runId,
        segmentation: {
          segmentationScore: segmentationResult.segmentationScore,
          effective: segmentationResult.effective,
          issuesFound: segmentationResult.issues.length,
          firewallRulesReviewed: segmentationResult.firewallRulesReviewed,
          isolationValidated: segmentationResult.isolationValidated
        },
        issues: segmentationResult.issues,
        files: segmentationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: REQUIREMENT 1 - INSTALL AND MAINTAIN NETWORK SECURITY CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing Requirement 1 - Network Security Controls');

  const req1Result = await ctx.task(assessRequirement1Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req1Result.artifacts);
  requirementResults.push({ requirement: 1, ...req1Result });
  gaps.push(...req1Result.gaps);

  ctx.log('info', `Requirement 1 complete - Compliance: ${req1Result.compliant ? 'YES' : 'NO'}, Score: ${req1Result.score}/100`);

  // ============================================================================
  // PHASE 4: REQUIREMENT 2 - APPLY SECURE CONFIGURATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing Requirement 2 - Secure Configurations');

  const req2Result = await ctx.task(assessRequirement2Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req2Result.artifacts);
  requirementResults.push({ requirement: 2, ...req2Result });
  gaps.push(...req2Result.gaps);

  ctx.log('info', `Requirement 2 complete - Compliance: ${req2Result.compliant ? 'YES' : 'NO'}, Score: ${req2Result.score}/100`);

  // ============================================================================
  // PHASE 5: REQUIREMENT 3 - PROTECT STORED CARDHOLDER DATA
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing Requirement 3 - Protect Stored Cardholder Data');

  const req3Result = await ctx.task(assessRequirement3Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req3Result.artifacts);
  requirementResults.push({ requirement: 3, ...req3Result });
  gaps.push(...req3Result.gaps);

  ctx.log('info', `Requirement 3 complete - Compliance: ${req3Result.compliant ? 'YES' : 'NO'}, Score: ${req3Result.score}/100`);

  // Quality Gate: Data protection review (critical requirement)
  await ctx.breakpoint({
    question: `Requirement 3 (Data Protection) assessment complete. Compliance: ${req3Result.compliant ? 'YES' : 'NO'}. ${req3Result.gaps.length} gaps found. This is a critical requirement. Review findings?`,
    title: 'Requirement 3 - Data Protection Review',
    context: {
      runId: ctx.runId,
      requirement3: {
        compliant: req3Result.compliant,
        score: req3Result.score,
        gapsCount: req3Result.gaps.length,
        encryptionValidated: req3Result.encryptionValidated,
        keyManagementValidated: req3Result.keyManagementValidated,
        dataRetentionCompliant: req3Result.dataRetentionCompliant
      },
      gaps: req3Result.gaps,
      files: req3Result.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: REQUIREMENT 4 - PROTECT CARDHOLDER DATA IN TRANSIT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing Requirement 4 - Protect Data in Transit');

  const req4Result = await ctx.task(assessRequirement4Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req4Result.artifacts);
  requirementResults.push({ requirement: 4, ...req4Result });
  gaps.push(...req4Result.gaps);

  ctx.log('info', `Requirement 4 complete - Compliance: ${req4Result.compliant ? 'YES' : 'NO'}, Score: ${req4Result.score}/100`);

  // ============================================================================
  // PHASE 7: REQUIREMENT 5 - PROTECT AGAINST MALWARE
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing Requirement 5 - Protect Against Malware');

  const req5Result = await ctx.task(assessRequirement5Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req5Result.artifacts);
  requirementResults.push({ requirement: 5, ...req5Result });
  gaps.push(...req5Result.gaps);

  ctx.log('info', `Requirement 5 complete - Compliance: ${req5Result.compliant ? 'YES' : 'NO'}, Score: ${req5Result.score}/100`);

  // ============================================================================
  // PHASE 8: REQUIREMENT 6 - DEVELOP AND MAINTAIN SECURE SYSTEMS
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing Requirement 6 - Develop Secure Systems and Software');

  const req6Result = await ctx.task(assessRequirement6Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    quarterlyScans,
    outputDir
  });

  artifacts.push(...req6Result.artifacts);
  requirementResults.push({ requirement: 6, ...req6Result });
  gaps.push(...req6Result.gaps);

  ctx.log('info', `Requirement 6 complete - Compliance: ${req6Result.compliant ? 'YES' : 'NO'}, Score: ${req6Result.score}/100`);

  // ============================================================================
  // PHASE 9: REQUIREMENT 7 - RESTRICT ACCESS TO CARDHOLDER DATA
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing Requirement 7 - Restrict Access by Business Need to Know');

  const req7Result = await ctx.task(assessRequirement7Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req7Result.artifacts);
  requirementResults.push({ requirement: 7, ...req7Result });
  gaps.push(...req7Result.gaps);

  ctx.log('info', `Requirement 7 complete - Compliance: ${req7Result.compliant ? 'YES' : 'NO'}, Score: ${req7Result.score}/100`);

  // ============================================================================
  // PHASE 10: REQUIREMENT 8 - IDENTIFY USERS AND AUTHENTICATE ACCESS
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing Requirement 8 - Identify and Authenticate Access');

  const req8Result = await ctx.task(assessRequirement8Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req8Result.artifacts);
  requirementResults.push({ requirement: 8, ...req8Result });
  gaps.push(...req8Result.gaps);

  ctx.log('info', `Requirement 8 complete - Compliance: ${req8Result.compliant ? 'YES' : 'NO'}, Score: ${req8Result.score}/100`);

  // ============================================================================
  // PHASE 11: REQUIREMENT 9 - RESTRICT PHYSICAL ACCESS
  // ============================================================================

  ctx.log('info', 'Phase 11: Assessing Requirement 9 - Restrict Physical Access');

  const req9Result = await ctx.task(assessRequirement9Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req9Result.artifacts);
  requirementResults.push({ requirement: 9, ...req9Result });
  gaps.push(...req9Result.gaps);

  ctx.log('info', `Requirement 9 complete - Compliance: ${req9Result.compliant ? 'YES' : 'NO'}, Score: ${req9Result.score}/100`);

  // ============================================================================
  // PHASE 12: REQUIREMENT 10 - LOG AND MONITOR ALL ACCESS
  // ============================================================================

  ctx.log('info', 'Phase 12: Assessing Requirement 10 - Log and Monitor Access');

  const req10Result = await ctx.task(assessRequirement10Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    outputDir
  });

  artifacts.push(...req10Result.artifacts);
  requirementResults.push({ requirement: 10, ...req10Result });
  gaps.push(...req10Result.gaps);

  ctx.log('info', `Requirement 10 complete - Compliance: ${req10Result.compliant ? 'YES' : 'NO'}, Score: ${req10Result.score}/100`);

  // ============================================================================
  // PHASE 13: REQUIREMENT 11 - TEST SECURITY CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 13: Assessing Requirement 11 - Test Security Systems and Processes');

  const req11Result = await ctx.task(assessRequirement11Task, {
    projectName,
    cdeAssets: cdeScopeResult.cdeAssets,
    version,
    asvScan,
    penetrationTest,
    outputDir
  });

  artifacts.push(...req11Result.artifacts);
  requirementResults.push({ requirement: 11, ...req11Result });
  gaps.push(...req11Result.gaps);

  ctx.log('info', `Requirement 11 complete - Compliance: ${req11Result.compliant ? 'YES' : 'NO'}, Score: ${req11Result.score}/100`);

  // Quality Gate: Security testing review (ASV/Penetration Test)
  await ctx.breakpoint({
    question: `Requirement 11 (Security Testing) assessment complete. ASV Scan: ${req11Result.asvScanCompliant ? 'PASS' : 'FAIL'}, Penetration Test: ${req11Result.penetrationTestCompliant ? 'PASS' : 'FAIL'}. Review findings?`,
    title: 'Requirement 11 - Security Testing Review',
    context: {
      runId: ctx.runId,
      requirement11: {
        compliant: req11Result.compliant,
        score: req11Result.score,
        asvScanCompliant: req11Result.asvScanCompliant,
        asvScanDate: req11Result.asvScanDate,
        penetrationTestCompliant: req11Result.penetrationTestCompliant,
        penetrationTestDate: req11Result.penetrationTestDate,
        vulnerabilitiesFound: req11Result.vulnerabilitiesFound
      },
      gaps: req11Result.gaps,
      files: req11Result.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 14: REQUIREMENT 12 - SUPPORT INFORMATION SECURITY WITH POLICIES
  // ============================================================================

  ctx.log('info', 'Phase 14: Assessing Requirement 12 - Maintain Information Security Policy');

  const req12Result = await ctx.task(assessRequirement12Task, {
    projectName,
    merchantLevel,
    version,
    outputDir
  });

  artifacts.push(...req12Result.artifacts);
  requirementResults.push({ requirement: 12, ...req12Result });
  gaps.push(...req12Result.gaps);

  ctx.log('info', `Requirement 12 complete - Compliance: ${req12Result.compliant ? 'YES' : 'NO'}, Score: ${req12Result.score}/100`);

  // ============================================================================
  // PHASE 15: ASV QUARTERLY VULNERABILITY SCANNING (IF REQUIRED)
  // ============================================================================

  let asvScanResult = null;
  if (asvScan) {
    ctx.log('info', 'Phase 15: Executing ASV Quarterly Vulnerability Scan');

    asvScanResult = await ctx.task(executeAsvScanTask, {
      projectName,
      cdeAssets: cdeScopeResult.cdeAssets,
      merchantLevel,
      quarterlyScans,
      outputDir
    });

    artifacts.push(...asvScanResult.artifacts);

    ctx.log('info', `ASV scan complete - ${asvScanResult.passed ? 'PASSED' : 'FAILED'}, ${asvScanResult.vulnerabilitiesFound} vulnerabilities found`);

    // Quality Gate: ASV scan review
    await ctx.breakpoint({
      question: `ASV quarterly vulnerability scan complete. Result: ${asvScanResult.passed ? 'PASSED' : 'FAILED'}. ${asvScanResult.vulnerabilitiesFound} vulnerabilities found. Review ASV results?`,
      title: 'ASV Scan Review',
      context: {
        runId: ctx.runId,
        asvScan: {
          passed: asvScanResult.passed,
          vulnerabilitiesFound: asvScanResult.vulnerabilitiesFound,
          criticalVulnerabilities: asvScanResult.criticalVulnerabilities,
          scanDate: asvScanResult.scanDate,
          nextScanDue: asvScanResult.nextScanDue,
          scannerName: asvScanResult.scannerName
        },
        topVulnerabilities: asvScanResult.topVulnerabilities,
        files: asvScanResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: PENETRATION TESTING (IF REQUIRED)
  // ============================================================================

  let penetrationTestResult = null;
  if (penetrationTest) {
    ctx.log('info', 'Phase 16: Executing Annual Penetration Testing');

    penetrationTestResult = await ctx.task(executePenetrationTestTask, {
      projectName,
      cdeAssets: cdeScopeResult.cdeAssets,
      connectedAssets: cdeScopeResult.connectedAssets,
      merchantLevel,
      networkSegmentation,
      outputDir
    });

    artifacts.push(...penetrationTestResult.artifacts);

    ctx.log('info', `Penetration test complete - ${penetrationTestResult.issuesFound} issues found, ${penetrationTestResult.criticalIssues} critical`);

    // Quality Gate: Penetration test review
    await ctx.breakpoint({
      question: `Penetration testing complete. ${penetrationTestResult.issuesFound} issues found (${penetrationTestResult.criticalIssues} critical). Review penetration test results?`,
      title: 'Penetration Test Review',
      context: {
        runId: ctx.runId,
        penetrationTest: {
          issuesFound: penetrationTestResult.issuesFound,
          criticalIssues: penetrationTestResult.criticalIssues,
          highIssues: penetrationTestResult.highIssues,
          mediumIssues: penetrationTestResult.mediumIssues,
          testDate: penetrationTestResult.testDate,
          nextTestDue: penetrationTestResult.nextTestDue,
          segmentationValidated: penetrationTestResult.segmentationValidated
        },
        criticalFindings: penetrationTestResult.criticalFindings,
        files: penetrationTestResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 17: CALCULATE OVERALL COMPLIANCE SCORE
  // ============================================================================

  ctx.log('info', 'Phase 17: Calculating overall PCI DSS compliance score');

  const complianceScoringResult = await ctx.task(calculateComplianceScoreTask, {
    projectName,
    requirementResults,
    asvScanResult,
    penetrationTestResult,
    merchantLevel,
    assessmentType,
    version,
    outputDir
  });

  complianceScore = complianceScoringResult.complianceScore;
  artifacts.push(...complianceScoringResult.artifacts);

  ctx.log('info', `Overall PCI DSS Compliance Score: ${complianceScore}/100`);

  // ============================================================================
  // PHASE 18: GAP ANALYSIS AND REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 18: Performing gap analysis and generating remediation plan');

  const gapAnalysisResult = await ctx.task(performGapAnalysisTask, {
    projectName,
    gaps,
    requirementResults,
    complianceScore,
    merchantLevel,
    automatedRemediation,
    outputDir
  });

  artifacts.push(...gapAnalysisResult.artifacts);
  remediationItems.push(...gapAnalysisResult.remediationItems);

  ctx.log('info', `Gap analysis complete - ${gaps.length} total gaps, ${gapAnalysisResult.criticalGaps} critical, ${gapAnalysisResult.autoRemediableGaps} auto-remediable`);

  // Quality Gate: Gap analysis review
  await ctx.breakpoint({
    question: `Gap analysis complete. ${gaps.length} gaps identified (${gapAnalysisResult.criticalGaps} critical). Review remediation plan?`,
    title: 'Gap Analysis and Remediation Plan Review',
    context: {
      runId: ctx.runId,
      gapAnalysis: {
        totalGaps: gaps.length,
        criticalGaps: gapAnalysisResult.criticalGaps,
        highGaps: gapAnalysisResult.highGaps,
        mediumGaps: gapAnalysisResult.mediumGaps,
        lowGaps: gapAnalysisResult.lowGaps,
        autoRemediableGaps: gapAnalysisResult.autoRemediableGaps,
        estimatedEffort: gapAnalysisResult.estimatedEffort
      },
      remediationPriorities: gapAnalysisResult.remediationPriorities,
      files: gapAnalysisResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 19: GENERATE ATTESTATION OF COMPLIANCE (AOC)
  // ============================================================================

  let aocResult = null;
  if (generateAoc) {
    ctx.log('info', 'Phase 19: Generating Attestation of Compliance (AOC)');

    aocResult = await ctx.task(generateAocTask, {
      projectName,
      merchantLevel,
      assessmentType,
      version,
      requirementResults,
      complianceScore,
      asvScanResult,
      penetrationTestResult,
      gaps,
      outputDir
    });

    artifacts.push(...aocResult.artifacts);

    ctx.log('info', `AOC generated - ${aocResult.aocPath}`);
  }

  // ============================================================================
  // PHASE 20: GENERATE REPORT ON COMPLIANCE (ROC) FOR LEVEL 1
  // ============================================================================

  let rocResult = null;
  if (generateRoc && merchantLevel === 'level-1') {
    ctx.log('info', 'Phase 20: Generating Report on Compliance (ROC) for Level 1 Merchant');

    rocResult = await ctx.task(generateRocTask, {
      projectName,
      merchantLevel,
      version,
      requirementResults,
      complianceScore,
      cdeScopeResult,
      asvScanResult,
      penetrationTestResult,
      gaps,
      outputDir
    });

    artifacts.push(...rocResult.artifacts);

    ctx.log('info', `ROC generated - ${rocResult.rocPath}`);
  }

  // ============================================================================
  // PHASE 21: GENERATE EXECUTIVE SUMMARY AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 21: Generating executive summary and compliance documentation');

  const documentationResult = await ctx.task(generatePciDocumentationTask, {
    projectName,
    merchantLevel,
    assessmentType,
    version,
    complianceScore,
    requirementResults,
    cdeScopeResult,
    asvScanResult,
    penetrationTestResult,
    gaps,
    gapAnalysisResult,
    aocResult,
    rocResult,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation generated - Report: ${documentationResult.reportPath}`);

  // Final Breakpoint: PCI DSS compliance assessment complete
  await ctx.breakpoint({
    question: `PCI DSS ${version} Compliance Assessment Complete for ${projectName}. Overall Score: ${complianceScore}/100. ${gaps.length} gaps identified. Review final results?`,
    title: 'Final PCI DSS Compliance Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        merchantLevel,
        assessmentType,
        version,
        complianceScore,
        overallCompliant: complianceScore >= 100 && gaps.length === 0,
        totalRequirements: 12,
        compliantRequirements: requirementResults.filter(r => r.compliant).length,
        totalGaps: gaps.length,
        criticalGaps: gapAnalysisResult.criticalGaps
      },
      requirementSummary: requirementResults.map(r => ({
        requirement: r.requirement,
        name: r.name,
        compliant: r.compliant,
        score: r.score,
        gaps: r.gaps.length
      })),
      securityTesting: {
        asvScanPassed: asvScanResult ? asvScanResult.passed : 'N/A',
        penetrationTestCompliant: penetrationTestResult ? penetrationTestResult.issuesFound === 0 : 'N/A'
      },
      deliverables: {
        aocGenerated: generateAoc && aocResult !== null,
        rocGenerated: generateRoc && rocResult !== null,
        remediationPlanAvailable: remediationItems.length > 0
      },
      files: [
        { path: documentationResult.reportPath, format: 'markdown', label: 'PCI DSS Compliance Report' },
        aocResult ? { path: aocResult.aocPath, format: 'pdf', label: 'Attestation of Compliance' } : null,
        rocResult ? { path: rocResult.rocPath, format: 'pdf', label: 'Report on Compliance' } : null,
        { path: gapAnalysisResult.remediationPlanPath, format: 'json', label: 'Remediation Plan' }
      ].filter(Boolean)
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    merchantLevel,
    assessmentType,
    version,
    complianceScore,
    overallCompliant: complianceScore >= 100 && gaps.length === 0,
    requirementResults: requirementResults.map(r => ({
      requirement: r.requirement,
      name: r.name,
      compliant: r.compliant,
      score: r.score,
      gapsCount: r.gaps.length
    })),
    gaps: {
      total: gaps.length,
      critical: gapAnalysisResult.criticalGaps,
      high: gapAnalysisResult.highGaps,
      medium: gapAnalysisResult.mediumGaps,
      low: gapAnalysisResult.lowGaps,
      details: gaps
    },
    cdeScope: {
      totalCdeAssets: cdeScopeResult.cdeAssets.length,
      connectedAssets: cdeScopeResult.connectedAssets.length,
      segmentationEffective: cdeScopeResult.segmentationEffective
    },
    securityTesting: {
      asvScan: asvScanResult ? {
        passed: asvScanResult.passed,
        vulnerabilitiesFound: asvScanResult.vulnerabilitiesFound,
        scanDate: asvScanResult.scanDate
      } : null,
      penetrationTest: penetrationTestResult ? {
        issuesFound: penetrationTestResult.issuesFound,
        criticalIssues: penetrationTestResult.criticalIssues,
        testDate: penetrationTestResult.testDate
      } : null
    },
    remediationPlan: {
      totalItems: remediationItems.length,
      criticalItems: remediationItems.filter(i => i.priority === 'critical').length,
      autoRemediableItems: gapAnalysisResult.autoRemediableGaps,
      estimatedEffort: gapAnalysisResult.estimatedEffort,
      items: remediationItems
    },
    artifacts,
    documentation: {
      reportPath: documentationResult.reportPath,
      aocPath: aocResult ? aocResult.aocPath : null,
      rocPath: rocResult ? rocResult.rocPath : null,
      remediationPlanPath: gapAnalysisResult.remediationPlanPath
    },
    duration,
    metadata: {
      processId: 'specializations/security-compliance/pci-dss-compliance',
      processSlug: 'pci-dss-compliance',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      environment,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Identify CDE Scope
export const identifyCdeScopeTask = defineTask('identify-cde-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Identify Cardholder Data Environment (CDE) Scope - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PCI DSS Scoping Specialist',
      task: 'Identify and validate the Cardholder Data Environment (CDE) scope',
      context: {
        projectName: args.projectName,
        cdeScope: args.cdeScope,
        networkSegmentation: args.networkSegmentation,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all systems, applications, and network segments that:',
        '   - Store, process, or transmit cardholder data (CHD)',
        '   - Store sensitive authentication data (SAD) - if any (should be prohibited)',
        '   - Provide security services to the CDE (e.g., firewalls, authentication servers)',
        '   - Are connected to the CDE but do not meet above criteria',
        '2. Categorize assets into:',
        '   - CDE In-Scope: Systems handling CHD/SAD',
        '   - Connected-to-CDE: Systems connected but not handling CHD',
        '   - Out-of-Scope: Properly segmented systems with no CHD access',
        '3. Document data flows showing:',
        '   - How cardholder data enters the environment',
        '   - Where cardholder data is stored',
        '   - How cardholder data is processed',
        '   - How cardholder data is transmitted',
        '   - When/how cardholder data is deleted',
        '4. Identify scope reduction opportunities:',
        '   - Tokenization implementation',
        '   - Point-to-point encryption (P2PE)',
        '   - Hosted payment page redirects',
        '   - Network segmentation improvements',
        '5. Validate network segmentation effectiveness (if implemented):',
        '   - Firewall rules restricting CDE access',
        '   - Network monitoring and logging',
        '   - Separate VLANs/subnets for CDE',
        '6. Create CDE network diagram',
        '7. Generate asset inventory with PCI DSS relevance',
        '8. Document any wireless networks in/connected to CDE'
      ],
      outputFormat: 'JSON object with CDE scope identification'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cdeAssets', 'connectedAssets', 'outOfScopeAssets', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cdeAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              function: { type: 'string' },
              handlesChd: { type: 'boolean' },
              handlesSad: { type: 'boolean' }
            }
          }
        },
        connectedAssets: { type: 'array', items: { type: 'object' } },
        outOfScopeAssets: { type: 'array', items: { type: 'object' } },
        dataFlows: { type: 'array', items: { type: 'object' } },
        segmentationEffective: { type: 'boolean' },
        scopeReductionOpportunities: {
          type: 'array',
          items: { type: 'string' }
        },
        assetBreakdown: {
          type: 'object',
          properties: {
            cdeAssets: { type: 'number' },
            connectedAssets: { type: 'number' },
            outOfScope: { type: 'number' }
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
  labels: ['agent', 'pci-dss', 'cde-scoping']
}));

// Phase 2: Validate Network Segmentation
export const validateNetworkSegmentationTask = defineTask('validate-network-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Validate Network Segmentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Security Architect',
      task: 'Validate network segmentation controls separating CDE from other networks',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        connectedAssets: args.connectedAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review network segmentation architecture:',
        '   - Firewall placement and configurations',
        '   - VLAN/subnet separation',
        '   - Router ACLs and filtering',
        '   - Network access controls',
        '2. Validate firewall rules:',
        '   - Default deny-all policy',
        '   - Explicit allow rules for necessary traffic',
        '   - Bi-directional filtering (inbound and outbound)',
        '   - Rule review and justification',
        '3. Test segmentation effectiveness:',
        '   - Attempt unauthorized connections from non-CDE to CDE',
        '   - Verify CDE cannot initiate connections to untrusted networks',
        '   - Test that connected-to systems cannot access CDE resources',
        '4. Review and test controls for:',
        '   - Wireless networks (must not connect directly to CDE)',
        '   - Remote access (VPN, jump boxes, bastion hosts)',
        '   - Cloud environments (security groups, network ACLs)',
        '5. Verify DMZ implementation (if applicable):',
        '   - Internet-facing services in DMZ',
        '   - Separate from internal CDE',
        '   - Proper filtering between DMZ and CDE',
        '6. Document all network flows and segmentation points',
        '7. Identify segmentation weaknesses or gaps',
        '8. Calculate segmentation effectiveness score'
      ],
      outputFormat: 'JSON object with network segmentation validation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'effective', 'segmentationScore', 'issues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        effective: { type: 'boolean' },
        segmentationScore: { type: 'number', minimum: 0, maximum: 100 },
        firewallRulesReviewed: { type: 'number' },
        isolationValidated: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'network-segmentation']
}));

// Requirement 1: Network Security Controls
export const assessRequirement1Task = defineTask('assess-requirement-1', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 1: Install and Maintain Network Security Controls - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Security Compliance Auditor',
      task: 'Assess PCI DSS Requirement 1 - Install and Maintain Network Security Controls',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 1 compliance (v4.0 or v3.2.1 based on version):',
        '1. Requirement 1.1 - Network Security Controls (NSCs):',
        '   - Firewalls and/or network security controls installed',
        '   - NSCs implemented between trusted and untrusted networks',
        '   - NSCs configured to filter traffic',
        '   - Configuration standards documented and implemented',
        '2. Requirement 1.2 - Configuration and Maintenance:',
        '   - Configuration standards defined for NSCs',
        '   - Configurations reviewed at least every 6 months',
        '   - Changes managed through change control',
        '   - Configuration backups maintained',
        '3. Requirement 1.3 - Network Segmentation:',
        '   - CDE segmented from other networks',
        '   - Inbound and outbound traffic restricted',
        '   - DMZ implemented to limit inbound traffic to CDE',
        '4. Requirement 1.4 - Filtering Rules:',
        '   - Deny-all, permit-by-exception firewall rules',
        '   - Rules documented with business justification',
        '   - Rules reviewed at least every 6 months',
        '5. Requirement 1.5 - Wireless Networks (v4.0):',
        '   - Wireless not directly connected to CDE',
        '   - If wireless exists, proper segmentation and controls',
        'For each sub-requirement:',
        '   - Document current state (compliant/non-compliant)',
        '   - Collect evidence (firewall configs, network diagrams, policies)',
        '   - Identify gaps and required remediation',
        '   - Rate severity (critical/high/medium/low)',
        'Calculate Requirement 1 compliance score and overall status'
      ],
      outputFormat: 'JSON object with Requirement 1 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              compliant: { type: 'boolean' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              remediation: { type: 'string' }
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
  labels: ['agent', 'pci-dss', 'requirement-1']
}));

// Requirement 2: Secure Configurations
export const assessRequirement2Task = defineTask('assess-requirement-2', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 2: Apply Secure Configurations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Configuration Auditor',
      task: 'Assess PCI DSS Requirement 2 - Apply Secure Configurations to All System Components',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 2 compliance:',
        '1. Requirement 2.1 - Configuration Standards:',
        '   - Configuration standards defined for all system components',
        '   - Standards address known security vulnerabilities',
        '   - Standards consistent with industry-accepted hardening standards',
        '   - Standards updated as new vulnerabilities identified',
        '2. Requirement 2.2 - Secure Configuration:',
        '   - Vendor defaults changed (passwords, SNMP community strings)',
        '   - Unnecessary services, protocols, daemons removed/disabled',
        '   - Only one primary function per server',
        '   - Security features configured appropriately',
        '   - System hardening standards applied (CIS Benchmarks, vendor guides)',
        '3. Requirement 2.3 - Encrypted Admin Access:',
        '   - Strong cryptography for non-console administrative access',
        '   - SSH, VPN, TLS/SSL for remote admin',
        '   - Telnet, FTP disabled for admin access',
        '4. Review configurations for:',
        '   - Web servers, application servers, database servers',
        '   - Operating systems (Linux, Windows)',
        '   - Network devices (routers, switches, firewalls)',
        '   - Wireless access points',
        '   - Cloud infrastructure',
        'Document evidence: Configuration files, hardening checklists, scan results',
        'Identify gaps and calculate compliance score'
      ],
      outputFormat: 'JSON object with Requirement 2 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-2']
}));

// Requirement 3: Protect Stored Cardholder Data
export const assessRequirement3Task = defineTask('assess-requirement-3', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 3: Protect Stored Cardholder Data - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Compliance Specialist',
      task: 'Assess PCI DSS Requirement 3 - Protect Stored Account Data',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 3 compliance (CRITICAL REQUIREMENT):',
        '1. Requirement 3.1 - Data Retention:',
        '   - Data retention and disposal policies documented',
        '   - Storage minimized to legal/regulatory/business requirements',
        '   - Quarterly processes to delete unnecessary stored data',
        '   - Sensitive authentication data (SAD) not stored after authorization',
        '   - Full track data not stored',
        '   - CVV2/CVC2/CID not stored',
        '   - PIN/PIN block not stored',
        '2. Requirement 3.2 - No Sensitive Authentication Data Post-Authorization:',
        '   - Full magnetic stripe data not stored',
        '   - Card verification code not stored',
        '   - PIN data not stored',
        '3. Requirement 3.3 - Mask PAN When Displayed:',
        '   - PAN masked when displayed (minimum first 6 and last 4 visible)',
        '   - Applies to displays, printouts, reports',
        '   - Exception for legitimate business need with documented justification',
        '4. Requirement 3.4 - Render PAN Unreadable Everywhere:',
        '   - PAN unreadable wherever stored (including backups)',
        '   - Methods: Strong cryptography, truncation, tokenization, hashing',
        '5. Requirement 3.5 - Key Management:',
        '   - Cryptographic keys documented and implemented',
        '   - Key strength appropriate for encryption algorithm',
        '   - Secure key generation, distribution, storage',
        '   - Key rotation at least annually',
        '   - Keys retired/replaced when compromised or at end of crypto period',
        '   - Split knowledge and dual control for manual key operations',
        '6. Requirement 3.6 - Key Management Procedures:',
        '   - Documented key management processes',
        '   - Access to keys restricted to minimum necessary custodians',
        '   - Keys stored in fewest possible locations',
        '7. Requirement 3.7 - Encryption for Removable Media:',
        '   - PAN on removable media encrypted or physically secure',
        'This is a CRITICAL requirement - any gaps must be documented with high severity',
        'Verify: Encryption algorithms, key lengths, data discovery scans, tokenization'
      ],
      outputFormat: 'JSON object with Requirement 3 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'encryptionValidated', 'keyManagementValidated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        encryptionValidated: { type: 'boolean' },
        keyManagementValidated: { type: 'boolean' },
        dataRetentionCompliant: { type: 'boolean' },
        sadStorageProhibited: { type: 'boolean' },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-3']
}));

// Requirement 4: Protect Data in Transit
export const assessRequirement4Task = defineTask('assess-requirement-4', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 4: Protect Cardholder Data in Transit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Encryption and Transmission Security Auditor',
      task: 'Assess PCI DSS Requirement 4 - Protect Cardholder Data with Strong Cryptography During Transmission',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 4 compliance:',
        '1. Requirement 4.1 - Strong Cryptography and Security Protocols:',
        '   - Strong cryptography for PAN transmission over open, public networks',
        '   - Industry best practices for encryption (TLS 1.2+, not SSL)',
        '   - Secure versions of protocols (SSH v2, not v1)',
        '2. Requirement 4.2 - Never Send Unprotected PANs:',
        '   - PAN never sent via end-user messaging technologies (email, SMS, chat)',
        '   - Policy prohibiting unencrypted PAN transmission',
        '   - Technical controls to prevent/detect violations',
        '3. Review encryption for:',
        '   - Web applications (HTTPS/TLS)',
        '   - API communications',
        '   - Payment terminal connections',
        '   - Database connections',
        '   - Backup/replication traffic',
        '   - Wireless transmissions',
        '4. Validate TLS/SSL configurations:',
        '   - TLS 1.2 or higher',
        '   - Strong cipher suites (no weak ciphers)',
        '   - Valid certificates from trusted CAs',
        '   - Certificate expiration monitoring',
        '   - Perfect Forward Secrecy (PFS) enabled',
        '5. Test encryption strength:',
        '   - SSL/TLS scanning (sslyze, testssl.sh)',
        '   - Certificate validation',
        '   - Protocol version enforcement',
        'Document all transmission paths and encryption methods',
        'Identify any unencrypted PAN transmissions'
      ],
      outputFormat: 'JSON object with Requirement 4 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-4']
}));

// Requirement 5: Protect Against Malware
export const assessRequirement5Task = defineTask('assess-requirement-5', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 5: Protect All Systems and Networks from Malicious Software - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Malware Protection Auditor',
      task: 'Assess PCI DSS Requirement 5 - Protect All Systems and Networks from Malicious Software',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 5 compliance:',
        '1. Requirement 5.1 - Anti-Malware Programs:',
        '   - Anti-malware deployed on all systems commonly affected by malware',
        '   - Particularly all Windows systems and critical systems',
        '2. Requirement 5.2 - Anti-Malware Updates and Scans:',
        '   - Anti-malware kept current via automatic updates',
        '   - Periodic scans performed',
        '   - Automatic scans and real-time protection enabled',
        '   - Scan logs retained and reviewed',
        '3. Requirement 5.3 - Anti-Malware Protection:',
        '   - Anti-malware mechanisms actively running',
        '   - Cannot be disabled or altered by users',
        '   - Tamper-protection enabled',
        '4. Requirement 5.4 - Evolving Threats:',
        '   - Processes to address evolving malware threats',
        '   - Periodic evaluations to identify new malware',
        '   - Updates to anti-malware techniques',
        'Review for:',
        '   - Endpoint protection platforms deployed',
        '   - EDR (Endpoint Detection and Response) solutions',
        '   - Server anti-malware (Windows, Linux if applicable)',
        '   - Definition update frequency',
        '   - Scan schedules and results',
        '   - Admin controls preventing disablement',
        'Verify anti-malware coverage across all in-scope systems',
        'Check for systems vulnerable to malware without protection'
      ],
      outputFormat: 'JSON object with Requirement 5 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-5']
}));

// Requirement 6: Develop Secure Systems and Software
export const assessRequirement6Task = defineTask('assess-requirement-6', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 6: Develop and Maintain Secure Systems and Software - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Secure Development and Vulnerability Management Auditor',
      task: 'Assess PCI DSS Requirement 6 - Develop and Maintain Secure Systems and Software',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        quarterlyScans: args.quarterlyScans,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 6 compliance:',
        '1. Requirement 6.1 - Security Vulnerability Identification:',
        '   - Processes to identify security vulnerabilities',
        '   - Security vulnerability information from reputable sources',
        '   - Risk ranking of vulnerabilities (e.g., CVSS)',
        '2. Requirement 6.2 - Patch Management:',
        '   - Critical security patches installed within 1 month',
        '   - All security patches installed within timeframes per risk ranking',
        '   - Patch management process documented',
        '3. Requirement 6.3 - Secure Software Development:',
        '   - Software developed in accordance with PCI DSS',
        '   - Secure coding guidelines followed (OWASP, CWE)',
        '   - Security training for developers',
        '   - Code reviews or automated analysis',
        '4. Requirement 6.4 - Change Control:',
        '   - Change control processes for system/software changes',
        '   - Documentation of impact, approval, testing',
        '   - Separation of development, test, production',
        '   - Test data does not contain live PAN',
        '   - Removal of test data/accounts before production',
        '5. Requirement 6.5 - Address Common Coding Vulnerabilities:',
        '   - Applications protected against common attacks (OWASP Top 10):',
        '     * Injection flaws (SQL, OS, LDAP)',
        '     * Broken authentication',
        '     * Sensitive data exposure',
        '     * XXE, broken access control, security misconfiguration',
        '     * XSS, insecure deserialization, insufficient logging',
        '6. Requirement 6.6 - Web Application Protection:',
        '   - Public-facing web applications protected via:',
        '     * Application layer firewall (WAF), OR',
        '     * Manual or automated application vulnerability security assessment',
        '7. Requirement 6.7 - Security Policies for Software:',
        '   - Security policies and procedures for developing software',
        'Review: Vulnerability scans, patch management records, SDLC documentation,',
        'code review reports, WAF logs, penetration test results'
      ],
      outputFormat: 'JSON object with Requirement 6 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-6']
}));

// Requirement 7: Restrict Access to Cardholder Data
export const assessRequirement7Task = defineTask('assess-requirement-7', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 7: Restrict Access to System Components and Cardholder Data - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Access Control Auditor',
      task: 'Assess PCI DSS Requirement 7 - Restrict Access to Cardholder Data by Business Need to Know',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 7 compliance:',
        '1. Requirement 7.1 - Access Control Systems:',
        '   - Access to system components and cardholder data limited',
        '   - Access based on job classification and function (need to know)',
        '   - Default deny-all setting',
        '2. Requirement 7.2 - Access Control Policies:',
        '   - Access control policies document:',
        '     * User access needs by role',
        '     * Privilege assignments for each role',
        '     * Authorized privilege levels',
        '   - Policies reviewed and updated regularly',
        '3. Requirement 7.3 - Least Privilege Access:',
        '   - Access rights granted based on least privilege',
        '   - Assignment based on job classification and function',
        '   - Requires approval by authorized personnel',
        'Review access controls for:',
        '   - Application access (role-based access control)',
        '   - Database access (users, roles, privileges)',
        '   - Operating system access (sudo, admin groups)',
        '   - Cloud IAM policies (AWS, Azure, GCP)',
        '   - Network device access',
        'Verify:',
        '   - Access requests and approvals documented',
        '   - Periodic access reviews performed',
        '   - Segregation of duties implemented',
        '   - Privileged access restricted and monitored',
        '   - Access revoked upon termination',
        'Sample user accounts and validate appropriate access levels'
      ],
      outputFormat: 'JSON object with Requirement 7 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-7']
}));

// Requirement 8: Identify and Authenticate Access
export const assessRequirement8Task = defineTask('assess-requirement-8', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 8: Identify Users and Authenticate Access - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Identity and Authentication Auditor',
      task: 'Assess PCI DSS Requirement 8 - Identify Users and Authenticate Access to System Components',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 8 compliance:',
        '1. Requirement 8.1 - User Identification:',
        '   - Unique ID assigned to each user',
        '   - Shared/generic accounts prohibited',
        '   - User identification managed throughout lifecycle',
        '2. Requirement 8.2 - Strong Authentication:',
        '   - Strong authentication for all users',
        '   - Multi-factor authentication (MFA) for:',
        '     * Remote access to CDE',
        '     * Administrative access to CDE',
        '     * All access to CDE (v4.0 requirement)',
        '   - MFA methods: Something you know + something you have/are',
        '3. Requirement 8.3 - Secure Authentication:',
        '   - Password/passphrase complexity requirements:',
        '     * Minimum 12 characters (v4.0) or 7 characters (v3.2.1)',
        '     * Contains numeric and alphabetic characters',
        '   - Passwords changed at least every 90 days',
        '   - New password different from last 4 passwords',
        '   - Password lockout after 6 failed attempts',
        '   - Lockout duration 30 minutes or until admin enables',
        '   - Session timeout after 15 minutes of inactivity',
        '4. Requirement 8.4 - Password Management:',
        '   - Passwords/passphrases stored with strong cryptography',
        '   - Passwords not sent in clear text',
        '   - Default passwords changed',
        '   - Password files secured',
        '5. Requirement 8.5 - Service Accounts:',
        '   - Service accounts with interactive login disabled where possible',
        '   - Strong authentication for service accounts',
        '6. Requirement 8.6 - Account Management:',
        '   - User accounts reviewed at least every 6 months',
        '   - Inactive accounts removed or disabled within 90 days',
        '   - Vendor remote access enabled only when needed, disabled after use',
        'Verify authentication controls across all system components',
        'Test password policies, MFA implementation, session timeouts'
      ],
      outputFormat: 'JSON object with Requirement 8 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-8']
}));

// Requirement 9: Restrict Physical Access
export const assessRequirement9Task = defineTask('assess-requirement-9', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 9: Restrict Physical Access - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Physical Security Auditor',
      task: 'Assess PCI DSS Requirement 9 - Restrict Physical Access to Cardholder Data',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 9 compliance:',
        '1. Requirement 9.1 - Physical Access Controls:',
        '   - Appropriate facility entry controls to limit physical access',
        '   - Video cameras or access control mechanisms',
        '   - Physical access restricted to authorized personnel',
        '   - Visitor access authorized, logged, and monitored',
        '2. Requirement 9.2 - Visitor Authorization:',
        '   - Visitor procedures implemented',
        '   - Visitors authorized before entering areas with cardholder data',
        '   - Visitors given physical badge/token that expires',
        '   - Visitors escorted at all times in areas with cardholder data',
        '   - Badge returned or deactivated upon departure',
        '3. Requirement 9.3 - Employee Access Controls:',
        '   - Physical access for employees controlled with badges',
        '   - Access to sensitive areas restricted and controlled',
        '   - Access badges differentiate employees from visitors',
        '4. Requirement 9.4 - Access Logs:',
        '   - Visitor logs maintained showing physical access to facilities',
        '   - Logs include name, company, authorized personnel',
        '   - Logs retained at least 3 months',
        '5. Requirement 9.5 - Secure Storage of Media:',
        '   - Media stored in secure location with access logged',
        '   - Media physically secured (locked cabinet/room)',
        '   - Media inventoried at least annually',
        '6. Requirement 9.6 - Media Distribution:',
        '   - Media classified to determine sensitivity',
        '   - Media sent by secured courier or tracked',
        '   - Management approval for media moved outside facility',
        '7. Requirement 9.7 - Media Management:',
        '   - Strict control over media storage and accessibility',
        '   - Media inventory maintained',
        '8. Requirement 9.8 - Media Destruction:',
        '   - Media destroyed when no longer needed',
        '   - Destruction methods: shred, incinerate, pulp, degauss',
        '   - Storage containers for materials to be destroyed secured',
        '9. Requirement 9.9 - POI Device Protection:',
        '   - Point-of-sale (POI) devices protected from tampering',
        '   - Device lists maintained, inspected periodically',
        '   - Personnel trained to detect tampering',
        'For cloud environments, assess data center physical security controls',
        'For on-premises, verify physical access controls and monitoring'
      ],
      outputFormat: 'JSON object with Requirement 9 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-9']
}));

// Requirement 10: Log and Monitor Access
export const assessRequirement10Task = defineTask('assess-requirement-10', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 10: Log and Monitor All Access - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Logging and Monitoring Auditor',
      task: 'Assess PCI DSS Requirement 10 - Log and Monitor All Access to System Components and Cardholder Data',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 10 compliance:',
        '1. Requirement 10.1 - Audit Trail:',
        '   - Implement audit trails to link all access to system components',
        '   - Logs for each user and privileged access',
        '2. Requirement 10.2 - Automated Audit Trails:',
        '   - Automated audit trails for security-relevant events:',
        '     * All individual user access to cardholder data',
        '     * All actions by privileged users (root, admin)',
        '     * All access to audit trails',
        '     * Invalid logical access attempts',
        '     * Use of identification/authentication mechanisms',
        '     * Initialization of audit logs',
        '     * Creation/deletion of system-level objects',
        '3. Requirement 10.3 - Audit Trail Entries:',
        '   - Record at least these elements for each event:',
        '     * User identification',
        '     * Type of event',
        '     * Date and time',
        '     * Success or failure indication',
        '     * Origination of event',
        '     * Identity/name of affected data, system, resource',
        '4. Requirement 10.4 - Time Synchronization:',
        '   - Time synchronized using NTP or similar',
        '   - Time data protected (ACLs, encryption)',
        '   - Time settings received from industry-accepted sources',
        '5. Requirement 10.5 - Secure Audit Trails:',
        '   - Audit trails secured to prevent tampering:',
        '     * Limit access to audit trails to those with job-related need',
        '     * Protect audit trail files from unauthorized modifications',
        '     * Promptly back up audit trail files to centralized log server',
        '     * Write logs for external-facing technologies to secure central server',
        '6. Requirement 10.6 - Log Review:',
        '   - Review logs and security events for all system components:',
        '     * Daily review of security logs',
        '     * Periodic review of other logs',
        '     * Automated processes to review logs (SIEM)',
        '7. Requirement 10.7 - Log Retention:',
        '   - Retain audit trail history for at least 12 months',
        '   - At least 3 months immediately available for analysis',
        'Review: SIEM configuration, log aggregation, log retention policies,',
        'log review procedures, time synchronization configuration'
      ],
      outputFormat: 'JSON object with Requirement 10 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-10']
}));

// Requirement 11: Test Security Controls
export const assessRequirement11Task = defineTask('assess-requirement-11', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 11: Test Security of Systems and Networks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Testing and Validation Auditor',
      task: 'Assess PCI DSS Requirement 11 - Regularly Test Security Systems and Processes',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        version: args.version,
        asvScan: args.asvScan,
        penetrationTest: args.penetrationTest,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 11 compliance:',
        '1. Requirement 11.1 - Unauthorized Wireless Access Points:',
        '   - Test for presence of wireless access points (802.11)',
        '   - Quarterly testing for unauthorized wireless',
        '   - Automated monitoring or quarterly manual scans',
        '   - Incident response if unauthorized wireless detected',
        '2. Requirement 11.2 - Internal and External Network Vulnerability Scans:',
        '   - Quarterly internal vulnerability scans',
        '   - Quarterly external vulnerability scans by ASV (Approved Scanning Vendor)',
        '   - Scans after any significant change',
        '   - Vulnerabilities scored high-risk per CVSS resolved',
        '   - Rescans performed until passing results achieved',
        '   - ASV scans performed by PCI SSC Approved Scanning Vendor',
        '3. Requirement 11.3 - External and Internal Penetration Testing:',
        '   - Annual external penetration testing',
        '   - Annual internal penetration testing',
        '   - Testing after significant infrastructure/application upgrades',
        '   - Test methodology: Industry-accepted approach (NIST, PTES, OWASP)',
        '   - Test coverage: Network layer and application layer',
        '   - Segmentation testing if used to reduce scope',
        '   - Exploitable vulnerabilities corrected and retesting performed',
        '4. Requirement 11.4 - Intrusion Detection/Prevention:',
        '   - Intrusion detection/prevention (IDS/IPS) deployed',
        '   - Monitor all traffic at perimeter and critical points in CDE',
        '   - IDS/IPS kept current',
        '   - Alerts generated and responded to',
        '5. Requirement 11.5 - Change Detection:',
        '   - Deploy change detection mechanism (file integrity monitoring)',
        '   - Alert on unauthorized modifications to critical files, configs, content',
        '   - Perform comparison of files at least weekly',
        '6. Requirement 11.6 - Security Monitoring:',
        '   - Ensure security monitoring and testing activities are documented',
        '   - Processes to respond to security failures',
        'Verify: ASV scan reports (last 4 quarters), penetration test reports (annual),',
        'wireless scanning evidence, IDS/IPS configuration, FIM alerts'
      ],
      outputFormat: 'JSON object with Requirement 11 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'asvScanCompliant', 'penetrationTestCompliant', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        asvScanCompliant: { type: 'boolean' },
        asvScanDate: { type: 'string' },
        penetrationTestCompliant: { type: 'boolean' },
        penetrationTestDate: { type: 'string' },
        vulnerabilitiesFound: { type: 'number' },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-11']
}));

// Requirement 12: Maintain Information Security Policy
export const assessRequirement12Task = defineTask('assess-requirement-12', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Requirement 12: Support Information Security with Organizational Policies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Policy and Governance Auditor',
      task: 'Assess PCI DSS Requirement 12 - Support Information Security with Organizational Policies and Programs',
      context: {
        projectName: args.projectName,
        merchantLevel: args.merchantLevel,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        'Assess PCI DSS Requirement 12 compliance:',
        '1. Requirement 12.1 - Security Policy:',
        '   - Security policy established, published, maintained, disseminated',
        '   - Policy reviewed annually and updated as needed',
        '   - Policy addresses all PCI DSS requirements',
        '   - Policy includes risk assessment, security controls, incident response',
        '2. Requirement 12.2 - Risk Assessment:',
        '   - Risk assessment process performed at least annually',
        '   - Identifies critical assets, threats, vulnerabilities',
        '   - Results in formal documented risk assessment',
        '3. Requirement 12.3 - Usage Policies:',
        '   - Usage policies for critical technologies defined:',
        '     * Remote access technologies',
        '     * Wireless technologies',
        '     * Removable electronic media',
        '     * Laptops, tablets, mobile devices',
        '     * Email and internet usage',
        '   - Policies require management approval',
        '4. Requirement 12.4 - Security Responsibilities:',
        '   - Security responsibilities explicitly assigned to all personnel',
        '   - Job descriptions include information security responsibilities',
        '5. Requirement 12.5 - Individual Responsibility:',
        '   - Information security responsibilities assigned to individual or team',
        '   - Includes: Security policy management, monitoring, investigating',
        '6. Requirement 12.6 - Security Awareness Program:',
        '   - Formal security awareness program',
        '   - Personnel trained upon hire and at least annually',
        '   - Training includes: Importance of security, user responsibilities',
        '   - Acknowledgment by personnel that they read and understand policy',
        '7. Requirement 12.7 - Personnel Screening:',
        '   - Screen potential personnel before hire',
        '   - Background checks conducted consistent with local laws',
        '8. Requirement 12.8 - Service Provider Management:',
        '   - Maintain list of service providers with access to CHD',
        '   - Written agreement with service providers',
        '   - Due diligence before engagement',
        '   - Monitor service provider compliance at least annually',
        '9. Requirement 12.9 - Service Provider Acknowledgment:',
        '   - Service providers acknowledge responsibility for security of CHD',
        '10. Requirement 12.10 - Incident Response Plan:',
        '   - Incident response plan created, tested, maintained',
        '   - Plan addresses roles, communication, containment',
        '   - Plan tested at least annually',
        '   - Personnel trained on incident response procedures',
        '   - Alerts from security monitoring systems responded to',
        '   - Incident response plan evolves with threats',
        'Review: Security policy documents, risk assessment reports, training records,',
        'incident response plan, service provider agreements, background check policies'
      ],
      outputFormat: 'JSON object with Requirement 12 assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirement: { type: 'number' },
        name: { type: 'string' },
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        subRequirements: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'requirement-12']
}));

// Phase 15: Execute ASV Scan
export const executeAsvScanTask = defineTask('execute-asv-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute ASV Quarterly Vulnerability Scan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ASV Scanning Specialist',
      task: 'Execute quarterly Approved Scanning Vendor (ASV) vulnerability scan',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        merchantLevel: args.merchantLevel,
        quarterlyScans: args.quarterlyScans,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute ASV vulnerability scan using PCI SSC approved scanner:',
        '   - Scan all external IP addresses and domains in scope',
        '   - Scan payment application URLs',
        '   - Scan internet-facing systems connected to CDE',
        '2. ASV scan requirements:',
        '   - Performed quarterly (4 times per year)',
        '   - Performed after significant changes',
        '   - Must be performed by PCI SSC Approved Scanning Vendor',
        '   - Scan all external-facing IP addresses',
        '3. Passing scan criteria:',
        '   - No vulnerabilities rated 4.0 or higher by CVSS',
        '   - All identified vulnerabilities resolved or compensating controls documented',
        '   - Scan must show "Pass" from ASV',
        '4. Document scan results:',
        '   - Vulnerabilities identified (if any)',
        '   - CVSS scores for each vulnerability',
        '   - Affected systems/IPs',
        '   - Remediation actions taken',
        '5. If scan fails:',
        '   - Document all CVSS 4.0+ vulnerabilities',
        '   - Create remediation plan',
        '   - Rescan after remediation until pass achieved',
        '6. Maintain scan history:',
        '   - Last 4 quarterly scans',
        '   - Evidence of passing scans',
        '   - Remediation documentation for failures',
        '7. Generate ASV scan report with:',
        '   - Scan date and scanner name',
        '   - Pass/Fail status',
        '   - Vulnerability findings',
        '   - Next scan due date (quarterly)',
        '8. Submit passing scan results to acquiring bank (if Level 1)'
      ],
      outputFormat: 'JSON object with ASV scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'vulnerabilitiesFound', 'scanDate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean', description: 'ASV scan passed (no CVSS 4.0+ vulnerabilities)' },
        vulnerabilitiesFound: { type: 'number' },
        criticalVulnerabilities: { type: 'number', description: 'CVSS 4.0+ vulnerabilities' },
        scanDate: { type: 'string' },
        nextScanDue: { type: 'string', description: 'Next quarterly scan due date' },
        scannerName: { type: 'string', description: 'Name of PCI SSC Approved Scanning Vendor' },
        scannedIPs: { type: 'array', items: { type: 'string' } },
        topVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cve: { type: 'string' },
              cvss: { type: 'number' },
              description: { type: 'string' },
              affectedSystem: { type: 'string' }
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
  labels: ['agent', 'pci-dss', 'asv-scan']
}));

// Phase 16: Execute Penetration Test
export const executePenetrationTestTask = defineTask('execute-penetration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Annual Penetration Test - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Penetration Testing Specialist',
      task: 'Execute annual internal and external penetration testing per PCI DSS requirements',
      context: {
        projectName: args.projectName,
        cdeAssets: args.cdeAssets,
        connectedAssets: args.connectedAssets,
        merchantLevel: args.merchantLevel,
        networkSegmentation: args.networkSegmentation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute external penetration test:',
        '   - Test all internet-facing systems in scope',
        '   - Test network layer and application layer',
        '   - Attempt to exploit identified vulnerabilities',
        '   - Test security controls (firewalls, IDS/IPS, WAF)',
        '2. Execute internal penetration test:',
        '   - Test from inside the network',
        '   - Test lateral movement capabilities',
        '   - Test privilege escalation',
        '   - Test internal segmentation controls',
        '3. If network segmentation is used to reduce PCI DSS scope:',
        '   - Perform segmentation testing to verify isolation',
        '   - Test that CDE is isolated from out-of-scope networks',
        '   - Attempt to breach segmentation controls',
        '4. Testing methodology:',
        '   - Follow industry-accepted penetration testing methodology:',
        '     * NIST SP 800-115',
        '     * Penetration Testing Execution Standard (PTES)',
        '     * OWASP Testing Guide',
        '   - Include both network and application layer testing',
        '   - Test authentication, authorization, session management',
        '   - Test for common vulnerabilities (OWASP Top 10, SANS Top 25)',
        '5. Penetration test requirements:',
        '   - Annual testing (at least once per year)',
        '   - Testing after significant infrastructure or application changes',
        '   - Must be performed by qualified internal or external resource',
        '   - Organizational independence of tester preferred',
        '6. Document all findings:',
        '   - Vulnerabilities identified with severity ratings',
        '   - Exploitability assessment',
        '   - Business impact analysis',
        '   - Remediation recommendations',
        '7. Remediation and retesting:',
        '   - Exploitable vulnerabilities must be corrected',
        '   - Retest after remediation to verify fixes',
        '   - Test passes when exploitable vulnerabilities resolved',
        '8. Generate penetration test report with:',
        '   - Executive summary',
        '   - Testing methodology',
        '   - Findings with severity ratings',
        '   - Remediation recommendations',
        '   - Evidence of testing',
        '   - Segmentation validation results (if applicable)'
      ],
      outputFormat: 'JSON object with penetration test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'issuesFound', 'criticalIssues', 'testDate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        issuesFound: { type: 'number' },
        criticalIssues: { type: 'number' },
        highIssues: { type: 'number' },
        mediumIssues: { type: 'number' },
        lowIssues: { type: 'number' },
        testDate: { type: 'string' },
        nextTestDue: { type: 'string', description: 'Next annual test due date' },
        segmentationValidated: { type: 'boolean' },
        segmentationEffective: { type: 'boolean' },
        criticalFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              exploitability: { type: 'string' },
              remediation: { type: 'string' }
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
  labels: ['agent', 'pci-dss', 'penetration-test']
}));

// Phase 17: Calculate Compliance Score
export const calculateComplianceScoreTask = defineTask('calculate-compliance-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate Overall PCI DSS Compliance Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PCI DSS Compliance Scoring Specialist',
      task: 'Calculate overall PCI DSS compliance score based on requirement assessments',
      context: {
        projectName: args.projectName,
        requirementResults: args.requirementResults,
        asvScanResult: args.asvScanResult,
        penetrationTestResult: args.penetrationTestResult,
        merchantLevel: args.merchantLevel,
        assessmentType: args.assessmentType,
        version: args.version,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate compliance score (0-100):',
        '   - All 12 requirements equally weighted (8.33 points each)',
        '   - Sum of all requirement scores',
        '   - Requirements scored 0-100 each',
        '2. Assess overall compliance status:',
        '   - Compliant: All 12 requirements met (score = 100, no gaps)',
        '   - Non-Compliant: Any requirement not met',
        '   - Note: PCI DSS is pass/fail - must meet ALL requirements',
        '3. Factor in security testing results:',
        '   - ASV scan status (must pass for compliance)',
        '   - Penetration test status (must address findings)',
        '   - Reduce score if security testing not compliant',
        '4. Identify critical gaps:',
        '   - Requirements with score < 80',
        '   - Requirements with critical gaps',
        '   - Requirement 3, 4 (data protection) failures are critical',
        '5. Calculate compliance readiness:',
        '   - Ready for certification (score 100, no gaps)',
        '   - Near compliance (score 90-99, minor gaps)',
        '   - Significant work needed (score 70-89)',
        '   - Major gaps (score < 70)',
        '6. Assess by merchant level:',
        '   - Level 1: Requires QSA on-site audit + ROC',
        '   - Level 2-4: May complete SAQ (Self-Assessment Questionnaire)',
        '7. Document scoring methodology and rationale',
        '8. Provide compliance verdict and certification recommendation'
      ],
      outputFormat: 'JSON object with compliance scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'overallCompliant', 'readiness', 'criticalRequirements', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        overallCompliant: { type: 'boolean', description: 'All 12 requirements met' },
        compliantRequirements: { type: 'number', description: 'Number of fully compliant requirements' },
        readiness: {
          type: 'string',
          enum: ['ready-for-certification', 'near-compliance', 'significant-work-needed', 'major-gaps']
        },
        criticalRequirements: {
          type: 'array',
          items: { type: 'number' },
          description: 'Requirements with critical gaps'
        },
        securityTestingCompliant: { type: 'boolean' },
        certificationRecommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'compliance-scoring']
}));

// Phase 18: Gap Analysis and Remediation Planning
export const performGapAnalysisTask = defineTask('perform-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Perform Gap Analysis and Generate Remediation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PCI DSS Remediation Planning Specialist',
      task: 'Perform comprehensive gap analysis and create prioritized remediation plan',
      context: {
        projectName: args.projectName,
        gaps: args.gaps,
        requirementResults: args.requirementResults,
        complianceScore: args.complianceScore,
        merchantLevel: args.merchantLevel,
        automatedRemediation: args.automatedRemediation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze all identified gaps:',
        '   - Categorize by requirement (1-12)',
        '   - Categorize by severity (critical, high, medium, low)',
        '   - Identify dependencies between gaps',
        '2. Prioritize gaps based on:',
        '   - Severity of gap',
        '   - Risk to cardholder data',
        '   - Requirements 3, 4 (data protection) highest priority',
        '   - ASV/penetration test failures high priority',
        '   - Merchant level requirements (Level 1 most stringent)',
        '3. For each gap, document:',
        '   - Gap description',
        '   - Affected requirement',
        '   - Current state vs. required state',
        '   - Risk/impact if not remediated',
        '   - Remediation actions required',
        '   - Estimated effort (hours/days)',
        '   - Required resources/skills',
        '   - Dependencies on other remediations',
        '4. Create remediation plan with:',
        '   - Phase 1 (0-30 days): Critical gaps',
        '   - Phase 2 (30-60 days): High priority gaps',
        '   - Phase 3 (60-90 days): Medium priority gaps',
        '   - Phase 4 (90+ days): Low priority gaps and continuous improvement',
        '5. Identify quick wins:',
        '   - Low effort, high impact remediations',
        '   - Policy/documentation updates',
        '   - Configuration changes',
        '6. Identify auto-remediable gaps (if enabled):',
        '   - Configuration compliance',
        '   - Patch management',
        '   - Access reviews',
        '7. Estimate total remediation effort and timeline',
        '8. Calculate compliance roadmap with milestones',
        '9. Generate remediation tracking workbook'
      ],
      outputFormat: 'JSON object with gap analysis and remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criticalGaps', 'remediationItems', 'estimatedEffort', 'remediationPlanPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalGaps: { type: 'number' },
        criticalGaps: { type: 'number' },
        highGaps: { type: 'number' },
        mediumGaps: { type: 'number' },
        lowGaps: { type: 'number' },
        autoRemediableGaps: { type: 'number' },
        estimatedEffort: { type: 'string', description: 'Total estimated effort (e.g., "180 days")' },
        remediationItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              requirement: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              phase: { type: 'string' }
            }
          }
        },
        remediationPriorities: {
          type: 'object',
          properties: {
            phase1: { type: 'array', items: { type: 'string' } },
            phase2: { type: 'array', items: { type: 'string' } },
            phase3: { type: 'array', items: { type: 'string' } },
            phase4: { type: 'array', items: { type: 'string' } }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        remediationPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'gap-analysis']
}));

// Phase 19: Generate Attestation of Compliance (AOC)
export const generateAocTask = defineTask('generate-aoc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Attestation of Compliance (AOC) - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PCI DSS Documentation Specialist',
      task: 'Generate Attestation of Compliance (AOC) document',
      context: {
        projectName: args.projectName,
        merchantLevel: args.merchantLevel,
        assessmentType: args.assessmentType,
        version: args.version,
        requirementResults: args.requirementResults,
        complianceScore: args.complianceScore,
        asvScanResult: args.asvScanResult,
        penetrationTestResult: args.penetrationTestResult,
        gaps: args.gaps,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate AOC document per PCI SSC template:',
        '   - Use official PCI DSS AOC template for version and SAQ type',
        '   - Complete all required sections',
        '   - Include executive attestation signature blocks',
        '2. AOC sections to complete:',
        '   Part 1: Merchant/Service Provider Information',
        '   - Company name, address, contact information',
        '   - Merchant level and assessment type',
        '   - Assessment date and period',
        '   Part 2: Executive Summary',
        '   - Scope of assessment',
        '   - Assessment approach',
        '   - Compliance status for each requirement',
        '   Part 3: Detailed Findings',
        '   - Status of each requirement (met/not met)',
        '   - Expected completion date for gaps (if not compliant)',
        '   Part 4: SAQ Responses (if SAQ)',
        '   - Yes/No responses for each SAQ question',
        '   - Supporting documentation references',
        '   Part 5: Action Plan (if gaps exist)',
        '   - Remediation plan for non-compliant items',
        '   - Target completion dates',
        '   Part 6: Attestation',
        '   - Executive signature attesting to compliance status',
        '   - Date of attestation',
        '3. Include compliance status:',
        '   - Overall: Compliant / Non-Compliant / In Progress',
        '   - For each of 12 requirements: Met / Not Met / Not Applicable',
        '4. Include ASV scan documentation:',
        '   - 4 most recent quarterly ASV scan results',
        '   - Passing scan attestation from ASV',
        '5. Reference supporting documentation:',
        '   - Policies and procedures',
        '   - Network diagrams',
        '   - System inventory',
        '   - ASV scan reports',
        '   - Penetration test report',
        '6. Generate AOC in PDF format with official PCI DSS branding',
        '7. Create AOC submission package for acquiring bank'
      ],
      outputFormat: 'JSON object with AOC generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'aocPath', 'compliantStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        aocPath: { type: 'string', description: 'Path to generated AOC PDF' },
        compliantStatus: { type: 'string', enum: ['compliant', 'non-compliant', 'in-progress'] },
        attestationDate: { type: 'string' },
        complianceSummary: {
          type: 'object',
          properties: {
            req1: { type: 'boolean' },
            req2: { type: 'boolean' },
            req3: { type: 'boolean' },
            req4: { type: 'boolean' },
            req5: { type: 'boolean' },
            req6: { type: 'boolean' },
            req7: { type: 'boolean' },
            req8: { type: 'boolean' },
            req9: { type: 'boolean' },
            req10: { type: 'boolean' },
            req11: { type: 'boolean' },
            req12: { type: 'boolean' }
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
  labels: ['agent', 'pci-dss', 'aoc']
}));

// Phase 20: Generate Report on Compliance (ROC) for Level 1
export const generateRocTask = defineTask('generate-roc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report on Compliance (ROC) - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QSA (Qualified Security Assessor) Report Writer',
      task: 'Generate comprehensive Report on Compliance (ROC) for Level 1 merchant',
      context: {
        projectName: args.projectName,
        merchantLevel: args.merchantLevel,
        version: args.version,
        requirementResults: args.requirementResults,
        complianceScore: args.complianceScore,
        cdeScopeResult: args.cdeScopeResult,
        asvScanResult: args.asvScanResult,
        penetrationTestResult: args.penetrationTestResult,
        gaps: args.gaps,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate comprehensive ROC per PCI SSC template:',
        '   - Use official PCI DSS ROC template for version',
        '   - Complete all required sections with detailed evidence',
        '   - Include QSA company information (or note internal assessment)',
        '2. ROC sections to complete:',
        '   Executive Summary:',
        '   - Assessment overview and scope',
        '   - Overall compliance status',
        '   - Key findings and risks',
        '   Company and Assessment Details:',
        '   - Company information and description',
        '   - Merchant level justification',
        '   - Assessment methodology and approach',
        '   - Assessment dates and personnel',
        '   Description of Scope of Work:',
        '   - Detailed CDE scope description',
        '   - Network segmentation details',
        '   - System components in scope',
        '   - People, processes, technology assessed',
        '   Network Diagram:',
        '   - Comprehensive CDE network diagram',
        '   - Cardholder data flows',
        '   - Segmentation points',
        '   Detailed Assessment Findings (12 Requirements):',
        '   - For EACH requirement (1-12):',
        '     * Requirement description',
        '     * Testing procedures performed',
        '     * Evidence reviewed (documents, configs, interviews, observations)',
        '     * Findings (in place, not in place, not applicable)',
        '     * Compensating controls (if any)',
        '     * Observations and recommendations',
        '   PCI DSS Compliance Matrix:',
        '   - Summary table: Requirement | In Place | Not in Place | N/A',
        '   Compensating Controls:',
        '   - Document any compensating controls with justification',
        '   Appendices:',
        '   - ASV scan reports',
        '   - Penetration test summary',
        '   - Additional evidence',
        '3. Document evidence for each sub-requirement:',
        '   - Policies and procedures reviewed',
        '   - System configurations examined',
        '   - Personnel interviewed',
        '   - Testing performed and results',
        '4. Include all required attachments:',
        '   - Network diagram',
        '   - Cardholder data flow diagram',
        '   - Sample documentation',
        '   - ASV scan reports',
        '5. Generate ROC in comprehensive PDF format (typically 100-300 pages)',
        '6. Prepare ROC submission package for card brands'
      ],
      outputFormat: 'JSON object with ROC generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rocPath', 'pageCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rocPath: { type: 'string', description: 'Path to generated ROC PDF' },
        pageCount: { type: 'number', description: 'Total pages in ROC' },
        assessmentDate: { type: 'string' },
        nextAssessmentDue: { type: 'string', description: 'Annual reassessment due date' },
        evidenceCount: { type: 'number', description: 'Number of evidence items documented' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'roc']
}));

// Phase 21: Generate PCI DSS Documentation
export const generatePciDocumentationTask = defineTask('generate-pci-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate PCI DSS Compliance Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PCI DSS Documentation Specialist',
      task: 'Generate comprehensive PCI DSS compliance documentation and executive summary',
      context: {
        projectName: args.projectName,
        merchantLevel: args.merchantLevel,
        assessmentType: args.assessmentType,
        version: args.version,
        complianceScore: args.complianceScore,
        requirementResults: args.requirementResults,
        cdeScopeResult: args.cdeScopeResult,
        asvScanResult: args.asvScanResult,
        penetrationTestResult: args.penetrationTestResult,
        gaps: args.gaps,
        gapAnalysisResult: args.gapAnalysisResult,
        aocResult: args.aocResult,
        rocResult: args.rocResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate Executive Summary:',
        '   - Overall compliance status and score',
        '   - Merchant level and assessment type',
        '   - CDE scope overview',
        '   - Key findings (strengths and weaknesses)',
        '   - Critical gaps requiring immediate attention',
        '   - Compliance roadmap and timeline',
        '   - Business impact and risk summary',
        '2. Document Compliance Status by Requirement:',
        '   - For each of 12 requirements:',
        '     * Requirement name and description',
        '     * Compliance status (met/not met)',
        '     * Score (0-100)',
        '     * Key findings',
        '     * Gaps identified',
        '     * Remediation recommendations',
        '3. CDE Scope Documentation:',
        '   - In-scope assets (systems storing/processing/transmitting CHD)',
        '   - Connected systems',
        '   - Out-of-scope systems',
        '   - Network segmentation effectiveness',
        '   - Data flows and cardholder data lifecycle',
        '4. Security Testing Results:',
        '   - ASV quarterly scan results and history',
        '   - Penetration test findings',
        '   - Vulnerability summary and trends',
        '   - Remediation status',
        '5. Gap Analysis and Remediation Plan:',
        '   - All gaps categorized by severity',
        '   - Prioritized remediation roadmap',
        '   - Estimated effort and timeline',
        '   - Quick wins and long-term initiatives',
        '   - Dependencies and risks',
        '6. Compliance Artifacts:',
        '   - AOC (if generated)',
        '   - ROC (if generated)',
        '   - ASV scan reports',
        '   - Penetration test report',
        '   - Network diagrams',
        '   - Policy references',
        '7. Next Steps and Recommendations:',
        '   - Immediate actions required',
        '   - 30/60/90 day milestones',
        '   - Annual compliance maintenance plan',
        '   - Continuous monitoring recommendations',
        '8. Appendices:',
        '   - PCI DSS requirement checklist',
        '   - Compliance matrix',
        '   - Evidence inventory',
        '   - Glossary of terms',
        '9. Format as professional Markdown report with:',
        '   - Table of contents',
        '   - Executive summary',
        '   - Detailed findings',
        '   - Remediation plan',
        '   - Appendices'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Main PCI DSS compliance report path' },
        executiveSummaryPath: { type: 'string' },
        executiveSummary: { type: 'string', description: 'Brief executive summary text' },
        keyFindings: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 5-10 key findings'
        },
        criticalGaps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Critical gaps requiring immediate action'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top recommendations'
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Immediate next steps'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pci-dss', 'documentation']
}));
