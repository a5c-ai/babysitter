/**
 * @process domains/business/knowledge-management/community-of-practice-launch
 * @description Establish new communities of practice with clear domain definition, charter, governance structure, membership criteria, and initial activities
 * @specialization Knowledge Management
 * @category Communities of Practice Management
 * @inputs { domain: string, proposedMembers: array, sponsorship: object, organizationalContext: object, outputDir: string }
 * @outputs { success: boolean, communityCharter: object, governanceStructure: object, launchPlan: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain = '',
    proposedMembers = [],
    sponsorship = {},
    organizationalContext = {},
    existingCommunities = [],
    communityGoals = [],
    resourceAllocation = {},
    outputDir = 'cop-launch-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Community of Practice Launch and Charter Process');

  // ============================================================================
  // PHASE 1: DOMAIN DEFINITION AND SCOPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining domain and scope');
  const domainDefinition = await ctx.task(domainDefinitionTask, {
    domain,
    communityGoals,
    existingCommunities,
    organizationalContext,
    outputDir
  });

  artifacts.push(...domainDefinition.artifacts);

  // Breakpoint: Review domain definition
  await ctx.breakpoint({
    question: `Domain "${domain}" defined with ${domainDefinition.topicAreas.length} topic areas. Review definition?`,
    title: 'Domain Definition Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        domain,
        topicAreas: domainDefinition.topicAreas.length,
        boundaries: domainDefinition.boundaries
      }
    }
  });

  // ============================================================================
  // PHASE 2: VALUE PROPOSITION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing value proposition');
  const valueProportion = await ctx.task(valuePropositionTask, {
    domain,
    domainDefinition: domainDefinition.definition,
    communityGoals,
    organizationalContext,
    outputDir
  });

  artifacts.push(...valueProportion.artifacts);

  // ============================================================================
  // PHASE 3: MEMBERSHIP CRITERIA AND ROLES
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining membership criteria and roles');
  const membershipDefinition = await ctx.task(membershipDefinitionTask, {
    domain,
    proposedMembers,
    domainDefinition: domainDefinition.definition,
    organizationalContext,
    outputDir
  });

  artifacts.push(...membershipDefinition.artifacts);

  // ============================================================================
  // PHASE 4: GOVERNANCE STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing governance structure');
  const governanceDesign = await ctx.task(governanceDesignTask, {
    domain,
    sponsorship,
    membershipDefinition: membershipDefinition.membership,
    organizationalContext,
    outputDir
  });

  artifacts.push(...governanceDesign.artifacts);

  // Breakpoint: Review governance
  await ctx.breakpoint({
    question: `Governance structure designed with ${governanceDesign.roles.length} roles. Review?`,
    title: 'Governance Structure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        governanceRoles: governanceDesign.roles.length,
        decisionProcesses: governanceDesign.decisionProcesses.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: CHARTER DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing community charter');
  const charterDevelopment = await ctx.task(charterDevelopmentTask, {
    domain,
    domainDefinition: domainDefinition.definition,
    valueProposition: valueProportion.valueProposition,
    membershipDefinition: membershipDefinition.membership,
    governanceStructure: governanceDesign.governance,
    communityGoals,
    outputDir
  });

  artifacts.push(...charterDevelopment.artifacts);

  // ============================================================================
  // PHASE 6: ACTIVITY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning community activities');
  const activityPlanning = await ctx.task(activityPlanningTask, {
    domain,
    communityGoals,
    membershipDefinition: membershipDefinition.membership,
    resourceAllocation,
    outputDir
  });

  artifacts.push(...activityPlanning.artifacts);

  // ============================================================================
  // PHASE 7: TECHNOLOGY AND TOOLS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up technology and tools');
  const technologySetup = await ctx.task(technologySetupTask, {
    domain,
    plannedActivities: activityPlanning.activities,
    membershipSize: proposedMembers.length,
    organizationalContext,
    outputDir
  });

  artifacts.push(...technologySetup.artifacts);

  // ============================================================================
  // PHASE 8: LAUNCH PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing launch plan');
  const launchPlan = await ctx.task(launchPlanTask, {
    domain,
    charter: charterDevelopment.charter,
    activities: activityPlanning.activities,
    proposedMembers,
    technologySetup: technologySetup.setup,
    outputDir
  });

  artifacts.push(...launchPlan.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing community design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    domainDefinition,
    charterDevelopment,
    governanceDesign,
    activityPlanning,
    launchPlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      charter: charterDevelopment.charter,
      governance: governanceDesign.governance,
      launchPlan: launchPlan.plan,
      qualityScore: qualityAssessment.overallScore,
      sponsorship,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Launch community?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          proposedMembers: proposedMembers.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    domain,
    communityCharter: charterDevelopment.charter,
    governanceStructure: governanceDesign.governance,
    membershipModel: membershipDefinition.membership,
    launchPlan: launchPlan.plan,
    plannedActivities: activityPlanning.activities,
    technologySetup: technologySetup.setup,
    statistics: {
      topicAreas: domainDefinition.topicAreas.length,
      proposedMembers: proposedMembers.length,
      plannedActivities: activityPlanning.activities.length,
      governanceRoles: governanceDesign.roles.length
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/community-of-practice-launch',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Domain Definition
export const domainDefinitionTask = defineTask('domain-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define community domain and scope',
  agent: {
    name: 'domain-strategist',
    prompt: {
      role: 'community of practice domain strategist',
      task: 'Define domain and scope for new community',
      context: args,
      instructions: [
        'Define the community domain:',
        '  - Core topic areas',
        '  - Domain boundaries (in scope/out of scope)',
        '  - Relationship to adjacent domains',
        '  - Alignment with organizational strategy',
        'Identify key knowledge areas within domain',
        'Map to existing communities and avoid overlap',
        'Define domain expertise levels',
        'Save domain definition to output directory'
      ],
      outputFormat: 'JSON with definition (object), topicAreas (array), boundaries (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'topicAreas', 'artifacts'],
      properties: {
        definition: { type: 'object' },
        topicAreas: { type: 'array' },
        boundaries: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'domain']
}));

// Task 2: Value Proposition
export const valuePropositionTask = defineTask('value-proposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop value proposition',
  agent: {
    name: 'value-strategist',
    prompt: {
      role: 'community value proposition developer',
      task: 'Develop compelling value proposition for community',
      context: args,
      instructions: [
        'Develop value proposition:',
        '  - Value to members (learning, networking, recognition)',
        '  - Value to organization (knowledge sharing, innovation)',
        '  - Unique benefits vs other resources',
        'Define expected outcomes',
        'Articulate member benefits clearly',
        'Create compelling community pitch',
        'Save value proposition to output directory'
      ],
      outputFormat: 'JSON with valueProposition (object), memberBenefits (array), organizationalBenefits (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valueProposition', 'artifacts'],
      properties: {
        valueProposition: { type: 'object' },
        memberBenefits: { type: 'array' },
        organizationalBenefits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'value']
}));

// Task 3: Membership Definition
export const membershipDefinitionTask = defineTask('membership-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define membership criteria and roles',
  agent: {
    name: 'membership-designer',
    prompt: {
      role: 'community membership designer',
      task: 'Define membership criteria, types, and roles',
      context: args,
      instructions: [
        'Define membership model:',
        '  - Membership criteria and eligibility',
        '  - Membership types (core, active, peripheral)',
        '  - Member roles and expectations',
        '  - Onboarding process',
        '  - Exit/inactive processes',
        'Define contribution expectations',
        'Create member journey map',
        'Save membership definition to output directory'
      ],
      outputFormat: 'JSON with membership (object), memberTypes (array), memberRoles (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['membership', 'artifacts'],
      properties: {
        membership: { type: 'object' },
        memberTypes: { type: 'array' },
        memberRoles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'membership']
}));

// Task 4: Governance Design
export const governanceDesignTask = defineTask('governance-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance structure',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'community governance designer',
      task: 'Design governance structure for community',
      context: args,
      instructions: [
        'Design governance structure:',
        '  - Leadership roles (coordinator, facilitator, sponsor)',
        '  - Decision-making processes',
        '  - Meeting cadence and structure',
        '  - Escalation paths',
        '  - Performance metrics',
        'Define accountability mechanisms',
        'Create role descriptions',
        'Save governance design to output directory'
      ],
      outputFormat: 'JSON with governance (object), roles (array), decisionProcesses (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['governance', 'roles', 'artifacts'],
      properties: {
        governance: { type: 'object' },
        roles: { type: 'array' },
        decisionProcesses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'governance']
}));

// Task 5: Charter Development
export const charterDevelopmentTask = defineTask('charter-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop community charter',
  agent: {
    name: 'charter-writer',
    prompt: {
      role: 'community charter developer',
      task: 'Create comprehensive community charter',
      context: args,
      instructions: [
        'Develop community charter including:',
        '  - Mission and purpose',
        '  - Domain definition',
        '  - Goals and objectives',
        '  - Membership model',
        '  - Governance structure',
        '  - Expected behaviors and norms',
        '  - Success measures',
        'Create executive summary',
        'Save charter to output directory'
      ],
      outputFormat: 'JSON with charter (object), sections (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'artifacts'],
      properties: {
        charter: { type: 'object' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'charter']
}));

// Task 6: Activity Planning
export const activityPlanningTask = defineTask('activity-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan community activities',
  agent: {
    name: 'activity-planner',
    prompt: {
      role: 'community activity planner',
      task: 'Plan initial and ongoing community activities',
      context: args,
      instructions: [
        'Plan community activities:',
        '  - Knowledge sharing events',
        '  - Discussion forums',
        '  - Collaborative projects',
        '  - Expert sessions',
        '  - Documentation efforts',
        'Create activity calendar',
        'Define activity formats',
        'Plan engagement mechanisms',
        'Save activity plan to output directory'
      ],
      outputFormat: 'JSON with activities (array), calendar (object), engagementMechanisms (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: { type: 'array' },
        calendar: { type: 'object' },
        engagementMechanisms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'activities']
}));

// Task 7: Technology Setup
export const technologySetupTask = defineTask('technology-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up technology and tools',
  agent: {
    name: 'technology-specialist',
    prompt: {
      role: 'community technology specialist',
      task: 'Plan technology and tools setup for community',
      context: args,
      instructions: [
        'Plan technology setup:',
        '  - Collaboration platform',
        '  - Communication channels',
        '  - Content repository',
        '  - Event management',
        '  - Member directory',
        'Define tool configurations',
        'Plan access and permissions',
        'Create setup checklist',
        'Save technology setup to output directory'
      ],
      outputFormat: 'JSON with setup (object), tools (array), configurations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'tools', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        tools: { type: 'array' },
        configurations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'technology']
}));

// Task 8: Launch Plan
export const launchPlanTask = defineTask('launch-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop launch plan',
  agent: {
    name: 'launch-planner',
    prompt: {
      role: 'community launch planner',
      task: 'Develop comprehensive launch plan',
      context: args,
      instructions: [
        'Develop launch plan:',
        '  - Pre-launch activities',
        '  - Launch event planning',
        '  - Communication campaign',
        '  - Member recruitment',
        '  - First 90 days roadmap',
        'Define success criteria for launch',
        'Create launch timeline',
        'Identify launch risks and mitigations',
        'Save launch plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), timeline (object), communications (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        communications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'cop', 'launch']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess community design quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'community design quality assessor',
      task: 'Evaluate quality of community design',
      context: args,
      instructions: [
        'Assess community design quality:',
        '  - Domain clarity and focus',
        '  - Value proposition strength',
        '  - Governance adequacy',
        '  - Activity planning completeness',
        '  - Launch readiness',
        'Calculate overall quality score',
        'Identify gaps and risks',
        'Provide recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), risks (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        risks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present community design to stakeholders',
        'Review charter and governance',
        'Present launch plan',
        'Present quality assessment',
        'Gather stakeholder feedback',
        'Obtain sponsor approval',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
