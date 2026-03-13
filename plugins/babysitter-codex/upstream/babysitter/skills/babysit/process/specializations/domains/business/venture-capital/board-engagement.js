/**
 * @process venture-capital/board-engagement
 * @description Effective board participation including pre-meeting preparation, strategic guidance, executive session facilitation, and follow-up action tracking
 * @inputs { companyName: string, boardMeeting: object, companyData: object, priorMeetings: array }
 * @outputs { success: boolean, preMeetingPackage: object, meetingNotes: object, actionItems: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    boardMeeting = {},
    companyData = {},
    priorMeetings = [],
    outputDir = 'board-engagement-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Pre-Meeting Analysis
  ctx.log('info', 'Conducting pre-meeting analysis');
  const preMeetingAnalysis = await ctx.task(preMeetingAnalysisTask, {
    companyName,
    boardMeeting,
    companyData,
    priorMeetings,
    outputDir
  });

  if (!preMeetingAnalysis.success) {
    return {
      success: false,
      error: 'Pre-meeting analysis failed',
      details: preMeetingAnalysis,
      metadata: { processId: 'venture-capital/board-engagement', timestamp: startTime }
    };
  }

  artifacts.push(...preMeetingAnalysis.artifacts);

  // Task 2: Strategic Topics Preparation
  ctx.log('info', 'Preparing strategic discussion topics');
  const strategicTopics = await ctx.task(strategicTopicsTask, {
    companyName,
    companyData,
    boardMeeting,
    preMeetingAnalysis,
    outputDir
  });

  artifacts.push(...strategicTopics.artifacts);

  // Task 3: Questions and Concerns
  ctx.log('info', 'Developing questions and concerns');
  const questionsAndConcerns = await ctx.task(questionsTask, {
    companyName,
    companyData,
    preMeetingAnalysis,
    strategicTopics,
    outputDir
  });

  artifacts.push(...questionsAndConcerns.artifacts);

  // Task 4: Executive Session Planning
  ctx.log('info', 'Planning executive session');
  const executiveSession = await ctx.task(executiveSessionTask, {
    companyName,
    boardMeeting,
    companyData,
    preMeetingAnalysis,
    outputDir
  });

  artifacts.push(...executiveSession.artifacts);

  // Task 5: Generate Pre-Meeting Package
  ctx.log('info', 'Generating pre-meeting package');
  const preMeetingPackage = await ctx.task(preMeetingPackageTask, {
    companyName,
    boardMeeting,
    preMeetingAnalysis,
    strategicTopics,
    questionsAndConcerns,
    executiveSession,
    outputDir
  });

  artifacts.push(...preMeetingPackage.artifacts);

  // Breakpoint: Review pre-meeting preparation
  await ctx.breakpoint({
    question: `Pre-meeting package complete for ${companyName} board meeting. ${strategicTopics.topics.length} strategic topics, ${questionsAndConcerns.questions.length} questions. Review materials?`,
    title: 'Board Meeting Preparation',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        meetingDate: boardMeeting.date,
        strategicTopics: strategicTopics.topics.length,
        questions: questionsAndConcerns.questions.length,
        concerns: questionsAndConcerns.concerns.length,
        priorActionItems: preMeetingAnalysis.openActionItems.length
      }
    }
  });

  // Task 6: Meeting Notes Template
  ctx.log('info', 'Preparing meeting notes template');
  const meetingNotesTemplate = await ctx.task(meetingNotesTask, {
    companyName,
    boardMeeting,
    strategicTopics,
    questionsAndConcerns,
    outputDir
  });

  artifacts.push(...meetingNotesTemplate.artifacts);

  // Task 7: Action Item Tracking Setup
  ctx.log('info', 'Setting up action item tracking');
  const actionTracking = await ctx.task(actionTrackingTask, {
    companyName,
    priorMeetings,
    preMeetingAnalysis,
    outputDir
  });

  artifacts.push(...actionTracking.artifacts);

  // Task 8: Generate Board Engagement Report
  ctx.log('info', 'Generating board engagement report');
  const engagementReport = await ctx.task(engagementReportTask, {
    companyName,
    boardMeeting,
    preMeetingPackage,
    strategicTopics,
    executiveSession,
    actionTracking,
    outputDir
  });

  artifacts.push(...engagementReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    preMeetingPackage: {
      packagePath: preMeetingPackage.packagePath,
      keyTopics: strategicTopics.topics,
      questions: questionsAndConcerns.questions
    },
    meetingNotes: {
      templatePath: meetingNotesTemplate.templatePath,
      sections: meetingNotesTemplate.sections
    },
    executiveSessionPlan: executiveSession.plan,
    actionItems: {
      open: actionTracking.openItems,
      new: actionTracking.newItems,
      closed: actionTracking.closedItems
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/board-engagement',
      timestamp: startTime,
      companyName,
      meetingDate: boardMeeting.date
    }
  };
}

// Task 1: Pre-Meeting Analysis
export const preMeetingAnalysisTask = defineTask('pre-meeting-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct pre-meeting analysis',
  agent: {
    name: 'board-analyst',
    prompt: {
      role: 'VC board member',
      task: 'Analyze materials and prepare for board meeting',
      context: args,
      instructions: [
        'Review board package materials',
        'Analyze financial performance vs plan',
        'Review KPIs and operational metrics',
        'Identify key changes since last meeting',
        'Review status of prior action items',
        'Analyze competitive and market developments',
        'Identify areas requiring deeper discussion',
        'Prepare preliminary observations'
      ],
      outputFormat: 'JSON with analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'openActionItems', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: { type: 'object' },
        keyChanges: { type: 'array' },
        openActionItems: { type: 'array' },
        observations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'analysis']
}));

// Task 2: Strategic Topics Preparation
export const strategicTopicsTask = defineTask('strategic-topics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare strategic topics',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'VC strategic advisor',
      task: 'Prepare strategic discussion topics',
      context: args,
      instructions: [
        'Identify key strategic decisions needed',
        'Prepare discussion framing for each topic',
        'Develop options and trade-offs',
        'Identify data needed to support decisions',
        'Prepare recommendations or perspectives',
        'Consider timing and urgency',
        'Plan facilitation approach',
        'Document strategic context'
      ],
      outputFormat: 'JSON with strategic topics and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'discussionFrames', 'artifacts'],
      properties: {
        topics: { type: 'array' },
        discussionFrames: { type: 'array' },
        recommendations: { type: 'array' },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'strategy']
}));

// Task 3: Questions and Concerns
export const questionsTask = defineTask('questions-concerns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop questions and concerns',
  agent: {
    name: 'board-questioner',
    prompt: {
      role: 'VC board member',
      task: 'Develop questions and surface concerns',
      context: args,
      instructions: [
        'Identify questions for management',
        'Surface potential concerns or risks',
        'Prepare follow-up on prior commitments',
        'Develop probing questions on metrics',
        'Prepare competitive questions',
        'Identify areas needing clarification',
        'Prioritize questions by importance',
        'Plan questioning approach'
      ],
      outputFormat: 'JSON with questions, concerns, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'concerns', 'artifacts'],
      properties: {
        questions: { type: 'array' },
        concerns: { type: 'array' },
        followUps: { type: 'array' },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'questions']
}));

// Task 4: Executive Session Planning
export const executiveSessionTask = defineTask('executive-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan executive session',
  agent: {
    name: 'session-planner',
    prompt: {
      role: 'board governance specialist',
      task: 'Plan executive session agenda and topics',
      context: args,
      instructions: [
        'Identify executive session topics',
        'Prepare CEO feedback items',
        'Plan compensation discussions if needed',
        'Prepare governance matters',
        'Plan succession/talent discussions',
        'Identify sensitive topics',
        'Prepare facilitation approach',
        'Document session objectives'
      ],
      outputFormat: 'JSON with executive session plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'topics', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        topics: { type: 'array' },
        ceoFeedback: { type: 'array' },
        governanceMatters: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'executive-session']
}));

// Task 5: Pre-Meeting Package
export const preMeetingPackageTask = defineTask('pre-meeting-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate pre-meeting package',
  agent: {
    name: 'package-generator',
    prompt: {
      role: 'board meeting coordinator',
      task: 'Generate comprehensive pre-meeting package',
      context: args,
      instructions: [
        'Compile all preparation materials',
        'Create executive briefing document',
        'Include analysis summary',
        'Add strategic topics overview',
        'Include questions and concerns',
        'Add executive session agenda',
        'Include prior action items',
        'Format for board member review'
      ],
      outputFormat: 'JSON with package path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'contents', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        contents: { type: 'array' },
        executiveBrief: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'package']
}));

// Task 6: Meeting Notes Template
export const meetingNotesTask = defineTask('meeting-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare meeting notes template',
  agent: {
    name: 'notes-preparer',
    prompt: {
      role: 'board operations specialist',
      task: 'Prepare meeting notes template',
      context: args,
      instructions: [
        'Create structured notes template',
        'Include agenda sections',
        'Add decision tracking areas',
        'Include action item capture',
        'Add key discussion points',
        'Include executive session section',
        'Add follow-up tracking',
        'Format for efficient note-taking'
      ],
      outputFormat: 'JSON with template path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templatePath', 'sections', 'artifacts'],
      properties: {
        templatePath: { type: 'string' },
        sections: { type: 'array' },
        captureAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'notes']
}));

// Task 7: Action Item Tracking
export const actionTrackingTask = defineTask('action-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup action item tracking',
  agent: {
    name: 'action-tracker',
    prompt: {
      role: 'project management specialist',
      task: 'Setup and maintain action item tracking',
      context: args,
      instructions: [
        'Review all prior action items',
        'Update status on each item',
        'Identify completed items',
        'Flag overdue items',
        'Prepare new action items list',
        'Assign owners and due dates',
        'Create tracking dashboard',
        'Setup follow-up reminders'
      ],
      outputFormat: 'JSON with action tracking and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['openItems', 'closedItems', 'artifacts'],
      properties: {
        openItems: { type: 'array' },
        closedItems: { type: 'array' },
        newItems: { type: 'array' },
        overdueItems: { type: 'array' },
        trackingDashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'action-items']
}));

// Task 8: Board Engagement Report
export const engagementReportTask = defineTask('engagement-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate engagement report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'board operations manager',
      task: 'Generate board engagement report',
      context: args,
      instructions: [
        'Create comprehensive engagement summary',
        'Document preparation completed',
        'Include strategic topics covered',
        'Document decisions made',
        'Include action items assigned',
        'Add executive session summary',
        'Include follow-up plan',
        'Format for internal documentation'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        decisions: { type: 'array' },
        followUpPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'board', 'reporting']
}));
