/**
 * @process venture-capital/dcf-analysis
 * @description Free cash flow projections with appropriate discount rates (WACC/hurdle rate), terminal value calculation, and sensitivity analysis for growth-stage companies
 * @inputs { companyName: string, financials: object, projections: object, discountRate: number }
 * @outputs { success: boolean, dcfValuation: object, sensitivity: object, scenarioAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    financials = {},
    projections = {},
    discountRate = 0.25,
    outputDir = 'dcf-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Revenue and Growth Modeling
  ctx.log('info', 'Modeling revenue and growth');
  const revenueModeling = await ctx.task(revenueModelingTask, {
    companyName,
    financials,
    projections,
    outputDir
  });

  if (!revenueModeling.success) {
    return {
      success: false,
      error: 'Revenue modeling failed',
      details: revenueModeling,
      metadata: { processId: 'venture-capital/dcf-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...revenueModeling.artifacts);

  // Task 2: Free Cash Flow Projections
  ctx.log('info', 'Projecting free cash flows');
  const fcfProjections = await ctx.task(fcfProjectionsTask, {
    companyName,
    revenueModel: revenueModeling.model,
    financials,
    outputDir
  });

  artifacts.push(...fcfProjections.artifacts);

  // Task 3: Discount Rate Analysis
  ctx.log('info', 'Analyzing discount rate');
  const discountRateAnalysis = await ctx.task(discountRateAnalysisTask, {
    companyName,
    financials,
    targetRate: discountRate,
    outputDir
  });

  artifacts.push(...discountRateAnalysis.artifacts);

  // Task 4: Terminal Value Calculation
  ctx.log('info', 'Calculating terminal value');
  const terminalValue = await ctx.task(terminalValueTask, {
    fcfProjections: fcfProjections.projections,
    discountRate: discountRateAnalysis.rate,
    outputDir
  });

  artifacts.push(...terminalValue.artifacts);

  // Task 5: Present Value Calculation
  ctx.log('info', 'Calculating present value');
  const presentValue = await ctx.task(presentValueTask, {
    fcfProjections: fcfProjections.projections,
    terminalValue: terminalValue.value,
    discountRate: discountRateAnalysis.rate,
    outputDir
  });

  artifacts.push(...presentValue.artifacts);

  // Task 6: Sensitivity Analysis
  ctx.log('info', 'Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(dcfSensitivityTask, {
    presentValue,
    fcfProjections,
    terminalValue,
    discountRate: discountRateAnalysis.rate,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // Task 7: Scenario Analysis
  ctx.log('info', 'Running scenario analysis');
  const scenarioAnalysis = await ctx.task(dcfScenarioTask, {
    revenueModeling,
    fcfProjections,
    discountRate: discountRateAnalysis.rate,
    outputDir
  });

  artifacts.push(...scenarioAnalysis.artifacts);

  // Breakpoint: Review DCF analysis
  await ctx.breakpoint({
    question: `DCF analysis complete for ${companyName}. Enterprise value: $${presentValue.enterpriseValue}M. Equity value: $${presentValue.equityValue}M. Review analysis?`,
    title: 'DCF Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        enterpriseValue: presentValue.enterpriseValue,
        equityValue: presentValue.equityValue,
        discountRate: discountRateAnalysis.rate,
        terminalValue: terminalValue.value,
        terminalValuePercent: terminalValue.percentOfValue
      }
    }
  });

  // Task 8: Generate DCF Report
  ctx.log('info', 'Generating DCF analysis report');
  const dcfReport = await ctx.task(dcfReportTask, {
    companyName,
    revenueModeling,
    fcfProjections,
    discountRateAnalysis,
    terminalValue,
    presentValue,
    sensitivityAnalysis,
    scenarioAnalysis,
    outputDir
  });

  artifacts.push(...dcfReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dcfValuation: {
      enterpriseValue: presentValue.enterpriseValue,
      equityValue: presentValue.equityValue,
      discountRate: discountRateAnalysis.rate,
      terminalValue: terminalValue.value,
      terminalValuePercent: terminalValue.percentOfValue,
      methodology: 'Discounted Cash Flow'
    },
    projections: {
      revenue: revenueModeling.model,
      fcf: fcfProjections.projections,
      projectionPeriod: fcfProjections.projectionYears
    },
    sensitivity: sensitivityAnalysis.sensitivityTable,
    scenarioAnalysis: {
      baseCase: scenarioAnalysis.baseCase,
      upside: scenarioAnalysis.upside,
      downside: scenarioAnalysis.downside
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/dcf-analysis',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Revenue and Growth Modeling
export const revenueModelingTask = defineTask('revenue-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model revenue and growth',
  agent: {
    name: 'revenue-modeler',
    prompt: {
      role: 'financial modeling analyst',
      task: 'Model revenue projections',
      context: args,
      instructions: [
        'Analyze historical revenue patterns',
        'Build bottoms-up revenue model',
        'Project customer and revenue growth',
        'Model pricing and ARPU trends',
        'Project expansion and contraction',
        'Model new product revenue',
        'Create 5-10 year projections',
        'Document key assumptions'
      ],
      outputFormat: 'JSON with revenue model and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'model', 'projections', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        model: { type: 'object' },
        projections: { type: 'array' },
        growthRates: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'revenue-modeling']
}));

// Task 2: Free Cash Flow Projections
export const fcfProjectionsTask = defineTask('fcf-projections', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project free cash flows',
  agent: {
    name: 'fcf-analyst',
    prompt: {
      role: 'cash flow analyst',
      task: 'Project free cash flows',
      context: args,
      instructions: [
        'Project EBITDA from revenue model',
        'Model operating margin improvement',
        'Project capital expenditures',
        'Model working capital changes',
        'Calculate unlevered free cash flow',
        'Project cash flow conversion',
        'Model path to profitability',
        'Document FCF assumptions'
      ],
      outputFormat: 'JSON with FCF projections and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['projections', 'projectionYears', 'artifacts'],
      properties: {
        projections: { type: 'array' },
        projectionYears: { type: 'number' },
        ebitdaMargins: { type: 'array' },
        capex: { type: 'array' },
        workingCapital: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'fcf']
}));

// Task 3: Discount Rate Analysis
export const discountRateAnalysisTask = defineTask('discount-rate-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze discount rate',
  agent: {
    name: 'discount-analyst',
    prompt: {
      role: 'cost of capital analyst',
      task: 'Determine appropriate discount rate',
      context: args,
      instructions: [
        'Evaluate risk-free rate',
        'Estimate equity risk premium',
        'Determine company-specific risk factors',
        'Calculate WACC if applicable',
        'Consider VC hurdle rate requirements',
        'Adjust for stage and risk',
        'Compare to peer discount rates',
        'Document rate justification'
      ],
      outputFormat: 'JSON with discount rate analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rate', 'components', 'artifacts'],
      properties: {
        rate: { type: 'number' },
        components: { type: 'object' },
        riskFactors: { type: 'array' },
        peerComparison: { type: 'object' },
        justification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'discount-rate']
}));

// Task 4: Terminal Value Calculation
export const terminalValueTask = defineTask('terminal-value', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate terminal value',
  agent: {
    name: 'terminal-value-analyst',
    prompt: {
      role: 'terminal value specialist',
      task: 'Calculate terminal value',
      context: args,
      instructions: [
        'Select terminal value methodology',
        'Apply perpetuity growth method',
        'Apply exit multiple method',
        'Determine terminal growth rate',
        'Select appropriate exit multiples',
        'Calculate terminal value range',
        'Cross-check methodologies',
        'Document assumptions'
      ],
      outputFormat: 'JSON with terminal value calculation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['value', 'methodology', 'artifacts'],
      properties: {
        value: { type: 'number' },
        methodology: { type: 'string' },
        perpetuityValue: { type: 'number' },
        exitMultipleValue: { type: 'number' },
        terminalGrowthRate: { type: 'number' },
        percentOfValue: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'terminal-value']
}));

// Task 5: Present Value Calculation
export const presentValueTask = defineTask('present-value', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate present value',
  agent: {
    name: 'pv-calculator',
    prompt: {
      role: 'present value analyst',
      task: 'Calculate present value and enterprise value',
      context: args,
      instructions: [
        'Discount projected FCFs to present',
        'Discount terminal value to present',
        'Sum to enterprise value',
        'Adjust for cash and debt',
        'Calculate equity value',
        'Calculate per-share value if applicable',
        'Document bridge from EV to equity',
        'Validate calculation'
      ],
      outputFormat: 'JSON with present value calculation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['enterpriseValue', 'equityValue', 'artifacts'],
      properties: {
        enterpriseValue: { type: 'number' },
        equityValue: { type: 'number' },
        pvOfFCFs: { type: 'number' },
        pvOfTerminal: { type: 'number' },
        bridgeItems: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'present-value']
}));

// Task 6: DCF Sensitivity Analysis
export const dcfSensitivityTask = defineTask('dcf-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform DCF sensitivity',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'sensitivity analysis specialist',
      task: 'Perform sensitivity analysis on DCF',
      context: args,
      instructions: [
        'Vary discount rate assumptions',
        'Vary terminal growth rate',
        'Vary revenue growth assumptions',
        'Vary margin assumptions',
        'Create sensitivity tables',
        'Identify key value drivers',
        'Create tornado chart data',
        'Document sensitivity findings'
      ],
      outputFormat: 'JSON with sensitivity analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitivityTable', 'keyDrivers', 'artifacts'],
      properties: {
        sensitivityTable: { type: 'object' },
        keyDrivers: { type: 'array' },
        valueRange: { type: 'object' },
        tornadoChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'sensitivity']
}));

// Task 7: DCF Scenario Analysis
export const dcfScenarioTask = defineTask('dcf-scenario', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run DCF scenarios',
  agent: {
    name: 'scenario-analyst',
    prompt: {
      role: 'scenario planning analyst',
      task: 'Perform DCF scenario analysis',
      context: args,
      instructions: [
        'Define base case assumptions',
        'Create upside scenario',
        'Create downside scenario',
        'Run DCF for each scenario',
        'Assign scenario probabilities',
        'Calculate probability-weighted value',
        'Identify scenario drivers',
        'Document scenario assumptions'
      ],
      outputFormat: 'JSON with scenario analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baseCase', 'upside', 'downside', 'artifacts'],
      properties: {
        baseCase: { type: 'object' },
        upside: { type: 'object' },
        downside: { type: 'object' },
        probabilityWeighted: { type: 'number' },
        drivers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'scenarios']
}));

// Task 8: DCF Report Generation
export const dcfReportTask = defineTask('dcf-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DCF report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'valuation analyst',
      task: 'Generate comprehensive DCF analysis report',
      context: args,
      instructions: [
        'Create executive summary of valuation',
        'Present revenue and growth model',
        'Document FCF projections',
        'Present discount rate analysis',
        'Document terminal value calculation',
        'Include sensitivity analysis',
        'Present scenario analysis',
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
        keyAssumptions: { type: 'array' },
        valuationRange: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'dcf', 'reporting']
}));
