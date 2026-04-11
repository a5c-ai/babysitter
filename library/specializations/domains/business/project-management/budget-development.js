/**
 * @process specializations/domains/business/project-management/budget-development
 * @description Budget Development and Cost Estimation - Develop project budget using estimation techniques
 * (analogous, parametric, bottom-up), establish contingency reserves, and create cost baseline with
 * comprehensive financial planning and resource cost analysis.
 * @inputs { projectName: string, projectScope: object, resources: array, constraints?: object, historicalData?: object }
 * @outputs { success: boolean, budgetDocument: object, costBaseline: object, contingencyReserves: object, estimationDetails: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/budget-development', {
 *   projectName: 'Digital Transformation Initiative',
 *   projectScope: { wbs: [...], deliverables: [...], timeline: '12 months' },
 *   resources: [{ type: 'developer', count: 5, rate: 150 }, { type: 'PM', count: 1, rate: 175 }],
 *   constraints: { totalBudget: 2000000, timeline: '12 months' },
 *   historicalData: { similarProjects: [...], actualCosts: [...] }
 * });
 *
 * @references
 * - PMI PMBOK Guide - Cost Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Cost Estimation Best Practices: https://www.pmi.org/learning/library/cost-estimation-budgeting-project-success-6187
 * - Earned Value Management: https://www.pmi.org/learning/library/earned-value-management-best-practices-6133
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectScope,
    resources = [],
    constraints = {},
    historicalData = {},
    currency = 'USD',
    contingencyPercentage = 15,
    managementReservePercentage = 10
  } = inputs;

  // Phase 1: Cost Estimation Strategy Selection
  const estimationStrategy = await ctx.task(estimationStrategyTask, {
    projectName,
    projectScope,
    historicalData,
    constraints
  });

  // Quality Gate: Estimation approach must be defined
  if (!estimationStrategy.selectedApproaches || estimationStrategy.selectedApproaches.length === 0) {
    return {
      success: false,
      error: 'Cost estimation approach not defined',
      phase: 'estimation-strategy',
      budgetDocument: null
    };
  }

  // Breakpoint: Review estimation strategy
  await ctx.breakpoint({
    question: `Review cost estimation strategy for ${projectName}. Selected approaches: ${estimationStrategy.selectedApproaches.join(', ')}. Proceed with estimation?`,
    title: 'Cost Estimation Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      approaches: estimationStrategy.selectedApproaches,
      rationale: estimationStrategy.rationale,
      files: [{
        path: `artifacts/phase1-estimation-strategy.json`,
        format: 'json',
        content: estimationStrategy
      }]
    }
  });

  // Phase 2: Resource Cost Analysis
  const resourceCostAnalysis = await ctx.task(resourceCostAnalysisTask, {
    projectName,
    resources,
    projectScope,
    currency
  });

  // Phase 3: Bottom-Up Cost Estimation
  const bottomUpEstimate = await ctx.task(bottomUpEstimationTask, {
    projectName,
    projectScope,
    resourceCostAnalysis,
    currency
  });

  // Phase 4: Analogous and Parametric Estimation
  const comparativeEstimates = await ctx.task(comparativeEstimationTask, {
    projectName,
    projectScope,
    historicalData,
    bottomUpEstimate,
    currency
  });

  // Phase 5: Estimate Reconciliation
  const reconciledEstimate = await ctx.task(estimateReconciliationTask, {
    projectName,
    bottomUpEstimate,
    comparativeEstimates,
    estimationStrategy
  });

  // Quality Gate: Estimates must converge within acceptable variance
  const estimateVariance = reconciledEstimate.variancePercentage || 100;
  if (estimateVariance > 25) {
    await ctx.breakpoint({
      question: `Estimate variance is ${estimateVariance}% (threshold: 25%). Review estimation discrepancies and determine approach?`,
      title: 'Estimate Variance Warning',
      context: {
        runId: ctx.runId,
        variance: estimateVariance,
        bottomUpTotal: bottomUpEstimate.totalCost,
        analogousTotal: comparativeEstimates.analogousEstimate?.total,
        recommendation: 'Review assumptions and refine estimates before proceeding'
      }
    });
  }

  // Phase 6: Contingency and Reserve Analysis
  const reserveAnalysis = await ctx.task(reserveAnalysisTask, {
    projectName,
    reconciledEstimate,
    projectScope,
    contingencyPercentage,
    managementReservePercentage,
    constraints
  });

  // Phase 7: Cost Baseline Development
  const costBaseline = await ctx.task(costBaselineDevelopmentTask, {
    projectName,
    reconciledEstimate,
    reserveAnalysis,
    projectScope,
    currency
  });

  // Phase 8: Cash Flow Analysis
  const cashFlowAnalysis = await ctx.task(cashFlowAnalysisTask, {
    projectName,
    costBaseline,
    projectScope,
    currency
  });

  // Phase 9: Budget Risk Assessment
  const budgetRiskAssessment = await ctx.task(budgetRiskAssessmentTask, {
    projectName,
    costBaseline,
    reserveAnalysis,
    constraints,
    estimationStrategy
  });

  // Phase 10: Final Budget Document Generation
  const budgetDocument = await ctx.task(budgetDocumentGenerationTask, {
    projectName,
    projectScope,
    resources,
    estimationStrategy,
    resourceCostAnalysis,
    reconciledEstimate,
    reserveAnalysis,
    costBaseline,
    cashFlowAnalysis,
    budgetRiskAssessment,
    currency,
    constraints
  });

  // Final Quality Gate: Budget approval readiness
  const budgetApprovalScore = budgetDocument.approvalReadinessScore || 0;
  const ready = budgetApprovalScore >= 80;

  // Final Breakpoint: Budget Approval
  await ctx.breakpoint({
    question: `Budget development complete for ${projectName}. Total Budget: ${currency} ${costBaseline.totalBudget?.toLocaleString()}. Approval readiness: ${budgetApprovalScore}/100. Submit for approval?`,
    title: 'Budget Approval Review',
    context: {
      runId: ctx.runId,
      projectName,
      totalBudget: costBaseline.totalBudget,
      contingencyReserve: reserveAnalysis.contingencyReserve,
      managementReserve: reserveAnalysis.managementReserve,
      approvalReadiness: ready ? 'Ready for approval' : 'Needs refinement',
      files: [
        { path: `artifacts/final-budget-document.json`, format: 'json', content: budgetDocument },
        { path: `artifacts/final-budget-document.md`, format: 'markdown', content: budgetDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    approvalReadinessScore: budgetApprovalScore,
    ready,
    budgetDocument: budgetDocument.document,
    costBaseline: {
      totalBudget: costBaseline.totalBudget,
      baselineByPhase: costBaseline.phaseBreakdown,
      baselineByCategory: costBaseline.categoryBreakdown,
      currency
    },
    contingencyReserves: {
      contingencyReserve: reserveAnalysis.contingencyReserve,
      managementReserve: reserveAnalysis.managementReserve,
      totalReserves: reserveAnalysis.totalReserves,
      reserveJustification: reserveAnalysis.justification
    },
    estimationDetails: {
      methodology: estimationStrategy.selectedApproaches,
      bottomUpTotal: bottomUpEstimate.totalCost,
      analogousEstimate: comparativeEstimates.analogousEstimate?.total,
      parametricEstimate: comparativeEstimates.parametricEstimate?.total,
      reconciledTotal: reconciledEstimate.finalEstimate,
      confidenceLevel: reconciledEstimate.confidenceLevel
    },
    cashFlow: cashFlowAnalysis.monthlyProjections,
    risks: budgetRiskAssessment.risks,
    recommendations: budgetDocument.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/budget-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const estimationStrategyTask = defineTask('estimation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Cost Estimation Strategy Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Cost Estimator with expertise in project financial planning',
      task: 'Select appropriate cost estimation approaches based on project characteristics and available data',
      context: {
        projectName: args.projectName,
        projectScope: args.projectScope,
        historicalData: args.historicalData,
        constraints: args.constraints
      },
      instructions: [
        '1. Analyze project characteristics (size, complexity, novelty, industry)',
        '2. Assess availability and quality of historical data',
        '3. Evaluate WBS completeness for bottom-up estimation feasibility',
        '4. Recommend estimation approaches: bottom-up, analogous, parametric, or combination',
        '5. Define estimation accuracy targets based on project phase (ROM, budget, definitive)',
        '6. Identify estimation assumptions and constraints',
        '7. Define data requirements for each estimation approach',
        '8. Establish estimation validation criteria',
        '9. Recommend tools and techniques for estimation',
        '10. Provide rationale for selected estimation strategy'
      ],
      outputFormat: 'JSON object with estimation strategy details'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedApproaches', 'accuracyTarget', 'rationale'],
      properties: {
        selectedApproaches: {
          type: 'array',
          items: { type: 'string', enum: ['bottom-up', 'analogous', 'parametric', 'three-point', 'expert-judgment'] }
        },
        accuracyTarget: {
          type: 'object',
          properties: {
            estimateClass: { type: 'string', enum: ['ROM', 'budget', 'definitive'] },
            accuracyRange: { type: 'string' },
            confidenceLevel: { type: 'number' }
          }
        },
        dataRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              requiredData: { type: 'array', items: { type: 'string' } },
              availability: { type: 'string', enum: ['available', 'partial', 'not-available'] }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        validationCriteria: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'estimation-strategy', 'cost-management']
}));

export const resourceCostAnalysisTask = defineTask('resource-cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Resource Cost Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Manager with expertise in cost analysis',
      task: 'Analyze resource costs including labor, materials, equipment, and indirect costs',
      context: {
        projectName: args.projectName,
        resources: args.resources,
        projectScope: args.projectScope,
        currency: args.currency
      },
      instructions: [
        '1. Catalog all resource types (labor, materials, equipment, facilities)',
        '2. Calculate labor costs: rates, hours, benefits, overhead',
        '3. Estimate material costs with quantity and unit pricing',
        '4. Calculate equipment costs: purchase, lease, maintenance',
        '5. Include indirect costs: facilities, utilities, administrative',
        '6. Apply burden rates and overhead multipliers',
        '7. Consider cost escalation factors for multi-year projects',
        '8. Identify cost drivers and sensitivities',
        '9. Document rate assumptions and sources',
        '10. Calculate total resource cost breakdown'
      ],
      outputFormat: 'JSON object with detailed resource cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['laborCosts', 'totalResourceCost'],
      properties: {
        laborCosts: {
          type: 'object',
          properties: {
            directLabor: { type: 'number' },
            benefits: { type: 'number' },
            overhead: { type: 'number' },
            total: { type: 'number' },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  count: { type: 'number' },
                  rate: { type: 'number' },
                  hours: { type: 'number' },
                  cost: { type: 'number' }
                }
              }
            }
          }
        },
        materialCosts: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            items: { type: 'array' }
          }
        },
        equipmentCosts: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            items: { type: 'array' }
          }
        },
        indirectCosts: {
          type: 'object',
          properties: {
            facilities: { type: 'number' },
            administrative: { type: 'number' },
            utilities: { type: 'number' },
            total: { type: 'number' }
          }
        },
        costDrivers: { type: 'array', items: { type: 'string' } },
        escalationFactors: { type: 'object' },
        rateAssumptions: { type: 'array', items: { type: 'string' } },
        totalResourceCost: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'resource-cost', 'cost-analysis']
}));

export const bottomUpEstimationTask = defineTask('bottom-up-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Bottom-Up Cost Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cost Estimator with expertise in detailed work package estimation',
      task: 'Develop detailed bottom-up cost estimate from WBS work packages',
      context: {
        projectName: args.projectName,
        projectScope: args.projectScope,
        resourceCostAnalysis: args.resourceCostAnalysis,
        currency: args.currency
      },
      instructions: [
        '1. Decompose project into estimable work packages from WBS',
        '2. Estimate labor hours for each work package',
        '3. Assign resource types and rates to work packages',
        '4. Calculate direct costs for each work package',
        '5. Apply overhead and indirect cost allocation',
        '6. Aggregate estimates to control account level',
        '7. Roll up to project phase and total levels',
        '8. Document estimation basis for each work package',
        '9. Identify estimation confidence levels by work package',
        '10. Generate detailed cost breakdown structure (CBS)'
      ],
      outputFormat: 'JSON object with detailed bottom-up estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['workPackageEstimates', 'totalCost'],
      properties: {
        workPackageEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wbsId: { type: 'string' },
              workPackage: { type: 'string' },
              laborHours: { type: 'number' },
              laborCost: { type: 'number' },
              materialCost: { type: 'number' },
              otherCost: { type: 'number' },
              totalCost: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              basis: { type: 'string' }
            }
          }
        },
        phaseRollup: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              laborCost: { type: 'number' },
              nonLaborCost: { type: 'number' },
              totalCost: { type: 'number' }
            }
          }
        },
        costBreakdownStructure: {
          type: 'object',
          properties: {
            level1: { type: 'array' },
            level2: { type: 'array' },
            level3: { type: 'array' }
          }
        },
        directCosts: { type: 'number' },
        indirectCosts: { type: 'number' },
        totalCost: { type: 'number' },
        estimationBasis: { type: 'string' },
        confidenceLevel: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'bottom-up-estimation', 'cost-management']
}));

export const comparativeEstimationTask = defineTask('comparative-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Analogous and Parametric Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Cost Analyst with expertise in comparative estimation methods',
      task: 'Develop analogous and parametric cost estimates for validation and comparison',
      context: {
        projectName: args.projectName,
        projectScope: args.projectScope,
        historicalData: args.historicalData,
        bottomUpEstimate: args.bottomUpEstimate,
        currency: args.currency
      },
      instructions: [
        '1. Identify comparable past projects for analogous estimation',
        '2. Adjust historical costs for scope, complexity, and inflation',
        '3. Calculate analogous estimate with adjustment factors',
        '4. Identify cost-driving parameters for parametric estimation',
        '5. Develop or apply parametric cost models (cost per unit, regression)',
        '6. Calculate parametric estimate using identified parameters',
        '7. Compare estimates from different methods',
        '8. Document assumptions and adjustment factors',
        '9. Assess confidence level for each estimate type',
        '10. Provide reconciliation recommendations'
      ],
      outputFormat: 'JSON object with comparative estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['analogousEstimate', 'parametricEstimate'],
      properties: {
        analogousEstimate: {
          type: 'object',
          properties: {
            comparableProjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  projectName: { type: 'string' },
                  actualCost: { type: 'number' },
                  adjustmentFactor: { type: 'number' },
                  adjustedCost: { type: 'number' }
                }
              }
            },
            adjustmentFactors: { type: 'object' },
            total: { type: 'number' },
            confidence: { type: 'number' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        parametricEstimate: {
          type: 'object',
          properties: {
            parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  parameter: { type: 'string' },
                  value: { type: 'number' },
                  costPerUnit: { type: 'number' },
                  subtotal: { type: 'number' }
                }
              }
            },
            model: { type: 'string' },
            total: { type: 'number' },
            confidence: { type: 'number' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            bottomUp: { type: 'number' },
            analogous: { type: 'number' },
            parametric: { type: 'number' },
            variance: { type: 'number' },
            recommendation: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'analogous-estimation', 'parametric-estimation']
}));

export const estimateReconciliationTask = defineTask('estimate-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Estimate Reconciliation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cost Engineering Manager with expertise in estimate validation',
      task: 'Reconcile estimates from multiple methods and establish final project estimate',
      context: {
        projectName: args.projectName,
        bottomUpEstimate: args.bottomUpEstimate,
        comparativeEstimates: args.comparativeEstimates,
        estimationStrategy: args.estimationStrategy
      },
      instructions: [
        '1. Compare estimates from all methods side by side',
        '2. Analyze variances between estimation approaches',
        '3. Identify root causes of significant variances',
        '4. Apply weighted averaging based on estimation confidence',
        '5. Resolve estimation discrepancies through analysis',
        '6. Establish final reconciled estimate',
        '7. Document reconciliation rationale and decisions',
        '8. Calculate estimate confidence interval',
        '9. Identify areas requiring additional estimation refinement',
        '10. Recommend estimate validation activities'
      ],
      outputFormat: 'JSON object with reconciled estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['finalEstimate', 'confidenceLevel', 'variancePercentage'],
      properties: {
        estimateComparison: {
          type: 'object',
          properties: {
            bottomUp: { type: 'number' },
            analogous: { type: 'number' },
            parametric: { type: 'number' },
            average: { type: 'number' }
          }
        },
        varianceAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              comparison: { type: 'string' },
              variance: { type: 'number' },
              variancePercent: { type: 'number' },
              rootCause: { type: 'string' }
            }
          }
        },
        weightedReconciliation: {
          type: 'object',
          properties: {
            bottomUpWeight: { type: 'number' },
            analogousWeight: { type: 'number' },
            parametricWeight: { type: 'number' },
            weightedTotal: { type: 'number' }
          }
        },
        finalEstimate: { type: 'number' },
        confidenceLevel: { type: 'number' },
        confidenceInterval: {
          type: 'object',
          properties: {
            low: { type: 'number' },
            expected: { type: 'number' },
            high: { type: 'number' }
          }
        },
        variancePercentage: { type: 'number' },
        reconciliationRationale: { type: 'string' },
        refinementAreas: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'estimate-reconciliation', 'cost-management']
}));

export const reserveAnalysisTask = defineTask('reserve-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Contingency and Reserve Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk and Cost Analyst with expertise in reserve estimation',
      task: 'Develop contingency reserves and management reserves based on risk analysis',
      context: {
        projectName: args.projectName,
        reconciledEstimate: args.reconciledEstimate,
        projectScope: args.projectScope,
        contingencyPercentage: args.contingencyPercentage,
        managementReservePercentage: args.managementReservePercentage,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify known risks requiring contingency allocation',
        '2. Estimate contingency for each identified risk',
        '3. Apply risk-based contingency allocation methodology',
        '4. Calculate total contingency reserve',
        '5. Determine management reserve for unknown unknowns',
        '6. Validate reserves against industry benchmarks',
        '7. Allocate reserves to appropriate cost elements',
        '8. Document reserve justification and assumptions',
        '9. Define reserve drawdown governance',
        '10. Establish reserve monitoring and reporting approach'
      ],
      outputFormat: 'JSON object with reserve analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['contingencyReserve', 'managementReserve', 'totalReserves'],
      properties: {
        riskBasedContingency: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              probability: { type: 'number' },
              impact: { type: 'number' },
              expectedValue: { type: 'number' }
            }
          }
        },
        contingencyReserve: { type: 'number' },
        contingencyPercentage: { type: 'number' },
        managementReserve: { type: 'number' },
        managementReservePercentage: { type: 'number' },
        totalReserves: { type: 'number' },
        reserveAllocation: {
          type: 'object',
          properties: {
            byPhase: { type: 'array' },
            byCategory: { type: 'array' }
          }
        },
        justification: { type: 'string' },
        governanceRules: { type: 'array', items: { type: 'string' } },
        drawdownCriteria: { type: 'array', items: { type: 'string' } },
        benchmarkComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'contingency-reserve', 'risk-management']
}));

export const costBaselineDevelopmentTask = defineTask('cost-baseline-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Cost Baseline Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller with expertise in baseline establishment',
      task: 'Establish approved cost baseline for project performance measurement',
      context: {
        projectName: args.projectName,
        reconciledEstimate: args.reconciledEstimate,
        reserveAnalysis: args.reserveAnalysis,
        projectScope: args.projectScope,
        currency: args.currency
      },
      instructions: [
        '1. Combine project estimate with contingency reserve for cost baseline',
        '2. Time-phase costs aligned with project schedule',
        '3. Create budget breakdown by phase, WBS element, and cost category',
        '4. Establish control accounts with budgets',
        '5. Define budget at completion (BAC)',
        '6. Create S-curve representation of cumulative budget',
        '7. Document baseline assumptions and constraints',
        '8. Define baseline change control process',
        '9. Establish performance measurement baseline',
        '10. Generate baseline documentation for approval'
      ],
      outputFormat: 'JSON object with cost baseline'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'phaseBreakdown', 'categoryBreakdown'],
      properties: {
        projectEstimate: { type: 'number' },
        contingencyReserve: { type: 'number' },
        totalBudget: { type: 'number' },
        managementReserve: { type: 'number' },
        totalFunding: { type: 'number' },
        phaseBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              budget: { type: 'number' },
              startPeriod: { type: 'string' },
              endPeriod: { type: 'string' }
            }
          }
        },
        categoryBreakdown: {
          type: 'object',
          properties: {
            labor: { type: 'number' },
            materials: { type: 'number' },
            equipment: { type: 'number' },
            services: { type: 'number' },
            other: { type: 'number' }
          }
        },
        controlAccounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              description: { type: 'string' },
              budget: { type: 'number' },
              manager: { type: 'string' }
            }
          }
        },
        timePhasedBudget: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              plannedValue: { type: 'number' },
              cumulativePV: { type: 'number' }
            }
          }
        },
        baselineAssumptions: { type: 'array', items: { type: 'string' } },
        changeControlProcess: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'cost-baseline', 'performance-measurement']
}));

export const cashFlowAnalysisTask = defineTask('cash-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Cash Flow Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Analyst with expertise in project cash flow management',
      task: 'Develop cash flow projections and funding requirements',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        projectScope: args.projectScope,
        currency: args.currency
      },
      instructions: [
        '1. Project monthly cash outflows based on time-phased budget',
        '2. Account for payment terms and timing (invoicing cycles)',
        '3. Consider cash flow constraints and working capital requirements',
        '4. Identify peak funding periods and requirements',
        '5. Analyze cash flow variability and risks',
        '6. Project cumulative cash requirements over project life',
        '7. Recommend funding strategies and milestone payments',
        '8. Consider inflation and currency exchange impacts',
        '9. Generate cash flow charts and projections',
        '10. Provide cash management recommendations'
      ],
      outputFormat: 'JSON object with cash flow analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['monthlyProjections', 'totalCashRequirement'],
      properties: {
        monthlyProjections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              cashOutflow: { type: 'number' },
              cumulativeOutflow: { type: 'number' }
            }
          }
        },
        peakFunding: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            amount: { type: 'number' }
          }
        },
        totalCashRequirement: { type: 'number' },
        fundingMilestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              amount: { type: 'number' },
              timing: { type: 'string' }
            }
          }
        },
        workingCapitalRequirement: { type: 'number' },
        cashFlowRisks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'cash-flow', 'financial-analysis']
}));

export const budgetRiskAssessmentTask = defineTask('budget-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Budget Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager with expertise in cost risk analysis',
      task: 'Assess budget risks and develop cost risk mitigation strategies',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        reserveAnalysis: args.reserveAnalysis,
        constraints: args.constraints,
        estimationStrategy: args.estimationStrategy
      },
      instructions: [
        '1. Identify cost risk factors (scope changes, resource availability, market conditions)',
        '2. Assess probability and impact of each cost risk',
        '3. Perform cost risk sensitivity analysis',
        '4. Evaluate reserve adequacy against identified risks',
        '5. Identify cost containment opportunities',
        '6. Develop cost risk mitigation strategies',
        '7. Define cost risk triggers and early warning indicators',
        '8. Establish cost variance thresholds for escalation',
        '9. Create cost risk response plans',
        '10. Recommend cost risk monitoring approach'
      ],
      outputFormat: 'JSON object with budget risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigationStrategies', 'reserveAdequacy'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              potentialCostImpact: { type: 'number' }
            }
          }
        },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              sensitivityRating: { type: 'string' },
              impactRange: { type: 'string' }
            }
          }
        },
        reserveAdequacy: {
          type: 'object',
          properties: {
            totalExposure: { type: 'number' },
            reserveAvailable: { type: 'number' },
            coverageRatio: { type: 'number' },
            assessment: { type: 'string', enum: ['adequate', 'marginal', 'insufficient'] }
          }
        },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              expectedReduction: { type: 'number' }
            }
          }
        },
        earlyWarningIndicators: { type: 'array', items: { type: 'string' } },
        escalationThresholds: { type: 'object' },
        monitoringApproach: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'risk-assessment', 'cost-risk']
}));

export const budgetDocumentGenerationTask = defineTask('budget-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Budget Document Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller and Technical Writer',
      task: 'Generate comprehensive budget document for stakeholder approval',
      context: {
        projectName: args.projectName,
        projectScope: args.projectScope,
        resources: args.resources,
        estimationStrategy: args.estimationStrategy,
        resourceCostAnalysis: args.resourceCostAnalysis,
        reconciledEstimate: args.reconciledEstimate,
        reserveAnalysis: args.reserveAnalysis,
        costBaseline: args.costBaseline,
        cashFlowAnalysis: args.cashFlowAnalysis,
        budgetRiskAssessment: args.budgetRiskAssessment,
        currency: args.currency,
        constraints: args.constraints
      },
      instructions: [
        '1. Create executive summary with budget highlights',
        '2. Document estimation methodology and approach',
        '3. Present detailed cost breakdown structure',
        '4. Include reserve analysis and justification',
        '5. Present cost baseline with time-phased budget',
        '6. Include cash flow projections and funding requirements',
        '7. Document budget assumptions and constraints',
        '8. Present risk assessment and mitigation strategies',
        '9. Include approval requirements and governance',
        '10. Generate both JSON and markdown versions',
        '11. Calculate approval readiness score',
        '12. Provide recommendations for budget optimization'
      ],
      outputFormat: 'JSON object with complete budget document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown', 'approvalReadinessScore'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            projectOverview: { type: 'object' },
            estimationMethodology: { type: 'object' },
            costBreakdown: { type: 'object' },
            reserves: { type: 'object' },
            baseline: { type: 'object' },
            cashFlow: { type: 'object' },
            risks: { type: 'array' },
            assumptions: { type: 'array' },
            approvalRequirements: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        approvalReadinessScore: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        approvalCriteria: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['budget', 'planning', 'documentation', 'cost-management']
}));
