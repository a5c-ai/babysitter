/**
 * @process chemical-engineering/scale-up-analysis
 * @description Perform systematic scale-up from laboratory to pilot to production scale, addressing scale-dependent phenomena
 * @inputs { processName: string, labScaleData: object, targetScale: object, scaleUpCriteria: object, outputDir: string }
 * @outputs { success: boolean, scaleUpPlan: object, pilotDesign: object, riskAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    labScaleData,
    targetScale,
    scaleUpCriteria = {},
    processType = 'batch',
    outputDir = 'scale-up-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Identify Scale-Dependent Phenomena
  ctx.log('info', 'Starting scale-up analysis: Identifying scale-dependent phenomena');
  const phenomenaResult = await ctx.task(scaleDependentPhenomenaTask, {
    processName,
    labScaleData,
    targetScale,
    processType,
    outputDir
  });

  if (!phenomenaResult.success) {
    return {
      success: false,
      error: 'Scale-dependent phenomena identification failed',
      details: phenomenaResult,
      metadata: { processId: 'chemical-engineering/scale-up-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...phenomenaResult.artifacts);

  // Task 2: Develop Scale-Up Criteria and Dimensionless Groups
  ctx.log('info', 'Developing scale-up criteria');
  const criteriaResult = await ctx.task(scaleUpCriteriaTask, {
    processName,
    scaleDependentPhenomena: phenomenaResult.phenomena,
    labScaleData,
    targetScale,
    scaleUpCriteria,
    outputDir
  });

  artifacts.push(...criteriaResult.artifacts);

  // Task 3: Design Pilot-Scale Experiments
  ctx.log('info', 'Designing pilot-scale experiments');
  const pilotDesignResult = await ctx.task(pilotScaleDesignTask, {
    processName,
    labScaleData,
    scaleUpCriteria: criteriaResult.criteria,
    targetScale,
    outputDir
  });

  artifacts.push(...pilotDesignResult.artifacts);

  // Task 4: Validate Models at Intermediate Scales
  ctx.log('info', 'Validating models at intermediate scales');
  const validationResult = await ctx.task(intermediateScaleValidationTask, {
    processName,
    labScaleData,
    pilotDesign: pilotDesignResult.design,
    scaleUpCriteria: criteriaResult.criteria,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  // Task 5: Address Mixing, Heat Transfer, and Mass Transfer Changes
  ctx.log('info', 'Analyzing transport phenomena changes');
  const transportResult = await ctx.task(transportPhenomenaTask, {
    processName,
    labScaleData,
    targetScale,
    scaleDependentPhenomena: phenomenaResult.phenomena,
    outputDir
  });

  artifacts.push(...transportResult.artifacts);

  // Breakpoint: Review scale-up analysis
  await ctx.breakpoint({
    question: `Scale-up analysis in progress for ${processName}. Scale factor: ${criteriaResult.scaleFactor}x. Critical phenomena: ${phenomenaResult.phenomena.length}. Key risk: ${transportResult.primaryRisk}. Review analysis?`,
    title: 'Scale-Up Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        scaleFactor: criteriaResult.scaleFactor,
        criticalPhenomena: phenomenaResult.phenomena,
        scaleUpBasis: criteriaResult.primaryCriterion,
        pilotScaleVolume: pilotDesignResult.design.volume
      }
    }
  });

  // Task 6: Manage Scale-Up Risks
  ctx.log('info', 'Assessing and managing scale-up risks');
  const riskAssessmentResult = await ctx.task(scaleUpRiskAssessmentTask, {
    processName,
    scaleDependentPhenomena: phenomenaResult.phenomena,
    transportAnalysis: transportResult,
    validationResults: validationResult,
    targetScale,
    outputDir
  });

  artifacts.push(...riskAssessmentResult.artifacts);

  // Task 7: Create Technology Transfer Package
  ctx.log('info', 'Creating technology transfer package');
  const transferPackageResult = await ctx.task(technologyTransferTask, {
    processName,
    labScaleData,
    pilotDesign: pilotDesignResult.design,
    scaleUpCriteria: criteriaResult.criteria,
    transportAnalysis: transportResult,
    riskAssessment: riskAssessmentResult,
    targetScale,
    outputDir
  });

  artifacts.push(...transferPackageResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    scaleUpPlan: {
      scaleFactor: criteriaResult.scaleFactor,
      primaryCriterion: criteriaResult.primaryCriterion,
      dimensionlessGroups: criteriaResult.dimensionlessGroups
    },
    pilotDesign: pilotDesignResult.design,
    transportAnalysis: transportResult.analysis,
    riskAssessment: riskAssessmentResult.assessment,
    technologyTransferPackage: transferPackageResult.packagePath,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/scale-up-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Scale-Dependent Phenomena Identification
export const scaleDependentPhenomenaTask = defineTask('scale-dependent-phenomena', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify scale-dependent phenomena',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'scale-up engineering specialist',
      task: 'Identify phenomena that change with scale',
      context: args,
      instructions: [
        'Review process chemistry and physics',
        'Identify mixing-sensitive reactions',
        'Assess heat transfer limitations at scale',
        'Identify mass transfer dependent steps',
        'Evaluate surface area to volume changes',
        'Assess shear sensitivity',
        'Identify crystallization/precipitation phenomena',
        'Document all scale-dependent phenomena with impact assessment'
      ],
      outputFormat: 'JSON with phenomena list, impact assessment, criticality ranking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phenomena', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        phenomena: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              impact: { type: 'string' },
              criticality: { type: 'string' }
            }
          }
        },
        impactAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'phenomena']
}));

// Task 2: Scale-Up Criteria Development
export const scaleUpCriteriaTask = defineTask('scale-up-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scale-up criteria and dimensionless groups',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'scale-up criteria analyst',
      task: 'Develop scale-up criteria using dimensionless analysis',
      context: args,
      instructions: [
        'Calculate relevant dimensionless groups (Re, Nu, Sh, Da, etc.)',
        'Identify primary scale-up criterion',
        'Evaluate constant power/volume scaling',
        'Evaluate constant tip speed scaling',
        'Evaluate geometric similarity requirements',
        'Determine which parameters cannot be matched',
        'Recommend scale-up basis with rationale',
        'Document dimensionless analysis'
      ],
      outputFormat: 'JSON with scale-up criteria, dimensionless groups, scale factor, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criteria', 'scaleFactor', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criteria: { type: 'object' },
        primaryCriterion: { type: 'string' },
        dimensionlessGroups: { type: 'object' },
        scaleFactor: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'criteria']
}));

// Task 3: Pilot-Scale Design
export const pilotScaleDesignTask = defineTask('pilot-scale-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pilot-scale experiments',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'pilot plant design engineer',
      task: 'Design pilot-scale experiments and equipment',
      context: args,
      instructions: [
        'Determine appropriate pilot scale (typically 10-100x lab)',
        'Design pilot equipment maintaining scale-up criteria',
        'Specify instrumentation for data collection',
        'Design experiments to validate scale-up assumptions',
        'Plan material requirements',
        'Estimate pilot campaign duration',
        'Define success criteria for pilot',
        'Create pilot plant design package'
      ],
      outputFormat: 'JSON with pilot design, equipment specs, experiment plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            volume: { type: 'number' },
            scaleFactor: { type: 'number' },
            equipment: { type: 'array' },
            instrumentation: { type: 'array' }
          }
        },
        experimentPlan: { type: 'object' },
        successCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'pilot-design']
}));

// Task 4: Intermediate Scale Validation
export const intermediateScaleValidationTask = defineTask('intermediate-scale-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate models at intermediate scales',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'scale-up validation engineer',
      task: 'Plan and execute model validation at intermediate scales',
      context: args,
      instructions: [
        'Define validation test plan',
        'Specify key parameters to measure',
        'Compare lab and pilot performance',
        'Validate kinetic models at pilot scale',
        'Validate heat and mass transfer predictions',
        'Identify model deviations',
        'Refine models based on pilot data',
        'Document validation results and model updates'
      ],
      outputFormat: 'JSON with validation plan, expected results, acceptance criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationPlan: {
          type: 'object',
          properties: {
            tests: { type: 'array' },
            parameters: { type: 'array' },
            acceptanceCriteria: { type: 'object' }
          }
        },
        expectedDeviations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'validation']
}));

// Task 5: Transport Phenomena Analysis
export const transportPhenomenaTask = defineTask('transport-phenomena', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address mixing, heat transfer, and mass transfer changes',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'transport phenomena engineer',
      task: 'Analyze and address transport phenomena changes with scale',
      context: args,
      instructions: [
        'Calculate mixing time changes with scale',
        'Assess heat transfer coefficient changes',
        'Evaluate mass transfer rate changes',
        'Analyze blend time and homogeneity',
        'Calculate power requirements at scale',
        'Identify bottleneck transport step',
        'Recommend design modifications to address changes',
        'Document transport analysis'
      ],
      outputFormat: 'JSON with transport analysis, changes, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'primaryRisk', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            mixingTime: { type: 'object' },
            heatTransfer: { type: 'object' },
            massTransfer: { type: 'object' },
            powerRequirements: { type: 'object' }
          }
        },
        primaryRisk: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'transport']
}));

// Task 6: Scale-Up Risk Assessment
export const scaleUpRiskAssessmentTask = defineTask('scale-up-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess and manage scale-up risks',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'scale-up risk analyst',
      task: 'Assess risks in scale-up and develop mitigation strategies',
      context: args,
      instructions: [
        'Identify technical scale-up risks',
        'Assess probability and impact of each risk',
        'Develop risk mitigation strategies',
        'Plan staged scale-up approach',
        'Identify go/no-go decision points',
        'Define fallback options',
        'Create contingency plans',
        'Document risk assessment and mitigation'
      ],
      outputFormat: 'JSON with risk assessment, mitigation strategies, staging plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            risks: { type: 'array' },
            overallRiskLevel: { type: 'string' },
            mitigationStrategies: { type: 'array' },
            stagingPlan: { type: 'array' }
          }
        },
        contingencyPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'risk']
}));

// Task 7: Technology Transfer Package
export const technologyTransferTask = defineTask('technology-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create technology transfer package',
  agent: {
    name: 'scale-up-engineer',
    prompt: {
      role: 'technology transfer engineer',
      task: 'Create comprehensive technology transfer package',
      context: args,
      instructions: [
        'Compile process description and basis',
        'Document scale-up methodology used',
        'Include all models and correlations',
        'Document critical process parameters',
        'Include equipment specifications',
        'Document operating procedures',
        'Include analytical methods',
        'Create complete technology transfer package'
      ],
      outputFormat: 'JSON with tech transfer package path, contents summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'packagePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        packagePath: { type: 'string' },
        contents: {
          type: 'object',
          properties: {
            processDescription: { type: 'boolean' },
            scaleUpBasis: { type: 'boolean' },
            equipmentSpecs: { type: 'boolean' },
            operatingProcedures: { type: 'boolean' },
            analyticalMethods: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'scale-up', 'tech-transfer']
}));
