/**
 * @process civil-engineering/construction-quality-control
 * @description Development and implementation of QA/QC programs including inspection protocols, testing requirements, and acceptance criteria
 * @inputs { projectId: string, projectSpecifications: object, constructionType: string, regulatoryRequirements: object }
 * @outputs { success: boolean, qcPlan: object, inspectionChecklists: array, testingProtocols: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    projectSpecifications,
    constructionType,
    regulatoryRequirements,
    contractRequirements,
    qualityStandards = 'ISO9001',
    outputDir = 'qc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Quality Requirements Analysis
  ctx.log('info', 'Starting QC development: Analyzing quality requirements');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectId,
    projectSpecifications,
    regulatoryRequirements,
    contractRequirements,
    outputDir
  });

  if (!requirementsAnalysis.success) {
    return {
      success: false,
      error: 'Requirements analysis failed',
      details: requirementsAnalysis,
      metadata: { processId: 'civil-engineering/construction-quality-control', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsAnalysis.artifacts);

  // Task 2: QC Plan Development
  ctx.log('info', 'Developing QC plan');
  const qcPlanDevelopment = await ctx.task(qcPlanDevelopmentTask, {
    projectId,
    requirementsAnalysis,
    constructionType,
    qualityStandards,
    outputDir
  });

  artifacts.push(...qcPlanDevelopment.artifacts);

  // Task 3: Inspection Protocols
  ctx.log('info', 'Developing inspection protocols');
  const inspectionProtocols = await ctx.task(inspectionProtocolsTask, {
    projectId,
    qcPlanDevelopment,
    projectSpecifications,
    outputDir
  });

  artifacts.push(...inspectionProtocols.artifacts);

  // Task 4: Testing Requirements
  ctx.log('info', 'Defining testing requirements');
  const testingRequirements = await ctx.task(testingRequirementsTask, {
    projectId,
    projectSpecifications,
    constructionType,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...testingRequirements.artifacts);

  // Task 5: Acceptance Criteria
  ctx.log('info', 'Establishing acceptance criteria');
  const acceptanceCriteria = await ctx.task(acceptanceCriteriaTask, {
    projectId,
    projectSpecifications,
    testingRequirements,
    outputDir
  });

  artifacts.push(...acceptanceCriteria.artifacts);

  // Breakpoint: Review QC program
  await ctx.breakpoint({
    question: `QC program development complete for ${projectId}. Review QC plan and inspection protocols?`,
    title: 'Quality Control Program Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        inspectionPoints: inspectionProtocols.holdPoints.length,
        witnessPoints: inspectionProtocols.witnessPoints.length,
        testTypes: testingRequirements.testTypes.length,
        checklistCount: inspectionProtocols.checklists.length
      }
    }
  });

  // Task 6: Inspection Checklists
  ctx.log('info', 'Creating inspection checklists');
  const inspectionChecklists = await ctx.task(inspectionChecklistsTask, {
    projectId,
    inspectionProtocols,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...inspectionChecklists.artifacts);

  // Task 7: Non-Conformance Procedures
  ctx.log('info', 'Developing non-conformance procedures');
  const nonConformanceProcedures = await ctx.task(nonConformanceProceduresTask, {
    projectId,
    qcPlanDevelopment,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...nonConformanceProcedures.artifacts);

  // Task 8: QC Documentation Package
  ctx.log('info', 'Generating QC documentation package');
  const qcDocumentation = await ctx.task(qcDocumentationTask, {
    projectId,
    qcPlanDevelopment,
    inspectionProtocols,
    testingRequirements,
    acceptanceCriteria,
    inspectionChecklists,
    nonConformanceProcedures,
    outputDir
  });

  artifacts.push(...qcDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qcPlan: qcPlanDevelopment.plan,
    inspectionChecklists: inspectionChecklists.checklists,
    testingProtocols: testingRequirements.protocols,
    acceptanceCriteria: acceptanceCriteria.criteria,
    nonConformanceProcedures: nonConformanceProcedures.procedures,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/construction-quality-control',
      timestamp: startTime,
      projectId,
      qualityStandards,
      outputDir
    }
  };
}

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze quality requirements',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality assurance manager',
      task: 'Analyze project quality requirements',
      context: args,
      instructions: [
        'Review project specifications for quality requirements',
        'Identify regulatory quality requirements',
        'Review contract quality provisions',
        'Identify critical quality elements',
        'Document material testing requirements',
        'Identify workmanship standards',
        'List applicable standards and codes',
        'Create requirements matrix'
      ],
      outputFormat: 'JSON with quality requirements, matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirements: { type: 'object' },
        criticalElements: { type: 'array' },
        testingRequirements: { type: 'array' },
        applicableStandards: { type: 'array' },
        requirementsMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'requirements']
}));

// Task 2: QC Plan Development
export const qcPlanDevelopmentTask = defineTask('qc-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop QC plan',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality assurance manager',
      task: 'Develop project quality control plan',
      context: args,
      instructions: [
        'Define QC organization and responsibilities',
        'Establish QC procedures',
        'Define inspection and test plan (ITP)',
        'Identify hold points and witness points',
        'Establish documentation requirements',
        'Define corrective action procedures',
        'Establish training requirements',
        'Create QC plan document'
      ],
      outputFormat: 'JSON with QC plan, organization, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        organization: { type: 'object' },
        procedures: { type: 'array' },
        itp: { type: 'object' },
        documentationRequirements: { type: 'array' },
        trainingRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'qc-plan']
}));

// Task 3: Inspection Protocols
export const inspectionProtocolsTask = defineTask('inspection-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop inspection protocols',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality control inspector',
      task: 'Develop construction inspection protocols',
      context: args,
      instructions: [
        'Define inspection types (receiving, in-process, final)',
        'Identify hold points requiring verification',
        'Identify witness points',
        'Define inspection frequency',
        'Establish inspection methods',
        'Define inspection documentation',
        'Create inspection schedule',
        'Develop inspector qualifications'
      ],
      outputFormat: 'JSON with inspection protocols, hold points'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'holdPoints', 'witnessPoints', 'checklists', 'artifacts'],
      properties: {
        protocols: { type: 'array' },
        holdPoints: { type: 'array' },
        witnessPoints: { type: 'array' },
        inspectionSchedule: { type: 'object' },
        inspectorQualifications: { type: 'object' },
        checklists: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'inspection']
}));

// Task 4: Testing Requirements
export const testingRequirementsTask = defineTask('testing-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define testing requirements',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality control engineer',
      task: 'Define material and construction testing requirements',
      context: args,
      instructions: [
        'Identify required material tests',
        'Define test methods (ASTM, AASHTO)',
        'Establish testing frequency',
        'Identify laboratory requirements',
        'Define field testing requirements',
        'Establish sample collection procedures',
        'Define test report requirements',
        'Create testing protocols'
      ],
      outputFormat: 'JSON with testing requirements, protocols'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'testTypes', 'artifacts'],
      properties: {
        protocols: { type: 'array' },
        testTypes: { type: 'array' },
        testMethods: { type: 'object' },
        testingFrequency: { type: 'object' },
        laboratoryRequirements: { type: 'object' },
        fieldTestingRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'testing']
}));

// Task 5: Acceptance Criteria
export const acceptanceCriteriaTask = defineTask('acceptance-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish acceptance criteria',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality control engineer',
      task: 'Establish quality acceptance criteria',
      context: args,
      instructions: [
        'Define material acceptance criteria',
        'Define workmanship acceptance criteria',
        'Establish dimensional tolerances',
        'Define test result acceptance limits',
        'Establish visual inspection criteria',
        'Define rejection criteria',
        'Document acceptance basis',
        'Create acceptance criteria matrix'
      ],
      outputFormat: 'JSON with acceptance criteria by category'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: { type: 'object' },
        materialCriteria: { type: 'object' },
        workmanshipCriteria: { type: 'object' },
        tolerances: { type: 'object' },
        testLimits: { type: 'object' },
        rejectionCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'acceptance']
}));

// Task 6: Inspection Checklists
export const inspectionChecklistsTask = defineTask('inspection-checklists', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create inspection checklists',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality control inspector',
      task: 'Create construction inspection checklists',
      context: args,
      instructions: [
        'Create concrete placement checklist',
        'Create reinforcement inspection checklist',
        'Create structural steel checklist',
        'Create earthwork compaction checklist',
        'Create piping inspection checklist',
        'Create paving inspection checklist',
        'Include acceptance criteria on checklists',
        'Format for field use'
      ],
      outputFormat: 'JSON with inspection checklists'
    },
    outputSchema: {
      type: 'object',
      required: ['checklists', 'artifacts'],
      properties: {
        checklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              items: { type: 'array' }
            }
          }
        },
        checklistForms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'checklists']
}));

// Task 7: Non-Conformance Procedures
export const nonConformanceProceduresTask = defineTask('non-conformance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop non-conformance procedures',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality assurance manager',
      task: 'Develop non-conformance handling procedures',
      context: args,
      instructions: [
        'Define non-conformance identification process',
        'Establish NCR documentation requirements',
        'Define disposition options (use as-is, repair, reject)',
        'Establish approval authorities',
        'Define corrective action requirements',
        'Establish root cause analysis procedures',
        'Define closure requirements',
        'Create NCR forms and tracking'
      ],
      outputFormat: 'JSON with NCR procedures, forms'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'artifacts'],
      properties: {
        procedures: { type: 'object' },
        ncrProcess: { type: 'object' },
        dispositionOptions: { type: 'array' },
        approvalAuthorities: { type: 'object' },
        correctiveActionProcess: { type: 'object' },
        ncrForms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'ncr']
}));

// Task 8: QC Documentation Package
export const qcDocumentationTask = defineTask('qc-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate QC documentation package',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'quality documentation specialist',
      task: 'Generate QC documentation package',
      context: args,
      instructions: [
        'Compile QC plan document',
        'Include inspection and test plan',
        'Include all inspection checklists',
        'Include testing protocols',
        'Include acceptance criteria',
        'Include NCR procedures',
        'Include forms and templates',
        'Create document index'
      ],
      outputFormat: 'JSON with documentation package, index'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPackage', 'artifacts'],
      properties: {
        documentPackage: { type: 'object' },
        documentIndex: { type: 'array' },
        forms: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'quality', 'documentation']
}));
