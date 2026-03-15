/**
 * @process domains/business/knowledge-management/knowledge-audit-assessment
 * @description Conduct comprehensive knowledge audits to inventory knowledge assets, identify gaps, assess maturity, and inform strategy
 * @specialization Knowledge Management
 * @category Knowledge Governance and Strategy
 * @inputs { auditScope: object, organizationalContext: object, existingAssets: array, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, auditReport: object, knowledgeInventory: array, gapAnalysis: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    auditScope = {},
    organizationalContext = {},
    existingAssets = [],
    stakeholders = [],
    auditFramework = {
      methodology: 'comprehensive',
      dimensions: ['content', 'people', 'process', 'technology']
    },
    comparisonBenchmarks = {},
    outputDir = 'knowledge-audit-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Audit and Assessment Process');

  // ============================================================================
  // PHASE 1: AUDIT PLANNING AND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning and designing knowledge audit');
  const auditPlanning = await ctx.task(auditPlanningTask, {
    auditScope,
    organizationalContext,
    auditFramework,
    stakeholders,
    outputDir
  });

  artifacts.push(...auditPlanning.artifacts);

  // Breakpoint: Review audit plan
  await ctx.breakpoint({
    question: `Audit plan created covering ${auditPlanning.auditAreas.length} areas. Review plan?`,
    title: 'Audit Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        auditAreas: auditPlanning.auditAreas.length,
        methodology: auditPlanning.methodology
      }
    }
  });

  // ============================================================================
  // PHASE 2: KNOWLEDGE ASSET INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Inventorying knowledge assets');
  const knowledgeInventory = await ctx.task(knowledgeInventoryTask, {
    auditScope,
    existingAssets,
    auditAreas: auditPlanning.auditAreas,
    outputDir
  });

  artifacts.push(...knowledgeInventory.artifacts);

  // ============================================================================
  // PHASE 3: KNOWLEDGE FLOW ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing knowledge flows');
  const knowledgeFlowAnalysis = await ctx.task(knowledgeFlowAnalysisTask, {
    inventory: knowledgeInventory.inventory,
    organizationalContext,
    outputDir
  });

  artifacts.push(...knowledgeFlowAnalysis.artifacts);

  // Breakpoint: Review inventory and flows
  await ctx.breakpoint({
    question: `Inventoried ${knowledgeInventory.inventory.length} knowledge assets. Review?`,
    title: 'Knowledge Inventory Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        assetsInventoried: knowledgeInventory.inventory.length,
        knowledgeFlows: knowledgeFlowAnalysis.flows.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: KNOWLEDGE GAP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying knowledge gaps');
  const gapIdentification = await ctx.task(gapIdentificationTask, {
    inventory: knowledgeInventory.inventory,
    organizationalContext,
    auditScope,
    outputDir
  });

  artifacts.push(...gapIdentification.artifacts);

  // ============================================================================
  // PHASE 5: MATURITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing KM maturity');
  const maturityAssessment = await ctx.task(maturityAssessmentTask, {
    inventory: knowledgeInventory.inventory,
    flows: knowledgeFlowAnalysis.flows,
    auditFramework,
    comparisonBenchmarks,
    outputDir
  });

  artifacts.push(...maturityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: QUALITY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating knowledge quality');
  const qualityEvaluation = await ctx.task(qualityEvaluationTask, {
    inventory: knowledgeInventory.inventory,
    outputDir
  });

  artifacts.push(...qualityEvaluation.artifacts);

  // ============================================================================
  // PHASE 7: STAKEHOLDER INPUT COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Collecting stakeholder input');
  const stakeholderInput = await ctx.task(stakeholderInputTask, {
    stakeholders,
    auditAreas: auditPlanning.auditAreas,
    gaps: gapIdentification.gaps,
    outputDir
  });

  artifacts.push(...stakeholderInput.artifacts);

  // ============================================================================
  // PHASE 8: RECOMMENDATIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing recommendations');
  const recommendationsDevelopment = await ctx.task(recommendationsDevelopmentTask, {
    gaps: gapIdentification.gaps,
    maturityAssessment: maturityAssessment.assessment,
    qualityEvaluation: qualityEvaluation.evaluation,
    stakeholderInput: stakeholderInput.input,
    outputDir
  });

  artifacts.push(...recommendationsDevelopment.artifacts);

  // ============================================================================
  // PHASE 9: AUDIT REPORT COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Compiling audit report');
  const auditReport = await ctx.task(auditReportTask, {
    auditScope,
    inventory: knowledgeInventory.inventory,
    flows: knowledgeFlowAnalysis.flows,
    gaps: gapIdentification.gaps,
    maturityAssessment: maturityAssessment.assessment,
    qualityEvaluation: qualityEvaluation.evaluation,
    recommendations: recommendationsDevelopment.recommendations,
    outputDir
  });

  artifacts.push(...auditReport.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      auditReport: auditReport.report,
      recommendations: recommendationsDevelopment.recommendations,
      maturityLevel: maturityAssessment.overallMaturityLevel,
      stakeholders,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize audit?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          maturityLevel: maturityAssessment.overallMaturityLevel,
          gapsIdentified: gapIdentification.gaps.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    auditReport: auditReport.report,
    knowledgeInventory: knowledgeInventory.inventory,
    gapAnalysis: {
      gaps: gapIdentification.gaps,
      criticalGaps: gapIdentification.criticalGaps
    },
    maturityAssessment: maturityAssessment.assessment,
    recommendations: recommendationsDevelopment.recommendations,
    statistics: {
      assetsInventoried: knowledgeInventory.inventory.length,
      flowsAnalyzed: knowledgeFlowAnalysis.flows.length,
      gapsIdentified: gapIdentification.gaps.length,
      recommendationsGenerated: recommendationsDevelopment.recommendations.length,
      overallMaturityLevel: maturityAssessment.overallMaturityLevel
    },
    qualityScore: qualityEvaluation.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/knowledge-audit-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Audit Planning
export const auditPlanningTask = defineTask('audit-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan and design knowledge audit',
  agent: {
    name: 'audit-planner',
    prompt: {
      role: 'knowledge audit planner',
      task: 'Plan and design comprehensive knowledge audit',
      context: args,
      instructions: [
        'Plan knowledge audit:',
        '  - Define audit scope and objectives',
        '  - Select audit methodology',
        '  - Identify audit areas',
        '  - Design data collection approach',
        '  - Plan stakeholder engagement',
        'Create audit schedule',
        'Define success criteria',
        'Save audit plan to output directory'
      ],
      outputFormat: 'JSON with auditPlan (object), auditAreas (array), methodology (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['auditPlan', 'auditAreas', 'methodology', 'artifacts'],
      properties: {
        auditPlan: { type: 'object' },
        auditAreas: { type: 'array' },
        methodology: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'audit', 'planning']
}));

// Task 2: Knowledge Inventory
export const knowledgeInventoryTask = defineTask('knowledge-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory knowledge assets',
  agent: {
    name: 'inventory-specialist',
    prompt: {
      role: 'knowledge asset inventory specialist',
      task: 'Create comprehensive knowledge asset inventory',
      context: args,
      instructions: [
        'Inventory knowledge assets:',
        '  - Document repositories',
        '  - Knowledge bases',
        '  - Expert knowledge',
        '  - Process documentation',
        '  - Training materials',
        '  - Databases and systems',
        'Categorize by type and domain',
        'Assess asset metadata completeness',
        'Identify undocumented knowledge',
        'Save inventory to output directory'
      ],
      outputFormat: 'JSON with inventory (array), categories (object), undocumentedAreas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inventory', 'artifacts'],
      properties: {
        inventory: { type: 'array' },
        categories: { type: 'object' },
        undocumentedAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'inventory', 'assets']
}));

// Task 3: Knowledge Flow Analysis
export const knowledgeFlowAnalysisTask = defineTask('knowledge-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge flows',
  agent: {
    name: 'flow-analyst',
    prompt: {
      role: 'knowledge flow analyst',
      task: 'Analyze knowledge flows across organization',
      context: args,
      instructions: [
        'Analyze knowledge flows:',
        '  - Knowledge creation patterns',
        '  - Knowledge sharing channels',
        '  - Knowledge consumption patterns',
        '  - Informal knowledge networks',
        'Identify bottlenecks and barriers',
        'Map knowledge flow paths',
        'Assess flow efficiency',
        'Save flow analysis to output directory'
      ],
      outputFormat: 'JSON with flows (array), flowMap (object), bottlenecks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['flows', 'artifacts'],
      properties: {
        flows: { type: 'array' },
        flowMap: { type: 'object' },
        bottlenecks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'analysis', 'flows']
}));

// Task 4: Gap Identification
export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify knowledge gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'knowledge gap analyst',
      task: 'Identify knowledge gaps in organization',
      context: args,
      instructions: [
        'Identify knowledge gaps:',
        '  - Missing knowledge assets',
        '  - Outdated content',
        '  - Undocumented processes',
        '  - Expertise gaps',
        '  - Coverage gaps by domain',
        'Categorize gaps by severity',
        'Identify critical gaps',
        'Prioritize gap remediation',
        'Save gap analysis to output directory'
      ],
      outputFormat: 'JSON with gaps (array), criticalGaps (array), gapPrioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'criticalGaps', 'artifacts'],
      properties: {
        gaps: { type: 'array' },
        criticalGaps: { type: 'array' },
        gapPrioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'gaps', 'analysis']
}));

// Task 5: Maturity Assessment
export const maturityAssessmentTask = defineTask('maturity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess KM maturity',
  agent: {
    name: 'maturity-assessor',
    prompt: {
      role: 'KM maturity assessor',
      task: 'Assess knowledge management maturity',
      context: args,
      instructions: [
        'Assess KM maturity across dimensions:',
        '  - People and culture',
        '  - Process maturity',
        '  - Technology enablement',
        '  - Content management',
        '  - Governance and strategy',
        'Apply maturity model framework',
        'Calculate maturity scores',
        'Compare against benchmarks',
        'Save maturity assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (object), overallMaturityLevel (string), dimensionScores (object), benchmarkComparison (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'overallMaturityLevel', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        overallMaturityLevel: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimizing'] },
        dimensionScores: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'maturity', 'assessment']
}));

// Task 6: Quality Evaluation
export const qualityEvaluationTask = defineTask('quality-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate knowledge quality',
  agent: {
    name: 'quality-evaluator',
    prompt: {
      role: 'knowledge quality evaluator',
      task: 'Evaluate quality of knowledge assets',
      context: args,
      instructions: [
        'Evaluate knowledge quality:',
        '  - Accuracy and validity',
        '  - Currency and timeliness',
        '  - Completeness',
        '  - Accessibility',
        '  - Usability',
        'Sample and assess assets',
        'Calculate quality scores',
        'Identify quality issues',
        'Save quality evaluation to output directory'
      ],
      outputFormat: 'JSON with evaluation (object), overallScore (number 0-100), qualityIssues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluation', 'overallScore', 'artifacts'],
      properties: {
        evaluation: { type: 'object' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'evaluation']
}));

// Task 7: Stakeholder Input
export const stakeholderInputTask = defineTask('stakeholder-input', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect stakeholder input',
  agent: {
    name: 'input-collector',
    prompt: {
      role: 'stakeholder input collector',
      task: 'Collect and synthesize stakeholder input',
      context: args,
      instructions: [
        'Collect stakeholder input:',
        '  - Knowledge needs and challenges',
        '  - Pain points and frustrations',
        '  - Improvement suggestions',
        '  - Priority areas',
        'Design input collection methods',
        'Synthesize feedback',
        'Identify common themes',
        'Save stakeholder input to output directory'
      ],
      outputFormat: 'JSON with input (object), themes (array), priorityAreas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['input', 'artifacts'],
      properties: {
        input: { type: 'object' },
        themes: { type: 'array' },
        priorityAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder', 'input']
}));

// Task 8: Recommendations Development
export const recommendationsDevelopmentTask = defineTask('recommendations-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations',
  agent: {
    name: 'recommendations-developer',
    prompt: {
      role: 'audit recommendations developer',
      task: 'Develop actionable recommendations from audit findings',
      context: args,
      instructions: [
        'Develop recommendations:',
        '  - Address identified gaps',
        '  - Improve maturity level',
        '  - Enhance quality',
        '  - Address stakeholder needs',
        'Prioritize recommendations',
        'Estimate effort and impact',
        'Create implementation guidance',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array), prioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'recommendations', 'development']
}));

// Task 9: Audit Report
export const auditReportTask = defineTask('audit-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile audit report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'knowledge audit report writer',
      task: 'Compile comprehensive audit report',
      context: args,
      instructions: [
        'Compile audit report:',
        '  - Executive summary',
        '  - Audit methodology',
        '  - Knowledge inventory findings',
        '  - Gap analysis',
        '  - Maturity assessment',
        '  - Quality evaluation',
        '  - Recommendations',
        '  - Appendices',
        'Create visualizations',
        'Save audit report to output directory'
      ],
      outputFormat: 'JSON with report (object), sections (array), visualizations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        sections: { type: 'array' },
        visualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'audit', 'report']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present audit findings to stakeholders',
        'Review key findings and gaps',
        'Present maturity assessment',
        'Present recommendations',
        'Gather stakeholder feedback',
        'Obtain approval or identify changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
