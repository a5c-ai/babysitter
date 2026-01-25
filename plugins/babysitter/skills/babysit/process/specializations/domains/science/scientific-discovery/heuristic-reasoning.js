/**
 * @process Heuristic Reasoning
 * @description Use simple rules that often work; fast but accept bias for speed. Fast-and-frugal heuristics
 * @category Scientific Discovery - Practical Reasoning
 * @inputs {{ context: object, problem: string, constraints: object, availableHeuristics: array }}
 * @outputs {{ analysis: object, heuristicSelection: object, applicationResults: object, recommendations: array }}
 * @example
 * // Input: Problem with time pressure requiring fast decisions
 * // Output: Heuristic-based solution with speed/accuracy trade-off analysis
 * @references
 * - Gigerenzer, G. et al. (1999). Simple Heuristics That Make Us Smart
 * - Kahneman, D. (2011). Thinking, Fast and Slow
 * - Todd, P.M. & Gigerenzer, G. (2012). Ecological Rationality
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Phase 1: Environment and Constraint Analysis
const analyzeEnvironmentTask = defineTask('heuristic-analyze-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Environment and Constraint Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Ecological rationality and decision environment specialist',
      task: 'Analyze the decision environment to determine heuristic applicability',
      context: args,
      instructions: [
        'Characterize the decision environment structure',
        'Assess time and resource constraints',
        'Evaluate information availability and quality',
        'Identify environmental regularities and patterns',
        'Assess predictability vs uncertainty levels',
        'Determine stakes and error costs',
        'Evaluate cognitive load and decision frequency',
        'Identify ecological validity conditions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        environmentCharacteristics: {
          type: 'object',
          properties: {
            informationStructure: { type: 'object' },
            uncertaintyLevel: { type: 'string' },
            timePressure: { type: 'string' },
            stakeLevel: { type: 'string' }
          }
        },
        constraintProfile: {
          type: 'object',
          properties: {
            timeConstraints: { type: 'object' },
            cognitiveConstraints: { type: 'object' },
            informationConstraints: { type: 'object' }
          }
        },
        ecologicalFeatures: {
          type: 'object',
          properties: {
            regularities: { type: 'array' },
            cueValidities: { type: 'object' },
            correlationStructure: { type: 'object' }
          }
        },
        heuristicFitAssessment: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['environmentCharacteristics', 'constraintProfile', 'ecologicalFeatures']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 2: Heuristic Repertoire Identification
const identifyHeuristicRepertoireTask = defineTask('heuristic-identify-repertoire', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Repertoire Identification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Heuristic taxonomy and selection specialist',
      task: 'Identify applicable heuristics from the adaptive toolbox',
      context: args,
      instructions: [
        'Catalog relevant fast-and-frugal heuristics',
        'Identify recognition-based heuristics (recognition heuristic)',
        'Identify one-reason heuristics (take-the-best)',
        'Identify trade-off heuristics (tallying, equal weighting)',
        'Identify social heuristics (imitation, majority rule)',
        'Identify satisficing and elimination heuristics',
        'Match heuristics to environmental structure',
        'Assess domain expertise for recognition-based heuristics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        recognitionHeuristics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        oneReasonHeuristics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              cueUsed: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        tradeoffHeuristics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              mechanism: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        socialHeuristics: { type: 'array' },
        eliminationHeuristics: { type: 'array' },
        matchAssessment: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['recognitionHeuristics', 'oneReasonHeuristics', 'tradeoffHeuristics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 3: Ecological Rationality Assessment
const assessEcologicalRationalityTask = defineTask('heuristic-ecological-rationality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ecological Rationality Assessment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Ecological rationality and environment-heuristic fit specialist',
      task: 'Assess the match between heuristics and environmental structure',
      context: args,
      instructions: [
        'Evaluate cue validity structure for take-the-best applicability',
        'Assess recognition validity for recognition heuristic',
        'Evaluate redundancy for equal weighting applicability',
        'Determine when simple outperforms complex',
        'Identify bias-variance trade-off implications',
        'Assess less-is-more effects',
        'Evaluate robustness to noise and missing data',
        'Compare heuristic to optimal model performance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        environmentHeuristicFit: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heuristic: { type: 'string' },
              fitScore: { type: 'number' },
              fitConditions: { type: 'array' },
              violationRisks: { type: 'array' }
            }
          }
        },
        biasVarianceAnalysis: {
          type: 'object',
          properties: {
            biasRisk: { type: 'object' },
            varianceReduction: { type: 'object' },
            netExpectedError: { type: 'object' }
          }
        },
        lessIsMoreAssessment: {
          type: 'object',
          properties: {
            applicable: { type: 'boolean' },
            conditions: { type: 'array' },
            expectedBenefit: { type: 'string' }
          }
        },
        optimalComparison: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['environmentHeuristicFit', 'biasVarianceAnalysis', 'lessIsMoreAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 4: Heuristic Selection
const selectHeuristicTask = defineTask('heuristic-select', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Selection',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Heuristic selection and adaptation specialist',
      task: 'Select the most appropriate heuristic(s) for the decision context',
      context: args,
      instructions: [
        'Rank heuristics by ecological fit',
        'Consider cognitive cost of implementation',
        'Evaluate track record in similar domains',
        'Assess transparency and explainability needs',
        'Consider combination or sequencing of heuristics',
        'Evaluate robustness requirements',
        'Select primary and backup heuristics',
        'Define application conditions and boundaries'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        heuristicRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              heuristic: { type: 'string' },
              overallScore: { type: 'number' },
              strengths: { type: 'array' },
              weaknesses: { type: 'array' }
            }
          }
        },
        selectedHeuristic: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            backup: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        applicationBoundaries: {
          type: 'object',
          properties: {
            validConditions: { type: 'array' },
            invalidConditions: { type: 'array' },
            warningSignals: { type: 'array' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['heuristicRanking', 'selectedHeuristic', 'applicationBoundaries']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 5: Heuristic Application
const applyHeuristicTask = defineTask('heuristic-apply', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Application',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Heuristic implementation and execution specialist',
      task: 'Apply the selected heuristic to the problem',
      context: args,
      instructions: [
        'Implement the selected heuristic step by step',
        'Document the search, stopping, and decision rules',
        'Apply cue-based reasoning if applicable',
        'Execute elimination or tallying procedures',
        'Record the decision process transparently',
        'Note any boundary conditions encountered',
        'Measure processing time and effort',
        'Document the final decision output'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        applicationProcess: {
          type: 'object',
          properties: {
            searchRule: { type: 'string' },
            stoppingRule: { type: 'string' },
            decisionRule: { type: 'string' },
            stepsExecuted: { type: 'array' }
          }
        },
        processingMetrics: {
          type: 'object',
          properties: {
            cuesExamined: { type: 'number' },
            alternativesConsidered: { type: 'number' },
            processingTime: { type: 'string' },
            cognitiveEffort: { type: 'string' }
          }
        },
        decisionOutput: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            supportingCues: { type: 'array' },
            confidenceLevel: { type: 'string' }
          }
        },
        boundaryFlags: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['applicationProcess', 'processingMetrics', 'decisionOutput']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 6: Bias and Error Analysis
const analyzeBiasErrorTask = defineTask('heuristic-bias-error', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bias and Error Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Cognitive bias and heuristic error specialist',
      task: 'Analyze potential biases and errors from heuristic use',
      context: args,
      instructions: [
        'Identify systematic biases introduced by the heuristic',
        'Assess when the heuristic would fail',
        'Evaluate adversarial exploitation vulnerabilities',
        'Document known failure modes',
        'Estimate error rates in this context',
        'Assess whether biases are acceptable given constraints',
        'Identify debiasing opportunities',
        'Evaluate meta-cognitive awareness needs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        identifiedBiases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              biasName: { type: 'string' },
              mechanism: { type: 'string' },
              severity: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        failureAnalysis: {
          type: 'object',
          properties: {
            failureModes: { type: 'array' },
            worstCaseScenarios: { type: 'array' },
            adversarialVulnerabilities: { type: 'array' }
          }
        },
        errorEstimates: {
          type: 'object',
          properties: {
            expectedErrorRate: { type: 'number' },
            errorDistribution: { type: 'object' },
            costOfErrors: { type: 'object' }
          }
        },
        mitigationOptions: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['identifiedBiases', 'failureAnalysis', 'errorEstimates']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 7: Speed-Accuracy Trade-off Analysis
const analyzeSpeedAccuracyTask = defineTask('heuristic-speed-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Speed-Accuracy Trade-off Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Speed-accuracy trade-off and decision efficiency specialist',
      task: 'Analyze the speed-accuracy trade-off of the heuristic approach',
      context: args,
      instructions: [
        'Quantify time savings from heuristic use',
        'Estimate accuracy loss compared to optimal',
        'Calculate net value given constraints',
        'Assess when heuristic actually outperforms optimization',
        'Evaluate effort-accuracy function',
        'Determine optimal stopping point',
        'Compare to competing strategies',
        'Recommend appropriate trade-off position'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        speedAnalysis: {
          type: 'object',
          properties: {
            heuristicTime: { type: 'string' },
            optimalTime: { type: 'string' },
            timeSavings: { type: 'string' },
            decisionsPerUnit: { type: 'number' }
          }
        },
        accuracyAnalysis: {
          type: 'object',
          properties: {
            heuristicAccuracy: { type: 'number' },
            optimalAccuracy: { type: 'number' },
            accuracyGap: { type: 'number' },
            gapJustification: { type: 'string' }
          }
        },
        netValueAnalysis: {
          type: 'object',
          properties: {
            heuristicNetValue: { type: 'number' },
            optimalNetValue: { type: 'number' },
            recommendation: { type: 'string' }
          }
        },
        effortAccuracyCurve: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['speedAnalysis', 'accuracyAnalysis', 'netValueAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 8: Calibration and Learning
const calibrateHeuristicTask = defineTask('heuristic-calibrate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Calibration and Learning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Heuristic calibration and adaptive learning specialist',
      task: 'Calibrate the heuristic based on feedback and design learning mechanisms',
      context: args,
      instructions: [
        'Assess current calibration of heuristic parameters',
        'Identify opportunities for parameter tuning',
        'Design feedback loops for continuous improvement',
        'Establish performance tracking metrics',
        'Define conditions for heuristic switching',
        'Plan for changing environments',
        'Design meta-learning mechanisms',
        'Document calibration recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        calibrationAssessment: {
          type: 'object',
          properties: {
            currentCalibration: { type: 'object' },
            misalignments: { type: 'array' },
            tuningOpportunities: { type: 'array' }
          }
        },
        learningDesign: {
          type: 'object',
          properties: {
            feedbackMechanisms: { type: 'array' },
            performanceMetrics: { type: 'array' },
            adaptationRules: { type: 'array' }
          }
        },
        switchingPolicy: {
          type: 'object',
          properties: {
            switchConditions: { type: 'array' },
            alternativeHeuristics: { type: 'array' },
            evaluationSchedule: { type: 'string' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['calibrationAssessment', 'learningDesign', 'switchingPolicy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 9: Synthesis and Recommendations
const synthesizeResultsTask = defineTask('heuristic-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Reasoning Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'heuristic-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Heuristic reasoning synthesis specialist',
      task: 'Synthesize all heuristic reasoning results into comprehensive conclusions',
      context: args,
      instructions: [
        'Summarize the heuristic approach and decision',
        'Highlight key trade-offs accepted',
        'Document ecological rationality conclusions',
        'Assess appropriateness of heuristic choice',
        'Provide actionable recommendations',
        'Identify conditions for heuristic revision',
        'Document lessons for future decisions',
        'Recommend when to switch to more deliberate analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        heuristicSummary: {
          type: 'object',
          properties: {
            selectedHeuristic: { type: 'string' },
            decision: { type: 'string' },
            processingEfficiency: { type: 'string' },
            acceptedTradeoffs: { type: 'array' }
          }
        },
        ecologicalConclusions: {
          type: 'object',
          properties: {
            environmentFit: { type: 'string' },
            rationalityAssessment: { type: 'string' },
            sustainabilityOutlook: { type: 'string' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        lessonsLearned: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['heuristicSummary', 'ecologicalConclusions', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

/**
 * Main heuristic reasoning process
 */
export async function process(inputs, ctx) {
  // Phase 1: Analyze environment
  const environmentAnalysis = await ctx.task(analyzeEnvironmentTask, {
    problem: inputs.problem,
    context: inputs.context,
    constraints: inputs.constraints
  });

  // Phase 2: Identify heuristic repertoire
  const heuristicRepertoire = await ctx.task(identifyHeuristicRepertoireTask, {
    problem: inputs.problem,
    environmentAnalysis,
    availableHeuristics: inputs.availableHeuristics
  });

  // Phase 3: Assess ecological rationality
  const ecologicalAssessment = await ctx.task(assessEcologicalRationalityTask, {
    environmentAnalysis,
    heuristicRepertoire
  });

  // Quality gate: Heuristic fit review
  await ctx.breakpoint('heuristic-fit-review', {
    question: 'Is the heuristic repertoire appropriate for this decision environment?',
    context: { environmentAnalysis, heuristicRepertoire, ecologicalAssessment }
  });

  // Phase 4: Select heuristic
  const heuristicSelection = await ctx.task(selectHeuristicTask, {
    heuristicRepertoire,
    ecologicalAssessment,
    constraints: inputs.constraints
  });

  // Phase 5: Apply heuristic
  const applicationResults = await ctx.task(applyHeuristicTask, {
    problem: inputs.problem,
    heuristicSelection,
    context: inputs.context
  });

  // Phase 6: Analyze bias and error
  const biasErrorAnalysis = await ctx.task(analyzeBiasErrorTask, {
    heuristicSelection,
    applicationResults,
    environmentAnalysis
  });

  // Phase 7: Analyze speed-accuracy trade-off
  const speedAccuracyAnalysis = await ctx.task(analyzeSpeedAccuracyTask, {
    applicationResults,
    biasErrorAnalysis,
    constraints: inputs.constraints
  });

  // Quality gate: Trade-off acceptance
  await ctx.breakpoint('tradeoff-review', {
    question: 'Are the speed-accuracy trade-offs acceptable for this decision?',
    context: { speedAccuracyAnalysis, biasErrorAnalysis, applicationResults }
  });

  // Phase 8: Calibrate and design learning
  const calibrationPlan = await ctx.task(calibrateHeuristicTask, {
    heuristicSelection,
    applicationResults,
    biasErrorAnalysis
  });

  // Phase 9: Synthesize results
  const synthesis = await ctx.task(synthesizeResultsTask, {
    environmentAnalysis,
    heuristicSelection,
    applicationResults,
    biasErrorAnalysis,
    speedAccuracyAnalysis,
    calibrationPlan
  });

  return {
    success: true,
    reasoningType: 'Heuristic Reasoning',
    analysis: {
      environmentAnalysis,
      heuristicRepertoire,
      ecologicalAssessment,
      biasErrorAnalysis,
      speedAccuracyAnalysis
    },
    heuristicSelection: heuristicSelection.selectedHeuristic,
    applicationResults: {
      decision: applicationResults.decisionOutput,
      processingMetrics: applicationResults.processingMetrics,
      calibrationPlan
    },
    conclusions: [
      `Selected heuristic: ${heuristicSelection.selectedHeuristic.primary}`,
      `Decision: ${applicationResults.decisionOutput.decision}`,
      `Processing time: ${applicationResults.processingMetrics.processingTime}`,
      `Ecological fit: ${synthesis.ecologicalConclusions.environmentFit}`
    ],
    recommendations: synthesis.recommendations,
    confidence: synthesis.confidence
  };
}
