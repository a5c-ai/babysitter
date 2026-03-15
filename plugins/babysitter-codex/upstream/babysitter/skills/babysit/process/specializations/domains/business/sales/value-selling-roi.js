/**
 * @process sales/value-selling-roi
 * @description Framework for quantifying business value, calculating ROI, payback period, and total cost of ownership for sales proposals using value selling methodology.
 * @inputs { accountName: string, opportunityName: string, solutionCost: number, implementationCost?: number, currentState: object, proposedSolution: object }
 * @outputs { success: boolean, roiAnalysis: object, businessCase: object, valueProposition: object, presentationMaterials: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/value-selling-roi', {
 *   accountName: 'Enterprise Corp',
 *   opportunityName: 'Digital Transformation',
 *   solutionCost: 250000,
 *   implementationCost: 50000,
 *   currentState: { annualCosts: 500000, painPoints: ['Manual processes', 'Data silos'] },
 *   proposedSolution: { benefits: ['Automation', 'Integration'] }
 * });
 *
 * @references
 * - Value Selling: https://www.valueselling.com/
 * - ROI Selling by Michael Nick: https://www.amazon.com/ROI-Selling-Increasing-Revenue-Creating/dp/0793188857
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    opportunityName,
    solutionCost,
    implementationCost = 0,
    currentState = {},
    proposedSolution = {},
    timeHorizon = 3,
    discountRate = 0.1,
    outputDir = 'value-roi-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Value Selling ROI Calculation for ${opportunityName}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Current State Costs');
  const currentStateAnalysis = await ctx.task(currentStateCostTask, {
    accountName,
    currentState,
    timeHorizon,
    outputDir
  });

  artifacts.push(...(currentStateAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: BENEFIT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying Solution Benefits');
  const benefitIdentification = await ctx.task(benefitIdentificationTask, {
    accountName,
    proposedSolution,
    currentStateAnalysis,
    outputDir
  });

  artifacts.push(...(benefitIdentification.artifacts || []));

  // ============================================================================
  // PHASE 3: BENEFIT QUANTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Quantifying Benefits');
  const benefitQuantification = await ctx.task(benefitQuantificationTask, {
    accountName,
    benefitIdentification,
    currentStateAnalysis,
    timeHorizon,
    outputDir
  });

  artifacts.push(...(benefitQuantification.artifacts || []));

  // ============================================================================
  // PHASE 4: TOTAL COST OF OWNERSHIP
  // ============================================================================

  ctx.log('info', 'Phase 4: Calculating Total Cost of Ownership');
  const tcoAnalysis = await ctx.task(tcoAnalysisTask, {
    accountName,
    solutionCost,
    implementationCost,
    timeHorizon,
    outputDir
  });

  artifacts.push(...(tcoAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 5: ROI CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Calculating ROI');
  const roiCalculation = await ctx.task(roiCalculationTask, {
    accountName,
    benefitQuantification,
    tcoAnalysis,
    timeHorizon,
    discountRate,
    outputDir
  });

  artifacts.push(...(roiCalculation.artifacts || []));

  // ============================================================================
  // PHASE 6: RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing ROI Risks');
  const riskAnalysis = await ctx.task(roiRiskAnalysisTask, {
    accountName,
    roiCalculation,
    benefitQuantification,
    outputDir
  });

  artifacts.push(...(riskAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 7: BUSINESS CASE COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Compiling Business Case');
  const businessCase = await ctx.task(businessCaseCompilationTask, {
    accountName,
    opportunityName,
    currentStateAnalysis,
    benefitQuantification,
    tcoAnalysis,
    roiCalculation,
    riskAnalysis,
    outputDir
  });

  artifacts.push(...(businessCase.artifacts || []));

  // Breakpoint: Review business case
  await ctx.breakpoint({
    question: `Value Selling ROI analysis complete for ${opportunityName}. ROI: ${roiCalculation.roiPercentage}%. Review business case?`,
    title: 'Value Selling ROI Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        opportunityName,
        totalInvestment: tcoAnalysis.totalTCO,
        totalBenefits: benefitQuantification.totalBenefits,
        roi: roiCalculation.roiPercentage,
        paybackPeriod: roiCalculation.paybackPeriod,
        npv: roiCalculation.npv
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    opportunityName,
    roiAnalysis: {
      roiPercentage: roiCalculation.roiPercentage,
      paybackPeriod: roiCalculation.paybackPeriod,
      npv: roiCalculation.npv,
      irr: roiCalculation.irr,
      breakEvenPoint: roiCalculation.breakEvenPoint
    },
    businessCase: {
      executiveSummary: businessCase.executiveSummary,
      currentStateCosts: currentStateAnalysis.totalCosts,
      proposedSolution: benefitQuantification.totalBenefits,
      investment: tcoAnalysis.totalTCO,
      riskAdjustedROI: riskAnalysis.adjustedROI
    },
    valueProposition: {
      quantifiedBenefits: benefitQuantification.benefits,
      differentiators: benefitIdentification.differentiators,
      costAvoidance: benefitQuantification.costAvoidance,
      revenueGains: benefitQuantification.revenueGains
    },
    presentationMaterials: businessCase.materials,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/value-selling-roi',
      timestamp: startTime,
      opportunityName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const currentStateCostTask = defineTask('current-state-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Cost Analysis - ${args.accountName}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Business value consultant specializing in cost analysis',
      task: 'Analyze and quantify all costs associated with the current state',
      context: args,
      instructions: [
        'Identify all direct costs in current state',
        'Calculate indirect costs (inefficiency, errors, delays)',
        'Quantify opportunity costs',
        'Assess hidden costs (technical debt, maintenance)',
        'Calculate labor costs associated with manual processes',
        'Project costs over the analysis timeframe',
        'Identify cost trends and growth factors',
        'Document assumptions and sources'
      ],
      outputFormat: 'JSON with costBreakdown, totalCosts, projectedCosts, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costBreakdown', 'totalCosts', 'artifacts'],
      properties: {
        costBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              annualCost: { type: 'number' },
              costType: { type: 'string', enum: ['direct', 'indirect', 'opportunity', 'hidden'] }
            }
          }
        },
        totalCosts: {
          type: 'object',
          properties: {
            annual: { type: 'number' },
            monthly: { type: 'number' },
            overTimeHorizon: { type: 'number' }
          }
        },
        projectedCosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              year: { type: 'number' },
              cost: { type: 'number' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'cost-analysis']
}));

export const benefitIdentificationTask = defineTask('benefit-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benefit Identification - ${args.accountName}`,
  agent: {
    name: 'value-consultant',
    prompt: {
      role: 'Value selling expert specializing in benefit mapping',
      task: 'Identify all potential benefits from the proposed solution',
      context: args,
      instructions: [
        'Map solution capabilities to customer pain points',
        'Identify cost reduction opportunities',
        'Identify revenue enhancement opportunities',
        'Assess productivity and efficiency gains',
        'Identify risk mitigation benefits',
        'Assess strategic and competitive benefits',
        'Categorize benefits as tangible or intangible',
        'Identify quick wins and long-term benefits'
      ],
      outputFormat: 'JSON with benefits array, differentiators, benefitCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benefits', 'differentiators', 'artifacts'],
      properties: {
        benefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefit: { type: 'string' },
              category: { type: 'string', enum: ['cost-reduction', 'revenue-growth', 'productivity', 'risk-mitigation', 'strategic'] },
              type: { type: 'string', enum: ['tangible', 'intangible'] },
              painAddressed: { type: 'string' },
              timeToRealize: { type: 'string' }
            }
          }
        },
        differentiators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              differentiator: { type: 'string' },
              competitiveAdvantage: { type: 'string' },
              customerValue: { type: 'string' }
            }
          }
        },
        benefitCategories: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'benefits']
}));

export const benefitQuantificationTask = defineTask('benefit-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benefit Quantification - ${args.accountName}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'ROI analyst specializing in benefit quantification',
      task: 'Quantify all identified benefits in financial terms',
      context: args,
      instructions: [
        'Assign dollar values to each tangible benefit',
        'Calculate cost savings from efficiency improvements',
        'Estimate revenue gains from new capabilities',
        'Quantify productivity improvements',
        'Calculate risk-adjusted value for uncertain benefits',
        'Project benefits over analysis timeframe',
        'Account for ramp-up period',
        'Document calculation methodology'
      ],
      outputFormat: 'JSON with quantifiedBenefits, totalBenefits, costAvoidance, revenueGains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benefits', 'totalBenefits', 'artifacts'],
      properties: {
        benefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefit: { type: 'string' },
              annualValue: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              calculation: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalBenefits: {
          type: 'object',
          properties: {
            annual: { type: 'number' },
            overTimeHorizon: { type: 'number' },
            conservative: { type: 'number' },
            optimistic: { type: 'number' }
          }
        },
        costAvoidance: { type: 'number' },
        revenueGains: { type: 'number' },
        productivityGains: { type: 'number' },
        projectedBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              year: { type: 'number' },
              value: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'benefit-quantification']
}));

export const tcoAnalysisTask = defineTask('tco-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Total Cost of Ownership Analysis - ${args.accountName}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'TCO analyst and procurement specialist',
      task: 'Calculate comprehensive Total Cost of Ownership',
      context: args,
      instructions: [
        'Calculate initial purchase/license costs',
        'Add implementation and deployment costs',
        'Include training and change management costs',
        'Calculate ongoing maintenance and support',
        'Include infrastructure and hosting costs',
        'Add internal labor costs for management',
        'Consider upgrade and enhancement costs',
        'Project total costs over analysis period'
      ],
      outputFormat: 'JSON with costComponents, totalTCO, yearlyBreakdown, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costComponents', 'totalTCO', 'artifacts'],
      properties: {
        costComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              type: { type: 'string', enum: ['one-time', 'recurring'] },
              amount: { type: 'number' },
              timing: { type: 'string' }
            }
          }
        },
        totalTCO: {
          type: 'object',
          properties: {
            initialInvestment: { type: 'number' },
            annualOngoing: { type: 'number' },
            totalOverPeriod: { type: 'number' }
          }
        },
        yearlyBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              year: { type: 'number' },
              costs: { type: 'number' },
              cumulative: { type: 'number' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'tco']
}));

export const roiCalculationTask = defineTask('roi-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `ROI Calculation - ${args.accountName}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial analyst specializing in investment analysis',
      task: 'Calculate comprehensive ROI metrics',
      context: args,
      instructions: [
        'Calculate simple ROI percentage',
        'Calculate Net Present Value (NPV)',
        'Determine Internal Rate of Return (IRR)',
        'Calculate payback period',
        'Determine break-even point',
        'Create cash flow analysis',
        'Perform sensitivity analysis',
        'Compare against industry benchmarks'
      ],
      outputFormat: 'JSON with roiPercentage, npv, irr, paybackPeriod, breakEvenPoint, cashFlow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roiPercentage', 'npv', 'paybackPeriod', 'artifacts'],
      properties: {
        roiPercentage: { type: 'number' },
        npv: { type: 'number' },
        irr: { type: 'number' },
        paybackPeriod: { type: 'string' },
        breakEvenPoint: { type: 'string' },
        cashFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              costs: { type: 'number' },
              benefits: { type: 'number' },
              netCashFlow: { type: 'number' },
              cumulativeCashFlow: { type: 'number' }
            }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            conservative: { type: 'object' },
            baseCase: { type: 'object' },
            optimistic: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'roi']
}));

export const roiRiskAnalysisTask = defineTask('roi-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `ROI Risk Analysis - ${args.accountName}`,
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Risk analyst specializing in investment risk assessment',
      task: 'Analyze risks that could impact projected ROI',
      context: args,
      instructions: [
        'Identify benefit realization risks',
        'Assess implementation risks',
        'Evaluate adoption and change management risks',
        'Analyze market and external risks',
        'Calculate risk-adjusted ROI',
        'Develop risk mitigation strategies',
        'Create contingency scenarios',
        'Assign confidence levels to projections'
      ],
      outputFormat: 'JSON with risks, adjustedROI, mitigation, confidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'adjustedROI', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        adjustedROI: {
          type: 'object',
          properties: {
            riskAdjustedROI: { type: 'number' },
            confidenceLevel: { type: 'number' },
            adjustmentFactor: { type: 'number' }
          }
        },
        scenarios: {
          type: 'object',
          properties: {
            bestCase: { type: 'object' },
            expectedCase: { type: 'object' },
            worstCase: { type: 'object' }
          }
        },
        mitigationPlan: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'risk-analysis']
}));

export const businessCaseCompilationTask = defineTask('business-case-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Case Compilation - ${args.accountName}`,
  agent: {
    name: 'business-writer',
    prompt: {
      role: 'Business case writer and value selling expert',
      task: 'Compile comprehensive business case document',
      context: args,
      instructions: [
        'Create compelling executive summary',
        'Document current state and challenges',
        'Present proposed solution and benefits',
        'Detail financial analysis and ROI',
        'Include risk assessment and mitigation',
        'Add implementation timeline',
        'Create visual presentations of data',
        'Prepare stakeholder-specific views'
      ],
      outputFormat: 'JSON with executiveSummary, fullDocument, materials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'materials', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        fullDocument: {
          type: 'object',
          properties: {
            currentState: { type: 'string' },
            proposedSolution: { type: 'string' },
            financialAnalysis: { type: 'string' },
            riskAssessment: { type: 'string' },
            implementation: { type: 'string' },
            recommendation: { type: 'string' }
          }
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              audience: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        visualizations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'value-selling', 'business-case']
}));
