/**
 * @process specializations/domains/science/biomedical-engineering/software-lifecycle-iec62304
 * @description Medical Device Software Development Lifecycle per IEC 62304 - Implement software development
 * lifecycle including planning, requirements, design, implementation, verification, and maintenance.
 * @inputs { softwareName: string, safetyClass: string, intendedUse: string, developmentModel?: string }
 * @outputs { success: boolean, sdlcDocumentation: object, softwareRequirements: object, architectureDocument: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/software-lifecycle-iec62304', {
 *   softwareName: 'Patient Monitoring Software',
 *   safetyClass: 'Class B',
 *   intendedUse: 'Real-time vital signs monitoring and alarming',
 *   developmentModel: 'Agile-with-gates'
 * });
 *
 * @references
 * - IEC 62304:2006/AMD1:2015 Medical device software - Software life cycle processes
 * - FDA Guidance on General Principles of Software Validation
 * - IEC 82304-1 Health software - General requirements for product safety
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    softwareName,
    safetyClass,
    intendedUse,
    developmentModel = 'V-model'
  } = inputs;

  // Phase 1: Software Safety Classification
  const safetyClassification = await ctx.task(safetyClassificationTask, {
    softwareName,
    safetyClass,
    intendedUse
  });

  // Phase 2: Software Development Planning
  const developmentPlanning = await ctx.task(developmentPlanningTask, {
    softwareName,
    safetyClass,
    developmentModel,
    safetyClassification
  });

  // Phase 3: Software Requirements Specification
  const requirementsSpecification = await ctx.task(requirementsSpecificationTask, {
    softwareName,
    safetyClass,
    intendedUse,
    developmentPlanning
  });

  // Breakpoint: Review software requirements
  await ctx.breakpoint({
    question: `Review software requirements for ${softwareName}. Are all requirements traceable to system needs?`,
    title: 'Software Requirements Review',
    context: {
      runId: ctx.runId,
      softwareName,
      requirementCount: requirementsSpecification.requirements.length,
      files: [{
        path: `artifacts/phase3-requirements.json`,
        format: 'json',
        content: requirementsSpecification
      }]
    }
  });

  // Phase 4: Software Architecture Design
  const architectureDesign = await ctx.task(architectureDesignTask, {
    softwareName,
    safetyClass,
    requirementsSpecification
  });

  // Phase 5: Software Detailed Design
  const detailedDesign = await ctx.task(detailedDesignTask, {
    softwareName,
    safetyClass,
    architectureDesign
  });

  // Phase 6: Software Unit Implementation
  const unitImplementation = await ctx.task(unitImplementationTask, {
    softwareName,
    safetyClass,
    detailedDesign
  });

  // Phase 7: Software Verification
  const softwareVerification = await ctx.task(softwareVerificationTask, {
    softwareName,
    safetyClass,
    requirementsSpecification,
    architectureDesign,
    detailedDesign,
    unitImplementation
  });

  // Phase 8: Software Release and Maintenance
  const releaseMaintenace = await ctx.task(releaseMaintenanceTask, {
    softwareName,
    safetyClass,
    softwareVerification,
    developmentPlanning
  });

  // Final Breakpoint: SDLC Approval
  await ctx.breakpoint({
    question: `Software lifecycle documentation complete for ${softwareName}. Approve for release?`,
    title: 'SDLC Approval',
    context: {
      runId: ctx.runId,
      softwareName,
      safetyClass,
      files: [
        { path: `artifacts/sdlc-documentation.json`, format: 'json', content: releaseMaintenace }
      ]
    }
  });

  return {
    success: true,
    softwareName,
    sdlcDocumentation: {
      developmentPlan: developmentPlanning.plan,
      verificationPlan: softwareVerification.plan,
      releasePlan: releaseMaintenace.releasePlan
    },
    softwareRequirements: requirementsSpecification.srs,
    architectureDocument: architectureDesign.sad,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/software-lifecycle-iec62304',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const safetyClassificationTask = defineTask('safety-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Safety Classification - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Safety Engineer',
      task: 'Determine software safety classification per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        intendedUse: args.intendedUse
      },
      instructions: [
        '1. Review hazardous situations from risk analysis',
        '2. Determine if software contributes to hazard',
        '3. Apply IEC 62304 classification criteria',
        '4. Document classification rationale',
        '5. Consider risk control measures',
        '6. Document software items and classification',
        '7. Assess SOUP classification',
        '8. Document safety classification',
        '9. Link to risk management file',
        '10. Create classification report'
      ],
      outputFormat: 'JSON object with safety classification'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'rationale', 'softwareItems'],
      properties: {
        classification: { type: 'string' },
        rationale: { type: 'string' },
        softwareItems: { type: 'array', items: { type: 'object' } },
        soupItems: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'safety-classification', 'software']
}));

export const developmentPlanningTask = defineTask('development-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Development Planning - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Project Manager',
      task: 'Create software development plan per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        developmentModel: args.developmentModel,
        safetyClassification: args.safetyClassification
      },
      instructions: [
        '1. Define development model',
        '2. Define deliverables per safety class',
        '3. Establish configuration management',
        '4. Define change control process',
        '5. Define problem resolution process',
        '6. Establish documentation standards',
        '7. Define tool qualification',
        '8. Plan risk management activities',
        '9. Create development schedule',
        '10. Create software development plan'
      ],
      outputFormat: 'JSON object with development plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'deliverables', 'processes'],
      properties: {
        plan: { type: 'object' },
        deliverables: { type: 'array', items: { type: 'string' } },
        processes: { type: 'object' },
        schedule: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'planning', 'software']
}));

export const requirementsSpecificationTask = defineTask('requirements-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Requirements Specification - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Requirements Engineer',
      task: 'Create software requirements specification per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        intendedUse: args.intendedUse,
        developmentPlanning: args.developmentPlanning
      },
      instructions: [
        '1. Define functional requirements',
        '2. Define performance requirements',
        '3. Define interface requirements',
        '4. Define safety requirements from risk analysis',
        '5. Define security requirements',
        '6. Define usability requirements',
        '7. Establish traceability to system',
        '8. Define SOUP requirements',
        '9. Review and approve requirements',
        '10. Create SRS document'
      ],
      outputFormat: 'JSON object with requirements specification'
    },
    outputSchema: {
      type: 'object',
      required: ['srs', 'requirements', 'traceability'],
      properties: {
        srs: { type: 'object' },
        requirements: { type: 'array', items: { type: 'object' } },
        traceability: { type: 'object' },
        soupRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'requirements', 'software']
}));

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Architecture Design - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Architect',
      task: 'Create software architecture design per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        requirementsSpecification: args.requirementsSpecification
      },
      instructions: [
        '1. Define software architecture',
        '2. Decompose into software items',
        '3. Define interfaces between items',
        '4. Define SOUP integration',
        '5. Document segregation of concerns',
        '6. Address safety requirements',
        '7. Create architecture diagrams',
        '8. Establish traceability to requirements',
        '9. Review architecture',
        '10. Create SAD document'
      ],
      outputFormat: 'JSON object with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['sad', 'softwareItems', 'interfaces'],
      properties: {
        sad: { type: 'object' },
        softwareItems: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'object' } },
        diagrams: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'architecture', 'software']
}));

export const detailedDesignTask = defineTask('detailed-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Detailed Design - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Designer',
      task: 'Create detailed design per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        architectureDesign: args.architectureDesign
      },
      instructions: [
        '1. Define software units',
        '2. Specify unit interfaces',
        '3. Document algorithms',
        '4. Define data structures',
        '5. Document state machines',
        '6. Address error handling',
        '7. Create detailed design documents',
        '8. Establish traceability',
        '9. Review detailed design',
        '10. Create SDD document'
      ],
      outputFormat: 'JSON object with detailed design'
    },
    outputSchema: {
      type: 'object',
      required: ['sdd', 'units', 'traceability'],
      properties: {
        sdd: { type: 'object' },
        units: { type: 'array', items: { type: 'object' } },
        traceability: { type: 'object' },
        errorHandling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'detailed-design', 'software']
}));

export const unitImplementationTask = defineTask('unit-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Unit Implementation - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Developer',
      task: 'Define unit implementation standards per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        detailedDesign: args.detailedDesign
      },
      instructions: [
        '1. Define coding standards',
        '2. Establish code review process',
        '3. Define unit testing requirements',
        '4. Implement units per design',
        '5. Conduct code reviews',
        '6. Execute unit tests',
        '7. Apply static analysis',
        '8. Document implementation',
        '9. Establish version control',
        '10. Create implementation records'
      ],
      outputFormat: 'JSON object with unit implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationStandards', 'unitTests', 'codeReviews'],
      properties: {
        implementationStandards: { type: 'object' },
        unitTests: { type: 'object' },
        codeReviews: { type: 'object' },
        staticAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'implementation', 'software']
}));

export const softwareVerificationTask = defineTask('software-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Software Verification - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software V&V Engineer',
      task: 'Plan and execute software verification per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        requirementsSpecification: args.requirementsSpecification,
        architectureDesign: args.architectureDesign,
        detailedDesign: args.detailedDesign,
        unitImplementation: args.unitImplementation
      },
      instructions: [
        '1. Create software verification plan',
        '2. Plan integration testing',
        '3. Plan system testing',
        '4. Define test cases from requirements',
        '5. Execute integration tests',
        '6. Execute system tests',
        '7. Verify traceability completeness',
        '8. Document test results',
        '9. Manage anomalies',
        '10. Create verification report'
      ],
      outputFormat: 'JSON object with software verification'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'testResults', 'traceability'],
      properties: {
        plan: { type: 'object' },
        testResults: { type: 'object' },
        traceability: { type: 'object' },
        anomalies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'verification', 'software']
}));

export const releaseMaintenanceTask = defineTask('release-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Release and Maintenance - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Release Manager',
      task: 'Plan software release and maintenance per IEC 62304',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        softwareVerification: args.softwareVerification,
        developmentPlanning: args.developmentPlanning
      },
      instructions: [
        '1. Verify release readiness',
        '2. Archive software deliverables',
        '3. Create release documentation',
        '4. Define maintenance process',
        '5. Establish problem reporting',
        '6. Define change control',
        '7. Plan software updates',
        '8. Document release records',
        '9. Establish support procedures',
        '10. Create maintenance plan'
      ],
      outputFormat: 'JSON object with release and maintenance'
    },
    outputSchema: {
      type: 'object',
      required: ['releasePlan', 'maintenancePlan', 'releaseRecords'],
      properties: {
        releasePlan: { type: 'object' },
        maintenancePlan: { type: 'object' },
        releaseRecords: { type: 'object' },
        supportProcedures: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iec-62304', 'release', 'maintenance', 'software']
}));
