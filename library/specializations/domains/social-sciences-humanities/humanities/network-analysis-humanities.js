/**
 * @process humanities/network-analysis-humanities
 * @description Apply network analysis methods to historical correspondence, literary influence, social relationships, and cultural connections
 * @inputs { networkData: object, relationshipTypes: array, temporalScope: object, analysisGoals: array }
 * @outputs { success: boolean, networkAnalysis: object, visualizations: array, patterns: object, artifacts: array }
 * @recommendedSkills SK-HUM-009 (topic-modeling-text-mining), SK-HUM-011 (gis-mapping-humanities)
 * @recommendedAgents AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    networkData,
    relationshipTypes = ['correspondence', 'influence', 'social'],
    temporalScope = {},
    analysisGoals = [],
    historicalSources = [],
    outputDir = 'network-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Network Data Modeling
  ctx.log('info', 'Modeling network data');
  const dataModeling = await ctx.task(networkDataModelingTask, {
    networkData,
    relationshipTypes,
    historicalSources,
    outputDir
  });

  if (!dataModeling.success) {
    return {
      success: false,
      error: 'Network data modeling failed',
      details: dataModeling,
      metadata: { processId: 'humanities/network-analysis-humanities', timestamp: startTime }
    };
  }

  artifacts.push(...dataModeling.artifacts);

  // Task 2: Network Construction
  ctx.log('info', 'Constructing network');
  const networkConstruction = await ctx.task(networkConstructionTask, {
    dataModeling,
    relationshipTypes,
    outputDir
  });

  artifacts.push(...networkConstruction.artifacts);

  // Task 3: Centrality and Influence Analysis
  ctx.log('info', 'Analyzing centrality and influence');
  const centralityAnalysis = await ctx.task(centralityAnalysisTask, {
    networkConstruction,
    analysisGoals,
    outputDir
  });

  artifacts.push(...centralityAnalysis.artifacts);

  // Task 4: Community Detection
  ctx.log('info', 'Detecting communities and clusters');
  const communityDetection = await ctx.task(communityDetectionTask, {
    networkConstruction,
    outputDir
  });

  artifacts.push(...communityDetection.artifacts);

  // Task 5: Temporal Network Analysis
  ctx.log('info', 'Analyzing temporal network dynamics');
  const temporalAnalysis = await ctx.task(temporalNetworkTask, {
    networkConstruction,
    temporalScope,
    outputDir
  });

  artifacts.push(...temporalAnalysis.artifacts);

  // Task 6: Network Visualization
  ctx.log('info', 'Creating network visualizations');
  const networkVisualization = await ctx.task(networkVisualizationTask, {
    networkConstruction,
    centralityAnalysis,
    communityDetection,
    outputDir
  });

  artifacts.push(...networkVisualization.artifacts);

  // Task 7: Generate Network Analysis Report
  ctx.log('info', 'Generating network analysis report');
  const analysisReport = await ctx.task(networkReportTask, {
    networkData,
    dataModeling,
    networkConstruction,
    centralityAnalysis,
    communityDetection,
    temporalAnalysis,
    networkVisualization,
    analysisGoals,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  // Breakpoint: Review network analysis
  await ctx.breakpoint({
    question: `Network analysis complete. Nodes: ${networkConstruction.statistics?.nodes || 0}. Communities: ${communityDetection.communities?.length || 0}. Review analysis?`,
    title: 'Network Analysis for Humanities Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        nodes: networkConstruction.statistics?.nodes || 0,
        edges: networkConstruction.statistics?.edges || 0,
        communities: communityDetection.communities?.length || 0,
        centralFigures: centralityAnalysis.topNodes?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    networkAnalysis: {
      statistics: networkConstruction.statistics,
      centrality: centralityAnalysis.results,
      communities: communityDetection.communities
    },
    visualizations: networkVisualization.visualizations,
    patterns: {
      structural: communityDetection.patterns,
      temporal: temporalAnalysis.patterns,
      influence: centralityAnalysis.influencePatterns
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/network-analysis-humanities',
      timestamp: startTime,
      relationshipTypes,
      outputDir
    }
  };
}

// Task 1: Network Data Modeling
export const networkDataModelingTask = defineTask('network-data-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model network data',
  agent: {
    name: 'data-modeler',
    prompt: {
      role: 'humanities network data specialist',
      task: 'Model network data from historical sources',
      context: args,
      instructions: [
        'Define node types (persons, institutions, texts)',
        'Define edge types and attributes',
        'Extract entities from sources',
        'Identify relationships from sources',
        'Handle uncertain or inferred relationships',
        'Define edge weights if applicable',
        'Handle temporal attributes',
        'Document data provenance'
      ],
      outputFormat: 'JSON with success, nodeTypes, edgeTypes, extraction, uncertainty, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'nodeTypes', 'edgeTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nodeTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } },
              count: { type: 'number' }
            }
          }
        },
        edgeTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              directed: { type: 'boolean' },
              attributes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        extraction: { type: 'object' },
        uncertainty: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-modeling', 'network', 'humanities']
}));

// Task 2: Network Construction
export const networkConstructionTask = defineTask('network-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct network',
  agent: {
    name: 'network-builder',
    prompt: {
      role: 'network construction specialist',
      task: 'Construct network from modeled data',
      context: args,
      instructions: [
        'Create node list with attributes',
        'Create edge list with attributes',
        'Build network graph structure',
        'Handle multi-modal networks',
        'Apply edge weights',
        'Handle directed vs undirected edges',
        'Calculate basic network statistics',
        'Export in standard formats'
      ],
      outputFormat: 'JSON with network, statistics, format, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['network', 'statistics', 'artifacts'],
      properties: {
        network: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            directed: { type: 'boolean' },
            weighted: { type: 'boolean' }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            nodes: { type: 'number' },
            edges: { type: 'number' },
            density: { type: 'number' },
            avgDegree: { type: 'number' }
          }
        },
        format: { type: 'object' },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network', 'construction', 'graph']
}));

// Task 3: Centrality and Influence Analysis
export const centralityAnalysisTask = defineTask('centrality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze centrality and influence',
  agent: {
    name: 'centrality-analyst',
    prompt: {
      role: 'network centrality specialist',
      task: 'Analyze centrality and influence in network',
      context: args,
      instructions: [
        'Calculate degree centrality',
        'Calculate betweenness centrality',
        'Calculate closeness centrality',
        'Calculate eigenvector centrality',
        'Identify most central nodes',
        'Analyze broker positions',
        'Identify influence patterns',
        'Interpret centrality for humanities context'
      ],
      outputFormat: 'JSON with results, topNodes, influencePatterns, interpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'topNodes', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            degree: { type: 'object' },
            betweenness: { type: 'object' },
            closeness: { type: 'object' },
            eigenvector: { type: 'object' }
          }
        },
        topNodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              metric: { type: 'string' },
              value: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        influencePatterns: { type: 'array', items: { type: 'object' } },
        brokers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'centrality', 'influence', 'analysis']
}));

// Task 4: Community Detection
export const communityDetectionTask = defineTask('community-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect communities and clusters',
  agent: {
    name: 'community-detector',
    prompt: {
      role: 'network community detection specialist',
      task: 'Detect communities and clusters in network',
      context: args,
      instructions: [
        'Apply community detection algorithms',
        'Identify network clusters',
        'Calculate modularity',
        'Analyze community composition',
        'Identify bridging nodes',
        'Analyze community characteristics',
        'Interpret communities historically',
        'Compare with known groupings'
      ],
      outputFormat: 'JSON with communities, modularity, bridges, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communities', 'artifacts'],
      properties: {
        communities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              members: { type: 'array', items: { type: 'string' } },
              size: { type: 'number' },
              characteristics: { type: 'object' }
            }
          }
        },
        modularity: { type: 'number' },
        bridges: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'object' } },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'clustering', 'modularity']
}));

// Task 5: Temporal Network Analysis
export const temporalNetworkTask = defineTask('temporal-network', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze temporal network dynamics',
  agent: {
    name: 'temporal-analyst',
    prompt: {
      role: 'temporal network specialist',
      task: 'Analyze temporal dynamics of network',
      context: args,
      instructions: [
        'Slice network by time periods',
        'Analyze network evolution',
        'Track centrality changes over time',
        'Analyze community stability',
        'Identify emerging and declining nodes',
        'Analyze relationship duration',
        'Identify temporal patterns',
        'Create network timeline'
      ],
      outputFormat: 'JSON with patterns, evolution, stability, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'evolution', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              period: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        evolution: {
          type: 'object',
          properties: {
            growth: { type: 'object' },
            changes: { type: 'array', items: { type: 'object' } }
          }
        },
        stability: {
          type: 'object',
          properties: {
            communities: { type: 'object' },
            centrality: { type: 'object' }
          }
        },
        timeline: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'temporal', 'dynamics', 'evolution']
}));

// Task 6: Network Visualization
export const networkVisualizationTask = defineTask('network-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create network visualizations',
  agent: {
    name: 'visualizer',
    prompt: {
      role: 'network visualization specialist',
      task: 'Create effective network visualizations',
      context: args,
      instructions: [
        'Select appropriate layout algorithms',
        'Design node visual encoding',
        'Design edge visual encoding',
        'Create static network visualizations',
        'Create interactive visualizations if appropriate',
        'Highlight communities visually',
        'Create temporal animation if appropriate',
        'Design for publication quality'
      ],
      outputFormat: 'JSON with visualizations, layouts, design, interactive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visualizations', 'artifacts'],
      properties: {
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              layout: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        layouts: { type: 'array', items: { type: 'string' } },
        design: {
          type: 'object',
          properties: {
            nodeEncoding: { type: 'object' },
            edgeEncoding: { type: 'object' },
            colorScheme: { type: 'object' }
          }
        },
        interactive: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visualization', 'network-graph', 'design']
}));

// Task 7: Network Analysis Report Generation
export const networkReportTask = defineTask('network-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate network analysis report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'network analysis documentation specialist',
      task: 'Generate comprehensive network analysis report',
      context: args,
      instructions: [
        'Document data sources and modeling',
        'Present network construction methodology',
        'Report centrality analysis results',
        'Present community detection findings',
        'Document temporal analysis',
        'Include visualizations',
        'Interpret findings for humanities context',
        'Address research questions'
      ],
      outputFormat: 'JSON with reportPath, sections, findings, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'findings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              evidence: { type: 'string' },
              interpretation: { type: 'string' }
            }
          }
        },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'network-analysis', 'humanities']
}));
