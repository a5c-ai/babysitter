/**
 * @process specializations/domains/business/human-resources/continuous-feedback-checkins
 * @description Continuous Feedback and Check-ins Process - Framework for ongoing manager-employee conversations,
 * real-time feedback, and regular one-on-one meetings to replace or supplement annual reviews.
 * @inputs { organizationName: string, checkInCadence: string, feedbackCulture: string, departments: array }
 * @outputs { success: boolean, programDesign: object, adoptionMetrics: object, feedbackVolume: object, engagementImpact: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/continuous-feedback-checkins', {
 *   organizationName: 'TechCorp',
 *   checkInCadence: 'weekly',
 *   feedbackCulture: 'growth-oriented',
 *   departments: ['Engineering', 'Sales', 'Marketing']
 * });
 *
 * @references
 * - 15Five Continuous Performance: https://www.15five.com/blog/continuous-performance-management/
 * - Culture Amp Feedback: https://www.cultureamp.com/blog/continuous-feedback
 * - Lattice One-on-Ones: https://lattice.com/library/one-on-one-meetings
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    checkInCadence = 'weekly', // 'weekly', 'bi-weekly', 'monthly'
    feedbackCulture = 'growth-oriented',
    departments,
    includePeerFeedback = true,
    includeRecognition = true,
    integrateWithGoals = true,
    outputDir = 'continuous-feedback-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Continuous Feedback and Check-ins Program for ${organizationName}`);

  // Phase 1: Program Design and Framework
  const programDesign = await ctx.task(programDesignTask, {
    organizationName,
    checkInCadence,
    feedbackCulture,
    includePeerFeedback,
    includeRecognition,
    integrateWithGoals,
    outputDir
  });

  artifacts.push(...programDesign.artifacts);

  await ctx.breakpoint({
    question: `Continuous feedback program designed with ${checkInCadence} check-ins. Review program framework before implementation?`,
    title: 'Program Design Review',
    context: {
      runId: ctx.runId,
      programFramework: programDesign.framework,
      checkInStructure: programDesign.checkInStructure,
      feedbackTypes: programDesign.feedbackTypes,
      files: programDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: One-on-One Meeting Framework
  const oneOnOneFramework = await ctx.task(oneOnOneFrameworkTask, {
    organizationName,
    checkInCadence,
    integrateWithGoals,
    outputDir
  });

  artifacts.push(...oneOnOneFramework.artifacts);

  // Phase 3: Real-Time Feedback System
  const feedbackSystem = await ctx.task(feedbackSystemTask, {
    organizationName,
    feedbackCulture,
    includePeerFeedback,
    outputDir
  });

  artifacts.push(...feedbackSystem.artifacts);

  // Phase 4: Recognition Program Integration
  let recognitionProgram = null;
  if (includeRecognition) {
    recognitionProgram = await ctx.task(recognitionProgramTask, {
      organizationName,
      feedbackCulture,
      departments,
      outputDir
    });

    artifacts.push(...recognitionProgram.artifacts);
  }

  // Phase 5: Manager Training Program
  const managerTraining = await ctx.task(managerTrainingTask, {
    organizationName,
    oneOnOneFramework: oneOnOneFramework.framework,
    feedbackSystem: feedbackSystem.system,
    outputDir
  });

  artifacts.push(...managerTraining.artifacts);

  await ctx.breakpoint({
    question: `Manager training program developed with ${managerTraining.modules.length} modules. Review and approve training content?`,
    title: 'Manager Training Review',
    context: {
      runId: ctx.runId,
      trainingModules: managerTraining.modules,
      skillsTargeted: managerTraining.skillsTargeted,
      deliveryFormat: managerTraining.deliveryFormat,
      files: managerTraining.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Technology Platform Setup
  const platformSetup = await ctx.task(platformSetupTask, {
    organizationName,
    programDesign: programDesign.framework,
    oneOnOneFramework: oneOnOneFramework.framework,
    feedbackSystem: feedbackSystem.system,
    outputDir
  });

  artifacts.push(...platformSetup.artifacts);

  // Phase 7: Communication and Launch Plan
  const launchPlan = await ctx.task(launchPlanTask, {
    organizationName,
    departments,
    programDesign: programDesign.framework,
    managerTraining: managerTraining.program,
    outputDir
  });

  artifacts.push(...launchPlan.artifacts);

  // Phase 8: Pilot Program Execution
  const pilotProgram = await ctx.task(pilotProgramTask, {
    organizationName,
    departments,
    programDesign: programDesign.framework,
    oneOnOneFramework: oneOnOneFramework.framework,
    outputDir
  });

  artifacts.push(...pilotProgram.artifacts);

  await ctx.breakpoint({
    question: `Pilot program completed with ${pilotProgram.participants} participants. Adoption rate: ${pilotProgram.adoptionRate}%. Review pilot results before full rollout?`,
    title: 'Pilot Program Review',
    context: {
      runId: ctx.runId,
      adoptionRate: pilotProgram.adoptionRate,
      feedbackReceived: pilotProgram.feedbackReceived,
      improvements: pilotProgram.improvements,
      files: pilotProgram.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Full Rollout
  const fullRollout = await ctx.task(fullRolloutTask, {
    organizationName,
    departments,
    programDesign: programDesign.framework,
    pilotLearnings: pilotProgram.learnings,
    outputDir
  });

  artifacts.push(...fullRollout.artifacts);

  // Phase 10: Adoption Monitoring
  const adoptionMonitoring = await ctx.task(adoptionMonitoringTask, {
    organizationName,
    departments,
    checkInCadence,
    outputDir
  });

  artifacts.push(...adoptionMonitoring.artifacts);

  // Phase 11: Quality and Impact Assessment
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    organizationName,
    adoptionMonitoring,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // Phase 12: Continuous Improvement
  const continuousImprovement = await ctx.task(continuousImprovementTask, {
    organizationName,
    adoptionMonitoring,
    impactAssessment,
    outputDir
  });

  artifacts.push(...continuousImprovement.artifacts);

  return {
    success: true,
    organizationName,
    programDesign: programDesign.framework,
    checkInCadence,
    feedbackCulture,
    adoptionMetrics: {
      overallAdoption: adoptionMonitoring.overallAdoption,
      managerAdoption: adoptionMonitoring.managerAdoption,
      checkInCompletion: adoptionMonitoring.checkInCompletion
    },
    feedbackVolume: {
      totalFeedback: adoptionMonitoring.feedbackVolume,
      averagePerEmployee: adoptionMonitoring.averageFeedbackPerEmployee,
      peerFeedback: adoptionMonitoring.peerFeedbackVolume
    },
    engagementImpact: impactAssessment.engagementImpact,
    qualityMetrics: impactAssessment.qualityMetrics,
    recommendations: continuousImprovement.recommendations,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/continuous-feedback-checkins',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Program Design - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Management Designer',
      task: 'Design continuous feedback and check-in program',
      context: {
        organizationName: args.organizationName,
        checkInCadence: args.checkInCadence,
        feedbackCulture: args.feedbackCulture,
        includePeerFeedback: args.includePeerFeedback,
        includeRecognition: args.includeRecognition,
        integrateWithGoals: args.integrateWithGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define program objectives',
        '2. Design feedback framework',
        '3. Establish check-in structure',
        '4. Define feedback types (developmental, appreciation, coaching)',
        '5. Create feedback guidelines',
        '6. Design peer feedback component',
        '7. Plan recognition integration',
        '8. Define success metrics',
        '9. Create program principles',
        '10. Document program framework'
      ],
      outputFormat: 'JSON object with program design'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'checkInStructure', 'feedbackTypes', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        checkInStructure: { type: 'object' },
        feedbackTypes: { type: 'array', items: { type: 'object' } },
        feedbackGuidelines: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        principles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'design']
}));

export const oneOnOneFrameworkTask = defineTask('one-on-one-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: One-on-One Framework - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employee Experience Designer',
      task: 'Design one-on-one meeting framework',
      context: {
        organizationName: args.organizationName,
        checkInCadence: args.checkInCadence,
        integrateWithGoals: args.integrateWithGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define one-on-one purpose and goals',
        '2. Create meeting agenda templates',
        '3. Design conversation guides',
        '4. Include goal progress section',
        '5. Add feedback exchange section',
        '6. Include development discussion',
        '7. Create wellbeing check-in',
        '8. Design action item tracking',
        '9. Create meeting notes template',
        '10. Document best practices'
      ],
      outputFormat: 'JSON object with one-on-one framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'agendaTemplates', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        agendaTemplates: { type: 'array', items: { type: 'object' } },
        conversationGuides: { type: 'array', items: { type: 'object' } },
        notesTemplate: { type: 'object' },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'one-on-ones']
}));

export const feedbackSystemTask = defineTask('feedback-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Feedback System - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Feedback System Designer',
      task: 'Design real-time feedback system',
      context: {
        organizationName: args.organizationName,
        feedbackCulture: args.feedbackCulture,
        includePeerFeedback: args.includePeerFeedback,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design feedback request workflow',
        '2. Create feedback templates',
        '3. Design peer feedback mechanism',
        '4. Create upward feedback option',
        '5. Design feedback visibility rules',
        '6. Create feedback prompts',
        '7. Design notification system',
        '8. Create feedback response guidelines',
        '9. Design feedback analytics',
        '10. Document system workflow'
      ],
      outputFormat: 'JSON object with feedback system design'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'feedbackTemplates', 'artifacts'],
      properties: {
        system: { type: 'object' },
        feedbackTemplates: { type: 'array', items: { type: 'object' } },
        feedbackWorkflow: { type: 'object' },
        visibilityRules: { type: 'object' },
        prompts: { type: 'array', items: { type: 'string' } },
        analytics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'system']
}));

export const recognitionProgramTask = defineTask('recognition-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Recognition Program - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Recognition Program Designer',
      task: 'Design integrated recognition program',
      context: {
        organizationName: args.organizationName,
        feedbackCulture: args.feedbackCulture,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define recognition categories',
        '2. Create peer recognition workflow',
        '3. Design manager recognition tools',
        '4. Link to company values',
        '5. Create recognition badges/awards',
        '6. Design public recognition feed',
        '7. Plan recognition celebrations',
        '8. Create recognition analytics',
        '9. Design gamification elements',
        '10. Document recognition guidelines'
      ],
      outputFormat: 'JSON object with recognition program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'categories', 'artifacts'],
      properties: {
        program: { type: 'object' },
        categories: { type: 'array', items: { type: 'object' } },
        workflow: { type: 'object' },
        badges: { type: 'array', items: { type: 'object' } },
        gamification: { type: 'object' },
        guidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'recognition']
}));

export const managerTrainingTask = defineTask('manager-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Manager Training - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Designer',
      task: 'Develop manager training for continuous feedback',
      context: {
        organizationName: args.organizationName,
        oneOnOneFramework: args.oneOnOneFramework,
        feedbackSystem: args.feedbackSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify training objectives',
        '2. Design coaching skills module',
        '3. Create effective feedback module',
        '4. Design one-on-one facilitation training',
        '5. Create difficult conversations module',
        '6. Design recognition and appreciation training',
        '7. Create practice scenarios',
        '8. Design certification process',
        '9. Plan ongoing learning',
        '10. Create training schedule'
      ],
      outputFormat: 'JSON object with manager training program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'modules', 'skillsTargeted', 'artifacts'],
      properties: {
        program: { type: 'object' },
        modules: { type: 'array', items: { type: 'object' } },
        skillsTargeted: { type: 'array', items: { type: 'string' } },
        practiceScenarios: { type: 'array', items: { type: 'object' } },
        certification: { type: 'object' },
        deliveryFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'training']
}));

export const platformSetupTask = defineTask('platform-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Platform Setup - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Technology Specialist',
      task: 'Set up continuous feedback technology platform',
      context: {
        organizationName: args.organizationName,
        programDesign: args.programDesign,
        oneOnOneFramework: args.oneOnOneFramework,
        feedbackSystem: args.feedbackSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select/configure platform (Lattice, 15Five, Culture Amp)',
        '2. Set up one-on-one scheduling',
        '3. Configure feedback workflows',
        '4. Set up recognition features',
        '5. Configure goal integration',
        '6. Set up notifications',
        '7. Configure reporting dashboards',
        '8. Integrate with HRIS/Slack/Teams',
        '9. Test all workflows',
        '10. Create admin documentation'
      ],
      outputFormat: 'JSON object with platform setup'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'configuration', 'artifacts'],
      properties: {
        platform: { type: 'object' },
        configuration: { type: 'object' },
        integrations: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        adminDocs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'platform']
}));

export const launchPlanTask = defineTask('launch-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Launch Plan - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Specialist',
      task: 'Create program launch and communication plan',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        programDesign: args.programDesign,
        managerTraining: args.managerTraining,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create launch timeline',
        '2. Develop communication plan',
        '3. Create executive messaging',
        '4. Design manager communications',
        '5. Create employee communications',
        '6. Plan launch events',
        '7. Create quick start guides',
        '8. Plan support resources',
        '9. Design feedback collection',
        '10. Create launch checklist'
      ],
      outputFormat: 'JSON object with launch plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'communications', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        communications: { type: 'array', items: { type: 'object' } },
        launchEvents: { type: 'array', items: { type: 'object' } },
        quickStartGuides: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'launch']
}));

export const pilotProgramTask = defineTask('pilot-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pilot Program - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pilot Program Manager',
      task: 'Execute pilot program for continuous feedback',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        programDesign: args.programDesign,
        oneOnOneFramework: args.oneOnOneFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select pilot groups',
        '2. Train pilot managers',
        '3. Launch pilot program',
        '4. Monitor adoption daily',
        '5. Collect participant feedback',
        '6. Address issues quickly',
        '7. Track pilot metrics',
        '8. Conduct pilot retrospective',
        '9. Document learnings',
        '10. Prepare rollout recommendations'
      ],
      outputFormat: 'JSON object with pilot program results'
    },
    outputSchema: {
      type: 'object',
      required: ['participants', 'adoptionRate', 'learnings', 'artifacts'],
      properties: {
        participants: { type: 'number' },
        adoptionRate: { type: 'number' },
        feedbackReceived: { type: 'number' },
        improvements: { type: 'array', items: { type: 'string' } },
        learnings: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'pilot']
}));

export const fullRolloutTask = defineTask('full-rollout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Full Rollout - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Rollout Manager',
      task: 'Execute full program rollout',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        programDesign: args.programDesign,
        pilotLearnings: args.pilotLearnings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply pilot learnings',
        '2. Complete manager training',
        '3. Launch to all departments',
        '4. Execute communication plan',
        '5. Provide go-live support',
        '6. Monitor early adoption',
        '7. Address questions/issues',
        '8. Track rollout progress',
        '9. Celebrate early wins',
        '10. Document rollout completion'
      ],
      outputFormat: 'JSON object with rollout results'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'departmentsLaunched', 'artifacts'],
      properties: {
        completed: { type: 'boolean' },
        departmentsLaunched: { type: 'number' },
        employeesOnboarded: { type: 'number' },
        managersTraining: { type: 'number' },
        earlyAdoption: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'rollout']
}));

export const adoptionMonitoringTask = defineTask('adoption-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Adoption Monitoring - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Analytics Specialist',
      task: 'Monitor program adoption and usage',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        checkInCadence: args.checkInCadence,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Track one-on-one completion rates',
        '2. Monitor feedback volume',
        '3. Track recognition activity',
        '4. Measure manager adoption',
        '5. Identify low-adoption areas',
        '6. Track feature usage',
        '7. Monitor engagement trends',
        '8. Create adoption dashboards',
        '9. Generate weekly reports',
        '10. Identify intervention needs'
      ],
      outputFormat: 'JSON object with adoption metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['overallAdoption', 'managerAdoption', 'checkInCompletion', 'artifacts'],
      properties: {
        overallAdoption: { type: 'number' },
        managerAdoption: { type: 'number' },
        checkInCompletion: { type: 'number' },
        feedbackVolume: { type: 'number' },
        averageFeedbackPerEmployee: { type: 'number' },
        peerFeedbackVolume: { type: 'number' },
        recognitionActivity: { type: 'object' },
        lowAdoptionAreas: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'monitoring']
}));

export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Impact Assessment - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Impact Analyst',
      task: 'Assess program impact on engagement and performance',
      context: {
        organizationName: args.organizationName,
        adoptionMonitoring: args.adoptionMonitoring,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze engagement survey changes',
        '2. Measure feedback quality',
        '3. Assess one-on-one effectiveness',
        '4. Correlate with performance outcomes',
        '5. Measure manager effectiveness improvements',
        '6. Track retention impact',
        '7. Assess development conversation quality',
        '8. Calculate program ROI',
        '9. Compare to benchmarks',
        '10. Generate impact report'
      ],
      outputFormat: 'JSON object with impact assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementImpact', 'qualityMetrics', 'artifacts'],
      properties: {
        engagementImpact: { type: 'object' },
        qualityMetrics: { type: 'object' },
        performanceCorrelation: { type: 'object' },
        managerEffectiveness: { type: 'object' },
        retentionImpact: { type: 'object' },
        roi: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'impact']
}));

export const continuousImprovementTask = defineTask('continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Continuous Improvement - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Improvement Specialist',
      task: 'Identify and implement program improvements',
      context: {
        organizationName: args.organizationName,
        adoptionMonitoring: args.adoptionMonitoring,
        impactAssessment: args.impactAssessment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze adoption barriers',
        '2. Collect user feedback',
        '3. Identify improvement opportunities',
        '4. Prioritize enhancements',
        '5. Plan feature iterations',
        '6. Update training materials',
        '7. Refresh communication',
        '8. Plan manager coaching',
        '9. Set improvement goals',
        '10. Create improvement roadmap'
      ],
      outputFormat: 'JSON object with continuous improvement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'improvementPlan', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        improvementPlan: { type: 'object' },
        adoptionBarriers: { type: 'array', items: { type: 'object' } },
        featureEnhancements: { type: 'array', items: { type: 'object' } },
        trainingUpdates: { type: 'array', items: { type: 'string' } },
        roadmap: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'continuous-feedback', 'improvement']
}));
