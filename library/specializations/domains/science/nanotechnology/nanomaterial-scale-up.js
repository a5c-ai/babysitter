/**
 * @process specializations/domains/science/nanotechnology/nanomaterial-scale-up
 * @description Nanomaterial Scale-Up and Process Transfer - Transfer laboratory synthesis protocols
 * to pilot and production scale including heat/mass transfer analysis, reactor design optimization,
 * batch consistency validation, quality control checkpoint implementation, and manufacturing documentation.
 * @inputs { labProtocol: object, targetScale: object, productionRequirements?: object }
 * @outputs { success: boolean, scaleUpProtocol: object, reactorDesign: object, qualityCheckpoints: array, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanomaterial-scale-up', {
 *   labProtocol: { name: 'Au-NP-citrate', batchSize: '100mL', yield: 95 },
 *   targetScale: { batchSize: '100L', throughput: '10kg/month' },
 *   productionRequirements: { gmp: false, continuousOperation: true }
 * });
 *
 * @references
 * - ISO/TS 80004: Nanotechnologies - Vocabulary: https://www.iso.org/standard/68058.html
 * - NIST Nanotechnology Standards: https://www.nist.gov/nanotechnology/nist-nanotechnology-standards
 * - Microfluidic Nanoparticle Synthesis: https://www.sciencedirect.com/science/article/pii/S2211339816300442
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    labProtocol,
    targetScale,
    productionRequirements = {},
    maxIterations = 3,
    consistencyTarget = 90
  } = inputs;

  // Phase 1: Scale-Up Feasibility Assessment
  const feasibilityAssessment = await ctx.task(scaleUpFeasibilityTask, {
    labProtocol,
    targetScale,
    productionRequirements
  });

  if (!feasibilityAssessment.feasible) {
    return {
      success: false,
      error: 'Scale-up not feasible with current protocol',
      barriers: feasibilityAssessment.barriers,
      recommendations: feasibilityAssessment.recommendations
    };
  }

  await ctx.breakpoint({
    question: `Scale-up feasibility confirmed for ${labProtocol.name}. Scale factor: ${feasibilityAssessment.scaleFactor}x. Proceed?`,
    title: 'Scale-Up Feasibility Review',
    context: {
      runId: ctx.runId,
      labProtocol,
      targetScale,
      feasibilityAssessment
    }
  });

  // Phase 2: Heat and Mass Transfer Analysis
  const transferAnalysis = await ctx.task(heatMassTransferTask, {
    labProtocol,
    targetScale,
    feasibilityAssessment
  });

  // Phase 3: Reactor Design Optimization
  const reactorDesign = await ctx.task(reactorDesignTask, {
    labProtocol,
    targetScale,
    transferAnalysis,
    productionRequirements
  });

  await ctx.breakpoint({
    question: `Reactor design complete: ${reactorDesign.reactorType}. Review and approve for pilot trials?`,
    title: 'Reactor Design Review',
    context: {
      runId: ctx.runId,
      reactorDesign,
      scaleFactor: feasibilityAssessment.scaleFactor
    }
  });

  // Phase 4: Scale-Up Protocol Development with Iteration
  let iteration = 0;
  let consistencyScore = 0;
  let scaleUpProtocol = null;
  const optimizationHistory = [];

  while (iteration < maxIterations && consistencyScore < consistencyTarget) {
    iteration++;

    const protocolDevelopment = await ctx.task(scaleUpProtocolTask, {
      labProtocol,
      targetScale,
      reactorDesign,
      transferAnalysis,
      iteration,
      previousResults: iteration > 1 ? optimizationHistory[iteration - 2] : null
    });

    // Batch consistency validation
    const consistencyValidation = await ctx.task(batchConsistencyTask, {
      scaleUpProtocol: protocolDevelopment,
      labProtocol,
      targetScale
    });

    consistencyScore = consistencyValidation.consistencyScore;
    scaleUpProtocol = protocolDevelopment;

    optimizationHistory.push({
      iteration,
      protocol: protocolDevelopment,
      consistencyValidation,
      consistencyScore
    });

    if (consistencyScore < consistencyTarget && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Consistency=${consistencyScore}% (target: ${consistencyTarget}%). Continue optimization?`,
        title: 'Scale-Up Optimization Progress',
        context: { runId: ctx.runId, iteration, consistencyScore, consistencyTarget }
      });
    }
  }

  // Phase 5: Quality Control Checkpoint Implementation
  const qcCheckpoints = await ctx.task(qcCheckpointImplementationTask, {
    scaleUpProtocol,
    labProtocol,
    productionRequirements
  });

  // Phase 6: Process Analytical Technology (PAT) Integration
  const patIntegration = await ctx.task(patIntegrationTask, {
    scaleUpProtocol,
    reactorDesign,
    qcCheckpoints
  });

  // Phase 7: Manufacturing Documentation
  const manufacturingDocs = await ctx.task(manufacturingDocumentationTask, {
    labProtocol,
    scaleUpProtocol,
    reactorDesign,
    qcCheckpoints,
    patIntegration,
    productionRequirements,
    optimizationHistory
  });

  // Phase 8: Risk Assessment and Mitigation
  const riskAssessment = await ctx.task(scaleUpRiskAssessmentTask, {
    scaleUpProtocol,
    reactorDesign,
    targetScale
  });

  await ctx.breakpoint({
    question: `Scale-up complete. Consistency: ${consistencyScore}%. Risk level: ${riskAssessment.overallRiskLevel}. Approve for production transfer?`,
    title: 'Scale-Up Approval',
    context: {
      runId: ctx.runId,
      consistencyScore,
      riskAssessment,
      files: [{ path: 'artifacts/manufacturing-documentation.md', format: 'markdown' }]
    }
  });

  return {
    success: true,
    scaleUpProtocol,
    reactorDesign,
    qualityCheckpoints: qcCheckpoints,
    patIntegration,
    consistencyScore,
    riskAssessment,
    documentation: manufacturingDocs,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanomaterial-scale-up',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const scaleUpFeasibilityTask = defineTask('scale-up-feasibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess scale-up feasibility',
  agent: {
    name: 'process-scale-up-engineer',
    prompt: {
      role: 'Process Scale-Up Engineer specializing in Nanomaterials',
      task: 'Assess feasibility of scaling up nanomaterial synthesis',
      context: args,
      instructions: [
        '1. Calculate scale-up factor (target/lab batch size)',
        '2. Identify scale-dependent phenomena (mixing, heat transfer, nucleation)',
        '3. Assess equipment requirements and availability',
        '4. Evaluate raw material supply chain for larger quantities',
        '5. Identify potential scale-up barriers',
        '6. Assess regulatory and safety implications',
        '7. Evaluate economic viability at scale',
        '8. Identify critical process parameters to maintain',
        '9. Recommend scale-up strategy (direct, stepwise, continuous)',
        '10. Provide feasibility assessment with confidence level'
      ],
      outputFormat: 'JSON object with feasibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'scaleFactor', 'strategy'],
      properties: {
        feasible: { type: 'boolean' },
        scaleFactor: { type: 'number' },
        strategy: { type: 'string' },
        barriers: { type: 'array', items: { type: 'string' } },
        criticalParameters: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidenceLevel: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'feasibility']
}));

export const heatMassTransferTask = defineTask('heat-mass-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze heat and mass transfer',
  agent: {
    name: 'chemical-engineer',
    prompt: {
      role: 'Chemical Engineer specializing in Transport Phenomena',
      task: 'Analyze heat and mass transfer considerations for scale-up',
      context: args,
      instructions: [
        '1. Calculate dimensionless numbers (Re, Nu, Sh, Da) at both scales',
        '2. Analyze mixing time and homogeneity at scale',
        '3. Evaluate heat transfer coefficients and cooling requirements',
        '4. Assess mass transfer limitations for reagent addition',
        '5. Model nucleation and growth kinetics at scale',
        '6. Identify mixing dead zones and concentration gradients',
        '7. Design appropriate mixing strategy (impeller type, speed)',
        '8. Calculate residence time distribution effects',
        '9. Recommend process modifications for uniform conditions',
        '10. Provide scale-up correlations and design criteria'
      ],
      outputFormat: 'JSON object with transfer analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionlessNumbers', 'mixingAnalysis', 'heatTransfer', 'massTransfer'],
      properties: {
        dimensionlessNumbers: { type: 'object' },
        mixingAnalysis: { type: 'object' },
        heatTransfer: { type: 'object' },
        massTransfer: { type: 'object' },
        scaleUpCorrelations: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'transport-phenomena']
}));

export const reactorDesignTask = defineTask('reactor-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize reactor design',
  agent: {
    name: 'reactor-engineer',
    prompt: {
      role: 'Reactor Design Engineer',
      task: 'Design optimal reactor for scaled nanomaterial production',
      context: args,
      instructions: [
        '1. Select reactor type (batch, CSTR, PFR, microfluidic)',
        '2. Design reactor geometry and dimensions',
        '3. Specify materials of construction',
        '4. Design mixing system (impeller type, baffles)',
        '5. Design heat exchange system',
        '6. Specify reagent addition system (pumps, nozzles)',
        '7. Design sampling and monitoring ports',
        '8. Include safety features (pressure relief, emergency cooling)',
        '9. Consider cleaning and maintenance access',
        '10. Provide detailed reactor specifications'
      ],
      outputFormat: 'JSON object with reactor design'
    },
    outputSchema: {
      type: 'object',
      required: ['reactorType', 'dimensions', 'specifications'],
      properties: {
        reactorType: { type: 'string' },
        dimensions: { type: 'object' },
        materialsOfConstruction: { type: 'object' },
        mixingSystem: { type: 'object' },
        heatExchange: { type: 'object' },
        reagentAddition: { type: 'object' },
        safetyFeatures: { type: 'array', items: { type: 'string' } },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'reactor-design']
}));

export const scaleUpProtocolTask = defineTask('scale-up-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop scale-up protocol (iteration ${args.iteration})`,
  agent: {
    name: 'process-development-scientist',
    prompt: {
      role: 'Process Development Scientist',
      task: 'Develop scaled-up synthesis protocol',
      context: args,
      instructions: [
        '1. Translate lab protocol to production scale',
        '2. Adjust reagent quantities and concentrations',
        '3. Modify addition rates and sequences',
        '4. Specify temperature control requirements',
        '5. Define mixing parameters at scale',
        '6. Include process hold times and intermediate steps',
        '7. Define in-process controls and sampling points',
        '8. Incorporate feedback from previous iterations',
        '9. Specify cleaning procedures between batches',
        '10. Document all scale-up modifications with rationale'
      ],
      outputFormat: 'JSON object with scale-up protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'modifications', 'processParameters'],
      properties: {
        protocol: { type: 'object' },
        modifications: { type: 'array', items: { type: 'object' } },
        processParameters: { type: 'object' },
        inProcessControls: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'protocol', `iteration-${args.iteration}`]
}));

export const batchConsistencyTask = defineTask('batch-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate batch consistency',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Validate batch-to-batch consistency at scale',
      context: args,
      instructions: [
        '1. Define critical quality attributes (CQAs) for comparison',
        '2. Compare scaled batch properties with lab reference',
        '3. Assess particle size distribution consistency',
        '4. Evaluate yield consistency across batches',
        '5. Assess purity and impurity profile consistency',
        '6. Calculate statistical process capability (Cp, Cpk)',
        '7. Identify sources of batch-to-batch variability',
        '8. Compare with acceptance criteria',
        '9. Calculate overall consistency score',
        '10. Recommend improvements for better consistency'
      ],
      outputFormat: 'JSON object with consistency validation'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'cqaComparison', 'processCapability'],
      properties: {
        consistencyScore: { type: 'number' },
        cqaComparison: { type: 'array', items: { type: 'object' } },
        processCapability: { type: 'object' },
        variabilitySources: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'consistency']
}));

export const qcCheckpointImplementationTask = defineTask('qc-checkpoint-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement QC checkpoints',
  agent: {
    name: 'qc-specialist',
    prompt: {
      role: 'Quality Control Specialist',
      task: 'Implement quality control checkpoints for production',
      context: args,
      instructions: [
        '1. Define incoming raw material QC tests',
        '2. Establish in-process control points and limits',
        '3. Define intermediate product hold criteria',
        '4. Specify sampling procedures and frequencies',
        '5. Define analytical methods for each checkpoint',
        '6. Establish acceptance criteria and action limits',
        '7. Design out-of-specification response procedures',
        '8. Implement statistical process control charts',
        '9. Define release testing requirements',
        '10. Create QC documentation and forms'
      ],
      outputFormat: 'JSON object with QC checkpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['checkpoints', 'samplingPlan', 'acceptanceCriteria'],
      properties: {
        checkpoints: { type: 'array', items: { type: 'object' } },
        samplingPlan: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        oosResponse: { type: 'object' },
        spcCharts: { type: 'array', items: { type: 'string' } },
        releaseTesting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'quality-control']
}));

export const patIntegrationTask = defineTask('pat-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate process analytical technology',
  agent: {
    name: 'pat-specialist',
    prompt: {
      role: 'Process Analytical Technology Specialist',
      task: 'Integrate PAT for real-time process monitoring',
      context: args,
      instructions: [
        '1. Identify PAT opportunities in the process',
        '2. Select appropriate in-line/on-line analyzers',
        '3. Design real-time particle size monitoring (DLS, turbidity)',
        '4. Implement spectroscopic monitoring (UV-Vis, Raman)',
        '5. Design automated feedback control loops',
        '6. Integrate PAT data with process control system',
        '7. Establish multivariate process models',
        '8. Define real-time release testing potential',
        '9. Plan data management and trending',
        '10. Validate PAT methods'
      ],
      outputFormat: 'JSON object with PAT integration'
    },
    outputSchema: {
      type: 'object',
      required: ['patMethods', 'controlLoops', 'dataManagement'],
      properties: {
        patMethods: { type: 'array', items: { type: 'object' } },
        controlLoops: { type: 'array', items: { type: 'object' } },
        processModels: { type: 'object' },
        dataManagement: { type: 'object' },
        validationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'pat']
}));

export const manufacturingDocumentationTask = defineTask('manufacturing-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create manufacturing documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Manufacturing Documentation Specialist',
      task: 'Create comprehensive manufacturing documentation',
      context: args,
      instructions: [
        '1. Create master batch record template',
        '2. Document standard operating procedures (SOPs)',
        '3. Write equipment operation instructions',
        '4. Document cleaning validation procedures',
        '5. Create operator training materials',
        '6. Document process flow diagrams (PFD) and P&IDs',
        '7. Write safety and emergency procedures',
        '8. Document environmental monitoring requirements',
        '9. Create deviation and CAPA procedures',
        '10. Compile technology transfer package'
      ],
      outputFormat: 'JSON object with manufacturing documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['batchRecord', 'sops', 'techTransferPackage'],
      properties: {
        batchRecord: { type: 'object' },
        sops: { type: 'array', items: { type: 'object' } },
        trainingMaterials: { type: 'object' },
        processFlowDiagrams: { type: 'array', items: { type: 'string' } },
        safetyProcedures: { type: 'object' },
        techTransferPackage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'documentation']
}));

export const scaleUpRiskAssessmentTask = defineTask('scale-up-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess scale-up risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Process Risk Analyst',
      task: 'Conduct risk assessment for scale-up',
      context: args,
      instructions: [
        '1. Identify process hazards (HAZOP analysis)',
        '2. Assess scale-related failure modes (FMEA)',
        '3. Evaluate process safety risks',
        '4. Assess quality risks at scale',
        '5. Evaluate supply chain risks',
        '6. Assess regulatory compliance risks',
        '7. Calculate risk priority numbers',
        '8. Develop risk mitigation strategies',
        '9. Define risk monitoring metrics',
        '10. Provide overall risk level assessment'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskLevel', 'hazards', 'mitigationStrategies'],
      properties: {
        overallRiskLevel: { type: 'string' },
        hazards: { type: 'array', items: { type: 'object' } },
        failureModes: { type: 'array', items: { type: 'object' } },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        monitoringMetrics: { type: 'array', items: { type: 'string' } },
        residualRisks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'scale-up', 'risk-assessment']
}));
