/**
 * @process specializations/embedded-systems/real-time-performance-validation
 * @description Real-Time Performance Validation - Systematic measurement and analysis of timing behavior including
 * worst-case execution time (WCET), interrupt latency, context switch overhead, and deadline adherence to ensure
 * real-time requirements are met.
 * @inputs { projectName: string, targetMcu: string, tasks?: array, deadlines?: object, outputDir?: string }
 * @outputs { success: boolean, wcetResults: object, latencyResults: object, deadlineCompliance: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/real-time-performance-validation', {
 *   projectName: 'MotorController',
 *   targetMcu: 'STM32F407VG',
 *   tasks: ['control_loop', 'sensor_read', 'communication'],
 *   deadlines: { control_loop: '100us', sensor_read: '1ms' }
 * });
 *
 * @references
 * - Real-Time System Performance Analysis: https://www.embedded.com/real-time-system-performance-analysis/
 * - WCET Analysis: https://interrupt.memfault.com/blog/profiling-firmware-on-cortex-m
 * - Real-Time Systems: https://www.freertos.org/Documentation/RTOS_book.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    tasks = [],
    deadlines = {},
    measurementMethod = 'instrumentation', // 'instrumentation', 'trace', 'emulation'
    wcetAnalysis = true,
    jitterAnalysis = true,
    outputDir = 'rt-performance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Real-Time Performance Validation: ${projectName}`);

  // ============================================================================
  // PHASE 1: MEASUREMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Measurement Infrastructure');

  const measurementSetup = await ctx.task(measurementSetupTask, {
    projectName,
    targetMcu,
    measurementMethod,
    outputDir
  });

  artifacts.push(...measurementSetup.artifacts);

  // ============================================================================
  // PHASE 2: WCET ANALYSIS
  // ============================================================================

  let wcetResults = null;
  if (wcetAnalysis) {
    ctx.log('info', 'Phase 2: Performing WCET Analysis');

    wcetResults = await ctx.task(wcetAnalysisTask, {
      projectName,
      tasks,
      measurementSetup,
      outputDir
    });

    artifacts.push(...wcetResults.artifacts);
  }

  // ============================================================================
  // PHASE 3: INTERRUPT LATENCY MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Measuring Interrupt Latency');

  const interruptLatency = await ctx.task(interruptLatencyTask, {
    projectName,
    targetMcu,
    measurementSetup,
    outputDir
  });

  artifacts.push(...interruptLatency.artifacts);

  // ============================================================================
  // PHASE 4: CONTEXT SWITCH OVERHEAD
  // ============================================================================

  ctx.log('info', 'Phase 4: Measuring Context Switch Overhead');

  const contextSwitchOverhead = await ctx.task(contextSwitchOverheadTask, {
    projectName,
    measurementSetup,
    outputDir
  });

  artifacts.push(...contextSwitchOverhead.artifacts);

  // ============================================================================
  // PHASE 5: JITTER ANALYSIS
  // ============================================================================

  let jitterResults = null;
  if (jitterAnalysis) {
    ctx.log('info', 'Phase 5: Analyzing Timing Jitter');

    jitterResults = await ctx.task(jitterAnalysisTask, {
      projectName,
      tasks,
      measurementSetup,
      outputDir
    });

    artifacts.push(...jitterResults.artifacts);
  }

  // ============================================================================
  // PHASE 6: DEADLINE COMPLIANCE CHECK
  // ============================================================================

  ctx.log('info', 'Phase 6: Checking Deadline Compliance');

  const deadlineCheck = await ctx.task(deadlineComplianceTask, {
    projectName,
    tasks,
    deadlines,
    wcetResults,
    interruptLatency,
    contextSwitchOverhead,
    outputDir
  });

  artifacts.push(...deadlineCheck.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Performance Report');

  const report = await ctx.task(performanceReportTask, {
    projectName,
    wcetResults,
    interruptLatency,
    contextSwitchOverhead,
    jitterResults,
    deadlineCheck,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Performance Validation Complete for ${projectName}. Deadline compliance: ${deadlineCheck.allDeadlinesMet}. Review results?`,
    title: 'Performance Validation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        deadlineCompliance: deadlineCheck.allDeadlinesMet,
        maxInterruptLatency: interruptLatency.maxLatency,
        contextSwitchTime: contextSwitchOverhead.averageTime
      },
      files: [
        { path: report.reportPath, format: 'markdown', label: 'Performance Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: deadlineCheck.allDeadlinesMet,
    projectName,
    wcetResults: wcetResults?.results || {},
    latencyResults: {
      interruptLatency: interruptLatency.results,
      contextSwitchOverhead: contextSwitchOverhead.results
    },
    jitterResults: jitterResults?.results || {},
    deadlineCompliance: deadlineCheck.allDeadlinesMet,
    reportPath: report.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/real-time-performance-validation',
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

export const measurementSetupTask = defineTask('measurement-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Measurement Setup - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Set up timing measurement infrastructure',
      context: args,
      instructions: [
        '1. Configure DWT cycle counter',
        '2. Set up GPIO for timing pins',
        '3. Configure trace output (SWO/ETM)',
        '4. Set up high-resolution timer',
        '5. Create measurement macros',
        '6. Configure data logging',
        '7. Set up oscilloscope triggers',
        '8. Create measurement functions',
        '9. Calibrate measurement overhead',
        '10. Document measurement setup'
      ],
      outputFormat: 'JSON with measurement setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'measurementOverhead', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        measurementOverhead: { type: 'string' },
        timerResolution: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'measurement']
}));

export const wcetAnalysisTask = defineTask('wcet-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: WCET Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Perform worst-case execution time analysis',
      context: args,
      instructions: [
        '1. Identify critical code paths',
        '2. Measure function execution times',
        '3. Test with worst-case inputs',
        '4. Analyze loop iterations',
        '5. Measure cache effects',
        '6. Analyze interrupt impact',
        '7. Calculate WCET bounds',
        '8. Identify hotspots',
        '9. Create execution profiles',
        '10. Document WCET results'
      ],
      outputFormat: 'JSON with WCET analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'hotspots', 'artifacts'],
      properties: {
        results: { type: 'object' },
        hotspots: { type: 'array', items: { type: 'object' } },
        executionProfiles: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'wcet']
}));

export const interruptLatencyTask = defineTask('interrupt-latency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Interrupt Latency - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Measure interrupt latency',
      context: args,
      instructions: [
        '1. Configure test interrupt source',
        '2. Measure entry latency',
        '3. Measure exit latency',
        '4. Test under different loads',
        '5. Measure with nesting',
        '6. Test priority preemption',
        '7. Analyze statistical distribution',
        '8. Measure tail latency (99.9%)',
        '9. Compare to requirements',
        '10. Document latency results'
      ],
      outputFormat: 'JSON with interrupt latency results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'maxLatency', 'artifacts'],
      properties: {
        results: { type: 'object' },
        maxLatency: { type: 'string' },
        avgLatency: { type: 'string' },
        distribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'interrupt-latency']
}));

export const contextSwitchOverheadTask = defineTask('context-switch-overhead', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Context Switch Overhead - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Measure context switch overhead',
      context: args,
      instructions: [
        '1. Measure task-to-task switch time',
        '2. Measure ISR-to-task switch time',
        '3. Test with different priorities',
        '4. Measure FPU context save/restore',
        '5. Analyze stack usage impact',
        '6. Test with different task counts',
        '7. Measure preemption time',
        '8. Analyze statistical distribution',
        '9. Compare to RTOS specifications',
        '10. Document overhead results'
      ],
      outputFormat: 'JSON with context switch results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'averageTime', 'artifacts'],
      properties: {
        results: { type: 'object' },
        averageTime: { type: 'string' },
        maxTime: { type: 'string' },
        fpuImpact: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'context-switch']
}));

export const jitterAnalysisTask = defineTask('jitter-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Jitter Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Analyze timing jitter',
      context: args,
      instructions: [
        '1. Measure periodic task jitter',
        '2. Analyze activation jitter',
        '3. Measure completion jitter',
        '4. Calculate standard deviation',
        '5. Identify jitter sources',
        '6. Analyze interrupt impact',
        '7. Test under load variations',
        '8. Create jitter histograms',
        '9. Compare to requirements',
        '10. Document jitter analysis'
      ],
      outputFormat: 'JSON with jitter analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        maxJitter: { type: 'string' },
        avgJitter: { type: 'string' },
        stdDeviation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'jitter']
}));

export const deadlineComplianceTask = defineTask('deadline-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Deadline Compliance - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Performance Engineer',
      task: 'Check deadline compliance',
      context: args,
      instructions: [
        '1. Compare WCET to deadlines',
        '2. Add latency margins',
        '3. Calculate utilization',
        '4. Check schedulability',
        '5. Analyze worst-case scenarios',
        '6. Verify priority assignments',
        '7. Check for deadline misses',
        '8. Calculate slack time',
        '9. Identify bottlenecks',
        '10. Document compliance status'
      ],
      outputFormat: 'JSON with deadline compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['allDeadlinesMet', 'results', 'artifacts'],
      properties: {
        allDeadlinesMet: { type: 'boolean' },
        results: { type: 'array', items: { type: 'object' } },
        utilization: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'deadline']
}));

export const performanceReportTask = defineTask('performance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Performance Report - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate performance validation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document WCET results',
        '3. Document latency results',
        '4. Include jitter analysis',
        '5. Present deadline compliance',
        '6. Add performance graphs',
        '7. Include recommendations',
        '8. Document optimization opportunities',
        '9. Add measurement methodology',
        '10. Format final report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'performance', 'reporting']
}));
