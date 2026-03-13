/**
 * @process specializations/embedded-systems/isr-design
 * @description Interrupt Service Routine (ISR) Design - Designing efficient, minimal-latency interrupt handlers following
 * best practices including keeping ISRs short, using deferred interrupt processing, ensuring reentrancy, and managing
 * interrupt priorities.
 * @inputs { projectName: string, targetMcu: string, interruptSources?: array, rtos?: string, outputDir?: string }
 * @outputs { success: boolean, isrDesign: object, priorityScheme: object, deferredProcessing: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/isr-design', {
 *   projectName: 'DataLogger',
 *   targetMcu: 'STM32F407VG',
 *   interruptSources: ['UART_RX', 'Timer', 'DMA', 'GPIO'],
 *   rtos: 'FreeRTOS'
 * });
 *
 * @references
 * - Interrupt Handling Best Practices: https://interrupt.memfault.com/blog/interrupt-handling-best-practices
 * - ISR Design: https://www.embedded.com/interrupt-handling-part-1/
 * - RTOS and Interrupts: https://www.freertos.org/RTOS-task-notifications.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    interruptSources = [],
    rtos = null,
    maxIsrLatency = '10us',
    deferredProcessing = true,
    nestingEnabled = true,
    outputDir = 'isr-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ISR Design: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, RTOS: ${rtos || 'Bare-metal'}`);

  // ============================================================================
  // PHASE 1: INTERRUPT REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Interrupt Requirements');

  const requirementsAnalysis = await ctx.task(interruptRequirementsTask, {
    projectName,
    targetMcu,
    interruptSources,
    maxIsrLatency,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PRIORITY SCHEME DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Priority Scheme');

  const priorityScheme = await ctx.task(prioritySchemeDesignTask, {
    projectName,
    targetMcu,
    interruptSources,
    rtos,
    nestingEnabled,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...priorityScheme.artifacts);

  // ============================================================================
  // PHASE 3: ISR IMPLEMENTATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing ISR Implementations');

  const isrImplementation = await ctx.task(isrImplementationDesignTask, {
    projectName,
    interruptSources,
    priorityScheme,
    maxIsrLatency,
    outputDir
  });

  artifacts.push(...isrImplementation.artifacts);

  // ============================================================================
  // PHASE 4: DEFERRED PROCESSING DESIGN
  // ============================================================================

  let deferredDesign = null;
  if (deferredProcessing) {
    ctx.log('info', 'Phase 4: Designing Deferred Processing');

    deferredDesign = await ctx.task(deferredProcessingDesignTask, {
      projectName,
      rtos,
      isrImplementation,
      outputDir
    });

    artifacts.push(...deferredDesign.artifacts);
  }

  // ============================================================================
  // PHASE 5: CRITICAL SECTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing Critical Sections');

  const criticalSections = await ctx.task(criticalSectionDesignTask, {
    projectName,
    rtos,
    priorityScheme,
    outputDir
  });

  artifacts.push(...criticalSections.artifacts);

  // ============================================================================
  // PHASE 6: LATENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Interrupt Latency');

  const latencyAnalysis = await ctx.task(isrLatencyAnalysisTask, {
    projectName,
    isrImplementation,
    priorityScheme,
    maxIsrLatency,
    outputDir
  });

  artifacts.push(...latencyAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating ISR Documentation');

  const documentation = await ctx.task(isrDocumentationTask, {
    projectName,
    priorityScheme,
    isrImplementation,
    deferredDesign,
    criticalSections,
    latencyAnalysis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `ISR Design Complete for ${projectName}. ${isrImplementation.isrCount} ISRs designed. Latency OK: ${latencyAnalysis.meetsRequirement}. Review?`,
    title: 'ISR Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        isrCount: isrImplementation.isrCount,
        priorityLevels: priorityScheme.levels,
        maxLatency: latencyAnalysis.worstCaseLatency,
        meetsRequirement: latencyAnalysis.meetsRequirement
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'ISR Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: latencyAnalysis.meetsRequirement,
    projectName,
    isrDesign: {
      isrs: isrImplementation.isrs,
      isrCount: isrImplementation.isrCount,
      patterns: isrImplementation.patterns
    },
    priorityScheme: {
      levels: priorityScheme.levels,
      assignments: priorityScheme.assignments,
      grouping: priorityScheme.grouping
    },
    deferredProcessing: deferredDesign?.mechanisms || [],
    latency: {
      worstCase: latencyAnalysis.worstCaseLatency,
      meetsRequirement: latencyAnalysis.meetsRequirement
    },
    docPath: documentation.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/isr-design',
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

export const interruptRequirementsTask = defineTask('interrupt-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Interrupt Requirements - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze interrupt requirements',
      context: args,
      instructions: [
        '1. Identify all interrupt sources',
        '2. Define latency requirements',
        '3. Analyze frequency/rate',
        '4. Identify time-critical interrupts',
        '5. Analyze data handling needs',
        '6. Identify shared resources',
        '7. Define response requirements',
        '8. Analyze nesting needs',
        '9. Identify RTOS interactions',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with interrupt requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'latencyReqs', 'artifacts'],
      properties: {
        sources: { type: 'array', items: { type: 'object' } },
        latencyReqs: { type: 'object' },
        frequencyAnalysis: { type: 'object' },
        sharedResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'requirements']
}));

export const prioritySchemeDesignTask = defineTask('priority-scheme-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Priority Scheme - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design interrupt priority scheme',
      context: args,
      instructions: [
        '1. Determine priority bits available',
        '2. Define priority grouping',
        '3. Assign preemption priorities',
        '4. Assign sub-priorities',
        '5. Consider RTOS requirements',
        '6. Define RTOS boundary priority',
        '7. Group related interrupts',
        '8. Document priority rationale',
        '9. Verify no conflicts',
        '10. Create priority table'
      ],
      outputFormat: 'JSON with priority scheme'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'assignments', 'grouping', 'artifacts'],
      properties: {
        levels: { type: 'number' },
        assignments: { type: 'array', items: { type: 'object' } },
        grouping: { type: 'object' },
        rtosBoundary: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'priority']
}));

export const isrImplementationDesignTask = defineTask('isr-implementation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: ISR Implementation - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design ISR implementations',
      context: args,
      instructions: [
        '1. Design minimal ISR bodies',
        '2. Minimize register usage',
        '3. Design flag handling',
        '4. Plan data buffering',
        '5. Design error handling',
        '6. Ensure reentrancy',
        '7. Avoid blocking calls',
        '8. Use volatile correctly',
        '9. Design exit strategy',
        '10. Document ISR design'
      ],
      outputFormat: 'JSON with ISR implementation design'
    },
    outputSchema: {
      type: 'object',
      required: ['isrs', 'isrCount', 'patterns', 'artifacts'],
      properties: {
        isrs: { type: 'array', items: { type: 'object' } },
        isrCount: { type: 'number' },
        patterns: { type: 'array', items: { type: 'string' } },
        guidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'implementation']
}));

export const deferredProcessingDesignTask = defineTask('deferred-processing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Deferred Processing - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design deferred interrupt processing',
      context: args,
      instructions: [
        '1. Identify deferrable work',
        '2. Design task notification',
        '3. Design queue-based deferral',
        '4. Plan semaphore signaling',
        '5. Design bottom-half handlers',
        '6. Choose deferral mechanism',
        '7. Design data handoff',
        '8. Plan priority for deferred',
        '9. Handle overflow',
        '10. Document design'
      ],
      outputFormat: 'JSON with deferred processing design'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'handlers', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'object' } },
        handlers: { type: 'array', items: { type: 'object' } },
        dataHandoff: { type: 'object' },
        overflowHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'deferred-processing']
}));

export const criticalSectionDesignTask = defineTask('critical-section-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Critical Sections - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design critical sections',
      context: args,
      instructions: [
        '1. Identify shared resources',
        '2. Design disable/enable macros',
        '3. Design priority masking',
        '4. Minimize critical sections',
        '5. Plan nesting support',
        '6. Design atomic operations',
        '7. Handle RTOS integration',
        '8. Test reentrancy',
        '9. Document usage',
        '10. Create guidelines'
      ],
      outputFormat: 'JSON with critical section design'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'macros', 'artifacts'],
      properties: {
        sections: { type: 'array', items: { type: 'object' } },
        macros: { type: 'array', items: { type: 'object' } },
        atomicOperations: { type: 'array', items: { type: 'string' } },
        guidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'critical-sections']
}));

export const isrLatencyAnalysisTask = defineTask('isr-latency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Latency Analysis - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze ISR latency',
      context: args,
      instructions: [
        '1. Calculate entry latency',
        '2. Estimate ISR execution time',
        '3. Calculate exit latency',
        '4. Analyze blocking time',
        '5. Consider nesting impact',
        '6. Calculate worst case',
        '7. Compare to requirements',
        '8. Identify bottlenecks',
        '9. Suggest improvements',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with latency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['worstCaseLatency', 'meetsRequirement', 'artifacts'],
      properties: {
        worstCaseLatency: { type: 'string' },
        meetsRequirement: { type: 'boolean' },
        latencyBreakdown: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'latency']
}));

export const isrDocumentationTask = defineTask('isr-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: ISR Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate ISR documentation',
      context: args,
      instructions: [
        '1. Create ISR overview',
        '2. Document priority scheme',
        '3. Document each ISR',
        '4. Include deferred processing',
        '5. Document critical sections',
        '6. Add latency analysis',
        '7. Include best practices',
        '8. Add troubleshooting',
        '9. Create diagrams',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'isr', 'documentation']
}));
