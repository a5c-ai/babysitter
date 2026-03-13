/**
 * @process domains/science/materials-science/creep-testing
 * @description Creep & High-Temperature Testing - Execute creep and stress-rupture testing, elevated temperature
 * tensile testing, and thermal fatigue evaluation.
 * @inputs { sampleId: string, testType: string, temperature: number, stress?: number, duration?: number }
 * @outputs { success: boolean, creepData: object, ruptureData: object, lifeModel: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/creep-testing', {
 *   sampleId: 'SAMPLE-007',
 *   testType: 'creep-rupture',
 *   temperature: 650,
 *   stress: 150,
 *   duration: 1000
 * });
 *
 * @references
 * - ASTM E139: Standard Test Methods for Conducting Creep Tests of Metallic Materials
 * - ASTM E21: Standard Test Methods for Elevated Temperature Tension Tests of Metallic Materials
 * - ASTM E2714: Standard Test Method for Creep-Fatigue Testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    testType = 'creep-rupture',
    temperature,
    stress = null,
    duration = null,
    atmosphere = 'air',
    strainMeasurement = 'extensometer',
    standard = 'ASTM-E139',
    outputDir = 'creep-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Creep & High-Temperature Testing for sample: ${sampleId}`);
  ctx.log('info', `Test type: ${testType}, Temperature: ${temperature}C`);

  // Phase 1: Specimen Preparation
  ctx.log('info', 'Phase 1: Preparing specimens');
  const specimenPrep = await ctx.task(creepSpecimenPrepTask, {
    sampleId,
    testType,
    temperature,
    outputDir
  });

  artifacts.push(...specimenPrep.artifacts);

  let creepResults = null;
  let ruptureResults = null;
  let elevatedTensileResults = null;
  let thermalFatigueResults = null;

  // Phase 2: Creep Testing
  if (testType === 'creep' || testType === 'creep-rupture') {
    ctx.log('info', 'Phase 2: Performing creep testing');
    creepResults = await ctx.task(creepTestingTask, {
      sampleId,
      temperature,
      stress,
      duration,
      atmosphere,
      strainMeasurement,
      standard,
      outputDir
    });

    artifacts.push(...creepResults.artifacts);

    await ctx.breakpoint({
      question: `Creep testing in progress for ${sampleId}. Minimum creep rate: ${creepResults.minimumCreepRate} %/hr. Continue monitoring or analyze?`,
      title: 'Creep Testing Status',
      context: {
        runId: ctx.runId,
        summary: {
          temperature,
          stress,
          minimumCreepRate: creepResults.minimumCreepRate,
          currentStrain: creepResults.currentStrain,
          timeElapsed: creepResults.timeElapsed
        },
        files: creepResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 3: Stress Rupture Testing
  if (testType === 'stress-rupture' || testType === 'creep-rupture') {
    ctx.log('info', 'Phase 3: Performing stress rupture testing');
    ruptureResults = await ctx.task(stressRuptureTestingTask, {
      sampleId,
      temperature,
      stress,
      atmosphere,
      outputDir
    });

    artifacts.push(...ruptureResults.artifacts);
  }

  // Phase 4: Elevated Temperature Tensile Testing
  if (testType === 'elevated-tensile') {
    ctx.log('info', 'Phase 4: Performing elevated temperature tensile testing');
    elevatedTensileResults = await ctx.task(elevatedTensileTestingTask, {
      sampleId,
      temperature,
      strainRate: 0.001,
      standard: 'ASTM-E21',
      outputDir
    });

    artifacts.push(...elevatedTensileResults.artifacts);
  }

  // Phase 5: Thermal Fatigue Testing
  if (testType === 'thermal-fatigue') {
    ctx.log('info', 'Phase 5: Performing thermal fatigue testing');
    thermalFatigueResults = await ctx.task(thermalFatigueTestingTask, {
      sampleId,
      temperatureRange: { min: 25, max: temperature },
      cycleCount: 1000,
      constraint: 'total',
      outputDir
    });

    artifacts.push(...thermalFatigueResults.artifacts);
  }

  // Phase 6: Life Modeling
  ctx.log('info', 'Phase 6: Performing life modeling');
  const lifeModel = await ctx.task(creepLifeModelingTask, {
    sampleId,
    creepResults,
    ruptureResults,
    temperature,
    stress,
    outputDir
  });

  artifacts.push(...lifeModel.artifacts);

  // Phase 7: Microstructural Analysis
  ctx.log('info', 'Phase 7: Analyzing microstructure after testing');
  const microstructure = await ctx.task(postCreepMicrostructureTask, {
    sampleId,
    testType,
    creepResults,
    outputDir
  });

  artifacts.push(...microstructure.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Generating report');
  const report = await ctx.task(creepReportTask, {
    sampleId,
    testType,
    temperature,
    stress,
    creepResults,
    ruptureResults,
    elevatedTensileResults,
    thermalFatigueResults,
    lifeModel,
    microstructure,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    sampleId,
    testType,
    temperature,
    stress,
    creepData: creepResults ? {
      minimumCreepRate: creepResults.minimumCreepRate,
      primaryCreepStrain: creepResults.primaryCreepStrain,
      secondaryCreepRate: creepResults.secondaryCreepRate,
      tertiaryOnset: creepResults.tertiaryOnsetTime,
      creepCurve: creepResults.creepCurvePath
    } : null,
    ruptureData: ruptureResults ? {
      ruptureTime: ruptureResults.ruptureTime,
      ruptureStrain: ruptureResults.ruptureStrain,
      reductionInArea: ruptureResults.reductionInArea
    } : null,
    elevatedTensileData: elevatedTensileResults ? {
      yieldStrength: elevatedTensileResults.yieldStrength,
      ultimateTensileStrength: elevatedTensileResults.ultimateTensileStrength,
      elongation: elevatedTensileResults.elongation
    } : null,
    thermalFatigueData: thermalFatigueResults ? {
      cyclesToFailure: thermalFatigueResults.cyclesToFailure,
      failureMode: thermalFatigueResults.failureMode
    } : null,
    lifeModel: {
      larsonMillerParameter: lifeModel.larsonMillerParameter,
      monkmanGrant: lifeModel.monkmanGrantConstant,
      predictedLife: lifeModel.predictedLife
    },
    microstructureChanges: microstructure.changes,
    artifacts,
    reportPath: report.reportPath,
    duration: duration_ms,
    metadata: {
      processId: 'domains/science/materials-science/creep-testing',
      timestamp: startTime,
      atmosphere,
      standard,
      outputDir
    }
  };
}

// Task 1: Specimen Preparation
export const creepSpecimenPrepTask = defineTask('creep-specimen-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Creep Specimen Preparation - ${args.sampleId}`,
  agent: {
    name: 'creep-technician',
    prompt: {
      role: 'Creep Testing Technician',
      task: 'Prepare specimens for creep and high-temperature testing',
      context: args,
      instructions: [
        '1. Machine specimens to ASTM E139 geometry',
        '2. Measure and document dimensions',
        '3. Polish surfaces if required',
        '4. Mark gage length',
        '5. Attach thermocouples',
        '6. Install extensometer points if needed',
        '7. Verify specimen straightness',
        '8. Document heat treatment condition',
        '9. Clean specimen for testing',
        '10. Record specimen identification'
      ],
      outputFormat: 'JSON with specimen preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['prepared', 'dimensions', 'artifacts'],
      properties: {
        prepared: { type: 'boolean' },
        dimensions: {
          type: 'object',
          properties: {
            gageDiameter: { type: 'number' },
            gageLength: { type: 'number' },
            overallLength: { type: 'number' }
          }
        },
        thermocoupleLocations: { type: 'array', items: { type: 'string' } },
        surfaceCondition: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creep', 'specimen-prep', 'materials-science']
}));

// Task 2: Creep Testing
export const creepTestingTask = defineTask('creep-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Creep Testing - ${args.sampleId}`,
  agent: {
    name: 'creep-test-specialist',
    prompt: {
      role: 'Creep Testing Specialist',
      task: 'Perform creep testing per ASTM E139',
      context: args,
      instructions: [
        '1. Set up creep frame with load train',
        '2. Heat furnace to test temperature',
        '3. Verify temperature stability (+/- 2C)',
        '4. Mount specimen in grips',
        '5. Zero extensometer',
        '6. Apply load gradually',
        '7. Record strain vs time continuously',
        '8. Monitor for minimum creep rate',
        '9. Identify creep stages (primary, secondary, tertiary)',
        '10. Continue to rupture or specified duration'
      ],
      outputFormat: 'JSON with creep testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['minimumCreepRate', 'creepCurvePath', 'artifacts'],
      properties: {
        minimumCreepRate: { type: 'number', description: '%/hr' },
        primaryCreepStrain: { type: 'number', description: '%' },
        secondaryCreepRate: { type: 'number', description: '%/hr' },
        tertiaryOnsetTime: { type: 'number', description: 'hours' },
        currentStrain: { type: 'number' },
        timeElapsed: { type: 'number', description: 'hours' },
        creepCurvePath: { type: 'string' },
        temperatureLog: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creep', 'high-temperature', 'materials-science']
}));

// Task 3: Stress Rupture Testing
export const stressRuptureTestingTask = defineTask('stress-rupture-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stress Rupture Testing - ${args.sampleId}`,
  agent: {
    name: 'rupture-test-specialist',
    prompt: {
      role: 'Stress Rupture Testing Specialist',
      task: 'Perform stress rupture testing',
      context: args,
      instructions: [
        '1. Set up rupture test frame',
        '2. Heat to test temperature',
        '3. Apply constant load',
        '4. Monitor specimen until rupture',
        '5. Record time to rupture',
        '6. Measure elongation and reduction in area',
        '7. Examine fracture surface',
        '8. Document failure mode',
        '9. Compare with rupture curves',
        '10. Add data point to Larson-Miller plot'
      ],
      outputFormat: 'JSON with stress rupture results'
    },
    outputSchema: {
      type: 'object',
      required: ['ruptureTime', 'ruptureStrain', 'artifacts'],
      properties: {
        ruptureTime: { type: 'number', description: 'hours' },
        ruptureStrain: { type: 'number', description: '%' },
        reductionInArea: { type: 'number', description: '%' },
        failureMode: { type: 'string' },
        necking: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stress-rupture', 'high-temperature', 'materials-science']
}));

// Task 4: Elevated Temperature Tensile Testing
export const elevatedTensileTestingTask = defineTask('elevated-tensile-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Elevated Temperature Tensile Testing - ${args.sampleId}`,
  agent: {
    name: 'hot-tensile-specialist',
    prompt: {
      role: 'Elevated Temperature Tensile Testing Specialist',
      task: 'Perform elevated temperature tensile testing per ASTM E21',
      context: args,
      instructions: [
        '1. Set up tensile frame with furnace',
        '2. Mount high-temperature extensometer',
        '3. Heat specimen to test temperature',
        '4. Allow thermal equilibration',
        '5. Perform tensile test at specified strain rate',
        '6. Record load-displacement data',
        '7. Calculate yield and UTS',
        '8. Determine elongation and RA',
        '9. Compare with room temperature properties',
        '10. Document temperature profile'
      ],
      outputFormat: 'JSON with elevated temperature tensile results'
    },
    outputSchema: {
      type: 'object',
      required: ['yieldStrength', 'ultimateTensileStrength', 'artifacts'],
      properties: {
        yieldStrength: { type: 'number', description: 'MPa' },
        ultimateTensileStrength: { type: 'number', description: 'MPa' },
        elongation: { type: 'number', description: '%' },
        reductionInArea: { type: 'number', description: '%' },
        youngsModulus: { type: 'number', description: 'GPa' },
        stressStrainCurve: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tensile', 'elevated-temperature', 'materials-science']
}));

// Task 5: Thermal Fatigue Testing
export const thermalFatigueTestingTask = defineTask('thermal-fatigue-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Fatigue Testing - ${args.sampleId}`,
  agent: {
    name: 'thermal-fatigue-specialist',
    prompt: {
      role: 'Thermal Fatigue Testing Specialist',
      task: 'Perform thermal-mechanical fatigue (TMF) testing',
      context: args,
      instructions: [
        '1. Set up TMF test frame',
        '2. Configure thermal cycling parameters',
        '3. Set mechanical constraint (in-phase, out-of-phase)',
        '4. Install high-temperature strain measurement',
        '5. Begin thermal cycling',
        '6. Monitor stress-strain hysteresis loops',
        '7. Record cycles to crack initiation',
        '8. Continue to final failure',
        '9. Analyze deformation mechanisms',
        '10. Examine failure location and mode'
      ],
      outputFormat: 'JSON with thermal fatigue results'
    },
    outputSchema: {
      type: 'object',
      required: ['cyclesToFailure', 'failureMode', 'artifacts'],
      properties: {
        cyclesToFailure: { type: 'number' },
        crackInitiationCycles: { type: 'number' },
        failureMode: { type: 'string' },
        hysteresisEvolution: { type: 'string' },
        maxStress: { type: 'number' },
        minStress: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-fatigue', 'tmf', 'materials-science']
}));

// Task 6: Life Modeling
export const creepLifeModelingTask = defineTask('creep-life-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Creep Life Modeling - ${args.sampleId}`,
  agent: {
    name: 'creep-modeler',
    prompt: {
      role: 'Creep Life Prediction Specialist',
      task: 'Apply creep life prediction models',
      context: args,
      instructions: [
        '1. Calculate Larson-Miller parameter (LMP)',
        '2. Apply Monkman-Grant relationship',
        '3. Fit Norton power law parameters',
        '4. Apply theta-projection method if applicable',
        '5. Estimate remaining life',
        '6. Calculate time to specified strain',
        '7. Compare with design allowables',
        '8. Extrapolate to service conditions',
        '9. Assess life prediction uncertainty',
        '10. Generate life prediction curves'
      ],
      outputFormat: 'JSON with life modeling results'
    },
    outputSchema: {
      type: 'object',
      required: ['larsonMillerParameter', 'predictedLife', 'artifacts'],
      properties: {
        larsonMillerParameter: { type: 'number' },
        larsonMillerConstant: { type: 'number' },
        monkmanGrantConstant: { type: 'number' },
        nortonExponent: { type: 'number' },
        nortonCoefficient: { type: 'number' },
        predictedLife: { type: 'number', description: 'hours' },
        lifeUncertainty: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creep', 'life-prediction', 'modeling', 'materials-science']
}));

// Task 7: Post-Creep Microstructure Analysis
export const postCreepMicrostructureTask = defineTask('post-creep-microstructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Creep Microstructure Analysis - ${args.sampleId}`,
  agent: {
    name: 'microstructure-analyst',
    prompt: {
      role: 'High-Temperature Microstructure Analyst',
      task: 'Analyze microstructural changes after creep testing',
      context: args,
      instructions: [
        '1. Section specimen for metallography',
        '2. Examine gage section microstructure',
        '3. Identify creep cavities and voids',
        '4. Characterize precipitate evolution',
        '5. Assess grain boundary damage',
        '6. Examine dislocation substructure if TEM',
        '7. Compare with as-received microstructure',
        '8. Document coarsening phenomena',
        '9. Correlate damage with creep life',
        '10. Generate microstructure report'
      ],
      outputFormat: 'JSON with microstructure analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'artifacts'],
      properties: {
        changes: {
          type: 'object',
          properties: {
            cavitation: { type: 'string' },
            precipitateCoarsening: { type: 'boolean' },
            grainBoundaryDamage: { type: 'string' },
            dislocationDensity: { type: 'string' }
          }
        },
        damageLevel: { type: 'string', enum: ['minimal', 'moderate', 'severe'] },
        imagePaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creep', 'microstructure', 'materials-science']
}));

// Task 8: Report Generation
export const creepReportTask = defineTask('creep-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Creep Testing Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Creep Testing Technical Writer',
      task: 'Generate comprehensive creep and high-temperature testing report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document test conditions and methods',
        '3. Present creep curves',
        '4. Show stress rupture data',
        '5. Include Larson-Miller plot',
        '6. Present microstructure images',
        '7. Report life predictions',
        '8. Compare with design requirements',
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
  labels: ['agent', 'creep', 'report', 'documentation', 'materials-science']
}));
