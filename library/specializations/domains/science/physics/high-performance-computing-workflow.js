/**
 * @process High-Performance Computing Workflow
 * @description Develop and optimize workflows for large-scale physics simulations on HPC systems
 * @category Physics - Computational Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('high-performance-computing-workflow-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'High-Performance Computing Workflow Analysis',
  agent: {
    name: 'hpc-workflow-engineer',
    skills: ['lammps-md-simulator', 'vasp-dft-calculator', 'paraview-scientific-visualizer'],
    prompt: {
      role: 'Computational physicist specializing in HPC optimization and parallel computing for physics',
      task: 'Develop and optimize a high-performance computing workflow for large-scale physics simulations',
      context: args,
      instructions: [
        'Profile code to identify computational bottlenecks',
        'Analyze memory access patterns and cache efficiency',
        'Implement parallelization using MPI for distributed memory',
        'Implement OpenMP or threading for shared memory parallelism',
        'Optimize for GPU acceleration using CUDA or OpenCL if applicable',
        'Design efficient job submission and workflow automation scripts',
        'Implement checkpointing for fault tolerance and restart capability',
        'Plan data storage strategy and I/O optimization',
        'Design efficient data movement between compute and storage',
        'Monitor and optimize resource utilization (CPU, memory, network)',
        'Plan scaling studies to verify parallel efficiency',
        'Document workflow, dependencies, and reproduction procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            profilingResults: { type: 'object' },
            bottlenecks: { type: 'array', items: { type: 'object' } },
            mpiParallelization: { type: 'object' },
            openmpParallelization: { type: 'object' },
            gpuAcceleration: { type: 'object' },
            workflowAutomation: { type: 'object' },
            checkpointing: { type: 'object' },
            dataManagement: { type: 'object' },
            resourceUtilization: { type: 'object' },
            scalingAnalysis: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              performanceGain: { type: 'string' },
              scalingEfficiency: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['analysis', 'conclusions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(analyzeTask, {
    problem: inputs.problem,
    context: inputs.context
  });

  await ctx.breakpoint('Review high-performance computing workflow results');

  return {
    success: true,
    processType: 'High-Performance Computing Workflow',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
