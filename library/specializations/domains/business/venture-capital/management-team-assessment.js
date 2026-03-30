/**
 * @process venture-capital/management-team-assessment
 * @description Structured evaluation of founding team and leadership including background verification, reference checks, skills gap analysis, and organizational culture assessment
 * @inputs { companyName: string, teamMembers: array, roleRequirements: object }
 * @outputs { success: boolean, teamAssessment: object, skillsAnalysis: object, cultureAssessment: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    teamMembers = [],
    roleRequirements = {},
    outputDir = 'team-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Background Verification
  ctx.log('info', 'Conducting background verification');
  const backgroundVerification = await ctx.task(backgroundVerificationTask, {
    companyName,
    teamMembers,
    outputDir
  });

  if (!backgroundVerification.success) {
    return {
      success: false,
      error: 'Background verification failed',
      details: backgroundVerification,
      metadata: { processId: 'venture-capital/management-team-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...backgroundVerification.artifacts);

  // Task 2: Reference Checks
  ctx.log('info', 'Conducting reference checks');
  const referenceChecks = await ctx.task(referenceChecksTask, {
    companyName,
    teamMembers,
    outputDir
  });

  artifacts.push(...referenceChecks.artifacts);

  // Task 3: Founder-Market Fit Analysis
  ctx.log('info', 'Analyzing founder-market fit');
  const founderMarketFit = await ctx.task(founderMarketFitTask, {
    companyName,
    teamMembers,
    roleRequirements,
    outputDir
  });

  artifacts.push(...founderMarketFit.artifacts);

  // Task 4: Skills Gap Analysis
  ctx.log('info', 'Analyzing skills gaps');
  const skillsGapAnalysis = await ctx.task(skillsGapTask, {
    companyName,
    teamMembers,
    roleRequirements,
    outputDir
  });

  artifacts.push(...skillsGapAnalysis.artifacts);

  // Task 5: Leadership Assessment
  ctx.log('info', 'Assessing leadership capabilities');
  const leadershipAssessment = await ctx.task(leadershipAssessmentTask, {
    companyName,
    teamMembers,
    outputDir
  });

  artifacts.push(...leadershipAssessment.artifacts);

  // Task 6: Culture Assessment
  ctx.log('info', 'Assessing organizational culture');
  const cultureAssessment = await ctx.task(cultureAssessmentTask, {
    companyName,
    teamMembers,
    outputDir
  });

  artifacts.push(...cultureAssessment.artifacts);

  // Task 7: Team Dynamics Analysis
  ctx.log('info', 'Analyzing team dynamics');
  const teamDynamics = await ctx.task(teamDynamicsTask, {
    companyName,
    teamMembers,
    leadershipAssessment: leadershipAssessment.assessment,
    outputDir
  });

  artifacts.push(...teamDynamics.artifacts);

  // Breakpoint: Review team assessment findings
  await ctx.breakpoint({
    question: `Team assessment complete for ${companyName}. Founder-market fit: ${founderMarketFit.score}/100. Key gaps: ${skillsGapAnalysis.criticalGaps.length}. Review findings?`,
    title: 'Management Team Assessment Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        teamSize: teamMembers.length,
        backgroundsVerified: backgroundVerification.verified,
        founderMarketFitScore: founderMarketFit.score,
        criticalSkillsGaps: skillsGapAnalysis.criticalGaps.length,
        leadershipScore: leadershipAssessment.score,
        cultureRating: cultureAssessment.rating
      }
    }
  });

  // Task 8: Generate Team Assessment Report
  ctx.log('info', 'Generating team assessment report');
  const assessmentReport = await ctx.task(teamAssessmentReportTask, {
    companyName,
    backgroundVerification,
    referenceChecks,
    founderMarketFit,
    skillsGapAnalysis,
    leadershipAssessment,
    cultureAssessment,
    teamDynamics,
    outputDir
  });

  artifacts.push(...assessmentReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    teamAssessment: {
      totalMembers: teamMembers.length,
      backgroundsVerified: backgroundVerification.verified,
      referencesCompleted: referenceChecks.completed,
      founderMarketFitScore: founderMarketFit.score,
      leadershipScore: leadershipAssessment.score
    },
    skillsAnalysis: {
      strengths: skillsGapAnalysis.strengths,
      gaps: skillsGapAnalysis.gaps,
      criticalGaps: skillsGapAnalysis.criticalGaps,
      hiringPriorities: skillsGapAnalysis.hiringPriorities
    },
    cultureAssessment: {
      rating: cultureAssessment.rating,
      values: cultureAssessment.values,
      strengths: cultureAssessment.strengths,
      concerns: cultureAssessment.concerns
    },
    teamDynamics: teamDynamics.assessment,
    recommendations: assessmentReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/management-team-assessment',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Background Verification
export const backgroundVerificationTask = defineTask('background-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct background verification',
  agent: {
    name: 'background-investigator',
    prompt: {
      role: 'background verification specialist',
      task: 'Verify backgrounds of key team members',
      context: args,
      instructions: [
        'Verify educational credentials',
        'Confirm employment history',
        'Validate claimed achievements and exits',
        'Check for regulatory or legal issues',
        'Verify board positions and affiliations',
        'Research media coverage and reputation',
        'Identify any red flags or inconsistencies',
        'Document verification findings'
      ],
      outputFormat: 'JSON with verification results, flags, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'verified', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        verified: { type: 'number' },
        results: { type: 'array' },
        redFlags: { type: 'array' },
        inconsistencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'background', 'verification']
}));

// Task 2: Reference Checks
export const referenceChecksTask = defineTask('reference-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct reference checks',
  agent: {
    name: 'reference-checker',
    prompt: {
      role: 'reference check specialist',
      task: 'Conduct comprehensive reference checks',
      context: args,
      instructions: [
        'Design reference check questions by role',
        'Identify appropriate references to contact',
        'Conduct structured reference interviews',
        'Assess leadership and management style',
        'Evaluate collaboration and communication',
        'Identify patterns across references',
        'Note any concerning feedback',
        'Summarize reference findings'
      ],
      outputFormat: 'JSON with reference check results and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'summaries', 'artifacts'],
      properties: {
        completed: { type: 'number' },
        summaries: { type: 'array' },
        patterns: { type: 'array' },
        concerns: { type: 'array' },
        highlights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'references', 'checks']
}));

// Task 3: Founder-Market Fit Analysis
export const founderMarketFitTask = defineTask('founder-market-fit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze founder-market fit',
  agent: {
    name: 'founder-analyst',
    prompt: {
      role: 'founder assessment specialist',
      task: 'Evaluate founder-market fit',
      context: args,
      instructions: [
        'Assess domain expertise and experience',
        'Evaluate understanding of customer pain points',
        'Review industry network and relationships',
        'Assess technical capabilities for the market',
        'Evaluate go-to-market experience',
        'Review track record in similar markets',
        'Identify unique founder insights',
        'Score overall founder-market fit'
      ],
      outputFormat: 'JSON with founder-market fit score, analysis, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'analysis', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        analysis: { type: 'object' },
        strengths: { type: 'array' },
        gaps: { type: 'array' },
        uniqueInsights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'founder-market-fit', 'assessment']
}));

// Task 4: Skills Gap Analysis
export const skillsGapTask = defineTask('skills-gap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze skills gaps',
  agent: {
    name: 'skills-analyst',
    prompt: {
      role: 'organizational development specialist',
      task: 'Analyze team skills gaps',
      context: args,
      instructions: [
        'Map current team skills and capabilities',
        'Define required skills for growth stage',
        'Identify skills gaps by function',
        'Prioritize gaps by criticality',
        'Assess ability to hire needed talent',
        'Evaluate advisor network coverage',
        'Recommend hiring sequence',
        'Identify interim solutions for gaps'
      ],
      outputFormat: 'JSON with skills analysis, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strengths', 'gaps', 'criticalGaps', 'artifacts'],
      properties: {
        strengths: { type: 'array' },
        gaps: { type: 'array' },
        criticalGaps: { type: 'array' },
        hiringPriorities: { type: 'array' },
        interimSolutions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'skills', 'gap-analysis']
}));

// Task 5: Leadership Assessment
export const leadershipAssessmentTask = defineTask('leadership-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess leadership capabilities',
  agent: {
    name: 'leadership-assessor',
    prompt: {
      role: 'executive leadership assessor',
      task: 'Assess leadership capabilities of management team',
      context: args,
      instructions: [
        'Evaluate CEO leadership qualities',
        'Assess strategic thinking capabilities',
        'Evaluate decision-making processes',
        'Assess communication effectiveness',
        'Evaluate ability to attract and retain talent',
        'Assess crisis management capabilities',
        'Evaluate stakeholder management',
        'Score overall leadership capability'
      ],
      outputFormat: 'JSON with leadership assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        byLeader: { type: 'array' },
        strengths: { type: 'array' },
        developmentAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'leadership', 'assessment']
}));

// Task 6: Culture Assessment
export const cultureAssessmentTask = defineTask('culture-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess organizational culture',
  agent: {
    name: 'culture-analyst',
    prompt: {
      role: 'organizational culture specialist',
      task: 'Assess organizational culture',
      context: args,
      instructions: [
        'Identify stated values and mission',
        'Assess actual cultural practices',
        'Evaluate transparency and communication',
        'Assess diversity and inclusion',
        'Evaluate employee engagement indicators',
        'Review turnover and retention patterns',
        'Identify cultural strengths',
        'Flag cultural concerns'
      ],
      outputFormat: 'JSON with culture assessment, rating, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rating', 'values', 'strengths', 'artifacts'],
      properties: {
        rating: { type: 'string', enum: ['excellent', 'good', 'adequate', 'concerning'] },
        values: { type: 'array' },
        strengths: { type: 'array' },
        concerns: { type: 'array' },
        engagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'culture', 'assessment']
}));

// Task 7: Team Dynamics Analysis
export const teamDynamicsTask = defineTask('team-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze team dynamics',
  agent: {
    name: 'dynamics-analyst',
    prompt: {
      role: 'team dynamics specialist',
      task: 'Analyze team dynamics and collaboration',
      context: args,
      instructions: [
        'Assess founder relationship dynamics',
        'Evaluate decision-making collaboration',
        'Identify potential conflict areas',
        'Assess role clarity and overlap',
        'Evaluate trust and psychological safety',
        'Review conflict resolution patterns',
        'Assess alignment on vision and strategy',
        'Identify team dynamic risks'
      ],
      outputFormat: 'JSON with dynamics assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'risks', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        founderDynamics: { type: 'object' },
        collaboration: { type: 'object' },
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
  labels: ['agent', 'venture-capital', 'team-dynamics', 'assessment']
}));

// Task 8: Team Assessment Report Generation
export const teamAssessmentReportTask = defineTask('team-assessment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate team assessment report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC talent analyst',
      task: 'Generate comprehensive team assessment report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present background verification results',
        'Include reference check summaries',
        'Document founder-market fit analysis',
        'Present skills gap analysis',
        'Include leadership assessment',
        'Document culture assessment',
        'Present team dynamics analysis',
        'Provide hiring and development recommendations'
      ],
      outputFormat: 'JSON with report path, recommendations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        recommendations: { type: 'array' },
        executiveSummary: { type: 'string' },
        overallAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'team-assessment', 'reporting']
}));
