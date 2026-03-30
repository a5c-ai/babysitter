/**
 * @process domains/science/materials-science/calphad-modeling
 * @description CALPHAD Phase Diagram Modeling - Develop and validate thermodynamic databases, calculate phase diagrams,
 * and predict equilibrium phases using Thermo-Calc/FactSage.
 * @inputs { systemComponents: array, temperatureRange?: object, compositionRange?: object }
 * @outputs { success: boolean, phaseDiagram: object, equilibriumPhases: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/calphad-modeling', {
 *   systemComponents: ['Fe', 'Cr', 'Ni'],
 *   temperatureRange: { min: 300, max: 1800 },
 *   compositionRange: { Cr: { min: 0, max: 0.3 }, Ni: { min: 0, max: 0.2 } }
 * });
 *
 * @references
 * - Thermo-Calc: https://thermocalc.com/
 * - FactSage: https://factsage.com/
 * - CALPHAD Method: https://www.calphad.org/
 * - DICTRA: https://thermocalc.com/products/dictra/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemComponents,
    temperatureRange = { min: 300, max: 1500 },
    compositionRange = {},
    pressure = 101325,
    database = 'TCFE',
    calculationType = 'phase-diagram',
    software = 'thermo-calc',
    outputDir = 'calphad-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CALPHAD Modeling for system: ${systemComponents.join('-')}`);
  ctx.log('info', `Temperature range: ${temperatureRange.min}-${temperatureRange.max}K`);

  // Phase 1: Database Selection and Validation
  ctx.log('info', 'Phase 1: Selecting and validating thermodynamic database');
  const databaseValidation = await ctx.task(databaseValidationTask, {
    systemComponents,
    database,
    software,
    outputDir
  });

  artifacts.push(...databaseValidation.artifacts);

  // Phase 2: System Definition
  ctx.log('info', 'Phase 2: Defining thermodynamic system');
  const systemDefinition = await ctx.task(systemDefinitionTask, {
    systemComponents,
    compositionRange,
    temperatureRange,
    pressure,
    database,
    outputDir
  });

  artifacts.push(...systemDefinition.artifacts);

  let phaseDiagramResults = null;
  let equilibriumResults = null;
  let scheilResults = null;
  let diffusionResults = null;

  // Phase 3: Phase Diagram Calculation
  if (calculationType === 'phase-diagram' || calculationType === 'all') {
    ctx.log('info', 'Phase 3: Calculating phase diagram');
    phaseDiagramResults = await ctx.task(phaseDiagramCalculationTask, {
      systemComponents,
      systemDefinition: systemDefinition.definition,
      temperatureRange,
      compositionRange,
      software,
      outputDir
    });

    artifacts.push(...phaseDiagramResults.artifacts);

    await ctx.breakpoint({
      question: `Phase diagram calculated for ${systemComponents.join('-')} system. ${phaseDiagramResults.phaseRegions.length} phase regions identified. Review diagram?`,
      title: 'Phase Diagram Review',
      context: {
        runId: ctx.runId,
        summary: {
          components: systemComponents,
          phaseRegions: phaseDiagramResults.phaseRegions.length,
          invariantPoints: phaseDiagramResults.invariantPoints.length
        },
        files: phaseDiagramResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 4: Equilibrium Calculations
  if (calculationType === 'equilibrium' || calculationType === 'all') {
    ctx.log('info', 'Phase 4: Calculating equilibrium phases');
    equilibriumResults = await ctx.task(equilibriumCalculationTask, {
      systemComponents,
      systemDefinition: systemDefinition.definition,
      conditions: inputs.conditions || { temperature: 1000, composition: {} },
      software,
      outputDir
    });

    artifacts.push(...equilibriumResults.artifacts);
  }

  // Phase 5: Scheil Solidification
  if (calculationType === 'scheil' || calculationType === 'all') {
    ctx.log('info', 'Phase 5: Calculating Scheil solidification');
    scheilResults = await ctx.task(scheilSolidificationTask, {
      systemComponents,
      systemDefinition: systemDefinition.definition,
      startTemperature: temperatureRange.max,
      software,
      outputDir
    });

    artifacts.push(...scheilResults.artifacts);
  }

  // Phase 6: Diffusion Simulation (DICTRA)
  if (calculationType === 'diffusion') {
    ctx.log('info', 'Phase 6: Simulating diffusion');
    diffusionResults = await ctx.task(diffusionSimulationTaskCalphad, {
      systemComponents,
      systemDefinition: systemDefinition.definition,
      diffusionSetup: inputs.diffusionSetup || {},
      software,
      outputDir
    });

    artifacts.push(...diffusionResults.artifacts);
  }

  // Phase 7: Property Extraction
  ctx.log('info', 'Phase 7: Extracting thermodynamic properties');
  const propertyExtraction = await ctx.task(propertyExtractionTask, {
    systemComponents,
    phaseDiagramResults,
    equilibriumResults,
    outputDir
  });

  artifacts.push(...propertyExtraction.artifacts);

  // Phase 8: Validation Against Experimental Data
  ctx.log('info', 'Phase 8: Validating against experimental data');
  const validation = await ctx.task(calphadValidationTask, {
    systemComponents,
    phaseDiagramResults,
    equilibriumResults,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Generating CALPHAD report');
  const report = await ctx.task(calphadReportTask, {
    systemComponents,
    database,
    phaseDiagramResults,
    equilibriumResults,
    scheilResults,
    diffusionResults,
    propertyExtraction,
    validation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemComponents,
    database,
    phaseDiagram: phaseDiagramResults ? {
      diagramPath: phaseDiagramResults.diagramPath,
      phaseRegions: phaseDiagramResults.phaseRegions,
      invariantPoints: phaseDiagramResults.invariantPoints,
      phaseBoundaries: phaseDiagramResults.phaseBoundaries
    } : null,
    equilibriumPhases: equilibriumResults ? equilibriumResults.phases : null,
    scheilSimulation: scheilResults ? {
      solidificationPath: scheilResults.solidificationPath,
      phaseSequence: scheilResults.phaseSequence,
      solidusTemperature: scheilResults.solidusTemperature,
      segregationProfile: scheilResults.segregationProfile
    } : null,
    thermodynamicProperties: propertyExtraction.properties,
    validation: validation.validationResults,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/calphad-modeling',
      timestamp: startTime,
      software,
      temperatureRange,
      outputDir
    }
  };
}

// Task 1: Database Validation
export const databaseValidationTask = defineTask('calphad-database-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Validation - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'calphad-specialist',
    prompt: {
      role: 'CALPHAD Database Specialist',
      task: 'Validate thermodynamic database for system components',
      context: args,
      instructions: [
        '1. Identify appropriate thermodynamic database',
        '2. Check element coverage in database',
        '3. Verify binary and ternary subsystem assessments',
        '4. Check database version and updates',
        '5. Identify missing interactions',
        '6. Assess database reliability for composition range',
        '7. Check for known database limitations',
        '8. Recommend database parameters',
        '9. Document database selection rationale',
        '10. Verify license and access'
      ],
      outputFormat: 'JSON with database validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['databaseValid', 'coverage', 'artifacts'],
      properties: {
        databaseValid: { type: 'boolean' },
        database: { type: 'string' },
        version: { type: 'string' },
        coverage: {
          type: 'object',
          properties: {
            elements: { type: 'boolean' },
            binaries: { type: 'array', items: { type: 'string' } },
            ternaries: { type: 'array', items: { type: 'string' } }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'database', 'materials-science']
}));

// Task 2: System Definition
export const systemDefinitionTask = defineTask('calphad-system-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Definition - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'thermodynamics-specialist',
    prompt: {
      role: 'Computational Thermodynamics Specialist',
      task: 'Define thermodynamic system for CALPHAD calculations',
      context: args,
      instructions: [
        '1. Define system components',
        '2. Specify composition variables',
        '3. Define temperature and pressure conditions',
        '4. Select phases to consider',
        '5. Set up composition grid if needed',
        '6. Define axis variables for diagrams',
        '7. Specify output format',
        '8. Configure calculation settings',
        '9. Generate input script',
        '10. Document system definition'
      ],
      outputFormat: 'JSON with system definition'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'inputScript', 'artifacts'],
      properties: {
        definition: { type: 'object' },
        phases: { type: 'array', items: { type: 'string' } },
        compositionVariables: { type: 'object' },
        inputScript: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'system-definition', 'materials-science']
}));

// Task 3: Phase Diagram Calculation
export const phaseDiagramCalculationTask = defineTask('calphad-phase-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase Diagram Calculation - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'phase-diagram-calculator',
    prompt: {
      role: 'Phase Diagram Calculation Specialist',
      task: 'Calculate phase diagram using CALPHAD software',
      context: args,
      instructions: [
        '1. Set up mapping calculation',
        '2. Define diagram type (binary, ternary isothermal, etc.)',
        '3. Execute phase diagram calculation',
        '4. Identify phase boundaries',
        '5. Locate invariant points',
        '6. Calculate phase regions',
        '7. Extract tie-lines if applicable',
        '8. Generate phase diagram plot',
        '9. Add labels and annotations',
        '10. Export diagram data'
      ],
      outputFormat: 'JSON with phase diagram results'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'phaseRegions', 'invariantPoints', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        phaseRegions: { type: 'array', items: { type: 'object' } },
        invariantPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              composition: { type: 'object' },
              reactionType: { type: 'string' }
            }
          }
        },
        phaseBoundaries: { type: 'array', items: { type: 'object' } },
        diagramData: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'phase-diagram', 'materials-science']
}));

// Task 4: Equilibrium Calculation
export const equilibriumCalculationTask = defineTask('calphad-equilibrium', (args, taskCtx) => ({
  kind: 'agent',
  title: `Equilibrium Calculation - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'equilibrium-calculator',
    prompt: {
      role: 'Equilibrium Calculation Specialist',
      task: 'Calculate equilibrium phases at specified conditions',
      context: args,
      instructions: [
        '1. Set temperature and composition',
        '2. Minimize Gibbs energy',
        '3. Identify stable phases',
        '4. Calculate phase fractions',
        '5. Determine phase compositions',
        '6. Calculate chemical potentials',
        '7. Extract thermodynamic properties',
        '8. Perform step calculations if needed',
        '9. Document equilibrium state',
        '10. Export equilibrium data'
      ],
      outputFormat: 'JSON with equilibrium calculation results'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'phaseFractions', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'string' } },
        phaseFractions: { type: 'object' },
        phaseCompositions: { type: 'object' },
        chemicalPotentials: { type: 'object' },
        gibbsEnergy: { type: 'number' },
        enthalpy: { type: 'number' },
        entropy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'equilibrium', 'materials-science']
}));

// Task 5: Scheil Solidification
export const scheilSolidificationTask = defineTask('calphad-scheil', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scheil Solidification - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'solidification-specialist',
    prompt: {
      role: 'Solidification Simulation Specialist',
      task: 'Simulate non-equilibrium Scheil solidification',
      context: args,
      instructions: [
        '1. Set up Scheil calculation',
        '2. Define starting composition',
        '3. Begin from liquidus temperature',
        '4. Calculate solidification path',
        '5. Track phase formation sequence',
        '6. Calculate microsegregation profile',
        '7. Determine solidus temperature',
        '8. Calculate fraction solid vs temperature',
        '9. Identify eutectic/peritectic reactions',
        '10. Generate solidification curves'
      ],
      outputFormat: 'JSON with Scheil solidification results'
    },
    outputSchema: {
      type: 'object',
      required: ['solidificationPath', 'phaseSequence', 'solidusTemperature', 'artifacts'],
      properties: {
        solidificationPath: { type: 'string' },
        liquidusTemperature: { type: 'number' },
        solidusTemperature: { type: 'number' },
        phaseSequence: { type: 'array', items: { type: 'object' } },
        fractionSolidCurve: { type: 'string' },
        segregationProfile: { type: 'object' },
        eutecticFraction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'scheil', 'solidification', 'materials-science']
}));

// Task 6: Diffusion Simulation
export const diffusionSimulationTaskCalphad = defineTask('calphad-diffusion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diffusion Simulation - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'dictra-specialist',
    prompt: {
      role: 'DICTRA Diffusion Simulation Specialist',
      task: 'Simulate multicomponent diffusion using DICTRA',
      context: args,
      instructions: [
        '1. Set up diffusion geometry (planar, cylindrical)',
        '2. Define initial concentration profiles',
        '3. Select mobility database',
        '4. Set boundary conditions',
        '5. Define simulation time and temperature',
        '6. Run diffusion simulation',
        '7. Track moving phase boundaries',
        '8. Calculate diffusion paths',
        '9. Extract concentration profiles vs time',
        '10. Analyze interdiffusion coefficients'
      ],
      outputFormat: 'JSON with diffusion simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['concentrationProfiles', 'diffusionPaths', 'artifacts'],
      properties: {
        concentrationProfiles: { type: 'object' },
        diffusionPaths: { type: 'string' },
        phaseMovement: { type: 'object' },
        interdiffusionCoefficients: { type: 'object' },
        simulationTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'dictra', 'diffusion', 'materials-science']
}));

// Task 7: Property Extraction
export const propertyExtractionTask = defineTask('calphad-property-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Property Extraction - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'property-extractor',
    prompt: {
      role: 'Thermodynamic Property Extraction Specialist',
      task: 'Extract thermodynamic properties from CALPHAD results',
      context: args,
      instructions: [
        '1. Extract phase transformation temperatures',
        '2. Calculate enthalpies of transformation',
        '3. Extract heat capacity data',
        '4. Calculate driving forces',
        '5. Extract activity coefficients',
        '6. Calculate molar volumes if available',
        '7. Determine solubility limits',
        '8. Extract partitioning coefficients',
        '9. Generate property tables',
        '10. Document extracted properties'
      ],
      outputFormat: 'JSON with extracted properties'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'artifacts'],
      properties: {
        properties: {
          type: 'object',
          properties: {
            transformationTemperatures: { type: 'object' },
            enthalpies: { type: 'object' },
            solubilityLimits: { type: 'object' },
            partitionCoefficients: { type: 'object' }
          }
        },
        propertyTables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'properties', 'materials-science']
}));

// Task 8: Validation
export const calphadValidationTask = defineTask('calphad-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `CALPHAD Validation - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'CALPHAD Validation Specialist',
      task: 'Validate CALPHAD predictions against experimental data',
      context: args,
      instructions: [
        '1. Search for experimental phase diagram data',
        '2. Compare calculated vs. measured boundaries',
        '3. Validate invariant reactions',
        '4. Compare transformation temperatures',
        '5. Assess prediction accuracy',
        '6. Identify systematic deviations',
        '7. Quantify prediction errors',
        '8. Document literature comparisons',
        '9. Flag discrepancies',
        '10. Assess model reliability'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'artifacts'],
      properties: {
        validationResults: {
          type: 'object',
          properties: {
            overallAccuracy: { type: 'string' },
            temperatureError: { type: 'number' },
            compositionError: { type: 'number' }
          }
        },
        experimentalComparisons: { type: 'array', items: { type: 'object' } },
        discrepancies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'calphad', 'validation', 'materials-science']
}));

// Task 9: Report Generation
export const calphadReportTask = defineTask('calphad-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `CALPHAD Report - ${args.systemComponents.join('-')}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'CALPHAD Technical Writer',
      task: 'Generate comprehensive CALPHAD modeling report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document methodology and database',
        '3. Present phase diagrams',
        '4. Include equilibrium calculations',
        '5. Present Scheil results if applicable',
        '6. Include diffusion simulations',
        '7. Report extracted properties',
        '8. Discuss validation results',
        '9. Add conclusions and recommendations',
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
  labels: ['agent', 'calphad', 'report', 'documentation', 'materials-science']
}));
