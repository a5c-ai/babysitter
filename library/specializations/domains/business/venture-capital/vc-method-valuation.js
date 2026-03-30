/**
 * @process venture-capital/vc-method-valuation
 * @description Valuation based on expected exit value, target return multiples, and ownership dilution modeling for early-stage companies without meaningful revenue or earnings
 * @inputs { companyName: string, stage: string, projections: object, comparables: array, targetReturn: number }
 * @outputs { success: boolean, valuation: object, scenarioAnalysis: object, sensitivity: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    stage = 'Series A',
    projections = {},
    comparables = [],
    targetReturn = 3.0,
    outputDir = 'vc-valuation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Exit Value Estimation
  ctx.log('info', 'Estimating potential exit values');
  const exitEstimation = await ctx.task(exitValueEstimationTask, {
    companyName,
    stage,
    projections,
    comparables,
    outputDir
  });

  if (!exitEstimation.success) {
    return {
      success: false,
      error: 'Exit value estimation failed',
      details: exitEstimation,
      metadata: { processId: 'venture-capital/vc-method-valuation', timestamp: startTime }
    };
  }

  artifacts.push(...exitEstimation.artifacts);

  // Task 2: Target Return Analysis
  ctx.log('info', 'Analyzing target return requirements');
  const returnAnalysis = await ctx.task(targetReturnAnalysisTask, {
    exitEstimation: exitEstimation.exitScenarios,
    targetReturn,
    stage,
    outputDir
  });

  artifacts.push(...returnAnalysis.artifacts);

  // Task 3: Dilution Modeling
  ctx.log('info', 'Modeling expected dilution');
  const dilutionModeling = await ctx.task(dilutionModelingTask, {
    companyName,
    stage,
    projections,
    outputDir
  });

  artifacts.push(...dilutionModeling.artifacts);

  // Task 4: Pre-Money Valuation Calculation
  ctx.log('info', 'Calculating pre-money valuation');
  const preMoneyCalculation = await ctx.task(preMoneyCalculationTask, {
    exitEstimation,
    returnAnalysis,
    dilutionModeling,
    targetReturn,
    outputDir
  });

  artifacts.push(...preMoneyCalculation.artifacts);

  // Task 5: Comparable Transaction Analysis
  ctx.log('info', 'Analyzing comparable transactions');
  const comparableAnalysis = await ctx.task(comparableTransactionTask, {
    companyName,
    stage,
    comparables,
    preMoneyEstimate: preMoneyCalculation.preMoney,
    outputDir
  });

  artifacts.push(...comparableAnalysis.artifacts);

  // Task 6: Scenario Analysis
  ctx.log('info', 'Running valuation scenarios');
  const scenarioAnalysis = await ctx.task(scenarioAnalysisTask, {
    exitEstimation,
    returnAnalysis,
    dilutionModeling,
    preMoneyCalculation,
    outputDir
  });

  artifacts.push(...scenarioAnalysis.artifacts);

  // Task 7: Sensitivity Analysis
  ctx.log('info', 'Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    preMoneyCalculation,
    exitEstimation,
    dilutionModeling,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // Breakpoint: Review valuation analysis
  await ctx.breakpoint({
    question: `VC Method valuation complete for ${companyName}. Pre-money: $${preMoneyCalculation.preMoney}M. Implied exit: $${exitEstimation.baseExitValue}M. Review analysis?`,
    title: 'VC Method Valuation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        preMoney: preMoneyCalculation.preMoney,
        postMoney: preMoneyCalculation.postMoney,
        impliedExitValue: exitEstimation.baseExitValue,
        targetReturn,
        expectedDilution: dilutionModeling.totalDilution
      }
    }
  });

  // Task 8: Generate Valuation Report
  ctx.log('info', 'Generating valuation report');
  const valuationReport = await ctx.task(valuationReportTask, {
    companyName,
    stage,
    exitEstimation,
    returnAnalysis,
    dilutionModeling,
    preMoneyCalculation,
    comparableAnalysis,
    scenarioAnalysis,
    sensitivityAnalysis,
    outputDir
  });

  artifacts.push(...valuationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    valuation: {
      preMoney: preMoneyCalculation.preMoney,
      postMoney: preMoneyCalculation.postMoney,
      methodology: 'VC Method',
      exitAssumptions: exitEstimation.baseExitValue,
      exitMultiple: exitEstimation.exitMultiple,
      targetReturn
    },
    dilutionModel: {
      currentRound: dilutionModeling.currentRoundDilution,
      futureRounds: dilutionModeling.futureRoundsDilution,
      totalDilution: dilutionModeling.totalDilution,
      ownershipAtExit: dilutionModeling.ownershipAtExit
    },
    scenarioAnalysis: {
      baseCase: scenarioAnalysis.baseCase,
      upside: scenarioAnalysis.upside,
      downside: scenarioAnalysis.downside,
      probabilityWeighted: scenarioAnalysis.probabilityWeighted
    },
    sensitivity: sensitivityAnalysis.sensitivityTable,
    comparableCheck: comparableAnalysis.valuationComparison,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/vc-method-valuation',
      timestamp: startTime,
      companyName,
      stage
    }
  };
}

// Task 1: Exit Value Estimation
export const exitValueEstimationTask = defineTask('exit-value-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate exit values',
  agent: {
    name: 'exit-analyst',
    prompt: {
      role: 'exit valuation analyst',
      task: 'Estimate potential exit values',
      context: args,
      instructions: [
        'Project revenue at target exit timeframe',
        'Apply appropriate exit multiples from comparables',
        'Consider IPO vs M&A exit scenarios',
        'Adjust for market conditions and sector',
        'Calculate base, upside, and downside exit values',
        'Estimate probability of each exit scenario',
        'Document key exit assumptions',
        'Validate against historical exit data'
      ],
      outputFormat: 'JSON with exit scenarios, probabilities, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baseExitValue', 'exitScenarios', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        baseExitValue: { type: 'number' },
        exitMultiple: { type: 'number' },
        exitScenarios: { type: 'array' },
        exitTimeframe: { type: 'number' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'exit']
}));

// Task 2: Target Return Analysis
export const targetReturnAnalysisTask = defineTask('target-return-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze target returns',
  agent: {
    name: 'return-analyst',
    prompt: {
      role: 'VC return analyst',
      task: 'Analyze target return requirements',
      context: args,
      instructions: [
        'Define target return multiple for stage',
        'Calculate required ownership at exit',
        'Factor in success probability',
        'Adjust for portfolio construction needs',
        'Calculate IRR requirements',
        'Model return attribution',
        'Validate against fund return targets',
        'Document return assumptions'
      ],
      outputFormat: 'JSON with return analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetMultiple', 'requiredOwnership', 'artifacts'],
      properties: {
        targetMultiple: { type: 'number' },
        requiredOwnership: { type: 'number' },
        impliedIRR: { type: 'number' },
        returnAttribution: { type: 'object' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'returns']
}));

// Task 3: Dilution Modeling
export const dilutionModelingTask = defineTask('dilution-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model dilution',
  agent: {
    name: 'dilution-modeler',
    prompt: {
      role: 'cap table specialist',
      task: 'Model expected dilution through exit',
      context: args,
      instructions: [
        'Estimate current round dilution',
        'Model future financing rounds to exit',
        'Include option pool expansion',
        'Factor in bridge rounds and extensions',
        'Calculate cumulative dilution',
        'Model ownership retention strategies',
        'Calculate ownership at exit scenarios',
        'Document dilution assumptions'
      ],
      outputFormat: 'JSON with dilution model and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentRoundDilution', 'totalDilution', 'ownershipAtExit', 'artifacts'],
      properties: {
        currentRoundDilution: { type: 'number' },
        futureRoundsDilution: { type: 'number' },
        totalDilution: { type: 'number' },
        ownershipAtExit: { type: 'number' },
        futureRounds: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'dilution']
}));

// Task 4: Pre-Money Calculation
export const preMoneyCalculationTask = defineTask('pre-money-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate pre-money valuation',
  agent: {
    name: 'valuation-calculator',
    prompt: {
      role: 'VC valuation specialist',
      task: 'Calculate pre-money valuation using VC method',
      context: args,
      instructions: [
        'Apply VC method formula',
        'Work backward from exit value',
        'Factor in target return multiple',
        'Adjust for dilution to exit',
        'Calculate pre-money valuation',
        'Calculate post-money valuation',
        'Determine check size range',
        'Validate reasonableness'
      ],
      outputFormat: 'JSON with valuation calculation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preMoney', 'postMoney', 'calculation', 'artifacts'],
      properties: {
        preMoney: { type: 'number' },
        postMoney: { type: 'number' },
        checkSize: { type: 'number' },
        ownershipTarget: { type: 'number' },
        calculation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'pre-money']
}));

// Task 5: Comparable Transaction Analysis
export const comparableTransactionTask = defineTask('comparable-transaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze comparable transactions',
  agent: {
    name: 'comparable-analyst',
    prompt: {
      role: 'transaction comparables analyst',
      task: 'Analyze comparable financing transactions',
      context: args,
      instructions: [
        'Identify comparable recent financings',
        'Normalize for stage and timing',
        'Calculate valuation metrics',
        'Compare to calculated valuation',
        'Identify premium/discount factors',
        'Adjust for market conditions',
        'Validate reasonableness of valuation',
        'Document comparison methodology'
      ],
      outputFormat: 'JSON with comparable analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparables', 'valuationComparison', 'artifacts'],
      properties: {
        comparables: { type: 'array' },
        valuationComparison: { type: 'object' },
        premiumDiscount: { type: 'number' },
        adjustments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'comparables']
}));

// Task 6: Scenario Analysis
export const scenarioAnalysisTask = defineTask('scenario-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run scenario analysis',
  agent: {
    name: 'scenario-analyst',
    prompt: {
      role: 'valuation scenario analyst',
      task: 'Perform valuation scenario analysis',
      context: args,
      instructions: [
        'Define base case scenario',
        'Model upside scenario',
        'Model downside scenario',
        'Assign probabilities to scenarios',
        'Calculate probability-weighted valuation',
        'Analyze return distribution',
        'Identify key scenario drivers',
        'Document scenario assumptions'
      ],
      outputFormat: 'JSON with scenarios, weighted valuation, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baseCase', 'upside', 'downside', 'probabilityWeighted', 'artifacts'],
      properties: {
        baseCase: { type: 'object' },
        upside: { type: 'object' },
        downside: { type: 'object' },
        probabilityWeighted: { type: 'number' },
        returnDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'scenarios']
}));

// Task 7: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'valuation sensitivity analyst',
      task: 'Perform sensitivity analysis on valuation drivers',
      context: args,
      instructions: [
        'Identify key valuation drivers',
        'Vary exit multiple assumptions',
        'Vary target return assumptions',
        'Vary dilution assumptions',
        'Vary exit timing assumptions',
        'Create sensitivity tables',
        'Identify most sensitive variables',
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
        tornadoChart: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'valuation', 'sensitivity']
}));

// Task 8: Valuation Report Generation
export const valuationReportTask = defineTask('valuation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate valuation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC valuation analyst',
      task: 'Generate comprehensive VC method valuation report',
      context: args,
      instructions: [
        'Create executive summary of valuation',
        'Present VC method calculation',
        'Document exit value assumptions',
        'Include dilution modeling',
        'Present scenario analysis',
        'Include sensitivity analysis',
        'Show comparable transaction check',
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
  labels: ['agent', 'venture-capital', 'valuation', 'reporting']
}));
