/**
 * @process venture-capital/comparable-analysis
 * @description Valuation using public company trading multiples and precedent transaction multiples including peer selection, normalization, and multiple application
 * @inputs { companyName: string, financials: object, industry: string, stage: string }
 * @outputs { success: boolean, tradingComps: object, transactionComps: object, valuationRange: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    financials = {},
    industry,
    stage = 'growth',
    outputDir = 'comparable-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Public Company Peer Selection
  ctx.log('info', 'Selecting public company peers');
  const peerSelection = await ctx.task(peerSelectionTask, {
    companyName,
    industry,
    financials,
    stage,
    outputDir
  });

  if (!peerSelection.success) {
    return {
      success: false,
      error: 'Peer selection failed',
      details: peerSelection,
      metadata: { processId: 'venture-capital/comparable-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...peerSelection.artifacts);

  // Task 2: Trading Multiple Analysis
  ctx.log('info', 'Analyzing trading multiples');
  const tradingAnalysis = await ctx.task(tradingMultipleTask, {
    peers: peerSelection.peers,
    financials,
    outputDir
  });

  artifacts.push(...tradingAnalysis.artifacts);

  // Task 3: Precedent Transaction Identification
  ctx.log('info', 'Identifying precedent transactions');
  const transactionIdentification = await ctx.task(transactionIdentificationTask, {
    industry,
    stage,
    financials,
    outputDir
  });

  artifacts.push(...transactionIdentification.artifacts);

  // Task 4: Transaction Multiple Analysis
  ctx.log('info', 'Analyzing transaction multiples');
  const transactionAnalysis = await ctx.task(transactionMultipleTask, {
    transactions: transactionIdentification.transactions,
    financials,
    outputDir
  });

  artifacts.push(...transactionAnalysis.artifacts);

  // Task 5: Multiple Normalization
  ctx.log('info', 'Normalizing multiples');
  const normalization = await ctx.task(multipleNormalizationTask, {
    tradingAnalysis,
    transactionAnalysis,
    financials,
    outputDir
  });

  artifacts.push(...normalization.artifacts);

  // Task 6: Valuation Range Calculation
  ctx.log('info', 'Calculating valuation range');
  const valuationRange = await ctx.task(valuationRangeTask, {
    tradingMultiples: normalization.normalizedTrading,
    transactionMultiples: normalization.normalizedTransaction,
    financials,
    outputDir
  });

  artifacts.push(...valuationRange.artifacts);

  // Breakpoint: Review comparable analysis
  await ctx.breakpoint({
    question: `Comparable analysis complete for ${companyName}. Valuation range: $${valuationRange.lowValue}M - $${valuationRange.highValue}M. Review analysis?`,
    title: 'Comparable Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        peerCount: peerSelection.peers.length,
        transactionCount: transactionIdentification.transactions.length,
        medianTradingMultiple: tradingAnalysis.medianMultiple,
        medianTransactionMultiple: transactionAnalysis.medianMultiple,
        valuationRange: { low: valuationRange.lowValue, mid: valuationRange.midValue, high: valuationRange.highValue }
      }
    }
  });

  // Task 7: Generate Comparable Analysis Report
  ctx.log('info', 'Generating comparable analysis report');
  const compReport = await ctx.task(comparableReportTask, {
    companyName,
    peerSelection,
    tradingAnalysis,
    transactionIdentification,
    transactionAnalysis,
    normalization,
    valuationRange,
    outputDir
  });

  artifacts.push(...compReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    tradingComps: {
      peers: peerSelection.peers,
      multiples: tradingAnalysis.multiples,
      median: tradingAnalysis.medianMultiple,
      mean: tradingAnalysis.meanMultiple
    },
    transactionComps: {
      transactions: transactionIdentification.transactions,
      multiples: transactionAnalysis.multiples,
      median: transactionAnalysis.medianMultiple,
      mean: transactionAnalysis.meanMultiple
    },
    valuationRange: {
      low: valuationRange.lowValue,
      mid: valuationRange.midValue,
      high: valuationRange.highValue,
      methodology: valuationRange.methodology
    },
    normalization: normalization.adjustments,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/comparable-analysis',
      timestamp: startTime,
      companyName,
      industry
    }
  };
}

// Task 1: Peer Selection
export const peerSelectionTask = defineTask('peer-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select public company peers',
  agent: {
    name: 'peer-analyst',
    prompt: {
      role: 'equity research analyst',
      task: 'Select comparable public companies',
      context: args,
      instructions: [
        'Identify companies in same industry/sector',
        'Filter by business model similarity',
        'Consider growth rate comparability',
        'Evaluate size and scale differences',
        'Assess geographic relevance',
        'Review profitability profiles',
        'Select 8-12 best comparables',
        'Document selection rationale'
      ],
      outputFormat: 'JSON with peer list, rationale, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'peers', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        peers: { type: 'array' },
        selectionCriteria: { type: 'object' },
        rationale: { type: 'array' },
        excluded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'peer-selection']
}));

// Task 2: Trading Multiple Analysis
export const tradingMultipleTask = defineTask('trading-multiples', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze trading multiples',
  agent: {
    name: 'trading-analyst',
    prompt: {
      role: 'public markets analyst',
      task: 'Analyze trading multiples of peer companies',
      context: args,
      instructions: [
        'Gather current trading data for peers',
        'Calculate EV/Revenue multiples',
        'Calculate EV/EBITDA multiples',
        'Calculate P/E ratios if applicable',
        'Analyze multiple trends over time',
        'Identify outliers and reasons',
        'Calculate median and mean multiples',
        'Document multiple ranges'
      ],
      outputFormat: 'JSON with trading multiples and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['multiples', 'medianMultiple', 'meanMultiple', 'artifacts'],
      properties: {
        multiples: { type: 'array' },
        medianMultiple: { type: 'number' },
        meanMultiple: { type: 'number' },
        range: { type: 'object' },
        outliers: { type: 'array' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'trading']
}));

// Task 3: Precedent Transaction Identification
export const transactionIdentificationTask = defineTask('transaction-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify precedent transactions',
  agent: {
    name: 'transaction-researcher',
    prompt: {
      role: 'M&A transaction analyst',
      task: 'Identify relevant precedent transactions',
      context: args,
      instructions: [
        'Search for M&A transactions in sector',
        'Filter by deal size and type',
        'Consider timing relevance (recent preferred)',
        'Include private financing rounds',
        'Gather transaction details and terms',
        'Identify strategic vs financial buyers',
        'Select 10-15 most relevant transactions',
        'Document transaction details'
      ],
      outputFormat: 'JSON with transaction list and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transactions', 'artifacts'],
      properties: {
        transactions: { type: 'array' },
        byType: { type: 'object' },
        byYear: { type: 'object' },
        selectionCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'transactions']
}));

// Task 4: Transaction Multiple Analysis
export const transactionMultipleTask = defineTask('transaction-multiples', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze transaction multiples',
  agent: {
    name: 'ma-analyst',
    prompt: {
      role: 'M&A valuation analyst',
      task: 'Analyze multiples from precedent transactions',
      context: args,
      instructions: [
        'Calculate transaction multiples',
        'Analyze EV/Revenue and EV/EBITDA',
        'Consider control premiums paid',
        'Assess strategic vs financial premiums',
        'Identify outliers and reasons',
        'Calculate median and mean multiples',
        'Analyze trends over time',
        'Document multiple ranges'
      ],
      outputFormat: 'JSON with transaction multiples and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['multiples', 'medianMultiple', 'meanMultiple', 'artifacts'],
      properties: {
        multiples: { type: 'array' },
        medianMultiple: { type: 'number' },
        meanMultiple: { type: 'number' },
        controlPremium: { type: 'number' },
        range: { type: 'object' },
        outliers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'ma-multiples']
}));

// Task 5: Multiple Normalization
export const multipleNormalizationTask = defineTask('multiple-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Normalize multiples',
  agent: {
    name: 'normalization-analyst',
    prompt: {
      role: 'valuation normalization specialist',
      task: 'Normalize multiples for comparability',
      context: args,
      instructions: [
        'Adjust for growth rate differences',
        'Normalize for profitability differences',
        'Adjust for size/scale differences',
        'Account for market timing differences',
        'Apply appropriate discounts/premiums',
        'Normalize for geographic factors',
        'Create adjusted multiple ranges',
        'Document all adjustments'
      ],
      outputFormat: 'JSON with normalized multiples and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['normalizedTrading', 'normalizedTransaction', 'adjustments', 'artifacts'],
      properties: {
        normalizedTrading: { type: 'object' },
        normalizedTransaction: { type: 'object' },
        adjustments: { type: 'array' },
        adjustmentFactors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'normalization']
}));

// Task 6: Valuation Range Calculation
export const valuationRangeTask = defineTask('valuation-range', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate valuation range',
  agent: {
    name: 'valuation-calculator',
    prompt: {
      role: 'valuation specialist',
      task: 'Calculate valuation range from comparable analysis',
      context: args,
      instructions: [
        'Apply trading multiples to company metrics',
        'Apply transaction multiples to company metrics',
        'Weight trading vs transaction multiples',
        'Calculate low, mid, high valuation',
        'Determine appropriate valuation point',
        'Cross-check against other methodologies',
        'Document valuation rationale',
        'Identify key sensitivities'
      ],
      outputFormat: 'JSON with valuation range and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lowValue', 'midValue', 'highValue', 'artifacts'],
      properties: {
        lowValue: { type: 'number' },
        midValue: { type: 'number' },
        highValue: { type: 'number' },
        methodology: { type: 'object' },
        weights: { type: 'object' },
        sensitivities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'valuation']
}));

// Task 7: Comparable Analysis Report
export const comparableReportTask = defineTask('comparable-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comparable analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'valuation analyst',
      task: 'Generate comprehensive comparable analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present peer company selection',
        'Document trading multiple analysis',
        'Present precedent transaction analysis',
        'Include normalization methodology',
        'Show valuation range calculation',
        'Include football field visualization data',
        'Format as investment memo appendix'
      ],
      outputFormat: 'JSON with report path, summary, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        footballField: { type: 'object' },
        keyFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'comparables', 'reporting']
}));
