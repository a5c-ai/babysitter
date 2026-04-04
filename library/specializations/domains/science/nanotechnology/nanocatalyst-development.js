/**
 * @file nanocatalyst-development.js
 * @process nanocatalyst-development
 * @description Design and optimize nanomaterial catalysts for chemical transformations including
 * synthesis optimization, activity/selectivity characterization, stability testing, reaction
 * mechanism investigation, and scale-up validation with iterative composition/structure refinement.
 *
 * @inputs {
 *   targetReaction: { type: 'object', properties: { reactants: 'array', products: 'array', conditions: 'object' } },
 *   catalystType: 'string', // e.g., 'metal-nanoparticle', 'metal-oxide', 'bimetallic', 'supported', 'MOF-based'
 *   performanceTargets: { type: 'object', properties: { conversion: 'number', selectivity: 'number', tof: 'number', stability: 'string' } },
 *   supportMaterial: 'string', // optional support material
 *   scaleRequirements: { type: 'object', properties: { batchSize: 'string', productionRate: 'string' } },
 *   constraints: { type: 'object', properties: { cost: 'number', toxicity: 'string', sustainability: 'boolean' } }
 * }
 *
 * @outputs {
 *   optimizedCatalyst: 'object',
 *   performanceData: 'object',
 *   mechanismInsights: 'object',
 *   scaleUpProtocol: 'object',
 *   stabilityProfile: 'object',
 *   processDocumentation: 'object'
 * }
 *
 * @example
 * // Input
 * {
 *   "targetReaction": {
 *     "reactants": ["CO2", "H2"],
 *     "products": ["CH3OH", "H2O"],
 *     "conditions": { "temperature": "200-300C", "pressure": "30-50 bar" }
 *   },
 *   "catalystType": "bimetallic",
 *   "performanceTargets": { "conversion": 25, "selectivity": 90, "tof": 0.5, "stability": "500h" },
 *   "supportMaterial": "ZnO/Al2O3",
 *   "scaleRequirements": { "batchSize": "1kg", "productionRate": "100g/h" },
 *   "constraints": { "cost": 500, "toxicity": "low", "sustainability": true }
 * }
 *
 * @references
 * - Catalyst Design Principles (DOI: 10.1038/s41929-018-0142-1)
 * - Nanostructured Catalysts (DOI: 10.1021/acscatal.9b04186)
 * - Descriptor-Based Catalyst Screening (DOI: 10.1126/science.aaf8800)
 * - Operando Catalyst Characterization (DOI: 10.1038/s41578-019-0165-8)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// MAIN PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    targetReaction,
    catalystType,
    performanceTargets,
    supportMaterial,
    scaleRequirements,
    constraints
  } = inputs;

  // --------------------------------------------------------------------------
  // PHASE 1: Catalyst Design and Computational Screening
  // --------------------------------------------------------------------------

  const designResult = await ctx.task(catalystDesignTask, {
    targetReaction,
    catalystType,
    performanceTargets,
    supportMaterial,
    constraints
  });

  if (!designResult.feasibleCandidates || designResult.feasibleCandidates.length === 0) {
    return {
      success: false,
      error: 'No feasible catalyst candidates identified',
      recommendations: designResult.recommendations,
      screeningReport: designResult.screeningReport
    };
  }

  await ctx.breakpoint({
    question: `Catalyst design identified ${designResult.feasibleCandidates.length} candidates with predicted activities. Top candidate: ${designResult.topCandidate.composition}. Review computational screening results and approve synthesis?`,
    title: 'Catalyst Design Review',
    context: {
      runId: ctx.runId,
      candidates: designResult.feasibleCandidates,
      computationalPredictions: designResult.computationalResults
    }
  });

  // --------------------------------------------------------------------------
  // PHASE 2: Synthesis Optimization Loop
  // --------------------------------------------------------------------------

  let synthesisIteration = 0;
  const maxSynthesisIterations = inputs.maxSynthesisIterations || 8;
  let currentCatalyst = designResult.topCandidate;
  let synthesisConverged = false;
  let synthesisHistory = [];

  while (synthesisIteration < maxSynthesisIterations && !synthesisConverged) {
    synthesisIteration++;

    const synthesisResult = await ctx.task(synthesisDevelopmentTask, {
      iteration: synthesisIteration,
      catalystDesign: currentCatalyst,
      previousResults: synthesisHistory,
      targetProperties: designResult.targetProperties,
      catalystType
    });

    synthesisHistory.push({
      iteration: synthesisIteration,
      protocol: synthesisResult.protocol,
      characterization: synthesisResult.characterization,
      qualityMetrics: synthesisResult.qualityMetrics
    });

    // Evaluate synthesis quality
    const synthesisQuality = await ctx.task(synthesisQualityTask, {
      iteration: synthesisIteration,
      synthesisResult,
      targetProperties: designResult.targetProperties,
      history: synthesisHistory
    });

    synthesisConverged = synthesisQuality.meetsSpecifications &&
                         synthesisQuality.reproducibility >= 0.90;

    currentCatalyst = {
      ...currentCatalyst,
      synthesisProtocol: synthesisResult.protocol,
      characterization: synthesisResult.characterization
    };

    if (!synthesisConverged && synthesisIteration < maxSynthesisIterations) {
      await ctx.breakpoint({
        question: `Synthesis iteration ${synthesisIteration}: Quality score ${synthesisQuality.overallScore.toFixed(2)}, Reproducibility ${(synthesisQuality.reproducibility * 100).toFixed(1)}%. Continue optimization with recommended adjustments?`,
        title: 'Synthesis Optimization Checkpoint',
        context: {
          runId: ctx.runId,
          qualityDetails: synthesisQuality,
          recommendations: synthesisResult.optimizationRecommendations
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // PHASE 3: Activity and Selectivity Characterization
  // --------------------------------------------------------------------------

  const activityResult = await ctx.task(activityCharacterizationTask, {
    catalyst: currentCatalyst,
    targetReaction,
    performanceTargets,
    testConditions: designResult.recommendedTestConditions
  });

  if (activityResult.conversion < performanceTargets.conversion * 0.5) {
    // Catalyst significantly underperforms - consider alternative candidates
    await ctx.breakpoint({
      question: `Catalyst shows low activity (${activityResult.conversion}% vs target ${performanceTargets.conversion}%). Evaluate alternative candidate or modify current design?`,
      title: 'Low Activity Alert',
      context: {
        runId: ctx.runId,
        activityData: activityResult,
        alternativeCandidates: designResult.feasibleCandidates.slice(1, 4)
      }
    });
  }

  // --------------------------------------------------------------------------
  // PHASE 4: Iterative Performance Optimization
  // --------------------------------------------------------------------------

  let optimizationIteration = 0;
  const maxOptimizationIterations = inputs.maxOptimizationIterations || 10;
  let performanceConverged = false;
  let optimizationHistory = [];
  let currentPerformance = activityResult;

  while (optimizationIteration < maxOptimizationIterations && !performanceConverged) {
    optimizationIteration++;

    const optimizationResult = await ctx.task(performanceOptimizationTask, {
      iteration: optimizationIteration,
      catalyst: currentCatalyst,
      currentPerformance,
      performanceTargets,
      optimizationHistory,
      targetReaction
    });

    // Implement recommended modifications
    const modificationResult = await ctx.task(catalystModificationTask, {
      catalyst: currentCatalyst,
      modifications: optimizationResult.recommendedModifications,
      synthesisProtocol: currentCatalyst.synthesisProtocol
    });

    // Re-evaluate performance
    const newPerformance = await ctx.task(activityCharacterizationTask, {
      catalyst: modificationResult.modifiedCatalyst,
      targetReaction,
      performanceTargets,
      testConditions: designResult.recommendedTestConditions
    });

    optimizationHistory.push({
      iteration: optimizationIteration,
      modifications: optimizationResult.recommendedModifications,
      beforePerformance: currentPerformance,
      afterPerformance: newPerformance,
      improvement: {
        conversionChange: newPerformance.conversion - currentPerformance.conversion,
        selectivityChange: newPerformance.selectivity - currentPerformance.selectivity,
        tofChange: newPerformance.turnoverFrequency - currentPerformance.turnoverFrequency
      }
    });

    // Check convergence
    const meetsTargets = newPerformance.conversion >= performanceTargets.conversion &&
                         newPerformance.selectivity >= performanceTargets.selectivity &&
                         newPerformance.turnoverFrequency >= performanceTargets.tof;

    const improvementRate = optimizationHistory.length >= 3 ?
      calculateImprovementRate(optimizationHistory.slice(-3)) : 1.0;

    performanceConverged = meetsTargets || improvementRate < 0.02;

    currentCatalyst = modificationResult.modifiedCatalyst;
    currentPerformance = newPerformance;

    if (!performanceConverged && optimizationIteration < maxOptimizationIterations) {
      await ctx.breakpoint({
        question: `Optimization iteration ${optimizationIteration}: Conversion ${newPerformance.conversion.toFixed(1)}% (target: ${performanceTargets.conversion}%), Selectivity ${newPerformance.selectivity.toFixed(1)}% (target: ${performanceTargets.selectivity}%). Continue with ${optimizationResult.nextStrategy}?`,
        title: 'Performance Optimization Checkpoint',
        context: {
          runId: ctx.runId,
          performanceData: newPerformance,
          optimizationHistory: optimizationHistory.slice(-3)
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // PHASE 5: Reaction Mechanism Investigation
  // --------------------------------------------------------------------------

  const mechanismResult = await ctx.task(mechanismInvestigationTask, {
    catalyst: currentCatalyst,
    targetReaction,
    performanceData: currentPerformance,
    characterizationData: currentCatalyst.characterization
  });

  await ctx.breakpoint({
    question: `Mechanism study complete. Proposed pathway: ${mechanismResult.proposedMechanism.pathway}. Rate-determining step: ${mechanismResult.rateAnalysis.rds}. Review mechanistic insights?`,
    title: 'Mechanism Study Review',
    context: {
      runId: ctx.runId,
      mechanismDetails: mechanismResult,
      kineticData: mechanismResult.kineticAnalysis
    }
  });

  // --------------------------------------------------------------------------
  // PHASE 6: Stability Testing and Durability Assessment
  // --------------------------------------------------------------------------

  const stabilityResult = await ctx.task(stabilityTestingTask, {
    catalyst: currentCatalyst,
    targetReaction,
    stabilityTarget: performanceTargets.stability,
    acceleratedProtocol: true
  });

  if (!stabilityResult.meetsTarget) {
    // Stability improvement needed
    const stabilizationResult = await ctx.task(stabilizationStrategyTask, {
      catalyst: currentCatalyst,
      stabilityData: stabilityResult,
      deactivationMechanisms: stabilityResult.deactivationAnalysis
    });

    await ctx.breakpoint({
      question: `Catalyst stability below target. Deactivation mechanisms: ${stabilityResult.deactivationAnalysis.primaryMechanism}. Implement stabilization strategy: ${stabilizationResult.recommendedStrategy}?`,
      title: 'Stability Enhancement Required',
      context: {
        runId: ctx.runId,
        stabilityData: stabilityResult,
        stabilizationOptions: stabilizationResult
      }
    });

    // Apply stabilization
    const stabilizedCatalyst = await ctx.task(catalystModificationTask, {
      catalyst: currentCatalyst,
      modifications: stabilizationResult.modifications,
      synthesisProtocol: currentCatalyst.synthesisProtocol
    });

    currentCatalyst = stabilizedCatalyst.modifiedCatalyst;
  }

  // --------------------------------------------------------------------------
  // PHASE 7: Scale-Up Development
  // --------------------------------------------------------------------------

  const scaleUpResult = await ctx.task(scaleUpDevelopmentTask, {
    catalyst: currentCatalyst,
    synthesisProtocol: currentCatalyst.synthesisProtocol,
    scaleRequirements,
    constraints
  });

  // Scale-up validation
  const scaleValidation = await ctx.task(scaleUpValidationTask, {
    scaleUpProtocol: scaleUpResult.protocol,
    targetScale: scaleRequirements.batchSize,
    qualitySpecifications: currentCatalyst.characterization.specifications
  });

  if (!scaleValidation.validated) {
    await ctx.breakpoint({
      question: `Scale-up validation failed: ${scaleValidation.failureMode}. Review issues and approve remediation strategy?`,
      title: 'Scale-Up Validation Issue',
      context: {
        runId: ctx.runId,
        validationResults: scaleValidation,
        remediationOptions: scaleValidation.remediationStrategies
      }
    });
  }

  // --------------------------------------------------------------------------
  // PHASE 8: Process Integration and Documentation
  // --------------------------------------------------------------------------

  const processDocumentation = await ctx.task(processDocumentationTask, {
    catalyst: currentCatalyst,
    synthesisProtocol: currentCatalyst.synthesisProtocol,
    performanceData: currentPerformance,
    mechanismInsights: mechanismResult,
    stabilityProfile: stabilityResult,
    scaleUpProtocol: scaleUpResult,
    optimizationHistory,
    synthesisHistory
  });

  // --------------------------------------------------------------------------
  // FINAL REVIEW AND COMPLETION
  // --------------------------------------------------------------------------

  await ctx.breakpoint({
    question: `Nanocatalyst development complete. Final performance: Conversion ${currentPerformance.conversion.toFixed(1)}%, Selectivity ${currentPerformance.selectivity.toFixed(1)}%, TOF ${currentPerformance.turnoverFrequency.toFixed(3)} s⁻¹. Approve final documentation and process package?`,
    title: 'Final Development Review',
    context: {
      runId: ctx.runId,
      catalystSummary: currentCatalyst,
      performanceSummary: currentPerformance,
      documentationPackage: processDocumentation
    }
  });

  return {
    success: true,
    optimizedCatalyst: {
      composition: currentCatalyst.composition,
      structure: currentCatalyst.structure,
      support: currentCatalyst.support,
      synthesisProtocol: currentCatalyst.synthesisProtocol,
      characterization: currentCatalyst.characterization
    },
    performanceData: {
      conversion: currentPerformance.conversion,
      selectivity: currentPerformance.selectivity,
      turnoverFrequency: currentPerformance.turnoverFrequency,
      turnoverNumber: currentPerformance.turnoverNumber,
      apparentActivationEnergy: currentPerformance.apparentEa,
      reactionOrders: currentPerformance.reactionOrders
    },
    mechanismInsights: {
      proposedPathway: mechanismResult.proposedMechanism,
      rateAnalysis: mechanismResult.rateAnalysis,
      activeSpecies: mechanismResult.activeSpeciesIdentification,
      supportEvidence: mechanismResult.experimentalEvidence
    },
    stabilityProfile: {
      lifetime: stabilityResult.projectedLifetime,
      deactivationMechanisms: stabilityResult.deactivationAnalysis,
      regenerationProtocol: stabilityResult.regenerationProcedure,
      operatingWindow: stabilityResult.stableOperatingConditions
    },
    scaleUpProtocol: {
      batchProtocol: scaleUpResult.protocol,
      processParameters: scaleUpResult.criticalParameters,
      qualityControl: scaleUpResult.qcProcedures,
      expectedYield: scaleUpResult.projectedYield
    },
    processDocumentation: {
      developmentReport: processDocumentation.developmentReport,
      manufacturingGuide: processDocumentation.manufacturingGuide,
      analyticalMethods: processDocumentation.analyticalMethods,
      safetyData: processDocumentation.safetyDataSheet
    },
    metrics: {
      synthesisIterations: synthesisIteration,
      optimizationIterations: optimizationIteration,
      timeToTarget: calculateDevelopmentTime(synthesisHistory, optimizationHistory),
      costEstimate: scaleUpResult.costAnalysis
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateImprovementRate(recentHistory) {
  if (recentHistory.length < 2) return 1.0;

  const improvements = recentHistory.map(h =>
    Math.abs(h.improvement.conversionChange) +
    Math.abs(h.improvement.selectivityChange) * 0.5
  );

  return improvements.reduce((a, b) => a + b, 0) / improvements.length;
}

function calculateDevelopmentTime(synthesisHistory, optimizationHistory) {
  const synthesisTime = synthesisHistory.length * 2; // ~2 days per synthesis iteration
  const optimizationTime = optimizationHistory.length * 1.5; // ~1.5 days per optimization
  return synthesisTime + optimizationTime;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const catalystDesignTask = defineTask('catalyst-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design nanocatalyst for ${args.targetReaction.products[0]} synthesis`,
  agent: {
    name: 'catalyst-design-engineer',
    prompt: {
      role: 'Computational catalyst designer specializing in nanomaterial catalyst development with expertise in DFT, descriptor-based screening, and structure-activity relationships',
      task: `Design nanocatalyst candidates for the target reaction: ${JSON.stringify(args.targetReaction)}. Catalyst type: ${args.catalystType}. Performance targets: conversion ${args.performanceTargets.conversion}%, selectivity ${args.performanceTargets.selectivity}%, TOF ${args.performanceTargets.tof} s⁻¹`,
      context: args,
      instructions: [
        'Analyze target reaction thermodynamics and identify key intermediates',
        'Screen catalyst compositions using descriptor-based approaches (d-band center, adsorption energies)',
        'Evaluate volcano plot relationships for activity predictions',
        'Consider support effects on catalyst performance (SMSI, spillover)',
        'Optimize particle size and morphology for maximum active site exposure',
        'Assess catalyst selectivity through DFT binding energy calculations',
        'Rank candidates by predicted performance and synthesizability',
        'Recommend test conditions for experimental validation',
        'Consider cost, toxicity, and sustainability constraints'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibleCandidates', 'topCandidate', 'computationalResults', 'targetProperties', 'recommendedTestConditions'],
      properties: {
        feasibleCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              composition: { type: 'string' },
              structure: { type: 'string' },
              predictedActivity: { type: 'number' },
              predictedSelectivity: { type: 'number' },
              synthesizability: { type: 'number' },
              cost: { type: 'number' }
            }
          }
        },
        topCandidate: { type: 'object' },
        computationalResults: { type: 'object' },
        targetProperties: { type: 'object' },
        recommendedTestConditions: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        screeningReport: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'design', 'computational']
}));

export const synthesisDevelopmentTask = defineTask('synthesis-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop synthesis protocol - Iteration ${args.iteration}`,
  agent: {
    name: 'nanocatalyst-synthesis-specialist',
    prompt: {
      role: 'Nanomaterial synthesis specialist with expertise in controlled nanoparticle synthesis, support functionalization, and catalyst preparation methods',
      task: `Develop synthesis protocol for catalyst: ${args.catalystDesign.composition}. Iteration ${args.iteration}. Previous results: ${args.previousResults.length} experiments completed`,
      context: args,
      instructions: [
        'Select appropriate synthesis method (impregnation, co-precipitation, sol-gel, colloidal)',
        'Optimize precursor selection and concentrations',
        'Control nucleation and growth parameters for size/shape control',
        'Develop support preparation/functionalization protocol if applicable',
        'Specify reduction/activation conditions',
        'Perform comprehensive characterization (XRD, TEM, XPS, BET, TPR)',
        'Evaluate batch-to-batch reproducibility',
        'Document critical process parameters',
        'Recommend optimization directions based on characterization results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'characterization', 'qualityMetrics', 'optimizationRecommendations'],
      properties: {
        protocol: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            precursors: { type: 'array' },
            conditions: { type: 'object' },
            steps: { type: 'array' },
            criticalParameters: { type: 'array' }
          }
        },
        characterization: {
          type: 'object',
          properties: {
            particleSize: { type: 'object' },
            crystallinity: { type: 'object' },
            surfaceArea: { type: 'number' },
            metalLoading: { type: 'number' },
            surfaceComposition: { type: 'object' },
            morphology: { type: 'string' }
          }
        },
        qualityMetrics: { type: 'object' },
        optimizationRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'synthesis']
}));

export const synthesisQualityTask = defineTask('synthesis-quality-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate synthesis quality - Iteration ${args.iteration}`,
  agent: {
    name: 'quality-assessment-specialist',
    prompt: {
      role: 'Analytical chemist specializing in nanomaterial quality assessment and statistical process control',
      task: `Evaluate synthesis quality for iteration ${args.iteration}. Compare against target properties and assess reproducibility`,
      context: args,
      instructions: [
        'Compare characterization results against target specifications',
        'Assess particle size distribution quality (PDI, CV)',
        'Evaluate metal loading accuracy and dispersion',
        'Check crystallographic phase purity',
        'Analyze surface composition vs bulk',
        'Calculate reproducibility metrics across batches',
        'Identify out-of-specification parameters',
        'Determine overall quality score',
        'Recommend synthesis adjustments if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecifications', 'overallScore', 'reproducibility', 'parameterAnalysis'],
      properties: {
        meetsSpecifications: { type: 'boolean' },
        overallScore: { type: 'number' },
        reproducibility: { type: 'number' },
        parameterAnalysis: { type: 'object' },
        outOfSpecParameters: { type: 'array' },
        qualityTrends: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'quality']
}));

export const activityCharacterizationTask = defineTask('activity-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize catalyst activity and selectivity',
  agent: {
    name: 'catalysis-testing-specialist',
    prompt: {
      role: 'Catalysis testing specialist with expertise in reactor design, kinetic measurements, and catalytic performance evaluation',
      task: `Characterize catalytic performance for reaction: ${JSON.stringify(args.targetReaction)}. Performance targets: conversion ${args.performanceTargets.conversion}%, selectivity ${args.performanceTargets.selectivity}%`,
      context: args,
      instructions: [
        'Design testing protocol (batch/flow, conditions, sampling)',
        'Establish mass transfer limitation checks',
        'Measure conversion and selectivity at multiple conditions',
        'Calculate turnover frequency (TOF) and turnover number (TON)',
        'Determine apparent activation energy from Arrhenius plot',
        'Measure reaction orders for reactants',
        'Evaluate catalyst productivity and space-time yield',
        'Compare performance against targets and benchmarks',
        'Identify optimization opportunities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['conversion', 'selectivity', 'turnoverFrequency', 'turnoverNumber'],
      properties: {
        conversion: { type: 'number' },
        selectivity: { type: 'number' },
        turnoverFrequency: { type: 'number' },
        turnoverNumber: { type: 'number' },
        apparentEa: { type: 'number' },
        reactionOrders: { type: 'object' },
        productDistribution: { type: 'object' },
        massTransferCheck: { type: 'object' },
        performanceVsTarget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'activity', 'testing']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize catalyst performance - Iteration ${args.iteration}`,
  agent: {
    name: 'catalyst-optimization-specialist',
    prompt: {
      role: 'Catalyst optimization specialist with expertise in structure-activity relationships, promoter effects, and reaction engineering',
      task: `Optimize catalyst performance. Current: conversion ${args.currentPerformance.conversion}%, selectivity ${args.currentPerformance.selectivity}%. Targets: conversion ${args.performanceTargets.conversion}%, selectivity ${args.performanceTargets.selectivity}%`,
      context: args,
      instructions: [
        'Analyze current performance gaps',
        'Identify limiting factors (activity, selectivity, mass transfer)',
        'Evaluate promoter/modifier addition strategies',
        'Consider particle size optimization',
        'Assess support modification effects',
        'Optimize metal-support interaction',
        'Evaluate reaction condition modifications',
        'Recommend specific modifications with expected improvements',
        'Propose next optimization strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedModifications', 'expectedImprovement', 'nextStrategy'],
      properties: {
        recommendedModifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              details: { type: 'object' },
              rationale: { type: 'string' },
              expectedEffect: { type: 'object' }
            }
          }
        },
        expectedImprovement: { type: 'object' },
        nextStrategy: { type: 'string' },
        limitingFactorAnalysis: { type: 'object' },
        alternativeApproaches: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'optimization']
}));

export const catalystModificationTask = defineTask('catalyst-modification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement catalyst modifications',
  agent: {
    name: 'catalyst-modification-specialist',
    prompt: {
      role: 'Catalyst modification specialist with expertise in post-synthesis treatments, promoter incorporation, and surface engineering',
      task: `Implement catalyst modifications: ${args.modifications.map(m => m.type).join(', ')}`,
      context: args,
      instructions: [
        'Adapt synthesis protocol for modifications',
        'Implement promoter/modifier addition',
        'Adjust particle size if required',
        'Modify support properties as needed',
        'Apply post-synthesis treatments',
        'Characterize modified catalyst',
        'Verify modification success',
        'Document modified synthesis protocol',
        'Update catalyst specifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['modifiedCatalyst', 'modificationSuccess', 'updatedProtocol'],
      properties: {
        modifiedCatalyst: {
          type: 'object',
          properties: {
            composition: { type: 'string' },
            structure: { type: 'string' },
            support: { type: 'string' },
            synthesisProtocol: { type: 'object' },
            characterization: { type: 'object' }
          }
        },
        modificationSuccess: { type: 'boolean' },
        updatedProtocol: { type: 'object' },
        characterizationComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'modification']
}));

export const mechanismInvestigationTask = defineTask('mechanism-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Investigate reaction mechanism',
  agent: {
    name: 'reaction-mechanism-specialist',
    prompt: {
      role: 'Reaction mechanism specialist with expertise in operando spectroscopy, kinetic isotope effects, and microkinetic modeling',
      task: `Investigate reaction mechanism for ${JSON.stringify(args.targetReaction)} over ${args.catalyst.composition} catalyst`,
      context: args,
      instructions: [
        'Design mechanistic study protocol',
        'Perform operando/in-situ spectroscopy (IR, Raman, XAS)',
        'Measure kinetic isotope effects',
        'Identify reaction intermediates',
        'Determine rate-determining step',
        'Measure elementary step kinetics',
        'Develop microkinetic model',
        'Identify active sites and their role',
        'Correlate mechanism with catalyst structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['proposedMechanism', 'rateAnalysis', 'activeSpeciesIdentification', 'experimentalEvidence'],
      properties: {
        proposedMechanism: {
          type: 'object',
          properties: {
            pathway: { type: 'string' },
            intermediates: { type: 'array' },
            elementarySteps: { type: 'array' },
            energyProfile: { type: 'object' }
          }
        },
        rateAnalysis: {
          type: 'object',
          properties: {
            rds: { type: 'string' },
            degreesOfRateControl: { type: 'object' },
            microkinetics: { type: 'object' }
          }
        },
        activeSpeciesIdentification: { type: 'object' },
        experimentalEvidence: { type: 'object' },
        kineticAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'mechanism']
}));

export const stabilityTestingTask = defineTask('stability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test catalyst stability and durability',
  agent: {
    name: 'catalyst-stability-specialist',
    prompt: {
      role: 'Catalyst stability testing specialist with expertise in accelerated aging, deactivation analysis, and lifetime prediction',
      task: `Test stability of ${args.catalyst.composition} catalyst. Target lifetime: ${args.stabilityTarget}`,
      context: args,
      instructions: [
        'Design stability testing protocol (time-on-stream, cycling)',
        'Implement accelerated aging conditions if specified',
        'Monitor activity/selectivity decay over time',
        'Perform periodic characterization during testing',
        'Identify deactivation mechanisms (sintering, coking, poisoning, leaching)',
        'Quantify deactivation rates',
        'Develop regeneration protocol',
        'Project catalyst lifetime',
        'Determine stable operating window'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsTarget', 'projectedLifetime', 'deactivationAnalysis', 'stableOperatingConditions'],
      properties: {
        meetsTarget: { type: 'boolean' },
        projectedLifetime: { type: 'string' },
        deactivationAnalysis: {
          type: 'object',
          properties: {
            primaryMechanism: { type: 'string' },
            deactivationRate: { type: 'number' },
            structuralChanges: { type: 'object' }
          }
        },
        regenerationProcedure: { type: 'object' },
        stableOperatingConditions: { type: 'object' },
        characterizationAfterTest: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'stability']
}));

export const stabilizationStrategyTask = defineTask('stabilization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop catalyst stabilization strategy',
  agent: {
    name: 'catalyst-stabilization-specialist',
    prompt: {
      role: 'Catalyst stabilization specialist with expertise in core-shell structures, encapsulation, and support modification for enhanced durability',
      task: `Develop stabilization strategy for ${args.catalyst.composition}. Primary deactivation: ${args.deactivationMechanisms.primaryMechanism}`,
      context: args,
      instructions: [
        'Analyze deactivation mechanisms in detail',
        'Evaluate stabilization approaches for each mechanism',
        'Consider core-shell or encapsulation strategies',
        'Assess support modification for anti-sintering',
        'Evaluate promoters for poison resistance',
        'Design regeneration-friendly modifications',
        'Balance stability vs activity trade-offs',
        'Recommend implementation approach',
        'Estimate stability improvement'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedStrategy', 'modifications', 'expectedImprovement'],
      properties: {
        recommendedStrategy: { type: 'string' },
        modifications: { type: 'array' },
        expectedImprovement: { type: 'object' },
        tradeoffs: { type: 'object' },
        implementationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'stabilization']
}));

export const scaleUpDevelopmentTask = defineTask('scale-up-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop catalyst scale-up protocol',
  agent: {
    name: 'scale-up-specialist',
    prompt: {
      role: 'Chemical engineering specialist in catalyst manufacturing scale-up with expertise in mixing, heat transfer, and batch process optimization',
      task: `Develop scale-up protocol from lab to ${args.scaleRequirements.batchSize} batch size`,
      context: args,
      instructions: [
        'Analyze lab protocol for scale-up challenges',
        'Identify critical scale-dependent parameters',
        'Design scaled mixing and heat transfer systems',
        'Address concentration and temperature gradients',
        'Optimize precursor addition rates and sequences',
        'Develop in-process controls and monitoring',
        'Design quality control sampling plan',
        'Estimate production costs at scale',
        'Document manufacturing protocol'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'criticalParameters', 'qcProcedures', 'costAnalysis'],
      properties: {
        protocol: { type: 'object' },
        criticalParameters: { type: 'array' },
        qcProcedures: { type: 'object' },
        projectedYield: { type: 'number' },
        costAnalysis: { type: 'object' },
        equipmentRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'scale-up', 'manufacturing']
}));

export const scaleUpValidationTask = defineTask('scale-up-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate scale-up process',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Process validation specialist with expertise in manufacturing validation, statistical analysis, and quality system compliance',
      task: `Validate scale-up protocol for ${args.targetScale} production`,
      context: args,
      instructions: [
        'Execute pilot batch(es) per protocol',
        'Perform comprehensive characterization',
        'Compare against lab-scale specifications',
        'Evaluate batch-to-batch consistency',
        'Test catalytic performance of scaled material',
        'Identify any scale-related deviations',
        'Document validation results',
        'Recommend protocol adjustments if needed',
        'Issue validation report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'validationResults', 'comparisonToLabScale'],
      properties: {
        validated: { type: 'boolean' },
        validationResults: { type: 'object' },
        comparisonToLabScale: { type: 'object' },
        failureMode: { type: 'string' },
        remediationStrategies: { type: 'array' },
        validationReport: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'validation']
}));

export const processDocumentationTask = defineTask('process-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive process documentation',
  agent: {
    name: 'technical-documentation-specialist',
    prompt: {
      role: 'Technical documentation specialist with expertise in catalyst manufacturing documentation, analytical methods, and regulatory compliance',
      task: 'Generate comprehensive documentation package for nanocatalyst development',
      context: args,
      instructions: [
        'Compile development report with all experimental data',
        'Document final synthesis protocol with all parameters',
        'Write manufacturing guide with QC specifications',
        'Document all analytical methods used',
        'Compile performance data and specifications',
        'Include mechanism insights and kinetic parameters',
        'Prepare stability data and operating recommendations',
        'Generate safety data sheet',
        'Create technology transfer package'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['developmentReport', 'manufacturingGuide', 'analyticalMethods', 'safetyDataSheet'],
      properties: {
        developmentReport: { type: 'object' },
        manufacturingGuide: { type: 'object' },
        analyticalMethods: { type: 'object' },
        safetyDataSheet: { type: 'object' },
        technologyTransferPackage: { type: 'object' },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'catalyst', 'documentation']
}));
