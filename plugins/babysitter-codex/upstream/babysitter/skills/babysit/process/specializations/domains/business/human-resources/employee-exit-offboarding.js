/**
 * @process employee-exit-offboarding
 * @description Comprehensive process for managing employee separations including voluntary
 * resignations, involuntary terminations, retirements, and reductions in force while ensuring
 * compliance, knowledge transfer, and positive departing employee experience.
 * @inputs {
 *   organizationContext: { industry, size, culture, policies },
 *   separationDetails: { type, reason, effectiveDate, employee },
 *   complianceRequirements: { regulations, contractual, benefits },
 *   stakeholders: { hr, manager, it, facilities, payroll },
 *   knowledgeTransfer: { criticalKnowledge, successorPlan }
 * }
 * @outputs {
 *   exitProcess: { timeline, tasks, communications },
 *   compliance: { documentation, finalPay, benefits, legal },
 *   knowledgeTransfer: { documentation, training, handoff },
 *   analytics: { exitInterview, trends, insights }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'technology', size: 'mid-market' },
 *   separationDetails: { type: 'voluntary', reason: 'resignation', noticePeriod: 14 },
 *   knowledgeTransfer: { criticalKnowledge: true }
 * });
 * @references
 * - SHRM Employee Offboarding Best Practices
 * - WARN Act Requirements
 * - COBRA Administration Guidelines
 * - State Final Pay Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, separationDetails, complianceRequirements, stakeholders, knowledgeTransfer } = inputs;

  // Phase 1: Separation Initiation
  const separationInitiation = await ctx.task('initiate-separation', {
    separationDetails,
    organizationContext,
    initiationElements: [
      'separation type determination',
      'effective date confirmation',
      'notice period calculation',
      'initial documentation',
      'stakeholder notification'
    ]
  });

  // Phase 2: Compliance Assessment
  const complianceAssessment = await ctx.task('assess-compliance-requirements', {
    separationDetails,
    complianceRequirements,
    organizationContext,
    assessmentElements: [
      'legal and regulatory requirements',
      'contractual obligations review',
      'benefits continuation requirements',
      'final pay calculations',
      'restrictive covenant analysis'
    ]
  });

  // Phase 3: Separation Plan Development
  const separationPlan = await ctx.task('develop-separation-plan', {
    separationInitiation,
    complianceAssessment,
    separationDetails,
    planElements: [
      'timeline and milestones',
      'task assignments',
      'communication schedule',
      'access revocation timing',
      'equipment return process'
    ]
  });

  // Phase 4: Manager Briefing and Approval
  await ctx.breakpoint('separation-plan-approval', {
    title: 'Separation Plan Approval',
    description: 'Review and approve employee separation plan',
    artifacts: {
      separationInitiation,
      complianceAssessment,
      separationPlan
    },
    questions: [
      'Is the separation timeline appropriate?',
      'Are all compliance requirements addressed?',
      'Is the knowledge transfer plan adequate?'
    ]
  });

  // Phase 5: Knowledge Transfer Planning
  const knowledgeTransferPlan = await ctx.task('plan-knowledge-transfer', {
    separationPlan,
    knowledgeTransfer,
    separationDetails,
    planElements: [
      'critical knowledge identification',
      'documentation requirements',
      'successor/coverage identification',
      'training schedule',
      'project handoff timeline'
    ]
  });

  // Phase 6: Exit Communication
  const exitCommunication = await ctx.task('manage-exit-communication', {
    separationPlan,
    separationDetails,
    stakeholders,
    communicationElements: [
      'employee communication',
      'team announcement',
      'client/stakeholder notification',
      'internal partnership notification',
      'reference policy communication'
    ]
  });

  // Phase 7: Knowledge Transfer Execution
  const knowledgeTransferExecution = await ctx.task('execute-knowledge-transfer', {
    knowledgeTransferPlan,
    executionElements: [
      'documentation creation/updates',
      'successor training delivery',
      'process walkthroughs',
      'relationship introductions',
      'project status handoff'
    ]
  });

  // Phase 8: Exit Interview
  const exitInterview = await ctx.task('conduct-exit-interview', {
    separationDetails,
    organizationContext,
    interviewElements: [
      'interview scheduling',
      'structured interview execution',
      'feedback documentation',
      'trend analysis contribution',
      'actionable insight extraction'
    ]
  });

  // Phase 9: Benefits and Final Pay Processing
  const benefitsAndPay = await ctx.task('process-benefits-final-pay', {
    separationDetails,
    complianceAssessment,
    processingElements: [
      'final pay calculation',
      'PTO payout processing',
      'COBRA notification',
      'retirement account processing',
      'equity vesting reconciliation'
    ]
  });

  // Phase 10: Access Revocation
  const accessRevocation = await ctx.task('revoke-access', {
    separationPlan,
    separationDetails,
    revocationElements: [
      'system access termination',
      'badge deactivation',
      'email and communication access',
      'cloud and SaaS applications',
      'physical access revocation'
    ]
  });

  // Phase 11: Asset Recovery
  const assetRecovery = await ctx.task('recover-assets', {
    separationPlan,
    recoveryElements: [
      'equipment inventory verification',
      'laptop and mobile device return',
      'company credit card cancellation',
      'keys and access cards collection',
      'intellectual property verification'
    ]
  });

  // Phase 12: Final Documentation
  const finalDocumentation = await ctx.task('complete-final-documentation', {
    separationDetails,
    complianceAssessment,
    benefitsAndPay,
    documentationElements: [
      'separation agreement (if applicable)',
      'final pay documentation',
      'benefits continuation paperwork',
      'reference authorization',
      'personnel file completion'
    ]
  });

  // Phase 13: Offboarding Completion
  const offboardingCompletion = await ctx.task('complete-offboarding', {
    finalDocumentation,
    accessRevocation,
    assetRecovery,
    completionElements: [
      'offboarding checklist verification',
      'manager sign-off',
      'HR system updates',
      'alumni network invitation',
      'feedback survey'
    ]
  });

  // Phase 14: Analytics and Reporting
  const analyticsReporting = await ctx.task('analyze-and-report', {
    exitInterview,
    separationDetails,
    analyticsElements: [
      'exit interview analysis',
      'turnover trend contribution',
      'manager dashboard update',
      'retention insights',
      'process improvement recommendations'
    ]
  });

  return {
    exitProcess: {
      initiation: separationInitiation,
      plan: separationPlan,
      communications: exitCommunication
    },
    compliance: {
      assessment: complianceAssessment,
      benefitsAndPay,
      documentation: finalDocumentation
    },
    knowledgeTransfer: {
      plan: knowledgeTransferPlan,
      execution: knowledgeTransferExecution
    },
    analytics: {
      exitInterview,
      reporting: analyticsReporting
    },
    completion: offboardingCompletion,
    metrics: {
      separationType: separationDetails.type,
      processCompletionDays: offboardingCompletion.daysToComplete,
      knowledgeTransferComplete: knowledgeTransferExecution.completionStatus
    }
  };
}

export const initiateSeparation = defineTask('initiate-separation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Initiate Separation',
  agent: {
    name: 'hr-generalist',
    prompt: {
      role: 'Separation Initiation Specialist',
      task: 'Initiate employee separation process',
      context: args,
      instructions: [
        'Determine separation type and category',
        'Confirm effective date',
        'Calculate notice period requirements',
        'Create initial documentation',
        'Notify key stakeholders'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        separationType: { type: 'string' },
        effectiveDate: { type: 'string' },
        noticePeriod: { type: 'object' },
        initialDocumentation: { type: 'object' },
        notifications: { type: 'array' }
      },
      required: ['separationType', 'effectiveDate']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessComplianceRequirements = defineTask('assess-compliance-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Compliance Requirements',
  agent: {
    name: 'hr-compliance-specialist',
    prompt: {
      role: 'Separation Compliance Expert',
      task: 'Assess all compliance requirements for separation',
      context: args,
      instructions: [
        'Identify legal and regulatory requirements',
        'Review contractual obligations',
        'Determine benefits continuation requirements',
        'Calculate final pay components',
        'Analyze restrictive covenant implications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        legalRequirements: { type: 'array' },
        contractualObligations: { type: 'array' },
        benefitsRequirements: { type: 'object' },
        finalPayComponents: { type: 'object' },
        restrictiveCovenants: { type: 'object' }
      },
      required: ['legalRequirements', 'finalPayComponents']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developSeparationPlan = defineTask('develop-separation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Separation Plan',
  agent: {
    name: 'hr-generalist',
    prompt: {
      role: 'Separation Planning Specialist',
      task: 'Develop comprehensive separation plan',
      context: args,
      instructions: [
        'Create detailed timeline and milestones',
        'Assign tasks to stakeholders',
        'Schedule communications',
        'Plan access revocation timing',
        'Organize equipment return process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        timeline: { type: 'array' },
        taskAssignments: { type: 'array' },
        communicationSchedule: { type: 'array' },
        accessRevocationPlan: { type: 'object' },
        equipmentReturnPlan: { type: 'object' }
      },
      required: ['timeline', 'taskAssignments']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const planKnowledgeTransfer = defineTask('plan-knowledge-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Knowledge Transfer',
  agent: {
    name: 'talent-management-specialist',
    prompt: {
      role: 'Knowledge Transfer Planner',
      task: 'Plan comprehensive knowledge transfer',
      context: args,
      instructions: [
        'Identify critical knowledge areas',
        'Define documentation requirements',
        'Identify successors or coverage',
        'Create training schedule',
        'Plan project handoff timeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        criticalKnowledge: { type: 'array' },
        documentationRequirements: { type: 'array' },
        successorPlan: { type: 'object' },
        trainingSchedule: { type: 'array' },
        projectHandoffs: { type: 'array' }
      },
      required: ['criticalKnowledge', 'successorPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const manageExitCommunication = defineTask('manage-exit-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage Exit Communication',
  agent: {
    name: 'hr-communications-specialist',
    prompt: {
      role: 'Exit Communication Manager',
      task: 'Manage all separation communications',
      context: args,
      instructions: [
        'Prepare employee communication',
        'Draft team announcement',
        'Plan client/stakeholder notifications',
        'Coordinate internal partnership updates',
        'Communicate reference policy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        employeeCommunication: { type: 'object' },
        teamAnnouncement: { type: 'object' },
        stakeholderNotifications: { type: 'array' },
        internalNotifications: { type: 'array' },
        referencePolicy: { type: 'object' }
      },
      required: ['employeeCommunication', 'teamAnnouncement']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeKnowledgeTransfer = defineTask('execute-knowledge-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Knowledge Transfer',
  agent: {
    name: 'talent-management-specialist',
    prompt: {
      role: 'Knowledge Transfer Coordinator',
      task: 'Execute knowledge transfer activities',
      context: args,
      instructions: [
        'Oversee documentation creation',
        'Facilitate successor training',
        'Coordinate process walkthroughs',
        'Arrange relationship introductions',
        'Manage project status handoffs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        documentationStatus: { type: 'object' },
        trainingCompleted: { type: 'array' },
        processWalkthroughs: { type: 'array' },
        relationshipIntroductions: { type: 'array' },
        projectHandoffs: { type: 'array' },
        completionStatus: { type: 'boolean' }
      },
      required: ['documentationStatus', 'completionStatus']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const conductExitInterview = defineTask('conduct-exit-interview', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Exit Interview',
  agent: {
    name: 'hr-generalist',
    prompt: {
      role: 'Exit Interview Specialist',
      task: 'Conduct and document exit interview',
      context: args,
      instructions: [
        'Schedule exit interview',
        'Conduct structured interview',
        'Document feedback thoroughly',
        'Contribute to trend analysis',
        'Extract actionable insights'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        interviewDate: { type: 'string' },
        interviewNotes: { type: 'object' },
        feedback: { type: 'object' },
        trendContribution: { type: 'object' },
        actionableInsights: { type: 'array' }
      },
      required: ['interviewNotes', 'feedback']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const processBenefitsFinalPay = defineTask('process-benefits-final-pay', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process Benefits and Final Pay',
  agent: {
    name: 'payroll-benefits-specialist',
    prompt: {
      role: 'Final Pay and Benefits Processor',
      task: 'Process final pay and benefits continuation',
      context: args,
      instructions: [
        'Calculate final pay amounts',
        'Process PTO payout',
        'Prepare COBRA notification',
        'Process retirement accounts',
        'Reconcile equity vesting'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        finalPayCalculation: { type: 'object' },
        ptoPayout: { type: 'object' },
        cobraNotification: { type: 'object' },
        retirementProcessing: { type: 'object' },
        equityReconciliation: { type: 'object' }
      },
      required: ['finalPayCalculation', 'cobraNotification']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const revokeAccess = defineTask('revoke-access', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revoke Access',
  agent: {
    name: 'it-security-specialist',
    prompt: {
      role: 'Access Revocation Specialist',
      task: 'Revoke all employee access',
      context: args,
      instructions: [
        'Terminate system access',
        'Deactivate badge',
        'Remove email and communication access',
        'Disable cloud and SaaS applications',
        'Revoke physical access'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        systemAccess: { type: 'object' },
        badgeStatus: { type: 'object' },
        emailAccess: { type: 'object' },
        cloudApps: { type: 'array' },
        physicalAccess: { type: 'object' }
      },
      required: ['systemAccess', 'emailAccess']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recoverAssets = defineTask('recover-assets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recover Assets',
  agent: {
    name: 'facilities-specialist',
    prompt: {
      role: 'Asset Recovery Specialist',
      task: 'Recover all company assets',
      context: args,
      instructions: [
        'Verify equipment inventory',
        'Collect laptop and mobile devices',
        'Cancel company credit cards',
        'Collect keys and access cards',
        'Verify intellectual property return'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        inventoryVerification: { type: 'object' },
        devicesRecovered: { type: 'array' },
        creditCardsCancelled: { type: 'array' },
        keysCollected: { type: 'array' },
        ipVerification: { type: 'object' }
      },
      required: ['inventoryVerification', 'devicesRecovered']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const completeFinalDocumentation = defineTask('complete-final-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Complete Final Documentation',
  agent: {
    name: 'hr-generalist',
    prompt: {
      role: 'Final Documentation Specialist',
      task: 'Complete all separation documentation',
      context: args,
      instructions: [
        'Finalize separation agreement if applicable',
        'Complete final pay documentation',
        'Process benefits continuation paperwork',
        'Document reference authorization',
        'Complete personnel file'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        separationAgreement: { type: 'object' },
        finalPayDocs: { type: 'object' },
        benefitsPaperwork: { type: 'object' },
        referenceAuth: { type: 'object' },
        personnelFile: { type: 'object' }
      },
      required: ['finalPayDocs', 'personnelFile']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const completeOffboarding = defineTask('complete-offboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Complete Offboarding',
  agent: {
    name: 'hr-generalist',
    prompt: {
      role: 'Offboarding Completion Specialist',
      task: 'Complete offboarding process',
      context: args,
      instructions: [
        'Verify offboarding checklist completion',
        'Obtain manager sign-off',
        'Update HR systems',
        'Extend alumni network invitation',
        'Send feedback survey'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        checklistVerification: { type: 'object' },
        managerSignOff: { type: 'object' },
        systemUpdates: { type: 'array' },
        alumniInvitation: { type: 'object' },
        feedbackSurvey: { type: 'object' },
        daysToComplete: { type: 'number' }
      },
      required: ['checklistVerification', 'systemUpdates', 'daysToComplete']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeAndReport = defineTask('analyze-and-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and Report',
  agent: {
    name: 'hr-analyst',
    prompt: {
      role: 'Exit Analytics Specialist',
      task: 'Analyze exit data and generate reports',
      context: args,
      instructions: [
        'Analyze exit interview data',
        'Contribute to turnover trends',
        'Update manager dashboard',
        'Extract retention insights',
        'Recommend process improvements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        exitAnalysis: { type: 'object' },
        turnoverTrends: { type: 'object' },
        dashboardUpdate: { type: 'object' },
        retentionInsights: { type: 'array' },
        processImprovements: { type: 'array' }
      },
      required: ['exitAnalysis', 'retentionInsights']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
