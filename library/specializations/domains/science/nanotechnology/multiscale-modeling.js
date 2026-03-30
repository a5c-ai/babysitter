/**
 * @process specializations/domains/science/nanotechnology/multiscale-modeling
 * @description Multiscale Modeling Integration - Integrate computational models across length scales
 * (quantum, atomistic, mesoscale, continuum) for comprehensive nanomaterial behavior prediction
 * including parameter passing between scales, uncertainty quantification, and validation against
 * scale-appropriate experiments.
 * @inputs { material: object, targetPhenomenon: object, scaleRange: object, couplingStrategy?: string }
 * @outputs { success: boolean, multiscaleResults: object, scaleBridging: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/multiscale-modeling', {
 *   material: { type: 'nanocomposite', matrix: 'polymer', filler: 'graphene', loading: 5 },
 *   targetPhenomenon: { property: 'mechanical-response', conditions: 'tensile-loading' },
 *   scaleRange: { from: 'quantum', to: 'continuum' },
 *   couplingStrategy: 'sequential'
 * });
 *
 * @references
 * - COMSOL Multiphysics: https://www.comsol.com/
 * - Materials Studio: https://www.3ds.com/products-services/biovia/products/molecular-modeling-simulation/biovia-materials-studio/
 * - NanoHUB: https://nanohub.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    material,
    targetPhenomenon,
    scaleRange,
    couplingStrategy = 'sequential',
    experimentalBenchmarks = null
  } = inputs;

  // Phase 1: Multiscale Framework Design
  const frameworkDesign = await ctx.task(frameworkDesignTask, {
    material,
    targetPhenomenon,
    scaleRange,
    couplingStrategy
  });

  // Quality Gate: Framework must be feasible
  if (!frameworkDesign.feasible) {
    return {
      success: false,
      error: 'Multiscale modeling framework not feasible',
      phase: 'framework-design',
      recommendations: frameworkDesign.recommendations
    };
  }

  // Breakpoint: Review framework design
  await ctx.breakpoint({
    question: `Review multiscale framework: ${frameworkDesign.scales.length} scales from ${scaleRange.from} to ${scaleRange.to}. Coupling: ${couplingStrategy}. Approve?`,
    title: 'Multiscale Framework Review',
    context: {
      runId: ctx.runId,
      frameworkDesign,
      scales: frameworkDesign.scales,
      files: [{
        path: 'artifacts/framework-design.json',
        format: 'json',
        content: frameworkDesign
      }]
    }
  });

  // Phase 2: Scale-Specific Model Setup
  const scaleModels = {};

  // Quantum Scale (if needed)
  if (frameworkDesign.scales.includes('quantum')) {
    scaleModels.quantum = await ctx.task(quantumScaleSetupTask, {
      material,
      frameworkDesign,
      targetPhenomenon
    });
  }

  // Atomistic Scale
  if (frameworkDesign.scales.includes('atomistic')) {
    scaleModels.atomistic = await ctx.task(atomisticScaleSetupTask, {
      material,
      frameworkDesign,
      targetPhenomenon,
      quantumInputs: scaleModels.quantum
    });
  }

  // Mesoscale
  if (frameworkDesign.scales.includes('mesoscale')) {
    scaleModels.mesoscale = await ctx.task(mesoscaleSetupTask, {
      material,
      frameworkDesign,
      targetPhenomenon,
      atomisticInputs: scaleModels.atomistic
    });
  }

  // Continuum Scale
  if (frameworkDesign.scales.includes('continuum')) {
    scaleModels.continuum = await ctx.task(continuumScaleSetupTask, {
      material,
      frameworkDesign,
      targetPhenomenon,
      lowerScaleInputs: scaleModels.mesoscale || scaleModels.atomistic
    });
  }

  // Phase 3: Scale Bridging Implementation
  const scaleBridging = await ctx.task(scaleBridgingTask, {
    scaleModels,
    frameworkDesign,
    couplingStrategy
  });

  // Breakpoint: Review scale bridging
  await ctx.breakpoint({
    question: `Scale bridging configured. ${Object.keys(scaleBridging.connections).length} scale connections. Parameter transfer validated: ${scaleBridging.validated}. Proceed with calculations?`,
    title: 'Scale Bridging Review',
    context: {
      runId: ctx.runId,
      scaleBridging,
      connections: scaleBridging.connections
    }
  });

  // Phase 4: Sequential Scale Calculations
  const calculationResults = {};

  // Execute from smallest to largest scale
  for (const scale of frameworkDesign.scaleOrder) {
    const scaleCalculation = await ctx.task(scaleCalculationTask, {
      scale,
      scaleModel: scaleModels[scale],
      previousResults: calculationResults,
      scaleBridging,
      material,
      targetPhenomenon
    });

    calculationResults[scale] = scaleCalculation;

    // Breakpoint: Review scale calculation
    await ctx.breakpoint({
      question: `${scale} scale calculation complete. Key outputs: ${Object.keys(scaleCalculation.outputs).join(', ')}. Continue to next scale?`,
      title: `${scale.charAt(0).toUpperCase() + scale.slice(1)} Scale Review`,
      context: {
        runId: ctx.runId,
        scale,
        outputs: scaleCalculation.outputs,
        convergence: scaleCalculation.convergence
      }
    });
  }

  // Phase 5: Parameter Upscaling/Coarse-Graining
  const parameterTransfer = await ctx.task(parameterTransferTask, {
    calculationResults,
    scaleBridging,
    frameworkDesign
  });

  // Phase 6: Uncertainty Propagation
  const uncertaintyPropagation = await ctx.task(uncertaintyPropagationTask, {
    calculationResults,
    parameterTransfer,
    scaleBridging
  });

  // Phase 7: Cross-Scale Validation
  const crossScaleValidation = await ctx.task(crossScaleValidationTask, {
    calculationResults,
    parameterTransfer,
    frameworkDesign
  });

  // Quality Gate: Cross-scale consistency
  if (!crossScaleValidation.consistent) {
    await ctx.breakpoint({
      question: `Cross-scale inconsistencies detected: ${crossScaleValidation.inconsistencies.join(', ')}. Review and proceed?`,
      title: 'Cross-Scale Validation Warning',
      context: {
        runId: ctx.runId,
        crossScaleValidation,
        recommendations: crossScaleValidation.recommendations
      }
    });
  }

  // Phase 8: Experimental Validation (if benchmarks provided)
  let experimentalValidation = null;
  if (experimentalBenchmarks) {
    experimentalValidation = await ctx.task(experimentalValidationTask, {
      calculationResults,
      experimentalBenchmarks,
      frameworkDesign,
      targetPhenomenon
    });
  }

  // Phase 9: Results Integration
  const integratedResults = await ctx.task(resultsIntegrationTask, {
    calculationResults,
    parameterTransfer,
    uncertaintyPropagation,
    crossScaleValidation,
    experimentalValidation,
    material,
    targetPhenomenon
  });

  // Phase 10: Report Generation
  const multiscaleReport = await ctx.task(reportGenerationTask, {
    frameworkDesign,
    scaleModels,
    calculationResults,
    scaleBridging,
    parameterTransfer,
    uncertaintyPropagation,
    crossScaleValidation,
    experimentalValidation,
    integratedResults
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `Multiscale modeling complete. ${frameworkDesign.scales.length} scales integrated. Overall uncertainty: ${uncertaintyPropagation.overallUncertainty}. Approve results?`,
    title: 'Multiscale Results Approval',
    context: {
      runId: ctx.runId,
      integratedResults,
      validation: experimentalValidation,
      files: [
        { path: 'artifacts/multiscale-report.md', format: 'markdown', content: multiscaleReport.markdown },
        { path: 'artifacts/scale-results.json', format: 'json', content: calculationResults }
      ]
    }
  });

  return {
    success: true,
    multiscaleResults: calculationResults,
    scaleBridging: {
      connections: scaleBridging.connections,
      parameterTransfer
    },
    uncertaintyPropagation,
    crossScaleValidation,
    experimentalValidation,
    integratedResults,
    report: multiscaleReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/multiscale-modeling',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design multiscale modeling framework',
  agent: {
    name: 'multiscale-architect',
    prompt: {
      role: 'Multiscale Modeling Architect',
      task: 'Design comprehensive multiscale modeling framework',
      context: args,
      instructions: [
        '1. Identify relevant length and time scales',
        '2. Select appropriate methods for each scale',
        '3. Define scale boundaries and overlaps',
        '4. Design parameter passing strategy',
        '5. Select coupling approach (sequential, concurrent)',
        '6. Identify key descriptors at each scale',
        '7. Plan computational resource allocation',
        '8. Identify bridging challenges',
        '9. Define validation strategy at each scale',
        '10. Document framework design'
      ],
      outputFormat: 'JSON object with framework design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'scales', 'scaleOrder', 'methods'],
      properties: {
        feasible: { type: 'boolean' },
        scales: { type: 'array', items: { type: 'string' } },
        scaleOrder: { type: 'array', items: { type: 'string' } },
        methods: { type: 'object' },
        scaleBoundaries: { type: 'object' },
        couplingApproach: { type: 'string' },
        keyDescriptors: { type: 'object' },
        bridgingChallenges: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'framework']
}));

export const quantumScaleSetupTask = defineTask('quantum-scale-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup quantum scale model',
  agent: {
    name: 'quantum-specialist',
    prompt: {
      role: 'Quantum Scale Modeling Specialist',
      task: 'Setup quantum mechanical calculations for nanomaterial',
      context: args,
      instructions: [
        '1. Select appropriate quantum method (DFT, post-HF)',
        '2. Define representative system at quantum scale',
        '3. Select exchange-correlation functional',
        '4. Define basis set or plane-wave cutoff',
        '5. Plan calculations for target properties',
        '6. Identify properties to pass to atomistic scale',
        '7. Define convergence criteria',
        '8. Plan electronic structure analysis',
        '9. Estimate computational requirements',
        '10. Document quantum model setup'
      ],
      outputFormat: 'JSON object with quantum model setup'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'system', 'calculationPlan'],
      properties: {
        method: { type: 'string' },
        system: { type: 'object' },
        functional: { type: 'string' },
        basisSet: { type: 'string' },
        calculationPlan: { type: 'array' },
        outputsForUpscaling: { type: 'array' },
        convergenceCriteria: { type: 'object' },
        computationalRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'quantum']
}));

export const atomisticScaleSetupTask = defineTask('atomistic-scale-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup atomistic scale model',
  agent: {
    name: 'atomistic-specialist',
    prompt: {
      role: 'Atomistic Scale Modeling Specialist',
      task: 'Setup molecular dynamics/Monte Carlo simulations',
      context: args,
      instructions: [
        '1. Select appropriate atomistic method (MD, MC)',
        '2. Choose force field or use quantum-derived parameters',
        '3. Define simulation cell and boundary conditions',
        '4. Plan equilibration and production protocols',
        '5. Define properties to extract for mesoscale',
        '6. Plan coarse-graining analysis',
        '7. Define sampling strategy',
        '8. Estimate time and length scales accessible',
        '9. Plan trajectory analysis',
        '10. Document atomistic model setup'
      ],
      outputFormat: 'JSON object with atomistic model setup'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'forceField', 'simulationPlan'],
      properties: {
        method: { type: 'string' },
        forceField: { type: 'string' },
        systemSize: { type: 'object' },
        simulationPlan: { type: 'object' },
        outputsForUpscaling: { type: 'array' },
        coarseGrainingStrategy: { type: 'object' },
        timeScales: { type: 'object' },
        lengthScales: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'atomistic']
}));

export const mesoscaleSetupTask = defineTask('mesoscale-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup mesoscale model',
  agent: {
    name: 'mesoscale-specialist',
    prompt: {
      role: 'Mesoscale Modeling Specialist',
      task: 'Setup coarse-grained or mesoscale simulations',
      context: args,
      instructions: [
        '1. Select mesoscale method (DPD, CGMD, phase field)',
        '2. Define coarse-grained representation',
        '3. Derive CG potentials from atomistic data',
        '4. Define mesoscale simulation parameters',
        '5. Plan simulations for microstructure evolution',
        '6. Define outputs for continuum scale',
        '7. Validate CG model against atomistic',
        '8. Plan time and length scale mapping',
        '9. Estimate computational requirements',
        '10. Document mesoscale model setup'
      ],
      outputFormat: 'JSON object with mesoscale model setup'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'cgRepresentation', 'simulationPlan'],
      properties: {
        method: { type: 'string' },
        cgRepresentation: { type: 'object' },
        cgPotentials: { type: 'object' },
        simulationPlan: { type: 'object' },
        outputsForUpscaling: { type: 'array' },
        validationAgainstAtomistic: { type: 'object' },
        scaleMapping: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'mesoscale']
}));

export const continuumScaleSetupTask = defineTask('continuum-scale-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup continuum scale model',
  agent: {
    name: 'continuum-specialist',
    prompt: {
      role: 'Continuum Scale Modeling Specialist',
      task: 'Setup finite element or continuum simulations',
      context: args,
      instructions: [
        '1. Select continuum method (FEM, FVM)',
        '2. Define constitutive models from lower scales',
        '3. Setup geometry and mesh',
        '4. Define boundary conditions',
        '5. Incorporate microstructure effects',
        '6. Plan simulations for macroscale response',
        '7. Define convergence criteria',
        '8. Plan sensitivity analysis',
        '9. Estimate computational requirements',
        '10. Document continuum model setup'
      ],
      outputFormat: 'JSON object with continuum model setup'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'constitutiveModel', 'simulationPlan'],
      properties: {
        method: { type: 'string' },
        constitutiveModel: { type: 'object' },
        geometry: { type: 'object' },
        mesh: { type: 'object' },
        boundaryConditions: { type: 'object' },
        simulationPlan: { type: 'object' },
        microstructureEffects: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'continuum']
}));

export const scaleBridgingTask = defineTask('scale-bridging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure scale bridging',
  agent: {
    name: 'bridging-specialist',
    prompt: {
      role: 'Scale Bridging Specialist',
      task: 'Configure parameter transfer between scales',
      context: args,
      instructions: [
        '1. Define parameter mapping between scales',
        '2. Implement coarse-graining procedures',
        '3. Define upscaling algorithms',
        '4. Setup homogenization procedures',
        '5. Validate parameter transfer accuracy',
        '6. Define consistency checks',
        '7. Handle scale-dependent properties',
        '8. Document bridging methodology',
        '9. Assess bridging uncertainties',
        '10. Plan bridging validation'
      ],
      outputFormat: 'JSON object with scale bridging configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'validated', 'parameterMapping'],
      properties: {
        connections: { type: 'object' },
        validated: { type: 'boolean' },
        parameterMapping: { type: 'object' },
        coarseGraining: { type: 'object' },
        homogenization: { type: 'object' },
        consistencyChecks: { type: 'array' },
        uncertainties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'bridging']
}));

export const scaleCalculationTask = defineTask('scale-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute ${args.scale} scale calculation`,
  agent: {
    name: 'calculation-executor',
    prompt: {
      role: 'Scale Calculation Execution Specialist',
      task: `Execute calculations at ${args.scale} scale`,
      context: args,
      instructions: [
        '1. Incorporate inputs from previous scales',
        '2. Execute planned calculations',
        '3. Monitor convergence and stability',
        '4. Extract target properties',
        '5. Prepare outputs for next scale',
        '6. Validate against scale-appropriate benchmarks',
        '7. Assess calculation quality',
        '8. Document calculation details',
        '9. Calculate uncertainties',
        '10. Archive results'
      ],
      outputFormat: 'JSON object with scale calculation results'
    },
    outputSchema: {
      type: 'object',
      required: ['outputs', 'convergence', 'quality'],
      properties: {
        outputs: { type: 'object' },
        convergence: { type: 'object' },
        quality: { type: 'object' },
        inputsUsed: { type: 'object' },
        outputsForNextScale: { type: 'object' },
        uncertainties: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', args.scale]
}));

export const parameterTransferTask = defineTask('parameter-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute parameter upscaling',
  agent: {
    name: 'upscaling-specialist',
    prompt: {
      role: 'Parameter Upscaling Specialist',
      task: 'Execute parameter transfer between all scales',
      context: args,
      instructions: [
        '1. Extract parameters from each scale calculation',
        '2. Apply coarse-graining transformations',
        '3. Execute homogenization procedures',
        '4. Validate transferred parameters',
        '5. Check scale consistency',
        '6. Document parameter provenance',
        '7. Assess transfer accuracy',
        '8. Handle emergent properties',
        '9. Create parameter transfer summary',
        '10. Document any approximations'
      ],
      outputFormat: 'JSON object with parameter transfer results'
    },
    outputSchema: {
      type: 'object',
      required: ['transferredParameters', 'accuracy', 'provenance'],
      properties: {
        transferredParameters: { type: 'object' },
        accuracy: { type: 'object' },
        provenance: { type: 'object' },
        transformations: { type: 'array' },
        emergentProperties: { type: 'object' },
        approximations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'upscaling']
}));

export const uncertaintyPropagationTask = defineTask('uncertainty-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propagate uncertainties across scales',
  agent: {
    name: 'uncertainty-specialist',
    prompt: {
      role: 'Uncertainty Propagation Specialist',
      task: 'Propagate and quantify uncertainties across scales',
      context: args,
      instructions: [
        '1. Identify uncertainty sources at each scale',
        '2. Quantify model uncertainties',
        '3. Quantify parameter uncertainties',
        '4. Propagate uncertainties through scale bridging',
        '5. Calculate cumulative uncertainty',
        '6. Identify dominant uncertainty contributors',
        '7. Assess uncertainty at final scale',
        '8. Calculate confidence intervals',
        '9. Document uncertainty analysis',
        '10. Recommend uncertainty reduction'
      ],
      outputFormat: 'JSON object with uncertainty propagation'
    },
    outputSchema: {
      type: 'object',
      required: ['overallUncertainty', 'scaleUncertainties', 'propagation'],
      properties: {
        overallUncertainty: { type: 'number' },
        scaleUncertainties: { type: 'object' },
        propagation: { type: 'object' },
        dominantContributors: { type: 'array' },
        confidenceIntervals: { type: 'object' },
        reductionRecommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'uncertainty']
}));

export const crossScaleValidationTask = defineTask('cross-scale-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate cross-scale consistency',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Cross-Scale Validation Specialist',
      task: 'Validate consistency across modeling scales',
      context: args,
      instructions: [
        '1. Check energy consistency across scales',
        '2. Verify property continuity at boundaries',
        '3. Validate emergent behavior predictions',
        '4. Check thermodynamic consistency',
        '5. Verify mechanical equilibrium',
        '6. Compare overlapping scale predictions',
        '7. Identify inconsistencies',
        '8. Assess impact of inconsistencies',
        '9. Recommend corrections',
        '10. Document validation results'
      ],
      outputFormat: 'JSON object with cross-scale validation'
    },
    outputSchema: {
      type: 'object',
      required: ['consistent', 'consistencyChecks', 'inconsistencies'],
      properties: {
        consistent: { type: 'boolean' },
        consistencyChecks: { type: 'array' },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        boundaryValidation: { type: 'object' },
        overlapComparison: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'validation']
}));

export const experimentalValidationTask = defineTask('experimental-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate against experiments',
  agent: {
    name: 'experimental-validator',
    prompt: {
      role: 'Multiscale-Experiment Validation Specialist',
      task: 'Validate multiscale predictions against experiments',
      context: args,
      instructions: [
        '1. Compare predictions with experimental benchmarks',
        '2. Validate at multiple scales if data available',
        '3. Assess scale-specific accuracy',
        '4. Calculate deviation metrics',
        '5. Identify sources of discrepancy',
        '6. Assess model limitations',
        '7. Evaluate predictive capability',
        '8. Document validation results',
        '9. Recommend model improvements',
        '10. Assess confidence in predictions'
      ],
      outputFormat: 'JSON object with experimental validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'deviations', 'confidence'],
      properties: {
        validated: { type: 'boolean' },
        deviations: { type: 'object' },
        scaleValidation: { type: 'object' },
        confidence: { type: 'number' },
        discrepancySources: { type: 'array' },
        limitations: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'experimental-validation']
}));

export const resultsIntegrationTask = defineTask('results-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate multiscale results',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'Multiscale Results Integration Specialist',
      task: 'Integrate and interpret results across all scales',
      context: args,
      instructions: [
        '1. Compile results from all scales',
        '2. Create unified property predictions',
        '3. Interpret scale-dependent behavior',
        '4. Identify emergent phenomena',
        '5. Relate nanoscale to macroscale properties',
        '6. Assess design implications',
        '7. Generate structure-property insights',
        '8. Document key findings',
        '9. Provide recommendations',
        '10. Summarize multiscale understanding'
      ],
      outputFormat: 'JSON object with integrated results'
    },
    outputSchema: {
      type: 'object',
      required: ['unifiedPredictions', 'keyFindings', 'designImplications'],
      properties: {
        unifiedPredictions: { type: 'object' },
        scaleContributions: { type: 'object' },
        emergentPhenomena: { type: 'array' },
        structurePropertyRelations: { type: 'object' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        designImplications: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'integration']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate multiscale modeling report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Multiscale Modeling Report Writer',
      task: 'Generate comprehensive multiscale modeling report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document framework design',
        '3. Describe methods at each scale',
        '4. Present scale bridging approach',
        '5. Include results from each scale',
        '6. Present uncertainty analysis',
        '7. Document validation results',
        '8. Include integrated findings',
        '9. Discuss implications',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        results: { type: 'object' },
        validation: { type: 'object' },
        conclusions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'multiscale', 'reporting']
}));
