/**
 * @file nanomaterial-safety-assessment.js
 * @process nanomaterial-safety-assessment
 * @description Execute comprehensive nanotoxicology and environmental safety assessments including
 * physicochemical characterization, in vitro cytotoxicity testing, environmental fate modeling,
 * exposure pathway analysis, and regulatory documentation with compliance validation against
 * international standards.
 *
 * @inputs {
 *   nanomaterial: { type: 'object', properties: { name: 'string', composition: 'string', form: 'string', size: 'object' } },
 *   applicationContext: 'string', // e.g., 'consumer-product', 'industrial', 'medical', 'environmental'
 *   regulatoryFrameworks: 'array', // e.g., ['REACH', 'TSCA', 'ISO-19007', 'OECD-TG']
 *   exposureScenarios: 'array', // e.g., ['occupational', 'consumer', 'environmental-release']
 *   requiredEndpoints: 'array', // specific toxicity endpoints required
 *   existingData: 'object' // any existing safety/characterization data
 * }
 *
 * @outputs {
 *   safetyProfile: 'object',
 *   toxicologyData: 'object',
 *   environmentalFate: 'object',
 *   riskAssessment: 'object',
 *   regulatoryDossier: 'object',
 *   safeHandlingGuidelines: 'object'
 * }
 *
 * @example
 * // Input
 * {
 *   "nanomaterial": {
 *     "name": "Silver nanoparticles",
 *     "composition": "Ag with PVP coating",
 *     "form": "colloidal dispersion",
 *     "size": { "mean": 20, "unit": "nm", "distribution": "narrow" }
 *   },
 *   "applicationContext": "consumer-product",
 *   "regulatoryFrameworks": ["REACH", "EPA-TSCA", "OECD-TG"],
 *   "exposureScenarios": ["consumer-dermal", "consumer-inhalation", "environmental-aquatic"],
 *   "requiredEndpoints": ["cytotoxicity", "genotoxicity", "ecotoxicity-aquatic"],
 *   "existingData": {}
 * }
 *
 * @references
 * - ISO/TR 13014:2012 Nanotechnologies - Guidance on physicochemical characterization
 * - OECD Test Guidelines for Manufactured Nanomaterials
 * - REACH Nanomaterials Guidance (ECHA)
 * - NIOSH Nanotechnology Research Center Guidelines
 * - ISO 19007:2018 In vitro cytotoxicity methods
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// MAIN PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    nanomaterial,
    applicationContext,
    regulatoryFrameworks,
    exposureScenarios,
    requiredEndpoints,
    existingData
  } = inputs;

  // --------------------------------------------------------------------------
  // PHASE 1: Comprehensive Physicochemical Characterization
  // --------------------------------------------------------------------------

  const characterizationResult = await ctx.task(physicochemicalCharacterizationTask, {
    nanomaterial,
    existingData,
    regulatoryFrameworks
  });

  if (!characterizationResult.complete) {
    return {
      success: false,
      error: 'Physicochemical characterization incomplete',
      missingParameters: characterizationResult.missingParameters,
      recommendations: characterizationResult.recommendations
    };
  }

  await ctx.breakpoint({
    question: `Physicochemical characterization complete. ${characterizationResult.parametersCharacterized} parameters documented including size distribution (${characterizationResult.sizeAnalysis.meanDiameter} nm), surface properties, and composition. Proceed to hazard assessment?`,
    title: 'Characterization Review',
    context: {
      runId: ctx.runId,
      characterizationSummary: characterizationResult.summary,
      dataQuality: characterizationResult.dataQualityAssessment
    }
  });

  // --------------------------------------------------------------------------
  // PHASE 2: In Vitro Hazard Assessment
  // --------------------------------------------------------------------------

  const inVitroResult = await ctx.task(inVitroHazardAssessmentTask, {
    nanomaterial,
    characterization: characterizationResult,
    requiredEndpoints: requiredEndpoints.filter(e => isInVitroEndpoint(e)),
    applicationContext
  });

  // Evaluate if additional testing is needed based on results
  const hazardFlags = evaluateHazardFlags(inVitroResult);

  if (hazardFlags.requiresAdditionalTesting) {
    await ctx.breakpoint({
      question: `In vitro testing identified potential hazards: ${hazardFlags.concerns.join(', ')}. ${hazardFlags.additionalTestingRecommended.length} additional tests recommended. Approve extended testing protocol?`,
      title: 'Additional Testing Required',
      context: {
        runId: ctx.runId,
        hazardFlags,
        currentResults: inVitroResult.summary,
        recommendedTests: hazardFlags.additionalTestingRecommended
      }
    });

    // Perform additional testing
    const additionalResult = await ctx.task(additionalToxicityTestingTask, {
      nanomaterial,
      characterization: characterizationResult,
      previousResults: inVitroResult,
      additionalTests: hazardFlags.additionalTestingRecommended
    });

    inVitroResult.additionalTesting = additionalResult;
  }

  // --------------------------------------------------------------------------
  // PHASE 3: Genotoxicity Assessment (if required)
  // --------------------------------------------------------------------------

  let genotoxicityResult = null;
  if (requiredEndpoints.includes('genotoxicity') || hazardFlags.genotoxicityRequired) {
    genotoxicityResult = await ctx.task(genotoxicityAssessmentTask, {
      nanomaterial,
      characterization: characterizationResult,
      inVitroData: inVitroResult,
      testBattery: determineGenotoxicityBattery(regulatoryFrameworks)
    });

    if (genotoxicityResult.positiveFindings.length > 0) {
      await ctx.breakpoint({
        question: `Genotoxicity assessment found positive results: ${genotoxicityResult.positiveFindings.map(f => f.test).join(', ')}. Review findings and determine follow-up strategy?`,
        title: 'Genotoxicity Findings',
        context: {
          runId: ctx.runId,
          genotoxicityResults: genotoxicityResult,
          mechanisticAnalysis: genotoxicityResult.mechanisticEvaluation
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // PHASE 4: Ecotoxicology Assessment (if required)
  // --------------------------------------------------------------------------

  let ecotoxicityResult = null;
  const ecotoxEndpoints = requiredEndpoints.filter(e => isEcotoxEndpoint(e));

  if (ecotoxEndpoints.length > 0 || exposureScenarios.some(s => s.includes('environmental'))) {
    ecotoxicityResult = await ctx.task(ecotoxicologyAssessmentTask, {
      nanomaterial,
      characterization: characterizationResult,
      endpoints: ecotoxEndpoints,
      environmentalCompartments: determineEnvironmentalCompartments(exposureScenarios)
    });

    await ctx.breakpoint({
      question: `Ecotoxicology assessment complete. PNEC values: Aquatic ${ecotoxicityResult.pnecValues.aquatic} mg/L, Soil ${ecotoxicityResult.pnecValues.soil} mg/kg. Continue to environmental fate modeling?`,
      title: 'Ecotoxicology Review',
      context: {
        runId: ctx.runId,
        ecotoxResults: ecotoxicityResult,
        speciesSensitivity: ecotoxicityResult.speciesSensitivityDistribution
      }
    });
  }

  // --------------------------------------------------------------------------
  // PHASE 5: Environmental Fate and Transport Modeling
  // --------------------------------------------------------------------------

  const environmentalFateResult = await ctx.task(environmentalFateModelingTask, {
    nanomaterial,
    characterization: characterizationResult,
    exposureScenarios,
    applicationContext,
    releaseEstimates: calculateReleaseEstimates(applicationContext, nanomaterial)
  });

  // --------------------------------------------------------------------------
  // PHASE 6: Exposure Assessment
  // --------------------------------------------------------------------------

  const exposureAssessmentResult = await ctx.task(exposureAssessmentTask, {
    nanomaterial,
    characterization: characterizationResult,
    exposureScenarios,
    applicationContext,
    environmentalFate: environmentalFateResult,
    occupationalControls: inputs.occupationalControls || {}
  });

  await ctx.breakpoint({
    question: `Exposure assessment complete across ${exposureScenarios.length} scenarios. Highest exposure pathway: ${exposureAssessmentResult.dominantPathway} at ${exposureAssessmentResult.maxExposure.value} ${exposureAssessmentResult.maxExposure.unit}. Proceed to risk characterization?`,
    title: 'Exposure Assessment Review',
    context: {
      runId: ctx.runId,
      exposureResults: exposureAssessmentResult,
      scenarioBreakdown: exposureAssessmentResult.scenarioDetails
    }
  });

  // --------------------------------------------------------------------------
  // PHASE 7: Risk Characterization
  // --------------------------------------------------------------------------

  const riskCharacterizationResult = await ctx.task(riskCharacterizationTask, {
    nanomaterial,
    hazardData: {
      inVitro: inVitroResult,
      genotoxicity: genotoxicityResult,
      ecotoxicity: ecotoxicityResult
    },
    exposureData: exposureAssessmentResult,
    environmentalFate: environmentalFateResult,
    applicationContext
  });

  // Iterative risk refinement if margins are borderline
  let riskIteration = 0;
  const maxRiskIterations = inputs.maxRiskIterations || 3;
  let currentRiskAssessment = riskCharacterizationResult;

  while (riskIteration < maxRiskIterations &&
         currentRiskAssessment.requiresRefinement) {
    riskIteration++;

    await ctx.breakpoint({
      question: `Risk margins borderline for ${currentRiskAssessment.borderlineScenarios.join(', ')}. Iteration ${riskIteration}: Refine exposure estimates or gather additional hazard data?`,
      title: 'Risk Refinement Required',
      context: {
        runId: ctx.runId,
        currentRisk: currentRiskAssessment,
        refinementOptions: currentRiskAssessment.refinementRecommendations
      }
    });

    const refinementResult = await ctx.task(riskRefinementTask, {
      iteration: riskIteration,
      currentAssessment: currentRiskAssessment,
      refinementStrategy: currentRiskAssessment.refinementRecommendations[0]
    });

    currentRiskAssessment = await ctx.task(riskCharacterizationTask, {
      nanomaterial,
      hazardData: {
        inVitro: refinementResult.updatedHazardData || inVitroResult,
        genotoxicity: genotoxicityResult,
        ecotoxicity: ecotoxicityResult
      },
      exposureData: refinementResult.updatedExposureData || exposureAssessmentResult,
      environmentalFate: environmentalFateResult,
      applicationContext,
      previousAssessment: currentRiskAssessment
    });
  }

  // --------------------------------------------------------------------------
  // PHASE 8: Risk Management Recommendations
  // --------------------------------------------------------------------------

  const riskManagementResult = await ctx.task(riskManagementTask, {
    riskAssessment: currentRiskAssessment,
    applicationContext,
    exposureScenarios,
    regulatoryFrameworks
  });

  await ctx.breakpoint({
    question: `Risk management measures identified: ${riskManagementResult.measures.length} controls recommended. OEL proposed: ${riskManagementResult.proposedOEL?.value} ${riskManagementResult.proposedOEL?.unit}. Review and approve risk management strategy?`,
    title: 'Risk Management Review',
    context: {
      runId: ctx.runId,
      riskManagement: riskManagementResult,
      controlHierarchy: riskManagementResult.controlHierarchy
    }
  });

  // --------------------------------------------------------------------------
  // PHASE 9: Regulatory Dossier Compilation
  // --------------------------------------------------------------------------

  const regulatoryDossierResult = await ctx.task(regulatoryDossierCompilationTask, {
    nanomaterial,
    characterization: characterizationResult,
    toxicologyData: {
      inVitro: inVitroResult,
      genotoxicity: genotoxicityResult,
      ecotoxicity: ecotoxicityResult
    },
    environmentalFate: environmentalFateResult,
    exposureAssessment: exposureAssessmentResult,
    riskAssessment: currentRiskAssessment,
    riskManagement: riskManagementResult,
    regulatoryFrameworks
  });

  // Validate dossier completeness
  const dossierValidation = await ctx.task(dossierValidationTask, {
    dossier: regulatoryDossierResult,
    regulatoryFrameworks,
    applicationContext
  });

  if (!dossierValidation.complete) {
    await ctx.breakpoint({
      question: `Regulatory dossier incomplete. Missing elements: ${dossierValidation.missingElements.join(', ')}. Address gaps before finalization?`,
      title: 'Dossier Gaps Identified',
      context: {
        runId: ctx.runId,
        validationResults: dossierValidation,
        gapClosureRecommendations: dossierValidation.recommendations
      }
    });
  }

  // --------------------------------------------------------------------------
  // PHASE 10: Safe Handling Guidelines Development
  // --------------------------------------------------------------------------

  const safeHandlingResult = await ctx.task(safeHandlingGuidelinesTask, {
    nanomaterial,
    characterization: characterizationResult,
    hazardProfile: {
      inVitro: inVitroResult,
      genotoxicity: genotoxicityResult
    },
    riskManagement: riskManagementResult,
    exposureScenarios,
    applicationContext
  });

  // --------------------------------------------------------------------------
  // FINAL REVIEW AND COMPLETION
  // --------------------------------------------------------------------------

  const overallRiskLevel = determineOverallRiskLevel(currentRiskAssessment);

  await ctx.breakpoint({
    question: `Nanomaterial safety assessment complete. Overall risk level: ${overallRiskLevel}. Risk quotients within acceptable limits for ${currentRiskAssessment.acceptableScenarios.length}/${exposureScenarios.length} scenarios. Approve final safety documentation package?`,
    title: 'Final Safety Assessment Review',
    context: {
      runId: ctx.runId,
      overallRisk: overallRiskLevel,
      safetyProfile: currentRiskAssessment.summary,
      regulatoryStatus: dossierValidation.complianceStatus
    }
  });

  return {
    success: true,
    safetyProfile: {
      overallRiskLevel,
      hazardClassification: inVitroResult.hazardClassification,
      safetyMargins: currentRiskAssessment.safetyMargins,
      criticalEndpoints: currentRiskAssessment.criticalEndpoints,
      uncertaintyAnalysis: currentRiskAssessment.uncertaintyAnalysis
    },
    toxicologyData: {
      physicochemicalCharacterization: characterizationResult,
      inVitroCytotoxicity: inVitroResult,
      genotoxicity: genotoxicityResult,
      ecotoxicity: ecotoxicityResult,
      dnelDerivation: currentRiskAssessment.dnelValues,
      pnecDerivation: ecotoxicityResult?.pnecValues
    },
    environmentalFate: {
      transportModeling: environmentalFateResult.transportModel,
      transformationProcesses: environmentalFateResult.transformations,
      bioaccumulationPotential: environmentalFateResult.bioaccumulation,
      persistenceAssessment: environmentalFateResult.persistence,
      compartmentDistribution: environmentalFateResult.distribution
    },
    riskAssessment: {
      exposureAssessment: exposureAssessmentResult,
      riskCharacterization: currentRiskAssessment,
      scenarioAnalysis: currentRiskAssessment.scenarioDetails,
      sensitivityAnalysis: currentRiskAssessment.sensitivityAnalysis,
      riskIterations: riskIteration
    },
    regulatoryDossier: {
      dossierContent: regulatoryDossierResult,
      complianceStatus: dossierValidation.complianceStatus,
      frameworkCoverage: dossierValidation.frameworkCoverage,
      dataGaps: dossierValidation.missingElements
    },
    safeHandlingGuidelines: {
      occupationalControls: safeHandlingResult.occupationalControls,
      personalProtectiveEquipment: safeHandlingResult.ppe,
      engineeringControls: safeHandlingResult.engineeringControls,
      emergencyProcedures: safeHandlingResult.emergencyProcedures,
      disposalGuidelines: safeHandlingResult.disposalGuidelines,
      safetyDataSheet: safeHandlingResult.sdsContent
    },
    metrics: {
      parametersAssessed: characterizationResult.parametersCharacterized,
      toxicityTestsPerformed: countToxicityTests(inVitroResult, genotoxicityResult, ecotoxicityResult),
      regulatoryFrameworksCovered: regulatoryFrameworks.length,
      exposureScenariosEvaluated: exposureScenarios.length
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isInVitroEndpoint(endpoint) {
  const inVitroEndpoints = ['cytotoxicity', 'oxidative-stress', 'inflammation',
                           'membrane-integrity', 'mitochondrial-function', 'apoptosis'];
  return inVitroEndpoints.some(e => endpoint.toLowerCase().includes(e));
}

function isEcotoxEndpoint(endpoint) {
  const ecotoxEndpoints = ['aquatic', 'algae', 'daphnia', 'fish', 'soil', 'sediment'];
  return ecotoxEndpoints.some(e => endpoint.toLowerCase().includes(e));
}

function evaluateHazardFlags(inVitroResult) {
  const flags = {
    concerns: [],
    requiresAdditionalTesting: false,
    additionalTestingRecommended: [],
    genotoxicityRequired: false
  };

  if (inVitroResult.cytotoxicity?.ic50 < 10) {
    flags.concerns.push('High cytotoxicity (IC50 < 10 µg/mL)');
    flags.requiresAdditionalTesting = true;
    flags.additionalTestingRecommended.push('mechanism-of-toxicity');
  }

  if (inVitroResult.oxidativeStress?.rosInduction > 3) {
    flags.concerns.push('Significant ROS induction');
    flags.genotoxicityRequired = true;
  }

  if (inVitroResult.inflammation?.cytokineRelease?.il6 > 2 ||
      inVitroResult.inflammation?.cytokineRelease?.tnfAlpha > 2) {
    flags.concerns.push('Pro-inflammatory response');
    flags.additionalTestingRecommended.push('immunotoxicity-panel');
  }

  return flags;
}

function determineGenotoxicityBattery(frameworks) {
  // Standard OECD-compliant battery
  const battery = ['ames-test', 'micronucleus', 'comet-assay'];

  if (frameworks.includes('REACH')) {
    battery.push('chromosomal-aberration');
  }

  return battery;
}

function determineEnvironmentalCompartments(exposureScenarios) {
  const compartments = [];

  exposureScenarios.forEach(scenario => {
    if (scenario.includes('aquatic')) compartments.push('freshwater', 'marine');
    if (scenario.includes('soil')) compartments.push('soil');
    if (scenario.includes('sediment')) compartments.push('sediment');
    if (scenario.includes('wastewater')) compartments.push('stp');
  });

  return [...new Set(compartments)];
}

function calculateReleaseEstimates(applicationContext, nanomaterial) {
  // Placeholder for release estimation logic
  const releaseFactors = {
    'consumer-product': { direct: 0.1, indirect: 0.05 },
    'industrial': { direct: 0.01, indirect: 0.02 },
    'medical': { direct: 0.001, indirect: 0.001 },
    'environmental': { direct: 1.0, indirect: 0.5 }
  };

  return releaseFactors[applicationContext] || releaseFactors['industrial'];
}

function determineOverallRiskLevel(riskAssessment) {
  const maxRQ = Math.max(...Object.values(riskAssessment.riskQuotients || {}));

  if (maxRQ > 1) return 'HIGH';
  if (maxRQ > 0.5) return 'MODERATE';
  if (maxRQ > 0.1) return 'LOW';
  return 'MINIMAL';
}

function countToxicityTests(inVitro, genotox, ecotox) {
  let count = 0;
  if (inVitro?.testsPerformed) count += inVitro.testsPerformed.length;
  if (genotox?.testsPerformed) count += genotox.testsPerformed.length;
  if (ecotox?.testsPerformed) count += ecotox.testsPerformed.length;
  return count;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const physicochemicalCharacterizationTask = defineTask('physicochemical-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Physicochemical characterization of ${args.nanomaterial.name}`,
  agent: {
    name: 'nanomaterial-characterization-specialist',
    prompt: {
      role: 'Nanomaterial characterization specialist with expertise in comprehensive physicochemical analysis per ISO/TR 13014 and OECD guidelines',
      task: `Perform comprehensive physicochemical characterization of ${args.nanomaterial.name} (${args.nanomaterial.composition}) for regulatory safety assessment`,
      context: args,
      instructions: [
        'Measure particle size and size distribution (DLS, TEM, NTA)',
        'Determine particle shape and morphology (TEM, SEM)',
        'Analyze surface area (BET) and porosity',
        'Characterize surface chemistry and charge (zeta potential, XPS)',
        'Determine composition and purity (ICP-MS, XRF)',
        'Assess crystallinity and crystal structure (XRD)',
        'Evaluate agglomeration/aggregation state in relevant media',
        'Measure solubility/dissolution rate',
        'Assess dustiness for powder forms',
        'Document batch variability and stability',
        'Ensure compliance with regulatory characterization requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'parametersCharacterized', 'sizeAnalysis', 'surfaceProperties', 'summary'],
      properties: {
        complete: { type: 'boolean' },
        parametersCharacterized: { type: 'number' },
        sizeAnalysis: {
          type: 'object',
          properties: {
            meanDiameter: { type: 'number' },
            sizeDistribution: { type: 'object' },
            pdi: { type: 'number' },
            method: { type: 'string' }
          }
        },
        morphology: { type: 'object' },
        surfaceProperties: { type: 'object' },
        composition: { type: 'object' },
        agglomerationState: { type: 'object' },
        solubility: { type: 'object' },
        dataQualityAssessment: { type: 'object' },
        missingParameters: { type: 'array' },
        recommendations: { type: 'array' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'characterization']
}));

export const inVitroHazardAssessmentTask = defineTask('in-vitro-hazard-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'In vitro hazard assessment',
  agent: {
    name: 'nanotoxicology-specialist',
    prompt: {
      role: 'Nanotoxicology specialist with expertise in in vitro testing methods per ISO 19007, OECD TG, and nano-specific considerations',
      task: `Perform in vitro hazard assessment for ${args.nanomaterial.name} covering required endpoints: ${args.requiredEndpoints.join(', ')}`,
      context: args,
      instructions: [
        'Select appropriate cell models (relevant to exposure routes)',
        'Address nano-specific assay interferences (optical, adsorption)',
        'Perform cytotoxicity testing (MTT, LDH, neutral red)',
        'Assess oxidative stress markers (ROS, GSH depletion)',
        'Evaluate inflammatory response (cytokine release)',
        'Test membrane integrity (PI uptake, LDH release)',
        'Measure mitochondrial function if indicated',
        'Determine dose-response relationships',
        'Calculate IC50, NOAEL, and relevant metrics',
        'Assess uptake and intracellular localization',
        'Document assay validation for nanomaterials',
        'Classify hazard level based on results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['cytotoxicity', 'oxidativeStress', 'hazardClassification', 'summary'],
      properties: {
        cytotoxicity: {
          type: 'object',
          properties: {
            ic50: { type: 'number' },
            noael: { type: 'number' },
            cellLine: { type: 'string' },
            assayMethod: { type: 'string' }
          }
        },
        oxidativeStress: { type: 'object' },
        inflammation: { type: 'object' },
        membraneIntegrity: { type: 'object' },
        cellularUptake: { type: 'object' },
        testsPerformed: { type: 'array' },
        hazardClassification: { type: 'object' },
        assayValidation: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'toxicology', 'in-vitro']
}));

export const additionalToxicityTestingTask = defineTask('additional-toxicity-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Additional toxicity testing',
  agent: {
    name: 'extended-toxicology-specialist',
    prompt: {
      role: 'Toxicology specialist with expertise in mechanistic toxicology and advanced in vitro methods',
      task: `Perform additional toxicity testing: ${args.additionalTests.join(', ')}`,
      context: args,
      instructions: [
        'Design protocol for requested additional tests',
        'Perform mechanism-of-toxicity studies if indicated',
        'Conduct immunotoxicity panel if flagged',
        'Assess apoptosis/necrosis pathways',
        'Evaluate organelle-specific toxicity',
        'Test relevant exposure route-specific models',
        'Determine mode-of-action',
        'Integrate with previous in vitro results',
        'Update hazard assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['additionalTestResults', 'mechanisticInsights', 'updatedHazardAssessment'],
      properties: {
        additionalTestResults: { type: 'object' },
        mechanisticInsights: { type: 'object' },
        updatedHazardAssessment: { type: 'object' },
        modeOfAction: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'toxicology']
}));

export const genotoxicityAssessmentTask = defineTask('genotoxicity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Genotoxicity assessment battery',
  agent: {
    name: 'genetic-toxicology-specialist',
    prompt: {
      role: 'Genetic toxicology specialist with expertise in nano-specific genotoxicity testing and OECD test guideline adaptations',
      task: `Perform genotoxicity assessment battery: ${args.testBattery.join(', ')}`,
      context: args,
      instructions: [
        'Adapt standard genotoxicity assays for nanomaterials',
        'Perform Ames test with nano-specific modifications',
        'Conduct in vitro micronucleus assay',
        'Execute comet assay for DNA damage',
        'Include positive and nano-relevant controls',
        'Assess direct vs oxidative DNA damage mechanisms',
        'Evaluate clastogenic and aneugenic potential',
        'Document any assay interference',
        'Interpret results with weight-of-evidence approach',
        'Assess relevance of positive findings'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testsPerformed', 'results', 'positiveFindings', 'mechanisticEvaluation'],
      properties: {
        testsPerformed: { type: 'array' },
        results: {
          type: 'object',
          properties: {
            amesTest: { type: 'object' },
            micronucleus: { type: 'object' },
            cometAssay: { type: 'object' }
          }
        },
        positiveFindings: { type: 'array' },
        mechanisticEvaluation: { type: 'object' },
        weightOfEvidence: { type: 'object' },
        classification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'genotoxicity']
}));

export const ecotoxicologyAssessmentTask = defineTask('ecotoxicology-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ecotoxicology assessment',
  agent: {
    name: 'ecotoxicology-specialist',
    prompt: {
      role: 'Ecotoxicologist specializing in nanomaterial environmental hazard assessment per OECD test guidelines',
      task: `Perform ecotoxicology assessment for environmental compartments: ${args.environmentalCompartments.join(', ')}`,
      context: args,
      instructions: [
        'Select appropriate test organisms per compartment',
        'Adapt OECD TGs for nanomaterial testing',
        'Perform algae growth inhibition test',
        'Conduct Daphnia acute/chronic tests',
        'Execute fish acute toxicity test if required',
        'Test soil organisms if terrestrial release expected',
        'Address nano-specific exposure considerations',
        'Determine EC50, LC50, NOEC values',
        'Derive PNEC values with appropriate assessment factors',
        'Develop species sensitivity distribution',
        'Assess bioaccumulation potential'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testsPerformed', 'toxicityData', 'pnecValues', 'speciesSensitivityDistribution'],
      properties: {
        testsPerformed: { type: 'array' },
        toxicityData: {
          type: 'object',
          properties: {
            algae: { type: 'object' },
            daphnia: { type: 'object' },
            fish: { type: 'object' },
            soilOrganisms: { type: 'object' }
          }
        },
        pnecValues: {
          type: 'object',
          properties: {
            aquatic: { type: 'number' },
            soil: { type: 'number' },
            sediment: { type: 'number' },
            stp: { type: 'number' }
          }
        },
        speciesSensitivityDistribution: { type: 'object' },
        bioaccumulationData: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'ecotoxicology']
}));

export const environmentalFateModelingTask = defineTask('environmental-fate-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Environmental fate and transport modeling',
  agent: {
    name: 'environmental-fate-specialist',
    prompt: {
      role: 'Environmental fate modeler specializing in nanomaterial transport, transformation, and multimedia distribution',
      task: `Model environmental fate for ${args.nanomaterial.name} under exposure scenarios: ${args.exposureScenarios.join(', ')}`,
      context: args,
      instructions: [
        'Model release pathways and quantities',
        'Simulate transport in environmental media',
        'Account for nano-specific processes (aggregation, dissolution)',
        'Model transformation processes (sulfidation, oxidation, coating degradation)',
        'Estimate environmental concentrations (PECs)',
        'Assess persistence in different compartments',
        'Evaluate bioavailability and uptake potential',
        'Model bioaccumulation using nano-specific factors',
        'Perform sensitivity analysis on key parameters',
        'Estimate steady-state distributions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['transportModel', 'transformations', 'bioaccumulation', 'persistence', 'distribution'],
      properties: {
        transportModel: { type: 'object' },
        transformations: { type: 'object' },
        bioaccumulation: { type: 'object' },
        persistence: { type: 'object' },
        distribution: { type: 'object' },
        pecValues: { type: 'object' },
        modelUncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'environmental-fate']
}));

export const exposureAssessmentTask = defineTask('exposure-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Comprehensive exposure assessment',
  agent: {
    name: 'exposure-assessment-specialist',
    prompt: {
      role: 'Exposure scientist specializing in nanomaterial exposure assessment across occupational, consumer, and environmental scenarios',
      task: `Assess exposure for scenarios: ${args.exposureScenarios.join(', ')} in ${args.applicationContext} context`,
      context: args,
      instructions: [
        'Identify all relevant exposure pathways',
        'Model occupational exposure (inhalation, dermal)',
        'Estimate consumer exposure by route',
        'Calculate environmental exposure to humans',
        'Account for nano-specific exposure factors',
        'Apply appropriate exposure models (ECETOC TRA, ConsExpo)',
        'Estimate aggregate exposure across pathways',
        'Identify dominant exposure contributors',
        'Perform exposure variability analysis',
        'Document exposure assumptions and uncertainties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarioDetails', 'dominantPathway', 'maxExposure', 'aggregateExposure'],
      properties: {
        scenarioDetails: { type: 'object' },
        dominantPathway: { type: 'string' },
        maxExposure: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string' },
            route: { type: 'string' }
          }
        },
        aggregateExposure: { type: 'object' },
        exposureByRoute: { type: 'object' },
        uncertaintyAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'exposure']
}));

export const riskCharacterizationTask = defineTask('risk-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk characterization',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Risk assessment specialist with expertise in nanomaterial risk characterization and regulatory toxicology',
      task: 'Characterize risks by integrating hazard and exposure data across all scenarios',
      context: args,
      instructions: [
        'Derive DNEL/DMEL values from hazard data',
        'Apply appropriate assessment factors for nanomaterials',
        'Calculate risk characterization ratios (RCR)',
        'Assess risks for each exposure scenario',
        'Identify scenarios with acceptable/unacceptable risk',
        'Perform sensitivity analysis on key assumptions',
        'Quantify uncertainty in risk estimates',
        'Identify risk drivers and critical endpoints',
        'Determine if risk refinement needed',
        'Summarize overall risk profile'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['dnelValues', 'riskQuotients', 'safetyMargins', 'criticalEndpoints'],
      properties: {
        dnelValues: { type: 'object' },
        riskQuotients: { type: 'object' },
        safetyMargins: { type: 'object' },
        criticalEndpoints: { type: 'array' },
        acceptableScenarios: { type: 'array' },
        borderlineScenarios: { type: 'array' },
        requiresRefinement: { type: 'boolean' },
        refinementRecommendations: { type: 'array' },
        sensitivityAnalysis: { type: 'object' },
        uncertaintyAnalysis: { type: 'object' },
        scenarioDetails: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'risk-assessment']
}));

export const riskRefinementTask = defineTask('risk-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk refinement - Iteration ${args.iteration}`,
  agent: {
    name: 'risk-refinement-specialist',
    prompt: {
      role: 'Risk assessment specialist with expertise in exposure refinement and higher-tier hazard assessment',
      task: `Refine risk assessment using strategy: ${args.refinementStrategy}`,
      context: args,
      instructions: [
        'Identify most impactful refinement approach',
        'Gather more specific exposure data if available',
        'Apply higher-tier exposure models',
        'Incorporate measured exposure data',
        'Refine hazard assessment with additional data',
        'Reduce assessment factor uncertainty',
        'Update risk characterization',
        'Document refinement rationale and impact'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['refinementApplied', 'updatedExposureData', 'updatedHazardData'],
      properties: {
        refinementApplied: { type: 'string' },
        updatedExposureData: { type: 'object' },
        updatedHazardData: { type: 'object' },
        impactOnRisk: { type: 'object' },
        remainingUncertainties: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'risk-refinement']
}));

export const riskManagementTask = defineTask('risk-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop risk management measures',
  agent: {
    name: 'risk-management-specialist',
    prompt: {
      role: 'Occupational hygiene and risk management specialist with expertise in nanomaterial control strategies',
      task: 'Develop comprehensive risk management measures based on risk assessment results',
      context: args,
      instructions: [
        'Identify risk reduction requirements',
        'Apply hierarchy of controls',
        'Specify engineering controls (ventilation, containment)',
        'Define administrative controls and procedures',
        'Select appropriate PPE for nanomaterials',
        'Propose occupational exposure limits (OEL)',
        'Develop environmental emission controls',
        'Define monitoring requirements',
        'Create emergency response procedures',
        'Document risk management effectiveness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'controlHierarchy', 'proposedOEL'],
      properties: {
        measures: { type: 'array' },
        controlHierarchy: { type: 'object' },
        proposedOEL: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string' },
            basis: { type: 'string' }
          }
        },
        engineeringControls: { type: 'array' },
        administrativeControls: { type: 'array' },
        ppeRequirements: { type: 'object' },
        monitoringPlan: { type: 'object' },
        effectivenessMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'risk-management']
}));

export const regulatoryDossierCompilationTask = defineTask('regulatory-dossier-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile regulatory dossier',
  agent: {
    name: 'regulatory-affairs-specialist',
    prompt: {
      role: 'Regulatory affairs specialist with expertise in nanomaterial registration under REACH, TSCA, and international frameworks',
      task: `Compile regulatory dossier for frameworks: ${args.regulatoryFrameworks.join(', ')}`,
      context: args,
      instructions: [
        'Structure dossier per regulatory requirements',
        'Compile physicochemical characterization section',
        'Organize toxicological data package',
        'Include ecotoxicological data',
        'Document environmental fate information',
        'Present exposure assessment',
        'Include risk characterization',
        'Document risk management measures',
        'Prepare chemical safety report (CSR) if required',
        'Address nano-specific information requirements',
        'Ensure IUCLID/other format compliance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['dossierSections', 'complianceChecklist', 'frameworkSpecificElements'],
      properties: {
        dossierSections: { type: 'object' },
        complianceChecklist: { type: 'object' },
        frameworkSpecificElements: { type: 'object' },
        chemicalSafetyReport: { type: 'object' },
        dataWaivers: { type: 'array' },
        readAcrossJustifications: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'regulatory']
}));

export const dossierValidationTask = defineTask('dossier-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate regulatory dossier completeness',
  agent: {
    name: 'dossier-validation-specialist',
    prompt: {
      role: 'Regulatory compliance specialist with expertise in dossier quality review and completeness assessment',
      task: 'Validate dossier completeness against regulatory requirements',
      context: args,
      instructions: [
        'Check completeness against framework requirements',
        'Verify data quality and reliability scoring',
        'Assess study adequacy and relevance',
        'Identify information gaps',
        'Evaluate read-across and QSAR appropriateness',
        'Check nano-specific requirements coverage',
        'Assess exposure scenario completeness',
        'Verify risk management documentation',
        'Generate compliance status by framework',
        'Recommend gap closure strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'complianceStatus', 'frameworkCoverage'],
      properties: {
        complete: { type: 'boolean' },
        complianceStatus: { type: 'object' },
        frameworkCoverage: { type: 'object' },
        missingElements: { type: 'array' },
        dataQualityIssues: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'validation']
}));

export const safeHandlingGuidelinesTask = defineTask('safe-handling-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop safe handling guidelines',
  agent: {
    name: 'occupational-safety-specialist',
    prompt: {
      role: 'Occupational health and safety specialist with expertise in nanomaterial handling procedures and SDS development',
      task: 'Develop comprehensive safe handling guidelines and safety data sheet',
      context: args,
      instructions: [
        'Compile hazard identification information',
        'Define safe handling procedures',
        'Specify storage requirements',
        'Detail PPE requirements with nano-specific guidance',
        'Describe engineering control requirements',
        'Define exposure monitoring procedures',
        'Create emergency procedures (spill, exposure, fire)',
        'Specify first aid measures',
        'Define disposal requirements',
        'Prepare GHS-compliant safety data sheet',
        'Include nano-specific hazard communication'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['occupationalControls', 'ppe', 'engineeringControls', 'emergencyProcedures', 'sdsContent'],
      properties: {
        occupationalControls: { type: 'object' },
        ppe: {
          type: 'object',
          properties: {
            respiratory: { type: 'object' },
            skin: { type: 'object' },
            eye: { type: 'object' }
          }
        },
        engineeringControls: { type: 'array' },
        emergencyProcedures: { type: 'object' },
        disposalGuidelines: { type: 'object' },
        sdsContent: { type: 'object' },
        trainingRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'safety', 'handling-guidelines']
}));
