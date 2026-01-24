/**
 * @process business-strategy/okr-development
 * @description Implementation of Objectives and Key Results framework including goal setting, alignment, tracking, and review cycles
 * @inputs { organizationContext: object, strategicObjectives: array, teams: array, period: string, outputDir: string }
 * @outputs { success: boolean, okrHierarchy: object, alignmentMap: object, scoringFramework: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    strategicObjectives = [],
    teams = [],
    period = 'Q1',
    year = new Date().getFullYear(),
    outputDir = 'okr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OKR Development Process for ${period} ${year}`);

  // ============================================================================
  // PHASE 1: COMPANY-LEVEL OKR DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Developing company-level OKRs');
  const companyOkrs = await ctx.task(companyOkrsTask, {
    organizationContext,
    strategicObjectives,
    period,
    year,
    outputDir
  });

  artifacts.push(...companyOkrs.artifacts);

  // ============================================================================
  // PHASE 2: TEAM-LEVEL OKR CASCADING
  // ============================================================================

  ctx.log('info', 'Phase 2: Cascading OKRs to teams');
  const teamOkrs = await ctx.task(teamOkrsCascadeTask, {
    companyOkrs: companyOkrs.okrs,
    teams,
    period,
    outputDir
  });

  artifacts.push(...teamOkrs.artifacts);

  // ============================================================================
  // PHASE 3: ALIGNMENT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Validating OKR alignment');
  const alignmentValidation = await ctx.task(alignmentValidationTask, {
    companyOkrs: companyOkrs.okrs,
    teamOkrs: teamOkrs.okrs,
    outputDir
  });

  artifacts.push(...alignmentValidation.artifacts);

  // Breakpoint: Review OKR cascade
  await ctx.breakpoint({
    question: `OKR cascade complete. ${companyOkrs.okrs.length} company OKRs, ${teamOkrs.okrs.length} team OKRs. Alignment score: ${alignmentValidation.alignmentScore}%. Review before finalizing?`,
    title: 'OKR Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        companyObjectives: companyOkrs.okrs.length,
        teamObjectives: teamOkrs.okrs.length,
        alignmentScore: alignmentValidation.alignmentScore,
        alignmentGaps: alignmentValidation.gaps.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: OKR QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Scoring OKR quality');
  const qualityScoring = await ctx.task(okrQualityScoringTask, {
    companyOkrs: companyOkrs.okrs,
    teamOkrs: teamOkrs.okrs,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  // ============================================================================
  // PHASE 5: SCORING FRAMEWORK DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining scoring and tracking framework');
  const scoringFramework = await ctx.task(scoringFrameworkTask, {
    companyOkrs: companyOkrs.okrs,
    teamOkrs: teamOkrs.okrs,
    outputDir
  });

  artifacts.push(...scoringFramework.artifacts);

  // ============================================================================
  // PHASE 6: CHECK-IN CADENCE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up check-in cadence');
  const checkInCadence = await ctx.task(checkInCadenceTask, {
    companyOkrs: companyOkrs.okrs,
    teamOkrs: teamOkrs.okrs,
    period,
    outputDir
  });

  artifacts.push(...checkInCadence.artifacts);

  // ============================================================================
  // PHASE 7: COMMUNICATION AND TRANSPARENCY PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    companyOkrs: companyOkrs.okrs,
    teams,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE OKR DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating OKR documentation');
  const okrDocumentation = await ctx.task(okrDocumentationTask, {
    companyOkrs,
    teamOkrs,
    alignmentValidation,
    qualityScoring,
    scoringFramework,
    checkInCadence,
    communicationPlan,
    period,
    year,
    outputDir
  });

  artifacts.push(...okrDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    okrHierarchy: {
      company: companyOkrs.okrs,
      teams: teamOkrs.okrs
    },
    alignmentMap: alignmentValidation.alignmentMap,
    alignmentScore: alignmentValidation.alignmentScore,
    qualityScore: qualityScoring.overallScore,
    scoringFramework: scoringFramework.framework,
    checkInSchedule: checkInCadence.schedule,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/okr-development',
      timestamp: startTime,
      period,
      year
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Company OKRs
export const companyOkrsTask = defineTask('company-okrs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop company-level OKRs',
  agent: {
    name: 'okr-coach',
    prompt: {
      role: 'OKR coach and strategic planning expert',
      task: 'Develop company-level Objectives and Key Results',
      context: args,
      instructions: [
        'Develop 3-5 company-level Objectives:',
        '  - Aligned with strategic objectives',
        '  - Inspirational and ambitious',
        '  - Qualitative and memorable',
        '  - Time-bound to the period',
        'For each Objective, define 3-5 Key Results:',
        '  - Quantitative and measurable',
        '  - Specific with clear metrics',
        '  - Ambitious but achievable (70% confidence)',
        '  - Outcome-focused (not tasks)',
        'Ensure OKRs follow best practices:',
        '  - Objectives are "what" we want to achieve',
        '  - Key Results are "how" we measure success',
        'Save OKRs to output directory'
      ],
      outputFormat: 'JSON with okrs (array of objects with objective, keyResults array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['okrs', 'artifacts'],
      properties: {
        okrs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              category: { type: 'string' },
              keyResults: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    keyResult: { type: 'string' },
                    metric: { type: 'string' },
                    baseline: { type: 'string' },
                    target: { type: 'string' },
                    confidence: { type: 'number' }
                  }
                }
              }
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
  labels: ['agent', 'okr', 'company-level']
}));

// Task 2: Team OKRs Cascade
export const teamOkrsCascadeTask = defineTask('team-okrs-cascade', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cascade OKRs to teams',
  agent: {
    name: 'okr-facilitator',
    prompt: {
      role: 'OKR cascade facilitator',
      task: 'Cascade company OKRs to team-level OKRs',
      context: args,
      instructions: [
        'For each team, develop aligned OKRs:',
        '  - 2-4 Objectives per team',
        '  - Linked to company Key Results',
        '  - Team-specific and actionable',
        'Ensure cascade approaches:',
        '  - Direct cascade (team KR supports company KR)',
        '  - Shared OKRs (multiple teams contribute)',
        '  - Team-unique OKRs (team-specific priorities)',
        'Balance top-down and bottom-up:',
        '  - ~60% cascaded from company',
        '  - ~40% team-originated',
        'Save team OKRs to output directory'
      ],
      outputFormat: 'JSON with okrs (array of objects with team, objectives array, parentOkrs), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['okrs', 'artifacts'],
      properties: {
        okrs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              team: { type: 'string' },
              objectives: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    objective: { type: 'string' },
                    parentOkr: { type: 'string' },
                    keyResults: { type: 'array' }
                  }
                }
              }
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
  labels: ['agent', 'okr', 'team-cascade']
}));

// Task 3: Alignment Validation
export const alignmentValidationTask = defineTask('alignment-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate OKR alignment',
  agent: {
    name: 'alignment-analyst',
    prompt: {
      role: 'OKR alignment analyst',
      task: 'Validate vertical and horizontal alignment of OKRs',
      context: args,
      instructions: [
        'Validate vertical alignment:',
        '  - Each team OKR links to company OKR',
        '  - Key Results cascade appropriately',
        '  - No orphan objectives',
        'Validate horizontal alignment:',
        '  - Cross-team dependencies identified',
        '  - Shared OKRs properly coordinated',
        '  - No conflicting objectives',
        'Create alignment map visualization',
        'Calculate alignment score (0-100)',
        'Identify alignment gaps',
        'Save validation to output directory'
      ],
      outputFormat: 'JSON with alignmentMap (object), alignmentScore (number), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentMap', 'alignmentScore', 'gaps', 'artifacts'],
      properties: {
        alignmentMap: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        crossTeamDependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'alignment']
}));

// Task 4: OKR Quality Scoring
export const okrQualityScoringTask = defineTask('okr-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score OKR quality',
  agent: {
    name: 'quality-coach',
    prompt: {
      role: 'OKR quality coach',
      task: 'Score the quality of OKRs against best practices',
      context: args,
      instructions: [
        'Score each Objective (1-10):',
        '  - Inspirational and ambitious',
        '  - Clear and understandable',
        '  - Time-bound',
        '  - Actionable',
        'Score each Key Result (1-10):',
        '  - Quantitative and measurable',
        '  - Specific with clear metric',
        '  - Ambitious but achievable',
        '  - Outcome-focused',
        'Identify common anti-patterns:',
        '  - Tasks disguised as KRs',
        '  - Vague objectives',
        '  - Too many OKRs',
        '  - Binary (0/1) KRs',
        'Provide improvement suggestions',
        'Save scoring to output directory'
      ],
      outputFormat: 'JSON with scoring (object), overallScore (number), antiPatterns (array), improvements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        scoring: { type: 'object' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        antiPatterns: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'quality']
}));

// Task 5: Scoring Framework
export const scoringFrameworkTask = defineTask('scoring-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define scoring framework',
  agent: {
    name: 'measurement-designer',
    prompt: {
      role: 'OKR measurement framework designer',
      task: 'Define how OKRs will be scored and tracked',
      context: args,
      instructions: [
        'Define scoring methodology:',
        '  - Grading scale (0.0 - 1.0)',
        '  - Color coding (red/yellow/green)',
        '  - Scoring frequency',
        'Define aggregation rules:',
        '  - KR to Objective scoring',
        '  - Team to Company roll-up',
        '  - Weighting approach',
        'Set confidence intervals:',
        '  - 0.7-1.0 = Achieved',
        '  - 0.4-0.6 = Progress made',
        '  - 0.0-0.3 = Missed',
        'Define tracking tools and dashboards',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with framework (object with scoring, aggregation, thresholds), dashboardDesign (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            scoring: { type: 'object' },
            aggregation: { type: 'object' },
            thresholds: { type: 'object' }
          }
        },
        dashboardDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'scoring']
}));

// Task 6: Check-in Cadence
export const checkInCadenceTask = defineTask('check-in-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up check-in cadence',
  agent: {
    name: 'cadence-planner',
    prompt: {
      role: 'OKR cadence planner',
      task: 'Define the check-in and review cadence',
      context: args,
      instructions: [
        'Define check-in schedule:',
        '  - Weekly team check-ins',
        '  - Bi-weekly cross-team reviews',
        '  - Monthly company reviews',
        '  - Quarterly retrospectives',
        'Design check-in process:',
        '  - Status update format',
        '  - Confidence scoring',
        '  - Blocker identification',
        '  - Help requests',
        'Define retrospective process:',
        '  - Scoring and grading',
        '  - Lessons learned',
        '  - Next quarter planning',
        'Save cadence to output directory'
      ],
      outputFormat: 'JSON with schedule (object), checkInProcess (object), retrospectiveProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        checkInProcess: { type: 'object' },
        retrospectiveProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'cadence']
}));

// Task 7: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'OKR communication planner',
      task: 'Create plan for OKR transparency and communication',
      context: args,
      instructions: [
        'Define transparency approach:',
        '  - What is public (all OKRs)',
        '  - What is private (if any)',
        '  - Access and visibility rules',
        'Plan launch communication:',
        '  - All-hands announcement',
        '  - Team-level introductions',
        '  - Training and enablement',
        'Define ongoing communication:',
        '  - Progress updates',
        '  - Success celebrations',
        '  - Miss acknowledgments',
        'Save plan to output directory'
      ],
      outputFormat: 'JSON with transparencyApproach (object), launchPlan (object), ongoingCommunication (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transparencyApproach', 'artifacts'],
      properties: {
        transparencyApproach: { type: 'object' },
        launchPlan: { type: 'object' },
        ongoingCommunication: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'communication']
}));

// Task 8: OKR Documentation
export const okrDocumentationTask = defineTask('okr-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate OKR documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'OKR documentation specialist',
      task: 'Generate comprehensive OKR documentation',
      context: args,
      instructions: [
        'Create OKR summary document:',
        '  - Company OKRs with context',
        '  - Team OKRs by department',
        '  - Alignment visualization',
        'Include operational guides:',
        '  - OKR writing guidelines',
        '  - Scoring guidelines',
        '  - Check-in templates',
        'Create reference materials:',
        '  - OKR glossary',
        '  - FAQ',
        '  - Best practices',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), summaryDocument (string), operationalGuides (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        summaryDocument: { type: 'string' },
        operationalGuides: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'okr', 'documentation']
}));
