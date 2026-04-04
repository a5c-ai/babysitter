/**
 * @process specializations/domains/science/nanotechnology/directed-self-assembly
 * @description Directed Self-Assembly Process Development - Develop directed self-assembly workflows
 * using block copolymers or nanoparticle templates including substrate preparation, annealing
 * optimization, defect reduction strategies, pattern transfer, and alignment verification
 * with quality gates for feature uniformity.
 * @inputs { dsaSystem: string, targetPattern: object, substrateGuide: object, defectTarget?: number }
 * @outputs { success: boolean, processRecipe: object, patternQuality: object, defectAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/directed-self-assembly', {
 *   dsaSystem: 'PS-b-PMMA',
 *   targetPattern: { type: 'lamellae', pitch: 28, orientation: 'perpendicular' },
 *   substrateGuide: { type: 'chemoepitaxy', guidePitch: 84 },
 *   defectTarget: 0.01
 * });
 *
 * @references
 * - Block Copolymer Lithography: https://www.nature.com/articles/nmat2898
 * - Self-assembly of nanoparticles: https://www.annualreviews.org/doi/10.1146/annurev-physchem-040214-121118
 * - DNA Nanotechnology Resources: https://www.dna-origami.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dsaSystem,
    targetPattern,
    substrateGuide,
    defectTarget = 0.01,
    maxIterations = 5
  } = inputs;

  // Phase 1: DSA Process Design
  const processDesign = await ctx.task(dsaProcessDesignTask, {
    dsaSystem,
    targetPattern,
    substrateGuide
  });

  // Quality Gate: DSA process must be feasible
  if (!processDesign.feasible) {
    return {
      success: false,
      error: 'Directed self-assembly process design not feasible',
      phase: 'process-design',
      recommendations: processDesign.recommendations
    };
  }

  // Breakpoint: Review DSA process design
  await ctx.breakpoint({
    question: `Review ${dsaSystem} DSA process design. Target pattern: ${targetPattern.type} with ${targetPattern.pitch}nm pitch. Approve to proceed?`,
    title: 'DSA Process Design Review',
    context: {
      runId: ctx.runId,
      dsaSystem,
      targetPattern,
      substrateGuide,
      processDesign,
      files: [{
        path: 'artifacts/dsa-process-design.json',
        format: 'json',
        content: processDesign
      }]
    }
  });

  // Phase 2: Substrate and Guide Preparation
  const substratePreparation = await ctx.task(substratePreparationTask, {
    substrateGuide,
    dsaSystem,
    targetPattern,
    processDesign
  });

  // Phase 3: BCP Film Deposition Optimization
  const filmDeposition = await ctx.task(filmDepositionTask, {
    dsaSystem,
    targetPattern,
    processDesign
  });

  // Phase 4: Annealing Optimization (Iterative)
  let iteration = 0;
  let defectDensity = Infinity;
  let patternQuality = null;
  const annealingHistory = [];
  let currentAnnealingParams = processDesign.initialAnnealingParameters;

  while (iteration < maxIterations && defectDensity > defectTarget) {
    iteration++;

    // Annealing parameter optimization
    const annealingOptimization = await ctx.task(annealingOptimizationTask, {
      dsaSystem,
      targetPattern,
      currentAnnealingParams,
      iteration,
      previousResults: iteration > 1 ? annealingHistory[iteration - 2] : null
    });

    // DSA execution and characterization
    const dsaExecution = await ctx.task(dsaExecutionTask, {
      dsaSystem,
      targetPattern,
      annealingParams: annealingOptimization.optimizedParameters,
      filmDeposition,
      substratePreparation
    });

    defectDensity = dsaExecution.defectDensity;
    patternQuality = dsaExecution.patternQuality;

    annealingHistory.push({
      iteration,
      parameters: annealingOptimization.optimizedParameters,
      defectDensity,
      patternQuality,
      morphology: dsaExecution.morphology
    });

    currentAnnealingParams = annealingOptimization.optimizedParameters;

    if (defectDensity > defectTarget && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Defect density = ${defectDensity.toFixed(4)}/um2 (target: ${defectTarget}/um2). Continue optimization?`,
        title: 'DSA Annealing Optimization Progress',
        context: {
          runId: ctx.runId,
          iteration,
          defectDensity,
          defectTarget,
          patternQuality
        }
      });
    }
  }

  // Phase 5: Defect Analysis
  const defectAnalysis = await ctx.task(defectAnalysisTask, {
    dsaSystem,
    targetPattern,
    annealingHistory,
    defectDensity
  });

  // Quality Gate: Defect density must be acceptable
  if (defectDensity > defectTarget) {
    await ctx.breakpoint({
      question: `Defect density ${defectDensity.toFixed(4)}/um2 exceeds target ${defectTarget}/um2 after ${iteration} iterations. Review defect reduction strategies?`,
      title: 'DSA Defect Density Warning',
      context: {
        runId: ctx.runId,
        defectDensity,
        defectTarget,
        defectTypes: defectAnalysis.defectTypes,
        recommendations: defectAnalysis.recommendations
      }
    });
  }

  // Phase 6: Pattern Transfer Development
  const patternTransfer = await ctx.task(patternTransferTask, {
    dsaSystem,
    targetPattern,
    currentAnnealingParams,
    patternQuality
  });

  // Phase 7: Alignment Verification
  const alignmentVerification = await ctx.task(alignmentVerificationTask, {
    targetPattern,
    substrateGuide,
    patternTransfer,
    dsaSystem
  });

  // Phase 8: Feature Uniformity Assessment
  const uniformityAssessment = await ctx.task(uniformityAssessmentTask, {
    targetPattern,
    patternTransfer,
    annealingHistory
  });

  // Phase 9: Process Window Analysis
  const processWindow = await ctx.task(processWindowAnalysisTask, {
    annealingHistory,
    targetPattern,
    defectTarget,
    dsaSystem
  });

  // Phase 10: Recipe Documentation
  const recipeDocumentation = await ctx.task(recipeDocumentationTask, {
    dsaSystem,
    targetPattern,
    substrateGuide,
    substratePreparation,
    filmDeposition,
    optimizedAnnealing: currentAnnealingParams,
    patternTransfer,
    defectAnalysis,
    uniformityAssessment,
    processWindow,
    annealingHistory
  });

  // Final Breakpoint: Process approval
  await ctx.breakpoint({
    question: `DSA process development complete. Defect density: ${defectDensity.toFixed(4)}/um2. Pattern quality score: ${patternQuality}/100. Alignment: ${alignmentVerification.alignment}%. Approve process recipe?`,
    title: 'DSA Process Approval',
    context: {
      runId: ctx.runId,
      defectDensity,
      patternQuality,
      alignment: alignmentVerification.alignment,
      uniformity: uniformityAssessment.uniformityScore,
      files: [
        { path: 'artifacts/dsa-recipe.md', format: 'markdown', content: recipeDocumentation.markdown },
        { path: 'artifacts/annealing-parameters.json', format: 'json', content: currentAnnealingParams }
      ]
    }
  });

  return {
    success: true,
    processRecipe: {
      dsaSystem,
      substratePreparation,
      filmDeposition,
      annealingParameters: currentAnnealingParams,
      patternTransfer,
      documentation: recipeDocumentation
    },
    patternQuality: {
      score: patternQuality,
      morphology: annealingHistory[annealingHistory.length - 1].morphology,
      alignment: alignmentVerification.alignment,
      uniformity: uniformityAssessment.uniformityScore
    },
    defectAnalysis: {
      finalDensity: defectDensity,
      targetDensity: defectTarget,
      defectTypes: defectAnalysis.defectTypes,
      rootCauses: defectAnalysis.rootCauses
    },
    processWindow,
    optimizationIterations: iteration,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/directed-self-assembly',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dsaProcessDesignTask = defineTask('dsa-process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design DSA process for ${args.dsaSystem}`,
  agent: {
    name: 'dsa-engineer',
    prompt: {
      role: 'Directed Self-Assembly Process Engineer',
      task: 'Design DSA process for target pattern formation',
      context: args,
      instructions: [
        '1. Evaluate DSA system compatibility with target pattern',
        '2. Select guiding strategy (chemoepitaxy, graphoepitaxy)',
        '3. Define guide feature requirements for pattern multiplication',
        '4. Select BCP molecular weight for target pitch',
        '5. Define initial annealing approach (thermal, solvent vapor)',
        '6. Plan neutral/preferential surface treatment',
        '7. Identify potential defect formation mechanisms',
        '8. Plan pattern transfer approach',
        '9. Identify critical process parameters',
        '10. Document process design rationale'
      ],
      outputFormat: 'JSON object with DSA process design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'guidingStrategy', 'initialAnnealingParameters'],
      properties: {
        feasible: { type: 'boolean' },
        guidingStrategy: { type: 'string' },
        bcpSelection: { type: 'object' },
        surfaceTreatment: { type: 'object' },
        initialAnnealingParameters: { type: 'object' },
        patternTransferApproach: { type: 'string' },
        criticalParameters: { type: 'array' },
        defectMechanisms: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'process-design']
}));

export const substratePreparationTask = defineTask('substrate-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop substrate and guide preparation',
  agent: {
    name: 'substrate-specialist',
    prompt: {
      role: 'DSA Substrate Preparation Specialist',
      task: 'Develop substrate and guide preparation protocols',
      context: args,
      instructions: [
        '1. Define substrate cleaning procedure',
        '2. Design guide pattern fabrication (if graphoepitaxy)',
        '3. Develop surface treatment for neutral layer',
        '4. Define chemical pattern for chemoepitaxy',
        '5. Optimize guide feature dimensions',
        '6. Verify guide pattern quality',
        '7. Define surface energy characterization',
        '8. Plan commensurability verification',
        '9. Document handling and storage',
        '10. Define quality control checkpoints'
      ],
      outputFormat: 'JSON object with substrate preparation protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['cleaningProcedure', 'surfaceTreatment', 'guidePreparation'],
      properties: {
        cleaningProcedure: { type: 'object' },
        surfaceTreatment: { type: 'object' },
        guidePreparation: { type: 'object' },
        guideDimensions: { type: 'object' },
        surfaceEnergy: { type: 'object' },
        qualityCheckpoints: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'substrate']
}));

export const filmDepositionTask = defineTask('film-deposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize BCP film deposition',
  agent: {
    name: 'thin-film-specialist',
    prompt: {
      role: 'Block Copolymer Film Deposition Specialist',
      task: 'Optimize BCP film deposition for DSA',
      context: args,
      instructions: [
        '1. Prepare BCP solution at optimal concentration',
        '2. Optimize spin coating parameters',
        '3. Achieve target film thickness (commensurable)',
        '4. Ensure thickness uniformity',
        '5. Define soft bake parameters',
        '6. Characterize as-cast morphology',
        '7. Assess film quality and defects',
        '8. Document solution preparation and storage',
        '9. Define environmental controls',
        '10. Verify film thickness across substrate'
      ],
      outputFormat: 'JSON object with film deposition parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['coatingParameters', 'filmThickness', 'uniformity'],
      properties: {
        solutionPreparation: { type: 'object' },
        coatingParameters: { type: 'object' },
        filmThickness: { type: 'number' },
        uniformity: { type: 'number' },
        softBake: { type: 'object' },
        asCastMorphology: { type: 'object' },
        environmentalControls: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'film-deposition']
}));

export const annealingOptimizationTask = defineTask('annealing-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize annealing parameters (iteration ${args.iteration})`,
  agent: {
    name: 'annealing-specialist',
    prompt: {
      role: 'DSA Annealing Optimization Specialist',
      task: 'Optimize annealing parameters for pattern formation',
      context: args,
      instructions: [
        '1. Analyze previous iteration results',
        '2. Adjust annealing temperature/time',
        '3. Optimize solvent vapor composition if SVA',
        '4. Balance kinetics vs. equilibrium morphology',
        '5. Consider defect healing mechanisms',
        '6. Adjust for pattern alignment requirements',
        '7. Predict expected morphology and defects',
        '8. Document optimization rationale',
        '9. Plan verification measurements',
        '10. Consider thermal budget constraints'
      ],
      outputFormat: 'JSON object with optimized annealing parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'predictedDefectDensity'],
      properties: {
        optimizedParameters: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            time: { type: 'number' },
            atmosphere: { type: 'string' },
            rampRate: { type: 'number' }
          }
        },
        solventVaporParameters: { type: 'object' },
        predictedDefectDensity: { type: 'number' },
        optimizationRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'annealing', `iteration-${args.iteration}`]
}));

export const dsaExecutionTask = defineTask('dsa-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute DSA and characterize results',
  agent: {
    name: 'dsa-technician',
    prompt: {
      role: 'DSA Process Execution Specialist',
      task: 'Execute DSA process and characterize pattern formation',
      context: args,
      instructions: [
        '1. Execute annealing with optimized parameters',
        '2. Characterize morphology (SEM, AFM)',
        '3. Measure defect density (dislocation, disclination)',
        '4. Assess pattern orientation and alignment',
        '5. Measure pitch and feature dimensions',
        '6. Evaluate long-range order',
        '7. Document any process anomalies',
        '8. Calculate pattern quality metrics',
        '9. Compare with target specifications',
        '10. Record all characterization data'
      ],
      outputFormat: 'JSON object with DSA execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['defectDensity', 'patternQuality', 'morphology'],
      properties: {
        defectDensity: { type: 'number' },
        patternQuality: { type: 'number', minimum: 0, maximum: 100 },
        morphology: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            orientation: { type: 'string' },
            pitch: { type: 'number' },
            cd: { type: 'number' }
          }
        },
        alignment: { type: 'object' },
        longRangeOrder: { type: 'number' },
        anomalies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'characterization']
}));

export const defectAnalysisTask = defineTask('defect-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze DSA defects',
  agent: {
    name: 'defect-analyst',
    prompt: {
      role: 'DSA Defect Analysis Specialist',
      task: 'Analyze and classify DSA defects',
      context: args,
      instructions: [
        '1. Classify defects by type (dislocation, disclination, bridge)',
        '2. Map defect spatial distribution',
        '3. Correlate defects with guide features',
        '4. Analyze defect formation mechanisms',
        '5. Identify root causes for each defect type',
        '6. Track defect density evolution with annealing',
        '7. Assess defect healing potential',
        '8. Compare with literature and targets',
        '9. Recommend defect reduction strategies',
        '10. Document defect analysis findings'
      ],
      outputFormat: 'JSON object with defect analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['defectTypes', 'rootCauses', 'recommendations'],
      properties: {
        defectTypes: { type: 'object' },
        spatialDistribution: { type: 'object' },
        defectMechanisms: { type: 'array' },
        rootCauses: { type: 'array' },
        defectEvolution: { type: 'object' },
        healingPotential: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'defects']
}));

export const patternTransferTask = defineTask('pattern-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop DSA pattern transfer',
  agent: {
    name: 'etch-specialist',
    prompt: {
      role: 'DSA Pattern Transfer Specialist',
      task: 'Develop pattern transfer process from DSA to substrate',
      context: args,
      instructions: [
        '1. Select etch chemistry for block removal',
        '2. Optimize etch selectivity between blocks',
        '3. Develop process for remaining block use as mask',
        '4. Optimize substrate etch process',
        '5. Minimize CD bias during transfer',
        '6. Maintain pattern fidelity',
        '7. Characterize transferred pattern dimensions',
        '8. Assess transferred pattern roughness',
        '9. Develop strip process for remaining polymer',
        '10. Document pattern transfer recipe'
      ],
      outputFormat: 'JSON object with pattern transfer process'
    },
    outputSchema: {
      type: 'object',
      required: ['etchRecipe', 'transferFidelity', 'cdBias'],
      properties: {
        blockRemovalEtch: { type: 'object' },
        substrateEtch: { type: 'object' },
        etchRecipe: { type: 'object' },
        selectivity: { type: 'number' },
        transferFidelity: { type: 'number' },
        cdBias: { type: 'number' },
        roughness: { type: 'number' },
        stripProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'etch']
}));

export const alignmentVerificationTask = defineTask('alignment-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify pattern alignment',
  agent: {
    name: 'alignment-specialist',
    prompt: {
      role: 'DSA Pattern Alignment Specialist',
      task: 'Verify DSA pattern alignment to guide structures',
      context: args,
      instructions: [
        '1. Measure pattern registration to guide features',
        '2. Calculate alignment accuracy statistics',
        '3. Assess pattern commensurability',
        '4. Verify pattern multiplication factor',
        '5. Measure any pattern rotation or distortion',
        '6. Assess alignment uniformity across area',
        '7. Compare with alignment requirements',
        '8. Identify alignment error sources',
        '9. Document alignment verification results',
        '10. Recommend alignment improvements'
      ],
      outputFormat: 'JSON object with alignment verification'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'registration', 'commensurability'],
      properties: {
        alignment: { type: 'number' },
        registration: { type: 'object' },
        commensurability: { type: 'boolean' },
        multiplicationFactor: { type: 'number' },
        patternDistortion: { type: 'object' },
        uniformity: { type: 'object' },
        errorSources: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'alignment']
}));

export const uniformityAssessmentTask = defineTask('uniformity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess feature uniformity',
  agent: {
    name: 'uniformity-analyst',
    prompt: {
      role: 'Pattern Uniformity Analysis Specialist',
      task: 'Assess DSA pattern feature uniformity',
      context: args,
      instructions: [
        '1. Measure CD uniformity across pattern area',
        '2. Calculate pitch uniformity',
        '3. Assess line edge roughness (LER)',
        '4. Measure line width roughness (LWR)',
        '5. Analyze local vs global uniformity',
        '6. Correlate uniformity with process parameters',
        '7. Compare with uniformity specifications',
        '8. Identify sources of non-uniformity',
        '9. Calculate uniformity metrics',
        '10. Recommend uniformity improvements'
      ],
      outputFormat: 'JSON object with uniformity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['uniformityScore', 'cdUniformity', 'pitchUniformity'],
      properties: {
        uniformityScore: { type: 'number', minimum: 0, maximum: 100 },
        cdUniformity: { type: 'object' },
        pitchUniformity: { type: 'object' },
        ler: { type: 'number' },
        lwr: { type: 'number' },
        localUniformity: { type: 'object' },
        globalUniformity: { type: 'object' },
        nonUniformitySources: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'uniformity']
}));

export const processWindowAnalysisTask = defineTask('process-window-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze DSA process window',
  agent: {
    name: 'process-engineer',
    prompt: {
      role: 'DSA Process Window Analyst',
      task: 'Analyze and document DSA process window',
      context: args,
      instructions: [
        '1. Define annealing temperature window',
        '2. Determine time latitude for defect target',
        '3. Analyze film thickness sensitivity',
        '4. Assess guide dimension tolerance',
        '5. Map process window boundaries',
        '6. Calculate process capability metrics',
        '7. Identify most sensitive parameters',
        '8. Define process control requirements',
        '9. Generate process window plots',
        '10. Document process robustness'
      ],
      outputFormat: 'JSON object with process window analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatureWindow', 'timeLatitude', 'processCapability'],
      properties: {
        temperatureWindow: { type: 'object' },
        timeLatitude: { type: 'object' },
        thicknessSensitivity: { type: 'object' },
        guideTolerance: { type: 'object' },
        processCapability: { type: 'object' },
        sensitiveParameters: { type: 'array' },
        controlRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'process-window']
}));

export const recipeDocumentationTask = defineTask('recipe-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document DSA process recipe',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive DSA process documentation',
      context: args,
      instructions: [
        '1. Create process specification document',
        '2. Document substrate preparation protocol',
        '3. Detail BCP solution and coating recipe',
        '4. Document optimized annealing parameters',
        '5. Include pattern transfer recipe',
        '6. Document defect analysis results',
        '7. Include uniformity assessment',
        '8. Document process window',
        '9. Include troubleshooting guide',
        '10. Generate operator procedures'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'processSpecification', 'operatorProcedure'],
      properties: {
        markdown: { type: 'string' },
        processSpecification: { type: 'object' },
        operatorProcedure: { type: 'object' },
        troubleshootingGuide: { type: 'object' },
        processWindow: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dsa', 'documentation']
}));
