/**
 * @process specializations/domains/science/scientific-discovery/spatial-diagrammatic-reasoning
 * @description Spatial and Diagrammatic Reasoning - Use geometry, topology, spatial relationships,
 * and diagram-based inferences to reason about physical structures, experimental layouts, data
 * visualizations, and conceptual models in scientific discovery.
 * @inputs { spatialElements: object[], diagrams?: object[], spatialQueries: string[], domain?: string }
 * @outputs { success: boolean, spatialAnalysis: object, topologicalRelations: object[], inferences: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/spatial-diagrammatic-reasoning', {
 *   spatialElements: [{ id: 'protein-A', shape: 'globular', position: 'membrane' }, { id: 'protein-B', shape: 'channel', position: 'membrane' }],
 *   spatialQueries: ['What is the spatial relationship between protein-A and protein-B?', 'Can they interact directly?'],
 *   domain: 'Molecular biology'
 * });
 *
 * @references
 * - Spatial Reasoning: https://plato.stanford.edu/entries/space-cognition/
 * - Qualitative Spatial Reasoning: https://www.sciencedirect.com/topics/computer-science/qualitative-spatial-reasoning
 * - Diagrammatic Reasoning: https://plato.stanford.edu/entries/reasoning-diagrammatic/
 * - Topological Relations: https://www.sciencedirect.com/topics/computer-science/region-connection-calculus
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    spatialElements,
    diagrams = [],
    spatialQueries,
    domain = ''
  } = inputs;

  // Phase 1: Spatial Element Characterization
  const elementCharacterization = await ctx.task(elementCharacterizationTask, {
    spatialElements,
    domain
  });

  // Quality Gate: Elements must be characterizable
  if (!elementCharacterization.elements || elementCharacterization.elements.length === 0) {
    return {
      success: false,
      error: 'Spatial elements cannot be characterized',
      phase: 'element-characterization',
      spatialAnalysis: null
    };
  }

  // Phase 2: Topological Relation Extraction
  const topologicalRelations = await ctx.task(topologicalRelationTask, {
    elements: elementCharacterization.elements
  });

  // Phase 3: Geometric Property Analysis
  const geometricAnalysis = await ctx.task(geometricAnalysisTask, {
    elements: elementCharacterization.elements,
    domain
  });

  // Phase 4: Spatial Configuration Analysis
  const configurationAnalysis = await ctx.task(configurationAnalysisTask, {
    elements: elementCharacterization.elements,
    topological: topologicalRelations.relations,
    geometric: geometricAnalysis.properties
  });

  // Breakpoint: Review spatial structure
  await ctx.breakpoint({
    question: `Review spatial structure. ${elementCharacterization.elements.length} elements, ${topologicalRelations.relations?.length || 0} relations. Continue analysis?`,
    title: 'Spatial Structure Review',
    context: {
      runId: ctx.runId,
      elementCount: elementCharacterization.elements.length,
      relationCount: topologicalRelations.relations?.length || 0,
      files: [{
        path: 'artifacts/spatial-structure.json',
        format: 'json',
        content: { elementCharacterization, topologicalRelations, geometricAnalysis, configurationAnalysis }
      }]
    }
  });

  // Phase 5: Diagram Interpretation
  const diagramInterpretation = await ctx.task(diagramInterpretationTask, {
    diagrams,
    elements: elementCharacterization.elements,
    domain
  });

  // Phase 6: Spatial Constraint Analysis
  const constraintAnalysis = await ctx.task(spatialConstraintTask, {
    elements: elementCharacterization.elements,
    topological: topologicalRelations.relations,
    geometric: geometricAnalysis.properties,
    configuration: configurationAnalysis.configuration
  });

  // Phase 7: Spatial Transformation Analysis
  const transformationAnalysis = await ctx.task(spatialTransformationTask, {
    elements: elementCharacterization.elements,
    configuration: configurationAnalysis.configuration,
    constraints: constraintAnalysis.constraints
  });

  // Phase 8: Spatial Query Resolution
  const queryResolution = await ctx.task(spatialQueryTask, {
    queries: spatialQueries,
    elements: elementCharacterization.elements,
    topological: topologicalRelations.relations,
    geometric: geometricAnalysis.properties,
    configuration: configurationAnalysis.configuration,
    diagrams: diagramInterpretation
  });

  // Phase 9: Spatial Inference Generation
  const spatialInferences = await ctx.task(spatialInferenceTask, {
    elements: elementCharacterization.elements,
    topological: topologicalRelations.relations,
    geometric: geometricAnalysis.properties,
    configuration: configurationAnalysis.configuration,
    constraints: constraintAnalysis.constraints,
    transformations: transformationAnalysis.transformations,
    domain
  });

  // Phase 10: Spatial Synthesis
  const spatialSynthesis = await ctx.task(spatialSynthesisTask, {
    elements: elementCharacterization.elements,
    topological: topologicalRelations,
    geometric: geometricAnalysis,
    configuration: configurationAnalysis,
    diagrams: diagramInterpretation,
    constraints: constraintAnalysis,
    transformations: transformationAnalysis,
    queryAnswers: queryResolution.answers,
    inferences: spatialInferences.inferences,
    spatialQueries,
    domain
  });

  // Final Breakpoint: Spatial Analysis Approval
  await ctx.breakpoint({
    question: `Spatial analysis complete. ${queryResolution.answers?.length || 0} queries resolved. Approve analysis?`,
    title: 'Spatial Analysis Approval',
    context: {
      runId: ctx.runId,
      queryCount: spatialQueries.length,
      answeredCount: queryResolution.answers?.length || 0,
      inferenceCount: spatialInferences.inferences?.length || 0,
      files: [
        { path: 'artifacts/spatial-report.json', format: 'json', content: spatialSynthesis },
        { path: 'artifacts/spatial-report.md', format: 'markdown', content: spatialSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    spatialAnalysis: {
      elements: elementCharacterization.elements,
      geometric: geometricAnalysis.properties,
      configuration: configurationAnalysis.configuration,
      constraints: constraintAnalysis.constraints,
      transformations: transformationAnalysis.transformations
    },
    topologicalRelations: topologicalRelations.relations,
    inferences: spatialInferences.inferences,
    queryAnswers: queryResolution.answers,
    diagramInsights: diagramInterpretation.insights,
    recommendations: spatialSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/spatial-diagrammatic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const elementCharacterizationTask = defineTask('element-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Spatial Element Characterization',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Element Analyst',
      task: 'Characterize spatial elements and their properties',
      context: {
        spatialElements: args.spatialElements,
        domain: args.domain
      },
      instructions: [
        '1. Identify spatial dimensionality of each element',
        '2. Characterize shape and form',
        '3. Identify boundaries and regions',
        '4. Assess element size and scale',
        '5. Identify spatial reference frames',
        '6. Characterize element positions',
        '7. Identify orientations',
        '8. Note internal structure if relevant',
        '9. Identify spatial extent',
        '10. Document element properties'
      ],
      outputFormat: 'JSON object with characterized elements'
    },
    outputSchema: {
      type: 'object',
      required: ['elements'],
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              dimensionality: { type: 'string', enum: ['0D', '1D', '2D', '3D'] },
              shape: { type: 'string' },
              boundary: { type: 'object' },
              size: { type: 'object' },
              position: { type: 'object' },
              orientation: { type: 'object' },
              extent: { type: 'object' }
            }
          }
        },
        referenceFrame: { type: 'object' },
        scaleFactor: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'characterization', 'elements']
}));

export const topologicalRelationTask = defineTask('topological-relation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Topological Relation Extraction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Topological Relation Expert',
      task: 'Extract topological relations using RCC8 and other calculi',
      context: {
        elements: args.elements
      },
      instructions: [
        '1. Identify RCC8 relations (DC, EC, PO, EQ, TPP, NTPP, TPPi, NTPPi)',
        '2. Extract containment relationships',
        '3. Identify adjacency relations',
        '4. Extract connectivity relations',
        '5. Identify overlap relations',
        '6. Apply transitivity rules',
        '7. Check consistency of relations',
        '8. Identify indeterminate relations',
        '9. Build topological relation network',
        '10. Document topological analysis'
      ],
      outputFormat: 'JSON object with topological relations'
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
              element1: { type: 'string' },
              relation: { type: 'string', enum: ['DC', 'EC', 'PO', 'EQ', 'TPP', 'NTPP', 'TPPi', 'NTPPi'] },
              element2: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        },
        containment: { type: 'array', items: { type: 'object' } },
        adjacency: { type: 'array', items: { type: 'object' } },
        connectivity: { type: 'object' },
        consistencyStatus: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'topology', 'RCC8']
}));

export const geometricAnalysisTask = defineTask('geometric-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Geometric Property Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Geometric Analysis Expert',
      task: 'Analyze geometric properties of spatial elements',
      context: {
        elements: args.elements,
        domain: args.domain
      },
      instructions: [
        '1. Calculate distances between elements',
        '2. Analyze angles and orientations',
        '3. Identify symmetries',
        '4. Calculate areas and volumes',
        '5. Analyze curvature properties',
        '6. Identify geometric patterns',
        '7. Analyze proportions and ratios',
        '8. Identify congruence and similarity',
        '9. Analyze projections',
        '10. Document geometric properties'
      ],
      outputFormat: 'JSON object with geometric analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['properties'],
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              elementId: { type: 'string' },
              distances: { type: 'object' },
              angles: { type: 'object' },
              area: { type: 'number' },
              volume: { type: 'number' },
              symmetry: { type: 'string' }
            }
          }
        },
        pairwiseDistances: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        symmetries: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'geometry', 'properties']
}));

export const configurationAnalysisTask = defineTask('configuration-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Spatial Configuration Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Configuration Analysis Expert',
      task: 'Analyze spatial configurations and arrangements',
      context: {
        elements: args.elements,
        topological: args.topological,
        geometric: args.geometric
      },
      instructions: [
        '1. Identify overall configuration pattern',
        '2. Analyze spatial clustering',
        '3. Identify spatial hierarchies',
        '4. Analyze spatial density distribution',
        '5. Identify boundaries and regions',
        '6. Analyze spatial organization',
        '7. Identify alignment patterns',
        '8. Analyze spatial symmetry at configuration level',
        '9. Identify functional spatial groupings',
        '10. Document configuration analysis'
      ],
      outputFormat: 'JSON object with configuration analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            clusters: { type: 'array', items: { type: 'object' } },
            hierarchy: { type: 'object' },
            density: { type: 'object' },
            organization: { type: 'string' }
          }
        },
        alignments: { type: 'array', items: { type: 'object' } },
        functionalGroups: { type: 'array', items: { type: 'object' } },
        configurationSymmetry: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'configuration', 'arrangement']
}));

export const diagramInterpretationTask = defineTask('diagram-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Diagram Interpretation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Diagram Interpretation Expert',
      task: 'Interpret diagrams and extract spatial information',
      context: {
        diagrams: args.diagrams,
        elements: args.elements,
        domain: args.domain
      },
      instructions: [
        '1. Identify diagram type and conventions',
        '2. Extract explicit spatial information',
        '3. Infer implicit spatial relationships',
        '4. Map diagram elements to domain concepts',
        '5. Identify visual variables and their meaning',
        '6. Extract quantitative information if present',
        '7. Identify diagram limitations',
        '8. Compare multiple diagram representations',
        '9. Validate diagram consistency',
        '10. Document diagram insights'
      ],
      outputFormat: 'JSON object with diagram interpretation'
    },
    outputSchema: {
      type: 'object',
      required: ['insights'],
      properties: {
        diagramAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diagramId: { type: 'string' },
              type: { type: 'string' },
              conventions: { type: 'array', items: { type: 'string' } },
              extractedInfo: { type: 'object' },
              limitations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        inferredRelations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'diagrams', 'interpretation']
}));

export const spatialConstraintTask = defineTask('spatial-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Spatial Constraint Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Constraint Expert',
      task: 'Analyze spatial constraints and their satisfaction',
      context: {
        elements: args.elements,
        topological: args.topological,
        geometric: args.geometric,
        configuration: args.configuration
      },
      instructions: [
        '1. Identify explicit spatial constraints',
        '2. Infer implicit constraints from domain',
        '3. Check constraint satisfaction',
        '4. Identify constraint violations',
        '5. Analyze constraint propagation',
        '6. Identify degrees of freedom',
        '7. Analyze constraint relaxation possibilities',
        '8. Identify minimal constraint sets',
        '9. Assess constraint consistency',
        '10. Document constraint analysis'
      ],
      outputFormat: 'JSON object with constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['topological', 'geometric', 'domain'] },
              expression: { type: 'string' },
              satisfied: { type: 'boolean' },
              violationDegree: { type: 'number' }
            }
          }
        },
        violations: { type: 'array', items: { type: 'object' } },
        degreesOfFreedom: { type: 'number' },
        consistencyStatus: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'constraints', 'satisfaction']
}));

export const spatialTransformationTask = defineTask('spatial-transformation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Spatial Transformation Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Transformation Expert',
      task: 'Analyze possible spatial transformations',
      context: {
        elements: args.elements,
        configuration: args.configuration,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify valid translations',
        '2. Identify valid rotations',
        '3. Identify valid scalings',
        '4. Analyze reflections and symmetry operations',
        '5. Identify topological transformations',
        '6. Analyze deformation possibilities',
        '7. Identify invariants under transformation',
        '8. Analyze transformation paths',
        '9. Identify constraint-preserving transformations',
        '10. Document transformation analysis'
      ],
      outputFormat: 'JSON object with transformation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['transformations'],
      properties: {
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['translation', 'rotation', 'scaling', 'reflection', 'deformation'] },
              parameters: { type: 'object' },
              valid: { type: 'boolean' },
              preserves: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        invariants: { type: 'array', items: { type: 'string' } },
        transformationPaths: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'transformations', 'invariants']
}));

export const spatialQueryTask = defineTask('spatial-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Spatial Query Resolution',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Query Expert',
      task: 'Resolve spatial queries using analysis results',
      context: {
        queries: args.queries,
        elements: args.elements,
        topological: args.topological,
        geometric: args.geometric,
        configuration: args.configuration,
        diagrams: args.diagrams
      },
      instructions: [
        '1. Parse each spatial query',
        '2. Identify query type (relation, position, distance, containment, etc.)',
        '3. Map query to relevant spatial structures',
        '4. Compute answers from analysis',
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
              queryType: { type: 'string', enum: ['relation', 'position', 'distance', 'containment', 'configuration', 'transformation'] },
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
  labels: ['spatial-reasoning', 'query', 'resolution']
}));

export const spatialInferenceTask = defineTask('spatial-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Spatial Inference Generation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Inference Expert',
      task: 'Generate inferences from spatial analysis',
      context: {
        elements: args.elements,
        topological: args.topological,
        geometric: args.geometric,
        configuration: args.configuration,
        constraints: args.constraints,
        transformations: args.transformations,
        domain: args.domain
      },
      instructions: [
        '1. Generate topological inferences',
        '2. Generate geometric inferences',
        '3. Generate configuration-based inferences',
        '4. Apply domain-specific spatial reasoning',
        '5. Generate predictions from spatial patterns',
        '6. Identify spatial implications',
        '7. Generate functional inferences from structure',
        '8. Assess inference confidence',
        '9. Identify alternative interpretations',
        '10. Document spatial inferences'
      ],
      outputFormat: 'JSON object with spatial inferences'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inference: { type: 'string' },
              type: { type: 'string', enum: ['topological', 'geometric', 'configuration', 'functional', 'prediction'] },
              basis: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        predictions: { type: 'array', items: { type: 'object' } },
        alternativeInterpretations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'inference', 'conclusions']
}));

export const spatialSynthesisTask = defineTask('spatial-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Spatial Synthesis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'spatial-reasoning-analyst',
    skills: ['formal-logic-reasoner', 'analogy-mapper'],
    prompt: {
      role: 'Spatial Analysis Synthesist',
      task: 'Synthesize spatial analysis into comprehensive conclusions',
      context: {
        elements: args.elements,
        topological: args.topological,
        geometric: args.geometric,
        configuration: args.configuration,
        diagrams: args.diagrams,
        constraints: args.constraints,
        transformations: args.transformations,
        queryAnswers: args.queryAnswers,
        inferences: args.inferences,
        spatialQueries: args.spatialQueries,
        domain: args.domain
      },
      instructions: [
        '1. Synthesize all spatial analyses',
        '2. Summarize key spatial findings',
        '3. Highlight spatial patterns',
        '4. Provide spatial predictions',
        '5. Identify spatial uncertainties',
        '6. Provide recommendations',
        '7. Note limitations of analysis',
        '8. Suggest further spatial investigation',
        '9. Create spatial summary visualization spec',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with spatial synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'recommendations', 'markdown'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            overallStructure: { type: 'string' },
            keyRelations: { type: 'array', items: { type: 'string' } },
            dominantPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'object' } },
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
        visualizationSpec: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['spatial-reasoning', 'synthesis', 'conclusions']
}));
