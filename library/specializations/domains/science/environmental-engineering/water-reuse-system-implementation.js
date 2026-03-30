/**
 * @process environmental-engineering/water-reuse-system-implementation
 * @description Water Reuse System Implementation - Planning and design of water recycling and reuse systems for
 * potable and non-potable applications including risk assessment and regulatory compliance.
 * @inputs { projectName: string, reuseType: string, sourceWater: object, endUseApplications: array }
 * @outputs { success: boolean, systemDesign: object, riskAssessment: object, regulatoryCompliance: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/water-reuse-system-implementation', {
 *   projectName: 'Industrial Park Water Recycling',
 *   reuseType: 'non-potable',
 *   sourceWater: { type: 'secondary-effluent', quality: { BOD: 20, TSS: 20 } },
 *   endUseApplications: ['irrigation', 'cooling-tower', 'toilet-flushing']
 * });
 *
 * @references
 * - EPA Guidelines for Water Reuse
 * - WateReuse Association Technical Standards
 * - WHO Potable Reuse Guidance
 * - State Water Recycling Criteria
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    reuseType = 'non-potable',
    sourceWater = {},
    endUseApplications = [],
    systemCapacity = 1.0,
    siteConditions = {},
    outputDir = 'water-reuse-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Water Reuse System Implementation: ${projectName}`);
  ctx.log('info', `Reuse Type: ${reuseType}, Applications: ${endUseApplications.join(', ')}`);

  // ============================================================================
  // PHASE 1: FEASIBILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Feasibility Assessment');

  const feasibilityAssessment = await ctx.task(feasibilityAssessmentTask, {
    projectName,
    reuseType,
    sourceWater,
    endUseApplications,
    systemCapacity,
    outputDir
  });

  artifacts.push(...feasibilityAssessment.artifacts);

  // ============================================================================
  // PHASE 2: REGULATORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Regulatory Requirements Analysis');

  const regulatoryAnalysis = await ctx.task(reuseRegulatoryTask, {
    projectName,
    reuseType,
    endUseApplications,
    feasibilityAssessment,
    outputDir
  });

  artifacts.push(...regulatoryAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Public Health Risk Assessment');

  const riskAssessment = await ctx.task(reuseRiskAssessmentTask, {
    projectName,
    reuseType,
    sourceWater,
    endUseApplications,
    regulatoryAnalysis,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Breakpoint: Risk Assessment Review
  await ctx.breakpoint({
    question: `Risk assessment complete for ${projectName}. Overall risk level: ${riskAssessment.overallRiskLevel}. Review and approve?`,
    title: 'Water Reuse Risk Assessment Review',
    context: {
      runId: ctx.runId,
      riskLevel: riskAssessment.overallRiskLevel,
      pathogenRisk: riskAssessment.pathogenRisk,
      chemicalRisk: riskAssessment.chemicalRisk,
      mitigationMeasures: riskAssessment.mitigationMeasures,
      files: riskAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: TREATMENT SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Treatment System Design');

  const treatmentDesign = await ctx.task(reuseTreatmentDesignTask, {
    projectName,
    reuseType,
    sourceWater,
    systemCapacity,
    regulatoryAnalysis,
    riskAssessment,
    outputDir
  });

  artifacts.push(...treatmentDesign.artifacts);

  // ============================================================================
  // PHASE 5: DISTRIBUTION SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Distribution System Design');

  const distributionDesign = await ctx.task(distributionSystemTask, {
    projectName,
    endUseApplications,
    systemCapacity,
    treatmentDesign,
    siteConditions,
    outputDir
  });

  artifacts.push(...distributionDesign.artifacts);

  // ============================================================================
  // PHASE 6: MONITORING PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 6: Monitoring Program Development');

  const monitoringProgram = await ctx.task(reuseMonitoringTask, {
    projectName,
    reuseType,
    treatmentDesign,
    regulatoryAnalysis,
    riskAssessment,
    outputDir
  });

  artifacts.push(...monitoringProgram.artifacts);

  // ============================================================================
  // PHASE 7: PUBLIC OUTREACH PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Public Outreach and Education');

  const publicOutreach = await ctx.task(publicOutreachTask, {
    projectName,
    reuseType,
    endUseApplications,
    outputDir
  });

  artifacts.push(...publicOutreach.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementation Documentation');

  const implementationDocs = await ctx.task(implementationDocsTask, {
    projectName,
    feasibilityAssessment,
    regulatoryAnalysis,
    riskAssessment,
    treatmentDesign,
    distributionDesign,
    monitoringProgram,
    publicOutreach,
    outputDir
  });

  artifacts.push(...implementationDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    systemDesign: {
      reuseType,
      capacity: systemCapacity,
      treatmentTrain: treatmentDesign.treatmentTrain,
      distributionSystem: distributionDesign.systemSummary,
      endUseApplications
    },
    riskAssessment: {
      overallRiskLevel: riskAssessment.overallRiskLevel,
      pathogenRisk: riskAssessment.pathogenRisk,
      chemicalRisk: riskAssessment.chemicalRisk,
      mitigationMeasures: riskAssessment.mitigationMeasures
    },
    regulatoryCompliance: {
      requirements: regulatoryAnalysis.requirements,
      permits: regulatoryAnalysis.permits,
      complianceStatus: regulatoryAnalysis.complianceStatus
    },
    monitoringPlan: monitoringProgram.monitoringPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/water-reuse-system-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const feasibilityAssessmentTask = defineTask('feasibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feasibility Assessment',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Reuse Specialist',
      task: 'Assess feasibility of water reuse project',
      context: args,
      instructions: [
        '1. Evaluate source water availability and quality',
        '2. Assess demand for recycled water',
        '3. Identify potential end users',
        '4. Evaluate technical feasibility',
        '5. Assess infrastructure requirements',
        '6. Analyze economic feasibility',
        '7. Identify institutional considerations',
        '8. Evaluate environmental benefits',
        '9. Assess public acceptance factors',
        '10. Prepare feasibility summary'
      ],
      outputFormat: 'JSON with feasibility summary, economic analysis, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibilitySummary', 'economicAnalysis', 'recommendations', 'artifacts'],
      properties: {
        feasibilitySummary: { type: 'object' },
        sourceWaterAssessment: { type: 'object' },
        demandAnalysis: { type: 'object' },
        economicAnalysis: { type: 'object' },
        technicalFeasibility: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'feasibility']
}));

export const reuseRegulatoryTask = defineTask('reuse-regulatory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Requirements Analysis',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Water Reuse Regulatory Specialist',
      task: 'Analyze regulatory requirements for water reuse',
      context: args,
      instructions: [
        '1. Identify federal guidelines (EPA Guidelines for Water Reuse)',
        '2. Identify state water recycling regulations',
        '3. Determine water quality requirements by end use',
        '4. Identify treatment requirements',
        '5. Determine monitoring requirements',
        '6. Identify permitting requirements',
        '7. Assess cross-connection control requirements',
        '8. Determine signage and notification requirements',
        '9. Document compliance pathway',
        '10. Create regulatory compliance matrix'
      ],
      outputFormat: 'JSON with requirements, permits, compliance matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'permits', 'complianceStatus', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        waterQualityCriteria: { type: 'object' },
        treatmentRequirements: { type: 'array' },
        permits: { type: 'array' },
        monitoringRequirements: { type: 'object' },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'regulatory']
}));

export const reuseRiskAssessmentTask = defineTask('reuse-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Public Health Risk Assessment',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Water Reuse Risk Analyst',
      task: 'Conduct public health risk assessment for water reuse',
      context: args,
      instructions: [
        '1. Identify pathogen hazards',
        '2. Identify chemical hazards',
        '3. Conduct exposure assessment',
        '4. Perform dose-response assessment',
        '5. Calculate risk for each exposure pathway',
        '6. Evaluate cumulative risk',
        '7. Identify critical control points',
        '8. Develop risk mitigation measures',
        '9. Establish acceptable risk levels',
        '10. Document risk assessment'
      ],
      outputFormat: 'JSON with risk assessment, mitigation measures, control points'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskLevel', 'pathogenRisk', 'chemicalRisk', 'mitigationMeasures', 'artifacts'],
      properties: {
        overallRiskLevel: { type: 'string' },
        pathogenRisk: { type: 'object' },
        chemicalRisk: { type: 'object' },
        exposureAssessment: { type: 'object' },
        criticalControlPoints: { type: 'array' },
        mitigationMeasures: { type: 'array' },
        acceptableRiskLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'risk-assessment']
}));

export const reuseTreatmentDesignTask = defineTask('reuse-treatment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Treatment System Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Reuse Treatment Engineer',
      task: 'Design treatment system for water reuse',
      context: args,
      instructions: [
        '1. Define treatment objectives',
        '2. Select treatment processes (MBR, UF, UV, RO)',
        '3. Design multi-barrier approach',
        '4. Size treatment units',
        '5. Design disinfection system',
        '6. Design reliability features (redundancy)',
        '7. Develop process control strategy',
        '8. Design residuals handling',
        '9. Estimate capital and O&M costs',
        '10. Document treatment design'
      ],
      outputFormat: 'JSON with treatment train, design summary, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['treatmentTrain', 'designSummary', 'costEstimate', 'artifacts'],
      properties: {
        treatmentTrain: { type: 'array' },
        designSummary: { type: 'object' },
        unitSizing: { type: 'object' },
        disinfectionDesign: { type: 'object' },
        reliabilityFeatures: { type: 'array' },
        residualsHandling: { type: 'object' },
        costEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'treatment']
}));

export const distributionSystemTask = defineTask('distribution-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Distribution System Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Recycled Water Distribution Engineer',
      task: 'Design recycled water distribution system',
      context: args,
      instructions: [
        '1. Develop system layout',
        '2. Size distribution piping',
        '3. Design storage facilities',
        '4. Design pumping systems',
        '5. Implement cross-connection control',
        '6. Design identification system (purple pipe)',
        '7. Design metering and monitoring points',
        '8. Develop hydraulic model',
        '9. Design user connections',
        '10. Document distribution design'
      ],
      outputFormat: 'JSON with system summary, hydraulic analysis, connection details'
    },
    outputSchema: {
      type: 'object',
      required: ['systemSummary', 'hydraulicAnalysis', 'connectionDetails', 'artifacts'],
      properties: {
        systemSummary: { type: 'object' },
        pipingSizing: { type: 'object' },
        storageDesign: { type: 'object' },
        pumpingDesign: { type: 'object' },
        hydraulicAnalysis: { type: 'object' },
        crossConnectionControl: { type: 'object' },
        connectionDetails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'distribution']
}));

export const reuseMonitoringTask = defineTask('reuse-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring Program Development',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Reuse Monitoring Specialist',
      task: 'Develop monitoring program for water reuse system',
      context: args,
      instructions: [
        '1. Define monitoring parameters',
        '2. Establish monitoring locations',
        '3. Determine monitoring frequencies',
        '4. Specify analytical methods',
        '5. Design online monitoring systems',
        '6. Develop QA/QC procedures',
        '7. Establish alert thresholds',
        '8. Design data management system',
        '9. Develop reporting protocols',
        '10. Document monitoring program'
      ],
      outputFormat: 'JSON with monitoring plan, parameters, frequencies'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringPlan', 'parameters', 'frequencies', 'artifacts'],
      properties: {
        monitoringPlan: { type: 'object' },
        parameters: { type: 'array' },
        monitoringLocations: { type: 'array' },
        frequencies: { type: 'object' },
        onlineMonitoring: { type: 'array' },
        alertThresholds: { type: 'object' },
        qaqcProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'monitoring']
}));

export const publicOutreachTask = defineTask('public-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Public Outreach and Education',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Reuse Communications Specialist',
      task: 'Develop public outreach program for water reuse',
      context: args,
      instructions: [
        '1. Assess community attitudes and concerns',
        '2. Develop key messages',
        '3. Create educational materials',
        '4. Plan stakeholder engagement activities',
        '5. Design signage program',
        '6. Develop user education requirements',
        '7. Create website content',
        '8. Plan facility tours',
        '9. Develop media relations strategy',
        '10. Document outreach program'
      ],
      outputFormat: 'JSON with outreach plan, materials, stakeholder strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['outreachPlan', 'keyMessages', 'materials', 'artifacts'],
      properties: {
        outreachPlan: { type: 'object' },
        keyMessages: { type: 'array', items: { type: 'string' } },
        materials: { type: 'array' },
        stakeholderStrategy: { type: 'object' },
        signageProgram: { type: 'object' },
        userEducation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'outreach']
}));

export const implementationDocsTask = defineTask('implementation-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Documentation',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Reuse Project Manager',
      task: 'Compile implementation documentation',
      context: args,
      instructions: [
        '1. Prepare engineering report',
        '2. Compile permit applications',
        '3. Prepare operations manual',
        '4. Create user agreements template',
        '5. Develop emergency response plan',
        '6. Prepare construction documents',
        '7. Develop commissioning plan',
        '8. Create maintenance procedures',
        '9. Compile regulatory submittals',
        '10. Generate implementation summary'
      ],
      outputFormat: 'JSON with document list, report path, implementation summary'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'implementationSummary', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        implementationSummary: { type: 'object' },
        permitApplications: { type: 'array' },
        operationsManual: { type: 'object' },
        emergencyPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-reuse', 'documentation']
}));
