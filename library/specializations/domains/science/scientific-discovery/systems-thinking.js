/**
 * @process specializations/domains/science/scientific-discovery/systems-thinking
 * @description Systems Thinking Process - Reason about feedback loops, delays, emergence,
 * and complex system dynamics to understand interconnected wholes rather than isolated parts.
 * @inputs { domain: string, system: object, question: string, perspective?: string }
 * @outputs { success: boolean, systemAnalysis: object, dynamics: object, leveragePoints: object[], insights: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/systems-thinking', {
 *   domain: 'Urban Planning',
 *   system: { name: 'city_traffic', components: ['roads', 'vehicles', 'signals', 'public_transit'] },
 *   question: 'Why does adding roads often increase congestion?',
 *   perspective: 'long-term sustainability'
 * });
 *
 * @references
 * - Meadows (2008). Thinking in Systems: A Primer
 * - Sterman (2000). Business Dynamics: Systems Thinking and Modeling for a Complex World
 * - Senge (1990). The Fifth Discipline
 * - Forrester (1961). Industrial Dynamics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    system,
    question,
    perspective = 'holistic'
  } = inputs;

  // Phase 1: System Boundary Definition
  const boundaryDefinition = await ctx.task(boundaryDefinitionTask, {
    domain,
    system,
    question,
    perspective
  });

  // Phase 2: Stock and Flow Identification
  const stockFlowAnalysis = await ctx.task(stockFlowAnalysisTask, {
    domain,
    system,
    boundaryDefinition
  });

  // Phase 3: Feedback Loop Mapping
  const feedbackMapping = await ctx.task(feedbackMappingTask, {
    stockFlowAnalysis,
    system,
    domain
  });

  // Quality Gate: Must identify feedback loops
  if (!feedbackMapping.loops || feedbackMapping.loops.length === 0) {
    await ctx.breakpoint({
      question: `No feedback loops identified in system. This may indicate a non-systemic problem. Continue with linear analysis or revise system definition?`,
      title: 'Feedback Loop Gap',
      context: {
        runId: ctx.runId,
        system: system.name,
        recommendation: 'Consider expanding system boundary or identifying hidden loops'
      }
    });
  }

  // Phase 4: Delay Identification
  const delayAnalysis = await ctx.task(delayIdentificationTask, {
    feedbackMapping,
    stockFlowAnalysis,
    domain
  });

  // Phase 5: Nonlinearity and Threshold Analysis
  const nonlinearityAnalysis = await ctx.task(nonlinearityAnalysisTask, {
    stockFlowAnalysis,
    feedbackMapping,
    domain
  });

  // Phase 6: Emergence Analysis
  const emergenceAnalysis = await ctx.task(emergenceAnalysisTask, {
    feedbackMapping,
    nonlinearityAnalysis,
    system,
    domain
  });

  // Phase 7: System Archetype Identification
  const archetypeAnalysis = await ctx.task(archetypeIdentificationTask, {
    feedbackMapping,
    delayAnalysis,
    stockFlowAnalysis,
    domain
  });

  // Breakpoint: Review system structure
  await ctx.breakpoint({
    question: `System structure mapped with ${feedbackMapping.loops.length} feedback loops and ${archetypeAnalysis.archetypes.length} system archetypes identified. Review causal loop diagram?`,
    title: 'System Structure Review',
    context: {
      runId: ctx.runId,
      domain,
      loops: feedbackMapping.loops.map(l => l.name),
      archetypes: archetypeAnalysis.archetypes.map(a => a.name)
    }
  });

  // Phase 8: Dynamic Behavior Analysis
  const dynamicBehavior = await ctx.task(dynamicBehaviorAnalysisTask, {
    feedbackMapping,
    delayAnalysis,
    nonlinearityAnalysis,
    question
  });

  // Phase 9: Leverage Point Identification
  const leveragePoints = await ctx.task(leveragePointIdentificationTask, {
    feedbackMapping,
    archetypeAnalysis,
    dynamicBehavior,
    stockFlowAnalysis,
    domain
  });

  // Phase 10: Mental Model Analysis
  const mentalModelAnalysis = await ctx.task(mentalModelAnalysisTask, {
    question,
    feedbackMapping,
    dynamicBehavior,
    perspective
  });

  // Phase 11: Insight Synthesis
  const insightSynthesis = await ctx.task(systemsInsightSynthesisTask, {
    feedbackMapping,
    delayAnalysis,
    emergenceAnalysis,
    archetypeAnalysis,
    dynamicBehavior,
    leveragePoints,
    mentalModelAnalysis,
    question,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Systems thinking analysis complete. Primary insight: ${insightSynthesis.primaryInsight}. Accept analysis?`,
    title: 'Systems Thinking Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/system-dynamics.json', format: 'json', content: feedbackMapping },
        { path: 'artifacts/leverage-points.json', format: 'json', content: leveragePoints }
      ]
    }
  });

  return {
    success: true,
    domain,
    question,
    systemAnalysis: {
      boundary: boundaryDefinition,
      stocksAndFlows: stockFlowAnalysis,
      feedbackLoops: feedbackMapping.loops,
      delays: delayAnalysis.delays,
      nonlinearities: nonlinearityAnalysis.nonlinearities
    },
    dynamics: {
      behavior: dynamicBehavior,
      emergence: emergenceAnalysis,
      archetypes: archetypeAnalysis.archetypes
    },
    leveragePoints: leveragePoints.points,
    mentalModels: mentalModelAnalysis,
    insights: insightSynthesis,
    recommendations: insightSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/systems-thinking',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const boundaryDefinitionTask = defineTask('boundary-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Boundary Definition - ${args.domain}`,
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'],
    prompt: {
      role: 'Expert in systems thinking and system dynamics',
      task: 'Define the system boundary for analysis',
      context: {
        domain: args.domain,
        system: args.system,
        question: args.question,
        perspective: args.perspective
      },
      instructions: [
        '1. Define what is inside vs outside the system',
        '2. Identify key components/elements within boundary',
        '3. Identify key exogenous variables (outside influences)',
        '4. Justify boundary choices based on the question',
        '5. Consider appropriate time horizon',
        '6. Consider appropriate spatial scope',
        '7. Identify stakeholders and their perspectives',
        '8. Note what the boundary excludes and why',
        '9. Consider alternative boundary definitions',
        '10. Document boundary assumptions'
      ],
      outputFormat: 'JSON object with system boundary definition'
    },
    outputSchema: {
      type: 'object',
      required: ['boundary', 'components', 'exogenousVariables'],
      properties: {
        boundary: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            justification: { type: 'string' },
            timeHorizon: { type: 'string' },
            spatialScope: { type: 'string' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              role: { type: 'string' }
            }
          }
        },
        exogenousVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              influence: { type: 'string' }
            }
          }
        },
        exclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        stakeholders: {
          type: 'array',
          items: { type: 'string' }
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'boundary', 'definition']
}));

export const stockFlowAnalysisTask = defineTask('stock-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stock and Flow Analysis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'network-visualizer'],
    prompt: {
      role: 'Expert in system dynamics and stock-flow modeling',
      task: 'Identify stocks (accumulations) and flows in the system',
      context: {
        domain: args.domain,
        system: args.system,
        boundaryDefinition: args.boundaryDefinition
      },
      instructions: [
        '1. Identify all stocks (accumulations, levels, states)',
        '2. Identify all flows (rates of change)',
        '3. Map which flows affect which stocks',
        '4. Distinguish inflows from outflows',
        '5. Identify auxiliary variables (converters)',
        '6. Identify constants and parameters',
        '7. Assess stock units and flow units',
        '8. Identify stock-flow conservation relationships',
        '9. Map information links vs material flows',
        '10. Create stock-flow diagram description'
      ],
      outputFormat: 'JSON object with stock-flow analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stocks', 'flows'],
      properties: {
        stocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              units: { type: 'string' },
              initialValue: { type: 'string' },
              inflows: { type: 'array', items: { type: 'string' } },
              outflows: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        flows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              units: { type: 'string' },
              type: { type: 'string', enum: ['inflow', 'outflow', 'biflow'] },
              affectsStock: { type: 'string' },
              determinedBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        auxiliaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              formula: { type: 'string' }
            }
          }
        },
        constants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'any' },
              units: { type: 'string' }
            }
          }
        },
        diagramDescription: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'stocks', 'flows']
}));

export const feedbackMappingTask = defineTask('feedback-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feedback Loop Mapping',
  agent: {
    name: 'systems-thinker',
    skills: ['causal-inference-engine', 'systems-dynamics-modeler', 'network-visualizer'],
    prompt: {
      role: 'Expert in feedback systems and causal loop diagrams',
      task: 'Map feedback loops in the system',
      context: {
        stockFlowAnalysis: args.stockFlowAnalysis,
        system: args.system,
        domain: args.domain
      },
      instructions: [
        '1. Identify all causal relationships between variables',
        '2. Determine polarity of each causal link (+ or -)',
        '3. Trace closed loops through causal chains',
        '4. Classify loops as reinforcing (R) or balancing (B)',
        '5. Name and describe each feedback loop',
        '6. Identify dominant loops at different times',
        '7. Identify loop interactions and competition',
        '8. Assess loop strength and speed',
        '9. Identify potential for loop dominance shifts',
        '10. Create causal loop diagram description'
      ],
      outputFormat: 'JSON object with feedback loop mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['loops', 'causalLinks'],
      properties: {
        causalLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              polarity: { type: 'string', enum: ['+', '-'] },
              description: { type: 'string' }
            }
          }
        },
        loops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['reinforcing', 'balancing'] },
              variables: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              speed: { type: 'string', enum: ['fast', 'medium', 'slow'] }
            }
          }
        },
        dominantLoops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loop: { type: 'string' },
              conditions: { type: 'string' }
            }
          }
        },
        loopInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loops: { type: 'array', items: { type: 'string' } },
              interaction: { type: 'string' }
            }
          }
        },
        cldDescription: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'feedback', 'causal-loops']
}));

export const delayIdentificationTask = defineTask('delay-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Delay Identification',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in system dynamics and time delays',
      task: 'Identify time delays in the system',
      context: {
        feedbackMapping: args.feedbackMapping,
        stockFlowAnalysis: args.stockFlowAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Identify material delays (physical movement, processing)',
        '2. Identify information delays (measurement, reporting)',
        '3. Identify perception/decision delays (human cognition)',
        '4. Identify implementation delays (action execution)',
        '5. Estimate delay durations',
        '6. Identify which loops contain delays',
        '7. Assess delay variability',
        '8. Identify delay-induced oscillations',
        '9. Assess impact of delays on system behavior',
        '10. Identify opportunities for delay reduction'
      ],
      outputFormat: 'JSON object with delay analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['delays'],
      properties: {
        delays: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['material', 'information', 'perception', 'decision', 'implementation'] },
              location: { type: 'string' },
              duration: { type: 'string' },
              variability: { type: 'string', enum: ['fixed', 'variable', 'highly-variable'] },
              inLoop: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        delayInducedBehavior: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              causingDelays: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reductionOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              delay: { type: 'string' },
              reduction: { type: 'string' },
              benefit: { type: 'string' }
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
  labels: ['systems-thinking', 'delays', 'dynamics']
}));

export const nonlinearityAnalysisTask = defineTask('nonlinearity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Nonlinearity and Threshold Analysis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in nonlinear dynamics and complexity',
      task: 'Identify nonlinearities and thresholds in the system',
      context: {
        stockFlowAnalysis: args.stockFlowAnalysis,
        feedbackMapping: args.feedbackMapping,
        domain: args.domain
      },
      instructions: [
        '1. Identify nonlinear relationships between variables',
        '2. Identify saturation effects (limits to growth)',
        '3. Identify thresholds and tipping points',
        '4. Identify hysteresis effects',
        '5. Identify bifurcations (qualitative behavior changes)',
        '6. Assess sensitivity near thresholds',
        '7. Identify irreversibility points',
        '8. Map phase space if applicable',
        '9. Identify multiple equilibria/attractors',
        '10. Assess implications for system management'
      ],
      outputFormat: 'JSON object with nonlinearity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['nonlinearities'],
      properties: {
        nonlinearities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['saturation', 'threshold', 'exponential', 's-curve', 'other'] },
              variables: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' }
            }
          }
        },
        thresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              threshold: { type: 'any' },
              consequence: { type: 'string' },
              reversible: { type: 'boolean' }
            }
          }
        },
        tippingPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              trigger: { type: 'string' },
              newState: { type: 'string' }
            }
          }
        },
        equilibria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              stability: { type: 'string', enum: ['stable', 'unstable', 'saddle'] },
              basinOfAttraction: { type: 'string' }
            }
          }
        },
        managementImplications: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'nonlinearity', 'thresholds']
}));

export const emergenceAnalysisTask = defineTask('emergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emergence Analysis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'network-visualizer', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in complex systems and emergence',
      task: 'Analyze emergent properties and behaviors in the system',
      context: {
        feedbackMapping: args.feedbackMapping,
        nonlinearityAnalysis: args.nonlinearityAnalysis,
        system: args.system,
        domain: args.domain
      },
      instructions: [
        '1. Identify emergent properties (whole > sum of parts)',
        '2. Identify self-organizing behaviors',
        '3. Identify emergent patterns and structures',
        '4. Analyze how emergence arises from interactions',
        '5. Distinguish weak vs strong emergence',
        '6. Identify downward causation effects',
        '7. Assess predictability of emergent phenomena',
        '8. Identify conditions for emergence',
        '9. Consider emergence at multiple scales',
        '10. Assess implications for intervention'
      ],
      outputFormat: 'JSON object with emergence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['emergentProperties'],
      properties: {
        emergentProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'string' },
              type: { type: 'string', enum: ['weak', 'strong'] },
              arisesFrom: { type: 'array', items: { type: 'string' } },
              mechanism: { type: 'string' }
            }
          }
        },
        selfOrganization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phenomenon: { type: 'string' },
              description: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        emergentPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              scale: { type: 'string' },
              stability: { type: 'string' }
            }
          }
        },
        downwardCausation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              mechanism: { type: 'string' }
            }
          }
        },
        interventionImplications: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'emergence', 'complexity']
}));

export const archetypeIdentificationTask = defineTask('archetype-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'System Archetype Identification',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in system archetypes and patterns',
      task: 'Identify common system archetypes present in the system',
      context: {
        feedbackMapping: args.feedbackMapping,
        delayAnalysis: args.delayAnalysis,
        stockFlowAnalysis: args.stockFlowAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Check for Limits to Growth archetype',
        '2. Check for Shifting the Burden archetype',
        '3. Check for Fixes that Fail archetype',
        '4. Check for Eroding Goals archetype',
        '5. Check for Escalation archetype',
        '6. Check for Success to the Successful archetype',
        '7. Check for Tragedy of the Commons archetype',
        '8. Check for Growth and Underinvestment archetype',
        '9. Identify which loops constitute each archetype',
        '10. Recommend archetype-specific interventions'
      ],
      outputFormat: 'JSON object with archetype analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['archetypes'],
      properties: {
        archetypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              evidenceLoops: { type: 'array', items: { type: 'string' } },
              manifestation: { type: 'string' },
              confidence: { type: 'number' },
              genericIntervention: { type: 'string' },
              specificIntervention: { type: 'string' }
            }
          }
        },
        dominantArchetype: { type: 'string' },
        archetypeInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              archetypes: { type: 'array', items: { type: 'string' } },
              interaction: { type: 'string' }
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
  labels: ['systems-thinking', 'archetypes', 'patterns']
}));

export const dynamicBehaviorAnalysisTask = defineTask('dynamic-behavior-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dynamic Behavior Analysis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in system dynamics behavior modes',
      task: 'Analyze the dynamic behavior patterns of the system',
      context: {
        feedbackMapping: args.feedbackMapping,
        delayAnalysis: args.delayAnalysis,
        nonlinearityAnalysis: args.nonlinearityAnalysis,
        question: args.question
      },
      instructions: [
        '1. Identify dominant behavior modes (growth, decline, oscillation, etc.)',
        '2. Analyze behavior over different time horizons',
        '3. Identify equilibrium-seeking behavior',
        '4. Identify oscillatory behavior and its causes',
        '5. Analyze exponential growth/decay patterns',
        '6. Identify s-shaped growth patterns',
        '7. Analyze overshoot and collapse patterns',
        '8. Identify behavior mode transitions',
        '9. Relate behavior to feedback loop dominance',
        '10. Answer the driving question using behavioral insights'
      ],
      outputFormat: 'JSON object with dynamic behavior analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviorModes', 'dominantMode'],
      properties: {
        behaviorModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['exponential-growth', 'exponential-decay', 'goal-seeking', 'oscillation', 's-shaped', 'overshoot-collapse', 'equilibrium'] },
              variables: { type: 'array', items: { type: 'string' } },
              timeHorizon: { type: 'string' },
              drivenBy: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' }
            }
          }
        },
        dominantMode: { type: 'string' },
        behaviorTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        questionAnswer: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            behavioralExplanation: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'dynamics', 'behavior']
}));

export const leveragePointIdentificationTask = defineTask('leverage-point-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Leverage Point Identification',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'],
    prompt: {
      role: 'Expert in systems intervention and leverage points (Meadows framework)',
      task: 'Identify leverage points for system intervention',
      context: {
        feedbackMapping: args.feedbackMapping,
        archetypeAnalysis: args.archetypeAnalysis,
        dynamicBehavior: args.dynamicBehavior,
        stockFlowAnalysis: args.stockFlowAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Apply Meadows 12 leverage points framework',
        '2. Identify parameters that could be changed',
        '3. Identify buffer/stock sizes that matter',
        '4. Identify flow structures that could change',
        '5. Identify delay lengths that could be shortened',
        '6. Identify feedback loop strengths to modify',
        '7. Identify information flows to improve',
        '8. Identify rules of the system to change',
        '9. Identify goals of the system to change',
        '10. Consider paradigm/mindset changes',
        '11. Rank by effectiveness and feasibility'
      ],
      outputFormat: 'JSON object with leverage points'
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
              point: { type: 'string' },
              category: { type: 'string', enum: ['parameters', 'buffers', 'structure', 'delays', 'feedback-strength', 'information-flows', 'rules', 'goals', 'paradigms', 'transcendence'] },
              meadowsRank: { type: 'number' },
              description: { type: 'string' },
              intervention: { type: 'string' },
              effectiveness: { type: 'string', enum: ['high', 'medium', 'low'] },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highestLeverage: { type: 'string' },
        mostFeasible: { type: 'string' },
        recommended: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['systems-thinking', 'leverage-points', 'intervention']
}));

export const mentalModelAnalysisTask = defineTask('mental-model-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mental Model Analysis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in mental models and cognitive systems',
      task: 'Analyze mental models underlying the system and question',
      context: {
        question: args.question,
        feedbackMapping: args.feedbackMapping,
        dynamicBehavior: args.dynamicBehavior,
        perspective: args.perspective
      },
      instructions: [
        '1. Identify common mental models about the system',
        '2. Identify flaws in linear thinking about the system',
        '3. Identify misperception of feedback effects',
        '4. Identify failure to account for delays',
        '5. Identify boundary errors in mental models',
        '6. Identify event-focused vs structure-focused thinking',
        '7. Compare systems view to common mental models',
        '8. Identify cognitive biases affecting understanding',
        '9. Suggest mental model improvements',
        '10. Design learning interventions'
      ],
      outputFormat: 'JSON object with mental model analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['commonMentalModels', 'flaws'],
      properties: {
        commonMentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              prevalence: { type: 'string', enum: ['widespread', 'common', 'occasional'] },
              description: { type: 'string' }
            }
          }
        },
        flaws: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flaw: { type: 'string' },
              type: { type: 'string', enum: ['linear-thinking', 'feedback-misperception', 'delay-blindness', 'boundary-error', 'event-focus'] },
              consequence: { type: 'string' },
              correction: { type: 'string' }
            }
          }
        },
        cognitiveBiases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bias: { type: 'string' },
              manifestation: { type: 'string' }
            }
          }
        },
        improvedMentalModel: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            keyShifts: { type: 'array', items: { type: 'string' } }
          }
        },
        learningInterventions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'mental-models', 'cognition']
}));

export const systemsInsightSynthesisTask = defineTask('systems-insight-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Systems Insight Synthesis',
  agent: {
    name: 'systems-thinker',
    skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'],
    prompt: {
      role: 'Expert in systems thinking synthesis and communication',
      task: 'Synthesize insights from systems analysis',
      context: {
        feedbackMapping: args.feedbackMapping,
        delayAnalysis: args.delayAnalysis,
        emergenceAnalysis: args.emergenceAnalysis,
        archetypeAnalysis: args.archetypeAnalysis,
        dynamicBehavior: args.dynamicBehavior,
        leveragePoints: args.leveragePoints,
        mentalModelAnalysis: args.mentalModelAnalysis,
        question: args.question,
        domain: args.domain
      },
      instructions: [
        '1. Answer the original question using systems insights',
        '2. Synthesize key findings across all analyses',
        '3. Identify the most important feedback dynamics',
        '4. Highlight counterintuitive findings',
        '5. Identify key uncertainties and limitations',
        '6. Formulate actionable recommendations',
        '7. Suggest monitoring indicators',
        '8. Identify areas for further analysis',
        '9. Create executive summary',
        '10. Design communication strategy for insights'
      ],
      outputFormat: 'JSON object with synthesized insights'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryInsight', 'recommendations'],
      properties: {
        questionAnswer: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            systemsAnswer: { type: 'string' },
            keyDynamics: { type: 'array', items: { type: 'string' } }
          }
        },
        primaryInsight: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] },
              evidence: { type: 'string' }
            }
          }
        },
        counterintuitive: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              leveragePoint: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        monitoringIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              purpose: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        uncertainties: {
          type: 'array',
          items: { type: 'string' }
        },
        furtherAnalysis: {
          type: 'array',
          items: { type: 'string' }
        },
        executiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['systems-thinking', 'synthesis', 'insights']
}));
