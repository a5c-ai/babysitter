/**
 * @process domains/science/materials-science/xrd-analysis
 * @description XRD Analysis & Phase Identification - Conduct X-ray diffraction analysis for crystal structure
 * determination, phase identification, and crystallographic parameter refinement using Rietveld methods.
 * @inputs { sampleId: string, diffractogramPath?: string, targetPhases?: array, refinementMethod?: string }
 * @outputs { success: boolean, phases: array, crystallographicParams: object, refinementQuality: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/xrd-analysis', {
 *   sampleId: 'SAMPLE-001',
 *   diffractogramPath: '/data/xrd/sample001.xy',
 *   targetPhases: ['alpha-Al2O3', 'gamma-Al2O3'],
 *   refinementMethod: 'rietveld'
 * });
 *
 * @references
 * - GSAS-II: https://subversion.xray.aps.anl.gov/trac/pyGSAS
 * - HighScore Plus: https://www.malvernpanalytical.com/en/products/category/software/x-ray-diffraction-software/highscore
 * - ICDD PDF Database: https://www.icdd.com/
 * - Rietveld Method: https://www.iucr.org/resources/commissions/powder-diffraction/rietveld-refinement
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    diffractogramPath = null,
    targetPhases = [],
    refinementMethod = 'rietveld',
    instrumentParams = {},
    peakFittingMethod = 'pseudo-voigt',
    backgroundCorrection = 'polynomial',
    twoThetaRange = { min: 10, max: 90 },
    wavelength = 1.5406, // Cu K-alpha
    outputDir = 'xrd-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting XRD Analysis for sample: ${sampleId}`);

  // Phase 1: Data Loading and Preprocessing
  ctx.log('info', 'Phase 1: Loading diffractogram data and preprocessing');
  const dataPreprocessing = await ctx.task(dataPreprocessingTask, {
    sampleId,
    diffractogramPath,
    backgroundCorrection,
    twoThetaRange,
    wavelength,
    outputDir
  });

  if (!dataPreprocessing.success) {
    return {
      success: false,
      error: 'Data preprocessing failed',
      details: dataPreprocessing,
      metadata: { processId: 'domains/science/materials-science/xrd-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...dataPreprocessing.artifacts);

  // Phase 2: Peak Detection and Indexing
  ctx.log('info', 'Phase 2: Detecting and indexing peaks');
  const peakDetection = await ctx.task(peakDetectionTask, {
    sampleId,
    preprocessedData: dataPreprocessing.preprocessedData,
    peakFittingMethod,
    wavelength,
    outputDir
  });

  artifacts.push(...peakDetection.artifacts);

  // Phase 3: Phase Identification
  ctx.log('info', 'Phase 3: Identifying crystalline phases');
  const phaseIdentification = await ctx.task(phaseIdentificationTask, {
    sampleId,
    peakList: peakDetection.peaks,
    targetPhases,
    wavelength,
    outputDir
  });

  artifacts.push(...phaseIdentification.artifacts);

  // Breakpoint: Review phase identification results
  await ctx.breakpoint({
    question: `Phase identification complete for ${sampleId}. Found ${phaseIdentification.identifiedPhases.length} phases: ${phaseIdentification.identifiedPhases.map(p => p.name).join(', ')}. Proceed with refinement?`,
    title: 'Phase Identification Review',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        phasesFound: phaseIdentification.identifiedPhases.length,
        phases: phaseIdentification.identifiedPhases,
        matchQuality: phaseIdentification.overallMatchQuality,
        unindexedPeaks: peakDetection.peaks.length - phaseIdentification.indexedPeakCount
      },
      files: phaseIdentification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Crystallographic Refinement
  ctx.log('info', 'Phase 4: Performing crystallographic refinement');
  const refinement = await ctx.task(refinementTask, {
    sampleId,
    identifiedPhases: phaseIdentification.identifiedPhases,
    diffractogramData: dataPreprocessing.preprocessedData,
    refinementMethod,
    instrumentParams,
    outputDir
  });

  artifacts.push(...refinement.artifacts);

  // Phase 5: Quantitative Phase Analysis
  ctx.log('info', 'Phase 5: Performing quantitative phase analysis');
  const quantitativeAnalysis = await ctx.task(quantitativeAnalysisTask, {
    sampleId,
    refinementResults: refinement,
    identifiedPhases: phaseIdentification.identifiedPhases,
    outputDir
  });

  artifacts.push(...quantitativeAnalysis.artifacts);

  // Phase 6: Microstructural Analysis
  ctx.log('info', 'Phase 6: Analyzing microstructural parameters');
  const microstructuralAnalysis = await ctx.task(microstructuralAnalysisTask, {
    sampleId,
    refinementResults: refinement,
    peakProfiles: peakDetection.peakProfiles,
    wavelength,
    outputDir
  });

  artifacts.push(...microstructuralAnalysis.artifacts);

  // Phase 7: Report Generation
  ctx.log('info', 'Phase 7: Generating XRD analysis report');
  const report = await ctx.task(xrdReportTask, {
    sampleId,
    dataPreprocessing,
    peakDetection,
    phaseIdentification,
    refinement,
    quantitativeAnalysis,
    microstructuralAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `XRD analysis complete for ${sampleId}. Refinement Rwp: ${refinement.rwp.toFixed(2)}%, GoF: ${refinement.gof.toFixed(2)}. Review final results?`,
    title: 'XRD Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        phases: phaseIdentification.identifiedPhases.map(p => ({
          name: p.name,
          weightPercent: quantitativeAnalysis.phaseComposition[p.name]
        })),
        refinementQuality: {
          rwp: refinement.rwp,
          rexp: refinement.rexp,
          gof: refinement.gof
        },
        crystalliteSize: microstructuralAnalysis.averageCrystalliteSize,
        microstrain: microstructuralAnalysis.averageMicrostrain
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    phases: phaseIdentification.identifiedPhases,
    phaseComposition: quantitativeAnalysis.phaseComposition,
    crystallographicParams: refinement.crystallographicParams,
    refinementQuality: {
      rwp: refinement.rwp,
      rexp: refinement.rexp,
      gof: refinement.gof,
      chiSquared: refinement.chiSquared
    },
    microstructure: {
      crystalliteSize: microstructuralAnalysis.crystalliteSizes,
      microstrain: microstructuralAnalysis.microstrains,
      averageCrystalliteSize: microstructuralAnalysis.averageCrystalliteSize,
      averageMicrostrain: microstructuralAnalysis.averageMicrostrain
    },
    peakAnalysis: {
      totalPeaks: peakDetection.peaks.length,
      indexedPeaks: phaseIdentification.indexedPeakCount,
      unindexedPeaks: peakDetection.peaks.length - phaseIdentification.indexedPeakCount
    },
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/xrd-analysis',
      timestamp: startTime,
      refinementMethod,
      wavelength,
      outputDir
    }
  };
}

// Task 1: Data Preprocessing
export const dataPreprocessingTask = defineTask('xrd-data-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: `XRD Data Preprocessing - ${args.sampleId}`,
  agent: {
    name: 'materials-scientist',
    prompt: {
      role: 'X-ray Diffraction Specialist',
      task: 'Load and preprocess XRD diffractogram data',
      context: args,
      instructions: [
        '1. Load raw diffractogram data from file (XY, RAW, XRDML formats)',
        '2. Validate data quality and completeness',
        '3. Apply background correction using specified method',
        '4. Perform smoothing if needed (Savitzky-Golay filter)',
        '5. Apply K-alpha2 stripping if necessary',
        '6. Normalize intensity data',
        '7. Trim data to specified 2-theta range',
        '8. Detect and handle any instrumental artifacts',
        '9. Calculate signal-to-noise ratio',
        '10. Export preprocessed data for analysis'
      ],
      outputFormat: 'JSON with preprocessing results and data quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preprocessedData', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        preprocessedData: { type: 'object' },
        dataQuality: {
          type: 'object',
          properties: {
            signalToNoise: { type: 'number' },
            peakIntensity: { type: 'number' },
            backgroundLevel: { type: 'number' }
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
  labels: ['agent', 'xrd', 'preprocessing', 'materials-science']
}));

// Task 2: Peak Detection
export const peakDetectionTask = defineTask('xrd-peak-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `XRD Peak Detection - ${args.sampleId}`,
  agent: {
    name: 'crystallographer',
    prompt: {
      role: 'Crystallography Expert',
      task: 'Detect and characterize diffraction peaks',
      context: args,
      instructions: [
        '1. Apply peak detection algorithm (derivative method, wavelet)',
        '2. Identify peak positions (2-theta values)',
        '3. Fit peak profiles using specified method (pseudo-Voigt, Pearson VII)',
        '4. Extract peak parameters (position, intensity, FWHM)',
        '5. Calculate d-spacings from peak positions',
        '6. Estimate peak asymmetry and shape parameters',
        '7. Identify overlapping peaks',
        '8. Calculate peak areas',
        '9. Assess peak quality and reliability',
        '10. Generate peak list with uncertainties'
      ],
      outputFormat: 'JSON with peak list and profile parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['peaks', 'peakProfiles', 'artifacts'],
      properties: {
        peaks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              twoTheta: { type: 'number' },
              dSpacing: { type: 'number' },
              intensity: { type: 'number' },
              fwhm: { type: 'number' },
              area: { type: 'number' }
            }
          }
        },
        peakProfiles: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'peak-detection', 'materials-science']
}));

// Task 3: Phase Identification
export const phaseIdentificationTask = defineTask('xrd-phase-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `XRD Phase Identification - ${args.sampleId}`,
  agent: {
    name: 'phase-analyst',
    prompt: {
      role: 'Phase Identification Specialist',
      task: 'Identify crystalline phases using database matching',
      context: args,
      instructions: [
        '1. Search ICDD PDF database for matching patterns',
        '2. Compare experimental peaks with reference patterns',
        '3. Calculate figure of merit (FOM) for matches',
        '4. Handle multiphasic samples systematically',
        '5. Consider target phases if specified',
        '6. Index peaks to identified phases',
        '7. Identify any unindexed peaks',
        '8. Assess phase identification confidence',
        '9. Consider solid solutions and substitutions',
        '10. Document phase identification rationale'
      ],
      outputFormat: 'JSON with identified phases and match quality'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedPhases', 'indexedPeakCount', 'overallMatchQuality', 'artifacts'],
      properties: {
        identifiedPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pdfNumber: { type: 'string' },
              spaceGroup: { type: 'string' },
              crystalSystem: { type: 'string' },
              matchScore: { type: 'number' }
            }
          }
        },
        indexedPeakCount: { type: 'number' },
        overallMatchQuality: { type: 'number' },
        unindexedPeaks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'phase-identification', 'materials-science']
}));

// Task 4: Crystallographic Refinement
export const refinementTask = defineTask('xrd-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Crystallographic Refinement - ${args.sampleId}`,
  agent: {
    name: 'rietveld-specialist',
    prompt: {
      role: 'Rietveld Refinement Expert',
      task: 'Perform crystallographic structure refinement',
      context: args,
      instructions: [
        '1. Set up refinement model with identified phases',
        '2. Define instrument parameters (zero shift, sample displacement)',
        '3. Refine background parameters',
        '4. Refine scale factors for each phase',
        '5. Refine lattice parameters systematically',
        '6. Refine peak profile parameters (U, V, W, X, Y)',
        '7. Refine atomic positions if appropriate',
        '8. Refine thermal parameters',
        '9. Calculate refinement statistics (Rwp, Rexp, GoF)',
        '10. Validate refinement quality and convergence'
      ],
      outputFormat: 'JSON with refinement results and quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['crystallographicParams', 'rwp', 'rexp', 'gof', 'artifacts'],
      properties: {
        crystallographicParams: {
          type: 'object',
          description: 'Refined lattice parameters per phase'
        },
        rwp: { type: 'number', description: 'Weighted profile R-factor' },
        rexp: { type: 'number', description: 'Expected R-factor' },
        gof: { type: 'number', description: 'Goodness of fit' },
        chiSquared: { type: 'number' },
        profileParams: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'rietveld', 'refinement', 'materials-science']
}));

// Task 5: Quantitative Phase Analysis
export const quantitativeAnalysisTask = defineTask('xrd-quantitative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quantitative Phase Analysis - ${args.sampleId}`,
  agent: {
    name: 'quantitative-analyst',
    prompt: {
      role: 'Quantitative XRD Analyst',
      task: 'Determine phase composition and weight fractions',
      context: args,
      instructions: [
        '1. Calculate weight fractions from refined scale factors',
        '2. Apply absorption corrections if needed',
        '3. Account for amorphous content if present',
        '4. Calculate uncertainties in phase fractions',
        '5. Validate mass balance',
        '6. Compare with expected composition',
        '7. Check for preferred orientation effects',
        '8. Apply microabsorption corrections if needed',
        '9. Report normalized and absolute weight percentages',
        '10. Document quantification methodology'
      ],
      outputFormat: 'JSON with phase composition and uncertainties'
    },
    outputSchema: {
      type: 'object',
      required: ['phaseComposition', 'artifacts'],
      properties: {
        phaseComposition: {
          type: 'object',
          description: 'Weight percent for each phase'
        },
        uncertainties: { type: 'object' },
        amorphousContent: { type: 'number' },
        massBalance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'quantitative', 'phase-analysis', 'materials-science']
}));

// Task 6: Microstructural Analysis
export const microstructuralAnalysisTask = defineTask('xrd-microstructural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Microstructural Analysis - ${args.sampleId}`,
  agent: {
    name: 'microstructure-analyst',
    prompt: {
      role: 'Microstructure Analysis Expert',
      task: 'Analyze crystallite size and microstrain from peak broadening',
      context: args,
      instructions: [
        '1. Separate instrumental and sample broadening',
        '2. Apply Williamson-Hall analysis for size-strain separation',
        '3. Calculate crystallite sizes using Scherrer equation',
        '4. Determine microstrain from peak broadening',
        '5. Consider anisotropic broadening if present',
        '6. Analyze peak shape for defect information',
        '7. Calculate dislocation density if appropriate',
        '8. Assess crystallinity and disorder',
        '9. Compare with independent measurements if available',
        '10. Report microstructural parameters with uncertainties'
      ],
      outputFormat: 'JSON with microstructural parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['crystalliteSizes', 'microstrains', 'averageCrystalliteSize', 'averageMicrostrain', 'artifacts'],
      properties: {
        crystalliteSizes: { type: 'object', description: 'Crystallite size per phase (nm)' },
        microstrains: { type: 'object', description: 'Microstrain per phase' },
        averageCrystalliteSize: { type: 'number' },
        averageMicrostrain: { type: 'number' },
        dislocationDensity: { type: 'object' },
        williamsonHallPlot: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'microstructure', 'crystallite-size', 'materials-science']
}));

// Task 7: Report Generation
export const xrdReportTask = defineTask('xrd-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `XRD Analysis Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Materials Science Technical Writer',
      task: 'Generate comprehensive XRD analysis report',
      context: args,
      instructions: [
        '1. Create executive summary of XRD analysis',
        '2. Document experimental conditions and parameters',
        '3. Present phase identification results with evidence',
        '4. Include diffractogram with peak assignments',
        '5. Report quantitative phase composition',
        '6. Present refinement quality metrics',
        '7. Document microstructural parameters',
        '8. Include crystallographic data tables',
        '9. Add interpretation and conclusions',
        '10. Generate publication-quality figures'
      ],
      outputFormat: 'JSON with report path and key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        dataTables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'xrd', 'report', 'documentation', 'materials-science']
}));
