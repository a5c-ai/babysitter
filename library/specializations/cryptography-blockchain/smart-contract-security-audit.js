/**
 * @process specializations/cryptography-blockchain/smart-contract-security-audit
 * @description Smart Contract Security Audit Process - Systematic security review of smart contracts including manual code review,
 * automated analysis, formal verification, and economic attack vector assessment to identify vulnerabilities before deployment.
 * @inputs { projectName: string, contractPaths?: array, auditScope?: object, severityThreshold?: string, auditType?: string }
 * @outputs { success: boolean, auditReport: object, findings: array, riskScore: number, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/smart-contract-security-audit', {
 *   projectName: 'DeFi Protocol Audit',
 *   contractPaths: ['contracts/core/', 'contracts/periphery/'],
 *   auditScope: { includes: ['all contracts'], excludes: ['test/', 'mocks/'] },
 *   severityThreshold: 'medium',
 *   auditType: 'full'
 * });
 *
 * @references
 * - Slither Static Analyzer: https://github.com/crytic/slither
 * - Mythril Security Tool: https://github.com/Consensys/mythril
 * - SWC Registry: https://swcregistry.io/
 * - Trail of Bits Audit Guide: https://github.com/trailofbits/publications
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contractPaths = ['contracts/'],
    auditScope = {},
    severityThreshold = 'medium',
    auditType = 'full',
    includeEconomicAnalysis = true,
    includeFormalVerification = false,
    blockchain = 'ethereum',
    outputDir = 'security-audit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let totalFindings = [];

  ctx.log('info', `Starting Smart Contract Security Audit: ${projectName}`);
  ctx.log('info', `Audit Type: ${auditType}, Scope: ${contractPaths.join(', ')}`);

  // ============================================================================
  // PHASE 1: AUDIT SCOPING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Audit scoping and preparation');

  const auditPreparation = await ctx.task(auditPreparationTask, {
    projectName,
    contractPaths,
    auditScope,
    auditType,
    outputDir
  });

  artifacts.push(...auditPreparation.artifacts);

  // ============================================================================
  // PHASE 2: AUTOMATED STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running automated static analysis');

  const [slitherAnalysis, mythrilAnalysis, customDetectors] = await ctx.parallel.all([
    () => ctx.task(slitherAnalysisTask, {
      projectName,
      contractPaths,
      auditPreparation,
      outputDir
    }),
    () => ctx.task(mythrilAnalysisTask, {
      projectName,
      contractPaths,
      auditPreparation,
      outputDir
    }),
    () => ctx.task(customDetectorsTask, {
      projectName,
      contractPaths,
      auditPreparation,
      outputDir
    })
  ]);

  artifacts.push(
    ...slitherAnalysis.artifacts,
    ...mythrilAnalysis.artifacts,
    ...customDetectors.artifacts
  );

  totalFindings.push(
    ...slitherAnalysis.findings,
    ...mythrilAnalysis.findings,
    ...customDetectors.findings
  );

  // ============================================================================
  // PHASE 3: MANUAL CODE REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting manual code review');

  const manualReview = await ctx.task(manualCodeReviewTask, {
    projectName,
    auditPreparation,
    staticAnalysisResults: {
      slither: slitherAnalysis,
      mythril: mythrilAnalysis,
      custom: customDetectors
    },
    outputDir
  });

  artifacts.push(...manualReview.artifacts);
  totalFindings.push(...manualReview.findings);

  // Quality Gate: Critical Findings Review
  const criticalFindings = totalFindings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    await ctx.breakpoint({
      question: `Found ${criticalFindings.length} critical vulnerabilities. Review critical findings before proceeding?`,
      title: 'Critical Vulnerabilities Found',
      context: {
        runId: ctx.runId,
        projectName,
        criticalFindings: criticalFindings.map(f => ({
          title: f.title,
          description: f.description,
          location: f.location
        })),
        recommendation: 'Address all critical findings immediately',
        files: manualReview.artifacts.map(a => ({ path: a.path, format: 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: ACCESS CONTROL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing access control mechanisms');

  const accessControlAnalysis = await ctx.task(accessControlAnalysisTask, {
    projectName,
    auditPreparation,
    manualReview,
    outputDir
  });

  artifacts.push(...accessControlAnalysis.artifacts);
  totalFindings.push(...accessControlAnalysis.findings);

  // ============================================================================
  // PHASE 5: REENTRANCY AND STATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing reentrancy and state consistency');

  const reentrancyAnalysis = await ctx.task(reentrancyAnalysisTask, {
    projectName,
    auditPreparation,
    outputDir
  });

  artifacts.push(...reentrancyAnalysis.artifacts);
  totalFindings.push(...reentrancyAnalysis.findings);

  // ============================================================================
  // PHASE 6: ECONOMIC ATTACK ANALYSIS
  // ============================================================================

  if (includeEconomicAnalysis) {
    ctx.log('info', 'Phase 6: Analyzing economic attack vectors');

    const economicAnalysis = await ctx.task(economicAnalysisTask, {
      projectName,
      auditPreparation,
      blockchain,
      outputDir
    });

    artifacts.push(...economicAnalysis.artifacts);
    totalFindings.push(...economicAnalysis.findings);
  }

  // ============================================================================
  // PHASE 7: FORMAL VERIFICATION (if enabled)
  // ============================================================================

  if (includeFormalVerification) {
    ctx.log('info', 'Phase 7: Running formal verification');

    const formalVerification = await ctx.task(formalVerificationTask, {
      projectName,
      auditPreparation,
      outputDir
    });

    artifacts.push(...formalVerification.artifacts);
    totalFindings.push(...formalVerification.findings);
  }

  // ============================================================================
  // PHASE 8: FINDING CLASSIFICATION AND DEDUPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Classifying and deduplicating findings');

  const findingClassification = await ctx.task(findingClassificationTask, {
    projectName,
    findings: totalFindings,
    severityThreshold,
    outputDir
  });

  artifacts.push(...findingClassification.artifacts);

  // ============================================================================
  // PHASE 9: REMEDIATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating remediation recommendations');

  const remediationRecommendations = await ctx.task(remediationTask, {
    projectName,
    classifiedFindings: findingClassification.classifiedFindings,
    outputDir
  });

  artifacts.push(...remediationRecommendations.artifacts);

  // ============================================================================
  // PHASE 10: AUDIT REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive audit report');

  const auditReport = await ctx.task(auditReportTask, {
    projectName,
    auditPreparation,
    findingClassification,
    remediationRecommendations,
    auditType,
    outputDir
  });

  artifacts.push(...auditReport.artifacts);

  // Final Breakpoint: Audit Complete
  await ctx.breakpoint({
    question: `Security Audit Complete for ${projectName}. Total findings: ${findingClassification.totalFindings}. Critical: ${findingClassification.criticalCount}, High: ${findingClassification.highCount}. Risk Score: ${auditReport.riskScore}/100. Review and finalize audit report?`,
    title: 'Security Audit Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        auditType,
        totalFindings: findingClassification.totalFindings,
        critical: findingClassification.criticalCount,
        high: findingClassification.highCount,
        medium: findingClassification.mediumCount,
        low: findingClassification.lowCount,
        informational: findingClassification.informationalCount,
        riskScore: auditReport.riskScore
      },
      files: [
        { path: auditReport.reportPath, format: 'markdown', label: 'Audit Report' },
        { path: findingClassification.findingsPath, format: 'json', label: 'All Findings' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    auditReport: {
      reportPath: auditReport.reportPath,
      riskScore: auditReport.riskScore,
      summary: auditReport.executiveSummary
    },
    findings: findingClassification.classifiedFindings,
    statistics: {
      total: findingClassification.totalFindings,
      critical: findingClassification.criticalCount,
      high: findingClassification.highCount,
      medium: findingClassification.mediumCount,
      low: findingClassification.lowCount,
      informational: findingClassification.informationalCount
    },
    riskScore: auditReport.riskScore,
    recommendations: remediationRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/smart-contract-security-audit',
      timestamp: startTime,
      auditType,
      blockchain
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const auditPreparationTask = defineTask('audit-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Audit Preparation - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Smart Contract Security Auditor',
      task: 'Prepare audit scope and inventory contracts',
      context: args,
      instructions: [
        '1. Inventory all contracts in scope',
        '2. Calculate lines of code and complexity metrics',
        '3. Identify external dependencies and imports',
        '4. Map contract interactions and call graphs',
        '5. Identify privileged roles and admin functions',
        '6. Document entry points and attack surfaces',
        '7. Review previous audit reports if available',
        '8. Identify high-value targets (treasury, tokens)',
        '9. Create audit checklist based on scope',
        '10. Estimate audit timeline'
      ],
      outputFormat: 'JSON with audit preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['contractsInScope', 'totalLOC', 'artifacts'],
      properties: {
        contractsInScope: { type: 'array', items: { type: 'object' } },
        totalLOC: { type: 'number' },
        complexityScore: { type: 'number' },
        dependencies: { type: 'array', items: { type: 'string' } },
        attackSurfaces: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'audit', 'preparation']
}));

export const slitherAnalysisTask = defineTask('slither-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2a: Slither Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-002: slither-analysis)
    prompt: {
      role: 'Security Tool Operator',
      task: 'Run Slither static analysis',
      context: args,
      instructions: [
        '1. Configure Slither with appropriate detectors',
        '2. Run Slither on all contracts in scope',
        '3. Collect all detector findings',
        '4. Generate printer outputs (call-graph, inheritance)',
        '5. Analyze human-summary output',
        '6. Filter false positives based on context',
        '7. Classify findings by severity',
        '8. Document each finding with location',
        '9. Note any Slither errors or warnings',
        '10. Export findings to structured format'
      ],
      outputFormat: 'JSON with Slither analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'detectorsRun', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        detectorsRun: { type: 'array', items: { type: 'string' } },
        printerOutputs: { type: 'object' },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'slither', 'static-analysis']
}));

export const mythrilAnalysisTask = defineTask('mythril-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2b: Mythril Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-003: mythril-symbolic)
    prompt: {
      role: 'Security Tool Operator',
      task: 'Run Mythril symbolic execution analysis',
      context: args,
      instructions: [
        '1. Configure Mythril with transaction depth',
        '2. Run symbolic execution on contracts',
        '3. Analyze integer overflow/underflow',
        '4. Check for reentrancy vulnerabilities',
        '5. Detect unchecked external calls',
        '6. Find assertion failures',
        '7. Identify state variable manipulation',
        '8. Analyze self-destruct conditions',
        '9. Document findings with execution traces',
        '10. Export findings to structured format'
      ],
      outputFormat: 'JSON with Mythril analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'executionDepth', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        executionDepth: { type: 'number' },
        symbolicTraces: { type: 'array', items: { type: 'object' } },
        timeoutContracts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'mythril', 'symbolic-execution']
}));

export const customDetectorsTask = defineTask('custom-detectors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2c: Custom Detectors - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Security Researcher',
      task: 'Run custom vulnerability detectors',
      context: args,
      instructions: [
        '1. Check for timestamp dependence vulnerabilities',
        '2. Detect block.number manipulation risks',
        '3. Find weak randomness usage',
        '4. Check for denial of service vectors',
        '5. Detect signature malleability issues',
        '6. Find ERC standard compliance issues',
        '7. Check for flash loan attack vectors',
        '8. Detect frontrunning vulnerabilities',
        '9. Check for oracle manipulation risks',
        '10. Document custom findings'
      ],
      outputFormat: 'JSON with custom detector findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'detectorsRun', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        detectorsRun: { type: 'array', items: { type: 'string' } },
        customChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'custom-detectors']
}));

export const manualCodeReviewTask = defineTask('manual-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Manual Code Review - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Senior Security Auditor',
      task: 'Conduct thorough manual code review',
      context: args,
      instructions: [
        '1. Review each function line by line',
        '2. Verify logic correctness and edge cases',
        '3. Check for business logic vulnerabilities',
        '4. Verify input validation completeness',
        '5. Review error handling and reverts',
        '6. Check for proper event emissions',
        '7. Verify access control on all functions',
        '8. Review external call handling',
        '9. Check for gas optimization issues',
        '10. Document findings with code references'
      ],
      outputFormat: 'JSON with manual review findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'reviewedFunctions', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        reviewedFunctions: { type: 'number' },
        codeQualityNotes: { type: 'array', items: { type: 'string' } },
        bestPracticeViolations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'manual-review']
}));

export const accessControlAnalysisTask = defineTask('access-control-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Access Control Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Access Control Specialist',
      task: 'Analyze access control mechanisms',
      context: args,
      instructions: [
        '1. Map all privileged roles and permissions',
        '2. Verify role assignment mechanisms',
        '3. Check for missing access controls',
        '4. Identify centralization risks',
        '5. Review multi-sig requirements',
        '6. Check for privilege escalation paths',
        '7. Verify ownership transfer safety',
        '8. Review timelocks and delays',
        '9. Check emergency pause mechanisms',
        '10. Document access control findings'
      ],
      outputFormat: 'JSON with access control analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'roleMap', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        roleMap: { type: 'object' },
        centralizationRisks: { type: 'array', items: { type: 'object' } },
        missingControls: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'access-control']
}));

export const reentrancyAnalysisTask = defineTask('reentrancy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Reentrancy Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Reentrancy Security Specialist',
      task: 'Analyze reentrancy and state consistency',
      context: args,
      instructions: [
        '1. Identify all external calls',
        '2. Check Checks-Effects-Interactions pattern',
        '3. Verify reentrancy guards are in place',
        '4. Analyze cross-function reentrancy',
        '5. Check read-only reentrancy risks',
        '6. Verify state consistency after calls',
        '7. Check callback vulnerabilities',
        '8. Analyze token transfer callbacks (ERC-777)',
        '9. Review flash loan callback handlers',
        '10. Document reentrancy findings'
      ],
      outputFormat: 'JSON with reentrancy analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'externalCalls', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        externalCalls: { type: 'array', items: { type: 'object' } },
        protectedFunctions: { type: 'array', items: { type: 'string' } },
        unprotectedFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'reentrancy']
}));

export const economicAnalysisTask = defineTask('economic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Economic Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-020: chain-forensics)
    prompt: {
      role: 'DeFi Security Specialist',
      task: 'Analyze economic attack vectors',
      context: args,
      instructions: [
        '1. Analyze flash loan attack possibilities',
        '2. Check oracle manipulation vulnerabilities',
        '3. Review price calculation mechanisms',
        '4. Analyze sandwich attack vectors',
        '5. Check for arbitrage vulnerabilities',
        '6. Review liquidation mechanism safety',
        '7. Analyze governance attack vectors',
        '8. Check for MEV extraction risks',
        '9. Review tokenomics vulnerabilities',
        '10. Document economic attack findings'
      ],
      outputFormat: 'JSON with economic analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'attackVectors', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        attackVectors: { type: 'array', items: { type: 'object' } },
        oracleRisks: { type: 'array', items: { type: 'object' } },
        mevRisks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'economic-analysis', 'defi']
}));

export const formalVerificationTask = defineTask('formal-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Formal Verification - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer (uses SK-006: certora-prover)
    prompt: {
      role: 'Formal Verification Engineer',
      task: 'Formally verify critical properties',
      context: args,
      instructions: [
        '1. Identify critical invariants',
        '2. Write formal specifications',
        '3. Run Certora prover',
        '4. Analyze counterexamples',
        '5. Verify balance invariants',
        '6. Verify access control properties',
        '7. Verify state machine transitions',
        '8. Document verified properties',
        '9. Document unverified properties',
        '10. Generate verification report'
      ],
      outputFormat: 'JSON with formal verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'verifiedProperties', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        verifiedProperties: { type: 'array', items: { type: 'string' } },
        failedProperties: { type: 'array', items: { type: 'string' } },
        counterexamples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'formal-verification']
}));

export const findingClassificationTask = defineTask('finding-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Finding Classification - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Security Analyst',
      task: 'Classify and deduplicate findings',
      context: args,
      instructions: [
        '1. Deduplicate findings from different tools',
        '2. Classify by severity (Critical, High, Medium, Low, Info)',
        '3. Categorize by vulnerability type (SWC)',
        '4. Assess likelihood and impact',
        '5. Determine CVSS-like score',
        '6. Filter by severity threshold',
        '7. Group related findings',
        '8. Prioritize findings for remediation',
        '9. Add exploit complexity assessment',
        '10. Generate classified findings report'
      ],
      outputFormat: 'JSON with classified findings'
    },
    outputSchema: {
      type: 'object',
      required: ['classifiedFindings', 'totalFindings', 'findingsPath', 'artifacts'],
      properties: {
        classifiedFindings: { type: 'array', items: { type: 'object' } },
        totalFindings: { type: 'number' },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        mediumCount: { type: 'number' },
        lowCount: { type: 'number' },
        informationalCount: { type: 'number' },
        findingsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'classification']
}));

export const remediationTask = defineTask('remediation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Remediation Recommendations - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Security Consultant',
      task: 'Generate remediation recommendations',
      context: args,
      instructions: [
        '1. Create remediation for each finding',
        '2. Provide code fix suggestions',
        '3. Reference best practice patterns',
        '4. Estimate remediation effort',
        '5. Prioritize by risk and effort',
        '6. Suggest architectural changes if needed',
        '7. Provide testing recommendations',
        '8. Suggest monitoring improvements',
        '9. Reference security resources',
        '10. Create remediation roadmap'
      ],
      outputFormat: 'JSON with remediation recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'remediationRoadmap', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        remediationRoadmap: { type: 'object' },
        totalEffortEstimate: { type: 'string' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'remediation']
}));

export const auditReportTask = defineTask('audit-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Audit Report - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Audit Report Writer',
      task: 'Generate comprehensive audit report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document audit scope and methodology',
        '3. Include all findings with details',
        '4. Add code snippets for findings',
        '5. Include remediation recommendations',
        '6. Calculate overall risk score',
        '7. Add disclaimer and limitations',
        '8. Include auditor information',
        '9. Format report professionally',
        '10. Generate PDF-ready markdown'
      ],
      outputFormat: 'JSON with audit report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'riskScore', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        riskScore: { type: 'number' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'string' },
        scope: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'security', 'audit-report']
}));
