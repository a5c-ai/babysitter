/**
 * @process specializations/domains/business/human-resources/lms-implementation
 * @description Learning Management System (LMS) Implementation Process - Selection, deployment, and administration of learning
 * technology platforms including content migration, user setup, reporting configuration, and adoption tracking.
 * @inputs { organizationName: string, lmsVendor?: string, userCount: number, contentLibrary?: array }
 * @outputs { success: boolean, lmsDeployed: boolean, usersOnboarded: number, contentMigrated: number, adoptionRate: number }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/lms-implementation', {
 *   organizationName: 'TechCorp',
 *   lmsVendor: 'Cornerstone',
 *   userCount: 5000,
 *   contentLibrary: ['compliance', 'leadership', 'technical-skills']
 * });
 *
 * @references
 * - Docebo LMS Implementation: https://www.docebo.com/learning-network/blog/lms-implementation/
 * - Brandon Hall LMS Guide: https://www.brandonhall.com/
 * - Josh Bersin LMS Trends: https://joshbersin.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    lmsVendor = null,
    userCount,
    contentLibrary = [],
    existingLms = null,
    integrationRequirements = ['hris', 'sso'],
    launchTimeline = '3-months',
    outputDir = 'lms-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LMS Implementation for ${organizationName}`);

  // Phase 1: Requirements Gathering
  const requirements = await ctx.task(requirementsGatheringTask, {
    organizationName,
    userCount,
    contentLibrary,
    existingLms,
    integrationRequirements,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  await ctx.breakpoint({
    question: `LMS requirements gathered. ${requirements.functionalRequirements.length} functional requirements, ${requirements.technicalRequirements.length} technical requirements. Review before vendor selection?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      functionalRequirements: requirements.functionalRequirements,
      technicalRequirements: requirements.technicalRequirements,
      integrationNeeds: requirements.integrationNeeds,
      files: requirements.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Vendor Selection (if not pre-selected)
  let vendorSelection = null;
  if (!lmsVendor) {
    vendorSelection = await ctx.task(vendorSelectionTask, {
      organizationName,
      requirements,
      userCount,
      outputDir
    });
    artifacts.push(...vendorSelection.artifacts);

    await ctx.breakpoint({
      question: `Vendor evaluation complete. Top recommendation: ${vendorSelection.recommendedVendor}. Score: ${vendorSelection.topScore}. Approve vendor selection?`,
      title: 'Vendor Selection Review',
      context: {
        runId: ctx.runId,
        recommendedVendor: vendorSelection.recommendedVendor,
        evaluationMatrix: vendorSelection.evaluationMatrix,
        demos: vendorSelection.demoResults,
        files: vendorSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  const selectedVendor = lmsVendor || vendorSelection?.recommendedVendor;

  // Phase 3: Project Planning
  const projectPlanning = await ctx.task(projectPlanningTask, {
    organizationName,
    selectedVendor,
    userCount,
    launchTimeline,
    requirements,
    outputDir
  });

  artifacts.push(...projectPlanning.artifacts);

  // Phase 4: System Configuration
  const systemConfiguration = await ctx.task(systemConfigurationTask, {
    organizationName,
    selectedVendor,
    requirements,
    projectPlanning,
    outputDir
  });

  artifacts.push(...systemConfiguration.artifacts);

  // Phase 5: Integration Development
  const integrationDevelopment = await ctx.task(integrationDevelopmentTask, {
    organizationName,
    selectedVendor,
    integrationRequirements,
    systemConfiguration,
    outputDir
  });

  artifacts.push(...integrationDevelopment.artifacts);

  await ctx.breakpoint({
    question: `Integrations developed. ${integrationDevelopment.integrationsCompleted} integrations completed. SSO: ${integrationDevelopment.ssoConfigured}. Review integration status?`,
    title: 'Integration Review',
    context: {
      runId: ctx.runId,
      integrationsCompleted: integrationDevelopment.integrationsCompleted,
      ssoConfigured: integrationDevelopment.ssoConfigured,
      hrisSync: integrationDevelopment.hrisSync,
      files: integrationDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Content Migration
  const contentMigration = await ctx.task(contentMigrationTask, {
    organizationName,
    contentLibrary,
    existingLms,
    selectedVendor,
    outputDir
  });

  artifacts.push(...contentMigration.artifacts);

  // Phase 7: User Setup and Provisioning
  const userProvisioning = await ctx.task(userProvisioningTask, {
    organizationName,
    userCount,
    systemConfiguration,
    integrationDevelopment,
    outputDir
  });

  artifacts.push(...userProvisioning.artifacts);

  // Phase 8: Testing
  const testing = await ctx.task(testingTask, {
    organizationName,
    systemConfiguration,
    integrationDevelopment,
    contentMigration,
    userProvisioning,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Testing complete. ${testing.passRate}% pass rate. ${testing.criticalIssues} critical issues. Ready for launch?`,
    title: 'Testing Results Review',
    context: {
      runId: ctx.runId,
      passRate: testing.passRate,
      criticalIssues: testing.criticalIssues,
      testResults: testing.testResults,
      files: testing.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Training and Documentation
  const trainingDocs = await ctx.task(trainingDocsTask, {
    organizationName,
    selectedVendor,
    systemConfiguration,
    outputDir
  });

  artifacts.push(...trainingDocs.artifacts);

  // Phase 10: Launch Preparation
  const launchPrep = await ctx.task(launchPrepTask, {
    organizationName,
    selectedVendor,
    userCount,
    trainingDocs,
    outputDir
  });

  artifacts.push(...launchPrep.artifacts);

  // Phase 11: Go-Live
  const goLive = await ctx.task(goLiveTask, {
    organizationName,
    selectedVendor,
    userCount,
    launchPrep,
    outputDir
  });

  artifacts.push(...goLive.artifacts);

  // Phase 12: Post-Launch Support and Adoption
  const postLaunch = await ctx.task(postLaunchTask, {
    organizationName,
    selectedVendor,
    userCount,
    goLive,
    outputDir
  });

  artifacts.push(...postLaunch.artifacts);

  return {
    success: true,
    organizationName,
    lmsVendor: selectedVendor,
    lmsDeployed: goLive.deployed,
    usersOnboarded: userProvisioning.usersProvisioned,
    contentMigrated: contentMigration.contentMigrated,
    integrations: integrationDevelopment.integrationsCompleted,
    adoptionRate: postLaunch.adoptionRate,
    launchDate: goLive.launchDate,
    supportPlan: postLaunch.supportPlan,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/lms-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions (abbreviated for space - following same pattern as other processes)

export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Gathering - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Technology Analyst',
      task: 'Gather comprehensive LMS requirements',
      context: args,
      instructions: [
        '1. Conduct stakeholder interviews',
        '2. Document functional requirements',
        '3. Define technical requirements',
        '4. Identify integration needs',
        '5. Define user experience requirements',
        '6. Document reporting requirements',
        '7. Define compliance requirements',
        '8. Assess mobile requirements',
        '9. Document scalability needs',
        '10. Create requirements document'
      ],
      outputFormat: 'JSON object with requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalRequirements', 'technicalRequirements', 'integrationNeeds', 'artifacts'],
      properties: {
        functionalRequirements: { type: 'array', items: { type: 'object' } },
        technicalRequirements: { type: 'array', items: { type: 'object' } },
        integrationNeeds: { type: 'array', items: { type: 'object' } },
        reportingRequirements: { type: 'array', items: { type: 'object' } },
        userExperienceRequirements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'lms', 'requirements']
}));

export const vendorSelectionTask = defineTask('vendor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Vendor Selection - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'LMS Selection Specialist',
      task: 'Evaluate and select LMS vendor',
      context: args,
      instructions: [
        '1. Create vendor shortlist',
        '2. Develop evaluation criteria',
        '3. Issue RFP',
        '4. Review vendor responses',
        '5. Conduct vendor demos',
        '6. Check references',
        '7. Evaluate pricing',
        '8. Score vendors',
        '9. Make recommendation',
        '10. Document selection rationale'
      ],
      outputFormat: 'JSON object with vendor selection'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedVendor', 'evaluationMatrix', 'topScore', 'artifacts'],
      properties: {
        recommendedVendor: { type: 'string' },
        evaluationMatrix: { type: 'array', items: { type: 'object' } },
        topScore: { type: 'number' },
        demoResults: { type: 'array', items: { type: 'object' } },
        pricing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'lms', 'vendor-selection']
}));

export const projectPlanningTask = defineTask('project-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Project Planning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'LMS Project Manager',
      task: 'Create LMS implementation project plan',
      context: args,
      instructions: ['1. Define project scope', '2. Create timeline', '3. Assign resources', '4. Identify risks', '5. Define milestones', '6. Create RACI matrix', '7. Plan communications', '8. Define success criteria', '9. Create budget', '10. Document project plan'],
      outputFormat: 'JSON object with project plan'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPlan', 'timeline', 'artifacts'],
      properties: { projectPlan: { type: 'object' }, timeline: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, riskRegister: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'project-planning']
}));

export const systemConfigurationTask = defineTask('system-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: System Configuration - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'LMS Administrator',
      task: 'Configure LMS system',
      context: args,
      instructions: ['1. Configure tenant', '2. Set up branding', '3. Configure roles', '4. Set up permissions', '5. Configure learning paths', '6. Set up notifications', '7. Configure reporting', '8. Set up compliance tracking', '9. Configure mobile settings', '10. Document configuration'],
      outputFormat: 'JSON object with configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: { configuration: { type: 'object' }, branding: { type: 'object' }, roles: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'configuration']
}));

export const integrationDevelopmentTask = defineTask('integration-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Integration Development - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Developer',
      task: 'Develop LMS integrations',
      context: args,
      instructions: ['1. Configure SSO', '2. Set up HRIS sync', '3. Configure API connections', '4. Test integrations', '5. Set up data feeds', '6. Configure webhooks', '7. Test data sync', '8. Document integrations', '9. Create monitoring', '10. Validate integrations'],
      outputFormat: 'JSON object with integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationsCompleted', 'ssoConfigured', 'hrisSync', 'artifacts'],
      properties: { integrationsCompleted: { type: 'number' }, ssoConfigured: { type: 'boolean' }, hrisSync: { type: 'boolean' }, integrationDetails: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'integration']
}));

export const contentMigrationTask = defineTask('content-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Content Migration - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Content Migration Specialist',
      task: 'Migrate learning content to new LMS',
      context: args,
      instructions: ['1. Inventory existing content', '2. Assess content quality', '3. Map content structure', '4. Export content', '5. Convert formats', '6. Import content', '7. Validate content', '8. Set up catalogs', '9. Configure access', '10. Document migration'],
      outputFormat: 'JSON object with migration status'
    },
    outputSchema: {
      type: 'object',
      required: ['contentMigrated', 'artifacts'],
      properties: { contentMigrated: { type: 'number' }, contentInventory: { type: 'object' }, migrationStatus: { type: 'object' }, qualityIssues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'content-migration']
}));

export const userProvisioningTask = defineTask('user-provisioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: User Provisioning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'User Administration Specialist',
      task: 'Provision users in LMS',
      context: args,
      instructions: ['1. Extract user data', '2. Map user attributes', '3. Create user accounts', '4. Assign roles', '5. Set up groups', '6. Configure assignments', '7. Test user access', '8. Validate permissions', '9. Send welcome communications', '10. Document provisioning'],
      outputFormat: 'JSON object with provisioning status'
    },
    outputSchema: {
      type: 'object',
      required: ['usersProvisioned', 'artifacts'],
      properties: { usersProvisioned: { type: 'number' }, userGroups: { type: 'array', items: { type: 'object' } }, roleAssignments: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'user-provisioning']
}));

export const testingTask = defineTask('testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Specialist',
      task: 'Test LMS implementation',
      context: args,
      instructions: ['1. Create test plan', '2. Execute functional tests', '3. Test integrations', '4. Perform UAT', '5. Test mobile', '6. Test reporting', '7. Load testing', '8. Security testing', '9. Document issues', '10. Sign off testing'],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passRate', 'criticalIssues', 'testResults', 'artifacts'],
      properties: { passRate: { type: 'number' }, criticalIssues: { type: 'number' }, testResults: { type: 'array', items: { type: 'object' } }, uatFeedback: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'testing']
}));

export const trainingDocsTask = defineTask('training-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Training and Documentation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Training Developer',
      task: 'Create training and documentation',
      context: args,
      instructions: ['1. Create user guides', '2. Develop admin training', '3. Create quick start guides', '4. Record video tutorials', '5. Create FAQ', '6. Develop train-the-trainer', '7. Create help resources', '8. Document processes', '9. Create job aids', '10. Deploy documentation'],
      outputFormat: 'JSON object with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingMaterials', 'artifacts'],
      properties: { trainingMaterials: { type: 'array', items: { type: 'object' } }, userGuides: { type: 'array', items: { type: 'object' } }, adminDocs: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'training']
}));

export const launchPrepTask = defineTask('launch-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Launch Preparation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Launch Coordinator',
      task: 'Prepare for LMS launch',
      context: args,
      instructions: ['1. Final testing', '2. Communication plan', '3. Support readiness', '4. Train support team', '5. Prepare launch communications', '6. Final data validation', '7. Go/no-go checklist', '8. Rollback plan', '9. Monitor setup', '10. Launch checklist'],
      outputFormat: 'JSON object with launch prep'
    },
    outputSchema: {
      type: 'object',
      required: ['launchReady', 'artifacts'],
      properties: { launchReady: { type: 'boolean' }, goNoGoChecklist: { type: 'array', items: { type: 'object' } }, communicationPlan: { type: 'object' }, supportReadiness: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'launch-prep']
}));

export const goLiveTask = defineTask('go-live', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Go-Live - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Launch Manager',
      task: 'Execute LMS go-live',
      context: args,
      instructions: ['1. Execute launch', '2. Send announcements', '3. Monitor systems', '4. Track logins', '5. Address issues', '6. Provide support', '7. Track adoption', '8. Collect feedback', '9. Document issues', '10. Celebrate launch'],
      outputFormat: 'JSON object with go-live status'
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'launchDate', 'artifacts'],
      properties: { deployed: { type: 'boolean' }, launchDate: { type: 'string' }, initialLogins: { type: 'number' }, launchIssues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'go-live']
}));

export const postLaunchTask = defineTask('post-launch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Post-Launch - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Post-Launch Support Manager',
      task: 'Manage post-launch support and adoption',
      context: args,
      instructions: ['1. Monitor adoption', '2. Provide support', '3. Address issues', '4. Collect feedback', '5. Track metrics', '6. Optimize performance', '7. Plan enhancements', '8. Document lessons learned', '9. Transition to operations', '10. Create support plan'],
      outputFormat: 'JSON object with post-launch status'
    },
    outputSchema: {
      type: 'object',
      required: ['adoptionRate', 'supportPlan', 'artifacts'],
      properties: { adoptionRate: { type: 'number' }, supportMetrics: { type: 'object' }, issuesResolved: { type: 'number' }, supportPlan: { type: 'object' }, lessonsLearned: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'lms', 'post-launch']
}));
