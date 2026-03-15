/**
 * @process specializations/domains/business/decision-intelligence/self-service-analytics-enablement
 * @description Self-Service Analytics Enablement - Implementation of self-service analytics capabilities including
 * data catalog setup, semantic layer design, user training, and governance frameworks.
 * @inputs { projectName: string, organizationContext: object, dataSources: array, userGroups: array, governanceRequirements?: object }
 * @outputs { success: boolean, dataCatalog: object, semanticLayer: object, governanceFramework: object, trainingPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/self-service-analytics-enablement', {
 *   projectName: 'Enterprise Self-Service Analytics Platform',
 *   organizationContext: { industry: 'Financial Services', size: 'Enterprise' },
 *   dataSources: ['Salesforce', 'SAP', 'Snowflake'],
 *   userGroups: ['Business Analysts', 'Marketing Team', 'Finance Team']
 * });
 *
 * @references
 * - Gartner BI and Analytics: https://www.gartner.com/en/information-technology/glossary/business-intelligence-bi
 * - Data Democratization: https://hbr.org/2020/02/how-to-use-analytics-to-make-better-decisions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    organizationContext = {},
    dataSources = [],
    userGroups = [],
    governanceRequirements = {},
    outputDir = 'self-service-analytics-output'
  } = inputs;

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    projectName,
    organizationContext,
    dataSources,
    userGroups
  });

  // Phase 2: Data Catalog Design
  const dataCatalogDesign = await ctx.task(dataCatalogDesignTask, {
    projectName,
    dataSources,
    currentStateAssessment,
    organizationContext
  });

  // Phase 3: Semantic Layer Architecture
  const semanticLayerDesign = await ctx.task(semanticLayerDesignTask, {
    projectName,
    dataCatalogDesign,
    userGroups,
    dataSources
  });

  // Phase 4: Governance Framework
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    projectName,
    governanceRequirements,
    userGroups,
    dataCatalogDesign,
    semanticLayerDesign
  });

  // Breakpoint: Review governance framework
  await ctx.breakpoint({
    question: `Review self-service governance framework for ${projectName}. Does it balance enablement with control?`,
    title: 'Governance Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      accessPolicies: governanceFramework.accessPolicies,
      dataClassification: governanceFramework.dataClassification
    }
  });

  // Phase 5: Tool Selection and Configuration
  const toolConfiguration = await ctx.task(toolConfigurationTask, {
    projectName,
    organizationContext,
    semanticLayerDesign,
    userGroups
  });

  // Phase 6: Training Program Development
  const trainingProgram = await ctx.task(trainingProgramTask, {
    projectName,
    userGroups,
    toolConfiguration,
    semanticLayerDesign
  });

  // Phase 7: Adoption and Change Management
  const adoptionStrategy = await ctx.task(adoptionStrategyTask, {
    projectName,
    userGroups,
    trainingProgram,
    organizationContext
  });

  // Phase 8: Implementation Roadmap
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    dataCatalogDesign,
    semanticLayerDesign,
    governanceFramework,
    toolConfiguration,
    trainingProgram,
    adoptionStrategy
  });

  return {
    success: true,
    projectName,
    currentStateAssessment,
    dataCatalog: dataCatalogDesign,
    semanticLayer: semanticLayerDesign,
    governanceFramework,
    toolConfiguration,
    trainingPlan: trainingProgram,
    adoptionStrategy,
    implementationRoadmap,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/self-service-analytics-enablement',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Maturity Assessment Specialist',
      task: 'Assess current analytics capabilities and maturity level',
      context: args,
      instructions: [
        '1. Evaluate current analytics tools and infrastructure',
        '2. Assess data literacy levels across user groups',
        '3. Identify existing bottlenecks and pain points',
        '4. Map current data access patterns and workflows',
        '5. Evaluate existing governance and security controls',
        '6. Identify quick wins and high-impact opportunities',
        '7. Benchmark against industry best practices',
        '8. Assess organizational readiness for self-service'
      ],
      outputFormat: 'JSON object with current state assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['maturityLevel', 'capabilities', 'gaps'],
      properties: {
        maturityLevel: { type: 'string' },
        capabilities: { type: 'array' },
        gaps: { type: 'array' },
        recommendations: { type: 'array' },
        readinessScore: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'self-service', 'assessment']
}));

export const dataCatalogDesignTask = defineTask('data-catalog-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Catalog Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Catalog and Metadata Management Expert',
      task: 'Design comprehensive data catalog for self-service analytics',
      context: args,
      instructions: [
        '1. Define data catalog architecture and metadata model',
        '2. Design data discovery and search capabilities',
        '3. Plan automated metadata harvesting and lineage',
        '4. Define data classification and tagging taxonomy',
        '5. Design data quality scoring and trust indicators',
        '6. Plan business glossary and term definitions',
        '7. Design data stewardship workflows',
        '8. Define catalog integration with analytics tools'
      ],
      outputFormat: 'JSON object with data catalog design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'metadataModel', 'taxonomy'],
      properties: {
        architecture: { type: 'object' },
        metadataModel: { type: 'object' },
        taxonomy: { type: 'object' },
        searchCapabilities: { type: 'object' },
        qualityIndicators: { type: 'array' },
        integrations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'data-catalog', 'metadata']
}));

export const semanticLayerDesignTask = defineTask('semantic-layer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Semantic Layer Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Semantic Layer and Data Modeling Expert',
      task: 'Design semantic layer for consistent business metrics',
      context: args,
      instructions: [
        '1. Define semantic layer architecture',
        '2. Design dimensional models and business entities',
        '3. Create standardized metric definitions',
        '4. Define calculated measures and KPI formulas',
        '5. Design row-level security policies',
        '6. Plan caching and performance optimization',
        '7. Define versioning and change management',
        '8. Create documentation and user guides'
      ],
      outputFormat: 'JSON object with semantic layer design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'entities', 'metrics'],
      properties: {
        architecture: { type: 'object' },
        entities: { type: 'array' },
        metrics: { type: 'array' },
        securityPolicies: { type: 'object' },
        performanceConfig: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'semantic-layer', 'modeling']
}));

export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Governance and Compliance Specialist',
      task: 'Design governance framework for self-service analytics',
      context: args,
      instructions: [
        '1. Define data access policies and permissions',
        '2. Create data classification framework',
        '3. Design approval workflows for sensitive data',
        '4. Define usage monitoring and audit capabilities',
        '5. Create data quality standards and SLAs',
        '6. Design report certification process',
        '7. Define data retention and archival policies',
        '8. Plan compliance monitoring and reporting'
      ],
      outputFormat: 'JSON object with governance framework'
    },
    outputSchema: {
      type: 'object',
      required: ['accessPolicies', 'dataClassification', 'workflows'],
      properties: {
        accessPolicies: { type: 'array' },
        dataClassification: { type: 'object' },
        workflows: { type: 'array' },
        qualityStandards: { type: 'object' },
        auditCapabilities: { type: 'object' },
        complianceControls: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'governance', 'compliance']
}));

export const toolConfigurationTask = defineTask('tool-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tool Selection and Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BI Tools and Platform Specialist',
      task: 'Select and configure self-service analytics tools',
      context: args,
      instructions: [
        '1. Evaluate and select self-service BI tools',
        '2. Design tool configuration and settings',
        '3. Plan integration with existing systems',
        '4. Configure user roles and permissions',
        '5. Design template library and starter content',
        '6. Configure data connection settings',
        '7. Plan mobile and embedded analytics',
        '8. Define performance tuning parameters'
      ],
      outputFormat: 'JSON object with tool configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'configuration', 'integrations'],
      properties: {
        selectedTools: { type: 'array' },
        configuration: { type: 'object' },
        integrations: { type: 'array' },
        templates: { type: 'array' },
        performanceSettings: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'tools', 'configuration']
}));

export const trainingProgramTask = defineTask('training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Training Program Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Training and Enablement Specialist',
      task: 'Develop comprehensive training program for self-service analytics',
      context: args,
      instructions: [
        '1. Design role-based training curriculum',
        '2. Create hands-on workshops and exercises',
        '3. Develop self-paced learning materials',
        '4. Design certification program and assessments',
        '5. Plan train-the-trainer program',
        '6. Create reference guides and cheat sheets',
        '7. Design ongoing learning and support resources',
        '8. Plan community of practice initiatives'
      ],
      outputFormat: 'JSON object with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['curriculum', 'materials', 'certifications'],
      properties: {
        curriculum: { type: 'array' },
        materials: { type: 'array' },
        certifications: { type: 'array' },
        workshops: { type: 'array' },
        supportResources: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'training', 'enablement']
}));

export const adoptionStrategyTask = defineTask('adoption-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adoption and Change Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management and Adoption Specialist',
      task: 'Develop adoption strategy for self-service analytics',
      context: args,
      instructions: [
        '1. Design change management approach',
        '2. Identify champions and early adopters',
        '3. Create communication plan and messaging',
        '4. Design incentive and recognition programs',
        '5. Plan pilot programs and success stories',
        '6. Define adoption metrics and tracking',
        '7. Design feedback collection mechanisms',
        '8. Plan continuous improvement process'
      ],
      outputFormat: 'JSON object with adoption strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['changeManagement', 'communications', 'metrics'],
      properties: {
        changeManagement: { type: 'object' },
        champions: { type: 'array' },
        communications: { type: 'array' },
        incentives: { type: 'array' },
        pilots: { type: 'array' },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'adoption', 'change-management']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Manager and Implementation Lead',
      task: 'Create implementation roadmap for self-service analytics',
      context: args,
      instructions: [
        '1. Define implementation phases and milestones',
        '2. Create detailed work breakdown structure',
        '3. Identify dependencies and critical path',
        '4. Estimate resources and budget requirements',
        '5. Define success criteria for each phase',
        '6. Plan risk mitigation strategies',
        '7. Design rollout and scaling approach',
        '8. Create governance and review cadence'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        dependencies: { type: 'array' },
        successCriteria: { type: 'array' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'implementation', 'roadmap']
}));
