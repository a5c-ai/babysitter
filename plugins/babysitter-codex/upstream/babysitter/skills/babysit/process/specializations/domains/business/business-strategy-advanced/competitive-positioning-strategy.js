/**
 * @process business-strategy/competitive-positioning-strategy
 * @description Development of competitive positioning using Porter's generic strategies framework (cost leadership, differentiation, focus)
 * @inputs { organizationName: string, marketAnalysis: object, competitorData: array, capabilities: object }
 * @outputs { success: boolean, positioningAssessment: object, genericStrategy: string, positioningStatement: string, implementationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    marketAnalysis = {},
    competitorData = [],
    capabilities = {},
    outputDir = 'positioning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Competitive Positioning Strategy for ${organizationName}`);

  // ============================================================================
  // PHASE 1: CURRENT POSITION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current competitive position');
  const currentPosition = await ctx.task(currentPositionAssessmentTask, {
    organizationName,
    marketAnalysis,
    competitorData,
    capabilities,
    outputDir
  });

  artifacts.push(...currentPosition.artifacts);

  // ============================================================================
  // PHASE 2: COST LEADERSHIP ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing cost leadership opportunities');
  const costLeadershipAnalysis = await ctx.task(costLeadershipAssessmentTask, {
    organizationName,
    capabilities,
    competitorData,
    currentPosition,
    outputDir
  });

  artifacts.push(...costLeadershipAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DIFFERENTIATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing differentiation opportunities');
  const differentiationAnalysis = await ctx.task(differentiationAssessmentTask, {
    organizationName,
    capabilities,
    marketAnalysis,
    competitorData,
    currentPosition,
    outputDir
  });

  artifacts.push(...differentiationAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: FOCUS STRATEGY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing focus strategy options');
  const focusStrategyAnalysis = await ctx.task(focusStrategyAssessmentTask, {
    organizationName,
    marketAnalysis,
    capabilities,
    competitorData,
    currentPosition,
    outputDir
  });

  artifacts.push(...focusStrategyAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: STUCK IN THE MIDDLE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing stuck in the middle risks');
  const stuckInMiddleAnalysis = await ctx.task(stuckInMiddleAnalysisTask, {
    organizationName,
    currentPosition,
    costLeadershipAnalysis,
    differentiationAnalysis,
    focusStrategyAnalysis,
    outputDir
  });

  artifacts.push(...stuckInMiddleAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Selecting optimal generic strategy');
  const strategySelection = await ctx.task(strategySelectionTask, {
    organizationName,
    capabilities,
    costLeadershipAnalysis,
    differentiationAnalysis,
    focusStrategyAnalysis,
    stuckInMiddleAnalysis,
    outputDir
  });

  artifacts.push(...strategySelection.artifacts);

  // ============================================================================
  // PHASE 7: POSITIONING STATEMENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing positioning statement and value proposition');
  const positioningStatement = await ctx.task(positioningStatementTask, {
    organizationName,
    strategySelection,
    marketAnalysis,
    outputDir
  });

  artifacts.push(...positioningStatement.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating positioning implementation roadmap');
  const implementationRoadmap = await ctx.task(positioningImplementationTask, {
    organizationName,
    strategySelection,
    positioningStatement,
    capabilities,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive positioning strategy report');
  const positioningReport = await ctx.task(positioningReportTask, {
    organizationName,
    currentPosition,
    costLeadershipAnalysis,
    differentiationAnalysis,
    focusStrategyAnalysis,
    stuckInMiddleAnalysis,
    strategySelection,
    positioningStatement,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...positioningReport.artifacts);

  // Breakpoint: Review positioning strategy
  await ctx.breakpoint({
    question: `Competitive positioning strategy complete for ${organizationName}. Recommended strategy: ${strategySelection.recommendedStrategy}. Review and approve?`,
    title: 'Competitive Positioning Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        currentPosition: currentPosition.positionSummary,
        recommendedStrategy: strategySelection.recommendedStrategy,
        positioningStatement: positioningStatement.statement,
        strategyFitScore: strategySelection.fitScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    positioningAssessment: {
      currentPosition: currentPosition.assessment,
      costLeadershipViability: costLeadershipAnalysis.viabilityScore,
      differentiationViability: differentiationAnalysis.viabilityScore,
      focusStrategyViability: focusStrategyAnalysis.viabilityScore
    },
    genericStrategy: strategySelection.recommendedStrategy,
    strategyRationale: strategySelection.rationale,
    positioningStatement: positioningStatement.statement,
    valueProposition: positioningStatement.valueProposition,
    implementationPlan: implementationRoadmap.plan,
    reportPath: positioningReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/competitive-positioning-strategy',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current Position Assessment
export const currentPositionAssessmentTask = defineTask('current-position-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current competitive position',
  agent: {
    name: 'position-analyst',
    prompt: {
      role: 'competitive strategy analyst',
      task: 'Assess current competitive position and market dynamics',
      context: args,
      instructions: [
        'Analyze current market position and share',
        'Assess competitive advantages and disadvantages',
        'Evaluate price-value position relative to competitors',
        'Analyze customer perception and brand positioning',
        'Assess target segment alignment',
        'Evaluate competitive dynamics and intensity',
        'Identify current strategic direction (explicit or implicit)',
        'Assess sustainability of current position',
        'Generate current position assessment report'
      ],
      outputFormat: 'JSON with assessment, positionSummary, marketShare, competitiveAdvantages, competitiveDisadvantages, customerPerception, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'positionSummary', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        positionSummary: { type: 'string' },
        marketShare: { type: 'string' },
        competitiveAdvantages: { type: 'array', items: { type: 'string' } },
        competitiveDisadvantages: { type: 'array', items: { type: 'string' } },
        customerPerception: { type: 'object' },
        strategicDirection: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'current-position']
}));

// Task 2: Cost Leadership Assessment
export const costLeadershipAssessmentTask = defineTask('cost-leadership-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess cost leadership opportunities',
  agent: {
    name: 'cost-strategy-analyst',
    prompt: {
      role: 'cost strategy specialist',
      task: 'Assess viability and opportunities for cost leadership strategy',
      context: args,
      instructions: [
        'Analyze economies of scale potential',
        'Assess operational efficiency opportunities',
        'Evaluate cost control capabilities',
        'Analyze supply chain cost advantages',
        'Assess technology and automation potential',
        'Evaluate learning curve benefits',
        'Assess capacity utilization optimization',
        'Compare cost structure to competitors',
        'Score cost leadership viability (0-100)',
        'Generate cost leadership assessment report'
      ],
      outputFormat: 'JSON with viabilityScore, costAdvantages, costDisadvantages, opportunities, requirements, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['viabilityScore', 'artifacts'],
      properties: {
        viabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        costAdvantages: { type: 'array', items: { type: 'string' } },
        costDisadvantages: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        requirements: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'cost-leadership']
}));

// Task 3: Differentiation Assessment
export const differentiationAssessmentTask = defineTask('differentiation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess differentiation opportunities',
  agent: {
    name: 'differentiation-analyst',
    prompt: {
      role: 'differentiation strategy specialist',
      task: 'Assess viability and opportunities for differentiation strategy',
      context: args,
      instructions: [
        'Analyze product/service differentiation potential',
        'Assess brand and reputation differentiation',
        'Evaluate technology and innovation differentiation',
        'Analyze customer service differentiation',
        'Assess distribution and channel differentiation',
        'Evaluate quality differentiation potential',
        'Analyze design and aesthetics differentiation',
        'Assess customer willingness to pay premium',
        'Score differentiation viability (0-100)',
        'Generate differentiation assessment report'
      ],
      outputFormat: 'JSON with viabilityScore, differentiationOpportunities, uniqueCapabilities, premiumPotential, requirements, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['viabilityScore', 'artifacts'],
      properties: {
        viabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        differentiationOpportunities: { type: 'array', items: { type: 'object' } },
        uniqueCapabilities: { type: 'array', items: { type: 'string' } },
        premiumPotential: { type: 'string' },
        requirements: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'differentiation']
}));

// Task 4: Focus Strategy Assessment
export const focusStrategyAssessmentTask = defineTask('focus-strategy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess focus strategy options',
  agent: {
    name: 'focus-strategy-analyst',
    prompt: {
      role: 'niche strategy specialist',
      task: 'Assess viability of focus strategy (cost focus or differentiation focus)',
      context: args,
      instructions: [
        'Identify attractive niche segments',
        'Analyze segment-specific needs and preferences',
        'Assess cost focus viability in segments',
        'Assess differentiation focus viability in segments',
        'Evaluate segment size and growth potential',
        'Analyze competitive intensity in segments',
        'Assess segment accessibility and barriers',
        'Evaluate resource requirements for focus',
        'Score focus strategy viability (0-100)',
        'Generate focus strategy assessment report'
      ],
      outputFormat: 'JSON with viabilityScore, attractiveSegments, costFocusViability, differentiationFocusViability, segmentAnalysis, requirements, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['viabilityScore', 'artifacts'],
      properties: {
        viabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        attractiveSegments: { type: 'array', items: { type: 'object' } },
        costFocusViability: { type: 'number' },
        differentiationFocusViability: { type: 'number' },
        segmentAnalysis: { type: 'array', items: { type: 'object' } },
        requirements: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'focus-strategy']
}));

// Task 5: Stuck in the Middle Analysis
export const stuckInMiddleAnalysisTask = defineTask('stuck-in-middle-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze stuck in the middle risks',
  agent: {
    name: 'strategy-risk-analyst',
    prompt: {
      role: 'competitive strategy risk analyst',
      task: 'Analyze risks of stuck in the middle positioning',
      context: args,
      instructions: [
        'Assess current positioning clarity',
        'Identify signs of stuck in the middle',
        'Analyze risk of pursuing multiple strategies',
        'Evaluate consistency of strategic signals',
        'Assess resource allocation alignment',
        'Identify capability conflicts between strategies',
        'Evaluate competitor positioning clarity',
        'Recommend strategies to avoid stuck in the middle',
        'Generate stuck in the middle risk assessment'
      ],
      outputFormat: 'JSON with riskScore, currentClarity, warningSignals, conflictingElements, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        currentClarity: { type: 'string' },
        warningSignals: { type: 'array', items: { type: 'string' } },
        conflictingElements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'stuck-in-middle']
}));

// Task 6: Strategy Selection
export const strategySelectionTask = defineTask('strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal generic strategy',
  agent: {
    name: 'strategy-selector',
    prompt: {
      role: 'chief strategy advisor',
      task: 'Select optimal generic strategy based on assessments',
      context: args,
      instructions: [
        'Compare viability scores across strategies',
        'Assess fit with organizational capabilities',
        'Evaluate market and competitive conditions',
        'Consider resource requirements and constraints',
        'Assess risk profiles of each strategy',
        'Evaluate sustainability of competitive advantage',
        'Select recommended generic strategy',
        'Provide detailed rationale for selection',
        'Identify alternative strategies as backup',
        'Generate strategy selection report'
      ],
      outputFormat: 'JSON with recommendedStrategy, fitScore, rationale, alternativeStrategies, keySuccess Factors, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedStrategy', 'fitScore', 'rationale', 'artifacts'],
      properties: {
        recommendedStrategy: { type: 'string', enum: ['cost-leadership', 'differentiation', 'cost-focus', 'differentiation-focus'] },
        fitScore: { type: 'number', minimum: 0, maximum: 100 },
        rationale: { type: 'string' },
        alternativeStrategies: { type: 'array', items: { type: 'string' } },
        keySuccessFactors: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'strategy-selection']
}));

// Task 7: Positioning Statement Development
export const positioningStatementTask = defineTask('positioning-statement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop positioning statement and value proposition',
  agent: {
    name: 'positioning-specialist',
    prompt: {
      role: 'brand positioning and value proposition specialist',
      task: 'Develop positioning statement and value proposition',
      context: args,
      instructions: [
        'Define target customer segment clearly',
        'Articulate frame of reference (category)',
        'Identify key points of differentiation',
        'Identify points of parity with competitors',
        'Craft compelling value proposition',
        'Develop positioning statement',
        'Create elevator pitch',
        'Ensure alignment with selected generic strategy',
        'Test positioning for clarity and distinctiveness',
        'Generate positioning statement document'
      ],
      outputFormat: 'JSON with statement, valueProposition, targetSegment, pointsOfDifference, pointsOfParity, elevatorPitch, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['statement', 'valueProposition', 'artifacts'],
      properties: {
        statement: { type: 'string' },
        valueProposition: { type: 'string' },
        targetSegment: { type: 'string' },
        pointsOfDifference: { type: 'array', items: { type: 'string' } },
        pointsOfParity: { type: 'array', items: { type: 'string' } },
        elevatorPitch: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'positioning-statement']
}));

// Task 8: Implementation Roadmap
export const positioningImplementationTask = defineTask('positioning-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create positioning implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'strategy implementation specialist',
      task: 'Create implementation roadmap for positioning strategy',
      context: args,
      instructions: [
        'Define strategic initiatives to achieve positioning',
        'Identify capability development requirements',
        'Plan resource allocation for implementation',
        'Define timeline and milestones',
        'Identify change management requirements',
        'Plan communication strategy (internal and external)',
        'Define KPIs and success metrics',
        'Identify risks and mitigation strategies',
        'Create governance structure',
        'Generate implementation roadmap document'
      ],
      outputFormat: 'JSON with plan, initiatives, timeline, milestones, resourceRequirements, kpis, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'initiatives', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        initiatives: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        resourceRequirements: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'implementation']
}));

// Task 9: Positioning Report Generation
export const positioningReportTask = defineTask('positioning-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive positioning strategy report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive competitive positioning strategy report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present current position assessment',
        'Document generic strategy analysis (cost, differentiation, focus)',
        'Present stuck in the middle analysis',
        'Document strategy selection and rationale',
        'Include positioning statement and value proposition',
        'Present implementation roadmap',
        'Include visualizations and frameworks',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'positioning', 'reporting']
}));
