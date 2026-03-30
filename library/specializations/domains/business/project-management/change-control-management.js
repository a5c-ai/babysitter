/**
 * @process specializations/domains/business/project-management/change-control-management
 * @description Change Control Management - Establish and operate change control process including change
 * request submission, impact assessment, CCB review, and implementation tracking.
 * @inputs { projectName: string, changeRequest: object, projectBaselines: object, stakeholders?: array }
 * @outputs { success: boolean, changeDecision: object, impactAssessment: object, implementationPlan?: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/change-control-management', {
 *   projectName: 'Enterprise System Upgrade',
 *   changeRequest: { id: 'CR-2025-042', title: 'Add reporting module', requestor: 'Finance VP' },
 *   projectBaselines: { scope: {...}, schedule: {...}, budget: {...} },
 *   stakeholders: [{ name: 'Project Sponsor', role: 'approver' }]
 * });
 *
 * @references
 * - PMI Change Management: https://www.pmi.org/learning/library/change-management-project-performance-4297
 * - PMBOK Change Control: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    changeRequest,
    projectBaselines,
    stakeholders = [],
    changeControlBoard = [],
    existingChanges = []
  } = inputs;

  // Phase 1: Change Request Validation
  const requestValidation = await ctx.task(changeRequestValidationTask, {
    projectName,
    changeRequest,
    existingChanges
  });

  // Quality Gate: Change request must be valid
  if (!requestValidation.isValid) {
    return {
      success: false,
      error: requestValidation.validationErrors?.join(', ') || 'Invalid change request',
      phase: 'validation',
      changeDecision: { status: 'rejected', reason: 'Validation failed' }
    };
  }

  // Breakpoint: Review validated change request
  await ctx.breakpoint({
    question: `Change request ${changeRequest.id} validated for ${projectName}. Category: ${requestValidation.category}. Proceed with impact assessment?`,
    title: 'Change Request Validation Review',
    context: {
      runId: ctx.runId,
      projectName,
      changeId: changeRequest.id,
      category: requestValidation.category,
      priority: requestValidation.priority,
      files: [{
        path: `artifacts/phase1-change-validation.json`,
        format: 'json',
        content: requestValidation
      }]
    }
  });

  // Phase 2: Scope Impact Assessment
  const scopeImpact = await ctx.task(scopeImpactAssessmentTask, {
    projectName,
    changeRequest,
    scopeBaseline: projectBaselines.scope
  });

  // Phase 3: Schedule Impact Assessment
  const scheduleImpact = await ctx.task(scheduleImpactAssessmentTask, {
    projectName,
    changeRequest,
    scheduleBaseline: projectBaselines.schedule,
    scopeImpact
  });

  // Phase 4: Cost Impact Assessment
  const costImpact = await ctx.task(costImpactAssessmentTask, {
    projectName,
    changeRequest,
    budgetBaseline: projectBaselines.budget,
    scopeImpact,
    scheduleImpact
  });

  // Phase 5: Resource Impact Assessment
  const resourceImpact = await ctx.task(resourceImpactAssessmentTask, {
    projectName,
    changeRequest,
    scopeImpact,
    scheduleImpact
  });

  // Phase 6: Risk Assessment
  const riskAssessment = await ctx.task(changeRiskAssessmentTask, {
    projectName,
    changeRequest,
    scopeImpact,
    scheduleImpact,
    costImpact,
    resourceImpact
  });

  // Phase 7: Integrated Impact Analysis
  const integratedImpact = await ctx.task(integratedImpactAnalysisTask, {
    projectName,
    changeRequest,
    scopeImpact,
    scheduleImpact,
    costImpact,
    resourceImpact,
    riskAssessment
  });

  // Quality Gate: Impact assessment complete
  if (integratedImpact.overallImpact === 'critical' || integratedImpact.overallImpact === 'high') {
    await ctx.breakpoint({
      question: `Change ${changeRequest.id} has ${integratedImpact.overallImpact} impact. Schedule impact: ${scheduleImpact.daysImpact} days. Cost impact: ${costImpact.costImpact}. Continue to CCB review?`,
      title: 'High Impact Change Warning',
      context: {
        runId: ctx.runId,
        overallImpact: integratedImpact.overallImpact,
        scheduleImpact: scheduleImpact.daysImpact,
        costImpact: costImpact.costImpact,
        recommendation: integratedImpact.recommendation
      }
    });
  }

  // Phase 8: CCB Presentation Preparation
  const ccbPresentation = await ctx.task(ccbPresentationPreparationTask, {
    projectName,
    changeRequest,
    integratedImpact,
    requestValidation
  });

  // Phase 9: CCB Decision Simulation
  const ccbDecision = await ctx.task(ccbDecisionTask, {
    projectName,
    changeRequest,
    ccbPresentation,
    changeControlBoard,
    stakeholders
  });

  // Phase 10: Implementation Planning (if approved)
  let implementationPlan = null;
  if (ccbDecision.decision === 'approved' || ccbDecision.decision === 'approved-with-conditions') {
    implementationPlan = await ctx.task(implementationPlanningTask, {
      projectName,
      changeRequest,
      ccbDecision,
      integratedImpact,
      projectBaselines
    });
  }

  // Phase 11: Change Documentation
  const changeDocumentation = await ctx.task(changeDocumentationTask, {
    projectName,
    changeRequest,
    requestValidation,
    integratedImpact,
    ccbDecision,
    implementationPlan
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Change control complete for ${changeRequest.id}. Decision: ${ccbDecision.decision}. Document and communicate?`,
    title: 'Change Control Completion',
    context: {
      runId: ctx.runId,
      projectName,
      changeId: changeRequest.id,
      decision: ccbDecision.decision,
      conditions: ccbDecision.conditions,
      files: [
        { path: `artifacts/change-${changeRequest.id}-decision.json`, format: 'json', content: ccbDecision },
        { path: `artifacts/change-${changeRequest.id}-documentation.md`, format: 'markdown', content: changeDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    changeId: changeRequest.id,
    changeDecision: {
      decision: ccbDecision.decision,
      conditions: ccbDecision.conditions,
      rationale: ccbDecision.rationale,
      approvedBy: ccbDecision.approvers,
      decisionDate: ccbDecision.decisionDate
    },
    impactAssessment: {
      overall: integratedImpact.overallImpact,
      scope: scopeImpact.impact,
      schedule: scheduleImpact.daysImpact,
      cost: costImpact.costImpact,
      resources: resourceImpact.impact,
      risks: riskAssessment.newRisks
    },
    implementationPlan: implementationPlan ? {
      activities: implementationPlan.activities,
      timeline: implementationPlan.timeline,
      responsibilities: implementationPlan.responsibilities
    } : null,
    documentation: {
      markdown: changeDocumentation.markdown,
      changeLog: changeDocumentation.changeLogEntry
    },
    recommendations: changeDocumentation.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/change-control-management',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const changeRequestValidationTask = defineTask('change-request-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Change Request Validation - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Manager',
      task: 'Validate change request completeness and categorize',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        existingChanges: args.existingChanges
      },
      instructions: [
        '1. Verify change request completeness',
        '2. Check for required fields (title, description, justification)',
        '3. Verify requestor authority',
        '4. Check for duplicate requests',
        '5. Categorize change type (scope, schedule, cost, quality)',
        '6. Assess priority level',
        '7. Assign unique tracking ID if needed',
        '8. Document validation results',
        '9. Identify any clarifications needed',
        '10. Determine processing track (expedited, standard, minor)'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'category', 'priority'],
      properties: {
        isValid: { type: 'boolean' },
        validationErrors: { type: 'array', items: { type: 'string' } },
        category: { type: 'string', enum: ['scope', 'schedule', 'cost', 'quality', 'resource', 'multiple'] },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        processingTrack: { type: 'string', enum: ['expedited', 'standard', 'minor'] },
        isDuplicate: { type: 'boolean' },
        relatedChanges: { type: 'array', items: { type: 'string' } },
        clarificationsNeeded: { type: 'array', items: { type: 'string' } },
        validatedRequest: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'validation', 'intake']
}));

export const scopeImpactAssessmentTask = defineTask('scope-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Scope Impact Assessment - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scope Manager',
      task: 'Assess impact of change on project scope',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        scopeBaseline: args.scopeBaseline
      },
      instructions: [
        '1. Identify affected scope elements',
        '2. Assess impact on deliverables',
        '3. Evaluate impact on requirements',
        '4. Determine WBS changes needed',
        '5. Assess impact on acceptance criteria',
        '6. Identify scope additions/removals',
        '7. Evaluate quality implications',
        '8. Assess technical complexity',
        '9. Identify dependencies affected',
        '10. Document scope change details'
      ],
      outputFormat: 'JSON object with scope impact'
    },
    outputSchema: {
      type: 'object',
      required: ['impact', 'affectedElements'],
      properties: {
        impact: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        affectedElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              type: { type: 'string' },
              changeType: { type: 'string', enum: ['add', 'modify', 'remove'] },
              impact: { type: 'string' }
            }
          }
        },
        deliverablesAffected: { type: 'array', items: { type: 'string' } },
        wbsChanges: { type: 'array', items: { type: 'string' } },
        requirementsImpact: { type: 'array', items: { type: 'string' } },
        qualityImplications: { type: 'array', items: { type: 'string' } },
        technicalComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        dependenciesAffected: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'scope-impact', 'assessment']
}));

export const scheduleImpactAssessmentTask = defineTask('schedule-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Schedule Impact Assessment - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Scheduler',
      task: 'Assess impact of change on project schedule',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        scheduleBaseline: args.scheduleBaseline,
        scopeImpact: args.scopeImpact
      },
      instructions: [
        '1. Identify affected activities',
        '2. Estimate additional duration needed',
        '3. Assess impact on critical path',
        '4. Evaluate impact on milestones',
        '5. Identify schedule compression options',
        '6. Assess parallel execution possibilities',
        '7. Evaluate resource constraints',
        '8. Calculate total schedule impact',
        '9. Identify schedule risks',
        '10. Document schedule change details'
      ],
      outputFormat: 'JSON object with schedule impact'
    },
    outputSchema: {
      type: 'object',
      required: ['daysImpact', 'criticalPathImpact'],
      properties: {
        daysImpact: { type: 'number' },
        criticalPathImpact: { type: 'boolean' },
        affectedActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              originalDuration: { type: 'number' },
              newDuration: { type: 'number' },
              isCritical: { type: 'boolean' }
            }
          }
        },
        milestonesAffected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              originalDate: { type: 'string' },
              newDate: { type: 'string' },
              delay: { type: 'number' }
            }
          }
        },
        compressionOptions: { type: 'array', items: { type: 'string' } },
        parallelOptions: { type: 'array', items: { type: 'string' } },
        scheduleRisks: { type: 'array', items: { type: 'string' } },
        newEndDate: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'schedule-impact', 'assessment']
}));

export const costImpactAssessmentTask = defineTask('cost-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Cost Impact Assessment - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cost Analyst',
      task: 'Assess cost impact of proposed change',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        budgetBaseline: args.budgetBaseline,
        scopeImpact: args.scopeImpact,
        scheduleImpact: args.scheduleImpact
      },
      instructions: [
        '1. Estimate direct labor costs',
        '2. Estimate material/equipment costs',
        '3. Calculate indirect costs',
        '4. Assess cost of schedule extension',
        '5. Identify cost savings opportunities',
        '6. Evaluate contingency impact',
        '7. Calculate total cost impact',
        '8. Assess funding availability',
        '9. Identify cost risks',
        '10. Document cost change details'
      ],
      outputFormat: 'JSON object with cost impact'
    },
    outputSchema: {
      type: 'object',
      required: ['costImpact', 'costBreakdown'],
      properties: {
        costImpact: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            labor: { type: 'number' },
            materials: { type: 'number' },
            equipment: { type: 'number' },
            indirect: { type: 'number' },
            scheduleExtension: { type: 'number' }
          }
        },
        costSavings: { type: 'number' },
        netCostImpact: { type: 'number' },
        contingencyImpact: {
          type: 'object',
          properties: {
            currentContingency: { type: 'number' },
            requiredContingency: { type: 'number' },
            additionalNeeded: { type: 'number' }
          }
        },
        fundingStatus: { type: 'string', enum: ['available', 'partial', 'not-available'] },
        newBudgetTotal: { type: 'number' },
        costRisks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'cost-impact', 'assessment']
}));

export const resourceImpactAssessmentTask = defineTask('resource-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Resource Impact Assessment - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Manager',
      task: 'Assess resource impact of proposed change',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        scopeImpact: args.scopeImpact,
        scheduleImpact: args.scheduleImpact
      },
      instructions: [
        '1. Identify additional resource needs',
        '2. Assess current resource availability',
        '3. Evaluate skill requirements',
        '4. Identify resource conflicts',
        '5. Assess external resource needs',
        '6. Evaluate training requirements',
        '7. Calculate resource effort',
        '8. Identify resource constraints',
        '9. Assess impact on other projects',
        '10. Document resource change details'
      ],
      outputFormat: 'JSON object with resource impact'
    },
    outputSchema: {
      type: 'object',
      required: ['impact', 'resourceNeeds'],
      properties: {
        impact: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        resourceNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              effort: { type: 'number' },
              duration: { type: 'string' },
              availability: { type: 'string', enum: ['available', 'limited', 'not-available'] },
              source: { type: 'string', enum: ['internal', 'external', 'tbd'] }
            }
          }
        },
        skillGaps: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        trainingNeeded: { type: 'array', items: { type: 'string' } },
        totalEffort: { type: 'number' },
        impactOnOtherProjects: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'resource-impact', 'assessment']
}));

export const changeRiskAssessmentTask = defineTask('change-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Change Risk Assessment - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Assess risks associated with the proposed change',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        scopeImpact: args.scopeImpact,
        scheduleImpact: args.scheduleImpact,
        costImpact: args.costImpact,
        resourceImpact: args.resourceImpact
      },
      instructions: [
        '1. Identify new risks from the change',
        '2. Assess impact on existing risks',
        '3. Evaluate implementation risks',
        '4. Assess technical risks',
        '5. Identify integration risks',
        '6. Evaluate change failure risks',
        '7. Assess rollback feasibility',
        '8. Identify mitigation strategies',
        '9. Calculate risk exposure change',
        '10. Document risk assessment'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['newRisks', 'overallRiskImpact'],
      properties: {
        newRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              probability: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        affectedExistingRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              change: { type: 'string', enum: ['increased', 'decreased', 'unchanged'] }
            }
          }
        },
        implementationRisks: { type: 'array', items: { type: 'string' } },
        rollbackFeasibility: { type: 'string', enum: ['easy', 'moderate', 'difficult', 'impossible'] },
        overallRiskImpact: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        riskExposureChange: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'risk-assessment']
}));

export const integratedImpactAnalysisTask = defineTask('integrated-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Integrated Impact Analysis - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Analyst',
      task: 'Synthesize all impact assessments into integrated analysis',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        scopeImpact: args.scopeImpact,
        scheduleImpact: args.scheduleImpact,
        costImpact: args.costImpact,
        resourceImpact: args.resourceImpact,
        riskAssessment: args.riskAssessment
      },
      instructions: [
        '1. Synthesize all impact assessments',
        '2. Identify cross-impact dependencies',
        '3. Calculate overall impact rating',
        '4. Assess change feasibility',
        '5. Evaluate value vs cost/risk',
        '6. Identify alternatives',
        '7. Develop recommendation',
        '8. Document trade-offs',
        '9. Create impact summary',
        '10. Prepare decision criteria'
      ],
      outputFormat: 'JSON object with integrated analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallImpact', 'feasibility', 'recommendation'],
      properties: {
        overallImpact: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'critical'] },
        impactSummary: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            schedule: { type: 'string' },
            cost: { type: 'string' },
            resource: { type: 'string' },
            risk: { type: 'string' }
          }
        },
        feasibility: { type: 'string', enum: ['highly-feasible', 'feasible', 'challenging', 'not-feasible'] },
        valueAssessment: {
          type: 'object',
          properties: {
            businessValue: { type: 'string' },
            strategicAlignment: { type: 'string' },
            urgency: { type: 'string' }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string', enum: ['approve', 'approve-with-conditions', 'defer', 'reject'] },
        recommendationRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'integrated-analysis']
}));

export const ccbPresentationPreparationTask = defineTask('ccb-presentation-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: CCB Presentation Preparation - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Manager',
      task: 'Prepare Change Control Board presentation materials',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        integratedImpact: args.integratedImpact,
        requestValidation: args.requestValidation
      },
      instructions: [
        '1. Create executive summary of change',
        '2. Summarize impact assessment results',
        '3. Present recommendation',
        '4. Document decision options',
        '5. Outline implementation approach',
        '6. Present alternatives considered',
        '7. Document dependencies and constraints',
        '8. Prepare Q&A anticipation',
        '9. Create visual presentation',
        '10. Define voting requirements'
      ],
      outputFormat: 'JSON object with CCB presentation'
    },
    outputSchema: {
      type: 'object',
      required: ['presentation', 'decisionOptions'],
      properties: {
        presentation: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            changeDescription: { type: 'string' },
            impactSummary: { type: 'object' },
            recommendation: { type: 'string' },
            implementationOverview: { type: 'string' }
          }
        },
        decisionOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              description: { type: 'string' },
              implications: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        anticipatedQuestions: { type: 'array', items: { type: 'string' } },
        votingRequirements: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'ccb', 'presentation']
}));

export const ccbDecisionTask = defineTask('ccb-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: CCB Decision - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CCB Chair',
      task: 'Facilitate CCB decision on change request',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        ccbPresentation: args.ccbPresentation,
        changeControlBoard: args.changeControlBoard,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Present change to CCB members',
        '2. Facilitate discussion and questions',
        '3. Document concerns raised',
        '4. Record votes/approvals',
        '5. Determine decision outcome',
        '6. Document any conditions',
        '7. Assign action items',
        '8. Set implementation timeline if approved',
        '9. Document decision rationale',
        '10. Communicate decision'
      ],
      outputFormat: 'JSON object with CCB decision'
    },
    outputSchema: {
      type: 'object',
      required: ['decision', 'rationale'],
      properties: {
        decision: { type: 'string', enum: ['approved', 'approved-with-conditions', 'deferred', 'rejected'] },
        conditions: { type: 'array', items: { type: 'string' } },
        approvers: { type: 'array', items: { type: 'string' } },
        dissenting: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        implementationTimeline: { type: 'string' },
        decisionDate: { type: 'string' },
        nextReviewDate: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'ccb', 'decision']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Implementation Planning - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Implementation Manager',
      task: 'Develop detailed implementation plan for approved change',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        ccbDecision: args.ccbDecision,
        integratedImpact: args.integratedImpact,
        projectBaselines: args.projectBaselines
      },
      instructions: [
        '1. Detail implementation activities',
        '2. Assign responsibilities',
        '3. Set implementation timeline',
        '4. Define verification criteria',
        '5. Plan baseline updates',
        '6. Define communication plan',
        '7. Create rollback plan',
        '8. Set monitoring approach',
        '9. Define success criteria',
        '10. Document implementation risks'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'timeline', 'responsibilities'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              owner: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: { type: 'string' },
        responsibilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        verificationCriteria: { type: 'array', items: { type: 'string' } },
        baselineUpdates: { type: 'array', items: { type: 'string' } },
        rollbackPlan: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        monitoringApproach: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'implementation', 'planning']
}));

export const changeDocumentationTask = defineTask('change-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Change Documentation - ${args.changeRequest.id}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer',
      task: 'Document change control process and decisions',
      context: {
        projectName: args.projectName,
        changeRequest: args.changeRequest,
        requestValidation: args.requestValidation,
        integratedImpact: args.integratedImpact,
        ccbDecision: args.ccbDecision,
        implementationPlan: args.implementationPlan
      },
      instructions: [
        '1. Document complete change record',
        '2. Create change log entry',
        '3. Generate markdown documentation',
        '4. Document lessons learned',
        '5. Update project documentation references',
        '6. Archive supporting materials',
        '7. Create stakeholder communication',
        '8. Document process metrics',
        '9. Provide recommendations',
        '10. Add version control'
      ],
      outputFormat: 'JSON object with change documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'changeLogEntry'],
      properties: {
        markdown: { type: 'string' },
        changeLogEntry: {
          type: 'object',
          properties: {
            changeId: { type: 'string' },
            title: { type: 'string' },
            requestor: { type: 'string' },
            requestDate: { type: 'string' },
            category: { type: 'string' },
            decision: { type: 'string' },
            decisionDate: { type: 'string' },
            implementationStatus: { type: 'string' }
          }
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        processMetrics: {
          type: 'object',
          properties: {
            processingTime: { type: 'string' },
            reviewCycles: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['change-control', 'documentation']
}));
