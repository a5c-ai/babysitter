/**
 * @process specializations/domains/science/nanotechnology/nanoparticle-drug-delivery
 * @description Nanoparticle Drug Delivery System Development - Design and validate nanoparticle-based
 * drug delivery systems including encapsulation optimization, release kinetics characterization,
 * targeting validation, cytotoxicity assessment, and pharmacokinetic modeling with iterative
 * formulation refinement based on performance metrics.
 * @inputs { therapeuticCargo: object, targetSite: object, deliveryRequirements: object, nanocarrierType?: string }
 * @outputs { success: boolean, formulation: object, releaseProfile: object, safetyAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanoparticle-drug-delivery', {
 *   therapeuticCargo: { drug: 'doxorubicin', type: 'small-molecule', dose: '10mg/kg' },
 *   targetSite: { tissue: 'tumor', cellType: 'cancer', receptor: 'folate-receptor' },
 *   deliveryRequirements: { releaseProfile: 'sustained', targetingEfficiency: 80 },
 *   nanocarrierType: 'lipid-nanoparticle'
 * });
 *
 * @references
 * - Lipid nanoparticles for nucleic acid delivery: https://www.nature.com/articles/nrd.2017.243
 * - FDA Guidance for Nanotechnology: https://www.fda.gov/science-research/nanotechnology-programs-fda/nanotechnology-guidance-documents
 * - The emergence of nanotoxicology: https://www.nature.com/articles/nnano.2007.44
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    therapeuticCargo,
    targetSite,
    deliveryRequirements,
    nanocarrierType = 'auto',
    maxIterations = 5,
    encapsulationTarget = 80,
    cytotoxicityThreshold = 20
  } = inputs;

  // Phase 1: Nanocarrier Selection and Design
  const carrierDesign = await ctx.task(carrierDesignTask, {
    therapeuticCargo,
    targetSite,
    deliveryRequirements,
    nanocarrierType
  });

  // Quality Gate: Carrier design must be feasible
  if (!carrierDesign.feasible) {
    return {
      success: false,
      error: 'Nanocarrier design not feasible for therapeutic cargo',
      phase: 'carrier-design',
      recommendations: carrierDesign.recommendations
    };
  }

  // Breakpoint: Review carrier design
  await ctx.breakpoint({
    question: `Review nanocarrier design: ${carrierDesign.carrierType}. Target size: ${carrierDesign.targetSize}nm. Surface: ${carrierDesign.surfaceFunctionalization}. Approve?`,
    title: 'Nanocarrier Design Review',
    context: {
      runId: ctx.runId,
      carrierDesign,
      therapeuticCargo,
      files: [{
        path: 'artifacts/carrier-design.json',
        format: 'json',
        content: carrierDesign
      }]
    }
  });

  // Phase 2: Formulation Development (Iterative)
  let iteration = 0;
  let encapsulationEfficiency = 0;
  let currentFormulation = carrierDesign.initialFormulation;
  const formulationHistory = [];

  while (iteration < maxIterations && encapsulationEfficiency < encapsulationTarget) {
    iteration++;

    // Formulation optimization
    const formulationOptimization = await ctx.task(formulationOptimizationTask, {
      carrierDesign,
      therapeuticCargo,
      currentFormulation,
      iteration,
      previousResults: iteration > 1 ? formulationHistory[iteration - 2] : null
    });

    // Encapsulation characterization
    const encapsulationResults = await ctx.task(encapsulationCharacterizationTask, {
      formulation: formulationOptimization.optimizedFormulation,
      therapeuticCargo,
      carrierDesign
    });

    encapsulationEfficiency = encapsulationResults.encapsulationEfficiency;
    currentFormulation = formulationOptimization.optimizedFormulation;

    formulationHistory.push({
      iteration,
      formulation: currentFormulation,
      encapsulationEfficiency,
      particleCharacteristics: encapsulationResults.particleCharacteristics
    });

    if (encapsulationEfficiency < encapsulationTarget && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Encapsulation ${encapsulationEfficiency.toFixed(1)}% (target: ${encapsulationTarget}%). Continue optimization?`,
        title: 'Encapsulation Optimization Progress',
        context: {
          runId: ctx.runId,
          iteration,
          encapsulationEfficiency,
          particleSize: encapsulationResults.particleCharacteristics.size
        }
      });
    }
  }

  // Phase 3: Release Kinetics Characterization
  const releaseKinetics = await ctx.task(releaseKineticsTask, {
    currentFormulation,
    therapeuticCargo,
    deliveryRequirements
  });

  // Quality Gate: Release profile must meet requirements
  if (!releaseKinetics.meetsRequirements) {
    await ctx.breakpoint({
      question: `Release profile does not meet requirements. T50: ${releaseKinetics.t50}h, Target: ${deliveryRequirements.releaseProfile}. Adjust formulation?`,
      title: 'Release Profile Warning',
      context: {
        runId: ctx.runId,
        releaseKinetics,
        recommendations: releaseKinetics.recommendations
      }
    });
  }

  // Phase 4: Surface Functionalization for Targeting
  const surfaceFunctionalization = await ctx.task(surfaceFunctionalizationTask, {
    carrierDesign,
    targetSite,
    currentFormulation
  });

  // Phase 5: Targeting Validation
  const targetingValidation = await ctx.task(targetingValidationTask, {
    surfaceFunctionalization,
    targetSite,
    deliveryRequirements
  });

  // Quality Gate: Targeting must meet efficiency requirements
  if (targetingValidation.efficiency < deliveryRequirements.targetingEfficiency) {
    await ctx.breakpoint({
      question: `Targeting efficiency ${targetingValidation.efficiency.toFixed(1)}% below target ${deliveryRequirements.targetingEfficiency}%. Review and proceed?`,
      title: 'Targeting Efficiency Warning',
      context: {
        runId: ctx.runId,
        targetingValidation,
        recommendations: targetingValidation.recommendations
      }
    });
  }

  // Phase 6: Cytotoxicity Assessment
  const cytotoxicityAssessment = await ctx.task(cytotoxicityAssessmentTask, {
    currentFormulation,
    carrierDesign,
    therapeuticCargo,
    targetSite
  });

  // Quality Gate: Must pass cytotoxicity threshold
  if (cytotoxicityAssessment.emptyCarrierToxicity > cytotoxicityThreshold) {
    await ctx.breakpoint({
      question: `Empty carrier cytotoxicity ${cytotoxicityAssessment.emptyCarrierToxicity.toFixed(1)}% exceeds threshold ${cytotoxicityThreshold}%. Critical safety concern!`,
      title: 'Cytotoxicity Warning',
      context: {
        runId: ctx.runId,
        cytotoxicityAssessment,
        recommendations: cytotoxicityAssessment.recommendations
      }
    });
  }

  // Phase 7: Stability Assessment
  const stabilityAssessment = await ctx.task(stabilityAssessmentTask, {
    currentFormulation,
    carrierDesign,
    therapeuticCargo
  });

  // Phase 8: Pharmacokinetic Modeling
  const pkModeling = await ctx.task(pharmacokineticModelingTask, {
    currentFormulation,
    releaseKinetics,
    targetingValidation,
    therapeuticCargo,
    targetSite
  });

  // Phase 9: Regulatory Considerations
  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, {
    currentFormulation,
    carrierDesign,
    cytotoxicityAssessment,
    therapeuticCargo
  });

  // Phase 10: Documentation and Reporting
  const systemReport = await ctx.task(reportGenerationTask, {
    carrierDesign,
    formulationHistory,
    releaseKinetics,
    surfaceFunctionalization,
    targetingValidation,
    cytotoxicityAssessment,
    stabilityAssessment,
    pkModeling,
    regulatoryAnalysis,
    therapeuticCargo,
    targetSite
  });

  // Final Breakpoint: System approval
  await ctx.breakpoint({
    question: `Drug delivery system development complete. Encapsulation: ${encapsulationEfficiency.toFixed(1)}%. Targeting: ${targetingValidation.efficiency.toFixed(1)}%. Safety: ${cytotoxicityAssessment.overallAssessment}. Approve?`,
    title: 'Drug Delivery System Approval',
    context: {
      runId: ctx.runId,
      encapsulationEfficiency,
      targetingEfficiency: targetingValidation.efficiency,
      safetyAssessment: cytotoxicityAssessment.overallAssessment,
      files: [
        { path: 'artifacts/dds-report.md', format: 'markdown', content: systemReport.markdown },
        { path: 'artifacts/formulation.json', format: 'json', content: currentFormulation }
      ]
    }
  });

  return {
    success: true,
    formulation: {
      design: carrierDesign,
      optimizedFormulation: currentFormulation,
      encapsulationEfficiency,
      surfaceFunctionalization
    },
    releaseProfile: releaseKinetics,
    targeting: targetingValidation,
    safetyAssessment: {
      cytotoxicity: cytotoxicityAssessment,
      stability: stabilityAssessment
    },
    pkModeling,
    regulatoryAnalysis,
    report: systemReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanoparticle-drug-delivery',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const carrierDesignTask = defineTask('carrier-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design nanocarrier system',
  agent: {
    name: 'nanocarrier-designer',
    prompt: {
      role: 'Nanocarrier Drug Delivery System Designer',
      task: 'Design optimal nanocarrier for therapeutic cargo delivery',
      context: args,
      instructions: [
        '1. Select nanocarrier type based on cargo properties',
        '2. Design carrier composition and structure',
        '3. Define target size range for optimal biodistribution',
        '4. Plan surface functionalization strategy',
        '5. Design encapsulation approach',
        '6. Consider stability requirements',
        '7. Plan for triggered release if needed',
        '8. Consider scalability of design',
        '9. Address biocompatibility requirements',
        '10. Document design rationale'
      ],
      outputFormat: 'JSON object with carrier design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'carrierType', 'targetSize', 'initialFormulation'],
      properties: {
        feasible: { type: 'boolean' },
        carrierType: { type: 'string' },
        composition: { type: 'object' },
        targetSize: { type: 'number' },
        surfaceFunctionalization: { type: 'string' },
        encapsulationApproach: { type: 'string' },
        initialFormulation: { type: 'object' },
        designRationale: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'design']
}));

export const formulationOptimizationTask = defineTask('formulation-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize formulation (iteration ${args.iteration})`,
  agent: {
    name: 'formulation-scientist',
    prompt: {
      role: 'Nanoparticle Formulation Scientist',
      task: 'Optimize formulation for drug encapsulation',
      context: args,
      instructions: [
        '1. Analyze previous iteration results',
        '2. Adjust drug-to-lipid/polymer ratio',
        '3. Optimize processing parameters',
        '4. Adjust stabilizer concentrations',
        '5. Modify preparation method if needed',
        '6. Consider drug-carrier interactions',
        '7. Optimize for particle size control',
        '8. Balance encapsulation vs. stability',
        '9. Document optimization rationale',
        '10. Predict expected improvements'
      ],
      outputFormat: 'JSON object with optimized formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedFormulation', 'expectedEncapsulation'],
      properties: {
        optimizedFormulation: { type: 'object' },
        drugToCarrierRatio: { type: 'number' },
        processingParameters: { type: 'object' },
        stabilizers: { type: 'object' },
        expectedEncapsulation: { type: 'number' },
        optimizationRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'formulation', `iteration-${args.iteration}`]
}));

export const encapsulationCharacterizationTask = defineTask('encapsulation-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize drug encapsulation',
  agent: {
    name: 'encapsulation-analyst',
    prompt: {
      role: 'Encapsulation Characterization Specialist',
      task: 'Characterize drug encapsulation and particle properties',
      context: args,
      instructions: [
        '1. Measure encapsulation efficiency',
        '2. Determine drug loading capacity',
        '3. Measure particle size distribution',
        '4. Assess polydispersity index',
        '5. Measure zeta potential',
        '6. Verify drug association/localization',
        '7. Check for free drug content',
        '8. Assess batch-to-batch reproducibility',
        '9. Document characterization methods',
        '10. Compare with targets'
      ],
      outputFormat: 'JSON object with encapsulation characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['encapsulationEfficiency', 'drugLoading', 'particleCharacteristics'],
      properties: {
        encapsulationEfficiency: { type: 'number' },
        drugLoading: { type: 'number' },
        particleCharacteristics: {
          type: 'object',
          properties: {
            size: { type: 'number' },
            pdi: { type: 'number' },
            zetaPotential: { type: 'number' }
          }
        },
        freeDrug: { type: 'number' },
        reproducibility: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'characterization']
}));

export const releaseKineticsTask = defineTask('release-kinetics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize release kinetics',
  agent: {
    name: 'release-scientist',
    prompt: {
      role: 'Drug Release Kinetics Specialist',
      task: 'Characterize and model drug release kinetics',
      context: args,
      instructions: [
        '1. Design in vitro release study',
        '2. Select appropriate release media',
        '3. Execute release study over relevant timeframe',
        '4. Calculate release at multiple time points',
        '5. Fit kinetic models (zero-order, first-order, Higuchi)',
        '6. Calculate T50 and T90 values',
        '7. Assess burst release if any',
        '8. Test release under different conditions (pH)',
        '9. Compare with target release profile',
        '10. Recommend formulation adjustments'
      ],
      outputFormat: 'JSON object with release kinetics'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsRequirements', 't50', 'releaseProfile', 'kineticModel'],
      properties: {
        meetsRequirements: { type: 'boolean' },
        t50: { type: 'number' },
        t90: { type: 'number' },
        burstRelease: { type: 'number' },
        releaseProfile: { type: 'object' },
        kineticModel: { type: 'string' },
        modelParameters: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'release']
}));

export const surfaceFunctionalizationTask = defineTask('surface-functionalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Functionalize nanoparticle surface',
  agent: {
    name: 'surface-chemist',
    prompt: {
      role: 'Nanoparticle Surface Functionalization Specialist',
      task: 'Functionalize nanoparticle surface for targeting',
      context: args,
      instructions: [
        '1. Select targeting ligand for receptor',
        '2. Design conjugation chemistry',
        '3. Optimize ligand density on surface',
        '4. Incorporate PEGylation for stealth',
        '5. Characterize surface modification',
        '6. Verify ligand activity after conjugation',
        '7. Assess impact on particle stability',
        '8. Measure targeting ligand density',
        '9. Test binding affinity to target',
        '10. Document functionalization protocol'
      ],
      outputFormat: 'JSON object with surface functionalization'
    },
    outputSchema: {
      type: 'object',
      required: ['targetingLigand', 'conjugationMethod', 'ligandDensity'],
      properties: {
        targetingLigand: { type: 'string' },
        conjugationMethod: { type: 'string' },
        ligandDensity: { type: 'number' },
        pegylation: { type: 'object' },
        surfaceCharacterization: { type: 'object' },
        bindingAffinity: { type: 'number' },
        stabilityImpact: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'surface']
}));

export const targetingValidationTask = defineTask('targeting-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate targeting capability',
  agent: {
    name: 'targeting-scientist',
    prompt: {
      role: 'Nanoparticle Targeting Validation Specialist',
      task: 'Validate targeting efficiency of functionalized nanoparticles',
      context: args,
      instructions: [
        '1. Design in vitro targeting study',
        '2. Test binding to target cells vs. control',
        '3. Measure cellular uptake efficiency',
        '4. Assess receptor-mediated endocytosis',
        '5. Test competitive inhibition',
        '6. Quantify targeting selectivity',
        '7. Assess intracellular localization',
        '8. Compare with non-targeted particles',
        '9. Calculate targeting efficiency',
        '10. Recommend targeting improvements'
      ],
      outputFormat: 'JSON object with targeting validation'
    },
    outputSchema: {
      type: 'object',
      required: ['efficiency', 'selectivity', 'cellularUptake'],
      properties: {
        efficiency: { type: 'number' },
        selectivity: { type: 'number' },
        cellularUptake: { type: 'object' },
        receptorMediated: { type: 'boolean' },
        competitiveInhibition: { type: 'object' },
        intracellularLocalization: { type: 'string' },
        comparisonNonTargeted: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'targeting']
}));

export const cytotoxicityAssessmentTask = defineTask('cytotoxicity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess cytotoxicity',
  agent: {
    name: 'toxicology-scientist',
    prompt: {
      role: 'Nanotoxicology Specialist',
      task: 'Assess cytotoxicity of nanoparticle formulation',
      context: args,
      instructions: [
        '1. Design cytotoxicity study (MTT, MTS, LDH)',
        '2. Test empty carrier on multiple cell lines',
        '3. Test drug-loaded formulation on target cells',
        '4. Determine IC50 values',
        '5. Compare with free drug toxicity',
        '6. Assess carrier biocompatibility',
        '7. Test on normal cells for selectivity',
        '8. Evaluate oxidative stress markers',
        '9. Assess apoptosis/necrosis mechanisms',
        '10. Document safety assessment'
      ],
      outputFormat: 'JSON object with cytotoxicity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['emptyCarrierToxicity', 'drugLoadedToxicity', 'overallAssessment'],
      properties: {
        emptyCarrierToxicity: { type: 'number' },
        drugLoadedToxicity: { type: 'object' },
        ic50Values: { type: 'object' },
        selectivityIndex: { type: 'number' },
        oxidativeStress: { type: 'object' },
        mechanismOfToxicity: { type: 'string' },
        overallAssessment: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'toxicology']
}));

export const stabilityAssessmentTask = defineTask('stability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess formulation stability',
  agent: {
    name: 'stability-scientist',
    prompt: {
      role: 'Formulation Stability Specialist',
      task: 'Assess short and long-term stability of nanoparticle formulation',
      context: args,
      instructions: [
        '1. Design stability study protocol',
        '2. Test physical stability (size, aggregation)',
        '3. Test chemical stability (drug degradation)',
        '4. Test colloidal stability',
        '5. Assess stability at different temperatures',
        '6. Evaluate shelf-life at target conditions',
        '7. Test stability in biological media',
        '8. Assess lyophilization potential',
        '9. Determine storage recommendations',
        '10. Document stability data'
      ],
      outputFormat: 'JSON object with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['physicalStability', 'chemicalStability', 'shelfLife'],
      properties: {
        physicalStability: { type: 'object' },
        chemicalStability: { type: 'object' },
        colloidalStability: { type: 'object' },
        temperatureStability: { type: 'object' },
        biologicalMediaStability: { type: 'object' },
        shelfLife: { type: 'string' },
        lyophilization: { type: 'object' },
        storageRecommendations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'stability']
}));

export const pharmacokineticModelingTask = defineTask('pharmacokinetic-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model pharmacokinetics',
  agent: {
    name: 'pk-modeler',
    prompt: {
      role: 'Pharmacokinetic Modeling Specialist',
      task: 'Model pharmacokinetics of nanoparticle drug delivery system',
      context: args,
      instructions: [
        '1. Develop PK model for nanoparticle carrier',
        '2. Model drug release and distribution',
        '3. Account for targeting effects',
        '4. Model tumor/target accumulation (EPR effect)',
        '5. Estimate plasma half-life',
        '6. Model clearance mechanisms',
        '7. Predict biodistribution',
        '8. Estimate therapeutic index improvement',
        '9. Compare with free drug PK',
        '10. Recommend dosing regimen'
      ],
      outputFormat: 'JSON object with PK modeling results'
    },
    outputSchema: {
      type: 'object',
      required: ['plasmaHalfLife', 'biodistribution', 'targetAccumulation'],
      properties: {
        pkModel: { type: 'object' },
        plasmaHalfLife: { type: 'number' },
        biodistribution: { type: 'object' },
        targetAccumulation: { type: 'number' },
        clearanceMechanism: { type: 'string' },
        therapeuticIndexImprovement: { type: 'number' },
        dosingRecommendation: { type: 'object' },
        comparisonFreeDrug: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'pharmacokinetics']
}));

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze regulatory requirements',
  agent: {
    name: 'regulatory-specialist',
    prompt: {
      role: 'Nanomedicine Regulatory Specialist',
      task: 'Analyze regulatory requirements for nanoparticle drug product',
      context: args,
      instructions: [
        '1. Identify applicable regulatory pathway',
        '2. Review FDA guidance for nanotechnology',
        '3. Identify required characterization studies',
        '4. Plan preclinical safety studies',
        '5. Identify CMC requirements',
        '6. Plan scale-up considerations',
        '7. Identify critical quality attributes',
        '8. Plan comparability studies',
        '9. Document regulatory strategy',
        '10. Identify potential regulatory challenges'
      ],
      outputFormat: 'JSON object with regulatory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['regulatoryPathway', 'requiredStudies', 'cmcRequirements'],
      properties: {
        regulatoryPathway: { type: 'string' },
        applicableGuidance: { type: 'array' },
        requiredStudies: { type: 'array' },
        cmcRequirements: { type: 'object' },
        criticalQualityAttributes: { type: 'array' },
        scaleUpConsiderations: { type: 'array' },
        challenges: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'regulatory']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate drug delivery system report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Nanomedicine Technical Writer',
      task: 'Generate comprehensive drug delivery system report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document carrier design and rationale',
        '3. Present formulation optimization results',
        '4. Include release kinetics data',
        '5. Document targeting validation',
        '6. Present safety assessment',
        '7. Include PK modeling results',
        '8. Document regulatory considerations',
        '9. Provide development recommendations',
        '10. Include technical specifications'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'specifications'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        designSection: { type: 'object' },
        characterizationData: { type: 'object' },
        safetyData: { type: 'object' },
        specifications: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'drug-delivery', 'reporting']
}));
