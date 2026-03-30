/**
 * @process first-article-inspection
 * @description First Article Inspection (FAI) per AS9102 - complete dimensional verification and documentation
 * @inputs {object} inputs
 * @inputs {string} inputs.partNumber - Part identification number
 * @inputs {string} inputs.serialNumber - First article serial number
 * @inputs {object} inputs.drawing - Engineering drawing with GD&T
 * @inputs {object} inputs.purchaseOrder - PO reference with requirements
 * @inputs {object} inputs.manufacturingRecords - Process and material records
 * @outputs {object} fairPackage - Complete FAI report package per AS9102
 * @example
 * const result = await process({
 *   partNumber: 'FAI-2024-001',
 *   serialNumber: 'SN-001',
 *   drawing: { number: 'DWG-001', revision: 'C' },
 *   purchaseOrder: { number: 'PO-12345', requirements: [...] },
 *   manufacturingRecords: { traveler: {...}, certifications: [...] }
 * });
 * @references AS9102 Rev C, AIAG PPAP 4th Edition, ISO 9001
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: FAI Planning and Balloon Drawing
  const faiPlanning = await ctx.task(faiPlanningTask, {
    partNumber: inputs.partNumber,
    drawing: inputs.drawing,
    purchaseOrder: inputs.purchaseOrder
  });
  artifacts.push({ phase: 'fai-planning', data: faiPlanning });

  // Phase 2: Design Record Verification (Form 1)
  const designRecordVerification = await ctx.task(designRecordTask, {
    drawing: inputs.drawing,
    balloonDrawing: faiPlanning.balloonDrawing,
    specifications: faiPlanning.specifications
  });
  artifacts.push({ phase: 'design-record', data: designRecordVerification });

  // Phase 3: Material and Process Verification (Form 2)
  const materialProcessVerification = await ctx.task(materialProcessTask, {
    manufacturingRecords: inputs.manufacturingRecords,
    drawing: inputs.drawing,
    specifications: faiPlanning.specifications
  });
  artifacts.push({ phase: 'material-process', data: materialProcessVerification });

  // Breakpoint: Material and Process Review
  await ctx.breakpoint('material-process-review', {
    question: 'Review material certifications and process records. All conforming?',
    context: {
      materialStatus: materialProcessVerification.materialStatus,
      processStatus: materialProcessVerification.processStatus,
      nonconformances: materialProcessVerification.nonconformances
    }
  });

  // Phase 4: Dimensional Inspection Planning
  const inspectionPlanning = await ctx.task(inspectionPlanningTask, {
    balloonDrawing: faiPlanning.balloonDrawing,
    characteristics: faiPlanning.characteristics,
    partGeometry: inputs.drawing
  });
  artifacts.push({ phase: 'inspection-planning', data: inspectionPlanning });

  // Phase 5: CMM Programming and Setup
  const cmmSetup = await ctx.task(cmmSetupTask, {
    inspectionPlan: inspectionPlanning,
    partNumber: inputs.partNumber,
    characteristics: faiPlanning.characteristics
  });
  artifacts.push({ phase: 'cmm-setup', data: cmmSetup });

  // Phase 6: Dimensional Inspection Execution
  const dimensionalInspection = await ctx.task(dimensionalInspectionTask, {
    serialNumber: inputs.serialNumber,
    inspectionPlan: inspectionPlanning,
    cmmProgram: cmmSetup.program
  });
  artifacts.push({ phase: 'dimensional-inspection', data: dimensionalInspection });

  // Phase 7: Characteristic Accountability (Form 3)
  const characteristicAccountability = await ctx.task(characteristicAccountabilityTask, {
    characteristics: faiPlanning.characteristics,
    dimensionalResults: dimensionalInspection.results,
    balloonDrawing: faiPlanning.balloonDrawing
  });
  artifacts.push({ phase: 'characteristic-accountability', data: characteristicAccountability });

  // Phase 8: NDT and Special Process Verification
  const specialProcessVerification = await ctx.task(specialProcessTask, {
    manufacturingRecords: inputs.manufacturingRecords,
    drawing: inputs.drawing,
    specifications: faiPlanning.specifications
  });
  artifacts.push({ phase: 'special-process', data: specialProcessVerification });

  // Phase 9: Nonconformance Disposition
  const nonconformanceDisposition = await ctx.task(nonconformanceTask, {
    dimensionalResults: dimensionalInspection.results,
    materialProcessVerification: materialProcessVerification,
    characteristicAccountability: characteristicAccountability
  });
  artifacts.push({ phase: 'nonconformance', data: nonconformanceDisposition });

  // Breakpoint: FAI Results Review
  await ctx.breakpoint('fai-results-review', {
    question: 'Review FAI results. Proceed with FAIR package compilation?',
    context: {
      characteristicsInSpec: characteristicAccountability.inSpecCount,
      characteristicsOutOfSpec: characteristicAccountability.outOfSpecCount,
      nonconformances: nonconformanceDisposition.count
    }
  });

  // Phase 10: FAIR Package Compilation
  const fairPackage = await ctx.task(fairPackageTask, {
    partNumber: inputs.partNumber,
    serialNumber: inputs.serialNumber,
    designRecordVerification: designRecordVerification,
    materialProcessVerification: materialProcessVerification,
    characteristicAccountability: characteristicAccountability,
    specialProcessVerification: specialProcessVerification,
    nonconformanceDisposition: nonconformanceDisposition
  });
  artifacts.push({ phase: 'fair-package', data: fairPackage });

  // Final Breakpoint: FAIR Approval
  await ctx.breakpoint('fair-approval', {
    question: 'Approve FAIR package for submission?',
    context: {
      partNumber: inputs.partNumber,
      fairNumber: fairPackage.fairNumber,
      status: fairPackage.overallStatus,
      openItems: fairPackage.openItems
    }
  });

  return {
    success: true,
    results: {
      partNumber: inputs.partNumber,
      serialNumber: inputs.serialNumber,
      fairPackage: fairPackage,
      form1: designRecordVerification,
      form2: materialProcessVerification,
      form3: characteristicAccountability,
      inspectionReport: dimensionalInspection,
      balloonDrawing: faiPlanning.balloonDrawing
    },
    artifacts,
    metadata: {
      fairNumber: fairPackage.fairNumber,
      characteristicsInspected: characteristicAccountability.totalCharacteristics,
      conformanceRate: characteristicAccountability.conformanceRate,
      status: fairPackage.overallStatus
    }
  };
}

const faiPlanningTask = defineTask('fai-planning', (args) => ({
  kind: 'agent',
  title: 'FAI Planning and Balloon Drawing',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Plan FAI activities and create balloon drawing',
      context: args,
      instructions: [
        'Review drawing for all characteristics requiring inspection',
        'Create balloon drawing with characteristic numbering',
        'Identify all referenced specifications and standards',
        'Determine inspection methods for each characteristic',
        'Identify special characteristics (critical, major)',
        'Plan for sub-tier supplier FAI requirements',
        'Establish FAI documentation structure',
        'Identify any partial or delta FAI requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['balloonDrawing', 'characteristics', 'specifications'],
      properties: {
        balloonDrawing: { type: 'object' },
        characteristics: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'array', items: { type: 'string' } },
        specialCharacteristics: { type: 'array', items: { type: 'object' } },
        subtierRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const designRecordTask = defineTask('design-record', (args) => ({
  kind: 'agent',
  title: 'Design Record Verification (Form 1)',
  agent: {
    name: 'document-controller',
    prompt: {
      role: 'Document Control Specialist',
      task: 'Complete AS9102 Form 1 - Design Record Verification',
      context: args,
      instructions: [
        'Verify drawing number and revision level',
        'Document all referenced specifications',
        'Verify all drawing notes are addressed',
        'Document special process requirements',
        'Identify any functional test requirements',
        'Document material specifications',
        'List all changes from previous revision if applicable',
        'Complete Form 1 per AS9102 format'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['form1Data', 'drawingInfo', 'specifications'],
      properties: {
        form1Data: { type: 'object' },
        drawingInfo: { type: 'object' },
        specifications: { type: 'array', items: { type: 'object' } },
        notes: { type: 'array', items: { type: 'object' } },
        revisionChanges: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const materialProcessTask = defineTask('material-process', (args) => ({
  kind: 'agent',
  title: 'Material and Process Verification (Form 2)',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Complete AS9102 Form 2 - Material and Process Verification',
      context: args,
      instructions: [
        'Verify material certifications against specifications',
        'Verify heat/lot traceability to test reports',
        'Document special process approvals (Nadcap, customer)',
        'Verify heat treatment certifications',
        'Document surface treatment certifications',
        'Verify NDT certifications and reports',
        'Document functional test results',
        'Identify any nonconformances'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['form2Data', 'materialStatus', 'processStatus'],
      properties: {
        form2Data: { type: 'object' },
        materialStatus: { type: 'object' },
        processStatus: { type: 'object' },
        certifications: { type: 'array', items: { type: 'object' } },
        nonconformances: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const inspectionPlanningTask = defineTask('inspection-planning', (args) => ({
  kind: 'agent',
  title: 'Dimensional Inspection Planning',
  agent: {
    name: 'inspection-planner',
    prompt: {
      role: 'Inspection Planning Engineer',
      task: 'Plan dimensional inspection sequence and methods',
      context: args,
      instructions: [
        'Determine inspection method for each characteristic',
        'Plan part fixturing and datum establishment',
        'Sequence measurements for efficiency',
        'Identify characteristics requiring CMM vs manual methods',
        'Plan surface finish inspection locations',
        'Define inspection environment requirements',
        'Identify gage requirements and availability',
        'Establish measurement uncertainty considerations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['inspectionSequence', 'methods', 'gageList'],
      properties: {
        inspectionSequence: { type: 'array', items: { type: 'object' } },
        methods: { type: 'array', items: { type: 'object' } },
        gageList: { type: 'array', items: { type: 'object' } },
        fixtureRequirements: { type: 'object' },
        environmentRequirements: { type: 'object' }
      }
    }
  }
}));

const cmmSetupTask = defineTask('cmm-setup', (args) => ({
  kind: 'agent',
  title: 'CMM Programming and Setup',
  agent: {
    name: 'cmm-programmer',
    prompt: {
      role: 'CMM Programmer',
      task: 'Develop CMM program and setup procedures',
      context: args,
      instructions: [
        'Develop CMM measurement program',
        'Define part alignment/datum setup',
        'Configure probe selection and qualification',
        'Set measurement strategies for each feature',
        'Define point density for form measurements',
        'Configure tolerance evaluation methods',
        'Set up automated reporting format',
        'Verify program through dry-run or simulation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'alignment', 'probeConfig'],
      properties: {
        program: { type: 'object' },
        alignment: { type: 'object' },
        probeConfig: { type: 'array', items: { type: 'object' } },
        measurementStrategies: { type: 'array', items: { type: 'object' } },
        reportFormat: { type: 'object' }
      }
    }
  }
}));

const dimensionalInspectionTask = defineTask('dimensional-inspection', (args) => ({
  kind: 'agent',
  title: 'Dimensional Inspection Execution',
  agent: {
    name: 'inspector',
    prompt: {
      role: 'Quality Inspector',
      task: 'Execute dimensional inspection and record results',
      context: args,
      instructions: [
        'Perform part cleaning and temperature stabilization',
        'Set up part on CMM with proper fixturing',
        'Establish datum reference frame',
        'Execute automated CMM program',
        'Perform manual measurements as required',
        'Document actual measured values',
        'Calculate deviations from nominal',
        'Identify any out-of-tolerance conditions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'cmmReport', 'outOfTolerance'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        cmmReport: { type: 'object' },
        outOfTolerance: { type: 'array', items: { type: 'object' } },
        measurementConditions: { type: 'object' },
        inspectorNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

const characteristicAccountabilityTask = defineTask('characteristic-accountability', (args) => ({
  kind: 'agent',
  title: 'Characteristic Accountability (Form 3)',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Complete AS9102 Form 3 - Characteristic Accountability',
      context: args,
      instructions: [
        'Compile all characteristic data per balloon numbers',
        'Record nominal, tolerance, and actual values',
        'Calculate deviations and percent of tolerance used',
        'Determine conformance status for each characteristic',
        'Document inspection method used',
        'Reference CMM report characteristic IDs',
        'Flag special/critical characteristics',
        'Calculate overall conformance rate'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['form3Data', 'totalCharacteristics', 'inSpecCount', 'outOfSpecCount', 'conformanceRate'],
      properties: {
        form3Data: { type: 'array', items: { type: 'object' } },
        totalCharacteristics: { type: 'number' },
        inSpecCount: { type: 'number' },
        outOfSpecCount: { type: 'number' },
        conformanceRate: { type: 'number' },
        specialCharacteristics: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const specialProcessTask = defineTask('special-process', (args) => ({
  kind: 'agent',
  title: 'NDT and Special Process Verification',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Special Process Quality Engineer',
      task: 'Verify all NDT and special process results',
      context: args,
      instructions: [
        'Review NDT reports for acceptance',
        'Verify special process certifications',
        'Confirm processor approvals (Nadcap, customer)',
        'Document test specimen results if applicable',
        'Verify coating thickness measurements',
        'Review hardness test results',
        'Confirm heat treatment charts',
        'Document any nonconforming results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ndtResults', 'specialProcessResults', 'status'],
      properties: {
        ndtResults: { type: 'array', items: { type: 'object' } },
        specialProcessResults: { type: 'array', items: { type: 'object' } },
        status: { type: 'string' },
        processorApprovals: { type: 'array', items: { type: 'object' } },
        nonconformances: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const nonconformanceTask = defineTask('nonconformance', (args) => ({
  kind: 'agent',
  title: 'Nonconformance Disposition',
  agent: {
    name: 'mrb-engineer',
    prompt: {
      role: 'Material Review Board Engineer',
      task: 'Disposition any nonconformances identified during FAI',
      context: args,
      instructions: [
        'Document all nonconforming conditions',
        'Analyze impact on form, fit, function',
        'Determine disposition (use-as-is, rework, scrap)',
        'Obtain necessary approvals for disposition',
        'Document corrective actions required',
        'Track nonconformance to closure',
        'Update Form 3 with disposition status',
        'Verify effectiveness of corrective actions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['nonconformances', 'count', 'dispositions'],
      properties: {
        nonconformances: { type: 'array', items: { type: 'object' } },
        count: { type: 'number' },
        dispositions: { type: 'array', items: { type: 'object' } },
        correctiveActions: { type: 'array', items: { type: 'object' } },
        approvals: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const fairPackageTask = defineTask('fair-package', (args) => ({
  kind: 'agent',
  title: 'FAIR Package Compilation',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Compile complete FAIR package per AS9102',
      context: args,
      instructions: [
        'Assign FAIR number per company system',
        'Compile Forms 1, 2, and 3',
        'Attach balloon drawing',
        'Include CMM inspection reports',
        'Attach material certifications',
        'Include special process certifications',
        'Attach nonconformance documentation',
        'Complete signature and approval blocks',
        'Perform final review for completeness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fairNumber', 'forms', 'attachments', 'overallStatus'],
      properties: {
        fairNumber: { type: 'string' },
        forms: { type: 'object' },
        attachments: { type: 'array', items: { type: 'object' } },
        overallStatus: { type: 'string' },
        openItems: { type: 'array', items: { type: 'object' } },
        approvals: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

export default { process };
