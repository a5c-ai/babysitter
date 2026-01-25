/**
 * @process civil-engineering/construction-cost-estimation
 * @description Development of construction cost estimates including quantity takeoffs, unit pricing, and contingency analysis
 * @inputs { projectId: string, designDocuments: object, projectScope: object, marketConditions: object }
 * @outputs { success: boolean, costEstimate: object, quantitySchedules: array, bidTabulation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    designDocuments,
    projectScope,
    marketConditions,
    estimateClass = 'Class3',
    contingencyLevel = 15,
    outputDir = 'cost-estimate-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Project Scope Definition
  ctx.log('info', 'Starting cost estimation: Project scope definition');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    projectId,
    projectScope,
    designDocuments,
    outputDir
  });

  if (!scopeDefinition.success) {
    return {
      success: false,
      error: 'Scope definition failed',
      details: scopeDefinition,
      metadata: { processId: 'civil-engineering/construction-cost-estimation', timestamp: startTime }
    };
  }

  artifacts.push(...scopeDefinition.artifacts);

  // Task 2: Quantity Takeoff
  ctx.log('info', 'Performing quantity takeoff');
  const quantityTakeoff = await ctx.task(quantityTakeoffTask, {
    projectId,
    designDocuments,
    scopeDefinition,
    outputDir
  });

  artifacts.push(...quantityTakeoff.artifacts);

  // Task 3: Unit Cost Development
  ctx.log('info', 'Developing unit costs');
  const unitCosts = await ctx.task(unitCostTask, {
    projectId,
    quantityTakeoff,
    marketConditions,
    outputDir
  });

  artifacts.push(...unitCosts.artifacts);

  // Task 4: Direct Cost Calculation
  ctx.log('info', 'Calculating direct costs');
  const directCosts = await ctx.task(directCostTask, {
    projectId,
    quantityTakeoff,
    unitCosts,
    outputDir
  });

  artifacts.push(...directCosts.artifacts);

  // Task 5: Indirect Cost Calculation
  ctx.log('info', 'Calculating indirect costs');
  const indirectCosts = await ctx.task(indirectCostTask, {
    projectId,
    directCosts,
    projectScope,
    outputDir
  });

  artifacts.push(...indirectCosts.artifacts);

  // Breakpoint: Review cost estimate
  const totalCost = directCosts.total + indirectCosts.total;
  await ctx.breakpoint({
    question: `Cost estimate complete for ${projectId}. Total: $${totalCost.toLocaleString()}. Review estimate breakdown?`,
    title: 'Construction Cost Estimate Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        directCosts: directCosts.total,
        indirectCosts: indirectCosts.total,
        subtotal: totalCost,
        estimateClass: estimateClass
      }
    }
  });

  // Task 6: Contingency Analysis
  ctx.log('info', 'Performing contingency analysis');
  const contingencyAnalysis = await ctx.task(contingencyAnalysisTask, {
    projectId,
    directCosts,
    indirectCosts,
    estimateClass,
    contingencyLevel,
    outputDir
  });

  artifacts.push(...contingencyAnalysis.artifacts);

  // Task 7: Bid Tabulation Format
  ctx.log('info', 'Developing bid tabulation');
  const bidTabulation = await ctx.task(bidTabulationTask, {
    projectId,
    quantityTakeoff,
    unitCosts,
    directCosts,
    outputDir
  });

  artifacts.push(...bidTabulation.artifacts);

  // Task 8: Cost Estimate Report
  ctx.log('info', 'Generating cost estimate report');
  const costReport = await ctx.task(costReportTask, {
    projectId,
    scopeDefinition,
    quantityTakeoff,
    unitCosts,
    directCosts,
    indirectCosts,
    contingencyAnalysis,
    bidTabulation,
    outputDir
  });

  artifacts.push(...costReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  const totalWithContingency = totalCost + contingencyAnalysis.contingencyAmount;

  return {
    success: true,
    costEstimate: {
      directCosts: directCosts.breakdown,
      indirectCosts: indirectCosts.breakdown,
      subtotal: totalCost,
      contingency: contingencyAnalysis.contingencyAmount,
      totalEstimate: totalWithContingency,
      estimateClass: estimateClass
    },
    quantitySchedules: quantityTakeoff.schedules,
    bidTabulation: bidTabulation.tabulation,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/construction-cost-estimation',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define project scope',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'senior cost estimator',
      task: 'Define project scope for cost estimation',
      context: args,
      instructions: [
        'Review design documents and specifications',
        'Identify work breakdown structure',
        'Define bid items and pay items',
        'Identify scope inclusions and exclusions',
        'Document assumptions and qualifications',
        'Define estimate basis and level of detail',
        'Identify long-lead items',
        'Create scope summary'
      ],
      outputFormat: 'JSON with scope definition, WBS, assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'wbs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        wbs: { type: 'array' },
        bidItems: { type: 'array' },
        inclusions: { type: 'array' },
        exclusions: { type: 'array' },
        assumptions: { type: 'array' },
        longLeadItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'scope']
}));

// Task 2: Quantity Takeoff
export const quantityTakeoffTask = defineTask('quantity-takeoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform quantity takeoff',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'quantity surveyor',
      task: 'Perform detailed quantity takeoff',
      context: args,
      instructions: [
        'Calculate earthwork quantities (cut, fill, stripping)',
        'Calculate concrete quantities by element',
        'Calculate reinforcing steel quantities',
        'Calculate structural steel quantities',
        'Calculate piping quantities',
        'Calculate paving quantities',
        'Calculate utility quantities',
        'Generate quantity schedules by WBS'
      ],
      outputFormat: 'JSON with quantity takeoffs, schedules'
    },
    outputSchema: {
      type: 'object',
      required: ['quantities', 'schedules', 'artifacts'],
      properties: {
        quantities: { type: 'object' },
        schedules: { type: 'array' },
        earthwork: { type: 'object' },
        concrete: { type: 'object' },
        steel: { type: 'object' },
        piping: { type: 'object' },
        paving: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'quantity-takeoff']
}));

// Task 3: Unit Cost Development
export const unitCostTask = defineTask('unit-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop unit costs',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'cost estimator',
      task: 'Develop unit costs for bid items',
      context: args,
      instructions: [
        'Research current material prices',
        'Research equipment rental rates',
        'Develop labor rates including burden',
        'Calculate crew productivity rates',
        'Build up unit prices from components',
        'Apply market condition adjustments',
        'Document unit cost sources',
        'Create unit cost database'
      ],
      outputFormat: 'JSON with unit costs, buildup details'
    },
    outputSchema: {
      type: 'object',
      required: ['unitCosts', 'artifacts'],
      properties: {
        unitCosts: { type: 'object' },
        materialPrices: { type: 'object' },
        laborRates: { type: 'object' },
        equipmentRates: { type: 'object' },
        productivityFactors: { type: 'object' },
        costSources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'unit-costs']
}));

// Task 4: Direct Cost Calculation
export const directCostTask = defineTask('direct-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate direct costs',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'cost estimator',
      task: 'Calculate direct construction costs',
      context: args,
      instructions: [
        'Multiply quantities by unit costs',
        'Organize costs by CSI division',
        'Calculate material costs',
        'Calculate labor costs',
        'Calculate equipment costs',
        'Calculate subcontractor costs',
        'Summarize direct costs by WBS',
        'Create direct cost summary'
      ],
      outputFormat: 'JSON with direct cost breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'breakdown', 'artifacts'],
      properties: {
        total: { type: 'number' },
        breakdown: { type: 'object' },
        byDivision: { type: 'object' },
        byWBS: { type: 'object' },
        materialTotal: { type: 'number' },
        laborTotal: { type: 'number' },
        equipmentTotal: { type: 'number' },
        subcontractorTotal: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'direct-costs']
}));

// Task 5: Indirect Cost Calculation
export const indirectCostTask = defineTask('indirect-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate indirect costs',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'cost estimator',
      task: 'Calculate indirect construction costs',
      context: args,
      instructions: [
        'Calculate general conditions costs',
        'Calculate project management costs',
        'Calculate mobilization/demobilization',
        'Calculate bonds and insurance',
        'Calculate temporary facilities',
        'Calculate contractor overhead',
        'Calculate contractor profit',
        'Summarize indirect costs'
      ],
      outputFormat: 'JSON with indirect cost breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'breakdown', 'artifacts'],
      properties: {
        total: { type: 'number' },
        breakdown: { type: 'object' },
        generalConditions: { type: 'number' },
        mobilization: { type: 'number' },
        bondsInsurance: { type: 'number' },
        overhead: { type: 'number' },
        profit: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'indirect-costs']
}));

// Task 6: Contingency Analysis
export const contingencyAnalysisTask = defineTask('contingency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform contingency analysis',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'senior cost estimator',
      task: 'Analyze and apply contingency',
      context: args,
      instructions: [
        'Assess estimate uncertainty',
        'Identify risk factors',
        'Perform Monte Carlo simulation if warranted',
        'Determine appropriate contingency percentage',
        'Apply contingency by risk category',
        'Calculate escalation if applicable',
        'Document contingency rationale',
        'Provide confidence range'
      ],
      outputFormat: 'JSON with contingency analysis, risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['contingencyAmount', 'contingencyPercent', 'artifacts'],
      properties: {
        contingencyAmount: { type: 'number' },
        contingencyPercent: { type: 'number' },
        riskFactors: { type: 'array' },
        escalation: { type: 'number' },
        confidenceRange: { type: 'object' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'contingency']
}));

// Task 7: Bid Tabulation
export const bidTabulationTask = defineTask('bid-tabulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop bid tabulation',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'cost estimator',
      task: 'Develop bid tabulation format',
      context: args,
      instructions: [
        'Organize bid items by specification section',
        'Format quantities with units',
        'Include unit prices and extended amounts',
        'Create bid schedule format',
        'Include allowances and alternates',
        'Format for contractor bidding',
        'Include bid summary sheet',
        'Create tabulation spreadsheet'
      ],
      outputFormat: 'JSON with bid tabulation, schedules'
    },
    outputSchema: {
      type: 'object',
      required: ['tabulation', 'artifacts'],
      properties: {
        tabulation: { type: 'object' },
        bidSchedule: { type: 'array' },
        allowances: { type: 'array' },
        alternates: { type: 'array' },
        summarySheet: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'bid-tabulation']
}));

// Task 8: Cost Estimate Report
export const costReportTask = defineTask('cost-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cost estimate report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'cost estimator',
      task: 'Generate comprehensive cost estimate report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document estimate basis and scope',
        'Present quantity takeoff summary',
        'Present unit cost backup',
        'Present direct cost breakdown',
        'Present indirect cost breakdown',
        'Document contingency analysis',
        'Include bid tabulation',
        'Provide recommendations'
      ],
      outputFormat: 'JSON with report path, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'cost-estimation', 'reporting']
}));
