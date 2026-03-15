/**
 * @process grievance-handling
 * @description Systematic process for receiving, investigating, and resolving employee grievances
 * in a fair, timely, and legally compliant manner while maintaining positive employee relations.
 * @inputs {
 *   organizationContext: { industry, size, unionStatus, culture },
 *   grievanceDetails: { complainant, type, allegations, urgency },
 *   policyFramework: { grievancePolicy, cba, procedures },
 *   stakeholders: { hr, legal, management, union },
 *   constraints: { timeline, confidentiality, legalRisk }
 * }
 * @outputs {
 *   caseManagement: { intake, tracking, documentation },
 *   investigation: { findings, evidence, interviews },
 *   resolution: { decision, remedies, communication },
 *   prevention: { rootCause, recommendations, training }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'manufacturing', unionStatus: 'unionized' },
 *   grievanceDetails: { type: 'workplace-treatment', urgency: 'standard' },
 *   policyFramework: { grievancePolicy: 'formal-multi-step' }
 * });
 * @references
 * - NLRA Grievance Handling Requirements
 * - SHRM Employee Relations Best Practices
 * - ADR and Mediation Guidelines
 * - EEOC Charge Handling Procedures
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, grievanceDetails, policyFramework, stakeholders, constraints } = inputs;

  // Phase 1: Grievance Intake and Assessment
  const intakeAssessment = await ctx.task('intake-and-assess-grievance', {
    grievanceDetails,
    policyFramework,
    intakeElements: [
      'grievance receipt and acknowledgment',
      'complainant interview and statement',
      'initial issue classification',
      'urgency and risk assessment',
      'jurisdictional determination'
    ]
  });

  // Phase 2: Case Classification and Routing
  const caseClassification = await ctx.task('classify-and-route-case', {
    intakeAssessment,
    organizationContext,
    classificationElements: [
      'grievance type categorization',
      'policy or CBA provision identification',
      'appropriate resolution track',
      'investigator assignment',
      'timeline establishment'
    ]
  });

  // Phase 3: Initial Review Checkpoint
  await ctx.breakpoint('case-assignment-review', {
    title: 'Grievance Case Assignment Review',
    description: 'Review case classification and investigation assignment',
    artifacts: {
      intakeAssessment,
      caseClassification
    },
    questions: [
      'Is the case properly classified?',
      'Is the assigned investigator appropriate?',
      'Are there any immediate risk mitigation needs?'
    ]
  });

  // Phase 4: Investigation Planning
  const investigationPlan = await ctx.task('plan-investigation', {
    caseClassification,
    grievanceDetails,
    planningElements: [
      'investigation scope and objectives',
      'witness identification',
      'document and evidence list',
      'interview schedule',
      'confidentiality protocols'
    ]
  });

  // Phase 5: Evidence Collection
  const evidenceCollection = await ctx.task('collect-evidence', {
    investigationPlan,
    collectionElements: [
      'document gathering and preservation',
      'electronic evidence collection',
      'policy and procedure review',
      'historical precedent research',
      'evidence organization and cataloging'
    ]
  });

  // Phase 6: Witness Interviews
  const witnessInterviews = await ctx.task('conduct-witness-interviews', {
    investigationPlan,
    evidenceCollection,
    interviewElements: [
      'complainant detailed interview',
      'respondent interview',
      'third-party witness interviews',
      'management interviews',
      'interview documentation'
    ]
  });

  // Phase 7: Findings Development
  const findings = await ctx.task('develop-investigation-findings', {
    evidenceCollection,
    witnessInterviews,
    findingsElements: [
      'evidence analysis and weighing',
      'credibility assessments',
      'policy violation determination',
      'factual conclusions',
      'gaps and limitations documentation'
    ]
  });

  // Phase 8: Findings Review
  await ctx.breakpoint('findings-review', {
    title: 'Investigation Findings Review',
    description: 'Review investigation findings before resolution determination',
    artifacts: {
      evidenceCollection,
      witnessInterviews,
      findings
    },
    questions: [
      'Are the findings well-supported by evidence?',
      'Are there any additional investigation needs?',
      'Is legal consultation required before resolution?'
    ]
  });

  // Phase 9: Resolution Determination
  const resolutionDetermination = await ctx.task('determine-resolution', {
    findings,
    policyFramework,
    caseClassification,
    resolutionElements: [
      'policy application analysis',
      'precedent consideration',
      'remedy options evaluation',
      'proportionality assessment',
      'appeal rights consideration'
    ]
  });

  // Phase 10: Resolution Communication
  const resolutionCommunication = await ctx.task('communicate-resolution', {
    resolutionDetermination,
    grievanceDetails,
    communicationElements: [
      'complainant notification',
      'respondent notification',
      'management communication',
      'union notification (if applicable)',
      'documentation of communication'
    ]
  });

  // Phase 11: Resolution Implementation
  const resolutionImplementation = await ctx.task('implement-resolution', {
    resolutionDetermination,
    resolutionCommunication,
    implementationElements: [
      'remedy execution',
      'corrective action implementation',
      'policy or process changes',
      'training or coaching delivery',
      'compliance monitoring'
    ]
  });

  // Phase 12: Root Cause Analysis and Prevention
  const preventionAnalysis = await ctx.task('analyze-root-cause-prevention', {
    findings,
    resolutionDetermination,
    preventionElements: [
      'systemic issue identification',
      'policy gap analysis',
      'training needs assessment',
      'culture and climate factors',
      'preventive recommendations'
    ]
  });

  // Phase 13: Case Closure and Documentation
  const caseClosure = await ctx.task('close-and-document-case', {
    resolutionImplementation,
    preventionAnalysis,
    closureElements: [
      'case file completion',
      'compliance verification',
      'appeal period monitoring',
      'lessons learned documentation',
      'reporting and analytics update'
    ]
  });

  return {
    caseManagement: {
      intake: intakeAssessment,
      classification: caseClassification,
      closure: caseClosure
    },
    investigation: {
      plan: investigationPlan,
      evidence: evidenceCollection,
      interviews: witnessInterviews,
      findings
    },
    resolution: {
      determination: resolutionDetermination,
      communication: resolutionCommunication,
      implementation: resolutionImplementation
    },
    prevention: preventionAnalysis,
    metrics: {
      caseType: caseClassification.type,
      resolutionTime: caseClosure.totalDays,
      outcome: resolutionDetermination.outcome
    }
  };
}

export const intakeAndAssessGrievance = defineTask('intake-and-assess-grievance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Intake and Assess Grievance',
  agent: {
    name: 'employee-relations-specialist',
    prompt: {
      role: 'Grievance Intake Specialist',
      task: 'Receive and assess employee grievance',
      context: args,
      instructions: [
        'Document grievance receipt and acknowledge complainant',
        'Conduct initial complainant interview',
        'Classify the issue type and category',
        'Assess urgency and risk level',
        'Determine jurisdictional requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        acknowledgment: { type: 'object' },
        initialStatement: { type: 'object' },
        classification: { type: 'object' },
        riskAssessment: { type: 'object' },
        jurisdiction: { type: 'object' }
      },
      required: ['acknowledgment', 'classification', 'riskAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const classifyAndRouteCase = defineTask('classify-and-route-case', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify and Route Case',
  agent: {
    name: 'employee-relations-manager',
    prompt: {
      role: 'Case Classification Specialist',
      task: 'Classify grievance and route to appropriate track',
      context: args,
      instructions: [
        'Categorize grievance type',
        'Identify applicable policy or CBA provisions',
        'Determine appropriate resolution track',
        'Assign qualified investigator',
        'Establish case timeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        applicablePolicies: { type: 'array' },
        resolutionTrack: { type: 'string' },
        assignedInvestigator: { type: 'object' },
        timeline: { type: 'object' }
      },
      required: ['type', 'resolutionTrack', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const planInvestigation = defineTask('plan-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Investigation',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigation Planning Specialist',
      task: 'Develop comprehensive investigation plan',
      context: args,
      instructions: [
        'Define investigation scope and objectives',
        'Identify potential witnesses',
        'List required documents and evidence',
        'Create interview schedule',
        'Establish confidentiality protocols'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'object' },
        witnesses: { type: 'array' },
        documentList: { type: 'array' },
        interviewSchedule: { type: 'array' },
        confidentialityProtocols: { type: 'object' }
      },
      required: ['scope', 'witnesses', 'interviewSchedule']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const collectEvidence = defineTask('collect-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect Evidence',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Evidence Collection Specialist',
      task: 'Collect and organize investigation evidence',
      context: args,
      instructions: [
        'Gather and preserve relevant documents',
        'Collect electronic evidence',
        'Review applicable policies and procedures',
        'Research historical precedents',
        'Organize and catalog all evidence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        documents: { type: 'array' },
        electronicEvidence: { type: 'array' },
        policies: { type: 'array' },
        precedents: { type: 'array' },
        evidenceCatalog: { type: 'object' }
      },
      required: ['documents', 'evidenceCatalog']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const conductWitnessInterviews = defineTask('conduct-witness-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Witness Interviews',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigative Interviewer',
      task: 'Conduct comprehensive witness interviews',
      context: args,
      instructions: [
        'Conduct detailed complainant interview',
        'Interview respondent with appropriate protocols',
        'Interview third-party witnesses',
        'Interview relevant management',
        'Document all interviews thoroughly'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        complainantInterview: { type: 'object' },
        respondentInterview: { type: 'object' },
        witnessInterviews: { type: 'array' },
        managementInterviews: { type: 'array' },
        interviewSummaries: { type: 'object' }
      },
      required: ['complainantInterview', 'respondentInterview']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developInvestigationFindings = defineTask('develop-investigation-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Investigation Findings',
  agent: {
    name: 'workplace-investigator',
    prompt: {
      role: 'Investigation Findings Analyst',
      task: 'Develop investigation findings based on evidence',
      context: args,
      instructions: [
        'Analyze and weigh evidence',
        'Assess witness credibility',
        'Determine policy violations',
        'Document factual conclusions',
        'Note gaps and limitations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        evidenceAnalysis: { type: 'object' },
        credibilityAssessments: { type: 'object' },
        policyViolations: { type: 'array' },
        factualConclusions: { type: 'array' },
        limitations: { type: 'array' }
      },
      required: ['evidenceAnalysis', 'factualConclusions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const determineResolution = defineTask('determine-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine Resolution',
  agent: {
    name: 'employee-relations-manager',
    prompt: {
      role: 'Resolution Decision Maker',
      task: 'Determine appropriate grievance resolution',
      context: args,
      instructions: [
        'Apply relevant policies to findings',
        'Consider historical precedents',
        'Evaluate remedy options',
        'Assess proportionality of response',
        'Document appeal rights'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        policyApplication: { type: 'object' },
        precedentConsideration: { type: 'object' },
        remedyOptions: { type: 'array' },
        selectedResolution: { type: 'object' },
        appealRights: { type: 'object' },
        outcome: { type: 'string' }
      },
      required: ['selectedResolution', 'appealRights', 'outcome']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const communicateResolution = defineTask('communicate-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Communicate Resolution',
  agent: {
    name: 'employee-relations-specialist',
    prompt: {
      role: 'Resolution Communication Specialist',
      task: 'Communicate grievance resolution to all parties',
      context: args,
      instructions: [
        'Notify complainant of resolution',
        'Notify respondent appropriately',
        'Communicate with management',
        'Notify union if applicable',
        'Document all communications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        complainantNotification: { type: 'object' },
        respondentNotification: { type: 'object' },
        managementCommunication: { type: 'object' },
        unionNotification: { type: 'object' },
        communicationLog: { type: 'array' }
      },
      required: ['complainantNotification', 'communicationLog']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const implementResolution = defineTask('implement-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Resolution',
  agent: {
    name: 'employee-relations-specialist',
    prompt: {
      role: 'Resolution Implementation Specialist',
      task: 'Implement grievance resolution actions',
      context: args,
      instructions: [
        'Execute agreed remedies',
        'Implement corrective actions',
        'Make policy or process changes',
        'Deliver training or coaching',
        'Monitor compliance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        remediesExecuted: { type: 'array' },
        correctiveActions: { type: 'array' },
        policyChanges: { type: 'array' },
        trainingDelivered: { type: 'array' },
        complianceMonitoring: { type: 'object' }
      },
      required: ['remediesExecuted', 'complianceMonitoring']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeRootCausePrevention = defineTask('analyze-root-cause-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Root Cause and Prevention',
  agent: {
    name: 'employee-relations-analyst',
    prompt: {
      role: 'Root Cause Prevention Analyst',
      task: 'Analyze root causes and develop prevention strategies',
      context: args,
      instructions: [
        'Identify systemic issues',
        'Analyze policy gaps',
        'Assess training needs',
        'Evaluate culture and climate factors',
        'Develop preventive recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        systemicIssues: { type: 'array' },
        policyGaps: { type: 'array' },
        trainingNeeds: { type: 'array' },
        cultureFactors: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['systemicIssues', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const closeAndDocumentCase = defineTask('close-and-document-case', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Close and Document Case',
  agent: {
    name: 'employee-relations-specialist',
    prompt: {
      role: 'Case Closure Specialist',
      task: 'Close and document grievance case',
      context: args,
      instructions: [
        'Complete case file documentation',
        'Verify compliance with resolutions',
        'Monitor appeal period',
        'Document lessons learned',
        'Update reporting and analytics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        caseFile: { type: 'object' },
        complianceVerification: { type: 'object' },
        appealStatus: { type: 'object' },
        lessonsLearned: { type: 'array' },
        analyticsUpdate: { type: 'object' },
        totalDays: { type: 'number' }
      },
      required: ['caseFile', 'complianceVerification', 'totalDays']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
