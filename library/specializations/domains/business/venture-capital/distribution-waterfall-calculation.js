/**
 * @process venture-capital/distribution-waterfall-calculation
 * @description Calculating and executing distributions to LPs per partnership agreement waterfall including carried interest allocation, clawback provisions, and tax reporting
 * @inputs { fundName: string, distributionEvent: object, partnershipAgreement: object, priorDistributions: array }
 * @outputs { success: boolean, waterfallCalculation: object, lpDistributions: object, gpCarry: object, taxReporting: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    distributionEvent = {},
    partnershipAgreement = {},
    priorDistributions = [],
    outputDir = 'distribution-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Distribution Event Analysis
  ctx.log('info', 'Analyzing distribution event');
  const eventAnalysis = await ctx.task(distributionEventTask, {
    fundName,
    distributionEvent,
    partnershipAgreement,
    outputDir
  });

  if (!eventAnalysis.success) {
    return {
      success: false,
      error: 'Distribution event analysis failed',
      details: eventAnalysis,
      metadata: { processId: 'venture-capital/distribution-waterfall-calculation', timestamp: startTime }
    };
  }

  artifacts.push(...eventAnalysis.artifacts);

  // Task 2: Waterfall Calculation
  ctx.log('info', 'Calculating distribution waterfall');
  const waterfallCalc = await ctx.task(waterfallCalculationTask, {
    fundName,
    distributionEvent,
    eventAnalysis,
    partnershipAgreement,
    priorDistributions,
    outputDir
  });

  artifacts.push(...waterfallCalc.artifacts);

  // Task 3: LP Distribution Allocation
  ctx.log('info', 'Allocating LP distributions');
  const lpAllocation = await ctx.task(lpAllocationTask, {
    fundName,
    waterfallCalc,
    partnershipAgreement,
    outputDir
  });

  artifacts.push(...lpAllocation.artifacts);

  // Task 4: Carried Interest Calculation
  ctx.log('info', 'Calculating carried interest');
  const carryCalculation = await ctx.task(carryCalculationTask, {
    fundName,
    waterfallCalc,
    partnershipAgreement,
    priorDistributions,
    outputDir
  });

  artifacts.push(...carryCalculation.artifacts);

  // Task 5: Clawback Analysis
  ctx.log('info', 'Analyzing clawback provisions');
  const clawbackAnalysis = await ctx.task(clawbackAnalysisTask, {
    fundName,
    waterfallCalc,
    carryCalculation,
    partnershipAgreement,
    priorDistributions,
    outputDir
  });

  artifacts.push(...clawbackAnalysis.artifacts);

  // Task 6: Tax Allocation and Reporting
  ctx.log('info', 'Preparing tax allocation');
  const taxAllocation = await ctx.task(taxAllocationTask, {
    fundName,
    waterfallCalc,
    lpAllocation,
    carryCalculation,
    outputDir
  });

  artifacts.push(...taxAllocation.artifacts);

  // Breakpoint: Review distribution calculations
  await ctx.breakpoint({
    question: `Distribution calculation complete for ${fundName}. Total distribution: $${eventAnalysis.distributionAmount}M. GP carry: $${carryCalculation.carryAmount}M. Review calculations?`,
    title: 'Distribution Waterfall Calculation',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalDistribution: eventAnalysis.distributionAmount,
        lpDistribution: lpAllocation.totalToLPs,
        gpCarry: carryCalculation.carryAmount,
        clawbackRequired: clawbackAnalysis.clawbackRequired,
        clawbackAmount: clawbackAnalysis.clawbackAmount
      }
    }
  });

  // Task 7: Distribution Notice Preparation
  ctx.log('info', 'Preparing distribution notices');
  const distributionNotices = await ctx.task(distributionNoticeTask, {
    fundName,
    lpAllocation,
    carryCalculation,
    taxAllocation,
    outputDir
  });

  artifacts.push(...distributionNotices.artifacts);

  // Task 8: Generate Distribution Report
  ctx.log('info', 'Generating distribution report');
  const distributionReport = await ctx.task(distributionReportTask, {
    fundName,
    eventAnalysis,
    waterfallCalc,
    lpAllocation,
    carryCalculation,
    clawbackAnalysis,
    taxAllocation,
    distributionNotices,
    outputDir
  });

  artifacts.push(...distributionReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    waterfallCalculation: {
      totalDistribution: eventAnalysis.distributionAmount,
      returnOfCapital: waterfallCalc.returnOfCapital,
      preferredReturn: waterfallCalc.preferredReturn,
      catchUp: waterfallCalc.catchUp,
      carriedInterest: waterfallCalc.carriedInterest,
      residual: waterfallCalc.residual
    },
    lpDistributions: {
      totalToLPs: lpAllocation.totalToLPs,
      byLP: lpAllocation.byLP,
      paymentSchedule: lpAllocation.paymentSchedule
    },
    gpCarry: {
      carryAmount: carryCalculation.carryAmount,
      carryPercentage: carryCalculation.carryPercentage,
      cumulativeCarry: carryCalculation.cumulativeCarry
    },
    clawback: {
      required: clawbackAnalysis.clawbackRequired,
      amount: clawbackAnalysis.clawbackAmount,
      escrowStatus: clawbackAnalysis.escrowStatus
    },
    taxReporting: {
      k1Allocations: taxAllocation.k1Allocations,
      characterization: taxAllocation.characterization
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/distribution-waterfall-calculation',
      timestamp: startTime,
      fundName,
      distributionDate: distributionEvent.date
    }
  };
}

// Task 1: Distribution Event Analysis
export const distributionEventTask = defineTask('distribution-event', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze distribution event',
  agent: {
    name: 'event-analyst',
    prompt: {
      role: 'fund distribution analyst',
      task: 'Analyze distribution event details',
      context: args,
      instructions: [
        'Identify distribution source (exit, dividend, etc)',
        'Calculate gross distribution amount',
        'Identify any holdbacks or escrows',
        'Calculate net distributable amount',
        'Review partnership agreement provisions',
        'Identify applicable waterfall tier',
        'Document distribution event details',
        'Prepare for waterfall calculation'
      ],
      outputFormat: 'JSON with distribution event analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'distributionAmount', 'eventType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        distributionAmount: { type: 'number' },
        eventType: { type: 'string' },
        source: { type: 'object' },
        holdbacks: { type: 'array' },
        netAmount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'event']
}));

// Task 2: Waterfall Calculation
export const waterfallCalculationTask = defineTask('waterfall-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate distribution waterfall',
  agent: {
    name: 'waterfall-calculator',
    prompt: {
      role: 'waterfall calculation specialist',
      task: 'Calculate distribution per partnership waterfall',
      context: args,
      instructions: [
        'Apply return of capital tier',
        'Calculate preferred return allocation',
        'Apply GP catch-up provisions',
        'Calculate carried interest tier',
        'Apply residual split',
        'Account for prior distributions',
        'Validate against partnership agreement',
        'Document waterfall calculation'
      ],
      outputFormat: 'JSON with waterfall calculation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['returnOfCapital', 'preferredReturn', 'carriedInterest', 'artifacts'],
      properties: {
        returnOfCapital: { type: 'number' },
        preferredReturn: { type: 'number' },
        catchUp: { type: 'number' },
        carriedInterest: { type: 'number' },
        residual: { type: 'number' },
        calculation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'waterfall']
}));

// Task 3: LP Distribution Allocation
export const lpAllocationTask = defineTask('lp-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate LP distributions',
  agent: {
    name: 'lp-allocator',
    prompt: {
      role: 'LP allocation specialist',
      task: 'Allocate distributions to individual LPs',
      context: args,
      instructions: [
        'Calculate pro-rata LP shares',
        'Apply commitment percentages',
        'Account for contribution timing',
        'Calculate individual LP amounts',
        'Apply any side letter provisions',
        'Prepare wire instructions',
        'Create payment schedule',
        'Document LP allocations'
      ],
      outputFormat: 'JSON with LP allocations and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalToLPs', 'byLP', 'artifacts'],
      properties: {
        totalToLPs: { type: 'number' },
        byLP: { type: 'array' },
        paymentSchedule: { type: 'array' },
        wireInstructions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'lp-allocation']
}));

// Task 4: Carried Interest Calculation
export const carryCalculationTask = defineTask('carry-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate carried interest',
  agent: {
    name: 'carry-calculator',
    prompt: {
      role: 'carried interest specialist',
      task: 'Calculate GP carried interest',
      context: args,
      instructions: [
        'Calculate carry from this distribution',
        'Apply carry percentage per LPA',
        'Calculate cumulative carry to date',
        'Allocate carry among GP principals',
        'Track against carry waterfall',
        'Account for management fee offset',
        'Calculate vesting if applicable',
        'Document carry calculation'
      ],
      outputFormat: 'JSON with carry calculation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['carryAmount', 'carryPercentage', 'cumulativeCarry', 'artifacts'],
      properties: {
        carryAmount: { type: 'number' },
        carryPercentage: { type: 'number' },
        cumulativeCarry: { type: 'number' },
        byPrincipal: { type: 'array' },
        vestingStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'carry']
}));

// Task 5: Clawback Analysis
export const clawbackAnalysisTask = defineTask('clawback-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze clawback provisions',
  agent: {
    name: 'clawback-analyst',
    prompt: {
      role: 'clawback provisions specialist',
      task: 'Analyze clawback requirements',
      context: args,
      instructions: [
        'Calculate cumulative distributions',
        'Calculate lifetime fund returns',
        'Test against clawback trigger',
        'Calculate potential clawback amount',
        'Review escrow requirements',
        'Assess interim clawback status',
        'Project end-of-fund clawback',
        'Document clawback analysis'
      ],
      outputFormat: 'JSON with clawback analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clawbackRequired', 'clawbackAmount', 'artifacts'],
      properties: {
        clawbackRequired: { type: 'boolean' },
        clawbackAmount: { type: 'number' },
        escrowStatus: { type: 'object' },
        projection: { type: 'object' },
        triggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'clawback']
}));

// Task 6: Tax Allocation
export const taxAllocationTask = defineTask('tax-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare tax allocation',
  agent: {
    name: 'tax-allocator',
    prompt: {
      role: 'partnership tax specialist',
      task: 'Prepare tax allocations and reporting',
      context: args,
      instructions: [
        'Determine income characterization',
        'Allocate capital gains vs ordinary income',
        'Apply Section 704 allocations',
        'Calculate K-1 amounts by partner',
        'Identify qualified dividend income',
        'Apply carried interest holding period rules',
        'Prepare tax basis tracking',
        'Document tax allocations'
      ],
      outputFormat: 'JSON with tax allocations and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['k1Allocations', 'characterization', 'artifacts'],
      properties: {
        k1Allocations: { type: 'array' },
        characterization: { type: 'object' },
        capitalGains: { type: 'number' },
        ordinaryIncome: { type: 'number' },
        basisTracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'tax']
}));

// Task 7: Distribution Notice Preparation
export const distributionNoticeTask = defineTask('distribution-notice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare distribution notices',
  agent: {
    name: 'notice-preparer',
    prompt: {
      role: 'LP communications specialist',
      task: 'Prepare distribution notices for LPs',
      context: args,
      instructions: [
        'Draft distribution notice letter',
        'Prepare individual LP statements',
        'Include waterfall summary',
        'Document tax information',
        'Include wire transfer details',
        'Prepare fund performance update',
        'Create distribution confirmation',
        'Coordinate communication timeline'
      ],
      outputFormat: 'JSON with distribution notices and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notices', 'statements', 'artifacts'],
      properties: {
        notices: { type: 'array' },
        statements: { type: 'array' },
        letterPath: { type: 'string' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'notices']
}));

// Task 8: Distribution Report
export const distributionReportTask = defineTask('distribution-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate distribution report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'fund administration manager',
      task: 'Generate comprehensive distribution report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document distribution event',
        'Present waterfall calculation',
        'Include LP allocation details',
        'Document carried interest',
        'Include clawback analysis',
        'Present tax allocations',
        'Include fund performance metrics'
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'distribution', 'reporting']
}));
