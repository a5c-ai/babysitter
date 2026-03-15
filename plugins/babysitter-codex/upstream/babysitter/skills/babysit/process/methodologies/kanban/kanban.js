/**
 * @process methodologies/kanban
 * @description Kanban - Visual flow management with WIP limits and continuous improvement
 * @inputs { projectName: string, workflowStages: array, defaultWipLimits: object, initialBacklog: array, cycles?: number }
 * @outputs { success: boolean, board: object, metrics: object, improvements: array, finalState: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Kanban Process
 *
 * Adapted from Toyota Production System by David J. Anderson (2007)
 *
 * Kanban is a visual workflow management method for defining, managing, and improving
 * services that deliver knowledge work. It emphasizes visualizing work, limiting
 * work-in-progress (WIP), managing flow, and continuous improvement. Unlike sprint-based
 * approaches, Kanban is continuous flow.
 *
 * Key Principles:
 * - Visualize workflow: Kanban board with columns representing stages
 * - Limit WIP: Explicit limits on work items per stage
 * - Manage flow: Focus on smooth, predictable flow
 * - Make policies explicit: Clear rules for moving work
 * - Feedback loops: Regular reviews (daily standups, replenishment meetings, retrospectives)
 * - Improve collaboratively: Evolve process experimentally
 * - Pull system: Work pulled when capacity available, not pushed
 *
 * Six Core Practices:
 * 1. Visualize the workflow
 * 2. Limit work in progress
 * 3. Manage flow
 * 4. Make process policies explicit
 * 5. Implement feedback loops
 * 6. Improve collaboratively, evolve experimentally
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project or service
 * @param {Array<Object>} inputs.workflowStages - Stages in the workflow (e.g., Backlog, Ready, In Progress, Review, Done)
 * @param {Object} inputs.defaultWipLimits - Default WIP limits per stage
 * @param {Array<Object>} inputs.initialBacklog - Initial work items to process
 * @param {number} inputs.cycles - Number of flow cycles to run (default: 5)
 * @param {Object} inputs.teamCapacity - Team capacity information
 * @param {Array<string>} inputs.serviceClasses - Service classes for prioritization (Expedite, Standard, Fixed Date, Intangible)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with board state, metrics, and improvements
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    workflowStages = [
      { name: 'Backlog', type: 'queue' },
      { name: 'Ready', type: 'queue' },
      { name: 'Analysis', type: 'active' },
      { name: 'Development', type: 'active' },
      { name: 'Review', type: 'active' },
      { name: 'Done', type: 'complete' }
    ],
    defaultWipLimits = {
      'Analysis': 3,
      'Development': 5,
      'Review': 2
    },
    initialBacklog = [],
    cycles = 5,
    teamCapacity = { developers: 5, reviewers: 2, analysts: 2 },
    serviceClasses = ['Expedite', 'Standard', 'Fixed Date', 'Intangible']
  } = inputs;

  // ============================================================================
  // STEP 1: VISUALIZE WORKFLOW & INITIALIZE BOARD
  // ============================================================================

  const boardVisualizationResult = await ctx.task(boardVisualizationTask, {
    projectName,
    workflowStages,
    defaultWipLimits,
    initialBacklog,
    teamCapacity,
    serviceClasses
  });

  // Breakpoint: Review initial board setup
  await ctx.breakpoint({
    question: `Review Kanban board setup for "${projectName}". ${workflowStages.length} stages configured with WIP limits. ${initialBacklog.length} items in backlog. Approve to start flow?`,
    title: 'Kanban Board Initialization',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/kanban/board-setup.md', format: 'markdown', label: 'Board Configuration' },
        { path: 'artifacts/kanban/board-setup.json', format: 'code', language: 'json', label: 'Board Data' },
        { path: 'artifacts/kanban/board-initial.svg', format: 'image', label: 'Initial Board' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: FLOW MANAGEMENT CYCLES
  // ============================================================================

  const flowCycles = [];
  let currentBoard = boardVisualizationResult.board;
  let cumulativeMetrics = {
    totalCompleted: 0,
    totalCycleTime: 0,
    totalLeadTime: 0,
    bottlenecks: [],
    blockedItems: []
  };

  for (let cycleIdx = 0; cycleIdx < cycles; cycleIdx++) {
    const cycleData = {
      cycleNumber: cycleIdx + 1,
      startDate: ctx.now()
    };

    // ============================================================================
    // MANAGE WIP LIMITS
    // ============================================================================

    const wipManagementResult = await ctx.task(wipLimitManagementTask, {
      projectName,
      board: currentBoard,
      wipLimits: defaultWipLimits,
      cycleNumber: cycleIdx + 1
    });

    // ============================================================================
    // PULL SYSTEM - Move work through stages
    // ============================================================================

    const pullSystemResult = await ctx.task(pullSystemTask, {
      projectName,
      board: currentBoard,
      wipLimits: defaultWipLimits,
      wipStatus: wipManagementResult,
      cycleNumber: cycleIdx + 1
    });

    currentBoard = pullSystemResult.updatedBoard;

    // ============================================================================
    // TRACK FLOW METRICS
    // ============================================================================

    const flowMetricsResult = await ctx.task(flowMetricsTask, {
      projectName,
      board: currentBoard,
      cycleNumber: cycleIdx + 1,
      previousMetrics: cumulativeMetrics
    });

    // Update cumulative metrics
    cumulativeMetrics = flowMetricsResult.cumulativeMetrics;

    cycleData.wipManagement = wipManagementResult;
    cycleData.pullSystem = pullSystemResult;
    cycleData.metrics = flowMetricsResult;
    cycleData.endDate = ctx.now();

    flowCycles.push(cycleData);

    // Cycle checkpoint
    await ctx.breakpoint({
      question: `Cycle ${cycleIdx + 1} complete. ${flowMetricsResult.cycleMetrics.itemsCompleted} items completed. Average cycle time: ${flowMetricsResult.cycleMetrics.avgCycleTime} days. ${wipManagementResult.bottlenecks.length} bottlenecks detected. Continue?`,
      title: `Flow Cycle ${cycleIdx + 1} Complete`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/kanban/cycle-${cycleIdx + 1}-summary.md`, format: 'markdown', label: 'Cycle Summary' },
          { path: `artifacts/kanban/board-cycle-${cycleIdx + 1}.svg`, format: 'image', label: 'Board State' },
          { path: `artifacts/kanban/metrics-cycle-${cycleIdx + 1}.json`, format: 'code', language: 'json', label: 'Metrics' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 3: REPLENISHMENT MEETING
  // ============================================================================

  const replenishmentResult = await ctx.task(replenishmentMeetingTask, {
    projectName,
    board: currentBoard,
    metrics: cumulativeMetrics,
    teamCapacity
  });

  // Breakpoint: Review replenishment decisions
  await ctx.breakpoint({
    question: `Replenishment meeting complete. ${replenishmentResult.itemsAddedToReady} items prioritized and moved to Ready. Review backlog priorities and commitments?`,
    title: 'Replenishment Meeting',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/kanban/replenishment.md', format: 'markdown', label: 'Replenishment Report' },
        { path: 'artifacts/kanban/backlog-prioritization.json', format: 'code', language: 'json', label: 'Priorities' }
      ]
    }
  });

  // ============================================================================
  // STEP 4: RETROSPECTIVE & CONTINUOUS IMPROVEMENT
  // ============================================================================

  const retrospectiveResult = await ctx.task(retrospectiveTask, {
    projectName,
    flowCycles,
    board: currentBoard,
    metrics: cumulativeMetrics,
    wipLimits: defaultWipLimits
  });

  // Breakpoint: Review improvements
  await ctx.breakpoint({
    question: `Retrospective complete. ${retrospectiveResult.experiments.length} improvement experiments proposed. Review metrics and process changes?`,
    title: 'Retrospective & Continuous Improvement',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/kanban/retrospective.md', format: 'markdown', label: 'Retrospective Report' },
        { path: 'artifacts/kanban/improvement-experiments.json', format: 'code', language: 'json', label: 'Experiments' },
        { path: 'artifacts/kanban/cumulative-flow-diagram.svg', format: 'image', label: 'CFD' }
      ]
    }
  });

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const averageCycleTime = cumulativeMetrics.totalCompleted > 0
    ? cumulativeMetrics.totalCycleTime / cumulativeMetrics.totalCompleted
    : 0;

  const averageLeadTime = cumulativeMetrics.totalCompleted > 0
    ? cumulativeMetrics.totalLeadTime / cumulativeMetrics.totalCompleted
    : 0;

  const throughput = cumulativeMetrics.totalCompleted / cycles;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Kanban process complete for "${projectName}". ${cumulativeMetrics.totalCompleted} items delivered across ${cycles} cycles. Avg cycle time: ${averageCycleTime.toFixed(1)} days. Throughput: ${throughput.toFixed(1)} items/cycle. Review final state?`,
    title: 'Kanban Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/kanban/board-setup.md', format: 'markdown', label: 'Board Setup' },
        { path: 'artifacts/kanban/final-board.svg', format: 'image', label: 'Final Board State' },
        { path: 'artifacts/kanban/metrics-summary.md', format: 'markdown', label: 'Metrics Summary' },
        { path: 'artifacts/kanban/retrospective.md', format: 'markdown', label: 'Improvements' },
        { path: 'artifacts/kanban/cumulative-flow-diagram.svg', format: 'image', label: 'Cumulative Flow' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    board: {
      initial: boardVisualizationResult.board,
      final: currentBoard,
      stages: workflowStages,
      wipLimits: retrospectiveResult.updatedWipLimits || defaultWipLimits
    },
    flowCycles,
    metrics: {
      totalCycles: cycles,
      itemsCompleted: cumulativeMetrics.totalCompleted,
      averageCycleTime,
      averageLeadTime,
      throughput,
      bottlenecks: cumulativeMetrics.bottlenecks,
      blockedItems: cumulativeMetrics.blockedItems
    },
    replenishment: replenishmentResult,
    retrospective: retrospectiveResult,
    improvements: retrospectiveResult.experiments,
    artifacts: {
      boardSetup: 'artifacts/kanban/board-setup.md',
      finalBoard: 'artifacts/kanban/final-board.svg',
      metricsSummary: 'artifacts/kanban/metrics-summary.md',
      retrospective: 'artifacts/kanban/retrospective.md',
      cumulativeFlowDiagram: 'artifacts/kanban/cumulative-flow-diagram.svg'
    },
    metadata: {
      processId: 'methodologies/kanban',
      timestamp: ctx.now(),
      teamCapacity,
      serviceClasses
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Board Visualization - Setup Kanban board with workflow stages and WIP limits
 */
export const boardVisualizationTask = defineTask('board-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Initialize Kanban Board: ${args.projectName}`,
  description: 'Setup Kanban board with workflow stages, WIP limits, and initial backlog',

  agent: {
    name: 'kanban-board-designer',
    prompt: {
      role: 'Kanban coach and workflow design expert',
      task: 'Initialize Kanban board with clear workflow visualization',
      context: {
        projectName: args.projectName,
        workflowStages: args.workflowStages,
        defaultWipLimits: args.defaultWipLimits,
        initialBacklog: args.initialBacklog,
        teamCapacity: args.teamCapacity,
        serviceClasses: args.serviceClasses
      },
      instructions: [
        'Design Kanban board layout with all workflow stages',
        'Define clear column structure (queue vs active stages)',
        'Set WIP limits for active stages (not for queue or done)',
        'Establish board policies (Definition of Ready, Definition of Done)',
        'Configure swimlanes if needed (by service class, team, etc.)',
        'Define card structure (what information to display)',
        'Set up initial backlog with prioritization',
        'Make workflow policies explicit and visible',
        'Create visual board representation',
        'Document pull triggers for each stage'
      ],
      outputFormat: 'JSON with board structure, policies, WIP limits, and initial state'
    },
    outputSchema: {
      type: 'object',
      required: ['board', 'policies', 'wipLimits'],
      properties: {
        board: {
          type: 'object',
          properties: {
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  wipLimit: { type: 'number' },
                  items: { type: 'array', items: { type: 'object' } },
                  policies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            swimlanes: { type: 'array', items: { type: 'string' } }
          }
        },
        policies: {
          type: 'object',
          properties: {
            definitionOfReady: { type: 'array', items: { type: 'string' } },
            definitionOfDone: { type: 'array', items: { type: 'string' } },
            pullTriggers: { type: 'object' },
            blockingPolicy: { type: 'string' }
          }
        },
        wipLimits: { type: 'object' },
        cardStructure: {
          type: 'object',
          properties: {
            fields: { type: 'array', items: { type: 'string' } },
            visualIndicators: { type: 'array', items: { type: 'string' } }
          }
        },
        boardVisualization: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/kanban/board-setup.md', format: 'markdown' },
      { path: 'artifacts/kanban/board-setup.json', format: 'json' },
      { path: 'artifacts/kanban/board-initial.svg', format: 'image' }
    ]
  },

  labels: ['agent', 'kanban', 'board-setup', 'visualization']
}));

/**
 * WIP Limit Management - Monitor and enforce WIP limits
 */
export const wipLimitManagementTask = defineTask('wip-limit-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `WIP Limit Check: Cycle ${args.cycleNumber}`,
  description: 'Monitor WIP limits, identify bottlenecks, and signal pull availability',

  agent: {
    name: 'wip-manager',
    prompt: {
      role: 'Kanban flow manager and bottleneck analyst',
      task: 'Analyze WIP across all stages and identify flow issues',
      context: {
        projectName: args.projectName,
        board: args.board,
        wipLimits: args.wipLimits,
        cycleNumber: args.cycleNumber
      },
      instructions: [
        'Count current WIP in each active stage',
        'Compare against WIP limits',
        'Identify stages at or over limit',
        'Detect bottlenecks (stages consistently full)',
        'Identify stages with capacity (WIP < limit)',
        'Analyze blocked items and aging work',
        'Calculate wait times per stage',
        'Signal which stages can pull new work',
        'Recommend WIP limit adjustments if needed',
        'Flag expedite items that may exceed limits'
      ],
      outputFormat: 'JSON with WIP status, bottlenecks, capacity signals, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['wipStatus', 'bottlenecks', 'capacitySignals'],
      properties: {
        wipStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              currentWip: { type: 'number' },
              wipLimit: { type: 'number' },
              utilization: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        capacitySignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              availableCapacity: { type: 'number' },
              canPull: { type: 'boolean' }
            }
          }
        },
        blockedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              blockedDays: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        wipLimitRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/kanban/wip-status-cycle-${args.cycleNumber}.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'kanban', 'wip-management', `cycle-${args.cycleNumber}`]
}));

/**
 * Pull System - Implement pull mechanism to move work through stages
 */
export const pullSystemTask = defineTask('pull-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pull Work: Cycle ${args.cycleNumber}`,
  description: 'Pull work items through workflow based on capacity and priorities',

  agent: {
    name: 'pull-coordinator',
    prompt: {
      role: 'Kanban pull system coordinator',
      task: 'Move work items through workflow using pull mechanisms',
      context: {
        projectName: args.projectName,
        board: args.board,
        wipLimits: args.wipLimits,
        wipStatus: args.wipStatus,
        cycleNumber: args.cycleNumber
      },
      instructions: [
        'Start from downstream (rightmost active stage)',
        'For each stage with capacity (WIP < limit):',
        '  - Pull highest priority item from upstream stage',
        '  - Respect dependencies and blocking issues',
        '  - Honor service class priorities (Expedite > Fixed Date > Standard > Intangible)',
        '  - Check Definition of Ready before pulling',
        'Move completed items from Review to Done',
        'Pull items from Ready to first active stage',
        'Track which items moved and why',
        'Record any items that could not be pulled (and reasons)',
        'Update item timestamps for cycle time tracking',
        'Flag any items aging beyond thresholds'
      ],
      outputFormat: 'JSON with updated board state, moves made, and flow report'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedBoard', 'moves', 'flowReport'],
      properties: {
        updatedBoard: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'object' } }
          }
        },
        moves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              itemTitle: { type: 'string' },
              fromStage: { type: 'string' },
              toStage: { type: 'string' },
              reason: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        flowReport: {
          type: 'object',
          properties: {
            itemsMoved: { type: 'number' },
            itemsCompleted: { type: 'number' },
            itemsBlocked: { type: 'number' },
            averageTimeInStages: { type: 'object' }
          }
        },
        itemsNotPulled: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/kanban/pull-report-cycle-${args.cycleNumber}.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'kanban', 'pull-system', `cycle-${args.cycleNumber}`]
}));

/**
 * Flow Metrics - Track cycle time, lead time, throughput, and cumulative flow
 */
export const flowMetricsTask = defineTask('flow-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flow Metrics: Cycle ${args.cycleNumber}`,
  description: 'Calculate flow metrics including cycle time, lead time, and throughput',

  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'Kanban metrics and analytics expert',
      task: 'Calculate and analyze flow metrics',
      context: {
        projectName: args.projectName,
        board: args.board,
        cycleNumber: args.cycleNumber,
        previousMetrics: args.previousMetrics
      },
      instructions: [
        'Calculate cycle time for completed items (time from start to done)',
        'Calculate lead time for completed items (time from request to delivery)',
        'Measure throughput (items completed in this cycle)',
        'Track WIP over time for cumulative flow diagram',
        'Identify aging work items (in progress > threshold)',
        'Calculate percentile distribution (50th, 85th, 95th) for cycle time',
        'Measure flow efficiency (value-adding time / total time)',
        'Identify trends (improving or degrading)',
        'Update cumulative metrics',
        'Generate cumulative flow diagram data'
      ],
      outputFormat: 'JSON with cycle metrics, cumulative metrics, and CFD data'
    },
    outputSchema: {
      type: 'object',
      required: ['cycleMetrics', 'cumulativeMetrics', 'cfdData'],
      properties: {
        cycleMetrics: {
          type: 'object',
          properties: {
            itemsCompleted: { type: 'number' },
            avgCycleTime: { type: 'number' },
            avgLeadTime: { type: 'number' },
            throughput: { type: 'number' },
            cycleTimePercentiles: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p85: { type: 'number' },
                p95: { type: 'number' }
              }
            },
            flowEfficiency: { type: 'number' }
          }
        },
        cumulativeMetrics: {
          type: 'object',
          properties: {
            totalCompleted: { type: 'number' },
            totalCycleTime: { type: 'number' },
            totalLeadTime: { type: 'number' },
            bottlenecks: { type: 'array', items: { type: 'object' } },
            blockedItems: { type: 'array', items: { type: 'object' } }
          }
        },
        cfdData: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            wipByStage: { type: 'object' }
          }
        },
        agingItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              daysInProgress: { type: 'number' },
              currentStage: { type: 'string' }
            }
          }
        },
        trends: {
          type: 'object',
          properties: {
            cycleTimeTrend: { type: 'string' },
            throughputTrend: { type: 'string' },
            flowEfficiencyTrend: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/kanban/metrics-cycle-${args.cycleNumber}.json`, format: 'json' },
      { path: `artifacts/kanban/metrics-cycle-${args.cycleNumber}.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'kanban', 'metrics', `cycle-${args.cycleNumber}`]
}));

/**
 * Replenishment Meeting - Prioritize backlog and commit to new work
 */
export const replenishmentMeetingTask = defineTask('replenishment-meeting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Replenishment Meeting: ${args.projectName}`,
  description: 'Review backlog, prioritize items, and pull into Ready queue based on capacity',

  agent: {
    name: 'product-owner',
    prompt: {
      role: 'Product owner and prioritization expert',
      task: 'Conduct replenishment meeting to prioritize and commit to work',
      context: {
        projectName: args.projectName,
        board: args.board,
        metrics: args.metrics,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        'Review current backlog items',
        'Consider system metrics (throughput, cycle time)',
        'Apply prioritization frameworks (WSJF, CoD, urgency, value)',
        'Assign service classes (Expedite, Standard, Fixed Date, Intangible)',
        'Calculate how many items team can handle (based on throughput)',
        'Move high-priority items to Ready queue (capacity-based commitment)',
        'Ensure items meet Definition of Ready',
        'Balance different types of work (features, bugs, tech debt)',
        'Consider dependencies and sequencing',
        'Document prioritization decisions and rationale'
      ],
      outputFormat: 'JSON with prioritization decisions, items moved to Ready, and commitments'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedBacklog', 'itemsAddedToReady', 'commitment'],
      properties: {
        prioritizedBacklog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'number' },
              serviceClass: { type: 'string' },
              estimatedSize: { type: 'string' },
              value: { type: 'number' },
              urgency: { type: 'number' }
            }
          }
        },
        itemsAddedToReady: { type: 'number' },
        commitment: {
          type: 'object',
          properties: {
            committedItems: { type: 'array', items: { type: 'string' } },
            expectedThroughput: { type: 'number' },
            basedOnMetrics: { type: 'object' }
          }
        },
        prioritizationRationale: { type: 'string' },
        balancingDecisions: {
          type: 'object',
          properties: {
            features: { type: 'number' },
            bugs: { type: 'number' },
            techDebt: { type: 'number' },
            other: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/kanban/replenishment.md', format: 'markdown' },
      { path: 'artifacts/kanban/backlog-prioritization.json', format: 'json' }
    ]
  },

  labels: ['agent', 'kanban', 'replenishment', 'prioritization']
}));

/**
 * Retrospective - Review metrics, identify impediments, propose improvements
 */
export const retrospectiveTask = defineTask('retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban Retrospective: ${args.projectName}`,
  description: 'Review flow metrics, identify improvement opportunities, and design experiments',

  agent: {
    name: 'kanban-coach',
    prompt: {
      role: 'Kanban coach and continuous improvement facilitator',
      task: 'Facilitate retrospective and design improvement experiments',
      context: {
        projectName: args.projectName,
        flowCycles: args.flowCycles,
        board: args.board,
        metrics: args.metrics,
        wipLimits: args.wipLimits
      },
      instructions: [
        'Review cumulative flow diagram and identify patterns',
        'Analyze cycle time trends (improving or degrading)',
        'Identify persistent bottlenecks',
        'Review blocked items and impediments',
        'Assess WIP limit effectiveness',
        'Evaluate flow efficiency',
        'Identify process policies that need clarification',
        'Propose experiments for improvement (small, testable changes)',
        'Suggest WIP limit adjustments based on data',
        'Identify upstream/downstream dependencies to address',
        'Recommend process policy updates',
        'Design experiments with hypothesis, measurement, and success criteria'
      ],
      outputFormat: 'JSON with insights, impediments, experiments, and policy recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'impediments', 'experiments'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              observation: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        impediments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              impact: { type: 'string' },
              frequency: { type: 'string' },
              suggestedAction: { type: 'string' }
            }
          }
        },
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              hypothesis: { type: 'string' },
              change: { type: 'string' },
              measurement: { type: 'string' },
              successCriteria: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        updatedWipLimits: { type: 'object' },
        policyRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policy: { type: 'string' },
              currentState: { type: 'string' },
              proposedChange: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        cumulativeFlowDiagram: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/kanban/retrospective.md', format: 'markdown' },
      { path: 'artifacts/kanban/improvement-experiments.json', format: 'json' },
      { path: 'artifacts/kanban/cumulative-flow-diagram.svg', format: 'image' }
    ]
  },

  labels: ['agent', 'kanban', 'retrospective', 'continuous-improvement']
}));
