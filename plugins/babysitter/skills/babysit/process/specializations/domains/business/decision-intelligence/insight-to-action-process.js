/**
 * @process specializations/domains/business/decision-intelligence/insight-to-action-process
 * @description Insight-to-Action Process - Structured workflow for translating analytical insights into actionable
 * recommendations and tracking implementation outcomes.
 * @inputs { projectName: string, insights: array, businessContext: object, stakeholders: array, constraints?: object }
 * @outputs { success: boolean, actionableRecommendations: array, implementationPlan: object, trackingFramework: object, impactMeasurement: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/insight-to-action-process', {
 *   projectName: 'Q4 Analytics Insights Activation',
 *   insights: ['Customer segment X has 2x higher LTV', 'Product feature Y drives retention'],
 *   businessContext: { department: 'Marketing', budget: '$500K' },
 *   stakeholders: ['CMO', 'Product', 'Sales']
 * });
 *
 * @references
 * - Analytics 3.0: https://hbr.org/2013/12/analytics-30
 * - Data-Driven Decision Making
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    insights = [],
    businessContext = {},
    stakeholders = [],
    constraints = {},
    outputDir = 'insight-to-action-output'
  } = inputs;

  // Phase 1: Insight Validation
  const insightValidation = await ctx.task(insightValidationTask, {
    projectName,
    insights,
    businessContext
  });

  // Phase 2: Opportunity Identification
  const opportunityIdentification = await ctx.task(opportunityIdentificationTask, {
    projectName,
    insightValidation,
    businessContext
  });

  // Phase 3: Action Translation
  const actionTranslation = await ctx.task(actionTranslationTask, {
    projectName,
    opportunityIdentification,
    stakeholders,
    constraints
  });

  // Phase 4: Prioritization
  const prioritization = await ctx.task(actionPrioritizationTask, {
    projectName,
    actionTranslation,
    businessContext,
    constraints
  });

  // Breakpoint: Review action recommendations
  await ctx.breakpoint({
    question: `Review insight-to-action recommendations for ${projectName}. Are they feasible and impactful?`,
    title: 'Action Recommendations Review',
    context: {
      runId: ctx.runId,
      projectName,
      actionCount: prioritization.prioritized?.length || 0
    }
  });

  // Phase 5: Implementation Planning
  const implementationPlanning = await ctx.task(actionImplementationTask, {
    projectName,
    prioritization,
    stakeholders
  });

  // Phase 6: Tracking Framework
  const trackingFramework = await ctx.task(actionTrackingTask, {
    projectName,
    implementationPlanning,
    prioritization
  });

  // Phase 7: Impact Measurement
  const impactMeasurement = await ctx.task(impactMeasurementTask, {
    projectName,
    trackingFramework,
    insightValidation
  });

  // Phase 8: Feedback Loop Design
  const feedbackLoop = await ctx.task(feedbackLoopDesignTask, {
    projectName,
    impactMeasurement,
    trackingFramework
  });

  return {
    success: true,
    projectName,
    insightValidation,
    opportunities: opportunityIdentification,
    actionableRecommendations: prioritization.prioritized,
    implementationPlan: implementationPlanning,
    trackingFramework,
    impactMeasurement,
    feedbackLoop,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/insight-to-action-process',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const insightValidationTask = defineTask('insight-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insight Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Insight Validation Specialist',
      task: 'Validate and assess insights for actionability',
      context: args,
      instructions: [
        '1. Assess insight validity and confidence',
        '2. Verify data quality and methodology',
        '3. Evaluate statistical significance',
        '4. Assess practical significance',
        '5. Check for confounding factors',
        '6. Validate business relevance',
        '7. Assess insight freshness',
        '8. Document validation results'
      ],
      outputFormat: 'JSON object with insight validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedInsights', 'confidence', 'relevance'],
      properties: {
        validatedInsights: { type: 'array' },
        confidence: { type: 'object' },
        methodology: { type: 'object' },
        relevance: { type: 'object' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'validation']
}));

export const opportunityIdentificationTask = defineTask('opportunity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Opportunity Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Opportunity Analyst',
      task: 'Identify business opportunities from insights',
      context: args,
      instructions: [
        '1. Map insights to business opportunities',
        '2. Quantify opportunity value',
        '3. Identify quick wins',
        '4. Identify strategic opportunities',
        '5. Assess opportunity timing',
        '6. Identify dependencies',
        '7. Evaluate competitive advantage',
        '8. Document opportunities'
      ],
      outputFormat: 'JSON object with opportunity identification'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'value', 'quickWins'],
      properties: {
        opportunities: { type: 'array' },
        value: { type: 'object' },
        quickWins: { type: 'array' },
        strategic: { type: 'array' },
        timing: { type: 'object' },
        dependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'opportunities']
}));

export const actionTranslationTask = defineTask('action-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Translation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Action Planning Specialist',
      task: 'Translate opportunities into actionable recommendations',
      context: args,
      instructions: [
        '1. Define specific actions per opportunity',
        '2. Assign action ownership',
        '3. Define required resources',
        '4. Estimate implementation effort',
        '5. Identify success criteria',
        '6. Define timeline requirements',
        '7. Identify risks and mitigations',
        '8. Create action cards'
      ],
      outputFormat: 'JSON object with action translation'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'ownership', 'resources'],
      properties: {
        actions: { type: 'array' },
        ownership: { type: 'object' },
        resources: { type: 'object' },
        effort: { type: 'object' },
        successCriteria: { type: 'object' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'translation']
}));

export const actionPrioritizationTask = defineTask('action-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Action Prioritization Expert',
      task: 'Prioritize actions by impact and feasibility',
      context: args,
      instructions: [
        '1. Score actions on impact',
        '2. Score actions on feasibility',
        '3. Create impact-feasibility matrix',
        '4. Apply constraint filters',
        '5. Identify dependencies',
        '6. Sequence actions optimally',
        '7. Create prioritized roadmap',
        '8. Document prioritization rationale'
      ],
      outputFormat: 'JSON object with action prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritized', 'matrix', 'sequence'],
      properties: {
        scores: { type: 'object' },
        matrix: { type: 'object' },
        prioritized: { type: 'array' },
        sequence: { type: 'array' },
        roadmap: { type: 'object' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'prioritization']
}));

export const actionImplementationTask = defineTask('action-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create detailed implementation plan',
      context: args,
      instructions: [
        '1. Create detailed work breakdown',
        '2. Define milestones and gates',
        '3. Assign responsibilities (RACI)',
        '4. Create timeline',
        '5. Define resource allocation',
        '6. Plan stakeholder communication',
        '7. Identify change management needs',
        '8. Create implementation playbook'
      ],
      outputFormat: 'JSON object with implementation planning'
    },
    outputSchema: {
      type: 'object',
      required: ['workBreakdown', 'milestones', 'timeline'],
      properties: {
        workBreakdown: { type: 'object' },
        milestones: { type: 'array' },
        raci: { type: 'object' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        communication: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'implementation']
}));

export const actionTrackingTask = defineTask('action-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tracking Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Action Tracking Specialist',
      task: 'Design action tracking framework',
      context: args,
      instructions: [
        '1. Define tracking metrics',
        '2. Design progress tracking',
        '3. Create status reporting',
        '4. Define review cadence',
        '5. Design escalation triggers',
        '6. Create tracking dashboard',
        '7. Define accountability mechanisms',
        '8. Plan tracking operations'
      ],
      outputFormat: 'JSON object with tracking framework'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'reporting', 'dashboard'],
      properties: {
        metrics: { type: 'array' },
        progressTracking: { type: 'object' },
        reporting: { type: 'object' },
        reviews: { type: 'object' },
        escalation: { type: 'object' },
        dashboard: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'tracking']
}));

export const impactMeasurementTask = defineTask('impact-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Impact Measurement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Impact Measurement Specialist',
      task: 'Design impact measurement framework',
      context: args,
      instructions: [
        '1. Define impact metrics',
        '2. Establish baselines',
        '3. Design attribution methodology',
        '4. Plan measurement timing',
        '5. Define comparison approach',
        '6. Design impact reporting',
        '7. Plan ROI calculation',
        '8. Create measurement playbook'
      ],
      outputFormat: 'JSON object with impact measurement'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'baselines', 'attribution'],
      properties: {
        metrics: { type: 'array' },
        baselines: { type: 'object' },
        attribution: { type: 'object' },
        timing: { type: 'object' },
        reporting: { type: 'object' },
        roi: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'impact']
}));

export const feedbackLoopDesignTask = defineTask('feedback-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feedback Loop Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Feedback Loop Designer',
      task: 'Design feedback and learning loop',
      context: args,
      instructions: [
        '1. Design outcome feedback capture',
        '2. Plan insight refinement process',
        '3. Create learning documentation',
        '4. Design iteration process',
        '5. Plan continuous improvement',
        '6. Define success criteria updates',
        '7. Design knowledge sharing',
        '8. Create feedback playbook'
      ],
      outputFormat: 'JSON object with feedback loop design'
    },
    outputSchema: {
      type: 'object',
      required: ['feedbackCapture', 'learning', 'iteration'],
      properties: {
        feedbackCapture: { type: 'object' },
        refinement: { type: 'object' },
        learning: { type: 'object' },
        iteration: { type: 'object' },
        knowledgeSharing: { type: 'object' },
        improvement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'insight-to-action', 'feedback']
}));
