/**
 * @process domains/science/materials-science/dft-calculation
 * @description DFT Electronic Structure Calculation - Perform density functional theory calculations for electronic
 * structure, band gaps, formation energies, and elastic constants using VASP/Quantum ESPRESSO.
 * @inputs { materialId: string, structure: object, calculationType: string, functionalType?: string }
 * @outputs { success: boolean, electronicStructure: object, formationEnergy: number, elasticConstants: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/dft-calculation', {
 *   materialId: 'MAT-001',
 *   structure: { formula: 'TiO2', spaceGroup: 'P42/mnm' },
 *   calculationType: 'electronic-structure',
 *   functionalType: 'PBE'
 * });
 *
 * @references
 * - VASP: https://www.vasp.at/
 * - Quantum ESPRESSO: https://www.quantum-espresso.org/
 * - pymatgen: https://pymatgen.org/
 * - Materials Project: https://materialsproject.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialId,
    structure,
    calculationType = 'electronic-structure',
    functionalType = 'PBE',
    kpointDensity = 40,
    encut = 520,
    convergenceThreshold = 1e-6,
    code = 'VASP',
    spinPolarized = false,
    includeSoc = false,
    outputDir = 'dft-calculation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DFT Calculation for material: ${materialId}`);
  ctx.log('info', `Calculation type: ${calculationType}, Functional: ${functionalType}`);

  // Phase 1: Structure Preparation
  ctx.log('info', 'Phase 1: Preparing crystal structure');
  const structurePrep = await ctx.task(structurePreparationTask, {
    materialId,
    structure,
    code,
    outputDir
  });

  artifacts.push(...structurePrep.artifacts);

  // Phase 2: Input Generation
  ctx.log('info', 'Phase 2: Generating DFT input files');
  const inputGeneration = await ctx.task(dftInputGenerationTask, {
    materialId,
    structurePrep,
    functionalType,
    kpointDensity,
    encut,
    spinPolarized,
    includeSoc,
    calculationType,
    code,
    outputDir
  });

  artifacts.push(...inputGeneration.artifacts);

  // Phase 3: Structure Relaxation
  ctx.log('info', 'Phase 3: Performing structure relaxation');
  const relaxation = await ctx.task(structureRelaxationTask, {
    materialId,
    inputFiles: inputGeneration.inputPaths,
    convergenceThreshold,
    code,
    outputDir
  });

  artifacts.push(...relaxation.artifacts);

  await ctx.breakpoint({
    question: `Structure relaxation complete for ${materialId}. Energy: ${relaxation.totalEnergy} eV. Forces converged: ${relaxation.forcesConverged}. Proceed with property calculations?`,
    title: 'Structure Relaxation Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalEnergy: relaxation.totalEnergy,
        forcesConverged: relaxation.forcesConverged,
        maxForce: relaxation.maxForce,
        volumeChange: relaxation.volumeChange
      },
      files: relaxation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  let electronicStructure = null;
  let formationEnergy = null;
  let elasticConstants = null;
  let opticalProperties = null;

  // Phase 4: Electronic Structure Calculation
  if (calculationType === 'electronic-structure' || calculationType === 'all') {
    ctx.log('info', 'Phase 4: Calculating electronic structure');
    electronicStructure = await ctx.task(electronicStructureTask, {
      materialId,
      relaxedStructure: relaxation.relaxedStructure,
      functionalType,
      code,
      spinPolarized,
      includeSoc,
      outputDir
    });

    artifacts.push(...electronicStructure.artifacts);
  }

  // Phase 5: Formation Energy Calculation
  if (calculationType === 'formation-energy' || calculationType === 'all') {
    ctx.log('info', 'Phase 5: Calculating formation energy');
    const formationEnergyResult = await ctx.task(formationEnergyTask, {
      materialId,
      relaxedStructure: relaxation.relaxedStructure,
      totalEnergy: relaxation.totalEnergy,
      structure,
      outputDir
    });

    formationEnergy = formationEnergyResult;
    artifacts.push(...formationEnergyResult.artifacts);
  }

  // Phase 6: Elastic Constants Calculation
  if (calculationType === 'elastic-constants' || calculationType === 'all') {
    ctx.log('info', 'Phase 6: Calculating elastic constants');
    elasticConstants = await ctx.task(elasticConstantsTask, {
      materialId,
      relaxedStructure: relaxation.relaxedStructure,
      code,
      outputDir
    });

    artifacts.push(...elasticConstants.artifacts);
  }

  // Phase 7: Optical Properties (if requested)
  if (calculationType === 'optical') {
    ctx.log('info', 'Phase 7: Calculating optical properties');
    opticalProperties = await ctx.task(opticalPropertiesTask, {
      materialId,
      relaxedStructure: relaxation.relaxedStructure,
      code,
      outputDir
    });

    artifacts.push(...opticalProperties.artifacts);
  }

  // Phase 8: Data Analysis and Visualization
  ctx.log('info', 'Phase 8: Analyzing and visualizing results');
  const dataAnalysis = await ctx.task(dftDataAnalysisTask, {
    materialId,
    electronicStructure,
    formationEnergy,
    elasticConstants,
    opticalProperties,
    outputDir
  });

  artifacts.push(...dataAnalysis.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Generating DFT calculation report');
  const report = await ctx.task(dftReportTask, {
    materialId,
    structure,
    calculationType,
    functionalType,
    relaxation,
    electronicStructure,
    formationEnergy,
    elasticConstants,
    opticalProperties,
    dataAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    materialId,
    calculationType,
    functionalType,
    relaxedStructure: relaxation.relaxedStructure,
    totalEnergy: relaxation.totalEnergy,
    electronicStructure: electronicStructure ? {
      bandGap: electronicStructure.bandGap,
      bandGapType: electronicStructure.bandGapType,
      fermiEnergy: electronicStructure.fermiEnergy,
      vbm: electronicStructure.vbm,
      cbm: electronicStructure.cbm,
      dos: electronicStructure.dosPath,
      bandStructure: electronicStructure.bandStructurePath
    } : null,
    formationEnergy: formationEnergy ? {
      value: formationEnergy.formationEnergyPerAtom,
      decompositionProducts: formationEnergy.decompositionProducts,
      stable: formationEnergy.thermodynamicallyStable
    } : null,
    elasticConstants: elasticConstants ? {
      cijMatrix: elasticConstants.cijMatrix,
      bulkModulus: elasticConstants.bulkModulus,
      shearModulus: elasticConstants.shearModulus,
      youngsModulus: elasticConstants.youngsModulus,
      poissonsRatio: elasticConstants.poissonsRatio
    } : null,
    opticalProperties: opticalProperties ? {
      dielectricFunction: opticalProperties.dielectricFunction,
      refractiveIndex: opticalProperties.refractiveIndex,
      absorptionCoefficient: opticalProperties.absorptionCoefficient
    } : null,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/dft-calculation',
      timestamp: startTime,
      code,
      encut,
      kpointDensity,
      outputDir
    }
  };
}

// Task 1: Structure Preparation
export const structurePreparationTask = defineTask('dft-structure-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structure Preparation - ${args.materialId}`,
  agent: {
    name: 'computational-materials-scientist',
    prompt: {
      role: 'Computational Materials Scientist',
      task: 'Prepare crystal structure for DFT calculations',
      context: args,
      instructions: [
        '1. Parse input structure (CIF, POSCAR, pymatgen)',
        '2. Identify space group and symmetry',
        '3. Generate primitive cell if needed',
        '4. Check for duplicate atoms',
        '5. Verify stoichiometry',
        '6. Set up supercell if needed',
        '7. Add vacuum for surfaces/2D materials',
        '8. Generate k-path for band structure',
        '9. Identify high-symmetry points',
        '10. Export structure in required format'
      ],
      outputFormat: 'JSON with structure preparation results'
    },
    outputSchema: {
      type: 'object',
      required: ['structurePath', 'spaceGroup', 'artifacts'],
      properties: {
        structurePath: { type: 'string' },
        spaceGroup: { type: 'string' },
        spaceGroupNumber: { type: 'number' },
        latticeParameters: { type: 'object' },
        atomCount: { type: 'number' },
        formula: { type: 'string' },
        kpath: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'structure', 'materials-science']
}));

// Task 2: DFT Input Generation
export const dftInputGenerationTask = defineTask('dft-input-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFT Input Generation - ${args.materialId}`,
  agent: {
    name: 'dft-specialist',
    prompt: {
      role: 'DFT Calculation Specialist',
      task: 'Generate DFT input files for VASP or Quantum ESPRESSO',
      context: args,
      instructions: [
        '1. Generate k-point mesh (Monkhorst-Pack)',
        '2. Set energy cutoff (ENCUT/ecutwfc)',
        '3. Select pseudopotentials/PAW potentials',
        '4. Configure exchange-correlation functional',
        '5. Set electronic convergence criteria',
        '6. Configure ionic relaxation if needed',
        '7. Set spin polarization if magnetic',
        '8. Configure spin-orbit coupling if needed',
        '9. Set smearing for metals',
        '10. Generate all required input files'
      ],
      outputFormat: 'JSON with input file generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['inputPaths', 'parameters', 'artifacts'],
      properties: {
        inputPaths: { type: 'object' },
        parameters: {
          type: 'object',
          properties: {
            encut: { type: 'number' },
            kpoints: { type: 'array' },
            functional: { type: 'string' },
            smearing: { type: 'string' }
          }
        },
        potentialInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'input-generation', 'materials-science']
}));

// Task 3: Structure Relaxation
export const structureRelaxationTask = defineTask('dft-structure-relaxation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structure Relaxation - ${args.materialId}`,
  agent: {
    name: 'dft-calculator',
    prompt: {
      role: 'DFT Calculation Runner',
      task: 'Perform ionic and cell relaxation using DFT',
      context: args,
      instructions: [
        '1. Submit relaxation calculation to HPC',
        '2. Monitor convergence (energy, forces)',
        '3. Handle SCF convergence issues',
        '4. Check for soft modes or instabilities',
        '5. Verify forces below threshold',
        '6. Extract relaxed structure',
        '7. Calculate final total energy',
        '8. Determine volume change',
        '9. Save relaxed structure',
        '10. Document relaxation convergence'
      ],
      outputFormat: 'JSON with relaxation results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEnergy', 'forcesConverged', 'relaxedStructure', 'artifacts'],
      properties: {
        totalEnergy: { type: 'number', description: 'eV' },
        forcesConverged: { type: 'boolean' },
        maxForce: { type: 'number', description: 'eV/Angstrom' },
        relaxedStructure: { type: 'string' },
        volumeChange: { type: 'number', description: 'percent' },
        scfCycles: { type: 'number' },
        ionicSteps: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'relaxation', 'materials-science']
}));

// Task 4: Electronic Structure Calculation
export const electronicStructureTask = defineTask('dft-electronic-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Electronic Structure Calculation - ${args.materialId}`,
  agent: {
    name: 'electronic-structure-specialist',
    prompt: {
      role: 'Electronic Structure Specialist',
      task: 'Calculate band structure and density of states',
      context: args,
      instructions: [
        '1. Perform SCF calculation on relaxed structure',
        '2. Calculate band structure along k-path',
        '3. Calculate density of states (total and projected)',
        '4. Identify band gap (direct/indirect)',
        '5. Determine VBM and CBM positions',
        '6. Calculate Fermi energy',
        '7. Analyze orbital character of bands',
        '8. Generate band structure plots',
        '9. Generate DOS plots',
        '10. Identify any magnetic moments'
      ],
      outputFormat: 'JSON with electronic structure results'
    },
    outputSchema: {
      type: 'object',
      required: ['bandGap', 'fermiEnergy', 'artifacts'],
      properties: {
        bandGap: { type: 'number', description: 'eV' },
        bandGapType: { type: 'string', enum: ['direct', 'indirect', 'metallic'] },
        fermiEnergy: { type: 'number', description: 'eV' },
        vbm: { type: 'number', description: 'eV' },
        cbm: { type: 'number', description: 'eV' },
        magneticMoment: { type: 'number' },
        dosPath: { type: 'string' },
        bandStructurePath: { type: 'string' },
        orbitalCharacter: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'electronic-structure', 'band-gap', 'materials-science']
}));

// Task 5: Formation Energy Calculation
export const formationEnergyTask = defineTask('dft-formation-energy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formation Energy Calculation - ${args.materialId}`,
  agent: {
    name: 'thermodynamics-specialist',
    prompt: {
      role: 'Computational Thermodynamics Specialist',
      task: 'Calculate formation energy and thermodynamic stability',
      context: args,
      instructions: [
        '1. Obtain elemental reference energies',
        '2. Calculate formation energy per atom',
        '3. Construct convex hull with competing phases',
        '4. Determine energy above hull',
        '5. Identify decomposition products',
        '6. Assess thermodynamic stability',
        '7. Calculate decomposition energy',
        '8. Consider temperature effects if needed',
        '9. Compare with Materials Project data',
        '10. Document stability analysis'
      ],
      outputFormat: 'JSON with formation energy results'
    },
    outputSchema: {
      type: 'object',
      required: ['formationEnergyPerAtom', 'thermodynamicallyStable', 'artifacts'],
      properties: {
        formationEnergyPerAtom: { type: 'number', description: 'eV/atom' },
        totalFormationEnergy: { type: 'number', description: 'eV' },
        energyAboveHull: { type: 'number', description: 'eV/atom' },
        thermodynamicallyStable: { type: 'boolean' },
        decompositionProducts: { type: 'array', items: { type: 'string' } },
        decompositionEnergy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'formation-energy', 'stability', 'materials-science']
}));

// Task 6: Elastic Constants Calculation
export const elasticConstantsTask = defineTask('dft-elastic-constants', (args, taskCtx) => ({
  kind: 'agent',
  title: `Elastic Constants Calculation - ${args.materialId}`,
  agent: {
    name: 'mechanics-specialist',
    prompt: {
      role: 'Computational Mechanics Specialist',
      task: 'Calculate elastic constants and mechanical properties',
      context: args,
      instructions: [
        '1. Generate strained structures (6 strain types)',
        '2. Calculate stress tensor for each strain',
        '3. Fit stress-strain relationship',
        '4. Extract Cij elastic constants',
        '5. Check elastic stability criteria',
        '6. Calculate bulk modulus (Voigt, Reuss, Hill)',
        '7. Calculate shear modulus',
        '8. Calculate Youngs modulus',
        '9. Calculate Poissons ratio',
        '10. Assess mechanical anisotropy'
      ],
      outputFormat: 'JSON with elastic constants results'
    },
    outputSchema: {
      type: 'object',
      required: ['cijMatrix', 'bulkModulus', 'shearModulus', 'artifacts'],
      properties: {
        cijMatrix: { type: 'array', items: { type: 'array' } },
        bulkModulus: { type: 'number', description: 'GPa' },
        shearModulus: { type: 'number', description: 'GPa' },
        youngsModulus: { type: 'number', description: 'GPa' },
        poissonsRatio: { type: 'number' },
        elasticallyStable: { type: 'boolean' },
        anisotropyIndex: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'elastic-constants', 'mechanics', 'materials-science']
}));

// Task 7: Optical Properties Calculation
export const opticalPropertiesTask = defineTask('dft-optical-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optical Properties Calculation - ${args.materialId}`,
  agent: {
    name: 'optical-properties-specialist',
    prompt: {
      role: 'Optical Properties Specialist',
      task: 'Calculate optical properties from DFT',
      context: args,
      instructions: [
        '1. Calculate frequency-dependent dielectric function',
        '2. Compute real and imaginary parts',
        '3. Calculate refractive index',
        '4. Calculate absorption coefficient',
        '5. Calculate reflectivity',
        '6. Identify optical transitions',
        '7. Calculate optical band gap',
        '8. Consider excitonic effects if needed',
        '9. Generate optical spectra plots',
        '10. Compare with experimental data'
      ],
      outputFormat: 'JSON with optical properties results'
    },
    outputSchema: {
      type: 'object',
      required: ['dielectricFunction', 'refractiveIndex', 'artifacts'],
      properties: {
        dielectricFunction: { type: 'object' },
        refractiveIndex: { type: 'number', description: 'at visible wavelength' },
        absorptionCoefficient: { type: 'object' },
        reflectivity: { type: 'number' },
        opticalBandGap: { type: 'number', description: 'eV' },
        spectraPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'optical', 'dielectric', 'materials-science']
}));

// Task 8: Data Analysis and Visualization
export const dftDataAnalysisTask = defineTask('dft-data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFT Data Analysis - ${args.materialId}`,
  agent: {
    name: 'dft-analyst',
    prompt: {
      role: 'DFT Data Analyst',
      task: 'Analyze and visualize DFT calculation results',
      context: args,
      instructions: [
        '1. Compile all calculation results',
        '2. Generate publication-quality plots',
        '3. Create band structure visualization',
        '4. Generate DOS plots (total and projected)',
        '5. Visualize charge density if relevant',
        '6. Create elastic property visualizations',
        '7. Compare with literature values',
        '8. Assess calculation accuracy',
        '9. Generate summary tables',
        '10. Prepare data for database upload'
      ],
      outputFormat: 'JSON with data analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['plots', 'summaryTable', 'artifacts'],
      properties: {
        plots: { type: 'array', items: { type: 'string' } },
        summaryTable: { type: 'object' },
        literatureComparison: { type: 'object' },
        accuracyAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dft', 'analysis', 'visualization', 'materials-science']
}));

// Task 9: Report Generation
export const dftReportTask = defineTask('dft-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFT Calculation Report - ${args.materialId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Computational Materials Science Technical Writer',
      task: 'Generate comprehensive DFT calculation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document computational methods',
        '3. Report convergence tests',
        '4. Present structural data',
        '5. Include electronic structure results',
        '6. Report mechanical properties',
        '7. Include optical properties if calculated',
        '8. Compare with experimental/literature data',
        '9. Add conclusions',
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
  labels: ['agent', 'dft', 'report', 'documentation', 'materials-science']
}));
