/**
 * @process specializations/domains/business/project-management/portfolio-prioritization
 * @description Portfolio Prioritization and Investment Analysis - Evaluate and prioritize project portfolio
 * using strategic alignment, financial analysis (NPV, IRR), risk-reward optimization, and resource capacity
 * for optimal investment decisions.
 * @inputs { portfolioName: string, projects: array, strategicObjectives: array, budgetConstraints: object, resourceConstraints: object }
 * @outputs { success: boolean, prioritizedPortfolio: array, investmentAnalysis: object, resourceAllocation: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/portfolio-prioritization', {
 *   portfolioName: 'FY2024 Technology Portfolio',
 *   projects: [{ id: 'P001', name: 'Cloud Migration', estimatedCost: 2000000, expectedBenefits: 5000000, duration: 18 }],
 *   strategicObjectives: [{ objective: 'Digital Transformation', weight: 0.4 }, { objective: 'Cost Reduction', weight: 0.3 }],
 *   budgetConstraints: { totalBudget: 10000000, annualLimit: 5000000 },
 *   resourceConstraints: { totalFTE: 50, criticalSkills: ['cloud', 'data'] }
 * });
 *
 * @references
 * - PMI Standard for Portfolio Management: https://www.pmi.org/pmbok-guide-standards/foundational/portfolio-management
 * - Strategic Portfolio Management: https://www.pmi.org/learning/library/strategic-portfolio-management-enterprise-6395
 * - Investment Analysis: https://www.investopedia.com/terms/c/capitalbudgeting.asp
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    portfolioName,
    projects = [],
    strategicObjectives = [],
    budgetConstraints = {},
    resourceConstraints = {},
    currency = 'USD',
    discountRate = 0.1,
    planningHorizon = 3
  } = inputs;

  // Phase 1: Portfolio Data Validation
  const dataValidation = await ctx.task(portfolioDataValidationTask, {
    portfolioName,
    projects,
    strategicObjectives,
    budgetConstraints,
    resourceConstraints
  });

  // Quality Gate: Portfolio data must be valid
  if (!dataValidation.isValid) {
    return {
      success: false,
      error: 'Portfolio data validation failed',
      issues: dataValidation.issues,
      phase: 'data-validation',
      prioritizedPortfolio: null
    };
  }

  // Phase 2: Strategic Alignment Assessment
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    portfolioName,
    projects,
    strategicObjectives
  });

  // Phase 3: Financial Analysis (NPV, IRR, Payback)
  const financialAnalysis = await ctx.task(financialAnalysisTask, {
    portfolioName,
    projects,
    discountRate,
    planningHorizon,
    currency
  });

  // Phase 4: Risk Assessment
  const riskAssessment = await ctx.task(portfolioRiskAssessmentTask, {
    portfolioName,
    projects,
    financialAnalysis
  });

  // Phase 5: Resource Capacity Analysis
  const resourceAnalysis = await ctx.task(resourceCapacityAnalysisTask, {
    portfolioName,
    projects,
    resourceConstraints
  });

  // Breakpoint: Review initial analysis
  await ctx.breakpoint({
    question: `Initial portfolio analysis complete for ${portfolioName}. ${projects.length} projects analyzed. Review strategic alignment and financial metrics before prioritization?`,
    title: 'Portfolio Analysis Review',
    context: {
      runId: ctx.runId,
      portfolioName,
      projectsAnalyzed: projects.length,
      topStrategicProjects: strategicAlignment.topProjects?.slice(0, 5),
      topFinancialProjects: financialAnalysis.topByNpv?.slice(0, 5),
      files: [{
        path: `artifacts/initial-portfolio-analysis.json`,
        format: 'json',
        content: { strategicAlignment, financialAnalysis, riskAssessment, resourceAnalysis }
      }]
    }
  });

  // Phase 6: Multi-Criteria Scoring
  const multiCriteriaScoring = await ctx.task(multiCriteriaScoringTask, {
    portfolioName,
    projects,
    strategicAlignment,
    financialAnalysis,
    riskAssessment,
    resourceAnalysis
  });

  // Phase 7: Constraint-Based Optimization
  const optimizedPortfolio = await ctx.task(portfolioOptimizationTask, {
    portfolioName,
    projects,
    multiCriteriaScoring,
    budgetConstraints,
    resourceConstraints,
    currency
  });

  // Phase 8: Dependencies and Sequencing
  const dependencyAnalysis = await ctx.task(dependencySequencingTask, {
    portfolioName,
    optimizedPortfolio,
    projects
  });

  // Phase 9: Scenario Analysis
  const scenarioAnalysis = await ctx.task(scenarioAnalysisTask, {
    portfolioName,
    optimizedPortfolio,
    budgetConstraints,
    financialAnalysis
  });

  // Quality Gate: Validate optimization results
  if (optimizedPortfolio.portfolioScore < 60) {
    await ctx.breakpoint({
      question: `Portfolio optimization score is ${optimizedPortfolio.portfolioScore}/100 (below threshold of 60). This may indicate suboptimal project mix. Review constraints and project list?`,
      title: 'Portfolio Optimization Warning',
      context: {
        runId: ctx.runId,
        portfolioScore: optimizedPortfolio.portfolioScore,
        constraintUtilization: optimizedPortfolio.constraintUtilization,
        recommendation: 'Consider relaxing constraints or revisiting project scope'
      }
    });
  }

  // Phase 10: Investment Recommendation
  const investmentRecommendation = await ctx.task(investmentRecommendationTask, {
    portfolioName,
    optimizedPortfolio,
    financialAnalysis,
    scenarioAnalysis,
    currency
  });

  // Phase 11: Resource Allocation Plan
  const resourceAllocationPlan = await ctx.task(resourceAllocationPlanTask, {
    portfolioName,
    optimizedPortfolio,
    resourceConstraints,
    dependencyAnalysis
  });

  // Phase 12: Portfolio Dashboard Generation
  const portfolioDashboard = await ctx.task(portfolioDashboardTask, {
    portfolioName,
    projects,
    strategicAlignment,
    financialAnalysis,
    riskAssessment,
    multiCriteriaScoring,
    optimizedPortfolio,
    dependencyAnalysis,
    scenarioAnalysis,
    investmentRecommendation,
    resourceAllocationPlan,
    budgetConstraints,
    currency
  });

  // Final Breakpoint: Portfolio Approval
  await ctx.breakpoint({
    question: `Portfolio prioritization complete for ${portfolioName}. Recommended investment: ${currency} ${optimizedPortfolio.totalInvestment?.toLocaleString()}. Expected NPV: ${currency} ${optimizedPortfolio.expectedNpv?.toLocaleString()}. Submit for approval?`,
    title: 'Portfolio Approval Review',
    context: {
      runId: ctx.runId,
      portfolioName,
      selectedProjects: optimizedPortfolio.selectedProjects?.length,
      totalProjects: projects.length,
      files: [
        { path: `artifacts/portfolio-dashboard.json`, format: 'json', content: portfolioDashboard },
        { path: `artifacts/portfolio-report.md`, format: 'markdown', content: portfolioDashboard.markdown }
      ]
    }
  });

  return {
    success: true,
    portfolioName,
    prioritizedPortfolio: optimizedPortfolio.rankedProjects,
    selectedProjects: optimizedPortfolio.selectedProjects,
    deferredProjects: optimizedPortfolio.deferredProjects,
    investmentAnalysis: {
      totalInvestment: optimizedPortfolio.totalInvestment,
      expectedNpv: optimizedPortfolio.expectedNpv,
      expectedIrr: financialAnalysis.portfolioIrr,
      paybackPeriod: financialAnalysis.averagePayback,
      benefitCostRatio: financialAnalysis.benefitCostRatio
    },
    strategicValue: {
      overallAlignment: strategicAlignment.portfolioAlignmentScore,
      objectiveCoverage: strategicAlignment.objectiveCoverage,
      strategicGaps: strategicAlignment.gaps
    },
    riskProfile: {
      overallRisk: riskAssessment.portfolioRiskLevel,
      diversificationScore: riskAssessment.diversificationScore,
      concentrationRisks: riskAssessment.concentrationRisks
    },
    resourceAllocation: {
      totalFteRequired: resourceAllocationPlan.totalFteRequired,
      allocationByProject: resourceAllocationPlan.allocationByProject,
      skillGaps: resourceAllocationPlan.skillGaps,
      resourceTimeline: resourceAllocationPlan.timeline
    },
    scenarios: scenarioAnalysis.scenarios,
    recommendations: investmentRecommendation.recommendations,
    dashboard: portfolioDashboard.document,
    metadata: {
      processId: 'specializations/domains/business/project-management/portfolio-prioritization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const portfolioDataValidationTask = defineTask('portfolio-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Portfolio Data Validation - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Portfolio Analyst with expertise in data validation',
      task: 'Validate portfolio data completeness and quality for prioritization analysis',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        strategicObjectives: args.strategicObjectives,
        budgetConstraints: args.budgetConstraints,
        resourceConstraints: args.resourceConstraints
      },
      instructions: [
        '1. Validate project data completeness (cost, benefits, duration, etc.)',
        '2. Verify strategic objectives have weights summing to 1',
        '3. Check budget constraints are properly defined',
        '4. Validate resource constraint specifications',
        '5. Identify missing or incomplete project data',
        '6. Verify financial data reasonableness',
        '7. Check for duplicate projects',
        '8. Validate date ranges and timelines',
        '9. Assess data quality score',
        '10. Provide recommendations for data improvements'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'dataQualityScore'],
      properties: {
        isValid: { type: 'boolean' },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        dataQualityScore: { type: 'number' },
        projectsWithIssues: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'validation', 'data-quality']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Strategic Alignment Assessment - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Planning Analyst',
      task: 'Assess project alignment with strategic objectives',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        strategicObjectives: args.strategicObjectives
      },
      instructions: [
        '1. Map each project to strategic objectives',
        '2. Score project alignment (0-10) for each objective',
        '3. Calculate weighted alignment score per project',
        '4. Identify projects with highest strategic value',
        '5. Identify strategic gaps (objectives not covered)',
        '6. Assess strategic balance across objectives',
        '7. Calculate portfolio-level alignment score',
        '8. Identify projects with weak strategic fit',
        '9. Recommend strategic rebalancing if needed',
        '10. Provide strategic alignment summary'
      ],
      outputFormat: 'JSON object with strategic alignment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['portfolioAlignmentScore', 'projectAlignments', 'objectiveCoverage'],
      properties: {
        projectAlignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              objectiveScores: { type: 'object' },
              weightedScore: { type: 'number' },
              primaryObjective: { type: 'string' }
            }
          }
        },
        objectiveCoverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              weight: { type: 'number' },
              projectsCovering: { type: 'number' },
              coverageScore: { type: 'number' }
            }
          }
        },
        portfolioAlignmentScore: { type: 'number' },
        topProjects: { type: 'array' },
        weakProjects: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'strategic-alignment', 'prioritization']
}));

export const financialAnalysisTask = defineTask('financial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Financial Analysis - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Analyst with expertise in capital budgeting',
      task: 'Perform comprehensive financial analysis including NPV, IRR, and payback calculations',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        discountRate: args.discountRate,
        planningHorizon: args.planningHorizon,
        currency: args.currency
      },
      instructions: [
        '1. Calculate Net Present Value (NPV) for each project',
        '2. Calculate Internal Rate of Return (IRR) for each project',
        '3. Calculate Payback Period for each project',
        '4. Calculate Profitability Index (PI) for each project',
        '5. Calculate Benefit-Cost Ratio for each project',
        '6. Rank projects by financial metrics',
        '7. Identify projects with strongest financial returns',
        '8. Calculate portfolio-level financial metrics',
        '9. Perform sensitivity analysis on key assumptions',
        '10. Provide financial ranking and recommendations'
      ],
      outputFormat: 'JSON object with financial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['projectFinancials', 'portfolioIrr', 'topByNpv'],
      properties: {
        projectFinancials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              estimatedCost: { type: 'number' },
              expectedBenefits: { type: 'number' },
              npv: { type: 'number' },
              irr: { type: 'number' },
              paybackPeriod: { type: 'number' },
              profitabilityIndex: { type: 'number' },
              benefitCostRatio: { type: 'number' }
            }
          }
        },
        portfolioNpv: { type: 'number' },
        portfolioIrr: { type: 'number' },
        averagePayback: { type: 'number' },
        benefitCostRatio: { type: 'number' },
        topByNpv: { type: 'array' },
        topByIrr: { type: 'array' },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            discountRateSensitivity: { type: 'object' },
            benefitsSensitivity: { type: 'object' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'financial-analysis', 'npv', 'irr']
}));

export const portfolioRiskAssessmentTask = defineTask('portfolio-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Portfolio Risk Assessment - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Assess risks at project and portfolio level',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        financialAnalysis: args.financialAnalysis
      },
      instructions: [
        '1. Assess risk level for each project (execution, technical, market)',
        '2. Calculate risk-adjusted returns for each project',
        '3. Evaluate portfolio diversification',
        '4. Identify concentration risks (technology, market, resource)',
        '5. Calculate portfolio-level risk metrics',
        '6. Assess risk-reward balance across portfolio',
        '7. Identify correlated risks between projects',
        '8. Calculate Value at Risk (VaR) for portfolio',
        '9. Recommend risk mitigation strategies',
        '10. Provide portfolio risk profile summary'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['projectRisks', 'portfolioRiskLevel', 'diversificationScore'],
      properties: {
        projectRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              executionRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
              technicalRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
              marketRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
              overallRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
              riskScore: { type: 'number' },
              riskAdjustedReturn: { type: 'number' }
            }
          }
        },
        portfolioRiskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        diversificationScore: { type: 'number' },
        concentrationRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskType: { type: 'string' },
              concentration: { type: 'number' },
              projects: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        correlatedRisks: { type: 'array' },
        valueAtRisk: { type: 'number' },
        riskMitigationStrategies: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'risk-assessment', 'diversification']
}));

export const resourceCapacityAnalysisTask = defineTask('resource-capacity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Resource Capacity Analysis - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Planning Manager',
      task: 'Analyze resource requirements against available capacity',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        resourceConstraints: args.resourceConstraints
      },
      instructions: [
        '1. Calculate total resource requirements by skill',
        '2. Compare requirements against available capacity',
        '3. Identify resource bottlenecks and constraints',
        '4. Calculate resource utilization by period',
        '5. Identify critical skill shortages',
        '6. Assess resource competition between projects',
        '7. Calculate resource feasibility score per project',
        '8. Identify resource-constrained projects',
        '9. Recommend resource acquisition or reallocation',
        '10. Provide capacity analysis summary'
      ],
      outputFormat: 'JSON object with resource capacity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRequirements', 'capacityGaps', 'resourceFeasibility'],
      properties: {
        totalRequirements: {
          type: 'object',
          properties: {
            totalFte: { type: 'number' },
            bySkill: { type: 'object' }
          }
        },
        availableCapacity: {
          type: 'object',
          properties: {
            totalFte: { type: 'number' },
            bySkill: { type: 'object' }
          }
        },
        capacityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              required: { type: 'number' },
              available: { type: 'number' },
              gap: { type: 'number' }
            }
          }
        },
        resourceFeasibility: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              fteRequired: { type: 'number' },
              feasibilityScore: { type: 'number' },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        utilizationByPeriod: { type: 'array' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'resource-planning', 'capacity-analysis']
}));

export const multiCriteriaScoringTask = defineTask('multi-criteria-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Multi-Criteria Scoring - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Analysis Expert',
      task: 'Calculate composite scores using multi-criteria decision analysis',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        strategicAlignment: args.strategicAlignment,
        financialAnalysis: args.financialAnalysis,
        riskAssessment: args.riskAssessment,
        resourceAnalysis: args.resourceAnalysis
      },
      instructions: [
        '1. Define scoring criteria weights (strategic, financial, risk, resource)',
        '2. Normalize scores across all criteria (0-100 scale)',
        '3. Calculate weighted composite score for each project',
        '4. Rank projects by composite score',
        '5. Perform sensitivity analysis on weights',
        '6. Identify dominant projects (high on all criteria)',
        '7. Identify dominated projects (low on all criteria)',
        '8. Create scoring matrix visualization',
        '9. Analyze score distribution and clustering',
        '10. Provide prioritization recommendations'
      ],
      outputFormat: 'JSON object with multi-criteria scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['scoredProjects', 'criteriaWeights', 'rankings'],
      properties: {
        criteriaWeights: {
          type: 'object',
          properties: {
            strategic: { type: 'number' },
            financial: { type: 'number' },
            risk: { type: 'number' },
            resource: { type: 'number' }
          }
        },
        scoredProjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              strategicScore: { type: 'number' },
              financialScore: { type: 'number' },
              riskScore: { type: 'number' },
              resourceScore: { type: 'number' },
              compositeScore: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        rankings: { type: 'array' },
        dominantProjects: { type: 'array' },
        dominatedProjects: { type: 'array' },
        weightSensitivity: { type: 'object' },
        scoringMatrix: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'multi-criteria', 'scoring', 'prioritization']
}));

export const portfolioOptimizationTask = defineTask('portfolio-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Constraint-Based Optimization - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Optimize portfolio selection under budget and resource constraints',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        multiCriteriaScoring: args.multiCriteriaScoring,
        budgetConstraints: args.budgetConstraints,
        resourceConstraints: args.resourceConstraints,
        currency: args.currency
      },
      instructions: [
        '1. Formulate portfolio selection as optimization problem',
        '2. Apply budget constraints (total and annual)',
        '3. Apply resource constraints (FTE and skills)',
        '4. Select projects maximizing total value within constraints',
        '5. Calculate constraint utilization percentages',
        '6. Identify marginal projects (just above/below cutoff)',
        '7. Calculate opportunity cost of deferred projects',
        '8. Provide selected and deferred project lists',
        '9. Calculate portfolio score and metrics',
        '10. Recommend constraint relaxation if beneficial'
      ],
      outputFormat: 'JSON object with optimized portfolio'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedProjects', 'deferredProjects', 'totalInvestment', 'portfolioScore'],
      properties: {
        selectedProjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              cost: { type: 'number' },
              compositeScore: { type: 'number' },
              selectionRationale: { type: 'string' }
            }
          }
        },
        deferredProjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              cost: { type: 'number' },
              compositeScore: { type: 'number' },
              deferralReason: { type: 'string' }
            }
          }
        },
        rankedProjects: { type: 'array' },
        totalInvestment: { type: 'number' },
        expectedNpv: { type: 'number' },
        portfolioScore: { type: 'number' },
        constraintUtilization: {
          type: 'object',
          properties: {
            budget: { type: 'number' },
            resources: { type: 'number' }
          }
        },
        marginalProjects: { type: 'array' },
        opportunityCost: { type: 'number' },
        constraintRelaxationBenefit: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'optimization', 'constraint-based']
}));

export const dependencySequencingTask = defineTask('dependency-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Dependencies and Sequencing - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Manager with expertise in dependency management',
      task: 'Analyze project dependencies and determine optimal sequencing',
      context: {
        portfolioName: args.portfolioName,
        optimizedPortfolio: args.optimizedPortfolio,
        projects: args.projects
      },
      instructions: [
        '1. Identify dependencies between selected projects',
        '2. Map predecessor/successor relationships',
        '3. Identify critical path through portfolio',
        '4. Detect circular dependencies (if any)',
        '5. Determine optimal project start sequence',
        '6. Identify resource conflict points',
        '7. Create portfolio timeline/roadmap',
        '8. Identify quick wins (independent, high-value)',
        '9. Calculate portfolio completion timeline',
        '10. Provide sequencing recommendations'
      ],
      outputFormat: 'JSON object with dependency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'sequence', 'criticalPath'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              blockedBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wave: { type: 'number' },
              projects: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        circularDependencies: { type: 'array' },
        resourceConflicts: { type: 'array' },
        quickWins: { type: 'array' },
        portfolioTimeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            totalDuration: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'dependencies', 'sequencing']
}));

export const scenarioAnalysisTask = defineTask('scenario-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Scenario Analysis - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Planning Analyst',
      task: 'Develop and analyze alternative portfolio scenarios',
      context: {
        portfolioName: args.portfolioName,
        optimizedPortfolio: args.optimizedPortfolio,
        budgetConstraints: args.budgetConstraints,
        financialAnalysis: args.financialAnalysis
      },
      instructions: [
        '1. Define baseline scenario (current optimization)',
        '2. Create budget increase scenario (+20%)',
        '3. Create budget decrease scenario (-20%)',
        '4. Create aggressive growth scenario (higher risk tolerance)',
        '5. Create conservative scenario (lower risk tolerance)',
        '6. Calculate impact on NPV, project selection for each',
        '7. Identify projects that flip in/out between scenarios',
        '8. Assess scenario robustness of core projects',
        '9. Calculate expected value under uncertainty',
        '10. Recommend preferred scenario with rationale'
      ],
      outputFormat: 'JSON object with scenario analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'robustProjects', 'recommendation'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              budget: { type: 'number' },
              selectedProjects: { type: 'array', items: { type: 'string' } },
              totalInvestment: { type: 'number' },
              expectedNpv: { type: 'number' },
              riskLevel: { type: 'string' }
            }
          }
        },
        scenarioComparison: {
          type: 'object',
          properties: {
            baseline: { type: 'object' },
            budgetIncrease: { type: 'object' },
            budgetDecrease: { type: 'object' },
            aggressive: { type: 'object' },
            conservative: { type: 'object' }
          }
        },
        flipProjects: { type: 'array' },
        robustProjects: { type: 'array', items: { type: 'string' } },
        expectedValueUnderUncertainty: { type: 'number' },
        recommendation: {
          type: 'object',
          properties: {
            preferredScenario: { type: 'string' },
            rationale: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'scenario-analysis', 'strategic-planning']
}));

export const investmentRecommendationTask = defineTask('investment-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Investment Recommendation - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investment Committee Advisor',
      task: 'Develop comprehensive investment recommendations for portfolio approval',
      context: {
        portfolioName: args.portfolioName,
        optimizedPortfolio: args.optimizedPortfolio,
        financialAnalysis: args.financialAnalysis,
        scenarioAnalysis: args.scenarioAnalysis,
        currency: args.currency
      },
      instructions: [
        '1. Summarize portfolio investment thesis',
        '2. Present key financial metrics and returns',
        '3. Highlight strategic value proposition',
        '4. Document risk-reward profile',
        '5. Provide tiered funding recommendations',
        '6. Identify must-fund projects vs. conditional projects',
        '7. Define approval criteria and governance',
        '8. Recommend review cadence and stage gates',
        '9. Identify success metrics for portfolio tracking',
        '10. Provide executive-level investment recommendation'
      ],
      outputFormat: 'JSON object with investment recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['investmentThesis', 'recommendations', 'governanceStructure'],
      properties: {
        investmentThesis: { type: 'string' },
        keyMetrics: {
          type: 'object',
          properties: {
            totalInvestment: { type: 'number' },
            expectedNpv: { type: 'number' },
            expectedIrr: { type: 'number' },
            paybackPeriod: { type: 'number' }
          }
        },
        strategicValue: { type: 'string' },
        riskRewardProfile: { type: 'string' },
        tieredFunding: {
          type: 'object',
          properties: {
            mustFund: { type: 'array' },
            shouldFund: { type: 'array' },
            conditional: { type: 'array' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        governanceStructure: {
          type: 'object',
          properties: {
            approvalAuthority: { type: 'string' },
            reviewCadence: { type: 'string' },
            stageGates: { type: 'array', items: { type: 'string' } }
          }
        },
        successMetrics: { type: 'array', items: { type: 'string' } },
        executiveRecommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'investment', 'recommendation', 'governance']
}));

export const resourceAllocationPlanTask = defineTask('resource-allocation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Resource Allocation Plan - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Planning Director',
      task: 'Develop detailed resource allocation plan for selected portfolio',
      context: {
        portfolioName: args.portfolioName,
        optimizedPortfolio: args.optimizedPortfolio,
        resourceConstraints: args.resourceConstraints,
        dependencyAnalysis: args.dependencyAnalysis
      },
      instructions: [
        '1. Allocate resources to selected projects by period',
        '2. Balance resource loading across portfolio timeline',
        '3. Identify peak resource periods and bottlenecks',
        '4. Calculate skill gaps and hiring needs',
        '5. Plan resource onboarding timeline',
        '6. Identify shared resource opportunities',
        '7. Create resource-leveled timeline',
        '8. Define resource contingency approach',
        '9. Calculate total FTE investment by period',
        '10. Provide resource allocation recommendations'
      ],
      outputFormat: 'JSON object with resource allocation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['allocationByProject', 'totalFteRequired', 'timeline'],
      properties: {
        totalFteRequired: { type: 'number' },
        allocationByProject: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              fteRequired: { type: 'number' },
              skillsNeeded: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              totalFte: { type: 'number' },
              byProject: { type: 'object' }
            }
          }
        },
        peakPeriods: { type: 'array' },
        skillGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              gap: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        hiringPlan: { type: 'object' },
        sharedResources: { type: 'array' },
        contingencyPlan: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'resource-allocation', 'planning']
}));

export const portfolioDashboardTask = defineTask('portfolio-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Portfolio Dashboard Generation - ${args.portfolioName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Portfolio Reporting Specialist',
      task: 'Generate comprehensive portfolio prioritization dashboard and report',
      context: {
        portfolioName: args.portfolioName,
        projects: args.projects,
        strategicAlignment: args.strategicAlignment,
        financialAnalysis: args.financialAnalysis,
        riskAssessment: args.riskAssessment,
        multiCriteriaScoring: args.multiCriteriaScoring,
        optimizedPortfolio: args.optimizedPortfolio,
        dependencyAnalysis: args.dependencyAnalysis,
        scenarioAnalysis: args.scenarioAnalysis,
        investmentRecommendation: args.investmentRecommendation,
        resourceAllocationPlan: args.resourceAllocationPlan,
        budgetConstraints: args.budgetConstraints,
        currency: args.currency
      },
      instructions: [
        '1. Create executive summary with key decisions',
        '2. Present prioritized project list with scores',
        '3. Show strategic alignment visualization',
        '4. Display financial metrics summary',
        '5. Present risk profile assessment',
        '6. Show portfolio timeline and roadmap',
        '7. Include resource allocation summary',
        '8. Present scenario comparison',
        '9. Include investment recommendations',
        '10. Generate both JSON and markdown formats',
        '11. Include data for visualization/charts',
        '12. Provide approval decision framework'
      ],
      outputFormat: 'JSON object with complete portfolio dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            portfolioName: { type: 'string' },
            prioritizedProjects: { type: 'array' },
            strategicAlignment: { type: 'object' },
            financialSummary: { type: 'object' },
            riskProfile: { type: 'object' },
            timeline: { type: 'object' },
            resourceSummary: { type: 'object' },
            scenarios: { type: 'array' },
            recommendations: { type: 'array' },
            approvalDecision: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        chartData: {
          type: 'object',
          properties: {
            priorityMatrix: { type: 'object' },
            budgetAllocation: { type: 'object' },
            timeline: { type: 'object' },
            riskReward: { type: 'object' }
          }
        },
        keyDecisions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['portfolio', 'dashboard', 'reporting']
}));
