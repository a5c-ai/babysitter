/**
 * @process civil-engineering/permit-application-preparation
 * @description Preparation of permit applications including building permits, environmental permits, and regulatory agency submissions
 * @inputs { projectId: string, designDocuments: object, siteInformation: object, environmentalDocumentation: object }
 * @outputs { success: boolean, permitApplications: array, supportingDocuments: array, agencyCorrespondence: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    designDocuments,
    siteInformation,
    environmentalDocumentation,
    projectDescription,
    jurisdictions,
    outputDir = 'permit-application-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Permit Requirements Identification
  ctx.log('info', 'Starting permit preparation: Identifying requirements');
  const permitRequirements = await ctx.task(permitRequirementsTask, {
    projectId,
    projectDescription,
    siteInformation,
    jurisdictions,
    outputDir
  });

  if (!permitRequirements.success) {
    return {
      success: false,
      error: 'Permit requirements identification failed',
      details: permitRequirements,
      metadata: { processId: 'civil-engineering/permit-application-preparation', timestamp: startTime }
    };
  }

  artifacts.push(...permitRequirements.artifacts);

  // Task 2: Building Permit Application
  ctx.log('info', 'Preparing building permit application');
  const buildingPermit = await ctx.task(buildingPermitTask, {
    projectId,
    designDocuments,
    siteInformation,
    projectDescription,
    outputDir
  });

  artifacts.push(...buildingPermit.artifacts);

  // Task 3: Site/Civil Permit Application
  ctx.log('info', 'Preparing site/civil permit application');
  const sitePermit = await ctx.task(sitePermitTask, {
    projectId,
    designDocuments,
    siteInformation,
    environmentalDocumentation,
    outputDir
  });

  artifacts.push(...sitePermit.artifacts);

  // Task 4: Environmental Permits
  ctx.log('info', 'Preparing environmental permit applications');
  const environmentalPermits = await ctx.task(environmentalPermitsTask, {
    projectId,
    siteInformation,
    environmentalDocumentation,
    permitRequirements,
    outputDir
  });

  artifacts.push(...environmentalPermits.artifacts);

  // Task 5: Utility Permits
  ctx.log('info', 'Preparing utility permit applications');
  const utilityPermits = await ctx.task(utilityPermitsTask, {
    projectId,
    designDocuments,
    siteInformation,
    outputDir
  });

  artifacts.push(...utilityPermits.artifacts);

  // Breakpoint: Review permit applications
  const totalPermits = buildingPermit.applicationCount +
                       sitePermit.applicationCount +
                       environmentalPermits.applicationCount +
                       utilityPermits.applicationCount;
  await ctx.breakpoint({
    question: `Permit applications prepared for ${projectId}. Total permits: ${totalPermits}. Review applications before submission?`,
    title: 'Permit Application Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        buildingPermits: buildingPermit.applicationCount,
        sitePermits: sitePermit.applicationCount,
        environmentalPermits: environmentalPermits.applicationCount,
        utilityPermits: utilityPermits.applicationCount,
        estimatedReviewTime: permitRequirements.estimatedReviewTime
      }
    }
  });

  // Task 6: Supporting Documentation Assembly
  ctx.log('info', 'Assembling supporting documentation');
  const supportingDocs = await ctx.task(supportingDocsTask, {
    projectId,
    buildingPermit,
    sitePermit,
    environmentalPermits,
    utilityPermits,
    outputDir
  });

  artifacts.push(...supportingDocs.artifacts);

  // Task 7: Permit Fee Calculation
  ctx.log('info', 'Calculating permit fees');
  const feeCalculation = await ctx.task(feeCalculationTask, {
    projectId,
    permitRequirements,
    buildingPermit,
    sitePermit,
    outputDir
  });

  artifacts.push(...feeCalculation.artifacts);

  // Task 8: Permit Submission Package
  ctx.log('info', 'Preparing permit submission packages');
  const submissionPackage = await ctx.task(submissionPackageTask, {
    projectId,
    permitRequirements,
    buildingPermit,
    sitePermit,
    environmentalPermits,
    utilityPermits,
    supportingDocs,
    feeCalculation,
    outputDir
  });

  artifacts.push(...submissionPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    permitApplications: submissionPackage.applications,
    supportingDocuments: supportingDocs.documents,
    feesSummary: feeCalculation.summary,
    submissionChecklist: submissionPackage.checklist,
    agencyCorrespondence: submissionPackage.correspondence,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/permit-application-preparation',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Permit Requirements Identification
export const permitRequirementsTask = defineTask('permit-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify permit requirements',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'permit coordinator',
      task: 'Identify all required permits for project',
      context: args,
      instructions: [
        'Identify building permit requirements',
        'Identify site/grading permit requirements',
        'Identify environmental permit requirements',
        'Identify utility permit requirements',
        'Identify right-of-way permits',
        'Determine review agencies',
        'Establish permit sequence/dependencies',
        'Estimate review timelines'
      ],
      outputFormat: 'JSON with permit list, requirements, timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'permitList', 'estimatedReviewTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        permitList: { type: 'array' },
        reviewAgencies: { type: 'array' },
        permitSequence: { type: 'array' },
        estimatedReviewTime: { type: 'string' },
        requirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'requirements']
}));

// Task 2: Building Permit Application
export const buildingPermitTask = defineTask('building-permit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare building permit application',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'permit coordinator',
      task: 'Prepare building permit application',
      context: args,
      instructions: [
        'Complete permit application form',
        'Prepare project description',
        'Compile structural calculations',
        'Prepare code compliance statement',
        'Compile architectural drawings',
        'Compile structural drawings',
        'Prepare energy compliance documentation',
        'Assemble required certifications'
      ],
      outputFormat: 'JSON with building permit application, documents'
    },
    outputSchema: {
      type: 'object',
      required: ['application', 'applicationCount', 'artifacts'],
      properties: {
        application: { type: 'object' },
        applicationCount: { type: 'number' },
        applicationForm: { type: 'object' },
        projectDescription: { type: 'string' },
        codeCompliance: { type: 'object' },
        requiredDrawings: { type: 'array' },
        certifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'building']
}));

// Task 3: Site/Civil Permit Application
export const sitePermitTask = defineTask('site-permit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare site/civil permit application',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'civil engineer',
      task: 'Prepare site development permit application',
      context: args,
      instructions: [
        'Complete grading permit application',
        'Prepare erosion control plan',
        'Compile stormwater management report',
        'Prepare site plan',
        'Prepare utility plan',
        'Compile geotechnical report',
        'Prepare traffic study summary',
        'Include drainage calculations'
      ],
      outputFormat: 'JSON with site permit application, documents'
    },
    outputSchema: {
      type: 'object',
      required: ['application', 'applicationCount', 'artifacts'],
      properties: {
        application: { type: 'object' },
        applicationCount: { type: 'number' },
        gradingPermit: { type: 'object' },
        erosionControlPlan: { type: 'object' },
        stormwaterReport: { type: 'object' },
        requiredPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'site']
}));

// Task 4: Environmental Permits
export const environmentalPermitsTask = defineTask('environmental-permits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare environmental permit applications',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'environmental permit specialist',
      task: 'Prepare environmental permit applications',
      context: args,
      instructions: [
        'Prepare NPDES permit application',
        'Prepare wetland permit if required',
        'Prepare stream crossing permit',
        'Prepare air quality permit if needed',
        'Compile environmental assessments',
        'Prepare mitigation plans',
        'Complete agency-specific forms',
        'Compile supporting environmental data'
      ],
      outputFormat: 'JSON with environmental permit applications'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'applicationCount', 'artifacts'],
      properties: {
        applications: { type: 'array' },
        applicationCount: { type: 'number' },
        npdesPermit: { type: 'object' },
        wetlandPermit: { type: 'object' },
        mitigationPlans: { type: 'array' },
        environmentalAssessments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'environmental']
}));

// Task 5: Utility Permits
export const utilityPermitsTask = defineTask('utility-permits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare utility permit applications',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'utility coordinator',
      task: 'Prepare utility permit applications',
      context: args,
      instructions: [
        'Prepare water connection permit',
        'Prepare sewer connection permit',
        'Prepare electric service application',
        'Prepare gas service application',
        'Prepare encroachment permits',
        'Coordinate with utility companies',
        'Compile utility plans',
        'Prepare easement documentation'
      ],
      outputFormat: 'JSON with utility permit applications'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'applicationCount', 'artifacts'],
      properties: {
        applications: { type: 'array' },
        applicationCount: { type: 'number' },
        waterPermit: { type: 'object' },
        sewerPermit: { type: 'object' },
        electricApplication: { type: 'object' },
        encroachmentPermits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'utility']
}));

// Task 6: Supporting Documentation Assembly
export const supportingDocsTask = defineTask('supporting-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble supporting documentation',
  agent: {
    name: 'environmental-permit-specialist',
    prompt: {
      role: 'document coordinator',
      task: 'Assemble permit supporting documentation',
      context: args,
      instructions: [
        'Compile property ownership documents',
        'Gather professional certifications',
        'Compile insurance certificates',
        'Prepare project narrative',
        'Gather agency correspondence',
        'Compile previous approvals',
        'Prepare vicinity maps',
        'Organize all attachments'
      ],
      outputFormat: 'JSON with supporting documents list'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'artifacts'],
      properties: {
        documents: { type: 'array' },
        ownershipDocs: { type: 'array' },
        certifications: { type: 'array' },
        insuranceCerts: { type: 'array' },
        projectNarrative: { type: 'object' },
        attachmentList: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'documentation']
}));

// Task 7: Fee Calculation
export const feeCalculationTask = defineTask('fee-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate permit fees',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'permit coordinator',
      task: 'Calculate permit fees',
      context: args,
      instructions: [
        'Calculate building permit fees',
        'Calculate plan review fees',
        'Calculate impact fees',
        'Calculate utility connection fees',
        'Calculate environmental permit fees',
        'Identify fee payment methods',
        'Summarize total fees by agency',
        'Prepare fee transmittals'
      ],
      outputFormat: 'JSON with fee calculations, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        buildingFees: { type: 'number' },
        planReviewFees: { type: 'number' },
        impactFees: { type: 'number' },
        utilityFees: { type: 'number' },
        totalFees: { type: 'number' },
        feesByAgency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'fees']
}));

// Task 8: Submission Package
export const submissionPackageTask = defineTask('submission-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare permit submission packages',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'permit coordinator',
      task: 'Prepare permit submission packages',
      context: args,
      instructions: [
        'Organize submissions by agency',
        'Prepare required copies',
        'Include fee payment information',
        'Prepare transmittal letters',
        'Create submission checklists',
        'Prepare electronic submissions',
        'Document submission dates',
        'Create tracking log'
      ],
      outputFormat: 'JSON with submission packages, checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'checklist', 'correspondence', 'artifacts'],
      properties: {
        applications: { type: 'array' },
        checklist: { type: 'array' },
        correspondence: { type: 'array' },
        transmittalLetters: { type: 'array' },
        trackingLog: { type: 'object' },
        submissionSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'permits', 'submission']
}));
