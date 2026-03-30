/**
 * @process domains/science/scientific-discovery/degenerate-mechanism-mining
 * @description Degenerate Mechanism Mining: Search for multiple mechanisms producing same behavior
 * @inputs {
 *   observedBehavior: string,
 *   context: string,
 *   domain: string,
 *   minMechanisms: number
 * }
 * @outputs {
 *   success: boolean,
 *   mechanisms: array,
 *   equivalenceClasses: array,
 *   discriminationTests: array,
 *   synthesizedView: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    observedBehavior,
    context = '',
    domain = 'general science',
    minMechanisms = 3,
    maxSearchRounds = 4
  } = inputs;

  const mechanisms = [];
  const startTime = ctx.now();
  let round = 0;

  // Phase 1: Characterize the Observed Behavior
  ctx.log('info', 'Characterizing the observed behavior');
  const behaviorCharacterization = await ctx.task(characterizeBehaviorTask, {
    observedBehavior,
    context,
    domain
  });

  // Phase 2: Generate Initial Mechanism Hypotheses
  ctx.log('info', 'Generating initial mechanism hypotheses');
  const initialMechanisms = await ctx.task(generateMechanismsTask, {
    observedBehavior,
    behaviorCharacterization,
    existingMechanisms: [],
    domain,
    round: 0
  });

  mechanisms.push(...initialMechanisms.mechanisms);

  // Phase 3: Iterative Mechanism Search
  while (mechanisms.length < minMechanisms && round < maxSearchRounds) {
    round++;

    ctx.log('info', `Round ${round}: Searching for additional mechanisms`);
    const additionalMechanisms = await ctx.task(generateMechanismsTask, {
      observedBehavior,
      behaviorCharacterization,
      existingMechanisms: mechanisms,
      domain,
      round
    });

    mechanisms.push(...additionalMechanisms.mechanisms);
  }

  await ctx.breakpoint({
    question: `Found ${mechanisms.length} mechanisms. Review before analysis?`,
    title: 'Degenerate Mechanism Mining - Mechanisms Identified',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/mechanisms.json', format: 'json' },
        { path: 'artifacts/behavior-characterization.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Analyze Mechanism Equivalences
  ctx.log('info', 'Analyzing mechanism equivalences');
  const equivalenceAnalysis = await ctx.task(analyzeEquivalencesTask, {
    observedBehavior,
    mechanisms,
    behaviorCharacterization,
    domain
  });

  // Phase 5: Identify Distinguishing Features
  ctx.log('info', 'Identifying distinguishing features');
  const distinguishingFeatures = await ctx.task(identifyDistinguishingFeaturesTask, {
    mechanisms,
    equivalenceAnalysis,
    domain
  });

  // Phase 6: Design Discrimination Tests
  ctx.log('info', 'Designing tests to discriminate between mechanisms');
  const discriminationTests = await ctx.task(designDiscriminationTestsTask, {
    mechanisms,
    distinguishingFeatures,
    domain
  });

  // Phase 7: Analyze Robustness and Degeneracy Implications
  ctx.log('info', 'Analyzing robustness and degeneracy implications');
  const degeneracyAnalysis = await ctx.task(analyzeDegeneracyTask, {
    observedBehavior,
    mechanisms,
    equivalenceAnalysis,
    domain
  });

  // Phase 8: Synthesize Understanding
  ctx.log('info', 'Synthesizing multi-mechanism understanding');
  const synthesizedView = await ctx.task(synthesizeMechanismViewTask, {
    observedBehavior,
    mechanisms,
    equivalenceAnalysis,
    distinguishingFeatures,
    discriminationTests,
    degeneracyAnalysis,
    domain
  });

  return {
    success: mechanisms.length >= minMechanisms,
    processId: 'domains/science/scientific-discovery/degenerate-mechanism-mining',
    observedBehavior,
    domain,
    behaviorCharacterization,
    mechanisms,
    equivalenceClasses: equivalenceAnalysis.equivalenceClasses,
    distinguishingFeatures,
    discriminationTests: discriminationTests.tests,
    degeneracyAnalysis,
    synthesizedView,
    metadata: {
      mechanismsFound: mechanisms.length,
      searchRounds: round,
      equivalenceClassCount: equivalenceAnalysis.equivalenceClasses.length,
      testsDesigned: discriminationTests.tests.length,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const characterizeBehaviorTask = defineTask('characterize-behavior', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize Observed Behavior',
  agent: {
    name: 'behavior-analyst',
    prompt: {
      role: 'behavioral scientist',
      task: 'Thoroughly characterize the observed behavior',
      context: args,
      instructions: [
        'Document all observable aspects of the behavior',
        'Identify input-output relationships',
        'Characterize temporal dynamics',
        'Note boundary conditions and constraints',
        'Identify invariant properties',
        'Document any stochastic elements',
        'Specify what counts as the same behavior'
      ],
      outputFormat: 'JSON with behavior characteristics, dynamics, invariants'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'inputOutputRelations'],
      properties: {
        characteristics: { type: 'array', items: { type: 'object' } },
        inputOutputRelations: { type: 'array', items: { type: 'object' } },
        temporalDynamics: { type: 'object' },
        boundaryConditions: { type: 'array', items: { type: 'string' } },
        invariantProperties: { type: 'array', items: { type: 'string' } },
        stochasticElements: { type: 'array', items: { type: 'string' } },
        equivalenceCriteria: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'characterization']
}));

export const generateMechanismsTask = defineTask('generate-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Mechanisms: Round ${args.round}`,
  agent: {
    name: 'mechanism-generator',
    prompt: {
      role: 'mechanistic theorist',
      task: 'Generate plausible mechanisms that could produce the observed behavior',
      context: args,
      instructions: [
        'Propose mechanisms different from existing ones',
        'Consider diverse mechanism types (causal, functional, structural)',
        'Ensure each mechanism can produce the observed behavior',
        'Document the causal structure of each mechanism',
        'Identify key components and interactions',
        'Note assumptions required for each mechanism',
        'Assess plausibility of each mechanism'
      ],
      outputFormat: 'JSON with new mechanisms, causal structures, assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms'],
      properties: {
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              components: { type: 'array', items: { type: 'object' } },
              causalStructure: { type: 'object' },
              assumptions: { type: 'array', items: { type: 'string' } },
              plausibility: { type: 'number' }
            }
          }
        },
        searchStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'generation']
}));

export const analyzeEquivalencesTask = defineTask('analyze-equivalences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Mechanism Equivalences',
  agent: {
    name: 'equivalence-analyst',
    prompt: {
      role: 'formal analyst',
      task: 'Analyze equivalence relationships between mechanisms',
      context: args,
      instructions: [
        'Determine which mechanisms are behaviorally equivalent',
        'Group mechanisms into equivalence classes',
        'Identify what makes mechanisms equivalent',
        'Find partial equivalences (equivalent under some conditions)',
        'Analyze structural similarities and differences',
        'Identify the equivalence-preserving transformations',
        'Document the equivalence criteria used'
      ],
      outputFormat: 'JSON with equivalence classes, relationships, transformations'
    },
    outputSchema: {
      type: 'object',
      required: ['equivalenceClasses'],
      properties: {
        equivalenceClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              mechanisms: { type: 'array', items: { type: 'string' } },
              equivalenceType: { type: 'string' },
              sharedProperties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        partialEquivalences: { type: 'array', items: { type: 'object' } },
        structuralRelationships: { type: 'array', items: { type: 'object' } },
        transformations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'equivalence']
}));

export const identifyDistinguishingFeaturesTask = defineTask('identify-distinguishing-features', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Distinguishing Features',
  agent: {
    name: 'feature-analyst',
    prompt: {
      role: 'differential analyst',
      task: 'Identify features that distinguish between mechanisms',
      context: args,
      instructions: [
        'Identify features unique to each mechanism',
        'Find observable differences between mechanisms',
        'Identify conditions where mechanisms behave differently',
        'Document transient vs steady-state differences',
        'Find edge cases that reveal mechanism differences',
        'Identify proxy indicators for each mechanism',
        'Rank features by discriminative power'
      ],
      outputFormat: 'JSON with distinguishing features, conditions, indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['distinguishingFeatures'],
      properties: {
        distinguishingFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              mechanism: { type: 'string' },
              discriminativePower: { type: 'number' },
              observability: { type: 'string' }
            }
          }
        },
        differentialConditions: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } },
        proxyIndicators: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'distinguishing']
}));

export const designDiscriminationTestsTask = defineTask('design-discrimination-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Discrimination Tests',
  agent: {
    name: 'test-designer',
    prompt: {
      role: 'experimental designer',
      task: 'Design tests that can discriminate between mechanisms',
      context: args,
      instructions: [
        'Design experiments to distinguish between mechanisms',
        'Target the distinguishing features identified',
        'Specify test conditions and measurements',
        'Define expected outcomes for each mechanism',
        'Consider practical feasibility',
        'Prioritize tests by discriminative power',
        'Design a minimal test battery for full discrimination'
      ],
      outputFormat: 'JSON with tests, conditions, expected outcomes, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['tests'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              description: { type: 'string' },
              targetFeature: { type: 'string' },
              conditions: { type: 'object' },
              expectedOutcomes: { type: 'object' },
              discriminativePower: { type: 'number' },
              feasibility: { type: 'string' }
            }
          }
        },
        minimalTestBattery: { type: 'array', items: { type: 'string' } },
        testSequencing: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'test-design']
}));

export const analyzeDegeneracyTask = defineTask('analyze-degeneracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Degeneracy Implications',
  agent: {
    name: 'degeneracy-analyst',
    prompt: {
      role: 'systems biologist',
      task: 'Analyze the implications of mechanism degeneracy',
      context: args,
      instructions: [
        'Analyze why multiple mechanisms produce same behavior',
        'Assess robustness implications of degeneracy',
        'Consider evolvability implications',
        'Identify functional constraints that allow degeneracy',
        'Analyze whether degeneracy is fundamental or contingent',
        'Consider implications for prediction and control',
        'Assess theoretical significance of degeneracy'
      ],
      outputFormat: 'JSON with degeneracy analysis, robustness, evolvability, implications'
    },
    outputSchema: {
      type: 'object',
      required: ['degeneracyType', 'robustnessImplications'],
      properties: {
        degeneracyType: { type: 'string' },
        degeneracyOrigin: { type: 'string' },
        robustnessImplications: { type: 'object' },
        evolvabilityImplications: { type: 'object' },
        functionalConstraints: { type: 'array', items: { type: 'string' } },
        fundamentalVsContingent: { type: 'string' },
        predictionImplications: { type: 'array', items: { type: 'string' } },
        theoreticalSignificance: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'degeneracy-analysis']
}));

export const synthesizeMechanismViewTask = defineTask('synthesize-mechanism-view', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Multi-Mechanism Understanding',
  agent: {
    name: 'mechanism-synthesizer',
    prompt: {
      role: 'theoretical biologist',
      task: 'Synthesize understanding from multiple mechanism analysis',
      context: args,
      instructions: [
        'Create unified view of behavior-mechanism relationships',
        'Document what we learn from mechanism multiplicity',
        'Identify robust features vs mechanism-specific features',
        'Provide recommendations for mechanism identification',
        'Discuss implications for modeling and prediction',
        'Note open questions and uncertainties',
        'Create summary report of mechanism mining'
      ],
      outputFormat: 'JSON with synthesis, insights, recommendations, open questions'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'keyInsights'],
      properties: {
        synthesis: { type: 'string' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        robustFeatures: { type: 'array', items: { type: 'string' } },
        mechanismSpecificFeatures: { type: 'array', items: { type: 'object' } },
        identificationRecommendations: { type: 'array', items: { type: 'string' } },
        modelingImplications: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'degenerate-mechanism', 'synthesis']
}));
