/**
 * @process workplace-investigation
 * @description Comprehensive process for conducting workplace investigations into allegations
 * of misconduct, policy violations, harassment, discrimination, and other workplace issues
 * while ensuring legal compliance and fairness.
 * @inputs {
 *   organizationContext: { industry, size, culture, legalJurisdiction },
 *   allegationDetails: { type, severity, parties, urgency },
 *   investigationScope: { allegations, timeframe, witnesses },
 *   stakeholders: { hr, legal, management, complainant, respondent },
 *   constraints: { timeline, confidentiality, resources }
 * }
 * @outputs {
 *   investigation: { plan, evidence, interviews, analysis },
 *   findings: { factualConclusions, credibilityAssessments, policyDeterminations },
 *   report: { executiveSummary, detailedFindings, recommendations },
 *   followUp: { actions, monitoring, prevention }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'healthcare', size: 'large' },
 *   allegationDetails: { type: 'harassment', severity: 'high' },
 *   investigationScope: { allegations: ['hostile-environment'], witnesses: 8 }
 * });
 * @references
 * - EEOC Enforcement Guidance on Investigations
 * - AWI Guiding Principles for Investigations
 * - SHRM Workplace Investigation Best Practices
 * - Title VII Investigation Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, allegationDetails, investigationScope, stakeholders, constraints } = inputs;

  // Phase 1: Allegation Receipt and Assessment
  const initialAssessment = await ctx.task('assess-allegations', {
    allegationDetails,
    organizationContext,
    assessmentElements: [
      'allegation documentation and categorization',
      'severity and risk assessment',
      'interim measures evaluation',
      'legal notification requirements',
      'conflict of interest screening'
    ]
  });

  // Phase 2: Investigator Assignment
  const investigatorAssignment = await ctx.task('assign-investigator', {
    initialAssessment,
    allegationDetails,
    assignmentElements: [
      'investigator qualifications assessment',
      'internal vs external investigator decision',
      'conflict of interest clearance',
      'investigator briefing',
      'engagement terms (if external)'
    ]
  });

  // Phase 3: Investigation Authorization
  await ctx.breakpoint('investigation-authorization', {
    title: 'Investigation Authorization',
    description: 'Authorize investigation scope and approach',
    artifacts: {
      initialAssessment,
      investigatorAssignment
    },
    questions: [
      'Is the investigation scope appropriately defined?',
      'Is the investigator assignment appropriate?',
      'Are interim measures adequate?'
    ]
  });

  // Phase 4: Investigation Planning
  const investigationPlan = await ctx.task('develop-investigation-plan', {
    investigatorAssignment,
    investigationScope,
    planningElements: [
      'detailed investigation scope',
      'witness list and interview order',
      'document request list',
      'timeline and milestones',
      'communication protocols'
    ]
  });

  // Phase 5: Document Collection
  const documentCollection = await ctx.task('collect-documents', {
    investigationPlan,
    collectionElements: [
      'document preservation notices',
      'HR file collection',
      'electronic communications',
      'policies and procedures',
      'physical evidence'
    ]
  });

  // Phase 6: Complainant Interview
  const complainantInterview = await ctx.task('interview-complainant', {
    investigationPlan,
    allegationDetails,
    interviewElements: [
      'pre-interview preparation',
      'detailed allegation exploration',
      'chronology development',
      'evidence and witness identification',
      'impact documentation'
    ]
  });

  // Phase 7: Witness Interviews
  const witnessInterviews = await ctx.task('interview-witnesses', {
    investigationPlan,
    complainantInterview,
    interviewElements: [
      'witness scheduling and notices',
      'structured interview protocols',
      'corroboration exploration',
      'document verification',
      'additional lead identification'
    ]
  });

  // Phase 8: Respondent Interview
  const respondentInterview = await ctx.task('interview-respondent', {
    complainantInterview,
    witnessInterviews,
    documentCollection,
    interviewElements: [
      'Weingarten/representation rights',
      'allegation presentation',
      'response documentation',
      'evidence review opportunity',
      'witness and document identification'
    ]
  });

  // Phase 9: Follow-up Investigation
  const followUpInvestigation = await ctx.task('conduct-follow-up', {
    complainantInterview,
    witnessInterviews,
    respondentInterview,
    followUpElements: [
      'additional witness interviews',
      'document verification',
      'timeline reconciliation',
      'evidence gap closure',
      'rebuttal interviews if needed'
    ]
  });

  // Phase 10: Evidence Analysis
  const evidenceAnalysis = await ctx.task('analyze-evidence', {
    documentCollection,
    complainantInterview,
    witnessInterviews,
    respondentInterview,
    followUpInvestigation,
    analysisElements: [
      'evidence cataloging and organization',
      'credibility assessment framework',
      'corroboration analysis',
      'inconsistency evaluation',
      'pattern identification'
    ]
  });

  // Phase 11: Findings Development
  const findingsDevelopment = await ctx.task('develop-findings', {
    evidenceAnalysis,
    allegationDetails,
    findingsElements: [
      'factual determination methodology',
      'standard of proof application',
      'credibility conclusions',
      'policy analysis',
      'legal element assessment'
    ]
  });

  // Phase 12: Findings Review
  await ctx.breakpoint('findings-review', {
    title: 'Investigation Findings Review',
    description: 'Review investigation findings before report finalization',
    artifacts: {
      evidenceAnalysis,
      findingsDevelopment
    },
    questions: [
      'Are findings supported by the evidence?',
      'Is the credibility analysis sound?',
      'Are there any gaps requiring additional investigation?'
    ]
  });

  // Phase 13: Report Writing
  const reportWriting = await ctx.task('write-investigation-report', {
    findingsDevelopment,
    evidenceAnalysis,
    reportElements: [
      'executive summary',
      'methodology description',
      'factual findings',
      'credibility analysis',
      'conclusions and recommendations'
    ]
  });

  // Phase 14: Report Delivery and Action Planning
  const reportDelivery = await ctx.task('deliver-report-plan-actions', {
    reportWriting,
    findingsDevelopment,
    deliveryElements: [
      'stakeholder report presentation',
      'corrective action recommendations',
      'discipline considerations',
      'policy revision needs',
      'training requirements'
    ]
  });

  // Phase 15: Case Closure
  const caseClosure = await ctx.task('close-investigation-case', {
    reportDelivery,
    closureElements: [
      'party notifications',
      'file documentation',
      'retention requirements',
      'monitoring plan',
      'lessons learned'
    ]
  });

  return {
    investigation: {
      plan: investigationPlan,
      documents: documentCollection,
      interviews: {
        complainant: complainantInterview,
        witnesses: witnessInterviews,
        respondent: respondentInterview,
        followUp: followUpInvestigation
      }
    },
    findings: {
      evidenceAnalysis,
      conclusions: findingsDevelopment
    },
    report: reportWriting,
    followUp: {
      delivery: reportDelivery,
      closure: caseClosure
    },
    metrics: {
      allegationType: allegationDetails.type,
      daysToComplete: caseClosure.totalDays,
      witnessCount: witnessInterviews.count,
      outcome: findingsDevelopment.outcome
    }
  };
}

export const assessAllegations = defineTask('assess-allegations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Allegations',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Allegation Assessment Specialist',
      task: 'Assess and document allegations',
      context: args,
      instructions: [
        'Document and categorize allegations',
        'Assess severity and risk level',
        'Evaluate interim measure needs',
        'Identify legal notification requirements',
        'Screen for conflicts of interest'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        documentation: { type: 'object' },
        riskAssessment: { type: 'object' },
        interimMeasures: { type: 'array' },
        legalNotifications: { type: 'array' },
        conflictScreening: { type: 'object' }
      },
      required: ['documentation', 'riskAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assignInvestigator = defineTask('assign-investigator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign Investigator',
  agent: {
    name: 'hr-director',
    prompt: {
      role: 'Investigator Assignment Manager',
      task: 'Assign appropriate investigator for the case',
      context: args,
      instructions: [
        'Assess investigator qualification requirements',
        'Decide internal vs external investigator',
        'Clear conflicts of interest',
        'Brief selected investigator',
        'Establish engagement terms if external'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        qualificationAssessment: { type: 'object' },
        investigatorType: { type: 'string' },
        conflictClearance: { type: 'object' },
        briefingNotes: { type: 'object' },
        engagementTerms: { type: 'object' }
      },
      required: ['investigatorType', 'conflictClearance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developInvestigationPlan = defineTask('develop-investigation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Investigation Plan',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigation Planning Expert',
      task: 'Develop comprehensive investigation plan',
      context: args,
      instructions: [
        'Define detailed investigation scope',
        'Create witness list and interview order',
        'Compile document request list',
        'Establish timeline and milestones',
        'Define communication protocols'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'object' },
        witnessList: { type: 'array' },
        documentRequests: { type: 'array' },
        timeline: { type: 'array' },
        communicationProtocols: { type: 'object' }
      },
      required: ['scope', 'witnessList', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const collectDocuments = defineTask('collect-documents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect Documents',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Evidence Collection Specialist',
      task: 'Collect and preserve investigation documents',
      context: args,
      instructions: [
        'Issue document preservation notices',
        'Collect HR files',
        'Gather electronic communications',
        'Compile policies and procedures',
        'Secure physical evidence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        preservationNotices: { type: 'array' },
        hrFiles: { type: 'array' },
        electronicComms: { type: 'array' },
        policies: { type: 'array' },
        physicalEvidence: { type: 'array' }
      },
      required: ['preservationNotices', 'hrFiles']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const interviewComplainant = defineTask('interview-complainant', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interview Complainant',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigative Interviewer',
      task: 'Conduct comprehensive complainant interview',
      context: args,
      instructions: [
        'Prepare interview questions and approach',
        'Explore allegations in detail',
        'Develop chronology of events',
        'Identify evidence and witnesses',
        'Document impact on complainant'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        preparation: { type: 'object' },
        allegationDetails: { type: 'object' },
        chronology: { type: 'array' },
        evidenceIdentified: { type: 'array' },
        impactStatement: { type: 'object' }
      },
      required: ['allegationDetails', 'chronology']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const interviewWitnesses = defineTask('interview-witnesses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interview Witnesses',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Witness Interview Specialist',
      task: 'Conduct witness interviews',
      context: args,
      instructions: [
        'Schedule witnesses appropriately',
        'Use structured interview protocols',
        'Explore corroboration opportunities',
        'Verify documents with witnesses',
        'Identify additional leads'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        schedules: { type: 'array' },
        interviewSummaries: { type: 'array' },
        corroboration: { type: 'object' },
        documentVerification: { type: 'object' },
        additionalLeads: { type: 'array' },
        count: { type: 'number' }
      },
      required: ['interviewSummaries', 'count']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const interviewRespondent = defineTask('interview-respondent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interview Respondent',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Respondent Interview Specialist',
      task: 'Conduct respondent interview',
      context: args,
      instructions: [
        'Address Weingarten/representation rights',
        'Present allegations clearly',
        'Document response thoroughly',
        'Provide evidence review opportunity',
        'Identify respondent witnesses and documents'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        representationRights: { type: 'object' },
        allegationPresentation: { type: 'object' },
        response: { type: 'object' },
        evidenceReview: { type: 'object' },
        respondentEvidence: { type: 'array' }
      },
      required: ['response', 'representationRights']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const conductFollowUp = defineTask('conduct-follow-up', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Follow-up Investigation',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Follow-up Investigation Specialist',
      task: 'Conduct follow-up investigation activities',
      context: args,
      instructions: [
        'Conduct additional witness interviews',
        'Verify documents',
        'Reconcile timeline discrepancies',
        'Close evidence gaps',
        'Conduct rebuttal interviews if needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        additionalInterviews: { type: 'array' },
        documentVerification: { type: 'object' },
        timelineReconciliation: { type: 'object' },
        gapsClosed: { type: 'array' },
        rebuttalInterviews: { type: 'array' }
      },
      required: ['additionalInterviews', 'gapsClosed']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeEvidence = defineTask('analyze-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Evidence',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Evidence Analysis Expert',
      task: 'Analyze all investigation evidence',
      context: args,
      instructions: [
        'Catalog and organize all evidence',
        'Apply credibility assessment framework',
        'Analyze corroboration patterns',
        'Evaluate inconsistencies',
        'Identify behavioral patterns'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        evidenceCatalog: { type: 'object' },
        credibilityFramework: { type: 'object' },
        corroborationAnalysis: { type: 'object' },
        inconsistencies: { type: 'array' },
        patterns: { type: 'array' }
      },
      required: ['evidenceCatalog', 'credibilityFramework']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developFindings = defineTask('develop-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Findings',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Findings Development Expert',
      task: 'Develop investigation findings',
      context: args,
      instructions: [
        'Apply factual determination methodology',
        'Apply appropriate standard of proof',
        'Document credibility conclusions',
        'Conduct policy analysis',
        'Assess legal elements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        factualDeterminations: { type: 'array' },
        standardOfProof: { type: 'object' },
        credibilityConclusions: { type: 'object' },
        policyAnalysis: { type: 'object' },
        legalElements: { type: 'object' },
        outcome: { type: 'string' }
      },
      required: ['factualDeterminations', 'credibilityConclusions', 'outcome']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const writeInvestigationReport = defineTask('write-investigation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Investigation Report',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigation Report Writer',
      task: 'Write comprehensive investigation report',
      context: args,
      instructions: [
        'Write executive summary',
        'Describe investigation methodology',
        'Document factual findings',
        'Present credibility analysis',
        'State conclusions and recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'object' },
        methodology: { type: 'object' },
        factualFindings: { type: 'array' },
        credibilityAnalysis: { type: 'object' },
        conclusions: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['executiveSummary', 'factualFindings', 'conclusions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const deliverReportPlanActions = defineTask('deliver-report-plan-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deliver Report and Plan Actions',
  agent: {
    name: 'employee-relations-manager',
    prompt: {
      role: 'Report Delivery and Action Planning Specialist',
      task: 'Deliver report and plan follow-up actions',
      context: args,
      instructions: [
        'Present report to stakeholders',
        'Develop corrective action recommendations',
        'Consider disciplinary options',
        'Identify policy revision needs',
        'Define training requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        presentation: { type: 'object' },
        correctiveActions: { type: 'array' },
        disciplineConsiderations: { type: 'object' },
        policyRevisions: { type: 'array' },
        trainingRequirements: { type: 'array' }
      },
      required: ['presentation', 'correctiveActions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const closeInvestigationCase = defineTask('close-investigation-case', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Close Investigation Case',
  agent: {
    name: 'employee-relations-specialist',
    prompt: {
      role: 'Investigation Closure Specialist',
      task: 'Close investigation and complete documentation',
      context: args,
      instructions: [
        'Notify all parties appropriately',
        'Complete file documentation',
        'Ensure retention compliance',
        'Establish monitoring plan',
        'Document lessons learned'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        partyNotifications: { type: 'array' },
        fileDocumentation: { type: 'object' },
        retentionCompliance: { type: 'object' },
        monitoringPlan: { type: 'object' },
        lessonsLearned: { type: 'array' },
        totalDays: { type: 'number' }
      },
      required: ['partyNotifications', 'fileDocumentation', 'totalDays']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
