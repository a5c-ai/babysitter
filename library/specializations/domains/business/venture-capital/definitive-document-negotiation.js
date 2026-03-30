/**
 * @process venture-capital/definitive-document-negotiation
 * @description Managing negotiation of definitive agreements including Stock Purchase Agreement, Investors' Rights Agreement, Voting Agreement, and Right of First Refusal Agreement
 * @inputs { companyName: string, termSheet: object, parties: array, existingDocuments: object }
 * @outputs { success: boolean, documentStatus: object, negotiationPoints: array, closingChecklist: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    termSheet = {},
    parties = [],
    existingDocuments = {},
    outputDir = 'definitive-docs-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Stock Purchase Agreement Review
  ctx.log('info', 'Reviewing Stock Purchase Agreement');
  const spaReview = await ctx.task(spaReviewTask, {
    companyName,
    termSheet,
    existingDocuments,
    outputDir
  });

  if (!spaReview.success) {
    return {
      success: false,
      error: 'SPA review failed',
      details: spaReview,
      metadata: { processId: 'venture-capital/definitive-document-negotiation', timestamp: startTime }
    };
  }

  artifacts.push(...spaReview.artifacts);

  // Task 2: Investors' Rights Agreement Review
  ctx.log('info', 'Reviewing Investors Rights Agreement');
  const iraReview = await ctx.task(iraReviewTask, {
    companyName,
    termSheet,
    existingDocuments,
    outputDir
  });

  artifacts.push(...iraReview.artifacts);

  // Task 3: Voting Agreement Review
  ctx.log('info', 'Reviewing Voting Agreement');
  const votingReview = await ctx.task(votingAgreementTask, {
    companyName,
    termSheet,
    existingDocuments,
    outputDir
  });

  artifacts.push(...votingReview.artifacts);

  // Task 4: ROFR and Co-Sale Agreement Review
  ctx.log('info', 'Reviewing ROFR and Co-Sale Agreement');
  const rofrReview = await ctx.task(rofrAgreementTask, {
    companyName,
    termSheet,
    existingDocuments,
    outputDir
  });

  artifacts.push(...rofrReview.artifacts);

  // Task 5: Certificate of Incorporation Review
  ctx.log('info', 'Reviewing Certificate of Incorporation');
  const coiReview = await ctx.task(coiReviewTask, {
    companyName,
    termSheet,
    existingDocuments,
    outputDir
  });

  artifacts.push(...coiReview.artifacts);

  // Task 6: Negotiation Points Summary
  ctx.log('info', 'Summarizing negotiation points');
  const negotiationSummary = await ctx.task(negotiationSummaryTask, {
    spaReview,
    iraReview,
    votingReview,
    rofrReview,
    coiReview,
    outputDir
  });

  artifacts.push(...negotiationSummary.artifacts);

  // Breakpoint: Review negotiation points
  await ctx.breakpoint({
    question: `Document review complete for ${companyName}. ${negotiationSummary.openIssues.length} open issues identified. Review negotiation points?`,
    title: 'Definitive Document Negotiation',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        documentsReviewed: 5,
        openIssues: negotiationSummary.openIssues.length,
        resolvedIssues: negotiationSummary.resolvedIssues.length,
        criticalIssues: negotiationSummary.criticalIssues.length
      }
    }
  });

  // Task 7: Closing Checklist
  ctx.log('info', 'Creating closing checklist');
  const closingChecklist = await ctx.task(closingChecklistTask, {
    companyName,
    parties,
    spaReview,
    iraReview,
    votingReview,
    rofrReview,
    coiReview,
    outputDir
  });

  artifacts.push(...closingChecklist.artifacts);

  // Task 8: Generate Document Package
  ctx.log('info', 'Generating document package');
  const documentPackage = await ctx.task(documentPackageTask, {
    companyName,
    spaReview,
    iraReview,
    votingReview,
    rofrReview,
    coiReview,
    negotiationSummary,
    closingChecklist,
    outputDir
  });

  artifacts.push(...documentPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    documentStatus: {
      spa: spaReview.status,
      ira: iraReview.status,
      voting: votingReview.status,
      rofr: rofrReview.status,
      coi: coiReview.status
    },
    negotiationPoints: negotiationSummary.allIssues,
    criticalIssues: negotiationSummary.criticalIssues,
    closingChecklist: closingChecklist.checklist,
    timeline: closingChecklist.timeline,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/definitive-document-negotiation',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Stock Purchase Agreement Review
export const spaReviewTask = defineTask('spa-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Stock Purchase Agreement',
  agent: {
    name: 'spa-reviewer',
    prompt: {
      role: 'transaction attorney',
      task: 'Review and analyze Stock Purchase Agreement',
      context: args,
      instructions: [
        'Review purchase price and share allocation',
        'Analyze representations and warranties',
        'Review conditions to closing',
        'Analyze indemnification provisions',
        'Review disclosure schedules requirements',
        'Identify non-standard provisions',
        'Flag items departing from term sheet',
        'Document negotiation priorities'
      ],
      outputFormat: 'JSON with SPA review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'status', 'issues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        status: { type: 'string' },
        issues: { type: 'array' },
        repsAndWarranties: { type: 'object' },
        indemnification: { type: 'object' },
        closingConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'spa']
}));

// Task 2: Investors' Rights Agreement Review
export const iraReviewTask = defineTask('ira-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Investors Rights Agreement',
  agent: {
    name: 'ira-reviewer',
    prompt: {
      role: 'transaction attorney',
      task: 'Review Investors Rights Agreement',
      context: args,
      instructions: [
        'Review registration rights provisions',
        'Analyze information rights',
        'Review participation rights (pro-rata)',
        'Analyze most favored nation provisions',
        'Review termination provisions',
        'Identify investor thresholds',
        'Flag departures from term sheet',
        'Document negotiation priorities'
      ],
      outputFormat: 'JSON with IRA review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string' },
        issues: { type: 'array' },
        registrationRights: { type: 'object' },
        informationRights: { type: 'object' },
        proRata: { type: 'object' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'ira']
}));

// Task 3: Voting Agreement Review
export const votingAgreementTask = defineTask('voting-agreement-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Voting Agreement',
  agent: {
    name: 'voting-reviewer',
    prompt: {
      role: 'corporate governance attorney',
      task: 'Review Voting Agreement',
      context: args,
      instructions: [
        'Review board composition provisions',
        'Analyze director election mechanics',
        'Review drag-along provisions',
        'Analyze voting commitments',
        'Review proxy provisions',
        'Identify governance concerns',
        'Flag departures from term sheet',
        'Document negotiation priorities'
      ],
      outputFormat: 'JSON with voting agreement review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string' },
        issues: { type: 'array' },
        boardProvisions: { type: 'object' },
        dragAlong: { type: 'object' },
        votingCommitments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'voting']
}));

// Task 4: ROFR and Co-Sale Agreement Review
export const rofrAgreementTask = defineTask('rofr-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review ROFR and Co-Sale Agreement',
  agent: {
    name: 'rofr-reviewer',
    prompt: {
      role: 'transaction attorney',
      task: 'Review Right of First Refusal and Co-Sale Agreement',
      context: args,
      instructions: [
        'Review ROFR mechanics and timing',
        'Analyze co-sale (tag-along) provisions',
        'Review permitted transfers',
        'Analyze notice requirements',
        'Review company ROFR vs investor ROFR',
        'Identify transfer restrictions',
        'Flag departures from term sheet',
        'Document negotiation priorities'
      ],
      outputFormat: 'JSON with ROFR review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string' },
        issues: { type: 'array' },
        rofrMechanics: { type: 'object' },
        coSale: { type: 'object' },
        permittedTransfers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'rofr']
}));

// Task 5: Certificate of Incorporation Review
export const coiReviewTask = defineTask('coi-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Certificate of Incorporation',
  agent: {
    name: 'coi-reviewer',
    prompt: {
      role: 'corporate attorney',
      task: 'Review Amended and Restated Certificate of Incorporation',
      context: args,
      instructions: [
        'Review authorized share structure',
        'Analyze series terms and preferences',
        'Review liquidation preferences',
        'Analyze protective provisions',
        'Review conversion mechanics',
        'Analyze anti-dilution provisions',
        'Flag departures from term sheet',
        'Document negotiation priorities'
      ],
      outputFormat: 'JSON with COI review, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'issues', 'artifacts'],
      properties: {
        status: { type: 'string' },
        issues: { type: 'array' },
        shareStructure: { type: 'object' },
        seriesTerms: { type: 'object' },
        liquidation: { type: 'object' },
        protectiveProvisions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'coi']
}));

// Task 6: Negotiation Summary
export const negotiationSummaryTask = defineTask('negotiation-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Summarize negotiation points',
  agent: {
    name: 'negotiation-analyst',
    prompt: {
      role: 'deal negotiation specialist',
      task: 'Summarize all negotiation points across documents',
      context: args,
      instructions: [
        'Consolidate issues from all documents',
        'Categorize by priority and document',
        'Identify critical issues requiring resolution',
        'Flag interrelated issues across documents',
        'Propose negotiation positions',
        'Identify potential trade-offs',
        'Create negotiation roadmap',
        'Document resolution strategies'
      ],
      outputFormat: 'JSON with negotiation summary and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allIssues', 'criticalIssues', 'openIssues', 'artifacts'],
      properties: {
        allIssues: { type: 'array' },
        criticalIssues: { type: 'array' },
        openIssues: { type: 'array' },
        resolvedIssues: { type: 'array' },
        negotiationPositions: { type: 'object' },
        tradeoffs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'negotiation']
}));

// Task 7: Closing Checklist
export const closingChecklistTask = defineTask('closing-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create closing checklist',
  agent: {
    name: 'closing-coordinator',
    prompt: {
      role: 'transaction closing specialist',
      task: 'Create comprehensive closing checklist',
      context: args,
      instructions: [
        'List all closing deliverables by party',
        'Include all document signatures required',
        'List corporate approvals needed',
        'Include regulatory filings',
        'Add wire transfer instructions',
        'Include post-closing requirements',
        'Create timeline to closing',
        'Assign responsibilities'
      ],
      outputFormat: 'JSON with closing checklist, timeline, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'timeline', 'artifacts'],
      properties: {
        checklist: { type: 'array' },
        timeline: { type: 'object' },
        deliverables: { type: 'object' },
        approvals: { type: 'array' },
        postClosing: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'closing']
}));

// Task 8: Document Package Generation
export const documentPackageTask = defineTask('document-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate document package',
  agent: {
    name: 'package-generator',
    prompt: {
      role: 'transaction coordinator',
      task: 'Generate comprehensive document package',
      context: args,
      instructions: [
        'Compile all document summaries',
        'Create issue tracking matrix',
        'Include negotiation status',
        'Add closing checklist',
        'Include timeline',
        'Create signature pages tracker',
        'Add responsible party assignments',
        'Format for deal team distribution'
      ],
      outputFormat: 'JSON with package path, summary, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'summary', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        summary: { type: 'object' },
        documents: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'documents', 'package']
}));
