/**
 * @process specializations/gpu-programming/gpu-cluster-computing
 * @description GPU Cluster Computing - Process for scaling GPU workloads across distributed clusters
 * using MPI, NCCL, and GPU-Direct technologies.
 * @inputs { projectName: string, numNodes: number, gpusPerNode: number, communicationLib?: string, outputDir?: string }
 * @outputs { success: boolean, clusterArchitecture: object, mpiIntegration: object, scalingAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-cluster-computing', {
 *   projectName: 'distributed_training',
 *   numNodes: 8,
 *   gpusPerNode: 4,
 *   communicationLib: 'nccl'
 * });
 *
 * @references
 * - NCCL Documentation: https://docs.nvidia.com/deeplearning/nccl/
 * - GPU-Direct: https://developer.nvidia.com/gpudirect
 * - MPI with CUDA: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    numNodes,
    gpusPerNode,
    communicationLib = 'nccl',
    useGpuDirect = true,
    outputDir = 'cluster-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const totalGpus = numNodes * gpusPerNode;

  ctx.log('info', `Starting GPU Cluster Computing: ${projectName}`);
  ctx.log('info', `Nodes: ${numNodes}, GPUs/Node: ${gpusPerNode}, Total GPUs: ${totalGpus}`);

  // Phase 1: Cluster Architecture Design
  const clusterDesign = await ctx.task(clusterArchitectureTask, {
    projectName, numNodes, gpusPerNode, communicationLib, outputDir
  });
  artifacts.push(...clusterDesign.artifacts);

  // Phase 2: MPI Configuration
  const mpiConfig = await ctx.task(mpiConfigurationTask, {
    projectName, numNodes, gpusPerNode, outputDir
  });
  artifacts.push(...mpiConfig.artifacts);

  // Phase 3: GPU-Direct Setup
  let gpuDirectSetup = null;
  if (useGpuDirect) {
    gpuDirectSetup = await ctx.task(gpuDirectSetupTask, {
      projectName, clusterDesign, outputDir
    });
    artifacts.push(...gpuDirectSetup.artifacts);
  }

  // Phase 4: Distributed Workload Partitioning
  const workloadPartitioning = await ctx.task(distributedWorkloadTask, {
    projectName, numNodes, gpusPerNode, clusterDesign, outputDir
  });
  artifacts.push(...workloadPartitioning.artifacts);

  // Phase 5: Collective Communications
  const collectiveComms = await ctx.task(collectiveCommunicationsTask, {
    projectName, communicationLib, totalGpus, outputDir
  });
  artifacts.push(...collectiveComms.artifacts);

  // Phase 6: Fault Tolerance
  const faultTolerance = await ctx.task(faultToleranceTask, {
    projectName, numNodes, outputDir
  });
  artifacts.push(...faultTolerance.artifacts);

  // Phase 7: Scaling Benchmark
  const scalingBenchmark = await ctx.task(clusterScalingBenchmarkTask, {
    projectName, numNodes, gpusPerNode, outputDir
  });
  artifacts.push(...scalingBenchmark.artifacts);

  await ctx.breakpoint({
    question: `GPU cluster implementation complete for ${projectName}. Scaling efficiency: ${scalingBenchmark.scalingEfficiency}%. Review?`,
    title: 'Cluster Computing Complete',
    context: { runId: ctx.runId, scalingBenchmark }
  });

  return {
    success: scalingBenchmark.scalingEfficiency >= 70,
    projectName,
    clusterArchitecture: {
      numNodes,
      gpusPerNode,
      totalGpus,
      topology: clusterDesign.topology,
      communicationLib
    },
    mpiIntegration: {
      configuration: mpiConfig.configuration,
      gpuAwareness: mpiConfig.gpuAware,
      launchCommand: mpiConfig.launchCommand
    },
    scalingAnalysis: {
      efficiency: scalingBenchmark.scalingEfficiency,
      strongScaling: scalingBenchmark.strongScaling,
      weakScaling: scalingBenchmark.weakScaling,
      bottlenecks: scalingBenchmark.bottlenecks
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-cluster-computing',
      timestamp: startTime,
      outputDir
    }
  };
}

export const clusterArchitectureTask = defineTask('cluster-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cluster Architecture - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Design GPU cluster architecture',
      context: args,
      instructions: [
        '1. Design node topology',
        '2. Plan GPU placement',
        '3. Design network fabric',
        '4. Plan NVLink/NVSwitch usage',
        '5. Design InfiniBand layout',
        '6. Plan storage architecture',
        '7. Design job scheduling',
        '8. Document architecture',
        '9. Create deployment guide',
        '10. Plan capacity scaling'
      ],
      outputFormat: 'JSON with cluster architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['topology', 'networkDesign', 'artifacts'],
      properties: {
        topology: { type: 'object' },
        networkDesign: { type: 'object' },
        storageDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'architecture']
}));

export const mpiConfigurationTask = defineTask('mpi-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `MPI Configuration - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Configure MPI for GPU cluster',
      context: args,
      instructions: [
        '1. Configure GPU-aware MPI',
        '2. Set process-to-GPU affinity',
        '3. Configure UCX for RDMA',
        '4. Set MPI environment variables',
        '5. Configure rank mapping',
        '6. Set up hostfiles',
        '7. Configure CUDA-aware MPI',
        '8. Test MPI+CUDA communication',
        '9. Document MPI configuration',
        '10. Create launch scripts'
      ],
      outputFormat: 'JSON with MPI configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'gpuAware', 'launchCommand', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        gpuAware: { type: 'boolean' },
        launchCommand: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'mpi']
}));

export const gpuDirectSetupTask = defineTask('gpu-direct-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `GPU-Direct Setup - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Configure GPU-Direct RDMA',
      context: args,
      instructions: [
        '1. Verify GPU-Direct support',
        '2. Install nvidia-peermem',
        '3. Configure InfiniBand for GDR',
        '4. Test GPU-Direct functionality',
        '5. Benchmark GDR bandwidth',
        '6. Configure NVLink if available',
        '7. Enable GPUDirect Storage if needed',
        '8. Document GDR setup',
        '9. Troubleshoot connectivity',
        '10. Optimize for latency'
      ],
      outputFormat: 'JSON with GPU-Direct setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'bandwidth', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        bandwidth: { type: 'object' },
        latency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'gpu-direct']
}));

export const distributedWorkloadTask = defineTask('distributed-workload', (args, taskCtx) => ({
  kind: 'agent',
  title: `Workload Partitioning - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Design distributed workload partitioning',
      context: args,
      instructions: [
        '1. Analyze workload characteristics',
        '2. Design data partitioning',
        '3. Implement domain decomposition',
        '4. Balance load across nodes',
        '5. Minimize communication',
        '6. Handle boundary exchanges',
        '7. Implement checkpointing',
        '8. Design restart capability',
        '9. Document partitioning',
        '10. Test scalability'
      ],
      outputFormat: 'JSON with workload partitioning'
    },
    outputSchema: {
      type: 'object',
      required: ['partitioningStrategy', 'loadBalance', 'artifacts'],
      properties: {
        partitioningStrategy: { type: 'object' },
        loadBalance: { type: 'object' },
        communicationPattern: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'workload']
}));

export const collectiveCommunicationsTask = defineTask('collective-communications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collective Communications - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Implement collective communications',
      context: args,
      instructions: [
        '1. Initialize NCCL communicators',
        '2. Implement all-reduce',
        '3. Implement broadcast',
        '4. Implement all-gather',
        '5. Implement reduce-scatter',
        '6. Optimize for topology',
        '7. Handle multiple communicators',
        '8. Profile collective performance',
        '9. Tune algorithms',
        '10. Document collective usage'
      ],
      outputFormat: 'JSON with collective communications'
    },
    outputSchema: {
      type: 'object',
      required: ['collectives', 'performance', 'artifacts'],
      properties: {
        collectives: { type: 'array', items: { type: 'object' } },
        performance: { type: 'object' },
        algorithms: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'collectives']
}));

export const faultToleranceTask = defineTask('fault-tolerance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fault Tolerance - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Implement fault tolerance',
      context: args,
      instructions: [
        '1. Design checkpoint strategy',
        '2. Implement state serialization',
        '3. Use distributed checkpointing',
        '4. Handle node failures',
        '5. Implement graceful degradation',
        '6. Design recovery mechanism',
        '7. Test fault scenarios',
        '8. Monitor cluster health',
        '9. Document recovery procedures',
        '10. Automate failover'
      ],
      outputFormat: 'JSON with fault tolerance'
    },
    outputSchema: {
      type: 'object',
      required: ['checkpointStrategy', 'recoveryMechanism', 'artifacts'],
      properties: {
        checkpointStrategy: { type: 'object' },
        recoveryMechanism: { type: 'object' },
        mtbf: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'fault-tolerance']
}));

export const clusterScalingBenchmarkTask = defineTask('cluster-scaling-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scaling Benchmark - ${args.projectName}`,
  agent: {
    name: 'hpc-domain-expert',
    skills: ['nccl-communication', 'gpu-direct-rdma'],
    prompt: {
      role: 'HPC Engineer',
      task: 'Benchmark cluster scaling',
      context: args,
      instructions: [
        '1. Run single-node baseline',
        '2. Test strong scaling',
        '3. Test weak scaling',
        '4. Measure communication overhead',
        '5. Profile load imbalance',
        '6. Identify bottlenecks',
        '7. Calculate scaling efficiency',
        '8. Compare to ideal scaling',
        '9. Create scaling charts',
        '10. Document benchmark results'
      ],
      outputFormat: 'JSON with scaling benchmark'
    },
    outputSchema: {
      type: 'object',
      required: ['scalingEfficiency', 'strongScaling', 'weakScaling', 'bottlenecks', 'artifacts'],
      properties: {
        scalingEfficiency: { type: 'number' },
        strongScaling: { type: 'object' },
        weakScaling: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cluster', 'benchmark']
}));
