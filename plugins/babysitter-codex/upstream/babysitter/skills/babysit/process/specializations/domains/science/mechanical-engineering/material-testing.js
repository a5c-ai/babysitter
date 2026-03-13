/**
 * @process specializations/domains/science/mechanical-engineering/material-testing
 * @description Material Testing and Characterization - Planning and executing mechanical tests
 * (tensile, hardness, impact, fatigue) per ASTM standards to determine material properties
 * and verify material specifications.
 * @inputs { projectName: string, material: string, testTypes: array, specimens: number }
 * @outputs { success: boolean, testResults: object, properties: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/material-testing', {
 *   projectName: 'Steel Qualification',
 *   material: 'AISI 4340',
 *   testTypes: ['tensile', 'hardness', 'impact'],
 *   specimens: 5,
 *   specifications: { minYield: 862, minUltimate: 1000 }
 * });
 *
 * @references
 * - ASTM E8 - Tensile Testing: https://www.astm.org/e0008_e0008m-22.html
 * - ASTM E18 - Rockwell Hardness: https://www.astm.org/e0018-22.html
 * - ASTM E23 - Charpy Impact: https://www.astm.org/e0023-18.html
 * - ASTM E466 - Fatigue Testing: https://www.astm.org/e0466-21.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    material,
    testTypes = ['tensile', 'hardness'],
    specimens = 3,
    specifications = {},
    heatTreatment = null,
    testTemperature = 'room',
    outputDir = 'material-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const allResults = {};

  ctx.log('info', `Starting Material Testing for ${projectName}`);
  ctx.log('info', `Material: ${material}, Tests: ${testTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: TEST PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Test Planning');

  const planningResult = await ctx.task(testPlanningTask, {
    projectName,
    material,
    testTypes,
    specimens,
    specifications,
    testTemperature,
    outputDir
  });

  artifacts.push(...planningResult.artifacts);

  ctx.log('info', `Test plan created - ${planningResult.totalTests} tests planned`);

  // ============================================================================
  // PHASE 2: SPECIMEN PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specimen Preparation');

  const specimenResult = await ctx.task(specimenPreparationTask, {
    projectName,
    material,
    testTypes,
    specimens,
    heatTreatment,
    planningResult,
    outputDir
  });

  artifacts.push(...specimenResult.artifacts);

  ctx.log('info', `Specimens prepared - ${specimenResult.specimensPrepared} total`);

  // Breakpoint: Specimen verification
  await ctx.breakpoint({
    question: `Specimens prepared. ${specimenResult.specimensPrepared} specimens ready for testing. Dimensional verification complete. Proceed with testing?`,
    title: 'Specimen Preparation Review',
    context: {
      runId: ctx.runId,
      specimens: specimenResult.specimenList,
      dimensions: specimenResult.dimensions,
      files: specimenResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: TENSILE TESTING
  // ============================================================================

  if (testTypes.includes('tensile')) {
    ctx.log('info', 'Phase 3: Tensile Testing (ASTM E8)');

    const tensileResult = await ctx.task(tensileTestingTask, {
      projectName,
      material,
      specimens,
      specimenResult,
      testTemperature,
      specifications,
      outputDir
    });

    artifacts.push(...tensileResult.artifacts);
    allResults.tensile = tensileResult;

    ctx.log('info', `Tensile testing complete - Yield: ${tensileResult.averageYield} MPa, UTS: ${tensileResult.averageUTS} MPa`);

    // Quality Gate: Specification compliance
    if (specifications.minYield && tensileResult.averageYield < specifications.minYield) {
      await ctx.breakpoint({
        question: `Yield strength ${tensileResult.averageYield} MPa below specification ${specifications.minYield} MPa. Material fails to meet requirements. Review test data?`,
        title: 'Tensile Test Failure',
        context: {
          runId: ctx.runId,
          testResults: tensileResult.individualResults,
          statistics: tensileResult.statistics,
          files: tensileResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 4: HARDNESS TESTING
  // ============================================================================

  if (testTypes.includes('hardness')) {
    ctx.log('info', 'Phase 4: Hardness Testing (ASTM E18)');

    const hardnessResult = await ctx.task(hardnessTestingTask, {
      projectName,
      material,
      specimens,
      specimenResult,
      specifications,
      outputDir
    });

    artifacts.push(...hardnessResult.artifacts);
    allResults.hardness = hardnessResult;

    ctx.log('info', `Hardness testing complete - Average: ${hardnessResult.averageHardness} ${hardnessResult.scale}`);
  }

  // ============================================================================
  // PHASE 5: IMPACT TESTING
  // ============================================================================

  if (testTypes.includes('impact')) {
    ctx.log('info', 'Phase 5: Impact Testing (ASTM E23)');

    const impactResult = await ctx.task(impactTestingTask, {
      projectName,
      material,
      specimens,
      specimenResult,
      testTemperature,
      specifications,
      outputDir
    });

    artifacts.push(...impactResult.artifacts);
    allResults.impact = impactResult;

    ctx.log('info', `Impact testing complete - Average: ${impactResult.averageEnergy} J`);
  }

  // ============================================================================
  // PHASE 6: FATIGUE TESTING (IF REQUESTED)
  // ============================================================================

  if (testTypes.includes('fatigue')) {
    ctx.log('info', 'Phase 6: Fatigue Testing (ASTM E466)');

    const fatigueResult = await ctx.task(fatigueTestingTask, {
      projectName,
      material,
      specimens,
      specimenResult,
      specifications,
      outputDir
    });

    artifacts.push(...fatigueResult.artifacts);
    allResults.fatigue = fatigueResult;

    ctx.log('info', `Fatigue testing complete - Endurance limit: ${fatigueResult.enduranceLimit} MPa`);
  }

  // ============================================================================
  // PHASE 7: METALLOGRAPHIC EXAMINATION
  // ============================================================================

  if (testTypes.includes('metallography')) {
    ctx.log('info', 'Phase 7: Metallographic Examination');

    const metalloResult = await ctx.task(metallographyTask, {
      projectName,
      material,
      specimenResult,
      heatTreatment,
      outputDir
    });

    artifacts.push(...metalloResult.artifacts);
    allResults.metallography = metalloResult;

    ctx.log('info', `Metallography complete - Grain size: ASTM ${metalloResult.grainSize}`);
  }

  // ============================================================================
  // PHASE 8: DATA ANALYSIS AND STATISTICS
  // ============================================================================

  ctx.log('info', 'Phase 8: Data Analysis and Statistics');

  const analysisResult = await ctx.task(dataAnalysisTask, {
    projectName,
    material,
    allResults,
    specifications,
    outputDir
  });

  artifacts.push(...analysisResult.artifacts);

  ctx.log('info', `Data analysis complete - Overall compliance: ${analysisResult.overallCompliance}`);

  // ============================================================================
  // PHASE 9: GENERATE TEST REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Test Report');

  const reportResult = await ctx.task(generateTestReportTask, {
    projectName,
    material,
    testTypes,
    planningResult,
    specimenResult,
    allResults,
    analysisResult,
    specifications,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Material Testing Complete for ${projectName}. Compliance: ${analysisResult.overallCompliance}. ${analysisResult.passCount}/${analysisResult.totalTests} tests passed. Approve test report?`,
    title: 'Material Testing Complete',
    context: {
      runId: ctx.runId,
      summary: {
        material,
        testTypes,
        overallCompliance: analysisResult.overallCompliance,
        passCount: analysisResult.passCount,
        totalTests: analysisResult.totalTests
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Test Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    material,
    testResults: allResults,
    properties: analysisResult.derivedProperties,
    compliance: {
      overall: analysisResult.overallCompliance,
      details: analysisResult.complianceDetails
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/material-testing',
      processSlug: 'material-testing',
      category: 'mechanical-engineering',
      timestamp: startTime,
      testTypes
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testPlanningTask = defineTask('test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Create material testing plan',
      context: {
        projectName: args.projectName,
        material: args.material,
        testTypes: args.testTypes,
        specimens: args.specimens,
        specifications: args.specifications,
        testTemperature: args.testTemperature,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify applicable test standards:',
        '   - ASTM E8 for tensile',
        '   - ASTM E18 for hardness',
        '   - ASTM E23 for impact',
        '2. Define specimen requirements per standard',
        '3. Determine number of specimens per test',
        '4. Define test conditions (temperature, rate)',
        '5. Identify required equipment',
        '6. Create test matrix',
        '7. Define acceptance criteria',
        '8. Create test procedure'
      ],
      outputFormat: 'JSON object with test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'testMatrix', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        testMatrix: { type: 'object' },
        specimenRequirements: { type: 'object' },
        testConditions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'planning']
}));

export const specimenPreparationTask = defineTask('specimen-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specimen Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Technician',
      task: 'Prepare test specimens',
      context: {
        projectName: args.projectName,
        material: args.material,
        testTypes: args.testTypes,
        specimens: args.specimens,
        heatTreatment: args.heatTreatment,
        planningResult: args.planningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Machine specimens per ASTM requirements:',
        '   - Tensile: dog-bone geometry',
        '   - Impact: Charpy V-notch',
        '   - Hardness: flat surface',
        '2. Apply heat treatment if required',
        '3. Measure and record dimensions',
        '4. Mark specimen identification',
        '5. Verify surface finish',
        '6. Document material traceability',
        '7. Create specimen log'
      ],
      outputFormat: 'JSON object with specimen preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specimensPrepared', 'specimenList', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specimensPrepared: { type: 'number' },
        specimenList: { type: 'array' },
        dimensions: { type: 'object' },
        traceability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'specimen-preparation']
}));

export const tensileTestingTask = defineTask('tensile-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tensile Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Perform tensile testing per ASTM E8',
      context: {
        projectName: args.projectName,
        material: args.material,
        specimens: args.specimens,
        specimenResult: args.specimenResult,
        testTemperature: args.testTemperature,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify testing machine calibration',
        '2. Install extensometer',
        '3. Set strain rate per ASTM E8',
        '4. Mount specimen in grips',
        '5. Record stress-strain curve',
        '6. Determine:',
        '   - Yield strength (0.2% offset)',
        '   - Ultimate tensile strength',
        '   - Elongation at fracture',
        '   - Reduction in area',
        '   - Elastic modulus',
        '7. Examine fracture surface',
        '8. Calculate statistics'
      ],
      outputFormat: 'JSON object with tensile test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'averageYield', 'averageUTS', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        averageYield: { type: 'number' },
        averageUTS: { type: 'number' },
        averageElongation: { type: 'number' },
        averageRA: { type: 'number' },
        elasticModulus: { type: 'number' },
        individualResults: { type: 'array' },
        statistics: { type: 'object' },
        stressStrainCurves: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'tensile', 'astm-e8']
}));

export const hardnessTestingTask = defineTask('hardness-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hardness Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Perform hardness testing per ASTM E18',
      context: {
        projectName: args.projectName,
        material: args.material,
        specimens: args.specimens,
        specimenResult: args.specimenResult,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate scale:',
        '   - Rockwell (HRC, HRB)',
        '   - Brinell (HB)',
        '   - Vickers (HV)',
        '2. Verify test blocks',
        '3. Prepare specimen surface',
        '4. Make minimum 3 indentations per specimen',
        '5. Avoid edge effects and spacing',
        '6. Record all readings',
        '7. Calculate average and standard deviation',
        '8. Convert between scales if needed'
      ],
      outputFormat: 'JSON object with hardness test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'averageHardness', 'scale', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        averageHardness: { type: 'number' },
        scale: { type: 'string' },
        individualReadings: { type: 'array' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'hardness', 'astm-e18']
}));

export const impactTestingTask = defineTask('impact-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Impact Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Perform Charpy impact testing per ASTM E23',
      context: {
        projectName: args.projectName,
        material: args.material,
        specimens: args.specimens,
        specimenResult: args.specimenResult,
        testTemperature: args.testTemperature,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify pendulum machine calibration',
        '2. Condition specimens to test temperature',
        '3. Position specimen on anvil',
        '4. Release pendulum and record energy',
        '5. Examine fracture surface:',
        '   - Percent shear',
        '   - Lateral expansion',
        '6. Test at multiple temperatures if DBTT curve needed',
        '7. Calculate statistics',
        '8. Determine fracture mode'
      ],
      outputFormat: 'JSON object with impact test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'averageEnergy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        averageEnergy: { type: 'number' },
        individualResults: { type: 'array' },
        percentShear: { type: 'number' },
        lateralExpansion: { type: 'number' },
        fractureMode: { type: 'string' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'impact', 'charpy', 'astm-e23']
}));

export const fatigueTestingTask = defineTask('fatigue-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Perform fatigue testing per ASTM E466',
      context: {
        projectName: args.projectName,
        material: args.material,
        specimens: args.specimens,
        specimenResult: args.specimenResult,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select fatigue test type:',
        '   - Rotating beam',
        '   - Axial fatigue',
        '2. Define load ratio (R)',
        '3. Test at multiple stress levels',
        '4. Record cycles to failure',
        '5. Identify runout specimens (>10^7)',
        '6. Plot S-N curve',
        '7. Determine endurance limit',
        '8. Examine fracture origins'
      ],
      outputFormat: 'JSON object with fatigue test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'enduranceLimit', 'snData', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        enduranceLimit: { type: 'number' },
        snData: { type: 'array' },
        snCurveParameters: { type: 'object' },
        fractureOrigins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'fatigue', 'astm-e466']
}));

export const metallographyTask = defineTask('metallography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metallography - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metallurgist',
      task: 'Perform metallographic examination',
      context: {
        projectName: args.projectName,
        material: args.material,
        specimenResult: args.specimenResult,
        heatTreatment: args.heatTreatment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Section and mount specimen',
        '2. Grind and polish surface',
        '3. Etch with appropriate reagent',
        '4. Examine microstructure:',
        '   - Grain size (ASTM E112)',
        '   - Phase identification',
        '   - Inclusion rating (ASTM E45)',
        '5. Document microstructure',
        '6. Compare to specifications',
        '7. Capture micrographs',
        '8. Prepare metallography report'
      ],
      outputFormat: 'JSON object with metallography results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'grainSize', 'microstructure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        grainSize: { type: 'number' },
        microstructure: { type: 'string' },
        phases: { type: 'array' },
        inclusionRating: { type: 'object' },
        micrographs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'metallography']
}));

export const dataAnalysisTask = defineTask('data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Analyze test data and verify compliance',
      context: {
        projectName: args.projectName,
        material: args.material,
        allResults: args.allResults,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate statistics for each test:',
        '   - Mean, standard deviation',
        '   - Coefficient of variation',
        '2. Check for outliers',
        '3. Compare to specifications',
        '4. Determine pass/fail status',
        '5. Correlate properties (hardness-strength)',
        '6. Derive additional properties',
        '7. Calculate overall compliance',
        '8. Generate data summary'
      ],
      outputFormat: 'JSON object with data analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallCompliance', 'derivedProperties', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallCompliance: { type: 'string' },
        passCount: { type: 'number' },
        totalTests: { type: 'number' },
        complianceDetails: { type: 'object' },
        derivedProperties: { type: 'object' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'data-analysis']
}));

export const generateTestReportTask = defineTask('generate-test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Test Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate material test report',
      context: {
        projectName: args.projectName,
        material: args.material,
        testTypes: args.testTypes,
        planningResult: args.planningResult,
        specimenResult: args.specimenResult,
        allResults: args.allResults,
        analysisResult: args.analysisResult,
        specifications: args.specifications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create cover page with material ID',
        '2. Document test conditions',
        '3. Present specimen details',
        '4. Present all test results',
        '5. Include stress-strain curves',
        '6. Include micrographs',
        '7. Present statistical analysis',
        '8. State compliance status',
        '9. Certify test results',
        '10. Include test certificates'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        certificationNumber: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'testing', 'reporting']
}));
