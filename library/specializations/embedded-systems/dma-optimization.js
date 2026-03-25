/**
 * @process specializations/embedded-systems/dma-optimization
 * @description DMA Optimization - Configuring Direct Memory Access controllers for efficient data transfers, reducing
 * CPU overhead, and optimizing memory bandwidth for high-throughput applications.
 * @inputs { projectName: string, targetMcu: string, dataStreams?: array, throughputReq?: string, outputDir?: string }
 * @outputs { success: boolean, dmaConfig: object, performanceGain: string, cpuOffload: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/dma-optimization', {
 *   projectName: 'AudioProcessor',
 *   targetMcu: 'STM32F407',
 *   dataStreams: ['ADC', 'DAC', 'SPI_RX', 'SPI_TX'],
 *   throughputReq: '10MB/s'
 * });
 *
 * @references
 * - DMA Basics: https://interrupt.memfault.com/blog/introduction-to-dma
 * - DMA Performance: https://www.embedded.com/dma-fundamentals-on-various-platforms/
 * - Circular DMA: https://www.st.com/resource/en/application_note/dm00046011-using-the-stm32f2-stm32f4-and-stm32f7-series-dma-controller-stmicroelectronics.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    dataStreams = [],
    throughputReq = null,
    memoryAlignment = 4,
    doubleBuffering = true,
    outputDir = 'dma-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DMA Optimization: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Streams: ${dataStreams.join(', ')}`);

  // ============================================================================
  // PHASE 1: DMA REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing DMA Requirements');

  const requirementsAnalysis = await ctx.task(dmaRequirementsTask, {
    projectName,
    targetMcu,
    dataStreams,
    throughputReq,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DMA CONTROLLER MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping DMA Controllers');

  const controllerMapping = await ctx.task(dmaControllerMappingTask, {
    projectName,
    targetMcu,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...controllerMapping.artifacts);

  // ============================================================================
  // PHASE 3: CHANNEL CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring DMA Channels');

  const channelConfig = await ctx.task(dmaChannelConfigTask, {
    projectName,
    controllerMapping,
    dataStreams,
    memoryAlignment,
    outputDir
  });

  artifacts.push(...channelConfig.artifacts);

  // ============================================================================
  // PHASE 4: BUFFER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing DMA Buffers');

  const bufferDesign = await ctx.task(dmaBufferDesignTask, {
    projectName,
    channelConfig,
    doubleBuffering,
    memoryAlignment,
    outputDir
  });

  artifacts.push(...bufferDesign.artifacts);

  // ============================================================================
  // PHASE 5: CIRCULAR MODE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting Up Circular Mode');

  const circularSetup = await ctx.task(circularModeSetupTask, {
    projectName,
    channelConfig,
    bufferDesign,
    outputDir
  });

  artifacts.push(...circularSetup.artifacts);

  // ============================================================================
  // PHASE 6: INTERRUPT OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing DMA Interrupts');

  const interruptOptimization = await ctx.task(dmaInterruptOptimizationTask, {
    projectName,
    channelConfig,
    circularSetup,
    outputDir
  });

  artifacts.push(...interruptOptimization.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Verifying Performance');

  const performanceVerification = await ctx.task(dmaPerformanceVerificationTask, {
    projectName,
    channelConfig,
    throughputReq,
    outputDir
  });

  artifacts.push(...performanceVerification.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating DMA Documentation');

  const documentation = await ctx.task(dmaDocumentationTask, {
    projectName,
    controllerMapping,
    channelConfig,
    bufferDesign,
    circularSetup,
    interruptOptimization,
    performanceVerification,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `DMA Optimization Complete for ${projectName}. CPU offload: ${performanceVerification.cpuOffload}. Throughput met: ${performanceVerification.throughputMet}. Review?`,
    title: 'DMA Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        channelsConfigured: channelConfig.channels.length,
        cpuOffload: performanceVerification.cpuOffload,
        throughputAchieved: performanceVerification.throughputAchieved,
        throughputMet: performanceVerification.throughputMet
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'DMA Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: performanceVerification.throughputMet || true,
    projectName,
    dmaConfig: {
      controllers: controllerMapping.controllers,
      channels: channelConfig.channels,
      buffers: bufferDesign.buffers,
      interrupts: interruptOptimization.configuration
    },
    performanceGain: performanceVerification.performanceGain,
    cpuOffload: performanceVerification.cpuOffload,
    throughputAchieved: performanceVerification.throughputAchieved,
    docPath: documentation.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/dma-optimization',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dmaRequirementsTask = defineTask('dma-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: DMA Requirements - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze DMA requirements',
      context: args,
      instructions: [
        '1. Identify data streams',
        '2. Calculate bandwidth needs',
        '3. Determine transfer sizes',
        '4. Identify timing constraints',
        '5. Analyze memory access patterns',
        '6. Identify priority levels',
        '7. Determine burst requirements',
        '8. Analyze peripheral constraints',
        '9. Document requirements',
        '10. Prioritize streams'
      ],
      outputFormat: 'JSON with DMA requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['streams', 'bandwidthNeeds', 'artifacts'],
      properties: {
        streams: { type: 'array', items: { type: 'object' } },
        bandwidthNeeds: { type: 'object' },
        priorities: { type: 'object' },
        constraints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'requirements']
}));

export const dmaControllerMappingTask = defineTask('dma-controller-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Controller Mapping - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Map DMA controllers',
      context: args,
      instructions: [
        '1. Identify available DMA controllers',
        '2. Map peripheral requests',
        '3. Allocate streams/channels',
        '4. Handle conflicts',
        '5. Optimize distribution',
        '6. Consider bus arbitration',
        '7. Plan backup channels',
        '8. Document mapping',
        '9. Create allocation table',
        '10. Verify feasibility'
      ],
      outputFormat: 'JSON with controller mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['controllers', 'mapping', 'artifacts'],
      properties: {
        controllers: { type: 'array', items: { type: 'object' } },
        mapping: { type: 'object' },
        conflicts: { type: 'array', items: { type: 'string' } },
        resolutions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'mapping']
}));

export const dmaChannelConfigTask = defineTask('dma-channel-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Channel Configuration - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure DMA channels',
      context: args,
      instructions: [
        '1. Set transfer direction',
        '2. Configure data width',
        '3. Set increment modes',
        '4. Configure burst size',
        '5. Set priority levels',
        '6. Enable circular mode',
        '7. Configure FIFO',
        '8. Set flow controller',
        '9. Handle errors',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with channel configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'artifacts'],
      properties: {
        channels: { type: 'array', items: { type: 'object' } },
        registerSettings: { type: 'object' },
        fifoConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'channel-config']
}));

export const dmaBufferDesignTask = defineTask('dma-buffer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Buffer Design - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design DMA buffers',
      context: args,
      instructions: [
        '1. Calculate buffer sizes',
        '2. Ensure alignment',
        '3. Design double buffering',
        '4. Place in correct memory',
        '5. Handle cache coherency',
        '6. Design ping-pong buffers',
        '7. Optimize for latency',
        '8. Consider memory bandwidth',
        '9. Define buffer attributes',
        '10. Document design'
      ],
      outputFormat: 'JSON with buffer design'
    },
    outputSchema: {
      type: 'object',
      required: ['buffers', 'memoryUsage', 'artifacts'],
      properties: {
        buffers: { type: 'array', items: { type: 'object' } },
        memoryUsage: { type: 'string' },
        alignment: { type: 'number' },
        cacheHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'buffers']
}));

export const circularModeSetupTask = defineTask('circular-mode-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Circular Mode - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Set up circular DMA mode',
      context: args,
      instructions: [
        '1. Enable circular mode',
        '2. Configure half-transfer',
        '3. Set up double buffer',
        '4. Handle buffer switching',
        '5. Configure interrupts',
        '6. Handle overrun',
        '7. Design continuous streaming',
        '8. Test circular operation',
        '9. Handle restart',
        '10. Document setup'
      ],
      outputFormat: 'JSON with circular mode setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'streams', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        streams: { type: 'array', items: { type: 'object' } },
        interrupts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'circular']
}));

export const dmaInterruptOptimizationTask = defineTask('dma-interrupt-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interrupt Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Optimize DMA interrupts',
      context: args,
      instructions: [
        '1. Select interrupt events',
        '2. Minimize interrupt rate',
        '3. Use half-transfer wisely',
        '4. Batch processing design',
        '5. Optimize ISR handlers',
        '6. Configure priorities',
        '7. Handle error interrupts',
        '8. Design callback system',
        '9. Reduce latency',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with interrupt optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'interruptRate', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        interruptRate: { type: 'string' },
        handlers: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'interrupts']
}));

export const dmaPerformanceVerificationTask = defineTask('dma-performance-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Performance Verification - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Verify DMA performance',
      context: args,
      instructions: [
        '1. Measure throughput',
        '2. Measure CPU usage',
        '3. Calculate CPU offload',
        '4. Check latency',
        '5. Verify continuous operation',
        '6. Test error handling',
        '7. Stress test',
        '8. Compare to requirements',
        '9. Identify bottlenecks',
        '10. Document results'
      ],
      outputFormat: 'JSON with performance verification'
    },
    outputSchema: {
      type: 'object',
      required: ['throughputAchieved', 'cpuOffload', 'throughputMet', 'artifacts'],
      properties: {
        throughputAchieved: { type: 'string' },
        cpuOffload: { type: 'string' },
        throughputMet: { type: 'boolean' },
        performanceGain: { type: 'string' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'verification']
}));

export const dmaDocumentationTask = defineTask('dma-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DMA Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate DMA documentation',
      context: args,
      instructions: [
        '1. Create overview',
        '2. Document controller mapping',
        '3. Document channel config',
        '4. Explain buffer design',
        '5. Document circular mode',
        '6. Include interrupt handling',
        '7. Add performance data',
        '8. Include code examples',
        '9. Add troubleshooting',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        codeExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'dma', 'documentation']
}));
