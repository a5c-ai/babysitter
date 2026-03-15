/**
 * @process domains/science/materials-science/fatigue-fracture-analysis
 * @description Fatigue & Fracture Analysis - Conduct fatigue testing (S-N curves, crack propagation), fracture
 * toughness measurement (KIC, CTOD), and fractographic examination.
 * @inputs { sampleId: string, analysisType: string, loadingConditions?: object, temperature?: number }
 * @outputs { success: boolean, fatigueData: object, fractureToughness: object, fractography: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/fatigue-fracture-analysis', {
 *   sampleId: 'SAMPLE-006',
 *   analysisType: 'fatigue-life',
 *   loadingConditions: { stressRatio: 0.1, frequency: 10 },
 *   temperature: 25
 * });
 *
 * @references
 * - ASTM E466: Standard Practice for Conducting Force Controlled Constant Amplitude Axial Fatigue Tests
 * - ASTM E647: Standard Test Method for Measurement of Fatigue Crack Growth Rates
 * - ASTM E399: Standard Test Method for Linear-Elastic Plane-Strain Fracture Toughness KIC
 * - ASTM E1820: Standard Test Method for Measurement of Fracture Toughness
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    analysisType = 'fatigue-life',
    loadingConditions = { stressRatio: 0.1, frequency: 10 },
    temperature = 25,
    environment = 'air',
    standard = 'ASTM-E466',
    precrackRequired = false,
    outputDir = 'fatigue-fracture-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Fatigue & Fracture Analysis for sample: ${sampleId}`);
  ctx.log('info', `Analysis type: ${analysisType}, Temperature: ${temperature}C`);

  // Phase 1: Specimen Preparation
  ctx.log('info', 'Phase 1: Preparing specimens');
  const specimenPrep = await ctx.task(fatigueSpeicmenPrepTask, {
    sampleId,
    analysisType,
    precrackRequired,
    outputDir
  });

  artifacts.push(...specimenPrep.artifacts);

  let fatigueResults = null;
  let fractureResults = null;
  let crackGrowthResults = null;

  // Phase 2: Fatigue Life Testing (S-N curve)
  if (analysisType === 'fatigue-life' || analysisType === 'both') {
    ctx.log('info', 'Phase 2: Performing fatigue life testing');
    fatigueResults = await ctx.task(fatigueLifeTestingTask, {
      sampleId,
      loadingConditions,
      temperature,
      environment,
      standard,
      outputDir
    });

    artifacts.push(...fatigueResults.artifacts);

    await ctx.breakpoint({
      question: `Fatigue testing complete. ${fatigueResults.dataPoints} data points collected. Fatigue limit: ${fatigueResults.fatigueLimit} MPa. Review S-N curve?`,
      title: 'Fatigue Testing Review',
      context: {
        runId: ctx.runId,
        summary: {
          dataPoints: fatigueResults.dataPoints,
          fatigueLimit: fatigueResults.fatigueLimit,
          fatigueStrengthCoefficient: fatigueResults.fatigueStrengthCoefficient,
          basquinExponent: fatigueResults.basquinExponent
        },
        files: fatigueResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 3: Fatigue Crack Growth Testing (da/dN)
  if (analysisType === 'crack-growth') {
    ctx.log('info', 'Phase 3: Performing crack growth rate testing');
    crackGrowthResults = await ctx.task(crackGrowthTestingTask, {
      sampleId,
      loadingConditions,
      temperature,
      environment,
      outputDir
    });

    artifacts.push(...crackGrowthResults.artifacts);
  }

  // Phase 4: Fracture Toughness Testing
  if (analysisType === 'fracture-toughness' || analysisType === 'both') {
    ctx.log('info', 'Phase 4: Performing fracture toughness testing');
    fractureResults = await ctx.task(fractureToughnessTestingTask, {
      sampleId,
      specimenType: specimenPrep.specimenType,
      temperature,
      standard: 'ASTM-E399',
      outputDir
    });

    artifacts.push(...fractureResults.artifacts);

    await ctx.breakpoint({
      question: `Fracture toughness testing complete. KIC: ${fractureResults.kic} MPa*sqrt(m). Valid test: ${fractureResults.validTest}. Review results?`,
      title: 'Fracture Toughness Review',
      context: {
        runId: ctx.runId,
        summary: {
          kic: fractureResults.kic,
          validTest: fractureResults.validTest,
          validityChecks: fractureResults.validityChecks
        },
        files: fractureResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 5: Fractographic Examination
  ctx.log('info', 'Phase 5: Performing fractographic examination');
  const fractography = await ctx.task(fractographyTask, {
    sampleId,
    analysisType,
    fatigueResults,
    fractureResults,
    outputDir
  });

  artifacts.push(...fractography.artifacts);

  // Phase 6: Data Analysis and Modeling
  ctx.log('info', 'Phase 6: Analyzing data and modeling');
  const dataAnalysis = await ctx.task(fatigueDataAnalysisTask, {
    sampleId,
    fatigueResults,
    crackGrowthResults,
    fractureResults,
    fractography,
    outputDir
  });

  artifacts.push(...dataAnalysis.artifacts);

  // Phase 7: Report Generation
  ctx.log('info', 'Phase 7: Generating report');
  const report = await ctx.task(fatigueFractureReportTask, {
    sampleId,
    analysisType,
    fatigueResults,
    crackGrowthResults,
    fractureResults,
    fractography,
    dataAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    analysisType,
    fatigueData: fatigueResults ? {
      fatigueLimit: fatigueResults.fatigueLimit,
      fatigueStrengthCoefficient: fatigueResults.fatigueStrengthCoefficient,
      basquinExponent: fatigueResults.basquinExponent,
      snCurve: fatigueResults.snCurvePath,
      dataPoints: fatigueResults.dataPoints
    } : null,
    crackGrowthData: crackGrowthResults ? {
      parisC: crackGrowthResults.parisC,
      parisM: crackGrowthResults.parisM,
      thresholdDeltaK: crackGrowthResults.thresholdDeltaK,
      daDnCurve: crackGrowthResults.daDnCurvePath
    } : null,
    fractureToughness: fractureResults ? {
      kic: fractureResults.kic,
      jic: fractureResults.jic,
      ctod: fractureResults.ctod,
      validTest: fractureResults.validTest
    } : null,
    fractography: {
      initiationSite: fractography.initiationSite,
      propagationMode: fractography.propagationMode,
      finalFracture: fractography.finalFractureMode,
      striations: fractography.striationsObserved,
      beachMarks: fractography.beachMarksObserved
    },
    lifeEstimation: dataAnalysis.lifeEstimation,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/fatigue-fracture-analysis',
      timestamp: startTime,
      loadingConditions,
      temperature,
      environment,
      outputDir
    }
  };
}

// Task 1: Specimen Preparation
export const fatigueSpeicmenPrepTask = defineTask('fatigue-specimen-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Specimen Preparation - ${args.sampleId}`,
  agent: {
    name: 'fatigue-technician',
    prompt: {
      role: 'Fatigue Testing Technician',
      task: 'Prepare specimens for fatigue and fracture testing',
      context: args,
      instructions: [
        '1. Select appropriate specimen geometry (CT, SENB, dogbone)',
        '2. Machine specimens to specification',
        '3. Polish surfaces to required finish',
        '4. Verify dimensions and tolerances',
        '5. Machine notch if required',
        '6. Pre-crack specimen if required (fatigue pre-crack)',
        '7. Measure initial crack length',
        '8. Mark specimen identification',
        '9. Document specimen preparation',
        '10. Verify compliance with standard'
      ],
      outputFormat: 'JSON with specimen preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['specimenType', 'prepared', 'artifacts'],
      properties: {
        specimenType: { type: 'string' },
        prepared: { type: 'boolean' },
        dimensions: { type: 'object' },
        initialCrackLength: { type: 'number' },
        surfaceFinish: { type: 'string' },
        precracked: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fatigue', 'specimen-prep', 'materials-science']
}));

// Task 2: Fatigue Life Testing
export const fatigueLifeTestingTask = defineTask('fatigue-life-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Life Testing - ${args.sampleId}`,
  agent: {
    name: 'fatigue-test-specialist',
    prompt: {
      role: 'Fatigue Testing Specialist',
      task: 'Perform fatigue life testing to generate S-N curve',
      context: args,
      instructions: [
        '1. Set up servo-hydraulic or resonance testing machine',
        '2. Mount specimen with proper alignment',
        '3. Configure loading parameters (stress ratio, frequency)',
        '4. Apply environmental conditions if required',
        '5. Run tests at multiple stress levels',
        '6. Record cycles to failure',
        '7. Handle runouts appropriately',
        '8. Generate S-N curve data',
        '9. Fit Basquin equation parameters',
        '10. Determine fatigue limit/endurance limit'
      ],
      outputFormat: 'JSON with fatigue life testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['fatigueLimit', 'dataPoints', 'artifacts'],
      properties: {
        fatigueLimit: { type: 'number', description: 'MPa' },
        fatigueStrengthCoefficient: { type: 'number' },
        basquinExponent: { type: 'number' },
        dataPoints: { type: 'number' },
        snData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stressAmplitude: { type: 'number' },
              cyclesToFailure: { type: 'number' },
              runout: { type: 'boolean' }
            }
          }
        },
        snCurvePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fatigue', 'sn-curve', 'materials-science']
}));

// Task 3: Crack Growth Rate Testing
export const crackGrowthTestingTask = defineTask('crack-growth-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Crack Growth Rate Testing - ${args.sampleId}`,
  agent: {
    name: 'crack-growth-specialist',
    prompt: {
      role: 'Fatigue Crack Growth Specialist',
      task: 'Perform fatigue crack growth rate testing per ASTM E647',
      context: args,
      instructions: [
        '1. Set up specimen with crack monitoring (COD gage, potential drop)',
        '2. Configure loading (constant deltaK or decreasing K)',
        '3. Monitor crack length during cycling',
        '4. Record crack length vs. cycles data',
        '5. Calculate da/dN at each increment',
        '6. Calculate stress intensity factor range',
        '7. Generate da/dN vs deltaK curve',
        '8. Fit Paris law parameters (C, m)',
        '9. Determine threshold deltaK',
        '10. Document any crack closure effects'
      ],
      outputFormat: 'JSON with crack growth rate results'
    },
    outputSchema: {
      type: 'object',
      required: ['parisC', 'parisM', 'thresholdDeltaK', 'artifacts'],
      properties: {
        parisC: { type: 'number' },
        parisM: { type: 'number' },
        thresholdDeltaK: { type: 'number', description: 'MPa*sqrt(m)' },
        daDnData: { type: 'array', items: { type: 'object' } },
        daDnCurvePath: { type: 'string' },
        closureRatio: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fatigue', 'crack-growth', 'paris-law', 'materials-science']
}));

// Task 4: Fracture Toughness Testing
export const fractureToughnessTestingTask = defineTask('fracture-toughness-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fracture Toughness Testing - ${args.sampleId}`,
  agent: {
    name: 'fracture-mechanics-specialist',
    prompt: {
      role: 'Fracture Mechanics Specialist',
      task: 'Perform fracture toughness testing per ASTM E399/E1820',
      context: args,
      instructions: [
        '1. Verify pre-crack meets requirements',
        '2. Measure specimen dimensions accurately',
        '3. Mount specimen in loading fixture',
        '4. Apply displacement-controlled loading',
        '5. Record load-displacement (P-CMOD) curve',
        '6. Determine conditional KQ or JQ',
        '7. Apply validity checks per standard',
        '8. Calculate KIC, JIC, or CTOD',
        '9. Measure final crack length (post-test)',
        '10. Document test validity status'
      ],
      outputFormat: 'JSON with fracture toughness results'
    },
    outputSchema: {
      type: 'object',
      required: ['kic', 'validTest', 'artifacts'],
      properties: {
        kic: { type: 'number', description: 'MPa*sqrt(m)' },
        jic: { type: 'number', description: 'kJ/m^2' },
        ctod: { type: 'number', description: 'mm' },
        validTest: { type: 'boolean' },
        validityChecks: {
          type: 'object',
          properties: {
            specimenSize: { type: 'boolean' },
            crackFront: { type: 'boolean' },
            loadRatio: { type: 'boolean' }
          }
        },
        loadDisplacementPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fracture-mechanics', 'kic', 'toughness', 'materials-science']
}));

// Task 5: Fractographic Examination
export const fractographyTask = defineTask('fractography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fractographic Examination - ${args.sampleId}`,
  agent: {
    name: 'fractographer',
    prompt: {
      role: 'Fractography Specialist',
      task: 'Examine fracture surfaces using SEM/optical microscopy',
      context: args,
      instructions: [
        '1. Document macroscopic fracture features',
        '2. Identify crack initiation site(s)',
        '3. Examine propagation zone features',
        '4. Identify fatigue striations if present',
        '5. Observe beach marks/progression marks',
        '6. Characterize final fracture region',
        '7. Document dimples, cleavage, intergranular features',
        '8. Measure striation spacing for crack growth rate',
        '9. Identify any inclusions or defects at initiation',
        '10. Correlate fracture mode with loading history'
      ],
      outputFormat: 'JSON with fractographic examination results'
    },
    outputSchema: {
      type: 'object',
      required: ['initiationSite', 'propagationMode', 'artifacts'],
      properties: {
        initiationSite: { type: 'string' },
        initiationFeatures: { type: 'array', items: { type: 'string' } },
        propagationMode: { type: 'string' },
        striationsObserved: { type: 'boolean' },
        striationSpacing: { type: 'number', description: 'microns' },
        beachMarksObserved: { type: 'boolean' },
        finalFractureMode: { type: 'string', enum: ['ductile', 'brittle', 'mixed'] },
        defectsIdentified: { type: 'array', items: { type: 'string' } },
        imagePaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fractography', 'failure-analysis', 'materials-science']
}));

// Task 6: Data Analysis and Modeling
export const fatigueDataAnalysisTask = defineTask('fatigue-data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Data Analysis - ${args.sampleId}`,
  agent: {
    name: 'fatigue-analyst',
    prompt: {
      role: 'Fatigue and Fracture Data Analyst',
      task: 'Analyze fatigue and fracture data for life prediction',
      context: args,
      instructions: [
        '1. Fit statistical models to S-N data',
        '2. Perform Weibull analysis if appropriate',
        '3. Calculate design allowables',
        '4. Apply damage tolerance analysis',
        '5. Calculate crack growth life from da/dN data',
        '6. Correlate microstructure with performance',
        '7. Compare with similar materials data',
        '8. Validate fracture mechanics predictions',
        '9. Generate life estimation for components',
        '10. Assess fatigue design margins'
      ],
      outputFormat: 'JSON with data analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['lifeEstimation', 'artifacts'],
      properties: {
        lifeEstimation: {
          type: 'object',
          properties: {
            meanLife: { type: 'number' },
            designLife: { type: 'number' },
            safetyFactor: { type: 'number' }
          }
        },
        statisticalParameters: { type: 'object' },
        weibullShape: { type: 'number' },
        weibullScale: { type: 'number' },
        comparisonData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fatigue', 'data-analysis', 'life-prediction', 'materials-science']
}));

// Task 7: Report Generation
export const fatigueFractureReportTask = defineTask('fatigue-fracture-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue & Fracture Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Fatigue and Fracture Technical Writer',
      task: 'Generate comprehensive fatigue and fracture analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document test methods and standards',
        '3. Present S-N curve with fit parameters',
        '4. Present crack growth rate data',
        '5. Report fracture toughness values',
        '6. Include fractographic images',
        '7. Present life predictions',
        '8. Compare with specifications/requirements',
        '9. Add conclusions and recommendations',
        '10. Format per engineering standards'
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
  labels: ['agent', 'fatigue', 'fracture', 'report', 'documentation', 'materials-science']
}));
