/**
 * @process specializations/qa-testing-automation/exploratory-testing
 * @description Exploratory Testing Session Framework - Establish structured exploratory testing with session-based testing,
 * charter definition, note-taking templates, findings management, and coverage tracking using heuristics and testing tours.
 * @category Exploratory Testing
 * @priority Medium
 * @complexity Low
 * @inputs { applicationFeatures: array, teamMembers: array, sessionDuration?: number, testingTechniques?: array, bugTrackingSystem?: string }
 * @outputs { success: boolean, chartersExecuted: number, findingsCount: number, coverageScore: number, sessionsCompleted: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/exploratory-testing', {
 *   applicationFeatures: ['User Management', 'Payment Processing', 'Search', 'Dashboard'],
 *   teamMembers: [
 *     { name: 'Alice', role: 'QA Engineer', experience: 'senior' },
 *     { name: 'Bob', role: 'Developer', experience: 'mid' }
 *   ],
 *   sessionDuration: 90,
 *   testingTechniques: ['SFDPOT', 'tours', 'heuristics'],
 *   bugTrackingSystem: 'Jira',
 *   qualityTargets: { minSessionsPerFeature: 2, criticalFindingsExpected: 5 }
 * });
 *
 * @references
 * - Session-Based Test Management: http://www.satisfice.com/sbtm/
 * - Exploratory Testing Explained: https://www.ministryoftesting.com/dojo/lessons/exploratory-testing-explained
 * - SFDPOT Heuristic: https://developsense.com/blog/2012/07/few-hiccupps-and-sfdpot/
 * - Testing Tours: https://www.satisfice.com/blog/archives/1220
 * - Heuristic Test Strategy Model: https://www.satisfice.com/tools/htsm.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationFeatures = [],
    teamMembers = [],
    sessionDuration = 90, // minutes
    testingTechniques = ['SFDPOT', 'tours', 'heuristics'],
    bugTrackingSystem = 'GitHub Issues',
    qualityTargets = {
      minSessionsPerFeature: 2,
      criticalFindingsExpected: 3,
      coverageThreshold: 75
    },
    outputDir = 'exploratory-testing-output',
    timeBoxTotal = 0 // total hours available, 0 = ongoing
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let chartersExecuted = 0;
  let findingsCount = 0;
  let coverageScore = 0;

  ctx.log('info', `Starting Exploratory Testing Session Framework for ${applicationFeatures.length} features`);
  ctx.log('info', `Team: ${teamMembers.length} members, Session duration: ${sessionDuration} minutes`);

  // ============================================================================
  // PHASE 1: CHARTER CREATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating test charters for exploration sessions');

  const charterCreation = await ctx.task(charterCreationTask, {
    applicationFeatures,
    testingTechniques,
    qualityTargets,
    sessionDuration,
    outputDir
  });

  if (!charterCreation.success || charterCreation.charters.length === 0) {
    return {
      success: false,
      error: 'Failed to create test charters',
      details: charterCreation,
      metadata: {
        processId: 'specializations/qa-testing-automation/exploratory-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...charterCreation.artifacts);

  // Quality Gate: Minimum charters coverage
  if (charterCreation.charters.length < applicationFeatures.length * qualityTargets.minSessionsPerFeature) {
    await ctx.breakpoint({
      question: `Only ${charterCreation.charters.length} charters created for ${applicationFeatures.length} features. Minimum recommended: ${applicationFeatures.length * qualityTargets.minSessionsPerFeature}. Review and approve to continue?`,
      title: 'Charter Coverage Review',
      context: {
        runId: ctx.runId,
        chartersCreated: charterCreation.charters.length,
        features: applicationFeatures,
        recommendedCharters: applicationFeatures.length * qualityTargets.minSessionsPerFeature,
        charters: charterCreation.charters.map(c => ({ id: c.id, mission: c.mission, area: c.area })),
        files: charterCreation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: SESSION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Planning and scheduling exploratory testing sessions');

  const sessionPlanning = await ctx.task(sessionPlanningTask, {
    charters: charterCreation.charters,
    teamMembers,
    sessionDuration,
    timeBoxTotal,
    outputDir
  });

  artifacts.push(...sessionPlanning.artifacts);

  await ctx.checkpoint({
    title: 'Phase 2: Session Planning Complete',
    message: `${sessionPlanning.scheduledSessions.length} sessions scheduled across ${teamMembers.length} team members`,
    context: {
      runId: ctx.runId,
      scheduledSessions: sessionPlanning.scheduledSessions.length,
      teamUtilization: sessionPlanning.teamUtilization,
      estimatedCompletionTime: sessionPlanning.estimatedCompletionTime,
      files: sessionPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: TESTING TECHNIQUES TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 3: Training team on exploratory testing techniques');

  const techniquesTraining = await ctx.task(testingTechniquesTrainingTask, {
    testingTechniques,
    teamMembers,
    outputDir
  });

  artifacts.push(...techniquesTraining.artifacts);

  // Quality Gate: Team training completion
  const trainingCompletionRate = (techniquesTraining.teamMembersTrained / teamMembers.length) * 100;
  if (trainingCompletionRate < 80) {
    await ctx.breakpoint({
      question: `Team training completion: ${trainingCompletionRate.toFixed(0)}%. Only ${techniquesTraining.teamMembersTrained}/${teamMembers.length} members trained. Minimum 80% required. Continue or extend training?`,
      title: 'Training Completion Review',
      context: {
        runId: ctx.runId,
        trainingCompletionRate,
        teamMembersTrained: techniquesTraining.teamMembersTrained,
        totalMembers: teamMembers.length,
        techniquesC overed: techniquesTraining.techniquesCovered,
        recommendation: 'Ensure all team members understand SFDPOT, tours, and heuristics before sessions',
        files: techniquesTraining.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: NOTE-TAKING TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating session note-taking templates');

  const noteTemplates = await ctx.task(noteTemplatesCreationTask, {
    sessionDuration,
    testingTechniques,
    bugTrackingSystem,
    outputDir
  });

  artifacts.push(...noteTemplates.artifacts);

  await ctx.checkpoint({
    title: 'Phase 4: Note-Taking Templates Ready',
    message: `${noteTemplates.templatesCreated.length} templates created for session documentation`,
    context: {
      runId: ctx.runId,
      templates: noteTemplates.templatesCreated,
      files: noteTemplates.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: SESSION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting time-boxed exploratory testing sessions');

  const sessionExecution = await ctx.task(sessionExecutionTask, {
    scheduledSessions: sessionPlanning.scheduledSessions,
    charters: charterCreation.charters,
    noteTemplates: noteTemplates.templatesCreated,
    teamMembers,
    sessionDuration,
    bugTrackingSystem,
    outputDir
  });

  artifacts.push(...sessionExecution.artifacts);
  chartersExecuted = sessionExecution.sessionsCompleted;

  // Quality Gate: Session completion rate
  const sessionCompletionRate = (sessionExecution.sessionsCompleted / sessionPlanning.scheduledSessions.length) * 100;
  if (sessionCompletionRate < 90) {
    await ctx.breakpoint({
      question: `Session completion rate: ${sessionCompletionRate.toFixed(0)}%. ${sessionExecution.sessionsCompleted}/${sessionPlanning.scheduledSessions.length} sessions completed. Review incomplete sessions?`,
      title: 'Session Execution Review',
      context: {
        runId: ctx.runId,
        completionRate: sessionCompletionRate,
        sessionsCompleted: sessionExecution.sessionsCompleted,
        totalScheduled: sessionPlanning.scheduledSessions.length,
        incompleteSessions: sessionExecution.incompleteSessions,
        files: sessionExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: FINDINGS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting and logging findings');

  const findingsDocumentation = await ctx.task(findingsDocumentationTask, {
    sessionResults: sessionExecution.sessionResults,
    bugTrackingSystem,
    qualityTargets,
    outputDir
  });

  artifacts.push(...findingsDocumentation.artifacts);
  findingsCount = findingsDocumentation.totalFindings;

  // Quality Gate: Critical findings threshold
  const criticalFindings = findingsDocumentation.findingsBySeverity.critical || 0;
  if (criticalFindings > qualityTargets.criticalFindingsExpected * 2) {
    await ctx.breakpoint({
      question: `High number of critical findings: ${criticalFindings} (expected ~${qualityTargets.criticalFindingsExpected}). This may indicate quality issues. Review findings and decide next steps?`,
      title: 'Critical Findings Alert',
      context: {
        runId: ctx.runId,
        criticalFindings,
        expectedCritical: qualityTargets.criticalFindingsExpected,
        totalFindings: findingsCount,
        findingsBySeverity: findingsDocumentation.findingsBySeverity,
        topIssues: findingsDocumentation.topIssueCategories,
        recommendation: 'Consider additional testing or development iteration',
        files: findingsDocumentation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DEBRIEF SESSIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Conducting debrief sessions with team');

  const debriefSessions = await ctx.task(debriefSessionsTask, {
    sessionResults: sessionExecution.sessionResults,
    findings: findingsDocumentation.allFindings,
    teamMembers,
    charters: charterCreation.charters,
    outputDir
  });

  artifacts.push(...debriefSessions.artifacts);

  await ctx.checkpoint({
    title: 'Phase 7: Debrief Sessions Complete',
    message: `${debriefSessions.debriefsConducted} debriefs completed with key insights captured`,
    context: {
      runId: ctx.runId,
      debriefsConducted: debriefSessions.debriefsConducted,
      keyInsights: debriefSessions.keyInsights,
      lessonsLearned: debriefSessions.lessonsLearned,
      files: debriefSessions.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: COVERAGE TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 8: Tracking exploratory testing coverage');

  const coverageTracking = await ctx.task(coverageTrackingTask, {
    applicationFeatures,
    sessionResults: sessionExecution.sessionResults,
    charters: charterCreation.charters,
    qualityTargets,
    outputDir
  });

  artifacts.push(...coverageTracking.artifacts);
  coverageScore = coverageTracking.overallCoverageScore;

  // Quality Gate: Coverage threshold
  if (coverageScore < qualityTargets.coverageThreshold) {
    await ctx.breakpoint({
      question: `Exploratory coverage score: ${coverageScore}%. Target: ${qualityTargets.coverageThreshold}%. Below threshold. Schedule additional sessions or accept coverage?`,
      title: 'Coverage Threshold Review',
      context: {
        runId: ctx.runId,
        coverageScore,
        targetCoverage: qualityTargets.coverageThreshold,
        uncoveredAreas: coverageTracking.uncoveredAreas,
        coverageByFeature: coverageTracking.coverageByFeature,
        recommendation: 'Additional sessions recommended for uncovered areas',
        files: coverageTracking.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: FINAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Conducting final assessment of exploratory testing framework');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    charterCreation,
    sessionPlanning,
    techniquesTraining,
    sessionExecution,
    findingsDocumentation,
    debriefSessions,
    coverageTracking,
    qualityTargets,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Exploratory testing complete: ${chartersExecuted} charters, ${findingsCount} findings, ${coverageScore}% coverage`);

  // Final Breakpoint: Framework Review
  await ctx.breakpoint({
    question: `Exploratory Testing Session Framework Complete. ${chartersExecuted} charters executed, ${findingsCount} findings logged, ${coverageScore}% coverage achieved. Approve framework for ongoing use?`,
    title: 'Final Exploratory Testing Framework Review',
    context: {
      runId: ctx.runId,
      summary: {
        chartersExecuted,
        findingsCount,
        coverageScore,
        sessionsCompleted: sessionExecution.sessionsCompleted,
        teamMembersTrained: techniquesTraining.teamMembersTrained,
        criticalFindings: findingsDocumentation.findingsBySeverity.critical || 0,
        debriefsConducted: debriefSessions.debriefsConducted
      },
      qualityTargets,
      assessment: finalAssessment.assessment,
      recommendation: finalAssessment.recommendation,
      nextSteps: finalAssessment.nextSteps,
      files: [
        { path: finalAssessment.frameworkDocPath, format: 'markdown', label: 'Framework Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: coverageTracking.coverageHeatMapPath, format: 'html', label: 'Coverage Heat Map' },
        { path: findingsDocumentation.findingsReportPath, format: 'json', label: 'Findings Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    chartersExecuted,
    findingsCount,
    coverageScore,
    sessionsCompleted: sessionExecution.sessionResults.map(s => ({
      charterId: s.charterId,
      tester: s.tester,
      duration: s.actualDuration,
      findingsCount: s.findingsCount,
      coverageAreas: s.areasExplored
    })),
    findings: {
      total: findingsCount,
      bySeverity: findingsDocumentation.findingsBySeverity,
      byCategory: findingsDocumentation.findingsByCategory,
      topIssues: findingsDocumentation.topIssueCategories
    },
    coverage: {
      overallScore: coverageScore,
      byFeature: coverageTracking.coverageByFeature,
      uncoveredAreas: coverageTracking.uncoveredAreas,
      heatMapPath: coverageTracking.coverageHeatMapPath
    },
    team: {
      membersTrained: techniquesTraining.teamMembersTrained,
      totalMembers: teamMembers.length,
      trainingCompletionRate: (techniquesTraining.teamMembersTrained / teamMembers.length) * 100,
      debriefsConducted: debriefSessions.debriefsConducted
    },
    qualityGates: {
      charterCoverageMet: chartersExecuted >= applicationFeatures.length * qualityTargets.minSessionsPerFeature,
      sessionCompletionMet: sessionCompletionRate >= 90,
      trainingCompletionMet: trainingCompletionRate >= 80,
      coverageThresholdMet: coverageScore >= qualityTargets.coverageThreshold,
      criticalFindingsReasonable: criticalFindings <= qualityTargets.criticalFindingsExpected * 2
    },
    artifacts,
    documentation: {
      frameworkDocPath: finalAssessment.frameworkDocPath,
      charterLibraryPath: charterCreation.charterLibraryPath,
      templateLibraryPath: noteTemplates.templateLibraryPath,
      findingsReportPath: findingsDocumentation.findingsReportPath,
      debriefSummaryPath: debriefSessions.debriefSummaryPath
    },
    finalAssessment: {
      assessment: finalAssessment.assessment,
      recommendation: finalAssessment.recommendation,
      frameworkReadiness: finalAssessment.frameworkReadiness,
      nextSteps: finalAssessment.nextSteps,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/exploratory-testing',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Charter Creation
export const charterCreationTask = defineTask('charter-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Test Charter Creation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA Analyst and Exploratory Testing Expert',
      task: 'Create comprehensive test charters for exploratory testing sessions',
      context: {
        applicationFeatures: args.applicationFeatures,
        testingTechniques: args.testingTechniques,
        qualityTargets: args.qualityTargets,
        sessionDuration: args.sessionDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each application feature, create 2-3 test charters with different focus areas',
        '2. Define charter mission statement (what to explore and why)',
        '3. Specify test areas and scope (boundaries of exploration)',
        '4. List relevant testing techniques to apply (SFDPOT, tours, heuristics)',
        '5. Define charter objectives and expected outcomes',
        '6. Identify potential risks and areas of concern',
        '7. Suggest test data and environment requirements',
        '8. Create charter templates following Session-Based Test Management (SBTM) format',
        '9. Organize charters by priority (critical, high, medium, low)',
        '10. Generate charter library with searchable metadata'
      ],
      outputFormat: 'JSON with test charters and charter library'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'charters', 'charterLibraryPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        charters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              mission: { type: 'string', description: 'Charter mission statement' },
              area: { type: 'string', description: 'Feature or area to explore' },
              scope: { type: 'array', items: { type: 'string' }, description: 'Exploration boundaries' },
              techniques: { type: 'array', items: { type: 'string' }, description: 'Testing techniques to apply' },
              objectives: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimatedDuration: { type: 'number', description: 'Minutes' },
              testDataNeeded: { type: 'array', items: { type: 'string' } },
              environmentRequirements: { type: 'array', items: { type: 'string' } }
            }
          },
          minItems: 2
        },
        chartersByPriority: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        charterLibraryPath: { type: 'string', description: 'Path to charter library document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'charter-creation', 'test-planning']
}));

// Phase 2: Session Planning
export const sessionPlanningTask = defineTask('session-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Session Planning and Scheduling',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Coordinator and Session Planning Specialist',
      task: 'Plan and schedule exploratory testing sessions across team members',
      context: {
        charters: args.charters,
        teamMembers: args.teamMembers,
        sessionDuration: args.sessionDuration,
        timeBoxTotal: args.timeBoxTotal,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze charter priorities and dependencies',
        '2. Assess team member skills and experience levels',
        '3. Assign charters to appropriate team members based on expertise',
        '4. Schedule sessions with time-boxing (default 90-minute sessions)',
        '5. Balance workload across team members',
        '6. Group related charters for efficiency',
        '7. Plan for session diversity (mix of new and experienced testers)',
        '8. Create session calendar with clear assignments',
        '9. Calculate estimated completion time',
        '10. Generate session planning report with schedule'
      ],
      outputFormat: 'JSON with scheduled sessions and planning details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scheduledSessions', 'teamUtilization', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scheduledSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              charterId: { type: 'string' },
              assignedTo: { type: 'string', description: 'Team member name' },
              scheduledDate: { type: 'string' },
              duration: { type: 'number', description: 'Minutes' },
              priority: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        teamUtilization: {
          type: 'object',
          description: 'Session count by team member'
        },
        estimatedCompletionTime: { type: 'string', description: 'Total estimated time' },
        sessionCalendarPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'session-planning', 'resource-allocation']
}));

// Phase 3: Testing Techniques Training
export const testingTechniquesTrainingTask = defineTask('testing-techniques-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Testing Techniques Training',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Testing Coach and Training Specialist',
      task: 'Train team on exploratory testing techniques and heuristics',
      context: {
        testingTechniques: args.testingTechniques,
        teamMembers: args.teamMembers,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create training materials for SFDPOT heuristic (Structure, Function, Data, Platform, Operations, Time)',
        '2. Develop content on Testing Tours (Guidebook, Intellectual, FedEx, Money, Landmark, etc.)',
        '3. Document exploratory testing heuristics (Consistency, Boundary, Goldilocks, etc.)',
        '4. Create practical exercises and examples for each technique',
        '5. Design quick reference guides and cheat sheets',
        '6. Develop video tutorials or walkthroughs',
        '7. Create technique selection guide (when to use which technique)',
        '8. Build practice scenarios for hands-on learning',
        '9. Generate training certification checklist',
        '10. Document training completion and assessment'
      ],
      outputFormat: 'JSON with training materials and completion status'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'techniquesCovered', 'teamMembersTrained', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        techniquesCovered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              description: { type: 'string' },
              whenToUse: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              trainingMaterialPath: { type: 'string' }
            }
          }
        },
        teamMembersTrained: { type: 'number' },
        trainingCompletionByMember: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              techniquesCompleted: { type: 'array', items: { type: 'string' } },
              certificationStatus: { type: 'string', enum: ['certified', 'in-progress', 'not-started'] }
            }
          }
        },
        quickReferenceGuides: { type: 'array', items: { type: 'string' } },
        practiceScenarios: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'training', 'techniques']
}));

// Phase 4: Note-Taking Templates Creation
export const noteTemplatesCreationTask = defineTask('note-templates-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Session Note-Taking Templates Creation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist and Testing Process Designer',
      task: 'Create comprehensive session note-taking templates for exploratory testing',
      context: {
        sessionDuration: args.sessionDuration,
        testingTechniques: args.testingTechniques,
        bugTrackingSystem: args.bugTrackingSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Session-Based Test Management (SBTM) note template',
        '2. Include sections: Charter, Start/End Time, Tester, Test Notes, Bugs, Issues, Questions',
        '3. Add structured fields for duration tracking',
        '4. Create sections for: Areas Explored, Areas Not Explored, Observations',
        '5. Include technique tracking (which techniques were used)',
        '6. Add severity/priority classification for findings',
        '7. Create bug report template linking to bug tracking system',
        '8. Design session debrief template',
        '9. Create markdown and JSON formats for easy parsing',
        '10. Generate template library with examples'
      ],
      outputFormat: 'JSON with template details and paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'templatesCreated', 'templateLibraryPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        templatesCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              templateType: { type: 'string', enum: ['session-note', 'bug-report', 'debrief', 'observation'] },
              format: { type: 'string', enum: ['markdown', 'json', 'both'] },
              templatePath: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } },
              usage: { type: 'string' }
            }
          }
        },
        templateLibraryPath: { type: 'string' },
        exampleFilledTemplates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'documentation', 'templates']
}));

// Phase 5: Session Execution
export const sessionExecutionTask = defineTask('session-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Exploratory Testing Session Execution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer and Exploratory Testing Practitioner',
      task: 'Conduct time-boxed exploratory testing sessions following charters',
      context: {
        scheduledSessions: args.scheduledSessions,
        charters: args.charters,
        noteTemplates: args.noteTemplates,
        teamMembers: args.teamMembers,
        sessionDuration: args.sessionDuration,
        bugTrackingSystem: args.bugTrackingSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each scheduled session, execute exploratory testing following the charter',
        '2. Apply appropriate testing techniques (SFDPOT, tours, heuristics)',
        '3. Explore application areas within charter scope',
        '4. Document observations, bugs, questions, and issues in real-time',
        '5. Take screenshots or screen recordings of findings',
        '6. Track time spent on different activities',
        '7. Note areas explored vs not explored',
        '8. Identify unexpected behaviors and edge cases',
        '9. Record session metrics (duration, coverage, findings)',
        '10. Generate session reports with completed note templates'
      ],
      outputFormat: 'JSON with session execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sessionsCompleted', 'sessionResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sessionsCompleted: { type: 'number' },
        sessionResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              charterId: { type: 'string' },
              tester: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              actualDuration: { type: 'number', description: 'Minutes' },
              techniquesUsed: { type: 'array', items: { type: 'string' } },
              areasExplored: { type: 'array', items: { type: 'string' } },
              areasNotExplored: { type: 'array', items: { type: 'string' } },
              findingsCount: { type: 'number' },
              bugsFound: { type: 'number' },
              observations: { type: 'array', items: { type: 'string' } },
              questions: { type: 'array', items: { type: 'string' } },
              sessionNotePath: { type: 'string' },
              screenshots: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        incompleteSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        totalTestingTime: { type: 'number', description: 'Total minutes' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'session-execution', 'testing']
}));

// Phase 6: Findings Documentation
export const findingsDocumentationTask = defineTask('findings-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Findings Documentation and Bug Logging',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and Defect Management Specialist',
      task: 'Document and log all findings from exploratory testing sessions',
      context: {
        sessionResults: args.sessionResults,
        bugTrackingSystem: args.bugTrackingSystem,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate all findings from completed sessions',
        '2. Categorize findings: bugs, usability issues, questions, observations, improvements',
        '3. Classify bug severity: critical, high, medium, low',
        '4. Classify bug priority: P0, P1, P2, P3',
        '5. Create detailed bug reports with reproduction steps',
        '6. Log bugs to bug tracking system with proper categorization',
        '7. Identify patterns and recurring issues',
        '8. Create findings summary report',
        '9. Generate metrics: findings per session, severity distribution, category distribution',
        '10. Create actionable findings report for development team'
      ],
      outputFormat: 'JSON with documented findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalFindings', 'findingsBySeverity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalFindings: { type: 'number' },
        allFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              type: { type: 'string', enum: ['bug', 'usability', 'question', 'observation', 'improvement'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
              title: { type: 'string' },
              description: { type: 'string' },
              reproductionSteps: { type: 'array', items: { type: 'string' } },
              sessionId: { type: 'string' },
              tester: { type: 'string' },
              area: { type: 'string' },
              bugTrackingId: { type: 'string' },
              screenshots: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        findingsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        findingsByCategory: {
          type: 'object',
          properties: {
            bug: { type: 'number' },
            usability: { type: 'number' },
            question: { type: 'number' },
            observation: { type: 'number' },
            improvement: { type: 'number' }
          }
        },
        topIssueCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              count: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        findingsReportPath: { type: 'string' },
        bugReportsPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'findings', 'bug-tracking']
}));

// Phase 7: Debrief Sessions
export const debriefSessionsTask = defineTask('debrief-sessions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Debrief Sessions and Knowledge Sharing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Lead and Facilitation Expert',
      task: 'Conduct debrief sessions to review findings and share knowledge',
      context: {
        sessionResults: args.sessionResults,
        findings: args.findings,
        teamMembers: args.teamMembers,
        charters: args.charters,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Schedule debrief sessions with team and stakeholders',
        '2. Review each exploratory session outcomes',
        '3. Discuss key findings and their implications',
        '4. Share testing techniques that were effective',
        '5. Identify areas that need more exploration',
        '6. Discuss blockers and challenges encountered',
        '7. Capture lessons learned and best practices',
        '8. Generate action items from debriefs',
        '9. Document team insights and recommendations',
        '10. Create debrief summary report'
      ],
      outputFormat: 'JSON with debrief results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'debriefsConducted', 'keyInsights', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        debriefsConducted: { type: 'number' },
        keyInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'string', description: 'Which session or tester' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              actionable: { type: 'boolean' }
            }
          }
        },
        lessonsLearned: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lesson: { type: 'string' },
              category: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        areasNeedingMoreExploration: { type: 'array', items: { type: 'string' } },
        effectiveTechniques: { type: 'array', items: { type: 'string' } },
        blockers: { type: 'array', items: { type: 'string' } },
        debriefSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'debrief', 'knowledge-sharing']
}));

// Phase 8: Coverage Tracking
export const coverageTrackingTask = defineTask('coverage-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Exploratory Testing Coverage Tracking',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Coverage Analyst',
      task: 'Track and visualize exploratory testing coverage across application features',
      context: {
        applicationFeatures: args.applicationFeatures,
        sessionResults: args.sessionResults,
        charters: args.charters,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map session coverage to application features',
        '2. Calculate coverage percentage by feature',
        '3. Identify high-coverage areas (well explored)',
        '4. Identify low-coverage or uncovered areas',
        '5. Create coverage heat map visualization',
        '6. Track coverage by testing technique',
        '7. Analyze coverage vs risk/priority',
        '8. Generate coverage gap analysis',
        '9. Provide recommendations for additional coverage',
        '10. Create interactive coverage dashboard'
      ],
      outputFormat: 'JSON with coverage metrics and visualization paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallCoverageScore', 'coverageByFeature', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallCoverageScore: { type: 'number', minimum: 0, maximum: 100 },
        coverageByFeature: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              coveragePercentage: { type: 'number' },
              sessionsCount: { type: 'number' },
              techniquesUsed: { type: 'array', items: { type: 'string' } },
              areasExplored: { type: 'array', items: { type: 'string' } },
              areasNotExplored: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        uncoveredAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              feature: { type: 'string' },
              risk: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        coverageByTechnique: {
          type: 'object',
          description: 'Coverage percentage by testing technique used'
        },
        coverageHeatMapPath: { type: 'string', description: 'Path to coverage heat map visualization' },
        coverageGapAnalysis: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'coverage', 'analytics']
}));

// Phase 9: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Final Framework Assessment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Director and Process Assessment Expert',
      task: 'Conduct final assessment of exploratory testing framework effectiveness',
      context: {
        charterCreation: args.charterCreation,
        sessionPlanning: args.sessionPlanning,
        techniquesTraining: args.techniquesTraining,
        sessionExecution: args.sessionExecution,
        findingsDocumentation: args.findingsDocumentation,
        debriefSessions: args.debriefSessions,
        coverageTracking: args.coverageTracking,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate framework completeness and effectiveness',
        '2. Assess charter quality and coverage',
        '3. Evaluate session execution efficiency',
        '4. Analyze findings quality and actionability',
        '5. Assess team adoption and satisfaction',
        '6. Evaluate coverage adequacy',
        '7. Measure framework ROI (bugs found vs time invested)',
        '8. Identify framework strengths and weaknesses',
        '9. Provide recommendations for improvement',
        '10. Generate comprehensive assessment report with metrics'
      ],
      outputFormat: 'JSON with assessment results and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'frameworkReadiness', 'recommendation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: { type: 'string', description: 'Overall assessment narrative' },
        frameworkReadiness: { type: 'string', enum: ['production-ready', 'needs-improvement', 'not-ready'] },
        metrics: {
          type: 'object',
          properties: {
            charterQualityScore: { type: 'number', minimum: 0, maximum: 100 },
            sessionEfficiencyScore: { type: 'number', minimum: 0, maximum: 100 },
            findingsQualityScore: { type: 'number', minimum: 0, maximum: 100 },
            teamAdoptionScore: { type: 'number', minimum: 0, maximum: 100 },
            coverageAdequacyScore: { type: 'number', minimum: 0, maximum: 100 },
            overallFrameworkScore: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        threats: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              owner: { type: 'string' }
            }
          }
        },
        roi: {
          type: 'object',
          properties: {
            bugsFoundPerHour: { type: 'number' },
            costPerBugFound: { type: 'string' },
            valueGenerated: { type: 'string' }
          }
        },
        frameworkDocPath: { type: 'string', description: 'Complete framework documentation' },
        metricsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exploratory-testing', 'assessment', 'metrics']
}));

// Quality gates for the overall process
export const qualityGates = {
  charterCoverage: {
    description: 'All features have multiple test charters',
    threshold: 2,
    metric: 'chartersPerFeature'
  },
  sessionCompletion: {
    description: 'Scheduled sessions are completed',
    threshold: 90,
    metric: 'sessionCompletionRate'
  },
  teamTraining: {
    description: 'Team members trained on exploratory techniques',
    threshold: 80,
    metric: 'trainingCompletionRate'
  },
  coverageAdequacy: {
    description: 'Exploratory coverage meets threshold',
    threshold: 75,
    metric: 'coverageScore'
  },
  findingsDocumentation: {
    description: 'All findings properly documented',
    threshold: 100,
    metric: 'findingsDocumentationRate'
  }
};

// Estimated duration: 3-5 days setup + ongoing sessions
export const estimatedDuration = {
  setup: '3-5 days',
  ongoing: 'continuous',
  sessionDuration: '90 minutes',
  totalSessionsRecommended: '10-20 sessions for comprehensive coverage'
};
