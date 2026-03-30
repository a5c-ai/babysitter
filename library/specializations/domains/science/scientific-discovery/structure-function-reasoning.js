/**
 * @process scientific-discovery/structure-function-reasoning
 * @description Structure-function reasoning process for inferring biological function from structure and vice versa, analyzing molecular architecture, and understanding form-function relationships
 * @inputs { structure: object, function: string, level: string, context: object, outputDir: string }
 * @outputs { success: boolean, inference: object, structureFunctionMapping: object, predictions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    structure = null,
    function: targetFunction = null,
    level = 'molecular', // molecular, cellular, tissue, organ, organism
    context = {},
    outputDir = 'structure-function-output',
    targetConfidence = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Determine inference direction
  const inferenceDirection = structure && !targetFunction ? 'structure-to-function'
    : !structure && targetFunction ? 'function-to-structure'
    : 'bidirectional';

  ctx.log('info', `Starting Structure-Function Reasoning Process (${inferenceDirection})`);

  // ============================================================================
  // PHASE 1: STRUCTURAL ANALYSIS (if structure provided)
  // ============================================================================

  let structuralAnalysis = null;
  if (structure) {
    ctx.log('info', 'Phase 1: Analyzing structural features');
    structuralAnalysis = await ctx.task(structuralAnalysisTask, {
      structure,
      level,
      context,
      outputDir
    });
    artifacts.push(...structuralAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 2: FUNCTIONAL REQUIREMENTS ANALYSIS (if function provided)
  // ============================================================================

  let functionalAnalysis = null;
  if (targetFunction) {
    ctx.log('info', 'Phase 2: Analyzing functional requirements');
    functionalAnalysis = await ctx.task(functionalRequirementsTask, {
      function: targetFunction,
      level,
      context,
      outputDir
    });
    artifacts.push(...functionalAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 3: STRUCTURE-FUNCTION MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping structure to function relationships');
  const mappingAnalysis = await ctx.task(structureFunctionMappingTask, {
    structuralAnalysis,
    functionalAnalysis,
    level,
    inferenceDirection,
    context,
    outputDir
  });

  artifacts.push(...mappingAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: COMPARATIVE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Performing comparative analysis');
  const comparativeAnalysis = await ctx.task(comparativeStructureFunctionTask, {
    structure,
    function: targetFunction,
    mapping: mappingAnalysis.mapping,
    level,
    outputDir
  });

  artifacts.push(...comparativeAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CONSTRAINT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing structural and functional constraints');
  const constraintAnalysis = await ctx.task(constraintAnalysisTask, {
    structuralAnalysis,
    functionalAnalysis,
    mapping: mappingAnalysis.mapping,
    level,
    outputDir
  });

  artifacts.push(...constraintAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: INFERENCE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating structure-function inferences');
  const inferences = await ctx.task(inferenceGenerationTask, {
    structuralAnalysis,
    functionalAnalysis,
    mappingAnalysis,
    comparativeAnalysis,
    constraintAnalysis,
    inferenceDirection,
    level,
    targetConfidence,
    outputDir
  });

  artifacts.push(...inferences.artifacts);

  const confidenceMet = inferences.confidenceScore >= targetConfidence;

  // Breakpoint: Review inferences
  await ctx.breakpoint({
    question: `Structure-function inference complete. Confidence: ${inferences.confidenceScore}/${targetConfidence}. ${confidenceMet ? 'Confidence target met!' : 'Additional analysis may be needed.'} Review inferences?`,
    title: 'Structure-Function Reasoning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        inferenceDirection,
        level,
        confidenceScore: inferences.confidenceScore,
        confidenceMet,
        mappingsIdentified: mappingAnalysis.mapping.relationships.length,
        constraintsIdentified: constraintAnalysis.constraints.length
      }
    }
  });

  // ============================================================================
  // PHASE 7: PREDICTIONS AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating testable predictions');
  const predictions = await ctx.task(predictionGenerationTask, {
    inferences,
    mappingAnalysis,
    level,
    outputDir
  });

  artifacts.push(...predictions.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    inferenceDirection,
    level,
    inference: inferences.primaryInference,
    structureFunctionMapping: mappingAnalysis.mapping,
    structuralFeatures: structuralAnalysis?.features || null,
    functionalRequirements: functionalAnalysis?.requirements || null,
    constraints: constraintAnalysis.constraints,
    comparativeInsights: comparativeAnalysis.insights,
    predictions: predictions.predictions,
    confidenceScore: inferences.confidenceScore,
    confidenceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/structure-function-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Structural Analysis
export const structuralAnalysisTask = defineTask('structural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze structural features',
  agent: {
    name: 'structural-biologist',
    prompt: {
      role: 'structural biologist and biophysicist',
      task: 'Analyze structural features that may relate to function',
      context: args,
      instructions: [
        'Characterize the overall architecture and organization',
        'Identify key structural motifs and domains',
        'Analyze shape, size, and spatial arrangement',
        'Identify binding sites, active sites, or interaction surfaces',
        'Characterize flexibility and conformational states',
        'Analyze surface properties (charge, hydrophobicity)',
        'Identify conserved structural elements',
        'Note structural features that constrain or enable function',
        'Consider multiple scales of organization',
        'Save structural analysis to output directory'
      ],
      outputFormat: 'JSON with features (array), architecture, motifs, bindingSites, dynamics, surfaceProperties, conservedElements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'architecture', 'artifacts'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              functionalImplication: { type: 'string' }
            }
          }
        },
        architecture: {
          type: 'object',
          properties: {
            organization: { type: 'string' },
            symmetry: { type: 'string' },
            hierarchy: { type: 'array', items: { type: 'string' } }
          }
        },
        motifs: { type: 'array', items: { type: 'object' } },
        bindingSites: { type: 'array', items: { type: 'object' } },
        dynamics: { type: 'object' },
        surfaceProperties: { type: 'object' },
        conservedElements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'structural-analysis']
}));

// Task 2: Functional Requirements Analysis
export const functionalRequirementsTask = defineTask('functional-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze functional requirements',
  agent: {
    name: 'functional-biologist',
    prompt: {
      role: 'molecular biologist and physiologist',
      task: 'Analyze what structural features would be required to perform the function',
      context: args,
      instructions: [
        'Define the function precisely',
        'Break down function into component steps/processes',
        'Identify physical/chemical requirements for each step',
        'Determine structural features needed to meet requirements:',
        '  - Binding specificity requirements',
        '  - Catalytic requirements',
        '  - Mechanical requirements',
        '  - Energy requirements',
        '  - Spatial/temporal requirements',
        'Consider efficiency and regulation requirements',
        'Identify constraints imposed by cellular/organismal context',
        'List structural solutions used by known systems',
        'Save functional analysis to output directory'
      ],
      outputFormat: 'JSON with requirements (array), componentProcesses, physicalRequirements, structuralSolutions, regulatoryNeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'componentProcesses', 'artifacts'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              type: { type: 'string' },
              criticality: { type: 'string', enum: ['essential', 'important', 'optional'] }
            }
          }
        },
        componentProcesses: { type: 'array', items: { type: 'object' } },
        physicalRequirements: {
          type: 'object',
          properties: {
            binding: { type: 'array', items: { type: 'string' } },
            catalysis: { type: 'array', items: { type: 'string' } },
            mechanical: { type: 'array', items: { type: 'string' } },
            energetic: { type: 'array', items: { type: 'string' } }
          }
        },
        structuralSolutions: { type: 'array', items: { type: 'object' } },
        regulatoryNeeds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'functional-analysis']
}));

// Task 3: Structure-Function Mapping
export const structureFunctionMappingTask = defineTask('structure-function-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map structure-function relationships',
  agent: {
    name: 'structure-function-analyst',
    prompt: {
      role: 'systems biologist and structure-function specialist',
      task: 'Create explicit mappings between structural features and functional roles',
      context: args,
      instructions: [
        'For each structural feature, identify potential functional roles',
        'For each functional requirement, identify structural features that could fulfill it',
        'Classify relationships:',
        '  - Direct (structure directly enables function)',
        '  - Indirect (structure enables another structure that enables function)',
        '  - Modulatory (structure modifies/regulates function)',
        '  - Structural (maintains integrity without direct functional role)',
        'Assess strength of each structure-function link',
        'Identify structure-function modules',
        'Note many-to-one and one-to-many relationships',
        'Identify gaps (structures without known function, functions without known structure)',
        'Save mapping to output directory'
      ],
      outputFormat: 'JSON with mapping (relationships array, modules, gaps), inferredFunctions, inferredStructures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'artifacts'],
      properties: {
        mapping: {
          type: 'object',
          properties: {
            relationships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  structure: { type: 'string' },
                  function: { type: 'string' },
                  type: { type: 'string' },
                  strength: { type: 'string', enum: ['strong', 'moderate', 'weak', 'hypothetical'] },
                  evidence: { type: 'string' }
                }
              }
            },
            modules: { type: 'array', items: { type: 'object' } },
            gaps: {
              type: 'object',
              properties: {
                unknownFunctions: { type: 'array', items: { type: 'string' } },
                unknownStructures: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        inferredFunctions: { type: 'array', items: { type: 'object' } },
        inferredStructures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'mapping']
}));

// Task 4: Comparative Structure-Function Analysis
export const comparativeStructureFunctionTask = defineTask('comparative-structure-function', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform comparative analysis',
  agent: {
    name: 'comparative-biologist',
    prompt: {
      role: 'comparative biologist and evolutionary biochemist',
      task: 'Compare structure-function relationships across related systems',
      context: args,
      instructions: [
        'Identify homologous structures/functions in other systems',
        'Compare structural solutions for similar functions',
        'Analyze convergent evolution (different structures, same function)',
        'Analyze divergent evolution (same structure, different functions)',
        'Identify conserved structure-function relationships',
        'Note structural variations that affect function',
        'Learn from well-characterized homologs',
        'Identify principles that apply broadly',
        'Consider artificial/engineered systems as comparisons',
        'Save comparative analysis to output directory'
      ],
      outputFormat: 'JSON with insights (array), homologs, convergentExamples, divergentExamples, conservedRelationships, generalPrinciples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'homologs', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        homologs: { type: 'array', items: { type: 'object' } },
        convergentExamples: { type: 'array', items: { type: 'object' } },
        divergentExamples: { type: 'array', items: { type: 'object' } },
        conservedRelationships: { type: 'array', items: { type: 'string' } },
        generalPrinciples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'comparative']
}));

// Task 5: Constraint Analysis
export const constraintAnalysisTask = defineTask('constraint-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze structural and functional constraints',
  agent: {
    name: 'constraint-analyst',
    prompt: {
      role: 'biophysicist and evolutionary biologist',
      task: 'Identify constraints that link structure and function',
      context: args,
      instructions: [
        'Identify physical constraints (thermodynamics, mechanics, kinetics)',
        'Identify chemical constraints (reactivity, stability)',
        'Identify biological constraints (cellular context, regulation)',
        'Identify evolutionary constraints (historical, developmental)',
        'For each constraint:',
        '  - How does it limit structural possibilities?',
        '  - How does it shape functional possibilities?',
        '  - Is it absolute or can it be overcome?',
        'Identify trade-offs between conflicting constraints',
        'Analyze how constraints channel evolution',
        'Consider how constraints inform predictions',
        'Save constraint analysis to output directory'
      ],
      outputFormat: 'JSON with constraints (array with type, description, structuralImpact, functionalImpact), tradeoffs, constraintHierarchy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'tradeoffs', 'artifacts'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['physical', 'chemical', 'biological', 'evolutionary', 'developmental'] },
              description: { type: 'string' },
              structuralImpact: { type: 'string' },
              functionalImpact: { type: 'string' },
              stringency: { type: 'string', enum: ['absolute', 'strong', 'moderate', 'weak'] }
            }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        constraintHierarchy: { type: 'array', items: { type: 'string' } },
        designSpace: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'constraints']
}));

// Task 6: Inference Generation
export const inferenceGenerationTask = defineTask('inference-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate structure-function inferences',
  agent: {
    name: 'inference-specialist',
    prompt: {
      role: 'senior scientist specializing in structure-function relationships',
      task: 'Generate well-supported inferences from structure-function analysis',
      context: args,
      instructions: [
        'Synthesize all analyses to generate primary inference',
        'If structure-to-function: What function(s) does this structure perform?',
        'If function-to-structure: What structure(s) could perform this function?',
        'Rate confidence in each inference (0-100)',
        'Consider:',
        '  - Strength of evidence',
        '  - Consistency with constraints',
        '  - Support from comparative analysis',
        '  - Alternative explanations',
        'Identify which structural features are most functionally important',
        'Identify which functional requirements most constrain structure',
        'Note uncertainties and alternative possibilities',
        'Save inferences to output directory'
      ],
      outputFormat: 'JSON with primaryInference, confidenceScore, supportingEvidence, alternativeInferences, keyUncertainties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryInference', 'confidenceScore', 'artifacts'],
      properties: {
        primaryInference: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            type: { type: 'string' },
            mechanism: { type: 'string' },
            confidence: { type: 'number' }
          }
        },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        supportingEvidence: { type: 'array', items: { type: 'string' } },
        alternativeInferences: { type: 'array', items: { type: 'object' } },
        keyUncertainties: { type: 'array', items: { type: 'string' } },
        criticalFeatures: {
          type: 'object',
          properties: {
            structuralFeatures: { type: 'array', items: { type: 'string' } },
            functionalRequirements: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'structure-function', 'inference']
}));

// Task 7: Prediction Generation
export const predictionGenerationTask = defineTask('prediction-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate testable predictions',
  agent: {
    name: 'prediction-specialist',
    prompt: {
      role: 'experimental biologist and research designer',
      task: 'Generate testable predictions from structure-function inferences',
      context: args,
      instructions: [
        'Generate predictions that would validate the inference:',
        '  - Mutational predictions (what happens if structure X is altered?)',
        '  - Binding predictions (what will interact with this structure?)',
        '  - Kinetic predictions (how fast will function occur?)',
        '  - Localization predictions (where will structure/function occur?)',
        '  - Evolutionary predictions (what will be conserved?)',
        'For each prediction specify:',
        '  - Specific testable statement',
        '  - Method to test it',
        '  - Expected result if inference is correct',
        '  - Expected result if inference is wrong',
        'Prioritize predictions by informativeness',
        'Save predictions to output directory'
      ],
      outputFormat: 'JSON with predictions (array with statement, method, expectedIfCorrect, expectedIfWrong, type, priority), criticalTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'artifacts'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              method: { type: 'string' },
              expectedIfCorrect: { type: 'string' },
              expectedIfWrong: { type: 'string' },
              type: { type: 'string', enum: ['mutational', 'binding', 'kinetic', 'localization', 'evolutionary', 'structural'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        criticalTests: { type: 'array', items: { type: 'object' } },
        validationStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure-function', 'predictions']
}));
