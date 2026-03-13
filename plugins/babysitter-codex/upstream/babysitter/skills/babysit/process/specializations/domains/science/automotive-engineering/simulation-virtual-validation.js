/**
 * @process specializations/domains/science/automotive-engineering/simulation-virtual-validation
 * @description Simulation and Virtual Validation - Develop simulation environments and execute virtual validation
 * of ADAS/AD systems using scenario-based testing, sensor models, and vehicle dynamics simulation.
 * @inputs { projectName: string, systemUnderTest: string, simulationType?: string[], coverageTargets?: object }
 * @outputs { success: boolean, simulationEnvironment: object, scenarioDatabase: object, validationReports: object, coverageAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/simulation-virtual-validation', {
 *   projectName: 'AD-Virtual-Validation-L3',
 *   systemUnderTest: 'Highway-Autopilot',
 *   simulationType: ['SIL', 'HIL', 'cloud-simulation'],
 *   coverageTargets: { scenarioCoverage: 95, oddCoverage: 90 }
 * });
 *
 * @references
 * - ISO 21448 SOTIF
 * - ASAM OpenSCENARIO Standard
 * - ASAM OpenDRIVE Standard
 * - ISO PAS 21448 Safety of the Intended Functionality
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    systemUnderTest,
    simulationType = ['SIL'],
    coverageTargets = {}
  } = inputs;

  // Phase 1: Digital Twin Development
  const digitalTwin = await ctx.task(digitalTwinTask, {
    projectName,
    systemUnderTest,
    simulationType
  });

  // Quality Gate: Digital twin must be validated
  if (!digitalTwin.validationStatus || digitalTwin.validationStatus !== 'validated') {
    await ctx.breakpoint({
      question: `Digital twin validation status: ${digitalTwin.validationStatus}. Review and approve before proceeding?`,
      title: 'Digital Twin Validation',
      context: {
        runId: ctx.runId,
        digitalTwin,
        recommendation: 'Validate digital twin fidelity against real-world data'
      }
    });
  }

  // Phase 2: Sensor Model Development
  const sensorModels = await ctx.task(sensorModelsTask, {
    projectName,
    systemUnderTest,
    digitalTwin
  });

  // Breakpoint: Sensor models review
  await ctx.breakpoint({
    question: `Review sensor models for ${projectName}. ${sensorModels.models?.length || 0} sensor models developed. Approve models?`,
    title: 'Sensor Models Review',
    context: {
      runId: ctx.runId,
      projectName,
      sensorModels,
      files: [{
        path: `artifacts/sensor-models.json`,
        format: 'json',
        content: sensorModels
      }]
    }
  });

  // Phase 3: Scenario Library Development
  const scenarioLibrary = await ctx.task(scenarioLibraryTask, {
    projectName,
    systemUnderTest,
    coverageTargets
  });

  // Phase 4: SIL Environment Setup
  const silEnvironment = await ctx.task(silEnvironmentTask, {
    projectName,
    systemUnderTest,
    digitalTwin,
    sensorModels,
    scenarioLibrary
  });

  // Phase 5: HIL Integration
  const hilIntegration = await ctx.task(hilIntegrationTask, {
    projectName,
    systemUnderTest,
    silEnvironment,
    simulationType
  });

  // Phase 6: Scenario-Based Testing
  const scenarioTesting = await ctx.task(scenarioTestingTask, {
    projectName,
    silEnvironment,
    hilIntegration,
    scenarioLibrary,
    coverageTargets
  });

  // Quality Gate: Coverage targets
  if (scenarioTesting.coverage < (coverageTargets.scenarioCoverage || 90)) {
    await ctx.breakpoint({
      question: `Scenario coverage is ${scenarioTesting.coverage}%. Below target of ${coverageTargets.scenarioCoverage || 90}%. Approve additional scenarios?`,
      title: 'Coverage Target Warning',
      context: {
        runId: ctx.runId,
        scenarioTesting,
        recommendation: 'Expand scenario library to improve coverage'
      }
    });
  }

  // Phase 7: Coverage Analysis
  const coverageAnalysis = await ctx.task(coverageAnalysisTask, {
    projectName,
    scenarioTesting,
    scenarioLibrary,
    coverageTargets
  });

  // Phase 8: Validation Report Generation
  const validationReport = await ctx.task(validationReportTask, {
    projectName,
    digitalTwin,
    sensorModels,
    scenarioLibrary,
    scenarioTesting,
    coverageAnalysis
  });

  // Final Breakpoint: Virtual validation approval
  await ctx.breakpoint({
    question: `Simulation and Virtual Validation complete for ${projectName}. Coverage: ${coverageAnalysis.overallCoverage}%. Approve virtual validation?`,
    title: 'Virtual Validation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      validationSummary: validationReport.summary,
      files: [
        { path: `artifacts/validation-reports.json`, format: 'json', content: validationReport },
        { path: `artifacts/coverage-analysis.json`, format: 'json', content: coverageAnalysis }
      ]
    }
  });

  return {
    success: true,
    projectName,
    simulationEnvironment: {
      digitalTwin: digitalTwin.environment,
      sensorModels: sensorModels.models,
      silEnvironment: silEnvironment.configuration,
      hilEnvironment: hilIntegration.configuration
    },
    scenarioDatabase: scenarioLibrary.database,
    validationReports: validationReport.reports,
    coverageAnalysis: coverageAnalysis.analysis,
    nextSteps: validationReport.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/simulation-virtual-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const digitalTwinTask = defineTask('digital-twin', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Digital Twin Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Digital Twin Engineer',
      task: 'Develop digital twin vehicle model for simulation',
      context: {
        projectName: args.projectName,
        systemUnderTest: args.systemUnderTest,
        simulationType: args.simulationType
      },
      instructions: [
        '1. Develop vehicle dynamics model',
        '2. Model powertrain characteristics',
        '3. Model brake system dynamics',
        '4. Model steering system',
        '5. Model tire characteristics',
        '6. Validate against real vehicle data',
        '7. Define model fidelity levels',
        '8. Create parametric model',
        '9. Document model assumptions',
        '10. Establish model versioning'
      ],
      outputFormat: 'JSON object with digital twin specification'
    },
    outputSchema: {
      type: 'object',
      required: ['environment', 'models', 'validationStatus'],
      properties: {
        environment: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            vehicleDynamics: { type: 'object' },
            powertrain: { type: 'object' },
            brakeSystem: { type: 'object' },
            steeringSystem: { type: 'object' }
          }
        },
        models: { type: 'array', items: { type: 'object' } },
        validationStatus: { type: 'string' },
        fidelityLevel: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'digital-twin', 'vehicle-model']
}));

export const sensorModelsTask = defineTask('sensor-models', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Sensor Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sensor Modeling Engineer',
      task: 'Develop sensor models for simulation',
      context: {
        projectName: args.projectName,
        systemUnderTest: args.systemUnderTest,
        digitalTwin: args.digitalTwin
      },
      instructions: [
        '1. Develop camera sensor model',
        '2. Develop radar sensor model',
        '3. Develop lidar sensor model (if applicable)',
        '4. Develop ultrasonic sensor model',
        '5. Model sensor noise and degradation',
        '6. Model environmental effects (rain, fog, glare)',
        '7. Validate against real sensor data',
        '8. Define sensor model fidelity levels',
        '9. Document model parameters',
        '10. Establish model calibration procedures'
      ],
      outputFormat: 'JSON object with sensor models'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'validation', 'fidelityLevels'],
      properties: {
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensorType: { type: 'string' },
              modelType: { type: 'string' },
              parameters: { type: 'object' },
              degradationModes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        validation: { type: 'object' },
        fidelityLevels: { type: 'object' },
        environmentalEffects: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'sensor-models', 'perception']
}));

export const scenarioLibraryTask = defineTask('scenario-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Scenario Library Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Engineer',
      task: 'Develop scenario library for virtual validation',
      context: {
        projectName: args.projectName,
        systemUnderTest: args.systemUnderTest,
        coverageTargets: args.coverageTargets
      },
      instructions: [
        '1. Define scenario categories (nominal, edge, corner)',
        '2. Develop OpenSCENARIO format scenarios',
        '3. Create road network in OpenDRIVE',
        '4. Define traffic participant behaviors',
        '5. Create parameterized scenario templates',
        '6. Map scenarios to ODD coverage',
        '7. Include regulatory test scenarios',
        '8. Develop edge case scenarios',
        '9. Create scenario variation engine',
        '10. Document scenario acceptance criteria'
      ],
      outputFormat: 'JSON object with scenario library'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'categories', 'coverage'],
      properties: {
        database: {
          type: 'object',
          properties: {
            totalScenarios: { type: 'number' },
            nominalScenarios: { type: 'number' },
            edgeCases: { type: 'number' },
            cornerCases: { type: 'number' }
          }
        },
        categories: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'scenarios', 'OpenSCENARIO']
}));

export const silEnvironmentTask = defineTask('sil-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: SIL Environment Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SIL Integration Engineer',
      task: 'Setup Software-in-the-Loop simulation environment',
      context: {
        projectName: args.projectName,
        systemUnderTest: args.systemUnderTest,
        digitalTwin: args.digitalTwin,
        sensorModels: args.sensorModels,
        scenarioLibrary: args.scenarioLibrary
      },
      instructions: [
        '1. Configure SIL simulation platform',
        '2. Integrate system under test software',
        '3. Configure sensor model interfaces',
        '4. Setup vehicle model integration',
        '5. Configure scenario execution engine',
        '6. Implement test automation framework',
        '7. Setup data logging and analysis',
        '8. Configure CI/CD integration',
        '9. Validate SIL fidelity',
        '10. Document SIL configuration'
      ],
      outputFormat: 'JSON object with SIL environment'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'integration', 'automation'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            sutIntegration: { type: 'object' },
            sensorInterfaces: { type: 'object' },
            vehicleModel: { type: 'object' }
          }
        },
        integration: { type: 'object' },
        automation: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            cicdIntegration: { type: 'boolean' },
            reporting: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'SIL', 'environment']
}));

export const hilIntegrationTask = defineTask('hil-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: HIL Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HIL Integration Engineer',
      task: 'Setup Hardware-in-the-Loop simulation integration',
      context: {
        projectName: args.projectName,
        systemUnderTest: args.systemUnderTest,
        silEnvironment: args.silEnvironment,
        simulationType: args.simulationType
      },
      instructions: [
        '1. Configure HIL test bench',
        '2. Integrate ECU hardware',
        '3. Setup real-time simulation',
        '4. Configure electrical interfaces',
        '5. Setup fault injection capability',
        '6. Implement residual bus simulation',
        '7. Configure sensor stimulus',
        '8. Setup data acquisition',
        '9. Validate HIL fidelity',
        '10. Document HIL configuration'
      ],
      outputFormat: 'JSON object with HIL integration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'testBench', 'capabilities'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            ecuIntegration: { type: 'object' },
            realTimeTarget: { type: 'object' }
          }
        },
        testBench: {
          type: 'object',
          properties: {
            electricalInterfaces: { type: 'array', items: { type: 'object' } },
            sensorStimulus: { type: 'array', items: { type: 'object' } },
            faultInjection: { type: 'object' }
          }
        },
        capabilities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'HIL', 'hardware']
}));

export const scenarioTestingTask = defineTask('scenario-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Scenario-Based Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Test Engineer',
      task: 'Execute scenario-based simulation testing',
      context: {
        projectName: args.projectName,
        silEnvironment: args.silEnvironment,
        hilIntegration: args.hilIntegration,
        scenarioLibrary: args.scenarioLibrary,
        coverageTargets: args.coverageTargets
      },
      instructions: [
        '1. Execute nominal scenario tests',
        '2. Execute edge case tests',
        '3. Execute regulatory scenario tests',
        '4. Perform parameter variation testing',
        '5. Execute fault injection tests',
        '6. Analyze test results',
        '7. Identify failed scenarios',
        '8. Calculate scenario coverage',
        '9. Track regression results',
        '10. Document test outcomes'
      ],
      outputFormat: 'JSON object with scenario testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'coverage', 'failures'],
      properties: {
        results: {
          type: 'object',
          properties: {
            totalExecuted: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            blocked: { type: 'number' }
          }
        },
        coverage: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        regressionStatus: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'scenario-testing', 'validation']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Coverage Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Coverage Analysis Engineer',
      task: 'Analyze simulation coverage and identify gaps',
      context: {
        projectName: args.projectName,
        scenarioTesting: args.scenarioTesting,
        scenarioLibrary: args.scenarioLibrary,
        coverageTargets: args.coverageTargets
      },
      instructions: [
        '1. Calculate ODD coverage',
        '2. Calculate scenario space coverage',
        '3. Analyze parameter space coverage',
        '4. Identify coverage gaps',
        '5. Map coverage to requirements',
        '6. Analyze edge case coverage',
        '7. Calculate safety coverage metrics',
        '8. Identify missing scenarios',
        '9. Generate coverage reports',
        '10. Recommend coverage improvements'
      ],
      outputFormat: 'JSON object with coverage analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'overallCoverage', 'gaps'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            oddCoverage: { type: 'number' },
            scenarioCoverage: { type: 'number' },
            parameterCoverage: { type: 'number' },
            requirementsCoverage: { type: 'number' }
          }
        },
        overallCoverage: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'coverage', 'analysis']
}));

export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation Report Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Reporting Engineer',
      task: 'Generate comprehensive virtual validation report',
      context: {
        projectName: args.projectName,
        digitalTwin: args.digitalTwin,
        sensorModels: args.sensorModels,
        scenarioLibrary: args.scenarioLibrary,
        scenarioTesting: args.scenarioTesting,
        coverageAnalysis: args.coverageAnalysis
      },
      instructions: [
        '1. Compile executive summary',
        '2. Document simulation environment',
        '3. Summarize scenario library',
        '4. Present test results',
        '5. Analyze coverage metrics',
        '6. Document failures and root causes',
        '7. Present safety validation evidence',
        '8. Define remaining gaps',
        '9. Provide recommendations',
        '10. Define next steps'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'summary', 'nextSteps'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            environmentDescription: { type: 'object' },
            testResults: { type: 'object' },
            coverageReport: { type: 'object' },
            safetyEvidence: { type: 'object' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passRate: { type: 'number' },
            coverage: { type: 'number' },
            openIssues: { type: 'number' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'simulation', 'validation', 'reporting']
}));
