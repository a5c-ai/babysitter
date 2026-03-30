/**
 * @process specializations/domains/science/nanotechnology/nanoparticle-synthesis-protocol
 * @description Nanoparticle Synthesis Protocol Development - Design, optimize, and validate synthesis protocols
 * for nanoparticles (metal, semiconductor, metal oxide) including precursor selection, reaction parameter optimization,
 * size/shape control, purification procedures, and batch-to-batch reproducibility validation.
 * @inputs { nanoparticleType: string, targetSize: object, targetShape: string, materialSystem: string, applicationRequirements?: object }
 * @outputs { success: boolean, protocol: object, qualityMetrics: object, reproducibilityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanoparticle-synthesis-protocol', {
 *   nanoparticleType: 'gold',
 *   targetSize: { mean: 15, unit: 'nm', tolerance: 2 },
 *   targetShape: 'spherical',
 *   materialSystem: 'citrate-reduction',
 *   applicationRequirements: { biocompatible: true, surfacePlasmonResonance: true }
 * });
 *
 * @references
 * - Colloidal Nanoparticle Synthesis: A Best Practices Guide: https://pubs.acs.org/doi/10.1021/acs.chemmater.0c00095
 * - Sol-Gel Synthesis of Nanoparticles: https://www.sciencedirect.com/topics/chemistry/sol-gel-process
 * - Nanoparticle synthesis methods: A comprehensive review: https://www.sciencedirect.com/science/article/pii/S2352507X21000336
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    nanoparticleType,
    targetSize,
    targetShape = 'spherical',
    materialSystem,
    applicationRequirements = {},
    maxIterations = 5,
    targetYield = 80,
    targetPurity = 95
  } = inputs;

  // Phase 1: Precursor Selection and Reaction Design
  const reactionDesign = await ctx.task(reactionDesignTask, {
    nanoparticleType,
    targetSize,
    targetShape,
    materialSystem,
    applicationRequirements
  });

  // Quality Gate: Reaction design must be feasible
  if (!reactionDesign.feasible) {
    return {
      success: false,
      error: 'Reaction design not feasible with given constraints',
      phase: 'reaction-design',
      recommendations: reactionDesign.recommendations
    };
  }

  // Breakpoint: Review reaction design
  await ctx.breakpoint({
    question: `Review proposed synthesis route for ${nanoparticleType} nanoparticles. Approve to proceed with optimization?`,
    title: 'Synthesis Route Review',
    context: {
      runId: ctx.runId,
      nanoparticleType,
      targetSize,
      targetShape,
      proposedRoute: reactionDesign.synthesisRoute,
      precursors: reactionDesign.precursors,
      files: [{
        path: 'artifacts/reaction-design.json',
        format: 'json',
        content: reactionDesign
      }]
    }
  });

  // Phase 2: Parameter Optimization with Iterative Refinement
  let iteration = 0;
  let currentYield = 0;
  let currentPurity = 0;
  let optimizedParameters = null;
  const optimizationHistory = [];

  while (iteration < maxIterations && (currentYield < targetYield || currentPurity < targetPurity)) {
    iteration++;

    const parameterOptimization = await ctx.task(parameterOptimizationTask, {
      nanoparticleType,
      targetSize,
      targetShape,
      reactionDesign,
      iteration,
      previousResults: iteration > 1 ? optimizationHistory[iteration - 2] : null
    });

    // Synthesis simulation/prediction
    const synthesisSimulation = await ctx.task(synthesisSimulationTask, {
      parameters: parameterOptimization.optimizedParameters,
      reactionDesign,
      targetSize,
      targetShape
    });

    currentYield = synthesisSimulation.predictedYield;
    currentPurity = synthesisSimulation.predictedPurity;

    optimizationHistory.push({
      iteration,
      parameters: parameterOptimization.optimizedParameters,
      predictedYield: currentYield,
      predictedPurity: currentPurity,
      sizeDistribution: synthesisSimulation.predictedSizeDistribution
    });

    optimizedParameters = parameterOptimization.optimizedParameters;

    if (currentYield < targetYield || currentPurity < targetPurity) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Yield=${currentYield}%, Purity=${currentPurity}%. Continue optimization?`,
        title: 'Optimization Progress Review',
        context: {
          runId: ctx.runId,
          iteration,
          currentYield,
          currentPurity,
          targetYield,
          targetPurity
        }
      });
    }
  }

  // Phase 3: Purification Protocol Development
  const purificationProtocol = await ctx.task(purificationProtocolTask, {
    nanoparticleType,
    targetSize,
    synthesisRoute: reactionDesign.synthesisRoute,
    impurities: reactionDesign.expectedImpurities,
    targetPurity
  });

  // Phase 4: Size and Shape Control Validation
  const sizeShapeValidation = await ctx.task(sizeShapeValidationTask, {
    nanoparticleType,
    targetSize,
    targetShape,
    optimizedParameters,
    reactionDesign
  });

  // Quality Gate: Size/shape must meet specifications
  if (!sizeShapeValidation.meetsSpecifications) {
    await ctx.breakpoint({
      question: `Size/shape validation failed. Size deviation: ${sizeShapeValidation.sizeDeviation}nm. Review and approve alternative approach?`,
      title: 'Size/Shape Control Warning',
      context: {
        runId: ctx.runId,
        targetSize,
        achievedSize: sizeShapeValidation.achievedSize,
        recommendations: sizeShapeValidation.recommendations
      }
    });
  }

  // Phase 5: Batch Reproducibility Assessment
  const reproducibilityAssessment = await ctx.task(reproducibilityAssessmentTask, {
    nanoparticleType,
    optimizedParameters,
    reactionDesign,
    purificationProtocol,
    targetSize,
    targetShape
  });

  // Phase 6: Quality Control Protocol
  const qcProtocol = await ctx.task(qualityControlProtocolTask, {
    nanoparticleType,
    targetSize,
    targetShape,
    targetPurity,
    applicationRequirements
  });

  // Phase 7: Protocol Documentation
  const protocolDocumentation = await ctx.task(protocolDocumentationTask, {
    nanoparticleType,
    targetSize,
    targetShape,
    materialSystem,
    reactionDesign,
    optimizedParameters,
    purificationProtocol,
    qcProtocol,
    reproducibilityAssessment,
    optimizationHistory
  });

  // Final Breakpoint: Protocol Approval
  await ctx.breakpoint({
    question: `Nanoparticle synthesis protocol complete. Reproducibility: ${reproducibilityAssessment.score}/100. Approve for production use?`,
    title: 'Protocol Approval',
    context: {
      runId: ctx.runId,
      nanoparticleType,
      targetSize,
      achievedYield: currentYield,
      achievedPurity: currentPurity,
      reproducibilityScore: reproducibilityAssessment.score,
      files: [
        { path: 'artifacts/synthesis-protocol.md', format: 'markdown', content: protocolDocumentation.markdown },
        { path: 'artifacts/protocol-parameters.json', format: 'json', content: optimizedParameters }
      ]
    }
  });

  return {
    success: true,
    protocol: {
      reactionDesign,
      optimizedParameters,
      purificationProtocol,
      qcProtocol,
      documentation: protocolDocumentation
    },
    qualityMetrics: {
      yield: currentYield,
      purity: currentPurity,
      sizeControl: sizeShapeValidation.meetsSpecifications,
      sizeDistribution: sizeShapeValidation.achievedSize
    },
    reproducibilityScore: reproducibilityAssessment.score,
    optimizationIterations: iteration,
    artifacts: protocolDocumentation.artifacts,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanoparticle-synthesis-protocol',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const reactionDesignTask = defineTask('reaction-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design synthesis reaction for ${args.nanoparticleType} nanoparticles`,
  agent: {
    name: 'nanomaterials-chemist',
    prompt: {
      role: 'Senior Nanomaterials Chemist with expertise in colloidal synthesis',
      task: 'Design optimal synthesis reaction for nanoparticle production',
      context: args,
      instructions: [
        '1. Select appropriate precursor compounds based on target material and size',
        '2. Design reduction/nucleation mechanism for controlled growth',
        '3. Select stabilizing agents (surfactants, ligands) for size control',
        '4. Determine solvent system compatible with reaction chemistry',
        '5. Define reaction stoichiometry and concentration ranges',
        '6. Identify critical reaction parameters (temperature, pH, mixing rate)',
        '7. Predict expected impurities and byproducts',
        '8. Assess safety considerations and handling requirements',
        '9. Evaluate feasibility based on available equipment and reagents',
        '10. Provide alternative synthesis routes if primary route has limitations'
      ],
      outputFormat: 'JSON object with synthesis route design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'synthesisRoute', 'precursors', 'reactionConditions'],
      properties: {
        feasible: { type: 'boolean' },
        synthesisRoute: { type: 'string' },
        precursors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              compound: { type: 'string' },
              role: { type: 'string' },
              concentration: { type: 'string' },
              purity: { type: 'string' }
            }
          }
        },
        stabilizingAgents: { type: 'array', items: { type: 'string' } },
        solventSystem: { type: 'string' },
        reactionConditions: {
          type: 'object',
          properties: {
            temperature: { type: 'object' },
            pH: { type: 'object' },
            reactionTime: { type: 'object' },
            atmosphere: { type: 'string' }
          }
        },
        expectedImpurities: { type: 'array', items: { type: 'string' } },
        safetyConsiderations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'synthesis', 'reaction-design']
}));

export const parameterOptimizationTask = defineTask('parameter-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize synthesis parameters (iteration ${args.iteration})`,
  agent: {
    name: 'process-optimization-specialist',
    prompt: {
      role: 'Chemical Process Optimization Specialist',
      task: 'Optimize nanoparticle synthesis parameters for target properties',
      context: args,
      instructions: [
        '1. Analyze previous iteration results if available',
        '2. Apply design of experiments (DOE) principles for systematic optimization',
        '3. Optimize temperature profile for nucleation and growth control',
        '4. Adjust precursor addition rate for size uniformity',
        '5. Fine-tune stabilizer concentration for colloidal stability',
        '6. Optimize reaction time for complete conversion',
        '7. Consider multi-objective optimization (yield, purity, size control)',
        '8. Apply Bayesian optimization or response surface methodology',
        '9. Predict parameter sensitivity and robustness',
        '10. Document optimization rationale and expected improvements'
      ],
      outputFormat: 'JSON object with optimized parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'optimizationMethod', 'expectedImprovement'],
      properties: {
        optimizedParameters: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            precursorConcentration: { type: 'number' },
            stabilizerConcentration: { type: 'number' },
            reactionTime: { type: 'number' },
            additionRate: { type: 'number' },
            pH: { type: 'number' },
            stirringRate: { type: 'number' }
          }
        },
        optimizationMethod: { type: 'string' },
        expectedImprovement: { type: 'object' },
        parameterSensitivity: { type: 'object' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'synthesis', 'optimization', `iteration-${args.iteration}`]
}));

export const synthesisSimulationTask = defineTask('synthesis-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate synthesis outcome',
  agent: {
    name: 'computational-nanoscientist',
    prompt: {
      role: 'Computational Nanoscientist',
      task: 'Predict synthesis outcomes based on optimized parameters',
      context: args,
      instructions: [
        '1. Apply nucleation and growth kinetics models',
        '2. Predict particle size distribution using LaMer model or equivalent',
        '3. Estimate reaction yield based on conversion kinetics',
        '4. Predict purity based on reaction selectivity',
        '5. Model shape evolution based on surface energy considerations',
        '6. Estimate colloidal stability of product',
        '7. Identify potential failure modes and their probability',
        '8. Provide confidence intervals for predictions',
        '9. Compare predictions with literature benchmarks',
        '10. Flag any concerns with predicted outcomes'
      ],
      outputFormat: 'JSON object with synthesis predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictedYield', 'predictedPurity', 'predictedSizeDistribution'],
      properties: {
        predictedYield: { type: 'number' },
        predictedPurity: { type: 'number' },
        predictedSizeDistribution: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            standardDeviation: { type: 'number' },
            polydispersityIndex: { type: 'number' }
          }
        },
        predictedShape: { type: 'string' },
        colloidalStability: { type: 'string' },
        confidenceLevel: { type: 'number' },
        potentialIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'synthesis', 'simulation']
}));

export const purificationProtocolTask = defineTask('purification-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop purification protocol',
  agent: {
    name: 'separation-scientist',
    prompt: {
      role: 'Separation Science Specialist',
      task: 'Design purification protocol for nanoparticle product',
      context: args,
      instructions: [
        '1. Identify impurities requiring removal (unreacted precursors, byproducts)',
        '2. Select appropriate purification methods (centrifugation, dialysis, filtration)',
        '3. Design multi-step purification sequence if needed',
        '4. Optimize purification parameters to minimize product loss',
        '5. Specify wash solvents and number of wash cycles',
        '6. Define quality checkpoints during purification',
        '7. Address product stability during purification',
        '8. Estimate purification yield and purity improvement',
        '9. Provide scale-up considerations for purification',
        '10. Document waste handling and disposal procedures'
      ],
      outputFormat: 'JSON object with purification protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['purificationSteps', 'expectedPurity', 'expectedYieldLoss'],
      properties: {
        purificationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              method: { type: 'string' },
              parameters: { type: 'object' },
              targetImpurity: { type: 'string' },
              expectedRemoval: { type: 'number' }
            }
          }
        },
        expectedPurity: { type: 'number' },
        expectedYieldLoss: { type: 'number' },
        qualityCheckpoints: { type: 'array', items: { type: 'string' } },
        scaleUpConsiderations: { type: 'array', items: { type: 'string' } },
        wasteHandling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'synthesis', 'purification']
}));

export const sizeShapeValidationTask = defineTask('size-shape-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate size and shape control',
  agent: {
    name: 'nanocharacterization-expert',
    prompt: {
      role: 'Nanoparticle Characterization Expert',
      task: 'Validate size and shape control against specifications',
      context: args,
      instructions: [
        '1. Define characterization methods for size measurement (TEM, DLS, SAXS)',
        '2. Establish statistical sampling requirements for size distribution',
        '3. Define acceptance criteria for size and size distribution',
        '4. Specify shape analysis methodology (TEM image analysis)',
        '5. Calculate expected size deviation from target',
        '6. Assess uniformity and polydispersity',
        '7. Identify potential causes of size/shape deviation',
        '8. Recommend corrective actions if specifications not met',
        '9. Define long-term stability monitoring requirements',
        '10. Document measurement uncertainty and confidence'
      ],
      outputFormat: 'JSON object with size/shape validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecifications', 'achievedSize', 'sizeDeviation'],
      properties: {
        meetsSpecifications: { type: 'boolean' },
        achievedSize: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            standardDeviation: { type: 'number' },
            polydispersityIndex: { type: 'number' }
          }
        },
        sizeDeviation: { type: 'number' },
        shapeAnalysis: {
          type: 'object',
          properties: {
            dominantShape: { type: 'string' },
            shapePurity: { type: 'number' },
            aspectRatio: { type: 'number' }
          }
        },
        characterizationMethods: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'validation']
}));

export const reproducibilityAssessmentTask = defineTask('reproducibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess batch-to-batch reproducibility',
  agent: {
    name: 'quality-assurance-scientist',
    prompt: {
      role: 'Quality Assurance Scientist',
      task: 'Assess batch-to-batch reproducibility of synthesis protocol',
      context: args,
      instructions: [
        '1. Define critical quality attributes (CQAs) for reproducibility',
        '2. Design reproducibility study protocol (number of batches, operators)',
        '3. Analyze sources of variability (materials, equipment, environment)',
        '4. Calculate reproducibility metrics (RSD, Cp, Cpk)',
        '5. Identify critical process parameters affecting reproducibility',
        '6. Establish process control limits and specifications',
        '7. Assess equipment and operator dependencies',
        '8. Calculate overall reproducibility score',
        '9. Recommend improvements for enhanced reproducibility',
        '10. Define ongoing monitoring requirements'
      ],
      outputFormat: 'JSON object with reproducibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'criticalQualityAttributes', 'variabilitySources'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        criticalQualityAttributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              targetValue: { type: 'number' },
              tolerance: { type: 'number' },
              actualRSD: { type: 'number' }
            }
          }
        },
        variabilitySources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contribution: { type: 'number' },
              mitigation: { type: 'string' }
            }
          }
        },
        processCapability: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'quality', 'reproducibility']
}));

export const qualityControlProtocolTask = defineTask('quality-control-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop quality control protocol',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'Quality Control Specialist in Nanomaterials',
      task: 'Develop comprehensive quality control protocol',
      context: args,
      instructions: [
        '1. Define release specifications for nanoparticle product',
        '2. Select analytical methods for each quality attribute',
        '3. Establish sampling plans and acceptance criteria',
        '4. Define in-process controls during synthesis',
        '5. Specify equipment calibration requirements',
        '6. Design stability testing protocol',
        '7. Establish reference standard requirements',
        '8. Define out-of-specification (OOS) investigation procedures',
        '9. Create batch record documentation template',
        '10. Ensure alignment with relevant standards (ISO, ASTM)'
      ],
      outputFormat: 'JSON object with QC protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['releaseSpecifications', 'analyticalMethods', 'inProcessControls'],
      properties: {
        releaseSpecifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              specification: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        analyticalMethods: { type: 'array', items: { type: 'object' } },
        inProcessControls: { type: 'array', items: { type: 'object' } },
        samplingPlan: { type: 'object' },
        stabilityProtocol: { type: 'object' },
        oosInvestigation: { type: 'object' },
        applicableStandards: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'quality-control', 'protocol']
}));

export const protocolDocumentationTask = defineTask('protocol-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate protocol documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specializing in Nanomaterials',
      task: 'Generate comprehensive synthesis protocol documentation',
      context: args,
      instructions: [
        '1. Create executive summary of synthesis protocol',
        '2. Document complete materials and equipment list',
        '3. Write step-by-step synthesis procedure',
        '4. Include safety and handling precautions',
        '5. Document optimized parameters with rationale',
        '6. Include purification procedure details',
        '7. Document quality control checkpoints',
        '8. Include troubleshooting guide for common issues',
        '9. Add characterization requirements and methods',
        '10. Generate both technical and operator-friendly versions'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'technicalDocument', 'operatorProcedure', 'artifacts'],
      properties: {
        markdown: { type: 'string' },
        technicalDocument: { type: 'object' },
        operatorProcedure: { type: 'object' },
        troubleshootingGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'documentation', 'protocol']
}));
