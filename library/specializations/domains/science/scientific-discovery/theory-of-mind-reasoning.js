/**
 * @process specializations/domains/science/scientific-discovery/theory-of-mind-reasoning
 * @description Theory of Mind Reasoning - Systematically infer beliefs, intentions, knowledge states,
 * and mental models of other agents to predict behavior, understand perspectives, and reason about
 * what others know, believe, want, and will do in scientific collaboration and discovery contexts.
 * @inputs { targetAgents: object[], observedBehaviors: object[], context: string, inferenceGoals?: string[] }
 * @outputs { success: boolean, mentalModels: object[], predictions: object[], perspectiveAnalysis: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/theory-of-mind-reasoning', {
 *   targetAgents: [{ name: 'Reviewer', role: 'peer-reviewer', background: 'expert in methodology' }],
 *   observedBehaviors: [{ action: 'requested additional experiments', context: 'review of paper' }],
 *   context: 'Peer review of novel hypothesis paper',
 *   inferenceGoals: ['Understand reviewer concerns', 'Predict likely acceptance criteria']
 * });
 *
 * @references
 * - Theory of Mind: https://plato.stanford.edu/entries/folk-psych-theory/
 * - Epistemic Logic: https://plato.stanford.edu/entries/logic-epistemic/
 * - Mental State Attribution: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3170894/
 * - Perspective-Taking in Science: https://www.sciencedirect.com/topics/psychology/perspective-taking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetAgents,
    observedBehaviors,
    context,
    inferenceGoals = []
  } = inputs;

  // Phase 1: Agent Profile Construction
  const agentProfiles = await ctx.task(agentProfileConstructionTask, {
    targetAgents,
    context,
    observedBehaviors
  });

  // Quality Gate: Agent profiles must be constructed
  if (!agentProfiles.profiles || agentProfiles.profiles.length === 0) {
    return {
      success: false,
      error: 'Failed to construct agent profiles',
      phase: 'agent-profile-construction',
      mentalModels: null
    };
  }

  // Phase 2: Knowledge State Inference
  const knowledgeStates = await ctx.task(knowledgeStateInferenceTask, {
    agentProfiles: agentProfiles.profiles,
    context,
    observedBehaviors
  });

  // Phase 3: Belief Attribution
  const beliefAttribution = await ctx.task(beliefAttributionTask, {
    agentProfiles: agentProfiles.profiles,
    knowledgeStates,
    observedBehaviors,
    context
  });

  // Phase 4: Intention and Goal Inference
  const intentionInference = await ctx.task(intentionGoalInferenceTask, {
    agentProfiles: agentProfiles.profiles,
    beliefAttribution,
    observedBehaviors,
    context
  });

  // Phase 5: Desire and Preference Modeling
  const desireModeling = await ctx.task(desirePreferenceModelingTask, {
    agentProfiles: agentProfiles.profiles,
    intentionInference,
    observedBehaviors,
    context
  });

  // Breakpoint: Review mental model construction
  await ctx.breakpoint({
    question: `Review mental models constructed for ${agentProfiles.profiles.length} agents. Are the inferred beliefs, intentions, and goals plausible?`,
    title: 'Mental Model Review',
    context: {
      runId: ctx.runId,
      context,
      profiles: agentProfiles.profiles.map(p => p.name),
      beliefSummary: beliefAttribution.summary,
      files: [{
        path: 'artifacts/mental-models-draft.json',
        format: 'json',
        content: { beliefAttribution, intentionInference, desireModeling }
      }]
    }
  });

  // Phase 6: Nested Belief Reasoning (What A thinks B thinks)
  const nestedBeliefs = await ctx.task(nestedBeliefReasoningTask, {
    agentProfiles: agentProfiles.profiles,
    beliefAttribution,
    knowledgeStates,
    context
  });

  // Phase 7: Perspective Simulation
  const perspectiveSimulation = await ctx.task(perspectiveSimulationTask, {
    agentProfiles: agentProfiles.profiles,
    beliefAttribution,
    intentionInference,
    desireModeling,
    context,
    inferenceGoals
  });

  // Phase 8: Behavior Prediction
  const behaviorPrediction = await ctx.task(behaviorPredictionTask, {
    agentProfiles: agentProfiles.profiles,
    beliefAttribution,
    intentionInference,
    desireModeling,
    nestedBeliefs,
    context
  });

  // Phase 9: Communication Strategy Inference
  const communicationStrategy = await ctx.task(communicationStrategyInferenceTask, {
    agentProfiles: agentProfiles.profiles,
    perspectiveSimulation,
    behaviorPrediction,
    inferenceGoals,
    context
  });

  // Phase 10: Synthesis and Recommendations
  const synthesis = await ctx.task(theoryOfMindSynthesisTask, {
    agentProfiles: agentProfiles.profiles,
    knowledgeStates,
    beliefAttribution,
    intentionInference,
    desireModeling,
    nestedBeliefs,
    perspectiveSimulation,
    behaviorPrediction,
    communicationStrategy,
    inferenceGoals,
    context
  });

  // Final Breakpoint: Analysis Approval
  await ctx.breakpoint({
    question: `Theory of Mind analysis complete for "${context}". Review predictions and recommendations?`,
    title: 'Theory of Mind Analysis Approval',
    context: {
      runId: ctx.runId,
      context,
      agentCount: agentProfiles.profiles.length,
      predictionCount: behaviorPrediction.predictions?.length || 0,
      files: [
        { path: 'artifacts/theory-of-mind-report.json', format: 'json', content: synthesis },
        { path: 'artifacts/theory-of-mind-report.md', format: 'markdown', content: synthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    context,
    mentalModels: synthesis.mentalModels,
    predictions: behaviorPrediction.predictions,
    perspectiveAnalysis: perspectiveSimulation.perspectives,
    knowledgeStates: knowledgeStates.states,
    beliefs: beliefAttribution.beliefs,
    intentions: intentionInference.intentions,
    nestedBeliefs: nestedBeliefs.nested,
    communicationInsights: communicationStrategy.insights,
    recommendations: synthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/theory-of-mind-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const agentProfileConstructionTask = defineTask('agent-profile-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Agent Profile Construction',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Cognitive Scientist specializing in mental state attribution',
      task: 'Construct detailed cognitive profiles for target agents',
      context: {
        targetAgents: args.targetAgents,
        context: args.context,
        observedBehaviors: args.observedBehaviors
      },
      instructions: [
        '1. Analyze each target agent\'s background, expertise, and role',
        '2. Infer cognitive style and reasoning patterns from available information',
        '3. Identify likely values, priorities, and motivational drivers',
        '4. Assess expertise level and domain knowledge',
        '5. Identify potential biases and heuristics likely employed',
        '6. Characterize communication style and preferences',
        '7. Infer social position and relationships with other agents',
        '8. Identify constraints on their decision-making',
        '9. Assess emotional tendencies and likely reactions',
        '10. Document confidence levels for each inference'
      ],
      outputFormat: 'JSON object with detailed agent profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              expertiseLevel: { type: 'string', enum: ['expert', 'proficient', 'competent', 'novice'] },
              cognitiveStyle: { type: 'object' },
              values: { type: 'array', items: { type: 'string' } },
              motivations: { type: 'array', items: { type: 'string' } },
              likelyBiases: { type: 'array', items: { type: 'string' } },
              communicationStyle: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
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
  labels: ['theory-of-mind', 'agent-modeling', 'cognitive-profiling']
}));

export const knowledgeStateInferenceTask = defineTask('knowledge-state-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Knowledge State Inference',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Epistemic Reasoning Expert',
      task: 'Infer what each agent knows, does not know, and is uncertain about',
      context: {
        agentProfiles: args.agentProfiles,
        context: args.context,
        observedBehaviors: args.observedBehaviors
      },
      instructions: [
        '1. Identify information each agent definitely has access to',
        '2. Infer knowledge from agent\'s background and role',
        '3. Identify knowledge gaps based on expertise boundaries',
        '4. Assess what information behaviors reveal they possess',
        '5. Distinguish between knowing that vs knowing how',
        '6. Identify implicit/tacit knowledge vs explicit knowledge',
        '7. Assess degree of certainty for different knowledge claims',
        '8. Identify knowledge that may be outdated or incorrect',
        '9. Map knowledge asymmetries between agents',
        '10. Document confidence in knowledge state inferences'
      ],
      outputFormat: 'JSON object with knowledge state analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['states'],
      properties: {
        states: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              knows: { type: 'array', items: { type: 'object' } },
              doesNotKnow: { type: 'array', items: { type: 'string' } },
              uncertainAbout: { type: 'array', items: { type: 'object' } },
              tacitKnowledge: { type: 'array', items: { type: 'string' } },
              potentialMisconceptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        knowledgeAsymmetries: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'epistemic-reasoning', 'knowledge-inference']
}));

export const beliefAttributionTask = defineTask('belief-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Belief Attribution',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Belief Attribution Specialist',
      task: 'Infer beliefs held by each agent based on evidence',
      context: {
        agentProfiles: args.agentProfiles,
        knowledgeStates: args.knowledgeStates,
        observedBehaviors: args.observedBehaviors,
        context: args.context
      },
      instructions: [
        '1. Distinguish beliefs from knowledge (beliefs may be false)',
        '2. Infer beliefs from observed behaviors and statements',
        '3. Identify core beliefs that drive other beliefs',
        '4. Assess belief strength and commitment level',
        '5. Identify beliefs that may conflict with evidence',
        '6. Map belief dependencies and coherence',
        '7. Identify beliefs likely resistant to change',
        '8. Assess how beliefs align with agent\'s values and goals',
        '9. Identify potential false beliefs or misconceptions',
        '10. Document evidence supporting each belief attribution'
      ],
      outputFormat: 'JSON object with belief attribution analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['beliefs', 'summary'],
      properties: {
        beliefs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              belief: { type: 'string' },
              category: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              evidence: { type: 'array', items: { type: 'string' } },
              resistanceToChange: { type: 'string', enum: ['high', 'medium', 'low'] },
              potentiallyFalse: { type: 'boolean' }
            }
          }
        },
        beliefSystems: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'belief-attribution', 'mental-state-inference']
}));

export const intentionGoalInferenceTask = defineTask('intention-goal-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Intention and Goal Inference',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Intention Recognition Expert',
      task: 'Infer intentions, goals, and plans of each agent',
      context: {
        agentProfiles: args.agentProfiles,
        beliefAttribution: args.beliefAttribution,
        observedBehaviors: args.observedBehaviors,
        context: args.context
      },
      instructions: [
        '1. Identify immediate intentions driving recent behaviors',
        '2. Infer long-term goals from patterns of behavior',
        '3. Distinguish between stated and actual intentions',
        '4. Identify subgoals and instrumental goals',
        '5. Assess goal priorities and tradeoffs',
        '6. Identify potential hidden or unstated goals',
        '7. Map means-ends relationships in agent plans',
        '8. Assess flexibility vs commitment to specific goals',
        '9. Identify potential goal conflicts (internal and external)',
        '10. Document confidence and evidence for each inference'
      ],
      outputFormat: 'JSON object with intention and goal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['intentions'],
      properties: {
        intentions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              immediateIntentions: { type: 'array', items: { type: 'object' } },
              longTermGoals: { type: 'array', items: { type: 'object' } },
              hiddenGoals: { type: 'array', items: { type: 'object' } },
              goalPriorities: { type: 'array', items: { type: 'string' } },
              goalConflicts: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        planInferences: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'intention-recognition', 'goal-inference']
}));

export const desirePreferenceModelingTask = defineTask('desire-preference-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Desire and Preference Modeling',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Preference Modeling Expert',
      task: 'Model desires, preferences, and utility functions of agents',
      context: {
        agentProfiles: args.agentProfiles,
        intentionInference: args.intentionInference,
        observedBehaviors: args.observedBehaviors,
        context: args.context
      },
      instructions: [
        '1. Identify intrinsic desires (valued for their own sake)',
        '2. Identify instrumental desires (valued as means)',
        '3. Infer preference orderings from choices',
        '4. Assess risk preferences (risk-averse, neutral, seeking)',
        '5. Identify time preferences (discount rates)',
        '6. Model tradeoffs between competing preferences',
        '7. Assess preference stability vs context-dependence',
        '8. Identify preferences that may be socially constructed',
        '9. Map preference coherence and potential inconsistencies',
        '10. Document confidence in preference inferences'
      ],
      outputFormat: 'JSON object with desire and preference analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['desires'],
      properties: {
        desires: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              intrinsicDesires: { type: 'array', items: { type: 'string' } },
              instrumentalDesires: { type: 'array', items: { type: 'string' } },
              preferenceOrdering: { type: 'array', items: { type: 'string' } },
              riskPreference: { type: 'string' },
              timePreference: { type: 'string' },
              tradeoffs: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        utilityFactors: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'preference-modeling', 'desire-inference']
}));

export const nestedBeliefReasoningTask = defineTask('nested-belief-reasoning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Nested Belief Reasoning',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Higher-Order Theory of Mind Expert',
      task: 'Reason about nested beliefs - what agents believe about others\' beliefs',
      context: {
        agentProfiles: args.agentProfiles,
        beliefAttribution: args.beliefAttribution,
        knowledgeStates: args.knowledgeStates,
        context: args.context
      },
      instructions: [
        '1. Identify first-order beliefs (A believes X)',
        '2. Infer second-order beliefs (A believes B believes X)',
        '3. Identify third-order beliefs where relevant (A believes B believes C believes X)',
        '4. Detect false beliefs about others\' beliefs',
        '5. Identify common knowledge vs private beliefs',
        '6. Assess accuracy of agents\' models of each other',
        '7. Identify strategic implications of nested beliefs',
        '8. Detect potential miscommunication from belief misalignment',
        '9. Map belief update mechanisms (how agents update beliefs)',
        '10. Identify opportunities for belief coordination'
      ],
      outputFormat: 'JSON object with nested belief analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['nested'],
      properties: {
        nested: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              aboutAgent: { type: 'string' },
              belief: { type: 'string' },
              order: { type: 'number' },
              accurate: { type: 'boolean' },
              strategicImplication: { type: 'string' }
            }
          }
        },
        commonKnowledge: { type: 'array', items: { type: 'string' } },
        beliefMisalignments: { type: 'array', items: { type: 'object' } },
        coordinationOpportunities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'nested-beliefs', 'higher-order-reasoning']
}));

export const perspectiveSimulationTask = defineTask('perspective-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Perspective Simulation',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Perspective-Taking Simulation Expert',
      task: 'Simulate how each agent perceives and interprets the situation',
      context: {
        agentProfiles: args.agentProfiles,
        beliefAttribution: args.beliefAttribution,
        intentionInference: args.intentionInference,
        desireModeling: args.desireModeling,
        context: args.context,
        inferenceGoals: args.inferenceGoals
      },
      instructions: [
        '1. Simulate each agent\'s subjective experience of the situation',
        '2. Identify what stands out as salient from each perspective',
        '3. Reconstruct the narrative each agent tells themselves',
        '4. Identify emotional responses from each perspective',
        '5. Assess how context is framed by each agent',
        '6. Identify blind spots in each agent\'s perspective',
        '7. Simulate decision-making from each perspective',
        '8. Identify where perspectives converge and diverge',
        '9. Assess empathic accuracy of other agents\' perspective-taking',
        '10. Generate insights relevant to inference goals'
      ],
      outputFormat: 'JSON object with perspective simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['perspectives'],
      properties: {
        perspectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              subjectiveExperience: { type: 'string' },
              salientFeatures: { type: 'array', items: { type: 'string' } },
              selfNarrative: { type: 'string' },
              emotionalState: { type: 'object' },
              framing: { type: 'string' },
              blindSpots: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        convergencePoints: { type: 'array', items: { type: 'string' } },
        divergencePoints: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'perspective-taking', 'simulation']
}));

export const behaviorPredictionTask = defineTask('behavior-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Behavior Prediction',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Behavioral Prediction Expert using Theory of Mind',
      task: 'Predict future behaviors based on inferred mental states',
      context: {
        agentProfiles: args.agentProfiles,
        beliefAttribution: args.beliefAttribution,
        intentionInference: args.intentionInference,
        desireModeling: args.desireModeling,
        nestedBeliefs: args.nestedBeliefs,
        context: args.context
      },
      instructions: [
        '1. Generate behavior predictions based on belief-desire-intention model',
        '2. Consider multiple possible actions for each agent',
        '3. Assess likelihood of each predicted behavior',
        '4. Identify conditions that would change predictions',
        '5. Predict responses to hypothetical actions by others',
        '6. Assess prediction confidence and uncertainty',
        '7. Identify potential surprise behaviors not fitting the model',
        '8. Consider emotional and impulsive behaviors',
        '9. Predict communication and signaling behaviors',
        '10. Generate scenario-specific predictions'
      ],
      outputFormat: 'JSON object with behavior predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              predictedBehavior: { type: 'string' },
              likelihood: { type: 'number', minimum: 0, maximum: 1 },
              rationale: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        conditionalPredictions: { type: 'array', items: { type: 'object' } },
        surpriseBehaviors: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'behavior-prediction', 'forecasting']
}));

export const communicationStrategyInferenceTask = defineTask('communication-strategy-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Communication Strategy Inference',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Strategic Communication Expert using Theory of Mind',
      task: 'Infer optimal communication strategies based on mental models',
      context: {
        agentProfiles: args.agentProfiles,
        perspectiveSimulation: args.perspectiveSimulation,
        behaviorPrediction: args.behaviorPrediction,
        inferenceGoals: args.inferenceGoals,
        context: args.context
      },
      instructions: [
        '1. Identify key messages to convey to each agent',
        '2. Determine optimal framing based on agent perspectives',
        '3. Identify potential misunderstandings to preempt',
        '4. Design persuasion strategies aligned with agent values',
        '5. Identify trust-building communication approaches',
        '6. Determine appropriate level of directness',
        '7. Identify topics to emphasize or de-emphasize',
        '8. Design strategies for addressing resistance',
        '9. Identify optimal timing and sequencing',
        '10. Generate communication recommendations'
      ],
      outputFormat: 'JSON object with communication strategy insights'
    },
    outputSchema: {
      type: 'object',
      required: ['insights'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              keyMessages: { type: 'array', items: { type: 'string' } },
              optimalFraming: { type: 'string' },
              potentialMisunderstandings: { type: 'array', items: { type: 'string' } },
              persuasionApproach: { type: 'string' },
              resistanceStrategies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        generalStrategies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'communication-strategy', 'persuasion']
}));

export const theoryOfMindSynthesisTask = defineTask('theory-of-mind-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Theory of Mind Synthesis',
  agent: {
    name: 'cognitive-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'causal-inference-engine'],
    prompt: {
      role: 'Theory of Mind Integration Expert',
      task: 'Synthesize all analyses into comprehensive mental models and recommendations',
      context: {
        agentProfiles: args.agentProfiles,
        knowledgeStates: args.knowledgeStates,
        beliefAttribution: args.beliefAttribution,
        intentionInference: args.intentionInference,
        desireModeling: args.desireModeling,
        nestedBeliefs: args.nestedBeliefs,
        perspectiveSimulation: args.perspectiveSimulation,
        behaviorPrediction: args.behaviorPrediction,
        communicationStrategy: args.communicationStrategy,
        inferenceGoals: args.inferenceGoals,
        context: args.context
      },
      instructions: [
        '1. Synthesize complete mental models for each agent',
        '2. Highlight key insights addressing inference goals',
        '3. Identify most important predictions and their implications',
        '4. Generate actionable recommendations',
        '5. Assess overall confidence in the analysis',
        '6. Identify areas of uncertainty requiring more information',
        '7. Summarize perspective differences and their implications',
        '8. Highlight strategic opportunities from mental model insights',
        '9. Generate warnings about potential pitfalls',
        '10. Create comprehensive markdown report'
      ],
      outputFormat: 'JSON object with synthesized mental models and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['mentalModels', 'recommendations', 'markdown'],
      properties: {
        mentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              summary: { type: 'string' },
              keyBeliefs: { type: 'array', items: { type: 'string' } },
              primaryGoals: { type: 'array', items: { type: 'string' } },
              likelyBehaviors: { type: 'array', items: { type: 'string' } },
              communicationApproach: { type: 'string' }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'object' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        uncertainties: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['theory-of-mind', 'synthesis', 'mental-models']
}));
