/**
 * @process specializations/domains/business/decision-intelligence/decision-support-system-architecture
 * @description Decision Support System Architecture Design - Design and implementation of comprehensive decision
 * support systems that integrate data, models, and user interfaces for enhanced decision-making capabilities.
 * @inputs { projectName: string, businessDomain: object, decisionTypes: array, userProfiles: array, dataEnvironment?: object }
 * @outputs { success: boolean, architectureDesign: object, componentSpecifications: object, integrationPlan: object, implementationRoadmap: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/decision-support-system-architecture', {
 *   projectName: 'Enterprise Decision Support Platform',
 *   businessDomain: { industry: 'Financial Services', scope: 'Risk Management' },
 *   decisionTypes: ['operational', 'tactical', 'strategic'],
 *   userProfiles: ['analysts', 'managers', 'executives']
 * });
 *
 * @references
 * - Decision Support Systems: Concepts and Resources: https://dssresources.com/
 * - Power, D.J. - Decision Support Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    businessDomain = {},
    decisionTypes = [],
    userProfiles = [],
    dataEnvironment = {},
    outputDir = 'dss-architecture-output'
  } = inputs;

  // Phase 1: Requirements Analysis
  const requirementsAnalysis = await ctx.task(dssRequirementsTask, {
    projectName,
    businessDomain,
    decisionTypes,
    userProfiles
  });

  // Phase 2: Data Architecture Design
  const dataArchitecture = await ctx.task(dssDataArchitectureTask, {
    projectName,
    requirementsAnalysis,
    dataEnvironment
  });

  // Phase 3: Model Repository Design
  const modelRepository = await ctx.task(dssModelRepositoryTask, {
    projectName,
    requirementsAnalysis,
    decisionTypes
  });

  // Phase 4: User Interface Design
  const userInterface = await ctx.task(dssUserInterfaceTask, {
    projectName,
    requirementsAnalysis,
    userProfiles
  });

  // Breakpoint: Review DSS architecture design
  await ctx.breakpoint({
    question: `Review DSS architecture for ${projectName}. Does it address all decision support requirements?`,
    title: 'DSS Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      decisionTypes: decisionTypes.length
    }
  });

  // Phase 5: Integration Architecture
  const integrationArchitecture = await ctx.task(dssIntegrationTask, {
    projectName,
    dataArchitecture,
    modelRepository,
    userInterface
  });

  // Phase 6: Security and Governance
  const securityGovernance = await ctx.task(dssSecurityGovernanceTask, {
    projectName,
    integrationArchitecture,
    userProfiles
  });

  // Phase 7: Performance Design
  const performanceDesign = await ctx.task(dssPerformanceTask, {
    projectName,
    integrationArchitecture,
    requirementsAnalysis
  });

  // Phase 8: Implementation Roadmap
  const implementationRoadmap = await ctx.task(dssImplementationRoadmapTask, {
    projectName,
    integrationArchitecture,
    securityGovernance,
    performanceDesign
  });

  return {
    success: true,
    projectName,
    requirementsAnalysis,
    architectureDesign: {
      dataArchitecture,
      modelRepository,
      userInterface,
      integrationArchitecture
    },
    componentSpecifications: {
      data: dataArchitecture,
      models: modelRepository,
      ui: userInterface,
      security: securityGovernance
    },
    performanceDesign,
    integrationPlan: integrationArchitecture,
    implementationRoadmap,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/decision-support-system-architecture',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dssRequirementsTask = defineTask('dss-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `DSS Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Support Systems Analyst',
      task: 'Analyze and document DSS requirements',
      context: args,
      instructions: [
        '1. Identify decision-making processes',
        '2. Document information requirements',
        '3. Analyze user needs by profile',
        '4. Define functional requirements',
        '5. Specify non-functional requirements',
        '6. Identify integration requirements',
        '7. Define success criteria',
        '8. Document requirements specifications'
      ],
      outputFormat: 'JSON object with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionProcesses', 'informationRequirements', 'functionalRequirements'],
      properties: {
        decisionProcesses: { type: 'array' },
        informationRequirements: { type: 'array' },
        userNeeds: { type: 'object' },
        functionalRequirements: { type: 'array' },
        nonFunctionalRequirements: { type: 'array' },
        successCriteria: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'requirements']
}));

export const dssDataArchitectureTask = defineTask('dss-data-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Data Architect',
      task: 'Design data architecture for decision support',
      context: args,
      instructions: [
        '1. Design data warehouse/lake architecture',
        '2. Define data integration patterns',
        '3. Design data quality framework',
        '4. Create data models for decision support',
        '5. Design ETL/ELT pipelines',
        '6. Define data refresh strategies',
        '7. Plan data lineage tracking',
        '8. Document data architecture'
      ],
      outputFormat: 'JSON object with data architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['dataStore', 'integrationPatterns', 'dataModels'],
      properties: {
        dataStore: { type: 'object' },
        integrationPatterns: { type: 'array' },
        qualityFramework: { type: 'object' },
        dataModels: { type: 'array' },
        pipelines: { type: 'object' },
        lineage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'data-architecture']
}));

export const dssModelRepositoryTask = defineTask('dss-model-repository', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Repository Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Model Designer',
      task: 'Design model repository for decision support',
      context: args,
      instructions: [
        '1. Identify model types needed',
        '2. Design model storage architecture',
        '3. Define model versioning strategy',
        '4. Create model metadata framework',
        '5. Design model execution environment',
        '6. Plan model governance',
        '7. Define model APIs',
        '8. Document model repository design'
      ],
      outputFormat: 'JSON object with model repository design'
    },
    outputSchema: {
      type: 'object',
      required: ['modelTypes', 'storage', 'execution'],
      properties: {
        modelTypes: { type: 'array' },
        storage: { type: 'object' },
        versioning: { type: 'object' },
        metadata: { type: 'object' },
        execution: { type: 'object' },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'models']
}));

export const dssUserInterfaceTask = defineTask('dss-user-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `User Interface Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS UX Designer',
      task: 'Design user interface for decision support',
      context: args,
      instructions: [
        '1. Design user interface architecture',
        '2. Create dashboard frameworks',
        '3. Design what-if analysis interfaces',
        '4. Create report templates',
        '5. Design collaboration features',
        '6. Plan mobile experience',
        '7. Define accessibility standards',
        '8. Document UI specifications'
      ],
      outputFormat: 'JSON object with UI design'
    },
    outputSchema: {
      type: 'object',
      required: ['uiArchitecture', 'dashboards', 'interactions'],
      properties: {
        uiArchitecture: { type: 'object' },
        dashboards: { type: 'array' },
        whatIfInterfaces: { type: 'object' },
        reports: { type: 'array' },
        collaboration: { type: 'object' },
        interactions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'ui']
}));

export const dssIntegrationTask = defineTask('dss-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Integration Architect',
      task: 'Design integration architecture for DSS',
      context: args,
      instructions: [
        '1. Design component integration patterns',
        '2. Define API architecture',
        '3. Plan external system integration',
        '4. Design event-driven architecture',
        '5. Create integration middleware specs',
        '6. Define data contracts',
        '7. Plan error handling',
        '8. Document integration architecture'
      ],
      outputFormat: 'JSON object with integration architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPatterns', 'apis', 'middleware'],
      properties: {
        integrationPatterns: { type: 'array' },
        apis: { type: 'object' },
        externalSystems: { type: 'array' },
        eventArchitecture: { type: 'object' },
        middleware: { type: 'object' },
        dataContracts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'integration']
}));

export const dssSecurityGovernanceTask = defineTask('dss-security-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security and Governance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Security Architect',
      task: 'Design security and governance for DSS',
      context: args,
      instructions: [
        '1. Design authentication/authorization',
        '2. Define data access controls',
        '3. Plan audit logging',
        '4. Design compliance framework',
        '5. Create governance model',
        '6. Define privacy controls',
        '7. Plan disaster recovery',
        '8. Document security architecture'
      ],
      outputFormat: 'JSON object with security and governance'
    },
    outputSchema: {
      type: 'object',
      required: ['authentication', 'authorization', 'governance'],
      properties: {
        authentication: { type: 'object' },
        authorization: { type: 'object' },
        accessControls: { type: 'object' },
        auditLogging: { type: 'object' },
        compliance: { type: 'object' },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'security']
}));

export const dssPerformanceTask = defineTask('dss-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Performance Engineer',
      task: 'Design performance architecture for DSS',
      context: args,
      instructions: [
        '1. Define performance requirements',
        '2. Design caching strategy',
        '3. Plan query optimization',
        '4. Design scalability architecture',
        '5. Plan load balancing',
        '6. Define monitoring strategy',
        '7. Create performance benchmarks',
        '8. Document performance design'
      ],
      outputFormat: 'JSON object with performance design'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'caching', 'scalability'],
      properties: {
        requirements: { type: 'object' },
        caching: { type: 'object' },
        queryOptimization: { type: 'object' },
        scalability: { type: 'object' },
        loadBalancing: { type: 'object' },
        monitoring: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'performance']
}));

export const dssImplementationRoadmapTask = defineTask('dss-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DSS Implementation Planner',
      task: 'Create implementation roadmap for DSS',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create work breakdown structure',
        '3. Plan resource requirements',
        '4. Define milestones',
        '5. Identify dependencies',
        '6. Plan pilot deployment',
        '7. Define rollout strategy',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'timeline'],
      properties: {
        phases: { type: 'array' },
        workBreakdown: { type: 'object' },
        resources: { type: 'object' },
        milestones: { type: 'array' },
        dependencies: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dss', 'implementation']
}));
