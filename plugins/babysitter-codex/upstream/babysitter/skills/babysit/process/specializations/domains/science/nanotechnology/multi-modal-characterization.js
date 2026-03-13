/**
 * @process specializations/domains/science/nanotechnology/multi-modal-characterization
 * @description Multi-Modal Nanomaterial Characterization Pipeline - Execute comprehensive characterization workflows
 * combining electron microscopy (TEM/SEM), spectroscopy (XPS, Raman, UV-Vis), particle sizing (DLS),
 * and thermal analysis with automated data collection, cross-validation between methods, and quality gates
 * for measurement uncertainty.
 * @inputs { nanomaterial: object, characterizationGoals: array, samplePreparation?: object }
 * @outputs { success: boolean, characterizationResults: object, crossValidation: object, qualityMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/multi-modal-characterization', {
 *   nanomaterial: { type: 'gold-nanoparticles', expectedSize: 15, units: 'nm' },
 *   characterizationGoals: ['size-distribution', 'surface-chemistry', 'optical-properties'],
 *   samplePreparation: { dispersionMedium: 'water', concentration: '1mg/mL' }
 * });
 *
 * @references
 * - Electron Microscopy of Nanomaterials: https://www.sciencedirect.com/topics/materials-science/transmission-electron-microscopy
 * - Scanning Probe Microscopy for Nanoscience: https://www.nature.com/articles/nnano.2007.300
 * - X-ray Techniques for Nanomaterial Characterization: https://www.sciencedirect.com/topics/engineering/x-ray-diffraction-analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    nanomaterial,
    characterizationGoals,
    samplePreparation = {},
    crossValidationRequired = true,
    uncertaintyThreshold = 0.15
  } = inputs;

  // Phase 1: Characterization Planning
  const characterizationPlan = await ctx.task(characterizationPlanningTask, {
    nanomaterial,
    characterizationGoals,
    samplePreparation
  });

  // Breakpoint: Review characterization plan
  await ctx.breakpoint({
    question: `Review characterization plan for ${nanomaterial.type}. ${characterizationPlan.techniques.length} techniques selected. Approve to proceed?`,
    title: 'Characterization Plan Review',
    context: {
      runId: ctx.runId,
      nanomaterial,
      techniques: characterizationPlan.techniques,
      estimatedTime: characterizationPlan.estimatedTime,
      files: [{
        path: 'artifacts/characterization-plan.json',
        format: 'json',
        content: characterizationPlan
      }]
    }
  });

  // Phase 2: Sample Preparation Protocol
  const samplePrepProtocol = await ctx.task(samplePreparationTask, {
    nanomaterial,
    techniques: characterizationPlan.techniques,
    samplePreparation
  });

  // Phase 3: Execute Characterization Techniques
  const characterizationResults = {};

  // 3a: Electron Microscopy (TEM/SEM)
  if (characterizationPlan.techniques.includes('electron-microscopy')) {
    const emResults = await ctx.task(electronMicroscopyTask, {
      nanomaterial,
      samplePrepProtocol,
      imagingParameters: characterizationPlan.emParameters
    });
    characterizationResults.electronMicroscopy = emResults;
  }

  // 3b: Spectroscopy (XPS, Raman, UV-Vis)
  if (characterizationPlan.techniques.includes('spectroscopy')) {
    const spectroscopyResults = await ctx.task(spectroscopyTask, {
      nanomaterial,
      samplePrepProtocol,
      spectroscopyMethods: characterizationPlan.spectroscopyMethods
    });
    characterizationResults.spectroscopy = spectroscopyResults;
  }

  // 3c: Particle Sizing (DLS, NTA)
  if (characterizationPlan.techniques.includes('particle-sizing')) {
    const sizingResults = await ctx.task(particleSizingTask, {
      nanomaterial,
      samplePrepProtocol,
      sizingMethods: characterizationPlan.sizingMethods
    });
    characterizationResults.particleSizing = sizingResults;
  }

  // 3d: Thermal Analysis (TGA, DSC)
  if (characterizationPlan.techniques.includes('thermal-analysis')) {
    const thermalResults = await ctx.task(thermalAnalysisTask, {
      nanomaterial,
      samplePrepProtocol,
      thermalMethods: characterizationPlan.thermalMethods
    });
    characterizationResults.thermalAnalysis = thermalResults;
  }

  // 3e: Surface Analysis (Zeta potential, BET)
  if (characterizationPlan.techniques.includes('surface-analysis')) {
    const surfaceResults = await ctx.task(surfaceAnalysisTask, {
      nanomaterial,
      samplePrepProtocol,
      surfaceMethods: characterizationPlan.surfaceMethods
    });
    characterizationResults.surfaceAnalysis = surfaceResults;
  }

  // Phase 4: Cross-Validation Analysis
  let crossValidation = null;
  if (crossValidationRequired) {
    crossValidation = await ctx.task(crossValidationTask, {
      characterizationResults,
      nanomaterial,
      uncertaintyThreshold
    });

    // Quality Gate: Cross-validation must pass
    if (!crossValidation.validated) {
      await ctx.breakpoint({
        question: `Cross-validation issues detected: ${crossValidation.discrepancies.length} discrepancies. Review and determine resolution?`,
        title: 'Cross-Validation Warning',
        context: {
          runId: ctx.runId,
          discrepancies: crossValidation.discrepancies,
          recommendations: crossValidation.recommendations
        }
      });
    }
  }

  // Phase 5: Uncertainty Quantification
  const uncertaintyAnalysis = await ctx.task(uncertaintyQuantificationTask, {
    characterizationResults,
    crossValidation,
    uncertaintyThreshold
  });

  // Phase 6: Results Integration and Reporting
  const integratedReport = await ctx.task(resultsIntegrationTask, {
    nanomaterial,
    characterizationGoals,
    characterizationResults,
    crossValidation,
    uncertaintyAnalysis
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `Characterization complete. ${Object.keys(characterizationResults).length} techniques executed. Overall uncertainty: ${uncertaintyAnalysis.overallUncertainty}. Approve results?`,
    title: 'Characterization Results Approval',
    context: {
      runId: ctx.runId,
      nanomaterial,
      summaryMetrics: integratedReport.summaryMetrics,
      files: [
        { path: 'artifacts/characterization-report.md', format: 'markdown', content: integratedReport.markdown },
        { path: 'artifacts/characterization-data.json', format: 'json', content: characterizationResults }
      ]
    }
  });

  return {
    success: true,
    characterizationResults,
    crossValidation,
    uncertaintyAnalysis,
    qualityMetrics: {
      techniquesExecuted: Object.keys(characterizationResults).length,
      crossValidated: crossValidation?.validated ?? false,
      overallUncertainty: uncertaintyAnalysis.overallUncertainty,
      meetsQualityGates: uncertaintyAnalysis.overallUncertainty <= uncertaintyThreshold
    },
    report: integratedReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/multi-modal-characterization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const characterizationPlanningTask = defineTask('characterization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan characterization for ${args.nanomaterial.type}`,
  agent: {
    name: 'characterization-scientist',
    prompt: {
      role: 'Senior Nanomaterial Characterization Scientist',
      task: 'Develop comprehensive characterization plan based on material type and goals',
      context: args,
      instructions: [
        '1. Analyze characterization goals and determine required measurements',
        '2. Select appropriate techniques for each property of interest',
        '3. Determine technique sequence based on sample requirements',
        '4. Identify sample preparation needs for each technique',
        '5. Plan cross-validation between complementary methods',
        '6. Estimate measurement time and resource requirements',
        '7. Define quality metrics and acceptance criteria',
        '8. Identify potential measurement challenges',
        '9. Plan data integration approach',
        '10. Document technique-specific parameters'
      ],
      outputFormat: 'JSON object with characterization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'sequence', 'estimatedTime'],
      properties: {
        techniques: { type: 'array', items: { type: 'string' } },
        sequence: { type: 'array', items: { type: 'object' } },
        emParameters: { type: 'object' },
        spectroscopyMethods: { type: 'array' },
        sizingMethods: { type: 'array' },
        thermalMethods: { type: 'array' },
        surfaceMethods: { type: 'array' },
        estimatedTime: { type: 'string' },
        qualityMetrics: { type: 'object' },
        challenges: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'planning']
}));

export const samplePreparationTask = defineTask('sample-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sample preparation protocol',
  agent: {
    name: 'sample-preparation-specialist',
    prompt: {
      role: 'Sample Preparation Specialist for Nanomaterials',
      task: 'Design sample preparation protocols for each characterization technique',
      context: args,
      instructions: [
        '1. Define sample requirements for each technique',
        '2. Design grid preparation for TEM/SEM',
        '3. Specify dispersion protocols for DLS measurements',
        '4. Define substrate requirements for spectroscopy',
        '5. Establish sample handling and storage procedures',
        '6. Address contamination prevention measures',
        '7. Define sample labeling and tracking system',
        '8. Estimate sample quantities needed',
        '9. Document any sample modifications needed',
        '10. Address technique-specific artifacts to avoid'
      ],
      outputFormat: 'JSON object with sample preparation protocols'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'sampleQuantities'],
      properties: {
        protocols: { type: 'object' },
        sampleQuantities: { type: 'object' },
        storageConditions: { type: 'object' },
        handlingProcedures: { type: 'array' },
        contaminationPrevention: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'sample-preparation']
}));

export const electronMicroscopyTask = defineTask('electron-microscopy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute electron microscopy characterization',
  agent: {
    name: 'electron-microscopist',
    prompt: {
      role: 'Expert Electron Microscopist',
      task: 'Execute TEM/SEM characterization and analyze results',
      context: args,
      instructions: [
        '1. Define imaging conditions (accelerating voltage, beam current)',
        '2. Specify magnification ranges for overview and high-resolution imaging',
        '3. Plan imaging locations for statistical sampling',
        '4. Execute bright field and dark field imaging as needed',
        '5. Perform selected area electron diffraction (SAED) if crystallinity important',
        '6. Collect EDS/EELS data for compositional analysis',
        '7. Analyze particle morphology and size from images',
        '8. Assess aggregation state and dispersion quality',
        '9. Document imaging artifacts and their sources',
        '10. Calculate size statistics from image analysis'
      ],
      outputFormat: 'JSON object with electron microscopy results'
    },
    outputSchema: {
      type: 'object',
      required: ['sizeDistribution', 'morphology', 'imageAnalysis'],
      properties: {
        sizeDistribution: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            standardDeviation: { type: 'number' },
            particleCount: { type: 'number' }
          }
        },
        morphology: { type: 'object' },
        crystallinity: { type: 'object' },
        composition: { type: 'object' },
        imageAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'electron-microscopy']
}));

export const spectroscopyTask = defineTask('spectroscopy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute spectroscopic characterization',
  agent: {
    name: 'spectroscopist',
    prompt: {
      role: 'Spectroscopy Specialist for Nanomaterials',
      task: 'Execute spectroscopic measurements and analyze surface chemistry and optical properties',
      context: args,
      instructions: [
        '1. Execute UV-Vis spectroscopy for optical properties',
        '2. Analyze surface plasmon resonance features if applicable',
        '3. Perform XPS for surface composition and chemical states',
        '4. Execute Raman spectroscopy for molecular fingerprinting',
        '5. Perform FTIR for functional group identification',
        '6. Analyze peak positions, intensities, and widths',
        '7. Correlate spectral features with material properties',
        '8. Identify surface contamination or modification',
        '9. Compare with reference spectra',
        '10. Quantify surface chemistry where possible'
      ],
      outputFormat: 'JSON object with spectroscopy results'
    },
    outputSchema: {
      type: 'object',
      required: ['opticalProperties', 'surfaceChemistry'],
      properties: {
        opticalProperties: {
          type: 'object',
          properties: {
            absorptionPeaks: { type: 'array' },
            bandgap: { type: 'number' },
            plasmonResonance: { type: 'object' }
          }
        },
        surfaceChemistry: {
          type: 'object',
          properties: {
            elementalComposition: { type: 'object' },
            chemicalStates: { type: 'object' },
            functionalGroups: { type: 'array' }
          }
        },
        ramanAnalysis: { type: 'object' },
        ftirAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'spectroscopy']
}));

export const particleSizingTask = defineTask('particle-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute particle sizing analysis',
  agent: {
    name: 'particle-sizing-expert',
    prompt: {
      role: 'Particle Sizing Specialist',
      task: 'Execute DLS, NTA, and other sizing methods for particle size distribution',
      context: args,
      instructions: [
        '1. Prepare samples at appropriate concentrations for DLS',
        '2. Execute DLS measurements with proper equilibration',
        '3. Analyze intensity, volume, and number distributions',
        '4. Calculate hydrodynamic diameter and polydispersity index',
        '5. Perform NTA for particle concentration if needed',
        '6. Assess aggregation and stability during measurement',
        '7. Compare results from multiple sizing methods',
        '8. Analyze correlation functions for data quality',
        '9. Document measurement conditions and parameters',
        '10. Calculate measurement uncertainty'
      ],
      outputFormat: 'JSON object with particle sizing results'
    },
    outputSchema: {
      type: 'object',
      required: ['dlsResults', 'sizeDistribution'],
      properties: {
        dlsResults: {
          type: 'object',
          properties: {
            zAverage: { type: 'number' },
            polydispersityIndex: { type: 'number' },
            intensityDistribution: { type: 'object' },
            volumeDistribution: { type: 'object' },
            numberDistribution: { type: 'object' }
          }
        },
        ntaResults: { type: 'object' },
        sizeDistribution: { type: 'object' },
        dataQuality: { type: 'object' },
        uncertainty: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'particle-sizing']
}));

export const thermalAnalysisTask = defineTask('thermal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute thermal analysis',
  agent: {
    name: 'thermal-analyst',
    prompt: {
      role: 'Thermal Analysis Specialist',
      task: 'Execute TGA, DSC, and other thermal methods for stability and composition',
      context: args,
      instructions: [
        '1. Execute TGA for mass loss and decomposition analysis',
        '2. Perform DSC for phase transitions and thermal events',
        '3. Analyze organic content and coating thickness from TGA',
        '4. Identify decomposition temperatures and mechanisms',
        '5. Determine moisture and volatile content',
        '6. Assess thermal stability for applications',
        '7. Compare with reference materials',
        '8. Analyze kinetics of thermal events if needed',
        '9. Document atmosphere and heating rate effects',
        '10. Calculate composition from thermal data'
      ],
      outputFormat: 'JSON object with thermal analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['tgaResults', 'thermalStability'],
      properties: {
        tgaResults: {
          type: 'object',
          properties: {
            massLoss: { type: 'array' },
            decompositionTemperatures: { type: 'array' },
            residualMass: { type: 'number' }
          }
        },
        dscResults: { type: 'object' },
        thermalStability: { type: 'object' },
        composition: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'thermal-analysis']
}));

export const surfaceAnalysisTask = defineTask('surface-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute surface analysis',
  agent: {
    name: 'surface-scientist',
    prompt: {
      role: 'Surface Science Specialist',
      task: 'Execute zeta potential, BET surface area, and other surface characterization',
      context: args,
      instructions: [
        '1. Measure zeta potential for colloidal stability assessment',
        '2. Perform pH titration for isoelectric point determination',
        '3. Execute BET analysis for surface area measurement',
        '4. Analyze pore size distribution if applicable',
        '5. Assess surface charge as function of pH and ionic strength',
        '6. Correlate surface properties with dispersion stability',
        '7. Measure surface energy if relevant',
        '8. Document sample preparation effects on measurements',
        '9. Compare with expected values from composition',
        '10. Calculate surface site density if applicable'
      ],
      outputFormat: 'JSON object with surface analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['zetaPotential', 'surfaceProperties'],
      properties: {
        zetaPotential: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            pH: { type: 'number' },
            isoelectricPoint: { type: 'number' }
          }
        },
        betSurfaceArea: { type: 'number' },
        poreAnalysis: { type: 'object' },
        surfaceProperties: { type: 'object' },
        colloidalStability: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'surface-analysis']
}));

export const crossValidationTask = defineTask('cross-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform cross-validation analysis',
  agent: {
    name: 'data-validation-scientist',
    prompt: {
      role: 'Data Validation Scientist',
      task: 'Cross-validate results from multiple characterization techniques',
      context: args,
      instructions: [
        '1. Compare size measurements from TEM and DLS',
        '2. Correlate composition data from XPS and EDS',
        '3. Validate optical properties with size data',
        '4. Check consistency of surface chemistry measurements',
        '5. Identify discrepancies between methods',
        '6. Analyze sources of measurement differences',
        '7. Determine which method is most reliable for each property',
        '8. Calculate agreement metrics between methods',
        '9. Flag results requiring re-measurement',
        '10. Provide recommendations for resolving discrepancies'
      ],
      outputFormat: 'JSON object with cross-validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'comparisons', 'discrepancies'],
      properties: {
        validated: { type: 'boolean' },
        comparisons: { type: 'array', items: { type: 'object' } },
        discrepancies: { type: 'array', items: { type: 'object' } },
        agreementMetrics: { type: 'object' },
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

export const uncertaintyQuantificationTask = defineTask('uncertainty-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify measurement uncertainty',
  agent: {
    name: 'metrologist',
    prompt: {
      role: 'Nanometrology Specialist',
      task: 'Quantify measurement uncertainty for all characterization results',
      context: args,
      instructions: [
        '1. Identify sources of uncertainty for each measurement',
        '2. Calculate Type A (statistical) uncertainty components',
        '3. Estimate Type B (systematic) uncertainty components',
        '4. Combine uncertainty components appropriately',
        '5. Calculate expanded uncertainty with coverage factor',
        '6. Assess uncertainty contributions from sample preparation',
        '7. Evaluate instrument-specific uncertainty contributions',
        '8. Compare with metrological reference values if available',
        '9. Calculate overall measurement uncertainty',
        '10. Provide recommendations for reducing uncertainty'
      ],
      outputFormat: 'JSON object with uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallUncertainty', 'uncertaintyBudget'],
      properties: {
        overallUncertainty: { type: 'number' },
        uncertaintyBudget: { type: 'object' },
        uncertaintyByTechnique: { type: 'object' },
        coverageFactor: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'uncertainty']
}));

export const resultsIntegrationTask = defineTask('results-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate and report characterization results',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer for Nanomaterial Characterization',
      task: 'Integrate all characterization results into comprehensive report',
      context: args,
      instructions: [
        '1. Create executive summary of characterization findings',
        '2. Compile all measurement results with uncertainties',
        '3. Generate summary tables and visualizations',
        '4. Document cross-validation results and conclusions',
        '5. Compare results with specifications or targets',
        '6. Highlight key material properties and features',
        '7. Document any anomalies or unexpected findings',
        '8. Provide recommendations for further characterization',
        '9. Generate both technical and summary reports',
        '10. Create data package for archival'
      ],
      outputFormat: 'JSON object with integrated report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'summaryMetrics', 'dataPackage'],
      properties: {
        markdown: { type: 'string' },
        summaryMetrics: { type: 'object' },
        technicalReport: { type: 'object' },
        dataPackage: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'characterization', 'reporting']
}));
