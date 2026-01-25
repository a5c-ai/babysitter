/**
 * @process specializations/domains/science/scientific-discovery/narrative-causal-storytelling
 * @description Narrative Causal Storytelling - Build coherent time-ordered explanations connecting events
 * through causal chains, identify plot structures in scientific discoveries, and construct compelling
 * explanatory narratives that illuminate how and why sequences of events unfolded.
 * @inputs { events: object[], domain: string, purpose: string, temporalScope?: object, constraints?: object }
 * @outputs { success: boolean, narrative: object, causalChains: object[], plotStructure: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/narrative-causal-storytelling', {
 *   events: [{ time: '1900', event: 'Planck proposes quantum hypothesis' }, { time: '1905', event: 'Einstein photoelectric paper' }],
 *   domain: 'History of quantum physics',
 *   purpose: 'Explain the emergence of quantum mechanics',
 *   temporalScope: { start: '1900', end: '1930' }
 * });
 *
 * @references
 * - Narrative Explanation: https://plato.stanford.edu/entries/narrative/
 * - Causal Reasoning: https://plato.stanford.edu/entries/causation-metaphysics/
 * - Historical Explanation: https://plato.stanford.edu/entries/history/
 * - Philosophy of Historiography: https://plato.stanford.edu/entries/history-philosophy/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    events,
    domain,
    purpose,
    temporalScope = {},
    constraints = {}
  } = inputs;

  // Phase 1: Event Documentation and Ordering
  const eventDocumentation = await ctx.task(eventDocumentationTask, {
    events,
    domain,
    temporalScope
  });

  // Quality Gate: Must have sufficient events
  if (!eventDocumentation.orderedEvents || eventDocumentation.orderedEvents.length < 2) {
    return {
      success: false,
      error: 'Insufficient events for narrative construction',
      phase: 'event-documentation',
      narrative: null
    };
  }

  // Phase 2: Causal Connection Identification
  const causalConnections = await ctx.task(causalConnectionTask, {
    events: eventDocumentation.orderedEvents,
    domain
  });

  // Phase 3: Actor and Agency Analysis
  const actorAnalysis = await ctx.task(actorAgencyTask, {
    events: eventDocumentation.orderedEvents,
    causalConnections,
    domain
  });

  // Phase 4: Context and Setting Construction
  const contextConstruction = await ctx.task(contextSettingTask, {
    events: eventDocumentation.orderedEvents,
    domain,
    temporalScope
  });

  // Breakpoint: Review narrative elements
  await ctx.breakpoint({
    question: `Review narrative elements for "${purpose}". ${eventDocumentation.orderedEvents.length} events, ${causalConnections.connections?.length || 0} causal connections. Proceed?`,
    title: 'Narrative Elements Review',
    context: {
      runId: ctx.runId,
      purpose,
      eventCount: eventDocumentation.orderedEvents.length,
      connectionCount: causalConnections.connections?.length || 0,
      files: [{
        path: 'artifacts/narrative-elements.json',
        format: 'json',
        content: { eventDocumentation, causalConnections, actorAnalysis, contextConstruction }
      }]
    }
  });

  // Phase 5: Plot Structure Identification
  const plotStructure = await ctx.task(plotStructureTask, {
    events: eventDocumentation.orderedEvents,
    causalConnections,
    actorAnalysis,
    purpose
  });

  // Phase 6: Turning Points and Key Moments
  const turningPoints = await ctx.task(turningPointsTask, {
    events: eventDocumentation.orderedEvents,
    plotStructure,
    causalConnections
  });

  // Phase 7: Counterfactual Analysis
  const counterfactualAnalysis = await ctx.task(counterfactualTask, {
    events: eventDocumentation.orderedEvents,
    causalConnections,
    turningPoints
  });

  // Phase 8: Narrative Arc Construction
  const narrativeArc = await ctx.task(narrativeArcTask, {
    events: eventDocumentation.orderedEvents,
    plotStructure,
    turningPoints,
    causalConnections,
    actorAnalysis,
    purpose
  });

  // Phase 9: Coherence and Validity Check
  const coherenceCheck = await ctx.task(coherenceValidityTask, {
    narrative: narrativeArc,
    events: eventDocumentation.orderedEvents,
    causalConnections,
    counterfactualAnalysis
  });

  // Phase 10: Final Narrative Synthesis
  const narrativeSynthesis = await ctx.task(narrativeSynthesisTask, {
    events: eventDocumentation.orderedEvents,
    causalConnections,
    actorAnalysis,
    contextConstruction,
    plotStructure,
    turningPoints,
    counterfactualAnalysis,
    narrativeArc,
    coherenceCheck,
    purpose,
    domain
  });

  // Final Breakpoint: Narrative Approval
  await ctx.breakpoint({
    question: `Narrative construction complete for "${purpose}". Coherence score: ${coherenceCheck.coherenceScore}. Approve narrative?`,
    title: 'Narrative Approval',
    context: {
      runId: ctx.runId,
      purpose,
      coherenceScore: coherenceCheck.coherenceScore,
      narrativeLength: narrativeSynthesis.narrative?.fullNarrative?.length || 0,
      files: [
        { path: 'artifacts/narrative-report.json', format: 'json', content: narrativeSynthesis },
        { path: 'artifacts/narrative-report.md', format: 'markdown', content: narrativeSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    purpose,
    domain,
    narrative: narrativeSynthesis.narrative,
    causalChains: causalConnections.chains,
    plotStructure: plotStructure.structure,
    analysis: {
      events: eventDocumentation.orderedEvents,
      actors: actorAnalysis.actors,
      turningPoints: turningPoints.points,
      counterfactuals: counterfactualAnalysis.counterfactuals,
      context: contextConstruction.setting
    },
    coherence: coherenceCheck,
    recommendations: narrativeSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/narrative-causal-storytelling',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const eventDocumentationTask = defineTask('event-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Event Documentation and Ordering',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Historical Event Analyst',
      task: 'Document and order events for narrative construction',
      context: {
        events: args.events,
        domain: args.domain,
        temporalScope: args.temporalScope
      },
      instructions: [
        '1. Document each event with precise temporal markers',
        '2. Order events chronologically',
        '3. Identify event types (actions, states, processes, achievements)',
        '4. Identify missing events that need inference',
        '5. Distinguish foreground from background events',
        '6. Identify event granularity appropriate for narrative',
        '7. Note temporal relationships (simultaneous, overlapping, sequential)',
        '8. Identify event boundaries and durations',
        '9. Flag uncertain or contested event facts',
        '10. Create comprehensive event timeline'
      ],
      outputFormat: 'JSON object with documented and ordered events'
    },
    outputSchema: {
      type: 'object',
      required: ['orderedEvents'],
      properties: {
        orderedEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              event: { type: 'string' },
              time: { type: 'string' },
              duration: { type: 'string' },
              type: { type: 'string', enum: ['action', 'state', 'process', 'achievement'] },
              salience: { type: 'string', enum: ['foreground', 'background'] },
              certainty: { type: 'string', enum: ['certain', 'probable', 'uncertain'] }
            }
          }
        },
        inferredEvents: { type: 'array', items: { type: 'object' } },
        temporalRelationships: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'event-analysis', 'chronology']
}));

export const causalConnectionTask = defineTask('causal-connection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Causal Connection Identification',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Causal Reasoning Expert',
      task: 'Identify causal connections between events',
      context: {
        events: args.events,
        domain: args.domain
      },
      instructions: [
        '1. Identify direct causal links between events',
        '2. Distinguish causation from correlation and coincidence',
        '3. Identify causal mechanisms linking cause to effect',
        '4. Assess causal strength and necessity',
        '5. Identify multi-causal situations (multiple causes)',
        '6. Trace causal chains through multiple events',
        '7. Identify enabling conditions vs triggering causes',
        '8. Assess counterfactual dependencies',
        '9. Identify feedback loops and circular causation',
        '10. Document causal network structure'
      ],
      outputFormat: 'JSON object with causal connections'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'chains'],
      properties: {
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              effect: { type: 'string' },
              mechanism: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              type: { type: 'string', enum: ['triggering', 'enabling', 'contributing', 'necessary', 'sufficient'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        },
        chains: { type: 'array', items: { type: 'object' } },
        multiCausal: { type: 'array', items: { type: 'object' } },
        feedbackLoops: { type: 'array', items: { type: 'object' } },
        causalNetwork: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'causation', 'causal-reasoning']
}));

export const actorAgencyTask = defineTask('actor-agency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Actor and Agency Analysis',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Narrative Agency Analyst',
      task: 'Analyze actors and their agency in the narrative',
      context: {
        events: args.events,
        causalConnections: args.causalConnections,
        domain: args.domain
      },
      instructions: [
        '1. Identify all actors (individuals, groups, institutions)',
        '2. Characterize each actor\'s role in events',
        '3. Assess degree of agency each actor exercises',
        '4. Identify protagonist and antagonist roles',
        '5. Analyze motivations driving actor behavior',
        '6. Identify actor interactions and relationships',
        '7. Assess how structural factors constrain agency',
        '8. Identify actor transformations through narrative',
        '9. Analyze collective agency and coordination',
        '10. Map actor influence on outcomes'
      ],
      outputFormat: 'JSON object with actor analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['actors'],
      properties: {
        actors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['individual', 'group', 'institution', 'other'] },
              role: { type: 'string', enum: ['protagonist', 'antagonist', 'supporting', 'background'] },
              agency: { type: 'string', enum: ['high', 'medium', 'low'] },
              motivations: { type: 'array', items: { type: 'string' } },
              eventsInvolved: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        structuralConstraints: { type: 'array', items: { type: 'object' } },
        actorTransformations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'actors', 'agency']
}));

export const contextSettingTask = defineTask('context-setting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Context and Setting Construction',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Contextual Setting Expert',
      task: 'Construct the context and setting for the narrative',
      context: {
        events: args.events,
        domain: args.domain,
        temporalScope: args.temporalScope
      },
      instructions: [
        '1. Describe the physical/geographical setting',
        '2. Characterize the temporal context (era, period)',
        '3. Describe relevant social and cultural conditions',
        '4. Identify political and institutional context',
        '5. Characterize intellectual and ideological climate',
        '6. Identify technological context and constraints',
        '7. Describe economic conditions affecting events',
        '8. Identify relevant ongoing processes and trends',
        '9. Note what was possible/impossible in this context',
        '10. Create vivid setting description'
      ],
      outputFormat: 'JSON object with context and setting'
    },
    outputSchema: {
      type: 'object',
      required: ['setting'],
      properties: {
        setting: {
          type: 'object',
          properties: {
            physical: { type: 'string' },
            temporal: { type: 'string' },
            social: { type: 'string' },
            political: { type: 'string' },
            intellectual: { type: 'string' },
            technological: { type: 'string' },
            economic: { type: 'string' }
          }
        },
        backgroundProcesses: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'string' } },
        possibilities: { type: 'array', items: { type: 'string' } },
        settingDescription: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'context', 'setting']
}));

export const plotStructureTask = defineTask('plot-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Plot Structure Identification',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Narrative Structure Analyst',
      task: 'Identify the plot structure of the narrative',
      context: {
        events: args.events,
        causalConnections: args.causalConnections,
        actorAnalysis: args.actorAnalysis,
        purpose: args.purpose
      },
      instructions: [
        '1. Identify the narrative arc type (tragedy, comedy, quest, etc.)',
        '2. Locate the exposition/setup phase',
        '3. Identify rising action and complications',
        '4. Locate the climax or crisis point',
        '5. Identify falling action and resolution',
        '6. Identify subplots and how they relate to main plot',
        '7. Analyze narrative tension and its sources',
        '8. Identify the central conflict or problem',
        '9. Assess how plot serves the narrative purpose',
        '10. Document the complete plot structure'
      ],
      outputFormat: 'JSON object with plot structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            arcType: { type: 'string' },
            exposition: { type: 'object' },
            risingAction: { type: 'array', items: { type: 'object' } },
            climax: { type: 'object' },
            fallingAction: { type: 'array', items: { type: 'object' } },
            resolution: { type: 'object' }
          }
        },
        subplots: { type: 'array', items: { type: 'object' } },
        centralConflict: { type: 'object' },
        tensionSources: { type: 'array', items: { type: 'object' } },
        purposeAlignment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'plot-structure', 'story-arc']
}));

export const turningPointsTask = defineTask('turning-points', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Turning Points and Key Moments',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Critical Moment Analyst',
      task: 'Identify turning points and key moments',
      context: {
        events: args.events,
        plotStructure: args.plotStructure,
        causalConnections: args.causalConnections
      },
      instructions: [
        '1. Identify major turning points where trajectory changed',
        '2. Identify moments of decision that shaped outcomes',
        '3. Locate points of no return',
        '4. Identify surprises and unexpected developments',
        '5. Locate moments of revelation or discovery',
        '6. Identify moments of crisis and their resolution',
        '7. Assess why each turning point matters',
        '8. Identify what would have happened otherwise',
        '9. Rank turning points by significance',
        '10. Document key moments with their implications'
      ],
      outputFormat: 'JSON object with turning points'
    },
    outputSchema: {
      type: 'object',
      required: ['points'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              event: { type: 'string' },
              type: { type: 'string', enum: ['turning-point', 'decision', 'no-return', 'surprise', 'revelation', 'crisis'] },
              significance: { type: 'string' },
              alternative: { type: 'string' },
              rank: { type: 'number' }
            }
          }
        },
        mostCritical: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'turning-points', 'key-moments']
}));

export const counterfactualTask = defineTask('counterfactual', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Counterfactual Analysis',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Counterfactual Reasoning Expert',
      task: 'Analyze counterfactual scenarios to strengthen causal narrative',
      context: {
        events: args.events,
        causalConnections: args.causalConnections,
        turningPoints: args.turningPoints
      },
      instructions: [
        '1. Identify key counterfactual questions',
        '2. Analyze what would have happened if turning points differed',
        '3. Assess necessity of key causes',
        '4. Identify close possible alternatives',
        '5. Assess robustness of outcome to variations',
        '6. Identify contingent vs overdetermined outcomes',
        '7. Use counterfactuals to test causal claims',
        '8. Identify path dependencies',
        '9. Assess plausibility of counterfactual scenarios',
        '10. Document counterfactual insights'
      ],
      outputFormat: 'JSON object with counterfactual analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['counterfactuals'],
      properties: {
        counterfactuals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              antecedent: { type: 'string' },
              consequent: { type: 'string' },
              plausibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              insight: { type: 'string' }
            }
          }
        },
        pathDependencies: { type: 'array', items: { type: 'object' } },
        overdeterminedOutcomes: { type: 'array', items: { type: 'string' } },
        contingentOutcomes: { type: 'array', items: { type: 'string' } },
        robustnessAssessment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'counterfactual', 'causation']
}));

export const narrativeArcTask = defineTask('narrative-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Narrative Arc Construction',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Narrative Arc Constructor',
      task: 'Construct the complete narrative arc',
      context: {
        events: args.events,
        plotStructure: args.plotStructure,
        turningPoints: args.turningPoints,
        causalConnections: args.causalConnections,
        actorAnalysis: args.actorAnalysis,
        purpose: args.purpose
      },
      instructions: [
        '1. Craft compelling opening that establishes context',
        '2. Develop rising action with appropriate pacing',
        '3. Build tension toward climax',
        '4. Construct climactic moment effectively',
        '5. Develop resolution that satisfies narrative',
        '6. Integrate causal explanation with narrative flow',
        '7. Balance showing vs telling',
        '8. Use concrete details for vividness',
        '9. Ensure narrative coherence and flow',
        '10. Craft conclusion that addresses purpose'
      ],
      outputFormat: 'JSON object with narrative arc'
    },
    outputSchema: {
      type: 'object',
      required: ['arc'],
      properties: {
        arc: {
          type: 'object',
          properties: {
            opening: { type: 'string' },
            developement: { type: 'array', items: { type: 'string' } },
            climax: { type: 'string' },
            resolution: { type: 'string' },
            conclusion: { type: 'string' }
          }
        },
        pacing: { type: 'object' },
        tensionCurve: { type: 'array', items: { type: 'object' } },
        narrativeVoice: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'arc-construction', 'storytelling']
}));

export const coherenceValidityTask = defineTask('coherence-validity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Coherence and Validity Check',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Narrative Coherence Validator',
      task: 'Check narrative coherence and validity',
      context: {
        narrative: args.narrative,
        events: args.events,
        causalConnections: args.causalConnections,
        counterfactualAnalysis: args.counterfactualAnalysis
      },
      instructions: [
        '1. Check temporal consistency of narrative',
        '2. Verify causal claims are supported',
        '3. Check for gaps or unexplained jumps',
        '4. Verify factual accuracy of claims',
        '5. Check internal consistency of narrative',
        '6. Assess whether explanation is complete',
        '7. Check for over-simplification or distortion',
        '8. Verify appropriate uncertainty acknowledgment',
        '9. Calculate overall coherence score',
        '10. Document validity concerns'
      ],
      outputFormat: 'JSON object with coherence check'
    },
    outputSchema: {
      type: 'object',
      required: ['coherenceScore'],
      properties: {
        temporalConsistency: { type: 'boolean' },
        causalSupport: { type: 'string', enum: ['strong', 'adequate', 'weak'] },
        gaps: { type: 'array', items: { type: 'object' } },
        factualAccuracy: { type: 'string', enum: ['verified', 'mostly-verified', 'uncertain'] },
        internalConsistency: { type: 'boolean' },
        completeness: { type: 'string', enum: ['complete', 'mostly-complete', 'incomplete'] },
        oversimplifications: { type: 'array', items: { type: 'string' } },
        uncertaintyAcknowledged: { type: 'boolean' },
        coherenceScore: { type: 'number', minimum: 0, maximum: 100 },
        validityConcerns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'coherence', 'validation']
}));

export const narrativeSynthesisTask = defineTask('narrative-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Final Narrative Synthesis',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'narrative-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Narrative Synthesist',
      task: 'Synthesize all elements into final narrative',
      context: {
        events: args.events,
        causalConnections: args.causalConnections,
        actorAnalysis: args.actorAnalysis,
        contextConstruction: args.contextConstruction,
        plotStructure: args.plotStructure,
        turningPoints: args.turningPoints,
        counterfactualAnalysis: args.counterfactualAnalysis,
        narrativeArc: args.narrativeArc,
        coherenceCheck: args.coherenceCheck,
        purpose: args.purpose,
        domain: args.domain
      },
      instructions: [
        '1. Integrate all narrative elements into cohesive story',
        '2. Write full narrative text',
        '3. Include causal explanations naturally',
        '4. Ensure narrative serves stated purpose',
        '5. Add appropriate qualifications and nuance',
        '6. Include key insights and lessons',
        '7. Provide executive summary',
        '8. List key takeaways',
        '9. Provide recommendations for use',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with final narrative'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'recommendations', 'markdown'],
      properties: {
        narrative: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            executiveSummary: { type: 'string' },
            fullNarrative: { type: 'string' },
            keyInsights: { type: 'array', items: { type: 'string' } },
            lessons: { type: 'array', items: { type: 'string' } }
          }
        },
        takeaways: { type: 'array', items: { type: 'object' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['narrative', 'synthesis', 'storytelling']
}));
