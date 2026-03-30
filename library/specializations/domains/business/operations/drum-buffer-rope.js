/**
 * @process specializations/domains/business/operations/drum-buffer-rope
 * @description Drum-Buffer-Rope (DBR) scheduling implementation based on Theory of Constraints.
 *              Synchronizes production to the pace of the constraint (drum), protects throughput
 *              with time buffers, and controls material release (rope) to prevent WIP accumulation.
 * @inputs {
 *   organizationContext: { industry: string, productionType: string, productMix: string[] },
 *   constraintInfo: { currentConstraint: string, constraintCapacity: number, demandRate: number },
 *   productionData: { routings: object[], cycleTimeData: object, currentWIP: number },
 *   bufferPolicy: { targetBufferSize: string, bufferPenetrationThresholds: object },
 *   implementationScope: { pilotArea: string, timeline: string, integrationRequirements: string[] }
 * }
 * @outputs {
 *   dbrDesign: { drumSchedule: object, bufferSizing: object, ropeLogic: object },
 *   bufferManagement: { bufferStatus: object[], penetrationAnalysis: object, recoveryActions: object[] },
 *   implementationPlan: { phases: object[], trainingPlan: object, metricsFramework: object },
 *   performanceResults: { throughputImprovement: number, wipReduction: number, leadTimeReduction: number }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "discrete-manufacturing", productionType: "job-shop", productMix: ["A", "B", "C"] },
 *   constraintInfo: { currentConstraint: "CNC-Machining-Center", constraintCapacity: 480, demandRate: 520 },
 *   productionData: { routings: [...], cycleTimeData: {...}, currentWIP: 1500 },
 *   bufferPolicy: { targetBufferSize: "2-days", bufferPenetrationThresholds: { green: 0.33, yellow: 0.66, red: 1.0 } },
 *   implementationScope: { pilotArea: "Assembly-Line-1", timeline: "12-weeks", integrationRequirements: ["ERP", "MES"] }
 * }
 * @references TOC Handbook, The Goal (Goldratt), DBR Scheduling Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, constraintInfo, productionData, bufferPolicy, implementationScope } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Constraint Validation and Analysis
  const constraintValidation = await ctx.task(validateConstraint, {
    constraintInfo,
    productionData,
    organizationContext
  });
  artifacts.push({ phase: 'constraint-validation', output: constraintValidation });

  // Phase 2: Drum Schedule Design
  const drumDesign = await ctx.task(designDrumSchedule, {
    constraintValidation,
    productionData,
    constraintInfo
  });
  artifacts.push({ phase: 'drum-design', output: drumDesign });

  // Phase 3: Buffer Sizing and Strategy
  const bufferDesign = await ctx.task(designBufferStrategy, {
    drumDesign,
    bufferPolicy,
    productionData,
    constraintInfo
  });
  artifacts.push({ phase: 'buffer-design', output: bufferDesign });

  // Phase 4: Rope Logic Development
  const ropeLogic = await ctx.task(developRopeLogic, {
    drumDesign,
    bufferDesign,
    productionData
  });
  artifacts.push({ phase: 'rope-logic', output: ropeLogic });

  // Phase 5: DBR System Integration Design
  const integrationDesign = await ctx.task(designSystemIntegration, {
    drumDesign,
    bufferDesign,
    ropeLogic,
    implementationScope
  });
  artifacts.push({ phase: 'integration-design', output: integrationDesign });

  // Quality Gate: DBR Design Review
  await ctx.breakpoint('dbr-design-review', {
    title: 'DBR System Design Review',
    description: 'Review and approve the complete DBR scheduling system design',
    artifacts: [drumDesign, bufferDesign, ropeLogic, integrationDesign]
  });

  // Phase 6: Buffer Management System
  const bufferManagementSystem = await ctx.task(developBufferManagement, {
    bufferDesign,
    bufferPolicy,
    integrationDesign
  });
  artifacts.push({ phase: 'buffer-management', output: bufferManagementSystem });

  // Phase 7: Implementation Planning
  const implementationPlan = await ctx.task(createImplementationPlan, {
    integrationDesign,
    bufferManagementSystem,
    implementationScope,
    organizationContext
  });
  artifacts.push({ phase: 'implementation-plan', output: implementationPlan });

  // Phase 8: Training Program Development
  const trainingProgram = await ctx.task(developTrainingProgram, {
    drumDesign,
    bufferManagementSystem,
    ropeLogic,
    implementationScope
  });
  artifacts.push({ phase: 'training-program', output: trainingProgram });

  // Phase 9: Pilot Execution Support
  const pilotExecution = await ctx.task(supportPilotExecution, {
    implementationPlan,
    bufferManagementSystem,
    trainingProgram
  });
  artifacts.push({ phase: 'pilot-execution', output: pilotExecution });

  // Phase 10: Performance Measurement and Optimization
  const performanceAnalysis = await ctx.task(analyzePerformance, {
    pilotExecution,
    constraintInfo,
    productionData
  });
  artifacts.push({ phase: 'performance-analysis', output: performanceAnalysis });

  // Final Quality Gate: DBR System Approval
  await ctx.breakpoint('dbr-system-approval', {
    title: 'DBR System Full Approval',
    description: 'Final approval for DBR system rollout based on pilot results',
    artifacts: [pilotExecution, performanceAnalysis]
  });

  return {
    success: true,
    dbrDesign: {
      drumSchedule: drumDesign,
      bufferSizing: bufferDesign,
      ropeLogic: ropeLogic
    },
    bufferManagement: bufferManagementSystem,
    implementationPlan,
    performanceResults: performanceAnalysis,
    artifacts,
    metadata: {
      processId: 'drum-buffer-rope',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      constraintInfo
    }
  };
}

export const validateConstraint = defineTask('validate-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate System Constraint',
  agent: {
    name: 'toc-constraint-analyst',
    prompt: {
      role: 'Theory of Constraints specialist with expertise in constraint identification and validation',
      task: 'Validate the identified constraint and confirm it is the true system bottleneck',
      context: {
        constraintInfo: args.constraintInfo,
        productionData: args.productionData,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Analyze capacity data across all resources',
        'Validate the constraint using utilization and queue analysis',
        'Identify any wandering bottlenecks or interactive constraints',
        'Assess constraint stability over time',
        'Determine constraint exploitation potential',
        'Document constraint characteristics and behavior'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        constraintValidated: { type: 'boolean' },
        constraintAnalysis: { type: 'object' },
        exploitationOpportunities: { type: 'array' },
        stabilityAssessment: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['constraintValidated', 'constraintAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'constraint-validation']
}));

export const designDrumSchedule = defineTask('design-drum-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Drum Schedule',
  agent: {
    name: 'production-scheduler',
    prompt: {
      role: 'Production scheduling expert specializing in constraint-based scheduling',
      task: 'Design the drum schedule that sets the pace for the entire production system',
      context: {
        constraintValidation: args.constraintValidation,
        productionData: args.productionData,
        constraintInfo: args.constraintInfo
      },
      instructions: [
        'Develop constraint schedule based on market demand',
        'Optimize sequence for setup time reduction',
        'Incorporate planned maintenance windows',
        'Design batch sizing strategy for constraint',
        'Create drum beat intervals and timing',
        'Establish schedule update and revision protocols'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        drumSchedule: { type: 'object' },
        sequencingRules: { type: 'array' },
        batchSizingPolicy: { type: 'object' },
        maintenanceIntegration: { type: 'object' },
        scheduleProtocols: { type: 'object' }
      },
      required: ['drumSchedule', 'sequencingRules']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'drum']
}));

export const designBufferStrategy = defineTask('design-buffer-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Buffer Strategy',
  agent: {
    name: 'buffer-design-specialist',
    prompt: {
      role: 'TOC buffer management expert with statistical analysis capabilities',
      task: 'Design the buffer strategy including sizing, location, and management approach',
      context: {
        drumDesign: args.drumDesign,
        bufferPolicy: args.bufferPolicy,
        productionData: args.productionData,
        constraintInfo: args.constraintInfo
      },
      instructions: [
        'Calculate constraint buffer size based on variability analysis',
        'Design shipping buffer for on-time delivery protection',
        'Determine assembly buffer requirements if applicable',
        'Establish buffer penetration zones (green/yellow/red)',
        'Create buffer sizing adjustment algorithms',
        'Design dynamic buffer management approach'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        constraintBuffer: { type: 'object' },
        shippingBuffer: { type: 'object' },
        assemblyBuffers: { type: 'array' },
        penetrationZones: { type: 'object' },
        sizingAlgorithm: { type: 'object' },
        dynamicAdjustment: { type: 'object' }
      },
      required: ['constraintBuffer', 'shippingBuffer', 'penetrationZones']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'buffer-design', 'toc']
}));

export const developRopeLogic = defineTask('develop-rope-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Rope Logic',
  agent: {
    name: 'material-release-specialist',
    prompt: {
      role: 'Production control expert specializing in material release and WIP control',
      task: 'Develop the rope logic that controls material release into the system',
      context: {
        drumDesign: args.drumDesign,
        bufferDesign: args.bufferDesign,
        productionData: args.productionData
      },
      instructions: [
        'Calculate rope length (lead time offset from drum)',
        'Design material release authorization logic',
        'Create release timing algorithms',
        'Establish WIP cap policies',
        'Design expediting and priority rules',
        'Integrate with MRP/ERP release mechanisms'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        ropeLength: { type: 'object' },
        releaseLogic: { type: 'object' },
        timingAlgorithm: { type: 'object' },
        wipCaps: { type: 'object' },
        priorityRules: { type: 'array' },
        systemIntegration: { type: 'object' }
      },
      required: ['ropeLength', 'releaseLogic', 'wipCaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rope-logic', 'material-release']
}));

export const designSystemIntegration = defineTask('design-system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design System Integration',
  agent: {
    name: 'systems-integration-architect',
    prompt: {
      role: 'Manufacturing systems integration specialist',
      task: 'Design the integration of DBR with existing production systems',
      context: {
        drumDesign: args.drumDesign,
        bufferDesign: args.bufferDesign,
        ropeLogic: args.ropeLogic,
        implementationScope: args.implementationScope
      },
      instructions: [
        'Map integration points with ERP/MRP systems',
        'Design MES integration for real-time buffer tracking',
        'Create data exchange protocols and interfaces',
        'Design dashboard and visualization requirements',
        'Establish alert and notification systems',
        'Plan data migration and parallel running approach'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        erpIntegration: { type: 'object' },
        mesIntegration: { type: 'object' },
        dataProtocols: { type: 'array' },
        dashboardDesign: { type: 'object' },
        alertSystem: { type: 'object' },
        migrationPlan: { type: 'object' }
      },
      required: ['erpIntegration', 'mesIntegration', 'dashboardDesign']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration', 'systems']
}));

export const developBufferManagement = defineTask('develop-buffer-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Buffer Management System',
  agent: {
    name: 'buffer-management-specialist',
    prompt: {
      role: 'Buffer management expert with real-time monitoring experience',
      task: 'Develop the complete buffer management and monitoring system',
      context: {
        bufferDesign: args.bufferDesign,
        bufferPolicy: args.bufferPolicy,
        integrationDesign: args.integrationDesign
      },
      instructions: [
        'Design buffer status monitoring dashboards',
        'Create buffer penetration tracking mechanisms',
        'Develop recovery action protocols for each zone',
        'Establish buffer management meeting cadence',
        'Design root cause analysis for buffer holes',
        'Create continuous improvement feedback loops'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        monitoringDashboard: { type: 'object' },
        penetrationTracking: { type: 'object' },
        recoveryProtocols: { type: 'object' },
        meetingCadence: { type: 'object' },
        rcaProcess: { type: 'object' },
        improvementLoop: { type: 'object' }
      },
      required: ['monitoringDashboard', 'penetrationTracking', 'recoveryProtocols']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'buffer-management', 'monitoring']
}));

export const createImplementationPlan = defineTask('create-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Implementation Plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Change management and implementation specialist',
      task: 'Create comprehensive DBR implementation plan',
      context: {
        integrationDesign: args.integrationDesign,
        bufferManagementSystem: args.bufferManagementSystem,
        implementationScope: args.implementationScope,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Develop phased implementation roadmap',
        'Create detailed task breakdown and dependencies',
        'Identify resource requirements and assignments',
        'Establish milestones and success criteria',
        'Design change management approach',
        'Create risk mitigation strategies'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        roadmap: { type: 'object' },
        taskBreakdown: { type: 'array' },
        resourcePlan: { type: 'object' },
        milestones: { type: 'array' },
        changeManagement: { type: 'object' },
        riskMitigation: { type: 'array' }
      },
      required: ['roadmap', 'milestones', 'changeManagement']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'implementation', 'planning']
}));

export const developTrainingProgram = defineTask('develop-training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Training Program',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training and development specialist with TOC expertise',
      task: 'Develop comprehensive DBR training program for all stakeholders',
      context: {
        drumDesign: args.drumDesign,
        bufferManagementSystem: args.bufferManagementSystem,
        ropeLogic: args.ropeLogic,
        implementationScope: args.implementationScope
      },
      instructions: [
        'Design role-based training curriculum',
        'Create TOC fundamentals training module',
        'Develop DBR mechanics training',
        'Create buffer management training for supervisors',
        'Design hands-on simulation exercises',
        'Establish competency assessment criteria'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        curriculum: { type: 'object' },
        trainingModules: { type: 'array' },
        simulations: { type: 'array' },
        assessmentCriteria: { type: 'object' },
        trainingSchedule: { type: 'object' }
      },
      required: ['curriculum', 'trainingModules', 'assessmentCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training', 'development']
}));

export const supportPilotExecution = defineTask('support-pilot-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support Pilot Execution',
  agent: {
    name: 'pilot-execution-coach',
    prompt: {
      role: 'Implementation coach with DBR pilot experience',
      task: 'Support the pilot execution and provide real-time guidance',
      context: {
        implementationPlan: args.implementationPlan,
        bufferManagementSystem: args.bufferManagementSystem,
        trainingProgram: args.trainingProgram
      },
      instructions: [
        'Monitor pilot execution against plan',
        'Provide real-time coaching and problem-solving',
        'Track buffer performance and behavior',
        'Document lessons learned and adjustments',
        'Facilitate daily and weekly review meetings',
        'Prepare pilot completion report'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        executionStatus: { type: 'object' },
        bufferPerformance: { type: 'object' },
        lessonsLearned: { type: 'array' },
        adjustmentsMade: { type: 'array' },
        pilotReport: { type: 'object' }
      },
      required: ['executionStatus', 'bufferPerformance', 'pilotReport']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot', 'execution']
}));

export const analyzePerformance = defineTask('analyze-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze DBR Performance',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Operations performance analyst with TOC metrics expertise',
      task: 'Analyze DBR system performance and quantify improvements',
      context: {
        pilotExecution: args.pilotExecution,
        constraintInfo: args.constraintInfo,
        productionData: args.productionData
      },
      instructions: [
        'Calculate throughput improvement metrics',
        'Measure WIP reduction achieved',
        'Analyze lead time compression',
        'Assess on-time delivery improvement',
        'Calculate financial impact (throughput dollars)',
        'Provide recommendations for full rollout'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        throughputImprovement: { type: 'number' },
        wipReduction: { type: 'number' },
        leadTimeReduction: { type: 'number' },
        deliveryImprovement: { type: 'number' },
        financialImpact: { type: 'object' },
        rolloutRecommendations: { type: 'array' }
      },
      required: ['throughputImprovement', 'wipReduction', 'leadTimeReduction']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'analysis']
}));
