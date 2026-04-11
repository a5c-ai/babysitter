/**
 * @process specializations/domains/science/aerospace-engineering/propulsion-system-testing
 * @description Structured approach to propulsion system ground testing including test cell preparation,
 * instrumentation setup, data acquisition, and performance validation.
 * @inputs { projectName: string, engineConfiguration: object, testObjectives: array, testFacility?: object }
 * @outputs { success: boolean, testResults: object, performanceValidation: object, testReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/propulsion-system-testing', {
 *   projectName: 'Turbofan Development Test',
 *   engineConfiguration: { type: 'turbofan', thrust: 25000 },
 *   testObjectives: ['performance-mapping', 'operability', 'durability'],
 *   testFacility: { name: 'Sea-Level Test Cell', altitude: false }
 * });
 *
 * @references
 * - SAE ARP1420: Gas Turbine Engine Test Practices
 * - AIAA S-120: Engine Test Facility Standards
 * - NASA Test Operations Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    engineConfiguration,
    testObjectives,
    testFacility = {}
  } = inputs;

  // Phase 1: Test Planning and Requirements
  const testPlanning = await ctx.task(testPlanningTask, {
    projectName,
    engineConfiguration,
    testObjectives,
    testFacility
  });

  // Phase 2: Test Cell Preparation
  const cellPreparation = await ctx.task(cellPreparationTask, {
    projectName,
    testPlan: testPlanning,
    engineConfiguration,
    testFacility
  });

  // Breakpoint: Test readiness review
  await ctx.breakpoint({
    question: `Test cell preparation complete for ${projectName}. All systems ready? Proceed with instrumentation setup?`,
    title: 'Test Readiness Review',
    context: {
      runId: ctx.runId,
      facilityStatus: cellPreparation.facilityStatus,
      safetyChecklist: cellPreparation.safetyChecklist
    }
  });

  // Phase 3: Instrumentation Setup
  const instrumentation = await ctx.task(instrumentationSetupTask, {
    projectName,
    testPlan: testPlanning,
    engineConfiguration,
    measurementRequirements: testPlanning.measurementRequirements
  });

  // Phase 4: Data Acquisition Configuration
  const dataAcquisition = await ctx.task(dataAcquisitionTask, {
    projectName,
    instrumentation,
    testPlan: testPlanning,
    samplingRequirements: testPlanning.samplingRequirements
  });

  // Phase 5: Pre-Test Checkout
  const preTestCheckout = await ctx.task(preTestCheckoutTask, {
    projectName,
    cellPreparation,
    instrumentation,
    dataAcquisition,
    engineConfiguration
  });

  // Quality Gate: Pre-test readiness
  if (!preTestCheckout.allSystemsGo) {
    await ctx.breakpoint({
      question: `Pre-test checkout found issues: ${preTestCheckout.issues.join(', ')}. Resolve issues before proceeding?`,
      title: 'Pre-Test Checkout Issues',
      context: {
        runId: ctx.runId,
        checkoutResults: preTestCheckout,
        recommendation: 'Address all open items before test execution'
      }
    });
  }

  // Phase 6: Test Execution
  const testExecution = await ctx.task(testExecutionTask, {
    projectName,
    testPlan: testPlanning,
    testPoints: testPlanning.testMatrix,
    safetyLimits: testPlanning.safetyLimits
  });

  // Phase 7: Real-Time Data Analysis
  const realTimeAnalysis = await ctx.task(realTimeAnalysisTask, {
    projectName,
    testData: testExecution.rawData,
    expectedPerformance: testPlanning.expectedPerformance,
    anomalyThresholds: testPlanning.anomalyThresholds
  });

  // Phase 8: Post-Test Processing
  const postTestProcessing = await ctx.task(postTestProcessingTask, {
    projectName,
    rawData: testExecution.rawData,
    instrumentation,
    correctionFactors: testPlanning.correctionFactors
  });

  // Phase 9: Performance Validation
  const performanceValidation = await ctx.task(performanceValidationTask, {
    projectName,
    processedData: postTestProcessing,
    specifications: engineConfiguration.specifications,
    testObjectives
  });

  // Phase 10: Test Report Generation
  const testReport = await ctx.task(testReportTask, {
    projectName,
    testPlanning,
    testExecution,
    postTestProcessing,
    performanceValidation
  });

  // Final Breakpoint: Test Results Review
  await ctx.breakpoint({
    question: `Test complete for ${projectName}. Performance validation: ${performanceValidation.overallStatus}. Approve test report?`,
    title: 'Test Results Approval',
    context: {
      runId: ctx.runId,
      summary: {
        testPoints: testExecution.completedPoints,
        performanceStatus: performanceValidation.overallStatus,
        anomalies: realTimeAnalysis.anomalies
      },
      files: [
        { path: 'artifacts/test-report.json', format: 'json', content: testReport },
        { path: 'artifacts/test-report.md', format: 'markdown', content: testReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    testResults: {
      completedPoints: testExecution.completedPoints,
      rawData: testExecution.rawData,
      processedData: postTestProcessing.correctedData
    },
    performanceValidation: performanceValidation,
    testReport: testReport,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/propulsion-system-testing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const testPlanningTask = defineTask('test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Propulsion Test Engineer specializing in test planning',
      task: 'Develop comprehensive propulsion test plan',
      context: {
        projectName: args.projectName,
        engineConfiguration: args.engineConfiguration,
        testObjectives: args.testObjectives,
        testFacility: args.testFacility
      },
      instructions: [
        '1. Define test objectives and success criteria',
        '2. Develop test matrix with operating conditions',
        '3. Define measurement requirements and accuracy',
        '4. Establish safety limits and abort criteria',
        '5. Define data sampling rates and storage requirements',
        '6. Develop test procedures and sequences',
        '7. Define expected performance baselines',
        '8. Establish anomaly detection thresholds',
        '9. Plan for contingencies and off-nominal conditions',
        '10. Document test plan with schedule and resources'
      ],
      outputFormat: 'JSON object with comprehensive test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testMatrix', 'measurementRequirements', 'safetyLimits'],
      properties: {
        testMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pointId: { type: 'number' },
              condition: { type: 'object' },
              duration: { type: 'number' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        measurementRequirements: { type: 'array', items: { type: 'object' } },
        samplingRequirements: { type: 'object' },
        safetyLimits: { type: 'object' },
        expectedPerformance: { type: 'object' },
        anomalyThresholds: { type: 'object' },
        correctionFactors: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'planning', 'aerospace']
}));

export const cellPreparationTask = defineTask('cell-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Cell Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Facility Operations Engineer',
      task: 'Prepare test cell for propulsion testing',
      context: {
        projectName: args.projectName,
        testPlan: args.testPlan,
        engineConfiguration: args.engineConfiguration,
        testFacility: args.testFacility
      },
      instructions: [
        '1. Verify test cell configuration and capabilities',
        '2. Prepare engine mounting and thrust stand',
        '3. Configure inlet and exhaust systems',
        '4. Set up fuel and oil supply systems',
        '5. Verify cooling and fire suppression systems',
        '6. Complete facility safety inspection',
        '7. Calibrate thrust measurement system',
        '8. Verify control room systems',
        '9. Complete pre-test safety checklist',
        '10. Document facility readiness status'
      ],
      outputFormat: 'JSON object with facility preparation status'
    },
    outputSchema: {
      type: 'object',
      required: ['facilityStatus', 'safetyChecklist'],
      properties: {
        facilityStatus: {
          type: 'object',
          properties: {
            thrustStand: { type: 'string' },
            inletSystem: { type: 'string' },
            exhaustSystem: { type: 'string' },
            fuelSystem: { type: 'string' },
            safetySystem: { type: 'string' }
          }
        },
        safetyChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' },
              verifiedBy: { type: 'string' }
            }
          }
        },
        calibrationStatus: { type: 'object' },
        readyForTest: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'facility', 'aerospace']
}));

export const instrumentationSetupTask = defineTask('instrumentation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Instrumentation Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Propulsion Instrumentation Engineer',
      task: 'Configure test instrumentation system',
      context: {
        projectName: args.projectName,
        testPlan: args.testPlan,
        engineConfiguration: args.engineConfiguration,
        measurementRequirements: args.measurementRequirements
      },
      instructions: [
        '1. Install pressure transducers at specified locations',
        '2. Install temperature sensors (thermocouples, RTDs)',
        '3. Configure flow measurement devices',
        '4. Install vibration accelerometers',
        '5. Set up speed and position sensors',
        '6. Configure strain gauges if required',
        '7. Verify sensor calibrations and ranges',
        '8. Complete wiring and shielding checks',
        '9. Perform end-to-end signal verification',
        '10. Document instrumentation configuration'
      ],
      outputFormat: 'JSON object with instrumentation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['sensors', 'calibrations'],
      properties: {
        sensors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              range: { type: 'object' },
              accuracy: { type: 'number' }
            }
          }
        },
        calibrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensorId: { type: 'string' },
              calibrationDate: { type: 'string' },
              coefficients: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        signalVerification: { type: 'object' },
        totalChannels: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'instrumentation', 'aerospace']
}));

export const dataAcquisitionTask = defineTask('data-acquisition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Acquisition Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Acquisition Systems Engineer',
      task: 'Configure data acquisition system for test',
      context: {
        projectName: args.projectName,
        instrumentation: args.instrumentation,
        testPlan: args.testPlan,
        samplingRequirements: args.samplingRequirements
      },
      instructions: [
        '1. Configure DAS channel assignments',
        '2. Set sampling rates per measurement type',
        '3. Configure anti-aliasing filters',
        '4. Set up data recording parameters',
        '5. Configure real-time display screens',
        '6. Set up alarm and limit monitoring',
        '7. Configure data archiving and backup',
        '8. Verify time synchronization',
        '9. Test data recording and playback',
        '10. Document DAS configuration'
      ],
      outputFormat: 'JSON object with DAS configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'samplingRates'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            totalChannels: { type: 'number' },
            recordingFormat: { type: 'string' },
            storageCapacity: { type: 'string' }
          }
        },
        samplingRates: {
          type: 'object',
          properties: {
            steadyState: { type: 'number' },
            transient: { type: 'number' },
            highSpeed: { type: 'number' }
          }
        },
        alarms: { type: 'array', items: { type: 'object' } },
        displays: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'data-acquisition', 'aerospace']
}));

export const preTestCheckoutTask = defineTask('pre-test-checkout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Test Checkout - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Operations Engineer',
      task: 'Complete pre-test checkout procedures',
      context: {
        projectName: args.projectName,
        cellPreparation: args.cellPreparation,
        instrumentation: args.instrumentation,
        dataAcquisition: args.dataAcquisition,
        engineConfiguration: args.engineConfiguration
      },
      instructions: [
        '1. Verify all instrumentation readings nominal',
        '2. Complete engine pre-start checks',
        '3. Verify fuel and oil quantities',
        '4. Complete control system functional check',
        '5. Verify safety system functionality',
        '6. Conduct dry run of test sequence',
        '7. Verify communication systems',
        '8. Complete personnel safety briefing',
        '9. Obtain test authorization',
        '10. Document checkout completion status'
      ],
      outputFormat: 'JSON object with checkout results'
    },
    outputSchema: {
      type: 'object',
      required: ['allSystemsGo', 'checklistStatus'],
      properties: {
        allSystemsGo: { type: 'boolean' },
        checklistStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        authorization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'checkout', 'aerospace']
}));

export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Conductor',
      task: 'Execute propulsion test per approved plan',
      context: {
        projectName: args.projectName,
        testPlan: args.testPlan,
        testPoints: args.testPoints,
        safetyLimits: args.safetyLimits
      },
      instructions: [
        '1. Initiate engine start sequence',
        '2. Establish stable idle condition',
        '3. Execute test points per matrix',
        '4. Monitor safety parameters continuously',
        '5. Record steady-state data at each point',
        '6. Execute transient maneuvers as required',
        '7. Document any deviations from plan',
        '8. Execute controlled shutdown',
        '9. Perform post-shutdown checks',
        '10. Document test execution summary'
      ],
      outputFormat: 'JSON object with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['completedPoints', 'rawData'],
      properties: {
        completedPoints: { type: 'number' },
        rawData: {
          type: 'object',
          properties: {
            steadyState: { type: 'array', items: { type: 'object' } },
            transient: { type: 'array', items: { type: 'object' } }
          }
        },
        deviations: { type: 'array', items: { type: 'string' } },
        incidents: { type: 'array', items: { type: 'object' } },
        runTime: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'execution', 'aerospace']
}));

export const realTimeAnalysisTask = defineTask('real-time-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Real-Time Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Analyst',
      task: 'Perform real-time analysis of test data',
      context: {
        projectName: args.projectName,
        testData: args.testData,
        expectedPerformance: args.expectedPerformance,
        anomalyThresholds: args.anomalyThresholds
      },
      instructions: [
        '1. Monitor key performance parameters',
        '2. Compare measured vs expected performance',
        '3. Detect anomalies and trend deviations',
        '4. Flag exceedances of limits',
        '5. Calculate derived parameters in real-time',
        '6. Monitor stability indicators',
        '7. Track data quality metrics',
        '8. Generate alerts for off-nominal conditions',
        '9. Log observations and analysis notes',
        '10. Provide test conductor recommendations'
      ],
      outputFormat: 'JSON object with real-time analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceComparison', 'anomalies'],
      properties: {
        performanceComparison: {
          type: 'object',
          properties: {
            thrust: { type: 'object' },
            fuelFlow: { type: 'object' },
            temperatures: { type: 'object' }
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number' },
              parameter: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        alerts: { type: 'array', items: { type: 'object' } },
        dataQuality: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'analysis', 'aerospace']
}));

export const postTestProcessingTask = defineTask('post-test-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Test Data Processing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Processing Engineer',
      task: 'Process and correct raw test data',
      context: {
        projectName: args.projectName,
        rawData: args.rawData,
        instrumentation: args.instrumentation,
        correctionFactors: args.correctionFactors
      },
      instructions: [
        '1. Apply calibration corrections to raw data',
        '2. Remove spurious data points and dropouts',
        '3. Apply pressure and temperature corrections',
        '4. Correct for installation effects',
        '5. Calculate derived parameters',
        '6. Apply thrust stand tare corrections',
        '7. Correct to standard day conditions',
        '8. Calculate performance parameters (SFC, efficiency)',
        '9. Generate time-averaged steady-state data',
        '10. Document all corrections applied'
      ],
      outputFormat: 'JSON object with processed data'
    },
    outputSchema: {
      type: 'object',
      required: ['correctedData', 'corrections'],
      properties: {
        correctedData: {
          type: 'object',
          properties: {
            steadyState: { type: 'array', items: { type: 'object' } },
            standardDay: { type: 'array', items: { type: 'object' } }
          }
        },
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              magnitude: { type: 'number' },
              appliedTo: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataQualityReport: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'processing', 'aerospace']
}));

export const performanceValidationTask = defineTask('performance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Propulsion Performance Engineer',
      task: 'Validate engine performance against specifications',
      context: {
        projectName: args.projectName,
        processedData: args.processedData,
        specifications: args.specifications,
        testObjectives: args.testObjectives
      },
      instructions: [
        '1. Compare thrust performance to specification',
        '2. Validate fuel consumption (SFC)',
        '3. Verify operability margins (surge, stall)',
        '4. Validate temperature margins',
        '5. Verify response times and dynamics',
        '6. Compare with previous test or CFD predictions',
        '7. Assess performance repeatability',
        '8. Calculate performance guarantees',
        '9. Identify any specification non-compliances',
        '10. Document validation status and findings'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallStatus', 'parameterValidation'],
      properties: {
        overallStatus: { type: 'string', enum: ['validated', 'conditional', 'failed'] },
        parameterValidation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              measured: { type: 'number' },
              specification: { type: 'number' },
              margin: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        nonCompliances: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'validation', 'aerospace']
}));

export const testReportTask = defineTask('test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Report Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Propulsion Test Report Engineer',
      task: 'Generate comprehensive propulsion test report',
      context: {
        projectName: args.projectName,
        testPlanning: args.testPlanning,
        testExecution: args.testExecution,
        postTestProcessing: args.postTestProcessing,
        performanceValidation: args.performanceValidation
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document test objectives and configuration',
        '3. Describe test setup and instrumentation',
        '4. Present test execution summary',
        '5. Document all data corrections applied',
        '6. Present performance validation results',
        '7. Include performance plots and tables',
        '8. Document anomalies and observations',
        '9. Provide conclusions and recommendations',
        '10. Generate both JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete test report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            testConfiguration: { type: 'object' },
            executionSummary: { type: 'object' },
            performanceResults: { type: 'object' },
            anomalies: { type: 'array', items: { type: 'object' } },
            conclusions: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'testing', 'reporting', 'aerospace']
}));
