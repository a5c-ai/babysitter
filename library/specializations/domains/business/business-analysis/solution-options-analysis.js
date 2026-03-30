/**
 * @process business-analysis/solution-options-analysis
 * @description Evaluate alternative solutions against defined criteria including feasibility, cost, risk, strategic fit, and stakeholder impact. Apply structured decision-making frameworks to recommend preferred options.
 * @inputs { projectName: string, problemStatement: string, options: array, evaluationCriteria: array, stakeholders: array }
 * @outputs { success: boolean, evaluatedOptions: array, comparisonMatrix: object, recommendation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    problemStatement = '',
    options = [],
    evaluationCriteria = [],
    stakeholders = [],
    outputDir = 'options-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Solution Options Analysis for ${projectName}`);

  // ============================================================================
  // PHASE 1: CRITERIA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining evaluation criteria');
  const criteriaDefinition = await ctx.task(criteriaDefinitionTask, {
    projectName,
    problemStatement,
    evaluationCriteria,
    stakeholders,
    outputDir
  });

  artifacts.push(...criteriaDefinition.artifacts);

  // ============================================================================
  // PHASE 2: OPTIONS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying and describing options');
  const optionsIdentification = await ctx.task(optionsIdentificationTask, {
    projectName,
    options,
    problemStatement,
    outputDir
  });

  artifacts.push(...optionsIdentification.artifacts);

  // ============================================================================
  // PHASE 3: FEASIBILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing feasibility');
  const feasibilityAssessment = await ctx.task(feasibilityAssessmentTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    outputDir
  });

  artifacts.push(...feasibilityAssessment.artifacts);

  // ============================================================================
  // PHASE 4: COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing costs');
  const costAnalysis = await ctx.task(costAnalysisTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    feasibilityAssessment,
    outputDir
  });

  artifacts.push(...costAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing risks');
  const riskAnalysis = await ctx.task(riskAnalysisTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    feasibilityAssessment,
    outputDir
  });

  artifacts.push(...riskAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: STAKEHOLDER IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing stakeholder impact');
  const stakeholderImpact = await ctx.task(stakeholderImpactTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    stakeholders,
    outputDir
  });

  artifacts.push(...stakeholderImpact.artifacts);

  // ============================================================================
  // PHASE 7: WEIGHTED SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating weighted scores');
  const weightedScoring = await ctx.task(weightedScoringTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    criteria: criteriaDefinition.weightedCriteria,
    feasibilityAssessment,
    costAnalysis,
    riskAnalysis,
    stakeholderImpact,
    outputDir
  });

  artifacts.push(...weightedScoring.artifacts);

  // ============================================================================
  // PHASE 8: COMPARISON MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating comparison matrix');
  const comparisonMatrix = await ctx.task(comparisonMatrixTask, {
    projectName,
    options: optionsIdentification.refinedOptions,
    weightedScoring,
    criteriaDefinition,
    outputDir
  });

  artifacts.push(...comparisonMatrix.artifacts);

  // Breakpoint: Review options analysis
  await ctx.breakpoint({
    question: `Options analysis complete for ${projectName}. Top option: ${weightedScoring.topOption}. Review and approve recommendation?`,
    title: 'Options Analysis Review',
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
        topOption: weightedScoring.topOption,
        topScore: weightedScoring.topScore,
        optionsEvaluated: optionsIdentification.refinedOptions?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 9: RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing recommendation');
  const recommendation = await ctx.task(optionRecommendationTask, {
    projectName,
    weightedScoring,
    comparisonMatrix,
    riskAnalysis,
    stakeholderImpact,
    outputDir
  });

  artifacts.push(...recommendation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    evaluatedOptions: optionsIdentification.refinedOptions,
    comparisonMatrix: {
      matrixPath: comparisonMatrix.matrixPath,
      matrix: comparisonMatrix.matrix
    },
    weightedScoring: {
      scores: weightedScoring.scores,
      topOption: weightedScoring.topOption,
      topScore: weightedScoring.topScore
    },
    recommendation: {
      recommendedOption: recommendation.recommendedOption,
      rationale: recommendation.rationale,
      confidenceLevel: recommendation.confidenceLevel,
      alternatives: recommendation.alternatives
    },
    analysisDetails: {
      feasibility: feasibilityAssessment.summary,
      costs: costAnalysis.summary,
      risks: riskAnalysis.summary,
      stakeholderImpact: stakeholderImpact.summary
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/solution-options-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const criteriaDefinitionTask = defineTask('criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define evaluation criteria',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with BABOK expertise',
      task: 'Define and weight evaluation criteria for options analysis',
      context: args,
      instructions: [
        'Define evaluation criteria categories (feasibility, cost, benefit, risk)',
        'Include must-have vs nice-to-have criteria',
        'Apply MECE principle to criteria structure',
        'Assign weights to each criterion (total = 100%)',
        'Define scoring scale (1-5 or 1-10)',
        'Document criteria definitions clearly',
        'Validate criteria with stakeholders',
        'Identify showstopper criteria',
        'Document weighting rationale',
        'Create criteria worksheet'
      ],
      outputFormat: 'JSON with weightedCriteria, criteriaDefinitions, scoringScale, mustHaveCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['weightedCriteria', 'criteriaDefinitions', 'artifacts'],
      properties: {
        weightedCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              category: { type: 'string' },
              weight: { type: 'number' },
              type: { type: 'string', enum: ['must-have', 'nice-to-have'] }
            }
          }
        },
        criteriaDefinitions: { type: 'object' },
        scoringScale: { type: 'object' },
        mustHaveCriteria: { type: 'array', items: { type: 'string' } },
        weightingRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'criteria']
}));

export const optionsIdentificationTask = defineTask('options-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify options',
  agent: {
    name: 'solutions-analyst',
    prompt: {
      role: 'solutions analyst',
      task: 'Identify and describe solution options for evaluation',
      context: args,
      instructions: [
        'Include baseline/do-nothing option',
        'Describe each option clearly',
        'Ensure options are mutually exclusive',
        'Identify option variations if applicable',
        'Document option scope and boundaries',
        'Identify key differentiators',
        'Note assumptions for each option',
        'Identify option dependencies',
        'Ensure sufficient option diversity',
        'Create option summary cards'
      ],
      outputFormat: 'JSON with refinedOptions, optionDescriptions, differentiators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedOptions', 'artifacts'],
      properties: {
        refinedOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              scope: { type: 'string' },
              keyFeatures: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        optionDescriptions: { type: 'object' },
        differentiators: { type: 'object' },
        baselineOption: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'identification']
}));

export const feasibilityAssessmentTask = defineTask('feasibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess feasibility',
  agent: {
    name: 'feasibility-analyst',
    prompt: {
      role: 'technical and business feasibility analyst',
      task: 'Assess feasibility of each solution option',
      context: args,
      instructions: [
        'Assess technical feasibility',
        'Assess operational feasibility',
        'Assess economic feasibility',
        'Assess schedule/timing feasibility',
        'Assess resource availability',
        'Assess organizational readiness',
        'Identify feasibility constraints',
        'Rate overall feasibility',
        'Document feasibility concerns',
        'Create feasibility summary'
      ],
      outputFormat: 'JSON with feasibilityScores, technicalFeasibility, operationalFeasibility, constraints, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibilityScores', 'summary', 'artifacts'],
      properties: {
        feasibilityScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              technical: { type: 'number' },
              operational: { type: 'number' },
              economic: { type: 'number' },
              schedule: { type: 'number' },
              overall: { type: 'number' }
            }
          }
        },
        technicalFeasibility: { type: 'object' },
        operationalFeasibility: { type: 'object' },
        constraints: { type: 'array', items: { type: 'object' } },
        concerns: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'feasibility']
}));

export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze costs',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'cost estimation analyst',
      task: 'Analyze costs for each solution option',
      context: args,
      instructions: [
        'Estimate capital costs (one-time)',
        'Estimate operational costs (ongoing)',
        'Estimate implementation costs',
        'Estimate hidden/indirect costs',
        'Estimate opportunity costs',
        'Create cost breakdown structure',
        'Identify cost drivers',
        'Estimate cost ranges (low/likely/high)',
        'Compare total cost of ownership',
        'Create cost comparison summary'
      ],
      outputFormat: 'JSON with costEstimates, tcoComparison, costDrivers, ranges, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costEstimates', 'summary', 'artifacts'],
      properties: {
        costEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              capitalCost: { type: 'string' },
              operationalCost: { type: 'string' },
              implementationCost: { type: 'string' },
              totalCost: { type: 'string' },
              tco: { type: 'string' }
            }
          }
        },
        tcoComparison: { type: 'object' },
        costDrivers: { type: 'array', items: { type: 'object' } },
        ranges: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'cost']
}));

export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'risk analysis specialist',
      task: 'Analyze risks for each solution option',
      context: args,
      instructions: [
        'Identify implementation risks',
        'Identify technical risks',
        'Identify operational risks',
        'Identify business risks',
        'Assess probability and impact',
        'Calculate risk scores',
        'Compare risk profiles',
        'Identify showstopper risks',
        'Document mitigation strategies',
        'Create risk comparison summary'
      ],
      outputFormat: 'JSON with riskProfiles, riskComparison, showstoppers, mitigations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfiles', 'summary', 'artifacts'],
      properties: {
        riskProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              overallRisk: { type: 'string', enum: ['high', 'medium', 'low'] },
              riskScore: { type: 'number' },
              keyRisks: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        riskComparison: { type: 'object' },
        showstoppers: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'risk']
}));

export const stakeholderImpactTask = defineTask('stakeholder-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze stakeholder impact',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'stakeholder impact analyst',
      task: 'Analyze stakeholder impact for each solution option',
      context: args,
      instructions: [
        'Identify impact on each stakeholder group',
        'Assess positive and negative impacts',
        'Assess change magnitude',
        'Identify resistance potential',
        'Assess adoption effort required',
        'Evaluate stakeholder benefits',
        'Compare stakeholder impacts across options',
        'Identify change management needs',
        'Document stakeholder concerns',
        'Create impact comparison summary'
      ],
      outputFormat: 'JSON with impactAssessments, impactComparison, resistanceAnalysis, changeNeeds, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impactAssessments', 'summary', 'artifacts'],
      properties: {
        impactAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              stakeholderImpacts: { type: 'array', items: { type: 'object' } },
              overallImpact: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
              resistanceLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        impactComparison: { type: 'object' },
        resistanceAnalysis: { type: 'object' },
        changeNeeds: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'stakeholder']
}));

export const weightedScoringTask = defineTask('weighted-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate weighted scores',
  agent: {
    name: 'scoring-analyst',
    prompt: {
      role: 'decision analysis specialist',
      task: 'Calculate weighted scores for each option',
      context: args,
      instructions: [
        'Score each option against each criterion',
        'Apply criterion weights',
        'Calculate weighted scores',
        'Rank options by total score',
        'Perform sensitivity analysis',
        'Identify top-performing option',
        'Document scoring rationale',
        'Calculate score differentials',
        'Identify close alternatives',
        'Create scoring summary'
      ],
      outputFormat: 'JSON with scores, topOption, topScore, ranking, sensitivityAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'topOption', 'topScore', 'artifacts'],
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              criterionScores: { type: 'object' },
              weightedTotal: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        topOption: { type: 'string' },
        topScore: { type: 'number' },
        ranking: { type: 'array', items: { type: 'string' } },
        sensitivityAnalysis: { type: 'object' },
        closeAlternatives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'scoring']
}));

export const comparisonMatrixTask = defineTask('comparison-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comparison matrix',
  agent: {
    name: 'visualization-specialist',
    prompt: {
      role: 'decision support visualization specialist',
      task: 'Create comprehensive options comparison matrix',
      context: args,
      instructions: [
        'Create options comparison table',
        'Include all evaluation criteria',
        'Show scores and rankings',
        'Include color coding for easy reading',
        'Add summary row/column',
        'Create visual comparison charts',
        'Highlight key differentiators',
        'Include pros/cons summary',
        'Create executive summary view',
        'Generate comparison matrix document'
      ],
      outputFormat: 'JSON with matrixPath, matrix, visualizations, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrixPath', 'matrix', 'artifacts'],
      properties: {
        matrixPath: { type: 'string' },
        matrix: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'object' },
        differentiators: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'comparison']
}));

export const optionRecommendationTask = defineTask('option-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendation',
  agent: {
    name: 'senior-analyst',
    prompt: {
      role: 'senior business analyst and decision advisor',
      task: 'Develop and justify option recommendation',
      context: args,
      instructions: [
        'Identify recommended option',
        'Provide clear rationale',
        'Address key stakeholder concerns',
        'State confidence level',
        'Identify conditions for success',
        'Note key assumptions',
        'Identify runner-up alternatives',
        'Document decision factors',
        'Provide implementation considerations',
        'Create recommendation summary'
      ],
      outputFormat: 'JSON with recommendedOption, rationale, confidenceLevel, alternatives, conditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedOption', 'rationale', 'confidenceLevel', 'artifacts'],
      properties: {
        recommendedOption: { type: 'string' },
        rationale: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              scenario: { type: 'string' }
            }
          }
        },
        conditions: { type: 'array', items: { type: 'string' } },
        keyAssumptions: { type: 'array', items: { type: 'string' } },
        implementationConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'options-analysis', 'recommendation']
}));
