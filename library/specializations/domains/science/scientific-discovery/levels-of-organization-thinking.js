/**
 * @process scientific-discovery/levels-of-organization-thinking
 * @description Navigate biological hierarchies from genes to proteins to cells to organisms, analyzing emergent properties and cross-level interactions
 * @inputs { phenomenon: string, startLevel: string, targetLevel: string, system: object, outputDir: string }
 * @outputs { success: boolean, hierarchicalAnalysis: object, emergentProperties: array, crossLevelInteractions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon = '',
    startLevel = 'molecular',
    targetLevel = 'organism',
    system = {},
    outputDir = 'levels-of-organization-output',
    targetCompleteness = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  const levels = ['molecular', 'genetic', 'protein', 'cellular', 'tissue', 'organ', 'system', 'organism', 'population', 'ecosystem'];

  ctx.log('info', `Starting Levels of Organization Thinking Process (${startLevel} to ${targetLevel})`);

  // ============================================================================
  // PHASE 1: LEVEL CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing relevant organizational levels');
  const levelCharacterization = await ctx.task(levelCharacterizationTask, {
    phenomenon,
    levels,
    startLevel,
    targetLevel,
    system,
    outputDir
  });

  artifacts.push(...levelCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: BOTTOM-UP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing bottom-up mechanistic analysis');
  const bottomUpAnalysis = await ctx.task(bottomUpAnalysisTask, {
    phenomenon,
    startLevel,
    targetLevel,
    levels: levelCharacterization.relevantLevels,
    system,
    outputDir
  });

  artifacts.push(...bottomUpAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: TOP-DOWN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing top-down functional analysis');
  const topDownAnalysis = await ctx.task(topDownAnalysisTask, {
    phenomenon,
    startLevel,
    targetLevel,
    levels: levelCharacterization.relevantLevels,
    system,
    outputDir
  });

  artifacts.push(...topDownAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: EMERGENT PROPERTIES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying emergent properties at each level');
  const emergentProperties = await ctx.task(emergentPropertiesTask, {
    phenomenon,
    bottomUpAnalysis,
    topDownAnalysis,
    levels: levelCharacterization.relevantLevels,
    outputDir
  });

  artifacts.push(...emergentProperties.artifacts);

  // ============================================================================
  // PHASE 5: CROSS-LEVEL INTERACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing cross-level interactions');
  const crossLevelAnalysis = await ctx.task(crossLevelInteractionsTask, {
    phenomenon,
    emergentProperties: emergentProperties.properties,
    bottomUpAnalysis,
    topDownAnalysis,
    outputDir
  });

  artifacts.push(...crossLevelAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: CAUSAL PATHWAY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 6: Mapping causal pathways across levels');
  const causalMapping = await ctx.task(causalPathwayMappingTask, {
    phenomenon,
    crossLevelAnalysis,
    emergentProperties: emergentProperties.properties,
    outputDir
  });

  artifacts.push(...causalMapping.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION AND SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating multi-level understanding');
  const synthesis = await ctx.task(multiLevelSynthesisTask, {
    phenomenon,
    levelCharacterization,
    bottomUpAnalysis,
    topDownAnalysis,
    emergentProperties: emergentProperties.properties,
    crossLevelAnalysis,
    causalMapping,
    targetCompleteness,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const completenessMet = synthesis.completenessScore >= targetCompleteness;

  // Breakpoint: Review multi-level analysis
  await ctx.breakpoint({
    question: `Multi-level analysis complete. Completeness: ${synthesis.completenessScore}/${targetCompleteness}. ${completenessMet ? 'Completeness target met!' : 'Additional analysis may be needed.'} Review analysis?`,
    title: 'Levels of Organization Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        startLevel,
        targetLevel,
        levelsAnalyzed: levelCharacterization.relevantLevels.length,
        emergentPropertiesIdentified: emergentProperties.properties.length,
        crossLevelInteractions: crossLevelAnalysis.interactions.length,
        completenessScore: synthesis.completenessScore,
        completenessMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phenomenon,
    startLevel,
    targetLevel,
    hierarchicalAnalysis: {
      levels: levelCharacterization.relevantLevels,
      bottomUp: bottomUpAnalysis.mechanisticChain,
      topDown: topDownAnalysis.functionalDecomposition
    },
    emergentProperties: emergentProperties.properties,
    crossLevelInteractions: crossLevelAnalysis.interactions,
    causalPathways: causalMapping.pathways,
    synthesis: synthesis.integratedUnderstanding,
    completenessScore: synthesis.completenessScore,
    completenessMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/levels-of-organization-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Level Characterization
export const levelCharacterizationTask = defineTask('level-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize relevant organizational levels',
  agent: {
    name: 'systems-biologist',
    prompt: {
      role: 'systems biologist specializing in multi-scale analysis',
      task: 'Characterize the organizational levels relevant to the phenomenon',
      context: args,
      instructions: [
        'Identify all organizational levels relevant to the phenomenon',
        'For each level specify:',
        '  - Key entities/components at that level',
        '  - Characteristic spatial and temporal scales',
        '  - Typical processes and mechanisms',
        '  - Common methods of study',
        'Determine which levels are most important for understanding',
        'Identify level boundaries and transition zones',
        'Note levels where understanding is incomplete',
        'Consider sub-levels within major categories',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with relevantLevels (array with name, entities, scales, processes, methods), levelBoundaries, criticalLevels, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relevantLevels', 'criticalLevels', 'artifacts'],
      properties: {
        relevantLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              spatialScale: { type: 'string' },
              temporalScale: { type: 'string' },
              processes: { type: 'array', items: { type: 'string' } },
              methods: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        levelBoundaries: { type: 'array', items: { type: 'object' } },
        criticalLevels: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'characterization']
}));

// Task 2: Bottom-Up Analysis
export const bottomUpAnalysisTask = defineTask('bottom-up-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform bottom-up mechanistic analysis',
  agent: {
    name: 'mechanistic-biologist',
    prompt: {
      role: 'molecular and cellular biologist',
      task: 'Trace mechanistic explanations from lower to higher levels',
      context: args,
      instructions: [
        'Start at the lowest relevant level',
        'For each level transition (n to n+1):',
        '  - What components at level n give rise to entities at level n+1?',
        '  - What mechanisms/processes enable the transition?',
        '  - What organizational principles are involved?',
        '  - What information is lost in upward causation?',
        'Build a mechanistic chain from bottom to top',
        'Identify reductionist explanations for higher-level phenomena',
        'Note where mechanistic explanations break down',
        'Identify necessary vs sufficient conditions at each level',
        'Save bottom-up analysis to output directory'
      ],
      outputFormat: 'JSON with mechanisticChain (array of level transitions), reductionistExplanations, mechanisticGaps, keyMechanisms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisticChain', 'keyMechanisms', 'artifacts'],
      properties: {
        mechanisticChain: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromLevel: { type: 'string' },
              toLevel: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              mechanisms: { type: 'array', items: { type: 'string' } },
              organizationalPrinciples: { type: 'array', items: { type: 'string' } },
              informationLoss: { type: 'string' }
            }
          }
        },
        reductionistExplanations: { type: 'array', items: { type: 'object' } },
        mechanisticGaps: { type: 'array', items: { type: 'string' } },
        keyMechanisms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'bottom-up']
}));

// Task 3: Top-Down Analysis
export const topDownAnalysisTask = defineTask('top-down-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform top-down functional analysis',
  agent: {
    name: 'physiologist',
    prompt: {
      role: 'physiologist and systems biologist',
      task: 'Analyze how higher-level functions constrain and organize lower levels',
      context: args,
      instructions: [
        'Start at the highest relevant level (organism/system function)',
        'For each level transition (n to n-1):',
        '  - What functions at level n require components at level n-1?',
        '  - How do higher-level constraints shape lower-level organization?',
        '  - What selective pressures operate at each level?',
        '  - What coordination/regulation crosses levels?',
        'Build a functional decomposition from top to bottom',
        'Identify top-down causation and constraint',
        'Note where functional explanations are needed',
        'Consider regulatory hierarchies',
        'Save top-down analysis to output directory'
      ],
      outputFormat: 'JSON with functionalDecomposition (array), topDownConstraints, regulatoryHierarchy, functionalRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalDecomposition', 'topDownConstraints', 'artifacts'],
      properties: {
        functionalDecomposition: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              functions: { type: 'array', items: { type: 'string' } },
              requiredComponents: { type: 'array', items: { type: 'string' } },
              constraintsImposed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        topDownConstraints: { type: 'array', items: { type: 'object' } },
        regulatoryHierarchy: { type: 'array', items: { type: 'object' } },
        functionalRequirements: { type: 'object' },
        downwardCausation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'top-down']
}));

// Task 4: Emergent Properties Identification
export const emergentPropertiesTask = defineTask('emergent-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify emergent properties at each level',
  agent: {
    name: 'complexity-scientist',
    prompt: {
      role: 'complexity scientist and theoretical biologist',
      task: 'Identify emergent properties that arise at each organizational level',
      context: args,
      instructions: [
        'For each level, identify properties that:',
        '  - Are not present at lower levels',
        '  - Cannot be predicted from lower-level components alone',
        '  - Require higher-level description',
        'Classify emergence types:',
        '  - Weak emergence (in principle reducible)',
        '  - Strong emergence (irreducible)',
        '  - Functional emergence (new causal powers)',
        'Explain what enables each emergent property',
        'Identify critical thresholds for emergence',
        'Note phase transitions in organization',
        'Consider computational/information-theoretic aspects',
        'Save emergent properties to output directory'
      ],
      outputFormat: 'JSON with properties (array with level, property, type, enablers, threshold), criticalTransitions, informationProcessing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'criticalTransitions', 'artifacts'],
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              property: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['weak', 'strong', 'functional'] },
              enablers: { type: 'array', items: { type: 'string' } },
              threshold: { type: 'string' }
            }
          }
        },
        criticalTransitions: { type: 'array', items: { type: 'object' } },
        informationProcessing: { type: 'object' },
        complexityMeasures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'emergence']
}));

// Task 5: Cross-Level Interactions
export const crossLevelInteractionsTask = defineTask('cross-level-interactions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cross-level interactions',
  agent: {
    name: 'integrative-biologist',
    prompt: {
      role: 'integrative biologist specializing in multi-level dynamics',
      task: 'Identify and characterize interactions that span organizational levels',
      context: args,
      instructions: [
        'Identify interactions between non-adjacent levels',
        'Characterize types of cross-level interactions:',
        '  - Upward causation (lower affects higher)',
        '  - Downward causation (higher affects lower)',
        '  - Circular causation (feedback loops across levels)',
        '  - Level-spanning signals',
        'For each interaction specify:',
        '  - Levels involved',
        '  - Direction of influence',
        '  - Mechanism of transmission',
        '  - Time scales',
        '  - Strength and specificity',
        'Identify cross-level feedback loops',
        'Note disruptions that propagate across levels',
        'Save cross-level analysis to output directory'
      ],
      outputFormat: 'JSON with interactions (array), feedbackLoops, propagationPatterns, levelCoupling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interactions', 'feedbackLoops', 'artifacts'],
      properties: {
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromLevel: { type: 'string' },
              toLevel: { type: 'string' },
              direction: { type: 'string', enum: ['upward', 'downward', 'bidirectional'] },
              mechanism: { type: 'string' },
              timeScale: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        feedbackLoops: { type: 'array', items: { type: 'object' } },
        propagationPatterns: { type: 'array', items: { type: 'string' } },
        levelCoupling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'cross-level']
}));

// Task 6: Causal Pathway Mapping
export const causalPathwayMappingTask = defineTask('causal-pathway-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map causal pathways across levels',
  agent: {
    name: 'causal-reasoning-specialist',
    prompt: {
      role: 'philosopher of biology and causal reasoning specialist',
      task: 'Map causal pathways that connect phenomena across organizational levels',
      context: args,
      instructions: [
        'Trace causal chains that span multiple levels',
        'For each pathway identify:',
        '  - Initiating cause and level',
        '  - Intermediate steps and level transitions',
        '  - Ultimate effect and level',
        '  - Timecourse of causation',
        'Distinguish:',
        '  - Constitutive relationships (part-whole)',
        '  - Causal relationships (cause-effect)',
        '  - Correlational relationships',
        'Identify rate-limiting steps in multi-level causation',
        'Map intervention points at each level',
        'Consider counterfactual reasoning across levels',
        'Save causal mapping to output directory'
      ],
      outputFormat: 'JSON with pathways (array), constitutiveRelations, causalRelations, interventionPoints, rateLimitingSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pathways', 'interventionPoints', 'artifacts'],
      properties: {
        pathways: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              steps: { type: 'array', items: { type: 'object' } },
              timecourse: { type: 'string' },
              reversibility: { type: 'string' }
            }
          }
        },
        constitutiveRelations: { type: 'array', items: { type: 'object' } },
        causalRelations: { type: 'array', items: { type: 'object' } },
        interventionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              target: { type: 'string' },
              expectedEffect: { type: 'string' }
            }
          }
        },
        rateLimitingSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'causal-mapping']
}));

// Task 7: Multi-Level Synthesis
export const multiLevelSynthesisTask = defineTask('multi-level-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate multi-level understanding',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior integrative biologist',
      task: 'Synthesize understanding across organizational levels into coherent explanation',
      context: args,
      instructions: [
        'Integrate bottom-up and top-down analyses',
        'Create coherent multi-level explanation of the phenomenon',
        'Identify the most explanatory level for different aspects',
        'Show how emergent properties contribute to explanation',
        'Describe cross-level interactions in unified framework',
        'Assess completeness of multi-level understanding (0-100):',
        '  - Are all relevant levels characterized?',
        '  - Are level transitions explained?',
        '  - Are emergent properties accounted for?',
        '  - Are cross-level interactions mapped?',
        'Identify remaining questions at each level',
        'Provide recommendations for further investigation',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with integratedUnderstanding, completenessScore, explanatoryLevels, remainingQuestions, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedUnderstanding', 'completenessScore', 'artifacts'],
      properties: {
        integratedUnderstanding: {
          type: 'object',
          properties: {
            narrative: { type: 'string' },
            keyInsights: { type: 'array', items: { type: 'string' } },
            unifiedFramework: { type: 'string' }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        explanatoryLevels: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        remainingQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              question: { type: 'string' },
              importance: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'levels-of-organization', 'synthesis']
}));
