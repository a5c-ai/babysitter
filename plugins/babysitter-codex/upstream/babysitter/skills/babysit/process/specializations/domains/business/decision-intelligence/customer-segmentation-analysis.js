/**
 * @process specializations/domains/business/decision-intelligence/customer-segmentation-analysis
 * @description Customer Segmentation Analysis - Data-driven customer segmentation using behavioral, demographic,
 * and psychographic factors to inform targeting and positioning strategies.
 * @inputs { projectName: string, dataContext: object, segmentationObjectives: array, existingSegments?: array, constraints?: object }
 * @outputs { success: boolean, segmentationModel: object, segmentProfiles: array, targetingStrategy: object, activationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/customer-segmentation-analysis', {
 *   projectName: 'B2B Customer Segmentation',
 *   dataContext: { dataTypes: ['CRM', 'Transactions', 'Web Analytics'] },
 *   segmentationObjectives: ['Personalization', 'Product Development', 'Marketing Efficiency']
 * });
 *
 * @references
 * - Competing on Analytics: https://hbr.org/2006/01/competing-on-analytics
 * - Customer Segmentation Best Practices: McKinsey Analytics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dataContext = {},
    segmentationObjectives = [],
    existingSegments = [],
    constraints = {},
    outputDir = 'segmentation-output'
  } = inputs;

  // Phase 1: Data Assessment and Preparation
  const dataAssessment = await ctx.task(dataAssessmentTask, {
    projectName,
    dataContext,
    segmentationObjectives
  });

  // Phase 2: Variable Selection and Engineering
  const variableEngineering = await ctx.task(variableEngineeringTask, {
    projectName,
    dataAssessment,
    segmentationObjectives
  });

  // Phase 3: Segmentation Methodology Design
  const methodologyDesign = await ctx.task(methodologyDesignTask, {
    projectName,
    variableEngineering,
    segmentationObjectives,
    constraints
  });

  // Phase 4: Segmentation Model Development
  const segmentationModel = await ctx.task(segmentationModelTask, {
    projectName,
    variableEngineering,
    methodologyDesign
  });

  // Phase 5: Segment Profiling and Sizing
  const segmentProfiles = await ctx.task(segmentProfilingTask, {
    projectName,
    segmentationModel,
    dataAssessment
  });

  // Breakpoint: Review segmentation results
  await ctx.breakpoint({
    question: `Review customer segmentation for ${projectName}. Are the segments distinct and actionable?`,
    title: 'Segmentation Review',
    context: {
      runId: ctx.runId,
      projectName,
      segmentCount: segmentProfiles.segments?.length || 0
    }
  });

  // Phase 6: Targeting Strategy Development
  const targetingStrategy = await ctx.task(targetingStrategyTask, {
    projectName,
    segmentProfiles,
    segmentationObjectives
  });

  // Phase 7: Activation Planning
  const activationPlan = await ctx.task(activationPlanTask, {
    projectName,
    segmentProfiles,
    targetingStrategy
  });

  // Phase 8: Governance and Maintenance
  const governancePlan = await ctx.task(segmentationGovernanceTask, {
    projectName,
    segmentationModel,
    segmentProfiles
  });

  return {
    success: true,
    projectName,
    dataAssessment,
    variableEngineering,
    methodologyDesign,
    segmentationModel,
    segmentProfiles: segmentProfiles.segments,
    targetingStrategy,
    activationPlan,
    governancePlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/customer-segmentation-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataAssessmentTask = defineTask('data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Assessment and Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Analytics Data Specialist',
      task: 'Assess and prepare data for customer segmentation',
      context: args,
      instructions: [
        '1. Inventory available customer data sources',
        '2. Assess data quality and completeness',
        '3. Identify customer identity resolution needs',
        '4. Evaluate historical data depth',
        '5. Assess behavioral data availability',
        '6. Identify data integration requirements',
        '7. Document data privacy constraints',
        '8. Recommend data preparation approach'
      ],
      outputFormat: 'JSON object with data assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSources', 'dataQuality', 'preparation'],
      properties: {
        dataSources: { type: 'array' },
        dataQuality: { type: 'object' },
        coverage: { type: 'object' },
        gaps: { type: 'array' },
        preparation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'data']
}));

export const variableEngineeringTask = defineTask('variable-engineering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variable Selection and Engineering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Analytics Engineer',
      task: 'Select and engineer variables for segmentation',
      context: args,
      instructions: [
        '1. Define behavioral variables (RFM, engagement)',
        '2. Define demographic variables',
        '3. Define psychographic variables',
        '4. Create value-based variables (CLV, profitability)',
        '5. Engineer derived features',
        '6. Assess variable correlation and multicollinearity',
        '7. Normalize and standardize variables',
        '8. Document variable definitions'
      ],
      outputFormat: 'JSON object with variable engineering'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'categories', 'engineering'],
      properties: {
        variables: { type: 'array' },
        categories: { type: 'object' },
        derivedFeatures: { type: 'array' },
        correlations: { type: 'object' },
        engineering: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'variables']
}));

export const methodologyDesignTask = defineTask('methodology-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Segmentation Methodology Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Segmentation Methodology Expert',
      task: 'Design segmentation methodology and approach',
      context: args,
      instructions: [
        '1. Select clustering algorithms (K-means, hierarchical, DBSCAN)',
        '2. Define segment count determination approach',
        '3. Design validation methodology',
        '4. Plan stability testing approach',
        '5. Define segment assignment rules',
        '6. Design hybrid methodology if needed',
        '7. Plan for new customer assignment',
        '8. Document methodology rationale'
      ],
      outputFormat: 'JSON object with methodology design'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'validation', 'assignment'],
      properties: {
        algorithms: { type: 'array' },
        segmentCount: { type: 'object' },
        validation: { type: 'object' },
        stability: { type: 'object' },
        assignment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'methodology']
}));

export const segmentationModelTask = defineTask('segmentation-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Segmentation Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Segmentation Data Scientist',
      task: 'Develop and validate segmentation model',
      context: args,
      instructions: [
        '1. Execute clustering analysis',
        '2. Determine optimal segment count',
        '3. Validate segment stability',
        '4. Assess segment separation',
        '5. Interpret segment characteristics',
        '6. Create segment assignment model',
        '7. Validate on holdout data',
        '8. Document model performance'
      ],
      outputFormat: 'JSON object with segmentation model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'segmentCount', 'validation'],
      properties: {
        model: { type: 'object' },
        segmentCount: { type: 'number' },
        clusterCenters: { type: 'array' },
        validation: { type: 'object' },
        performance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'model']
}));

export const segmentProfilingTask = defineTask('segment-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Segment Profiling and Sizing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Segment Analyst',
      task: 'Profile and size customer segments',
      context: args,
      instructions: [
        '1. Calculate segment sizes and proportions',
        '2. Profile demographic characteristics',
        '3. Profile behavioral characteristics',
        '4. Calculate segment value metrics (CLV, revenue)',
        '5. Identify segment needs and pain points',
        '6. Create segment personas and names',
        '7. Identify segment growth potential',
        '8. Create segment visualization cards'
      ],
      outputFormat: 'JSON object with segment profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'sizing', 'personas'],
      properties: {
        segments: { type: 'array' },
        sizing: { type: 'object' },
        demographics: { type: 'object' },
        behaviors: { type: 'object' },
        valueMetrics: { type: 'object' },
        personas: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'profiling']
}));

export const targetingStrategyTask = defineTask('targeting-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Targeting Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Targeting Strategist',
      task: 'Develop targeting strategy based on segmentation',
      context: args,
      instructions: [
        '1. Evaluate segment attractiveness',
        '2. Prioritize target segments',
        '3. Define targeting criteria',
        '4. Develop segment-specific value propositions',
        '5. Define channel preferences by segment',
        '6. Develop messaging frameworks',
        '7. Define product/offer mapping',
        '8. Create targeting decision rules'
      ],
      outputFormat: 'JSON object with targeting strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['priorities', 'valuePropositions', 'channels'],
      properties: {
        attractiveness: { type: 'object' },
        priorities: { type: 'array' },
        valuePropositions: { type: 'object' },
        channels: { type: 'object' },
        messaging: { type: 'object' },
        productMapping: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'targeting']
}));

export const activationPlanTask = defineTask('activation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Activation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Segment Activation Specialist',
      task: 'Create activation plan for customer segments',
      context: args,
      instructions: [
        '1. Design segment data distribution',
        '2. Plan CRM and marketing automation integration',
        '3. Create segment-specific campaigns',
        '4. Define personalization rules',
        '5. Plan sales enablement activities',
        '6. Design measurement framework',
        '7. Create rollout timeline',
        '8. Define success criteria'
      ],
      outputFormat: 'JSON object with activation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'campaigns', 'measurement'],
      properties: {
        dataDistribution: { type: 'object' },
        integration: { type: 'object' },
        campaigns: { type: 'array' },
        personalization: { type: 'object' },
        salesEnablement: { type: 'object' },
        measurement: { type: 'object' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'activation']
}));

export const segmentationGovernanceTask = defineTask('segmentation-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance and Maintenance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Segmentation Governance Manager',
      task: 'Define governance and maintenance for segmentation',
      context: args,
      instructions: [
        '1. Define segment refresh schedule',
        '2. Create model monitoring process',
        '3. Design segment drift detection',
        '4. Define re-segmentation triggers',
        '5. Create governance roles and responsibilities',
        '6. Define change management process',
        '7. Plan documentation maintenance',
        '8. Design performance review cadence'
      ],
      outputFormat: 'JSON object with governance plan'
    },
    outputSchema: {
      type: 'object',
      required: ['refreshSchedule', 'monitoring', 'governance'],
      properties: {
        refreshSchedule: { type: 'object' },
        monitoring: { type: 'object' },
        driftDetection: { type: 'object' },
        governance: { type: 'object' },
        changeManagement: { type: 'object' },
        reviews: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'segmentation', 'governance']
}));
