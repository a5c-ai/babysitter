/**
 * @process specializations/domains/science/scientific-discovery/mechanistic-reasoning
 * @description Mechanistic Reasoning Process - Explain phenomena by identifying internal parts,
 * their interactions, organization, and causal activities that produce the phenomenon.
 * @inputs { domain: string, phenomenon: string, observedBehavior: object, systemDescription?: object, priorMechanisms?: object[] }
 * @outputs { success: boolean, mechanism: object, explanation: string, predictions: object[], validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/mechanistic-reasoning', {
 *   domain: 'Neuroscience',
 *   phenomenon: 'Long-term potentiation in hippocampus',
 *   observedBehavior: { synapticStrengthening: true, duration: 'hours to days' },
 *   priorMechanisms: [{ name: 'NMDA receptor activation', role: 'trigger' }]
 * });
 *
 * @references
 * - Machamer, Darden, Craver (2000). Thinking about Mechanisms
 * - Bechtel & Abrahamsen (2005). Explanation: A Mechanist Alternative
 * - Craver (2007). Explaining the Brain: Mechanisms and the Mosaic Unity of Neuroscience
 * - Glennan (2017). The New Mechanical Philosophy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    phenomenon,
    observedBehavior,
    systemDescription = null,
    priorMechanisms = []
  } = inputs;

  // Phase 1: Phenomenon Characterization
  const phenomenonCharacterization = await ctx.task(phenomenonCharacterizationTask, {
    domain,
    phenomenon,
    observedBehavior
  });

  // Phase 2: System Decomposition
  const systemDecomposition = await ctx.task(systemDecompositionTask, {
    domain,
    phenomenon,
    phenomenonCharacterization,
    systemDescription
  });

  // Phase 3: Component Identification
  const componentIdentification = await ctx.task(componentIdentificationTask, {
    domain,
    systemDecomposition,
    priorMechanisms,
    phenomenon
  });

  // Quality Gate: Components must be identified
  if (!componentIdentification.components || componentIdentification.components.length === 0) {
    return {
      success: false,
      error: 'Failed to identify mechanism components',
      phase: 'component-identification',
      mechanism: null
    };
  }

  // Phase 4: Activity Identification
  const activityIdentification = await ctx.task(activityIdentificationTask, {
    componentIdentification,
    phenomenonCharacterization,
    domain
  });

  // Phase 5: Organizational Analysis
  const organizationalAnalysis = await ctx.task(organizationalAnalysisTask, {
    componentIdentification,
    activityIdentification,
    systemDecomposition,
    domain
  });

  // Phase 6: Causal Chain Construction
  const causalChain = await ctx.task(causalChainConstructionTask, {
    componentIdentification,
    activityIdentification,
    organizationalAnalysis,
    phenomenon
  });

  // Phase 7: Mechanism Integration
  const mechanismIntegration = await ctx.task(mechanismIntegrationTask, {
    causalChain,
    componentIdentification,
    activityIdentification,
    organizationalAnalysis,
    phenomenonCharacterization
  });

  // Breakpoint: Review mechanism sketch
  await ctx.breakpoint({
    question: `Mechanism sketch complete for "${phenomenon}". ${componentIdentification.components.length} components identified. Review before validation?`,
    title: 'Mechanism Sketch Review',
    context: {
      runId: ctx.runId,
      phenomenon,
      components: componentIdentification.components.map(c => c.name),
      activities: activityIdentification.activities.map(a => a.name)
    }
  });

  // Phase 8: Multi-Level Analysis
  const multiLevelAnalysis = await ctx.task(multiLevelAnalysisTask, {
    mechanismIntegration,
    domain,
    phenomenon
  });

  // Phase 9: Prediction Generation
  const predictions = await ctx.task(predictionGenerationTask, {
    mechanismIntegration,
    multiLevelAnalysis,
    domain,
    phenomenon
  });

  // Phase 10: Mechanism Validation
  const validation = await ctx.task(mechanismValidationTask, {
    mechanismIntegration,
    predictions,
    observedBehavior,
    domain
  });

  // Phase 11: Explanation Generation
  const explanation = await ctx.task(mechanisticExplanationTask, {
    mechanismIntegration,
    multiLevelAnalysis,
    predictions,
    validation,
    domain,
    phenomenon
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Mechanistic explanation complete for "${phenomenon}". Validation score: ${validation.score}/100. Accept explanation?`,
    title: 'Mechanistic Explanation Review',
    context: {
      runId: ctx.runId,
      domain,
      phenomenon,
      files: [
        { path: 'artifacts/mechanism.json', format: 'json', content: mechanismIntegration },
        { path: 'artifacts/explanation.md', format: 'markdown', content: explanation.narrative }
      ]
    }
  });

  return {
    success: true,
    domain,
    phenomenon,
    mechanism: {
      components: componentIdentification.components,
      activities: activityIdentification.activities,
      organization: organizationalAnalysis.organization,
      causalChain: causalChain.chain,
      levels: multiLevelAnalysis.levels
    },
    explanation: explanation.narrative,
    mechanisticSchema: mechanismIntegration.schema,
    predictions: predictions.predictions,
    validation: {
      score: validation.score,
      evidenceSupport: validation.evidenceSupport,
      gaps: validation.gaps
    },
    interventionTargets: predictions.interventionTargets,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/mechanistic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const phenomenonCharacterizationTask = defineTask('phenomenon-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phenomenon Characterization - ${args.phenomenon}`,
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanistic explanation and philosophy of science',
      task: 'Characterize the phenomenon to be explained mechanistically',
      context: {
        domain: args.domain,
        phenomenon: args.phenomenon,
        observedBehavior: args.observedBehavior
      },
      instructions: [
        '1. Define the phenomenon precisely in operational terms',
        '2. Identify the explanandum - what exactly needs explaining',
        '3. Specify setup conditions (initial/boundary conditions)',
        '4. Identify termination conditions (when does phenomenon end)',
        '5. Characterize temporal aspects (duration, dynamics, phases)',
        '6. Identify spatial aspects (location, extent, levels)',
        '7. Distinguish the phenomenon from related phenomena',
        '8. Identify regular patterns and variations',
        '9. Document key observations and measurements',
        '10. Frame the explanatory question precisely'
      ],
      outputFormat: 'JSON object with phenomenon characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['explanandum', 'setupConditions', 'terminationConditions'],
      properties: {
        explanandum: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            keyFeatures: { type: 'array', items: { type: 'string' } },
            operationalization: { type: 'string' }
          }
        },
        setupConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              necessary: { type: 'boolean' }
            }
          }
        },
        terminationConditions: {
          type: 'array',
          items: { type: 'string' }
        },
        temporalCharacteristics: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            phases: { type: 'array', items: { type: 'string' } },
            dynamics: { type: 'string' }
          }
        },
        spatialCharacteristics: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            extent: { type: 'string' },
            levels: { type: 'array', items: { type: 'string' } }
          }
        },
        explanatoryQuestion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanistic-reasoning', 'phenomenon', 'characterization']
}));

export const systemDecompositionTask = defineTask('system-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'System Decomposition',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in systems analysis and mechanistic decomposition',
      task: 'Decompose the system responsible for the phenomenon',
      context: {
        domain: args.domain,
        phenomenon: args.phenomenon,
        phenomenonCharacterization: args.phenomenonCharacterization,
        systemDescription: args.systemDescription
      },
      instructions: [
        '1. Identify the system that produces the phenomenon',
        '2. Define system boundaries and interfaces',
        '3. Identify major subsystems and their relationships',
        '4. Determine appropriate decomposition strategy',
        '5. Identify levels of organization (molecular, cellular, etc.)',
        '6. Map hierarchical relationships between levels',
        '7. Identify key interfaces between subsystems',
        '8. Document system inputs and outputs',
        '9. Identify feedback and feedforward loops',
        '10. Characterize system dynamics and constraints'
      ],
      outputFormat: 'JSON object with system decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'subsystems', 'levels'],
      properties: {
        system: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            boundaries: { type: 'string' },
            type: { type: 'string' }
          }
        },
        subsystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              function: { type: 'string' },
              level: { type: 'string' }
            }
          }
        },
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              between: { type: 'array', items: { type: 'string' } },
              type: { type: 'string' }
            }
          }
        },
        inputs: { type: 'array', items: { type: 'string' } },
        outputs: { type: 'array', items: { type: 'string' } },
        feedbackLoops: {
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
  labels: ['mechanistic-reasoning', 'decomposition', 'systems']
}));

export const componentIdentificationTask = defineTask('component-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Component Identification',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanism discovery and component analysis',
      task: 'Identify the components (entities/parts) of the mechanism',
      context: {
        domain: args.domain,
        systemDecomposition: args.systemDecomposition,
        priorMechanisms: args.priorMechanisms,
        phenomenon: args.phenomenon
      },
      instructions: [
        '1. Identify all relevant entities/parts involved in the mechanism',
        '2. Characterize each component by its properties',
        '3. Identify component types (structural, functional, regulatory)',
        '4. Determine which components are necessary vs sufficient',
        '5. Identify component relationships and dependencies',
        '6. Characterize component states and state changes',
        '7. Identify component locations within the system',
        '8. Document evidence for each component role',
        '9. Identify unknown or hypothetical components',
        '10. Assess completeness of component identification'
      ],
      outputFormat: 'JSON object with identified components'
    },
    outputSchema: {
      type: 'object',
      required: ['components'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['structural', 'functional', 'regulatory', 'informational'] },
              properties: { type: 'array', items: { type: 'string' } },
              states: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              role: { type: 'string' },
              necessary: { type: 'boolean' },
              evidence: { type: 'string' }
            }
          }
        },
        componentRelationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component1: { type: 'string' },
              component2: { type: 'string' },
              relationship: { type: 'string' }
            }
          }
        },
        hypotheticalComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              rationale: { type: 'string' },
              testable: { type: 'boolean' }
            }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanistic-reasoning', 'components', 'entities']
}));

export const activityIdentificationTask = defineTask('activity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Activity Identification',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanism dynamics and process analysis',
      task: 'Identify the activities (operations/processes) in the mechanism',
      context: {
        componentIdentification: args.componentIdentification,
        phenomenonCharacterization: args.phenomenonCharacterization,
        domain: args.domain
      },
      instructions: [
        '1. Identify all activities performed by or on components',
        '2. Characterize each activity type (chemical, mechanical, electrical, etc.)',
        '3. Identify which components perform each activity',
        '4. Determine activity inputs and outputs',
        '5. Characterize activity conditions and triggers',
        '6. Identify activity rates and dynamics',
        '7. Determine temporal ordering of activities',
        '8. Identify parallel vs sequential activities',
        '9. Document evidence for each activity',
        '10. Identify regulatory/control activities'
      ],
      outputFormat: 'JSON object with identified activities'
    },
    outputSchema: {
      type: 'object',
      required: ['activities'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              performers: { type: 'array', items: { type: 'string' } },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } },
              conditions: { type: 'array', items: { type: 'string' } },
              triggers: { type: 'array', items: { type: 'string' } },
              rate: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        activitySequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              order: { type: 'number' },
              parallel: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        regulatoryActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              target: { type: 'string' },
              effect: { type: 'string', enum: ['activation', 'inhibition', 'modulation'] }
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
  labels: ['mechanistic-reasoning', 'activities', 'operations']
}));

export const organizationalAnalysisTask = defineTask('organizational-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Organizational Analysis',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in system organization and mechanism structure',
      task: 'Analyze the organization of components and activities in the mechanism',
      context: {
        componentIdentification: args.componentIdentification,
        activityIdentification: args.activityIdentification,
        systemDecomposition: args.systemDecomposition,
        domain: args.domain
      },
      instructions: [
        '1. Determine spatial organization of components',
        '2. Determine temporal organization of activities',
        '3. Identify organizational constraints and enabling conditions',
        '4. Analyze hierarchical organization across levels',
        '5. Identify modularity and module interactions',
        '6. Analyze network topology of interactions',
        '7. Identify organizational principles (redundancy, degeneracy)',
        '8. Assess importance of organization for function',
        '9. Identify organizational variations and their effects',
        '10. Document how organization produces the phenomenon'
      ],
      outputFormat: 'JSON object with organizational analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['organization'],
      properties: {
        organization: {
          type: 'object',
          properties: {
            spatial: {
              type: 'object',
              properties: {
                arrangement: { type: 'string' },
                localization: { type: 'array', items: { type: 'object' } },
                compartmentalization: { type: 'array', items: { type: 'string' } }
              }
            },
            temporal: {
              type: 'object',
              properties: {
                sequence: { type: 'array', items: { type: 'string' } },
                timing: { type: 'string' },
                synchronization: { type: 'string' }
              }
            },
            hierarchical: {
              type: 'object',
              properties: {
                levels: { type: 'array', items: { type: 'string' } },
                upwardCausation: { type: 'array', items: { type: 'string' } },
                downwardCausation: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              function: { type: 'string' }
            }
          }
        },
        networkTopology: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            keyNodes: { type: 'array', items: { type: 'string' } },
            connectivity: { type: 'string' }
          }
        },
        organizationalPrinciples: {
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
  labels: ['mechanistic-reasoning', 'organization', 'structure']
}));

export const causalChainConstructionTask = defineTask('causal-chain-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Causal Chain Construction',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in causal mechanism analysis and explanatory chains',
      task: 'Construct the causal chain from setup to termination conditions',
      context: {
        componentIdentification: args.componentIdentification,
        activityIdentification: args.activityIdentification,
        organizationalAnalysis: args.organizationalAnalysis,
        phenomenon: args.phenomenon
      },
      instructions: [
        '1. Identify the initiating cause/trigger',
        '2. Trace causal connections between activities',
        '3. Identify how components enable/inhibit activities',
        '4. Construct step-by-step causal narrative',
        '5. Identify branching points and alternative paths',
        '6. Identify feedback loops within the chain',
        '7. Connect to final outcome (phenomenon)',
        '8. Identify critical steps in the chain',
        '9. Assess strength of causal links',
        '10. Document evidence for causal connections'
      ],
      outputFormat: 'JSON object with causal chain'
    },
    outputSchema: {
      type: 'object',
      required: ['chain'],
      properties: {
        chain: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              cause: { type: 'string' },
              effect: { type: 'string' },
              mechanism: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        initiatingCause: {
          type: 'object',
          properties: {
            cause: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } }
          }
        },
        terminalEffect: {
          type: 'object',
          properties: {
            effect: { type: 'string' },
            isPhenomenon: { type: 'boolean' }
          }
        },
        branchingPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        feedbackLoops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'number' },
              to: { type: 'number' },
              type: { type: 'string', enum: ['positive', 'negative'] }
            }
          }
        },
        criticalSteps: {
          type: 'array',
          items: { type: 'number' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanistic-reasoning', 'causal-chain', 'explanation']
}));

export const mechanismIntegrationTask = defineTask('mechanism-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Integration',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanism synthesis and integration',
      task: 'Integrate components, activities, and organization into complete mechanism',
      context: {
        causalChain: args.causalChain,
        componentIdentification: args.componentIdentification,
        activityIdentification: args.activityIdentification,
        organizationalAnalysis: args.organizationalAnalysis,
        phenomenonCharacterization: args.phenomenonCharacterization
      },
      instructions: [
        '1. Integrate all mechanism elements into coherent whole',
        '2. Create mechanism schema/diagram description',
        '3. Verify completeness of mechanism',
        '4. Check internal consistency',
        '5. Identify mechanism bottlenecks and rate-limiting steps',
        '6. Characterize mechanism robustness and fragility',
        '7. Identify regulatory control points',
        '8. Document mechanism variants',
        '9. Assess mechanism sufficiency for phenomenon',
        '10. Create integrated mechanism description'
      ],
      outputFormat: 'JSON object with integrated mechanism'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'isComplete', 'isConsistent'],
      properties: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            components: { type: 'array', items: { type: 'string' } },
            activities: { type: 'array', items: { type: 'string' } },
            organization: { type: 'string' },
            causalFlow: { type: 'string' }
          }
        },
        isComplete: { type: 'boolean' },
        isConsistent: { type: 'boolean' },
        completenessGaps: {
          type: 'array',
          items: { type: 'string' }
        },
        bottlenecks: {
          type: 'array',
          items: { type: 'string' }
        },
        controlPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              type: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        robustness: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['high', 'medium', 'low'] },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        variants: {
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
  labels: ['mechanistic-reasoning', 'integration', 'synthesis']
}));

export const multiLevelAnalysisTask = defineTask('multi-level-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Multi-Level Mechanism Analysis',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in multi-level explanation and inter-level relations',
      task: 'Analyze mechanism across multiple levels of organization',
      context: {
        mechanismIntegration: args.mechanismIntegration,
        domain: args.domain,
        phenomenon: args.phenomenon
      },
      instructions: [
        '1. Identify all levels relevant to the mechanism',
        '2. Characterize mechanism at each level',
        '3. Analyze upward causation (micro to macro)',
        '4. Analyze downward causation/constraint (macro to micro)',
        '5. Identify emergent properties at each level',
        '6. Analyze inter-level bridges and relations',
        '7. Assess explanatory relevance of each level',
        '8. Identify appropriate level for intervention',
        '9. Document level-specific predictions',
        '10. Create multi-level explanatory narrative'
      ],
      outputFormat: 'JSON object with multi-level analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['levels'],
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scale: { type: 'string' },
              description: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              emergentProperties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interLevelRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              relationType: { type: 'string', enum: ['constitution', 'emergence', 'constraint', 'supervenience'] },
              description: { type: 'string' }
            }
          }
        },
        upwardCausation: {
          type: 'array',
          items: { type: 'string' }
        },
        downwardCausation: {
          type: 'array',
          items: { type: 'string' }
        },
        primaryExplanatoryLevel: { type: 'string' },
        interventionLevel: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanistic-reasoning', 'multi-level', 'emergence']
}));

export const predictionGenerationTask = defineTask('prediction-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanistic Prediction Generation',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanistic prediction and hypothesis generation',
      task: 'Generate testable predictions from the mechanistic explanation',
      context: {
        mechanismIntegration: args.mechanismIntegration,
        multiLevelAnalysis: args.multiLevelAnalysis,
        domain: args.domain,
        phenomenon: args.phenomenon
      },
      instructions: [
        '1. Generate predictions from mechanism operation',
        '2. Predict effects of component removal/inhibition',
        '3. Predict effects of component enhancement/activation',
        '4. Predict effects of organizational changes',
        '5. Predict intermediate states/activities',
        '6. Predict dose-response relationships',
        '7. Predict temporal dynamics',
        '8. Identify intervention targets for manipulation',
        '9. Generate falsifiable hypotheses',
        '10. Prioritize predictions by testability'
      ],
      outputFormat: 'JSON object with predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'interventionTargets'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              type: { type: 'string', enum: ['component', 'activity', 'organization', 'dynamics'] },
              derivation: { type: 'string' },
              testable: { type: 'boolean' },
              testMethod: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        interventionTargets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: { type: 'string' },
              interventionType: { type: 'string' },
              predictedEffect: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        falsifiableHypotheses: {
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
  labels: ['mechanistic-reasoning', 'prediction', 'hypothesis']
}));

export const mechanismValidationTask = defineTask('mechanism-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanism Validation',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in mechanism validation and evidence assessment',
      task: 'Validate the mechanistic explanation against evidence',
      context: {
        mechanismIntegration: args.mechanismIntegration,
        predictions: args.predictions,
        observedBehavior: args.observedBehavior,
        domain: args.domain
      },
      instructions: [
        '1. Assess evidence for each component existence',
        '2. Assess evidence for each activity occurrence',
        '3. Assess evidence for organizational features',
        '4. Check consistency with known observations',
        '5. Evaluate explanatory power for the phenomenon',
        '6. Assess mechanism completeness',
        '7. Identify gaps requiring further evidence',
        '8. Compare with alternative mechanisms',
        '9. Assess confidence in mechanism',
        '10. Calculate overall validation score'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'evidenceSupport', 'gaps'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        evidenceSupport: {
          type: 'object',
          properties: {
            components: { type: 'number' },
            activities: { type: 'number' },
            organization: { type: 'number' },
            causalChain: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              fillability: { type: 'string' }
            }
          }
        },
        consistencyWithObservations: { type: 'boolean' },
        explanatoryPower: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        alternativeMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              evidenceComparison: { type: 'string' }
            }
          }
        },
        overallConfidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low', 'speculative']
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanistic-reasoning', 'validation', 'evidence']
}));

export const mechanisticExplanationTask = defineTask('mechanistic-explanation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mechanistic Explanation Generation',
  skill: { name: 'causal-inference-engine' },
  agent: {
    name: 'mechanistic-analyst',
    skills: ['causal-inference-engine', 'hypothesis-generator', 'root-cause-analyzer'],
    prompt: {
      role: 'Expert in scientific explanation and science communication',
      task: 'Generate clear mechanistic explanation of the phenomenon',
      context: {
        mechanismIntegration: args.mechanismIntegration,
        multiLevelAnalysis: args.multiLevelAnalysis,
        predictions: args.predictions,
        validation: args.validation,
        domain: args.domain,
        phenomenon: args.phenomenon
      },
      instructions: [
        '1. Create clear narrative explanation of the mechanism',
        '2. Explain how components and activities produce phenomenon',
        '3. Explain role of organization',
        '4. Use appropriate level of detail for domain',
        '5. Highlight key causal steps',
        '6. Explain multi-level aspects clearly',
        '7. Note uncertainties and gaps',
        '8. Provide visual/diagrammatic description',
        '9. Explain implications and applications',
        '10. Summarize key insights'
      ],
      outputFormat: 'JSON object with mechanistic explanation'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative'],
      properties: {
        narrative: { type: 'string' },
        summary: { type: 'string' },
        keyInsights: {
          type: 'array',
          items: { type: 'string' }
        },
        diagramDescription: { type: 'string' },
        uncertainties: {
          type: 'array',
          items: { type: 'string' }
        },
        implications: {
          type: 'array',
          items: { type: 'string' }
        },
        applications: {
          type: 'array',
          items: { type: 'string' }
        },
        furtherResearch: {
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
  labels: ['mechanistic-reasoning', 'explanation', 'communication']
}));
