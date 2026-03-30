/**
 * @process specializations/domains/business/human-resources/full-cycle-recruiting
 * @description Full-Cycle Recruiting Process - End-to-end recruiting workflow from requisition approval through sourcing,
 * screening, interviewing, selection, offer negotiation, and acceptance tracking with comprehensive candidate pipeline management.
 * @inputs { requisitionId: string, jobTitle: string, department: string, hiringManager: string, salaryRange?: object, requirements?: object }
 * @outputs { success: boolean, candidatesSourced: number, candidatesHired: number, timeToFill: number, offerAcceptanceRate: number, pipelineMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/full-cycle-recruiting', {
 *   requisitionId: 'REQ-2024-001',
 *   jobTitle: 'Senior Software Engineer',
 *   department: 'Engineering',
 *   hiringManager: 'Jane Smith',
 *   salaryRange: { min: 150000, max: 200000, currency: 'USD' },
 *   requirements: { experience: '5+ years', skills: ['Python', 'AWS', 'Kubernetes'] }
 * });
 *
 * @references
 * - Greenhouse Full-Cycle Recruiting: https://www.greenhouse.io/blog/full-cycle-recruiting
 * - SHRM Talent Acquisition: https://www.shrm.org/resourcesandtools/hr-topics/talent-acquisition
 * - LinkedIn Talent Solutions: https://business.linkedin.com/talent-solutions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    requisitionId,
    jobTitle,
    department,
    hiringManager,
    salaryRange = { min: 0, max: 0, currency: 'USD' },
    requirements = {},
    targetHireDate = null,
    recruitingTeam = [],
    sourcingChannels = ['linkedin', 'indeed', 'referrals', 'careers-page'],
    interviewStages = ['phone-screen', 'technical', 'onsite', 'final'],
    diversityGoals = {},
    outputDir = 'recruiting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Full-Cycle Recruiting Process for ${requisitionId}: ${jobTitle}`);

  // Phase 1: Requisition Intake and Job Analysis
  const requisitionIntake = await ctx.task(requisitionIntakeTask, {
    requisitionId,
    jobTitle,
    department,
    hiringManager,
    salaryRange,
    requirements,
    targetHireDate,
    outputDir
  });

  artifacts.push(...requisitionIntake.artifacts);

  // Quality Gate: Requisition must be approved
  if (!requisitionIntake.approved) {
    return {
      success: false,
      error: 'Requisition not approved',
      phase: 'requisition-intake',
      requisitionId
    };
  }

  await ctx.breakpoint({
    question: `Requisition ${requisitionId} for ${jobTitle} approved. Review job description and requirements before proceeding to sourcing?`,
    title: 'Requisition Approval Review',
    context: {
      runId: ctx.runId,
      requisitionId,
      jobTitle,
      department,
      hiringManager,
      jobDescription: requisitionIntake.jobDescription,
      requirements: requisitionIntake.requirements,
      files: requisitionIntake.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Sourcing Strategy Development
  const sourcingStrategy = await ctx.task(sourcingStrategyTask, {
    requisitionId,
    jobTitle,
    requirements: requisitionIntake.requirements,
    salaryRange,
    sourcingChannels,
    diversityGoals,
    outputDir
  });

  artifacts.push(...sourcingStrategy.artifacts);

  // Phase 3: Candidate Sourcing and Outreach
  const candidateSourcing = await ctx.task(candidateSourcingTask, {
    requisitionId,
    jobTitle,
    sourcingStrategy,
    requirements: requisitionIntake.requirements,
    sourcingChannels,
    outputDir
  });

  artifacts.push(...candidateSourcing.artifacts);

  ctx.log('info', `Sourced ${candidateSourcing.candidatesSourced} candidates for ${requisitionId}`);

  // Phase 4: Resume Screening and Initial Assessment
  const resumeScreening = await ctx.task(resumeScreeningTask, {
    requisitionId,
    jobTitle,
    candidates: candidateSourcing.candidates,
    requirements: requisitionIntake.requirements,
    outputDir
  });

  artifacts.push(...resumeScreening.artifacts);

  await ctx.breakpoint({
    question: `Screened ${resumeScreening.candidatesScreened} candidates. ${resumeScreening.candidatesShortlisted} meet requirements. Review shortlist before phone screens?`,
    title: 'Resume Screening Review',
    context: {
      runId: ctx.runId,
      requisitionId,
      candidatesScreened: resumeScreening.candidatesScreened,
      candidatesShortlisted: resumeScreening.candidatesShortlisted,
      shortlistedCandidates: resumeScreening.shortlistedCandidates,
      screeningCriteria: resumeScreening.screeningCriteria,
      files: resumeScreening.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Phone Screening
  const phoneScreening = await ctx.task(phoneScreeningTask, {
    requisitionId,
    jobTitle,
    candidates: resumeScreening.shortlistedCandidates,
    requirements: requisitionIntake.requirements,
    hiringManager,
    outputDir
  });

  artifacts.push(...phoneScreening.artifacts);

  // Phase 6: Interview Coordination and Scheduling
  const interviewCoordination = await ctx.task(interviewCoordinationTask, {
    requisitionId,
    jobTitle,
    candidates: phoneScreening.advancingCandidates,
    interviewStages,
    hiringManager,
    recruitingTeam,
    outputDir
  });

  artifacts.push(...interviewCoordination.artifacts);

  // Phase 7: Technical/Skills Assessment
  const technicalAssessment = await ctx.task(technicalAssessmentTask, {
    requisitionId,
    jobTitle,
    candidates: interviewCoordination.scheduledCandidates,
    requirements: requisitionIntake.requirements,
    outputDir
  });

  artifacts.push(...technicalAssessment.artifacts);

  // Phase 8: Onsite/Final Round Interviews
  const onsiteInterviews = await ctx.task(onsiteInterviewsTask, {
    requisitionId,
    jobTitle,
    candidates: technicalAssessment.advancingCandidates,
    hiringManager,
    interviewPanel: interviewCoordination.interviewPanel,
    outputDir
  });

  artifacts.push(...onsiteInterviews.artifacts);

  await ctx.breakpoint({
    question: `Final interviews completed for ${onsiteInterviews.candidatesInterviewed} candidates. Review interview feedback and scorecards before selection decision?`,
    title: 'Interview Debrief Review',
    context: {
      runId: ctx.runId,
      requisitionId,
      candidatesInterviewed: onsiteInterviews.candidatesInterviewed,
      interviewFeedback: onsiteInterviews.interviewFeedback,
      scorecards: onsiteInterviews.scorecards,
      recommendations: onsiteInterviews.recommendations,
      files: onsiteInterviews.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Selection and Hiring Decision
  const selectionDecision = await ctx.task(selectionDecisionTask, {
    requisitionId,
    jobTitle,
    candidates: onsiteInterviews.evaluatedCandidates,
    interviewFeedback: onsiteInterviews.interviewFeedback,
    hiringManager,
    salaryRange,
    outputDir
  });

  artifacts.push(...selectionDecision.artifacts);

  // Phase 10: Reference and Background Checks
  const backgroundChecks = await ctx.task(backgroundChecksTask, {
    requisitionId,
    selectedCandidate: selectionDecision.selectedCandidate,
    outputDir
  });

  artifacts.push(...backgroundChecks.artifacts);

  // Quality Gate: Background check must pass
  if (!backgroundChecks.passed) {
    await ctx.breakpoint({
      question: `Background check issues found for selected candidate. Review findings and decide on next steps?`,
      title: 'Background Check Review',
      context: {
        runId: ctx.runId,
        requisitionId,
        candidate: selectionDecision.selectedCandidate,
        issues: backgroundChecks.issues,
        recommendation: backgroundChecks.recommendation,
        files: backgroundChecks.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 11: Offer Creation and Negotiation
  const offerNegotiation = await ctx.task(offerNegotiationTask, {
    requisitionId,
    jobTitle,
    selectedCandidate: selectionDecision.selectedCandidate,
    salaryRange,
    approvedCompensation: selectionDecision.approvedCompensation,
    outputDir
  });

  artifacts.push(...offerNegotiation.artifacts);

  await ctx.breakpoint({
    question: `Offer prepared for ${selectionDecision.selectedCandidate.name}. Compensation: ${offerNegotiation.offerDetails.salary}. Approve and extend offer?`,
    title: 'Offer Approval',
    context: {
      runId: ctx.runId,
      requisitionId,
      candidate: selectionDecision.selectedCandidate,
      offerDetails: offerNegotiation.offerDetails,
      negotiationHistory: offerNegotiation.negotiationHistory,
      files: offerNegotiation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 12: Offer Acceptance and Pre-boarding
  const offerAcceptance = await ctx.task(offerAcceptanceTask, {
    requisitionId,
    jobTitle,
    candidate: selectionDecision.selectedCandidate,
    offerDetails: offerNegotiation.offerDetails,
    outputDir
  });

  artifacts.push(...offerAcceptance.artifacts);

  // Phase 13: Pipeline Analytics and Reporting
  const pipelineAnalytics = await ctx.task(pipelineAnalyticsTask, {
    requisitionId,
    jobTitle,
    department,
    startTime,
    candidateSourcing,
    resumeScreening,
    phoneScreening,
    onsiteInterviews,
    selectionDecision,
    offerAcceptance,
    outputDir
  });

  artifacts.push(...pipelineAnalytics.artifacts);

  const endTime = ctx.now();
  const timeToFill = (endTime - startTime) / (1000 * 60 * 60 * 24); // Days

  return {
    success: true,
    requisitionId,
    jobTitle,
    department,
    hiringManager,
    candidatesSourced: candidateSourcing.candidatesSourced,
    candidatesScreened: resumeScreening.candidatesScreened,
    candidatesInterviewed: onsiteInterviews.candidatesInterviewed,
    candidatesHired: offerAcceptance.accepted ? 1 : 0,
    selectedCandidate: offerAcceptance.accepted ? selectionDecision.selectedCandidate : null,
    offerAccepted: offerAcceptance.accepted,
    startDate: offerAcceptance.startDate,
    timeToFill,
    offerAcceptanceRate: offerAcceptance.accepted ? 100 : 0,
    pipelineMetrics: pipelineAnalytics.metrics,
    sourcingEffectiveness: pipelineAnalytics.sourcingEffectiveness,
    diversityMetrics: pipelineAnalytics.diversityMetrics,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/full-cycle-recruiting',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const requisitionIntakeTask = defineTask('requisition-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requisition Intake - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Talent Acquisition Specialist',
      task: 'Process job requisition intake and develop comprehensive job description',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        department: args.department,
        hiringManager: args.hiringManager,
        salaryRange: args.salaryRange,
        requirements: args.requirements,
        targetHireDate: args.targetHireDate,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review and validate requisition details',
        '2. Conduct intake meeting with hiring manager',
        '3. Define role responsibilities and expectations',
        '4. Document required qualifications and skills',
        '5. Identify preferred qualifications',
        '6. Establish compensation range and benefits',
        '7. Define success metrics for the role',
        '8. Create compelling job description',
        '9. Obtain necessary approvals',
        '10. Set up requisition in ATS'
      ],
      outputFormat: 'JSON object with requisition intake details'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'jobDescription', 'requirements', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        jobDescription: { type: 'string' },
        requirements: {
          type: 'object',
          properties: {
            required: { type: 'array', items: { type: 'string' } },
            preferred: { type: 'array', items: { type: 'string' } },
            education: { type: 'string' },
            experience: { type: 'string' }
          }
        },
        successMetrics: { type: 'array', items: { type: 'string' } },
        approvalChain: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'requisition-intake']
}));

export const sourcingStrategyTask = defineTask('sourcing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Sourcing Strategy - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sourcing Strategist',
      task: 'Develop comprehensive candidate sourcing strategy',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        requirements: args.requirements,
        salaryRange: args.salaryRange,
        sourcingChannels: args.sourcingChannels,
        diversityGoals: args.diversityGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze talent market for the role',
        '2. Identify target companies and talent pools',
        '3. Select optimal sourcing channels',
        '4. Develop boolean search strings',
        '5. Create outreach messaging templates',
        '6. Plan diversity sourcing initiatives',
        '7. Set sourcing goals and timelines',
        '8. Allocate sourcing budget',
        '9. Plan job postings and advertisements',
        '10. Establish employee referral program'
      ],
      outputFormat: 'JSON object with sourcing strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['sourcingPlan', 'targetChannels', 'artifacts'],
      properties: {
        sourcingPlan: { type: 'object' },
        targetChannels: { type: 'array', items: { type: 'string' } },
        searchStrings: { type: 'array', items: { type: 'string' } },
        outreachTemplates: { type: 'array', items: { type: 'object' } },
        diversityStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'sourcing']
}));

export const candidateSourcingTask = defineTask('candidate-sourcing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Candidate Sourcing - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Recruiter',
      task: 'Execute sourcing strategy to identify and attract candidates',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        sourcingStrategy: args.sourcingStrategy,
        requirements: args.requirements,
        sourcingChannels: args.sourcingChannels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Post job to job boards and careers page',
        '2. Execute LinkedIn sourcing campaigns',
        '3. Reach out to passive candidates',
        '4. Engage employee referral network',
        '5. Work with recruiting agencies',
        '6. Attend virtual career events',
        '7. Track sourcing metrics by channel',
        '8. Manage candidate pipeline in ATS',
        '9. Respond to inbound applications',
        '10. Build talent community for future roles'
      ],
      outputFormat: 'JSON object with sourcing results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidatesSourced', 'candidates', 'artifacts'],
      properties: {
        candidatesSourced: { type: 'number' },
        candidates: { type: 'array', items: { type: 'object' } },
        sourcingMetrics: { type: 'object' },
        channelEffectiveness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'sourcing']
}));

export const resumeScreeningTask = defineTask('resume-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Resume Screening - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screening Specialist',
      task: 'Screen resumes and shortlist qualified candidates',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        requirements: args.requirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review each resume against requirements',
        '2. Score candidates on must-have criteria',
        '3. Evaluate preferred qualifications',
        '4. Check for relevant experience',
        '5. Assess cultural fit indicators',
        '6. Flag potential concerns',
        '7. Create shortlist of qualified candidates',
        '8. Document screening rationale',
        '9. Send rejection emails to unqualified',
        '10. Move shortlisted to next stage'
      ],
      outputFormat: 'JSON object with screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidatesScreened', 'candidatesShortlisted', 'shortlistedCandidates', 'artifacts'],
      properties: {
        candidatesScreened: { type: 'number' },
        candidatesShortlisted: { type: 'number' },
        shortlistedCandidates: { type: 'array', items: { type: 'object' } },
        screeningCriteria: { type: 'object' },
        rejectionReasons: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'screening']
}));

export const phoneScreeningTask = defineTask('phone-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Phone Screening - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Recruiter',
      task: 'Conduct initial phone screens with shortlisted candidates',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        requirements: args.requirements,
        hiringManager: args.hiringManager,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Schedule phone screens with candidates',
        '2. Prepare standardized screening questions',
        '3. Assess communication skills',
        '4. Verify resume accuracy',
        '5. Evaluate motivation and interest',
        '6. Discuss salary expectations',
        '7. Explain role and company culture',
        '8. Answer candidate questions',
        '9. Score and document feedback',
        '10. Advance qualified candidates'
      ],
      outputFormat: 'JSON object with phone screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidatesScreened', 'advancingCandidates', 'artifacts'],
      properties: {
        candidatesScreened: { type: 'number' },
        advancingCandidates: { type: 'array', items: { type: 'object' } },
        screeningNotes: { type: 'array', items: { type: 'object' } },
        salaryExpectations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'phone-screen']
}));

export const interviewCoordinationTask = defineTask('interview-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interview Coordination - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Coordinator',
      task: 'Coordinate and schedule interview process',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        interviewStages: args.interviewStages,
        hiringManager: args.hiringManager,
        recruitingTeam: args.recruitingTeam,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define interview panel members',
        '2. Create interview schedule',
        '3. Coordinate availability',
        '4. Send calendar invites',
        '5. Prepare interview guides',
        '6. Brief interviewers on candidates',
        '7. Set up video conferencing',
        '8. Share candidate materials',
        '9. Manage candidate experience',
        '10. Track interview completion'
      ],
      outputFormat: 'JSON object with interview coordination details'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledCandidates', 'interviewPanel', 'artifacts'],
      properties: {
        scheduledCandidates: { type: 'array', items: { type: 'object' } },
        interviewPanel: { type: 'array', items: { type: 'object' } },
        interviewSchedule: { type: 'array', items: { type: 'object' } },
        interviewGuides: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'interview-coordination']
}));

export const technicalAssessmentTask = defineTask('technical-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Technical Assessment - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Conduct technical skills assessment',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        requirements: args.requirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design technical assessment',
        '2. Administer coding challenges',
        '3. Conduct technical interviews',
        '4. Evaluate problem-solving skills',
        '5. Assess technical knowledge depth',
        '6. Review portfolio/work samples',
        '7. Score technical competencies',
        '8. Document technical feedback',
        '9. Identify skill gaps',
        '10. Recommend candidates for next round'
      ],
      outputFormat: 'JSON object with technical assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedCandidates', 'advancingCandidates', 'artifacts'],
      properties: {
        assessedCandidates: { type: 'number' },
        advancingCandidates: { type: 'array', items: { type: 'object' } },
        technicalScores: { type: 'array', items: { type: 'object' } },
        assessmentFeedback: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'technical-assessment']
}));

export const onsiteInterviewsTask = defineTask('onsite-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Onsite Interviews - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Panel Lead',
      task: 'Conduct final round interviews and evaluate candidates',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        hiringManager: args.hiringManager,
        interviewPanel: args.interviewPanel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Conduct final round interviews',
        '2. Assess cultural fit',
        '3. Evaluate leadership potential',
        '4. Test behavioral competencies',
        '5. Complete interview scorecards',
        '6. Conduct panel debrief',
        '7. Collect interviewer feedback',
        '8. Identify top candidates',
        '9. Document hiring recommendations',
        '10. Calibrate across interviewers'
      ],
      outputFormat: 'JSON object with interview results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidatesInterviewed', 'evaluatedCandidates', 'interviewFeedback', 'artifacts'],
      properties: {
        candidatesInterviewed: { type: 'number' },
        evaluatedCandidates: { type: 'array', items: { type: 'object' } },
        interviewFeedback: { type: 'array', items: { type: 'object' } },
        scorecards: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'interviews']
}));

export const selectionDecisionTask = defineTask('selection-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Selection Decision - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hiring Manager',
      task: 'Make final hiring selection decision',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidates: args.candidates,
        interviewFeedback: args.interviewFeedback,
        hiringManager: args.hiringManager,
        salaryRange: args.salaryRange,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all interview feedback',
        '2. Analyze candidate scorecards',
        '3. Consider team fit',
        '4. Evaluate growth potential',
        '5. Make selection decision',
        '6. Determine compensation package',
        '7. Get approval for offer',
        '8. Identify backup candidates',
        '9. Document decision rationale',
        '10. Prepare for offer stage'
      ],
      outputFormat: 'JSON object with selection decision'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCandidate', 'approvedCompensation', 'artifacts'],
      properties: {
        selectedCandidate: { type: 'object' },
        approvedCompensation: { type: 'object' },
        backupCandidates: { type: 'array', items: { type: 'object' } },
        decisionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'selection']
}));

export const backgroundChecksTask = defineTask('background-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Background Checks - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Compliance Specialist',
      task: 'Conduct reference and background checks',
      context: {
        requisitionId: args.requisitionId,
        selectedCandidate: args.selectedCandidate,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initiate background check process',
        '2. Contact professional references',
        '3. Verify employment history',
        '4. Verify education credentials',
        '5. Conduct criminal background check',
        '6. Review social media presence',
        '7. Document reference feedback',
        '8. Identify any concerns',
        '9. Make pass/fail determination',
        '10. Prepare background check report'
      ],
      outputFormat: 'JSON object with background check results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        referenceChecks: { type: 'array', items: { type: 'object' } },
        employmentVerification: { type: 'object' },
        educationVerification: { type: 'object' },
        criminalCheck: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'background-check']
}));

export const offerNegotiationTask = defineTask('offer-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Offer Negotiation - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compensation Specialist',
      task: 'Create and negotiate job offer',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        selectedCandidate: args.selectedCandidate,
        salaryRange: args.salaryRange,
        approvedCompensation: args.approvedCompensation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare initial offer package',
        '2. Draft offer letter',
        '3. Present verbal offer',
        '4. Handle counter-offers',
        '5. Negotiate within approved range',
        '6. Finalize compensation details',
        '7. Include benefits overview',
        '8. Set offer deadline',
        '9. Document negotiation history',
        '10. Send formal offer letter'
      ],
      outputFormat: 'JSON object with offer negotiation details'
    },
    outputSchema: {
      type: 'object',
      required: ['offerDetails', 'artifacts'],
      properties: {
        offerDetails: {
          type: 'object',
          properties: {
            salary: { type: 'number' },
            bonus: { type: 'number' },
            equity: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            startDate: { type: 'string' }
          }
        },
        negotiationHistory: { type: 'array', items: { type: 'object' } },
        offerLetterPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'offer']
}));

export const offerAcceptanceTask = defineTask('offer-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Offer Acceptance - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Onboarding Coordinator',
      task: 'Track offer acceptance and initiate pre-boarding',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        candidate: args.candidate,
        offerDetails: args.offerDetails,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Track offer response',
        '2. Handle acceptance or decline',
        '3. Collect signed offer letter',
        '4. Send welcome communication',
        '5. Initiate pre-boarding process',
        '6. Set up new hire in HRIS',
        '7. Coordinate with IT for equipment',
        '8. Notify hiring team',
        '9. Send rejection to other candidates',
        '10. Close requisition'
      ],
      outputFormat: 'JSON object with offer acceptance status'
    },
    outputSchema: {
      type: 'object',
      required: ['accepted', 'artifacts'],
      properties: {
        accepted: { type: 'boolean' },
        startDate: { type: 'string' },
        signedOfferPath: { type: 'string' },
        preBoardingInitiated: { type: 'boolean' },
        declineReason: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'offer-acceptance']
}));

export const pipelineAnalyticsTask = defineTask('pipeline-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Pipeline Analytics - ${args.requisitionId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Recruiting Analytics Specialist',
      task: 'Analyze recruiting pipeline and generate metrics report',
      context: {
        requisitionId: args.requisitionId,
        jobTitle: args.jobTitle,
        department: args.department,
        startTime: args.startTime,
        candidateSourcing: args.candidateSourcing,
        resumeScreening: args.resumeScreening,
        phoneScreening: args.phoneScreening,
        onsiteInterviews: args.onsiteInterviews,
        selectionDecision: args.selectionDecision,
        offerAcceptance: args.offerAcceptance,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate time-to-fill',
        '2. Analyze conversion rates by stage',
        '3. Measure sourcing channel effectiveness',
        '4. Calculate cost-per-hire',
        '5. Track diversity metrics',
        '6. Measure candidate experience',
        '7. Analyze interviewer utilization',
        '8. Compare to historical benchmarks',
        '9. Identify process bottlenecks',
        '10. Generate recruiting dashboard'
      ],
      outputFormat: 'JSON object with pipeline analytics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            timeToFill: { type: 'number' },
            timeToHire: { type: 'number' },
            costPerHire: { type: 'number' },
            offerAcceptanceRate: { type: 'number' },
            conversionRates: { type: 'object' }
          }
        },
        sourcingEffectiveness: { type: 'object' },
        diversityMetrics: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'recruiting', 'analytics']
}));
