/**
 * @process domains/science/materials-science/electron-microscopy
 * @description Electron Microscopy Characterization - Perform SEM/TEM analysis including imaging, EDS/WDS elemental
 * mapping, EBSD orientation analysis, and microstructural quantification.
 * @inputs { sampleId: string, technique: string, analysisTypes?: array, magnificationRange?: object }
 * @outputs { success: boolean, images: array, elementalMaps: object, microstructure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/electron-microscopy', {
 *   sampleId: 'SAMPLE-002',
 *   technique: 'SEM',
 *   analysisTypes: ['imaging', 'EDS', 'EBSD'],
 *   magnificationRange: { min: 100, max: 50000 }
 * });
 *
 * @references
 * - SEM Imaging: https://www.thermofisher.com/us/en/home/electron-microscopy/products/scanning-electron-microscopes.html
 * - TEM Techniques: https://www.jeol.co.jp/en/science/em.html
 * - EBSD Analysis: https://www.oxinst.com/products/ebsd
 * - EDS/WDS: https://www.bruker.com/en/products-and-solutions/elemental-analyzers/eds-wds-ebsd-sem.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    technique = 'SEM',
    analysisTypes = ['imaging', 'EDS'],
    magnificationRange = { min: 100, max: 10000 },
    acceleratingVoltage = 20,
    workingDistance = 10,
    detector = 'SE',
    edsAcquisitionTime = 60,
    ebsdStepSize = 0.5,
    outputDir = 'em-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Electron Microscopy Analysis for sample: ${sampleId}`);
  ctx.log('info', `Technique: ${technique}, Analysis types: ${analysisTypes.join(', ')}`);

  // Phase 1: Sample Preparation Assessment
  ctx.log('info', 'Phase 1: Assessing sample preparation');
  const samplePrep = await ctx.task(samplePrepAssessmentTask, {
    sampleId,
    technique,
    analysisTypes,
    outputDir
  });

  artifacts.push(...samplePrep.artifacts);

  // Phase 2: Instrument Setup and Alignment
  ctx.log('info', 'Phase 2: Instrument setup and alignment');
  const instrumentSetup = await ctx.task(instrumentSetupTask, {
    sampleId,
    technique,
    acceleratingVoltage,
    workingDistance,
    detector,
    outputDir
  });

  artifacts.push(...instrumentSetup.artifacts);

  // Phase 3: Imaging Acquisition
  let imagingResults = null;
  if (analysisTypes.includes('imaging')) {
    ctx.log('info', 'Phase 3: Acquiring images');
    imagingResults = await ctx.task(imagingAcquisitionTask, {
      sampleId,
      technique,
      magnificationRange,
      detector,
      outputDir
    });

    artifacts.push(...imagingResults.artifacts);

    await ctx.breakpoint({
      question: `Imaging complete for ${sampleId}. Acquired ${imagingResults.imageCount} images. Review quality before proceeding?`,
      title: 'Imaging Review',
      context: {
        runId: ctx.runId,
        summary: {
          imageCount: imagingResults.imageCount,
          magnifications: imagingResults.magnifications,
          imageQuality: imagingResults.qualityAssessment
        },
        files: imagingResults.artifacts.map(a => ({ path: a.path, format: a.format || 'image' }))
      }
    });
  }

  // Phase 4: EDS Elemental Analysis
  let edsResults = null;
  if (analysisTypes.includes('EDS')) {
    ctx.log('info', 'Phase 4: Performing EDS elemental analysis');
    edsResults = await ctx.task(edsAnalysisTask, {
      sampleId,
      acceleratingVoltage,
      acquisitionTime: edsAcquisitionTime,
      outputDir
    });

    artifacts.push(...edsResults.artifacts);
  }

  // Phase 5: WDS Analysis (if requested)
  let wdsResults = null;
  if (analysisTypes.includes('WDS')) {
    ctx.log('info', 'Phase 5: Performing WDS analysis');
    wdsResults = await ctx.task(wdsAnalysisTask, {
      sampleId,
      acceleratingVoltage,
      outputDir
    });

    artifacts.push(...wdsResults.artifacts);
  }

  // Phase 6: EBSD Orientation Analysis
  let ebsdResults = null;
  if (analysisTypes.includes('EBSD')) {
    ctx.log('info', 'Phase 6: Performing EBSD orientation analysis');
    ebsdResults = await ctx.task(ebsdAnalysisTask, {
      sampleId,
      stepSize: ebsdStepSize,
      acceleratingVoltage,
      outputDir
    });

    artifacts.push(...ebsdResults.artifacts);

    await ctx.breakpoint({
      question: `EBSD analysis complete. Indexing rate: ${ebsdResults.indexingRate}%. Review orientation maps?`,
      title: 'EBSD Analysis Review',
      context: {
        runId: ctx.runId,
        summary: {
          indexingRate: ebsdResults.indexingRate,
          grainCount: ebsdResults.grainCount,
          averageGrainSize: ebsdResults.averageGrainSize,
          textureStrength: ebsdResults.textureStrength
        },
        files: ebsdResults.artifacts.map(a => ({ path: a.path, format: a.format || 'image' }))
      }
    });
  }

  // Phase 7: Microstructural Quantification
  ctx.log('info', 'Phase 7: Quantifying microstructure');
  const microstructure = await ctx.task(microstructureQuantificationTask, {
    sampleId,
    imagingResults,
    edsResults,
    ebsdResults,
    outputDir
  });

  artifacts.push(...microstructure.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Generating analysis report');
  const report = await ctx.task(emReportTask, {
    sampleId,
    technique,
    analysisTypes,
    imagingResults,
    edsResults,
    wdsResults,
    ebsdResults,
    microstructure,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Electron microscopy analysis complete for ${sampleId}. Review final results?`,
    title: 'EM Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        technique,
        analysisTypes,
        imageCount: imagingResults?.imageCount || 0,
        elementsDetected: edsResults?.elementsDetected || [],
        grainCount: ebsdResults?.grainCount || null
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    technique,
    analysisTypes,
    images: imagingResults ? {
      count: imagingResults.imageCount,
      magnifications: imagingResults.magnifications,
      paths: imagingResults.imagePaths
    } : null,
    elementalAnalysis: {
      eds: edsResults ? {
        elementsDetected: edsResults.elementsDetected,
        composition: edsResults.composition,
        maps: edsResults.elementalMaps
      } : null,
      wds: wdsResults ? {
        elementsQuantified: wdsResults.elementsQuantified,
        composition: wdsResults.composition
      } : null
    },
    orientationAnalysis: ebsdResults ? {
      indexingRate: ebsdResults.indexingRate,
      grainCount: ebsdResults.grainCount,
      averageGrainSize: ebsdResults.averageGrainSize,
      textureComponents: ebsdResults.textureComponents,
      misorientation: ebsdResults.misorientationData
    } : null,
    microstructure: microstructure.quantifiedParameters,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/electron-microscopy',
      timestamp: startTime,
      instrumentParams: { acceleratingVoltage, workingDistance, detector },
      outputDir
    }
  };
}

// Task 1: Sample Preparation Assessment
export const samplePrepAssessmentTask = defineTask('em-sample-prep-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sample Preparation Assessment - ${args.sampleId}`,
  agent: {
    name: 'electron-microscopist',
    prompt: {
      role: 'Electron Microscopy Specialist',
      task: 'Assess sample preparation quality for electron microscopy',
      context: args,
      instructions: [
        '1. Evaluate sample mounting and conductivity',
        '2. Assess surface preparation (polishing, etching)',
        '3. Check for charging artifacts potential',
        '4. Verify appropriate coating (Au, C, Pt) if needed',
        '5. Assess sample flatness for EBSD if required',
        '6. Check for contamination or oxidation',
        '7. Verify sample stability under electron beam',
        '8. Document preparation procedures used',
        '9. Identify any preparation-related limitations',
        '10. Provide recommendations for improvements'
      ],
      outputFormat: 'JSON with sample preparation assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['preparationQuality', 'readyForAnalysis', 'artifacts'],
      properties: {
        preparationQuality: { type: 'string', enum: ['excellent', 'good', 'acceptable', 'poor'] },
        readyForAnalysis: { type: 'boolean' },
        conductivity: { type: 'string' },
        surfaceCondition: { type: 'string' },
        coatingType: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'sample-prep', 'materials-science']
}));

// Task 2: Instrument Setup
export const instrumentSetupTask = defineTask('em-instrument-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Instrument Setup - ${args.sampleId}`,
  agent: {
    name: 'microscope-operator',
    prompt: {
      role: 'Electron Microscope Operator',
      task: 'Set up and align electron microscope for analysis',
      context: args,
      instructions: [
        '1. Set accelerating voltage',
        '2. Align electron gun and column',
        '3. Set working distance',
        '4. Configure detector settings',
        '5. Perform astigmatism correction',
        '6. Optimize focus and aperture alignment',
        '7. Calibrate magnification',
        '8. Set up EDS/EBSD detectors if needed',
        '9. Verify vacuum conditions',
        '10. Document instrument parameters'
      ],
      outputFormat: 'JSON with instrument setup parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['setupComplete', 'instrumentParams', 'artifacts'],
      properties: {
        setupComplete: { type: 'boolean' },
        instrumentParams: {
          type: 'object',
          properties: {
            acceleratingVoltage: { type: 'number' },
            workingDistance: { type: 'number' },
            spotSize: { type: 'number' },
            aperture: { type: 'string' },
            vacuumLevel: { type: 'number' }
          }
        },
        alignmentQuality: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'instrument-setup', 'materials-science']
}));

// Task 3: Imaging Acquisition
export const imagingAcquisitionTask = defineTask('em-imaging-acquisition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Imaging Acquisition - ${args.sampleId}`,
  agent: {
    name: 'imaging-specialist',
    prompt: {
      role: 'EM Imaging Specialist',
      task: 'Acquire high-quality electron microscopy images',
      context: args,
      instructions: [
        '1. Survey sample at low magnification',
        '2. Identify representative areas of interest',
        '3. Acquire images at multiple magnifications',
        '4. Optimize contrast and brightness',
        '5. Use appropriate detector (SE, BSE, InLens)',
        '6. Adjust scan speed for image quality',
        '7. Minimize charging and drift',
        '8. Capture overview and detail images',
        '9. Include scale bars',
        '10. Assess image quality metrics'
      ],
      outputFormat: 'JSON with imaging results'
    },
    outputSchema: {
      type: 'object',
      required: ['imageCount', 'imagePaths', 'magnifications', 'artifacts'],
      properties: {
        imageCount: { type: 'number' },
        imagePaths: { type: 'array', items: { type: 'string' } },
        magnifications: { type: 'array', items: { type: 'number' } },
        qualityAssessment: { type: 'string' },
        detectorUsed: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'imaging', 'materials-science']
}));

// Task 4: EDS Analysis
export const edsAnalysisTask = defineTask('em-eds-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `EDS Elemental Analysis - ${args.sampleId}`,
  agent: {
    name: 'eds-analyst',
    prompt: {
      role: 'EDS Analysis Specialist',
      task: 'Perform energy-dispersive X-ray spectroscopy analysis',
      context: args,
      instructions: [
        '1. Optimize detector geometry and dead time',
        '2. Acquire EDS spectra at points of interest',
        '3. Perform standardless quantification',
        '4. Acquire elemental maps',
        '5. Identify and label peaks',
        '6. Apply matrix corrections (ZAF/phi-rho-z)',
        '7. Check for peak overlaps',
        '8. Assess detection limits',
        '9. Calculate composition with uncertainties',
        '10. Generate element distribution maps'
      ],
      outputFormat: 'JSON with EDS analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['elementsDetected', 'composition', 'artifacts'],
      properties: {
        elementsDetected: { type: 'array', items: { type: 'string' } },
        composition: {
          type: 'object',
          description: 'Element concentrations in wt% or at%'
        },
        elementalMaps: { type: 'object' },
        spectrumPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'eds', 'elemental-analysis', 'materials-science']
}));

// Task 5: WDS Analysis
export const wdsAnalysisTask = defineTask('em-wds-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `WDS Analysis - ${args.sampleId}`,
  agent: {
    name: 'wds-analyst',
    prompt: {
      role: 'WDS Analysis Specialist',
      task: 'Perform wavelength-dispersive X-ray spectroscopy analysis',
      context: args,
      instructions: [
        '1. Select appropriate analyzing crystals',
        '2. Perform peak and background calibration',
        '3. Use certified standards for quantification',
        '4. Acquire spectra for elements of interest',
        '5. Apply matrix corrections',
        '6. Calculate precise compositions',
        '7. Assess precision and accuracy',
        '8. Detect trace elements',
        '9. Compare with EDS results',
        '10. Document analytical conditions'
      ],
      outputFormat: 'JSON with WDS analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['elementsQuantified', 'composition', 'artifacts'],
      properties: {
        elementsQuantified: { type: 'array', items: { type: 'string' } },
        composition: { type: 'object' },
        precision: { type: 'object' },
        standardsUsed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'wds', 'elemental-analysis', 'materials-science']
}));

// Task 6: EBSD Analysis
export const ebsdAnalysisTask = defineTask('em-ebsd-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `EBSD Orientation Analysis - ${args.sampleId}`,
  agent: {
    name: 'ebsd-analyst',
    prompt: {
      role: 'EBSD Analysis Specialist',
      task: 'Perform electron backscatter diffraction analysis',
      context: args,
      instructions: [
        '1. Set up EBSD detector geometry',
        '2. Calibrate pattern center',
        '3. Define scan area and step size',
        '4. Select phase(s) for indexing',
        '5. Acquire EBSD map',
        '6. Index Kikuchi patterns',
        '7. Clean up data (remove wild spikes)',
        '8. Generate orientation maps (IPF, IQ)',
        '9. Analyze grain boundaries and CSL',
        '10. Calculate texture and ODF'
      ],
      outputFormat: 'JSON with EBSD analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['indexingRate', 'grainCount', 'averageGrainSize', 'artifacts'],
      properties: {
        indexingRate: { type: 'number' },
        grainCount: { type: 'number' },
        averageGrainSize: { type: 'number', description: 'microns' },
        textureStrength: { type: 'number' },
        textureComponents: { type: 'array', items: { type: 'string' } },
        misorientationData: { type: 'object' },
        grainBoundaryFraction: { type: 'object' },
        odfPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'ebsd', 'orientation', 'materials-science']
}));

// Task 7: Microstructure Quantification
export const microstructureQuantificationTask = defineTask('em-microstructure-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Microstructure Quantification - ${args.sampleId}`,
  agent: {
    name: 'image-analyst',
    prompt: {
      role: 'Quantitative Metallography Specialist',
      task: 'Quantify microstructural features from EM data',
      context: args,
      instructions: [
        '1. Segment images for feature identification',
        '2. Measure grain sizes (ASTM E112)',
        '3. Calculate phase volume fractions',
        '4. Measure particle/precipitate sizes and distributions',
        '5. Analyze porosity and voids',
        '6. Quantify inclusion content',
        '7. Measure layer thicknesses if applicable',
        '8. Calculate aspect ratios and shape factors',
        '9. Perform statistical analysis',
        '10. Generate quantification report'
      ],
      outputFormat: 'JSON with quantified microstructural parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['quantifiedParameters', 'artifacts'],
      properties: {
        quantifiedParameters: {
          type: 'object',
          properties: {
            grainSize: { type: 'object' },
            phasefractions: { type: 'object' },
            porosity: { type: 'number' },
            particleDistribution: { type: 'object' }
          }
        },
        astmGrainSize: { type: 'number' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electron-microscopy', 'quantification', 'microstructure', 'materials-science']
}));

// Task 8: Report Generation
export const emReportTask = defineTask('em-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `EM Analysis Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Materials Characterization Technical Writer',
      task: 'Generate comprehensive electron microscopy analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document experimental methods and parameters',
        '3. Present representative images',
        '4. Include elemental analysis results',
        '5. Present EBSD results if applicable',
        '6. Document quantitative analysis results',
        '7. Include composition tables',
        '8. Provide interpretation of results',
        '9. Add conclusions and recommendations',
        '10. Format for technical or publication use'
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
  labels: ['agent', 'electron-microscopy', 'report', 'documentation', 'materials-science']
}));
