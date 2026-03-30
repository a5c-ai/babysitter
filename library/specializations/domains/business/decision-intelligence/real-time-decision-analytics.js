/**
 * @process specializations/domains/business/decision-intelligence/real-time-decision-analytics
 * @description Real-Time Decision Analytics Implementation - Development of streaming analytics and real-time
 * decision support capabilities for time-critical operational decisions.
 * @inputs { projectName: string, useCase: object, dataStreams: array, latencyRequirements: object, decisionsTypes?: array }
 * @outputs { success: boolean, streamingArchitecture: object, analyticsEngine: object, alertingFramework: object, operationsDesign: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/real-time-decision-analytics', {
 *   projectName: 'Fraud Detection Real-Time System',
 *   useCase: { domain: 'payments', objective: 'fraud prevention' },
 *   dataStreams: ['transactions', 'user-behavior', 'device-signals'],
 *   latencyRequirements: { detection: '100ms', alert: '1s' }
 * });
 *
 * @references
 * - Streaming Systems: O'Reilly
 * - Real-Time Analytics: Gartner Research
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    useCase = {},
    dataStreams = [],
    latencyRequirements = {},
    decisionTypes = [],
    outputDir = 'realtime-analytics-output'
  } = inputs;

  // Phase 1: Use Case Analysis
  const useCaseAnalysis = await ctx.task(realtimeUseCaseTask, {
    projectName,
    useCase,
    latencyRequirements
  });

  // Phase 2: Streaming Architecture
  const streamingArchitecture = await ctx.task(streamingArchitectureTask, {
    projectName,
    useCaseAnalysis,
    dataStreams,
    latencyRequirements
  });

  // Phase 3: Data Pipeline Design
  const dataPipeline = await ctx.task(realtimePipelineTask, {
    projectName,
    streamingArchitecture,
    dataStreams
  });

  // Phase 4: Analytics Engine Design
  const analyticsEngine = await ctx.task(realtimeAnalyticsEngineTask, {
    projectName,
    useCaseAnalysis,
    streamingArchitecture
  });

  // Breakpoint: Review real-time architecture
  await ctx.breakpoint({
    question: `Review real-time analytics architecture for ${projectName}. Does it meet latency requirements?`,
    title: 'Real-Time Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      latencyTarget: latencyRequirements.detection || 'N/A'
    }
  });

  // Phase 5: Decision Engine Implementation
  const decisionEngine = await ctx.task(realtimeDecisionEngineTask, {
    projectName,
    analyticsEngine,
    decisionTypes
  });

  // Phase 6: Alerting Framework
  const alertingFramework = await ctx.task(realtimeAlertingTask, {
    projectName,
    decisionEngine,
    useCaseAnalysis
  });

  // Phase 7: Monitoring and Operations
  const operationsDesign = await ctx.task(realtimeOperationsTask, {
    projectName,
    streamingArchitecture,
    alertingFramework
  });

  // Phase 8: Testing and Validation
  const testingValidation = await ctx.task(realtimeTestingTask, {
    projectName,
    streamingArchitecture,
    decisionEngine,
    latencyRequirements
  });

  return {
    success: true,
    projectName,
    useCaseAnalysis,
    streamingArchitecture,
    dataPipeline,
    analyticsEngine,
    decisionEngine,
    alertingFramework,
    operationsDesign,
    testingValidation,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/real-time-decision-analytics',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const realtimeUseCaseTask = defineTask('realtime-use-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Use Case Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Real-Time Analytics Consultant',
      task: 'Analyze real-time decision analytics use case',
      context: args,
      instructions: [
        '1. Define decision objectives',
        '2. Identify time criticality',
        '3. Document latency requirements',
        '4. Analyze data velocity needs',
        '5. Identify decision outcomes',
        '6. Define success metrics',
        '7. Identify constraints',
        '8. Document use case specifications'
      ],
      outputFormat: 'JSON object with use case analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'latencyNeeds', 'successMetrics'],
      properties: {
        objectives: { type: 'array' },
        timeCriticality: { type: 'object' },
        latencyNeeds: { type: 'object' },
        dataVelocity: { type: 'object' },
        outcomes: { type: 'array' },
        successMetrics: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'use-case']
}));

export const streamingArchitectureTask = defineTask('streaming-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Streaming Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Streaming Systems Architect',
      task: 'Design streaming analytics architecture',
      context: args,
      instructions: [
        '1. Select streaming platform',
        '2. Design event ingestion',
        '3. Define stream processing topology',
        '4. Plan state management',
        '5. Design fault tolerance',
        '6. Plan scaling strategy',
        '7. Define checkpointing',
        '8. Document architecture'
      ],
      outputFormat: 'JSON object with streaming architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'ingestion', 'processing'],
      properties: {
        platform: { type: 'object' },
        ingestion: { type: 'object' },
        processing: { type: 'object' },
        stateManagement: { type: 'object' },
        faultTolerance: { type: 'object' },
        scaling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'streaming']
}));

export const realtimePipelineTask = defineTask('realtime-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Pipeline Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Pipeline Engineer',
      task: 'Design real-time data pipeline',
      context: args,
      instructions: [
        '1. Design data connectors',
        '2. Define schema evolution',
        '3. Plan data transformation',
        '4. Design enrichment patterns',
        '5. Plan data quality checks',
        '6. Define windowing strategies',
        '7. Design output sinks',
        '8. Document pipeline design'
      ],
      outputFormat: 'JSON object with pipeline design'
    },
    outputSchema: {
      type: 'object',
      required: ['connectors', 'transformations', 'outputs'],
      properties: {
        connectors: { type: 'array' },
        schemaEvolution: { type: 'object' },
        transformations: { type: 'array' },
        enrichment: { type: 'object' },
        qualityChecks: { type: 'array' },
        outputs: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'pipeline']
}));

export const realtimeAnalyticsEngineTask = defineTask('realtime-analytics-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics Engine Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Real-Time Analytics Engineer',
      task: 'Design real-time analytics engine',
      context: args,
      instructions: [
        '1. Design analytics algorithms',
        '2. Plan online model serving',
        '3. Design feature computation',
        '4. Plan model updates',
        '5. Design scoring pipeline',
        '6. Define aggregation logic',
        '7. Plan A/B testing support',
        '8. Document analytics engine'
      ],
      outputFormat: 'JSON object with analytics engine design'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'modelServing', 'scoring'],
      properties: {
        algorithms: { type: 'array' },
        modelServing: { type: 'object' },
        featureComputation: { type: 'object' },
        modelUpdates: { type: 'object' },
        scoring: { type: 'object' },
        aggregations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'analytics']
}));

export const realtimeDecisionEngineTask = defineTask('realtime-decision-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Engine Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Engine Designer',
      task: 'Design real-time decision engine',
      context: args,
      instructions: [
        '1. Design decision rules engine',
        '2. Define decision thresholds',
        '3. Plan action orchestration',
        '4. Design decision logging',
        '5. Plan override mechanisms',
        '6. Define escalation rules',
        '7. Design feedback capture',
        '8. Document decision engine'
      ],
      outputFormat: 'JSON object with decision engine design'
    },
    outputSchema: {
      type: 'object',
      required: ['rulesEngine', 'thresholds', 'actions'],
      properties: {
        rulesEngine: { type: 'object' },
        thresholds: { type: 'object' },
        actionOrchestration: { type: 'object' },
        logging: { type: 'object' },
        overrides: { type: 'object' },
        actions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'decision-engine']
}));

export const realtimeAlertingTask = defineTask('realtime-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alerting Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alerting Systems Designer',
      task: 'Design real-time alerting framework',
      context: args,
      instructions: [
        '1. Define alert types',
        '2. Design alert routing',
        '3. Plan notification channels',
        '4. Define alert suppression',
        '5. Design alert aggregation',
        '6. Plan escalation paths',
        '7. Define alert lifecycle',
        '8. Document alerting framework'
      ],
      outputFormat: 'JSON object with alerting framework'
    },
    outputSchema: {
      type: 'object',
      required: ['alertTypes', 'routing', 'notifications'],
      properties: {
        alertTypes: { type: 'array' },
        routing: { type: 'object' },
        notifications: { type: 'array' },
        suppression: { type: 'object' },
        aggregation: { type: 'object' },
        escalation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'alerting']
}));

export const realtimeOperationsTask = defineTask('realtime-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operations Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Real-Time Operations Engineer',
      task: 'Design operations for real-time system',
      context: args,
      instructions: [
        '1. Design monitoring dashboards',
        '2. Define SLOs and SLIs',
        '3. Plan incident response',
        '4. Design debugging tools',
        '5. Plan capacity management',
        '6. Define runbooks',
        '7. Design performance tuning',
        '8. Document operations design'
      ],
      outputFormat: 'JSON object with operations design'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoring', 'slos', 'incidentResponse'],
      properties: {
        monitoring: { type: 'object' },
        slos: { type: 'array' },
        incidentResponse: { type: 'object' },
        debuggingTools: { type: 'array' },
        capacity: { type: 'object' },
        runbooks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'operations']
}));

export const realtimeTestingTask = defineTask('realtime-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing and Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Real-Time Systems Tester',
      task: 'Design testing for real-time analytics',
      context: args,
      instructions: [
        '1. Design latency testing',
        '2. Plan throughput testing',
        '3. Design chaos engineering',
        '4. Plan accuracy validation',
        '5. Design load testing',
        '6. Plan regression testing',
        '7. Define acceptance criteria',
        '8. Document test plan'
      ],
      outputFormat: 'JSON object with testing design'
    },
    outputSchema: {
      type: 'object',
      required: ['latencyTests', 'throughputTests', 'validation'],
      properties: {
        latencyTests: { type: 'array' },
        throughputTests: { type: 'array' },
        chaosEngineering: { type: 'object' },
        accuracyValidation: { type: 'object' },
        loadTesting: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'realtime', 'testing']
}));
