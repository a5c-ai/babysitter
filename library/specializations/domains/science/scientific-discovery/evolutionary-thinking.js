/**
 * @process scientific-discovery/evolutionary-thinking
 * @description Evolutionary thinking process for explaining biological features via historical selection pressures, analyzing adaptations, and understanding phylogenetic relationships
 * @inputs { feature: string, organism: string, environment: object, phylogeneticContext: object, outputDir: string }
 * @outputs { success: boolean, evolutionaryExplanation: object, selectionPressures: array, adaptiveValue: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    feature = '',
    organism = '',
    environment = {},
    phylogeneticContext = {},
    outputDir = 'evolutionary-thinking-output',
    targetConfidence = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Evolutionary Thinking Process');

  // ============================================================================
  // PHASE 1: FEATURE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing the biological feature');
  const featureAnalysis = await ctx.task(featureCharacterizationTask, {
    feature,
    organism,
    outputDir
  });

  artifacts.push(...featureAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ANCESTRAL STATE RECONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Reconstructing ancestral states');
  const ancestralReconstruction = await ctx.task(ancestralStateReconstructionTask, {
    feature,
    organism,
    phylogeneticContext,
    featureAnalysis,
    outputDir
  });

  artifacts.push(...ancestralReconstruction.artifacts);

  // ============================================================================
  // PHASE 3: SELECTION PRESSURE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying historical selection pressures');
  const selectionPressures = await ctx.task(selectionPressureIdentificationTask, {
    feature,
    organism,
    environment,
    ancestralReconstruction,
    outputDir
  });

  artifacts.push(...selectionPressures.artifacts);

  // ============================================================================
  // PHASE 4: ADAPTIVE VALUE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing adaptive value');
  const adaptiveAssessment = await ctx.task(adaptiveValueAssessmentTask, {
    feature,
    organism,
    selectionPressures: selectionPressures.pressures,
    environment,
    outputDir
  });

  artifacts.push(...adaptiveAssessment.artifacts);

  // ============================================================================
  // PHASE 5: ALTERNATIVE HYPOTHESES EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating alternative evolutionary hypotheses');
  const alternativeHypotheses = await ctx.task(alternativeHypothesesEvaluationTask, {
    feature,
    organism,
    adaptiveAssessment,
    selectionPressures: selectionPressures.pressures,
    outputDir
  });

  artifacts.push(...alternativeHypotheses.artifacts);

  // ============================================================================
  // PHASE 6: EXPLANATION SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing evolutionary explanation');
  const explanationSynthesis = await ctx.task(explanationSynthesisTask, {
    feature,
    organism,
    featureAnalysis,
    ancestralReconstruction,
    selectionPressures: selectionPressures.pressures,
    adaptiveAssessment,
    alternativeHypotheses,
    targetConfidence,
    outputDir
  });

  artifacts.push(...explanationSynthesis.artifacts);

  const confidenceMet = explanationSynthesis.confidenceScore >= targetConfidence;

  // Breakpoint: Review evolutionary explanation
  await ctx.breakpoint({
    question: `Evolutionary explanation complete. Confidence: ${explanationSynthesis.confidenceScore}/${targetConfidence}. ${confidenceMet ? 'Confidence target met!' : 'Additional evidence may be needed.'} Review explanation?`,
    title: 'Evolutionary Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        feature,
        organism,
        confidenceScore: explanationSynthesis.confidenceScore,
        confidenceMet,
        selectionPressuresIdentified: selectionPressures.pressures.length,
        alternativeHypothesesConsidered: alternativeHypotheses.hypotheses.length,
        primaryExplanationType: explanationSynthesis.primaryExplanationType
      }
    }
  });

  // ============================================================================
  // PHASE 7: TESTABLE PREDICTIONS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating testable predictions');
  const testablePredictions = await ctx.task(testablePredictionsGenerationTask, {
    evolutionaryExplanation: explanationSynthesis.explanation,
    feature,
    organism,
    outputDir
  });

  artifacts.push(...testablePredictions.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    feature,
    organism,
    evolutionaryExplanation: explanationSynthesis.explanation,
    selectionPressures: selectionPressures.pressures,
    adaptiveValue: adaptiveAssessment.adaptiveValue,
    ancestralState: ancestralReconstruction.ancestralState,
    alternativeHypotheses: alternativeHypotheses.hypotheses,
    bestSupportedHypothesis: alternativeHypotheses.bestSupported,
    testablePredictions: testablePredictions.predictions,
    confidenceScore: explanationSynthesis.confidenceScore,
    confidenceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/evolutionary-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Feature Characterization
export const featureCharacterizationTask = defineTask('feature-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize the biological feature',
  agent: {
    name: 'evolutionary-biologist',
    prompt: {
      role: 'evolutionary biologist and comparative anatomist',
      task: 'Characterize the biological feature in detail for evolutionary analysis',
      context: args,
      instructions: [
        'Describe the feature morphologically and functionally',
        'Identify the level of biological organization (molecular, cellular, organ, behavioral)',
        'Document the feature\'s developmental origin',
        'Identify homologous features in related taxa',
        'Note any variation within the species',
        'Describe the genetic basis if known',
        'Identify associated traits that may co-evolve',
        'Document the feature\'s distribution across populations',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with featureDescription, organizationalLevel, developmentalOrigin, homologs, variation, geneticBasis, associatedTraits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['featureDescription', 'organizationalLevel', 'artifacts'],
      properties: {
        featureDescription: {
          type: 'object',
          properties: {
            morphology: { type: 'string' },
            function: { type: 'string' },
            location: { type: 'string' }
          }
        },
        organizationalLevel: { type: 'string', enum: ['molecular', 'cellular', 'tissue', 'organ', 'system', 'behavioral'] },
        developmentalOrigin: { type: 'string' },
        homologs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taxon: { type: 'string' },
              feature: { type: 'string' },
              similarity: { type: 'number' }
            }
          }
        },
        variation: { type: 'object' },
        geneticBasis: { type: 'object' },
        associatedTraits: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'feature-characterization']
}));

// Task 2: Ancestral State Reconstruction
export const ancestralStateReconstructionTask = defineTask('ancestral-state-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct ancestral states',
  agent: {
    name: 'phylogeneticist',
    prompt: {
      role: 'phylogeneticist and evolutionary biologist',
      task: 'Reconstruct ancestral states of the feature using phylogenetic methods',
      context: args,
      instructions: [
        'Map the feature states across the phylogeny',
        'Apply parsimony or likelihood methods for reconstruction',
        'Identify the most likely ancestral condition',
        'Trace character state transitions on the tree',
        'Identify when and where the feature evolved',
        'Determine if feature arose once or multiple times (convergent evolution)',
        'Assess confidence in ancestral state estimates',
        'Document evolutionary trajectory of the feature',
        'Save reconstruction analysis to output directory'
      ],
      outputFormat: 'JSON with ancestralState, characterTransitions, evolutionaryOrigin, convergenceAssessment, confidenceEstimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ancestralState', 'characterTransitions', 'artifacts'],
      properties: {
        ancestralState: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            confidence: { type: 'number' },
            method: { type: 'string' }
          }
        },
        characterTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromState: { type: 'string' },
              toState: { type: 'string' },
              branch: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        evolutionaryOrigin: {
          type: 'object',
          properties: {
            timePeriod: { type: 'string' },
            lineage: { type: 'string' },
            singleOrigin: { type: 'boolean' }
          }
        },
        convergenceAssessment: { type: 'object' },
        confidenceEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'ancestral-reconstruction']
}));

// Task 3: Selection Pressure Identification
export const selectionPressureIdentificationTask = defineTask('selection-pressure-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify historical selection pressures',
  agent: {
    name: 'evolutionary-ecologist',
    prompt: {
      role: 'evolutionary ecologist and paleobiologist',
      task: 'Identify the historical selection pressures that shaped the feature',
      context: args,
      instructions: [
        'Reconstruct paleoenvironmental conditions during feature evolution',
        'Identify potential selective agents (predators, climate, diet, competition)',
        'Assess ecological challenges the ancestor faced',
        'Consider sexual selection pressures',
        'Evaluate social/behavioral selection pressures',
        'Analyze co-evolutionary relationships',
        'Rank selection pressures by likely importance',
        'Document evidence supporting each selection pressure',
        'Consider both positive and purifying selection',
        'Save selection pressure analysis to output directory'
      ],
      outputFormat: 'JSON with pressures (array with type, agent, evidence, importance), paleoenvironment, coevolutionaryFactors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pressures', 'paleoenvironment', 'artifacts'],
      properties: {
        pressures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['natural', 'sexual', 'social', 'climatic', 'dietary', 'predation'] },
              agent: { type: 'string' },
              direction: { type: 'string', enum: ['positive', 'purifying', 'balancing', 'disruptive'] },
              evidence: { type: 'array', items: { type: 'string' } },
              importance: { type: 'string', enum: ['primary', 'secondary', 'minor'] },
              timePeriod: { type: 'string' }
            }
          }
        },
        paleoenvironment: {
          type: 'object',
          properties: {
            climate: { type: 'string' },
            habitat: { type: 'string' },
            biome: { type: 'string' },
            timePeriod: { type: 'string' }
          }
        },
        coevolutionaryFactors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'selection-pressures']
}));

// Task 4: Adaptive Value Assessment
export const adaptiveValueAssessmentTask = defineTask('adaptive-value-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess adaptive value of the feature',
  agent: {
    name: 'adaptation-specialist',
    prompt: {
      role: 'evolutionary biologist specializing in adaptation',
      task: 'Assess the adaptive value and fitness benefits of the feature',
      context: args,
      instructions: [
        'Quantify fitness benefits conferred by the feature',
        'Identify the specific adaptive problem the feature solves',
        'Assess efficiency of the feature as a solution',
        'Compare to alternative solutions in other taxa',
        'Consider trade-offs and costs of the feature',
        'Evaluate optimality vs. historical constraint',
        'Assess current vs. historical adaptive value',
        'Consider exaptation possibilities (co-opted for new function)',
        'Document evidence of adaptation (comparative, experimental, correlational)',
        'Save adaptive assessment to output directory'
      ],
      outputFormat: 'JSON with adaptiveValue (problem, solution, benefits, costs, efficiency), fitnessImpact, tradeoffs, exaptationPossibility, evidenceTypes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptiveValue', 'fitnessImpact', 'artifacts'],
      properties: {
        adaptiveValue: {
          type: 'object',
          properties: {
            problem: { type: 'string' },
            solution: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            costs: { type: 'array', items: { type: 'string' } },
            efficiency: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        fitnessImpact: {
          type: 'object',
          properties: {
            survival: { type: 'string' },
            reproduction: { type: 'string' },
            overallMagnitude: { type: 'string', enum: ['small', 'moderate', 'large'] }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        exaptationPossibility: { type: 'object' },
        evidenceTypes: { type: 'array', items: { type: 'string' } },
        optimalityAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'adaptive-value']
}));

// Task 5: Alternative Hypotheses Evaluation
export const alternativeHypothesesEvaluationTask = defineTask('alternative-hypotheses-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate alternative evolutionary hypotheses',
  agent: {
    name: 'hypothesis-evaluator',
    prompt: {
      role: 'evolutionary biologist and philosophy of science expert',
      task: 'Evaluate alternative hypotheses for the feature\'s origin and maintenance',
      context: args,
      instructions: [
        'Generate alternative evolutionary hypotheses:',
        '  - Adaptation (direct natural selection)',
        '  - Exaptation (co-opted from another function)',
        '  - Spandrel (byproduct of other adaptations)',
        '  - Genetic drift (neutral evolution)',
        '  - Phylogenetic inertia (ancestral constraint)',
        '  - Sexual selection',
        '  - Developmental constraint',
        'Evaluate evidence for and against each hypothesis',
        'Apply strong inference methodology',
        'Rank hypotheses by evidential support',
        'Identify the best-supported hypothesis',
        'Note key experiments/observations that could distinguish hypotheses',
        'Save hypothesis evaluation to output directory'
      ],
      outputFormat: 'JSON with hypotheses (array with name, description, evidenceFor, evidenceAgainst, supportLevel), bestSupported, distinguishingTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'bestSupported', 'artifacts'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              evidenceFor: { type: 'array', items: { type: 'string' } },
              evidenceAgainst: { type: 'array', items: { type: 'string' } },
              supportLevel: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] }
            }
          }
        },
        bestSupported: {
          type: 'object',
          properties: {
            hypothesis: { type: 'string' },
            confidence: { type: 'number' },
            keyEvidence: { type: 'array', items: { type: 'string' } }
          }
        },
        distinguishingTests: { type: 'array', items: { type: 'object' } },
        uncertainties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'hypothesis-evaluation']
}));

// Task 6: Explanation Synthesis
export const explanationSynthesisTask = defineTask('explanation-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize evolutionary explanation',
  agent: {
    name: 'evolutionary-synthesis-expert',
    prompt: {
      role: 'senior evolutionary biologist',
      task: 'Synthesize a comprehensive evolutionary explanation for the feature',
      context: args,
      instructions: [
        'Integrate all analyses into a coherent evolutionary narrative',
        'Explain how selection pressures shaped the feature',
        'Connect ancestral states to current form',
        'Address the adaptive value in evolutionary context',
        'Acknowledge alternative hypotheses and their status',
        'Identify gaps in the explanation',
        'Calculate overall confidence score (0-100)',
        'Consider:',
        '  - Quality and quantity of evidence',
        '  - Consistency across lines of evidence',
        '  - Uniqueness of explanation (vs alternatives)',
        '  - Predictive power',
        'Write explanation accessible to educated non-specialist',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with explanation (narrative, summary, keyPoints), primaryExplanationType, confidenceScore, evidentialSupport, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['explanation', 'primaryExplanationType', 'confidenceScore', 'artifacts'],
      properties: {
        explanation: {
          type: 'object',
          properties: {
            narrative: { type: 'string' },
            summary: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        primaryExplanationType: { type: 'string', enum: ['adaptation', 'exaptation', 'spandrel', 'drift', 'constraint', 'sexual-selection', 'mixed'] },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        evidentialSupport: {
          type: 'object',
          properties: {
            comparative: { type: 'number' },
            experimental: { type: 'number' },
            genetic: { type: 'number' },
            paleontological: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        caveats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'synthesis']
}));

// Task 7: Testable Predictions Generation
export const testablePredictionsGenerationTask = defineTask('testable-predictions-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate testable predictions',
  agent: {
    name: 'research-designer',
    prompt: {
      role: 'evolutionary biologist and research methodologist',
      task: 'Generate testable predictions from the evolutionary explanation',
      context: args,
      instructions: [
        'Derive specific, falsifiable predictions from the explanation',
        'For each prediction, specify:',
        '  - The prediction statement',
        '  - What observation would confirm it',
        '  - What observation would refute it',
        '  - Feasibility of testing',
        '  - Type of study needed (comparative, experimental, genomic, etc.)',
        'Prioritize predictions by informativeness and feasibility',
        'Include predictions about:',
        '  - Related species (comparative predictions)',
        '  - Genetic signatures (molecular predictions)',
        '  - Developmental patterns',
        '  - Functional performance',
        'Identify crucial experiments that would most strengthen/weaken the explanation',
        'Save predictions to output directory'
      ],
      outputFormat: 'JSON with predictions (array with statement, confirmation, refutation, studyType, feasibility, priority), crucialTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'artifacts'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              confirmation: { type: 'string' },
              refutation: { type: 'string' },
              studyType: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        crucialTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              expectedOutcome: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        researchRoadmap: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evolutionary-thinking', 'predictions']
}));
