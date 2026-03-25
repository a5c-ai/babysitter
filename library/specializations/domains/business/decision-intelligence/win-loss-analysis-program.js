/**
 * @process specializations/domains/business/decision-intelligence/win-loss-analysis-program
 * @description Win/Loss Analysis Program - Structured methodology for analyzing sales outcomes to understand
 * competitive dynamics, buyer preferences, and improvement opportunities.
 * @inputs { projectName: string, salesContext: object, analysisScope: object, stakeholders: array, dataAccess?: object }
 * @outputs { success: boolean, programDesign: object, interviewFramework: object, analysisMethodology: object, insightsDissemination: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/win-loss-analysis-program', {
 *   projectName: 'Enterprise Win/Loss Program',
 *   salesContext: { avgDealSize: '$100K+', salesCycle: '6 months', segments: ['Enterprise'] },
 *   analysisScope: { wins: true, losses: true, noDecisions: true },
 *   stakeholders: ['Sales Leadership', 'Product', 'Marketing']
 * });
 *
 * @references
 * - Fuld & Company: https://www.fuld.com/
 * - Win/Loss Analysis Best Practices: Clozd, Primary Intelligence
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    salesContext = {},
    analysisScope = {},
    stakeholders = [],
    dataAccess = {},
    outputDir = 'win-loss-output'
  } = inputs;

  // Phase 1: Program Design
  const programDesign = await ctx.task(programDesignTask, {
    projectName,
    salesContext,
    analysisScope,
    stakeholders
  });

  // Phase 2: Interview Framework Development
  const interviewFramework = await ctx.task(interviewFrameworkTask, {
    projectName,
    salesContext,
    programDesign,
    analysisScope
  });

  // Phase 3: Data Collection Process
  const dataCollectionProcess = await ctx.task(dataCollectionTask, {
    projectName,
    interviewFramework,
    salesContext,
    dataAccess
  });

  // Phase 4: Analysis Methodology
  const analysisMethodology = await ctx.task(analysisMethodologyTask, {
    projectName,
    interviewFramework,
    dataCollectionProcess,
    analysisScope
  });

  // Breakpoint: Review program design
  await ctx.breakpoint({
    question: `Review win/loss program design for ${projectName}. Is the methodology comprehensive?`,
    title: 'Win/Loss Program Review',
    context: {
      runId: ctx.runId,
      projectName,
      interviewQuestions: interviewFramework.questions?.length || 0,
      analysisDimensions: analysisMethodology.dimensions?.length || 0
    }
  });

  // Phase 5: Insights Dissemination
  const insightsDissemination = await ctx.task(insightsDisseminationTask, {
    projectName,
    stakeholders,
    analysisMethodology
  });

  // Phase 6: Action Planning Framework
  const actionPlanningFramework = await ctx.task(actionPlanningTask, {
    projectName,
    stakeholders,
    analysisMethodology,
    insightsDissemination
  });

  // Phase 7: Program Operations
  const programOperations = await ctx.task(programOperationsTask, {
    projectName,
    programDesign,
    dataCollectionProcess,
    analysisMethodology,
    insightsDissemination
  });

  // Phase 8: Success Metrics and Governance
  const programGovernance = await ctx.task(programGovernanceTask, {
    projectName,
    programDesign,
    stakeholders
  });

  return {
    success: true,
    projectName,
    programDesign,
    interviewFramework,
    dataCollectionProcess,
    analysisMethodology,
    insightsDissemination,
    actionPlanningFramework,
    programOperations,
    programGovernance,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/win-loss-analysis-program',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Win/Loss Program Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Program Designer',
      task: 'Design comprehensive win/loss analysis program',
      context: args,
      instructions: [
        '1. Define program objectives and scope',
        '2. Determine analysis types (wins, losses, no decisions)',
        '3. Define selection criteria and sampling',
        '4. Establish internal vs third-party execution model',
        '5. Define program cadence and volume',
        '6. Identify key stakeholders and sponsors',
        '7. Estimate resource requirements',
        '8. Create program charter and governance'
      ],
      outputFormat: 'JSON object with program design'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'scope', 'model'],
      properties: {
        objectives: { type: 'array' },
        scope: { type: 'object' },
        model: { type: 'object' },
        sampling: { type: 'object' },
        resources: { type: 'object' },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'program-design']
}));

export const interviewFrameworkTask = defineTask('interview-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview Framework Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Interview Specialist',
      task: 'Develop comprehensive interview framework for win/loss analysis',
      context: args,
      instructions: [
        '1. Design interview structure and flow',
        '2. Create core question framework',
        '3. Develop probing and follow-up questions',
        '4. Create scenario-specific question modules',
        '5. Design buyer journey mapping questions',
        '6. Develop competitive evaluation questions',
        '7. Create decision criteria exploration questions',
        '8. Design post-interview processing protocols'
      ],
      outputFormat: 'JSON object with interview framework'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'questions', 'protocols'],
      properties: {
        structure: { type: 'object' },
        questions: { type: 'array' },
        modules: { type: 'array' },
        probingGuides: { type: 'array' },
        protocols: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'interviews']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Collection Process - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Data Collection Specialist',
      task: 'Design data collection process for win/loss program',
      context: args,
      instructions: [
        '1. Design interview scheduling workflow',
        '2. Create pre-interview data gathering process',
        '3. Define CRM and internal data integration',
        '4. Design interview documentation process',
        '5. Create transcription and coding standards',
        '6. Define data quality validation',
        '7. Design secure data storage',
        '8. Create participant incentive program'
      ],
      outputFormat: 'JSON object with data collection process'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'integration', 'documentation'],
      properties: {
        workflow: { type: 'object' },
        integration: { type: 'object' },
        documentation: { type: 'object' },
        validation: { type: 'object' },
        storage: { type: 'object' },
        incentives: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'data-collection']
}));

export const analysisMethodologyTask = defineTask('analysis-methodology', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Methodology - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Analyst',
      task: 'Define analysis methodology for win/loss insights',
      context: args,
      instructions: [
        '1. Define analysis dimensions and categories',
        '2. Create coding and tagging taxonomy',
        '3. Design quantitative analysis framework',
        '4. Develop qualitative analysis approach',
        '5. Create trend analysis methodology',
        '6. Design competitive analysis framework',
        '7. Develop root cause analysis approach',
        '8. Create insight validation process'
      ],
      outputFormat: 'JSON object with analysis methodology'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'taxonomy', 'frameworks'],
      properties: {
        dimensions: { type: 'array' },
        taxonomy: { type: 'object' },
        frameworks: { type: 'array' },
        quantitative: { type: 'object' },
        qualitative: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'analysis']
}));

export const insightsDisseminationTask = defineTask('insights-dissemination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insights Dissemination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Insights Communicator',
      task: 'Design insights dissemination strategy',
      context: args,
      instructions: [
        '1. Define report types and formats',
        '2. Create stakeholder-specific views',
        '3. Design executive summary format',
        '4. Develop dashboard and visualization',
        '5. Create deal-level summary templates',
        '6. Design aggregate trend reports',
        '7. Plan distribution and communication',
        '8. Create searchable insights repository'
      ],
      outputFormat: 'JSON object with dissemination strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'dashboards', 'distribution'],
      properties: {
        reports: { type: 'array' },
        dashboards: { type: 'object' },
        templates: { type: 'array' },
        distribution: { type: 'object' },
        repository: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'dissemination']
}));

export const actionPlanningTask = defineTask('action-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Planning Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Action Planning Specialist',
      task: 'Develop action planning framework for win/loss insights',
      context: args,
      instructions: [
        '1. Design insight-to-action workflow',
        '2. Create recommendation frameworks',
        '3. Define prioritization criteria',
        '4. Design action item tracking',
        '5. Create cross-functional alignment process',
        '6. Define accountability mechanisms',
        '7. Design impact measurement approach',
        '8. Create closed-loop feedback process'
      ],
      outputFormat: 'JSON object with action planning framework'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'prioritization', 'tracking'],
      properties: {
        workflow: { type: 'object' },
        recommendations: { type: 'object' },
        prioritization: { type: 'object' },
        tracking: { type: 'object' },
        accountability: { type: 'object' },
        impact: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'action-planning']
}));

export const programOperationsTask = defineTask('program-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Program Operations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Program Manager',
      task: 'Define operational processes for win/loss program',
      context: args,
      instructions: [
        '1. Define team roles and responsibilities',
        '2. Create operational workflows',
        '3. Design quality assurance process',
        '4. Define capacity planning approach',
        '5. Create vendor management (if applicable)',
        '6. Design escalation procedures',
        '7. Define continuous improvement process',
        '8. Create operational metrics and SLAs'
      ],
      outputFormat: 'JSON object with program operations'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'workflows', 'qa'],
      properties: {
        roles: { type: 'object' },
        workflows: { type: 'array' },
        qa: { type: 'object' },
        capacity: { type: 'object' },
        vendors: { type: 'object' },
        metrics: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'operations']
}));

export const programGovernanceTask = defineTask('program-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Program Governance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Governance Specialist',
      task: 'Define governance and success metrics for win/loss program',
      context: args,
      instructions: [
        '1. Define program success metrics',
        '2. Create ROI measurement framework',
        '3. Design executive review cadence',
        '4. Define steering committee structure',
        '5. Create risk management framework',
        '6. Design compliance and ethics guidelines',
        '7. Define program evolution roadmap',
        '8. Create stakeholder satisfaction tracking'
      ],
      outputFormat: 'JSON object with program governance'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'governance', 'roadmap'],
      properties: {
        metrics: { type: 'array' },
        roi: { type: 'object' },
        governance: { type: 'object' },
        risks: { type: 'array' },
        compliance: { type: 'object' },
        roadmap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'win-loss', 'governance']
}));
