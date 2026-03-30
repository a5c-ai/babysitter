/**
 * @process scientific-discovery/retrosynthesis
 * @description Retrosynthesis process (Chemistry) - Work backwards from target molecule to available precursors to design synthetic routes
 * @inputs { targetMolecule: object, availableStartingMaterials: array, constraints: object, outputDir: string }
 * @outputs { success: boolean, syntheticRoutes: array, optimalRoute: object, disconnections: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetMolecule = {},
    availableStartingMaterials = [],
    constraints = {},
    outputDir = 'retrosynthesis-output',
    maxSteps = 10,
    considerStereochemistry = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Retrosynthesis Process');

  // ============================================================================
  // PHASE 1: TARGET ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing target molecule');
  const targetAnalysis = await ctx.task(targetAnalysisTask, {
    targetMolecule,
    considerStereochemistry,
    outputDir
  });

  artifacts.push(...targetAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: STRATEGIC BOND IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying strategic bonds for disconnection');
  const strategicBondIdentification = await ctx.task(strategicBondTask, {
    targetMolecule,
    functionalGroups: targetAnalysis.functionalGroups,
    carbonSkeleton: targetAnalysis.carbonSkeleton,
    outputDir
  });

  artifacts.push(...strategicBondIdentification.artifacts);

  // ============================================================================
  // PHASE 3: DISCONNECTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing retrosynthetic disconnections');
  const disconnectionAnalysis = await ctx.task(disconnectionTask, {
    targetMolecule,
    strategicBonds: strategicBondIdentification.strategicBonds,
    outputDir
  });

  artifacts.push(...disconnectionAnalysis.artifacts);

  // Breakpoint: Review disconnection strategy
  await ctx.breakpoint({
    question: `Identified ${disconnectionAnalysis.disconnections.length} possible disconnections. Generating ${strategicBondIdentification.strategicBonds.length} synthetic tree branches. Continue with synthon analysis?`,
    title: 'Disconnection Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        targetName: targetMolecule.name || 'target',
        disconnectionCount: disconnectionAnalysis.disconnections.length,
        strategicBondCount: strategicBondIdentification.strategicBonds.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: SYNTHON TO REAGENT CONVERSION
  // ============================================================================

  ctx.log('info', 'Phase 4: Converting synthons to real reagents');
  const synthonConversion = await ctx.task(synthonConversionTask, {
    disconnections: disconnectionAnalysis.disconnections,
    availableStartingMaterials,
    outputDir
  });

  artifacts.push(...synthonConversion.artifacts);

  // ============================================================================
  // PHASE 5: SYNTHETIC TREE CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing synthetic tree');
  const syntheticTree = await ctx.task(syntheticTreeTask, {
    targetMolecule,
    disconnections: disconnectionAnalysis.disconnections,
    reagents: synthonConversion.reagents,
    availableStartingMaterials,
    maxSteps,
    outputDir
  });

  artifacts.push(...syntheticTree.artifacts);

  // ============================================================================
  // PHASE 6: ROUTE ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Enumerating possible synthetic routes');
  const routeEnumeration = await ctx.task(routeEnumerationTask, {
    syntheticTree: syntheticTree.tree,
    availableStartingMaterials,
    constraints,
    outputDir
  });

  artifacts.push(...routeEnumeration.artifacts);

  // ============================================================================
  // PHASE 7: ROUTE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating and ranking synthetic routes');
  const routeEvaluation = await ctx.task(routeEvaluationTask, {
    routes: routeEnumeration.routes,
    constraints,
    considerStereochemistry,
    outputDir
  });

  artifacts.push(...routeEvaluation.artifacts);

  // ============================================================================
  // PHASE 8: OPTIMAL ROUTE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Selecting optimal synthetic route');
  const optimalRouteSelection = await ctx.task(optimalRouteTask, {
    evaluatedRoutes: routeEvaluation.evaluatedRoutes,
    constraints,
    outputDir
  });

  artifacts.push(...optimalRouteSelection.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Retrosynthesis complete. ${routeEnumeration.routes.length} routes found. Optimal route: ${optimalRouteSelection.optimalRoute.steps.length} steps with ${optimalRouteSelection.optimalRoute.overallYield}% estimated yield. Review synthesis plan?`,
    title: 'Retrosynthesis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalRoutes: routeEnumeration.routes.length,
        optimalSteps: optimalRouteSelection.optimalRoute.steps.length,
        estimatedYield: optimalRouteSelection.optimalRoute.overallYield
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    targetMolecule,
    targetAnalysis: {
      functionalGroups: targetAnalysis.functionalGroups,
      carbonSkeleton: targetAnalysis.carbonSkeleton,
      complexity: targetAnalysis.complexity
    },
    disconnections: disconnectionAnalysis.disconnections,
    syntheticRoutes: routeEvaluation.evaluatedRoutes,
    optimalRoute: optimalRouteSelection.optimalRoute,
    alternativeRoutes: optimalRouteSelection.alternatives,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/retrosynthesis',
      timestamp: startTime,
      outputDir,
      maxSteps
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Target Analysis
export const targetAnalysisTask = defineTask('target-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze target molecule',
  agent: {
    name: 'target-analyst',
    prompt: {
      role: 'synthetic chemist analyzing target molecules',
      task: 'Analyze the target molecule for retrosynthetic planning',
      context: args,
      instructions: [
        'Identify all functional groups in the target',
        'Map the carbon skeleton',
        'Identify stereogenic centers and their configuration',
        'Assess molecular complexity',
        'Identify rings and their sizes',
        'Note any protecting groups already present',
        'Identify potentially unstable features',
        'Note any symmetric elements',
        'Calculate molecular weight and other descriptors',
        'Save target analysis to output directory'
      ],
      outputFormat: 'JSON with functionalGroups, carbonSkeleton, stereoCenters, complexity, rings, symmetry, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalGroups', 'carbonSkeleton', 'complexity', 'artifacts'],
      properties: {
        functionalGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              position: { type: 'string' },
              reactivity: { type: 'string' }
            }
          }
        },
        carbonSkeleton: {
          type: 'object',
          properties: {
            totalCarbons: { type: 'number' },
            longestChain: { type: 'number' },
            branches: { type: 'array', items: { type: 'string' } }
          }
        },
        stereoCenters: { type: 'array' },
        complexity: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        rings: { type: 'array' },
        symmetry: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'target-analysis']
}));

// Task 2: Strategic Bond Identification
export const strategicBondTask = defineTask('strategic-bond', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify strategic bonds for disconnection',
  agent: {
    name: 'strategic-bond-analyst',
    prompt: {
      role: 'retrosynthetic chemist identifying strategic bonds',
      task: 'Identify bonds that are strategic targets for disconnection',
      context: args,
      instructions: [
        'Identify bonds adjacent to functional groups (transform-based)',
        'Identify bonds that simplify the carbon skeleton',
        'Consider C-C bonds for framework disconnection',
        'Consider C-X bonds for functional group interchange',
        'Identify bonds from ring-forming reactions',
        'Note bonds that provide convergent synthesis',
        'Rank bonds by strategic value',
        'Consider stereochemical implications of each disconnection',
        'Avoid disconnections that create unstable synthons',
        'Save strategic bonds to output directory'
      ],
      outputFormat: 'JSON with strategicBonds (array with bond, type, strategicValue, simplification, transform), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategicBonds', 'artifacts'],
      properties: {
        strategicBonds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              bond: { type: 'string' },
              bondType: { type: 'string' },
              strategicValue: { type: 'number' },
              simplification: { type: 'string' },
              associatedTransform: { type: 'string' },
              stereochemicalImpact: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'strategic-bonds']
}));

// Task 3: Disconnection Analysis
export const disconnectionTask = defineTask('disconnection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform retrosynthetic disconnections',
  agent: {
    name: 'disconnection-specialist',
    prompt: {
      role: 'retrosynthetic chemist performing disconnections',
      task: 'Perform retrosynthetic disconnections at strategic bonds',
      context: args,
      instructions: [
        'For each strategic bond, perform retrosynthetic disconnection',
        'Generate synthons from disconnection',
        'Identify polarity of synthons (d+ donor, a+ acceptor)',
        'Apply transform (reverse of synthetic reaction)',
        'Name the transform (e.g., aldol disconnection)',
        'Note any functional group interconversions needed',
        'Consider umpolung if normal polarity fails',
        'Document the disconnection logic',
        'Generate precursor structures',
        'Save disconnections to output directory'
      ],
      outputFormat: 'JSON with disconnections (array with bond, transform, synthons, precursors, polarity), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['disconnections', 'artifacts'],
      properties: {
        disconnections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              bondId: { type: 'string' },
              transform: { type: 'string' },
              synthons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    structure: { type: 'string' },
                    polarity: { type: 'string' }
                  }
                }
              },
              precursors: { type: 'array', items: { type: 'string' } },
              fgiNeeded: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        umpolungRequired: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'disconnection']
}));

// Task 4: Synthon Conversion
export const synthonConversionTask = defineTask('synthon-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Convert synthons to real reagents',
  agent: {
    name: 'synthon-converter',
    prompt: {
      role: 'synthetic chemist converting synthons to reagents',
      task: 'Convert idealized synthons to real chemical reagents',
      context: args,
      instructions: [
        'For each synthon, identify equivalent real reagent',
        'd+ synthons: carbocations -> alkyl halides, epoxides, etc.',
        'a- synthons: carbanions -> Grignard reagents, enolates, etc.',
        'Match polarity and reactivity',
        'Consider availability of reagents',
        'Note if reagent needs to be prepared',
        'Check compatibility with other groups in molecule',
        'Consider protecting groups if needed',
        'List alternative reagent choices',
        'Save synthon conversions to output directory'
      ],
      outputFormat: 'JSON with reagents (array with synthon, reagent, equivalentReaction, availability, alternatives), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reagents', 'artifacts'],
      properties: {
        reagents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              synthonId: { type: 'string' },
              synthon: { type: 'string' },
              reagent: { type: 'string' },
              equivalentReaction: { type: 'string' },
              availability: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              needsPreparation: { type: 'boolean' }
            }
          }
        },
        protectingGroupsNeeded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'synthon-conversion']
}));

// Task 5: Synthetic Tree Construction
export const syntheticTreeTask = defineTask('synthetic-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct synthetic tree',
  agent: {
    name: 'tree-constructor',
    prompt: {
      role: 'retrosynthetic planner constructing synthesis trees',
      task: 'Construct the complete retrosynthetic tree',
      context: args,
      instructions: [
        'Build tree with target at root',
        'Each disconnection creates branches',
        'Continue disconnections until reaching starting materials',
        'Or continue until reaching available reagents',
        'Limit depth to maxSteps',
        'Identify convergent vs linear paths',
        'Note branching points',
        'Identify common intermediates',
        'Document tree structure',
        'Save synthetic tree to output directory'
      ],
      outputFormat: 'JSON with tree (nodes, edges, levels), convergentPoints, commonIntermediates, depth, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tree', 'artifacts'],
      properties: {
        tree: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  molecule: { type: 'string' },
                  level: { type: 'number' },
                  isStartingMaterial: { type: 'boolean' }
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
                  transform: { type: 'string' }
                }
              }
            }
          }
        },
        convergentPoints: { type: 'array', items: { type: 'string' } },
        commonIntermediates: { type: 'array', items: { type: 'string' } },
        depth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'synthetic-tree']
}));

// Task 6: Route Enumeration
export const routeEnumerationTask = defineTask('route-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enumerate possible synthetic routes',
  agent: {
    name: 'route-enumerator',
    prompt: {
      role: 'computational chemist enumerating synthetic routes',
      task: 'Enumerate all possible synthetic routes from the tree',
      context: args,
      instructions: [
        'Traverse tree to identify all paths to starting materials',
        'Each path is a potential synthetic route',
        'Convert retrosynthetic paths to forward synthesis',
        'List all starting materials for each route',
        'Count steps in each route',
        'Identify linear vs convergent routes',
        'Filter routes by constraints (cost, availability)',
        'Document unique transformations used',
        'Note routes that share intermediates',
        'Save route enumeration to output directory'
      ],
      outputFormat: 'JSON with routes (array with steps, startingMaterials, type), filteredOut, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'artifacts'],
      properties: {
        routes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    reactants: { type: 'array', items: { type: 'string' } },
                    product: { type: 'string' },
                    reaction: { type: 'string' }
                  }
                }
              },
              startingMaterials: { type: 'array', items: { type: 'string' } },
              stepCount: { type: 'number' },
              type: { type: 'string' }
            }
          }
        },
        filteredOut: { type: 'array' },
        sharedIntermediates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'route-enumeration']
}));

// Task 7: Route Evaluation
export const routeEvaluationTask = defineTask('route-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and rank synthetic routes',
  agent: {
    name: 'route-evaluator',
    prompt: {
      role: 'process chemist evaluating synthetic routes',
      task: 'Evaluate synthetic routes on multiple criteria',
      context: args,
      instructions: [
        'Estimate yield for each step',
        'Calculate overall yield for each route',
        'Assess step economy (fewer steps better)',
        'Assess atom economy',
        'Consider starting material cost',
        'Evaluate stereochemical control',
        'Assess scalability',
        'Consider safety/hazard factors',
        'Rate environmental impact (green chemistry)',
        'Calculate overall score for each route',
        'Save evaluations to output directory'
      ],
      outputFormat: 'JSON with evaluatedRoutes (array with route plus scores), criteria, rankingMethod, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluatedRoutes', 'artifacts'],
      properties: {
        evaluatedRoutes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              routeId: { type: 'string' },
              steps: { type: 'array' },
              stepCount: { type: 'number' },
              overallYield: { type: 'number' },
              stepYields: { type: 'array', items: { type: 'number' } },
              atomEconomy: { type: 'number' },
              estimatedCost: { type: 'string' },
              stereoControl: { type: 'string' },
              scalability: { type: 'string' },
              safetyRating: { type: 'string' },
              greenScore: { type: 'number' },
              overallScore: { type: 'number' }
            }
          }
        },
        criteria: { type: 'array', items: { type: 'string' } },
        rankingMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'route-evaluation']
}));

// Task 8: Optimal Route Selection
export const optimalRouteTask = defineTask('optimal-route', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal synthetic route',
  agent: {
    name: 'route-selector',
    prompt: {
      role: 'senior synthetic chemist selecting optimal route',
      task: 'Select the optimal synthetic route and document alternatives',
      context: args,
      instructions: [
        'Select highest scoring route as optimal',
        'Document detailed synthesis plan for optimal route',
        'List all reagents and conditions',
        'Note expected yields at each step',
        'Identify critical steps requiring optimization',
        'Document workup procedures',
        'Note purification methods',
        'Identify potential scale-up issues',
        'List alternative routes for backup',
        'Save optimal route to output directory'
      ],
      outputFormat: 'JSON with optimalRoute (detailed plan), alternatives, criticalSteps, scaleupConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalRoute', 'alternatives', 'artifacts'],
      properties: {
        optimalRoute: {
          type: 'object',
          properties: {
            routeId: { type: 'string' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stepNumber: { type: 'number' },
                  reaction: { type: 'string' },
                  reactants: { type: 'array', items: { type: 'string' } },
                  reagents: { type: 'array', items: { type: 'string' } },
                  conditions: { type: 'object' },
                  product: { type: 'string' },
                  expectedYield: { type: 'number' },
                  workup: { type: 'string' },
                  purification: { type: 'string' }
                }
              }
            },
            overallYield: { type: 'number' },
            totalSteps: { type: 'number' },
            overallScore: { type: 'number' }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              routeId: { type: 'string' },
              score: { type: 'number' },
              differentiator: { type: 'string' }
            }
          }
        },
        criticalSteps: { type: 'array', items: { type: 'number' } },
        scaleupConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'retrosynthesis', 'chemistry', 'optimal-route']
}));
