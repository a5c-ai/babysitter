/**
 * @process customer-experience/problem-management
 * @description Process for identifying root causes of recurring incidents and implementing permanent fixes to prevent future occurrences
 * @inputs { incidents: array, problemData: object, knownErrors: array, changeManagement: object }
 * @outputs { success: boolean, problemRecord: object, rootCauseAnalysis: object, permanentFix: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incidents = [],
    problemData = {},
    knownErrors = [],
    changeManagement = {},
    outputDir = 'problem-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Problem Management Process for problem: ${problemData.id || 'new'}`);

  // ============================================================================
  // PHASE 1: PROBLEM DETECTION AND LOGGING
  // ============================================================================

  ctx.log('info', 'Phase 1: Detecting and logging problem');
  const problemLogging = await ctx.task(problemLoggingTask, {
    incidents,
    problemData,
    outputDir
  });

  artifacts.push(...problemLogging.artifacts);

  // ============================================================================
  // PHASE 2: PROBLEM CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Categorizing problem');
  const problemCategorization = await ctx.task(problemCategorizationTask, {
    problemLogging,
    incidents,
    outputDir
  });

  artifacts.push(...problemCategorization.artifacts);

  // ============================================================================
  // PHASE 3: PROBLEM INVESTIGATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Investigating problem');
  const problemInvestigation = await ctx.task(problemInvestigationTask, {
    problemLogging,
    problemCategorization,
    incidents,
    knownErrors,
    outputDir
  });

  artifacts.push(...problemInvestigation.artifacts);

  // ============================================================================
  // PHASE 4: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Performing root cause analysis');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    problemInvestigation,
    incidents,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: WORKAROUND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Documenting workarounds');
  const workaroundDocumentation = await ctx.task(workaroundDocumentationTask, {
    rootCauseAnalysis,
    problemInvestigation,
    knownErrors,
    outputDir
  });

  artifacts.push(...workaroundDocumentation.artifacts);

  // ============================================================================
  // PHASE 6: PERMANENT FIX PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning permanent fix');
  const permanentFixPlanning = await ctx.task(permanentFixPlanningTask, {
    rootCauseAnalysis,
    workaroundDocumentation,
    changeManagement,
    outputDir
  });

  artifacts.push(...permanentFixPlanning.artifacts);

  // ============================================================================
  // PHASE 7: CHANGE REQUEST PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing change request');
  const changeRequestPreparation = await ctx.task(changeRequestPreparationTask, {
    permanentFixPlanning,
    rootCauseAnalysis,
    changeManagement,
    outputDir
  });

  artifacts.push(...changeRequestPreparation.artifacts);

  // ============================================================================
  // PHASE 8: PROBLEM CLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Preparing problem closure');
  const problemClosure = await ctx.task(problemClosureTask, {
    problemLogging,
    rootCauseAnalysis,
    permanentFixPlanning,
    workaroundDocumentation,
    changeRequestPreparation,
    outputDir
  });

  artifacts.push(...problemClosure.artifacts);

  const rootCauseIdentified = rootCauseAnalysis.rootCauseIdentified;
  const permanentFixPlanned = permanentFixPlanning.fixPlanned;

  await ctx.breakpoint({
    question: `Problem management complete for ${problemData.id || 'problem'}. Root cause identified: ${rootCauseIdentified ? 'Yes' : 'No'}. Permanent fix planned: ${permanentFixPlanned ? 'Yes' : 'No'}. Related incidents: ${incidents.length}. Review and close?`,
    title: 'Problem Management Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problemId: problemLogging.problemId,
        category: problemCategorization.category,
        rootCauseIdentified,
        permanentFixPlanned,
        relatedIncidents: incidents.length,
        workaroundAvailable: workaroundDocumentation.workaroundAvailable,
        changeRequestCreated: changeRequestPreparation.changeRequestCreated
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    rootCauseIdentified,
    permanentFixPlanned,
    problemRecord: {
      id: problemLogging.problemId,
      category: problemCategorization.category,
      priority: problemCategorization.priority,
      relatedIncidents: incidents.length
    },
    rootCauseAnalysis: {
      rootCause: rootCauseAnalysis.rootCause,
      methodology: rootCauseAnalysis.methodology,
      contributingFactors: rootCauseAnalysis.contributingFactors
    },
    workaround: {
      available: workaroundDocumentation.workaroundAvailable,
      description: workaroundDocumentation.workaround,
      knownError: workaroundDocumentation.knownError
    },
    permanentFix: {
      planned: permanentFixPlanning.fixPlanned,
      solution: permanentFixPlanning.solution,
      timeline: permanentFixPlanning.timeline,
      changeRequest: changeRequestPreparation.changeRequest
    },
    closure: {
      status: problemClosure.status,
      closureDate: problemClosure.closureDate,
      lessonsLearned: problemClosure.lessonsLearned
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/problem-management',
      timestamp: startTime,
      problemId: problemLogging.problemId,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemLoggingTask = defineTask('problem-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect and log problem',
  agent: {
    name: 'problem-logger',
    prompt: {
      role: 'ITIL problem management specialist',
      task: 'Log problem record with complete details',
      context: args,
      instructions: [
        'Generate unique problem ID',
        'Link related incidents',
        'Document problem description',
        'Record problem source',
        'Identify affected services',
        'Document business impact',
        'Record initial assessment',
        'Assign problem owner',
        'Generate problem logging record'
      ],
      outputFormat: 'JSON with problemId, relatedIncidents, description, source, affectedServices, businessImpact, owner, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['problemId', 'relatedIncidents', 'artifacts'],
      properties: {
        problemId: { type: 'string' },
        relatedIncidents: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
        source: { type: 'string' },
        affectedServices: { type: 'array', items: { type: 'object' } },
        businessImpact: { type: 'object' },
        owner: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'logging']
}));

export const problemCategorizationTask = defineTask('problem-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize problem',
  agent: {
    name: 'problem-categorizer',
    prompt: {
      role: 'problem categorization specialist',
      task: 'Categorize and prioritize problem',
      context: args,
      instructions: [
        'Assign problem category',
        'Assign subcategory',
        'Assess impact and urgency',
        'Calculate priority',
        'Identify affected configuration items',
        'Assess business criticality',
        'Set investigation priority',
        'Document categorization rationale',
        'Generate categorization record'
      ],
      outputFormat: 'JSON with category, subcategory, impact, urgency, priority, configItems, criticality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'priority', 'artifacts'],
      properties: {
        category: { type: 'string' },
        subcategory: { type: 'string' },
        impact: { type: 'string' },
        urgency: { type: 'string' },
        priority: { type: 'string' },
        configItems: { type: 'array', items: { type: 'object' } },
        criticality: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'categorization']
}));

export const problemInvestigationTask = defineTask('problem-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Investigate problem',
  agent: {
    name: 'problem-investigator',
    prompt: {
      role: 'technical investigation specialist',
      task: 'Investigate problem to gather evidence and identify patterns',
      context: args,
      instructions: [
        'Review all related incidents',
        'Identify common patterns',
        'Gather technical evidence',
        'Analyze logs and metrics',
        'Review configuration changes',
        'Check for known errors',
        'Interview stakeholders',
        'Document investigation findings',
        'Generate investigation report'
      ],
      outputFormat: 'JSON with findings, patterns, evidence, changes, knownErrorMatch, stakeholderInput, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'patterns', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        evidence: { type: 'array', items: { type: 'object' } },
        changes: { type: 'array', items: { type: 'object' } },
        knownErrorMatch: { type: 'object' },
        stakeholderInput: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'investigation']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform root cause analysis',
  agent: {
    name: 'rca-specialist',
    prompt: {
      role: 'root cause analysis specialist',
      task: 'Perform comprehensive root cause analysis',
      context: args,
      instructions: [
        'Apply 5-whys analysis',
        'Use fishbone diagram methodology',
        'Apply fault tree analysis if needed',
        'Identify root cause',
        'Identify contributing factors',
        'Validate root cause hypothesis',
        'Document analysis methodology',
        'Create RCA documentation',
        'Generate RCA report'
      ],
      outputFormat: 'JSON with rootCause, rootCauseIdentified, methodology, contributingFactors, validation, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauseIdentified', 'methodology', 'artifacts'],
      properties: {
        rootCause: { type: 'string' },
        rootCauseIdentified: { type: 'boolean' },
        methodology: { type: 'string' },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        validation: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'rca']
}));

export const workaroundDocumentationTask = defineTask('workaround-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document workarounds',
  agent: {
    name: 'workaround-documenter',
    prompt: {
      role: 'known error management specialist',
      task: 'Document workarounds and create known error records',
      context: args,
      instructions: [
        'Identify available workarounds',
        'Document workaround steps',
        'Assess workaround effectiveness',
        'Document workaround limitations',
        'Create known error record',
        'Link to related incidents',
        'Publish to knowledge base',
        'Notify support teams',
        'Generate workaround documentation'
      ],
      outputFormat: 'JSON with workaroundAvailable, workaround, effectiveness, limitations, knownError, kbArticle, notifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workaroundAvailable', 'artifacts'],
      properties: {
        workaroundAvailable: { type: 'boolean' },
        workaround: { type: 'object' },
        effectiveness: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        knownError: { type: 'object' },
        kbArticle: { type: 'object' },
        notifications: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'workaround']
}));

export const permanentFixPlanningTask = defineTask('permanent-fix-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan permanent fix',
  agent: {
    name: 'fix-planner',
    prompt: {
      role: 'solution architect',
      task: 'Plan permanent fix for root cause',
      context: args,
      instructions: [
        'Design permanent solution',
        'Assess fix complexity',
        'Estimate implementation effort',
        'Identify required resources',
        'Assess implementation risks',
        'Plan implementation timeline',
        'Define success criteria',
        'Plan verification testing',
        'Generate fix planning documentation'
      ],
      outputFormat: 'JSON with fixPlanned, solution, complexity, effort, resources, risks, timeline, successCriteria, verification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fixPlanned', 'artifacts'],
      properties: {
        fixPlanned: { type: 'boolean' },
        solution: { type: 'object' },
        complexity: { type: 'string' },
        effort: { type: 'string' },
        resources: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        verification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'fix-planning']
}));

export const changeRequestPreparationTask = defineTask('change-request-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare change request',
  agent: {
    name: 'change-preparer',
    prompt: {
      role: 'change management liaison',
      task: 'Prepare change request for permanent fix implementation',
      context: args,
      instructions: [
        'Create change request',
        'Document change justification',
        'Define change scope',
        'Assess change risk',
        'Plan rollback procedure',
        'Identify stakeholders',
        'Plan communication',
        'Schedule CAB review',
        'Generate change request package'
      ],
      outputFormat: 'JSON with changeRequestCreated, changeRequest, justification, scope, risk, rollback, stakeholders, cabSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changeRequestCreated', 'artifacts'],
      properties: {
        changeRequestCreated: { type: 'boolean' },
        changeRequest: { type: 'object' },
        justification: { type: 'string' },
        scope: { type: 'object' },
        risk: { type: 'object' },
        rollback: { type: 'object' },
        stakeholders: { type: 'array', items: { type: 'object' } },
        cabSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'change-request']
}));

export const problemClosureTask = defineTask('problem-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare problem closure',
  agent: {
    name: 'closure-specialist',
    prompt: {
      role: 'problem closure specialist',
      task: 'Prepare and execute problem closure',
      context: args,
      instructions: [
        'Verify root cause addressed',
        'Confirm permanent fix effective',
        'Update related incidents',
        'Close known error if applicable',
        'Document lessons learned',
        'Archive problem documentation',
        'Send closure notifications',
        'Update metrics',
        'Generate closure record'
      ],
      outputFormat: 'JSON with status, closureDate, verification, lessonsLearned, notifications, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['closed-resolved', 'closed-workaround', 'closed-no-fix'] },
        closureDate: { type: 'string' },
        verification: { type: 'object' },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        notifications: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-management', 'closure']
}));
