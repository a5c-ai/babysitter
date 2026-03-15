/**
 * @process domains/science/scientific-discovery/foreign-policy-pattern
 * @description Foreign Policy Pattern: Treat interacting subsystems as countries with policies and treaties
 * @inputs {
 *   system: string,
 *   subsystems: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   subsystemPolicies: array,
 *   treaties: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    subsystems = [],
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Identify Subsystems as Nations
  ctx.log('info', 'Identifying subsystems as nation-like entities');
  const nationMapping = await ctx.task(mapSubsystemsToNationsTask, {
    system,
    subsystems,
    domain
  });

  // Phase 2: Analyze Each Subsystem's Internal Policy
  ctx.log('info', 'Analyzing internal policies of each subsystem');
  const internalPolicies = await ctx.parallel.all(
    nationMapping.nations.map(nation =>
      ctx.task(analyzeInternalPolicyTask, {
        nation,
        system,
        domain
      })
    )
  );

  // Phase 3: Analyze Foreign Relations (Interactions)
  ctx.log('info', 'Analyzing foreign relations between subsystems');
  const foreignRelations = await ctx.task(analyzeForeignRelationsTask, {
    nations: nationMapping.nations,
    internalPolicies,
    domain
  });

  await ctx.breakpoint({
    question: 'Policy and relations analysis complete. Review before treaty design?',
    title: 'Foreign Policy Pattern - Analysis Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/nation-mapping.json', format: 'json' },
        { path: 'artifacts/foreign-relations.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Identify Conflicts and Negotiations
  ctx.log('info', 'Identifying conflicts and negotiation opportunities');
  const conflictsAndNegotiations = await ctx.task(identifyConflictsTask, {
    nations: nationMapping.nations,
    foreignRelations,
    domain
  });

  // Phase 5: Design Treaties (Interface Agreements)
  ctx.log('info', 'Designing treaties between subsystems');
  const treaties = await ctx.task(designTreatiesTask, {
    nations: nationMapping.nations,
    foreignRelations,
    conflicts: conflictsAndNegotiations,
    domain
  });

  // Phase 6: Analyze Geopolitical Dynamics
  ctx.log('info', 'Analyzing geopolitical dynamics');
  const geopoliticalDynamics = await ctx.task(analyzeGeopoliticsTask, {
    nations: nationMapping.nations,
    treaties,
    foreignRelations,
    domain
  });

  // Phase 7: Predict System Evolution
  ctx.log('info', 'Predicting system evolution based on policies');
  const evolutionPrediction = await ctx.task(predictEvolutionTask, {
    nations: nationMapping.nations,
    treaties,
    geopoliticalDynamics,
    domain
  });

  // Phase 8: Synthesize Insights
  ctx.log('info', 'Synthesizing foreign policy insights');
  const synthesis = await ctx.task(synthesizeForeignPolicyInsightsTask, {
    system,
    nationMapping,
    internalPolicies,
    foreignRelations,
    treaties,
    geopoliticalDynamics,
    evolutionPrediction,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/foreign-policy-pattern',
    system,
    domain,
    nationMapping,
    subsystemPolicies: internalPolicies,
    foreignRelations,
    conflictsAndNegotiations,
    treaties: treaties.treaties,
    geopoliticalDynamics,
    evolutionPrediction,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      subsystemCount: nationMapping.nations?.length || 0,
      treatiesDesigned: treaties.treaties?.length || 0,
      conflictsIdentified: conflictsAndNegotiations.conflicts?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const mapSubsystemsToNationsTask = defineTask('map-subsystems-to-nations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Subsystems to Nation Entities',
  agent: {
    name: 'nation-mapper',
    prompt: {
      role: 'political systems analyst',
      task: 'Map subsystems to nation-like entities with interests and resources',
      context: args,
      instructions: [
        'Identify each subsystem as a nation-like entity',
        'Define the territory (scope) of each nation',
        'Identify resources and capabilities of each',
        'Define national interests and goals',
        'Identify strengths and vulnerabilities',
        'Map borders and boundaries between nations',
        'Document the power distribution'
      ],
      outputFormat: 'JSON with nations, territories, resources, interests'
    },
    outputSchema: {
      type: 'object',
      required: ['nations'],
      properties: {
        nations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              territory: { type: 'object' },
              resources: { type: 'array', items: { type: 'object' } },
              interests: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              vulnerabilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        borders: { type: 'array', items: { type: 'object' } },
        powerDistribution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'mapping']
}));

export const analyzeInternalPolicyTask = defineTask('analyze-internal-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Internal Policy: ${args.nation.name}`,
  agent: {
    name: 'policy-analyst',
    prompt: {
      role: 'domestic policy analyst',
      task: 'Analyze the internal policy of a subsystem-nation',
      context: args,
      instructions: [
        'Identify the internal governance structure',
        'Document domestic priorities',
        'Identify internal constraints',
        'Analyze resource allocation policies',
        'Document self-regulation mechanisms',
        'Identify internal stability factors',
        'Assess adaptability to external pressure'
      ],
      outputFormat: 'JSON with governance, priorities, constraints, mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['nationId', 'governance', 'priorities'],
      properties: {
        nationId: { type: 'string' },
        governance: { type: 'object' },
        priorities: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        resourceAllocation: { type: 'object' },
        selfRegulation: { type: 'array', items: { type: 'object' } },
        stabilityFactors: { type: 'array', items: { type: 'string' } },
        adaptability: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'internal-policy']
}));

export const analyzeForeignRelationsTask = defineTask('analyze-foreign-relations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Foreign Relations',
  agent: {
    name: 'foreign-relations-analyst',
    prompt: {
      role: 'international relations analyst',
      task: 'Analyze the foreign relations between subsystem-nations',
      context: args,
      instructions: [
        'Map all bilateral relationships',
        'Identify allies and adversaries',
        'Document trade and exchange relationships',
        'Identify dependencies between nations',
        'Analyze power dynamics',
        'Identify spheres of influence',
        'Document existing agreements and norms'
      ],
      outputFormat: 'JSON with relationships, alliances, dependencies, dynamics'
    },
    outputSchema: {
      type: 'object',
      required: ['bilateralRelations', 'alliances'],
      properties: {
        bilateralRelations: { type: 'array', items: { type: 'object' } },
        alliances: { type: 'array', items: { type: 'object' } },
        adversaries: { type: 'array', items: { type: 'object' } },
        tradeRelations: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        powerDynamics: { type: 'object' },
        spheresOfInfluence: { type: 'array', items: { type: 'object' } },
        existingAgreements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'relations']
}));

export const identifyConflictsTask = defineTask('identify-conflicts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Conflicts and Negotiations',
  agent: {
    name: 'conflict-analyst',
    prompt: {
      role: 'conflict resolution specialist',
      task: 'Identify conflicts and opportunities for negotiation',
      context: args,
      instructions: [
        'Identify resource conflicts between nations',
        'Find competing interests',
        'Identify border disputes (interface conflicts)',
        'Document escalation risks',
        'Identify negotiation opportunities',
        'Find potential compromises',
        'Assess conflict resolution mechanisms'
      ],
      outputFormat: 'JSON with conflicts, competing interests, negotiation opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['conflicts', 'negotiationOpportunities'],
      properties: {
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parties: { type: 'array', items: { type: 'string' } },
              issue: { type: 'string' },
              severity: { type: 'string' },
              escalationRisk: { type: 'string' }
            }
          }
        },
        competingInterests: { type: 'array', items: { type: 'object' } },
        borderDisputes: { type: 'array', items: { type: 'object' } },
        negotiationOpportunities: { type: 'array', items: { type: 'object' } },
        potentialCompromises: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'conflicts']
}));

export const designTreatiesTask = defineTask('design-treaties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Treaties',
  agent: {
    name: 'treaty-designer',
    prompt: {
      role: 'diplomatic treaty designer',
      task: 'Design treaties (interface agreements) between subsystems',
      context: args,
      instructions: [
        'Design bilateral and multilateral treaties',
        'Define terms and obligations',
        'Specify enforcement mechanisms',
        'Include dispute resolution procedures',
        'Define treaty duration and renewal',
        'Include exit clauses',
        'Balance interests of all parties'
      ],
      outputFormat: 'JSON with treaties, terms, enforcement, dispute resolution'
    },
    outputSchema: {
      type: 'object',
      required: ['treaties'],
      properties: {
        treaties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              parties: { type: 'array', items: { type: 'string' } },
              terms: { type: 'array', items: { type: 'object' } },
              obligations: { type: 'array', items: { type: 'object' } },
              enforcement: { type: 'object' },
              disputeResolution: { type: 'object' },
              duration: { type: 'string' }
            }
          }
        },
        multilateralFrameworks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'treaties']
}));

export const analyzeGeopoliticsTask = defineTask('analyze-geopolitics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Geopolitical Dynamics',
  agent: {
    name: 'geopolitical-analyst',
    prompt: {
      role: 'geopolitical strategist',
      task: 'Analyze the geopolitical dynamics of the system',
      context: args,
      instructions: [
        'Identify balance of power',
        'Analyze coalition stability',
        'Identify potential flashpoints',
        'Assess system stability',
        'Identify feedback loops in relations',
        'Analyze path dependencies',
        'Identify tipping points'
      ],
      outputFormat: 'JSON with power balance, stability, flashpoints, feedback loops'
    },
    outputSchema: {
      type: 'object',
      required: ['powerBalance', 'stability'],
      properties: {
        powerBalance: { type: 'object' },
        coalitionStability: { type: 'array', items: { type: 'object' } },
        flashpoints: { type: 'array', items: { type: 'object' } },
        systemStability: { type: 'object' },
        feedbackLoops: { type: 'array', items: { type: 'object' } },
        pathDependencies: { type: 'array', items: { type: 'object' } },
        tippingPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'geopolitics']
}));

export const predictEvolutionTask = defineTask('predict-evolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Predict System Evolution',
  agent: {
    name: 'evolution-predictor',
    prompt: {
      role: 'strategic forecaster',
      task: 'Predict system evolution based on foreign policy dynamics',
      context: args,
      instructions: [
        'Predict likely evolution of relationships',
        'Identify emerging powers and declining powers',
        'Forecast treaty compliance and violations',
        'Predict conflict escalation or resolution',
        'Identify potential system reorganization',
        'Forecast policy adaptations',
        'Identify multiple possible futures'
      ],
      outputFormat: 'JSON with evolution predictions, scenarios, likelihoods'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'scenarios'],
      properties: {
        predictions: { type: 'array', items: { type: 'object' } },
        emergingPowers: { type: 'array', items: { type: 'string' } },
        decliningPowers: { type: 'array', items: { type: 'string' } },
        treatyCompliance: { type: 'object' },
        conflictForecasts: { type: 'array', items: { type: 'object' } },
        reorganizationPotential: { type: 'string' },
        scenarios: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'prediction']
}));

export const synthesizeForeignPolicyInsightsTask = defineTask('synthesize-foreign-policy-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Foreign Policy Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'political scientist',
      task: 'Synthesize insights from foreign policy analysis',
      context: args,
      instructions: [
        'Summarize key insights from the analysis',
        'Extract principles about subsystem interactions',
        'Document what the metaphor reveals',
        'Identify limitations of the metaphor',
        'Provide recommendations for system design',
        'Note surprising findings',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, metaphor value, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        interactionPrinciples: { type: 'array', items: { type: 'string' } },
        metaphorReveals: { type: 'array', items: { type: 'string' } },
        metaphorLimitations: { type: 'array', items: { type: 'string' } },
        designRecommendations: { type: 'array', items: { type: 'string' } },
        surprisingFindings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'foreign-policy', 'synthesis']
}));
