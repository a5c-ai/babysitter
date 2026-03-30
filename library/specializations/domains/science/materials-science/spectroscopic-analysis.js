/**
 * @process domains/science/materials-science/spectroscopic-analysis
 * @description Spectroscopic Analysis Suite - Execute spectroscopy workflows (XPS, FTIR, Raman, NMR) for chemical
 * bonding, surface composition, and molecular structure analysis.
 * @inputs { sampleId: string, techniques: array, analysisGoals?: array }
 * @outputs { success: boolean, spectralData: object, chemicalAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/spectroscopic-analysis', {
 *   sampleId: 'SAMPLE-003',
 *   techniques: ['XPS', 'FTIR', 'Raman'],
 *   analysisGoals: ['surface-composition', 'functional-groups', 'phase-identification']
 * });
 *
 * @references
 * - XPS: https://www.thermofisher.com/us/en/home/industrial/spectroscopy-elemental-isotope-analysis/spectroscopy-elemental-isotope-analysis-learning-center/x-ray-photoelectron-spectroscopy-information.html
 * - FTIR: https://www.thermofisher.com/us/en/home/industrial/spectroscopy-elemental-isotope-analysis/spectroscopy-elemental-isotope-analysis-learning-center/molecular-spectroscopy-information/ftir-information.html
 * - Raman: https://www.horiba.com/int/scientific/technologies/raman-imaging-and-spectroscopy/
 * - NMR: https://www.bruker.com/en/products-and-solutions/mr/nmr.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    techniques = ['FTIR'],
    analysisGoals = ['chemical-identification'],
    xpsParams = {},
    ftirParams = {},
    ramanParams = {},
    nmrParams = {},
    outputDir = 'spectroscopy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const spectralResults = {};

  ctx.log('info', `Starting Spectroscopic Analysis Suite for sample: ${sampleId}`);
  ctx.log('info', `Techniques: ${techniques.join(', ')}`);

  // Phase 1: Sample Preparation Verification
  ctx.log('info', 'Phase 1: Verifying sample preparation for spectroscopy');
  const sampleVerification = await ctx.task(sampleVerificationTask, {
    sampleId,
    techniques,
    outputDir
  });

  artifacts.push(...sampleVerification.artifacts);

  // Phase 2: XPS Analysis (if requested)
  if (techniques.includes('XPS')) {
    ctx.log('info', 'Phase 2a: Performing XPS analysis');
    const xpsResult = await ctx.task(xpsAnalysisTask, {
      sampleId,
      params: xpsParams,
      outputDir
    });

    spectralResults.xps = xpsResult;
    artifacts.push(...xpsResult.artifacts);

    await ctx.breakpoint({
      question: `XPS analysis complete. Detected elements: ${xpsResult.detectedElements.join(', ')}. Review survey and high-resolution spectra?`,
      title: 'XPS Analysis Review',
      context: {
        runId: ctx.runId,
        summary: {
          detectedElements: xpsResult.detectedElements,
          surfaceComposition: xpsResult.surfaceComposition,
          chemicalStates: xpsResult.chemicalStates
        },
        files: xpsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 3: FTIR Analysis (if requested)
  if (techniques.includes('FTIR')) {
    ctx.log('info', 'Phase 2b: Performing FTIR analysis');
    const ftirResult = await ctx.task(ftirAnalysisTask, {
      sampleId,
      params: ftirParams,
      outputDir
    });

    spectralResults.ftir = ftirResult;
    artifacts.push(...ftirResult.artifacts);
  }

  // Phase 4: Raman Analysis (if requested)
  if (techniques.includes('Raman')) {
    ctx.log('info', 'Phase 2c: Performing Raman spectroscopy');
    const ramanResult = await ctx.task(ramanAnalysisTask, {
      sampleId,
      params: ramanParams,
      outputDir
    });

    spectralResults.raman = ramanResult;
    artifacts.push(...ramanResult.artifacts);
  }

  // Phase 5: NMR Analysis (if requested)
  if (techniques.includes('NMR')) {
    ctx.log('info', 'Phase 2d: Performing NMR analysis');
    const nmrResult = await ctx.task(nmrAnalysisTask, {
      sampleId,
      params: nmrParams,
      outputDir
    });

    spectralResults.nmr = nmrResult;
    artifacts.push(...nmrResult.artifacts);
  }

  // Phase 6: Integrated Spectral Interpretation
  ctx.log('info', 'Phase 3: Performing integrated spectral interpretation');
  const interpretation = await ctx.task(spectralInterpretationTask, {
    sampleId,
    spectralResults,
    analysisGoals,
    outputDir
  });

  artifacts.push(...interpretation.artifacts);

  // Phase 7: Report Generation
  ctx.log('info', 'Phase 4: Generating spectroscopy report');
  const report = await ctx.task(spectroscopyReportTask, {
    sampleId,
    techniques,
    spectralResults,
    interpretation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Spectroscopic analysis complete for ${sampleId}. Review comprehensive results?`,
    title: 'Spectroscopy Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        techniquesUsed: techniques,
        chemicalIdentification: interpretation.identifiedCompounds,
        functionalGroups: interpretation.functionalGroups,
        surfaceChemistry: spectralResults.xps?.surfaceComposition
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    techniques,
    spectralData: spectralResults,
    chemicalAnalysis: {
      identifiedCompounds: interpretation.identifiedCompounds,
      functionalGroups: interpretation.functionalGroups,
      chemicalBonding: interpretation.bondingAnalysis,
      surfaceComposition: spectralResults.xps?.surfaceComposition
    },
    interpretation: interpretation.conclusions,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/spectroscopic-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Sample Verification
export const sampleVerificationTask = defineTask('spectroscopy-sample-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sample Verification - ${args.sampleId}`,
  agent: {
    name: 'spectroscopist',
    prompt: {
      role: 'Spectroscopy Sample Preparation Specialist',
      task: 'Verify sample preparation for spectroscopic techniques',
      context: args,
      instructions: [
        '1. Verify sample form (solid, powder, film, liquid)',
        '2. Check sample purity and contamination',
        '3. Assess sample size requirements per technique',
        '4. Verify vacuum compatibility for XPS',
        '5. Check optical quality for Raman/FTIR',
        '6. Verify NMR solubility if applicable',
        '7. Document sample handling procedures',
        '8. Identify potential interferences',
        '9. Recommend preparation adjustments if needed',
        '10. Clear sample for analysis'
      ],
      outputFormat: 'JSON with sample verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'sampleForm', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        sampleForm: { type: 'string' },
        compatibility: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'sample-prep', 'materials-science']
}));

// Task 2: XPS Analysis
export const xpsAnalysisTask = defineTask('xps-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `XPS Analysis - ${args.sampleId}`,
  agent: {
    name: 'xps-specialist',
    prompt: {
      role: 'X-ray Photoelectron Spectroscopy Specialist',
      task: 'Perform XPS surface analysis',
      context: args,
      instructions: [
        '1. Acquire survey spectrum',
        '2. Identify elements present',
        '3. Acquire high-resolution spectra for key elements',
        '4. Apply charge correction (C 1s reference)',
        '5. Perform peak fitting and deconvolution',
        '6. Identify chemical states and oxidation',
        '7. Calculate surface composition (at%)',
        '8. Analyze depth profile if needed',
        '9. Compare with reference spectra',
        '10. Document binding energies and chemical assignments'
      ],
      outputFormat: 'JSON with XPS analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedElements', 'surfaceComposition', 'chemicalStates', 'artifacts'],
      properties: {
        detectedElements: { type: 'array', items: { type: 'string' } },
        surfaceComposition: { type: 'object' },
        chemicalStates: {
          type: 'object',
          description: 'Element: [chemical states with binding energies]'
        },
        bindingEnergies: { type: 'object' },
        peakFitting: { type: 'object' },
        depthProfile: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'xps', 'surface-analysis', 'materials-science']
}));

// Task 3: FTIR Analysis
export const ftirAnalysisTask = defineTask('ftir-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `FTIR Analysis - ${args.sampleId}`,
  agent: {
    name: 'ftir-specialist',
    prompt: {
      role: 'FTIR Spectroscopy Specialist',
      task: 'Perform Fourier Transform Infrared spectroscopy analysis',
      context: args,
      instructions: [
        '1. Configure instrument (ATR, transmission, DRIFTS)',
        '2. Acquire background spectrum',
        '3. Acquire sample spectrum',
        '4. Apply baseline correction',
        '5. Identify absorption bands',
        '6. Assign functional groups',
        '7. Compare with spectral libraries',
        '8. Perform quantitative analysis if applicable',
        '9. Analyze peak positions and intensities',
        '10. Document spectral assignments'
      ],
      outputFormat: 'JSON with FTIR analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalGroups', 'peakAssignments', 'artifacts'],
      properties: {
        functionalGroups: { type: 'array', items: { type: 'string' } },
        peakAssignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wavenumber: { type: 'number' },
              assignment: { type: 'string' },
              intensity: { type: 'string' }
            }
          }
        },
        libraryMatches: { type: 'array', items: { type: 'object' } },
        spectrumPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'ftir', 'infrared', 'materials-science']
}));

// Task 4: Raman Analysis
export const ramanAnalysisTask = defineTask('raman-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Raman Analysis - ${args.sampleId}`,
  agent: {
    name: 'raman-specialist',
    prompt: {
      role: 'Raman Spectroscopy Specialist',
      task: 'Perform Raman spectroscopy analysis',
      context: args,
      instructions: [
        '1. Select excitation wavelength (532, 633, 785 nm)',
        '2. Optimize laser power to avoid damage',
        '3. Acquire Raman spectrum',
        '4. Remove fluorescence background if present',
        '5. Apply cosmic ray removal',
        '6. Identify Raman active modes',
        '7. Assign peaks to vibrational modes',
        '8. Identify phases and polymorphs',
        '9. Perform Raman mapping if needed',
        '10. Compare with reference spectra'
      ],
      outputFormat: 'JSON with Raman analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['ramanShifts', 'peakAssignments', 'artifacts'],
      properties: {
        ramanShifts: { type: 'array', items: { type: 'number' } },
        peakAssignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              shift: { type: 'number' },
              assignment: { type: 'string' },
              mode: { type: 'string' }
            }
          }
        },
        phasesIdentified: { type: 'array', items: { type: 'string' } },
        ramanMap: { type: 'object' },
        spectrumPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'raman', 'vibrational', 'materials-science']
}));

// Task 5: NMR Analysis
export const nmrAnalysisTask = defineTask('nmr-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `NMR Analysis - ${args.sampleId}`,
  agent: {
    name: 'nmr-specialist',
    prompt: {
      role: 'Nuclear Magnetic Resonance Specialist',
      task: 'Perform NMR spectroscopy analysis',
      context: args,
      instructions: [
        '1. Prepare sample in appropriate solvent',
        '2. Optimize shimming and pulse sequences',
        '3. Acquire 1H NMR spectrum',
        '4. Acquire 13C NMR if needed',
        '5. Perform 2D experiments (COSY, HSQC) if needed',
        '6. Reference chemical shifts',
        '7. Integrate peaks',
        '8. Assign peaks to structural features',
        '9. Determine molecular structure',
        '10. Assess purity from NMR'
      ],
      outputFormat: 'JSON with NMR analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['chemicalShifts', 'peakAssignments', 'artifacts'],
      properties: {
        chemicalShifts: { type: 'object' },
        peakAssignments: { type: 'array', items: { type: 'object' } },
        integrals: { type: 'object' },
        multiplicities: { type: 'object' },
        structuralInformation: { type: 'object' },
        purity: { type: 'number' },
        spectrumPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'nmr', 'structure', 'materials-science']
}));

// Task 6: Spectral Interpretation
export const spectralInterpretationTask = defineTask('spectral-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spectral Interpretation - ${args.sampleId}`,
  agent: {
    name: 'spectral-analyst',
    prompt: {
      role: 'Spectroscopy Data Integration Specialist',
      task: 'Integrate and interpret multi-technique spectroscopic data',
      context: args,
      instructions: [
        '1. Correlate findings across techniques',
        '2. Identify consistent chemical species',
        '3. Resolve apparent contradictions',
        '4. Determine surface vs bulk chemistry',
        '5. Identify functional groups and bonding',
        '6. Assess oxidation states',
        '7. Determine molecular or crystal structure',
        '8. Compare with expected chemistry',
        '9. Identify impurities or contaminants',
        '10. Draw conclusions on material chemistry'
      ],
      outputFormat: 'JSON with integrated interpretation'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedCompounds', 'functionalGroups', 'conclusions', 'artifacts'],
      properties: {
        identifiedCompounds: { type: 'array', items: { type: 'string' } },
        functionalGroups: { type: 'array', items: { type: 'string' } },
        bondingAnalysis: { type: 'object' },
        conclusions: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'interpretation', 'materials-science']
}));

// Task 7: Report Generation
export const spectroscopyReportTask = defineTask('spectroscopy-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spectroscopy Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Spectroscopy Technical Writer',
      task: 'Generate comprehensive spectroscopy analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document techniques and parameters',
        '3. Present spectra with annotations',
        '4. Include peak assignment tables',
        '5. Present composition data',
        '6. Discuss chemical interpretation',
        '7. Include comparison spectra',
        '8. Add conclusions and recommendations',
        '9. Include spectral figures',
        '10. Format for technical documentation'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spectroscopy', 'report', 'documentation', 'materials-science']
}));
