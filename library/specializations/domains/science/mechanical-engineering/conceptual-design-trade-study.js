/**
 * @process specializations/domains/science/mechanical-engineering/conceptual-design-trade-study
 * @description Conceptual Design Trade Study - Structured evaluation of multiple design concepts through
 * systematic comparison against weighted criteria, including preliminary analysis, feasibility assessment,
 * and concept selection methodology using Pugh matrices or similar decision tools.
 * @inputs { projectName: string, designChallenge: string, concepts?: string[], criteria?: string[], constraints?: string }
 * @outputs { success: boolean, tradeStudyReport: object, selectedConcept: object, sensitivityAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/conceptual-design-trade-study', {
 *   projectName: 'Heat Exchanger Design',
 *   designChallenge: 'Compact heat exchanger for aerospace application with high efficiency',
 *   concepts: ['Shell-and-tube', 'Plate-fin', 'Microchannel'],
 *   criteria: ['Weight', 'Efficiency', 'Cost', 'Reliability', 'Manufacturability']
 * });
 *
 * @references
 * - Shigley's Mechanical Engineering Design: https://www.mheducation.com/highered/product/shigley-s-mechanical-engineering-design-budynas-nisbett/M9780073398204.html
 * - Pahl and Beitz Engineering Design: https://www.springer.com/gp/book/9781846283185
 * - INCOSE Decision Analysis Guidance: https://www.incose.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    designChallenge,
    concepts = [],
    criteria = [],
    constraints = ''
  } = inputs;

  // Phase 1: Design Challenge Analysis
  const challengeAnalysis = await ctx.task(challengeAnalysisTask, {
    projectName,
    designChallenge,
    constraints
  });

  // Phase 2: Concept Generation
  const conceptGeneration = await ctx.task(conceptGenerationTask, {
    projectName,
    designChallenge,
    existingConcepts: concepts,
    challengeAnalysis: challengeAnalysis.analysis
  });

  // Quality Gate: At least 3 concepts required
  if (conceptGeneration.concepts.length < 3) {
    await ctx.breakpoint({
      question: `Only ${conceptGeneration.concepts.length} concepts generated. Should we proceed with limited alternatives or expand concept exploration?`,
      title: 'Concept Count Warning',
      context: {
        runId: ctx.runId,
        concepts: conceptGeneration.concepts
      }
    });
  }

  // Phase 3: Criteria Definition and Weighting
  const criteriaDefinition = await ctx.task(criteriaDefinitionTask, {
    projectName,
    designChallenge,
    existingCriteria: criteria,
    challengeAnalysis: challengeAnalysis.analysis
  });

  // Breakpoint: Review criteria and weights
  await ctx.breakpoint({
    question: `Review evaluation criteria and weights for ${projectName}. Are the priorities correctly represented?`,
    title: 'Criteria Review',
    context: {
      runId: ctx.runId,
      criteria: criteriaDefinition.criteria,
      files: [{
        path: `artifacts/criteria-definition.json`,
        format: 'json',
        content: criteriaDefinition
      }]
    }
  });

  // Phase 4: Preliminary Technical Analysis
  const technicalAnalysis = await ctx.task(technicalAnalysisTask, {
    projectName,
    concepts: conceptGeneration.concepts,
    challengeAnalysis: challengeAnalysis.analysis
  });

  // Phase 5: Feasibility Assessment
  const feasibilityAssessment = await ctx.task(feasibilityAssessmentTask, {
    projectName,
    concepts: conceptGeneration.concepts,
    technicalAnalysis: technicalAnalysis.analysis,
    constraints
  });

  // Filter out infeasible concepts
  const feasibleConcepts = conceptGeneration.concepts.filter(
    (c, i) => feasibilityAssessment.assessments[i]?.feasible !== false
  );

  if (feasibleConcepts.length === 0) {
    return {
      success: false,
      error: 'No feasible concepts identified',
      phase: 'feasibility-assessment',
      tradeStudyReport: null
    };
  }

  // Phase 6: Pugh Matrix Evaluation
  const pughMatrix = await ctx.task(pughMatrixTask, {
    projectName,
    concepts: feasibleConcepts,
    criteria: criteriaDefinition.criteria,
    technicalAnalysis: technicalAnalysis.analysis
  });

  // Phase 7: Weighted Scoring Analysis
  const weightedScoring = await ctx.task(weightedScoringTask, {
    projectName,
    concepts: feasibleConcepts,
    criteria: criteriaDefinition.criteria,
    pughResults: pughMatrix.results
  });

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    projectName,
    concepts: feasibleConcepts,
    criteria: criteriaDefinition.criteria,
    weightedScores: weightedScoring.scores
  });

  // Phase 9: Risk Assessment
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    concepts: feasibleConcepts,
    technicalAnalysis: technicalAnalysis.analysis,
    weightedScores: weightedScoring.scores
  });

  // Phase 10: Trade Study Report Generation
  const tradeStudyReport = await ctx.task(tradeStudyReportTask, {
    projectName,
    designChallenge,
    challengeAnalysis,
    conceptGeneration,
    criteriaDefinition,
    technicalAnalysis,
    feasibilityAssessment,
    pughMatrix,
    weightedScoring,
    sensitivityAnalysis,
    riskAssessment
  });

  // Final Breakpoint: Concept Selection Approval
  await ctx.breakpoint({
    question: `Trade Study Complete for ${projectName}. Recommended concept: ${tradeStudyReport.selectedConcept.name}. Approve selection?`,
    title: 'Concept Selection Approval',
    context: {
      runId: ctx.runId,
      selectedConcept: tradeStudyReport.selectedConcept,
      alternativeConcepts: tradeStudyReport.rankedConcepts,
      files: [
        { path: `artifacts/trade-study-report.json`, format: 'json', content: tradeStudyReport },
        { path: `artifacts/trade-study-report.md`, format: 'markdown', content: tradeStudyReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    tradeStudyReport: tradeStudyReport.report,
    selectedConcept: tradeStudyReport.selectedConcept,
    sensitivityAnalysis: sensitivityAnalysis.results,
    rankedConcepts: tradeStudyReport.rankedConcepts,
    riskProfile: riskAssessment.riskProfile,
    nextSteps: tradeStudyReport.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/conceptual-design-trade-study',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const challengeAnalysisTask = defineTask('challenge-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Challenge Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Mechanical Design Engineer with expertise in conceptual design',
      task: 'Analyze the design challenge and establish evaluation framework',
      context: {
        projectName: args.projectName,
        designChallenge: args.designChallenge,
        constraints: args.constraints
      },
      instructions: [
        '1. Parse and clarify the design challenge statement',
        '2. Identify primary functional requirements',
        '3. Identify performance requirements and targets',
        '4. Document design constraints (physical, economic, regulatory)',
        '5. Identify key design drivers and trade-offs',
        '6. Define design space boundaries',
        '7. Identify critical success factors',
        '8. Document assumptions and uncertainties',
        '9. Identify relevant prior art and benchmarks',
        '10. Establish baseline or reference design if applicable'
      ],
      outputFormat: 'JSON object with design challenge analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            challenge: { type: 'string' },
            functionalRequirements: { type: 'array', items: { type: 'string' } },
            performanceTargets: { type: 'array', items: { type: 'object' } },
            constraints: { type: 'array', items: { type: 'object' } },
            designDrivers: { type: 'array', items: { type: 'string' } },
            tradeOffs: { type: 'array', items: { type: 'object' } }
          }
        },
        baseline: { type: 'object' },
        benchmarks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'challenge-analysis']
}));

export const conceptGenerationTask = defineTask('concept-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Concept Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Creative Design Engineer with expertise in concept development',
      task: 'Generate and document alternative design concepts',
      context: {
        projectName: args.projectName,
        designChallenge: args.designChallenge,
        existingConcepts: args.existingConcepts,
        challengeAnalysis: args.challengeAnalysis
      },
      instructions: [
        '1. Review existing concepts provided by stakeholders',
        '2. Generate additional concepts using systematic methods (morphological analysis, TRIZ, biomimicry)',
        '3. Document each concept with description and sketches/diagrams',
        '4. Identify key features and operating principles for each concept',
        '5. Document advantages and disadvantages of each concept',
        '6. Identify technology readiness level for each concept',
        '7. Group similar concepts into concept families',
        '8. Identify hybrid concepts combining features from multiple alternatives',
        '9. Screen concepts for basic feasibility',
        '10. Document rationale for including/excluding concepts'
      ],
      outputFormat: 'JSON object with generated concepts'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              operatingPrinciple: { type: 'string' },
              advantages: { type: 'array', items: { type: 'string' } },
              disadvantages: { type: 'array', items: { type: 'string' } },
              trl: { type: 'number' }
            }
          }
        },
        conceptFamilies: { type: 'array', items: { type: 'object' } },
        screenedOut: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'concept-generation']
}));

export const criteriaDefinitionTask = defineTask('criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Criteria Definition and Weighting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Engineer with expertise in decision analysis',
      task: 'Define and weight evaluation criteria for concept comparison',
      context: {
        projectName: args.projectName,
        designChallenge: args.designChallenge,
        existingCriteria: args.existingCriteria,
        challengeAnalysis: args.challengeAnalysis
      },
      instructions: [
        '1. Review design requirements and stakeholder needs for criteria',
        '2. Define performance criteria (efficiency, speed, accuracy, etc.)',
        '3. Define physical criteria (size, weight, envelope)',
        '4. Define economic criteria (cost, ROI, lifecycle cost)',
        '5. Define manufacturing criteria (complexity, lead time, tooling)',
        '6. Define reliability and maintainability criteria',
        '7. Define safety and regulatory criteria',
        '8. Establish measurement scales for each criterion',
        '9. Assign weights using AHP, swing weighting, or direct assignment',
        '10. Validate criteria completeness and independence'
      ],
      outputFormat: 'JSON object with evaluation criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'number' },
              scale: { type: 'object' },
              direction: { type: 'string', enum: ['maximize', 'minimize', 'target'] }
            }
          }
        },
        weightingMethod: { type: 'string' },
        weightingRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'criteria-definition']
}));

export const technicalAnalysisTask = defineTask('technical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Preliminary Technical Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Mechanical Engineer with expertise in engineering analysis',
      task: 'Conduct preliminary technical analysis of each concept',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        challengeAnalysis: args.challengeAnalysis
      },
      instructions: [
        '1. Perform preliminary sizing calculations for each concept',
        '2. Estimate performance parameters (efficiency, capacity, etc.)',
        '3. Conduct preliminary structural analysis',
        '4. Estimate weight and envelope for each concept',
        '5. Identify critical components and technologies',
        '6. Assess manufacturing complexity',
        '7. Estimate development time and cost',
        '8. Identify technical risks and uncertainties',
        '9. Compare predicted performance against requirements',
        '10. Document analysis assumptions and limitations'
      ],
      outputFormat: 'JSON object with technical analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              performanceEstimates: { type: 'object' },
              weightEstimate: { type: 'string' },
              sizeEstimate: { type: 'string' },
              criticalComponents: { type: 'array', items: { type: 'string' } },
              technicalRisks: { type: 'array', items: { type: 'object' } }
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
  labels: ['mechanical-engineering', 'trade-study', 'technical-analysis']
}));

export const feasibilityAssessmentTask = defineTask('feasibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Feasibility Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Engineering Manager with expertise in project feasibility',
      task: 'Assess feasibility of each concept against constraints',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        technicalAnalysis: args.technicalAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Evaluate technical feasibility (can it be built?)',
        '2. Evaluate economic feasibility (can we afford it?)',
        '3. Evaluate schedule feasibility (can we deliver on time?)',
        '4. Evaluate manufacturing feasibility (do we have capability?)',
        '5. Evaluate regulatory feasibility (can we get approval?)',
        '6. Identify show-stoppers and fatal flaws',
        '7. Assess technology readiness and maturity',
        '8. Evaluate resource availability',
        '9. Identify feasibility gaps and mitigations',
        '10. Provide go/no-go recommendation for each concept'
      ],
      outputFormat: 'JSON object with feasibility assessments'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments'],
      properties: {
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              feasible: { type: 'boolean' },
              technicalFeasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              economicFeasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              scheduleFeasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              showStoppers: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'feasibility']
}));

export const pughMatrixTask = defineTask('pugh-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Pugh Matrix Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Engineer with expertise in concept selection methods',
      task: 'Conduct Pugh matrix analysis for concept comparison',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        criteria: args.criteria,
        technicalAnalysis: args.technicalAnalysis
      },
      instructions: [
        '1. Select datum concept (baseline or reference design)',
        '2. Compare each concept against datum for each criterion',
        '3. Score as better (+), same (S), or worse (-) than datum',
        '4. Calculate net score for each concept',
        '5. Identify strong and weak concepts',
        '6. Analyze patterns in scores across criteria',
        '7. Identify opportunities for concept improvement',
        '8. Consider hybrid concepts combining best features',
        '9. Iterate matrix if concepts can be improved',
        '10. Document rationale for each comparison'
      ],
      outputFormat: 'JSON object with Pugh matrix results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'datum'],
      properties: {
        datum: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              scores: { type: 'object' },
              plusCount: { type: 'number' },
              minusCount: { type: 'number' },
              sameCount: { type: 'number' },
              netScore: { type: 'number' }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'string' } },
        hybridOpportunities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'pugh-matrix']
}));

export const weightedScoringTask = defineTask('weighted-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Weighted Scoring Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Analyst with expertise in multi-criteria decision analysis',
      task: 'Conduct weighted scoring analysis for concept ranking',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        criteria: args.criteria,
        pughResults: args.pughResults
      },
      instructions: [
        '1. Assign numerical scores (1-10 or 1-5) for each concept on each criterion',
        '2. Apply criterion weights to scores',
        '3. Calculate weighted scores for each concept',
        '4. Calculate total weighted score for each concept',
        '5. Rank concepts by total score',
        '6. Identify score gaps between top concepts',
        '7. Analyze score distribution across criteria',
        '8. Identify discriminating criteria',
        '9. Document scoring rationale and evidence',
        '10. Calculate confidence intervals for uncertain scores'
      ],
      outputFormat: 'JSON object with weighted scoring results'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'ranking'],
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              criteriaScores: { type: 'object' },
              weightedScores: { type: 'object' },
              totalScore: { type: 'number' }
            }
          }
        },
        ranking: { type: 'array', items: { type: 'string' } },
        discriminatingCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'weighted-scoring']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Analyst with expertise in sensitivity analysis',
      task: 'Analyze sensitivity of concept ranking to weight and score changes',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        criteria: args.criteria,
        weightedScores: args.weightedScores
      },
      instructions: [
        '1. Vary criterion weights and observe ranking changes',
        '2. Identify weight thresholds where ranking changes',
        '3. Vary scores within uncertainty ranges',
        '4. Identify score thresholds where ranking changes',
        '5. Conduct tornado diagram analysis',
        '6. Identify most influential criteria and scores',
        '7. Assess robustness of top-ranked concept',
        '8. Identify scenarios where alternative concepts win',
        '9. Document sensitivity analysis results',
        '10. Provide confidence level for recommended concept'
      ],
      outputFormat: 'JSON object with sensitivity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            weightSensitivity: { type: 'array', items: { type: 'object' } },
            scoreSensitivity: { type: 'array', items: { type: 'object' } },
            robustness: { type: 'string', enum: ['high', 'medium', 'low'] },
            influentialFactors: { type: 'array', items: { type: 'string' } },
            rankingConfidence: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'sensitivity-analysis']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Engineer with expertise in technical risk assessment',
      task: 'Assess risks associated with each concept',
      context: {
        projectName: args.projectName,
        concepts: args.concepts,
        technicalAnalysis: args.technicalAnalysis,
        weightedScores: args.weightedScores
      },
      instructions: [
        '1. Identify technical risks for each concept',
        '2. Identify schedule risks for each concept',
        '3. Identify cost risks for each concept',
        '4. Assess risk probability and impact',
        '5. Calculate risk scores for each concept',
        '6. Identify risk mitigation strategies',
        '7. Compare risk profiles across concepts',
        '8. Assess risk-adjusted value for each concept',
        '9. Identify showstopper risks',
        '10. Document risk assumptions and uncertainties'
      ],
      outputFormat: 'JSON object with risk assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfile'],
      properties: {
        riskProfile: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              risks: { type: 'array', items: { type: 'object' } },
              overallRiskScore: { type: 'number' },
              riskAdjustedScore: { type: 'number' },
              mitigations: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'risk-assessment']
}));

export const tradeStudyReportTask = defineTask('trade-study-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Trade Study Report Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in trade study documentation',
      task: 'Generate comprehensive trade study report',
      context: {
        projectName: args.projectName,
        designChallenge: args.designChallenge,
        challengeAnalysis: args.challengeAnalysis,
        conceptGeneration: args.conceptGeneration,
        criteriaDefinition: args.criteriaDefinition,
        technicalAnalysis: args.technicalAnalysis,
        feasibilityAssessment: args.feasibilityAssessment,
        pughMatrix: args.pughMatrix,
        weightedScoring: args.weightedScoring,
        sensitivityAnalysis: args.sensitivityAnalysis,
        riskAssessment: args.riskAssessment
      },
      instructions: [
        '1. Write executive summary with recommendation',
        '2. Document design challenge and requirements',
        '3. Present all concepts considered with descriptions',
        '4. Document evaluation criteria and weights',
        '5. Present Pugh matrix and weighted scoring results',
        '6. Present sensitivity analysis findings',
        '7. Present risk assessment results',
        '8. Provide clear recommendation with rationale',
        '9. Document next steps for selected concept',
        '10. Include appendices with detailed analysis'
      ],
      outputFormat: 'JSON object with trade study report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'selectedConcept', 'rankedConcepts', 'markdown'],
      properties: {
        report: { type: 'object' },
        selectedConcept: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            score: { type: 'number' },
            rationale: { type: 'string' }
          }
        },
        rankedConcepts: { type: 'array', items: { type: 'object' } },
        markdown: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'trade-study', 'documentation']
}));
