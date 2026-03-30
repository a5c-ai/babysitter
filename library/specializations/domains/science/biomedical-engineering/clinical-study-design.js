/**
 * @process specializations/domains/science/biomedical-engineering/clinical-study-design
 * @description Clinical Study Design and Execution - Design and execute clinical studies for medical device
 * approval including IDE studies, pivotal trials, and post-market studies.
 * @inputs { studyName: string, deviceName: string, studyType: string, regulatoryPath: string }
 * @outputs { success: boolean, clinicalProtocol: object, investigatorBrochure: object, clinicalStudyReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/clinical-study-design', {
 *   studyName: 'IMPACT Trial',
 *   deviceName: 'Transcatheter Aortic Valve',
 *   studyType: 'Pivotal RCT',
 *   regulatoryPath: 'PMA'
 * });
 *
 * @references
 * - FDA IDE Regulations 21 CFR 812
 * - ISO 14155:2020 Clinical Investigation of Medical Devices
 * - ICH E6(R2) Good Clinical Practice
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    studyName,
    deviceName,
    studyType,
    regulatoryPath
  } = inputs;

  // Phase 1: Study Objective and Endpoint Definition
  const studyObjectives = await ctx.task(studyObjectivesTask, {
    studyName,
    deviceName,
    studyType,
    regulatoryPath
  });

  // Phase 2: Study Design Selection
  const studyDesign = await ctx.task(studyDesignTask, {
    studyName,
    studyType,
    studyObjectives
  });

  // Phase 3: Sample Size Calculation
  const sampleSize = await ctx.task(sampleSizeTask, {
    studyName,
    studyDesign,
    studyObjectives
  });

  // Phase 4: Protocol Development
  const protocolDevelopment = await ctx.task(protocolDevelopmentTask, {
    studyName,
    deviceName,
    studyDesign,
    sampleSize,
    studyObjectives
  });

  // Breakpoint: Review protocol
  await ctx.breakpoint({
    question: `Review clinical protocol for ${studyName}. Is the study design scientifically sound?`,
    title: 'Protocol Review',
    context: {
      runId: ctx.runId,
      studyName,
      studyDesign: studyDesign.design,
      files: [{
        path: `artifacts/phase4-protocol.json`,
        format: 'json',
        content: protocolDevelopment
      }]
    }
  });

  // Phase 5: IRB/EC Submission
  const irbSubmission = await ctx.task(irbSubmissionTask, {
    studyName,
    protocolDevelopment
  });

  // Phase 6: Site Selection and Initiation
  const siteManagement = await ctx.task(siteManagementTask, {
    studyName,
    protocolDevelopment
  });

  // Phase 7: Data Collection and Management
  const dataManagement = await ctx.task(dataManagementTask, {
    studyName,
    protocolDevelopment
  });

  // Phase 8: Statistical Analysis and Reporting
  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    studyName,
    protocolDevelopment,
    studyObjectives,
    sampleSize
  });

  // Final Breakpoint: Study Report Approval
  await ctx.breakpoint({
    question: `Clinical study complete for ${studyName}. Approve clinical study report for regulatory submission?`,
    title: 'CSR Approval',
    context: {
      runId: ctx.runId,
      studyName,
      files: [
        { path: `artifacts/clinical-study-report.json`, format: 'json', content: statisticalAnalysis }
      ]
    }
  });

  return {
    success: true,
    studyName,
    clinicalProtocol: protocolDevelopment.protocol,
    investigatorBrochure: protocolDevelopment.ib,
    clinicalStudyReport: statisticalAnalysis.csr,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/clinical-study-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const studyObjectivesTask = defineTask('study-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Study Objectives - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Research Scientist',
      task: 'Define study objectives and endpoints',
      context: {
        studyName: args.studyName,
        deviceName: args.deviceName,
        studyType: args.studyType,
        regulatoryPath: args.regulatoryPath
      },
      instructions: [
        '1. Define primary objective',
        '2. Define secondary objectives',
        '3. Define primary endpoint',
        '4. Define secondary endpoints',
        '5. Define safety endpoints',
        '6. Align with regulatory requirements',
        '7. Define endpoint adjudication',
        '8. Document clinical significance',
        '9. Define success criteria',
        '10. Create objectives document'
      ],
      outputFormat: 'JSON object with study objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'endpoints', 'successCriteria'],
      properties: {
        objectives: { type: 'object' },
        endpoints: { type: 'object' },
        successCriteria: { type: 'object' },
        adjudication: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'objectives', 'endpoints']
}));

export const studyDesignTask = defineTask('study-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Study Design - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Trial Designer',
      task: 'Select and define study design',
      context: {
        studyName: args.studyName,
        studyType: args.studyType,
        studyObjectives: args.studyObjectives
      },
      instructions: [
        '1. Select study design (RCT, single-arm, etc.)',
        '2. Define control group',
        '3. Define randomization method',
        '4. Define blinding strategy',
        '5. Define study population',
        '6. Define inclusion criteria',
        '7. Define exclusion criteria',
        '8. Plan interim analyses',
        '9. Define stopping rules',
        '10. Create study design document'
      ],
      outputFormat: 'JSON object with study design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'population', 'criteria'],
      properties: {
        design: { type: 'string' },
        population: { type: 'object' },
        criteria: { type: 'object' },
        randomization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'design', 'methodology']
}));

export const sampleSizeTask = defineTask('sample-size', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sample Size - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biostatistician',
      task: 'Calculate sample size requirements',
      context: {
        studyName: args.studyName,
        studyDesign: args.studyDesign,
        studyObjectives: args.studyObjectives
      },
      instructions: [
        '1. Define statistical hypothesis',
        '2. Estimate effect size',
        '3. Select alpha and power',
        '4. Calculate primary sample size',
        '5. Adjust for dropouts',
        '6. Consider adaptive designs',
        '7. Document assumptions',
        '8. Sensitivity analysis',
        '9. Justify sample size',
        '10. Create sample size document'
      ],
      outputFormat: 'JSON object with sample size'
    },
    outputSchema: {
      type: 'object',
      required: ['calculation', 'sampleSize', 'assumptions'],
      properties: {
        calculation: { type: 'object' },
        sampleSize: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } },
        sensitivity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'sample-size', 'statistics']
}));

export const protocolDevelopmentTask = defineTask('protocol-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Protocol Development - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Protocol Writer',
      task: 'Develop clinical protocol and IB',
      context: {
        studyName: args.studyName,
        deviceName: args.deviceName,
        studyDesign: args.studyDesign,
        sampleSize: args.sampleSize,
        studyObjectives: args.studyObjectives
      },
      instructions: [
        '1. Write protocol synopsis',
        '2. Document study procedures',
        '3. Define visit schedule',
        '4. Document adverse event handling',
        '5. Define data collection',
        '6. Document informed consent',
        '7. Create investigator brochure',
        '8. Define safety monitoring',
        '9. Document regulatory requirements',
        '10. Create protocol document'
      ],
      outputFormat: 'JSON object with protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'ib', 'icf'],
      properties: {
        protocol: { type: 'object' },
        ib: { type: 'object' },
        icf: { type: 'object' },
        procedures: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'protocol', 'documentation']
}));

export const irbSubmissionTask = defineTask('irb-submission', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: IRB Submission - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Affairs Specialist',
      task: 'Prepare IRB/EC submission',
      context: {
        studyName: args.studyName,
        protocolDevelopment: args.protocolDevelopment
      },
      instructions: [
        '1. Identify IRB/EC requirements',
        '2. Prepare submission package',
        '3. Submit for review',
        '4. Respond to queries',
        '5. Obtain approval',
        '6. Track approval status',
        '7. Document communications',
        '8. Plan amendments',
        '9. Continuing review process',
        '10. Create IRB documentation'
      ],
      outputFormat: 'JSON object with IRB submission'
    },
    outputSchema: {
      type: 'object',
      required: ['submission', 'approvals', 'amendments'],
      properties: {
        submission: { type: 'object' },
        approvals: { type: 'array', items: { type: 'object' } },
        amendments: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'irb', 'regulatory']
}));

export const siteManagementTask = defineTask('site-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Site Management - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Operations Manager',
      task: 'Manage clinical sites',
      context: {
        studyName: args.studyName,
        protocolDevelopment: args.protocolDevelopment
      },
      instructions: [
        '1. Select clinical sites',
        '2. Qualify investigators',
        '3. Conduct site initiation',
        '4. Train site staff',
        '5. Monitor enrollment',
        '6. Conduct monitoring visits',
        '7. Manage site issues',
        '8. Track performance',
        '9. Close-out sites',
        '10. Create site management plan'
      ],
      outputFormat: 'JSON object with site management'
    },
    outputSchema: {
      type: 'object',
      required: ['sites', 'monitoring', 'enrollment'],
      properties: {
        sites: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' },
        enrollment: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'site-management', 'operations']
}));

export const dataManagementTask = defineTask('data-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Management - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Data Manager',
      task: 'Manage clinical data collection',
      context: {
        studyName: args.studyName,
        protocolDevelopment: args.protocolDevelopment
      },
      instructions: [
        '1. Design case report forms',
        '2. Build EDC system',
        '3. Validate data entry',
        '4. Query management',
        '5. Data cleaning',
        '6. SAE reconciliation',
        '7. Database lock',
        '8. Data transfer',
        '9. Audit trail',
        '10. Create data management plan'
      ],
      outputFormat: 'JSON object with data management'
    },
    outputSchema: {
      type: 'object',
      required: ['crfs', 'edcSystem', 'dataQuality'],
      properties: {
        crfs: { type: 'array', items: { type: 'object' } },
        edcSystem: { type: 'object' },
        dataQuality: { type: 'object' },
        auditTrail: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'data-management', 'edc']
}));

export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Statistical Analysis - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biostatistician',
      task: 'Conduct statistical analysis and create CSR',
      context: {
        studyName: args.studyName,
        protocolDevelopment: args.protocolDevelopment,
        studyObjectives: args.studyObjectives,
        sampleSize: args.sampleSize
      },
      instructions: [
        '1. Finalize SAP',
        '2. Analyze primary endpoint',
        '3. Analyze secondary endpoints',
        '4. Analyze safety data',
        '5. Subgroup analyses',
        '6. Sensitivity analyses',
        '7. Create tables and figures',
        '8. Write CSR',
        '9. Peer review',
        '10. Finalize CSR'
      ],
      outputFormat: 'JSON object with statistical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sap', 'results', 'csr'],
      properties: {
        sap: { type: 'object' },
        results: { type: 'object' },
        csr: { type: 'object' },
        conclusions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-study', 'statistics', 'csr']
}));
