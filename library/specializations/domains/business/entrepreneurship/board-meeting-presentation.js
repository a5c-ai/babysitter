/**
 * @process specializations/domains/business/entrepreneurship/board-meeting-presentation
 * @description Board Meeting Presentation Process - Structured approach to preparing and delivering effective board meeting presentations for governance and strategic alignment.
 * @inputs { companyName: string, periodCovered: string, metrics: object, challenges?: array, strategicTopics?: array, decisions?: array }
 * @outputs { success: boolean, boardDeck: object, preReadMaterials: object, agenda: object, actionItems: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/board-meeting-presentation', {
 *   companyName: 'GrowthCo',
 *   periodCovered: 'Q4 2025',
 *   metrics: { revenue: 1200000, burn: 150000, headcount: 25 },
 *   strategicTopics: ['Series B timing', 'International expansion']
 * });
 *
 * @references
 * - First Round Review Board Meeting Guides: https://review.firstround.com/
 * - Board Meeting Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    periodCovered,
    metrics = {},
    challenges = [],
    strategicTopics = [],
    decisions = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Board Meeting Preparation for ${companyName} - ${periodCovered}`);

  // Phase 1: Operating Metrics Dashboard
  const metricsDashboard = await ctx.task(metricsDashboardTask, {
    companyName,
    periodCovered,
    metrics
  });

  artifacts.push(...(metricsDashboard.artifacts || []));

  // Phase 2: CEO Letter
  const ceoLetter = await ctx.task(ceoLetterTask, {
    companyName,
    periodCovered,
    metrics,
    challenges
  });

  artifacts.push(...(ceoLetter.artifacts || []));

  // Phase 3: Financial Summary
  const financialSummary = await ctx.task(financialSummaryTask, {
    companyName,
    periodCovered,
    metrics
  });

  artifacts.push(...(financialSummary.artifacts || []));

  // Phase 4: Strategic Discussion Materials
  const strategicMaterials = await ctx.task(strategicMaterialsTask, {
    companyName,
    strategicTopics,
    metrics
  });

  artifacts.push(...(strategicMaterials.artifacts || []));

  // Phase 5: Decision Items Preparation
  const decisionItems = await ctx.task(decisionItemsTask, {
    companyName,
    decisions,
    strategicTopics
  });

  artifacts.push(...(decisionItems.artifacts || []));

  // Breakpoint: Review board materials
  await ctx.breakpoint({
    question: `Review board materials for ${companyName} ${periodCovered}. ${strategicTopics.length} strategic topics, ${decisions.length} decision items. Ready for assembly?`,
    title: 'Board Materials Review',
    context: {
      runId: ctx.runId,
      companyName,
      period: periodCovered,
      files: artifacts
    }
  });

  // Phase 6: Agenda Development
  const agenda = await ctx.task(agendaTask, {
    companyName,
    metricsDashboard,
    strategicMaterials,
    decisionItems
  });

  artifacts.push(...(agenda.artifacts || []));

  // Phase 7: Pre-Read Materials
  const preReadMaterials = await ctx.task(preReadMaterialsTask, {
    companyName,
    ceoLetter,
    metricsDashboard,
    financialSummary,
    strategicMaterials
  });

  artifacts.push(...(preReadMaterials.artifacts || []));

  // Phase 8: Board Deck Assembly
  const boardDeck = await ctx.task(boardDeckAssemblyTask, {
    companyName,
    metricsDashboard,
    ceoLetter,
    financialSummary,
    strategicMaterials,
    decisionItems,
    agenda
  });

  artifacts.push(...(boardDeck.artifacts || []));

  // Phase 9: Action Item Tracker Setup
  const actionItemTracker = await ctx.task(actionItemTrackerTask, {
    companyName,
    decisionItems,
    strategicTopics
  });

  artifacts.push(...(actionItemTracker.artifacts || []));

  // Final Breakpoint: Board meeting ready
  await ctx.breakpoint({
    question: `Board meeting materials complete for ${companyName}. Deck: ${boardDeck.slideCount} slides. Pre-read sent? Ready for meeting?`,
    title: 'Board Meeting Preparation Complete',
    context: {
      runId: ctx.runId,
      companyName,
      slideCount: boardDeck.slideCount,
      agendaDuration: agenda.totalDuration,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    periodCovered,
    boardDeck: boardDeck,
    preReadMaterials: preReadMaterials,
    agenda: agenda,
    actionItems: actionItemTracker.items,
    ceoLetter: ceoLetter,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/board-meeting-presentation',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const metricsDashboardTask = defineTask('metrics-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operating Metrics Dashboard - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Metrics and Reporting Expert',
      task: 'Create comprehensive operating metrics dashboard for board',
      context: {
        companyName: args.companyName,
        periodCovered: args.periodCovered,
        metrics: args.metrics
      },
      instructions: [
        '1. Organize key performance indicators by category',
        '2. Show period-over-period comparisons',
        '3. Include targets vs. actuals',
        '4. Highlight metrics above/below plan',
        '5. Create visual dashboards for key metrics',
        '6. Show trend lines for critical metrics',
        '7. Include cohort analysis if applicable',
        '8. Add commentary on significant variances',
        '9. Include leading indicators',
        '10. Format for quick executive consumption'
      ],
      outputFormat: 'JSON object with metrics dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'periodComparison', 'highlights'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              target: { type: 'string' },
              variance: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        periodComparison: { type: 'object' },
        highlights: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        commentary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'metrics']
}));

export const ceoLetterTask = defineTask('ceo-letter', (args, taskCtx) => ({
  kind: 'agent',
  title: `CEO Letter - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CEO Communication Specialist',
      task: 'Draft CEO letter summarizing period performance',
      context: {
        companyName: args.companyName,
        periodCovered: args.periodCovered,
        metrics: args.metrics,
        challenges: args.challenges
      },
      instructions: [
        '1. Open with executive summary of period',
        '2. Highlight top wins and achievements',
        '3. Address key challenges honestly',
        '4. Summarize financial performance',
        '5. Update on strategic initiatives',
        '6. Discuss team and organizational updates',
        '7. Preview upcoming period priorities',
        '8. Include specific asks of the board',
        '9. Keep tone balanced and authentic',
        '10. Limit to 1-2 pages'
      ],
      outputFormat: 'JSON object with CEO letter'
    },
    outputSchema: {
      type: 'object',
      required: ['letter', 'executiveSummary', 'boardAsks'],
      properties: {
        letter: { type: 'string' },
        executiveSummary: { type: 'string' },
        wins: { type: 'array', items: { type: 'string' } },
        challenges: { type: 'array', items: { type: 'string' } },
        strategicUpdates: { type: 'array', items: { type: 'string' } },
        upcomingPriorities: { type: 'array', items: { type: 'string' } },
        boardAsks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'ceo-letter']
}));

export const financialSummaryTask = defineTask('financial-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financial Summary - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Finance Expert',
      task: 'Prepare financial summary and runway analysis for board',
      context: {
        companyName: args.companyName,
        periodCovered: args.periodCovered,
        metrics: args.metrics
      },
      instructions: [
        '1. Summarize income statement for period',
        '2. Show cash position and runway',
        '3. Compare budget vs. actuals',
        '4. Analyze burn rate trends',
        '5. Show key financial metrics (gross margin, CAC, LTV)',
        '6. Include revenue breakdown by segment',
        '7. Show path to break-even or next milestone',
        '8. Highlight financial risks',
        '9. Include fundraising update if relevant',
        '10. Present scenarios for different outcomes'
      ],
      outputFormat: 'JSON object with financial summary'
    },
    outputSchema: {
      type: 'object',
      required: ['incomeStatement', 'cashPosition', 'runway'],
      properties: {
        incomeStatement: { type: 'object' },
        cashPosition: { type: 'string' },
        runway: { type: 'string' },
        burnRate: { type: 'object' },
        budgetVsActual: { type: 'object' },
        financialMetrics: { type: 'array', items: { type: 'object' } },
        revenueBreakdown: { type: 'object' },
        financialRisks: { type: 'array', items: { type: 'string' } },
        scenarios: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'financials']
}));

export const strategicMaterialsTask = defineTask('strategic-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Discussion Materials - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategy Consultant',
      task: 'Prepare strategic discussion materials for board topics',
      context: {
        companyName: args.companyName,
        strategicTopics: args.strategicTopics,
        metrics: args.metrics
      },
      instructions: [
        '1. Create discussion framework for each topic',
        '2. Present options with pros and cons',
        '3. Include relevant data and analysis',
        '4. Frame key questions for board input',
        '5. Provide management recommendation',
        '6. Show implications of different paths',
        '7. Include external context and benchmarks',
        '8. Design for productive discussion',
        '9. Allocate appropriate time per topic',
        '10. Prepare backup materials for deep dives'
      ],
      outputFormat: 'JSON object with strategic materials'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'discussionFrameworks'],
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              context: { type: 'string' },
              options: { type: 'array', items: { type: 'object' } },
              recommendation: { type: 'string' },
              keyQuestions: { type: 'array', items: { type: 'string' } },
              timeAllocation: { type: 'string' }
            }
          }
        },
        discussionFrameworks: { type: 'array', items: { type: 'object' } },
        externalContext: { type: 'object' },
        backupMaterials: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'strategy']
}));

export const decisionItemsTask = defineTask('decision-items', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Items Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Corporate Governance Specialist',
      task: 'Prepare decision items requiring board approval',
      context: {
        companyName: args.companyName,
        decisions: args.decisions,
        strategicTopics: args.strategicTopics
      },
      instructions: [
        '1. List all items requiring board approval',
        '2. Provide context and background for each',
        '3. Present management recommendation',
        '4. Include supporting documentation',
        '5. Draft resolution language',
        '6. Identify any consent items',
        '7. Flag items needing discussion vs. vote',
        '8. Include any legal or compliance considerations',
        '9. Prepare for potential board questions',
        '10. Organize by priority and dependencies'
      ],
      outputFormat: 'JSON object with decision items'
    },
    outputSchema: {
      type: 'object',
      required: ['decisions', 'consentItems'],
      properties: {
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              type: { type: 'string' },
              context: { type: 'string' },
              recommendation: { type: 'string' },
              resolutionDraft: { type: 'string' },
              documentation: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        consentItems: { type: 'array', items: { type: 'object' } },
        discussionItems: { type: 'array', items: { type: 'object' } },
        legalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'decisions']
}));

export const agendaTask = defineTask('agenda', (args, taskCtx) => ({
  kind: 'agent',
  title: `Agenda Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Board Meeting Facilitator',
      task: 'Create structured board meeting agenda',
      context: {
        companyName: args.companyName,
        metricsDashboard: args.metricsDashboard,
        strategicMaterials: args.strategicMaterials,
        decisionItems: args.decisionItems
      },
      instructions: [
        '1. Structure agenda with clear time allocations',
        '2. Start with consent items and approvals',
        '3. Allocate time for CEO update and metrics review',
        '4. Schedule strategic discussions for peak energy',
        '5. Include break if meeting exceeds 2 hours',
        '6. Reserve time for board member input',
        '7. End with action items and next steps',
        '8. Note pre-read requirements for each section',
        '9. Include dial-in/video details',
        '10. Plan for executive session if needed'
      ],
      outputFormat: 'JSON object with meeting agenda'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'totalDuration'],
      properties: {
        agenda: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              duration: { type: 'number' },
              presenter: { type: 'string' },
              type: { type: 'string' },
              preReadRequired: { type: 'boolean' }
            }
          }
        },
        totalDuration: { type: 'number' },
        meetingDetails: { type: 'object' },
        executiveSession: { type: 'boolean' },
        preReadInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'agenda']
}));

export const preReadMaterialsTask = defineTask('pre-read-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Read Materials - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Board Communication Specialist',
      task: 'Compile and organize pre-read materials for board',
      context: {
        companyName: args.companyName,
        ceoLetter: args.ceoLetter,
        metricsDashboard: args.metricsDashboard,
        financialSummary: args.financialSummary,
        strategicMaterials: args.strategicMaterials
      },
      instructions: [
        '1. Organize materials by agenda topic',
        '2. Include table of contents',
        '3. Add executive summary cover page',
        '4. Ensure consistent formatting',
        '5. Add page numbers and headers',
        '6. Include appendices for detailed data',
        '7. Note items requiring careful review',
        '8. Set distribution timeline',
        '9. Include confidentiality notice',
        '10. Plan for questions/clarifications channel'
      ],
      outputFormat: 'JSON object with pre-read materials'
    },
    outputSchema: {
      type: 'object',
      required: ['packageContents', 'distributionPlan'],
      properties: {
        packageContents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              pages: { type: 'number' },
              reviewPriority: { type: 'string' }
            }
          }
        },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'object' } },
        distributionPlan: {
          type: 'object',
          properties: {
            sendDate: { type: 'string' },
            method: { type: 'string' },
            followUp: { type: 'string' }
          }
        },
        confidentialityNotice: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'pre-read']
}));

export const boardDeckAssemblyTask = defineTask('board-deck-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Board Deck Assembly - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Board Presentation Designer',
      task: 'Assemble complete board deck with all materials',
      context: {
        companyName: args.companyName,
        metricsDashboard: args.metricsDashboard,
        ceoLetter: args.ceoLetter,
        financialSummary: args.financialSummary,
        strategicMaterials: args.strategicMaterials,
        decisionItems: args.decisionItems,
        agenda: args.agenda
      },
      instructions: [
        '1. Create title slide with meeting date',
        '2. Include agenda overview slide',
        '3. Organize slides by agenda section',
        '4. Ensure visual consistency',
        '5. Add section dividers',
        '6. Include speaker notes',
        '7. Add backup/appendix slides',
        '8. Number all slides',
        '9. Add confidentiality footer',
        '10. Create PDF version for distribution'
      ],
      outputFormat: 'JSON object with board deck'
    },
    outputSchema: {
      type: 'object',
      required: ['slides', 'slideCount'],
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              section: { type: 'string' },
              title: { type: 'string' },
              speakerNotes: { type: 'string' }
            }
          }
        },
        slideCount: { type: 'number' },
        sections: { type: 'array', items: { type: 'string' } },
        appendixSlides: { type: 'array', items: { type: 'object' } },
        designTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'deck']
}));

export const actionItemTrackerTask = defineTask('action-item-tracker', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Item Tracker - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Management Specialist',
      task: 'Set up action item tracking for board meeting',
      context: {
        companyName: args.companyName,
        decisionItems: args.decisionItems,
        strategicTopics: args.strategicTopics
      },
      instructions: [
        '1. Create action item template',
        '2. Pre-populate known action items',
        '3. Include owner and due date fields',
        '4. Link to board decisions',
        '5. Set up status tracking',
        '6. Plan follow-up communication',
        '7. Include carryover items from previous meetings',
        '8. Define escalation process',
        '9. Create reporting format',
        '10. Plan for inter-meeting updates'
      ],
      outputFormat: 'JSON object with action item tracker'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'trackingTemplate'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              status: { type: 'string' },
              relatedDecision: { type: 'string' }
            }
          }
        },
        carryoverItems: { type: 'array', items: { type: 'object' } },
        trackingTemplate: { type: 'object' },
        followUpSchedule: { type: 'object' },
        reportingFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'board-meeting', 'action-items']
}));
