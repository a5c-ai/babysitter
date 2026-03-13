/**
 * @process venture-capital/ma-exit-execution
 * @description Managing strategic sale process including advisor selection, CIM preparation, buyer outreach, management presentations, and definitive agreement negotiation
 * @inputs { companyName: string, companyData: object, saleParameters: object, buyerPreferences: object }
 * @outputs { success: boolean, processTimeline: object, buyerEngagement: object, transactionTerms: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    companyData = {},
    saleParameters = {},
    buyerPreferences = {},
    outputDir = 'ma-exit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Sale Process Design
  ctx.log('info', 'Designing sale process');
  const processDesign = await ctx.task(saleProcessDesignTask, {
    companyName,
    companyData,
    saleParameters,
    outputDir
  });

  if (!processDesign.success) {
    return {
      success: false,
      error: 'Sale process design failed',
      details: processDesign,
      metadata: { processId: 'venture-capital/ma-exit-execution', timestamp: startTime }
    };
  }

  artifacts.push(...processDesign.artifacts);

  // Task 2: Advisor Selection
  ctx.log('info', 'Managing advisor selection');
  const advisorSelection = await ctx.task(advisorSelectionTask, {
    companyName,
    companyData,
    saleParameters,
    outputDir
  });

  artifacts.push(...advisorSelection.artifacts);

  // Task 3: CIM Preparation
  ctx.log('info', 'Preparing confidential information memorandum');
  const cimPreparation = await ctx.task(cimPreparationTask, {
    companyName,
    companyData,
    processDesign,
    outputDir
  });

  artifacts.push(...cimPreparation.artifacts);

  // Task 4: Buyer Targeting and Outreach
  ctx.log('info', 'Targeting and reaching out to buyers');
  const buyerOutreach = await ctx.task(buyerOutreachTask, {
    companyName,
    companyData,
    buyerPreferences,
    processDesign,
    outputDir
  });

  artifacts.push(...buyerOutreach.artifacts);

  // Task 5: Management Presentation Preparation
  ctx.log('info', 'Preparing management presentations');
  const mgmtPresentations = await ctx.task(mgmtPresentationTask, {
    companyName,
    companyData,
    cimPreparation,
    outputDir
  });

  artifacts.push(...mgmtPresentations.artifacts);

  // Task 6: Bid Management
  ctx.log('info', 'Managing bid process');
  const bidManagement = await ctx.task(bidManagementTask, {
    companyName,
    buyerOutreach,
    saleParameters,
    outputDir
  });

  artifacts.push(...bidManagement.artifacts);

  // Breakpoint: Review sale process
  await ctx.breakpoint({
    question: `M&A sale process prepared for ${companyName}. ${buyerOutreach.contactedBuyers.length} buyers contacted, ${bidManagement.activeBidders.length} active bidders. Review process?`,
    title: 'M&A Exit Execution',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        processType: processDesign.processType,
        buyersContacted: buyerOutreach.contactedBuyers.length,
        activeBidders: bidManagement.activeBidders.length,
        indicativeBids: bidManagement.indicativeBids.length,
        targetTimeline: processDesign.timeline
      }
    }
  });

  // Task 7: Definitive Agreement Negotiation
  ctx.log('info', 'Supporting definitive agreement negotiation');
  const agreementNegotiation = await ctx.task(agreementNegotiationTask, {
    companyName,
    bidManagement,
    saleParameters,
    outputDir
  });

  artifacts.push(...agreementNegotiation.artifacts);

  // Task 8: Generate M&A Process Report
  ctx.log('info', 'Generating M&A process report');
  const maReport = await ctx.task(maProcessReportTask, {
    companyName,
    processDesign,
    advisorSelection,
    cimPreparation,
    buyerOutreach,
    mgmtPresentations,
    bidManagement,
    agreementNegotiation,
    outputDir
  });

  artifacts.push(...maReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processTimeline: {
      processType: processDesign.processType,
      phases: processDesign.phases,
      timeline: processDesign.timeline
    },
    advisors: {
      selected: advisorSelection.selected,
      roles: advisorSelection.roles
    },
    buyerEngagement: {
      targeted: buyerOutreach.targetedBuyers,
      contacted: buyerOutreach.contactedBuyers,
      activeBidders: bidManagement.activeBidders,
      indicativeBids: bidManagement.indicativeBids
    },
    transactionTerms: {
      bids: bidManagement.bids,
      negotiationStatus: agreementNegotiation.status,
      keyTerms: agreementNegotiation.keyTerms
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/ma-exit-execution',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Sale Process Design
export const saleProcessDesignTask = defineTask('sale-process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design sale process',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'M&A process specialist',
      task: 'Design strategic sale process',
      context: args,
      instructions: [
        'Determine auction vs negotiated sale',
        'Design process phases and timeline',
        'Set buyer qualification criteria',
        'Define bid requirements',
        'Plan data room structure',
        'Design management access protocol',
        'Set exclusivity and timeline expectations',
        'Document process letter terms'
      ],
      outputFormat: 'JSON with sale process design and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'processType', 'phases', 'timeline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        processType: { type: 'string' },
        phases: { type: 'array' },
        timeline: { type: 'object' },
        criteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'process-design']
}));

// Task 2: Advisor Selection
export const advisorSelectionTask = defineTask('advisor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage advisor selection',
  agent: {
    name: 'advisor-selector',
    prompt: {
      role: 'M&A advisor evaluation specialist',
      task: 'Manage advisor selection process',
      context: args,
      instructions: [
        'Identify candidate investment banks',
        'Evaluate sector expertise',
        'Review relevant transaction experience',
        'Assess buyer relationships',
        'Analyze fee structures',
        'Evaluate team composition',
        'Manage pitch process',
        'Recommend advisor selection'
      ],
      outputFormat: 'JSON with advisor selection and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selected', 'roles', 'artifacts'],
      properties: {
        selected: { type: 'array' },
        roles: { type: 'object' },
        fees: { type: 'object' },
        evaluation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'advisors']
}));

// Task 3: CIM Preparation
export const cimPreparationTask = defineTask('cim-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare CIM',
  agent: {
    name: 'cim-preparer',
    prompt: {
      role: 'confidential information memorandum specialist',
      task: 'Prepare confidential information memorandum',
      context: args,
      instructions: [
        'Draft executive summary',
        'Prepare company overview',
        'Document market opportunity',
        'Present competitive positioning',
        'Include financial analysis',
        'Present growth strategy',
        'Document management team',
        'Include transaction considerations'
      ],
      outputFormat: 'JSON with CIM preparation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cimPath', 'sections', 'artifacts'],
      properties: {
        cimPath: { type: 'string' },
        sections: { type: 'array' },
        executiveSummary: { type: 'string' },
        keyHighlights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'cim']
}));

// Task 4: Buyer Targeting and Outreach
export const buyerOutreachTask = defineTask('buyer-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Target and contact buyers',
  agent: {
    name: 'buyer-outreach-manager',
    prompt: {
      role: 'buyer outreach specialist',
      task: 'Target and contact potential buyers',
      context: args,
      instructions: [
        'Develop target buyer list',
        'Prioritize strategic vs financial buyers',
        'Identify key decision makers',
        'Prepare teaser materials',
        'Execute outreach campaign',
        'Manage NDA process',
        'Track buyer engagement',
        'Qualify interested parties'
      ],
      outputFormat: 'JSON with buyer outreach status and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetedBuyers', 'contactedBuyers', 'artifacts'],
      properties: {
        targetedBuyers: { type: 'array' },
        contactedBuyers: { type: 'array' },
        ndaSigned: { type: 'array' },
        interested: { type: 'array' },
        passed: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'outreach']
}));

// Task 5: Management Presentation Preparation
export const mgmtPresentationTask = defineTask('mgmt-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare management presentations',
  agent: {
    name: 'presentation-preparer',
    prompt: {
      role: 'management presentation specialist',
      task: 'Prepare management presentation materials',
      context: args,
      instructions: [
        'Develop presentation deck',
        'Prepare management scripts',
        'Create Q&A document',
        'Plan presentation logistics',
        'Prepare demo/product walkthrough',
        'Coach management team',
        'Plan follow-up process',
        'Document presentation schedule'
      ],
      outputFormat: 'JSON with presentation materials and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'schedule', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        schedule: { type: 'array' },
        qandaDoc: { type: 'string' },
        logistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'presentations']
}));

// Task 6: Bid Management
export const bidManagementTask = defineTask('bid-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage bid process',
  agent: {
    name: 'bid-manager',
    prompt: {
      role: 'M&A bid process manager',
      task: 'Manage bid process and evaluation',
      context: args,
      instructions: [
        'Collect indicative bids',
        'Evaluate bid terms',
        'Compare bidder valuations',
        'Assess deal certainty factors',
        'Manage due diligence access',
        'Solicit final bids',
        'Evaluate final proposals',
        'Recommend preferred bidder'
      ],
      outputFormat: 'JSON with bid management status and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activeBidders', 'indicativeBids', 'bids', 'artifacts'],
      properties: {
        activeBidders: { type: 'array' },
        indicativeBids: { type: 'array' },
        bids: { type: 'array' },
        evaluation: { type: 'object' },
        recommendation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'bids']
}));

// Task 7: Agreement Negotiation Support
export const agreementNegotiationTask = defineTask('agreement-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support agreement negotiation',
  agent: {
    name: 'negotiation-advisor',
    prompt: {
      role: 'M&A negotiation specialist',
      task: 'Support definitive agreement negotiation',
      context: args,
      instructions: [
        'Negotiate purchase price terms',
        'Structure consideration mix',
        'Negotiate reps and warranties',
        'Define indemnification terms',
        'Negotiate closing conditions',
        'Structure escrow arrangements',
        'Define employment terms',
        'Finalize transaction structure'
      ],
      outputFormat: 'JSON with negotiation status and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'keyTerms', 'artifacts'],
      properties: {
        status: { type: 'string' },
        keyTerms: { type: 'object' },
        openIssues: { type: 'array' },
        resolvedTerms: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'negotiation']
}));

// Task 8: M&A Process Report
export const maProcessReportTask = defineTask('ma-process-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate M&A process report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'M&A process manager',
      task: 'Generate comprehensive M&A process report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document process design',
        'Present advisor selection',
        'Include CIM overview',
        'Document buyer outreach results',
        'Present bid summary',
        'Include negotiation status',
        'Document next steps and timeline'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        metrics: { type: 'object' },
        nextSteps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ma-exit', 'reporting']
}));
