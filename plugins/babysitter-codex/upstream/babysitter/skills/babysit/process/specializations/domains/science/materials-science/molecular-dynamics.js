/**
 * @process domains/science/materials-science/molecular-dynamics
 * @description Molecular Dynamics Simulation - Execute MD simulations for thermal transport, mechanical deformation,
 * diffusion, and phase transformation kinetics using LAMMPS.
 * @inputs { materialId: string, simulationType: string, temperature?: number, potential?: string }
 * @outputs { success: boolean, trajectoryData: object, properties: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/molecular-dynamics', {
 *   materialId: 'MAT-002',
 *   simulationType: 'thermal-conductivity',
 *   temperature: 300,
 *   potential: 'eam'
 * });
 *
 * @references
 * - LAMMPS: https://www.lammps.org/
 * - ASE: https://wiki.fysik.dtu.dk/ase/
 * - OVITO: https://www.ovito.org/
 * - OpenKIM: https://openkim.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialId,
    simulationType = 'equilibration',
    temperature = 300,
    potential = 'eam',
    pressure = 0,
    ensemble = 'NPT',
    timestep = 1,
    duration = 100000,
    systemSize = { x: 10, y: 10, z: 10 },
    outputDir = 'md-simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Molecular Dynamics Simulation for material: ${materialId}`);
  ctx.log('info', `Simulation type: ${simulationType}, Temperature: ${temperature}K`);

  // Phase 1: System Setup
  ctx.log('info', 'Phase 1: Setting up simulation system');
  const systemSetup = await ctx.task(mdSystemSetupTask, {
    materialId,
    systemSize,
    potential,
    outputDir
  });

  artifacts.push(...systemSetup.artifacts);

  // Phase 2: Potential Selection and Validation
  ctx.log('info', 'Phase 2: Validating interatomic potential');
  const potentialValidation = await ctx.task(potentialValidationTask, {
    materialId,
    potential,
    structure: systemSetup.structure,
    outputDir
  });

  artifacts.push(...potentialValidation.artifacts);

  await ctx.breakpoint({
    question: `Potential validation complete. Lattice constant error: ${potentialValidation.latticeError}%. Elastic constant error: ${potentialValidation.elasticError}%. Proceed with simulation?`,
    title: 'Potential Validation Review',
    context: {
      runId: ctx.runId,
      summary: {
        potential,
        latticeError: potentialValidation.latticeError,
        elasticError: potentialValidation.elasticError,
        cohesiveEnergyError: potentialValidation.cohesiveEnergyError
      },
      files: potentialValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Energy Minimization
  ctx.log('info', 'Phase 3: Performing energy minimization');
  const minimization = await ctx.task(energyMinimizationTask, {
    materialId,
    inputScript: systemSetup.inputScript,
    potential,
    outputDir
  });

  artifacts.push(...minimization.artifacts);

  // Phase 4: Equilibration
  ctx.log('info', 'Phase 4: Equilibrating system');
  const equilibration = await ctx.task(equilibrationTask, {
    materialId,
    minimizedStructure: minimization.minimizedStructure,
    temperature,
    pressure,
    ensemble,
    timestep,
    outputDir
  });

  artifacts.push(...equilibration.artifacts);

  let productionResults = null;

  // Phase 5: Production Run (based on simulation type)
  if (simulationType === 'thermal-conductivity') {
    ctx.log('info', 'Phase 5: Running thermal conductivity simulation');
    productionResults = await ctx.task(thermalConductivityTask, {
      materialId,
      equilibratedStructure: equilibration.finalStructure,
      temperature,
      duration,
      timestep,
      outputDir
    });
  } else if (simulationType === 'mechanical-deformation') {
    ctx.log('info', 'Phase 5: Running mechanical deformation simulation');
    productionResults = await ctx.task(mechanicalDeformationTask, {
      materialId,
      equilibratedStructure: equilibration.finalStructure,
      temperature,
      strainRate: 1e8,
      maxStrain: 0.2,
      outputDir
    });
  } else if (simulationType === 'diffusion') {
    ctx.log('info', 'Phase 5: Running diffusion simulation');
    productionResults = await ctx.task(diffusionSimulationTask, {
      materialId,
      equilibratedStructure: equilibration.finalStructure,
      temperature,
      duration,
      timestep,
      outputDir
    });
  } else if (simulationType === 'phase-transformation') {
    ctx.log('info', 'Phase 5: Running phase transformation simulation');
    productionResults = await ctx.task(phaseTransformationTask, {
      materialId,
      equilibratedStructure: equilibration.finalStructure,
      startTemperature: temperature,
      coolingRate: 1e12,
      outputDir
    });
  } else {
    // Default equilibration study
    productionResults = equilibration;
  }

  artifacts.push(...productionResults.artifacts);

  // Phase 6: Trajectory Analysis
  ctx.log('info', 'Phase 6: Analyzing trajectory');
  const trajectoryAnalysis = await ctx.task(trajectoryAnalysisTask, {
    materialId,
    trajectoryPath: productionResults.trajectoryPath,
    simulationType,
    outputDir
  });

  artifacts.push(...trajectoryAnalysis.artifacts);

  // Phase 7: Visualization
  ctx.log('info', 'Phase 7: Generating visualizations');
  const visualization = await ctx.task(mdVisualizationTask, {
    materialId,
    trajectoryPath: productionResults.trajectoryPath,
    analysisResults: trajectoryAnalysis,
    outputDir
  });

  artifacts.push(...visualization.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Generating simulation report');
  const report = await ctx.task(mdReportTask, {
    materialId,
    simulationType,
    temperature,
    potential,
    systemSetup,
    potentialValidation,
    equilibration,
    productionResults,
    trajectoryAnalysis,
    visualization,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    materialId,
    simulationType,
    temperature,
    potential,
    systemInfo: {
      atomCount: systemSetup.atomCount,
      boxDimensions: systemSetup.boxDimensions,
      simulationTime: productionResults.simulationTime
    },
    trajectoryData: {
      path: productionResults.trajectoryPath,
      frames: productionResults.frameCount,
      timestep: timestep
    },
    properties: trajectoryAnalysis.calculatedProperties,
    simulationResults: productionResults.results,
    artifacts,
    reportPath: report.reportPath,
    duration: duration_ms,
    metadata: {
      processId: 'domains/science/materials-science/molecular-dynamics',
      timestamp: startTime,
      ensemble,
      timestep,
      outputDir
    }
  };
}

// Task 1: System Setup
export const mdSystemSetupTask = defineTask('md-system-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `MD System Setup - ${args.materialId}`,
  agent: {
    name: 'md-specialist',
    prompt: {
      role: 'Molecular Dynamics Specialist',
      task: 'Set up molecular dynamics simulation system',
      context: args,
      instructions: [
        '1. Create initial atomic configuration',
        '2. Build supercell of required size',
        '3. Define simulation box and boundary conditions',
        '4. Set up atom types and masses',
        '5. Generate LAMMPS data file',
        '6. Create initial input script template',
        '7. Define output settings (dump, thermo)',
        '8. Set up compute groups if needed',
        '9. Verify system setup',
        '10. Document system parameters'
      ],
      outputFormat: 'JSON with system setup results'
    },
    outputSchema: {
      type: 'object',
      required: ['atomCount', 'boxDimensions', 'inputScript', 'artifacts'],
      properties: {
        atomCount: { type: 'number' },
        boxDimensions: { type: 'object' },
        structure: { type: 'string' },
        inputScript: { type: 'string' },
        dataFile: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'setup', 'materials-science']
}));

// Task 2: Potential Validation
export const potentialValidationTask = defineTask('md-potential-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Potential Validation - ${args.materialId}`,
  agent: {
    name: 'potential-specialist',
    prompt: {
      role: 'Interatomic Potential Specialist',
      task: 'Validate interatomic potential against reference data',
      context: args,
      instructions: [
        '1. Identify potential type (EAM, MEAM, Tersoff, ReaxFF)',
        '2. Obtain potential file from OpenKIM or literature',
        '3. Calculate equilibrium lattice constant',
        '4. Calculate cohesive energy',
        '5. Calculate elastic constants',
        '6. Compare with DFT/experimental values',
        '7. Calculate surface energies if relevant',
        '8. Test phonon dispersion if needed',
        '9. Assess potential limitations',
        '10. Document validation results'
      ],
      outputFormat: 'JSON with potential validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialValid', 'latticeError', 'artifacts'],
      properties: {
        potentialValid: { type: 'boolean' },
        potentialFile: { type: 'string' },
        latticeConstant: { type: 'number' },
        latticeError: { type: 'number', description: 'percent' },
        cohesiveEnergy: { type: 'number' },
        cohesiveEnergyError: { type: 'number' },
        elasticConstants: { type: 'object' },
        elasticError: { type: 'number', description: 'percent' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'potential', 'validation', 'materials-science']
}));

// Task 3: Energy Minimization
export const energyMinimizationTask = defineTask('md-energy-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Energy Minimization - ${args.materialId}`,
  agent: {
    name: 'md-calculator',
    prompt: {
      role: 'MD Simulation Runner',
      task: 'Perform energy minimization of atomic structure',
      context: args,
      instructions: [
        '1. Set up minimization algorithm (CG, FIRE)',
        '2. Define energy and force tolerances',
        '3. Run minimization',
        '4. Monitor energy convergence',
        '5. Check final forces',
        '6. Verify structure integrity',
        '7. Save minimized structure',
        '8. Document minimization statistics',
        '9. Verify no atoms overlap',
        '10. Output minimized configuration'
      ],
      outputFormat: 'JSON with minimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'finalEnergy', 'minimizedStructure', 'artifacts'],
      properties: {
        converged: { type: 'boolean' },
        finalEnergy: { type: 'number', description: 'eV' },
        energyPerAtom: { type: 'number', description: 'eV/atom' },
        maxForce: { type: 'number' },
        minimizedStructure: { type: 'string' },
        iterations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'minimization', 'materials-science']
}));

// Task 4: Equilibration
export const equilibrationTask = defineTask('md-equilibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Equilibration - ${args.materialId}`,
  agent: {
    name: 'md-equilibration-specialist',
    prompt: {
      role: 'MD Equilibration Specialist',
      task: 'Equilibrate system to target temperature and pressure',
      context: args,
      instructions: [
        '1. Initialize velocities from Maxwell-Boltzmann',
        '2. Set up thermostat (Nose-Hoover, Langevin)',
        '3. Set up barostat if NPT (Parrinello-Rahman)',
        '4. Run equilibration with velocity rescaling',
        '5. Switch to proper thermostat',
        '6. Monitor temperature and pressure',
        '7. Check energy conservation (NVE check)',
        '8. Verify equilibration using block averaging',
        '9. Save equilibrated structure',
        '10. Document equilibration statistics'
      ],
      outputFormat: 'JSON with equilibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibrated', 'finalTemperature', 'finalStructure', 'artifacts'],
      properties: {
        equilibrated: { type: 'boolean' },
        finalTemperature: { type: 'number', description: 'K' },
        finalPressure: { type: 'number', description: 'bar' },
        finalDensity: { type: 'number', description: 'g/cm^3' },
        finalStructure: { type: 'string' },
        equilibrationTime: { type: 'number', description: 'ps' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'equilibration', 'materials-science']
}));

// Task 5a: Thermal Conductivity Simulation
export const thermalConductivityTask = defineTask('md-thermal-conductivity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Conductivity Simulation - ${args.materialId}`,
  agent: {
    name: 'thermal-transport-specialist',
    prompt: {
      role: 'Thermal Transport Simulation Specialist',
      task: 'Calculate thermal conductivity using MD methods',
      context: args,
      instructions: [
        '1. Choose method (NEMD, Green-Kubo, AEMD)',
        '2. Set up heat source and sink for NEMD',
        '3. Or compute heat flux autocorrelation for GK',
        '4. Run production simulation',
        '5. Establish steady state (NEMD)',
        '6. Calculate temperature gradient',
        '7. Calculate heat flux',
        '8. Compute thermal conductivity',
        '9. Assess size effects',
        '10. Document results with uncertainties'
      ],
      outputFormat: 'JSON with thermal conductivity results'
    },
    outputSchema: {
      type: 'object',
      required: ['thermalConductivity', 'method', 'trajectoryPath', 'artifacts'],
      properties: {
        thermalConductivity: { type: 'number', description: 'W/m-K' },
        thermalConductivityError: { type: 'number' },
        method: { type: 'string' },
        temperatureGradient: { type: 'number' },
        heatFlux: { type: 'number' },
        simulationTime: { type: 'number', description: 'ps' },
        trajectoryPath: { type: 'string' },
        frameCount: { type: 'number' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'thermal-conductivity', 'materials-science']
}));

// Task 5b: Mechanical Deformation Simulation
export const mechanicalDeformationTask = defineTask('md-mechanical-deformation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Deformation Simulation - ${args.materialId}`,
  agent: {
    name: 'mechanical-md-specialist',
    prompt: {
      role: 'Mechanical Deformation MD Specialist',
      task: 'Simulate mechanical deformation and extract stress-strain',
      context: args,
      instructions: [
        '1. Choose deformation mode (tension, compression, shear)',
        '2. Set strain rate',
        '3. Apply deformation incrementally',
        '4. Calculate stress tensor',
        '5. Extract stress-strain curve',
        '6. Identify yield point',
        '7. Observe dislocation nucleation',
        '8. Detect stacking faults/twins',
        '9. Calculate elastic modulus',
        '10. Document deformation mechanisms'
      ],
      outputFormat: 'JSON with mechanical deformation results'
    },
    outputSchema: {
      type: 'object',
      required: ['stressStrainData', 'yieldStress', 'trajectoryPath', 'artifacts'],
      properties: {
        stressStrainData: { type: 'string' },
        yieldStress: { type: 'number', description: 'GPa' },
        ultimateStrength: { type: 'number', description: 'GPa' },
        elasticModulus: { type: 'number', description: 'GPa' },
        deformationMechanisms: { type: 'array', items: { type: 'string' } },
        simulationTime: { type: 'number' },
        trajectoryPath: { type: 'string' },
        frameCount: { type: 'number' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'mechanical', 'deformation', 'materials-science']
}));

// Task 5c: Diffusion Simulation
export const diffusionSimulationTask = defineTask('md-diffusion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diffusion Simulation - ${args.materialId}`,
  agent: {
    name: 'diffusion-md-specialist',
    prompt: {
      role: 'Diffusion MD Simulation Specialist',
      task: 'Calculate diffusion coefficients from MD trajectories',
      context: args,
      instructions: [
        '1. Run NVT production simulation',
        '2. Calculate mean squared displacement (MSD)',
        '3. Verify linear MSD regime',
        '4. Calculate diffusion coefficient from MSD slope',
        '5. Alternatively use velocity autocorrelation (VAC)',
        '6. Calculate activation energy from Arrhenius',
        '7. Distinguish bulk vs. grain boundary diffusion',
        '8. Calculate tracer vs. chemical diffusion',
        '9. Assess finite-size effects',
        '10. Report D with uncertainties'
      ],
      outputFormat: 'JSON with diffusion results'
    },
    outputSchema: {
      type: 'object',
      required: ['diffusionCoefficient', 'msdData', 'trajectoryPath', 'artifacts'],
      properties: {
        diffusionCoefficient: { type: 'number', description: 'cm^2/s' },
        diffusionError: { type: 'number' },
        msdData: { type: 'string' },
        activationEnergy: { type: 'number', description: 'eV' },
        preExponentialFactor: { type: 'number' },
        simulationTime: { type: 'number', description: 'ps' },
        trajectoryPath: { type: 'string' },
        frameCount: { type: 'number' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'diffusion', 'transport', 'materials-science']
}));

// Task 5d: Phase Transformation Simulation
export const phaseTransformationTask = defineTask('md-phase-transformation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase Transformation Simulation - ${args.materialId}`,
  agent: {
    name: 'phase-transformation-specialist',
    prompt: {
      role: 'Phase Transformation MD Specialist',
      task: 'Simulate phase transformations during heating/cooling',
      context: args,
      instructions: [
        '1. Set up heating or cooling protocol',
        '2. Apply temperature ramp',
        '3. Monitor structural changes',
        '4. Track order parameters',
        '5. Identify transformation temperature',
        '6. Characterize nucleation events',
        '7. Analyze transformation kinetics',
        '8. Identify transformation mechanism',
        '9. Calculate latent heat',
        '10. Compare with phase diagram'
      ],
      outputFormat: 'JSON with phase transformation results'
    },
    outputSchema: {
      type: 'object',
      required: ['transformationTemperature', 'phases', 'trajectoryPath', 'artifacts'],
      properties: {
        transformationTemperature: { type: 'number', description: 'K' },
        phases: { type: 'array', items: { type: 'string' } },
        transformationType: { type: 'string' },
        nucleationMechanism: { type: 'string' },
        latentHeat: { type: 'number', description: 'kJ/mol' },
        transformationKinetics: { type: 'object' },
        simulationTime: { type: 'number' },
        trajectoryPath: { type: 'string' },
        frameCount: { type: 'number' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'phase-transformation', 'materials-science']
}));

// Task 6: Trajectory Analysis
export const trajectoryAnalysisTask = defineTask('md-trajectory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Analysis - ${args.materialId}`,
  agent: {
    name: 'trajectory-analyst',
    prompt: {
      role: 'MD Trajectory Analysis Specialist',
      task: 'Analyze MD trajectory for structural and dynamic properties',
      context: args,
      instructions: [
        '1. Calculate radial distribution function g(r)',
        '2. Compute structure factor S(q)',
        '3. Calculate coordination numbers',
        '4. Analyze bond angle distributions',
        '5. Compute velocity autocorrelation',
        '6. Calculate vibrational DOS',
        '7. Identify defects (vacancies, interstitials)',
        '8. Perform common neighbor analysis (CNA)',
        '9. Calculate Lindemann index',
        '10. Generate analysis summary'
      ],
      outputFormat: 'JSON with trajectory analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['calculatedProperties', 'artifacts'],
      properties: {
        calculatedProperties: {
          type: 'object',
          properties: {
            rdf: { type: 'string' },
            structureFactor: { type: 'string' },
            coordinationNumber: { type: 'number' },
            lindemannIndex: { type: 'number' }
          }
        },
        defectAnalysis: { type: 'object' },
        structuralAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'trajectory-analysis', 'materials-science']
}));

// Task 7: Visualization
export const mdVisualizationTask = defineTask('md-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: `MD Visualization - ${args.materialId}`,
  agent: {
    name: 'visualization-specialist',
    prompt: {
      role: 'MD Visualization Specialist',
      task: 'Generate visualizations of MD simulation results',
      context: args,
      instructions: [
        '1. Load trajectory into OVITO',
        '2. Apply structural modifiers (CNA, DXA)',
        '3. Generate atomic configuration snapshots',
        '4. Create animation of trajectory',
        '5. Visualize defects and dislocations',
        '6. Color atoms by property (stress, PE)',
        '7. Generate property evolution plots',
        '8. Create publication-quality figures',
        '9. Export visualizations',
        '10. Document visualization settings'
      ],
      outputFormat: 'JSON with visualization results'
    },
    outputSchema: {
      type: 'object',
      required: ['images', 'animations', 'artifacts'],
      properties: {
        images: { type: 'array', items: { type: 'string' } },
        animations: { type: 'array', items: { type: 'string' } },
        plots: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'molecular-dynamics', 'visualization', 'materials-science']
}));

// Task 8: Report Generation
export const mdReportTask = defineTask('md-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `MD Simulation Report - ${args.materialId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'MD Simulation Technical Writer',
      task: 'Generate comprehensive MD simulation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document simulation methodology',
        '3. Report system details',
        '4. Present potential validation',
        '5. Document equilibration results',
        '6. Present production run results',
        '7. Include trajectory analysis',
        '8. Add visualizations',
        '9. Discuss results and conclusions',
        '10. Format for publication/archive'
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
  labels: ['agent', 'molecular-dynamics', 'report', 'documentation', 'materials-science']
}));
