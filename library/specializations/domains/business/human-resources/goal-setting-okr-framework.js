/**
 * @process specializations/domains/business/human-resources/goal-setting-okr-framework
 * @description Goal Setting and OKR Framework Process - Implementation of SMART goals or OKR (Objectives and Key Results)
 * cascading from organizational strategy to individual objectives with progress tracking and alignment reviews.
 * @inputs { organizationName: string, planningPeriod: string, strategicObjectives: array, departments: array }
 * @outputs { success: boolean, okrFramework: object, cascadedGoals: object, alignmentScore: number, trackingDashboard: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/goal-setting-okr-framework', {
 *   organizationName: 'TechCorp',
 *   planningPeriod: 'Q1 2024',
 *   strategicObjectives: ['Increase market share', 'Improve customer satisfaction', 'Launch new product'],
 *   departments: ['Engineering', 'Sales', 'Marketing', 'Product']
 * });
 *
 * @references
 * - Measure What Matters by John Doerr: https://www.whatmatters.com/
 * - BetterWorks OKR Best Practices: https://www.betterworks.com/okr-best-practices/
 * - Google Re:Work Goal Setting: https://rework.withgoogle.com/guides/set-goals-with-okrs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    planningPeriod,
    strategicObjectives,
    departments,
    goalFramework = 'okr', // 'okr' or 'smart'
    cascadingLevels = ['company', 'department', 'team', 'individual'],
    reviewCadence = 'quarterly',
    includeStretchGoals = true,
    outputDir = 'okr-framework-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Goal Setting and OKR Framework for ${organizationName} - ${planningPeriod}`);

  // Phase 1: Strategic Alignment Analysis
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    organizationName,
    planningPeriod,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  await ctx.breakpoint({
    question: `Strategic alignment analysis complete. ${strategicAlignment.alignedObjectives.length} objectives identified. Review strategic context before creating OKRs?`,
    title: 'Strategic Alignment Review',
    context: {
      runId: ctx.runId,
      strategicObjectives,
      alignedObjectives: strategicAlignment.alignedObjectives,
      strategicPriorities: strategicAlignment.strategicPriorities,
      files: strategicAlignment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Company-Level OKR Development
  const companyOkrs = await ctx.task(companyOkrTask, {
    organizationName,
    planningPeriod,
    strategicObjectives: strategicAlignment.alignedObjectives,
    goalFramework,
    includeStretchGoals,
    outputDir
  });

  artifacts.push(...companyOkrs.artifacts);

  await ctx.breakpoint({
    question: `Company-level OKRs developed: ${companyOkrs.objectives.length} objectives with ${companyOkrs.totalKeyResults} key results. Review and approve?`,
    title: 'Company OKR Review',
    context: {
      runId: ctx.runId,
      objectives: companyOkrs.objectives,
      keyResultsSummary: companyOkrs.keyResultsSummary,
      stretchTargets: companyOkrs.stretchTargets,
      files: companyOkrs.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Department-Level OKR Cascading
  const departmentOkrs = await ctx.task(departmentOkrTask, {
    organizationName,
    planningPeriod,
    companyOkrs: companyOkrs.objectives,
    departments,
    goalFramework,
    outputDir
  });

  artifacts.push(...departmentOkrs.artifacts);

  // Phase 4: Team-Level OKR Development
  const teamOkrs = await ctx.task(teamOkrTask, {
    organizationName,
    planningPeriod,
    departmentOkrs: departmentOkrs.departmentOkrs,
    goalFramework,
    outputDir
  });

  artifacts.push(...teamOkrs.artifacts);

  // Phase 5: Individual Goal Alignment
  const individualGoals = await ctx.task(individualGoalTask, {
    organizationName,
    planningPeriod,
    teamOkrs: teamOkrs.teamOkrs,
    goalFramework,
    outputDir
  });

  artifacts.push(...individualGoals.artifacts);

  // Phase 6: Alignment Validation
  const alignmentValidation = await ctx.task(alignmentValidationTask, {
    organizationName,
    companyOkrs: companyOkrs.objectives,
    departmentOkrs: departmentOkrs.departmentOkrs,
    teamOkrs: teamOkrs.teamOkrs,
    individualGoals: individualGoals.goals,
    outputDir
  });

  artifacts.push(...alignmentValidation.artifacts);

  await ctx.breakpoint({
    question: `Goal alignment validation complete. Alignment score: ${alignmentValidation.alignmentScore}%. ${alignmentValidation.gaps.length} alignment gaps identified. Review alignment report?`,
    title: 'Alignment Validation Review',
    context: {
      runId: ctx.runId,
      alignmentScore: alignmentValidation.alignmentScore,
      gaps: alignmentValidation.gaps,
      recommendations: alignmentValidation.recommendations,
      files: alignmentValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Key Results Measurement Setup
  const measurementSetup = await ctx.task(measurementSetupTask, {
    organizationName,
    companyOkrs: companyOkrs.objectives,
    departmentOkrs: departmentOkrs.departmentOkrs,
    teamOkrs: teamOkrs.teamOkrs,
    outputDir
  });

  artifacts.push(...measurementSetup.artifacts);

  // Phase 8: Progress Tracking System Design
  const trackingSystem = await ctx.task(trackingSystemTask, {
    organizationName,
    planningPeriod,
    reviewCadence,
    measurementSetup: measurementSetup.measurements,
    outputDir
  });

  artifacts.push(...trackingSystem.artifacts);

  // Phase 9: Check-in and Review Process Design
  const reviewProcess = await ctx.task(reviewProcessTask, {
    organizationName,
    planningPeriod,
    reviewCadence,
    cascadingLevels,
    outputDir
  });

  artifacts.push(...reviewProcess.artifacts);

  // Phase 10: Training and Communication Plan
  const trainingPlan = await ctx.task(trainingCommunicationTask, {
    organizationName,
    goalFramework,
    cascadingLevels,
    departments,
    outputDir
  });

  artifacts.push(...trainingPlan.artifacts);

  // Phase 11: OKR Software Configuration
  const softwareConfig = await ctx.task(softwareConfigTask, {
    organizationName,
    companyOkrs: companyOkrs.objectives,
    departmentOkrs: departmentOkrs.departmentOkrs,
    trackingSystem: trackingSystem.system,
    outputDir
  });

  artifacts.push(...softwareConfig.artifacts);

  // Phase 12: Launch and Rollout Plan
  const rolloutPlan = await ctx.task(rolloutPlanTask, {
    organizationName,
    planningPeriod,
    departments,
    trainingPlan: trainingPlan.plan,
    softwareConfig: softwareConfig.config,
    outputDir
  });

  artifacts.push(...rolloutPlan.artifacts);

  return {
    success: true,
    organizationName,
    planningPeriod,
    goalFramework,
    okrFramework: {
      companyOkrs: companyOkrs.objectives,
      totalCompanyKeyResults: companyOkrs.totalKeyResults,
      departmentOkrs: departmentOkrs.departmentOkrs,
      teamOkrs: teamOkrs.teamOkrs,
      individualGoalCount: individualGoals.totalGoals
    },
    cascadedGoals: {
      companyLevel: companyOkrs.objectives.length,
      departmentLevel: departmentOkrs.totalOkrs,
      teamLevel: teamOkrs.totalOkrs,
      individualLevel: individualGoals.totalGoals
    },
    alignmentScore: alignmentValidation.alignmentScore,
    alignmentGaps: alignmentValidation.gaps,
    trackingDashboard: trackingSystem.dashboard,
    measurementFramework: measurementSetup.measurements,
    reviewProcess: reviewProcess.process,
    trainingPlan: trainingPlan.plan,
    rolloutPlan: rolloutPlan.plan,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/goal-setting-okr-framework',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Strategic Alignment - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Planning Consultant',
      task: 'Analyze strategic objectives for OKR alignment',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        strategicObjectives: args.strategicObjectives,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review organizational strategy',
        '2. Identify strategic priorities',
        '3. Map strategic themes',
        '4. Define success outcomes',
        '5. Identify key focus areas',
        '6. Assess current capabilities',
        '7. Identify strategic gaps',
        '8. Prioritize objectives',
        '9. Define strategic bets',
        '10. Create strategy-to-OKR mapping'
      ],
      outputFormat: 'JSON object with strategic alignment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['alignedObjectives', 'strategicPriorities', 'artifacts'],
      properties: {
        alignedObjectives: { type: 'array', items: { type: 'object' } },
        strategicPriorities: { type: 'array', items: { type: 'object' } },
        strategicThemes: { type: 'array', items: { type: 'string' } },
        focusAreas: { type: 'array', items: { type: 'string' } },
        strategyMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'strategic-alignment']
}));

export const companyOkrTask = defineTask('company-okr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Company OKRs - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Coach',
      task: 'Develop company-level OKRs',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        strategicObjectives: args.strategicObjectives,
        goalFramework: args.goalFramework,
        includeStretchGoals: args.includeStretchGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Draft 3-5 company objectives',
        '2. Ensure objectives are inspirational and qualitative',
        '3. Create 3-5 key results per objective',
        '4. Ensure key results are measurable and quantitative',
        '5. Define baseline and target metrics',
        '6. Include stretch goals (0.7 = success)',
        '7. Validate objective-KR alignment',
        '8. Check for overlap and gaps',
        '9. Assign objective owners',
        '10. Create OKR documentation'
      ],
      outputFormat: 'JSON object with company OKRs'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'totalKeyResults', 'artifacts'],
      properties: {
        objectives: { type: 'array', items: { type: 'object' } },
        totalKeyResults: { type: 'number' },
        keyResultsSummary: { type: 'array', items: { type: 'object' } },
        stretchTargets: { type: 'array', items: { type: 'object' } },
        objectiveOwners: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'company-goals']
}));

export const departmentOkrTask = defineTask('department-okr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Department OKRs - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Facilitator',
      task: 'Cascade OKRs to department level',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        companyOkrs: args.companyOkrs,
        departments: args.departments,
        goalFramework: args.goalFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map company OKRs to departments',
        '2. Identify department contributions',
        '3. Draft department objectives',
        '4. Create supporting key results',
        '5. Ensure vertical alignment',
        '6. Check horizontal dependencies',
        '7. Assign department owners',
        '8. Set department-specific metrics',
        '9. Identify cross-functional OKRs',
        '10. Document cascading rationale'
      ],
      outputFormat: 'JSON object with department OKRs'
    },
    outputSchema: {
      type: 'object',
      required: ['departmentOkrs', 'totalOkrs', 'artifacts'],
      properties: {
        departmentOkrs: { type: 'array', items: { type: 'object' } },
        totalOkrs: { type: 'number' },
        alignmentMapping: { type: 'object' },
        crossFunctionalOkrs: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'department-goals']
}));

export const teamOkrTask = defineTask('team-okr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Team OKRs - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Team Coach',
      task: 'Cascade OKRs to team level',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        departmentOkrs: args.departmentOkrs,
        goalFramework: args.goalFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify teams within departments',
        '2. Map department OKRs to teams',
        '3. Draft team objectives',
        '4. Create team key results',
        '5. Ensure alignment with department',
        '6. Include team-specific goals',
        '7. Balance contributing vs. local OKRs',
        '8. Assign team leads as owners',
        '9. Set operational metrics',
        '10. Document team OKR rationale'
      ],
      outputFormat: 'JSON object with team OKRs'
    },
    outputSchema: {
      type: 'object',
      required: ['teamOkrs', 'totalOkrs', 'artifacts'],
      properties: {
        teamOkrs: { type: 'array', items: { type: 'object' } },
        totalOkrs: { type: 'number' },
        teamMapping: { type: 'object' },
        contributingOkrs: { type: 'array', items: { type: 'object' } },
        localOkrs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'team-goals']
}));

export const individualGoalTask = defineTask('individual-goal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Individual Goals - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Coach',
      task: 'Align individual goals with team OKRs',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        teamOkrs: args.teamOkrs,
        goalFramework: args.goalFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define individual goal framework',
        '2. Map team OKRs to individual contributions',
        '3. Create goal setting templates',
        '4. Include development goals',
        '5. Balance performance and growth',
        '6. Set SMART individual goals',
        '7. Link to team key results',
        '8. Include learning objectives',
        '9. Set individual milestones',
        '10. Document goal-setting guidelines'
      ],
      outputFormat: 'JSON object with individual goal framework'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'totalGoals', 'artifacts'],
      properties: {
        goals: { type: 'object' },
        totalGoals: { type: 'number' },
        goalTemplates: { type: 'array', items: { type: 'object' } },
        developmentGoals: { type: 'object' },
        guidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'individual-goals']
}));

export const alignmentValidationTask = defineTask('alignment-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Alignment Validation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Alignment Analyst',
      task: 'Validate goal alignment across all levels',
      context: {
        organizationName: args.organizationName,
        companyOkrs: args.companyOkrs,
        departmentOkrs: args.departmentOkrs,
        teamOkrs: args.teamOkrs,
        individualGoals: args.individualGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Trace alignment from company to individual',
        '2. Identify alignment gaps',
        '3. Check for orphan goals',
        '4. Validate contribution coverage',
        '5. Assess horizontal alignment',
        '6. Identify conflicting goals',
        '7. Calculate alignment score',
        '8. Flag misaligned objectives',
        '9. Recommend alignment fixes',
        '10. Create alignment visualization'
      ],
      outputFormat: 'JSON object with alignment validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScore', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        alignmentScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        orphanGoals: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        alignmentVisualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'alignment']
}));

export const measurementSetupTask = defineTask('measurement-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Measurement Setup - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metrics Specialist',
      task: 'Set up key results measurement framework',
      context: {
        organizationName: args.organizationName,
        companyOkrs: args.companyOkrs,
        departmentOkrs: args.departmentOkrs,
        teamOkrs: args.teamOkrs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define measurement methods for each KR',
        '2. Identify data sources',
        '3. Set baseline measurements',
        '4. Define target thresholds',
        '5. Create scoring methodology',
        '6. Set up automated tracking',
        '7. Define update frequency',
        '8. Create data collection process',
        '9. Set up leading indicators',
        '10. Document measurement standards'
      ],
      outputFormat: 'JSON object with measurement setup'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'artifacts'],
      properties: {
        measurements: { type: 'array', items: { type: 'object' } },
        dataSources: { type: 'object' },
        baselines: { type: 'object' },
        scoringMethodology: { type: 'object' },
        automatedTracking: { type: 'array', items: { type: 'object' } },
        leadingIndicators: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'measurement']
}));

export const trackingSystemTask = defineTask('tracking-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Tracking System - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Platform Specialist',
      task: 'Design OKR progress tracking system',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        reviewCadence: args.reviewCadence,
        measurementSetup: args.measurementSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design tracking dashboard',
        '2. Create progress visualization',
        '3. Set up confidence scoring',
        '4. Define status indicators (on track, at risk, off track)',
        '5. Create alert mechanisms',
        '6. Design drill-down views',
        '7. Set up reporting templates',
        '8. Create comparison views',
        '9. Define archiving process',
        '10. Document system usage'
      ],
      outputFormat: 'JSON object with tracking system design'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'dashboard', 'artifacts'],
      properties: {
        system: { type: 'object' },
        dashboard: { type: 'object' },
        statusIndicators: { type: 'object' },
        alertMechanisms: { type: 'array', items: { type: 'object' } },
        reportingTemplates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'tracking']
}));

export const reviewProcessTask = defineTask('review-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Review Process - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Program Manager',
      task: 'Design OKR check-in and review process',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        reviewCadence: args.reviewCadence,
        cascadingLevels: args.cascadingLevels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design weekly check-in process',
        '2. Create monthly review format',
        '3. Design quarterly grading process',
        '4. Define retrospective format',
        '5. Create calibration sessions',
        '6. Set up 1:1 OKR discussions',
        '7. Design team OKR reviews',
        '8. Create executive review format',
        '9. Define cycle close process',
        '10. Document review best practices'
      ],
      outputFormat: 'JSON object with review process design'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'artifacts'],
      properties: {
        process: { type: 'object' },
        weeklyCheckIn: { type: 'object' },
        monthlyReview: { type: 'object' },
        quarterlyGrading: { type: 'object' },
        retrospective: { type: 'object' },
        calibrationSessions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'review-process']
}));

export const trainingCommunicationTask = defineTask('training-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Training and Communication - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Develop OKR training and communication plan',
      context: {
        organizationName: args.organizationName,
        goalFramework: args.goalFramework,
        cascadingLevels: args.cascadingLevels,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design OKR fundamentals training',
        '2. Create writing good OKRs workshop',
        '3. Develop manager OKR coaching guide',
        '4. Create employee OKR guide',
        '5. Design launch communication plan',
        '6. Create FAQ documentation',
        '7. Develop video tutorials',
        '8. Create quick reference guides',
        '9. Design ongoing support resources',
        '10. Plan champion network'
      ],
      outputFormat: 'JSON object with training and communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        trainingModules: { type: 'array', items: { type: 'object' } },
        communicationPlan: { type: 'array', items: { type: 'object' } },
        supportResources: { type: 'array', items: { type: 'string' } },
        championNetwork: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'training']
}));

export const softwareConfigTask = defineTask('software-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Software Configuration - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OKR Platform Administrator',
      task: 'Configure OKR software platform',
      context: {
        organizationName: args.organizationName,
        companyOkrs: args.companyOkrs,
        departmentOkrs: args.departmentOkrs,
        trackingSystem: args.trackingSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select OKR platform (Lattice, 15Five, BetterWorks)',
        '2. Configure organization structure',
        '3. Set up user roles and permissions',
        '4. Configure OKR templates',
        '5. Set up integrations (HRIS, Slack)',
        '6. Configure notifications',
        '7. Set up reporting dashboards',
        '8. Configure review cycles',
        '9. Test platform functionality',
        '10. Document admin procedures'
      ],
      outputFormat: 'JSON object with software configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        platformSelection: { type: 'object' },
        organizationSetup: { type: 'object' },
        integrations: { type: 'array', items: { type: 'object' } },
        adminProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'software']
}));

export const rolloutPlanTask = defineTask('rollout-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Rollout Plan - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Specialist',
      task: 'Create OKR program launch and rollout plan',
      context: {
        organizationName: args.organizationName,
        planningPeriod: args.planningPeriod,
        departments: args.departments,
        trainingPlan: args.trainingPlan,
        softwareConfig: args.softwareConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define rollout phases',
        '2. Create launch timeline',
        '3. Plan pilot program',
        '4. Define success criteria',
        '5. Create communication calendar',
        '6. Plan executive sponsorship',
        '7. Schedule training sessions',
        '8. Define support model',
        '9. Plan iteration and improvement',
        '10. Create long-term sustainability plan'
      ],
      outputFormat: 'JSON object with rollout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        rolloutPhases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'array', items: { type: 'object' } },
        pilotProgram: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        sustainabilityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'okr', 'rollout']
}));
