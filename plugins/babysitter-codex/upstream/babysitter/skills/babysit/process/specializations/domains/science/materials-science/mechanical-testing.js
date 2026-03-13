/**
 * @process domains/science/materials-science/mechanical-testing
 * @description Mechanical Properties Testing - Perform comprehensive mechanical testing including tensile, compression,
 * hardness, impact (Charpy/Izod), and bend testing per ASTM/ISO standards.
 * @inputs { sampleId: string, testTypes: array, standards?: array, temperature?: number }
 * @outputs { success: boolean, mechanicalProperties: object, testResults: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/mechanical-testing', {
 *   sampleId: 'SAMPLE-005',
 *   testTypes: ['tensile', 'hardness', 'impact'],
 *   standards: ['ASTM-E8', 'ASTM-E18', 'ASTM-E23'],
 *   temperature: 25
 * });
 *
 * @references
 * - ASTM E8: Tension Testing of Metallic Materials
 * - ASTM E9: Compression Testing of Metallic Materials
 * - ASTM E18: Rockwell Hardness Testing
 * - ASTM E23: Notched Bar Impact Testing
 * - ISO 6892-1: Metallic Materials - Tensile Testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    testTypes = ['tensile'],
    standards = [],
    temperature = 25,
    strainRate = 0.001,
    specimenGeometry = 'standard',
    replicates = 3,
    outputDir = 'mechanical-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const testResults = {};

  ctx.log('info', `Starting Mechanical Properties Testing for sample: ${sampleId}`);
  ctx.log('info', `Test types: ${testTypes.join(', ')}, Temperature: ${temperature}C`);

  // Phase 1: Specimen Preparation and Verification
  ctx.log('info', 'Phase 1: Verifying specimen preparation');
  const specimenVerification = await ctx.task(specimenVerificationTask, {
    sampleId,
    testTypes,
    specimenGeometry,
    standards,
    outputDir
  });

  artifacts.push(...specimenVerification.artifacts);

  // Phase 2: Tensile Testing (if requested)
  if (testTypes.includes('tensile')) {
    ctx.log('info', 'Phase 2a: Performing tensile testing');
    const tensileResult = await ctx.task(tensileTestingTask, {
      sampleId,
      temperature,
      strainRate,
      specimenDimensions: specimenVerification.specimenDimensions.tensile,
      standard: standards.find(s => s.includes('E8') || s.includes('6892')) || 'ASTM-E8',
      replicates,
      outputDir
    });

    testResults.tensile = tensileResult;
    artifacts.push(...tensileResult.artifacts);
  }

  // Phase 3: Compression Testing (if requested)
  if (testTypes.includes('compression')) {
    ctx.log('info', 'Phase 2b: Performing compression testing');
    const compressionResult = await ctx.task(compressionTestingTask, {
      sampleId,
      temperature,
      strainRate,
      specimenDimensions: specimenVerification.specimenDimensions.compression,
      standard: standards.find(s => s.includes('E9')) || 'ASTM-E9',
      replicates,
      outputDir
    });

    testResults.compression = compressionResult;
    artifacts.push(...compressionResult.artifacts);
  }

  // Phase 4: Hardness Testing (if requested)
  if (testTypes.includes('hardness')) {
    ctx.log('info', 'Phase 2c: Performing hardness testing');
    const hardnessResult = await ctx.task(hardnessTestingTask, {
      sampleId,
      hardnessScale: 'HRC',
      standard: standards.find(s => s.includes('E18') || s.includes('E384')) || 'ASTM-E18',
      indentations: 5,
      outputDir
    });

    testResults.hardness = hardnessResult;
    artifacts.push(...hardnessResult.artifacts);
  }

  // Phase 5: Impact Testing (if requested)
  if (testTypes.includes('impact')) {
    ctx.log('info', 'Phase 2d: Performing impact testing');
    const impactResult = await ctx.task(impactTestingTask, {
      sampleId,
      testType: 'Charpy',
      temperature,
      notchType: 'V-notch',
      standard: standards.find(s => s.includes('E23')) || 'ASTM-E23',
      replicates,
      outputDir
    });

    testResults.impact = impactResult;
    artifacts.push(...impactResult.artifacts);
  }

  // Phase 6: Bend Testing (if requested)
  if (testTypes.includes('bend')) {
    ctx.log('info', 'Phase 2e: Performing bend testing');
    const bendResult = await ctx.task(bendTestingTask, {
      sampleId,
      bendType: '3-point',
      span: specimenVerification.specimenDimensions.bend?.span || 40,
      standard: standards.find(s => s.includes('E290') || s.includes('E855')) || 'ASTM-E290',
      outputDir
    });

    testResults.bend = bendResult;
    artifacts.push(...bendResult.artifacts);
  }

  // Phase 7: Statistical Analysis
  ctx.log('info', 'Phase 3: Performing statistical analysis');
  const statistics = await ctx.task(mechanicalStatisticsTask, {
    sampleId,
    testResults,
    replicates,
    outputDir
  });

  artifacts.push(...statistics.artifacts);

  // Breakpoint: Review mechanical testing results
  await ctx.breakpoint({
    question: `Mechanical testing complete for ${sampleId}. Review results and statistical analysis?`,
    title: 'Mechanical Testing Review',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        testsPerformed: testTypes,
        tensile: testResults.tensile ? {
          yieldStrength: testResults.tensile.yieldStrength,
          ultimateTensileStrength: testResults.tensile.ultimateTensileStrength,
          elongation: testResults.tensile.elongation
        } : null,
        hardness: testResults.hardness?.averageHardness,
        impactEnergy: testResults.impact?.averageEnergy,
        statistics: statistics.summary
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 4: Generating mechanical testing report');
  const report = await ctx.task(mechanicalReportTask, {
    sampleId,
    testTypes,
    standards,
    testResults,
    statistics,
    specimenVerification,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    testTypes,
    temperature,
    mechanicalProperties: {
      tensile: testResults.tensile ? {
        yieldStrength: testResults.tensile.yieldStrength,
        ultimateTensileStrength: testResults.tensile.ultimateTensileStrength,
        elongation: testResults.tensile.elongation,
        reductionInArea: testResults.tensile.reductionInArea,
        youngsModulus: testResults.tensile.youngsModulus
      } : null,
      compression: testResults.compression ? {
        compressiveYieldStrength: testResults.compression.yieldStrength,
        compressiveStrength: testResults.compression.ultimateStrength
      } : null,
      hardness: testResults.hardness ? {
        scale: testResults.hardness.scale,
        value: testResults.hardness.averageHardness,
        standardDeviation: testResults.hardness.standardDeviation
      } : null,
      impact: testResults.impact ? {
        testType: testResults.impact.testType,
        energy: testResults.impact.averageEnergy,
        ductileBrittleTransition: testResults.impact.dbtt
      } : null,
      bend: testResults.bend ? {
        flexuralStrength: testResults.bend.flexuralStrength,
        flexuralModulus: testResults.bend.flexuralModulus
      } : null
    },
    testResults: Object.entries(testResults).map(([type, result]) => ({
      type,
      specimens: result.specimenCount,
      rawData: result.rawDataPath
    })),
    statistics: statistics.summary,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/mechanical-testing',
      timestamp: startTime,
      standards,
      outputDir
    }
  };
}

// Task 1: Specimen Verification
export const specimenVerificationTask = defineTask('specimen-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specimen Verification - ${args.sampleId}`,
  agent: {
    name: 'test-technician',
    prompt: {
      role: 'Mechanical Testing Technician',
      task: 'Verify specimen preparation and dimensions',
      context: args,
      instructions: [
        '1. Verify specimen geometry per applicable standard',
        '2. Measure specimen dimensions accurately',
        '3. Check surface finish quality',
        '4. Verify notch geometry for impact specimens',
        '5. Check for machining defects',
        '6. Verify specimen identification/marking',
        '7. Document any deviations from standard',
        '8. Calculate cross-sectional area',
        '9. Verify gage length for tensile specimens',
        '10. Clear specimens for testing'
      ],
      outputFormat: 'JSON with specimen verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'specimenDimensions', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        specimenDimensions: { type: 'object' },
        specimenCount: { type: 'number' },
        deviations: { type: 'array', items: { type: 'string' } },
        surfaceCondition: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'specimen-prep', 'materials-science']
}));

// Task 2: Tensile Testing
export const tensileTestingTask = defineTask('tensile-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tensile Testing - ${args.sampleId}`,
  agent: {
    name: 'tensile-test-specialist',
    prompt: {
      role: 'Tensile Testing Specialist',
      task: 'Perform tensile testing per ASTM E8/ISO 6892',
      context: args,
      instructions: [
        '1. Mount specimen in grips with proper alignment',
        '2. Attach extensometer for strain measurement',
        '3. Set test parameters (strain rate, data acquisition)',
        '4. Perform test to failure',
        '5. Record load-displacement data',
        '6. Calculate engineering stress-strain curve',
        '7. Determine yield strength (0.2% offset)',
        '8. Determine ultimate tensile strength',
        '9. Calculate elongation and reduction in area',
        '10. Determine Youngs modulus from elastic region'
      ],
      outputFormat: 'JSON with tensile testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['yieldStrength', 'ultimateTensileStrength', 'elongation', 'artifacts'],
      properties: {
        yieldStrength: { type: 'number', description: 'MPa' },
        ultimateTensileStrength: { type: 'number', description: 'MPa' },
        elongation: { type: 'number', description: 'percent' },
        reductionInArea: { type: 'number', description: 'percent' },
        youngsModulus: { type: 'number', description: 'GPa' },
        uniformElongation: { type: 'number' },
        specimenCount: { type: 'number' },
        rawDataPath: { type: 'string' },
        stressStrainCurve: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'tensile', 'materials-science']
}));

// Task 3: Compression Testing
export const compressionTestingTask = defineTask('compression-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compression Testing - ${args.sampleId}`,
  agent: {
    name: 'compression-test-specialist',
    prompt: {
      role: 'Compression Testing Specialist',
      task: 'Perform compression testing per ASTM E9',
      context: args,
      instructions: [
        '1. Position specimen between platens',
        '2. Ensure parallel alignment',
        '3. Apply lubricant if needed to reduce friction',
        '4. Set compression rate',
        '5. Perform test to specified strain or failure',
        '6. Record load-displacement data',
        '7. Calculate compressive stress-strain curve',
        '8. Determine compressive yield strength',
        '9. Determine ultimate compressive strength',
        '10. Note barreling or buckling behavior'
      ],
      outputFormat: 'JSON with compression testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['yieldStrength', 'ultimateStrength', 'artifacts'],
      properties: {
        yieldStrength: { type: 'number', description: 'MPa' },
        ultimateStrength: { type: 'number', description: 'MPa' },
        compressiveModulus: { type: 'number', description: 'GPa' },
        specimenCount: { type: 'number' },
        failureMode: { type: 'string' },
        rawDataPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'compression', 'materials-science']
}));

// Task 4: Hardness Testing
export const hardnessTestingTask = defineTask('hardness-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hardness Testing - ${args.sampleId}`,
  agent: {
    name: 'hardness-test-specialist',
    prompt: {
      role: 'Hardness Testing Specialist',
      task: 'Perform hardness testing per ASTM E18/E384',
      context: args,
      instructions: [
        '1. Select appropriate hardness scale',
        '2. Prepare surface (polish if needed)',
        '3. Calibrate tester with standard block',
        '4. Make test indentations',
        '5. Ensure proper spacing between indents',
        '6. Read hardness values',
        '7. Perform multiple measurements',
        '8. Calculate average and standard deviation',
        '9. Convert to other scales if needed',
        '10. Document indentation locations'
      ],
      outputFormat: 'JSON with hardness testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['scale', 'averageHardness', 'measurements', 'artifacts'],
      properties: {
        scale: { type: 'string', description: 'HRC, HRB, HV, HB' },
        averageHardness: { type: 'number' },
        standardDeviation: { type: 'number' },
        measurements: { type: 'array', items: { type: 'number' } },
        indentationCount: { type: 'number' },
        convertedValues: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'hardness', 'materials-science']
}));

// Task 5: Impact Testing
export const impactTestingTask = defineTask('impact-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Impact Testing - ${args.sampleId}`,
  agent: {
    name: 'impact-test-specialist',
    prompt: {
      role: 'Impact Testing Specialist',
      task: 'Perform Charpy/Izod impact testing per ASTM E23',
      context: args,
      instructions: [
        '1. Verify notch geometry and dimensions',
        '2. Condition specimens to test temperature',
        '3. Calibrate impact machine',
        '4. Position specimen in anvil',
        '5. Release pendulum and record energy',
        '6. Calculate absorbed energy',
        '7. Examine fracture surface',
        '8. Determine percent shear fracture',
        '9. Measure lateral expansion',
        '10. Assess ductile-brittle transition if multi-temp'
      ],
      outputFormat: 'JSON with impact testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['testType', 'averageEnergy', 'specimens', 'artifacts'],
      properties: {
        testType: { type: 'string', enum: ['Charpy', 'Izod'] },
        averageEnergy: { type: 'number', description: 'Joules' },
        energyValues: { type: 'array', items: { type: 'number' } },
        specimens: { type: 'number' },
        shearFraction: { type: 'number', description: 'percent' },
        lateralExpansion: { type: 'number', description: 'mm' },
        fractureAppearance: { type: 'string' },
        dbtt: { type: 'number', description: 'Ductile-brittle transition temperature' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'impact', 'charpy', 'materials-science']
}));

// Task 6: Bend Testing
export const bendTestingTask = defineTask('bend-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bend Testing - ${args.sampleId}`,
  agent: {
    name: 'bend-test-specialist',
    prompt: {
      role: 'Bend Testing Specialist',
      task: 'Perform bend testing per ASTM E290/E855',
      context: args,
      instructions: [
        '1. Configure 3-point or 4-point bend fixture',
        '2. Set span length',
        '3. Position specimen on supports',
        '4. Apply load at controlled rate',
        '5. Record load-deflection data',
        '6. Calculate flexural stress and strain',
        '7. Determine flexural strength',
        '8. Determine flexural modulus',
        '9. Note failure mode and location',
        '10. Examine specimen for cracking'
      ],
      outputFormat: 'JSON with bend testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['flexuralStrength', 'flexuralModulus', 'artifacts'],
      properties: {
        flexuralStrength: { type: 'number', description: 'MPa' },
        flexuralModulus: { type: 'number', description: 'GPa' },
        bendType: { type: 'string' },
        span: { type: 'number', description: 'mm' },
        failureMode: { type: 'string' },
        rawDataPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'bend', 'flexural', 'materials-science']
}));

// Task 7: Statistical Analysis
export const mechanicalStatisticsTask = defineTask('mechanical-statistics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Testing Statistics - ${args.sampleId}`,
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Materials Testing Statistician',
      task: 'Perform statistical analysis of mechanical test data',
      context: args,
      instructions: [
        '1. Calculate mean values for all properties',
        '2. Calculate standard deviations',
        '3. Calculate coefficients of variation',
        '4. Identify and handle outliers',
        '5. Calculate confidence intervals',
        '6. Assess data normality',
        '7. Compare with specification limits',
        '8. Determine statistical significance',
        '9. Generate summary statistics table',
        '10. Document statistical methods used'
      ],
      outputFormat: 'JSON with statistical analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            meanValues: { type: 'object' },
            standardDeviations: { type: 'object' },
            coefficientsOfVariation: { type: 'object' },
            confidenceIntervals: { type: 'object' }
          }
        },
        outliers: { type: 'array', items: { type: 'object' } },
        normalityTests: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanical-testing', 'statistics', 'materials-science']
}));

// Task 8: Report Generation
export const mechanicalReportTask = defineTask('mechanical-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Testing Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Mechanical Testing Technical Writer',
      task: 'Generate comprehensive mechanical testing report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document test methods and standards',
        '3. Include specimen details',
        '4. Present test results with statistics',
        '5. Include stress-strain curves',
        '6. Present fracture images if applicable',
        '7. Compare with specifications',
        '8. Discuss material behavior',
        '9. Add conclusions and recommendations',
        '10. Format per laboratory requirements'
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
  labels: ['agent', 'mechanical-testing', 'report', 'documentation', 'materials-science']
}));
