/**
 * @process specializations/domains/business/legal/regulatory-change-management
 * @description Regulatory Change Management - Process for monitoring regulatory changes, assessing organizational
 * impact, and implementing required adaptations.
 * @inputs { regulatoryDomains: array, changeId?: string, action?: string, outputDir?: string }
 * @outputs { success: boolean, changes: array, impactAssessments: array, implementationPlans: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/regulatory-change-management', {
 *   regulatoryDomains: ['data-privacy', 'financial-services', 'healthcare'],
 *   action: 'monitor',
 *   outputDir: 'regulatory-changes'
 * });
 *
 * @references
 * - Compliance Week: https://www.complianceweek.com/
 * - Thomson Reuters Regulatory Intelligence: https://www.thomsonreuters.com/en/products-services/risk-fraud-and-compliance/regulatory-intelligence.html
 * - Wolters Kluwer Regulatory Change Management: https://www.wolterskluwer.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    regulatoryDomains,
    changeId = null,
    action = 'monitor', // 'monitor', 'assess', 'implement', 'full-cycle'
    jurisdictions = ['US'],
    outputDir = 'regulatory-change-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Regulatory Change Management - Action: ${action}`);

  // Phase 1: Regulatory Monitoring
  const monitoring = await ctx.task(regulatoryMonitoringTask, {
    regulatoryDomains,
    jurisdictions,
    outputDir
  });
  artifacts.push(...monitoring.artifacts);

  ctx.log('info', `Found ${monitoring.changes.length} regulatory changes`);

  if (action === 'monitor') {
    return {
      success: true,
      action,
      changes: monitoring.changes,
      artifacts,
      metadata: { processId: 'specializations/domains/business/legal/regulatory-change-management', timestamp: startTime }
    };
  }

  // Phase 2: Impact Assessment
  const impactAssessment = await ctx.task(regulatoryImpactAssessmentTask, {
    changes: monitoring.changes,
    outputDir
  });
  artifacts.push(...impactAssessment.artifacts);

  // Quality Gate for high impact changes
  const highImpactChanges = impactAssessment.assessments.filter(a => a.impactLevel === 'high');
  if (highImpactChanges.length > 0) {
    await ctx.breakpoint({
      question: `${highImpactChanges.length} high-impact regulatory changes identified. Review impact assessments?`,
      title: 'High Impact Regulatory Changes',
      context: {
        runId: ctx.runId,
        highImpactChanges: highImpactChanges.map(c => ({ name: c.changeName, impact: c.impactLevel })),
        files: impactAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  if (action === 'assess') {
    return {
      success: true,
      action,
      changes: monitoring.changes,
      impactAssessments: impactAssessment.assessments,
      artifacts,
      metadata: { processId: 'specializations/domains/business/legal/regulatory-change-management', timestamp: startTime }
    };
  }

  // Phase 3: Implementation Planning
  const implementationPlanning = await ctx.task(implementationPlanningTask, {
    assessments: impactAssessment.assessments,
    outputDir
  });
  artifacts.push(...implementationPlanning.artifacts);

  // Phase 4: Stakeholder Communication
  const communication = await ctx.task(stakeholderCommunicationTask, {
    changes: monitoring.changes,
    assessments: impactAssessment.assessments,
    plans: implementationPlanning.plans,
    outputDir
  });
  artifacts.push(...communication.artifacts);

  // Phase 5: Compliance Tracking
  const tracking = await ctx.task(complianceTrackingTask, {
    plans: implementationPlanning.plans,
    outputDir
  });
  artifacts.push(...tracking.artifacts);

  await ctx.breakpoint({
    question: `Regulatory change management cycle complete. ${monitoring.changes.length} changes processed, ${implementationPlanning.plans.length} implementation plans created. Approve?`,
    title: 'Regulatory Change Management Review',
    context: {
      runId: ctx.runId,
      summary: {
        changesIdentified: monitoring.changes.length,
        highImpact: highImpactChanges.length,
        plansCreated: implementationPlanning.plans.length
      },
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  return {
    success: true,
    action,
    changes: monitoring.changes,
    impactAssessments: impactAssessment.assessments,
    implementationPlans: implementationPlanning.plans,
    communicationPlan: communication.plan,
    trackingStatus: tracking.status,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/regulatory-change-management', timestamp: startTime }
  };
}

// Task Definitions
export const regulatoryMonitoringTask = defineTask('regulatory-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor regulatory changes',
  agent: {
    name: 'regulatory-specialist',
    prompt: {
      role: 'Regulatory Monitoring Specialist',
      task: 'Monitor and identify regulatory changes in specified domains',
      context: args,
      instructions: [
        'Scan regulatory sources for changes',
        'Identify new regulations and amendments',
        'Document effective dates and deadlines',
        'Categorize by regulatory domain',
        'Assess preliminary relevance'
      ],
      outputFormat: 'JSON with changes array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'artifacts'],
      properties: {
        changes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'regulatory-change']
}));

export const regulatoryImpactAssessmentTask = defineTask('regulatory-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess regulatory impact',
  agent: {
    name: 'regulatory-specialist',
    prompt: {
      role: 'Regulatory Impact Analyst',
      task: 'Assess organizational impact of regulatory changes',
      context: args,
      instructions: [
        'Analyze each change for organizational impact',
        'Identify affected business processes',
        'Assess compliance effort required',
        'Estimate resource requirements',
        'Classify impact level (high/medium/low)'
      ],
      outputFormat: 'JSON with assessments array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'artifacts'],
      properties: {
        assessments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'regulatory-change']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plans',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create implementation plans for regulatory compliance',
      context: args,
      instructions: [
        'Develop implementation plan per change',
        'Define required actions and tasks',
        'Assign responsibilities',
        'Set milestones and deadlines',
        'Identify resource needs'
      ],
      outputFormat: 'JSON with plans array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'artifacts'],
      properties: {
        plans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'regulatory-change']
}));

export const stakeholderCommunicationTask = defineTask('stakeholder-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan stakeholder communication',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Communications Planner',
      task: 'Plan stakeholder communication for regulatory changes',
      context: args,
      instructions: [
        'Identify stakeholders affected',
        'Create communication messages',
        'Define communication timeline',
        'Prepare training requirements',
        'Document communication plan'
      ],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'regulatory-change']
}));

export const complianceTrackingTask = defineTask('compliance-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up compliance tracking',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Tracker',
      task: 'Set up tracking for regulatory change implementation',
      context: args,
      instructions: [
        'Configure tracking dashboard',
        'Set up deadline alerts',
        'Define progress metrics',
        'Create reporting schedule',
        'Document tracking procedures'
      ],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'regulatory-change']
}));
