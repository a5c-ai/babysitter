/**
 * @process specializations/domains/business/operations/operational-excellence
 * @description Operational Excellence Program Design Process - Design comprehensive operational excellence program with
 * governance, methodology deployment, and capability building for sustained organizational improvement.
 * @inputs { organizationName: string, scope?: string, maturityLevel?: string, focusAreas?: array }
 * @outputs { success: boolean, programDesign: object, governanceModel: object, deploymentPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/operational-excellence', {
 *   organizationName: 'ABC Manufacturing',
 *   scope: 'enterprise-wide',
 *   maturityLevel: 'emerging',
 *   focusAreas: ['lean', 'six-sigma', 'tpm']
 * });
 *
 * @references
 * - Shingo Model for Operational Excellence
 * - Lean Enterprise Institute
 * - ASQ Body of Knowledge
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    scope = 'enterprise-wide',
    maturityLevel = 'emerging',
    focusAreas = ['lean', 'quality', 'continuous-improvement'],
    timeline = '3-years',
    outputDir = 'opex-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Operational Excellence Program Design for: ${organizationName}`);

  // Phase 1: Maturity Assessment
  ctx.log('info', 'Phase 1: Operational Excellence Maturity Assessment');
  const maturityAssessment = await ctx.task(maturityAssessmentTask, {
    organizationName,
    scope,
    maturityLevel,
    outputDir
  });

  artifacts.push(...maturityAssessment.artifacts);

  // Phase 2: Vision and Strategy
  ctx.log('info', 'Phase 2: OpEx Vision and Strategy Development');
  const visionStrategy = await ctx.task(visionStrategyTask, {
    organizationName,
    maturityAssessment,
    focusAreas,
    timeline,
    outputDir
  });

  artifacts.push(...visionStrategy.artifacts);

  // Quality Gate: Vision and Strategy Review
  await ctx.breakpoint({
    question: `OpEx vision defined. Current maturity: ${maturityAssessment.overallMaturity}. Target maturity: ${visionStrategy.targetMaturity}. Focus areas: ${focusAreas.join(', ')}. Approve vision and strategy?`,
    title: 'OpEx Vision and Strategy Review',
    context: {
      runId: ctx.runId,
      organizationName,
      maturityAssessment: maturityAssessment.summary,
      vision: visionStrategy.vision,
      strategy: visionStrategy.strategy,
      files: [...maturityAssessment.artifacts, ...visionStrategy.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Governance Model Design
  ctx.log('info', 'Phase 3: Governance Model Design');
  const governanceModel = await ctx.task(governanceModelTask, {
    organizationName,
    scope,
    visionStrategy,
    outputDir
  });

  artifacts.push(...governanceModel.artifacts);

  // Phase 4: Methodology Framework
  ctx.log('info', 'Phase 4: Methodology Framework Development');
  const methodologyFramework = await ctx.task(methodologyFrameworkTask, {
    organizationName,
    focusAreas,
    visionStrategy,
    outputDir
  });

  artifacts.push(...methodologyFramework.artifacts);

  // Phase 5: Capability Building Plan
  ctx.log('info', 'Phase 5: Capability Building Plan');
  const capabilityPlan = await ctx.task(capabilityBuildingTask, {
    organizationName,
    methodologyFramework,
    visionStrategy,
    outputDir
  });

  artifacts.push(...capabilityPlan.artifacts);

  // Phase 6: Deployment Roadmap
  ctx.log('info', 'Phase 6: Deployment Roadmap');
  const deploymentRoadmap = await ctx.task(deploymentRoadmapTask, {
    organizationName,
    visionStrategy,
    governanceModel,
    methodologyFramework,
    capabilityPlan,
    timeline,
    outputDir
  });

  artifacts.push(...deploymentRoadmap.artifacts);

  // Quality Gate: Program Design Review
  await ctx.breakpoint({
    question: `OpEx program designed. Governance: ${governanceModel.governanceType}. Methodologies: ${methodologyFramework.methodologies.length}. Deployment phases: ${deploymentRoadmap.phases.length}. Review program design?`,
    title: 'Operational Excellence Program Review',
    context: {
      runId: ctx.runId,
      organizationName,
      governance: governanceModel.summary,
      methodologies: methodologyFramework.methodologies,
      deployment: deploymentRoadmap.summary,
      files: [...governanceModel.artifacts, ...deploymentRoadmap.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Metrics and KPIs
  ctx.log('info', 'Phase 7: Metrics and KPIs Design');
  const metricsDesign = await ctx.task(metricsDesignTask, {
    organizationName,
    focusAreas,
    visionStrategy,
    outputDir
  });

  artifacts.push(...metricsDesign.artifacts);

  // Phase 8: Communication Plan
  ctx.log('info', 'Phase 8: Communication and Change Management');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    organizationName,
    visionStrategy,
    deploymentRoadmap,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // Phase 9: Sustainability Mechanisms
  ctx.log('info', 'Phase 9: Sustainability Mechanisms');
  const sustainability = await ctx.task(sustainabilityTask, {
    organizationName,
    governanceModel,
    metricsDesign,
    outputDir
  });

  artifacts.push(...sustainability.artifacts);

  // Phase 10: Program Report
  ctx.log('info', 'Phase 10: Program Design Report');
  const report = await ctx.task(programReportTask, {
    organizationName,
    maturityAssessment,
    visionStrategy,
    governanceModel,
    methodologyFramework,
    capabilityPlan,
    deploymentRoadmap,
    metricsDesign,
    communicationPlan,
    sustainability,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    scope,
    programDesign: {
      vision: visionStrategy.vision,
      strategy: visionStrategy.strategy,
      currentMaturity: maturityAssessment.overallMaturity,
      targetMaturity: visionStrategy.targetMaturity,
      focusAreas: methodologyFramework.methodologies
    },
    governanceModel: {
      type: governanceModel.governanceType,
      structure: governanceModel.structure,
      roles: governanceModel.roles
    },
    methodologyFramework: {
      methodologies: methodologyFramework.methodologies,
      tools: methodologyFramework.tools,
      standards: methodologyFramework.standards
    },
    capabilityPlan: {
      beltSystem: capabilityPlan.beltSystem,
      trainingPrograms: capabilityPlan.trainingPrograms,
      certificationPath: capabilityPlan.certificationPath
    },
    deploymentPlan: {
      phases: deploymentRoadmap.phases,
      timeline: deploymentRoadmap.timeline,
      milestones: deploymentRoadmap.milestones
    },
    metrics: metricsDesign.kpis,
    sustainability: sustainability.mechanisms,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/operational-excellence',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Maturity Assessment
export const maturityAssessmentTask = defineTask('opex-maturity', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Maturity Assessment - ${args.organizationName}`,
  agent: {
    name: 'opex-assessor',
    prompt: {
      role: 'Operational Excellence Assessor',
      task: 'Assess current operational excellence maturity',
      context: args,
      instructions: [
        '1. Apply Shingo Model or similar framework',
        '2. Assess cultural enablers',
        '3. Assess continuous improvement maturity',
        '4. Assess enterprise alignment',
        '5. Assess results and outcomes',
        '6. Conduct leadership interviews',
        '7. Review existing initiatives',
        '8. Benchmark against industry',
        '9. Identify strengths and gaps',
        '10. Document maturity assessment'
      ],
      outputFormat: 'JSON with maturity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallMaturity', 'dimensionScores', 'summary', 'artifacts'],
      properties: {
        overallMaturity: { type: 'string' },
        maturityScore: { type: 'number' },
        dimensionScores: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        benchmarkComparison: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'maturity']
}));

// Task 2: Vision and Strategy
export const visionStrategyTask = defineTask('opex-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Vision and Strategy - ${args.organizationName}`,
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'OpEx Strategy Developer',
      task: 'Develop operational excellence vision and strategy',
      context: args,
      instructions: [
        '1. Define OpEx vision statement',
        '2. Align with business strategy',
        '3. Define strategic objectives',
        '4. Set target maturity level',
        '5. Identify strategic initiatives',
        '6. Define success measures',
        '7. Identify quick wins',
        '8. Plan transformation waves',
        '9. Get leadership alignment',
        '10. Document vision and strategy'
      ],
      outputFormat: 'JSON with vision and strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'strategy', 'targetMaturity', 'objectives', 'artifacts'],
      properties: {
        vision: { type: 'string' },
        missionStatement: { type: 'string' },
        strategy: { type: 'object' },
        targetMaturity: { type: 'string' },
        objectives: { type: 'array', items: { type: 'object' } },
        strategicInitiatives: { type: 'array', items: { type: 'object' } },
        successMeasures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'vision', 'strategy']
}));

// Task 3: Governance Model
export const governanceModelTask = defineTask('opex-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Governance Model - ${args.organizationName}`,
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'OpEx Governance Designer',
      task: 'Design operational excellence governance model',
      context: args,
      instructions: [
        '1. Define governance structure',
        '2. Establish steering committee',
        '3. Define roles and responsibilities',
        '4. Design review cadence',
        '5. Define escalation paths',
        '6. Establish project selection criteria',
        '7. Define resource allocation model',
        '8. Create reporting structure',
        '9. Define recognition mechanisms',
        '10. Document governance model'
      ],
      outputFormat: 'JSON with governance model'
    },
    outputSchema: {
      type: 'object',
      required: ['governanceType', 'structure', 'roles', 'summary', 'artifacts'],
      properties: {
        governanceType: { type: 'string' },
        structure: { type: 'object' },
        steeringCommittee: { type: 'object' },
        roles: { type: 'array', items: { type: 'object' } },
        reviewCadence: { type: 'object' },
        projectSelection: { type: 'object' },
        resourceAllocation: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'governance']
}));

// Task 4: Methodology Framework
export const methodologyFrameworkTask = defineTask('opex-methodology', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Methodology Framework - ${args.organizationName}`,
  agent: {
    name: 'methodology-architect',
    prompt: {
      role: 'OpEx Methodology Architect',
      task: 'Design operational excellence methodology framework',
      context: args,
      instructions: [
        '1. Select core methodologies (Lean, Six Sigma, TPM)',
        '2. Integrate methodologies into unified approach',
        '3. Define standard tools and templates',
        '4. Create project execution roadmaps',
        '5. Define problem-solving hierarchy',
        '6. Establish standard work for CI',
        '7. Define knowledge management approach',
        '8. Create playbooks for common scenarios',
        '9. Establish best practice sharing',
        '10. Document methodology framework'
      ],
      outputFormat: 'JSON with methodology framework'
    },
    outputSchema: {
      type: 'object',
      required: ['methodologies', 'tools', 'standards', 'artifacts'],
      properties: {
        methodologies: { type: 'array', items: { type: 'object' } },
        integratedApproach: { type: 'object' },
        tools: { type: 'array', items: { type: 'object' } },
        standards: { type: 'array', items: { type: 'object' } },
        projectRoadmaps: { type: 'array', items: { type: 'object' } },
        playbooks: { type: 'array', items: { type: 'object' } },
        knowledgeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'methodology']
}));

// Task 5: Capability Building
export const capabilityBuildingTask = defineTask('opex-capability', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Capability Building - ${args.organizationName}`,
  agent: {
    name: 'capability-planner',
    prompt: {
      role: 'OpEx Capability Development Planner',
      task: 'Design capability building program',
      context: args,
      instructions: [
        '1. Design belt certification system',
        '2. Create training curriculum',
        '3. Define competency requirements',
        '4. Plan coaching/mentoring structure',
        '5. Design train-the-trainer program',
        '6. Plan expert development path',
        '7. Design practitioner development',
        '8. Create skills matrix',
        '9. Plan certification process',
        '10. Document capability plan'
      ],
      outputFormat: 'JSON with capability plan'
    },
    outputSchema: {
      type: 'object',
      required: ['beltSystem', 'trainingPrograms', 'certificationPath', 'artifacts'],
      properties: {
        beltSystem: {
          type: 'object',
          properties: {
            whiteBelt: { type: 'object' },
            yellowBelt: { type: 'object' },
            greenBelt: { type: 'object' },
            blackBelt: { type: 'object' },
            masterBlackBelt: { type: 'object' }
          }
        },
        trainingPrograms: { type: 'array', items: { type: 'object' } },
        certificationPath: { type: 'object' },
        coachingStructure: { type: 'object' },
        skillsMatrix: { type: 'object' },
        targetHeadcount: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'capability']
}));

// Task 6: Deployment Roadmap
export const deploymentRoadmapTask = defineTask('opex-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Deployment Roadmap - ${args.organizationName}`,
  agent: {
    name: 'deployment-planner',
    prompt: {
      role: 'OpEx Deployment Planner',
      task: 'Create deployment roadmap',
      context: args,
      instructions: [
        '1. Define deployment phases',
        '2. Plan pilot sites/areas',
        '3. Create phased rollout plan',
        '4. Define resource requirements',
        '5. Set milestones and checkpoints',
        '6. Plan change management activities',
        '7. Define success criteria per phase',
        '8. Plan scaling approach',
        '9. Create detailed timeline',
        '10. Document deployment roadmap'
      ],
      outputFormat: 'JSON with deployment roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'milestones', 'summary', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        pilotSites: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        resourceRequirements: { type: 'object' },
        scalingApproach: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'deployment']
}));

// Task 7: Metrics Design
export const metricsDesignTask = defineTask('opex-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Metrics Design - ${args.organizationName}`,
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'OpEx Metrics Designer',
      task: 'Design metrics and KPIs for OpEx program',
      context: args,
      instructions: [
        '1. Define program-level KPIs',
        '2. Define operational KPIs',
        '3. Create balanced scorecard',
        '4. Design reporting dashboards',
        '5. Define measurement methodology',
        '6. Set targets and thresholds',
        '7. Plan data collection',
        '8. Design review process',
        '9. Create visual management standards',
        '10. Document metrics framework'
      ],
      outputFormat: 'JSON with metrics design'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'balancedScorecard', 'dashboards', 'artifacts'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        programKpis: { type: 'array', items: { type: 'object' } },
        operationalKpis: { type: 'array', items: { type: 'object' } },
        balancedScorecard: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        measurementMethodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'metrics']
}));

// Task 8: Communication Plan
export const communicationPlanTask = defineTask('opex-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Communication Plan - ${args.organizationName}`,
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'Change Communication Planner',
      task: 'Develop communication and change management plan',
      context: args,
      instructions: [
        '1. Identify stakeholder groups',
        '2. Develop key messages',
        '3. Plan communication channels',
        '4. Create communication calendar',
        '5. Design awareness campaign',
        '6. Plan leadership communication',
        '7. Design recognition/celebration events',
        '8. Plan feedback mechanisms',
        '9. Create change management approach',
        '10. Document communication plan'
      ],
      outputFormat: 'JSON with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'keyMessages', 'channels', 'calendar', 'artifacts'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        keyMessages: { type: 'array', items: { type: 'object' } },
        channels: { type: 'array', items: { type: 'string' } },
        calendar: { type: 'array', items: { type: 'object' } },
        awarenessCampaign: { type: 'object' },
        changeManagement: { type: 'object' },
        recognitionEvents: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'communication']
}));

// Task 9: Sustainability
export const sustainabilityTask = defineTask('opex-sustainability', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Sustainability Mechanisms - ${args.organizationName}`,
  agent: {
    name: 'sustainability-planner',
    prompt: {
      role: 'OpEx Sustainability Planner',
      task: 'Design sustainability mechanisms',
      context: args,
      instructions: [
        '1. Design leader standard work for CI',
        '2. Create audit and assessment program',
        '3. Design recognition/reward system',
        '4. Plan knowledge retention',
        '5. Design succession planning',
        '6. Create benchmark/share best practices',
        '7. Plan periodic assessments',
        '8. Design culture reinforcement',
        '9. Create sustainability scorecard',
        '10. Document sustainability mechanisms'
      ],
      outputFormat: 'JSON with sustainability mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'leaderStandardWork', 'auditProgram', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'object' } },
        leaderStandardWork: { type: 'object' },
        auditProgram: { type: 'object' },
        recognitionSystem: { type: 'object' },
        knowledgeRetention: { type: 'object' },
        successionPlanning: { type: 'object' },
        cultureReinforcement: { type: 'object' },
        sustainabilityScorecard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'sustainability']
}));

// Task 10: Program Report
export const programReportTask = defineTask('opex-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `OpEx Program Report - ${args.organizationName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive OpEx program report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Present maturity assessment',
        '3. Document vision and strategy',
        '4. Present governance model',
        '5. Document methodology framework',
        '6. Present capability building plan',
        '7. Detail deployment roadmap',
        '8. Document metrics and KPIs',
        '9. Present sustainability mechanisms',
        '10. Format as professional program charter'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        programCharter: { type: 'object' },
        keyDeliverables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'opex', 'reporting']
}));
