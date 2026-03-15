/**
 * @process specializations/domains/business/decision-intelligence/collaborative-decision-support
 * @description Collaborative Decision Support Platform - Development of group decision support systems that
 * facilitate collaboration, consensus building, and collective intelligence for complex decisions.
 * @inputs { projectName: string, collaborationContext: object, participantTypes: array, decisionProcesses: array, technology?: object }
 * @outputs { success: boolean, platformDesign: object, collaborationFramework: object, consensusTools: object, implementationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/collaborative-decision-support', {
 *   projectName: 'Strategic Planning Collaboration Platform',
 *   collaborationContext: { scope: 'enterprise', mode: 'hybrid' },
 *   participantTypes: ['executives', 'managers', 'subject-matter-experts'],
 *   decisionProcesses: ['strategy formulation', 'resource allocation', 'risk assessment']
 * });
 *
 * @references
 * - Group Decision Support Systems: DeSanctis & Gallupe
 * - Collective Intelligence: MIT Center for Collective Intelligence
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    collaborationContext = {},
    participantTypes = [],
    decisionProcesses = [],
    technology = {},
    outputDir = 'collaborative-dss-output'
  } = inputs;

  // Phase 1: Collaboration Requirements
  const collaborationRequirements = await ctx.task(collaborationRequirementsTask, {
    projectName,
    collaborationContext,
    participantTypes,
    decisionProcesses
  });

  // Phase 2: Platform Architecture
  const platformArchitecture = await ctx.task(collaborativePlatformTask, {
    projectName,
    collaborationRequirements,
    technology
  });

  // Phase 3: Collaboration Tools Design
  const collaborationTools = await ctx.task(collaborationToolsTask, {
    projectName,
    collaborationRequirements,
    participantTypes
  });

  // Phase 4: Consensus Building Framework
  const consensusFramework = await ctx.task(consensusBuildingTask, {
    projectName,
    collaborationRequirements,
    decisionProcesses
  });

  // Breakpoint: Review collaboration platform design
  await ctx.breakpoint({
    question: `Review collaborative DSS design for ${projectName}. Does it support effective group decision-making?`,
    title: 'Collaborative DSS Review',
    context: {
      runId: ctx.runId,
      projectName,
      participantTypes: participantTypes.length
    }
  });

  // Phase 5: Facilitation Support
  const facilitationSupport = await ctx.task(facilitationSupportTask, {
    projectName,
    consensusFramework,
    collaborationTools
  });

  // Phase 6: Knowledge Aggregation
  const knowledgeAggregation = await ctx.task(knowledgeAggregationTask, {
    projectName,
    collaborationTools,
    participantTypes
  });

  // Phase 7: Decision Documentation
  const decisionDocumentation = await ctx.task(collaborativeDocumentationTask, {
    projectName,
    consensusFramework,
    knowledgeAggregation
  });

  // Phase 8: Implementation Plan
  const implementationPlan = await ctx.task(collaborativeImplementationTask, {
    projectName,
    platformArchitecture,
    collaborationTools,
    facilitationSupport
  });

  return {
    success: true,
    projectName,
    collaborationRequirements,
    platformDesign: platformArchitecture,
    collaborationFramework: {
      tools: collaborationTools,
      consensusFramework,
      facilitationSupport
    },
    consensusTools: consensusFramework,
    knowledgeAggregation,
    decisionDocumentation,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/collaborative-decision-support',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const collaborationRequirementsTask = defineTask('collaboration-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collaboration Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Collaboration Systems Analyst',
      task: 'Analyze collaborative decision support requirements',
      context: args,
      instructions: [
        '1. Identify collaboration patterns',
        '2. Define participant roles',
        '3. Analyze decision processes',
        '4. Identify communication needs',
        '5. Define synchronous/async requirements',
        '6. Analyze geographic distribution',
        '7. Identify cultural considerations',
        '8. Document collaboration requirements'
      ],
      outputFormat: 'JSON object with collaboration requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['collaborationPatterns', 'participantRoles', 'decisionProcesses'],
      properties: {
        collaborationPatterns: { type: 'array' },
        participantRoles: { type: 'array' },
        decisionProcesses: { type: 'array' },
        communicationNeeds: { type: 'object' },
        synchronicity: { type: 'object' },
        distribution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'requirements']
}));

export const collaborativePlatformTask = defineTask('collaborative-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Collaboration Platform Architect',
      task: 'Design collaborative decision platform',
      context: args,
      instructions: [
        '1. Design platform architecture',
        '2. Define technology stack',
        '3. Plan real-time capabilities',
        '4. Design data architecture',
        '5. Plan scalability approach',
        '6. Design security model',
        '7. Plan integration points',
        '8. Document platform design'
      ],
      outputFormat: 'JSON object with platform architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'technology', 'realtime'],
      properties: {
        architecture: { type: 'object' },
        technology: { type: 'object' },
        realtime: { type: 'object' },
        dataArchitecture: { type: 'object' },
        scalability: { type: 'object' },
        security: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'platform']
}));

export const collaborationToolsTask = defineTask('collaboration-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collaboration Tools Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Collaboration Tools Designer',
      task: 'Design collaboration tools for decision support',
      context: args,
      instructions: [
        '1. Design brainstorming tools',
        '2. Create voting mechanisms',
        '3. Design discussion forums',
        '4. Create shared workspaces',
        '5. Design annotation tools',
        '6. Create polling systems',
        '7. Design argumentation tools',
        '8. Document tool designs'
      ],
      outputFormat: 'JSON object with collaboration tools'
    },
    outputSchema: {
      type: 'object',
      required: ['brainstorming', 'voting', 'discussion'],
      properties: {
        brainstorming: { type: 'object' },
        voting: { type: 'object' },
        discussion: { type: 'object' },
        sharedWorkspaces: { type: 'object' },
        annotation: { type: 'object' },
        argumentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'tools']
}));

export const consensusBuildingTask = defineTask('consensus-building', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consensus Building Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Consensus Building Expert',
      task: 'Design consensus building framework',
      context: args,
      instructions: [
        '1. Design preference elicitation',
        '2. Create aggregation methods',
        '3. Design Delphi processes',
        '4. Create negotiation support',
        '5. Design compromise finding',
        '6. Create conflict resolution',
        '7. Design consensus measurement',
        '8. Document consensus framework'
      ],
      outputFormat: 'JSON object with consensus framework'
    },
    outputSchema: {
      type: 'object',
      required: ['preferenceElicitation', 'aggregation', 'conflictResolution'],
      properties: {
        preferenceElicitation: { type: 'object' },
        aggregation: { type: 'object' },
        delphiProcess: { type: 'object' },
        negotiationSupport: { type: 'object' },
        conflictResolution: { type: 'object' },
        consensusMeasurement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'consensus']
}));

export const facilitationSupportTask = defineTask('facilitation-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Facilitation Support - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Facilitation Support Designer',
      task: 'Design facilitation support capabilities',
      context: args,
      instructions: [
        '1. Design agenda management',
        '2. Create process guidance',
        '3. Design participation tracking',
        '4. Create intervention alerts',
        '5. Design time management',
        '6. Create engagement metrics',
        '7. Design facilitation dashboards',
        '8. Document facilitation support'
      ],
      outputFormat: 'JSON object with facilitation support'
    },
    outputSchema: {
      type: 'object',
      required: ['agendaManagement', 'processGuidance', 'participationTracking'],
      properties: {
        agendaManagement: { type: 'object' },
        processGuidance: { type: 'object' },
        participationTracking: { type: 'object' },
        interventionAlerts: { type: 'object' },
        timeManagement: { type: 'object' },
        dashboards: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'facilitation']
}));

export const knowledgeAggregationTask = defineTask('knowledge-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Aggregation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Collective Intelligence Designer',
      task: 'Design knowledge aggregation capabilities',
      context: args,
      instructions: [
        '1. Design idea collection',
        '2. Create categorization methods',
        '3. Design synthesis approaches',
        '4. Create expertise weighting',
        '5. Design crowd wisdom extraction',
        '6. Create knowledge visualization',
        '7. Design insight emergence',
        '8. Document aggregation methods'
      ],
      outputFormat: 'JSON object with knowledge aggregation'
    },
    outputSchema: {
      type: 'object',
      required: ['ideaCollection', 'synthesis', 'visualization'],
      properties: {
        ideaCollection: { type: 'object' },
        categorization: { type: 'object' },
        synthesis: { type: 'object' },
        expertiseWeighting: { type: 'object' },
        crowdWisdom: { type: 'object' },
        visualization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'aggregation']
}));

export const collaborativeDocumentationTask = defineTask('collaborative-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Documentation Specialist',
      task: 'Design collaborative decision documentation',
      context: args,
      instructions: [
        '1. Design decision records',
        '2. Create rationale capture',
        '3. Design dissent documentation',
        '4. Create version tracking',
        '5. Design audit trails',
        '6. Create commitment tracking',
        '7. Design learning capture',
        '8. Document system design'
      ],
      outputFormat: 'JSON object with documentation design'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionRecords', 'rationaleCapture', 'auditTrails'],
      properties: {
        decisionRecords: { type: 'object' },
        rationaleCapture: { type: 'object' },
        dissentDocumentation: { type: 'object' },
        versionTracking: { type: 'object' },
        auditTrails: { type: 'object' },
        learningCapture: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'documentation']
}));

export const collaborativeImplementationTask = defineTask('collaborative-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Collaboration Platform Implementation Lead',
      task: 'Plan collaborative DSS implementation',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Plan pilot deployment',
        '3. Design training program',
        '4. Plan change management',
        '5. Define success metrics',
        '6. Create rollout timeline',
        '7. Plan support model',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'pilot', 'training'],
      properties: {
        phases: { type: 'array' },
        pilot: { type: 'object' },
        training: { type: 'object' },
        changeManagement: { type: 'object' },
        successMetrics: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'collaborative-dss', 'implementation']
}));
