/**
 * @process employee-engagement-survey
 * @description End-to-end process for designing, deploying, analyzing, and acting on employee
 * engagement surveys to measure organizational health, identify improvement areas, and drive
 * positive workplace change.
 * @inputs {
 *   organizationContext: { industry, size, culture, previousSurveys },
 *   surveyDesign: { methodology, topics, frequency, confidentiality },
 *   administration: { platform, timeline, communications },
 *   stakeholders: { hrLeadership, executiveTeam, managers },
 *   constraints: { budget, timeline, resources }
 * }
 * @outputs {
 *   surveyInstrument: { questions, scales, benchmarks },
 *   surveyResults: { participation, scores, verbatims, trends },
 *   analysis: { insights, themes, priorities },
 *   actionPlanning: { initiatives, ownership, timelines }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'financial-services', size: 8000 },
 *   surveyDesign: { methodology: 'annual-census', topics: ['engagement', 'manager', 'culture'] },
 *   administration: { platform: 'Glint', timeline: '3-weeks' }
 * });
 * @references
 * - Gallup Q12 Engagement Survey Framework
 * - Qualtrics Employee Experience Methodology
 * - Culture Amp Best Practices
 * - Bersin Employee Listening Strategy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, surveyDesign, administration, stakeholders, constraints } = inputs;

  // Phase 1: Survey Strategy Definition
  const surveyStrategy = await ctx.task('define-survey-strategy', {
    organizationContext,
    surveyDesign,
    strategyElements: [
      'survey objectives and goals',
      'measurement framework selection',
      'survey cadence determination',
      'confidentiality and anonymity approach',
      'success metrics definition'
    ]
  });

  // Phase 2: Survey Instrument Design
  const instrumentDesign = await ctx.task('design-survey-instrument', {
    surveyStrategy,
    surveyDesign,
    designElements: [
      'question selection and development',
      'response scale design',
      'benchmark integration',
      'demographic questions',
      'open-ended question design'
    ]
  });

  // Phase 3: Platform Configuration
  const platformConfig = await ctx.task('configure-survey-platform', {
    instrumentDesign,
    administration,
    configElements: [
      'survey platform setup',
      'question programming',
      'distribution list preparation',
      'reporting structure setup',
      'access permissions configuration'
    ]
  });

  // Phase 4: Survey Approval
  await ctx.breakpoint('survey-approval', {
    title: 'Survey Instrument Approval',
    description: 'Review and approve survey instrument and administration plan',
    artifacts: {
      surveyStrategy,
      instrumentDesign,
      platformConfig
    },
    questions: [
      'Are the survey questions appropriate and unbiased?',
      'Is the survey length acceptable?',
      'Is the administration plan realistic?'
    ]
  });

  // Phase 5: Communication Planning
  const communicationPlan = await ctx.task('plan-communications', {
    surveyStrategy,
    administration,
    stakeholders,
    communicationElements: [
      'executive announcement',
      'manager toolkit and briefing',
      'employee launch communication',
      'reminder schedule',
      'participation tracking communication'
    ]
  });

  // Phase 6: Survey Launch and Administration
  const surveyAdministration = await ctx.task('administer-survey', {
    platformConfig,
    communicationPlan,
    administration,
    administrationElements: [
      'survey launch execution',
      'participation monitoring',
      'reminder deployment',
      'issue resolution',
      'survey closure'
    ]
  });

  // Phase 7: Data Collection and Validation
  const dataCollection = await ctx.task('collect-validate-data', {
    surveyAdministration,
    collectionElements: [
      'response data extraction',
      'data quality validation',
      'incomplete response handling',
      'verbatim response compilation',
      'demographic data integration'
    ]
  });

  // Phase 8: Quantitative Analysis
  const quantitativeAnalysis = await ctx.task('analyze-quantitative-data', {
    dataCollection,
    instrumentDesign,
    analysisElements: [
      'overall engagement score calculation',
      'dimension and item scores',
      'demographic cuts analysis',
      'benchmark comparisons',
      'trend analysis (if prior data)'
    ]
  });

  // Phase 9: Qualitative Analysis
  const qualitativeAnalysis = await ctx.task('analyze-qualitative-data', {
    dataCollection,
    quantitativeAnalysis,
    analysisElements: [
      'verbatim theme coding',
      'sentiment analysis',
      'key theme identification',
      'illustrative quote selection',
      'verbatim-score correlation'
    ]
  });

  // Phase 10: Insights Development
  const insightsDevelopment = await ctx.task('develop-insights', {
    quantitativeAnalysis,
    qualitativeAnalysis,
    organizationContext,
    insightElements: [
      'key findings synthesis',
      'strength identification',
      'opportunity identification',
      'driver analysis',
      'priority recommendations'
    ]
  });

  // Phase 11: Results Review
  await ctx.breakpoint('results-review', {
    title: 'Survey Results Review',
    description: 'Review survey findings before broader communication',
    artifacts: {
      quantitativeAnalysis,
      qualitativeAnalysis,
      insightsDevelopment
    },
    questions: [
      'Are the findings accurately interpreted?',
      'Are there any sensitive findings requiring special handling?',
      'What is the communication approach for results?'
    ]
  });

  // Phase 12: Report Development
  const reportDevelopment = await ctx.task('develop-reports', {
    insightsDevelopment,
    quantitativeAnalysis,
    stakeholders,
    reportElements: [
      'executive summary report',
      'detailed organizational report',
      'manager reports by team',
      'demographic group reports',
      'visualization and dashboards'
    ]
  });

  // Phase 13: Results Communication
  const resultsCommunication = await ctx.task('communicate-results', {
    reportDevelopment,
    stakeholders,
    communicationElements: [
      'executive presentation',
      'all-employee communication',
      'manager results briefing',
      'team-level results sharing',
      'townhall or Q&A sessions'
    ]
  });

  // Phase 14: Action Planning
  const actionPlanning = await ctx.task('develop-action-plans', {
    insightsDevelopment,
    reportDevelopment,
    organizationContext,
    planningElements: [
      'organizational action items',
      'team-level action planning facilitation',
      'action plan templates',
      'accountability assignment',
      'timeline establishment'
    ]
  });

  // Phase 15: Follow-through and Monitoring
  const followThrough = await ctx.task('monitor-follow-through', {
    actionPlanning,
    monitoringElements: [
      'action plan tracking system',
      'progress check-ins',
      'pulse survey planning',
      'success story collection',
      'continuous listening strategy'
    ]
  });

  return {
    surveyInstrument: instrumentDesign,
    surveyResults: {
      administration: surveyAdministration,
      data: dataCollection,
      participation: surveyAdministration.participationRate
    },
    analysis: {
      quantitative: quantitativeAnalysis,
      qualitative: qualitativeAnalysis,
      insights: insightsDevelopment
    },
    reporting: reportDevelopment,
    actionPlanning: {
      plans: actionPlanning,
      monitoring: followThrough
    },
    metrics: {
      participationRate: surveyAdministration.participationRate,
      engagementScore: quantitativeAnalysis.overallScore,
      actionPlanCompletion: followThrough.completionRate
    }
  };
}

export const defineSurveyStrategy = defineTask('define-survey-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Survey Strategy',
  agent: {
    name: 'employee-experience-specialist',
    prompt: {
      role: 'Survey Strategy Expert',
      task: 'Define engagement survey strategy',
      context: args,
      instructions: [
        'Define survey objectives and goals',
        'Select measurement framework',
        'Determine survey cadence',
        'Establish confidentiality approach',
        'Define success metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        objectives: { type: 'array' },
        framework: { type: 'object' },
        cadence: { type: 'object' },
        confidentiality: { type: 'object' },
        successMetrics: { type: 'array' }
      },
      required: ['objectives', 'framework']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designSurveyInstrument = defineTask('design-survey-instrument', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Survey Instrument',
  agent: {
    name: 'survey-design-specialist',
    prompt: {
      role: 'Survey Instrument Designer',
      task: 'Design engagement survey instrument',
      context: args,
      instructions: [
        'Select and develop questions',
        'Design response scales',
        'Integrate benchmarks',
        'Create demographic questions',
        'Design open-ended questions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        questions: { type: 'array' },
        scales: { type: 'object' },
        benchmarks: { type: 'object' },
        demographics: { type: 'array' },
        openEnded: { type: 'array' }
      },
      required: ['questions', 'scales']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const configureSurveyPlatform = defineTask('configure-survey-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Survey Platform',
  agent: {
    name: 'survey-administrator',
    prompt: {
      role: 'Survey Platform Administrator',
      task: 'Configure survey platform for deployment',
      context: args,
      instructions: [
        'Set up survey platform',
        'Program survey questions',
        'Prepare distribution lists',
        'Configure reporting structure',
        'Set access permissions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        platformSetup: { type: 'object' },
        questionProgramming: { type: 'object' },
        distributionLists: { type: 'object' },
        reportingStructure: { type: 'object' },
        permissions: { type: 'object' }
      },
      required: ['platformSetup', 'distributionLists']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const planCommunications = defineTask('plan-communications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Communications',
  agent: {
    name: 'hr-communications-specialist',
    prompt: {
      role: 'Survey Communication Planner',
      task: 'Plan survey communications',
      context: args,
      instructions: [
        'Draft executive announcement',
        'Create manager toolkit and briefing',
        'Write employee launch communication',
        'Schedule reminders',
        'Plan participation tracking communication'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveAnnouncement: { type: 'object' },
        managerToolkit: { type: 'object' },
        employeeLaunch: { type: 'object' },
        reminderSchedule: { type: 'array' },
        trackingCommunication: { type: 'object' }
      },
      required: ['executiveAnnouncement', 'employeeLaunch']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const administerSurvey = defineTask('administer-survey', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Administer Survey',
  agent: {
    name: 'survey-administrator',
    prompt: {
      role: 'Survey Administration Manager',
      task: 'Administer engagement survey',
      context: args,
      instructions: [
        'Execute survey launch',
        'Monitor participation',
        'Deploy reminders',
        'Resolve issues',
        'Close survey'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        launchExecution: { type: 'object' },
        participationTracking: { type: 'object' },
        reminders: { type: 'array' },
        issuesResolved: { type: 'array' },
        closure: { type: 'object' },
        participationRate: { type: 'number' }
      },
      required: ['launchExecution', 'participationRate']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const collectValidateData = defineTask('collect-validate-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and Validate Data',
  agent: {
    name: 'survey-data-specialist',
    prompt: {
      role: 'Survey Data Specialist',
      task: 'Collect and validate survey data',
      context: args,
      instructions: [
        'Extract response data',
        'Validate data quality',
        'Handle incomplete responses',
        'Compile verbatim responses',
        'Integrate demographic data'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        responseData: { type: 'object' },
        dataQuality: { type: 'object' },
        incompleteHandling: { type: 'object' },
        verbatims: { type: 'array' },
        demographics: { type: 'object' }
      },
      required: ['responseData', 'dataQuality']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeQuantitativeData = defineTask('analyze-quantitative-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Quantitative Data',
  agent: {
    name: 'hr-data-analyst',
    prompt: {
      role: 'Quantitative Survey Analyst',
      task: 'Analyze quantitative survey data',
      context: args,
      instructions: [
        'Calculate overall engagement score',
        'Calculate dimension and item scores',
        'Analyze by demographic cuts',
        'Compare against benchmarks',
        'Analyze trends vs prior surveys'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallScore: { type: 'number' },
        dimensionScores: { type: 'object' },
        itemScores: { type: 'object' },
        demographicAnalysis: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        trendAnalysis: { type: 'object' }
      },
      required: ['overallScore', 'dimensionScores']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeQualitativeData = defineTask('analyze-qualitative-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Qualitative Data',
  agent: {
    name: 'qualitative-research-analyst',
    prompt: {
      role: 'Qualitative Survey Analyst',
      task: 'Analyze qualitative survey responses',
      context: args,
      instructions: [
        'Code verbatim themes',
        'Conduct sentiment analysis',
        'Identify key themes',
        'Select illustrative quotes',
        'Correlate verbatims with scores'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        themeCoding: { type: 'object' },
        sentimentAnalysis: { type: 'object' },
        keyThemes: { type: 'array' },
        illustrativeQuotes: { type: 'array' },
        verbatimCorrelation: { type: 'object' }
      },
      required: ['keyThemes', 'sentimentAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developInsights = defineTask('develop-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Insights',
  agent: {
    name: 'employee-experience-analyst',
    prompt: {
      role: 'Survey Insights Developer',
      task: 'Develop survey insights and recommendations',
      context: args,
      instructions: [
        'Synthesize key findings',
        'Identify organizational strengths',
        'Identify improvement opportunities',
        'Conduct driver analysis',
        'Develop priority recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        keyFindings: { type: 'array' },
        strengths: { type: 'array' },
        opportunities: { type: 'array' },
        driverAnalysis: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['keyFindings', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developReports = defineTask('develop-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Reports',
  agent: {
    name: 'survey-reporting-specialist',
    prompt: {
      role: 'Survey Report Developer',
      task: 'Develop survey reports and dashboards',
      context: args,
      instructions: [
        'Create executive summary report',
        'Develop detailed organizational report',
        'Generate manager team reports',
        'Create demographic group reports',
        'Build visualizations and dashboards'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'object' },
        organizationalReport: { type: 'object' },
        managerReports: { type: 'array' },
        demographicReports: { type: 'array' },
        dashboards: { type: 'object' }
      },
      required: ['executiveSummary', 'organizationalReport']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const communicateResults = defineTask('communicate-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Communicate Results',
  agent: {
    name: 'hr-communications-specialist',
    prompt: {
      role: 'Results Communication Specialist',
      task: 'Communicate survey results to stakeholders',
      context: args,
      instructions: [
        'Deliver executive presentation',
        'Send all-employee communication',
        'Conduct manager results briefing',
        'Facilitate team-level sharing',
        'Hold townhall or Q&A sessions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executivePresentation: { type: 'object' },
        employeeCommunication: { type: 'object' },
        managerBriefing: { type: 'object' },
        teamSharing: { type: 'object' },
        townhallSessions: { type: 'array' }
      },
      required: ['executivePresentation', 'employeeCommunication']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developActionPlans = defineTask('develop-action-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Action Plans',
  agent: {
    name: 'organizational-development-specialist',
    prompt: {
      role: 'Action Planning Facilitator',
      task: 'Develop and facilitate action planning',
      context: args,
      instructions: [
        'Define organizational action items',
        'Facilitate team-level action planning',
        'Provide action plan templates',
        'Assign accountability',
        'Establish timelines'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        organizationalActions: { type: 'array' },
        teamActionPlanning: { type: 'object' },
        templates: { type: 'object' },
        accountability: { type: 'object' },
        timelines: { type: 'array' }
      },
      required: ['organizationalActions', 'accountability']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const monitorFollowThrough = defineTask('monitor-follow-through', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor Follow-through',
  agent: {
    name: 'employee-experience-specialist',
    prompt: {
      role: 'Action Plan Monitoring Specialist',
      task: 'Monitor action plan follow-through',
      context: args,
      instructions: [
        'Implement action plan tracking',
        'Conduct progress check-ins',
        'Plan pulse surveys',
        'Collect success stories',
        'Define continuous listening strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        trackingSystem: { type: 'object' },
        progressCheckIns: { type: 'array' },
        pulseSurveyPlan: { type: 'object' },
        successStories: { type: 'array' },
        listeningStrategy: { type: 'object' },
        completionRate: { type: 'number' }
      },
      required: ['trackingSystem', 'completionRate']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
