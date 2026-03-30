/**
 * @file annual-budget-development.js
 * @description Comprehensive process for creating organization-wide annual operating budgets including departmental submissions, consolidation, executive review, and board approval
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Annual Budget Development Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.fiscalYear - The fiscal year for budget development
 * @param {Array} inputs.departments - List of departments to include
 * @param {Object} inputs.strategicGoals - Organization strategic goals and priorities
 * @param {Object} inputs.assumptions - Key planning assumptions (growth rates, inflation, etc.)
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Process results including consolidated budget
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Budget Calendar and Guidelines Development
  const calendarResult = await ctx.task(developBudgetCalendarTask, {
    fiscalYear: inputs.fiscalYear,
    departments: inputs.departments,
    strategicGoals: inputs.strategicGoals
  });
  results.steps.push({ name: 'budget-calendar-development', result: calendarResult });

  // Step 2: Develop Budget Assumptions and Templates
  const assumptionsResult = await ctx.task(developAssumptionsTask, {
    fiscalYear: inputs.fiscalYear,
    baseAssumptions: inputs.assumptions,
    strategicGoals: inputs.strategicGoals
  });
  results.steps.push({ name: 'budget-assumptions', result: assumptionsResult });

  // Breakpoint for executive review of assumptions
  await ctx.breakpoint('assumptions-review', {
    message: 'Review budget assumptions and planning guidelines before distributing to departments',
    data: { calendar: calendarResult, assumptions: assumptionsResult }
  });

  // Step 3: Departmental Budget Collection
  const departmentalResult = await ctx.task(collectDepartmentalBudgetsTask, {
    departments: inputs.departments,
    assumptions: assumptionsResult,
    calendar: calendarResult
  });
  results.steps.push({ name: 'departmental-collection', result: departmentalResult });

  // Breakpoint for initial departmental review
  await ctx.breakpoint('departmental-review', {
    message: 'Review departmental submissions for completeness and alignment with guidelines',
    data: departmentalResult
  });

  // Step 4: Budget Consolidation
  const consolidationResult = await ctx.task(consolidateBudgetsTask, {
    departmentalBudgets: departmentalResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'budget-consolidation', result: consolidationResult });

  // Step 5: Variance and Gap Analysis
  const analysisResult = await ctx.task(analyzeGapsTask, {
    consolidatedBudget: consolidationResult,
    strategicGoals: inputs.strategicGoals,
    priorYearActuals: inputs.priorYearActuals
  });
  results.steps.push({ name: 'gap-analysis', result: analysisResult });

  // Breakpoint for executive review
  await ctx.breakpoint('executive-review', {
    message: 'Executive review of consolidated budget and gap analysis before adjustments',
    data: { consolidation: consolidationResult, analysis: analysisResult }
  });

  // Step 6: Budget Adjustments and Iterations
  const adjustmentsResult = await ctx.task(processAdjustmentsTask, {
    consolidatedBudget: consolidationResult,
    gapAnalysis: analysisResult,
    executiveFeedback: ctx.getBreakpointData('executive-review')
  });
  results.steps.push({ name: 'budget-adjustments', result: adjustmentsResult });

  // Step 7: Final Budget Package Preparation
  const packageResult = await ctx.task(prepareBudgetPackageTask, {
    finalBudget: adjustmentsResult,
    fiscalYear: inputs.fiscalYear,
    strategicGoals: inputs.strategicGoals
  });
  results.steps.push({ name: 'budget-package', result: packageResult });

  // Breakpoint for board approval
  await ctx.breakpoint('board-approval', {
    message: 'Final budget package ready for board presentation and approval',
    data: packageResult
  });

  results.outputs = {
    approvedBudget: packageResult,
    fiscalYear: inputs.fiscalYear,
    approvalDate: new Date().toISOString()
  };

  return results;
}

// Task definitions
export const developBudgetCalendarTask = defineTask('develop-budget-calendar', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'budget-coordinator',
    prompt: {
      system: 'You are an expert FP&A professional specializing in budget coordination and planning. Create comprehensive budget calendars with clear milestones, deadlines, and responsibilities.',
      user: `Develop a detailed budget calendar for fiscal year ${args.fiscalYear}.

Departments to include: ${JSON.stringify(args.departments)}
Strategic goals to align with: ${JSON.stringify(args.strategicGoals)}

Create a timeline including:
1. Budget kickoff meeting date
2. Assumption distribution deadline
3. Departmental submission deadlines
4. Review and iteration periods
5. Executive review sessions
6. Board presentation date
7. Final approval target date

Include responsibility assignments and escalation procedures.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developAssumptionsTask = defineTask('develop-budget-assumptions', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'fp-analyst',
    prompt: {
      system: 'You are a senior financial planning and analysis professional. Develop comprehensive budget assumptions that drive accurate financial projections.',
      user: `Develop detailed budget assumptions for fiscal year ${args.fiscalYear}.

Base assumptions provided: ${JSON.stringify(args.baseAssumptions)}
Strategic goals: ${JSON.stringify(args.strategicGoals)}

Document assumptions for:
1. Revenue growth rates by segment/product
2. Inflation and cost escalation factors
3. Headcount and compensation assumptions
4. Capital expenditure guidelines
5. Working capital assumptions
6. Interest rate and FX assumptions
7. Tax rate assumptions

Provide supporting rationale and data sources for each assumption.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const collectDepartmentalBudgetsTask = defineTask('collect-departmental-budgets', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'budget-analyst',
    prompt: {
      system: 'You are a budget analyst responsible for collecting, validating, and organizing departmental budget submissions.',
      user: `Facilitate departmental budget collection process.

Departments: ${JSON.stringify(args.departments)}
Planning assumptions: ${JSON.stringify(args.assumptions)}
Calendar milestones: ${JSON.stringify(args.calendar)}

For each department, ensure:
1. Operating expense budgets are complete
2. Revenue budgets (if applicable) are documented
3. Capital requests are justified
4. Headcount plans are detailed
5. Initiative budgets are tied to strategic goals
6. Assumptions are applied consistently

Track submission status and follow up on outstanding items.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const consolidateBudgetsTask = defineTask('consolidate-budgets', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-consolidation' },
  agent: {
    name: 'consolidation-analyst',
    prompt: {
      system: 'You are a financial consolidation specialist. Aggregate departmental budgets into a cohesive organizational budget with proper eliminations and allocations.',
      user: `Consolidate departmental budgets for fiscal year ${args.fiscalYear}.

Departmental submissions: ${JSON.stringify(args.departmentalBudgets)}

Perform:
1. Roll up all departmental P&L budgets
2. Consolidate balance sheet impacts
3. Build consolidated cash flow projection
4. Apply intercompany eliminations
5. Allocate shared costs appropriately
6. Create summary views by entity, department, and cost center
7. Generate monthly and quarterly phasing

Highlight any inconsistencies or issues found during consolidation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeGapsTask = defineTask('analyze-budget-gaps', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'strategic-analyst',
    prompt: {
      system: 'You are a strategic financial analyst specializing in budget analysis and gap identification.',
      user: `Analyze the consolidated budget against strategic objectives.

Consolidated budget: ${JSON.stringify(args.consolidatedBudget)}
Strategic goals: ${JSON.stringify(args.strategicGoals)}
Prior year actuals: ${JSON.stringify(args.priorYearActuals)}

Analyze:
1. Year-over-year changes by category
2. Alignment with strategic investment priorities
3. Resource allocation vs. strategic imperatives
4. Risk areas and contingency needs
5. Profitability and margin analysis
6. Cash flow adequacy
7. Key performance indicators

Identify gaps and recommend adjustments to better achieve strategic goals.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const processAdjustmentsTask = defineTask('process-budget-adjustments', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'budget-coordinator',
    prompt: {
      system: 'You are a budget coordinator responsible for implementing executive feedback and optimizing the final budget.',
      user: `Process budget adjustments based on executive review.

Current consolidated budget: ${JSON.stringify(args.consolidatedBudget)}
Gap analysis findings: ${JSON.stringify(args.gapAnalysis)}
Executive feedback: ${JSON.stringify(args.executiveFeedback)}

Implement:
1. Required cuts or additions by department
2. Reallocation of resources to priority areas
3. Updated phasing based on timing changes
4. Contingency reserve adjustments
5. Updated projections incorporating changes
6. Documentation of all changes and rationale

Ensure all adjustments are properly reflected in the consolidated view.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareBudgetPackageTask = defineTask('prepare-budget-package', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'executive-reporting' },
  agent: {
    name: 'reporting-analyst',
    prompt: {
      system: 'You are a financial reporting specialist who creates executive-level budget presentations for board approval.',
      user: `Prepare the final budget package for board presentation.

Final budget: ${JSON.stringify(args.finalBudget)}
Fiscal year: ${args.fiscalYear}
Strategic goals: ${JSON.stringify(args.strategicGoals)}

Create:
1. Executive summary with key highlights
2. Consolidated financial statements
3. Key assumptions and risks summary
4. Strategic initiative funding overview
5. Capital expenditure summary
6. Headcount summary by department
7. Cash flow and liquidity analysis
8. Sensitivity analysis on key drivers
9. Comparison to prior year and industry benchmarks
10. Appendices with detailed supporting schedules

Format for board presentation with clear visualizations and talking points.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
