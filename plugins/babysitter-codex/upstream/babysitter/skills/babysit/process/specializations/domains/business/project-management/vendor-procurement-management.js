/**
 * @process specializations/domains/business/project-management/vendor-procurement-management
 * @description Vendor and Procurement Management - Plan procurements, conduct vendor selection,
 * manage contracts, and oversee vendor performance throughout the project lifecycle.
 * @inputs { projectName: string, procurementNeeds: array, budget: object, timeline: object }
 * @outputs { success: boolean, procurementPlan: object, contracts: array, vendorPerformance: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/vendor-procurement-management', {
 *   projectName: 'Infrastructure Upgrade',
 *   procurementNeeds: [{ item: 'Cloud Services', type: 'service', estimatedValue: 500000 }],
 *   budget: { procurement: 2000000, contingency: 200000 },
 *   timeline: { startDate: '2025-01-01', endDate: '2025-12-31' }
 * });
 *
 * @references
 * - PMI Procurement Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Contract Management Best Practices: https://www.ncmahq.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    procurementNeeds = [],
    budget = {},
    timeline = {},
    organizationalPolicies = {},
    existingVendors = []
  } = inputs;

  // Phase 1: Procurement Planning
  const procurementPlan = await ctx.task(procurementPlanningTask, {
    projectName,
    procurementNeeds,
    budget,
    timeline,
    organizationalPolicies
  });

  // Phase 2: Make-or-Buy Analysis
  const makeOrBuy = await ctx.task(makeOrBuyTask, {
    projectName,
    procurementNeeds,
    budget,
    organizationalPolicies
  });

  // Breakpoint: Review procurement decisions
  await ctx.breakpoint({
    question: `Make-or-buy analysis complete for ${projectName}. ${makeOrBuy.buyDecisions?.length || 0} items to procure externally. Review decisions?`,
    title: 'Procurement Decision Review',
    context: {
      runId: ctx.runId,
      projectName,
      files: [{
        path: `artifacts/make-or-buy.json`,
        format: 'json',
        content: makeOrBuy
      }]
    }
  });

  // Phase 3: Vendor Identification
  const vendorIdentification = await ctx.task(vendorIdentificationTask, {
    projectName,
    procurementNeeds: makeOrBuy.buyDecisions,
    existingVendors
  });

  // Phase 4: RFP/RFQ Development
  const rfpDevelopment = await ctx.task(rfpDevelopmentTask, {
    projectName,
    procurementNeeds: makeOrBuy.buyDecisions,
    vendors: vendorIdentification,
    timeline
  });

  // Phase 5: Vendor Evaluation
  const vendorEvaluation = await ctx.task(vendorEvaluationTask, {
    projectName,
    rfpResponses: rfpDevelopment,
    evaluationCriteria: procurementPlan.evaluationCriteria
  });

  // Phase 6: Contract Negotiation
  const contractNegotiation = await ctx.task(contractNegotiationTask, {
    projectName,
    selectedVendors: vendorEvaluation.selectedVendors,
    procurementNeeds: makeOrBuy.buyDecisions,
    budget
  });

  // Breakpoint: Contract approval
  await ctx.breakpoint({
    question: `Contracts negotiated for ${projectName}. Total value: $${contractNegotiation.totalValue || 0}. Review and approve contracts?`,
    title: 'Contract Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [{
        path: `artifacts/contracts.json`,
        format: 'json',
        content: contractNegotiation
      }]
    }
  });

  // Phase 7: Contract Administration
  const contractAdmin = await ctx.task(contractAdministrationTask, {
    projectName,
    contracts: contractNegotiation.contracts,
    timeline
  });

  // Phase 8: Vendor Performance Management
  const performanceManagement = await ctx.task(vendorPerformanceTask, {
    projectName,
    contracts: contractNegotiation.contracts,
    kpis: procurementPlan.vendorKPIs
  });

  // Phase 9: Procurement Documentation
  const procurementDocumentation = await ctx.task(procurementDocumentationTask, {
    projectName,
    procurementPlan,
    makeOrBuy,
    contracts: contractNegotiation.contracts,
    performanceManagement
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Procurement management complete for ${projectName}. ${contractNegotiation.contracts?.length || 0} contracts established. Approve final documentation?`,
    title: 'Procurement Complete',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/procurement-complete.json`, format: 'json', content: procurementDocumentation },
        { path: `artifacts/procurement-complete.md`, format: 'markdown', content: procurementDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    procurementPlan: procurementPlan,
    makeOrBuyAnalysis: makeOrBuy,
    contracts: contractNegotiation.contracts,
    vendorPerformance: performanceManagement,
    documentation: procurementDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/vendor-procurement-management',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const procurementPlanningTask = defineTask('procurement-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Procurement Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Procurement Manager',
      task: 'Develop procurement management plan',
      context: {
        projectName: args.projectName,
        procurementNeeds: args.procurementNeeds,
        budget: args.budget,
        timeline: args.timeline,
        organizationalPolicies: args.organizationalPolicies
      },
      instructions: [
        '1. Analyze procurement requirements',
        '2. Define procurement approach',
        '3. Establish evaluation criteria',
        '4. Define contract types',
        '5. Create procurement schedule',
        '6. Identify procurement risks',
        '7. Define vendor KPIs',
        '8. Document approval authorities',
        '9. Align with organizational policies',
        '10. Compile procurement plan'
      ],
      outputFormat: 'JSON object with procurement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: { type: 'object' },
        procurementApproach: { type: 'string' },
        evaluationCriteria: { type: 'array' },
        contractTypes: { type: 'array' },
        vendorKPIs: { type: 'array' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'planning', 'vendor']
}));

export const makeOrBuyTask = defineTask('make-or-buy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Make-or-Buy Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst',
      task: 'Conduct make-or-buy analysis',
      context: {
        projectName: args.projectName,
        procurementNeeds: args.procurementNeeds,
        budget: args.budget,
        organizationalPolicies: args.organizationalPolicies
      },
      instructions: [
        '1. Identify all potential procurements',
        '2. Analyze internal capabilities',
        '3. Estimate make costs',
        '4. Estimate buy costs',
        '5. Assess strategic factors',
        '6. Evaluate risk factors',
        '7. Consider time constraints',
        '8. Document decision rationale',
        '9. Categorize decisions',
        '10. Summarize make-or-buy analysis'
      ],
      outputFormat: 'JSON object with make-or-buy decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['makeDecisions', 'buyDecisions'],
      properties: {
        makeDecisions: { type: 'array' },
        buyDecisions: { type: 'array' },
        analysis: { type: 'array' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'analysis', 'decision']
}));

export const vendorIdentificationTask = defineTask('vendor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Vendor Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sourcing Specialist',
      task: 'Identify potential vendors',
      context: {
        projectName: args.projectName,
        procurementNeeds: args.procurementNeeds,
        existingVendors: args.existingVendors
      },
      instructions: [
        '1. Define vendor requirements',
        '2. Research market options',
        '3. Review existing vendor relationships',
        '4. Conduct preliminary screening',
        '5. Assess vendor capabilities',
        '6. Check vendor references',
        '7. Evaluate financial stability',
        '8. Create shortlist',
        '9. Document vendor profiles',
        '10. Compile vendor list'
      ],
      outputFormat: 'JSON object with identified vendors'
    },
    outputSchema: {
      type: 'object',
      required: ['vendors'],
      properties: {
        vendors: { type: 'array' },
        shortlist: { type: 'array' },
        vendorProfiles: { type: 'array' },
        marketAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'vendor', 'sourcing']
}));

export const rfpDevelopmentTask = defineTask('rfp-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: RFP Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Procurement Specialist',
      task: 'Develop RFP/RFQ documents',
      context: {
        projectName: args.projectName,
        procurementNeeds: args.procurementNeeds,
        vendors: args.vendors,
        timeline: args.timeline
      },
      instructions: [
        '1. Define scope of work',
        '2. Document requirements',
        '3. Establish evaluation criteria',
        '4. Define terms and conditions',
        '5. Create pricing structure',
        '6. Set submission requirements',
        '7. Define timeline',
        '8. Include compliance requirements',
        '9. Create RFP templates',
        '10. Compile RFP package'
      ],
      outputFormat: 'JSON object with RFP documents'
    },
    outputSchema: {
      type: 'object',
      required: ['rfpDocuments'],
      properties: {
        rfpDocuments: { type: 'array' },
        scopeOfWork: { type: 'object' },
        evaluationCriteria: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'RFP', 'solicitation']
}));

export const vendorEvaluationTask = defineTask('vendor-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Vendor Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Evaluation Committee Lead',
      task: 'Evaluate vendor proposals',
      context: {
        projectName: args.projectName,
        rfpResponses: args.rfpResponses,
        evaluationCriteria: args.evaluationCriteria
      },
      instructions: [
        '1. Review all proposals',
        '2. Score against criteria',
        '3. Conduct technical evaluation',
        '4. Evaluate pricing',
        '5. Assess vendor capability',
        '6. Check references',
        '7. Conduct presentations/demos',
        '8. Perform risk assessment',
        '9. Rank vendors',
        '10. Document selection rationale'
      ],
      outputFormat: 'JSON object with vendor evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedVendors', 'evaluationMatrix'],
      properties: {
        selectedVendors: { type: 'array' },
        evaluationMatrix: { type: 'array' },
        rankings: { type: 'array' },
        selectionRationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'evaluation', 'selection']
}));

export const contractNegotiationTask = defineTask('contract-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Contract Negotiation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Negotiator',
      task: 'Negotiate and finalize contracts',
      context: {
        projectName: args.projectName,
        selectedVendors: args.selectedVendors,
        procurementNeeds: args.procurementNeeds,
        budget: args.budget
      },
      instructions: [
        '1. Prepare negotiation strategy',
        '2. Define negotiation priorities',
        '3. Negotiate terms and conditions',
        '4. Finalize pricing',
        '5. Define SLAs',
        '6. Establish payment terms',
        '7. Define change management',
        '8. Include termination clauses',
        '9. Document all agreements',
        '10. Finalize contracts'
      ],
      outputFormat: 'JSON object with negotiated contracts'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'totalValue'],
      properties: {
        contracts: { type: 'array' },
        totalValue: { type: 'number' },
        slas: { type: 'array' },
        paymentTerms: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'contract', 'negotiation']
}));

export const contractAdministrationTask = defineTask('contract-administration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Contract Administration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Administrator',
      task: 'Establish contract administration processes',
      context: {
        projectName: args.projectName,
        contracts: args.contracts,
        timeline: args.timeline
      },
      instructions: [
        '1. Define administration processes',
        '2. Establish communication protocols',
        '3. Create tracking mechanisms',
        '4. Define change order process',
        '5. Establish payment procedures',
        '6. Define dispute resolution',
        '7. Create compliance monitoring',
        '8. Document record keeping',
        '9. Plan contract closeout',
        '10. Compile administration plan'
      ],
      outputFormat: 'JSON object with administration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['administrationPlan'],
      properties: {
        administrationPlan: { type: 'object' },
        communicationProtocols: { type: 'array' },
        trackingMechanisms: { type: 'array' },
        changeOrderProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'contract', 'administration']
}));

export const vendorPerformanceTask = defineTask('vendor-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Vendor Performance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vendor Manager',
      task: 'Establish vendor performance management',
      context: {
        projectName: args.projectName,
        contracts: args.contracts,
        kpis: args.kpis
      },
      instructions: [
        '1. Define performance metrics',
        '2. Create scorecard template',
        '3. Establish review frequency',
        '4. Define escalation procedures',
        '5. Create improvement process',
        '6. Document feedback mechanisms',
        '7. Plan performance reviews',
        '8. Define incentives/penalties',
        '9. Create reporting structure',
        '10. Compile performance plan'
      ],
      outputFormat: 'JSON object with performance management plan'
    },
    outputSchema: {
      type: 'object',
      required: ['performancePlan'],
      properties: {
        performancePlan: { type: 'object' },
        scorecardTemplate: { type: 'object' },
        reviewSchedule: { type: 'array' },
        escalationProcedures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'vendor', 'performance']
}));

export const procurementDocumentationTask = defineTask('procurement-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Procurement Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile procurement documentation',
      context: {
        projectName: args.projectName,
        procurementPlan: args.procurementPlan,
        makeOrBuy: args.makeOrBuy,
        contracts: args.contracts,
        performanceManagement: args.performanceManagement
      },
      instructions: [
        '1. Compile all procurement documents',
        '2. Organize contract files',
        '3. Create procurement register',
        '4. Document lessons learned',
        '5. Generate summary report',
        '6. Create markdown documentation',
        '7. Add recommendations',
        '8. Include appendices',
        '9. Document version control',
        '10. Finalize documentation package'
      ],
      outputFormat: 'JSON object with procurement documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        procurementRegister: { type: 'array' },
        lessonsLearned: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['procurement', 'documentation', 'deliverable']
}));
