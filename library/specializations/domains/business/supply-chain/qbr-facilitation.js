/**
 * @process specializations/domains/business/supply-chain/qbr-facilitation
 * @description Quarterly Business Review (QBR) Facilitation - Prepare and conduct structured supplier business
 * reviews covering performance analysis, improvement actions, innovation opportunities, and strategic alignment.
 * @inputs { supplier?: string, quarter?: string, performanceData?: object, previousQbrActions?: array }
 * @outputs { success: boolean, qbrPackage: object, decisions: array, actionItems: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/qbr-facilitation', {
 *   supplier: 'Acme Corp',
 *   quarter: 'Q4-2024',
 *   performanceData: { scorecard: {...}, trends: {...} },
 *   previousQbrActions: [{ action: '...', status: 'complete' }]
 * });
 *
 * @references
 * - Vantage Partners QBR Best Practices: https://www.vantagepartners.com/
 * - Strategic Supplier Management: https://www.mckinsey.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplier = '',
    quarter = '',
    performanceData = {},
    previousQbrActions = [],
    strategicObjectives = {},
    attendees = [],
    outputDir = 'qbr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting QBR Facilitation for: ${supplier} - ${quarter}`);

  // ============================================================================
  // PHASE 1: PERFORMANCE DATA COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Compiling performance data');

  const performanceCompilation = await ctx.task(performanceCompilationTask, {
    supplier,
    quarter,
    performanceData,
    outputDir
  });

  artifacts.push(...performanceCompilation.artifacts);

  // ============================================================================
  // PHASE 2: PREVIOUS ACTION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 2: Reviewing previous QBR actions');

  const actionReview = await ctx.task(previousActionReviewTask, {
    supplier,
    previousQbrActions,
    outputDir
  });

  artifacts.push(...actionReview.artifacts);

  // ============================================================================
  // PHASE 3: PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing performance trends');

  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    supplier,
    performanceCompilation,
    quarter,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: STRATEGIC ALIGNMENT REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Reviewing strategic alignment');

  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    supplier,
    strategicObjectives,
    performanceAnalysis,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  // ============================================================================
  // PHASE 5: INNOVATION OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying innovation opportunities');

  const innovationOpportunities = await ctx.task(innovationOpportunitiesTask, {
    supplier,
    strategicAlignment,
    performanceAnalysis,
    outputDir
  });

  artifacts.push(...innovationOpportunities.artifacts);

  // ============================================================================
  // PHASE 6: QBR PRESENTATION PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Preparing QBR presentation');

  const qbrPresentation = await ctx.task(qbrPresentationTask, {
    supplier,
    quarter,
    performanceCompilation,
    actionReview,
    performanceAnalysis,
    strategicAlignment,
    innovationOpportunities,
    outputDir
  });

  artifacts.push(...qbrPresentation.artifacts);

  // Breakpoint: Review QBR package
  await ctx.breakpoint({
    question: `QBR package prepared for ${supplier}. Performance score: ${performanceAnalysis.overallScore}. ${actionReview.openActions} open actions. Review package before meeting?`,
    title: 'QBR Package Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        supplier,
        quarter,
        overallScore: performanceAnalysis.overallScore,
        openActions: actionReview.openActions
      }
    }
  });

  // ============================================================================
  // PHASE 7: AGENDA AND LOGISTICS
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up agenda and logistics');

  const agendaSetup = await ctx.task(agendaLogisticsTask, {
    supplier,
    quarter,
    attendees,
    qbrPresentation,
    outputDir
  });

  artifacts.push(...agendaSetup.artifacts);

  // ============================================================================
  // PHASE 8: QBR DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating QBR documentation');

  const qbrDocumentation = await ctx.task(qbrDocumentationTask, {
    supplier,
    quarter,
    qbrPresentation,
    agendaSetup,
    outputDir
  });

  artifacts.push(...qbrDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qbrPackage: {
      supplier,
      quarter,
      presentationPath: qbrPresentation.presentationPath,
      overallScore: performanceAnalysis.overallScore,
      keyHighlights: performanceAnalysis.highlights,
      keyConcerns: performanceAnalysis.concerns
    },
    previousActions: {
      total: actionReview.totalActions,
      completed: actionReview.completedActions,
      open: actionReview.openActions,
      overdue: actionReview.overdueActions
    },
    strategicAlignment: strategicAlignment.alignmentScore,
    innovationPipeline: innovationOpportunities.opportunities,
    agenda: agendaSetup.agenda,
    decisions: qbrDocumentation.decisionsRequired,
    actionItems: qbrDocumentation.newActionItems,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/qbr-facilitation',
      timestamp: startTime,
      supplier,
      quarter,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const performanceCompilationTask = defineTask('performance-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Performance Data Compilation',
  agent: {
    name: 'performance-compiler',
    prompt: {
      role: 'Supplier Performance Analyst',
      task: 'Compile supplier performance data for QBR',
      context: args,
      instructions: [
        '1. Gather scorecard data for quarter',
        '2. Compile delivery metrics (OTIF, OTD)',
        '3. Compile quality metrics (PPM, returns)',
        '4. Compile cost metrics (variances, savings)',
        '5. Compile service metrics (responsiveness)',
        '6. Compare to previous quarters',
        '7. Calculate year-over-year trends',
        '8. Document performance summary'
      ],
      outputFormat: 'JSON with compiled performance data'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMetrics', 'trends', 'artifacts'],
      properties: {
        performanceMetrics: { type: 'object' },
        trends: { type: 'object' },
        quarterComparison: { type: 'object' },
        yoyComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'performance']
}));

export const previousActionReviewTask = defineTask('previous-action-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Previous Action Review',
  agent: {
    name: 'action-reviewer',
    prompt: {
      role: 'Action Item Reviewer',
      task: 'Review status of previous QBR action items',
      context: args,
      instructions: [
        '1. List all previous QBR action items',
        '2. Update status of each action',
        '3. Identify completed actions',
        '4. Identify open/in-progress actions',
        '5. Identify overdue actions',
        '6. Document completion evidence',
        '7. Determine carry-forward items',
        '8. Create action status summary'
      ],
      outputFormat: 'JSON with action review'
    },
    outputSchema: {
      type: 'object',
      required: ['totalActions', 'completedActions', 'openActions', 'artifacts'],
      properties: {
        totalActions: { type: 'number' },
        completedActions: { type: 'number' },
        openActions: { type: 'number' },
        overdueActions: { type: 'number' },
        actionDetails: { type: 'array' },
        carryForward: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'action-review']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Performance Analysis',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Performance Analysis Specialist',
      task: 'Analyze supplier performance trends and insights',
      context: args,
      instructions: [
        '1. Calculate overall performance score',
        '2. Identify performance highlights',
        '3. Identify areas of concern',
        '4. Analyze root causes of issues',
        '5. Compare to benchmarks',
        '6. Identify improvement trends',
        '7. Identify declining trends',
        '8. Document analysis findings'
      ],
      outputFormat: 'JSON with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'highlights', 'concerns', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        highlights: { type: 'array' },
        concerns: { type: 'array' },
        rootCauses: { type: 'object' },
        improvingAreas: { type: 'array' },
        decliningAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'analysis']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Strategic Alignment Review',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'Strategic Alignment Analyst',
      task: 'Review supplier strategic alignment',
      context: args,
      instructions: [
        '1. Review strategic objectives',
        '2. Assess supplier alignment to objectives',
        '3. Evaluate roadmap progress',
        '4. Assess relationship health',
        '5. Review contractual commitments',
        '6. Evaluate investment alignment',
        '7. Calculate alignment score',
        '8. Document alignment assessment'
      ],
      outputFormat: 'JSON with strategic alignment'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScore', 'objectives', 'artifacts'],
      properties: {
        alignmentScore: { type: 'number' },
        objectives: { type: 'array' },
        roadmapProgress: { type: 'object' },
        relationshipHealth: { type: 'string' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'strategic']
}));

export const innovationOpportunitiesTask = defineTask('innovation-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Innovation Opportunities',
  agent: {
    name: 'innovation-analyst',
    prompt: {
      role: 'Innovation Opportunity Analyst',
      task: 'Identify innovation and value creation opportunities',
      context: args,
      instructions: [
        '1. Identify cost reduction opportunities',
        '2. Identify process improvement opportunities',
        '3. Identify technology opportunities',
        '4. Identify new product/service opportunities',
        '5. Evaluate supplier innovation capabilities',
        '6. Prioritize opportunities by value',
        '7. Create innovation pipeline',
        '8. Document opportunities'
      ],
      outputFormat: 'JSON with innovation opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'pipeline', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        pipeline: { type: 'object' },
        costReduction: { type: 'array' },
        processImprovement: { type: 'array' },
        technology: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'innovation']
}));

export const qbrPresentationTask = defineTask('qbr-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: QBR Presentation Preparation',
  agent: {
    name: 'presentation-creator',
    prompt: {
      role: 'QBR Presentation Specialist',
      task: 'Create QBR presentation package',
      context: args,
      instructions: [
        '1. Create executive summary slide',
        '2. Create performance scorecard slides',
        '3. Create trend analysis slides',
        '4. Create action item status slides',
        '5. Create strategic alignment slides',
        '6. Create innovation pipeline slides',
        '7. Create discussion topics section',
        '8. Compile presentation package'
      ],
      outputFormat: 'JSON with presentation package'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'slides', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        slides: { type: 'array' },
        executiveSummary: { type: 'object' },
        discussionTopics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'presentation']
}));

export const agendaLogisticsTask = defineTask('agenda-logistics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Agenda and Logistics',
  agent: {
    name: 'meeting-planner',
    prompt: {
      role: 'Meeting Planning Coordinator',
      task: 'Set up QBR agenda and logistics',
      context: args,
      instructions: [
        '1. Create detailed agenda',
        '2. Allocate time for each topic',
        '3. Identify presenters for each section',
        '4. Send meeting invitations',
        '5. Arrange meeting logistics',
        '6. Distribute pre-read materials',
        '7. Confirm attendees',
        '8. Document logistics'
      ],
      outputFormat: 'JSON with agenda and logistics'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'logistics', 'artifacts'],
      properties: {
        agenda: { type: 'array' },
        logistics: { type: 'object' },
        presenters: { type: 'object' },
        preReadMaterials: { type: 'array' },
        confirmedAttendees: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'logistics']
}));

export const qbrDocumentationTask = defineTask('qbr-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: QBR Documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'QBR Documentation Specialist',
      task: 'Create QBR documentation package',
      context: args,
      instructions: [
        '1. Create QBR minutes template',
        '2. Prepare decision tracking sheet',
        '3. Create new action item template',
        '4. Prepare supplier feedback form',
        '5. Create follow-up communication template',
        '6. Identify decisions required',
        '7. Prepare draft action items',
        '8. Compile documentation package'
      ],
      outputFormat: 'JSON with QBR documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionsRequired', 'newActionItems', 'artifacts'],
      properties: {
        decisionsRequired: { type: 'array' },
        newActionItems: { type: 'array' },
        minutesTemplate: { type: 'object' },
        feedbackForm: { type: 'object' },
        followUpTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'qbr', 'documentation']
}));
