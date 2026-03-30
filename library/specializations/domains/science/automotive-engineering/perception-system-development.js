/**
 * @process specializations/domains/science/automotive-engineering/perception-system-development
 * @description Perception System Development - Develop perception systems using camera, radar, lidar, and
 * ultrasonic sensors for object detection, classification, and tracking in autonomous driving applications.
 * @inputs { projectName: string, sensorSuite: string[], oddDefinition?: object, safetyRequirements?: object }
 * @outputs { success: boolean, perceptionSoftware: object, trainedModels: object, sensorSpecifications: object, validationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/perception-system-development', {
 *   projectName: 'ADAS-Perception-L2Plus',
 *   sensorSuite: ['front-camera', 'corner-radars', 'ultrasonic'],
 *   oddDefinition: { speedRange: [0, 130], roadTypes: ['highway', 'urban'] },
 *   safetyRequirements: { asilLevel: 'ASIL-B' }
 * });
 *
 * @references
 * - ISO 21448 SOTIF
 * - ISO 26262 Functional Safety
 * - Euro NCAP Assessment Protocol
 * - SAE J3016 Levels of Driving Automation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sensorSuite = [],
    oddDefinition = {},
    safetyRequirements = {}
  } = inputs;

  // Phase 1: Sensor Suite Definition and Placement
  const sensorDefinition = await ctx.task(sensorDefinitionTask, {
    projectName,
    sensorSuite,
    oddDefinition,
    safetyRequirements
  });

  // Quality Gate: Sensor coverage must be adequate
  if (!sensorDefinition.coverageAnalysis || sensorDefinition.coverageAnalysis.blindSpots?.length > 0) {
    await ctx.breakpoint({
      question: `Sensor coverage analysis identified ${sensorDefinition.coverageAnalysis?.blindSpots?.length || 0} blind spots. Review and approve mitigation?`,
      title: 'Sensor Coverage Warning',
      context: {
        runId: ctx.runId,
        blindSpots: sensorDefinition.coverageAnalysis?.blindSpots,
        recommendation: 'Consider additional sensors or placement optimization'
      }
    });
  }

  // Phase 2: Sensor Fusion Architecture
  const sensorFusion = await ctx.task(sensorFusionTask, {
    projectName,
    sensorDefinition,
    oddDefinition
  });

  // Breakpoint: Fusion architecture review
  await ctx.breakpoint({
    question: `Review sensor fusion architecture for ${projectName}. Approach: ${sensorFusion.approach}. Approve architecture?`,
    title: 'Sensor Fusion Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      sensorFusion,
      files: [{
        path: `artifacts/sensor-fusion-architecture.json`,
        format: 'json',
        content: sensorFusion
      }]
    }
  });

  // Phase 3: Detection Model Development
  const detectionModels = await ctx.task(detectionModelsTask, {
    projectName,
    sensorDefinition,
    sensorFusion,
    oddDefinition
  });

  // Phase 4: Classification and Tracking
  const classificationTracking = await ctx.task(classificationTrackingTask, {
    projectName,
    detectionModels,
    sensorFusion,
    oddDefinition
  });

  // Phase 5: Data Collection and Annotation
  const dataCollection = await ctx.task(dataCollectionTask, {
    projectName,
    detectionModels,
    classificationTracking,
    oddDefinition
  });

  // Phase 6: Model Training and Validation
  const modelTraining = await ctx.task(modelTrainingTask, {
    projectName,
    detectionModels,
    classificationTracking,
    dataCollection
  });

  // Quality Gate: Model performance
  if (modelTraining.metrics?.mAP < 0.8) {
    await ctx.breakpoint({
      question: `Model mAP is ${modelTraining.metrics?.mAP}. Below target of 0.8. Review training strategy?`,
      title: 'Model Performance Warning',
      context: {
        runId: ctx.runId,
        modelTraining,
        recommendation: 'Augment training data or tune model hyperparameters'
      }
    });
  }

  // Phase 7: Perception Validation
  const perceptionValidation = await ctx.task(perceptionValidationTask, {
    projectName,
    modelTraining,
    sensorDefinition,
    oddDefinition,
    safetyRequirements
  });

  // Phase 8: Documentation and Release
  const perceptionRelease = await ctx.task(perceptionReleaseTask, {
    projectName,
    sensorDefinition,
    sensorFusion,
    detectionModels,
    classificationTracking,
    modelTraining,
    perceptionValidation
  });

  // Final Breakpoint: Perception system approval
  await ctx.breakpoint({
    question: `Perception System Development complete for ${projectName}. mAP: ${modelTraining.metrics?.mAP}. Approve for integration?`,
    title: 'Perception System Approval',
    context: {
      runId: ctx.runId,
      projectName,
      perceptionSummary: perceptionRelease.summary,
      files: [
        { path: `artifacts/perception-software.json`, format: 'json', content: perceptionRelease },
        { path: `artifacts/validation-reports.json`, format: 'json', content: perceptionValidation }
      ]
    }
  });

  return {
    success: true,
    projectName,
    perceptionSoftware: perceptionRelease.software,
    trainedModels: modelTraining.models,
    sensorSpecifications: sensorDefinition.specifications,
    validationReports: perceptionValidation.reports,
    fusionArchitecture: sensorFusion.architecture,
    nextSteps: perceptionRelease.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/perception-system-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const sensorDefinitionTask = defineTask('sensor-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Sensor Suite Definition and Placement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Perception Systems Architect',
      task: 'Define sensor suite and optimal placement for perception system',
      context: {
        projectName: args.projectName,
        sensorSuite: args.sensorSuite,
        oddDefinition: args.oddDefinition,
        safetyRequirements: args.safetyRequirements
      },
      instructions: [
        '1. Define sensor requirements based on ODD',
        '2. Select camera specifications (resolution, FOV, frame rate)',
        '3. Select radar specifications (range, resolution, detection)',
        '4. Select lidar specifications (if applicable)',
        '5. Define ultrasonic sensor placement',
        '6. Optimize sensor placement for coverage',
        '7. Analyze field of view overlaps',
        '8. Identify blind spots and mitigation',
        '9. Define mounting and calibration requirements',
        '10. Document sensor specifications'
      ],
      outputFormat: 'JSON object with sensor suite definition'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'placement', 'coverageAnalysis'],
      properties: {
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensorType: { type: 'string' },
              location: { type: 'string' },
              specifications: { type: 'object' },
              purpose: { type: 'string' }
            }
          }
        },
        placement: {
          type: 'object',
          properties: {
            layout: { type: 'object' },
            mountingRequirements: { type: 'array', items: { type: 'object' } }
          }
        },
        coverageAnalysis: {
          type: 'object',
          properties: {
            totalCoverage: { type: 'object' },
            overlaps: { type: 'array', items: { type: 'object' } },
            blindSpots: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'sensors', 'ADAS']
}));

export const sensorFusionTask = defineTask('sensor-fusion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Sensor Fusion Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sensor Fusion Engineer',
      task: 'Design sensor fusion architecture for perception system',
      context: {
        projectName: args.projectName,
        sensorDefinition: args.sensorDefinition,
        oddDefinition: args.oddDefinition
      },
      instructions: [
        '1. Define fusion approach (early, late, mid-level)',
        '2. Design temporal synchronization',
        '3. Define spatial alignment and calibration',
        '4. Design object association algorithms',
        '5. Implement track management',
        '6. Design uncertainty propagation',
        '7. Handle sensor degradation modes',
        '8. Define fusion output format',
        '9. Specify latency requirements',
        '10. Document fusion architecture'
      ],
      outputFormat: 'JSON object with sensor fusion architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'approach', 'algorithms'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            fusionLevel: { type: 'string' },
            dataFlow: { type: 'object' },
            components: { type: 'array', items: { type: 'object' } }
          }
        },
        approach: { type: 'string' },
        algorithms: {
          type: 'object',
          properties: {
            synchronization: { type: 'string' },
            association: { type: 'string' },
            trackManagement: { type: 'string' },
            uncertaintyHandling: { type: 'string' }
          }
        },
        latencyBudget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'sensor-fusion', 'architecture']
}));

export const detectionModelsTask = defineTask('detection-models', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Detection Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Computer Vision Engineer',
      task: 'Develop object detection models for perception',
      context: {
        projectName: args.projectName,
        sensorDefinition: args.sensorDefinition,
        sensorFusion: args.sensorFusion,
        oddDefinition: args.oddDefinition
      },
      instructions: [
        '1. Define detection object classes',
        '2. Select model architecture (YOLO, SSD, Faster R-CNN)',
        '3. Design camera detection pipeline',
        '4. Design radar detection processing',
        '5. Design lidar detection pipeline (if applicable)',
        '6. Define detection output format',
        '7. Optimize for embedded deployment',
        '8. Define inference requirements',
        '9. Design confidence scoring',
        '10. Document model specifications'
      ],
      outputFormat: 'JSON object with detection model design'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'objectClasses', 'pipeline'],
      properties: {
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              architecture: { type: 'string' },
              inputModality: { type: 'string' },
              outputFormat: { type: 'object' }
            }
          }
        },
        objectClasses: { type: 'array', items: { type: 'string' } },
        pipeline: {
          type: 'object',
          properties: {
            preprocessing: { type: 'object' },
            inference: { type: 'object' },
            postprocessing: { type: 'object' }
          }
        },
        deploymentRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'detection', 'deep-learning']
}));

export const classificationTrackingTask = defineTask('classification-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Classification and Tracking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Object Tracking Engineer',
      task: 'Develop object classification and tracking algorithms',
      context: {
        projectName: args.projectName,
        detectionModels: args.detectionModels,
        sensorFusion: args.sensorFusion,
        oddDefinition: args.oddDefinition
      },
      instructions: [
        '1. Design classification refinement',
        '2. Implement multi-object tracking (MOT)',
        '3. Design track initiation and termination',
        '4. Implement state estimation (Kalman filter, etc.)',
        '5. Design occlusion handling',
        '6. Implement trajectory prediction',
        '7. Design ID management and re-identification',
        '8. Handle track-to-track fusion',
        '9. Define tracking metrics',
        '10. Document tracking specifications'
      ],
      outputFormat: 'JSON object with classification and tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'tracking', 'prediction'],
      properties: {
        classification: {
          type: 'object',
          properties: {
            refinementMethod: { type: 'string' },
            attributeExtraction: { type: 'array', items: { type: 'string' } }
          }
        },
        tracking: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            stateEstimation: { type: 'string' },
            associationMethod: { type: 'string' },
            occlusionHandling: { type: 'string' }
          }
        },
        prediction: {
          type: 'object',
          properties: {
            horizonTime: { type: 'number' },
            method: { type: 'string' }
          }
        },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'tracking', 'classification']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Collection and Annotation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering Lead',
      task: 'Plan data collection and annotation for perception training',
      context: {
        projectName: args.projectName,
        detectionModels: args.detectionModels,
        classificationTracking: args.classificationTracking,
        oddDefinition: args.oddDefinition
      },
      instructions: [
        '1. Define data collection scenarios',
        '2. Specify geographic coverage',
        '3. Define weather and lighting conditions',
        '4. Plan edge case collection',
        '5. Define annotation guidelines',
        '6. Specify quality criteria',
        '7. Plan data augmentation strategies',
        '8. Define dataset splits (train/val/test)',
        '9. Establish data versioning',
        '10. Document data governance'
      ],
      outputFormat: 'JSON object with data collection plan'
    },
    outputSchema: {
      type: 'object',
      required: ['collectionPlan', 'annotationSpec', 'datasetSpec'],
      properties: {
        collectionPlan: {
          type: 'object',
          properties: {
            scenarios: { type: 'array', items: { type: 'object' } },
            geographicCoverage: { type: 'array', items: { type: 'string' } },
            conditions: { type: 'object' },
            targetVolume: { type: 'object' }
          }
        },
        annotationSpec: {
          type: 'object',
          properties: {
            guidelines: { type: 'object' },
            qualityCriteria: { type: 'object' },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        datasetSpec: {
          type: 'object',
          properties: {
            splits: { type: 'object' },
            augmentation: { type: 'array', items: { type: 'string' } },
            versioning: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'data-collection', 'annotation']
}));

export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Model Training and Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Machine Learning Engineer',
      task: 'Train and validate perception models',
      context: {
        projectName: args.projectName,
        detectionModels: args.detectionModels,
        classificationTracking: args.classificationTracking,
        dataCollection: args.dataCollection
      },
      instructions: [
        '1. Configure training infrastructure',
        '2. Implement training pipeline',
        '3. Define hyperparameter search',
        '4. Execute model training',
        '5. Evaluate on validation set',
        '6. Analyze failure cases',
        '7. Perform model optimization (quantization, pruning)',
        '8. Validate on test set',
        '9. Calculate final metrics (mAP, recall, precision)',
        '10. Document model performance'
      ],
      outputFormat: 'JSON object with model training results'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'metrics', 'trainingConfig'],
      properties: {
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              architecture: { type: 'string' },
              size: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            mAP: { type: 'number' },
            recall: { type: 'number' },
            precision: { type: 'number' },
            latency: { type: 'number' }
          }
        },
        trainingConfig: { type: 'object' },
        failureAnalysis: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'training', 'machine-learning']
}));

export const perceptionValidationTask = defineTask('perception-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Perception Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Perception Validation Engineer',
      task: 'Validate perception system performance',
      context: {
        projectName: args.projectName,
        modelTraining: args.modelTraining,
        sensorDefinition: args.sensorDefinition,
        oddDefinition: args.oddDefinition,
        safetyRequirements: args.safetyRequirements
      },
      instructions: [
        '1. Define validation scenarios',
        '2. Execute vehicle-level validation',
        '3. Validate across environmental conditions',
        '4. Test edge cases and corner cases',
        '5. Validate against safety requirements',
        '6. Measure real-world performance',
        '7. Validate latency and throughput',
        '8. Test sensor degradation handling',
        '9. Generate validation reports',
        '10. Document limitations and known issues'
      ],
      outputFormat: 'JSON object with perception validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'validation', 'limitations'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            scenarioResults: { type: 'array', items: { type: 'object' } },
            environmentalResults: { type: 'object' },
            safetyValidation: { type: 'object' }
          }
        },
        validation: {
          type: 'object',
          properties: {
            passRate: { type: 'number' },
            failedScenarios: { type: 'array', items: { type: 'object' } },
            performanceMetrics: { type: 'object' }
          }
        },
        limitations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'validation', 'safety']
}));

export const perceptionReleaseTask = defineTask('perception-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation and Release - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Perception Systems Release Engineer',
      task: 'Prepare perception system release package',
      context: {
        projectName: args.projectName,
        sensorDefinition: args.sensorDefinition,
        sensorFusion: args.sensorFusion,
        detectionModels: args.detectionModels,
        classificationTracking: args.classificationTracking,
        modelTraining: args.modelTraining,
        perceptionValidation: args.perceptionValidation
      },
      instructions: [
        '1. Compile perception software package',
        '2. Document API specifications',
        '3. Create integration guidelines',
        '4. Document sensor calibration procedures',
        '5. Compile model artifacts',
        '6. Create release notes',
        '7. Document known limitations',
        '8. Prepare deployment configuration',
        '9. Define next steps',
        '10. Archive development artifacts'
      ],
      outputFormat: 'JSON object with perception release'
    },
    outputSchema: {
      type: 'object',
      required: ['software', 'summary', 'nextSteps'],
      properties: {
        software: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            components: { type: 'array', items: { type: 'object' } },
            api: { type: 'object' },
            configuration: { type: 'object' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            performance: { type: 'object' },
            coverage: { type: 'object' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        releaseNotes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'perception', 'release', 'documentation']
}));
