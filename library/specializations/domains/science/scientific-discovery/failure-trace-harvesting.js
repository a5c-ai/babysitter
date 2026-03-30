/**
 * @process domains/science/scientific-discovery/failure-trace-harvesting
 * @description Failure Trace Harvesting: Design processes to fail in informative ways leaving rich logs
 * @inputs {
 *   process: string,
 *   failureModes: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   instrumentedProcess: object,
 *   harvestedInsights: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processDescription,
    failureModes = [],
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze Process Failure Potential
  ctx.log('info', 'Analyzing process failure potential');
  const failurePotential = await ctx.task(analyzeFailurePotentialTask, {
    processDescription,
    failureModes,
    domain
  });

  // Phase 2: Design Failure Instrumentation
  ctx.log('info', 'Designing failure instrumentation');
  const instrumentation = await ctx.task(designInstrumentationTask, {
    processDescription,
    failurePotential,
    domain
  });

  // Phase 3: Design Informative Failure Modes
  ctx.log('info', 'Designing informative failure modes');
  const informativeFailures = await ctx.task(designInformativeFailuresTask, {
    failurePotential,
    instrumentation,
    domain
  });

  await ctx.breakpoint({
    question: 'Failure instrumentation designed. Review before logging design?',
    title: 'Failure Trace Harvesting - Instrumentation Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/failure-potential.json', format: 'json' },
        { path: 'artifacts/instrumentation.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Design Rich Logging System
  ctx.log('info', 'Designing rich logging system');
  const loggingSystem = await ctx.task(designLoggingSystemTask, {
    informativeFailures,
    instrumentation,
    domain
  });

  // Phase 5: Create Instrumented Process
  ctx.log('info', 'Creating instrumented process');
  const instrumentedProcess = await ctx.task(createInstrumentedProcessTask, {
    processDescription,
    instrumentation,
    informativeFailures,
    loggingSystem,
    domain
  });

  // Phase 6: Simulate Failures and Harvest Traces
  ctx.log('info', 'Simulating failures and harvesting traces');
  const harvestedTraces = await ctx.task(harvestFailureTracesTask, {
    instrumentedProcess,
    informativeFailures,
    domain
  });

  // Phase 7: Analyze Harvested Insights
  ctx.log('info', 'Analyzing harvested insights');
  const harvestedInsights = await ctx.task(analyzeHarvestedInsightsTask, {
    harvestedTraces,
    informativeFailures,
    processDescription,
    domain
  });

  // Phase 8: Synthesize Findings
  ctx.log('info', 'Synthesizing failure trace harvesting findings');
  const synthesis = await ctx.task(synthesizeHarvestingInsightsTask, {
    processDescription,
    instrumentedProcess,
    harvestedTraces,
    harvestedInsights,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/failure-trace-harvesting',
    processDescription,
    domain,
    failurePotential,
    instrumentation,
    informativeFailures,
    loggingSystem,
    instrumentedProcess,
    harvestedTraces,
    harvestedInsights: harvestedInsights.insights,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      failureModesDesigned: informativeFailures.failures?.length || 0,
      instrumentationPoints: instrumentation.points?.length || 0,
      tracesHarvested: harvestedTraces.traces?.length || 0,
      insightsExtracted: harvestedInsights.insights?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeFailurePotentialTask = defineTask('analyze-failure-potential', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Failure Potential',
  agent: {
    name: 'failure-potential-analyst',
    prompt: {
      role: 'failure analysis specialist',
      task: 'Analyze the failure potential of the process',
      context: args,
      instructions: [
        'Identify all possible failure points',
        'Categorize failures by type and severity',
        'Analyze failure causes and preconditions',
        'Identify cascading failure possibilities',
        'Document failure symptoms and signatures',
        'Assess failure frequency and predictability',
        'Map failure propagation paths'
      ],
      outputFormat: 'JSON with failure points, categories, causes, propagation'
    },
    outputSchema: {
      type: 'object',
      required: ['failurePoints', 'categories'],
      properties: {
        failurePoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              location: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              causes: { type: 'array', items: { type: 'string' } },
              symptoms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        cascadingFailures: { type: 'array', items: { type: 'object' } },
        propagationPaths: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'analysis']
}));

export const designInstrumentationTask = defineTask('design-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Failure Instrumentation',
  agent: {
    name: 'instrumentation-designer',
    prompt: {
      role: 'observability engineer',
      task: 'Design instrumentation to capture failure information',
      context: args,
      instructions: [
        'Design measurement points for each failure mode',
        'Specify data to capture before, during, and after failure',
        'Design state snapshots for failure context',
        'Include timing and sequence information',
        'Design resource utilization capture',
        'Include dependency state capture',
        'Ensure minimal overhead when not failing'
      ],
      outputFormat: 'JSON with instrumentation points, data capture, state snapshots'
    },
    outputSchema: {
      type: 'object',
      required: ['points', 'dataCapture'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              location: { type: 'string' },
              triggerCondition: { type: 'string' },
              dataToCapture: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataCapture: { type: 'object' },
        stateSnapshots: { type: 'array', items: { type: 'object' } },
        timingCapture: { type: 'object' },
        overheadAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'instrumentation']
}));

export const designInformativeFailuresTask = defineTask('design-informative-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Informative Failure Modes',
  agent: {
    name: 'informative-failure-designer',
    prompt: {
      role: 'diagnostic engineer',
      task: 'Design failures that are maximally informative',
      context: args,
      instructions: [
        'Design failure modes that reveal root causes',
        'Create self-diagnosing failure patterns',
        'Design failures that expose hidden assumptions',
        'Include breadcrumb trails in failure paths',
        'Design failures that discriminate between hypotheses',
        'Create failures that expose boundary conditions',
        'Ensure failures are reproducible and deterministic'
      ],
      outputFormat: 'JSON with informative failures, diagnostic patterns, breadcrumbs'
    },
    outputSchema: {
      type: 'object',
      required: ['failures'],
      properties: {
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              informationRevealed: { type: 'array', items: { type: 'string' } },
              diagnosticValue: { type: 'string' },
              breadcrumbs: { type: 'array', items: { type: 'string' } },
              reproducibility: { type: 'string' }
            }
          }
        },
        selfDiagnosingPatterns: { type: 'array', items: { type: 'object' } },
        hypothesisDiscriminators: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'informative-failures']
}));

export const designLoggingSystemTask = defineTask('design-logging-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Rich Logging System',
  agent: {
    name: 'logging-designer',
    prompt: {
      role: 'logging systems architect',
      task: 'Design a rich logging system for failure traces',
      context: args,
      instructions: [
        'Design structured log format for failures',
        'Include context and causality information',
        'Design log levels for different audiences',
        'Include machine-parseable metadata',
        'Design log aggregation and correlation',
        'Include timestamps and sequence numbers',
        'Design log retention and rotation'
      ],
      outputFormat: 'JSON with log format, context capture, aggregation design'
    },
    outputSchema: {
      type: 'object',
      required: ['logFormat', 'contextCapture'],
      properties: {
        logFormat: { type: 'object' },
        contextCapture: { type: 'object' },
        logLevels: { type: 'array', items: { type: 'object' } },
        metadata: { type: 'object' },
        aggregation: { type: 'object' },
        correlation: { type: 'object' },
        retention: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'logging']
}));

export const createInstrumentedProcessTask = defineTask('create-instrumented-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Instrumented Process',
  agent: {
    name: 'process-instrumenter',
    prompt: {
      role: 'software engineer',
      task: 'Create the instrumented version of the process',
      context: args,
      instructions: [
        'Integrate instrumentation into process',
        'Add logging at all instrumentation points',
        'Implement informative failure modes',
        'Add state capture mechanisms',
        'Ensure instrumentation is toggleable',
        'Document the instrumented process',
        'Verify instrumentation completeness'
      ],
      outputFormat: 'JSON with instrumented process, documentation, verification'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'documentation'],
      properties: {
        process: { type: 'object' },
        instrumentationIntegration: { type: 'array', items: { type: 'object' } },
        loggingPoints: { type: 'array', items: { type: 'object' } },
        stateCapturePoints: { type: 'array', items: { type: 'object' } },
        toggleMechanism: { type: 'object' },
        documentation: { type: 'string' },
        verification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'implementation']
}));

export const harvestFailureTracesTask = defineTask('harvest-failure-traces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Harvest Failure Traces',
  agent: {
    name: 'trace-harvester',
    prompt: {
      role: 'failure analyst',
      task: 'Simulate failures and harvest the resulting traces',
      context: args,
      instructions: [
        'Trigger each informative failure mode',
        'Collect all generated traces',
        'Capture complete failure context',
        'Document the failure sequence',
        'Collect state snapshots',
        'Gather timing information',
        'Organize traces by failure type'
      ],
      outputFormat: 'JSON with traces, contexts, sequences, organization'
    },
    outputSchema: {
      type: 'object',
      required: ['traces'],
      properties: {
        traces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureId: { type: 'string' },
              logs: { type: 'array', items: { type: 'object' } },
              context: { type: 'object' },
              sequence: { type: 'array', items: { type: 'object' } },
              stateSnapshots: { type: 'array', items: { type: 'object' } },
              timing: { type: 'object' }
            }
          }
        },
        organizationByType: { type: 'object' },
        completeness: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'harvesting']
}));

export const analyzeHarvestedInsightsTask = defineTask('analyze-harvested-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Harvested Insights',
  agent: {
    name: 'insight-analyst',
    prompt: {
      role: 'data analyst',
      task: 'Extract insights from harvested failure traces',
      context: args,
      instructions: [
        'Analyze patterns across failure traces',
        'Identify root cause indicators',
        'Extract process understanding from failures',
        'Identify improvement opportunities',
        'Find hidden dependencies revealed by failures',
        'Discover boundary conditions',
        'Rate insights by value and actionability'
      ],
      outputFormat: 'JSON with insights, patterns, root causes, improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'patterns'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'string' },
              value: { type: 'string' },
              actionability: { type: 'string' }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'object' } },
        rootCauseIndicators: { type: 'array', items: { type: 'object' } },
        processUnderstanding: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'object' } },
        hiddenDependencies: { type: 'array', items: { type: 'string' } },
        boundaryConditions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'analysis']
}));

export const synthesizeHarvestingInsightsTask = defineTask('synthesize-harvesting-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Failure Harvesting Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'systems analyst',
      task: 'Synthesize insights from failure trace harvesting',
      context: args,
      instructions: [
        'Summarize key findings from failure harvesting',
        'Extract principles for informative failure design',
        'Document process understanding gained',
        'Provide recommendations for process improvement',
        'Note the value of failure-first investigation',
        'Identify limitations of the approach',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        processUnderstanding: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        failureFirstValue: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-harvesting', 'synthesis']
}));
