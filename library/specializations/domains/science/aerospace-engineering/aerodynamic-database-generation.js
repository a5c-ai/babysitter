/**
 * @process specializations/domains/science/aerospace-engineering/aerodynamic-database-generation
 * @description Systematic generation of aerodynamic coefficient databases across Mach number, angle of attack,
 * and sideslip ranges for flight simulation and control law development.
 * @inputs { projectName: string, vehicleConfig: object, envelopeDefinition: object, fidelityLevel?: string }
 * @outputs { success: boolean, database: object, coverageMetrics: object, interpolationModel: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/aerodynamic-database-generation', {
 *   projectName: 'Fighter Aircraft Aero Database',
 *   vehicleConfig: { type: 'fighter', configurations: ['clean', 'stores'] },
 *   envelopeDefinition: { machRange: [0.2, 2.0], aoaRange: [-10, 30], betaRange: [-15, 15] },
 *   fidelityLevel: 'high'
 * });
 *
 * @references
 * - NASA Aerodynamic Database Development: https://www.nasa.gov/
 * - DATCOM Handbook: https://www.dtic.mil/
 * - Flight Simulation Database Standards: SAE AS94900
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleConfig,
    envelopeDefinition,
    fidelityLevel = 'medium'
  } = inputs;

  // Phase 1: Database Requirements Definition
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    projectName,
    vehicleConfig,
    envelopeDefinition,
    fidelityLevel
  });

  // Phase 2: Test Matrix Generation
  const testMatrixGeneration = await ctx.task(testMatrixGenerationTask, {
    projectName,
    requirements: requirementsDefinition,
    envelopeDefinition
  });

  // Breakpoint: Review test matrix
  await ctx.breakpoint({
    question: `Test matrix generated with ${testMatrixGeneration.totalPoints} data points for ${projectName}. Approve for data generation?`,
    title: 'Test Matrix Review',
    context: {
      runId: ctx.runId,
      testMatrix: testMatrixGeneration,
      estimatedComputeTime: testMatrixGeneration.estimatedComputeTime
    }
  });

  // Phase 3: Data Generation (CFD/Wind Tunnel/Analytical)
  const dataGeneration = await ctx.task(dataGenerationTask, {
    projectName,
    testMatrix: testMatrixGeneration.matrix,
    vehicleConfig,
    fidelityLevel
  });

  // Quality Gate: Check data coverage
  if (dataGeneration.coveragePercentage < 95) {
    await ctx.breakpoint({
      question: `Data coverage is ${dataGeneration.coveragePercentage}% (target 95%). Address gaps or continue?`,
      title: 'Data Coverage Warning',
      context: {
        runId: ctx.runId,
        gaps: dataGeneration.dataGaps,
        recommendation: 'Consider additional CFD runs or interpolation'
      }
    });
  }

  // Phase 4: Data Quality Validation
  const dataValidation = await ctx.task(dataValidationTask, {
    projectName,
    generatedData: dataGeneration,
    requirements: requirementsDefinition
  });

  // Phase 5: Table Structure and Interpolation Scheme
  const tableStructure = await ctx.task(tableStructureTask, {
    projectName,
    validatedData: dataValidation.validatedData,
    envelopeDefinition,
    interpolationRequirements: requirementsDefinition.interpolationRequirements
  });

  // Phase 6: Increment Building (Configuration Effects)
  const incrementBuilding = await ctx.task(incrementBuildingTask, {
    projectName,
    baselineData: tableStructure.baselineTable,
    configurations: vehicleConfig.configurations,
    componentEffects: vehicleConfig.componentEffects
  });

  // Phase 7: Dynamic Derivatives
  const dynamicDerivatives = await ctx.task(dynamicDerivativesTask, {
    projectName,
    staticData: tableStructure.staticTables,
    vehicleConfig,
    frequencyRange: requirementsDefinition.frequencyRange
  });

  // Phase 8: Database Integration and Formatting
  const databaseIntegration = await ctx.task(databaseIntegrationTask, {
    projectName,
    staticTables: tableStructure,
    incrementTables: incrementBuilding,
    dynamicDerivatives,
    outputFormat: requirementsDefinition.outputFormat
  });

  // Phase 9: Verification and Validation
  const databaseValidation = await ctx.task(databaseValidationTask, {
    projectName,
    integratedDatabase: databaseIntegration,
    requirements: requirementsDefinition,
    referenceData: dataGeneration.referenceComparisons
  });

  // Phase 10: Documentation
  const documentation = await ctx.task(databaseDocumentationTask, {
    projectName,
    database: databaseIntegration,
    validation: databaseValidation,
    requirements: requirementsDefinition
  });

  // Final Breakpoint: Database Release
  await ctx.breakpoint({
    question: `Aerodynamic database complete for ${projectName}. Validation status: ${databaseValidation.status}. Release database?`,
    title: 'Database Release Approval',
    context: {
      runId: ctx.runId,
      summary: {
        totalTables: databaseIntegration.tableCount,
        coverageMetrics: databaseValidation.coverageMetrics,
        validationStatus: databaseValidation.status
      },
      files: [
        { path: 'artifacts/aero-database.json', format: 'json', content: databaseIntegration.database },
        { path: 'artifacts/database-documentation.md', format: 'markdown', content: documentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    database: databaseIntegration.database,
    coverageMetrics: databaseValidation.coverageMetrics,
    interpolationModel: tableStructure.interpolationModel,
    validation: databaseValidation,
    documentation: documentation,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/aerodynamic-database-generation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Simulation Engineer specializing in aerodynamic databases',
      task: 'Define comprehensive requirements for aerodynamic database',
      context: {
        projectName: args.projectName,
        vehicleConfig: args.vehicleConfig,
        envelopeDefinition: args.envelopeDefinition,
        fidelityLevel: args.fidelityLevel
      },
      instructions: [
        '1. Define required aerodynamic coefficients (forces, moments, derivatives)',
        '2. Specify independent variables and their ranges (Mach, AoA, Beta, altitude)',
        '3. Define resolution requirements for each independent variable',
        '4. Specify accuracy requirements for each coefficient',
        '5. Define configuration variations (control surfaces, stores, landing gear)',
        '6. Specify dynamic derivative requirements (damping, unsteady effects)',
        '7. Define interpolation method requirements (linear, spline, kriging)',
        '8. Specify output format requirements (XML, HDF5, custom)',
        '9. Define validation requirements and acceptance criteria',
        '10. Document intended applications (simulation, control law, loads)'
      ],
      outputFormat: 'JSON object with complete database requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['coefficients', 'independentVariables', 'accuracyRequirements'],
      properties: {
        coefficients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              description: { type: 'string' },
              required: { type: 'boolean' }
            }
          }
        },
        independentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              range: { type: 'array', items: { type: 'number' } },
              resolution: { type: 'number' },
              units: { type: 'string' }
            }
          }
        },
        accuracyRequirements: {
          type: 'object',
          properties: {
            CL: { type: 'number' },
            CD: { type: 'number' },
            CM: { type: 'number' },
            derivatives: { type: 'number' }
          }
        },
        interpolationRequirements: { type: 'object' },
        outputFormat: { type: 'string' },
        frequencyRange: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'requirements', 'aerospace']
}));

export const testMatrixGenerationTask = defineTask('test-matrix-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Matrix Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Test Planning Engineer',
      task: 'Generate optimal test matrix for aerodynamic database population',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        envelopeDefinition: args.envelopeDefinition
      },
      instructions: [
        '1. Define breakpoints for each independent variable',
        '2. Apply Design of Experiments principles for efficient coverage',
        '3. Identify critical regions requiring higher density (transonic, stall)',
        '4. Generate full factorial matrix for critical regions',
        '5. Apply sparse sampling in benign regions',
        '6. Account for configuration multipliers',
        '7. Prioritize points based on criticality',
        '8. Estimate computational/test resources required',
        '9. Plan for contingency points',
        '10. Generate optimized test matrix with priorities'
      ],
      outputFormat: 'JSON object with complete test matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'totalPoints'],
      properties: {
        totalPoints: { type: 'number' },
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              mach: { type: 'number' },
              aoa: { type: 'number' },
              beta: { type: 'number' },
              config: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        breakpoints: {
          type: 'object',
          properties: {
            mach: { type: 'array', items: { type: 'number' } },
            aoa: { type: 'array', items: { type: 'number' } },
            beta: { type: 'array', items: { type: 'number' } }
          }
        },
        estimatedComputeTime: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'test-matrix', 'aerospace']
}));

export const dataGenerationTask = defineTask('data-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Analysis Engineer for database population',
      task: 'Generate aerodynamic data for all test matrix points',
      context: {
        projectName: args.projectName,
        testMatrix: args.testMatrix,
        vehicleConfig: args.vehicleConfig,
        fidelityLevel: args.fidelityLevel
      },
      instructions: [
        '1. Execute CFD analyses or process wind tunnel data for each point',
        '2. Apply appropriate analysis methods based on fidelity level',
        '3. Extract all required aerodynamic coefficients',
        '4. Track convergence and solution quality for each point',
        '5. Identify and flag failed or questionable runs',
        '6. Apply data consistency checks between adjacent points',
        '7. Compare with reference data where available',
        '8. Document data sources and methods for each point',
        '9. Compute coverage statistics',
        '10. Identify data gaps requiring additional runs'
      ],
      outputFormat: 'JSON object with generated aerodynamic data'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'coveragePercentage'],
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pointId: { type: 'number' },
              conditions: { type: 'object' },
              coefficients: { type: 'object' },
              quality: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        coveragePercentage: { type: 'number' },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              region: { type: 'string' },
              missingPoints: { type: 'number' },
              criticality: { type: 'string' }
            }
          }
        },
        referenceComparisons: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'data-generation', 'aerospace']
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Data Quality Engineer',
      task: 'Validate generated aerodynamic data quality and consistency',
      context: {
        projectName: args.projectName,
        generatedData: args.generatedData,
        requirements: args.requirements
      },
      instructions: [
        '1. Check data continuity and smoothness across the envelope',
        '2. Verify physical plausibility of coefficients',
        '3. Check slope signs and magnitudes against expected trends',
        '4. Identify discontinuities and non-physical behavior',
        '5. Validate symmetry conditions where applicable',
        '6. Check for data outliers and anomalies',
        '7. Verify moment reference point consistency',
        '8. Validate units and sign conventions',
        '9. Compare with handbook methods as sanity check',
        '10. Document validation findings and corrective actions'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedData', 'validationStatus'],
      properties: {
        validatedData: { type: 'array', items: { type: 'object' } },
        validationStatus: { type: 'string', enum: ['passed', 'passed-with-warnings', 'failed'] },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pointId: { type: 'number' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        qualityMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'validation', 'aerospace']
}));

export const tableStructureTask = defineTask('table-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Table Structure Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Database Architect',
      task: 'Design table structure and interpolation scheme for aerodynamic database',
      context: {
        projectName: args.projectName,
        validatedData: args.validatedData,
        envelopeDefinition: args.envelopeDefinition,
        interpolationRequirements: args.interpolationRequirements
      },
      instructions: [
        '1. Organize data into multi-dimensional lookup tables',
        '2. Define breakpoint arrays for each independent variable',
        '3. Select appropriate interpolation method for each table',
        '4. Handle table boundaries and extrapolation limits',
        '5. Design table indexing and access structure',
        '6. Optimize table structure for simulation performance',
        '7. Define baseline vs increment table organization',
        '8. Create interpolation model specification',
        '9. Validate interpolation accuracy between data points',
        '10. Document table structure and access methodology'
      ],
      outputFormat: 'JSON object with table structure and interpolation model'
    },
    outputSchema: {
      type: 'object',
      required: ['staticTables', 'interpolationModel', 'baselineTable'],
      properties: {
        staticTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              coefficient: { type: 'string' },
              dimensions: { type: 'number' },
              breakpoints: { type: 'object' },
              data: { type: 'string' }
            }
          }
        },
        baselineTable: { type: 'object' },
        interpolationModel: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            order: { type: 'number' },
            extrapolationLimits: { type: 'object' }
          }
        },
        interpolationAccuracy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'table-structure', 'aerospace']
}));

export const incrementBuildingTask = defineTask('increment-building', (args, taskCtx) => ({
  kind: 'agent',
  title: `Increment Building - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Configuration Analyst',
      task: 'Build increment tables for configuration effects',
      context: {
        projectName: args.projectName,
        baselineData: args.baselineData,
        configurations: args.configurations,
        componentEffects: args.componentEffects
      },
      instructions: [
        '1. Define baseline configuration for increment referencing',
        '2. Calculate control surface effectiveness increments',
        '3. Build store/external configuration increments',
        '4. Calculate landing gear and flap effects',
        '5. Account for interference effects between components',
        '6. Verify increment additivity and superposition',
        '7. Define increment scheduling with flight conditions',
        '8. Handle non-linear increment effects',
        '9. Validate total configuration build-up',
        '10. Document increment methodology and limitations'
      ],
      outputFormat: 'JSON object with increment tables'
    },
    outputSchema: {
      type: 'object',
      required: ['incrementTables', 'buildUpValidation'],
      properties: {
        incrementTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              coefficient: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        buildUpValidation: {
          type: 'object',
          properties: {
            validated: { type: 'boolean' },
            maxError: { type: 'number' },
            additivityCheck: { type: 'string' }
          }
        },
        interferenceEffects: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'increments', 'aerospace']
}));

export const dynamicDerivativesTask = defineTask('dynamic-derivatives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Derivatives - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Flight Dynamics Engineer',
      task: 'Generate dynamic stability derivatives for the database',
      context: {
        projectName: args.projectName,
        staticData: args.staticData,
        vehicleConfig: args.vehicleConfig,
        frequencyRange: args.frequencyRange
      },
      instructions: [
        '1. Calculate rotary derivatives (Clp, Cnr, Cmq, etc.)',
        '2. Determine unsteady aerodynamic effects',
        '3. Apply appropriate prediction methods (DATCOM, CFD, unsteady)',
        '4. Account for reduced frequency effects',
        '5. Calculate rate derivatives with body axis orientation',
        '6. Determine acceleration derivatives if required',
        '7. Apply corrections for oscillatory vs steady-state derivatives',
        '8. Validate against available experimental data',
        '9. Document derivative sources and uncertainties',
        '10. Format dynamic derivative tables'
      ],
      outputFormat: 'JSON object with dynamic derivative data'
    },
    outputSchema: {
      type: 'object',
      required: ['rotaryDerivatives', 'damping'],
      properties: {
        rotaryDerivatives: {
          type: 'object',
          properties: {
            Clp: { type: 'object' },
            Cnr: { type: 'object' },
            Cmq: { type: 'object' },
            Clr: { type: 'object' },
            Cnp: { type: 'object' }
          }
        },
        damping: {
          type: 'object',
          properties: {
            shortPeriod: { type: 'object' },
            dutchRoll: { type: 'object' },
            rollSubsidence: { type: 'object' }
          }
        },
        unsteadyEffects: { type: 'object' },
        methodology: { type: 'string' },
        uncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'dynamic-derivatives', 'aerospace']
}));

export const databaseIntegrationTask = defineTask('database-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Simulation Integration Engineer',
      task: 'Integrate all data into unified aerodynamic database',
      context: {
        projectName: args.projectName,
        staticTables: args.staticTables,
        incrementTables: args.incrementTables,
        dynamicDerivatives: args.dynamicDerivatives,
        outputFormat: args.outputFormat
      },
      instructions: [
        '1. Integrate static, increment, and dynamic tables',
        '2. Ensure consistent coordinate systems and sign conventions',
        '3. Apply standard moment reference point',
        '4. Create configuration management structure',
        '5. Generate metadata and version information',
        '6. Format output per specified standard (JSBSim, FlightGear, etc.)',
        '7. Create accessor functions or API specification',
        '8. Validate integrated database completeness',
        '9. Generate checksum and integrity verification',
        '10. Create database summary and index'
      ],
      outputFormat: 'JSON object with integrated database'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'tableCount'],
      properties: {
        database: {
          type: 'object',
          properties: {
            metadata: { type: 'object' },
            staticData: { type: 'object' },
            increments: { type: 'object' },
            dynamics: { type: 'object' },
            configurations: { type: 'array', items: { type: 'string' } }
          }
        },
        tableCount: { type: 'number' },
        format: { type: 'string' },
        checksum: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'integration', 'aerospace']
}));

export const databaseValidationTask = defineTask('database-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace V&V Engineer for simulation databases',
      task: 'Validate integrated aerodynamic database',
      context: {
        projectName: args.projectName,
        integratedDatabase: args.integratedDatabase,
        requirements: args.requirements,
        referenceData: args.referenceData
      },
      instructions: [
        '1. Verify database completeness against requirements',
        '2. Test interpolation accuracy at intermediate points',
        '3. Validate trim solutions and stable flight conditions',
        '4. Compare with reference flight test or wind tunnel data',
        '5. Verify configuration build-up accuracy',
        '6. Test database performance in simulation loop',
        '7. Validate dynamic response characteristics',
        '8. Check boundary behavior and extrapolation handling',
        '9. Document validation results and limitations',
        '10. Provide overall validation status and recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'coverageMetrics'],
      properties: {
        status: { type: 'string', enum: ['validated', 'conditionally-validated', 'not-validated'] },
        coverageMetrics: {
          type: 'object',
          properties: {
            envelopeCoverage: { type: 'number' },
            configurationCoverage: { type: 'number' },
            coefficientCoverage: { type: 'number' }
          }
        },
        accuracyMetrics: {
          type: 'object',
          properties: {
            interpolationError: { type: 'number' },
            referenceComparison: { type: 'object' }
          }
        },
        validationTests: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aero-database', 'validation', 'aerospace']
}));

export const databaseDocumentationTask = defineTask('database-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Technical Writer for simulation databases',
      task: 'Generate comprehensive aerodynamic database documentation',
      context: {
        projectName: args.projectName,
        database: args.database,
        validation: args.validation,
        requirements: args.requirements
      },
      instructions: [
        '1. Create database summary and overview',
        '2. Document data sources and generation methods',
        '3. Describe table structure and access methodology',
        '4. Document coordinate systems and sign conventions',
        '5. List all coefficients and their definitions',
        '6. Describe configuration build-up methodology',
        '7. Document validation status and limitations',
        '8. Provide usage guidelines and examples',
        '9. Include revision history and change log',
        '10. Generate both structured and markdown documentation'
      ],
      outputFormat: 'JSON object with complete documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            dataSources: { type: 'array', items: { type: 'string' } },
            tableDescriptions: { type: 'array', items: { type: 'object' } },
            coordinateSystems: { type: 'object' },
            usageGuidelines: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } },
            revisionHistory: { type: 'array', items: { type: 'object' } }
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
  labels: ['aero-database', 'documentation', 'aerospace']
}));
