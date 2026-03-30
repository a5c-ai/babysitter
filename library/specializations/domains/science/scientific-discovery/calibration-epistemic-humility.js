/**
 * @process Calibration and Epistemic Humility
 * @description Match confidence to evidence quality using scoring rules, calibration, and explicit uncertainty modeling
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ claims: array, evidence: array, context: object, calibrationHistory: object }}
 * @outputs {{ calibratedAssessments: array, uncertaintyModel: object, confidenceAdjustments: array, recommendations: array }}
 * @example
 * // Input: { claims: [{ statement: "...", initialConfidence: 0.85 }], evidence: [...], calibrationHistory: {...} }
 * // Output: { calibratedAssessments: [{ claim: "...", calibratedConfidence: 0.72, adjustment: -0.13 }], uncertaintyModel: {...} }
 * @references Brier scoring rules, Calibration training, Superforecasting methodology, Epistemic rationality
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Claim and Confidence Inventory
  const claimInventory = await ctx.task(inventoryClaimsTask, {
    claims: inputs.claims,
    context: inputs.context
  });

  // Phase 2: Evidence Quality Assessment
  const evidenceAssessment = await ctx.task(assessEvidenceQualityTask, {
    evidence: inputs.evidence,
    claims: claimInventory.inventoriedClaims,
    qualityCriteria: inputs.context?.qualityCriteria
  });

  // Phase 3: Prior Calibration Analysis
  const priorCalibration = await ctx.task(analyzePriorCalibrationTask, {
    calibrationHistory: inputs.calibrationHistory,
    domain: inputs.context?.domain,
    claimTypes: claimInventory.claimTypes
  });

  // Phase 4: Confidence Decomposition
  const confidenceDecomposition = await ctx.task(decomposeConfidenceTask, {
    claims: claimInventory.inventoriedClaims,
    evidence: evidenceAssessment.assessedEvidence,
    priorCalibration: priorCalibration
  });

  // Phase 5: Uncertainty Source Identification
  const uncertaintySources = await ctx.task(identifyUncertaintySourcesTask, {
    claims: claimInventory.inventoriedClaims,
    evidence: evidenceAssessment.assessedEvidence,
    decomposition: confidenceDecomposition
  });

  // Phase 6: Bias Detection
  const biasDetection = await ctx.task(detectConfidenceBiasesTask, {
    initialConfidences: claimInventory.inventoriedClaims,
    evidence: evidenceAssessment.assessedEvidence,
    calibrationHistory: priorCalibration,
    uncertaintySources: uncertaintySources
  });

  // Phase 7: Calibration Adjustment
  const calibrationAdjustment = await ctx.task(adjustCalibrationTask, {
    claims: claimInventory.inventoriedClaims,
    evidenceQuality: evidenceAssessment.qualityScores,
    biases: biasDetection.identifiedBiases,
    priorCalibration: priorCalibration,
    uncertaintySources: uncertaintySources
  });

  // Quality Gate: Calibration Reasonableness
  const reasonablenessCheck = await ctx.task(checkReasonablenessTask, {
    originalConfidences: claimInventory.inventoriedClaims,
    adjustedConfidences: calibrationAdjustment.adjustedAssessments,
    adjustmentMagnitudes: calibrationAdjustment.adjustmentMagnitudes
  });

  if (reasonablenessCheck.hasUnreasonableAdjustments) {
    await ctx.breakpoint('calibration-review', {
      message: 'Some calibration adjustments may be unreasonable',
      flaggedAdjustments: reasonablenessCheck.flaggedAdjustments,
      reviewGuidance: reasonablenessCheck.reviewGuidance
    });
  }

  // Phase 8: Uncertainty Model Construction
  const uncertaintyModel = await ctx.task(constructUncertaintyModelTask, {
    calibratedAssessments: calibrationAdjustment.adjustedAssessments,
    uncertaintySources: uncertaintySources.identifiedSources,
    evidenceQuality: evidenceAssessment.qualityScores
  });

  // Phase 9: Epistemic Status Documentation
  const epistemicStatus = await ctx.task(documentEpistemicStatusTask, {
    calibratedAssessments: calibrationAdjustment.adjustedAssessments,
    uncertaintyModel: uncertaintyModel,
    biases: biasDetection.identifiedBiases,
    evidenceGaps: evidenceAssessment.gaps
  });

  // Phase 10: Improvement Recommendations
  const improvements = await ctx.task(recommendImprovementsTask, {
    calibrationResults: calibrationAdjustment,
    biases: biasDetection.identifiedBiases,
    uncertaintySources: uncertaintySources.identifiedSources,
    priorCalibration: priorCalibration
  });

  return {
    success: true,
    reasoningType: 'Calibration and Epistemic Humility',
    calibratedAssessments: calibrationAdjustment.adjustedAssessments.map((assessment, i) => ({
      claim: claimInventory.inventoriedClaims[i]?.statement,
      originalConfidence: claimInventory.inventoriedClaims[i]?.initialConfidence,
      calibratedConfidence: assessment.calibratedConfidence,
      adjustment: assessment.adjustment,
      rationale: assessment.rationale
    })),
    uncertaintyModel: {
      sources: uncertaintySources.identifiedSources,
      distribution: uncertaintyModel.uncertaintyDistribution,
      propagation: uncertaintyModel.propagationAnalysis,
      reducibleUncertainty: uncertaintyModel.reducibleUncertainty
    },
    biasAnalysis: {
      identifiedBiases: biasDetection.identifiedBiases,
      biasCorrections: biasDetection.corrections,
      residualBiasRisk: biasDetection.residualRisk
    },
    evidenceQuality: {
      overall: evidenceAssessment.overallQuality,
      perClaim: evidenceAssessment.qualityScores,
      gaps: evidenceAssessment.gaps
    },
    epistemicStatus: epistemicStatus.statusSummary,
    confidenceAdjustments: calibrationAdjustment.adjustmentMagnitudes,
    recommendations: improvements.recommendations,
    confidence: reasonablenessCheck.overallReasonableness
  };
}

export const inventoryClaimsTask = defineTask('calibration-claim-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Claim Inventory',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Epistemic assessment specialist',
      task: 'Inventory claims and their initial confidence levels',
      context: args,
      instructions: [
        'Catalog all claims requiring calibration',
        'Record initial confidence levels',
        'Classify claim types',
        'Identify claim dependencies',
        'Note claim specificity',
        'Document confidence sources'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['inventoriedClaims', 'claimTypes'],
      properties: {
        inventoriedClaims: { type: 'array' },
        claimTypes: { type: 'object' },
        claimDependencies: { type: 'array' },
        confidenceSources: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'claim-inventory']
}));

export const assessEvidenceQualityTask = defineTask('calibration-evidence-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Evidence Quality Assessment',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Evidence quality assessment specialist',
      task: 'Assess quality and relevance of evidence for each claim',
      context: args,
      instructions: [
        'Evaluate evidence strength',
        'Assess evidence relevance to claims',
        'Check evidence independence',
        'Identify evidence quality limitations',
        'Score evidence per claim',
        'Identify evidence gaps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedEvidence', 'qualityScores', 'overallQuality'],
      properties: {
        assessedEvidence: { type: 'array' },
        qualityScores: { type: 'object' },
        overallQuality: { type: 'number' },
        gaps: { type: 'array' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'evidence-quality']
}));

export const analyzePriorCalibrationTask = defineTask('calibration-prior-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Prior Calibration Analysis',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Calibration history analyst',
      task: 'Analyze historical calibration performance',
      context: args,
      instructions: [
        'Analyze past calibration accuracy',
        'Identify systematic biases',
        'Assess domain-specific calibration',
        'Calculate calibration metrics',
        'Identify improvement trends',
        'Note calibration patterns'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationMetrics', 'systematicBiases'],
      properties: {
        calibrationMetrics: { type: 'object' },
        brierScore: { type: 'number' },
        systematicBiases: { type: 'array' },
        domainPerformance: { type: 'object' },
        improvementTrends: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'prior-analysis']
}));

export const decomposeConfidenceTask = defineTask('calibration-confidence-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Confidence Decomposition',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Confidence analysis specialist',
      task: 'Decompose confidence into component factors',
      context: args,
      instructions: [
        'Identify confidence components',
        'Separate evidential from non-evidential confidence',
        'Assess base rate contribution',
        'Evaluate model confidence component',
        'Identify emotional or motivated reasoning',
        'Document decomposition'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['decomposedConfidences'],
      properties: {
        decomposedConfidences: { type: 'array' },
        evidentialComponents: { type: 'object' },
        baseRateComponents: { type: 'object' },
        modelComponents: { type: 'object' },
        motivatedComponents: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'confidence-decomposition']
}));

export const identifyUncertaintySourcesTask = defineTask('calibration-uncertainty-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Uncertainty Source Identification',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Uncertainty analysis specialist',
      task: 'Identify and classify sources of uncertainty',
      context: args,
      instructions: [
        'Identify aleatoric uncertainty',
        'Identify epistemic uncertainty',
        'Classify model uncertainty',
        'Identify measurement uncertainty',
        'Assess reducibility of uncertainty',
        'Quantify uncertainty contributions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedSources', 'uncertaintyTypes'],
      properties: {
        identifiedSources: { type: 'array' },
        uncertaintyTypes: { type: 'object' },
        aleatoricUncertainty: { type: 'array' },
        epistemicUncertainty: { type: 'array' },
        reducibility: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'uncertainty-sources']
}));

export const detectConfidenceBiasesTask = defineTask('calibration-bias-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Bias Detection',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Cognitive bias detection specialist',
      task: 'Detect biases affecting confidence judgments',
      context: args,
      instructions: [
        'Detect overconfidence patterns',
        'Identify confirmation bias indicators',
        'Check for anchoring effects',
        'Assess availability bias',
        'Identify motivated reasoning',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedBiases', 'corrections'],
      properties: {
        identifiedBiases: { type: 'array' },
        overconfidenceIndicators: { type: 'array' },
        confirmationBiasIndicators: { type: 'array' },
        corrections: { type: 'array' },
        residualRisk: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'bias-detection']
}));

export const adjustCalibrationTask = defineTask('calibration-adjustment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Calibration Adjustment',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Confidence calibration specialist',
      task: 'Adjust confidence levels based on analysis',
      context: args,
      instructions: [
        'Calculate calibrated confidence for each claim',
        'Apply bias corrections',
        'Adjust for evidence quality',
        'Incorporate prior calibration data',
        'Document adjustment rationale',
        'Track adjustment magnitudes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['adjustedAssessments', 'adjustmentMagnitudes'],
      properties: {
        adjustedAssessments: { type: 'array' },
        adjustmentMagnitudes: { type: 'array' },
        adjustmentRationales: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'adjustment']
}));

export const checkReasonablenessTask = defineTask('calibration-reasonableness-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Reasonableness Check',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Calibration reasonableness specialist',
      task: 'Check if calibration adjustments are reasonable',
      context: args,
      instructions: [
        'Assess if adjustments are proportionate',
        'Flag extreme adjustments',
        'Check for logical consistency',
        'Verify adjustment direction',
        'Provide review guidance',
        'Calculate overall reasonableness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hasUnreasonableAdjustments', 'overallReasonableness'],
      properties: {
        hasUnreasonableAdjustments: { type: 'boolean' },
        flaggedAdjustments: { type: 'array' },
        reviewGuidance: { type: 'array' },
        overallReasonableness: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'reasonableness']
}));

export const constructUncertaintyModelTask = defineTask('calibration-uncertainty-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Uncertainty Model Construction',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Uncertainty modeling specialist',
      task: 'Construct explicit uncertainty model',
      context: args,
      instructions: [
        'Model uncertainty distribution',
        'Analyze uncertainty propagation',
        'Identify reducible uncertainty',
        'Quantify uncertainty bounds',
        'Model uncertainty interactions',
        'Document model assumptions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertaintyDistribution', 'reducibleUncertainty'],
      properties: {
        uncertaintyDistribution: { type: 'object' },
        propagationAnalysis: { type: 'object' },
        reducibleUncertainty: { type: 'array' },
        uncertaintyBounds: { type: 'object' },
        modelAssumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'uncertainty-model']
}));

export const documentEpistemicStatusTask = defineTask('calibration-epistemic-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Epistemic Status Documentation',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Epistemic status documentation specialist',
      task: 'Document overall epistemic status of assessments',
      context: args,
      instructions: [
        'Summarize epistemic status per claim',
        'Document known unknowns',
        'Identify unknown unknowns risk',
        'Assess overall epistemic position',
        'Document limitations',
        'Provide epistemic guidance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['statusSummary'],
      properties: {
        statusSummary: { type: 'object' },
        knownUnknowns: { type: 'array' },
        unknownUnknownsRisk: { type: 'number' },
        overallPosition: { type: 'string' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'epistemic-status']
}));

export const recommendImprovementsTask = defineTask('calibration-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Improvement Recommendations',
  agent: {
    name: 'calibration-specialist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Calibration improvement specialist',
      task: 'Recommend improvements for future calibration',
      context: args,
      instructions: [
        'Identify calibration improvement opportunities',
        'Recommend bias mitigation strategies',
        'Suggest evidence gathering priorities',
        'Propose calibration training',
        'Recommend process improvements',
        'Prioritize recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: { type: 'array' },
        biasMitigation: { type: 'array' },
        evidencePriorities: { type: 'array' },
        trainingRecommendations: { type: 'array' },
        processImprovements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['calibration', 'improvements']
}));
