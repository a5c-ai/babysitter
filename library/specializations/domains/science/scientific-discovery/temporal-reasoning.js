/**
 * @process specializations/domains/science/scientific-discovery/temporal-reasoning
 * @description Temporal Reasoning - Reason systematically about ordering, duration, persistence, and change
 * over time, including temporal intervals, sequences, causation across time, and dynamic processes in
 * scientific discovery, experimental planning, and historical analysis.
 * @inputs { events: object[], temporalQueries: string[], timeframe?: object, constraints?: object }
 * @outputs { success: boolean, temporalAnalysis: object, timeline: object, inferences: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/temporal-reasoning', {
 *   events: [{ event: 'Experiment started', time: 'T0' }, { event: 'Observation recorded', time: 'T0+24h' }],
 *   temporalQueries: ['What must happen before measurement?', 'How long is the minimum incubation period?'],
 *   timeframe: { start: 'Day 1', end: 'Day 30' }
 * });
 *
 * @references
 * - Temporal Logic: https://plato.stanford.edu/entries/logic-temporal/
 * - Time in Physics: https://plato.stanford.edu/entries/time/
 * - Allen's Interval Algebra: https://www.sciencedirect.com/topics/computer-science/allen-algebra
 * - Temporal Reasoning in AI: https://www.sciencedirect.com/topics/computer-science/temporal-reasoning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    events,
    temporalQueries,
    timeframe = {},
    constraints = {}
  } = inputs;

  // Phase 1: Event Temporal Annotation
  const eventAnnotation = await ctx.task(eventAnnotationTask, {
    events,
    timeframe
  });

  // Quality Gate: Events must be temporally annotated
  if (!eventAnnotation.annotatedEvents || eventAnnotation.annotatedEvents.length === 0) {
    return {
      success: false,
      error: 'Events cannot be temporally annotated',
      phase: 'event-annotation',
      temporalAnalysis: null
    };
  }

  // Phase 2: Temporal Relation Extraction
  const temporalRelations = await ctx.task(temporalRelationTask, {
    events: eventAnnotation.annotatedEvents,
    constraints
  });

  // Phase 3: Interval Analysis
  const intervalAnalysis = await ctx.task(intervalAnalysisTask, {
    events: eventAnnotation.annotatedEvents,
    relations: temporalRelations.relations
  });

  // Phase 4: Ordering and Precedence Analysis
  const orderingAnalysis = await ctx.task(orderingAnalysisTask, {
    events: eventAnnotation.annotatedEvents,
    relations: temporalRelations.relations,
    intervals: intervalAnalysis.intervals
  });

  // Breakpoint: Review temporal structure
  await ctx.breakpoint({
    question: `Review temporal structure. ${eventAnnotation.annotatedEvents.length} events, ${temporalRelations.relations?.length || 0} relations. Continue analysis?`,
    title: 'Temporal Structure Review',
    context: {
      runId: ctx.runId,
      eventCount: eventAnnotation.annotatedEvents.length,
      relationCount: temporalRelations.relations?.length || 0,
      files: [{
        path: 'artifacts/temporal-structure.json',
        format: 'json',
        content: { eventAnnotation, temporalRelations, intervalAnalysis, orderingAnalysis }
      }]
    }
  });

  // Phase 5: Duration and Persistence Analysis
  const durationAnalysis = await ctx.task(durationPersistenceTask, {
    events: eventAnnotation.annotatedEvents,
    intervals: intervalAnalysis.intervals,
    constraints
  });

  // Phase 6: Temporal Causation Analysis
  const causalAnalysis = await ctx.task(temporalCausationTask, {
    events: eventAnnotation.annotatedEvents,
    ordering: orderingAnalysis.ordering,
    relations: temporalRelations.relations
  });

  // Phase 7: Change and State Transition Analysis
  const changeAnalysis = await ctx.task(changeTransitionTask, {
    events: eventAnnotation.annotatedEvents,
    causal: causalAnalysis,
    durations: durationAnalysis.durations
  });

  // Phase 8: Temporal Query Resolution
  const queryResolution = await ctx.task(temporalQueryTask, {
    queries: temporalQueries,
    events: eventAnnotation.annotatedEvents,
    relations: temporalRelations.relations,
    ordering: orderingAnalysis.ordering,
    durations: durationAnalysis.durations,
    causal: causalAnalysis
  });

  // Phase 9: Timeline Construction
  const timelineConstruction = await ctx.task(timelineConstructionTask, {
    events: eventAnnotation.annotatedEvents,
    relations: temporalRelations.relations,
    ordering: orderingAnalysis.ordering,
    intervals: intervalAnalysis.intervals,
    timeframe
  });

  // Phase 10: Temporal Synthesis
  const temporalSynthesis = await ctx.task(temporalSynthesisTask, {
    events: eventAnnotation.annotatedEvents,
    relations: temporalRelations.relations,
    intervals: intervalAnalysis.intervals,
    ordering: orderingAnalysis.ordering,
    durations: durationAnalysis,
    causal: causalAnalysis,
    changes: changeAnalysis,
    queryAnswers: queryResolution.answers,
    timeline: timelineConstruction.timeline,
    temporalQueries
  });

  // Final Breakpoint: Temporal Analysis Approval
  await ctx.breakpoint({
    question: `Temporal analysis complete. ${queryResolution.answers?.length || 0} queries resolved. Approve analysis?`,
    title: 'Temporal Analysis Approval',
    context: {
      runId: ctx.runId,
      queryCount: temporalQueries.length,
      answeredCount: queryResolution.answers?.length || 0,
      files: [
        { path: 'artifacts/temporal-report.json', format: 'json', content: temporalSynthesis },
        { path: 'artifacts/temporal-report.md', format: 'markdown', content: temporalSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    temporalAnalysis: {
      events: eventAnnotation.annotatedEvents,
      relations: temporalRelations.relations,
      intervals: intervalAnalysis.intervals,
      ordering: orderingAnalysis.ordering,
      durations: durationAnalysis.durations,
      causation: causalAnalysis,
      changes: changeAnalysis.transitions
    },
    timeline: timelineConstruction.timeline,
    inferences: temporalSynthesis.inferences,
    queryAnswers: queryResolution.answers,
    recommendations: temporalSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/temporal-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const eventAnnotationTask = defineTask('event-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Event Temporal Annotation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Annotation Expert',
      task: 'Annotate events with temporal information',
      context: {
        events: args.events,
        timeframe: args.timeframe
      },
      instructions: [
        '1. Parse temporal expressions in events',
        '2. Assign temporal anchors where possible',
        '3. Identify event types (instantaneous, durative)',
        '4. Extract explicit temporal information',
        '5. Infer implicit temporal information',
        '6. Normalize temporal references',
        '7. Identify temporal granularity',
        '8. Handle vague temporal references',
        '9. Identify recurring events',
        '10. Document temporal annotations'
      ],
      outputFormat: 'JSON object with annotated events'
    },
    outputSchema: {
      type: 'object',
      required: ['annotatedEvents'],
      properties: {
        annotatedEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              event: { type: 'string' },
              temporalType: { type: 'string', enum: ['instantaneous', 'durative', 'recurring', 'state'] },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              duration: { type: 'string' },
              granularity: { type: 'string', enum: ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'] },
              anchored: { type: 'boolean' },
              vagueness: { type: 'string', enum: ['precise', 'approximate', 'vague'] }
            }
          }
        },
        temporalExpressions: { type: 'array', items: { type: 'object' } },
        inferredTimes: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'annotation', 'events']
}));

export const temporalRelationTask = defineTask('temporal-relation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Temporal Relation Extraction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Relation Expert',
      task: 'Extract temporal relations between events using Allen\'s interval algebra',
      context: {
        events: args.events,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify Allen temporal relations (before, after, meets, overlaps, etc.)',
        '2. Extract explicit temporal relations from text',
        '3. Infer implicit temporal relations',
        '4. Apply transitivity rules for derived relations',
        '5. Handle uncertain relations',
        '6. Identify point relations where applicable',
        '7. Check relation consistency',
        '8. Identify relation constraints',
        '9. Document relation confidence',
        '10. Build temporal relation network'
      ],
      outputFormat: 'JSON object with temporal relations'
    },
    outputSchema: {
      type: 'object',
      required: ['relations'],
      properties: {
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event1: { type: 'string' },
              relation: { type: 'string', enum: ['before', 'after', 'meets', 'met-by', 'overlaps', 'overlapped-by', 'starts', 'started-by', 'during', 'contains', 'finishes', 'finished-by', 'equals'] },
              event2: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              source: { type: 'string', enum: ['explicit', 'inferred', 'default'] }
            }
          }
        },
        relationNetwork: { type: 'object' },
        consistencyStatus: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'relations', 'allen-algebra']
}));

export const intervalAnalysisTask = defineTask('interval-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Interval Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Interval Analysis Expert',
      task: 'Analyze temporal intervals and their properties',
      context: {
        events: args.events,
        relations: args.relations
      },
      instructions: [
        '1. Construct intervals for durative events',
        '2. Identify interval boundaries',
        '3. Calculate interval lengths',
        '4. Identify interval overlaps',
        '5. Find gaps between intervals',
        '6. Identify interval containment',
        '7. Analyze interval patterns',
        '8. Identify concurrent intervals',
        '9. Compute interval unions and intersections',
        '10. Document interval analysis'
      ],
      outputFormat: 'JSON object with interval analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['intervals'],
      properties: {
        intervals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              start: { type: 'string' },
              end: { type: 'string' },
              length: { type: 'string' },
              bounded: { type: 'boolean' }
            }
          }
        },
        overlaps: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        concurrentSets: { type: 'array', items: { type: 'array' } },
        patterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'intervals', 'analysis']
}));

export const orderingAnalysisTask = defineTask('ordering-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Ordering and Precedence Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Ordering Expert',
      task: 'Analyze temporal ordering and precedence',
      context: {
        events: args.events,
        relations: args.relations,
        intervals: args.intervals
      },
      instructions: [
        '1. Construct total ordering where possible',
        '2. Identify partial orderings',
        '3. Find precedence relationships',
        '4. Identify branching points',
        '5. Detect cycles in temporal constraints',
        '6. Identify simultaneity',
        '7. Construct ordered event sequence',
        '8. Handle uncertain orderings',
        '9. Identify minimal and maximal elements',
        '10. Document ordering analysis'
      ],
      outputFormat: 'JSON object with ordering analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['ordering'],
      properties: {
        ordering: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['total', 'partial', 'branching'] },
            sequence: { type: 'array', items: { type: 'string' } },
            precedences: { type: 'array', items: { type: 'object' } }
          }
        },
        partialOrderGroups: { type: 'array', items: { type: 'array' } },
        simultaneousEvents: { type: 'array', items: { type: 'array' } },
        cycles: { type: 'array', items: { type: 'object' } },
        uncertainOrderings: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'ordering', 'precedence']
}));

export const durationPersistenceTask = defineTask('duration-persistence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Duration and Persistence Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Duration and Persistence Expert',
      task: 'Analyze durations and persistence of states/events',
      context: {
        events: args.events,
        intervals: args.intervals,
        constraints: args.constraints
      },
      instructions: [
        '1. Calculate event and state durations',
        '2. Analyze persistence of conditions',
        '3. Identify frame axiom requirements',
        '4. Analyze state inertia',
        '5. Identify duration constraints',
        '6. Analyze temporal extent of effects',
        '7. Identify persistence conditions',
        '8. Analyze duration patterns',
        '9. Handle duration uncertainty',
        '10. Document duration analysis'
      ],
      outputFormat: 'JSON object with duration analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['durations'],
      properties: {
        durations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              duration: { type: 'string' },
              unit: { type: 'string' },
              minDuration: { type: 'string' },
              maxDuration: { type: 'string' },
              uncertain: { type: 'boolean' }
            }
          }
        },
        persistentStates: { type: 'array', items: { type: 'object' } },
        durationConstraints: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'duration', 'persistence']
}));

export const temporalCausationTask = defineTask('temporal-causation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Temporal Causation Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Causation Expert',
      task: 'Analyze causal relationships across time',
      context: {
        events: args.events,
        ordering: args.ordering,
        relations: args.relations
      },
      instructions: [
        '1. Identify potential causal relationships',
        '2. Verify temporal precedence for causation',
        '3. Analyze causal chains',
        '4. Identify causal gaps',
        '5. Analyze delay in causal effects',
        '6. Identify causal loops',
        '7. Distinguish correlation from causation',
        '8. Analyze interventions and their effects',
        '9. Identify counterfactual dependencies',
        '10. Document causal analysis'
      ],
      outputFormat: 'JSON object with temporal causation'
    },
    outputSchema: {
      type: 'object',
      required: ['causalRelations'],
      properties: {
        causalRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              effect: { type: 'string' },
              delay: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              mechanism: { type: 'string' }
            }
          }
        },
        causalChains: { type: 'array', items: { type: 'array' } },
        causalGaps: { type: 'array', items: { type: 'object' } },
        causalLoops: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'causation', 'causal-chains']
}));

export const changeTransitionTask = defineTask('change-transition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Change and State Transition Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Change Analysis Expert',
      task: 'Analyze changes and state transitions over time',
      context: {
        events: args.events,
        causal: args.causal,
        durations: args.durations
      },
      instructions: [
        '1. Identify state changes',
        '2. Analyze state transitions',
        '3. Identify transition triggers',
        '4. Analyze change magnitude',
        '5. Identify gradual vs sudden changes',
        '6. Analyze change direction',
        '7. Identify reversible vs irreversible changes',
        '8. Analyze change patterns',
        '9. Identify stable states',
        '10. Document change analysis'
      ],
      outputFormat: 'JSON object with change analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['transitions'],
      properties: {
        transitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromState: { type: 'string' },
              toState: { type: 'string' },
              trigger: { type: 'string' },
              time: { type: 'string' },
              type: { type: 'string', enum: ['gradual', 'sudden', 'continuous'] },
              reversible: { type: 'boolean' }
            }
          }
        },
        stableStates: { type: 'array', items: { type: 'object' } },
        changePatterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'change', 'transitions']
}));

export const temporalQueryTask = defineTask('temporal-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Temporal Query Resolution',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Query Expert',
      task: 'Resolve temporal queries using analysis results',
      context: {
        queries: args.queries,
        events: args.events,
        relations: args.relations,
        ordering: args.ordering,
        durations: args.durations,
        causal: args.causal
      },
      instructions: [
        '1. Parse each temporal query',
        '2. Identify query type (when, how long, what order, etc.)',
        '3. Map query to relevant temporal structures',
        '4. Compute query answers from analysis',
        '5. Handle uncertain answers',
        '6. Provide confidence estimates',
        '7. Identify queries that cannot be answered',
        '8. Suggest how to obtain missing information',
        '9. Format answers appropriately',
        '10. Document query resolution'
      ],
      outputFormat: 'JSON object with query answers'
    },
    outputSchema: {
      type: 'object',
      required: ['answers'],
      properties: {
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              queryType: { type: 'string', enum: ['when', 'duration', 'ordering', 'relation', 'causation', 'change'] },
              answer: { type: 'string' },
              confidence: { type: 'string', enum: ['certain', 'probable', 'uncertain', 'unknown'] },
              supporting: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        unanswerableQueries: { type: 'array', items: { type: 'object' } },
        missingInformation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'query', 'resolution']
}));

export const timelineConstructionTask = defineTask('timeline-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Timeline Construction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Timeline Construction Expert',
      task: 'Construct comprehensive timeline from temporal analysis',
      context: {
        events: args.events,
        relations: args.relations,
        ordering: args.ordering,
        intervals: args.intervals,
        timeframe: args.timeframe
      },
      instructions: [
        '1. Order events into timeline',
        '2. Position events on time scale',
        '3. Indicate intervals and durations',
        '4. Mark key temporal landmarks',
        '5. Show parallel tracks if needed',
        '6. Indicate uncertainty in timeline',
        '7. Add temporal annotations',
        '8. Segment timeline into phases',
        '9. Add causal connections',
        '10. Create timeline visualization specification'
      ],
      outputFormat: 'JSON object with timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline'],
      properties: {
        timeline: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            scale: { type: 'string' },
            events: { type: 'array', items: { type: 'object' } },
            phases: { type: 'array', items: { type: 'object' } },
            landmarks: { type: 'array', items: { type: 'object' } }
          }
        },
        parallelTracks: { type: 'array', items: { type: 'object' } },
        visualizationSpec: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'timeline', 'visualization']
}));

export const temporalSynthesisTask = defineTask('temporal-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Temporal Synthesis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'temporal-logic-analyst',
    skills: ['formal-logic-reasoner', 'causal-inference-engine'],
    prompt: {
      role: 'Temporal Analysis Synthesist',
      task: 'Synthesize temporal analysis into comprehensive conclusions',
      context: {
        events: args.events,
        relations: args.relations,
        intervals: args.intervals,
        ordering: args.ordering,
        durations: args.durations,
        causal: args.causal,
        changes: args.changes,
        queryAnswers: args.queryAnswers,
        timeline: args.timeline,
        temporalQueries: args.temporalQueries
      },
      instructions: [
        '1. Synthesize all temporal analyses',
        '2. Generate temporal inferences',
        '3. Summarize key temporal findings',
        '4. Identify temporal patterns',
        '5. Provide temporal predictions',
        '6. Highlight temporal uncertainties',
        '7. Provide recommendations',
        '8. Note limitations of analysis',
        '9. Suggest further temporal investigation',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with temporal synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'recommendations', 'markdown'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inference: { type: 'string' },
              type: { type: 'string', enum: ['ordering', 'duration', 'causation', 'pattern', 'prediction'] },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'object' } },
        predictions: { type: 'array', items: { type: 'object' } },
        uncertainties: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['temporal-reasoning', 'synthesis', 'conclusions']
}));
