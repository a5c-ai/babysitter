/**
 * @process venture-capital/portfolio-value-creation
 * @description Systematic support programs including strategic planning, talent acquisition, customer introductions, operational improvement, and fundraising support
 * @inputs { companyName: string, companyStage: string, companyNeeds: array, portfolioResources: object }
 * @outputs { success: boolean, supportPlan: object, engagementActivities: array, impactMetrics: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    companyStage = 'growth',
    companyNeeds = [],
    portfolioResources = {},
    outputDir = 'value-creation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Needs Assessment
  ctx.log('info', 'Assessing company value creation needs');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    companyName,
    companyStage,
    companyNeeds,
    outputDir
  });

  if (!needsAssessment.success) {
    return {
      success: false,
      error: 'Needs assessment failed',
      details: needsAssessment,
      metadata: { processId: 'venture-capital/portfolio-value-creation', timestamp: startTime }
    };
  }

  artifacts.push(...needsAssessment.artifacts);

  // Task 2: Strategic Planning Support
  ctx.log('info', 'Developing strategic planning support');
  const strategicPlanning = await ctx.task(strategicPlanningTask, {
    companyName,
    companyStage,
    needsAssessment,
    outputDir
  });

  artifacts.push(...strategicPlanning.artifacts);

  // Task 3: Talent Acquisition Support
  ctx.log('info', 'Planning talent acquisition support');
  const talentSupport = await ctx.task(talentSupportTask, {
    companyName,
    companyStage,
    needsAssessment,
    portfolioResources,
    outputDir
  });

  artifacts.push(...talentSupport.artifacts);

  // Task 4: Customer Introduction Planning
  ctx.log('info', 'Planning customer introductions');
  const customerIntros = await ctx.task(customerIntroTask, {
    companyName,
    needsAssessment,
    portfolioResources,
    outputDir
  });

  artifacts.push(...customerIntros.artifacts);

  // Task 5: Operational Improvement Planning
  ctx.log('info', 'Planning operational improvements');
  const operationalSupport = await ctx.task(operationalSupportTask, {
    companyName,
    companyStage,
    needsAssessment,
    portfolioResources,
    outputDir
  });

  artifacts.push(...operationalSupport.artifacts);

  // Task 6: Fundraising Support Planning
  ctx.log('info', 'Planning fundraising support');
  const fundraisingSupport = await ctx.task(fundraisingSupportTask, {
    companyName,
    companyStage,
    needsAssessment,
    portfolioResources,
    outputDir
  });

  artifacts.push(...fundraisingSupport.artifacts);

  // Breakpoint: Review value creation plan
  await ctx.breakpoint({
    question: `Value creation plan complete for ${companyName}. ${needsAssessment.priorityNeeds.length} priority needs identified. Review support plan?`,
    title: 'Portfolio Value Creation Plan',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        priorityNeeds: needsAssessment.priorityNeeds.length,
        strategicInitiatives: strategicPlanning.initiatives.length,
        talentRoles: talentSupport.roles.length,
        customerIntros: customerIntros.introductions.length,
        operationalProjects: operationalSupport.projects.length
      }
    }
  });

  // Task 7: Impact Tracking Setup
  ctx.log('info', 'Setting up impact tracking');
  const impactTracking = await ctx.task(impactTrackingTask, {
    companyName,
    strategicPlanning,
    talentSupport,
    customerIntros,
    operationalSupport,
    fundraisingSupport,
    outputDir
  });

  artifacts.push(...impactTracking.artifacts);

  // Task 8: Generate Value Creation Report
  ctx.log('info', 'Generating value creation report');
  const valueCreationReport = await ctx.task(valueCreationReportTask, {
    companyName,
    needsAssessment,
    strategicPlanning,
    talentSupport,
    customerIntros,
    operationalSupport,
    fundraisingSupport,
    impactTracking,
    outputDir
  });

  artifacts.push(...valueCreationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    supportPlan: {
      priorityNeeds: needsAssessment.priorityNeeds,
      strategicInitiatives: strategicPlanning.initiatives,
      talentPlan: talentSupport.plan,
      customerIntros: customerIntros.introductions,
      operationalProjects: operationalSupport.projects,
      fundraisingSupport: fundraisingSupport.plan
    },
    engagementActivities: impactTracking.activities,
    impactMetrics: {
      tracking: impactTracking.metrics,
      targets: impactTracking.targets,
      baseline: impactTracking.baseline
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/portfolio-value-creation',
      timestamp: startTime,
      companyName,
      companyStage
    }
  };
}

// Task 1: Needs Assessment
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess value creation needs',
  agent: {
    name: 'needs-assessor',
    prompt: {
      role: 'portfolio value creation specialist',
      task: 'Assess company value creation needs',
      context: args,
      instructions: [
        'Review company current state',
        'Identify gaps and challenges',
        'Prioritize needs by impact',
        'Assess urgency of each need',
        'Match needs to available resources',
        'Identify quick wins',
        'Define long-term initiatives',
        'Document needs assessment'
      ],
      outputFormat: 'JSON with needs assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'priorityNeeds', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        priorityNeeds: { type: 'array' },
        allNeeds: { type: 'array' },
        quickWins: { type: 'array' },
        longTermNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'assessment']
}));

// Task 2: Strategic Planning Support
export const strategicPlanningTask = defineTask('strategic-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic planning support',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'strategic planning consultant',
      task: 'Develop strategic planning support program',
      context: args,
      instructions: [
        'Review current strategic plan',
        'Identify strategic planning needs',
        'Design planning workshops',
        'Develop market analysis support',
        'Create competitive strategy support',
        'Plan OKR/goal setting support',
        'Design board strategy sessions',
        'Document strategic initiatives'
      ],
      outputFormat: 'JSON with strategic planning support and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'plan', 'artifacts'],
      properties: {
        initiatives: { type: 'array' },
        plan: { type: 'object' },
        workshops: { type: 'array' },
        deliverables: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'strategy']
}));

// Task 3: Talent Acquisition Support
export const talentSupportTask = defineTask('talent-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan talent acquisition support',
  agent: {
    name: 'talent-advisor',
    prompt: {
      role: 'executive recruiting advisor',
      task: 'Plan talent acquisition support',
      context: args,
      instructions: [
        'Identify key hiring needs',
        'Map roles to portfolio network',
        'Identify recruiter introductions',
        'Plan interview support',
        'Design compensation benchmarking',
        'Create reference checking support',
        'Plan onboarding assistance',
        'Document talent support plan'
      ],
      outputFormat: 'JSON with talent support plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'plan', 'artifacts'],
      properties: {
        roles: { type: 'array' },
        plan: { type: 'object' },
        networkCandidates: { type: 'array' },
        recruiterIntros: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'talent']
}));

// Task 4: Customer Introduction Planning
export const customerIntroTask = defineTask('customer-intros', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan customer introductions',
  agent: {
    name: 'business-development',
    prompt: {
      role: 'business development advisor',
      task: 'Plan customer introductions and partnerships',
      context: args,
      instructions: [
        'Identify target customer segments',
        'Map portfolio company connections',
        'Identify LP network opportunities',
        'Plan introduction approach',
        'Prepare company positioning',
        'Design follow-up process',
        'Track introduction outcomes',
        'Document introduction pipeline'
      ],
      outputFormat: 'JSON with introduction plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['introductions', 'plan', 'artifacts'],
      properties: {
        introductions: { type: 'array' },
        plan: { type: 'object' },
        portfolioConnections: { type: 'array' },
        lpConnections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'customers']
}));

// Task 5: Operational Support Planning
export const operationalSupportTask = defineTask('operational-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan operational improvements',
  agent: {
    name: 'operations-advisor',
    prompt: {
      role: 'operational excellence advisor',
      task: 'Plan operational improvement support',
      context: args,
      instructions: [
        'Identify operational improvement areas',
        'Plan process optimization projects',
        'Design metrics and KPI support',
        'Plan technology/tool recommendations',
        'Identify best practice sharing',
        'Plan vendor introductions',
        'Design operational reviews',
        'Document operational projects'
      ],
      outputFormat: 'JSON with operational support plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['projects', 'plan', 'artifacts'],
      properties: {
        projects: { type: 'array' },
        plan: { type: 'object' },
        bestPractices: { type: 'array' },
        vendorIntros: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'operations']
}));

// Task 6: Fundraising Support Planning
export const fundraisingSupportTask = defineTask('fundraising-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan fundraising support',
  agent: {
    name: 'fundraising-advisor',
    prompt: {
      role: 'fundraising advisor',
      task: 'Plan fundraising support',
      context: args,
      instructions: [
        'Assess fundraising readiness',
        'Plan pitch deck support',
        'Identify investor introductions',
        'Design data room support',
        'Plan term negotiation support',
        'Prepare market positioning',
        'Design fundraising timeline',
        'Document fundraising plan'
      ],
      outputFormat: 'JSON with fundraising support plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'investorIntros', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        investorIntros: { type: 'array' },
        readinessAssessment: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'fundraising']
}));

// Task 7: Impact Tracking Setup
export const impactTrackingTask = defineTask('impact-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup impact tracking',
  agent: {
    name: 'impact-tracker',
    prompt: {
      role: 'portfolio impact analyst',
      task: 'Setup value creation impact tracking',
      context: args,
      instructions: [
        'Define impact metrics per initiative',
        'Establish baseline measurements',
        'Set impact targets',
        'Design tracking dashboard',
        'Plan periodic reviews',
        'Create activity log',
        'Setup attribution tracking',
        'Document tracking methodology'
      ],
      outputFormat: 'JSON with impact tracking setup and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'activities', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        activities: { type: 'array' },
        targets: { type: 'object' },
        baseline: { type: 'object' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'tracking']
}));

// Task 8: Value Creation Report
export const valueCreationReportTask = defineTask('value-creation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate value creation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'portfolio operations manager',
      task: 'Generate value creation program report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document needs assessment',
        'Present support plan overview',
        'Include initiative details',
        'Document resource allocation',
        'Present impact metrics',
        'Include timeline and milestones',
        'Format for LP reporting'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        initiatives: { type: 'array' },
        resources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'value-creation', 'reporting']
}));
