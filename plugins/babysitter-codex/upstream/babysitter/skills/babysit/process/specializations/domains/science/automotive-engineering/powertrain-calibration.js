/**
 * @process specializations/domains/science/automotive-engineering/powertrain-calibration
 * @description Powertrain Calibration and Optimization - Calibrate and optimize powertrain systems for
 * performance, efficiency, emissions, and drivability across all operating conditions and ambient environments.
 * @inputs { projectName: string, powertrainType: string, calibrationScope?: string[], targetMarkets?: string[] }
 * @outputs { success: boolean, calibrationDatasets: object, optimizationReports: object, certificationData: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/powertrain-calibration', {
 *   projectName: 'BEV-Powertrain-Calibration',
 *   powertrainType: 'battery-electric',
 *   calibrationScope: ['performance', 'efficiency', 'drivability', 'thermal'],
 *   targetMarkets: ['North America', 'Europe', 'China']
 * });
 *
 * @references
 * - SAE J1634 Electric Vehicle Energy Consumption
 * - EPA CFR Title 40 Emissions Standards
 * - UN ECE R101 CO2 Emissions
 * - WLTP Test Procedure
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    powertrainType,
    calibrationScope = ['performance', 'efficiency', 'emissions', 'drivability'],
    targetMarkets = ['global']
  } = inputs;

  // Phase 1: Calibration Targets and Constraints
  const calibrationTargets = await ctx.task(calibrationTargetsTask, {
    projectName,
    powertrainType,
    calibrationScope,
    targetMarkets
  });

  // Quality Gate: Targets must be defined
  if (!calibrationTargets.targets) {
    return {
      success: false,
      error: 'Calibration targets not defined',
      phase: 'calibration-targets',
      calibrationDatasets: null
    };
  }

  // Phase 2: Test Plan Development
  const testPlan = await ctx.task(testPlanDevelopmentTask, {
    projectName,
    calibrationTargets,
    powertrainType,
    targetMarkets
  });

  // Breakpoint: Test plan review
  await ctx.breakpoint({
    question: `Review calibration test plan for ${projectName}. ${testPlan.testCases?.length || 0} test cases defined. Approve test plan?`,
    title: 'Calibration Test Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      testPlan,
      files: [{
        path: `artifacts/calibration-test-plan.json`,
        format: 'json',
        content: testPlan
      }]
    }
  });

  // Phase 3: Dynamometer Calibration
  const dynoCalibration = await ctx.task(dynoCalibrationTask, {
    projectName,
    powertrainType,
    calibrationTargets,
    testPlan
  });

  // Phase 4: Vehicle Calibration
  const vehicleCalibration = await ctx.task(vehicleCalibrationTask, {
    projectName,
    powertrainType,
    dynoCalibration,
    calibrationTargets
  });

  // Phase 5: Efficiency Optimization
  const efficiencyOptimization = await ctx.task(efficiencyOptimizationTask, {
    projectName,
    powertrainType,
    dynoCalibration,
    vehicleCalibration,
    calibrationTargets
  });

  // Phase 6: Environmental Validation
  const environmentalValidation = await ctx.task(environmentalValidationTask, {
    projectName,
    vehicleCalibration,
    efficiencyOptimization,
    targetMarkets
  });

  // Quality Gate: Environmental coverage
  if (environmentalValidation.coverage < 80) {
    await ctx.breakpoint({
      question: `Environmental validation coverage is ${environmentalValidation.coverage}%. Review gaps and approve extension?`,
      title: 'Environmental Validation Coverage',
      context: {
        runId: ctx.runId,
        environmentalValidation,
        recommendation: 'Extend testing to cover missing conditions'
      }
    });
  }

  // Phase 7: Certification Data Package
  const certificationPackage = await ctx.task(certificationPackageTask, {
    projectName,
    dynoCalibration,
    vehicleCalibration,
    efficiencyOptimization,
    environmentalValidation,
    targetMarkets
  });

  // Phase 8: Documentation and Release
  const calibrationRelease = await ctx.task(calibrationReleaseTask, {
    projectName,
    calibrationTargets,
    dynoCalibration,
    vehicleCalibration,
    efficiencyOptimization,
    environmentalValidation,
    certificationPackage
  });

  // Final Breakpoint: Calibration release approval
  await ctx.breakpoint({
    question: `Powertrain Calibration complete for ${projectName}. Ready for release. Approve calibration dataset?`,
    title: 'Calibration Release Approval',
    context: {
      runId: ctx.runId,
      projectName,
      calibrationSummary: calibrationRelease.summary,
      files: [
        { path: `artifacts/calibration-datasets.json`, format: 'json', content: calibrationRelease },
        { path: `artifacts/certification-data.json`, format: 'json', content: certificationPackage }
      ]
    }
  });

  return {
    success: true,
    projectName,
    calibrationDatasets: calibrationRelease.datasets,
    optimizationReports: {
      efficiency: efficiencyOptimization.reports,
      drivability: vehicleCalibration.drivabilityReport
    },
    certificationData: certificationPackage.data,
    environmentalCoverage: environmentalValidation.coverage,
    nextSteps: calibrationRelease.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/powertrain-calibration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const calibrationTargetsTask = defineTask('calibration-targets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Calibration Targets and Constraints - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Calibration Planning Engineer',
      task: 'Define calibration targets and constraints',
      context: {
        projectName: args.projectName,
        powertrainType: args.powertrainType,
        calibrationScope: args.calibrationScope,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Define performance calibration targets (acceleration, top speed)',
        '2. Define efficiency targets (range, consumption)',
        '3. Define emissions targets by market (if applicable)',
        '4. Define drivability targets',
        '5. Define NVH targets',
        '6. Define thermal limits and derating',
        '7. Specify ambient temperature range',
        '8. Define altitude range',
        '9. Establish calibration constraints',
        '10. Document trade-off boundaries'
      ],
      outputFormat: 'JSON object with calibration targets'
    },
    outputSchema: {
      type: 'object',
      required: ['targets', 'constraints', 'tradeoffs'],
      properties: {
        targets: {
          type: 'object',
          properties: {
            performance: { type: 'object' },
            efficiency: { type: 'object' },
            emissions: { type: 'object' },
            drivability: { type: 'object' },
            nvh: { type: 'object' }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            thermal: { type: 'object' },
            ambient: { type: 'object' },
            regulatory: { type: 'array', items: { type: 'object' } }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'targets', 'planning']
}));

export const testPlanDevelopmentTask = defineTask('test-plan-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Plan Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Calibration Test Engineer',
      task: 'Develop comprehensive calibration test plan',
      context: {
        projectName: args.projectName,
        calibrationTargets: args.calibrationTargets,
        powertrainType: args.powertrainType,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Define dynamometer test matrix',
        '2. Define vehicle test matrix',
        '3. Plan steady-state mapping tests',
        '4. Plan transient response tests',
        '5. Plan drive cycle tests',
        '6. Plan environmental chamber tests',
        '7. Define test sequences and dependencies',
        '8. Specify test equipment requirements',
        '9. Define data acquisition requirements',
        '10. Create test schedule'
      ],
      outputFormat: 'JSON object with calibration test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'schedule', 'equipment'],
      properties: {
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              type: { type: 'string' },
              environment: { type: 'string' },
              conditions: { type: 'object' },
              measurements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        schedule: { type: 'object' },
        equipment: { type: 'array', items: { type: 'object' } },
        dataAcquisition: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'test-planning', 'verification']
}));

export const dynoCalibrationTask = defineTask('dyno-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dynamometer Calibration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dynamometer Calibration Engineer',
      task: 'Execute dynamometer calibration and mapping',
      context: {
        projectName: args.projectName,
        powertrainType: args.powertrainType,
        calibrationTargets: args.calibrationTargets,
        testPlan: args.testPlan
      },
      instructions: [
        '1. Execute motor/engine mapping tests',
        '2. Calibrate torque control',
        '3. Map efficiency across operating range',
        '4. Calibrate thermal derating',
        '5. Tune control loop parameters',
        '6. Calibrate regenerative braking',
        '7. Map NVH characteristics',
        '8. Calibrate protection functions',
        '9. Validate against targets',
        '10. Document calibration parameters'
      ],
      outputFormat: 'JSON object with dyno calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationData', 'mappingData', 'validation'],
      properties: {
        calibrationData: {
          type: 'object',
          properties: {
            torqueControl: { type: 'object' },
            thermalDerating: { type: 'object' },
            controlLoops: { type: 'object' },
            protectionFunctions: { type: 'object' }
          }
        },
        mappingData: {
          type: 'object',
          properties: {
            efficiencyMap: { type: 'object' },
            torqueMap: { type: 'object' },
            nvhMap: { type: 'object' }
          }
        },
        validation: {
          type: 'object',
          properties: {
            targetsAchieved: { type: 'array', items: { type: 'object' } },
            gaps: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'dynamometer', 'mapping']
}));

export const vehicleCalibrationTask = defineTask('vehicle-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Vehicle Calibration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vehicle Calibration Engineer',
      task: 'Execute vehicle-level calibration',
      context: {
        projectName: args.projectName,
        powertrainType: args.powertrainType,
        dynoCalibration: args.dynoCalibration,
        calibrationTargets: args.calibrationTargets
      },
      instructions: [
        '1. Calibrate pedal map and driver interface',
        '2. Tune acceleration response',
        '3. Calibrate regenerative braking feel',
        '4. Tune tip-in/tip-out response',
        '5. Calibrate creep behavior',
        '6. Tune launch control',
        '7. Calibrate driving modes (eco/sport)',
        '8. Tune NVH at vehicle level',
        '9. Calibrate thermal management in vehicle',
        '10. Document drivability ratings'
      ],
      outputFormat: 'JSON object with vehicle calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationData', 'drivabilityReport', 'validation'],
      properties: {
        calibrationData: {
          type: 'object',
          properties: {
            pedalMap: { type: 'object' },
            accelerationTuning: { type: 'object' },
            regenBraking: { type: 'object' },
            drivingModes: { type: 'object' }
          }
        },
        drivabilityReport: {
          type: 'object',
          properties: {
            ratings: { type: 'object' },
            benchmarking: { type: 'object' },
            feedback: { type: 'array', items: { type: 'string' } }
          }
        },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'vehicle', 'drivability']
}));

export const efficiencyOptimizationTask = defineTask('efficiency-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Efficiency Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Efficiency Optimization Engineer',
      task: 'Optimize powertrain efficiency',
      context: {
        projectName: args.projectName,
        powertrainType: args.powertrainType,
        dynoCalibration: args.dynoCalibration,
        vehicleCalibration: args.vehicleCalibration,
        calibrationTargets: args.calibrationTargets
      },
      instructions: [
        '1. Optimize motor operating points',
        '2. Tune regenerative braking energy recovery',
        '3. Optimize thermal management energy use',
        '4. Tune auxiliary load management',
        '5. Optimize coasting and sailing strategies',
        '6. Tune predictive energy management',
        '7. Validate efficiency over drive cycles',
        '8. Analyze efficiency vs drivability trade-offs',
        '9. Document optimization results',
        '10. Calculate range improvement'
      ],
      outputFormat: 'JSON object with efficiency optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'optimization', 'results'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            efficiencyImprovement: { type: 'number' },
            rangeImprovement: { type: 'number' },
            driveCycleResults: { type: 'object' }
          }
        },
        optimization: {
          type: 'object',
          properties: {
            motorOptimization: { type: 'object' },
            regenOptimization: { type: 'object' },
            thermalOptimization: { type: 'object' }
          }
        },
        results: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'efficiency', 'optimization']
}));

export const environmentalValidationTask = defineTask('environmental-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Environmental Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Environmental Validation Engineer',
      task: 'Validate calibration across environmental conditions',
      context: {
        projectName: args.projectName,
        vehicleCalibration: args.vehicleCalibration,
        efficiencyOptimization: args.efficiencyOptimization,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Validate at cold temperatures (-30C to -10C)',
        '2. Validate at moderate temperatures (10C to 30C)',
        '3. Validate at hot temperatures (35C to 45C)',
        '4. Validate at altitude (up to 3000m)',
        '5. Validate in humidity extremes',
        '6. Validate cold start performance',
        '7. Validate hot soak conditions',
        '8. Document calibration adjustments needed',
        '9. Calculate environmental coverage',
        '10. Identify remaining gaps'
      ],
      outputFormat: 'JSON object with environmental validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validation', 'coverage', 'adjustments'],
      properties: {
        validation: {
          type: 'object',
          properties: {
            coldTemperature: { type: 'object' },
            moderateTemperature: { type: 'object' },
            hotTemperature: { type: 'object' },
            altitude: { type: 'object' }
          }
        },
        coverage: { type: 'number' },
        adjustments: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'environmental', 'validation']
}));

export const certificationPackageTask = defineTask('certification-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Certification Data Package - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Certification Data Engineer',
      task: 'Prepare certification data package',
      context: {
        projectName: args.projectName,
        dynoCalibration: args.dynoCalibration,
        vehicleCalibration: args.vehicleCalibration,
        efficiencyOptimization: args.efficiencyOptimization,
        environmentalValidation: args.environmentalValidation,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Compile EPA certification data',
        '2. Compile WLTP certification data',
        '3. Prepare emissions test data (if applicable)',
        '4. Document energy consumption values',
        '5. Prepare range certification data',
        '6. Document test conditions and corrections',
        '7. Prepare coast-down coefficients',
        '8. Document vehicle parameters',
        '9. Prepare market-specific data packages',
        '10. Create certification summary'
      ],
      outputFormat: 'JSON object with certification data'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'certificationValues', 'documentation'],
      properties: {
        data: {
          type: 'object',
          properties: {
            epa: { type: 'object' },
            wltp: { type: 'object' },
            emissions: { type: 'object' },
            range: { type: 'object' }
          }
        },
        certificationValues: {
          type: 'object',
          properties: {
            energyConsumption: { type: 'object' },
            range: { type: 'object' },
            co2: { type: 'object' }
          }
        },
        documentation: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'certification', 'regulatory']
}));

export const calibrationReleaseTask = defineTask('calibration-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation and Release - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Calibration Release Engineer',
      task: 'Prepare calibration release package',
      context: {
        projectName: args.projectName,
        calibrationTargets: args.calibrationTargets,
        dynoCalibration: args.dynoCalibration,
        vehicleCalibration: args.vehicleCalibration,
        efficiencyOptimization: args.efficiencyOptimization,
        environmentalValidation: args.environmentalValidation,
        certificationPackage: args.certificationPackage
      },
      instructions: [
        '1. Compile final calibration datasets',
        '2. Document calibration version',
        '3. Create calibration release notes',
        '4. Document known limitations',
        '5. Prepare calibration validation summary',
        '6. Create flashable calibration files',
        '7. Document parameter descriptions',
        '8. Prepare training documentation',
        '9. Define next steps for production',
        '10. Archive calibration artifacts'
      ],
      outputFormat: 'JSON object with calibration release'
    },
    outputSchema: {
      type: 'object',
      required: ['datasets', 'summary', 'nextSteps'],
      properties: {
        datasets: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            parameters: { type: 'object' },
            files: { type: 'array', items: { type: 'object' } }
          }
        },
        summary: {
          type: 'object',
          properties: {
            targetsAchieved: { type: 'number' },
            efficiency: { type: 'object' },
            performance: { type: 'object' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        releaseNotes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'calibration', 'release', 'documentation']
}));
