/**
 * @process specializations/robotics-simulation/synthetic-data-pipeline
 * @description Synthetic Data Generation Pipeline - Automated pipeline for generating synthetic training data
 * for perception models including domain randomization, ground truth annotation, dataset balancing, and
 * export in standard formats.
 * @inputs { datasetName: string, targetObjects?: array, dataTypes?: array, numImages?: number, outputDir?: string }
 * @outputs { success: boolean, datasetPath: string, statistics: object, qualityMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/synthetic-data-pipeline', {
 *   datasetName: 'warehouse_objects',
 *   targetObjects: ['boxes', 'pallets', 'forklifts'],
 *   dataTypes: ['rgb', 'depth', 'segmentation', 'bounding-boxes'],
 *   numImages: 10000
 * });
 *
 * @references
 * - Domain Randomization: https://arxiv.org/abs/1703.06907
 * - Synthetic Data for Vision: https://arxiv.org/abs/1804.06516
 * - NVIDIA Isaac Sim: https://developer.nvidia.com/isaac-sim
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    datasetName,
    targetObjects = [],
    dataTypes = ['rgb', 'depth', 'segmentation'],
    numImages = 5000,
    domainRandomization = true,
    outputFormats = ['coco', 'kitti'],
    outputDir = 'synthetic-data-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Synthetic Data Pipeline: ${datasetName}`);
  ctx.log('info', `Target: ${numImages} images, Types: ${dataTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: SCENARIO DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Data Generation Scenario Design');

  const scenarioDesign = await ctx.task(scenarioDesignTask, {
    datasetName,
    targetObjects,
    outputDir
  });

  artifacts.push(...scenarioDesign.artifacts);

  // ============================================================================
  // PHASE 2: DOMAIN RANDOMIZATION CONFIGURATION
  // ============================================================================

  if (domainRandomization) {
    ctx.log('info', 'Phase 2: Domain Randomization Configuration');

    const drConfig = await ctx.task(domainRandomizationConfigTask, {
      datasetName,
      scenarioDesign,
      outputDir
    });

    artifacts.push(...drConfig.artifacts);
  }

  // ============================================================================
  // PHASE 3: OBJECT PLACEMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Randomized Object Placement Configuration');

  const objectPlacement = await ctx.task(objectPlacementConfigTask, {
    datasetName,
    targetObjects,
    scenarioDesign,
    outputDir
  });

  artifacts.push(...objectPlacement.artifacts);

  // ============================================================================
  // PHASE 4: SENSOR DATA CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Diverse Sensor Data Configuration');

  const sensorConfig = await ctx.task(sensorDataConfigTask, {
    datasetName,
    dataTypes,
    outputDir
  });

  artifacts.push(...sensorConfig.artifacts);

  // ============================================================================
  // PHASE 5: GROUND TRUTH ANNOTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Ground Truth Annotation Configuration');

  const annotationConfig = await ctx.task(groundTruthAnnotationTask, {
    datasetName,
    targetObjects,
    dataTypes,
    outputDir
  });

  artifacts.push(...annotationConfig.artifacts);

  // ============================================================================
  // PHASE 6: DATA GENERATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Data Generation Execution');

  const dataGeneration = await ctx.task(dataGenerationExecutionTask, {
    datasetName,
    numImages,
    scenarioDesign,
    objectPlacement,
    sensorConfig,
    annotationConfig,
    outputDir
  });

  artifacts.push(...dataGeneration.artifacts);

  await ctx.breakpoint({
    question: `Generated ${dataGeneration.generatedImages} images for ${datasetName}. Quality checks: ${dataGeneration.qualityPassed ? 'PASSED' : 'ISSUES'}. Continue with balancing?`,
    title: 'Data Generation Review',
    context: {
      runId: ctx.runId,
      generatedImages: dataGeneration.generatedImages,
      qualityMetrics: dataGeneration.qualityMetrics,
      files: dataGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 7: DATASET BALANCING
  // ============================================================================

  ctx.log('info', 'Phase 7: Dataset Balancing Across Scenarios');

  const datasetBalancing = await ctx.task(datasetBalancingTask, {
    datasetName,
    dataGeneration,
    targetObjects,
    outputDir
  });

  artifacts.push(...datasetBalancing.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Data Quality and Diversity Validation');

  const qualityValidation = await ctx.task(dataQualityValidationTask, {
    datasetName,
    dataGeneration,
    datasetBalancing,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);
  if (qualityValidation.issues) issues.push(...qualityValidation.issues);

  // ============================================================================
  // PHASE 9: DATASET EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Export Datasets in Standard Formats');

  const datasetExport = await ctx.task(datasetExportTask, {
    datasetName,
    dataGeneration,
    datasetBalancing,
    outputFormats,
    outputDir
  });

  artifacts.push(...datasetExport.artifacts);

  // ============================================================================
  // PHASE 10: DOMAIN GAP METRICS
  // ============================================================================

  ctx.log('info', 'Phase 10: Domain Gap Metrics Measurement');

  const domainGapMetrics = await ctx.task(domainGapMetricsTask, {
    datasetName,
    dataGeneration,
    qualityValidation,
    outputDir
  });

  artifacts.push(...domainGapMetrics.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Synthetic Data Pipeline Complete for ${datasetName}. ${dataGeneration.generatedImages} images in ${outputFormats.join(', ')} formats. Domain gap score: ${domainGapMetrics.gapScore}. Review dataset?`,
    title: 'Synthetic Data Pipeline Complete',
    context: {
      runId: ctx.runId,
      summary: {
        datasetName,
        totalImages: dataGeneration.generatedImages,
        formats: outputFormats,
        domainGapScore: domainGapMetrics.gapScore
      },
      files: [
        { path: datasetExport.datasetPath, format: 'folder', label: 'Dataset' },
        { path: qualityValidation.reportPath, format: 'markdown', label: 'Quality Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: qualityValidation.passed,
    datasetName,
    datasetPath: datasetExport.datasetPath,
    statistics: {
      totalImages: dataGeneration.generatedImages,
      objectCounts: datasetBalancing.objectCounts,
      scenarioCounts: datasetBalancing.scenarioCounts
    },
    qualityMetrics: qualityValidation.metrics,
    domainGap: domainGapMetrics.gapScore,
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/synthetic-data-pipeline',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const scenarioDesignTask = defineTask('scenario-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Scenario Design - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Design data generation scenarios',
      context: args,
      instructions: [
        '1. Define target use cases for dataset',
        '2. Design environment scenarios',
        '3. Plan object arrangements',
        '4. Define camera viewpoints and angles',
        '5. Plan lighting conditions',
        '6. Define occlusion scenarios',
        '7. Plan edge cases',
        '8. Design scenario distribution',
        '9. Estimate images per scenario',
        '10. Document scenario specifications'
      ],
      outputFormat: 'JSON with scenario design'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'distribution', 'artifacts'],
      properties: {
        scenarios: { type: 'array', items: { type: 'object' } },
        distribution: { type: 'object' },
        viewpoints: { type: 'array', items: { type: 'object' } },
        lightingConditions: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'scenario-design']
}));

export const domainRandomizationConfigTask = defineTask('domain-randomization-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Domain Randomization - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Engineer',
      task: 'Configure domain randomization',
      context: args,
      instructions: [
        '1. Configure appearance randomization (textures, colors)',
        '2. Set up lighting randomization',
        '3. Configure camera pose variations',
        '4. Add background randomization',
        '5. Set up distractors',
        '6. Configure noise injection',
        '7. Set randomization ranges',
        '8. Define randomization schedules',
        '9. Test randomization effects',
        '10. Document randomization parameters'
      ],
      outputFormat: 'JSON with domain randomization config'
    },
    outputSchema: {
      type: 'object',
      required: ['randomizationParams', 'ranges', 'artifacts'],
      properties: {
        randomizationParams: { type: 'array', items: { type: 'object' } },
        ranges: { type: 'object' },
        schedules: { type: 'object' },
        distractors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'domain-randomization']
}));

export const objectPlacementConfigTask = defineTask('object-placement-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Object Placement - ${args.datasetName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Configure randomized object placement',
      context: args,
      instructions: [
        '1. Define placement regions',
        '2. Configure object spawn rules',
        '3. Set object density parameters',
        '4. Configure collision avoidance',
        '5. Add physics settling',
        '6. Set pose randomization',
        '7. Configure occlusion generation',
        '8. Add clutter objects',
        '9. Test placement algorithms',
        '10. Document placement rules'
      ],
      outputFormat: 'JSON with object placement config'
    },
    outputSchema: {
      type: 'object',
      required: ['placementRules', 'regions', 'artifacts'],
      properties: {
        placementRules: { type: 'array', items: { type: 'object' } },
        regions: { type: 'array', items: { type: 'object' } },
        densityParams: { type: 'object' },
        poseRandomization: { type: 'object' },
        occlusionConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'object-placement']
}));

export const sensorDataConfigTask = defineTask('sensor-data-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sensor Data Config - ${args.datasetName}`,
  agent: {
    name: 'sensor-engineer',
    prompt: {
      role: 'Sensor Engineer',
      task: 'Configure diverse sensor data generation',
      context: args,
      instructions: [
        '1. Configure RGB camera parameters',
        '2. Set up depth sensor simulation',
        '3. Configure point cloud generation',
        '4. Add thermal/IR simulation if needed',
        '5. Set sensor noise models',
        '6. Configure multi-sensor setups',
        '7. Set capture rates and timing',
        '8. Configure output resolutions',
        '9. Add sensor imperfections',
        '10. Document sensor configurations'
      ],
      outputFormat: 'JSON with sensor data configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['sensorConfigs', 'dataTypes', 'artifacts'],
      properties: {
        sensorConfigs: { type: 'array', items: { type: 'object' } },
        dataTypes: { type: 'array', items: { type: 'string' } },
        noiseModels: { type: 'object' },
        resolutions: { type: 'object' },
        captureParams: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'sensors']
}));

export const groundTruthAnnotationTask = defineTask('ground-truth-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Ground Truth Annotation - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Configure ground truth annotation generation',
      context: args,
      instructions: [
        '1. Configure semantic segmentation masks',
        '2. Set up instance segmentation',
        '3. Generate 2D bounding boxes',
        '4. Configure 3D bounding boxes',
        '5. Add keypoint annotations',
        '6. Generate depth ground truth',
        '7. Add object poses (6DoF)',
        '8. Configure occlusion labels',
        '9. Set annotation formats',
        '10. Validate annotation accuracy'
      ],
      outputFormat: 'JSON with annotation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['annotationTypes', 'formats', 'artifacts'],
      properties: {
        annotationTypes: { type: 'array', items: { type: 'string' } },
        formats: { type: 'array', items: { type: 'string' } },
        classLabels: { type: 'array', items: { type: 'object' } },
        keypointDefinitions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'annotations']
}));

export const dataGenerationExecutionTask = defineTask('data-generation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Data Generation - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Execute data generation pipeline',
      context: args,
      instructions: [
        '1. Initialize data generation pipeline',
        '2. Execute scenario batches',
        '3. Monitor generation progress',
        '4. Run quality checks inline',
        '5. Handle generation errors',
        '6. Save intermediate checkpoints',
        '7. Log generation statistics',
        '8. Parallelize generation if possible',
        '9. Verify data integrity',
        '10. Report generation summary'
      ],
      outputFormat: 'JSON with generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['generatedImages', 'qualityPassed', 'qualityMetrics', 'artifacts'],
      properties: {
        generatedImages: { type: 'number' },
        qualityPassed: { type: 'boolean' },
        qualityMetrics: { type: 'object' },
        scenarioBreakdown: { type: 'object' },
        errors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'generation']
}));

export const datasetBalancingTask = defineTask('dataset-balancing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Dataset Balancing - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Balance dataset across scenarios and conditions',
      context: args,
      instructions: [
        '1. Analyze class distribution',
        '2. Balance object class counts',
        '3. Balance scenario distributions',
        '4. Balance lighting conditions',
        '5. Balance occlusion levels',
        '6. Balance viewpoint diversity',
        '7. Identify underrepresented cases',
        '8. Generate additional samples if needed',
        '9. Create train/val/test splits',
        '10. Document balancing strategy'
      ],
      outputFormat: 'JSON with balancing results'
    },
    outputSchema: {
      type: 'object',
      required: ['objectCounts', 'scenarioCounts', 'splits', 'artifacts'],
      properties: {
        objectCounts: { type: 'object' },
        scenarioCounts: { type: 'object' },
        splits: { type: 'object' },
        classBalance: { type: 'object' },
        adjustments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'balancing']
}));

export const dataQualityValidationTask = defineTask('data-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Quality Validation - ${args.datasetName}`,
  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Validate data quality and diversity',
      context: args,
      instructions: [
        '1. Check image quality metrics',
        '2. Validate annotation accuracy',
        '3. Check bounding box validity',
        '4. Validate segmentation masks',
        '5. Measure dataset diversity',
        '6. Check for generation artifacts',
        '7. Validate file integrity',
        '8. Check format compliance',
        '9. Generate quality report',
        '10. Flag quality issues'
      ],
      outputFormat: 'JSON with quality validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'metrics', 'reportPath', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        metrics: { type: 'object' },
        reportPath: { type: 'string' },
        diversityScore: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'quality']
}));

export const datasetExportTask = defineTask('dataset-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Dataset Export - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Export datasets in standard formats',
      context: args,
      instructions: [
        '1. Export in COCO format',
        '2. Export in KITTI format',
        '3. Export in Pascal VOC format',
        '4. Create custom format if needed',
        '5. Generate dataset manifest',
        '6. Create dataset documentation',
        '7. Package dataset archives',
        '8. Generate checksums',
        '9. Create dataset README',
        '10. Verify export integrity'
      ],
      outputFormat: 'JSON with export details'
    },
    outputSchema: {
      type: 'object',
      required: ['datasetPath', 'formats', 'artifacts'],
      properties: {
        datasetPath: { type: 'string' },
        formats: { type: 'array', items: { type: 'string' } },
        manifest: { type: 'object' },
        archives: { type: 'array', items: { type: 'string' } },
        checksums: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'export']
}));

export const domainGapMetricsTask = defineTask('domain-gap-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Domain Gap Metrics - ${args.datasetName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Engineer',
      task: 'Measure domain gap metrics',
      context: args,
      instructions: [
        '1. Compare synthetic vs real data distributions',
        '2. Compute FID/KID scores if real data available',
        '3. Analyze texture realism',
        '4. Evaluate lighting realism',
        '5. Check geometric accuracy',
        '6. Measure annotation consistency',
        '7. Compare sensor noise characteristics',
        '8. Identify gap sources',
        '9. Recommend gap reduction',
        '10. Document gap metrics'
      ],
      outputFormat: 'JSON with domain gap metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['gapScore', 'gapMetrics', 'artifacts'],
      properties: {
        gapScore: { type: 'number' },
        gapMetrics: { type: 'object' },
        fidScore: { type: 'number' },
        gapSources: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'synthetic-data', 'domain-gap']
}));
