/**
 * @process specializations/data-science-ml/distributed-training
 * @description Distributed Training Orchestration - Design and execute distributed training strategies for large-scale ML models
 * with resource allocation, parallelization strategy, fault tolerance, and performance optimization across multiple nodes/GPUs.
 * @inputs { projectName: string, modelArchitecture: string, datasetSize: string, trainingObjective: string, availableResources?: object }
 * @outputs { success: boolean, distributionStrategy: object, resourceAllocation: object, trainingPlan: object, performanceOptimizations: object, faultToleranceConfig: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/distributed-training', {
 *   projectName: 'Large Language Model Training',
 *   modelArchitecture: 'Transformer with 7B parameters',
 *   datasetSize: '500GB text corpus',
 *   trainingObjective: 'Pre-train language model from scratch',
 *   availableResources: { gpus: 32, nodes: 4, memory: '2TB', storage: '10TB' }
 * });
 *
 * @references
 * - PyTorch Distributed Training: https://pytorch.org/tutorials/beginner/dist_overview.html
 * - TensorFlow Distributed Strategies: https://www.tensorflow.org/guide/distributed_training
 * - Horovod Framework: https://horovod.readthedocs.io/
 * - DeepSpeed: https://www.deepspeed.ai/
 * - Ray Train: https://docs.ray.io/en/latest/train/train.html
 * - Model Parallelism Patterns: https://arxiv.org/abs/1909.08053
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    modelArchitecture,
    datasetSize,
    trainingObjective,
    availableResources = {},
    constraints = {},
    targetTrainingTime = null,
    budgetLimit = null
  } = inputs;

  // Phase 1: Resource Assessment and Requirements Analysis
  const resourceAssessment = await ctx.task(resourceAssessmentTask, {
    projectName,
    modelArchitecture,
    datasetSize,
    trainingObjective,
    availableResources,
    constraints
  });

  // Quality Gate: Minimum resources must be available
  if (!resourceAssessment.feasible) {
    return {
      success: false,
      error: 'Insufficient resources for distributed training',
      phase: 'resource-assessment',
      requiredResources: resourceAssessment.minimumRequirements,
      availableResources: availableResources
    };
  }

  // Breakpoint: Review resource allocation
  await ctx.breakpoint({
    question: `Resource assessment complete for ${projectName}. Available: ${resourceAssessment.availableGPUs} GPUs across ${resourceAssessment.availableNodes} nodes. Proceed with this configuration?`,
    title: 'Resource Assessment Review',
    context: {
      runId: ctx.runId,
      projectName,
      resourceAssessment,
      estimatedCost: resourceAssessment.estimatedCost,
      files: [{
        path: 'artifacts/phase1-resource-assessment.json',
        format: 'json',
        content: resourceAssessment
      }]
    }
  });

  // Phase 2: Model Analysis and Partitioning Strategy
  const modelAnalysis = await ctx.task(modelAnalysisTask, {
    projectName,
    modelArchitecture,
    resourceAssessment,
    trainingObjective
  });

  // Phase 3: Parallelization Strategy Selection
  const parallelizationStrategy = await ctx.task(parallelizationStrategyTask, {
    projectName,
    modelArchitecture,
    modelAnalysis,
    resourceAssessment,
    datasetSize,
    trainingObjective
  });

  // Quality Gate: Parallelization strategy must be viable
  if (!parallelizationStrategy.viable) {
    await ctx.breakpoint({
      question: `Parallelization strategy assessment shows challenges: ${parallelizationStrategy.challenges.join(', ')}. Adjust strategy or proceed with recommendations?`,
      title: 'Parallelization Strategy Warning',
      context: {
        runId: ctx.runId,
        strategy: parallelizationStrategy.recommendedStrategy,
        challenges: parallelizationStrategy.challenges,
        recommendations: parallelizationStrategy.alternatives
      }
    });
  }

  // Phase 4: Data Distribution and Loading Strategy
  const dataStrategy = await ctx.task(dataDistributionTask, {
    projectName,
    datasetSize,
    parallelizationStrategy,
    resourceAssessment,
    modelAnalysis
  });

  // Phase 5: Communication Optimization
  const communicationPlan = await ctx.task(communicationOptimizationTask, {
    projectName,
    parallelizationStrategy,
    modelAnalysis,
    resourceAssessment,
    dataStrategy
  });

  // Phase 6: Gradient Synchronization Strategy
  const gradientSyncStrategy = await ctx.task(gradientSynchronizationTask, {
    projectName,
    parallelizationStrategy,
    modelAnalysis,
    communicationPlan,
    trainingObjective
  });

  // Phase 7: Memory Optimization and Management
  const memoryOptimization = await ctx.task(memoryOptimizationTask, {
    projectName,
    modelArchitecture,
    modelAnalysis,
    resourceAssessment,
    parallelizationStrategy
  });

  // Quality Gate: Memory requirements must fit available resources
  if (memoryOptimization.memoryExceeded) {
    await ctx.breakpoint({
      question: `Memory requirements (${memoryOptimization.requiredMemory}) exceed available memory (${memoryOptimization.availableMemory}). Apply aggressive optimizations or reduce model size?`,
      title: 'Memory Constraint Warning',
      context: {
        runId: ctx.runId,
        memoryGap: memoryOptimization.memoryGap,
        suggestedOptimizations: memoryOptimization.aggressiveOptimizations,
        tradeoffs: memoryOptimization.tradeoffs
      }
    });
  }

  // Phase 8: Fault Tolerance and Checkpointing
  const faultToleranceConfig = await ctx.task(faultToleranceTask, {
    projectName,
    parallelizationStrategy,
    dataStrategy,
    resourceAssessment,
    trainingObjective,
    targetTrainingTime
  });

  // Phase 9: Performance Monitoring and Profiling
  const monitoringPlan = await ctx.task(monitoringPlanTask, {
    projectName,
    parallelizationStrategy,
    resourceAssessment,
    communicationPlan,
    gradientSyncStrategy,
    faultToleranceConfig
  });

  // Phase 10: Training Configuration Generation
  const trainingConfig = await ctx.task(trainingConfigurationTask, {
    projectName,
    modelArchitecture,
    parallelizationStrategy,
    dataStrategy,
    communicationPlan,
    gradientSyncStrategy,
    memoryOptimization,
    faultToleranceConfig,
    resourceAssessment
  });

  // Phase 11: Hyperparameter Tuning for Distributed Setting
  const hyperparameterConfig = await ctx.task(distributedHyperparametersTask, {
    projectName,
    trainingObjective,
    parallelizationStrategy,
    modelAnalysis,
    resourceAssessment,
    trainingConfig
  });

  // Breakpoint: Review hyperparameters
  await ctx.breakpoint({
    question: `Distributed hyperparameters configured for ${projectName}. Learning rate: ${hyperparameterConfig.learningRate}, Batch size: ${hyperparameterConfig.globalBatchSize}. Review and approve?`,
    title: 'Hyperparameter Configuration Review',
    context: {
      runId: ctx.runId,
      hyperparameters: hyperparameterConfig,
      scalingRecommendations: hyperparameterConfig.scalingGuidelines,
      files: [{
        path: 'artifacts/phase11-hyperparameters.json',
        format: 'json',
        content: hyperparameterConfig
      }]
    }
  });

  // Phase 12: Performance Optimization and Tuning
  const performanceOptimizations = await ctx.task(performanceOptimizationTask, {
    projectName,
    parallelizationStrategy,
    communicationPlan,
    memoryOptimization,
    trainingConfig,
    resourceAssessment
  });

  // Phase 13: Launch Script and Orchestration
  const launchConfig = await ctx.task(launchOrchestrationTask, {
    projectName,
    trainingConfig,
    resourceAssessment,
    parallelizationStrategy,
    faultToleranceConfig,
    monitoringPlan
  });

  // Phase 14: Cost Estimation and Optimization
  const costAnalysis = await ctx.task(costEstimationTask, {
    projectName,
    resourceAssessment,
    trainingConfig,
    targetTrainingTime,
    budgetLimit,
    performanceOptimizations
  });

  // Quality Gate: Cost must be within budget
  if (budgetLimit && costAnalysis.estimatedCost > budgetLimit) {
    await ctx.breakpoint({
      question: `Estimated training cost ($${costAnalysis.estimatedCost}) exceeds budget limit ($${budgetLimit}). Apply cost optimizations or increase budget?`,
      title: 'Budget Constraint Warning',
      context: {
        runId: ctx.runId,
        estimatedCost: costAnalysis.estimatedCost,
        budgetLimit,
        costBreakdown: costAnalysis.breakdown,
        costOptimizations: costAnalysis.savingOpportunities
      }
    });
  }

  // Phase 15: Testing and Validation Plan
  const validationPlan = await ctx.task(validationPlanTask, {
    projectName,
    trainingConfig,
    parallelizationStrategy,
    dataStrategy,
    faultToleranceConfig,
    resourceAssessment
  });

  // Phase 16: Final Training Plan Documentation
  const trainingPlan = await ctx.task(trainingPlanDocumentationTask, {
    projectName,
    modelArchitecture,
    trainingObjective,
    resourceAssessment,
    modelAnalysis,
    parallelizationStrategy,
    dataStrategy,
    communicationPlan,
    gradientSyncStrategy,
    memoryOptimization,
    faultToleranceConfig,
    monitoringPlan,
    trainingConfig,
    hyperparameterConfig,
    performanceOptimizations,
    launchConfig,
    costAnalysis,
    validationPlan
  });

  // Final Breakpoint: Approval to Launch
  await ctx.breakpoint({
    question: `Distributed training plan complete for ${projectName}. Configuration: ${parallelizationStrategy.recommendedStrategy}, ${resourceAssessment.availableGPUs} GPUs, Est. cost: $${costAnalysis.estimatedCost}. Approve launch?`,
    title: 'Distributed Training Plan Approval',
    context: {
      runId: ctx.runId,
      projectName,
      strategy: parallelizationStrategy.recommendedStrategy,
      resources: `${resourceAssessment.availableGPUs} GPUs across ${resourceAssessment.availableNodes} nodes`,
      estimatedDuration: trainingConfig.estimatedDuration,
      estimatedCost: costAnalysis.estimatedCost,
      files: [
        { path: 'artifacts/final-training-plan.json', format: 'json', content: trainingPlan.json },
        { path: 'artifacts/final-training-plan.md', format: 'markdown', content: trainingPlan.markdown },
        { path: 'artifacts/launch-script.sh', format: 'bash', content: launchConfig.launchScript }
      ]
    }
  });

  return {
    success: true,
    projectName,
    distributionStrategy: {
      primaryStrategy: parallelizationStrategy.recommendedStrategy,
      dataParallelism: parallelizationStrategy.dataParallelismConfig,
      modelParallelism: parallelizationStrategy.modelParallelismConfig,
      pipelineParallelism: parallelizationStrategy.pipelineParallelismConfig,
      hybridStrategy: parallelizationStrategy.hybridConfig,
      scalingEfficiency: parallelizationStrategy.expectedScalingEfficiency
    },
    resourceAllocation: {
      totalGPUs: resourceAssessment.availableGPUs,
      totalNodes: resourceAssessment.availableNodes,
      gpusPerNode: resourceAssessment.gpusPerNode,
      memoryPerGPU: resourceAssessment.memoryPerGPU,
      interconnect: resourceAssessment.interconnectType,
      storageConfig: dataStrategy.storageConfiguration
    },
    trainingPlan: {
      framework: trainingConfig.framework,
      globalBatchSize: hyperparameterConfig.globalBatchSize,
      microBatchSize: hyperparameterConfig.microBatchSize,
      learningRate: hyperparameterConfig.learningRate,
      optimizer: hyperparameterConfig.optimizer,
      estimatedDuration: trainingConfig.estimatedDuration,
      checkpointFrequency: faultToleranceConfig.checkpointFrequency,
      configuration: trainingConfig.configFiles
    },
    performanceOptimizations: {
      mixedPrecision: performanceOptimizations.mixedPrecisionConfig,
      gradientAccumulation: performanceOptimizations.gradientAccumulation,
      activationCheckpointing: memoryOptimization.activationCheckpointing,
      fusedOperations: performanceOptimizations.kernelFusion,
      communicationOptimizations: communicationPlan.optimizations,
      expectedSpeedup: performanceOptimizations.expectedSpeedup
    },
    faultToleranceConfig: {
      checkpointStrategy: faultToleranceConfig.strategy,
      checkpointFrequency: faultToleranceConfig.checkpointFrequency,
      checkpointLocation: faultToleranceConfig.storageLocation,
      elasticTraining: faultToleranceConfig.elasticConfig,
      recoveryProcedures: faultToleranceConfig.recoveryPlan,
      redundancyLevel: faultToleranceConfig.redundancy
    },
    dataStrategy: {
      loadingMethod: dataStrategy.loadingStrategy,
      shardingStrategy: dataStrategy.shardingConfig,
      prefetchingConfig: dataStrategy.prefetchConfig,
      dataLoaderWorkers: dataStrategy.workerCount,
      caching: dataStrategy.cachingStrategy
    },
    communicationPlan: {
      backend: communicationPlan.backend,
      gradientCompression: communicationPlan.compressionConfig,
      allReduceAlgorithm: gradientSyncStrategy.allReduceStrategy,
      bandwidthOptimizations: communicationPlan.bandwidthOptimizations,
      overlapping: communicationPlan.computeCommunicationOverlap
    },
    monitoringPlan: {
      metrics: monitoringPlan.metrics,
      dashboards: monitoringPlan.dashboardLinks,
      alerting: monitoringPlan.alertingRules,
      profiling: monitoringPlan.profilingConfig,
      logging: monitoringPlan.loggingStrategy
    },
    costAnalysis: {
      estimatedCost: costAnalysis.estimatedCost,
      breakdown: costAnalysis.breakdown,
      optimizations: costAnalysis.appliedOptimizations,
      savingOpportunities: costAnalysis.savingOpportunities
    },
    launchConfiguration: {
      launchScript: launchConfig.launchScript,
      environmentSetup: launchConfig.environmentConfig,
      nodeConfiguration: launchConfig.nodeSetup,
      distributedBackend: launchConfig.backendConfig,
      commandLineArgs: launchConfig.commandArgs
    },
    validationPlan: {
      preTrainingChecks: validationPlan.preTrainingValidations,
      inTrainingMonitoring: validationPlan.runtimeValidations,
      performanceBaselines: validationPlan.performanceBaselines,
      troubleshooting: validationPlan.troubleshootingGuide
    },
    nextSteps: trainingPlan.nextSteps,
    metadata: {
      processId: 'specializations/data-science-ml/distributed-training',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const resourceAssessmentTask = defineTask('resource-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Resource Assessment and Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Infrastructure Architect specializing in distributed training systems',
      task: 'Assess available resources and determine requirements for distributed training',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        datasetSize: args.datasetSize,
        trainingObjective: args.trainingObjective,
        availableResources: args.availableResources,
        constraints: args.constraints
      },
      instructions: [
        '1. Analyze the model architecture to estimate computational requirements (FLOPs, memory)',
        '2. Assess available hardware resources (GPUs, TPUs, CPUs, memory, storage, network bandwidth)',
        '3. Determine minimum resource requirements for the training job',
        '4. Identify resource bottlenecks (compute, memory, network, storage)',
        '5. Assess network topology and interconnect capabilities (InfiniBand, Ethernet, NVLink)',
        '6. Evaluate storage system capabilities (IOPS, throughput, capacity)',
        '7. Calculate resource utilization and efficiency estimates',
        '8. Identify cloud vs on-premise resource options and costs',
        '9. Assess scalability limits based on model and data characteristics',
        '10. Provide feasibility assessment and resource recommendations'
      ],
      outputFormat: 'JSON object with comprehensive resource assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'availableGPUs', 'availableNodes', 'minimumRequirements'],
      properties: {
        feasible: {
          type: 'boolean',
          description: 'Whether distributed training is feasible with available resources'
        },
        availableGPUs: {
          type: 'number',
          description: 'Total number of GPUs available'
        },
        availableNodes: {
          type: 'number',
          description: 'Number of compute nodes available'
        },
        gpusPerNode: {
          type: 'number',
          description: 'GPUs per node'
        },
        gpuType: {
          type: 'string',
          description: 'GPU model (e.g., A100, V100, H100)'
        },
        memoryPerGPU: {
          type: 'string',
          description: 'Memory per GPU (e.g., 40GB, 80GB)'
        },
        totalMemory: {
          type: 'string',
          description: 'Total GPU memory available'
        },
        interconnectType: {
          type: 'string',
          description: 'Network interconnect type (InfiniBand, NVLink, Ethernet)'
        },
        interconnectBandwidth: {
          type: 'string',
          description: 'Network bandwidth (e.g., 100Gbps, 200Gbps)'
        },
        storageSystem: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            capacity: { type: 'string' },
            throughput: { type: 'string' },
            iops: { type: 'number' }
          }
        },
        minimumRequirements: {
          type: 'object',
          properties: {
            minGPUs: { type: 'number' },
            minMemoryPerGPU: { type: 'string' },
            minBandwidth: { type: 'string' },
            minStorage: { type: 'string' }
          },
          description: 'Minimum resources needed for training'
        },
        computationalRequirements: {
          type: 'object',
          properties: {
            estimatedFLOPs: { type: 'string' },
            estimatedMemoryFootprint: { type: 'string' },
            estimatedBandwidthNeeds: { type: 'string' }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          },
          description: 'Identified resource bottlenecks'
        },
        resourceUtilization: {
          type: 'object',
          properties: {
            expectedComputeUtilization: { type: 'string' },
            expectedMemoryUtilization: { type: 'string' },
            expectedNetworkUtilization: { type: 'string' }
          }
        },
        deploymentOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              provider: { type: 'string' },
              configuration: { type: 'string' },
              estimatedCost: { type: 'string' }
            }
          }
        },
        estimatedCost: {
          type: 'string',
          description: 'Estimated cost for the training run'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Resource optimization recommendations'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'resource-assessment', 'infrastructure']
}));

export const modelAnalysisTask = defineTask('model-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Model Analysis and Partitioning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Deep Learning Architect specializing in model parallelization',
      task: 'Analyze model architecture and determine optimal partitioning strategy',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        resourceAssessment: args.resourceAssessment,
        trainingObjective: args.trainingObjective
      },
      instructions: [
        '1. Analyze model architecture components (layers, attention heads, embeddings, etc.)',
        '2. Calculate model size (parameters, memory footprint per layer)',
        '3. Profile computational intensity of each layer/component',
        '4. Identify natural partition points in the model (layer boundaries, stages)',
        '5. Assess activation memory requirements during forward/backward pass',
        '6. Analyze data dependencies and communication requirements between partitions',
        '7. Evaluate whether model fits in single GPU memory',
        '8. Determine if model parallelism is necessary',
        '9. Identify opportunities for pipeline parallelism',
        '10. Provide model partitioning recommendations'
      ],
      outputFormat: 'JSON object with comprehensive model analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['modelSize', 'fitsInSingleGPU', 'requiresModelParallelism'],
      properties: {
        modelSize: {
          type: 'object',
          properties: {
            totalParameters: { type: 'string' },
            trainableParameters: { type: 'string' },
            memoryFootprint: { type: 'string' },
            activationMemory: { type: 'string' },
            optimizerMemory: { type: 'string' },
            totalMemoryRequired: { type: 'string' }
          }
        },
        fitsInSingleGPU: {
          type: 'boolean',
          description: 'Whether model fits in single GPU memory'
        },
        requiresModelParallelism: {
          type: 'boolean',
          description: 'Whether model parallelism is necessary'
        },
        layerAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              layerName: { type: 'string' },
              parameters: { type: 'string' },
              memory: { type: 'string' },
              computeIntensity: { type: 'string' },
              activationSize: { type: 'string' }
            }
          },
          description: 'Per-layer resource analysis'
        },
        partitionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              rationale: { type: 'string' },
              communicationOverhead: { type: 'string' }
            }
          },
          description: 'Recommended partition boundaries'
        },
        computationalProfile: {
          type: 'object',
          properties: {
            forwardPassFLOPs: { type: 'string' },
            backwardPassFLOPs: { type: 'string' },
            totalFLOPsPerIteration: { type: 'string' },
            computeIntensityRatio: { type: 'number' }
          }
        },
        dataDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              dataSize: { type: 'string' },
              frequency: { type: 'string' }
            }
          },
          description: 'Data dependencies between model components'
        },
        pipelineStageSuggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'number' },
              layers: { type: 'array', items: { type: 'string' } },
              memoryRequirement: { type: 'string' },
              computeLoad: { type: 'string' }
            }
          },
          description: 'Suggested pipeline stages for pipeline parallelism'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Model partitioning recommendations'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'model-analysis', 'partitioning']
}));

export const parallelizationStrategyTask = defineTask('parallelization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Parallelization Strategy Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed Systems Expert specializing in ML parallelization',
      task: 'Design optimal parallelization strategy for distributed training',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        modelAnalysis: args.modelAnalysis,
        resourceAssessment: args.resourceAssessment,
        datasetSize: args.datasetSize,
        trainingObjective: args.trainingObjective
      },
      instructions: [
        '1. Evaluate data parallelism feasibility (distribute data across GPUs)',
        '2. Evaluate model parallelism feasibility (distribute model across GPUs)',
        '3. Evaluate pipeline parallelism feasibility (pipeline stages across GPUs)',
        '4. Evaluate tensor parallelism for large layers (split tensors across GPUs)',
        '5. Assess hybrid parallelism strategies (combination of approaches)',
        '6. Calculate communication overhead for each strategy',
        '7. Estimate scaling efficiency for each strategy',
        '8. Consider framework support (PyTorch DDP, DeepSpeed, Megatron, etc.)',
        '9. Recommend optimal parallelization strategy with rationale',
        '10. Provide configuration details for recommended strategy'
      ],
      outputFormat: 'JSON object with parallelization strategy recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedStrategy', 'viable', 'expectedScalingEfficiency'],
      properties: {
        recommendedStrategy: {
          type: 'string',
          enum: ['data-parallelism', 'model-parallelism', 'pipeline-parallelism', 'tensor-parallelism', 'hybrid-3d-parallelism'],
          description: 'Primary recommended parallelization strategy'
        },
        viable: {
          type: 'boolean',
          description: 'Whether the strategy is viable with available resources'
        },
        strategyRationale: {
          type: 'string',
          description: 'Explanation for why this strategy was chosen'
        },
        dataParallelismConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            replicaCount: { type: 'number' },
            gradientAllReduceStrategy: { type: 'string' },
            communicationOverhead: { type: 'string' },
            expectedEfficiency: { type: 'string' }
          }
        },
        modelParallelismConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            partitionStrategy: { type: 'string' },
            gpusPerModelReplica: { type: 'number' },
            partitions: { type: 'array', items: { type: 'object' } },
            communicationOverhead: { type: 'string' }
          }
        },
        pipelineParallelismConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            numStages: { type: 'number' },
            microBatchCount: { type: 'number' },
            stagePlacement: { type: 'array', items: { type: 'object' } },
            pipelineSchedule: { type: 'string' },
            bubbleOverhead: { type: 'string' }
          }
        },
        tensorParallelismConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            tensorParallelSize: { type: 'number' },
            layers: { type: 'array', items: { type: 'string' } },
            communicationOverhead: { type: 'string' }
          }
        },
        hybridConfig: {
          type: 'object',
          properties: {
            dataParallelSize: { type: 'number' },
            tensorParallelSize: { type: 'number' },
            pipelineParallelSize: { type: 'number' },
            totalGPUs: { type: 'number' },
            topology: { type: 'string' }
          },
          description: '3D parallelism configuration if hybrid approach'
        },
        expectedScalingEfficiency: {
          type: 'string',
          description: 'Expected scaling efficiency (e.g., 85% at 32 GPUs)'
        },
        communicationPattern: {
          type: 'object',
          properties: {
            allReduceVolume: { type: 'string' },
            pointToPointVolume: { type: 'string' },
            frequency: { type: 'string' },
            overlappable: { type: 'boolean' }
          }
        },
        frameworkRecommendation: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            library: { type: 'string' },
            version: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Alternative strategies considered'
        },
        challenges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Potential challenges with recommended strategy'
        },
        mitigations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Mitigations for identified challenges'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'parallelization', 'strategy']
}));

export const dataDistributionTask = defineTask('data-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Data Distribution and Loading Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering Specialist for distributed training systems',
      task: 'Design data distribution and loading strategy for distributed training',
      context: {
        projectName: args.projectName,
        datasetSize: args.datasetSize,
        parallelizationStrategy: args.parallelizationStrategy,
        resourceAssessment: args.resourceAssessment,
        modelAnalysis: args.modelAnalysis
      },
      instructions: [
        '1. Determine data sharding strategy across workers',
        '2. Design efficient data loading pipeline (prefetching, batching)',
        '3. Optimize data loader workers and buffer sizes',
        '4. Plan data caching and staging strategies',
        '5. Design data shuffling strategy for distributed setting',
        '6. Plan data augmentation distribution (CPU vs GPU)',
        '7. Optimize storage access patterns (sequential vs random)',
        '8. Design data preprocessing and transformation pipeline',
        '9. Plan for data imbalance and straggler mitigation',
        '10. Configure data loader for maximum throughput'
      ],
      outputFormat: 'JSON object with data distribution strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['loadingStrategy', 'shardingConfig', 'workerCount'],
      properties: {
        loadingStrategy: {
          type: 'string',
          description: 'Overall data loading approach'
        },
        shardingConfig: {
          type: 'object',
          properties: {
            shardingMethod: { type: 'string' },
            shardsPerWorker: { type: 'number' },
            shuffling: { type: 'string' },
            samplerType: { type: 'string' }
          }
        },
        workerCount: {
          type: 'number',
          description: 'Number of data loader workers per GPU'
        },
        prefetchConfig: {
          type: 'object',
          properties: {
            prefetchFactor: { type: 'number' },
            bufferSize: { type: 'string' },
            pinMemory: { type: 'boolean' }
          }
        },
        cachingStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            cacheLocation: { type: 'string' },
            cacheSize: { type: 'string' },
            cachePolicy: { type: 'string' }
          }
        },
        storageConfiguration: {
          type: 'object',
          properties: {
            storageType: { type: 'string' },
            mountPoints: { type: 'array', items: { type: 'string' } },
            accessPattern: { type: 'string' },
            optimization: { type: 'string' }
          }
        },
        augmentationStrategy: {
          type: 'object',
          properties: {
            location: { type: 'string', enum: ['cpu', 'gpu', 'mixed'] },
            parallelization: { type: 'string' },
            determinism: { type: 'boolean' }
          }
        },
        preprocessingPipeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              location: { type: 'string' },
              configuration: { type: 'object' }
            }
          }
        },
        imbalanceHandling: {
          type: 'object',
          properties: {
            detectionMethod: { type: 'string' },
            mitigationStrategy: { type: 'string' },
            dynamicAdjustment: { type: 'boolean' }
          }
        },
        throughputOptimization: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optimizations to maximize data loading throughput'
        },
        estimatedThroughput: {
          type: 'string',
          description: 'Expected data loading throughput'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'data-loading', 'data-distribution']
}));

export const communicationOptimizationTask = defineTask('communication-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Communication Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'High-Performance Computing Expert specializing in distributed communication',
      task: 'Optimize communication patterns for distributed training',
      context: {
        projectName: args.projectName,
        parallelizationStrategy: args.parallelizationStrategy,
        modelAnalysis: args.modelAnalysis,
        resourceAssessment: args.resourceAssessment,
        dataStrategy: args.dataStrategy
      },
      instructions: [
        '1. Select optimal communication backend (NCCL, Gloo, MPI)',
        '2. Configure gradient communication compression (if beneficial)',
        '3. Design gradient bucketing and fusion strategies',
        '4. Plan compute-communication overlap opportunities',
        '5. Optimize communication topology based on network architecture',
        '6. Configure bandwidth and latency optimizations',
        '7. Plan for hierarchical communication (intra-node vs inter-node)',
        '8. Design gradient accumulation strategy to reduce communication',
        '9. Evaluate communication-avoiding algorithms where applicable',
        '10. Provide communication tuning parameters'
      ],
      outputFormat: 'JSON object with communication optimization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['backend', 'optimizations'],
      properties: {
        backend: {
          type: 'string',
          description: 'Communication backend (NCCL, Gloo, MPI)'
        },
        backendConfiguration: {
          type: 'object',
          properties: {
            initMethod: { type: 'string' },
            timeout: { type: 'string' },
            environmentVariables: { type: 'object' }
          }
        },
        compressionConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string' },
            compressionRatio: { type: 'string' },
            tradeoffs: { type: 'string' }
          }
        },
        gradientBucketing: {
          type: 'object',
          properties: {
            bucketSizeMB: { type: 'number' },
            strategy: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        computeCommunicationOverlap: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strategy: { type: 'string' },
            expectedBenefit: { type: 'string' }
          }
        },
        topologyOptimization: {
          type: 'object',
          properties: {
            topology: { type: 'string' },
            intraNodeOptimization: { type: 'string' },
            interNodeOptimization: { type: 'string' }
          }
        },
        bandwidthOptimizations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Bandwidth optimization techniques'
        },
        hierarchicalCommunication: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            intraNodeBackend: { type: 'string' },
            interNodeBackend: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              benefit: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        estimatedCommunicationOverhead: {
          type: 'string',
          description: 'Expected percentage of time spent in communication'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'communication', 'optimization']
}));

export const gradientSynchronizationTask = defineTask('gradient-synchronization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Gradient Synchronization Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed ML Systems Engineer',
      task: 'Design gradient synchronization strategy for distributed training',
      context: {
        projectName: args.projectName,
        parallelizationStrategy: args.parallelizationStrategy,
        modelAnalysis: args.modelAnalysis,
        communicationPlan: args.communicationPlan,
        trainingObjective: args.trainingObjective
      },
      instructions: [
        '1. Determine gradient synchronization method (AllReduce, Parameter Server, etc.)',
        '2. Configure AllReduce algorithm (Ring, Tree, Recursive Doubling)',
        '3. Design gradient accumulation steps to reduce communication frequency',
        '4. Plan gradient clipping strategy in distributed setting',
        '5. Configure gradient scaling for mixed precision training',
        '6. Design asynchronous vs synchronous gradient updates',
        '7. Plan for gradient staleness handling (if async)',
        '8. Configure gradient checkpointing integration',
        '9. Design optimizer state synchronization strategy',
        '10. Provide synchronization timing and coordination plan'
      ],
      outputFormat: 'JSON object with gradient synchronization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['synchronizationMethod', 'allReduceStrategy'],
      properties: {
        synchronizationMethod: {
          type: 'string',
          enum: ['synchronous-allreduce', 'asynchronous-parameter-server', 'decentralized-sgd', 'local-sgd'],
          description: 'Primary gradient synchronization method'
        },
        allReduceStrategy: {
          type: 'string',
          description: 'AllReduce algorithm (Ring-AllReduce, Tree-AllReduce, etc.)'
        },
        gradientAccumulationSteps: {
          type: 'number',
          description: 'Number of gradient accumulation steps before synchronization'
        },
        gradientClipping: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string' },
            clipValue: { type: 'number' },
            globalNorm: { type: 'boolean' }
          }
        },
        mixedPrecisionConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            gradientScaling: { type: 'boolean' },
            lossScale: { type: 'string' },
            dynamicScaling: { type: 'boolean' }
          }
        },
        synchronousConfig: {
          type: 'object',
          properties: {
            barrierSynchronization: { type: 'boolean' },
            stragglerHandling: { type: 'string' },
            timeout: { type: 'string' }
          }
        },
        asynchronousConfig: {
          type: 'object',
          properties: {
            staleness: { type: 'string' },
            boundedDelay: { type: 'number' },
            convergenceImpact: { type: 'string' }
          }
        },
        optimizerStateSynchronization: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            frequency: { type: 'string' },
            sharding: { type: 'boolean' }
          }
        },
        synchronizationTiming: {
          type: 'object',
          properties: {
            forwardBackwardOverlap: { type: 'boolean' },
            pipelinedCommunication: { type: 'boolean' },
            estimatedOverhead: { type: 'string' }
          }
        },
        tradeoffs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tradeoffs of chosen synchronization strategy'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'gradient-synchronization', 'optimization']
}));

export const memoryOptimizationTask = defineTask('memory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Memory Optimization and Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GPU Memory Optimization Specialist',
      task: 'Design memory optimization strategy for distributed training',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        modelAnalysis: args.modelAnalysis,
        resourceAssessment: args.resourceAssessment,
        parallelizationStrategy: args.parallelizationStrategy
      },
      instructions: [
        '1. Calculate total memory requirements (model, activations, gradients, optimizer states)',
        '2. Assess if memory fits in available GPU memory',
        '3. Configure activation checkpointing (recomputation strategy)',
        '4. Design gradient checkpointing strategy',
        '5. Configure optimizer state sharding (ZeRO optimization)',
        '6. Plan CPU offloading for optimizer states or activations',
        '7. Configure mixed precision training to reduce memory',
        '8. Design dynamic memory allocation strategy',
        '9. Plan memory-efficient attention mechanisms if applicable',
        '10. Provide memory budget breakdown and optimization recommendations'
      ],
      outputFormat: 'JSON object with memory optimization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredMemory', 'availableMemory', 'memoryExceeded'],
      properties: {
        requiredMemory: {
          type: 'string',
          description: 'Total memory required per GPU'
        },
        availableMemory: {
          type: 'string',
          description: 'Available memory per GPU'
        },
        memoryExceeded: {
          type: 'boolean',
          description: 'Whether memory requirements exceed available memory'
        },
        memoryGap: {
          type: 'string',
          description: 'Memory deficit if exceeded'
        },
        memoryBreakdown: {
          type: 'object',
          properties: {
            modelParameters: { type: 'string' },
            activations: { type: 'string' },
            gradients: { type: 'string' },
            optimizerStates: { type: 'string' },
            buffers: { type: 'string' },
            overhead: { type: 'string' }
          }
        },
        activationCheckpointing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strategy: { type: 'string' },
            checkpointLayers: { type: 'array', items: { type: 'string' } },
            memorySaved: { type: 'string' },
            computeOverhead: { type: 'string' }
          }
        },
        gradientCheckpointing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            segments: { type: 'number' },
            memorySaved: { type: 'string' }
          }
        },
        zeroOptimization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            stage: { type: 'number' },
            optimizerStateSharding: { type: 'boolean' },
            gradientSharding: { type: 'boolean' },
            parameterSharding: { type: 'boolean' },
            memorySaved: { type: 'string' }
          }
        },
        cpuOffloading: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            offloadTargets: { type: 'array', items: { type: 'string' } },
            memorySaved: { type: 'string' },
            performanceImpact: { type: 'string' }
          }
        },
        mixedPrecisionOptimization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            precision: { type: 'string' },
            memorySaved: { type: 'string' },
            accuracyImpact: { type: 'string' }
          }
        },
        efficientAttention: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string' },
            memorySaved: { type: 'string' }
          }
        },
        aggressiveOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              memorySaved: { type: 'string' },
              tradeoff: { type: 'string' }
            }
          },
          description: 'Additional aggressive optimizations if needed'
        },
        tradeoffs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tradeoffs of memory optimizations'
        },
        finalMemoryEstimate: {
          type: 'string',
          description: 'Memory per GPU after all optimizations'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'memory-optimization', 'resource-management']
}));

export const faultToleranceTask = defineTask('fault-tolerance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Fault Tolerance and Checkpointing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed Systems Reliability Engineer',
      task: 'Design fault tolerance and checkpointing strategy for distributed training',
      context: {
        projectName: args.projectName,
        parallelizationStrategy: args.parallelizationStrategy,
        dataStrategy: args.dataStrategy,
        resourceAssessment: args.resourceAssessment,
        trainingObjective: args.trainingObjective,
        targetTrainingTime: args.targetTrainingTime
      },
      instructions: [
        '1. Design checkpointing strategy (frequency, what to save, where to save)',
        '2. Configure checkpoint storage (local, distributed filesystem, object storage)',
        '3. Plan checkpoint rotation and retention policy',
        '4. Design recovery procedures for node failures',
        '5. Configure elastic training for dynamic resource allocation',
        '6. Plan for gradient staleness recovery',
        '7. Design state synchronization for recovery',
        '8. Configure redundancy levels for critical operations',
        '9. Plan for graceful degradation strategies',
        '10. Provide failure detection and automatic recovery configuration'
      ],
      outputFormat: 'JSON object with fault tolerance configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'checkpointFrequency', 'storageLocation'],
      properties: {
        strategy: {
          type: 'string',
          description: 'Overall checkpointing strategy'
        },
        checkpointFrequency: {
          type: 'string',
          description: 'How often to save checkpoints (e.g., every 1000 steps, every 1 hour)'
        },
        checkpointComponents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Components to save (model, optimizer, scheduler, RNG state, etc.)'
        },
        storageLocation: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            backup: { type: 'string' },
            storageType: { type: 'string' }
          }
        },
        checkpointFormat: {
          type: 'string',
          description: 'Checkpoint serialization format'
        },
        rotationPolicy: {
          type: 'object',
          properties: {
            keepLatest: { type: 'number' },
            keepBest: { type: 'number' },
            retentionPeriod: { type: 'string' }
          }
        },
        recoveryPlan: {
          type: 'object',
          properties: {
            automaticRecovery: { type: 'boolean' },
            recoveryProcedure: { type: 'string' },
            maxRecoveryAttempts: { type: 'number' },
            fallbackStrategy: { type: 'string' }
          }
        },
        elasticConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            minNodes: { type: 'number' },
            maxNodes: { type: 'number' },
            scaleUpTrigger: { type: 'string' },
            scaleDownTrigger: { type: 'string' }
          }
        },
        failureDetection: {
          type: 'object',
          properties: {
            healthCheckInterval: { type: 'string' },
            timeoutThreshold: { type: 'string' },
            detectionMechanism: { type: 'string' }
          }
        },
        redundancy: {
          type: 'string',
          description: 'Redundancy level for critical operations'
        },
        gracefulDegradation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              strategy: { type: 'string' }
            }
          }
        },
        estimatedRecoveryTime: {
          type: 'string',
          description: 'Expected time to recover from failure'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'fault-tolerance', 'checkpointing']
}));

export const monitoringPlanTask = defineTask('monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Performance Monitoring and Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Performance Engineer',
      task: 'Design monitoring and profiling strategy for distributed training',
      context: {
        projectName: args.projectName,
        parallelizationStrategy: args.parallelizationStrategy,
        resourceAssessment: args.resourceAssessment,
        communicationPlan: args.communicationPlan,
        gradientSyncStrategy: args.gradientSyncStrategy,
        faultToleranceConfig: args.faultToleranceConfig
      },
      instructions: [
        '1. Define key performance metrics (throughput, GPU utilization, communication overhead)',
        '2. Configure system monitoring (CPU, GPU, memory, network, disk)',
        '3. Design distributed training metrics (gradient norms, loss, learning rate)',
        '4. Configure profiling tools (NVIDIA Nsight, PyTorch Profiler, TensorBoard)',
        '5. Plan for bottleneck detection and diagnosis',
        '6. Design alerting rules for anomalies and failures',
        '7. Configure logging strategy (what to log, where to aggregate)',
        '8. Plan for distributed trace analysis',
        '9. Design dashboards for real-time monitoring',
        '10. Provide performance baseline and targets'
      ],
      outputFormat: 'JSON object with monitoring and profiling plan'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'alertingRules'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              type: { type: 'string' },
              target: { type: 'string' },
              collectionFrequency: { type: 'string' }
            }
          },
          description: 'Metrics to monitor'
        },
        systemMonitoring: {
          type: 'object',
          properties: {
            gpuMetrics: { type: 'array', items: { type: 'string' } },
            cpuMetrics: { type: 'array', items: { type: 'string' } },
            memoryMetrics: { type: 'array', items: { type: 'string' } },
            networkMetrics: { type: 'array', items: { type: 'string' } },
            diskMetrics: { type: 'array', items: { type: 'string' } }
          }
        },
        trainingMetrics: {
          type: 'object',
          properties: {
            lossMetrics: { type: 'array', items: { type: 'string' } },
            gradientMetrics: { type: 'array', items: { type: 'string' } },
            learningRateMetrics: { type: 'array', items: { type: 'string' } },
            throughputMetrics: { type: 'array', items: { type: 'string' } }
          }
        },
        profilingConfig: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            profilingFrequency: { type: 'string' },
            profilingDuration: { type: 'string' },
            profileComponents: { type: 'array', items: { type: 'string' } }
          }
        },
        alertingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              action: { type: 'string' }
            }
          }
        },
        loggingStrategy: {
          type: 'object',
          properties: {
            logLevel: { type: 'string' },
            logFormat: { type: 'string' },
            aggregationMethod: { type: 'string' },
            logRetention: { type: 'string' }
          }
        },
        dashboardLinks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Links to monitoring dashboards'
        },
        performanceBaselines: {
          type: 'object',
          properties: {
            expectedThroughput: { type: 'string' },
            expectedGPUUtilization: { type: 'string' },
            expectedCommunicationOverhead: { type: 'string' }
          }
        },
        bottleneckDetection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bottleneck: { type: 'string' },
              symptom: { type: 'string' },
              diagnosis: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'monitoring', 'profiling']
}));

export const trainingConfigurationTask = defineTask('training-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Training Configuration Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineering Specialist',
      task: 'Generate complete training configuration for distributed training',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        parallelizationStrategy: args.parallelizationStrategy,
        dataStrategy: args.dataStrategy,
        communicationPlan: args.communicationPlan,
        gradientSyncStrategy: args.gradientSyncStrategy,
        memoryOptimization: args.memoryOptimization,
        faultToleranceConfig: args.faultToleranceConfig,
        resourceAssessment: args.resourceAssessment
      },
      instructions: [
        '1. Generate framework-specific configuration (PyTorch, TensorFlow, JAX)',
        '2. Configure distributed backend initialization',
        '3. Generate model wrapping configuration (DDP, FSDP, DeepSpeed)',
        '4. Configure data loader settings',
        '5. Generate optimizer configuration for distributed setting',
        '6. Configure learning rate scheduler',
        '7. Generate training loop configuration',
        '8. Configure mixed precision training settings',
        '9. Estimate training duration based on throughput',
        '10. Provide complete configuration files'
      ],
      outputFormat: 'JSON object with training configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'estimatedDuration', 'configFiles'],
      properties: {
        framework: {
          type: 'string',
          description: 'ML framework (PyTorch, TensorFlow, JAX)'
        },
        frameworkVersion: {
          type: 'string',
          description: 'Recommended framework version'
        },
        distributedBackendInit: {
          type: 'object',
          properties: {
            backend: { type: 'string' },
            initMethod: { type: 'string' },
            worldSize: { type: 'number' },
            rank: { type: 'string' }
          }
        },
        modelWrapping: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            configuration: { type: 'object' }
          }
        },
        dataLoaderConfig: {
          type: 'object',
          properties: {
            batchSize: { type: 'number' },
            numWorkers: { type: 'number' },
            pinMemory: { type: 'boolean' },
            prefetchFactor: { type: 'number' },
            sampler: { type: 'string' }
          }
        },
        optimizerConfig: {
          type: 'object',
          properties: {
            optimizer: { type: 'string' },
            learningRate: { type: 'number' },
            parameters: { type: 'object' },
            zeroOptimization: { type: 'object' }
          }
        },
        schedulerConfig: {
          type: 'object',
          properties: {
            scheduler: { type: 'string' },
            parameters: { type: 'object' }
          }
        },
        trainingLoopConfig: {
          type: 'object',
          properties: {
            maxSteps: { type: 'number' },
            gradientAccumulation: { type: 'number' },
            loggingInterval: { type: 'number' },
            evaluationInterval: { type: 'number' },
            checkpointInterval: { type: 'number' }
          }
        },
        mixedPrecisionConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            dtype: { type: 'string' },
            gradScaler: { type: 'object' }
          }
        },
        estimatedDuration: {
          type: 'string',
          description: 'Estimated training duration'
        },
        estimatedThroughput: {
          type: 'string',
          description: 'Expected samples per second'
        },
        configFiles: {
          type: 'object',
          properties: {
            mainConfig: { type: 'string' },
            distributedConfig: { type: 'string' },
            dataConfig: { type: 'string' }
          },
          description: 'Generated configuration files'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'configuration', 'setup']
}));

export const distributedHyperparametersTask = defineTask('distributed-hyperparameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Hyperparameter Tuning for Distributed Setting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Scientist specializing in distributed training optimization',
      task: 'Tune hyperparameters for distributed training setting',
      context: {
        projectName: args.projectName,
        trainingObjective: args.trainingObjective,
        parallelizationStrategy: args.parallelizationStrategy,
        modelAnalysis: args.modelAnalysis,
        resourceAssessment: args.resourceAssessment,
        trainingConfig: args.trainingConfig
      },
      instructions: [
        '1. Calculate effective batch size (micro batch size × gradient accumulation × num GPUs)',
        '2. Apply learning rate scaling rules (linear scaling, sqrt scaling)',
        '3. Configure warmup strategy for large batch training',
        '4. Tune momentum and beta parameters for distributed optimization',
        '5. Configure weight decay for distributed setting',
        '6. Adjust gradient clipping thresholds',
        '7. Configure learning rate scheduler for distributed training',
        '8. Plan hyperparameter search strategy if needed',
        '9. Provide scaling guidelines for different worker counts',
        '10. Document hyperparameter rationale and references'
      ],
      outputFormat: 'JSON object with distributed hyperparameters'
    },
    outputSchema: {
      type: 'object',
      required: ['globalBatchSize', 'microBatchSize', 'learningRate', 'optimizer'],
      properties: {
        globalBatchSize: {
          type: 'number',
          description: 'Total effective batch size across all GPUs'
        },
        microBatchSize: {
          type: 'number',
          description: 'Batch size per GPU per gradient accumulation step'
        },
        gradientAccumulationSteps: {
          type: 'number',
          description: 'Number of micro-batches before gradient sync'
        },
        learningRate: {
          type: 'number',
          description: 'Base learning rate'
        },
        learningRateScaling: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            baselineBatchSize: { type: 'number' },
            scaledLearningRate: { type: 'number' },
            rationale: { type: 'string' }
          }
        },
        warmupConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            warmupSteps: { type: 'number' },
            warmupMethod: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        optimizer: {
          type: 'string',
          description: 'Optimizer choice'
        },
        optimizerParameters: {
          type: 'object',
          properties: {
            momentum: { type: 'number' },
            beta1: { type: 'number' },
            beta2: { type: 'number' },
            epsilon: { type: 'number' },
            weightDecay: { type: 'number' }
          }
        },
        gradientClipping: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxNorm: { type: 'number' },
            normType: { type: 'number' }
          }
        },
        schedulerConfig: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            parameters: { type: 'object' }
          }
        },
        scalingGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              numGPUs: { type: 'number' },
              recommendedBatchSize: { type: 'number' },
              recommendedLearningRate: { type: 'number' }
            }
          },
          description: 'Recommendations for different scales'
        },
        hyperparameterSearchStrategy: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            method: { type: 'string' },
            searchSpace: { type: 'object' }
          }
        },
        references: {
          type: 'array',
          items: { type: 'string' },
          description: 'Research papers and best practices referenced'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'hyperparameters', 'optimization']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Performance Optimization and Tuning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Engineer',
      task: 'Identify and apply performance optimizations for distributed training',
      context: {
        projectName: args.projectName,
        parallelizationStrategy: args.parallelizationStrategy,
        communicationPlan: args.communicationPlan,
        memoryOptimization: args.memoryOptimization,
        trainingConfig: args.trainingConfig,
        resourceAssessment: args.resourceAssessment
      },
      instructions: [
        '1. Configure kernel fusion and operator optimization',
        '2. Enable mixed precision training (FP16, BF16, FP8)',
        '3. Configure gradient accumulation for throughput improvement',
        '4. Enable computation-communication overlap',
        '5. Apply compiler optimizations (TorchScript, XLA, TensorRT)',
        '6. Configure efficient attention mechanisms (Flash Attention, Memory-Efficient Attention)',
        '7. Enable tensor cores and specialized hardware features',
        '8. Configure cudnn benchmarking and autotuning',
        '9. Estimate performance speedup from optimizations',
        '10. Provide optimization checklist and verification steps'
      ],
      outputFormat: 'JSON object with performance optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['appliedOptimizations', 'expectedSpeedup'],
      properties: {
        appliedOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              benefit: { type: 'string' },
              configuration: { type: 'object' }
            }
          }
        },
        kernelFusion: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string' },
            expectedSpeedup: { type: 'string' }
          }
        },
        mixedPrecisionConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            dtype: { type: 'string' },
            autocast: { type: 'boolean' },
            expectedSpeedup: { type: 'string' }
          }
        },
        gradientAccumulation: {
          type: 'object',
          properties: {
            steps: { type: 'number' },
            benefit: { type: 'string' }
          }
        },
        computeCommOverlap: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strategy: { type: 'string' },
            expectedBenefit: { type: 'string' }
          }
        },
        compilerOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              compiler: { type: 'string' },
              enabled: { type: 'boolean' },
              optimizationLevel: { type: 'string' }
            }
          }
        },
        efficientAttention: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string' },
            expectedSpeedup: { type: 'string' }
          }
        },
        hardwareOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              enabled: { type: 'boolean' },
              benefit: { type: 'string' }
            }
          }
        },
        cudnnConfig: {
          type: 'object',
          properties: {
            benchmark: { type: 'boolean' },
            deterministic: { type: 'boolean' },
            allowTF32: { type: 'boolean' }
          }
        },
        expectedSpeedup: {
          type: 'string',
          description: 'Expected overall speedup from all optimizations'
        },
        optimizationChecklist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checklist of optimizations to verify'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'performance', 'optimization']
}));

export const launchOrchestrationTask = defineTask('launch-orchestration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Launch Script and Orchestration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in distributed ML systems',
      task: 'Generate launch scripts and orchestration configuration',
      context: {
        projectName: args.projectName,
        trainingConfig: args.trainingConfig,
        resourceAssessment: args.resourceAssessment,
        parallelizationStrategy: args.parallelizationStrategy,
        faultToleranceConfig: args.faultToleranceConfig,
        monitoringPlan: args.monitoringPlan
      },
      instructions: [
        '1. Generate launch script for distributed training (torchrun, mpirun, etc.)',
        '2. Configure environment variables for distributed backend',
        '3. Generate node configuration and setup scripts',
        '4. Configure SLURM/Kubernetes job specifications if applicable',
        '5. Generate hostfile or machine configuration',
        '6. Configure SSH/network settings for multi-node training',
        '7. Generate monitoring and logging setup scripts',
        '8. Create validation and smoke test scripts',
        '9. Generate troubleshooting and debugging scripts',
        '10. Provide step-by-step launch instructions'
      ],
      outputFormat: 'JSON object with launch configuration and scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['launchScript', 'environmentConfig'],
      properties: {
        launchScript: {
          type: 'string',
          description: 'Complete launch script for distributed training'
        },
        launchMethod: {
          type: 'string',
          description: 'Launch method (torchrun, torch.distributed.launch, mpirun, etc.)'
        },
        environmentConfig: {
          type: 'object',
          properties: {
            environmentVariables: { type: 'object' },
            pythonPath: { type: 'string' },
            libraryPath: { type: 'string' }
          }
        },
        nodeSetup: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              setupCommands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        jobSpecification: {
          type: 'object',
          properties: {
            orchestrator: { type: 'string' },
            jobConfig: { type: 'string' }
          },
          description: 'SLURM/Kubernetes job specification'
        },
        hostfileConfig: {
          type: 'string',
          description: 'Hostfile or machine list configuration'
        },
        networkConfig: {
          type: 'object',
          properties: {
            masterAddress: { type: 'string' },
            masterPort: { type: 'number' },
            networkInterface: { type: 'string' }
          }
        },
        commandArgs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command line arguments for training script'
        },
        validationScript: {
          type: 'string',
          description: 'Pre-launch validation script'
        },
        debuggingScript: {
          type: 'string',
          description: 'Script for debugging distributed training issues'
        },
        backendConfig: {
          type: 'object',
          properties: {
            backend: { type: 'string' },
            initMethod: { type: 'string' },
            timeout: { type: 'string' }
          }
        },
        launchInstructions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step instructions to launch training'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'orchestration', 'deployment']
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Cost Estimation and Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Cost Optimization Specialist',
      task: 'Estimate training costs and identify cost optimization opportunities',
      context: {
        projectName: args.projectName,
        resourceAssessment: args.resourceAssessment,
        trainingConfig: args.trainingConfig,
        targetTrainingTime: args.targetTrainingTime,
        budgetLimit: args.budgetLimit,
        performanceOptimizations: args.performanceOptimizations
      },
      instructions: [
        '1. Calculate compute costs (GPU hours × hourly rate)',
        '2. Calculate storage costs (data storage + checkpoints)',
        '3. Calculate network costs (data transfer, inter-region)',
        '4. Estimate total training cost with breakdown',
        '5. Identify cost optimization opportunities (spot instances, preemptible VMs)',
        '6. Evaluate cost vs time tradeoffs',
        '7. Compare cloud provider pricing options',
        '8. Calculate cost per epoch and cost per model checkpoint',
        '9. Estimate cost for hyperparameter search if planned',
        '10. Provide cost reduction recommendations'
      ],
      outputFormat: 'JSON object with cost analysis and optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedCost', 'breakdown'],
      properties: {
        estimatedCost: {
          type: 'number',
          description: 'Total estimated cost for training'
        },
        breakdown: {
          type: 'object',
          properties: {
            computeCost: { type: 'number' },
            storageCost: { type: 'number' },
            networkCost: { type: 'number' },
            otherCosts: { type: 'number' }
          }
        },
        computeDetails: {
          type: 'object',
          properties: {
            gpuHours: { type: 'number' },
            hourlyRate: { type: 'number' },
            instanceType: { type: 'string' },
            provider: { type: 'string' }
          }
        },
        storageDetails: {
          type: 'object',
          properties: {
            dataStorageCost: { type: 'number' },
            checkpointStorageCost: { type: 'number' },
            storageSize: { type: 'string' }
          }
        },
        costPerEpoch: {
          type: 'number',
          description: 'Estimated cost per training epoch'
        },
        costPerCheckpoint: {
          type: 'number',
          description: 'Estimated cost per saved checkpoint'
        },
        appliedOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              costSaving: { type: 'number' },
              tradeoff: { type: 'string' }
            }
          }
        },
        savingOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              potentialSaving: { type: 'string' },
              implementation: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        },
        costVsTimeTradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              configuration: { type: 'string' },
              cost: { type: 'number' },
              duration: { type: 'string' },
              efficiency: { type: 'string' }
            }
          }
        },
        providerComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              configuration: { type: 'string' },
              estimatedCost: { type: 'number' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Cost optimization recommendations'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'cost-estimation', 'optimization']
}));

export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Testing and Validation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Test Engineer',
      task: 'Design testing and validation plan for distributed training',
      context: {
        projectName: args.projectName,
        trainingConfig: args.trainingConfig,
        parallelizationStrategy: args.parallelizationStrategy,
        dataStrategy: args.dataStrategy,
        faultToleranceConfig: args.faultToleranceConfig,
        resourceAssessment: args.resourceAssessment
      },
      instructions: [
        '1. Design pre-training validation tests (configuration, connectivity, data access)',
        '2. Plan smoke tests on small dataset to validate setup',
        '3. Design runtime validation checks (convergence, performance, correctness)',
        '4. Plan reproducibility tests (determinism, checkpoint recovery)',
        '5. Design scaling tests (weak scaling, strong scaling)',
        '6. Plan fault injection tests (node failure, network issues)',
        '7. Design performance baseline validation',
        '8. Plan gradient correctness validation across workers',
        '9. Design troubleshooting procedures for common issues',
        '10. Provide validation checklist and success criteria'
      ],
      outputFormat: 'JSON object with testing and validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['preTrainingValidations', 'runtimeValidations'],
      properties: {
        preTrainingValidations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              validation: { type: 'string' },
              testProcedure: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          },
          description: 'Validations before launching training'
        },
        smokeTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              dataset: { type: 'string' },
              duration: { type: 'string' },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        runtimeValidations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              validation: { type: 'string' },
              checkFrequency: { type: 'string' },
              alertCondition: { type: 'string' }
            }
          }
        },
        reproducibilityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              methodology: { type: 'string' },
              acceptableVariance: { type: 'string' }
            }
          }
        },
        scalingTests: {
          type: 'object',
          properties: {
            weakScaling: {
              type: 'object',
              properties: {
                testPlan: { type: 'string' },
                gpuCounts: { type: 'array', items: { type: 'number' } },
                expectedBehavior: { type: 'string' }
              }
            },
            strongScaling: {
              type: 'object',
              properties: {
                testPlan: { type: 'string' },
                gpuCounts: { type: 'array', items: { type: 'number' } },
                expectedEfficiency: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        faultInjectionTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              testProcedure: { type: 'string' },
              expectedRecovery: { type: 'string' }
            }
          }
        },
        performanceBaselines: {
          type: 'object',
          properties: {
            throughputBaseline: { type: 'string' },
            gpuUtilizationBaseline: { type: 'string' },
            validationThreshold: { type: 'string' }
          }
        },
        gradientCorrectnessValidation: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            comparisonBaseline: { type: 'string' },
            tolerance: { type: 'string' }
          }
        },
        troubleshootingGuide: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              diagnosis: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        validationChecklist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Comprehensive validation checklist'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'validation', 'testing']
}));

export const trainingPlanDocumentationTask = defineTask('training-plan-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Training Plan Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist for ML Systems',
      task: 'Generate comprehensive distributed training plan documentation',
      context: {
        projectName: args.projectName,
        modelArchitecture: args.modelArchitecture,
        trainingObjective: args.trainingObjective,
        resourceAssessment: args.resourceAssessment,
        modelAnalysis: args.modelAnalysis,
        parallelizationStrategy: args.parallelizationStrategy,
        dataStrategy: args.dataStrategy,
        communicationPlan: args.communicationPlan,
        gradientSyncStrategy: args.gradientSyncStrategy,
        memoryOptimization: args.memoryOptimization,
        faultToleranceConfig: args.faultToleranceConfig,
        monitoringPlan: args.monitoringPlan,
        trainingConfig: args.trainingConfig,
        hyperparameterConfig: args.hyperparameterConfig,
        performanceOptimizations: args.performanceOptimizations,
        launchConfig: args.launchConfig,
        costAnalysis: args.costAnalysis,
        validationPlan: args.validationPlan
      },
      instructions: [
        '1. Create executive summary of distributed training plan',
        '2. Document model architecture and resource requirements',
        '3. Summarize parallelization strategy and configuration',
        '4. Document data distribution and loading strategy',
        '5. Describe communication and synchronization approach',
        '6. Document memory optimization techniques',
        '7. Summarize fault tolerance and checkpointing strategy',
        '8. Document monitoring and profiling plan',
        '9. Provide training configuration and hyperparameters',
        '10. Document performance optimizations and expected speedup',
        '11. Include launch instructions and troubleshooting guide',
        '12. Generate both JSON (machine-readable) and Markdown (human-readable) formats'
      ],
      outputFormat: 'JSON object with complete documentation in multiple formats'
    },
    outputSchema: {
      type: 'object',
      required: ['json', 'markdown', 'nextSteps'],
      properties: {
        json: {
          type: 'object',
          description: 'Complete distributed training plan in structured JSON'
        },
        markdown: {
          type: 'string',
          description: 'Human-readable distributed training plan in Markdown'
        },
        executiveSummary: {
          type: 'string',
          description: 'High-level summary for stakeholders'
        },
        quickReference: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            totalGPUs: { type: 'number' },
            estimatedDuration: { type: 'string' },
            estimatedCost: { type: 'string' },
            framework: { type: 'string' }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' }
            }
          }
        },
        references: {
          type: 'array',
          items: { type: 'string' },
          description: 'References to documentation, papers, and resources'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['distributed-training', 'documentation', 'planning']
}));
