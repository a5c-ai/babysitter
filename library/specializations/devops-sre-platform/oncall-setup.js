/**
 * @process devops-sre-platform/oncall-setup
 * @description Implement on-call rotation and escalation policies for incident management, including schedule design, tooling setup, and team training
 * @category Incident Management
 * @priority High
 * @complexity Medium
 * @inputs { teamMembers: array, toolChoice: string, escalationLevels: number, rotationSchedule: string, integrations: array, runbookLibrary: object }
 * @outputs { success: boolean, scheduleConfigured: boolean, escalationPolicies: array, toolingSetup: object, teamReadiness: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    teamMembers = [],
    toolChoice = 'pagerduty', // pagerduty | opsgenie | victorops | custom
    escalationLevels = 3,
    rotationSchedule = 'weekly', // daily | weekly | biweekly | custom
    integrations = ['slack', 'email', 'phone'],
    runbookLibrary = {},
    timeZone = 'UTC',
    followTheSunRotation = false,
    outputDir = 'oncall-setup-output',
    minimumTeamSize = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting On-Call Rotation and Escalation Setup');

  // Validate minimum team size
  if (teamMembers.length < minimumTeamSize) {
    ctx.log('warn', `Team size (${teamMembers.length}) is below recommended minimum (${minimumTeamSize}). Consider expanding the on-call pool.`);
  }

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current incident management practices');
  const currentStateAssessment = await ctx.task(assessCurrentStateTask, {
    teamMembers,
    runbookLibrary,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  await ctx.checkpoint({
    title: 'Phase 1: Current State Assessment Complete',
    message: `Current incident response maturity: ${currentStateAssessment.maturityLevel}. Identified ${currentStateAssessment.gaps.length} gaps to address.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        maturityLevel: currentStateAssessment.maturityLevel,
        gapsIdentified: currentStateAssessment.gaps.length,
        teamSize: teamMembers.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: TOOL SELECTION AND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up on-call management tool');
  const toolSetup = await ctx.task(setupOnCallToolTask, {
    toolChoice,
    teamMembers,
    integrations,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  await ctx.checkpoint({
    title: 'Phase 2: On-Call Tool Setup Complete',
    message: `${toolChoice} configured with ${toolSetup.integrationsConfigured.length} integrations. Team members: ${toolSetup.usersCreated}.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        tool: toolChoice,
        usersCreated: toolSetup.usersCreated,
        integrationsConfigured: toolSetup.integrationsConfigured.length
      }
    }
  });

  // ============================================================================
  // PHASE 3: ROTATION SCHEDULE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing on-call rotation schedule');
  const rotationDesign = await ctx.task(designRotationScheduleTask, {
    teamMembers,
    rotationSchedule,
    timeZone,
    followTheSunRotation,
    currentStateAssessment,
    outputDir
  });

  artifacts.push(...rotationDesign.artifacts);

  await ctx.checkpoint({
    question: `Rotation schedule designed with ${rotationDesign.shiftsPerCycle} shifts per cycle. Review and approve schedule before implementation?`,
    title: 'Phase 3: Rotation Schedule Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        rotationType: rotationSchedule,
        shiftsPerCycle: rotationDesign.shiftsPerCycle,
        fairnessScore: rotationDesign.fairnessScore,
        followTheSun: followTheSunRotation
      }
    }
  });

  // ============================================================================
  // PHASE 4: ESCALATION POLICY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining escalation policies');
  const escalationPolicies = await ctx.task(defineEscalationPoliciesTask, {
    teamMembers,
    escalationLevels,
    rotationDesign,
    currentStateAssessment,
    outputDir
  });

  artifacts.push(...escalationPolicies.artifacts);

  await ctx.checkpoint({
    title: 'Phase 4: Escalation Policies Defined',
    message: `${escalationPolicies.policies.length} escalation policies created with ${escalationLevels} levels each.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        policiesCreated: escalationPolicies.policies.length,
        escalationLevels: escalationLevels,
        averageEscalationTime: escalationPolicies.averageEscalationTime
      }
    }
  });

  // ============================================================================
  // PHASE 5: ALERT ROUTING AND INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring alert routing and integrations');
  const alertRouting = await ctx.task(configureAlertRoutingTask, {
    toolChoice,
    escalationPolicies,
    integrations,
    outputDir
  });

  artifacts.push(...alertRouting.artifacts);

  // ============================================================================
  // PHASE 6: RUNBOOK AND DOCUMENTATION CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating runbooks and documentation');
  const runbooksAndDocs = await ctx.task(createRunbooksAndDocsTask, {
    runbookLibrary,
    toolChoice,
    rotationDesign,
    escalationPolicies,
    alertRouting,
    outputDir
  });

  artifacts.push(...runbooksAndDocs.artifacts);

  await ctx.checkpoint({
    title: 'Phase 6: Runbooks and Documentation Complete',
    message: `Created ${runbooksAndDocs.runbooksCreated} runbooks and ${runbooksAndDocs.documentsCreated} documentation pages.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        runbooksCreated: runbooksAndDocs.runbooksCreated,
        documentsCreated: runbooksAndDocs.documentsCreated,
        coverageScore: runbooksAndDocs.coverageScore
      }
    }
  });

  // ============================================================================
  // PHASE 7: TEAM TRAINING AND SIMULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Conducting team training and incident simulations');
  const training = await ctx.task(conductTrainingAndSimulationsTask, {
    teamMembers,
    toolChoice,
    escalationPolicies,
    runbooksAndDocs,
    outputDir
  });

  artifacts.push(...training.artifacts);

  await ctx.checkpoint({
    title: 'Phase 7: Training Complete',
    message: `${training.trainedMembers} team members trained. Incident simulation score: ${training.simulationScore}/100.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        trainedMembers: training.trainedMembers,
        simulationScore: training.simulationScore,
        readinessLevel: training.readinessLevel
      }
    }
  });

  // ============================================================================
  // PHASE 8: SCHEDULE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing on-call schedule');
  const scheduleImplementation = await ctx.task(implementScheduleTask, {
    toolChoice,
    rotationDesign,
    escalationPolicies,
    teamMembers,
    outputDir
  });

  artifacts.push(...scheduleImplementation.artifacts);

  // ============================================================================
  // PHASE 9: MONITORING AND METRICS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up monitoring and metrics tracking');
  const metricsSetup = await ctx.task(setupMetricsAndMonitoringTask, {
    toolChoice,
    outputDir
  });

  artifacts.push(...metricsSetup.artifacts);

  await ctx.checkpoint({
    title: 'Phase 9: Metrics and Monitoring Setup Complete',
    message: `Configured ${metricsSetup.metricsTracked.length} incident metrics and ${metricsSetup.dashboardsCreated} dashboards.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        metricsTracked: metricsSetup.metricsTracked.length,
        dashboardsCreated: metricsSetup.dashboardsCreated,
        alertsConfigured: metricsSetup.alertsConfigured
      }
    }
  });

  // ============================================================================
  // PHASE 10: VALIDATION AND GO-LIVE
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating setup and preparing for go-live');
  const validation = await ctx.task(validateAndGoLiveTask, {
    currentStateAssessment,
    toolSetup,
    rotationDesign,
    escalationPolicies,
    alertRouting,
    runbooksAndDocs,
    training,
    scheduleImplementation,
    metricsSetup,
    minimumTeamSize,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const teamReadiness = validation.readinessScore;
  const success = validation.readyForGoLive;

  await ctx.breakpoint({
    question: `On-call setup validation complete. Readiness score: ${teamReadiness}/100. ${success ? 'System is ready for go-live!' : 'Additional work needed before go-live.'} Approve final configuration and activate on-call schedule?`,
    title: 'Final Go-Live Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        readinessScore: teamReadiness,
        readyForGoLive: success,
        totalArtifacts: artifacts.length,
        teamSize: teamMembers.length,
        scheduleConfigured: scheduleImplementation.success,
        escalationPoliciesActive: escalationPolicies.policies.length,
        setupDuration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success,
    scheduleConfigured: scheduleImplementation.success,
    tool: toolChoice,
    teamSize: teamMembers.length,
    rotationSchedule: rotationDesign.rotationType,
    escalationPolicies: escalationPolicies.policies,
    toolingSetup: {
      tool: toolChoice,
      usersCreated: toolSetup.usersCreated,
      integrationsConfigured: toolSetup.integrationsConfigured,
      alertsRouted: alertRouting.alertsConfigured
    },
    runbooks: {
      runbooksCreated: runbooksAndDocs.runbooksCreated,
      documentsCreated: runbooksAndDocs.documentsCreated,
      coverageScore: runbooksAndDocs.coverageScore
    },
    training: {
      trainedMembers: training.trainedMembers,
      simulationScore: training.simulationScore,
      readinessLevel: training.readinessLevel
    },
    metrics: {
      metricsTracked: metricsSetup.metricsTracked,
      dashboardsCreated: metricsSetup.dashboardsCreated,
      alertsConfigured: metricsSetup.alertsConfigured
    },
    teamReadiness,
    validation: {
      readyForGoLive: validation.readyForGoLive,
      validationChecks: validation.validationChecks,
      recommendations: validation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'devops-sre-platform/oncall-setup',
      timestamp: startTime,
      toolChoice,
      teamSize: teamMembers.length,
      rotationSchedule,
      escalationLevels,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Assess Current State
export const assessCurrentStateTask = defineTask('assess-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current incident management practices',
  agent: {
    name: 'incident-management-assessor',
    prompt: {
      role: 'senior SRE and incident management specialist',
      task: 'Assess current incident management practices, identify gaps, and determine maturity level',
      context: args,
      instructions: [
        'Evaluate current incident response practices and processes',
        'Assess existing on-call arrangements (formal or informal)',
        'Identify current alert sources and monitoring systems',
        'Review existing runbooks and documentation',
        'Assess team experience with incident management',
        'Identify pain points in current incident response',
        'Evaluate communication channels during incidents',
        'Determine incident management maturity level (Level 1-5)',
        'Document gaps and improvement opportunities',
        'Calculate current MTTR (Mean Time To Resolution) if data available',
        'Assess team burnout risk factors',
        'Generate comprehensive assessment report'
      ],
      outputFormat: 'JSON with maturityLevel (1-5), currentPractices (object), gaps (array), painPoints (array), recommendations (array), mttrBaseline (number), burnoutRisk (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maturityLevel', 'currentPractices', 'gaps', 'artifacts'],
      properties: {
        maturityLevel: { type: 'number', minimum: 1, maximum: 5 },
        currentPractices: {
          type: 'object',
          properties: {
            hasOnCall: { type: 'boolean' },
            hasRunbooks: { type: 'boolean' },
            hasEscalation: { type: 'boolean' },
            hasPostmortems: { type: 'boolean' },
            monitoringInPlace: { type: 'boolean' },
            alertingConfigured: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        painPoints: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        mttrBaseline: { type: 'number' },
        burnoutRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'incident-management', 'assessment']
}));

// Task 2: Setup On-Call Tool
export const setupOnCallToolTask = defineTask('setup-oncall-tool', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup on-call management tool',
  agent: {
    name: 'oncall-tool-engineer',
    prompt: {
      role: 'DevOps engineer specializing in incident management tooling',
      task: 'Configure on-call management tool, create users, and set up integrations',
      context: args,
      instructions: [
        'Provide setup instructions for the selected on-call tool',
        'Document account creation and team setup process',
        'Create user accounts for all team members',
        'Configure contact methods (email, SMS, phone, push notifications)',
        'Set up integration with Slack/Microsoft Teams',
        'Configure email integration for alerts',
        'Set up mobile app for team members',
        'Configure authentication (SSO if available)',
        'Set up notification preferences and quiet hours',
        'Create teams and user groups',
        'Configure timezone settings',
        'Test notification delivery for each contact method',
        'Document administrative procedures',
        'Create quick start guide for team members'
      ],
      outputFormat: 'JSON with usersCreated (number), integrationsConfigured (array), contactMethodsSetup (array), testResults (object), adminGuide (string), quickStartGuide (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['usersCreated', 'integrationsConfigured', 'contactMethodsSetup', 'artifacts'],
      properties: {
        usersCreated: { type: 'number' },
        integrationsConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              integration: { type: 'string' },
              status: { type: 'string', enum: ['configured', 'pending', 'failed'] },
              details: { type: 'string' }
            }
          }
        },
        contactMethodsSetup: { type: 'array', items: { type: 'string' } },
        testResults: {
          type: 'object',
          properties: {
            emailTested: { type: 'boolean' },
            smsTested: { type: 'boolean' },
            phoneTested: { type: 'boolean' },
            pushTested: { type: 'boolean' },
            slackTested: { type: 'boolean' }
          }
        },
        adminGuide: { type: 'string' },
        quickStartGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'tooling', 'setup']
}));

// Task 3: Design Rotation Schedule
export const designRotationScheduleTask = defineTask('design-rotation-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design on-call rotation schedule',
  agent: {
    name: 'schedule-designer',
    prompt: {
      role: 'SRE manager specializing in on-call rotation design',
      task: 'Design fair and sustainable on-call rotation schedule considering team size, timezones, and work-life balance',
      context: args,
      instructions: [
        'Analyze team member timezones and availability',
        'Design rotation schedule based on team size and preferences',
        'Calculate shift duration and handoff times',
        'Ensure fair distribution of on-call burden',
        'Consider follow-the-sun rotation if team is distributed globally',
        'Design primary and secondary on-call roles',
        'Plan rotation cadence (weekly, biweekly, etc.)',
        'Schedule handoff meetings for knowledge transfer',
        'Build in breaks and recovery time between rotations',
        'Design holiday and vacation coverage policy',
        'Create rotation calendar for next 6 months',
        'Calculate fairness score (equal distribution of shifts)',
        'Identify scheduling conflicts and mitigation strategies',
        'Document rotation rules and swap procedures'
      ],
      outputFormat: 'JSON with rotationType (string), shiftsPerCycle (number), shiftDuration (string), fairnessScore (0-100), rotationCalendar (array), handoffSchedule (object), holidayPolicy (string), swapProcedure (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rotationType', 'shiftsPerCycle', 'fairnessScore', 'rotationCalendar', 'artifacts'],
      properties: {
        rotationType: { type: 'string' },
        shiftsPerCycle: { type: 'number' },
        shiftDuration: { type: 'string' },
        fairnessScore: { type: 'number', minimum: 0, maximum: 100 },
        rotationCalendar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              primaryOnCall: { type: 'string' },
              secondaryOnCall: { type: 'string' },
              timeZone: { type: 'string' }
            }
          }
        },
        handoffSchedule: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            duration: { type: 'string' },
            agenda: { type: 'array', items: { type: 'string' } }
          }
        },
        holidayPolicy: { type: 'string' },
        swapProcedure: { type: 'string' },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'scheduling', 'rotation']
}));

// Task 4: Define Escalation Policies
export const defineEscalationPoliciesTask = defineTask('define-escalation-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define escalation policies',
  agent: {
    name: 'escalation-designer',
    prompt: {
      role: 'incident management architect',
      task: 'Design comprehensive escalation policies that ensure timely incident response and appropriate escalation',
      context: args,
      instructions: [
        'Define escalation levels based on team structure (L1, L2, L3, management)',
        'Assign team members to appropriate escalation levels',
        'Configure escalation timeouts (e.g., 15 min, 30 min, 1 hour)',
        'Design escalation triggers (unacknowledged, unresolved)',
        'Create severity-based escalation policies (SEV-1 immediate, SEV-2 delayed)',
        'Configure parallel notification for critical incidents',
        'Design escalation paths for different service teams',
        'Implement escalation to management for extended outages',
        'Configure weekend and after-hours escalation policies',
        'Design escalation for specific alert types or services',
        'Document escalation decision tree',
        'Calculate average time to escalation for each level',
        'Define de-escalation criteria',
        'Create escalation flowcharts and decision matrices'
      ],
      outputFormat: 'JSON with policies (array), escalationLevels (array), averageEscalationTime (string), escalationMatrix (object), decisionTree (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'escalationLevels', 'averageEscalationTime', 'artifacts'],
      properties: {
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policyName: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              levels: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level: { type: 'number' },
                    targets: { type: 'array', items: { type: 'string' } },
                    timeout: { type: 'string' },
                    notificationMethod: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        escalationLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              members: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        averageEscalationTime: { type: 'string' },
        escalationMatrix: { type: 'object' },
        decisionTree: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'escalation', 'policies']
}));

// Task 5: Configure Alert Routing
export const configureAlertRoutingTask = defineTask('configure-alert-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure alert routing and integration',
  agent: {
    name: 'alert-routing-engineer',
    prompt: {
      role: 'monitoring and alerting specialist',
      task: 'Configure alert routing from monitoring systems to on-call tool with proper service mapping',
      context: args,
      instructions: [
        'Identify all alert sources (Prometheus, CloudWatch, Datadog, etc.)',
        'Configure integration between monitoring systems and on-call tool',
        'Map alerts to appropriate escalation policies',
        'Configure alert severity mapping (critical, warning, info)',
        'Set up service-based routing (alerts route to service owner)',
        'Implement intelligent alert grouping and deduplication',
        'Configure alert suppression during maintenance windows',
        'Set up alert enrichment with context and runbook links',
        'Test alert routing for each severity and service',
        'Configure alert auto-resolution',
        'Document alert routing rules and logic',
        'Create troubleshooting guide for missed alerts'
      ],
      outputFormat: 'JSON with alertsConfigured (number), routingRules (array), integrations (array), testResults (object), suppressionPolicies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alertsConfigured', 'routingRules', 'integrations', 'artifacts'],
      properties: {
        alertsConfigured: { type: 'number' },
        routingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              destination: { type: 'string' },
              escalationPolicy: { type: 'string' }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string', enum: ['active', 'pending', 'failed'] },
              alertsRouted: { type: 'number' }
            }
          }
        },
        testResults: {
          type: 'object',
          properties: {
            criticalAlertTested: { type: 'boolean' },
            warningAlertTested: { type: 'boolean' },
            routingVerified: { type: 'boolean' },
            escalationTested: { type: 'boolean' }
          }
        },
        suppressionPolicies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'alerts', 'routing']
}));

// Task 6: Create Runbooks and Documentation
export const createRunbooksAndDocsTask = defineTask('create-runbooks-and-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create runbooks and on-call documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical writer specializing in incident response documentation',
      task: 'Create comprehensive runbooks and documentation for on-call engineers',
      context: args,
      instructions: [
        'Create runbooks for common incident scenarios',
        'Document troubleshooting steps for each service',
        'Create on-call handbook covering policies and procedures',
        'Document escalation procedures and contact information',
        'Create incident response playbooks by severity',
        'Document emergency rollback procedures',
        'Create communication templates for stakeholder updates',
        'Document postmortem process and template',
        'Create FAQ for common on-call questions',
        'Document how to use on-call tooling',
        'Create quick reference cards for common tasks',
        'Document on-call handoff procedures',
        'Link runbooks to relevant alerts',
        'Calculate documentation coverage score'
      ],
      outputFormat: 'JSON with runbooksCreated (number), documentsCreated (number), coverageScore (0-100), runbookList (array), documentList (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['runbooksCreated', 'documentsCreated', 'coverageScore', 'artifacts'],
      properties: {
        runbooksCreated: { type: 'number' },
        documentsCreated: { type: 'number' },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        runbookList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              service: { type: 'string' },
              scenario: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        documentList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'documentation', 'runbooks']
}));

// Task 7: Conduct Training and Simulations
export const conductTrainingAndSimulationsTask = defineTask('conduct-training-simulations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct team training and incident simulations',
  agent: {
    name: 'training-coordinator',
    prompt: {
      role: 'SRE trainer and incident management coach',
      task: 'Design and execute training program including incident simulation exercises',
      context: args,
      instructions: [
        'Create on-call training curriculum',
        'Train team on on-call tool usage (acknowledging, escalating, resolving)',
        'Train on escalation procedures and policies',
        'Conduct runbook walkthrough sessions',
        'Train on incident communication best practices',
        'Teach incident severity assessment',
        'Train on postmortem writing',
        'Design incident simulation exercise (fire drill)',
        'Execute simulated incident with realistic scenario',
        'Observe team response and identify gaps',
        'Measure key metrics: time to acknowledge, time to escalate, time to resolve',
        'Provide feedback and coaching',
        'Score simulation performance',
        'Assess overall team readiness level',
        'Document lessons learned and improvement areas'
      ],
      outputFormat: 'JSON with trainedMembers (number), trainingSessions (array), simulationScore (0-100), simulationMetrics (object), readinessLevel (string), lessonLearned (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainedMembers', 'trainingSessions', 'simulationScore', 'readinessLevel', 'artifacts'],
      properties: {
        trainedMembers: { type: 'number' },
        trainingSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              duration: { type: 'string' },
              attendees: { type: 'number' },
              materials: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        simulationScore: { type: 'number', minimum: 0, maximum: 100 },
        simulationMetrics: {
          type: 'object',
          properties: {
            timeToAcknowledge: { type: 'string' },
            timeToEscalate: { type: 'string' },
            timeToResolve: { type: 'string' },
            communicationQuality: { type: 'string', enum: ['excellent', 'good', 'needs-improvement'] }
          }
        },
        readinessLevel: { type: 'string', enum: ['not-ready', 'partially-ready', 'ready', 'highly-ready'] },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'training', 'simulation']
}));

// Task 8: Implement Schedule
export const implementScheduleTask = defineTask('implement-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement on-call schedule in tool',
  agent: {
    name: 'schedule-implementer',
    prompt: {
      role: 'DevOps engineer specializing in on-call tooling',
      task: 'Implement designed rotation schedule in the on-call management tool',
      context: args,
      instructions: [
        'Create schedule objects in on-call tool',
        'Configure primary on-call schedule with rotation rules',
        'Configure secondary on-call schedule',
        'Set up schedule layers for different services if needed',
        'Assign team members to schedule slots',
        'Configure schedule handoff times',
        'Link schedules to escalation policies',
        'Set up schedule overrides for holidays and vacations',
        'Test schedule notifications',
        'Verify correct person is on-call at different times',
        'Create schedule reporting and visibility',
        'Document schedule management procedures',
        'Train team on schedule swap procedures'
      ],
      outputFormat: 'JSON with success (boolean), schedulesCreated (number), scheduleDetails (array), verificationResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'schedulesCreated', 'scheduleDetails', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        schedulesCreated: { type: 'number' },
        scheduleDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scheduleName: { type: 'string' },
              type: { type: 'string', enum: ['primary', 'secondary', 'backup'] },
              rotationType: { type: 'string' },
              membersAssigned: { type: 'number' }
            }
          }
        },
        verificationResults: {
          type: 'object',
          properties: {
            scheduleActive: { type: 'boolean' },
            notificationsWorking: { type: 'boolean' },
            handoffsConfigured: { type: 'boolean' },
            overridesWork: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'scheduling', 'implementation']
}));

// Task 9: Setup Metrics and Monitoring
export const setupMetricsAndMonitoringTask = defineTask('setup-metrics-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup incident metrics and monitoring dashboards',
  agent: {
    name: 'metrics-engineer',
    prompt: {
      role: 'SRE metrics and observability specialist',
      task: 'Configure incident metrics tracking, dashboards, and reporting for continuous improvement',
      context: args,
      instructions: [
        'Define key incident metrics to track (MTTA, MTTR, incident count, severity distribution)',
        'Configure incident metrics collection in on-call tool',
        'Create incident dashboard showing key metrics',
        'Set up on-call load distribution dashboard',
        'Create alert noise dashboard (alert volume, false positives)',
        'Configure weekly/monthly incident reports',
        'Set up burnout indicators dashboard (interruptions, off-hours alerts)',
        'Create escalation metrics dashboard',
        'Configure SLO breach correlation with incidents',
        'Set up alerts for concerning trends (high incident rate, long MTTR)',
        'Document metrics definitions and calculation methods',
        'Create metrics review process for team retrospectives'
      ],
      outputFormat: 'JSON with metricsTracked (array), dashboardsCreated (number), alertsConfigured (number), reportingSetup (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsTracked', 'dashboardsCreated', 'alertsConfigured', 'artifacts'],
      properties: {
        metricsTracked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              definition: { type: 'string' },
              target: { type: 'string' },
              unit: { type: 'string' }
            }
          }
        },
        dashboardsCreated: { type: 'number' },
        alertsConfigured: { type: 'number' },
        reportingSetup: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            recipients: { type: 'array', items: { type: 'string' } },
            format: { type: 'string' }
          }
        },
        dashboardList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              metricsIncluded: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'metrics', 'monitoring']
}));

// Task 10: Validate and Go-Live
export const validateAndGoLiveTask = defineTask('validate-and-golive', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate setup and prepare for go-live',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'SRE lead and incident management auditor',
      task: 'Validate complete on-call setup against best practices and prepare for go-live',
      context: args,
      instructions: [
        'Verify all team members are trained and ready',
        'Check all schedules are configured correctly',
        'Verify escalation policies are active and tested',
        'Confirm alert routing is working for all sources',
        'Validate runbook coverage for critical services',
        'Check integration health (Slack, email, SMS, phone)',
        'Verify metrics and dashboards are functional',
        'Conduct final incident simulation',
        'Review team feedback and concerns',
        'Validate minimum team size for sustainable on-call',
        'Check for single points of failure in escalation',
        'Verify after-hours coverage is adequate',
        'Calculate overall readiness score (0-100)',
        'Identify any remaining blockers to go-live',
        'Provide go/no-go recommendation',
        'Create go-live checklist and rollout plan',
        'Document known gaps and improvement backlog'
      ],
      outputFormat: 'JSON with readyForGoLive (boolean), readinessScore (0-100), validationChecks (array), blockers (array), recommendations (array), goLiveChecklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyForGoLive', 'readinessScore', 'validationChecks', 'artifacts'],
      properties: {
        readyForGoLive: { type: 'boolean' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blocker: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        goLiveChecklist: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        improvementBacklog: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'oncall', 'validation', 'go-live']
}));

// Quality gates for on-call setup
export const qualityGates = {
  minimumTeamSize: {
    description: 'Minimum number of team members for sustainable on-call rotation',
    threshold: 3,
    metric: 'teamSize'
  },
  trainedMembers: {
    description: 'Percentage of team members trained on on-call procedures',
    threshold: 100,
    metric: 'trainedPercentage'
  },
  simulationScore: {
    description: 'Team performance on incident simulation exercise',
    threshold: 75,
    metric: 'simulationScore'
  },
  runbookCoverage: {
    description: 'Percentage of critical services covered by runbooks',
    threshold: 80,
    metric: 'runbookCoverageScore'
  },
  escalationTested: {
    description: 'Escalation policies tested and verified',
    threshold: 100,
    metric: 'escalationTestCoverage'
  }
};

// Estimated duration
export const estimatedDuration = {
  assessment: '1 day',
  toolSetup: '1-2 days',
  scheduleDesign: '1 day',
  escalationPolicies: '1 day',
  alertRouting: '2-3 days',
  documentation: '3-5 days',
  training: '2-3 days',
  implementation: '1 day',
  validation: '1 day',
  total: '2-3 weeks'
};
