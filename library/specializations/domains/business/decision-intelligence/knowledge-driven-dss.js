/**
 * @process specializations/domains/business/decision-intelligence/knowledge-driven-dss
 * @description Knowledge-Driven DSS Development - Development of expert systems and knowledge-based decision
 * support systems that encode domain expertise and business rules.
 * @inputs { projectName: string, domainExpertise: object, knowledgeSources: array, decisionDomains: array, stakeholders?: array }
 * @outputs { success: boolean, knowledgeBase: object, inferenceEngine: object, explanationSystem: object, maintenancePlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/knowledge-driven-dss', {
 *   projectName: 'Credit Risk Assessment Expert System',
 *   domainExpertise: { area: 'credit risk', experts: ['risk officers', 'underwriters'] },
 *   knowledgeSources: ['policies', 'regulations', 'best practices'],
 *   decisionDomains: ['loan approval', 'credit limit', 'pricing']
 * });
 *
 * @references
 * - Expert Systems: Principles and Programming: Giarratano & Riley
 * - Knowledge Engineering: IEEE Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    domainExpertise = {},
    knowledgeSources = [],
    decisionDomains = [],
    stakeholders = [],
    outputDir = 'knowledge-dss-output'
  } = inputs;

  // Phase 1: Knowledge Requirements
  const knowledgeRequirements = await ctx.task(knowledgeRequirementsTask, {
    projectName,
    domainExpertise,
    decisionDomains
  });

  // Phase 2: Knowledge Acquisition
  const knowledgeAcquisition = await ctx.task(knowledgeAcquisitionTask, {
    projectName,
    knowledgeRequirements,
    knowledgeSources,
    domainExpertise
  });

  // Phase 3: Knowledge Representation
  const knowledgeRepresentation = await ctx.task(knowledgeRepresentationTask, {
    projectName,
    knowledgeAcquisition
  });

  // Phase 4: Knowledge Base Design
  const knowledgeBase = await ctx.task(knowledgeBaseDesignTask, {
    projectName,
    knowledgeRepresentation,
    decisionDomains
  });

  // Breakpoint: Review knowledge model
  await ctx.breakpoint({
    question: `Review knowledge base design for ${projectName}. Does it capture domain expertise adequately?`,
    title: 'Knowledge Base Review',
    context: {
      runId: ctx.runId,
      projectName,
      knowledgeDomains: decisionDomains.length
    }
  });

  // Phase 5: Inference Engine Design
  const inferenceEngine = await ctx.task(inferenceEngineTask, {
    projectName,
    knowledgeBase,
    knowledgeRepresentation
  });

  // Phase 6: Explanation System
  const explanationSystem = await ctx.task(explanationSystemTask, {
    projectName,
    inferenceEngine,
    stakeholders
  });

  // Phase 7: Validation Framework
  const validationFramework = await ctx.task(knowledgeValidationTask, {
    projectName,
    knowledgeBase,
    inferenceEngine,
    domainExpertise
  });

  // Phase 8: Maintenance Plan
  const maintenancePlan = await ctx.task(knowledgeMaintenanceTask, {
    projectName,
    knowledgeBase,
    validationFramework
  });

  return {
    success: true,
    projectName,
    knowledgeRequirements,
    knowledgeAcquisition,
    knowledgeRepresentation,
    knowledgeBase,
    inferenceEngine,
    explanationSystem,
    validationFramework,
    maintenancePlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/knowledge-driven-dss',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const knowledgeRequirementsTask = defineTask('knowledge-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Engineer',
      task: 'Define knowledge requirements for DSS',
      context: args,
      instructions: [
        '1. Identify knowledge domains',
        '2. Define decision scope',
        '3. Identify expert sources',
        '4. Document knowledge gaps',
        '5. Define knowledge quality criteria',
        '6. Identify tacit knowledge needs',
        '7. Plan knowledge elicitation',
        '8. Document requirements'
      ],
      outputFormat: 'JSON object with knowledge requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['domains', 'decisionScope', 'expertSources'],
      properties: {
        domains: { type: 'array' },
        decisionScope: { type: 'object' },
        expertSources: { type: 'array' },
        knowledgeGaps: { type: 'array' },
        qualityCriteria: { type: 'object' },
        elicitationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'requirements']
}));

export const knowledgeAcquisitionTask = defineTask('knowledge-acquisition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Acquisition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Acquisition Specialist',
      task: 'Design knowledge acquisition approach',
      context: args,
      instructions: [
        '1. Plan expert interviews',
        '2. Design document analysis',
        '3. Plan observation sessions',
        '4. Design protocol analysis',
        '5. Plan repertory grids',
        '6. Design card sorting',
        '7. Plan knowledge validation',
        '8. Document acquisition plan'
      ],
      outputFormat: 'JSON object with knowledge acquisition'
    },
    outputSchema: {
      type: 'object',
      required: ['interviews', 'documentAnalysis', 'validation'],
      properties: {
        interviews: { type: 'object' },
        documentAnalysis: { type: 'object' },
        observations: { type: 'object' },
        protocolAnalysis: { type: 'object' },
        repertoryGrids: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'acquisition']
}));

export const knowledgeRepresentationTask = defineTask('knowledge-representation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Representation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Representation Expert',
      task: 'Design knowledge representation scheme',
      context: args,
      instructions: [
        '1. Select representation formalism',
        '2. Design ontology structure',
        '3. Define rule formats',
        '4. Plan semantic networks',
        '5. Design frames/objects',
        '6. Define uncertainty handling',
        '7. Plan temporal reasoning',
        '8. Document representation'
      ],
      outputFormat: 'JSON object with knowledge representation'
    },
    outputSchema: {
      type: 'object',
      required: ['formalism', 'ontology', 'rules'],
      properties: {
        formalism: { type: 'object' },
        ontology: { type: 'object' },
        rules: { type: 'object' },
        semanticNetworks: { type: 'object' },
        frames: { type: 'object' },
        uncertaintyHandling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'representation']
}));

export const knowledgeBaseDesignTask = defineTask('knowledge-base-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Base Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Base Designer',
      task: 'Design knowledge base architecture',
      context: args,
      instructions: [
        '1. Design knowledge storage',
        '2. Define fact base structure',
        '3. Design rule base organization',
        '4. Plan metadata management',
        '5. Design versioning scheme',
        '6. Define access controls',
        '7. Plan knowledge integration',
        '8. Document KB architecture'
      ],
      outputFormat: 'JSON object with knowledge base design'
    },
    outputSchema: {
      type: 'object',
      required: ['storage', 'factBase', 'ruleBase'],
      properties: {
        storage: { type: 'object' },
        factBase: { type: 'object' },
        ruleBase: { type: 'object' },
        metadata: { type: 'object' },
        versioning: { type: 'object' },
        integration: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'knowledge-base']
}));

export const inferenceEngineTask = defineTask('inference-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inference Engine Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Inference Engine Designer',
      task: 'Design inference engine for knowledge DSS',
      context: args,
      instructions: [
        '1. Select inference strategy',
        '2. Design forward chaining',
        '3. Design backward chaining',
        '4. Plan conflict resolution',
        '5. Design uncertainty reasoning',
        '6. Plan truth maintenance',
        '7. Design optimization',
        '8. Document inference engine'
      ],
      outputFormat: 'JSON object with inference engine design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'forwardChaining', 'conflictResolution'],
      properties: {
        strategy: { type: 'object' },
        forwardChaining: { type: 'object' },
        backwardChaining: { type: 'object' },
        conflictResolution: { type: 'object' },
        uncertaintyReasoning: { type: 'object' },
        truthMaintenance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'inference']
}));

export const explanationSystemTask = defineTask('explanation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Explanation System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Explanation System Designer',
      task: 'Design explanation capabilities',
      context: args,
      instructions: [
        '1. Design why explanations',
        '2. Design how explanations',
        '3. Plan what-if explanations',
        '4. Design trace visualization',
        '5. Plan confidence explanations',
        '6. Design user-level adaptation',
        '7. Plan natural language generation',
        '8. Document explanation system'
      ],
      outputFormat: 'JSON object with explanation system'
    },
    outputSchema: {
      type: 'object',
      required: ['whyExplanations', 'howExplanations', 'visualization'],
      properties: {
        whyExplanations: { type: 'object' },
        howExplanations: { type: 'object' },
        whatIfExplanations: { type: 'object' },
        visualization: { type: 'object' },
        confidenceExplanations: { type: 'object' },
        nlg: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'explanation']
}));

export const knowledgeValidationTask = defineTask('knowledge-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Validation Expert',
      task: 'Design knowledge validation framework',
      context: args,
      instructions: [
        '1. Design verification testing',
        '2. Plan validation testing',
        '3. Design consistency checks',
        '4. Plan completeness checks',
        '5. Design expert review process',
        '6. Plan case-based validation',
        '7. Design sensitivity analysis',
        '8. Document validation framework'
      ],
      outputFormat: 'JSON object with validation framework'
    },
    outputSchema: {
      type: 'object',
      required: ['verification', 'validation', 'expertReview'],
      properties: {
        verification: { type: 'object' },
        validation: { type: 'object' },
        consistencyChecks: { type: 'array' },
        completenessChecks: { type: 'array' },
        expertReview: { type: 'object' },
        caseValidation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'validation']
}));

export const knowledgeMaintenanceTask = defineTask('knowledge-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Maintenance Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Maintenance Planner',
      task: 'Plan knowledge base maintenance',
      context: args,
      instructions: [
        '1. Define update processes',
        '2. Plan knowledge refresh cycles',
        '3. Design change management',
        '4. Plan expert engagement',
        '5. Define quality monitoring',
        '6. Plan knowledge audits',
        '7. Design retirement process',
        '8. Document maintenance plan'
      ],
      outputFormat: 'JSON object with maintenance plan'
    },
    outputSchema: {
      type: 'object',
      required: ['updateProcesses', 'refreshCycles', 'changeManagement'],
      properties: {
        updateProcesses: { type: 'object' },
        refreshCycles: { type: 'object' },
        changeManagement: { type: 'object' },
        expertEngagement: { type: 'object' },
        qualityMonitoring: { type: 'object' },
        audits: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'knowledge-dss', 'maintenance']
}));
