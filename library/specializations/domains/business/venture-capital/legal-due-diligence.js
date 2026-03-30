/**
 * @process venture-capital/legal-due-diligence
 * @description Review of corporate structure, cap table accuracy, material contracts, intellectual property ownership, litigation history, and regulatory compliance status
 * @inputs { companyName: string, corporateDocuments: object, contracts: array, ipDocuments: object }
 * @outputs { success: boolean, corporateReview: object, capTableAnalysis: object, contractsReview: object, complianceStatus: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    corporateDocuments = {},
    contracts = [],
    ipDocuments = {},
    outputDir = 'legal-dd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Corporate Structure Review
  ctx.log('info', 'Reviewing corporate structure');
  const corporateReview = await ctx.task(corporateStructureTask, {
    companyName,
    corporateDocuments,
    outputDir
  });

  if (!corporateReview.success) {
    return {
      success: false,
      error: 'Corporate structure review failed',
      details: corporateReview,
      metadata: { processId: 'venture-capital/legal-due-diligence', timestamp: startTime }
    };
  }

  artifacts.push(...corporateReview.artifacts);

  // Task 2: Cap Table Analysis
  ctx.log('info', 'Analyzing cap table');
  const capTableAnalysis = await ctx.task(capTableAnalysisTask, {
    companyName,
    corporateDocuments,
    outputDir
  });

  artifacts.push(...capTableAnalysis.artifacts);

  // Task 3: Material Contracts Review
  ctx.log('info', 'Reviewing material contracts');
  const contractsReview = await ctx.task(materialContractsTask, {
    companyName,
    contracts,
    outputDir
  });

  artifacts.push(...contractsReview.artifacts);

  // Task 4: IP Ownership Analysis
  ctx.log('info', 'Analyzing IP ownership');
  const ipOwnership = await ctx.task(ipOwnershipTask, {
    companyName,
    ipDocuments,
    corporateDocuments,
    outputDir
  });

  artifacts.push(...ipOwnership.artifacts);

  // Task 5: Litigation and Disputes Review
  ctx.log('info', 'Reviewing litigation history');
  const litigationReview = await ctx.task(litigationReviewTask, {
    companyName,
    outputDir
  });

  artifacts.push(...litigationReview.artifacts);

  // Task 6: Regulatory Compliance Assessment
  ctx.log('info', 'Assessing regulatory compliance');
  const complianceAssessment = await ctx.task(regulatoryComplianceTask, {
    companyName,
    corporateDocuments,
    contracts,
    outputDir
  });

  artifacts.push(...complianceAssessment.artifacts);

  // Task 7: Employment and HR Review
  ctx.log('info', 'Reviewing employment matters');
  const employmentReview = await ctx.task(employmentReviewTask, {
    companyName,
    corporateDocuments,
    outputDir
  });

  artifacts.push(...employmentReview.artifacts);

  // Breakpoint: Review legal DD findings
  await ctx.breakpoint({
    question: `Legal DD complete for ${companyName}. Cap table clean: ${capTableAnalysis.isClean}. Material issues: ${corporateReview.materialIssues.length}. Review findings?`,
    title: 'Legal Due Diligence Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        corporateStructure: corporateReview.structureType,
        capTableClean: capTableAnalysis.isClean,
        materialContracts: contractsReview.contractCount,
        ipIssues: ipOwnership.issues.length,
        pendingLitigation: litigationReview.pendingMatters.length,
        complianceStatus: complianceAssessment.status
      }
    }
  });

  // Task 8: Generate Legal DD Report
  ctx.log('info', 'Generating legal due diligence report');
  const ddReport = await ctx.task(legalDDReportTask, {
    companyName,
    corporateReview,
    capTableAnalysis,
    contractsReview,
    ipOwnership,
    litigationReview,
    complianceAssessment,
    employmentReview,
    outputDir
  });

  artifacts.push(...ddReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    corporateReview: {
      structureType: corporateReview.structureType,
      jurisdiction: corporateReview.jurisdiction,
      subsidiaries: corporateReview.subsidiaries,
      materialIssues: corporateReview.materialIssues
    },
    capTableAnalysis: {
      isClean: capTableAnalysis.isClean,
      totalShares: capTableAnalysis.totalShares,
      optionPool: capTableAnalysis.optionPool,
      convertibles: capTableAnalysis.convertibles,
      issues: capTableAnalysis.issues
    },
    contractsReview: {
      contractCount: contractsReview.contractCount,
      keyContracts: contractsReview.keyContracts,
      changeOfControl: contractsReview.changeOfControlProvisions,
      risks: contractsReview.risks
    },
    ipOwnership: {
      status: ipOwnership.status,
      assignments: ipOwnership.assignments,
      issues: ipOwnership.issues
    },
    litigation: {
      pendingMatters: litigationReview.pendingMatters,
      threatLevel: litigationReview.threatLevel,
      reserves: litigationReview.reserveRecommendation
    },
    complianceStatus: {
      status: complianceAssessment.status,
      permits: complianceAssessment.permits,
      issues: complianceAssessment.issues
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/legal-due-diligence',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Corporate Structure Review
export const corporateStructureTask = defineTask('corporate-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review corporate structure',
  agent: {
    name: 'corporate-attorney',
    prompt: {
      role: 'corporate attorney',
      task: 'Review corporate structure and formation documents',
      context: args,
      instructions: [
        'Review certificate of incorporation and amendments',
        'Analyze bylaws and governance documents',
        'Review board and stockholder resolutions',
        'Identify all subsidiaries and affiliates',
        'Review foreign qualifications',
        'Assess corporate governance practices',
        'Identify any structural issues or irregularities',
        'Document material corporate matters'
      ],
      outputFormat: 'JSON with corporate review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'structureType', 'materialIssues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        structureType: { type: 'string' },
        jurisdiction: { type: 'string' },
        subsidiaries: { type: 'array' },
        governance: { type: 'object' },
        materialIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'legal', 'corporate']
}));

// Task 2: Cap Table Analysis
export const capTableAnalysisTask = defineTask('cap-table-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cap table',
  agent: {
    name: 'cap-table-analyst',
    prompt: {
      role: 'cap table specialist',
      task: 'Analyze cap table accuracy and structure',
      context: args,
      instructions: [
        'Reconcile cap table to stock ledger',
        'Verify all equity issuances and transfers',
        'Review option grants and exercises',
        'Analyze convertible instruments (SAFEs, notes)',
        'Verify option pool size and availability',
        'Review 409A valuations',
        'Identify any missing documentation',
        'Calculate fully diluted ownership'
      ],
      outputFormat: 'JSON with cap table analysis, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isClean', 'totalShares', 'issues', 'artifacts'],
      properties: {
        isClean: { type: 'boolean' },
        totalShares: { type: 'number' },
        optionPool: { type: 'object' },
        convertibles: { type: 'array' },
        ownership: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'equity']
}));

// Task 3: Material Contracts Review
export const materialContractsTask = defineTask('material-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review material contracts',
  agent: {
    name: 'contracts-attorney',
    prompt: {
      role: 'contracts attorney',
      task: 'Review material contracts and agreements',
      context: args,
      instructions: [
        'Identify all material contracts',
        'Review customer contracts and terms',
        'Analyze vendor and supplier agreements',
        'Review partnership and JV agreements',
        'Identify change of control provisions',
        'Review termination and renewal terms',
        'Assess assignment restrictions',
        'Flag high-risk contract terms'
      ],
      outputFormat: 'JSON with contracts review, risks, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contractCount', 'keyContracts', 'risks', 'artifacts'],
      properties: {
        contractCount: { type: 'number' },
        keyContracts: { type: 'array' },
        changeOfControlProvisions: { type: 'array' },
        terminationRisks: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'contracts', 'legal']
}));

// Task 4: IP Ownership Analysis
export const ipOwnershipTask = defineTask('ip-ownership', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze IP ownership',
  agent: {
    name: 'ip-attorney',
    prompt: {
      role: 'intellectual property attorney',
      task: 'Verify IP ownership and assignments',
      context: args,
      instructions: [
        'Review founder and employee IP assignments',
        'Verify contractor IP assignment agreements',
        'Check for prior employer IP issues',
        'Review open source usage and compliance',
        'Verify patent and trademark ownership',
        'Assess third-party IP licenses',
        'Identify any IP ownership gaps',
        'Review IP-related representations'
      ],
      outputFormat: 'JSON with IP ownership status, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'assignments', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['clean', 'issues', 'critical'] },
        assignments: { type: 'object' },
        openSource: { type: 'object' },
        licenses: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ip', 'ownership']
}));

// Task 5: Litigation Review
export const litigationReviewTask = defineTask('litigation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review litigation history',
  agent: {
    name: 'litigation-analyst',
    prompt: {
      role: 'litigation analyst',
      task: 'Review litigation history and pending disputes',
      context: args,
      instructions: [
        'Search for pending litigation',
        'Review historical litigation matters',
        'Assess threatened claims and disputes',
        'Review regulatory investigations',
        'Analyze arbitration and mediation matters',
        'Assess litigation reserves adequacy',
        'Identify potential future claims',
        'Rate overall litigation risk'
      ],
      outputFormat: 'JSON with litigation review, threat level, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pendingMatters', 'threatLevel', 'artifacts'],
      properties: {
        pendingMatters: { type: 'array' },
        historicalMatters: { type: 'array' },
        threatLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        reserveRecommendation: { type: 'number' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'litigation', 'disputes']
}));

// Task 6: Regulatory Compliance Assessment
export const regulatoryComplianceTask = defineTask('regulatory-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess regulatory compliance',
  agent: {
    name: 'compliance-analyst',
    prompt: {
      role: 'regulatory compliance specialist',
      task: 'Assess regulatory compliance status',
      context: args,
      instructions: [
        'Identify applicable regulatory frameworks',
        'Review licenses and permits',
        'Assess data privacy compliance (GDPR, CCPA)',
        'Review industry-specific regulations',
        'Assess securities law compliance',
        'Review export control compliance',
        'Identify compliance gaps',
        'Recommend remediation steps'
      ],
      outputFormat: 'JSON with compliance status, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'permits', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['compliant', 'minor-issues', 'material-issues'] },
        permits: { type: 'array' },
        frameworks: { type: 'array' },
        issues: { type: 'array' },
        remediation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'compliance', 'regulatory']
}));

// Task 7: Employment Review
export const employmentReviewTask = defineTask('employment-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review employment matters',
  agent: {
    name: 'employment-analyst',
    prompt: {
      role: 'employment law specialist',
      task: 'Review employment and HR matters',
      context: args,
      instructions: [
        'Review employee agreements',
        'Assess contractor classifications',
        'Review equity compensation plans',
        'Analyze employment policies',
        'Review international employment',
        'Assess non-compete and non-solicit agreements',
        'Review key employee retention',
        'Identify HR compliance issues'
      ],
      outputFormat: 'JSON with employment review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['employeeCount', 'classifications', 'issues', 'artifacts'],
      properties: {
        employeeCount: { type: 'number' },
        classifications: { type: 'object' },
        equityPlans: { type: 'object' },
        keyEmployees: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'employment', 'hr']
}));

// Task 8: Legal DD Report Generation
export const legalDDReportTask = defineTask('legal-dd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate legal DD report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC legal analyst',
      task: 'Generate comprehensive legal due diligence report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present corporate structure review',
        'Document cap table analysis',
        'Include material contracts review',
        'Present IP ownership analysis',
        'Document litigation review',
        'Include compliance assessment',
        'Present employment review',
        'Format as investment committee ready document'
      ],
      outputFormat: 'JSON with report path, key findings, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'legal-dd', 'reporting']
}));
