/**
 * @process Search-Based Algorithmic Reasoning
 * @description Systematically explore possibilities with heuristics (BFS, DFS, A*, beam search)
 * @category Scientific Discovery - Practical Reasoning
 * @inputs {{ context: object, problem: string, searchSpace: object, objectives: array }}
 * @outputs {{ analysis: object, searchResults: object, solutionPath: array, recommendations: array }}
 * @example
 * // Input: Problem with large search space requiring systematic exploration
 * // Output: Solution path found through algorithmic search with heuristic guidance
 * @references
 * - Russell, S. & Norvig, P. (2020). Artificial Intelligence: A Modern Approach
 * - Pearl, J. (1984). Heuristics: Intelligent Search Strategies
 * - Korf, R.E. (1990). Real-time heuristic search
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Phase 1: Search Space Analysis
const analyzeSearchSpaceTask = defineTask('search-analyze-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search Space Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Search space analysis and problem formulation specialist',
      task: 'Analyze the search space structure and define the problem formally',
      context: args,
      instructions: [
        'Define the state space representation',
        'Identify the initial state(s)',
        'Define goal state(s) and goal test',
        'Enumerate available actions/operators',
        'Analyze branching factor and depth',
        'Estimate search space size',
        'Identify state space structure (tree vs graph)',
        'Assess reversibility of actions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        stateRepresentation: {
          type: 'object',
          properties: {
            stateVariables: { type: 'array' },
            stateEncoding: { type: 'string' },
            stateSpaceType: { type: 'string' }
          }
        },
        problemDefinition: {
          type: 'object',
          properties: {
            initialState: { type: 'object' },
            goalTest: { type: 'string' },
            goalStates: { type: 'array' }
          }
        },
        operators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              preconditions: { type: 'array' },
              effects: { type: 'array' },
              cost: { type: 'number' }
            }
          }
        },
        spaceCharacteristics: {
          type: 'object',
          properties: {
            branchingFactor: { type: 'number' },
            estimatedDepth: { type: 'number' },
            estimatedSize: { type: 'string' },
            isTree: { type: 'boolean' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['stateRepresentation', 'problemDefinition', 'operators', 'spaceCharacteristics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 2: Heuristic Function Design
const designHeuristicFunctionTask = defineTask('search-design-heuristic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Function Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Heuristic function design and admissibility specialist',
      task: 'Design effective heuristic functions for guiding the search',
      context: args,
      instructions: [
        'Identify domain features relevant to goal distance',
        'Design admissible heuristic functions',
        'Consider relaxed problem heuristics',
        'Design consistent (monotonic) heuristics if needed',
        'Evaluate heuristic informativeness',
        'Consider pattern databases',
        'Design composite/max heuristics',
        'Assess computation cost vs quality trade-off'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        heuristicCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              derivation: { type: 'string' },
              isAdmissible: { type: 'boolean' },
              isConsistent: { type: 'boolean' }
            }
          }
        },
        informativeness: {
          type: 'object',
          properties: {
            dominanceRelations: { type: 'array' },
            expectedNodeExpansions: { type: 'object' },
            informativenessRanking: { type: 'array' }
          }
        },
        selectedHeuristic: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rationale: { type: 'string' },
            expectedPerformance: { type: 'object' }
          }
        },
        computationCost: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['heuristicCandidates', 'informativeness', 'selectedHeuristic']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 3: Search Algorithm Selection
const selectSearchAlgorithmTask = defineTask('search-select-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search Algorithm Selection',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Search algorithm selection and configuration specialist',
      task: 'Select and configure the most appropriate search algorithm',
      context: args,
      instructions: [
        'Evaluate uninformed search options (BFS, DFS, IDS)',
        'Evaluate informed search options (A*, IDA*, RBFS)',
        'Consider local search (hill climbing, simulated annealing)',
        'Evaluate beam search variants',
        'Assess optimality requirements',
        'Consider memory constraints',
        'Evaluate completeness guarantees',
        'Configure algorithm parameters'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        algorithmAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              completeness: { type: 'boolean' },
              optimality: { type: 'boolean' },
              timeComplexity: { type: 'string' },
              spaceComplexity: { type: 'string' },
              suitability: { type: 'number' }
            }
          }
        },
        selectedAlgorithm: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rationale: { type: 'string' },
            parameters: { type: 'object' }
          }
        },
        fallbackStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              fallbackAlgorithm: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['algorithmAnalysis', 'selectedAlgorithm']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 4: Search Execution
const executeSearchTask = defineTask('search-execute', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search Execution',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Search execution and monitoring specialist',
      task: 'Execute the search algorithm and track progress',
      context: args,
      instructions: [
        'Initialize search data structures',
        'Execute search iterations',
        'Track frontier/open list evolution',
        'Monitor explored/closed set',
        'Record path costs and heuristic values',
        'Detect cycles and repeated states',
        'Monitor resource consumption',
        'Detect goal state or termination conditions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        searchProgress: {
          type: 'object',
          properties: {
            nodesExpanded: { type: 'number' },
            nodesGenerated: { type: 'number' },
            maxFrontierSize: { type: 'number' },
            currentDepth: { type: 'number' }
          }
        },
        searchTrace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iteration: { type: 'number' },
              currentNode: { type: 'object' },
              hValue: { type: 'number' },
              gValue: { type: 'number' },
              fValue: { type: 'number' }
            }
          }
        },
        terminationStatus: {
          type: 'object',
          properties: {
            foundGoal: { type: 'boolean' },
            terminationReason: { type: 'string' },
            resourcesUsed: { type: 'object' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['searchProgress', 'searchTrace', 'terminationStatus']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 5: Solution Path Extraction
const extractSolutionPathTask = defineTask('search-extract-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solution Path Extraction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Solution extraction and path reconstruction specialist',
      task: 'Extract and reconstruct the solution path from search results',
      context: args,
      instructions: [
        'Reconstruct path from goal to initial state',
        'Document sequence of actions/operators',
        'Calculate total path cost',
        'Verify solution validity',
        'Document state transitions',
        'Identify critical decision points',
        'Assess solution quality',
        'Compare to optimal if known'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        solutionPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              state: { type: 'object' },
              action: { type: 'string' },
              cost: { type: 'number' }
            }
          }
        },
        pathMetrics: {
          type: 'object',
          properties: {
            pathLength: { type: 'number' },
            totalCost: { type: 'number' },
            isOptimal: { type: 'boolean' },
            optimalityGap: { type: 'number' }
          }
        },
        criticalDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              decision: { type: 'string' },
              alternatives: { type: 'array' },
              rationale: { type: 'string' }
            }
          }
        },
        validationStatus: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['solutionPath', 'pathMetrics', 'criticalDecisions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 6: Search Performance Analysis
const analyzeSearchPerformanceTask = defineTask('search-analyze-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search Performance Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Search performance analysis and optimization specialist',
      task: 'Analyze the search performance and identify improvement opportunities',
      context: args,
      instructions: [
        'Calculate effective branching factor',
        'Assess heuristic effectiveness',
        'Analyze pruning efficiency',
        'Evaluate memory utilization',
        'Compare actual vs theoretical complexity',
        'Identify performance bottlenecks',
        'Assess algorithm-problem fit',
        'Recommend optimizations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        performanceMetrics: {
          type: 'object',
          properties: {
            effectiveBranchingFactor: { type: 'number' },
            searchEfficiency: { type: 'number' },
            heuristicAccuracy: { type: 'number' },
            pruningRatio: { type: 'number' }
          }
        },
        resourceAnalysis: {
          type: 'object',
          properties: {
            timeUsed: { type: 'string' },
            memoryPeak: { type: 'string' },
            scalabilityAssessment: { type: 'string' }
          }
        },
        bottleneckAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bottleneck: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        optimizationOpportunities: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['performanceMetrics', 'resourceAnalysis', 'bottleneckAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 7: Alternative Solution Exploration
const exploreAlternativeSolutionsTask = defineTask('search-explore-alternatives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Alternative Solution Exploration',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Alternative solution discovery and diversity specialist',
      task: 'Explore alternative solutions and assess solution diversity',
      context: args,
      instructions: [
        'Identify alternative goal states if applicable',
        'Search for alternative paths to same goal',
        'Assess solution diversity and coverage',
        'Evaluate trade-offs among alternatives',
        'Identify Pareto-optimal solutions if multi-objective',
        'Assess robustness of different solutions',
        'Rank alternatives by relevant criteria',
        'Document alternative solution landscape'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        alternativeSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solutionId: { type: 'string' },
              path: { type: 'array' },
              cost: { type: 'number' },
              characteristics: { type: 'object' }
            }
          }
        },
        diversityAnalysis: {
          type: 'object',
          properties: {
            diversityScore: { type: 'number' },
            clusteringStructure: { type: 'object' },
            coverageAssessment: { type: 'string' }
          }
        },
        tradeoffAnalysis: {
          type: 'object',
          properties: {
            paretoFrontier: { type: 'array' },
            dominanceRelations: { type: 'array' },
            recommendedAlternative: { type: 'string' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['alternativeSolutions', 'diversityAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 8: Robustness and Sensitivity Analysis
const analyzeRobustnessTask = defineTask('search-robustness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solution Robustness Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Solution robustness and sensitivity analysis specialist',
      task: 'Analyze the robustness of the solution to perturbations',
      context: args,
      instructions: [
        'Test solution validity under parameter variations',
        'Assess sensitivity to heuristic changes',
        'Evaluate solution stability',
        'Test against adversarial perturbations',
        'Assess adaptation requirements for changes',
        'Evaluate replanning capabilities',
        'Document sensitivity thresholds',
        'Recommend robustification strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        robustnessTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              perturbationType: { type: 'string' },
              perturbationMagnitude: { type: 'number' },
              solutionValidity: { type: 'boolean' },
              adaptationRequired: { type: 'string' }
            }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            sensitiveParameters: { type: 'array' },
            stabilityRegion: { type: 'object' },
            breakingPoints: { type: 'array' }
          }
        },
        robustificationRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              benefit: { type: 'string' },
              cost: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['robustnessTests', 'sensitivityAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 9: Synthesis and Recommendations
const synthesizeResultsTask = defineTask('search-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search-Based Reasoning Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'search-algorithm-analyst',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Search-based reasoning synthesis specialist',
      task: 'Synthesize all search results into comprehensive conclusions and recommendations',
      context: args,
      instructions: [
        'Summarize the search process and solution',
        'Highlight key algorithmic decisions and their impact',
        'Document heuristic effectiveness',
        'Assess overall solution quality',
        'Provide actionable recommendations',
        'Identify areas for future improvement',
        'Document lessons learned',
        'Recommend search strategy refinements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        searchSummary: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            heuristic: { type: 'string' },
            nodesExplored: { type: 'number' },
            solutionQuality: { type: 'string' }
          }
        },
        solutionAssessment: {
          type: 'object',
          properties: {
            primarySolution: { type: 'object' },
            alternativesIdentified: { type: 'number' },
            robustnessRating: { type: 'string' },
            overallConfidence: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        lessonsLearned: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['searchSummary', 'solutionAssessment', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

/**
 * Main search-based algorithmic reasoning process
 */
export async function process(inputs, ctx) {
  // Phase 1: Analyze search space
  const spaceAnalysis = await ctx.task(analyzeSearchSpaceTask, {
    problem: inputs.problem,
    context: inputs.context,
    searchSpace: inputs.searchSpace
  });

  // Phase 2: Design heuristic function
  const heuristicDesign = await ctx.task(designHeuristicFunctionTask, {
    spaceAnalysis,
    objectives: inputs.objectives
  });

  // Phase 3: Select search algorithm
  const algorithmSelection = await ctx.task(selectSearchAlgorithmTask, {
    spaceAnalysis,
    heuristicDesign,
    objectives: inputs.objectives
  });

  // Quality gate: Search configuration review
  await ctx.breakpoint('search-config-review', {
    question: 'Is the search configuration (algorithm, heuristic, parameters) appropriate?',
    context: { spaceAnalysis, heuristicDesign, algorithmSelection }
  });

  // Phase 4: Execute search
  const searchExecution = await ctx.task(executeSearchTask, {
    spaceAnalysis,
    heuristicDesign,
    algorithmSelection
  });

  // Phase 5: Extract solution path
  let solutionPath = null;
  if (searchExecution.terminationStatus.foundGoal) {
    solutionPath = await ctx.task(extractSolutionPathTask, {
      searchExecution,
      spaceAnalysis
    });
  }

  // Phase 6: Analyze performance
  const performanceAnalysis = await ctx.task(analyzeSearchPerformanceTask, {
    searchExecution,
    heuristicDesign,
    algorithmSelection
  });

  // Phase 7: Explore alternatives
  const alternativeExploration = await ctx.task(exploreAlternativeSolutionsTask, {
    searchExecution,
    solutionPath,
    spaceAnalysis
  });

  // Quality gate: Solution review
  await ctx.breakpoint('solution-review', {
    question: 'Is the solution path acceptable? Should we explore more alternatives?',
    context: { solutionPath, alternativeExploration, performanceAnalysis }
  });

  // Phase 8: Analyze robustness
  const robustnessAnalysis = await ctx.task(analyzeRobustnessTask, {
    solutionPath,
    alternativeExploration,
    spaceAnalysis
  });

  // Phase 9: Synthesize results
  const synthesis = await ctx.task(synthesizeResultsTask, {
    spaceAnalysis,
    algorithmSelection,
    heuristicDesign,
    searchExecution,
    solutionPath,
    performanceAnalysis,
    alternativeExploration,
    robustnessAnalysis
  });

  return {
    success: true,
    reasoningType: 'Search-Based Algorithmic Reasoning',
    analysis: {
      spaceAnalysis,
      heuristicDesign,
      algorithmSelection,
      performanceAnalysis,
      robustnessAnalysis
    },
    searchResults: {
      terminationStatus: searchExecution.terminationStatus,
      searchProgress: searchExecution.searchProgress,
      alternativeExploration
    },
    solutionPath: solutionPath?.solutionPath || [],
    conclusions: [
      `Algorithm used: ${algorithmSelection.selectedAlgorithm.name}`,
      `Heuristic: ${heuristicDesign.selectedHeuristic.name}`,
      `Nodes explored: ${searchExecution.searchProgress.nodesExpanded}`,
      `Solution found: ${searchExecution.terminationStatus.foundGoal}`,
      `Solution quality: ${synthesis.solutionAssessment.solutionQuality || 'N/A'}`
    ],
    recommendations: synthesis.recommendations,
    confidence: synthesis.confidence
  };
}
