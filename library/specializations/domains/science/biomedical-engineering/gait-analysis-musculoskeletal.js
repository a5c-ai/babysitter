/**
 * @process specializations/domains/science/biomedical-engineering/gait-analysis-musculoskeletal
 * @description Gait Analysis and Musculoskeletal Modeling - Conduct gait analysis and develop musculoskeletal
 * models to evaluate prosthetics, orthotics, and rehabilitation devices using motion capture and OpenSim.
 * @inputs { studyName: string, deviceType: string, subjectPopulation: string, analysisGoals: string[] }
 * @outputs { success: boolean, gaitAnalysisReport: object, musculoskeletalModel: object, clinicalCorrelation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/gait-analysis-musculoskeletal', {
 *   studyName: 'Transtibial Prosthesis Evaluation',
 *   deviceType: 'Below-Knee Prosthesis',
 *   subjectPopulation: 'Transtibial amputees',
 *   analysisGoals: ['Gait symmetry', 'Joint loading', 'Socket interface forces']
 * });
 *
 * @references
 * - OpenSim Documentation: https://opensim.stanford.edu/
 * - Winter's Biomechanics and Motor Control of Human Movement
 * - ISB Standards for Reporting Kinematic Data
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    studyName,
    deviceType,
    subjectPopulation,
    analysisGoals
  } = inputs;

  // Phase 1: Motion Capture Protocol
  const motionCaptureProtocol = await ctx.task(motionCaptureTask, {
    studyName,
    deviceType,
    subjectPopulation
  });

  // Phase 2: Ground Reaction Force Measurement
  const grfMeasurement = await ctx.task(grfMeasurementTask, {
    studyName,
    motionCaptureProtocol
  });

  // Phase 3: Marker Protocol Implementation
  const markerProtocol = await ctx.task(markerProtocolTask, {
    studyName,
    deviceType,
    subjectPopulation
  });

  // Phase 4: Inverse Kinematics Analysis
  const inverseKinematics = await ctx.task(inverseKinematicsTask, {
    studyName,
    motionCaptureProtocol,
    markerProtocol
  });

  // Breakpoint: Review kinematic results
  await ctx.breakpoint({
    question: `Review inverse kinematics results for ${studyName}. Are marker errors acceptable?`,
    title: 'Kinematics Review',
    context: {
      runId: ctx.runId,
      studyName,
      markerErrors: inverseKinematics.markerErrors,
      files: [{
        path: `artifacts/phase4-inverse-kinematics.json`,
        format: 'json',
        content: inverseKinematics
      }]
    }
  });

  // Phase 5: Inverse Dynamics Analysis
  const inverseDynamics = await ctx.task(inverseDynamicsTask, {
    studyName,
    inverseKinematics,
    grfMeasurement
  });

  // Phase 6: Musculoskeletal Model Development
  const msModel = await ctx.task(musculoskeletalModelTask, {
    studyName,
    subjectPopulation,
    inverseKinematics,
    inverseDynamics
  });

  // Phase 7: Muscle Force Estimation
  const muscleForceEstimation = await ctx.task(muscleForceTask, {
    studyName,
    msModel,
    inverseDynamics
  });

  // Phase 8: Clinical Outcome Correlation
  const clinicalCorrelation = await ctx.task(clinicalCorrelationTask, {
    studyName,
    deviceType,
    analysisGoals,
    inverseKinematics,
    inverseDynamics,
    muscleForceEstimation
  });

  // Final Breakpoint: Gait Analysis Approval
  await ctx.breakpoint({
    question: `Gait analysis complete for ${studyName}. Approve results and clinical correlations?`,
    title: 'Gait Analysis Approval',
    context: {
      runId: ctx.runId,
      studyName,
      files: [
        { path: `artifacts/gait-analysis-report.json`, format: 'json', content: clinicalCorrelation }
      ]
    }
  });

  return {
    success: true,
    studyName,
    gaitAnalysisReport: {
      kinematics: inverseKinematics.results,
      kinetics: inverseDynamics.results,
      muscleForces: muscleForceEstimation.results
    },
    musculoskeletalModel: msModel.model,
    clinicalCorrelation: clinicalCorrelation.correlation,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/gait-analysis-musculoskeletal',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const motionCaptureTask = defineTask('motion-capture-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Motion Capture Protocol - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Motion Capture Specialist',
      task: 'Design motion capture data collection protocol',
      context: {
        studyName: args.studyName,
        deviceType: args.deviceType,
        subjectPopulation: args.subjectPopulation
      },
      instructions: [
        '1. Define capture volume requirements',
        '2. Specify camera placement and calibration',
        '3. Define capture frame rate',
        '4. Plan static calibration trials',
        '5. Define walking trials protocol',
        '6. Plan subject preparation procedures',
        '7. Define data quality checks',
        '8. Document safety considerations',
        '9. Create data collection forms',
        '10. Create motion capture SOP'
      ],
      outputFormat: 'JSON object with motion capture protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'cameraSetup', 'trialDefinitions'],
      properties: {
        protocol: { type: 'object' },
        cameraSetup: { type: 'object' },
        trialDefinitions: { type: 'array', items: { type: 'object' } },
        calibrationProcedures: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'motion-capture', 'biomechanics']
}));

export const grfMeasurementTask = defineTask('grf-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: GRF Measurement - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Force Platform Specialist',
      task: 'Define ground reaction force measurement protocol',
      context: {
        studyName: args.studyName,
        motionCaptureProtocol: args.motionCaptureProtocol
      },
      instructions: [
        '1. Define force platform configuration',
        '2. Specify sampling frequency',
        '3. Plan force platform calibration',
        '4. Define synchronization with cameras',
        '5. Plan foot strike targeting',
        '6. Define data processing filters',
        '7. Plan center of pressure analysis',
        '8. Document quality criteria',
        '9. Create GRF processing pipeline',
        '10. Create GRF measurement SOP'
      ],
      outputFormat: 'JSON object with GRF measurement protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'platformSetup', 'dataProcessing'],
      properties: {
        protocol: { type: 'object' },
        platformSetup: { type: 'object' },
        dataProcessing: { type: 'object' },
        qualityCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'force-measurement', 'biomechanics']
}));

export const markerProtocolTask = defineTask('marker-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Marker Protocol - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomechanics Researcher',
      task: 'Define marker placement protocol',
      context: {
        studyName: args.studyName,
        deviceType: args.deviceType,
        subjectPopulation: args.subjectPopulation
      },
      instructions: [
        '1. Select marker set (Plug-in-Gait, Cleveland Clinic, etc.)',
        '2. Define anatomical landmark identification',
        '3. Specify marker placement procedures',
        '4. Adapt for device/prosthesis',
        '5. Define cluster placement',
        '6. Document marker labeling convention',
        '7. Plan static trial calibration',
        '8. Define troubleshooting procedures',
        '9. Create marker placement guide',
        '10. Create marker protocol SOP'
      ],
      outputFormat: 'JSON object with marker protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['markerSet', 'placements', 'calibrationProcedure'],
      properties: {
        markerSet: { type: 'string' },
        placements: { type: 'array', items: { type: 'object' } },
        calibrationProcedure: { type: 'object' },
        deviceAdaptations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'markers', 'biomechanics']
}));

export const inverseKinematicsTask = defineTask('inverse-kinematics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Inverse Kinematics - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OpenSim Analyst',
      task: 'Perform inverse kinematics analysis',
      context: {
        studyName: args.studyName,
        motionCaptureProtocol: args.motionCaptureProtocol,
        markerProtocol: args.markerProtocol
      },
      instructions: [
        '1. Scale generic model to subject',
        '2. Define marker weights',
        '3. Run inverse kinematics',
        '4. Evaluate marker errors',
        '5. Assess joint angle quality',
        '6. Filter kinematic data',
        '7. Extract gait events',
        '8. Time-normalize data',
        '9. Calculate gait parameters',
        '10. Create kinematics report'
      ],
      outputFormat: 'JSON object with inverse kinematics results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'markerErrors', 'gaitParameters'],
      properties: {
        results: { type: 'object' },
        markerErrors: { type: 'object' },
        gaitParameters: { type: 'object' },
        jointAngles: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'kinematics', 'opensim']
}));

export const inverseDynamicsTask = defineTask('inverse-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Inverse Dynamics - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomechanics Analyst',
      task: 'Perform inverse dynamics analysis',
      context: {
        studyName: args.studyName,
        inverseKinematics: args.inverseKinematics,
        grfMeasurement: args.grfMeasurement
      },
      instructions: [
        '1. Apply GRF to model',
        '2. Run inverse dynamics',
        '3. Calculate joint moments',
        '4. Calculate joint powers',
        '5. Assess dynamic consistency',
        '6. Normalize by body mass',
        '7. Time-normalize data',
        '8. Calculate kinetic parameters',
        '9. Assess joint loading',
        '10. Create kinetics report'
      ],
      outputFormat: 'JSON object with inverse dynamics results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'jointMoments', 'jointPowers'],
      properties: {
        results: { type: 'object' },
        jointMoments: { type: 'object' },
        jointPowers: { type: 'object' },
        kineticParameters: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'kinetics', 'opensim']
}));

export const musculoskeletalModelTask = defineTask('musculoskeletal-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: MS Model Development - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Musculoskeletal Modeler',
      task: 'Develop subject-specific musculoskeletal model',
      context: {
        studyName: args.studyName,
        subjectPopulation: args.subjectPopulation,
        inverseKinematics: args.inverseKinematics,
        inverseDynamics: args.inverseDynamics
      },
      instructions: [
        '1. Select base OpenSim model',
        '2. Scale model to subject anthropometry',
        '3. Adjust muscle parameters',
        '4. Modify for device/prosthesis',
        '5. Define contact models if needed',
        '6. Validate model scaling',
        '7. Document model modifications',
        '8. Save model files',
        '9. Create model documentation',
        '10. Create model validation plan'
      ],
      outputFormat: 'JSON object with musculoskeletal model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'scalingResults', 'modifications'],
      properties: {
        model: { type: 'object' },
        scalingResults: { type: 'object' },
        modifications: { type: 'array', items: { type: 'string' } },
        validationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'musculoskeletal-modeling', 'opensim']
}));

export const muscleForceTask = defineTask('muscle-force-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Muscle Force Estimation - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Muscle Mechanics Specialist',
      task: 'Estimate muscle forces using static optimization',
      context: {
        studyName: args.studyName,
        msModel: args.msModel,
        inverseDynamics: args.inverseDynamics
      },
      instructions: [
        '1. Configure static optimization',
        '2. Define optimization objective',
        '3. Run muscle force estimation',
        '4. Analyze muscle activation patterns',
        '5. Assess metabolic cost',
        '6. Calculate joint contact forces',
        '7. Validate against EMG if available',
        '8. Analyze coordination patterns',
        '9. Document assumptions',
        '10. Create muscle force report'
      ],
      outputFormat: 'JSON object with muscle force results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'muscleForces', 'jointContactForces'],
      properties: {
        results: { type: 'object' },
        muscleForces: { type: 'object' },
        jointContactForces: { type: 'object' },
        metabolicCost: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'muscle-forces', 'opensim']
}));

export const clinicalCorrelationTask = defineTask('clinical-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Clinical Correlation - ${args.studyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Biomechanist',
      task: 'Correlate biomechanical findings with clinical outcomes',
      context: {
        studyName: args.studyName,
        deviceType: args.deviceType,
        analysisGoals: args.analysisGoals,
        inverseKinematics: args.inverseKinematics,
        inverseDynamics: args.inverseDynamics,
        muscleForceEstimation: args.muscleForceEstimation
      },
      instructions: [
        '1. Compare to normative data',
        '2. Calculate symmetry indices',
        '3. Correlate with functional outcomes',
        '4. Assess device performance',
        '5. Identify compensation strategies',
        '6. Provide clinical interpretation',
        '7. Generate recommendations',
        '8. Create visualizations',
        '9. Document limitations',
        '10. Create clinical correlation report'
      ],
      outputFormat: 'JSON object with clinical correlation'
    },
    outputSchema: {
      type: 'object',
      required: ['correlation', 'recommendations', 'clinicalInterpretation'],
      properties: {
        correlation: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        clinicalInterpretation: { type: 'object' },
        symmetryIndices: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gait-analysis', 'clinical', 'biomechanics']
}));
