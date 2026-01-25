/**
 * @process Molecular Ground State Energy Calculation
 * @id QC-CHEM-001
 * @description Calculate molecular ground state energies using quantum algorithms (VQE, QPE)
 * for chemistry applications including drug discovery and materials design.
 * @category Quantum Computing - Chemistry and Simulation
 * @priority P1 - High
 * @inputs {{ molecule: object, basis?: string, algorithm?: string }}
 * @outputs {{ success: boolean, groundStateEnergy: number, molecularProperties: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('molecular-ground-state-energy', {
 *   molecule: { atoms: ['H', 'H'], coordinates: [[0,0,0], [0,0,0.74]] },
 *   basis: 'sto-3g',
 *   algorithm: 'VQE'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    molecule,
    basis = 'sto-3g',
    algorithm = 'VQE', // 'VQE', 'QPE', 'ADAPT-VQE'
    encoding = 'jordan_wigner', // 'jordan_wigner', 'bravyi_kitaev', 'parity'
    ansatz = 'UCCSD', // 'UCCSD', 'hardware_efficient', 'ADAPT'
    optimizer = 'COBYLA',
    activeSpace = null,
    freezeCore = true,
    maxIterations = 500,
    framework = 'qiskit_nature',
    outputDir = 'molecular-energy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Molecular Ground State Calculation`);
  ctx.log('info', `Algorithm: ${algorithm}, Basis: ${basis}, Encoding: ${encoding}`);

  // ============================================================================
  // PHASE 1: MOLECULAR STRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Molecular Structure Setup');

  const moleculeResult = await ctx.task(moleculeSetupTask, {
    molecule,
    basis,
    freezeCore,
    activeSpace
  });

  artifacts.push(...(moleculeResult.artifacts || []));

  await ctx.breakpoint({
    question: `Molecule setup complete. Atoms: ${moleculeResult.atomCount}, Electrons: ${moleculeResult.electronCount}, Orbitals: ${moleculeResult.orbitalCount}. Proceed with Hamiltonian construction?`,
    title: 'Molecule Setup Review',
    context: {
      runId: ctx.runId,
      molecule: moleculeResult,
      files: (moleculeResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: MOLECULAR HAMILTONIAN CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Molecular Hamiltonian Construction');

  const hamiltonianResult = await ctx.task(hamiltonianConstructionTask, {
    moleculeData: moleculeResult,
    encoding,
    framework
  });

  artifacts.push(...(hamiltonianResult.artifacts || []));

  ctx.log('info', `Hamiltonian constructed. Qubits: ${hamiltonianResult.qubitCount}, Terms: ${hamiltonianResult.pauliTerms}`);

  // ============================================================================
  // PHASE 3: CLASSICAL REFERENCE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Classical Reference Calculation');

  const classicalResult = await ctx.task(classicalReferenceCalculationTask, {
    moleculeData: moleculeResult,
    methods: ['HF', 'CCSD', 'FCI']
  });

  artifacts.push(...(classicalResult.artifacts || []));

  await ctx.breakpoint({
    question: `Classical references computed. HF: ${classicalResult.hfEnergy}, CCSD: ${classicalResult.ccsdEnergy}, FCI: ${classicalResult.fciEnergy || 'N/A'}. Proceed with quantum calculation?`,
    title: 'Classical Reference Review',
    context: {
      runId: ctx.runId,
      classical: classicalResult,
      files: (classicalResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: ANSATZ DESIGN FOR CHEMISTRY
  // ============================================================================

  ctx.log('info', 'Phase 4: Chemistry Ansatz Design');

  const ansatzResult = await ctx.task(chemistryAnsatzDesignTask, {
    hamiltonianData: hamiltonianResult,
    ansatzType: ansatz,
    moleculeData: moleculeResult,
    framework
  });

  artifacts.push(...(ansatzResult.artifacts || []));

  ctx.log('info', `Ansatz designed. Parameters: ${ansatzResult.parameterCount}, Circuit depth: ${ansatzResult.circuitDepth}`);

  // ============================================================================
  // PHASE 5: VQE/QPE EXECUTION
  // ============================================================================

  ctx.log('info', `Phase 5: ${algorithm} Execution`);

  const quantumResult = await ctx.task(quantumChemistryExecutionTask, {
    algorithm,
    hamiltonian: hamiltonianResult.hamiltonian,
    ansatz: ansatzResult.ansatzCircuit,
    initialParameters: ansatzResult.initialParameters,
    optimizer,
    maxIterations,
    referenceEnergy: classicalResult.hfEnergy,
    framework
  });

  artifacts.push(...(quantumResult.artifacts || []));

  await ctx.breakpoint({
    question: `${algorithm} complete. Energy: ${quantumResult.energy} Ha, Iterations: ${quantumResult.iterations}. Review optimization trajectory?`,
    title: 'Quantum Calculation Review',
    context: {
      runId: ctx.runId,
      quantum: quantumResult,
      files: (quantumResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: CHEMICAL ACCURACY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Chemical Accuracy Assessment');

  const accuracyResult = await ctx.task(chemicalAccuracyAssessmentTask, {
    quantumEnergy: quantumResult.energy,
    classicalReference: classicalResult,
    chemicalAccuracyThreshold: 0.0016 // 1 kcal/mol in Hartree
  });

  artifacts.push(...(accuracyResult.artifacts || []));

  // ============================================================================
  // PHASE 7: MOLECULAR PROPERTY EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Molecular Property Extraction');

  const propertiesResult = await ctx.task(molecularPropertyExtractionTask, {
    quantumResult,
    moleculeData: moleculeResult,
    optimalParameters: quantumResult.optimalParameters
  });

  artifacts.push(...(propertiesResult.artifacts || []));

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Documentation and Reporting');

  const reportResult = await ctx.task(molecularEnergyReportTask, {
    molecule,
    basis,
    algorithm,
    moleculeResult,
    hamiltonianResult,
    classicalResult,
    ansatzResult,
    quantumResult,
    accuracyResult,
    propertiesResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Molecular calculation complete. Ground state energy: ${quantumResult.energy} Ha, Chemical accuracy: ${accuracyResult.achievedAccuracy ? 'Yes' : 'No'}. Approve results?`,
    title: 'Molecular Calculation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        molecule: moleculeResult.formula,
        groundStateEnergy: quantumResult.energy,
        chemicalAccuracy: accuracyResult.achievedAccuracy,
        errorFromFCI: accuracyResult.errorFromFCI
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    molecule: {
      formula: moleculeResult.formula,
      atomCount: moleculeResult.atomCount,
      electronCount: moleculeResult.electronCount
    },
    groundStateEnergy: quantumResult.energy,
    energyUnit: 'Hartree',
    molecularProperties: propertiesResult.properties,
    comparison: {
      hfEnergy: classicalResult.hfEnergy,
      ccsdEnergy: classicalResult.ccsdEnergy,
      fciEnergy: classicalResult.fciEnergy,
      correlationEnergy: quantumResult.energy - classicalResult.hfEnergy,
      errorFromFCI: accuracyResult.errorFromFCI,
      chemicalAccuracyAchieved: accuracyResult.achievedAccuracy
    },
    quantumResources: {
      qubits: hamiltonianResult.qubitCount,
      pauliTerms: hamiltonianResult.pauliTerms,
      ansatzParameters: ansatzResult.parameterCount,
      circuitDepth: ansatzResult.circuitDepth,
      iterations: quantumResult.iterations
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-CHEM-001',
      processName: 'Molecular Ground State Energy Calculation',
      category: 'quantum-computing',
      timestamp: startTime,
      basis,
      algorithm,
      encoding
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const moleculeSetupTask = defineTask('qc-molecule-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Molecular Structure Setup',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Computational Chemistry Specialist',
      task: 'Set up molecular structure for quantum chemistry calculation',
      context: args,
      instructions: [
        '1. Parse molecular geometry',
        '2. Determine molecular formula',
        '3. Calculate total electrons',
        '4. Set up basis set',
        '5. Apply frozen core approximation if requested',
        '6. Define active space if specified',
        '7. Calculate number of orbitals',
        '8. Determine spin multiplicity',
        '9. Validate molecular structure',
        '10. Document molecule setup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['formula', 'atomCount', 'electronCount', 'orbitalCount'],
      properties: {
        formula: { type: 'string' },
        atomCount: { type: 'number' },
        electronCount: { type: 'number' },
        orbitalCount: { type: 'number' },
        spinMultiplicity: { type: 'number' },
        activeSpaceElectrons: { type: 'number' },
        activeSpaceOrbitals: { type: 'number' },
        moleculeObject: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'molecule-setup']
}));

export const hamiltonianConstructionTask = defineTask('qc-hamiltonian-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Molecular Hamiltonian Construction',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Quantum Chemistry Hamiltonian Specialist',
      task: 'Construct molecular Hamiltonian in qubit representation',
      context: args,
      instructions: [
        '1. Calculate one-electron integrals',
        '2. Calculate two-electron integrals',
        '3. Build second-quantized Hamiltonian',
        '4. Apply qubit encoding (Jordan-Wigner/Bravyi-Kitaev)',
        '5. Convert to Pauli string representation',
        '6. Group Pauli terms for efficient measurement',
        '7. Apply symmetry reductions if possible',
        '8. Count qubits and terms',
        '9. Estimate measurement overhead',
        '10. Document Hamiltonian construction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hamiltonian', 'qubitCount', 'pauliTerms'],
      properties: {
        hamiltonian: { type: 'object' },
        qubitCount: { type: 'number' },
        pauliTerms: { type: 'number' },
        measurementGroups: { type: 'number' },
        symmetryReductions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'hamiltonian']
}));

export const classicalReferenceCalculationTask = defineTask('qc-classical-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Reference Calculation',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Quantum Chemistry Specialist',
      task: 'Calculate classical reference energies for comparison',
      context: args,
      instructions: [
        '1. Run Hartree-Fock calculation',
        '2. Run CCSD calculation',
        '3. Run FCI if system is small enough',
        '4. Calculate correlation energy',
        '5. Calculate nuclear repulsion energy',
        '6. Verify energy convergence',
        '7. Document classical results',
        '8. Compare methods',
        '9. Identify reference for quantum comparison',
        '10. Store intermediate results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hfEnergy', 'ccsdEnergy'],
      properties: {
        hfEnergy: { type: 'number' },
        ccsdEnergy: { type: 'number' },
        fciEnergy: { type: 'number' },
        nuclearRepulsion: { type: 'number' },
        correlationEnergy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'classical']
}));

export const chemistryAnsatzDesignTask = defineTask('qc-chemistry-ansatz', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Chemistry Ansatz Design',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Variational Chemistry Specialist',
      task: 'Design chemistry-informed ansatz for VQE',
      context: args,
      instructions: [
        '1. Select ansatz type (UCCSD, ADAPT, etc.)',
        '2. Generate excitation operators',
        '3. Trotterize unitary operators',
        '4. Design parameter initialization',
        '5. Optimize circuit structure',
        '6. Calculate circuit depth',
        '7. Estimate parameter count',
        '8. Consider hardware constraints',
        '9. Generate initial parameters',
        '10. Document ansatz design'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ansatzCircuit', 'parameterCount', 'circuitDepth', 'initialParameters'],
      properties: {
        ansatzCircuit: { type: 'object' },
        parameterCount: { type: 'number' },
        circuitDepth: { type: 'number' },
        initialParameters: { type: 'array', items: { type: 'number' } },
        excitationOperators: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'ansatz']
}));

export const quantumChemistryExecutionTask = defineTask('qc-chemistry-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Chemistry Execution',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'VQE Execution Specialist',
      task: 'Execute VQE or QPE for molecular energy calculation',
      context: args,
      instructions: [
        '1. Initialize VQE/QPE algorithm',
        '2. Set up quantum instance',
        '3. Configure optimizer',
        '4. Run optimization loop',
        '5. Monitor convergence',
        '6. Track energy history',
        '7. Extract optimal parameters',
        '8. Calculate final energy',
        '9. Verify result consistency',
        '10. Document execution details'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['energy', 'optimalParameters', 'iterations'],
      properties: {
        energy: { type: 'number' },
        optimalParameters: { type: 'array', items: { type: 'number' } },
        iterations: { type: 'number' },
        energyHistory: { type: 'array' },
        converged: { type: 'boolean' },
        totalCircuitExecutions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'vqe']
}));

export const chemicalAccuracyAssessmentTask = defineTask('qc-chemical-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Chemical Accuracy Assessment',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Quantum Chemistry Accuracy Specialist',
      task: 'Assess whether chemical accuracy was achieved',
      context: args,
      instructions: [
        '1. Compare quantum energy with FCI/CCSD',
        '2. Calculate absolute error',
        '3. Check against chemical accuracy threshold',
        '4. Analyze error sources',
        '5. Calculate percentage error',
        '6. Compare correlation energy recovery',
        '7. Assess method reliability',
        '8. Document accuracy analysis',
        '9. Provide improvement suggestions',
        '10. Generate accuracy report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedAccuracy', 'errorFromFCI'],
      properties: {
        achievedAccuracy: { type: 'boolean' },
        errorFromFCI: { type: 'number' },
        errorFromCCSD: { type: 'number' },
        absoluteError: { type: 'number' },
        percentageError: { type: 'number' },
        correlationEnergyRecovery: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'accuracy']
}));

export const molecularPropertyExtractionTask = defineTask('qc-molecular-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Molecular Property Extraction',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Molecular Property Specialist',
      task: 'Extract molecular properties from quantum calculation',
      context: args,
      instructions: [
        '1. Extract dipole moment',
        '2. Calculate molecular orbital energies',
        '3. Determine HOMO-LUMO gap',
        '4. Calculate bond orders',
        '5. Extract atomic charges',
        '6. Calculate spin density if applicable',
        '7. Determine ionization potential',
        '8. Calculate electron affinity',
        '9. Document molecular properties',
        '10. Validate against literature'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['properties'],
      properties: {
        properties: { type: 'object' },
        dipoleMoment: { type: 'number' },
        homoLumoGap: { type: 'number' },
        orbitalEnergies: { type: 'array' },
        bondOrders: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'properties']
}));

export const molecularEnergyReportTask = defineTask('qc-molecular-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Molecular Energy Report',
  agent: {
    name: 'quantum-chemist',
    skills: ['openfermion-hamiltonian', 'pyscf-interface', 'qiskit-nature-solver', 'ansatz-designer'],
    prompt: {
      role: 'Computational Chemistry Documentation Specialist',
      task: 'Generate comprehensive molecular energy calculation report',
      context: args,
      instructions: [
        '1. Summarize molecular structure',
        '2. Document computational methods',
        '3. Present energy results',
        '4. Include accuracy analysis',
        '5. Present molecular properties',
        '6. Include energy convergence plots',
        '7. Compare with classical methods',
        '8. Document quantum resources used',
        '9. Provide conclusions',
        '10. Generate final report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        figures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'chemistry', 'reporting']
}));
