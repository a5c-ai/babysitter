/**
 * @process specializations/domains/science/biomedical-engineering/risk-management-iso14971
 * @description Medical Device Risk Management per ISO 14971 - Conduct comprehensive risk management
 * throughout the medical device lifecycle including hazard identification, risk estimation, risk evaluation,
 * risk control, and residual risk assessment.
 * @inputs { deviceName: string, intendedUse: string, deviceCategory: string, existingRiskData?: object }
 * @outputs { success: boolean, riskManagementPlan: object, riskAnalysisReport: object, riskManagementFile: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/risk-management-iso14971', {
 *   deviceName: 'Cardiac Pacemaker',
 *   intendedUse: 'Cardiac rhythm management for bradycardia patients',
 *   deviceCategory: 'Active Implantable',
 *   existingRiskData: null
 * });
 *
 * @references
 * - ISO 14971:2019 Medical devices - Application of risk management to medical devices
 * - ISO/TR 24971:2020 Guidance on the application of ISO 14971
 * - FDA Guidance on Risk Management: https://www.fda.gov/regulatory-information/search-fda-guidance-documents
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    intendedUse,
    deviceCategory,
    existingRiskData = null
  } = inputs;

  // Phase 1: Risk Management Planning
  const riskManagementPlan = await ctx.task(riskManagementPlanningTask, {
    deviceName,
    intendedUse,
    deviceCategory
  });

  // Phase 2: Intended Use and Foreseeable Misuse Analysis
  const useAnalysis = await ctx.task(intendedUseAnalysisTask, {
    deviceName,
    intendedUse,
    deviceCategory,
    riskManagementPlan
  });

  // Phase 3: Hazard Identification
  const hazardIdentification = await ctx.task(hazardIdentificationTask, {
    deviceName,
    useAnalysis,
    deviceCategory,
    existingRiskData
  });

  // Quality Gate: Hazards must be identified
  if (!hazardIdentification.hazards || hazardIdentification.hazards.length === 0) {
    return {
      success: false,
      error: 'No hazards identified - analysis may be incomplete',
      phase: 'hazard-identification',
      riskManagementFile: null
    };
  }

  // Breakpoint: Review identified hazards
  await ctx.breakpoint({
    question: `Review ${hazardIdentification.hazards.length} identified hazards for ${deviceName}. Is the hazard identification complete?`,
    title: 'Hazard Identification Review',
    context: {
      runId: ctx.runId,
      deviceName,
      hazardCount: hazardIdentification.hazards.length,
      hazardCategories: hazardIdentification.categories,
      files: [{
        path: `artifacts/phase3-hazard-identification.json`,
        format: 'json',
        content: hazardIdentification
      }]
    }
  });

  // Phase 4: Risk Estimation
  const riskEstimation = await ctx.task(riskEstimationTask, {
    deviceName,
    hazards: hazardIdentification.hazards,
    riskManagementPlan,
    deviceCategory
  });

  // Phase 5: Risk Evaluation
  const riskEvaluation = await ctx.task(riskEvaluationTask, {
    deviceName,
    estimatedRisks: riskEstimation.risks,
    acceptabilityCriteria: riskManagementPlan.acceptabilityCriteria
  });

  // Quality Gate: Unacceptable risks must be addressed
  const unacceptableRisks = riskEvaluation.unacceptableRisks || [];
  if (unacceptableRisks.length > 0) {
    await ctx.breakpoint({
      question: `${unacceptableRisks.length} unacceptable risks identified for ${deviceName}. Review and proceed to risk control?`,
      title: 'Unacceptable Risks Identified',
      context: {
        runId: ctx.runId,
        unacceptableRisks,
        recommendation: 'Implement risk control measures to reduce risks to acceptable levels'
      }
    });
  }

  // Phase 6: Risk Control Implementation
  const riskControl = await ctx.task(riskControlTask, {
    deviceName,
    evaluatedRisks: riskEvaluation.evaluatedRisks,
    unacceptableRisks,
    deviceCategory
  });

  // Phase 7: Residual Risk Evaluation
  const residualRiskEvaluation = await ctx.task(residualRiskEvaluationTask, {
    deviceName,
    controlledRisks: riskControl.controlledRisks,
    acceptabilityCriteria: riskManagementPlan.acceptabilityCriteria
  });

  // Phase 8: Benefit-Risk Analysis
  const benefitRiskAnalysis = await ctx.task(benefitRiskAnalysisTask, {
    deviceName,
    intendedUse,
    residualRisks: residualRiskEvaluation.residualRisks,
    deviceBenefits: useAnalysis.deviceBenefits
  });

  // Phase 9: Production and Post-Production Monitoring Plan
  const monitoringPlan = await ctx.task(productionMonitoringTask, {
    deviceName,
    controlledRisks: riskControl.controlledRisks,
    residualRisks: residualRiskEvaluation.residualRisks,
    deviceCategory
  });

  // Phase 10: Risk Management File Compilation
  const riskManagementFile = await ctx.task(riskManagementFileTask, {
    deviceName,
    deviceCategory,
    intendedUse,
    riskManagementPlan,
    useAnalysis,
    hazardIdentification,
    riskEstimation,
    riskEvaluation,
    riskControl,
    residualRiskEvaluation,
    benefitRiskAnalysis,
    monitoringPlan
  });

  // Final Breakpoint: Risk Management Approval
  await ctx.breakpoint({
    question: `Risk Management complete for ${deviceName}. Overall risk acceptability: ${residualRiskEvaluation.overallAcceptability}. Approve Risk Management File?`,
    title: 'Risk Management Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      totalHazards: hazardIdentification.hazards.length,
      controlledRisks: riskControl.controlledRisks.length,
      overallAcceptability: residualRiskEvaluation.overallAcceptability,
      files: [
        { path: `artifacts/risk-management-file.json`, format: 'json', content: riskManagementFile },
        { path: `artifacts/benefit-risk-analysis.json`, format: 'json', content: benefitRiskAnalysis }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    deviceCategory,
    riskManagementPlan: riskManagementPlan.plan,
    riskAnalysisReport: {
      hazards: hazardIdentification.hazards,
      estimatedRisks: riskEstimation.risks,
      evaluatedRisks: riskEvaluation.evaluatedRisks,
      controlMeasures: riskControl.controlMeasures,
      residualRisks: residualRiskEvaluation.residualRisks
    },
    riskManagementFile: riskManagementFile.rmf,
    benefitRiskAnalysis: benefitRiskAnalysis.analysis,
    overallAcceptability: residualRiskEvaluation.overallAcceptability,
    monitoringPlan: monitoringPlan.plan,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/risk-management-iso14971',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const riskManagementPlanningTask = defineTask('risk-management-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Risk Management Planning - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist with expertise in ISO 14971',
      task: 'Develop comprehensive risk management plan for medical device',
      context: {
        deviceName: args.deviceName,
        intendedUse: args.intendedUse,
        deviceCategory: args.deviceCategory
      },
      instructions: [
        '1. Define scope of risk management activities',
        '2. Assign responsibilities and authorities for risk management',
        '3. Define risk acceptability criteria (probability x severity matrix)',
        '4. Establish requirements for design verification of risk control measures',
        '5. Define methods for collection and review of production/post-production information',
        '6. Specify risk analysis methods (FMEA, FTA, HAZOP, etc.)',
        '7. Define criteria for risk estimation (severity levels, probability levels)',
        '8. Establish documentation requirements',
        '9. Define review and approval process',
        '10. Plan risk management lifecycle activities'
      ],
      outputFormat: 'JSON object with comprehensive risk management plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'acceptabilityCriteria', 'analysisMethods'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            responsibilities: { type: 'array', items: { type: 'object' } },
            timeline: { type: 'string' },
            reviewFrequency: { type: 'string' }
          }
        },
        acceptabilityCriteria: {
          type: 'object',
          properties: {
            severityLevels: { type: 'array', items: { type: 'object' } },
            probabilityLevels: { type: 'array', items: { type: 'object' } },
            riskMatrix: { type: 'object' },
            acceptableRegion: { type: 'string' },
            alarRegion: { type: 'string' },
            unacceptableRegion: { type: 'string' }
          }
        },
        analysisMethods: { type: 'array', items: { type: 'string' } },
        verificationRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'planning', 'medical-device']
}));

export const intendedUseAnalysisTask = defineTask('intended-use-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Intended Use Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Risk Analyst with expertise in medical device use analysis',
      task: 'Analyze intended use and reasonably foreseeable misuse of medical device',
      context: {
        deviceName: args.deviceName,
        intendedUse: args.intendedUse,
        deviceCategory: args.deviceCategory,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Document intended medical indication and patient population',
        '2. Identify intended users and their training levels',
        '3. Document intended use environment and conditions',
        '4. Identify reasonably foreseeable misuse scenarios',
        '5. Document intended device lifetime and maintenance',
        '6. Identify device benefits and therapeutic claims',
        '7. Analyze patient contact characteristics (duration, nature)',
        '8. Document contraindications and warnings',
        '9. Identify user interface and interaction points',
        '10. Document accessories and combination product considerations'
      ],
      outputFormat: 'JSON object with comprehensive intended use analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['intendedUseCharacteristics', 'foreseeableMisuse', 'deviceBenefits'],
      properties: {
        intendedUseCharacteristics: {
          type: 'object',
          properties: {
            medicalIndication: { type: 'string' },
            patientPopulation: { type: 'object' },
            intendedUsers: { type: 'array', items: { type: 'object' } },
            useEnvironment: { type: 'array', items: { type: 'string' } },
            deviceLifetime: { type: 'string' },
            patientContact: { type: 'object' }
          }
        },
        foreseeableMisuse: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              misuse: { type: 'string' },
              likelihood: { type: 'string' },
              potentialConsequence: { type: 'string' }
            }
          }
        },
        deviceBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefit: { type: 'string' },
              magnitude: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        contraindications: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'intended-use', 'medical-device']
}));

export const hazardIdentificationTask = defineTask('hazard-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Hazard Identification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomedical Safety Engineer with expertise in hazard analysis',
      task: 'Identify all hazards and hazardous situations for medical device',
      context: {
        deviceName: args.deviceName,
        useAnalysis: args.useAnalysis,
        deviceCategory: args.deviceCategory,
        existingRiskData: args.existingRiskData
      },
      instructions: [
        '1. Identify energy hazards (electrical, thermal, mechanical, radiation)',
        '2. Identify biological hazards (biocompatibility, infection, immunological)',
        '3. Identify chemical hazards (toxicity, flammability, corrosivity)',
        '4. Identify operational hazards (use errors, maintenance errors)',
        '5. Identify software/cybersecurity hazards if applicable',
        '6. Identify hazards from manufacturing and degradation',
        '7. Document hazardous situations for each hazard',
        '8. Identify harm resulting from hazardous situations',
        '9. Consider hazards from ISO 14971 Annex C checklist',
        '10. Document sequence of events leading to harm'
      ],
      outputFormat: 'JSON object with comprehensive hazard identification'
    },
    outputSchema: {
      type: 'object',
      required: ['hazards', 'categories', 'hazardousSituations'],
      properties: {
        hazards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hazardId: { type: 'string' },
              hazardDescription: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              hazardousSituations: { type: 'array', items: { type: 'string' } },
              potentialHarm: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            energy: { type: 'number' },
            biological: { type: 'number' },
            chemical: { type: 'number' },
            operational: { type: 'number' },
            software: { type: 'number' },
            environmental: { type: 'number' }
          }
        },
        hazardousSituations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              situationId: { type: 'string' },
              hazardId: { type: 'string' },
              description: { type: 'string' },
              eventSequence: { type: 'array', items: { type: 'string' } },
              potentialHarm: { type: 'string' }
            }
          }
        },
        annexCChecklist: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'hazard-identification', 'medical-device']
}));

export const riskEstimationTask = defineTask('risk-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Risk Estimation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quantitative Risk Analyst with expertise in medical device risk estimation',
      task: 'Estimate risk levels for all identified hazards',
      context: {
        deviceName: args.deviceName,
        hazards: args.hazards,
        riskManagementPlan: args.riskManagementPlan,
        deviceCategory: args.deviceCategory
      },
      instructions: [
        '1. Estimate probability of occurrence for each hazardous situation',
        '2. Estimate severity of harm for each hazardous situation',
        '3. Apply risk estimation criteria from risk management plan',
        '4. Document rationale for probability and severity estimates',
        '5. Consider existing controls in probability estimation',
        '6. Use available data (literature, field data, testing) for estimates',
        '7. Apply worst-case scenarios for conservative estimates',
        '8. Calculate risk level for each hazardous situation',
        '9. Document uncertainty in risk estimates',
        '10. Create risk estimation summary by category'
      ],
      outputFormat: 'JSON object with complete risk estimation'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'estimationSummary'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              hazardId: { type: 'string' },
              hazardousSituation: { type: 'string' },
              harm: { type: 'string' },
              probability: { type: 'string' },
              probabilityRationale: { type: 'string' },
              severity: { type: 'string' },
              severityRationale: { type: 'string' },
              riskLevel: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimationSummary: {
          type: 'object',
          properties: {
            totalRisks: { type: 'number' },
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' },
            uncertainties: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'risk-estimation', 'medical-device']
}));

export const riskEvaluationTask = defineTask('risk-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Risk Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Engineer with expertise in risk evaluation',
      task: 'Evaluate risks against acceptability criteria',
      context: {
        deviceName: args.deviceName,
        estimatedRisks: args.estimatedRisks,
        acceptabilityCriteria: args.acceptabilityCriteria
      },
      instructions: [
        '1. Apply risk acceptability criteria to each estimated risk',
        '2. Classify risks as acceptable, ALARP, or unacceptable',
        '3. Identify risks requiring risk control measures',
        '4. Prioritize risks for risk control implementation',
        '5. Document evaluation rationale for each risk',
        '6. Identify risks that may be reduced further',
        '7. Flag risks requiring benefit-risk analysis',
        '8. Create risk evaluation summary by category',
        '9. Document decisions for ALARP region risks',
        '10. Prepare risk control priority list'
      ],
      outputFormat: 'JSON object with complete risk evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluatedRisks', 'unacceptableRisks', 'controlRequired'],
      properties: {
        evaluatedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              acceptability: { type: 'string', enum: ['acceptable', 'alarp', 'unacceptable'] },
              evaluationRationale: { type: 'string' },
              controlRequired: { type: 'boolean' },
              benefitRiskRequired: { type: 'boolean' }
            }
          }
        },
        unacceptableRisks: { type: 'array', items: { type: 'string' } },
        alarpRisks: { type: 'array', items: { type: 'string' } },
        acceptableRisks: { type: 'array', items: { type: 'string' } },
        controlRequired: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        evaluationSummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'risk-evaluation', 'medical-device']
}));

export const riskControlTask = defineTask('risk-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Risk Control - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Safety Engineer with expertise in risk control measures',
      task: 'Identify and implement risk control measures following ISO 14971 hierarchy',
      context: {
        deviceName: args.deviceName,
        evaluatedRisks: args.evaluatedRisks,
        unacceptableRisks: args.unacceptableRisks,
        deviceCategory: args.deviceCategory
      },
      instructions: [
        '1. Apply risk control hierarchy: inherent safety, protective measures, information for safety',
        '2. Identify design changes to eliminate hazards (inherent safety)',
        '3. Identify protective measures in device or manufacturing process',
        '4. Identify information for safety (labeling, instructions, training)',
        '5. Analyze new hazards introduced by risk control measures',
        '6. Verify effectiveness of risk control measures',
        '7. Document risk control verification requirements',
        '8. Assess implementation of risk control measures',
        '9. Determine if risks are reduced as far as possible',
        '10. Document risk control traceability'
      ],
      outputFormat: 'JSON object with complete risk control documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['controlMeasures', 'controlledRisks', 'newHazards'],
      properties: {
        controlMeasures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              riskId: { type: 'string' },
              controlType: { type: 'string', enum: ['inherent-safety', 'protective-measure', 'information-for-safety'] },
              description: { type: 'string' },
              verificationMethod: { type: 'string' },
              implementationStatus: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        controlledRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              originalRiskLevel: { type: 'string' },
              controlMeasures: { type: 'array', items: { type: 'string' } },
              residualRiskLevel: { type: 'string' }
            }
          }
        },
        newHazards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceControl: { type: 'string' },
              newHazard: { type: 'string' },
              disposition: { type: 'string' }
            }
          }
        },
        verificationRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'risk-control', 'medical-device']
}));

export const residualRiskEvaluationTask = defineTask('residual-risk-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Residual Risk Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist with expertise in residual risk assessment',
      task: 'Evaluate residual risks after risk control implementation',
      context: {
        deviceName: args.deviceName,
        controlledRisks: args.controlledRisks,
        acceptabilityCriteria: args.acceptabilityCriteria
      },
      instructions: [
        '1. Estimate residual risk level after control measures',
        '2. Evaluate residual risks against acceptability criteria',
        '3. Determine if further risk reduction is practicable',
        '4. Assess overall residual risk acceptability',
        '5. Document residual risk rationale',
        '6. Identify risks requiring disclosure in labeling',
        '7. Compile residual risk summary',
        '8. Determine if benefit-risk analysis is needed',
        '9. Document acceptability decision for each residual risk',
        '10. Calculate overall risk acceptability score'
      ],
      outputFormat: 'JSON object with complete residual risk evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['residualRisks', 'overallAcceptability', 'disclosureRequired'],
      properties: {
        residualRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              residualProbability: { type: 'string' },
              residualSeverity: { type: 'string' },
              residualRiskLevel: { type: 'string' },
              acceptability: { type: 'string' },
              furtherReductionPracticable: { type: 'boolean' },
              rationale: { type: 'string' }
            }
          }
        },
        overallAcceptability: { type: 'string', enum: ['acceptable', 'acceptable-with-disclosure', 'unacceptable'] },
        disclosureRequired: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              disclosureContent: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        benefitRiskRequired: { type: 'array', items: { type: 'string' } },
        acceptabilitySummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'residual-risk', 'medical-device']
}));

export const benefitRiskAnalysisTask = defineTask('benefit-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Benefit-Risk Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Risk Analyst with expertise in benefit-risk assessment',
      task: 'Conduct benefit-risk analysis for medical device',
      context: {
        deviceName: args.deviceName,
        intendedUse: args.intendedUse,
        residualRisks: args.residualRisks,
        deviceBenefits: args.deviceBenefits
      },
      instructions: [
        '1. Quantify medical benefits of the device',
        '2. Characterize severity and probability of residual risks',
        '3. Compare benefits against residual risks',
        '4. Consider alternative treatments and their risks',
        '5. Assess state of the art and generally accepted risks',
        '6. Document benefit-risk comparison methodology',
        '7. Determine if benefits outweigh residual risks',
        '8. Document evidence supporting benefit claims',
        '9. Consider patient population risk tolerance',
        '10. Provide benefit-risk conclusion with rationale'
      ],
      outputFormat: 'JSON object with complete benefit-risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'conclusion'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            benefits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  benefit: { type: 'string' },
                  magnitude: { type: 'string' },
                  probability: { type: 'string' },
                  evidence: { type: 'string' }
                }
              }
            },
            residualRisks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  severity: { type: 'string' },
                  probability: { type: 'string' }
                }
              }
            },
            alternatives: { type: 'array', items: { type: 'string' } },
            stateOfTheArt: { type: 'string' }
          }
        },
        conclusion: {
          type: 'object',
          properties: {
            benefitsOutweighRisks: { type: 'boolean' },
            rationale: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'benefit-risk', 'medical-device']
}));

export const productionMonitoringTask = defineTask('production-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Production Monitoring Plan - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Post-Market Surveillance Specialist with expertise in risk monitoring',
      task: 'Develop production and post-production risk monitoring plan',
      context: {
        deviceName: args.deviceName,
        controlledRisks: args.controlledRisks,
        residualRisks: args.residualRisks,
        deviceCategory: args.deviceCategory
      },
      instructions: [
        '1. Define information collection mechanisms (complaints, MDR, literature)',
        '2. Establish criteria for reviewing production/post-production information',
        '3. Define process for evaluating new hazard information',
        '4. Establish process for updating risk management file',
        '5. Define triggers for risk management file review',
        '6. Plan periodic safety update reports',
        '7. Establish post-market clinical follow-up if needed',
        '8. Define process for trending and signal detection',
        '9. Establish communication channels with regulatory authorities',
        '10. Define corrective action process for new safety signals'
      ],
      outputFormat: 'JSON object with complete monitoring plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'triggers', 'reportingRequirements'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            informationSources: { type: 'array', items: { type: 'string' } },
            reviewFrequency: { type: 'string' },
            responsibilities: { type: 'array', items: { type: 'object' } },
            evaluationCriteria: { type: 'array', items: { type: 'string' } },
            updateProcess: { type: 'string' }
          }
        },
        triggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              threshold: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        reportingRequirements: {
          type: 'object',
          properties: {
            mdrReporting: { type: 'object' },
            psurRequirements: { type: 'object' },
            pmcfPlan: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'post-market', 'medical-device']
}));

export const riskManagementFileTask = defineTask('risk-management-file', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Risk Management File - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Manager with expertise in risk management documentation',
      task: 'Compile comprehensive risk management file per ISO 14971',
      context: {
        deviceName: args.deviceName,
        deviceCategory: args.deviceCategory,
        intendedUse: args.intendedUse,
        riskManagementPlan: args.riskManagementPlan,
        useAnalysis: args.useAnalysis,
        hazardIdentification: args.hazardIdentification,
        riskEstimation: args.riskEstimation,
        riskEvaluation: args.riskEvaluation,
        riskControl: args.riskControl,
        residualRiskEvaluation: args.residualRiskEvaluation,
        benefitRiskAnalysis: args.benefitRiskAnalysis,
        monitoringPlan: args.monitoringPlan
      },
      instructions: [
        '1. Compile risk management plan',
        '2. Document intended use and characteristics analysis',
        '3. Compile hazard identification records',
        '4. Document risk estimation and evaluation records',
        '5. Compile risk control records with verification evidence',
        '6. Document residual risk evaluation',
        '7. Include benefit-risk analysis if applicable',
        '8. Document overall residual risk evaluation',
        '9. Include production/post-production information review plan',
        '10. Create risk management report summary'
      ],
      outputFormat: 'JSON object with complete risk management file'
    },
    outputSchema: {
      type: 'object',
      required: ['rmf', 'completeness', 'riskManagementReport'],
      properties: {
        rmf: {
          type: 'object',
          properties: {
            tableOfContents: { type: 'array', items: { type: 'string' } },
            riskManagementPlan: { type: 'object' },
            intendedUseAnalysis: { type: 'object' },
            hazardIdentificationRecords: { type: 'object' },
            riskEstimationRecords: { type: 'object' },
            riskEvaluationRecords: { type: 'object' },
            riskControlRecords: { type: 'object' },
            residualRiskEvaluation: { type: 'object' },
            benefitRiskAnalysis: { type: 'object' },
            productionMonitoringPlan: { type: 'object' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            missingElements: { type: 'array', items: { type: 'string' } }
          }
        },
        riskManagementReport: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            totalHazards: { type: 'number' },
            controlledRisks: { type: 'number' },
            residualRisksAcceptable: { type: 'boolean' },
            overallConclusion: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk-management', 'iso-14971', 'documentation', 'medical-device']
}));
