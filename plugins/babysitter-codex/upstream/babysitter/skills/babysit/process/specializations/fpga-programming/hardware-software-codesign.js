/**
 * @process specializations/fpga-programming/hardware-software-codesign
 * @description Hardware-Software Co-Design - Partition algorithms between PS (Processing System) and PL (Programmable Logic).
 * Design hardware accelerators with software drivers and optimize system-level performance.
 * @inputs { designName: string, targetPlatform: string, algorithmSpec: object, partitionStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, partitionDesign: object, hardwareAccelerators: array, softwareDrivers: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/hardware-software-codesign', {
 *   designName: 'image_processing_soc',
 *   targetPlatform: 'Zynq UltraScale+ MPSoC',
 *   algorithmSpec: { name: 'image_filter', operations: ['convolution', 'resize', 'color_convert'] },
 *   partitionStrategy: 'performance_optimized'
 * });
 *
 * @references
 * - Zynq UltraScale+ Guide: https://docs.amd.com/r/en-US/ug1085-zynq-ultrascale-trm
 * - Vitis Unified Platform: https://docs.amd.com/r/en-US/ug1393-vitis-application-acceleration
 * - Intel SoC FPGA: https://www.intel.com/content/www/us/en/products/details/fpga/soc.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetPlatform,
    algorithmSpec,
    partitionStrategy = 'balanced',
    dmaArchitecture = 'scatter-gather',
    outputDir = 'hw-sw-codesign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HW-SW Co-Design for: ${designName}`);
  ctx.log('info', `Platform: ${targetPlatform}, Strategy: ${partitionStrategy}`);

  const systemAnalysis = await ctx.task(systemAnalysisTask, { designName, targetPlatform, algorithmSpec, partitionStrategy, outputDir });
  artifacts.push(...systemAnalysis.artifacts);

  const partitionDesign = await ctx.task(partitionDesignTask, { designName, systemAnalysis, partitionStrategy, outputDir });
  artifacts.push(...partitionDesign.artifacts);

  const acceleratorDesign = await ctx.task(acceleratorDesignTask, { designName, partitionDesign, targetPlatform, outputDir });
  artifacts.push(...acceleratorDesign.artifacts);

  await ctx.breakpoint({
    question: `HW-SW partition defined for ${designName}. ${partitionDesign.hwBlocks} HW blocks, ${partitionDesign.swFunctions} SW functions. Review partition?`,
    title: 'HW-SW Partition Review',
    context: { runId: ctx.runId, designName, hwBlocks: partitionDesign.hwBlocks, swFunctions: partitionDesign.swFunctions }
  });

  const dmaDesign = await ctx.task(dmaDesignTask, { designName, acceleratorDesign, dmaArchitecture, outputDir });
  artifacts.push(...dmaDesign.artifacts);

  const driverDevelopment = await ctx.task(driverDevelopmentTask, { designName, acceleratorDesign, dmaDesign, targetPlatform, outputDir });
  artifacts.push(...driverDevelopment.artifacts);

  const systemIntegration = await ctx.task(systemIntegrationTask, { designName, acceleratorDesign, driverDevelopment, dmaDesign, outputDir });
  artifacts.push(...systemIntegration.artifacts);

  const codesignVerification = await ctx.task(codesignVerificationTask, { designName, systemIntegration, algorithmSpec, outputDir });
  artifacts.push(...codesignVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: codesignVerification.passed,
    designName,
    partitionDesign: partitionDesign.partition,
    hardwareAccelerators: acceleratorDesign.accelerators,
    softwareDrivers: driverDevelopment.drivers,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/hardware-software-codesign', timestamp: startTime, designName, outputDir }
  };
}

export const systemAnalysisTask = defineTask('system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Analysis - ${args.designName}`,
  agent: {
    name: 'system-architect',
    prompt: {
      role: 'HW-SW System Architect',
      task: 'Analyze system requirements',
      context: args,
      instructions: ['1. Profile algorithm complexity', '2. Identify compute bottlenecks', '3. Analyze data flow', '4. Measure latency requirements', '5. Assess bandwidth needs', '6. Identify parallelization', '7. Evaluate PS capabilities', '8. Evaluate PL capabilities', '9. Document tradeoffs', '10. Recommend partition']
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: { analysis: { type: 'object' }, bottlenecks: { type: 'array', items: { type: 'object' } }, recommendations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'analysis']
}));

export const partitionDesignTask = defineTask('partition-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Partition Design - ${args.designName}`,
  agent: {
    name: 'system-architect',
    prompt: {
      role: 'HW-SW System Architect',
      task: 'Design HW-SW partition',
      context: args,
      instructions: ['1. Define HW acceleration candidates', '2. Define SW functions', '3. Design data interfaces', '4. Define memory architecture', '5. Plan interrupt handling', '6. Design synchronization', '7. Document partition rationale', '8. Create block diagram', '9. Estimate performance', '10. Validate partition']
    },
    outputSchema: {
      type: 'object',
      required: ['partition', 'hwBlocks', 'swFunctions', 'artifacts'],
      properties: { partition: { type: 'object' }, hwBlocks: { type: 'number' }, swFunctions: { type: 'number' }, interfaces: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'partition']
}));

export const acceleratorDesignTask = defineTask('accelerator-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Accelerator Design - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Accelerator Engineer',
      task: 'Design hardware accelerators',
      context: args,
      instructions: ['1. Design accelerator architecture', '2. Implement compute units', '3. Design local memory', '4. Implement AXI interfaces', '5. Add control registers', '6. Design interrupt logic', '7. Optimize for throughput', '8. Document accelerators', '9. Create RTL', '10. Verify functionality']
    },
    outputSchema: {
      type: 'object',
      required: ['accelerators', 'artifacts'],
      properties: { accelerators: { type: 'array', items: { type: 'object' } }, rtlPaths: { type: 'array', items: { type: 'string' } }, resourceEstimates: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'accelerator']
}));

export const dmaDesignTask = defineTask('dma-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMA Design - ${args.designName}`,
  agent: {
    name: 'system-architect',
    prompt: {
      role: 'HW-SW System Architect',
      task: 'Design DMA architecture',
      context: args,
      instructions: ['1. Select DMA controller', '2. Configure channels', '3. Design descriptor format', '4. Implement scatter-gather', '5. Design buffer management', '6. Add interrupt handling', '7. Optimize for bandwidth', '8. Document DMA design', '9. Create configuration', '10. Verify DMA operation']
    },
    outputSchema: {
      type: 'object',
      required: ['dmaDesign', 'artifacts'],
      properties: { dmaDesign: { type: 'object' }, channels: { type: 'number' }, bandwidth: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'dma']
}));

export const driverDevelopmentTask = defineTask('driver-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Driver Development - ${args.designName}`,
  agent: {
    name: 'embedded-engineer',
    prompt: {
      role: 'Embedded Software Engineer',
      task: 'Develop software drivers',
      context: args,
      instructions: ['1. Create driver framework', '2. Implement register access', '3. Implement DMA handling', '4. Add interrupt handlers', '5. Create user-space API', '6. Add error handling', '7. Implement synchronization', '8. Document driver API', '9. Create test application', '10. Verify driver operation']
    },
    outputSchema: {
      type: 'object',
      required: ['drivers', 'artifacts'],
      properties: { drivers: { type: 'array', items: { type: 'object' } }, apiDocPath: { type: 'string' }, testAppPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'driver']
}));

export const systemIntegrationTask = defineTask('system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Integration - ${args.designName}`,
  agent: {
    name: 'system-architect',
    prompt: {
      role: 'HW-SW System Architect',
      task: 'Integrate HW and SW',
      context: args,
      instructions: ['1. Create block design', '2. Connect accelerators', '3. Configure interconnect', '4. Set address map', '5. Configure interrupts', '6. Generate device tree', '7. Build boot images', '8. Document integration', '9. Test boot sequence', '10. Verify connectivity']
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'artifacts'],
      properties: { integration: { type: 'object' }, blockDesignPath: { type: 'string' }, deviceTreePath: { type: 'string' }, bootImagePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'integration']
}));

export const codesignVerificationTask = defineTask('codesign-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Co-Design Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'System Verification Engineer',
      task: 'Verify HW-SW system',
      context: args,
      instructions: ['1. Test driver initialization', '2. Test DMA transfers', '3. Verify accelerator operation', '4. Measure latency', '5. Measure throughput', '6. Test error handling', '7. Run stress tests', '8. Compare with reference', '9. Document results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, performanceMetrics: { type: 'object' }, testResults: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'codesign', 'verification']
}));
