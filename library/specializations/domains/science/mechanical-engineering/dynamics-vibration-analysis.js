/**
 * @process specializations/domains/science/mechanical-engineering/dynamics-vibration-analysis
 * @description Dynamics and Vibration Analysis - Analyzing natural frequencies, mode shapes, and
 * forced response of mechanical systems using modal analysis, harmonic response, and transient
 * dynamics simulations. Covers SDOF, MDOF, and continuous systems.
 * @inputs { projectName: string, systemType: string, massMatrix: array, stiffnessMatrix: array, excitation: object }
 * @outputs { success: boolean, naturalFrequencies: array, modeShapes: array, forcedResponse: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/dynamics-vibration-analysis', {
 *   projectName: 'Rotating Machinery Analysis',
 *   systemType: 'mdof',
 *   massMatrix: [[100, 0], [0, 50]],
 *   stiffnessMatrix: [[5e6, -2e6], [-2e6, 3e6]],
 *   dampingRatio: 0.02,
 *   excitation: { type: 'harmonic', frequency: 50, amplitude: 1000 }
 * });
 *
 * @references
 * - Mechanical Vibrations by Rao: https://www.pearson.com/en-us/subject-catalog/p/mechanical-vibrations/P200000003254
 * - Modal Testing: Theory, Practice and Application: https://www.wiley.com/
 * - Vibration of Continuous Systems: https://www.wiley.com/
 * - ANSYS Mechanical Dynamics: https://ansyshelp.ansys.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    systemType = 'mdof', // 'sdof', 'mdof', 'continuous', 'fea-based'
    massMatrix = [],
    stiffnessMatrix = [],
    dampingMatrix = [],
    dampingRatio = 0.02,
    excitation = {},
    boundaryConditions = [],
    frequencyRange = { min: 0, max: 1000 },
    analysisTypes = ['modal', 'harmonic'],
    outputDir = 'vibration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dynamics and Vibration Analysis for ${projectName}`);
  ctx.log('info', `System Type: ${systemType}, Analysis: ${analysisTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: SYSTEM MODEL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: System Model Setup');

  const modelResult = await ctx.task(systemModelSetupTask, {
    projectName,
    systemType,
    massMatrix,
    stiffnessMatrix,
    dampingMatrix,
    dampingRatio,
    boundaryConditions,
    outputDir
  });

  artifacts.push(...modelResult.artifacts);

  ctx.log('info', `System model setup complete - ${modelResult.dof} degrees of freedom`);

  // ============================================================================
  // PHASE 2: MODAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Modal Analysis (Eigenvalue Problem)');

  const modalResult = await ctx.task(modalAnalysisTask, {
    projectName,
    modelResult,
    frequencyRange,
    outputDir
  });

  artifacts.push(...modalResult.artifacts);

  ctx.log('info', `Modal analysis complete - ${modalResult.modeCount} modes extracted`);

  // Breakpoint: Review natural frequencies
  await ctx.breakpoint({
    question: `Modal analysis complete. Found ${modalResult.modeCount} modes. Fundamental frequency: ${modalResult.fundamentalFrequency} Hz. Review mode shapes and frequencies?`,
    title: 'Modal Analysis Review',
    context: {
      runId: ctx.runId,
      naturalFrequencies: modalResult.naturalFrequencies,
      effectiveMassParticipation: modalResult.massParticipation,
      files: modalResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: DAMPING CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Damping Characterization');

  const dampingResult = await ctx.task(dampingCharacterizationTask, {
    projectName,
    modelResult,
    modalResult,
    dampingRatio,
    outputDir
  });

  artifacts.push(...dampingResult.artifacts);

  ctx.log('info', `Damping characterized - Model: ${dampingResult.dampingModel}`);

  // ============================================================================
  // PHASE 4: HARMONIC RESPONSE ANALYSIS
  // ============================================================================

  let harmonicResult = null;
  if (analysisTypes.includes('harmonic')) {
    ctx.log('info', 'Phase 4: Harmonic Response Analysis');

    harmonicResult = await ctx.task(harmonicResponseTask, {
      projectName,
      modelResult,
      modalResult,
      dampingResult,
      excitation,
      frequencyRange,
      outputDir
    });

    artifacts.push(...harmonicResult.artifacts);

    ctx.log('info', `Harmonic analysis complete - Peak response at ${harmonicResult.peakFrequency} Hz`);

    // Quality Gate: Resonance near operating frequency
    if (excitation.frequency && Math.abs(harmonicResult.peakFrequency - excitation.frequency) < excitation.frequency * 0.1) {
      await ctx.breakpoint({
        question: `Warning: Operating frequency ${excitation.frequency} Hz is within 10% of resonance at ${harmonicResult.peakFrequency} Hz. High vibration expected. Review response and consider design changes?`,
        title: 'Resonance Warning',
        context: {
          runId: ctx.runId,
          operatingFrequency: excitation.frequency,
          resonantFrequency: harmonicResult.peakFrequency,
          amplificationFactor: harmonicResult.amplificationFactor,
          files: harmonicResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: TRANSIENT RESPONSE ANALYSIS
  // ============================================================================

  let transientResult = null;
  if (analysisTypes.includes('transient')) {
    ctx.log('info', 'Phase 5: Transient Response Analysis');

    transientResult = await ctx.task(transientResponseTask, {
      projectName,
      modelResult,
      modalResult,
      dampingResult,
      excitation,
      outputDir
    });

    artifacts.push(...transientResult.artifacts);

    ctx.log('info', `Transient analysis complete - Max response: ${transientResult.maxResponse}`);
  }

  // ============================================================================
  // PHASE 6: RANDOM VIBRATION ANALYSIS
  // ============================================================================

  let randomResult = null;
  if (analysisTypes.includes('random')) {
    ctx.log('info', 'Phase 6: Random Vibration Analysis');

    randomResult = await ctx.task(randomVibrationTask, {
      projectName,
      modelResult,
      modalResult,
      dampingResult,
      excitation,
      outputDir
    });

    artifacts.push(...randomResult.artifacts);

    ctx.log('info', `Random vibration analysis complete - RMS response: ${randomResult.rmsResponse}`);
  }

  // ============================================================================
  // PHASE 7: RESPONSE SPECTRUM ANALYSIS
  // ============================================================================

  let spectrumResult = null;
  if (analysisTypes.includes('spectrum')) {
    ctx.log('info', 'Phase 7: Response Spectrum Analysis');

    spectrumResult = await ctx.task(responseSpectrumTask, {
      projectName,
      modelResult,
      modalResult,
      excitation,
      outputDir
    });

    artifacts.push(...spectrumResult.artifacts);

    ctx.log('info', `Response spectrum analysis complete`);
  }

  // ============================================================================
  // PHASE 8: VIBRATION CRITERIA EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Vibration Criteria Evaluation');

  const criteriaResult = await ctx.task(vibrationCriteriaTask, {
    projectName,
    modalResult,
    harmonicResult,
    transientResult,
    randomResult,
    outputDir
  });

  artifacts.push(...criteriaResult.artifacts);

  ctx.log('info', `Criteria evaluation complete - Status: ${criteriaResult.overallStatus}`);

  // ============================================================================
  // PHASE 9: GENERATE VIBRATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Vibration Report');

  const reportResult = await ctx.task(generateVibrationReportTask, {
    projectName,
    systemType,
    modelResult,
    modalResult,
    dampingResult,
    harmonicResult,
    transientResult,
    randomResult,
    spectrumResult,
    criteriaResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Vibration Analysis Complete for ${projectName}. Fundamental frequency: ${modalResult.fundamentalFrequency} Hz. ${criteriaResult.overallStatus}. Approve analysis?`,
    title: 'Vibration Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        fundamentalFrequency: modalResult.fundamentalFrequency,
        modeCount: modalResult.modeCount,
        criteriaStatus: criteriaResult.overallStatus
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Vibration Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    systemType,
    naturalFrequencies: modalResult.naturalFrequencies,
    modeShapes: modalResult.modeShapes,
    forcedResponse: {
      harmonic: harmonicResult?.summary,
      transient: transientResult?.summary,
      random: randomResult?.summary
    },
    criteriaEvaluation: criteriaResult,
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/dynamics-vibration-analysis',
      processSlug: 'dynamics-vibration-analysis',
      category: 'mechanical-engineering',
      timestamp: startTime,
      systemType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const systemModelSetupTask = defineTask('system-model-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Model Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Dynamics Specialist',
      task: 'Set up dynamic system model',
      context: {
        projectName: args.projectName,
        systemType: args.systemType,
        massMatrix: args.massMatrix,
        stiffnessMatrix: args.stiffnessMatrix,
        dampingMatrix: args.dampingMatrix,
        dampingRatio: args.dampingRatio,
        boundaryConditions: args.boundaryConditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate mass and stiffness matrices',
        '2. Check matrix symmetry and positive definiteness',
        '3. Determine degrees of freedom',
        '4. Apply boundary conditions (reduce matrices)',
        '5. Form damping matrix if not provided:',
        '   - Rayleigh damping: [C] = alpha[M] + beta[K]',
        '   - Modal damping: proportional to each mode',
        '6. Check for rigid body modes',
        '7. Verify consistent units',
        '8. Create system model summary',
        '9. Visualize DOF locations',
        '10. Document model assumptions'
      ],
      outputFormat: 'JSON object with system model'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dof', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dof: { type: 'number' },
        massMatrixCondition: { type: 'number' },
        stiffnessMatrixCondition: { type: 'number' },
        rigidBodyModes: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'system-modeling']
}));

export const modalAnalysisTask = defineTask('modal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Modal Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Modal Analysis Specialist',
      task: 'Perform modal analysis to extract natural frequencies and mode shapes',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        frequencyRange: args.frequencyRange,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Solve eigenvalue problem:',
        '   ([K] - omega^2[M]){phi} = 0',
        '2. Extract eigenvalues (natural frequencies squared)',
        '3. Extract eigenvectors (mode shapes)',
        '4. Normalize mode shapes (mass-normalized)',
        '5. Calculate natural frequencies: f = omega/(2*pi)',
        '6. Calculate effective mass participation factors',
        '7. Order modes by frequency',
        '8. Identify significant modes (high mass participation)',
        '9. Plot mode shapes',
        '10. Create modal analysis summary'
      ],
      outputFormat: 'JSON object with modal analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modeCount', 'naturalFrequencies', 'fundamentalFrequency', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        modeCount: { type: 'number' },
        naturalFrequencies: { type: 'array', items: { type: 'number' } },
        fundamentalFrequency: { type: 'number' },
        modeShapes: { type: 'array' },
        massParticipation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'modal-analysis']
}));

export const dampingCharacterizationTask = defineTask('damping-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Damping Characterization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Characterize system damping',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        dampingRatio: args.dampingRatio,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select damping model:',
        '   - Viscous (velocity proportional)',
        '   - Structural (hysteretic)',
        '   - Rayleigh (proportional)',
        '2. If Rayleigh damping, calculate alpha and beta:',
        '   - alpha = 2*zeta*omega1*omega2/(omega1+omega2)',
        '   - beta = 2*zeta/(omega1+omega2)',
        '3. Calculate modal damping ratios',
        '4. Verify damping ratios are reasonable (0.01-0.1 typical)',
        '5. Check for underdamped condition (zeta < 1)',
        '6. Document damping sources',
        '7. Create damping summary'
      ],
      outputFormat: 'JSON object with damping characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dampingModel', 'modalDampingRatios', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dampingModel: { type: 'string' },
        rayleighAlpha: { type: 'number' },
        rayleighBeta: { type: 'number' },
        modalDampingRatios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'damping']
}));

export const harmonicResponseTask = defineTask('harmonic-response', (args, taskCtx) => ({
  kind: 'agent',
  title: `Harmonic Response - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Calculate steady-state harmonic response',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        dampingResult: args.dampingResult,
        excitation: args.excitation,
        frequencyRange: args.frequencyRange,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define excitation force vector',
        '2. Perform frequency sweep analysis:',
        '   {X} = [H(omega)]{F}',
        '   where [H] is frequency response function',
        '3. Calculate displacement, velocity, acceleration FRFs',
        '4. Identify resonant peaks',
        '5. Calculate amplification factor at resonance',
        '6. Calculate phase angle vs frequency',
        '7. Plot Bode diagram (magnitude and phase)',
        '8. Plot Nyquist diagram',
        '9. Extract peak response values',
        '10. Create harmonic response summary'
      ],
      outputFormat: 'JSON object with harmonic response'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'peakFrequency', 'amplificationFactor', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        peakFrequency: { type: 'number' },
        peakResponse: { type: 'number' },
        amplificationFactor: { type: 'number' },
        frf: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'harmonic-response']
}));

export const transientResponseTask = defineTask('transient-response', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transient Response - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Calculate transient dynamic response',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        dampingResult: args.dampingResult,
        excitation: args.excitation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define excitation time history:',
        '   - Impulse, step, or arbitrary',
        '2. Select integration method:',
        '   - Newmark-beta',
        '   - Central difference',
        '   - Modal superposition',
        '3. Set time step (< T_min/20 for accuracy)',
        '4. Solve equations of motion numerically',
        '5. Calculate displacement, velocity, acceleration',
        '6. Find maximum response values',
        '7. Plot time histories',
        '8. Calculate decay envelope for free vibration',
        '9. Extract settling time',
        '10. Create transient response summary'
      ],
      outputFormat: 'JSON object with transient response'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxResponse', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxResponse: { type: 'number' },
        maxVelocity: { type: 'number' },
        maxAcceleration: { type: 'number' },
        settlingTime: { type: 'number' },
        timeHistory: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'transient-response']
}));

export const randomVibrationTask = defineTask('random-vibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Random Vibration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Perform random vibration analysis',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        dampingResult: args.dampingResult,
        excitation: args.excitation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define input PSD (Power Spectral Density)',
        '2. Calculate output PSD using FRF:',
        '   S_out = |H(f)|^2 * S_in',
        '3. Integrate PSD to get mean square response',
        '4. Calculate RMS values (displacement, stress)',
        '5. Determine 1-sigma, 2-sigma, 3-sigma levels',
        '6. Calculate equivalent static load for design',
        '7. Plot input and output PSDs',
        '8. Calculate Miles equation for SDOF approximation',
        '9. Document random vibration environment',
        '10. Create random vibration summary'
      ],
      outputFormat: 'JSON object with random vibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rmsResponse', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rmsResponse: { type: 'number' },
        oneSigma: { type: 'number' },
        threeSigma: { type: 'number' },
        outputPSD: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'random-vibration', 'psd']
}));

export const responseSpectrumTask = defineTask('response-spectrum', (args, taskCtx) => ({
  kind: 'agent',
  title: `Response Spectrum Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Perform response spectrum analysis',
      context: {
        projectName: args.projectName,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        excitation: args.excitation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define input response spectrum (SRS or design spectrum)',
        '2. For each mode, determine spectral response',
        '3. Combine modal responses using:',
        '   - SRSS (Square Root of Sum of Squares)',
        '   - CQC (Complete Quadratic Combination)',
        '4. Calculate displacement, velocity, acceleration',
        '5. Determine maximum response',
        '6. Compare with static analysis',
        '7. Plot response spectrum',
        '8. Document combination method rationale',
        '9. Verify sufficient modes included',
        '10. Create response spectrum summary'
      ],
      outputFormat: 'JSON object with response spectrum results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'combinedResponse', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        combinedResponse: { type: 'number' },
        modalResponses: { type: 'array' },
        combinationMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'response-spectrum', 'seismic']
}));

export const vibrationCriteriaTask = defineTask('vibration-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vibration Criteria Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vibration Specialist',
      task: 'Evaluate vibration response against criteria',
      context: {
        projectName: args.projectName,
        modalResult: args.modalResult,
        harmonicResult: args.harmonicResult,
        transientResult: args.transientResult,
        randomResult: args.randomResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define applicable vibration criteria:',
        '   - ISO standards for machinery',
        '   - Human comfort criteria',
        '   - Equipment sensitivity',
        '   - Fatigue allowables',
        '2. Compare natural frequencies to excitation:',
        '   - Verify separation margin (>15%)',
        '3. Check displacement limits',
        '4. Check velocity limits (machinery health)',
        '5. Check acceleration limits (equipment)',
        '6. Evaluate fatigue implications',
        '7. Determine pass/fail status',
        '8. Recommend improvements if needed',
        '9. Document criteria sources',
        '10. Create criteria evaluation summary'
      ],
      outputFormat: 'JSON object with criteria evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallStatus', 'criteriaResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallStatus: { type: 'string' },
        criteriaResults: { type: 'array' },
        frequencySeparation: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'criteria-evaluation']
}));

export const generateVibrationReportTask = defineTask('generate-vibration-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Vibration Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive vibration analysis report',
      context: {
        projectName: args.projectName,
        systemType: args.systemType,
        modelResult: args.modelResult,
        modalResult: args.modalResult,
        dampingResult: args.dampingResult,
        harmonicResult: args.harmonicResult,
        transientResult: args.transientResult,
        randomResult: args.randomResult,
        spectrumResult: args.spectrumResult,
        criteriaResult: args.criteriaResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document system model and assumptions',
        '3. Present modal analysis results',
        '4. Present forced response results',
        '5. Show frequency response plots',
        '6. Present criteria evaluation',
        '7. Include mode shape visualizations',
        '8. Document analysis methodology',
        '9. State conclusions and recommendations',
        '10. Include supporting calculations'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'vibration', 'reporting']
}));
