/**
 * @process business-analysis/business-case-development
 * @description Create compelling business cases with problem statements, strategic alignment, options analysis, cost-benefit analysis (ROI, NPV, payback), risk assessment, and implementation recommendations.
 * @inputs { projectName: string, problemStatement: string, strategicContext: object, options: array, financialData: object }
 * @outputs { success: boolean, businessCase: object, financialAnalysis: object, recommendation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    problemStatement = '',
    strategicContext = {},
    options = [],
    financialData = {},
    outputDir = 'business-case-output',
    analysisHorizon = 5
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Business Case Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: PROBLEM STATEMENT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining problem statement');
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    projectName,
    problemStatement,
    strategicContext,
    outputDir
  });

  artifacts.push(...problemDefinition.artifacts);

  // ============================================================================
  // PHASE 2: STRATEGIC ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing strategic alignment');
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    projectName,
    problemDefinition,
    strategicContext,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  // ============================================================================
  // PHASE 3: OPTIONS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing solution options');
  const optionsAnalysis = await ctx.task(optionsAnalysisTask, {
    projectName,
    options,
    problemDefinition,
    strategicAlignment,
    outputDir
  });

  artifacts.push(...optionsAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: COST-BENEFIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting cost-benefit analysis');
  const costBenefitAnalysis = await ctx.task(costBenefitAnalysisTask, {
    projectName,
    options: optionsAnalysis.evaluatedOptions,
    financialData,
    analysisHorizon,
    outputDir
  });

  artifacts.push(...costBenefitAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing risks');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    options: optionsAnalysis.evaluatedOptions,
    costBenefitAnalysis,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 6: RECOMMENDATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing recommendation');
  const recommendation = await ctx.task(recommendationTask, {
    projectName,
    optionsAnalysis,
    costBenefitAnalysis,
    riskAssessment,
    strategicAlignment,
    outputDir
  });

  artifacts.push(...recommendation.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    recommendedOption: recommendation.recommendedOption,
    costBenefitAnalysis,
    riskAssessment,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 8: BUSINESS CASE DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating business case document');
  const businessCaseDocument = await ctx.task(businessCaseDocumentTask, {
    projectName,
    problemDefinition,
    strategicAlignment,
    optionsAnalysis,
    costBenefitAnalysis,
    riskAssessment,
    recommendation,
    implementationPlan,
    outputDir
  });

  artifacts.push(...businessCaseDocument.artifacts);

  // Breakpoint: Review business case
  await ctx.breakpoint({
    question: `Business case complete for ${projectName}. Recommended option: ${recommendation.recommendedOption}. NPV: ${costBenefitAnalysis.recommendedOptionNPV}. Review and approve?`,
    title: 'Business Case Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        recommendedOption: recommendation.recommendedOption,
        npv: costBenefitAnalysis.recommendedOptionNPV,
        paybackPeriod: costBenefitAnalysis.paybackPeriod,
        roi: costBenefitAnalysis.roi
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    businessCase: {
      documentPath: businessCaseDocument.documentPath,
      executiveSummary: businessCaseDocument.executiveSummary
    },
    problemStatement: problemDefinition.refinedProblem,
    strategicAlignment: {
      alignmentScore: strategicAlignment.alignmentScore,
      alignedObjectives: strategicAlignment.alignedObjectives
    },
    optionsAnalysis: {
      evaluatedOptions: optionsAnalysis.evaluatedOptions,
      comparisonMatrix: optionsAnalysis.comparisonMatrix
    },
    financialAnalysis: {
      npv: costBenefitAnalysis.recommendedOptionNPV,
      roi: costBenefitAnalysis.roi,
      paybackPeriod: costBenefitAnalysis.paybackPeriod,
      irr: costBenefitAnalysis.irr,
      totalCosts: costBenefitAnalysis.totalCosts,
      totalBenefits: costBenefitAnalysis.totalBenefits
    },
    riskAssessment: {
      overallRisk: riskAssessment.overallRisk,
      keyRisks: riskAssessment.keyRisks,
      mitigationStrategies: riskAssessment.mitigationStrategies
    },
    recommendation: {
      recommendedOption: recommendation.recommendedOption,
      rationale: recommendation.rationale,
      confidenceLevel: recommendation.confidenceLevel
    },
    implementationPlan: {
      timeline: implementationPlan.timeline,
      milestones: implementationPlan.milestones,
      resourceRequirements: implementationPlan.resourceRequirements
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/business-case-development',
      timestamp: startTime,
      analysisHorizon,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define problem statement',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with McKinsey problem-solving expertise',
      task: 'Define and refine the business problem statement',
      context: args,
      instructions: [
        'Structure problem using MECE principle',
        'Define the problem clearly and specifically',
        'Quantify the problem impact where possible',
        'Identify root causes vs symptoms',
        'Define scope and boundaries',
        'Identify key stakeholders affected',
        'Document current pain points',
        'Establish baseline metrics',
        'Define success criteria',
        'Create problem statement document'
      ],
      outputFormat: 'JSON with refinedProblem, impact, rootCauses, stakeholders, baseline, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedProblem', 'impact', 'artifacts'],
      properties: {
        refinedProblem: { type: 'string' },
        impact: {
          type: 'object',
          properties: {
            financial: { type: 'string' },
            operational: { type: 'string' },
            strategic: { type: 'string' },
            customer: { type: 'string' }
          }
        },
        rootCauses: { type: 'array', items: { type: 'string' } },
        stakeholders: { type: 'array', items: { type: 'string' } },
        baseline: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'problem-definition']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze strategic alignment',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'strategic planning analyst',
      task: 'Analyze alignment with organizational strategy and objectives',
      context: args,
      instructions: [
        'Map to organizational strategic objectives',
        'Assess alignment with mission and vision',
        'Identify strategic drivers supported',
        'Evaluate competitive advantage impact',
        'Assess market/industry alignment',
        'Identify synergies with other initiatives',
        'Evaluate timing and strategic fit',
        'Calculate strategic alignment score',
        'Document strategic rationale',
        'Identify strategic risks'
      ],
      outputFormat: 'JSON with alignmentScore, alignedObjectives, strategicDrivers, competitiveImpact, synergies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScore', 'alignedObjectives', 'artifacts'],
      properties: {
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        alignedObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              alignmentStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              rationale: { type: 'string' }
            }
          }
        },
        strategicDrivers: { type: 'array', items: { type: 'string' } },
        competitiveImpact: { type: 'object' },
        synergies: { type: 'array', items: { type: 'string' } },
        strategicRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'strategy']
}));

export const optionsAnalysisTask = defineTask('options-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze solution options',
  agent: {
    name: 'solutions-analyst',
    prompt: {
      role: 'solutions analyst with options evaluation expertise',
      task: 'Evaluate and compare solution options',
      context: args,
      instructions: [
        'Include "do nothing" option as baseline',
        'Define evaluation criteria (cost, benefit, risk, feasibility)',
        'Assess each option against criteria',
        'Create weighted scoring model',
        'Identify option dependencies and constraints',
        'Assess implementation complexity',
        'Evaluate scalability and flexibility',
        'Create comparison matrix',
        'Identify hybrid options if applicable',
        'Document pros and cons for each'
      ],
      outputFormat: 'JSON with evaluatedOptions, comparisonMatrix, weightedScores, prosConsList, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluatedOptions', 'comparisonMatrix', 'artifacts'],
      properties: {
        evaluatedOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              weightedScore: { type: 'number' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        comparisonMatrix: { type: 'object' },
        evaluationCriteria: { type: 'array', items: { type: 'object' } },
        weightedScores: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'options-analysis']
}));

export const costBenefitAnalysisTask = defineTask('cost-benefit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct cost-benefit analysis',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial analyst with investment analysis expertise',
      task: 'Conduct comprehensive cost-benefit and financial analysis',
      context: args,
      instructions: [
        'Identify all cost categories (capital, operational, opportunity)',
        'Quantify tangible and intangible benefits',
        'Calculate Net Present Value (NPV)',
        'Calculate Return on Investment (ROI)',
        'Calculate payback period',
        'Calculate Internal Rate of Return (IRR)',
        'Perform sensitivity analysis',
        'Create cash flow projections',
        'Document assumptions',
        'Create financial summary'
      ],
      outputFormat: 'JSON with recommendedOptionNPV, roi, paybackPeriod, irr, totalCosts, totalBenefits, cashFlows, sensitivityAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedOptionNPV', 'roi', 'paybackPeriod', 'artifacts'],
      properties: {
        recommendedOptionNPV: { type: 'string' },
        roi: { type: 'string' },
        paybackPeriod: { type: 'string' },
        irr: { type: 'string' },
        totalCosts: {
          type: 'object',
          properties: {
            capital: { type: 'string' },
            operational: { type: 'string' },
            total: { type: 'string' }
          }
        },
        totalBenefits: {
          type: 'object',
          properties: {
            tangible: { type: 'string' },
            intangible: { type: 'array', items: { type: 'string' } },
            total: { type: 'string' }
          }
        },
        cashFlows: { type: 'array', items: { type: 'object' } },
        sensitivityAnalysis: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        optionFinancials: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'financial-analysis']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'business risk analyst',
      task: 'Assess risks for business case options',
      context: args,
      instructions: [
        'Identify implementation risks',
        'Identify financial risks',
        'Identify operational risks',
        'Identify strategic risks',
        'Assess probability and impact',
        'Calculate risk scores',
        'Develop mitigation strategies',
        'Quantify risk costs where possible',
        'Create risk register',
        'Determine overall risk rating'
      ],
      outputFormat: 'JSON with overallRisk, keyRisks, riskRegister, mitigationStrategies, riskCosts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRisk', 'keyRisks', 'artifacts'],
      properties: {
        overallRisk: { type: 'string', enum: ['high', 'medium', 'low'] },
        keyRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              score: { type: 'number' }
            }
          }
        },
        riskRegister: { type: 'array', items: { type: 'object' } },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              strategy: { type: 'string' },
              owner: { type: 'string' },
              cost: { type: 'string' }
            }
          }
        },
        riskCosts: { type: 'string' },
        optionRisks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'risk']
}));

export const recommendationTask = defineTask('recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendation',
  agent: {
    name: 'senior-analyst',
    prompt: {
      role: 'senior business analyst and advisor',
      task: 'Develop and justify business case recommendation',
      context: args,
      instructions: [
        'Synthesize all analysis findings',
        'Apply Pyramid Principle for recommendation structure',
        'Identify recommended option',
        'Provide clear rationale',
        'Address key concerns proactively',
        'State confidence level',
        'Identify conditions for success',
        'Note key assumptions',
        'Provide alternatives if recommendation rejected',
        'Create executive-ready recommendation'
      ],
      outputFormat: 'JSON with recommendedOption, rationale, confidenceLevel, conditions, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedOption', 'rationale', 'confidenceLevel', 'artifacts'],
      properties: {
        recommendedOption: { type: 'string' },
        rationale: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        supportingEvidence: { type: 'array', items: { type: 'string' } },
        conditions: { type: 'array', items: { type: 'string' } },
        keyAssumptions: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'string' } },
        decisionsNeeded: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'recommendation']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'implementation planning specialist',
      task: 'Create high-level implementation plan for recommended option',
      context: args,
      instructions: [
        'Define implementation phases',
        'Create timeline with milestones',
        'Identify resource requirements',
        'Define governance structure',
        'Identify dependencies',
        'Define success metrics',
        'Create risk mitigation schedule',
        'Plan stakeholder engagement',
        'Define change management approach',
        'Create implementation roadmap'
      ],
      outputFormat: 'JSON with timeline, milestones, resourceRequirements, governance, dependencies, successMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'milestones', 'resourceRequirements', 'artifacts'],
      properties: {
        timeline: { type: 'string' },
        phases: { type: 'array', items: { type: 'object' } },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resourceRequirements: {
          type: 'object',
          properties: {
            budget: { type: 'string' },
            team: { type: 'array', items: { type: 'string' } },
            technology: { type: 'array', items: { type: 'string' } }
          }
        },
        governance: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'implementation']
}));

export const businessCaseDocumentTask = defineTask('business-case-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate business case document',
  agent: {
    name: 'document-writer',
    prompt: {
      role: 'executive communications specialist',
      task: 'Generate comprehensive business case document',
      context: args,
      instructions: [
        'Create compelling executive summary',
        'Structure using Pyramid Principle',
        'Include problem statement',
        'Present strategic alignment',
        'Include options analysis',
        'Present financial analysis with visuals',
        'Include risk assessment',
        'Present recommendation clearly',
        'Include implementation roadmap',
        'Add appendices with supporting detail'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, sections, appendices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        keyVisuals: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'business-case', 'documentation']
}));
