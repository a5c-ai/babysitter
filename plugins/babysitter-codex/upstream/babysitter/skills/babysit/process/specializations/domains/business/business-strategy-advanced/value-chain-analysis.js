/**
 * @process business-strategy/value-chain-analysis
 * @description Porter's value chain analysis to identify sources of competitive advantage through activity optimization
 * @inputs { organizationName: string, businessModel: object, processData: object, costData: object, competitorBenchmarks: object }
 * @outputs { success: boolean, valueChainMap: object, costDrivers: object, differentiationOpportunities: array, optimizationRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    businessModel = {},
    processData = {},
    costData = {},
    competitorBenchmarks = {},
    outputDir = 'value-chain-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Value Chain Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: PRIMARY ACTIVITIES MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Mapping primary activities');
  const primaryActivities = await ctx.task(primaryActivitiesTask, {
    organizationName,
    businessModel,
    processData,
    outputDir
  });

  artifacts.push(...primaryActivities.artifacts);

  // ============================================================================
  // PHASE 2: SUPPORT ACTIVITIES MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping support activities');
  const supportActivities = await ctx.task(supportActivitiesTask, {
    organizationName,
    businessModel,
    processData,
    outputDir
  });

  artifacts.push(...supportActivities.artifacts);

  // ============================================================================
  // PHASE 3: COST DRIVER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing cost drivers');
  const costDriverAnalysis = await ctx.task(costDriverAnalysisTask, {
    organizationName,
    primaryActivities,
    supportActivities,
    costData,
    outputDir
  });

  artifacts.push(...costDriverAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: DIFFERENTIATION OPPORTUNITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying differentiation opportunities');
  const differentiationAnalysis = await ctx.task(differentiationAnalysisTask, {
    organizationName,
    primaryActivities,
    supportActivities,
    competitorBenchmarks,
    outputDir
  });

  artifacts.push(...differentiationAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: COMPETITIVE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Benchmarking against competitors');
  const benchmarkingResult = await ctx.task(competitiveBenchmarkingTask, {
    organizationName,
    primaryActivities,
    supportActivities,
    costDriverAnalysis,
    competitorBenchmarks,
    outputDir
  });

  artifacts.push(...benchmarkingResult.artifacts);

  // ============================================================================
  // PHASE 6: LINKAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing activity linkages');
  const linkageAnalysis = await ctx.task(linkageAnalysisTask, {
    organizationName,
    primaryActivities,
    supportActivities,
    outputDir
  });

  artifacts.push(...linkageAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    organizationName,
    costDriverAnalysis,
    differentiationAnalysis,
    benchmarkingResult,
    linkageAnalysis,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive value chain report');
  const valueChainReport = await ctx.task(valueChainReportTask, {
    organizationName,
    primaryActivities,
    supportActivities,
    costDriverAnalysis,
    differentiationAnalysis,
    benchmarkingResult,
    linkageAnalysis,
    optimizationRecommendations,
    outputDir
  });

  artifacts.push(...valueChainReport.artifacts);

  // Breakpoint: Review value chain analysis
  await ctx.breakpoint({
    question: `Value chain analysis complete for ${organizationName}. ${optimizationRecommendations.recommendations?.length || 0} optimization opportunities identified. Review?`,
    title: 'Value Chain Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        primaryActivitiesCount: primaryActivities.activities?.length || 0,
        supportActivitiesCount: supportActivities.activities?.length || 0,
        costDrivers: costDriverAnalysis.topCostDrivers?.length || 0,
        differentiationOpportunities: differentiationAnalysis.opportunities?.length || 0,
        optimizationRecommendations: optimizationRecommendations.recommendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    valueChainMap: {
      primaryActivities: primaryActivities.activities,
      supportActivities: supportActivities.activities,
      linkages: linkageAnalysis.linkages
    },
    costDrivers: costDriverAnalysis.costDrivers,
    differentiationOpportunities: differentiationAnalysis.opportunities,
    benchmarkComparison: benchmarkingResult.comparison,
    optimizationRecommendations: optimizationRecommendations.recommendations,
    reportPath: valueChainReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/value-chain-analysis',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Primary Activities Mapping
export const primaryActivitiesTask = defineTask('primary-activities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map primary value chain activities',
  agent: {
    name: 'operations-analyst',
    prompt: {
      role: 'operations and value chain analyst',
      task: 'Map and analyze primary value chain activities',
      context: args,
      instructions: [
        'Map inbound logistics: receiving, warehousing, inventory control',
        'Map operations: manufacturing, assembly, processing',
        'Map outbound logistics: order fulfillment, distribution, delivery',
        'Map marketing and sales: advertising, promotion, sales force, pricing',
        'Map service: installation, repair, training, support',
        'Identify key activities within each category',
        'Assess value added by each activity',
        'Document processes and workflows',
        'Generate primary activities map'
      ],
      outputFormat: 'JSON with activities (array with category, activity, description, valueAdded, processes), inboundLogistics, operations, outboundLogistics, marketingSales, service, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              activity: { type: 'string' },
              description: { type: 'string' },
              valueAdded: { type: 'string' },
              processes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        inboundLogistics: { type: 'array', items: { type: 'object' } },
        operations: { type: 'array', items: { type: 'object' } },
        outboundLogistics: { type: 'array', items: { type: 'object' } },
        marketingSales: { type: 'array', items: { type: 'object' } },
        service: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'primary-activities']
}));

// Task 2: Support Activities Mapping
export const supportActivitiesTask = defineTask('support-activities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map support value chain activities',
  agent: {
    name: 'support-analyst',
    prompt: {
      role: 'organizational support analyst',
      task: 'Map and analyze support value chain activities',
      context: args,
      instructions: [
        'Map firm infrastructure: general management, planning, finance, legal, quality',
        'Map human resource management: recruiting, hiring, training, development, compensation',
        'Map technology development: R&D, process automation, IT systems',
        'Map procurement: purchasing, supplier management, sourcing',
        'Identify key activities within each category',
        'Assess support provided to primary activities',
        'Document processes and capabilities',
        'Generate support activities map'
      ],
      outputFormat: 'JSON with activities (array), firmInfrastructure, hrManagement, technologyDevelopment, procurement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              activity: { type: 'string' },
              description: { type: 'string' },
              supportedActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        firmInfrastructure: { type: 'array', items: { type: 'object' } },
        hrManagement: { type: 'array', items: { type: 'object' } },
        technologyDevelopment: { type: 'array', items: { type: 'object' } },
        procurement: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'support-activities']
}));

// Task 3: Cost Driver Analysis
export const costDriverAnalysisTask = defineTask('cost-driver-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cost drivers for each activity',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'cost management and activity-based costing specialist',
      task: 'Analyze cost drivers for each value chain activity',
      context: args,
      instructions: [
        'Identify cost drivers for each primary activity',
        'Identify cost drivers for each support activity',
        'Analyze economies of scale opportunities',
        'Assess capacity utilization impact',
        'Evaluate learning curve effects',
        'Analyze linkage cost impacts',
        'Assess timing and first-mover impacts',
        'Evaluate policy choices affecting costs',
        'Rank activities by cost significance',
        'Generate cost driver analysis report'
      ],
      outputFormat: 'JSON with costDrivers (object by activity), topCostDrivers, economiesOfScale, costReductionOpportunities, activityCostRanking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costDrivers', 'topCostDrivers', 'artifacts'],
      properties: {
        costDrivers: { type: 'object' },
        topCostDrivers: { type: 'array', items: { type: 'object' } },
        economiesOfScale: { type: 'array', items: { type: 'string' } },
        costReductionOpportunities: { type: 'array', items: { type: 'object' } },
        activityCostRanking: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'cost-drivers']
}));

// Task 4: Differentiation Analysis
export const differentiationAnalysisTask = defineTask('differentiation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify differentiation opportunities',
  agent: {
    name: 'differentiation-analyst',
    prompt: {
      role: 'competitive differentiation specialist',
      task: 'Identify differentiation opportunities in each value chain activity',
      context: args,
      instructions: [
        'Identify differentiation opportunities in each primary activity',
        'Identify differentiation opportunities in support activities',
        'Assess uniqueness drivers for each activity',
        'Evaluate customer value creation potential',
        'Analyze brand and reputation building activities',
        'Assess quality and features enhancement opportunities',
        'Evaluate service differentiation potential',
        'Identify technology-enabled differentiation',
        'Rank opportunities by impact and feasibility',
        'Generate differentiation opportunities report'
      ],
      outputFormat: 'JSON with opportunities (array with activity, opportunity, impact, feasibility), uniquenessDrivers, customerValueDrivers, prioritizedOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              opportunity: { type: 'string' },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              feasibility: { type: 'number', minimum: 1, maximum: 5 }
            }
          }
        },
        uniquenessDrivers: { type: 'array', items: { type: 'string' } },
        customerValueDrivers: { type: 'array', items: { type: 'string' } },
        prioritizedOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'differentiation']
}));

// Task 5: Competitive Benchmarking
export const competitiveBenchmarkingTask = defineTask('competitive-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark activities against competitors',
  agent: {
    name: 'benchmarking-analyst',
    prompt: {
      role: 'competitive benchmarking specialist',
      task: 'Benchmark value chain activities against competitors',
      context: args,
      instructions: [
        'Compare each activity against key competitors',
        'Identify activities where company leads',
        'Identify activities where competitors lead',
        'Assess cost position relative to competitors',
        'Evaluate differentiation position vs. competitors',
        'Identify best practices from competitors',
        'Determine competitive gaps and advantages',
        'Assess industry best practices',
        'Generate competitive benchmarking matrix'
      ],
      outputFormat: 'JSON with comparison (object by activity), competitiveAdvantages, competitiveGaps, bestPractices, benchmarkMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'competitiveAdvantages', 'artifacts'],
      properties: {
        comparison: { type: 'object' },
        competitiveAdvantages: { type: 'array', items: { type: 'string' } },
        competitiveGaps: { type: 'array', items: { type: 'string' } },
        bestPractices: { type: 'array', items: { type: 'object' } },
        benchmarkMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'benchmarking']
}));

// Task 6: Linkage Analysis
export const linkageAnalysisTask = defineTask('linkage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze activity linkages',
  agent: {
    name: 'linkage-analyst',
    prompt: {
      role: 'process optimization and linkage analyst',
      task: 'Analyze linkages and optimization opportunities between activities',
      context: args,
      instructions: [
        'Identify internal linkages between activities',
        'Identify vertical linkages with suppliers',
        'Identify vertical linkages with channels/customers',
        'Analyze coordination opportunities',
        'Assess optimization through linkage management',
        'Identify trade-offs between activities',
        'Evaluate information sharing opportunities',
        'Assess linkage-based competitive advantages',
        'Generate linkage analysis map'
      ],
      outputFormat: 'JSON with linkages (array), internalLinkages, supplierLinkages, customerLinkages, optimizationOpportunities, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['linkages', 'artifacts'],
      properties: {
        linkages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              optimizationPotential: { type: 'string' }
            }
          }
        },
        internalLinkages: { type: 'array', items: { type: 'object' } },
        supplierLinkages: { type: 'array', items: { type: 'object' } },
        customerLinkages: { type: 'array', items: { type: 'object' } },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'linkages']
}));

// Task 7: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop activity system improvements',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'value chain optimization strategist',
      task: 'Develop comprehensive activity system improvements',
      context: args,
      instructions: [
        'Prioritize cost reduction opportunities',
        'Prioritize differentiation opportunities',
        'Recommend linkage optimizations',
        'Suggest process improvements',
        'Recommend technology investments',
        'Identify outsourcing opportunities',
        'Suggest vertical integration opportunities',
        'Estimate impact and investment for each recommendation',
        'Create implementation roadmap',
        'Generate optimization recommendations report'
      ],
      outputFormat: 'JSON with recommendations (array), costReductions, differentiationEnhancements, linkageOptimizations, implementationRoadmap, investmentRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              activity: { type: 'string' },
              type: { type: 'string', enum: ['cost', 'differentiation', 'linkage', 'technology'] },
              impact: { type: 'string' },
              investment: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        costReductions: { type: 'array', items: { type: 'object' } },
        differentiationEnhancements: { type: 'array', items: { type: 'object' } },
        linkageOptimizations: { type: 'array', items: { type: 'object' } },
        implementationRoadmap: { type: 'array', items: { type: 'object' } },
        investmentRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'optimization']
}));

// Task 8: Value Chain Report Generation
export const valueChainReportTask = defineTask('value-chain-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive value chain report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive value chain analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present value chain map visualization',
        'Document primary and support activities',
        'Present cost driver analysis',
        'Document differentiation opportunities',
        'Include competitive benchmarking results',
        'Present linkage analysis',
        'Document optimization recommendations',
        'Include implementation roadmap',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'value-chain', 'reporting']
}));
