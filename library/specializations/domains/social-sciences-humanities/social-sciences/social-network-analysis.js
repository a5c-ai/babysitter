/**
 * @process social-sciences/social-network-analysis
 * @description Map and analyze social network structures including centrality measures, community detection, tie strength analysis, and network visualization using Gephi or UCINET
 * @inputs { networkData: object, researchQuestions: array, networkType: string, outputDir: string }
 * @outputs { success: boolean, networkMetrics: object, communityStructure: object, visualizations: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-007 (network-analysis), SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-009 (computational-social-scientist), AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    networkData = {},
    researchQuestions = [],
    networkType = 'undirected',
    outputDir = 'sna-output',
    software = 'Gephi'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Social Network Analysis process');

  // ============================================================================
  // PHASE 1: NETWORK DATA PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing network data');
  const dataPreparation = await ctx.task(networkDataPreparationTask, {
    networkData,
    networkType,
    software,
    outputDir
  });

  artifacts.push(...dataPreparation.artifacts);

  // ============================================================================
  // PHASE 2: NETWORK DESCRIPTIVES
  // ============================================================================

  ctx.log('info', 'Phase 2: Computing network descriptives');
  const networkDescriptives = await ctx.task(networkDescriptivesTask, {
    dataPreparation,
    networkType,
    outputDir
  });

  artifacts.push(...networkDescriptives.artifacts);

  // ============================================================================
  // PHASE 3: CENTRALITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting centrality analysis');
  const centralityAnalysis = await ctx.task(centralityAnalysisTask, {
    dataPreparation,
    networkType,
    outputDir
  });

  artifacts.push(...centralityAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: COMMUNITY DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Detecting communities');
  const communityDetection = await ctx.task(communityDetectionTask, {
    dataPreparation,
    networkDescriptives,
    outputDir
  });

  artifacts.push(...communityDetection.artifacts);

  // ============================================================================
  // PHASE 5: TIE STRENGTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing tie strength');
  const tieStrengthAnalysis = await ctx.task(tieStrengthAnalysisTask, {
    dataPreparation,
    networkType,
    outputDir
  });

  artifacts.push(...tieStrengthAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: NETWORK VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating network visualizations');
  const networkVisualization = await ctx.task(networkVisualizationTask, {
    dataPreparation,
    centralityAnalysis,
    communityDetection,
    software,
    outputDir
  });

  artifacts.push(...networkVisualization.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(snaQualityScoringTask, {
    dataPreparation,
    networkDescriptives,
    centralityAnalysis,
    communityDetection,
    tieStrengthAnalysis,
    networkVisualization,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const snaScore = qualityScore.overallScore;
  const qualityMet = snaScore >= 80;

  // Breakpoint: Review SNA analysis
  await ctx.breakpoint({
    question: `Social network analysis complete. Quality score: ${snaScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Social Network Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        snaScore,
        qualityMet,
        nodes: networkDescriptives.nodeCount,
        edges: networkDescriptives.edgeCount,
        density: networkDescriptives.density,
        communities: communityDetection.communityCount
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: snaScore,
    qualityMet,
    networkMetrics: {
      descriptives: networkDescriptives.summary,
      centrality: centralityAnalysis.summary,
      tieStrength: tieStrengthAnalysis.summary
    },
    communityStructure: {
      communities: communityDetection.communities,
      modularity: communityDetection.modularity,
      communityCount: communityDetection.communityCount
    },
    visualizations: networkVisualization.visualizations,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/social-network-analysis',
      timestamp: startTime,
      software,
      networkType,
      outputDir
    }
  };
}

// Task 1: Network Data Preparation
export const networkDataPreparationTask = defineTask('network-data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare network data',
  agent: {
    name: 'network-data-analyst',
    prompt: {
      role: 'social network analysis specialist',
      task: 'Prepare network data for analysis',
      context: args,
      instructions: [
        'Load and validate network data format',
        'Create edge list and/or adjacency matrix',
        'Handle node attributes',
        'Handle edge weights if present',
        'Clean and validate network data',
        'Identify and handle missing data',
        'Identify isolates and pendants',
        'Import data into analysis software',
        'Generate data preparation report'
      ],
      outputFormat: 'JSON with edgeList, nodeAttributes, dataFormat, validationResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['edgeList', 'dataFormat', 'artifacts'],
      properties: {
        edgeList: { type: 'string' },
        nodeAttributes: { type: 'object' },
        dataFormat: { type: 'string' },
        validationResults: { type: 'object' },
        isolates: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'data-preparation']
}));

// Task 2: Network Descriptives
export const networkDescriptivesTask = defineTask('network-descriptives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute network descriptives',
  agent: {
    name: 'network-metrics-analyst',
    prompt: {
      role: 'network analyst',
      task: 'Compute basic network descriptive statistics',
      context: args,
      instructions: [
        'Count nodes and edges',
        'Calculate network density',
        'Compute average degree',
        'Calculate degree distribution',
        'Compute network diameter and average path length',
        'Calculate clustering coefficient (transitivity)',
        'Assess network connectivity (components)',
        'Compare to random network benchmarks',
        'Generate network descriptives report'
      ],
      outputFormat: 'JSON with summary, nodeCount, edgeCount, density, avgDegree, diameter, clustering, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'nodeCount', 'edgeCount', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        nodeCount: { type: 'number' },
        edgeCount: { type: 'number' },
        density: { type: 'number' },
        avgDegree: { type: 'number' },
        degreeDistribution: { type: 'object' },
        diameter: { type: 'number' },
        avgPathLength: { type: 'number' },
        clustering: { type: 'number' },
        components: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'descriptives']
}));

// Task 3: Centrality Analysis
export const centralityAnalysisTask = defineTask('centrality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct centrality analysis',
  agent: {
    name: 'centrality-analyst',
    prompt: {
      role: 'social network centrality expert',
      task: 'Compute and analyze node centrality measures',
      context: args,
      instructions: [
        'Calculate degree centrality',
        'Calculate betweenness centrality',
        'Calculate closeness centrality',
        'Calculate eigenvector centrality',
        'Calculate PageRank if appropriate',
        'Identify most central nodes by each measure',
        'Analyze centrality distributions',
        'Correlate centrality measures',
        'Interpret centrality in research context',
        'Generate centrality analysis report'
      ],
      outputFormat: 'JSON with summary, degreeCentrality, betweenness, closeness, eigenvector, topNodes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        degreeCentrality: { type: 'object' },
        betweenness: { type: 'object' },
        closeness: { type: 'object' },
        eigenvector: { type: 'object' },
        topNodes: {
          type: 'object',
          properties: {
            byDegree: { type: 'array' },
            byBetweenness: { type: 'array' },
            byCloseness: { type: 'array' }
          }
        },
        centralityCorrelations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'centrality']
}));

// Task 4: Community Detection
export const communityDetectionTask = defineTask('community-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect communities',
  agent: {
    name: 'community-detection-analyst',
    prompt: {
      role: 'network community detection specialist',
      task: 'Detect and analyze community structure in network',
      context: args,
      instructions: [
        'Apply Louvain algorithm for community detection',
        'Apply modularity optimization',
        'Try alternative algorithms (label propagation, Girvan-Newman)',
        'Calculate modularity score',
        'Identify community membership for each node',
        'Analyze community sizes and composition',
        'Identify bridge nodes between communities',
        'Compare results across algorithms',
        'Generate community detection report'
      ],
      outputFormat: 'JSON with communities, modularity, communityCount, bridgeNodes, algorithmComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communities', 'modularity', 'communityCount', 'artifacts'],
      properties: {
        communities: { type: 'object' },
        modularity: { type: 'number' },
        communityCount: { type: 'number' },
        communitySizes: { type: 'object' },
        bridgeNodes: { type: 'array' },
        algorithmComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'community-detection']
}));

// Task 5: Tie Strength Analysis
export const tieStrengthAnalysisTask = defineTask('tie-strength-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze tie strength',
  agent: {
    name: 'tie-strength-analyst',
    prompt: {
      role: 'network tie strength expert',
      task: 'Analyze tie strength and edge properties',
      context: args,
      instructions: [
        'Analyze edge weight distribution if weighted',
        'Identify strong vs weak ties',
        'Analyze reciprocity in directed networks',
        'Calculate local bridge analysis',
        'Identify structural holes',
        'Calculate constraint and brokerage measures',
        'Analyze tie strength by node attributes',
        'Relate tie strength to network structure',
        'Generate tie strength analysis report'
      ],
      outputFormat: 'JSON with summary, weightDistribution, strongTies, weakTies, reciprocity, structuralHoles, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        weightDistribution: { type: 'object' },
        strongTies: { type: 'number' },
        weakTies: { type: 'number' },
        reciprocity: { type: 'number' },
        structuralHoles: { type: 'object' },
        brokerage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'tie-strength']
}));

// Task 6: Network Visualization
export const networkVisualizationTask = defineTask('network-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create network visualizations',
  agent: {
    name: 'network-visualization-specialist',
    prompt: {
      role: 'network visualization expert',
      task: 'Create effective network visualizations',
      context: args,
      instructions: [
        'Apply force-directed layout algorithm',
        'Size nodes by centrality measure',
        'Color nodes by community membership',
        'Vary edge thickness by weight',
        'Add node labels for key actors',
        'Create multiple visualization perspectives',
        'Optimize layout for readability',
        'Export high-quality images',
        'Generate visualization report'
      ],
      outputFormat: 'JSON with visualizations, layouts, nodeAttributes, edgeAttributes, artifacts'
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
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        layouts: { type: 'array', items: { type: 'string' } },
        nodeAttributes: { type: 'object' },
        edgeAttributes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'visualization']
}));

// Task 7: Quality Scoring
export const snaQualityScoringTask = defineTask('sna-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'sna-quality-reviewer',
    prompt: {
      role: 'senior social network analyst',
      task: 'Assess social network analysis quality',
      context: args,
      instructions: [
        'Evaluate data preparation completeness (weight: 10%)',
        'Assess network descriptives coverage (weight: 15%)',
        'Evaluate centrality analysis rigor (weight: 20%)',
        'Assess community detection quality (weight: 20%)',
        'Evaluate tie strength analysis (weight: 15%)',
        'Assess visualization effectiveness (weight: 20%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            dataPreparation: { type: 'number' },
            networkDescriptives: { type: 'number' },
            centralityAnalysis: { type: 'number' },
            communityDetection: { type: 'number' },
            tieStrengthAnalysis: { type: 'number' },
            visualization: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sna', 'quality-scoring']
}));
