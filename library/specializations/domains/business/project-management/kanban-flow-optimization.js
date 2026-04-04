/**
 * @process specializations/domains/business/project-management/kanban-flow-optimization
 * @description Kanban Flow Optimization - Analyze workflow, identify bottlenecks, optimize WIP limits,
 * improve cycle times, and implement continuous flow improvements.
 * @inputs { projectName: string, workflowStages: array, currentMetrics: object, wip: object }
 * @outputs { success: boolean, optimizedFlow: object, wipLimits: object, improvements: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/kanban-flow-optimization', {
 *   projectName: 'Support Queue',
 *   workflowStages: ['Backlog', 'Ready', 'In Progress', 'Review', 'Done'],
 *   currentMetrics: { avgCycleTime: 5, throughput: 20 },
 *   wip: { 'In Progress': 5, 'Review': 3 }
 * });
 *
 * @references
 * - Kanban Guide: https://kanban.university/kanban-guide/
 * - Lean Kanban University: https://kanban.university/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    workflowStages = [],
    currentMetrics = {},
    wip = {},
    workItems = [],
    teamSize = 5
  } = inputs;

  // Phase 1: Current State Analysis
  const currentStateAnalysis = await ctx.task(currentStateTask, {
    projectName,
    workflowStages,
    currentMetrics,
    wip,
    workItems
  });

  // Phase 2: Bottleneck Identification
  const bottleneckAnalysis = await ctx.task(bottleneckTask, {
    projectName,
    currentState: currentStateAnalysis,
    workflowStages
  });

  // Breakpoint: Review bottlenecks
  const bottlenecks = bottleneckAnalysis.bottlenecks || [];
  if (bottlenecks.length > 0) {
    await ctx.breakpoint({
      question: `${bottlenecks.length} bottlenecks identified in ${projectName} workflow. Review findings?`,
      title: 'Bottleneck Review',
      context: {
        runId: ctx.runId,
        bottleneckCount: bottlenecks.length,
        files: [{
          path: `artifacts/bottlenecks.json`,
          format: 'json',
          content: bottleneckAnalysis
        }]
      }
    });
  }

  // Phase 3: WIP Limit Optimization
  const wipOptimization = await ctx.task(wipOptimizationTask, {
    projectName,
    currentWip: wip,
    bottlenecks: bottleneckAnalysis.bottlenecks,
    teamSize,
    workflowStages
  });

  // Phase 4: Flow Metrics Analysis
  const flowMetrics = await ctx.task(flowMetricsTask, {
    projectName,
    currentMetrics,
    workItems,
    workflowStages
  });

  // Phase 5: Service Level Expectations
  const sleDefinition = await ctx.task(sleDefinitionTask, {
    projectName,
    flowMetrics,
    workflowStages
  });

  // Phase 6: Improvement Opportunities
  const improvementOpportunities = await ctx.task(improvementTask, {
    projectName,
    bottlenecks: bottleneckAnalysis.bottlenecks,
    wipOptimization,
    flowMetrics
  });

  // Phase 7: Implementation Planning
  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    improvements: improvementOpportunities,
    wipOptimization,
    sleDefinition
  });

  // Phase 8: Metrics Dashboard Design
  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    projectName,
    flowMetrics,
    wipOptimization,
    sleDefinition
  });

  // Phase 9: Optimization Documentation
  const optimizationDocumentation = await ctx.task(optimizationDocumentationTask, {
    projectName,
    currentState: currentStateAnalysis,
    bottlenecks: bottleneckAnalysis,
    wipOptimization,
    flowMetrics,
    sleDefinition,
    improvements: improvementOpportunities,
    implementationPlan,
    dashboard: dashboardDesign
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Kanban flow optimization complete for ${projectName}. ${improvementOpportunities.opportunities?.length || 0} improvements identified. Approve optimization plan?`,
    title: 'Flow Optimization Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/kanban-optimization.json`, format: 'json', content: optimizationDocumentation },
        { path: `artifacts/kanban-optimization.md`, format: 'markdown', content: optimizationDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    optimizedFlow: {
      stages: workflowStages,
      bottlenecks: bottleneckAnalysis.bottlenecks,
      improvements: improvementOpportunities.opportunities
    },
    wipLimits: wipOptimization.recommendedLimits,
    serviceLevelExpectations: sleDefinition.sles,
    metrics: flowMetrics,
    implementationPlan: implementationPlan,
    documentation: optimizationDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/kanban-flow-optimization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const currentStateTask = defineTask('current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Current State Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kanban Coach',
      task: 'Analyze current Kanban workflow state',
      context: {
        projectName: args.projectName,
        workflowStages: args.workflowStages,
        currentMetrics: args.currentMetrics,
        wip: args.wip,
        workItems: args.workItems
      },
      instructions: [
        '1. Map current workflow',
        '2. Document WIP limits',
        '3. Analyze queue sizes',
        '4. Review blocked items',
        '5. Assess stage utilization',
        '6. Document policies',
        '7. Identify work item types',
        '8. Analyze arrival rates',
        '9. Document team capacity',
        '10. Compile current state analysis'
      ],
      outputFormat: 'JSON object with current state analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState'],
      properties: {
        currentState: { type: 'object' },
        workflowMap: { type: 'object' },
        stageUtilization: { type: 'object' },
        blockedItems: { type: 'array' },
        arrivalRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'analysis', 'workflow']
}));

export const bottleneckTask = defineTask('bottleneck-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Bottleneck Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flow Analyst',
      task: 'Identify workflow bottlenecks',
      context: {
        projectName: args.projectName,
        currentState: args.currentState,
        workflowStages: args.workflowStages
      },
      instructions: [
        '1. Analyze stage wait times',
        '2. Identify queue buildups',
        '3. Calculate stage cycle times',
        '4. Identify constraints',
        '5. Analyze handoff delays',
        '6. Review blocking patterns',
        '7. Assess resource availability',
        '8. Identify systemic issues',
        '9. Calculate impact',
        '10. Compile bottleneck analysis'
      ],
      outputFormat: 'JSON object with bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks'],
      properties: {
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              type: { type: 'string' },
              impact: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        stageCycleTimes: { type: 'object' },
        blockingPatterns: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'bottleneck', 'constraint']
}));

export const wipOptimizationTask = defineTask('wip-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: WIP Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WIP Specialist',
      task: 'Optimize WIP limits',
      context: {
        projectName: args.projectName,
        currentWip: args.currentWip,
        bottlenecks: args.bottlenecks,
        teamSize: args.teamSize,
        workflowStages: args.workflowStages
      },
      instructions: [
        '1. Analyze current WIP effectiveness',
        '2. Apply Little\'s Law',
        '3. Calculate optimal WIP',
        '4. Consider team capacity',
        '5. Account for bottlenecks',
        '6. Set stage-specific limits',
        '7. Define buffer rules',
        '8. Create expedite policies',
        '9. Document WIP exceptions',
        '10. Compile WIP recommendations'
      ],
      outputFormat: 'JSON object with WIP optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedLimits'],
      properties: {
        recommendedLimits: { type: 'object' },
        littlesLawAnalysis: { type: 'object' },
        bufferRules: { type: 'array' },
        expeditePolicies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'wip', 'optimization']
}));

export const flowMetricsTask = defineTask('flow-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Flow Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metrics Analyst',
      task: 'Analyze Kanban flow metrics',
      context: {
        projectName: args.projectName,
        currentMetrics: args.currentMetrics,
        workItems: args.workItems,
        workflowStages: args.workflowStages
      },
      instructions: [
        '1. Calculate lead time',
        '2. Calculate cycle time',
        '3. Measure throughput',
        '4. Calculate WIP levels',
        '5. Analyze flow efficiency',
        '6. Create cumulative flow diagram data',
        '7. Analyze arrival vs departure rates',
        '8. Calculate aging WIP',
        '9. Measure predictability',
        '10. Compile flow metrics'
      ],
      outputFormat: 'JSON object with flow metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics'],
      properties: {
        metrics: { type: 'object' },
        leadTime: { type: 'object' },
        cycleTime: { type: 'object' },
        throughput: { type: 'number' },
        flowEfficiency: { type: 'number' },
        cfdData: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'metrics', 'flow']
}));

export const sleDefinitionTask = defineTask('sle-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: SLE Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Service Level Manager',
      task: 'Define Service Level Expectations',
      context: {
        projectName: args.projectName,
        flowMetrics: args.flowMetrics,
        workflowStages: args.workflowStages
      },
      instructions: [
        '1. Analyze historical data',
        '2. Define SLE targets',
        '3. Set percentile thresholds',
        '4. Create work item classes',
        '5. Define class SLEs',
        '6. Set aging thresholds',
        '7. Define escalation triggers',
        '8. Create SLE monitoring plan',
        '9. Document exceptions',
        '10. Compile SLE definitions'
      ],
      outputFormat: 'JSON object with SLE definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['sles'],
      properties: {
        sles: { type: 'array' },
        workItemClasses: { type: 'array' },
        agingThresholds: { type: 'object' },
        escalationTriggers: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'sle', 'service']
}));

export const improvementTask = defineTask('improvement-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Improvement Opportunities - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Improvement Lead',
      task: 'Identify flow improvement opportunities',
      context: {
        projectName: args.projectName,
        bottlenecks: args.bottlenecks,
        wipOptimization: args.wipOptimization,
        flowMetrics: args.flowMetrics
      },
      instructions: [
        '1. Analyze bottleneck solutions',
        '2. Identify quick wins',
        '3. Recommend policy changes',
        '4. Suggest automation opportunities',
        '5. Identify skill development needs',
        '6. Recommend process changes',
        '7. Prioritize improvements',
        '8. Estimate impact',
        '9. Assess effort required',
        '10. Compile improvement list'
      ],
      outputFormat: 'JSON object with improvement opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        quickWins: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'improvement', 'kaizen']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create implementation plan for improvements',
      context: {
        projectName: args.projectName,
        improvements: args.improvements,
        wipOptimization: args.wipOptimization,
        sleDefinition: args.sleDefinition
      },
      instructions: [
        '1. Sequence improvements',
        '2. Create implementation timeline',
        '3. Assign responsibilities',
        '4. Define success criteria',
        '5. Plan rollout phases',
        '6. Define checkpoints',
        '7. Create rollback plan',
        '8. Plan communication',
        '9. Define training needs',
        '10. Compile implementation plan'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'array' },
        phases: { type: 'array' },
        successCriteria: { type: 'array' },
        rollbackPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'implementation', 'planning']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Dashboard Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Designer',
      task: 'Design Kanban metrics dashboard',
      context: {
        projectName: args.projectName,
        flowMetrics: args.flowMetrics,
        wipOptimization: args.wipOptimization,
        sleDefinition: args.sleDefinition
      },
      instructions: [
        '1. Define dashboard objectives',
        '2. Select key metrics',
        '3. Design CFD visualization',
        '4. Create lead time chart',
        '5. Design throughput chart',
        '6. Create aging WIP view',
        '7. Design SLE tracking',
        '8. Add WIP indicators',
        '9. Create alert system',
        '10. Compile dashboard design'
      ],
      outputFormat: 'JSON object with dashboard design'
    },
    outputSchema: {
      type: 'object',
      required: ['design'],
      properties: {
        design: { type: 'object' },
        charts: { type: 'array' },
        metrics: { type: 'array' },
        alerts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'dashboard', 'visualization']
}));

export const optimizationDocumentationTask = defineTask('optimization-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Optimization Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Document Kanban flow optimization',
      context: {
        projectName: args.projectName,
        currentState: args.currentState,
        bottlenecks: args.bottlenecks,
        wipOptimization: args.wipOptimization,
        flowMetrics: args.flowMetrics,
        sleDefinition: args.sleDefinition,
        improvements: args.improvements,
        implementationPlan: args.implementationPlan,
        dashboard: args.dashboard
      },
      instructions: [
        '1. Compile analysis summary',
        '2. Document findings',
        '3. Present recommendations',
        '4. Document new WIP limits',
        '5. Include SLE definitions',
        '6. Add implementation plan',
        '7. Generate markdown report',
        '8. Add visualizations',
        '9. Include appendices',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with optimization documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        summary: { type: 'string' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kanban', 'documentation', 'deliverable']
}));
