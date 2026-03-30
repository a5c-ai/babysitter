/**
 * @process specializations/domains/science/scientific-discovery/causal-discovery
 * @description Causal Discovery Process - Infer causal graph structure from data plus assumptions
 * using constraint-based, score-based, and hybrid algorithms for automated causal structure learning.
 * @inputs { domain: string, variables: string[], dataset?: object, priorKnowledge?: object, assumptions?: string[] }
 * @outputs { success: boolean, discoveredGraph: object, confidenceScores: object, alternativeStructures: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/causal-discovery', {
 *   domain: 'Genomics',
 *   variables: ['gene_A', 'gene_B', 'gene_C', 'phenotype'],
 *   priorKnowledge: { forbiddenEdges: [['phenotype', 'gene_A']] },
 *   assumptions: ['Causal Markov Assumption', 'Faithfulness']
 * });
 *
 * @references
 * - Spirtes, Glymour, Scheines (2000). Causation, Prediction, and Search
 * - Chickering (2002). Optimal Structure Identification With Greedy Search
 * - Zheng et al. (2018). DAGs with NO TEARS
 * - Huang et al. (2020). Causal Discovery from Heterogeneous/Nonstationary Data
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    variables,
    dataset = null,
    priorKnowledge = {},
    assumptions = ['Causal Markov Assumption', 'Faithfulness']
  } = inputs;

  // Phase 1: Data Characterization
  const dataCharacterization = await ctx.task(dataCharacterizationTask, {
    domain,
    variables,
    dataset,
    assumptions
  });

  // Phase 2: Algorithm Selection
  const algorithmSelection = await ctx.task(algorithmSelectionTask, {
    dataCharacterization,
    priorKnowledge,
    assumptions,
    domain
  });

  // Phase 3: Constraint-Based Discovery
  const constraintBasedResults = await ctx.task(constraintBasedDiscoveryTask, {
    variables,
    dataset,
    priorKnowledge,
    dataCharacterization,
    selectedAlgorithms: algorithmSelection.constraintBased
  });

  // Phase 4: Score-Based Discovery
  const scoreBasedResults = await ctx.task(scoreBasedDiscoveryTask, {
    variables,
    dataset,
    priorKnowledge,
    dataCharacterization,
    selectedAlgorithms: algorithmSelection.scoreBased
  });

  // Phase 5: Functional Causal Models (if applicable)
  const fcmResults = await ctx.task(functionalCausalModelTask, {
    variables,
    dataset,
    dataCharacterization,
    priorKnowledge
  });

  // Phase 6: Structure Integration
  const integratedStructure = await ctx.task(structureIntegrationTask, {
    constraintBasedResults,
    scoreBasedResults,
    fcmResults,
    priorKnowledge,
    domain
  });

  // Quality Gate: Check structure consistency
  if (!integratedStructure.isConsistent) {
    await ctx.breakpoint({
      question: `Discovered causal structures show inconsistencies. Conflict rate: ${integratedStructure.conflictRate}%. Review and resolve?`,
      title: 'Causal Structure Inconsistency',
      context: {
        runId: ctx.runId,
        conflicts: integratedStructure.conflicts,
        recommendation: 'Review conflicting edges and consider additional domain knowledge'
      }
    });
  }

  // Phase 7: Edge Orientation
  const orientedGraph = await ctx.task(edgeOrientationTask, {
    integratedStructure,
    priorKnowledge,
    dataset,
    assumptions
  });

  // Phase 8: Confidence Assessment
  const confidenceAssessment = await ctx.task(confidenceAssessmentTask, {
    orientedGraph,
    constraintBasedResults,
    scoreBasedResults,
    fcmResults,
    dataset
  });

  // Phase 9: Latent Variable Detection
  const latentVariableAnalysis = await ctx.task(latentVariableDetectionTask, {
    orientedGraph,
    dataset,
    domain
  });

  // Phase 10: Validation
  const validationResults = await ctx.task(structureValidationTask, {
    orientedGraph,
    confidenceAssessment,
    latentVariableAnalysis,
    domain,
    priorKnowledge
  });

  // Final Breakpoint: Expert Review
  await ctx.breakpoint({
    question: `Causal discovery complete for ${domain}. ${orientedGraph.edges.length} edges discovered with ${confidenceAssessment.averageConfidence}% average confidence. Review discovered structure?`,
    title: 'Causal Discovery Review',
    context: {
      runId: ctx.runId,
      domain,
      graphSummary: orientedGraph.summary,
      files: [
        { path: 'artifacts/discovered-graph.json', format: 'json', content: orientedGraph },
        { path: 'artifacts/confidence-scores.json', format: 'json', content: confidenceAssessment }
      ]
    }
  });

  return {
    success: true,
    domain,
    discoveredGraph: {
      nodes: orientedGraph.nodes,
      edges: orientedGraph.edges,
      graphType: orientedGraph.graphType,
      equivalenceClass: orientedGraph.equivalenceClass
    },
    confidenceScores: {
      edgeConfidence: confidenceAssessment.edgeConfidence,
      overallConfidence: confidenceAssessment.averageConfidence,
      methodology: confidenceAssessment.methodology
    },
    alternativeStructures: integratedStructure.alternativeStructures,
    latentVariables: latentVariableAnalysis.detectedLatents,
    algorithmResults: {
      constraintBased: constraintBasedResults.summary,
      scoreBased: scoreBasedResults.summary,
      fcm: fcmResults.summary
    },
    validation: validationResults,
    assumptions: assumptions,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/causal-discovery',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataCharacterizationTask = defineTask('data-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Characterization for Causal Discovery - ${args.domain}`,
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in statistical data analysis and causal discovery prerequisites',
      task: 'Characterize the dataset for optimal causal discovery algorithm selection',
      context: {
        domain: args.domain,
        variables: args.variables,
        dataset: args.dataset,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Assess sample size relative to number of variables (n/p ratio)',
        '2. Determine variable types (continuous, discrete, mixed)',
        '3. Check for data distributions (Gaussian, non-Gaussian, multimodal)',
        '4. Assess for missing data patterns (MCAR, MAR, MNAR)',
        '5. Check for temporal structure or time series nature',
        '6. Assess for heterogeneity/regime changes in data',
        '7. Evaluate multicollinearity and redundancy',
        '8. Check for nonlinear relationships',
        '9. Assess for outliers and their impact',
        '10. Determine appropriate independence tests for the data'
      ],
      outputFormat: 'JSON object with comprehensive data characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSize', 'variableTypes', 'suitableAlgorithms'],
      properties: {
        sampleSize: { type: 'number' },
        numVariables: { type: 'number' },
        npRatio: { type: 'number' },
        variableTypes: {
          type: 'object',
          properties: {
            continuous: { type: 'array', items: { type: 'string' } },
            discrete: { type: 'array', items: { type: 'string' } },
            ordinal: { type: 'array', items: { type: 'string' } }
          }
        },
        distributionCharacteristics: {
          type: 'object',
          properties: {
            isGaussian: { type: 'boolean' },
            hasNonlinearities: { type: 'boolean' },
            multimodal: { type: 'boolean' }
          }
        },
        missingData: {
          type: 'object',
          properties: {
            percentage: { type: 'number' },
            pattern: { type: 'string', enum: ['MCAR', 'MAR', 'MNAR', 'none'] }
          }
        },
        temporalStructure: { type: 'boolean' },
        heterogeneity: { type: 'boolean' },
        suitableAlgorithms: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendedIndependenceTests: {
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
  labels: ['causal-discovery', 'data-analysis', 'preprocessing']
}));

export const algorithmSelectionTask = defineTask('algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Discovery Algorithm Selection',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in causal discovery algorithms and structure learning',
      task: 'Select optimal algorithms for causal structure discovery',
      context: {
        dataCharacterization: args.dataCharacterization,
        priorKnowledge: args.priorKnowledge,
        assumptions: args.assumptions,
        domain: args.domain
      },
      instructions: [
        '1. Evaluate constraint-based algorithms (PC, FCI, RFCI, CCD)',
        '2. Evaluate score-based algorithms (GES, FGES, GIES, BOSS)',
        '3. Evaluate hybrid algorithms (GFCI, MMHC)',
        '4. Consider continuous optimization methods (NOTEARS, GOLEM, DAG-GNN)',
        '5. Evaluate functional causal model approaches (LiNGAM, ANM)',
        '6. Consider time series methods if applicable (PCMCI, VARLiNGAM)',
        '7. Assess computational requirements for each algorithm',
        '8. Consider ensemble approaches for robustness',
        '9. Match algorithm assumptions to data characteristics',
        '10. Recommend primary and validation algorithms'
      ],
      outputFormat: 'JSON object with algorithm recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['constraintBased', 'scoreBased', 'primaryAlgorithm'],
      properties: {
        constraintBased: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              suitability: { type: 'string', enum: ['high', 'medium', 'low'] },
              assumptions: { type: 'array', items: { type: 'string' } },
              parameters: { type: 'object' }
            }
          }
        },
        scoreBased: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scoringFunction: { type: 'string' },
              suitability: { type: 'string', enum: ['high', 'medium', 'low'] },
              parameters: { type: 'object' }
            }
          }
        },
        functionalMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              applicable: { type: 'boolean' },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primaryAlgorithm: { type: 'string' },
        ensembleStrategy: {
          type: 'object',
          properties: {
            use: { type: 'boolean' },
            algorithms: { type: 'array', items: { type: 'string' } },
            aggregation: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'algorithm-selection', 'methodology']
}));

export const constraintBasedDiscoveryTask = defineTask('constraint-based-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constraint-Based Causal Discovery',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in constraint-based causal discovery algorithms',
      task: 'Apply constraint-based algorithms to discover causal structure',
      context: {
        variables: args.variables,
        dataset: args.dataset,
        priorKnowledge: args.priorKnowledge,
        dataCharacterization: args.dataCharacterization,
        selectedAlgorithms: args.selectedAlgorithms
      },
      instructions: [
        '1. Apply PC algorithm with appropriate independence tests',
        '2. Apply FCI if latent confounders are suspected',
        '3. Use conditional independence tests matching data type',
        '4. Set significance level for independence tests (alpha)',
        '5. Apply stable/order-independent variants',
        '6. Incorporate prior knowledge as constraints',
        '7. Handle missing edges due to insufficient power',
        '8. Document detected v-structures (colliders)',
        '9. Apply orientation rules systematically',
        '10. Output skeleton and partially oriented graph'
      ],
      outputFormat: 'JSON object with constraint-based discovery results'
    },
    outputSchema: {
      type: 'object',
      required: ['skeleton', 'partiallyOrientedGraph'],
      properties: {
        skeleton: {
          type: 'object',
          properties: {
            edges: { type: 'array', items: { type: 'object' } },
            numEdges: { type: 'number' }
          }
        },
        partiallyOrientedGraph: {
          type: 'object',
          properties: {
            directedEdges: { type: 'array', items: { type: 'object' } },
            undirectedEdges: { type: 'array', items: { type: 'object' } },
            bidirectedEdges: { type: 'array', items: { type: 'object' } }
          }
        },
        vStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'string' },
              y: { type: 'string' },
              z: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        separatingSets: { type: 'object' },
        independenceTests: {
          type: 'object',
          properties: {
            testUsed: { type: 'string' },
            alphaLevel: { type: 'number' },
            numTests: { type: 'number' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            edges: { type: 'number' },
            orientedEdges: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'constraint-based', 'pc-algorithm']
}));

export const scoreBasedDiscoveryTask = defineTask('score-based-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score-Based Causal Discovery',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in score-based causal discovery and structure learning',
      task: 'Apply score-based algorithms to discover causal structure',
      context: {
        variables: args.variables,
        dataset: args.dataset,
        priorKnowledge: args.priorKnowledge,
        dataCharacterization: args.dataCharacterization,
        selectedAlgorithms: args.selectedAlgorithms
      },
      instructions: [
        '1. Apply GES (Greedy Equivalence Search) algorithm',
        '2. Use appropriate scoring function (BIC, BDeu, BGe)',
        '3. Apply FGES for high-dimensional data if needed',
        '4. Consider GIES for interventional data',
        '5. Incorporate prior knowledge as forbidden/required edges',
        '6. Apply sparsity penalties appropriately',
        '7. Search for optimal DAG within equivalence class',
        '8. Compare scores across candidate structures',
        '9. Report score improvement trajectory',
        '10. Output best DAG and equivalence class (CPDAG)'
      ],
      outputFormat: 'JSON object with score-based discovery results'
    },
    outputSchema: {
      type: 'object',
      required: ['bestDAG', 'score', 'cpdag'],
      properties: {
        bestDAG: {
          type: 'object',
          properties: {
            edges: { type: 'array', items: { type: 'object' } },
            numEdges: { type: 'number' }
          }
        },
        score: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            scoringFunction: { type: 'string' },
            normalized: { type: 'number' }
          }
        },
        cpdag: {
          type: 'object',
          properties: {
            directedEdges: { type: 'array', items: { type: 'object' } },
            undirectedEdges: { type: 'array', items: { type: 'object' } }
          }
        },
        searchPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              operation: { type: 'string' },
              scoreChange: { type: 'number' }
            }
          }
        },
        alternativeDAGs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dag: { type: 'object' },
              score: { type: 'number' },
              scoreDifference: { type: 'number' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            bestScore: { type: 'number' },
            edges: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'score-based', 'ges-algorithm']
}));

export const functionalCausalModelTask = defineTask('functional-causal-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Functional Causal Model Discovery',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in functional causal models and identifiability',
      task: 'Apply functional causal model methods for structure identification',
      context: {
        variables: args.variables,
        dataset: args.dataset,
        dataCharacterization: args.dataCharacterization,
        priorKnowledge: args.priorKnowledge
      },
      instructions: [
        '1. Check applicability of LiNGAM (Linear Non-Gaussian)',
        '2. Apply DirectLiNGAM or ICA-LiNGAM if applicable',
        '3. Consider ANM (Additive Noise Models) for nonlinear cases',
        '4. Apply IGCI (Information-Geometric Causal Inference) for bivariate',
        '5. Test residual independence for direction identification',
        '6. Assess non-Gaussianity of noise terms',
        '7. Apply regression-based orientation tests',
        '8. Consider post-nonlinear causal models',
        '9. Validate functional form assumptions',
        '10. Report orientation decisions with confidence'
      ],
      outputFormat: 'JSON object with FCM discovery results'
    },
    outputSchema: {
      type: 'object',
      required: ['orientedEdges', 'applicable'],
      properties: {
        applicable: { type: 'boolean' },
        method: { type: 'string' },
        orientedEdges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              confidence: { type: 'number' },
              evidence: { type: 'string' }
            }
          }
        },
        nonGaussianityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              testStatistic: { type: 'number' },
              isNonGaussian: { type: 'boolean' }
            }
          }
        },
        residualIndependence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pair: { type: 'array', items: { type: 'string' } },
              direction: { type: 'string' },
              pValue: { type: 'number' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            applicable: { type: 'boolean' },
            orientedEdges: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'fcm', 'lingam']
}));

export const structureIntegrationTask = defineTask('structure-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Structure Integration',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in causal structure learning and ensemble methods',
      task: 'Integrate results from multiple causal discovery approaches',
      context: {
        constraintBasedResults: args.constraintBasedResults,
        scoreBasedResults: args.scoreBasedResults,
        fcmResults: args.fcmResults,
        priorKnowledge: args.priorKnowledge,
        domain: args.domain
      },
      instructions: [
        '1. Compare edge presence across all methods',
        '2. Identify consensus edges (present in all/most methods)',
        '3. Identify conflicting edges and their nature',
        '4. Apply voting or weighted aggregation for edge inclusion',
        '5. Resolve orientation conflicts using domain knowledge',
        '6. Assess consistency of equivalence classes',
        '7. Generate confidence-weighted integrated structure',
        '8. Identify edges with high uncertainty',
        '9. Document conflicts and resolution rationale',
        '10. Produce final integrated CPDAG/PAG'
      ],
      outputFormat: 'JSON object with integrated structure'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedGraph', 'isConsistent'],
      properties: {
        integratedGraph: {
          type: 'object',
          properties: {
            edges: { type: 'array', items: { type: 'object' } },
            consensusEdges: { type: 'array', items: { type: 'object' } },
            uncertainEdges: { type: 'array', items: { type: 'object' } }
          }
        },
        isConsistent: { type: 'boolean' },
        conflictRate: { type: 'number' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              edge: { type: 'object' },
              methods: { type: 'array', items: { type: 'string' } },
              resolution: { type: 'string' }
            }
          }
        },
        aggregationMethod: { type: 'string' },
        alternativeStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              structure: { type: 'object' },
              support: { type: 'number' }
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
  labels: ['causal-discovery', 'integration', 'ensemble']
}));

export const edgeOrientationTask = defineTask('edge-orientation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Edge Orientation',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in causal orientation rules and Meek rules',
      task: 'Complete edge orientation in the integrated structure',
      context: {
        integratedStructure: args.integratedStructure,
        priorKnowledge: args.priorKnowledge,
        dataset: args.dataset,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Apply Meek orientation rules (R1-R4)',
        '2. Apply FCI orientation rules if latents suspected',
        '3. Use background knowledge for forced orientations',
        '4. Apply v-structure orientations',
        '5. Propagate orientations to prevent cycles',
        '6. Document unorientable edges (equivalence class)',
        '7. Assess orientation confidence for each edge',
        '8. Check for faithfulness violations',
        '9. Validate acyclicity constraint',
        '10. Produce final oriented graph with uncertainty'
      ],
      outputFormat: 'JSON object with fully oriented graph'
    },
    outputSchema: {
      type: 'object',
      required: ['nodes', 'edges', 'graphType'],
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              oriented: { type: 'boolean' },
              orientationRule: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        graphType: { type: 'string', enum: ['DAG', 'CPDAG', 'PAG', 'MAG'] },
        equivalenceClass: {
          type: 'object',
          properties: {
            size: { type: 'number' },
            unorientedEdges: { type: 'number' }
          }
        },
        orientationRulesApplied: {
          type: 'array',
          items: { type: 'string' }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'orientation', 'meek-rules']
}));

export const confidenceAssessmentTask = defineTask('confidence-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Edge Confidence Assessment',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in causal discovery validation and uncertainty quantification',
      task: 'Assess confidence in discovered causal edges',
      context: {
        orientedGraph: args.orientedGraph,
        constraintBasedResults: args.constraintBasedResults,
        scoreBasedResults: args.scoreBasedResults,
        fcmResults: args.fcmResults,
        dataset: args.dataset
      },
      instructions: [
        '1. Calculate edge stability via bootstrap resampling',
        '2. Compute edge confidence from method agreement',
        '3. Apply Bayesian model averaging across structures',
        '4. Assess edge reliability via cross-validation',
        '5. Calculate posterior edge probabilities',
        '6. Identify most and least confident edges',
        '7. Assess sensitivity to hyperparameters',
        '8. Compute confidence intervals for orientations',
        '9. Generate confidence heatmap/matrix',
        '10. Summarize overall structural confidence'
      ],
      outputFormat: 'JSON object with confidence assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['edgeConfidence', 'averageConfidence'],
      properties: {
        edgeConfidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              edge: { type: 'object' },
              bootstrapFrequency: { type: 'number' },
              methodAgreement: { type: 'number' },
              posteriorProbability: { type: 'number' },
              overallConfidence: { type: 'number' }
            }
          }
        },
        averageConfidence: { type: 'number' },
        confidenceDistribution: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        mostConfidentEdges: {
          type: 'array',
          items: { type: 'object' }
        },
        leastConfidentEdges: {
          type: 'array',
          items: { type: 'object' }
        },
        methodology: {
          type: 'object',
          properties: {
            bootstrapIterations: { type: 'number' },
            aggregationMethod: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-discovery', 'confidence', 'validation']
}));

export const latentVariableDetectionTask = defineTask('latent-variable-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Latent Variable Detection',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in latent variable models and hidden confounding',
      task: 'Detect potential latent confounders in the causal structure',
      context: {
        orientedGraph: args.orientedGraph,
        dataset: args.dataset,
        domain: args.domain
      },
      instructions: [
        '1. Look for bidirected edges indicating latent confounders',
        '2. Apply tetrad constraints to detect latents',
        '3. Use factor analysis techniques to identify latent structure',
        '4. Check for unexplained correlations suggesting hidden causes',
        '5. Apply FCI-based tests for latent confounding',
        '6. Consider measurement model implications',
        '7. Assess domain plausibility of latent variables',
        '8. Estimate number of latent factors',
        '9. Characterize latent variable relationships',
        '10. Recommend latent variable modeling approach'
      ],
      outputFormat: 'JSON object with latent variable analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedLatents', 'evidence'],
      properties: {
        detectedLatents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              affectedVariables: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        bidirectedEdges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variables: { type: 'array', items: { type: 'string' } },
              interpretation: { type: 'string' }
            }
          }
        },
        tetradTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variables: { type: 'array', items: { type: 'string' } },
              vanishes: { type: 'boolean' },
              implication: { type: 'string' }
            }
          }
        },
        evidence: { type: 'string' },
        recommendations: {
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
  labels: ['causal-discovery', 'latent-variables', 'hidden-confounders']
}));

export const structureValidationTask = defineTask('structure-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Structure Validation',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in causal structure validation and scientific reasoning',
      task: 'Validate the discovered causal structure',
      context: {
        orientedGraph: args.orientedGraph,
        confidenceAssessment: args.confidenceAssessment,
        latentVariableAnalysis: args.latentVariableAnalysis,
        domain: args.domain,
        priorKnowledge: args.priorKnowledge
      },
      instructions: [
        '1. Check consistency with domain knowledge',
        '2. Validate against known causal relationships',
        '3. Check for implausible causal directions',
        '4. Verify structural identifiability',
        '5. Assess DAG vs cyclic structure evidence',
        '6. Evaluate sparsity of learned structure',
        '7. Check conditional independence implications',
        '8. Validate d-separation relationships in data',
        '9. Assess predictive validity if possible',
        '10. Provide overall validity assessment'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validityScore', 'issues', 'recommendations'],
      properties: {
        validityScore: { type: 'number' },
        domainConsistency: {
          type: 'object',
          properties: {
            consistent: { type: 'boolean' },
            violations: { type: 'array', items: { type: 'string' } }
          }
        },
        structuralProperties: {
          type: 'object',
          properties: {
            isDAG: { type: 'boolean' },
            sparsity: { type: 'number' },
            maxDegree: { type: 'number' }
          }
        },
        dSeparationTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              expected: { type: 'boolean' },
              observed: { type: 'boolean' },
              consistent: { type: 'boolean' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              suggestion: { type: 'string' }
            }
          }
        },
        recommendations: {
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
  labels: ['causal-discovery', 'validation', 'quality-assessment']
}));
