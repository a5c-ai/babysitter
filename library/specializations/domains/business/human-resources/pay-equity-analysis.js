/**
 * @process pay-equity-analysis
 * @description Systematic process for conducting pay equity analysis to identify and remediate
 * compensation disparities based on protected characteristics, ensuring legal compliance and
 * fair pay practices.
 * @inputs {
 *   organizationContext: { industry, size, locations, regulatoryEnvironment },
 *   analysisScope: { populations, protectedClasses, payComponents },
 *   dataRequirements: { employeeData, compensationData, jobData },
 *   methodology: { statisticalApproach, controlFactors, materiality },
 *   stakeholders: { legal, hrLeadership, compensation, diversity }
 * }
 * @outputs {
 *   analysisResults: { statisticalFindings, gapIdentification, riskAssessment },
 *   remediationPlan: { adjustments, prioritization, budget },
 *   documentation: { methodology, findings, recommendations },
 *   monitoringFramework: { metrics, reporting, governance }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'financial-services', size: 10000 },
 *   analysisScope: { protectedClasses: ['gender', 'race', 'ethnicity', 'age'] },
 *   methodology: { statisticalApproach: 'multiple-regression', materiality: 0.05 }
 * });
 * @references
 * - Equal Pay Act Compliance
 * - Title VII Statistical Analysis Guidelines
 * - OFCCP Pay Equity Requirements
 * - EU Pay Transparency Directive
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, analysisScope, dataRequirements, methodology, stakeholders } = inputs;

  // Phase 1: Legal and Regulatory Assessment
  const regulatoryAssessment = await ctx.task('assess-regulatory-requirements', {
    organizationContext,
    assessmentAreas: [
      'applicable federal and state pay equity laws',
      'industry-specific requirements',
      'reporting obligations (UK, EU, state mandates)',
      'privilege considerations and documentation',
      'regulatory enforcement trends'
    ]
  });

  // Phase 2: Analysis Framework Design
  const frameworkDesign = await ctx.task('design-analysis-framework', {
    regulatoryAssessment,
    methodology,
    analysisScope,
    frameworkElements: [
      'statistical methodology selection',
      'control factor identification',
      'similarly situated employee groupings',
      'pay component definitions',
      'materiality thresholds'
    ]
  });

  // Phase 3: Data Collection and Preparation
  const dataPreparation = await ctx.task('prepare-analysis-data', {
    dataRequirements,
    frameworkDesign,
    preparationElements: [
      'employee demographic data extraction',
      'compensation data compilation',
      'job and level data alignment',
      'data quality validation',
      'missing data treatment'
    ]
  });

  // Phase 4: Framework Approval
  await ctx.breakpoint('framework-approval', {
    title: 'Pay Equity Analysis Framework Approval',
    description: 'Review and approve analysis methodology and data approach',
    artifacts: {
      regulatoryAssessment,
      frameworkDesign,
      dataPreparation
    },
    questions: [
      'Is the statistical methodology appropriate and defensible?',
      'Are all relevant control factors included?',
      'Is the data quality sufficient for analysis?'
    ]
  });

  // Phase 5: Similarly Situated Group Analysis
  const groupAnalysis = await ctx.task('analyze-similarly-situated-groups', {
    dataPreparation,
    frameworkDesign,
    analysisElements: [
      'job family and function groupings',
      'level and grade cohorts',
      'geographic groupings',
      'business unit considerations',
      'group size and statistical validity'
    ]
  });

  // Phase 6: Statistical Analysis Execution
  const statisticalAnalysis = await ctx.task('execute-statistical-analysis', {
    groupAnalysis,
    methodology,
    analysisElements: [
      'regression model development',
      'coefficient significance testing',
      'unexplained variance calculation',
      'cohort-level analysis',
      'intersection analysis (multiple characteristics)'
    ]
  });

  // Phase 7: Gap Identification and Assessment
  const gapAssessment = await ctx.task('identify-and-assess-gaps', {
    statisticalAnalysis,
    frameworkDesign,
    assessmentElements: [
      'statistically significant gaps identification',
      'gap magnitude and direction',
      'individual outlier identification',
      'root cause analysis',
      'business justification review'
    ]
  });

  // Phase 8: Risk Assessment
  const riskAssessment = await ctx.task('assess-legal-and-business-risk', {
    gapAssessment,
    regulatoryAssessment,
    riskElements: [
      'litigation risk evaluation',
      'regulatory enforcement risk',
      'reputational risk assessment',
      'employee relations impact',
      'business continuity considerations'
    ]
  });

  // Phase 9: Findings Review
  await ctx.breakpoint('findings-review', {
    title: 'Pay Equity Findings Review',
    description: 'Review statistical findings and risk assessment with stakeholders',
    artifacts: {
      statisticalAnalysis,
      gapAssessment,
      riskAssessment
    },
    questions: [
      'Are the findings statistically and practically significant?',
      'What is the acceptable risk tolerance?',
      'What remediation approach should be taken?'
    ]
  });

  // Phase 10: Remediation Strategy Development
  const remediationStrategy = await ctx.task('develop-remediation-strategy', {
    gapAssessment,
    riskAssessment,
    strategyElements: [
      'individual adjustment calculations',
      'prioritization framework',
      'budget impact modeling',
      'implementation timeline options',
      'communication strategy'
    ]
  });

  // Phase 11: Remediation Plan Approval
  await ctx.breakpoint('remediation-approval', {
    title: 'Remediation Plan Approval',
    description: 'Review and approve pay equity remediation plan',
    artifacts: {
      remediationStrategy
    },
    questions: [
      'Is the remediation budget approved?',
      'Is the implementation timeline acceptable?',
      'What communication approach should be used?'
    ]
  });

  // Phase 12: Ongoing Monitoring Framework
  const monitoringFramework = await ctx.task('establish-monitoring-framework', {
    frameworkDesign,
    remediationStrategy,
    monitoringElements: [
      'regular analysis cadence',
      'trigger-based reviews',
      'dashboard and reporting',
      'governance structure',
      'continuous improvement process'
    ]
  });

  // Phase 13: Documentation and Compliance
  const documentation = await ctx.task('create-compliance-documentation', {
    frameworkDesign,
    statisticalAnalysis,
    gapAssessment,
    remediationStrategy,
    documentationElements: [
      'methodology documentation',
      'analysis findings report',
      'remediation action log',
      'privilege protection protocols',
      'audit trail maintenance'
    ]
  });

  return {
    analysisResults: {
      framework: frameworkDesign,
      statisticalFindings: statisticalAnalysis,
      gaps: gapAssessment,
      riskAssessment
    },
    remediationPlan: remediationStrategy,
    monitoringFramework,
    documentation,
    metrics: {
      populationAnalyzed: analysisScope.populations,
      gapsIdentified: gapAssessment.gapCount,
      remediationBudget: remediationStrategy.totalBudget,
      riskLevel: riskAssessment.overallRisk
    }
  };
}

export const assessRegulatoryRequirements = defineTask('assess-regulatory-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Regulatory Requirements',
  agent: {
    name: 'employment-law-specialist',
    prompt: {
      role: 'Pay Equity Legal Expert',
      task: 'Assess pay equity regulatory requirements and obligations',
      context: args,
      instructions: [
        'Identify applicable federal and state pay equity laws',
        'Review industry-specific requirements',
        'Document reporting obligations',
        'Establish privilege protection protocols',
        'Analyze regulatory enforcement trends'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        applicableLaws: { type: 'array' },
        reportingObligations: { type: 'array' },
        privilegeProtocols: { type: 'object' },
        enforcementTrends: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['applicableLaws', 'reportingObligations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designAnalysisFramework = defineTask('design-analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Analysis Framework',
  agent: {
    name: 'pay-equity-analyst',
    prompt: {
      role: 'Pay Equity Methodology Expert',
      task: 'Design comprehensive pay equity analysis framework',
      context: args,
      instructions: [
        'Select appropriate statistical methodology',
        'Identify legitimate control factors',
        'Define similarly situated employee groupings',
        'Specify pay component definitions',
        'Establish materiality thresholds'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        methodology: { type: 'object' },
        controlFactors: { type: 'array' },
        groupings: { type: 'object' },
        payComponents: { type: 'array' },
        materialityThresholds: { type: 'object' }
      },
      required: ['methodology', 'controlFactors', 'groupings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareAnalysisData = defineTask('prepare-analysis-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Analysis Data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Pay Equity Data Specialist',
      task: 'Prepare and validate data for pay equity analysis',
      context: args,
      instructions: [
        'Extract employee demographic data',
        'Compile comprehensive compensation data',
        'Align job and level data',
        'Validate data quality',
        'Establish missing data treatment rules'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        demographicData: { type: 'object' },
        compensationData: { type: 'object' },
        jobData: { type: 'object' },
        dataQuality: { type: 'object' },
        missingDataTreatment: { type: 'object' }
      },
      required: ['demographicData', 'compensationData', 'dataQuality']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeSimilarlySituatedGroups = defineTask('analyze-similarly-situated-groups', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Similarly Situated Groups',
  agent: {
    name: 'pay-equity-analyst',
    prompt: {
      role: 'Cohort Analysis Specialist',
      task: 'Define and analyze similarly situated employee groups',
      context: args,
      instructions: [
        'Create job family and function groupings',
        'Establish level and grade cohorts',
        'Apply geographic groupings',
        'Consider business unit factors',
        'Validate group size for statistical validity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        jobFamilyGroups: { type: 'array' },
        levelCohorts: { type: 'array' },
        geographicGroups: { type: 'array' },
        groupValidation: { type: 'object' },
        finalGroupings: { type: 'array' }
      },
      required: ['finalGroupings', 'groupValidation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeStatisticalAnalysis = defineTask('execute-statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Statistical Analysis',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'Statistical Analysis Expert',
      task: 'Execute comprehensive statistical pay equity analysis',
      context: args,
      instructions: [
        'Develop and run regression models',
        'Test coefficient significance',
        'Calculate unexplained variance',
        'Perform cohort-level analysis',
        'Conduct intersection analysis for multiple characteristics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        regressionResults: { type: 'object' },
        significanceTests: { type: 'object' },
        unexplainedVariance: { type: 'object' },
        cohortAnalysis: { type: 'array' },
        intersectionAnalysis: { type: 'object' }
      },
      required: ['regressionResults', 'unexplainedVariance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyAndAssessGaps = defineTask('identify-and-assess-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and Assess Gaps',
  agent: {
    name: 'pay-equity-specialist',
    prompt: {
      role: 'Pay Gap Assessment Expert',
      task: 'Identify and assess pay equity gaps',
      context: args,
      instructions: [
        'Identify statistically significant gaps',
        'Quantify gap magnitude and direction',
        'Identify individual outliers',
        'Conduct root cause analysis',
        'Review potential business justifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        significantGaps: { type: 'array' },
        gapMagnitudes: { type: 'object' },
        outliers: { type: 'array' },
        rootCauses: { type: 'array' },
        justificationReview: { type: 'object' },
        gapCount: { type: 'number' }
      },
      required: ['significantGaps', 'gapMagnitudes', 'gapCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessLegalAndBusinessRisk = defineTask('assess-legal-and-business-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Legal and Business Risk',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Pay Equity Risk Assessor',
      task: 'Assess legal and business risks from pay equity gaps',
      context: args,
      instructions: [
        'Evaluate litigation risk',
        'Assess regulatory enforcement risk',
        'Evaluate reputational risk',
        'Consider employee relations impact',
        'Review business continuity considerations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        litigationRisk: { type: 'object' },
        regulatoryRisk: { type: 'object' },
        reputationalRisk: { type: 'object' },
        employeeRelationsImpact: { type: 'object' },
        overallRisk: { type: 'string' },
        mitigationOptions: { type: 'array' }
      },
      required: ['litigationRisk', 'overallRisk']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developRemediationStrategy = defineTask('develop-remediation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Remediation Strategy',
  agent: {
    name: 'compensation-strategist',
    prompt: {
      role: 'Pay Equity Remediation Strategist',
      task: 'Develop comprehensive remediation strategy',
      context: args,
      instructions: [
        'Calculate individual adjustment amounts',
        'Develop prioritization framework',
        'Model budget impact scenarios',
        'Create implementation timeline options',
        'Design communication strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        individualAdjustments: { type: 'array' },
        prioritization: { type: 'object' },
        budgetImpact: { type: 'object' },
        timeline: { type: 'array' },
        communicationStrategy: { type: 'object' },
        totalBudget: { type: 'number' }
      },
      required: ['individualAdjustments', 'budgetImpact', 'totalBudget']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const establishMonitoringFramework = defineTask('establish-monitoring-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Monitoring Framework',
  agent: {
    name: 'hr-governance-specialist',
    prompt: {
      role: 'Pay Equity Monitoring Expert',
      task: 'Establish ongoing pay equity monitoring framework',
      context: args,
      instructions: [
        'Define regular analysis cadence',
        'Establish trigger-based review criteria',
        'Design dashboard and reporting',
        'Create governance structure',
        'Implement continuous improvement process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysisCadence: { type: 'object' },
        triggerCriteria: { type: 'array' },
        dashboardDesign: { type: 'object' },
        governance: { type: 'object' },
        improvementProcess: { type: 'object' }
      },
      required: ['analysisCadence', 'governance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createComplianceDocumentation = defineTask('create-compliance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Compliance Documentation',
  agent: {
    name: 'compliance-documentation-specialist',
    prompt: {
      role: 'Pay Equity Documentation Expert',
      task: 'Create comprehensive compliance documentation',
      context: args,
      instructions: [
        'Document methodology in detail',
        'Compile analysis findings report',
        'Create remediation action log',
        'Establish privilege protection protocols',
        'Maintain audit trail'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        methodologyDoc: { type: 'object' },
        findingsReport: { type: 'object' },
        remediationLog: { type: 'array' },
        privilegeProtocols: { type: 'object' },
        auditTrail: { type: 'object' }
      },
      required: ['methodologyDoc', 'findingsReport']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
