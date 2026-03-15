/**
 * @process specializations/domains/business/project-management/issue-management-escalation
 * @description Issue Management and Escalation - Identify, log, track, and resolve project issues
 * with appropriate escalation procedures and stakeholder communication.
 * @inputs { projectName: string, issues: array, stakeholders: array, escalationMatrix: object }
 * @outputs { success: boolean, issueLog: array, resolutions: array, escalationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/issue-management-escalation', {
 *   projectName: 'Data Migration',
 *   issues: [{ id: 'ISS001', title: 'Data quality concerns', severity: 'high' }],
 *   stakeholders: [{ name: 'Project Sponsor', role: 'sponsor' }],
 *   escalationMatrix: { levels: [{ level: 1, title: 'PM' }, { level: 2, title: 'Director' }] }
 * });
 *
 * @references
 * - PMI Issue Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - ITIL Problem Management: https://www.axelos.com/best-practice-solutions/itil
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    issues = [],
    stakeholders = [],
    escalationMatrix = {},
    projectConstraints = {}
  } = inputs;

  // Phase 1: Issue Management Framework
  const frameworkSetup = await ctx.task(issueFrameworkTask, {
    projectName,
    escalationMatrix,
    stakeholders
  });

  // Phase 2: Issue Identification and Logging
  const issueCategorization = await ctx.task(issueCategorizationTask, {
    projectName,
    issues,
    framework: frameworkSetup
  });

  // Breakpoint: Review categorized issues
  const criticalIssues = issueCategorization.issues?.filter(i => i.severity === 'critical') || [];
  if (criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `${criticalIssues.length} critical issues identified for ${projectName}. Review and prioritize?`,
      title: 'Critical Issue Review',
      context: {
        runId: ctx.runId,
        criticalCount: criticalIssues.length,
        files: [{
          path: `artifacts/critical-issues.json`,
          format: 'json',
          content: criticalIssues
        }]
      }
    });
  }

  // Phase 3: Issue Prioritization
  const issuePrioritization = await ctx.task(issuePrioritizationTask, {
    projectName,
    issues: issueCategorization.issues,
    projectConstraints
  });

  // Phase 4: Resolution Planning
  const resolutionPlanning = await ctx.task(resolutionPlanningTask, {
    projectName,
    prioritizedIssues: issuePrioritization,
    stakeholders
  });

  // Phase 5: Escalation Planning
  const escalationPlanning = await ctx.task(escalationPlanningTask, {
    projectName,
    issues: issuePrioritization,
    escalationMatrix,
    stakeholders
  });

  // Phase 6: Communication Planning
  const communicationPlan = await ctx.task(issueCommunicationTask, {
    projectName,
    issues: issuePrioritization,
    stakeholders,
    escalationPlanning
  });

  // Phase 7: Resolution Tracking
  const resolutionTracking = await ctx.task(resolutionTrackingTask, {
    projectName,
    resolutions: resolutionPlanning,
    framework: frameworkSetup
  });

  // Phase 8: Issue Reporting
  const issueReporting = await ctx.task(issueReportingTask, {
    projectName,
    issues: issuePrioritization,
    resolutions: resolutionPlanning,
    escalationPlanning
  });

  // Phase 9: Issue Management Documentation
  const issueDocumentation = await ctx.task(issueDocumentationTask, {
    projectName,
    framework: frameworkSetup,
    issues: issuePrioritization,
    resolutions: resolutionPlanning,
    escalationPlanning,
    communicationPlan,
    reporting: issueReporting
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Issue management setup complete for ${projectName}. ${issuePrioritization.prioritizedIssues?.length || 0} issues tracked. Approve management plan?`,
    title: 'Issue Management Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/issue-management.json`, format: 'json', content: issueDocumentation },
        { path: `artifacts/issue-management.md`, format: 'markdown', content: issueDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    issueLog: issuePrioritization.prioritizedIssues,
    resolutions: resolutionPlanning.resolutionPlans,
    escalationPlan: escalationPlanning,
    communicationPlan: communicationPlan,
    documentation: issueDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/issue-management-escalation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const issueFrameworkTask = defineTask('issue-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Issue Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Establish issue management framework',
      context: {
        projectName: args.projectName,
        escalationMatrix: args.escalationMatrix,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Define issue categories',
        '2. Establish severity levels',
        '3. Define priority classification',
        '4. Create issue lifecycle states',
        '5. Define roles and responsibilities',
        '6. Establish escalation triggers',
        '7. Define resolution SLAs',
        '8. Create issue templates',
        '9. Document approval workflows',
        '10. Compile framework document'
      ],
      outputFormat: 'JSON object with issue management framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework'],
      properties: {
        framework: { type: 'object' },
        categories: { type: 'array' },
        severityLevels: { type: 'array' },
        lifecycleStates: { type: 'array' },
        slas: { type: 'object' },
        templates: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'framework', 'setup']
}));

export const issueCategorizationTask = defineTask('issue-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Issue Categorization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Issue Analyst',
      task: 'Categorize and log issues',
      context: {
        projectName: args.projectName,
        issues: args.issues,
        framework: args.framework
      },
      instructions: [
        '1. Review all reported issues',
        '2. Validate issue information',
        '3. Assign categories',
        '4. Determine severity',
        '5. Identify root causes',
        '6. Assess impact',
        '7. Identify dependencies',
        '8. Assign unique IDs',
        '9. Log in issue register',
        '10. Summarize categorization'
      ],
      outputFormat: 'JSON object with categorized issues'
    },
    outputSchema: {
      type: 'object',
      required: ['issues'],
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              impact: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        issueRegister: { type: 'array' },
        categorySummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'categorization', 'logging']
}));

export const issuePrioritizationTask = defineTask('issue-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Issue Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Priority Manager',
      task: 'Prioritize issues',
      context: {
        projectName: args.projectName,
        issues: args.issues,
        projectConstraints: args.projectConstraints
      },
      instructions: [
        '1. Apply prioritization criteria',
        '2. Assess business impact',
        '3. Evaluate urgency',
        '4. Consider resource availability',
        '5. Analyze dependencies',
        '6. Calculate priority scores',
        '7. Create priority ranking',
        '8. Identify quick wins',
        '9. Flag blocked issues',
        '10. Compile prioritized list'
      ],
      outputFormat: 'JSON object with prioritized issues'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedIssues'],
      properties: {
        prioritizedIssues: { type: 'array' },
        priorityMatrix: { type: 'object' },
        quickWins: { type: 'array' },
        blockedIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'prioritization', 'ranking']
}));

export const resolutionPlanningTask = defineTask('resolution-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Resolution Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resolution Planner',
      task: 'Plan issue resolutions',
      context: {
        projectName: args.projectName,
        prioritizedIssues: args.prioritizedIssues,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Analyze each issue',
        '2. Identify resolution options',
        '3. Evaluate options',
        '4. Select preferred approach',
        '5. Define action items',
        '6. Assign owners',
        '7. Set target dates',
        '8. Identify dependencies',
        '9. Define success criteria',
        '10. Compile resolution plans'
      ],
      outputFormat: 'JSON object with resolution plans'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutionPlans'],
      properties: {
        resolutionPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              approach: { type: 'string' },
              actionItems: { type: 'array' },
              owner: { type: 'string' },
              targetDate: { type: 'string' },
              successCriteria: { type: 'array' }
            }
          }
        },
        resourceRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'resolution', 'planning']
}));

export const escalationPlanningTask = defineTask('escalation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Escalation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Escalation Manager',
      task: 'Plan escalation procedures',
      context: {
        projectName: args.projectName,
        issues: args.issues,
        escalationMatrix: args.escalationMatrix,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Define escalation levels',
        '2. Map issues to levels',
        '3. Identify escalation contacts',
        '4. Define escalation triggers',
        '5. Set escalation timelines',
        '6. Create escalation paths',
        '7. Document procedures',
        '8. Define de-escalation criteria',
        '9. Create escalation templates',
        '10. Compile escalation plan'
      ],
      outputFormat: 'JSON object with escalation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['escalationPlan'],
      properties: {
        escalationPlan: { type: 'object' },
        escalationLevels: { type: 'array' },
        escalationPaths: { type: 'array' },
        triggers: { type: 'array' },
        templates: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'escalation', 'planning']
}));

export const issueCommunicationTask = defineTask('issue-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Issue Communication - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Manager',
      task: 'Plan issue communications',
      context: {
        projectName: args.projectName,
        issues: args.issues,
        stakeholders: args.stakeholders,
        escalationPlanning: args.escalationPlanning
      },
      instructions: [
        '1. Identify communication needs',
        '2. Map stakeholder requirements',
        '3. Define communication frequency',
        '4. Create communication templates',
        '5. Define channels',
        '6. Plan status updates',
        '7. Define urgent notifications',
        '8. Create reporting schedule',
        '9. Document feedback process',
        '10. Compile communication plan'
      ],
      outputFormat: 'JSON object with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationPlan'],
      properties: {
        communicationPlan: { type: 'object' },
        templates: { type: 'array' },
        schedule: { type: 'array' },
        channels: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'communication', 'stakeholder']
}));

export const resolutionTrackingTask = defineTask('resolution-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Resolution Tracking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tracking Specialist',
      task: 'Establish resolution tracking system',
      context: {
        projectName: args.projectName,
        resolutions: args.resolutions,
        framework: args.framework
      },
      instructions: [
        '1. Define tracking metrics',
        '2. Create tracking dashboard',
        '3. Set up status monitoring',
        '4. Define progress indicators',
        '5. Create aging reports',
        '6. Set up alerts',
        '7. Define review checkpoints',
        '8. Create trend analysis',
        '9. Document tracking procedures',
        '10. Compile tracking system'
      ],
      outputFormat: 'JSON object with tracking system'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingSystem'],
      properties: {
        trackingSystem: { type: 'object' },
        metrics: { type: 'array' },
        dashboardDesign: { type: 'object' },
        alerts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'tracking', 'monitoring']
}));

export const issueReportingTask = defineTask('issue-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Issue Reporting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reporting Analyst',
      task: 'Create issue reporting framework',
      context: {
        projectName: args.projectName,
        issues: args.issues,
        resolutions: args.resolutions,
        escalationPlanning: args.escalationPlanning
      },
      instructions: [
        '1. Define report types',
        '2. Create report templates',
        '3. Define reporting frequency',
        '4. Identify report recipients',
        '5. Create executive summary format',
        '6. Define detailed report format',
        '7. Create trend reports',
        '8. Define metrics reports',
        '9. Document distribution process',
        '10. Compile reporting framework'
      ],
      outputFormat: 'JSON object with reporting framework'
    },
    outputSchema: {
      type: 'object',
      required: ['reportingFramework'],
      properties: {
        reportingFramework: { type: 'object' },
        reportTemplates: { type: 'array' },
        schedule: { type: 'array' },
        distributionList: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'reporting', 'analytics']
}));

export const issueDocumentationTask = defineTask('issue-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Issue Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile issue management documentation',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        issues: args.issues,
        resolutions: args.resolutions,
        escalationPlanning: args.escalationPlanning,
        communicationPlan: args.communicationPlan,
        reporting: args.reporting
      },
      instructions: [
        '1. Compile all documentation',
        '2. Create issue management guide',
        '3. Document procedures',
        '4. Create quick reference cards',
        '5. Generate markdown report',
        '6. Add recommendations',
        '7. Include templates',
        '8. Add appendices',
        '9. Document version control',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with issue documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        procedures: { type: 'array' },
        templates: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['issue', 'documentation', 'deliverable']
}));
