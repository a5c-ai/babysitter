/**
 * @process specializations/domains/business/decision-intelligence/predictive-analytics-implementation
 * @description Predictive Analytics Implementation - Development and deployment of predictive models for
 * forecasting, classification, and anomaly detection to support decision-making.
 * @inputs { projectName: string, useCase: object, dataContext: object, businessRequirements?: object, stakeholders?: array }
 * @outputs { success: boolean, predictiveModel: object, deploymentPlan: object, monitoringPlan: object, businessIntegration: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/predictive-analytics-implementation', {
 *   projectName: 'Customer Churn Prediction Model',
 *   useCase: { type: 'classification', target: 'churn', horizon: '90 days' },
 *   dataContext: { sources: ['CRM', 'Usage', 'Support'] }
 * });
 *
 * @references
 * - Business Intelligence and Data Science: https://www.pearson.com/us/higher-education/program/Sharda-Business-Intelligence-Analytics-and-Data-Science-A-Managerial-Perspective-4th-Edition/PGM1683656.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    useCase = {},
    dataContext = {},
    businessRequirements = {},
    stakeholders = [],
    outputDir = 'predictive-analytics-output'
  } = inputs;

  // Phase 1: Use Case Definition
  const useCaseDefinition = await ctx.task(useCaseDefinitionTask, {
    projectName,
    useCase,
    businessRequirements,
    stakeholders
  });

  // Phase 2: Data Assessment
  const dataAssessment = await ctx.task(predictiveDataAssessmentTask, {
    projectName,
    useCaseDefinition,
    dataContext
  });

  // Phase 3: Feature Engineering
  const featureEngineering = await ctx.task(predictiveFeatureEngineeringTask, {
    projectName,
    dataAssessment,
    useCaseDefinition
  });

  // Phase 4: Model Selection
  const modelSelection = await ctx.task(predictiveModelSelectionTask, {
    projectName,
    useCaseDefinition,
    featureEngineering
  });

  // Phase 5: Model Development
  const modelDevelopment = await ctx.task(predictiveModelDevelopmentTask, {
    projectName,
    modelSelection,
    featureEngineering
  });

  // Breakpoint: Review model performance
  await ctx.breakpoint({
    question: `Review predictive model performance for ${projectName}. Does it meet business requirements?`,
    title: 'Model Performance Review',
    context: {
      runId: ctx.runId,
      projectName,
      modelType: modelSelection.selectedModel || 'N/A'
    }
  });

  // Phase 6: Deployment Planning
  const deploymentPlan = await ctx.task(predictiveDeploymentPlanTask, {
    projectName,
    modelDevelopment,
    businessRequirements
  });

  // Phase 7: Business Integration
  const businessIntegration = await ctx.task(predictiveBusinessIntegrationTask, {
    projectName,
    deploymentPlan,
    useCaseDefinition,
    stakeholders
  });

  // Phase 8: Monitoring and Maintenance
  const monitoringPlan = await ctx.task(predictiveMonitoringTask, {
    projectName,
    modelDevelopment,
    deploymentPlan
  });

  return {
    success: true,
    projectName,
    useCaseDefinition,
    dataAssessment,
    featureEngineering,
    predictiveModel: {
      selection: modelSelection,
      development: modelDevelopment
    },
    deploymentPlan,
    businessIntegration,
    monitoringPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/predictive-analytics-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const useCaseDefinitionTask = defineTask('use-case-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Use Case Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Predictive Analytics Business Analyst',
      task: 'Define predictive analytics use case',
      context: args,
      instructions: [
        '1. Define prediction target',
        '2. Specify prediction horizon',
        '3. Define business success criteria',
        '4. Identify decision integration points',
        '5. Specify accuracy requirements',
        '6. Define update frequency needs',
        '7. Identify stakeholders and users',
        '8. Document use case specifications'
      ],
      outputFormat: 'JSON object with use case definition'
    },
    outputSchema: {
      type: 'object',
      required: ['target', 'successCriteria', 'integration'],
      properties: {
        target: { type: 'object' },
        horizon: { type: 'string' },
        successCriteria: { type: 'array' },
        accuracyRequirements: { type: 'object' },
        integration: { type: 'object' },
        users: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'use-case']
}));

export const predictiveDataAssessmentTask = defineTask('predictive-data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Predictive Analytics Data Specialist',
      task: 'Assess data for predictive modeling',
      context: args,
      instructions: [
        '1. Inventory available data sources',
        '2. Assess target variable availability',
        '3. Evaluate predictor availability',
        '4. Assess data quality',
        '5. Identify data gaps',
        '6. Evaluate historical depth',
        '7. Assess data freshness',
        '8. Document data assessment'
      ],
      outputFormat: 'JSON object with data assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'quality', 'gaps'],
      properties: {
        sources: { type: 'array' },
        targetVariable: { type: 'object' },
        predictors: { type: 'array' },
        quality: { type: 'object' },
        gaps: { type: 'array' },
        historicalDepth: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'data']
}));

export const predictiveFeatureEngineeringTask = defineTask('predictive-feature-engineering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feature Engineering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Feature Engineering Specialist',
      task: 'Design features for predictive model',
      context: args,
      instructions: [
        '1. Identify raw features',
        '2. Design derived features',
        '3. Create temporal features',
        '4. Design aggregation features',
        '5. Handle categorical encoding',
        '6. Design interaction features',
        '7. Plan feature selection approach',
        '8. Document feature engineering'
      ],
      outputFormat: 'JSON object with feature engineering'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'transformations', 'selection'],
      properties: {
        rawFeatures: { type: 'array' },
        derivedFeatures: { type: 'array' },
        features: { type: 'array' },
        transformations: { type: 'object' },
        encoding: { type: 'object' },
        selection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'features']
}));

export const predictiveModelSelectionTask = defineTask('predictive-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Model Selection Expert',
      task: 'Select appropriate predictive modeling approach',
      context: args,
      instructions: [
        '1. Identify candidate algorithms',
        '2. Evaluate algorithm suitability',
        '3. Consider interpretability requirements',
        '4. Assess computational requirements',
        '5. Consider deployment constraints',
        '6. Evaluate ensemble approaches',
        '7. Select primary and backup approaches',
        '8. Document selection rationale'
      ],
      outputFormat: 'JSON object with model selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedModel', 'candidates', 'rationale'],
      properties: {
        candidates: { type: 'array' },
        evaluation: { type: 'object' },
        selectedModel: { type: 'string' },
        backup: { type: 'string' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'selection']
}));

export const predictiveModelDevelopmentTask = defineTask('predictive-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Predictive Model Developer',
      task: 'Develop and validate predictive model',
      context: args,
      instructions: [
        '1. Split data for training/validation/test',
        '2. Train model with cross-validation',
        '3. Tune hyperparameters',
        '4. Evaluate model performance',
        '5. Conduct error analysis',
        '6. Assess feature importance',
        '7. Validate on holdout data',
        '8. Document model specifications'
      ],
      outputFormat: 'JSON object with model development'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'performance', 'validation'],
      properties: {
        model: { type: 'object' },
        hyperparameters: { type: 'object' },
        performance: { type: 'object' },
        featureImportance: { type: 'object' },
        errorAnalysis: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'development']
}));

export const predictiveDeploymentPlanTask = defineTask('predictive-deployment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Model Deployment Planner',
      task: 'Plan predictive model deployment',
      context: args,
      instructions: [
        '1. Define deployment architecture',
        '2. Specify scoring patterns (batch/real-time)',
        '3. Plan data pipeline integration',
        '4. Define API specifications',
        '5. Plan scalability requirements',
        '6. Define rollout strategy',
        '7. Plan fallback mechanisms',
        '8. Create deployment checklist'
      ],
      outputFormat: 'JSON object with deployment plan'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'scoring', 'rollout'],
      properties: {
        architecture: { type: 'object' },
        scoring: { type: 'object' },
        pipeline: { type: 'object' },
        api: { type: 'object' },
        rollout: { type: 'object' },
        fallback: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'deployment']
}));

export const predictiveBusinessIntegrationTask = defineTask('predictive-business-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Integration Specialist',
      task: 'Plan business process integration',
      context: args,
      instructions: [
        '1. Map predictions to business processes',
        '2. Design decision triggers',
        '3. Plan user interface integration',
        '4. Define action recommendations',
        '5. Design feedback loops',
        '6. Plan user training',
        '7. Define adoption metrics',
        '8. Create integration roadmap'
      ],
      outputFormat: 'JSON object with business integration'
    },
    outputSchema: {
      type: 'object',
      required: ['processIntegration', 'triggers', 'training'],
      properties: {
        processIntegration: { type: 'object' },
        triggers: { type: 'array' },
        userInterface: { type: 'object' },
        recommendations: { type: 'object' },
        feedbackLoops: { type: 'object' },
        training: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'integration']
}));

export const predictiveMonitoringTask = defineTask('predictive-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring and Maintenance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Model Monitoring Specialist',
      task: 'Plan model monitoring and maintenance',
      context: args,
      instructions: [
        '1. Define performance monitoring metrics',
        '2. Design drift detection',
        '3. Plan retraining triggers',
        '4. Define alerting thresholds',
        '5. Design A/B testing approach',
        '6. Plan model versioning',
        '7. Define maintenance schedule',
        '8. Create monitoring dashboard'
      ],
      outputFormat: 'JSON object with monitoring plan'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'drift', 'retraining'],
      properties: {
        metrics: { type: 'array' },
        drift: { type: 'object' },
        retraining: { type: 'object' },
        alerts: { type: 'array' },
        abTesting: { type: 'object' },
        versioning: { type: 'object' },
        dashboard: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'predictive', 'monitoring']
}));
