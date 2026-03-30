/**
 * @process venture-capital/exit-readiness-assessment
 * @description Comprehensive evaluation of company readiness for exit including financial performance, market positioning, governance maturity, and buyer universe analysis
 * @inputs { companyName: string, companyData: object, exitHorizon: string, exitPreferences: object }
 * @outputs { success: boolean, readinessScore: object, gapAnalysis: object, buyerUniverse: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    companyData = {},
    exitHorizon = '12-24 months',
    exitPreferences = {},
    outputDir = 'exit-readiness-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Financial Readiness Assessment
  ctx.log('info', 'Assessing financial readiness');
  const financialReadiness = await ctx.task(financialReadinessTask, {
    companyName,
    companyData,
    exitHorizon,
    outputDir
  });

  if (!financialReadiness.success) {
    return {
      success: false,
      error: 'Financial readiness assessment failed',
      details: financialReadiness,
      metadata: { processId: 'venture-capital/exit-readiness-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...financialReadiness.artifacts);

  // Task 2: Market Positioning Assessment
  ctx.log('info', 'Assessing market positioning');
  const marketPositioning = await ctx.task(marketPositioningTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...marketPositioning.artifacts);

  // Task 3: Governance and Operations Maturity
  ctx.log('info', 'Assessing governance maturity');
  const governanceMaturity = await ctx.task(governanceMaturityTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...governanceMaturity.artifacts);

  // Task 4: Management Team Assessment
  ctx.log('info', 'Assessing management team');
  const managementAssessment = await ctx.task(managementReadinessTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...managementAssessment.artifacts);

  // Task 5: Buyer Universe Analysis
  ctx.log('info', 'Analyzing buyer universe');
  const buyerAnalysis = await ctx.task(buyerUniverseTask, {
    companyName,
    companyData,
    exitPreferences,
    outputDir
  });

  artifacts.push(...buyerAnalysis.artifacts);

  // Task 6: Exit Valuation Analysis
  ctx.log('info', 'Analyzing exit valuation');
  const valuationAnalysis = await ctx.task(exitValuationTask, {
    companyName,
    companyData,
    financialReadiness,
    marketPositioning,
    buyerAnalysis,
    outputDir
  });

  artifacts.push(...valuationAnalysis.artifacts);

  // Breakpoint: Review exit readiness
  await ctx.breakpoint({
    question: `Exit readiness assessment complete for ${companyName}. Overall readiness: ${financialReadiness.score}/100. ${buyerAnalysis.potentialBuyers.length} potential buyers identified. Review assessment?`,
    title: 'Exit Readiness Assessment Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        financialReadiness: financialReadiness.score,
        marketPositioning: marketPositioning.score,
        governanceMaturity: governanceMaturity.score,
        managementReadiness: managementAssessment.score,
        potentialBuyers: buyerAnalysis.potentialBuyers.length,
        valuationRange: valuationAnalysis.range
      }
    }
  });

  // Task 7: Gap Analysis and Recommendations
  ctx.log('info', 'Conducting gap analysis');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    financialReadiness,
    marketPositioning,
    governanceMaturity,
    managementAssessment,
    exitHorizon,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Task 8: Generate Exit Readiness Report
  ctx.log('info', 'Generating exit readiness report');
  const readinessReport = await ctx.task(exitReadinessReportTask, {
    companyName,
    financialReadiness,
    marketPositioning,
    governanceMaturity,
    managementAssessment,
    buyerAnalysis,
    valuationAnalysis,
    gapAnalysis,
    exitHorizon,
    outputDir
  });

  artifacts.push(...readinessReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    readinessScore: {
      overall: gapAnalysis.overallReadiness,
      financial: financialReadiness.score,
      market: marketPositioning.score,
      governance: governanceMaturity.score,
      management: managementAssessment.score
    },
    gapAnalysis: {
      gaps: gapAnalysis.gaps,
      criticalGaps: gapAnalysis.criticalGaps,
      recommendations: gapAnalysis.recommendations,
      timeline: gapAnalysis.timeline
    },
    buyerUniverse: {
      strategic: buyerAnalysis.strategicBuyers,
      financial: buyerAnalysis.financialBuyers,
      potentialBuyers: buyerAnalysis.potentialBuyers,
      tier1Buyers: buyerAnalysis.tier1
    },
    valuationRange: valuationAnalysis.range,
    exitPaths: buyerAnalysis.exitPaths,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/exit-readiness-assessment',
      timestamp: startTime,
      companyName,
      exitHorizon
    }
  };
}

// Task 1: Financial Readiness Assessment
export const financialReadinessTask = defineTask('financial-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess financial readiness',
  agent: {
    name: 'financial-assessor',
    prompt: {
      role: 'exit readiness financial analyst',
      task: 'Assess financial readiness for exit',
      context: args,
      instructions: [
        'Evaluate revenue scale and growth trajectory',
        'Assess profitability and path to profitability',
        'Review unit economics maturity',
        'Evaluate financial reporting quality',
        'Assess audit readiness',
        'Review working capital management',
        'Evaluate forecasting accuracy',
        'Score overall financial readiness'
      ],
      outputFormat: 'JSON with financial readiness assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        gaps: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'financial']
}));

// Task 2: Market Positioning Assessment
export const marketPositioningTask = defineTask('market-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess market positioning',
  agent: {
    name: 'market-assessor',
    prompt: {
      role: 'market positioning analyst',
      task: 'Assess market positioning for exit',
      context: args,
      instructions: [
        'Evaluate market leadership position',
        'Assess competitive differentiation',
        'Review brand and reputation',
        'Evaluate customer concentration',
        'Assess market share and momentum',
        'Review strategic value to acquirers',
        'Evaluate market timing',
        'Score overall market positioning'
      ],
      outputFormat: 'JSON with market positioning assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        competitivePosition: { type: 'object' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'market']
}));

// Task 3: Governance Maturity Assessment
export const governanceMaturityTask = defineTask('governance-maturity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess governance maturity',
  agent: {
    name: 'governance-assessor',
    prompt: {
      role: 'corporate governance specialist',
      task: 'Assess governance and operational maturity',
      context: args,
      instructions: [
        'Evaluate board composition and effectiveness',
        'Assess corporate governance practices',
        'Review compliance and legal readiness',
        'Evaluate internal controls',
        'Assess HR and organizational maturity',
        'Review intellectual property protection',
        'Evaluate operational scalability',
        'Score governance maturity'
      ],
      outputFormat: 'JSON with governance assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        controls: { type: 'object' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'governance']
}));

// Task 4: Management Readiness Assessment
export const managementReadinessTask = defineTask('management-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess management readiness',
  agent: {
    name: 'management-assessor',
    prompt: {
      role: 'management assessment specialist',
      task: 'Assess management team readiness for exit',
      context: args,
      instructions: [
        'Evaluate CEO readiness for exit process',
        'Assess management depth and succession',
        'Review retention and incentive alignment',
        'Evaluate transaction experience',
        'Assess bandwidth for exit process',
        'Review management presentation readiness',
        'Evaluate integration planning capability',
        'Score management readiness'
      ],
      outputFormat: 'JSON with management assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        keyPersonRisks: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'management']
}));

// Task 5: Buyer Universe Analysis
export const buyerUniverseTask = defineTask('buyer-universe', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze buyer universe',
  agent: {
    name: 'buyer-analyst',
    prompt: {
      role: 'M&A buyer analysis specialist',
      task: 'Analyze potential buyer universe',
      context: args,
      instructions: [
        'Identify strategic acquirer candidates',
        'Identify financial buyer candidates',
        'Assess buyer strategic fit',
        'Evaluate buyer acquisition capacity',
        'Analyze prior buyer M&A activity',
        'Assess buyer integration capabilities',
        'Tier buyers by likelihood and fit',
        'Identify potential exit paths'
      ],
      outputFormat: 'JSON with buyer analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialBuyers', 'strategicBuyers', 'financialBuyers', 'artifacts'],
      properties: {
        potentialBuyers: { type: 'array' },
        strategicBuyers: { type: 'array' },
        financialBuyers: { type: 'array' },
        tier1: { type: 'array' },
        exitPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'buyers']
}));

// Task 6: Exit Valuation Analysis
export const exitValuationTask = defineTask('exit-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze exit valuation',
  agent: {
    name: 'valuation-analyst',
    prompt: {
      role: 'exit valuation specialist',
      task: 'Analyze potential exit valuation range',
      context: args,
      instructions: [
        'Analyze comparable M&A transactions',
        'Apply relevant valuation multiples',
        'Consider strategic premium potential',
        'Assess financial buyer valuation',
        'Model different exit scenarios',
        'Calculate valuation range',
        'Identify valuation drivers',
        'Document valuation methodology'
      ],
      outputFormat: 'JSON with valuation analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['range', 'methodology', 'artifacts'],
      properties: {
        range: { type: 'object' },
        methodology: { type: 'object' },
        comparables: { type: 'array' },
        drivers: { type: 'array' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'valuation']
}));

// Task 7: Gap Analysis
export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct gap analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'exit readiness consultant',
      task: 'Conduct exit readiness gap analysis',
      context: args,
      instructions: [
        'Consolidate gaps across all areas',
        'Prioritize gaps by impact on exit',
        'Identify critical path items',
        'Create remediation recommendations',
        'Develop timeline for gap closure',
        'Estimate resources required',
        'Calculate overall readiness score',
        'Create readiness improvement roadmap'
      ],
      outputFormat: 'JSON with gap analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallReadiness', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        overallReadiness: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array' },
        criticalGaps: { type: 'array' },
        recommendations: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'gap-analysis']
}));

// Task 8: Exit Readiness Report
export const exitReadinessReportTask = defineTask('exit-readiness-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate exit readiness report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'exit planning specialist',
      task: 'Generate comprehensive exit readiness report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present readiness scores by category',
        'Document buyer universe analysis',
        'Include valuation analysis',
        'Present gap analysis findings',
        'Include recommendations roadmap',
        'Document timeline and milestones',
        'Format for board presentation'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        readinessScores: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'exit-readiness', 'reporting']
}));
