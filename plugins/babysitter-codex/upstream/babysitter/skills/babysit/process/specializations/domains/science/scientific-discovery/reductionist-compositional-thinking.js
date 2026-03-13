/**
 * @process scientific-discovery/reductionist-compositional-thinking
 * @description Reductionist-Compositional Thinking process - Break complex systems into fundamental parts, understand each part, then recombine to understand the whole
 * @inputs { system: string, currentUnderstanding: object, decompositionDepth: number, outputDir: string }
 * @outputs { success: boolean, components: array, interactions: array, emergentProperties: array, synthesizedUnderstanding: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = '',
    currentUnderstanding = {},
    decompositionDepth = 3,
    outputDir = 'reductionist-compositional-output',
    analysisScope = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reductionist-Compositional Thinking Process');

  // ============================================================================
  // PHASE 1: SYSTEM IDENTIFICATION AND BOUNDARY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying system and defining boundaries');
  const systemIdentification = await ctx.task(systemIdentificationTask, {
    system,
    currentUnderstanding,
    outputDir
  });

  artifacts.push(...systemIdentification.artifacts);

  // ============================================================================
  // PHASE 2: HIERARCHICAL DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing hierarchical decomposition');
  const decomposition = await ctx.task(hierarchicalDecompositionTask, {
    system,
    systemBoundaries: systemIdentification.boundaries,
    decompositionDepth,
    outputDir
  });

  artifacts.push(...decomposition.artifacts);

  // ============================================================================
  // PHASE 3: COMPONENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing individual components');
  const componentAnalysis = await ctx.task(componentAnalysisTask, {
    components: decomposition.components,
    decompositionLevels: decomposition.levels,
    outputDir
  });

  artifacts.push(...componentAnalysis.artifacts);

  // Breakpoint: Review decomposition before composition
  await ctx.breakpoint({
    question: `Decomposition complete. ${decomposition.components.length} components identified across ${decomposition.levels.length} levels. Proceed with interaction and composition analysis?`,
    title: 'Reductionist Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        system,
        componentCount: decomposition.components.length,
        levelCount: decomposition.levels.length,
        fundamentalUnitsIdentified: componentAnalysis.fundamentalUnits.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: INTERACTION MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 4: Mapping component interactions');
  const interactionMapping = await ctx.task(interactionMappingTask, {
    components: decomposition.components,
    componentAnalysis: componentAnalysis.analyses,
    outputDir
  });

  artifacts.push(...interactionMapping.artifacts);

  // ============================================================================
  // PHASE 5: EMERGENCE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying emergent properties');
  const emergenceIdentification = await ctx.task(emergenceIdentificationTask, {
    components: decomposition.components,
    interactions: interactionMapping.interactions,
    systemBoundaries: systemIdentification.boundaries,
    outputDir
  });

  artifacts.push(...emergenceIdentification.artifacts);

  // ============================================================================
  // PHASE 6: COMPOSITIONAL SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing understanding through composition');
  const compositionalSynthesis = await ctx.task(compositionalSynthesisTask, {
    components: decomposition.components,
    componentAnalyses: componentAnalysis.analyses,
    interactions: interactionMapping.interactions,
    emergentProperties: emergenceIdentification.emergentProperties,
    outputDir
  });

  artifacts.push(...compositionalSynthesis.artifacts);

  // ============================================================================
  // PHASE 7: VALIDATION AND GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating synthesis and identifying gaps');
  const validationAnalysis = await ctx.task(validationGapAnalysisTask, {
    originalSystem: system,
    synthesizedUnderstanding: compositionalSynthesis.synthesis,
    currentUnderstanding,
    emergentProperties: emergenceIdentification.emergentProperties,
    outputDir
  });

  artifacts.push(...validationAnalysis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Reductionist-compositional analysis complete. Synthesis completeness: ${validationAnalysis.completenessScore}%. ${validationAnalysis.gaps.length} gaps identified. Review final synthesis?`,
    title: 'Compositional Synthesis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        system,
        completenessScore: validationAnalysis.completenessScore,
        emergentPropertiesFound: emergenceIdentification.emergentProperties.length,
        gapsIdentified: validationAnalysis.gaps.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    system,
    decomposition: {
      levels: decomposition.levels,
      components: decomposition.components,
      fundamentalUnits: componentAnalysis.fundamentalUnits
    },
    componentAnalyses: componentAnalysis.analyses,
    interactions: interactionMapping.interactions,
    emergentProperties: emergenceIdentification.emergentProperties,
    synthesizedUnderstanding: compositionalSynthesis.synthesis,
    validation: {
      completenessScore: validationAnalysis.completenessScore,
      gaps: validationAnalysis.gaps,
      recommendations: validationAnalysis.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/reductionist-compositional-thinking',
      timestamp: startTime,
      outputDir,
      decompositionDepth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Identification
export const systemIdentificationTask = defineTask('system-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify system and define boundaries',
  agent: {
    name: 'systems-analyst',
    prompt: {
      role: 'systems scientist and boundary analyst',
      task: 'Clearly identify the system under study and define its boundaries',
      context: args,
      instructions: [
        'Define the system precisely and unambiguously',
        'Identify system boundaries (spatial, temporal, functional)',
        'Distinguish system from environment',
        'Identify inputs and outputs crossing boundaries',
        'Determine scale of analysis (macro, meso, micro)',
        'Note what is explicitly excluded from analysis',
        'Document assumptions about system closure',
        'Identify observer perspective and its influence',
        'List known sub-systems',
        'Save boundary definition to output directory'
      ],
      outputFormat: 'JSON with boundaries (spatial, temporal, functional), inputs, outputs, scale, exclusions, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaries', 'artifacts'],
      properties: {
        boundaries: {
          type: 'object',
          properties: {
            spatial: { type: 'string' },
            temporal: { type: 'string' },
            functional: { type: 'string' },
            conceptual: { type: 'string' }
          }
        },
        inputs: { type: 'array', items: { type: 'string' } },
        outputs: { type: 'array', items: { type: 'string' } },
        scale: { type: 'string' },
        exclusions: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        knownSubsystems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'system-identification', 'boundary-definition']
}));

// Task 2: Hierarchical Decomposition
export const hierarchicalDecompositionTask = defineTask('hierarchical-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform hierarchical decomposition',
  agent: {
    name: 'reductionist-analyst',
    prompt: {
      role: 'analytical scientist and decomposition specialist',
      task: 'Decompose the system hierarchically into constituent parts at multiple levels',
      context: args,
      instructions: [
        'Identify natural decomposition boundaries',
        'Create hierarchical levels from whole to parts',
        'Apply consistent decomposition criteria at each level',
        'Continue until reaching fundamental/atomic units',
        'Respect specified decomposition depth limit',
        'Document decomposition rationale at each step',
        'Identify parallel vs nested decompositions',
        'Note cross-cutting concerns that span levels',
        'Create part-whole relationships',
        'Generate hierarchical tree structure',
        'Save decomposition hierarchy to output directory'
      ],
      outputFormat: 'JSON with levels (array of level objects), components (flat list), hierarchy (tree structure), decompositionRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'components', 'hierarchy', 'artifacts'],
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              levelNumber: { type: 'number' },
              levelName: { type: 'string' },
              componentCount: { type: 'number' },
              decompositionCriteria: { type: 'string' }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              level: { type: 'number' },
              parentId: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        hierarchy: { type: 'object' },
        decompositionRationale: { type: 'string' },
        crossCuttingConcerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'decomposition', 'hierarchical-analysis']
}));

// Task 3: Component Analysis
export const componentAnalysisTask = defineTask('component-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze individual components',
  agent: {
    name: 'component-scientist',
    prompt: {
      role: 'analytical scientist specializing in component behavior',
      task: 'Analyze each component in isolation to understand its intrinsic properties and behavior',
      context: args,
      instructions: [
        'For each component, analyze in isolation',
        'Identify intrinsic properties (independent of context)',
        'Determine behavioral characteristics',
        'Identify internal structure if decomposable',
        'Document inputs, outputs, and transformations',
        'Characterize state variables',
        'Identify constraints on component behavior',
        'Note variability and tolerances',
        'Assess component stability',
        'Identify fundamental/atomic units',
        'Document methods of observation/measurement',
        'Save component analyses to output directory'
      ],
      outputFormat: 'JSON with analyses (array of component analysis objects), fundamentalUnits (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyses', 'fundamentalUnits', 'artifacts'],
      properties: {
        analyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              intrinsicProperties: { type: 'object' },
              behavior: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } },
              stateVariables: { type: 'array', items: { type: 'string' } },
              constraints: { type: 'array', items: { type: 'string' } },
              stability: { type: 'string' }
            }
          }
        },
        fundamentalUnits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              characterization: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'component-analysis', 'reductionism']
}));

// Task 4: Interaction Mapping
export const interactionMappingTask = defineTask('interaction-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map component interactions',
  agent: {
    name: 'interaction-analyst',
    prompt: {
      role: 'systems scientist specializing in interactions and relationships',
      task: 'Map all significant interactions between components at each hierarchical level',
      context: args,
      instructions: [
        'Identify all pairwise interactions between components',
        'Characterize interaction types (causal, informational, material, energy)',
        'Determine interaction strength and direction',
        'Identify feedback loops (positive and negative)',
        'Map interaction networks at each level',
        'Identify interaction cascades across levels',
        'Note non-linear interactions',
        'Document time-dependencies in interactions',
        'Identify critical interaction pathways',
        'Assess interaction robustness',
        'Create interaction matrices and graphs',
        'Save interaction maps to output directory'
      ],
      outputFormat: 'JSON with interactions (array), feedbackLoops (array), interactionNetwork (object), criticalPathways (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interactions', 'interactionNetwork', 'artifacts'],
      properties: {
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sourceId: { type: 'string' },
              targetId: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'number' },
              direction: { type: 'string' },
              timeDependence: { type: 'string' }
            }
          }
        },
        feedbackLoops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['positive', 'negative'] },
              timescale: { type: 'string' }
            }
          }
        },
        interactionNetwork: { type: 'object' },
        criticalPathways: { type: 'array', items: { type: 'string' } },
        nonLinearInteractions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'interaction-mapping', 'network-analysis']
}));

// Task 5: Emergence Identification
export const emergenceIdentificationTask = defineTask('emergence-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify emergent properties',
  agent: {
    name: 'emergence-analyst',
    prompt: {
      role: 'complexity scientist specializing in emergence',
      task: 'Identify properties of the whole that emerge from component interactions but cannot be reduced to component properties alone',
      context: args,
      instructions: [
        'Identify system-level properties not present in components',
        'Distinguish weak emergence (predictable from parts) from strong emergence',
        'Characterize each emergent property',
        'Trace emergence to specific interaction patterns',
        'Identify critical thresholds for emergence',
        'Note scale-dependencies of emergent properties',
        'Assess reducibility of each emergent property',
        'Document downward causation effects',
        'Identify emergent behaviors vs emergent structures',
        'Compare observed emergence with theoretical predictions',
        'Save emergence analysis to output directory'
      ],
      outputFormat: 'JSON with emergentProperties (array with property, type, origin, reducibility), downwardCausation (array), criticalThresholds (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['emergentProperties', 'artifacts'],
      properties: {
        emergentProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              property: { type: 'string' },
              description: { type: 'string' },
              emergenceType: { type: 'string', enum: ['weak', 'strong'] },
              originInteractions: { type: 'array', items: { type: 'string' } },
              reducibility: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        downwardCausation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emergentProperty: { type: 'string' },
              affectedComponents: { type: 'array', items: { type: 'string' } },
              mechanism: { type: 'string' }
            }
          }
        },
        criticalThresholds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'emergence', 'complexity-science']
}));

// Task 6: Compositional Synthesis
export const compositionalSynthesisTask = defineTask('compositional-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize understanding through composition',
  agent: {
    name: 'synthesis-scientist',
    prompt: {
      role: 'theoretical scientist specializing in synthesis and integration',
      task: 'Recombine component understanding with interaction patterns to synthesize comprehensive system understanding',
      context: args,
      instructions: [
        'Integrate component analyses bottom-up',
        'Incorporate interaction effects at each level',
        'Account for emergent properties',
        'Build coherent model of whole system',
        'Identify what whole-system behaviors are explained',
        'Note what cannot be explained by composition alone',
        'Create unified theoretical framework',
        'Document assumptions required for synthesis',
        'Assess predictive power of synthesized understanding',
        'Compare with original system observations',
        'Identify testable predictions from synthesis',
        'Save synthesized understanding to output directory'
      ],
      outputFormat: 'JSON with synthesis (comprehensive model), explanatoryPower, unexplainedPhenomena, predictions, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'explanatoryPower', 'artifacts'],
      properties: {
        synthesis: {
          type: 'object',
          properties: {
            systemModel: { type: 'string' },
            keyMechanisms: { type: 'array', items: { type: 'string' } },
            causalStructure: { type: 'string' },
            dynamicBehavior: { type: 'string' }
          }
        },
        explanatoryPower: { type: 'number', minimum: 0, maximum: 1 },
        explainedPhenomena: { type: 'array', items: { type: 'string' } },
        unexplainedPhenomena: { type: 'array', items: { type: 'string' } },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              basis: { type: 'string' },
              testability: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'synthesis', 'composition']
}));

// Task 7: Validation and Gap Analysis
export const validationGapAnalysisTask = defineTask('validation-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate synthesis and identify gaps',
  agent: {
    name: 'validation-analyst',
    prompt: {
      role: 'scientific evaluator and gap analyst',
      task: 'Validate the synthesized understanding against known system behavior and identify gaps',
      context: args,
      instructions: [
        'Compare synthesized understanding with original system',
        'Identify matches and mismatches',
        'Calculate completeness score',
        'Identify gaps in understanding',
        'Classify gaps (data gaps, theoretical gaps, methodological gaps)',
        'Assess what additional decomposition or data needed',
        'Note limitations of reductionist approach for this system',
        'Recommend next steps to close gaps',
        'Evaluate confidence in synthesized understanding',
        'Document irreducible aspects requiring holistic approaches',
        'Save validation analysis to output directory'
      ],
      outputFormat: 'JSON with completenessScore, gaps (array with gap type, description, priority), recommendations, limitations, confidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completenessScore', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        matches: { type: 'array', items: { type: 'string' } },
        mismatches: { type: 'array', items: { type: 'string' } },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapType: { type: 'string', enum: ['data', 'theoretical', 'methodological', 'conceptual'] },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              closureStrategy: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'validation', 'gap-analysis']
}));
