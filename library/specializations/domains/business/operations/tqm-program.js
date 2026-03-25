/**
 * @process specializations/domains/business/operations/tqm-program
 * @description Total Quality Management (TQM) Program Development for establishing a
 *              comprehensive quality culture. Integrates customer focus, continuous
 *              improvement, employee involvement, and process management.
 * @inputs {
 *   organizationContext: { industry: string, size: string, currentMaturity: string },
 *   qualityState: { currentPrograms: object[], painPoints: string[], customerFeedback: object },
 *   strategicGoals: { qualityVision: string, targetMetrics: object, timeline: string },
 *   stakeholders: { leadership: object[], employees: object[], customers: object[] },
 *   resources: { budget: number, trainingCapacity: number, systemsAvailable: string[] }
 * }
 * @outputs {
 *   tqmFramework: { principles: object[], pillars: object[], governance: object },
 *   implementationPlan: { phases: object[], milestones: object[], resources: object },
 *   trainingProgram: { curriculum: object[], materials: object[], schedule: object },
 *   measurementSystem: { metrics: object[], dashboards: object[], reviewCadence: object }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "manufacturing", size: "500-employees", currentMaturity: "basic" },
 *   qualityState: { currentPrograms: [...], painPoints: [...], customerFeedback: {...} },
 *   strategicGoals: { qualityVision: "Zero-defect-culture", targetMetrics: {...}, timeline: "3-years" },
 *   stakeholders: { leadership: [...], employees: [...], customers: [...] },
 *   resources: { budget: 500000, trainingCapacity: 50, systemsAvailable: [...] }
 * }
 * @references Deming's 14 Points, Juran Trilogy, Baldrige Excellence Framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, qualityState, strategicGoals, stakeholders, resources } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task(assessCurrentState, {
    qualityState,
    organizationContext
  });
  artifacts.push({ phase: 'current-state', output: currentStateAssessment });

  // Phase 2: Gap Analysis
  const gapAnalysis = await ctx.task(analyzeGaps, {
    currentStateAssessment,
    strategicGoals
  });
  artifacts.push({ phase: 'gap-analysis', output: gapAnalysis });

  // Phase 3: TQM Vision and Principles Development
  const tqmVision = await ctx.task(developTQMVision, {
    strategicGoals,
    gapAnalysis,
    organizationContext
  });
  artifacts.push({ phase: 'tqm-vision', output: tqmVision });

  // Phase 4: TQM Framework Design
  const tqmFramework = await ctx.task(designTQMFramework, {
    tqmVision,
    gapAnalysis,
    organizationContext
  });
  artifacts.push({ phase: 'tqm-framework', output: tqmFramework });

  // Quality Gate: Framework Review
  await ctx.breakpoint('tqm-framework-review', {
    title: 'TQM Framework Review',
    description: 'Review and approve TQM framework before implementation planning',
    artifacts: [tqmVision, tqmFramework, gapAnalysis]
  });

  // Phase 5: Governance Structure Design
  const governanceStructure = await ctx.task(designGovernance, {
    tqmFramework,
    stakeholders,
    organizationContext
  });
  artifacts.push({ phase: 'governance', output: governanceStructure });

  // Phase 6: Process Management System
  const processManagement = await ctx.task(designProcessManagement, {
    tqmFramework,
    qualityState,
    strategicGoals
  });
  artifacts.push({ phase: 'process-management', output: processManagement });

  // Phase 7: Employee Involvement Program
  const employeeInvolvement = await ctx.task(designEmployeeInvolvement, {
    tqmFramework,
    stakeholders,
    resources
  });
  artifacts.push({ phase: 'employee-involvement', output: employeeInvolvement });

  // Phase 8: Customer Focus Program
  const customerFocus = await ctx.task(designCustomerFocus, {
    tqmFramework,
    qualityState,
    stakeholders
  });
  artifacts.push({ phase: 'customer-focus', output: customerFocus });

  // Phase 9: Continuous Improvement System
  const continuousImprovement = await ctx.task(designContinuousImprovement, {
    tqmFramework,
    processManagement,
    employeeInvolvement
  });
  artifacts.push({ phase: 'continuous-improvement', output: continuousImprovement });

  // Phase 10: Training Program Development
  const trainingProgram = await ctx.task(developTrainingProgram, {
    tqmFramework,
    employeeInvolvement,
    resources
  });
  artifacts.push({ phase: 'training-program', output: trainingProgram });

  // Phase 11: Measurement System Design
  const measurementSystem = await ctx.task(designMeasurementSystem, {
    tqmFramework,
    strategicGoals,
    processManagement
  });
  artifacts.push({ phase: 'measurement-system', output: measurementSystem });

  // Phase 12: Implementation Roadmap
  const implementationRoadmap = await ctx.task(createImplementationRoadmap, {
    tqmFramework,
    governanceStructure,
    trainingProgram,
    resources,
    strategicGoals
  });
  artifacts.push({ phase: 'implementation-roadmap', output: implementationRoadmap });

  // Phase 13: Communication Strategy
  const communicationStrategy = await ctx.task(developCommunicationStrategy, {
    tqmFramework,
    stakeholders,
    implementationRoadmap
  });
  artifacts.push({ phase: 'communication-strategy', output: communicationStrategy });

  // Final Quality Gate: TQM Program Approval
  await ctx.breakpoint('tqm-program-approval', {
    title: 'TQM Program Approval',
    description: 'Final approval of complete TQM program before launch',
    artifacts: [implementationRoadmap, trainingProgram, measurementSystem]
  });

  return {
    success: true,
    tqmFramework: {
      principles: tqmVision.principles,
      pillars: tqmFramework.pillars,
      governance: governanceStructure
    },
    implementationPlan: implementationRoadmap,
    trainingProgram,
    measurementSystem,
    programComponents: {
      processManagement,
      employeeInvolvement,
      customerFocus,
      continuousImprovement
    },
    communicationStrategy,
    artifacts,
    metadata: {
      processId: 'tqm-program',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      strategicGoals
    }
  };
}

export const assessCurrentState = defineTask('assess-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Current Quality State',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Quality management assessment specialist',
      task: 'Assess current state of quality management practices',
      context: {
        qualityState: args.qualityState,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Evaluate existing quality programs',
        'Assess quality culture maturity',
        'Review current metrics and performance',
        'Identify strengths and weaknesses',
        'Benchmark against industry standards',
        'Document improvement opportunities'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        programAssessment: { type: 'object' },
        maturityLevel: { type: 'string' },
        currentPerformance: { type: 'object' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        opportunities: { type: 'array' }
      },
      required: ['maturityLevel', 'strengths', 'weaknesses', 'opportunities']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assessment', 'quality']
}));

export const analyzeGaps = defineTask('analyze-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Quality Gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Quality gap analysis specialist',
      task: 'Analyze gaps between current state and strategic goals',
      context: {
        currentStateAssessment: args.currentStateAssessment,
        strategicGoals: args.strategicGoals
      },
      instructions: [
        'Compare current state to target state',
        'Identify capability gaps',
        'Assess resource gaps',
        'Identify cultural gaps',
        'Prioritize gaps by impact',
        'Document gap closure requirements'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        capabilityGaps: { type: 'array' },
        resourceGaps: { type: 'array' },
        culturalGaps: { type: 'array' },
        systemGaps: { type: 'array' },
        prioritizedGaps: { type: 'array' },
        closureRequirements: { type: 'object' }
      },
      required: ['capabilityGaps', 'prioritizedGaps', 'closureRequirements']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gap', 'analysis']
}));

export const developTQMVision = defineTask('develop-tqm-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop TQM Vision',
  agent: {
    name: 'quality-strategist',
    prompt: {
      role: 'Quality strategy and vision specialist',
      task: 'Develop TQM vision, mission, and guiding principles',
      context: {
        strategicGoals: args.strategicGoals,
        gapAnalysis: args.gapAnalysis,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Craft compelling quality vision',
        'Define TQM mission statement',
        'Establish guiding principles',
        'Define quality values',
        'Create quality policy',
        'Document leadership commitment'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        vision: { type: 'string' },
        mission: { type: 'string' },
        principles: { type: 'array' },
        values: { type: 'array' },
        qualityPolicy: { type: 'string' },
        leadershipCommitment: { type: 'object' }
      },
      required: ['vision', 'mission', 'principles', 'qualityPolicy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vision', 'strategy']
}));

export const designTQMFramework = defineTask('design-tqm-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design TQM Framework',
  agent: {
    name: 'tqm-architect',
    prompt: {
      role: 'TQM framework design specialist',
      task: 'Design comprehensive TQM framework structure',
      context: {
        tqmVision: args.tqmVision,
        gapAnalysis: args.gapAnalysis,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Define TQM pillars (Customer Focus, Process, People, Improvement)',
        'Design integration mechanisms',
        'Create framework components',
        'Define interfaces and linkages',
        'Establish enabling systems',
        'Document framework architecture'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        pillars: { type: 'array' },
        components: { type: 'array' },
        integrationMechanisms: { type: 'array' },
        interfaces: { type: 'object' },
        enablingSystems: { type: 'array' },
        frameworkDiagram: { type: 'object' }
      },
      required: ['pillars', 'components', 'integrationMechanisms']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'framework', 'design']
}));

export const designGovernance = defineTask('design-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Governance Structure',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'Quality governance specialist',
      task: 'Design TQM governance structure',
      context: {
        tqmFramework: args.tqmFramework,
        stakeholders: args.stakeholders,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Design quality council structure',
        'Define roles and responsibilities',
        'Establish decision rights',
        'Create review and approval processes',
        'Design escalation mechanisms',
        'Document governance charter'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        councilStructure: { type: 'object' },
        rolesResponsibilities: { type: 'array' },
        decisionRights: { type: 'object' },
        reviewProcesses: { type: 'array' },
        escalationProcedures: { type: 'array' },
        governanceCharter: { type: 'object' }
      },
      required: ['councilStructure', 'rolesResponsibilities', 'governanceCharter']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'structure']
}));

export const designProcessManagement = defineTask('design-process-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Process Management System',
  agent: {
    name: 'process-management-designer',
    prompt: {
      role: 'Process management system designer',
      task: 'Design process management approach for TQM',
      context: {
        tqmFramework: args.tqmFramework,
        qualityState: args.qualityState,
        strategicGoals: args.strategicGoals
      },
      instructions: [
        'Define process hierarchy',
        'Design process documentation standards',
        'Create process ownership model',
        'Establish process measurement approach',
        'Design process improvement methodology',
        'Document process management system'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        processHierarchy: { type: 'object' },
        documentationStandards: { type: 'object' },
        ownershipModel: { type: 'object' },
        measurementApproach: { type: 'object' },
        improvementMethodology: { type: 'object' },
        systemDocumentation: { type: 'object' }
      },
      required: ['processHierarchy', 'ownershipModel', 'improvementMethodology']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'process', 'management']
}));

export const designEmployeeInvolvement = defineTask('design-employee-involvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Employee Involvement Program',
  agent: {
    name: 'employee-involvement-designer',
    prompt: {
      role: 'Employee involvement program specialist',
      task: 'Design employee involvement and engagement programs',
      context: {
        tqmFramework: args.tqmFramework,
        stakeholders: args.stakeholders,
        resources: args.resources
      },
      instructions: [
        'Design quality circles program',
        'Create suggestion system',
        'Design recognition and rewards',
        'Establish empowerment guidelines',
        'Create team-based improvement structure',
        'Document involvement mechanisms'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        qualityCircles: { type: 'object' },
        suggestionSystem: { type: 'object' },
        recognitionRewards: { type: 'object' },
        empowermentGuidelines: { type: 'object' },
        teamStructure: { type: 'object' },
        involvementMechanisms: { type: 'array' }
      },
      required: ['qualityCircles', 'suggestionSystem', 'recognitionRewards']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'employee', 'involvement']
}));

export const designCustomerFocus = defineTask('design-customer-focus', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Customer Focus Program',
  agent: {
    name: 'customer-focus-designer',
    prompt: {
      role: 'Customer focus program specialist',
      task: 'Design customer focus and satisfaction programs',
      context: {
        tqmFramework: args.tqmFramework,
        qualityState: args.qualityState,
        stakeholders: args.stakeholders
      },
      instructions: [
        'Design voice of customer system',
        'Create customer satisfaction measurement',
        'Design complaint management process',
        'Establish customer feedback loops',
        'Create customer requirements translation',
        'Document customer focus mechanisms'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        vocSystem: { type: 'object' },
        satisfactionMeasurement: { type: 'object' },
        complaintManagement: { type: 'object' },
        feedbackLoops: { type: 'array' },
        requirementsTranslation: { type: 'object' },
        customerMechanisms: { type: 'array' }
      },
      required: ['vocSystem', 'satisfactionMeasurement', 'complaintManagement']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer', 'focus']
}));

export const designContinuousImprovement = defineTask('design-continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Continuous Improvement System',
  agent: {
    name: 'ci-designer',
    prompt: {
      role: 'Continuous improvement system designer',
      task: 'Design continuous improvement system for TQM',
      context: {
        tqmFramework: args.tqmFramework,
        processManagement: args.processManagement,
        employeeInvolvement: args.employeeInvolvement
      },
      instructions: [
        'Design PDCA/PDSA application',
        'Create kaizen program structure',
        'Design breakthrough improvement approach',
        'Establish improvement project methodology',
        'Create improvement tracking system',
        'Document CI governance'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        pdcaApplication: { type: 'object' },
        kaizenProgram: { type: 'object' },
        breakthroughApproach: { type: 'object' },
        projectMethodology: { type: 'object' },
        trackingSystem: { type: 'object' },
        ciGovernance: { type: 'object' }
      },
      required: ['pdcaApplication', 'kaizenProgram', 'projectMethodology']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-improvement', 'design']
}));

export const developTrainingProgram = defineTask('develop-training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Training Program',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Quality training program developer',
      task: 'Develop comprehensive TQM training program',
      context: {
        tqmFramework: args.tqmFramework,
        employeeInvolvement: args.employeeInvolvement,
        resources: args.resources
      },
      instructions: [
        'Design role-based training curriculum',
        'Create leadership training modules',
        'Develop quality tools training',
        'Design team facilitation training',
        'Create awareness training',
        'Develop training delivery plan'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        curriculum: { type: 'object' },
        leadershipModules: { type: 'array' },
        toolsTraining: { type: 'array' },
        facilitationTraining: { type: 'object' },
        awarenessTraining: { type: 'object' },
        deliveryPlan: { type: 'object' }
      },
      required: ['curriculum', 'leadershipModules', 'toolsTraining', 'deliveryPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training', 'development']
}));

export const designMeasurementSystem = defineTask('design-measurement-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Measurement System',
  agent: {
    name: 'measurement-designer',
    prompt: {
      role: 'Quality measurement system designer',
      task: 'Design TQM measurement and metrics system',
      context: {
        tqmFramework: args.tqmFramework,
        strategicGoals: args.strategicGoals,
        processManagement: args.processManagement
      },
      instructions: [
        'Define key quality metrics',
        'Design balanced scorecard approach',
        'Create dashboard specifications',
        'Establish review cadence',
        'Design data collection methods',
        'Document measurement procedures'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        metrics: { type: 'array' },
        balancedScorecard: { type: 'object' },
        dashboards: { type: 'array' },
        reviewCadence: { type: 'object' },
        dataCollection: { type: 'object' },
        procedures: { type: 'array' }
      },
      required: ['metrics', 'balancedScorecard', 'reviewCadence']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'measurement', 'metrics']
}));

export const createImplementationRoadmap = defineTask('create-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Implementation Roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'TQM implementation planning specialist',
      task: 'Create comprehensive TQM implementation roadmap',
      context: {
        tqmFramework: args.tqmFramework,
        governanceStructure: args.governanceStructure,
        trainingProgram: args.trainingProgram,
        resources: args.resources,
        strategicGoals: args.strategicGoals
      },
      instructions: [
        'Define implementation phases',
        'Create detailed timeline',
        'Allocate resources by phase',
        'Establish milestones and gates',
        'Identify risks and mitigations',
        'Document success criteria'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        resourceAllocation: { type: 'object' },
        milestones: { type: 'array' },
        risksMitigations: { type: 'array' },
        successCriteria: { type: 'object' }
      },
      required: ['phases', 'timeline', 'milestones', 'successCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'implementation', 'roadmap']
}));

export const developCommunicationStrategy = defineTask('develop-communication-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Communication Strategy',
  agent: {
    name: 'communication-strategist',
    prompt: {
      role: 'Change communication specialist',
      task: 'Develop TQM communication and change strategy',
      context: {
        tqmFramework: args.tqmFramework,
        stakeholders: args.stakeholders,
        implementationRoadmap: args.implementationRoadmap
      },
      instructions: [
        'Identify communication audiences',
        'Design key messages by audience',
        'Create communication calendar',
        'Design feedback channels',
        'Plan launch campaign',
        'Document communication protocols'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        audiences: { type: 'array' },
        keyMessages: { type: 'object' },
        communicationCalendar: { type: 'object' },
        feedbackChannels: { type: 'array' },
        launchCampaign: { type: 'object' },
        protocols: { type: 'array' }
      },
      required: ['audiences', 'keyMessages', 'communicationCalendar', 'launchCampaign']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'communication', 'strategy']
}));
