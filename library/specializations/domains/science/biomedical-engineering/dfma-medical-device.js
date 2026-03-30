/**
 * @process specializations/domains/science/biomedical-engineering/dfma-medical-device
 * @description Design for Manufacturing and Assembly (DFMA) - Optimize medical device designs for efficient,
 * consistent, and reliable manufacturing while maintaining quality and regulatory compliance.
 * @inputs { deviceName: string, designOutputs: object[], manufacturingProcesses: string[], qualityRequirements: object }
 * @outputs { success: boolean, dfmaAnalysis: object, manufacturingSpecifications: object, supplierRequirements: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/dfma-medical-device', {
 *   deviceName: 'Disposable Surgical Stapler',
 *   designOutputs: [{ component: 'Staple cartridge', material: 'Medical grade ABS' }],
 *   manufacturingProcesses: ['Injection molding', 'Assembly', 'Sterilization'],
 *   qualityRequirements: { defectRate: '<0.1%', cpk: '>1.33' }
 * });
 *
 * @references
 * - DFMA Guidelines: https://www.dfma.com/
 * - FDA Quality System Regulation 21 CFR 820
 * - ISO 13485:2016 Section 7.3.3 Design and Development Outputs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    designOutputs,
    manufacturingProcesses,
    qualityRequirements
  } = inputs;

  // Phase 1: Manufacturability Assessment
  const manufacturabilityAssessment = await ctx.task(manufacturabilityAssessmentTask, {
    deviceName,
    designOutputs,
    manufacturingProcesses
  });

  // Phase 2: Part Count Reduction Analysis
  const partCountAnalysis = await ctx.task(partCountReductionTask, {
    deviceName,
    designOutputs,
    manufacturabilityAssessment
  });

  // Phase 3: Tolerance Analysis
  const toleranceAnalysis = await ctx.task(toleranceAnalysisTask, {
    deviceName,
    designOutputs,
    qualityRequirements
  });

  // Breakpoint: Review tolerance stack-up
  await ctx.breakpoint({
    question: `Review tolerance analysis for ${deviceName}. Are tolerance stack-ups acceptable?`,
    title: 'Tolerance Analysis Review',
    context: {
      runId: ctx.runId,
      deviceName,
      criticalDimensions: toleranceAnalysis.criticalDimensions,
      files: [{
        path: `artifacts/phase3-tolerance-analysis.json`,
        format: 'json',
        content: toleranceAnalysis
      }]
    }
  });

  // Phase 4: Assembly Sequence Optimization
  const assemblyOptimization = await ctx.task(assemblyOptimizationTask, {
    deviceName,
    designOutputs,
    partCountAnalysis
  });

  // Phase 5: Process Capability Evaluation
  const processCapability = await ctx.task(processCapabilityTask, {
    deviceName,
    manufacturingProcesses,
    toleranceAnalysis,
    qualityRequirements
  });

  // Phase 6: Design for Cleaning and Sterilization
  const cleaningSterilization = await ctx.task(cleaningSterilizationTask, {
    deviceName,
    designOutputs,
    manufacturingProcesses
  });

  // Phase 7: Supplier Capability Assessment
  const supplierAssessment = await ctx.task(supplierCapabilityTask, {
    deviceName,
    designOutputs,
    manufacturingProcesses,
    qualityRequirements
  });

  // Phase 8: DFMA Report Compilation
  const dfmaReport = await ctx.task(dfmaReportTask, {
    deviceName,
    manufacturabilityAssessment,
    partCountAnalysis,
    toleranceAnalysis,
    assemblyOptimization,
    processCapability,
    cleaningSterilization,
    supplierAssessment
  });

  // Final Breakpoint: DFMA Approval
  await ctx.breakpoint({
    question: `DFMA analysis complete for ${deviceName}. Approve design for manufacturing transfer?`,
    title: 'DFMA Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      manufacturabilityScore: manufacturabilityAssessment.score,
      files: [
        { path: `artifacts/dfma-report.json`, format: 'json', content: dfmaReport }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    dfmaAnalysis: dfmaReport.analysis,
    manufacturingSpecifications: dfmaReport.specifications,
    supplierRequirements: supplierAssessment.requirements,
    recommendations: dfmaReport.recommendations,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/dfma-medical-device',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const manufacturabilityAssessmentTask = defineTask('manufacturability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Manufacturability Assessment - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manufacturing Engineer with expertise in medical device production',
      task: 'Assess design manufacturability',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        manufacturingProcesses: args.manufacturingProcesses
      },
      instructions: [
        '1. Evaluate design for manufacturing feasibility',
        '2. Identify manufacturing challenges and risks',
        '3. Assess material selection for manufacturability',
        '4. Evaluate geometric complexity',
        '5. Identify special process requirements',
        '6. Calculate manufacturability score',
        '7. Document design improvements needed',
        '8. Assess production volume considerations',
        '9. Identify cost drivers',
        '10. Create manufacturability report'
      ],
      outputFormat: 'JSON object with manufacturability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'challenges', 'recommendations'],
      properties: {
        score: { type: 'number' },
        challenges: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        costDrivers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'manufacturing', 'assessment', 'medical-device']
}));

export const partCountReductionTask = defineTask('part-count-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Part Count Reduction - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DFMA Specialist with expertise in part consolidation',
      task: 'Analyze opportunities for part count reduction',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        manufacturabilityAssessment: args.manufacturabilityAssessment
      },
      instructions: [
        '1. Identify all parts and components',
        '2. Apply part count reduction criteria',
        '3. Identify candidates for consolidation',
        '4. Evaluate functional integration opportunities',
        '5. Assess impact on assembly and quality',
        '6. Calculate cost savings potential',
        '7. Document design change recommendations',
        '8. Evaluate regulatory impact of changes',
        '9. Create before/after comparison',
        '10. Prioritize reduction opportunities'
      ],
      outputFormat: 'JSON object with part count analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['currentPartCount', 'proposedPartCount', 'opportunities'],
      properties: {
        currentPartCount: { type: 'number' },
        proposedPartCount: { type: 'number' },
        opportunities: { type: 'array', items: { type: 'object' } },
        costSavings: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'part-count', 'optimization', 'medical-device']
}));

export const toleranceAnalysisTask = defineTask('tolerance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Tolerance Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tolerance Engineer with expertise in GD&T',
      task: 'Conduct tolerance analysis and stack-up studies',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        qualityRequirements: args.qualityRequirements
      },
      instructions: [
        '1. Identify critical dimensions and features',
        '2. Perform tolerance stack-up analysis',
        '3. Apply statistical tolerance analysis',
        '4. Evaluate GD&T requirements',
        '5. Assess manufacturing capability',
        '6. Identify tolerance-cost tradeoffs',
        '7. Document datum structure',
        '8. Create tolerance allocation',
        '9. Define inspection requirements',
        '10. Create tolerance analysis report'
      ],
      outputFormat: 'JSON object with tolerance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalDimensions', 'stackUpResults', 'recommendations'],
      properties: {
        criticalDimensions: { type: 'array', items: { type: 'object' } },
        stackUpResults: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        datumStructure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'tolerance', 'gdt', 'medical-device']
}));

export const assemblyOptimizationTask = defineTask('assembly-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Assembly Optimization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assembly Engineer with expertise in DFA',
      task: 'Optimize assembly sequence and methods',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        partCountAnalysis: args.partCountAnalysis
      },
      instructions: [
        '1. Document current assembly sequence',
        '2. Identify assembly challenges',
        '3. Optimize assembly sequence',
        '4. Design for error-proofing (poka-yoke)',
        '5. Evaluate automation potential',
        '6. Reduce assembly time',
        '7. Improve assembly ergonomics',
        '8. Document assembly instructions',
        '9. Define assembly fixtures needed',
        '10. Create optimized assembly plan'
      ],
      outputFormat: 'JSON object with assembly optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['assemblySequence', 'timeReduction', 'errorProofing'],
      properties: {
        assemblySequence: { type: 'array', items: { type: 'object' } },
        timeReduction: { type: 'string' },
        errorProofing: { type: 'array', items: { type: 'object' } },
        fixtureRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'assembly', 'optimization', 'medical-device']
}));

export const processCapabilityTask = defineTask('process-capability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Process Capability - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Engineer with expertise in process capability',
      task: 'Evaluate manufacturing process capability',
      context: {
        deviceName: args.deviceName,
        manufacturingProcesses: args.manufacturingProcesses,
        toleranceAnalysis: args.toleranceAnalysis,
        qualityRequirements: args.qualityRequirements
      },
      instructions: [
        '1. Identify critical manufacturing processes',
        '2. Assess process capability (Cp, Cpk)',
        '3. Evaluate process variation sources',
        '4. Define process control requirements',
        '5. Identify special processes',
        '6. Plan process validation (IQ/OQ/PQ)',
        '7. Define in-process controls',
        '8. Document process specifications',
        '9. Identify capability gaps',
        '10. Create capability improvement plan'
      ],
      outputFormat: 'JSON object with process capability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilityAssessment', 'validationRequirements', 'controls'],
      properties: {
        capabilityAssessment: { type: 'array', items: { type: 'object' } },
        validationRequirements: { type: 'array', items: { type: 'object' } },
        controls: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'process-capability', 'quality', 'medical-device']
}));

export const cleaningSterilizationTask = defineTask('cleaning-sterilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Cleaning and Sterilization Design - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sterilization Engineer with expertise in medical device processing',
      task: 'Design for cleaning and sterilization compatibility',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        manufacturingProcesses: args.manufacturingProcesses
      },
      instructions: [
        '1. Identify cleaning requirements',
        '2. Evaluate design for cleanability',
        '3. Assess sterilization method compatibility',
        '4. Identify material compatibility issues',
        '5. Design for residue removal',
        '6. Evaluate surface finish requirements',
        '7. Document cleaning validation requirements',
        '8. Define sterilization validation requirements',
        '9. Identify design modifications needed',
        '10. Create cleaning/sterilization specifications'
      ],
      outputFormat: 'JSON object with cleaning/sterilization design'
    },
    outputSchema: {
      type: 'object',
      required: ['cleaningRequirements', 'sterilizationMethod', 'designModifications'],
      properties: {
        cleaningRequirements: { type: 'array', items: { type: 'string' } },
        sterilizationMethod: { type: 'string' },
        materialCompatibility: { type: 'array', items: { type: 'object' } },
        designModifications: { type: 'array', items: { type: 'string' } },
        validationRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'sterilization', 'cleaning', 'medical-device']
}));

export const supplierCapabilityTask = defineTask('supplier-capability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Supplier Capability - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Supplier Quality Engineer with expertise in medical device supply chain',
      task: 'Assess supplier capability requirements',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        manufacturingProcesses: args.manufacturingProcesses,
        qualityRequirements: args.qualityRequirements
      },
      instructions: [
        '1. Identify critical suppliers and components',
        '2. Define supplier quality requirements',
        '3. Assess supplier capability needs',
        '4. Develop supplier specifications',
        '5. Define incoming inspection requirements',
        '6. Establish supplier qualification criteria',
        '7. Plan supplier audits',
        '8. Define supplier controls',
        '9. Create supplier quality agreements',
        '10. Document supplier requirements'
      ],
      outputFormat: 'JSON object with supplier requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'qualificationCriteria', 'controls'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        qualificationCriteria: { type: 'array', items: { type: 'string' } },
        controls: { type: 'array', items: { type: 'object' } },
        auditPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'supplier', 'quality', 'medical-device']
}));

export const dfmaReportTask = defineTask('dfma-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DFMA Report - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DFMA Program Manager with expertise in medical device development',
      task: 'Compile comprehensive DFMA report',
      context: {
        deviceName: args.deviceName,
        manufacturabilityAssessment: args.manufacturabilityAssessment,
        partCountAnalysis: args.partCountAnalysis,
        toleranceAnalysis: args.toleranceAnalysis,
        assemblyOptimization: args.assemblyOptimization,
        processCapability: args.processCapability,
        cleaningSterilization: args.cleaningSterilization,
        supplierAssessment: args.supplierAssessment
      },
      instructions: [
        '1. Compile DFMA analysis summary',
        '2. Document design recommendations',
        '3. Create manufacturing specifications',
        '4. Document cost impact analysis',
        '5. Prioritize design improvements',
        '6. Create action item list',
        '7. Document timeline and resources',
        '8. Define success metrics',
        '9. Create executive summary',
        '10. Prepare design transfer readiness assessment'
      ],
      outputFormat: 'JSON object with DFMA report'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'specifications', 'recommendations'],
      properties: {
        analysis: { type: 'object' },
        specifications: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'object' } },
        costImpact: { type: 'object' },
        actionItems: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dfma', 'report', 'documentation', 'medical-device']
}));
