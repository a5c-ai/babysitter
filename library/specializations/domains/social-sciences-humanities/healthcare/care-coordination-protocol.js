/**
 * @process specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol
 * @description Care Coordination Protocol - Framework for organizing patient care activities and sharing
 * information among all participants to achieve safer and more effective care through transitions and handoffs.
 * @inputs { patientPopulation: string, careSettings?: array, currentChallenges?: array, existingProtocols?: array }
 * @outputs { success: boolean, protocol: object, communicationPlan: object, handoffTools: array, artifacts: array }
 * @recommendedSkills SK-HC-001 (clinical-workflow-analysis), SK-HC-008 (care-transition-coordination)
 * @recommendedAgents AG-HC-006 (care-management-coordinator), AG-HC-005 (clinical-informatics-specialist)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol', {
 *   patientPopulation: 'Complex chronic disease patients',
 *   careSettings: ['primary care', 'specialty', 'hospital', 'home health'],
 *   currentChallenges: ['fragmented communication', 'care gaps', 'medication errors'],
 *   existingProtocols: ['discharge planning', 'referral management']
 * });
 *
 * @references
 * - AHRQ Care Coordination Framework
 * - Coleman, E. (2003). The Care Transitions Intervention
 * - McDonald, K. et al. (2014). Care Coordination Measures Atlas
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    patientPopulation,
    careSettings = [],
    currentChallenges = [],
    existingProtocols = [],
    stakeholders = [],
    timeline = null,
    outputDir = 'care-coordination-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Care Coordination Protocol Development for: ${patientPopulation}`);

  // Phase 1: Current State Analysis
  ctx.log('info', 'Phase 1: Current State Analysis');
  const currentState = await ctx.task(currentStateAnalysisTask, {
    patientPopulation,
    careSettings,
    currentChallenges,
    existingProtocols,
    outputDir
  });

  artifacts.push(...currentState.artifacts);

  await ctx.breakpoint({
    question: `Current state analyzed. ${currentState.gaps.length} care coordination gaps identified. ${currentState.transitions.length} transition points mapped. Proceed with protocol design?`,
    title: 'Current State Analysis Review',
    context: {
      runId: ctx.runId,
      patientPopulation,
      gaps: currentState.gaps,
      transitions: currentState.transitions,
      files: currentState.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Stakeholder and Role Definition
  ctx.log('info', 'Phase 2: Stakeholder and Role Definition');
  const roleDefinition = await ctx.task(stakeholderRoleDefinitionTask, {
    currentState,
    careSettings,
    stakeholders,
    outputDir
  });

  artifacts.push(...roleDefinition.artifacts);

  // Phase 3: Communication Framework Design
  ctx.log('info', 'Phase 3: Communication Framework Design');
  const communicationFramework = await ctx.task(communicationFrameworkTask, {
    currentState,
    roleDefinition,
    outputDir
  });

  artifacts.push(...communicationFramework.artifacts);

  await ctx.breakpoint({
    question: `Communication framework designed. ${communicationFramework.channels.length} channels defined. SBAR templates created. Proceed with handoff protocol design?`,
    title: 'Communication Framework Review',
    context: {
      runId: ctx.runId,
      channels: communicationFramework.channels,
      standards: communicationFramework.standards,
      files: communicationFramework.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Care Transition Protocols
  ctx.log('info', 'Phase 4: Care Transition Protocol Design');
  const transitionProtocols = await ctx.task(transitionProtocolsTask, {
    currentState,
    roleDefinition,
    communicationFramework,
    outputDir
  });

  artifacts.push(...transitionProtocols.artifacts);

  // Phase 5: Handoff Tools Development
  ctx.log('info', 'Phase 5: Handoff Tools Development');
  const handoffTools = await ctx.task(handoffToolsDevelopmentTask, {
    transitionProtocols,
    communicationFramework,
    outputDir
  });

  artifacts.push(...handoffTools.artifacts);

  await ctx.breakpoint({
    question: `${transitionProtocols.protocols.length} transition protocols and ${handoffTools.tools.length} handoff tools developed. Proceed with technology integration planning?`,
    title: 'Transition Protocols and Tools Review',
    context: {
      runId: ctx.runId,
      protocols: transitionProtocols.protocols,
      tools: handoffTools.tools,
      files: [...transitionProtocols.artifacts, ...handoffTools.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Technology Integration
  ctx.log('info', 'Phase 6: Technology Integration Planning');
  const techIntegration = await ctx.task(technologyIntegrationTask, {
    communicationFramework,
    transitionProtocols,
    handoffTools,
    outputDir
  });

  artifacts.push(...techIntegration.artifacts);

  // Phase 7: Quality Metrics Design
  ctx.log('info', 'Phase 7: Quality Metrics Design');
  const qualityMetrics = await ctx.task(qualityMetricsDesignTask, {
    transitionProtocols,
    currentChallenges,
    outputDir
  });

  artifacts.push(...qualityMetrics.artifacts);

  // Phase 8: Implementation Plan
  ctx.log('info', 'Phase 8: Implementation Planning');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    roleDefinition,
    communicationFramework,
    transitionProtocols,
    handoffTools,
    techIntegration,
    qualityMetrics,
    timeline,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 9: Training Program Design
  ctx.log('info', 'Phase 9: Training Program Design');
  const trainingProgram = await ctx.task(trainingProgramTask, {
    roleDefinition,
    transitionProtocols,
    handoffTools,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // Phase 10: Final Protocol Documentation
  ctx.log('info', 'Phase 10: Final Protocol Documentation');
  const documentation = await ctx.task(protocolDocumentationTask, {
    patientPopulation,
    currentState,
    roleDefinition,
    communicationFramework,
    transitionProtocols,
    handoffTools,
    techIntegration,
    qualityMetrics,
    implementationPlan,
    trainingProgram,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    patientPopulation,
    protocol: {
      overview: documentation.protocolOverview,
      roleDefinitions: roleDefinition.roles,
      transitionProtocols: transitionProtocols.protocols,
      communicationStandards: communicationFramework.standards
    },
    communicationPlan: communicationFramework.plan,
    handoffTools: handoffTools.tools,
    techIntegration: techIntegration.integrationPlan,
    qualityMetrics: qualityMetrics.metrics,
    implementationPlan: implementationPlan.plan,
    trainingProgram: trainingProgram.program,
    artifacts,
    documentationPath: documentation.documentPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Current State Analysis
export const currentStateAnalysisTask = defineTask('ccp-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Care Coordination Current State - ${args.patientPopulation}`,
  agent: {
    name: 'care-coordination-analyst',
    prompt: {
      role: 'Care Coordination Analyst',
      task: 'Analyze current care coordination state',
      context: args,
      instructions: [
        '1. Map all care settings and providers involved',
        '2. Document current communication pathways',
        '3. Identify all care transition points',
        '4. Assess current handoff processes',
        '5. Review existing protocols and tools',
        '6. Identify coordination gaps and failures',
        '7. Document patient journey touchpoints',
        '8. Analyze adverse events related to coordination',
        '9. Assess information sharing capabilities',
        '10. Survey stakeholder pain points'
      ],
      outputFormat: 'JSON with current state analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'transitions', 'providers', 'artifacts'],
      properties: {
        providers: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'array', items: { type: 'object' } },
        currentCommunication: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        adverseEvents: { type: 'array', items: { type: 'object' } },
        stakeholderFeedback: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'current-state', 'healthcare']
}));

// Task 2: Stakeholder Role Definition
export const stakeholderRoleDefinitionTask = defineTask('ccp-roles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Role Definition',
  agent: {
    name: 'organizational-designer',
    prompt: {
      role: 'Healthcare Organizational Designer',
      task: 'Define stakeholder roles in care coordination',
      context: args,
      instructions: [
        '1. Identify all stakeholder groups',
        '2. Define care coordinator role and responsibilities',
        '3. Define physician accountabilities',
        '4. Define nursing responsibilities',
        '5. Define patient/family roles',
        '6. Create RACI for care transitions',
        '7. Define escalation pathways',
        '8. Establish accountability structures',
        '9. Define communication responsibilities',
        '10. Document decision-making authority'
      ],
      outputFormat: 'JSON with role definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'raci', 'escalationPaths', 'artifacts'],
      properties: {
        roles: { type: 'array', items: { type: 'object' } },
        raci: { type: 'object' },
        escalationPaths: { type: 'object' },
        accountabilityStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'roles', 'healthcare']
}));

// Task 3: Communication Framework
export const communicationFrameworkTask = defineTask('ccp-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Communication Framework',
  agent: {
    name: 'communication-designer',
    prompt: {
      role: 'Healthcare Communication Designer',
      task: 'Design communication framework for care coordination',
      context: args,
      instructions: [
        '1. Define communication channels for each transition',
        '2. Create SBAR communication templates',
        '3. Establish communication timing requirements',
        '4. Define critical information elements',
        '5. Create closed-loop communication protocols',
        '6. Design huddle/rounds structures',
        '7. Establish documentation standards',
        '8. Define patient communication approach',
        '9. Create family engagement protocols',
        '10. Design escalation communication'
      ],
      outputFormat: 'JSON with communication framework'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'standards', 'plan', 'artifacts'],
      properties: {
        channels: { type: 'array', items: { type: 'object' } },
        standards: { type: 'object' },
        sbarTemplates: { type: 'array', items: { type: 'object' } },
        timingRequirements: { type: 'object' },
        closedLoopProtocols: { type: 'object' },
        plan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'communication', 'healthcare']
}));

// Task 4: Transition Protocols
export const transitionProtocolsTask = defineTask('ccp-transitions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Transition Protocol Design',
  agent: {
    name: 'transition-specialist',
    prompt: {
      role: 'Care Transitions Specialist',
      task: 'Design care transition protocols',
      context: args,
      instructions: [
        '1. Design admission transition protocol',
        '2. Design unit transfer protocol',
        '3. Design discharge transition protocol',
        '4. Design ED to inpatient protocol',
        '5. Design post-acute transition protocol',
        '6. Define medication reconciliation at each transition',
        '7. Create follow-up requirements',
        '8. Design warm handoff procedures',
        '9. Define patient education at transitions',
        '10. Create transition checklists'
      ],
      outputFormat: 'JSON with transition protocols'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'checklists', 'medicationReconciliation', 'artifacts'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        checklists: { type: 'array', items: { type: 'object' } },
        medicationReconciliation: { type: 'object' },
        followUpRequirements: { type: 'object' },
        patientEducation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'transitions', 'healthcare']
}));

// Task 5: Handoff Tools Development
export const handoffToolsDevelopmentTask = defineTask('ccp-handoff-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Handoff Tools Development',
  agent: {
    name: 'clinical-tools-developer',
    prompt: {
      role: 'Clinical Tools Developer',
      task: 'Develop handoff tools and templates',
      context: args,
      instructions: [
        '1. Create I-PASS handoff tool',
        '2. Develop nursing shift handoff template',
        '3. Create provider sign-out tool',
        '4. Design discharge summary template',
        '5. Create referral communication template',
        '6. Develop care plan summary tool',
        '7. Design patient transition record',
        '8. Create critical information checklist',
        '9. Develop read-back verification tool',
        '10. Design bedside handoff guide'
      ],
      outputFormat: 'JSON with handoff tools'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'templates', 'artifacts'],
      properties: {
        tools: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        checklists: { type: 'array', items: { type: 'object' } },
        ipassTool: { type: 'object' },
        dischargeSummaryTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'handoff', 'tools']
}));

// Task 6: Technology Integration
export const technologyIntegrationTask = defineTask('ccp-technology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Technology Integration',
  agent: {
    name: 'health-it-specialist',
    prompt: {
      role: 'Health IT Specialist',
      task: 'Plan technology integration for care coordination',
      context: args,
      instructions: [
        '1. Assess EHR capabilities for care coordination',
        '2. Design care coordination module requirements',
        '3. Plan HIE integration',
        '4. Design alert and notification system',
        '5. Plan secure messaging integration',
        '6. Design task management system',
        '7. Plan patient portal engagement',
        '8. Design care team visualization',
        '9. Plan analytics and reporting',
        '10. Address interoperability requirements'
      ],
      outputFormat: 'JSON with technology integration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPlan', 'requirements', 'artifacts'],
      properties: {
        integrationPlan: { type: 'object' },
        requirements: { type: 'array', items: { type: 'object' } },
        ehrRequirements: { type: 'object' },
        hieIntegration: { type: 'object' },
        alertSystem: { type: 'object' },
        interoperability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'technology', 'health-it']
}));

// Task 7: Quality Metrics Design
export const qualityMetricsDesignTask = defineTask('ccp-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Quality Metrics',
  agent: {
    name: 'quality-metrics-analyst',
    prompt: {
      role: 'Healthcare Quality Metrics Analyst',
      task: 'Design quality metrics for care coordination',
      context: args,
      instructions: [
        '1. Define care coordination outcome metrics',
        '2. Define process metrics for transitions',
        '3. Design patient experience measures',
        '4. Define communication quality metrics',
        '5. Design readmission tracking',
        '6. Define medication reconciliation metrics',
        '7. Design follow-up compliance metrics',
        '8. Create handoff quality measures',
        '9. Define care gap tracking',
        '10. Design dashboard specifications'
      ],
      outputFormat: 'JSON with quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'dashboard', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        outcomeMetrics: { type: 'array', items: { type: 'object' } },
        processMetrics: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'quality', 'metrics']
}));

// Task 8: Implementation Plan
export const implementationPlanTask = defineTask('ccp-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Implementation Plan',
  agent: {
    name: 'implementation-manager',
    prompt: {
      role: 'Healthcare Implementation Manager',
      task: 'Develop implementation plan for care coordination protocol',
      context: args,
      instructions: [
        '1. Create phased implementation timeline',
        '2. Identify pilot units/populations',
        '3. Define resource requirements',
        '4. Plan change management approach',
        '5. Define stakeholder engagement plan',
        '6. Create risk mitigation strategies',
        '7. Design pilot evaluation criteria',
        '8. Plan scale-up approach',
        '9. Define go-live support',
        '10. Create sustainability plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'pilotStrategy', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        pilotStrategy: { type: 'object' },
        resources: { type: 'object' },
        changeManagement: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'implementation', 'healthcare']
}));

// Task 9: Training Program
export const trainingProgramTask = defineTask('ccp-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Training Program',
  agent: {
    name: 'clinical-educator',
    prompt: {
      role: 'Clinical Educator',
      task: 'Design training program for care coordination',
      context: args,
      instructions: [
        '1. Define training objectives by role',
        '2. Create core curriculum content',
        '3. Design handoff training module',
        '4. Create communication skills training',
        '5. Design simulation exercises',
        '6. Create competency assessments',
        '7. Design just-in-time training resources',
        '8. Plan training schedule and delivery',
        '9. Create trainer preparation materials',
        '10. Design ongoing education plan'
      ],
      outputFormat: 'JSON with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'curriculum', 'competencies', 'artifacts'],
      properties: {
        program: { type: 'object' },
        curriculum: { type: 'array', items: { type: 'object' } },
        modules: { type: 'array', items: { type: 'object' } },
        simulations: { type: 'array', items: { type: 'object' } },
        competencies: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'training', 'education']
}));

// Task 10: Protocol Documentation
export const protocolDocumentationTask = defineTask('ccp-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Care Coordination Protocol Documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Healthcare Technical Writer',
      task: 'Create comprehensive protocol documentation',
      context: args,
      instructions: [
        '1. Write protocol executive summary',
        '2. Document scope and applicability',
        '3. Detail role responsibilities',
        '4. Document communication standards',
        '5. Include transition protocols',
        '6. Document handoff procedures',
        '7. Include tools and templates',
        '8. Document technology requirements',
        '9. Include metrics and monitoring',
        '10. Create appendices and references'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'protocolOverview', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        protocolOverview: { type: 'object' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'care-coordination', 'documentation', 'healthcare']
}));
