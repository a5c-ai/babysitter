/**
 * @process domains/science/scientific-discovery/mechanism-discovery-protocol
 * @description Mechanism Discovery Protocol: Map network -> Metaphoric simulation -> Degenerate mining -> Constraint sculpting
 * @inputs {
 *   phenomenon: string,
 *   observedBehavior: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   discoveredMechanisms: array,
 *   mechanismNetwork: object,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    observedBehavior = '',
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();
  const discoveredMechanisms = [];

  // STAGE 1: MAP NETWORK - Map the interaction network underlying the phenomenon
  ctx.log('info', 'Stage 1: Mapping interaction network');
  const networkMapping = await ctx.task(mapInteractionNetworkTask, {
    phenomenon,
    observedBehavior,
    domain
  });

  // STAGE 2: METAPHORIC SIMULATION - Build metaphoric model and simulate
  ctx.log('info', 'Stage 2: Metaphoric simulation');
  const metaphorSelection = await ctx.task(selectMetaphorTask, {
    phenomenon,
    networkMapping,
    domain
  });

  const metaphoricSimulation = await ctx.task(runMetaphoricSimulationTask, {
    phenomenon,
    networkMapping,
    metaphor: metaphorSelection.selectedMetaphor,
    domain
  });

  await ctx.breakpoint({
    question: 'Network mapping and metaphoric simulation complete. Review before mechanism mining?',
    title: 'Mechanism Discovery - Stage 2 Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/network-mapping.json', format: 'json' },
        { path: 'artifacts/metaphoric-simulation.json', format: 'json' }
      ]
    }
  });

  // STAGE 3: DEGENERATE MINING - Search for multiple mechanisms producing same behavior
  ctx.log('info', 'Stage 3: Degenerate mechanism mining');
  const degenerateMining = await ctx.task(mineDegenerateMechanismsTask, {
    phenomenon,
    observedBehavior,
    networkMapping,
    metaphoricSimulation,
    domain
  });

  discoveredMechanisms.push(...degenerateMining.mechanisms);

  // STAGE 4: CONSTRAINT SCULPTING - Refine mechanisms through constraint analysis
  ctx.log('info', 'Stage 4: Constraint sculpting');
  const constraintSculpting = await ctx.task(sculptMechanismConstraintsTask, {
    mechanisms: discoveredMechanisms,
    phenomenon,
    observedBehavior,
    networkMapping,
    domain
  });

  // Update mechanisms with sculpted versions
  const sculptedMechanisms = constraintSculpting.sculptedMechanisms;

  // STAGE 5: INTEGRATE FINDINGS - Integrate all mechanism discoveries
  ctx.log('info', 'Stage 5: Integrating mechanism findings');
  const mechanismIntegration = await ctx.task(integrateMechanismFindingsTask, {
    originalMechanisms: discoveredMechanisms,
    sculptedMechanisms,
    networkMapping,
    metaphoricSimulation,
    domain
  });

  // STAGE 6: VALIDATE MECHANISMS - Validate discovered mechanisms
  ctx.log('info', 'Stage 6: Validating mechanisms');
  const mechanismValidation = await ctx.task(validateMechanismsTask, {
    mechanisms: mechanismIntegration.integratedMechanisms,
    phenomenon,
    observedBehavior,
    domain
  });

  // STAGE 7: SYNTHESIZE - Create comprehensive mechanism understanding
  ctx.log('info', 'Stage 7: Synthesizing mechanism discovery');
  const synthesis = await ctx.task(synthesizeMechanismDiscoveryTask, {
    phenomenon,
    networkMapping,
    metaphoricSimulation,
    degenerateMining,
    constraintSculpting,
    mechanismIntegration,
    mechanismValidation,
    domain
  });

  return {
    success: mechanismValidation.validMechanisms.length > 0,
    processId: 'domains/science/scientific-discovery/mechanism-discovery-protocol',
    phenomenon,
    domain,
    networkMapping,
    metaphoricSimulation,
    degenerateMining,
    constraintSculpting,
    discoveredMechanisms: mechanismIntegration.integratedMechanisms,
    mechanismNetwork: mechanismIntegration.mechanismNetwork,
    validation: mechanismValidation,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      networkNodes: networkMapping.nodes?.length || 0,
      mechanismsDiscovered: mechanismIntegration.integratedMechanisms?.length || 0,
      validMechanisms: mechanismValidation.validMechanisms?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const mapInteractionNetworkTask = defineTask('map-interaction-network', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Interaction Network',
  agent: {
    name: 'network-mapper',
    prompt: {
      role: 'network scientist',
      task: 'Map the interaction network underlying the phenomenon',
      context: args,
      instructions: [
        'Identify all entities/components involved',
        'Map interactions and connections',
        'Identify the types of interactions',
        'Document interaction strengths and directions',
        'Identify network motifs and patterns',
        'Find key nodes and hubs',
        'Create comprehensive network representation'
      ],
      outputFormat: 'JSON with nodes, edges, motifs, key nodes'
    },
    outputSchema: {
      type: 'object',
      required: ['nodes', 'edges'],
      properties: {
        nodes: { type: 'array', items: { type: 'object' } },
        edges: { type: 'array', items: { type: 'object' } },
        interactionTypes: { type: 'array', items: { type: 'string' } },
        motifs: { type: 'array', items: { type: 'object' } },
        keyNodes: { type: 'array', items: { type: 'object' } },
        networkProperties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'network-mapping']
}));

export const selectMetaphorTask = defineTask('select-metaphor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Metaphor for Simulation',
  agent: {
    name: 'metaphor-selector',
    prompt: {
      role: 'conceptual modeler',
      task: 'Select an appropriate metaphor for understanding the phenomenon',
      context: args,
      instructions: [
        'Consider multiple candidate metaphors',
        'Evaluate structural correspondence with phenomenon',
        'Assess explanatory potential',
        'Consider computational tractability',
        'Select the best metaphor',
        'Document the mapping rationale',
        'Note metaphor limitations'
      ],
      outputFormat: 'JSON with selected metaphor, mapping, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMetaphor', 'mapping'],
      properties: {
        selectedMetaphor: { type: 'object' },
        candidatesConsidered: { type: 'array', items: { type: 'object' } },
        mapping: { type: 'object' },
        rationale: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'metaphor-selection']
}));

export const runMetaphoricSimulationTask = defineTask('run-metaphoric-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Metaphoric Simulation',
  agent: {
    name: 'metaphor-simulator',
    prompt: {
      role: 'simulation scientist',
      task: 'Simulate the phenomenon using the metaphoric model',
      context: args,
      instructions: [
        'Build simulation model from metaphor',
        'Run simulation with various parameters',
        'Observe emergent behaviors',
        'Compare with observed phenomenon behavior',
        'Identify mechanism candidates from simulation',
        'Document simulation insights',
        'Note discrepancies and their implications'
      ],
      outputFormat: 'JSON with simulation results, emergent behaviors, mechanism candidates'
    },
    outputSchema: {
      type: 'object',
      required: ['simulationResults', 'emergentBehaviors'],
      properties: {
        simulationResults: { type: 'array', items: { type: 'object' } },
        emergentBehaviors: { type: 'array', items: { type: 'object' } },
        mechanismCandidates: { type: 'array', items: { type: 'object' } },
        phenomenonComparison: { type: 'object' },
        insights: { type: 'array', items: { type: 'string' } },
        discrepancies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'simulation']
}));

export const mineDegenerateMechanismsTask = defineTask('mine-degenerate-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine Degenerate Mechanisms',
  agent: {
    name: 'mechanism-miner',
    prompt: {
      role: 'mechanistic theorist',
      task: 'Search for multiple mechanisms that could produce the observed behavior',
      context: args,
      instructions: [
        'Generate diverse mechanism hypotheses',
        'Ensure each mechanism can produce observed behavior',
        'Explore structurally different mechanisms',
        'Consider network topology variations',
        'Use simulation insights to guide search',
        'Document mechanism assumptions',
        'Assess plausibility of each mechanism'
      ],
      outputFormat: 'JSON with mechanisms, structures, plausibility assessments'
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
              structure: { type: 'object' },
              howItWorks: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              plausibility: { type: 'number' }
            }
          }
        },
        searchStrategy: { type: 'string' },
        diversityAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'degenerate-mining']
}));

export const sculptMechanismConstraintsTask = defineTask('sculpt-mechanism-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sculpt Mechanism Constraints',
  agent: {
    name: 'constraint-sculptor',
    prompt: {
      role: 'constraint analyst',
      task: 'Refine mechanisms by sculpting with constraints',
      context: args,
      instructions: [
        'Start with over-constrained ideal mechanisms',
        'Gradually relax constraints to match observations',
        'Identify essential vs optional constraints',
        'Find minimal constraint sets for each mechanism',
        'Compare mechanisms by constraint profiles',
        'Identify constraint-based equivalences',
        'Document sculpting process'
      ],
      outputFormat: 'JSON with sculpted mechanisms, constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sculptedMechanisms', 'constraintAnalysis'],
      properties: {
        sculptedMechanisms: { type: 'array', items: { type: 'object' } },
        constraintAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanismId: { type: 'string' },
              essentialConstraints: { type: 'array', items: { type: 'string' } },
              relaxedConstraints: { type: 'array', items: { type: 'string' } },
              minimalSet: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        equivalences: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'constraint-sculpting']
}));

export const integrateMechanismFindingsTask = defineTask('integrate-mechanism-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Mechanism Findings',
  agent: {
    name: 'mechanism-integrator',
    prompt: {
      role: 'systems biologist',
      task: 'Integrate all mechanism findings into coherent understanding',
      context: args,
      instructions: [
        'Combine original and sculpted mechanisms',
        'Build mechanism relationship network',
        'Identify mechanism families',
        'Find common sub-mechanisms',
        'Document mechanism space structure',
        'Create integrated mechanism catalog',
        'Note unresolved questions'
      ],
      outputFormat: 'JSON with integrated mechanisms, network, families'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedMechanisms', 'mechanismNetwork'],
      properties: {
        integratedMechanisms: { type: 'array', items: { type: 'object' } },
        mechanismNetwork: { type: 'object' },
        mechanismFamilies: { type: 'array', items: { type: 'object' } },
        commonSubMechanisms: { type: 'array', items: { type: 'object' } },
        spaceStructure: { type: 'object' },
        unresolvedQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'integration']
}));

export const validateMechanismsTask = defineTask('validate-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Discovered Mechanisms',
  agent: {
    name: 'mechanism-validator',
    prompt: {
      role: 'experimental scientist',
      task: 'Validate discovered mechanisms against observations',
      context: args,
      instructions: [
        'Test each mechanism against observed behavior',
        'Check mechanism consistency',
        'Identify experimentally testable predictions',
        'Rate validation status of each mechanism',
        'Identify mechanisms needing more evidence',
        'Document validation criteria',
        'Propose discriminating tests'
      ],
      outputFormat: 'JSON with validation results, testable predictions, tests'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'validMechanisms'],
      properties: {
        validationResults: { type: 'array', items: { type: 'object' } },
        validMechanisms: { type: 'array', items: { type: 'object' } },
        invalidMechanisms: { type: 'array', items: { type: 'object' } },
        uncertainMechanisms: { type: 'array', items: { type: 'object' } },
        testablePredictions: { type: 'array', items: { type: 'object' } },
        discriminatingTests: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'validation']
}));

export const synthesizeMechanismDiscoveryTask = defineTask('synthesize-mechanism-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Mechanism Discovery',
  agent: {
    name: 'discovery-synthesizer',
    prompt: {
      role: 'scientific synthesizer',
      task: 'Synthesize the mechanism discovery process results',
      context: args,
      instructions: [
        'Summarize discovered mechanisms',
        'Document the discovery process insights',
        'Highlight key findings from each stage',
        'Assess overall understanding gained',
        'Provide experimental recommendations',
        'Note limitations and future directions',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        mechanismSummary: { type: 'object' },
        insights: { type: 'array', items: { type: 'string' } },
        stageFindings: { type: 'object' },
        understandingGained: { type: 'string' },
        experimentalRecommendations: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanism-discovery', 'synthesis']
}));
