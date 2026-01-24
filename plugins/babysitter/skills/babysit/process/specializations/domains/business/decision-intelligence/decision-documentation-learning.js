/**
 * @process specializations/domains/business/decision-intelligence/decision-documentation-learning
 * @description Decision Documentation and Learning - Systematic capture of decision rationale, assumptions,
 * and outcomes to enable organizational learning and decision quality improvement.
 * @inputs { projectName: string, decisionDetails: object, stakeholders: array, organizationContext?: object }
 * @outputs { success: boolean, decisionRecord: object, learningFramework: object, knowledgeRepository: object, improvementProcess: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/decision-documentation-learning', {
 *   projectName: 'Strategic Decision Documentation Program',
 *   decisionDetails: { type: 'strategic', domain: 'operations' },
 *   stakeholders: ['Executive Team', 'Strategy Team', 'Operations']
 * });
 *
 * @references
 * - Before You Make That Big Decision: https://hbr.org/2011/06/before-you-make-that-big-decision
 * - Organizational Learning: Peter Senge
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    decisionDetails = {},
    stakeholders = [],
    organizationContext = {},
    outputDir = 'decision-documentation-output'
  } = inputs;

  // Phase 1: Documentation Framework Design
  const frameworkDesign = await ctx.task(frameworkDesignTask, {
    projectName,
    decisionDetails,
    organizationContext
  });

  // Phase 2: Decision Record Template
  const recordTemplate = await ctx.task(recordTemplateTask, {
    projectName,
    frameworkDesign,
    decisionDetails
  });

  // Phase 3: Capture Process Design
  const captureProcess = await ctx.task(captureProcessTask, {
    projectName,
    recordTemplate,
    stakeholders
  });

  // Phase 4: Outcome Tracking System
  const outcomeTracking = await ctx.task(outcomeTrackingTask, {
    projectName,
    captureProcess,
    decisionDetails
  });

  // Phase 5: Knowledge Repository Design
  const knowledgeRepository = await ctx.task(knowledgeRepositoryTask, {
    projectName,
    recordTemplate,
    outcomeTracking,
    organizationContext
  });

  // Breakpoint: Review documentation framework
  await ctx.breakpoint({
    question: `Review decision documentation framework for ${projectName}. Is it practical for regular use?`,
    title: 'Documentation Framework Review',
    context: {
      runId: ctx.runId,
      projectName
    }
  });

  // Phase 6: Learning Process Design
  const learningProcess = await ctx.task(learningProcessTask, {
    projectName,
    knowledgeRepository,
    outcomeTracking,
    stakeholders
  });

  // Phase 7: Review and Improvement Cycle
  const improvementCycle = await ctx.task(improvementCycleTask, {
    projectName,
    learningProcess,
    outcomeTracking
  });

  // Phase 8: Implementation and Governance
  const implementationPlan = await ctx.task(documentationImplementationTask, {
    projectName,
    frameworkDesign,
    captureProcess,
    knowledgeRepository,
    learningProcess,
    stakeholders
  });

  return {
    success: true,
    projectName,
    decisionRecord: {
      framework: frameworkDesign,
      template: recordTemplate,
      captureProcess
    },
    outcomeTracking,
    learningFramework: learningProcess,
    knowledgeRepository,
    improvementProcess: improvementCycle,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/decision-documentation-learning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Framework Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Documentation Architect',
      task: 'Design decision documentation framework',
      context: args,
      instructions: [
        '1. Define documentation objectives',
        '2. Identify decision types to document',
        '3. Define documentation triggers',
        '4. Design documentation hierarchy',
        '5. Define minimum viable documentation',
        '6. Create tiered documentation levels',
        '7. Define retention and archival policies',
        '8. Align with organizational processes'
      ],
      outputFormat: 'JSON object with framework design'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'scope', 'tiers'],
      properties: {
        objectives: { type: 'array' },
        scope: { type: 'object' },
        triggers: { type: 'array' },
        hierarchy: { type: 'object' },
        tiers: { type: 'array' },
        retention: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'framework']
}));

export const recordTemplateTask = defineTask('record-template', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Record Template - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Record Designer',
      task: 'Design decision record template',
      context: args,
      instructions: [
        '1. Define decision context fields',
        '2. Create objectives and criteria section',
        '3. Design alternatives documentation',
        '4. Create rationale capture section',
        '5. Define assumptions documentation',
        '6. Create risk and uncertainty section',
        '7. Design outcome prediction fields',
        '8. Create review trigger section'
      ],
      outputFormat: 'JSON object with record template'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'sections', 'fields'],
      properties: {
        template: { type: 'object' },
        sections: { type: 'array' },
        fields: { type: 'array' },
        requiredFields: { type: 'array' },
        optionalFields: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'template']
}));

export const captureProcessTask = defineTask('capture-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture Process Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Capture Process Designer',
      task: 'Design decision capture process and workflow',
      context: args,
      instructions: [
        '1. Define capture timing (pre/post decision)',
        '2. Design capture workflow',
        '3. Assign documentation roles',
        '4. Create quality checks',
        '5. Design approval workflow',
        '6. Plan integration with decision process',
        '7. Create capture guidelines',
        '8. Design exception handling'
      ],
      outputFormat: 'JSON object with capture process'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'roles', 'timing'],
      properties: {
        workflow: { type: 'object' },
        timing: { type: 'object' },
        roles: { type: 'object' },
        qualityChecks: { type: 'array' },
        guidelines: { type: 'array' },
        exceptions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'capture']
}));

export const outcomeTrackingTask = defineTask('outcome-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Outcome Tracking System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Outcome Tracker',
      task: 'Design outcome tracking system',
      context: args,
      instructions: [
        '1. Define outcome metrics to track',
        '2. Design outcome capture process',
        '3. Create prediction-outcome comparison',
        '4. Define tracking timelines',
        '5. Design variance analysis',
        '6. Create attribution methodology',
        '7. Plan outcome review triggers',
        '8. Design outcome visualization'
      ],
      outputFormat: 'JSON object with outcome tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'process', 'comparison'],
      properties: {
        metrics: { type: 'array' },
        process: { type: 'object' },
        timelines: { type: 'object' },
        comparison: { type: 'object' },
        varianceAnalysis: { type: 'object' },
        visualization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'outcomes']
}));

export const knowledgeRepositoryTask = defineTask('knowledge-repository', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge Repository Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Knowledge Management Architect',
      task: 'Design decision knowledge repository',
      context: args,
      instructions: [
        '1. Design repository architecture',
        '2. Create taxonomy and classification',
        '3. Design search and discovery',
        '4. Plan access control',
        '5. Create linkage to other systems',
        '6. Design knowledge extraction',
        '7. Plan maintenance and curation',
        '8. Create user interface requirements'
      ],
      outputFormat: 'JSON object with knowledge repository'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'taxonomy', 'search'],
      properties: {
        architecture: { type: 'object' },
        taxonomy: { type: 'object' },
        search: { type: 'object' },
        accessControl: { type: 'object' },
        integrations: { type: 'array' },
        maintenance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'repository']
}));

export const learningProcessTask = defineTask('learning-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Learning Process Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Organizational Learning Specialist',
      task: 'Design decision learning process',
      context: args,
      instructions: [
        '1. Design after-action review process',
        '2. Create pattern identification methodology',
        '3. Design insight extraction process',
        '4. Plan knowledge dissemination',
        '5. Create learning integration mechanism',
        '6. Design cross-decision learning',
        '7. Plan case study development',
        '8. Create learning metrics'
      ],
      outputFormat: 'JSON object with learning process'
    },
    outputSchema: {
      type: 'object',
      required: ['afterAction', 'patterns', 'dissemination'],
      properties: {
        afterAction: { type: 'object' },
        patterns: { type: 'object' },
        insightExtraction: { type: 'object' },
        dissemination: { type: 'object' },
        caseStudies: { type: 'object' },
        metrics: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'learning']
}));

export const improvementCycleTask = defineTask('improvement-cycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review and Improvement Cycle - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Improvement Specialist',
      task: 'Design review and improvement cycle',
      context: args,
      instructions: [
        '1. Design periodic review cadence',
        '2. Create review agenda and process',
        '3. Define improvement identification',
        '4. Plan improvement implementation',
        '5. Design feedback integration',
        '6. Create success measurement',
        '7. Plan governance reviews',
        '8. Design continuous improvement loop'
      ],
      outputFormat: 'JSON object with improvement cycle'
    },
    outputSchema: {
      type: 'object',
      required: ['reviews', 'improvements', 'governance'],
      properties: {
        reviews: { type: 'object' },
        cadence: { type: 'object' },
        improvements: { type: 'object' },
        implementation: { type: 'object' },
        feedback: { type: 'object' },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'improvement']
}));

export const documentationImplementationTask = defineTask('documentation-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation and Governance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Implementation Manager',
      task: 'Create implementation and governance plan',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create rollout plan',
        '3. Design training program',
        '4. Define governance structure',
        '5. Assign roles and responsibilities',
        '6. Create success metrics',
        '7. Plan change management',
        '8. Define sustainability measures'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'governance', 'training'],
      properties: {
        phases: { type: 'array' },
        rollout: { type: 'object' },
        training: { type: 'object' },
        governance: { type: 'object' },
        roles: { type: 'object' },
        metrics: { type: 'array' },
        changeManagement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'documentation', 'implementation']
}));
