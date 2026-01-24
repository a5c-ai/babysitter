/**
 * @process business-strategy/annual-strategic-planning
 * @description End-to-end facilitation of the annual strategic planning process from environmental analysis through initiative prioritization and resource allocation
 * @inputs { organizationContext: object, planningYear: number, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, strategicPlan: object, initiatives: array, resourceAllocation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    planningYear = new Date().getFullYear() + 1,
    stakeholders = [],
    outputDir = 'strategic-plan-output',
    planningHorizon = '3 years'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Annual Strategic Planning Process for ${planningYear}`);

  // ============================================================================
  // PHASE 1: STRATEGIC CONTEXT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing strategic context');
  const strategicContext = await ctx.task(strategicContextTask, {
    organizationContext,
    planningYear,
    outputDir
  });

  artifacts.push(...strategicContext.artifacts);

  // ============================================================================
  // PHASE 2: ENVIRONMENTAL SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting environmental scan');
  const environmentalScan = await ctx.task(environmentalScanTask, {
    organizationContext,
    planningHorizon,
    outputDir
  });

  artifacts.push(...environmentalScan.artifacts);

  // ============================================================================
  // PHASE 3: PERFORMANCE REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Reviewing past performance');
  const performanceReview = await ctx.task(performanceReviewTask, {
    organizationContext,
    outputDir
  });

  artifacts.push(...performanceReview.artifacts);

  // ============================================================================
  // PHASE 4: STRATEGIC INTENT AND VISION REFRESH
  // ============================================================================

  ctx.log('info', 'Phase 4: Refreshing strategic intent and vision');
  const strategicIntent = await ctx.task(strategicIntentTask, {
    organizationContext,
    environmentalScan,
    performanceReview,
    planningHorizon,
    outputDir
  });

  artifacts.push(...strategicIntent.artifacts);

  // Breakpoint: Review strategic foundation
  await ctx.breakpoint({
    question: `Strategic foundation complete. Vision: "${strategicIntent.vision}". Review before objective setting?`,
    title: 'Strategic Planning - Foundation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        keyOpportunities: environmentalScan.opportunities.length,
        keyThreats: environmentalScan.threats.length,
        performanceGaps: performanceReview.gaps.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: STRATEGIC OBJECTIVES SETTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting strategic objectives');
  const strategicObjectives = await ctx.task(strategicObjectivesTask, {
    strategicIntent,
    environmentalScan,
    performanceReview,
    planningYear,
    outputDir
  });

  artifacts.push(...strategicObjectives.artifacts);

  // ============================================================================
  // PHASE 6: STRATEGIC OPTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing strategic options');
  const strategicOptions = await ctx.task(strategicOptionsTask, {
    strategicObjectives: strategicObjectives.objectives,
    environmentalScan,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicOptions.artifacts);

  // ============================================================================
  // PHASE 7: STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Selecting strategies');
  const strategySelection = await ctx.task(strategySelectionTask, {
    strategicOptions: strategicOptions.options,
    strategicObjectives: strategicObjectives.objectives,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategySelection.artifacts);

  // ============================================================================
  // PHASE 8: INITIATIVE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying strategic initiatives');
  const initiativeIdentification = await ctx.task(initiativeIdentificationTask, {
    selectedStrategies: strategySelection.selectedStrategies,
    strategicObjectives: strategicObjectives.objectives,
    planningYear,
    outputDir
  });

  artifacts.push(...initiativeIdentification.artifacts);

  // ============================================================================
  // PHASE 9: INITIATIVE PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Prioritizing initiatives');
  const initiativePrioritization = await ctx.task(initiativePrioritizationTask, {
    initiatives: initiativeIdentification.initiatives,
    strategicObjectives: strategicObjectives.objectives,
    organizationContext,
    outputDir
  });

  artifacts.push(...initiativePrioritization.artifacts);

  // ============================================================================
  // PHASE 10: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Allocating resources');
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    prioritizedInitiatives: initiativePrioritization.prioritizedInitiatives,
    organizationContext,
    planningYear,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 11: GOVERNANCE AND MONITORING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 11: Establishing governance framework');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    strategicObjectives: strategicObjectives.objectives,
    initiatives: initiativePrioritization.prioritizedInitiatives,
    stakeholders,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 12: GENERATE STRATEGIC PLAN DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating strategic plan document');
  const strategicPlanDocument = await ctx.task(strategicPlanDocumentTask, {
    strategicContext,
    environmentalScan,
    performanceReview,
    strategicIntent,
    strategicObjectives,
    strategySelection,
    initiativePrioritization,
    resourceAllocation,
    governanceFramework,
    planningYear,
    planningHorizon,
    outputDir
  });

  artifacts.push(...strategicPlanDocument.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategicPlan: {
      vision: strategicIntent.vision,
      mission: strategicIntent.mission,
      objectives: strategicObjectives.objectives,
      strategies: strategySelection.selectedStrategies
    },
    initiatives: initiativePrioritization.prioritizedInitiatives,
    resourceAllocation: resourceAllocation.allocation,
    governance: governanceFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/annual-strategic-planning',
      timestamp: startTime,
      planningYear,
      planningHorizon
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Strategic Context Assessment
export const strategicContextTask = defineTask('strategic-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic context',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'senior strategy analyst',
      task: 'Assess the strategic context for the planning cycle',
      context: args,
      instructions: [
        'Review current strategic position:',
        '  - Current mission, vision, values',
        '  - Existing strategic objectives',
        '  - Active strategic initiatives',
        '  - Key performance indicators',
        'Assess strategic health:',
        '  - Strategy execution progress',
        '  - Strategic alignment',
        '  - Stakeholder expectations',
        'Identify key strategic questions',
        'Save context assessment to output directory'
      ],
      outputFormat: 'JSON with currentPosition (object), strategicHealth (object), keyQuestions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentPosition', 'artifacts'],
      properties: {
        currentPosition: { type: 'object' },
        strategicHealth: { type: 'object' },
        keyQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'context']
}));

// Task 2: Environmental Scan
export const environmentalScanTask = defineTask('environmental-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct environmental scan',
  agent: {
    name: 'environmental-analyst',
    prompt: {
      role: 'environmental scanning analyst',
      task: 'Conduct comprehensive environmental scan',
      context: args,
      instructions: [
        'Conduct external analysis:',
        '  - Macro-environment (PESTEL factors)',
        '  - Industry dynamics (Five Forces)',
        '  - Competitive landscape',
        '  - Customer and market trends',
        'Conduct internal analysis:',
        '  - Organizational capabilities',
        '  - Resource position',
        '  - Culture and values',
        'Synthesize SWOT:',
        '  - Key strengths and weaknesses',
        '  - Key opportunities and threats',
        'Identify strategic implications',
        'Save scan to output directory'
      ],
      outputFormat: 'JSON with externalAnalysis (object), internalAnalysis (object), opportunities (array), threats (array), strategicImplications (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'threats', 'artifacts'],
      properties: {
        externalAnalysis: { type: 'object' },
        internalAnalysis: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'string' } },
        threats: { type: 'array', items: { type: 'string' } },
        strategicImplications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'environmental-scan']
}));

// Task 3: Performance Review
export const performanceReviewTask = defineTask('performance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review past performance',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'performance review analyst',
      task: 'Review organizational performance against strategic objectives',
      context: args,
      instructions: [
        'Review performance against objectives:',
        '  - Financial performance',
        '  - Operational metrics',
        '  - Customer metrics',
        '  - Employee metrics',
        'Analyze strategic initiative outcomes',
        'Identify performance gaps and root causes',
        'Extract lessons learned',
        'Identify success patterns to replicate',
        'Save review to output directory'
      ],
      outputFormat: 'JSON with performanceMetrics (object), gaps (array), lessonsLearned (array), successPatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        performanceMetrics: { type: 'object' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              target: { type: 'string' },
              actual: { type: 'string' },
              gap: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        successPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'performance-review']
}));

// Task 4: Strategic Intent
export const strategicIntentTask = defineTask('strategic-intent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refresh strategic intent and vision',
  agent: {
    name: 'vision-architect',
    prompt: {
      role: 'strategic vision architect',
      task: 'Refresh and articulate strategic intent, vision, and mission',
      context: args,
      instructions: [
        'Review and refresh:',
        '  - Vision statement (aspirational future state)',
        '  - Mission statement (purpose and scope)',
        '  - Strategic intent (ambitious goals)',
        '  - Core values',
        'Ensure alignment with:',
        '  - Environmental realities',
        '  - Stakeholder expectations',
        '  - Organizational capabilities',
        'Develop strategic themes for planning horizon',
        'Save intent to output directory'
      ],
      outputFormat: 'JSON with vision (string), mission (string), strategicIntent (string), values (array), strategicThemes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'mission', 'artifacts'],
      properties: {
        vision: { type: 'string' },
        mission: { type: 'string' },
        strategicIntent: { type: 'string' },
        values: { type: 'array', items: { type: 'string' } },
        strategicThemes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'vision']
}));

// Task 5: Strategic Objectives
export const strategicObjectivesTask = defineTask('strategic-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set strategic objectives',
  agent: {
    name: 'objectives-designer',
    prompt: {
      role: 'strategic objectives designer',
      task: 'Define strategic objectives for the planning period',
      context: args,
      instructions: [
        'Define objectives across perspectives:',
        '  - Financial objectives',
        '  - Customer objectives',
        '  - Process objectives',
        '  - Learning and growth objectives',
        'Ensure objectives are SMART:',
        '  - Specific',
        '  - Measurable',
        '  - Achievable',
        '  - Relevant',
        '  - Time-bound',
        'Define key results for each objective',
        'Map cause-and-effect relationships',
        'Save objectives to output directory'
      ],
      outputFormat: 'JSON with objectives (array of objects with name, perspective, description, measure, target, timeline), objectiveMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              perspective: { type: 'string' },
              description: { type: 'string' },
              measure: { type: 'string' },
              target: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        objectiveMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'objectives']
}));

// Task 6: Strategic Options Development
export const strategicOptionsTask = defineTask('strategic-options', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic options',
  agent: {
    name: 'options-developer',
    prompt: {
      role: 'strategic options developer',
      task: 'Develop alternative strategic options to achieve objectives',
      context: args,
      instructions: [
        'Generate strategic options for each objective',
        'Consider option types:',
        '  - Organic growth strategies',
        '  - Acquisition strategies',
        '  - Partnership strategies',
        '  - Diversification strategies',
        '  - Efficiency strategies',
        'For each option document:',
        '  - Description and approach',
        '  - Pros and cons',
        '  - Resource requirements',
        '  - Risk assessment',
        '  - Expected impact',
        'Save options to output directory'
      ],
      outputFormat: 'JSON with options (array of objects with name, objective, description, pros, cons, resources, risks, impact), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'artifacts'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              objective: { type: 'string' },
              description: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              resources: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' }
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
  labels: ['agent', 'strategic-planning', 'options']
}));

// Task 7: Strategy Selection
export const strategySelectionTask = defineTask('strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select strategies',
  agent: {
    name: 'strategy-selector',
    prompt: {
      role: 'strategy selection facilitator',
      task: 'Evaluate and select strategies from options',
      context: args,
      instructions: [
        'Evaluate options against criteria:',
        '  - Strategic fit',
        '  - Feasibility',
        '  - Acceptability to stakeholders',
        '  - Risk/return profile',
        '  - Synergies with other strategies',
        'Apply scoring or multi-criteria analysis',
        'Select winning strategies',
        'Ensure strategic coherence',
        'Save selection to output directory'
      ],
      outputFormat: 'JSON with selectedStrategies (array of objects), evaluationMatrix (object), selectionRationale (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStrategies', 'artifacts'],
      properties: {
        selectedStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              score: { type: 'number' }
            }
          }
        },
        evaluationMatrix: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'selection']
}));

// Task 8: Initiative Identification
export const initiativeIdentificationTask = defineTask('initiative-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify strategic initiatives',
  agent: {
    name: 'initiative-planner',
    prompt: {
      role: 'strategic initiative planner',
      task: 'Identify strategic initiatives to implement selected strategies',
      context: args,
      instructions: [
        'Identify initiatives for each strategy',
        'For each initiative define:',
        '  - Name and description',
        '  - Linked strategy and objectives',
        '  - Scope and deliverables',
        '  - Timeline and milestones',
        '  - Resource requirements',
        '  - Dependencies',
        '  - Success metrics',
        'Identify quick wins vs long-term',
        'Save initiatives to output directory'
      ],
      outputFormat: 'JSON with initiatives (array of objects with name, strategy, description, scope, timeline, resources, dependencies, metrics), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strategy: { type: 'string' },
              description: { type: 'string' },
              scope: { type: 'string' },
              timeline: { type: 'string' },
              resources: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              metrics: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'strategic-planning', 'initiatives']
}));

// Task 9: Initiative Prioritization
export const initiativePrioritizationTask = defineTask('initiative-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize initiatives',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'initiative prioritization analyst',
      task: 'Prioritize strategic initiatives',
      context: args,
      instructions: [
        'Prioritize initiatives using criteria:',
        '  - Strategic impact',
        '  - Financial return',
        '  - Risk level',
        '  - Resource requirements',
        '  - Dependencies',
        '  - Time to value',
        'Create prioritization matrix',
        'Categorize: Must-do, Should-do, Nice-to-do',
        'Sequence initiatives logically',
        'Save prioritization to output directory'
      ],
      outputFormat: 'JSON with prioritizedInitiatives (array of objects with priority), prioritizationMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedInitiatives', 'artifacts'],
      properties: {
        prioritizedInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              priority: { type: 'number' },
              category: { type: 'string', enum: ['must-do', 'should-do', 'nice-to-do'] },
              sequence: { type: 'number' },
              scores: { type: 'object' }
            }
          }
        },
        prioritizationMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'prioritization']
}));

// Task 10: Resource Allocation
export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate resources',
  agent: {
    name: 'resource-allocator',
    prompt: {
      role: 'resource allocation analyst',
      task: 'Allocate resources to prioritized initiatives',
      context: args,
      instructions: [
        'Assess available resources:',
        '  - Financial budget',
        '  - Human capital',
        '  - Technology and infrastructure',
        '  - Time and attention',
        'Allocate resources to initiatives by priority',
        'Identify resource constraints',
        'Resolve conflicts and make trade-offs',
        'Create resource allocation plan',
        'Save allocation to output directory'
      ],
      outputFormat: 'JSON with allocation (object mapping initiatives to resources), constraints (array), tradeOffs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'artifacts'],
      properties: {
        allocation: { type: 'object' },
        availableResources: { type: 'object' },
        constraints: { type: 'array', items: { type: 'string' } },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'resource-allocation']
}));

// Task 11: Governance Framework
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish governance framework',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'strategic governance designer',
      task: 'Establish governance and monitoring framework',
      context: args,
      instructions: [
        'Design governance structure:',
        '  - Steering committee composition',
        '  - Review cadence (monthly, quarterly)',
        '  - Escalation procedures',
        '  - Decision rights',
        'Define monitoring framework:',
        '  - KPI dashboard',
        '  - Progress reporting',
        '  - Risk monitoring',
        '  - Change management process',
        'Create communication plan',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with framework (object with governance, monitoring, communication), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            governance: { type: 'object' },
            monitoring: { type: 'object' },
            communication: { type: 'object' }
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
  labels: ['agent', 'strategic-planning', 'governance']
}));

// Task 12: Strategic Plan Document
export const strategicPlanDocumentTask = defineTask('strategic-plan-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate strategic plan document',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategic planning consultant and technical writer',
      task: 'Generate comprehensive strategic plan document',
      context: args,
      instructions: [
        'Create executive summary',
        'Document strategic context and environmental analysis',
        'Present vision, mission, and strategic intent',
        'Detail strategic objectives and measures',
        'Present selected strategies',
        'Document initiative portfolio',
        'Include resource allocation plan',
        'Present governance and monitoring framework',
        'Add implementation roadmap',
        'Include appendices',
        'Format as professional strategic plan',
        'Save document to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), keyHighlights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyHighlights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'documentation']
}));
