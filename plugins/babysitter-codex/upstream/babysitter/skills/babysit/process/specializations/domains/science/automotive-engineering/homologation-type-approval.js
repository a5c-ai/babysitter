/**
 * @process specializations/domains/science/automotive-engineering/homologation-type-approval
 * @description Homologation and Type Approval - Manage regulatory certification process including
 * UN ECE type approval, FMVSS self-certification, and regional market homologation requirements.
 * @inputs { vehicleProgram: string, vehicleCategory: string, targetMarkets?: string[], certificationScope?: string[] }
 * @outputs { success: boolean, certificationStatus: object, testReports: object, typeApprovalDocs: object, complianceMatrix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/homologation-type-approval', {
 *   vehicleProgram: 'EV-Sedan-2027',
 *   vehicleCategory: 'M1',
 *   targetMarkets: ['EU', 'USA', 'China', 'Japan', 'Korea'],
 *   certificationScope: ['WVTA', 'FMVSS', 'GB-Standards', 'TRIAS']
 * });
 *
 * @references
 * - UN ECE 1958 Agreement
 * - FMVSS (Federal Motor Vehicle Safety Standards)
 * - EU Type Approval Framework Regulation (EU) 2018/858
 * - GB Standards (China)
 * - TRIAS (Japan)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleCategory,
    targetMarkets = [],
    certificationScope = []
  } = inputs;

  // Phase 1: Regulatory Requirements Analysis
  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, {
    vehicleProgram,
    vehicleCategory,
    targetMarkets,
    certificationScope
  });

  // Phase 2: Compliance Planning
  const compliancePlanning = await ctx.task(compliancePlanningTask, {
    vehicleProgram,
    regulatoryAnalysis,
    targetMarkets
  });

  // Breakpoint: Compliance plan review
  await ctx.breakpoint({
    question: `Review compliance plan for ${vehicleProgram}. ${compliancePlanning.regulationsCount} regulations identified. Approve plan?`,
    title: 'Compliance Plan Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      compliancePlanning,
      files: [{
        path: `artifacts/compliance-plan.json`,
        format: 'json',
        content: compliancePlanning
      }]
    }
  });

  // Phase 3: EU Type Approval (WVTA)
  const euTypeApproval = await ctx.task(euTypeApprovalTask, {
    vehicleProgram,
    vehicleCategory,
    compliancePlanning
  });

  // Phase 4: US Self-Certification (FMVSS)
  const usSelfCertification = await ctx.task(usSelfCertificationTask, {
    vehicleProgram,
    vehicleCategory,
    compliancePlanning
  });

  // Phase 5: China Certification (CCC/GB)
  const chinaCertification = await ctx.task(chinaCertificationTask, {
    vehicleProgram,
    vehicleCategory,
    compliancePlanning
  });

  // Phase 6: Other Markets Certification
  const otherMarkets = await ctx.task(otherMarketsCertificationTask, {
    vehicleProgram,
    vehicleCategory,
    targetMarkets,
    compliancePlanning
  });

  // Phase 7: Documentation and Evidence
  const certificationDocs = await ctx.task(certificationDocsTask, {
    vehicleProgram,
    euTypeApproval,
    usSelfCertification,
    chinaCertification,
    otherMarkets
  });

  // Phase 8: Certification Completion
  const certificationCompletion = await ctx.task(certificationCompletionTask, {
    vehicleProgram,
    euTypeApproval,
    usSelfCertification,
    chinaCertification,
    otherMarkets,
    certificationDocs
  });

  // Final Breakpoint: Homologation approval
  await ctx.breakpoint({
    question: `Homologation complete for ${vehicleProgram}. Markets approved: ${certificationCompletion.marketsApproved}. Approve for production?`,
    title: 'Homologation Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      certificationCompletion,
      files: [
        { path: `artifacts/certification-status.json`, format: 'json', content: certificationCompletion },
        { path: `artifacts/type-approval-docs.json`, format: 'json', content: certificationDocs }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    certificationStatus: certificationCompletion.status,
    testReports: certificationDocs.testReports,
    typeApprovalDocs: certificationDocs.approvalDocuments,
    complianceMatrix: compliancePlanning.matrix,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/homologation-type-approval',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Regulatory Requirements Analysis - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Affairs Specialist',
      task: 'Analyze regulatory requirements for target markets',
      context: args,
      instructions: [
        '1. Identify applicable UN ECE regulations',
        '2. Identify FMVSS requirements',
        '3. Identify EU regulations',
        '4. Identify China GB standards',
        '5. Identify Japan TRIAS requirements',
        '6. Identify Korea KMVSS requirements',
        '7. Map regulation overlap',
        '8. Identify market-specific requirements',
        '9. Define certification sequence',
        '10. Document regulatory analysis'
      ],
      outputFormat: 'JSON object with regulatory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['regulations', 'requirements', 'timeline'],
      properties: {
        regulations: { type: 'array', items: { type: 'object' } },
        requirements: { type: 'object' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'regulatory', 'analysis']
}));

export const compliancePlanningTask = defineTask('compliance-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compliance Planning - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Planning Engineer',
      task: 'Develop compliance plan and matrix',
      context: args,
      instructions: [
        '1. Create compliance matrix',
        '2. Define test requirements',
        '3. Plan certification timeline',
        '4. Identify test facilities',
        '5. Plan documentation requirements',
        '6. Define resource requirements',
        '7. Plan technical service engagement',
        '8. Define approval authority submissions',
        '9. Plan prototype requirements',
        '10. Document compliance plan'
      ],
      outputFormat: 'JSON object with compliance planning'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'regulationsCount', 'schedule'],
      properties: {
        matrix: { type: 'object' },
        regulationsCount: { type: 'number' },
        schedule: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'compliance', 'planning']
}));

export const euTypeApprovalTask = defineTask('eu-type-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: EU Type Approval (WVTA) - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EU Type Approval Engineer',
      task: 'Execute EU Whole Vehicle Type Approval',
      context: args,
      instructions: [
        '1. Prepare WVTA application',
        '2. Execute UN ECE regulation tests',
        '3. Execute EU-specific tests',
        '4. Prepare CoP documentation',
        '5. Conduct technical service audits',
        '6. Prepare information document',
        '7. Execute GSR tests',
        '8. Execute cybersecurity compliance',
        '9. Submit to approval authority',
        '10. Obtain type approval certificate'
      ],
      outputFormat: 'JSON object with EU type approval'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'testResults', 'certificates'],
      properties: {
        status: { type: 'string' },
        testResults: { type: 'object' },
        certificates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'EU', 'WVTA']
}));

export const usSelfCertificationTask = defineTask('us-self-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: US Self-Certification (FMVSS) - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FMVSS Certification Engineer',
      task: 'Execute US self-certification process',
      context: args,
      instructions: [
        '1. Identify applicable FMVSS',
        '2. Execute FMVSS compliance tests',
        '3. Prepare certification label',
        '4. Prepare VIN structure',
        '5. Execute NCAP tests',
        '6. Execute IIHS tests (if applicable)',
        '7. Prepare EPA/CARB compliance',
        '8. Submit NHTSA documentation',
        '9. Prepare recall procedures',
        '10. Complete self-certification'
      ],
      outputFormat: 'JSON object with US self-certification'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'testResults', 'documentation'],
      properties: {
        status: { type: 'string' },
        testResults: { type: 'object' },
        documentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'USA', 'FMVSS']
}));

export const chinaCertificationTask = defineTask('china-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: China Certification (CCC/GB) - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'China Certification Engineer',
      task: 'Execute China certification process',
      context: args,
      instructions: [
        '1. Apply for CCC certification',
        '2. Execute GB standard tests',
        '3. Prepare China-specific documentation',
        '4. Conduct factory audit',
        '5. Execute C-NCAP tests',
        '6. Prepare NEV compliance (if EV)',
        '7. Execute emission tests',
        '8. Submit to CATARC',
        '9. Obtain CCC certificate',
        '10. Complete announcement process'
      ],
      outputFormat: 'JSON object with China certification'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'testResults', 'certificates'],
      properties: {
        status: { type: 'string' },
        testResults: { type: 'object' },
        certificates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'China', 'CCC']
}));

export const otherMarketsCertificationTask = defineTask('other-markets-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Other Markets Certification - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Global Certification Engineer',
      task: 'Execute certification for other markets',
      context: args,
      instructions: [
        '1. Execute Japan TRIAS certification',
        '2. Execute Korea KMVSS certification',
        '3. Execute Australia ADR certification',
        '4. Execute GCC certification',
        '5. Execute India CMVR certification',
        '6. Execute Brazil INMETRO certification',
        '7. Execute ASEAN certification',
        '8. Manage regional variations',
        '9. Coordinate local representatives',
        '10. Document market certifications'
      ],
      outputFormat: 'JSON object with other markets certification'
    },
    outputSchema: {
      type: 'object',
      required: ['markets', 'status', 'certificates'],
      properties: {
        markets: { type: 'array', items: { type: 'object' } },
        status: { type: 'object' },
        certificates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'global', 'certification']
}));

export const certificationDocsTask = defineTask('certification-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Documentation and Evidence - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Certification Documentation Specialist',
      task: 'Prepare certification documentation',
      context: args,
      instructions: [
        '1. Compile test reports',
        '2. Prepare information documents',
        '3. Compile type approval certificates',
        '4. Prepare CoP procedures',
        '5. Document engineering changes',
        '6. Prepare variant documentation',
        '7. Compile recall procedures',
        '8. Prepare market labeling',
        '9. Document import procedures',
        '10. Create certification archive'
      ],
      outputFormat: 'JSON object with certification documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['testReports', 'approvalDocuments', 'archive'],
      properties: {
        testReports: { type: 'object' },
        approvalDocuments: { type: 'object' },
        archive: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'documentation', 'evidence']
}));

export const certificationCompletionTask = defineTask('certification-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Certification Completion - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Certification Manager',
      task: 'Complete certification process',
      context: args,
      instructions: [
        '1. Verify all certifications complete',
        '2. Confirm production readiness',
        '3. Verify CoP implementation',
        '4. Confirm labeling compliance',
        '5. Verify import documentation',
        '6. Confirm field service readiness',
        '7. Verify recall procedures',
        '8. Confirm regulatory monitoring',
        '9. Generate certification summary',
        '10. Approve for production release'
      ],
      outputFormat: 'JSON object with certification completion'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'marketsApproved', 'readiness'],
      properties: {
        status: { type: 'object' },
        marketsApproved: { type: 'number' },
        readiness: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'homologation', 'completion', 'release']
}));
