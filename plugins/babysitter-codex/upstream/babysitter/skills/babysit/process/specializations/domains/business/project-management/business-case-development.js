/**
 * @process specializations/domains/business/project-management/business-case-development
 * @description Business Case Development - Develop comprehensive business case including problem statement,
 * solution options, cost-benefit analysis, ROI calculations, risk assessment, and funding recommendation.
 * @inputs { projectName: string, problemStatement: string, proposedSolution: object, organizationalContext?: object }
 * @outputs { success: boolean, businessCase: object, financialAnalysis: object, recommendation: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/business-case-development', {
 *   projectName: 'Customer Service Automation',
 *   problemStatement: 'High volume of repetitive customer inquiries overwhelming support team',
 *   proposedSolution: { description: 'AI-powered chatbot', estimatedCost: 500000 },
 *   organizationalContext: { industry: 'retail', annualRevenue: 50000000 }
 * });
 *
 * @references
 * - PRINCE2 Business Case: https://www.axelos.com/certifications/prince2
 * - PMI Business Analysis: https://www.pmi.org/pmbok-guide-standards/foundational/business-analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    problemStatement,
    proposedSolution,
    organizationalContext = {},
    strategicObjectives = [],
    constraints = {},
    evaluationPeriod = 5
  } = inputs;

  // Phase 1: Problem Analysis
  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    projectName,
    problemStatement,
    organizationalContext
  });

  // Phase 2: Options Identification
  const optionsIdentification = await ctx.task(optionsIdentificationTask, {
    projectName,
    problemAnalysis,
    proposedSolution,
    constraints
  });

  // Breakpoint: Review options
  await ctx.breakpoint({
    question: `Identified ${optionsIdentification.options.length} solution options for ${projectName}. Review before detailed analysis?`,
    title: 'Options Review',
    context: {
      runId: ctx.runId,
      projectName,
      optionsCount: optionsIdentification.options.length,
      files: [{
        path: `artifacts/phase2-options.json`,
        format: 'json',
        content: optionsIdentification
      }]
    }
  });

  // Phase 3: Benefits Analysis
  const benefitsAnalysis = await ctx.task(benefitsAnalysisTask, {
    projectName,
    options: optionsIdentification.options,
    strategicObjectives,
    organizationalContext
  });

  // Phase 4: Cost Analysis
  const costAnalysis = await ctx.task(costAnalysisTask, {
    projectName,
    options: optionsIdentification.options,
    evaluationPeriod
  });

  // Phase 5: Financial Analysis
  const financialAnalysis = await ctx.task(financialAnalysisTask, {
    projectName,
    benefitsAnalysis,
    costAnalysis,
    evaluationPeriod
  });

  // Phase 6: Risk Assessment
  const riskAssessment = await ctx.task(businessCaseRiskAssessmentTask, {
    projectName,
    options: optionsIdentification.options,
    financialAnalysis
  });

  // Phase 7: Strategic Alignment
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    projectName,
    options: optionsIdentification.options,
    strategicObjectives,
    organizationalContext
  });

  // Phase 8: Options Comparison
  const optionsComparison = await ctx.task(optionsComparisonTask, {
    projectName,
    benefitsAnalysis,
    costAnalysis,
    financialAnalysis,
    riskAssessment,
    strategicAlignment
  });

  // Phase 9: Recommendation Development
  const recommendation = await ctx.task(recommendationDevelopmentTask, {
    projectName,
    optionsComparison,
    constraints,
    organizationalContext
  });

  // Phase 10: Business Case Document
  const businessCaseDocument = await ctx.task(businessCaseDocumentTask, {
    projectName,
    problemAnalysis,
    optionsIdentification,
    benefitsAnalysis,
    costAnalysis,
    financialAnalysis,
    riskAssessment,
    strategicAlignment,
    optionsComparison,
    recommendation
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Business case complete for ${projectName}. Recommended option: ${recommendation.recommendedOption}. ROI: ${financialAnalysis.recommendedROI}%. Submit for approval?`,
    title: 'Business Case Approval',
    context: {
      runId: ctx.runId,
      projectName,
      recommendation: recommendation.recommendedOption,
      roi: financialAnalysis.recommendedROI,
      npv: financialAnalysis.recommendedNPV,
      files: [
        { path: `artifacts/business-case.json`, format: 'json', content: businessCaseDocument },
        { path: `artifacts/business-case.md`, format: 'markdown', content: businessCaseDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    businessCase: {
      document: businessCaseDocument.document,
      markdown: businessCaseDocument.markdown,
      version: '1.0'
    },
    financialAnalysis: {
      roi: financialAnalysis.recommendedROI,
      npv: financialAnalysis.recommendedNPV,
      paybackPeriod: financialAnalysis.recommendedPayback,
      irr: financialAnalysis.recommendedIRR
    },
    recommendation: recommendation.recommendedOption,
    recommendationRationale: recommendation.rationale,
    options: optionsComparison.rankedOptions,
    risks: riskAssessment.keyRisks,
    benefits: benefitsAnalysis.totalBenefits,
    metadata: {
      processId: 'specializations/domains/business/project-management/business-case-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Problem Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst',
      task: 'Analyze the business problem and current state',
      context: {
        projectName: args.projectName,
        problemStatement: args.problemStatement,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Document the problem statement clearly',
        '2. Analyze root causes',
        '3. Quantify the problem impact',
        '4. Document affected stakeholders',
        '5. Analyze current state',
        '6. Identify pain points',
        '7. Determine urgency',
        '8. Document constraints',
        '9. Identify success criteria',
        '10. Define desired future state'
      ],
      outputFormat: 'JSON object with problem analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'impact', 'urgency'],
      properties: {
        problemStatement: { type: 'string' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        impact: {
          type: 'object',
          properties: {
            financial: { type: 'string' },
            operational: { type: 'string' },
            strategic: { type: 'string' },
            quantified: { type: 'number' }
          }
        },
        affectedStakeholders: { type: 'array', items: { type: 'string' } },
        currentState: { type: 'string' },
        painPoints: { type: 'array', items: { type: 'string' } },
        urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        constraints: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        desiredState: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'problem-analysis']
}));

export const optionsIdentificationTask = defineTask('options-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Options Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Solution Architect',
      task: 'Identify solution options including do-nothing baseline',
      context: {
        projectName: args.projectName,
        problemAnalysis: args.problemAnalysis,
        proposedSolution: args.proposedSolution,
        constraints: args.constraints
      },
      instructions: [
        '1. Include do-nothing option as baseline',
        '2. Document proposed solution',
        '3. Identify alternative solutions',
        '4. Consider different scales/approaches',
        '5. Include quick wins if applicable',
        '6. Document option descriptions',
        '7. Initial feasibility assessment',
        '8. Note option dependencies',
        '9. Identify option combinations',
        '10. Short-list viable options'
      ],
      outputFormat: 'JSON object with solution options'
    },
    outputSchema: {
      type: 'object',
      required: ['options'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['do-nothing', 'minimal', 'recommended', 'maximum'] },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        shortlistedOptions: { type: 'array', items: { type: 'string' } },
        eliminatedOptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'options']
}));

export const benefitsAnalysisTask = defineTask('benefits-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Benefits Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefits Analyst',
      task: 'Quantify benefits for each solution option',
      context: {
        projectName: args.projectName,
        options: args.options,
        strategicObjectives: args.strategicObjectives,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Identify financial benefits',
        '2. Identify non-financial benefits',
        '3. Quantify tangible benefits',
        '4. Document intangible benefits',
        '5. Map benefits to objectives',
        '6. Estimate benefit timing',
        '7. Assess benefit dependencies',
        '8. Calculate benefit values',
        '9. Document benefit assumptions',
        '10. Create benefits register'
      ],
      outputFormat: 'JSON object with benefits analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['benefitsByOption', 'totalBenefits'],
      properties: {
        benefitsByOption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              benefits: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    benefit: { type: 'string' },
                    type: { type: 'string', enum: ['financial', 'operational', 'strategic', 'compliance'] },
                    category: { type: 'string', enum: ['tangible', 'intangible'] },
                    annualValue: { type: 'number' },
                    startYear: { type: 'number' }
                  }
                }
              },
              totalAnnualBenefits: { type: 'number' }
            }
          }
        },
        totalBenefits: { type: 'object' },
        benefitsRegister: { type: 'array' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'benefits']
}));

export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Cost Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cost Analyst',
      task: 'Estimate costs for each solution option',
      context: {
        projectName: args.projectName,
        options: args.options,
        evaluationPeriod: args.evaluationPeriod
      },
      instructions: [
        '1. Estimate capital costs (CAPEX)',
        '2. Estimate operating costs (OPEX)',
        '3. Include implementation costs',
        '4. Include training costs',
        '5. Include change management costs',
        '6. Estimate ongoing maintenance',
        '7. Include opportunity costs',
        '8. Apply contingency',
        '9. Document cost assumptions',
        '10. Create cost profile over time'
      ],
      outputFormat: 'JSON object with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['costsByOption'],
      properties: {
        costsByOption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              capitalCosts: { type: 'number' },
              operatingCosts: { type: 'number' },
              implementationCosts: { type: 'number' },
              trainingCosts: { type: 'number' },
              contingency: { type: 'number' },
              totalCost: { type: 'number' },
              costProfile: { type: 'array' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'costs']
}));

export const financialAnalysisTask = defineTask('financial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Financial Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Analyst',
      task: 'Calculate financial metrics for each option',
      context: {
        projectName: args.projectName,
        benefitsAnalysis: args.benefitsAnalysis,
        costAnalysis: args.costAnalysis,
        evaluationPeriod: args.evaluationPeriod
      },
      instructions: [
        '1. Calculate NPV for each option',
        '2. Calculate ROI for each option',
        '3. Calculate payback period',
        '4. Calculate IRR',
        '5. Perform sensitivity analysis',
        '6. Calculate break-even point',
        '7. Apply discount rate',
        '8. Create cash flow projections',
        '9. Document financial assumptions',
        '10. Rank options financially'
      ],
      outputFormat: 'JSON object with financial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['financialsByOption', 'recommendedROI', 'recommendedNPV'],
      properties: {
        financialsByOption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              npv: { type: 'number' },
              roi: { type: 'number' },
              paybackPeriod: { type: 'number' },
              irr: { type: 'number' },
              breakEvenPoint: { type: 'string' }
            }
          }
        },
        recommendedROI: { type: 'number' },
        recommendedNPV: { type: 'number' },
        recommendedPayback: { type: 'number' },
        recommendedIRR: { type: 'number' },
        sensitivityAnalysis: { type: 'object' },
        discountRate: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'financial']
}));

export const businessCaseRiskAssessmentTask = defineTask('business-case-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Assess risks for each solution option',
      context: {
        projectName: args.projectName,
        options: args.options,
        financialAnalysis: args.financialAnalysis
      },
      instructions: [
        '1. Identify implementation risks',
        '2. Identify operational risks',
        '3. Identify financial risks',
        '4. Assess probability and impact',
        '5. Identify mitigation strategies',
        '6. Calculate risk exposure',
        '7. Compare risk profiles',
        '8. Assess do-nothing risks',
        '9. Document risk assumptions',
        '10. Create risk register'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risksByOption', 'keyRisks'],
      properties: {
        risksByOption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              risks: { type: 'array' },
              overallRiskLevel: { type: 'string' },
              riskExposure: { type: 'number' }
            }
          }
        },
        keyRisks: { type: 'array', items: { type: 'string' } },
        mitigationStrategies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'risk']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Strategic Alignment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategy Consultant',
      task: 'Assess strategic alignment of each option',
      context: {
        projectName: args.projectName,
        options: args.options,
        strategicObjectives: args.strategicObjectives,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Map options to strategic objectives',
        '2. Assess alignment scores',
        '3. Evaluate strategic fit',
        '4. Consider competitive positioning',
        '5. Assess market timing',
        '6. Evaluate capability building',
        '7. Consider synergies',
        '8. Assess stakeholder alignment',
        '9. Calculate alignment scores',
        '10. Rank strategic alignment'
      ],
      outputFormat: 'JSON object with strategic alignment'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentByOption'],
      properties: {
        alignmentByOption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              alignmentScore: { type: 'number' },
              objectiveMapping: { type: 'array' },
              strategicFit: { type: 'string' }
            }
          }
        },
        strategicRanking: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'strategy']
}));

export const optionsComparisonTask = defineTask('options-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Options Comparison - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst',
      task: 'Compare and rank solution options',
      context: {
        projectName: args.projectName,
        benefitsAnalysis: args.benefitsAnalysis,
        costAnalysis: args.costAnalysis,
        financialAnalysis: args.financialAnalysis,
        riskAssessment: args.riskAssessment,
        strategicAlignment: args.strategicAlignment
      },
      instructions: [
        '1. Create comparison matrix',
        '2. Apply weighted scoring',
        '3. Compare financial metrics',
        '4. Compare risk profiles',
        '5. Compare strategic alignment',
        '6. Assess implementation complexity',
        '7. Consider organizational readiness',
        '8. Rank options overall',
        '9. Document trade-offs',
        '10. Summarize comparison'
      ],
      outputFormat: 'JSON object with options comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedOptions', 'comparisonMatrix'],
      properties: {
        rankedOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              optionId: { type: 'string' },
              overallScore: { type: 'number' },
              financialScore: { type: 'number' },
              riskScore: { type: 'number' },
              strategicScore: { type: 'number' }
            }
          }
        },
        comparisonMatrix: { type: 'object' },
        tradeOffs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'comparison']
}));

export const recommendationDevelopmentTask = defineTask('recommendation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Recommendation Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Advisor',
      task: 'Develop funding recommendation',
      context: {
        projectName: args.projectName,
        optionsComparison: args.optionsComparison,
        constraints: args.constraints,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Select recommended option',
        '2. Document recommendation rationale',
        '3. Address key concerns',
        '4. Define conditions for approval',
        '5. Outline implementation approach',
        '6. Define governance requirements',
        '7. Set review milestones',
        '8. Document contingency plans',
        '9. Identify next steps',
        '10. Prepare executive recommendation'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedOption', 'rationale'],
      properties: {
        recommendedOption: { type: 'string' },
        rationale: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        implementationApproach: { type: 'string' },
        governanceRequirements: { type: 'array', items: { type: 'string' } },
        reviewMilestones: { type: 'array' },
        contingencyPlans: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'recommendation']
}));

export const businessCaseDocumentTask = defineTask('business-case-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Business Case Document - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate comprehensive business case document',
      context: {
        projectName: args.projectName,
        problemAnalysis: args.problemAnalysis,
        optionsIdentification: args.optionsIdentification,
        benefitsAnalysis: args.benefitsAnalysis,
        costAnalysis: args.costAnalysis,
        financialAnalysis: args.financialAnalysis,
        riskAssessment: args.riskAssessment,
        strategicAlignment: args.strategicAlignment,
        optionsComparison: args.optionsComparison,
        recommendation: args.recommendation
      },
      instructions: [
        '1. Create executive summary',
        '2. Document problem statement',
        '3. Present options analysis',
        '4. Include financial analysis',
        '5. Document risks',
        '6. Present recommendation',
        '7. Include appendices',
        '8. Generate markdown',
        '9. Add version control',
        '10. Prepare for approval'
      ],
      outputFormat: 'JSON object with business case document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: { type: 'object' },
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        appendices: { type: 'array' },
        approvalRequirements: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            author: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['business-case', 'documentation']
}));
