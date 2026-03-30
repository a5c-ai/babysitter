/**
 * @process domains/science/scientific-discovery/adversarial-co-design-explanations
 * @description Adversarial Co-Design Explanations: Pair Builder proposing models with Breaker generating counterexamples
 * @inputs {
 *   phenomenon: string,
 *   initialObservations: string,
 *   domain: string,
 *   rounds: number
 * }
 * @outputs {
 *   success: boolean,
 *   finalModel: object,
 *   modelEvolution: array,
 *   counterexamples: array,
 *   robustnessScore: number
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    initialObservations = '',
    domain = 'general science',
    rounds = 4,
    targetRobustness = 85
  } = inputs;

  const modelEvolution = [];
  const allCounterexamples = [];
  let currentModel = null;
  let robustnessScore = 0;
  const startTime = ctx.now();

  // Phase 1: Builder Creates Initial Model
  ctx.log('info', 'Builder creating initial explanatory model');
  const initialModel = await ctx.task(builderProposeModelTask, {
    phenomenon,
    initialObservations,
    domain,
    round: 0,
    previousCounterexamples: []
  });

  currentModel = initialModel;
  modelEvolution.push({
    round: 0,
    phase: 'initial',
    model: initialModel,
    timestamp: ctx.now()
  });

  // Phase 2: Adversarial Rounds
  for (let round = 1; round <= rounds; round++) {
    // Breaker generates counterexamples
    ctx.log('info', `Round ${round}: Breaker generating counterexamples`);
    const counterexamples = await ctx.task(breakerGenerateCounterexamplesTask, {
      phenomenon,
      currentModel,
      previousCounterexamples: allCounterexamples,
      domain,
      round
    });

    allCounterexamples.push(...counterexamples.counterexamples);
    modelEvolution.push({
      round,
      phase: 'challenge',
      counterexamples: counterexamples.counterexamples,
      timestamp: ctx.now()
    });

    if (counterexamples.counterexamples.length === 0) {
      ctx.log('info', 'No counterexamples found - model may be robust');
      break;
    }

    // Builder refines model to address counterexamples
    ctx.log('info', `Round ${round}: Builder refining model`);
    const refinedModel = await ctx.task(builderRefineModelTask, {
      phenomenon,
      currentModel,
      counterexamples: counterexamples.counterexamples,
      allCounterexamples,
      domain,
      round
    });

    currentModel = refinedModel;
    modelEvolution.push({
      round,
      phase: 'refinement',
      model: refinedModel,
      addressedCounterexamples: refinedModel.addressedCounterexamples,
      timestamp: ctx.now()
    });

    // Assess current robustness
    robustnessScore = refinedModel.robustnessScore || 0;

    if (round < rounds) {
      await ctx.breakpoint({
        question: `Round ${round} complete. Robustness: ${robustnessScore}%. Continue adversarial process?`,
        title: `Adversarial Co-Design - Round ${round}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/round-${round}-model.json`, format: 'json' },
            { path: `artifacts/round-${round}-counterexamples.json`, format: 'json' }
          ]
        }
      });
    }
  }

  // Phase 3: Final Robustness Assessment
  ctx.log('info', 'Performing final robustness assessment');
  const robustnessAssessment = await ctx.task(assessRobustnessTask, {
    phenomenon,
    finalModel: currentModel,
    allCounterexamples,
    modelEvolution,
    domain
  });

  robustnessScore = robustnessAssessment.overallRobustness;

  // Phase 4: Identify Remaining Vulnerabilities
  ctx.log('info', 'Identifying remaining vulnerabilities');
  const vulnerabilityAnalysis = await ctx.task(identifyVulnerabilitiesTask, {
    finalModel: currentModel,
    robustnessAssessment,
    allCounterexamples,
    domain
  });

  // Phase 5: Generate Confidence Assessment
  ctx.log('info', 'Generating confidence assessment');
  const confidenceAssessment = await ctx.task(assessConfidenceTask, {
    phenomenon,
    finalModel: currentModel,
    robustnessAssessment,
    vulnerabilityAnalysis,
    modelEvolution,
    domain
  });

  // Phase 6: Synthesize Findings
  ctx.log('info', 'Synthesizing adversarial co-design findings');
  const synthesis = await ctx.task(synthesizeAdversarialFindingsTask, {
    phenomenon,
    finalModel: currentModel,
    modelEvolution,
    allCounterexamples,
    robustnessAssessment,
    vulnerabilityAnalysis,
    confidenceAssessment,
    domain
  });

  return {
    success: robustnessScore >= targetRobustness,
    processId: 'domains/science/scientific-discovery/adversarial-co-design-explanations',
    phenomenon,
    domain,
    finalModel: currentModel,
    modelEvolution,
    counterexamples: allCounterexamples,
    robustnessScore,
    robustnessAssessment,
    vulnerabilityAnalysis,
    confidenceAssessment,
    synthesis,
    metadata: {
      totalRounds: rounds,
      totalCounterexamples: allCounterexamples.length,
      addressedCounterexamples: allCounterexamples.filter(c => c.addressed).length,
      targetRobustness,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const builderProposeModelTask = defineTask('builder-propose-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Builder: Propose Model (Round ${args.round})`,
  agent: {
    name: 'model-builder',
    prompt: {
      role: 'theoretical scientist (Builder)',
      task: 'Propose an explanatory model for the phenomenon',
      context: args,
      instructions: [
        'Construct a model that explains the phenomenon',
        'Address any previous counterexamples if provided',
        'Make the model as precise and testable as possible',
        'Document key assumptions and predictions',
        'Specify the domain of applicability',
        'Identify potential weaknesses proactively',
        'Justify design choices'
      ],
      outputFormat: 'JSON with model structure, assumptions, predictions, scope'
    },
    outputSchema: {
      type: 'object',
      required: ['modelName', 'structure', 'assumptions', 'predictions'],
      properties: {
        modelName: { type: 'string' },
        structure: { type: 'object' },
        mechanisms: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } },
        scope: { type: 'object' },
        potentialWeaknesses: { type: 'array', items: { type: 'string' } },
        designJustification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'builder', 'proposal']
}));

export const breakerGenerateCounterexamplesTask = defineTask('breaker-generate-counterexamples', (args, taskCtx) => ({
  kind: 'agent',
  title: `Breaker: Generate Counterexamples (Round ${args.round})`,
  agent: {
    name: 'model-breaker',
    prompt: {
      role: 'critical scientist (Breaker)',
      task: 'Generate counterexamples that challenge the model',
      context: args,
      instructions: [
        'Critically examine the proposed model',
        'Generate counterexamples the model cannot explain',
        'Challenge assumptions with edge cases',
        'Find boundary conditions where model fails',
        'Identify logical inconsistencies',
        'Propose scenarios that stress the model',
        'Prioritize by severity and relevance'
      ],
      outputFormat: 'JSON with counterexamples, severity, reasoning'
    },
    outputSchema: {
      type: 'object',
      required: ['counterexamples'],
      properties: {
        counterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              reasoning: { type: 'string' },
              targetedAspect: { type: 'string' },
              addressed: { type: 'boolean' }
            }
          }
        },
        challengeStrategy: { type: 'string' },
        modelWeaknessesExploited: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'breaker', 'counterexamples']
}));

export const builderRefineModelTask = defineTask('builder-refine-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Builder: Refine Model (Round ${args.round})`,
  agent: {
    name: 'model-refiner',
    prompt: {
      role: 'theoretical scientist (Builder)',
      task: 'Refine the model to address counterexamples',
      context: args,
      instructions: [
        'Address each counterexample if possible',
        'Modify model structure as needed',
        'Revise assumptions where necessary',
        'Maintain model coherence and parsimony',
        'Document changes and rationale',
        'Acknowledge limitations where counterexamples cannot be addressed',
        'Estimate new robustness score'
      ],
      outputFormat: 'JSON with refined model, addressed counterexamples, changes'
    },
    outputSchema: {
      type: 'object',
      required: ['modelName', 'structure', 'addressedCounterexamples'],
      properties: {
        modelName: { type: 'string' },
        structure: { type: 'object' },
        mechanisms: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } },
        addressedCounterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterexampleId: { type: 'string' },
              addressed: { type: 'boolean' },
              solution: { type: 'string' }
            }
          }
        },
        changes: { type: 'array', items: { type: 'object' } },
        unaddressedLimitations: { type: 'array', items: { type: 'string' } },
        robustnessScore: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'builder', 'refinement']
}));

export const assessRobustnessTask = defineTask('assess-robustness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Model Robustness',
  agent: {
    name: 'robustness-assessor',
    prompt: {
      role: 'model evaluator',
      task: 'Assess the robustness of the final model',
      context: args,
      instructions: [
        'Evaluate how well the model withstood challenges',
        'Assess coverage of counterexamples addressed',
        'Rate overall robustness 0-100',
        'Identify strongest and weakest aspects',
        'Evaluate model stability across refinements',
        'Compare to initial model improvements',
        'Document robustness criteria used'
      ],
      outputFormat: 'JSON with robustness assessment, scores, strengths, weaknesses'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRobustness', 'assessment'],
      properties: {
        overallRobustness: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'string' },
        counterexamplesCoverage: { type: 'number' },
        strongestAspects: { type: 'array', items: { type: 'string' } },
        weakestAspects: { type: 'array', items: { type: 'string' } },
        stabilityScore: { type: 'number' },
        improvementFromInitial: { type: 'number' },
        robustnessCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'robustness']
}));

export const identifyVulnerabilitiesTask = defineTask('identify-vulnerabilities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Remaining Vulnerabilities',
  agent: {
    name: 'vulnerability-analyst',
    prompt: {
      role: 'security analyst for models',
      task: 'Identify remaining vulnerabilities in the model',
      context: args,
      instructions: [
        'Identify unaddressed counterexamples',
        'Find potential future challenges',
        'Assess model boundaries and edge cases',
        'Identify assumption vulnerabilities',
        'Rate vulnerability severity',
        'Suggest mitigation strategies',
        'Document areas requiring caution'
      ],
      outputFormat: 'JSON with vulnerabilities, severity, mitigations'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities'],
      properties: {
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerability: { type: 'string' },
              severity: { type: 'string' },
              type: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        unaddressedCounterexamples: { type: 'array', items: { type: 'string' } },
        potentialFutureChallenges: { type: 'array', items: { type: 'string' } },
        cautionAreas: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'vulnerabilities']
}));

export const assessConfidenceTask = defineTask('assess-confidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Model Confidence',
  agent: {
    name: 'confidence-assessor',
    prompt: {
      role: 'epistemologist',
      task: 'Assess justified confidence in the model',
      context: args,
      instructions: [
        'Evaluate evidence supporting the model',
        'Consider severity of remaining vulnerabilities',
        'Assess how well adversarial process tested the model',
        'Rate confidence for different model aspects',
        'Identify high-confidence vs low-confidence regions',
        'Provide calibrated confidence assessment',
        'Document confidence rationale'
      ],
      outputFormat: 'JSON with confidence assessment, regional confidences, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['overallConfidence', 'confidenceRegions'],
      properties: {
        overallConfidence: { type: 'number', minimum: 0, maximum: 100 },
        confidenceRegions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              region: { type: 'string' },
              confidence: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        evidenceBase: { type: 'array', items: { type: 'string' } },
        adversarialTestQuality: { type: 'string' },
        confidenceRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'confidence']
}));

export const synthesizeAdversarialFindingsTask = defineTask('synthesize-adversarial-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Adversarial Co-Design Findings',
  agent: {
    name: 'findings-synthesizer',
    prompt: {
      role: 'research synthesizer',
      task: 'Synthesize findings from the adversarial co-design process',
      context: args,
      instructions: [
        'Summarize the model evolution journey',
        'Document key insights from the adversarial process',
        'Highlight what was learned from counterexamples',
        'Assess the value of adversarial methodology',
        'Provide recommendations for model use',
        'Suggest future research directions',
        'Create comprehensive synthesis report'
      ],
      outputFormat: 'JSON with synthesis, insights, recommendations, report'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'keyInsights', 'recommendations'],
      properties: {
        synthesis: { type: 'string' },
        evolutionSummary: { type: 'string' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        counterexampleLessons: { type: 'array', items: { type: 'string' } },
        methodologyValue: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adversarial-codesign', 'synthesis']
}));
