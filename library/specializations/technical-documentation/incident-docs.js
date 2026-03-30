/**
 * @process technical-documentation/incident-docs
 * @description Incident Response and Post-Mortem Documentation process with incident analysis, timeline reconstruction, root cause analysis, impact assessment, and action items generation
 * @inputs { incidentId: string, incidentTitle: string, severity: string, startTime: string, endTime: string, outputDir: string, includeTimeline: boolean, includeBlameless: boolean, requireReview: boolean }
 * @outputs { success: boolean, postMortemPath: string, incidentId: string, rootCauses: array, actionItems: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incidentId = '',
    incidentTitle = '',
    severity = 'medium', // low, medium, high, critical
    startTime = null,
    endTime = null,
    outputDir = 'incident-docs-output',
    includeTimeline = true,
    includeBlameless = true,
    requireReview = true,
    affectedServices = [],
    detectionMethod = '',
    responders = [],
    impactMetrics = {},
    existingData = null
  } = inputs;

  const startProcessTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Incident Response and Post-Mortem Documentation Process');

  // ============================================================================
  // PHASE 1: INCIDENT DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and validating incident data');
  const dataCollection = await ctx.task(incidentDataCollectionTask, {
    incidentId,
    incidentTitle,
    severity,
    startTime,
    endTime,
    affectedServices,
    detectionMethod,
    responders,
    impactMetrics,
    existingData,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 2: INCIDENT TIMELINE RECONSTRUCTION
  // ============================================================================

  let timeline = null;
  if (includeTimeline) {
    ctx.log('info', 'Phase 2: Reconstructing incident timeline');
    timeline = await ctx.task(timelineReconstructionTask, {
      incidentId,
      incidentData: dataCollection.incidentData,
      startTime,
      endTime,
      affectedServices,
      outputDir
    });

    artifacts.push(...timeline.artifacts);
  }

  // ============================================================================
  // PHASE 3: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing incident impact');
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    incidentId,
    severity,
    incidentData: dataCollection.incidentData,
    timeline: timeline ? timeline.events : [],
    affectedServices,
    impactMetrics,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // ============================================================================
  // PHASE 4: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting root cause analysis');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    incidentId,
    incidentData: dataCollection.incidentData,
    timeline: timeline ? timeline.events : [],
    impactAssessment: impactAssessment.assessment,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CONTRIBUTING FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying contributing factors');
  const contributingFactors = await ctx.task(contributingFactorsTask, {
    incidentId,
    incidentData: dataCollection.incidentData,
    rootCauses: rootCauseAnalysis.rootCauses,
    timeline: timeline ? timeline.events : [],
    outputDir
  });

  artifacts.push(...contributingFactors.artifacts);

  // ============================================================================
  // PHASE 6: RESPONSE EFFECTIVENESS EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating response effectiveness');
  const responseEvaluation = await ctx.task(responseEvaluationTask, {
    incidentId,
    incidentData: dataCollection.incidentData,
    timeline: timeline ? timeline.events : [],
    responders,
    detectionMethod,
    outputDir
  });

  artifacts.push(...responseEvaluation.artifacts);

  // ============================================================================
  // PHASE 7: ACTION ITEMS AND REMEDIATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating action items and remediation plan');
  const actionItems = await ctx.task(actionItemsGenerationTask, {
    incidentId,
    rootCauses: rootCauseAnalysis.rootCauses,
    contributingFactors: contributingFactors.factors,
    responseEvaluation: responseEvaluation.evaluation,
    impactAssessment: impactAssessment.assessment,
    outputDir
  });

  artifacts.push(...actionItems.artifacts);

  // Breakpoint: Review action items
  await ctx.breakpoint({
    question: `Action items generated for incident ${incidentId}. Found ${actionItems.actionItems.length} action items (${actionItems.criticalCount} critical). Review action items and priorities?`,
    title: 'Action Items Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        incidentId,
        severity,
        rootCausesFound: rootCauseAnalysis.rootCauses.length,
        actionItemsTotal: actionItems.actionItems.length,
        criticalActions: actionItems.criticalCount,
        highPriorityActions: actionItems.highPriorityCount
      }
    }
  });

  // ============================================================================
  // PHASE 8: LESSONS LEARNED DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting lessons learned');
  const lessonsLearned = await ctx.task(lessonsLearnedTask, {
    incidentId,
    incidentData: dataCollection.incidentData,
    rootCauses: rootCauseAnalysis.rootCauses,
    contributingFactors: contributingFactors.factors,
    responseEvaluation: responseEvaluation.evaluation,
    actionItems: actionItems.actionItems,
    outputDir
  });

  artifacts.push(...lessonsLearned.artifacts);

  // ============================================================================
  // PHASE 9: BLAMELESS POST-MORTEM ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 9: Assembling blameless post-mortem document');
  const postMortemAssembly = await ctx.task(postMortemAssemblyTask, {
    incidentId,
    incidentTitle,
    severity,
    incidentData: dataCollection.incidentData,
    timeline: timeline ? timeline.events : [],
    impactAssessment: impactAssessment.assessment,
    rootCauses: rootCauseAnalysis.rootCauses,
    contributingFactors: contributingFactors.factors,
    responseEvaluation: responseEvaluation.evaluation,
    actionItems: actionItems.actionItems,
    lessonsLearned: lessonsLearned.lessons,
    includeBlameless,
    outputDir
  });

  artifacts.push(...postMortemAssembly.artifacts);

  // Breakpoint: Review assembled post-mortem
  await ctx.breakpoint({
    question: `Post-mortem document for incident ${incidentId} assembled. Document has ${postMortemAssembly.sections.length} sections. Review post-mortem structure and content?`,
    title: 'Post-Mortem Assembly Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        incidentId,
        incidentTitle,
        severity,
        sectionsIncluded: postMortemAssembly.sections.length,
        totalPages: postMortemAssembly.estimatedPages,
        actionItemsCount: actionItems.actionItems.length,
        rootCausesCount: rootCauseAnalysis.rootCauses.length
      }
    }
  });

  // ============================================================================
  // PHASE 10: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating post-mortem quality and completeness');
  const qualityValidation = await ctx.task(postMortemQualityValidationTask, {
    incidentId,
    postMortemDocument: postMortemAssembly.postMortemDocument,
    sections: postMortemAssembly.sections,
    rootCauses: rootCauseAnalysis.rootCauses,
    actionItems: actionItems.actionItems,
    includeBlameless,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 80;

  // ============================================================================
  // PHASE 11: TEAM REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireReview && responders.length > 0) {
    ctx.log('info', 'Phase 11: Conducting team review');
    reviewResult = await ctx.task(postMortemReviewTask, {
      incidentId,
      postMortemDocument: postMortemAssembly.postMortemDocument,
      responders,
      qualityScore: qualityValidation.overallScore,
      includeBlameless,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Review approval gate
    await ctx.breakpoint({
      question: `Post-mortem review complete. ${reviewResult.approved ? 'Approved by team!' : 'Requires revisions.'} Finalize and publish?`,
      title: 'Post-Mortem Review Approval',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          reviewersCount: reviewResult.reviewers.length,
          feedbackItems: reviewResult.feedback.length,
          blamelessViolations: reviewResult.blamelessViolations || 0
        }
      }
    });
  }

  // ============================================================================
  // PHASE 12: FINALIZE AND PUBLISH POST-MORTEM
  // ============================================================================

  ctx.log('info', 'Phase 12: Finalizing and publishing post-mortem');
  const publishResult = await ctx.task(postMortemPublishingTask, {
    incidentId,
    incidentTitle,
    postMortemDocument: postMortemAssembly.postMortemDocument,
    severity,
    qualityScore: qualityValidation.overallScore,
    actionItems: actionItems.actionItems,
    outputDir
  });

  artifacts.push(...publishResult.artifacts);

  // ============================================================================
  // PHASE 13: ACTION ITEMS TRACKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up action items tracking');
  const trackingSetup = await ctx.task(actionItemsTrackingTask, {
    incidentId,
    actionItems: actionItems.actionItems,
    responders,
    postMortemPath: publishResult.publishedPath,
    outputDir
  });

  artifacts.push(...trackingSetup.artifacts);

  const endProcessTime = ctx.now();
  const duration = endProcessTime - startProcessTime;

  return {
    success: true,
    incidentId,
    incidentTitle,
    severity,
    postMortemPath: publishResult.publishedPath,
    timeline: timeline ? {
      events: timeline.events.length,
      duration: timeline.incidentDuration
    } : null,
    impact: {
      usersAffected: impactAssessment.assessment.usersAffected,
      downtime: impactAssessment.assessment.downtime,
      financialImpact: impactAssessment.assessment.financialImpact
    },
    rootCauses: rootCauseAnalysis.rootCauses.map(rc => rc.description),
    contributingFactors: contributingFactors.factors.length,
    actionItems: {
      total: actionItems.actionItems.length,
      critical: actionItems.criticalCount,
      highPriority: actionItems.highPriorityCount,
      trackingSystem: trackingSetup.trackingSystem
    },
    qualityScore: qualityValidation.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    responseMetrics: {
      detectionTime: responseEvaluation.evaluation.detectionTime,
      responseTime: responseEvaluation.evaluation.responseTime,
      resolutionTime: responseEvaluation.evaluation.resolutionTime,
      effectiveness: responseEvaluation.evaluation.effectiveness
    },
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/incident-docs',
      timestamp: startProcessTime,
      outputDir,
      includedSections: postMortemAssembly.sections
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Incident Data Collection
export const incidentDataCollectionTask = defineTask('incident-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and validate incident data',
  agent: {
    name: 'incident-coordinator',
    prompt: {
      role: 'incident coordinator and data analyst',
      task: 'Gather comprehensive incident data from all available sources',
      context: args,
      instructions: [
        'Collect basic incident information:',
        '  - Incident ID and title',
        '  - Severity level and classification',
        '  - Start time and end time (or ongoing)',
        '  - Detection method (alert, user report, monitoring)',
        'Gather affected services and systems:',
        '  - Primary affected services',
        '  - Downstream affected services',
        '  - Infrastructure components involved',
        'Collect responder information:',
        '  - On-call engineers who responded',
        '  - Incident commander',
        '  - Additional responders and SMEs',
        'Gather logs and data sources:',
        '  - Application logs',
        '  - System metrics and dashboards',
        '  - Alert history',
        '  - Communication channels (Slack, incidents.io, PagerDuty)',
        'Document initial impact estimates:',
        '  - User impact (number affected, customer complaints)',
        '  - Service degradation metrics',
        '  - Financial impact estimates',
        'Validate data completeness',
        'Identify missing data and plan to gather it',
        'Save incident data collection to output directory'
      ],
      outputFormat: 'JSON with incidentData (object), dataSources (array), dataCompleteness (object), missingData (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentData', 'dataSources', 'artifacts'],
      properties: {
        incidentData: {
          type: 'object',
          properties: {
            incidentId: { type: 'string' },
            title: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            duration: { type: 'string' },
            detectionMethod: { type: 'string' },
            affectedServices: { type: 'array', items: { type: 'string' } },
            responders: { type: 'array', items: { type: 'string' } },
            incidentCommander: { type: 'string' }
          }
        },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              dataPoints: { type: 'number' },
              reliability: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        dataCompleteness: {
          type: 'object',
          properties: {
            overallCompleteness: { type: 'number', minimum: 0, maximum: 100 },
            hasBasicInfo: { type: 'boolean' },
            hasTimeline: { type: 'boolean' },
            hasLogs: { type: 'boolean' },
            hasMetrics: { type: 'boolean' },
            hasImpactData: { type: 'boolean' }
          }
        },
        missingData: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'data-collection', 'sre']
}));

// Task 2: Timeline Reconstruction
export const timelineReconstructionTask = defineTask('timeline-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct incident timeline',
  agent: {
    name: 'forensic-analyst',
    prompt: {
      role: 'forensic analyst and incident investigator',
      task: 'Reconstruct detailed timeline of incident from detection to resolution',
      context: args,
      instructions: [
        'Create chronological timeline of incident events',
        'Include key timeline entries:',
        '  - Initial trigger or root cause event',
        '  - First signs of degradation (before detection)',
        '  - Detection time (first alert or report)',
        '  - Response initiation (first responder action)',
        '  - Escalation points',
        '  - Investigation milestones',
        '  - Mitigation attempts (successful and failed)',
        '  - Service restoration',
        '  - Full resolution and post-incident verification',
        'For each event, document:',
        '  - Timestamp (precise time)',
        '  - Event description',
        '  - Actor (person, system, or automation)',
        '  - Action taken or observation',
        '  - Result or outcome',
        '  - Data source reference',
        'Identify critical decision points',
        'Calculate key time intervals:',
        '  - Time to detect (trigger to detection)',
        '  - Time to respond (detection to first action)',
        '  - Time to mitigate (response to impact reduced)',
        '  - Time to resolve (response to full resolution)',
        'Create visual timeline diagram',
        'Save timeline to output directory'
      ],
      outputFormat: 'JSON with events (array of timeline entries), keyIntervals (object), criticalDecisions (array), incidentDuration (string), timelineDiagram (description), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['events', 'keyIntervals', 'incidentDuration', 'artifacts'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              description: { type: 'string' },
              actor: { type: 'string' },
              action: { type: 'string' },
              outcome: { type: 'string' },
              eventType: { type: 'string', enum: ['trigger', 'detection', 'response', 'escalation', 'mitigation', 'resolution'] },
              dataSource: { type: 'string' }
            }
          }
        },
        keyIntervals: {
          type: 'object',
          properties: {
            timeToDetect: { type: 'string' },
            timeToRespond: { type: 'string' },
            timeToMitigate: { type: 'string' },
            timeToResolve: { type: 'string' }
          }
        },
        criticalDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              decision: { type: 'string' },
              decider: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        incidentDuration: { type: 'string' },
        timelineDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'timeline', 'forensics']
}));

// Task 3: Impact Assessment
export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess incident impact',
  agent: {
    name: 'impact-analyst',
    prompt: {
      role: 'business impact analyst and SRE',
      task: 'Assess comprehensive impact of the incident on users, business, and systems',
      context: args,
      instructions: [
        'Quantify user impact:',
        '  - Total users affected (number and percentage)',
        '  - User segments impacted (free, paid, enterprise)',
        '  - Geographic distribution of impact',
        '  - User-reported issues and support tickets',
        '  - Customer complaints and social media mentions',
        'Measure service impact:',
        '  - Service availability (SLA breach calculation)',
        '  - Performance degradation metrics',
        '  - Error rates and failed requests',
        '  - Affected API endpoints or features',
        '  - Downstream service impact',
        'Calculate business impact:',
        '  - Revenue loss or impact',
        '  - SLA credit exposure',
        '  - Customer churn risk',
        '  - Reputation impact',
        '  - Opportunity cost',
        'Assess technical impact:',
        '  - Data loss or corruption (if any)',
        '  - Infrastructure damage or degradation',
        '  - Technical debt created',
        'Document impact severity justification',
        'Compare impact to previous incidents',
        'Save impact assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (object with user, service, business, technical impacts), severityJustification (string), comparisonToPrevious (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'severityJustification', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            usersAffected: { type: 'number' },
            usersAffectedPercentage: { type: 'number' },
            downtime: { type: 'string' },
            availability: { type: 'number' },
            errorRate: { type: 'number' },
            slaBreached: { type: 'boolean' },
            slaBreachPercentage: { type: 'number' },
            financialImpact: { type: 'string' },
            revenueImpact: { type: 'string' },
            customerComplaints: { type: 'number' },
            supportTickets: { type: 'number' },
            dataLoss: { type: 'boolean' },
            reputationImpact: { type: 'string', enum: ['none', 'low', 'medium', 'high'] }
          }
        },
        severityJustification: { type: 'string' },
        impactByService: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              impactLevel: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
              description: { type: 'string' }
            }
          }
        },
        comparisonToPrevious: {
          type: 'object',
          properties: {
            similarIncidents: { type: 'number' },
            relativeSeverity: { type: 'string', enum: ['less-severe', 'similar', 'more-severe'] },
            impactTrend: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'impact-assessment', 'business-analysis']
}));

// Task 4: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct root cause analysis',
  agent: {
    name: 'root-cause-investigator',
    prompt: {
      role: 'senior SRE and root cause analysis expert',
      task: 'Identify root causes using systematic investigation techniques (5 Whys, Fishbone, etc.)',
      context: args,
      instructions: [
        'Apply 5 Whys technique to identify root cause:',
        '  - Start with incident symptom',
        '  - Ask "Why did this happen?" iteratively',
        '  - Continue until reaching fundamental cause',
        '  - Document each layer of "why"',
        'Use Fishbone (Ishikawa) analysis for complex incidents:',
        '  - Categories: People, Process, Technology, Environment',
        '  - Identify contributing factors in each category',
        'Distinguish between:',
        '  - Immediate cause (proximate trigger)',
        '  - Root cause (fundamental issue)',
        '  - Contributing factors (made incident possible/worse)',
        'For each root cause, document:',
        '  - Clear description',
        '  - Evidence supporting this as root cause',
        '  - How it led to the incident',
        '  - Why it existed (deeper analysis)',
        '  - Similar past incidents from same root cause',
        'Validate root cause with evidence:',
        '  - Log entries',
        '  - Metrics and graphs',
        '  - Configuration changes',
        '  - Code changes or deployments',
        'Avoid blaming individuals (focus on systems and processes)',
        'Identify systemic issues vs. one-time failures',
        'Save root cause analysis to output directory'
      ],
      outputFormat: 'JSON with rootCauses (array), immediateCause (object), fiveWhysAnalysis (array), fishboneCategories (object), evidence (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'immediateCause', 'artifacts'],
      properties: {
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['people', 'process', 'technology', 'environment'] },
              evidence: { type: 'array', items: { type: 'string' } },
              howItLedToIncident: { type: 'string' },
              whyItExisted: { type: 'string' },
              systemic: { type: 'boolean' },
              similarPastIncidents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        immediateCause: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            trigger: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        fiveWhysAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        fishboneCategories: {
          type: 'object',
          properties: {
            people: { type: 'array', items: { type: 'string' } },
            process: { type: 'array', items: { type: 'string' } },
            technology: { type: 'array', items: { type: 'string' } },
            environment: { type: 'array', items: { type: 'string' } }
          }
        },
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'root-cause-analysis', 'sre']
}));

// Task 5: Contributing Factors Analysis
export const contributingFactorsTask = defineTask('contributing-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify contributing factors',
  agent: {
    name: 'systems-analyst',
    prompt: {
      role: 'systems analyst and reliability engineer',
      task: 'Identify contributing factors that enabled or worsened the incident',
      context: args,
      instructions: [
        'Identify factors that made incident possible:',
        '  - Missing safeguards or protections',
        '  - Insufficient monitoring or alerting',
        '  - Lack of redundancy or failover',
        '  - Configuration weaknesses',
        '  - Architecture limitations',
        'Identify factors that worsened incident:',
        '  - Delayed detection',
        '  - Slow response or escalation',
        '  - Missing or outdated runbooks',
        '  - Inadequate testing or validation',
        '  - Communication breakdowns',
        'Categorize contributing factors:',
        '  - Technical factors (code, infrastructure, architecture)',
        '  - Process factors (procedures, workflows, policies)',
        '  - People factors (training, knowledge, staffing)',
        '  - Organizational factors (culture, priorities, resources)',
        'For each factor, document:',
        '  - Description of the factor',
        '  - How it contributed to incident',
        '  - Severity of contribution (major, moderate, minor)',
        '  - Existing vs. new issue',
        '  - Preventability assessment',
        'Identify latent conditions (hidden weaknesses exposed by incident)',
        'Distinguish between active failures and latent conditions',
        'Save contributing factors analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array), latentConditions (array), categorization (object), preventability (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'categorization', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'process', 'people', 'organizational'] },
              contribution: { type: 'string', enum: ['enabled-incident', 'worsened-incident', 'delayed-resolution'] },
              severity: { type: 'string', enum: ['major', 'moderate', 'minor'] },
              preventable: { type: 'boolean' },
              existingIssue: { type: 'boolean' }
            }
          }
        },
        latentConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              hiddenUntil: { type: 'string' },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        categorization: {
          type: 'object',
          properties: {
            technical: { type: 'number' },
            process: { type: 'number' },
            people: { type: 'number' },
            organizational: { type: 'number' }
          }
        },
        preventability: {
          type: 'object',
          properties: {
            preventable: { type: 'number' },
            unpreventable: { type: 'number' },
            partiallyPreventable: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'contributing-factors', 'systems-analysis']
}));

// Task 6: Response Effectiveness Evaluation
export const responseEvaluationTask = defineTask('response-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate response effectiveness',
  agent: {
    name: 'incident-reviewer',
    prompt: {
      role: 'incident management specialist and SRE lead',
      task: 'Evaluate effectiveness of incident detection, response, and resolution',
      context: args,
      instructions: [
        'Evaluate detection effectiveness:',
        '  - Was incident detected proactively or reactively?',
        '  - How quickly was incident detected after it started?',
        '  - Did monitoring and alerts work as expected?',
        '  - Were there missed early warning signs?',
        'Evaluate response effectiveness:',
        '  - Was on-call escalation timely and appropriate?',
        '  - Was incident commander assigned quickly?',
        '  - Did team have right expertise and access?',
        '  - Was communication clear and effective?',
        '  - Were runbooks helpful and up-to-date?',
        'Evaluate resolution effectiveness:',
        '  - Were troubleshooting steps efficient?',
        '  - Were there false starts or wasted efforts?',
        '  - Was mitigation approach optimal?',
        '  - Could resolution have been faster?',
        '  - Was rollback needed? Did it work?',
        'Identify what went well:',
        '  - Effective actions and decisions',
        '  - Helpful tools and processes',
        '  - Good teamwork and communication',
        'Identify what could be improved:',
        '  - Delays and bottlenecks',
        '  - Missing tools or information',
        '  - Process gaps',
        '  - Training needs',
        'Calculate response time metrics',
        'Assess overall response effectiveness (poor, fair, good, excellent)',
        'Save response evaluation to output directory'
      ],
      outputFormat: 'JSON with evaluation (object), whatWentWell (array), whatCouldImprove (array), responseMetrics (object), effectiveness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluation', 'whatWentWell', 'whatCouldImprove', 'effectiveness', 'artifacts'],
      properties: {
        evaluation: {
          type: 'object',
          properties: {
            detectionTime: { type: 'string' },
            detectionMethod: { type: 'string' },
            detectionEffectiveness: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
            responseTime: { type: 'string' },
            responseEffectiveness: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
            resolutionTime: { type: 'string' },
            resolutionEffectiveness: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
            communicationEffectiveness: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
            runbooksUseful: { type: 'boolean' },
            rightExpertiseAvailable: { type: 'boolean' }
          }
        },
        whatWentWell: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        whatCouldImprove: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              description: { type: 'string' },
              potentialImprovement: { type: 'string' }
            }
          }
        },
        responseMetrics: {
          type: 'object',
          properties: {
            timeToDetect: { type: 'string' },
            timeToRespond: { type: 'string' },
            timeToMitigate: { type: 'string' },
            timeToResolve: { type: 'string' },
            respondersCount: { type: 'number' },
            escalations: { type: 'number' }
          }
        },
        effectiveness: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'response-evaluation', 'sre']
}));

// Task 7: Action Items Generation
export const actionItemsGenerationTask = defineTask('action-items-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate action items and remediation plan',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'remediation planner and technical program manager',
      task: 'Generate prioritized action items to prevent recurrence and improve resilience',
      context: args,
      instructions: [
        'Generate action items to address each root cause:',
        '  - Immediate fixes (stop the bleeding)',
        '  - Short-term mitigations (reduce likelihood)',
        '  - Long-term solutions (eliminate root cause)',
        'Generate action items for contributing factors:',
        '  - Add missing safeguards',
        '  - Improve monitoring and alerting',
        '  - Enhance testing and validation',
        '  - Update documentation and runbooks',
        'Generate action items from response evaluation:',
        '  - Improve detection mechanisms',
        '  - Enhance response procedures',
        '  - Provide training or knowledge sharing',
        '  - Improve tools and automation',
        'For each action item, specify:',
        '  - Clear description (what needs to be done)',
        '  - Rationale (why this is needed)',
        '  - Priority (critical, high, medium, low)',
        '  - Effort estimate (hours/days/weeks)',
        '  - Owner or responsible team',
        '  - Target completion date',
        '  - Success criteria (how to verify completion)',
        'Prioritize using impact vs. effort matrix',
        'Identify quick wins (high impact, low effort)',
        'Group related action items',
        'Sequence action items with dependencies',
        'Estimate overall remediation effort and timeline',
        'Save action items to output directory'
      ],
      outputFormat: 'JSON with actionItems (array), priorityBreakdown (object), effortEstimate (object), timeline (string), quickWins (array), criticalCount (number), highPriorityCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'priorityBreakdown', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              category: { type: 'string', enum: ['immediate', 'short-term', 'long-term', 'process-improvement', 'documentation'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['small', 'medium', 'large', 'extra-large'] },
              owner: { type: 'string' },
              targetDate: { type: 'string' },
              successCriteria: { type: 'string' },
              relatedRootCause: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        priorityBreakdown: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        effortEstimate: {
          type: 'object',
          properties: {
            totalEstimatedHours: { type: 'number' },
            byCategory: { type: 'object' },
            resourcesNeeded: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: { type: 'string' },
        quickWins: {
          type: 'array',
          items: { type: 'string' }
        },
        criticalCount: { type: 'number' },
        highPriorityCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'action-items', 'remediation']
}));

// Task 8: Lessons Learned Documentation
export const lessonsLearnedTask = defineTask('lessons-learned', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document lessons learned',
  agent: {
    name: 'knowledge-manager',
    prompt: {
      role: 'knowledge manager and organizational learning specialist',
      task: 'Extract and document lessons learned for organizational knowledge base',
      context: args,
      instructions: [
        'Identify key lessons learned:',
        '  - Technical lessons (architecture, infrastructure, code)',
        '  - Process lessons (procedures, workflows, policies)',
        '  - People lessons (training, communication, collaboration)',
        '  - Tool lessons (monitoring, automation, documentation)',
        'For each lesson, document:',
        '  - What we learned',
        '  - Why it matters',
        '  - How to apply it going forward',
        '  - Who should know about it',
        'Identify systemic patterns:',
        '  - Recurring issues across incidents',
        '  - Common failure modes',
        '  - Areas needing investment',
        'Extract best practices:',
        '  - What worked well during response',
        '  - Effective techniques and tools',
        '  - Successful communication patterns',
        'Identify anti-patterns to avoid:',
        '  - What made things worse',
        '  - Ineffective approaches',
        '  - Common mistakes',
        'Connect to organizational priorities:',
        '  - Reliability improvements needed',
        '  - Technical debt to address',
        '  - Capability gaps to fill',
        'Make lessons actionable and shareable',
        'Save lessons learned to output directory'
      ],
      outputFormat: 'JSON with lessons (array), systemicPatterns (array), bestPractices (array), antiPatterns (array), organizationalInsights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lessons', 'bestPractices', 'artifacts'],
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['technical', 'process', 'people', 'tools'] },
              lesson: { type: 'string' },
              whyItMatters: { type: 'string' },
              howToApply: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        systemicPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        bestPractices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              context: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        antiPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              antiPattern: { type: 'string' },
              whyProblematic: { type: 'string' },
              alternative: { type: 'string' }
            }
          }
        },
        organizationalInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              actionNeeded: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'lessons-learned', 'knowledge-management']
}));

// Task 9: Post-Mortem Assembly
export const postMortemAssemblyTask = defineTask('post-mortem-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble blameless post-mortem document',
  agent: {
    name: 'post-mortem-writer',
    prompt: {
      role: 'technical writer and SRE documentation specialist',
      task: 'Assemble comprehensive blameless post-mortem document',
      context: args,
      instructions: [
        'Create post-mortem document structure:',
        '  1. Executive Summary',
        '  2. Incident Overview',
        '  3. Impact Assessment',
        '  4. Timeline',
        '  5. Root Cause Analysis',
        '  6. Contributing Factors',
        '  7. What Went Well',
        '  8. What Could Be Improved',
        '  9. Action Items',
        '  10. Lessons Learned',
        '  11. Appendices (logs, metrics, references)',
        'Write Executive Summary (1 paragraph):',
        '  - What happened (high-level)',
        '  - Impact (users affected, downtime)',
        '  - Root cause (simplified)',
        '  - Key action items (top 3)',
        'Write Incident Overview:',
        '  - Incident ID, title, severity',
        '  - Detection time and method',
        '  - Resolution time',
        '  - Affected services',
        '  - Responders and incident commander',
        'Include Impact Assessment section with metrics and business impact',
        'Include Timeline section (if available)',
        'Write Root Cause Analysis section:',
        '  - Clear description of root cause(s)',
        '  - Evidence and supporting data',
        '  - 5 Whys analysis',
        '  - Fishbone diagram',
        'Document Contributing Factors',
        'Include "What Went Well" section (positive reinforcement)',
        'Include "What Could Be Improved" section',
        'Present Action Items in table format with priorities',
        'Include Lessons Learned section',
        'Apply blameless post-mortem principles:',
        '  - Focus on systems and processes, not individuals',
        '  - Use passive voice or system-focused language',
        '  - Avoid assigning blame or calling out people',
        '  - Emphasize learning and improvement',
        '  - Assume good intentions and reasonable decisions',
        'Use clear, professional language',
        'Add diagrams and visualizations',
        'Ensure document is searchable and referenceable',
        'Save complete post-mortem to output directory'
      ],
      outputFormat: 'JSON with postMortemDocument (complete markdown), sections (array of section names), executiveSummary (string), estimatedPages (number), wordCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['postMortemDocument', 'sections', 'executiveSummary', 'artifacts'],
      properties: {
        postMortemDocument: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        estimatedPages: { type: 'number' },
        wordCount: { type: 'number' },
        diagramsIncluded: { type: 'array', items: { type: 'string' } },
        blamelessCompliance: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'post-mortem', 'documentation']
}));

// Task 10: Post-Mortem Quality Validation
export const postMortemQualityValidationTask = defineTask('post-mortem-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate post-mortem quality and completeness',
  agent: {
    name: 'post-mortem-auditor',
    prompt: {
      role: 'SRE principal and post-mortem quality auditor',
      task: 'Assess post-mortem quality, completeness, and adherence to blameless principles',
      context: args,
      instructions: [
        'Evaluate completeness (weight: 30%):',
        '  - Are all required sections present?',
        '  - Is impact assessment thorough?',
        '  - Is root cause clearly identified?',
        '  - Are action items specific and actionable?',
        'Evaluate clarity and accuracy (weight: 25%):',
        '  - Is timeline accurate and detailed?',
        '  - Is root cause analysis sound?',
        '  - Are conclusions supported by evidence?',
        '  - Is writing clear and unambiguous?',
        'Evaluate actionability (weight: 20%):',
        '  - Are action items well-defined?',
        '  - Are priorities appropriate?',
        '  - Are owners and deadlines assigned?',
        '  - Are success criteria clear?',
        'Evaluate blameless culture adherence (weight: 15%):',
        '  - Is language blameless and constructive?',
        '  - Focus on systems not individuals?',
        '  - Are cognitive biases avoided?',
        '  - Is learning emphasized over blame?',
        'Evaluate learning value (weight: 10%):',
        '  - Are lessons clearly articulated?',
        '  - Can others learn from this?',
        '  - Are insights generalizable?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Flag any blameful language or personal attribution',
        'Provide specific improvement recommendations',
        'Assess readiness for publication'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), blamelessViolations (array), recommendations (array), publicationReady (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarityAccuracy: { type: 'number' },
            actionability: { type: 'number' },
            blamelessAdherence: { type: 'number' },
            learningValue: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasExecutiveSummary: { type: 'boolean' },
            hasTimeline: { type: 'boolean' },
            hasImpactAssessment: { type: 'boolean' },
            hasRootCause: { type: 'boolean' },
            hasActionItems: { type: 'boolean' },
            hasLessonsLearned: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        blamelessViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              issue: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        publicationReady: { type: 'boolean' },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'quality-validation', 'audit']
}));

// Task 11: Post-Mortem Review
export const postMortemReviewTask = defineTask('post-mortem-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct team review of post-mortem',
  agent: {
    name: 'post-mortem-facilitator',
    prompt: {
      role: 'post-mortem meeting facilitator and SRE lead',
      task: 'Facilitate team review meeting and gather feedback on post-mortem',
      context: args,
      instructions: [
        'Simulate post-mortem review meeting',
        'Review post-mortem completeness and accuracy',
        'Verify timeline accuracy with responders',
        'Confirm root cause analysis is sound',
        'Validate action items are appropriate',
        'Gather feedback from reviewers:',
        '  - Incident responders',
        '  - Service owners',
        '  - SRE team members',
        '  - Engineering leadership',
        'Check for blameless culture adherence:',
        '  - Flag any language that assigns personal blame',
        '  - Ensure focus on systems and learning',
        '  - Verify psychological safety is maintained',
        'Document feedback and concerns',
        'Identify critical revisions needed',
        'Determine if post-mortem is ready for publication',
        'Recommend approval or revisions',
        'Document review outcome and action items'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), blamelessViolations (number), revisionsNeeded (boolean), revisionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              comment: { type: 'string' },
              category: { type: 'string', enum: ['accuracy', 'completeness', 'blameless', 'action-items', 'general'] },
              severity: { type: 'string', enum: ['minor', 'major', 'critical'] }
            }
          }
        },
        blamelessViolations: { type: 'number' },
        revisionsNeeded: { type: 'boolean' },
        revisionItems: { type: 'array', items: { type: 'string' } },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'review', 'team-collaboration']
}));

// Task 12: Post-Mortem Publishing
export const postMortemPublishingTask = defineTask('post-mortem-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize and publish post-mortem',
  agent: {
    name: 'post-mortem-publisher',
    prompt: {
      role: 'documentation publisher and knowledge base manager',
      task: 'Finalize post-mortem and publish to knowledge base',
      context: args,
      instructions: [
        'Finalize post-mortem document',
        'Add publication metadata:',
        '  - Publication date',
        '  - Document version',
        '  - Incident ID and severity',
        '  - Status (draft, published, archived)',
        'Generate multiple formats:',
        '  - Markdown (source)',
        '  - HTML (web viewing)',
        '  - PDF (archival)',
        'Publish to incident repository:',
        '  - Commit to version control',
        '  - Update incident index',
        '  - Tag with incident metadata',
        '  - Cross-reference related incidents',
        'Create incident summary (one-pager)',
        'Notify stakeholders of publication:',
        '  - Email to responders and stakeholders',
        '  - Slack/Teams announcement',
        '  - Add to knowledge base',
        '  - Schedule post-mortem learning session',
        'Update incident statistics and trends',
        'Archive raw data and logs',
        'Schedule action items review (30/60/90 days)',
        'Save publication report to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), formats (array), publicationDate (string), version (string), notificationsSent (array), actionItemsReviewDate (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'formats', 'publicationDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        formats: { type: 'array', items: { type: 'string' } },
        publicationDate: { type: 'string' },
        version: { type: 'string' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        incidentSummary: { type: 'string' },
        actionItemsReviewDate: { type: 'string' },
        knowledgeBaseUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'publishing', 'documentation']
}));

// Task 13: Action Items Tracking Setup
export const actionItemsTrackingTask = defineTask('action-items-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up action items tracking',
  agent: {
    name: 'project-coordinator',
    prompt: {
      role: 'technical project coordinator and tracking specialist',
      task: 'Set up tracking system for post-mortem action items',
      context: args,
      instructions: [
        'Create tracking entries for all action items',
        'Set up in project management system:',
        '  - Jira tickets',
        '  - GitHub issues',
        '  - Linear tasks',
        '  - Or other tracking system',
        'For each action item, create ticket with:',
        '  - Descriptive title',
        '  - Full description and rationale',
        '  - Priority label',
        '  - Owner assignment',
        '  - Due date',
        '  - Link to post-mortem document',
        '  - Related incident ID',
        '  - Success criteria as acceptance criteria',
        'Organize action items:',
        '  - Group by team or owner',
        '  - Create epic or milestone for incident',
        '  - Tag with incident ID and severity',
        '  - Set up dependencies between items',
        'Set up tracking dashboard:',
        '  - Action items by status',
        '  - Action items by priority',
        '  - Action items by owner',
        '  - Completion trend',
        'Schedule action items review meetings:',
        '  - 30-day review',
        '  - 60-day review',
        '  - 90-day review and close-out',
        'Create reminder system for overdue items',
        'Document tracking setup and links',
        'Save tracking information to output directory'
      ],
      outputFormat: 'JSON with trackingSystem (string), ticketsCreated (array), dashboardUrl (string), reviewSchedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingSystem', 'ticketsCreated', 'artifacts'],
      properties: {
        trackingSystem: { type: 'string' },
        ticketsCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ticketId: { type: 'string' },
              actionItemId: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        dashboardUrl: { type: 'string' },
        reviewSchedule: {
          type: 'object',
          properties: {
            thirtyDayReview: { type: 'string' },
            sixtyDayReview: { type: 'string' },
            ninetyDayReview: { type: 'string' }
          }
        },
        epicOrMilestone: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident', 'action-tracking', 'project-management']
}));
