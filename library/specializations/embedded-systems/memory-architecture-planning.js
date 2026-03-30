/**
 * @process specializations/embedded-systems/memory-architecture-planning
 * @description Memory Architecture Planning - Defining memory maps, allocating sections for code (Flash/ROM), data (RAM),
 * and peripherals, optimizing memory usage, and implementing memory protection mechanisms.
 * @inputs { projectName: string, targetMcu: string, flashSize?: string, ramSize?: string, outputDir?: string }
 * @outputs { success: boolean, memoryMap: object, linkerScript: string, optimizations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/memory-architecture-planning', {
 *   projectName: 'SensorHub',
 *   targetMcu: 'STM32F407VG',
 *   flashSize: '1MB',
 *   ramSize: '192KB'
 * });
 *
 * @references
 * - Memory Management for Embedded Systems: https://www.embedded.com/memory-management-for-embedded-systems/
 * - Linker Scripts: https://interrupt.memfault.com/blog/how-to-write-linker-scripts-for-firmware
 * - Memory Protection: https://www.embedded.com/memory-protection-unit-mpu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    flashSize = '512KB',
    ramSize = '128KB',
    externalMemory = false,
    mpuEnabled = true,
    bootloaderSize = '32KB',
    outputDir = 'memory-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Architecture Planning: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Flash: ${flashSize}, RAM: ${ramSize}`);

  // ============================================================================
  // PHASE 1: MEMORY REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Memory Requirements');

  const requirementsAnalysis = await ctx.task(memoryRequirementsTask, {
    projectName,
    targetMcu,
    flashSize,
    ramSize,
    bootloaderSize,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: MEMORY MAP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Memory Map');

  const memoryMapDesign = await ctx.task(memoryMapDesignTask, {
    projectName,
    targetMcu,
    flashSize,
    ramSize,
    externalMemory,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...memoryMapDesign.artifacts);

  // ============================================================================
  // PHASE 3: SECTION ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Allocating Memory Sections');

  const sectionAllocation = await ctx.task(sectionAllocationTask, {
    projectName,
    memoryMapDesign,
    outputDir
  });

  artifacts.push(...sectionAllocation.artifacts);

  // ============================================================================
  // PHASE 4: LINKER SCRIPT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating Linker Script');

  const linkerScript = await ctx.task(linkerScriptGenerationTask, {
    projectName,
    targetMcu,
    memoryMapDesign,
    sectionAllocation,
    outputDir
  });

  artifacts.push(...linkerScript.artifacts);

  // ============================================================================
  // PHASE 5: MPU CONFIGURATION
  // ============================================================================

  let mpuConfig = null;
  if (mpuEnabled) {
    ctx.log('info', 'Phase 5: Configuring Memory Protection Unit');

    mpuConfig = await ctx.task(mpuConfigurationTask, {
      projectName,
      targetMcu,
      memoryMapDesign,
      sectionAllocation,
      outputDir
    });

    artifacts.push(...mpuConfig.artifacts);
  }

  // ============================================================================
  // PHASE 6: OPTIMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Memory Optimizations');

  const optimizationAnalysis = await ctx.task(memoryOptimizationTask, {
    projectName,
    memoryMapDesign,
    sectionAllocation,
    outputDir
  });

  artifacts.push(...optimizationAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Documentation');

  const documentation = await ctx.task(memoryDocumentationTask, {
    projectName,
    memoryMapDesign,
    sectionAllocation,
    linkerScript,
    mpuConfig,
    optimizationAnalysis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Memory Architecture Planning Complete for ${projectName}. Flash: ${memoryMapDesign.flashUsed}, RAM: ${memoryMapDesign.ramUsed}. Review?`,
    title: 'Memory Planning Complete',
    context: {
      runId: ctx.runId,
      summary: {
        flashUsed: memoryMapDesign.flashUsed,
        ramUsed: memoryMapDesign.ramUsed,
        sections: sectionAllocation.sections.length,
        mpuRegions: mpuConfig?.regions?.length || 0
      },
      files: [
        { path: linkerScript.scriptPath, format: 'ld', label: 'Linker Script' },
        { path: documentation.docPath, format: 'markdown', label: 'Memory Doc' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    memoryMap: memoryMapDesign.memoryMap,
    linkerScript: linkerScript.scriptPath,
    sections: sectionAllocation.sections,
    mpuConfig: mpuConfig?.configuration || null,
    optimizations: optimizationAnalysis.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/memory-architecture-planning',
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

export const memoryRequirementsTask = defineTask('memory-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Memory Requirements - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Architect',
      task: 'Analyze memory requirements',
      context: args,
      instructions: [
        '1. Estimate code size',
        '2. Estimate static data size',
        '3. Calculate stack requirements',
        '4. Estimate heap requirements',
        '5. Plan for DMA buffers',
        '6. Reserve bootloader space',
        '7. Plan for configuration data',
        '8. Estimate runtime growth',
        '9. Add safety margins',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with memory requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['codeSize', 'dataSize', 'stackSize', 'heapSize', 'artifacts'],
      properties: {
        codeSize: { type: 'string' },
        dataSize: { type: 'string' },
        stackSize: { type: 'string' },
        heapSize: { type: 'string' },
        dmaBuffers: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'requirements']
}));

export const memoryMapDesignTask = defineTask('memory-map-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Memory Map Design - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Architect',
      task: 'Design memory map',
      context: args,
      instructions: [
        '1. Define Flash regions',
        '2. Define RAM regions',
        '3. Map peripheral registers',
        '4. Allocate bootloader region',
        '5. Define application region',
        '6. Plan external memory',
        '7. Define reserved regions',
        '8. Create memory map diagram',
        '9. Verify alignment requirements',
        '10. Document memory map'
      ],
      outputFormat: 'JSON with memory map design'
    },
    outputSchema: {
      type: 'object',
      required: ['memoryMap', 'flashUsed', 'ramUsed', 'artifacts'],
      properties: {
        memoryMap: { type: 'object' },
        flashUsed: { type: 'string' },
        ramUsed: { type: 'string' },
        regions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'memory-map']
}));

export const sectionAllocationTask = defineTask('section-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Section Allocation - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Architect',
      task: 'Allocate memory sections',
      context: args,
      instructions: [
        '1. Define .text section',
        '2. Define .rodata section',
        '3. Define .data section',
        '4. Define .bss section',
        '5. Define .stack section',
        '6. Define .heap section',
        '7. Create custom sections',
        '8. Define section attributes',
        '9. Plan initialization',
        '10. Document sections'
      ],
      outputFormat: 'JSON with section allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'artifacts'],
      properties: {
        sections: { type: 'array', items: { type: 'object' } },
        customSections: { type: 'array', items: { type: 'object' } },
        initializationOrder: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'sections']
}));

export const linkerScriptGenerationTask = defineTask('linker-script-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Linker Script - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Generate linker script',
      context: args,
      instructions: [
        '1. Define MEMORY regions',
        '2. Define SECTIONS',
        '3. Add symbol definitions',
        '4. Configure section placement',
        '5. Add alignment directives',
        '6. Define entry point',
        '7. Add size checks',
        '8. Configure LMA/VMA',
        '9. Add debug sections',
        '10. Validate script'
      ],
      outputFormat: 'JSON with linker script details'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptPath', 'memoryRegions', 'artifacts'],
      properties: {
        scriptPath: { type: 'string' },
        memoryRegions: { type: 'array', items: { type: 'object' } },
        sections: { type: 'array', items: { type: 'string' } },
        symbols: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'linker-script']
}));

export const mpuConfigurationTask = defineTask('mpu-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: MPU Configuration - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure Memory Protection Unit',
      context: args,
      instructions: [
        '1. Define protected regions',
        '2. Set access permissions',
        '3. Configure execute-never regions',
        '4. Set up privileged regions',
        '5. Define shared regions',
        '6. Configure cache attributes',
        '7. Handle region overlaps',
        '8. Add fault handlers',
        '9. Test protection',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with MPU configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'regions', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        regions: { type: 'array', items: { type: 'object' } },
        permissions: { type: 'object' },
        faultHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'mpu']
}));

export const memoryOptimizationTask = defineTask('memory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Memory Optimization - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze memory optimizations',
      context: args,
      instructions: [
        '1. Identify code size reductions',
        '2. Analyze data placement',
        '3. Optimize stack usage',
        '4. Review heap usage',
        '5. Analyze fragmentation',
        '6. Check alignment waste',
        '7. Identify dead code',
        '8. Review compiler options',
        '9. Suggest improvements',
        '10. Document optimizations'
      ],
      outputFormat: 'JSON with optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'potentialSavings', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        potentialSavings: { type: 'object' },
        currentUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'optimization']
}));

export const memoryDocumentationTask = defineTask('memory-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Memory Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate memory documentation',
      context: args,
      instructions: [
        '1. Create memory map diagram',
        '2. Document section layout',
        '3. Explain linker script',
        '4. Document MPU config',
        '5. Add usage guidelines',
        '6. Include optimization tips',
        '7. Add troubleshooting',
        '8. Document constraints',
        '9. Create reference tables',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        diagrams: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'memory', 'documentation']
}));
