/**
 * @process Historical-Investigative Reasoning
 * @description Reconstruct past events or hidden states from incomplete evidence using source criticism and inference to best explanation
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ investigativeQuestion: string, evidence: array, context: object, constraints: object }}
 * @outputs {{ reconstruction: object, evidenceAnalysis: object, alternativeHypotheses: array, conclusions: object }}
 * @example
 * // Input: { investigativeQuestion: "What caused this system failure?", evidence: [...], context: {...} }
 * // Output: { reconstruction: { timeline: [...], causalChain: {...} }, evidenceAnalysis: {...}, conclusions: {...} }
 * @references Historical method, Source criticism, Inference to best explanation, Forensic analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Question Formulation
  const questionAnalysis = await ctx.task(analyzeInvestigativeQuestionTask, {
    question: inputs.investigativeQuestion,
    context: inputs.context,
    scope: inputs.constraints?.scope
  });

  // Phase 2: Evidence Inventory
  const evidenceInventory = await ctx.task(inventoryEvidenceTask, {
    evidence: inputs.evidence,
    question: questionAnalysis.clarifiedQuestion,
    evidenceTypes: inputs.context?.evidenceTypes
  });

  // Phase 3: Source Criticism
  const sourceCriticism = await ctx.task(criticizeSourcesTask, {
    evidence: evidenceInventory.catalogedEvidence,
    authenticityTests: inputs.context?.authenticityTests,
    biasFactors: inputs.context?.knownBiases
  });

  // Phase 4: Evidence Corroboration
  const corroboration = await ctx.task(corroborateEvidenceTask, {
    evidence: sourceCriticism.assessedEvidence,
    question: questionAnalysis.clarifiedQuestion,
    corroborationCriteria: inputs.context?.corroborationStandards
  });

  // Phase 5: Hypothesis Generation
  const hypotheses = await ctx.task(generateHypothesesTask, {
    evidence: corroboration.corroboratedEvidence,
    question: questionAnalysis.clarifiedQuestion,
    contextualFactors: inputs.context,
    priorKnowledge: inputs.context?.background
  });

  // Phase 6: Timeline Reconstruction
  const timeline = await ctx.task(reconstructTimelineTask, {
    evidence: corroboration.corroboratedEvidence,
    hypotheses: hypotheses.generatedHypotheses,
    temporalConstraints: inputs.constraints?.temporal
  });

  // Quality Gate: Timeline Consistency
  if (timeline.consistencyScore < 0.6) {
    await ctx.breakpoint('timeline-inconsistency', {
      message: 'Timeline reconstruction has significant inconsistencies',
      inconsistencies: timeline.inconsistencies,
      possibleResolutions: timeline.resolutionOptions
    });
  }

  // Phase 7: Causal Reconstruction
  const causalReconstruction = await ctx.task(reconstructCausalChainTask, {
    timeline: timeline.reconstructedTimeline,
    hypotheses: hypotheses.generatedHypotheses,
    evidence: corroboration.corroboratedEvidence,
    causalMechanisms: inputs.context?.knownMechanisms
  });

  // Phase 8: Hypothesis Evaluation
  const hypothesisEvaluation = await ctx.task(evaluateHypothesesTask, {
    hypotheses: hypotheses.generatedHypotheses,
    evidence: corroboration.corroboratedEvidence,
    causalReconstruction: causalReconstruction,
    evaluationCriteria: inputs.context?.evaluationCriteria
  });

  // Phase 9: Alternative Explanation Analysis
  const alternativeAnalysis = await ctx.task(analyzeAlternativesTask, {
    bestHypothesis: hypothesisEvaluation.bestHypothesis,
    alternatives: hypothesisEvaluation.rankedHypotheses,
    evidence: corroboration.corroboratedEvidence,
    gaps: evidenceInventory.evidenceGaps
  });

  // Phase 10: Conclusion Synthesis
  const conclusions = await ctx.task(synthesizeConclusionsTask, {
    bestHypothesis: hypothesisEvaluation.bestHypothesis,
    reconstruction: causalReconstruction,
    evidenceStrength: corroboration.overallStrength,
    alternatives: alternativeAnalysis,
    uncertainties: sourceCriticism.uncertainties
  });

  return {
    success: true,
    reasoningType: 'Historical-Investigative Reasoning',
    reconstruction: {
      timeline: timeline.reconstructedTimeline,
      causalChain: causalReconstruction.causalChain,
      keyEvents: causalReconstruction.keyEvents,
      mechanisms: causalReconstruction.identifiedMechanisms
    },
    evidenceAnalysis: {
      inventory: evidenceInventory.catalogedEvidence,
      sourceCriticism: sourceCriticism.assessedEvidence,
      corroboration: corroboration.corroborationMatrix,
      gaps: evidenceInventory.evidenceGaps,
      reliability: sourceCriticism.reliabilityAssessments
    },
    hypotheses: {
      best: hypothesisEvaluation.bestHypothesis,
      alternatives: hypothesisEvaluation.rankedHypotheses,
      evaluation: hypothesisEvaluation.evaluationMatrix
    },
    alternativeHypotheses: alternativeAnalysis.viableAlternatives,
    conclusions: {
      primary: conclusions.primaryConclusion,
      confidence: conclusions.confidenceLevel,
      caveats: conclusions.caveats,
      furterInvestigation: conclusions.recommendedInvestigation
    },
    confidence: conclusions.confidenceLevel
  };
}

export const analyzeInvestigativeQuestionTask = defineTask('historical-question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Question Formulation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Historical investigation specialist',
      task: 'Clarify and structure the investigative question',
      context: args,
      instructions: [
        'Clarify what needs to be determined',
        'Identify temporal scope',
        'Define evidentiary requirements',
        'Establish investigation boundaries',
        'Identify key unknowns',
        'Formulate subsidiary questions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedQuestion', 'scope', 'keyUnknowns'],
      properties: {
        clarifiedQuestion: { type: 'string' },
        scope: { type: 'object' },
        keyUnknowns: { type: 'array' },
        subsidiaryQuestions: { type: 'array' },
        evidentaryRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'question-formulation']
}));

export const inventoryEvidenceTask = defineTask('historical-evidence-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Evidence Inventory',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Evidence cataloging specialist',
      task: 'Systematically catalog and categorize available evidence',
      context: args,
      instructions: [
        'Catalog all available evidence',
        'Classify by type (documentary, physical, testimonial)',
        'Identify primary vs secondary sources',
        'Note provenance of each item',
        'Identify evidence gaps',
        'Assess evidence accessibility'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['catalogedEvidence', 'evidenceGaps'],
      properties: {
        catalogedEvidence: { type: 'array' },
        primarySources: { type: 'array' },
        secondarySources: { type: 'array' },
        evidenceTypes: { type: 'object' },
        evidenceGaps: { type: 'array' },
        provenanceNotes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'evidence-inventory']
}));

export const criticizeSourcesTask = defineTask('historical-source-criticism', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Source Criticism',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Historical source criticism specialist',
      task: 'Apply rigorous source criticism to assess evidence reliability',
      context: args,
      instructions: [
        'Assess external criticism (authenticity)',
        'Assess internal criticism (credibility)',
        'Identify potential biases',
        'Evaluate source independence',
        'Check for anachronisms',
        'Rate reliability of each source'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedEvidence', 'reliabilityAssessments'],
      properties: {
        assessedEvidence: { type: 'array' },
        reliabilityAssessments: { type: 'array' },
        authenticityAnalysis: { type: 'array' },
        biasAnalysis: { type: 'array' },
        uncertainties: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'source-criticism']
}));

export const corroborateEvidenceTask = defineTask('historical-corroboration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Evidence Corroboration',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Evidence corroboration specialist',
      task: 'Assess corroboration between independent evidence sources',
      context: args,
      instructions: [
        'Identify corroborating evidence pairs',
        'Assess independence of sources',
        'Evaluate corroboration strength',
        'Note contradictions',
        'Weight combined evidence',
        'Build corroboration matrix'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['corroboratedEvidence', 'corroborationMatrix', 'overallStrength'],
      properties: {
        corroboratedEvidence: { type: 'array' },
        corroborationMatrix: { type: 'object' },
        contradictions: { type: 'array' },
        overallStrength: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'corroboration']
}));

export const generateHypothesesTask = defineTask('historical-hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Hypothesis Generation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Historical hypothesis generation specialist',
      task: 'Generate plausible hypotheses explaining the evidence',
      context: args,
      instructions: [
        'Generate multiple hypotheses',
        'Ensure hypotheses explain key evidence',
        'Consider alternative explanations',
        'Apply inference to best explanation',
        'Include unconventional hypotheses',
        'Document hypothesis rationale'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['generatedHypotheses'],
      properties: {
        generatedHypotheses: { type: 'array' },
        hypothesisRationales: { type: 'array' },
        evidenceCoverage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'hypothesis-generation']
}));

export const reconstructTimelineTask = defineTask('historical-timeline-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Timeline Reconstruction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Chronological reconstruction specialist',
      task: 'Reconstruct timeline of events from evidence',
      context: args,
      instructions: [
        'Order events chronologically',
        'Identify temporal constraints',
        'Note timing uncertainties',
        'Check for temporal consistency',
        'Identify gaps in timeline',
        'Document confidence for each event'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reconstructedTimeline', 'consistencyScore'],
      properties: {
        reconstructedTimeline: { type: 'array' },
        temporalConstraints: { type: 'array' },
        inconsistencies: { type: 'array' },
        timelineGaps: { type: 'array' },
        consistencyScore: { type: 'number' },
        resolutionOptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'timeline-reconstruction']
}));

export const reconstructCausalChainTask = defineTask('historical-causal-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Causal Reconstruction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Causal chain reconstruction specialist',
      task: 'Reconstruct causal chains explaining how events unfolded',
      context: args,
      instructions: [
        'Identify causal links between events',
        'Determine key causal mechanisms',
        'Assess counterfactual dependencies',
        'Identify proximate and distal causes',
        'Map causal chains',
        'Note uncertain causal links'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['causalChain', 'keyEvents', 'identifiedMechanisms'],
      properties: {
        causalChain: { type: 'object' },
        keyEvents: { type: 'array' },
        identifiedMechanisms: { type: 'array' },
        proximalCauses: { type: 'array' },
        distalCauses: { type: 'array' },
        uncertainLinks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'causal-reconstruction']
}));

export const evaluateHypothesesTask = defineTask('historical-hypothesis-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Hypothesis Evaluation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Historical hypothesis evaluation specialist',
      task: 'Evaluate hypotheses against evidence and criteria',
      context: args,
      instructions: [
        'Evaluate explanatory power of each hypothesis',
        'Assess fit with evidence',
        'Consider simplicity/parsimony',
        'Evaluate consistency with known facts',
        'Assess plausibility',
        'Rank hypotheses'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestHypothesis', 'rankedHypotheses', 'evaluationMatrix'],
      properties: {
        bestHypothesis: { type: 'object' },
        rankedHypotheses: { type: 'array' },
        evaluationMatrix: { type: 'object' },
        evaluationCriteria: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'hypothesis-evaluation']
}));

export const analyzeAlternativesTask = defineTask('historical-alternatives-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Alternative Explanation Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Alternative hypothesis analysis specialist',
      task: 'Analyze why alternative explanations are less likely',
      context: args,
      instructions: [
        'Compare best hypothesis to alternatives',
        'Identify differentiating evidence',
        'Assess what would change conclusions',
        'Identify viable alternatives that cannot be ruled out',
        'Document reasons for rejection',
        'Note conditions that would favor alternatives'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['viableAlternatives', 'rejectionReasons'],
      properties: {
        viableAlternatives: { type: 'array' },
        rejectedAlternatives: { type: 'array' },
        rejectionReasons: { type: 'array' },
        differentiatingEvidence: { type: 'array' },
        sensitivityAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'alternatives-analysis']
}));

export const synthesizeConclusionsTask = defineTask('historical-conclusions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Conclusion Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'investigative-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'root-cause-analyzer'],
    prompt: {
      role: 'Historical conclusion synthesis specialist',
      task: 'Synthesize findings into justified conclusions',
      context: args,
      instructions: [
        'Synthesize findings into coherent narrative',
        'State primary conclusion',
        'Assess confidence level',
        'Document caveats and limitations',
        'Identify remaining uncertainties',
        'Recommend further investigation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryConclusion', 'confidenceLevel', 'caveats'],
      properties: {
        primaryConclusion: { type: 'string' },
        confidenceLevel: { type: 'number' },
        caveats: { type: 'array' },
        limitations: { type: 'array' },
        remainingUncertainties: { type: 'array' },
        recommendedInvestigation: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['historical-reasoning', 'conclusions']
}));
