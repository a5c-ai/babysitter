/**
 * @process specializations/domains/business/human-resources/performance-improvement-plan
 * @description Performance Improvement Plan (PIP) Process - Structured process for addressing underperformance including
 * documentation, goal setting, support provision, progress monitoring, and outcome determination.
 * @inputs { employeeId: string, employeeName: string, manager: string, performanceIssues: array, department: string }
 * @outputs { success: boolean, pipId: string, outcome: string, milestoneCompletion: object, documentationPath: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/performance-improvement-plan', {
 *   employeeId: 'EMP-2024-001',
 *   employeeName: 'John Smith',
 *   manager: 'Jane Doe',
 *   performanceIssues: ['Missed deadlines', 'Quality concerns', 'Communication issues'],
 *   department: 'Engineering'
 * });
 *
 * @references
 * - SHRM PIP Guide: https://www.shrm.org/resourcesandtools/tools-and-samples/how-to-guides/pages/performance-improvement-plan.aspx
 * - HR Bartender: https://www.hrbartender.com/2017/training/how-to-write-a-performance-improvement-plan/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    employeeId,
    employeeName,
    manager,
    performanceIssues,
    department,
    pipDuration = 60, // days
    hrbp = null,
    previousWarnings = [],
    outputDir = 'pip-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const pipId = `PIP-${Date.now()}`;

  ctx.log('info', `Starting Performance Improvement Plan Process for ${employeeName} (${pipId})`);

  // Phase 1: Initial Assessment and Documentation
  const initialAssessment = await ctx.task(initialAssessmentTask, {
    employeeId,
    employeeName,
    manager,
    performanceIssues,
    department,
    previousWarnings,
    outputDir
  });

  artifacts.push(...initialAssessment.artifacts);

  await ctx.breakpoint({
    question: `Initial assessment completed for ${employeeName}. ${initialAssessment.issueCount} performance issues documented. Review assessment before proceeding?`,
    title: 'PIP Initial Assessment Review',
    context: {
      runId: ctx.runId,
      pipId,
      employeeName,
      performanceIssues: initialAssessment.documentedIssues,
      impactAssessment: initialAssessment.impactAssessment,
      previousActions: initialAssessment.previousActions,
      files: initialAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: HRBP Consultation
  const hrbpConsultation = await ctx.task(hrbpConsultationTask, {
    pipId,
    employeeId,
    employeeName,
    department,
    initialAssessment,
    hrbp,
    outputDir
  });

  artifacts.push(...hrbpConsultation.artifacts);

  // Phase 3: PIP Goal Development
  const goalDevelopment = await ctx.task(goalDevelopmentTask, {
    pipId,
    employeeName,
    performanceIssues: initialAssessment.documentedIssues,
    pipDuration,
    outputDir
  });

  artifacts.push(...goalDevelopment.artifacts);

  await ctx.breakpoint({
    question: `PIP goals developed: ${goalDevelopment.goals.length} improvement goals with specific milestones. Review goals before employee meeting?`,
    title: 'PIP Goals Review',
    context: {
      runId: ctx.runId,
      pipId,
      goals: goalDevelopment.goals,
      milestones: goalDevelopment.milestones,
      successCriteria: goalDevelopment.successCriteria,
      files: goalDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Support Plan Development
  const supportPlan = await ctx.task(supportPlanTask, {
    pipId,
    employeeName,
    goals: goalDevelopment.goals,
    performanceIssues: initialAssessment.documentedIssues,
    outputDir
  });

  artifacts.push(...supportPlan.artifacts);

  // Phase 5: PIP Document Creation
  const pipDocument = await ctx.task(pipDocumentTask, {
    pipId,
    employeeId,
    employeeName,
    manager,
    department,
    initialAssessment,
    goals: goalDevelopment.goals,
    milestones: goalDevelopment.milestones,
    supportPlan: supportPlan.plan,
    pipDuration,
    outputDir
  });

  artifacts.push(...pipDocument.artifacts);

  // Phase 6: Employee Meeting and PIP Delivery
  const pipDelivery = await ctx.task(pipDeliveryTask, {
    pipId,
    employeeName,
    manager,
    pipDocument: pipDocument.document,
    hrbp,
    outputDir
  });

  artifacts.push(...pipDelivery.artifacts);

  await ctx.breakpoint({
    question: `PIP delivered to ${employeeName}. Employee acknowledged: ${pipDelivery.acknowledged}. Proceed with monitoring phase?`,
    title: 'PIP Delivery Confirmation',
    context: {
      runId: ctx.runId,
      pipId,
      acknowledged: pipDelivery.acknowledged,
      employeeResponse: pipDelivery.employeeResponse,
      meetingNotes: pipDelivery.meetingNotes,
      files: pipDelivery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Weekly Check-in Process
  const weeklyCheckIns = await ctx.task(weeklyCheckInTask, {
    pipId,
    employeeName,
    manager,
    goals: goalDevelopment.goals,
    milestones: goalDevelopment.milestones,
    pipDuration,
    outputDir
  });

  artifacts.push(...weeklyCheckIns.artifacts);

  // Phase 8: Mid-Point Review
  const midPointReview = await ctx.task(midPointReviewTask, {
    pipId,
    employeeName,
    manager,
    goals: goalDevelopment.goals,
    weeklyCheckIns: weeklyCheckIns.checkIns,
    outputDir
  });

  artifacts.push(...midPointReview.artifacts);

  await ctx.breakpoint({
    question: `Mid-point review for ${employeeName}'s PIP. Progress: ${midPointReview.overallProgress}%. Continue, extend, or escalate?`,
    title: 'PIP Mid-Point Review',
    context: {
      runId: ctx.runId,
      pipId,
      overallProgress: midPointReview.overallProgress,
      goalProgress: midPointReview.goalProgress,
      concerns: midPointReview.concerns,
      recommendation: midPointReview.recommendation,
      files: midPointReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Continued Monitoring
  const continuedMonitoring = await ctx.task(continuedMonitoringTask, {
    pipId,
    employeeName,
    manager,
    goals: goalDevelopment.goals,
    midPointReview,
    outputDir
  });

  artifacts.push(...continuedMonitoring.artifacts);

  // Phase 10: Final Evaluation
  const finalEvaluation = await ctx.task(finalEvaluationTask, {
    pipId,
    employeeName,
    manager,
    goals: goalDevelopment.goals,
    allCheckIns: [...weeklyCheckIns.checkIns, ...continuedMonitoring.checkIns],
    midPointReview,
    outputDir
  });

  artifacts.push(...finalEvaluation.artifacts);

  await ctx.breakpoint({
    question: `Final PIP evaluation for ${employeeName}. Overall completion: ${finalEvaluation.overallCompletion}%. Recommended outcome: ${finalEvaluation.recommendedOutcome}. Review and confirm outcome?`,
    title: 'PIP Final Evaluation',
    context: {
      runId: ctx.runId,
      pipId,
      overallCompletion: finalEvaluation.overallCompletion,
      goalCompletions: finalEvaluation.goalCompletions,
      recommendedOutcome: finalEvaluation.recommendedOutcome,
      justification: finalEvaluation.justification,
      files: finalEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 11: Outcome Determination
  const outcomeDetermination = await ctx.task(outcomeDeterminationTask, {
    pipId,
    employeeName,
    manager,
    hrbp,
    finalEvaluation,
    outputDir
  });

  artifacts.push(...outcomeDetermination.artifacts);

  // Phase 12: Outcome Communication and Closure
  const pipClosure = await ctx.task(pipClosureTask, {
    pipId,
    employeeName,
    manager,
    outcome: outcomeDetermination.outcome,
    finalEvaluation,
    outputDir
  });

  artifacts.push(...pipClosure.artifacts);

  return {
    success: true,
    pipId,
    employeeId,
    employeeName,
    manager,
    department,
    outcome: outcomeDetermination.outcome,
    outcomeDescription: outcomeDetermination.outcomeDescription,
    milestoneCompletion: {
      overall: finalEvaluation.overallCompletion,
      byGoal: finalEvaluation.goalCompletions
    },
    pipDuration,
    actualDuration: pipClosure.actualDuration,
    supportProvided: supportPlan.supportItems,
    documentationPath: pipDocument.documentPath,
    nextSteps: pipClosure.nextSteps,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/performance-improvement-plan',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const initialAssessmentTask = defineTask('initial-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Initial Assessment - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Performance Specialist',
      task: 'Document and assess performance issues',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        manager: args.manager,
        performanceIssues: args.performanceIssues,
        department: args.department,
        previousWarnings: args.previousWarnings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document specific performance issues',
        '2. Gather evidence and examples',
        '3. Review performance history',
        '4. Assess impact on team/business',
        '5. Document previous feedback given',
        '6. Review previous warnings or coaching',
        '7. Identify root causes',
        '8. Assess severity level',
        '9. Document timeline of issues',
        '10. Prepare assessment summary'
      ],
      outputFormat: 'JSON object with initial assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['documentedIssues', 'issueCount', 'impactAssessment', 'artifacts'],
      properties: {
        documentedIssues: { type: 'array', items: { type: 'object' } },
        issueCount: { type: 'number' },
        evidence: { type: 'array', items: { type: 'object' } },
        impactAssessment: { type: 'object' },
        previousActions: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'string' } },
        severityLevel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'assessment']
}));

export const hrbpConsultationTask = defineTask('hrbp-consultation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: HRBP Consultation - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Business Partner',
      task: 'Consult on PIP approach and legal considerations',
      context: {
        pipId: args.pipId,
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        initialAssessment: args.initialAssessment,
        hrbp: args.hrbp,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review initial assessment',
        '2. Verify PIP appropriateness',
        '3. Check for legal considerations',
        '4. Review employee relations history',
        '5. Assess accommodation needs',
        '6. Validate documentation completeness',
        '7. Recommend PIP structure',
        '8. Advise on potential outcomes',
        '9. Assign HRBP support',
        '10. Document consultation'
      ],
      outputFormat: 'JSON object with HRBP consultation'
    },
    outputSchema: {
      type: 'object',
      required: ['pipApproved', 'recommendations', 'artifacts'],
      properties: {
        pipApproved: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        legalConsiderations: { type: 'array', items: { type: 'string' } },
        accommodationNeeds: { type: 'array', items: { type: 'string' } },
        assignedHrbp: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'consultation']
}));

export const goalDevelopmentTask = defineTask('goal-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Goal Development - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Coach',
      task: 'Develop specific, measurable PIP goals',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        performanceIssues: args.performanceIssues,
        pipDuration: args.pipDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SMART goals for each issue',
        '2. Define measurable success criteria',
        '3. Set interim milestones',
        '4. Create progress checkpoints',
        '5. Define evidence requirements',
        '6. Set realistic timelines',
        '7. Balance challenge and achievability',
        '8. Include behavioral changes',
        '9. Add skill development goals',
        '10. Document measurement methods'
      ],
      outputFormat: 'JSON object with PIP goals'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'milestones', 'successCriteria', 'artifacts'],
      properties: {
        goals: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'object' } },
        measurementMethods: { type: 'object' },
        checkpoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'goals']
}));

export const supportPlanTask = defineTask('support-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Support Plan - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employee Development Specialist',
      task: 'Develop support plan for PIP success',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        goals: args.goals,
        performanceIssues: args.performanceIssues,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify support needs',
        '2. Plan manager support activities',
        '3. Identify training opportunities',
        '4. Arrange coaching sessions',
        '5. Assign mentor if appropriate',
        '6. Plan skill development',
        '7. Identify tools/resources needed',
        '8. Schedule support check-ins',
        '9. Plan feedback sessions',
        '10. Document support commitments'
      ],
      outputFormat: 'JSON object with support plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'supportItems', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        supportItems: { type: 'array', items: { type: 'object' } },
        training: { type: 'array', items: { type: 'object' } },
        coaching: { type: 'array', items: { type: 'object' } },
        resources: { type: 'array', items: { type: 'string' } },
        checkInSchedule: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'support']
}));

export const pipDocumentTask = defineTask('pip-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: PIP Document - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Documentation Specialist',
      task: 'Create formal PIP document',
      context: {
        pipId: args.pipId,
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        manager: args.manager,
        department: args.department,
        initialAssessment: args.initialAssessment,
        goals: args.goals,
        milestones: args.milestones,
        supportPlan: args.supportPlan,
        pipDuration: args.pipDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create PIP document structure',
        '2. Write performance deficiency summary',
        '3. Include documented examples',
        '4. State improvement expectations',
        '5. List specific goals and metrics',
        '6. Include milestone timeline',
        '7. Document support to be provided',
        '8. State consequences of non-improvement',
        '9. Include acknowledgment section',
        '10. Add signature blocks'
      ],
      outputFormat: 'JSON object with PIP document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'documentPath', 'artifacts'],
      properties: {
        document: { type: 'object' },
        documentPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        acknowledgmentForm: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'documentation']
}));

export const pipDeliveryTask = defineTask('pip-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: PIP Delivery - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Meeting Facilitator',
      task: 'Deliver PIP to employee in formal meeting',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        pipDocument: args.pipDocument,
        hrbp: args.hrbp,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare meeting agenda',
        '2. Schedule private meeting',
        '3. Brief manager on delivery approach',
        '4. Conduct PIP meeting',
        '5. Present documented concerns',
        '6. Explain improvement expectations',
        '7. Review support plan',
        '8. Allow employee response',
        '9. Obtain acknowledgment signature',
        '10. Document meeting notes'
      ],
      outputFormat: 'JSON object with PIP delivery results'
    },
    outputSchema: {
      type: 'object',
      required: ['acknowledged', 'meetingNotes', 'artifacts'],
      properties: {
        acknowledged: { type: 'boolean' },
        employeeResponse: { type: 'string' },
        meetingNotes: { type: 'object' },
        questions: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        signedDocument: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'delivery']
}));

export const weeklyCheckInTask = defineTask('weekly-check-in', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Weekly Check-ins - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PIP Monitoring Coordinator',
      task: 'Manage weekly PIP check-in process',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        goals: args.goals,
        milestones: args.milestones,
        pipDuration: args.pipDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Schedule weekly check-in meetings',
        '2. Prepare check-in templates',
        '3. Track goal progress weekly',
        '4. Document evidence of improvement',
        '5. Note areas of concern',
        '6. Provide feedback and coaching',
        '7. Adjust support as needed',
        '8. Document meeting outcomes',
        '9. Track milestone achievement',
        '10. Maintain progress log'
      ],
      outputFormat: 'JSON object with weekly check-in results'
    },
    outputSchema: {
      type: 'object',
      required: ['checkIns', 'progressLog', 'artifacts'],
      properties: {
        checkIns: { type: 'array', items: { type: 'object' } },
        progressLog: { type: 'array', items: { type: 'object' } },
        milestonesAchieved: { type: 'array', items: { type: 'object' } },
        concernsRaised: { type: 'array', items: { type: 'object' } },
        supportAdjustments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'monitoring']
}));

export const midPointReviewTask = defineTask('mid-point-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Mid-Point Review - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PIP Review Specialist',
      task: 'Conduct mid-point PIP review',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        goals: args.goals,
        weeklyCheckIns: args.weeklyCheckIns,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compile progress to date',
        '2. Assess goal achievement',
        '3. Review evidence collected',
        '4. Evaluate support effectiveness',
        '5. Identify continued concerns',
        '6. Determine trajectory',
        '7. Consider extending if needed',
        '8. Make mid-point recommendation',
        '9. Document review findings',
        '10. Communicate with employee'
      ],
      outputFormat: 'JSON object with mid-point review'
    },
    outputSchema: {
      type: 'object',
      required: ['overallProgress', 'goalProgress', 'recommendation', 'artifacts'],
      properties: {
        overallProgress: { type: 'number' },
        goalProgress: { type: 'array', items: { type: 'object' } },
        concerns: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        extensionNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'mid-point']
}));

export const continuedMonitoringTask = defineTask('continued-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Continued Monitoring - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PIP Monitoring Coordinator',
      task: 'Continue PIP monitoring through completion',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        goals: args.goals,
        midPointReview: args.midPointReview,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Continue weekly check-ins',
        '2. Track remaining milestones',
        '3. Document final period progress',
        '4. Gather final evidence',
        '5. Address mid-point concerns',
        '6. Provide final coaching',
        '7. Prepare for final evaluation',
        '8. Document all interactions',
        '9. Track goal completion',
        '10. Compile final progress report'
      ],
      outputFormat: 'JSON object with continued monitoring results'
    },
    outputSchema: {
      type: 'object',
      required: ['checkIns', 'finalProgress', 'artifacts'],
      properties: {
        checkIns: { type: 'array', items: { type: 'object' } },
        finalProgress: { type: 'object' },
        milestonesCompleted: { type: 'array', items: { type: 'object' } },
        remainingConcerns: { type: 'array', items: { type: 'string' } },
        finalEvidence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'monitoring']
}));

export const finalEvaluationTask = defineTask('final-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Final Evaluation - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Evaluation Specialist',
      task: 'Conduct final PIP evaluation',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        goals: args.goals,
        allCheckIns: args.allCheckIns,
        midPointReview: args.midPointReview,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compile all evidence',
        '2. Evaluate each goal completion',
        '3. Calculate overall completion percentage',
        '4. Review behavioral changes',
        '5. Assess sustained improvement',
        '6. Consider extenuating circumstances',
        '7. Determine recommended outcome',
        '8. Document evaluation rationale',
        '9. Prepare evaluation report',
        '10. Review with HRBP'
      ],
      outputFormat: 'JSON object with final evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCompletion', 'goalCompletions', 'recommendedOutcome', 'justification', 'artifacts'],
      properties: {
        overallCompletion: { type: 'number' },
        goalCompletions: { type: 'array', items: { type: 'object' } },
        behavioralChanges: { type: 'array', items: { type: 'object' } },
        sustainedImprovement: { type: 'boolean' },
        recommendedOutcome: { type: 'string', enum: ['successful', 'extended', 'unsuccessful'] },
        justification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'evaluation']
}));

export const outcomeDeterminationTask = defineTask('outcome-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Outcome Determination - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Decision Maker',
      task: 'Determine and document PIP outcome',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        hrbp: args.hrbp,
        finalEvaluation: args.finalEvaluation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review final evaluation',
        '2. Consider manager recommendation',
        '3. Consult with HRBP',
        '4. Review legal considerations',
        '5. Determine final outcome',
        '6. Document outcome decision',
        '7. Prepare outcome communication',
        '8. Plan next steps based on outcome',
        '9. Prepare required documentation',
        '10. Obtain approvals'
      ],
      outputFormat: 'JSON object with outcome determination'
    },
    outputSchema: {
      type: 'object',
      required: ['outcome', 'outcomeDescription', 'artifacts'],
      properties: {
        outcome: { type: 'string', enum: ['successful', 'extended', 'terminated', 'other-action'] },
        outcomeDescription: { type: 'string' },
        decisionRationale: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        requiredDocumentation: { type: 'array', items: { type: 'string' } },
        approvals: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'outcome']
}));

export const pipClosureTask = defineTask('pip-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: PIP Closure - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Case Manager',
      task: 'Close PIP and communicate outcome',
      context: {
        pipId: args.pipId,
        employeeName: args.employeeName,
        manager: args.manager,
        outcome: args.outcome,
        finalEvaluation: args.finalEvaluation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare outcome communication',
        '2. Schedule outcome meeting',
        '3. Deliver outcome to employee',
        '4. Document employee response',
        '5. Execute next steps',
        '6. Update employee records',
        '7. Archive PIP documentation',
        '8. Plan follow-up (if successful)',
        '9. Process separation (if unsuccessful)',
        '10. Close PIP case'
      ],
      outputFormat: 'JSON object with PIP closure'
    },
    outputSchema: {
      type: 'object',
      required: ['closed', 'actualDuration', 'nextSteps', 'artifacts'],
      properties: {
        closed: { type: 'boolean' },
        actualDuration: { type: 'number' },
        outcomeCommunicated: { type: 'boolean' },
        employeeAcknowledgment: { type: 'boolean' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        followUpPlan: { type: 'object' },
        archivePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'pip', 'closure']
}));
