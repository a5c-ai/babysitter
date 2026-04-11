/**
 * @process specializations/domains/science/nanotechnology/surface-functionalization
 * @description Nanomaterial Surface Functionalization Pipeline - Orchestrate surface modification workflows
 * including ligand exchange, bioconjugation, polymer coating, and targeting molecule attachment with
 * validation of surface chemistry, colloidal stability, and functional group quantification.
 * @inputs { nanomaterial: object, targetFunctionality: string, functionalizationType: string, applicationRequirements?: object }
 * @outputs { success: boolean, functionalizedProduct: object, surfaceCharacterization: object, stabilityMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/surface-functionalization', {
 *   nanomaterial: { type: 'gold-nanoparticle', size: 15, currentLigand: 'citrate' },
 *   targetFunctionality: 'PEG-antibody-conjugation',
 *   functionalizationType: 'bioconjugation',
 *   applicationRequirements: { targetAntigen: 'HER2', therapeuticApplication: true }
 * });
 *
 * @references
 * - Lipid nanoparticles for nucleic acid delivery: https://www.nature.com/articles/nrd.2017.243
 * - Self-assembly of nanoparticles: https://www.annualreviews.org/doi/10.1146/annurev-physchem-040214-121118
 * - ISO/TR 13014: Nanotechnologies - Guidance on physicochemical characterization: https://www.iso.org/standard/52334.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    nanomaterial,
    targetFunctionality,
    functionalizationType,
    applicationRequirements = {},
    maxIterations = 4,
    targetCoverage = 80,
    stabilityThreshold = 90
  } = inputs;

  // Phase 1: Surface Chemistry Analysis
  const surfaceAnalysis = await ctx.task(surfaceChemistryAnalysisTask, {
    nanomaterial,
    targetFunctionality,
    functionalizationType
  });

  // Quality Gate: Surface must be suitable for functionalization
  if (!surfaceAnalysis.suitable) {
    return {
      success: false,
      error: 'Nanomaterial surface not suitable for target functionalization',
      recommendations: surfaceAnalysis.recommendations
    };
  }

  // Breakpoint: Review surface analysis
  await ctx.breakpoint({
    question: `Surface analysis complete for ${nanomaterial.type}. Current ligand: ${nanomaterial.currentLigand}. Proceed with ${functionalizationType}?`,
    title: 'Surface Analysis Review',
    context: {
      runId: ctx.runId,
      nanomaterial,
      surfaceAnalysis,
      targetFunctionality
    }
  });

  // Phase 2: Functionalization Strategy Design
  const functionalizationStrategy = await ctx.task(functionalizationStrategyTask, {
    nanomaterial,
    targetFunctionality,
    functionalizationType,
    surfaceAnalysis,
    applicationRequirements
  });

  // Phase 3: Ligand Exchange or Surface Modification
  let iteration = 0;
  let currentCoverage = 0;
  let functionalizedProduct = null;
  const optimizationHistory = [];

  while (iteration < maxIterations && currentCoverage < targetCoverage) {
    iteration++;

    const functionalizationExecution = await ctx.task(functionalizationExecutionTask, {
      nanomaterial,
      strategy: functionalizationStrategy,
      iteration,
      previousResults: iteration > 1 ? optimizationHistory[iteration - 2] : null
    });

    // Surface coverage characterization
    const coverageCharacterization = await ctx.task(coverageCharacterizationTask, {
      functionalizedNanomaterial: functionalizationExecution.product,
      targetFunctionality,
      functionalizationType
    });

    currentCoverage = coverageCharacterization.coverage;
    functionalizedProduct = functionalizationExecution.product;

    optimizationHistory.push({
      iteration,
      coverage: currentCoverage,
      conditions: functionalizationExecution.conditions,
      characterization: coverageCharacterization
    });

    if (currentCoverage < targetCoverage && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Coverage=${currentCoverage}% (target: ${targetCoverage}%). Continue optimization?`,
        title: 'Functionalization Progress',
        context: { runId: ctx.runId, iteration, currentCoverage, targetCoverage }
      });
    }
  }

  // Phase 4: Colloidal Stability Assessment
  const stabilityAssessment = await ctx.task(colloidalStabilityTask, {
    functionalizedProduct,
    applicationRequirements,
    stabilityThreshold
  });

  // Quality Gate: Stability must meet threshold
  if (stabilityAssessment.score < stabilityThreshold) {
    await ctx.breakpoint({
      question: `Colloidal stability (${stabilityAssessment.score}%) below threshold (${stabilityThreshold}%). Review stabilization strategies?`,
      title: 'Stability Warning',
      context: {
        runId: ctx.runId,
        stabilityScore: stabilityAssessment.score,
        recommendations: stabilityAssessment.recommendations
      }
    });
  }

  // Phase 5: Functional Group Quantification
  const functionalGroupQuantification = await ctx.task(functionalGroupQuantificationTask, {
    functionalizedProduct,
    targetFunctionality,
    functionalizationType
  });

  // Phase 6: Bioactivity Validation (if applicable)
  let bioactivityValidation = null;
  if (functionalizationType === 'bioconjugation' || applicationRequirements.biologicalActivity) {
    bioactivityValidation = await ctx.task(bioactivityValidationTask, {
      functionalizedProduct,
      applicationRequirements,
      targetFunctionality
    });
  }

  // Phase 7: Protocol Documentation
  const protocolDocumentation = await ctx.task(functionalizationDocumentationTask, {
    nanomaterial,
    targetFunctionality,
    functionalizationType,
    functionalizationStrategy,
    optimizationHistory,
    stabilityAssessment,
    functionalGroupQuantification,
    bioactivityValidation
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Surface functionalization complete. Coverage: ${currentCoverage}%, Stability: ${stabilityAssessment.score}%. Approve product?`,
    title: 'Functionalization Approval',
    context: {
      runId: ctx.runId,
      coverage: currentCoverage,
      stability: stabilityAssessment.score,
      functionalGroups: functionalGroupQuantification.summary,
      files: [{ path: 'artifacts/functionalization-protocol.md', format: 'markdown' }]
    }
  });

  return {
    success: true,
    functionalizedProduct,
    surfaceCharacterization: {
      coverage: currentCoverage,
      functionalGroups: functionalGroupQuantification,
      surfaceChemistry: surfaceAnalysis
    },
    stabilityMetrics: stabilityAssessment,
    bioactivity: bioactivityValidation,
    optimizationIterations: iteration,
    protocol: protocolDocumentation,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/surface-functionalization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const surfaceChemistryAnalysisTask = defineTask('surface-chemistry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze nanomaterial surface chemistry',
  agent: {
    name: 'surface-chemistry-expert',
    prompt: {
      role: 'Surface Chemistry Expert in Nanomaterials',
      task: 'Analyze current surface chemistry and suitability for functionalization',
      context: args,
      instructions: [
        '1. Characterize current surface ligands and functional groups',
        '2. Assess surface charge (zeta potential) and isoelectric point',
        '3. Evaluate surface reactivity and available binding sites',
        '4. Identify potential surface defects or heterogeneities',
        '5. Assess compatibility with target functionalization chemistry',
        '6. Identify required surface pretreatment if needed',
        '7. Evaluate ligand exchange kinetics and thermodynamics',
        '8. Assess steric accessibility of surface sites',
        '9. Consider surface curvature effects on reactivity',
        '10. Provide suitability assessment with recommendations'
      ],
      outputFormat: 'JSON object with surface chemistry analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['suitable', 'currentSurfaceChemistry', 'bindingSites'],
      properties: {
        suitable: { type: 'boolean' },
        currentSurfaceChemistry: { type: 'object' },
        zetaPotential: { type: 'number' },
        bindingSites: { type: 'object' },
        surfaceDefects: { type: 'array', items: { type: 'string' } },
        pretreatmentRequired: { type: 'boolean' },
        pretreatmentProtocol: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'surface-chemistry', 'analysis']
}));

export const functionalizationStrategyTask = defineTask('functionalization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design functionalization strategy',
  agent: {
    name: 'bioconjugation-specialist',
    prompt: {
      role: 'Bioconjugation and Surface Modification Specialist',
      task: 'Design optimal surface functionalization strategy',
      context: args,
      instructions: [
        '1. Select appropriate functionalization chemistry (EDC/NHS, click chemistry, etc.)',
        '2. Design multi-step functionalization sequence if needed',
        '3. Select spacer molecules for optimal presentation',
        '4. Determine optimal reagent ratios and concentrations',
        '5. Define reaction conditions (pH, temperature, time)',
        '6. Plan purification steps between functionalization stages',
        '7. Address potential side reactions and how to minimize them',
        '8. Consider orientation control for biomolecules',
        '9. Design quality control checkpoints',
        '10. Provide scale-up considerations'
      ],
      outputFormat: 'JSON object with functionalization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'reactionSteps', 'reagents', 'conditions'],
      properties: {
        strategy: { type: 'string' },
        reactionSteps: { type: 'array', items: { type: 'object' } },
        reagents: { type: 'array', items: { type: 'object' } },
        conditions: { type: 'object' },
        spacerMolecules: { type: 'array', items: { type: 'string' } },
        qualityCheckpoints: { type: 'array', items: { type: 'string' } },
        scaleUpConsiderations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'functionalization', 'strategy']
}));

export const functionalizationExecutionTask = defineTask('functionalization-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute functionalization (iteration ${args.iteration})`,
  agent: {
    name: 'synthesis-chemist',
    prompt: {
      role: 'Synthetic Chemist',
      task: 'Execute surface functionalization reaction',
      context: args,
      instructions: [
        '1. Prepare reagent solutions at specified concentrations',
        '2. Pre-equilibrate nanomaterial suspension',
        '3. Execute functionalization reaction with precise timing',
        '4. Monitor reaction progress using appropriate indicators',
        '5. Optimize conditions based on previous iteration feedback',
        '6. Perform intermediate purification if multi-step',
        '7. Document all reaction parameters and observations',
        '8. Collect samples for characterization',
        '9. Assess reaction completion and yield',
        '10. Store product appropriately for stability'
      ],
      outputFormat: 'JSON object with execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['product', 'conditions', 'yield'],
      properties: {
        product: { type: 'object' },
        conditions: { type: 'object' },
        yield: { type: 'number' },
        observations: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'functionalization', 'execution', `iteration-${args.iteration}`]
}));

export const coverageCharacterizationTask = defineTask('coverage-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize surface coverage',
  agent: {
    name: 'analytical-chemist',
    prompt: {
      role: 'Analytical Chemist specializing in Surface Analysis',
      task: 'Quantify surface coverage of functionalized nanomaterial',
      context: args,
      instructions: [
        '1. Select appropriate characterization techniques (XPS, TGA, NMR)',
        '2. Measure surface ligand density',
        '3. Calculate coverage percentage relative to theoretical maximum',
        '4. Assess coverage uniformity across particle population',
        '5. Verify functional group integrity post-conjugation',
        '6. Compare with target specifications',
        '7. Identify any side products or incomplete conjugation',
        '8. Assess reproducibility of measurements',
        '9. Provide recommendations for coverage improvement',
        '10. Document all analytical methods and results'
      ],
      outputFormat: 'JSON object with coverage characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['coverage', 'ligandDensity', 'characterizationMethods'],
      properties: {
        coverage: { type: 'number' },
        ligandDensity: { type: 'object' },
        uniformity: { type: 'number' },
        functionalGroupIntegrity: { type: 'boolean' },
        characterizationMethods: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'coverage']
}));

export const colloidalStabilityTask = defineTask('colloidal-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess colloidal stability',
  agent: {
    name: 'colloid-scientist',
    prompt: {
      role: 'Colloid Science Expert',
      task: 'Assess colloidal stability of functionalized nanomaterial',
      context: args,
      instructions: [
        '1. Measure hydrodynamic size and polydispersity (DLS)',
        '2. Determine zeta potential in relevant media',
        '3. Assess stability over time (aggregation kinetics)',
        '4. Test stability in application-relevant conditions (pH, ionic strength)',
        '5. Evaluate protein corona formation if applicable',
        '6. Assess stability during storage conditions',
        '7. Identify destabilization mechanisms if instability observed',
        '8. Recommend stabilization strategies if needed',
        '9. Define acceptable stability criteria',
        '10. Calculate overall stability score'
      ],
      outputFormat: 'JSON object with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'hydrodynamicSize', 'zetaPotential'],
      properties: {
        score: { type: 'number' },
        hydrodynamicSize: { type: 'object' },
        zetaPotential: { type: 'number' },
        stabilityOverTime: { type: 'object' },
        conditionTesting: { type: 'object' },
        proteinCorona: { type: 'object' },
        destabilizationMechanisms: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'stability', 'colloidal']
}));

export const functionalGroupQuantificationTask = defineTask('functional-group-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify functional groups',
  agent: {
    name: 'quantitative-analyst',
    prompt: {
      role: 'Quantitative Analytical Chemist',
      task: 'Quantify functional groups on nanomaterial surface',
      context: args,
      instructions: [
        '1. Select quantification methods for each functional group type',
        '2. Perform colorimetric assays where applicable (BCA, fluorescence)',
        '3. Use spectroscopic methods (UV-Vis, fluorescence) for conjugates',
        '4. Calculate molecules per nanoparticle',
        '5. Assess functional group accessibility',
        '6. Validate quantification with orthogonal methods',
        '7. Calculate confidence intervals and measurement uncertainty',
        '8. Compare with theoretical loading capacity',
        '9. Assess batch-to-batch variability',
        '10. Document all quantification protocols'
      ],
      outputFormat: 'JSON object with functional group quantification'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'quantificationResults', 'methods'],
      properties: {
        summary: { type: 'object' },
        quantificationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              functionalGroup: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        moleculesPerParticle: { type: 'number' },
        accessibility: { type: 'number' },
        methods: { type: 'array', items: { type: 'string' } },
        uncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'quantification', 'functional-groups']
}));

export const bioactivityValidationTask = defineTask('bioactivity-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate biological activity',
  agent: {
    name: 'biologist',
    prompt: {
      role: 'Cell Biologist and Bioconjugate Specialist',
      task: 'Validate biological activity of functionalized nanomaterial',
      context: args,
      instructions: [
        '1. Design bioactivity assays appropriate for target application',
        '2. Test binding affinity to target (if targeting conjugate)',
        '3. Assess specificity over non-target controls',
        '4. Evaluate cellular uptake if applicable',
        '5. Test cytotoxicity of functionalized product',
        '6. Compare activity to unconjugated control',
        '7. Assess activity retention over storage',
        '8. Perform dose-response studies',
        '9. Document all biological assay protocols',
        '10. Provide recommendations for activity optimization'
      ],
      outputFormat: 'JSON object with bioactivity validation'
    },
    outputSchema: {
      type: 'object',
      required: ['active', 'bindingAffinity', 'specificity'],
      properties: {
        active: { type: 'boolean' },
        bindingAffinity: { type: 'object' },
        specificity: { type: 'number' },
        cellularUptake: { type: 'object' },
        cytotoxicity: { type: 'object' },
        activityRetention: { type: 'object' },
        doseResponse: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'bioactivity', 'validation']
}));

export const functionalizationDocumentationTask = defineTask('functionalization-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document functionalization protocol',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate comprehensive functionalization documentation',
      context: args,
      instructions: [
        '1. Create protocol summary with key parameters',
        '2. Document complete reagent list with specifications',
        '3. Write detailed step-by-step procedure',
        '4. Include characterization methods and expected results',
        '5. Document optimization history and rationale',
        '6. Include quality control criteria and acceptance limits',
        '7. Add troubleshooting guide',
        '8. Document safety considerations',
        '9. Include storage and stability guidelines',
        '10. Generate batch record template'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'protocol', 'artifacts'],
      properties: {
        markdown: { type: 'string' },
        protocol: { type: 'object' },
        batchRecordTemplate: { type: 'object' },
        troubleshootingGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'documentation', 'functionalization']
}));
