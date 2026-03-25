/**
 * @process Debiasing and Epistemic Hygiene
 * @description Apply techniques to reduce the impact of cognitive biases and improve reasoning quality through systematic checklists and structured analysis
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ reasoning: object, claims: array, context: object, knownBiases: array }}
 * @outputs {{ debiasedAnalysis: object, biasesIdentified: array, corrections: array, recommendations: array }}
 * @example
 * // Input: { reasoning: { conclusion: "...", premises: [...] }, claims: [...], knownBiases: [...] }
 * // Output: { debiasedAnalysis: {...}, biasesIdentified: [...], corrections: [...], recommendations: [...] }
 * @references Cognitive bias mitigation, Debiasing techniques, Epistemic rationality, Structured analytic techniques
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Reasoning Structure Analysis
  const reasoningAnalysis = await ctx.task(analyzeReasoningStructureTask, {
    reasoning: inputs.reasoning,
    claims: inputs.claims,
    context: inputs.context
  });

  // Phase 2: Bias Vulnerability Assessment
  const vulnerabilityAssessment = await ctx.task(assessBiasVulnerabilityTask, {
    reasoningStructure: reasoningAnalysis.structure,
    knownBiases: inputs.knownBiases,
    contextFactors: inputs.context?.biasRiskFactors
  });

  // Phase 3: Confirmation Bias Check
  const confirmationBiasCheck = await ctx.task(checkConfirmationBiasTask, {
    reasoning: inputs.reasoning,
    evidence: inputs.context?.evidence,
    conclusion: reasoningAnalysis.conclusion,
    disconfirmingEvidence: inputs.context?.disconfirmingEvidence
  });

  // Phase 4: Availability Heuristic Check
  const availabilityCheck = await ctx.task(checkAvailabilityBiasTask, {
    reasoning: inputs.reasoning,
    recentEvents: inputs.context?.recentEvents,
    baseRates: inputs.context?.baseRates
  });

  // Phase 5: Anchoring Bias Check
  const anchoringCheck = await ctx.task(checkAnchoringBiasTask, {
    reasoning: inputs.reasoning,
    initialInformation: inputs.context?.initialInformation,
    adjustments: reasoningAnalysis.adjustments
  });

  // Phase 6: Overconfidence Check
  const overconfidenceCheck = await ctx.task(checkOverconfidenceTask, {
    reasoning: inputs.reasoning,
    confidenceLevels: reasoningAnalysis.confidenceLevels,
    calibrationHistory: inputs.context?.calibrationHistory
  });

  // Phase 7: Motivated Reasoning Check
  const motivatedReasoningCheck = await ctx.task(checkMotivatedReasoningTask, {
    reasoning: inputs.reasoning,
    desiredOutcomes: inputs.context?.desiredOutcomes,
    stakeholderInterests: inputs.context?.stakeholderInterests
  });

  // Phase 8: Group Thinking Check
  const groupThinkCheck = await ctx.task(checkGroupThinkTask, {
    reasoning: inputs.reasoning,
    groupContext: inputs.context?.groupContext,
    dissent: inputs.context?.dissentingViews
  });

  // Consolidate bias findings
  const biasFindings = [
    { type: 'confirmation', findings: confirmationBiasCheck },
    { type: 'availability', findings: availabilityCheck },
    { type: 'anchoring', findings: anchoringCheck },
    { type: 'overconfidence', findings: overconfidenceCheck },
    { type: 'motivated', findings: motivatedReasoningCheck },
    { type: 'groupthink', findings: groupThinkCheck }
  ];

  // Quality Gate: Significant Biases
  const significantBiases = biasFindings.filter(b => b.findings.severity >= 0.6);
  if (significantBiases.length > 0) {
    await ctx.breakpoint('significant-biases-detected', {
      message: 'Significant cognitive biases detected in reasoning',
      biases: significantBiases,
      urgentCorrections: significantBiases.map(b => b.findings.correction)
    });
  }

  // Phase 9: Correction Strategy Development
  const correctionStrategies = await ctx.task(developCorrectionStrategiesTask, {
    biasFindings: biasFindings,
    reasoning: inputs.reasoning,
    constraints: inputs.context?.constraints
  });

  // Phase 10: Debiased Re-analysis
  const debiasedAnalysis = await ctx.task(performDebiasedAnalysisTask, {
    originalReasoning: inputs.reasoning,
    corrections: correctionStrategies.corrections,
    biasFindings: biasFindings
  });

  // Phase 11: Epistemic Hygiene Checklist
  const hygieneChecklist = await ctx.task(runEpistemicHygieneChecklistTask, {
    debiasedAnalysis: debiasedAnalysis,
    biasCorrections: correctionStrategies.corrections,
    context: inputs.context
  });

  // Phase 12: Recommendations Generation
  const recommendations = await ctx.task(generateRecommendationsTask, {
    biasFindings: biasFindings,
    debiasedAnalysis: debiasedAnalysis,
    hygieneChecklist: hygieneChecklist
  });

  return {
    success: true,
    reasoningType: 'Debiasing and Epistemic Hygiene',
    debiasedAnalysis: {
      originalConclusion: reasoningAnalysis.conclusion,
      debiasedConclusion: debiasedAnalysis.conclusion,
      confidenceAdjustment: debiasedAnalysis.confidenceAdjustment,
      keyChanges: debiasedAnalysis.keyChanges,
      reasoning: debiasedAnalysis.reasoning
    },
    biasesIdentified: biasFindings.map(bf => ({
      type: bf.type,
      detected: bf.findings.detected,
      severity: bf.findings.severity,
      evidence: bf.findings.evidence,
      impact: bf.findings.impact
    })),
    biasDetails: {
      confirmationBias: confirmationBiasCheck,
      availabilityBias: availabilityCheck,
      anchoringBias: anchoringCheck,
      overconfidence: overconfidenceCheck,
      motivatedReasoning: motivatedReasoningCheck,
      groupThink: groupThinkCheck
    },
    corrections: correctionStrategies.corrections.map(c => ({
      biasType: c.biasType,
      technique: c.technique,
      application: c.application,
      effectiveness: c.expectedEffectiveness
    })),
    epistemicHygiene: {
      checklistResults: hygieneChecklist.results,
      overallScore: hygieneChecklist.overallScore,
      gaps: hygieneChecklist.gaps
    },
    recommendations: recommendations.recommendations,
    processImprovements: recommendations.processImprovements,
    confidence: debiasedAnalysis.adjustedConfidence
  };
}

export const analyzeReasoningStructureTask = defineTask('debiasing-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Reasoning Structure Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Reasoning analysis specialist',
      task: 'Analyze the structure of the reasoning for bias vulnerability',
      context: args,
      instructions: [
        'Map reasoning structure',
        'Identify premises and conclusions',
        'Note confidence levels',
        'Identify inference steps',
        'Document adjustments made',
        'Assess structural vulnerabilities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'conclusion', 'confidenceLevels'],
      properties: {
        structure: { type: 'object' },
        conclusion: { type: 'object' },
        premises: { type: 'array' },
        confidenceLevels: { type: 'object' },
        inferenceSteps: { type: 'array' },
        adjustments: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'structure-analysis']
}));

export const assessBiasVulnerabilityTask = defineTask('debiasing-vulnerability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Bias Vulnerability Assessment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Bias vulnerability specialist',
      task: 'Assess vulnerability to cognitive biases',
      context: args,
      instructions: [
        'Identify bias risk factors',
        'Assess vulnerability per bias type',
        'Consider context factors',
        'Prioritize bias checks',
        'Map vulnerability patterns',
        'Document assessment rationale'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'prioritizedChecks'],
      properties: {
        vulnerabilities: { type: 'array' },
        prioritizedChecks: { type: 'array' },
        riskFactors: { type: 'array' },
        vulnerabilityPatterns: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'vulnerability-assessment']
}));

export const checkConfirmationBiasTask = defineTask('debiasing-confirmation-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Confirmation Bias Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Confirmation bias detection specialist',
      task: 'Check for confirmation bias in the reasoning',
      context: args,
      instructions: [
        'Check for selective evidence gathering',
        'Assess treatment of disconfirming evidence',
        'Look for asymmetric scrutiny',
        'Check hypothesis testing approach',
        'Assess severity of bias',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'confirmation-bias']
}));

export const checkAvailabilityBiasTask = defineTask('debiasing-availability-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Availability Bias Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Availability bias detection specialist',
      task: 'Check for availability heuristic bias',
      context: args,
      instructions: [
        'Check reliance on easily recalled examples',
        'Compare to base rates',
        'Assess recency effects',
        'Check for salience bias',
        'Assess severity of bias',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        baseRateNeglect: { type: 'boolean' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'availability-bias']
}));

export const checkAnchoringBiasTask = defineTask('debiasing-anchoring-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Anchoring Bias Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Anchoring bias detection specialist',
      task: 'Check for anchoring bias',
      context: args,
      instructions: [
        'Identify potential anchors',
        'Assess adjustment sufficiency',
        'Check for irrelevant anchors',
        'Evaluate independence from anchors',
        'Assess severity of bias',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        identifiedAnchors: { type: 'array' },
        adjustmentInsufficiency: { type: 'number' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'anchoring-bias']
}));

export const checkOverconfidenceTask = defineTask('debiasing-overconfidence-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Overconfidence Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Overconfidence detection specialist',
      task: 'Check for overconfidence bias',
      context: args,
      instructions: [
        'Compare confidence to evidence strength',
        'Check for narrow confidence intervals',
        'Assess calibration history',
        'Look for planning fallacy signs',
        'Assess severity of overconfidence',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        confidenceEvidenceMismatch: { type: 'number' },
        planningFallacy: { type: 'boolean' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'overconfidence']
}));

export const checkMotivatedReasoningTask = defineTask('debiasing-motivated-reasoning-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Motivated Reasoning Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Motivated reasoning detection specialist',
      task: 'Check for motivated reasoning',
      context: args,
      instructions: [
        'Identify desired conclusions',
        'Check for rationalization patterns',
        'Assess stakeholder interest alignment',
        'Look for identity-protective cognition',
        'Assess severity of bias',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        desiredOutcomeAlignment: { type: 'number' },
        rationalizationPatterns: { type: 'array' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'motivated-reasoning']
}));

export const checkGroupThinkTask = defineTask('debiasing-groupthink-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Group Think Check',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Groupthink detection specialist',
      task: 'Check for groupthink bias',
      context: args,
      instructions: [
        'Assess group dynamics influence',
        'Check for suppressed dissent',
        'Look for illusion of unanimity',
        'Check for self-censorship',
        'Assess severity of bias',
        'Recommend corrections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['detected', 'severity', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        severity: { type: 'number' },
        evidence: { type: 'array' },
        groupPressureIndicators: { type: 'array' },
        suppressedDissent: { type: 'boolean' },
        impact: { type: 'string' },
        correction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'groupthink']
}));

export const developCorrectionStrategiesTask = defineTask('debiasing-correction-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Correction Strategy Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Debiasing strategy specialist',
      task: 'Develop strategies to correct identified biases',
      context: args,
      instructions: [
        'Select appropriate debiasing techniques',
        'Tailor corrections to bias types',
        'Prioritize corrections',
        'Assess correction feasibility',
        'Estimate correction effectiveness',
        'Document correction procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['corrections'],
      properties: {
        corrections: { type: 'array' },
        techniques: { type: 'array' },
        priorities: { type: 'array' },
        feasibilityAssessment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'correction-strategies']
}));

export const performDebiasedAnalysisTask = defineTask('debiasing-reanalysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Debiased Re-analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Debiased analysis specialist',
      task: 'Perform debiased re-analysis of the reasoning',
      context: args,
      instructions: [
        'Apply bias corrections',
        'Re-evaluate evidence',
        'Adjust confidence levels',
        'Revise conclusions if needed',
        'Document key changes',
        'Compare to original analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusion', 'adjustedConfidence', 'keyChanges'],
      properties: {
        conclusion: { type: 'object' },
        reasoning: { type: 'object' },
        adjustedConfidence: { type: 'number' },
        confidenceAdjustment: { type: 'number' },
        keyChanges: { type: 'array' },
        comparisonToOriginal: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'reanalysis']
}));

export const runEpistemicHygieneChecklistTask = defineTask('debiasing-hygiene-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Epistemic Hygiene Checklist',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Epistemic hygiene specialist',
      task: 'Run epistemic hygiene checklist',
      context: args,
      instructions: [
        'Run structured checklist',
        'Verify evidence sourcing',
        'Check logical consistency',
        'Verify consideration of alternatives',
        'Assess intellectual humility',
        'Calculate overall hygiene score'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'overallScore', 'gaps'],
      properties: {
        results: { type: 'array' },
        overallScore: { type: 'number' },
        gaps: { type: 'array' },
        checklistItems: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'epistemic-hygiene']
}));

export const generateRecommendationsTask = defineTask('debiasing-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 12: Recommendations',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'bias-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Epistemic improvement specialist',
      task: 'Generate recommendations for improved reasoning',
      context: args,
      instructions: [
        'Summarize key findings',
        'Prioritize recommendations',
        'Suggest process improvements',
        'Recommend training or tools',
        'Provide implementation guidance',
        'Document expected benefits'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'processImprovements'],
      properties: {
        recommendations: { type: 'array' },
        processImprovements: { type: 'array' },
        trainingRecommendations: { type: 'array' },
        toolRecommendations: { type: 'array' },
        expectedBenefits: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debiasing', 'recommendations']
}));
