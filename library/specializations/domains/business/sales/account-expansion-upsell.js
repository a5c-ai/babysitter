/**
 * @process sales/account-expansion-upsell
 * @description Methodology for identifying whitespace within existing accounts and executing cross-sell and upsell motions to grow customer lifetime value.
 * @inputs { accountName: string, currentProducts: array, usageData: object, contractData: object, stakeholderData?: object }
 * @outputs { success: boolean, expansionMap: object, opportunities: array, playbook: object, prioritizedActions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/account-expansion-upsell', {
 *   accountName: 'Enterprise Customer',
 *   currentProducts: ['Product A', 'Product B'],
 *   usageData: { adoption: 80, users: 500 },
 *   contractData: { value: 100000, renewalDate: '2025-06-01' }
 * });
 *
 * @references
 * - The Challenger Customer: https://www.amazon.com/Challenger-Customer-Selling-Hidden-Influencer/dp/1591848156
 * - Expansion Revenue Playbook: https://www.gainsight.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    currentProducts = [],
    usageData = {},
    contractData = {},
    stakeholderData = {},
    productCatalog = [],
    outputDir = 'expansion-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Account Expansion Analysis for ${accountName}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Current State');
  const currentStateAnalysis = await ctx.task(currentStateAnalysisTask, {
    accountName,
    currentProducts,
    usageData,
    contractData,
    outputDir
  });

  artifacts.push(...(currentStateAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: USAGE PATTERN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Usage Patterns');
  const usagePatternAnalysis = await ctx.task(usagePatternAnalysisTask, {
    accountName,
    usageData,
    currentProducts,
    outputDir
  });

  artifacts.push(...(usagePatternAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: WHITESPACE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping Whitespace');
  const whitespaceMapping = await ctx.task(whitespaceMappingTask, {
    accountName,
    currentProducts,
    productCatalog,
    usagePatternAnalysis,
    outputDir
  });

  artifacts.push(...(whitespaceMapping.artifacts || []));

  // ============================================================================
  // PHASE 4: STAKEHOLDER ANALYSIS FOR EXPANSION
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Stakeholders for Expansion');
  const stakeholderAnalysis = await ctx.task(expansionStakeholderTask, {
    accountName,
    stakeholderData,
    whitespaceMapping,
    outputDir
  });

  artifacts.push(...(stakeholderAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 5: OPPORTUNITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying Opportunities');
  const opportunityIdentification = await ctx.task(expansionOpportunityTask, {
    accountName,
    whitespaceMapping,
    usagePatternAnalysis,
    stakeholderAnalysis,
    contractData,
    outputDir
  });

  artifacts.push(...(opportunityIdentification.artifacts || []));

  // ============================================================================
  // PHASE 6: VALUE PROPOSITION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing Value Propositions');
  const valuePropositions = await ctx.task(expansionValuePropTask, {
    accountName,
    opportunityIdentification,
    currentStateAnalysis,
    outputDir
  });

  artifacts.push(...(valuePropositions.artifacts || []));

  // ============================================================================
  // PHASE 7: EXPANSION PLAYBOOK CREATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Expansion Playbook');
  const expansionPlaybook = await ctx.task(expansionPlaybookTask, {
    accountName,
    opportunityIdentification,
    valuePropositions,
    stakeholderAnalysis,
    outputDir
  });

  artifacts.push(...(expansionPlaybook.artifacts || []));

  // ============================================================================
  // PHASE 8: ACTION PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Prioritizing Actions');
  const actionPrioritization = await ctx.task(actionPrioritizationTask, {
    accountName,
    expansionPlaybook,
    opportunityIdentification,
    contractData,
    outputDir
  });

  artifacts.push(...(actionPrioritization.artifacts || []));

  // Breakpoint: Review expansion plan
  await ctx.breakpoint({
    question: `Account expansion analysis complete for ${accountName}. Total opportunity: $${opportunityIdentification.totalOpportunity}. Review expansion plan?`,
    title: 'Account Expansion Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        currentARR: contractData.value,
        totalOpportunity: opportunityIdentification.totalOpportunity,
        opportunityCount: opportunityIdentification.opportunities?.length || 0,
        topOpportunity: opportunityIdentification.opportunities?.[0]?.name || 'N/A'
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    currentState: {
      products: currentProducts,
      contractValue: contractData.value,
      adoption: usageData.adoption
    },
    expansionMap: whitespaceMapping.map,
    opportunities: opportunityIdentification.opportunities,
    totalOpportunity: opportunityIdentification.totalOpportunity,
    valuePropositions: valuePropositions.propositions,
    playbook: expansionPlaybook.playbook,
    prioritizedActions: actionPrioritization.actions,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/account-expansion-upsell',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const currentStateAnalysisTask = defineTask('current-state-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Analysis - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Account expansion specialist',
      task: 'Analyze current state of customer relationship',
      context: args,
      instructions: [
        'Document current products and services',
        'Analyze contract terms and renewal dates',
        'Assess customer health and satisfaction',
        'Review historical growth trajectory',
        'Identify current stakeholder relationships',
        'Assess competitive presence',
        'Document known challenges',
        'Calculate customer lifetime value'
      ],
      outputFormat: 'JSON with currentState object, health, clv, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState', 'health', 'artifacts'],
      properties: {
        currentState: {
          type: 'object',
          properties: {
            products: { type: 'array', items: { type: 'string' } },
            contractValue: { type: 'number' },
            contractTerm: { type: 'string' },
            renewalDate: { type: 'string' },
            expansionHistory: { type: 'string' }
          }
        },
        health: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            indicators: { type: 'array', items: { type: 'string' } }
          }
        },
        clv: { type: 'number' },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'expansion', 'current-state']
}));

export const usagePatternAnalysisTask = defineTask('usage-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Usage Pattern Analysis - ${args.accountName}`,
  agent: {
    name: 'product-analyst',
    prompt: {
      role: 'Usage analytics specialist',
      task: 'Analyze usage patterns to identify expansion signals',
      context: args,
      instructions: [
        'Analyze feature utilization rates',
        'Identify power users and teams',
        'Detect usage growth trends',
        'Identify underutilized features',
        'Spot usage ceiling patterns',
        'Identify natural expansion triggers',
        'Analyze user growth trajectory',
        'Compare to similar accounts'
      ],
      outputFormat: 'JSON with patterns, signals, triggers, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'signals', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              significance: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        signals: {
          type: 'object',
          properties: {
            expansionReady: { type: 'array', items: { type: 'string' } },
            atCapacity: { type: 'array', items: { type: 'string' } },
            underutilized: { type: 'array', items: { type: 'string' } }
          }
        },
        triggers: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'expansion', 'usage-patterns']
}));

export const whitespaceMappingTask = defineTask('whitespace-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whitespace Mapping - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Whitespace analysis specialist',
      task: 'Map all whitespace opportunities in the account',
      context: args,
      instructions: [
        'Compare current products to full catalog',
        'Identify product gaps',
        'Map department penetration',
        'Identify geographic expansion',
        'Assess use case coverage',
        'Identify tier upgrade potential',
        'Map add-on opportunities',
        'Calculate total addressable expansion'
      ],
      outputFormat: 'JSON with map object, productGaps, departmentGaps, totalPotential, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'productGaps', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            products: { type: 'object' },
            departments: { type: 'object' },
            useCases: { type: 'object' }
          }
        },
        productGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string' },
              relevance: { type: 'string' },
              potential: { type: 'number' }
            }
          }
        },
        departmentGaps: { type: 'array', items: { type: 'string' } },
        tierUpgrade: {
          type: 'object',
          properties: {
            current: { type: 'string' },
            recommended: { type: 'string' },
            potential: { type: 'number' }
          }
        },
        totalPotential: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'expansion', 'whitespace']
}));

export const expansionStakeholderTask = defineTask('expansion-stakeholder', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expansion Stakeholder Analysis - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Stakeholder engagement specialist',
      task: 'Identify and analyze stakeholders for expansion opportunities',
      context: args,
      instructions: [
        'Identify stakeholders for each whitespace area',
        'Assess existing relationships',
        'Identify new contacts to develop',
        'Map decision-making for expansion',
        'Identify champions for expansion',
        'Assess executive sponsorship',
        'Identify blockers or risks',
        'Create engagement strategy'
      ],
      outputFormat: 'JSON with stakeholders, champions, newContacts, engagementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              relevantOpportunities: { type: 'array', items: { type: 'string' } },
              relationship: { type: 'string' },
              influence: { type: 'string' }
            }
          }
        },
        champions: { type: 'array', items: { type: 'string' } },
        newContacts: { type: 'array', items: { type: 'string' } },
        engagementPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              action: { type: 'string' },
              timing: { type: 'string' }
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
  labels: ['agent', 'sales', 'expansion', 'stakeholder']
}));

export const expansionOpportunityTask = defineTask('expansion-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expansion Opportunity Identification - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Expansion opportunity specialist',
      task: 'Identify and size specific expansion opportunities',
      context: args,
      instructions: [
        'Define specific expansion opportunities',
        'Size each opportunity value',
        'Assess probability of success',
        'Identify timing and triggers',
        'Map to stakeholders',
        'Assess effort required',
        'Prioritize opportunities',
        'Calculate total expansion potential'
      ],
      outputFormat: 'JSON with opportunities array, totalOpportunity, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'totalOpportunity', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['upsell', 'cross-sell', 'expansion', 'upgrade'] },
              value: { type: 'number' },
              probability: { type: 'number' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              timing: { type: 'string' },
              stakeholder: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        totalOpportunity: { type: 'number' },
        weightedPipeline: { type: 'number' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'expansion', 'opportunities']
}));

export const expansionValuePropTask = defineTask('expansion-value-prop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expansion Value Propositions - ${args.accountName}`,
  agent: {
    name: 'value-consultant',
    prompt: {
      role: 'Value proposition specialist',
      task: 'Develop value propositions for each expansion opportunity',
      context: args,
      instructions: [
        'Create value proposition for each opportunity',
        'Quantify expected benefits',
        'Develop ROI justification',
        'Create customer-specific messaging',
        'Address likely objections',
        'Develop proof points',
        'Create comparison to current state',
        'Build business case outline'
      ],
      outputFormat: 'JSON with propositions array, messaging, objectionHandling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['propositions', 'artifacts'],
      properties: {
        propositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              valueStatement: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } },
              roi: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        messaging: {
          type: 'object',
          properties: {
            executiveLevel: { type: 'string' },
            userLevel: { type: 'string' }
          }
        },
        objectionHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
              response: { type: 'string' }
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
  labels: ['agent', 'sales', 'expansion', 'value-proposition']
}));

export const expansionPlaybookTask = defineTask('expansion-playbook', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expansion Playbook - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sales playbook specialist',
      task: 'Create expansion playbook with execution guidance',
      context: args,
      instructions: [
        'Create overall expansion strategy',
        'Define engagement sequence',
        'Develop conversation guides',
        'Create demo scenarios',
        'Build proposal templates',
        'Define success metrics',
        'Create timeline and milestones',
        'Develop follow-up cadence'
      ],
      outputFormat: 'JSON with playbook object, conversationGuides, sequences, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbook', 'artifacts'],
      properties: {
        playbook: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            approach: { type: 'string' },
            timeline: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        conversationGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              openingQuestion: { type: 'string' },
              discoveryQuestions: { type: 'array', items: { type: 'string' } },
              valueMessage: { type: 'string' }
            }
          }
        },
        sequences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'expansion', 'playbook']
}));

export const actionPrioritizationTask = defineTask('action-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Prioritization - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sales execution planner',
      task: 'Prioritize expansion actions for execution',
      context: args,
      instructions: [
        'Rank opportunities by value and effort',
        'Identify quick wins',
        'Sequence actions optimally',
        'Align with renewal timing',
        'Assign owners',
        'Set deadlines',
        'Define success criteria',
        'Create accountability plan'
      ],
      outputFormat: 'JSON with actions array, quickWins, sequence, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              opportunity: { type: 'string' },
              priority: { type: 'number' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              value: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        sequence: { type: 'array', items: { type: 'string' } },
        timeline: {
          type: 'object',
          properties: {
            month1: { type: 'array', items: { type: 'string' } },
            month2: { type: 'array', items: { type: 'string' } },
            month3: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'sales', 'expansion', 'prioritization']
}));
