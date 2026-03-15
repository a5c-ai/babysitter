/**
 * @process scientific-discovery/network-pathway-reasoning
 * @description Represent biological interactions as graphs and analyze network topology, pathway dynamics, and emergent network properties
 * @inputs { networkData: object, analysisType: string, pathwayQuery: object, outputDir: string }
 * @outputs { success: boolean, networkAnalysis: object, topologyMetrics: object, pathways: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    networkData = {},
    analysisType = 'comprehensive', // topology, pathway, dynamics, comprehensive
    pathwayQuery = {},
    outputDir = 'network-pathway-output',
    targetCoverage = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Network Pathway Reasoning Process (${analysisType})`);

  // ============================================================================
  // PHASE 1: NETWORK CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Constructing and validating network');
  const networkConstruction = await ctx.task(networkConstructionTask, {
    networkData,
    outputDir
  });

  artifacts.push(...networkConstruction.artifacts);

  // ============================================================================
  // PHASE 2: TOPOLOGY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing network topology');
  const topologyAnalysis = await ctx.task(topologyAnalysisTask, {
    network: networkConstruction.network,
    outputDir
  });

  artifacts.push(...topologyAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: MODULE/COMMUNITY DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Detecting network modules and communities');
  const moduleDetection = await ctx.task(moduleDetectionTask, {
    network: networkConstruction.network,
    topologyMetrics: topologyAnalysis.metrics,
    outputDir
  });

  artifacts.push(...moduleDetection.artifacts);

  // ============================================================================
  // PHASE 4: PATHWAY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing biological pathways');
  const pathwayAnalysis = await ctx.task(pathwayAnalysisTask, {
    network: networkConstruction.network,
    modules: moduleDetection.modules,
    pathwayQuery,
    outputDir
  });

  artifacts.push(...pathwayAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: HUB AND BOTTLENECK IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying hubs and bottlenecks');
  const hubAnalysis = await ctx.task(hubBottleneckAnalysisTask, {
    network: networkConstruction.network,
    topologyMetrics: topologyAnalysis.metrics,
    modules: moduleDetection.modules,
    outputDir
  });

  artifacts.push(...hubAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: NETWORK DYNAMICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing network dynamics');
  const dynamicsAnalysis = await ctx.task(networkDynamicsTask, {
    network: networkConstruction.network,
    hubs: hubAnalysis.hubs,
    pathways: pathwayAnalysis.pathways,
    outputDir
  });

  artifacts.push(...dynamicsAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: ROBUSTNESS AND VULNERABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing network robustness and vulnerabilities');
  const robustnessAnalysis = await ctx.task(robustnessVulnerabilityTask, {
    network: networkConstruction.network,
    hubs: hubAnalysis.hubs,
    bottlenecks: hubAnalysis.bottlenecks,
    outputDir
  });

  artifacts.push(...robustnessAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND BIOLOGICAL INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing network insights');
  const synthesis = await ctx.task(networkSynthesisTask, {
    networkConstruction,
    topologyAnalysis,
    moduleDetection,
    pathwayAnalysis,
    hubAnalysis,
    dynamicsAnalysis,
    robustnessAnalysis,
    targetCoverage,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const coverageMet = synthesis.coverageScore >= targetCoverage;

  // Breakpoint: Review network analysis
  await ctx.breakpoint({
    question: `Network analysis complete. Coverage: ${synthesis.coverageScore}/${targetCoverage}. ${coverageMet ? 'Coverage target met!' : 'Additional analysis may be needed.'} Review results?`,
    title: 'Network Pathway Reasoning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        nodes: networkConstruction.network.nodeCount,
        edges: networkConstruction.network.edgeCount,
        modules: moduleDetection.modules.length,
        hubs: hubAnalysis.hubs.length,
        pathwaysIdentified: pathwayAnalysis.pathways.length,
        coverageScore: synthesis.coverageScore,
        coverageMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    networkAnalysis: {
      network: networkConstruction.network,
      topology: topologyAnalysis.metrics,
      modules: moduleDetection.modules,
      hubs: hubAnalysis.hubs,
      bottlenecks: hubAnalysis.bottlenecks
    },
    topologyMetrics: topologyAnalysis.metrics,
    pathways: pathwayAnalysis.pathways,
    dynamics: dynamicsAnalysis.dynamics,
    robustness: robustnessAnalysis.assessment,
    biologicalInsights: synthesis.biologicalInsights,
    coverageScore: synthesis.coverageScore,
    coverageMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/network-pathway-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Network Construction
export const networkConstructionTask = defineTask('network-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct and validate network',
  agent: {
    name: 'network-builder',
    prompt: {
      role: 'computational biologist specializing in network analysis',
      task: 'Construct a validated network representation from biological data',
      context: args,
      instructions: [
        'Parse and validate network data (nodes and edges)',
        'Classify network type (protein-protein, gene regulatory, metabolic, signaling)',
        'Assign edge attributes (direction, weight, interaction type)',
        'Identify node attributes (gene/protein names, functions, compartments)',
        'Handle missing data and ambiguous connections',
        'Check network connectivity and components',
        'Report network statistics (node count, edge count, density)',
        'Validate against known interactions if possible',
        'Create network representation suitable for analysis',
        'Save network to output directory'
      ],
      outputFormat: 'JSON with network (nodeCount, edgeCount, type, attributes), validationReport, statistics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['network', 'validationReport', 'artifacts'],
      properties: {
        network: {
          type: 'object',
          properties: {
            nodeCount: { type: 'number' },
            edgeCount: { type: 'number' },
            type: { type: 'string' },
            directed: { type: 'boolean' },
            weighted: { type: 'boolean' },
            components: { type: 'number' }
          }
        },
        validationReport: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
            dataQuality: { type: 'number' }
          }
        },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'construction']
}));

// Task 2: Topology Analysis
export const topologyAnalysisTask = defineTask('topology-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze network topology',
  agent: {
    name: 'topology-analyst',
    prompt: {
      role: 'network scientist and graph theorist',
      task: 'Compute and interpret network topology metrics',
      context: args,
      instructions: [
        'Compute global network metrics:',
        '  - Average degree, degree distribution',
        '  - Clustering coefficient',
        '  - Average path length, diameter',
        '  - Network density',
        '  - Assortativity',
        'Compute node-level metrics:',
        '  - Degree centrality',
        '  - Betweenness centrality',
        '  - Closeness centrality',
        '  - Eigenvector centrality',
        '  - PageRank',
        'Assess network type (scale-free, small-world, random)',
        'Compare to randomized networks',
        'Interpret biological significance of topology',
        'Save topology analysis to output directory'
      ],
      outputFormat: 'JSON with metrics (global, nodeLevelDistributions), networkType, randomComparison, biologicalInterpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'networkType', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            global: {
              type: 'object',
              properties: {
                averageDegree: { type: 'number' },
                clusteringCoefficient: { type: 'number' },
                averagePathLength: { type: 'number' },
                diameter: { type: 'number' },
                density: { type: 'number' },
                assortativity: { type: 'number' }
              }
            },
            distributions: { type: 'object' }
          }
        },
        networkType: { type: 'string', enum: ['scale-free', 'small-world', 'random', 'hierarchical', 'modular'] },
        randomComparison: { type: 'object' },
        biologicalInterpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'topology']
}));

// Task 3: Module Detection
export const moduleDetectionTask = defineTask('module-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect network modules and communities',
  agent: {
    name: 'module-detector',
    prompt: {
      role: 'systems biologist specializing in network modularity',
      task: 'Identify functional modules and communities in the network',
      context: args,
      instructions: [
        'Apply community detection algorithms:',
        '  - Modularity optimization',
        '  - Label propagation',
        '  - Hierarchical clustering',
        'Compute modularity score',
        'Identify overlapping modules if present',
        'Characterize each module:',
        '  - Size and density',
        '  - Internal vs external connectivity',
        '  - Key nodes within module',
        'Assign functional annotations to modules',
        'Identify inter-module connections',
        'Assess hierarchical module structure',
        'Save module analysis to output directory'
      ],
      outputFormat: 'JSON with modules (array with id, nodes, density, function), modularity, interModuleConnections, hierarchy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'modularity', 'artifacts'],
      properties: {
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nodes: { type: 'array', items: { type: 'string' } },
              size: { type: 'number' },
              density: { type: 'number' },
              function: { type: 'string' },
              keyNodes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        modularity: { type: 'number' },
        interModuleConnections: { type: 'array', items: { type: 'object' } },
        hierarchy: { type: 'object' },
        overlapAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'modules']
}));

// Task 4: Pathway Analysis
export const pathwayAnalysisTask = defineTask('pathway-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze biological pathways',
  agent: {
    name: 'pathway-analyst',
    prompt: {
      role: 'pathway biologist and systems analyst',
      task: 'Identify and characterize biological pathways in the network',
      context: args,
      instructions: [
        'If pathway query specified, find paths between specified nodes',
        'Identify known biological pathways in the network:',
        '  - Signaling cascades',
        '  - Metabolic pathways',
        '  - Regulatory circuits',
        'For each pathway characterize:',
        '  - Start and end points',
        '  - Intermediate steps',
        '  - Branch points and convergences',
        '  - Feedback loops',
        '  - Pathway length and efficiency',
        'Identify cross-talk between pathways',
        'Find shortest paths and alternative routes',
        'Compute pathway enrichment analysis',
        'Save pathway analysis to output directory'
      ],
      outputFormat: 'JSON with pathways (array with name, steps, type, feedback), crosstalk, enrichment, shortestPaths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pathways', 'crosstalk', 'artifacts'],
      properties: {
        pathways: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              start: { type: 'string' },
              end: { type: 'string' },
              feedbackLoops: { type: 'array', items: { type: 'object' } },
              branchPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        crosstalk: { type: 'array', items: { type: 'object' } },
        enrichment: { type: 'object' },
        shortestPaths: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'pathways']
}));

// Task 5: Hub and Bottleneck Analysis
export const hubBottleneckAnalysisTask = defineTask('hub-bottleneck-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify hubs and bottlenecks',
  agent: {
    name: 'centrality-analyst',
    prompt: {
      role: 'network biologist specializing in node importance',
      task: 'Identify hub nodes and bottleneck nodes in the network',
      context: args,
      instructions: [
        'Identify hub nodes (high degree):',
        '  - Party hubs (intra-module connectors)',
        '  - Date hubs (inter-module connectors)',
        'Identify bottleneck nodes (high betweenness):',
        '  - Information flow chokepoints',
        '  - Module connectors',
        'Identify hub-bottlenecks (both high degree and betweenness)',
        'Assess biological importance of each:',
        '  - Essential genes?',
        '  - Drug targets?',
        '  - Disease associations?',
        'Rank nodes by combined importance metrics',
        'Identify peripheral nodes',
        'Save hub/bottleneck analysis to output directory'
      ],
      outputFormat: 'JSON with hubs (array with node, type, metrics), bottlenecks (array), hubBottlenecks, biologicalImportance, peripheralNodes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hubs', 'bottlenecks', 'artifacts'],
      properties: {
        hubs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              type: { type: 'string', enum: ['party', 'date', 'global'] },
              degree: { type: 'number' },
              biologicalRole: { type: 'string' }
            }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              betweenness: { type: 'number' },
              flowRole: { type: 'string' }
            }
          }
        },
        hubBottlenecks: { type: 'array', items: { type: 'object' } },
        biologicalImportance: { type: 'object' },
        peripheralNodes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'hubs-bottlenecks']
}));

// Task 6: Network Dynamics
export const networkDynamicsTask = defineTask('network-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze network dynamics',
  agent: {
    name: 'dynamics-analyst',
    prompt: {
      role: 'systems biologist specializing in network dynamics',
      task: 'Analyze dynamic properties of the network',
      context: args,
      instructions: [
        'Analyze information/signal flow through network:',
        '  - Flow from inputs to outputs',
        '  - Signal amplification and attenuation',
        '  - Signal integration at convergent nodes',
        'Identify network motifs and their dynamic roles:',
        '  - Feed-forward loops',
        '  - Feedback loops',
        '  - Bi-fan motifs',
        'Analyze temporal aspects:',
        '  - Response times',
        '  - Oscillatory behavior',
        '  - Bistability potential',
        'Model perturbation propagation',
        'Identify attractors and stable states',
        'Save dynamics analysis to output directory'
      ],
      outputFormat: 'JSON with dynamics (signalFlow, motifs, temporalProperties), perturbationPropagation, attractors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamics', 'motifs', 'artifacts'],
      properties: {
        dynamics: {
          type: 'object',
          properties: {
            signalFlow: { type: 'object' },
            responseTime: { type: 'string' },
            oscillatoryPotential: { type: 'boolean' },
            bistability: { type: 'boolean' }
          }
        },
        motifs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              count: { type: 'number' },
              significance: { type: 'number' },
              function: { type: 'string' }
            }
          }
        },
        perturbationPropagation: { type: 'object' },
        attractors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'dynamics']
}));

// Task 7: Robustness and Vulnerability Analysis
export const robustnessVulnerabilityTask = defineTask('robustness-vulnerability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess network robustness and vulnerabilities',
  agent: {
    name: 'robustness-analyst',
    prompt: {
      role: 'network reliability specialist',
      task: 'Assess network robustness and identify vulnerabilities',
      context: args,
      instructions: [
        'Analyze robustness to random node removal',
        'Analyze vulnerability to targeted attacks (hub removal)',
        'Identify critical nodes whose removal fragments network',
        'Assess pathway redundancy:',
        '  - Alternative routes between key nodes',
        '  - Backup pathways',
        'Identify single points of failure',
        'Compute network percolation threshold',
        'Relate vulnerabilities to disease/dysfunction',
        'Recommend strategies to improve robustness',
        'Save robustness analysis to output directory'
      ],
      outputFormat: 'JSON with assessment (robustness, vulnerabilities, criticalNodes), redundancy, failurePoints, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'criticalNodes', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            randomFailureRobustness: { type: 'number' },
            targetedAttackVulnerability: { type: 'number' },
            percolationThreshold: { type: 'number' }
          }
        },
        criticalNodes: { type: 'array', items: { type: 'string' } },
        redundancy: {
          type: 'object',
          properties: {
            averagePathAlternatives: { type: 'number' },
            redundantPathways: { type: 'array', items: { type: 'object' } }
          }
        },
        singlePointsOfFailure: { type: 'array', items: { type: 'string' } },
        diseaseAssociations: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'robustness']
}));

// Task 8: Network Synthesis
export const networkSynthesisTask = defineTask('network-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize network insights',
  agent: {
    name: 'network-synthesis-specialist',
    prompt: {
      role: 'senior systems biologist',
      task: 'Synthesize network analysis into biological insights',
      context: args,
      instructions: [
        'Integrate all network analyses',
        'Extract key biological insights:',
        '  - System organization principles',
        '  - Key regulatory mechanisms',
        '  - Information processing strategies',
        '  - Evolutionary design principles',
        'Assess coverage of network analysis (0-100):',
        '  - Topology characterized?',
        '  - Modules identified?',
        '  - Pathways mapped?',
        '  - Dynamics understood?',
        '  - Vulnerabilities identified?',
        'Generate actionable conclusions',
        'Identify network-based predictions',
        'Recommend experimental validations',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with biologicalInsights, coverageScore, predictions, experimentalRecommendations, conclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['biologicalInsights', 'coverageScore', 'artifacts'],
      properties: {
        biologicalInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              significance: { type: 'string' }
            }
          }
        },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        predictions: { type: 'array', items: { type: 'object' } },
        experimentalRecommendations: { type: 'array', items: { type: 'string' } },
        conclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network-pathway', 'synthesis']
}));
