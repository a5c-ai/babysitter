/**
 * @process venture-capital/cap-table-modeling
 * @description Building detailed capitalization tables modeling option pools, convertible instruments, liquidation preferences, anti-dilution provisions, and waterfall distributions
 * @inputs { companyName: string, currentCapTable: object, proposedTerms: object, scenarios: array }
 * @outputs { success: boolean, capTableModel: object, waterfallAnalysis: object, dilutionAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    currentCapTable = {},
    proposedTerms = {},
    scenarios = [],
    outputDir = 'cap-table-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Current Cap Table Analysis
  ctx.log('info', 'Analyzing current cap table');
  const currentAnalysis = await ctx.task(currentCapTableTask, {
    companyName,
    currentCapTable,
    outputDir
  });

  if (!currentAnalysis.success) {
    return {
      success: false,
      error: 'Current cap table analysis failed',
      details: currentAnalysis,
      metadata: { processId: 'venture-capital/cap-table-modeling', timestamp: startTime }
    };
  }

  artifacts.push(...currentAnalysis.artifacts);

  // Task 2: Convertible Instruments Modeling
  ctx.log('info', 'Modeling convertible instruments');
  const convertibleModeling = await ctx.task(convertibleModelingTask, {
    currentCapTable,
    proposedTerms,
    outputDir
  });

  artifacts.push(...convertibleModeling.artifacts);

  // Task 3: Option Pool Modeling
  ctx.log('info', 'Modeling option pool');
  const optionPoolModeling = await ctx.task(optionPoolTask, {
    currentCapTable,
    proposedTerms,
    outputDir
  });

  artifacts.push(...optionPoolModeling.artifacts);

  // Task 4: Pro Forma Cap Table
  ctx.log('info', 'Building pro forma cap table');
  const proFormaCapTable = await ctx.task(proFormaTask, {
    currentAnalysis,
    convertibleModeling,
    optionPoolModeling,
    proposedTerms,
    outputDir
  });

  artifacts.push(...proFormaCapTable.artifacts);

  // Task 5: Liquidation Preference Analysis
  ctx.log('info', 'Analyzing liquidation preferences');
  const liquidationAnalysis = await ctx.task(liquidationPreferenceTask, {
    proFormaCapTable: proFormaCapTable.capTable,
    proposedTerms,
    outputDir
  });

  artifacts.push(...liquidationAnalysis.artifacts);

  // Task 6: Waterfall Analysis
  ctx.log('info', 'Performing waterfall analysis');
  const waterfallAnalysis = await ctx.task(waterfallTask, {
    proFormaCapTable: proFormaCapTable.capTable,
    liquidationAnalysis,
    scenarios,
    outputDir
  });

  artifacts.push(...waterfallAnalysis.artifacts);

  // Task 7: Dilution Analysis
  ctx.log('info', 'Analyzing dilution');
  const dilutionAnalysis = await ctx.task(dilutionAnalysisTask, {
    currentAnalysis,
    proFormaCapTable,
    proposedTerms,
    outputDir
  });

  artifacts.push(...dilutionAnalysis.artifacts);

  // Breakpoint: Review cap table modeling
  await ctx.breakpoint({
    question: `Cap table modeling complete for ${companyName}. Founder dilution: ${dilutionAnalysis.founderDilution}%. Review model?`,
    title: 'Cap Table Modeling Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        preMoney: proFormaCapTable.preMoney,
        postMoney: proFormaCapTable.postMoney,
        newInvestorOwnership: proFormaCapTable.newInvestorOwnership,
        founderDilution: dilutionAnalysis.founderDilution,
        optionPoolSize: optionPoolModeling.poolSize
      }
    }
  });

  // Task 8: Generate Cap Table Report
  ctx.log('info', 'Generating cap table report');
  const capTableReport = await ctx.task(capTableReportTask, {
    companyName,
    currentAnalysis,
    convertibleModeling,
    optionPoolModeling,
    proFormaCapTable,
    liquidationAnalysis,
    waterfallAnalysis,
    dilutionAnalysis,
    outputDir
  });

  artifacts.push(...capTableReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    capTableModel: {
      current: currentAnalysis.summary,
      proForma: proFormaCapTable.capTable,
      preMoney: proFormaCapTable.preMoney,
      postMoney: proFormaCapTable.postMoney
    },
    convertibles: {
      instruments: convertibleModeling.instruments,
      conversionTerms: convertibleModeling.conversionTerms
    },
    optionPool: {
      currentSize: optionPoolModeling.currentSize,
      newSize: optionPoolModeling.poolSize,
      available: optionPoolModeling.available
    },
    waterfallAnalysis: waterfallAnalysis.scenarios,
    dilutionAnalysis: {
      byStakeholder: dilutionAnalysis.byStakeholder,
      founderDilution: dilutionAnalysis.founderDilution,
      existingInvestorDilution: dilutionAnalysis.existingInvestorDilution
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/cap-table-modeling',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Current Cap Table Analysis
export const currentCapTableTask = defineTask('current-cap-table', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current cap table',
  agent: {
    name: 'cap-table-analyst',
    prompt: {
      role: 'cap table specialist',
      task: 'Analyze current capitalization table',
      context: args,
      instructions: [
        'Document all outstanding shares by class',
        'List all shareholders and ownership',
        'Identify all option grants and vesting',
        'Document convertible instruments',
        'Calculate fully diluted shares',
        'Verify cap table accuracy',
        'Identify any issues or anomalies',
        'Create ownership summary'
      ],
      outputFormat: 'JSON with cap table analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'summary', 'shareholders', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        summary: { type: 'object' },
        shareholders: { type: 'array' },
        shareClasses: { type: 'array' },
        fullyDiluted: { type: 'number' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'analysis']
}));

// Task 2: Convertible Instruments Modeling
export const convertibleModelingTask = defineTask('convertible-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model convertible instruments',
  agent: {
    name: 'convertible-analyst',
    prompt: {
      role: 'convertible securities specialist',
      task: 'Model convertible notes, SAFEs, and other convertibles',
      context: args,
      instructions: [
        'Document all convertible instruments',
        'Model conversion terms and triggers',
        'Calculate conversion prices',
        'Apply valuation caps and discounts',
        'Model MFN provisions',
        'Calculate shares on conversion',
        'Analyze conversion scenarios',
        'Document conversion waterfalls'
      ],
      outputFormat: 'JSON with convertible modeling and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['instruments', 'conversionTerms', 'artifacts'],
      properties: {
        instruments: { type: 'array' },
        conversionTerms: { type: 'object' },
        conversionShares: { type: 'number' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'convertibles']
}));

// Task 3: Option Pool Modeling
export const optionPoolTask = defineTask('option-pool', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model option pool',
  agent: {
    name: 'option-pool-analyst',
    prompt: {
      role: 'equity compensation specialist',
      task: 'Model option pool sizing and allocation',
      context: args,
      instructions: [
        'Analyze current option pool',
        'Calculate granted vs available options',
        'Model option pool refresh/increase',
        'Analyze pre vs post-money pool',
        'Project future option needs',
        'Model pool as % of fully diluted',
        'Analyze impact on ownership',
        'Document pool mechanics'
      ],
      outputFormat: 'JSON with option pool model and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentSize', 'poolSize', 'available', 'artifacts'],
      properties: {
        currentSize: { type: 'number' },
        poolSize: { type: 'number' },
        granted: { type: 'number' },
        available: { type: 'number' },
        poolPercent: { type: 'number' },
        futureNeeds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'options']
}));

// Task 4: Pro Forma Cap Table
export const proFormaTask = defineTask('pro-forma', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build pro forma cap table',
  agent: {
    name: 'pro-forma-builder',
    prompt: {
      role: 'cap table modeler',
      task: 'Build pro forma cap table post-investment',
      context: args,
      instructions: [
        'Calculate new shares to be issued',
        'Apply convertible conversions',
        'Include option pool changes',
        'Build full pro forma cap table',
        'Calculate ownership percentages',
        'Calculate pre and post money valuations',
        'Verify share counts and percentages',
        'Create pro forma summary'
      ],
      outputFormat: 'JSON with pro forma cap table and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['capTable', 'preMoney', 'postMoney', 'artifacts'],
      properties: {
        capTable: { type: 'object' },
        preMoney: { type: 'number' },
        postMoney: { type: 'number' },
        newInvestorOwnership: { type: 'number' },
        fullyDiluted: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'pro-forma']
}));

// Task 5: Liquidation Preference Analysis
export const liquidationPreferenceTask = defineTask('liquidation-preference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze liquidation preferences',
  agent: {
    name: 'preference-analyst',
    prompt: {
      role: 'liquidation preference specialist',
      task: 'Analyze liquidation preferences and seniority',
      context: args,
      instructions: [
        'Document all liquidation preferences',
        'Map preference seniority/stacking',
        'Model participating vs non-participating',
        'Calculate preference amounts by series',
        'Analyze preference multiples',
        'Model carve-out scenarios',
        'Calculate break-even valuations',
        'Document preference mechanics'
      ],
      outputFormat: 'JSON with preference analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preferences', 'seniority', 'artifacts'],
      properties: {
        preferences: { type: 'array' },
        seniority: { type: 'object' },
        totalPreference: { type: 'number' },
        participating: { type: 'boolean' },
        breakEven: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'liquidation']
}));

// Task 6: Waterfall Analysis
export const waterfallTask = defineTask('waterfall', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform waterfall analysis',
  agent: {
    name: 'waterfall-analyst',
    prompt: {
      role: 'distribution waterfall specialist',
      task: 'Model distribution waterfalls at various exit values',
      context: args,
      instructions: [
        'Model waterfall at multiple exit values',
        'Apply liquidation preferences',
        'Calculate participation rights',
        'Model conversion scenarios',
        'Calculate proceeds by stakeholder',
        'Analyze return multiples',
        'Identify ownership vs payout crossovers',
        'Create waterfall charts'
      ],
      outputFormat: 'JSON with waterfall scenarios and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        returnMultiples: { type: 'object' },
        crossoverPoints: { type: 'array' },
        charts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'waterfall']
}));

// Task 7: Dilution Analysis
export const dilutionAnalysisTask = defineTask('dilution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze dilution',
  agent: {
    name: 'dilution-analyst',
    prompt: {
      role: 'dilution analysis specialist',
      task: 'Analyze dilution from proposed transaction',
      context: args,
      instructions: [
        'Calculate dilution by stakeholder',
        'Analyze founder dilution',
        'Analyze existing investor dilution',
        'Model anti-dilution scenarios',
        'Calculate value accretion/dilution',
        'Model future round dilution',
        'Analyze dilution sources',
        'Create dilution summary'
      ],
      outputFormat: 'JSON with dilution analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['byStakeholder', 'founderDilution', 'artifacts'],
      properties: {
        byStakeholder: { type: 'object' },
        founderDilution: { type: 'number' },
        existingInvestorDilution: { type: 'number' },
        dilutionSources: { type: 'object' },
        antiDilution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'dilution']
}));

// Task 8: Cap Table Report
export const capTableReportTask = defineTask('cap-table-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cap table report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'cap table specialist',
      task: 'Generate comprehensive cap table modeling report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present current cap table',
        'Document convertible modeling',
        'Include option pool analysis',
        'Present pro forma cap table',
        'Document liquidation preferences',
        'Include waterfall analysis',
        'Present dilution analysis'
      ],
      outputFormat: 'JSON with report path, summary, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        keyMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cap-table', 'reporting']
}));
