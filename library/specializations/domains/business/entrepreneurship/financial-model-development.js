/**
 * @process specializations/domains/business/entrepreneurship/financial-model-development
 * @description Financial Model Development Process - Process to build robust financial models including projections, unit economics, and scenario analysis for planning and fundraising.
 * @inputs { companyName: string, businessModel: string, currentMetrics?: object, projectionYears?: number, fundingScenario?: object }
 * @outputs { success: boolean, financialModel: object, unitEconomics: object, scenarioAnalysis: object, dashboard: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/financial-model-development', {
 *   companyName: 'GrowthCo',
 *   businessModel: 'SaaS subscription',
 *   currentMetrics: { mrr: 50000, customers: 100 },
 *   projectionYears: 5
 * });
 *
 * @references
 * - Lean Analytics: https://leananalyticsbook.com/
 * - SaaS Metrics: https://www.forentrepreneurs.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    businessModel,
    currentMetrics = {},
    projectionYears = 5,
    fundingScenario = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Financial Model Development for ${companyName}`);

  // Phase 1: Revenue Model Definition
  const revenueModel = await ctx.task(revenueModelTask, {
    companyName,
    businessModel,
    currentMetrics
  });

  artifacts.push(...(revenueModel.artifacts || []));

  // Phase 2: Revenue Projections
  const revenueProjections = await ctx.task(revenueProjectionsTask, {
    companyName,
    revenueModel,
    currentMetrics,
    projectionYears
  });

  artifacts.push(...(revenueProjections.artifacts || []));

  // Phase 3: Operating Expenses
  const operatingExpenses = await ctx.task(operatingExpensesTask, {
    companyName,
    revenueProjections,
    projectionYears
  });

  artifacts.push(...(operatingExpenses.artifacts || []));

  // Phase 4: Headcount Plan
  const headcountPlan = await ctx.task(headcountPlanTask, {
    companyName,
    revenueProjections,
    operatingExpenses,
    projectionYears
  });

  artifacts.push(...(headcountPlan.artifacts || []));

  // Phase 5: Unit Economics
  const unitEconomics = await ctx.task(unitEconomicsTask, {
    companyName,
    revenueModel,
    currentMetrics,
    operatingExpenses
  });

  artifacts.push(...(unitEconomics.artifacts || []));

  // Breakpoint: Review unit economics
  await ctx.breakpoint({
    question: `Review unit economics for ${companyName}. LTV:CAC ratio: ${unitEconomics.ltvCacRatio}. Continue with scenario analysis?`,
    title: 'Unit Economics Review',
    context: {
      runId: ctx.runId,
      companyName,
      ltvCacRatio: unitEconomics.ltvCacRatio,
      files: artifacts
    }
  });

  // Phase 6: Scenario Analysis
  const scenarioAnalysis = await ctx.task(scenarioAnalysisTask, {
    companyName,
    revenueProjections,
    operatingExpenses,
    unitEconomics
  });

  artifacts.push(...(scenarioAnalysis.artifacts || []));

  // Phase 7: Cash Flow Projections
  const cashFlowProjections = await ctx.task(cashFlowProjectionsTask, {
    companyName,
    revenueProjections,
    operatingExpenses,
    fundingScenario
  });

  artifacts.push(...(cashFlowProjections.artifacts || []));

  // Phase 8: Dashboard Creation
  const dashboard = await ctx.task(dashboardCreationTask, {
    companyName,
    revenueProjections,
    operatingExpenses,
    unitEconomics,
    cashFlowProjections
  });

  artifacts.push(...(dashboard.artifacts || []));

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Financial model complete for ${companyName}. ${projectionYears}-year projections, scenario analysis, and dashboard ready. Approve?`,
    title: 'Financial Model Complete',
    context: {
      runId: ctx.runId,
      companyName,
      projectionYears,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    financialModel: {
      revenueModel,
      revenueProjections,
      operatingExpenses,
      headcountPlan,
      cashFlowProjections
    },
    unitEconomics,
    scenarioAnalysis,
    dashboard,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/financial-model-development',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const revenueModelTask = defineTask('revenue-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revenue Model Definition - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Financial Modeling Expert',
      task: 'Define revenue model structure and drivers',
      context: args,
      instructions: [
        '1. Define revenue stream types',
        '2. Identify key revenue drivers',
        '3. Map pricing to customer segments',
        '4. Define billing frequency',
        '5. Model upsell/expansion revenue',
        '6. Account for discounts and promotions',
        '7. Define revenue recognition approach',
        '8. Model seasonality if applicable',
        '9. Define driver assumptions',
        '10. Create revenue model structure'
      ],
      outputFormat: 'JSON object with revenue model'
    },
    outputSchema: {
      type: 'object',
      required: ['revenueStreams', 'drivers', 'pricing'],
      properties: {
        revenueStreams: { type: 'array', items: { type: 'object' } },
        drivers: { type: 'array', items: { type: 'object' } },
        pricing: { type: 'object' },
        billingModel: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'revenue']
}));

export const revenueProjectionsTask = defineTask('revenue-projections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revenue Projections - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Projection Expert',
      task: 'Build bottoms-up revenue projections',
      context: args,
      instructions: [
        '1. Project customer acquisition by channel',
        '2. Model customer retention and churn',
        '3. Project expansion revenue',
        '4. Build monthly projections for Year 1',
        '5. Build quarterly projections for Years 2-3',
        '6. Build annual projections for Years 4-5',
        '7. Model cohort-based revenue',
        '8. Include pricing changes',
        '9. Document key assumptions',
        '10. Calculate growth rates'
      ],
      outputFormat: 'JSON object with revenue projections'
    },
    outputSchema: {
      type: 'object',
      required: ['projections', 'growthRates', 'assumptions'],
      properties: {
        projections: { type: 'object' },
        growthRates: { type: 'object' },
        customerProjections: { type: 'object' },
        cohortAnalysis: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'projections']
}));

export const operatingExpensesTask = defineTask('operating-expenses', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operating Expenses - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Finance Expert',
      task: 'Model operating expenses by category',
      context: args,
      instructions: [
        '1. Categorize expenses (R&D, S&M, G&A, COGS)',
        '2. Model personnel costs',
        '3. Project infrastructure costs',
        '4. Model marketing spend',
        '5. Include professional services',
        '6. Project facilities costs',
        '7. Model expense scaling with revenue',
        '8. Include one-time costs',
        '9. Document assumptions',
        '10. Calculate expense ratios'
      ],
      outputFormat: 'JSON object with operating expenses'
    },
    outputSchema: {
      type: 'object',
      required: ['expenses', 'categories', 'ratios'],
      properties: {
        expenses: { type: 'object' },
        categories: { type: 'object' },
        personnelCosts: { type: 'object' },
        ratios: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'expenses']
}));

export const headcountPlanTask = defineTask('headcount-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Headcount Plan - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR and Finance Planning Expert',
      task: 'Build headcount plan aligned with growth',
      context: args,
      instructions: [
        '1. Define current headcount by department',
        '2. Project hiring needs by function',
        '3. Model salary ranges and increases',
        '4. Include benefits and taxes',
        '5. Plan contractor vs FTE mix',
        '6. Model productivity ratios',
        '7. Plan leadership hires',
        '8. Project revenue per employee',
        '9. Document hiring assumptions',
        '10. Create org chart evolution'
      ],
      outputFormat: 'JSON object with headcount plan'
    },
    outputSchema: {
      type: 'object',
      required: ['headcountByDepartment', 'hiringPlan', 'totalCost'],
      properties: {
        headcountByDepartment: { type: 'object' },
        hiringPlan: { type: 'object' },
        salaryRanges: { type: 'object' },
        totalCost: { type: 'object' },
        revenuePerEmployee: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'headcount']
}));

export const unitEconomicsTask = defineTask('unit-economics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unit Economics - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SaaS Metrics Expert',
      task: 'Calculate unit economics and key SaaS metrics',
      context: args,
      instructions: [
        '1. Calculate Customer Acquisition Cost (CAC)',
        '2. Calculate Lifetime Value (LTV)',
        '3. Calculate LTV:CAC ratio',
        '4. Calculate CAC payback period',
        '5. Model churn and retention rates',
        '6. Calculate Net Revenue Retention',
        '7. Model gross margin',
        '8. Calculate contribution margin',
        '9. Compare to industry benchmarks',
        '10. Identify improvement levers'
      ],
      outputFormat: 'JSON object with unit economics'
    },
    outputSchema: {
      type: 'object',
      required: ['cac', 'ltv', 'ltvCacRatio'],
      properties: {
        cac: { type: 'number' },
        ltv: { type: 'number' },
        ltvCacRatio: { type: 'number' },
        paybackPeriod: { type: 'number' },
        churnRate: { type: 'number' },
        nrr: { type: 'number' },
        grossMargin: { type: 'number' },
        benchmarkComparison: { type: 'object' },
        improvementLevers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'unit-economics']
}));

export const scenarioAnalysisTask = defineTask('scenario-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Analysis - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Planning Expert',
      task: 'Create scenario and sensitivity analysis',
      context: args,
      instructions: [
        '1. Define base case scenario',
        '2. Create bull case scenario',
        '3. Create bear case scenario',
        '4. Identify key variables for sensitivity',
        '5. Model growth rate sensitivity',
        '6. Model churn sensitivity',
        '7. Model pricing sensitivity',
        '8. Calculate break-even scenarios',
        '9. Document scenario assumptions',
        '10. Create scenario comparison'
      ],
      outputFormat: 'JSON object with scenario analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['baseCase', 'bullCase', 'bearCase', 'sensitivityAnalysis'],
      properties: {
        baseCase: { type: 'object' },
        bullCase: { type: 'object' },
        bearCase: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        breakEvenAnalysis: { type: 'object' },
        comparisonSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'scenarios']
}));

export const cashFlowProjectionsTask = defineTask('cash-flow-projections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cash Flow Projections - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cash Flow Management Expert',
      task: 'Build cash flow projections and runway analysis',
      context: args,
      instructions: [
        '1. Project monthly cash flow',
        '2. Model collections timing',
        '3. Project payment timing',
        '4. Include funding events',
        '5. Calculate runway in months',
        '6. Identify cash milestones',
        '7. Model cash minimum requirements',
        '8. Plan for seasonal variations',
        '9. Create cash flow waterfall',
        '10. Identify funding triggers'
      ],
      outputFormat: 'JSON object with cash flow projections'
    },
    outputSchema: {
      type: 'object',
      required: ['cashFlow', 'runway', 'fundingNeeds'],
      properties: {
        cashFlow: { type: 'object' },
        runway: { type: 'number' },
        fundingNeeds: { type: 'object' },
        cashMilestones: { type: 'array', items: { type: 'object' } },
        fundingTriggers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'cash-flow']
}));

export const dashboardCreationTask = defineTask('dashboard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard Creation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Dashboard Expert',
      task: 'Create financial model dashboard for reporting',
      context: args,
      instructions: [
        '1. Design executive summary dashboard',
        '2. Create key metrics visualization',
        '3. Build revenue dashboard',
        '4. Create expense dashboard',
        '5. Build unit economics dashboard',
        '6. Create scenario comparison view',
        '7. Build cash flow dashboard',
        '8. Add trend visualizations',
        '9. Include assumption toggles',
        '10. Create investor-ready views'
      ],
      outputFormat: 'JSON object with dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'keyMetrics', 'visualizations'],
      properties: {
        dashboards: { type: 'array', items: { type: 'object' } },
        keyMetrics: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        investorViews: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'financial-model', 'dashboard']
}));
