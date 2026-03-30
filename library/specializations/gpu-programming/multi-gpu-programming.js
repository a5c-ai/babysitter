/**
 * @process specializations/gpu-programming/multi-gpu-programming
 * @description Multi-GPU Programming - Process for scaling applications across multiple GPUs within a single node
 * or across multiple nodes. Covers workload distribution, inter-GPU communication, and synchronization.
 * @inputs { projectName: string, numGpus: number, communicationPattern?: string, scalingStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, multiGpuArchitecture: object, communicationCode: object, scalingAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/multi-gpu-programming', {
 *   projectName: 'distributed_training',
 *   numGpus: 4,
 *   communicationPattern: 'all-reduce',
 *   scalingStrategy: 'data-parallel'
 * });
 *
 * @references
 * - NCCL Documentation: https://docs.nvidia.com/deeplearning/nccl/
 * - Multi-GPU Programming Guide: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    numGpus,
    communicationPattern = 'all-reduce',
    scalingStrategy = 'data-parallel',
    useNccl = true,
    outputDir = 'multi-gpu-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-GPU Programming: ${projectName}`);
  ctx.log('info', `GPUs: ${numGpus}, Pattern: ${communicationPattern}, Strategy: ${scalingStrategy}`);

  // Phase 1: GPU Topology Discovery
  const topologyDiscovery = await ctx.task(topologyDiscoveryTask, {
    projectName, numGpus, outputDir
  });
  artifacts.push(...topologyDiscovery.artifacts);

  // Phase 2: Workload Partitioning
  const workloadPartitioning = await ctx.task(workloadPartitioningTask, {
    projectName, numGpus, scalingStrategy, topologyDiscovery, outputDir
  });
  artifacts.push(...workloadPartitioning.artifacts);

  // Phase 3: Peer-to-Peer Communication
  const p2pCommunication = await ctx.task(p2pCommunicationTask, {
    projectName, topologyDiscovery, workloadPartitioning, outputDir
  });
  artifacts.push(...p2pCommunication.artifacts);

  // Phase 4: NCCL Integration
  let ncclIntegration = null;
  if (useNccl) {
    ncclIntegration = await ctx.task(ncclIntegrationTask, {
      projectName, numGpus, communicationPattern, outputDir
    });
    artifacts.push(...ncclIntegration.artifacts);
  }

  // Phase 5: Stream Management
  const streamManagement = await ctx.task(multiGpuStreamManagementTask, {
    projectName, numGpus, workloadPartitioning, outputDir
  });
  artifacts.push(...streamManagement.artifacts);

  // Phase 6: Synchronization
  const synchronization = await ctx.task(multiGpuSynchronizationTask, {
    projectName, numGpus, streamManagement, ncclIntegration, outputDir
  });
  artifacts.push(...synchronization.artifacts);

  // Phase 7: Scaling Analysis
  const scalingAnalysis = await ctx.task(scalingAnalysisTask, {
    projectName, numGpus, workloadPartitioning, outputDir
  });
  artifacts.push(...scalingAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Multi-GPU implementation complete for ${projectName}. Scaling efficiency: ${scalingAnalysis.efficiency}%. Review?`,
    title: 'Multi-GPU Programming Complete',
    context: { runId: ctx.runId, scalingAnalysis }
  });

  return {
    success: scalingAnalysis.efficiency >= 70,
    projectName,
    multiGpuArchitecture: {
      topology: topologyDiscovery.topology,
      partitioning: workloadPartitioning.strategy,
      p2pSupport: p2pCommunication.supported
    },
    communicationCode: {
      ncclOps: ncclIntegration?.operations,
      p2pTransfers: p2pCommunication.transferCode,
      syncMechanisms: synchronization.mechanisms
    },
    scalingAnalysis: {
      efficiency: scalingAnalysis.efficiency,
      speedup: scalingAnalysis.speedup,
      bottlenecks: scalingAnalysis.bottlenecks
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/multi-gpu-programming',
      timestamp: startTime,
      outputDir
    }
  };
}

export const topologyDiscoveryTask = defineTask('topology-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Topology Discovery - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Discover GPU topology',
      context: args,
      instructions: [
        '1. Enumerate available GPUs',
        '2. Query device properties',
        '3. Check peer access capability',
        '4. Identify NVLink connections',
        '5. Determine PCIe topology',
        '6. Map GPU to NUMA nodes',
        '7. Check unified memory support',
        '8. Determine optimal GPU groupings',
        '9. Create topology visualization',
        '10. Document topology findings'
      ],
      outputFormat: 'JSON with topology discovery results'
    },
    outputSchema: {
      type: 'object',
      required: ['topology', 'peerAccess', 'artifacts'],
      properties: {
        topology: { type: 'object' },
        peerAccess: { type: 'array', items: { type: 'array' } },
        nvlinkConnections: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'topology']
}));

export const workloadPartitioningTask = defineTask('workload-partitioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Workload Partitioning - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design workload partitioning',
      context: args,
      instructions: [
        '1. Analyze workload characteristics',
        '2. Choose partitioning strategy',
        '3. Implement data splitting',
        '4. Balance load across GPUs',
        '5. Handle irregular workloads',
        '6. Minimize data movement',
        '7. Account for memory limits',
        '8. Design partition boundaries',
        '9. Implement partition logic',
        '10. Document partitioning strategy'
      ],
      outputFormat: 'JSON with workload partitioning'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'partitionCode', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        partitionCode: { type: 'string' },
        loadBalance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'partitioning']
}));

export const p2pCommunicationTask = defineTask('p2p-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `P2P Communication - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement peer-to-peer communication',
      context: args,
      instructions: [
        '1. Enable peer access between GPUs',
        '2. Implement P2P memory copies',
        '3. Use direct memory access',
        '4. Handle non-P2P fallback',
        '5. Optimize transfer overlap',
        '6. Use GPUDirect if available',
        '7. Implement async P2P transfers',
        '8. Profile P2P bandwidth',
        '9. Handle error conditions',
        '10. Document P2P usage'
      ],
      outputFormat: 'JSON with P2P communication details'
    },
    outputSchema: {
      type: 'object',
      required: ['supported', 'transferCode', 'artifacts'],
      properties: {
        supported: { type: 'boolean' },
        transferCode: { type: 'string' },
        bandwidth: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'p2p']
}));

export const ncclIntegrationTask = defineTask('nccl-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `NCCL Integration - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Integrate NCCL collective operations',
      context: args,
      instructions: [
        '1. Initialize NCCL communicator',
        '2. Implement all-reduce operations',
        '3. Implement broadcast operations',
        '4. Implement all-gather operations',
        '5. Implement reduce-scatter',
        '6. Use NCCL streams properly',
        '7. Handle NCCL errors',
        '8. Optimize for ring topology',
        '9. Profile collective performance',
        '10. Document NCCL usage'
      ],
      outputFormat: 'JSON with NCCL integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'initCode', 'artifacts'],
      properties: {
        operations: { type: 'array', items: { type: 'object' } },
        initCode: { type: 'string' },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'nccl']
}));

export const multiGpuStreamManagementTask = defineTask('multi-gpu-stream-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stream Management - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Manage streams across GPUs',
      context: args,
      instructions: [
        '1. Create per-GPU streams',
        '2. Design stream dependencies',
        '3. Implement cross-GPU events',
        '4. Overlap compute and communication',
        '5. Handle stream priorities',
        '6. Implement stream pools',
        '7. Profile stream utilization',
        '8. Avoid stream starvation',
        '9. Clean up stream resources',
        '10. Document stream strategy'
      ],
      outputFormat: 'JSON with stream management details'
    },
    outputSchema: {
      type: 'object',
      required: ['streamStrategy', 'streamCode', 'artifacts'],
      properties: {
        streamStrategy: { type: 'object' },
        streamCode: { type: 'string' },
        eventUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'streams']
}));

export const multiGpuSynchronizationTask = defineTask('multi-gpu-synchronization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synchronization - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement multi-GPU synchronization',
      context: args,
      instructions: [
        '1. Design sync points',
        '2. Implement device synchronization',
        '3. Use events for fine-grained sync',
        '4. Handle implicit vs explicit sync',
        '5. Minimize sync overhead',
        '6. Implement barrier operations',
        '7. Handle async completion',
        '8. Profile sync overhead',
        '9. Avoid over-synchronization',
        '10. Document sync mechanisms'
      ],
      outputFormat: 'JSON with synchronization details'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'syncCode', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'string' } },
        syncCode: { type: 'string' },
        overhead: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'synchronization']
}));

export const scalingAnalysisTask = defineTask('scaling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scaling Analysis - ${args.projectName}`,
  agent: {
    name: 'multi-gpu-systems-expert',
    skills: ['nccl-communication', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze multi-GPU scaling',
      context: args,
      instructions: [
        '1. Benchmark single GPU baseline',
        '2. Measure multi-GPU performance',
        '3. Calculate scaling efficiency',
        '4. Identify scaling bottlenecks',
        '5. Analyze communication overhead',
        '6. Profile load imbalance',
        '7. Test strong scaling',
        '8. Test weak scaling',
        '9. Create scaling charts',
        '10. Document scaling analysis'
      ],
      outputFormat: 'JSON with scaling analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['efficiency', 'speedup', 'bottlenecks', 'artifacts'],
      properties: {
        efficiency: { type: 'number' },
        speedup: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'multi-gpu', 'scaling']
}));
