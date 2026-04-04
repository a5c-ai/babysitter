/**
 * @process specializations/domains/science/nanotechnology/dft-calculation-pipeline
 * @description DFT Calculation Pipeline for Nanomaterials - Orchestrate density functional theory
 * calculations for nanomaterial property prediction including structure optimization, electronic
 * structure analysis, optical property calculation, and thermodynamic stability assessment
 * with convergence validation and comparison to experimental data.
 * @inputs { material: object, calculationGoals: array, computationalResources?: object }
 * @outputs { success: boolean, calculationResults: object, propertyPredictions: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/dft-calculation-pipeline', {
 *   material: { formula: 'Au55', structure: 'icosahedral', size: '1.4nm' },
 *   calculationGoals: ['geometry-optimization', 'electronic-structure', 'optical-properties'],
 *   computationalResources: { cores: 128, memory: '256GB', walltime: '48h' }
 * });
 *
 * @references
 * - VASP (Vienna Ab initio Simulation Package): https://www.vasp.at/
 * - Quantum ESPRESSO: https://www.quantum-espresso.org/
 * - Gaussian: https://gaussian.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    material,
    calculationGoals,
    computationalResources = {},
    convergenceThresholds = {},
    experimentalBenchmarks = null
  } = inputs;

  // Phase 1: Calculation Setup
  const calculationSetup = await ctx.task(calculationSetupTask, {
    material,
    calculationGoals,
    computationalResources
  });

  // Quality Gate: Setup must be valid
  if (!calculationSetup.valid) {
    return {
      success: false,
      error: 'DFT calculation setup not valid',
      phase: 'calculation-setup',
      recommendations: calculationSetup.recommendations
    };
  }

  // Breakpoint: Review calculation setup
  await ctx.breakpoint({
    question: `Review DFT setup for ${material.formula}. Functional: ${calculationSetup.functional}. Basis: ${calculationSetup.basisSet}. Estimated time: ${calculationSetup.estimatedTime}. Approve?`,
    title: 'DFT Calculation Setup Review',
    context: {
      runId: ctx.runId,
      material,
      calculationGoals,
      calculationSetup,
      files: [{
        path: 'artifacts/calculation-setup.json',
        format: 'json',
        content: calculationSetup
      }]
    }
  });

  // Phase 2: Structure Preparation
  const structurePreparation = await ctx.task(structurePreparationTask, {
    material,
    calculationSetup
  });

  // Phase 3: Convergence Testing
  const convergenceTests = await ctx.task(convergenceTestingTask, {
    structurePreparation,
    calculationSetup,
    convergenceThresholds
  });

  // Quality Gate: Convergence must be achieved
  if (!convergenceTests.converged) {
    await ctx.breakpoint({
      question: `Convergence issues detected: ${convergenceTests.issues.join(', ')}. Review parameters and proceed?`,
      title: 'DFT Convergence Warning',
      context: {
        runId: ctx.runId,
        convergenceTests,
        recommendations: convergenceTests.recommendations
      }
    });
  }

  const calculationResults = {};

  // Phase 4: Geometry Optimization
  if (calculationGoals.includes('geometry-optimization')) {
    const geometryOptimization = await ctx.task(geometryOptimizationTask, {
      structurePreparation,
      calculationSetup,
      convergenceTests
    });
    calculationResults.geometryOptimization = geometryOptimization;

    // Breakpoint: Review optimized structure
    await ctx.breakpoint({
      question: `Geometry optimization complete. Final energy: ${geometryOptimization.totalEnergy} eV. ${geometryOptimization.converged ? 'Converged' : 'Not converged'}. Continue?`,
      title: 'Geometry Optimization Review',
      context: {
        runId: ctx.runId,
        optimizedStructure: geometryOptimization.optimizedStructure,
        energyConvergence: geometryOptimization.energyConvergence
      }
    });
  }

  // Phase 5: Electronic Structure Analysis
  if (calculationGoals.includes('electronic-structure')) {
    const electronicStructure = await ctx.task(electronicStructureTask, {
      structurePreparation,
      calculationSetup,
      optimizedGeometry: calculationResults.geometryOptimization
    });
    calculationResults.electronicStructure = electronicStructure;
  }

  // Phase 6: Optical Property Calculation
  if (calculationGoals.includes('optical-properties')) {
    const opticalProperties = await ctx.task(opticalPropertyTask, {
      structurePreparation,
      calculationSetup,
      electronicStructure: calculationResults.electronicStructure
    });
    calculationResults.opticalProperties = opticalProperties;
  }

  // Phase 7: Thermodynamic Stability Assessment
  if (calculationGoals.includes('thermodynamic-stability')) {
    const thermodynamicStability = await ctx.task(thermodynamicStabilityTask, {
      structurePreparation,
      calculationSetup,
      geometryOptimization: calculationResults.geometryOptimization
    });
    calculationResults.thermodynamicStability = thermodynamicStability;
  }

  // Phase 8: Property Prediction Summary
  const propertyPredictions = await ctx.task(propertyPredictionTask, {
    calculationResults,
    material,
    calculationGoals
  });

  // Phase 9: Experimental Validation (if benchmarks provided)
  let validation = null;
  if (experimentalBenchmarks) {
    validation = await ctx.task(experimentalValidationTask, {
      propertyPredictions,
      experimentalBenchmarks,
      material
    });

    if (!validation.agreementAcceptable) {
      await ctx.breakpoint({
        question: `Theory-experiment discrepancy detected. Max deviation: ${validation.maxDeviation}. Review results?`,
        title: 'Validation Warning',
        context: {
          runId: ctx.runId,
          validation,
          recommendations: validation.recommendations
        }
      });
    }
  }

  // Phase 10: Report Generation
  const calculationReport = await ctx.task(reportGenerationTask, {
    material,
    calculationSetup,
    convergenceTests,
    calculationResults,
    propertyPredictions,
    validation
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `DFT calculations complete for ${material.formula}. ${Object.keys(calculationResults).length} calculation types completed. Approve results?`,
    title: 'DFT Calculation Results Approval',
    context: {
      runId: ctx.runId,
      propertyPredictions,
      validation,
      files: [
        { path: 'artifacts/dft-report.md', format: 'markdown', content: calculationReport.markdown },
        { path: 'artifacts/calculation-results.json', format: 'json', content: calculationResults }
      ]
    }
  });

  return {
    success: true,
    calculationResults,
    propertyPredictions,
    validation,
    convergenceTests,
    report: calculationReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/dft-calculation-pipeline',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const calculationSetupTask = defineTask('calculation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup DFT calculations for ${args.material.formula}`,
  agent: {
    name: 'computational-chemist',
    prompt: {
      role: 'Computational Chemistry Specialist',
      task: 'Setup DFT calculation parameters for nanomaterial',
      context: args,
      instructions: [
        '1. Select appropriate DFT code for system size and properties',
        '2. Choose exchange-correlation functional (PBE, HSE, etc.)',
        '3. Define basis set or plane-wave cutoff',
        '4. Select pseudopotentials/PAW potentials',
        '5. Define k-point sampling (or Gamma-only for nanoclusters)',
        '6. Set convergence criteria for SCF and geometry',
        '7. Plan calculation workflow for requested properties',
        '8. Estimate computational resources needed',
        '9. Identify potential calculation challenges',
        '10. Document calculation rationale'
      ],
      outputFormat: 'JSON object with calculation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'functional', 'basisSet', 'estimatedTime'],
      properties: {
        valid: { type: 'boolean' },
        dftCode: { type: 'string' },
        functional: { type: 'string' },
        basisSet: { type: 'string' },
        pseudopotentials: { type: 'object' },
        kPointSampling: { type: 'object' },
        convergenceCriteria: { type: 'object' },
        estimatedTime: { type: 'string' },
        challenges: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'setup']
}));

export const structurePreparationTask = defineTask('structure-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare structure for DFT calculation',
  agent: {
    name: 'structure-specialist',
    prompt: {
      role: 'Nanomaterial Structure Preparation Specialist',
      task: 'Prepare atomic structure for DFT calculations',
      context: args,
      instructions: [
        '1. Build initial atomic structure from specification',
        '2. Set appropriate cell/box dimensions',
        '3. Add vacuum for isolated systems',
        '4. Check for symmetry and apply if appropriate',
        '5. Verify reasonable interatomic distances',
        '6. Handle surface passivation if needed',
        '7. Generate input files for DFT code',
        '8. Verify structure visualization',
        '9. Document structure preparation steps',
        '10. Note any structural assumptions'
      ],
      outputFormat: 'JSON object with prepared structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'cellDimensions', 'atomCount'],
      properties: {
        structure: { type: 'object' },
        cellDimensions: { type: 'object' },
        vacuum: { type: 'number' },
        atomCount: { type: 'number' },
        symmetry: { type: 'object' },
        passivation: { type: 'object' },
        inputFiles: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'structure']
}));

export const convergenceTestingTask = defineTask('convergence-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test calculation convergence',
  agent: {
    name: 'convergence-specialist',
    prompt: {
      role: 'DFT Convergence Testing Specialist',
      task: 'Test and verify calculation convergence parameters',
      context: args,
      instructions: [
        '1. Test energy cutoff convergence',
        '2. Test k-point convergence (if applicable)',
        '3. Verify SCF convergence behavior',
        '4. Check total energy convergence',
        '5. Test force convergence for geometry optimization',
        '6. Identify optimal convergence parameters',
        '7. Balance accuracy vs. computational cost',
        '8. Document convergence test results',
        '9. Flag any convergence issues',
        '10. Recommend final parameters'
      ],
      outputFormat: 'JSON object with convergence test results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'cutoffConvergence', 'scfConvergence'],
      properties: {
        converged: { type: 'boolean' },
        cutoffConvergence: { type: 'object' },
        kpointConvergence: { type: 'object' },
        scfConvergence: { type: 'object' },
        optimalParameters: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'convergence']
}));

export const geometryOptimizationTask = defineTask('geometry-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize geometry',
  agent: {
    name: 'geometry-optimizer',
    prompt: {
      role: 'DFT Geometry Optimization Specialist',
      task: 'Perform geometry optimization of nanomaterial structure',
      context: args,
      instructions: [
        '1. Execute geometry optimization calculation',
        '2. Monitor force and energy convergence',
        '3. Handle optimization algorithm (BFGS, CG, etc.)',
        '4. Check for local minima issues',
        '5. Verify final structure is physical',
        '6. Calculate final total energy',
        '7. Extract optimized coordinates',
        '8. Analyze structural changes from initial',
        '9. Document optimization trajectory',
        '10. Verify force convergence criteria met'
      ],
      outputFormat: 'JSON object with optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'totalEnergy', 'optimizedStructure'],
      properties: {
        converged: { type: 'boolean' },
        totalEnergy: { type: 'number' },
        optimizedStructure: { type: 'object' },
        finalForces: { type: 'object' },
        optimizationSteps: { type: 'number' },
        energyConvergence: { type: 'array' },
        structuralChanges: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'optimization']
}));

export const electronicStructureTask = defineTask('electronic-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate electronic structure',
  agent: {
    name: 'electronic-structure-specialist',
    prompt: {
      role: 'Electronic Structure Calculation Specialist',
      task: 'Calculate electronic structure properties',
      context: args,
      instructions: [
        '1. Calculate band structure or energy levels',
        '2. Calculate density of states (DOS)',
        '3. Determine HOMO-LUMO gap or band gap',
        '4. Analyze charge distribution',
        '5. Calculate Bader charges if relevant',
        '6. Analyze frontier orbitals',
        '7. Calculate work function if surface',
        '8. Analyze bonding characteristics',
        '9. Document electronic structure results',
        '10. Visualize key electronic properties'
      ],
      outputFormat: 'JSON object with electronic structure results'
    },
    outputSchema: {
      type: 'object',
      required: ['energyLevels', 'bandGap', 'dos'],
      properties: {
        energyLevels: { type: 'object' },
        bandGap: { type: 'number' },
        homoLumoGap: { type: 'number' },
        dos: { type: 'object' },
        chargeDistribution: { type: 'object' },
        frontierOrbitals: { type: 'object' },
        workFunction: { type: 'number' },
        bondingAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'electronic-structure']
}));

export const opticalPropertyTask = defineTask('optical-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate optical properties',
  agent: {
    name: 'optical-property-specialist',
    prompt: {
      role: 'Optical Property Calculation Specialist',
      task: 'Calculate optical properties using TDDFT or similar methods',
      context: args,
      instructions: [
        '1. Select method for optical properties (TDDFT, GW-BSE)',
        '2. Calculate absorption spectrum',
        '3. Identify optical transitions',
        '4. Calculate dielectric function',
        '5. Analyze plasmon resonances if metallic',
        '6. Calculate refractive index',
        '7. Analyze oscillator strengths',
        '8. Compare with experimental spectra if available',
        '9. Document optical calculation results',
        '10. Visualize absorption spectrum'
      ],
      outputFormat: 'JSON object with optical property results'
    },
    outputSchema: {
      type: 'object',
      required: ['absorptionSpectrum', 'opticalTransitions'],
      properties: {
        absorptionSpectrum: { type: 'object' },
        opticalTransitions: { type: 'array' },
        dielectricFunction: { type: 'object' },
        plasmonResonance: { type: 'object' },
        refractiveIndex: { type: 'object' },
        oscillatorStrengths: { type: 'array' },
        method: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'optical']
}));

export const thermodynamicStabilityTask = defineTask('thermodynamic-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess thermodynamic stability',
  agent: {
    name: 'thermodynamics-specialist',
    prompt: {
      role: 'Thermodynamic Stability Assessment Specialist',
      task: 'Assess thermodynamic stability of nanomaterial',
      context: args,
      instructions: [
        '1. Calculate formation energy',
        '2. Calculate cohesive energy',
        '3. Assess stability relative to bulk',
        '4. Calculate surface energy if applicable',
        '5. Assess stability of different isomers',
        '6. Calculate phonon frequencies for dynamic stability',
        '7. Assess thermal stability indicators',
        '8. Compare with competing phases',
        '9. Document stability assessment',
        '10. Identify metastability if present'
      ],
      outputFormat: 'JSON object with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['formationEnergy', 'cohesiveEnergy', 'stabilityAssessment'],
      properties: {
        formationEnergy: { type: 'number' },
        cohesiveEnergy: { type: 'number' },
        surfaceEnergy: { type: 'number' },
        isomerComparison: { type: 'object' },
        phononStability: { type: 'object' },
        stabilityAssessment: { type: 'string' },
        competingPhases: { type: 'array' },
        metastable: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'thermodynamics']
}));

export const propertyPredictionTask = defineTask('property-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Summarize property predictions',
  agent: {
    name: 'property-analyst',
    prompt: {
      role: 'Nanomaterial Property Prediction Analyst',
      task: 'Summarize and interpret DFT property predictions',
      context: args,
      instructions: [
        '1. Compile all calculated properties',
        '2. Interpret electronic structure in context of application',
        '3. Relate optical properties to size/shape',
        '4. Assess stability for practical applications',
        '5. Identify property trends and correlations',
        '6. Compare with literature values',
        '7. Assess calculation reliability',
        '8. Identify key uncertainties',
        '9. Generate property summary table',
        '10. Provide application recommendations'
      ],
      outputFormat: 'JSON object with property predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['propertySummary', 'applicationAssessment'],
      properties: {
        propertySummary: { type: 'object' },
        electronicSummary: { type: 'object' },
        opticalSummary: { type: 'object' },
        stabilitySummary: { type: 'object' },
        literatureComparison: { type: 'object' },
        uncertainties: { type: 'array' },
        applicationAssessment: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'prediction']
}));

export const experimentalValidationTask = defineTask('experimental-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate against experimental data',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Theory-Experiment Validation Specialist',
      task: 'Validate DFT predictions against experimental benchmarks',
      context: args,
      instructions: [
        '1. Compare calculated vs. experimental structure',
        '2. Compare band gap or HOMO-LUMO with experiment',
        '3. Compare optical spectra with measurements',
        '4. Assess systematic errors in calculations',
        '5. Calculate deviation metrics',
        '6. Identify sources of discrepancy',
        '7. Assess if discrepancy is acceptable',
        '8. Recommend calculation improvements if needed',
        '9. Document validation results',
        '10. Assess overall calculation reliability'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['agreementAcceptable', 'deviations', 'maxDeviation'],
      properties: {
        agreementAcceptable: { type: 'boolean' },
        deviations: { type: 'object' },
        maxDeviation: { type: 'number' },
        structuralComparison: { type: 'object' },
        electronicComparison: { type: 'object' },
        opticalComparison: { type: 'object' },
        discrepancySources: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'validation']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DFT calculation report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Computational Chemistry Report Writer',
      task: 'Generate comprehensive DFT calculation report',
      context: args,
      instructions: [
        '1. Create executive summary of calculations',
        '2. Document computational methodology',
        '3. Present structure and convergence results',
        '4. Include electronic structure analysis',
        '5. Present optical property results',
        '6. Include stability assessment',
        '7. Document validation results if available',
        '8. Include visualizations of key results',
        '9. Discuss implications for applications',
        '10. Provide recommendations for future calculations'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'methodology'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        results: { type: 'object' },
        visualizations: { type: 'array' },
        conclusions: { type: 'array', items: { type: 'string' } },
        futureWork: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'dft', 'reporting']
}));
