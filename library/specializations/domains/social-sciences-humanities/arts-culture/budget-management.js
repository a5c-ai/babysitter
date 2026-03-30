/**
 * @process arts-culture/budget-management
 * @description Financial planning and management workflow for arts organizations including annual budgeting, cash flow management, variance analysis, and financial reporting
 * @inputs { fiscalYear: string, organizationType: string, annualBudget: number, reportingPeriod: string }
 * @outputs { success: boolean, budgetReport: object, varianceAnalysis: object, cashFlowForecast: object, artifacts: array }
 * @recommendedSkills SK-AC-002 (grant-proposal-writing), SK-AC-009 (donor-relationship-management), SK-AC-007 (audience-analytics)
 * @recommendedAgents AG-AC-002 (arts-administrator-agent), AG-AC-003 (development-officer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fiscalYear,
    organizationType = 'nonprofit',
    annualBudget,
    reportingPeriod = 'monthly',
    organizationName = '',
    outputDir = 'budget-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Revenue Projection
  ctx.log('info', 'Starting budget management: Revenue projection');
  const revenueProjection = await ctx.task(revenueProjectionTask, {
    fiscalYear,
    organizationType,
    annualBudget,
    organizationName,
    outputDir
  });

  if (!revenueProjection.success) {
    return {
      success: false,
      error: 'Revenue projection failed',
      details: revenueProjection,
      metadata: { processId: 'arts-culture/budget-management', timestamp: startTime }
    };
  }

  artifacts.push(...revenueProjection.artifacts);

  // Task 2: Expense Planning
  ctx.log('info', 'Planning expenses');
  const expensePlanning = await ctx.task(expensePlanningTask, {
    fiscalYear,
    organizationType,
    projectedRevenue: revenueProjection.totalRevenue,
    outputDir
  });

  artifacts.push(...expensePlanning.artifacts);

  // Task 3: Cash Flow Forecasting
  ctx.log('info', 'Forecasting cash flow');
  const cashFlowForecast = await ctx.task(cashFlowForecastTask, {
    fiscalYear,
    revenueProjection,
    expensePlanning,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...cashFlowForecast.artifacts);

  // Task 4: Budget Allocation
  ctx.log('info', 'Allocating budget by department');
  const budgetAllocation = await ctx.task(budgetAllocationTask, {
    fiscalYear,
    organizationType,
    revenueProjection,
    expensePlanning,
    outputDir
  });

  artifacts.push(...budgetAllocation.artifacts);

  // Task 5: Variance Analysis Setup
  ctx.log('info', 'Setting up variance analysis');
  const varianceSetup = await ctx.task(varianceAnalysisTask, {
    fiscalYear,
    budgetAllocation,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...varianceSetup.artifacts);

  // Task 6: Financial Reporting Framework
  ctx.log('info', 'Establishing financial reporting framework');
  const reportingFramework = await ctx.task(reportingFrameworkTask, {
    fiscalYear,
    organizationType,
    reportingPeriod,
    budgetAllocation,
    outputDir
  });

  artifacts.push(...reportingFramework.artifacts);

  // Breakpoint: Review budget
  await ctx.breakpoint({
    question: `Budget for FY${fiscalYear} complete. Total: $${annualBudget}. Projected surplus/deficit: $${revenueProjection.totalRevenue - expensePlanning.totalExpenses}. Review?`,
    title: 'Budget Management Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        fiscalYear,
        totalRevenue: revenueProjection.totalRevenue,
        totalExpenses: expensePlanning.totalExpenses,
        netResult: revenueProjection.totalRevenue - expensePlanning.totalExpenses,
        cashFlowStatus: cashFlowForecast.status
      }
    }
  });

  // Task 7: Generate Budget Documentation
  ctx.log('info', 'Generating budget documentation');
  const documentation = await ctx.task(budgetDocumentationTask, {
    fiscalYear,
    organizationName,
    revenueProjection,
    expensePlanning,
    cashFlowForecast,
    budgetAllocation,
    varianceSetup,
    reportingFramework,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    budgetReport: {
      fiscalYear,
      totalRevenue: revenueProjection.totalRevenue,
      totalExpenses: expensePlanning.totalExpenses,
      allocations: budgetAllocation.allocations
    },
    varianceAnalysis: varianceSetup,
    cashFlowForecast: cashFlowForecast,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/budget-management',
      timestamp: startTime,
      fiscalYear,
      outputDir
    }
  };
}

// Task 1: Revenue Projection
export const revenueProjectionTask = defineTask('revenue-projection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project revenue',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'arts finance manager',
      task: 'Develop revenue projections for fiscal year',
      context: args,
      instructions: [
        'Analyze historical revenue trends',
        'Project earned revenue (admissions, programs, shop)',
        'Estimate contributed revenue (grants, donations)',
        'Project membership and subscription revenue',
        'Include special events and fundraising',
        'Consider government support and subsidies',
        'Factor in investment and endowment income',
        'Create monthly revenue forecast'
      ],
      outputFormat: 'JSON with success, totalRevenue, revenueBySource, monthlyForecast, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalRevenue', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalRevenue: { type: 'number' },
        revenueBySource: {
          type: 'object',
          properties: {
            earned: { type: 'number' },
            contributed: { type: 'number' },
            membership: { type: 'number' },
            events: { type: 'number' },
            investment: { type: 'number' }
          }
        },
        monthlyForecast: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finance', 'revenue', 'projection']
}));

// Task 2: Expense Planning
export const expensePlanningTask = defineTask('expense-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan expenses',
  agent: {
    name: 'budget-manager',
    prompt: {
      role: 'arts budget manager',
      task: 'Develop expense budget for fiscal year',
      context: args,
      instructions: [
        'Analyze historical expense patterns',
        'Budget personnel costs (salaries, benefits)',
        'Plan program and exhibition costs',
        'Budget facilities and operations',
        'Include marketing and communications',
        'Plan fundraising costs',
        'Add administrative expenses',
        'Include contingency reserves'
      ],
      outputFormat: 'JSON with totalExpenses, expensesByCategory, monthlyForecast, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalExpenses', 'artifacts'],
      properties: {
        totalExpenses: { type: 'number' },
        expensesByCategory: {
          type: 'object',
          properties: {
            personnel: { type: 'number' },
            programs: { type: 'number' },
            facilities: { type: 'number' },
            marketing: { type: 'number' },
            fundraising: { type: 'number' },
            administrative: { type: 'number' },
            contingency: { type: 'number' }
          }
        },
        monthlyForecast: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finance', 'expenses', 'planning']
}));

// Task 3: Cash Flow Forecasting
export const cashFlowForecastTask = defineTask('cash-flow-forecast', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast cash flow',
  agent: {
    name: 'cash-flow-analyst',
    prompt: {
      role: 'treasury manager',
      task: 'Develop cash flow forecast and management plan',
      context: args,
      instructions: [
        'Map revenue timing and collection patterns',
        'Schedule expense payments',
        'Identify cash flow peaks and valleys',
        'Plan for seasonal variations',
        'Calculate minimum cash reserves',
        'Identify potential shortfalls',
        'Plan line of credit usage if needed',
        'Create monthly cash flow projection'
      ],
      outputFormat: 'JSON with forecast, status, minimumReserve, shortfalls, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forecast', 'status', 'artifacts'],
      properties: {
        forecast: { type: 'array' },
        status: { type: 'string' },
        minimumReserve: { type: 'number' },
        shortfalls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              amount: { type: 'number' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finance', 'cash-flow', 'treasury']
}));

// Task 4: Budget Allocation
export const budgetAllocationTask = defineTask('budget-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate budget by department',
  agent: {
    name: 'budget-coordinator',
    prompt: {
      role: 'budget coordinator',
      task: 'Allocate budget to departments and programs',
      context: args,
      instructions: [
        'Review departmental budget requests',
        'Align allocations with strategic priorities',
        'Balance program and operational needs',
        'Consider restricted fund requirements',
        'Allocate overhead and shared costs',
        'Set departmental spending limits',
        'Define approval thresholds',
        'Create departmental budget sheets'
      ],
      outputFormat: 'JSON with allocations, departmentBudgets, restrictions, approvalLevels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocations', 'artifacts'],
      properties: {
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              department: { type: 'string' },
              allocation: { type: 'number' },
              restricted: { type: 'number' },
              unrestricted: { type: 'number' }
            }
          }
        },
        departmentBudgets: { type: 'object' },
        restrictions: { type: 'array' },
        approvalLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'budget', 'allocation', 'departments']
}));

// Task 5: Variance Analysis Setup
export const varianceAnalysisTask = defineTask('variance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up variance analysis',
  agent: {
    name: 'variance-analyst',
    prompt: {
      role: 'financial analyst',
      task: 'Establish variance analysis framework',
      context: args,
      instructions: [
        'Define variance thresholds by category',
        'Set up budget vs actual tracking',
        'Create variance reporting templates',
        'Define investigation triggers',
        'Plan corrective action processes',
        'Establish reforecast procedures',
        'Create dashboard metrics',
        'Define escalation protocols'
      ],
      outputFormat: 'JSON with thresholds, trackingSetup, reportingTemplates, escalationProtocol, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['thresholds', 'artifacts'],
      properties: {
        thresholds: {
          type: 'object',
          properties: {
            revenue: { type: 'number' },
            expenses: { type: 'number' },
            department: { type: 'number' }
          }
        },
        trackingSetup: { type: 'object' },
        reportingTemplates: { type: 'array' },
        escalationProtocol: { type: 'object' },
        dashboardMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finance', 'variance', 'analysis']
}));

// Task 6: Financial Reporting Framework
export const reportingFrameworkTask = defineTask('reporting-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish reporting framework',
  agent: {
    name: 'reporting-manager',
    prompt: {
      role: 'financial reporting manager',
      task: 'Establish financial reporting framework',
      context: args,
      instructions: [
        'Define reporting calendar and deadlines',
        'Create board financial report template',
        'Design management dashboard',
        'Establish funder reporting requirements',
        'Plan audit preparation procedures',
        'Define key performance indicators',
        'Create report distribution list',
        'Document reporting procedures'
      ],
      outputFormat: 'JSON with calendar, templates, kpis, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'artifacts'],
      properties: {
        calendar: { type: 'object' },
        templates: { type: 'array' },
        kpis: { type: 'array' },
        procedures: { type: 'object' },
        distributionList: { type: 'array' },
        auditPrep: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'finance', 'reporting', 'framework']
}));

// Task 7: Budget Documentation
export const budgetDocumentationTask = defineTask('budget-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate budget documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'financial documentation specialist',
      task: 'Compile comprehensive budget documentation',
      context: args,
      instructions: [
        'Create executive budget summary',
        'Compile detailed budget workbook',
        'Generate board presentation materials',
        'Create budget narrative',
        'Document assumptions and methodology',
        'Prepare audit working papers',
        'Create staff budget guidelines',
        'Generate funder budget formats'
      ],
      outputFormat: 'JSON with documentation, summary, presentation, guidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            detailedWorkbook: { type: 'string' },
            boardPresentation: { type: 'string' }
          }
        },
        summary: { type: 'string' },
        presentation: { type: 'string' },
        guidelines: { type: 'string' },
        assumptions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'budget', 'finance']
}));
