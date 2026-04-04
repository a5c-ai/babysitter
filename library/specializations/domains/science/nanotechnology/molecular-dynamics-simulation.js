/**
 * @process specializations/domains/science/nanotechnology/molecular-dynamics-simulation
 * @description Molecular Dynamics Simulation Workflow - Execute molecular dynamics simulations of
 * nanoscale systems including force field selection, system equilibration, production runs,
 * trajectory analysis, and property extraction with validation against experimental benchmarks
 * and iterative parameter refinement.
 * @inputs { system: object, simulationGoals: array, forceFieldPreference?: string, computationalResources?: object }
 * @outputs { success: boolean, trajectoryAnalysis: object, propertyExtraction: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/molecular-dynamics-simulation', {
 *   system: { type: 'nanoparticle-in-solvent', nanoparticle: 'Au', solvent: 'water', npSize: 3 },
 *   simulationGoals: ['diffusion-coefficient', 'radial-distribution', 'thermal-properties'],
 *   forceFieldPreference: 'embedded-atom',
 *   computationalResources: { cores: 64, gpus: 4, walltime: '72h' }
 * });
 *
 * @references
 * - LAMMPS (Large-scale Atomic/Molecular Massively Parallel Simulator): https://www.lammps.org/
 * - GROMACS: https://www.gromacs.org/
 * - OVITO (Open Visualization Tool): https://www.ovito.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    simulationGoals,
    forceFieldPreference = 'auto',
    computationalResources = {},
    experimentalBenchmarks = null,
    maxEquilibrationCycles = 5
  } = inputs;

  // Phase 1: Simulation Setup
  const simulationSetup = await ctx.task(simulationSetupTask, {
    system,
    simulationGoals,
    forceFieldPreference,
    computationalResources
  });

  // Quality Gate: Setup must be valid
  if (!simulationSetup.valid) {
    return {
      success: false,
      error: 'MD simulation setup not valid',
      phase: 'simulation-setup',
      recommendations: simulationSetup.recommendations
    };
  }

  // Breakpoint: Review simulation setup
  await ctx.breakpoint({
    question: `Review MD setup for ${system.type}. Force field: ${simulationSetup.forceField}. System size: ${simulationSetup.atomCount} atoms. Estimated time: ${simulationSetup.estimatedTime}. Approve?`,
    title: 'MD Simulation Setup Review',
    context: {
      runId: ctx.runId,
      system,
      simulationSetup,
      files: [{
        path: 'artifacts/simulation-setup.json',
        format: 'json',
        content: simulationSetup
      }]
    }
  });

  // Phase 2: Force Field Selection and Validation
  const forceFieldValidation = await ctx.task(forceFieldValidationTask, {
    system,
    simulationSetup,
    forceFieldPreference
  });

  // Quality Gate: Force field must be validated
  if (!forceFieldValidation.validated) {
    await ctx.breakpoint({
      question: `Force field validation concerns: ${forceFieldValidation.concerns.join(', ')}. Proceed with caution?`,
      title: 'Force Field Validation Warning',
      context: {
        runId: ctx.runId,
        forceFieldValidation,
        recommendations: forceFieldValidation.recommendations
      }
    });
  }

  // Phase 3: System Construction
  const systemConstruction = await ctx.task(systemConstructionTask, {
    system,
    simulationSetup,
    forceFieldValidation
  });

  // Phase 4: Energy Minimization
  const energyMinimization = await ctx.task(energyMinimizationTask, {
    systemConstruction,
    simulationSetup
  });

  // Phase 5: Equilibration (Iterative)
  let equilibrationCycle = 0;
  let equilibrated = false;
  let equilibrationMetrics = null;
  const equilibrationHistory = [];

  while (!equilibrated && equilibrationCycle < maxEquilibrationCycles) {
    equilibrationCycle++;

    // NVT Equilibration
    const nvtEquilibration = await ctx.task(nvtEquilibrationTask, {
      systemConstruction,
      energyMinimization,
      simulationSetup,
      cycle: equilibrationCycle
    });

    // NPT Equilibration (if needed)
    let nptEquilibration = null;
    if (simulationSetup.ensemble.includes('NPT')) {
      nptEquilibration = await ctx.task(nptEquilibrationTask, {
        systemConstruction,
        nvtEquilibration,
        simulationSetup,
        cycle: equilibrationCycle
      });
    }

    // Equilibration Assessment
    equilibrationMetrics = await ctx.task(equilibrationAssessmentTask, {
      nvtEquilibration,
      nptEquilibration,
      simulationSetup,
      cycle: equilibrationCycle
    });

    equilibrated = equilibrationMetrics.equilibrated;

    equilibrationHistory.push({
      cycle: equilibrationCycle,
      nvtEquilibration,
      nptEquilibration,
      metrics: equilibrationMetrics
    });

    if (!equilibrated && equilibrationCycle < maxEquilibrationCycles) {
      await ctx.breakpoint({
        question: `Equilibration cycle ${equilibrationCycle}: Not equilibrated. ${equilibrationMetrics.issues.join(', ')}. Continue?`,
        title: 'Equilibration Progress',
        context: {
          runId: ctx.runId,
          cycle: equilibrationCycle,
          metrics: equilibrationMetrics
        }
      });
    }
  }

  // Quality Gate: System must be equilibrated
  if (!equilibrated) {
    await ctx.breakpoint({
      question: `System not equilibrated after ${equilibrationCycle} cycles. Proceed with production run anyway?`,
      title: 'Equilibration Warning',
      context: {
        runId: ctx.runId,
        equilibrationHistory,
        recommendations: equilibrationMetrics.recommendations
      }
    });
  }

  // Phase 6: Production Run
  const productionRun = await ctx.task(productionRunTask, {
    systemConstruction,
    equilibrationHistory,
    simulationSetup,
    simulationGoals
  });

  // Breakpoint: Production run complete
  await ctx.breakpoint({
    question: `Production run complete. ${productionRun.trajectoryFrames} frames collected over ${productionRun.simulationTime}. Proceed with analysis?`,
    title: 'Production Run Review',
    context: {
      runId: ctx.runId,
      productionRun,
      trajectoryInfo: productionRun.trajectoryInfo
    }
  });

  // Phase 7: Trajectory Analysis
  const trajectoryAnalysis = await ctx.task(trajectoryAnalysisTask, {
    productionRun,
    simulationGoals,
    system
  });

  // Phase 8: Property Extraction
  const propertyExtraction = await ctx.task(propertyExtractionTask, {
    trajectoryAnalysis,
    simulationGoals,
    system,
    productionRun
  });

  // Phase 9: Statistical Analysis
  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    trajectoryAnalysis,
    propertyExtraction,
    productionRun
  });

  // Phase 10: Experimental Validation (if benchmarks provided)
  let validation = null;
  if (experimentalBenchmarks) {
    validation = await ctx.task(experimentalValidationTask, {
      propertyExtraction,
      experimentalBenchmarks,
      statisticalAnalysis
    });
  }

  // Phase 11: Report Generation
  const simulationReport = await ctx.task(reportGenerationTask, {
    system,
    simulationSetup,
    equilibrationHistory,
    productionRun,
    trajectoryAnalysis,
    propertyExtraction,
    statisticalAnalysis,
    validation
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `MD simulation complete for ${system.type}. ${Object.keys(propertyExtraction.properties).length} properties extracted. Approve results?`,
    title: 'MD Simulation Results Approval',
    context: {
      runId: ctx.runId,
      propertyExtraction,
      validation,
      files: [
        { path: 'artifacts/md-report.md', format: 'markdown', content: simulationReport.markdown },
        { path: 'artifacts/properties.json', format: 'json', content: propertyExtraction }
      ]
    }
  });

  return {
    success: true,
    trajectoryAnalysis,
    propertyExtraction,
    statisticalAnalysis,
    validation,
    equilibrationHistory,
    report: simulationReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/molecular-dynamics-simulation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const simulationSetupTask = defineTask('simulation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup MD simulation for ${args.system.type}`,
  agent: {
    name: 'md-specialist',
    prompt: {
      role: 'Molecular Dynamics Simulation Specialist',
      task: 'Setup molecular dynamics simulation parameters',
      context: args,
      instructions: [
        '1. Select appropriate MD code for system type',
        '2. Choose force field suitable for nanomaterial and environment',
        '3. Define simulation box and periodic boundary conditions',
        '4. Set timestep appropriate for system dynamics',
        '5. Define ensemble (NVE, NVT, NPT)',
        '6. Select thermostat and barostat algorithms',
        '7. Plan equilibration and production run lengths',
        '8. Define trajectory output frequency',
        '9. Estimate computational resources needed',
        '10. Document simulation rationale'
      ],
      outputFormat: 'JSON object with simulation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'forceField', 'atomCount', 'estimatedTime'],
      properties: {
        valid: { type: 'boolean' },
        mdCode: { type: 'string' },
        forceField: { type: 'string' },
        atomCount: { type: 'number' },
        boxDimensions: { type: 'object' },
        timestep: { type: 'number' },
        ensemble: { type: 'array' },
        thermostat: { type: 'string' },
        barostat: { type: 'string' },
        estimatedTime: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'setup']
}));

export const forceFieldValidationTask = defineTask('force-field-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate force field selection',
  agent: {
    name: 'force-field-specialist',
    prompt: {
      role: 'Force Field Validation Specialist',
      task: 'Validate force field for nanomaterial simulation',
      context: args,
      instructions: [
        '1. Verify force field coverage for all atom types',
        '2. Check force field parameterization for nanoscale',
        '3. Validate against known material properties',
        '4. Check compatibility with simulation goals',
        '5. Assess accuracy for size-dependent properties',
        '6. Review literature validation studies',
        '7. Identify any parameter modifications needed',
        '8. Document force field limitations',
        '9. Assess cross-term accuracy if mixed system',
        '10. Recommend validation tests'
      ],
      outputFormat: 'JSON object with force field validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'forceField', 'coverage'],
      properties: {
        validated: { type: 'boolean' },
        forceField: { type: 'string' },
        coverage: { type: 'object' },
        validationTests: { type: 'array' },
        knownLimitations: { type: 'array' },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'force-field']
}));

export const systemConstructionTask = defineTask('system-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct simulation system',
  agent: {
    name: 'system-builder',
    prompt: {
      role: 'MD System Construction Specialist',
      task: 'Build molecular dynamics simulation system',
      context: args,
      instructions: [
        '1. Build nanoparticle structure',
        '2. Add solvent molecules if applicable',
        '3. Add ions for charge neutralization if needed',
        '4. Set simulation box with appropriate dimensions',
        '5. Check for atomic overlaps',
        '6. Assign atom types and charges',
        '7. Generate topology file',
        '8. Verify system composition',
        '9. Generate input files for MD code',
        '10. Document system construction'
      ],
      outputFormat: 'JSON object with constructed system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'totalAtoms', 'composition'],
      properties: {
        system: { type: 'object' },
        totalAtoms: { type: 'number' },
        composition: { type: 'object' },
        boxDimensions: { type: 'object' },
        density: { type: 'number' },
        topology: { type: 'object' },
        inputFiles: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'system-construction']
}));

export const energyMinimizationTask = defineTask('energy-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform energy minimization',
  agent: {
    name: 'minimization-specialist',
    prompt: {
      role: 'Energy Minimization Specialist',
      task: 'Perform energy minimization of simulation system',
      context: args,
      instructions: [
        '1. Select minimization algorithm (steepest descent, conjugate gradient)',
        '2. Set convergence criteria',
        '3. Execute minimization run',
        '4. Monitor energy convergence',
        '5. Check for convergence issues',
        '6. Verify final structure is physical',
        '7. Calculate final potential energy',
        '8. Assess structure quality',
        '9. Document minimization results',
        '10. Prepare structure for equilibration'
      ],
      outputFormat: 'JSON object with minimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'finalEnergy', 'minimizedStructure'],
      properties: {
        converged: { type: 'boolean' },
        finalEnergy: { type: 'number' },
        minimizationSteps: { type: 'number' },
        energyConvergence: { type: 'array' },
        minimizedStructure: { type: 'object' },
        structureQuality: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'minimization']
}));

export const nvtEquilibrationTask = defineTask('nvt-equilibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `NVT equilibration (cycle ${args.cycle})`,
  agent: {
    name: 'equilibration-specialist',
    prompt: {
      role: 'MD Equilibration Specialist',
      task: 'Perform NVT ensemble equilibration',
      context: args,
      instructions: [
        '1. Set up NVT simulation with thermostat',
        '2. Define target temperature and coupling constant',
        '3. Execute NVT equilibration run',
        '4. Monitor temperature convergence',
        '5. Monitor potential energy evolution',
        '6. Check for temperature oscillations',
        '7. Verify velocity distribution',
        '8. Assess kinetic energy equilibration',
        '9. Document NVT equilibration results',
        '10. Prepare for NPT or production'
      ],
      outputFormat: 'JSON object with NVT equilibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['targetTemperature', 'finalTemperature', 'temperatureConverged'],
      properties: {
        targetTemperature: { type: 'number' },
        finalTemperature: { type: 'number' },
        temperatureConverged: { type: 'boolean' },
        temperatureFluctuation: { type: 'number' },
        potentialEnergy: { type: 'object' },
        kineticEnergy: { type: 'object' },
        equilibrationTime: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'nvt', `cycle-${args.cycle}`]
}));

export const nptEquilibrationTask = defineTask('npt-equilibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `NPT equilibration (cycle ${args.cycle})`,
  agent: {
    name: 'npt-specialist',
    prompt: {
      role: 'NPT Equilibration Specialist',
      task: 'Perform NPT ensemble equilibration',
      context: args,
      instructions: [
        '1. Set up NPT simulation with barostat',
        '2. Define target pressure and coupling',
        '3. Execute NPT equilibration run',
        '4. Monitor pressure convergence',
        '5. Monitor box volume/density evolution',
        '6. Check for pressure oscillations',
        '7. Verify density convergence',
        '8. Assess structural changes',
        '9. Document NPT equilibration results',
        '10. Verify final density is physical'
      ],
      outputFormat: 'JSON object with NPT equilibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['targetPressure', 'finalPressure', 'densityConverged'],
      properties: {
        targetPressure: { type: 'number' },
        finalPressure: { type: 'number' },
        pressureFluctuation: { type: 'number' },
        finalDensity: { type: 'number' },
        densityConverged: { type: 'boolean' },
        volumeEvolution: { type: 'object' },
        equilibrationTime: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'npt', `cycle-${args.cycle}`]
}));

export const equilibrationAssessmentTask = defineTask('equilibration-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess equilibration (cycle ${args.cycle})`,
  agent: {
    name: 'equilibration-analyst',
    prompt: {
      role: 'Equilibration Assessment Analyst',
      task: 'Assess system equilibration quality',
      context: args,
      instructions: [
        '1. Analyze temperature time series',
        '2. Analyze pressure time series if NPT',
        '3. Analyze potential energy time series',
        '4. Check for drift in properties',
        '5. Assess property fluctuation magnitudes',
        '6. Check for structural equilibration',
        '7. Verify no phase transitions occurred',
        '8. Calculate equilibration metrics',
        '9. Determine if system is equilibrated',
        '10. Recommend additional equilibration if needed'
      ],
      outputFormat: 'JSON object with equilibration assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibrated', 'metrics', 'issues'],
      properties: {
        equilibrated: { type: 'boolean' },
        metrics: { type: 'object' },
        temperatureAnalysis: { type: 'object' },
        pressureAnalysis: { type: 'object' },
        energyAnalysis: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'assessment', `cycle-${args.cycle}`]
}));

export const productionRunTask = defineTask('production-run', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute production run',
  agent: {
    name: 'production-specialist',
    prompt: {
      role: 'MD Production Run Specialist',
      task: 'Execute production molecular dynamics run',
      context: args,
      instructions: [
        '1. Set up production run parameters',
        '2. Define trajectory output frequency',
        '3. Execute production simulation',
        '4. Monitor simulation stability',
        '5. Check for energy conservation (NVE) or proper thermostatting',
        '6. Monitor for any system issues',
        '7. Collect trajectory data',
        '8. Calculate simulation statistics',
        '9. Document production run details',
        '10. Verify trajectory completeness'
      ],
      outputFormat: 'JSON object with production run results'
    },
    outputSchema: {
      type: 'object',
      required: ['simulationTime', 'trajectoryFrames', 'trajectoryInfo'],
      properties: {
        simulationTime: { type: 'string' },
        trajectoryFrames: { type: 'number' },
        outputFrequency: { type: 'string' },
        trajectoryInfo: { type: 'object' },
        simulationStatistics: { type: 'object' },
        stabilityMetrics: { type: 'object' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'production']
}));

export const trajectoryAnalysisTask = defineTask('trajectory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze trajectory',
  agent: {
    name: 'trajectory-analyst',
    prompt: {
      role: 'MD Trajectory Analysis Specialist',
      task: 'Analyze molecular dynamics trajectory',
      context: args,
      instructions: [
        '1. Calculate radial distribution functions',
        '2. Calculate mean square displacements',
        '3. Analyze structural evolution',
        '4. Calculate coordination numbers',
        '5. Analyze nanoparticle shape/size fluctuations',
        '6. Calculate velocity autocorrelation functions',
        '7. Analyze interface structure if applicable',
        '8. Calculate time correlation functions',
        '9. Identify any structural transitions',
        '10. Document trajectory analysis results'
      ],
      outputFormat: 'JSON object with trajectory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rdf', 'msd', 'structuralAnalysis'],
      properties: {
        rdf: { type: 'object' },
        msd: { type: 'object' },
        structuralAnalysis: { type: 'object' },
        coordinationNumbers: { type: 'object' },
        shapeFluctuations: { type: 'object' },
        vacf: { type: 'object' },
        correlationFunctions: { type: 'object' },
        transitions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'analysis']
}));

export const propertyExtractionTask = defineTask('property-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract material properties',
  agent: {
    name: 'property-extractor',
    prompt: {
      role: 'MD Property Extraction Specialist',
      task: 'Extract material properties from MD trajectory',
      context: args,
      instructions: [
        '1. Calculate diffusion coefficients from MSD',
        '2. Calculate thermal conductivity if applicable',
        '3. Extract mechanical properties if applicable',
        '4. Calculate surface tension/energy if interface',
        '5. Extract structural properties (lattice, density)',
        '6. Calculate dynamic properties (viscosity, etc.)',
        '7. Extract thermodynamic properties',
        '8. Calculate specific heat capacity',
        '9. Extract any simulation-goal-specific properties',
        '10. Document all extracted properties'
      ],
      outputFormat: 'JSON object with extracted properties'
    },
    outputSchema: {
      type: 'object',
      required: ['properties'],
      properties: {
        properties: { type: 'object' },
        diffusionCoefficient: { type: 'object' },
        thermalProperties: { type: 'object' },
        mechanicalProperties: { type: 'object' },
        structuralProperties: { type: 'object' },
        surfaceProperties: { type: 'object' },
        dynamicProperties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'properties']
}));

export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform statistical analysis',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'MD Statistical Analysis Specialist',
      task: 'Perform statistical analysis of simulation results',
      context: args,
      instructions: [
        '1. Calculate property means and standard errors',
        '2. Perform block averaging for error estimation',
        '3. Calculate autocorrelation times',
        '4. Assess statistical convergence',
        '5. Calculate confidence intervals',
        '6. Check for sampling adequacy',
        '7. Identify any sampling biases',
        '8. Perform time series analysis',
        '9. Calculate uncertainty propagation',
        '10. Document statistical analysis results'
      ],
      outputFormat: 'JSON object with statistical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['means', 'standardErrors', 'convergenceAssessment'],
      properties: {
        means: { type: 'object' },
        standardErrors: { type: 'object' },
        blockAveraging: { type: 'object' },
        autocorrelationTimes: { type: 'object' },
        convergenceAssessment: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        samplingQuality: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'statistics']
}));

export const experimentalValidationTask = defineTask('experimental-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate against experimental data',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'MD-Experiment Validation Specialist',
      task: 'Validate MD predictions against experimental benchmarks',
      context: args,
      instructions: [
        '1. Compare calculated diffusion with measurements',
        '2. Compare structural properties with experiment',
        '3. Compare thermodynamic properties if available',
        '4. Assess systematic deviations',
        '5. Calculate deviation metrics',
        '6. Identify sources of discrepancy',
        '7. Assess force field accuracy',
        '8. Evaluate simulation limitations',
        '9. Document validation results',
        '10. Recommend improvements'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['agreementLevel', 'deviations'],
      properties: {
        agreementLevel: { type: 'string' },
        deviations: { type: 'object' },
        structuralComparison: { type: 'object' },
        dynamicComparison: { type: 'object' },
        thermodynamicComparison: { type: 'object' },
        discrepancySources: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'validation']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate MD simulation report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'MD Simulation Report Writer',
      task: 'Generate comprehensive MD simulation report',
      context: args,
      instructions: [
        '1. Create executive summary of simulation',
        '2. Document system setup and methodology',
        '3. Present equilibration results',
        '4. Include trajectory analysis results',
        '5. Present extracted properties',
        '6. Include statistical analysis',
        '7. Document validation results if available',
        '8. Include visualizations',
        '9. Discuss implications and limitations',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        results: { type: 'object' },
        visualizations: { type: 'array' },
        conclusions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'md', 'reporting']
}));
