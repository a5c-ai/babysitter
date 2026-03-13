/**
 * @process specializations/domains/business/human-resources/training-needs-analysis
 * @description Training Needs Analysis (TNA) Process - Systematic assessment of organizational, team, and individual skill
 * gaps through surveys, performance data analysis, and stakeholder interviews to prioritize learning investments.
 * @inputs { organizationName: string, analysisScope: string, departments: array, strategicPriorities: array }
 * @outputs { success: boolean, skillGaps: array, trainingPriorities: array, learningRecommendations: object, budgetEstimate: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/training-needs-analysis', {
 *   organizationName: 'TechCorp',
 *   analysisScope: 'organization-wide',
 *   departments: ['Engineering', 'Sales', 'Marketing'],
 *   strategicPriorities: ['Digital transformation', 'Leadership development', 'Customer experience']
 * });
 *
 * @references
 * - ATD Training Needs Assessment: https://www.td.org/insights/how-to-conduct-a-training-needs-assessment
 * - SHRM Training and Development: https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/traininganddevelopment.aspx
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    analysisScope = 'organization-wide',
    departments,
    strategicPriorities,
    includeCompetencyAssessment = true,
    includePerformanceData = true,
    includeSurveys = true,
    budgetConstraints = null,
    outputDir = 'tna-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Training Needs Analysis for ${organizationName}`);

  // Phase 1: Strategic Alignment Analysis
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    organizationName,
    strategicPriorities,
    departments,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  // Phase 2: Organizational Analysis
  const organizationalAnalysis = await ctx.task(organizationalAnalysisTask, {
    organizationName,
    departments,
    strategicAlignment,
    outputDir
  });

  artifacts.push(...organizationalAnalysis.artifacts);

  // Phase 3: Job/Role Analysis
  const roleAnalysis = await ctx.task(roleAnalysisTask, {
    organizationName,
    departments,
    outputDir
  });

  artifacts.push(...roleAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Role analysis complete. ${roleAnalysis.rolesAnalyzed} roles analyzed with competency requirements defined. Review before proceeding to gap assessment?`,
    title: 'Role Analysis Review',
    context: {
      runId: ctx.runId,
      rolesAnalyzed: roleAnalysis.rolesAnalyzed,
      competencyFramework: roleAnalysis.competencyFramework,
      criticalRoles: roleAnalysis.criticalRoles,
      files: roleAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Performance Data Analysis
  let performanceAnalysis = null;
  if (includePerformanceData) {
    performanceAnalysis = await ctx.task(performanceAnalysisTask, {
      organizationName,
      departments,
      outputDir
    });
    artifacts.push(...performanceAnalysis.artifacts);
  }

  // Phase 5: Skills Survey Administration
  let surveyResults = null;
  if (includeSurveys) {
    surveyResults = await ctx.task(surveyAdministrationTask, {
      organizationName,
      departments,
      roleAnalysis,
      outputDir
    });
    artifacts.push(...surveyResults.artifacts);
  }

  // Phase 6: Competency Assessment
  let competencyAssessment = null;
  if (includeCompetencyAssessment) {
    competencyAssessment = await ctx.task(competencyAssessmentTask, {
      organizationName,
      departments,
      roleAnalysis,
      surveyResults,
      outputDir
    });
    artifacts.push(...competencyAssessment.artifacts);
  }

  // Phase 7: Stakeholder Interviews
  const stakeholderInterviews = await ctx.task(stakeholderInterviewsTask, {
    organizationName,
    departments,
    strategicPriorities,
    outputDir
  });

  artifacts.push(...stakeholderInterviews.artifacts);

  // Phase 8: Gap Analysis
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    organizationName,
    roleAnalysis,
    performanceAnalysis,
    surveyResults,
    competencyAssessment,
    stakeholderInterviews,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Gap analysis complete. ${gapAnalysis.skillGaps.length} skill gaps identified. ${gapAnalysis.criticalGaps.length} critical gaps requiring immediate attention. Review gap analysis?`,
    title: 'Gap Analysis Review',
    context: {
      runId: ctx.runId,
      skillGaps: gapAnalysis.skillGaps,
      criticalGaps: gapAnalysis.criticalGaps,
      gapsByDepartment: gapAnalysis.gapsByDepartment,
      files: gapAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Training Solution Design
  const solutionDesign = await ctx.task(solutionDesignTask, {
    organizationName,
    skillGaps: gapAnalysis.skillGaps,
    criticalGaps: gapAnalysis.criticalGaps,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...solutionDesign.artifacts);

  // Phase 10: Prioritization and Roadmap
  const prioritization = await ctx.task(prioritizationTask, {
    organizationName,
    skillGaps: gapAnalysis.skillGaps,
    solutionDesign: solutionDesign.solutions,
    strategicPriorities,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // Phase 11: Budget and Resource Planning
  const budgetPlanning = await ctx.task(budgetPlanningTask, {
    organizationName,
    prioritization: prioritization.prioritizedInitiatives,
    solutionDesign: solutionDesign.solutions,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...budgetPlanning.artifacts);

  await ctx.breakpoint({
    question: `Training budget plan developed. Total estimated investment: ${budgetPlanning.totalBudget}. Review budget allocation before finalizing?`,
    title: 'Budget Plan Review',
    context: {
      runId: ctx.runId,
      totalBudget: budgetPlanning.totalBudget,
      budgetByCategory: budgetPlanning.budgetByCategory,
      budgetByDepartment: budgetPlanning.budgetByDepartment,
      files: budgetPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 12: TNA Report Generation
  const tnaReport = await ctx.task(tnaReportTask, {
    organizationName,
    analysisScope,
    strategicAlignment,
    organizationalAnalysis,
    roleAnalysis,
    gapAnalysis,
    solutionDesign,
    prioritization,
    budgetPlanning,
    outputDir
  });

  artifacts.push(...tnaReport.artifacts);

  return {
    success: true,
    organizationName,
    analysisScope,
    skillGaps: gapAnalysis.skillGaps,
    criticalGaps: gapAnalysis.criticalGaps,
    trainingPriorities: prioritization.prioritizedInitiatives,
    learningRecommendations: {
      solutions: solutionDesign.solutions,
      deliveryMethods: solutionDesign.deliveryMethods,
      timeline: prioritization.timeline
    },
    budgetEstimate: {
      total: budgetPlanning.totalBudget,
      byCategory: budgetPlanning.budgetByCategory,
      byDepartment: budgetPlanning.budgetByDepartment
    },
    reportPath: tnaReport.reportPath,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/training-needs-analysis',
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
      role: 'Learning Strategy Consultant',
      task: 'Align training needs analysis with strategic priorities',
      context: {
        organizationName: args.organizationName,
        strategicPriorities: args.strategicPriorities,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review organizational strategy',
        '2. Identify strategic skill requirements',
        '3. Map priorities to capabilities',
        '4. Identify future skill needs',
        '5. Assess industry trends',
        '6. Define strategic learning objectives',
        '7. Identify transformation initiatives',
        '8. Map technology requirements',
        '9. Define success metrics',
        '10. Document strategic context'
      ],
      outputFormat: 'JSON object with strategic alignment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strategicSkillNeeds', 'learningObjectives', 'artifacts'],
      properties: {
        strategicSkillNeeds: { type: 'array', items: { type: 'object' } },
        learningObjectives: { type: 'array', items: { type: 'object' } },
        futureCapabilities: { type: 'array', items: { type: 'string' } },
        industryTrends: { type: 'array', items: { type: 'object' } },
        transformationInitiatives: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'strategic-alignment']
}));

export const organizationalAnalysisTask = defineTask('organizational-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Organizational Analysis - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Organizational Development Analyst',
      task: 'Analyze organizational context for training needs',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        strategicAlignment: args.strategicAlignment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze organizational structure',
        '2. Review workforce demographics',
        '3. Assess organizational culture',
        '4. Identify change initiatives',
        '5. Review past training effectiveness',
        '6. Assess learning culture maturity',
        '7. Identify organizational constraints',
        '8. Review technology infrastructure',
        '9. Analyze employee engagement data',
        '10. Document organizational context'
      ],
      outputFormat: 'JSON object with organizational analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['organizationalContext', 'learningCultureMaturity', 'artifacts'],
      properties: {
        organizationalContext: { type: 'object' },
        workforceDemographics: { type: 'object' },
        learningCultureMaturity: { type: 'object' },
        changeInitiatives: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'string' } },
        pastTrainingEffectiveness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'organizational-analysis']
}));

export const roleAnalysisTask = defineTask('role-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Role Analysis - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Job Analysis Specialist',
      task: 'Analyze roles and define competency requirements',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify key roles by department',
        '2. Define job families',
        '3. Create competency framework',
        '4. Define technical competencies',
        '5. Define behavioral competencies',
        '6. Map competency levels',
        '7. Identify critical roles',
        '8. Define proficiency requirements',
        '9. Document role requirements',
        '10. Create competency matrix'
      ],
      outputFormat: 'JSON object with role analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rolesAnalyzed', 'competencyFramework', 'criticalRoles', 'artifacts'],
      properties: {
        rolesAnalyzed: { type: 'number' },
        competencyFramework: { type: 'object' },
        jobFamilies: { type: 'array', items: { type: 'object' } },
        criticalRoles: { type: 'array', items: { type: 'object' } },
        competencyMatrix: { type: 'object' },
        proficiencyRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'role-analysis']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Performance Data Analysis - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Analytics Specialist',
      task: 'Analyze performance data for training needs indicators',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Gather performance review data',
        '2. Analyze performance ratings distribution',
        '3. Identify performance gaps by role',
        '4. Review goal achievement data',
        '5. Analyze competency assessment results',
        '6. Identify common development areas',
        '7. Review productivity metrics',
        '8. Analyze quality metrics',
        '9. Identify high-performer patterns',
        '10. Document performance insights'
      ],
      outputFormat: 'JSON object with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceGaps', 'developmentAreas', 'artifacts'],
      properties: {
        performanceGaps: { type: 'array', items: { type: 'object' } },
        developmentAreas: { type: 'array', items: { type: 'object' } },
        ratingDistribution: { type: 'object' },
        goalAchievement: { type: 'object' },
        highPerformerPatterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'performance-analysis']
}));

export const surveyAdministrationTask = defineTask('survey-administration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Skills Survey - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Survey Administrator',
      task: 'Administer and analyze skills assessment surveys',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        roleAnalysis: args.roleAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design skills assessment survey',
        '2. Include self-assessment questions',
        '3. Include manager assessment',
        '4. Administer survey organization-wide',
        '5. Track response rates',
        '6. Analyze survey results',
        '7. Identify skill confidence levels',
        '8. Compare self vs manager assessments',
        '9. Generate survey insights',
        '10. Document survey findings'
      ],
      outputFormat: 'JSON object with survey results'
    },
    outputSchema: {
      type: 'object',
      required: ['surveyResults', 'responseRate', 'artifacts'],
      properties: {
        surveyResults: { type: 'object' },
        responseRate: { type: 'number' },
        selfAssessments: { type: 'object' },
        managerAssessments: { type: 'object' },
        skillConfidenceLevels: { type: 'object' },
        topDevelopmentNeeds: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'survey']
}));

export const competencyAssessmentTask = defineTask('competency-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Competency Assessment - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competency Assessment Specialist',
      task: 'Conduct competency assessments',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        roleAnalysis: args.roleAnalysis,
        surveyResults: args.surveyResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess current competency levels',
        '2. Compare to required proficiency',
        '3. Identify competency gaps',
        '4. Prioritize critical competencies',
        '5. Assess by department',
        '6. Assess by job family',
        '7. Identify emerging competencies',
        '8. Benchmark against industry',
        '9. Create competency heat map',
        '10. Document assessment results'
      ],
      outputFormat: 'JSON object with competency assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['competencyGaps', 'heatMap', 'artifacts'],
      properties: {
        competencyGaps: { type: 'array', items: { type: 'object' } },
        currentVsRequired: { type: 'object' },
        criticalCompetencyGaps: { type: 'array', items: { type: 'object' } },
        heatMap: { type: 'object' },
        industryBenchmarks: { type: 'object' },
        emergingCompetencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'competency-assessment']
}));

export const stakeholderInterviewsTask = defineTask('stakeholder-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Stakeholder Interviews - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst',
      task: 'Conduct stakeholder interviews for training needs',
      context: {
        organizationName: args.organizationName,
        departments: args.departments,
        strategicPriorities: args.strategicPriorities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify key stakeholders',
        '2. Design interview guide',
        '3. Conduct executive interviews',
        '4. Conduct manager interviews',
        '5. Conduct focus groups',
        '6. Capture qualitative insights',
        '7. Identify hidden training needs',
        '8. Understand business context',
        '9. Synthesize interview findings',
        '10. Document stakeholder input'
      ],
      outputFormat: 'JSON object with stakeholder interview results'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewFindings', 'qualitativeInsights', 'artifacts'],
      properties: {
        interviewFindings: { type: 'array', items: { type: 'object' } },
        qualitativeInsights: { type: 'array', items: { type: 'object' } },
        executivePriorities: { type: 'array', items: { type: 'string' } },
        managerPerspectives: { type: 'array', items: { type: 'object' } },
        hiddenNeeds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'stakeholder-interviews']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Gap Analysis - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gap Analysis Specialist',
      task: 'Synthesize findings into comprehensive gap analysis',
      context: {
        organizationName: args.organizationName,
        roleAnalysis: args.roleAnalysis,
        performanceAnalysis: args.performanceAnalysis,
        surveyResults: args.surveyResults,
        competencyAssessment: args.competencyAssessment,
        stakeholderInterviews: args.stakeholderInterviews,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Synthesize all data sources',
        '2. Identify all skill gaps',
        '3. Categorize gaps by type',
        '4. Prioritize critical gaps',
        '5. Assess gap urgency',
        '6. Analyze gaps by department',
        '7. Identify systemic gaps',
        '8. Quantify gap impact',
        '9. Create gap summary',
        '10. Document gap analysis'
      ],
      outputFormat: 'JSON object with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['skillGaps', 'criticalGaps', 'gapsByDepartment', 'artifacts'],
      properties: {
        skillGaps: { type: 'array', items: { type: 'object' } },
        criticalGaps: { type: 'array', items: { type: 'object' } },
        gapsByDepartment: { type: 'object' },
        gapsByCategory: { type: 'object' },
        systemicGaps: { type: 'array', items: { type: 'object' } },
        gapImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'gap-analysis']
}));

export const solutionDesignTask = defineTask('solution-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Solution Design - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Solution Designer',
      task: 'Design training solutions for identified gaps',
      context: {
        organizationName: args.organizationName,
        skillGaps: args.skillGaps,
        criticalGaps: args.criticalGaps,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Match gaps to learning solutions',
        '2. Recommend delivery methods',
        '3. Design blended learning approaches',
        '4. Identify external training providers',
        '5. Recommend internal programs',
        '6. Design on-the-job learning',
        '7. Recommend coaching/mentoring',
        '8. Identify technology solutions',
        '9. Estimate solution costs',
        '10. Document solution recommendations'
      ],
      outputFormat: 'JSON object with solution design'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'deliveryMethods', 'artifacts'],
      properties: {
        solutions: { type: 'array', items: { type: 'object' } },
        deliveryMethods: { type: 'object' },
        blendedApproaches: { type: 'array', items: { type: 'object' } },
        externalProviders: { type: 'array', items: { type: 'object' } },
        internalPrograms: { type: 'array', items: { type: 'object' } },
        technologySolutions: { type: 'array', items: { type: 'object' } },
        solutionCosts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'solution-design']
}));

export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Prioritization - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Program Strategist',
      task: 'Prioritize training initiatives and create roadmap',
      context: {
        organizationName: args.organizationName,
        skillGaps: args.skillGaps,
        solutionDesign: args.solutionDesign,
        strategicPriorities: args.strategicPriorities,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply prioritization criteria',
        '2. Assess strategic alignment',
        '3. Evaluate business impact',
        '4. Consider urgency',
        '5. Assess feasibility',
        '6. Calculate ROI potential',
        '7. Create priority ranking',
        '8. Develop implementation timeline',
        '9. Create learning roadmap',
        '10. Document prioritization rationale'
      ],
      outputFormat: 'JSON object with prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedInitiatives', 'timeline', 'artifacts'],
      properties: {
        prioritizedInitiatives: { type: 'array', items: { type: 'object' } },
        priorityCriteria: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        learningRoadmap: { type: 'object' },
        roiProjections: { type: 'object' },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'prioritization']
}));

export const budgetPlanningTask = defineTask('budget-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Budget Planning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Budget Analyst',
      task: 'Develop training budget and resource plan',
      context: {
        organizationName: args.organizationName,
        prioritization: args.prioritization,
        solutionDesign: args.solutionDesign,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate total training investment',
        '2. Allocate budget by initiative',
        '3. Allocate budget by department',
        '4. Allocate budget by category',
        '5. Plan resource requirements',
        '6. Identify internal resources',
        '7. Plan vendor spend',
        '8. Create budget timeline',
        '9. Identify cost savings opportunities',
        '10. Document budget plan'
      ],
      outputFormat: 'JSON object with budget planning'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'budgetByCategory', 'budgetByDepartment', 'artifacts'],
      properties: {
        totalBudget: { type: 'number' },
        budgetByCategory: { type: 'object' },
        budgetByDepartment: { type: 'object' },
        budgetByInitiative: { type: 'array', items: { type: 'object' } },
        resourceRequirements: { type: 'object' },
        vendorSpend: { type: 'object' },
        costSavings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'budget-planning']
}));

export const tnaReportTask = defineTask('tna-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: TNA Report - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning Report Writer',
      task: 'Generate comprehensive TNA report',
      context: {
        organizationName: args.organizationName,
        analysisScope: args.analysisScope,
        strategicAlignment: args.strategicAlignment,
        organizationalAnalysis: args.organizationalAnalysis,
        roleAnalysis: args.roleAnalysis,
        gapAnalysis: args.gapAnalysis,
        solutionDesign: args.solutionDesign,
        prioritization: args.prioritization,
        budgetPlanning: args.budgetPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document methodology',
        '3. Present key findings',
        '4. Summarize skill gaps',
        '5. Present recommendations',
        '6. Include roadmap',
        '7. Present budget summary',
        '8. Add appendices',
        '9. Create visual charts',
        '10. Generate final report'
      ],
      outputFormat: 'JSON object with TNA report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        appendices: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'tna', 'report']
}));
