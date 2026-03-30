/**
 * @process specializations/domains/business/public-relations/crisis-communications-plan
 * @description Create comprehensive crisis playbooks including severity assessment matrix, escalation protocols, team roles (RACI), holding statements, and stakeholder notification procedures using SCCT framework
 * @specialization Public Relations and Communications
 * @category Crisis Communications
 * @inputs { organization: object, riskProfile: object, stakeholders: object[], existingProtocols: object }
 * @outputs { success: boolean, crisisPlan: object, playbooks: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    riskProfile = {},
    stakeholders = [],
    existingProtocols = {},
    industryVertical,
    regulatoryRequirements = [],
    targetQuality = 90
  } = inputs;

  // Phase 1: Crisis Risk Assessment
  await ctx.breakpoint({
    question: 'Starting crisis communications plan development. Conduct crisis risk assessment?',
    title: 'Phase 1: Risk Assessment',
    context: {
      runId: ctx.runId,
      phase: 'risk-assessment',
      organization: organization.name
    }
  });

  const riskAssessment = await ctx.task(assessCrisisRisksTask, {
    organization,
    riskProfile,
    industryVertical,
    regulatoryRequirements
  });

  // Phase 2: Severity Matrix Development
  await ctx.breakpoint({
    question: 'Risks assessed. Develop severity assessment matrix?',
    title: 'Phase 2: Severity Matrix',
    context: {
      runId: ctx.runId,
      phase: 'severity-matrix',
      riskCount: riskAssessment.risks.length
    }
  });

  const severityMatrix = await ctx.task(developSeverityMatrixTask, {
    riskAssessment,
    organization
  });

  // Phase 3: Team Structure and RACI
  await ctx.breakpoint({
    question: 'Severity matrix defined. Establish crisis team and RACI?',
    title: 'Phase 3: Team Structure',
    context: {
      runId: ctx.runId,
      phase: 'team-structure'
    }
  });

  const [teamStructure, raciMatrix] = await Promise.all([
    ctx.task(defineTeamStructureTask, {
      organization,
      severityMatrix
    }),
    ctx.task(developRaciMatrixTask, {
      organization,
      severityMatrix
    })
  ]);

  // Phase 4: Escalation Protocols
  await ctx.breakpoint({
    question: 'Team defined. Develop escalation protocols?',
    title: 'Phase 4: Escalation Protocols',
    context: {
      runId: ctx.runId,
      phase: 'escalation-protocols'
    }
  });

  const escalationProtocols = await ctx.task(developEscalationProtocolsTask, {
    severityMatrix,
    teamStructure,
    raciMatrix
  });

  // Phase 5: Stakeholder Notification Procedures
  await ctx.breakpoint({
    question: 'Escalation defined. Develop stakeholder notification procedures?',
    title: 'Phase 5: Stakeholder Notifications',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-notifications',
      stakeholderCount: stakeholders.length
    }
  });

  const notificationProcedures = await ctx.task(developNotificationProceduresTask, {
    stakeholders,
    severityMatrix,
    regulatoryRequirements
  });

  // Phase 6: Holding Statements and Templates
  await ctx.breakpoint({
    question: 'Notifications planned. Develop holding statements and templates?',
    title: 'Phase 6: Holding Statements',
    context: {
      runId: ctx.runId,
      phase: 'holding-statements'
    }
  });

  const [holdingStatements, messageTemplates] = await Promise.all([
    ctx.task(developHoldingStatementsTask, {
      riskAssessment,
      organization,
      severityMatrix
    }),
    ctx.task(developMessageTemplatesTask, {
      riskAssessment,
      stakeholders,
      severityMatrix
    })
  ]);

  // Phase 7: SCCT Framework Integration
  await ctx.breakpoint({
    question: 'Templates created. Integrate SCCT framework for response strategies?',
    title: 'Phase 7: SCCT Integration',
    context: {
      runId: ctx.runId,
      phase: 'scct-integration'
    }
  });

  const scctStrategies = await ctx.task(integrateSCCTFrameworkTask, {
    riskAssessment,
    severityMatrix,
    organization
  });

  // Phase 8: Scenario Playbooks
  await ctx.breakpoint({
    question: 'SCCT integrated. Develop scenario-specific playbooks?',
    title: 'Phase 8: Scenario Playbooks',
    context: {
      runId: ctx.runId,
      phase: 'scenario-playbooks',
      topRisks: riskAssessment.topRisks.length
    }
  });

  const scenarioPlaybooks = await ctx.task(developScenarioPlaybooksTask, {
    riskAssessment,
    severityMatrix,
    teamStructure,
    escalationProtocols,
    holdingStatements,
    scctStrategies
  });

  // Phase 9: Plan Assembly and Validation
  await ctx.breakpoint({
    question: 'Playbooks complete. Assemble and validate crisis plan?',
    title: 'Phase 9: Plan Assembly',
    context: {
      runId: ctx.runId,
      phase: 'plan-assembly',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateCrisisPlanTask, {
    riskAssessment,
    severityMatrix,
    teamStructure,
    raciMatrix,
    escalationProtocols,
    notificationProcedures,
    holdingStatements,
    messageTemplates,
    scctStrategies,
    scenarioPlaybooks,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      crisisPlan: {
        riskAssessment: riskAssessment.summary,
        severityMatrix,
        teamStructure,
        raciMatrix,
        escalationProtocols,
        notificationProcedures,
        holdingStatements: holdingStatements.statements,
        messageTemplates: messageTemplates.templates,
        scctStrategies
      },
      playbooks: scenarioPlaybooks.playbooks,
      quality,
      targetQuality,
      trainingRequirements: qualityResult.trainingRequirements,
      testingSchedule: qualityResult.testingSchedule,
      metadata: {
        processId: 'specializations/domains/business/public-relations/crisis-communications-plan',
        timestamp: ctx.now(),
        organization: organization.name,
        scenarioCount: scenarioPlaybooks.playbooks.length
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/crisis-communications-plan',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessCrisisRisksTask = defineTask('assess-crisis-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Crisis Risks',
  agent: {
    name: 'crisis-risk-assessor',
    prompt: {
      role: 'Crisis management consultant specializing in organizational risk assessment',
      task: 'Conduct comprehensive crisis risk assessment for organization',
      context: args,
      instructions: [
        'Identify potential crisis scenarios across all categories',
        'Assess operational, reputational, legal, and financial risks',
        'Evaluate industry-specific and regulatory risks',
        'Score risks by likelihood and potential impact',
        'Identify triggering events and warning signs',
        'Analyze historical crises in similar organizations',
        'Assess current preparedness and vulnerabilities',
        'Prioritize top 10-15 crisis scenarios for playbook development'
      ],
      outputFormat: 'JSON with risks array (scenario, category, likelihood, impact, triggerEvents), topRisks, vulnerabilities, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'topRisks', 'summary'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        topRisks: { type: 'array', items: { type: 'object' } },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'crisis-risk']
}));

export const developSeverityMatrixTask = defineTask('develop-severity-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Severity Assessment Matrix',
  agent: {
    name: 'severity-matrix-developer',
    prompt: {
      role: 'Crisis communications specialist designing severity frameworks',
      task: 'Develop severity assessment matrix for crisis classification',
      context: args,
      instructions: [
        'Define severity levels (e.g., Level 1-4 or Low/Medium/High/Critical)',
        'Establish criteria for each severity level',
        'Include media attention indicators',
        'Include business impact indicators',
        'Include stakeholder impact indicators',
        'Define response requirements per severity level',
        'Create decision tree for rapid severity assessment',
        'Include escalation triggers between levels'
      ],
      outputFormat: 'JSON with levels array (level, criteria, mediaIndicators, businessImpact, stakeholderImpact, responseRequirements), decisionTree, escalationTriggers'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'decisionTree'],
      properties: {
        levels: { type: 'array', items: { type: 'object' } },
        decisionTree: { type: 'object' },
        escalationTriggers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'severity-matrix']
}));

export const defineTeamStructureTask = defineTask('define-team-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Crisis Team Structure',
  agent: {
    name: 'team-structure-designer',
    prompt: {
      role: 'Organizational design specialist for crisis management teams',
      task: 'Define crisis communications team structure and roles',
      context: args,
      instructions: [
        'Define core crisis team composition',
        'Identify crisis team leader and deputy',
        'Define spokesperson roles and backups',
        'Include legal, HR, operations representatives',
        'Define extended team for specific scenarios',
        'Establish decision-making authority levels',
        'Define team activation procedures',
        'Include external support roles (PR agency, legal counsel)'
      ],
      outputFormat: 'JSON with coreTeam, extendedTeam, roles array (title, responsibilities, authority), activationProcedure, externalSupport'
    },
    outputSchema: {
      type: 'object',
      required: ['coreTeam', 'roles', 'activationProcedure'],
      properties: {
        coreTeam: { type: 'array', items: { type: 'object' } },
        extendedTeam: { type: 'array', items: { type: 'object' } },
        roles: { type: 'array', items: { type: 'object' } },
        activationProcedure: { type: 'object' },
        externalSupport: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'team-structure']
}));

export const developRaciMatrixTask = defineTask('develop-raci-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop RACI Matrix',
  agent: {
    name: 'raci-developer',
    prompt: {
      role: 'Process design specialist for crisis accountability',
      task: 'Develop RACI matrix for crisis communications activities',
      context: args,
      instructions: [
        'Define key crisis activities and decisions',
        'Assign Responsible, Accountable, Consulted, Informed for each',
        'Cover situation assessment activities',
        'Cover message development and approval',
        'Cover media response activities',
        'Cover stakeholder communications',
        'Cover operational coordination',
        'Ensure clear accountability with no gaps'
      ],
      outputFormat: 'JSON with activities array (activity, responsible, accountable, consulted, informed), matrix summary'
    },
    outputSchema: {
      type: 'object',
      required: ['activities'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              responsible: { type: 'string' },
              accountable: { type: 'string' },
              consulted: { type: 'array', items: { type: 'string' } },
              informed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        matrixSummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'raci-matrix']
}));

export const developEscalationProtocolsTask = defineTask('develop-escalation-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Escalation Protocols',
  agent: {
    name: 'escalation-protocol-developer',
    prompt: {
      role: 'Crisis management specialist designing escalation procedures',
      task: 'Develop escalation protocols for crisis situations',
      context: args,
      instructions: [
        'Define escalation triggers for each severity level',
        'Create notification chains with timing requirements',
        'Define after-hours and weekend escalation procedures',
        'Establish executive notification thresholds',
        'Include board notification requirements',
        'Define regulatory notification triggers',
        'Create de-escalation criteria',
        'Include fallback contacts and procedures'
      ],
      outputFormat: 'JSON with protocols array (severityLevel, triggers, notificationChain, timing), afterHours, executiveProtocol, deescalationCriteria'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        afterHours: { type: 'object' },
        executiveProtocol: { type: 'object' },
        deescalationCriteria: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'escalation-protocols']
}));

export const developNotificationProceduresTask = defineTask('develop-notification-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Stakeholder Notification Procedures',
  agent: {
    name: 'notification-procedure-developer',
    prompt: {
      role: 'Stakeholder communications specialist',
      task: 'Develop stakeholder notification procedures for crisis situations',
      context: args,
      instructions: [
        'Map stakeholders by priority and notification sequence',
        'Define notification triggers by stakeholder group',
        'Create notification channels and methods per stakeholder',
        'Define timing requirements (regulatory, contractual)',
        'Develop notification templates per stakeholder type',
        'Include confirmation and acknowledgment procedures',
        'Define follow-up communication cadence',
        'Include regulatory notification requirements'
      ],
      outputFormat: 'JSON with stakeholderMap, procedures array (stakeholder, trigger, channel, timing, template), regulatoryRequirements, confirmationProcess'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMap', 'procedures'],
      properties: {
        stakeholderMap: { type: 'object' },
        procedures: { type: 'array', items: { type: 'object' } },
        regulatoryRequirements: { type: 'array', items: { type: 'object' } },
        confirmationProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'notification-procedures']
}));

export const developHoldingStatementsTask = defineTask('develop-holding-statements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Holding Statements',
  agent: {
    name: 'holding-statement-developer',
    prompt: {
      role: 'Crisis communications writer specializing in initial response statements',
      task: 'Develop holding statements for rapid crisis response',
      context: args,
      instructions: [
        'Create generic holding statement template',
        'Develop scenario-specific holding statements for top risks',
        'Include acknowledgment of situation',
        'Express appropriate concern and empathy',
        'Commit to transparency and updates',
        'Include next steps and timeline for information',
        'Ensure legal and regulatory compliance',
        'Create variations for different channels (media, social, internal)'
      ],
      outputFormat: 'JSON with statements array (scenario, statement, channelVariations), genericTemplate, usageGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['statements', 'genericTemplate'],
      properties: {
        statements: { type: 'array', items: { type: 'object' } },
        genericTemplate: { type: 'object' },
        usageGuidelines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'holding-statements']
}));

export const developMessageTemplatesTask = defineTask('develop-message-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Message Templates',
  agent: {
    name: 'message-template-developer',
    prompt: {
      role: 'Crisis communications specialist developing message frameworks',
      task: 'Develop message templates for various crisis communication needs',
      context: args,
      instructions: [
        'Create employee communication templates',
        'Develop customer communication templates',
        'Create investor/board communication templates',
        'Develop media statement templates',
        'Create social media response templates',
        'Develop partner/vendor notification templates',
        'Include regulatory notification templates',
        'Create update and resolution announcement templates'
      ],
      outputFormat: 'JSON with templates array (audience, purpose, template, customizationPoints), channelGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['templates'],
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audience: { type: 'string' },
              purpose: { type: 'string' },
              template: { type: 'string' },
              customizationPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        channelGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'message-templates']
}));

export const integrateSCCTFrameworkTask = defineTask('integrate-scct-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate SCCT Framework',
  agent: {
    name: 'scct-integrator',
    prompt: {
      role: 'Crisis communications theorist expert in Situational Crisis Communication Theory',
      task: 'Integrate SCCT framework into crisis response strategies',
      context: args,
      instructions: [
        'Categorize crisis types per SCCT (victim, accidental, preventable)',
        'Assess organizational crisis history and reputation',
        'Define response strategies per crisis cluster',
        'Map deny strategies (attack accuser, denial, scapegoat)',
        'Map diminish strategies (excuse, justification)',
        'Map rebuild strategies (compensation, apology)',
        'Map bolstering strategies (reminder, ingratiation, victimage)',
        'Create strategy selection guide based on crisis type and history'
      ],
      outputFormat: 'JSON with crisisTypes, historyAssessment, strategies object (deny, diminish, rebuild, bolstering), selectionGuide'
    },
    outputSchema: {
      type: 'object',
      required: ['crisisTypes', 'strategies', 'selectionGuide'],
      properties: {
        crisisTypes: { type: 'array', items: { type: 'object' } },
        historyAssessment: { type: 'object' },
        strategies: {
          type: 'object',
          properties: {
            deny: { type: 'array', items: { type: 'object' } },
            diminish: { type: 'array', items: { type: 'object' } },
            rebuild: { type: 'array', items: { type: 'object' } },
            bolstering: { type: 'array', items: { type: 'object' } }
          }
        },
        selectionGuide: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'scct-framework']
}));

export const developScenarioPlaybooksTask = defineTask('develop-scenario-playbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Scenario Playbooks',
  agent: {
    name: 'scenario-playbook-developer',
    prompt: {
      role: 'Crisis management specialist creating scenario-specific response guides',
      task: 'Develop detailed playbooks for priority crisis scenarios',
      context: args,
      instructions: [
        'Create playbook for each top-priority crisis scenario',
        'Include scenario description and trigger indicators',
        'Define immediate response actions (first 30 minutes)',
        'Detail short-term response (first 24 hours)',
        'Include stakeholder-specific actions',
        'Reference applicable holding statements and templates',
        'Include SCCT strategy guidance',
        'Add checklist format for rapid execution',
        'Include recovery phase actions'
      ],
      outputFormat: 'JSON with playbooks array (scenario, severity, immediateActions, shortTermActions, stakeholderActions, messaging, checklist, recoveryPhase)'
    },
    outputSchema: {
      type: 'object',
      required: ['playbooks'],
      properties: {
        playbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              severity: { type: 'string' },
              immediateActions: { type: 'array', items: { type: 'object' } },
              shortTermActions: { type: 'array', items: { type: 'object' } },
              stakeholderActions: { type: 'array', items: { type: 'object' } },
              messaging: { type: 'object' },
              checklist: { type: 'array', items: { type: 'string' } },
              recoveryPhase: { type: 'object' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'scenario-playbooks']
}));

export const validateCrisisPlanTask = defineTask('validate-crisis-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Crisis Plan Quality',
  agent: {
    name: 'crisis-plan-validator',
    prompt: {
      role: 'Crisis preparedness auditor and quality assessor',
      task: 'Validate crisis communications plan completeness and quality',
      context: args,
      instructions: [
        'Assess risk coverage completeness',
        'Validate severity matrix clarity and usability',
        'Review team structure and RACI clarity',
        'Evaluate escalation protocol effectiveness',
        'Assess notification procedure completeness',
        'Review holding statement quality',
        'Validate SCCT framework integration',
        'Assess playbook actionability',
        'Identify training requirements',
        'Provide overall quality score (0-100)',
        'Recommend testing schedule'
      ],
      outputFormat: 'JSON with score, passed, componentScores, gaps, recommendations, trainingRequirements, testingSchedule'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        trainingRequirements: { type: 'array', items: { type: 'object' } },
        testingSchedule: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'plan-validation']
}));
