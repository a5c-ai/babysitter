/**
 * @process civil-engineering/specifications-development
 * @description Development of technical specifications for construction including CSI format organization, material requirements, and execution procedures
 * @inputs { projectId: string, designDocuments: object, projectRequirements: object, referenceStandards: array }
 * @outputs { success: boolean, specificationsManual: object, referenceList: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    designDocuments,
    projectRequirements,
    referenceStandards,
    specFormat = 'CSI-MasterFormat',
    projectDeliveryMethod,
    outputDir = 'specifications-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Specifications Scope Definition
  ctx.log('info', 'Starting specifications development: Defining scope');
  const scopeDefinition = await ctx.task(specScopeDefinitionTask, {
    projectId,
    designDocuments,
    projectRequirements,
    specFormat,
    outputDir
  });

  if (!scopeDefinition.success) {
    return {
      success: false,
      error: 'Scope definition failed',
      details: scopeDefinition,
      metadata: { processId: 'civil-engineering/specifications-development', timestamp: startTime }
    };
  }

  artifacts.push(...scopeDefinition.artifacts);

  // Task 2: Division 01 - General Requirements
  ctx.log('info', 'Developing Division 01 General Requirements');
  const generalRequirements = await ctx.task(generalRequirementsTask, {
    projectId,
    projectRequirements,
    projectDeliveryMethod,
    outputDir
  });

  artifacts.push(...generalRequirements.artifacts);

  // Task 3: Technical Specifications Development
  ctx.log('info', 'Developing technical specifications');
  const technicalSpecs = await ctx.task(technicalSpecsTask, {
    projectId,
    scopeDefinition,
    designDocuments,
    referenceStandards,
    outputDir
  });

  artifacts.push(...technicalSpecs.artifacts);

  // Task 4: Material Specifications
  ctx.log('info', 'Developing material specifications');
  const materialSpecs = await ctx.task(materialSpecsTask, {
    projectId,
    designDocuments,
    referenceStandards,
    outputDir
  });

  artifacts.push(...materialSpecs.artifacts);

  // Task 5: Execution Procedures
  ctx.log('info', 'Developing execution procedures');
  const executionProcedures = await ctx.task(executionProceduresTask, {
    projectId,
    designDocuments,
    projectRequirements,
    outputDir
  });

  artifacts.push(...executionProcedures.artifacts);

  // Breakpoint: Review specifications
  await ctx.breakpoint({
    question: `Specifications development complete for ${projectId}. Total sections: ${technicalSpecs.sectionCount}. Review specifications?`,
    title: 'Specifications Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalSections: technicalSpecs.sectionCount,
        divisions: scopeDefinition.divisions,
        referenceStandardsCount: referenceStandards?.length || 0
      }
    }
  });

  // Task 6: Quality Assurance Specifications
  ctx.log('info', 'Developing QA specifications');
  const qaSpecs = await ctx.task(qaSpecsTask, {
    projectId,
    projectRequirements,
    technicalSpecs,
    outputDir
  });

  artifacts.push(...qaSpecs.artifacts);

  // Task 7: Reference Standards Compilation
  ctx.log('info', 'Compiling reference standards');
  const referenceCompilation = await ctx.task(referenceCompilationTask, {
    projectId,
    referenceStandards,
    technicalSpecs,
    outputDir
  });

  artifacts.push(...referenceCompilation.artifacts);

  // Task 8: Specifications Assembly
  ctx.log('info', 'Assembling specifications manual');
  const specsAssembly = await ctx.task(specsAssemblyTask, {
    projectId,
    scopeDefinition,
    generalRequirements,
    technicalSpecs,
    materialSpecs,
    executionProcedures,
    qaSpecs,
    referenceCompilation,
    outputDir
  });

  artifacts.push(...specsAssembly.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    specificationsManual: specsAssembly.manual,
    specificationSections: technicalSpecs.sections,
    referenceList: referenceCompilation.referenceList,
    tableOfContents: specsAssembly.toc,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/specifications-development',
      timestamp: startTime,
      projectId,
      specFormat,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const specScopeDefinitionTask = defineTask('spec-scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define specifications scope',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'senior specifications writer',
      task: 'Define specifications scope and organization',
      context: args,
      instructions: [
        'Review project scope and design documents',
        'Identify required specification sections',
        'Organize by CSI MasterFormat divisions',
        'Identify project-specific sections needed',
        'Define section numbering',
        'Identify reference specifications',
        'Create specifications outline',
        'Document scope assumptions'
      ],
      outputFormat: 'JSON with scope, outline, divisions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'divisions', 'sectionList', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        divisions: { type: 'array' },
        sectionList: { type: 'array' },
        specOutline: { type: 'object' },
        projectSpecificSections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'scope']
}));

// Task 2: General Requirements
export const generalRequirementsTask = defineTask('general-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Division 01 General Requirements',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'specifications writer',
      task: 'Develop Division 01 General Requirements specifications',
      context: args,
      instructions: [
        'Develop summary of work',
        'Define price and payment procedures',
        'Specify administrative requirements',
        'Define submittal procedures',
        'Specify quality requirements',
        'Define temporary facilities',
        'Specify product requirements',
        'Define execution requirements'
      ],
      outputFormat: 'JSON with Division 01 sections'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'artifacts'],
      properties: {
        sections: { type: 'array' },
        summaryOfWork: { type: 'object' },
        administrativeRequirements: { type: 'object' },
        submittalProcedures: { type: 'object' },
        qualityRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'general-requirements']
}));

// Task 3: Technical Specifications
export const technicalSpecsTask = defineTask('technical-specs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop technical specifications',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'technical specifications writer',
      task: 'Develop technical specification sections',
      context: args,
      instructions: [
        'Develop concrete specifications',
        'Develop reinforcing specifications',
        'Develop structural steel specifications',
        'Develop earthwork specifications',
        'Develop paving specifications',
        'Develop piping specifications',
        'Use three-part section format',
        'Include applicable standards'
      ],
      outputFormat: 'JSON with technical sections'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'sectionCount', 'artifacts'],
      properties: {
        sections: { type: 'array' },
        sectionCount: { type: 'number' },
        concreteSpecs: { type: 'object' },
        steelSpecs: { type: 'object' },
        earthworkSpecs: { type: 'object' },
        pavingSpecs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'technical']
}));

// Task 4: Material Specifications
export const materialSpecsTask = defineTask('material-specs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop material specifications',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'materials specification specialist',
      task: 'Develop material requirements specifications',
      context: args,
      instructions: [
        'Specify concrete materials',
        'Specify reinforcing steel grades',
        'Specify structural steel grades',
        'Specify aggregate requirements',
        'Specify pipe materials',
        'Specify coating and finish requirements',
        'Include material standards',
        'Specify substitution procedures'
      ],
      outputFormat: 'JSON with material specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['materialSpecs', 'artifacts'],
      properties: {
        materialSpecs: { type: 'object' },
        concreteMatls: { type: 'object' },
        steelMatls: { type: 'object' },
        aggregateSpecs: { type: 'object' },
        pipeMatls: { type: 'object' },
        substitutionProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'materials']
}));

// Task 5: Execution Procedures
export const executionProceduresTask = defineTask('execution-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop execution procedures',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'construction specifications writer',
      task: 'Develop execution and installation procedures',
      context: args,
      instructions: [
        'Specify concrete placement procedures',
        'Specify reinforcement installation',
        'Specify steel erection procedures',
        'Specify earthwork procedures',
        'Specify compaction requirements',
        'Specify tolerances',
        'Specify protection requirements',
        'Specify field quality control'
      ],
      outputFormat: 'JSON with execution procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'artifacts'],
      properties: {
        procedures: { type: 'object' },
        concretePlacement: { type: 'object' },
        rebarInstallation: { type: 'object' },
        steelErection: { type: 'object' },
        earthworkProcedures: { type: 'object' },
        tolerances: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'execution']
}));

// Task 6: QA Specifications
export const qaSpecsTask = defineTask('qa-specs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop QA specifications',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'quality assurance specialist',
      task: 'Develop quality assurance specifications',
      context: args,
      instructions: [
        'Specify testing requirements',
        'Define inspection requirements',
        'Specify testing frequency',
        'Define acceptance criteria',
        'Specify certification requirements',
        'Define non-conformance procedures',
        'Specify documentation requirements',
        'Define quality audits'
      ],
      outputFormat: 'JSON with QA specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['qaSpecs', 'artifacts'],
      properties: {
        qaSpecs: { type: 'object' },
        testingRequirements: { type: 'object' },
        inspectionRequirements: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        documentationRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'qa']
}));

// Task 7: Reference Compilation
export const referenceCompilationTask = defineTask('reference-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile reference standards',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'specifications writer',
      task: 'Compile reference standards list',
      context: args,
      instructions: [
        'List all referenced ASTM standards',
        'List all referenced ACI standards',
        'List all referenced AISC standards',
        'List all referenced AASHTO standards',
        'List other industry standards',
        'Verify current editions',
        'Organize by specification section',
        'Create comprehensive reference list'
      ],
      outputFormat: 'JSON with reference standards list'
    },
    outputSchema: {
      type: 'object',
      required: ['referenceList', 'artifacts'],
      properties: {
        referenceList: { type: 'array' },
        astmStandards: { type: 'array' },
        aciStandards: { type: 'array' },
        aiscStandards: { type: 'array' },
        aashtoStandards: { type: 'array' },
        otherStandards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'references']
}));

// Task 8: Specifications Assembly
export const specsAssemblyTask = defineTask('specs-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble specifications manual',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'specifications coordinator',
      task: 'Assemble project specifications manual',
      context: args,
      instructions: [
        'Create table of contents',
        'Organize sections by division',
        'Apply consistent formatting',
        'Number pages and sections',
        'Include cover sheet',
        'Include index',
        'Quality check all sections',
        'Produce final specifications package'
      ],
      outputFormat: 'JSON with assembled manual, TOC'
    },
    outputSchema: {
      type: 'object',
      required: ['manual', 'toc', 'artifacts'],
      properties: {
        manual: { type: 'object' },
        toc: { type: 'array' },
        sectionIndex: { type: 'array' },
        pageCount: { type: 'number' },
        formatChecklist: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'specifications', 'assembly']
}));
