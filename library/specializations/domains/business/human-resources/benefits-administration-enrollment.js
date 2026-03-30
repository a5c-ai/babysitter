/**
 * @process benefits-administration-enrollment
 * @description Comprehensive process for designing, administering, and managing employee benefits
 * programs including open enrollment cycles, vendor management, compliance, and employee communication.
 * @inputs {
 *   organizationContext: { industry, size, demographics, locations },
 *   benefitsScope: { healthPlans, retirement, wellness, voluntary },
 *   enrollmentCycle: { type, timeline, eligibilityRules },
 *   vendors: { carriers, administrators, brokers },
 *   compliance: { regulations, auditRequirements }
 * }
 * @outputs {
 *   benefitsPlan: { planDesign, costs, contributions },
 *   enrollmentResults: { participation, elections, analytics },
 *   adminProcesses: { procedures, workflows, integrations },
 *   documentation: { planDocuments, communications, compliance }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'healthcare', size: 5000, locations: ['US', 'Canada'] },
 *   benefitsScope: { healthPlans: ['PPO', 'HDHP', 'HMO'], retirement: ['401k', 'pension'] },
 *   enrollmentCycle: { type: 'annual', timeline: 'Q4' }
 * });
 * @references
 * - SHRM Benefits Administration Best Practices
 * - ERISA Compliance Guidelines
 * - ACA Employer Requirements
 * - IRS Benefits Taxation Rules
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, benefitsScope, enrollmentCycle, vendors, compliance } = inputs;

  // Phase 1: Benefits Strategy Assessment
  const strategyAssessment = await ctx.task('assess-benefits-strategy', {
    organizationContext,
    benefitsScope,
    assessmentAreas: [
      'current benefits offerings analysis',
      'employee demographics and needs',
      'competitive market positioning',
      'cost trends and sustainability',
      'regulatory compliance status'
    ]
  });

  // Phase 2: Plan Design and Renewal
  const planDesign = await ctx.task('design-benefits-plans', {
    strategyAssessment,
    benefitsScope,
    designElements: [
      'health plan options and tiers',
      'retirement plan features',
      'wellness program components',
      'voluntary benefits selection',
      'cost sharing strategies'
    ]
  });

  // Phase 3: Vendor Evaluation and Selection
  const vendorEvaluation = await ctx.task('evaluate-vendors', {
    planDesign,
    vendors,
    evaluationCriteria: [
      'carrier and TPA capabilities',
      'network coverage and quality',
      'administrative efficiency',
      'technology and integration',
      'pricing and value analysis'
    ]
  });

  // Phase 4: Plan Design Approval
  await ctx.breakpoint('plan-design-approval', {
    title: 'Benefits Plan Design Approval',
    description: 'Review and approve benefits plan design and vendor selections',
    artifacts: {
      strategyAssessment,
      planDesign,
      vendorEvaluation
    },
    questions: [
      'Does the plan design meet employee needs and budget constraints?',
      'Are the vendor selections optimal for our requirements?',
      'Is the cost sharing strategy appropriate?'
    ]
  });

  // Phase 5: Contribution Strategy Development
  const contributionStrategy = await ctx.task('develop-contribution-strategy', {
    planDesign,
    organizationContext,
    strategyElements: [
      'employer contribution levels',
      'employee premium tiers',
      'dependent contribution calculations',
      'affordability testing (ACA)',
      'wellness incentive integration'
    ]
  });

  // Phase 6: Enrollment System Configuration
  const systemConfiguration = await ctx.task('configure-enrollment-system', {
    planDesign,
    contributionStrategy,
    enrollmentCycle,
    configurationElements: [
      'benefit plan setup in HRIS/benefits platform',
      'eligibility rules programming',
      'contribution deduction setup',
      'carrier feed configurations',
      'employee self-service portal'
    ]
  });

  // Phase 7: Communication Strategy Development
  const communicationStrategy = await ctx.task('develop-communication-strategy', {
    planDesign,
    enrollmentCycle,
    organizationContext,
    communicationElements: [
      'enrollment guide and materials',
      'benefits decision support tools',
      'multi-channel communication plan',
      'benefits fair and webinar planning',
      'manager toolkit development'
    ]
  });

  // Phase 8: Open Enrollment Execution
  const enrollmentExecution = await ctx.task('execute-open-enrollment', {
    systemConfiguration,
    communicationStrategy,
    enrollmentCycle,
    executionElements: [
      'enrollment window management',
      'employee support and assistance',
      'election tracking and reminders',
      'exception handling process',
      'real-time analytics monitoring'
    ]
  });

  // Phase 9: Enrollment Results Analysis
  const enrollmentResults = await ctx.task('analyze-enrollment-results', {
    enrollmentExecution,
    planDesign,
    analysisElements: [
      'participation rates by plan',
      'election change analysis',
      'demographic enrollment patterns',
      'cost impact assessment',
      'employee feedback compilation'
    ]
  });

  // Phase 10: Results Review
  await ctx.breakpoint('enrollment-results-review', {
    title: 'Enrollment Results Review',
    description: 'Review open enrollment outcomes and identify improvements',
    artifacts: {
      enrollmentExecution,
      enrollmentResults
    },
    questions: [
      'Did enrollment meet participation targets?',
      'Are cost projections in line with expectations?',
      'What improvements should be made for next cycle?'
    ]
  });

  // Phase 11: Post-Enrollment Administration
  const postEnrollmentAdmin = await ctx.task('manage-post-enrollment', {
    enrollmentResults,
    systemConfiguration,
    adminElements: [
      'carrier file transmission and reconciliation',
      'new hire and life event processing',
      'benefit deduction auditing',
      'employee inquiry management',
      'coverage verification'
    ]
  });

  // Phase 12: Compliance and Reporting
  const complianceReporting = await ctx.task('ensure-compliance-reporting', {
    enrollmentResults,
    compliance,
    reportingElements: [
      'ACA reporting (1094-C, 1095-C)',
      'ERISA compliance documentation',
      '5500 filing preparation',
      'non-discrimination testing',
      'audit documentation'
    ]
  });

  // Phase 13: Ongoing Administration Documentation
  const documentation = await ctx.task('create-admin-documentation', {
    planDesign,
    systemConfiguration,
    postEnrollmentAdmin,
    complianceReporting,
    documentationElements: [
      'plan documents and SPDs',
      'administrative procedures manual',
      'vendor contact and escalation guide',
      'annual benefits calendar',
      'process improvement recommendations'
    ]
  });

  return {
    benefitsPlan: {
      design: planDesign,
      contributions: contributionStrategy,
      vendors: vendorEvaluation
    },
    enrollmentResults: {
      execution: enrollmentExecution,
      analytics: enrollmentResults
    },
    administration: {
      processes: postEnrollmentAdmin,
      compliance: complianceReporting
    },
    documentation,
    metrics: {
      participationRate: enrollmentResults.overallParticipation,
      costVariance: enrollmentResults.costImpact,
      employeeSatisfaction: enrollmentResults.satisfactionScore
    }
  };
}

export const assessBenefitsStrategy = defineTask('assess-benefits-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Benefits Strategy',
  agent: {
    name: 'benefits-strategist',
    prompt: {
      role: 'Benefits Strategy Analyst',
      task: 'Assess current benefits strategy and identify opportunities',
      context: args,
      instructions: [
        'Analyze current benefits offerings comprehensively',
        'Assess employee demographics and needs',
        'Evaluate competitive market positioning',
        'Review cost trends and sustainability',
        'Verify regulatory compliance status'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        currentOfferings: { type: 'object' },
        demographicNeeds: { type: 'object' },
        marketPosition: { type: 'object' },
        costTrends: { type: 'object' },
        complianceStatus: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['currentOfferings', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designBenefitsPlans = defineTask('design-benefits-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Benefits Plans',
  agent: {
    name: 'benefits-designer',
    prompt: {
      role: 'Benefits Plan Designer',
      task: 'Design comprehensive benefits plan portfolio',
      context: args,
      instructions: [
        'Design health plan options and tiers',
        'Structure retirement plan features',
        'Develop wellness program components',
        'Select voluntary benefits offerings',
        'Create cost sharing strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        healthPlans: { type: 'array' },
        retirementPlans: { type: 'array' },
        wellnessProgram: { type: 'object' },
        voluntaryBenefits: { type: 'array' },
        costSharing: { type: 'object' }
      },
      required: ['healthPlans', 'retirementPlans']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const evaluateVendors = defineTask('evaluate-vendors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Vendors',
  agent: {
    name: 'vendor-analyst',
    prompt: {
      role: 'Benefits Vendor Analyst',
      task: 'Evaluate and select benefits vendors',
      context: args,
      instructions: [
        'Assess carrier and TPA capabilities',
        'Evaluate network coverage and quality',
        'Review administrative efficiency',
        'Analyze technology and integration options',
        'Conduct pricing and value analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        vendorEvaluations: { type: 'array' },
        recommendations: { type: 'array' },
        networkAnalysis: { type: 'object' },
        pricingComparison: { type: 'object' },
        selectionRationale: { type: 'object' }
      },
      required: ['vendorEvaluations', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developContributionStrategy = defineTask('develop-contribution-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Contribution Strategy',
  agent: {
    name: 'compensation-analyst',
    prompt: {
      role: 'Benefits Contribution Strategist',
      task: 'Develop employee/employer contribution strategy',
      context: args,
      instructions: [
        'Calculate employer contribution levels',
        'Design employee premium tiers',
        'Develop dependent contribution calculations',
        'Conduct ACA affordability testing',
        'Integrate wellness incentives'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        employerContributions: { type: 'object' },
        employeeTiers: { type: 'array' },
        dependentContributions: { type: 'object' },
        affordabilityTest: { type: 'object' },
        wellnessIncentives: { type: 'object' }
      },
      required: ['employerContributions', 'employeeTiers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const configureEnrollmentSystem = defineTask('configure-enrollment-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Enrollment System',
  agent: {
    name: 'hris-specialist',
    prompt: {
      role: 'Benefits System Administrator',
      task: 'Configure enrollment system for open enrollment',
      context: args,
      instructions: [
        'Set up benefit plans in HRIS/benefits platform',
        'Program eligibility rules',
        'Configure contribution deductions',
        'Set up carrier feed integrations',
        'Configure employee self-service portal'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        planSetup: { type: 'object' },
        eligibilityRules: { type: 'array' },
        deductionConfig: { type: 'object' },
        carrierFeeds: { type: 'array' },
        portalConfig: { type: 'object' }
      },
      required: ['planSetup', 'eligibilityRules']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developCommunicationStrategy = defineTask('develop-communication-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Communication Strategy',
  agent: {
    name: 'hr-communications-specialist',
    prompt: {
      role: 'Benefits Communication Strategist',
      task: 'Develop comprehensive enrollment communication strategy',
      context: args,
      instructions: [
        'Create enrollment guide and materials',
        'Develop benefits decision support tools',
        'Design multi-channel communication plan',
        'Plan benefits fairs and webinars',
        'Create manager toolkit'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        enrollmentGuide: { type: 'object' },
        decisionTools: { type: 'array' },
        communicationPlan: { type: 'object' },
        eventPlan: { type: 'array' },
        managerToolkit: { type: 'object' }
      },
      required: ['enrollmentGuide', 'communicationPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeOpenEnrollment = defineTask('execute-open-enrollment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Open Enrollment',
  agent: {
    name: 'benefits-administrator',
    prompt: {
      role: 'Open Enrollment Manager',
      task: 'Execute and manage open enrollment period',
      context: args,
      instructions: [
        'Manage enrollment window operations',
        'Provide employee support and assistance',
        'Track elections and send reminders',
        'Handle exceptions and special cases',
        'Monitor real-time analytics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        enrollmentProgress: { type: 'object' },
        supportMetrics: { type: 'object' },
        exceptions: { type: 'array' },
        realTimeAnalytics: { type: 'object' },
        issues: { type: 'array' }
      },
      required: ['enrollmentProgress', 'realTimeAnalytics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeEnrollmentResults = defineTask('analyze-enrollment-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Enrollment Results',
  agent: {
    name: 'benefits-analyst',
    prompt: {
      role: 'Enrollment Analytics Specialist',
      task: 'Analyze open enrollment results and outcomes',
      context: args,
      instructions: [
        'Calculate participation rates by plan',
        'Analyze election changes from prior year',
        'Identify demographic enrollment patterns',
        'Assess cost impact and projections',
        'Compile employee feedback'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        participationRates: { type: 'object' },
        electionChanges: { type: 'object' },
        demographicPatterns: { type: 'object' },
        costImpact: { type: 'object' },
        feedback: { type: 'array' },
        overallParticipation: { type: 'number' },
        satisfactionScore: { type: 'number' }
      },
      required: ['participationRates', 'costImpact', 'overallParticipation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const managePostEnrollment = defineTask('manage-post-enrollment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage Post-Enrollment',
  agent: {
    name: 'benefits-administrator',
    prompt: {
      role: 'Post-Enrollment Administrator',
      task: 'Manage ongoing benefits administration',
      context: args,
      instructions: [
        'Transmit and reconcile carrier files',
        'Process new hire and life events',
        'Audit benefit deductions',
        'Manage employee inquiries',
        'Verify coverage accuracy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        carrierReconciliation: { type: 'object' },
        lifeEventProcessing: { type: 'object' },
        deductionAudit: { type: 'object' },
        inquiryMetrics: { type: 'object' },
        coverageVerification: { type: 'object' }
      },
      required: ['carrierReconciliation', 'deductionAudit']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const ensureComplianceReporting = defineTask('ensure-compliance-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ensure Compliance Reporting',
  agent: {
    name: 'benefits-compliance-specialist',
    prompt: {
      role: 'Benefits Compliance Officer',
      task: 'Ensure benefits compliance and complete required reporting',
      context: args,
      instructions: [
        'Prepare ACA reporting (1094-C, 1095-C)',
        'Maintain ERISA compliance documentation',
        'Prepare 5500 filing',
        'Conduct non-discrimination testing',
        'Compile audit documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        acaReporting: { type: 'object' },
        erisaCompliance: { type: 'object' },
        form5500: { type: 'object' },
        ndtResults: { type: 'object' },
        auditDocs: { type: 'array' }
      },
      required: ['acaReporting', 'erisaCompliance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createAdminDocumentation = defineTask('create-admin-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Admin Documentation',
  agent: {
    name: 'benefits-documentation-specialist',
    prompt: {
      role: 'Benefits Documentation Specialist',
      task: 'Create comprehensive benefits administration documentation',
      context: args,
      instructions: [
        'Compile plan documents and SPDs',
        'Create administrative procedures manual',
        'Develop vendor contact and escalation guide',
        'Build annual benefits calendar',
        'Document process improvement recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        planDocuments: { type: 'array' },
        proceduresManual: { type: 'object' },
        vendorGuide: { type: 'object' },
        annualCalendar: { type: 'array' },
        improvements: { type: 'array' }
      },
      required: ['planDocuments', 'proceduresManual']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
